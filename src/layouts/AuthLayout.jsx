import { HeartPulse } from 'lucide-react';
import './AuthLayout.css';

function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <HeartPulse size={22} />
          </div>
          <span className="auth-brand-name">Subhan Care</span>
        </div>
        {title && <h1 className="auth-title">{title}</h1>}
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
