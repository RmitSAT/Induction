/**
 * Ocean immersion theme module
 * Adds: wave page transitions, ambient underwater audio, caustic depth layer,
 * bubble popping SFX.
 * Import and call initOceanTheme() once per page.
 */
import { isMuted } from './sfx.js';
import { getCachedJelly, jellyImagePath } from './jelly.js';

let _overlay = null;    // wave transition overlay
let _ambCtx = null;
let _ambStarted = false;
let _navigating = false;

// ── Public API ─────────────────────────────────────────────────────────────
export function initOceanTheme() {
  createDepthBg();
  createWaveOverlay();
  interceptLinks();
  // Start ambient on first user gesture (browser autoplay policy)
  document.addEventListener('pointerdown', _startAmbient, { once: true });
}

// ── Depth + caustic background ─────────────────────────────────────────────
function createDepthBg() {
  if (document.getElementById('ocean-depth-bg')) return;
  ['ocean-depth-bg','ocean-caustic'].forEach(id => {
    const d = document.createElement('div'); d.id = id;
    document.body.appendChild(d);
  });
}

// ── Wave page-transition overlay ───────────────────────────────────────────
function _currentJellyHtml() {
  const cached = getCachedJelly();
  return cached
    ? `<img class="ow-jellyfish" src="${jellyImagePath(cached.species, cached.imgPhase)}" alt="">`
    : '<div class="ow-jellyfish">🪼</div>';
}

function createWaveOverlay() {
  if (document.getElementById('ocean-wave-overlay')) return;
  _overlay = document.createElement('div');
  _overlay.id = 'ocean-wave-overlay';
  _overlay.innerHTML = _currentJellyHtml();
  document.body.appendChild(_overlay);

  // Arrive animation: start fully covered, then reveal the page
  _overlay.style.transition = 'none';
  void _overlay.offsetWidth;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      _overlay.classList.add('ow-hide');
    });
  });
}

function interceptLinks() {
  document.addEventListener('click', e => {
    if (_navigating) return;
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') ||
        href.startsWith('mailto') || href.startsWith('tel') ||
        a.target === '_blank' || a.download) return;
    // Intercept internal navigation
    e.preventDefault();
    _navigating = true;
    _playTransitionSfx();
    if (_overlay) {
      // Refresh to the member's current jellyfish stage right before showing —
      // it may have changed (or just been cached for the first time) since
      // this page's own initOceanTheme() call created the overlay.
      _overlay.innerHTML = _currentJellyHtml();
      _overlay.classList.remove('ow-hide');
      void _overlay.offsetWidth;
      _overlay.classList.add('ow-show');
      setTimeout(() => { window.location.href = href; }, 490);
    } else {
      window.location.href = href;
    }
  }, true);
}

// ── Audio ──────────────────────────────────────────────────────────────────
function _playTransitionSfx() {
  if (isMuted()) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Whoosh — shaped noise
    const sr  = ctx.sampleRate;
    const len = Math.floor(sr * 0.55);
    const buf = ctx.createBuffer(1, len, sr);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bpf = ctx.createBiquadFilter(); bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(350, ctx.currentTime);
    bpf.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.55);
    bpf.Q.value = 0.7;
    const gn = ctx.createGain();
    src.connect(bpf); bpf.connect(gn); gn.connect(ctx.destination);
    gn.gain.setValueAtTime(0.001, ctx.currentTime);
    gn.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.1);
    gn.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
    src.start();

    // Deep bass thud
    const osc = ctx.createOscillator(), go = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.5);
    osc.connect(go); go.connect(ctx.destination);
    go.gain.setValueAtTime(0.18, ctx.currentTime);
    go.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.start(); osc.stop(ctx.currentTime + 0.52);
  } catch {}
}

function _startAmbient() {
  if (_ambStarted || isMuted()) return;
  _ambStarted = true;
  try {
    _ambCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _ambCtx;

    // ── Deep water drone ──────────────────────────────────────
    const drone = ctx.createOscillator();
    const dFlt  = ctx.createBiquadFilter();
    const dGain = ctx.createGain();
    drone.type = 'sine'; drone.frequency.value = 55;
    dFlt.type = 'lowpass'; dFlt.frequency.value = 160; dFlt.Q.value = 0.4;
    drone.connect(dFlt); dFlt.connect(dGain); dGain.connect(ctx.destination);
    dGain.gain.setValueAtTime(0.001, ctx.currentTime);
    dGain.gain.linearRampToValueAtTime(0.038, ctx.currentTime + 3);
    drone.start();

    // LFO on drone gain — slow pulse like ocean breathing
    const lfo  = ctx.createOscillator();
    const lGn  = ctx.createGain();
    lfo.frequency.value = 0.12; lGn.gain.value = 0.018;
    lfo.connect(lGn); lGn.connect(dGain.gain); lfo.start();

    // ── Second harmonic layer ─────────────────────────────────
    const harm = ctx.createOscillator();
    const hGn  = ctx.createGain();
    harm.type = 'sine'; harm.frequency.value = 82;
    harm.connect(hGn); hGn.connect(ctx.destination);
    hGn.gain.setValueAtTime(0.001, ctx.currentTime);
    hGn.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 4);
    harm.start();

    // ── Occasional ambient bubble pops ─────────────────────────
    _scheduleBubblePop(ctx);
  } catch {}
}

function _scheduleBubblePop(ctx) {
  const delay = 5000 + Math.random() * 9000;
  setTimeout(() => {
    if (!isMuted()) {
      try {
        const freq = 700 + Math.random() * 800;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.055, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
        o.frequency.exponentialRampToValueAtTime(freq * 0.55, ctx.currentTime + 0.15);
        o.start(); o.stop(ctx.currentTime + 0.17);
      } catch {}
    }
    _scheduleBubblePop(ctx);
  }, delay);
}
