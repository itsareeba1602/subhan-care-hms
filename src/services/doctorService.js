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

// FR-02.2: availability is captured as working days (above) *and* a daily
// time slot range applied across those days — e.g. "Mon/Wed/Fri, 9AM-1PM".
export const AVAILABILITY_HOURS = [
  '09:00 AM - 01:00 PM',
  '01:00 PM - 05:00 PM',
  '05:00 PM - 09:00 PM',
  '09:00 AM - 05:00 PM',
];

const SEED_DOCTORS = [
  { fullName: 'Dr. Imran Sheikh', specialization: 'Cardiologist', qualification: 'MBBS, FCPS (Cardiology)', licenseNumber: 'PMDC-11234', consultationFee: 3000, mobile: '0300-1112223', email: 'imran.sheikh@subhancare.pk', experienceYears: 14, availableDays: ['Mon', 'Wed', 'Fri'], availabilityHours: AVAILABILITY_HOURS[0], status: 'active' },
  { fullName: 'Dr. Sadia Chaudhry', specialization: 'Gynecologist', qualification: 'MBBS, FCPS (Gynae)', licenseNumber: 'PMDC-11897', consultationFee: 2500, mobile: '0321-2223334', email: 'sadia.chaudhry@subhancare.pk', experienceYears: 9, availableDays: ['Tue', 'Thu', 'Sat'], availabilityHours: AVAILABILITY_HOURS[1], status: 'active' },
  { fullName: 'Dr. Kashif Mehmood', specialization: 'General Physician', qualification: 'MBBS', licenseNumber: 'PMDC-10456', consultationFee: 1500, mobile: '0333-3334445', email: 'kashif.mehmood@subhancare.pk', experienceYears: 6, availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], availabilityHours: AVAILABILITY_HOURS[3], status: 'active' },
  { fullName: 'Dr. Rabia Yousaf', specialization: 'Pediatrician', qualification: 'MBBS, DCH', licenseNumber: 'PMDC-12034', consultationFee: 2000, mobile: '0345-4445556', email: 'rabia.yousaf@subhancare.pk', experienceYears: 11, availableDays: ['Mon', 'Wed', 'Sat'], availabilityHours: AVAILABILITY_HOURS[0], status: 'active' },
  { fullName: 'Dr. Waqas Ahmed', specialization: 'Orthopedic Surgeon', qualification: 'MBBS, FCPS (Ortho)', licenseNumber: 'PMDC-10987', consultationFee: 3500, mobile: '0301-5556667', email: 'waqas.ahmed@subhancare.pk', experienceYears: 16, availableDays: ['Tue', 'Thu'], availabilityHours: AVAILABILITY_HOURS[2], status: 'on-leave' },
  { fullName: 'Dr. Mariam Baig', specialization: 'Dermatologist', qualification: 'MBBS, DDS', licenseNumber: 'PMDC-11567', consultationFee: 2200, mobile: '0312-6667778', email: 'mariam.baig@subhancare.pk', experienceYears: 7, availableDays: ['Mon', 'Tue', 'Thu'], availabilityHours: AVAILABILITY_HOURS[1], status: 'active' },
  { fullName: 'Dr. Adeel Anjum', specialization: 'ENT Specialist', qualification: 'MBBS, FCPS (ENT)', licenseNumber: 'PMDC-11789', consultationFee: 2000, mobile: '0334-7778889', email: 'adeel.anjum@subhancare.pk', experienceYears: 10, availableDays: ['Wed', 'Fri', 'Sat'], availabilityHours: AVAILABILITY_HOURS[0], status: 'active' },
  { fullName: 'Dr. Nida Farooqi', specialization: 'Neurologist', qualification: 'MBBS, FCPS (Neurology)', licenseNumber: 'PMDC-12211', consultationFee: 3200, mobile: '0302-8889990', email: 'nida.farooqi@subhancare.pk', experienceYears: 13, availableDays: ['Mon', 'Thu'], availabilityHours: AVAILABILITY_HOURS[2], status: 'active' },
];

function loadDoctors() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const cached = JSON.parse(raw);
    // Self-healing migration: licenseNumber/consultationFee/availabilityHours
    // were added to this schema after some browsers had already cached
    // doctor data under STORAGE_KEY. Since seeding only runs when
    // localStorage is completely empty, those browsers would otherwise show
    // these fields as blank forever. Backfill defaults for anything missing
    // — d's own values (spread last) always win when present — so a schema
    // change never requires the user to manually clear localStorage.
    const migrated = cached.map((d, i) => ({
      licenseNumber: `PMDC-1${String(1000 + i).padStart(4, '0')}`,
      consultationFee: 1500,
      availabilityHours: AVAILABILITY_HOURS[0],
      status: 'active',
      ...d,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  }
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

// FR-02.3: deactivating a doctor must automatically block new appointment
// bookings (getAllActiveDoctors already filters by status === 'active', so
// setting status to 'inactive' here achieves that) while keeping the
// profile and its history intact — never a hard delete.
export async function deactivateDoctor(id) {
  await sleep(400);
  doctors = doctors.map((d) => (d.id === id ? { ...d, status: 'inactive' } : d));
  persist(doctors);
  return { success: true };
}

// Alias so existing imports (`deleteDoctor`) keep working without a rename.
export const deleteDoctor = deactivateDoctor;
