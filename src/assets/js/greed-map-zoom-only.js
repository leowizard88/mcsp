(() => {
  const css = document.createElement('style');
  css.textContent = `
    .greed-game{cursor:default!important;touch-action:none!important}
    .greed-game.is-panning{cursor:grabbing!important}
    .map-world{transform-origin:50% 50%!important;will-change:transform}
  `;
  document.head.appendChild(css);

  const game = document.querySelector('[data-greed-game]');
  const world = document.querySelector('.map-world');
  if (!game || !world) return;

  const ignore = e => e.target.closest('button,nav,.menu-panel,.city-popup,.test-levelup,.location-panel');
  const state = { x:0, y:0, scale:1, down:false, px:0, py:0 };
  const minScale = 1;
  const maxScale = 3.4;
  const reset = () => { state.x = 0; state.y = 0; state.scale = 1; };
  const clampPan = () => {
    if (state.scale <= minScale + 0.001) return reset();
    const rect = game.getBoundingClientRect();
    const maxX = rect.width * (state.scale - 1) / 2;
    const maxY = rect.height * (state.scale - 1) / 2;
    state.x = Math.max(-maxX, Math.min(maxX, state.x));
    state.y = Math.max(-maxY, Math.min(maxY, state.y));
  };
  const apply = () => {
    if (state.scale <= minScale + 0.001) reset();
    clampPan();
    world.style.transform = `translate3d(${state.x}px,${state.y}px,0) scale(${state.scale})`;
  };
  reset();
  apply();

  game.addEventListener('wheel', e => {
    if (ignore(e)) return;
    e.preventDefault();
    e.stopImmediatePropagation();

    const old = state.scale;
    const step = e.deltaY < 0 ? 1.16 : 1 / 1.16;
    let next = old * step;
    if (e.deltaY > 0 && next < 1.06) next = 1;
    next = Math.max(minScale, Math.min(maxScale, next));

    if (next === 1) {
      reset();
      apply();
      return;
    }

    const rect = game.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;
    const k = next / old;
    state.x = mx - (mx - state.x) * k;
    state.y = my - (my - state.y) * k;
    state.scale = next;
    apply();
  }, { capture:true, passive:false });

  game.addEventListener('pointerdown', e => {
    if (ignore(e)) return;
    if (state.scale <= 1.001) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    state.down = true;
    state.px = e.clientX;
    state.py = e.clientY;
    game.classList.add('is-panning');
    game.setPointerCapture?.(e.pointerId);
  }, true);

  game.addEventListener('pointermove', e => {
    if (!state.down) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    state.x += e.clientX - state.px;
    state.y += e.clientY - state.py;
    state.px = e.clientX;
    state.py = e.clientY;
    apply();
  }, true);

  const endPan = e => {
    if (!state.down) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    state.down = false;
    game.classList.remove('is-panning');
    game.releasePointerCapture?.(e.pointerId);
  };
  game.addEventListener('pointerup', endPan, true);
  game.addEventListener('pointercancel', endPan, true);

  window.addEventListener('resize', apply);
  import('/assets/js/greed-new-locations.js?v=20260708-expanded-1');
})();
