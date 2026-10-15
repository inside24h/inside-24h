import { useEffect, useRef, type ReactNode } from 'react';

// Slide-over panel for details (evidence, your body). Closes on Escape or backdrop click; focus moves into it.
export function Drawer({ open, title, onClose, children, side = 'right' }:
  { open: boolean; title: string; onClose: () => void; children: ReactNode; side?: 'left' | 'right' }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="drawer-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className={`drawer ${side}`} role="dialog" aria-modal="true" aria-label={title}>
        <header><h2>{title}</h2><button ref={ref} className="x" onClick={onClose} aria-label="Close">×</button></header>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}
