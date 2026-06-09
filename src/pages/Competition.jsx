import { useState, useEffect, useRef } from 'react'; // v2
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trophy, Camera, Upload, CheckCircle, AlertCircle, X, Clock, Users, Award, ChevronDown, Heart } from 'lucide-react';
import SEO from '../components/SEO';
import api from '../services/api';
import { useCompetitionStatus, getLaunchDate, formatAnnouncementDate } from '../services/CompetitionService';

const MAX_ENTRIES = 500;
const DEFAULT_RESULT_DATE_LABEL = 'soon';

// ??? Countdown ???????????????????????????????????????????????????????????????
function useCountdown(target) {
  const getTimeLeft = () => {
    if (!target) return null;
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);
  useEffect(() => {
    setTimeLeft(getTimeLeft());
    const t = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(t);
  }, [target?.getTime()]);
  return timeLeft;
}

function CountdownUnit({ value, label }) {
  return (
    <div style={{ textAlign: 'center', minWidth: '70px' }}>
      <div style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(201,151,43,0.3)',
        borderRadius: '12px',
        padding: 'clamp(0.75rem,2vw,1.25rem) clamp(0.5rem,1.5vw,1rem)',
        marginBottom: '0.5rem',
      }}>
        <span style={{
          display: 'block',
          fontSize: 'clamp(1.8rem,5vw,3.5rem)',
          fontWeight: 800,
          color: '#c9972b',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          fontFamily: 'var(--font-serif)',
        }}>
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
        {label}
      </span>
    </div>
  );
}

// ??? Image Dropzone ???????????????????????????????????????????????????????????
const MAX_FILE_MB = 10;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);

