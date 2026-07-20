import { describe, it, expect, beforeEach, vi } from 'vitest';

// Each service module holds its state in a module-level `let items = ...`
// initialized once at import time and backed by localStorage. To get a
// clean, predictable seed for every test (rather than one test's mutations
// leaking into the next), each test clears localStorage and forces a fresh
// module instance via vi.resetModules() + a dynamic import.
async function freshInventoryService() {
  vi.resetModules();
  localStorage.clear();
  return import('../inventoryService.js');
}

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe('inventoryService — seed data & status helpers', () => {
  it('seeds the expected number of batches on first load', async () => {
    const svc = await freshInventoryService();
    const { total } = await svc.getInventoryItems({ pageSize: 100 });
    expect(total).toBe(10);
  });

  it('getStockStatus: OUT when quantity is 0, LOW at/under threshold, OK above it', async () => {
    const svc = await freshInventoryService();
    expect(svc.getStockStatus({ quantityInStock: 0, reorderThreshold: 40 })).toBe(svc.STOCK_STATUS.OUT);
    expect(svc.getStockStatus({ quantityInStock: 8, reorderThreshold: 30 })).toBe(svc.STOCK_STATUS.LOW);
    expect(svc.getStockStatus({ quantityInStock: 320, reorderThreshold: 100 })).toBe(svc.STOCK_STATUS.OK);
  });

  it('getExpiryStatus: flags an already-expired batch regardless of the alert window', async () => {
    const svc = await freshInventoryService();
    const expired = { expiryDate: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10) };
    expect(svc.getExpiryStatus(expired, 30)).toBe(svc.EXPIRY_STATUS.EXPIRED);
  });

  it('getExpiryStatus: NEARING inside the window, OK outside it', async () => {
    const svc = await freshInventoryService();
    const soon = { expiryDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10) };
    const later = { expiryDate: new Date(Date.now() + 200 * 86400000).toISOString().slice(0, 10) };
    expect(svc.getExpiryStatus(soon, 30)).toBe(svc.EXPIRY_STATUS.NEARING);
    expect(svc.getExpiryStatus(later, 30)).toBe(svc.EXPIRY_STATUS.OK);
  });
});

describe('inventoryService — adjustStock (IR-06 stock floor + DR-07)', () => {
  it('increases stock on a positive delta (restock)', async () => {
    const svc = await freshInventoryService();
    const { data } = await svc.getInventoryItems({ search: 'Panadol' });
    const before = data[0].quantityInStock;
    const updated = await svc.adjustStock(data[0].id, 50, 'restock');
    expect(updated.quantityInStock).toBe(before + 50);
  });

  it('IR-06: rejects an adjustment that would take stock below zero', async () => {
    const svc = await freshInventoryService();
    const { data } = await svc.getInventoryItems({ search: 'Cetirizine' }); // seeded at qty 8
    await expect(svc.adjustStock(data[0].id, -9, 'dispense')).rejects.toThrow(/only 8/i);
  });

  it('IR-06: stock is unchanged after a rejected adjustment (no partial deduction)', async () => {
    const svc = await freshInventoryService();
    const { data } = await svc.getInventoryItems({ search: 'Cetirizine' });
    const before = data[0].quantityInStock;
    await expect(svc.adjustStock(data[0].id, -999, 'dispense')).rejects.toThrow();
    const { data: after } = await svc.getInventoryItems({ search: 'Cetirizine' });
    expect(after[0].quantityInStock).toBe(before);
  });

  it('DR-07: refuses to dispense from a batch that has already expired', async () => {
    const svc = await freshInventoryService();
    const { data } = await svc.getInventoryItems({ search: 'Betnovate' }); // seeded 5 days expired
    await expect(svc.adjustStock(data[0].id, -1, 'dispense')).rejects.toThrow(/expired/i);
  });

  it('a non-dispense adjustment on an expired batch is still allowed (e.g. writing off expired stock)', async () => {
    const svc = await freshInventoryService();
    const { data } = await svc.getInventoryItems({ search: 'Betnovate' });
    const updated = await svc.adjustStock(data[0].id, -data[0].quantityInStock, 'write-off');
    expect(updated.quantityInStock).toBe(0);
  });

  it('rejects a zero-quantity adjustment', async () => {
    const svc = await freshInventoryService();
    const { data } = await svc.getInventoryItems({ search: 'Panadol' });
    await expect(svc.adjustStock(data[0].id, 0)).rejects.toThrow(/non-zero/i);
  });
});

