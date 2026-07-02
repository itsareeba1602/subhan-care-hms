import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/shared/Input';
import Button from '../../components/shared/Button';
import { resetPassword } from '../../services/authService';
import { isStrongPassword, passwordHint } from '../../utils/helpers';
import { ROUTES } from '../../constants/routes';
import './ResetPasswordPage.css';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!email) {
    return (
      <AuthLayout title="Session expired" subtitle="Please restart the password reset process.">
        <Link to={ROUTES.FORGOT_PASSWORD} className="reset-back-link">
          <ArrowLeft size={15} /> Back to forgot password
        </Link>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="reset-success">
          <CheckCircle2 size={48} className="reset-success-icon" />
          <h2 className="reset-success-title">Password reset!</h2>
          <p className="reset-success-text">
            Your password has been updated successfully. You can now sign in with your new password.
          </p>
          <Button fullWidth onClick={() => navigate(ROUTES.LOGIN)}>
            Go to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.newPassword) next.newPassword = 'New password is required.';
    else if (!isStrongPassword(form.newPassword)) {
      next.newPassword = passwordHint();
    }
    if (form.confirmPassword !== form.newPassword) {
      next.confirmPassword = 'Passwords do not match.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await resetPassword({ email, newPassword: form.newPassword });
      setSuccess(true);
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password you haven't used before.">
      <form className="reset-form" onSubmit={handleSubmit} noValidate>
        <Input
          label="New Password"
          name="newPassword"
          type="password"
          icon={Lock}
          placeholder="Enter new password"
          value={form.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
          hint={!errors.newPassword ? passwordHint() : undefined}
          autoComplete="new-password"
          required
        />
        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          icon={Lock}
          placeholder="Re-enter new password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
        />

        {apiError && <p className="reset-api-error">{apiError}</p>}

        <Button type="submit" fullWidth loading={loading}>
          {loading ? 'Updating...' : 'Reset Password'}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default ResetPasswordPage;
