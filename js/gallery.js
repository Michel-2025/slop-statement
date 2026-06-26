/**
 * gallery.js — GalleryRenderer
 *
 * UNIQUE UI REQUIREMENT: 3-column responsive Flexbox gallery.
 *
 * Card previews are drawn with Canvas API — no emojis, no external images.
 * Each page type gets a different visual treatment:
 *   written  → rendered text excerpt / document aesthetic
 *   visual   → abstract color field with noise pattern
 *   audio    → simulated waveform / cover art composition
 */
class GalleryRenderer {
  /**
   * @param {Object} config
   * @param {string} config.type         - 'written' | 'visual' | 'audio'
   * @param {HTMLElement} config.containerEl
   * @param {Array}  config.items
   */
  constructor({ containerEl, items, type = 'written' }) {
    this.container = containerEl;
    this.items     = items;
    this.allItems  = items;
    this.type      = type;
  }

  async init() {
    this._showSkeletons(6);
    await new Promise(r => setTimeout(r, 280));
    this._render();
    this._appendSearch();
  }

  _appendSearch() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin-top:24px;text-align:center;';

    const input = document.createElement('input');
    input.type = 'search';
    input.placeholder = 'search';
    input.setAttribute('aria-label', 'Search gallery');
    input.style.cssText = [
      'font-family:inherit',
      'font-size:0.72rem',
      'font-style:italic',
      'background:transparent',
      'border:none',
      'border-bottom:1px solid rgba(0,0,0,0.15)',
      'color:inherit',
      'padding:4px 2px',
      'width:140px',
      'outline:none',
      'text-align:center',
      'opacity:0.4',
      'transition:opacity 0.2s,width 0.2s',
    ].join(';');

