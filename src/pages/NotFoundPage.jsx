import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Button from '../components/shared/Button';
import { ROUTES } from '../constants/routes';
import './NotFoundPage.css';

// Deliberately a real 404, not a silent redirect to /dashboard. Redirecting
// unknown URLs away quietly hides genuine routing bugs (typos, dead links,
// stale bookmarks) during dev and QA — better to surface them.
function NotFoundPage() {
  return (
    <div className="notfound-page">
      <Compass size={40} className="notfound-icon" aria-hidden="true" />
      <h1 className="notfound-title">Page not found</h1>
      <p className="notfound-text">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to={ROUTES.DASHBOARD}>
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}

export default NotFoundPage;
