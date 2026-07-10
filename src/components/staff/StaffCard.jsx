import { UserCog, Mail, Phone, Clock, BadgeCheck } from 'lucide-react';
import Badge from '../shared/Badge';
import { roleLabel } from '../../services/staffService';
import './StaffCard.css';

function StaffCard({ staff }) {
  if (!staff) return null;

  const rows = [
    { icon: Mail, label: 'Email', value: staff.email },
    { icon: Phone, label: 'Mobile', value: staff.mobile },
    { icon: Clock, label: 'Shift Timing', value: staff.shiftTiming },
    { icon: BadgeCheck, label: 'Staff ID', value: staff.id },
  ];

  return (
    <div className="staff-card-detail">
      <div className="staff-card-header">
        <div className="staff-card-avatar">
          <UserCog size={26} />
        </div>
        <div>
          <h3 className="staff-card-name">{staff.fullName}</h3>
          <div className="staff-card-meta">
            <span className="staff-card-id">{staff.id}</span>
            <Badge tone="primary">{roleLabel(staff.role)}</Badge>
            <Badge tone={staff.status === 'active' ? 'secondary' : staff.status === 'inactive' ? 'danger' : 'primary'}>
              {staff.status === 'active' ? 'Active' : staff.status === 'inactive' ? 'Inactive' : 'On Leave'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="staff-card-rows">
        {rows.map((row) => (
          <div className="staff-card-row" key={row.label}>
            <row.icon size={16} className="staff-card-row-icon" />
            <div>
              <span className="staff-card-row-label">{row.label}</span>
              <p className="staff-card-row-value">{row.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StaffCard;
