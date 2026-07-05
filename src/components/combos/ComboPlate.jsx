import { J } from './comboTheme';

// Renders a real image when `src` is present; otherwise a tonal gradient block
// (the design prototype's `Plate`). Sharp corners, object-fit cover.
export default function ComboPlate({ src, alt = '', h, hue = 0, label, style = {} }) {
  const gradient = `linear-gradient(135deg, hsl(${130 + hue}, 24%, ${28 + hue * 0.4}%), hsl(${150 + hue}, 32%, ${48 + hue * 0.5}%) 60%, hsl(${165 + hue}, 28%, ${36 + hue * 0.3}%))`;
  return (
    <div style={{ position: 'relative', width: '100%', height: h, overflow: 'hidden', background: gradient, ...style }}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 25% 75%, rgba(255,255,255,0.16), transparent 55%), radial-gradient(ellipse at 75% 25%, rgba(0,0,0,0.28), transparent 55%)' }} />
          {label && (
            <div style={{ position: 'absolute', bottom: 16, left: 18, fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(255,255,255,0.78)' }}>{label}</div>
          )}
        </>
      )}
    </div>
  );
}
