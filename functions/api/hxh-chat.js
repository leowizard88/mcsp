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
const chatKey = 'hxh:chat:global';
const characterKey = user => `hxh:character:${user.id}`;
const readMessages = env => env.CHAT_MESSAGES.get(chatKey, 'json').catch(() => null).then(v => Array.isArray(v) ? v : []);
const publicName = async (env, user) => {
  const c = await env.CHAT_MESSAGES.get(characterKey(user), 'json').catch(() => null);
  const full = clean(`${c?.nome || ''} ${c?.cognome || ''}`);
  return full || clean(user.username) || 'Giocatore';
};
const safeMessage = msg => ({
  id: clean(msg.id) || crypto.randomUUID(),
  kind: clean(msg.kind) || 'chat',
  author: clean(msg.author).slice(0, 60),
  userId: clean(msg.userId).slice(0, 80),
  text: clean(msg.text).slice(0, 360),
  createdAt: clean(msg.createdAt) || new Date().toISOString()
});
const byTime = (a,b) => Date.parse(a.createdAt || 0) - Date.parse(b.createdAt || 0);

export async function onRequestGet({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error:'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request));
  if (!user) return json({ error:'Login richiesto' }, 401);
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit')) || 40));
  const before = url.searchParams.get('before');
  let messages = (await readMessages(env)).map(safeMessage).filter(m => m.text).sort(byTime);
  if (before) {
    const beforeMs = Date.parse(before);
    if (Number.isFinite(beforeMs)) messages = messages.filter(m => Date.parse(m.createdAt || 0) < beforeMs);
  }
  const selected = messages.slice(-limit);
  return json({ messages:selected, hasMore:messages.length > selected.length, oldest:selected[0]?.createdAt || null, newest:selected[selected.length - 1]?.createdAt || null });
}

export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error:'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request));
  if (!user) return json({ error:'Login richiesto' }, 401);
  let data;
  try { data = await request.json(); } catch { return json({ error:'JSON non valido' }, 400); }
  const text = clean(data.text).slice(0, 360);
  if (!text) return json({ error:'Messaggio vuoto' }, 400);
  const messages = (await readMessages(env)).map(safeMessage).filter(m => m.text).sort(byTime);
  const msg = safeMessage({ id:crypto.randomUUID(), kind:'chat', author:await publicName(env, user), userId:user.id, text, createdAt:new Date().toISOString() });
  messages.push(msg);
  const stored = messages.slice(-200);
  await env.CHAT_MESSAGES.put(chatKey, JSON.stringify(stored));
  return json({ message:msg, messages:stored.slice(-40), hasMore:stored.length > 40 });
}
