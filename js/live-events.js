/**
 * Live Event listener — subscribe to config/liveEvent in Firestore.
 * Ignores events older than EVENT_TTL_MS so stale docs don't re-fire on page load.
 *
 * Usage:
 *   import { startLiveEventListener } from './live-events.js';
 *   startLiveEventListener((type, payload) => { ... });
 */
import { db } from './firebase-config.js';
import { doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const EVENT_TTL_MS = 8000;

export function startLiveEventListener(callback) {
  return onSnapshot(doc(db, 'config', 'liveEvent'), snap => {
    if (!snap.exists()) return;
    const data = snap.data();
    if (!data || !data.type) return;
    const age = Date.now() - (data.triggeredAt?.toMillis?.() ?? 0);
    if (age > EVENT_TTL_MS) return; // stale — skip
    callback(data.type, data.payload || {});
  });
}
