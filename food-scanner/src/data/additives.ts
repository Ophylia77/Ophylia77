/**
 * Curated knowledge base of food additives and ingredients of concern.
 *
 * Each entry summarises the position of public research / regulatory bodies:
 *   IARC  – International Agency for Research on Cancer (WHO)
 *   EFSA  – European Food Safety Authority
 *   FDA   – U.S. Food and Drug Administration
 *   JECFA – Joint FAO/WHO Expert Committee on Food Additives
 *   CA    – California Food Safety Act (AB 418, 2023) / Proposition 65
 *
 * Risk levels:
 *   high     – banned in at least one major jurisdiction, or classified as a
 *              probable/possible carcinogen with a plausible dietary route.
 *   moderate – credible evidence of harm in some studies, mandatory warnings,
 *              or under active regulatory re-evaluation.
 *   limited  – mostly safe, but relevant for sensitive groups (allergies,
 *              asthma, children) or at high intake.
 *
 * `codes` match Open Food Facts additive tags (e.g. "en:e102").
 * `aliases` are matched against free-text ingredient lists (lowercased), which
 * matters for U.S. labels that rarely print E-numbers.
 *
 * This is informational, not medical advice. Keep entries sourced and dated.
 */

export type RiskLevel = 'high' | 'moderate' | 'limited';

export interface Source {
  org: string;
  note: string;
  url?: string;
}

export interface AdditiveInfo {
  id: string;
  name: string;
  codes: string[];
  aliases: string[];
  risk: RiskLevel;
  concern: string;
  sources: Source[];
}

const SOUTHAMPTON: Source = {
  org: 'EU Regulation 1333/2008',
  note: 'Requires the warning "may have an adverse effect on activity and attention in children" (after the 2007 Southampton study).',
  url: 'https://eur-lex.europa.eu/eli/reg/2008/1333/oj',
};

