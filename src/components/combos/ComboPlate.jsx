import { J } from './comboTheme';

// 1–4 component-product images as an editorial hero + support-column mosaic:
// one dominant photo on the left (or fullbleed if it's the only one) with the
// rest stacked in a narrower column — reads as an intentional collage even
// when the source photos are wildly different subjects/crops, unlike a flat
// NxN grid where every tile competes for attention equally.
function ImageMosaic({ images }) {
  const cell = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
  const [hero, ...rest] = images;

  if (rest.length === 0) {
    return <img src={hero} alt="" loading="lazy" style={{ ...cell, position: 'absolute', inset: 0 }} />;
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'grid',
      gridTemplateColumns: '1.7fr 1fr', gap: 3, background: 'rgba(255,255,255,0.5)',
    }}>
      <img src={hero} alt="" loading="lazy" style={cell} />
      <div style={{ display: 'grid', gridTemplateRows: `repeat(${rest.length}, 1fr)`, gap: 3 }}>
        {rest.map((url, i) => (
          <img key={i} src={url} alt="" loading="lazy" style={{ ...cell, filter: 'brightness(0.94)' }} />
        ))}
      </div>
      {/* Bottom scrim — keeps overlay badges legible over busy photo content */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.32) 100%)', pointerEvents: 'none' }} />
    </div>
  );
}

// Renders a real image when `src` is present; falls back to a mosaic of
// `images` (component-product photos) when there's no dedicated hero image;
// otherwise a tonal gradient block (the design prototype's `Plate`).
export default function ComboPlate({ src, alt = '', h, hue = 0, label, images = [], style = {} }) {
  const gradient = `linear-gradient(135deg, hsl(${130 + hue}, 24%, ${28 + hue * 0.4}%), hsl(${150 + hue}, 32%, ${48 + hue * 0.5}%) 60%, hsl(${165 + hue}, 28%, ${36 + hue * 0.3}%))`;
  const mosaicImages = (images || []).filter(Boolean).slice(0, 4);

  return (
    <div style={{ position: 'relative', width: '100%', height: h, overflow: 'hidden', background: gradient, ...style }}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : mosaicImages.length > 0 ? (
        <ImageMosaic images={mosaicImages} />
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
