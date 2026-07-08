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
  const safeRelabel = () => {
    try { relabel(); } catch {}
  };
  document.addEventListener('click', () => setTimeout(safeRelabel, 20), true);
  const start = () => {
    safeRelabel();
    try { new MutationObserver(safeRelabel).observe(document.body, { childList:true, subtree:true }); } catch {}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
