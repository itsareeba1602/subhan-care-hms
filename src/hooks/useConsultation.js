import { useState, useEffect, useCallback } from 'react';
import * as consultationService from '../services/consultationService';

// Drives the ConsultationPanel: starts/resumes a consultation for a given
// appointment, saves drafts, completes it, and adds addenda afterwards.
export function useConsultation({ appointmentId, patientName, doctorName }) {
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const init = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const started = await consultationService.startConsultation({ appointmentId, patientName, doctorName });
      setConsultation(started);
    } catch (err) {
      setError(err.message || 'Failed to start consultation.');
    } finally {
      setLoading(false);
    }
  }, [appointmentId, patientName, doctorName]);

  useEffect(() => {
    init();
  }, [init]);

  const saveDraft = async (fields) => {
    setSaving(true);
    try {
      const updated = await consultationService.updateConsultationDraft(consultation.id, fields);
      setConsultation(updated);
      return updated;
    } finally {
      setSaving(false);
    }
  };

  const complete = async (fields) => {
    setSaving(true);
    try {
      // Save the latest fields first so completion always reflects what's
      // currently in the form, then mark it done.
      await consultationService.updateConsultationDraft(consultation.id, fields);
      const completed = await consultationService.completeConsultation(consultation.id);
      setConsultation(completed);
      return completed;
    } finally {
      setSaving(false);
    }
  };

  const addAddendum = async (note) => {
    setSaving(true);
    try {
      const updated = await consultationService.addAddendum(consultation.id, note);
      setConsultation(updated);
      return updated;
    } finally {
      setSaving(false);
    }
  };

  return { consultation, loading, error, saving, saveDraft, complete, addAddendum };
}
