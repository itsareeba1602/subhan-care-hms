import { ROLES } from '../constants/roles';
import { sleep } from '../utils/helpers';

// MOCK auth service — no backend yet.
// Swap the internals of these functions for real API calls later;
// the function signatures/return shapes are designed to stay the same.

const MOCK_USERS = [
  { email: 'admin@subhancare.pk', password: 'Admin@123', role: ROLES.ADMIN, name: 'Admin User' },
  { email: 'doctor@subhancare.pk', password: 'Doctor@123', role: ROLES.DOCTOR, name: 'Dr. Ahmed Khan' },
  { email: 'reception@subhancare.pk', password: 'Front@123', role: ROLES.RECEPTIONIST, name: 'Sara Malik' },
  { email: 'pharmacist@subhancare.pk', password: 'Pharma@123', role: ROLES.PHARMACIST, name: 'Bilal Yasir' },
  { email: 'billing@subhancare.pk', password: 'Billing@123', role: ROLES.BILLING_STAFF, name: 'Noor ul Sehar' },
];

const SESSION_KEY = 'subhan_care_session';

// SR-11: password reset tokens (OTP) expire after 15 minutes.
const OTP_TTL_MS = 15 * 60 * 1000;
let pendingOtp = null; // { email, code, expiresAt }

// login() persists to localStorage when "remember me" is checked (survives
// browser close) and to sessionStorage otherwise (cleared when the tab
// closes). Both are read by getSession() so the rest of the app doesn't
// need to know which one was used.
export async function login({ email, password, rememberMe = false }) {
  await sleep(600);
  const user = MOCK_USERS.find((u) => u.email === email && u.password === password);
  if (!user) {
    throw new Error('Invalid email or password.');
  }
  const session = { email: user.email, name: user.name, role: user.role, issuedAt: Date.now() };
  const store = rememberMe ? localStorage : sessionStorage;
  store.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function requestPasswordReset(email) {
  await sleep(600);
  const user = MOCK_USERS.find((u) => u.email === email);
  if (!user) {
    throw new Error('No account found with that email.');
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  pendingOtp = { email, code, expiresAt: Date.now() + OTP_TTL_MS };
  // MOCK ONLY: with a real backend this code is emailed/texted and never
  // touches the client. Logging it here would violate SR-09 (no sensitive
  // data in client-side logs) in production — this line must be deleted
  // once a real email/SMS gateway is wired up.
  console.info(`[MOCK - remove before backend integration] OTP for ${email}: ${code}`);
  return { sent: true };
}

export async function verifyOtp({ email, code }) {
  await sleep(500);
  if (!pendingOtp || pendingOtp.email !== email) {
    throw new Error('Invalid or expired OTP.');
  }
  if (Date.now() > pendingOtp.expiresAt) {
    pendingOtp = null;
    throw new Error('This code has expired. Please request a new one.');
  }
  if (pendingOtp.code !== code) {
    throw new Error('Invalid OTP. Please check the code and try again.');
  }
  return { verified: true };
}

export async function resetPassword({ email, newPassword }) {
  await sleep(600);
  const user = MOCK_USERS.find((u) => u.email === email);
  if (!user) {
    throw new Error('No account found with that email.');
  }
  user.password = newPassword;
  pendingOtp = null;
  return { success: true };
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
