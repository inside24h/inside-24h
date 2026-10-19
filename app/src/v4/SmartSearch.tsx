import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Browse } from './lazyUi'; // loaded on first use
import './browse.css';
import './meals.css';
import { FOODS, foodKey, kindsOf, macros, suggest, type Part, type Suggestion } from './food/parse';
import { PRESETS, presetParts } from './food/meal';

// Type like you talk: "1 jabuka", "2 slices of bread", "kava s mlijekom", "pizza and a beer".
// Each suggestion already shows the amount, calories and how fast it raises blood sugar, so nobody needs a nutrition table.
const giWord = (gi: number | null, carbs: number) => (carbs < 5 ? { w: 'almost no sugar', c: 'g0' } : gi === null ? { w: 'sugar effect not measured', c: 'gq' } : gi >= 70 ? { w: 'fast sugar', c: 'g2' } : gi >= 56 ? { w: 'medium-speed sugar', c: 'g1' } : { w: 'slow sugar', c: 'g0' });

/** `onAdd`: each result also gets a small "+" that adds it to the current meal instead of replacing it.
 *  `mode="add"`: the whole search adds (used by "+ Add something"); `onDone` runs after an add or on Escape/blur. */
export function SmartSearch({ onPick, big = false, current, onAdd, mode = 'replace', autoFocus = false, onDone }: {
  onPick: (parts: Part[], text: string) => void; big?: boolean; current?: string;
  onAdd?: (parts: Part[], text: string) => void; mode?: 'replace' | 'add'; autoFocus?: boolean; onDone?: () => void;
}) {
  const adding = mode === 'add' && !!onAdd;
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [browse, setBrowse] = useState(false);
  const [active, setActive] = useState(0);
  const results = useMemo(() => suggest(q, 30), [q]);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  // After a pick in Browse, the dialog hands focus back to this input; that must not reopen the list over the result.
  const quiet = useRef(false);
  const hush = () => { quiet.current = true; window.setTimeout(() => { quiet.current = false; }, 400); };
  const pick = (s: Suggestion) => {
    if (adding) onAdd!(s.parts, s.text); else onPick(s.parts, q.trim() || s.text);
    setQ(''); setOpen(false); input.current?.blur(); if (adding) onDone?.();
  };
  const add = (s: Suggestion) => { onAdd?.(s.parts, s.text); setQ(''); setOpen(false); input.current?.blur(); onDone?.(); };
  useEffect(() => { if (autoFocus) input.current?.focus(); }, [autoFocus]);

  const seeAll = (cls: string) => (
    <li className={`seeall ${cls}`} role="presentation" onMouseDown={(e) => e.preventDefault()}>
      <button type="button" onClick={() => { setOpen(false); setBrowse(true); }}>{q ? `See all ${FOODS.length} foods and drinks →` : `Browse all ${FOODS.length} foods and drinks →`}</button>
    </li>
  );

  return (
    <div className={`search smart ${big ? 'big' : 'small'} ${adding ? 'adding' : ''}`} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget) && !browse) { setOpen(false); if (adding && !q) onDone?.(); } }}>
      <label className="sfield">
        <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" /><path d="M13 13l5 5" /></svg>
        <input ref={input} type="search" value={q}
          placeholder={adding ? 'Add to your meal, e.g. fries or cola…' : big ? 'e.g. apple, pizza, latte' : current ? (current.includes(' + ') ? 'Search for something else…' : `${current} · Try something else…`) : 'Search for a food or drink'}
          role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-label={adding ? 'Add something to your meal' : 'What did you eat or drink?'}
          aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
          onFocus={() => { if (!quiet.current) setOpen(true); }}
          onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
            if (e.key === 'Enter' && results[active]) { e.preventDefault(); pick(results[active]); }
            if (e.key === 'Escape') { setOpen(false); input.current?.blur(); if (adding) onDone?.(); }
          }} />
      </label>
      {open && (
        <ul id={listId} className="results" role="listbox" aria-label="Foods and drinks">
          {!q && seeAll('top')}
          {!q && !adding && (
            <li className="mealpresets" role="presentation" onMouseDown={(e) => e.preventDefault()}>
              <span>Popular meals</span>
              <div>{PRESETS.map((p) => (
                <button key={p.id} type="button" onClick={() => { onPick(presetParts(p), p.name); setOpen(false); input.current?.blur(); }}>{p.name}</button>
              ))}</div>
            </li>
          )}
          {!q && <li className="hintrow" aria-hidden="true">Popular picks, or type anything, with an amount if you like</li>}
          {results.length === 0 && <li className="empty" role="status">We don’t know “{q}” yet. Try a simpler word, like “bread” or “juice”.</li>}
          {results.map((s, i) => {
            const m = macros(s.parts);
            const gw = giWord(m.gi, m.availCarbs);
            const assumed = s.parts.some((p) => p.assumed || p.food.recipe || p.food.proxy);
            return (
              <li key={s.parts.map((p) => foodKey(p.food) + p.grams).join('+')} id={`${listId}-${i}`} role="option" aria-selected={i === active}
                className={`${i === active ? 'active' : ''} ${onAdd && !adding ? 'canadd' : ''}`} onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => pick(s)}>
                <span className="sdots" aria-hidden="true">{s.parts.map((p) => <i key={p.food.id} style={{ background: p.food.color }} />)}</span>
                <span className="rname">{s.parts.map((p) => p.food.name).join(' + ')}
                  <small>{s.parts.map((p) => p.amountLabel).join(' + ')}{assumed ? ' · typical serving' : ''}{s.parts.length === 1 && kindsOf(s.parts[0].food) > 1 ? ` · ${kindsOf(s.parts[0].food)} kinds` : ''}</small></span>
                <span className="rkcal">{Math.round(m.kcal)} kcal</span>
                <span className={`rgi ${gw.c}`}>{gw.w}</span>
                {onAdd && !adding && (
                  <button type="button" className="radd" aria-label={`Add ${s.text} to the meal`} title="Add to the meal (keeps what you have)"
                    onClick={(e) => { e.stopPropagation(); add(s); }}>+</button>
                )}
              </li>
            );
          })}
          {q && seeAll('end')}{/* empty box: the Browse button is already at the top */}
        </ul>
      )}
      {browse && createPortal(<Browse onClose={() => { setBrowse(false); if (adding) onDone?.(); }}
        onPick={(parts, text) => { hush(); setBrowse(false); setQ(''); if (adding) { onAdd!(parts, text); onDone?.(); } else onPick(parts, text); }}
        onAdd={onAdd ? (parts, text) => { hush(); setBrowse(false); setQ(''); onAdd(parts, text); onDone?.(); } : undefined} />, document.body)}
    </div>
  );
}
