import { useState } from 'react';
import { User, Lock, ShieldCheck } from 'lucide-react';
import Card from '../../components/shared/Card';
import Input from '../../components/shared/Input';
import Button from '../../components/shared/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { changePassword } from '../../services/authService';
import { isStrongPassword, passwordHint } from '../../utils/helpers';
import { ROLE_LABELS } from '../../constants/roles';
import './SettingsPage.css';

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

// Personal account settings — every authenticated role reaches this page
// (see AppRoutes.jsx: no RoleRoute gate, unlike every module page). There's
// nothing here to gate: it only ever acts on the signed-in person's own
// account.
function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.currentPassword) next.currentPassword = 'Enter your current password.';
    if (!form.newPassword) next.newPassword = 'New password is required.';
    else if (!isStrongPassword(form.newPassword)) next.newPassword = passwordHint();
    if (form.newPassword && form.currentPassword && form.newPassword === form.currentPassword) {
      next.newPassword = 'New password must be different from your current password.';
    }
    if (form.confirmPassword !== form.newPassword) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await changePassword({
        email: user.email,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm(EMPTY_FORM);
      showToast('Password updated successfully.');
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Manage your account details and password.</p>

      <div className="settings-grid">
        <Card>
          <div className="settings-section-header">
            <User size={18} />
            <h2 className="settings-section-title">Profile</h2>
          </div>
          <div className="settings-profile-row">
            <span className="settings-profile-label">Name</span>
            <span className="settings-profile-value">{user?.name}</span>
          </div>
          <div className="settings-profile-row">
            <span className="settings-profile-label">Email</span>
            <span className="settings-profile-value">{user?.email}</span>
          </div>
          <div className="settings-profile-row">
            <span className="settings-profile-label">Role</span>
            <span className="settings-profile-value">{ROLE_LABELS[user?.role] || user?.role}</span>
          </div>
          <p className="settings-profile-note">
            Profile details are managed by an Administrator via Staff Management. Contact your Admin to update your name or email.
          </p>
        </Card>

        <Card>
          <div className="settings-section-header">
            <Lock size={18} />
            <h2 className="settings-section-title">Change Password</h2>
          </div>
          <form className="settings-form" onSubmit={handleSubmit} noValidate>
            <Input
              label="Current Password"
              name="currentPassword"
              type="password"
              icon={Lock}
              value={form.currentPassword}
              onChange={handleChange}
              error={errors.currentPassword}
              autoComplete="current-password"
              required
            />
            <Input
              label="New Password"
              name="newPassword"
              type="password"
              icon={Lock}
              value={form.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
              hint={!errors.newPassword ? passwordHint() : undefined}
              autoComplete="new-password"
              required
            />
            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              icon={Lock}
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              autoComplete="new-password"
              required
            />
            {apiError && <p className="settings-api-error">{apiError}</p>}
            <Button type="submit" loading={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </Card>

        <Card className="settings-security-card">
          <div className="settings-section-header">
            <ShieldCheck size={18} />
            <h2 className="settings-section-title">Security</h2>
          </div>
          <ul className="settings-security-list">
            <li>Your session automatically signs out after 15 minutes of inactivity.</li>
            <li>Passwords require at least 8 characters, uppercase, lowercase, a number, and a special character.</li>
            <li>Accounts lock for 15 minutes after 5 consecutive failed login attempts.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default SettingsPage;
