import { useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  PackagePlus,
  PackageMinus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Package,
  Settings2,
} from 'lucide-react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import Badge from '../shared/Badge';
import Card from '../shared/Card';
import Table from '../shared/Table';
import Modal from '../shared/Modal';
import Spinner from '../shared/Spinner';
import InventoryForm from './InventoryForm';
import { useInventory } from '../../hooks/useInventory';
import { useToast } from '../../hooks/useToast';
import { getStockStatus, getExpiryStatus, STOCK_STATUS, EXPIRY_STATUS } from '../../services/inventoryService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import './InventoryList.css';

const STOCK_BADGE = {
  [STOCK_STATUS.OUT]: { tone: 'danger', label: 'Out of Stock' },
  [STOCK_STATUS.LOW]: { tone: 'primary', label: 'Low Stock' },
  [STOCK_STATUS.OK]: { tone: 'secondary', label: 'In Stock' },
};

const EXPIRY_BADGE = {
  [EXPIRY_STATUS.EXPIRED]: { tone: 'danger', label: 'Expired' },
  [EXPIRY_STATUS.NEARING]: { tone: 'primary', label: 'Expiring Soon' },
  [EXPIRY_STATUS.OK]: null,
};

function InventoryList() {
  const {
    inventoryItems,
    total,
    pageSize,
    summary,
    loading,
    error,
    search,
    setSearch,
    category,
    setCategory,
    stockFilter,
    setStockFilter,
    page,
    setPage,
    addItem,
    updateItem,
    removeItem,
    adjustStock,
    expiryWindowDays,
    setExpiryWindowDays,
  } = useInventory();

  const [modal, setModal] = useState(null);
  const [restockDelta, setRestockDelta] = useState('');
  const [restockError, setRestockError] = useState('');
  const [windowDraft, setWindowDraft] = useState(expiryWindowDays);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const closeModal = () => {
    setModal(null);
    setRestockDelta('');
    setRestockError('');
  };

  const handleAdd = async (data) => {
    await addItem(data);
    closeModal();
    showToast('Inventory item added.');
  };

  const handleEdit = async (data) => {
    await updateItem(modal.item.id, data);
    closeModal();
    showToast('Inventory item updated.');
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await removeItem(modal.item.id);
      closeModal();
      showToast('Inventory item removed.');
    } catch (err) {
      showToast(err.message || 'Failed to remove item.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    setRestockError('');
    const delta = Number(restockDelta);
    if (!restockDelta || Number.isNaN(delta) || delta === 0) {
      setRestockError('Enter a non-zero quantity.');
      return;
    }
    setBusy(true);
    try {
      await adjustStock(modal.item.id, delta, delta > 0 ? 'restock' : 'correction');
      closeModal();
      showToast(delta > 0 ? 'Stock added successfully.' : 'Stock adjusted successfully.');
    } catch (err) {
      setRestockError(err.message || 'Failed to adjust stock.');
    } finally {
      setBusy(false);
    }
  };

  const handleWindowSave = async () => {
    setBusy(true);
    try {
      await setExpiryWindowDays(windowDraft);
      closeModal();
      showToast(`Expiry alert window set to ${windowDraft} days.`);
    } catch (err) {
      showToast(err.message || 'Failed to update setting.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Item',
      render: (i) => (
        <div>
          <div className="inventory-list-name">{i.name}</div>
          <div className="inventory-list-meta">{i.id} • Batch {i.batchNumber} • {i.category}</div>
        </div>
      ),
    },
    {
      key: 'quantityInStock',
      header: 'Stock',
      render: (i) => {
        const status = getStockStatus(i);
        return (
          <div className="inventory-list-stock-cell">
            <span className="inventory-list-qty">{i.quantityInStock} {i.unit}{i.quantityInStock === 1 ? '' : 's'}</span>
            <Badge tone={STOCK_BADGE[status].tone}>{STOCK_BADGE[status].label}</Badge>
          </div>
        );
      },
    },
    {
      key: 'expiryDate',
      header: 'Expiry',
      render: (i) => {
        const status = getExpiryStatus(i);
        const badge = EXPIRY_BADGE[status];
        return (
          <div className="inventory-list-stock-cell">
            <span>{formatDate(i.expiryDate)}</span>
            {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
          </div>
        );
      },
    },
    { key: 'reorderThreshold', header: 'Reorder At', render: (i) => `${i.reorderThreshold} ${i.unit}s` },
    { key: 'supplierName', header: 'Supplier' },
    { key: 'unitPrice', header: 'Unit Price', render: (i) => formatCurrency(i.unitPrice) },
    {
      key: 'actions',
      header: '',
      render: (i) => (
        <div className="inventory-list-actions">
          <button className="inventory-list-action-btn" onClick={() => setModal({ type: 'restock', item: i })} title="Restock">
            <PackagePlus size={16} />
          </button>
          <button className="inventory-list-action-btn" onClick={() => setModal({ type: 'edit', item: i })} title="Edit item">
            <Pencil size={16} />
          </button>
          <button
            className="inventory-list-action-btn inventory-list-action-btn-danger"
            onClick={() => setModal({ type: 'delete', item: i })}
            disabled={i.quantityInStock > 0}
            title={i.quantityInStock > 0 ? 'Reduce stock to 0 before removing this batch' : 'Remove item'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const alertCount = summary
    ? summary.outOfStockCount + summary.lowStockCount + summary.expiredCount + summary.expiringCount
    : 0;

  return (
    <div className="inventory-list-wrapper">
      {summary && (
        <div className="inventory-summary-grid">
          <Card className="inventory-summary-card">
            <p className="inventory-summary-value">{summary.totalItems}</p>
            <p className="inventory-summary-label">Total Batches</p>
          </Card>
          <Card className="inventory-summary-card">
            <p className="inventory-summary-value inventory-summary-value-danger">{summary.outOfStockCount}</p>
            <p className="inventory-summary-label">Out of Stock</p>
          </Card>
          <Card className="inventory-summary-card">
            <p className="inventory-summary-value inventory-summary-value-warning">{summary.lowStockCount}</p>
            <p className="inventory-summary-label">Low Stock</p>
          </Card>
          <Card className="inventory-summary-card">
            <p className="inventory-summary-value inventory-summary-value-warning">{summary.expiringCount}</p>
            <p className="inventory-summary-label">Expiring Soon</p>
          </Card>
          <Card className="inventory-summary-card">
            <p className="inventory-summary-value inventory-summary-value-danger">{summary.expiredCount}</p>
            <p className="inventory-summary-label">Expired</p>
          </Card>
          <Card className="inventory-summary-card">
            <p className="inventory-summary-value">{formatCurrency(summary.stockValue)}</p>
            <p className="inventory-summary-label">Stock Value</p>
          </Card>
        </div>
      )}

      {alertCount > 0 && (
        <div className="inventory-list-alert-banner">
          <AlertTriangle size={16} />
          {alertCount} item{alertCount > 1 ? 's' : ''} need attention — out of stock, low stock, expired, or expiring within {expiryWindowDays} days.
        </div>
      )}

      <div className="inventory-list-toolbar">
        <div className="inventory-list-search">
          <Input
            name="search"
            icon={Search}
            placeholder="Search by name, batch, ID, or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="inventory-list-filter" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Medicine">Medicine</option>
          <option value="Supply">Supply</option>
        </select>
        <select className="inventory-list-filter" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
          <option value="expiring">Expiring Soon</option>
          <option value="expired">Expired</option>
        </select>
        <Button variant="outline" onClick={() => { setWindowDraft(expiryWindowDays); setModal({ type: 'settings' }); }}>
          <Settings2 size={16} />
        </Button>
        <Button onClick={() => setModal({ type: 'add' })}>
          <Plus size={18} /> Add Item
        </Button>
      </div>

      {error && <p className="inventory-list-error">{error}</p>}

      {loading ? (
        <Spinner label="Loading inventory..." />
      ) : (
        <>
          <Table
            columns={columns}
            data={inventoryItems}
            emptyIcon={Package}
            emptyTitle={search || category || stockFilter ? 'No items match your search' : 'No inventory items yet'}
            emptyMessage={
              search || category || stockFilter
                ? 'Try a different name, batch number, or filter.'
                : 'Add your first medicine or supply batch to get started.'
            }
          />

          {total > 0 && (
            <div className="inventory-list-pagination">
              <span className="inventory-list-pagination-info">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
              </span>
              <div className="inventory-list-pagination-controls">
                <button className="inventory-list-page-btn" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft size={16} />
                </button>
                <span className="inventory-list-page-current">Page {page} of {totalPages}</span>
                <button className="inventory-list-page-btn" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modal?.type === 'add'} onClose={closeModal} title="Add Inventory Item">
        <InventoryForm onSubmit={handleAdd} onCancel={closeModal} />
      </Modal>

      <Modal open={modal?.type === 'edit'} onClose={closeModal} title="Edit Inventory Item">
        {modal?.type === 'edit' && (
          <InventoryForm initialData={modal.item} onSubmit={handleEdit} onCancel={closeModal} />
        )}
      </Modal>

      <Modal
        open={modal?.type === 'restock'}
        onClose={closeModal}
        title="Adjust Stock"
      >
        {modal?.type === 'restock' && (
          <form className="inventory-restock-form" onSubmit={handleRestockSubmit} noValidate>
            <p className="inventory-restock-current">
              <strong>{modal.item.name}</strong> — Batch {modal.item.batchNumber} — currently {modal.item.quantityInStock} {modal.item.unit}(s) in stock.
            </p>
            <Input
              label="Quantity Change"
              name="delta"
              type="number"
              icon={PackageMinus}
              placeholder="e.g. 50 to add stock, -10 to remove"
              value={restockDelta}
              onChange={(e) => setRestockDelta(e.target.value)}
              hint="Positive numbers add stock (new delivery); negative numbers remove it (wastage, correction, return)."
              error={restockError}
            />
            <div className="inventory-form-actions">
              <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button type="submit" loading={busy}>{busy ? 'Saving...' : 'Confirm'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={modal?.type === 'delete'}
        onClose={closeModal}
        title="Remove Inventory Item"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="danger" loading={busy} onClick={handleDelete}>
              {busy ? 'Removing...' : 'Remove'}
            </Button>
          </>
        }
      >
        {modal?.type === 'delete' && (
          <p>
            Remove <strong>{modal.item.name}</strong> (Batch {modal.item.batchNumber})? This only works while its
            stock is at 0 — currently {modal.item.quantityInStock} {modal.item.unit}(s).
          </p>
        )}
      </Modal>

      <Modal
        open={modal?.type === 'settings'}
        onClose={closeModal}
        title="Expiry Alert Settings"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button loading={busy} onClick={handleWindowSave}>{busy ? 'Saving...' : 'Save'}</Button>
          </>
        }
      >
        <Input
          label="Flag items expiring within (days)"
          name="expiryWindowDays"
          type="number"
          min="1"
          value={windowDraft}
          onChange={(e) => setWindowDraft(e.target.value)}
          hint="FR-08.4: default is 30 days. Applies to all items — an expired batch is always flagged regardless of this setting."
        />
      </Modal>
    </div>
  );
}

export default InventoryList;
