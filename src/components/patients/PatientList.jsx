import { useState } from 'react';
import { Search, Plus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import Badge from '../shared/Badge';
import Table from '../shared/Table';
import Modal from '../shared/Modal';
import Spinner from '../shared/Spinner';
import AddPatientForm from './AddPatientForm';
import PatientCard from './PatientCard';
import { usePatients } from '../../hooks/usePatients';
import { calculateAge } from '../../utils/formatters';
import './PatientList.css';

function PatientList() {
  const {
    patients,
    total,
    pageSize,
    loading,
    error,
    search,
    setSearch,
    gender,
    setGender,
    page,
    setPage,
    addPatient,
    updatePatient,
    deletePatient,
  } = usePatients();

  const [modal, setModal] = useState(null); // { type: 'add' | 'edit' | 'view' | 'delete', patient? }
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const closeModal = () => setModal(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  };

  const handleAdd = async (data) => {
    await addPatient(data);
    closeModal();
    showToast('Patient added successfully.');
  };

  const handleEdit = async (data) => {
    await updatePatient(modal.patient.id, data);
    closeModal();
    showToast('Patient updated successfully.');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePatient(modal.patient.id);
      closeModal();
      showToast('Patient deleted.');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'fullName',
      header: 'Patient',
      render: (p) => (
        <div>
          <div className="patient-list-name">{p.fullName}</div>
          <div className="patient-list-id">{p.id}</div>
        </div>
      ),
    },
    { key: 'cnic', header: 'CNIC' },
    { key: 'mobile', header: 'Mobile' },
    {
      key: 'gender',
      header: 'Gender',
      render: (p) => (
        <Badge tone={p.gender === 'female' ? 'danger' : 'primary'}>
          {p.gender.charAt(0).toUpperCase() + p.gender.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'age',
      header: 'Age',
      render: (p) => `${calculateAge(p.dob)} yrs`,
    },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="patient-list-actions">
          <button className="patient-list-action-btn" onClick={() => setModal({ type: 'view', patient: p })} title="View details">
            <Eye size={16} />
          </button>
          <button className="patient-list-action-btn" onClick={() => setModal({ type: 'edit', patient: p })} title="Edit">
            <Pencil size={16} />
          </button>
          <button className="patient-list-action-btn patient-list-action-danger" onClick={() => setModal({ type: 'delete', patient: p })} title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="patient-list-wrapper">
      <div className="patient-list-toolbar">
        <div className="patient-list-search">
          <Input
            name="search"
            icon={Search}
            placeholder="Search by name, CNIC, mobile or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="patient-list-filter"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <Button onClick={() => setModal({ type: 'add' })}>
          <Plus size={18} /> Add Patient
        </Button>
      </div>

      {toast && <div className="patient-list-toast">{toast}</div>}

      {error && <p className="patient-list-error">{error}</p>}

      {loading ? (
        <Spinner label="Loading patients..." />
      ) : (
        <>
          <Table columns={columns} data={patients} emptyMessage="No patients found." />

          {total > 0 && (
            <div className="patient-list-pagination">
              <span className="patient-list-pagination-info">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
              </span>
              <div className="patient-list-pagination-controls">
                <button
                  className="patient-list-page-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="patient-list-page-current">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="patient-list-page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Patient */}
      <Modal open={modal?.type === 'add'} onClose={closeModal} title="Add Patient">
        <AddPatientForm onSubmit={handleAdd} onCancel={closeModal} />
      </Modal>

      {/* Edit Patient */}
      <Modal open={modal?.type === 'edit'} onClose={closeModal} title="Edit Patient">
        {modal?.type === 'edit' && (
          <AddPatientForm initialData={modal.patient} onSubmit={handleEdit} onCancel={closeModal} />
        )}
      </Modal>

      {/* View Details */}
      <Modal open={modal?.type === 'view'} onClose={closeModal} title="Patient Details">
        {modal?.type === 'view' && <PatientCard patient={modal.patient} />}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={modal?.type === 'delete'}
        onClose={closeModal}
        title="Delete Patient"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        }
      >
        {modal?.type === 'delete' && (
          <p className="patient-list-delete-text">
            Are you sure you want to delete <strong>{modal.patient.fullName}</strong> ({modal.patient.id})?
            This action cannot be undone.
          </p>
        )}
      </Modal>
    </div>
  );
}

export default PatientList;
