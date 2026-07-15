import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Stethoscope, CalendarCheck, Receipt, HeartPulse, UserCog, FileClock, Pill, Package } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { hasModuleAccess } from '../../constants/roles';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

// moduleKey ties each nav item to a row in ROLE_MODULE_ACCESS (SRS Section 9).
// Items with no moduleKey (Dashboard) are visible to every authenticated role.
const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.PATIENTS, label: 'Patients', icon: Users, moduleKey: 'patients' },
  { to: ROUTES.DOCTORS, label: 'Doctors', icon: Stethoscope, moduleKey: 'doctors' },
  { to: ROUTES.APPOINTMENTS, label: 'Appointments', icon: CalendarCheck, moduleKey: 'appointments' },
  { to: ROUTES.MEDICAL_HISTORY, label: 'Medical History', icon: FileClock, moduleKey: 'medicalHistory' },
  { to: ROUTES.PRESCRIPTIONS, label: 'Prescriptions', icon: Pill, moduleKey: 'prescriptions' },
  { to: ROUTES.BILLING, label: 'Billing', icon: Receipt, moduleKey: 'billing' },
  { to: ROUTES.INVENTORY, label: 'Inventory', icon: Package, moduleKey: 'inventory' },
  { to: ROUTES.STAFF, label: 'Staff', icon: UserCog, moduleKey: 'staff' },
];

function Sidebar() {
  const { user } = useAuth();
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.moduleKey || hasModuleAccess(user?.role, item.moduleKey)
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <HeartPulse size={20} />
        </div>
        <span className="sidebar-brand-name">Subhan Care</span>
      </div>

      <nav className="sidebar-nav">
        {visibleItems.map((item) =>
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
