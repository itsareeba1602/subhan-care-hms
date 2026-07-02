import { sleep } from '../utils/helpers';

// MOCK patient service — backed by localStorage, no backend yet.
// getPatients() mimics a paginated/filterable API response shape
// ({ data, total }) so swapping in a real endpoint later is a drop-in change.

const STORAGE_KEY = 'subhan_care_patients';

const SEED_PATIENTS = [
  { fullName: 'Muhammad Usman', cnic: '35202-1234567-1', mobile: '0301-2345678', gender: 'male', dob: '1990-05-14', bloodGroup: 'B+', address: 'Gulshan-e-Iqbal, Karachi' },
  { fullName: 'Ayesha Siddiqui', cnic: '42101-7654321-2', mobile: '0333-1122334', gender: 'female', dob: '1995-11-02', bloodGroup: 'O+', address: 'North Nazimabad, Karachi' },
  { fullName: 'Bilal Ahmed', cnic: '35201-9988776-3', mobile: '0345-6677889', gender: 'male', dob: '1988-02-20', bloodGroup: 'A+', address: 'DHA Phase 5, Karachi' },
  { fullName: 'Fatima Noor', cnic: '42201-1122334-4', mobile: '0312-9988776', gender: 'female', dob: '2001-07-09', bloodGroup: 'AB-', address: 'Clifton, Karachi' },
  { fullName: 'Hassan Raza', cnic: '35202-4455667-5', mobile: '0300-1234567', gender: 'male', dob: '1975-09-30', bloodGroup: 'O-', address: 'Malir, Karachi' },
  { fullName: 'Zainab Khan', cnic: '42301-5566778-6', mobile: '0321-4455667', gender: 'female', dob: '1999-01-18', bloodGroup: 'B-', address: 'Saddar, Karachi' },
  { fullName: 'Ali Hamza', cnic: '35202-6677889-7', mobile: '0334-5566778', gender: 'male', dob: '2010-03-25', bloodGroup: 'A-', address: 'Korangi, Karachi' },
  { fullName: 'Sana Malik', cnic: '42101-8899001-8', mobile: '0302-6677889', gender: 'female', dob: '1992-12-05', bloodGroup: 'AB+', address: 'PECHS, Karachi' },
  { fullName: 'Umer Farooq', cnic: '35202-9900112-9', mobile: '0346-7788990', gender: 'male', dob: '1965-06-11', bloodGroup: 'O+', address: 'Nazimabad, Karachi' },
  { fullName: 'Mahnoor Fatima', cnic: '42201-0011223-0', mobile: '0313-8899001', gender: 'female', dob: '2005-04-22', bloodGroup: 'B+', address: 'Bahadurabad, Karachi' },
  { fullName: 'Faizan Rasool', cnic: '35202-1231234-1', mobile: '0335-9900112', gender: 'male', dob: '1997-08-16', bloodGroup: 'A+', address: 'Gulistan-e-Johar, Karachi' },
  { fullName: 'Areeba Fayyaz', cnic: '42101-4564564-2', mobile: '0304-0011223', gender: 'female', dob: '2003-10-30', bloodGroup: 'O-', address: 'Shahra-e-Faisal, Karachi' },
  { fullName: 'Danish Iqbal', cnic: '35202-7897897-3', mobile: '0347-1231234', gender: 'male', dob: '1980-01-07', bloodGroup: 'AB-', address: 'Landhi, Karachi' },
  { fullName: 'Noor ul Sehar', cnic: '42301-3213213-4', mobile: '0315-4564564', gender: 'female', dob: '1998-05-27', bloodGroup: 'B-', address: 'Federal B Area, Karachi' },
];

function loadPatients() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  const seeded = SEED_PATIENTS.map((p, i) => ({
    id: `PT-${String(i + 1).padStart(4, '0')}`,
    registeredOn: new Date(Date.now() - i * 86400000).toISOString(),
    ...p,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function persist(patients) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
}

let patients = loadPatients();

function nextId() {
  const nums = patients.map((p) => parseInt(p.id.split('-')[1], 10));
  const max = nums.length ? Math.max(...nums) : 0;
  return `PT-${String(max + 1).padStart(4, '0')}`;
}

export async function getPatients({ search = '', gender = '', page = 1, pageSize = 8 } = {}) {
  await sleep(400);
  let filtered = patients;

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.cnic.includes(q) ||
        p.mobile.includes(q) ||
        p.id.toLowerCase().includes(q)
    );
  }

  if (gender) {
    filtered = filtered.filter((p) => p.gender === gender);
  }

  filtered = [...filtered].sort(
    (a, b) => new Date(b.registeredOn) - new Date(a.registeredOn)
  );

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return { data, total };
}

export async function getPatientById(id) {
  await sleep(200);
  const patient = patients.find((p) => p.id === id);
  if (!patient) throw new Error('Patient not found.');
  return patient;
}

export async function addPatient(patientData) {
  await sleep(500);
  const duplicate = patients.some((p) => p.cnic === patientData.cnic);
  if (duplicate) throw new Error('A patient with this CNIC already exists.');

  const newPatient = {
    id: nextId(),
    registeredOn: new Date().toISOString(),
    ...patientData,
  };
  patients = [newPatient, ...patients];
  persist(patients);
  return newPatient;
}

export async function updatePatient(id, patientData) {
  await sleep(500);
  const duplicate = patients.some((p) => p.cnic === patientData.cnic && p.id !== id);
  if (duplicate) throw new Error('A patient with this CNIC already exists.');

  patients = patients.map((p) => (p.id === id ? { ...p, ...patientData } : p));
  persist(patients);
  return patients.find((p) => p.id === id);
}

export async function deletePatient(id) {
  await sleep(400);
  patients = patients.filter((p) => p.id !== id);
  persist(patients);
  return { success: true };
}
