// User roles for the Hospital Management System
export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist',
  PHARMACIST: 'pharmacist',
  PATIENT: 'patient',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.DOCTOR]: 'Doctor',
  [ROLES.RECEPTIONIST]: 'Receptionist',
  [ROLES.PHARMACIST]: 'Pharmacist',
  [ROLES.PATIENT]: 'Patient',
};

// Where each role lands after login (role redirect requirement)
export const ROLE_DASHBOARD_ROUTE = {
  [ROLES.ADMIN]: '/dashboard',
  [ROLES.DOCTOR]: '/dashboard',
  [ROLES.RECEPTIONIST]: '/dashboard',
  [ROLES.PHARMACIST]: '/dashboard',
  [ROLES.PATIENT]: '/dashboard',
};
