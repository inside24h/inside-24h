// "Which tea?" and "What's on it?" (2026-10-18, research/audit/VARIANTS-DONE.md).
// Under the search, for ONE food: the chooser row (the word's foods, or this food's kinds / presets), a small second row
// with its own kinds and the add-ins (+ Sugar), and "What's on it?" for builders. On phones "What's on it?" is a bottom
// sheet. Every pick switches the simulation at once and keeps the minute (AppV4.switchFood).
// In a MEAL each item's chip opens the same sheet with everything for that item.
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useModal } from './a11y';
import { baseOf, choiceRow, macros, selOf, variantRow, withChoice, type ChoiceRow, type Food, type Part } from './food/parse';
import './choices.css';

const kcalOf = (f: Food) => Math.round(macros([{ food: f, grams: f.serving.grams, amountLabel: '', assumed: false }]).kcal);
/** "≈ 322 kcal per slice · our recipe" (muted caption: how much and where it comes from) */
function caption(f: Food): string {
  const b = baseOf(f);
  const lab = f.serving.label.replace(/^1 /, '');
  const per = b.builder?.unit ? `per ${b.builder.unit}` : /^[\d.]+ (ml|g)$/.test(f.serving.label) || (lab.length <= 14 && !/,|\(/.test(lab)) ? `per ${lab}` : 'per serving';
  const rng = b.variants?.find((v) => v.v === f.v)?.range?.kcal;
  const src = !f.base ? (b.src?.length ? 'label values' : b.fdc ? 'USDA record' : 'our recipe from USDA parts') : f.recipe ? 'our recipe from USDA parts' : f.proxy ? 'closest USDA record' : 'USDA record';
  return `≈ ${kcalOf(f)} kcal ${per}${rng ? ` (${rng[0]}–${rng[1]})` : ''} · ${src}`;
}

function Chips({ row, cur, onPick, small, wrap }: { row: ChoiceRow; cur: Food; onPick: (f: Food) => void; small?: boolean; wrap?: boolean }) {
  return (
    <div className={`cchips ${small ? 'small' : ''} ${wrap ? 'wrap' : ''}`} role="radiogroup" aria-label={row.ask}>
      {row.opts.map((o) => (
        <button key={o.key} type="button" role="radio" aria-checked={o.on} className={o.on ? 'on' : ''}
          onClick={() => { if (!o.on) onPick(withChoice(o.food, { add: cur.add })); }}>{o.chip}</button>
      ))}
    </div>
  );
}

function AddIns({ food, onPick }: { food: Food; onPick: (f: Food) => void }) {
  const list = baseOf(food).addins ?? [];
  if (!list.length) return null;
  return (
    <div className="caddins" role="group" aria-label="Added to the drink">
      {list.map((a) => {
        const n = food.add?.[a.k] ?? 0;
        const next = n >= a.max ? 0 : n + 1;
        const add = { ...(food.add ?? {}) };
        if (next) add[a.k] = next; else delete add[a.k];
        return (
          <button key={a.k} type="button" aria-pressed={n > 0} className={n > 0 ? 'on' : ''}
            aria-label={`${a.label}: ${n ? `${n} × ${a.unit}` : 'none'}. Tap for ${next ? `${next} × ${a.unit}` : 'none'}`}
            title={a.unit} onClick={() => onPick(withChoice(food, { add }))}>
            {n ? `${a.label}${n > 1 ? ` ×${n}` : ''} ✓` : `+ ${a.label}`}
          </button>
        );
      })}
    </div>
  );
}

/** Builder groups: one-of groups as radio chips, the rest as toggles with their grams ("Ham · 21 g"). */
function BuilderParts({ food, onPick, noPresets }: { food: Food; onPick: (f: Food) => void; noPresets?: boolean }) {
  const b = baseOf(food).builder!;
  const sel = selOf(food);
  return (
    <>
      {b.presets.length > 0 && !noPresets && (
        <section className="bgrp"><h4>Quick picks</h4>
          <div className="cchips wrap" role="radiogroup" aria-label="Quick picks">
            {b.presets.map((p) => { const on = p.on.length === sel.length && p.on.every((k) => sel.includes(k));
              return <button key={p.k} type="button" role="radio" aria-checked={on} className={on ? 'on' : ''} onClick={() => onPick(withChoice(food, { on: p.on }))}>{p.chip}</button>; })}
          </div>
        </section>
      )}
      {b.groups.filter((g) => !(g.one && g.opts.length === 1)).map((g) => (
        <section key={g.k} className="bgrp"><h4>{g.label}{!g.one ? <small> · grams per {b.unit || 'serving'}, our estimate</small> : null}</h4>
          <div className="cchips wrap" role={g.one ? 'radiogroup' : 'group'} aria-label={g.label}>
            {g.opts.map((o) => {
              const on = sel.includes(o.k);
              const nextSel = g.one ? [...sel, o.k] : on ? sel.filter((k) => k !== o.k) : [...sel, o.k];
              return (
                <button key={o.k} type="button" role={g.one ? 'radio' : undefined} aria-checked={g.one ? on : undefined} aria-pressed={g.one ? undefined : on}
                  className={on ? 'on' : ''} title={o.src[0]?.text} onClick={() => { if (!(g.one && on)) onPick(withChoice(food, { on: nextSel })); }}>
                  {!g.one && <span aria-hidden="true">{on ? '✓ ' : '+ '}</span>}{o.chip}<small>{Math.round(o.grams)} g</small>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

/** The sheet: "What's on it?" (builder) or, for a meal item, everything about that item. */
export function ChoiceSheet({ food, title, full, onPick, onClose }: { food: Food; title: string; full?: boolean; onPick: (f: Food) => void; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  useModal(box, true, onClose);
  const a = full ? choiceRow(food) : null, v = full ? variantRow(food) : null;
  const b = baseOf(food).builder;
  // portal: the header may create a containing block for position:fixed (backdrop filter), the sheet must not care
  return createPortal(
    <div className="csheetwrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="csheet" role="dialog" aria-modal="true" aria-label={title} ref={box} tabIndex={-1}>
        <header><b>{title}</b><button type="button" className="cclose" onClick={onClose} aria-label="Close">✕</button></header>
        <div className="cbody">
          {a && <section className="bgrp"><h4>{a.ask}</h4><Chips row={a} cur={food} onPick={onPick} wrap /></section>}
          {v && <section className="bgrp"><h4>{v.ask}</h4><Chips row={v} cur={food} onPick={onPick} small wrap /></section>}
          {full && baseOf(food).addins && <section className="bgrp"><h4>Added</h4><AddIns food={food} onPick={onPick} /></section>}
          {b && <BuilderParts food={food} onPick={onPick} noPresets={!!a && !baseOf(food).choose && b.presets.length > 0} />}
        </div>
        <footer><span className="ccap">{food.name} · {caption(food)}</span><button type="button" className="cdone" data-autofocus onClick={onClose}>Done</button></footer>
      </div>
    </div>, document.body);
}

/** Under the search for one food. `asking`: the text named several foods; the row stays highlighted until a pick. */
export function ChoiceBar({ part, asking, onPick }: { part: Part; asking: boolean; onPick: (f: Food) => void }) {
  const [sheet, setSheet] = useState(false);
  const f = part.food, base = baseOf(f);
  const a = choiceRow(f), v = variantRow(f);
  const hasBuilder = !!base.builder && base.builder.groups.some((g) => !g.one || g.opts.length > 1);
  if (!a && !v && !base.addins && !hasBuilder) return null;
  const extras = base.builder ? selOf(f).filter((k) => base.builder!.groups.some((g) => !g.one && g.opts.some((o) => o.k === k))).length : 0;
  const cur = a?.opts.find((o) => o.on)?.chip;
  return (
    <div className={`choices ${asking && a ? 'asking' : ''}`}>
      {a && (
        <div className="crow">
          <span className="cask" id="cask">{a.ask}{asking && cur ? <em> We started with {cur.toLowerCase()}: pick yours.</em> : null}</span>
          <Chips row={a} cur={f} onPick={onPick} />
        </div>
      )}
      {(v || base.addins || hasBuilder) && (
        <div className="crow2">
          {v && <Chips row={v} cur={f} onPick={onPick} small />}
          <AddIns food={f} onPick={onPick} />
          {hasBuilder && (
            <button type="button" className="cbuild" aria-haspopup="dialog" onClick={() => setSheet(true)}>
              {base.builder!.title}{extras ? <b>{extras}</b> : null}<span aria-hidden="true"> ▾</span>
            </button>
          )}
        </div>
      )}
      <p className="ccap">{caption(f)}</p>
      {sheet && <ChoiceSheet food={f} title={base.builder!.title} onPick={onPick} onClose={() => setSheet(false)} />}
    </div>
  );
}
