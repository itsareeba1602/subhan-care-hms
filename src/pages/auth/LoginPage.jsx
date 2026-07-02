import AuthLayout from '../../layouts/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';

function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access the Subhan Care Hospital Management System."
    >
      <LoginForm />
    </AuthLayout>
  );
}

export default LoginPage;
