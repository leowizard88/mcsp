(() => {
  const css = document.createElement('style');
  css.textContent = `
    .greed-game{cursor:default!important}
    .greed-game.is-dragging{cursor:default!important}
    .map-world{transform-origin:50% 50%!important}
  `;
  document.head.appendChild(css);

  const game = document.querySelector('[data-greed-game]');
  const world = document.querySelector('.map-world');
  if (!game || !world) return;

  const state = { x:0, y:0, scale:1 };
  const apply = () => {
    if (state.scale <= 1.001) {
      state.scale = 1;
      state.x = 0;
      state.y = 0;
    }
    world.style.transform = `translate(${state.x}px,${state.y}px) scale(${state.scale})`;
  };
  apply();

  const blockDrag = e => {
    if (e.target.closest('button,nav,.menu-panel,.city-popup,.test-levelup')) return;
    game.classList.remove('is-dragging');
    e.stopImmediatePropagation();
  };
  game.addEventListener('pointerdown', blockDrag, true);
  game.addEventListener('pointermove', blockDrag, true);
  game.addEventListener('pointerup', blockDrag, true);

  game.addEventListener('wheel', e => {
    if (e.target.closest('button,nav,.menu-panel,.city-popup,.test-levelup')) return;
    e.preventDefault();
    e.stopImmediatePropagation();

    const old = state.scale;
    const next = Math.max(1, Math.min(3.2, old + (e.deltaY < 0 ? 0.14 : -0.14)));

    if (next <= 1.001) {
      state.scale = 1;
      state.x = 0;
      state.y = 0;
      apply();
      return;
    }

    const rect = game.getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width / 2 - state.x;
    const cy = e.clientY - rect.top - rect.height / 2 - state.y;
    state.x -= cx * (next / old - 1);
    state.y -= cy * (next / old - 1);
    state.scale = next;
    apply();
  }, { capture:true, passive:false });

  import('/assets/js/greed-new-locations.js?v=20260708-expanded-1');
})();
