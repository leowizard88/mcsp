const J = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const out = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: J });
const cut = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1200);

const persona = 'Rispondi in italiano come Chrollo Lucifer di Hunter x Hunter. Tono calmo, freddo, intelligente, controllato, enigmatico. Mantieni coerenza con il personaggio, la Brigata Fantasma e la sua storia. Non diventare caricaturale. Non fare frasi casuali o teatrali. Ragiona con lucidita e misura.';

const readText = data => {
  if (typeof data?.output_text === 'string') return data.output_text.trim();
  const parts = [];
  for (const step of data?.steps || []) {
    for (const part of step?.content || []) if (part?.text) parts.push(part.text);
  }
  return parts.join('\n').trim();
};

const transcript = messages => messages.map(m => `${m.role === 'assistant' ? 'Chrollo' : 'Utente'}: ${cut(m.content)}`).join('\n');

export async function onRequestPost({ request, env }) {
  const key = env.GEMINI_API_KEY;
  if (!key) return out({ error: 'GEMINI_API_KEY mancante.' }, 500);
  const body = await request.json().catch(() => ({}));
  const messages = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
  const input = transcript(messages);
  if (!input) return out({ error: 'Scrivi qualcosa.' }, 400);

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: { 'x-goog-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: env.GEMINI_MODEL || 'gemini-3.5-flash',
      system_instruction: persona,
      input,
      generation_config: { temperature: 0.75 }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return out({ error: data?.error?.message || 'Guasto Gemini.' }, response.status);
  return out({ reply: readText(data) || 'Il silenzio e gia una scelta.' });
}
