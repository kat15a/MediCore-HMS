import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * Wraps a nested <Route> tree so only the listed roles can reach it.
 * An authenticated user with the wrong role is redirected to their own
 * dashboard rather than shown a raw 403 — a logged-in receptionist hitting
 * /admin should land somewhere useful, not a dead end.
 */
export default function RoleRoute({ allowedRoles }) {
  const { role } = useAuth();

  if (!role) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(role)) {
    return <Navigate to={dashboardPathForRole(role)} replace />;
  }

  return <Outlet />;
}

export function dashboardPathForRole(role) {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'DOCTOR':
      return '/doctor/dashboard';
    case 'RECEPTIONIST':
      return '/receptionist/dashboard';
    case 'PATIENT':
      return '/patient/dashboard';
    default:
      return '/login';
  }
}
