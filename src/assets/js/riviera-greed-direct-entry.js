(() => {
  const go = event => {
    const link = event.target?.closest?.('.greed-entry');
    if (!link) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    document.documentElement.style.cursor = 'wait';
    window.location.assign('/greed-island/');
    setTimeout(() => { window.location.href = '/greed-island/'; }, 250);
  };
  document.addEventListener('click', go, true);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const link = document.activeElement?.closest?.('.greed-entry');
    if (!link) return;
    go({ target:link, preventDefault(){}, stopPropagation(){}, stopImmediatePropagation(){} });
  }, true);
})();
