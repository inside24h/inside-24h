import { useId, useMemo, useRef, useState } from 'react';
import { searchCatalog, type CatalogItem } from './catalog';

// Search box with a suggestion list. Works with mouse, touch and keyboard (↑ ↓ Enter Esc).
// `big` is the start-screen version; the compact one sits in the top bar.
export function Search({ onPick, big = false, autoFocus = false, current }: {
  onPick: (item: CatalogItem) => void; big?: boolean; autoFocus?: boolean; current?: string;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(big);
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchCatalog(q), [q]);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);

  const pick = (item: CatalogItem) => { onPick(item); setQ(''); if (!big) { setOpen(false); input.current?.blur(); } };

  return (
    <div className={`search ${big ? 'big' : 'small'}`} onBlur={(e) => { if (!big && !e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <label className="sfield">
        <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" /><path d="M13 13l5 5" /></svg>
        <input ref={input} type="search" autoFocus={autoFocus} value={q} placeholder={big ? 'Type a food or drink, e.g. coffee' : current ? `${current} · search…` : 'Search food or drink'}
          role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-label="Search food or drink"
          aria-activedescendant={open && results[active] ? `${listId}-${results[active].id}` : undefined}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
            if (e.key === 'Enter' && results[active]) { e.preventDefault(); pick(results[active]); }
            if (e.key === 'Escape') { setOpen(false); input.current?.blur(); }
          }} />
      </label>
      {open && (
        <ul id={listId} className="results" role="listbox" aria-label="Foods and drinks">
          {results.length === 0 && <li className="empty">Nothing found for “{q}”. Try a simpler word, like “coffee”.</li>}
          {results.map((item, i) => (
            <li key={item.id} id={`${listId}-${item.id}`} role="option" aria-selected={i === active}
              className={`${i === active ? 'active' : ''} ${item.status}`}
              onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => pick(item)}>
              <span className="rname">{item.name}</span>
              <span className="rserv">{item.serving}</span>
              <span className={`rtag ${item.status}`}>{item.status === 'ready' ? 'Ready' : 'In research'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
