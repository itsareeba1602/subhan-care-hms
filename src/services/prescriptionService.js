import { sleep } from '../utils/helpers';
import { dispenseMedicinesFromStock } from './inventoryService';

// MOCK prescription service — backed by localStorage, no backend yet.
// Per UC-04, a prescription only ever exists tied to a specific
// consultation (FR-05.1) — there is deliberately no "create prescription"
// entry point outside an active consultation. Once created, a prescription
// is immutable except for its dispensing status: no update/edit function is
// exposed here at all, which is what makes FR-05.3 ("Pharmacist ... shall
// not alter prescribed dosage") true by construction rather than by a
// permission check that could be bypassed.

const STORAGE_KEY = 'subhan_care_prescriptions';

export const PRESCRIPTION_STATUS = {
  PENDING: 'pending',
  DISPENSED: 'dispensed',
};

const SEED_PRESCRIPTIONS = [
  {
    consultationId: 'CON-0001',
    patientName: 'Bilal Ahmed',
    doctorName: 'Dr. Kashif Mehmood',
    medicines: [
      { id: 'm1', name: 'Panadol Extra', dosage: '500mg', frequency: 'Every 6 hours', duration: '3 days' },
      { id: 'm2', name: 'Vitamin C', dosage: '500mg', frequency: 'Once daily', duration: '5 days' },
    ],
    status: PRESCRIPTION_STATUS.DISPENSED,
    dispensedBy: 'Bilal Yasir',
  },
  {
    consultationId: 'CON-0002',
    patientName: 'Hassan Raza',
    doctorName: 'Dr. Mariam Baig',
    medicines: [
      { id: 'm1', name: 'Betnovate Cream', dosage: 'Thin layer', frequency: 'Twice daily', duration: '7 days' },
      { id: 'm2', name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily (night)', duration: '5 days' },
    ],
    status: PRESCRIPTION_STATUS.PENDING,
    dispensedBy: null,
  },
];

function loadPrescriptions() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const cached = JSON.parse(raw);
    const migrated = cached.map((p) => ({ status: PRESCRIPTION_STATUS.PENDING, dispensedBy: null, dispensedOn: null, ...p }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  }
  const seeded = SEED_PRESCRIPTIONS.map((p, i) => ({
    id: `RX-${String(i + 1).padStart(4, '0')}`,
    createdOn: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
    dispensedOn: p.status === PRESCRIPTION_STATUS.DISPENSED ? new Date(Date.now() - i * 43200000).toISOString() : null,
    ...p,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function persist(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let prescriptions = loadPrescriptions();

function nextId() {
  const nums = prescriptions.map((p) => parseInt(p.id.split('-')[1], 10));
  const max = nums.length ? Math.max(...nums) : 0;
  return `RX-${String(max + 1).padStart(4, '0')}`;
}

// FR-05.1 / FR-05.2 / FR-05.4: creates a prescription with one or more
// medicines, linked to a specific consultation, timestamped and
// permanently stamped with the issuing doctor's identity.
export async function createPrescription({ consultationId, patientName, doctorName, medicines }) {
  await sleep(500);
  if (!consultationId) throw new Error('A prescription must be linked to an active consultation.');
  if (!medicines || medicines.length === 0) {
    throw new Error('Add at least one medicine before saving the prescription.');
  }
  for (const m of medicines) {
    if (!m.name.trim() || !m.dosage.trim() || !m.frequency.trim() || !m.duration.trim()) {
      throw new Error('Each medicine needs a name, dosage, frequency, and duration.');
    }
  }

  const newPrescription = {
    id: nextId(),
    consultationId,
    patientName,
    doctorName,
    medicines,
    status: PRESCRIPTION_STATUS.PENDING,
    createdOn: new Date().toISOString(),
    dispensedOn: null,
    dispensedBy: null,
  };
  prescriptions = [newPrescription, ...prescriptions];
  persist(prescriptions);
  return newPrescription;
}

export async function getPrescriptionsForConsultation(consultationId) {
  await sleep(250);
  if (!consultationId) return [];
  return prescriptions
    .filter((p) => p.consultationId === consultationId)
    .sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
}

// For the Pharmacist/Admin/Doctor list page. doctorName scopes results to
// "own" prescriptions when passed (Doctor access is F for their own
// patients only, per SRS Section 9).
export async function getPrescriptions({ search = '', status = '', doctorName = '', page = 1, pageSize = 8 } = {}) {
  await sleep(400);
  let filtered = prescriptions;

  if (doctorName) filtered = filtered.filter((p) => p.doctorName === doctorName);
  if (status) filtered = filtered.filter((p) => p.status === status);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.patientName.toLowerCase().includes(q) ||
        p.doctorName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.medicines.some((m) => m.name.toLowerCase().includes(q))
    );
  }

  filtered = [...filtered].sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);
  return { data, total };
}

// FR-05.3: Pharmacist views and processes a prescription for dispensing.
// This only ever flips status/dispensedBy/dispensedOn — there is no path
// through this service that lets a caller change `medicines`, so dosage
// alteration by a Pharmacist is structurally impossible, not just
// UI-hidden.
export async function dispensePrescription(id, dispensedBy) {
  await sleep(400);
  const target = prescriptions.find((p) => p.id === id);
  if (!target) throw new Error('Prescription not found.');
  if (target.status === PRESCRIPTION_STATUS.DISPENSED) {
    throw new Error('This prescription has already been dispensed.');
  }

  prescriptions = prescriptions.map((p) =>
    p.id === id
      ? { ...p, status: PRESCRIPTION_STATUS.DISPENSED, dispensedOn: new Date().toISOString(), dispensedBy }
      : p
  );
  persist(prescriptions);

  // FR-08.2: "automatically deduct stock quantity when a prescribed
  // medicine is dispensed against a prescription." Wrapped so that an
  // inventory-side problem (unmatched item, insufficient stock, expired
  // batch) is reported back as a warning, never as a failure of the
  // dispensing action itself — a Pharmacist confirming a patient received
  // their medicine is a clinical fact and must be recorded regardless of
  // what the stock ledger says.
  let stockWarnings = [];
  try {
    const results = await dispenseMedicinesFromStock(target.medicines);
    stockWarnings = results.filter((r) => !r.deducted);
  } catch {
    // Inventory module unavailable/erroring — dispensing still stands.
  }

  return { ...prescriptions.find((p) => p.id === id), stockWarnings };
}
