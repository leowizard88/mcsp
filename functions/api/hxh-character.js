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
const routes = {
  'Shiso tree':['Masadora','Antokiba'],
  Masadora:['Shiso tree','Foresta Oscura','Limeiro'],
  'Foresta Oscura':['Masadora','Villaggio di banditi','Bunzen'],
  Antokiba:['Shiso tree','Rubicuta','Isola sul lago','Accampamento misterioso'],
  Bunzen:['Foresta Oscura','Soufrabi','Casa senile'],
  'Villaggio di banditi':['Badlands','Foresta Oscura','Limeiro'],
  Badlands:['Villaggio di banditi','Limeiro'],
  'Casa senile':['Bunzen'],
  'Isola sul lago':['Antokiba'],
  Rubicuta:['Antokiba','Rovine infestate','Dorias'],
  'Rovine infestate':['Rubicuta','Dorias','Plateau Bye Bye'],
  Dorias:['Rubicuta','Rovine infestate'],
  'Plateau Bye Bye':['Rovine infestate','Aiai'],
  'Accampamento misterioso':['Antokiba','Aiai'],
  Aiai:['Accampamento misterioso','Plateau Bye Bye'],
  Limeiro:['Masadora','Badlands'],
  Soufrabi:['Bunzen'],
  Farlands:[]
};
const allowedPlaces = new Set(Object.keys(routes));
const PARAMS = ['forza','robustezza','nen','intelligenza','malizia','agilita','oratoria','percezione'];
const healthBase = { testa:5, corpo:8, braccioDx:6, braccioSx:6, gambaDx:7, gambaSx:7 };
const characterKey = user => `hxh:character:${user.id}`;
const clampInt = (value, min = 0, max = 999999) => Math.max(min, Math.min(max, Math.floor(Number(value) || 0)));
const maxEnergyFor = level => 3 + ((clampInt(level, 1) - 1) * 2);
const nowMs = () => Date.now();
const isFuture = value => value && Date.parse(value) > nowMs();
const restPenaltyActive = character => isFuture(character?.restPenaltyUntil);
const restCooldownActive = character => isFuture(character?.restCooldownUntil);
const secondsLeft = value => Math.max(0, Math.ceil((Date.parse(value || 0) - nowMs()) / 1000));
const nextXpFor = level => {
  let needed = 10;
  for (let i = 1; i < clampInt(level, 1); i++) needed += Math.ceil(needed / 2);
  return needed;
};
const blankParams = () => Object.fromEntries(PARAMS.map(k => [k, 0]));
const effectiveParams = character => {
  const base = { ...blankParams(), ...(character.params || {}) };
  if (!restPenaltyActive(character)) return base;
  return Object.fromEntries(Object.entries(base).map(([k,v]) => [k, Math.max(0, clampInt(v) - 1)]));
};
const applyEnergyRegen = character => {
  const level = clampInt(character.level || 1, 1);
  const maxEnergy = maxEnergyFor(level);
  const current = clampInt(character.energy ?? maxEnergy, 0, maxEnergy);
  const last = Date.parse(character.energyUpdatedAt || character.updatedAt || character.createdAt || new Date().toISOString());
  if (current >= maxEnergy || !Number.isFinite(last)) return { ...character, energy:current, energyUpdatedAt:character.energyUpdatedAt || new Date().toISOString() };
  const ticks = Math.floor((nowMs() - last) / 600000);
  if (ticks <= 0) return { ...character, energy:current, energyUpdatedAt:character.energyUpdatedAt || new Date(last).toISOString() };
  const energy = clampInt(current + ticks, 0, maxEnergy);
  const energyUpdatedAt = new Date(last + (ticks * 600000)).toISOString();
  return { ...character, energy, energyUpdatedAt };
};
const healthPart = (base, robustezza, level) => {
  const r = clampInt(robustezza);
  const byRobustezza = r === 0 ? base : r === 1 ? base + 4 : base * r;
  const byLevel = Math.ceil(base / 2) * Math.max(0, clampInt(level, 1) - 1);
  return byRobustezza + byLevel;
};
const maxHealthFor = character => {
  const params = effectiveParams(character);
  const level = clampInt(character.level, 1);
  return Object.fromEntries(Object.entries(healthBase).map(([k, base]) => [k, healthPart(base, params.robustezza, level)]));
};
const fullHealthFor = character => maxHealthFor(character);
const normalizeHealth = character => {
  const max = maxHealthFor(character);
  const raw = character.health && typeof character.health === 'object' ? character.health : {};
  return Object.fromEntries(Object.entries(max).map(([k,v]) => [k, clampInt(raw[k] ?? v, 0, v)]));
};
const avg = obj => Math.ceil(Object.values(obj).reduce((a,b) => a + b, 0) / Object.values(obj).length);
const derivedStats = character => {
  const params = effectiveParams(character);
  const level = clampInt(character.level, 1);
  const maxEnergy = maxEnergyFor(level);
  const currentEnergy = clampInt(character.energy ?? maxEnergy, 0, maxEnergy);
  const saluteMax = maxHealthFor(character);
  const salute = normalizeHealth(character);
  const saluteGenerale = avg(salute);
  const saluteGeneraleMax = avg(saluteMax);
  const nenValue = 1 + (clampInt(params.nen) * 4);
  return { generali:{ livello:level, esperienza:clampInt(character.xp), prossimoLivello:nextXpFor(level), puntiParametro:clampInt(character.paramPoints), puntiSetup:clampInt(character.setupPoints), energia:currentEnergy, energiaMax:maxEnergy, saluteGenerale, saluteGeneraleMax, nen:nenValue, nenMax:nenValue, jenny:clampInt(character.jenny) }, salute, saluteMax };
};
const normalizeCharacter = value => {
  if (!value) return null;
  const level = clampInt(value.level || 1, 1);
  const params = { ...blankParams(), ...(value.params || {}) };
  const rawLocation = value.location && value.location !== 'Sperduto' ? value.location : 'Shiso tree';
  let character = { ...value, level, xp:clampInt(value.xp), nextXp:nextXpFor(level), paramPoints:clampInt(value.paramPoints), setupPoints:clampInt(value.setupPoints), params, location:rawLocation, jenny:clampInt(value.jenny), energy:clampInt(value.energy ?? maxEnergyFor(level), 0, maxEnergyFor(level)), energyUpdatedAt:value.energyUpdatedAt || value.updatedAt || value.createdAt || new Date().toISOString(), inventory:Array.isArray(value.inventory) ? value.inventory : [], restPenaltyUntil:value.restPenaltyUntil || null, restCooldownUntil:value.restCooldownUntil || null };
  character = applyEnergyRegen(character);
  character.health = normalizeHealth(character);
  character.ready = character.setupPoints <= 0;
  character.paramsEffective = effectiveParams(character);
  character.restPenaltyActive = restPenaltyActive(character);
  character.restPenaltySecondsLeft = character.restPenaltyActive ? secondsLeft(character.restPenaltyUntil) : 0;
  character.restCooldownActive = restCooldownActive(character);
  character.restCooldownSecondsLeft = character.restCooldownActive ? secondsLeft(character.restCooldownUntil) : 0;
  character.stats = derivedStats(character);
  return character;
};
const publicCharacter = value => {
  const c = normalizeCharacter(value);
  return c ? { userId:c.userId, username:c.username, nome:c.nome, cognome:c.cognome, level:c.level, location:c.location, ready:c.ready, createdAt:c.createdAt, updatedAt:c.updatedAt } : null;
};
const ownCharacter = value => {
  const c = normalizeCharacter(value);
  return c ? { userId:c.userId, username:c.username, nome:c.nome, cognome:c.cognome, eta:c.eta, sesso:c.sesso, storia:c.storia, nen:c.nen, autore:c.autore, location:c.location, level:c.level, xp:c.xp, nextXp:c.nextXp, paramPoints:c.paramPoints, setupPoints:c.setupPoints, jenny:c.jenny, energy:c.energy, energyUpdatedAt:c.energyUpdatedAt, inventory:c.inventory, health:c.health, restPenaltyUntil:c.restPenaltyUntil, restPenaltyActive:c.restPenaltyActive, restPenaltySecondsLeft:c.restPenaltySecondsLeft, restCooldownUntil:c.restCooldownUntil, restCooldownActive:c.restCooldownActive, restCooldownSecondsLeft:c.restCooldownSecondsLeft, ready:c.ready, params:c.params, paramsEffective:c.paramsEffective, stats:c.stats, createdAt:c.createdAt, updatedAt:c.updatedAt } : null;
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
    const character = { userId:user.id, username:user.username, nome:clean(data.nome).slice(0,40), cognome:clean(data.cognome).slice(0,40), eta:clean(data.eta).slice(0,8), sesso:clean(data.sesso).slice(0,40), storia:clean(data.storia).slice(0,1400), nen:clean(data.nen).slice(0,900), autore:clean(data.autore).slice(0,80), location:existing?.location || 'Shiso tree', level:existing?.level || 1, xp:existing?.xp || 0, jenny:existing?.jenny || 0, energy:existing?.energy ?? maxEnergyFor(existing?.level || 1), energyUpdatedAt:existing?.energyUpdatedAt || new Date().toISOString(), inventory:existing?.inventory || [], health:existing?.health || null, restPenaltyUntil:existing?.restPenaltyUntil || null, restCooldownUntil:existing?.restCooldownUntil || null, paramPoints:existing?.paramPoints || 0, setupPoints:existing ? existing.setupPoints : 10, params:existing?.params || blankParams(), createdAt:existing?.createdAt || new Date().toISOString(), updatedAt:new Date().toISOString() };
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

  if (action === 'deallocate') {
    const character = normalizeCharacter(await env.CHAT_MESSAGES.get(key, 'json').catch(() => null));
    if (!character) return json({ error: 'Crea prima un personaggio HxH' }, 404);
    if (character.setupPoints <= 0) return json({ error: 'Puoi togliere punti solo durante la distribuzione iniziale' }, 403);
    const param = clean(data.param);
    if (!PARAMS.includes(param)) return json({ error: 'Parametro non valido' }, 400);
    const amount = clampInt(data.amount || 1, 1, 50);
    if (clampInt(character.params[param]) < amount) return json({ error: 'Questo parametro è già a 0' }, 400);
    character.params[param] = clampInt(character.params[param]) - amount;
    character.setupPoints += amount;
    character.updatedAt = new Date().toISOString();
    await saveCharacter(env, key, character);
    return json({ character: ownCharacter(character) });
  }

  if (action === 'levelup') {
    const character = normalizeCharacter(await env.CHAT_MESSAGES.get(key, 'json').catch(() => null));
    if (!character) return json({ error: 'Crea prima un personaggio HxH' }, 404);
    character.level = clampInt(character.level, 1) + 1;
    character.paramPoints = clampInt(character.paramPoints) + 3;
    character.energy = clampInt(character.energy) + 2;
    character.health = fullHealthFor(character);
    character.xp = 0;
    character.updatedAt = new Date().toISOString();
    await saveCharacter(env, key, character);
    return json({ character: ownCharacter(character) });
  }

  if (action === 'rest') {
    const character = normalizeCharacter(await env.CHAT_MESSAGES.get(key, 'json').catch(() => null));
    if (!character) return json({ error: 'Crea prima un personaggio HxH' }, 404);
    if (character.restCooldownActive) return json({ error: `Puoi riposare di nuovo tra ${Math.ceil(character.restCooldownSecondsLeft / 60)} minuti.` }, 403);
    character.energy = maxEnergyFor(character.level);
    character.energyUpdatedAt = new Date().toISOString();
    character.restPenaltyUntil = new Date(nowMs() + 600000).toISOString();
    character.restCooldownUntil = new Date(nowMs() + 10800000).toISOString();
    character.health = fullHealthFor(character);
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
    if (place === 'Limeiro') return json({ error: 'Limeiro è off limits finché non possiedi tutte le carte.' }, 403);
    const from = character.location || 'Shiso tree';
    if (!(routes[from] || []).includes(place)) return json({ error: 'non puoi arrivare qua a piedi da dove sei ora!' }, 403);
    if (clampInt(character.energy) < 1) return json({ error: 'Energia insufficiente: ogni spostamento consuma 1 energia.' }, 403);
    character.energy = clampInt(character.energy) - 1;
    character.energyUpdatedAt = new Date().toISOString();
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
