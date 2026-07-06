(() => {
  const isArticle = () => !!document.querySelector('.article-page-format, .single-page .article-format-inner, [data-article-head]');
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
  const chooseImage = (m2, m1) => {
    if (!m1) return m2;
    return Math.random() < 0.18 ? m1 : m2;
  };
  const makeTile = src => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'eager';
    img.decoding = 'async';
    img.draggable = false;
    return img;
  };
  const fillTrack = (track, column, m2, m1) => {
    track.innerHTML = '';
    const minHeight = Math.max(window.innerHeight * 2.6, column.clientHeight * 2.6, 1600);
    let safety = 0;
    while (track.scrollHeight < minHeight && safety < 90) {
      const src = safety === 2 || safety === 9 || safety === 17 ? (m1 || m2) : chooseImage(m2, m1);
      track.appendChild(makeTile(src));
      safety += 1;
    }
  };
  const animate = (track, column, m2, m1) => {
    let offset = 0;
    let last = performance.now();
    const speed = 260;
    const step = now => {
      const delta = Math.min(48, now - last);
      last = now;
      offset += (speed * delta) / 1000;

      let first = track.firstElementChild;
      let guard = 0;
      while (first && offset >= first.offsetHeight && guard < 12) {
        offset -= first.offsetHeight;
        first.remove();
        track.appendChild(makeTile(chooseImage(m2, m1)));
        first = track.firstElementChild;
        guard += 1;
      }

      if (track.scrollHeight < Math.max(window.innerHeight * 2.4, column.clientHeight * 2.4, 1400)) {
        track.appendChild(makeTile(chooseImage(m2, m1)));
      }

      track.style.transform = `translate3d(0, ${offset}px, 0)`;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const build = async () => {
    if (!isArticle() || document.querySelector('[data-article-ornament-column]')) return;
    const m2 = await findImage('m2');
    if (!m2) return;
    const m1 = await findImage('m1');
    const m2Ready = await preload(m2);
    const m1Ready = m1 ? await preload(m1) : false;
    if (!m2Ready) return;

    const column = document.createElement('aside');
    column.className = 'article-ornament-column';
    column.dataset.articleOrnamentColumn = '1';
    column.setAttribute('aria-hidden', 'true');

    const track = document.createElement('div');
    track.className = 'article-ornament-track';
    column.appendChild(track);
    document.body.appendChild(column);

    const realM1 = m1Ready ? m1 : '';
    fillTrack(track, column, m2, realM1);
    column.classList.add('is-ready');
    animate(track, column, m2, realM1);

    window.addEventListener('resize', () => fillTrack(track, column, m2, realM1), { passive: true });
  };

  const start = () => build().catch(() => {});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  setTimeout(start, 600);
  setTimeout(start, 1600);
})();
