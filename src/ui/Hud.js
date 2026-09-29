const $ = (id) => document.getElementById(id);

function replay(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth; // restart the CSS animation
  el.classList.add(cls);
}

/** Thin layer over the in-game DOM widgets. */
export class Hud {
  constructor() {
    this.el = {
      caption: $('hud-caption'), breath: $('hud-breath'), progress: $('hud-progress'), score: $('hud-score'),
      cards: $('hud-cards'), cardImg: $('card-img'), cardEmoji: $('card-emoji'), cardName: $('card-name'), cardBar: $('card-bar'),
      next: $('card-next'), nextEmoji: $('next-emoji'), nextName: $('next-name'),
      ring: document.querySelector('.ring'), ringFg: $('ring-fg'), ringNum: $('ring-num'),
      match: $('hud-match'), matchFill: $('match-fill'), meter: $('hud-meter'), meterFill: $('meter-fill'), meterLabel: $('meter-label'),
      judge: $('hud-judge'), count: $('hud-count'), banner: $('hud-banner'), stars: $('hud-stars'),
    };
    this.currentCard = document.querySelector('.card.current');
  }

  show(mode) {
    this.mode = mode;
    this.caption('');
    this.breath('');
    this.progress(0);
    this.score(0);
    this.el.score.parentElement.classList.toggle('hidden', mode !== 'dance');
    this.el.cards.classList.add('hidden');
    this.timer(null);
    this.match(null);
    this.meter(null);
    this.banner(null);
  }

  caption(text) {
    this.el.caption.textContent = text ?? '';
  }

  breath(text) {
    this.el.breath.textContent = text ?? '';
  }

  progress(f) {
    this.el.progress.style.width = `${Math.max(0, Math.min(1, f)) * 100}%`;
  }

  score(n) {
    this.el.score.textContent = n.toLocaleString();
  }

  card(cur, next) {
    const e = this.el;
    e.cards.classList.remove('hidden');
    e.cardImg.src = cur.thumb ?? '';
    e.cardImg.style.visibility = cur.thumb ? 'visible' : 'hidden';
    e.cardEmoji.textContent = cur.emoji;
    e.cardName.textContent = cur.name;
    replay(this.currentCard, 'current');
    e.next.classList.toggle('hidden', !next);
    if (next) {
      e.nextEmoji.textContent = next.emoji;
      e.nextName.textContent = next.name;
    }
    this.cardProgress(0);
  }

  cardProgress(f) {
    this.el.cardBar.style.width = `${Math.max(0, Math.min(1, f)) * 100}%`;
  }

  /** Countdown ring around the pose card (fraction done), or null to hide. */
  timer(fraction, seconds) {
    const on = fraction !== null && fraction !== undefined;
    this.el.ring.classList.toggle('on', on);
    this.el.ringNum.classList.toggle('on', on);
    if (!on) return;
    this.el.ringFg.style.strokeDashoffset = String(283 * (1 - fraction));
    this.el.ringNum.textContent = seconds;
  }

  /** "How well are you matching?" gauge (camera only). */
  match(score) {
    const on = score !== null && score !== undefined;
    this.el.match.classList.toggle('on', on);
    if (on) this.el.matchFill.style.height = `${Math.round(score * 100)}%`;
  }

  meter(fraction, label = '') {
    const on = fraction !== null && fraction !== undefined;
    this.el.meter.classList.toggle('on', on);
    if (!on) return;
    this.el.meterFill.style.width = `${Math.max(0, Math.min(1, fraction)) * 100}%`;
    this.el.meterLabel.textContent = label;
  }

  judge(label, key, combo = 0) {
    const j = this.el.judge;
    j.className = `judge ${key}`;
    j.textContent = combo >= 3 ? `${label} x${combo}` : label;
    replay(j, 'show');
  }

  countdown(text) {
    this.el.count.textContent = text;
    replay(this.el.count, 'show');
  }

  banner(text, kind = '') {
    const b = this.el.banner;
    b.className = `banner ${kind} ${text ? 'on' : ''}`;
    b.textContent = text ?? '';
  }

  stars(n, text) {
    const s = this.el.stars;
    s.innerHTML = `<div class="s">${'⭐'.repeat(n)}</div><b></b>`;
    s.querySelector('b').textContent = text;
    replay(s, 'show');
  }
}
