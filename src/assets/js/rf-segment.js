(() => {
  const srcPart = ['cadd18066d65865e8f75faaa72b9d8d7','removebg','preview.png'].join('-');
  const img = [...document.images].find(x => x.src.includes(srcPart));
  const log = document.querySelector('[data-chrollo-log]');
  if (!img || !log || img.dataset.cutReady) return;
  img.dataset.cutReady = '1';
  const parent = img.parentNode;
  const box = document.createElement('span');
  box.style.cssText = 'position:relative;display:block;width:280px;max-width:26vw;flex:0 0 auto;filter:drop-shadow(7px 7px 0 rgba(0,0,0,.72));pointer-events:none';
  img.style.cssText = 'display:block;width:100%;height:auto;filter:none;max-width:none;transition:none';
  parent.insertBefore(box, img);
  box.appendChild(img);

  const gap = document.createElement('span');
  gap.style.cssText = 'position:absolute;left:31%;top:72%;width:38%;height:0;background:#000;border-radius:999px;opacity:0;transform:translateY(0);filter:blur(.2px)';
  box.appendChild(gap);

  const part = img.cloneNode(false);
  part.style.cssText = 'position:absolute;inset:0;width:100%;height:auto;clip-path:inset(69% 0 0 0);transform-origin:50% 72%;opacity:1;transition:none';
  box.appendChild(part);

  const resize = () => { if (innerWidth <= 760) { box.style.width = '220px'; box.style.maxWidth = '58vw'; } else { box.style.width = '280px'; box.style.maxWidth = '26vw'; } };
  addEventListener('resize', resize, { passive: true });
  resize();

  const frame = y => {
    part.style.transform = `translateY(${y}px)`;
    gap.style.opacity = y ? '1' : '0';
    gap.style.height = y ? `${Math.max(6, Math.floor(y * 1.35))}px` : '0';
    gap.style.transform = `translateY(${Math.floor(y / 2)}px)`;
  };

  const move = () => {
    [0,14,0,16,0,13,0].forEach((y,i)=>setTimeout(()=>frame(y), i*95));
    setTimeout(()=>frame(0), 760);
  };

  new MutationObserver(items => { for (const item of items) for (const node of item.addedNodes) if (node.nodeType === 1 && node.classList.contains('bot')) move(); }).observe(log, { childList: true });
})();
