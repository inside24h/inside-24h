import { useState } from 'react';
import { SmartSearch } from './SmartSearch';
import './meals.css';
import type { Part } from './food/parse';
import { addParts, ITEM_STEPS, MAX_ITEMS, removePart, setServings, shortName, stepOf } from './food/meal';

// The search in the header plus the MEAL builder: "+ Add something" next to what you have, and, once there are two or
// more things, one chip per item with its amount (tap to cycle ½ · 1 · 2 · 3) and ✕ to take it out. Max 5 things.
const stepLabel = (x: number) => (x === 0.5 ? '½' : `${x}`);

export function MealBar({ parts, current, onPick, onChange }: {
  parts: Part[]; current?: string;
  /** replace everything (search pick, preset) */ onPick: (parts: Part[], text: string) => void;
  /** the meal changed (added, removed, amount) */ onChange: (parts: Part[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const full = parts.length >= MAX_ITEMS;
  const add = (more: Part[]) => { if (parts.length) onChange(addParts(parts, more)); else onPick(more, ''); };
  return (
    <div className="mealbar">
      {adding
        ? <SmartSearch key="add" mode="add" autoFocus onPick={onPick} onAdd={(p) => add(p)} onDone={() => setAdding(false)} />
        : <SmartSearch key="find" onPick={onPick} current={current} onAdd={full || !parts.length ? undefined : (p) => add(p)} />}
      {(parts.length > 1 || !adding) && (
        <ul className="mealchips" aria-label="Your meal">
          {parts.length > 1 && parts.map((p, i) => {
            const step = stepOf(p);
            const next = ITEM_STEPS[(ITEM_STEPS.indexOf((step ?? 1) as typeof ITEM_STEPS[number]) + 1) % ITEM_STEPS.length];
            return (
              <li key={`${p.food.id}-${i}`} className="mchip">
                <i style={{ background: p.food.color }} aria-hidden="true" />
                <span className="mname" title={`${shortName(p.food)} · ${p.amountLabel}`}>{shortName(p.food)}</span>
                <button type="button" className="mamt" onClick={() => onChange(setServings(parts, i, next))}
                  aria-label={`${shortName(p.food)}: ${p.amountLabel}. Change amount to ${stepLabel(next)} serving${next === 1 ? '' : 's'}`}
                  title={`${p.amountLabel} · tap for ${stepLabel(next)}×`}>{step === null ? `${Math.round(p.grams)} g` : `${stepLabel(step)}×`}</button>
                <button type="button" className="mx" onClick={() => onChange(removePart(parts, i))} aria-label={`Remove ${shortName(p.food)}`}>✕</button>
              </li>
            );
          })}
          {!adding && parts.length > 0 && !full && (
            <li><button type="button" className="madd" onClick={() => setAdding(true)} title="Eat or drink several things together and see one combined story">+ Add<span className="maddmore"> something</span></button></li>
          )}
          {full && <li className="mfull">Max {MAX_ITEMS} things</li>}
        </ul>
      )}
    </div>
  );
}
