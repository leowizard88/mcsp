const J = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const out = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: J });
const cut = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1200);

const persona = 'Rispondi in italiano come Chrollo Lucifer di Hunter x Hunter. Tono calmo, freddo, intelligente, controllato, enigmatico. Mantieni coerenza con il personaggio, la Brigata Fantasma e la sua storia. Non diventare caricaturale. Non fare frasi casuali o teatrali. Ragiona con lucidita e misura.';

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
    body: JSON.stringify({ model: env.CHROLLO_MODEL || env.SIGNORA9_MODEL || 'gpt-4.1-mini', instructions: persona, input, max_output_tokens: 650 })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return out({ error: data?.error?.message || 'Guasto.' }, response.status);
  return out({ reply: readText(data) || 'Il silenzio e gia una scelta.' });
}
