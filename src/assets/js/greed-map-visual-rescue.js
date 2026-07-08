(() => {
  const ensure = () => {
    if (!document.body.classList.contains('has-greed-profile')) return;
    document.body.classList.remove('has-param-setup','greed-entry-animating');
    document.querySelector('.greed-entry-gate')?.remove();
    const game = document.querySelector('[data-greed-game]');
    if (!game) return;
    game.style.display = 'block';
    game.style.visibility = 'visible';
    game.style.opacity = '1';
    game.style.pointerEvents = 'auto';
    let world = game.querySelector('.map-world');
    if (!world) {
      world = document.createElement('div');
      world.className = 'map-world';
      game.prepend(world);
    }
    world.style.position = 'absolute';
    world.style.inset = '0';
    world.style.zIndex = '6';
    world.style.display = 'block';
    world.style.visibility = 'visible';
    world.style.opacity = '1';
    world.style.pointerEvents = 'auto';
    world.style.background = "linear-gradient(rgba(0,0,0,.04),rgba(0,0,0,.18)),url('/assets/img/greed.png') center/cover no-repeat";
    world.style.transformOrigin = '50% 50%';
    document.querySelectorAll('.map-label[data-place]').forEach(label => {
      if (label.parentElement !== world) world.appendChild(label);
      label.style.position = 'absolute';
      label.style.zIndex = '20';
      label.style.display = 'block';
      label.style.visibility = 'visible';
      label.style.opacity = '1';
      label.style.pointerEvents = 'auto';
      label.disabled = false;
    });
    ['.menu-button','.location-display','.level-display','.jenny-display','.hxh-welcome'].forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.visibility = 'visible';
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      });
    });
  };
  const css = document.createElement('style');
  css.textContent = `
    body.has-greed-profile .greed-game{display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;background:none!important}
    body.has-greed-profile .map-world{display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;background:linear-gradient(rgba(0,0,0,.04),rgba(0,0,0,.18)),url('/assets/img/greed.png') center/cover no-repeat!important}
    body.has-greed-profile .map-label{display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;z-index:20!important}
    body.has-greed-profile .greed-entry-gate{display:none!important;visibility:hidden!important;pointer-events:none!important}
  `;
  document.head.appendChild(css);
  document.addEventListener('click', () => setTimeout(ensure, 20), true);
  window.addEventListener('greed-character-updated', () => setTimeout(ensure, 40));
  new MutationObserver(() => setTimeout(ensure, 40)).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style'] });
  setInterval(ensure, 500);
  setTimeout(ensure, 100);
  setTimeout(ensure, 900);
})();
