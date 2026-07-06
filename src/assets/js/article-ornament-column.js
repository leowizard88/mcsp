(() => {
  const isArticle = () => !!document.querySelector('.article-page-format .article-format-inner');
  const candidates = name => ['webp', 'png', 'jpg', 'jpeg', 'gif'].map(ext => `/assets/img/${name}.${ext}`);
  const testImage = src => new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(src);
    image.onerror = () => resolve('');
    image.src = `${src}?v=20260706`;
  });
  const preload = src => new Promise(resolve => {
    if (!src) { resolve(false); return; }
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });
  const findImage = async name => {
    for (const src of candidates(name)) {
      const found = await testImage(src);
      if (found) return found;
    }
    return '';
  };
  const build = async () => {
    if (!isArticle() || document.querySelector('[data-article-ornament-column]')) return;
    const m2 = await findImage('m2');
    if (!m2) return;
    const m1 = await findImage('m1');
    await preload(m2);
    if (m1) await preload(m1);

    const column = document.createElement('aside');
    column.className = 'article-ornament-column';
    column.dataset.articleOrnamentColumn = '1';
    column.setAttribute('aria-hidden', 'true');
    column.style.setProperty('--ornament-m2', `url("${m2}")`);

    if (m1) {
      for (let i = 0; i < 4; i += 1) {
        const img = document.createElement('img');
        img.className = 'article-ornament-m1';
        img.src = m1;
        img.alt = '';
        img.decoding = 'async';
        img.loading = 'eager';
        column.appendChild(img);
      }
    }

    document.body.appendChild(column);
    requestAnimationFrame(() => column.classList.add('is-ready'));
  };

  const start = () => build().catch(() => {});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
