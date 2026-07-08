const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });
const clean = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
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
const characterKey = user => `hxh:character:${user.id}`;
const exploreKey = user => `hxh:explore:${user.id}`;
const PARAMS = ['forza','robustezza','nen','intelligenza','malizia','agilita','oratoria','percezione'];
const healthBase = { testa:5, corpo:8, braccioDx:6, braccioSx:6, gambaDx:7, gambaSx:7 };
const clampInt = (value, min = 0, max = 999999) => Math.max(min, Math.min(max, Math.floor(Number(value) || 0)));
const nowMs = () => Date.now();
const blankParams = () => Object.fromEntries(PARAMS.map(k => [k, 0]));
const effectiveParams = c => ({ ...blankParams(), ...(c?.params || {}) });
const maxEnergyFor = level => 3 + ((clampInt(level, 1) - 1) * 2);
const healthPart = (base, robustezza, level) => base + (clampInt(robustezza) * 2) + Math.max(0, clampInt(level, 1) - 1);
const maxHealthFor = c => {
  const p = effectiveParams(c);
  const level = clampInt(c?.level, 1);
  return Object.fromEntries(Object.entries(healthBase).map(([k, base]) => [k, healthPart(base, p.robustezza, level)]));
};
const normalizeHealth = c => {
  const max = maxHealthFor(c);
  const raw = c?.health && typeof c.health === 'object' ? c.health : {};
  return Object.fromEntries(Object.entries(max).map(([k,v]) => [k, clampInt(raw[k] ?? v, 0, v)]));
};
const readCharacter = async (env, user) => env.CHAT_MESSAGES.get(characterKey(user), 'json').catch(() => null);
const saveCharacter = async (env, user, character) => env.CHAT_MESSAGES.put(characterKey(user), JSON.stringify({ ...character, updatedAt:new Date().toISOString() }));
const readExplore = async (env, user) => env.CHAT_MESSAGES.get(exploreKey(user), 'json').catch(() => null);
const saveExplore = async (env, user, exploration) => env.CHAT_MESSAGES.put(exploreKey(user), JSON.stringify(exploration));
const deleteExplore = async (env, user) => env.CHAT_MESSAGES.delete(exploreKey(user));
const rnd = () => Math.random();
const rollInt = (min, max) => min + Math.floor(rnd() * (max - min + 1));
const chance = pct => rnd() * 100 < pct;
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const fmtClock = sec => {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}:${String(s).padStart(2,'0')}` : `${m}`;
};
const addLog = (logs, atSec, text, kind = 'info') => logs.push({ id:`log-${logs.length + 1}-${Math.floor(atSec)}`, atSec:Math.max(0, Math.floor(atSec)), text, kind });

const DIFFICULTY = {
  nabbo:{ label:'Nabbo', energy:1, minutes:5, enemyChance:40, bonus:{ common:400, uncommon:200, rare:99, epic:1, none:300 }, accidents:[25,55,17,3], trapMod:0 },
  facile:{ label:'Facile', energy:2, minutes:15, enemyChance:50, bonus:{ common:450, uncommon:250, rare:120, epic:3, none:177 }, accidents:[22,55,19,4], trapMod:1 },
  medio:{ label:'Medio', energy:4, minutes:20, enemyChance:60, bonus:{ common:500, uncommon:300, rare:150, epic:6, none:44 }, accidents:[18,54,22,6], trapMod:2 },
  impegnativo:{ label:'Impegnativo', energy:5, minutes:30, enemyChance:70, bonus:{ common:550, uncommon:350, rare:180, epic:10, none:0 }, accidents:[14,52,25,9], trapMod:3 },
  hardcore:{ label:'Hardcore', energy:7, minutes:40, enemyChance:100, bonus:{ common:600, uncommon:400, rare:220, epic:20, none:0 }, accidents:[10,48,30,12], trapMod:5 }
};
const LOCATION_DIFFICULTY = { 'Foresta Oscura':'nabbo' };
const WILD = new Set(['Foresta Oscura','Villaggio di banditi','Badlands','Rovine infestate','Plateau Bye Bye']);
const bodyParts = ['corpo','gambaDx','gambaSx','braccioDx','braccioSx','testa'];
const bodyWeights = { corpo:32, gambaDx:18, gambaSx:18, braccioDx:14, braccioSx:14, testa:4 };
const rollWeighted = weights => {
  const entries = Object.entries(weights);
  const total = entries.reduce((a, [,w]) => a + w, 0);
  let n = rnd() * total;
  for (const [k,w] of entries) { if ((n -= w) <= 0) return k; }
  return entries[0][0];
};
const ENEMIES = {
  goblin:{ name:'Goblin', hp:7, damage:3, exp:[1,3], jenny:[0,1000], weight:60, miss:50, dodge:5,
    loot:[
      { p:100, card:() => freeCard('goblin-card', 'Carta Goblin', 'E', 'La carta di un goblin schifoso forse vale qualche Jenny', false) },
      { p:50, card:() => freeCard('goblin-club-card', 'Carta Mazza Goblin', 'E', "La mazza di un goblin, trasformala per avere un'arma!", true, { id:'item-mazza-goblin', name:'Mazza Goblin', nome:'Mazza Goblin', rarity:'comune', rarita:'comune', description:"Un'arma noiosa e poco affidabile", descrizione:"Un'arma noiosa e poco affidabile", damageMod:1, dannoMod:1, weapon:true }) },
      { p:20, card:() => numberedCard('goblin-tooth-088', 88, 'Dente Goblin', 'D', 65, 'Un raro dente goblin, potrebbe servire per craftare qualcosa.', { id:'item-dente-goblin', name:'Dente Goblin', nome:'Dente Goblin', rarity:'non comune', rarita:'non comune', description:'Se solo sapessi con cosa unirlo potrei costruire qualcosa...', descrizione:'Se solo sapessi con cosa unirlo potrei costruire qualcosa...' }) }
    ]},
  goat:{ name:'Vecchia Capra', hp:8, damage:4, exp:[1,3], jenny:[0,500], weight:30, miss:60, dodge:0,
    loot:[{ p:100, card:() => freeCard('goat-card', 'Carta Capra', 'E', 'La carta di una capra qualunque, forse qualche mercante potrebbe essere interessato', false) }]},
  bossGoblin:{ name:'Capo Goblin', hp:12, damage:3, exp:[5,10], jenny:[2000,4000], weight:10, miss:20, dodge:30,
    loot:[
      { p:90, card:() => freeCard('goblin-camp-card', 'Carta Accampamento Goblin', 'C', 'Se trasformata può diventare un oggetto unico al 30%, al 70% si rompe.', true, { specialTransform:'goblin-camp', chance:30, id:'item-multiattrezzo-goblinoide', name:'Multiattrezzo Goblinoide', nome:'Multiattrezzo Goblinoide', rarity:'raro', rarita:'raro', description:'Un attrezzo storto, astuto, quasi vivo. Fa tante cose male, ma le fa.', descrizione:'Un attrezzo storto, astuto, quasi vivo. Fa tante cose male, ma le fa.' }) },
      { p:20, card:() => numberedCard('glass-eye-073', 73, 'Carta Occhio di Vetro', 'C', 50, 'La carta più rara conservata dai goblin! Se trasformata può diventare uno strumento utile.', { id:'item-occhio-di-vetro', name:'Occhio di Vetro', nome:'Occhio di Vetro', rarity:'raro', rarita:'raro', description:'Un occhio freddo e traslucido. Vede cose che forse non vuoi vedere.', descrizione:'Un occhio freddo e traslucido. Vede cose che forse non vuoi vedere.' }) }
    ]}
};
function freeSlot(cards) {
  const used = new Set((cards || []).map(c => clampInt(c.slot ?? c.number, -1, 999)));
  for (let i = 100; i <= 149; i++) if (!used.has(i)) return i;
  return 149;
}
function spellSlot(cards) {
  const used = new Set((cards || []).map(c => String(c.slot || c.number || '')));
  for (let i = 1; i <= 50; i++) { const s = `S${String(i).padStart(2,'0')}`; if (!used.has(s)) return s; }
  return 'S50';
}
function freeCard(id, name, rarity, description, transformable = false, item = null) {
  return { id:`${id}-${Date.now()}-${Math.random().toString(16).slice(2)}`, type:'card', cardType:'free', name, nome:name, rarity, rarita:rarity, description, descrizione:description, transformable, materializesTo:item, createdAt:new Date().toISOString() };
}
function numberedCard(id, number, name, rarity, limit, description, item = null) {
  return { id:`${id}-${Date.now()}-${Math.random().toString(16).slice(2)}`, type:'card', cardType:'specific', number, slot:number, name, nome:name, rarity, rarita:rarity, globalLimit:limit, limiteGlobale:limit, description, descrizione:description, transformable:!!item, materializesTo:item, createdAt:new Date().toISOString() };
}
function spellCard(name, rarity) {
  return { id:`spell-${Date.now()}-${Math.random().toString(16).slice(2)}`, type:'spell', cardType:'spell', spell:true, name, nome:name, rarity, rarita:rarity, description:`Incantesimo ${rarity} trovato durante l'esplorazione.`, descrizione:`Incantesimo ${rarity} trovato durante l'esplorazione.`, createdAt:new Date().toISOString() };
}
function addCard(cards, card) {
  const c = { ...card };
  if (c.cardType === 'free' && !(c.slot || c.number)) { c.slot = freeSlot(cards); c.number = c.slot; }
  if (c.cardType === 'spell' && !(c.slot || c.number)) { c.slot = spellSlot(cards); c.number = c.slot; }
  cards.push(c);
  return c;
}
function rollBonus(diffKey, inventory) {
  const b = DIFFICULTY[diffKey].bonus;
  const total = b.common + b.uncommon + b.rare + b.epic + b.none;
  let n = Math.floor(rnd() * total) + 1;
  const tiers = [['common','comune',b.common],['uncommon','non comune',b.uncommon],['rare','raro',b.rare],['epic','epico',b.epic],['none','nulla',b.none]];
  for (const [key,label,weight] of tiers) {
    n -= weight;
    if (n <= 0) {
      if (key === 'none') return null;
      const names = { common:['Radice secca','Sasso levigato','Fungo pallido'], uncommon:['Pietra nervosa','Fiala crepata','Semi blu'], rare:['Scheggia di nen','Moneta verde rara'], epic:['Frammento epico di Greed Island'] };
      const item = { id:`bonus-${key}-${Date.now()}-${Math.random().toString(16).slice(2)}`, type:'item', name:pick(names[key]), nome:pick(names[key]), rarity:label, rarita:label, description:`Oggetto ${label} trovato nel modulo bonus.`, descrizione:`Oggetto ${label} trovato nel modulo bonus.`, createdAt:new Date().toISOString() };
      inventory.push(item);
      return item;
    }
  }
  return null;
}
function playerDamage(character, health) {
  const p = effectiveParams(character);
  const inv = Array.isArray(character.inventory) ? character.inventory : [];
  const weapon = inv.filter(i => i?.weapon || i?.damageMod || i?.dannoMod).sort((a,b) => clampInt(b.damageMod ?? b.dannoMod) - clampInt(a.damageMod ?? a.dannoMod))[0];
  let damage = 2 + clampInt(p.forza) + clampInt(weapon?.damageMod ?? weapon?.dannoMod);
  const limbOut = ['braccioDx','braccioSx','gambaDx','gambaSx'].some(k => clampInt(health[k]) <= 0);
  if (limbOut) damage = Math.max(1, Math.floor(damage * 0.5));
  return { damage, weaponName:weapon?.name || weapon?.nome || 'mani nude' };
}
function enemyByPool() {
  const roll = rollInt(1,100);
  if (roll <= 60) return ENEMIES.goblin;
  if (roll <= 90) return ENEMIES.goat;
  return ENEMIES.bossGoblin;
}
function handleZeroParts(logs, state, atSec) {
  const max = state.maxHealth;
  if (state.health.testa <= 0) {
    addLog(logs, atSec, 'La testa è a 0. Stato critico: esplorazione cancellata.', 'bad');
    state.critical = true;
    state.criticalAtSec = atSec;
    return 0;
  }
  let delay = 0;
  if (state.health.corpo <= 0) {
    addLog(logs, atSec, 'Corpo a 0. Crolli a terra: 3 minuti di ripristino protetto.', 'bad');
    state.health.corpo = Math.max(1, Math.ceil(max.corpo * 0.5));
    delay += 180;
    addLog(logs, atSec + delay, 'Ti sei ripreso. Corpo ripristinato al 50%.', 'good');
  }
  const bothArms = state.health.braccioDx <= 0 && state.health.braccioSx <= 0;
  if (bothArms) {
    addLog(logs, atSec + delay, 'Entrambe le braccia sono a 0. 1 minuto di ripristino protetto.', 'bad');
    state.health.braccioDx = Math.max(1, Math.ceil(max.braccioDx * 0.5));
    state.health.braccioSx = Math.max(1, Math.ceil(max.braccioSx * 0.5));
    delay += 60;
    addLog(logs, atSec + delay, 'Braccia ripristinate al 50%.', 'good');
  }
  const bothLegs = state.health.gambaDx <= 0 && state.health.gambaSx <= 0;
  if (bothLegs) {
    addLog(logs, atSec + delay, 'Entrambe le gambe sono a 0. 1 minuto di ripristino protetto.', 'bad');
    state.health.gambaDx = Math.max(1, Math.ceil(max.gambaDx * 0.5));
    state.health.gambaSx = Math.max(1, Math.ceil(max.gambaSx * 0.5));
    delay += 60;
    addLog(logs, atSec + delay, 'Gambe ripristinate al 50%.', 'good');
  }
  return delay;
}
function enemyHitDamage(raw, robustezza) {
  const reduction = Math.min(0.60, clampInt(robustezza) * 0.02);
  return Math.max(1, Math.round(raw * (1 - reduction)));
}
function simulateCombat(logs, state, atSec, difficultyKey) {
  const enemy = enemyByPool();
  const p = effectiveParams(state.character);
  let enemyHp = enemy.hp;
  addLog(logs, atSec, `Nemico incontrato! ${enemy.name}!`, 'bad');
  addLog(logs, atSec, `Inizializzo il combattimento: ${enemy.name} ha ${enemy.hp} punti vita.`, 'info');
  for (let round = 1; round <= 20 && enemyHp > 0 && !state.critical; round++) {
    if (chance(Math.max(5, 40 - clampInt(p.agilita) * 2))) addLog(logs, atSec, `Attacchi ma manchi il colpo.`, 'info');
    else if (chance(enemy.dodge)) addLog(logs, atSec, `${enemy.name} schiva il tuo attacco.`, 'info');
    else {
      const pd = playerDamage(state.character, state.health);
      enemyHp = Math.max(0, enemyHp - pd.damage);
      addLog(logs, atSec, `Attacchi con ${pd.weaponName} e causi ${pd.damage} danni. ${enemy.name}: ${enemyHp}/${enemy.hp}.`, 'good');
    }
    if (enemyHp <= 0) break;
    if (chance(enemy.miss)) addLog(logs, atSec, `${enemy.name} attacca ma manca il colpo.`, 'info');
    else if (chance(Math.min(80, 5 + clampInt(p.agilita) * 2))) addLog(logs, atSec, `${enemy.name} ti attacca ma riesci a schivare.`, 'good');
    else {
      const part = rollWeighted(bodyWeights);
      const entered = enemyHitDamage(enemy.damage, p.robustezza);
      state.health[part] = Math.max(0, clampInt(state.health[part]) - entered);
      addLog(logs, atSec, `${enemy.name} ti colpisce a ${part}: ${entered} danni entrati.`, 'bad');
      const extraDelay = handleZeroParts(logs, state, atSec);
      state.delay += extraDelay;
      atSec += extraDelay;
      if (state.critical) return;
    }
  }
  if (enemyHp > 0) {
    addLog(logs, atSec, `${enemy.name} si ritira nel buio della Foresta Oscura.`, 'info');
    return;
  }
  const exp = rollInt(enemy.exp[0], enemy.exp[1]);
  const jenny = rollInt(enemy.jenny[0], enemy.jenny[1]);
  state.exp += exp;
  state.jenny += jenny;
  addLog(logs, atSec, `${enemy.name} è esausto. Ottenuti ${exp} EXP e ${jenny} Jenny.`, 'good');
  for (const loot of enemy.loot) {
    if (chance(loot.p)) {
      const card = addCard(state.cards, loot.card());
      state.rewardCards.push(card);
      addLog(logs, atSec, `Ottenuta ${card.name || card.nome}!`, 'good');
    }
  }
}
function minuteEvent(logs, state, atSec) {
  const r = rnd() * 100;
  if (r < 72) return;
  if (r < 84) {
    const cards = state.cards.filter(c => !c.spell && ['E','D','C'].includes(String(c.rarity || c.rarita || '').toUpperCase()) && c.id !== 'free-greed-island-pig');
    if (!cards.length) return addLog(logs, atSec, 'Un furfante ti gira attorno, ma non trova carte rubabili.', 'info');
    const stolen = pick(cards);
    state.cards = state.cards.filter(c => c.id !== stolen.id);
    addLog(logs, atSec, `Un furfante ti ha rubato la carta ${stolen.name || stolen.nome}!`, 'bad');
    return;
  }
  const spell = addCard(state.cards, spellCard(`Incantesimo del viaggiatore ${rollInt(1,99)}`, chance(75) ? 'E' : 'D'));
  state.rewardCards.push(spell);
  addLog(logs, atSec, `Incontri un viaggiatore misterioso che lascia cadere per terra ${spell.name}!`, 'good');
}
function rollAccidentCount(diffKey) {
  const weights = DIFFICULTY[diffKey].accidents;
  const n = rnd() * weights.reduce((a,b) => a + b, 0);
  let acc = 0;
  for (let i = 0, s = 0; i < weights.length; i++) { s += weights[i]; if (n < s) { acc = i; break; } }
  return acc;
}
function buildExploration(character, mode) {
  const location = clean(character.location || 'Shiso tree');
  if (!WILD.has(location)) throw new Error('Esplora è disponibile solo nelle zone selvagge.');
  if (location !== 'Foresta Oscura') throw new Error('Per ora i mostri sono implementati solo in Foresta Oscura.');
  const diffKey = LOCATION_DIFFICULTY[location] || 'nabbo';
  const diff = DIFFICULTY[diffKey];
  const p = effectiveParams(character);
  const durationMin = Math.max(5, diff.minutes - clampInt(p.agilita));
  const moduleMin = Math.max(1, Math.floor(durationMin / 5));
  const remainderMin = durationMin - (moduleMin * 5);
  const enemyChance = mode === 'sicura' ? Math.max(20, diff.enemyChance - clampInt(p.percezione) * 2) : diff.enemyChance;
  const logs = [];
  const state = { character, health:normalizeHealth(character), maxHealth:maxHealthFor(character), cards:[...(Array.isArray(character.cards) ? character.cards : [])], inventory:[...(Array.isArray(character.inventory) ? character.inventory : [])], rewardCards:[], exp:0, jenny:0, delay:0, critical:false, criticalAtSec:null };
  addLog(logs, 0, `Esplorazione avviata in ${location}. Modalità ${mode === 'sicura' ? 'Sicura' : 'Scoperta'}. Durata base effettiva: ${durationMin} minuti.`, 'system');
  addLog(logs, 0, `Modulo normale: ${moduleMin} minuti. ${remainderMin > 0 ? `Modulo bonus finale: ${remainderMin} minuti.` : 'Nessun modulo bonus.'}`, 'system');
  const events = [];
  for (let m = 1; m <= durationMin; m++) events.push({ t:m * 60, type:'minute' });
  for (let i = 1; i <= 5; i++) events.push({ t:Math.max(1, i * moduleMin) * 60, type:'enemy' });
  for (let block = 0; block < Math.floor(durationMin / 10); block++) {
    const count = rollAccidentCount(diffKey);
    const used = [];
    for (let i = 0; i < count; i++) {
      let sec = block * 600 + rollInt(1, 599);
      let tries = 0;
      while (used.some(x => Math.abs(x - sec) < 130) && tries++ < 20) sec = block * 600 + rollInt(1, 599);
      used.push(sec);
      events.push({ t:sec, type:'accident' });
    }
  }
  events.sort((a,b) => a.t - b.t || (a.type === 'accident' ? -1 : 1));
  let protectedUntil = -1;
  for (const ev of events) {
    if (state.critical) break;
    let at = ev.t + state.delay;
    if (ev.type !== 'accident' && at < protectedUntil) continue;
    if (ev.type === 'accident' && at < protectedUntil) at = protectedUntil + 1;
    if (ev.type === 'minute') minuteEvent(logs, state, at);
    if (ev.type === 'enemy') {
      if (chance(enemyChance)) simulateCombat(logs, state, at, diffKey);
      else addLog(logs, at, 'Nessun nemico incontrato nel modulo.', 'info');
    }
    if (ev.type === 'accident') {
      const part = pick(['corpo','braccioDx','braccioSx','gambaDx','gambaSx']);
      const damage = 4 + Math.floor((clampInt(character.level, 1) - 1) / 2) + diff.trapMod;
      state.health[part] = Math.max(0, clampInt(state.health[part]) - damage);
      addLog(logs, at, `Sei inciampato in una trappola della location! Serviranno 2 minuti per uscire. Hai preso ${damage} danni a ${part}.`, 'bad');
      state.delay += 120;
      protectedUntil = at + 120;
      addLog(logs, protectedUntil, 'Sei uscito dalla trappola. L’esplorazione riprende.', 'info');
      const extra = handleZeroParts(logs, state, protectedUntil);
      if (extra > 0) { state.delay += extra; protectedUntil += extra; }
    }
  }
  let totalSeconds = durationMin * 60 + state.delay;
  if (!state.critical && remainderMin > 0) {
    const bonusAt = totalSeconds;
    const item = rollBonus(diffKey, state.inventory);
    if (item) addLog(logs, bonusAt, `Modulo bonus: trovato ${item.name} (${item.rarity}).`, 'good');
    else addLog(logs, bonusAt, 'Modulo bonus: non hai trovato nulla.', 'info');
  }
  if (state.critical) totalSeconds = Math.floor(state.criticalAtSec || totalSeconds);
  else addLog(logs, totalSeconds, 'Esplorazione conclusa. Puoi vedere i risultati.', 'system');
  logs.sort((a,b) => a.atSec - b.atSec || a.id.localeCompare(b.id));
  return { id:crypto.randomUUID(), location, difficulty:diffKey, difficultyLabel:diff.label, mode, status:state.critical ? 'critical' : 'active', startedAt:new Date().toISOString(), totalSeconds, baseMinutes:durationMin, moduleMinutes:moduleMin, bonusMinutes:remainderMin, enemyChance, protected:true, logs, final:{ health:state.health, cards:state.cards, inventory:state.inventory, exp:state.exp, jenny:state.jenny, rewardCards:state.rewardCards, critical:state.critical, criticalAtSec:state.criticalAtSec }, claimed:false };
}
function visibleExploration(exploration) {
  if (!exploration) return null;
  const elapsed = Math.max(0, Math.floor((nowMs() - Date.parse(exploration.startedAt || new Date().toISOString())) / 1000));
  const done = elapsed >= clampInt(exploration.totalSeconds);
  const critical = exploration.status === 'critical' && elapsed >= clampInt(exploration.final?.criticalAtSec || exploration.totalSeconds);
  return { ...exploration, elapsedSeconds:elapsed, secondsLeft:Math.max(0, clampInt(exploration.totalSeconds) - elapsed), done, criticalNow:critical, visibleLogs:(exploration.logs || []).filter(l => clampInt(l.atSec) <= elapsed) };
}
async function applyCriticalIfNeeded(env, user, character, exploration) {
  const view = visibleExploration(exploration);
  if (!view?.criticalNow || character?.criticalState) return character;
  const health = normalizeHealth(character);
  health.testa = 0;
  const next = { ...character, health, criticalState:true, criticalReason:'testa a 0 durante esplorazione', criticalAt:new Date().toISOString(), activeExploration:null, updatedAt:new Date().toISOString() };
  await saveCharacter(env, user, next);
  exploration.status = 'critical';
  await saveExplore(env, user, exploration);
  return next;
}
async function claim(env, user, character, exploration) {
  const view = visibleExploration(exploration);
  if (!view.done) throw new Error('Esplorazione ancora in corso.');
  if (exploration.claimed) return character;
  if (exploration.final?.critical) throw new Error('Esplorazione cancellata: sei in stato critico.');
  const next = { ...character };
  next.health = exploration.final.health || normalizeHealth(character);
  next.cards = exploration.final.cards || character.cards || [];
  next.inventory = exploration.final.inventory || character.inventory || [];
  next.xp = clampInt(next.xp) + clampInt(exploration.final.exp);
  next.jenny = clampInt(next.jenny) + clampInt(exploration.final.jenny);
  next.activeExploration = null;
  next.updatedAt = new Date().toISOString();
  await saveCharacter(env, user, next);
  exploration.claimed = true;
  exploration.status = 'claimed';
  await saveExplore(env, user, exploration);
  return next;
}
export async function onRequestGet({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error:'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request));
  if (!user) return json({ error:'Login richiesto' }, 401);
  const raw = await readCharacter(env, user);
  if (!raw) return json({ error:'Crea prima un personaggio HxH' }, 404);
  let exploration = await readExplore(env, user);
  const character = await applyCriticalIfNeeded(env, user, raw, exploration);
  exploration = await readExplore(env, user);
  return json({ character, exploration:visibleExploration(exploration) });
}
export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error:'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request));
  if (!user) return json({ error:'Login richiesto' }, 401);
  let data;
  try { data = await request.json(); } catch { return json({ error:'JSON non valido' }, 400); }
  const action = clean(data.action).toLowerCase();
  let character = await readCharacter(env, user);
  if (!character) return json({ error:'Crea prima un personaggio HxH' }, 404);
  if (action === 'die') {
    if (!character.criticalState) return json({ error:'Puoi morire solo in stato critico.' }, 403);
    await env.CHAT_MESSAGES.delete(characterKey(user));
    await deleteExplore(env, user);
    return json({ dead:true });
  }
  if (character.criticalState) return json({ error:'Stato critico: puoi solo usare una carta cura o morire.' }, 403);
  let exploration = await readExplore(env, user);
  if (action === 'start') {
    if (exploration && !exploration.claimed && visibleExploration(exploration)?.status !== 'claimed') return json({ error:'Hai già un’esplorazione in corso o da riscuotere.' }, 403);
    const mode = clean(data.mode).toLowerCase() === 'scoperta' ? 'scoperta' : 'sicura';
    const location = clean(character.location || 'Shiso tree');
    const diffKey = LOCATION_DIFFICULTY[location] || 'nabbo';
    const cost = DIFFICULTY[diffKey].energy;
    if (clampInt(character.energy) < cost) return json({ error:`Energia insufficiente: servono ${cost} punti energia.` }, 403);
    const exp = buildExploration(character, mode);
    character.energy = clampInt(character.energy) - cost;
    character.energyUpdatedAt = new Date().toISOString();
    character.activeExploration = { id:exp.id, location:exp.location, startedAt:exp.startedAt, totalSeconds:exp.totalSeconds };
    character.updatedAt = new Date().toISOString();
    await saveCharacter(env, user, character);
    await saveExplore(env, user, exp);
    return json({ character, exploration:visibleExploration(exp) });
  }
  if (!exploration) return json({ error:'Nessuna esplorazione attiva.' }, 404);
  character = await applyCriticalIfNeeded(env, user, character, exploration);
  exploration = await readExplore(env, user);
  if (action === 'claim') {
    try { character = await claim(env, user, character, exploration); }
    catch (err) { return json({ error:err.message }, 403); }
    return json({ character, exploration:visibleExploration(exploration), claimed:true });
  }
  if (action === 'clear') {
    await deleteExplore(env, user);
    character.activeExploration = null;
    await saveCharacter(env, user, character);
    return json({ character, exploration:null });
  }
  return json({ error:'Azione non valida' }, 400);
}