export const ADDITIVES: AdditiveInfo[] = [
  // ---------- Colours ----------
  {
    id: 'titanium-dioxide',
    name: 'Titanium dioxide',
    codes: ['en:e171'],
    aliases: ['titanium dioxide', 'color (titanium dioxide)'],
    risk: 'high',
    concern: 'Genotoxicity (DNA damage) could not be ruled out; nanoparticles may accumulate in the body.',
    sources: [
      { org: 'EFSA (2021)', note: 'Concluded E171 can no longer be considered safe as a food additive.', url: 'https://www.efsa.europa.eu/en/news/titanium-dioxide-e171-no-longer-considered-safe-when-used-food-additive' },
      { org: 'European Commission (2022)', note: 'Banned as a food additive in the EU from August 2022.' },
      { org: 'IARC', note: 'Group 2B – possibly carcinogenic to humans (inhaled form).' },
    ],
  },
  {
    id: 'erythrosine',
    name: 'Erythrosine (Red 3)',
    codes: ['en:e127'],
    aliases: ['erythrosine', 'red 3', 'red no. 3', 'red #3', 'fd&c red no. 3'],
    risk: 'high',
    concern: 'Caused thyroid tumours in male rats; interferes with thyroid hormones.',
    sources: [
      { org: 'FDA (2025)', note: 'Revoked authorisation of Red No. 3 in food (manufacturers must reformulate by January 2027).', url: 'https://www.fda.gov/food/food-additives-petitions/fdc-red-no-3' },
      { org: 'California AB 418', note: 'Banned in foods sold in California from 2027.' },
    ],
  },
  {
    id: 'tartrazine',
    name: 'Tartrazine (Yellow 5)',
    codes: ['en:e102'],
    aliases: ['tartrazine', 'yellow 5', 'yellow no. 5', 'yellow #5', 'fd&c yellow no. 5'],
    risk: 'moderate',
    concern: 'Linked to hyperactivity in children; can trigger allergic-type reactions, especially in aspirin-sensitive people.',
    sources: [SOUTHAMPTON, { org: 'FDA', note: 'Must be declared by name on labels because of hypersensitivity reactions.' }],
  },
  {
    id: 'quinoline-yellow',
    name: 'Quinoline yellow',
    codes: ['en:e104'],
    aliases: ['quinoline yellow'],
    risk: 'moderate',
    concern: 'Linked to hyperactivity in children. Not permitted in food in the U.S.',
    sources: [SOUTHAMPTON],
  },
  {
    id: 'sunset-yellow',
    name: 'Sunset yellow (Yellow 6)',
    codes: ['en:e110'],
    aliases: ['sunset yellow', 'yellow 6', 'yellow no. 6', 'yellow #6', 'fd&c yellow no. 6'],
    risk: 'moderate',
    concern: 'Linked to hyperactivity in children; EFSA lowered its acceptable daily intake in 2014.',
    sources: [SOUTHAMPTON],
  },
  {
    id: 'azorubine',
    name: 'Azorubine / Carmoisine',
    codes: ['en:e122'],
    aliases: ['azorubine', 'carmoisine'],
    risk: 'moderate',
    concern: 'Linked to hyperactivity in children. Not permitted in food in the U.S.',
    sources: [SOUTHAMPTON],
  },
  {
    id: 'ponceau-4r',
    name: 'Ponceau 4R',
    codes: ['en:e124'],
    aliases: ['ponceau 4r', 'cochineal red a'],
    risk: 'moderate',
    concern: 'Linked to hyperactivity in children. Not permitted in food in the U.S.',
    sources: [SOUTHAMPTON],
  },
  {
    id: 'allura-red',
    name: 'Allura red (Red 40)',
    codes: ['en:e129'],
    aliases: ['allura red', 'red 40', 'red no. 40', 'red #40', 'fd&c red no. 40'],
    risk: 'moderate',
    concern: 'Linked to hyperactivity in children; mouse studies (2022) suggest gut inflammation.',
    sources: [SOUTHAMPTON, { org: 'Nature Communications (2022)', note: 'Chronic exposure promoted colitis in mice.', url: 'https://www.nature.com/articles/s41467-022-35309-y' }],
  },
  {
    id: 'caramel-iii-iv',
    name: 'Ammonia caramel colours',
    codes: ['en:e150c', 'en:e150d'],
    aliases: ['caramel color iii', 'caramel color iv', 'ammonia caramel', 'sulphite ammonia caramel', 'sulfite ammonia caramel'],
    risk: 'moderate',
    concern: 'May contain 4-methylimidazole (4-MEI), a by-product classified as possibly carcinogenic.',
    sources: [
      { org: 'IARC', note: '4-MEI classified Group 2B – possibly carcinogenic to humans.' },
      { org: 'California Prop 65', note: '4-MEI is listed as a chemical known to cause cancer.' },
    ],
  },
  {
    id: 'aluminium-colours',
    name: 'Aluminium-based additives',
    codes: ['en:e173', 'en:e520', 'en:e521', 'en:e522', 'en:e523', 'en:e541', 'en:e554', 'en:e555', 'en:e556', 'en:e559'],
    aliases: ['sodium aluminum phosphate', 'sodium aluminium phosphate', 'sodium aluminosilicate', 'aluminum lake', 'aluminium lake'],
    risk: 'moderate',
    concern: 'Aluminium can accumulate in the body; potential neurotoxicity and effects on reproduction at high intake.',
    sources: [{ org: 'EFSA (2008)', note: 'Tolerable weekly intake likely exceeded by part of the European population.' }],
  },

  // ---------- Preservatives ----------
  {
    id: 'nitrites',
    name: 'Nitrites',
    codes: ['en:e249', 'en:e250'],
    aliases: ['sodium nitrite', 'potassium nitrite'],
    risk: 'high',
    concern: 'Form carcinogenic nitrosamines in processed meat and in the stomach.',
    sources: [
      { org: 'IARC (2015)', note: 'Processed meat classified Group 1 (carcinogenic); ingested nitrite under nitrosating conditions Group 2A.' },
      { org: 'EFSA (2023)', note: 'Nitrosamine exposure from food is a health concern for all age groups.' },
    ],
  },
  {
    id: 'nitrates',
    name: 'Nitrates',
    codes: ['en:e251', 'en:e252'],
    aliases: ['sodium nitrate', 'potassium nitrate'],
    risk: 'high',
    concern: 'Converted to nitrites, which can form carcinogenic nitrosamines.',
    sources: [{ org: 'IARC', note: 'Ingested nitrate under nitrosating conditions classified Group 2A.' }],
  },
  {
    id: 'sodium-benzoate',
    name: 'Benzoates',
    codes: ['en:e210', 'en:e211', 'en:e212', 'en:e213'],
    aliases: ['sodium benzoate', 'potassium benzoate', 'benzoic acid'],
    risk: 'moderate',
    concern: 'Can form benzene (a carcinogen) together with vitamin C; linked to hyperactivity in the Southampton study.',
    sources: [{ org: 'FDA', note: 'Benzene formation in beverages containing benzoate and ascorbic acid documented.', url: 'https://www.fda.gov/food/environmental-contaminants-food/data-benzene-soft-drinks-and-other-beverages' }],
  },
  {
    id: 'sulfites',
    name: 'Sulphites',
    codes: ['en:e220', 'en:e221', 'en:e222', 'en:e223', 'en:e224', 'en:e225', 'en:e226', 'en:e227', 'en:e228'],
    aliases: ['sulfur dioxide', 'sulphur dioxide', 'sodium metabisulfite', 'sodium metabisulphite', 'potassium metabisulfite', 'sodium bisulfite', 'sodium sulfite'],
    risk: 'limited',
    concern: 'Can trigger asthma attacks and intolerance reactions; a regulated allergen.',
    sources: [{ org: 'EFSA (2022)', note: 'Safety concern at high consumption levels; mandatory allergen labelling in the EU and U.S.' }],
  },
  {
    id: 'propylparaben',
    name: 'Propylparaben',
    codes: ['en:e216', 'en:e217'],
    aliases: ['propylparaben', 'propyl paraben'],
    risk: 'high',
    concern: 'Endocrine disruptor affecting reproductive hormones.',
    sources: [
      { org: 'European Commission (2006)', note: 'Removed from the list of authorised food additives.' },
      { org: 'California AB 418', note: 'Banned in foods sold in California from 2027.' },
    ],
  },

  // ---------- Antioxidants ----------
  {
    id: 'bha',
    name: 'BHA (Butylated hydroxyanisole)',
    codes: ['en:e320'],
    aliases: ['bha', 'butylated hydroxyanisole'],
    risk: 'high',
    concern: 'Possible carcinogen and suspected endocrine disruptor.',
    sources: [
      { org: 'IARC', note: 'Group 2B – possibly carcinogenic to humans.' },
      { org: 'California Prop 65', note: 'Listed as a chemical known to cause cancer.' },
    ],
  },
  {
    id: 'bht',
    name: 'BHT (Butylated hydroxytoluene)',
    codes: ['en:e321'],
    aliases: ['bht', 'butylated hydroxytoluene'],
    risk: 'moderate',
    concern: 'Suspected endocrine disruptor; mixed evidence on tumour promotion in animals.',
    sources: [{ org: 'EFSA (2012)', note: 'Re-evaluated with a lowered acceptable daily intake.' }],
  },
  {
    id: 'tbhq',
    name: 'TBHQ (tert-Butylhydroquinone)',
    codes: ['en:e319'],
    aliases: ['tbhq', 'tert-butylhydroquinone', 'tertiary butylhydroquinone'],
    risk: 'moderate',
    concern: 'Animal studies suggest effects on the immune system.',
    sources: [{ org: 'EWG (2021)', note: 'Analysis of ToxCast data suggests immune toxicity.' }],
  },
  {
    id: 'propyl-gallate',
    name: 'Gallates',
    codes: ['en:e310', 'en:e311', 'en:e312'],
    aliases: ['propyl gallate'],
    risk: 'moderate',
    concern: 'Suspected endocrine disruptor; may cause allergic reactions.',
    sources: [{ org: 'EFSA (2014)', note: 'Re-evaluation noted data gaps on reproductive toxicity.' }],
  },

  // ---------- Flour treatment ----------
  {
    id: 'potassium-bromate',
    name: 'Potassium bromate',
    codes: ['en:e924'],
    aliases: ['potassium bromate', 'bromated flour'],
    risk: 'high',
    concern: 'Possible carcinogen; banned in the EU, UK, Canada, China and others.',
    sources: [
      { org: 'IARC', note: 'Group 2B – possibly carcinogenic to humans.' },
      { org: 'California AB 418', note: 'Banned in foods sold in California from 2027.' },
    ],
  },
  {
    id: 'azodicarbonamide',
    name: 'Azodicarbonamide',
    codes: ['en:e927a'],
    aliases: ['azodicarbonamide'],
    risk: 'high',
    concern: 'Breaks down into semicarbazide and urethane during baking; respiratory sensitiser. Banned in the EU.',
    sources: [{ org: 'EU', note: 'Not authorised as a food additive.' }],
  },
  {
    id: 'bvo',
    name: 'Brominated vegetable oil',
    codes: ['en:e443'],
    aliases: ['brominated vegetable oil', 'bvo'],
    risk: 'high',
    concern: 'Bromine accumulates in body fat; thyroid effects in animals.',
    sources: [{ org: 'FDA (2024)', note: 'Authorisation revoked – no longer allowed in food.', url: 'https://www.fda.gov/food/food-additives-petitions/brominated-vegetable-oil-bvo' }],
  },

  // ---------- Sweeteners ----------
  {
    id: 'aspartame',
    name: 'Aspartame',
    codes: ['en:e951'],
    aliases: ['aspartame'],
    risk: 'moderate',
    concern: 'Classified as a possible carcinogen in 2023; dangerous for people with phenylketonuria.',
    sources: [
      { org: 'IARC (2023)', note: 'Group 2B – possibly carcinogenic to humans.', url: 'https://www.who.int/news/item/14-07-2023-aspartame-hazard-and-risk-assessment-results-released' },
      { org: 'JECFA (2023)', note: 'Kept the acceptable daily intake of 40 mg/kg body weight.' },
    ],
  },
  {
    id: 'acesulfame-k',
    name: 'Acesulfame K',
    codes: ['en:e950'],
    aliases: ['acesulfame potassium', 'acesulfame k', 'acesulfame-k'],
    risk: 'moderate',
    concern: 'Associated with higher cardiovascular risk in a large cohort study; may affect gut microbiota.',
    sources: [{ org: 'BMJ – NutriNet-Santé (2022)', note: 'Artificial sweetener intake associated with cardiovascular disease.', url: 'https://www.bmj.com/content/378/bmj-2022-071204' }],
  },
  {
    id: 'sucralose',
    name: 'Sucralose',
    codes: ['en:e955'],
    aliases: ['sucralose'],
    risk: 'moderate',
    concern: 'A metabolite (sucralose-6-acetate) showed genotoxicity in lab studies; may alter gut microbiota.',
    sources: [{ org: 'J. Toxicol. Environ. Health B (2023)', note: 'Sucralose-6-acetate found genotoxic in vitro.' }],
  },
  {
    id: 'saccharin',
    name: 'Saccharin',
    codes: ['en:e954'],
    aliases: ['saccharin'],
    risk: 'limited',
    concern: 'May alter gut microbiota and glucose tolerance.',
    sources: [{ org: 'Nature (2014)', note: 'Artificial sweeteners induced glucose intolerance via gut microbiota.' }],
  },
  {
    id: 'cyclamate',
    name: 'Cyclamates',
    codes: ['en:e952'],
    aliases: ['cyclamate', 'sodium cyclamate'],
    risk: 'moderate',
    concern: 'Banned in the U.S. since 1969 after animal bladder-cancer studies; EFSA lowered its intake limit.',
    sources: [{ org: 'FDA', note: 'Not approved for use in food in the U.S.' }],
  },
  {
    id: 'erythritol',
    name: 'Erythritol',
    codes: ['en:e968'],
    aliases: ['erythritol'],
    risk: 'limited',
    concern: 'Higher blood levels associated with heart attack and stroke risk (enhanced clotting).',
    sources: [{ org: 'Nature Medicine (2023)', note: 'Erythritol associated with major adverse cardiovascular events.', url: 'https://www.nature.com/articles/s41591-023-02223-9' }],
  },

  // ---------- Emulsifiers / thickeners ----------
  {
    id: 'carrageenan',
    name: 'Carrageenan',
    codes: ['en:e407', 'en:e407a'],
    aliases: ['carrageenan'],
    risk: 'moderate',
    concern: 'May promote intestinal inflammation; degraded carrageenan is a possible carcinogen.',
    sources: [
      { org: 'EFSA (2018)', note: 'Temporary ADI maintained; requested more data, especially for infants.' },
      { org: 'IARC', note: 'Degraded carrageenan (poligeenan) Group 2B.' },
    ],
  },
  {
    id: 'polysorbates',
    name: 'Polysorbates',
    codes: ['en:e432', 'en:e433', 'en:e434', 'en:e435', 'en:e436'],
    aliases: ['polysorbate 80', 'polysorbate 60', 'polysorbate 20'],
    risk: 'moderate',
    concern: 'Emulsifiers that disrupted gut microbiota and promoted inflammation in animal studies.',
    sources: [{ org: 'Nature (2015)', note: 'Dietary emulsifiers impacted mouse gut microbiota, promoting colitis and metabolic syndrome.', url: 'https://www.nature.com/articles/nature14232' }],
  },
  {
    id: 'cmc',
    name: 'Carboxymethylcellulose',
    codes: ['en:e466'],
    aliases: ['carboxymethylcellulose', 'cellulose gum', 'sodium carboxymethyl cellulose'],
    risk: 'moderate',
    concern: 'Altered gut bacteria and nutrient levels in a controlled human feeding trial.',
    sources: [{ org: 'Gastroenterology (2022)', note: 'Randomised controlled-feeding study in healthy adults.' }],
  },
  {
    id: 'phosphates',
    name: 'Phosphates',
    codes: ['en:e338', 'en:e339', 'en:e340', 'en:e341', 'en:e343', 'en:e450', 'en:e451', 'en:e452'],
    aliases: ['phosphoric acid', 'sodium phosphate', 'trisodium phosphate', 'sodium tripolyphosphate', 'sodium hexametaphosphate', 'disodium phosphate'],
    risk: 'moderate',
    concern: 'Excess phosphate intake is linked to cardiovascular and kidney problems.',
    sources: [{ org: 'EFSA (2019)', note: 'Set a group ADI; intake may exceed it for high consumers and children.' }],
  },

  // ---------- Flavour enhancers ----------
  {
    id: 'msg',
    name: 'Glutamates (MSG)',
    codes: ['en:e620', 'en:e621', 'en:e622', 'en:e623', 'en:e624', 'en:e625'],
    aliases: ['monosodium glutamate', 'msg'],
    risk: 'limited',
    concern: 'EFSA found typical intake can exceed the safe level; some people report sensitivity.',
    sources: [{ org: 'EFSA (2017)', note: 'Set a group ADI of 30 mg/kg body weight per day.' }],
  },

  // ---------- Ingredients (not additives) ----------
  {
    id: 'partially-hydrogenated',
    name: 'Partially hydrogenated oils (trans fats)',
    codes: [],
    aliases: ['partially hydrogenated', 'partially-hydrogenated'],
    risk: 'high',
    concern: 'Industrial trans fats raise LDL cholesterol and the risk of heart disease.',
    sources: [
      { org: 'FDA (2018)', note: 'No longer Generally Recognised as Safe (GRAS); removed from the U.S. food supply.' },
      { org: 'WHO', note: 'Calls for global elimination of industrially produced trans fats.' },
    ],
  },
  {
    id: 'hydrogenated',
    name: 'Hydrogenated fats',
    codes: [],
    aliases: ['hydrogenated vegetable oil', 'hydrogenated palm', 'hydrogenated soybean', 'hydrogenated coconut', 'hydrogenated fat', 'graisse hydrogénée', 'huile hydrogénée'],
    risk: 'moderate',
    concern: 'Highly processed fats, high in saturated fat and may contain trans fats.',
    sources: [{ org: 'WHO', note: 'Recommends limiting saturated fat to under 10% of energy intake.' }],
  },
  {
    id: 'hfcs',
    name: 'High-fructose corn syrup',
    codes: [],
    aliases: ['high fructose corn syrup', 'high-fructose corn syrup', 'glucose-fructose syrup', 'fructose-glucose syrup', 'isoglucose'],
    risk: 'moderate',
    concern: 'Added free sugar strongly associated with obesity, type 2 diabetes and fatty liver disease.',
    sources: [{ org: 'WHO (2015)', note: 'Recommends free sugars below 10% (ideally 5%) of daily energy.' }],
  },
];

const BY_CODE = new Map<string, AdditiveInfo>();
for (const a of ADDITIVES) for (const c of a.codes) BY_CODE.set(c, a);

export function findAdditiveByCode(tag: string): AdditiveInfo | undefined {
  return BY_CODE.get(tag.toLowerCase());
}

export function allAdditives(): AdditiveInfo[] {
  return ADDITIVES;
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  high: 'High risk',
  moderate: 'Moderate risk',
  limited: 'Limited risk',
};
