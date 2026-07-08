(() => {
  const enter = event => {
    const btn = event.target?.closest?.('[data-gi-param-enter],.gi-param-enter');
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    document.body.classList.remove('has-param-setup','greed-entry-animating','menu-open');
    document.body.classList.add('has-greed-profile');
    document.querySelector('.greed-entry-gate')?.remove();
    document.querySelector('[data-menu-panel]')?.classList.remove('is-active');
    try { history.replaceState(null, '', '/greed-island/'); } catch {}
  };
  const unlock = () => {
    document.querySelectorAll('[data-gi-param-enter],.gi-param-enter').forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('is-locked');
      btn.style.pointerEvents = 'auto';
      btn.style.cursor = 'pointer';
    });
  };
  document.addEventListener('click', enter, true);
  document.addEventListener('pointerdown', unlock, true);
  const start = () => {
    unlock();
    try { new MutationObserver(unlock).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['disabled','class','style'] }); } catch {}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
