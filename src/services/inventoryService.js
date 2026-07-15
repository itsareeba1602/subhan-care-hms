import { sleep } from '../utils/helpers';

// MOCK inventory service — backed by localStorage, no backend yet.
// getInventoryItems() mimics a paginated/filterable API response shape
// ({ data, total }) so swapping in a real endpoint later is a drop-in change.
//
// Modeling note (SRS Section 16, InventoryItem entity): BatchNumber and
// ExpiryDate are attributes of InventoryItem itself, not of a separate
// "stock movement" record. That means each batch of a medicine/supply is
// its own InventoryItem row — receiving a fresh batch of an existing
// medicine creates a *new* row rather than overwriting the old one. This
// is also what real pharmacy stock control looks like (you can't merge two
// batches with different expiry dates into one number) and it's what makes
// DR-07 ("every dispensed medicine associated with a valid, non-expired
// batch") and FR-08.4 (expiry tracking) meaningful per-batch rather than
// per-medicine-name.

const STORAGE_KEY = 'subhan_care_inventory';
const SETTINGS_KEY = 'subhan_care_inventory_settings';

export const CATEGORIES = ['Medicine', 'Supply'];
export const UNITS = ['Tablet', 'Capsule', 'Bottle', 'Vial', 'Box', 'Strip', 'Pack', 'Unit'];

// FR-08.4: "flag ... items nearing expiry within a configurable window
// (default 30 days)". Kept as a system-wide setting (not per-item) since
// that is exactly how the SRS phrases it, and exposed via get/set below so
// an Admin/Pharmacist can tune it from the UI instead of it being a hidden
// constant only a developer could change.
const DEFAULT_EXPIRY_WINDOW_DAYS = 30;

export const STOCK_STATUS = { OUT: 'out', LOW: 'low', OK: 'ok' };
export const EXPIRY_STATUS = { EXPIRED: 'expired', NEARING: 'nearing', OK: 'ok' };

function daysFromNow(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// name/category/unit intentionally repeat real Panadol/Augmentin-style
// Pakistani hospital stock so the seed data reads as plausible, not
// placeholder ("Item 1", "Item 2").
const SEED_ITEMS = [
  { name: 'Panadol Extra 500mg', category: 'Medicine', batchNumber: 'PDX-2311', expiryDate: daysFromNow(240), quantityInStock: 320, reorderThreshold: 100, unit: 'Tablet', unitPrice: 4, supplierName: 'GSK Pakistan' },
  { name: 'Augmentin 625mg', category: 'Medicine', batchNumber: 'AUG-0087', expiryDate: daysFromNow(18), quantityInStock: 40, reorderThreshold: 50, unit: 'Strip', unitPrice: 320, supplierName: 'GSK Pakistan' },
  { name: 'Augmentin 625mg', category: 'Medicine', batchNumber: 'AUG-0102', expiryDate: daysFromNow(300), quantityInStock: 60, reorderThreshold: 50, unit: 'Strip', unitPrice: 330, supplierName: 'GSK Pakistan' },
  { name: 'Cetirizine 10mg', category: 'Medicine', batchNumber: 'CTZ-5521', expiryDate: daysFromNow(400), quantityInStock: 8, reorderThreshold: 30, unit: 'Strip', unitPrice: 45, supplierName: 'Getz Pharma' },
  { name: 'Betnovate Cream', category: 'Medicine', batchNumber: 'BTN-1187', expiryDate: daysFromNow(-5), quantityInStock: 12, reorderThreshold: 10, unit: 'Box', unitPrice: 180, supplierName: 'GSK Pakistan' },
  { name: 'Vitamin C 500mg', category: 'Medicine', batchNumber: 'VTC-9012', expiryDate: daysFromNow(500), quantityInStock: 0, reorderThreshold: 40, unit: 'Strip', unitPrice: 60, supplierName: 'Herbion' },
  { name: 'Surgical Gloves (M)', category: 'Supply', batchNumber: 'SGM-0021', expiryDate: daysFromNow(600), quantityInStock: 150, reorderThreshold: 50, unit: 'Box', unitPrice: 850, supplierName: 'MedEquip Traders' },
  { name: 'IV Cannula 22G', category: 'Supply', batchNumber: 'IVC-4471', expiryDate: daysFromNow(25), quantityInStock: 35, reorderThreshold: 40, unit: 'Box', unitPrice: 950, supplierName: 'MedEquip Traders' },
  { name: 'N95 Mask', category: 'Supply', batchNumber: 'N95-2298', expiryDate: daysFromNow(720), quantityInStock: 500, reorderThreshold: 100, unit: 'Box', unitPrice: 1200, supplierName: 'MedEquip Traders' },
  { name: 'Syringe 5ml', category: 'Supply', batchNumber: 'SYR-6634', expiryDate: daysFromNow(365), quantityInStock: 20, reorderThreshold: 60, unit: 'Box', unitPrice: 400, supplierName: 'MedEquip Traders' },
];

// SupplierID is modeled per SRS Section 16, but a full Supplier module
// (with its own CRUD, purchase-order history, etc. per the "Enhanced
// Supplier Entity") is out of scope for this sprint — this list exists
// only to give the Add/Edit Item form a consistent supplier picker instead
// of a free-text field that would let every item spell the same supplier a
// different way.
export const SUPPLIERS = ['GSK Pakistan', 'Getz Pharma', 'Herbion', 'MedEquip Traders', 'Highnoon Laboratories'];

function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    return { expiryWindowDays: DEFAULT_EXPIRY_WINDOW_DAYS, ...raw };
  } catch {
    return { expiryWindowDays: DEFAULT_EXPIRY_WINDOW_DAYS };
  }
}

