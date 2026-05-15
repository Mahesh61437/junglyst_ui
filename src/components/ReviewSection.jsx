import { useState, useEffect } from 'react';
import { Star, Upload, X } from 'lucide-react';
import { ReviewService } from '../services/ReviewService';

export default function ReviewSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [author, setAuthor] = useState('');
  const [comment, setComment] = useState('');
  const [plantsRating, setPlantsRating] = useState(0);
  const [packagingRating, setPackagingRating] = useState(0);
  const [responsivenessRating, setResponsivenessRating] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const data = await ReviewService.getReviews(productId);
      setReviews(data.results || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!author.trim()) {
      nextErrors.author = 'Please enter your name.';
    }
    if (plantsRating === 0) {
      nextErrors.plants = 'Please rate plant quality.';
    }
    if (packagingRating === 0) {
      nextErrors.packaging = 'Please rate packaging.';
    }
    if (responsivenessRating === 0) {
      nextErrors.responsiveness = 'Please rate seller responsiveness.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const newReview = await ReviewService.submitReview({
        productId,
        author: author.trim(),
        comment: comment.trim(),
        plants: plantsRating,
        packaging: packagingRating,
        responsiveness: responsivenessRating
      });
      setReviews([newReview, ...reviews]);
      setShowForm(false);
      setErrors({});
      
      // Reset form
      setAuthor('');
      setComment('');
      setPlantsRating(0);
      setPackagingRating(0);
      setResponsivenessRating(0);
    } catch (error) {
      setErrors({ submit: 'Unable to submit review. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const StarRatingInput = ({ label, value, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
      <div style={{ display: 'flex', gap: '0.25rem', cursor: 'pointer' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            size={20} 
            fill={star <= value ? '#fbbf24' : 'none'} 
            color={star <= value ? '#fbbf24' : '#d1d5db'}
            onClick={() => onChange(star)}
          />
        ))}
      </div>
    </div>
  );

  const calculateOverallRating = () => {
    if (reviews.length === 0) return 0;
    const totals = reviews.reduce((acc, curr) => {
      acc.plants += curr.plants;
      acc.packaging += curr.packaging;
      acc.responsiveness += curr.responsiveness;
      return acc;
    }, { plants: 0, packaging: 0, responsiveness: 0 });
    
    const overall = (totals.plants + totals.packaging + totals.responsiveness) / (reviews.length * 3);
    return overall.toFixed(1);
  };

  if (loading) return <div style={{ padding: '2rem 0' }}>Loading reviews...</div>;

  return (
    <div style={{ paddingTop: '1rem', marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'serif', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Customer Experience</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', color: '#fbbf24' }}>
              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} fill={i <= Math.round(calculateOverallRating()) ? "currentColor" : "none"} />)}
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{calculateOverallRating()} overall score</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>({reviews.length} reviews)</span>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
        >
          {showForm ? 'Cancel Form' : 'Write a Review'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ backgroundColor: '#f8fafc', padding: 'clamp(1.25rem, 4vw, 2rem)', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.125rem', fontFamily: 'serif', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Share your experience</h3>
          
          <div className="review-form-grid">
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <StarRatingInput label="Plant Quality & Health" value={plantsRating} onChange={setPlantsRating} />
                {errors.plants && <p style={{ margin: '0.25rem 0 0', color: '#f87171', fontSize: '0.8rem' }}>{errors.plants}</p>}
                <StarRatingInput label="Expert Packaging" value={packagingRating} onChange={setPackagingRating} />
                {errors.packaging && <p style={{ margin: '0.25rem 0 0', color: '#f87171', fontSize: '0.8rem' }}>{errors.packaging}</p>}
                <StarRatingInput label="Seller Responsiveness" value={responsivenessRating} onChange={setResponsivenessRating} />
                {errors.responsiveness && <p style={{ margin: '0.25rem 0 0', color: '#f87171', fontSize: '0.8rem' }}>{errors.responsiveness}</p>}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Your Name</label>
                <input 
                  type="text" 
                  value={author} 
                  onChange={e => setAuthor(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${errors.author ? '#f87171' : '#cbd5e1'}` }}
                  placeholder="e.g. Rahul M."
                />
                {errors.author && <p style={{ margin: '0.5rem 0 0', color: '#f87171', fontSize: '0.8rem' }}>{errors.author}</p>}
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Written Review</label>
                <textarea 
                  value={comment} 
                  onChange={e => setComment(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '100px', resize: 'vertical' }}
                  placeholder="How was the unboxing experience? Did the plants look healthy?"
                />
              </div>
              
              {errors.submit && <p style={{ color: '#f87171', fontSize: '0.9rem', margin: 0 }}>{errors.submit}</p>}
              
              {/* Image Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Add a Photo (Optional)</label>
                {!imagePreview ? (
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '2rem', border: '2px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#f8fafc', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-green)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; }}>
                    <Upload size={20} color='#94a3b8' />
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Click to upload image</span>
                    <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                  </label>
                ) : (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', maxWidth: '200px', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                    <button
                      type="button"
                      onClick={clearImage}
                      style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <button 
                type="submit" 
                disabled={submitting}
                style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem', backgroundColor: submitting ? '#94a3b8' : 'var(--brand-green)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? 'Submitting...' : 'Post Review'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Review Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {reviews.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No reviews yet. Be the first to leave one!</p>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="review-item-grid" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>
              {/* Left side: Ratings Breakdown */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {review.author.charAt(0)}
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{review.author}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Verified Buyer • {review.date}</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                    <span>Plant Quality</span>
                    <div style={{ display: 'flex', color: '#fbbf24' }}>
                      {[1,2,3,4,5].map(i => <Star key={i} size={10} fill={i <= Math.round(review.plants) ? "currentColor" : "none"} color={i <= Math.round(review.plants) ? "currentColor" : "#d1d5db"} />)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                    <span>Packaging</span>
                    <div style={{ display: 'flex', color: '#fbbf24' }}>
                      {[1,2,3,4,5].map(i => <Star key={i} size={10} fill={i <= Math.round(review.packaging) ? "currentColor" : "none"} color={i <= Math.round(review.packaging) ? "currentColor" : "#d1d5db"} />)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                    <span>Responsiveness</span>
                    <div style={{ display: 'flex', color: '#fbbf24' }}>
                      {[1,2,3,4,5].map(i => <Star key={i} size={10} fill={i <= Math.round(review.responsiveness) ? "currentColor" : "none"} color={i <= Math.round(review.responsiveness) ? "currentColor" : "#d1d5db"} />)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right side: Comment and Image */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, margin: '0 0 0.5rem 0' }}>{review.comment}</p>
                  {review.image_url && (
                    <img src={review.image_url} alt="Review image" style={{ width: '100%', maxWidth: '300px', height: '200px', objectFit: 'cover', borderRadius: '8px', marginTop: '0.75rem' }} />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <style>{`
        .review-form-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 3rem;
        }
        .review-item-grid {
          display: grid;
          grid-template-columns: 1fr 3fr;
          gap: 2rem;
        }
        @media (max-width: 768px) {
          .review-form-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .review-item-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
