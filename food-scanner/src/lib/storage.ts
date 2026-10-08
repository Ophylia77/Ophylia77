import type { Product } from './types';

/**
 * Local knowledge base: every product the user scans or opens is saved on the
 * device, so it can be searched later – even offline and without the product
 * in hand. Storage access is wrapped because it can throw (private mode, quota).
 */
const KB_KEY = 'safebite.kb.v1';
const HISTORY_KEY = 'safebite.history.v1';
const CONTACTS_KEY = 'safebite.brandContacts.v1';
const MAX_KB = 500;
const MAX_HISTORY = 50;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable – the app keeps working without persistence.
  }
}

export function getKnowledgeBase(): Record<string, Product> {
  return read<Record<string, Product>>(KB_KEY, {});
}

export function getCachedProduct(code: string): Product | undefined {
  return getKnowledgeBase()[code];
}

export function saveProduct(product: Product): void {
  const kb = getKnowledgeBase();
  kb[product.code] = product;
  const codes = Object.keys(kb);
  // Trim the oldest entries (insertion order) when over the limit.
  for (const code of codes.slice(0, Math.max(0, codes.length - MAX_KB))) delete kb[code];
  write(KB_KEY, kb);

  const history = getHistory().filter((c) => c !== product.code);
  history.unshift(product.code);
  write(HISTORY_KEY, history.slice(0, MAX_HISTORY));
}

export function getHistory(): string[] {
  return read<string[]>(HISTORY_KEY, []);
}

export function getHistoryProducts(): Product[] {
  const kb = getKnowledgeBase();
  return getHistory().map((c) => kb[c]).filter(Boolean);
}

export function clearHistory(): void {
  write(HISTORY_KEY, []);
}

/** Case-insensitive search over name, brand and barcode of saved products. */
export function searchKnowledgeBase(query: string): Product[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return Object.values(getKnowledgeBase()).filter((p) => {
    const hay = `${p.name} ${p.brands} ${p.code}`.toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

export function getSavedBrandContacts(): Record<string, string> {
  return read<Record<string, string>>(CONTACTS_KEY, {});
}

export function saveBrandContact(brandKey: string, email: string): void {
  const contacts = getSavedBrandContacts();
  contacts[brandKey] = email;
  write(CONTACTS_KEY, contacts);
}
