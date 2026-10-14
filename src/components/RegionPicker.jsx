import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { LocateFixed, MapPin, Truck, X } from 'lucide-react';
import { useRegion } from '../context/RegionContext';
import { REGION_LABELS, detectStateFromLocation, findState } from '../utils/deliveryRegion';

const LOCATION_ERROR_MESSAGES = {
  denied: "Location access was declined — no problem. Pick your state below and we'll remember it.",
  unavailable: "We couldn't detect your location. Please pick your state below.",
  outside: 'We currently deliver within India only. Please pick your delivery state below.',
};

const REGION_ORDER = ['south', 'north', 'north_east'];

const FOCUSABLE_SELECTOR = 'button:not([disabled]), select:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/**
 * Delivery-region picker. Opens automatically on a buyer's first visit (no
 * saved region) and on demand from the navbar's "Deliver to" control.
 */
export default function RegionPicker() {
  const { hasSelection, isPickerOpen } = useRegion();
  // Mounted only while open, so every opening starts from fresh form state.
  return isPickerOpen || !hasSelection ? <RegionPickerDialog /> : null;
}

function RegionPickerDialog() {
  const {
    hasSelection, stateName, states, catalogLoading, catalogError, refetchCatalog,
    selectState, closePicker,
  } = useRegion();
  const canDismiss = hasSelection;

  const titleId = useId();
  const selectId = useId();
  const [pickedCode, setPickedCode] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [locationError, setLocationError] = useState('');
  // Until the buyer picks, preselect their current state (the list may load late).
  const chosenCode = pickedCode ?? findState(states, stateName)?.code ?? '';

  const dialogRef = useRef(null);

  // Modal focus handling: move focus in on open, keep Tab inside, and hand it
  // back to whatever opened the picker when it closes.
  useEffect(() => {
    const opener = document.activeElement;
    // Controls may still be disabled while states load — fall back to the dialog itself.
    (dialogRef.current?.querySelector(FOCUSABLE_SELECTOR) || dialogRef.current)?.focus();
    return () => { if (opener instanceof HTMLElement) opener.focus(); };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && canDismiss) {
        closePicker();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canDismiss, closePicker]);

  const statesByRegion = useMemo(() => REGION_ORDER.map(region => ({
    region,
    states: states.filter(s => s.region === region).sort((a, b) => a.name.localeCompare(b.name)),
  })), [states]);

  const chosenState = states.find(s => s.code === chosenCode);

  const handleUseLocation = async () => {
    setDetecting(true);
    setLocationError('');
    try {
      const detected = await detectStateFromLocation(states);
      selectState(detected, 'location');
    } catch (error) {
      setLocationError(LOCATION_ERROR_MESSAGES[error?.reason] || LOCATION_ERROR_MESSAGES.unavailable);
    } finally {
      setDetecting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (chosenState) selectState(chosenState, 'manual');
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 4000,
        backgroundColor: 'rgba(10,31,28,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
      onClick={canDismiss ? closePicker : undefined}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '440px', outline: 'none',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ padding: '1.5rem 1.5rem 1rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
          <div style={{ backgroundColor: 'var(--badge-stock-bg)', color: 'var(--brand-green)', padding: '0.55rem', borderRadius: '12px', display: 'flex' }}>
            <Truck size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 id={titleId} style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
              Where should we deliver?
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0', lineHeight: 1.45 }}>
              We'll show plants from growers who ship to your state, so everything you see can reach you.
            </p>
          </div>
          {canDismiss && (
            <button onClick={closePicker} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
              <X size={20} />
            </button>
          )}
        </div>

        <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {catalogError ? (
            <div role="alert" style={{ fontSize: '0.85rem', color: '#b91c1c', backgroundColor: '#fef2f2', borderRadius: '12px', padding: '0.85rem 1rem' }}>
              We couldn't load the list of states.{' '}
              <button onClick={() => refetchCatalog()} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>
                Try again
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={detecting || catalogLoading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  width: '100%', padding: '0.85rem 1rem', borderRadius: '12px',
                  border: '1.5px solid var(--brand-green)', backgroundColor: 'white', color: 'var(--brand-green)',
                  fontSize: '0.85rem', fontWeight: 700, cursor: detecting ? 'progress' : 'pointer',
                  opacity: catalogLoading ? 0.6 : 1,
                }}
              >
                <LocateFixed size={17} />
                {detecting ? 'Detecting your location…' : 'Use my current location'}
              </button>

              {locationError && (
                <p role="status" style={{ margin: 0, fontSize: '0.8rem', color: '#92400e', backgroundColor: '#fffbeb', borderRadius: '10px', padding: '0.7rem 0.85rem', lineHeight: 1.45 }}>
                  {locationError}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                <span style={{ flex: 1, height: 1, backgroundColor: 'var(--border-subtle)' }} />
                or choose your state
                <span style={{ flex: 1, height: 1, backgroundColor: 'var(--border-subtle)' }} />
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <label htmlFor={selectId} style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Delivery state
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                  <select
                    id={selectId}
                    value={chosenCode}
                    onChange={e => setPickedCode(e.target.value)}
                    disabled={catalogLoading}
                    style={{
                      width: '100%', padding: '0.8rem 0.85rem 0.8rem 2.4rem', borderRadius: '12px',
                      border: '1px solid var(--border-subtle)', fontSize: '0.9rem', backgroundColor: 'white',
                      color: 'var(--text-primary)', fontFamily: 'inherit',
                    }}
                  >
                    <option value="">{catalogLoading ? 'Loading states…' : 'Select your state'}</option>
                    {statesByRegion.map(group => (
                      <optgroup key={group.region} label={REGION_LABELS[group.region]}>
                        {group.states.map(state => (
                          <option key={state.code} value={state.code}>{state.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                {chosenState && (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    You'll see growers delivering to <strong>{REGION_LABELS[chosenState.region]}</strong>.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={!chosenState}
                  style={{
                    width: '100%', padding: '0.9rem 1rem', borderRadius: '12px', border: 'none',
                    backgroundColor: chosenState ? 'var(--bg-deep)' : '#cbd5d1', color: 'white',
                    fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                    cursor: chosenState ? 'pointer' : 'not-allowed',
                  }}
                >
                  Save & continue
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
