(() => {
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const originalFetch = window.fetch.bind(window);
  const refreshCharacter = async () => {
    try {
      const res = await originalFetch('/api/hxh-character', { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
      const data = await res.json().catch(() => ({}));
      if (data?.character) window.dispatchEvent(new CustomEvent('greed-character-updated', { detail:data.character }));
    } catch {}
  };
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const method = String(init?.method || 'GET').toUpperCase();
    let isStart = false;
    if (url.includes('/api/hxh-explore') && method === 'POST') {
      try {
        const body = typeof init.body === 'string' ? JSON.parse(init.body) : null;
        isStart = body?.action === 'start';
      } catch {}
    }
    const res = await originalFetch(input, init);
    if (!isStart) return res;
    try {
      const clone = res.clone();
      const data = await clone.json().catch(() => ({}));
      if (data?.character) window.dispatchEvent(new CustomEvent('greed-character-updated', { detail:data.character }));
      setTimeout(refreshCharacter, 180);
      setTimeout(refreshCharacter, 900);
    } catch {
      setTimeout(refreshCharacter, 250);
    }
    return res;
  };
})();
