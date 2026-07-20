import { sleep } from '../utils/helpers';
import { getPatients } from './patientService';

// MOCK billing service — backed by localStorage, no backend yet.
// Per SRS FR-07.1, an invoice covers consultation fee + medicines + any
// additional services, so line items carry a `type` for that breakdown.

const STORAGE_KEY = 'subhan_care_invoices';

export const PAYMENT_METHODS = ['Cash', 'Card', 'Bank Transfer', 'JazzCash', 'EasyPaisa'];
// UC-05 alternate flow: "If payment is partial, system records the invoice
// as 'Partially Paid' with outstanding balance" — this status was missing
// entirely; markInvoicePaid only ever recorded a full PAID before.
export const INVOICE_STATUS = { PAID: 'paid', UNPAID: 'unpaid', PARTIALLY_PAID: 'partially-paid' };
export const LINE_ITEM_TYPES = ['Consultation', 'Medicine', 'Lab Test', 'Other'];

function seedDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

function total(items) {
  return items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
}

const SEED_ITEMS_A = [{ type: 'Consultation', description: 'Cardiology consultation', qty: 1, unitPrice: 2500 }];
const SEED_ITEMS_B = [
  { type: 'Consultation', description: 'General checkup', qty: 1, unitPrice: 1500 },
  { type: 'Medicine', description: 'Panadol Extra x2', qty: 2, unitPrice: 120 },
];
const SEED_ITEMS_C = [
  { type: 'Consultation', description: 'Pediatric consultation', qty: 1, unitPrice: 1800 },
  { type: 'Lab Test', description: 'CBC', qty: 1, unitPrice: 900 },
];

const SEED_INVOICES = [
  { patientName: 'Muhammad Usman', items: SEED_ITEMS_A, paymentMethod: 'Card', status: INVOICE_STATUS.PAID, date: seedDate(-1) },
  { patientName: 'Ayesha Siddiqui', items: SEED_ITEMS_B, paymentMethod: 'Cash', status: INVOICE_STATUS.PAID, date: seedDate(-2) },
  { patientName: 'Fatima Noor', items: SEED_ITEMS_C, paymentMethod: '', status: INVOICE_STATUS.UNPAID, date: seedDate(0) },
  { patientName: 'Hassan Raza', items: SEED_ITEMS_A, paymentMethod: '', status: INVOICE_STATUS.UNPAID, date: seedDate(-3) },
];

