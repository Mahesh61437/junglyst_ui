import { useQuery } from '@tanstack/react-query';
import { Loader2, Users, Hash } from 'lucide-react';
import SEO from '../components/SEO';
import PostCard from '../components/community/PostCard';
import PostComposer from '../components/community/PostComposer';
import { CommunityService, communityKeys } from '../services/CommunityService';


export default function Community() {
  const { data, isLoading, isError } = useQuery({
    queryKey: communityKeys.posts,
    queryFn: () => CommunityService.listPosts({ page: 1, pageSize: 20 }),
    staleTime: 30_000,
  });

  const posts = data?.results || [];

  return (
    <>
      <SEO
        title="Community — Junglyst"
        description="Share plant care wins, propagation tips, and questions with the Junglyst community."
      />

      <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh' }}>
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>

            {/* Header */}
            <header style={{ marginBottom: '1.5rem' }}>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 4vw, 2.4rem)',
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                The Community
              </h1>
              <p style={{ color: 'var(--text-secondary)', margin: '0.35rem 0 0', fontSize: '0.95rem' }}>
                Plant wins, propagation tips, ID questions — share with fellow growers.
              </p>
            </header>

            {/* Composer */}
            <PostComposer />

            {/* Feed */}
            {isLoading && (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                <Loader2 size={20} className="spin" />
              </div>
            )}

            {isError && (
              <div role="alert" style={{
                background: '#fff2f2', color: '#a02929',
                border: '1px solid #f5cdcd', borderRadius: 10,
                padding: '0.75rem 1rem', fontSize: '0.9rem',
              }}>
                Couldn't load the feed. Refresh to try again.
              </div>
            )}

            {!isLoading && !isError && posts.length === 0 && (
              <EmptyState />
            )}

            {posts.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </div>
      </div>
    </>
  );
}


function EmptyState() {
  return (
    <div style={{
      background: '#ffffff', border: '1px dashed var(--border-subtle)',
      borderRadius: 14, padding: '2.5rem 1.5rem',
      textAlign: 'center', color: 'var(--text-secondary)',
    }}>
      <Users size={28} style={{ color: 'var(--brand-green)', marginBottom: 10 }} />
      <h3 style={{ color: 'var(--text-primary)', margin: '0 0 6px', fontFamily: 'var(--font-serif)' }}>
        Nothing here yet
      </h3>
      <p style={{ fontSize: '0.9rem', maxWidth: 360, margin: '0 auto' }}>
        Be the first to share. Post a plant photo, ask an ID question, or drop a propagation tip.
      </p>
      <p style={{ marginTop: 12, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <Hash size={13} /> Tip: add hashtags so others can find your post.
      </p>
    </div>
  );
}
