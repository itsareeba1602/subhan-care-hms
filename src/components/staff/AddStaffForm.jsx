import { useState } from 'react';
import { User, Mail, Phone } from 'lucide-react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { formatPKMobile } from '../../utils/formatters';
import { isValidEmail, isValidPKMobile } from '../../utils/helpers';
import { STAFF_ROLES, SHIFTS, roleLabel } from '../../services/staffService';
import './AddStaffForm.css';

const EMPTY_FORM = {
  fullName: '',
  role: STAFF_ROLES[0],
  mobile: '',
  email: '',
  shiftTiming: SHIFTS[0],
  status: 'active',
};

function AddStaffForm({ initialData, onSubmit, onCancel }) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'mobile' ? formatPKMobile(value) : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required.';

    if (!form.email) next.email = 'Email is required.';
    else if (!isValidEmail(form.email)) next.email = 'Enter a valid email address.';

    if (!form.mobile) next.mobile = 'Mobile number is required.';
    else if (!isValidPKMobile(form.mobile)) next.mobile = 'Enter a valid Pakistani mobile (03XX-XXXXXXX).';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit({ ...form });
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="staff-form" onSubmit={handleSubmit} noValidate>
      <Input
        label="Full Name"
        name="fullName"
        icon={User}
        placeholder="e.g. Sara Malik"
        value={form.fullName}
        onChange={handleChange}
        error={errors.fullName}
        required
      />

      <div className="staff-form-row">
        <div className="staff-form-field">
          <label className="staff-form-label">
            Role <span className="staff-form-required">*</span>
          </label>
          <select name="role" value={form.role} onChange={handleChange} className="staff-form-select">
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>{roleLabel(r)}</option>
            ))}
          </select>
        </div>
        <div className="staff-form-field">
          <label className="staff-form-label">
            Shift Timing <span className="staff-form-required">*</span>
          </label>
          <select name="shiftTiming" value={form.shiftTiming} onChange={handleChange} className="staff-form-select">
            {SHIFTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="staff-form-row">
        <Input
          label="Email"
          name="email"
          type="email"
          icon={Mail}
          placeholder="staff@subhancare.pk"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
        <Input
          label="Mobile Number"
          name="mobile"
          icon={Phone}
          placeholder="0300-1234567"
          value={form.mobile}
          onChange={handleChange}
          error={errors.mobile}
          required
        />
      </div>

      <div className="staff-form-field">
        <label className="staff-form-label">Status</label>
        <select name="status" value={form.status} onChange={handleChange} className="staff-form-select">
          <option value="active">Active</option>
          <option value="on-leave">On Leave</option>
        </select>
      </div>

      {apiError && <p className="staff-form-api-error">{apiError}</p>}

      <div className="staff-form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Staff'}
        </Button>
      </div>
    </form>
  );
}

export default AddStaffForm;
