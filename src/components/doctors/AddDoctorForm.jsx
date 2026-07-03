import { useState } from 'react';
import { User, Mail, Phone } from 'lucide-react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { formatPKMobile } from '../../utils/formatters';
import { isValidEmail, isValidPKMobile } from '../../utils/helpers';
import { SPECIALIZATIONS, WEEKDAYS } from '../../services/doctorService';
import './AddDoctorForm.css';

const EMPTY_FORM = {
  fullName: '',
  specialization: SPECIALIZATIONS[0],
  qualification: '',
  mobile: '',
  email: '',
  experienceYears: '',
  availableDays: [],
  status: 'active',
};

function AddDoctorForm({ initialData, onSubmit, onCancel }) {
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

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required.';
    if (!form.qualification.trim()) next.qualification = 'Qualification is required.';

    if (!form.email) next.email = 'Email is required.';
    else if (!isValidEmail(form.email)) next.email = 'Enter a valid email address.';

    if (!form.mobile) next.mobile = 'Mobile number is required.';
    else if (!isValidPKMobile(form.mobile)) next.mobile = 'Enter a valid Pakistani mobile (03XX-XXXXXXX).';

    if (!form.experienceYears && form.experienceYears !== 0) next.experienceYears = 'Experience is required.';

    if (form.availableDays.length === 0) next.availableDays = 'Select at least one available day.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit({ ...form, experienceYears: Number(form.experienceYears) });
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="doctor-form" onSubmit={handleSubmit} noValidate>
      <Input
        label="Full Name"
        name="fullName"
        icon={User}
        placeholder="e.g. Dr. Imran Sheikh"
        value={form.fullName}
        onChange={handleChange}
        error={errors.fullName}
        required
      />

      <div className="doctor-form-row">
        <div className="doctor-form-field">
          <label className="doctor-form-label">
            Specialization <span className="doctor-form-required">*</span>
          </label>
          <select name="specialization" value={form.specialization} onChange={handleChange} className="doctor-form-select">
            {SPECIALIZATIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <Input
          label="Qualification"
          name="qualification"
          placeholder="e.g. MBBS, FCPS"
          value={form.qualification}
          onChange={handleChange}
          error={errors.qualification}
          required
        />
      </div>

      <div className="doctor-form-row">
        <Input
          label="Email"
          name="email"
          type="email"
          icon={Mail}
          placeholder="doctor@subhancare.pk"
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

      <div className="doctor-form-row">
        <Input
          label="Experience (years)"
          name="experienceYears"
          type="number"
          min="0"
          value={form.experienceYears}
          onChange={handleChange}
          error={errors.experienceYears}
          required
        />
        <div className="doctor-form-field">
          <label className="doctor-form-label">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className="doctor-form-select">
            <option value="active">Active</option>
            <option value="on-leave">On Leave</option>
          </select>
        </div>
      </div>

      <div className="doctor-form-field">
        <label className="doctor-form-label">
          Available Days <span className="doctor-form-required">*</span>
        </label>
        <div className="doctor-form-days">
          {WEEKDAYS.map((day) => (
            <button
              type="button"
              key={day}
              className={`doctor-form-day-chip ${form.availableDays.includes(day) ? 'doctor-form-day-chip-active' : ''}`}
              onClick={() => toggleDay(day)}
            >
              {day}
            </button>
          ))}
        </div>
        {errors.availableDays && <span className="doctor-form-error-text">{errors.availableDays}</span>}
      </div>

      {apiError && <p className="doctor-form-api-error">{apiError}</p>}

      <div className="doctor-form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Doctor'}
        </Button>
      </div>
    </form>
  );
}

export default AddDoctorForm;
