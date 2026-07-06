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

  const userSubject = 'Domanda di tesseramento PCZ ricevuta';
  const userHtml = `
    <div style="font-family: Georgia, serif; color:#101010; line-height:1.55">
      <h1 style="margin:0 0 12px; color:#061a46">Tesseramento PCZ</h1>
      <p>Compagno/a <strong>${nome} ${cognome}</strong>,</p>
      <p>la tua domanda di tesseramento al <strong>Partito Comunista Zingaro</strong> è stata ricevuta.</p>
      <p>La tessera ufficiale verrà generata e inviata nella prossima fase del sistema.</p>
      <p style="margin-top:24px"><strong>Nessun confine, nessun padrone.</strong></p>
      <p>Redazione Mancuspie</p>
    </div>
  `;

  const adminSubject = `Nuovo tesseramento PCZ: ${nome} ${cognome}`;
  const adminHtml = `
    <div style="font-family: sans-serif; color:#101010; line-height:1.55">
      <h1>Nuova domanda di tesseramento PCZ</h1>
      <p><strong>Nome:</strong> ${nome}</p>
      <p><strong>Cognome:</strong> ${cognome}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Consenso:</strong> sì</p>
      <p><strong>Note personali:</strong></p>
      <p>${note}</p>
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
      html: userHtml
    });

    await sendEmail({
      from: 'Tesseramento PCZ <redazione@mancuspie.com>',
      to: ['redazione@mancuspie.com'],
      subject: adminSubject,
      html: adminHtml,
      reply_to: email
    });
  } catch (error) {
    return json({ error: error.message || 'Errore durante invio email' }, 502);
  }

  return json({ ok: true }, 201);
}
