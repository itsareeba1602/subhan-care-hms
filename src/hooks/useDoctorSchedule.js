import { useEffect, useState } from 'react';
import { getUpcomingAppointmentsForDoctor } from '../services/appointmentService';

// FR-02.4: powers the "Your Upcoming Appointments" widget on a doctor's
// personal dashboard. doctorName should be the logged-in doctor's name
// (matches how appointments are stored); pass null/undefined to skip.
export function useDoctorSchedule(doctorName) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(!!doctorName);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (!doctorName) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getUpcomingAppointmentsForDoctor(doctorName);
        if (!cancelled) setAppointments(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load your schedule.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [doctorName]);

  return { appointments, loading, error };
}
