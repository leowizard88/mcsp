const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const REPO = 'leowizard88/mcsp';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });
const clean = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
const repoName = env => env.GITHUB_REPO || REPO;
const githubHeaders = env => ({
  accept: 'application/vnd.github+json',
  'user-agent': 'mancuspie-articles'
});
const authHeaders = env => env.GITHUB_TOKEN ? { ...githubHeaders(env), authorization: `Bearer ${env.GITHUB_TOKEN}` } : githubHeaders(env);
const fromBase64 = value => decodeURIComponent(escape(atob(String(value || '').replace(/\s/g, ''))));
const frontmatterValue = (text, key) => {
  const match = String(text || '').match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?`, 'm'));
  return clean(match?.[1] || '');
};
const slugUrl = path => {
  const file = String(path || '').split('/').pop() || '';
  return `/${file.replace(/\.md$/i, '')}/`;
};
const parseArticle = (text, path) => ({
  title: frontmatterValue(text, 'title'),
  author: frontmatterValue(text, 'author'),
  rubrica: frontmatterValue(text, 'rubrica'),
  tipo: frontmatterValue(text, 'tipo'),
  date: frontmatterValue(text, 'date'),
  url: slugUrl(path),
  sourcePath: path
});

async function getTree(env) {
  const url = `https://api.github.com/repos/${repoName(env)}/git/trees/main?recursive=1`;
  const response = await fetch(url, { headers: authHeaders(env) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, status: response.status, error: data.message || 'Errore GitHub' };
  return { ok: true, files: (data.tree || []).filter(item => item.type === 'blob' && /^src\/content\/testi\/.+\.md$/.test(item.path)) };
}

async function getFile(env, path) {
  const url = `https://api.github.com/repos/${repoName(env)}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
  const response = await fetch(url, { headers: authHeaders(env) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return null;
  return parseArticle(fromBase64(data.content), path);
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const wantedAuthor = clean(url.searchParams.get('author')).toLowerCase();
  const tree = await getTree(env);
  if (!tree.ok) return json({ error: tree.error }, tree.status || 500);
  const articles = [];
  for (const file of tree.files.slice(0, 160)) {
    const article = await getFile(env, file.path);
    if (!article?.title) continue;
    if (wantedAuthor && article.author.toLowerCase() !== wantedAuthor) continue;
    articles.push(article);
  }
  articles.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  return json({ ok: true, articles });
}
