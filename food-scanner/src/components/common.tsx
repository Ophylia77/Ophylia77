import type { Rating } from '../lib/analyze';
import type { Product } from '../lib/types';
import { analyzeProduct } from '../lib/analyze';

export const RATING_LABEL: Record<Rating, string> = {
  excellent: 'Excellent',
  good: 'Good',
  poor: 'Poor',
  bad: 'Bad',
};

export function ScoreBadge({ score, rating, size = 'sm' }: { score: number; rating: Rating; size?: 'sm' | 'lg' }) {
  return (
    <div className={`score ${rating} ${size}`} aria-label={`Score ${score} out of 100, ${RATING_LABEL[rating]}`}>
      <span className="num">{score}</span>
      {size === 'lg' && <span className="of">/100</span>}
    </div>
  );
}

export function ProductCard({ product, onOpen }: { product: Product; onOpen: (code: string) => void }) {
  const a = analyzeProduct(product);
  return (
    <button className="card product-card" onClick={() => onOpen(product.code)}>
      {product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" /> : <div className="img-ph" aria-hidden>🛒</div>}
      <div className="meta">
        <strong>{product.name}</strong>
        <span className="muted">{product.brands || 'Unknown brand'}</span>
        <span className={`pill ${a.rating}`}>{RATING_LABEL[a.rating]}</span>
      </div>
      <ScoreBadge score={a.score} rating={a.rating} />
    </button>
  );
}
