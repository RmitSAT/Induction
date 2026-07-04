// Egg → Jellyfish avatar evolution: species list, phase/points math, celebration overlay
import { playWaveCrash } from './sfx.js';

export const JELLY_SPECIES = ['Jelly1', 'Jelly2', 'Jelly5', 'Jelly6', 'Jelly7', 'Jelly8'];
export const BADGE_IDS = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06'];
export const JUNIOR_THRESHOLD = 50;
export const MAX_POINTS = 145;

export function jellyImagePath(species, phaseNum) {
  return `assets/${species}.${phaseNum}.png`;
}

// Cache of the member's current species+phase, read by the page-transition overlay
// (js/ocean.js) so it can show the real avatar instead of a generic placeholder.
const CURRENT_CACHE_KEY = 'sat_jelly_current';

export function cacheCurrentJelly(species, imgPhase) {
  try { localStorage.setItem(CURRENT_CACHE_KEY, JSON.stringify({ species, imgPhase })); } catch {}
}

export function getCachedJelly() {
  try { return JSON.parse(localStorage.getItem(CURRENT_CACHE_KEY)); } catch { return null; }
}

export function computeTotalPoints(member, badges) {
  let total = member?.bonusPoints || 0;
  Object.values(badges || {}).forEach(b => { if (b.unlocked) total += b.points || 0; });
  return total;
}

export function isFullyComplete(badges) {
  return BADGE_IDS.every(id => badges?.[id]?.unlocked);
}

// Returns { phase:'egg'|'junior'|'senior', imgPhase:1|3|4, scale:number }
export function getJellyPhase(totalPoints, badges) {
  if (isFullyComplete(badges)) return { phase: 'senior', imgPhase: 4, scale: 2.5 };
  if (totalPoints < JUNIOR_THRESHOLD) return { phase: 'egg', imgPhase: 1, scale: 1 };
  const t = Math.min(1, Math.max(0, (totalPoints - JUNIOR_THRESHOLD) / (MAX_POINTS - JUNIOR_THRESHOLD)));
  return { phase: 'junior', imgPhase: 3, scale: 1 + 1.5 * t };
}

// Which one-time celebration (if any) should fire right now, given flags already stored on member
export function pendingCelebration(member, totalPoints, badges) {
  if (isFullyComplete(badges) && !member.jellySeniorSeen) return 'senior';
  if (!isFullyComplete(badges) && totalPoints >= JUNIOR_THRESHOLD && !member.jellyHatchSeen) return 'hatch';
  return null;
}

const CELEBRATION_META = {
  hatch:  { imgPhase: 2, title: 'Trứng Đã Nở!',        sub: 'Sứa con của bạn đã xuất hiện 🌱' },
  senior: { imgPhase: 4, title: 'Sứa Trưởng Thành! ✨', sub: 'Bạn đã hoàn thành mọi huy hiệu!' },
};

// Full-screen one-time celebration overlay, styled like showBadgeUnlock() in js/sfx.js
export function showJellyCelebration(kind, species) {
  const meta = CELEBRATION_META[kind];
  if (!meta) return;
  playWaveCrash();

  const overlay = document.createElement('div');
  overlay.className = 'jelly-hatch-overlay';

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
      <img src="${jellyImagePath(species, meta.imgPhase)}" alt="">
      <div class="badge-unlock-title">${meta.title}</div>
      <div class="badge-unlock-sub">${meta.sub}</div>
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
