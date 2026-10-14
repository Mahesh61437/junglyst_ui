import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateProductForm, cleanVariantForSubmit, mapProductServerErrors, TAGLINE_MAX_LENGTH,
} from './productForm.js';

const validVariant = () => ({
  name: '', variant_type: 'Plant', base_price: '450', stock: '5',
  item_category: 'light', packed_weight_grams: '300', length: '10', width: '10', height: '10',
});

const validProduct = () => ({
  name: 'Alocasia Azlanii',
  tagline: '',
  category_ids: ['1'],
  description: 'Healthy, fully acclimated specimen with deep purple leaves.',
  variants: [validVariant()],
  images: [{ image_url: 'https://cdn.example.com/a.jpg', is_primary: true }],
});

describe('validateProductForm', () => {
  test('a complete listing has no errors', () => {
    assert.deepEqual(validateProductForm(validProduct()), {});
  });

  test('variant label is optional', () => {
    const product = validProduct();
    product.variants[0].name = '';
    assert.equal(validateProductForm(product).variant_0_name, undefined);
  });

  test('flags every missing required field with a message', () => {
    const errors = validateProductForm({
      name: '', category_ids: [], description: '', images: [{ image_url: '' }],
      variants: [{ base_price: '', stock: '', packed_weight_grams: '', length: '', width: '', height: '' }],
    });
    assert.deepEqual(Object.keys(errors), [
      'name', 'category_ids',
      'variant_0_stock', 'variant_0_base_price', 'variant_0_packed_weight_grams',
      'variant_0_length', 'variant_0_width', 'variant_0_height',
      'description', 'images',
    ]);
    for (const message of Object.values(errors)) assert.ok(message.length > 0);
  });

  test('stock of 0 is allowed, negatives and decimals are not', () => {
    const product = validProduct();
    product.variants[0].stock = 0;
    assert.equal(validateProductForm(product).variant_0_stock, undefined);
    product.variants[0].stock = '-1';
    assert.equal(validateProductForm(product).variant_0_stock, 'Must be 0 or more');
    product.variants[0].stock = '1.5';
    assert.equal(validateProductForm(product).variant_0_stock, 'Must be a whole number');
  });

  test('price must be positive and sane', () => {
    const product = validProduct();
    product.variants[0].base_price = '0';
    assert.equal(validateProductForm(product).variant_0_base_price, 'Must be greater than 0');
    product.variants[0].base_price = '2000000';
    assert.equal(validateProductForm(product).variant_0_base_price, 'Price seems too high');
  });

  test('packed weight bounds match the backend (1–30,000 g, whole grams)', () => {
    const product = validProduct();
    for (const bad of ['0', '30001', '12.5']) {
      product.variants[0].packed_weight_grams = bad;
      assert.ok(validateProductForm(product).variant_0_packed_weight_grams, bad);
    }
    product.variants[0].packed_weight_grams = '30000';
    assert.equal(validateProductForm(product).variant_0_packed_weight_grams, undefined);
  });

  test('description shorter than 20 characters is rejected', () => {
    const product = validProduct();
    product.description = 'Too short';
    assert.equal(validateProductForm(product).description, 'Must be at least 20 characters');
  });

  test('tagline limit matches the backend', () => {
    const product = validProduct();
    product.tagline = 'x'.repeat(TAGLINE_MAX_LENGTH);
    assert.equal(validateProductForm(product).tagline, undefined);
    product.tagline = 'x'.repeat(TAGLINE_MAX_LENGTH + 1);
    assert.ok(validateProductForm(product).tagline);
  });

  test('drafts only require a name', () => {
    const draft = { name: 'Bucephalandra', category_ids: [], description: '', images: [], variants: [{ base_price: '' }] };
    assert.deepEqual(validateProductForm(draft, { isDraft: true }), {});
    assert.ok(validateProductForm({ ...draft, name: ' ' }, { isDraft: true }).name);
  });
});

describe('cleanVariantForSubmit', () => {
  test('nulls empty packed weight and drops empty box dimensions', () => {
    const cleaned = cleanVariantForSubmit({ ...validVariant(), name: '  Large ', packed_weight_grams: '', length: '', width: '12' });
    assert.equal(cleaned.name, 'Large');
    assert.equal(cleaned.packed_weight_grams, null);
    assert.equal('length' in cleaned, false);
    assert.equal(cleaned.width, '12');
  });

  test('does not mutate the form state', () => {
    const variant = { ...validVariant(), length: '' };
    cleanVariantForSubmit(variant);
    assert.equal(variant.length, '');
  });
});

describe('mapProductServerErrors', () => {
  const drfError = data => ({ response: { status: 400, data } });

  test('maps top-level and nested variant errors onto form keys', () => {
    const { fieldErrors, message } = mapProductServerErrors(drfError({
      description: ['This field may not be blank.'],
      variants: [{}, { packed_weight_grams: ['Packed weight must be between 1g and 30,000g.'] }],
      images: [{ image_url: ['Enter a valid URL.'] }],
    }), [0, 1]);
    assert.deepEqual(fieldErrors, {
      description: 'This field may not be blank.',
      variant_1_packed_weight_grams: 'Packed weight must be between 1g and 30,000g.',
      images: 'Enter a valid URL.',
    });
    assert.equal(message, 'Please fix 3 highlighted fields.');
  });

  test('uses on-screen indexes when blank variants were filtered out', () => {
    const { fieldErrors } = mapProductServerErrors(drfError({ variants: [{ stock: ['A valid integer is required.'] }] }), [2]);
    assert.deepEqual(fieldErrors, { variant_2_stock: 'A valid integer is required.' });
  });

  test('falls back to a readable banner message for non-field errors', () => {
    const { fieldErrors, message } = mapProductServerErrors(drfError({ detail: 'Only growers can list products' }));
    assert.deepEqual(fieldErrors, {});
    assert.equal(message, 'Only growers can list products');
  });

  test('handles network failures', () => {
    const { message } = mapProductServerErrors({ code: 'ERR_NETWORK', message: 'Network Error' });
    assert.match(message, /Network error/);
  });
});
