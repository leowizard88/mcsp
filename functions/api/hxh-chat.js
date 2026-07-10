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
const readRaw = env => env.CHAT_MESSAGES.get(chatKey, 'json').catch(() => null);
const normalizeStore = value => {
  if (Array.isArray(value)) return { messages:value, revision:0, updatedAt:null };
  if (value && typeof value === 'object') return { messages:Array.isArray(value.messages) ? value.messages : [], revision:Number(value.revision) || 0, updatedAt:value.updatedAt || null };
  return { messages:[], revision:0, updatedAt:null };
};
const readStore = async env => normalizeStore(await readRaw(env));
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
  const store = await readStore(env);
  let messages = store.messages.map(safeMessage).filter(m => m.text).sort(byTime);
  if (before) {
    const beforeMs = Date.parse(before);
    if (Number.isFinite(beforeMs)) messages = messages.filter(m => Date.parse(m.createdAt || 0) < beforeMs);
  }
  const selected = messages.slice(-limit);
  return json({ messages:selected, revision:store.revision, updatedAt:store.updatedAt, hasMore:messages.length > selected.length, oldest:selected[0]?.createdAt || null, newest:selected[selected.length - 1]?.createdAt || null });
}

export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error:'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request));
  if (!user) return json({ error:'Login richiesto' }, 401);
  let data;
  try { data = await request.json(); } catch { return json({ error:'JSON non valido' }, 400); }
  const text = clean(data.text).slice(0, 360);
  if (!text) return json({ error:'Messaggio vuoto' }, 400);
  const store = await readStore(env);
  const messages = store.messages.map(safeMessage).filter(m => m.text).sort(byTime);
  const now = new Date().toISOString();
  const msg = safeMessage({ id:crypto.randomUUID(), kind:'chat', author:await publicName(env, user), userId:user.id, text, createdAt:now });
  messages.push(msg);
  const stored = messages.slice(-200);
  const nextStore = { messages:stored, revision:(Number(store.revision) || 0) + 1, updatedAt:now };
  await env.CHAT_MESSAGES.put(chatKey, JSON.stringify(nextStore));
  return json({ message:msg, messages:stored.slice(-40), revision:nextStore.revision, updatedAt:nextStore.updatedAt, hasMore:stored.length > 40 });
}
