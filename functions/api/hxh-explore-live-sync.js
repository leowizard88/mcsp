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
const cKey = user => `hxh:character:${user.id}`;
const eKey = user => `hxh:explore:${user.id}`;
const clampInt = (v, min = 0, max = 999999) => Math.max(min, Math.min(max, Math.floor(Number(v) || 0)));
const maxEnergyFor = level => 3 + ((clampInt(level, 1) - 1) * 2);
const nextXpFor = level => { let n = 10; for (let i = 1; i < clampInt(level, 1); i++) n += Math.ceil(n / 2); return n; };
const normalizeLevelXp = c => {
  let level = clampInt(c?.level, 1), xp = clampInt(c?.xp), points = clampInt(c?.paramPoints);
  while (xp >= nextXpFor(level)) { xp -= nextXpFor(level); level += 1; points += 3; }
  return { ...c, level, xp, nextXp:nextXpFor(level), paramPoints:points, energy:Math.min(clampInt(c?.energy ?? maxEnergyFor(level)), maxEnergyFor(level)) };
};
const visible = exploration => {
  if (!exploration) return null;
  const elapsed = Math.max(0, Math.floor((Date.now() - Date.parse(exploration.startedAt || new Date().toISOString())) / 1000));
  const done = elapsed >= clampInt(exploration.totalSeconds);
  const criticalNow = exploration.status === 'critical' && elapsed >= clampInt(exploration.final?.criticalAtSec || exploration.totalSeconds);
  return { ...exploration, elapsedSeconds:elapsed, secondsLeft:Math.max(0, clampInt(exploration.totalSeconds) - elapsed), done, criticalNow, visibleLogs:(exploration.logs || []).filter(l => clampInt(l.atSec) <= elapsed) };
};
const latestSnapshot = (exploration, elapsed) => {
  let best = null, bestIndex = -1;
  const snapshots = Array.isArray(exploration?.snapshots) ? exploration.snapshots : [];
  snapshots.forEach((s, i) => {
    const at = clampInt(s?.atSec);
    if (at <= elapsed && (!best || at > clampInt(best.atSec) || (at === clampInt(best.atSec) && i > bestIndex))) {
      best = s;
      bestIndex = i;
    }
  });
  return { snapshot:best, index:bestIndex };
};
export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error:'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request));
  if (!user) return json({ error:'Login richiesto' }, 401);
  let character = await env.CHAT_MESSAGES.get(cKey(user), 'json').catch(() => null);
  if (!character) return json({ error:'Crea prima un personaggio HxH' }, 404);
  let exploration = await env.CHAT_MESSAGES.get(eKey(user), 'json').catch(() => null);
  if (!exploration || exploration.claimed || exploration.status === 'claimed') return json({ character:normalizeLevelXp(character), exploration:visible(exploration) });
  const view = visible(exploration);
  const { snapshot, index } = latestSnapshot(exploration, view.elapsedSeconds);
  if (snapshot && index > clampInt(exploration.appliedSnapshotIndex, -1)) {
    character = {
      ...character,
      health: snapshot.health || character.health,
      cards: Array.isArray(snapshot.cards) ? snapshot.cards : (character.cards || []),
      inventory: Array.isArray(snapshot.inventory) ? snapshot.inventory : (character.inventory || []),
      activeExploration: view.done ? null : character.activeExploration
    };
    if (snapshot.critical) {
      character.criticalState = true;
      character.criticalReason = 'testa a 0 durante esplorazione';
      character.criticalAt = new Date().toISOString();
      character.activeExploration = null;
      exploration.status = 'critical';
    }
    exploration.appliedSnapshotIndex = index;
    exploration.appliedSnapshotAt = snapshot.atSec;
  }
  if (view.done && exploration.status !== 'claimed') {
    exploration.status = exploration.status === 'critical' ? 'critical' : 'done';
    character.activeExploration = null;
  }
  character = normalizeLevelXp(character);
  await env.CHAT_MESSAGES.put(cKey(user), JSON.stringify({ ...character, updatedAt:new Date().toISOString() }));
  await env.CHAT_MESSAGES.put(eKey(user), JSON.stringify(exploration));
  return json({ character, exploration:visible(exploration) });
}
