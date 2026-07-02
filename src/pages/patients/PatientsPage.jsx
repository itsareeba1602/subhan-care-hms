import PatientList from '../../components/patients/PatientList';

function PatientsPage() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Patients</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20, fontSize: 14 }}>
        Manage patient records — search, filter, add, edit, and view details.
      </p>
      <PatientList />
    </div>
  );
}

export default PatientsPage;
