import DoctorList from '../../components/doctors/DoctorList';

function DoctorsPage() {
  return (
    <div>
      <h1 className="page-title">Doctors</h1>
      <p className="page-subtitle">
        Manage doctor records — specialization, availability, and contact details.
      </p>
      <DoctorList />
    </div>
  );
}

export default DoctorsPage;
