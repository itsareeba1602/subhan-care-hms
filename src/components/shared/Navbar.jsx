import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../constants/roles';
import './Navbar.css';

function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <button className="navbar-menu-btn" onClick={onMenuClick} aria-label="Toggle menu">
        <Menu size={20} />
      </button>

      <div className="navbar-spacer" />

      <div className="navbar-user">
        <div className="navbar-user-info">
          <span className="navbar-user-name">{user?.name}</span>
          <span className="navbar-user-role">{ROLE_LABELS[user?.role]}</span>
        </div>
        <button className="navbar-logout" onClick={logout} aria-label="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
