const HEADERS = { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers:HEADERS });
const bearer = request => {
  const auth = request.headers.get('authorization') || '';
  return auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : request.headers.get('x-mancuspie-token') || '';
};
const getUserByToken = async (env, token) => {
  if (!env.CHAT_MESSAGES || !token) return null;
  const session = await env.CHAT_MESSAGES.get(`auth:session:${token}`, 'json').catch(() => null);
  if (!session?.userId) return null;
  return await env.CHAT_MESSAGES.get(`auth:user:${session.userId}`, 'json').catch(() => null);
};
const key = user => `hxh:character:${user.id}`;
const clampInt = (v, min = 0, max = 999999) => Math.max(min, Math.min(max, Math.floor(Number(v) || 0)));
const maxEnergyFor = level => 3 + ((clampInt(level, 1) - 1) * 2);
const nextXpFor = level => { let n = 10; for (let i = 1; i < clampInt(level, 1); i++) n += Math.ceil(n / 2); return n; };
const normalize = c => {
  let level = clampInt(c?.level, 1), xp = clampInt(c?.xp), points = clampInt(c?.paramPoints);
  while (xp >= nextXpFor(level)) { xp -= nextXpFor(level); level += 1; points += 3; }
  return { ...c, level, xp, nextXp:nextXpFor(level), paramPoints:points, energy:Math.min(clampInt(c?.energy ?? maxEnergyFor(level)), maxEnergyFor(level)), updatedAt:new Date().toISOString() };
};
export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error:'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request));
  if (!user) return json({ error:'Login richiesto' }, 401);
  const character = await env.CHAT_MESSAGES.get(key(user), 'json').catch(() => null);
  if (!character) return json({ character:null });
  const fixed = normalize(character);
  await env.CHAT_MESSAGES.put(key(user), JSON.stringify(fixed));
  return json({ character:fixed });
}
