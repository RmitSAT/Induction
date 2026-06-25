import { auth } from '../../js/firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

export function requireAdminAuth() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, user => {
      if (user) resolve(user);
      else { window.location.href = '/admin/index.html'; reject(); }
    });
  });
}

export async function adminSignOut() {
  await signOut(auth);
  window.location.href = '/admin/index.html';
}
