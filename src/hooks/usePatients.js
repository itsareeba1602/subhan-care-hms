import { useState, useEffect, useCallback } from 'react';
import * as patientService from '../services/patientService';

const PAGE_SIZE = 8;

export function usePatients() {
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [page, setPage] = useState(1);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, total: count } = await patientService.getPatients({
        search,
        gender,
        page,
        pageSize: PAGE_SIZE,
      });
      setPatients(data);
      setTotal(count);
    } catch (err) {
      setError(err.message || 'Failed to load patients.');
    } finally {
      setLoading(false);
    }
  }, [search, gender, page]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Reset to page 1 whenever search/filter changes
  useEffect(() => {
    setPage(1);
  }, [search, gender]);

  const addPatient = async (data) => {
    const created = await patientService.addPatient(data);
    await fetchPatients();
    return created;
  };

  const updatePatient = async (id, data) => {
    const updated = await patientService.updatePatient(id, data);
    await fetchPatients();
    return updated;
  };

  const deletePatient = async (id) => {
    await patientService.deletePatient(id);
    await fetchPatients();
  };

  return {
    patients,
    total,
    pageSize: PAGE_SIZE,
    loading,
    error,
    search,
    setSearch,
    gender,
    setGender,
    page,
    setPage,
    addPatient,
    updatePatient,
    deletePatient,
    refetch: fetchPatients,
  };
}
