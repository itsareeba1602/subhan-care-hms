import { useState } from 'react';
import { Package, Hash, Calendar, Layers, Banknote } from 'lucide-react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { CATEGORIES, UNITS, SUPPLIERS } from '../../services/inventoryService';
import './InventoryForm.css';

const EMPTY_FORM = {
  name: '',
  category: CATEGORIES[0],
  batchNumber: '',
  expiryDate: '',
  quantityInStock: '',
  reorderThreshold: '',
  unit: UNITS[0],
  unitPrice: '',
  supplierName: SUPPLIERS[0],
};

// Used for both "Add Item" (a fresh batch) and "Edit Item" (correcting an
// existing batch's details) — same fields either way, per FR-08.1.
function InventoryForm({ initialData, onSubmit, onCancel }) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Item name is required.';
    if (!form.batchNumber.trim()) next.batchNumber = 'Batch number is required.';
    if (!form.expiryDate) next.expiryDate = 'Expiry date is required.';
    if (form.quantityInStock === '' || Number(form.quantityInStock) < 0) {
      next.quantityInStock = 'Quantity must be 0 or more.';
    }
    if (form.reorderThreshold === '' || Number(form.reorderThreshold) < 0) {
      next.reorderThreshold = 'Reorder threshold must be 0 or more.';
    }
    if (form.unitPrice !== '' && Number(form.unitPrice) < 0) {
      next.unitPrice = 'Unit price cannot be negative.';
    }
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
      if (err.fieldErrors) setErrors((prev) => ({ ...prev, ...err.fieldErrors }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="inventory-form" onSubmit={handleSubmit} noValidate>
      <Input
        label="Item Name"
        name="name"
        icon={Package}
        placeholder="e.g. Augmentin 625mg"
        value={form.name}
        onChange={handleChange}
        error={errors.name}
        disabled={isEdit}
        hint={isEdit ? 'Name is fixed once a batch is created — add a new batch instead if this changed.' : undefined}
        required
      />

      <div className="inventory-form-row">
        <div className="inventory-form-field">
          <label className="inventory-form-label">
            Category <span className="inventory-form-required">*</span>
          </label>
          <select name="category" value={form.category} onChange={handleChange} className="inventory-form-select">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <Input
          label="Batch Number"
          name="batchNumber"
          icon={Hash}
          placeholder="e.g. AUG-0102"
          value={form.batchNumber}
          onChange={handleChange}
          error={errors.batchNumber}
          required
        />
      </div>

      <div className="inventory-form-row">
        <Input
          label="Expiry Date"
          name="expiryDate"
          type="date"
          icon={Calendar}
          value={form.expiryDate}
          onChange={handleChange}
          error={errors.expiryDate}
          required
        />
        <div className="inventory-form-field">
          <label className="inventory-form-label">Unit</label>
          <select name="unit" value={form.unit} onChange={handleChange} className="inventory-form-select">
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="inventory-form-row">
        <Input
          label={isEdit ? 'Quantity in Stock' : 'Opening Quantity'}
          name="quantityInStock"
          type="number"
          min="0"
          icon={Layers}
          placeholder="0"
          value={form.quantityInStock}
          onChange={handleChange}
          error={errors.quantityInStock}
          hint={isEdit ? 'For routine stock movements, use Restock instead so the change is tracked.' : undefined}
          required
        />
        <Input
          label="Reorder Threshold"
          name="reorderThreshold"
          type="number"
          min="0"
          icon={Layers}
          placeholder="e.g. 50"
          value={form.reorderThreshold}
          onChange={handleChange}
          error={errors.reorderThreshold}
          hint="Low-stock alert triggers at or below this quantity (FR-08.3)."
          required
        />
      </div>

      <div className="inventory-form-row">
        <div className="inventory-form-field">
          <label className="inventory-form-label">Supplier</label>
          <select name="supplierName" value={form.supplierName} onChange={handleChange} className="inventory-form-select">
            {SUPPLIERS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <Input
          label="Unit Price (Rs.)"
          name="unitPrice"
          type="number"
          min="0"
          icon={Banknote}
          placeholder="0"
          value={form.unitPrice}
          onChange={handleChange}
          error={errors.unitPrice}
        />
      </div>

      {apiError && <p className="inventory-form-api-error">{apiError}</p>}

      <div className="inventory-form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Item'}
        </Button>
      </div>
    </form>
  );
}

export default InventoryForm;
