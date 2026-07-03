import Card from '../../components/shared/Card';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS, hasModuleAccess } from '../../constants/roles';

// What each role is told on arrival. This isn't decorative — it's driven by
// the same ROLE_MODULE_ACCESS table (SRS Section 9) that gates the sidebar,
// so a role's dashboard message and its visible nav items can never
// contradict each other.
const ROLE_FOCUS = {
  admin: 'You have full access across Patients, Doctors, Appointments, and Billing.',
  doctor: 'You have limited (view-focused) access to Patients and read access to your schedule.',
  receptionist: 'You can manage Patients and Appointments end-to-end.',
  pharmacist: 'You have read-only access to Patient records for prescription reference.',
  billing_staff: 'You have full access to Billing. Other modules are outside your role.',
};

function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role;

  const accessibleModules = ['patients', 'doctors', 'appointments', 'billing'].filter((m) =>
    hasModuleAccess(role, m)
  );

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Welcome, {user?.name?.split(' ')[0]} 👋
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20, fontSize: 14 }}>
        Logged in as {ROLE_LABELS[role]}. {ROLE_FOCUS[role] || ''}
      </p>
      <Card>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: accessibleModules.length ? 10 : 0 }}>
          Authentication module is complete — login, forgot password, OTP verification, and
          password reset are all wired up with mock data.
        </p>
        {accessibleModules.length > 0 && (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Modules available to your role: {accessibleModules.join(', ')}.
          </p>
        )}
      </Card>
    </div>
  );
}

export default DashboardPage;
