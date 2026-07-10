import { CalendarClock, User } from 'lucide-react';
import Card from '../shared/Card';
import Spinner from '../shared/Spinner';
import { formatDate } from '../../utils/formatters';
import './DoctorScheduleWidget.css';

// FR-02.4: "The system shall display a doctor's upcoming appointment list
// on their personal dashboard." Read-only by design — doctors have 'R'
// (own) access to Appointments per the SRS role matrix, so this widget
// only lists what's next, with no reschedule/cancel actions here.
function DoctorScheduleWidget({ appointments, loading, error }) {
  return (
    <Card className="doctor-schedule-widget">
      <div className="doctor-schedule-header">
        <CalendarClock size={18} />
        <h2 className="doctor-schedule-title">Your Upcoming Appointments</h2>
      </div>

      {loading && <Spinner label="Loading your schedule..." />}

      {!loading && error && <p className="doctor-schedule-error">{error}</p>}

      {!loading && !error && appointments.length === 0 && (
        <p className="doctor-schedule-empty">No upcoming appointments scheduled.</p>
      )}

      {!loading && !error && appointments.length > 0 && (
        <ul className="doctor-schedule-list">
          {appointments.map((a) => (
            <li key={a.id} className="doctor-schedule-item">
              <div className="doctor-schedule-item-icon">
                <User size={16} />
              </div>
              <div className="doctor-schedule-item-body">
                <p className="doctor-schedule-patient">{a.patientName}</p>
                <p className="doctor-schedule-meta">
                  {formatDate(a.date)} &middot; {a.timeSlot}
                </p>
                {a.reason && <p className="doctor-schedule-reason">{a.reason}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default DoctorScheduleWidget;
