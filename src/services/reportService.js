import { getPatients } from './patientService';
import { getAppointments } from './appointmentService';
import { getInvoices } from './billingService';
import { getInventoryItems, getInventorySummary } from './inventoryService';
import { sleep } from '../utils/helpers';
import { formatDate, formatCurrency } from '../utils/formatters';

// FR-09.1: "The system shall allow an Admin to generate reports on patient
// registrations, appointments, revenue, and inventory over a selected date
// range." Each report type below hits the existing per-module service
// (not a new backing store) and reshapes the result into one common
// { columns, rows, summary } shape ReportsPage.jsx can render generically —
// so adding a 5th report type later only means writing one more builder
// function, not touching the page.

export const REPORT_TYPES = [
  { key: 'registrations', label: 'Patient Registrations' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'inventory', label: 'Inventory' },
];

function inRange(isoDate, dateFrom, dateTo) {
  const d = isoDate.slice(0, 10);
  if (dateFrom && d < dateFrom) return false;
  if (dateTo && d > dateTo) return false;
  return true;
}

async function buildRegistrationsReport(dateFrom, dateTo) {
  const { data } = await getPatients({ page: 1, pageSize: 5000, includeInactive: true });
  const filtered = data.filter((p) => inRange(p.registeredOn, dateFrom, dateTo));
  const byGender = filtered.reduce((acc, p) => {
    acc[p.gender] = (acc[p.gender] || 0) + 1;
    return acc;
  }, {});

  return {
    columns: ['Patient ID', 'Name', 'Gender', 'Contact', 'Registered On'],
    rows: filtered
      .sort((a, b) => new Date(b.registeredOn) - new Date(a.registeredOn))
      .map((p) => [p.id, p.fullName, p.gender, p.mobile || '—', formatDate(p.registeredOn)]),
    summary: [
      { label: 'Total Registrations', value: filtered.length },
      ...Object.entries(byGender).map(([g, c]) => ({ label: `${g} Patients`, value: c })),
    ],
  };
}

async function buildAppointmentsReport(dateFrom, dateTo) {
  const { data } = await getAppointments({ page: 1, pageSize: 5000 });
  const filtered = data.filter((a) => inRange(a.date, dateFrom, dateTo));
  const byStatus = filtered.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return {
    columns: ['Patient', 'Doctor', 'Date', 'Time', 'Status'],
    rows: filtered
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((a) => [a.patientName, a.doctorName, formatDate(a.date), a.timeSlot, a.status]),
    summary: [
      { label: 'Total Appointments', value: filtered.length },
      ...Object.entries(byStatus).map(([s, c]) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: c })),
    ],
  };
}

async function buildRevenueReport(dateFrom, dateTo) {
  // getInvoices already supports dateFrom/dateTo server-side (FR-07.5) —
  // reused here rather than re-implementing the same date filter twice.
  const { data } = await getInvoices({ dateFrom, dateTo, page: 1, pageSize: 5000 });
  const totalBilled = data.reduce((sum, i) => sum + i.total, 0);
  const totalCollected = data.reduce((sum, i) => sum + (i.amountPaid || 0), 0);
  const totalOutstanding = data.reduce((sum, i) => sum + (i.balanceDue || 0), 0);
  const totalCredited = data.reduce(
    (sum, i) => sum + (i.creditNotes || []).reduce((s, c) => s + c.amount, 0),
    0
  );

  return {
    columns: ['Invoice ID', 'Patient', 'Date', 'Total', 'Paid', 'Balance Due', 'Status'],
    rows: data
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((i) => [
        i.id,
        i.patientName,
        formatDate(i.date),
        formatCurrency(i.total),
        formatCurrency(i.amountPaid || 0),
        formatCurrency(i.balanceDue || 0),
        i.status,
      ]),
    summary: [
      { label: 'Invoices', value: data.length },
      { label: 'Total Billed', value: formatCurrency(totalBilled) },
      { label: 'Total Collected', value: formatCurrency(totalCollected) },
      { label: 'Outstanding', value: formatCurrency(totalOutstanding) },
      { label: 'Credited', value: formatCurrency(totalCredited) },
    ],
  };
}

// Inventory is a live stock snapshot, not a dated transaction log (there's
// no "inventory event" history to filter by date range yet) — so this
// report reflects current stock state regardless of dateFrom/dateTo,
// which the ReportsPage UI makes clear by disabling the date pickers for
// this report type rather than silently ignoring them.
async function buildInventoryReport() {
  const { data } = await getInventoryItems({ page: 1, pageSize: 5000 });
  const summary = await getInventorySummary();

  return {
    columns: ['Item', 'Batch', 'Category', 'Quantity', 'Expiry Date', 'Status'],
    rows: data.map((i) => [
      i.name,
      i.batchNumber,
      i.category,
      `${i.quantityInStock} ${i.unit}`,
      formatDate(i.expiryDate),
      i.quantityInStock === 0 ? 'Out of Stock' : i.quantityInStock <= i.reorderThreshold ? 'Low Stock' : 'OK',
    ]),
    summary: [
      { label: 'Total Items', value: data.length },
      { label: 'Low Stock', value: summary.lowStockCount },
      { label: 'Out of Stock', value: summary.outOfStockCount },
      { label: 'Expiring Soon', value: summary.expiringCount },
      { label: 'Expired', value: summary.expiredCount },
    ],
  };
}

export async function generateReport(type, { dateFrom = '', dateTo = '' } = {}) {
  await sleep(400);
  switch (type) {
    case 'registrations':
      return buildRegistrationsReport(dateFrom, dateTo);
    case 'appointments':
      return buildAppointmentsReport(dateFrom, dateTo);
    case 'revenue':
      return buildRevenueReport(dateFrom, dateTo);
    case 'inventory':
      return buildInventoryReport();
    default:
      throw new Error('Unknown report type.');
  }
}

// FR-09.3 ("should allow export in PDF and Excel format", Low priority).
// CSV is the dependency-free, universally Excel-compatible substitute used
// here — same reasoning as the billing receipt using window.print() for
// PDF instead of pulling in a PDF library for a frontend-only build.
export function reportToCSV(report, reportLabel) {
  const lines = [
    reportLabel,
    '',
    report.columns.join(','),
    ...report.rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ];
  return lines.join('\n');
}

export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
