import { useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Browse } from './Browse';
import './browse.css';
import { FOODS, macros, suggest, type Part, type Suggestion } from './food/parse';

// Type like you talk: "1 jabuka", "2 slices of bread", "kava s mlijekom", "pizza and a beer".
// Each suggestion already shows the amount, calories and how fast it raises blood sugar, so nobody needs a nutrition table.
const giWord = (gi: number | null, carbs: number) => (carbs < 5 ? { w: 'almost no sugar', c: 'g0' } : gi === null ? { w: 'sugar effect not measured', c: 'gq' } : gi >= 70 ? { w: 'fast sugar', c: 'g2' } : gi >= 56 ? { w: 'medium sugar', c: 'g1' } : { w: 'slow sugar', c: 'g0' });

export function SmartSearch({ onPick, big = false, current }: { onPick: (parts: Part[], text: string) => void; big?: boolean; current?: string }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [browse, setBrowse] = useState(false);
  const [active, setActive] = useState(0);
  const results = useMemo(() => suggest(q, 30), [q]);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const pick = (s: Suggestion) => { onPick(s.parts, q.trim() || s.text); setQ(''); setOpen(false); input.current?.blur(); };

  const seeAll = (cls: string) => (
    <li className={`seeall ${cls}`} role="presentation" onMouseDown={(e) => e.preventDefault()}>
      <button type="button" onClick={() => { setOpen(false); setBrowse(true); }}>{q ? `See all ${FOODS.length} foods & drinks →` : `Browse all ${FOODS.length} foods & drinks →`}</button>
    </li>
  );

  return (
    <div className={`search smart ${big ? 'big' : 'small'}`} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <label className="sfield">
        <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" /><path d="M13 13l5 5" /></svg>
        <input ref={input} type="search" value={q}
          placeholder={big ? 'e.g. 1 apple, pizza, coffee with milk' : current ? `${current} · try something else…` : 'Search food or drink'}
          role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-label="What did you eat or drink?"
          aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
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
          {!q && seeAll('top')}
          {!q && <li className="hintrow" aria-hidden="true">Popular — or type anything, with an amount if you like</li>}
          {results.length === 0 && <li className="empty">We don’t know “{q}” yet. Try a simpler word, like “bread” or “juice”.</li>}
          {results.map((s, i) => {
            const m = macros(s.parts);
            const gw = giWord(m.gi, m.availCarbs);
            const assumed = s.parts.some((p) => p.assumed || p.food.recipe || p.food.proxy);
            return (
              <li key={s.parts.map((p) => p.food.id + p.grams).join('+')} id={`${listId}-${i}`} role="option" aria-selected={i === active}
                className={i === active ? 'active' : ''} onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => pick(s)}>
                <span className="sdots" aria-hidden="true">{s.parts.map((p) => <i key={p.food.id} style={{ background: p.food.color }} />)}</span>
                <span className="rname">{s.parts.map((p) => p.food.name).join(' + ')}
                  <small>{s.parts.map((p) => p.amountLabel).join(' + ')}{assumed ? ' · typical size' : ''}</small></span>
                <span className="rkcal">{Math.round(m.kcal)} kcal</span>
                <span className={`rgi ${gw.c}`}>{gw.w}</span>
              </li>
            );
          })}
          {seeAll('end')}
        </ul>
      )}
      {browse && createPortal(<Browse onClose={() => setBrowse(false)} onPick={(parts, text) => { setBrowse(false); setQ(''); onPick(parts, text); }} />, document.body)}
    </div>
  );
}
