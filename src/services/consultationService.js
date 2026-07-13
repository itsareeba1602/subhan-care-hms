import { sleep } from '../utils/helpers';
import { completeAppointment as markAppointmentCompleted } from './appointmentService';

// MOCK consultation service — backed by localStorage, no backend yet.
// This is the FR-06 "Medical History" module. A Consultation is created the
// moment a doctor starts seeing a patient for a scheduled appointment
// (FR-06.4), holds the clinical record while it's being written up
// (FR-06.5), and — once completed — becomes an immutable entry in that
// patient's medical history (FR-06.1, FR-06.3). Corrections after
// completion are addenda, never edits to the original fields (FR-06.3).
// Every in-progress save is snapshotted so the full edit trail survives
// even before completion (FR-06.7).

const STORAGE_KEY = 'subhan_care_consultations';

export const CONSULTATION_STATUS = {
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
};

const EMPTY_CLINICAL_FIELDS = {
  symptoms: '',
  diagnosis: '',
  notes: '',
  followUpInstructions: '',
};

function seedDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

// A couple of completed consultations for patients that also have seeded
// appointments/invoices, so the Medical History timeline has real demo data
// on first load instead of an empty state.
const SEED_CONSULTATIONS = [
  {
    patientName: 'Bilal Ahmed',
    doctorName: 'Dr. Kashif Mehmood',
    appointmentId: null,
    symptoms: 'Fever (101°F), body ache, mild cough for 2 days.',
    diagnosis: 'Viral fever',
    notes: 'Advised rest and hydration. No signs of bacterial infection; chest is clear on auscultation.',
    followUpInstructions: 'Return if fever persists beyond 4 days or breathing difficulty develops.',
    status: CONSULTATION_STATUS.COMPLETED,
    createdOn: seedDate(-1),
    completedOn: seedDate(-1),
    history: [],
    addenda: [],
  },
  {
    patientName: 'Hassan Raza',
    doctorName: 'Dr. Mariam Baig',
    appointmentId: null,
    symptoms: 'Red, itchy rash on forearms, onset after using a new detergent.',
    diagnosis: 'Contact dermatitis',
    notes: 'Prescribed topical corticosteroid cream. Advised to discontinue the suspected detergent.',
    followUpInstructions: 'Follow up in 1 week if rash does not improve.',
    status: CONSULTATION_STATUS.COMPLETED,
    createdOn: seedDate(-2),
    completedOn: seedDate(-2),
    history: [],
    addenda: [],
  },
];

