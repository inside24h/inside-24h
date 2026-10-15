// Compare two foods side by side for the same person — full screen, both sides chosen freely, popular pairs in
// one tap. Shows both sugar curves on one chart, the day's traffic lights and the quick answers.
import { useEffect, useMemo, useState } from 'react';
import type { Profile } from '../science/profile';
import { analyze, verdictOf, type Analysis } from './analyze';
import { SmartSearch } from './SmartSearch';
import { parseMeal, type Part } from './food/parse';
import { worstMoment } from './status';

const DOT = ['#3ddc84', '#ffc83d', '#ff5a5a'];
const WORD = ['fine all day', 'mild stress', 'overload'];
const SHORT = { energy: 'Sugar', heart: 'Heart', water: 'Water', brain: 'Brain' } as const;
const LINE = ['#ffc83d', '#5cd3ff'];

// everyday questions people actually argue about
export const PAIRS: [string, string][] = [
  ['1 can of cola', 'glass of water'], ['1 can of cola', 'diet cola'], ['orange juice', '1 orange'],
  ['beer', 'glass of red wine'], ['doughnut', '1 apple'], ['white bread', 'rye bread'],
  ['espresso', 'energy drink'], ['cornflakes', 'oatmeal'], ['potato chips', 'almonds'],
  ['milk chocolate', 'dark chocolate'], ['white rice', 'lentils'], ['coffee with milk', 'cappuccino'],
];

function Column({ a, k }: { a: Analysis; k: number }) {
  return (
    <div className="cmpcol">
      <div className="cmph"><i style={{ background: a.color }} /><b>{a.name}</b><span className="cmpline" style={{ background: LINE[k] }} /></div>
      <div className="cmpkcal">{Math.round(a.kcal)} kcal · sugar {a.sugarPeak === null ? 'not measured' : a.sugarPeak < 0.3 ? 'steady' : `+${a.sugarPeak.toFixed(1)} mmol/L`}</div>
      <div className="cmpdots">
        {a.systems.map((s) => { const l = s.levels[worstMoment(s)] as 0 | 1 | 2; return <span key={s.key}><i style={{ background: s.unknown ? '#8292a7' : DOT[l] }} />{SHORT[s.key]} <em>{s.unknown ? 'not measured' : WORD[l]}</em></span>; })}
      </div>
      <div className="answers">
        {a.answers.map((x) => <div key={x.q} className="ans" style={{ ['--t' as string]: DOT[x.tone] }}><span className="ai">{x.icon}</span><span><b>{x.q}</b><em>{x.a}</em></span></div>)}
      </div>
    </div>
  );
}

function SugarChart({ a, b }: { a: Analysis; b: Analysis }) {
  const W = 900, H = 170, T = 240; // first 4 hours
  const lines = [a, b].map((x) => x.glucose ? Array.from({ length: T + 1 }, (_, m) => x.glucose![m] / 18.016) : x.sugarPeak === 0 ? new Array(T + 1).fill(0) : null);
  const vals = lines.flatMap((l) => l ?? [0]);
  const hi = Math.max(1, ...vals), lo = Math.min(-0.3, ...vals);
  const Y = (v: number) => H - 20 - ((v - lo) / (hi - lo)) * (H - 34);
  const path = (l: number[]) => l.map((v, m) => `${m ? 'L' : 'M'}${((m / T) * W).toFixed(1)},${Y(v).toFixed(1)}`).join('');
  return (
    <div className="cmpchart">
      <div className="ctl">Blood sugar in the first 4 hours (change from your normal)</div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <line x1={0} x2={W} y1={Y(0)} y2={Y(0)} className="zero" />
        {[60, 120, 180].map((m) => <text key={m} x={(m / T) * W} y={H - 3} className="tick">{m / 60} h</text>)}
        {lines.map((l, i) => l && <path key={i} d={path(l)} className="ln" style={{ stroke: LINE[i] }} />)}
      </svg>
      {lines.some((l) => !l) && <div className="note">A food without a measured glycaemic index has no curve.</div>}
    </div>
  );
}

export function Compare({ current, profile, initial, onClose, onVideo, short, setShort, onRight }: {
  current: Part[]; profile: Profile; initial?: Part[]; onClose: () => void; onVideo?: (a: Analysis, b: Analysis) => void; short?: boolean; setShort?: (v: boolean) => void;
  onRight?: (right: Part[] | null) => void; // the partner goes into the link (#vs=…)
}) {
  const [left, setLeft] = useState<Part[]>(current);
  const [right, setRight] = useState<Part[] | null>(initial?.length ? initial : null); // an unknown partner = none yet
  useEffect(() => { onRight?.(right); }, [right]); // eslint-disable-line react-hooks/exhaustive-deps
  const a = useMemo(() => analyze(left, profile), [left, profile]);
  const b = useMemo(() => (right?.length ? analyze(right, profile) : null), [right, profile]);
  const pick = ([l, r]: [string, string]) => { const pl = parseMeal(l), pr = parseMeal(r); if (pl.length) setLeft(pl); if (pr.length) setRight(pr); };
  return (
    <div className="cmpfull" role="dialog" aria-label="Compare two foods">
      <div className="cmpbar">
        <div className="cmptitle"><b>Compare</b><span>for your body, your city and your time of day</span>
          <button className="x" aria-label="Close" onClick={onClose}>×</button></div>
        <div className="cmppick">
          <div className="side"><span className="lbl" style={{ color: LINE[0] }}>Left</span><SmartSearch onPick={(p) => { if (p.length) setLeft(p); }} current={a.name} /></div>
          <div className="vs">VS</div>
          <div className="side"><span className="lbl" style={{ color: LINE[1] }}>Right</span><SmartSearch onPick={(p) => { if (p.length) setRight(p); }} current={b?.name ?? 'choose…'} /></div>
        </div>
        <div className="pairs">{PAIRS.map((p) => <button key={p.join()} onClick={() => pick(p)}>{p[0].replace(/^(1 can of |glass of |1 )/, '')} <em>vs</em> {p[1].replace(/^(1 can of |glass of |1 )/, '')}</button>)}</div>
      </div>
      <div className="cmpbody">
        {b ? (<>
          <div className="cmpactions">{onVideo && <>
            {setShort && <span className="lenpick">Length: <button aria-pressed={!short} onClick={() => setShort(false)}>about 1 min</button><button aria-pressed={!!short} onClick={() => setShort(true)}>about 20 s</button></span>}
            <button className="primary" onClick={() => onVideo(a, b)}>🎬 Make this a Reel (9:16)</button></>}</div>
          <div className="cmpverdict">{verdictOf(a, b)}</div>
          <SugarChart a={a} b={b} />
          <div className="cmpcols"><Column a={a} k={0} /><Column a={b} k={1} /></div>
        </>) : <p className="note big">Choose the right side, or tap one of the popular pairs above.</p>}
      </div>
    </div>
  );
}
