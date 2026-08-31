// v2: tiles now map to backend combo categories (complete_build/plants_only/
// hardscape/fertilizers) instead of aquarium/terrarium keyword sets — bumped
// so any previously-saved admin edits under the old schema are ignored.
const LS_KEY = 'junglyst_combo_config_v2';

// Each tile's `type` maps to Combo.combo_type on the backend — tapping a tile
// takes you to /combos?type=<value>, i.e. the same category filter used on
// the Combos page (see comboTheme.js COMBO_TYPES).
export const DEFAULT_COMBOS = [
  {
    id: 'complete-build',
    label: 'Complete Build',
    tagline: 'Full setups — plants, hardscape, equipment',
    type: 'complete_build',
    accent: '#00c2e0',
    bgGrad: 'linear-gradient(160deg, #071a2e 0%, #0c2d4a 100%)',
  },
  {
    id: 'plants-only',
    label: 'Plants Only',
    tagline: 'Curated plant sets for aquariums & terrariums',
    type: 'plants_only',
    accent: '#4ade80',
    bgGrad: 'linear-gradient(160deg, #0d2010 0%, #1a3a16 100%)',
  },
  {
    id: 'hardscape',
    label: 'Hardscape',
    tagline: 'Wood, rock & substrate combos',
    type: 'hardscape',
    accent: '#38bdf8',
    bgGrad: 'linear-gradient(160deg, #061422 0%, #0c2840 100%)',
  },
  {
    id: 'fertilizers',
    label: 'Fertilizers',
    tagline: 'Root tabs, liquid ferts, boosters & tonics',
    type: 'fertilizers',
    accent: '#a3e635',
    bgGrad: 'linear-gradient(160deg, #111a05 0%, #203010 100%)',
  },
];

export function loadCombosConfig() {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_COMBOS;
}

export function saveCombosConfig(combos) {
  localStorage.setItem(LS_KEY, JSON.stringify(combos));
  window.dispatchEvent(new CustomEvent('combos-config-updated'));
}

export function resetCombosConfig() {
  localStorage.removeItem(LS_KEY);
  window.dispatchEvent(new CustomEvent('combos-config-updated'));
}
