import { useState, useEffect, useCallback } from 'react';
import * as appointmentService from '../services/appointmentService';

const PAGE_SIZE = 8;

// scopeDoctorName: pass the logged-in doctor's name to restrict the list to
// their own appointments (SRS Section 9: Doctor = R own). Leave undefined
// for Admin/Receptionist, who see every appointment.
export function useAppointments(scopeDoctorName) {
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
        doctorName: scopeDoctorName || '',
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
  }, [search, status, date, scopeDoctorName, page]);

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

  const cancelAppointment = async (id, reason) => {
    await appointmentService.cancelAppointment(id, reason);
    await fetchAppointments();
  };

  const completeAppointment = async (id) => {
    await appointmentService.completeAppointment(id);
    await fetchAppointments();
  };

  const markNoShow = async (id) => {
    await appointmentService.markNoShow(id);
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
    markNoShow,
    // Exposed for flows that update an appointment through another service
    // (e.g. completing a consultation also flips the linked appointment to
    // 'completed' via consultationService, bypassing this hook's own
    // completeAppointment action) and need to pull the list's local state
    // back in sync afterwards.
    refetch: fetchAppointments,
  };
}
