import AuthLayout from '../../layouts/AuthLayout';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';

function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your registered email and we'll send you a verification code."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
