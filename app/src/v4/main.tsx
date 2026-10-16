import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppV4 from './AppV4';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { load3d } from './lazy3d';
import { prefetchUi } from './lazyUi';
import '../assets/fonts/fonts.css';
import './v4.css';
import './mobile.css';

// Last line of defence: whatever goes wrong (a broken old link, a browser quirk), people get a way back
// instead of a blank black page. "Start over" drops the link and reloads the start screen.
function Crashed() {
  return (
    <div className="boot crashed" role="alert">
      <div className="boot-name">Inside 24h</div>
      <p>Sorry, something went wrong while opening this.</p>
      <button className="primary" onClick={() => { try { history.replaceState(null, '', location.pathname + location.search); } catch { /* sandboxed */ } location.reload(); }}>Start over</button>
    </div>
  );
}

// The 3D part (three.js + the body model) is the heaviest download. A link that opens a food (#q=, #m=, #p=, #t=,
// #compare=) needs it at once; otherwise it starts right after the first paint, while people read the start screen.
// (Single-file build: it is already inlined, so this just resolves.)
const opensFood = /(?:^#|&)(?:q|m|p|t|compare)=/.test(location.hash);
if (opensFood) load3d().catch(() => { /* AppV4 retries when it mounts the canvas */ });

// The loading shell in index-v4.html lives inside #root, so React's first render replaces it.
const mount = () => createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary fallback={() => <Crashed />}><AppV4 /></ErrorBoundary></StrictMode>);
// Hosted build: the stylesheet loads without blocking the shell's first paint (vite.site.config.ts); wait for it so
// the UI never flashes unstyled. Single-file build: no such link, mount at once.
const appCss = document.querySelector<HTMLLinkElement>('link[data-i24-css]');
if (appCss && appCss.media !== 'all') {
  let done = false;
  const go = () => { if (!done) { done = true; mount(); } };
  appCss.addEventListener('load', go); appCss.addEventListener('error', go);
  setTimeout(go, 8000); // never hang on a stuck stylesheet
} else mount();

const start3d = () => load3d().catch(() => { /* retried on mount */ });
const p3d = opensFood ? load3d() : new Promise<void>((ok) => requestAnimationFrame(() => setTimeout(() => { start3d().finally(ok); }, 0)));
// then, when the page is idle, the on-demand parts (Compare, Browse, profile...) so a tap rarely waits
p3d.catch(() => undefined).then(() => {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(prefetchUi, { timeout: 4000 }); else setTimeout(prefetchUi, 1500);
});
