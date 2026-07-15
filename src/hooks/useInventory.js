import { useState, useEffect, useCallback } from 'react';
import * as inventoryService from '../services/inventoryService';

const PAGE_SIZE = 8;

export function useInventory() {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [{ data, total: count }, summaryData] = await Promise.all([
        inventoryService.getInventoryItems({ search, category, stockFilter, page, pageSize: PAGE_SIZE }),
        inventoryService.getInventorySummary(),
      ]);
      setInventoryItems(data);
      setTotal(count);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, [search, category, stockFilter, page]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    setPage(1);
  }, [search, category, stockFilter]);

  const addItem = async (data) => {
    const created = await inventoryService.addInventoryItem(data);
    await fetchInventory();
    return created;
  };

  const updateItem = async (id, data) => {
    const updated = await inventoryService.updateInventoryItem(id, data);
    await fetchInventory();
    return updated;
  };

  const removeItem = async (id) => {
    await inventoryService.deleteInventoryItem(id);
    await fetchInventory();
  };

  const adjustStock = async (id, delta, reason) => {
    const updated = await inventoryService.adjustStock(id, delta, reason);
    await fetchInventory();
    return updated;
  };

  const setExpiryWindowDays = async (days) => {
    await inventoryService.setExpiryWindowDays(days);
    await fetchInventory();
  };

  return {
    inventoryItems,
    total,
    pageSize: PAGE_SIZE,
    summary,
    loading,
    error,
    search,
    setSearch,
    category,
    setCategory,
    stockFilter,
    setStockFilter,
    page,
    setPage,
    addItem,
    updateItem,
    removeItem,
    adjustStock,
    expiryWindowDays: inventoryService.getExpiryWindowDays(),
    setExpiryWindowDays,
  };
}
