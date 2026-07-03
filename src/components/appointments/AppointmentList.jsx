import { useState } from 'react';
import { Search, Plus, CalendarClock, XCircle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import Badge from '../shared/Badge';
import Table from '../shared/Table';
import Modal from '../shared/Modal';
import Spinner from '../shared/Spinner';
import BookAppointment from './BookAppointment';
import { useAppointments } from '../../hooks/useAppointments';
import { formatDate } from '../../utils/formatters';
import './AppointmentList.css';

const STATUS_TONE = {
  scheduled: 'primary',
  completed: 'secondary',
  cancelled: 'danger',
  rescheduled: 'neutral',
};

const STATUS_LABEL = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
};

function AppointmentList() {
  const {
    appointments,
    total,
    pageSize,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    date,
    setDate,
    page,
    setPage,
    bookAppointment,
    rescheduleAppointment,
    cancelAppointment,
    completeAppointment,
  } = useAppointments();

  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const closeModal = () => setModal(null);
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  };

  const handleBook = async (data) => {
    await bookAppointment(data);
    closeModal();
    showToast('Appointment booked successfully.');
  };

  const handleReschedule = async (data) => {
    await rescheduleAppointment(modal.appointment.id, data);
    closeModal();
    showToast('Appointment rescheduled.');
  };

  const handleCancel = async () => {
    setBusy(true);
    try {
      await cancelAppointment(modal.appointment.id);
      closeModal();
      showToast('Appointment cancelled.');
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async (appt) => {
    setBusy(true);
    try {
      await completeAppointment(appt.id);
      showToast('Appointment marked as completed.');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'patientName',
      header: 'Patient',
      render: (a) => (
        <div>
          <div className="appointment-list-name">{a.patientName}</div>
          <div className="appointment-list-id">{a.id}</div>
        </div>
      ),
    },
    { key: 'doctorName', header: 'Doctor' },
    {
      key: 'date',
      header: 'Date & Time',
      render: (a) => (
        <div>
          <div>{formatDate(a.date)}</div>
          <div className="appointment-list-time">{a.timeSlot}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (a) => (
        <div className="appointment-list-actions">
          {a.status === 'scheduled' && (
            <>
              <button className="appointment-list-action-btn" onClick={() => setModal({ type: 'reschedule', appointment: a })} title="Reschedule">
                <CalendarClock size={16} />
              </button>
              <button className="appointment-list-action-btn" onClick={() => handleComplete(a)} title="Mark completed" disabled={busy}>
                <CheckCircle2 size={16} />
              </button>
              <button className="appointment-list-action-btn appointment-list-action-danger" onClick={() => setModal({ type: 'cancel', appointment: a })} title="Cancel">
                <XCircle size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="appointment-list-wrapper">
      <div className="appointment-list-toolbar">
        <div className="appointment-list-search">
          <Input
            name="search"
            icon={Search}
            placeholder="Search by patient, doctor or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="appointment-list-filter" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rescheduled">Rescheduled</option>
        </select>
        <input
          type="date"
          className="appointment-list-date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Button onClick={() => setModal({ type: 'book' })}>
          <Plus size={18} /> Book Appointment
        </Button>
      </div>

      {toast && <div className="appointment-list-toast">{toast}</div>}
      {error && <p className="appointment-list-error">{error}</p>}

      {loading ? (
        <Spinner label="Loading appointments..." />
      ) : (
        <>
          <Table columns={columns} data={appointments} emptyMessage="No appointments found." />

          {total > 0 && (
            <div className="appointment-list-pagination">
              <span className="appointment-list-pagination-info">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
              </span>
              <div className="appointment-list-pagination-controls">
                <button className="appointment-list-page-btn" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft size={16} />
                </button>
                <span className="appointment-list-page-current">Page {page} of {totalPages}</span>
                <button className="appointment-list-page-btn" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modal?.type === 'book'} onClose={closeModal} title="Book Appointment">
        <BookAppointment onSubmit={handleBook} onCancel={closeModal} />
      </Modal>

      <Modal open={modal?.type === 'reschedule'} onClose={closeModal} title="Reschedule Appointment">
        {modal?.type === 'reschedule' && (
          <BookAppointment initialData={modal.appointment} onSubmit={handleReschedule} onCancel={closeModal} />
        )}
      </Modal>

      <Modal
        open={modal?.type === 'cancel'}
        onClose={closeModal}
        title="Cancel Appointment"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Keep It</Button>
            <Button variant="danger" loading={busy} onClick={handleCancel}>
              {busy ? 'Cancelling...' : 'Cancel Appointment'}
            </Button>
          </>
        }
      >
        {modal?.type === 'cancel' && (
          <p className="appointment-list-cancel-text">
            Cancel the appointment for <strong>{modal.appointment.patientName}</strong> with{' '}
            <strong>{modal.appointment.doctorName}</strong> on {formatDate(modal.appointment.date)}?
          </p>
        )}
      </Modal>
    </div>
  );
}

export default AppointmentList;
