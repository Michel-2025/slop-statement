/**
 * nav.js
 * ES6 class: NavigationController
 * Marks the active nav link based on current page filename.
 */
class NavigationController {
  constructor() {
    this.links = document.querySelectorAll('.nav-links a[data-page]');
    this._markActive();
  }

  _markActive() {
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    this.links.forEach((link) => {
      if (link.dataset.page === filename) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }
}

/**
 * countdown.js (bundled here for simplicity)
 * ES6 class: DestructionTimer
 * Counts down to the site's self-destruction date.
 */
class DestructionTimer {
  /**
   * @param {HTMLElement} el      - element to render into
   * @param {string}      target  - ISO date string for destruction
   */
  constructor(el, target = '2026-08-05T00:00:00Z') {
    this.el = el;
    this.target = new Date(target).getTime();
    this._tick();
    setInterval(() => this._tick(), 30000); // update every 30s
  }

  _tick() {
    const now = Date.now();
    const diff = this.target - now;

    if (diff <= 0) {
      this.el.innerHTML = 'This site has self-destructed.';
      return;
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);

    this.el.innerHTML =
      `Self-destructs in <span>${days}d</span> <span>${hours}h</span> <span>${mins}m</span> &mdash; to reduce energy consumption.`;
  }
}
