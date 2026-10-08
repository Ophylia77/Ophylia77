import type { Product } from './types';

/**
 * Open Food Facts – a free, open, crowd-sourced database of 3M+ food products
 * from 150+ countries. https://world.openfoodfacts.org/data
 */
const OFF = 'https://world.openfoodfacts.org';
const APP = 'app_name=SafeBite&app_version=0.1';

const FIELDS = [
  'code',
  'product_name',
  'generic_name',
  'brands',
  'image_front_url',
  'image_url',
  'ingredients_text',
  'ingredients_text_en',
  'additives_tags',
  'categories_tags',
  'labels_tags',
  'nutriscore_grade',
  'nova_group',
  'quantity',
  'nutriments',
].join(',');

// Raw OFF payloads are loosely typed; we normalise them into `Product`.
type Raw = Record<string, any>;

export function normalizeProduct(raw: Raw): Product {
  const categories: string[] = raw.categories_tags ?? [];
  return {
    code: String(raw.code ?? ''),
    name: raw.product_name || raw.generic_name || 'Unnamed product',
    brands: raw.brands ?? '',
    imageUrl: raw.image_front_url || raw.image_url || undefined,
    ingredientsText: raw.ingredients_text_en || raw.ingredients_text || '',
    additivesTags: raw.additives_tags ?? [],
    categoriesTags: categories,
    labelsTags: raw.labels_tags ?? [],
    nutriscoreGrade: raw.nutriscore_grade && /^[a-e]$/.test(raw.nutriscore_grade) ? raw.nutriscore_grade : undefined,
    novaGroup: typeof raw.nova_group === 'number' ? raw.nova_group : undefined,
    quantity: raw.quantity || undefined,
    nutriments: raw.nutriments ?? {},
    isBeverage: categories.includes('en:beverages') && !categories.includes('en:plant-based-milk-alternatives'),
  };
}

export async function fetchProduct(barcode: string, signal?: AbortSignal): Promise<Product | null> {
  const res = await fetch(`${OFF}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}&${APP}`, { signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Food Facts returned ${res.status}`);
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  return normalizeProduct({ code: barcode, ...data.product });
}

export async function searchProducts(query: string, signal?: AbortSignal): Promise<Product[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '24',
    fields: FIELDS,
  });
  const res = await fetch(`${OFF}/cgi/search.pl?${params}&${APP}`, { signal });
  if (!res.ok) throw new Error(`Open Food Facts search returned ${res.status}`);
  const data = await res.json();
  return (data.products ?? []).map(normalizeProduct).filter((p: Product) => p.code);
}

/** Popular products in the same (most specific) category – candidates for "safer alternatives". */
export async function fetchCategoryProducts(categoryTag: string, signal?: AbortSignal): Promise<Product[]> {
  const params = new URLSearchParams({
    categories_tags: categoryTag,
    fields: FIELDS,
    page_size: '40',
    sort_by: 'popularity_key',
  });
  const res = await fetch(`${OFF}/api/v2/search?${params}&${APP}`, { signal });
  if (!res.ok) throw new Error(`Open Food Facts returned ${res.status}`);
  const data = await res.json();
  return (data.products ?? []).map(normalizeProduct).filter((p: Product) => p.code);
}
