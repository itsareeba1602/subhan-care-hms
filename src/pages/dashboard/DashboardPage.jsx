import Card from '../../components/shared/Card';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../constants/roles';

function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Welcome, {user?.name?.split(' ')[0]} 👋
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20, fontSize: 14 }}>
        Logged in as {ROLE_LABELS[user?.role]}. Patient, Doctor, Appointment and Billing modules
        will show up here as they're built out.
      </p>
      <Card>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
          Authentication module is complete — login, forgot password, OTP verification, and
          password reset are all wired up with mock data. Next: Patient Management module.
        </p>
      </Card>
    </div>
  );
}

export default DashboardPage;
