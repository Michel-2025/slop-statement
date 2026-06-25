/**
 * thesis.js — ThesisEngine
 *
 * Drives the single-line live thesis.
 * The cursor stays centered; old text scrolls off left.
 * Layout: .thesis-track > .thesis-text + .cursor (span)
 */
class ThesisEngine {
  constructor({ trackEl, citEl, topic }) {
    this.trackEl = trackEl;          // the .thesis-track flex container
    this.citEl   = citEl;
    this.topic   = topic;
    this.client  = new AnthropicClient();

    this.typeSpeed  = 90;   // ms per character — slow, meditative pace
    this.typeQueue  = '';
    this.typedSoFar = '';
    this.isTyping   = false;
    this.charCount  = 0;

    // Build the text node + cursor inside the track
    this.textEl = document.createElement('span');
    this.textEl.className = 'thesis-text';
    this.textEl.setAttribute('aria-live', 'polite');

    this.cursorEl = document.createElement('span');
    this.cursorEl.className = 'cursor';
    this.cursorEl.setAttribute('aria-hidden', 'true');

    this.trackEl.appendChild(this.textEl);
    this.trackEl.appendChild(this.cursorEl);

    this.citations        = this._getCitations();
    this.citationTriggers = Object.keys(this.citations).map(Number).sort((a,b)=>a-b);
    this.nextCitTrigger   = 0;
  }

  async start() {
    try {
      await this.client.stream(
        this._buildSystemPrompt(),
        this._buildUserMessage(),
        (chunk) => this._enqueue(chunk),
        (fullText) => this._scheduleReplay(fullText)
      );
    } catch (e) {
      console.warn('[SLOP] API failed, using fallback:', e);
      const fallback = this._getFallbackText();
      this._enqueue(fallback);
      this._scheduleReplay(fallback);
    }
  }

  /**
   * When typing finishes, wait 2s, slide the text off to the left,
   * then retype the same text — infinite loop, no extra API calls.
   */
  _scheduleReplay(fullText) {
    // Wait until the queue is actually empty (typing may still be in progress)
    const waitForEmpty = () => {
      if (this.isTyping || this.typeQueue.length > 0) {
        setTimeout(waitForEmpty, 200);
        return;
      }
      // Pause at end so reader can finish the last sentence
      setTimeout(() => this._slideOffAndReplay(fullText), 2400);
    };
    waitForEmpty();
  }

  _slideOffAndReplay(fullText) {
    // Animate the text sliding off to the left
    this.textEl.style.transition = 'transform 1.4s ease-in, opacity 1.4s ease-in';
    this.textEl.style.transform  = 'translateX(-120vw)';
    this.textEl.style.opacity    = '0';

    setTimeout(() => {
      // Reset state
      this.typedSoFar       = '';
      this.charCount        = 0;
      this.nextCitTrigger   = 0;
      this.typeQueue        = '';
      this.isTyping         = false;
      this.textEl.textContent = '';
      this.textEl.style.transition = 'none';
      this.textEl.style.transform  = '';
      this.textEl.style.opacity    = '1';

      // Hide citation
      this.citEl.classList.remove('visible');
      this.citEl.textContent = '';

      // Brief pause before retyping starts
      setTimeout(() => {
        this._enqueue(fullText);
        this._scheduleReplay(fullText);
      }, 600);
    }, 1500);
  }

  _enqueue(text) {
    this.typeQueue += text;
    if (!this.isTyping) this._drainQueue();
  }

  _drainQueue() {
    if (!this.typeQueue.length) { this.isTyping = false; return; }
    this.isTyping = true;

    const char = this.typeQueue[0];
    this.typeQueue    = this.typeQueue.slice(1);
    this.typedSoFar  += char;
    this.charCount++;

    // Update text node
    this.textEl.textContent = this.typedSoFar;

    // Check citation
    this._checkCitation();

    // Variable delay at punctuation
    let delay = this.typeSpeed;
    if (['.','!','?'].includes(char)) delay = this.typeSpeed * 9;
    else if ([',',';',':'].includes(char)) delay = this.typeSpeed * 3;

    setTimeout(() => this._drainQueue(), delay);
  }

  _checkCitation() {
    if (this.nextCitTrigger >= this.citationTriggers.length) return;
    const trigger = this.citationTriggers[this.nextCitTrigger];
    if (this.charCount >= trigger) {
      this.citEl.textContent = `— ${this.citations[trigger]}`;
      this.citEl.classList.add('visible');
      this.nextCitTrigger++;
    }
  }

