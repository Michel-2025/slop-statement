/**
 * api.js — AnthropicClient (wraps Google Gemini free tier)
 * Auto-discovers the correct model name from your API key.
 */
class AnthropicClient {
  constructor() {
    this.apiKey  = CONFIG.geminiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.model   = null; // resolved in stream()
  }

  // Try models in order of preference, use first one that exists
  async _resolveModel() {
    if (this.model) return this.model;

    const candidates = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
      'gemini-pro',
    ];

    // Fetch the list of models available to this key
    try {
      const res = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`);
      if (res.ok) {
        const data = await res.json();
        const available = (data.models || []).map(m => m.name.replace('models/', ''));
        console.log('[SLOP] Available models:', available);
        for (const c of candidates) {
          if (available.includes(c)) {
            console.log('[SLOP] Using model:', c);
            this.model = c;
            return this.model;
          }
        }
        // Fallback: use first model that supports generateContent
        const first = (data.models || []).find(m =>
          (m.supportedGenerationMethods || []).includes('generateContent')
        );
        if (first) {
          this.model = first.name.replace('models/', '');
          console.log('[SLOP] Falling back to first available:', this.model);
          return this.model;
        }
      }
    } catch (e) {
      console.warn('[SLOP] Could not list models, trying default:', e);
    }

    // Hard fallback
    this.model = 'gemini-1.5-flash-latest';
    return this.model;
  }

  async stream(systemPrompt, userMessage, onToken, onDone) {
    const model    = await this._resolveModel();
    const endpoint = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

    console.log('[SLOP] Calling:', endpoint);

    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          generationConfig: { maxOutputTokens: 2500, temperature: 0.9 },
        }),
      });
    } catch (networkErr) {
      console.error('[SLOP] Network error:', networkErr);
      throw networkErr;
    }

    if (!response.ok) {
      let errMsg = `HTTP ${response.status}`;
      try { errMsg = (await response.json())?.error?.message || errMsg; } catch (_) {}
      console.error('[SLOP] API error:', errMsg);
      this.model = null; // reset so next call tries again
      throw new Error(errMsg);
    }

    const data = await response.json();
    console.log('[SLOP] Response:', JSON.stringify(data).slice(0, 300));

    let fullText = '';
    const parts = data?.candidates?.[0]?.content?.parts;
    if (parts) fullText = parts.map(p => p.text || '').join('');
    else if (data?.candidates?.[0]?.text) fullText = data.candidates[0].text;

    if (!fullText) {
      console.error('[SLOP] Empty text. Full response:', data);
      throw new Error('Empty response');
    }

    console.log('[SLOP] Got', fullText.length, 'chars — typing...');

    let i = 0;
    const tick = () => {
      if (i < fullText.length) { onToken(fullText[i]); i++; setTimeout(tick, 1); }
      else if (onDone) onDone(fullText);
    };
    tick();
  }
}
