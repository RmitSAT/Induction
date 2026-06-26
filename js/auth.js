import { db } from './firebase-config.js';
import { collection, query, where, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const SESSION_KEY = 'sat_member_session';

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setSession(member) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(member));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function requireAuth(redirectTo = 'index.html') {
  const session = getSession();
  if (!session || !session.memberId) {
    window.location.href = redirectTo;
    return null;
  }
  return session;
}

// Lookup member by accessCode (for login)
export async function getMemberByCode(code) {
  const q = query(collection(db, 'members'), where('accessCode', '==', code.toUpperCase().trim()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

// Lookup member by Firestore document ID
export async function getMemberById(memberId) {
  const snap = await getDoc(doc(db, 'members', memberId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// Refresh session from DB and save
export async function refreshSession() {
  const session = getSession();
  if (!session) return null;
  const member = await getMemberById(session.memberId);
  if (!member) return null;
  const updated = { memberId: member.id, accessCode: member.accessCode, name: member.name, photoURL: member.photoURL };
  setSession(updated);
  return member;
}
