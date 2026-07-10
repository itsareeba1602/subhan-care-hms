import { sleep } from '../utils/helpers';
import { ROLES, ROLE_LABELS } from '../constants/roles';
import { revokeSessionsForEmail } from './authService';

// MOCK staff service — backed by localStorage, no backend yet.
// Same { data, total } / plain-object shape as doctorService and
// patientService, so swapping in a real API later is a drop-in change.
//
// Scope note (FR-03.1): Staff Management covers non-clinical staff only —
// Receptionist, Pharmacist, and Billing Staff. Admin and Doctor accounts are
// managed elsewhere (Doctor Management has its own module; there is
// deliberately no "add another Admin" flow in this release).

const STORAGE_KEY = 'subhan_care_staff';

export const STAFF_ROLES = [ROLES.RECEPTIONIST, ROLES.PHARMACIST, ROLES.BILLING_STAFF];

// FR-03.3: shift timing is recorded per staff member for admin reporting.
export const SHIFTS = [
  'Morning (8:00 AM - 4:00 PM)',
  'Evening (4:00 PM - 12:00 AM)',
  'Night (12:00 AM - 8:00 AM)',
];

// Seeded with the same name/email/role as the mock login accounts in
// authService (reception@, pharmacist@, billing@) so the Staff Management
// list and the Login page tell a consistent story in the demo, plus a few
// extra records so search/filter/pagination have something to work with.
const SEED_STAFF = [
  { fullName: 'Sara Malik', role: ROLES.RECEPTIONIST, mobile: '0300-1234567', email: 'reception@subhancare.pk', shiftTiming: SHIFTS[0], status: 'active' },
  { fullName: 'Bilal Yasir', role: ROLES.PHARMACIST, mobile: '0321-2345678', email: 'pharmacist@subhancare.pk', shiftTiming: SHIFTS[0], status: 'active' },
  { fullName: 'Noor ul Sehar', role: ROLES.BILLING_STAFF, mobile: '0333-3456789', email: 'billing@subhancare.pk', shiftTiming: SHIFTS[1], status: 'active' },
  { fullName: 'Hina Aslam', role: ROLES.RECEPTIONIST, mobile: '0345-4567890', email: 'hina.aslam@subhancare.pk', shiftTiming: SHIFTS[1], status: 'active' },
  { fullName: 'Usman Ghani', role: ROLES.PHARMACIST, mobile: '0301-5678901', email: 'usman.ghani@subhancare.pk', shiftTiming: SHIFTS[2], status: 'on-leave' },
  { fullName: 'Ayesha Tariq', role: ROLES.BILLING_STAFF, mobile: '0312-6789012', email: 'ayesha.tariq@subhancare.pk', shiftTiming: SHIFTS[0], status: 'active' },
  { fullName: 'Zeeshan Iqbal', role: ROLES.RECEPTIONIST, mobile: '0334-7890123', email: 'zeeshan.iqbal@subhancare.pk', shiftTiming: SHIFTS[2], status: 'active' },
];

function loadStaff() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  const seeded = SEED_STAFF.map((s, i) => ({ id: `STF-${String(i + 1).padStart(4, '0')}`, ...s }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function persist(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let staff = loadStaff();

function nextId() {
  const nums = staff.map((s) => parseInt(s.id.split('-')[1], 10));
  const max = nums.length ? Math.max(...nums) : 0;
  return `STF-${String(max + 1).padStart(4, '0')}`;
}

export function roleLabel(role) {
  return ROLE_LABELS[role] || role;
}

export async function getStaff({ search = '', role = '', page = 1, pageSize = 8 } = {}) {
  await sleep(400);
  let filtered = staff;

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (s) => s.fullName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.mobile.includes(q)
    );
  }
  if (role) {
    filtered = filtered.filter((s) => s.role === role);
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);
  return { data, total };
}

// FR-03.1: Admin adds a staff member with an assigned role (Receptionist,
// Pharmacist, or Billing Staff).
export async function addStaff(staffData) {
  await sleep(500);
  const duplicate = staff.some((s) => s.email === staffData.email);
  if (duplicate) throw new Error('A staff member with this email already exists.');

  const newStaff = { id: nextId(), ...staffData };
  staff = [newStaff, ...staff];
  persist(staff);
  return newStaff;
}

// FR-03.2: Admin updates a staff member's role and access permissions
// (role reassignment) or other profile/shift details at any time.
export async function updateStaff(id, staffData) {
  await sleep(500);
  staff = staff.map((s) => (s.id === id ? { ...s, ...staffData } : s));
  persist(staff);
  return staff.find((s) => s.id === id);
}

// FR-03.4: deactivating a staff account must immediately invalidate that
// user's active login session(s) — never just a soft flag checked at next
// login. revokeSessionsForEmail (authService) kills the session in this tab
// right away and marks the email so other tabs pick it up on their next
// poll. This is always a deactivation, never a hard delete, so the profile
// and history stay intact for audit purposes.
export async function deactivateStaff(id) {
  await sleep(400);
  const target = staff.find((s) => s.id === id);
  staff = staff.map((s) => (s.id === id ? { ...s, status: 'inactive' } : s));
  persist(staff);
  if (target) {
    revokeSessionsForEmail(target.email);
  }
  return { success: true };
}

// Alias so callers can use either name, matching the doctorService convention.
export const deleteStaff = deactivateStaff;
