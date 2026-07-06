const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const REPO = 'leowizard88/mcsp';
const TYPES = new Set(['racconto', 'romanzo', 'visivo', 'marginalia', 'impressioni', 'notizie', 'manifesto', 'saggio', 'idee']);
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
const githubHeaders = env => ({ authorization: `Bearer ${env.GITHUB_TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': 'mancuspie-publisher' });
const toBase64 = value => btoa(unescape(encodeURIComponent(value)));
const fromBase64 = value => decodeURIComponent(escape(atob(String(value || '').replace(/\s/g, ''))));
const base64Clean = value => String(value || '').replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
const repoName = env => env.GITHUB_REPO || REPO;
const contentUrl = (env, path) => `https://api.github.com/repos/${repoName(env)}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
const frontmatterValue = (text, key) => {
  const match = String(text || '').match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?`, 'm'));
  return clean(match?.[1] || '');
};
const parseArticle = text => {
  const raw = String(text || '').replace(/\r\n/g, '\n');
  const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
  return {
    title: frontmatterValue(raw, 'title'),
    subtitle: frontmatterValue(raw, 'subtitle'),
    author: frontmatterValue(raw, 'author'),
    rubrica: frontmatterValue(raw, 'rubrica'),
    tipo: frontmatterValue(raw, 'tipo'),
    date: frontmatterValue(raw, 'date'),
    body
  };
};

async function getUser(env, request) {
  const token = bearer(request);
  if (!env.CHAT_MESSAGES || !token) return null;
  const session = await env.CHAT_MESSAGES.get(`auth:session:${token}`, 'json').catch(() => null);
  if (!session?.userId) return null;
  return await env.CHAT_MESSAGES.get(`auth:user:${session.userId}`, 'json').catch(() => null);
}
function requireRedattore(user) { return !!user && user.role === 'redattore'; }
function safeContentPath(path) {
  const p = clean(path).replace(/^\.\//, '');
  if (!/^src\/content\/testi\/[a-zA-Z0-9._-]+\.md$/.test(p)) return '';
  return p;
}
function validatePayload(data) {
  const title = clean(data.title).slice(0, 160);
  const subtitle = clean(data.subtitle).slice(0, 220);
  const rubrica = clean(data.rubrica).slice(0, 80);
  const tipo = clean(data.tipo).toLowerCase();
  const body = String(data.body || '').replace(/\r\n/g, '\n').slice(0, MAX_BODY);
  if (!title) return { error: 'Titolo richiesto' };
  if (!rubrica) return { error: 'Rubrica richiesta' };
  if (!TYPES.has(tipo)) return { error: 'Tipo non valido' };
  if (!body.trim()) return { error: 'Corpo articolo richiesto' };
  return { title, subtitle, rubrica, tipo, body };
}
function articleFile(user, data, date) {
  const frontmatter = ['---', `title: "${yaml(data.title)}"`, data.subtitle ? `subtitle: "${yaml(data.subtitle)}"` : '', `author: "${yaml(user.username)}"`, `rubrica: "${yaml(data.rubrica)}"`, `tipo: "${yaml(data.tipo)}"`, `date: "${date}"`, 'tags: testi', '---'].filter(Boolean).join('\n');
  return `${frontmatter}\n\n${data.body.trim()}\n`;
}

async function githubPut(env, path, content, message, sha = '') {
  if (!env.GITHUB_TOKEN) return { ok: false, status: 500, error: 'GITHUB_TOKEN mancante nei segreti Cloudflare' };
  const payload = { message, content };
  if (sha) payload.sha = sha;
  const response = await fetch(contentUrl(env, path), { method: 'PUT', headers: githubHeaders(env), body: JSON.stringify(payload) });
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
  const response = await fetch(contentUrl(env, path), { method: 'DELETE', headers: githubHeaders(env), body: JSON.stringify({ message, sha }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, status: response.status, error: data.message || 'Errore GitHub' };
  return { ok: true, data };
}
async function loadOwnedArticle(env, user, path) {
  const safe = safeContentPath(path);
  if (!safe) return { error: 'Percorso articolo non valido', status: 400 };
  const got = await githubGet(env, safe);
  if (!got.ok) return { error: got.error, status: got.status || 500 };
  const text = fromBase64(got.data.content);
  const article = parseArticle(text);
  if (article.author.toLowerCase() !== clean(user.username).toLowerCase()) return { error: 'Puoi modificare solo i tuoi articoli', status: 403 };
  return { path: safe, sha: got.data.sha, article };
}

async function publishArticle(env, user, data) {
  const valid = validatePayload(data);
  if (valid.error) return json({ error: valid.error }, 400);
  const now = new Date();
  const date = now.toISOString();
  const day = date.slice(0, 10);
  const slug = `${day}-${slugify(valid.title)}`;
  const path = `src/content/testi/${slug}.md`;
  const result = await githubPut(env, path, toBase64(articleFile(user, valid, date)), `publish article ${slug}`);
  if (!result.ok) return json({ error: result.error }, result.status || 500);
  return json({ ok: true, path, url: `/${slug}/` }, 201);
}
async function editArticle(env, user, data) {
  const loaded = await loadOwnedArticle(env, user, data.path);
  if (loaded.error) return json({ error: loaded.error }, loaded.status);
  const valid = validatePayload(data);
  if (valid.error) return json({ error: valid.error }, 400);
  const date = loaded.article.date || new Date().toISOString();
  const result = await githubPut(env, loaded.path, toBase64(articleFile(user, valid, date)), `edit article ${loaded.path.split('/').pop()}`, loaded.sha);
  if (!result.ok) return json({ error: result.error }, result.status || 500);
  return json({ ok: true, path: loaded.path });
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
  const loaded = await loadOwnedArticle(env, user, data.path);
  if (loaded.error) return json({ error: loaded.error }, loaded.status);
  const result = await githubDelete(env, loaded.path, loaded.sha, `delete article ${loaded.path.split('/').pop()}`);
  if (!result.ok) return json({ error: result.error }, result.status || 500);
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const user = await getUser(env, request);
  if (!requireRedattore(user)) return json({ error: 'Permesso redattore richiesto' }, 403);
  const url = new URL(request.url);
  const loaded = await loadOwnedArticle(env, user, url.searchParams.get('path'));
  if (loaded.error) return json({ error: loaded.error }, loaded.status);
  return json({ ok: true, path: loaded.path, article: loaded.article });
}

export async function onRequestPost({ request, env }) {
  const user = await getUser(env, request);
  if (!requireRedattore(user)) return json({ error: 'Permesso redattore richiesto' }, 403);
  let data;
  try { data = await request.json(); } catch { return json({ error: 'JSON non valido' }, 400); }
  const action = clean(data.action).toLowerCase();
  if (action === 'publish') return publishArticle(env, user, data);
  if (action === 'edit') return editArticle(env, user, data);
  if (action === 'upload') return uploadAsset(env, user, data);
  if (action === 'delete') return deleteArticle(env, user, data);
  return json({ error: 'Azione non valida' }, 400);
}
