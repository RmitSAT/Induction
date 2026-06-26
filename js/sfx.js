// Shared sound effects + badge animation + profile evolution
let _ctx = null;
function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

export function isMuted() { return localStorage.getItem('sat_mute') === '1'; }
export function setMute(v) { localStorage.setItem('sat_mute', v ? '1' : '0'); }
export function toggleMute() { const m = !isMuted(); setMute(m); return m; }

// Ascending pop — correct answer / tile unlock
export function playBubblePop() {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      const t = ctx.currentTime + i * 0.07;
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.start(t); o.stop(t + 0.28);
    });
  } catch {}
}

// Low buzz — wrong answer
export function playWrong() {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(200, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.35);
    g.gain.setValueAtTime(0.14, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    o.start(); o.stop(ctx.currentTime + 0.48);
  } catch {}
}

// Rising chime + noise swoosh — badge unlock
export function playWaveCrash() {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    [440, 660, 880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      const t = ctx.currentTime + i * 0.1;
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.start(t); o.stop(t + 0.58);
    });
    // Noise swoosh layer
    const sr  = ctx.sampleRate;
    const buf = ctx.createBuffer(1, Math.floor(sr * 0.45), sr);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.22;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const gn  = ctx.createGain();
    src.connect(gn); gn.connect(ctx.destination);
    gn.gain.setValueAtTime(0.28, ctx.currentTime);
    gn.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    src.start();
  } catch {}
}

// Full-screen badge unlock overlay with floating bubbles
export function showBadgeUnlock(icon, name) {
  playWaveCrash();
  const overlay = document.createElement('div');
  overlay.className = 'badge-unlock-overlay';

  let bubblesHtml = '';
  for (let i = 0; i < 22; i++) {
    const s = 7 + Math.random() * 22;
    bubblesHtml += `<div class="badge-bubble" style="
      width:${s}px;height:${s}px;
      left:${4 + Math.random() * 92}%;
      bottom:${Math.random() * 25}%;
      animation-duration:${1.4 + Math.random() * 2.2}s;
      animation-delay:${Math.random() * 0.9}s"></div>`;
  }

  overlay.innerHTML = bubblesHtml + `
    <div style="position:relative;z-index:2;text-align:center;padding:0 28px;pointer-events:none">
      <div class="badge-unlock-emoji">${icon}</div>
      <div class="badge-unlock-title">Huy Hiệu Mới Mở Khoá!</div>
      <div class="badge-unlock-sub">${name}</div>
      <p style="color:rgba(173,232,244,0.45);font-size:12px;margin-top:22px;font-family:'Nunito',sans-serif">Chạm để đóng</p>
    </div>`;

  const dismiss = () => {
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 520);
  };
  overlay.addEventListener('click', dismiss);
  document.body.appendChild(overlay);
  setTimeout(dismiss, 3600);
}

// Returns evolution stage info based on total points
export function getEvolutionStage(points) {
  if (points >= 50) return { emoji: '🪼', cls: 'stage-full', label: 'Full Jellyfish', vi: 'Sứa Trọn Vẹn ✨' };
  if (points >= 20) return { emoji: '🪼', cls: 'stage-baby', label: 'Baby Jellyfish', vi: 'Sứa Con 🌱' };
  return { emoji: '🥚', cls: 'stage-egg', label: 'Egg', vi: 'Trứng Sứa 🥚' };
}

// Sync mute button icon
export function syncMuteBtn(btnId) {
  const btn = document.getElementById(btnId);
  if (btn) btn.textContent = isMuted() ? '🔇' : '🔊';
}
