const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const MAX_QUOTES = 200;

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });
const clean = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
const keyOf = value => clean(value).toLowerCase();
const bearer = request => {
  const auth = request.headers.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return request.headers.get('x-mancuspie-token') || '';
};
const publicUser = user => user ? ({ id: user.id, username: user.username }) : null;
const getUserByToken = async (env, token) => {
  if (!env.CHAT_MESSAGES || !token) return null;
  const session = await env.CHAT_MESSAGES.get(`auth:session:${token}`, 'json').catch(() => null);
  if (!session?.userId) return null;
  return await env.CHAT_MESSAGES.get(`auth:user:${session.userId}`, 'json').catch(() => null);
};
const getUserByUsername = async (env, username) => {
  if (!env.CHAT_MESSAGES) return null;
  const id = await env.CHAT_MESSAGES.get(`auth:username:${keyOf(username)}`);
  if (!id) return null;
  return await env.CHAT_MESSAGES.get(`auth:user:${id}`, 'json').catch(() => null);
};
const boardKey = userId => `quotes:user:${userId}`;
const loadQuotes = async (env, userId) => {
  const list = await env.CHAT_MESSAGES.get(boardKey(userId), 'json').catch(() => null);
  return Array.isArray(list) ? list : [];
};

export async function onRequestGet({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error: 'CHAT_MESSAGES KV binding mancante' }, 500);
  const url = new URL(request.url);
  const username = clean(url.searchParams.get('username'));
  if (!username) return json({ error: 'Username mancante' }, 400);
  const owner = await getUserByUsername(env, username);
  if (!owner) return json({ error: 'Utente non trovato' }, 404);
  const self = await getUserByToken(env, bearer(request));
  const quotes = await loadQuotes(env, owner.id);
  quotes.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  return json({ ok: true, owner: publicUser(owner), canAdd: !!self && self.id === owner.id, quotes });
}

export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error: 'CHAT_MESSAGES KV binding mancante' }, 500);
  const self = await getUserByToken(env, bearer(request));
  if (!self) return json({ error: 'Login richiesto' }, 401);
  let data;
  try { data = await request.json(); } catch { return json({ error: 'JSON non valido' }, 400); }
  const quote = clean(data.quote || data.citazione).slice(0, 900);
  const author = clean(data.author || data.autore).slice(0, 120);
  const book = clean(data.book || data.libro).slice(0, 160);
  if (!quote) return json({ error: 'La citazione è obbligatoria' }, 400);
  const quotes = await loadQuotes(env, self.id);
  const item = { id: crypto.randomUUID(), quote, author, book, createdAt: new Date().toISOString(), createdBy: self.username };
  quotes.unshift(item);
  const next = quotes.slice(0, MAX_QUOTES);
  await env.CHAT_MESSAGES.put(boardKey(self.id), JSON.stringify(next));
  return json({ ok: true, quote: item, quotes: next }, 201);
}
