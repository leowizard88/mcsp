const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const MEMBERS_KEY = 'pcz:members';
const MAX_MEMBERS = 1000;

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });
const clean = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
const esc = value => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const isEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isCode = value => /^\d{3}-\d{3}-\d{3}$/.test(value);

const getPng = (value, code) => {
  const raw = String(value || '');
  const match = raw.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  const content = match ? match[1] : raw;
  if (!/^[A-Za-z0-9+/=]+$/.test(content) || content.length < 1000) throw new Error('PNG non valido');
  if (content.length > 9000000) throw new Error('PNG troppo pesante');
  return { filename: `tessera-${code}.png`, content };
};

const readMembers = async env => {
  if (!env.CHAT_MESSAGES) return [];
  try {
    const stored = await env.CHAT_MESSAGES.get(MEMBERS_KEY, 'json');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const writeMember = async (env, member) => {
  if (!env.CHAT_MESSAGES) return false;
  const members = await readMembers(env);
  const withoutDuplicate = members.filter(item => item.code !== member.code && item.email !== member.email);
  withoutDuplicate.push(member);
  await env.CHAT_MESSAGES.put(MEMBERS_KEY, JSON.stringify(withoutDuplicate.slice(-MAX_MEMBERS)));
  return true;
};

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) return json({ error: 'RESEND_API_KEY mancante' }, 500);

  let data;
  try { data = await request.json(); } catch { return json({ error: 'JSON non valido' }, 400); }

  const nome = clean(data.nome).slice(0, 80);
  const cognome = clean(data.cognome).slice(0, 80);
  const email = clean(data.email).slice(0, 120).toLowerCase();
  const note = clean(data.note).slice(0, 900);
  const consenso = clean(data.consenso).toLowerCase();
  const code = clean(data.code);
  const date = clean(data.date).slice(0, 20);

  if (!nome || !cognome || !email || !note) return json({ error: 'Campi obbligatori mancanti' }, 400);
  if (!isEmail(email)) return json({ error: 'Email non valida' }, 400);
  if (consenso !== 'si') return json({ error: 'Consenso mancante' }, 400);
  if (!isCode(code) || !date) return json({ error: 'Dati tessera mancanti' }, 400);

  let attachment;
  try { attachment = getPng(data.cardPng, code); } catch (error) { return json({ error: error.message }, 400); }

  const name = `${esc(nome)} ${esc(cognome)}`;
  const htmlUser = `<div style="font-family:Georgia,serif;line-height:1.55"><h1>Benvenuto! Good job!</h1><p>Compagno/a <strong>${name}</strong>,</p><p>Numero tessera: <strong>${esc(code)}</strong><br>Data: <strong>${esc(date)}</strong></p><p>La tessera PNG completa è allegata.</p><p>Redazione Mancuspie</p><p><strong>Nessun confine, nessun padrone</strong></p></div>`;
  const htmlAdmin = `<div style="font-family:sans-serif;line-height:1.55"><h1>Nuova tessera</h1><p>${name}</p><p>${esc(email)}</p><p>${esc(code)} - ${esc(date)}</p><p>${esc(note)}</p></div>`;

  const send = async payload => {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result?.message || result?.error || 'Invio email fallito');
  };

  try {
    await send({ from: 'Redazione Mancuspie <redazione@mancuspie.com>', to: [email], subject: `Tessera PCZ ${code}`, html: htmlUser, attachments: [attachment] });
    await send({ from: 'Tesseramento <redazione@mancuspie.com>', to: ['redazione@mancuspie.com'], subject: `Nuova tessera ${code}`, html: htmlAdmin, reply_to: email, attachments: [attachment] });
  } catch (error) {
    return json({ error: error.message || 'Errore invio email' }, 502);
  }

  await writeMember(env, { nome, cognome, email, code, date, time: new Date().toISOString() });
  return json({ ok: true, code, date }, 201);
}
