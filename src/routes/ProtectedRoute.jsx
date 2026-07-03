import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';
import Spinner from '../components/shared/Spinner';

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="full-page-center">
        <Spinner label="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
