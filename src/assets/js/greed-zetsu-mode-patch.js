(() => {
  const relabel = () => {
    const buttons = [...document.querySelectorAll('[data-explore-mode]')];
    if (buttons[0]) {
      buttons[0].dataset.exploreMode = 'scoperta';
      buttons[0].textContent = 'Scoperta';
    }
    if (buttons[1]) {
      buttons[1].dataset.exploreMode = 'zetsu';
      buttons[1].textContent = 'Zetsu attivo';
    }
    document.querySelectorAll('.explore-card p').forEach(p => {
      p.innerHTML = 'Scegli modalità. <strong>Scoperta</strong>: probabilità nemici standard della zona. <strong>Zetsu attivo</strong>: Nen riduce la probabilità nemici.';
    });
  };
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const res = await originalFetch(input, init);
    if (!url.includes('/api/hxh-explore')) return res;
    try {
      const clone = res.clone();
      const data = await clone.json();
      if (data?.exploration?.mode === 'scoperta') data.exploration.mode = 'Scoperta';
      if (data?.exploration?.mode === 'zetsu') data.exploration.mode = 'Zetsu attivo';
      if (data?.exploration?.modeLabel) data.exploration.mode = data.exploration.modeLabel;
      return new Response(JSON.stringify(data), { status:res.status, statusText:res.statusText, headers:{ 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' } });
    } catch { return res; }
  };
  document.addEventListener('click', () => setTimeout(relabel, 20), true);
  new MutationObserver(relabel).observe(document.body, { childList:true, subtree:true });
  setTimeout(relabel, 250);
})();
