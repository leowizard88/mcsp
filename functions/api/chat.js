const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

const STORE_KEY = 'messages';
const MAX_MESSAGES = 120;

const clean = value => String(value || '')
  .replace(/[\u0000-\u001f\u007f]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const usernameKey = value => clean(value).toLowerCase();

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });
const bearer = request => {
  const auth = request.headers.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return request.headers.get('x-mancuspie-token') || '';
};
const publicUserByName = async (env, name) => {
  const key = usernameKey(name);
  if (!env.CHAT_MESSAGES || !key || key === 'anonimo') return null;
  const id = await env.CHAT_MESSAGES.get(`auth:username:${key}`).catch(() => null);
  if (!id) return null;
  return await env.CHAT_MESSAGES.get(`auth:user:${id}`, 'json').catch(() => null);
};
const userFromSession = async (env, request) => {
  const token = bearer(request);
  if (!env.CHAT_MESSAGES || !token) return { name: 'Anonimo', avatar: '', userId: '' };
  const session = await env.CHAT_MESSAGES.get(`auth:session:${token}`, 'json').catch(() => null);
  if (!session?.userId) return { name: 'Anonimo', avatar: '', userId: '' };
  const user = await env.CHAT_MESSAGES.get(`auth:user:${session.userId}`, 'json').catch(() => null);
  return {
    name: clean(user?.username).slice(0, 24) || 'Anonimo',
    avatar: String(user?.avatar || '').slice(0, 450000),
    userId: user?.id || session.userId || ''
  };
};

async function readMessages(env) {
  if (!env.CHAT_MESSAGES) return [];
  try {
    const stored = await env.CHAT_MESSAGES.get(STORE_KEY, 'json');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

async function hydrateProfiles(env, messages) {
  if (!env.CHAT_MESSAGES || !Array.isArray(messages) || !messages.length) return messages || [];
  const names = [...new Set(messages.map(message => clean(message.name)).filter(name => name && name.toLowerCase() !== 'anonimo'))];
  const users = new Map();
  await Promise.all(names.map(async name => {
    const user = await publicUserByName(env, name);
    if (user) users.set(usernameKey(name), user);
  }));
  return messages.map(message => {
    const user = users.get(usernameKey(message.name));
    if (!user) return { ...message, avatar: '' };
    return { ...message, name: clean(user.username).slice(0, 24), avatar: String(user.avatar || '').slice(0, 450000), userId: user.id || message.userId || '' };
  });
}

async function writeMessages(env, messages) {
  if (!env.CHAT_MESSAGES) return false;
  await env.CHAT_MESSAGES.put(STORE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  return true;
}

export async function onRequestGet({ env }) {
  const messages = await hydrateProfiles(env, await readMessages(env));
  return json({ messages });
}

export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) {
    return json({ error: 'CHAT_MESSAGES KV binding mancante' }, 500);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'JSON non valido' }, 400);
  }

  const user = await userFromSession(env, request);
  const text = clean(data.text).slice(0, 260);
  const parentId = clean(data.parentId).slice(0, 80) || null;

  if (!text) return json({ error: 'Messaggio richiesto' }, 400);

  const messages = await readMessages(env);
  if (parentId && !messages.some(message => message.id === parentId)) {
    return json({ error: 'Messaggio padre non trovato' }, 400);
  }

  messages.push({
    id: crypto.randomUUID(),
    parentId,
    userId: user.userId,
    name: user.name,
    avatar: user.avatar,
    text,
    time: new Date().toISOString()
  });
  await writeMessages(env, messages);

  return json({ messages: await hydrateProfiles(env, messages.slice(-MAX_MESSAGES)) }, 201);
}
