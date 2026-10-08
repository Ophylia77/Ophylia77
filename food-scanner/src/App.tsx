import { useEffect, useState } from 'react';
import { HistoryPage } from './components/HistoryPage';
import { ProductPage } from './components/ProductPage';
import { Scanner } from './components/Scanner';
import { SearchPage } from './components/SearchPage';

type Route = { name: 'scan' } | { name: 'search'; query: string } | { name: 'history' } | { name: 'product'; code: string };

/** Hash routes keep the browser back button working and the app hostable as static files. */
function parseHash(hash: string): Route {
  const [, page, arg = ''] = hash.replace(/^#/, '').split('/');
  if (page === 'product' && arg) return { name: 'product', code: arg };
  if (page === 'search') return { name: 'search', query: decodeURIComponent(arg) };
  if (page === 'history') return { name: 'history' };
  return { name: 'scan' };
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const openProduct = (code: string) => (location.hash = `#/product/${code}`);
  const tab = route.name === 'product' ? null : route.name;

  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="brand">🥕 SafeBite</a>
        {route.name === 'product' && (
          <button className="btn ghost" onClick={() => history.back()}>← Back</button>
        )}
      </header>

      <main>
        {route.name === 'scan' && (
          <>
            <p className="tagline">Scan a barcode to see what's really inside – harmful ingredients, nutrition and safer swaps.</p>
            <Scanner onDetected={openProduct} />
          </>
        )}
        {route.name === 'search' && <SearchPage onOpen={openProduct} initialQuery={route.query} />}
        {route.name === 'history' && <HistoryPage onOpen={openProduct} />}
        {route.name === 'product' && <ProductPage key={route.code} code={route.code} onOpen={openProduct} />}
      </main>

      <nav className="tabbar" aria-label="Main">
        <a href="#/" className={tab === 'scan' ? 'active' : ''}><span aria-hidden>📷</span>Scan</a>
        <a href="#/search/" className={tab === 'search' ? 'active' : ''}><span aria-hidden>🔍</span>Search</a>
        <a href="#/history" className={tab === 'history' ? 'active' : ''}><span aria-hidden>🕘</span>History</a>
      </nav>
    </div>
  );
}
