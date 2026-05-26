import { useState, useEffect } from 'react';
import { X, Upload, Bug, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function BugReportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const [contactInfo, setContactInfo] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('openBugReport', handleOpen);
    return () => window.removeEventListener('openBugReport', handleOpen);
  }, []);

  const handleClose = () => {
    if (!isSubmitting) {
      setIsOpen(false);
      // Reset form
      setContactInfo('');
      setDescription('');
      setImages([]);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      showToast('error', 'You can only upload up to 5 images.');
      return;
    }
    
    // Quick validation
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      showToast('error', 'Only image files are allowed.');
    }
    
    setImages(prev => [...prev, ...validFiles].slice(0, 5));
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('error', 'Please provide a description of the bug.');
      return;
    }
    if (!user && !contactInfo.trim()) {
      showToast('error', 'Please provide your email or mobile number.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      if (!user) {
        formData.append('contact_info', contactInfo);
      }
      formData.append('description', description);
      
      images.forEach((img, i) => {
        formData.append(`image_${i}`, img);
      });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bug-reports/`, {
        method: 'POST',
        headers: {
          ...(user ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error('Failed to submit bug report');
      }

      showToast('success', 'Bug report submitted successfully. Thank you!');
      handleClose();
    } catch (err) {
      console.error(err);
      showToast('error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 4000,
        backgroundColor: 'rgba(10,31,28,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={handleClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'white', borderRadius: '24px',
          width: '100%', maxWidth: '500px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fdfdfd' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '0.5rem', borderRadius: '12px' }}>
              <Bug size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Report an Issue</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>Help us improve Junglyst</p>
            </div>
          </div>
          <button onClick={handleClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          <form id="bug-report-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {!user && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  Email / Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={contactInfo}
                  onChange={e => setContactInfo(e.target.value)}
                  placeholder="For us to follow up with you"
                  style={{
                    width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
                    border: '1px solid var(--border-subtle)', outline: 'none',
                    fontSize: '0.9rem', transition: 'border-color 0.2s',
                    backgroundColor: '#fafafa'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--brand-gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Description of the Issue *
              </label>
              <textarea
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What happened? Where did it happen?"
                rows={4}
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
                  border: '1px solid var(--border-subtle)', outline: 'none',
                  fontSize: '0.9rem', resize: 'none', transition: 'border-color 0.2s',
                  backgroundColor: '#fafafa', fontFamily: 'inherit'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--brand-gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
              />
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                <span>Screenshots / Images</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{images.length}/5</span>
              </label>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {images.map((img, i) => (
                  <div key={i} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                    <img src={URL.createObjectURL(img)} alt={`Upload ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      style={{
                        position: 'absolute', top: '2px', right: '2px',
                        background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                        borderRadius: '50%', width: '20px', height: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                
                {images.length < 5 && (
                  <label style={{
                    width: '70px', height: '70px', borderRadius: '12px',
                    border: '1px dashed #cbd5e1', backgroundColor: '#f8fafc',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s', color: '#64748b'
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--brand-gold)'; e.currentTarget.style.color = 'var(--brand-gold)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; }}
                  >
                    <Upload size={18} />
                    <span style={{ fontSize: '0.6rem', fontWeight: 600, marginTop: '0.25rem' }}>Add</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            </div>
          </form>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-subtle)', backgroundColor: '#fdfdfd', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem',
              background: 'transparent', border: 'none', color: '#64748b', cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="bug-report-form"
            disabled={isSubmitting}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '100px', fontWeight: 800, fontSize: '0.85rem',
              backgroundColor: 'var(--brand-gold)', color: '#0a1f1c', border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
              opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s'
            }}
          >
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>Submit Report <Bug size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
