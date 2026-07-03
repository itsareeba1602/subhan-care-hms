import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasModuleAccess } from '../constants/roles';
import { ROUTES } from '../constants/routes';

// SR-03: "RBAC at both the API and UI layer, denying access to unauthorized
// endpoints regardless of UI restrictions." Sidebar.jsx already hides links
// a role can't use — this component is what actually enforces it if someone
// navigates (or bookmarks/types) the URL directly. Use inside ProtectedRoute,
// e.g. <Route element={<RoleRoute moduleKey="patients" />}>.
function RoleRoute({ moduleKey }) {
  const { user } = useAuth();

  if (!hasModuleAccess(user?.role, moduleKey)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}

export default RoleRoute;
