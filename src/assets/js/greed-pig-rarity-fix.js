(() => {
  const PIG_ID = 'free-greed-island-pig';
  const patchCard = card => {
    if (!card || typeof card !== 'object') return card;
    const isPig = card.id === PIG_ID || card.name === 'Maiale di Greed Island' || card.nome === 'Maiale di Greed Island';
    if (!isPig) return card;
    card.rarity = 'E';
    card.rarita = 'E';
    card.globalLimit = null;
    card.limiteGlobale = null;
    card.limitLabel = 'infinito';
    card.limiteLabel = 'infinito';
    return card;
  };
  const patchCharacter = c => {
    if (!c || typeof c !== 'object') return c;
    if (Array.isArray(c.cards)) c.cards = c.cards.map(patchCard);
    if (Array.isArray(c.binder)) c.binder = c.binder.map(patchCard);
    if (Array.isArray(c.inventory)) c.inventory = c.inventory.map(item => item?.type === 'card' ? patchCard(item) : item);
    return c;
  };
  const patchPayload = data => {
    if (!data || typeof data !== 'object') return data;
    if (data.character) data.character = patchCharacter(data.character);
    if (Array.isArray(data.characters)) data.characters = data.characters.map(patchCharacter);
    return data;
  };
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const res = await originalFetch(...args);
    const url = String(args[0]?.url || args[0] || '');
    if (!url.includes('/api/hxh-character')) return res;
    const clone = res.clone();
    try {
      const data = patchPayload(await clone.json());
      return new Response(JSON.stringify(data), { status:res.status, statusText:res.statusText, headers:res.headers });
    } catch { return res; }
  };
})();
