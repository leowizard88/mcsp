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
  const makeTile = src => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'eager';
    img.decoding = 'async';
    img.draggable = false;
    return img;
  };
  const makeSequence = (m2, m1) => {
    const rows = [];
    for (let i = 0; i < 32; i += 1) {
      rows.push(m2);
      if (m1 && [3, 9, 16, 23, 29].includes(i)) rows.push(m1);
    }
    return rows;
  };
  const waitForImages = track => Promise.all([...track.images].map(img => {
    if (img.complete && img.naturalWidth) return Promise.resolve(true);
    return new Promise(resolve => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });
  }));
  const buildTrack = async (track, column, m2, m1) => {
    track.innerHTML = '';
    const sequence = makeSequence(m2, m1);
    const block = document.createElement('div');
    block.className = 'article-ornament-block';
    sequence.forEach(src => block.appendChild(makeTile(src)));
    track.appendChild(block);
    await waitForImages(block);

    const minBlockHeight = Math.max(window.innerHeight * 1.5, column.clientHeight * 1.5, 1200);
    let guard = 0;
    while (block.offsetHeight < minBlockHeight && guard < 8) {
      sequence.forEach(src => block.appendChild(makeTile(src)));
      await waitForImages(block);
      guard += 1;
    }

    const cloneA = block.cloneNode(true);
    const cloneB = block.cloneNode(true);
    track.appendChild(cloneA);
    track.appendChild(cloneB);
    return block.offsetHeight;
  };
  const animate = (track, getBlockHeight) => {
    let offset = 0;
    let last = performance.now();
    const speed = 145;
    const step = now => {
      const delta = Math.min(48, now - last);
      last = now;
      const blockHeight = getBlockHeight();
      if (blockHeight > 0) {
        offset = (offset + (speed * delta) / 1000) % blockHeight;
        track.style.transform = `translate3d(0, ${-blockHeight + offset}px, 0)`;
      }
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

    let blockHeight = await buildTrack(track, column, m2, m1Ready ? m1 : '');
    column.classList.add('is-ready');
    animate(track, () => blockHeight);

    let resizing = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizing);
      resizing = setTimeout(async () => {
        blockHeight = await buildTrack(track, column, m2, m1Ready ? m1 : '');
      }, 220);
    }, { passive: true });
  };

  const start = () => build().catch(() => {});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  setTimeout(start, 600);
  setTimeout(start, 1600);
})();
