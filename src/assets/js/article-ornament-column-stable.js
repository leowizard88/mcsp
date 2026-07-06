(() => {
  const readyTarget = () => document.querySelector('.article-page-format, .single-page .article-format-inner, [data-article-head]');
  const formats = name => ['webp', 'png', 'jpg', 'jpeg', 'gif'].map(ext => `/assets/img/${name}.${ext}`);
  const probe = src => new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(src);
    image.onerror = () => resolve('');
    image.src = `${src}?v=20260706`;
  });
  const load = src => new Promise(resolve => {
    if (!src) return resolve(false);
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });
  const find = async name => {
    for (const src of formats(name)) {
      const ok = await probe(src);
      if (ok) return ok;
    }
    return '';
  };
  const tile = src => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'eager';
    img.decoding = 'async';
    img.draggable = false;
    return img;
  };
  const sequence = (m2, m1) => {
    const items = [];
    for (let i = 0; i < 32; i += 1) {
      items.push(m2);
      if (m1 && [3, 9, 16, 23, 29].includes(i)) items.push(m1);
    }
    return items;
  };
  const waitImages = root => Promise.all(Array.from(root.querySelectorAll('img')).map(img => {
    if (img.complete && img.naturalWidth) return Promise.resolve(true);
    return new Promise(resolve => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });
  }));
  const makeBlock = async (track, column, m2, m1) => {
    track.replaceChildren();
    const items = sequence(m2, m1);
    const block = document.createElement('div');
    block.className = 'article-ornament-block';
    items.forEach(src => block.appendChild(tile(src)));
    track.appendChild(block);
    await waitImages(block);
    const needed = Math.max(window.innerHeight * 1.5, column.clientHeight * 1.5, 1200);
    let guard = 0;
    while (block.offsetHeight < needed && guard < 8) {
      items.forEach(src => block.appendChild(tile(src)));
      await waitImages(block);
      guard += 1;
    }
    track.appendChild(block.cloneNode(true));
    track.appendChild(block.cloneNode(true));
    return block.offsetHeight;
  };
  const run = (track, heightRef) => {
    let offset = 0;
    let last = performance.now();
    const speed = 145;
    const frame = now => {
      const dt = Math.min(48, now - last);
      last = now;
      if (heightRef.value > 0) {
        offset = (offset + speed * dt / 1000) % heightRef.value;
        track.style.transform = `translate3d(0, ${-heightRef.value + offset}px, 0)`;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  const build = async () => {
    if (!readyTarget() || document.querySelector('[data-article-ornament-column]')) return;
    const m2 = await find('m2');
    if (!m2 || !(await load(m2))) return;
    const maybeM1 = await find('m1');
    const m1 = maybeM1 && await load(maybeM1) ? maybeM1 : '';
    const column = document.createElement('aside');
    column.className = 'article-ornament-column';
    column.dataset.articleOrnamentColumn = '1';
    column.setAttribute('aria-hidden', 'true');
    const track = document.createElement('div');
    track.className = 'article-ornament-track';
    column.appendChild(track);
    document.body.appendChild(column);
    const heightRef = { value: await makeBlock(track, column, m2, m1) };
    column.classList.add('is-ready');
    run(track, heightRef);
    let resizing = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizing);
      resizing = setTimeout(async () => {
        heightRef.value = await makeBlock(track, column, m2, m1);
      }, 220);
    }, { passive: true });
  };
  const start = () => build().catch(() => {});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  setTimeout(start, 600);
  setTimeout(start, 1600);
})();
