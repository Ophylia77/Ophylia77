import { BRAND_CONTACTS } from '../data/brandContacts';
import type { Flag } from './analyze';
import { getSavedBrandContacts } from './storage';
import type { Product } from './types';

/** Lower-cases, strips accents/punctuation and legal suffixes so "Nestlé S.A." → "nestle". */
export function normalizeBrand(brand: string): string {
  return brand
    .split(',')[0]
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 &]/g, ' ')
    .replace(/\b(inc|llc|ltd|plc|sa|s a|gmbh|co|corp|corporation|company|foods?)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function primaryBrand(product: Product): string {
  return product.brands.split(',')[0].trim();
}

export function lookupBrandEmail(brand: string): string | undefined {
  const key = normalizeBrand(brand);
  if (!key) return undefined;
  return getSavedBrandContacts()[key] ?? BRAND_CONTACTS[key];
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function buildCallOutEmail(product: Product, flags: Flag[], to: string): string {
  const brand = primaryBrand(product) || 'your company';
  const listed = flags
    .filter((f) => f.additive.risk !== 'limited')
    .map((f) => `• ${f.additive.name} – ${f.additive.concern} (${f.additive.sources.map((s) => s.org).join('; ')})`);

  const subject = `Concern about ingredients in ${product.name}`;
  const body = [
    `Dear ${brand} team,`,
    '',
    `I recently scanned your product "${product.name}" (barcode ${product.code}) and was concerned to find the following ingredient(s):`,
    '',
    ...listed,
    '',
    'Several of these have been restricted, banned or flagged by food-safety authorities in other markets. Safer formulations are clearly possible, and many of your competitors already offer them.',
    '',
    'I would like to ask you to:',
    '1. Remove these ingredients or replace them with safer alternatives.',
    '2. Let me know whether a reformulation is planned and when.',
    '',
    'As a customer, I would gladly keep buying your products if they were made without these ingredients.',
    '',
    'Kind regards,',
    '',
  ].join('\n');

  const params = new URLSearchParams({ subject, body }).toString().replace(/\+/g, '%20');
  return `mailto:${encodeURIComponent(to).replace(/%40/g, '@')}?${params}`;
}
