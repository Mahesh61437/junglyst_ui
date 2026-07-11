import { useState, useEffect, Fragment } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft, Calendar, Clock, User, ShoppingBag, X,
  ArrowRight, BookOpen, Tag, Share2, Bookmark, ChevronRight,
} from 'lucide-react';
import { blogs } from '../data/blogs';
import { ProductService } from '../services/ProductService';
import SEO from '../components/SEO';
import BlogFeaturedProducts from '../components/BlogFeaturedProducts';
import SocialLinks from '../components/SocialLinks';

// ── Reading Progress Bar ──────────────────────────────────────────────────────
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setProgress(scrollHeight ? (scrollTop / scrollHeight) * 100 : 0);
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.08)' }}>
      <div style={{
        width: `${progress}%`, height: '100%',
        background: 'linear-gradient(90deg, #0A3029, #c9972b)',
        transition: 'width 0.1s linear',
      }} />
    </div>
  );
}

// ── Inline Shop Callout ───────────────────────────────────────────────────────
// Appears mid-article, right after the section that mentions the relevant plants.
const CALLOUT_STALE = 1000 * 60 * 60 * 4;
const CALLOUT_GC    = 1000 * 60 * 60 * 24;

function InlineShopCallout({ tags = [], headline, note }) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['callout', tags.slice().sort().join(',')],
    queryFn: async () => {
      const results = await Promise.allSettled(
        tags.slice(0, 2).map(tag => ProductService.getProducts({ search: tag, page_size: 3 }))
      );
      const seen = new Set();
      return results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value?.results ?? r.value ?? [])
        .filter(p => {
          if (!p?.id || seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        })
        .slice(0, 3);
    },
    enabled: tags.length > 0,
    staleTime: CALLOUT_STALE,
    gcTime: CALLOUT_GC,
    retry: 1,
  });

  if (!isLoading && !products.length) return null;

  return (
    <div style={{
      margin: '2.25rem 0',
      padding: '1.1rem 1.35rem 1.25rem',
      background: '#fdfbf3',
      borderTop: '1px solid #f0e5c5',
      borderRight: '1px solid #f0e5c5',
      borderBottom: '1px solid #f0e5c5',
      borderLeft: '3px solid #c9972b',
      borderRadius: '0 14px 14px 0',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
        <ShoppingBag size={11} color="#c9972b" />
        <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#c9972b' }}>
          Shop This Section
        </span>
      </div>
      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0A3029', marginBottom: note ? '0.2rem' : '0.85rem', lineHeight: 1.3 }}>
        {headline}
      </div>
      {note && (
        <p style={{ fontSize: '0.72rem', color: '#6b7c73', margin: '0 0 0.85rem', lineHeight: 1.55 }}>
          {note}
        </p>
      )}

      {/* Product strip */}
      <div style={{ display: 'flex', gap: '0.7rem', overflowX: 'auto', paddingBottom: '0.2rem', scrollbarWidth: 'none' }}>
        {isLoading
          ? [0, 1, 2].map(i => (
              <div key={i} style={{ width: '148px', flexShrink: 0, borderRadius: '10px', border: '1px solid #e8ede9', overflow: 'hidden', background: 'white' }}>
                <div style={{ height: '88px', background: '#f1f5f2' }} />
                <div style={{ padding: '0.55rem 0.65rem' }}>
                  <div style={{ height: '9px', background: '#e8ede9', borderRadius: '4px', marginBottom: '0.35rem' }} />
                  <div style={{ height: '9px', background: '#e8ede9', borderRadius: '4px', width: '55%', marginBottom: '0.35rem' }} />
                  <div style={{ height: '8px', background: '#f0e5c5', borderRadius: '4px', width: '40%' }} />
                </div>
              </div>
            ))
          : products.map(p => {
              const img  = p.imageUrl || p.image_url || p.image;
              const name = p.name || p.title || 'Plant';
              const price = p.price
                ? `₹${parseFloat(p.price).toLocaleString('en-IN')}`
                : null;
              const to = p.slug ? `/product/${p.slug}` : `/shop?search=${encodeURIComponent(name.split(' ')[0])}`;
              return (
                <Link key={p.id} to={to} style={{ textDecoration: 'none', width: '148px', flexShrink: 0 }}>
                  <motion.div
                    whileHover={{ y: -3, boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }}
                    transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                    style={{ borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', background: 'white', height: '100%' }}
                  >
                    <div style={{ height: '88px', overflow: 'hidden', background: '#f1f5f2' }}>
                      <img
                        src={img}
                        alt={name}
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=300'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                      />
                    </div>
                    <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0a1f1c', lineHeight: 1.35, marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {name}
                      </div>
                      {price && (
                        <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#0A3029' }}>{price}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.3rem', color: '#c9972b', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Shop <ArrowRight size={9} />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })
        }
      </div>

      {/* View all link */}
      <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #f0e5c5' }}>
        <Link
          to={`/shop?search=${encodeURIComponent(tags[0] || '')}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.67rem', fontWeight: 700, color: '#0A3029', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.06em' }}
        >
          View all related products <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}

// ── Article Body — splits content by <h3> and injects shop callouts inline ────
function ArticleBody({ content, shopCallouts = [] }) {
  const parts = content.split('<h3>');
  return (
    <div className="article-body" style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#374151' }}>
      {parts.map((part, idx) => {
        const html = idx === 0 ? part : '<h3>' + part;
        const callout = shopCallouts.find(c => c.afterSectionIndex === idx - 1);
        return (
          <Fragment key={idx}>
            <div dangerouslySetInnerHTML={{ __html: html }} />
            {callout && (
              <InlineShopCallout
                tags={callout.tags}
                headline={callout.headline}
                note={callout.note}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Shop Slide Panel ──────────────────────────────────────────────────────────
function ShopPanel({ open, onClose, tags, blogTitle }) {
  // lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 8000, backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            key="panel"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: 'min(500px, 100vw)',
              backgroundColor: '#f8fafc', zIndex: 8001,
              display: 'flex', flexDirection: 'column',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.25)',
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.5rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#0A3029', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.6rem', color: '#c9972b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '0.4rem' }}>
                  <ShoppingBag size={12} /> Shop This Guide
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'serif', lineHeight: 1.3 }}>
                  Plants & Supplies for<br />
                  <span style={{ color: '#c9972b' }}>"{blogTitle}"</span>
                </h3>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                  Curated specimens from verified Junglyst growers. Add to cart and check out without leaving.
                </p>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0, marginLeft: '1rem' }}
              >
                <X size={17} />
              </button>
            </div>

            {/* Scrollable product list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <BlogFeaturedProducts tags={tags} blogTitle={blogTitle} limit={6} />
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: 'white', flexShrink: 0 }}>
              <Link
                to="/shop"
                onClick={onClose}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#0A3029', color: 'white', padding: '0.85rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              >
                Browse Full Shop <ArrowRight size={15} />
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Difficulty colour helper ──────────────────────────────────────────────────
const DIFFICULTY_COLOR = { Easy: '#16a34a', Medium: '#d97706', Advanced: '#dc2626' };

// ── Related Guide Card ────────────────────────────────────────────────────────
function RelatedCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ position: 'relative', height: '160px', overflow: 'hidden', flexShrink: 0 }}>
          <img
            src={post.image}
            alt={post.title}
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=600'; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
            onMouseOver={e => { e.target.style.transform = 'scale(1.06)'; }}
            onMouseOut={e => { e.target.style.transform = 'scale(1)'; }}
          />
          <div style={{ position: 'absolute', top: '0.65rem', left: '0.65rem', backgroundColor: 'rgba(10,48,41,0.8)', backdropFilter: 'blur(6px)', padding: '0.2rem 0.55rem', borderRadius: '100px' }}>
            <span style={{ fontSize: '0.58rem', color: '#c9972b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{post.category}</span>
          </div>
        </div>
        <div style={{ padding: '1rem 1rem 1.1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.62rem', color: DIFFICULTY_COLOR[post.difficulty] || '#64748b', fontWeight: 700 }}>{post.difficulty}</span>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
            <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600 }}>{post.readTime}</span>
          </div>
          <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.92rem', fontWeight: 700, color: '#0A3029', lineHeight: 1.3, fontFamily: 'serif' }}>{post.title}</h4>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.76rem', color: '#64748b', lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#c9972b', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Read &amp; Shop <ArrowRight size={12} />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [shopOpen, setShopOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  const blog = blogs.find(b => b.slug === slug);

  if (!blog) {
    return (
      <div style={{ padding: '6rem 1rem', textAlign: 'center', minHeight: '80vh', fontFamily: 'Inter, sans-serif' }}>
        <BookOpen size={48} color="#e2e8f0" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
        <h2 style={{ fontSize: '2rem', fontFamily: 'serif', color: '#0A3029', marginBottom: '0.75rem' }}>Guide Not Found</h2>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>We couldn't find the article you're looking for.</p>
        <Link to="/guides" className="btn btn-primary" style={{ textDecoration: 'none', padding: '0.85rem 2rem' }}>
          Back to Plant Journal
        </Link>
      </div>
    );
  }

  const relatedBlogs = blogs
    .filter(b => b.category === blog.category && b.id !== blog.id)
    .slice(0, 3);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: blog.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      setShareMsg('Link copied!');
      setTimeout(() => setShareMsg(''), 2000);
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#1f2937', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <SEO
        title={`${blog.title} | Junglyst`}
        description={blog.description}
        path={`/blog/${blog.slug}`}
        image={blog.image}
        type="article"
      />
      <ReadingProgressBar />

      {/* ── Hero ── */}
      <div style={{ position: 'relative', minHeight: '75vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {/* Background image */}
        <img
          src={blog.image}
          alt={blog.title}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=1200'; }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,48,41,0.97) 0%, rgba(10,48,41,0.7) 45%, rgba(10,48,41,0.15) 100%)' }} />

        {/* Back button — top */}
        <div style={{ position: 'absolute', top: '1.5rem', left: 0, right: 0, zIndex: 2 }}>
          <div className="container">
            <button
              onClick={() => navigate('/guides')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '100px', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', transition: 'background 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; }}
            >
              <ChevronLeft size={15} /> Plant Journal
            </button>
          </div>
        </div>

        {/* Content over image */}
        <div className="container" style={{ position: 'relative', zIndex: 1, padding: 'clamp(2rem,5vw,4rem) 1.5rem clamp(2.5rem,5vw,4rem)' }}>
          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem', alignItems: 'center' }}
          >
            <span style={{ backgroundColor: '#c9972b', color: '#0A3029', padding: '0.3rem 0.85rem', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              {blog.category}
            </span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)', color: 'white', padding: '0.3rem 0.85rem', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: '1px solid rgba(255,255,255,0.2)' }}>
              {blog.difficulty} Level
            </span>
            {blog.isGeneralGuide && (
              <span style={{ backgroundColor: 'rgba(22,163,74,0.3)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', padding: '0.3rem 0.85rem', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Family Guide
              </span>
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            style={{ fontSize: 'clamp(1.75rem, 5vw, 3.75rem)', fontFamily: 'serif', fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: '1rem', maxWidth: '760px' }}
          >
            {blog.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
            style={{ fontSize: 'clamp(0.9rem,2vw,1.1rem)', color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, marginBottom: '1.75rem', maxWidth: '600px' }}
          >
            {blog.description}
          </motion.p>

          {/* Meta row */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem' }}>
              <User size={14} /> <span>{blog.author}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem' }}>
              <Calendar size={14} />
              <span>{new Date(blog.publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem' }}>
              <Clock size={14} /> <span>{blog.readTime}</span>
            </div>

            {/* Action buttons */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setBookmarked(p => !p)}
                style={{ background: bookmarked ? 'rgba(201,151,43,0.3)' : 'rgba(255,255,255,0.12)', border: `1px solid ${bookmarked ? 'rgba(201,151,43,0.5)' : 'rgba(255,255,255,0.2)'}`, backdropFilter: 'blur(8px)', borderRadius: '100px', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: bookmarked ? '#c9972b' : 'white', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.2s' }}
              >
                <Bookmark size={14} fill={bookmarked ? '#c9972b' : 'none'} /> {bookmarked ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={handleShare}
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: '100px', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'white', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.2s' }}
              >
                <Share2 size={14} /> {shareMsg || 'Share'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Article Content ── */}
      <div className="container" style={{ maxWidth: '820px', padding: 'clamp(2rem,5vw,4rem) 1.5rem' }}>

        {/* Article card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
          style={{ backgroundColor: 'white', borderRadius: '24px', padding: 'clamp(1.75rem,4vw,3.5rem)', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}
        >
          <ArticleBody content={blog.content} shopCallouts={blog.shopCallouts} />

          {/* Recommended Products — shop links that make intent crystal clear */}
          {blog.productTags && blog.productTags.length > 0 && (
            <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
                <ShoppingBag size={14} color="#0A3029" />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#0A3029' }}>
                  Recommended Products from this Guide
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.9rem', lineHeight: 1.5 }}>
                Browse verified specimens and supplies mentioned in this article:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
                {blog.productTags.map(t => (
                  <Link
                    key={t}
                    to={`/shop?search=${encodeURIComponent(t)}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      backgroundColor: '#0A3029', color: 'white',
                      padding: '0.45rem 1rem', borderRadius: '100px',
                      fontSize: '0.73rem', fontWeight: 700, textDecoration: 'none',
                      textTransform: 'capitalize', transition: 'all 0.18s',
                      border: '1.5px solid #0A3029',
                    }}
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#0A3029'; }}
                    onMouseOut={e => { e.currentTarget.style.backgroundColor = '#0A3029'; e.currentTarget.style.color = 'white'; }}
                  >
                    <ShoppingBag size={11} /> {t} <ArrowRight size={10} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Meta footer */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span><strong style={{ color: '#475569' }}>Category:</strong> {blog.category}</span>
            <span><strong style={{ color: '#475569' }}>Level:</strong> {blog.difficulty}</span>
            <span><strong style={{ color: '#475569' }}>Reading time:</strong> {blog.readTime}</span>
          </div>
        </motion.div>

        {/* Follow / Social */}
        <div style={{ marginTop: '2rem', padding: '1.75rem 2rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#94a3b8', margin: 0 }}>Enjoyed this read?</p>
          <p style={{ fontSize: '0.9rem', color: '#334155', margin: 0, maxWidth: '400px', lineHeight: 1.6 }}>Follow Junglyst for grower stories, care tips, and rare specimen drops.</p>
          <SocialLinks variant="light" size={17} buttonSize={40} gap={0.5} />
        </div>

        {/* ── Inline Shop Section ── */}
        <div style={{ marginTop: '3rem' }}>
          <BlogFeaturedProducts tags={blog.productTags || []} blogTitle={blog.title} limit={4} />
        </div>

        {/* ── Related Guides ── */}
        {relatedBlogs.length > 0 && (
          <section style={{ marginTop: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c9972b', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '0.4rem' }}>
                  <BookOpen size={12} /> More {blog.category} Guides
                </div>
                <h3 style={{ margin: 0, fontSize: 'clamp(1.3rem,2.5vw,1.75rem)', fontFamily: 'serif', color: '#0A3029' }}>
                  Keep Exploring
                </h3>
              </div>
              <Link to="/guides" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#c9972b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}>
                All articles <ArrowRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,240px),1fr))', gap: '1.25rem' }}>
              {relatedBlogs.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <RelatedCard post={r} />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Floating Shop FAB ── */}
      <AnimatePresence>
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.6, type: 'spring', damping: 18 }}
          whileHover={{ scale: 1.06, boxShadow: '0 12px 32px rgba(201,151,43,0.5)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShopOpen(true)}
          style={{
            position: 'fixed', bottom: 'clamp(5rem,10vw,6.5rem)', right: 'clamp(1rem,3vw,1.75rem)',
            backgroundColor: '#c9972b', color: '#0a1f1c',
            border: 'none', borderRadius: '100px',
            padding: '0.8rem 1.4rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            boxShadow: '0 8px 24px rgba(201,151,43,0.4)',
            zIndex: 7000,
          }}
        >
          <ShoppingBag size={16} /> Shop Products
        </motion.button>
      </AnimatePresence>

      {/* ── Shop Slide Panel ── */}
      <ShopPanel
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        tags={blog.productTags || []}
        blogTitle={blog.title}
      />
    </div>
  );
}
