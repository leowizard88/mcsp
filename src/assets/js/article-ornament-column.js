(() => {
  const cache = '20260707-force-1';

  const isArticlePage = () => {
    const path = location.pathname || '/';
    if (path === '/' || path === '/index.html') return false;
    if (path.startsWith('/admin') || path.startsWith('/archivio') || path.startsWith('/ultimi')) return false;
    if (document.querySelector('#home, .archive-system-page, .ultimi-page')) return false;
    return true;
  };

  const addStyle = () => {
    if (document.querySelector('[data-mancuspie-force-rail-style]')) return;
    const style = document.createElement('style');
    style.dataset.mancuspieForceRailStyle = '1';
    style.textContent = `
      .mancuspie-force-rail {
        position: fixed !important;
        top: 0 !important;
        right: 0 !important;
        width: var(--article-ornament-width, 150px) !important;
        height: 100vh !important;
        overflow: hidden !important;
        z-index: 2147483000 !important;
        pointer-events: none !important;
        background: #050000 !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        transform: none !important;
      }

      .mancuspie-force-rail-track {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        animation: mancuspieForceRailDrop 24s linear infinite !important;
        will-change: transform !important;
      }

      .mancuspie-force-rail-track img {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        flex: 0 0 auto !important;
      }

      @keyframes mancuspieForceRailDrop {
        from { transform: translate3d(0, -50%, 0); }
        to { transform: translate3d(0, 0, 0); }
      }

      @media(max-width:760px) {
        .mancuspie-force-rail {
          width: var(--article-ornament-width, 52px) !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const img = name => {
    const node = document.createElement('img');
    node.src = `/assets/img/${name}.png?v=${cache}`;
    node.alt = '';
    node.decoding = 'async';
    node.loading = 'eager';
    node.draggable = false;
    return node;
  };

  const sequence = () => {
    const out = [];
    const m1At = new Set([8, 22, 41, 63, 86]);
    for (let i = 0; i < 100; i += 1) {
      out.push('m2');
      if (m1At.has(i)) out.push('m1');
    }
    return out;
  };

  const build = () => {
    if (!isArticlePage()) return;
    if (document.querySelector('[data-mancuspie-force-rail]')) return;

    addStyle();

    const rail = document.createElement('div');
    rail.className = 'mancuspie-force-rail';
    rail.dataset.mancuspieForceRail = '1';
    rail.setAttribute('aria-hidden', 'true');

    const track = document.createElement('div');
    track.className = 'mancuspie-force-rail-track';

    const seq = sequence();
    seq.concat(seq).forEach(name => track.appendChild(img(name)));

    rail.appendChild(track);
    document.body.appendChild(rail);
  };

  const start = () => {
    try { build(); } catch {}
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  setTimeout(start, 300);
  setTimeout(start, 1000);
})();