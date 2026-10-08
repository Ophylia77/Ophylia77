import { useState } from 'react';
import { clearHistory, getHistoryProducts } from '../lib/storage';
import { ProductCard } from './common';

export function HistoryPage({ onOpen }: { onOpen: (code: string) => void }) {
  const [items, setItems] = useState(getHistoryProducts);
  if (items.length === 0) return <p className="muted center">No scans yet. Scan a product to get started.</p>;
  return (
    <section>
      <div className="list">{items.map((p) => <ProductCard key={p.code} product={p} onOpen={onOpen} />)}</div>
      <button
        className="btn ghost block"
        onClick={() => {
          clearHistory();
          setItems([]);
        }}
      >
        Clear history
      </button>
    </section>
  );
}
