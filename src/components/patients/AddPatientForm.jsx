import { useState } from 'react';
import { User, CreditCard, Phone, UserCheck } from 'lucide-react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { formatCNIC, formatPKMobile } from '../../utils/formatters';
import { isValidCNIC, isValidPKMobile } from '../../utils/helpers';
import './AddPatientForm.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const EMPTY_FORM = {
  fullName: '',
  cnic: '',
  mobile: '',
  gender: 'male',
  dob: '',
  bloodGroup: '',
  address: '',
  emergencyContact: '',
};

function AddPatientForm({ initialData, onSubmit, onCancel }) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;
    if (name === 'cnic') nextValue = formatCNIC(value);
    if (name === 'mobile' || name === 'emergencyContact') nextValue = formatPKMobile(value);

    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required.';

    if (!form.cnic) next.cnic = 'CNIC is required.';
    else if (!isValidCNIC(form.cnic)) next.cnic = 'CNIC must be 13 digits (XXXXX-XXXXXXX-X).';

    if (!form.mobile) next.mobile = 'Mobile number is required.';
    else if (!isValidPKMobile(form.mobile)) next.mobile = 'Enter a valid Pakistani mobile (03XX-XXXXXXX).';

    if (!form.emergencyContact) next.emergencyContact = 'Emergency contact is required.';
    else if (!isValidPKMobile(form.emergencyContact)) next.emergencyContact = 'Enter a valid Pakistani mobile (03XX-XXXXXXX).';

    if (!form.dob) next.dob = 'Date of birth is required.';
    else if (new Date(form.dob) > new Date()) next.dob = 'Date of birth cannot be in the future.';

    if (!form.address.trim()) next.address = 'Address is required.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="patient-form" onSubmit={handleSubmit} noValidate>
      <Input
        label="Full Name"
        name="fullName"
        icon={User}
        placeholder="e.g. Muhammad Usman"
        value={form.fullName}
        onChange={handleChange}
        error={errors.fullName}
        required
      />

      <div className="patient-form-row">
        <Input
          label="CNIC"
          name="cnic"
          icon={CreditCard}
          placeholder="35202-1234567-1"
          value={form.cnic}
          onChange={handleChange}
          error={errors.cnic}
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

      <div className="patient-form-row">
        <div className="patient-form-field">
          <label className="patient-form-label">
            Gender <span className="patient-form-required">*</span>
          </label>
          <select name="gender" value={form.gender} onChange={handleChange} className="patient-form-select">
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="patient-form-field">
          <label className="patient-form-label">Blood Group</label>
          <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="patient-form-select">
            <option value="">Select</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label="Date of Birth"
        name="dob"
        type="date"
        value={form.dob}
        onChange={handleChange}
        error={errors.dob}
        required
      />

      <div className="patient-form-field">
        <label className="patient-form-label">
          Address <span className="patient-form-required">*</span>
        </label>
        <textarea
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="House / Street / Area, City"
          className={`patient-form-textarea ${errors.address ? 'patient-form-textarea-error' : ''}`}
          rows={3}
        />
        {errors.address && <span className="patient-form-error-text">{errors.address}</span>}
      </div>

      <Input
        label="Emergency Contact"
        name="emergencyContact"
        icon={UserCheck}
        placeholder="0300-1234567"
        value={form.emergencyContact}
        onChange={handleChange}
        error={errors.emergencyContact}
        required
      />

      {apiError && <p className="patient-form-api-error">{apiError}</p>}

      <div className="patient-form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Patient'}
        </Button>
      </div>
    </form>
  );
}

export default AddPatientForm;
