const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const SESSION_TTL = 60 * 60 * 24 * 90;
const MAX_AVATAR = 420000;

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });
const clean = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
const usernameKey = value => clean(value).toLowerCase();
const validUsername = value => /^[a-zA-Z0-9_]{3,24}$/.test(value);
const validPassword = value => String(value || '').length >= 6 && String(value || '').length <= 120;
const enc = new TextEncoder();
const bytesToHex = buffer => [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('');
const randomHex = bytes => {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return [...array].map(byte => byte.toString(16).padStart(2, '0')).join('');
};
const hash = async value => bytesToHex(await crypto.subtle.digest('SHA-256', enc.encode(value)));
const passHash = (password, salt) => hash(`${salt}:${password}`);
const publicUser = user => user ? ({ id: user.id, username: user.username, bio: user.bio || '', avatar: user.avatar || '', sec: user.sec || '', createdAt: user.createdAt }) : null;
const originKey = async request => `auth:origin:${await hash(request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown')}`;
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
const saveSession = async (env, userId) => {
  const token = randomHex(32);
  await env.CHAT_MESSAGES.put(`auth:session:${token}`, JSON.stringify({ userId, time: new Date().toISOString() }), { expirationTtl: SESSION_TTL });
  return token;
};

export async function onRequestGet({ request, env }) {
  const user = await getUserByToken(env, bearer(request));
  return json({ user: publicUser(user) });
}

export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error: 'CHAT_MESSAGES KV binding mancante' }, 500);
  let data;
  try { data = await request.json(); } catch { return json({ error: 'JSON non valido' }, 400); }
  const action = clean(data.action).toLowerCase();

  if (action === 'signup') {
    const username = clean(data.username).slice(0, 24);
    const key = usernameKey(username);
    const password = String(data.password || '');
    if (!validUsername(username)) return json({ error: 'Username: 3-24 caratteri, lettere numeri e _' }, 400);
    if (!validPassword(password)) return json({ error: 'Password: minimo 6 caratteri' }, 400);
    if (await env.CHAT_MESSAGES.get(`auth:username:${key}`)) return json({ error: 'Username già preso' }, 409);
    const oneSignupKey = await originKey(request);
    if (await env.CHAT_MESSAGES.get(oneSignupKey)) return json({ error: 'Da questa rete è già stato creato un account' }, 429);
    const id = crypto.randomUUID();
    const salt = randomHex(16);
    const user = { id, username, usernameKey: key, salt, passwordHash: await passHash(password, salt), bio: '', avatar: '', sec: '', createdAt: new Date().toISOString() };
    await env.CHAT_MESSAGES.put(`auth:user:${id}`, JSON.stringify(user));
    await env.CHAT_MESSAGES.put(`auth:username:${key}`, id);
    await env.CHAT_MESSAGES.put(oneSignupKey, id);
    const token = await saveSession(env, id);
    return json({ token, user: publicUser(user) }, 201);
  }

  if (action === 'login') {
    const key = usernameKey(data.username);
    const password = String(data.password || '');
    const id = await env.CHAT_MESSAGES.get(`auth:username:${key}`);
    if (!id) return json({ error: 'Credenziali non valide' }, 401);
    const user = await env.CHAT_MESSAGES.get(`auth:user:${id}`, 'json');
    if (!user || await passHash(password, user.salt) !== user.passwordHash) return json({ error: 'Credenziali non valide' }, 401);
    const token = await saveSession(env, id);
    return json({ token, user: publicUser(user) });
  }

  if (action === 'logout') {
    const token = bearer(request) || clean(data.token);
    if (token) await env.CHAT_MESSAGES.delete(`auth:session:${token}`);
    return json({ ok: true });
  }

  if (action === 'update') {
    const token = bearer(request) || clean(data.token);
    const user = await getUserByToken(env, token);
    if (!user) return json({ error: 'Login richiesto' }, 401);
    user.bio = clean(data.bio).slice(0, 900);
    user.sec = clean(data.sec).slice(0, 120);
    const avatar = String(data.avatar || '');
    if (avatar) {
      if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(avatar) || avatar.length > MAX_AVATAR) return json({ error: 'Immagine profilo non valida o troppo pesante' }, 400);
      user.avatar = avatar;
    }
    if (data.avatar === '') user.avatar = '';
    await env.CHAT_MESSAGES.put(`auth:user:${user.id}`, JSON.stringify(user));
    return json({ user: publicUser(user) });
  }

  return json({ error: 'Azione non valida' }, 400);
}
