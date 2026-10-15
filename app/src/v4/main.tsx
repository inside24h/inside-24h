import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppV4 from './AppV4';
import { ErrorBoundary } from '../ui/ErrorBoundary';
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

// The loading shell in index-v4.html lives inside #root, so React's first render replaces it.
createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary fallback={() => <Crashed />}><AppV4 /></ErrorBoundary></StrictMode>);
