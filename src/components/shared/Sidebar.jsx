import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Stethoscope, CalendarCheck, Receipt, HeartPulse } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.PATIENTS, label: 'Patients', icon: Users },
  { to: ROUTES.DOCTORS, label: 'Doctors', icon: Stethoscope, comingSoon: true },
  { to: ROUTES.APPOINTMENTS, label: 'Appointments', icon: CalendarCheck, comingSoon: true },
  { to: ROUTES.BILLING, label: 'Billing', icon: Receipt, comingSoon: true },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <HeartPulse size={20} />
        </div>
        <span className="sidebar-brand-name">Subhan Care</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) =>
          item.comingSoon ? (
            <span key={item.label} className="sidebar-link sidebar-link-disabled">
              <item.icon size={18} />
              {item.label}
              <span className="sidebar-soon-badge">Soon</span>
            </span>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          )
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
