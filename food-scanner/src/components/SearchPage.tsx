import { useEffect, useState } from 'react';
import { searchProducts } from '../lib/openFoodFacts';
import { searchKnowledgeBase } from '../lib/storage';
import type { Product } from '../lib/types';
import { ProductCard } from './common';

/**
 * Search without the product in hand: products already in the on-device
 * knowledge base show instantly (also offline), then Open Food Facts results.
 */
export function SearchPage({ onOpen, initialQuery }: { onOpen: (code: string) => void; initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [submitted, setSubmitted] = useState(initialQuery);
  const [online, setOnline] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const local = searchKnowledgeBase(query);

  useEffect(() => {
    if (!submitted.trim()) return;
    const ctrl = new AbortController();
    setOnline(null);
    setError(null);
    searchProducts(submitted, ctrl.signal)
      .then(setOnline)
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        setError(navigator.onLine ? (e as Error).message : 'You are offline – showing saved products only.');
        setOnline([]);
      });
    return () => ctrl.abort();
  }, [submitted]);

  const localCodes = new Set(local.map((p) => p.code));
  const remote = (online ?? []).filter((p) => !localCodes.has(p.code));

  return (
    <section>
      <form
        className="searchbar"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(query.trim());
          history.replaceState(null, '', `#/search/${encodeURIComponent(query.trim())}`);
        }}
      >
        <input
          type="search"
          placeholder="Search products or brands, e.g. “chocolate spread”"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search products"
          autoFocus
        />
        <button className="btn primary" type="submit">Search</button>
      </form>

      {local.length > 0 && (
        <>
          <h2 className="section-title">Saved on this device</h2>
          <div className="list">{local.map((p) => <ProductCard key={p.code} product={p} onOpen={onOpen} />)}</div>
        </>
      )}

      {submitted && (
        <>
          <h2 className="section-title">From the global database</h2>
          {error && <p className="error">{error}</p>}
          {online === null ? (
            <p className="muted">Searching…</p>
          ) : remote.length === 0 && !error ? (
            <p className="muted">No more results for “{submitted}”.</p>
          ) : (
            <div className="list">{remote.map((p) => <ProductCard key={p.code} product={p} onOpen={onOpen} />)}</div>
          )}
        </>
      )}

      {!submitted && local.length === 0 && (
        <p className="muted center">Type a product or brand name. Everything you scan is saved so you can find it again here.</p>
      )}
    </section>
  );
}
