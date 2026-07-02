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
          <Route path={ROUTES.PATIENTS} element={<PatientsPage />} />
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
