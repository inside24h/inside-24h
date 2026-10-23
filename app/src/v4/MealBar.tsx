import { useEffect, useRef, useState } from 'react';
import { SmartSearch } from './SmartSearch';
import './meals.css';
import { baseOf, choiceRow, kindsOf, type Food, type Part } from './food/parse';
import { addParts, ITEM_STEPS, MAX_ITEMS, PACE_OPTIONS, paceLabel, removePart, setFood, setServings, shortName, stepOf } from './food/meal';
import { ChoiceBar, ChoiceSheet, Sheet } from './Choices';

// The search in the header plus the MEAL builder: "+ Add something" next to what you have, and, once there are two or
// more things, one chip per item with its amount (tap to cycle ½ · 1 · 2 · 3) and ✕ to take it out. Max 5 things.
const stepLabel = (x: number) => (x === 0.5 ? '½' : `${x}`);

/** "Over how long?" (PACING, 2026-10-19): All at once · 1 h · 2 h · 3 h · 4 h, for two or more servings. Highlighted
 *  (like "Which tea?") for several alcoholic drinks until the person picks: nobody drinks 5 beers in one go. */
function PaceBar({ over, set, hot, inSheet = false }: { over: number; set: (min: number) => void; hot: boolean; inSheet?: boolean }) {
  if (inSheet) return (
    <>
      <h4 id="pace-ask-s">Over how long?</h4>
      <div className="cchips wrap" role="radiogroup" aria-labelledby="pace-ask-s">
        {PACE_OPTIONS.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={over === m} className={over === m ? 'on' : ''}
            title={m ? `Spread evenly over ${paceLabel(m)}, the first one now` : 'Everything at the same moment (the highest peak)'} onClick={() => set(m)}>{paceLabel(m)}</button>
        ))}
      </div>
      <p className="cnote">{over ? `Spread evenly over ${paceLabel(over)}, the first one now.` : 'Everything at the same moment: the highest peak.'}</p>
    </>
  );
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

