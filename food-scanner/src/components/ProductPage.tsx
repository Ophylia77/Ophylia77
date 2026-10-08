import { useEffect, useState } from 'react';
import { RISK_LABEL } from '../data/additives';
import { findAlternatives, type Alternative } from '../lib/alternatives';
import { analyzeProduct, type Level } from '../lib/analyze';
import { fetchProduct } from '../lib/openFoodFacts';
import { fetchRecalls, type Recall } from '../lib/recalls';
import { getCachedProduct, saveProduct } from '../lib/storage';
import type { Product } from '../lib/types';
import { CallOutDialog } from './CallOut';
import { ProductCard, RATING_LABEL, ScoreBadge } from './common';

type LoadState = { status: 'loading' } | { status: 'notfound' } | { status: 'error'; message: string } | { status: 'ok'; product: Product };

const LEVEL_TEXT: Record<Level, string> = { low: 'Low', moderate: 'Moderate', high: 'High' };

function levelClass(level: Level, positive: boolean): string {
  if (positive) return level === 'high' ? 'good' : level === 'moderate' ? 'ok' : 'neutral';
  return level === 'high' ? 'bad' : level === 'moderate' ? 'ok' : 'good';
}

export function ProductPage({ code, onOpen }: { code: string; onOpen: (code: string) => void }) {
  const [state, setState] = useState<LoadState>(() => {
    const cached = getCachedProduct(code);
    return cached ? { status: 'ok', product: cached } : { status: 'loading' };
  });

  useEffect(() => {
    const ctrl = new AbortController();
    const cached = getCachedProduct(code);
    setState(cached ? { status: 'ok', product: cached } : { status: 'loading' });
    fetchProduct(code, ctrl.signal)
      .then((p) => {
        if (p) {
          saveProduct(p);
          setState({ status: 'ok', product: p });
        } else if (!cached) {
          setState({ status: 'notfound' });
        }
      })
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        if (cached) saveProduct(cached); // still record it in history when offline
        else setState({ status: 'error', message: (e as Error).message });
      });
    return () => ctrl.abort();
  }, [code]);

  if (state.status === 'loading') return <p className="center muted">Looking up {code}…</p>;
  if (state.status === 'notfound')
    return (
      <div className="card center">
        <h2>Product not found</h2>
        <p className="muted">Barcode {code} isn't in the database yet.</p>
        <a className="btn primary" href={`https://world.openfoodfacts.org/cgi/product.pl?code=${code}`} target="_blank" rel="noreferrer">
          Add it to Open Food Facts ↗
        </a>
      </div>
    );
  if (state.status === 'error')
    return (
      <div className="card center">
        <h2>Couldn't load this product</h2>
        <p className="muted">{state.message}. Check your connection and try again.</p>
      </div>
    );

  return <ProductDetails product={state.product} onOpen={onOpen} />;
}

