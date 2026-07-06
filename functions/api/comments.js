const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

const MAX_COMMENTS = 140;
const MAX_TEXT = 900;

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });
const clean = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
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
const nameFromSession = async (env, request) => {
  const token = bearer(request);
  if (!env.CHAT_MESSAGES || !token) return 'Anonimo';
  const session = await env.CHAT_MESSAGES.get(`auth:session:${token}`, 'json').catch(() => null);
  if (!session?.userId) return 'Anonimo';
  const user = await env.CHAT_MESSAGES.get(`auth:user:${session.userId}`, 'json').catch(() => null);
  return clean(user?.username).slice(0, 40) || 'Anonimo';
};

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
  const comments = await readComments(env, key);
  return json({ comments });
}

export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error: 'CHAT_MESSAGES KV binding mancante' }, 500);

  let data;
  try { data = await request.json(); } catch { return json({ error: 'JSON non valido' }, 400); }

  const key = keyFor(data.path);
  const name = await nameFromSession(env, request);
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
    name,
    text,
    time: new Date().toISOString()
  });

  await writeComments(env, key, comments);
  return json({ comments: comments.slice(-MAX_COMMENTS) }, 201);
}
