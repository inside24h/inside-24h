import { useId, useMemo, useState } from 'react';
import { cityLabel, climateNow, searchCities } from './climate/cities';

// "Where are you today?" — type a city, pick it. The temperature comes from real climate data for that city and month.
export function CityField({ value, onPick }: { value?: string; onPick: (label: string) => void }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const list = useMemo(() => searchCities(q), [q]);
  const id = useId();
  const pick = (i: number) => { const c = list[i]; if (!c) return; onPick(cityLabel(c)); setQ(''); setOpen(false); };
  return (
    <div className="cityfield" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <input type="search" value={q} placeholder={value ? `📍 ${value}` : 'Your city, e.g. Split'} aria-label="Your city"
        role="combobox" aria-expanded={open} aria-controls={id} aria-autocomplete="list"
        aria-activedescendant={open && list[active] ? `${id}-${active}` : undefined}
        onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(list.length - 1, a + 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
          if (e.key === 'Enter') { e.preventDefault(); pick(active); }
          if (e.key === 'Escape') setOpen(false);
        }} />
      {open && (
        <ul id={id} className="results" role="listbox" aria-label="Cities">
          {list.length === 0 && <li className="empty">We don’t have “{q}” yet. Please pick the nearest big city.</li>}
          {list.map((c, i) => {
            const cl = climateNow(c);
            return (
              <li key={`${c.name}-${c.cc}`} id={`${id}-${i}`} role="option" aria-selected={i === active} className={i === active ? 'active' : ''}
                onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => pick(i)}>
                <span className="rname">{c.name}<small>{c.admin ? `${c.admin}, ` : ''}{c.country}</small></span>
                <span className="rkcal">{Math.round(cl.tmin)}–{Math.round(cl.tmax)} °C</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
