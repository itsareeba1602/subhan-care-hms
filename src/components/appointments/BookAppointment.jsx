import { useState, useEffect } from 'react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import Spinner from '../shared/Spinner';
import { getBookingOptions, TIME_SLOTS } from '../../services/appointmentService';
import './BookAppointment.css';

const TODAY = new Date().toISOString().slice(0, 10);

function BookAppointment({ initialData, onSubmit, onCancel }) {
  const isReschedule = !!initialData;
  const [options, setOptions] = useState({ patients: [], doctors: [] });
  const [loadingOptions, setLoadingOptions] = useState(!isReschedule);

  const [form, setForm] = useState({
    patientName: initialData?.patientName || '',
    doctorName: initialData?.doctorName || '',
    date: initialData?.date || TODAY,
    timeSlot: initialData?.timeSlot || '',
    reason: initialData?.reason || '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isReschedule) return;
    getBookingOptions().then((data) => {
      setOptions(data);
      setLoadingOptions(false);
    });
  }, [isReschedule]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.patientName) next.patientName = 'Select a patient.';
    if (!form.doctorName) next.doctorName = 'Select a doctor.';
    if (!form.date) next.date = 'Select a date.';
    else if (form.date < TODAY) next.date = 'Date cannot be in the past.';
    if (!form.timeSlot) next.timeSlot = 'Select a time slot.';
    if (!isReschedule && !form.reason.trim()) next.reason = 'Reason for visit is required.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      if (isReschedule) {
        await onSubmit({ date: form.date, timeSlot: form.timeSlot });
      } else {
        await onSubmit(form);
      }
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) return <Spinner label="Loading patients and doctors..." />;

  return (
    <form className="book-appointment-form" onSubmit={handleSubmit} noValidate>
      {!isReschedule && (
        <>
          <div className="book-appointment-field">
            <label className="book-appointment-label">
              Patient <span className="book-appointment-required">*</span>
            </label>
            <select name="patientName" value={form.patientName} onChange={handleChange} className="book-appointment-select">
              <option value="">Select patient</option>
              {options.patients.map((p) => (
                <option key={p.id} value={p.fullName}>{p.fullName} ({p.id})</option>
              ))}
            </select>
            {errors.patientName && <span className="book-appointment-error-text">{errors.patientName}</span>}
          </div>

          <div className="book-appointment-field">
            <label className="book-appointment-label">
              Doctor <span className="book-appointment-required">*</span>
            </label>
            <select name="doctorName" value={form.doctorName} onChange={handleChange} className="book-appointment-select">
              <option value="">Select doctor</option>
              {options.doctors.map((d) => (
                <option key={d.id} value={d.fullName}>{d.fullName} — {d.specialization}</option>
              ))}
            </select>
            {errors.doctorName && <span className="book-appointment-error-text">{errors.doctorName}</span>}
          </div>
        </>
      )}

      <div className="book-appointment-row">
        <Input
          label="Date"
          name="date"
          type="date"
          min={TODAY}
          value={form.date}
          onChange={handleChange}
          error={errors.date}
          required
        />
        <div className="book-appointment-field">
          <label className="book-appointment-label">
            Time Slot <span className="book-appointment-required">*</span>
          </label>
          <select name="timeSlot" value={form.timeSlot} onChange={handleChange} className="book-appointment-select">
            <option value="">Select time</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
          {errors.timeSlot && <span className="book-appointment-error-text">{errors.timeSlot}</span>}
        </div>
      </div>

      {!isReschedule && (
        <div className="book-appointment-field">
          <label className="book-appointment-label">
            Reason for Visit <span className="book-appointment-required">*</span>
          </label>
          <textarea
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="e.g. Follow-up checkup, fever, routine visit..."
            className={`book-appointment-textarea ${errors.reason ? 'book-appointment-textarea-error' : ''}`}
            rows={3}
          />
          {errors.reason && <span className="book-appointment-error-text">{errors.reason}</span>}
        </div>
      )}

      {apiError && <p className="book-appointment-api-error">{apiError}</p>}

      <div className="book-appointment-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {loading ? 'Saving...' : isReschedule ? 'Reschedule' : 'Book Appointment'}
        </Button>
      </div>
    </form>
  );
}

export default BookAppointment;
