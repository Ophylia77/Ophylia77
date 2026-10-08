import { describe, expect, it } from 'vitest';
import { analyzeProduct, detectFlags } from './analyze';
import { rankAlternatives } from './alternatives';
import { buildCallOutEmail, normalizeBrand } from './email';
import { normalizeProduct } from './openFoodFacts';
import { saveBrandContact, saveProduct, searchKnowledgeBase, getHistory } from './storage';
import { lookupBrandEmail } from './email';

const spread = normalizeProduct({
  code: '111',
  product_name: 'Choco Spread',
  brands: 'Acme Foods Inc., Acme',
  ingredients_text: 'Sugar, palm oil, hazelnuts, partially hydrogenated soybean oil, Red 40, emulsifier: lecithin',
  additives_tags: ['en:e322', 'en:e171'],
  categories_tags: ['en:spreads', 'en:sweet-spreads', 'en:cocoa-and-hazelnuts-spreads'],
  nutriscore_grade: 'e',
  nova_group: 4,
  nutriments: {
    'energy-kcal_100g': 539,
    fat_100g: 30.9,
    'saturated-fat_100g': 10.6,
    sugars_100g: 56.3,
    salt_100g: 0.107,
    fiber_100g: 0,
    proteins_100g: 6.3,
  },
});

const oats = normalizeProduct({
  code: '222',
  product_name: 'Rolled Oats',
  brands: 'Good Grain',
  ingredients_text: 'Whole grain oats',
  categories_tags: ['en:cereals'],
  labels_tags: ['en:organic'],
  nutriscore_grade: 'a',
  nutriments: {
    'energy-kcal_100g': 375,
    fat_100g: 7,
    'saturated-fat_100g': 1.2,
    sugars_100g: 1,
    salt_100g: 0.01,
    fiber_100g: 10,
    proteins_100g: 13,
    'iron_100g': 0.0042,
    'magnesium_100g': 0.13,
  },
});

describe('detectFlags', () => {
  it('detects additives by code and by ingredient text, highest risk first', () => {
    const ids = detectFlags(spread).map((f) => f.additive.id);
    expect(ids).toContain('titanium-dioxide');
    expect(ids).toContain('partially-hydrogenated');
    expect(ids).toContain('allura-red');
    expect(ids).not.toContain('hydrogenated');
    expect(detectFlags(spread)[0].additive.risk).toBe('high');
  });

  it('uses word boundaries so short aliases do not match inside words', () => {
    expect(detectFlags({ additivesTags: [], ingredientsText: 'subhash spice, abhay salt' })).toEqual([]);
    expect(detectFlags({ additivesTags: [], ingredientsText: 'oil, BHT (antioxidant)' })[0].additive.id).toBe('bht');
  });
});

describe('analyzeProduct', () => {
  it('scores a product with a high-risk ingredient as poor or worse and lists warnings', () => {
    const a = analyzeProduct(spread);
    expect(a.score).toBeLessThan(50);
    expect(a.warnings).toEqual(expect.arrayContaining(['High in sugars', 'High in saturated fat', 'Ultra-processed food (NOVA group 4)']));
  });

  it('rewards good nutrition, organic label and micronutrients', () => {
    const a = analyzeProduct(oats);
    expect(a.rating).toBe('excellent');
    expect(a.score).toBe(100);
    expect(a.benefits).toEqual(expect.arrayContaining(['High in fiber – supports digestion and fullness', 'Source of protein']));
    expect(a.micronutrients.map((m) => m.key)).toEqual(['magnesium', 'iron']);
    expect(a.micronutrients[1]).toMatchObject({ value: 4.2, unit: 'mg', percentNrv: 30 });
  });
});

describe('alternatives', () => {
  it('only suggests better-scoring products without high-risk ingredients', () => {
    const result = rankAlternatives(spread, analyzeProduct(spread), [spread, oats, { ...spread, code: '333' }]);
    expect(result.map((r) => r.product.code)).toEqual(['222']);
  });
});

describe('call-out email', () => {
  it('normalises brand names', () => {
    expect(normalizeBrand('Nestlé S.A.')).toBe('nestle');
    expect(normalizeBrand('Acme Foods Inc., Acme')).toBe('acme');
  });

  it('builds a mailto link with the brand address and the flagged ingredients', () => {
    const href = buildCallOutEmail(spread, detectFlags(spread), 'care@acme.example');
    expect(href.startsWith('mailto:care@acme.example?')).toBe(true);
    const params = new URLSearchParams(href.split('?')[1]);
    expect(params.get('subject')).toBe('Concern about ingredients in Choco Spread');
    expect(params.get('body')).toContain('Titanium dioxide');
    expect(params.get('body')).toContain('barcode 111');
    expect(href).not.toContain('+');
  });

  it('remembers emails entered by the user per brand', () => {
    expect(lookupBrandEmail('Acme Foods Inc.')).toBeUndefined();
    saveBrandContact(normalizeBrand('Acme'), 'care@acme.example');
    expect(lookupBrandEmail('ACME Foods Inc.')).toBe('care@acme.example');
  });
});

describe('knowledge base', () => {
  it('saves scanned products and finds them by name, brand or barcode', () => {
    saveProduct(spread);
    saveProduct(oats);
    expect(getHistory()).toEqual(['222', '111']);
    expect(searchKnowledgeBase('choco').map((p) => p.code)).toEqual(['111']);
    expect(searchKnowledgeBase('good grain oats').map((p) => p.code)).toEqual(['222']);
    expect(searchKnowledgeBase('222').map((p) => p.code)).toEqual(['222']);
  });
});
