import { useState, useEffect, useCallback } from 'react';
import * as prescriptionService from '../services/prescriptionService';

// FR-05.1/05.2/05.4: lets a doctor add prescriptions within an active
// consultation, and lists whatever has already been prescribed during it.
export function useConsultationPrescriptions(consultationId) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!consultationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await prescriptionService.getPrescriptionsForConsultation(consultationId);
      setPrescriptions(data);
    } catch (err) {
      setError(err.message || 'Failed to load prescriptions.');
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    load();
  }, [load]);

  const addPrescription = async ({ patientName, doctorName, medicines }) => {
    setSaving(true);
    try {
      const created = await prescriptionService.createPrescription({
        consultationId,
        patientName,
        doctorName,
        medicines,
      });
      await load();
      return created;
    } finally {
      setSaving(false);
    }
  };

  return { prescriptions, loading, error, saving, addPrescription };
}
