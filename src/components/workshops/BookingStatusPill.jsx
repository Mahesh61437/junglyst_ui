import { BOOKING_STATUS_META } from '../../utils/workshops';

export default function BookingStatusPill({ status }) {
  const meta = BOOKING_STATUS_META[status] || { label: status, color: '#475569', bg: '#f1f5f9' };
  return (
    <span className="ws-pill" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
  );
}
