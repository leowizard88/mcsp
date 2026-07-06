(() => {
  const tokenKey = 'mancuspieAuthToken';
  const nameKey = 'mancuspiePublicName';
  const state = { user: null };
  window.MancuspieAuth = state;
  const token = () => localStorage.getItem(tokenKey) || '';
  const headers = () => token() ? { authorization: `Bearer ${token()}` } : {};

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const method = String(init?.method || 'GET').toUpperCase();
    const shouldAttach = token() && method === 'POST' && (url.includes('/api/chat') || url.includes('/api/comments'));
    if (!shouldAttach) return nativeFetch(input, init);
    return nativeFetch(input, {
      ...init,
      headers: { ...(init.headers || {}), authorization: `Bearer ${token()}` }
    });
  };

  const setNames = () => {
    const name = state.user?.username || 'Anonimo';
    localStorage.setItem(nameKey, name);
    document.querySelectorAll('input[name="name"], [data-chat-name], [data-chat-reply-name]').forEach(input => {
      input.value = name;
      input.readOnly = true;
      input.classList.add('is-locked');
      input.style.display = 'none';
    });
  };
  const call = async body => {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers() },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Errore account');
    return data;
  };
  const style = document.createElement('style');
  style.textContent = `
    .mc-account-wrap{position:fixed;right:24px;top:16px;z-index:9999;display:grid;justify-items:end;gap:7px}
    .mc-account-button{border:0;background:transparent;color:#050505;padding:0;cursor:pointer;filter:drop-shadow(0 4px 0 rgba(0,0,0,.20)) drop-shadow(0 0 18px rgba(255,248,214,.78)) drop-shadow(0 0 34px rgba(234,215,179,.52))}
    .mc-account-button img{display:block;width:128px;height:128px;object-fit:contain;mix-blend-mode:screen;filter:brightness(1.22) contrast(1.08) saturate(1.05)}
    .mc-account-name{display:block;max-width:190px;border:1px solid rgba(5,5,5,.42);background:rgba(234,215,179,.74);padding:10px 12px;font:300 13px/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.13em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#050505}
    .mc-logout-button{display:none;border:1px solid rgba(255,210,190,.48);background:#9b0000;color:#fbfaf5;padding:8px 10px;font:700 10px/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.16em;text-transform:uppercase;cursor:pointer;box-shadow:3px 3px 0 rgba(5,5,5,.80)}
    .mc-logout-button.is-visible{display:block}
    .mc-logout-button:hover{background:#c00000;transform:translateY(-1px)}
    .mc-account-modal{position:fixed;inset:0;z-index:10000;display:none;background:rgba(5,0,0,.72);align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(2px)}
    .mc-account-modal.is-open{display:flex}
    .mc-account-card{position:relative;width:min(520px,94vw);background:#ead7b3;color:#050505;border:1px solid rgba(5,5,5,.62);padding:clamp(22px,4vw,38px);font-family:var(--font-sans,system-ui,sans-serif);box-shadow:14px 14px 0 rgba(5,5,5,.82);overflow:hidden}
    .mc-account-card::before{content:"";position:absolute;inset:-20% -16% auto auto;width:250px;height:250px;background:url('/assets/img/ICON.png') center/contain no-repeat;opacity:.11;mix-blend-mode:multiply;transform:rotate(13deg);pointer-events:none}
    .mc-account-card h2{position:relative;margin:0 0 18px;font-family:var(--font-serif,Georgia,serif);font-size:clamp(54px,9vw,92px);line-height:.78;font-weight:300;letter-spacing:-.035em;text-transform:uppercase;border-bottom:2px solid #050505;padding-bottom:12px}
    .mc-account-card p.mc-account-note{position:relative;margin:0 0 18px;max-width:360px;font-family:var(--font-serif,Georgia,serif);font-size:21px;line-height:1.08;color:rgba(5,5,5,.76)}
    .mc-account-tabs{position:relative;display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}.mc-account-tabs button{border:1px solid rgba(5,5,5,.52);background:rgba(5,5,5,.08);color:#050505;padding:10px 13px;font:300 11px/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.16em;text-transform:uppercase;cursor:pointer}.mc-account-tabs button.is-active{background:#050505;color:#ead7b3}
    .mc-account-card form{position:relative;display:grid;gap:10px}.mc-account-card input{width:100%;box-sizing:border-box;border:0;border-bottom:1px solid rgba(5,5,5,.58);background:rgba(255,255,255,.18);color:#050505;padding:14px 12px;font:300 18px/1.15 var(--font-serif,Georgia,serif);outline:none}.mc-account-card input:focus{background:rgba(255,255,255,.32);border-bottom-color:#050505}
    .mc-account-card form button{justify-self:start;margin-top:6px;border:1px solid #050505;background:#050505;color:#ead7b3;padding:13px 16px;font:300 11px/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.18em;text-transform:uppercase;cursor:pointer}.mc-account-card form button:hover,.mc-account-close:hover{transform:translateY(-1px)}
    .mc-account-error{position:relative;min-height:18px;margin:12px 0 0;color:#6c0000;font-size:13px;letter-spacing:.04em}.mc-account-close{position:absolute;right:14px;top:12px;z-index:3;background:transparent;color:#050505;border:0;padding:0;font:300 34px/.8 var(--font-serif,Georgia,serif);cursor:pointer}
    @media(max-width:760px){.mc-account-wrap{right:8px;top:8px;gap:5px}.mc-account-button img{width:86px;height:86px}.mc-account-name{max-width:126px;padding:8px 9px;font-size:10px}.mc-logout-button{padding:7px 8px;font-size:9px}.mc-account-card{box-shadow:8px 8px 0 rgba(5,5,5,.82)}}
  `;
  document.head.appendChild(style);
  const wrap = document.createElement('div');
  wrap.className = 'mc-account-wrap';
  const button = document.createElement('button');
  button.className = 'mc-account-button';
  button.type = 'button';
  const logoutButton = document.createElement('button');
  logoutButton.className = 'mc-logout-button';
  logoutButton.type = 'button';
  logoutButton.textContent = 'Log out';
  wrap.appendChild(button);
  wrap.appendChild(logoutButton);
  document.body.appendChild(wrap);
  const modal = document.createElement('div');
  modal.className = 'mc-account-modal';
  modal.innerHTML = `<div class="mc-account-card"><button class="mc-account-close" type="button" data-close>×</button><h2>Account</h2><p class="mc-account-note">Entra con un nome tuo oppure resta nella nebbia anonima.</p><div class="mc-account-tabs"><button type="button" class="is-active" data-mode="signup">Sign up</button><button type="button" data-mode="login">Sign in</button></div><form data-form><input name="username" autocomplete="username" maxlength="24" placeholder="username" required><input name="password" autocomplete="current-password" type="password" minlength="4" placeholder="password" required><button type="submit">Entra</button></form><p class="mc-account-error" data-error></p></div>`;
  document.body.appendChild(modal);
  let mode = 'signup';
  const render = () => {
    button.innerHTML = state.user?.username ? `<span class="mc-account-name">${state.user.username.replace(/[&<>"']/g, '')}</span>` : `<img src="/assets/img/ICON.png" alt="Account">`;
    logoutButton.classList.toggle('is-visible', !!state.user);
  };
  const logout = async () => {
    try { await call({ action: 'logout' }); } catch {}
    localStorage.removeItem(tokenKey);
    localStorage.setItem(nameKey, 'Anonimo');
    state.user = null;
    location.reload();
  };
  button.addEventListener('click', () => { if (state.user) location.href = '/profilo/'; else modal.classList.add('is-open'); });
  logoutButton.addEventListener('click', event => { event.stopPropagation(); logout(); });
  modal.addEventListener('click', event => { if (event.target === modal || event.target.closest('[data-close]')) modal.classList.remove('is-open'); });
  modal.querySelectorAll('[data-mode]').forEach(tab => tab.addEventListener('click', () => { mode = tab.dataset.mode; modal.querySelectorAll('[data-mode]').forEach(t => t.classList.toggle('is-active', t === tab)); }));
  modal.querySelector('[data-form]').addEventListener('submit', async event => {
    event.preventDefault();
    const error = modal.querySelector('[data-error]');
    error.textContent = '';
    const data = new FormData(event.currentTarget);
    try {
      const result = await call({ action: mode, username: data.get('username'), password: data.get('password') });
      localStorage.setItem(tokenKey, result.token);
      state.user = result.user;
      setNames();
      location.reload();
    } catch (err) { error.textContent = err.message; }
  });
  const init = async () => {
    try {
      if (token()) {
        const response = await fetch('/api/auth', { headers: headers(), cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        state.user = data.user || null;
      }
    } catch { state.user = null; }
    render();
    setNames();
    new MutationObserver(setNames).observe(document.body, { childList: true, subtree: true });
  };
  init();
})();
