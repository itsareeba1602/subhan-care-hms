// User roles for the Hospital Management System.
// Matches SRS Section 9 (Role-Permission Matrix) exactly: Admin, Doctor,
// Receptionist, Pharmacist, Billing Staff. There is deliberately no
// "Patient" role here — a patient-facing portal is explicitly listed under
// Future Enhancements (SRS Section 22) and is out of scope for this release.
export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist',
  PHARMACIST: 'pharmacist',
  BILLING_STAFF: 'billing_staff',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.DOCTOR]: 'Doctor',
  [ROLES.RECEPTIONIST]: 'Receptionist',
  [ROLES.PHARMACIST]: 'Pharmacist',
  [ROLES.BILLING_STAFF]: 'Billing Staff',
};

// Where each role lands after login. All roles currently land on the same
// /dashboard route because there is only one Dashboard page built so far —
// Doctor/Pharmacist/Billing-specific dashboards don't exist yet as separate
// screens. What DOES differ per role right now is the dashboard's content
// and the sidebar's visible modules (see ROLE_MODULE_ACCESS below), which is
// driven directly off this table rather than a fake extra route.
export const ROLE_DASHBOARD_ROUTE = {
  [ROLES.ADMIN]: '/dashboard',
  [ROLES.DOCTOR]: '/dashboard',
  [ROLES.RECEPTIONIST]: '/dashboard',
  [ROLES.PHARMACIST]: '/dashboard',
  [ROLES.BILLING_STAFF]: '/dashboard',
};

// Access levels per module, transcribed directly from SRS Section 9
// (Role-Permission Matrix): F = Full, R = Read-only, L = Limited, '—' = none.
// Only modules with an actual page/nav item are listed — Prescriptions,
// Inventory, Medical History, etc. aren't in this map because those pages
// don't exist yet (nothing to gate access to).
export const ROLE_MODULE_ACCESS = {
  patients: {
    [ROLES.ADMIN]: 'F',
    [ROLES.DOCTOR]: 'L',
    [ROLES.RECEPTIONIST]: 'F',
    [ROLES.PHARMACIST]: 'R',
    [ROLES.BILLING_STAFF]: '—',
  },
  doctors: {
    [ROLES.ADMIN]: 'F',
    [ROLES.DOCTOR]: 'R',
    [ROLES.RECEPTIONIST]: 'R',
    [ROLES.PHARMACIST]: '—',
    [ROLES.BILLING_STAFF]: '—',
  },
  appointments: {
    [ROLES.ADMIN]: 'F',
    [ROLES.DOCTOR]: 'R',
    [ROLES.RECEPTIONIST]: 'F',
    [ROLES.PHARMACIST]: '—',
    [ROLES.BILLING_STAFF]: '—',
  },
  billing: {
    [ROLES.ADMIN]: 'F',
    [ROLES.DOCTOR]: '—',
    [ROLES.RECEPTIONIST]: '—',
    [ROLES.PHARMACIST]: '—',
    [ROLES.BILLING_STAFF]: 'F',
  },
  // SRS Section 9 Role-Permission Matrix: Staff Management is Full access
  // for Admin only — every other role has none.
  staff: {
    [ROLES.ADMIN]: 'F',
    [ROLES.DOCTOR]: '—',
    [ROLES.RECEPTIONIST]: '—',
    [ROLES.PHARMACIST]: '—',
    [ROLES.BILLING_STAFF]: '—',
  },
};

export function hasModuleAccess(role, moduleKey) {
  const level = ROLE_MODULE_ACCESS[moduleKey]?.[role];
  return level && level !== '—';
}

// Returns the raw access level ('F' | 'R' | 'L' | undefined) so components
// can tell "can view this module" (hasModuleAccess) apart from "can actually
// add/edit/deactivate records here" (level === 'F'). Needed because some
// roles get read-only or limited access to a module they can still open —
// e.g. Patients: Doctor = 'L', Pharmacist = 'R' — and the UI must not offer
// write actions those roles aren't permitted to use.
export function getModuleAccessLevel(role, moduleKey) {
  return ROLE_MODULE_ACCESS[moduleKey]?.[role];
}
