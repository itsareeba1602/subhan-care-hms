import { useState } from 'react';
import { Search, Plus, Eye, CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle, Receipt, Printer, FileMinus } from 'lucide-react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import Badge from '../shared/Badge';
import Table from '../shared/Table';
import Modal from '../shared/Modal';
import Spinner from '../shared/Spinner';
import GenerateInvoice from './GenerateInvoice';
import { useBilling } from '../../hooks/useBilling';
import { useToast } from '../../hooks/useToast';
import { PAYMENT_METHODS } from '../../services/billingService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import './InvoiceList.css';

const STATUS_TONE = { paid: 'secondary', unpaid: 'danger', 'partially-paid': 'primary' };
const STATUS_LABEL = { paid: 'Paid', unpaid: 'Unpaid', 'partially-paid': 'Partially Paid' };

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
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    page,
    setPage,
    generateInvoice,
    markInvoicePaid,
    issueCreditNote,
  } = useBilling();

  const [modal, setModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const closeModal = () => {
    setModal(null);
    setPaymentAmount('');
    setCreditAmount('');
    setCreditReason('');
  };

  const handleGenerate = async (data) => {
    await generateInvoice(data);
    closeModal();
    showToast('Invoice generated successfully.');
  };

  const handleMarkPaid = async () => {
    setBusy(true);
    try {
      await markInvoicePaid(modal.invoice.id, paymentMethod, Number(paymentAmount));
      closeModal();
      showToast('Payment recorded.');
    } catch (err) {
      showToast(err.message || 'Failed to record payment.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const openPayModal = (invoice) => {
    setModal({ type: 'pay', invoice });
    setPaymentAmount(String(invoice.balanceDue ?? invoice.total));
  };

  const openCreditModal = (invoice) => {
    setModal({ type: 'credit', invoice });
    const alreadyCredited = (invoice.creditNotes || []).reduce((sum, c) => sum + c.amount, 0);
    setCreditAmount(String(Math.max(0, invoice.total - alreadyCredited)));
  };

  // FR-07.4 / IR-02: a finalized invoice can't be deleted or edited — this
  // is the only correction path, and it stays linked to the original
  // invoice as a permanent, reasoned record rather than altering it.
  const handleIssueCredit = async () => {
    setBusy(true);
    try {
      await issueCreditNote(modal.invoice.id, { reason: creditReason, amount: Number(creditAmount) });
      closeModal();
      showToast('Credit note issued.');
    } catch (err) {
      showToast(err.message || 'Failed to issue credit note.', 'error');
    } finally {
      setBusy(false);
    }
  };

  // FR-07.3: "printable/downloadable PDF receipt." Scopes the browser's
  // native print dialog to just the receipt via a print stylesheet — the
  // person can pick "Save as PDF" as the destination, no extra PDF library
  // needed for a receipt this simple.
  const handlePrintReceipt = () => window.print();

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
    { key: 'total', header: 'Amount', render: (i) => formatCurrency(i.total) },
    {
      key: 'status',
      header: 'Status',
      render: (i) => <Badge tone={STATUS_TONE[i.status]}>{STATUS_LABEL[i.status]}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (i) => (
        <div className="invoice-list-actions">
          <button className="invoice-list-action-btn" onClick={() => setModal({ type: 'view', invoice: i })} title="View receipt">
            <Eye size={16} />
          </button>
          {(i.status === 'unpaid' || i.status === 'partially-paid') && (
            <button className="invoice-list-action-btn" onClick={() => openPayModal(i)} title="Record payment">
              <CheckCircle2 size={16} />
            </button>
          )}
          <button className="invoice-list-action-btn" onClick={() => openCreditModal(i)} title="Issue credit note">
            <FileMinus size={16} />
          </button>
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
          <option value="partially-paid">Partially Paid</option>
        </select>
        <input
          type="date"
          className="invoice-list-date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          title="From date"
        />
        <input
          type="date"
          className="invoice-list-date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          title="To date"
        />
        <Button onClick={() => setModal({ type: 'generate' })}>
          <Plus size={18} /> Generate Invoice
        </Button>
      </div>

      {error && <p className="invoice-list-error">{error}</p>}

      {loading ? (
        <Spinner label="Loading invoices..." />
      ) : (
        <>
          <Table
            columns={columns}
            data={invoices}
            emptyIcon={Receipt}
            emptyTitle={search || status ? 'No invoices match your search' : 'No invoices yet'}
            emptyMessage={
              search || status
                ? 'Try a different patient name, invoice ID, or status.'
                : 'Invoices you generate will show up here.'
            }
          />

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
          <div className="invoice-receipt invoice-receipt-printable">
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
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{formatCurrency(item.qty * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="invoice-receipt-total">
              <span>Total</span>
              <strong>{formatCurrency(modal.invoice.total)}</strong>
            </div>
            {modal.invoice.creditNotes?.length > 0 && (
              <div className="invoice-receipt-credits">
                <p className="invoice-receipt-credits-title">Credit Notes</p>
                {modal.invoice.creditNotes.map((c) => (
                  <div key={c.id} className="invoice-receipt-credit-row">
                    <span>{c.id} — {c.reason}</span>
                    <span>-{formatCurrency(c.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            {modal.invoice.status === 'partially-paid' && (
              <div className="invoice-receipt-balance">
                <span>Paid: {formatCurrency(modal.invoice.amountPaid)}</span>
                <span>Balance Due: {formatCurrency(modal.invoice.balanceDue)}</span>
              </div>
            )}
            <Badge tone={STATUS_TONE[modal.invoice.status]}>
              {modal.invoice.status === 'unpaid' ? 'Unpaid' : `${STATUS_LABEL[modal.invoice.status]} via ${modal.invoice.paymentMethod || '—'}`}
            </Badge>
            <button className="invoice-receipt-print-btn invoice-receipt-no-print" onClick={handlePrintReceipt}>
              <Printer size={15} /> Print / Save as PDF
            </button>
          </div>
        )}
      </Modal>

      <Modal
        open={modal?.type === 'pay'}
        onClose={closeModal}
        title="Record Payment"
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
            <p className="invoice-list-pay-balance">
              Outstanding balance: <strong>{formatCurrency(modal.invoice.balanceDue ?? modal.invoice.total)}</strong>
            </p>
            <label className="invoice-list-pay-label">Amount Received</label>
            <input
              type="number"
              min="1"
              max={modal.invoice.balanceDue ?? modal.invoice.total}
              className="invoice-list-pay-amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
            <p className="invoice-list-pay-hint">
              Enter less than the full balance to record a partial payment — the invoice will be marked{' '}
              <em>Partially Paid</em> with the remainder still outstanding.
            </p>
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

      <Modal
        open={modal?.type === 'credit'}
        onClose={closeModal}
        title="Issue Credit Note"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="danger" loading={busy} onClick={handleIssueCredit}>
              {busy ? 'Issuing...' : 'Issue Credit Note'}
            </Button>
          </>
        }
      >
        {modal?.type === 'credit' && (
          <div className="invoice-list-pay-field">
            <p className="invoice-list-credit-text">
              Finalized invoices can't be deleted or edited directly (IR-02). A credit note reduces{' '}
              <strong>{modal.invoice.id}</strong>'s outstanding balance and stays permanently linked to it for audit purposes — the
              original invoice total and line items are never changed.
            </p>
            <label className="invoice-list-pay-label">Credit Amount</label>
            <input
              type="number"
              min="1"
              max={modal.invoice.total - (modal.invoice.creditNotes || []).reduce((sum, c) => sum + c.amount, 0)}
              className="invoice-list-pay-amount"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
            />
            <label className="invoice-list-pay-label">Reason</label>
            <input
              type="text"
              className="invoice-list-pay-amount"
              placeholder="e.g. Billing correction — duplicate lab test charge"
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default InvoiceList;
