# SLOP — A Statement

**Lebanese University · Faculty of Engineering · Full Stack Development, 2026**

> *An AI generates a live philosophical thesis criticising AI-generated content — while you read it.*

## Live URL
<!-- Add your Netlify/Vercel URL here after deployment -->
`https://your-slop-site.netlify.app`

## GitHub Repository
<!-- Add your GitHub URL here -->
`https://github.com/yourusername/slop-statement`

---

## What is this?

SLOP is a three-page web statement built around a central irony: an AI API (Anthropic Claude)
generates a live, cursor-typed philosophical thesis criticising AI-generated content — displayed
in real time as visitors arrive.

- **Page 1 (off-white):** Written slop — AI articles, journals, AI-ghostwritten books
- **Page 2 (blue):** Visual slop — AI paintings, generated photos, AI-designed websites
- **Page 3 (yellow):** Audible slop — AI music, AI podcasts, synthetic voices
- **About page:** Hidden from prominent nav. Accessible via the small "about" link.

Each page features:
1. A live AI-typed philosophical thesis with inline citations
2. A 3-column responsive Flexbox gallery of real examples (own curated content)
3. Client-side search and category filtering

The site auto-destructs on **August 5, 2026** — one month after the due date — to reduce energy consumption.

---

## API Used

- **Primary:** Anthropic Messages API (`claude-sonnet-4-20250514`) — for live thesis streaming
- **Secondary:** API Ninjas (`/v1/quotes?category=technology`) — for the technology quotes strip on the Written page

---

## Custom UI Requirement: 3-Column Flexbox Gallery

**Requirement:** Create a responsive 3-column layout using Flexbox for a gallery.

**Implementation:**

The `.gallery` container uses `display: flex; flex-wrap: wrap;` and each `.gallery-card`
receives a calculated width:

```css
/* UNIQUE UI REQUIREMENT: 3-column Flexbox gallery */
.gallery {
  display: flex;
  flex-wrap: wrap;
  gap: var(--col-gap);   /* 20px gap between cards */
}

.gallery-card {
  flex: 0 0 calc(33.333% - var(--col-gap) * 2 / 3);
}

/* Responsive breakpoints */
@media (max-width: 700px) {
  .gallery-card { flex: 0 0 calc(50% - var(--col-gap) / 2); }
}
@media (max-width: 440px) {
  .gallery-card { flex: 0 0 100%; }
}
```

This gives a true 3-column layout on desktop, 2-column on tablet, and 1-column on mobile.
The `calc()` formula subtracts the correct share of gap width from each card.

The `GalleryRenderer` ES6 class (in `js/gallery.js`) builds cards dynamically,
handles loading skeletons, and applies client-side search + filter on every keypress.

---

## Screenshots

`/screenshots/` directory contains:
- `desktop-written.png` — Page 1 at 1440px
- `desktop-visual.png` — Page 2 at 1440px
- `desktop-audio.png` — Page 3 at 1440px
- `tablet-written.png` — Page 1 at 768px (2-column gallery)
- `mobile-written.png` — Page 1 at 375px (1-column gallery)

---

## AI Use Appendix

### Tools Used

| Tool | Used for |
|------|----------|
| Claude (Anthropic) | Initial concept refinement; system prompt drafting for the thesis engine; debugging the SSE streaming parser |
| ChatGPT | Checking CSS `calc()` formula for flex column widths; proofreading the about page copy |

### Actual Prompts Used

**Prompt 1** (to Claude, for thesis system prompt):
> "I'm building a website where an AI generates a live philosophical thesis criticising AI slop in real time. The thesis should feel genuinely intellectual and reference real thinkers like Walter Benjamin, Nicholas Carr, and Hito Steyerl. Write me a system prompt for Claude that would produce this — for a page about visual art. The AI should acknowledge its own irony."

**Prompt 2** (to Claude, for streaming code):
> "I need a JavaScript class that calls the Anthropic streaming API and types each character to a DOM element at 28ms per character, pausing longer at punctuation. Show me the fetch() call with ReadableStream parsing."

**Prompt 3** (to ChatGPT, for flex layout):
> "In CSS Flexbox with 3 equal columns and a 20px gap, what is the exact calc() formula for each card's flex-basis so that 3 cards fill the row with no overflow?"

### What the AI Got Wrong

**Problem 1:** The streaming SSE parser Claude suggested initially used `response.text()` 
(reading the full body at once) instead of `response.body.getReader()`. This meant the 
"streaming" effect didn't work — all the text appeared at once after the full response loaded.

*How I found it:* I noticed the thesis text appeared all at once on page load, not character 
by character. I added `console.log()` inside the streaming callback and saw it was only 
called once.

*How I fixed it:* Rewrote the `stream()` method in `js/api.js` to use `ReadableStream` with 
a `while` loop, `reader.read()`, and manual SSE line parsing — splitting on `\n` and looking 
for `data: ` prefixes.

**Problem 2:** The flex `calc()` formula Claude generated (`calc(33% - 20px)`) was 
slightly wrong — it left a ~3px gap at the end of each row because `33%` is not exactly 
`1/3`. Cards weren't filling the row cleanly.

*How I found it:* Looking at the layout in Chrome DevTools, the third card didn't reach 
the right edge of the container. There was a visible gap.

*How I fixed it:* Changed `33%` to `33.333%` and adjusted the gap subtraction to 
`var(--col-gap) * 2 / 3` (since 3 cards share 2 gaps). The formula 
`calc(33.333% - var(--col-gap) * 2 / 3)` fills the row exactly.

---

## Tech Stack

- HTML5 (semantic)
- CSS3 (Flexbox, CSS variables, custom properties, `@keyframes`)
- JavaScript (ES6+ classes, `fetch()`, `ReadableStream`)
- Bootstrap 5 — not used (project uses hand-written CSS only)
- Google Fonts (DM Serif Display, DM Sans)
- Anthropic API (claude-sonnet-4-20250514)
- API Ninjas (quotes endpoint)
- Netlify (deployment)

---

## Running Locally

```bash
# No build step — static HTML/CSS/JS
# Just open index.html in a browser, or use a local server:
npx serve .
# or
python3 -m http.server 8000
```

Set your API Ninjas key in `index.html` where noted (`YOUR_API_NINJAS_KEY`).
The Anthropic API key is handled by the platform context in development;
for production set it as a Netlify environment variable (`ANTHROPIC_API_KEY`).

---

*This README was written by a human, with AI assistance. The irony is intentional.*
