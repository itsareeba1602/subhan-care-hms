import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { requestPasswordReset } from '../../services/authService';
import { isValidEmail } from '../../utils/helpers';
import { ROUTES } from '../../constants/routes';
import './ForgotPasswordForm.css';

function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!email) {
      setError('Email is required.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');

    setLoading(true);
    try {
      await requestPasswordReset(email);
      navigate(ROUTES.OTP_VERIFICATION, { state: { email } });
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="fp-form" onSubmit={handleSubmit} noValidate>
      <Input
        label="Email"
        name="email"
        type="email"
        icon={Mail}
        placeholder="you@subhancare.pk"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError('');
        }}
        error={error}
        required
      />

      {apiError && <p className="fp-api-error">{apiError}</p>}

      <Button type="submit" fullWidth loading={loading}>
        {loading ? 'Sending code...' : 'Send Reset Code'}
      </Button>

      <Link to={ROUTES.LOGIN} className="fp-back-link">
        <ArrowLeft size={15} /> Back to login
      </Link>
    </form>
  );
}

export default ForgotPasswordForm;
