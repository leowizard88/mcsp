const HEADERS = { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers:HEADERS });
const clean = v => String(v || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
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
const PARAMS = ['forza','robustezza','nen','intelligenza','malizia','agilita','oratoria','percezione'];
const healthBase = { testa:5, corpo:8, braccioDx:6, braccioSx:6, gambaDx:7, gambaSx:7 };
const clampInt = (v, min = 0, max = 999999) => Math.max(min, Math.min(max, Math.floor(Number(v) || 0)));
const nowMs = () => Date.now();
const rnd = () => Math.random();
const rollInt = (min, max) => min + Math.floor(rnd() * (max - min + 1));
const chance = pct => rnd() * 100 < pct;
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const blankParams = () => Object.fromEntries(PARAMS.map(k => [k, 0]));
const paramsOf = c => ({ ...blankParams(), ...(c?.paramsEffective || c?.params || {}) });
const maxEnergyFor = level => 3 + ((clampInt(level, 1) - 1) * 2);
const nextXpFor = level => { let n = 10; for (let i = 1; i < clampInt(level, 1); i++) n += Math.ceil(n / 2); return n; };
const normalizeLevelXp = c => {
  let level = clampInt(c?.level, 1), xp = clampInt(c?.xp), points = clampInt(c?.paramPoints);
  while (xp >= nextXpFor(level)) { xp -= nextXpFor(level); level += 1; points += 3; }
  return { ...c, level, xp, nextXp:nextXpFor(level), paramPoints:points, energy:Math.min(clampInt(c?.energy ?? maxEnergyFor(level)), maxEnergyFor(level)) };
};
const applyEnergyRegen = c => {
  if (!c) return null;
  const character = normalizeLevelXp(c);
  const maxEnergy = maxEnergyFor(character.level);
  const current = clampInt(character.energy ?? maxEnergy, 0, maxEnergy);
  const last = Date.parse(character.energyUpdatedAt || character.updatedAt || character.createdAt || new Date().toISOString());
  if (current >= maxEnergy || !Number.isFinite(last)) return { ...character, energy:current, energyUpdatedAt:character.energyUpdatedAt || new Date().toISOString() };
  const ticks = Math.floor((nowMs() - last) / 600000);
  if (ticks <= 0) return { ...character, energy:current, energyUpdatedAt:character.energyUpdatedAt || new Date(last).toISOString() };
  return { ...character, energy:clampInt(current + ticks, 0, maxEnergy), energyUpdatedAt:new Date(last + ticks * 600000).toISOString() };
};
const maxHealthFor = c => {
  const p = paramsOf(c), level = clampInt(c?.level, 1);
  return Object.fromEntries(Object.entries(healthBase).map(([k,b]) => [k, b + clampInt(p.robustezza) * 2 + Math.max(0, level - 1)]));
};
const normalizeHealth = c => {
  const max = maxHealthFor(c), raw = c?.health && typeof c.health === 'object' ? c.health : {};
  return Object.fromEntries(Object.entries(max).map(([k,v]) => [k, clampInt(raw[k] ?? v, 0, v)]));
};
const readCharacter = (env, user) => env.CHAT_MESSAGES.get(characterKey(user), 'json').catch(() => null);
const saveCharacter = (env, user, c) => env.CHAT_MESSAGES.put(characterKey(user), JSON.stringify({ ...applyEnergyRegen(c), updatedAt:new Date().toISOString() }));
const readExplore = (env, user) => env.CHAT_MESSAGES.get(exploreKey(user), 'json').catch(() => null);
const saveExplore = (env, user, e) => env.CHAT_MESSAGES.put(exploreKey(user), JSON.stringify(e));
const deleteExplore = (env, user) => env.CHAT_MESSAGES.delete(exploreKey(user));
const addLog = (logs, atSec, text, kind = 'info') => logs.push({ id:`log-${logs.length + 1}-${Math.floor(atSec)}`, atSec:Math.max(0, Math.floor(atSec)), text, kind });

const DIFFICULTY = {
  nabbo:{ label:'Nabbo', energy:1, minutes:5, enemyChance:30, bonus:{ common:330, uncommon:125, rare:34, epic:2, none:509 }, accidents:[34,50,13,3], trapMod:0 },
  facile:{ label:'Facile', energy:2, minutes:15, enemyChance:38, bonus:{ common:370, uncommon:165, rare:50, epic:4, none:411 }, accidents:[30,50,16,4], trapMod:1 },
  medio:{ label:'Medio', energy:4, minutes:20, enemyChance:48, bonus:{ common:410, uncommon:210, rare:72, epic:7, none:301 }, accidents:[26,50,19,5], trapMod:2 },
  impegnativo:{ label:'Impegnativo', energy:5, minutes:30, enemyChance:58, bonus:{ common:450, uncommon:260, rare:105, epic:12, none:173 }, accidents:[22,48,23,7], trapMod:3 },
  hardcore:{ label:'Hardcore', energy:7, minutes:40, enemyChance:75, bonus:{ common:500, uncommon:310, rare:135, epic:20, none:35 }, accidents:[17,47,26,10], trapMod:5 }
};
const LOCATION_DIFFICULTY = { 'Foresta Oscura':'nabbo' };
const WILD = new Set(['Foresta Oscura','Villaggio di banditi','Badlands','Rovine infestate','Plateau Bye Bye']);
const bodyWeights = { corpo:32, gambaDx:18, gambaSx:18, braccioDx:14, braccioSx:14, testa:4 };
const rollWeighted = weights => {
  const entries = Object.entries(weights); let n = rnd() * entries.reduce((a,[,w]) => a + w, 0);
  for (const [k,w] of entries) if ((n -= w) <= 0) return k;
  return entries[0][0];
};
function freeSlot(cards) { const used = new Set((cards || []).map(c => clampInt(c.slot ?? c.number, -1, 999))); for (let i = 100; i <= 149; i++) if (!used.has(i)) return i; return 149; }
function spellSlot(cards) { const used = new Set((cards || []).map(c => String(c.slot || c.number || ''))); for (let i = 1; i <= 50; i++) { const s = `S${String(i).padStart(2,'0')}`; if (!used.has(s)) return s; } return 'S50'; }
function freeCard(id, name, rarity, description, transformable = false, item = null) { return { id:`${id}-${Date.now()}-${Math.random().toString(16).slice(2)}`, type:'card', cardType:'free', name, nome:name, rarity, rarita:rarity, description, descrizione:description, transformable, materializesTo:item, createdAt:new Date().toISOString() }; }
function numberedCard(id, number, name, rarity, limit, description, item = null) { return { id:`${id}-${Date.now()}-${Math.random().toString(16).slice(2)}`, type:'card', cardType:'specific', number, slot:number, name, nome:name, rarity, rarita:rarity, globalLimit:limit, limiteGlobale:limit, description, descrizione:description, transformable:!!item, materializesTo:item, createdAt:new Date().toISOString() }; }
function spellCard(name, rarity) { return { id:`spell-${Date.now()}-${Math.random().toString(16).slice(2)}`, type:'spell', cardType:'spell', spell:true, name, nome:name, rarity, rarita:rarity, description:`Incantesimo ${rarity} trovato durante l'esplorazione.`, descrizione:`Incantesimo ${rarity} trovato durante l'esplorazione.`, createdAt:new Date().toISOString() }; }
function addCard(cards, card) { const c = { ...card }; if (c.cardType === 'free' && !(c.slot || c.number)) c.slot = c.number = freeSlot(cards); if (c.cardType === 'spell' && !(c.slot || c.number)) c.slot = c.number = spellSlot(cards); cards.push(c); return c; }
const pushNamed = (list, obj) => list.push(obj?.name || obj?.nome || obj || 'sconosciuto');
const ENEMIES = {
  goblin:{ key:'goblin', name:'Goblin', hp:7, damage:3, exp:[1,3], jenny:[0,900], miss:50, dodge:5, loot:[
    { p:100, card:() => freeCard('goblin-card', 'Carta Goblin', 'E', 'La carta di un goblin schifoso forse vale qualche Jenny', false) },
    { p:25, card:() => freeCard('goblin-club-card', 'Carta Mazza Goblin', 'E', "La mazza di un goblin, trasformala per avere un'arma!", true, { id:'item-mazza-goblin', name:'Mazza Goblin', nome:'Mazza Goblin', rarity:'comune', rarita:'comune', description:"Un'arma noiosa e poco affidabile", descrizione:"Un'arma noiosa e poco affidabile", damageMod:1, dannoMod:1, weapon:true }) },
    { p:10, card:() => numberedCard('goblin-tooth-088', 88, 'Dente Goblin', 'D', 65, 'Un raro dente goblin, potrebbe servire per craftare qualcosa.', { id:'item-dente-goblin', name:'Dente Goblin', nome:'Dente Goblin', rarity:'non comune', rarita:'non comune', description:'Se solo sapessi con cosa unirlo potrei costruire qualcosa...', descrizione:'Se solo sapessi con cosa unirlo potrei costruire qualcosa...' }) }
  ]},
  goat:{ key:'goat', name:'Vecchia Capra', hp:8, damage:4, exp:[1,3], jenny:[0,450], miss:60, dodge:0, loot:[{ p:100, card:() => freeCard('goat-card', 'Carta Capra', 'E', 'La carta di una capra qualunque, forse qualche mercante potrebbe essere interessato', false) }]},
  bossGoblin:{ key:'bossGoblin', name:'Capo Goblin', hp:12, damage:3, exp:[5,10], jenny:[1500,3400], miss:20, dodge:30, loot:[
    { p:55, card:() => freeCard('goblin-camp-card', 'Carta Accampamento Goblin', 'C', 'Se trasformata può diventare un oggetto unico al 30%, al 70% si rompe.', true, { specialTransform:'goblin-camp', chance:30, id:'item-multiattrezzo-goblinoide', name:'Multiattrezzo Goblinoide', nome:'Multiattrezzo Goblinoide', rarity:'raro', rarita:'raro', description:'Un attrezzo storto, astuto, quasi vivo. Fa tante cose male, ma le fa.', descrizione:'Un attrezzo storto, astuto, quasi vivo. Fa tante cose male, ma le fa.' }) },
    { p:12, card:() => numberedCard('glass-eye-073', 73, 'Carta Occhio di Vetro', 'C', 50, 'La carta più rara conservata dai goblin! Se trasformata può diventare uno strumento utile.', { id:'item-occhio-di-vetro', name:'Occhio di Vetro', nome:'Occhio di Vetro', rarity:'raro', rarita:'raro', description:'Un occhio freddo e traslucido. Vede cose che forse non vuoi vedere.', descrizione:'Un occhio freddo e traslucido. Vede cose che forse non vuoi vedere.' }) }
  ]}
};
function snapshot(state, atSec) { state.snapshots.push({ atSec:Math.floor(atSec), health:structuredClone(state.health), cards:structuredClone(state.cards), inventory:structuredClone(state.inventory), xp:state.startXp, jenny:state.startJenny, critical:state.critical }); }
function generalHealth(health) { const vals = Object.values(health || {}).map(v => clampInt(v)); return vals.length ? Math.round(vals.reduce((a,b) => a + b, 0) / vals.length) : 0; }
function enemyByPool(state) { let roll = rollInt(1,100), enemy = roll <= 65 ? ENEMIES.goblin : roll <= 92 ? ENEMIES.goat : ENEMIES.bossGoblin; if (state.lastEnemyKey === 'bossGoblin' && enemy.key === 'bossGoblin') enemy = chance(70) ? ENEMIES.goblin : ENEMIES.goat; state.lastEnemyKey = enemy.key; return enemy; }
function playerDamage(character, health) { const p = paramsOf(character), inv = Array.isArray(character.inventory) ? character.inventory : []; const weapon = inv.filter(i => i?.weapon || i?.damageMod || i?.dannoMod).sort((a,b) => clampInt(b.damageMod ?? b.dannoMod) - clampInt(a.damageMod ?? a.dannoMod))[0]; let damage = 2 + clampInt(p.forza) + clampInt(weapon?.damageMod ?? weapon?.dannoMod); if (['braccioDx','braccioSx','gambaDx','gambaSx'].some(k => clampInt(health[k]) <= 0)) damage = Math.max(1, Math.floor(damage * 0.5)); return { damage, weaponName:weapon?.name || weapon?.nome || 'mani nude' }; }
const enemyHitDamage = (raw, robustezza) => Math.max(1, Math.round(raw * (1 - Math.min(0.60, clampInt(robustezza) * 0.02))));
function handleZeroParts(logs, state, atSec) {
  const max = state.maxHealth;
  if (state.health.testa <= 0) { addLog(logs, atSec, 'La testa è a 0. Stato critico: esplorazione cancellata.', 'bad'); state.critical = true; state.criticalAtSec = atSec; snapshot(state, atSec); return; }
  if (state.health.corpo <= 0) { addLog(logs, atSec, 'Corpo a 0. Crolli a terra: recupero fisico necessario.', 'bad'); state.health.corpo = Math.max(1, Math.ceil(max.corpo * 0.5)); addLog(logs, atSec, 'Ti sei ripreso. Corpo ripristinato al 50%.', 'good'); snapshot(state, atSec); }
  if (state.health.braccioDx <= 0 && state.health.braccioSx <= 0) { addLog(logs, atSec, 'Entrambe le braccia sono a 0. Recupero fisico necessario.', 'bad'); state.health.braccioDx = Math.max(1, Math.ceil(max.braccioDx * 0.5)); state.health.braccioSx = Math.max(1, Math.ceil(max.braccioSx * 0.5)); addLog(logs, atSec, 'Braccia ripristinate al 50%.', 'good'); snapshot(state, atSec); }
  if (state.health.gambaDx <= 0 && state.health.gambaSx <= 0) { addLog(logs, atSec, 'Entrambe le gambe sono a 0. Recupero fisico necessario.', 'bad'); state.health.gambaDx = Math.max(1, Math.ceil(max.gambaDx * 0.5)); state.health.gambaSx = Math.max(1, Math.ceil(max.gambaSx * 0.5)); addLog(logs, atSec, 'Gambe ripristinate al 50%.', 'good'); snapshot(state, atSec); }
}
function simulateCombat(logs, state, atSec) {
  const enemy = enemyByPool(state), p = paramsOf(state.character); let enemyHp = enemy.hp;
  addLog(logs, atSec, `Nemico incontrato! ${enemy.name}!`, 'bad');
  addLog(logs, atSec, `Inizializzo il combattimento: ${enemy.name} ha ${enemy.hp} punti vita.`, 'info');
  for (let round = 1; round <= 20 && enemyHp > 0 && !state.critical; round++) {
    if (chance(Math.max(5, 40 - clampInt(p.agilita) * 2))) addLog(logs, atSec, 'Attacchi ma manchi il colpo.', 'info');
    else if (chance(enemy.dodge)) addLog(logs, atSec, `${enemy.name} schiva il tuo attacco.`, 'info');
    else { const pd = playerDamage(state.character, state.health); enemyHp = Math.max(0, enemyHp - pd.damage); addLog(logs, atSec, `Attacchi con ${pd.weaponName} e causi ${pd.damage} danni. ${enemy.name}: ${enemyHp}/${enemy.hp}.`, 'good'); }
    if (enemyHp <= 0) break;
    if (chance(enemy.miss)) addLog(logs, atSec, `${enemy.name} attacca ma manca il colpo.`, 'info');
    else if (chance(Math.min(80, 5 + clampInt(p.agilita) * 2))) addLog(logs, atSec, `${enemy.name} ti attacca ma riesci a schivare.`, 'good');
    else { const part = rollWeighted(bodyWeights), entered = enemyHitDamage(enemy.damage, p.robustezza); state.health[part] = Math.max(0, clampInt(state.health[part]) - entered); addLog(logs, atSec, `${enemy.name} ti colpisce a ${part}: ${entered} danni entrati.`, 'bad'); snapshot(state, atSec); handleZeroParts(logs, state, atSec); if (state.critical) return; }
  }
  if (enemyHp > 0) { addLog(logs, atSec, `${enemy.name} si ritira nel buio della Foresta Oscura.`, 'info'); snapshot(state, atSec); return; }
  state.summary.killed[enemy.name] = (state.summary.killed[enemy.name] || 0) + 1;
  const exp = rollInt(enemy.exp[0], enemy.exp[1]), jenny = rollInt(enemy.jenny[0], enemy.jenny[1]);
  state.rewardXp += exp; state.rewardJenny += jenny; state.summary.exp += exp; state.summary.jenny += jenny;
  addLog(logs, atSec, `${enemy.name} è esausto. Ottenuti ${exp} EXP e ${jenny} Jenny.`, 'good');
  for (const loot of enemy.loot) if (chance(loot.p)) { const card = addCard(state.cards, loot.card()); state.rewardCards.push(card); pushNamed(state.summary.cardsGained, card); addLog(logs, atSec, `Ottenuta ${card.name || card.nome}!`, 'good'); }
  snapshot(state, atSec);
}
function minuteEvent(logs, state, atSec) {
  const r = rnd() * 100;
  if (r < 89) return;
  if (r < 94) { const cards = state.cards.filter(c => !c.spell && ['E','D','C'].includes(String(c.rarity || c.rarita || '').toUpperCase()) && c.id !== 'free-greed-island-pig'); if (!cards.length) return addLog(logs, atSec, 'Un furfante ti gira attorno, ma non trova carte rubabili.', 'info'); const stolen = pick(cards); state.cards = state.cards.filter(c => c.id !== stolen.id); pushNamed(state.summary.cardsLost, stolen); addLog(logs, atSec, `Un furfante ti ha rubato la carta ${stolen.name || stolen.nome}!`, 'bad'); snapshot(state, atSec); return; }
  const spell = addCard(state.cards, spellCard(`Incantesimo del viaggiatore ${rollInt(1,99)}`, chance(78) ? 'E' : 'D')); state.rewardCards.push(spell); pushNamed(state.summary.cardsGained, spell); addLog(logs, atSec, `Incontri un viaggiatore misterioso che lascia cadere per terra ${spell.name}!`, 'good'); snapshot(state, atSec);
}
function rollBonus(diffKey, inventory) {
  const b = DIFFICULTY[diffKey].bonus, total = b.common + b.uncommon + b.rare + b.epic + b.none; let n = Math.floor(rnd() * total) + 1;
  for (const [key,label,weight] of [['common','comune',b.common],['uncommon','non comune',b.uncommon],['rare','raro',b.rare],['epic','epico',b.epic],['none','nulla',b.none]]) { n -= weight; if (n <= 0) { if (key === 'none') return null; const names = { common:['Radice secca','Sasso levigato','Fungo pallido'], uncommon:['Pietra nervosa','Fiala crepata','Semi blu'], rare:['Scheggia di nen','Moneta verde rara'], epic:['Frammento epico di Greed Island'] }; const name = pick(names[key]); const item = { id:`bonus-${key}-${Date.now()}-${Math.random().toString(16).slice(2)}`, type:'item', name, nome:name, rarity:label, rarita:label, description:`Oggetto ${label} trovato nel modulo bonus.`, descrizione:`Oggetto ${label} trovato nel modulo bonus.`, createdAt:new Date().toISOString() }; inventory.push(item); return item; } }
  return null;
}
function rollAccidentCount(diffKey) { const w = DIFFICULTY[diffKey].accidents; let n = rnd() * w.reduce((a,b) => a + b, 0); for (let i = 0; i < w.length; i++) if ((n -= w[i]) <= 0) return i; return 0; }
const modeLabel = mode => mode === 'zetsu' ? 'Zetsu attivo' : 'Scoperta';
const enemyChanceFor = (mode, diff, p) => mode === 'zetsu' ? Math.max(10, diff.enemyChance - clampInt(p.nen) * 2) : diff.enemyChance;
const logOrder = l => Number(String(l.id || '').match(/^log-(\d+)-/)?.[1] || 0);
function buildExploration(character, mode) {
  const location = clean(character.location || 'Shiso tree');
  if (!WILD.has(location)) throw new Error('Esplora è disponibile solo nelle zone selvagge.');
  if (location !== 'Foresta Oscura') throw new Error('Per ora i mostri sono implementati solo in Foresta Oscura.');
  const diffKey = LOCATION_DIFFICULTY[location] || 'nabbo', diff = DIFFICULTY[diffKey], p = paramsOf(character);
  const durationMin = Math.max(5, diff.minutes - clampInt(p.agilita));
  const moduleMin = Math.max(1, Math.floor(durationMin / 5));
  const remainderMin = durationMin - moduleMin * 5;
  const enemyChance = enemyChanceFor(mode, diff, p);
  const logs = [], startHealth = normalizeHealth(character), startGeneral = generalHealth(startHealth);
  const state = { character, health:structuredClone(startHealth), maxHealth:maxHealthFor(character), cards:[...(Array.isArray(character.cards) ? character.cards : [])], inventory:[...(Array.isArray(character.inventory) ? character.inventory : [])], rewardCards:[], startXp:clampInt(character.xp), startJenny:clampInt(character.jenny), rewardXp:0, rewardJenny:0, critical:false, criticalAtSec:null, lastEnemyKey:null, snapshots:[], summary:{ killed:{}, jenny:0, exp:0, cardsGained:[], itemsGained:[], healthLost:0, cardsLost:[], itemsLost:[] } };
  snapshot(state, 0);
  addLog(logs, 0, `Esplorazione avviata in ${location}. Modalità ${modeLabel(mode)}. Durata base effettiva: ${durationMin} minuti.`, 'system');
  addLog(logs, 0, `Modulo normale: ${moduleMin} minuti. ${remainderMin > 0 ? `Modulo bonus finale: ${remainderMin} minuti.` : 'Nessun modulo bonus.'}`, 'system');
  const events = [];
  for (let m = 1; m <= durationMin; m++) events.push({ t:m * 60, type:'minute' });
  for (let i = 1; i <= 5; i++) events.push({ t:Math.max(1, i * moduleMin) * 60, type:'enemy' });
  for (let block = 0; block < Math.floor(durationMin / 10); block++) { const used = []; for (let i = 0; i < rollAccidentCount(diffKey); i++) { let sec = block * 600 + rollInt(1, 599), tries = 0; while (used.some(x => Math.abs(x - sec) < 130) && tries++ < 20) sec = block * 600 + rollInt(1, 599); used.push(sec); events.push({ t:sec, type:'accident' }); } }
  events.sort((a,b) => a.t - b.t || (a.type === 'accident' ? -1 : 1));
  for (const ev of events) {
    if (state.critical) break; const at = ev.t;
    if (ev.type === 'minute') minuteEvent(logs, state, at);
    if (ev.type === 'enemy') { if (chance(enemyChance)) simulateCombat(logs, state, at); else addLog(logs, at, 'Nessun nemico incontrato nel modulo.', 'info'); }
    if (ev.type === 'accident') { const part = pick(['corpo','braccioDx','braccioSx','gambaDx','gambaSx']); const damage = 4 + Math.floor((clampInt(character.level, 1) - 1) / 2) + diff.trapMod; state.health[part] = Math.max(0, clampInt(state.health[part]) - damage); addLog(logs, at, `Sei inciampato in una trappola della location! Hai preso ${damage} danni a ${part}.`, 'bad'); snapshot(state, at); handleZeroParts(logs, state, at); }
  }
  let totalSeconds = durationMin * 60;
  if (!state.critical && remainderMin > 0) { const item = rollBonus(diffKey, state.inventory); if (item) { pushNamed(state.summary.itemsGained, item); addLog(logs, totalSeconds, `Modulo bonus: trovato ${item.name} (${item.rarity}).`, 'good'); } else addLog(logs, totalSeconds, 'Modulo bonus: non hai trovato nulla.', 'info'); snapshot(state, totalSeconds); }
  state.summary.healthLost = Math.max(0, startGeneral - generalHealth(state.health));
  if (state.critical) totalSeconds = Math.floor(state.criticalAtSec || totalSeconds); else addLog(logs, totalSeconds, 'Esplorazione conclusa. Puoi vedere i risultati.', 'system');
  snapshot(state, totalSeconds);
  logs.sort((a,b) => a.atSec - b.atSec || logOrder(a) - logOrder(b)); state.snapshots.sort((a,b) => a.atSec - b.atSec);
  return { id:crypto.randomUUID(), location, difficulty:diffKey, difficultyLabel:diff.label, mode, modeLabel:modeLabel(mode), status:state.critical ? 'critical' : 'active', startedAt:new Date().toISOString(), totalSeconds, baseMinutes:durationMin, moduleMinutes:moduleMin, bonusMinutes:remainderMin, enemyChance, antiRepeatBoss:true, logs, snapshots:state.snapshots, appliedSnapshotAt:0, summary:state.summary, final:{ health:state.health, cards:state.cards, inventory:state.inventory, xp:state.startXp + state.rewardXp, jenny:state.startJenny + state.rewardJenny, rewardCards:state.rewardCards, critical:state.critical, criticalAtSec:state.criticalAtSec }, claimed:false };
}
function visibleExploration(e) { if (!e) return null; const elapsed = Math.max(0, Math.floor((Date.now() - Date.parse(e.startedAt || new Date().toISOString())) / 1000)); const done = elapsed >= clampInt(e.totalSeconds); const critical = e.status === 'critical' && elapsed >= clampInt(e.final?.criticalAtSec || e.totalSeconds); return { ...e, elapsedSeconds:elapsed, secondsLeft:Math.max(0, clampInt(e.totalSeconds) - elapsed), done, criticalNow:critical, visibleLogs:(e.logs || []).filter(l => clampInt(l.atSec) <= elapsed) }; }
function latestSnapshot(e, elapsed) { return (e?.snapshots || []).filter(s => clampInt(s.atSec) <= elapsed).sort((a,b) => b.atSec - a.atSec)[0] || null; }
async function applyProgress(env, user, character, exploration) {
  const view = visibleExploration(exploration), snap = latestSnapshot(exploration, view?.elapsedSeconds || 0);
  if (!snap || clampInt(snap.atSec) <= clampInt(exploration.appliedSnapshotAt)) return applyEnergyRegen(character);
  let next = { ...character, health:snap.health || character.health, cards:snap.cards || character.cards || [], inventory:snap.inventory || character.inventory || [], activeExploration: view?.done ? null : character.activeExploration };
  if (snap.critical) next = { ...next, criticalState:true, criticalReason:'testa a 0 durante esplorazione', criticalAt:new Date().toISOString(), activeExploration:null };
  next = applyEnergyRegen(next); await saveCharacter(env, user, next);
  exploration.appliedSnapshotAt = snap.atSec; if (snap.critical) exploration.status = 'critical'; if (view?.done && exploration.status !== 'claimed') exploration.status = exploration.status === 'critical' ? 'critical' : 'done';
  await saveExplore(env, user, exploration); return next;
}
async function claimRewards(env, user, character, exploration) {
  const view = visibleExploration(exploration);
  if (!view.done) throw new Error('Esplorazione ancora in corso.');
  if (exploration.final?.critical) throw new Error('Esplorazione cancellata: sei in stato critico.');
  if (!exploration.rewardsPaid) character = { ...character, health:exploration.final?.health || character.health, cards:Array.isArray(exploration.final?.cards) ? exploration.final.cards : (character.cards || []), inventory:Array.isArray(exploration.final?.inventory) ? exploration.final.inventory : (character.inventory || []), xp:clampInt(exploration.final?.xp, clampInt(character.xp)), jenny:clampInt(exploration.final?.jenny, clampInt(character.jenny)), paramPoints:clampInt(character.paramPoints) + 2, activeExploration:null };
  else character = { ...character, activeExploration:null };
  character = applyEnergyRegen(character); exploration.summary = { ...(exploration.summary || {}), paramPointsGained:2 }; exploration.claimed = true; exploration.status = 'claimed'; exploration.rewardsPaid = true; exploration.rewardsPaidAt = new Date().toISOString();
  await saveCharacter(env, user, character); await saveExplore(env, user, exploration); return character;
}
export async function onRequestGet({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error:'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request)); if (!user) return json({ error:'Login richiesto' }, 401);
  let character = applyEnergyRegen(await readCharacter(env, user)); if (!character) return json({ error:'Crea prima un personaggio HxH' }, 404);
  await saveCharacter(env, user, character);
  let exploration = await readExplore(env, user); if (exploration) character = await applyProgress(env, user, character, exploration); exploration = await readExplore(env, user);
  return json({ character, exploration:visibleExploration(exploration) });
}
export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error:'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request)); if (!user) return json({ error:'Login richiesto' }, 401);
  let data; try { data = await request.json(); } catch { return json({ error:'JSON non valido' }, 400); }
  const action = clean(data.action).toLowerCase(); let character = applyEnergyRegen(await readCharacter(env, user)); if (!character) return json({ error:'Crea prima un personaggio HxH' }, 404);
  await saveCharacter(env, user, character);
  if (action === 'die') { if (!character.criticalState) return json({ error:'Puoi morire solo in stato critico.' }, 403); await env.CHAT_MESSAGES.delete(characterKey(user)); await deleteExplore(env, user); return json({ dead:true }); }
  if (character.criticalState) return json({ error:'Stato critico: puoi solo usare una carta cura o morire.' }, 403);
  let exploration = await readExplore(env, user);
  if (action === 'start') {
    if (exploration && !exploration.claimed && visibleExploration(exploration)?.status !== 'claimed') return json({ error:'Hai già un’esplorazione in corso o da riscuotere.' }, 403);
    const requestedMode = clean(data.mode).toLowerCase(); const mode = requestedMode.includes('zetsu') ? 'zetsu' : 'scoperta';
    const location = clean(character.location || 'Shiso tree'), diffKey = LOCATION_DIFFICULTY[location] || 'nabbo', cost = DIFFICULTY[diffKey].energy;
    if (clampInt(character.energy) < cost) return json({ error:`Energia insufficiente: servono ${cost} punti energia.` }, 403);
    const exp = buildExploration(character, mode);
    character.energy = clampInt(character.energy) - cost; character.energyUpdatedAt = new Date().toISOString(); character.activeExploration = { id:exp.id, location:exp.location, startedAt:exp.startedAt, totalSeconds:exp.totalSeconds };
    await saveCharacter(env, user, character); await saveExplore(env, user, exp);
    return json({ character:applyEnergyRegen(character), exploration:visibleExploration(exp) });
  }
  if (!exploration) return json({ error:'Nessuna esplorazione attiva.' }, 404);
  character = await applyProgress(env, user, character, exploration); exploration = await readExplore(env, user);
  if (action === 'claim') { try { character = await claimRewards(env, user, character, exploration); } catch (err) { return json({ error:err.message }, 403); } return json({ character, exploration:null, claimed:true, summary:exploration.summary || null }); }
  if (action === 'clear') { await deleteExplore(env, user); character.activeExploration = null; await saveCharacter(env, user, character); return json({ character, exploration:null }); }
  return json({ error:'Azione non valida' }, 400);
}
