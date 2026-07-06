const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

const STORE_KEY = 'messages';
const MAX_MESSAGES = 80;

const clean = value => String(value || '')
  .replace(/[\u0000-\u001f\u007f]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });

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

  const name = clean(data.name).slice(0, 24);
  const text = clean(data.text).slice(0, 260);

  if (!name || !text) return json({ error: 'Nickname e messaggio richiesti' }, 400);

  const messages = await readMessages(env);
  messages.push({
    id: crypto.randomUUID(),
    name,
    text,
    time: new Date().toISOString()
  });
  await writeMessages(env, messages);

  return json({ messages: messages.slice(-MAX_MESSAGES) }, 201);
}
