const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const SESSION_TTL = 60 * 60 * 24 * 90;
const SIGNUP_TTL = 60 * 20;
const MAX_AVATAR = 420000;
const ROLE_USER = 'user';
const ROLE_REDACTORE = 'redattore';

// Codici SEC monouso validi, salvati come SHA-256 del codice normalizzato.
// Quando serve un nuovo codice, va aggiunto qui il suo hash.
const SEC_CODE_HASHES = new Set([
  'c914c0f9c5005e79ebd0a169f0e235b09b2f6da1d1db655bda4d6ef446d12be2'
]);

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });
const clean = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
const usernameKey = value => clean(value).toLowerCase();
const normalizeSecCode = value => clean(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
const validUsername = value => /^[a-zA-Z0-9_]{3,24}$/.test(value);
const validPassword = value => String(value || '').length >= 4 && String(value || '').length <= 120;
const enc = new TextEncoder();
const bytesToHex = buffer => [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('');
const randomHex = bytes => {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return [...array].map(byte => byte.toString(16).padStart(2, '0')).join('');
};
const hash = async value => bytesToHex(await crypto.subtle.digest('SHA-256', enc.encode(value)));
const passHash = (password, salt) => hash(`${salt}:${password}`);
const roleOf = user => user?.role === ROLE_REDACTORE ? ROLE_REDACTORE : ROLE_USER;
const ownUser = user => user ? ({ id: user.id, username: user.username, role: roleOf(user), isRedattore: roleOf(user) === ROLE_REDACTORE, bio: user.bio || '', avatar: user.avatar || '', sec: user.sec || '', createdAt: user.createdAt, canEdit: true }) : null;
const publicUser = user => user ? ({ id: user.id, username: user.username, role: roleOf(user), isRedattore: roleOf(user) === ROLE_REDACTORE, bio: user.bio || '', avatar: user.avatar || '', createdAt: user.createdAt, canEdit: false }) : null;
const originKey = async request => {
  const raw = clean(request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '');
  if (!raw) return '';
  return `auth:origin:${await hash(raw.split(',')[0].trim())}`;
};
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
const getUserByUsername = async (env, username) => {
  if (!env.CHAT_MESSAGES) return null;
  const key = usernameKey(username);
  if (!key) return null;
  const id = await env.CHAT_MESSAGES.get(`auth:username:${key}`);
  if (!id) return null;
  return await env.CHAT_MESSAGES.get(`auth:user:${id}`, 'json').catch(() => null);
};
const saveSession = async (env, userId) => {
  const token = randomHex(32);
  await env.CHAT_MESSAGES.put(`auth:session:${token}`, JSON.stringify({ userId, time: new Date().toISOString() }), { expirationTtl: SESSION_TTL });
  return token;
};
const redeemSecCode = async (env, rawCode, user) => {
  const normalized = normalizeSecCode(rawCode);
  if (!normalized || normalized.length < 8) return { ok: false, error: 'Codice SEC non valido' };
  const codeHash = await hash(normalized);
  if (!SEC_CODE_HASHES.has(codeHash)) return { ok: false, error: 'Codice SEC non valido' };
  const usedKey = `auth:sec-used:${codeHash}`;
  if (await env.CHAT_MESSAGES.get(usedKey)) return { ok: false, error: 'Codice SEC già usato' };
  user.role = ROLE_REDACTORE;
  user.sec = 'REDAZIONE';
  user.redattoreAt = new Date().toISOString();
  await env.CHAT_MESSAGES.put(`auth:user:${user.id}`, JSON.stringify(user));
  await env.CHAT_MESSAGES.put(usedKey, JSON.stringify({ userId: user.id, username: user.username, time: user.redattoreAt }));
  return { ok: true, user };
};

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const requested = clean(url.searchParams.get('username'));
  const self = await getUserByToken(env, bearer(request));
  if (requested) {
    const user = await getUserByUsername(env, requested);
    if (!user) return json({ error: 'Profilo non trovato' }, 404);
    if (self?.id && self.id === user.id) return json({ user: ownUser(user) });
    return json({ user: publicUser(user) });
  }
  return json({ user: ownUser(self) });
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
    if (!validUsername(username)) return json({ error: 'Username: 3-24 caratteri, solo lettere numeri e _' }, 400);
    if (!validPassword(password)) return json({ error: 'Password: minimo 4 caratteri' }, 400);
    if (await env.CHAT_MESSAGES.get(`auth:username:${key}`)) return json({ error: 'Username già preso' }, 409);
    const signupKey = await originKey(request);
    if (signupKey && await env.CHAT_MESSAGES.get(signupKey)) return json({ error: 'Troppi account creati da questa rete. Riprova tra poco.' }, 429);
    const id = crypto.randomUUID();
    const salt = randomHex(16);
    const user = { id, username, usernameKey: key, role: ROLE_USER, salt, passwordHash: await passHash(password, salt), bio: '', avatar: '', sec: '', createdAt: new Date().toISOString() };
    await env.CHAT_MESSAGES.put(`auth:user:${id}`, JSON.stringify(user));
    await env.CHAT_MESSAGES.put(`auth:username:${key}`, id);
    if (signupKey) await env.CHAT_MESSAGES.put(signupKey, id, { expirationTtl: SIGNUP_TTL });
    const token = await saveSession(env, id);
    return json({ token, user: ownUser(user) }, 201);
  }

  if (action === 'login') {
    const key = usernameKey(data.username);
    const password = String(data.password || '');
    const id = await env.CHAT_MESSAGES.get(`auth:username:${key}`);
    if (!id) return json({ error: 'Credenziali non valide' }, 401);
    const user = await env.CHAT_MESSAGES.get(`auth:user:${id}`, 'json');
    if (!user || await passHash(password, user.salt) !== user.passwordHash) return json({ error: 'Credenziali non valide' }, 401);
    if (!user.role) {
      user.role = ROLE_USER;
      await env.CHAT_MESSAGES.put(`auth:user:${user.id}`, JSON.stringify(user));
    }
    const token = await saveSession(env, id);
    return json({ token, user: ownUser(user) });
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
    user.role = roleOf(user);
    user.bio = clean(data.bio).slice(0, 900);
    const avatar = String(data.avatar || '');
    if (avatar) {
      if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(avatar) || avatar.length > MAX_AVATAR) return json({ error: 'Immagine profilo non valida o troppo pesante' }, 400);
      user.avatar = avatar;
    }
    if (data.avatar === '') user.avatar = '';
    await env.CHAT_MESSAGES.put(`auth:user:${user.id}`, JSON.stringify(user));
    return json({ user: ownUser(user) });
  }

  if (action === 'redeemsec') {
    const token = bearer(request) || clean(data.token);
    const user = await getUserByToken(env, token);
    if (!user) return json({ error: 'Login richiesto' }, 401);
    if (roleOf(user) === ROLE_REDACTORE) return json({ user: ownUser(user), ok: true });
    const result = await redeemSecCode(env, data.code, user);
    if (!result.ok) return json({ error: result.error }, 400);
    return json({ user: ownUser(result.user), ok: true });
  }

  return json({ error: 'Azione non valida' }, 400);
}
