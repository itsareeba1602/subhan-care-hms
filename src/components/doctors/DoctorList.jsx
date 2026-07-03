import { useState } from 'react';
import { Search, Plus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Stethoscope } from 'lucide-react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import Badge from '../shared/Badge';
import Table from '../shared/Table';
import Modal from '../shared/Modal';
import Spinner from '../shared/Spinner';
import AddDoctorForm from './AddDoctorForm';
import DoctorCard from './DoctorCard';
import { useDoctors } from '../../hooks/useDoctors';
import { useToast } from '../../hooks/useToast';
import { SPECIALIZATIONS } from '../../services/doctorService';
import { hasModuleAccess } from '../../constants/roles';
import { useAuth } from '../../hooks/useAuth';
import './DoctorList.css';

function DoctorList() {
  const { user } = useAuth();
  const canEdit = hasModuleAccess(user?.role, 'doctors') && user?.role !== undefined && (user.role === 'admin');

  const {
    doctors,
    total,
    pageSize,
    loading,
    error,
    search,
    setSearch,
    specialization,
    setSpecialization,
    page,
    setPage,
    addDoctor,
    updateDoctor,
    deleteDoctor,
  } = useDoctors();

  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const closeModal = () => setModal(null);

  const handleAdd = async (data) => {
    await addDoctor(data);
    closeModal();
    showToast('Doctor added successfully.');
  };

  const handleEdit = async (data) => {
    await updateDoctor(modal.doctor.id, data);
    closeModal();
    showToast('Doctor updated successfully.');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDoctor(modal.doctor.id);
      closeModal();
      showToast('Doctor deactivated.');
    } catch (err) {
      showToast(err.message || 'Failed to deactivate doctor.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'fullName',
      header: 'Doctor',
      render: (d) => (
        <div>
          <div className="doctor-list-name">{d.fullName}</div>
          <div className="doctor-list-id">{d.id}</div>
        </div>
      ),
    },
    { key: 'specialization', header: 'Specialization' },
    { key: 'mobile', header: 'Mobile' },
    {
      key: 'status',
      header: 'Status',
      render: (d) => {
        const tone = d.status === 'active' ? 'secondary' : d.status === 'inactive' ? 'danger' : 'primary';
        const label = d.status === 'active' ? 'Active' : d.status === 'inactive' ? 'Inactive' : 'On Leave';
        return <Badge tone={tone}>{label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      render: (d) => (
        <div className="doctor-list-actions">
          <button className="doctor-list-action-btn" onClick={() => setModal({ type: 'view', doctor: d })} title="View details">
            <Eye size={16} />
          </button>
          {canEdit && (
            <>
              <button className="doctor-list-action-btn" onClick={() => setModal({ type: 'edit', doctor: d })} title="Edit">
                <Pencil size={16} />
              </button>
              <button className="doctor-list-action-btn doctor-list-action-danger" onClick={() => setModal({ type: 'delete', doctor: d })} title="Deactivate">
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="doctor-list-wrapper">
      <div className="doctor-list-toolbar">
        <div className="doctor-list-search">
          <Input
            name="search"
            icon={Search}
            placeholder="Search by name, mobile or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="doctor-list-filter"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
        >
          <option value="">All Specializations</option>
          {SPECIALIZATIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {canEdit && (
          <Button onClick={() => setModal({ type: 'add' })}>
            <Plus size={18} /> Add Doctor
          </Button>
        )}
      </div>

      {error && <p className="doctor-list-error">{error}</p>}

      {loading ? (
        <Spinner label="Loading doctors..." />
      ) : (
        <>
          <Table
            columns={columns}
            data={doctors}
            emptyIcon={Stethoscope}
            emptyTitle={search || specialization ? 'No doctors match your search' : 'No doctors yet'}
            emptyMessage={
              search || specialization
                ? 'Try a different name, specialization, or ID.'
                : 'Doctor profiles you add will show up here.'
            }
          />

          {total > 0 && (
            <div className="doctor-list-pagination">
              <span className="doctor-list-pagination-info">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
              </span>
              <div className="doctor-list-pagination-controls">
                <button className="doctor-list-page-btn" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft size={16} />
                </button>
                <span className="doctor-list-page-current">Page {page} of {totalPages}</span>
                <button className="doctor-list-page-btn" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modal?.type === 'add'} onClose={closeModal} title="Add Doctor">
        <AddDoctorForm onSubmit={handleAdd} onCancel={closeModal} />
      </Modal>

      <Modal open={modal?.type === 'edit'} onClose={closeModal} title="Edit Doctor">
        {modal?.type === 'edit' && (
          <AddDoctorForm initialData={modal.doctor} onSubmit={handleEdit} onCancel={closeModal} />
        )}
      </Modal>

      <Modal open={modal?.type === 'view'} onClose={closeModal} title="Doctor Details">
        {modal?.type === 'view' && <DoctorCard doctor={modal.doctor} />}
      </Modal>

      <Modal
        open={modal?.type === 'delete'}
        onClose={closeModal}
        title="Deactivate Doctor"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              {deleting ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </>
        }
      >
        {modal?.type === 'delete' && (
          <p className="doctor-list-delete-text">
            Are you sure you want to deactivate <strong>{modal.doctor.fullName}</strong> ({modal.doctor.id})?
            This blocks new appointment bookings for them; their profile and history are kept.
          </p>
        )}
      </Modal>
    </div>
  );
}

export default DoctorList;