function isAllowedFile(f) {
  // Check MIME type first; fall back to extension for HEIC (browsers often omit MIME)
  if (['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(f.type)) return true;
  const ext = '.' + f.name.split('.').pop().toLowerCase();
  return ALLOWED_EXTS.has(ext);
}

function ImageDropzone({ files, setFiles, fileErrors, setFileErrors }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const addFiles = (newFiles) => {
    const errs = [];
    const valid = [];
    Array.from(newFiles).forEach(f => {
      if (!isAllowedFile(f)) {
        errs.push(`"${f.name}" — unsupported format. Use JPEG, PNG, WebP, or HEIC.`);
        return;
      }
      if (f.size > MAX_FILE_BYTES) {
        const mb = (f.size / (1024 * 1024)).toFixed(1);
        errs.push(`"${f.name}" is ${mb} MB — max allowed is ${MAX_FILE_MB} MB.`);
        return;
      }
      valid.push(f);
    });
    if (errs.length) setFileErrors(errs);
    setFiles(prev => [...prev, ...valid].slice(0, 5));
  };

  const removeFile = (i) => {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setFileErrors([]);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${dragging ? '#c9972b' : 'rgba(201,151,43,0.3)'}`,
          borderRadius: '14px',
          padding: 'clamp(1.5rem,4vw,2.5rem)',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'rgba(201,151,43,0.06)' : 'rgba(255,255,255,0.03)',
          transition: 'all 0.2s',
        }}
      >
        <Upload size={28} color="rgba(201,151,43,0.6)" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
        <p style={{ margin: '0 0 0.35rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: '0.9rem' }}>
          Drop images here or click to browse
        </p>
        <p style={{ margin: '0 0 0.2rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>
          Up to 5 images · JPEG, PNG, WebP, HEIC supported
        </p>
        <p style={{ margin: 0, color: 'rgba(201,151,43,0.5)', fontSize: '0.72rem', fontWeight: 600 }}>
          Max {MAX_FILE_MB} MB per image
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          multiple
          style={{ display: 'none' }}
          onChange={e => addFiles(e.target.files)}
        />
      </div>

      {/* Client-side file validation errors */}
      {fileErrors.length > 0 && (
        <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {fileErrors.map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', color: '#fca5a5', fontSize: '0.78rem' }}>
              <AlertCircle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
              {e}
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          {files.map((f, i) => {
            const heic = f.type === 'image/heic' || f.type === 'image/heif' ||
                         f.name.toLowerCase().endsWith('.heic') || f.name.toLowerCase().endsWith('.heif');
            return (
              <div key={i} style={{ position: 'relative' }}>
                {heic ? (
                  // Browsers can't render HEIC — show a labelled placeholder instead
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '10px',
                    border: '1px solid rgba(201,151,43,0.4)',
                    background: 'rgba(201,151,43,0.08)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}>
                    <Camera size={20} color="rgba(201,151,43,0.7)" />
                    <span style={{ fontSize: '0.55rem', color: 'rgba(201,151,43,0.7)', fontWeight: 700, letterSpacing: '0.05em' }}>HEIC</span>
                  </div>
                ) : (
                  <img
                    src={URL.createObjectURL(f)}
                    alt=""
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(201,151,43,0.3)' }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: '#c9972b', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                  }}
                >
                  <X size={11} color="#0a1f1c" />
                </button>
              </div>
            );
          })}
          {files.length < 5 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                width: '80px', height: '80px', borderRadius: '10px',
                border: '2px dashed rgba(201,151,43,0.3)',
                background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(201,151,43,0.5)', transition: 'all 0.2s',
              }}
            >
              <Camera size={22} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ??? Form ?????????????????????????????????????????????????????????????????????
const SUPPORT_HANDLE = '@the.junglyst';

function EntryForm({ status, onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', about_aquarium: '', instagram_handle: '' });
  const [followsInstagram, setFollowsInstagram] = useState(false);
  const [images, setImages] = useState([]);
  const [fileErrors, setFileErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // { current, total }
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const setApiError = (data) => {
    setError(data?.error || 'Something went wrong. Please try again.');
    setHint(data?.hint || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setHint('');
    setFileErrors([]);

    if (!images.length) {
      setError('Please upload at least one image of your aquascape.');
      return;
    }

    setSubmitting(true);

    try {
      // Step 1 — create the entry (no images yet)
      const { data: entryData } = await api.post('/competition/enter/', {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        about_aquarium: form.about_aquarium,
        instagram_handle: form.instagram_handle,
        follows_instagram: followsInstagram,
      });

      const entryId = entryData.entry_id;

      // Step 2 — upload images one by one
      let lastImgData = null;
      let imagesUploaded = 0;
      for (let i = 0; i < images.length; i++) {
        setUploadProgress({ current: i + 1, total: images.length });
        const fd = new FormData();
        fd.append('image', images[i]);
        try {
          const { data: imgData } = await api.post(
            `/competition/enter/${entryId}/upload-image/`,
            fd,
            { headers: { 'Content-Type': 'multipart/form-data' } },
          );
          lastImgData = imgData;
          imagesUploaded++;
        } catch (imgErr) {
          // If no images uploaded yet, delete the orphaned entry so the email
          // stays free and the slot is not consumed
          if (imagesUploaded === 0) {
            try { await api.delete(`/competition/enter/${entryId}/cancel/`); } catch (_) {}
          }
          setApiError(imgErr?.response?.data);
          return;
        }
      }

      onSuccess({ ...entryData, ...lastImgData });
    } catch (err) {
      const d = err?.response?.data;
      if (d?.errors) {
        const msgs = Object.values(d.errors).flat();
        setError(msgs[0] || 'Please check your details and try again.');
      } else {
        setApiError(d);
      }
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const submitLabel = () => {
    if (!submitting) return 'Submit My Aquascape';
    if (!uploadProgress) return 'Creating Entry…';
    return `Uploading Photo ${uploadProgress.current} of ${uploadProgress.total}…`;
  };

  const inputStyle = {
    width: '100%',
    padding: '0.9rem 1.1rem',
    borderRadius: '10px',
    border: '1.5px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: 'white',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '0.45rem',
  };

  const isOpen = status?.is_open !== false;
  const announcementDate = formatAnnouncementDate(status?.result_announcement_date);

  if (!isOpen && status) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.6)' }}>
        <Clock size={40} color="rgba(201,151,43,0.5)" style={{ marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
        <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Submissions Closed</h3>
        <p>The competition period has ended. Stay tuned for the winner announcement on {announcementDate || DEFAULT_RESULT_DATE_LABEL}!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,260px),1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input
            value={form.name} onChange={set('name')} required placeholder="Your name"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#c9972b'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
        </div>
        <div>
          <label style={labelStyle}>Email Address *</label>
          <input
            type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#c9972b'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
        </div>
        <div>
          <label style={labelStyle}>Mobile Number *</label>
          <input
            type="tel" value={form.mobile} onChange={set('mobile')} required placeholder="10-digit mobile"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#c9972b'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
        </div>
      </div>

      {/* Instagram */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={labelStyle}>Instagram Handle</label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem', pointerEvents: 'none',
          }}>@</span>
          <input
            value={form.instagram_handle}
            onChange={e => setForm(prev => ({ ...prev, instagram_handle: e.target.value.replace(/^@/, '') }))}
            placeholder="yourusername"
            style={{ ...inputStyle, paddingLeft: '2rem' }}
            onFocus={e => e.target.style.borderColor = '#c9972b'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
            <div
              onClick={() => setFollowsInstagram(prev => !prev)}
              style={{
                width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0,
                border: `2px solid ${followsInstagram ? '#c9972b' : 'rgba(255,255,255,0.25)'}`,
                background: followsInstagram ? 'rgba(201,151,43,0.2)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {followsInstagram && <CheckCircle size={13} color="#c9972b" />}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', userSelect: 'none' }}>
              I follow <strong style={{ color: '#c9972b' }}>@the.junglyst</strong> on Instagram
            </span>
          </label>
          {!followsInstagram && (
            <a
              href="https://www.instagram.com/the.junglyst?igsh=MXNpa3Bvb3lmNmo1cQ=="
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
                color: 'white', textDecoration: 'none', letterSpacing: '0.03em', flexShrink: 0,
              }}
            >
              Follow on Instagram
            </a>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={labelStyle}>Tell Us About Your Aquascape *</label>
        <textarea
          value={form.about_aquarium} onChange={set('about_aquarium')} required
          rows={5}
          placeholder="Describe your setup ? tank size, plants used, fish, hardscape, how long it took, what inspired you..."
          style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
          onFocus={e => e.target.style.borderColor = '#c9972b'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
        />
        <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.3rem' }}>
          {form.about_aquarium.length} chars (min 30)
        </div>
      </div>

      <div style={{ marginBottom: '1.75rem' }}>
        <label style={labelStyle}>Aquascape Photos * (up to 5)</label>
        <ImageDropzone files={images} setFiles={setImages} fileErrors={fileErrors} setFileErrors={setFileErrors} />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.35)', borderRadius: '10px', padding: '0.9rem 1rem', marginBottom: '1.25rem', color: '#fca5a5', fontSize: '0.85rem' }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div>{error}</div>
              {hint && (
                <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'rgba(252,165,165,0.75)', lineHeight: 1.5 }}>
                  {hint}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {status?.slots_remaining <= 50 && status?.slots_remaining > 0 && (
        <div style={{ background: 'rgba(201,151,43,0.1)', border: '1px solid rgba(201,151,43,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#c9972b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={14} />
          Only {status.slots_remaining} slots remaining ? submit soon!
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary"
        style={{
          width: '100%', padding: '1rem', fontSize: '0.95rem', fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer',
        }}
      >
        {submitLabel()}
      </button>

      <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: '1rem' }}>
        One entry per person. By submitting you agree that Junglyst may feature your images in the competition gallery.
      </p>
    </form>
  );
}

// ??? Success ?????????????????????????????????????????????????????????????????
function SuccessState({ data, announcementDate }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      style={{ textAlign: 'center', padding: '3rem 1rem' }}
    >
      <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(22,163,74,0.15)', border: '2px solid rgba(22,163,74,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
        <CheckCircle size={32} color="#4ade80" />
      </div>
      <h2 style={{ color: 'white', marginBottom: '0.65rem', fontSize: 'clamp(1.3rem,3vw,1.8rem)' }}>
        You're In, {data.name}!
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: '420px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
        Your aquascape has been entered into the competition. The winner will be selected and announced on <strong style={{ color: '#c9972b' }}>{announcementDate || DEFAULT_RESULT_DATE_LABEL}</strong>.
      </p>
      {data.slots_remaining > 0 && (
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
          {data.slots_remaining} of {MAX_ENTRIES} slots remaining for other participants.
        </p>
      )}
      <div style={{ background: 'rgba(201,151,43,0.08)', border: '1px solid rgba(201,151,43,0.25)', borderRadius: '12px', padding: '1rem 1.5rem', display: 'inline-block', marginTop: '1rem' }}>
        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Entry ID</span>
        <p style={{ margin: '0.25rem 0 0', color: '#c9972b', fontFamily: 'monospace', fontSize: '0.82rem', wordBreak: 'break-all' }}>
          {data.entry_id}
        </p>
      </div>
    </motion.div>
  );
}

// ??? Main Page ????????????????????????????????????????????????????????????????
export default function Competition() {
  const status = useCompetitionStatus();
  const [success, setSuccess] = useState(null);
  const launchDate = getLaunchDate(status);
  const timeLeft = useCountdown(launchDate);
  const formRef = useRef();

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleSuccess = (data) => {
    setSuccess(data);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };
  const announcementDate = formatAnnouncementDate(status?.result_announcement_date);

  return (
    <div style={{ backgroundColor: '#060f0d', minHeight: '100vh', color: 'white' }}>
      <SEO
        title="Aquascape Competition 2026 ? Junglyst"
        description={`Enter Junglyst's first ever Aquascape Competition. Submit photos of your build, win ?1,000. Open to all ? 500 slots only.${announcementDate ? ` Winner announced ${announcementDate}.` : ''}`}
        path="/competition"
      />

      {/* ?? Hero ?? */}
      <section style={{
        background: 'linear-gradient(160deg, #060f0d 0%, #071823 50%, #060f0d 100%)',
        padding: 'clamp(4rem,10vw,8rem) 1.5rem clamp(3rem,7vw,6rem)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative glow */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(201,151,43,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(201,151,43,0.12)', border: '1px solid rgba(201,151,43,0.3)', borderRadius: '100px', padding: '0.4rem 1rem', marginBottom: '1.5rem' }}>
            <Trophy size={14} color="#c9972b" />
            <span style={{ fontSize: '0.7rem', color: '#c9972b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Junglyst Aquascape Competition 2026
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem,6vw,4.5rem)',
            fontFamily: 'var(--font-serif)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '1.25rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #c9972b 60%, #e8b84b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Build. Photograph.<br />Win.
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(0.9rem,2vw,1.1rem)', maxWidth: '560px', margin: '0 auto 2.5rem', lineHeight: 1.75 }}>
            Share your aquascape with India's aquatic plant community. The most stunning build wins <strong style={{ color: '#c9972b' }}>?1,000 cash</strong>. Winner selected by the Junglyst team{announcementDate ? <> and announced on <strong style={{ color: '#c9972b' }}>{announcementDate}</strong></> : ''}.
          </p>

          {/* Countdown */}
          {timeLeft ? (
            <div>
              <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>
                Competition closes in
              </p>
              <div style={{ display: 'flex', gap: 'clamp(0.5rem,2vw,1rem)', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                <CountdownUnit value={timeLeft.days} label="Days" />
                <CountdownUnit value={timeLeft.hours} label="Hours" />
                <CountdownUnit value={timeLeft.minutes} label="Mins" />
                <CountdownUnit value={timeLeft.seconds} label="Secs" />
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '2.5rem', padding: '1rem', background: 'rgba(201,151,43,0.1)', borderRadius: '12px', display: 'inline-block' }}>
              <p style={{ color: '#c9972b', fontWeight: 700, margin: 0 }}>?? Submissions Closed ? Winner Announcement Day!</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={scrollToForm}
              className="btn btn-primary"
              style={{ padding: '0.9rem 2.5rem', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}
            >
              Enter Competition
            </button>
            <Link
              to="/competition/entries"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.9rem 1.6rem', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'white', textDecoration: 'none',
                fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
              }}
            >
              <Heart size={14} /> View Gallery
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem' }}>
              <Users size={14} />
              {status ? `${status.total_entries} / ${MAX_ENTRIES} entries` : `${MAX_ENTRIES} slots available`}
            </div>
          </div>
        </motion.div>

        <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', animation: 'bounce 2s infinite' }}>
          <ChevronDown size={20} color="rgba(255,255,255,0.2)" />
        </div>
      </section>

      {/* ?? Rules / Info ?? */}
      <section style={{ padding: 'clamp(3rem,6vw,5rem) 1.5rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem,4vw,3.5rem)' }}>
            <span style={{ color: '#c9972b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: '0.5rem' }}>Competition Details</span>
            <h2 style={{ fontSize: 'clamp(1.4rem,3vw,2.25rem)', margin: 0 }}>How It Works</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,240px),1fr))', gap: 'clamp(1.5rem,3vw,2rem)' }}>
            {[
              { icon: <Camera size={22} color="#c9972b" />, title: 'Submit Your Build', body: 'Fill in the registration form below with your details, a description of your aquascape, and up to 5 photos.' },
              { icon: <Users size={22} color="#c9972b" />, title: '500 Slots Only', body: 'The competition is limited to 500 entries. Once slots are full, registrations close ? enter early.' },
              { icon: <Award size={22} color="#c9972b" />, title: '?1,000 Prize', body: `One winner selected by the Junglyst team${announcementDate ? ` on ${announcementDate}` : ''}. The decision is final and will be announced on the website.` },
              { icon: <Trophy size={22} color="#c9972b" />, title: 'Win & Get Featured', body: 'The winning aquascape and its creator will be prominently featured on the Junglyst platform.' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem' }}
              >
                <div style={{ marginBottom: '0.85rem' }}>{item.icon}</div>
                <h4 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 700 }}>{item.title}</h4>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', lineHeight: 1.7, margin: 0 }}>{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ?? Rules ?? */}
      <section style={{ padding: 'clamp(2.5rem,5vw,4rem) 1.5rem' }}>
        <div className="container" style={{ maxWidth: '700px' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(1.5rem,3vw,2.5rem)' }}>
            <span style={{ color: '#c9972b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: '0.5rem' }}>Rules & Eligibility</span>
            <h2 style={{ fontSize: 'clamp(1.4rem,3vw,2.25rem)', margin: 0 }}>Competition Rules</h2>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: 'clamp(1.25rem,3vw,2rem)', display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              {
                num: '01',
                title: 'Register on Junglyst.com',
                body: 'You must complete your entry through the registration form on this page. Entries submitted via any other channel will not be counted.',
                mandatory: true,
              },
              {
                num: '02',
                title: 'Real Photographs Only',
                body: 'All submitted images must be genuine photographs of your own aquascape. AI-generated, heavily composited, or digitally fabricated images will result in immediate disqualification.',
                mandatory: true,
              },
              {
                num: '03',
                title: 'Follow @the.junglyst on Instagram',
                body: 'You must follow our Instagram page to be eligible. Entries from accounts that do not follow us by the time of winner selection will be disqualified.',
                instaLink: true,
                mandatory: true,
              },
            ].map((rule, i, arr) => (
              <div key={i} style={{
                display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
                paddingBottom: i < arr.length - 1 ? '1.5rem' : 0,
                marginBottom: i < arr.length - 1 ? '1.5rem' : 0,
                borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <span style={{
                  flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%',
                  background: 'rgba(201,151,43,0.12)', border: '1px solid rgba(201,151,43,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 800, color: '#c9972b', letterSpacing: '0.05em',
                }}>
                  {rule.num}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                    <h4 style={{ margin: 0, color: 'white', fontSize: '0.95rem', fontWeight: 700 }}>{rule.title}</h4>
                    {rule.mandatory && (
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#c9972b', background: 'rgba(201,151,43,0.12)', border: '1px solid rgba(201,151,43,0.3)', borderRadius: '100px', padding: '0.15rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Mandatory
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', lineHeight: 1.7 }}>{rule.body}</p>
                  {rule.instaLink && (
                    <a
                      href="https://www.instagram.com/the.junglyst?igsh=MXNpa3Bvb3lmNmo1cQ=="
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.65rem',
                        padding: '0.4rem 0.9rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                        background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
                        color: 'white', textDecoration: 'none', letterSpacing: '0.03em',
                      }}
                    >
                      Follow @the.junglyst
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ?? Registration Form ?? */}
      <section ref={formRef} style={{ padding: 'clamp(3rem,6vw,6rem) 1.5rem' }}>
        <div className="container" style={{ maxWidth: '680px' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem,4vw,3rem)' }}>
            <span style={{ color: '#c9972b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: '0.5rem' }}>Register Now</span>
            <h2 style={{ fontSize: 'clamp(1.4rem,3vw,2.25rem)', margin: '0 0 0.75rem' }}>Enter Your Aquascape</h2>
            {status && (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', margin: 0 }}>
                {status.slots_remaining} of {MAX_ENTRIES} slots remaining
              </p>
            )}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: 'clamp(1.5rem,4vw,2.5rem)' }}>
            {success ? (
              <SuccessState data={success} announcementDate={announcementDate} />
            ) : (
              <EntryForm status={status} onSuccess={handleSuccess} />
            )}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
      `}</style>
    </div>
  );
}

