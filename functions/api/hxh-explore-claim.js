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
const characterKey = user => `hxh:character:${user.id}`;
const exploreKey = user => `hxh:explore:${user.id}`;
const clampInt = (v, min = 0, max = 999999) => Math.max(min, Math.min(max, Math.floor(Number(v) || 0)));
const maxEnergyFor = level => 3 + ((clampInt(level, 1) - 1) * 2);
const nextXpFor = level => { let n = 10; for (let i = 1; i < clampInt(level, 1); i++) n += Math.ceil(n / 2); return n; };
const normalizeLevelXp = c => {
  let level = clampInt(c?.level, 1), xp = clampInt(c?.xp), points = clampInt(c?.paramPoints);
  while (xp >= nextXpFor(level)) {
    xp -= nextXpFor(level);
    level += 1;
    points += 3;
  }
  return { ...c, level, xp, nextXp:nextXpFor(level), paramPoints:points, energy:Math.min(clampInt(c?.energy ?? maxEnergyFor(level)), maxEnergyFor(level)) };
};
const visibleDone = exploration => {
  const total = clampInt(exploration?.totalSeconds);
  const started = Date.parse(exploration?.startedAt || '');
  if (!Number.isFinite(started)) return false;
  return Math.floor((Date.now() - started) / 1000) >= total;
};
export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error:'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request));
  if (!user) return json({ error:'Login richiesto' }, 401);
  const cKey = characterKey(user), eKey = exploreKey(user);
  let character = await env.CHAT_MESSAGES.get(cKey, 'json').catch(() => null);
  if (!character) return json({ error:'Crea prima un personaggio HxH' }, 404);
  let exploration = await env.CHAT_MESSAGES.get(eKey, 'json').catch(() => null);
  if (!exploration) return json({ error:'Nessuna esplorazione da riscuotere.' }, 404);
  if (exploration.final?.critical) return json({ error:'Esplorazione cancellata: sei in stato critico.' }, 403);
  if (!visibleDone(exploration) && exploration.status !== 'done' && exploration.status !== 'claimed') {
    return json({ error:'Esplorazione ancora in corso.' }, 403);
  }
  if (!exploration.rewardsPaid) {
    character = {
      ...character,
      health: exploration.final?.health || character.health,
      cards: Array.isArray(exploration.final?.cards) ? exploration.final.cards : (character.cards || []),
      inventory: Array.isArray(exploration.final?.inventory) ? exploration.final.inventory : (character.inventory || []),
      xp: clampInt(exploration.final?.xp, clampInt(character.xp)),
      jenny: clampInt(exploration.final?.jenny, clampInt(character.jenny)),
      activeExploration: null
    };
  } else {
    character = { ...character, activeExploration:null };
  }
  character = normalizeLevelXp(character);
  exploration = { ...exploration, claimed:true, status:'claimed', rewardsPaid:true, rewardsPaidAt:new Date().toISOString() };
  await env.CHAT_MESSAGES.put(cKey, JSON.stringify({ ...character, updatedAt:new Date().toISOString() }));
  await env.CHAT_MESSAGES.put(eKey, JSON.stringify(exploration));
  return json({ character, exploration:null, claimed:true, rewardsPaid:true, summary:exploration.summary || null });
}