function ProductDetails({ product, onOpen }: { product: Product; onOpen: (code: string) => void }) {
  const a = analyzeProduct(product);
  const [openFlag, setOpenFlag] = useState<string | null>(null);
  const [callOut, setCallOut] = useState(false);
  const [alts, setAlts] = useState<Alternative[] | null>(null);
  const [recalls, setRecalls] = useState<Recall[] | null>(null);
  const concerning = a.flags.filter((f) => f.additive.risk !== 'limited');

  useEffect(() => {
    const ctrl = new AbortController();
    setAlts(null);
    if (a.score < 75 || a.flags.length > 0) {
      findAlternatives(product, a, ctrl.signal).then(setAlts).catch(() => !ctrl.signal.aborted && setAlts([]));
    }
    setRecalls(null);
    if (product.brands) fetchRecalls(product.brands, ctrl.signal).then(setRecalls).catch(() => !ctrl.signal.aborted && setRecalls([]));
    return () => ctrl.abort();
  }, [product.code]);

  return (
    <article className="product">
      <header className="card product-head">
        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <div className="img-ph" aria-hidden>🛒</div>}
        <div className="meta">
          <h1>{product.name}</h1>
          <p className="muted">{[product.brands, product.quantity].filter(Boolean).join(' · ')}</p>
          <p className="muted small">Barcode {product.code}</p>
        </div>
        <div className="score-col">
          <ScoreBadge score={a.score} rating={a.rating} size="lg" />
          <span className={`pill ${a.rating}`}>{RATING_LABEL[a.rating]}</span>
        </div>
      </header>

      {concerning.length > 0 && (
        <button className="btn danger block" onClick={() => setCallOut(true)}>
          📣 Call out {product.brands.split(',')[0] || 'this brand'} for harmful ingredients
        </button>
      )}

      <section className="card">
        <h2>⚠️ Ingredients of concern</h2>
        {a.flags.length === 0 ? (
          <p className="good-text">No ingredients of concern found in our database.</p>
        ) : (
          <ul className="flags">
            {a.flags.map((f) => (
              <li key={f.additive.id} className={`flag ${f.additive.risk}`}>
                <button
                  className="flag-head"
                  aria-expanded={openFlag === f.additive.id}
                  onClick={() => setOpenFlag(openFlag === f.additive.id ? null : f.additive.id)}
                >
                  <span className="dot" aria-hidden />
                  <span className="name">{f.additive.name}</span>
                  <span className="risk">{RISK_LABEL[f.additive.risk]}</span>
                </button>
                {openFlag === f.additive.id && (
                  <div className="flag-body">
                    <p>{f.additive.concern}</p>
                    <ul className="sources">
                      {f.additive.sources.map((s) => (
                        <li key={s.org + s.note}>
                          <strong>{s.org}:</strong> {s.note}{' '}
                          {s.url && <a href={s.url} target="_blank" rel="noreferrer">Source ↗</a>}
                        </li>
                      ))}
                    </ul>
                    <p className="muted small">Detected via {f.matchedBy}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {!product.ingredientsText && product.additivesTags.length === 0 && (
          <p className="muted small">No ingredient list is available for this product yet, so it could not be fully checked.</p>
        )}
      </section>

      {(a.benefits.length > 0 || a.warnings.length > 0) && (
        <section className="card">
          <h2>💚 Health highlights</h2>
          <ul className="highlights">
            {a.benefits.map((b) => <li key={b} className="pos">✔ {b}</li>)}
            {a.warnings.map((w) => <li key={w} className="neg">✖ {w}</li>)}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>📊 Nutrition <span className="muted small">per 100 {product.isBeverage ? 'ml' : 'g'}</span></h2>
        {a.nutrients.length === 0 ? (
          <p className="muted">No nutrition facts available.</p>
        ) : (
          <table className="nutrition">
            <tbody>
              {a.nutrients.map((r) => (
                <tr key={r.key}>
                  <td>{r.label}</td>
                  <td className="val">{r.unit === 'kcal' ? r.value : Math.round(r.value * 10) / 10} {r.unit}</td>
                  <td><span className={`lvl ${levelClass(r.level, r.positive)}`}>{LEVEL_TEXT[r.level]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {a.micronutrients.length > 0 && (
          <>
            <h3>Vitamins & minerals</h3>
            <ul className="micros">
              {a.micronutrients.map((m) => (
                <li key={m.key}>
                  <span>{m.label}</span>
                  <span className="bar"><span style={{ width: `${Math.min(100, m.percentNrv)}%` }} /></span>
                  <span className="val">{m.value} {m.unit} · {m.percentNrv}%</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {product.nutriscoreGrade && <p className="muted small">Nutri-Score: {product.nutriscoreGrade.toUpperCase()}{product.novaGroup ? ` · NOVA group ${product.novaGroup}` : ''}</p>}
      </section>

      {product.ingredientsText && (
        <section className="card">
          <details>
            <summary><h2>🧾 Full ingredient list</h2></summary>
            <p className="ingredients">{product.ingredientsText}</p>
          </details>
        </section>
      )}

      {(a.score < 75 || a.flags.length > 0) && (
        <section className="card">
          <h2>🌿 Safer alternatives</h2>
          {alts === null ? (
            <p className="muted">Searching for better options…</p>
          ) : alts.length === 0 ? (
            <p className="muted">No better-rated alternatives found in this category yet.</p>
          ) : (
            <div className="list">
              {alts.map((alt) => <ProductCard key={alt.product.code} product={alt.product} onOpen={onOpen} />)}
            </div>
          )}
        </section>
      )}

      {recalls && recalls.length > 0 && (
        <section className="card">
          <h2>🚨 FDA recalls for this brand</h2>
          <ul className="recalls">
            {recalls.map((r, i) => (
              <li key={i}>
                <strong>{r.date}</strong> · {r.classification} · {r.status}
                <p>{r.reason}</p>
                <p className="muted small">{r.product.slice(0, 160)}{r.product.length > 160 ? '…' : ''}</p>
              </li>
            ))}
          </ul>
          <p className="muted small">Matched by company name via openFDA; may include other companies with a similar name.</p>
        </section>
      )}

      <p className="muted small center">
        Data: <a href={`https://world.openfoodfacts.org/product/${product.code}`} target="_blank" rel="noreferrer">Open Food Facts</a>,
        IARC, EFSA, FDA, WHO. Informational only – not medical advice.
      </p>

      {callOut && <CallOutDialog product={product} flags={a.flags} onClose={() => setCallOut(false)} />}
    </article>
  );
}
