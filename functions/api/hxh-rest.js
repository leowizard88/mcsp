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
const cityPlaces = new Set(['Masadora','Antokiba','Rubicuta','Dorias','Aiai','Limeiro','Bunzen','Soufrabi']);
const neutralPlaces = new Set(['Shiso tree','Casa senile','Isola sul lago','Accampamento misterioso','Farlands']);
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
  const character = { ...c, level, params:{ ...blankParams(), ...(c.params || {}) }, energy:clampInt(c.energy ?? maxEnergyFor(level), 0, maxEnergyFor(level)) };
  character.paramsEffective = effectiveParamsFor(character);
  character.health = normalizeHealth(character);
  character.healthFormulaVersion = 2;
  const max = maxHealthFor(character);
  character.stats = {
    ...(character.stats || {}),
    salute: character.health,
    saluteMax: max,
    generali:{
      ...(character.stats?.generali || {}),
      livello:level,
      energia:character.energy,
      energiaMax:maxEnergyFor(level),
      saluteGenerale:avg(character.health),
      saluteGeneraleMax:avg(max),
      puntiParametro:clampInt(character.paramPoints),
      jenny:clampInt(character.jenny),
      nen:1 + clampInt(character.paramsEffective.nen) * 4,
      nenMax:1 + clampInt(character.paramsEffective.nen) * 4
    }
  };
  character.restPenaltyActive = isFuture(character.restPenaltyUntil);
  character.restPenaltySecondsLeft = character.restPenaltyActive ? Math.ceil((Date.parse(character.restPenaltyUntil) - nowMs()) / 1000) : 0;
  character.restCooldownActive = isFuture(character.restCooldownUntil);
  character.restCooldownSecondsLeft = character.restCooldownActive ? Math.ceil((Date.parse(character.restCooldownUntil) - nowMs()) / 1000) : 0;
  return character;
};
const publicCharacter = c => normalizeCharacter(c);

export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error:'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request));
  if (!user) return json({ error:'Login richiesto' }, 401);
  const key = characterKey(user);
  let character = await env.CHAT_MESSAGES.get(key, 'json').catch(() => null);
  if (!character) return json({ error:'Crea prima un personaggio HxH' }, 404);
  character = normalizeCharacter(character);
  if (isFuture(character.exhaustionUntil)) return json({ error:'Esaurimento attivo: non puoi riposare ora.' }, 403);
  if (isFuture(character.sleepUntil)) return json({ error:'Stai dormendo: non puoi riposare ora.' }, 403);
  if (!cityPlaces.has(character.location) && !neutralPlaces.has(character.location)) return json({ error:'Puoi riposare solo nelle città e nelle zone neutre.' }, 403);
  if (isFuture(character.restCooldownUntil)) return json({ error:`Puoi riposare di nuovo tra ${Math.ceil(character.restCooldownSecondsLeft / 60)} minuti.` }, 403);

  const prePenalty = { ...character, restPenaltyUntil:null };
  const preMax = maxHealthFor(prePenalty);
  const current = normalizeHealth(prePenalty);
  const healed = Object.fromEntries(Object.entries(preMax).map(([k,max]) => {
    const cur = clampInt(current[k], 0, max);
    if (cur >= max) return [k, max];
    return [k, Math.min(max, cur + Math.max(1, Math.ceil(max * 0.30)))];
  }));

  character.energy = maxEnergyFor(character.level);
  character.energyUpdatedAt = new Date().toISOString();
  character.health = healed;
  character.healthFormulaVersion = 2;
  character.fatigue = 0;
  character.fatigueUpdatedAt = null;
  character.restPenaltyUntil = new Date(nowMs() + 600000).toISOString();
  character.restCooldownUntil = new Date(nowMs() + 10800000).toISOString();
  character.updatedAt = new Date().toISOString();
  character = normalizeCharacter(character);
  await env.CHAT_MESSAGES.put(key, JSON.stringify(character));
  return json({ character:publicCharacter(character), rested:true, healed:true });
}
