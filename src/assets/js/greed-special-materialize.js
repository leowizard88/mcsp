(() => {
  const originalFetch = window.fetch.bind(window);
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const readBody = body => {
    if (!body) return null;
    if (typeof body === 'string') { try { return JSON.parse(body); } catch { return null; } }
    return null;
  };
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const method = String(init?.method || 'GET').toUpperCase();
    const body = readBody(init?.body);
    if (url.includes('/api/hxh-character') && method === 'POST' && body?.action === 'materialize-card') {
      try {
        const res = await originalFetch('/api/hxh-character', { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
        const data = await res.json().catch(() => ({}));
        const slot = body.slot ?? body.number;
        const card = (data.character?.cards || []).find(c => String(c?.slot ?? c?.number) === String(slot));
        if ((card?.name || card?.nome) === 'Carta Accampamento Goblin') {
          return await originalFetch('/api/hxh-special-materialize', { method:'POST', headers:{ 'content-type':'application/json', authorization:`Bearer ${token()}` }, body:JSON.stringify({ slot }), cache:'no-store' });
        }
      } catch {}
    }
    return originalFetch(input, init);
  };
})();
