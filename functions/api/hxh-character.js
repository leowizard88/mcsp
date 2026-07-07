const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });
const clean = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
const bearer = request => {
  const auth = request.headers.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return request.headers.get('x-mancuspie-token') || '';
};
const getUserByToken = async (env, token) => {
  if (!env.CHAT_MESSAGES || !token) return null;
  const session = await env.CHAT_MESSAGES.get(`auth:session:${token}`, 'json').catch(() => null);
  if (!session?.userId) return null;
  return await env.CHAT_MESSAGES.get(`auth:user:${session.userId}`, 'json').catch(() => null);
};
const routes = { Sperduto:['Masadora'], Masadora:['Antokiba','Foresta Oscura'], Antokiba:['Masadora','Rubicuta','Dorias'], Rubicuta:['Dorias','Antokiba','Aiai'], Dorias:['Rubicuta','Antokiba'], Aiai:['Rubicuta'], 'Foresta Oscura':['Bunzen','Masadora'], Bunzen:['Foresta Oscura','Soufrabi'], Soufrabi:['Bunzen'], Limeiro:[] };
const allowedPlaces = new Set(Object.keys(routes));
const PARAMS = ['forza','robustezza','nen','intelligenza','malizia','agilita','oratoria','percezione'];
const healthBase = { testa:5, corpo:8, braccioDx:6, braccioSx:6, gambaDx:7, gambaSx:7 };
const characterKey = user => `hxh:character:${user.id}`;
const clampInt = (value, min = 0, max = 999999) => Math.max(min, Math.min(max, Math.floor(Number(value) || 0)));
const nextXpFor = level => {
  let needed = 10;
  for (let i = 1; i < clampInt(level, 1); i++) needed += Math.ceil(needed / 2);
  return needed;
};
const blankParams = () => Object.fromEntries(PARAMS.map(k => [k, 0]));
const healthPart = (base, robustezza, level) => {
  const r = clampInt(robustezza);
  const byRobustezza = r === 0 ? base : r === 1 ? base + 4 : base * r;
  const byLevel = Math.ceil(base / 2) * Math.max(0, clampInt(level, 1) - 1);
  return byRobustezza + byLevel;
};
const derivedStats = character => {
  const params = { ...blankParams(), ...(character.params || {}) };
  const level = clampInt(character.level, 1);
  const salute = Object.fromEntries(Object.entries(healthBase).map(([k, base]) => [k, healthPart(base, params.robustezza, level)]));
  const saluteGenerale = Math.ceil(Object.values(salute).reduce((a,b) => a + b, 0) / Object.values(salute).length);
  return { generali:{ livello:level, esperienza:clampInt(character.xp), prossimoLivello:nextXpFor(level), puntiParametro:clampInt(character.paramPoints), puntiSetup:clampInt(character.setupPoints), energia:3 + ((level - 1) * 2), saluteGenerale, nen:1 + (clampInt(params.nen) * 4) }, salute };
};
const normalizeCharacter = value => {
  if (!value) return null;
  const level = clampInt(value.level || 1, 1);
  const params = { ...blankParams(), ...(value.params || {}) };
  const character = { ...value, level, xp:clampInt(value.xp), nextXp:nextXpFor(level), paramPoints:clampInt(value.paramPoints), setupPoints:clampInt(value.setupPoints), params, location:value.location || 'Sperduto' };
  character.ready = character.setupPoints <= 0;
  character.stats = derivedStats(character);
  return character;
};
const publicCharacter = value => {
  const c = normalizeCharacter(value);
  return c ? { userId:c.userId, username:c.username, nome:c.nome, cognome:c.cognome, level:c.level, location:c.location, ready:c.ready, createdAt:c.createdAt, updatedAt:c.updatedAt } : null;
};
const ownCharacter = value => {
  const c = normalizeCharacter(value);
  return c ? { userId:c.userId, username:c.username, nome:c.nome, cognome:c.cognome, eta:c.eta, sesso:c.sesso, storia:c.storia, nen:c.nen, autore:c.autore, location:c.location, level:c.level, xp:c.xp, nextXp:c.nextXp, paramPoints:c.paramPoints, setupPoints:c.setupPoints, ready:c.ready, params:c.params, stats:c.stats, createdAt:c.createdAt, updatedAt:c.updatedAt } : null;
};
const saveCharacter = (env, key, character) => env.CHAT_MESSAGES.put(key, JSON.stringify(normalizeCharacter(character)));

