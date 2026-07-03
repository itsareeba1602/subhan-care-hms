import Card from '../../components/shared/Card';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS, hasModuleAccess } from '../../constants/roles';
import './DashboardPage.css';

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
      <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
      <p className="page-subtitle">
        Logged in as {ROLE_LABELS[role]}. {ROLE_FOCUS[role] || ''}
      </p>
      <Card>
        <p className="dashboard-summary-text">
          Authentication module is complete — login, forgot password, OTP verification, and
          password reset are all wired up with mock data.
        </p>
        {accessibleModules.length > 0 && (
          <p className="dashboard-modules-text">
            Modules available to your role: {accessibleModules.join(', ')}.
          </p>
        )}
      </Card>
    </div>
  );
}

export default DashboardPage;