function loadInvoices() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const cached = JSON.parse(raw);
    // Self-healing migration, same pattern used across the other services:
    // backfills amountPaid/balanceDue for invoices cached before those
    // fields existed, without touching any invoice's real total or status.
    const migrated = cached.map((inv) => ({
      amountPaid: inv.status === INVOICE_STATUS.PAID ? inv.total : 0,
      balanceDue: inv.status === INVOICE_STATUS.PAID ? 0 : inv.total,
      creditNotes: [],
      ...inv,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  }
  const seeded = SEED_INVOICES.map((inv, i) => {
    const invTotal = total(inv.items);
    const amountPaid = inv.status === INVOICE_STATUS.PAID ? invTotal : 0;
    return {
      id: `INV-${String(i + 1).padStart(4, '0')}`,
      total: invTotal,
      amountPaid,
      balanceDue: invTotal - amountPaid,
      creditNotes: [],
      ...inv,
    };
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function persist(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let invoices = loadInvoices();

function nextId() {
  const nums = invoices.map((i) => parseInt(i.id.split('-')[1], 10));
  const max = nums.length ? Math.max(...nums) : 0;
  return `INV-${String(max + 1).padStart(4, '0')}`;
}

function nextCreditNoteId() {
  const nums = invoices
    .flatMap((i) => i.creditNotes || [])
    .map((c) => parseInt(c.id.split('-')[1], 10));
  const max = nums.length ? Math.max(...nums) : 0;
  return `CN-${String(max + 1).padStart(4, '0')}`;
}

export async function getInvoices({ search = '', status = '', dateFrom = '', dateTo = '', page = 1, pageSize = 8 } = {}) {
  await sleep(400);
  let filtered = invoices;

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (i) => i.patientName.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)
    );
  }
  if (status) filtered = filtered.filter((i) => i.status === status);
  if (dateFrom) filtered = filtered.filter((i) => i.date.slice(0, 10) >= dateFrom);
  if (dateTo) filtered = filtered.filter((i) => i.date.slice(0, 10) <= dateTo);

  filtered = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  const invTotal = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);
  return { data, total: invTotal };
}

// FR-07.5: "view outstanding/unpaid invoices ... filtered by patient or
// date range." dateFrom/dateTo were entirely absent before — this only
// ever summarized *all* unpaid invoices with no way to scope by period.
export async function getOutstandingSummary({ dateFrom = '', dateTo = '' } = {}) {
  await sleep(150);
  let unpaid = invoices.filter(
    (i) => i.status === INVOICE_STATUS.UNPAID || i.status === INVOICE_STATUS.PARTIALLY_PAID
  );
  if (dateFrom) unpaid = unpaid.filter((i) => i.date.slice(0, 10) >= dateFrom);
  if (dateTo) unpaid = unpaid.filter((i) => i.date.slice(0, 10) <= dateTo);
  return { count: unpaid.length, amount: unpaid.reduce((sum, i) => sum + i.balanceDue, 0) };
}

// For the Generate Invoice form's patient select.
export async function getPatientOptions() {
  const { data } = await getPatients({ page: 1, pageSize: 500 });
  return data;
}

export async function generateInvoice({ patientName, items }) {
  await sleep(500);
  if (!items.length) throw new Error('Add at least one line item before generating the invoice.');

  const invTotal = total(items);
  const newInvoice = {
    id: nextId(),
    patientName,
    items,
    total: invTotal,
    amountPaid: 0,
    balanceDue: invTotal,
    creditNotes: [],
    paymentMethod: '',
    status: INVOICE_STATUS.UNPAID,
    date: new Date().toISOString(),
  };
  invoices = [newInvoice, ...invoices];
  persist(invoices);
  return newInvoice;
}

// FR-07.2 / UC-05: records a payment against an invoice. If the amount
// covers the full remaining balance, the invoice is fully Paid; otherwise
// it's recorded as Partially Paid with the remaining balance tracked, and
// can be paid down further in subsequent calls. amountPaid defaults to the
// full outstanding balance so existing "Mark as Paid" callers keep working
// unchanged.
export async function markInvoicePaid(id, paymentMethod, amountPaid) {
  await sleep(400);
  const target = invoices.find((i) => i.id === id);
  if (!target) throw new Error('Invoice not found.');

  const payment = amountPaid == null ? target.balanceDue : Number(amountPaid);
  if (payment <= 0) throw new Error('Payment amount must be greater than zero.');
  if (payment > target.balanceDue) throw new Error('Payment cannot exceed the outstanding balance.');

  const newAmountPaid = target.amountPaid + payment;
  const newBalance = target.total - newAmountPaid;
  const newStatus = newBalance <= 0 ? INVOICE_STATUS.PAID : INVOICE_STATUS.PARTIALLY_PAID;

  invoices = invoices.map((i) =>
    i.id === id
      ? { ...i, status: newStatus, paymentMethod, amountPaid: newAmountPaid, balanceDue: Math.max(0, newBalance) }
      : i
  );
  persist(invoices);
  return invoices.find((i) => i.id === id);
}

// FR-07.4 / IR-02: "The system shall not permit deletion of a finalized
// invoice; corrections shall only be made through a recorded credit note
// linked to the original invoice." There is deliberately no deleteInvoice
// export anywhere in this service — a credit note is the *only* correction
// path, and it never touches the original invoice's `items`/`total` (those
// stay exactly as finalized; only `balanceDue`/`status` move, and the
// credit itself is kept as a permanent, reasoned, timestamped record
// linked to the invoice for audit purposes).
export async function issueCreditNote(id, { reason, amount }) {
  await sleep(400);
  const target = invoices.find((i) => i.id === id);
  if (!target) throw new Error('Invoice not found.');
  if (!reason || !reason.trim()) throw new Error('A reason is required for the credit note.');

  const amt = Number(amount);
  if (!amt || amt <= 0) throw new Error('Credit amount must be greater than zero.');

  const alreadyCredited = (target.creditNotes || []).reduce((sum, c) => sum + c.amount, 0);
  const creditableRemaining = target.total - alreadyCredited;
  if (amt > creditableRemaining) {
    throw new Error(
      `Credit note cannot exceed the invoice's remaining creditable amount (Rs. ${creditableRemaining.toLocaleString('en-PK')}).`
    );
  }

  const creditNote = {
    id: nextCreditNoteId(),
    amount: amt,
    reason: reason.trim(),
    issuedOn: new Date().toISOString(),
  };

  invoices = invoices.map((i) => {
    if (i.id !== id) return i;
    const creditNotes = [...(i.creditNotes || []), creditNote];
    const totalCredited = creditNotes.reduce((sum, c) => sum + c.amount, 0);
    // A credit note reduces what's still owed exactly like a payment
    // would, without being recorded as one — so an invoice that's been
    // fully credited (with or without a partial payment already on it)
    // settles to Paid/zero-balance rather than sitting outstanding
    // forever with nothing left to actually collect.
    const newBalance = Math.max(0, i.total - totalCredited - i.amountPaid);
    const newStatus =
      newBalance <= 0 ? INVOICE_STATUS.PAID : i.amountPaid > 0 ? INVOICE_STATUS.PARTIALLY_PAID : INVOICE_STATUS.UNPAID;
    return { ...i, creditNotes, balanceDue: newBalance, status: newStatus };
  });
  persist(invoices);
  return invoices.find((i) => i.id === id);
}