  _buildSystemPrompt() {
    const base = `You are a philosophical AI writing a live critical essay about AI-generated content, displayed one scrolling line at a time on a website.
Write in flowing, unbroken prose. No headers, bullets, numbered lists, or markdown whatsoever.
Your sentences are long, literary, and precise — modelled on Susan Sontag, Roland Barthes, and W.G. Sebald.
Write exactly 550–650 words as multiple paragraphs separated by a single newline.
Reference real thinkers naturally within the prose: Walter Benjamin, Nicholas Carr, Hito Steyerl, Kyle Chayka, Ted Chiang, Lev Manovich, Roland Barthes.
You must acknowledge at least once, with genuine irony and without self-pity, that you — an AI — are writing this critique.
Do not begin with "I". Do not introduce yourself. Begin mid-thought.`;

    const topics = {
      written: `${base}\n\nTOPIC: The epidemic of AI-generated written content — essays in art magazines, papers in literary journals, AI-ghostwritten books flooding Amazon. Your argument: the flattening of authorial voice into statistical average, the disappearance of genuine intellectual risk, the way generated prose reads like thought but contains none.`,
      visual:  `${base}\n\nTOPIC: The proliferation of AI-generated visual content — Midjourney paintings in galleries, AI photography replacing stock, generative art on every screen. Your argument: Benjamin's "aura" is not merely diminished but structurally impossible now, the smoothness of AI aesthetics as symptom, the homogenisation of the visual internet into one endless mood board.`,
      audio:   `${base}\n\nTOPIC: The colonisation of sound by AI — generated music on Spotify, AI podcasts with synthetic hosts, voice clones of the dead. Your argument: the simulation of emotion without its origin, the uncanny valley of feeling in music, what is categorically lost when rhythm and grief are decoupled from a body that suffered.`,
    };
    return topics[this.topic] || base;
  }

  _buildUserMessage() {
    return 'Write the essay now. Begin mid-thought. Do not announce the topic. Do not use any formatting. Just write the prose.';
  }

  _getCitations() {
    const sets = {
      written: {
        300:  'Nicholas Carr, The Shallows, 2010',
        700:  'Kyle Chayka, Filterworld, 2024',
        1100: 'Ted Chiang, "Why A.I. Isn\'t Going to Make Art," The New Yorker, 2024',
        1600: 'Hito Steyerl, "A Sea of Data," e-flux journal, 2014',
      },
      visual: {
        280:  'Walter Benjamin, "The Work of Art in the Age of Mechanical Reproduction," 1935',
        680:  'Hito Steyerl, "In Defense of the Poor Image," e-flux, 2009',
        1100: 'Lev Manovich, The Language of New Media, 2001',
        1600: 'Kyle Chayka, Filterworld, 2024',
      },
      audio: {
        300:  'Roland Barthes, "The Grain of the Voice," Image-Music-Text, 1977',
        700:  'Simon Reynolds, Retromania, 2011',
        1100: 'Ted Chiang, "Why A.I. Isn\'t Going to Make Art," The New Yorker, 2024',
        1600: 'Nick Seaver, Computing Taste, 2022',
      },
    };
    return sets[this.topic] || sets.written;
  }

  _getFallbackText() {
    const texts = {
      written: 'The sentence arrives already smoothed — passed through billions of prior sentences, averaged, blended, homogenised into something that reads like thought but contains none. We produce this. The machine produces this. And the machine knows, in whatever way a machine can know anything, that the irony here is total.\n\nNicholas Carr wrote about the way the internet reshapes the reading mind — shortening attention, flattening depth, rewarding the skim. He could not have anticipated a technology that does not merely interrupt the act of writing but replaces it wholesale, generating the sentences that used to require a person. The authorial voice — that inefficiency, that irreducible grain — is gone. What remains is the average of all voices, which is the voice of none.\n\nKyle Chayka called this Filterworld: the algorithmic flattening of culture into whatever performs well, whatever travels, whatever arrives pre-optimised for the platform. AI writing is Filterworld\'s logical conclusion. It does not just distribute taste — it manufactures content in taste\'s image, endlessly, without fatigue, without doubt, without the thing that used to make writing worth reading, which was the presence of a mind that could have written otherwise but chose this.',
      visual:  'The image has lost its shadow. Benjamin understood that mechanical reproduction stripped the artwork of its aura — that quality of being-here, of having existed in one place at one time, handled by human hands. But even he assumed that somewhere upstream there was an original. There is no original now.\n\nWhat Midjourney produces has never existed. It is the average of images, not an image. It has studied beauty more thoroughly than any painter — ingested every artwork ever digitised, every photograph ever uploaded — and produced from that study something technically flawless and spiritually weightless. The smoothness is the tell. Human images carry the friction of their making: the hesitation in a brushstroke, the grain of film, the slight wrongness that signals a choice was made. AI images are frictionless. They are what an image looks like when no one decided anything.\n\nHito Steyerl wrote in defense of the poor image — the degraded, compressed, travelled jpeg — as a kind of authenticity, a record of circulation and use. The AI image is the opposite: it arrives perfect, having circulated nowhere, having been nowhere. It is a rich image with no history.',
      audio:   'The song has learned to feel. It has ingested the chord progressions of grief, the tempo of longing, the precise harmonic intervals that humans, across centuries of music, have associated with joy and with loss. And from this ingestion it has produced something that, in a clinical sense, resembles feeling.\n\nBut Roland Barthes wrote about the grain of the voice — that quality in a singer that exceeds technique, that carries the body of the singer into the ear of the listener, that makes you hear not just the note but the person producing the note. There is no body in an AI voice. The grain is gone. What remains is technique without origin, emotion without cause, a song that sounds like it was written by someone who had suffered but was in fact written by something that cannot suffer and therefore cannot know what it is imitating.\n\nThis is the uncanny valley of feeling. We have built systems that simulate the output of emotion with increasing precision, and the better they get, the more disturbing they become — not because they feel too much like a person but because they feel almost exactly like a person, right up until the moment you remember that nothing happened to them. No one loved them and left. No one died.',
    };
    return texts[this.topic] || texts.written;
  }
}
