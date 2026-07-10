import StaffList from '../../components/staff/StaffList';

function StaffPage() {
  return (
    <div>
      <h1 className="page-title">Staff Management</h1>
      <p className="page-subtitle">
        Manage non-clinical staff accounts — role assignment, shift timing, and access.
      </p>
      <StaffList />
    </div>
  );
}

export default StaffPage;
