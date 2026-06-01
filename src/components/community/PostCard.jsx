import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, ShieldCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CommunityService, communityKeys } from '../../services/CommunityService';
import { useAuth } from '../../context/AuthContext';


// ── Relative time helper (no extra dep) ──────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return '';
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString();
}


function PostBody({ post }) {
  return (
    <p style={{
      whiteSpace: 'pre-wrap',
      lineHeight: 1.55,
      color: 'var(--text-primary)',
      fontSize: '0.96rem',
      margin: '0.65rem 0',
    }}>
      {post.body}
    </p>
  );
}

function PostImages({ images }) {
  if (!images?.length) return null;
  if (images.length === 1) {
    return (
      <img
        src={images[0].image_url}
        alt=""
        style={{
          width: '100%',
          maxHeight: 520,
          objectFit: 'cover',
          borderRadius: 12,
          marginTop: '0.5rem',
        }}
      />
    );
  }
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 6,
      marginTop: '0.5rem',
    }}>
      {images.slice(0, 4).map((img) => (
        <img
          key={img.id}
          src={img.image_url}
          alt=""
          style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 }}
        />
      ))}
    </div>
  );
}

function YouTubeEmbed({ videoId }) {
  if (!videoId) return null;
  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, marginTop: '0.6rem', borderRadius: 12, overflow: 'hidden' }}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}


export default function PostCard({ post }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [liked, setLiked] = useState(post.is_liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);

  const likeMutation = useMutation({
    mutationFn: () => CommunityService.togglePostLike(post.id),
    onMutate: () => {
      // Optimistic
      setLiked((v) => !v);
      setLikeCount((c) => c + (liked ? -1 : 1));
    },
    onError: () => {
      // Revert
      setLiked((v) => !v);
      setLikeCount((c) => c + (liked ? 1 : -1));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: communityKeys.posts });
    },
  });

  const onLike = () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    likeMutation.mutate();
  };

  const author = post.author || {};
  const authorHandle = author.handle || '';
  const tags = post.tags || [];

  return (
    <article style={{
      background: '#ffffff',
      border: '1px solid var(--border-subtle)',
      borderRadius: 14,
      padding: '1.1rem 1.2rem',
      marginBottom: '1rem',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to={authorHandle ? `/u/${authorHandle}` : '#'} style={{ display: 'block' }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'var(--bg-secondary)',
            backgroundImage: author.avatar_url ? `url(${author.avatar_url})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center',
            border: '1px solid var(--border-subtle)',
          }} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link to={authorHandle ? `/u/${authorHandle}` : '#'}
              style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
              @{authorHandle || 'unknown'}
            </Link>
            {author.is_verified_seller && (
              <span title="Verified Seller" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--brand-gold)' }}>
                <ShieldCheck size={15} />
              </span>
            )}
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>· {timeAgo(post.created_at)}</span>
            {post.edited_at && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontStyle: 'italic' }}>(edited)</span>
            )}
          </div>
        </div>
        <button
          aria-label="More"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 6 }}
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Body */}
      {post.body && <PostBody post={post} />}

      {/* Media */}
      {post.post_type === 'image' && <PostImages images={post.images} />}
      {post.post_type === 'youtube' && <YouTubeEmbed videoId={post.youtube_video_id} />}

      {/* Tagged product (marketplace tie-in) */}
      {post.tagged_product && (
        <Link
          to={`/product/${post.tagged_product.slug}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            border: '1px solid var(--border-subtle)', borderRadius: 10,
            padding: 8, marginTop: 10, textDecoration: 'none',
            color: 'var(--text-primary)',
          }}
        >
          {post.tagged_product.image && (
            <img
              src={post.tagged_product.image}
              alt=""
              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }}
            />
          )}
          <div style={{ fontSize: '0.88rem' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tagged product
            </div>
            <div style={{ fontWeight: 600 }}>{post.tagged_product.name}</div>
          </div>
        </Link>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: '0.65rem' }}>
          {tags.map((t) => (
            <Link
              key={t}
              to={`/tag/${t}`}
              style={{
                fontSize: '0.78rem',
                color: 'var(--brand-green)',
                background: 'var(--bg-secondary)',
                padding: '3px 9px',
                borderRadius: 999,
                textDecoration: 'none',
              }}
            >
              #{t}
            </Link>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        marginTop: '0.85rem', paddingTop: '0.65rem',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <button
          onClick={onLike}
          disabled={likeMutation.isPending}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'none', border: 'none', cursor: 'pointer',
            color: liked ? '#d24a4a' : 'var(--text-secondary)',
            fontSize: '0.88rem', padding: 4,
          }}
        >
          <Heart size={17} fill={liked ? '#d24a4a' : 'none'} />
          <span>{likeCount}</span>
        </button>

        <Link
          to={`/community/post/${post.id}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            textDecoration: 'none',
            color: 'var(--text-secondary)', fontSize: '0.88rem',
          }}
        >
          <MessageCircle size={17} />
          <span>{post.comment_count}</span>
        </Link>
      </div>
    </article>
  );
}
