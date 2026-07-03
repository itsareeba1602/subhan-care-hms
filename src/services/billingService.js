import { sleep } from '../utils/helpers';
import { getPatients } from './patientService';

// MOCK billing service — backed by localStorage, no backend yet.
// Per SRS FR-07.1, an invoice covers consultation fee + medicines + any
// additional services, so line items carry a `type` for that breakdown.

const STORAGE_KEY = 'subhan_care_invoices';

export const PAYMENT_METHODS = ['Cash', 'Card', 'Bank Transfer', 'JazzCash', 'EasyPaisa'];
export const INVOICE_STATUS = { PAID: 'paid', UNPAID: 'unpaid' };
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
  if (raw) return JSON.parse(raw);
  const seeded = SEED_INVOICES.map((inv, i) => ({
    id: `INV-${String(i + 1).padStart(4, '0')}`,
    total: total(inv.items),
    ...inv,
  }));
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

export async function getInvoices({ search = '', status = '', page = 1, pageSize = 8 } = {}) {
  await sleep(400);
  let filtered = invoices;

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (i) => i.patientName.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)
    );
  }
  if (status) filtered = filtered.filter((i) => i.status === status);

  filtered = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  const invTotal = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);
  return { data, total: invTotal };
}

export async function getOutstandingSummary() {
  await sleep(150);
  const unpaid = invoices.filter((i) => i.status === INVOICE_STATUS.UNPAID);
  return { count: unpaid.length, amount: unpaid.reduce((sum, i) => sum + i.total, 0) };
}

// For the Generate Invoice form's patient select.
export async function getPatientOptions() {
  const { data } = await getPatients({ page: 1, pageSize: 500 });
  return data;
}

export async function generateInvoice({ patientName, items }) {
  await sleep(500);
  if (!items.length) throw new Error('Add at least one line item before generating the invoice.');

  const newInvoice = {
    id: nextId(),
    patientName,
    items,
    total: total(items),
    paymentMethod: '',
    status: INVOICE_STATUS.UNPAID,
    date: new Date().toISOString(),
  };
  invoices = [newInvoice, ...invoices];
  persist(invoices);
  return newInvoice;
}

export async function markInvoicePaid(id, paymentMethod) {
  await sleep(400);
  invoices = invoices.map((i) =>
    i.id === id ? { ...i, status: INVOICE_STATUS.PAID, paymentMethod } : i
  );
  persist(invoices);
  return invoices.find((i) => i.id === id);
}
