export const getImageUrl = (img) => {
  if (!img) return ""; // Return empty string to trigger onError or allow component-level fallback
  if (img.startsWith('http')) return img;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  return `${baseUrl}${img.startsWith('/') ? '' : '/'}${img}`;
};
