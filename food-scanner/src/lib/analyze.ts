import { ADDITIVES, findAdditiveByCode, type AdditiveInfo, type RiskLevel } from '../data/additives';
import type { Product } from './types';

export type Level = 'low' | 'moderate' | 'high';
export type Rating = 'excellent' | 'good' | 'poor' | 'bad';

export interface NutrientRow {
  key: string;
  label: string;
  value: number;
  unit: string;
  level: Level;
  /** true when a high value is good for you (fibre, protein). */
  positive: boolean;
}

export interface Micronutrient {
  key: string;
  label: string;
  value: number;
  unit: string;
  /** % of the EU daily Nutrient Reference Value per 100 g/ml. */
  percentNrv: number;
}

export interface Flag {
  additive: AdditiveInfo;
  /** How it was detected: an Open Food Facts additive code or a match in the ingredient text. */
  matchedBy: string;
}

export interface Analysis {
  score: number;
  rating: Rating;
  flags: Flag[];
  nutrients: NutrientRow[];
  benefits: string[];
  warnings: string[];
  micronutrients: Micronutrient[];
  isOrganic: boolean;
  hasNutritionData: boolean;
}

const RISK_ORDER: Record<RiskLevel, number> = { high: 0, moderate: 1, limited: 2 };

// ---------- Harmful ingredient detection ----------

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ALIAS_PATTERNS = ADDITIVES.flatMap((additive) =>
  additive.aliases.map((alias) => ({
    additive,
    alias,
    re: new RegExp(`(^|[^a-z0-9])${escapeRegExp(alias)}([^a-z0-9]|$)`, 'i'),
  })),
);

export function detectFlags(product: Pick<Product, 'additivesTags' | 'ingredientsText'>): Flag[] {
  const found = new Map<string, Flag>();

  for (const tag of product.additivesTags) {
    const additive = findAdditiveByCode(tag);
    if (additive && !found.has(additive.id)) {
      found.set(additive.id, { additive, matchedBy: tag.replace(/^en:/, '').toUpperCase() });
    }
  }

  const text = product.ingredientsText;
  if (text) {
    for (const { additive, alias, re } of ALIAS_PATTERNS) {
      if (!found.has(additive.id) && re.test(text)) {
        found.set(additive.id, { additive, matchedBy: `"${alias}"` });
      }
    }
  }

  // "Partially hydrogenated" is the stronger finding – don't double-report.
  if (found.has('partially-hydrogenated')) found.delete('hydrogenated');

  return [...found.values()].sort((a, b) => RISK_ORDER[a.additive.risk] - RISK_ORDER[b.additive.risk]);
}

// ---------- Nutrition ----------

/** UK FSA front-of-pack "traffic light" thresholds, per 100 g (food) / 100 ml (drinks). */
const THRESHOLDS = {
  food: { fat: [3, 17.5], 'saturated-fat': [1.5, 5], sugars: [5, 22.5], salt: [0.3, 1.5] },
  drink: { fat: [1.5, 8.75], 'saturated-fat': [0.75, 2.5], sugars: [2.5, 11.25], salt: [0.3, 0.75] },
} as const;

type NegativeKey = keyof typeof THRESHOLDS.food;

const NEGATIVE_LABELS: Record<NegativeKey, string> = {
  fat: 'Fat',
  'saturated-fat': 'Saturated fat',
  sugars: 'Sugars',
  salt: 'Salt',
};

function num(n: Product['nutriments'], key: string): number | undefined {
  const v = n[`${key}_100g`];
  const parsed = typeof v === 'string' ? parseFloat(v) : v;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : undefined;
}

function energyKcal(n: Product['nutriments']): number | undefined {
  const kcal = num(n, 'energy-kcal');
  if (kcal !== undefined) return kcal;
  const kj = num(n, 'energy-kj') ?? num(n, 'energy');
  return kj !== undefined ? kj / 4.184 : undefined;
}

