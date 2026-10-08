/** Normalised product record used across the app (a subset of Open Food Facts fields). */
export interface Product {
  code: string;
  name: string;
  brands: string;
  imageUrl?: string;
  ingredientsText: string;
  additivesTags: string[];
  categoriesTags: string[];
  labelsTags: string[];
  nutriscoreGrade?: string;
  novaGroup?: number;
  quantity?: string;
  /** Open Food Facts nutriments object (per 100 g / 100 ml keys end in `_100g`). */
  nutriments: Record<string, number | string | undefined>;
  isBeverage: boolean;
}
