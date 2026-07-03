import { useState, useEffect, useCallback } from 'react';
import * as appointmentService from '../services/appointmentService';

const PAGE_SIZE = 8;

export function useAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, total: count } = await appointmentService.getAppointments({
        search,
        status,
        date,
        page,
        pageSize: PAGE_SIZE,
      });
      setAppointments(data);
      setTotal(count);
    } catch (err) {
      setError(err.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  }, [search, status, date, page]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    setPage(1);
  }, [search, status, date]);

  const bookAppointment = async (data) => {
    const created = await appointmentService.bookAppointment(data);
    await fetchAppointments();
    return created;
  };

  const rescheduleAppointment = async (id, data) => {
    const updated = await appointmentService.rescheduleAppointment(id, data);
    await fetchAppointments();
    return updated;
  };

  const cancelAppointment = async (id) => {
    await appointmentService.cancelAppointment(id);
    await fetchAppointments();
  };

  const completeAppointment = async (id) => {
    await appointmentService.completeAppointment(id);
    await fetchAppointments();
  };

  return {
    appointments,
    total,
    pageSize: PAGE_SIZE,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    date,
    setDate,
    page,
    setPage,
    bookAppointment,
    rescheduleAppointment,
    cancelAppointment,
    completeAppointment,
  };
}
