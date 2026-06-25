# I Hate Taste Slop

**Lebanese University · Faculty of Engineering · Full Stack Development, 2026
Student: Michel Njeim**

> \*An AI generates a live philosophical thesis criticising AI-generated content — while you read it, surrounded by examples of exactly that content.\*

## Live URL

`https://6a3d0453535cc8055d9b3e2d--teal-bubblegum-71d105.netlify.app`

## GitHub Repository

`https://github.com/Michel-2025/slop-statement`

\---

## What is this?

I Hate Taste Slop is a three-page web statement about AI-generated content. Each page documents a different category: written slop, visual slop, and audible slop. On each page, a live AI-generated philosophical thesis types itself across the center of the screen — criticising AI content while being AI content itself.

The thesis loops: when it finishes, it slides off left and begins again. This is intentional. AI-generated content does not conclude. It produces, and produces, cycling through the same patterns indefinitely.

* **Page 1 (off-white):** Written slop — AI articles, journals, AI-ghostwritten books
* **Page 2 (blue):** Visual slop — AI paintings, generated photos, AI-designed websites
* **Page 3 (yellow):** Audible slop — AI music, AI podcasts, synthetic voices
* **About page:** Accessible via the faint "About" link in the nav, and as a full-screen overlay on first visit

\---

## API Used

* **Primary:** Google Gemini API (`gemini-2.5-flash`) — generates the live philosophical thesis on each page. Called via a Netlify serverless function so the key never touches the browser.
* **Secondary:** API Ninjas (`/v1/quotes?category=technology`) — fetches technology quotes displayed on the Written page. Falls back to static quotes if unavailable.

\---

## Custom UI Requirement: 3-Column Flexbox Gallery

**Requirement:** Create a responsive 3-column layout using Flexbox for a gallery.

**Implementation** (see `.gallery` and `.gallery-card` in `css/main.css`):

```css
/\* UNIQUE UI REQUIREMENT: 3-column responsive Flexbox gallery \*/
.gallery {
  display: flex;
  flex-wrap: wrap;
  gap: var(--col-gap); /\* 16px \*/
}

.gallery-card {
  flex: 0 0 calc(33.333% - var(--col-gap) \* 2 / 3);
}

@media (max-width: 700px) {
  .gallery-card { flex: 0 0 calc(50% - var(--col-gap) / 2); }
}
@media (max-width: 440px) {
  .gallery-card { flex: 0 0 100%; }
}
```

Card previews are drawn with the Canvas API — no external images or emojis. Each page type has a distinct visual treatment: written pages use a paper-and-ink document aesthetic, visual pages use abstract color fields, audio pages use waveform visualisations.

The `GalleryRenderer` ES6 class (`js/gallery.js`) builds all cards dynamically and handles loading skeleton states.

\---

## Screenshots

`/screenshots/` contains:

* `desktop-written.png` — Page 1 at 1440px
* `desktop-visual.png` — Page 2 at 1440px
* `desktop-audio.png` — Page 3 at 1440px
* `tablet-written.png` — Page 1 at 768px (2-column gallery)
* `mobile-written.png` — Page 1 at 375px (1-column gallery)

\---

## AI Use Appendix

### Tools Used

|Tool|Used for|
|-|-|
|Claude (Anthropic)|Full project architecture, all code generation, debugging, iterative UI fixes throughout development|
|Google Gemini (via API)|Live thesis generation on each page of the site itself|

### Actual Prompts Used

**Prompt 1** — initial concept and architecture:

> "I need my api key to be hidden just like dr said. Before doing this the api situation is still not working, the live text isn't showing up."

**Prompt 2** — debugging the API 404:

> "The api you just made, what is it supposed to do? Because that doesn't seem like it's working. I'm loading the site but no AI is being written live."

**Prompt 3** — layout and hero centering:

> "The text on top is not well centered it's too close to the sticky bar. I want the first row of the gallery way down so that it barely shows but enough for the user to know it's there and scrolls. Instead make the quote/live thesis be centered vertically."

### What the AI Got Wrong

**Problem 1: Script loading order crashed the API silently.**
`config.js` and `api.js` were placed at the bottom of `<body>` after the inline script that called `new AnthropicClient()`. This meant `CONFIG` was undefined when the thesis engine tried to initialise — the whole thing failed silently with no visible error, just a blank thesis area.

*How I found it:* Opened DevTools console and saw `ReferenceError: CONFIG is not defined` firing immediately on page load.

*How I fixed it:* Moved both `<script src="config.js">` and `<script src="js/api.js">` into the `<head>` of every HTML page so they load before any other script runs.

**Problem 2: Gemini returning 404 on model name.**
The original code used `gemini-1.5-flash` as the model name. The API was receiving requests (confirmed in the Gemini dashboard) but returning 404. Changing to `gemini-1.5-flash-latest` didn't help either.

*How I found it:* Checked the Gemini console — requests were arriving but the model endpoint didn't exist for my account tier.

*How I fixed it:* Added a model auto-discovery step that first calls `/v1beta/models` to list all models available to the API key, then picks the first compatible one. This surfaced `gemini-2.5-flash` as the correct model for my account.

**Problem 3: Gallery not scrolling into view — the thesis section was in normal document flow.**
Multiple attempts to fix centering with `margin-top` and `padding` on `.thesis-section` failed because the section was `position: relative`, meaning the gallery immediately followed it in flow regardless of what padding was applied.

*How I found it:* Inspecting the page in DevTools showed `.thesis-section` ending right where the gallery began — no scroll gap existed in the DOM.

*How I fixed it:* Changed `.thesis-section` to `position: fixed` (removing it from document flow entirely) and added a `.gallery-spacer` div of `height: calc(100vh - 80px)` before the gallery in the HTML. This creates the scroll distance while the fixed thesis acts as a full-screen background.

\---

## Tech Stack

* HTML5 (semantic)
* CSS3 (Flexbox, CSS custom properties, `@keyframes`, `mask-image`, Canvas API)
* JavaScript ES6+ (classes, `fetch()`, `async/await`, `sessionStorage`, Canvas 2D)
* Google Fonts (Playfair Display, IM Fell English)
* Google Gemini API (`gemini-2.5-flash`)
* API Ninjas (quotes endpoint)
* Netlify (deployment + serverless function for API key proxy)

\---

## Running Locally

```bash
npx serve .
```

Requires `config.js` in the project root with your Gemini key:

```js
const CONFIG = { geminiKey: 'YOUR\_KEY\_HERE' };
```

For production, the key is set as `GEMINI\_KEY` in Netlify environment variables and accessed via the serverless function at `netlify/functions/gemini.js`.

\---

*This README was written with AI assistance. The irony is fully intended.*

