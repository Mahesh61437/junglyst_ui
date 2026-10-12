// Shows the whole photo (never cropped) inside a fixed-shape frame. A blurred,
// enlarged copy of the same photo fills the leftover space so tall or wide
// shots still look intentional. The backdrop is decorative (aria-hidden).
export default function FramedImage({ src, alt, loading }) {
  return (
    <>
      <img className="ws-framed-bg" src={src} alt="" aria-hidden="true" loading={loading} />
      <img className="ws-framed-fg" src={src} alt={alt} loading={loading} />
    </>
  );
}
