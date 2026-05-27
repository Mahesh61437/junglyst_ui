export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/the.junglyst/',
  threads: 'https://www.threads.com/@the.junglyst',
  facebook: 'https://www.facebook.com/profile.php?id=61589153435622',
  email: 'admin@junglyst.com',
};

function InstagramIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.77l-.44 2.9h-2.33V22c4.78-.79 8.43-4.94 8.43-9.94z" />
    </svg>
  );
}

function ThreadsIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 11.13c-.08-.04-.16-.08-.25-.11-.14-2.58-1.55-4.06-3.91-4.07h-.03c-1.41 0-2.59.6-3.31 1.7l1.3.89c.54-.82 1.39-.99 2.01-.99h.02c.78 0 1.36.23 1.74.67.27.32.45.77.54 1.33-.66-.11-1.37-.15-2.13-.11-2.13.12-3.5 1.36-3.41 3.08.05.87.48 1.62 1.22 2.11.62.41 1.43.61 2.26.57 1.11-.06 1.97-.48 2.58-1.25.46-.58.75-1.34.88-2.29.53.32.93.74 1.14 1.25.37.86.39 2.27-.76 3.42-1.01 1-2.22 1.44-4.05 1.45-2.03-.01-3.56-.66-4.56-1.93-.94-1.19-1.42-2.9-1.44-5.1.02-2.2.5-3.91 1.44-5.1.99-1.27 2.53-1.92 4.56-1.93 2.04.01 3.61.66 4.65 1.94.51.62.9 1.41 1.15 2.32l1.55-.41c-.31-1.12-.79-2.09-1.45-2.9-1.34-1.65-3.3-2.5-5.85-2.51h-.01c-2.54.01-4.48.86-5.78 2.52-1.15 1.47-1.75 3.52-1.77 6.07v.01c.02 2.55.62 4.59 1.77 6.07 1.29 1.66 3.24 2.51 5.78 2.52h.01c2.26-.01 3.85-.6 5.16-1.91 1.72-1.71 1.67-3.86.91-5.18-.42-.74-1.05-1.34-1.84-1.78zm-3.97 3.45c-.92.05-1.87-.36-1.92-1.24-.03-.65.47-1.38 1.96-1.46.17-.01.34-.01.5-.01.54 0 1.05.05 1.51.15-.17 2.15-1.18 2.51-2.05 2.56z" />
    </svg>
  );
}

function MailIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </svg>
  );
}

const ICONS = {
  instagram: InstagramIcon,
  threads: ThreadsIcon,
  facebook: FacebookIcon,
  email: MailIcon,
};

const LABELS = {
  instagram: 'Follow on Instagram',
  threads: 'Follow on Threads',
  facebook: 'Like on Facebook',
  email: 'Email Junglyst',
};

const HREFS = {
  instagram: SOCIAL_LINKS.instagram,
  threads: SOCIAL_LINKS.threads,
  facebook: SOCIAL_LINKS.facebook,
  email: `mailto:${SOCIAL_LINKS.email}`,
};

const ORDER = ['instagram', 'threads', 'facebook', 'email'];

/**
 * Reusable inline social icon row.
 *
 * Props:
 *   variant   'light' (dark icons on light bg) | 'dark' (light icons on dark bg)
 *   size      icon pixel size (default 18)
 *   buttonSize tap-target diameter (default 40)
 *   gap       gap between icons in rem (default 0.75)
 *   accent    color used on hover (defaults to brand gold)
 */
export default function SocialLinks({
  variant = 'light',
  size = 18,
  buttonSize = 40,
  gap = 0.75,
  accent = 'var(--brand-gold)',
}) {
  const isDark = variant === 'dark';
  const baseColor = isDark ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)';
  const borderColor = isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0';
  const bgColor = isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc';

  return (
    <div style={{ display: 'flex', gap: `${gap}rem`, flexWrap: 'wrap' }}>
      {ORDER.map((key) => {
        const Icon = ICONS[key];
        return (
          <a
            key={key}
            href={HREFS[key]}
            target={key === 'email' ? undefined : '_blank'}
            rel={key === 'email' ? undefined : 'noopener noreferrer'}
            aria-label={LABELS[key]}
            title={LABELS[key]}
            style={{
              width: buttonSize,
              height: buttonSize,
              borderRadius: '50%',
              background: bgColor,
              border: `1px solid ${borderColor}`,
              color: baseColor,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              transition: 'color 0.15s, border-color 0.15s, background 0.15s, transform 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = accent;
              e.currentTarget.style.borderColor = accent;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = baseColor;
              e.currentTarget.style.borderColor = borderColor;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Icon size={size} />
          </a>
        );
      })}
    </div>
  );
}
