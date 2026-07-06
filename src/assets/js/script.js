document.documentElement.classList.add('js');
const links = document.querySelectorAll('.vertical-nav a');
const sectionPairs = [...links]
  .map(a => {
    const hash = new URL(a.getAttribute('href'), location.origin).hash;
    return hash ? [a, document.querySelector(hash)] : [a, null];
  })
  .filter(([, section]) => section);
const sections = sectionPairs.map(([, section]) => section);
const mark = () => {
  if (!sections.length) return;
  let current = sections[0];
  for (const s of sections) if (s.getBoundingClientRect().top < innerHeight * .45) current = s;
  links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href').endsWith('#' + current.id)));
};
addEventListener('scroll', mark, {passive:true}); mark();

const homeFix = document.createElement('style');
homeFix.textContent = `
body:has(#home),body:has(#home) .site-main{background:#ead7b3!important}
body .site-main #home.hero-panel,body .site-main #home.hero-panel::before{background:linear-gradient(115deg,#efdfc1 0%,#ddc595 100%)!important}
body .site-main #home.hero-panel .bg-daisies{display:none!important;opacity:0!important}
body .site-main #home.hero-panel .bg-score{left:-8%!important;top:-10%!important;width:83%!important;height:118%!important;background-size:cover!important;background-position:left center!important;opacity:.24!important;transform:rotate(0deg)!important;-webkit-mask-image:linear-gradient(90deg,rgba(0,0,0,.92) 0%,rgba(0,0,0,.76) 56%,transparent 100%)!important;mask-image:linear-gradient(90deg,rgba(0,0,0,.92) 0%,rgba(0,0,0,.76) 56%,transparent 100%)!important}
body .site-main #home.hero-panel .hero-copy h2{margin-left:0!important;max-width:min(640px,58vw)!important;text-align:justify!important;text-align-last:left!important}
body .site-main #home.hero-panel .ultimi-movimenti-button:hover{animation:movimentiVibra .24s steps(2,end) infinite!important}
@keyframes movimentiVibra{0%{transform:translate(0,0) rotate(-.32deg)}25%{transform:translate(.5px,-.35px) rotate(.36deg)}50%{transform:translate(-.55px,.35px) rotate(-.28deg)}75%{transform:translate(.35px,.45px) rotate(.22deg)}100%{transform:translate(-.3px,0) rotate(-.30deg)}}
body .movimento-card:hover{animation:cardVibra .24s steps(2,end) infinite!important}
@keyframes cardVibra{0%{transform:rotate(var(--tilt)) translate(0,0)}25%{transform:rotate(calc(var(--tilt) * -.35)) translate(.28px,-.28px)}50%{transform:rotate(var(--tilt)) translate(-.28px,.28px)}75%{transform:rotate(calc(var(--tilt) * -.35)) translate(.22px,.22px)}100%{transform:rotate(var(--tilt)) translate(-.22px,0)}}
body .item-list{background:linear-gradient(90deg,rgba(234,215,179,.13),rgba(234,215,179,.035))!important}
body .movimento-card time{background:rgba(234,215,179,.42)!important}
body .movimento-card strong{background:rgba(234,215,179,.46)!important}
body .movimento-card span{background:rgba(234,215,179,.36)!important}
.zingaristan-link{display:inline-block;margin-top:16px;color:#061a46!important;text-decoration:underline!important;text-decoration-thickness:1px;text-underline-offset:3px;font:300 14px/1 var(--font-sans);letter-spacing:.09em}.chat-panel{display:grid!important;align-items:center!important;background:#ead7b3!important}.chat-panel::before{background:linear-gradient(115deg,#efdfc1 0%,#ddc595 100%)!important}.chat-board{position:relative;z-index:5;width:min(900px,88vw);margin:0 auto;border-top:1px solid rgba(31,28,24,.28);padding-top:clamp(26px,4vw,52px)}.chat-board h2{margin:0 0 22px;font-family:var(--font-serif);font-size:clamp(56px,9vw,132px);line-height:.86;font-weight:300}.chat-board p{max-width:620px;margin:0 0 24px;font-size:clamp(19px,2vw,30px);line-height:1.18}.chat-form{display:grid;grid-template-columns:minmax(120px,210px) 1fr auto;gap:10px;align-items:end}.chat-form input,.chat-form textarea{width:100%;border:1px solid rgba(31,28,24,.30);background:rgba(234,215,179,.18);color:#120d08;font:300 14px/1.2 var(--font-sans);letter-spacing:.04em;padding:13px 12px;border-radius:0;outline:none}.chat-form textarea{min-height:44px;resize:vertical}.chat-form input:focus,.chat-form textarea:focus{border-color:rgba(31,28,24,.62);background:rgba(234,215,179,.28)}.chat-form button{border:1px solid rgba(31,28,24,.42);background:rgba(31,28,24,.84);color:#ead7b3;font:300 11px/1 var(--font-sans);letter-spacing:.16em;text-transform:uppercase;padding:15px 16px;cursor:pointer}.chat-form input.is-locked{opacity:.62;cursor:not-allowed}.chat-messages{margin-top:26px;display:grid;gap:12px}.chat-message{border-top:1px solid rgba(31,28,24,.20);padding-top:12px}.chat-message strong{display:inline-block;margin-right:10px;font:300 12px/1 var(--font-sans);letter-spacing:.14em;text-transform:uppercase}.chat-message time{font:300 10px/1 var(--font-sans);letter-spacing:.10em;opacity:.55}.chat-message p{margin:8px 0 0;font-size:clamp(19px,2vw,28px);line-height:1.18;max-width:none}.chat-error{color:#5a0000!important}
@media(max-width:760px){body .site-main #home.hero-panel .bg-score{left:-28%!important;top:-8%!important;width:150%!important;height:112%!important;background-size:cover!important;background-position:left center!important;opacity:.18!important}body .site-main #home.hero-panel .hero-copy h2{margin-left:0!important;max-width:calc(100vw - 82px)!important;text-align:justify!important;text-align-last:left!important}body .site-main #home.hero-panel .ultimi-movimenti-button{margin-right:25px!important}body .site-main #home.hero-panel .drama-mobile{transform:translateX(21px)!important;transform-origin:center!important}body .noi-panel .bg-archive{inset:-8% -20% -8% -18%!important;width:auto!important;height:auto!important;background-size:cover!important;background-position:center center!important;opacity:.30!important;-webkit-mask-image:radial-gradient(ellipse at 50% 50%,#000 0 56%,rgba(0,0,0,.58) 72%,transparent 92%)!important;mask-image:radial-gradient(ellipse at 50% 50%,#000 0 56%,rgba(0,0,0,.58) 72%,transparent 92%)!important}.chat-board{width:100%}.chat-form{grid-template-columns:1fr}}
`;
document.head.appendChild(homeFix);

