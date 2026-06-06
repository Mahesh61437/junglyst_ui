import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';
import { CommunityService, communityKeys } from '../../services/CommunityService';
import { useAuth } from '../../context/AuthContext';

const MAX_BODY = 1000;


export default function PostComposer({ onPosted }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (payload) => CommunityService.createPost(payload),
    onSuccess: (post) => {
      setBody('');
      setError('');
      qc.invalidateQueries({ queryKey: communityKeys.posts });
      onPosted?.(post);
    },
    onError: (err) => {
      const detail = err?.response?.data;
      if (typeof detail === 'string') setError(detail);
      else if (detail?.body) setError(Array.isArray(detail.body) ? detail.body[0] : String(detail.body));
      else if (detail?.detail) setError(String(detail.detail));
      else setError('Could not post — please try again.');
    },
  });

  const submit = (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    createMutation.mutate({
      body: body.trim(),
      post_type: 'text',
    });
  };

  if (!user) {
    return (
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12, padding: '1rem 1.1rem', marginBottom: '1rem',
        textAlign: 'center',
        color: 'var(--text-secondary)', fontSize: '0.92rem',
      }}>
        <a href="/login" style={{ color: 'var(--brand-green)', fontWeight: 600 }}>Log in</a> to share with the community.
      </div>
    );
  }

  const charsLeft = MAX_BODY - body.length;

  return (
    <form onSubmit={submit} style={{
      background: '#ffffff',
      border: '1px solid var(--border-subtle)',
      borderRadius: 14, padding: '1rem 1.1rem',
      marginBottom: '1.25rem',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
        placeholder="Share something with the community — plant care tips, propagation wins, or ID questions. Use #hashtags."
        rows={3}
        style={{
          width: '100%', resize: 'vertical',
          border: 'none', outline: 'none',
          fontFamily: 'inherit', fontSize: '0.96rem',
          color: 'var(--text-primary)',
          background: 'transparent',
          lineHeight: 1.5,
        }}
      />
      {error && (
        <div role="alert" style={{
          background: '#fff2f2', color: '#a02929',
          border: '1px solid #f5cdcd', borderRadius: 8,
          padding: '0.5rem 0.75rem', fontSize: '0.85rem',
          marginTop: 8,
        }}>
          {error}
        </div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)',
      }}>
        <span style={{ fontSize: '0.78rem', color: charsLeft < 80 ? '#a02929' : 'var(--text-secondary)' }}>
          {charsLeft} characters left
        </span>
        <button
          type="submit"
          disabled={!body.trim() || createMutation.isPending}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--brand-green)', color: '#fff',
            border: 'none', borderRadius: 999,
            padding: '0.5rem 1.05rem',
            fontWeight: 600, fontSize: '0.88rem',
            cursor: body.trim() && !createMutation.isPending ? 'pointer' : 'not-allowed',
            opacity: body.trim() && !createMutation.isPending ? 1 : 0.5,
          }}
        >
          {createMutation.isPending
            ? <><Loader2 size={15} className="spin" /> Posting…</>
            : <><Send size={14} /> Post</>}
        </button>
      </div>
    </form>
  );
}
