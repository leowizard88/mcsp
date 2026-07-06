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

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });
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
  return clean(user?.username).slice(0, 24) || 'Anonimo';
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

async function writeMessages(env, messages) {
  if (!env.CHAT_MESSAGES) return false;
  await env.CHAT_MESSAGES.put(STORE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  return true;
}

export async function onRequestGet({ env }) {
  const messages = await readMessages(env);
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

  const name = await nameFromSession(env, request);
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
    name,
    text,
    time: new Date().toISOString()
  });
  await writeMessages(env, messages);

  return json({ messages: messages.slice(-MAX_MESSAGES) }, 201);
}
