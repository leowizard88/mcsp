(() => {
  const articleSelector = '.article-page-format, .single-page .article-format-inner, [data-article-head]';
  const extensions = ['webp', 'png', 'jpg', 'jpeg', 'gif'];
  const cache = '20260707-scroll-1';
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
    if (document.querySelector('[data-article-ornament-scroll-style]')) return;
    const style = document.createElement('style');
    style.dataset.articleOrnamentScrollStyle = '1';
    style.textContent = `
      .article-ornament-column {
        position: fixed !important;
        top: 0 !important;
        right: 0 !important;
        width: var(--article-ornament-width, 150px) !important;
        height: 100vh !important;
        min-height: 100vh !important;
        overflow: hidden !important;
        z-index: 6 !important;
        pointer-events: none !important;
        background: #050000 !important;
        transform: none !important;
        backface-visibility: hidden !important;
      }

      .article-ornament-column:not(.is-ready) {
        visibility: hidden !important;
      }

      .article-ornament-track {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        will-change: transform !important;
        backface-visibility: hidden !important;
        transform: translate3d(0, -50%, 0) !important;
        animation: articleOrnamentFall 42s linear infinite !important;
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
        user-select: none !important;
      }

      .article-ornament-track img.is-m1 {
        opacity: .96 !important;
      }

      @keyframes articleOrnamentFall {
        from { transform: translate3d(0, -50%, 0); }
        to { transform: translate3d(0, 0, 0); }
      }

      @media (prefers-reduced-motion: reduce) {
        .article-ornament-track {
          animation-duration: 140s !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const pattern = (m2, m1) => {
    const rows = [];
    const m1Slots = new Set([5, 14, 26, 39, 53, 70]);
    for (let i = 0; i < 78; i += 1) {
      rows.push({ src: m2, kind: 'm2' });
      if (m1 && m1Slots.has(i)) rows.push({ src: m1, kind: 'm1' });
    }
    return rows;
  };

  const makeImg = item => {
    const img = document.createElement('img');
    img.src = `${item.src}?v=${cache}`;
    img.alt = '';
    img.loading = 'eager';
    img.decoding = 'async';
    img.draggable = false;
    img.className = item.kind === 'm1' ? 'is-m1' : 'is-m2';
    return img;
  };

  const waitImages = root => Promise.all([...root.querySelectorAll('img')].map(img => {
    if (img.complete && img.naturalWidth) return Promise.resolve(true);
    return new Promise(resolve => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });
  }));

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

    seq.concat(seq).forEach(item => track.appendChild(makeImg(item)));

    column.appendChild(track);
    document.body.appendChild(column);
    await waitImages(track);
    column.classList.add('is-ready');
  };

  const start = () => build().catch(() => {});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  setTimeout(start, 500);
  setTimeout(start, 1300);
})();