export function analyzeNutrition(product: Product): {
  rows: NutrientRow[];
  benefits: string[];
  warnings: string[];
} {
  const n = product.nutriments;
  const t = product.isBeverage ? THRESHOLDS.drink : THRESHOLDS.food;
  const rows: NutrientRow[] = [];
  const benefits: string[] = [];
  const warnings: string[] = [];
  const per = product.isBeverage ? '100 ml' : '100 g';

  const kcal = energyKcal(n);
  if (kcal !== undefined) {
    const [low, high] = product.isBeverage ? [20, 70] : [40, 400];
    const level: Level = kcal <= low ? 'low' : kcal > high ? 'high' : 'moderate';
    rows.push({ key: 'energy', label: 'Calories', value: Math.round(kcal), unit: 'kcal', level, positive: false });
    if (level === 'low') benefits.push(`Low in calories (${Math.round(kcal)} kcal per ${per})`);
    if (level === 'high') warnings.push(`Very calorie-dense (${Math.round(kcal)} kcal per ${per})`);
  }

  for (const key of Object.keys(t) as NegativeKey[]) {
    const value = num(n, key);
    if (value === undefined) continue;
    const [low, high] = t[key];
    const level: Level = value <= low ? 'low' : value > high ? 'high' : 'moderate';
    rows.push({ key, label: NEGATIVE_LABELS[key], value, unit: 'g', level, positive: false });
    if (level === 'high') warnings.push(`High in ${NEGATIVE_LABELS[key].toLowerCase()}`);
    if (level === 'low' && key !== 'fat') benefits.push(`Low in ${NEGATIVE_LABELS[key].toLowerCase()}`);
  }

  const fiber = num(n, 'fiber');
  if (fiber !== undefined) {
    // EU nutrition claims (Reg. 1924/2006): "source of fibre" ≥3 g, "high fibre" ≥6 g per 100 g.
    const level: Level = fiber >= 6 ? 'high' : fiber >= 3 ? 'moderate' : 'low';
    rows.push({ key: 'fiber', label: 'Fiber', value: fiber, unit: 'g', level, positive: true });
    if (level === 'high') benefits.push('High in fiber – supports digestion and fullness');
    else if (level === 'moderate') benefits.push('Source of fiber');
  }

  const protein = num(n, 'proteins');
  if (protein !== undefined) {
    // EU claims: "source of protein" ≥12 %, "high protein" ≥20 % of energy from protein.
    const share = kcal ? (protein * 4) / kcal : 0;
    const level: Level = share >= 0.2 ? 'high' : share >= 0.12 ? 'moderate' : 'low';
    rows.push({ key: 'proteins', label: 'Protein', value: protein, unit: 'g', level, positive: true });
    if (level === 'high') benefits.push('High in protein – helps maintain muscle');
    else if (level === 'moderate') benefits.push('Source of protein');
  }

  return { rows, benefits, warnings };
}

/** EU Nutrient Reference Values (Reg. 1169/2011, Annex XIII), in grams. */
const NRV: { key: string; label: string; grams: number; unit: 'mg' | 'µg' }[] = [
  { key: 'vitamin-a', label: 'Vitamin A', grams: 800e-6, unit: 'µg' },
  { key: 'vitamin-d', label: 'Vitamin D', grams: 5e-6, unit: 'µg' },
  { key: 'vitamin-e', label: 'Vitamin E', grams: 12e-3, unit: 'mg' },
  { key: 'vitamin-k', label: 'Vitamin K', grams: 75e-6, unit: 'µg' },
  { key: 'vitamin-c', label: 'Vitamin C', grams: 80e-3, unit: 'mg' },
  { key: 'vitamin-b1', label: 'Thiamin (B1)', grams: 1.1e-3, unit: 'mg' },
  { key: 'vitamin-b2', label: 'Riboflavin (B2)', grams: 1.4e-3, unit: 'mg' },
  { key: 'vitamin-pp', label: 'Niacin (B3)', grams: 16e-3, unit: 'mg' },
  { key: 'vitamin-b6', label: 'Vitamin B6', grams: 1.4e-3, unit: 'mg' },
  { key: 'vitamin-b9', label: 'Folate (B9)', grams: 200e-6, unit: 'µg' },
  { key: 'vitamin-b12', label: 'Vitamin B12', grams: 2.5e-6, unit: 'µg' },
  { key: 'biotin', label: 'Biotin', grams: 50e-6, unit: 'µg' },
  { key: 'pantothenic-acid', label: 'Pantothenic acid', grams: 6e-3, unit: 'mg' },
  { key: 'calcium', label: 'Calcium', grams: 800e-3, unit: 'mg' },
  { key: 'iron', label: 'Iron', grams: 14e-3, unit: 'mg' },
  { key: 'magnesium', label: 'Magnesium', grams: 375e-3, unit: 'mg' },
  { key: 'zinc', label: 'Zinc', grams: 10e-3, unit: 'mg' },
  { key: 'potassium', label: 'Potassium', grams: 2000e-3, unit: 'mg' },
  { key: 'phosphorus', label: 'Phosphorus', grams: 700e-3, unit: 'mg' },
  { key: 'iodine', label: 'Iodine', grams: 150e-6, unit: 'µg' },
];

