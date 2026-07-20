import { describe, it, expect, beforeEach, vi } from 'vitest';

async function freshBillingService() {
  vi.resetModules();
  localStorage.clear();
  return import('../billingService.js');
}

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe('billingService — seed data', () => {
  it('seeds 4 invoices with correctly computed totals', async () => {
    const svc = await freshBillingService();
    const { data, total: count } = await svc.getInvoices({ pageSize: 20 });
    expect(count).toBe(4);
    const usman = data.find((i) => i.patientName === 'Muhammad Usman');
    expect(usman.total).toBe(2500);
    expect(usman.status).toBe(svc.INVOICE_STATUS.PAID);
    expect(usman.balanceDue).toBe(0);
  });
});

describe('billingService — markInvoicePaid (FR-07.2 partial payment)', () => {
  it('a full payment (no amount specified) settles the invoice to Paid', async () => {
    const svc = await freshBillingService();
    const { data } = await svc.getInvoices({ search: 'Fatima' }); // seeded UNPAID, total 2700
    const updated = await svc.markInvoicePaid(data[0].id, 'Cash');
    expect(updated.status).toBe(svc.INVOICE_STATUS.PAID);
    expect(updated.balanceDue).toBe(0);
    expect(updated.amountPaid).toBe(2700);
  });

  it('a partial payment moves the invoice to Partially Paid with the correct remaining balance', async () => {
    const svc = await freshBillingService();
    const { data } = await svc.getInvoices({ search: 'Fatima' }); // total 2700
    const updated = await svc.markInvoicePaid(data[0].id, 'Cash', 1000);
    expect(updated.status).toBe(svc.INVOICE_STATUS.PARTIALLY_PAID);
    expect(updated.amountPaid).toBe(1000);
    expect(updated.balanceDue).toBe(1700);
  });

  it('a second partial payment accumulates on top of the first and can fully settle the invoice', async () => {
    const svc = await freshBillingService();
    const { data } = await svc.getInvoices({ search: 'Fatima' }); // total 2700
    await svc.markInvoicePaid(data[0].id, 'Cash', 1000);
    const final = await svc.markInvoicePaid(data[0].id, 'Card', 1700);
    expect(final.status).toBe(svc.INVOICE_STATUS.PAID);
    expect(final.amountPaid).toBe(2700);
    expect(final.balanceDue).toBe(0);
  });

  it('rejects a payment that exceeds the outstanding balance', async () => {
    const svc = await freshBillingService();
    const { data } = await svc.getInvoices({ search: 'Fatima' }); // total 2700
    await expect(svc.markInvoicePaid(data[0].id, 'Cash', 5000)).rejects.toThrow(/cannot exceed/i);
  });

  it('rejects a zero or negative payment amount', async () => {
    const svc = await freshBillingService();
    const { data } = await svc.getInvoices({ search: 'Fatima' });
    await expect(svc.markInvoicePaid(data[0].id, 'Cash', 0)).rejects.toThrow(/greater than zero/i);
    await expect(svc.markInvoicePaid(data[0].id, 'Cash', -100)).rejects.toThrow(/greater than zero/i);
  });

  it('rejects any payment on an invoice that is already fully paid', async () => {
    const svc = await freshBillingService();
    const { data } = await svc.getInvoices({ search: 'Muhammad Usman' }); // seeded PAID
    await expect(svc.markInvoicePaid(data[0].id, 'Cash', 100)).rejects.toThrow(/cannot exceed/i);
  });
});

