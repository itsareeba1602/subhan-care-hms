import { User, CreditCard, Phone, Cake, MapPin, Droplet, Calendar } from 'lucide-react';
import Badge from '../shared/Badge';
import { formatDate, calculateAge } from '../../utils/formatters';
import './PatientCard.css';

function PatientCard({ patient }) {
  if (!patient) return null;

  const rows = [
    { icon: CreditCard, label: 'CNIC', value: patient.cnic },
    { icon: Phone, label: 'Mobile', value: patient.mobile },
    { icon: Cake, label: 'Date of Birth', value: `${formatDate(patient.dob)} (${calculateAge(patient.dob)} yrs)` },
    { icon: Droplet, label: 'Blood Group', value: patient.bloodGroup || 'Not specified' },
    { icon: MapPin, label: 'Address', value: patient.address },
    { icon: Calendar, label: 'Registered On', value: formatDate(patient.registeredOn) },
  ];

  return (
    <div className="patient-card-detail">
      <div className="patient-card-header">
        <div className="patient-card-avatar">
          <User size={26} />
        </div>
        <div>
          <h3 className="patient-card-name">{patient.fullName}</h3>
          <div className="patient-card-meta">
            <span className="patient-card-id">{patient.id}</span>
            <Badge tone={patient.gender === 'female' ? 'danger' : 'primary'}>
              {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="patient-card-rows">
        {rows.map((row) => (
          <div className="patient-card-row" key={row.label}>
            <row.icon size={16} className="patient-card-row-icon" />
            <div>
              <span className="patient-card-row-label">{row.label}</span>
              <p className="patient-card-row-value">{row.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PatientCard;