export function analyzeMicronutrients(product: Product): Micronutrient[] {
  const out: Micronutrient[] = [];
  for (const { key, label, grams, unit } of NRV) {
    const value = num(product.nutriments, key);
    if (value === undefined || value <= 0) continue;
    const scale = unit === 'mg' ? 1e3 : 1e6;
    out.push({
      key,
      label,
      value: Math.round(value * scale * 10) / 10,
      unit,
      percentNrv: Math.round((value / grams) * 100),
    });
  }
  return out.sort((a, b) => b.percentNrv - a.percentNrv);
}

// ---------- Overall score (0–100) ----------
// Weighting inspired by popular scanner apps: 60 % nutrition, 30 % additives, 10 % organic.

const NUTRISCORE_POINTS: Record<string, number> = { a: 100, b: 75, c: 50, d: 25, e: 0 };

function nutritionPoints(product: Product, rows: NutrientRow[]): number | undefined {
  if (product.nutriscoreGrade) return NUTRISCORE_POINTS[product.nutriscoreGrade];
  if (rows.length === 0) return undefined;
  let pts = 100;
  for (const r of rows) {
    if (r.positive) pts += r.level === 'high' ? 10 : r.level === 'moderate' ? 5 : 0;
    else pts -= r.level === 'high' ? 25 : r.level === 'moderate' ? 10 : 0;
  }
  return Math.max(0, Math.min(100, pts));
}

export function ratingFor(score: number): Rating {
  if (score >= 75) return 'excellent';
  if (score >= 50) return 'good';
  if (score >= 25) return 'poor';
  return 'bad';
}

export function analyzeProduct(product: Product): Analysis {
  const flags = detectFlags(product);
  const { rows, benefits, warnings } = analyzeNutrition(product);
  const micronutrients = analyzeMicronutrients(product);
  const isOrganic = product.labelsTags.some((l) => l === 'en:organic' || l === 'en:eu-organic' || l === 'en:usda-organic');

  for (const m of micronutrients) {
    if (m.percentNrv >= 15) benefits.push(`Source of ${m.label} (${m.percentNrv}% of daily value per 100 ${product.isBeverage ? 'ml' : 'g'})`);
  }
  if (product.novaGroup === 4) warnings.push('Ultra-processed food (NOVA group 4)');

  const nutrition = nutritionPoints(product, rows);
  const hasHigh = flags.some((f) => f.additive.risk === 'high');
  let additivePts = 30;
  for (const f of flags) additivePts -= f.additive.risk === 'high' ? 30 : f.additive.risk === 'moderate' ? 10 : 3;
  additivePts = Math.max(0, additivePts);

  // Without nutrition data we rescale the additive + organic parts to 0–100.
  let score =
    nutrition === undefined
      ? Math.round(((additivePts + (isOrganic ? 10 : 0)) / 40) * 100)
      : Math.round(nutrition * 0.6 + additivePts + (isOrganic ? 10 : 0));
  // A high-risk ingredient caps the score below "good".
  if (hasHigh) score = Math.min(score, 49);
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    rating: ratingFor(score),
    flags,
    nutrients: rows,
    benefits,
    warnings,
    micronutrients,
    isOrganic,
    hasNutritionData: nutrition !== undefined,
  };
}
