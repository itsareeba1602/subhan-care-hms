import PatientList from '../../components/patients/PatientList';

function PatientsPage() {
  return (
    <div>
      <h1 className="page-title">Patients</h1>
      <p className="page-subtitle">
        Manage patient records — search, filter, add, edit, and view details.
      </p>
      <PatientList />
    </div>
  );
}

export default PatientsPage;
