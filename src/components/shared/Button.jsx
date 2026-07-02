import { Loader2 } from 'lucide-react';
import './Button.css';

const VARIANT_CLASS = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  danger: 'btn btn-danger',
  outline: 'btn btn-outline',
  ghost: 'btn btn-ghost',
};

function Button({
  children,
  variant = 'primary',
  type = 'button',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  ...rest
}) {
  const className = `${VARIANT_CLASS[variant] || VARIANT_CLASS.primary} ${
    fullWidth ? 'btn-full' : ''
  }`;

  return (
    <button
      type={type}
      className={className}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading && <Loader2 className="btn-spinner" size={18} />}
      {children}
    </button>
  );
}

export default Button;
