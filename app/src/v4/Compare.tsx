// Compare two foods side by side for the same person — full screen, both sides chosen freely, popular pairs in
// one tap. Shows both sugar curves on one chart, the day's traffic lights and the quick answers.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useModal } from './a11y';
import type { Profile } from '../science/profile';
import { analyze, sugarPeakText, verdictOf, type Analysis } from './analyze';
import { SmartSearch } from './SmartSearch';
import { parseMeal, type Part } from './food/parse';
import { worstMoment } from './status';
import { PLATFORM_LABEL, PLATFORM_LENGTH, PLATFORMS, type Platform } from './video-caption';

const DOT = ['#3ddc84', '#ffc83d', '#ff5a5a'];
const WORD = ['fine all day', 'mild stress', 'high stress'];
const SHORT = { energy: 'Blood sugar', heart: 'Heart', water: 'Water', brain: 'Brain' } as const; // never "Sugar" alone (status.ts SHORT_LABEL)
const LINE = ['#ffc83d', '#5cd3ff'];

// everyday questions people actually argue about
export const PAIRS: [string, string][] = [
  // (round 5: the same amount of water as the can, so the race out of the stomach is fair)
  ['1 can of cola', '330 ml of water'], ['1 can of cola', 'diet cola'], ['orange juice', '1 orange'],
  ['beer', 'glass of red wine'], ['doughnut', '1 apple'], ['white bread', 'rye bread'],
  ['espresso', 'energy drink'], ['cornflakes', 'oatmeal'], ['potato chips', 'almonds'],
  ['milk chocolate', 'dark chocolate'], ['white rice', 'lentils'], ['coffee with milk', 'cappuccino'],
];

function Column({ a, k, unit }: { a: Analysis; k: number; unit: Profile['glucoseUnit'] }) {
  return (
    <div className="cmpcol">
      <div className="cmph"><i aria-hidden="true" style={{ background: a.color }} /><b>{a.label}</b><span className="cmpline" aria-hidden="true" style={{ background: LINE[k] }} /></div>
      <div className="cmpkcal">{Math.round(a.kcal)} kcal · blood sugar {sugarPeakText(a.sugarPeak, unit)}</div>
      <div className="cmpdots">
        {a.systems.map((s) => { const l = s.levels[worstMoment(s)] as 0 | 1 | 2; return <span key={s.key}><i aria-hidden="true" style={{ background: s.unknown ? '#8292a7' : DOT[l] }} />{SHORT[s.key]} <em>{s.unknown ? 'not measured' : WORD[l]}</em></span>; })}
      </div>
      <div className="answers">
        {a.answers.map((x) => <div key={x.q} className="ans" style={{ ['--t' as string]: DOT[x.tone] }}><span className="ai" aria-hidden="true">{x.icon}</span><span><b>{x.q}</b><em>{x.a}</em></span></div>)}
      </div>
    </div>
  );
}

function SugarChart({ a, b, unit }: { a: Analysis; b: Analysis; unit: Profile['glucoseUnit'] }) {
  const W = 900, H = 170, T = 240; // first 4 hours
  const lines = [a, b].map((x) => x.glucose ? Array.from({ length: T + 1 }, (_, m) => x.glucose![m] / 18.016) : x.sugarPeak === 0 ? new Array(T + 1).fill(0) : null);
  const vals = lines.flatMap((l) => l ?? [0]);
  const hi = Math.max(1, ...vals), lo = Math.min(-0.3, ...vals);
  const Y = (v: number) => H - 20 - ((v - lo) / (hi - lo)) * (H - 34);
  const path = (l: number[]) => l.map((v, m) => `${m ? 'L' : 'M'}${((m / T) * W).toFixed(1)},${Y(v).toFixed(1)}`).join('');
  return (
    <div className="cmpchart">
      <div className="ctl">Blood sugar in the first 4 hours (change from your usual level)</div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
        aria-label={'Blood sugar in the first 4 hours. ' + [a, b].map((x) => `${x.name}: ${x.sugarPeak !== null && x.sugarPeak >= 0.3 ? 'peak ' : ''}${sugarPeakText(x.sugarPeak, unit)}`).join('; ')}>
        <line x1={0} x2={W} y1={Y(0)} y2={Y(0)} className="zero" />
        {lines.map((l, i) => l && <path key={i} d={path(l)} className="ln" style={{ stroke: LINE[i] }} />)}
      </svg>
      {/* hour marks as HTML: SVG text inside preserveAspectRatio="none" was squashed on phones (QA 2026-10-23) */}
      <div className="cmpticks" aria-hidden="true">{[60, 120, 180].map((m) => <span key={m} style={{ left: `${(m / T) * 100}%` }}>{m / 60} h</span>)}</div>
      {lines.some((l) => !l) && <div className="note">Foods and drinks without a measured glycemic index get no curve.</div>}
    </div>
  );
}

/** Round 14 (owner): offer "Same amount" only for one item a side, no alcohol, the same kind (drink / food) and typical
 *  servings within 2× (so the same amount is a fair, meaningful comparison). */
