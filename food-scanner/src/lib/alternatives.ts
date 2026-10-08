import { analyzeProduct, type Analysis } from './analyze';
import { fetchCategoryProducts } from './openFoodFacts';
import type { Product } from './types';

export interface Alternative {
  product: Product;
  analysis: Analysis;
}

/** Categories are ordered general → specific in Open Food Facts; try the most specific first. */
export function candidateCategories(product: Product): string[] {
  return product.categoriesTags.filter((c) => c.startsWith('en:')).slice(-3).reverse();
}

/**
 * Finds products in the same category that score better and contain no
 * high-risk ingredients.
 */
export async function findAlternatives(product: Product, current: Analysis, signal?: AbortSignal): Promise<Alternative[]> {
  for (const category of candidateCategories(product)) {
    const candidates = await fetchCategoryProducts(category, signal);
    const better = rankAlternatives(product, current, candidates);
    if (better.length > 0) return better.slice(0, 6);
  }
  return [];
}

export function rankAlternatives(product: Product, current: Analysis, candidates: Product[]): Alternative[] {
  return candidates
    .filter((p) => p.code !== product.code && p.name !== 'Unnamed product')
    .map((p) => ({ product: p, analysis: analyzeProduct(p) }))
    .filter(
      ({ analysis }) =>
        analysis.hasNutritionData &&
        analysis.score > current.score &&
        analysis.score >= 50 &&
        !analysis.flags.some((f) => f.additive.risk === 'high'),
    )
    .sort((a, b) => b.analysis.score - a.analysis.score);
}
