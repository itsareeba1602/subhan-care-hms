import { Pill } from 'lucide-react';
import Badge from '../shared/Badge';
import { formatDateTime } from '../../utils/formatters';
import './PrescriptionCard.css';

// Read-only by design — there is no edit path anywhere in this component,
// which is what makes FR-05.3 ("Pharmacist shall not alter prescribed
// dosage") true structurally rather than by a permission check.
function PrescriptionCard({ prescription, compact = false }) {
  if (!prescription) return null;

  return (
    <div className={`prescription-card ${compact ? 'prescription-card-compact' : ''}`}>
      <div className="prescription-card-header">
        <div className="prescription-card-title">
          <Pill size={15} />
          <span>{prescription.id}</span>
        </div>
        <Badge tone={prescription.status === 'dispensed' ? 'secondary' : 'primary'}>
          {prescription.status === 'dispensed' ? 'Dispensed' : 'Pending'}
        </Badge>
      </div>

      <p className="prescription-card-meta">
        {prescription.doctorName} &middot; {formatDateTime(prescription.createdOn)}
      </p>

      <table className="prescription-card-table">
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {prescription.medicines.map((m, i) => (
            <tr key={i}>
              <td>{m.name}</td>
              <td>{m.dosage}</td>
              <td>{m.frequency}</td>
              <td>{m.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {prescription.status === 'dispensed' && (
        <p className="prescription-card-dispensed">
          Dispensed by {prescription.dispensedBy} on {formatDateTime(prescription.dispensedOn)}
        </p>
      )}
    </div>
  );
}

export default PrescriptionCard;
