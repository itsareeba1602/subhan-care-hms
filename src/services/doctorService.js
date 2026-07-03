import { sleep } from '../utils/helpers';

// MOCK doctor service — backed by localStorage, no backend yet.
// Same shape as patientService: { data, total } for list, plain object for
// single records, so swapping in Supabase later is a drop-in change.

const STORAGE_KEY = 'subhan_care_doctors';

export const SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'Orthopedic Surgeon',
  'Gynecologist',
  'ENT Specialist',
  'Neurologist',
];

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SEED_DOCTORS = [
  { fullName: 'Dr. Imran Sheikh', specialization: 'Cardiologist', qualification: 'MBBS, FCPS (Cardiology)', mobile: '0300-1112223', email: 'imran.sheikh@subhancare.pk', experienceYears: 14, availableDays: ['Mon', 'Wed', 'Fri'], status: 'active' },
  { fullName: 'Dr. Sadia Chaudhry', specialization: 'Gynecologist', qualification: 'MBBS, FCPS (Gynae)', mobile: '0321-2223334', email: 'sadia.chaudhry@subhancare.pk', experienceYears: 9, availableDays: ['Tue', 'Thu', 'Sat'], status: 'active' },
  { fullName: 'Dr. Kashif Mehmood', specialization: 'General Physician', qualification: 'MBBS', mobile: '0333-3334445', email: 'kashif.mehmood@subhancare.pk', experienceYears: 6, availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], status: 'active' },
  { fullName: 'Dr. Rabia Yousaf', specialization: 'Pediatrician', qualification: 'MBBS, DCH', mobile: '0345-4445556', email: 'rabia.yousaf@subhancare.pk', experienceYears: 11, availableDays: ['Mon', 'Wed', 'Sat'], status: 'active' },
  { fullName: 'Dr. Waqas Ahmed', specialization: 'Orthopedic Surgeon', qualification: 'MBBS, FCPS (Ortho)', mobile: '0301-5556667', email: 'waqas.ahmed@subhancare.pk', experienceYears: 16, availableDays: ['Tue', 'Thu'], status: 'on-leave' },
  { fullName: 'Dr. Mariam Baig', specialization: 'Dermatologist', qualification: 'MBBS, DDS', mobile: '0312-6667778', email: 'mariam.baig@subhancare.pk', experienceYears: 7, availableDays: ['Mon', 'Tue', 'Thu'], status: 'active' },
  { fullName: 'Dr. Adeel Anjum', specialization: 'ENT Specialist', qualification: 'MBBS, FCPS (ENT)', mobile: '0334-7778889', email: 'adeel.anjum@subhancare.pk', experienceYears: 10, availableDays: ['Wed', 'Fri', 'Sat'], status: 'active' },
  { fullName: 'Dr. Nida Farooqi', specialization: 'Neurologist', qualification: 'MBBS, FCPS (Neurology)', mobile: '0302-8889990', email: 'nida.farooqi@subhancare.pk', experienceYears: 13, availableDays: ['Mon', 'Thu'], status: 'active' },
];

function loadDoctors() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  const seeded = SEED_DOCTORS.map((d, i) => ({ id: `DR-${String(i + 1).padStart(4, '0')}`, ...d }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function persist(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let doctors = loadDoctors();

function nextId() {
  const nums = doctors.map((d) => parseInt(d.id.split('-')[1], 10));
  const max = nums.length ? Math.max(...nums) : 0;
  return `DR-${String(max + 1).padStart(4, '0')}`;
}

export async function getDoctors({ search = '', specialization = '', page = 1, pageSize = 8 } = {}) {
  await sleep(400);
  let filtered = doctors;

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (d) => d.fullName.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || d.mobile.includes(q)
    );
  }
  if (specialization) {
    filtered = filtered.filter((d) => d.specialization === specialization);
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);
  return { data, total };
}

// Unpaginated list — used by the Appointment module's doctor-selection dropdown.
export async function getAllActiveDoctors() {
  await sleep(200);
  return doctors.filter((d) => d.status === 'active');
}

export async function addDoctor(doctorData) {
  await sleep(500);
  const duplicate = doctors.some((d) => d.email === doctorData.email);
  if (duplicate) throw new Error('A doctor with this email already exists.');

  const newDoctor = { id: nextId(), ...doctorData };
  doctors = [newDoctor, ...doctors];
  persist(doctors);
  return newDoctor;
}

export async function updateDoctor(id, doctorData) {
  await sleep(500);
  doctors = doctors.map((d) => (d.id === id ? { ...d, ...doctorData } : d));
  persist(doctors);
  return doctors.find((d) => d.id === id);
}

export async function deleteDoctor(id) {
  await sleep(400);
  doctors = doctors.filter((d) => d.id !== id);
  persist(doctors);
  return { success: true };
}
