// ── Replace these values with your Firebase project config ──
// Find them at: Firebase Console → Project Settings → Your apps → Web app
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// Photos are stored as compressed base64 strings in Firestore (no Storage needed).

const firebaseConfig = {
  apiKey:            "AIzaSyC9M-8IZuWvEZURI6fVDxFzE2teeax87xE",
  authDomain:        "sat-induction.firebaseapp.com",
  projectId:         "sat-induction",
  storageBucket:     "sat-induction.firebasestorage.app",
  messagingSenderId: "28674577201",
  appId:             "1:28674577201:web:eab9e51d3477a9df3e1610",
  measurementId:     "G-7BP60WMZT0"
};

const app = initializeApp(firebaseConfig);

export const db   = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence (helps with venue Wi-Fi drops)
enableIndexedDbPersistence(db).catch(() => {});

// ── Photo helper: compress image file/blob → base64 string ──────────────────
// Output is always ≤ ~80KB (200×200px JPEG), well within Firestore's 1MB doc limit.
export function compressToBase64(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);
    img.onload = () => {
      const SIZE = 240; // max width/height in px
      let w = img.width, h = img.height;
      if (w > h) { if (w > SIZE) { h = Math.round(h * SIZE / w); w = SIZE; } }
      else       { if (h > SIZE) { w = Math.round(w * SIZE / h); h = SIZE; } }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
      if (typeof source !== 'string') URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}
