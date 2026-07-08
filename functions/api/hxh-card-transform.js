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
const keyFor = user => `hxh:character:${user.id}`;
const STARTER_PIG_ID = 'free-greed-island-pig';
const STARTER_PIG_SLOT = 100;
const firstFreeSlot = cards => {
  const used = new Set((cards || []).map(c => Number(c?.number ?? c?.slot)).filter(n => Number.isFinite(n)));
  for (let i = 100; i < 150; i++) if (!used.has(i)) return i;
  return -1;
};
const pigCard = character => ({
  id:STARTER_PIG_ID,
  type:'card',
  cardType:'free',
  number:STARTER_PIG_SLOT,
  slot:STARTER_PIG_SLOT,
  name:'Maiale di Greed Island',
  nome:'Maiale di Greed Island',
  rarity:'E',
  rarita:'E',
  globalLimit:null,
  limiteGlobale:null,
  limitLabel:'infinito',
  limiteLabel:'infinito',
  description:`Benvenuto ${clean(character?.nome) || 'giocatore'}!`,
  descrizione:`Benvenuto ${clean(character?.nome) || 'giocatore'}!`,
  materializesTo:{ type:'item', name:'Maiale di Greed Island', nome:'Maiale di Greed Island', description:'Un... maiale!?', descrizione:'Un... maiale!?' },
  art:'pig',
  createdAt:new Date().toISOString()
});
const cardFromItem = (item, character, cards) => {
  const isPig = item?.sourceCardId === STARTER_PIG_ID || item?.id === 'item-greed-island-pig' || item?.name === 'Maiale di Greed Island' || item?.nome === 'Maiale di Greed Island';
  if (isPig) return pigCard(character);
  const slot = Number.isFinite(Number(item?.sourceSlot)) ? Number(item.sourceSlot) : firstFreeSlot(cards);
  if (slot < 100 || slot > 149) return null;
  return {
    id:item?.sourceCardId || `free-card-${slot}-${Date.now()}`,
    type:'card',
    cardType:'free',
    number:slot,
    slot,
    name:item?.name || item?.nome || 'Carta libera',
    nome:item?.nome || item?.name || 'Carta libera',
    rarity:item?.rarity || item?.rarita || 'E',
    rarita:item?.rarita || item?.rarity || 'E',
    globalLimit:item?.globalLimit ?? null,
    limiteGlobale:item?.limiteGlobale ?? null,
    limitLabel:item?.limitLabel || item?.limiteLabel || 'infinito',
    limiteLabel:item?.limiteLabel || item?.limitLabel || 'infinito',
    description:item?.cardDescription || item?.cardDescrizione || item?.description || item?.descrizione || 'Carta libera.',
    descrizione:item?.cardDescrizione || item?.cardDescription || item?.descrizione || item?.description || 'Carta libera.',
    materializesTo:{ type:'item', name:item?.name || item?.nome || 'Oggetto', nome:item?.nome || item?.name || 'Oggetto', description:item?.description || item?.descrizione || '', descrizione:item?.descrizione || item?.description || '' },
    art:item?.art || 'card',
    createdAt:new Date().toISOString()
  };
};

export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error:'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request));
  if (!user) return json({ error:'Login richiesto' }, 401);
  let data;
  try { data = await request.json(); } catch { return json({ error:'JSON non valido' }, 400); }
  const action = clean(data.action).toLowerCase();
  if (action !== 'transform-item') return json({ error:'Azione non valida' }, 400);
  const key = keyFor(user);
  const character = await env.CHAT_MESSAGES.get(key, 'json').catch(() => null);
  if (!character) return json({ error:'Crea prima un personaggio HxH' }, 404);
  if (character.sleepUntil && Date.parse(character.sleepUntil) > Date.now()) return json({ error:'Stai dormendo: inventario in sola visualizzazione.' }, 403);
  if (character.exhaustionUntil && Date.parse(character.exhaustionUntil) > Date.now()) return json({ error:'Esaurimento attivo: non puoi trasformare oggetti.' }, 403);

  const inventory = Array.isArray(character.inventory) ? [...character.inventory] : [];
  const cards = Array.isArray(character.cards) ? [...character.cards] : [];
  const index = Number.isFinite(Number(data.index))
    ? Number(data.index)
    : inventory.findIndex(item => clean(item?.id) === clean(data.itemId));
  if (index < 0 || index >= inventory.length) return json({ error:'Oggetto non trovato.' }, 404);
  const item = inventory[index];
  const card = cardFromItem(item, character, cards);
  if (!card) return json({ error:'Nessuno slot libero disponibile nel Binder.' }, 403);
  const slot = Number(card.number ?? card.slot);
  if (cards.some(c => Number(c?.number ?? c?.slot) === slot)) return json({ error:`Lo slot ${String(slot).padStart(3,'0')} è già occupato.` }, 409);

  inventory.splice(index, 1);
  cards.push(card);
  character.inventory = inventory;
  character.cards = cards;
  character.updatedAt = new Date().toISOString();
  await env.CHAT_MESSAGES.put(key, JSON.stringify(character));
  return json({ character, card });
}
