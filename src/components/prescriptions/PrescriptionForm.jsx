import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Button from '../shared/Button';
import './PrescriptionForm.css';

let rowSeq = 0;
function emptyMedicine() {
  rowSeq += 1;
  return { id: `row-${rowSeq}`, name: '', dosage: '', frequency: '', duration: '' };
}

// FR-05.2: a doctor adds one or more medicines to a single prescription,
// each with its own dosage, frequency, and duration.
function PrescriptionForm({ onSubmit, onCancel, saving }) {
  const [medicines, setMedicines] = useState([emptyMedicine()]);
  const [error, setError] = useState('');

  const updateRow = (id, field, value) => {
    setMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const addRow = () => setMedicines((prev) => [...prev, emptyMedicine()]);

  const removeRow = (id) => {
    setMedicines((prev) => (prev.length > 1 ? prev.filter((m) => m.id !== id) : prev));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const incomplete = medicines.some((m) => !m.name.trim() || !m.dosage.trim() || !m.frequency.trim() || !m.duration.trim());
    if (incomplete) {
      setError('Fill in name, dosage, frequency, and duration for every medicine.');
      return;
    }
    try {
      await onSubmit(medicines.map(({ id, ...rest }) => rest));
    } catch (err) {
      setError(err.message || 'Failed to save prescription.');
    }
  };

  return (
    <form className="prescription-form" onSubmit={handleSubmit}>
      <div className="prescription-form-rows">
        {medicines.map((m, i) => (
          <div className="prescription-form-row" key={m.id}>
            <div className="prescription-form-row-header">
              <span className="prescription-form-row-number">Medicine {i + 1}</span>
              {medicines.length > 1 && (
                <button type="button" className="prescription-form-remove" onClick={() => removeRow(m.id)} title="Remove">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <div className="prescription-form-grid">
              <input
                className="prescription-form-input"
                placeholder="Medicine name (e.g. Panadol Extra)"
                value={m.name}
                onChange={(e) => updateRow(m.id, 'name', e.target.value)}
              />
              <input
                className="prescription-form-input"
                placeholder="Dosage (e.g. 500mg)"
                value={m.dosage}
                onChange={(e) => updateRow(m.id, 'dosage', e.target.value)}
              />
              <input
                className="prescription-form-input"
                placeholder="Frequency (e.g. Every 8 hours)"
                value={m.frequency}
                onChange={(e) => updateRow(m.id, 'frequency', e.target.value)}
              />
              <input
                className="prescription-form-input"
                placeholder="Duration (e.g. 5 days)"
                value={m.duration}
                onChange={(e) => updateRow(m.id, 'duration', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="prescription-form-add" onClick={addRow}>
        <Plus size={15} /> Add another medicine
      </button>

      {error && <p className="prescription-form-error">{error}</p>}

      <div className="prescription-form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>
          {saving ? 'Saving...' : 'Save Prescription'}
        </Button>
      </div>
    </form>
  );
}

export default PrescriptionForm;
