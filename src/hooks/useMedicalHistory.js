import { useState, useEffect, useCallback } from 'react';
import * as consultationService from '../services/consultationService';

// Powers the Medical History page: a list of patients the current viewer
// is allowed to see history for, plus the selected patient's full timeline.
export function useMedicalHistory({ role, doctorName }) {
  const [patientNames, setPatientNames] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [entries, setEntries] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadPatients() {
      setLoadingPatients(true);
      try {
        const names =
          role === 'doctor'
            ? await consultationService.getPatientsWithHistoryForDoctor(doctorName)
            : await consultationService.getAllPatientsWithHistory();
        if (!cancelled) setPatientNames(names);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load patients.');
      } finally {
        if (!cancelled) setLoadingPatients(false);
      }
    }
    loadPatients();
    return () => {
      cancelled = true;
    };
  }, [role, doctorName]);

  const loadHistory = useCallback(async (patientName) => {
    setSelectedPatient(patientName);
    if (!patientName) {
      setEntries([]);
      return;
    }
    setLoadingHistory(true);
    setError('');
    try {
      const data = await consultationService.getPatientMedicalHistory(patientName);
      setEntries(data);
    } catch (err) {
      setError(err.message || 'Failed to load medical history.');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (selectedPatient) loadHistory(selectedPatient);
  }, [selectedPatient, loadHistory]);

  return {
    patientNames,
    selectedPatient,
    entries,
    loadingPatients,
    loadingHistory,
    error,
    loadHistory,
    refresh,
  };
}
