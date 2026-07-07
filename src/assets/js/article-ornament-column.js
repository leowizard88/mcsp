(() => {
  const articleSelector = '.article-page-format, .single-page .article-format-inner, [data-article-head]';
  const extensions = ['webp', 'png', 'jpg', 'jpeg', 'gif'];
  const cache = '20260707-down1';
  const candidates = name => extensions.map(ext => `/assets/img/${name}.${ext}`);
  const test = src => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve('');
    img.src = `${src}?v=${cache}`;
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
        min-height: 100vh !important;
        overflow: hidden !important;
        z-index: 6 !important;
        pointer-events: none !important;
        background-color: transparent !important;
        transform: none !important;
        backface-visibility: hidden !important;
      }
      .article-ornament-column:not(.is-ready) { visibility: hidden !important; }
      .article-ornament-track {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        animation: none !important;
        will-change: transform !important;
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
        background: transparent !important;
      }
    `;
    document.head.appendChild(style);
  };
  const pattern = (m2, m1) => {
    const rows = [];
    for (let i = 0; i < 64; i += 1) {
      rows.push(m2);
      if (m1 && [4, 10, 18, 27, 37, 48, 59].includes(i)) rows.push(m1);
    }
    return rows;
  };
  const makeImg = src => {
    const img = document.createElement('img');
    img.src = `${src}?v=${cache}`;
    img.alt = '';
    img.loading = 'eager';
    img.decoding = 'sync';
    img.draggable = false;
    return img;
  };
  const waitImages = root => Promise.all([...root.querySelectorAll('img')].map(img => {
    if (img.complete && img.naturalWidth) return Promise.resolve(true);
    return new Promise(resolve => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });
  }));
  const run = (track, blockHeight) => {
    let offset = 0;
    let last = performance.now();
    const speed = 155;
    const tick = now => {
      const delta = Math.min(40, now - last);
      last = now;
      offset = (offset + speed * delta / 1000) % blockHeight;
      track.style.setProperty('transform', `translate3d(0, ${offset - blockHeight}px, 0)`, 'important');
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const build = async () => {
    if (!document.querySelector(articleSelector)) return;
    if (document.querySelector('[data-article-ornament-column]')) return;
    addStyle();
    const m2 = await find('m2');
    if (!m2) return;
    const m1 = await find('m1');
    const seq = pattern(m2, m1);
    const column = document.createElement('aside');
    column.className = 'article-ornament-column';
    column.dataset.articleOrnamentColumn = '1';
    column.setAttribute('aria-hidden', 'true');
    const track = document.createElement('div');
    track.className = 'article-ornament-track';
    seq.concat(seq, seq).forEach(src => track.appendChild(makeImg(src)));
    column.appendChild(track);
    document.body.appendChild(column);
    await waitImages(track);
    const blockHeight = Math.max(1, Math.round(track.scrollHeight / 3));
    track.style.setProperty('transform', `translate3d(0, ${-blockHeight}px, 0)`, 'important');
    column.classList.add('is-ready');
    run(track, blockHeight);
  };
  const start = () => build().catch(() => {});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  setTimeout(start, 500);
  setTimeout(start, 1300);
})();
