(() => {
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const originalFetch = window.fetch.bind(window);
  let syncing = null;
  const syncEnergy = () => {
    if (!syncing) {
      syncing = originalFetch('/api/hxh-energy-sync', { method:'POST', headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' })
        .then(r => r.json().catch(() => null))
        .then(data => {
          if (data?.character) window.dispatchEvent(new CustomEvent('greed-character-updated', { detail:data.character }));
          return data;
        })
        .catch(() => null)
        .finally(() => { syncing = null; });
    }
    return syncing;
  };
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const method = String(init?.method || 'GET').toUpperCase();
    if (url.includes('/api/hxh-explore') && method === 'POST') {
      let body = null;
      try { body = typeof init.body === 'string' ? JSON.parse(init.body) : null; } catch {}
      if (body?.action === 'start') await syncEnergy();
    }
    return originalFetch(input, init);
  };
  setInterval(syncEnergy, 30000);
  setTimeout(syncEnergy, 1200);
})();