describe('inventoryService — dispenseMedicinesFromStock (FR-08.2 automatic deduction)', () => {
  it('deducts from the earliest-expiring batch that can cover the full quantity (FEFO)', async () => {
    const svc = await freshInventoryService();
    // Seeded: Augmentin 625mg has two batches — AUG-0087 (qty 40, expires
    // in 18 days) and AUG-0102 (qty 60, expires in 300 days). A request for
    // 10 units should come out of the sooner-to-expire batch since it has
    // enough stock to cover it alone.
    const results = await svc.dispenseMedicinesFromStock([{ name: 'Augmentin 625mg' }], 10);
    expect(results[0].deducted).toBe(true);
    expect(results[0].batchNumber).toBe('AUG-0087');

    const { data } = await svc.getInventoryItems({ search: 'AUG-0087' });
    expect(data[0].quantityInStock).toBe(30); // 40 - 10
  });

  it('falls through to a later-expiring batch when the earliest one cannot cover the full quantity', async () => {
    const svc = await freshInventoryService();
    // AUG-0087 only has 40 in stock — a request for 50 can't be satisfied
    // by that batch alone, so it must come from AUG-0102 (qty 60) instead.
    const results = await svc.dispenseMedicinesFromStock([{ name: 'Augmentin 625mg' }], 50);
    expect(results[0].deducted).toBe(true);
    expect(results[0].batchNumber).toBe('AUG-0102');

    const { data: untouched } = await svc.getInventoryItems({ search: 'AUG-0087' });
    expect(untouched[0].quantityInStock).toBe(40); // unchanged
  });

  it('DR-07: never deducts from an expired batch, even if it is the only one tracked', async () => {
    const svc = await freshInventoryService();
    const results = await svc.dispenseMedicinesFromStock([{ name: 'Betnovate Cream' }], 1);
    expect(results[0].deducted).toBe(false);
    expect(results[0].reason).toMatch(/no batch with sufficient non-expired stock/i);
  });

  it('reports a medicine with no matching inventory record instead of throwing', async () => {
    const svc = await freshInventoryService();
    const results = await svc.dispenseMedicinesFromStock([{ name: 'Not A Real Medicine' }], 1);
    expect(results[0].deducted).toBe(false);
    expect(results[0].reason).toMatch(/not tracked/i);
  });

  it('is non-throwing and processes every medicine on the list even if one fails', async () => {
    const svc = await freshInventoryService();
    const results = await svc.dispenseMedicinesFromStock(
      [{ name: 'Not Tracked' }, { name: 'Panadol Extra 500mg' }],
      1
    );
    expect(results).toHaveLength(2);
    expect(results[0].deducted).toBe(false);
    expect(results[1].deducted).toBe(true);
  });
});

describe('inventoryService — addInventoryItem / deleteInventoryItem', () => {
  it('rejects a duplicate batch number for the same medicine name', async () => {
    const svc = await freshInventoryService();
    await expect(
      svc.addInventoryItem({
        name: 'Panadol Extra 500mg',
        category: 'Medicine',
        batchNumber: 'PDX-2311', // already seeded
        expiryDate: '2027-01-01',
        quantityInStock: 10,
        reorderThreshold: 5,
      })
    ).rejects.toThrow(/already exists/i);
  });

  it('IR-06: never accepts a negative quantity — clamps to zero instead', async () => {
    const svc = await freshInventoryService();
    const item = await svc.addInventoryItem({
      name: 'Test Item',
      category: 'Medicine',
      batchNumber: 'TEST-0001',
      expiryDate: '2027-01-01',
      quantityInStock: -50,
      reorderThreshold: 5,
    });
    expect(item.quantityInStock).toBe(0);
  });

  it('refuses to remove a batch that still has stock', async () => {
    const svc = await freshInventoryService();
    const { data } = await svc.getInventoryItems({ search: 'Panadol' });
    await expect(svc.deleteInventoryItem(data[0].id)).rejects.toThrow(/still has stock/i);
  });

  it('allows removing a batch once its stock is zero', async () => {
    const svc = await freshInventoryService();
    const { data } = await svc.getInventoryItems({ search: 'Vitamin C' }); // seeded at qty 0
    await expect(svc.deleteInventoryItem(data[0].id)).resolves.toEqual({ id: data[0].id });
  });
});
