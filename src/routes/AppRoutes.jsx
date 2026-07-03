import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import OTPVerificationPage from '../pages/auth/OTPVerificationPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

import DashboardLayout from '../layouts/DashboardLayout';
import DashboardPage from '../pages/dashboard/DashboardPage';
import PatientsPage from '../pages/patients/PatientsPage';
import NotFoundPage from '../pages/NotFoundPage';

import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

function AppRoutes() {
  return (
    <Routes>
      {/* Public / Auth routes */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      <Route path={ROUTES.OTP_VERIFICATION} element={<OTPVerificationPage />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          {/* Patients is also role-gated (SR-03) — Billing Staff, for
              example, has no access per SRS Section 9, so typing /patients
              directly must bounce them back, not just hiding the nav link. */}
          <Route element={<RoleRoute moduleKey="patients" />}>
            <Route path={ROUTES.PATIENTS} element={<PatientsPage />} />
          </Route>
          {/* Doctors, Appointments, Billing routes get added here next */}
        </Route>
      </Route>

      <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      {/* Real 404 instead of a silent redirect — a blind catch-all hides
          typos and dead links instead of surfacing them during testing. */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
