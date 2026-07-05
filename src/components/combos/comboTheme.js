// Combos design tokens — translated from the design handoff prototype's `J`/`T`
// objects to match Junglyst's existing palette (see :root in src/index.css).
// Kept as a small JS module because the combo screens are inline-style heavy,
// mirroring the prototype and the rest of the storefront's inline-style pages.

export const J = {
  deep: '#0A3029',
  deeper: '#06201B',
  green: '#105c44',
  gold: '#D4AF37',
  goldSoft: '#E5D4A8',

  page: '#FAFAF7',
  paper: '#FFFFFF',
  cream: '#F4F1EA',
  sage: '#F0EDE3',
  bone: '#E8E4D8',

  ink: '#0A1A17',
  text: '#1a2624',
  text2: '#5a6b67',
  text3: '#9aa5a1',

  hair: 'rgba(10,32,27,0.08)',
  border: '#dcd6c8',
  borderS: '#ece8db',

  red: '#a8362c',
  amber: '#a8742c',
  ok: '#3f7a52',
};

export const T = {
  serif: '"Playfair Display", "EB Garamond", Georgia, serif',
  sans: '"Outfit", ui-sans-serif, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

// Filter chips for the listing. value maps to Combo.combo_type on the backend.
export const COMBO_TYPES = [
  { label: 'All', value: 'All' },
  { label: 'Complete build', value: 'Complete build' },
  { label: 'Plants only', value: 'Plants only' },
  { label: 'Hardscape', value: 'Hardscape' },
  { label: 'Fertilizers', value: 'Fertilizers' },
];

// Derive availability from a detail combo's components.
//   'full'    — every component in stock
//   'partial' — some in stock, at least one out
//   'oos'     — nothing in stock
export function comboAvailability(combo) {
  // Prefer the backend-computed value; fall back to deriving from components.
  if (combo?.availability) return combo.availability;
  const items = combo?.items || [];
  if (!items.length) return 'oos';
  const available = items.filter((it) => it.in_stock);
  if (available.length === 0) return 'oos';
  if (available.length < items.length) return 'partial';
  return 'full';
}
