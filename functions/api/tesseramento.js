const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

const clean = value => String(value || '')
  .replace(/[\u0000-\u001f\u007f]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });
const validEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const escapeHtml = value => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const escapeXml = escapeHtml;

const base64FromBytes = bytes => {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

const base64FromText = text => base64FromBytes(new TextEncoder().encode(text));

const makeCode = () => Array.from({ length: 3 }, () => String(Math.floor(Math.random() * 1000)).padStart(3, '0')).join('-');

const todayItalian = () => new Intl.DateTimeFormat('it-IT', {
  timeZone: 'Europe/Rome',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
}).format(new Date());

const wrap = (text, maxChars, maxLines) => {
  const words = clean(text).split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
};

async function makeCardAttachment({ request, nome, cognome, note, code, date }) {
  const templateUrl = new URL('/assets/img/tessera.png', request.url);
  const templateResponse = await fetch(templateUrl.toString());
  if (!templateResponse.ok) throw new Error('Template tessera non trovato');

  const templateBase64 = base64FromBytes(new Uint8Array(await templateResponse.arrayBuffer()));
  const fullName = `${nome} ${cognome}`.slice(0, 34);
  const noteLines = wrap(note, 39, 8);

  const noteSvg = noteLines.map((line, index) => (
    `<tspan x="26" dy="${index === 0 ? 0 : 43}">${escapeXml(line)}</tspan>`
  )).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1597" height="1875" viewBox="0 0 1597 1875">
  <image href="data:image/png;base64,${templateBase64}" x="0" y="0" width="1597" height="1875"/>

  <rect x="418" y="82" width="510" height="82" fill="#fff"/>
  <rect x="244" y="180" width="354" height="72" fill="#fff"/>
  <rect x="650" y="572" width="444" height="66" rx="28" fill="#fff"/>
  <rect x="24" y="1260" width="900" height="430" fill="#fff"/>

  <text x="424" y="143" font-family="Arial, Helvetica, sans-serif" font-size="60" fill="#000">${escapeXml(fullName)}</text>
  <text x="250" y="240" font-family="Arial, Helvetica, sans-serif" font-size="57" fill="#000">${escapeXml(date)}</text>
  <text x="668" y="626" font-family="Arial, Helvetica, sans-serif" font-size="53" fill="#000">${escapeXml(code)}</text>

  <text x="26" y="1308" font-family="Georgia, 'Times New Roman', serif" font-size="48" fill="#000">Note personali</text>
  <line x1="26" y1="1330" x2="635" y2="1330" stroke="#000" stroke-width="2"/>
  <text x="26" y="1382" font-family="Georgia, 'Times New Roman', serif" font-size="44" fill="#000">${noteSvg}</text>
</svg>`;

  return {
    filename: `tessera-pcz-${code}.svg`,
    content: base64FromText(svg)
  };
}

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) {
    return json({ error: 'RESEND_API_KEY mancante' }, 500);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'JSON non valido' }, 400);
  }

  const nome = clean(data.nome).slice(0, 80);
  const cognome = clean(data.cognome).slice(0, 80);
  const email = clean(data.email).slice(0, 120).toLowerCase();
  const note = clean(data.note).slice(0, 900);
  const consenso = clean(data.consenso).toLowerCase();

  if (!nome || !cognome || !email || !note) {
    return json({ error: 'Tutti i campi sono obbligatori' }, 400);
  }

  if (!validEmail(email)) {
    return json({ error: 'Email non valida' }, 400);
  }

  if (consenso !== 'si') {
    return json({ error: 'Serve il consenso esplicito al tesseramento' }, 400);
  }

  const code = makeCode();
  const date = todayItalian();
  const attachment = await makeCardAttachment({ request, nome, cognome, note, code, date });

  const safeNome = escapeHtml(nome);
  const safeCognome = escapeHtml(cognome);
  const safeEmail = escapeHtml(email);
  const safeNote = escapeHtml(note);
  const safeCode = escapeHtml(code);
  const safeDate = escapeHtml(date);

  const userSubject = `Tessera PCZ ${code}`;
  const userHtml = `
    <div style="font-family: Georgia, serif; color:#101010; line-height:1.55">
      <h1 style="margin:0 0 12px; color:#061a46">Tessera PCZ</h1>
      <p>Compagno/a <strong>${safeNome} ${safeCognome}</strong>,</p>
      <p>la tua domanda di tesseramento al <strong>Partito Comunista Zingaro</strong> è stata accolta dal sistema automatico.</p>
      <p><strong>Numero tessera:</strong> ${safeCode}<br><strong>Data:</strong> ${safeDate}</p>
      <p>Trovi la tessera allegata a questa email.</p>
      <p style="margin-top:24px"><strong>Nessun confine, nessun padrone.</strong></p>
      <p>Redazione Mancuspie</p>
    </div>
  `;

  const adminSubject = `Nuovo tesseramento PCZ: ${nome} ${cognome} - ${code}`;
  const adminHtml = `
    <div style="font-family: sans-serif; color:#101010; line-height:1.55">
      <h1>Nuova domanda di tesseramento PCZ</h1>
      <p><strong>Nome:</strong> ${safeNome}</p>
      <p><strong>Cognome:</strong> ${safeCognome}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Data:</strong> ${safeDate}</p>
      <p><strong>Numero tessera:</strong> ${safeCode}</p>
      <p><strong>Consenso:</strong> sì</p>
      <p><strong>Note personali:</strong></p>
      <p>${safeNote}</p>
    </div>
  `;

  const sendEmail = async payload => {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.message || result?.error || 'Invio email fallito');
    }
    return result;
  };

  try {
    await sendEmail({
      from: 'Redazione Mancuspie <redazione@mancuspie.com>',
      to: [email],
      subject: userSubject,
      html: userHtml,
      attachments: [attachment]
    });

    await sendEmail({
      from: 'Tesseramento PCZ <redazione@mancuspie.com>',
      to: ['redazione@mancuspie.com'],
      subject: adminSubject,
      html: adminHtml,
      reply_to: email,
      attachments: [attachment]
    });
  } catch (error) {
    return json({ error: error.message || 'Errore durante invio email' }, 502);
  }

  return json({ ok: true, code, date }, 201);
}
