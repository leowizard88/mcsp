(() => {
  const tokenKey = 'mancuspieAuthToken';
  const nameKey = 'mancuspiePublicName';
  const state = { user: null };
  window.MancuspieAuth = state;

  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const token = () => localStorage.getItem(tokenKey) || '';
  const headers = () => token() ? { authorization: `Bearer ${token()}` } : {};
  const setCommentNames = () => {
    const name = state.user?.username || 'Anonimo';
    localStorage.setItem(nameKey, name);
    document.querySelectorAll('input[name="name"], [data-chat-name], [data-chat-reply-name]').forEach(input => {
      input.value = name;
      input.readOnly = true;
      input.classList.add('is-locked');
      input.style.display = 'none';
    });
  };

  const api = async body => {
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
    .mc-auth-button{position:fixed;right:18px;top:16px;z-index:9999;border:1px solid rgba(255,255,255,.32);background:rgba(0,0,0,.86);color:#fbfaf5;padding:9px 11px;font:300 11px/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.14em;text-transform:uppercase;cursor:pointer;max-width:190px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mc-auth-modal{position:fixed;inset:0;z-index:10000;display:none;background:rgba(0,0,0,.64);align-items:center;justify-content:center;padding:20px}
    .mc-auth-modal.is-open{display:flex}
    .mc-auth-card{width:min(420px,94vw);background:#fbfaf5;color:#050505;border:1px solid #050505;padding:22px;font-family:var(--font-sans,system-ui,sans-serif)}
    .mc-auth-card h2{margin:0 0 18px;font-family:var(--font-serif,Georgia,serif);font-size:42px;line-height:.9;font-weight:300;text-transform:uppercase}
    .mc-auth-tabs{display:flex;gap:8px;margin-bottom:14px}.mc-auth-tabs button,.mc-auth-card button{border:1px solid #050505;background:#050505;color:#fbfaf5;padding:10px 12px;font:700 11px/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.12em;text-transform:uppercase;cursor:pointer}.mc-auth-tabs button.is-active{background:#fbfaf5;color:#050505}
    .mc-auth-card input{width:100%;box-sizing:border-box;border:1px solid rgba(5,5,5,.34);background:#fff;color:#050505;padding:12px;margin:0 0 10px;font:15px/1.2 var(--font-sans,system-ui,sans-serif)}
    .mc-auth-error{min-height:18px;margin:10px 0 0;color:#7a0000;font-size:13px}.mc-auth-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:13px}.mc-auth-links a,.mc-auth-links button{font-size:10px;padding:8px 10px;text-decoration:none}.mc-auth-close{float:right;background:transparent!important;color:#050505!important;border:0!important;padding:0!important;font-size:18px!important;letter-spacing:0!important}
    @media(max-width:760px){.mc-auth-button{right:10px;top:10px;max-width:128px}}
  `;
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.className = 'mc-auth-button';
  button.type = 'button';
  document.body.appendChild(button);

  const modal = document.createElement('div');
  modal.className = 'mc-auth-modal';
  modal.innerHTML = `
    <div class="mc-auth-card">
      <button class="mc-auth-close" type="button" data-auth-close>×</button>
      <h2>Account</h2>
      <div class="mc-auth-tabs"><button type="button" class="is-active" data-auth-mode="signup">Sign up</button><button type="button" data-auth-mode="login">Sign in</button></div>
      <form data-auth-form>
        <input name="username" autocomplete="username" maxlength="24" placeholder="username" required>
        <input name="password" autocomplete="current-password" type="password" minlength="6" placeholder="password" required>
        <button type="submit">Entra</button>
      </form>
      <p class="mc-auth-error" data-auth-error></p>
    </div>`;
  document.body.appendChild(modal);

  let mode = 'signup';
  const renderButton = () => { button.textContent = state.user?.username || 'Anonimo'; };
  const open = () => {
    if (state.user) location.href = '/profilo/';
    else modal.classList.add('is-open');
  };
  button.addEventListener('click', open);
  modal.addEventListener('click', event => { if (event.target === modal || event.target.closest('[data-auth-close]')) modal.classList.remove('is-open'); });
  modal.querySelectorAll('[data-auth-mode]').forEach(tab => tab.addEventListener('click', () => {
    mode = tab.dataset.authMode;
    modal.querySelectorAll('[data-auth-mode]').forEach(t => t.classList.toggle('is-active', t === tab));
  }));
  modal.querySelector('[data-auth-form]').addEventListener('submit', async event => {
    event.preventDefault();
    const error = modal.querySelector('[data-auth-error]');
    error.textContent = '';
    const data = new FormData(event.currentTarget);
    try {
      const result = await api({ action: mode, username: data.get('username'), password: data.get('password') });
      localStorage.setItem(tokenKey, result.token);
      state.user = result.user;
      setCommentNames();
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
    renderButton();
    setCommentNames();
    new MutationObserver(setCommentNames).observe(document.body, { childList: true, subtree: true });
  };
  init();
})();