describe('billingService — issueCreditNote (FR-07.4 / IR-02)', () => {
  it('reduces the balance due without changing the original total or line items', async () => {
    const svc = await freshBillingService();
    const { data } = await svc.getInvoices({ search: 'Hassan' }); // total 2500, UNPAID
    const originalTotal = data[0].total;
    const originalItems = data[0].items;

    const updated = await svc.issueCreditNote(data[0].id, { reason: 'Billing correction', amount: 500 });
    expect(updated.balanceDue).toBe(2000);
    expect(updated.total).toBe(originalTotal);
    expect(updated.items).toEqual(originalItems);
    expect(updated.creditNotes).toHaveLength(1);
    expect(updated.creditNotes[0].amount).toBe(500);
    expect(updated.creditNotes[0].reason).toBe('Billing correction');
  });

  it('a credit note that fully covers the remaining balance settles the invoice as Paid', async () => {
    const svc = await freshBillingService();
    const { data } = await svc.getInvoices({ search: 'Hassan' }); // total 2500, UNPAID, no prior payment
    const updated = await svc.issueCreditNote(data[0].id, { reason: 'Full waiver', amount: 2500 });
    expect(updated.status).toBe(svc.INVOICE_STATUS.PAID);
    expect(updated.balanceDue).toBe(0);
  });

  it('a credit note that only partially covers the balance keeps the invoice Unpaid (if nothing was ever paid)', async () => {
    const svc = await freshBillingService();
    const { data } = await svc.getInvoices({ search: 'Hassan' }); // total 2500, UNPAID
    const updated = await svc.issueCreditNote(data[0].id, { reason: 'Partial correction', amount: 500 });
    expect(updated.status).toBe(svc.INVOICE_STATUS.UNPAID);
    expect(updated.balanceDue).toBe(2000);
  });

  it('stacks correctly with a prior partial payment', async () => {
    const svc = await freshBillingService();
    const { data } = await svc.getInvoices({ search: 'Hassan' }); // total 2500
    await svc.markInvoicePaid(data[0].id, 'Cash', 1000); // balance now 1500
    const updated = await svc.issueCreditNote(data[0].id, { reason: 'Discount', amount: 1500 });
    expect(updated.status).toBe(svc.INVOICE_STATUS.PAID);
    expect(updated.balanceDue).toBe(0);
    expect(updated.amountPaid).toBe(1000); // payment record itself is untouched
  });

  it('rejects a credit amount that exceeds what is left to credit', async () => {
    const svc = await freshBillingService();
    const { data } = await svc.getInvoices({ search: 'Hassan' }); // total 2500
    await svc.issueCreditNote(data[0].id, { reason: 'First credit', amount: 2000 });
    // Only 500 remains creditable — a second credit note for 1000 must fail.
    await expect(
      svc.issueCreditNote(data[0].id, { reason: 'Second credit', amount: 1000 })
    ).rejects.toThrow(/cannot exceed/i);
  });

  it('rejects a credit note with no reason', async () => {
    const svc = await freshBillingService();
    const { data } = await svc.getInvoices({ search: 'Hassan' });
    await expect(svc.issueCreditNote(data[0].id, { reason: '', amount: 100 })).rejects.toThrow(/reason/i);
  });

  it('rejects a zero or negative credit amount', async () => {
    const svc = await freshBillingService();
    const { data } = await svc.getInvoices({ search: 'Hassan' });
    await expect(svc.issueCreditNote(data[0].id, { reason: 'Test', amount: 0 })).rejects.toThrow(/greater than zero/i);
  });

  it('there is no deleteInvoice export — a credit note is structurally the only correction path', async () => {
    const svc = await freshBillingService();
    expect(svc.deleteInvoice).toBeUndefined();
  });
});

describe('billingService — getOutstandingSummary (FR-07.5)', () => {
  it('counts only unpaid and partially-paid invoices, summing their balance due', async () => {
    const svc = await freshBillingService();
    // Seeded: 2 paid (balance 0 each, excluded), 2 unpaid (2700 + 2500 = 5200).
    const summary = await svc.getOutstandingSummary();
    expect(summary.count).toBe(2);
    expect(summary.amount).toBe(5200);
  });

  it('a partial payment keeps the invoice in the outstanding count with the reduced balance', async () => {
    const svc = await freshBillingService();
    const { data } = await svc.getInvoices({ search: 'Hassan' });
    await svc.markInvoicePaid(data[0].id, 'Cash', 1000); // 2500 -> balance 1500, still Partially Paid
    const summary = await svc.getOutstandingSummary();
    expect(summary.count).toBe(2); // Fatima (2700) + Hassan (now 1500)
    expect(summary.amount).toBe(2700 + 1500);
  });
});

describe('billingService — generateInvoice', () => {
  it('computes the total from line items and starts fully unpaid', async () => {
    const svc = await freshBillingService();
    const invoice = await svc.generateInvoice({
      patientName: 'Test Patient',
      items: [
        { type: 'Consultation', description: 'General checkup', qty: 1, unitPrice: 1500 },
        { type: 'Lab Test', description: 'CBC', qty: 2, unitPrice: 900 },
      ],
    });
    expect(invoice.total).toBe(1500 + 2 * 900);
    expect(invoice.status).toBe(svc.INVOICE_STATUS.UNPAID);
    expect(invoice.balanceDue).toBe(invoice.total);
    expect(invoice.amountPaid).toBe(0);
  });

  it('rejects an invoice with no line items', async () => {
    const svc = await freshBillingService();
    await expect(svc.generateInvoice({ patientName: 'Test Patient', items: [] })).rejects.toThrow(/line item/i);
  });
});
