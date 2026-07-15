import PrescriptionList from '../../components/prescriptions/PrescriptionList';

function PrescriptionsPage() {
  return (
    <div>
      <h1 className="page-title">Prescriptions</h1>
      <p className="page-subtitle">
        View prescriptions issued during consultations and mark them dispensed.
      </p>
      <PrescriptionList />
    </div>
  );
}

export default PrescriptionsPage;
