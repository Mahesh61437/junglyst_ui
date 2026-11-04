import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { ServiceQuoteService } from '../../services/ServiceQuoteService';
import '../../pages/Services.css';

const MAX_PHOTOS = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

/** Optional inspiration photos for a quote request. `value` is the list of uploaded URLs. */
export default function ReferencePhotos({ value, onChange }) {
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = async (event) => {
    const files = [...event.target.files].slice(0, MAX_PHOTOS - value.length);
    event.target.value = '';
    setError(null);
    const valid = files.filter(file => ACCEPTED.includes(file.type) && file.size <= MAX_BYTES);
    if (valid.length < files.length) setError('Some files were skipped: use JPG, PNG or WEBP photos under 5 MB.');
    if (!valid.length) return;

    setUploading(valid.length);
    const uploaded = [];
    for (const file of valid) {
      try {
        const { url } = await ServiceQuoteService.uploadReference(file);
        uploaded.push(url);
      } catch (err) {
        setError(err.response?.data?.error || 'A photo could not be uploaded. Please try again.');
      } finally {
        setUploading(count => count - 1);
      }
    }
    if (uploaded.length) onChange([...value, ...uploaded]);
  };

  return (
    <div className="sv-field">
      <span className="sv-label" id="sv-photos-label">Inspiration photos <span className="sv-choice-hint">Optional, up to {MAX_PHOTOS}</span></span>
      <div className="sv-photos" role="group" aria-labelledby="sv-photos-label">
        {value.map((url, index) => (
          <div key={url} className="sv-photo">
            <img src={url} alt={`Reference photo ${index + 1}`} />
            <button type="button" aria-label={`Remove photo ${index + 1}`} onClick={() => onChange(value.filter(item => item !== url))}><X size={14} /></button>
          </div>
        ))}
        {value.length < MAX_PHOTOS && (
          <button type="button" className="sv-photo-add" onClick={() => inputRef.current?.click()} disabled={uploading > 0}>
            <ImagePlus size={20} aria-hidden="true" />
            {uploading > 0 ? 'Uploading…' : 'Add photo'}
          </button>
        )}
        <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} multiple hidden onChange={handleFiles} />
      </div>
      <span className="sv-help">A space you want to fill, or a terrarium you love. It helps us quote accurately.</span>
      {error && <span className="sv-error" role="alert">{error}</span>}
    </div>
  );
}