export function sameAmountOffer(left: Part[], right: Part[] | null): boolean {
  if (left.length !== 1 || !right || right.length !== 1) return false;
  const x = left[0], y = right[0], alc = (q: Part) => (q.food.p.alcoholG ?? 0) > 0.5;
  if (alc(x) || alc(y) || (x.food.kind === 'liquid') !== (y.food.kind === 'liquid')) return false;
  const r = Math.max(x.grams, y.grams) / Math.max(1, Math.min(x.grams, y.grams));
  return r <= 2 && Math.abs(x.grams - y.grams) > 0.05 * Math.max(x.grams, y.grams);
}
/** The right item at the left item's amount ("250 ml of cola"), or null. */
export function sameAs(l: Part, r: Part): Part[] | null {
  const unit = r.food.kind === 'liquid' ? 'ml' : 'g';
  // (the left side's own amount as it says it, "250 ml", else its grams)
  const said = (unit === 'ml' ? /(\d+(?:\.\d+)?)\s*ml\b/ : /(\d+(?:\.\d+)?)\s*g\b/).exec(l.amountLabel)?.[1];
  const ps = parseMeal(`${said ?? Math.round(l.grams)} ${unit} of ${r.food.name.replace(/\s*\([^)]*\)/g, '')}`);
  return ps.length === 1 && ps[0].food.id === r.food.id ? ps : null;
}

export function Compare({ current, profile, initial, onClose, onVideo, short, setShort, platform, setPlatform, onRight, overMin = 0 }: {
  current: Part[]; profile: Profile; initial?: Part[]; onClose: () => void; onVideo?: (a: Analysis, b: Analysis) => void; short?: boolean; setShort?: (v: boolean) => void;
  /** round 11: the platform (it picks the cut), as in the share dialog */ platform?: Platform; setPlatform?: (p: Platform) => void;
  onRight?: (right: Part[] | null) => void; // the partner goes into the link (#vs=…)
  /** "Over how long?" of the item on screen (minutes; 2026-10-19): kept while the left side is that item */ overMin?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  useModal(box, true, onClose);
  const [left, setLeft] = useState<Part[]>(current);
  const [right, setRight] = useState<Part[] | null>(initial?.length ? initial : null); // an unknown partner = none yet
  useEffect(() => { onRight?.(right); }, [right]); // eslint-disable-line react-hooks/exhaustive-deps
  const a = useMemo(() => analyze(left, profile, left === current ? overMin : 0), [left, profile, current, overMin]);
  // round 14 (owner): "Same amount" where it makes sense: one item a side, both without alcohol, the same kind (two
  // drinks, or two foods), and typical servings within 2× of each other (cola vs juice yes; espresso vs cola, wine vs
  // beer no). The right side then gets the left side's amount; the video says "Same amount: 250 ml each."
  const [same, setSame] = useState(false);
  const offerSame = sameAmountOffer(left, right);
  const rightUsed = useMemo(() => (same && offerSame && right ? sameAs(left[0], right[0]) ?? right : right), [same, offerSame, left, right]);
  const b = useMemo(() => (rightUsed?.length ? analyze(rightUsed, profile) : null), [rightUsed, profile]);
  const pick = ([l, r]: [string, string]) => { const pl = parseMeal(l), pr = parseMeal(r); if (pl.length) setLeft(pl); if (pr.length) setRight(pr); };
  return (
    <div className="cmpfull" role="dialog" aria-modal="true" aria-label="Compare two foods" ref={box}>
      <div className="cmpbar">
        <div className="cmptitle"><b>Compare</b><span>for your body, your city and your time of day</span>
          <button className="x" aria-label="Close" onClick={onClose}>×</button></div>
        <div className="cmppick">
          <div className="side"><span className="lbl" style={{ color: LINE[0] }}>Left</span><SmartSearch onPick={(p) => { if (p.length) setLeft(p); }} current={a.name} /></div>
          <div className="vs">VS</div>
          <div className="side"><span className="lbl" style={{ color: LINE[1] }}>Right</span><SmartSearch onPick={(p) => { if (p.length) setRight(p); }} current={b?.name ?? 'Choose…'} /></div>
        </div>
        <div className="pairs">{PAIRS.map((p) => <button key={p.join()} onClick={() => pick(p)} aria-label={`${p[0].replace(/^(1 can of |glass of |1 )/, '')} versus ${p[1].replace(/^(1 can of |glass of |1 )/, '')}`}>{p[0].replace(/^(1 can of |glass of |1 )/, '')} <em>vs</em> {p[1].replace(/^(1 can of |glass of |1 )/, '')}</button>)}</div>
      </div>
      <div className="cmpbody">
        {b ? (<>
          <div className="cmpactions">{onVideo && <>
            {setPlatform ? <span className="lenpick platpick">For: {PLATFORMS.filter((p) => p !== 'facebook').map((p) => <button key={p} aria-pressed={platform === p} onClick={() => setPlatform(p)}>{PLATFORM_LABEL[p]} · {PLATFORM_LENGTH[p]}</button>)}</span>
            : setShort && <span className="lenpick">Length: <button aria-pressed={!short} onClick={() => setShort(false)}>over 1&nbsp;min</button><button aria-pressed={!!short} onClick={() => setShort(true)}>under 30&nbsp;s</button></span>}
            <button className="primary" onClick={() => onVideo(a, b)}><span aria-hidden="true">🎬 </span>Make this a Reel (9:16)</button></>}</div>
          {offerSame && <div className="lenpick" role="group" aria-label="Amounts">Amounts:
            <button aria-pressed={!same} onClick={() => setSame(false)}>A typical serving each</button>
            <button aria-pressed={same} onClick={() => setSame(true)}>Same amount</button></div>}
          <div className="cmpverdict">{verdictOf(a, b, profile.glucoseUnit)}</div>
          <SugarChart a={a} b={b} unit={profile.glucoseUnit} />
          <div className="cmpcols"><Column a={a} k={0} unit={profile.glucoseUnit} /><Column a={b} k={1} unit={profile.glucoseUnit} /></div>
        </>) : <p className="note big">Choose something for the right side, or tap one of the popular pairs above.</p>}
      </div>
    </div>
  );
}
