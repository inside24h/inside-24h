import { useState } from 'react';
import { SmartSearch } from './SmartSearch';
import './meals.css';
import { baseOf, kindsOf, type Food, type Part } from './food/parse';
import { addParts, ITEM_STEPS, MAX_ITEMS, PACE_OPTIONS, paceLabel, removePart, setFood, setServings, shortName, stepOf } from './food/meal';
import { ChoiceBar, ChoiceSheet } from './Choices';

// The search in the header plus the MEAL builder: "+ Add something" next to what you have, and, once there are two or
// more things, one chip per item with its amount (tap to cycle ½ · 1 · 2 · 3) and ✕ to take it out. Max 5 things.
const stepLabel = (x: number) => (x === 0.5 ? '½' : `${x}`);

/** "Over how long?" (PACING, 2026-10-19): All at once · 1 h · 2 h · 3 h · 4 h, for two or more servings. Highlighted
 *  (like "Which tea?") for several alcoholic drinks until the person picks: nobody drinks 5 beers in one go. */
function PaceBar({ over, set, hot }: { over: number; set: (min: number) => void; hot: boolean }) {
  return (
    <div className={`choices pace ${hot ? 'asking' : ''}`}>
      <div className="crow">
        <span className="cask" id="pace-ask">Over how long?{hot ? <em><span className="plong"> Few people drink them all in one go: pick yours.</span><span className="pshort"> Not all at once? Pick:</span></em> : null}</span>
        <div className="cchips small" role="radiogroup" aria-labelledby="pace-ask">
          {PACE_OPTIONS.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={over === m} className={over === m ? 'on' : ''}
              title={m ? `Spread evenly over ${paceLabel(m)}, the first one now` : 'Everything at the same moment (the highest peak)'} onClick={() => set(m)}>{paceLabel(m)}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MealBar({ parts, current, onPick, onChange, asking = false, onSwitch, pace }: {
  parts: Part[]; current?: string;
  /** replace everything (search pick, preset) */ onPick: (parts: Part[], text: string) => void;
  /** the meal changed (added, removed, amount) */ onChange: (parts: Part[]) => void;
  /** "Which tea?" is still open (the text named several foods) */ asking?: boolean;
  /** another kind of item i: the simulation switches and keeps the minute */ onSwitch?: (i: number, food: Food) => void;
  /** "Over how long?" when there is something to spread (minutes; `hot` = highlight until picked) */ pace?: { over: number; set: (min: number) => void; hot: boolean };
}) {
  const [adding, setAdding] = useState(false);
  const [sheet, setSheet] = useState<number | null>(null);
  const hasChoices = (f: Food) => kindsOf(f) > 0 || !!baseOf(f).addins || !!baseOf(f).builder;
  const switchItem = (i: number, f: Food) => (onSwitch ? onSwitch(i, f) : onChange(setFood(parts, i, f)));
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
                {hasChoices(p.food)
                  ? <button type="button" className="mname mkind" title={`${shortName(p.food)} · ${p.amountLabel}: change the kind`} aria-haspopup="dialog"
                      aria-label={`${shortName(p.food)}: change the kind`} onClick={() => setSheet(i)}><span className="mkn">{shortName(p.food)}</span><span aria-hidden="true"> ▾</span></button>
                  : <span className="mname" title={`${shortName(p.food)} · ${p.amountLabel}`}>{shortName(p.food)}</span>}
                <button type="button" className="mamt" onClick={() => onChange(setServings(parts, i, next))}
                  aria-label={`${shortName(p.food)}: ${p.amountLabel}. Change amount to ${stepLabel(next)} serving${next === 1 ? '' : 's'}`}
                  title={`${p.amountLabel} · tap for ${stepLabel(next)}×`}>{step === null ? `${Math.round(p.grams)} g` : `${stepLabel(step)}×`}</button>
                <button type="button" className="mx" onClick={() => onChange(removePart(parts, i))} aria-label={`Remove ${shortName(p.food)}`}>✕</button>
              </li>
            );
          })}
          {!adding && parts.length > 0 && !full && (
            <li><button type="button" className="madd" onClick={() => setAdding(true)} title="Add more food or drink and see one combined story">+ Add<span className="maddmore"> something</span></button></li>
          )}
          {full && <li className="mfull">Up to {MAX_ITEMS} items</li>}
        </ul>
      )}
      {parts.length === 1 && !adding && onSwitch && <ChoiceBar part={parts[0]} asking={asking} onPick={(f) => switchItem(0, f)} />}
      {pace && !adding && <PaceBar {...pace} />}
      {sheet !== null && parts[sheet] && (
        <ChoiceSheet food={parts[sheet].food} title={shortName(baseOf(parts[sheet].food))} full onPick={(f) => switchItem(sheet, f)} onClose={() => setSheet(null)} />
      )}
    </div>
  );
}