function loadConsultations() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const cached = JSON.parse(raw);
    // Self-healing migration, same pattern as doctorService/patientService:
    // backfills any field added to this schema after some browsers already
    // cached consultation data, without touching real existing values.
    const migrated = cached.map((c) => ({
      history: [],
      addenda: [],
      appointmentId: null,
      ...c,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  }
  const seeded = SEED_CONSULTATIONS.map((c, i) => ({
    id: `CON-${String(i + 1).padStart(4, '0')}`,
    ...c,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function persist(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let consultations = loadConsultations();

function nextId() {
  const nums = consultations.map((c) => parseInt(c.id.split('-')[1], 10));
  const max = nums.length ? Math.max(...nums) : 0;
  return `CON-${String(max + 1).padStart(4, '0')}`;
}

// FR-06.4: create a Consultation record when a consultation begins. If one
// is already in progress for this appointment (e.g. the doctor closed the
// panel and reopened it), that same record is resumed instead of creating
// a duplicate.
export async function startConsultation({ appointmentId, patientName, doctorName }) {
  await sleep(400);

  if (appointmentId) {
    const existing = consultations.find(
      (c) => c.appointmentId === appointmentId && c.status === CONSULTATION_STATUS.IN_PROGRESS
    );
    if (existing) return existing;
  }

  const newConsultation = {
    id: nextId(),
    appointmentId: appointmentId || null,
    patientName,
    doctorName,
    ...EMPTY_CLINICAL_FIELDS,
    status: CONSULTATION_STATUS.IN_PROGRESS,
    createdOn: new Date().toISOString(),
    completedOn: null,
    history: [],
    addenda: [],
  };
  consultations = [newConsultation, ...consultations];
  persist(consultations);
  return newConsultation;
}

export async function getActiveConsultationForAppointment(appointmentId) {
  await sleep(200);
  if (!appointmentId) return null;
  return (
    consultations.find(
      (c) => c.appointmentId === appointmentId && c.status === CONSULTATION_STATUS.IN_PROGRESS
    ) || null
  );
}

export async function getConsultation(id) {
  await sleep(200);
  return consultations.find((c) => c.id === id) || null;
}

// FR-06.5 / FR-06.7: saves the clinical fields while the consultation is
// still in progress. The pre-save snapshot is pushed onto `history` first,
// so every draft revision is recoverable — this is the "consultation
// version history" the SRS asks for, distinct from post-completion addenda.
export async function updateConsultationDraft(id, fields) {
  await sleep(400);
  const target = consultations.find((c) => c.id === id);
  if (!target) throw new Error('Consultation not found.');
  if (target.status !== CONSULTATION_STATUS.IN_PROGRESS) {
    throw new Error('This consultation is already completed and cannot be edited directly — add an addendum instead.');
  }

  const snapshot = {
    symptoms: target.symptoms,
    diagnosis: target.diagnosis,
    notes: target.notes,
    followUpInstructions: target.followUpInstructions,
    savedOn: new Date().toISOString(),
  };

  consultations = consultations.map((c) =>
    c.id === id ? { ...c, ...fields, history: [...c.history, snapshot] } : c
  );
  persist(consultations);
  return consultations.find((c) => c.id === id);
}

// FR-06.6: marks the consultation completed. Also flips the linked
// appointment to 'completed' (FR-04.6) so the two stay in sync — a
// consultation is only ever completed through this path, never the
// appointment's own quick-complete action.
export async function completeConsultation(id) {
  await sleep(500);
  const target = consultations.find((c) => c.id === id);
  if (!target) throw new Error('Consultation not found.');
  if (!target.diagnosis.trim()) {
    throw new Error('Diagnosis is required before completing the consultation.');
  }

  consultations = consultations.map((c) =>
    c.id === id ? { ...c, status: CONSULTATION_STATUS.COMPLETED, completedOn: new Date().toISOString() } : c
  );
  persist(consultations);

  if (target.appointmentId) {
    try {
      await markAppointmentCompleted(target.appointmentId);
    } catch {
      // Appointment may already be completed/cancelled independently —
      // the consultation record itself is still valid either way.
    }
  }

  return consultations.find((c) => c.id === id);
}

// FR-06.3: once a consultation is finalized, its original fields are
// immutable. Corrections are recorded as a new addendum entry instead of
// modifying diagnosis/notes/symptoms in place.
export async function addAddendum(id, note) {
  await sleep(400);
  if (!note.trim()) throw new Error('Addendum note cannot be empty.');
  const target = consultations.find((c) => c.id === id);
  if (!target) throw new Error('Consultation not found.');
  if (target.status !== CONSULTATION_STATUS.COMPLETED) {
    throw new Error('Addenda can only be added to a completed consultation.');
  }

  const addendum = { note: note.trim(), addedOn: new Date().toISOString() };
  consultations = consultations.map((c) =>
    c.id === id ? { ...c, addenda: [...c.addenda, addendum] } : c
  );
  persist(consultations);
  return consultations.find((c) => c.id === id);
}

// FR-06.1 / FR-06.2: a patient's full chronological medical history —
// completed consultations only (an in-progress one isn't part of the
// historical record yet), newest first.
export async function getPatientMedicalHistory(patientName) {
  await sleep(350);
  if (!patientName) return [];
  return consultations
    .filter((c) => c.patientName === patientName && c.status === CONSULTATION_STATUS.COMPLETED)
    .sort((a, b) => new Date(b.completedOn) - new Date(a.completedOn));
}

// For a Doctor's "Medical History" browser: only patients they have
// actually completed a consultation with ("own patients" per SRS Section 9
// — Doctor access is F for own patients only).
export async function getPatientsWithHistoryForDoctor(doctorName) {
  await sleep(300);
  const names = new Set(
    consultations
      .filter((c) => c.doctorName === doctorName && c.status === CONSULTATION_STATUS.COMPLETED)
      .map((c) => c.patientName)
  );
  return [...names];
}

// For Admin's read-only oversight view: every patient with at least one
// completed consultation on file.
export async function getAllPatientsWithHistory() {
  await sleep(300);
  const names = new Set(
    consultations.filter((c) => c.status === CONSULTATION_STATUS.COMPLETED).map((c) => c.patientName)
  );
  return [...names];
}
