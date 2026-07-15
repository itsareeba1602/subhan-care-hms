import { useState } from 'react';
import { Search, Eye, CheckCircle2, ChevronLeft, ChevronRight, Pill } from 'lucide-react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import Badge from '../shared/Badge';
import Table from '../shared/Table';
import Modal from '../shared/Modal';
import Spinner from '../shared/Spinner';
import PrescriptionCard from './PrescriptionCard';
import { usePrescriptions } from '../../hooks/usePrescriptions';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { getModuleAccessLevel } from '../../constants/roles';
import { formatDateTime } from '../../utils/formatters';
import './PrescriptionList.css';

// FR-05.1: prescriptions are only ever created from within an active
// consultation (see ConsultationPanel + PrescriptionForm) — this page is a
// view/dispense surface, never a "create prescription" entry point.
//
// SRS Section 9: Admin = R (oversight, view only), Doctor = F for their own
// patients (view own, no edit — creation already happened in-consultation),
// Pharmacist = R/L (can view and dispense, cannot alter dosage).
function PrescriptionList() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const canDispense = getModuleAccessLevel(user?.role, 'prescriptions') === 'L';

  const {
    prescriptions,
    total,
    pageSize,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    dispensePrescription,
  } = usePrescriptions(isDoctor ? user?.name : undefined);

  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const closeModal = () => setModal(null);

  const handleDispense = async () => {
    setBusy(true);
    try {
      const result = await dispensePrescription(modal.prescription.id, user?.name);
      closeModal();
      showToast('Prescription marked as dispensed.');
      // FR-08.2: stock is auto-deducted from inventory on dispense. If any
      // line couldn't be deducted (not tracked yet, or insufficient/expired
      // stock), the dispensing itself still succeeded — but the Pharmacist
      // should know the stock ledger may now be out of sync for that item.
      if (result?.stockWarnings?.length) {
        const names = result.stockWarnings.map((w) => w.medicine).join(', ');
        showToast(`Stock not updated for: ${names}. Check Inventory.`, 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to dispense prescription.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'patientName',
      header: 'Patient',
      render: (p) => (
        <div>
          <div className="prescription-list-name">{p.patientName}</div>
          <div className="prescription-list-id">{p.id}</div>
        </div>
      ),
    },
    { key: 'doctorName', header: 'Doctor' },
    {
      key: 'medicines',
      header: 'Medicines',
      render: (p) => (
        <span className="prescription-list-meds">
          {p.medicines.map((m) => m.name).join(', ')}
        </span>
      ),
    },
    { key: 'createdOn', header: 'Issued', render: (p) => formatDateTime(p.createdOn) },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <Badge tone={p.status === 'dispensed' ? 'secondary' : 'primary'}>
          {p.status === 'dispensed' ? 'Dispensed' : 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="prescription-list-actions">
          <button className="prescription-list-action-btn" onClick={() => setModal({ type: 'view', prescription: p })} title="View">
            <Eye size={16} />
          </button>
          {canDispense && p.status === 'pending' && (
            <button className="prescription-list-action-btn" onClick={() => setModal({ type: 'dispense', prescription: p })} title="Mark dispensed">
              <CheckCircle2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="prescription-list-wrapper">
      <div className="prescription-list-toolbar">
        <div className="prescription-list-search">
          <Input
            name="search"
            icon={Search}
            placeholder="Search by patient, doctor, medicine or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="prescription-list-filter" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="dispensed">Dispensed</option>
        </select>
      </div>

      {error && <p className="prescription-list-error">{error}</p>}

      {loading ? (
        <Spinner label="Loading prescriptions..." />
      ) : (
        <>
          <Table
            columns={columns}
            data={prescriptions}
            emptyIcon={Pill}
            emptyTitle={search || status ? 'No prescriptions match your search' : 'No prescriptions yet'}
            emptyMessage={
              search || status
                ? 'Try a different patient, doctor, medicine, or status.'
                : 'Prescriptions written during consultations will show up here.'
            }
          />

          {total > 0 && (
            <div className="prescription-list-pagination">
              <span className="prescription-list-pagination-info">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
              </span>
              <div className="prescription-list-pagination-controls">
                <button className="prescription-list-page-btn" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft size={16} />
                </button>
                <span className="prescription-list-page-current">Page {page} of {totalPages}</span>
                <button className="prescription-list-page-btn" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modal?.type === 'view'} onClose={closeModal} title="Prescription">
        {modal?.type === 'view' && <PrescriptionCard prescription={modal.prescription} />}
      </Modal>

      <Modal
        open={modal?.type === 'dispense'}
        onClose={closeModal}
        title="Mark as Dispensed"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button loading={busy} onClick={handleDispense}>
              {busy ? 'Saving...' : 'Confirm Dispensed'}
            </Button>
          </>
        }
      >
        {modal?.type === 'dispense' && (
          <p className="prescription-list-dispense-text">
            Confirm all medicines on <strong>{modal.prescription.id}</strong> for{' '}
            <strong>{modal.prescription.patientName}</strong> have been dispensed as prescribed?
          </p>
        )}
      </Modal>
    </div>
  );
}

export default PrescriptionList;
