import { Users, Stethoscope, CalendarCheck, Receipt } from 'lucide-react';
import Card from '../../components/shared/Card';
import Spinner from '../../components/shared/Spinner';
import DoctorScheduleWidget from '../../components/dashboard/DoctorScheduleWidget';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useDoctorSchedule } from '../../hooks/useDoctorSchedule';
import { ROLE_LABELS, hasModuleAccess } from '../../constants/roles';
import './DashboardPage.css';

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
  const { stats, loading, error } = useDashboardStats(role);
  const isDoctor = role === 'doctor';
  const {
    appointments: myAppointments,
    loading: scheduleLoading,
    error: scheduleError,
  } = useDoctorSchedule(isDoctor ? user?.name : null);

  const cards = [
    {
      key: 'patients',
      icon: Users,
      label: 'Total Patients',
      value: stats?.patientsTotal,
      show: hasModuleAccess(role, 'patients'),
    },
    {
      key: 'doctors',
      icon: Stethoscope,
      label: 'Total Doctors',
      value: stats?.doctorsTotal,
      show: hasModuleAccess(role, 'doctors'),
    },
    {
      key: 'appointments',
      icon: CalendarCheck,
      label: "Today's Appointments",
      value: stats?.appointmentsToday,
      show: hasModuleAccess(role, 'appointments'),
    },
    {
      key: 'billing',
      icon: Receipt,
      label: 'Outstanding Invoices',
      value: stats?.outstandingCount,
      sublabel:
        stats?.outstandingAmount != null
          ? `Rs. ${stats.outstandingAmount.toLocaleString('en-PK')} pending`
          : undefined,
      show: hasModuleAccess(role, 'billing'),
    },
  ].filter((c) => c.show);

  return (
    <div>
      <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
      <p className="page-subtitle">
        Logged in as {ROLE_LABELS[role]}. {ROLE_FOCUS[role] || ''}
      </p>

      {loading && (
        <Card>
          <Spinner label="Loading your dashboard..." />
        </Card>
      )}

      {!loading && error && (
        <Card>
          <p className="dashboard-error-text">{error}</p>
        </Card>
      )}

      {!loading && !error && (
        <div className="dashboard-stat-grid">
          {cards.length === 0 ? (
            <Card>
              <p className="dashboard-summary-text">
                No modules are assigned to your role yet. Contact an Admin if this looks wrong.
              </p>
            </Card>
          ) : (
            cards.map((c) => (
              <Card key={c.key} className="dashboard-stat-card">
                <div className="dashboard-stat-icon">
                  <c.icon size={20} />
                </div>
                <div>
                  <p className="dashboard-stat-value">{c.value ?? '—'}</p>
                  <p className="dashboard-stat-label">{c.label}</p>
                  {c.sublabel && <p className="dashboard-stat-sublabel">{c.sublabel}</p>}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {isDoctor && (
        <DoctorScheduleWidget appointments={myAppointments} loading={scheduleLoading} error={scheduleError} />
      )}
    </div>
  );
}

export default DashboardPage;
