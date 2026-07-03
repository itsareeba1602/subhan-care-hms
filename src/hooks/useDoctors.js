import { useState, useEffect, useCallback } from 'react';
import * as doctorService from '../services/doctorService';

const PAGE_SIZE = 8;

export function useDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [page, setPage] = useState(1);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, total: count } = await doctorService.getDoctors({
        search,
        specialization,
        page,
        pageSize: PAGE_SIZE,
      });
      setDoctors(data);
      setTotal(count);
    } catch (err) {
      setError(err.message || 'Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  }, [search, specialization, page]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    setPage(1);
  }, [search, specialization]);

  const addDoctor = async (data) => {
    const created = await doctorService.addDoctor(data);
    await fetchDoctors();
    return created;
  };

  const updateDoctor = async (id, data) => {
    const updated = await doctorService.updateDoctor(id, data);
    await fetchDoctors();
    return updated;
  };

  const deleteDoctor = async (id) => {
    await doctorService.deleteDoctor(id);
    await fetchDoctors();
  };

  return {
    doctors,
    total,
    pageSize: PAGE_SIZE,
    loading,
    error,
    search,
    setSearch,
    specialization,
    setSpecialization,
    page,
    setPage,
    addDoctor,
    updateDoctor,
    deleteDoctor,
  };
}
