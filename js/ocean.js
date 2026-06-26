/**
 * Ocean immersion theme module
 * Adds: floating sea creatures, wave page transitions, ambient underwater audio,
 * caustic depth layer, bubble popping SFX.
 * Import and call initOceanTheme() once per page.
 */
import { isMuted } from './sfx.js';

// ── Creature definitions ───────────────────────────────────────────────────
const CREATURES = [
  // emoji, movement type, [minSize, maxSize], [minDur, maxDur], spawn weight
  { e:'🪼', t:'bob',    s:[26,46], d:[10,18], w:3 },
  { e:'🐠', t:'swim',   s:[18,30], d:[ 7,12], w:4 },
  { e:'🐟', t:'swim',   s:[15,25], d:[ 6,11], w:4 },
  { e:'🐡', t:'swim',   s:[16,28], d:[ 7,12], w:2 },
  { e:'🦑', t:'swim',   s:[14,24], d:[ 7,11], w:2 },
  { e:'🐙', t:'slow',   s:[18,30], d:[16,26], w:1 },
  { e:'🦀', t:'slow',   s:[14,22], d:[18,28], w:1 },
  { e:'⭐', t:'slow',   s:[12,18], d:[14,22], w:2 },
  { e:'🫧', t:'bubble', s:[14,26], d:[ 2, 5], w:6 },
  { e:'🐚', t:'slow',   s:[12,18], d:[16,22], w:1 },
  { e:'🪸', t:'slow',   s:[14,22], d:[20,30], w:1 },
  { e:'🐬', t:'swim',   s:[22,36], d:[ 6, 9], w:1 },
  { e:'🌊', t:'bubble', s:[18,30], d:[ 3, 6], w:2 },
];

// Weighted random pick
const POOL = CREATURES.flatMap(c => Array(c.w).fill(c));

let _layer = null;      // creature layer div
let _overlay = null;    // wave transition overlay
let _ambCtx = null;
let _ambStarted = false;
let _navigating = false;

// ── Public API ─────────────────────────────────────────────────────────────
export function initOceanTheme() {
  createDepthBg();
  createCreatureLayer();
  createWaveOverlay();
  interceptLinks();
  scheduleCreature();
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

// ── Creature layer ─────────────────────────────────────────────────────────
function createCreatureLayer() {
  if (document.getElementById('ocean-creatures')) return;
  _layer = document.createElement('div');
  _layer.id = 'ocean-creatures';
  document.body.appendChild(_layer);
}

function scheduleCreature() {
  const delay = 2800 + Math.random() * 5000;
  setTimeout(() => {
    if (!document.hidden) spawnCreature();
    scheduleCreature();
  }, delay);
  // Also spawn 2 immediately (staggered) so page feels alive at once
  setTimeout(spawnCreature, 400);
  setTimeout(spawnCreature, 1400);
}

function spawnCreature() {
  if (!_layer) return;
  const C   = POOL[Math.floor(Math.random() * POOL.length)];
  const size = C.s[0] + Math.random() * (C.s[1] - C.s[0]);
  const dur  = C.d[0] + Math.random() * (C.d[1] - C.d[0]);

  const el = document.createElement('div');
  el.className = 'oc-creature';
  el.textContent = C.e;
  el.style.fontSize = size + 'px';

  const vh = window.innerHeight;
  const vw = window.innerWidth;

  if (C.t === 'bubble') {
    // Rise from bottom with a gentle horizontal wobble
    const bx = ((Math.random() - 0.5) * 70).toFixed(1) + 'px';
    const xPct = 5 + Math.random() * 90;
    el.style.cssText += `bottom:0px;left:${xPct}%;--bx:${bx};
      animation:oc-bubble ${dur}s ease-out forwards;`;
    _layer.appendChild(el);
    setTimeout(() => el.remove(), (dur + 0.3) * 1000);
    return;
  }

  // Horizontal swimmers and drifters
  const goRight = Math.random() > 0.45;
  const startX  = goRight ? -(size + 40) : vw + size + 40;
  const endX    = goRight ? vw + size + 40 : -(size + 40);
  // Stay in the middle 60% vertically to avoid header (top ~56px) and nav (bottom ~68px)
  const safeTop  = 70;
  const safeBot  = vh - 80;
  const yPos     = safeTop + Math.random() * (safeBot - safeTop);

  el.style.top  = yPos + 'px';
  el.style.left = '0px';
  _layer.appendChild(el);

  const startMs = performance.now();
  const durMs   = dur * 1000;
  const isBob   = C.t === 'bob';
  const isSlow  = C.t === 'slow';

  function tick(now) {
    const t = Math.min((now - startMs) / durMs, 1);
    const x = startX + (endX - startX) * t;

    // Bob animation: sine wave Y offset
    const bobY = isBob
      ? Math.sin(t * Math.PI * (3 + Math.random() * 0.5)) * 18
      : isSlow
        ? Math.sin(t * Math.PI * 2) * 10
        : Math.sin(t * Math.PI * 5) * 4;

    // Opacity fade in/out
    let op;
    if (t < 0.06)       op = t / 0.06;
    else if (t > 0.94)  op = (1 - t) / 0.06;
    else                op = 0.82;

    // Mirror for left-going creatures
    const scaleX = goRight ? 1 : -1;
    el.style.transform = `translateX(${x}px) translateY(${bobY}px) scaleX(${scaleX})`;
    el.style.opacity   = op;

    if (t < 1) requestAnimationFrame(tick);
    else el.remove();
  }
  requestAnimationFrame(tick);
}

// ── Wave page-transition overlay ───────────────────────────────────────────
function createWaveOverlay() {
  if (document.getElementById('ocean-wave-overlay')) return;
  _overlay = document.createElement('div');
  _overlay.id = 'ocean-wave-overlay';
  _overlay.innerHTML = '<div class="ow-jellyfish">🪼</div>';
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
