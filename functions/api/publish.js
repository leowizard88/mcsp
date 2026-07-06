const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const REPO = 'leowizard88/mcsp';
const TYPES = new Set(['racconto', 'romanzo', 'visivo', 'marginalia', 'impressioni', 'notizie', 'manifesto', 'saggio']);
const MAX_BODY = 120000;
const MAX_FILE = 2800000;

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });
const clean = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
const bearer = request => {
  const auth = request.headers.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return request.headers.get('x-mancuspie-token') || '';
};
const slugify = value => clean(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'articolo';
const yaml = value => String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ');
const githubHeaders = env => ({
  'authorization': `Bearer ${env.GITHUB_TOKEN}`,
  'accept': 'application/vnd.github+json',
  'user-agent': 'mancuspie-publisher'
});
const toBase64 = value => btoa(unescape(encodeURIComponent(value)));
const fromBase64 = value => decodeURIComponent(escape(atob(String(value || '').replace(/\s/g, ''))));
const base64Clean = value => String(value || '').replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
const repoName = env => env.GITHUB_REPO || REPO;
const contentUrl = (env, path) => `https://api.github.com/repos/${repoName(env)}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
const frontmatterValue = (text, key) => {
  const match = String(text || '').match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?`, 'm'));
  return clean(match?.[1] || '');
};

async function getUser(env, request) {
  const token = bearer(request);
  if (!env.CHAT_MESSAGES || !token) return null;
  const session = await env.CHAT_MESSAGES.get(`auth:session:${token}`, 'json').catch(() => null);
  if (!session?.userId) return null;
  return await env.CHAT_MESSAGES.get(`auth:user:${session.userId}`, 'json').catch(() => null);
}

function requireRedattore(user) {
  return !!user && user.role === 'redattore';
}

function safeContentPath(path) {
  const p = clean(path);
  if (!/^src\/content\/testi\/[a-zA-Z0-9._-]+\.md$/.test(p)) return '';
  return p;
}

async function githubPut(env, path, content, message) {
  if (!env.GITHUB_TOKEN) return { ok: false, status: 500, error: 'GITHUB_TOKEN mancante nei segreti Cloudflare' };
  const response = await fetch(contentUrl(env, path), {
    method: 'PUT',
    headers: githubHeaders(env),
    body: JSON.stringify({ message, content })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, status: response.status, error: data.message || 'Errore GitHub' };
  return { ok: true, data };
}

async function githubGet(env, path) {
  if (!env.GITHUB_TOKEN) return { ok: false, status: 500, error: 'GITHUB_TOKEN mancante nei segreti Cloudflare' };
  const response = await fetch(contentUrl(env, path), { headers: githubHeaders(env) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, status: response.status, error: data.message || 'Errore GitHub' };
  return { ok: true, data };
}

async function githubDelete(env, path, sha, message) {
  if (!env.GITHUB_TOKEN) return { ok: false, status: 500, error: 'GITHUB_TOKEN mancante nei segreti Cloudflare' };
  const response = await fetch(contentUrl(env, path), {
    method: 'DELETE',
    headers: githubHeaders(env),
    body: JSON.stringify({ message, sha })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, status: response.status, error: data.message || 'Errore GitHub' };
  return { ok: true, data };
}

async function publishArticle(env, user, data) {
  const title = clean(data.title).slice(0, 160);
  const subtitle = clean(data.subtitle).slice(0, 220);
  const rubrica = clean(data.rubrica).slice(0, 80);
  const tipo = clean(data.tipo).toLowerCase();
  const body = String(data.body || '').replace(/\r\n/g, '\n').slice(0, MAX_BODY);
  if (!title) return json({ error: 'Titolo richiesto' }, 400);
  if (!rubrica) return json({ error: 'Rubrica richiesta' }, 400);
  if (!TYPES.has(tipo)) return json({ error: 'Tipo non valido' }, 400);
  if (!body.trim()) return json({ error: 'Corpo articolo richiesto' }, 400);
  const now = new Date();
  const date = now.toISOString();
  const day = date.slice(0, 10);
  const slug = `${day}-${slugify(title)}`;
  const path = `src/content/testi/${slug}.md`;
  const frontmatter = [
    '---',
    `title: "${yaml(title)}"`,
    subtitle ? `subtitle: "${yaml(subtitle)}"` : '',
    `author: "${yaml(user.username)}"`,
    `rubrica: "${yaml(rubrica)}"`,
    `tipo: "${yaml(tipo)}"`,
    `date: "${date}"`,
    'tags: testi',
    '---'
  ].filter(Boolean).join('\n');
  const file = `${frontmatter}\n\n${body.trim()}\n`;
  const result = await githubPut(env, path, toBase64(file), `publish article ${slug}`);
  if (!result.ok) return json({ error: result.error }, result.status || 500);
  return json({ ok: true, path, url: `/${slug}/` }, 201);
}

async function uploadAsset(env, user, data) {
  const filename = clean(data.filename).replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 90);
  const mime = clean(data.mime).toLowerCase();
  const raw = base64Clean(data.content);
  if (!filename || !raw) return json({ error: 'File mancante' }, 400);
  if (raw.length > MAX_FILE) return json({ error: 'File troppo pesante' }, 413);
  const okMime = /^(image\/(png|jpeg|jpg|gif|webp)|application\/pdf|text\/plain)$/.test(mime);
  if (!okMime) return json({ error: 'Tipo file non supportato' }, 400);
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const path = `src/assets/uploads/${stamp}-${slugify(user.username)}-${filename}`;
  const result = await githubPut(env, path, raw, `upload editor asset ${filename}`);
  if (!result.ok) return json({ error: result.error }, result.status || 500);
  const publicUrl = `/assets/uploads/${path.split('/').pop()}`;
  return json({ ok: true, url: publicUrl, markdown: mime.startsWith('image/') ? `![${filename}](${publicUrl})` : `[${filename}](${publicUrl})` }, 201);
}

async function deleteArticle(env, user, data) {
  const path = safeContentPath(data.path);
  if (!path) return json({ error: 'Percorso articolo non valido' }, 400);
  const got = await githubGet(env, path);
  if (!got.ok) return json({ error: got.error }, got.status || 500);
  const text = fromBase64(got.data.content);
  const author = frontmatterValue(text, 'author');
  if (author.toLowerCase() !== clean(user.username).toLowerCase()) return json({ error: 'Puoi eliminare solo i tuoi articoli' }, 403);
  const result = await githubDelete(env, path, got.data.sha, `delete article ${path.split('/').pop()}`);
  if (!result.ok) return json({ error: result.error }, result.status || 500);
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const user = await getUser(env, request);
  if (!requireRedattore(user)) return json({ error: 'Permesso redattore richiesto' }, 403);
  let data;
  try { data = await request.json(); } catch { return json({ error: 'JSON non valido' }, 400); }
  const action = clean(data.action).toLowerCase();
  if (action === 'publish') return publishArticle(env, user, data);
  if (action === 'upload') return uploadAsset(env, user, data);
  if (action === 'delete') return deleteArticle(env, user, data);
  return json({ error: 'Azione non valida' }, 400);
}
