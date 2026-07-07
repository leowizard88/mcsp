(() => {
  const version = '20260707-resolve-3';
  const exts = ['webp', 'png', 'jpg', 'jpeg', 'gif'];

  const isArticle = () => {
    if (document.querySelector('#home, .archive-page, .archive-system-page, .ultimi-page')) return false;
    return !!document.querySelector('.single-page:not(.archive-page), .article-format-inner, .article-page-format, [data-article-head]');
  };

  const loadOne = url => new Promise(resolve => {
    const probe = document.createElement('img');
    probe.onload = () => resolve(url);
    probe.onerror = () => resolve('');
    probe.src = url;
  });

  const findUrl = async name => {
    for (const ext of exts) {
      const url = `/assets/img/${name}.${ext}?v=${version}`;
      const found = await loadOne(url);
      if (found) return found;
    }
    return '';
  };

  const addCss = () => {
    if (document.querySelector('[data-force-rail-css]')) return;
    const style = document.createElement('style');
    style.dataset.forceRailCss = '1';
    style.textContent = `.mancuspie-force-rail{position:fixed!important;top:96px!important;right:0!important;width:var(--article-ornament-width,150px)!important;height:calc(100vh - 96px)!important;overflow:hidden!important;z-index:40!important;pointer-events:none!important;background:#050000!important;display:block!important;visibility:visible!important;opacity:1!important}.mancuspie-force-rail-track{position:absolute!important;left:0!important;top:0!important;width:100%!important;display:flex!important;flex-direction:column!important;animation:mancuspieForceRailDrop 48s linear infinite!important;will-change:transform!important}.mancuspie-force-rail-track img{display:block!important;width:100%!important;height:auto!important;margin:0!important;padding:0!important;border:0!important;flex:0 0 auto!important}@keyframes mancuspieForceRailDrop{from{transform:translate3d(0,-50%,0)}to{transform:translate3d(0,0,0)}}@media(max-width:760px){.mancuspie-force-rail{top:74px!important;width:var(--article-ornament-width,52px)!important;height:calc(100vh - 74px)!important}}`;
    document.head.appendChild(style);
  };

  const makeImg = url => {
    const node = document.createElement('img');
    node.src = url;
    node.alt = '';
    node.loading = 'eager';
    node.decoding = 'async';
    node.draggable = false;
    return node;
  };

  const build = async () => {
    if (!isArticle()) return;
    if (document.querySelector('[data-mancuspie-force-rail]')) return;
    const m2 = await findUrl('m2');
    if (!m2) return;
    const m1 = await findUrl('m1');
    const rail = document.createElement('div');
    rail.className = 'mancuspie-force-rail';
    rail.dataset.mancuspieForceRail = '1';
    rail.setAttribute('aria-hidden', 'true');
    const track = document.createElement('div');
    track.className = 'mancuspie-force-rail-track';
    const m1Slots = new Set([8, 22, 41, 63, 86]);
    const urls = [];
    for (let i = 0; i < 100; i += 1) {
      urls.push(m2);
      if (m1 && m1Slots.has(i)) urls.push(m1);
    }
    urls.concat(urls).forEach(url => track.appendChild(makeImg(url)));
    rail.appendChild(track);
    addCss();
    document.body.appendChild(rail);
  };

  const start = () => { build().catch(() => {}); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  setTimeout(start, 700);
})();