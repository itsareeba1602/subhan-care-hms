import { Stethoscope, Mail, Phone, GraduationCap, CalendarDays, Clock, BadgeCheck, Wallet } from 'lucide-react';
import Badge from '../shared/Badge';
import { formatCurrency } from '../../utils/formatters';
import './DoctorCard.css';

function DoctorCard({ doctor }) {
  if (!doctor) return null;

  const rows = [
    { icon: GraduationCap, label: 'Qualification', value: doctor.qualification },
    { icon: BadgeCheck, label: 'License Number', value: doctor.licenseNumber },
    { icon: Wallet, label: 'Consultation Fee', value: formatCurrency(doctor.consultationFee) },
    { icon: Mail, label: 'Email', value: doctor.email },
    { icon: Phone, label: 'Mobile', value: doctor.mobile },
    { icon: BadgeCheck, label: 'Experience', value: `${doctor.experienceYears} years` },
    { icon: CalendarDays, label: 'Available Days', value: doctor.availableDays.join(', ') },
    { icon: Clock, label: 'Time Slot', value: doctor.availabilityHours },
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
            <Badge tone={doctor.status === 'active' ? 'secondary' : doctor.status === 'inactive' ? 'danger' : 'primary'}>
              {doctor.status === 'active' ? 'Active' : doctor.status === 'inactive' ? 'Inactive' : 'On Leave'}
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
