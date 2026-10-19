// The calm default view: under the body, one big sentence about what is happening now, the clock, play and a
// single slider, plus four coloured lights. Everything else lives behind "Full".
// Phones: the slider gets its own full-width row (≥ 44 px to touch), play + amount + time share the next one, and
// each light is a button that explains itself ("Brain · high stress" → what it means now + one thing to do).
import { useEffect, useState } from 'react';
import { MAX_MIN, minutesFromU } from '../time';
import { SHORT_LABEL, type Level, type System } from './status';
import { TIPS } from '../content/tips';

const DOT = ['#3ddc84', '#ffc83d', '#ff5a5a'];
const SHORT: Record<System['key'], string> = SHORT_LABEL; // "Blood sugar", not "Sugar" (sense audit 2026-10-18)
const WORD = ['fine', 'mild stress', 'high stress'];
const PORTIONS = [0.5, 1, 2, 3].map((f) => ({ k: String(f), label: `${f === 0.5 ? '½' : f}×`, mult: f, aria: `${f === 0.5 ? 'Half' : f === 1 ? 'One' : f === 2 ? 'Two' : 'Three'} ${f === 1 ? 'serving' : f === 0.5 ? 'a serving' : 'servings'}` }));

export function CalmBar({ title, text, clock, since, playing, onPlay, u, setU, systems, minute, where, onMore, eatenAt, setEatenAt, noun, portion, onPortion, onRules, sizes }: {
  title: string; text: string; clock: string; since: string; playing: boolean; onPlay: () => void;
  u: number; setU: (v: number) => void; systems: System[]; minute: number; where?: string; onMore: () => void;
  eatenAt: number; setEatenAt: (min: number) => void; noun: string;
  portion: number; onPortion: (f: number) => void;
  /** named sizes of this food (Slice · Half · Whole, 0.3 · 0.33 · 0.5 l); else ½ · 1 · 2 · 3× */ sizes?: { k: string; label: string; mult: number }[] | null;
  /** opens "How the colours work" */ onRules?: () => void;
}) {
  const [open, setOpen] = useState<System['key'] | null>(null);
  // Esc closes the explanation and returns focus to the light that opened it
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(null); document.getElementById(`calmlight-${open}`)?.focus(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const hhmm = `${String(Math.floor(eatenAt / 60)).padStart(2, '0')}:${String(eatenAt % 60).padStart(2, '0')}`;
  const m = Math.round(Math.min(MAX_MIN, minute));
  const sys = open ? systems.find((s) => s.key === open) : undefined;
  const lvl = sys ? (sys.levels[m] as Level) : 0;
  const tipKey = sys && !sys.unknown && sys.tip ? sys.tip(lvl, m) : null;
  return (
    <div className="calmbar">
      <div className="calmtext">
        <div className="calmclock"><b>{clock}</b><span>{since}</span></div>
        <h2>{title}</h2>
        <p>{text}</p>
        {/* screen readers hear each new step once, not every tick of the clock */}
        <p className="sr" aria-live="polite">{title}. {text}</p>
        {where && <div className="calmwhere">Right now: <b>{where}</b></div>}
      </div>
      <div className="calmctl">
        <button className="play" onClick={onPlay} aria-label={playing ? 'Pause' : 'Play the day'}>{playing ? '❚❚' : '▶'}</button>
        <div className="calmtrack">
          <input type="range" min={0} max={1000} value={Math.round(u * 1000)} aria-label="Time since you had it" style={{ ['--p' as string]: `${u * 100}%` }}
            aria-valuetext={since} onChange={(e) => setU(+e.target.value / 1000)} />
        </div>
        <span className="calmend" aria-hidden="true">{Math.round(minutesFromU(1) / 60)} h</span>
        <span className="portion" role="group" aria-label="How much"><span className="plabel" aria-hidden="true">How much?</span>{(sizes ?? PORTIONS).map((z) => <button key={z.k} className={sizes ? 'named' : undefined} aria-pressed={Math.abs(portion - z.mult) < 1e-6} aria-label={'aria' in z ? (z as { aria: string }).aria : z.label} onClick={() => onPortion(z.mult)}>{z.label}</button>)}</span>
        <label className="eatenat" title={`When you had the ${noun}`}><span className="plabel">Had it at</span><input type="time" value={hhmm} onChange={(e) => { const [h, mm] = e.target.value.split(':').map(Number); if (!Number.isNaN(h)) setEatenAt(h * 60 + (mm || 0)); }} /></label>
      </div>
      <div className="calmdots" role="group" aria-label="How your body is doing now: tap one to see why">
        {systems.map((s) => {
          const l = s.levels[m] as 0 | 1 | 2;
          return (
            <button key={s.key} id={`calmlight-${s.key}`} aria-controls="calmexplain" className={`calmlight ${open === s.key ? 'on' : ''} ${!s.unknown && l > 0 ? 'warn' : ''}`} aria-expanded={open === s.key}
              onClick={() => setOpen(open === s.key ? null : s.key)} title={s.says(l, m)}>
              <i aria-hidden="true" style={{ background: s.unknown ? '#8292a7' : DOT[l] }} />{SHORT[s.key]} <em>{s.unknown ? 'not measured' : WORD[l]}</em>
              <span className="why" aria-hidden="true">?</span>
            </button>
          );
        })}
        <button className="link fullview" onClick={onMore}>Full view<span aria-hidden="true"> →</span></button>
      </div>
      {sys && (
        <div id="calmexplain" className="calmexplain" role="region" aria-label={`${sys.label}: why`}>
          <b><i aria-hidden="true" style={{ background: sys.unknown ? '#8292a7' : DOT[lvl] }} />{sys.label}: {sys.unknown ? 'not measured' : WORD[lvl]}</b>
          <p>{sys.says(lvl, m)}</p>
          {tipKey && lvl > 0 && <p className="calmtip"><span aria-hidden="true">→ </span>{TIPS[tipKey].text}</p>}
          <div className="calmexplainbtns">
            {onRules && <button className="link" onClick={onRules}>How the colors work</button>}
            <button className="link" onClick={() => setOpen(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
