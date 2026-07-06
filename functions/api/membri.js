const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const MEMBERS_KEY = 'pcz:members';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });

const publicMember = member => ({
  nome: String(member?.nome || '').trim(),
  cognome: String(member?.cognome || '').trim(),
  date: String(member?.date || '').trim(),
  code: String(member?.code || '').trim()
});

export async function onRequestGet({ env }) {
  if (!env.CHAT_MESSAGES) return json({ error: 'CHAT_MESSAGES KV binding mancante' }, 500);

  let members = [];
  try {
    const stored = await env.CHAT_MESSAGES.get(MEMBERS_KEY, 'json');
    members = Array.isArray(stored) ? stored : [];
  } catch {
    members = [];
  }

  const visible = members
    .map(publicMember)
    .filter(member => member.nome && member.cognome && member.date)
    .reverse();

  return json({ members: visible });
}
