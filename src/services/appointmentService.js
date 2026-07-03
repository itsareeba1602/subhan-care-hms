import { sleep } from '../utils/helpers';
import { getPatients } from './patientService';
import { getAllActiveDoctors } from './doctorService';

// MOCK appointment service — backed by localStorage, no backend yet.

const STORAGE_KEY = 'subhan_care_appointments';

export const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
];

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
};

function seedDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const SEED_APPOINTMENTS = [
  { patientName: 'Muhammad Usman', doctorName: 'Dr. Imran Sheikh', date: seedDate(0), timeSlot: '09:00 AM', reason: 'Chest pain follow-up', status: APPOINTMENT_STATUS.SCHEDULED },
  { patientName: 'Ayesha Siddiqui', doctorName: 'Dr. Sadia Chaudhry', date: seedDate(0), timeSlot: '10:00 AM', reason: 'Routine checkup', status: APPOINTMENT_STATUS.SCHEDULED },
  { patientName: 'Bilal Ahmed', doctorName: 'Dr. Kashif Mehmood', date: seedDate(-1), timeSlot: '11:00 AM', reason: 'Fever', status: APPOINTMENT_STATUS.COMPLETED },
  { patientName: 'Fatima Noor', doctorName: 'Dr. Rabia Yousaf', date: seedDate(1), timeSlot: '02:00 PM', reason: 'Child vaccination', status: APPOINTMENT_STATUS.SCHEDULED },
  { patientName: 'Hassan Raza', doctorName: 'Dr. Mariam Baig', date: seedDate(-2), timeSlot: '03:00 PM', reason: 'Skin allergy', status: APPOINTMENT_STATUS.CANCELLED },
  { patientName: 'Zainab Khan', doctorName: 'Dr. Adeel Anjum', date: seedDate(2), timeSlot: '09:30 AM', reason: 'Ear infection', status: APPOINTMENT_STATUS.SCHEDULED },
];

function loadAppointments() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  const seeded = SEED_APPOINTMENTS.map((a, i) => ({
    id: `AP-${String(i + 1).padStart(4, '0')}`,
    createdOn: new Date(Date.now() - i * 3600000).toISOString(),
    ...a,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function persist(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let appointments = loadAppointments();

function nextId() {
  const nums = appointments.map((a) => parseInt(a.id.split('-')[1], 10));
  const max = nums.length ? Math.max(...nums) : 0;
  return `AP-${String(max + 1).padStart(4, '0')}`;
}

export async function getAppointments({ search = '', status = '', date = '', page = 1, pageSize = 8 } = {}) {
  await sleep(400);
  let filtered = appointments;

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.patientName.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
    );
  }
  if (status) filtered = filtered.filter((a) => a.status === status);
  if (date) filtered = filtered.filter((a) => a.date === date);

  filtered = [...filtered].sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);
  return { data, total };
}

// For the Book Appointment form's patient/doctor selects — reuses the
// existing services rather than duplicating patient/doctor data here.
export async function getBookingOptions() {
  const [{ data: patients }, doctors] = await Promise.all([
    getPatients({ page: 1, pageSize: 500 }),
    getAllActiveDoctors(),
  ]);
  return { patients, doctors };
}

// Prevents double-booking the same doctor at the same date + time slot.
function isSlotTaken(doctorName, date, timeSlot, excludeId) {
  return appointments.some(
    (a) =>
      a.id !== excludeId &&
      a.doctorName === doctorName &&
      a.date === date &&
      a.timeSlot === timeSlot &&
      a.status !== APPOINTMENT_STATUS.CANCELLED
  );
}

export async function bookAppointment(appointmentData) {
  await sleep(500);
  if (isSlotTaken(appointmentData.doctorName, appointmentData.date, appointmentData.timeSlot)) {
    throw new Error('This doctor is already booked for the selected date and time slot.');
  }

  const newAppointment = {
    id: nextId(),
    createdOn: new Date().toISOString(),
    status: APPOINTMENT_STATUS.SCHEDULED,
    ...appointmentData,
  };
  appointments = [newAppointment, ...appointments];
  persist(appointments);
  return newAppointment;
}

export async function rescheduleAppointment(id, { date, timeSlot }) {
  await sleep(500);
  const appt = appointments.find((a) => a.id === id);
  if (!appt) throw new Error('Appointment not found.');
  if (isSlotTaken(appt.doctorName, date, timeSlot, id)) {
    throw new Error('This doctor is already booked for the selected date and time slot.');
  }
  appointments = appointments.map((a) =>
    a.id === id ? { ...a, date, timeSlot, status: APPOINTMENT_STATUS.RESCHEDULED } : a
  );
  persist(appointments);
  return appointments.find((a) => a.id === id);
}

export async function cancelAppointment(id) {
  await sleep(400);
  appointments = appointments.map((a) =>
    a.id === id ? { ...a, status: APPOINTMENT_STATUS.CANCELLED } : a
  );
  persist(appointments);
  return { success: true };
}

export async function completeAppointment(id) {
  await sleep(400);
  appointments = appointments.map((a) =>
    a.id === id ? { ...a, status: APPOINTMENT_STATUS.COMPLETED } : a
  );
  persist(appointments);
  return { success: true };
}