const addZingaristanLink = () => {
  const block = document.querySelector('#progetti .section-block');
  if (!block || block.querySelector('.zingaristan-link')) return;
  const link = document.createElement('a');
  link.className = 'zingaristan-link';
  link.href = '/zingaristan/';
  link.textContent = 'Zingaristan';
  block.appendChild(link);
};
addZingaristanLink();

const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const nameKey = 'mancuspiePublicName';
const apiUrl = '/api/chat';

const formatTime = iso => {
  try {
    return new Date(iso).toLocaleString('it-IT', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
  } catch {
    return '';
  }
};

const installPublicChat = () => {
  const main = document.querySelector('.site-main');
  const projects = document.querySelector('#progetti');
  if (!main || !projects || document.querySelector('#chat')) return;
  const panel = document.createElement('section');
  panel.id = 'chat';
  panel.className = 'panel content-panel chat-panel';
  panel.innerHTML = `
    <div class="chat-board" data-chat-board>
      <p class="section-kicker">06</p>
      <h2>Bacheca</h2>
      <p>Prima scegli un nickname, poi lascia un messaggio pubblico.</p>
      <form class="chat-form" data-chat-form>
        <input data-chat-name type="text" maxlength="24" placeholder="nickname" autocomplete="nickname" required>
        <textarea data-chat-text maxlength="260" placeholder="scrivi qui" required></textarea>
        <button type="submit">Invia</button>
      </form>
      <div class="chat-messages" data-chat-messages aria-live="polite"></div>
    </div>
    <footer class="footer"><span>© MANCUSPIE</span><span></span><span></span></footer>`;
  main.appendChild(panel);

  const form = panel.querySelector('[data-chat-form]');
  const nameInput = panel.querySelector('[data-chat-name]');
  const textInput = panel.querySelector('[data-chat-text]');
  const list = panel.querySelector('[data-chat-messages]');
  const savedName = localStorage.getItem(nameKey) || '';
  if (savedName) {
    nameInput.value = savedName;
    nameInput.readOnly = true;
    nameInput.classList.add('is-locked');
    nameInput.title = 'Nickname già scelto';
  }

  const render = messages => {
    if (!messages.length) {
      list.innerHTML = '<div class="chat-message"><p>Nessun messaggio ancora.</p></div>';
      return;
    }
    list.innerHTML = messages.slice().reverse().map(item => `
      <article class="chat-message">
        <strong>${escapeHtml(item.name)}</strong><time>${escapeHtml(formatTime(item.time))}</time>
        <p>${escapeHtml(item.text)}</p>
      </article>`).join('');
  };

  const load = async () => {
    try {
      const response = await fetch(apiUrl, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'errore chat');
      render(Array.isArray(data.messages) ? data.messages : []);
    } catch (error) {
      list.innerHTML = `<div class="chat-message"><p class="chat-error">Chat non disponibile: ${escapeHtml(error.message)}</p></div>`;
    }
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const lockedName = localStorage.getItem(nameKey);
    const chosenName = nameInput.value.trim().slice(0, 24);
    const name = lockedName || chosenName;
    const text = textInput.value.trim().slice(0, 260);
    if (!name || !text) return;
    if (!lockedName) {
      localStorage.setItem(nameKey, name);
      nameInput.value = name;
      nameInput.readOnly = true;
      nameInput.classList.add('is-locked');
      nameInput.title = 'Nickname già scelto';
    }
    form.querySelector('button').disabled = true;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, text })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'errore invio');
      textInput.value = '';
      render(Array.isArray(data.messages) ? data.messages : []);
    } catch (error) {
      list.innerHTML = `<div class="chat-message"><p class="chat-error">Invio fallito: ${escapeHtml(error.message)}</p></div>`;
    } finally {
      form.querySelector('button').disabled = false;
    }
  });

  load();
  setInterval(load, 5000);
};
installPublicChat();
