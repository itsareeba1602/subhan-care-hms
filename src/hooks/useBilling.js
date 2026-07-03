import { useState, useEffect, useCallback } from 'react';
import * as billingService from '../services/billingService';

const PAGE_SIZE = 8;

export function useBilling() {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [outstanding, setOutstanding] = useState({ count: 0, amount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [{ data, total: count }, summary] = await Promise.all([
        billingService.getInvoices({ search, status, page, pageSize: PAGE_SIZE }),
        billingService.getOutstandingSummary(),
      ]);
      setInvoices(data);
      setTotal(count);
      setOutstanding(summary);
    } catch (err) {
      setError(err.message || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const generateInvoice = async (data) => {
    const created = await billingService.generateInvoice(data);
    await fetchInvoices();
    return created;
  };

  const markInvoicePaid = async (id, paymentMethod) => {
    const updated = await billingService.markInvoicePaid(id, paymentMethod);
    await fetchInvoices();
    return updated;
  };

  return {
    invoices,
    total,
    pageSize: PAGE_SIZE,
    outstanding,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    generateInvoice,
    markInvoicePaid,
  };
}
