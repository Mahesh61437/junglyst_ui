import { useEffect, useRef, useState } from 'react';

/**
 * Lightweight canvas confetti — no dependencies.
 *
 * Fires a burst every time `burstKey` changes. Set `finale` for a sustained
 * celebratory rain. Honours prefers-reduced-motion (renders nothing).
 *
 * Props:
 *   burstKey  — change this value to trigger a fresh burst
 *   colors    — array of hex colours for the pieces
 *   finale    — boolean; when true, keeps emitting a gentle rain
 *   origin    — { x, y } in 0..1 viewport coords for the burst source
 */
export default function Confetti({ burstKey = 0, colors, finale = false, origin = { x: 0.5, y: 0.42 } }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const finaleRef = useRef(finale);
  const colorsRef = useRef(colors || ['#c9972b', '#e8b84b', '#ffffff', '#a855f7', '#7dd3fc', '#fca5a5']);
  const [reduced] = useState(
    () => typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  // Keep the loop's refs in sync with props without reassigning during render.
  useEffect(() => { finaleRef.current = finale; }, [finale]);
  useEffect(() => {
    colorsRef.current = colors || ['#c9972b', '#e8b84b', '#ffffff', '#a855f7', '#7dd3fc', '#fca5a5'];
  }, [colors]);

  // Resize canvas to viewport with DPR awareness.
  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // The animation loop runs once; it reads refs so it always sees fresh state.
  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let last = performance.now();
    let finaleAccum = 0;

    const spawn = (n, ox, oy, spread = Math.PI * 2, power = 9) => {
      for (let i = 0; i < n; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
        const speed = power * (0.5 + Math.random());
        const cols = colorsRef.current;
        particlesRef.current.push({
          x: ox,
          y: oy,
          vx: Math.cos(angle) * speed * (0.6 + Math.random() * 0.8),
          vy: Math.sin(angle) * speed - Math.random() * 4,
          size: 5 + Math.random() * 7,
          color: cols[(Math.random() * cols.length) | 0],
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          shape: Math.random() > 0.5 ? 'rect' : 'circle',
          life: 1,
          decay: 0.004 + Math.random() * 0.006,
        });
      }
    };

    // Expose spawn for the burst effect below.
    canvas.__spawnBurst = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      spawn(160, w * origin.x, h * origin.y, Math.PI * 2, 11);
    };

    const tick = (now) => {
      const dt = Math.min((now - last) / 16.67, 2.5);
      last = now;
      const w = window.innerWidth;
      const h = window.innerHeight;

      if (finaleRef.current) {
        finaleAccum += dt;
        if (finaleAccum > 4) {
          finaleAccum = 0;
          for (let k = 0; k < 6; k++) {
            const px = Math.random() * w;
            particlesRef.current.push({
              x: px, y: -20,
              vx: (Math.random() - 0.5) * 2,
              vy: 2 + Math.random() * 2,
              size: 5 + Math.random() * 7,
              color: colorsRef.current[(Math.random() * colorsRef.current.length) | 0],
              rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.2,
              shape: Math.random() > 0.5 ? 'rect' : 'circle',
              life: 1, decay: 0.0016 + Math.random() * 0.002,
            });
          }
        }
      }

      ctx.clearRect(0, 0, w, h);
      const next = [];
      for (const p of particlesRef.current) {
        p.vy += 0.22 * dt;            // gravity
        p.vx *= 0.99;                 // air drag
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.life -= p.decay * dt;
        if (p.life <= 0 || p.y > h + 30) continue;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        next.push(p);
      }
      particlesRef.current = next;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire a burst whenever burstKey changes (skip the initial 0).
  useEffect(() => {
    if (reduced || burstKey === 0) return;
    canvasRef.current?.__spawnBurst?.();
  }, [burstKey]);

  if (reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 60,
      }}
    />
  );
}
