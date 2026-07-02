import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { useAuth } from '../../hooks/useAuth';
import { isValidEmail } from '../../utils/helpers';
import { ROUTES } from '../../constants/routes';
import { ROLE_DASHBOARD_ROUTE } from '../../constants/roles';
import './LoginForm.css';

function LoginForm() {
  const navigate = useNavigate();
  const { login, sessionExpired, clearSessionExpired } = useAuth();

  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.email) next.email = 'Email is required.';
    else if (!isValidEmail(form.email)) next.email = 'Enter a valid email address.';

    if (!form.password) next.password = 'Password is required.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      // API placeholder: authService.login() currently mocked, swap for real endpoint later.
      const session = await login({
        email: form.email,
        password: form.password,
        rememberMe: form.rememberMe,
      });
      navigate(ROLE_DASHBOARD_ROUTE[session.role] || ROUTES.DASHBOARD);
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      {sessionExpired && (
        <p className="login-session-expired" role="alert">
          You were signed out after 15 minutes of inactivity. Please sign in again.
        </p>
      )}
      <Input
        label="Email"
        name="email"
        type="email"
        icon={Mail}
        placeholder="you@subhancare.pk"
        value={form.email}
        onChange={handleChange}
        error={errors.email}
        autoComplete="email"
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        icon={Lock}
        placeholder="Enter your password"
        value={form.password}
        onChange={(e) => {
          handleChange(e);
          if (sessionExpired) clearSessionExpired();
        }}
        error={errors.password}
        autoComplete="current-password"
        required
      />

      <div className="login-form-row">
        <label className="login-remember">
          <input
            type="checkbox"
            name="rememberMe"
            checked={form.rememberMe}
            onChange={handleChange}
          />
          Remember me
        </label>
        <Link to={ROUTES.FORGOT_PASSWORD} className="login-forgot-link">
          Forgot password?
        </Link>
      </div>

      {apiError && <p className="login-api-error">{apiError}</p>}

      <Button type="submit" fullWidth loading={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}

export default LoginForm;
