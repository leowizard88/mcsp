(() => {
  const v = '20260707-c-rail-2';
  const exts = ['png', 'webp', 'jpg', 'jpeg', 'gif'];

  const isArticle = () => {
    const p = location.pathname || '/';
    if (p === '/' || p === '/index.html') return false;
    if (p.startsWith('/admin') || p.startsWith('/archivio') || p.startsWith('/ultimi')) return false;
    if (document.querySelector('#home, .archive-page, .archive-system-page, .ultimi-page')) return false;
    return true;
  };

  const test = url => new Promise(resolve => {
    const img = document.createElement('img');
    img.onload = () => resolve(url);
    img.onerror = () => resolve('');
    img.src = url;
  });

  const find = async name => {
    for (const ext of exts) {
      const found = await test(`/assets/img/${name}.${ext}?v=${v}`);
      if (found) return found;
    }
    return '';
  };

  const css = () => {
    if (document.querySelector('[data-c-rail-style]')) return;
    const style = document.createElement('style');
    style.dataset.cRailStyle = '1';
    style.textContent = `.c-rail{position:fixed!important;top:0!important;right:0!important;width:150px!important;height:100vh!important;overflow:hidden!important;z-index:20!important;pointer-events:none!important;background:transparent!important}.c-rail-track{position:absolute!important;left:0!important;top:0!important;width:100%!important;display:flex!important;flex-direction:column!important;animation:cRailDown 54s linear infinite!important}.c-rail-track img{display:block!important;width:100%!important;height:auto!important;margin:0!important;padding:0!important;border:0!important;flex:0 0 auto!important}@keyframes cRailDown{from{transform:translate3d(0,-50%,0)}to{transform:translate3d(0,0,0)}}@media(max-width:760px){.c-rail{width:52px!important}}`;
    document.head.appendChild(style);
  };

  const image = url => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.loading = 'eager';
    img.decoding = 'async';
    img.draggable = false;
    return img;
  };

  const build = async () => {
    if (!isArticle()) return;
    if (document.querySelector('[data-c-rail]')) return;

    const c1 = await find('c1');
    if (!c1) return;
    const c2 = await find('c2');

    css();

    const rail = document.createElement('div');
    rail.className = 'c-rail';
    rail.dataset.cRail = '1';
    rail.setAttribute('aria-hidden', 'true');

    const track = document.createElement('div');
    track.className = 'c-rail-track';

    const c2At = new Set([9, 23, 38, 57, 79, 96]);
    const urls = [];
    for (let i = 0; i < 110; i += 1) {
      urls.push(c1);
      if (c2 && c2At.has(i)) urls.push(c2);
    }
    urls.concat(urls).forEach(url => track.appendChild(image(url)));

    rail.appendChild(track);
    document.body.appendChild(rail);
  };

  const start = () => build().catch(() => {});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();