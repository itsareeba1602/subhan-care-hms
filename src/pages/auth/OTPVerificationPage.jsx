import AuthLayout from '../../layouts/AuthLayout';
import OTPForm from '../../components/auth/OTPForm';

function OTPVerificationPage() {
  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent to your email address."
    >
      <OTPForm />
    </AuthLayout>
  );
}

export default OTPVerificationPage;
