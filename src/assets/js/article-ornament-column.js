(() => {
  const ARTICLE_SELECTOR = '.article-page-format, .single-page .article-format-inner, [data-article-head]';
  const CACHE = '20260707-solid';

  const isArticle = () => !!document.querySelector(ARTICLE_SELECTOR);
  const candidates = name => ['webp', 'png', 'jpg', 'jpeg', 'gif'].map(ext => `/assets/img/${name}.${ext}`);

  const findImage = async name => {
    for (const src of candidates(name)) {
      const ok = await new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = `${src}?v=${CACHE}`;
      });
      if (ok) return src;
    }
    return '';
  };

  const loadImage = src => new Promise(resolve => {
    if (!src) { resolve(null); return; }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `${src}?v=${CACHE}`;
  });

  const injectStyle = () => {
    if (document.querySelector('[data-solid-ornament-style]')) return;
    const style = document.createElement('style');
    style.dataset.solidOrnamentStyle = '1';
    style.textContent = `
      .article-ornament-column {
        position: fixed !important;
        top: 0 !important;
        right: 0 !important;
        bottom: auto !important;
        width: var(--article-ornament-width, 150px) !important;
        height: 100vh !important;
        height: 100svh !important;
        z-index: 6 !important;
        overflow: hidden !important;
        pointer-events: none !important;
        background-color: #050505 !important;
        background-image: var(--ornament-pattern) !important;
        background-repeat: repeat-y !important;
        background-size: 100% var(--ornament-pattern-height) !important;
        background-position: 0 calc(-1 * var(--ornament-pattern-height)) !important;
        transform: translateZ(0) !important;
        backface-visibility: hidden !important;
        contain: paint !important;
        opacity: 1 !important;
        animation: solidOrnamentScroll var(--ornament-duration, 9s) linear infinite !important;
      }

      .article-ornament-column:not(.is-ready) {
        display: none !important;
      }

      .article-ornament-track,
      .article-ornament-block,
      .article-ornament-m1 {
        display: none !important;
      }

      @keyframes solidOrnamentScroll {
        from { background-position: 0 calc(-1 * var(--ornament-pattern-height)); }
        to { background-position: 0 0; }
      }
    `;
    document.head.appendChild(style);
  };

  const drawPattern = (m2, m1) => {
    const width = 260;
    const rows = [];
    for (let i = 0; i < 20; i += 1) {
      rows.push(m2);
      if (m1 && [2, 7, 13, 18].includes(i)) rows.push(m1);
    }

    const heights = rows.map(img => Math.max(1, Math.round(width * img.naturalHeight / Math.max(1, img.naturalWidth))));
    const height = heights.reduce((sum, value) => sum + value, 0);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    let y = 0;
    rows.forEach((img, index) => {
      const h = heights[index];
      ctx.drawImage(img, 0, y, width, h);
      y += h;
    });

    return { url: canvas.toDataURL('image/jpeg', 0.86), height };
  };

  const build = async () => {
    if (!isArticle() || document.querySelector('[data-article-ornament-column]')) return;

    injectStyle();

    const m2Path = await findImage('m2');
    if (!m2Path) return;
    const m1Path = await findImage('m1');

    const m2 = await loadImage(m2Path);
    if (!m2) return;
    const m1 = await loadImage(m1Path);
    const pattern = drawPattern(m2, m1);

    const column = document.createElement('aside');
    column.className = 'article-ornament-column';
    column.dataset.articleOrnamentColumn = '1';
    column.setAttribute('aria-hidden', 'true');
    column.style.setProperty('--ornament-pattern', `url("${pattern.url}")`);
    column.style.setProperty('--ornament-pattern-height', `${pattern.height}px`);
    column.style.setProperty('--ornament-duration', `${Math.max(6, Math.min(13, pattern.height / 185))}s`);

    document.body.appendChild(column);
    requestAnimationFrame(() => column.classList.add('is-ready'));
  };

  const start = () => build().catch(() => {});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  setTimeout(start, 600);
  setTimeout(start, 1600);
})();
