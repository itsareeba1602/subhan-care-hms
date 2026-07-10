import { useState, useEffect, useCallback } from 'react';
import * as staffService from '../services/staffService';

const PAGE_SIZE = 8;

export function useStaff() {
  const [staff, setStaff] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, total: count } = await staffService.getStaff({
        search,
        role,
        page,
        pageSize: PAGE_SIZE,
      });
      setStaff(data);
      setTotal(count);
    } catch (err) {
      setError(err.message || 'Failed to load staff.');
    } finally {
      setLoading(false);
    }
  }, [search, role, page]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    setPage(1);
  }, [search, role]);

  const addStaff = async (data) => {
    const created = await staffService.addStaff(data);
    await fetchStaff();
    return created;
  };

  const updateStaff = async (id, data) => {
    const updated = await staffService.updateStaff(id, data);
    await fetchStaff();
    return updated;
  };

  const deleteStaff = async (id) => {
    await staffService.deleteStaff(id);
    await fetchStaff();
  };

  return {
    staff,
    total,
    pageSize: PAGE_SIZE,
    loading,
    error,
    search,
    setSearch,
    role,
    setRole,
    page,
    setPage,
    addStaff,
    updateStaff,
    deleteStaff,
  };
}
