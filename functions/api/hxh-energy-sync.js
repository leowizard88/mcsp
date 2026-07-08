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
const isFuture = value => value && Date.parse(value) > Date.now();
const syncEnergy = character => {
  const level = clampInt(character?.level, 1);
  const maxEnergy = maxEnergyFor(level);
  const current = clampInt(character?.energy ?? maxEnergy, 0, maxEnergy);
  if (isFuture(character?.sleepUntil) || isFuture(character?.exhaustionUntil)) {
    return { ...character, energy:current, energyUpdatedAt:character.energyUpdatedAt || new Date().toISOString() };
  }
  const last = Date.parse(character?.energyUpdatedAt || character?.updatedAt || character?.createdAt || new Date().toISOString());
  if (!Number.isFinite(last)) return { ...character, energy:current, energyUpdatedAt:new Date().toISOString() };
  const ticks = Math.floor((Date.now() - last) / 600000);
  if (ticks <= 0 || current >= maxEnergy) return { ...character, energy:current, energyUpdatedAt:character.energyUpdatedAt || new Date(last).toISOString() };
  const energy = clampInt(current + ticks, 0, maxEnergy);
  const energyUpdatedAt = new Date(last + ticks * 600000).toISOString();
  return { ...character, energy, energyUpdatedAt, updatedAt:new Date().toISOString() };
};
export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error:'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request));
  if (!user) return json({ error:'Login richiesto' }, 401);
  const character = await env.CHAT_MESSAGES.get(key(user), 'json').catch(() => null);
  if (!character) return json({ character:null });
  const synced = syncEnergy(character);
  await env.CHAT_MESSAGES.put(key(user), JSON.stringify(synced));
  return json({ character:synced });
}
