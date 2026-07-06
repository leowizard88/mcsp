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
  const pattern = (m2, m1) => {
    const rows = [];
    for (let i = 0; i < 26; i += 1) {
      rows.push(m2);
      if (m1 && [4, 11, 19, 24].includes(i)) rows.push(m1);
    }
    return rows;
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
    const track = document.createElement('div');
    track.className = 'article-ornament-track';
    const images = pattern(m2, m1);
    const doubled = images.concat(images);
    track.innerHTML = doubled.map((src, index) => `<img src="${src}" alt="" loading="eager" decoding="async" data-ornament-index="${index}">`).join('');
    column.appendChild(track);
    document.body.appendChild(column);
    requestAnimationFrame(() => column.classList.add('is-ready'));
  };
  build().catch(() => {});
})();
