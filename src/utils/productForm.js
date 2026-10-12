// Validation + payload helpers for the seller "list a specimen" form.
//
// Rules mirror the backend (core.serializers.ProductSerializer):
//   - name, description: required; description may be blank on drafts
//   - variants: base_price + stock required; label is optional
//   - packed weight 1–30,000 g and box dimensions > 0 (needed to quote shipping)
// Publishing additionally needs a category and at least one image — a buyer-facing
// listing without them can't be browsed or shown.
//
// Error keys match what the form renders: `name`, `tagline`, `category_ids`,
// `description`, `images`, and `variant_<index>_<field>` for variant inputs.

import { getApiErrorMessage } from './apiError.js';

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 255;
export const TAGLINE_MAX_LENGTH = 500;
export const DESCRIPTION_MIN_LENGTH = 20;
export const MAX_PRICE = 1000000;
export const PACKED_WEIGHT_MIN_GRAMS = 1;
export const PACKED_WEIGHT_MAX_GRAMS = 30000;
export const BOX_DIMENSIONS = ['length', 'width', 'height'];

const isBlank = value => value === '' || value === null || value === undefined || String(value).trim() === '';

export const variantErrorKey = (index, field) => `variant_${index}_${field}`;

function validateName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'Specimen name is required';
  if (trimmed.length < NAME_MIN_LENGTH) return `Must be at least ${NAME_MIN_LENGTH} characters`;
  if (trimmed.length > NAME_MAX_LENGTH) return `Must be under ${NAME_MAX_LENGTH} characters`;
  return null;
}

function validatePrice(value) {
  if (isBlank(value)) return 'Price is required';
  const price = Number(value);
  if (Number.isNaN(price) || price <= 0) return 'Must be greater than 0';
  if (price > MAX_PRICE) return 'Price seems too high';
  return null;
}

function validateStock(value) {
  if (isBlank(value)) return 'Stock is required';
  const stock = Number(value);
  if (Number.isNaN(stock) || stock < 0) return 'Must be 0 or more';
  if (!Number.isInteger(stock)) return 'Must be a whole number';
  return null;
}

function validatePackedWeight(value) {
  if (isBlank(value)) return 'Packed weight is required';
  const grams = Number(value);
  if (!Number.isInteger(grams)) return 'Must be a whole number of grams';
  if (grams < PACKED_WEIGHT_MIN_GRAMS || grams > PACKED_WEIGHT_MAX_GRAMS) return 'Must be 1–30,000 g';
  return null;
}

function validateDimension(value) {
  if (isBlank(value)) return 'Required';
  const size = Number(value);
  if (Number.isNaN(size) || size <= 0) return 'Must be > 0';
  return null;
}

function validateVariant(variant, index, errors) {
  const checks = [
    ['stock', validateStock(variant.stock)],
    ['base_price', validatePrice(variant.base_price)],
    ['packed_weight_grams', validatePackedWeight(variant.packed_weight_grams)],
    ...BOX_DIMENSIONS.map(dim => [dim, validateDimension(variant[dim])]),
  ];
  for (const [field, message] of checks) {
    if (message) errors[variantErrorKey(index, field)] = message;
  }
}

// Returns { [errorKey]: message } in on-screen order (first key = first field to fix).
export function validateProductForm(product, { isDraft = false } = {}) {
  const errors = {};

  const nameError = validateName(product.name);
  if (nameError) errors.name = nameError;

  if ((product.tagline || '').length > TAGLINE_MAX_LENGTH) {
    errors.tagline = `Max ${TAGLINE_MAX_LENGTH} characters`;
  }

  // Drafts only need a name — everything else can be finished later.
  if (isDraft) return errors;

  if (!product.category_ids?.length) errors.category_ids = 'Select at least one category';

  (product.variants || []).forEach((variant, index) => validateVariant(variant, index, errors));

  const description = (product.description || '').trim();
  if (!description) errors.description = 'Description is required';
  else if (description.length < DESCRIPTION_MIN_LENGTH) errors.description = `Must be at least ${DESCRIPTION_MIN_LENGTH} characters`;

  if (!(product.images || []).some(img => img.image_url?.trim())) {
    errors.images = 'Upload at least one product photo';
  }

  return errors;
}

// Drafts may leave optional numeric inputs empty; the API rejects "" for numbers,
// so send null for packed weight and drop empty box dimensions (server defaults apply).
export function cleanVariantForSubmit(variant) {
  const cleaned = { ...variant, name: variant.name?.trim() || '' };
  if (isBlank(cleaned.packed_weight_grams)) cleaned.packed_weight_grams = null;
  for (const dim of BOX_DIMENSIONS) {
    if (isBlank(cleaned[dim])) delete cleaned[dim];
  }
  return cleaned;
}

const firstMessage = value => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(firstMessage).find(Boolean) || null;
  if (value && typeof value === 'object') return Object.values(value).map(firstMessage).find(Boolean) || null;
  return null;
};

const TOP_LEVEL_FIELDS = new Set(['name', 'tagline', 'description', 'category_ids', 'sub_category_ids', 'images']);

// Map a DRF error response onto form error keys so the right inputs light up.
// `submittedVariantIndexes[i]` is the on-screen index of the i-th variant sent
// (blank draft variants are filtered out before submit).
export function mapProductServerErrors(error, submittedVariantIndexes = []) {
  const data = error?.response?.data;
  const fieldErrors = {};

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const [key, value] of Object.entries(data)) {
      if (key === 'variants' && Array.isArray(value)) {
        value.forEach((variantErrors, sentIndex) => {
          if (!variantErrors || typeof variantErrors !== 'object') return;
          const formIndex = submittedVariantIndexes[sentIndex] ?? sentIndex;
          for (const [field, messages] of Object.entries(variantErrors)) {
            const message = firstMessage(messages);
            if (message) fieldErrors[variantErrorKey(formIndex, field)] = message;
          }
        });
      } else if (TOP_LEVEL_FIELDS.has(key)) {
        const message = firstMessage(value);
        if (message) fieldErrors[key === 'sub_category_ids' ? 'category_ids' : key] = message;
      }
    }
  }

  const fieldCount = Object.keys(fieldErrors).length;
  const message = fieldCount
    ? `Please fix ${fieldCount} highlighted field${fieldCount > 1 ? 's' : ''}.`
    : getApiErrorMessage(error, 'Failed to save specimen. Please try again.');

  return { fieldErrors, message };
}
