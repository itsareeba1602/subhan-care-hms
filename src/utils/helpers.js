export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPKMobile(value) {
  // Accepts formats like 03001234567 or 0300-1234567
  const digits = value.replace(/\D/g, '');
  return /^03\d{9}$/.test(digits);
}

export function isValidCNIC(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length === 13;
}

export function isStrongPassword(password) {
  // SR-08: min 8 chars, upper + lower case, a number, and a special character
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

export function passwordHint() {
  // Shown next to password fields so the SR-08 rule is visible before submit,
  // not just discovered via an error after the fact.
  return 'At least 8 characters, with uppercase, lowercase, a number, and a special character.';
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
