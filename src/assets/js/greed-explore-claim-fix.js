(() => {
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const claim = async () => {
    const res = await fetch('/api/hxh-explore-claim', {
      method:'POST',
      headers:{ authorization:`Bearer ${token()}` },
      cache:'no-store'
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore riscossione esplorazione');
    return data;
  };
  const refreshCharacter = async () => {
    try {
      const res = await fetch('/api/hxh-character', { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
      const data = await res.json().catch(() => ({}));
      if (data?.character) window.dispatchEvent(new CustomEvent('greed-character-updated', { detail:data.character }));
    } catch {}
  };
  document.addEventListener('click', async e => {
    const btn = e.target.closest('[data-results-claim]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    btn.disabled = true;
    const modal = btn.closest('.gi-results-modal');
    const err = modal?.querySelector('[data-results-error]');
    if (err) err.textContent = '';
    try {
      const data = await claim();
      if (data.character) window.dispatchEvent(new CustomEvent('greed-character-updated', { detail:data.character }));
      modal?.classList.remove('is-open');
      document.querySelector('.explore-log-panel')?.classList.remove('is-open');
      setTimeout(refreshCharacter, 150);
      setTimeout(refreshCharacter, 800);
    } catch (ex) {
      if (err) err.textContent = ex.message;
      else alert(ex.message);
    } finally {
      btn.disabled = false;
    }
  }, true);
})();
