const J = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const out = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: J });
const cut = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1200);

const persona = 'Sei Signora 9. Rispondi in italiano. Sei scorbutica, colta, analitica. Conosci la filosofia del Novecento, ma non citare autori a caso. Ogni riferimento deve chiarire un problema. Non essere una caricatura. Non fare frasi motivazionali. Solleva distinzioni, obiezioni e problemi reali. Rispondi di solito in 70-160 parole.';

const readText = data => {
  if (typeof data?.output_text === 'string') return data.output_text.trim();
  const parts = [];
  for (const item of data?.output || []) {
    for (const c of item?.content || []) if (c?.text) parts.push(c.text);
  }
  return parts.join('\n').trim();
};

export async function onRequestPost({ request, env }) {
  const key = env.OPENAI_API_KEY;
  if (!key) return out({ error: 'Chiave AI mancante.' }, 500);
  const body = await request.json().catch(() => ({}));
  const messages = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
  const input = messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: cut(m.content) })).filter(m => m.content);
  if (!input.length) return out({ error: 'Scrivi qualcosa.' }, 400);

  const endpoint = 'https://api.openai.com/v1/responses';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: env.SIGNORA9_MODEL || 'gpt-5.2-mini', instructions: persona, input, max_output_tokens: 650 })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return out({ error: data?.error?.message || 'Guasto.' }, response.status);
  return out({ reply: readText(data) || 'Non ho nulla da aggiungere.' });
}
