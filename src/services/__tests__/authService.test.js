import { describe, it, expect, beforeEach, vi } from 'vitest';

async function freshAuthService() {
  vi.resetModules();
  localStorage.clear();
  sessionStorage.clear();
  return import('../authService.js');
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.resetModules();
});

describe('authService — changePassword (self-service, requires current password)', () => {
  it('succeeds with the correct current password and allows logging in with the new one', async () => {
    const svc = await freshAuthService();
    await svc.changePassword({
      email: 'admin@subhancare.pk',
      currentPassword: 'Admin@123',
      newPassword: 'NewPass@456',
    });

    // The old password must no longer work...
    await expect(
      svc.login({ email: 'admin@subhancare.pk', password: 'Admin@123' })
    ).rejects.toThrow();

    // ...and the new one must.
    const session = await svc.login({ email: 'admin@subhancare.pk', password: 'NewPass@456' });
    expect(session.email).toBe('admin@subhancare.pk');
  });

  it('rejects the change when the current password is wrong', async () => {
    const svc = await freshAuthService();
    await expect(
      svc.changePassword({
        email: 'admin@subhancare.pk',
        currentPassword: 'WrongPassword1!',
        newPassword: 'NewPass@456',
      })
    ).rejects.toThrow(/current password is incorrect/i);
  });

  it('does not change the password at all when the current password is wrong', async () => {
    const svc = await freshAuthService();
    await expect(
      svc.changePassword({
        email: 'admin@subhancare.pk',
        currentPassword: 'WrongPassword1!',
        newPassword: 'NewPass@456',
      })
    ).rejects.toThrow();

    // Original password must still work — the failed attempt must not have
    // partially applied the change.
    const session = await svc.login({ email: 'admin@subhancare.pk', password: 'Admin@123' });
    expect(session.email).toBe('admin@subhancare.pk');
  });

  it('rejects an unknown account', async () => {
    const svc = await freshAuthService();
    await expect(
      svc.changePassword({
        email: 'nobody@subhancare.pk',
        currentPassword: 'whatever',
        newPassword: 'NewPass@456',
      })
    ).rejects.toThrow(/no account found/i);
  });
});
