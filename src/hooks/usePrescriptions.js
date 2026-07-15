import { useState, useEffect, useCallback } from 'react';
import * as prescriptionService from '../services/prescriptionService';

const PAGE_SIZE = 8;

// scopeDoctorName: pass the logged-in doctor's name to restrict the list to
// their own prescriptions (SRS Section 9: Doctor = F for own patients).
// Leave undefined for Admin (R, sees everything) and Pharmacist (L, sees
// everything so they can dispense any pending prescription).
export function usePrescriptions(scopeDoctorName) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, total: count } = await prescriptionService.getPrescriptions({
        search,
        status,
        doctorName: scopeDoctorName || '',
        page,
        pageSize: PAGE_SIZE,
      });
      setPrescriptions(data);
      setTotal(count);
    } catch (err) {
      setError(err.message || 'Failed to load prescriptions.');
    } finally {
      setLoading(false);
    }
  }, [search, status, scopeDoctorName, page]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const dispensePrescription = async (id, dispensedBy) => {
    const result = await prescriptionService.dispensePrescription(id, dispensedBy);
    await fetchPrescriptions();
    return result;
  };

  return {
    prescriptions,
    total,
    pageSize: PAGE_SIZE,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    dispensePrescription,
  };
}
