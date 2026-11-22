import { MapPin } from 'lucide-react';
import { deliveryAreaText } from '../../utils/serviceQuotes';
import '../../pages/Services.css';

/** "We currently deliver to: …" note. Renders nothing when the service delivers across India. */
export default function DeliveryAreaNote({ stateNames, compact = false }) {
  const text = deliveryAreaText(stateNames, { short: compact });
  if (!text) return null;
  if (compact) {
    return (
      <span className="sv-area-chip"><MapPin size={12} aria-hidden="true" /> Delivers to {text}</span>
    );
  }
  return (
    <div className="sv-area-note" role="note">
      <MapPin size={18} aria-hidden="true" />
      <div>
        <strong>We currently deliver only to: {text}</strong>
        <span>Orders to other states can't be accepted yet.</span>
      </div>
    </div>
  );
}
