import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Button from '../shared/Button';
import Spinner from '../shared/Spinner';
import { getPatientOptions, LINE_ITEM_TYPES } from '../../services/billingService';
import './GenerateInvoice.css';

const EMPTY_ITEM = { type: LINE_ITEM_TYPES[0], description: '', qty: 1, unitPrice: 0 };

function GenerateInvoice({ onSubmit, onCancel }) {
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientName, setPatientName] = useState('');
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPatientOptions().then((data) => {
      setPatients(data);
      setLoadingPatients(false);
    });
  }, []);

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const total = items.reduce((sum, i) => sum + Number(i.qty || 0) * Number(i.unitPrice || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setApiError('');

    if (!patientName) return setError('Select a patient.');
    if (items.some((i) => !i.description.trim() || Number(i.qty) <= 0 || Number(i.unitPrice) <= 0)) {
      return setError('Each line item needs a description, quantity, and price.');
    }

    setLoading(true);
    try {
      await onSubmit({
        patientName,
        items: items.map((i) => ({ ...i, qty: Number(i.qty), unitPrice: Number(i.unitPrice) })),
      });
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPatients) return <Spinner label="Loading patients..." />;

  return (
    <form className="generate-invoice-form" onSubmit={handleSubmit} noValidate>
      <div className="generate-invoice-field">
        <label className="generate-invoice-label">
          Patient <span className="generate-invoice-required">*</span>
        </label>
        <select
          className="generate-invoice-select"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
        >
          <option value="">Select patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.fullName}>{p.fullName} ({p.id})</option>
          ))}
        </select>
      </div>

      <div className="generate-invoice-items">
        <label className="generate-invoice-label">Line Items</label>
        {items.map((item, i) => (
          <div className="generate-invoice-item-row" key={i}>
            <select
              className="generate-invoice-item-type"
              value={item.type}
              onChange={(e) => updateItem(i, 'type', e.target.value)}
            >
              {LINE_ITEM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              className="generate-invoice-item-desc"
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateItem(i, 'description', e.target.value)}
            />
            <input
              className="generate-invoice-item-qty"
              type="number"
              min="1"
              placeholder="Qty"
              value={item.qty}
              onChange={(e) => updateItem(i, 'qty', e.target.value)}
            />
            <input
              className="generate-invoice-item-price"
              type="number"
              min="0"
              placeholder="Rs."
              value={item.unitPrice}
              onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
            />
            <button
              type="button"
              className="generate-invoice-item-remove"
              onClick={() => removeItem(i)}
              disabled={items.length === 1}
              title="Remove item"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button type="button" className="generate-invoice-add-item" onClick={addItem}>
          <Plus size={15} /> Add line item
        </button>
      </div>

      <div className="generate-invoice-total">
        <span>Total</span>
        <strong>Rs. {total.toLocaleString('en-PK')}</strong>
      </div>

      {error && <p className="generate-invoice-error">{error}</p>}
      {apiError && <p className="generate-invoice-error">{apiError}</p>}

      <div className="generate-invoice-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {loading ? 'Generating...' : 'Generate Invoice'}
        </Button>
      </div>
    </form>
  );
}

export default GenerateInvoice;
