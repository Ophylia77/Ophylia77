import { useMemo, useState } from 'react';
import type { Flag } from '../lib/analyze';
import { buildCallOutEmail, EMAIL_RE, lookupBrandEmail, normalizeBrand, primaryBrand } from '../lib/email';
import { saveBrandContact } from '../lib/storage';
import type { Product } from '../lib/types';

interface Props {
  product: Product;
  flags: Flag[];
  onClose: () => void;
}

/** Collects (or recalls) the brand's email, then opens a pre-written draft in the user's mail app. */
export function CallOutDialog({ product, flags, onClose }: Props) {
  const brand = primaryBrand(product);
  const known = useMemo(() => lookupBrandEmail(brand) ?? '', [brand]);
  const [email, setEmail] = useState(known);
  const valid = EMAIL_RE.test(email.trim());
  const href = valid ? buildCallOutEmail(product, flags, email.trim()) : undefined;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${brand} consumer care contact email`)}`;

  const remember = () => {
    const key = normalizeBrand(brand);
    if (valid && key) saveBrandContact(key, email.trim());
  };

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="callout-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="callout-title">📣 Call out {brand || 'this brand'}</h2>
        <p className="muted">
          We'll open a ready-to-send email in your mail app listing the {flags.filter((f) => f.additive.risk !== 'limited').length} ingredient(s) of
          concern and their sources. Just review and press send.
        </p>

        <label htmlFor="brand-email">Brand email (To)</label>
        <input
          id="brand-email"
          type="email"
          placeholder="consumer.care@brand.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {!known && (
          <p className="hint">
            We don't have this brand's address yet.{' '}
            <a href={searchUrl} target="_blank" rel="noreferrer">Find their contact email ↗</a> — once entered, it's
            remembered for every product from this brand.
          </p>
        )}

        <div className="actions">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <a
            className={`btn danger ${valid ? '' : 'disabled'}`}
            href={href}
            aria-disabled={!valid}
            onClick={(e) => {
              if (!valid) return e.preventDefault();
              remember();
            }}
          >
            Open email draft
          </a>
        </div>
      </div>
    </div>
  );
}
