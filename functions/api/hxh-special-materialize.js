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
const clampInt = (value, min = 0, max = 999999) => Math.max(min, Math.min(max, Math.floor(Number(value) || 0)));
export async function onRequestPost({ request, env }) {
  if (!env.CHAT_MESSAGES) return json({ error:'CHAT_MESSAGES KV binding mancante' }, 500);
  const user = await getUserByToken(env, bearer(request));
  if (!user) return json({ error:'Login richiesto' }, 401);
  let data;
  try { data = await request.json(); } catch { return json({ error:'JSON non valido' }, 400); }
  const key = characterKey(user);
  const character = await env.CHAT_MESSAGES.get(key, 'json').catch(() => null);
  if (!character) return json({ error:'Crea prima un personaggio HxH' }, 404);
  const slot = data.slot;
  const cards = Array.isArray(character.cards) ? [...character.cards] : [];
  const index = cards.findIndex(card => String(card?.slot ?? card?.number) === String(slot) || clean(card?.name || card?.nome) === 'Carta Accampamento Goblin');
  if (index < 0) return json({ error:'Carta non trovata.' }, 404);
  const card = cards[index];
  if (clean(card.name || card.nome) !== 'Carta Accampamento Goblin') return json({ error:'Questa carta non ha una trasformazione speciale.' }, 400);
  cards.splice(index, 1);
  character.cards = cards;
  character.inventory = Array.isArray(character.inventory) ? character.inventory : [];
  const success = Math.random() < 0.30;
  let item = null;
  if (success) {
    item = { id:`item-multiattrezzo-goblinoide-${Date.now()}`, type:'item', name:'Multiattrezzo Goblinoide', nome:'Multiattrezzo Goblinoide', rarity:'raro', rarita:'raro', description:'Un attrezzo storto, astuto, quasi vivo. Fa tante cose male, ma le fa.', descrizione:'Un attrezzo storto, astuto, quasi vivo. Fa tante cose male, ma le fa.', sourceCardId:card.id || null, sourceSlot:slot, createdAt:new Date().toISOString() };
    character.inventory.push(item);
  }
  character.updatedAt = new Date().toISOString();
  await env.CHAT_MESSAGES.put(key, JSON.stringify(character));
  return json({ character, item, success, message:success ? 'La carta si è trasformata in Multiattrezzo Goblinoide.' : 'La carta si è rotta durante la trasformazione.' });
}