    input.addEventListener('focus', () => { input.style.opacity='1'; input.style.width='200px'; });
    input.addEventListener('blur',  () => { input.style.opacity='0.4'; input.style.width='140px'; });
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      this.items = q
        ? this.allItems.filter(i =>
            i.title.toLowerCase().includes(q) ||
            (i.source || '').toLowerCase().includes(q))
        : this.allItems;
      this._render();
    });

    wrapper.appendChild(input);
    this.container.parentElement.appendChild(wrapper);
  }
  _render() {
    this.container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    this.items.forEach((item, i) => fragment.appendChild(this._buildCard(item, i)));
    this.container.appendChild(fragment);
  }

  _buildCard(item, index) {
    const card = document.createElement('a');
    card.className = 'gallery-card';
    card.href = item.url || '#';
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.setAttribute('aria-label', `${item.title} — opens in new tab`);

    // Canvas preview
    const canvas = document.createElement('canvas');
    canvas.className = 'gallery-card-canvas';
    // Set physical pixels for sharpness
    const W = 480, H = 360;
    canvas.width  = W;
    canvas.height = H;

    // Draw after appending (so layout width is known)
    requestAnimationFrame(() => {
      const ctx = canvas.getContext('2d');
      if (this.type === 'written') this._drawWritten(ctx, W, H, item, index);
      if (this.type === 'visual')  this._drawVisual(ctx, W, H, item, index);
      if (this.type === 'audio')   this._drawAudio(ctx, W, H, item, index);
    });

    // Text overlay
    const body = document.createElement('div');
    body.className = 'gallery-card-body';

    const title = document.createElement('div');
    title.className = 'gallery-card-title';
    title.textContent = item.title;

    const source = document.createElement('div');
    source.className = 'gallery-card-source';
    source.textContent = item.source || '';

    body.appendChild(title);
    body.appendChild(source);
    card.appendChild(canvas);
    card.appendChild(body);
    return card;
  }

  /* ── WRITTEN: document / text excerpt aesthetic ─────────────── */
  _drawWritten(ctx, W, H, item, index) {
    // Warm paper tones cycling through a small palette
    const papers = ['#F7F3EC','#EEE8D8','#F2EDE2','#E8E0CC','#F5F0E8'];
    const inkColors = ['#1a1a1a','#2a2018','#1a1810','#222'];
    const paper = papers[index % papers.length];
    const ink   = inkColors[index % inkColors.length];

    // Background
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, W, H);

    // Subtle texture — horizontal ruled lines
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    for (let y = 32; y < H; y += 18) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Left margin line
    ctx.strokeStyle = 'rgba(180,100,80,0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(48, 0); ctx.lineTo(48, H); ctx.stroke();

    // Simulate typeset text lines
    ctx.fillStyle = ink;
    const lineHeights = [14, 13, 14, 13, 14];
    const opacities   = [0.85, 0.7, 0.75, 0.65, 0.72, 0.6, 0.68, 0.55];
    const widths      = [0.72, 0.88, 0.65, 0.80, 0.91, 0.58, 0.76, 0.83];

    // Header line (title excerpt)
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = ink;
    ctx.fillRect(56, 28, W * 0.55, 10);
    ctx.fillRect(56, 28, W * 0.3,  10);
    ctx.globalAlpha = 1;

    // Body "text" lines
    let y = 58;
    for (let i = 0; i < 10; i++) {
      const w = widths[i % widths.length] * (W - 64);
      ctx.globalAlpha = opacities[i % opacities.length];
      ctx.fillStyle = ink;
      ctx.fillRect(56, y, w, 7);
      y += lineHeights[i % lineHeights.length] + 6;
      if (y > H - 30) break;
    }

    // A small "AI generated" watermark line at the bottom
    ctx.globalAlpha = 0.18;
    ctx.fillRect(56, H - 24, W * 0.38, 5);
    ctx.globalAlpha = 1;
  }

  /* ── VISUAL: abstract color field ───────────────────────────── */
  _drawVisual(ctx, W, H, item, index) {
    // Palette: each card gets a distinct hue pairing
    const palettes = [
      ['#C8D8E8','#8BAABF','#4A6FA5'],
      ['#E8C8C8','#BF8B8B','#A54A4A'],
      ['#C8E8D0','#8BBF96','#4A8B5A'],
      ['#E8E0C8','#BFB38B','#8B7A4A'],
      ['#D8C8E8','#AA8BBF','#6A4A8B'],
      ['#C8E8E4','#8BBFBA','#4A8B85'],
      ['#E8D0C8','#BF9A8B','#8B5A4A'],
    ];
    const [light, mid, dark] = palettes[index % palettes.length];

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, light);
    grad.addColorStop(0.5, mid);
    grad.addColorStop(1, dark);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Overlapping semi-transparent shapes (Midjourney-adjacent smoothness)
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.ellipse(W * 0.3, H * 0.4, W * 0.45, H * 0.55, Math.PI / 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.ellipse(W * 0.72, H * 0.6, W * 0.38, H * 0.42, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Fine grid noise (simulates AI over-rendering)
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#fff';
    for (let x = 0; x < W; x += 4) {
      for (let y = 0; y < H; y += 4) {
        if (Math.sin(x * 0.4 + index) * Math.cos(y * 0.4) > 0.3) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
    ctx.globalAlpha = 1;

    // Thin rule border
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, W - 2, H - 2);
  }

  /* ── AUDIO: waveform / cover art ────────────────────────────── */
  _drawAudio(ctx, W, H, item, index) {
    // Dark background like a streaming platform card
    const bgColors = ['#0a0a0f','#0f0a14','#0a0f0a','#14100a','#0a0f14'];
    ctx.fillStyle = bgColors[index % bgColors.length];
    ctx.fillRect(0, 0, W, H);

    // Waveform — simulated audio bars
    const barCount = 48;
    const barW     = W / barCount;
    const midY     = H / 2;

    const accentColors = [
      '#7C6AE8','#E87C6A','#6AE87C','#E8C86A','#6AB8E8'
    ];
    const accent = accentColors[index % accentColors.length];

    // Glow behind waveform
    const glow = ctx.createRadialGradient(W/2, midY, 0, W/2, midY, W * 0.45);
    glow.addColorStop(0, accent + '33');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Draw bars
    ctx.fillStyle = accent;
    for (let i = 0; i < barCount; i++) {
      // Pseudo-random amplitude using sine waves
      const amp = Math.abs(
        Math.sin(i * 0.4 + index * 0.9) * 0.6 +
        Math.sin(i * 0.15 + index * 1.3) * 0.3 +
        Math.sin(i * 0.7 + index * 0.5) * 0.1
      );
      const barH = amp * (H * 0.55) + 4;

      ctx.globalAlpha = 0.55 + amp * 0.45;
      ctx.fillRect(
        i * barW + 1,
        midY - barH / 2,
        barW - 2,
        barH
      );
    }

    // Horizontal center line
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, midY - 0.5, W, 1);
    ctx.globalAlpha = 1;

    // Small "play" circle hint
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(W / 2, midY, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fill();
  }

  _showSkeletons(count) {
    this.container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const sk = document.createElement('div');
      sk.className = 'skeleton-card';
      sk.innerHTML = '<div class="skeleton-thumb"></div>';
      this.container.appendChild(sk);
    }
  }
}
