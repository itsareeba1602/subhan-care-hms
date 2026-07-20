import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Button from '../components/shared/Button';
import { ROUTES } from '../constants/routes';
import './NotFoundPage.css';

// SR-03: RBAC must deny access at the UI layer, not just hide the nav link.
// RoleRoute previously handled this by silently redirecting to /dashboard —
// technically safe (nothing unauthorized was ever rendered), but indistinguishable
// from a bug to the person hitting it. A real 403 explains what happened
// instead of leaving them wondering why the page they typed/bookmarked
// just bounced them elsewhere.
function ForbiddenPage() {
  return (
    <div className="notfound-page">
      <ShieldAlert size={40} className="notfound-icon" aria-hidden="true" />
      <h1 className="notfound-title">Access denied</h1>
      <p className="notfound-text">
        Your account role doesn't have permission to view this page. If you think this is a mistake, contact your administrator.
      </p>
      <Link to={ROUTES.DASHBOARD}>
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}

export default ForbiddenPage;
