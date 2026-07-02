import { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../shared/Button';
import { verifyOtp, requestPasswordReset } from '../../services/authService';
import { ROUTES } from '../../constants/routes';
import './OTPForm.css';

const OTP_LENGTH = 6;

function OTPForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef([]);

  if (!email) {
    return (
      <div className="otp-no-email">
        <p>No email found. Please restart the password reset process.</p>
        <Link to={ROUTES.FORGOT_PASSWORD} className="fp-back-link">
          <ArrowLeft size={15} /> Back to forgot password
        </Link>
      </div>
    );
  }

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    setError('');

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== OTP_LENGTH) {
      setError('Enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp({ email, code });
      navigate(ROUTES.RESET_PASSWORD, { state: { email } });
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await requestPasswordReset(email);
    } catch (err) {
      setError(err.message || 'Could not resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <form className="otp-form" onSubmit={handleSubmit} noValidate>
      <p className="otp-email-note">Code sent to <strong>{email}</strong></p>

      <div className="otp-digits">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`otp-digit-input ${error ? 'otp-digit-input-error' : ''}`}
          />
        ))}
      </div>

      {error && <p className="otp-error">{error}</p>}

      <Button type="submit" fullWidth loading={loading}>
        {loading ? 'Verifying...' : 'Verify Code'}
      </Button>

      <button
        type="button"
        className="otp-resend"
        onClick={handleResend}
        disabled={resending}
      >
        {resending ? 'Resending...' : "Didn't get a code? Resend"}
      </button>
    </form>
  );
}

export default OTPForm;
