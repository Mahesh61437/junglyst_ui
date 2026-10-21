import { Info, AlertTriangle, Sparkles } from 'lucide-react';
import '../../pages/Workshops.css';

const TONE_ICONS = { info: Info, warning: AlertTriangle, success: Sparkles };

// Admin-configured highlight, e.g. "Venue not finalised yet". Plain text only.
export default function WorkshopNotice({ text, tone = 'info', compact = false }) {
  const message = (text || '').trim();
  if (!message) return null;
  const Icon = TONE_ICONS[tone] || Info;
  return (
    <div className={`ws-notice ws-notice--${TONE_ICONS[tone] ? tone : 'info'}${compact ? ' ws-notice--compact' : ''}`} role="note">
      <Icon size={compact ? 15 : 18} aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
