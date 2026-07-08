(() => {
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const nextXpFor = level => { let n = 10; for (let i = 1; i < Math.max(1, Math.floor(Number(level) || 1)); i++) n += Math.ceil(n / 2); return n; };
  const normalize = c => {
    if (!c) return c;
    let level = Math.max(1, Math.floor(Number(c.level) || 1));
    let xp = Math.max(0, Math.floor(Number(c.xp) || 0));
    let paramPoints = Math.max(0, Math.floor(Number(c.paramPoints) || 0));
    let changed = false;
    while (xp >= nextXpFor(level)) {
      xp -= nextXpFor(level);
      level += 1;
      paramPoints += 3;
      changed = true;
    }
    if (!changed && c.nextXp === nextXpFor(level)) return c;
    const out = { ...c, level, xp, nextXp:nextXpFor(level), paramPoints };
    if (out.stats?.generali) {
      out.stats = { ...out.stats, generali:{ ...out.stats.generali, livello:level, esperienza:xp, prossimoLivello:nextXpFor(level), puntiParametro:paramPoints } };
    }
    return out;
  };
  const originalFetch = window.fetch.bind(window);
  let posted = false;
  window.fetch = async (input, init) => {
    const res = await originalFetch(input, init);
    const url = typeof input === 'string' ? input : input?.url || '';
    if (!url.includes('/api/hxh-character')) return res;
    try {
      const clone = res.clone();
      const data = await clone.json();
      if (data?.character) {
        data.character = normalize(data.character);
        if (!posted) {
          posted = true;
          originalFetch('/api/hxh-xp-normalize', { method:'POST', headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' }).catch(() => {});
        }
        return new Response(JSON.stringify(data), { status:res.status, statusText:res.statusText, headers:{ 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' } });
      }
    } catch {}
    return res;
  };
  setTimeout(() => originalFetch('/api/hxh-xp-normalize', { method:'POST', headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' }).catch(() => {}), 800);
})();
