import { useRef, type ReactNode } from 'react';
import { useModal } from './a11y';

// Slide-over panel for details (evidence, your body). Closes on Escape or backdrop click; focus moves into it.
export function Drawer({ open, title, onClose, children, side = 'right' }:
  { open: boolean; title: string; onClose: () => void; children: ReactNode; side?: 'left' | 'right' }) {
  const box = useRef<HTMLElement>(null);
  // focus moves to the close button, Tab stays inside, Esc closes, focus returns to the opener (a11y.ts)
  useModal(box, open, onClose);
  if (!open) return null;
  return (
    <div className="drawer-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside ref={box} className={`drawer ${side}`} role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabIndex={-1}>
        <header><h2 id="drawer-title">{title}</h2><button data-autofocus className="x" onClick={onClose} aria-label={`Close ${title}`}>×</button></header>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}
