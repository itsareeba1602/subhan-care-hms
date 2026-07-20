import { describe, it, expect } from 'vitest';
import { ROLES, ROLE_MODULE_ACCESS, hasModuleAccess, getModuleAccessLevel } from '../roles.js';

// SR-03: "RBAC at both the API and UI layer, denying access to unauthorized
// endpoints regardless of UI restrictions." Every RoleRoute gate and every
// Sidebar link visibility decision in the whole app is driven off
// hasModuleAccess/getModuleAccessLevel, which are themselves driven off
// ROLE_MODULE_ACCESS — so a single wrong entry here (a stray 'F' where the
// SRS says '—') silently becomes an access-control hole across every page
// that checks it, which is exactly the kind of mistake worth pinning down
// with a test rather than relying on someone visually re-reading the table.

describe('roles — ROLE_MODULE_ACCESS matrix matches the SRS Role-Permission Matrix', () => {
  it('every module row has an explicit entry for all 5 roles (no silently-missing role)', () => {
    const allRoles = Object.values(ROLES);
    for (const [moduleKey, access] of Object.entries(ROLE_MODULE_ACCESS)) {
      for (const role of allRoles) {
        expect(access, `${moduleKey} is missing an entry for ${role}`).toHaveProperty(role);
      }
    }
  });

  it('Billing Staff has no access to Doctors, Appointments, Staff, Inventory, Prescriptions, or Medical History', () => {
    const denied = ['doctors', 'appointments', 'staff', 'inventory', 'prescriptions', 'medicalHistory'];
    for (const moduleKey of denied) {
      expect(hasModuleAccess(ROLES.BILLING_STAFF, moduleKey)).toBeFalsy();
    }
  });

  it('Billing Staff has Full access to Billing and Read access to Patients', () => {
    expect(getModuleAccessLevel(ROLES.BILLING_STAFF, 'billing')).toBe('F');
    expect(getModuleAccessLevel(ROLES.BILLING_STAFF, 'patients')).toBe('R');
  });

  it('only Admin and Pharmacist can access Inventory', () => {
    expect(hasModuleAccess(ROLES.ADMIN, 'inventory')).toBeTruthy();
    expect(hasModuleAccess(ROLES.PHARMACIST, 'inventory')).toBeTruthy();
    expect(hasModuleAccess(ROLES.DOCTOR, 'inventory')).toBeFalsy();
    expect(hasModuleAccess(ROLES.RECEPTIONIST, 'inventory')).toBeFalsy();
    expect(hasModuleAccess(ROLES.BILLING_STAFF, 'inventory')).toBeFalsy();
  });

  it('Admin has Full access and Billing Staff has Read (financial) access to Reports (FR-09.1, Section 9 Table 5); Doctor, Receptionist, and Pharmacist have none', () => {
    expect(getModuleAccessLevel(ROLES.ADMIN, 'reports')).toBe('F');
    expect(getModuleAccessLevel(ROLES.BILLING_STAFF, 'reports')).toBe('R');
    for (const role of [ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.PHARMACIST]) {
      expect(hasModuleAccess(role, 'reports')).toBeFalsy();
    }
  });

  it('Pharmacist can view and dispense Prescriptions (Limited) but cannot reach Staff, Doctors, or Appointments', () => {
    expect(getModuleAccessLevel(ROLES.PHARMACIST, 'prescriptions')).toBe('L');
    expect(hasModuleAccess(ROLES.PHARMACIST, 'staff')).toBeFalsy();
    expect(hasModuleAccess(ROLES.PHARMACIST, 'doctors')).toBeFalsy();
    expect(hasModuleAccess(ROLES.PHARMACIST, 'appointments')).toBeFalsy();
  });

  it('Doctor has Full access to Medical History and Prescriptions, but only Limited/Read elsewhere', () => {
    expect(getModuleAccessLevel(ROLES.DOCTOR, 'medicalHistory')).toBe('F');
    expect(getModuleAccessLevel(ROLES.DOCTOR, 'prescriptions')).toBe('F');
    expect(getModuleAccessLevel(ROLES.DOCTOR, 'patients')).toBe('L');
    expect(getModuleAccessLevel(ROLES.DOCTOR, 'appointments')).toBe('R');
    expect(hasModuleAccess(ROLES.DOCTOR, 'billing')).toBeFalsy();
    expect(hasModuleAccess(ROLES.DOCTOR, 'inventory')).toBeFalsy();
  });

  it('only Admin can access Staff Management', () => {
    expect(hasModuleAccess(ROLES.ADMIN, 'staff')).toBeTruthy();
    for (const role of [ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.PHARMACIST, ROLES.BILLING_STAFF]) {
      expect(hasModuleAccess(role, 'staff')).toBeFalsy();
    }
  });

  it('Admin has at least some access to every module in the matrix (oversight role)', () => {
    for (const moduleKey of Object.keys(ROLE_MODULE_ACCESS)) {
      expect(hasModuleAccess(ROLES.ADMIN, moduleKey), `Admin has no access to ${moduleKey}`).toBeTruthy();
    }
  });

  it('hasModuleAccess is false for an unknown role or an unknown module (fails closed, not open)', () => {
    expect(hasModuleAccess('not-a-real-role', 'billing')).toBeFalsy();
    expect(hasModuleAccess(ROLES.ADMIN, 'not-a-real-module')).toBeFalsy();
    expect(hasModuleAccess(undefined, 'billing')).toBeFalsy();
  });
});
