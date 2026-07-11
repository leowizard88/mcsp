(() => {
  if (window.__greedRestOverride) return;
  window.__greedRestOverride = true;
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const api = async (url, body = null) => {
    const res = await fetch(url, body ? {
      method:'POST',
      headers:{ 'content-type':'application/json', authorization:`Bearer ${token()}` },
      body:JSON.stringify(body),
      cache:'no-store'
    } : { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore Greed Island');
    return data;
  };
  const msgBox = panel => panel?.querySelector('[data-loc-msg]');
  document.addEventListener('click', async e => {
    const btn = e.target.closest('[data-loc-action="rest"]');
    if (!btn) return;
    const panel = btn.closest('.location-panel');
    if (!panel) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const msg = msgBox(panel);
    if (msg) { msg.classList.remove('err'); msg.textContent = 'Riposo in corso...'; }
    btn.disabled = true;
    panel.classList.add('is-busy');
    try {
      await api('/api/hxh-rest', { action:'rest' });
      await api('/api/hxh-sync', { reason:'after-rest' }).catch(() => null);
      const data = await api('/api/hxh-character');
      if (data.character) window.greedPublishCharacter?.(data.character, 'character');
      if (msg) msg.textContent = 'Energia ripristinata, vita recuperata, Stato azzerato. Parametri -1 per 10 minuti. Prossimo riposo tra 3 ore.';
      window.dispatchEvent(new CustomEvent('greed-rested-authoritative', { detail:data.character }));
    } catch (err) {
      if (msg) { msg.classList.add('err'); msg.textContent = err.message; }
    } finally {
      panel.classList.remove('is-busy');
      setTimeout(() => { btn.disabled = false; }, 600);
    }
  }, true);
})();
