(() => {
  const articleSelector = '.article-page-format, .single-page .article-format-inner, [data-article-head]';
  const extensions = ['webp', 'png', 'jpg', 'jpeg', 'gif'];
  const candidates = name => extensions.map(ext => `/assets/img/${name}.${ext}`);
  const test = src => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve('');
    img.src = `${src}?v=20260707-solid2`;
  });
  const find = async name => {
    for (const src of candidates(name)) {
      const ok = await test(src);
      if (ok) return ok;
    }
    return '';
  };
  const addStyle = () => {
    if (document.querySelector('[data-article-ornament-solid-style]')) return;
    const style = document.createElement('style');
    style.dataset.articleOrnamentSolidStyle = '1';
    style.textContent = `
      .article-ornament-column {
        position: fixed !important;
        top: 0 !important;
        right: 0 !important;
        bottom: auto !important;
        width: var(--article-ornament-width, 150px) !important;
        height: 100vh !important;
        height: 100svh !important;
        overflow: hidden !important;
        z-index: 6 !important;
        pointer-events: none !important;
        background: #050505 !important;
        transform: translateZ(0) !important;
        backface-visibility: hidden !important;
        contain: paint !important;
      }
      .article-ornament-column:not(.is-ready) { display: none !important; }
      .article-ornament-track {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        animation: mancuspieOrnamentSolid 11s linear infinite !important;
        will-change: transform !important;
        transform: translate3d(0, -50%, 0) !important;
        backface-visibility: hidden !important;
      }
      .article-ornament-track img {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        flex: 0 0 auto !important;
        vertical-align: top !important;
        background: #050505 !important;
      }
      @keyframes mancuspieOrnamentSolid {
        from { transform: translate3d(0, -50%, 0); }
        to { transform: translate3d(0, 0, 0); }
      }
      @media (max-width: 760px) {
        .article-ornament-column {
          height: 100svh !important;
          min-height: 100svh !important;
        }
        .article-ornament-track { animation-duration: 10s !important; }
      }
    `;
    document.head.appendChild(style);
  };
  const pattern = (m2, m1) => {
    const rows = [];
    for (let i = 0; i < 48; i += 1) {
      rows.push(m2);
      if (m1 && [4, 11, 18, 27, 36, 44].includes(i)) rows.push(m1);
    }
    return rows;
  };
  const makeImg = src => {
    const img = document.createElement('img');
    img.src = `${src}?v=20260707-solid2`;
    img.alt = '';
    img.loading = 'eager';
    img.decoding = 'async';
    img.draggable = false;
    return img;
  };
  const build = async () => {
    if (!document.querySelector(articleSelector)) return;
    if (document.querySelector('[data-article-ornament-column]')) return;
    addStyle();
    const m2 = await find('m2');
    if (!m2) return;
    const m1 = await find('m1');
    const seq = pattern(m2, m1);
    const doubled = seq.concat(seq);
    const column = document.createElement('aside');
    column.className = 'article-ornament-column';
    column.dataset.articleOrnamentColumn = '1';
    column.setAttribute('aria-hidden', 'true');
    const track = document.createElement('div');
    track.className = 'article-ornament-track';
    doubled.forEach(src => track.appendChild(makeImg(src)));
    column.appendChild(track);
    document.body.appendChild(column);
    requestAnimationFrame(() => column.classList.add('is-ready'));
  };
  const start = () => build().catch(() => {});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  setTimeout(start, 500);
  setTimeout(start, 1300);
})();
