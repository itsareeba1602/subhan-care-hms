import { useState } from 'react';
import { Stethoscope, Calendar, ArrowRight, PlusCircle, MessageSquarePlus } from 'lucide-react';
import Button from '../shared/Button';
import { formatDateTime } from '../../utils/formatters';
import './MedicalHistoryTimeline.css';

// FR-06.1 / FR-06.2: renders a patient's completed consultations in
// reverse-chronological order. Each entry is immutable (FR-06.3) — any
// addenda are shown appended underneath, never merged into the original
// symptoms/diagnosis/notes text.
//
// canAddAddendum / onAddAddendum are optional — pass both to let the viewer
// add a correction to a specific past entry from this timeline directly
// (used on the Medical History browser page; the active-consultation panel
// handles its own addenda separately since that entry isn't in this list).
function MedicalHistoryTimeline({ entries, loading, emptyMessage, canAddAddendum, onAddAddendum }) {
  const [openFor, setOpenFor] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) return <p className="mht-loading">Loading medical history...</p>;

  if (!entries || entries.length === 0) {
    return <p className="mht-empty">{emptyMessage || 'No medical history on file for this patient yet.'}</p>;
  }

  const handleSubmit = async (entry) => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await onAddAddendum(entry, note);
      setNote('');
      setOpenFor(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mht-timeline">
      {entries.map((entry) => (
        <div className="mht-entry" key={entry.id}>
          <div className="mht-entry-icon">
            <Stethoscope size={16} />
          </div>
          <div className="mht-entry-body">
            <div className="mht-entry-header">
              <span className="mht-entry-diagnosis">{entry.diagnosis}</span>
              <span className="mht-entry-date">
                <Calendar size={13} /> {formatDateTime(entry.completedOn)}
              </span>
            </div>
            <p className="mht-entry-doctor">{entry.doctorName}</p>

            {entry.symptoms && (
              <p className="mht-entry-field">
                <span className="mht-entry-field-label">Symptoms:</span> {entry.symptoms}
              </p>
            )}
            {entry.notes && (
              <p className="mht-entry-field">
                <span className="mht-entry-field-label">Notes:</span> {entry.notes}
              </p>
            )}
            {entry.followUpInstructions && (
              <p className="mht-entry-field">
                <ArrowRight size={13} className="mht-entry-field-icon" />
                <span className="mht-entry-field-label">Follow-up:</span> {entry.followUpInstructions}
              </p>
            )}

            {entry.addenda && entry.addenda.length > 0 && (
              <div className="mht-addenda">
                {entry.addenda.map((a, i) => (
                  <div className="mht-addendum" key={i}>
                    <PlusCircle size={13} className="mht-addendum-icon" />
                    <div>
                      <p className="mht-addendum-note">{a.note}</p>
                      <span className="mht-addendum-date">{formatDateTime(a.addedOn)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {canAddAddendum && canAddAddendum(entry) && (
              <div className="mht-add-addendum">
                {openFor === entry.id ? (
                  <>
                    <textarea
                      className="mht-add-addendum-textarea"
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Correction or additional note for this record..."
                    />
                    <div className="mht-add-addendum-actions">
                      <Button variant="ghost" onClick={() => { setOpenFor(null); setNote(''); }}>
                        Cancel
                      </Button>
                      <Button loading={saving} onClick={() => handleSubmit(entry)} disabled={!note.trim()}>
                        Save Addendum
                      </Button>
                    </div>
                  </>
                ) : (
                  <button className="mht-add-addendum-trigger" onClick={() => setOpenFor(entry.id)}>
                    <MessageSquarePlus size={13} /> Add addendum
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MedicalHistoryTimeline;
