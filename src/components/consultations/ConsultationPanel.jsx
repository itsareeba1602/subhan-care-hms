import { useState, useEffect } from 'react';
import { FileClock, Pill, Plus } from 'lucide-react';
import Button from '../shared/Button';
import Spinner from '../shared/Spinner';
import MedicalHistoryTimeline from './MedicalHistoryTimeline';
import PrescriptionCard from '../prescriptions/PrescriptionCard';
import PrescriptionForm from '../prescriptions/PrescriptionForm';
import { useConsultation } from '../../hooks/useConsultation';
import { useConsultationPrescriptions } from '../../hooks/useConsultationPrescriptions';
import { useToast } from '../../hooks/useToast';
import * as consultationService from '../../services/consultationService';
import './ConsultationPanel.css';

// FR-06.2: doctors see the patient's prior (completed) history for context
// before recording today's consultation. FR-06.4-06.6: start → draft → 
// complete. FR-06.3: once completed, only addenda are allowed, never edits.
function ConsultationPanel({ appointment, onClose, onCompleted }) {
  const { consultation, loading, error, saving, saveDraft, complete, addAddendum } = useConsultation({
    appointmentId: appointment.id,
    patientName: appointment.patientName,
    doctorName: appointment.doctorName,
  });
  const { showToast } = useToast();

  const [fields, setFields] = useState({ symptoms: '', diagnosis: '', notes: '', followUpInstructions: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [pastHistory, setPastHistory] = useState([]);
  const [pastLoading, setPastLoading] = useState(true);
  const [addendumNote, setAddendumNote] = useState('');
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  const {
    prescriptions,
    loading: prescriptionsLoading,
    saving: prescriptionSaving,
    addPrescription,
  } = useConsultationPrescriptions(consultation?.id);

  useEffect(() => {
    if (!consultation) return;
    setFields({
      symptoms: consultation.symptoms || '',
      diagnosis: consultation.diagnosis || '',
      notes: consultation.notes || '',
      followUpInstructions: consultation.followUpInstructions || '',
    });
  }, [consultation]);

  useEffect(() => {
    let cancelled = false;
    consultationService.getPatientMedicalHistory(appointment.patientName).then((data) => {
      if (!cancelled) {
        // Exclude today's own in-progress/just-completed record from "past" context.
        setPastHistory(data.filter((d) => d.id !== consultation?.id));
        setPastLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [appointment.patientName, consultation?.id]);

  const isCompleted = consultation?.status === consultationService.CONSULTATION_STATUS.COMPLETED;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraft(fields);
      showToast('Draft saved.');
    } catch (err) {
      showToast(err.message || 'Failed to save draft.', 'error');
    }
  };

  const handleComplete = async () => {
    if (!fields.diagnosis.trim()) {
      setFieldErrors({ diagnosis: 'Diagnosis is required to complete the consultation.' });
      return;
    }
    try {
      await complete(fields);
      showToast('Consultation completed and saved to medical history.');
      onCompleted?.();
    } catch (err) {
      showToast(err.message || 'Failed to complete consultation.', 'error');
    }
  };

  const handleAddAddendum = async () => {
    if (!addendumNote.trim()) return;
    try {
      await addAddendum(addendumNote);
      setAddendumNote('');
      showToast('Addendum added.');
    } catch (err) {
      showToast(err.message || 'Failed to add addendum.', 'error');
    }
  };

  const handleAddPrescription = async (medicines) => {
    await addPrescription({ patientName: appointment.patientName, doctorName: appointment.doctorName, medicines });
    setShowPrescriptionForm(false);
    showToast('Prescription saved.');
  };

  if (loading) return <Spinner label="Starting consultation..." />;
  if (error) return <p className="consultation-panel-error">{error}</p>;

  return (
    <div className="consultation-panel">
      <div className="consultation-panel-patient">
        <strong>{appointment.patientName}</strong> with {appointment.doctorName} &middot; {appointment.reason}
      </div>

      {pastHistory.length > 0 && (
        <div className="consultation-panel-history">
          <div className="consultation-panel-history-title">
            <FileClock size={15} /> Past Medical History
          </div>
          <MedicalHistoryTimeline entries={pastHistory} loading={pastLoading} />
        </div>
      )}

      <div className="consultation-panel-form">
        <div className="consultation-panel-field">
          <label className="consultation-panel-label">Symptoms</label>
          <textarea
            name="symptoms"
            value={fields.symptoms}
            onChange={handleChange}
            disabled={isCompleted}
            rows={2}
            className="consultation-panel-textarea"
            placeholder="e.g. Fever, headache, fatigue for 3 days"
          />
        </div>

        <div className="consultation-panel-field">
          <label className="consultation-panel-label">
            Diagnosis <span className="consultation-panel-required">*</span>
          </label>
          <textarea
            name="diagnosis"
            value={fields.diagnosis}
            onChange={handleChange}
            disabled={isCompleted}
            rows={2}
            className={`consultation-panel-textarea ${fieldErrors.diagnosis ? 'consultation-panel-textarea-error' : ''}`}
            placeholder="e.g. Viral fever"
          />
          {fieldErrors.diagnosis && <span className="consultation-panel-error-text">{fieldErrors.diagnosis}</span>}
        </div>

        <div className="consultation-panel-field">
          <label className="consultation-panel-label">Consultation Notes</label>
          <textarea
            name="notes"
            value={fields.notes}
            onChange={handleChange}
            disabled={isCompleted}
            rows={3}
            className="consultation-panel-textarea"
            placeholder="Examination findings, observations..."
          />
        </div>

        <div className="consultation-panel-field">
          <label className="consultation-panel-label">Follow-up Instructions</label>
          <textarea
            name="followUpInstructions"
            value={fields.followUpInstructions}
            onChange={handleChange}
            disabled={isCompleted}
            rows={2}
            className="consultation-panel-textarea"
            placeholder="e.g. Return in 1 week if symptoms persist"
          />
        </div>
      </div>

      <div className="consultation-panel-prescriptions">
        <div className="consultation-panel-prescriptions-header">
          <div className="consultation-panel-history-title">
            <Pill size={15} /> Prescriptions
          </div>
          {!isCompleted && !showPrescriptionForm && (
            <button className="consultation-panel-add-rx" onClick={() => setShowPrescriptionForm(true)}>
              <Plus size={14} /> Add Prescription
            </button>
          )}
        </div>

        {prescriptionsLoading ? (
          <p className="consultation-panel-rx-loading">Loading prescriptions...</p>
        ) : (
          <div className="consultation-panel-rx-list">
            {prescriptions.map((rx) => (
              <PrescriptionCard key={rx.id} prescription={rx} compact />
            ))}
            {prescriptions.length === 0 && !showPrescriptionForm && (
              <p className="consultation-panel-rx-empty">No prescriptions issued yet for this consultation.</p>
            )}
          </div>
        )}

        {showPrescriptionForm && (
          <PrescriptionForm
            saving={prescriptionSaving}
            onSubmit={handleAddPrescription}
            onCancel={() => setShowPrescriptionForm(false)}
          />
        )}
      </div>

      {isCompleted && (
        <div className="consultation-panel-addendum">
          <label className="consultation-panel-label">Add Addendum</label>
          <p className="consultation-panel-addendum-hint">
            This consultation is finalized and cannot be edited. Corrections are recorded as a new addendum below.
          </p>
          <textarea
            value={addendumNote}
            onChange={(e) => setAddendumNote(e.target.value)}
            rows={2}
            className="consultation-panel-textarea"
            placeholder="e.g. Correction: dosage should read 500mg, not 50mg"
          />
          <div className="consultation-panel-actions">
            <Button variant="ghost" onClick={onClose}>Close</Button>
            <Button loading={saving} onClick={handleAddAddendum} disabled={!addendumNote.trim()}>
              {saving ? 'Saving...' : 'Add Addendum'}
            </Button>
          </div>
        </div>
      )}

      {!isCompleted && (
        <div className="consultation-panel-actions">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="secondary" loading={saving} onClick={handleSaveDraft}>
            Save Draft
          </Button>
          <Button loading={saving} onClick={handleComplete}>
            {saving ? 'Saving...' : 'Complete Consultation'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ConsultationPanel;
