(() => {
  const game = document.querySelector('[data-greed-game]');
  const world = document.querySelector('.map-world');
  if (!game || !world) return;

  const css = document.createElement('style');
  css.textContent = `
    @media(max-width:760px){
      .greed-game{touch-action:none!important;overflow:hidden!important}
      .map-world{will-change:transform!important;transform-origin:50% 50%!important}
      .menu-button{top:12px!important;left:calc(var(--side,38px) + 12px)!important;z-index:80!important;background:rgba(0,0,0,.62)!important;border:1px solid rgba(255,255,255,.55)!important;padding:8px 10px!important;box-shadow:3px 3px 0 rgba(0,0,0,.7)!important}
      .location-display{top:58px!important;left:calc(var(--side,38px) + 12px)!important;max-width:calc(100vw - var(--side,38px) - 24px)!important;background:rgba(0,0,0,.48)!important;padding:6px 8px!important;border:1px solid rgba(255,255,255,.22)!important;border-radius:0!important}
      .level-display{top:98px!important;left:calc(var(--side,38px) + 12px)!important;background:rgba(0,0,0,.48)!important;padding:5px 8px!important;border:1px solid rgba(255,255,255,.22)!important}
      .jenny-display{top:130px!important;left:calc(var(--side,38px) + 12px)!important;background:rgba(0,0,0,.48)!important;padding:5px 8px!important;border:1px solid rgba(255,255,255,.22)!important}
      .energy-hud{top:164px!important;left:calc(var(--side,38px) + 12px)!important;background:rgba(0,0,0,.48)!important;padding:5px 8px!important;border:1px solid rgba(255,255,255,.22)!important;white-space:normal!important;max-width:210px!important}
      .hxh-welcome{top:58px!important;right:10px!important;left:auto!important;transform:none!important;width:calc(100vw - var(--side,38px) - 150px)!important;text-align:right!important;font-size:16px!important;line-height:1.15!important;z-index:30!important}
      .test-levelup{display:none!important}
      body.menu-open .location-display,body.menu-open .level-display,body.menu-open .jenny-display,body.menu-open .energy-hud,body.menu-open .hxh-welcome,body.menu-open .test-levelup,body.menu-open .location-panel{display:none!important}
      .side-menu{left:var(--side,38px)!important;right:8px!important;top:0!important;bottom:auto!important;width:auto!important;max-height:214px!important;overflow:auto!important;z-index:70!important;padding:56px 10px 10px!important;border-right:0!important;border-bottom:3px solid #b8ff4a!important;box-shadow:0 7px 0 rgba(0,0,0,.72)!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;transform:translateY(calc(-100% - 12px))!important}
      body.menu-open .side-menu{transform:translateY(0)!important}
      .side-menu button{margin:0!important;padding:11px 9px!important;font-size:13px!important;text-align:center!important;min-height:42px!important}
      .menu-panel{left:calc(var(--side,38px) + 10px)!important;right:10px!important;top:226px!important;width:auto!important;max-height:calc(100vh - 242px)!important;z-index:78!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;padding:14px!important;box-shadow:5px 5px 0 rgba(0,0,0,.75)!important;background:rgba(0,0,0,.86)!important}
      body.menu-open .menu-panel.is-active{display:block!important;pointer-events:auto!important}
      .menu-panel h2{font-size:24px!important}
      .stat-mini-grid{grid-template-columns:1fr!important}
      .stat-row{grid-template-columns:minmax(90px,1fr) 34px 48px 34px!important;gap:6px!important;padding:8px!important}
      .city-popup{z-index:82!important;width:calc(100vw - var(--side,38px) - 28px)!important;max-height:78vh!important;overflow:auto!important}
      .location-panel{right:10px!important;top:212px!important;width:calc(100vw - var(--side,38px) - 28px)!important;max-height:calc(100vh - 226px)!important;z-index:62!important}
      .location-actions{grid-template-columns:1fr!important}
      .location-photo{max-height:150px!important}
      .binder-shell{max-height:calc(100vh - 310px)!important;overflow:auto!important}
    }
  `;
  document.head.appendChild(css);

  const isUi = target => target.closest('button,nav,.menu-panel,.city-popup,.location-panel,.delete-character,.greed-card,.param-card,.exhaustion-screen');
  let start = null;
  let state = { x:0, y:0, scale:1 };
  const dist = (a,b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const mid = (a,b) => ({ x:(a.clientX + b.clientX) / 2, y:(a.clientY + b.clientY) / 2 });
  const apply = () => {
    state.scale = Math.max(1, Math.min(3.6, state.scale));
    if (state.scale <= 1.01) { state.scale = 1; state.x = 0; state.y = 0; }
    const rect = game.getBoundingClientRect();
    const maxX = rect.width * (state.scale - 1) / 2;
    const maxY = rect.height * (state.scale - 1) / 2;
    state.x = Math.max(-maxX, Math.min(maxX, state.x));
    state.y = Math.max(-maxY, Math.min(maxY, state.y));
    world.style.transform = `translate3d(${state.x}px,${state.y}px,0) scale(${state.scale})`;
  };

  game.addEventListener('touchstart', e => {
    if (isUi(e.target)) return;
    if (e.touches.length === 1 && state.scale > 1) {
      start = { mode:'pan', x:e.touches[0].clientX, y:e.touches[0].clientY, sx:state.x, sy:state.y };
    } else if (e.touches.length === 2) {
      const m = mid(e.touches[0], e.touches[1]);
      start = { mode:'pinch', d:dist(e.touches[0], e.touches[1]), scale:state.scale, x:state.x, y:state.y, mx:m.x, my:m.y };
    }
  }, { passive:false });

  game.addEventListener('touchmove', e => {
    if (!start || isUi(e.target)) return;
    if (start.mode === 'pan' && e.touches.length === 1) {
      e.preventDefault();
      state.x = start.sx + e.touches[0].clientX - start.x;
      state.y = start.sy + e.touches[0].clientY - start.y;
      apply();
    }
    if (start.mode === 'pinch' && e.touches.length === 2) {
      e.preventDefault();
      const m = mid(e.touches[0], e.touches[1]);
      const next = Math.max(1, Math.min(3.6, start.scale * (dist(e.touches[0], e.touches[1]) / Math.max(1, start.d))));
      const k = next / Math.max(1, start.scale);
      state.scale = next;
      state.x = start.x * k + (m.x - start.mx);
      state.y = start.y * k + (m.y - start.my);
      apply();
    }
  }, { passive:false });

  game.addEventListener('touchend', () => { start = null; }, { passive:true });
  game.addEventListener('touchcancel', () => { start = null; }, { passive:true });
  window.addEventListener('resize', apply);
})();
