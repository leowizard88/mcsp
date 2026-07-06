const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

const MAX_COMMENTS = 140;
const MAX_TEXT = 900;

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });
const clean = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
const usernameKey = value => clean(value).toLowerCase();
const keyFor = value => {
  const path = clean(value).slice(0, 180);
  if (!path || !path.startsWith('/')) return null;
  return `comments:${path}`;
};
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
    name: clean(user?.username).slice(0, 40) || 'Anonimo',
    avatar: String(user?.avatar || '').slice(0, 450000),
    userId: user?.id || session.userId || ''
  };
};

async function hydrateProfiles(env, comments) {
  if (!env.CHAT_MESSAGES || !Array.isArray(comments) || !comments.length) return comments || [];
  const names = [...new Set(comments.map(comment => clean(comment.name)).filter(name => name && name.toLowerCase() !== 'anonimo'))];
  const users = new Map();
  await Promise.all(names.map(async name => {
    const user = await publicUserByName(env, name);
    if (user) users.set(usernameKey(name), user);
  }));
  return comments.map(comment => {
    const user = users.get(usernameKey(comment.name));
    if (!user) return { ...comment, avatar: '' };
    return { ...comment, name: clean(user.username).slice(0, 40), avatar: String(user.avatar || '').slice(0, 450000), userId: user.id || comment.userId || '' };
  });
}

async function readComments(env, key) {
  if (!env.CHAT_MESSAGES) return [];
  try {
    const stored = await env.CHAT_MESSAGES.get(key, 'json');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

async function writeComments(env, key, comments) {
  if (!env.CHAT_MESSAGES) return false;
  await env.CHAT_MESSAGES.put(key, JSON.stringify(comments.slice(-MAX_COMMENTS)));
  return true;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const key = keyFor(url.searchParams.get('path'));
  if (!key) return json({ error: 'Percorso articolo non valido' }, 400);
  const comments = await hydrateProfiles(env, await readComments(env, key));
  return json({ comments });
}

export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error: 'CHAT_MESSAGES KV binding mancante' }, 500);

  let data;
  try { data = await request.json(); } catch { return json({ error: 'JSON non valido' }, 400); }

  const key = keyFor(data.path);
  const user = await userFromSession(env, request);
  const text = clean(data.text).slice(0, MAX_TEXT);
  const parentId = clean(data.parentId).slice(0, 80) || null;

  if (!key) return json({ error: 'Percorso articolo non valido' }, 400);
  if (!text) return json({ error: 'Commento richiesto' }, 400);

  const comments = await readComments(env, key);
  if (parentId && !comments.some(comment => comment.id === parentId)) {
    return json({ error: 'Commento padre non trovato' }, 400);
  }

  comments.push({
    id: crypto.randomUUID(),
    parentId,
    userId: user.userId,
    name: user.name,
    avatar: user.avatar,
    text,
    time: new Date().toISOString()
  });

  await writeComments(env, key, comments);
  return json({ comments: await hydrateProfiles(env, comments.slice(-MAX_COMMENTS)) }, 201);
}
