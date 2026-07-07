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
const publicCharacter = value => value ? ({ userId:value.userId, username:value.username, nome:value.nome, cognome:value.cognome, eta:value.eta, sesso:value.sesso, storia:value.storia, nen:value.nen, autore:value.autore, location:value.location || 'Sperduto', createdAt:value.createdAt, updatedAt:value.updatedAt }) : null;
const ownCharacter = value => publicCharacter(value);
const characterKey = user => `hxh:character:${user.id}`;

export async function onRequestGet({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error: 'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request));
  if (!user) return json({ error: 'Login richiesto' }, 401);
  const url = new URL(request.url);
  if (url.searchParams.get('list') === '1') {
    const listed = await env.CHAT_MESSAGES.list({ prefix: 'hxh:character:', limit: 1000 });
    const rows = await Promise.all(listed.keys.map(item => env.CHAT_MESSAGES.get(item.name, 'json').catch(() => null)));
    const characters = rows.filter(Boolean).map(publicCharacter).sort((a,b) => String(a.nome || a.username).localeCompare(String(b.nome || b.username), 'it'));
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
      location: 'Sperduto',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!character.nome || !character.cognome || !character.eta || !character.sesso || !character.storia || !character.nen || !character.autore) return json({ error: 'Compila tutti i campi' }, 400);
    const existing = await env.CHAT_MESSAGES.get(key, 'json').catch(() => null);
    if (existing?.createdAt) character.createdAt = existing.createdAt;
    if (existing?.location) character.location = existing.location;
    await env.CHAT_MESSAGES.put(key, JSON.stringify(character));
    return json({ character: ownCharacter(character) });
  }

  if (action === 'move') {
    const character = await env.CHAT_MESSAGES.get(key, 'json').catch(() => null);
    if (!character) return json({ error: 'Crea prima un personaggio HxH' }, 404);
    const place = clean(data.place);
    if (!allowedPlaces.has(place)) return json({ error: 'Location non valida' }, 400);
    if (place === 'Limeiro') return json({ error: 'La capitale è accessibile solo con tutte le carte collezionate!' }, 403);
    const from = character.location || 'Sperduto';
    if (!(routes[from] || []).includes(place)) return json({ error: 'non puoi arrivare qua a piedi da dove sei ora!' }, 403);
    character.location = place;
    character.updatedAt = new Date().toISOString();
    await env.CHAT_MESSAGES.put(key, JSON.stringify(character));
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
