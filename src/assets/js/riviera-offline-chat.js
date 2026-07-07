(() => {
  const form = document.querySelector('[data-chrollo-form]');
  const log = document.querySelector('[data-chrollo-log]');
  const box = document.querySelector('.chrollo-box');
  if (!form || !log || !box) return;

  let portrait;
  (() => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:flex-end;justify-content:center;gap:36px;width:min(1040px,calc(100vw - var(--side,44px) - 28px))';
    box.parentNode.insertBefore(wrap, box);
    wrap.appendChild(box);
    portrait = document.createElement('img');
    portrait.src = '/assets/img/' + ['cadd18066d65865e8f75faaa72b9d8d7','removebg','preview.png'].join('-');
    portrait.alt = '';
    portrait.style.cssText = 'width:280px;max-width:26vw;height:auto;filter:drop-shadow(7px 7px 0 rgba(0,0,0,.72));pointer-events:none;transition:transform .08s linear';
    wrap.appendChild(portrait);
    const fit = () => { if (innerWidth <= 760) { wrap.style.flexDirection = 'column-reverse'; portrait.style.width = '220px'; portrait.style.maxWidth = '58vw'; } else { wrap.style.flexDirection = 'row'; portrait.style.width = '280px'; portrait.style.maxWidth = '26vw'; } };
    addEventListener('resize', fit, { passive: true });
    fit();
  })();

  const talk = () => { [0,4,0,5,0,3,0].forEach((y,i)=>setTimeout(()=>{ if (portrait) portrait.style.transform = `translateY(${y}px)`; }, i*85)); };
  const base = ['Hard','Gasa','Fuoco','duro','ci sta','fuori','lame','crazy','insane','non regge','taglia corto','zero teatro','meno retorica','solo forma'];
  const extra = () => Array.isArray(window.RF_EXTRA_LINES) ? window.RF_EXTRA_LINES : [];
  const pick = arr => arr[Math.floor(Math.random() * arr.length)] || 'Hard';
  const reply = text => {
    const t = String(text || '').toLowerCase();
    const pool = base.concat(extra());
    if (/amore|gelosia|desiderio/.test(t)) return pick(['lame','ci sta','hard','non regge'].concat(extra()));
    if (/paura|ansia|panico/.test(t)) return pick(['Hard','fuori','duro','taglia corto'].concat(extra()));
    if (/politica|potere|stato|capital|fasc/.test(t)) return pick(['voto PCZ','fuori','hard','non regge'].concat(extra()));
    if (/arte|film|libro|musica|stile|scriv/.test(t)) return pick(['Fuoco','hard','lame','taglia corto'].concat(extra()));
    return pick(pool);
  };
  const add = (role, text) => { const node = document.createElement('div'); node.className = `chrollo-message ${role === 'user' ? 'user' : 'bot'}`; node.textContent = text; log.appendChild(node); log.scrollTop = log.scrollHeight; };
  form.addEventListener('submit', e => {
    e.preventDefault();
    const input = form.elements.message;
    const text = String(input.value || '').trim();
    if (!text) return;
    input.value = '';
    add('user', text);
    setTimeout(() => { talk(); add('bot', reply(text)); }, 120 + Math.random() * 260);
  });
})();