let settings = loadSettings();

export function getExpiryWindowDays() {
  return settings.expiryWindowDays;
}

export async function setExpiryWindowDays(days) {
  await sleep(200);
  const n = Number(days);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error('Expiry alert window must be a whole number of days (1 or more).');
  }
  settings = { ...settings, expiryWindowDays: n };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  return settings;
}

function loadItems() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  const seeded = SEED_ITEMS.map((item, i) => ({
    id: `SC-INV-${String(i + 1).padStart(5, '0')}`,
    createdOn: new Date().toISOString(),
    updatedOn: new Date().toISOString(),
    ...item,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function persist(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let items = loadItems();

function nextId() {
  const nums = items.map((i) => parseInt(i.id.split('-')[2], 10)).filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `SC-INV-${String(max + 1).padStart(5, '0')}`;
}

// --- Derived status helpers (single source of truth — every list view,
// the dashboard widget, and the reports feature should all classify an
// item's stock/expiry state through these two functions, never by
// re-implementing the comparison inline). ---

// FR-08.3 / IR-06: low-stock is threshold-based; "out" (qty === 0) is
// surfaced as its own, more urgent status rather than folded into "low".
export function getStockStatus(item) {
  if (item.quantityInStock <= 0) return STOCK_STATUS.OUT;
  if (item.quantityInStock <= item.reorderThreshold) return STOCK_STATUS.LOW;
  return STOCK_STATUS.OK;
}

// FR-08.4 / DR-07: an expired batch is always flagged regardless of the
// configurable window, since DR-07 treats "expired" as an absolute
// disqualifier for dispensing, not just a soft warning.
export function getExpiryStatus(item, windowDays = getExpiryWindowDays()) {
  const today = new Date().setHours(0, 0, 0, 0);
  const expiry = new Date(item.expiryDate).setHours(0, 0, 0, 0);
  const msPerDay = 86400000;
  const daysLeft = Math.round((expiry - today) / msPerDay);
  if (daysLeft < 0) return EXPIRY_STATUS.EXPIRED;
  if (daysLeft <= windowDays) return EXPIRY_STATUS.NEARING;
  return EXPIRY_STATUS.OK;
}

function matchesFilters(item, { search, category, stockFilter }) {
  if (category && item.category !== category) return false;

  if (stockFilter) {
    const stock = getStockStatus(item);
    const expiry = getExpiryStatus(item);
    if (stockFilter === 'low' && stock !== STOCK_STATUS.LOW) return false;
    if (stockFilter === 'out' && stock !== STOCK_STATUS.OUT) return false;
    if (stockFilter === 'expiring' && expiry !== EXPIRY_STATUS.NEARING) return false;
    if (stockFilter === 'expired' && expiry !== EXPIRY_STATUS.EXPIRED) return false;
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.batchNumber.toLowerCase().includes(q) ||
      item.supplierName.toLowerCase().includes(q)
    );
  }
  return true;
}

export async function getInventoryItems({ search = '', category = '', stockFilter = '', page = 1, pageSize = 8 } = {}) {
  await sleep(400);
  let filtered = items.filter((i) => matchesFilters(i, { search, category, stockFilter }));

  // Most operationally urgent first: out of stock, then low stock, then
  // expired, then nearest expiry, then alphabetical — a Pharmacist opening
  // this page should see what needs attention without having to sort first.
  filtered = [...filtered].sort((a, b) => {
    const rank = (i) => {
      const s = getStockStatus(i);
      const e = getExpiryStatus(i);
      if (s === STOCK_STATUS.OUT) return 0;
      if (s === STOCK_STATUS.LOW) return 1;
      if (e === EXPIRY_STATUS.EXPIRED) return 2;
      if (e === EXPIRY_STATUS.NEARING) return 3;
      return 4;
    };
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);
  return { data, total };
}

// RR-04 / dashboard widget: aggregate counts + stock value, computed off
// the same getStockStatus/getExpiryStatus helpers used by the list so the
// summary can never drift out of sync with what the table actually shows.
export async function getInventorySummary() {
  await sleep(150);
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let expiringCount = 0;
  let expiredCount = 0;
  let stockValue = 0;

  for (const item of items) {
    const stock = getStockStatus(item);
    const expiry = getExpiryStatus(item);
    if (stock === STOCK_STATUS.LOW) lowStockCount += 1;
    if (stock === STOCK_STATUS.OUT) outOfStockCount += 1;
    if (expiry === EXPIRY_STATUS.NEARING) expiringCount += 1;
    if (expiry === EXPIRY_STATUS.EXPIRED) expiredCount += 1;
    stockValue += item.quantityInStock * (item.unitPrice || 0);
  }

  return {
    totalItems: items.length,
    lowStockCount,
    outOfStockCount,
    expiringCount,
    expiredCount,
    stockValue,
  };
}

function validateItemInput({ name, category, batchNumber, expiryDate, reorderThreshold, unitPrice }, { excludeId } = {}) {
  const errors = {};
  if (!name || !name.trim()) errors.name = 'Item name is required.';
  if (!CATEGORIES.includes(category)) errors.category = 'Select a valid category.';
  if (!batchNumber || !batchNumber.trim()) errors.batchNumber = 'Batch number is required.';
  if (!expiryDate) errors.expiryDate = 'Expiry date is required.';
  if (reorderThreshold === '' || reorderThreshold == null || Number(reorderThreshold) < 0) {
    errors.reorderThreshold = 'Reorder threshold must be 0 or more.';
  }
  if (unitPrice !== undefined && unitPrice !== '' && Number(unitPrice) < 0) {
    errors.unitPrice = 'Unit price cannot be negative.';
  }

  // FR-08.1 implies batch-level uniqueness: the same medicine name +
  // batch number identifies one physical batch. Without this check,
  // re-adding the same batch (e.g. a double-submitted form) would silently
  // create a duplicate row and split one batch's stock across two IDs.
  if (name && batchNumber) {
    const clash = items.find(
      (i) =>
        i.id !== excludeId &&
        i.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        i.batchNumber.trim().toLowerCase() === batchNumber.trim().toLowerCase()
    );
    if (clash) errors.batchNumber = `Batch ${batchNumber} already exists for ${name} (${clash.id}). Restock it instead of adding a duplicate.`;
  }

  return errors;
}

// FR-08.1: add a new medicine/supply batch record.
export async function addInventoryItem(input) {
  await sleep(500);
  const errors = validateItemInput(input);
  if (Object.keys(errors).length) {
    const err = new Error(Object.values(errors)[0]);
    err.fieldErrors = errors;
    throw err;
  }

  const quantity = Math.max(0, Math.floor(Number(input.quantityInStock) || 0));
  const newItem = {
    id: nextId(),
    name: input.name.trim(),
    category: input.category,
    batchNumber: input.batchNumber.trim(),
    expiryDate: input.expiryDate,
    quantityInStock: quantity,
    reorderThreshold: Math.max(0, Math.floor(Number(input.reorderThreshold) || 0)),
    unit: input.unit || UNITS[0],
    unitPrice: Math.max(0, Number(input.unitPrice) || 0),
    supplierName: input.supplierName || SUPPLIERS[0],
    createdOn: new Date().toISOString(),
    updatedOn: new Date().toISOString(),
  };
  items = [newItem, ...items];
  persist(items);
  return newItem;
}

// FR-08.1: update a batch's descriptive/tracking fields. Quantity can be
// corrected here too (e.g. fixing a data-entry typo), but routine
// stock movements should go through adjustStock() below so every quantity
// change funnels through the one function that enforces IR-06.
export async function updateInventoryItem(id, input) {
  await sleep(500);
  const target = items.find((i) => i.id === id);
  if (!target) throw new Error('Inventory item not found.');

  const errors = validateItemInput(input, { excludeId: id });
  if (Object.keys(errors).length) {
    const err = new Error(Object.values(errors)[0]);
    err.fieldErrors = errors;
    throw err;
  }

  const quantity = Math.max(0, Math.floor(Number(input.quantityInStock) || 0));
  items = items.map((i) =>
    i.id === id
      ? {
          ...i,
          name: input.name.trim(),
          category: input.category,
          batchNumber: input.batchNumber.trim(),
          expiryDate: input.expiryDate,
          quantityInStock: quantity,
          reorderThreshold: Math.max(0, Math.floor(Number(input.reorderThreshold) || 0)),
          unit: input.unit || i.unit,
          unitPrice: Math.max(0, Number(input.unitPrice) || 0),
          supplierName: input.supplierName || i.supplierName,
          updatedOn: new Date().toISOString(),
        }
      : i
  );
  persist(items);
  return items.find((i) => i.id === id);
}

// FR-08.1: "remove" — a batch record with zero stock left (fully consumed,
// wasted, or returned to supplier) can be permanently removed. Unlike
// Patients/Invoices, the SRS does not classify inventory batches as
// records requiring indefinite retention, so a hard delete is appropriate
// here — but only once the batch is actually empty, so stock can never be
// silently discarded through a delete instead of an accounted-for
// adjustment.
export async function deleteInventoryItem(id) {
  await sleep(400);
  const target = items.find((i) => i.id === id);
  if (!target) throw new Error('Inventory item not found.');
  if (target.quantityInStock > 0) {
    throw new Error('Cannot remove a batch that still has stock. Adjust its quantity to 0 first (dispense, return, or write off).');
  }
  items = items.filter((i) => i.id !== id);
  persist(items);
  return { id };
}

// Single choke point for every quantity change (restock, correction,
// write-off, dispensing). Centralizing it here is what makes IR-06 ("shall
// not allow inventory quantity to be reduced below zero or accept negative
// stock entries") true everywhere at once, instead of needing the same
// >= 0 guard copy-pasted into every caller.
// delta: positive to add stock (e.g. new delivery), negative to remove it.
export async function adjustStock(id, delta, reason = 'adjustment') {
  await sleep(400);
  const target = items.find((i) => i.id === id);
  if (!target) throw new Error('Inventory item not found.');

  const change = Math.floor(Number(delta));
  if (!Number.isFinite(change) || change === 0) {
    throw new Error('Enter a non-zero quantity to adjust.');
  }
  const nextQty = target.quantityInStock + change;
  if (nextQty < 0) {
    throw new Error(
      `Cannot remove ${Math.abs(change)} ${target.unit}(s) — only ${target.quantityInStock} currently in stock for batch ${target.batchNumber}.`
    );
  }
  // DR-07: dispensing (a negative "dispense" adjustment) from an expired
  // batch is never allowed, regardless of who initiates it.
  if (change < 0 && reason === 'dispense' && getExpiryStatus(target) === EXPIRY_STATUS.EXPIRED) {
    throw new Error(`Batch ${target.batchNumber} of ${target.name} expired on ${target.expiryDate} and cannot be dispensed.`);
  }

  items = items.map((i) => (i.id === id ? { ...i, quantityInStock: nextQty, updatedOn: new Date().toISOString() } : i));
  persist(items);
  return items.find((i) => i.id === id);
}

// FR-08.2: "automatically deduct stock quantity when a prescribed medicine
// is dispensed against a prescription." Called from prescriptionService on
// dispense. Deliberately best-effort and non-throwing: a clinical
// dispensing action must never fail *because* of an inventory bookkeeping
// problem — instead this reports back exactly what happened (or didn't)
// per medicine so the caller can surface it as a warning.
//
// Matching strategy: by medicine name (case-insensitive), FEFO
// (first-expiry-first-out) across all of that medicine's non-expired
// batches — the standard pharmacy stock-rotation rule, and what DR-07
// requires in practice (always consume the batch closest to expiring,
// never an already-expired one). Since a Prescription line does not
// currently carry an explicit dispense quantity (only dosage/frequency/
// duration free text), each matched line deducts 1 unit as a conservative,
// literal stock movement rather than guessing a number by parsing
// "Every 6 hours" / "3 days" — that kind of inference is fragile and would
// misrepresent real stock levels. When Prescription creation captures an
// explicit quantity, this function's `qty` param is the only thing that
// needs to change.
export async function dispenseMedicinesFromStock(medicines, qty = 1) {
  const results = [];
  for (const medicine of medicines) {
    const name = (medicine.name || '').trim().toLowerCase();
    if (!name) continue;

    const candidates = items
      .filter((i) => i.name.trim().toLowerCase() === name && getExpiryStatus(i) !== EXPIRY_STATUS.EXPIRED)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    const batch = candidates.find((i) => i.quantityInStock >= qty);

    if (!batch) {
      const anyBatchExists = items.some((i) => i.name.trim().toLowerCase() === name);
      results.push({
        medicine: medicine.name,
        deducted: false,
        reason: anyBatchExists
          ? 'No batch with sufficient non-expired stock was found.'
          : 'Not tracked in inventory yet.',
      });
      continue;
    }

    try {
      // eslint-disable-next-line no-await-in-loop
      await adjustStock(batch.id, -qty, 'dispense');
      results.push({ medicine: medicine.name, deducted: true, batchId: batch.id, batchNumber: batch.batchNumber, qty });
    } catch (err) {
      results.push({ medicine: medicine.name, deducted: false, reason: err.message });
    }
  }
  return results;
}
