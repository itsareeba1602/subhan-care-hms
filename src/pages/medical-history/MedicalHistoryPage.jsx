import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import MedicalHistoryTimeline from '../../components/consultations/MedicalHistoryTimeline';
import { useMedicalHistory } from '../../hooks/useMedicalHistory';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import * as consultationService from '../../services/consultationService';
import './MedicalHistoryPage.css';

// SRS Section 9: Medical History access is Admin = R (read-only oversight),
// Doctor = F for their own patients only (can also add addenda here to a
// past record, not just during an active consultation). Everyone else has
// no access — RoleRoute already keeps them off this page entirely.
function MedicalHistoryPage() {
  const { user } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();
  const isDoctor = user?.role === 'doctor';

  const { patientNames, selectedPatient, entries, loadingPatients, loadingHistory, error, loadHistory, refresh } =
    useMedicalHistory({ role: user?.role, doctorName: user?.name });

  useEffect(() => {
    const preselected = location.state?.patientName;
    if (preselected) loadHistory(preselected);
    // Only run on mount / when a fresh navigation state arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.patientName]);

  const handleAddAddendum = async (entry, note) => {
    try {
      await consultationService.addAddendum(entry.id, note);
      showToast('Addendum added.');
      refresh();
    } catch (err) {
      showToast(err.message || 'Failed to add addendum.', 'error');
    }
  };

  return (
    <div>
      <h1 className="page-title">Medical History</h1>
      <p className="page-subtitle">
        {isDoctor
          ? 'Chronological consultation records for patients you have treated.'
          : 'Read-only view of patient consultation history.'}
      </p>

      <div className="medical-history-wrapper">
        <div className="medical-history-selector">
          <Search size={16} className="medical-history-selector-icon" />
          <select
            className="medical-history-select"
            value={selectedPatient}
            onChange={(e) => loadHistory(e.target.value)}
            disabled={loadingPatients}
          >
            <option value="">
              {loadingPatients ? 'Loading patients...' : 'Select a patient'}
            </option>
            {patientNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {!loadingPatients && patientNames.length === 0 && (
          <p className="medical-history-empty">
            {isDoctor
              ? 'You don\u2019t have any completed consultations yet. History appears here once you complete a consultation from the Appointments page.'
              : 'No patients have a medical history on file yet.'}
          </p>
        )}

        {error && <p className="medical-history-error">{error}</p>}

        {selectedPatient && (
          <div className="medical-history-timeline-wrapper">
            <MedicalHistoryTimeline
              entries={entries}
              loading={loadingHistory}
              canAddAddendum={isDoctor ? (entry) => entry.doctorName === user?.name : null}
              onAddAddendum={isDoctor ? handleAddAddendum : null}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default MedicalHistoryPage;
