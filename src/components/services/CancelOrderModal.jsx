import { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { ServiceQuoteService } from '../../services/ServiceQuoteService';
import '../../pages/Services.css';

const REASON_LIMIT = 500;

// A customer can cancel their own request before paying. Paid orders are cancelled by the team.
export default function CancelOrderModal({ request, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (event) => { if (event.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await ServiceQuoteService.my.cancel(request.reference, reason.trim());
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || err.userMessage || 'Could not send this. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="sv-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <form className="sv-modal" role="dialog" aria-modal="true" aria-labelledby="co-title" tabIndex={-1} ref={dialogRef} onSubmit={submit}>
        <div className="sv-modal-head">
          <h2 id="co-title">Cancel this request?</h2>
          <button type="button" className="sv-close" aria-label="Close" onClick={onClose} disabled={busy}>×</button>
        </div>
        <p className="sv-form-sub" style={{ margin: 0 }}>{request.offering_name} · {request.reference}</p>
        <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: 1.55 }}>
          No payment has been taken. You can send a new request any time.
        </p>
        {error && <div className="sv-banner sv-banner--error" role="alert"><AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />{error}</div>}
        <div className="sv-field">
          <label className="sv-label" htmlFor="co-reason">Reason <span className="sv-choice-hint">Optional</span></label>
          <textarea id="co-reason" className="sv-textarea" maxLength={REASON_LIMIT} value={reason} onChange={(event) => setReason(event.target.value)} />
        </div>
        <div className="sv-wizard-nav">
          <button type="button" className="svh-btn svh-btn--outline" onClick={onClose} disabled={busy}>Keep it</button>
          <button type="submit" className="sv-submit" style={{ background: '#b91c1c', color: '#fff' }} disabled={busy}>
            {busy ? 'Cancelling…' : 'Cancel request'}
          </button>
        </div>
      </form>
    </div>
  );
}
