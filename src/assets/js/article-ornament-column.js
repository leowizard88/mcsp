(() => {
  const cache = '20260707-scroll-4';

  const isArticlePage = () => {
    if (document.querySelector('#home')) return false;
    if (document.querySelector('.archive-system-page, .ultimi-page')) return false;
    if (document.querySelector('.single-page, .article-page-format, .article-format-inner, [data-article-head]')) return true;
    return /^\/[^#?]+\/$/.test(location.pathname) && location.pathname !== '/';
  };

  const loadEmergencyCss = () => {
    if (document.querySelector('[data-article-rail-emergency-css]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/assets/css/article-rail-emergency.css?v=${cache}`;
    link.dataset.articleRailEmergencyCss = '1';
    document.head.appendChild(link);
  };

  const build = () => {
    if (!isArticlePage()) return;
    loadEmergencyCss();
  };

  const start = () => {
    try { build(); } catch {}
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  setTimeout(start, 400);
  setTimeout(start, 1200);
})();