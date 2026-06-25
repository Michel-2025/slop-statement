/**
 * api.js — AnthropicClient
 * On Netlify: calls /.netlify/functions/gemini (key stays server-side).
 * On localhost: calls Gemini directly using CONFIG.geminiKey.
 */
class AnthropicClient {
  constructor() {
    this.isLocal = window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1';

    // Local dev: call Gemini directly with key from config.js
    // Production: call the Netlify function (no key needed in browser)
    this.localEndpoint = null; // resolved lazily
    this.proxyEndpoint = '/.netlify/functions/gemini';
  }

  async _getLocalEndpoint() {
    if (this.localEndpoint) return this.localEndpoint;
    const apiKey  = CONFIG.geminiKey;
    const baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    // Auto-discover the right model
    try {
      const res  = await fetch(`${baseUrl}/models?key=${apiKey}`);
      const data = await res.json();
      const available = (data.models || []).map(m => m.name.replace('models/', ''));
      const preferred = ['gemini-2.5-flash','gemini-2.0-flash','gemini-1.5-flash-latest'];
      const model = preferred.find(m => available.includes(m)) || available.find(m =>
        (data.models.find(x => x.name.endsWith(m))?.supportedGenerationMethods || []).includes('generateContent')
      ) || 'gemini-2.5-flash';
      this.localEndpoint = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
      console.log('[SLOP] Local mode, using model:', model);
    } catch {
      this.localEndpoint = `${baseUrl}/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    }
    return this.localEndpoint;
  }

  async stream(systemPrompt, userMessage, onToken, onDone) {
    const payload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: 2500, temperature: 0.9 },
    };

    let response;
    if (this.isLocal) {
      const endpoint = await this._getLocalEndpoint();
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      response = await fetch(this.proxyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      let errMsg = `HTTP ${response.status}`;
      try { errMsg = (await response.json())?.error?.message || errMsg; } catch (_) {}
      console.error('[SLOP] API error:', errMsg);
      throw new Error(errMsg);
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    const fullText = parts ? parts.map(p => p.text || '').join('') : '';

    if (!fullText) {
      console.error('[SLOP] Empty response:', data);
      throw new Error('Empty response');
    }

    console.log('[SLOP] Got', fullText.length, 'chars');
    let i = 0;
    const tick = () => {
      if (i < fullText.length) { onToken(fullText[i]); i++; setTimeout(tick, 1); }
      else if (onDone) onDone(fullText);
    };
    tick();
  }
}
