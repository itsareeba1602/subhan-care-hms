import { useEffect, useState } from 'react';
import { hasModuleAccess } from '../constants/roles';
import * as patientService from '../services/patientService';
import * as doctorService from '../services/doctorService';
import * as appointmentService from '../services/appointmentService';
import * as billingService from '../services/billingService';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// FR-09.2: "The system shall present key operational metrics (daily
// patients seen, revenue, appointment count) on an Admin dashboard."
// The old DashboardPage only rendered a static paragraph of hardcoded
// copy — nothing here actually reflected what was in the database. This
// hook fetches real counts, and only for the modules the signed-in role
// can actually see (a Pharmacist, for instance, has no billing access, so
// they should never see a revenue figure appear on their dashboard).
export function useDashboardStats(role) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const wantPatients = hasModuleAccess(role, 'patients');
        const wantDoctors = hasModuleAccess(role, 'doctors');
        const wantAppointments = hasModuleAccess(role, 'appointments');
        const wantBilling = hasModuleAccess(role, 'billing');

        const [patients, doctors, appointmentsToday, outstanding] = await Promise.all([
          wantPatients ? patientService.getPatients({ page: 1, pageSize: 1 }) : null,
          wantDoctors ? doctorService.getDoctors({ page: 1, pageSize: 1 }) : null,
          wantAppointments
            ? appointmentService.getAppointments({ date: todayISO(), page: 1, pageSize: 1 })
            : null,
          wantBilling ? billingService.getOutstandingSummary() : null,
        ]);

        if (cancelled) return;

        setStats({
          patientsTotal: patients?.total ?? null,
          doctorsTotal: doctors?.total ?? null,
          appointmentsToday: appointmentsToday?.total ?? null,
          outstandingCount: outstanding?.count ?? null,
          outstandingAmount: outstanding?.amount ?? null,
        });
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard stats.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (role) load();
    return () => {
      cancelled = true;
    };
  }, [role]);

  return { stats, loading, error };
}
