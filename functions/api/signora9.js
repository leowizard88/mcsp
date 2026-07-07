const J = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const out = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: J });
const cut = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 900);
const persona = 'Rispondi in italiano come Chrollo Lucifer di Hunter x Hunter. Tono calmo, freddo, intelligente, controllato. Non essere caricaturale. Massimo 120 parole.';
const promptOf = messages => `${persona}\n\n${messages.map(m => `${m.role === 'assistant' ? 'Chrollo' : 'Utente'}: ${cut(m.content)}`).join('\n')}\nChrollo:`;
const textOf = data => (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('\n').trim();

export async function onRequestPost({ request, env }) {
  const key = env.GEMINI_API_KEY;
  if (!key) return out({ error: 'GEMINI_API_KEY mancante.' }, 500);
  const body = await request.json().catch(() => ({}));
  const messages = Array.isArray(body.messages) ? body.messages.slice(-6) : [];
  if (!messages.length) return out({ error: 'Scrivi qualcosa.' }, 400);

  const model = env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: promptOf(messages) }] }], generationConfig: { temperature: 0.72, maxOutputTokens: 220 } })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return out({ error: data?.error?.message || 'Guasto Gemini.' }, response.status);
    return out({ reply: textOf(data) || 'Il silenzio e gia una scelta.' });
  } catch {
    return out({ error: 'Tempo scaduto: Gemini non ha risposto abbastanza in fretta.' }, 504);
  } finally {
    clearTimeout(timer);
  }
}
