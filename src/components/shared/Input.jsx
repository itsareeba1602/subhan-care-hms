import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import './Input.css';

function Input({
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  hint,
  icon: Icon,
  required = false,
  disabled = false,
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  return (
    <div className="input-group">
      {label && (
        <label className="input-label" htmlFor={name}>
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <div className={`input-wrapper ${error ? 'input-wrapper-error' : ''}`}>
        {Icon && <Icon className="input-icon" size={18} aria-hidden="true" />}
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`input-field ${Icon ? 'input-field-with-icon' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className="input-toggle-password"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error ? (
        <span className="input-error" id={errorId} role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </span>
      ) : (
        hint && (
          <span className="input-hint" id={hintId}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}

export default Input;
