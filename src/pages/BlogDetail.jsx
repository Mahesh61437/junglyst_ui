import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, User } from 'lucide-react';
import { blogs } from '../data/blogs';
import SEO from '../components/SEO';
import BlogFeaturedProducts from '../components/BlogFeaturedProducts';
import SocialLinks from '../components/SocialLinks';

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const blog = blogs.find(b => b.slug === slug);
  
  if (!blog) {
    return (
      <div style={{ padding: '6rem 1rem', textAlign: 'center', minHeight: '80vh' }}>
        <h2 style={{ fontSize: '2rem', fontFamily: 'serif', color: '#0A3029', marginBottom: '1rem' }}>Blog Not Found</h2>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>Sorry, we couldn't find the blog you're looking for.</p>
        <Link to="/guides" style={{
          display: 'inline-block',
          padding: '0.75rem 2rem',
          backgroundColor: '#10b981',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: 600
        }}>
          Back to Care Guides
        </Link>
      </div>
    );
  }
  
  const relatedBlogs = blogs.filter(b => b.category === blog.category && b.id !== blog.id).slice(0, 3);
  
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#1f2937', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <SEO
        title={`${blog.title} | Junglyst`}
        description={blog.excerpt || blog.description || `${blog.title} — read the full care guide on Junglyst.`}
        path={`/blog/${blog.slug}`}
        image={blog.image || blog.coverImage || undefined}
        type="article"
        schemaType="Article"
        schemaData={{
          headline: blog.title,
          author: { '@type': 'Person', name: blog.author || 'Junglyst' },
          datePublished: blog.date || blog.publishedAt,
          image: blog.image || blog.coverImage,
        }}
      />
      {/* Hero Section */}
      <div style={{ backgroundColor: '#0A3029', color: 'white', paddingTop: '4rem', paddingBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <button
            onClick={() => navigate('/guides')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              marginBottom: '2rem',
              fontSize: '0.9rem'
            }}
          >
            <ChevronLeft size={18} /> Back to Guides
          </button>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{
              display: 'inline-block',
              backgroundColor: '#10b981',
              color: '#0A3029',
              padding: '0.5rem 1rem',
              borderRadius: '100px',
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '1rem'
            }}>
              {blog.category}
            </span>
          </div>
          
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
            fontFamily: 'serif',
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: '2rem'
          }}>
            {blog.title}
          </h1>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2rem',
            fontSize: '0.9rem',
            opacity: 0.9
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} />
              <span><strong>By</strong> {blog.author}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} />
              <span>{new Date(blog.publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} />
              <span>{blog.readTime}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Featured Image */}
      <div style={{ backgroundColor: '#e2e8f0', maxHeight: '500px', overflow: 'hidden' }}>
        <img
          src={blog.image}
          alt={blog.title}
          style={{
            width: '100%',
            height: '500px',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      </div>
      
      {/* Main Content */}
      <div style={{ padding: '4rem 1rem' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{
            backgroundColor: 'white',
            padding: 'clamp(2rem, 4vw, 3rem)',
            borderRadius: '20px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            lineHeight: 1.8
          }}>
            <div
              dangerouslySetInnerHTML={{ __html: blog.content }}
              style={{
                fontSize: '1.05rem',
                color: '#374151'
              }}
            />
            
            {/* Blog Meta */}
            <div style={{
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: '1px solid #e5e7eb',
              fontSize: '0.9rem',
              color: '#6b7280'
            }}>
              <p><strong>Difficulty Level:</strong> {blog.difficulty}</p>
              <p><strong>Reading Time:</strong> {blog.readTime}</p>
              <p><strong>Category:</strong> {blog.category}</p>
            </div>
          </div>

          {/* Follow / share */}
          <div style={{
            marginTop: '3rem',
            padding: '2rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#94a3b8', margin: 0 }}>Enjoyed this read?</p>
            <p style={{ fontSize: '0.95rem', color: '#334155', margin: 0, maxWidth: '480px', lineHeight: 1.6 }}>Follow Junglyst for grower stories, care tips, and rare specimen drops.</p>
            <SocialLinks variant="light" size={18} buttonSize={42} gap={0.6} />
          </div>

          {/* Featured Products related to this blog */}
          <BlogFeaturedProducts
            tags={blog.productTags || []}
            blogTitle={blog.title}
            limit={4}
          />

          {/* Related Blogs */}
          {relatedBlogs.length > 0 && (
            <div style={{ marginTop: '6rem' }}>
              <h3 style={{
                fontSize: '2rem',
                fontFamily: 'serif',
                color: '#0A3029',
                marginBottom: '2rem'
              }}>
                Related Articles
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
              }}>
                {relatedBlogs.map(relatedBlog => (
                  <Link
                    key={relatedBlog.id}
                    to={`/blog/${relatedBlog.slug}`}
                    style={{
                      textDecoration: 'none',
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      height: '200px',
                      overflow: 'hidden'
                    }}>
                      <img
                        src={relatedBlog.image}
                        alt={relatedBlog.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      <span style={{
                        display: 'inline-block',
                        color: '#10b981',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '0.5rem'
                      }}>
                        {relatedBlog.category}
                      </span>
                      <h4 style={{
                        color: '#0A3029',
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        marginBottom: '0.5rem',
                        lineHeight: 1.3
                      }}>
                        {relatedBlog.title}
                      </h4>
                      <p style={{
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        marginBottom: '1rem',
                        lineHeight: 1.5
                      }}>
                        {relatedBlog.description}
                      </p>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#10b981',
                        fontWeight: 700,
                        fontSize: '0.875rem'
                      }}>
                        Read More <ChevronLeft size={14} style={{ transform: 'rotate(180deg)' }} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