export function MealBar({ parts, current, onPick, onChange, asking = false, onSwitch, pace, chosen = false }: {
  /** the kind was already chosen (a link with v= / on= / add=): start with the pill, not the question */ chosen?: boolean;
  parts: Part[]; current?: string;
  /** replace everything (search pick, preset) */ onPick: (parts: Part[], text: string) => void;
  /** the meal changed (added, removed, amount) */ onChange: (parts: Part[]) => void;
  /** "Which tea?" is still open (the text named several foods) */ asking?: boolean;
  /** another kind of item i: the simulation switches and keeps the minute */ onSwitch?: (i: number, food: Food) => void;
  /** "Over how long?" when there is something to spread (minutes; `hot` = highlight until picked) */ pace?: { over: number; set: (min: number) => void; hot: boolean };
}) {
  const [adding, setAdding] = useState(false);
  const [sheet, setSheet] = useState<number | null>(null);
  // the meal row scrolls sideways when it is too long: fade the edge that has more (prelaunch QA 2026-10-23; before,
  // at 1440 px the row just ended at the edge of the bar). Only the side that really has more chips fades.
  const chipsRef = useRef<HTMLUListElement>(null);
  const [more, setMore] = useState('');
  useEffect(() => {
    const el = chipsRef.current;
    if (!el) { setMore(''); return; }
    const upd = () => setMore(`${el.scrollLeft > 2 ? ' morel' : ''}${el.scrollLeft + el.clientWidth < el.scrollWidth - 2 ? ' morer' : ''}`);
    upd();
    el.addEventListener('scroll', upd, { passive: true });
    // a mouse wheel scrolls the row sideways while it overflows (no horizontal wheel on most mice)
    const wheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth + 2 || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      const before = el.scrollLeft; el.scrollLeft += e.deltaY;
      if (el.scrollLeft !== before) e.preventDefault(); // at either end the page scrolls as usual
    };
    el.addEventListener('wheel', wheel, { passive: false });
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(upd);
    ro?.observe(el);
    return () => { el.removeEventListener('scroll', upd); el.removeEventListener('wheel', wheel); ro?.disconnect(); };
  }, [parts, pace?.over, pace?.hot]);
  // UX calm 2026-10-19: ONE secondary row under the search. "Which …?" shows until it is answered (a pick, or the
  // sheet opened and closed), then it folds into a pill ("Pizza · Capricciosa · over 2 h ▾") that also holds the pace.
  // A new food from the search asks again. A meal keeps its chips row; the pace is a chip at its start.
  const [seen, setSeen] = useState(chosen);
  const [paceSheet, setPaceSheet] = useState(false);
  const pick = (p: Part[], text: string) => { setSeen(false); onPick(p, text); };
  const hasChoices = (f: Food) => kindsOf(f) > 0 || !!baseOf(f).addins || !!baseOf(f).builder;
  const switchItem = (i: number, f: Food) => (onSwitch ? onSwitch(i, f) : onChange(setFood(parts, i, f)));
  const full = parts.length >= MAX_ITEMS;
  const add = (more: Part[]) => { if (parts.length) onChange(addParts(parts, more)); else onPick(more, ''); };
  const one = parts.length === 1 ? parts[0] : null;
  const paceText = pace ? (pace.over ? `over ${paceLabel(pace.over)}` : 'all at once') : undefined;
  const paceNode = pace ? <PaceBar {...pace} inSheet /> : undefined;
  const second: 'ask' | 'pace' | 'pill' | null = adding || !one || !onSwitch ? null
    : asking && choiceRow(one.food) ? 'ask'
    : pace?.hot ? 'pace'
    : choiceRow(one.food) && !seen ? 'ask'
    : 'pill';
  return (
    <div className={`mealbar ${parts.length > 1 ? 'meal' : ''}`}>
      {adding
        ? <SmartSearch key="add" mode="add" autoFocus onPick={pick} onAdd={(p) => add(p)} onDone={() => setAdding(false)} />
        : <SmartSearch key="find" onPick={pick} current={current} onAdd={full || !parts.length ? undefined : (p) => add(p)} />}
      {/* Polish 2026-10-20: "+ Add" sits next to the search (row 1) for one food AND for a meal. It used to be the last
          chip of the meal row, which scrolls sideways, so with 3+ items it was off-screen on phones and desktop. */}
      {!adding && parts.length > 0 && !full && (
        <button type="button" className="madd" onClick={() => setAdding(true)} title="Add more food or drink and see one combined story">+ Add<span className="maddmore"> something</span></button>
      )}
      {parts.length > 1 && (
        <ul className={`mealchips${more}`} aria-label="Your meal" ref={chipsRef}>
          {parts.length > 1 && pace && (
            <li><button type="button" className={`mpace ${pace.hot ? 'hot' : ''}`} aria-haspopup="dialog" onClick={() => setPaceSheet(true)}
              aria-label={`Over how long: ${pace.hot ? 'not picked yet' : paceLabel(pace.over).toLowerCase()}. Change`}>
              <span aria-hidden="true" className="mpi">◷</span>{pace.hot ? 'Over how long?' : pace.over ? `Over ${paceLabel(pace.over)}` : paceLabel(0)}<span aria-hidden="true" className="cpv"> ▾</span>
            </button></li>
          )}
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
          {full && <li className="mfull">Up to {MAX_ITEMS} items</li>}
        </ul>
      )}
      {/* before 2026-10-19 all rows stacked: <ChoiceBar part asking onPick /> then <PaceBar {...pace} /> */}
      {second === 'ask' && <ChoiceBar mode="ask" part={one!} asking={asking} onPick={(f) => switchItem(0, f)} paceNode={paceNode} onSeen={() => setSeen(true)} />}
      {second === 'pace' && pace && <PaceBar {...pace} />}
      {second === 'pill' && <ChoiceBar mode="pill" part={one!} asking={false} onPick={(f) => switchItem(0, f)} paceNode={paceNode} paceText={paceText} onSeen={() => setSeen(true)} />}
      {!onSwitch && pace && !adding && parts.length === 1 && <PaceBar {...pace} />}
      {paceSheet && pace && <Sheet title="Over how long?" onClose={() => setPaceSheet(false)}><section className="bgrp"><PaceBar {...pace} inSheet /></section></Sheet>}
      {sheet !== null && parts[sheet] && (
        <ChoiceSheet food={parts[sheet].food} title={shortName(baseOf(parts[sheet].food))} full onPick={(f) => switchItem(sheet, f)} onClose={() => setSheet(null)} />
      )}
    </div>
  );
}
