(() => {
  const relabel = () => {
    document.querySelectorAll('[data-explore-mode="scoperta"]').forEach(btn => {
      btn.dataset.exploreMode = 'zetsu';
      btn.textContent = 'Zetsu attivo';
    });
    document.querySelectorAll('.explore-card p').forEach(p => {
      if (p.textContent.includes('Scoperta')) {
        p.innerHTML = 'Scegli modalità. <strong>Sicura</strong>: Percezione riduce la probabilità nemici. <strong>Zetsu attivo</strong>: Nen riduce la probabilità nemici.';
      }
    });
  };
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (url.includes('/api/hxh-explore') && String(init?.method || 'GET').toUpperCase() === 'POST') {
      try {
        const body = typeof init.body === 'string' ? JSON.parse(init.body) : null;
        if (body?.action === 'start' && body.mode === 'scoperta') {
          init = { ...init, body:JSON.stringify({ ...body, mode:'zetsu' }) };
        }
      } catch {}
    }
    const res = await originalFetch(input, init);
    if (!url.includes('/api/hxh-explore')) return res;
    try {
      const clone = res.clone();
      const data = await clone.json();
      if (data?.exploration?.mode === 'zetsu') data.exploration.mode = 'Zetsu attivo';
      if (data?.exploration?.modeLabel === 'Zetsu attivo') data.exploration.mode = 'Zetsu attivo';
      return new Response(JSON.stringify(data), { status:res.status, statusText:res.statusText, headers:{ 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' } });
    } catch { return res; }
  };
  document.addEventListener('click', () => setTimeout(relabel, 20), true);
  new MutationObserver(relabel).observe(document.body, { childList:true, subtree:true });
  setTimeout(relabel, 250);
})();
