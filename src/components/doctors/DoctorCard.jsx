import { Stethoscope, Mail, Phone, GraduationCap, CalendarDays, BadgeCheck } from 'lucide-react';
import Badge from '../shared/Badge';
import './DoctorCard.css';

function DoctorCard({ doctor }) {
  if (!doctor) return null;

  const rows = [
    { icon: GraduationCap, label: 'Qualification', value: doctor.qualification },
    { icon: Mail, label: 'Email', value: doctor.email },
    { icon: Phone, label: 'Mobile', value: doctor.mobile },
    { icon: BadgeCheck, label: 'Experience', value: `${doctor.experienceYears} years` },
    { icon: CalendarDays, label: 'Available Days', value: doctor.availableDays.join(', ') },
  ];

  return (
    <div className="doctor-card-detail">
      <div className="doctor-card-header">
        <div className="doctor-card-avatar">
          <Stethoscope size={26} />
        </div>
        <div>
          <h3 className="doctor-card-name">{doctor.fullName}</h3>
          <div className="doctor-card-meta">
            <span className="doctor-card-id">{doctor.id}</span>
            <Badge tone="primary">{doctor.specialization}</Badge>
            <Badge tone={doctor.status === 'active' ? 'secondary' : 'danger'}>
              {doctor.status === 'active' ? 'Active' : 'On Leave'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="doctor-card-rows">
        {rows.map((row) => (
          <div className="doctor-card-row" key={row.label}>
            <row.icon size={16} className="doctor-card-row-icon" />
            <div>
              <span className="doctor-card-row-label">{row.label}</span>
              <p className="doctor-card-row-value">{row.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DoctorCard;