export async function onRequestGet({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error: 'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request));
  if (!user) return json({ error: 'Login richiesto' }, 401);
  const url = new URL(request.url);
  if (url.searchParams.get('list') === '1') {
    const listed = await env.CHAT_MESSAGES.list({ prefix: 'hxh:character:', limit: 1000 });
    const rows = await Promise.all(listed.keys.map(item => env.CHAT_MESSAGES.get(item.name, 'json').catch(() => null)));
    const characters = rows.filter(Boolean).map(publicCharacter).filter(Boolean).sort((a,b) => String(a.nome || a.username).localeCompare(String(b.nome || b.username), 'it'));
    return json({ characters });
  }
  const character = await env.CHAT_MESSAGES.get(characterKey(user), 'json').catch(() => null);
  return json({ user: { id:user.id, username:user.username }, character: ownCharacter(character) });
}

export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error: 'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request));
  if (!user) return json({ error: 'Login richiesto' }, 401);
  let data;
  try { data = await request.json(); } catch { return json({ error: 'JSON non valido' }, 400); }
  const action = clean(data.action).toLowerCase();
  const key = characterKey(user);

  if (action === 'save') {
    const existing = normalizeCharacter(await env.CHAT_MESSAGES.get(key, 'json').catch(() => null));
    const character = {
      userId: user.id,
      username: user.username,
      nome: clean(data.nome).slice(0, 40),
      cognome: clean(data.cognome).slice(0, 40),
      eta: clean(data.eta).slice(0, 8),
      sesso: clean(data.sesso).slice(0, 40),
      storia: clean(data.storia).slice(0, 1400),
      nen: clean(data.nen).slice(0, 900),
      autore: clean(data.autore).slice(0, 80),
      location: existing?.location || 'Sperduto',
      level: existing?.level || 1,
      xp: existing?.xp || 0,
      paramPoints: existing?.paramPoints || 0,
      setupPoints: existing ? existing.setupPoints : 10,
      params: existing?.params || blankParams(),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!character.nome || !character.cognome || !character.eta || !character.sesso || !character.storia || !character.nen || !character.autore) return json({ error: 'Compila tutti i campi' }, 400);
    await saveCharacter(env, key, character);
    return json({ character: ownCharacter(character) });
  }

  if (action === 'allocate') {
    const character = normalizeCharacter(await env.CHAT_MESSAGES.get(key, 'json').catch(() => null));
    if (!character) return json({ error: 'Crea prima un personaggio HxH' }, 404);
    const param = clean(data.param);
    if (!PARAMS.includes(param)) return json({ error: 'Parametro non valido' }, 400);
    const amount = clampInt(data.amount || 1, 1, 50);
    const pool = character.setupPoints > 0 ? 'setupPoints' : 'paramPoints';
    if (character[pool] < amount) return json({ error: 'Punti parametro insufficienti' }, 400);
    character.params[param] = clampInt(character.params[param]) + amount;
    character[pool] -= amount;
    character.updatedAt = new Date().toISOString();
    await saveCharacter(env, key, character);
    return json({ character: ownCharacter(character) });
  }

  if (action === 'move') {
    const character = normalizeCharacter(await env.CHAT_MESSAGES.get(key, 'json').catch(() => null));
    if (!character) return json({ error: 'Crea prima un personaggio HxH' }, 404);
    if (!character.ready) return json({ error: 'Distribuisci prima tutti i 10 punti parametro iniziali' }, 403);
    const place = clean(data.place);
    if (!allowedPlaces.has(place)) return json({ error: 'Location non valida' }, 400);
    if (place === 'Limeiro') return json({ error: 'La capitale è accessibile solo con tutte le carte collezionate!' }, 403);
    const from = character.location || 'Sperduto';
    if (!(routes[from] || []).includes(place)) return json({ error: 'non puoi arrivare qua a piedi da dove sei ora!' }, 403);
    character.location = place;
    character.updatedAt = new Date().toISOString();
    await saveCharacter(env, key, character);
    return json({ character: ownCharacter(character) });
  }

  return json({ error: 'Azione non valida' }, 400);
}

export async function onRequestDelete({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error: 'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request));
  if (!user) return json({ error: 'Login richiesto' }, 401);
  await env.CHAT_MESSAGES.delete(characterKey(user));
  return json({ ok: true });
}
