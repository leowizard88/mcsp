(() => {
  const del = document.querySelector('[data-delete-character]');
  if (!del) return;
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const css = document.createElement('style');
  css.textContent = `
    .gi-delete-modal{position:fixed;inset:0;z-index:120;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.72);backdrop-filter:blur(2px);padding:22px}.gi-delete-modal.is-open{display:flex}.gi-delete-card{width:min(460px,calc(100vw - var(--side,44px) - 42px));border:3px solid #ff4b4b;background:rgba(18,0,0,.94);box-shadow:8px 8px 0 rgba(0,0,0,.82),0 0 34px rgba(255,40,40,.22);color:#fff;padding:22px;font-family:Arial,Helvetica,sans-serif;text-align:center}.gi-delete-card h2{margin:0 0 12px;color:#ffb0b0;font:900 30px/1 Impact,Haettenschweiler,'Arial Black',sans-serif;text-transform:uppercase;text-shadow:3px 3px 0 #000}.gi-delete-card p{margin:0 0 18px;font:800 16px/1.32 Arial,Helvetica,sans-serif}.gi-delete-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.gi-delete-actions button{border:1px solid #fff;font:900 12px/1 'Courier New',monospace;text-transform:uppercase;padding:11px 13px;cursor:pointer;box-shadow:3px 3px 0 #000}.gi-delete-cancel{background:#eaffff;color:#00131c}.gi-delete-ok{background:#a50016;color:#fff}.gi-delete-error{margin-top:12px;color:#ffb0b0;font:800 13px/1.3 Arial,Helvetica,sans-serif}
  `;
  document.head.appendChild(css);
  const modal = document.createElement('div');
  modal.className = 'gi-delete-modal';
  modal.innerHTML = `<div class="gi-delete-card"><h2>Elimina personaggio</h2><p>Sei sicuro di voler eliminare il personaggio?</p><div class="gi-delete-actions"><button type="button" class="gi-delete-cancel">Annulla</button><button type="button" class="gi-delete-ok">Sì, elimina</button></div><div class="gi-delete-error" data-gi-delete-error></div></div>`;
  document.body.appendChild(modal);
  const close = () => modal.classList.remove('is-open');
  const open = e => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    modal.querySelector('[data-gi-delete-error]').textContent = '';
    modal.classList.add('is-open');
  };
  del.addEventListener('click', open, true);
  modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('.gi-delete-cancel')) close(); });
  modal.querySelector('.gi-delete-ok').addEventListener('click', async () => {
    const error = modal.querySelector('[data-gi-delete-error]');
    error.textContent = '';
    try {
      const res = await fetch('/api/hxh-character', { method:'DELETE', headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Errore eliminazione personaggio');
      localStorage.removeItem('greedEntered:player');
      location.href = '/greed-island/';
    } catch (err) {
      error.textContent = err.message;
    }
  });
})();
