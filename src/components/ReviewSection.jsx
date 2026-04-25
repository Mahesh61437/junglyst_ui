import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
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
  
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!author || plantsRating === 0 || packagingRating === 0 || responsivenessRating === 0) {
      alert("Please fill out all ratings and provide your name.");
      return;
    }
    setSubmitting(true);
    try {
      const newReview = await ReviewService.submitReview({
        productId: parseInt(productId),
        author,
        comment,
        plants: plantsRating,
        packaging: packagingRating,
        responsiveness: responsivenessRating
      });
      setReviews([newReview, ...reviews]);
      setShowForm(false);
      
      // Reset form
      setAuthor('');
      setComment('');
      setPlantsRating(0);
      setPackagingRating(0);
      setResponsivenessRating(0);
    } catch (error) {
      alert("Failed to submit review.");
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
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
        <form onSubmit={handleSubmit} style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.125rem', fontFamily: 'serif', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Share your experience</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem' }}>
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <StarRatingInput label="Plant Quality & Health" value={plantsRating} onChange={setPlantsRating} />
                <StarRatingInput label="Expert Packaging" value={packagingRating} onChange={setPackagingRating} />
                <StarRatingInput label="Seller Responsiveness" value={responsivenessRating} onChange={setResponsivenessRating} />
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Your Name</label>
                <input 
                  type="text" 
                  value={author} 
                  onChange={e => setAuthor(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  placeholder="e.g. Rahul M."
                />
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
              
              <button 
                type="submit" 
                disabled={submitting}
                style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem', backgroundColor: 'var(--brand-green)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
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
            <div key={review.id} style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>
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
              
              {/* Right side: Comment */}
              <div>
                <p style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{review.comment}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
