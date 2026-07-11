const HEADERS = { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers:HEADERS });
const clean = v => String(v || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
const bearer = request => { const auth = request.headers.get('authorization') || ''; return auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : request.headers.get('x-mancuspie-token') || ''; };
const getUserByToken = async (env, token) => { if (!env.CHAT_MESSAGES || !token) return null; const session = await env.CHAT_MESSAGES.get(`auth:session:${token}`, 'json').catch(() => null); if (!session?.userId) return null; return await env.CHAT_MESSAGES.get(`auth:user:${session.userId}`, 'json').catch(() => null); };
const characterKey = user => `hxh:character:${user.id}`;
const nowMs = () => Date.now();
const clampInt = (v, min = 0, max = 999999) => Math.max(min, Math.min(max, Math.floor(Number(v) || 0)));
const PARAMS = ['forza','robustezza','nen','intelligenza','malizia','agilita','oratoria','percezione'];
const healthBase = { testa:5, corpo:8, braccioDx:6, braccioSx:6, gambaDx:7, gambaSx:7 };
const blankParams = () => Object.fromEntries(PARAMS.map(k => [k, 0]));
const isFuture = v => v && Date.parse(v) > nowMs();
const maxEnergyFor = level => 3 + ((clampInt(level, 1) - 1) * 2);
const effectiveParamsFor = c => {
  const base = { ...blankParams(), ...(c?.params || {}) };
  if (!isFuture(c?.restPenaltyUntil)) return base;
  return Object.fromEntries(Object.entries(base).map(([k,v]) => [k, Math.max(0, clampInt(v) - 1)]));
};
const maxHealthFor = c => {
  const p = effectiveParamsFor(c);
  const level = clampInt(c?.level || 1, 1);
  return Object.fromEntries(Object.entries(healthBase).map(([k,b]) => [k, b + clampInt(p.robustezza) * 2 + Math.max(0, level - 1)]));
};
const normalizeHealth = c => {
  const max = maxHealthFor(c);
  const raw = c?.health && typeof c.health === 'object' ? c.health : {};
  return Object.fromEntries(Object.entries(max).map(([k,v]) => [k, clampInt(raw[k] ?? v, 0, v)]));
};
const avg = obj => Math.ceil(Object.values(obj).reduce((a,b) => a + b, 0) / Object.values(obj).length);
const normalizeCharacter = c => {
  if (!c) return null;
  const level = clampInt(c.level || 1, 1);
  const next = { ...c, level, params:{ ...blankParams(), ...(c.params || {}) } };
  next.paramsEffective = effectiveParamsFor(next);
  next.energy = clampInt(next.energy ?? maxEnergyFor(level), 0, maxEnergyFor(level));
  next.health = normalizeHealth(next);
  next.healthFormulaVersion = 2;
  if (next.exhaustionUntil && !isFuture(next.exhaustionUntil)) {
    next.exhaustionUntil = null;
    next.fatigue = 0;
    next.fatigueUpdatedAt = null;
    next.energy = maxEnergyFor(level);
    next.energyUpdatedAt = new Date().toISOString();
  }
  if (next.restPenaltyUntil && !isFuture(next.restPenaltyUntil)) next.restPenaltyUntil = null;
  if (next.sleepUntil && !isFuture(next.sleepUntil)) { next.sleepUntil = null; next.sleepLocation = null; }
  const max = maxHealthFor(next);
  next.stats = {
    ...(next.stats || {}),
    salute:next.health,
    saluteMax:max,
    generali:{
      ...(next.stats?.generali || {}),
      livello:level,
      energia:next.energy,
      energiaMax:maxEnergyFor(level),
      saluteGenerale:avg(next.health),
      saluteGeneraleMax:avg(max),
      puntiParametro:clampInt(next.paramPoints),
      jenny:clampInt(next.jenny),
      nen:1 + clampInt(next.paramsEffective.nen) * 4,
      nenMax:1 + clampInt(next.paramsEffective.nen) * 4,
      stato: clampInt(next.fatigue) >= 30 ? 'Esausto' : clampInt(next.fatigue) >= 20 ? 'Stanco' : clampInt(next.fatigue) >= 10 ? 'Affaticato' : 'Normale',
      statoValore:clampInt(next.fatigue)
    }
  };
  next.restPenaltyActive = isFuture(next.restPenaltyUntil);
  next.restPenaltySecondsLeft = next.restPenaltyActive ? Math.ceil((Date.parse(next.restPenaltyUntil) - nowMs()) / 1000) : 0;
  next.restCooldownActive = isFuture(next.restCooldownUntil);
  next.restCooldownSecondsLeft = next.restCooldownActive ? Math.ceil((Date.parse(next.restCooldownUntil) - nowMs()) / 1000) : 0;
  next.updatedAt = new Date().toISOString();
  return next;
};
const sig = c => JSON.stringify({ paramsEffective:c?.paramsEffective, restPenaltyUntil:c?.restPenaltyUntil || null, sleepUntil:c?.sleepUntil || null, exhaustionUntil:c?.exhaustionUntil || null, health:c?.health, energy:c?.energy, fatigue:c?.fatigue });

export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error:'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request));
  if (!user) return json({ error:'Login richiesto' }, 401);
  const key = characterKey(user);
  const raw = await env.CHAT_MESSAGES.get(key, 'json').catch(() => null);
  if (!raw) return json({ error:'Crea prima un personaggio HxH' }, 404);
  const next = normalizeCharacter(raw);
  const changed = sig(raw) !== sig(next);
  if (changed) await env.CHAT_MESSAGES.put(key, JSON.stringify(next));
  return json({ character:next, synced:changed });
}
