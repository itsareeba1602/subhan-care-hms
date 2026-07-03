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
const ATTEMPTS_KEY = 'subhan_care_login_attempts';

// SR-11: password reset tokens (OTP) expire after 15 minutes.
const OTP_TTL_MS = 15 * 60 * 1000;
let pendingOtp = null; // { email, code, expiresAt }

// FR-10.5 / SR-15: lock an account for 15 minutes after 5 consecutive failed
// login attempts. Stored in localStorage (not memory) so the lock actually
// survives a page refresh during testing/demo instead of resetting on F5,
// which would make it trivially bypassable.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function readAttempts() {
  try {
    return JSON.parse(localStorage.getItem(ATTEMPTS_KEY)) || {};
  } catch {
    return {};
  }
}

function writeAttempts(all) {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all));
}

function getLockState(email) {
  const all = readAttempts();
  const entry = all[email];
  if (!entry) return { locked: false, count: 0 };
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    return { locked: true, remainingMs: entry.lockedUntil - Date.now() };
  }
  return { locked: false, count: entry.lockedUntil ? 0 : entry.count || 0 };
}

function recordFailedAttempt(email) {
  const all = readAttempts();
  const entry = all[email] || { count: 0 };
  const count = (entry.lockedUntil ? 0 : entry.count) + 1;
  const next = { count };
  if (count >= MAX_FAILED_ATTEMPTS) {
    next.lockedUntil = Date.now() + LOCKOUT_MS;
    // SR-15: security alert after excessive failed logins. No real alerting
    // channel yet (mock), so this is a console warning as a stand-in.
    console.warn(`[SECURITY] Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts: ${email}`);
  }
  all[email] = next;
  writeAttempts(all);
  return next;
}

function clearAttempts(email) {
  const all = readAttempts();
  delete all[email];
  writeAttempts(all);
}

// login() persists to localStorage when "remember me" is checked (survives
// browser close) and to sessionStorage otherwise (cleared when the tab
// closes). Both are read by getSession() so the rest of the app doesn't
// need to know which one was used.
export async function login({ email, password, rememberMe = false }) {
  await sleep(600);

  const lockState = getLockState(email);
  if (lockState.locked) {
    const minutesLeft = Math.ceil(lockState.remainingMs / 60000);
    throw new Error(
      `Too many failed attempts. This account is locked for ${minutesLeft} more minute${minutesLeft === 1 ? '' : 's'}.`
    );
  }

  const user = MOCK_USERS.find((u) => u.email === email && u.password === password);
  if (!user) {
    const entry = recordFailedAttempt(email);
    if (entry.lockedUntil) {
      throw new Error('Too many failed attempts. This account is now locked for 15 minutes.');
    }
    const remaining = MAX_FAILED_ATTEMPTS - entry.count;
    throw new Error(
      `Invalid email or password. ${remaining} attempt${remaining === 1 ? '' : 's'} left before this account is temporarily locked.`
    );
  }

  clearAttempts(email);
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
