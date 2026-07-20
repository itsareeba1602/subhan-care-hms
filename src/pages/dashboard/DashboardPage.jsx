import { Users, Stethoscope, CalendarCheck, Receipt, Package, Pill } from 'lucide-react';
import Card from '../../components/shared/Card';
import Spinner from '../../components/shared/Spinner';
import DoctorScheduleWidget from '../../components/dashboard/DoctorScheduleWidget';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useDoctorSchedule } from '../../hooks/useDoctorSchedule';
import { ROLE_LABELS, hasModuleAccess } from '../../constants/roles';
import './DashboardPage.css';

// Kept in sync with ROLE_MODULE_ACCESS (constants/roles.js) — this is only
// ever a one-line orientation summary, the actual enforcement lives there.
const ROLE_FOCUS = {
  admin: 'You have full access across every module, including Inventory and Prescriptions oversight.',
  doctor: 'You manage your own appointments and patients\u2019 medical history, and write prescriptions during consultations.',
  receptionist: 'You can manage Patients and Appointments end-to-end.',
  pharmacist: 'You dispense prescriptions and have full control over medicine and supply Inventory.',
  billing_staff: 'You have full access to Billing, with read access to Patient records for invoicing.',
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
    {
      key: 'prescriptions',
      icon: Pill,
      label: 'Pending Prescriptions',
      value: stats?.pendingPrescriptions,
      show: role === 'admin' || role === 'pharmacist',
    },
    {
      key: 'inventory',
      icon: Package,
      label: 'Inventory Alerts',
      value: stats?.inventoryAlertCount,
      sublabel: 'Low stock, out of stock, or expiring soon',
      show: hasModuleAccess(role, 'inventory'),
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
