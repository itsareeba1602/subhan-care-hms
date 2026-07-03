import { useState } from 'react';
import { Search, Plus, Eye, CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import Badge from '../shared/Badge';
import Table from '../shared/Table';
import Modal from '../shared/Modal';
import Spinner from '../shared/Spinner';
import GenerateInvoice from './GenerateInvoice';
import { useBilling } from '../../hooks/useBilling';
import { PAYMENT_METHODS } from '../../services/billingService';
import { formatDate } from '../../utils/formatters';
import './InvoiceList.css';

function InvoiceList() {
  const {
    invoices,
    total,
    pageSize,
    outstanding,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    generateInvoice,
    markInvoicePaid,
  } = useBilling();

  const [modal, setModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const closeModal = () => setModal(null);
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  };

  const handleGenerate = async (data) => {
    await generateInvoice(data);
    closeModal();
    showToast('Invoice generated successfully.');
  };

  const handleMarkPaid = async () => {
    setBusy(true);
    try {
      await markInvoicePaid(modal.invoice.id, paymentMethod);
      closeModal();
      showToast('Invoice marked as paid.');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'patientName',
      header: 'Patient',
      render: (i) => (
        <div>
          <div className="invoice-list-name">{i.patientName}</div>
          <div className="invoice-list-id">{i.id}</div>
        </div>
      ),
    },
    { key: 'date', header: 'Date', render: (i) => formatDate(i.date) },
    { key: 'total', header: 'Amount', render: (i) => `Rs. ${i.total.toLocaleString('en-PK')}` },
    {
      key: 'status',
      header: 'Status',
      render: (i) => (
        <Badge tone={i.status === 'paid' ? 'secondary' : 'danger'}>
          {i.status === 'paid' ? 'Paid' : 'Unpaid'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (i) => (
        <div className="invoice-list-actions">
          <button className="invoice-list-action-btn" onClick={() => setModal({ type: 'view', invoice: i })} title="View receipt">
            <Eye size={16} />
          </button>
          {i.status === 'unpaid' && (
            <button className="invoice-list-action-btn" onClick={() => setModal({ type: 'pay', invoice: i })} title="Mark as paid">
              <CheckCircle2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="invoice-list-wrapper">
      {outstanding.count > 0 && (
        <div className="invoice-list-outstanding-banner">
          <AlertTriangle size={16} />
          {outstanding.count} outstanding invoice{outstanding.count > 1 ? 's' : ''} totaling Rs. {outstanding.amount.toLocaleString('en-PK')}
        </div>
      )}

      <div className="invoice-list-toolbar">
        <div className="invoice-list-search">
          <Input
            name="search"
            icon={Search}
            placeholder="Search by patient or invoice ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="invoice-list-filter" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <Button onClick={() => setModal({ type: 'generate' })}>
          <Plus size={18} /> Generate Invoice
        </Button>
      </div>

      {toast && <div className="invoice-list-toast">{toast}</div>}
      {error && <p className="invoice-list-error">{error}</p>}

      {loading ? (
        <Spinner label="Loading invoices..." />
      ) : (
        <>
          <Table columns={columns} data={invoices} emptyMessage="No invoices found." />

          {total > 0 && (
            <div className="invoice-list-pagination">
              <span className="invoice-list-pagination-info">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
              </span>
              <div className="invoice-list-pagination-controls">
                <button className="invoice-list-page-btn" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft size={16} />
                </button>
                <span className="invoice-list-page-current">Page {page} of {totalPages}</span>
                <button className="invoice-list-page-btn" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modal?.type === 'generate'} onClose={closeModal} title="Generate Invoice">
        <GenerateInvoice onSubmit={handleGenerate} onCancel={closeModal} />
      </Modal>

      <Modal open={modal?.type === 'view'} onClose={closeModal} title="Invoice / Receipt">
        {modal?.type === 'view' && (
          <div className="invoice-receipt">
            <div className="invoice-receipt-header">
              <span>{modal.invoice.id}</span>
              <span>{formatDate(modal.invoice.date)}</span>
            </div>
            <p className="invoice-receipt-patient"><strong>{modal.invoice.patientName}</strong></p>
            <table className="invoice-receipt-table">
              <thead>
                <tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {modal.invoice.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.description}</td>
                    <td>{item.qty}</td>
                    <td>Rs. {item.unitPrice}</td>
                    <td>Rs. {item.qty * item.unitPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="invoice-receipt-total">
              <span>Total</span>
              <strong>Rs. {modal.invoice.total.toLocaleString('en-PK')}</strong>
            </div>
            <Badge tone={modal.invoice.status === 'paid' ? 'secondary' : 'danger'}>
              {modal.invoice.status === 'paid' ? `Paid via ${modal.invoice.paymentMethod}` : 'Unpaid'}
            </Badge>
          </div>
        )}
      </Modal>

      <Modal
        open={modal?.type === 'pay'}
        onClose={closeModal}
        title="Mark Invoice as Paid"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button loading={busy} onClick={handleMarkPaid}>
              {busy ? 'Saving...' : 'Confirm Payment'}
            </Button>
          </>
        }
      >
        {modal?.type === 'pay' && (
          <div className="invoice-list-pay-field">
            <label className="invoice-list-pay-label">Payment Method</label>
            <select
              className="invoice-list-pay-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default InvoiceList;
