import { useState } from 'react';
import { Search, Plus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, UserCog } from 'lucide-react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import Badge from '../shared/Badge';
import Table from '../shared/Table';
import Modal from '../shared/Modal';
import Spinner from '../shared/Spinner';
import AddStaffForm from './AddStaffForm';
import StaffCard from './StaffCard';
import { useStaff } from '../../hooks/useStaff';
import { useToast } from '../../hooks/useToast';
import { STAFF_ROLES, roleLabel } from '../../services/staffService';
import { hasModuleAccess } from '../../constants/roles';
import { useAuth } from '../../hooks/useAuth';
import './StaffList.css';

function StaffList() {
  const { user } = useAuth();
  // Staff Management is Admin-only per SRS Section 9 (Full access for Admin,
  // none for every other role) — RoleRoute already keeps non-admins off this
  // page entirely, but this mirrors the doctors/patients modules' pattern of
  // also gating the add/edit/deactivate actions explicitly.
  const canEdit = hasModuleAccess(user?.role, 'staff') && user?.role === 'admin';

  const {
    staff,
    total,
    pageSize,
    loading,
    error,
    search,
    setSearch,
    role,
    setRole,
    page,
    setPage,
    addStaff,
    updateStaff,
    deleteStaff,
  } = useStaff();

  const [modal, setModal] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const { showToast } = useToast();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const closeModal = () => setModal(null);

  const handleAdd = async (data) => {
    await addStaff(data);
    closeModal();
    showToast('Staff member added successfully.');
  };

  const handleEdit = async (data) => {
    await updateStaff(modal.staff.id, data);
    closeModal();
    showToast('Staff member updated successfully.');
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await deleteStaff(modal.staff.id);
      closeModal();
      showToast('Staff account deactivated. Active sessions have been signed out.');
    } catch (err) {
      showToast(err.message || 'Failed to deactivate staff member.', 'error');
    } finally {
      setDeactivating(false);
    }
  };

  const columns = [
    {
      key: 'fullName',
      header: 'Staff Member',
      render: (s) => (
        <div>
          <div className="staff-list-name">{s.fullName}</div>
          <div className="staff-list-id">{s.id}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (s) => <Badge tone="primary">{roleLabel(s.role)}</Badge>,
    },
    { key: 'mobile', header: 'Mobile' },
    { key: 'shiftTiming', header: 'Shift' },
    {
      key: 'status',
      header: 'Status',
      render: (s) => {
        const tone = s.status === 'active' ? 'secondary' : s.status === 'inactive' ? 'danger' : 'primary';
        const label = s.status === 'active' ? 'Active' : s.status === 'inactive' ? 'Inactive' : 'On Leave';
        return <Badge tone={tone}>{label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <div className="staff-list-actions">
          <button className="staff-list-action-btn" onClick={() => setModal({ type: 'view', staff: s })} title="View details">
            <Eye size={16} />
          </button>
          {canEdit && (
            <>
              <button className="staff-list-action-btn" onClick={() => setModal({ type: 'edit', staff: s })} title="Edit">
                <Pencil size={16} />
              </button>
              <button className="staff-list-action-btn staff-list-action-danger" onClick={() => setModal({ type: 'deactivate', staff: s })} title="Deactivate">
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="staff-list-wrapper">
      <div className="staff-list-toolbar">
        <div className="staff-list-search">
          <Input
            name="search"
            icon={Search}
            placeholder="Search by name, mobile or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="staff-list-filter"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">All Roles</option>
          {STAFF_ROLES.map((r) => (
            <option key={r} value={r}>{roleLabel(r)}</option>
          ))}
        </select>
        {canEdit && (
          <Button onClick={() => setModal({ type: 'add' })}>
            <Plus size={18} /> Add Staff
          </Button>
        )}
      </div>

      {error && <p className="staff-list-error">{error}</p>}

      {loading ? (
        <Spinner label="Loading staff..." />
      ) : (
        <>
          <Table
            columns={columns}
            data={staff}
            emptyIcon={UserCog}
            emptyTitle={search || role ? 'No staff match your search' : 'No staff members yet'}
            emptyMessage={
              search || role
                ? 'Try a different name, role, or ID.'
                : 'Staff profiles you add will show up here.'
            }
          />

          {total > 0 && (
            <div className="staff-list-pagination">
              <span className="staff-list-pagination-info">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
              </span>
              <div className="staff-list-pagination-controls">
                <button className="staff-list-page-btn" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft size={16} />
                </button>
                <span className="staff-list-page-current">Page {page} of {totalPages}</span>
                <button className="staff-list-page-btn" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modal?.type === 'add'} onClose={closeModal} title="Add Staff Member">
        <AddStaffForm onSubmit={handleAdd} onCancel={closeModal} />
      </Modal>

      <Modal open={modal?.type === 'edit'} onClose={closeModal} title="Edit Staff Member">
        {modal?.type === 'edit' && (
          <AddStaffForm initialData={modal.staff} onSubmit={handleEdit} onCancel={closeModal} />
        )}
      </Modal>

      <Modal open={modal?.type === 'view'} onClose={closeModal} title="Staff Details">
        {modal?.type === 'view' && <StaffCard staff={modal.staff} />}
      </Modal>

      <Modal
        open={modal?.type === 'deactivate'}
        onClose={closeModal}
        title="Deactivate Staff Account"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="danger" loading={deactivating} onClick={handleDeactivate}>
              {deactivating ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </>
        }
      >
        {modal?.type === 'deactivate' && (
          <p className="staff-list-deactivate-text">
            Are you sure you want to deactivate <strong>{modal.staff.fullName}</strong> ({modal.staff.id})?
            This immediately signs out any active session for their account. Their profile and history are kept.
          </p>
        )}
      </Modal>
    </div>
  );
}

export default StaffList;
