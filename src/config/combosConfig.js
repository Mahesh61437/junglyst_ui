const LS_KEY = 'junglyst_combo_config';

export const DEFAULT_COMBOS = [
  {
    id: 'aquarium',
    label: 'Aquarium Combo',
    tagline: 'Plants · Fertilizers · CO2 · Equipment',
    type: 'aquarium',
    accent: '#00c2e0',
    bgGrad: 'linear-gradient(160deg, #071a2e 0%, #0c2d4a 100%)',
    waterColor: 'rgba(0,140,200,0.16)',
    substrateColor: '#3a2808',
    keywords: ['aquatic', 'aquarium', 'fertilizer', 'co2', 'carbon', 'moss', 'fern', 'java', 'substrate', 'plant'],
    filterTags: [
      { key: 'all',        label: 'All' },
      { key: 'plant',      label: 'Aquatic Plants', match: ['aquatic', 'moss', 'fern', 'java', 'plant'] },
      { key: 'fertilizer', label: 'Fertilizers',    match: ['fertilizer', 'fert', 'nutrient'] },
      { key: 'co2',        label: 'CO2',            match: ['co2', 'carbon', 'diffuser'] },
      { key: 'equipment',  label: 'Equipment',      match: ['aquarium', 'tank', 'filter', 'pump', 'light'] },
    ],
  },
  {
    id: 'terrarium',
    label: 'Terrarium Combo',
    tagline: 'Plants · Substrate · Decor · Botanicals',
    type: 'terrarium',
    accent: '#4ade80',
    bgGrad: 'linear-gradient(160deg, #0d2010 0%, #1a3a16 100%)',
    waterColor: 'rgba(20,80,20,0.18)',
    substrateColor: '#4a2d08',
    keywords: ['terrarium', 'tropical', 'fern', 'moss', 'botanical', 'substrate', 'vivarium', 'orchid', 'bromeliad', 'plant'],
    filterTags: [
      { key: 'all',       label: 'All' },
      { key: 'plant',     label: 'Plants',    match: ['fern', 'moss', 'orchid', 'bromeliad', 'tropical', 'plant'] },
      { key: 'substrate', label: 'Substrate', match: ['substrate', 'soil', 'mix', 'peat', 'coco'] },
      { key: 'decor',     label: 'Decor',     match: ['botanical', 'wood', 'rock', 'stone', 'decor'] },
    ],
  },
  {
    id: 'aquarium-fert',
    label: 'Aquarium Fertilizers',
    tagline: 'Root Tabs · Liquid Ferts · CO2 Boosters',
    type: 'aquarium',
    accent: '#38bdf8',
    bgGrad: 'linear-gradient(160deg, #061422 0%, #0c2840 100%)',
    waterColor: 'rgba(0,120,190,0.16)',
    substrateColor: '#2a1c04',
    keywords: ['aquarium', 'aquatic', 'fertilizer', 'fert', 'root', 'tab', 'liquid', 'co2', 'carbon', 'nutrient'],
    filterTags: [
      { key: 'all',    label: 'All' },
      { key: 'root',   label: 'Root Tabs',    match: ['root', 'tab', 'capsule'] },
      { key: 'liquid', label: 'Liquid Ferts', match: ['liquid', 'solution', 'micro', 'macro'] },
      { key: 'co2',    label: 'CO2 / Carbon', match: ['co2', 'carbon', 'excel', 'boost'] },
    ],
  },
  {
    id: 'terrarium-fert',
    label: 'Terrarium Fertilizers',
    tagline: 'Boosters · Tonics · Foliar Sprays',
    type: 'terrarium',
    accent: '#a3e635',
    bgGrad: 'linear-gradient(160deg, #111a05 0%, #203010 100%)',
    waterColor: 'rgba(40,90,10,0.18)',
    substrateColor: '#3d2205',
    keywords: ['fertilizer', 'fert', 'nutrient', 'booster', 'tonic', 'foliar', 'terrarium', 'tropical', 'plant'],
    filterTags: [
      { key: 'all',    label: 'All' },
      { key: 'liquid', label: 'Liquid',       match: ['liquid', 'solution', 'tonic'] },
      { key: 'powder', label: 'Powder / Dry', match: ['powder', 'dry', 'granule', 'slow'] },
      { key: 'foliar', label: 'Foliar Spray', match: ['foliar', 'spray', 'mist'] },
    ],
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
