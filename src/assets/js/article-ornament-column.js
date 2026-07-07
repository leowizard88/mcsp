(() => {
  const cache = '20260707-scroll-3';

  const isArticlePage = () => {
    if (document.querySelector('#home')) return false;
    if (document.querySelector('.archive-system-page, .ultimi-page')) return false;
    if (document.querySelector('.article-page-format, .article-format-inner, [data-article-head]')) return true;
    return /^\/[^#?]+\/$/.test(location.pathname) && location.pathname !== '/';
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
        z-index: 10050 !important;
        pointer-events: none !important;
        background: #050000 !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        transform: none !important;
        backface-visibility: hidden !important;
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
        animation: articleOrnamentFall 28s linear infinite !important;
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

      @keyframes articleOrnamentFall {
        from { transform: translate3d(0, -50%, 0); }
        to { transform: translate3d(0, 0, 0); }
      }

      @media (max-width: 760px) {
        .article-ornament-column {
          width: var(--article-ornament-width, 52px) !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const src = name => `/assets/img/${name}.png?v=${cache}`;

  const makeImg = name => {
    const img = document.createElement('img');
    img.src = src(name);
    img.alt = '';
    img.loading = 'eager';
    img.decoding = 'async';
    img.draggable = false;
    img.className = name === 'm1' ? 'is-m1' : 'is-m2';
    return img;
  };

  const buildSequence = () => {
    const seq = [];
    const m1Slots = new Set([7, 19, 34, 52, 73]);
    for (let i = 0; i < 90; i += 1) {
      seq.push('m2');
      if (m1Slots.has(i)) seq.push('m1');
    }
    return seq;
  };

  const build = () => {
    if (!isArticlePage()) return;
    if (document.querySelector('[data-article-ornament-column]')) return;

    addStyle();

    const column = document.createElement('aside');
    column.className = 'article-ornament-column is-ready';
    column.dataset.articleOrnamentColumn = '1';
    column.setAttribute('aria-hidden', 'true');

    const track = document.createElement('div');
    track.className = 'article-ornament-track';

    const seq = buildSequence();
    seq.concat(seq).forEach(name => track.appendChild(makeImg(name)));

    column.appendChild(track);
    document.body.appendChild(column);
  };

  const start = () => {
    try { build(); } catch {}
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  setTimeout(start, 400);
  setTimeout(start, 1200);
})();