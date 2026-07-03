import AppointmentList from '../../components/appointments/AppointmentList';

function AppointmentsPage() {
  return (
    <div>
      <h1 className="page-title">Appointments</h1>
      <p className="page-subtitle">
        Book, reschedule, cancel, and track patient appointments.
      </p>
      <AppointmentList />
    </div>
  );
}

export default AppointmentsPage;
