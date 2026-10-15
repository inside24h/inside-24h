// The calm default view: under the body, one big sentence about what is happening now, the clock, play and a
// single slider, plus four coloured lights. Everything else lives behind "Full".
// Phones: the slider gets its own full-width row (≥ 44 px to touch), play + amount + time share the next one, and
// each light is a button that explains itself ("Brain · overload" → what it means now + one thing to do).
import { useState } from 'react';
import { MAX_MIN, minutesFromU } from '../time';
import type { Level, System } from './status';
import { TIPS } from '../content/tips';

const DOT = ['#3ddc84', '#ffc83d', '#ff5a5a'];
const SHORT: Record<System['key'], string> = { energy: 'Sugar', heart: 'Heart', water: 'Water', brain: 'Brain' };
const WORD = ['fine', 'mild stress', 'overload'];

export function CalmBar({ title, text, clock, since, playing, onPlay, u, setU, systems, minute, where, onMore, eatenAt, setEatenAt, noun, portion, onPortion, onRules }: {
  title: string; text: string; clock: string; since: string; playing: boolean; onPlay: () => void;
  u: number; setU: (v: number) => void; systems: System[]; minute: number; where?: string; onMore: () => void;
  eatenAt: number; setEatenAt: (min: number) => void; noun: string;
  portion: number; onPortion: (f: number) => void;
  /** opens "How the colours work" */ onRules?: () => void;
}) {
  const hhmm = `${String(Math.floor(eatenAt / 60)).padStart(2, '0')}:${String(eatenAt % 60).padStart(2, '0')}`;
  const m = Math.round(Math.min(MAX_MIN, minute));
  const [open, setOpen] = useState<System['key'] | null>(null);
  const sys = open ? systems.find((s) => s.key === open) : undefined;
  const lvl = sys ? (sys.levels[m] as Level) : 0;
  const tipKey = sys && !sys.unknown && sys.tip ? sys.tip(lvl, m) : null;
  return (
    <div className="calmbar">
      <div className="calmtext" aria-live="polite">
        <div className="calmclock"><b>{clock}</b><span>{since}</span></div>
        <h2>{title}</h2>
        <p>{text}</p>
        {where && <div className="calmwhere">Right now: <b>{where}</b></div>}
      </div>
      <div className="calmctl">
        <button className="play" onClick={onPlay} aria-label={playing ? 'Pause' : 'Play the day'}>{playing ? '❚❚' : '▶'}</button>
        <div className="calmtrack">
          <input type="range" min={0} max={1000} value={Math.round(u * 1000)} aria-label="Time after eating" style={{ ['--p' as string]: `${u * 100}%` }}
            aria-valuetext={since} onChange={(e) => setU(+e.target.value / 1000)} />
        </div>
        <span className="calmend">{Math.round(minutesFromU(1) / 60)} h</span>
        <span className="portion" role="group" aria-label="How much"><span className="plabel">How much?</span>{[0.5, 1, 2, 3].map((f) => <button key={f} aria-pressed={portion === f} onClick={() => onPortion(f)}>{f === 0.5 ? '½' : f}×</button>)}</span>
        <label className="eatenat" title={`When you had the ${noun}`}><span className="plabel">Had it at</span><span className="sr">When you had it</span><input type="time" value={hhmm} onChange={(e) => { const [h, mm] = e.target.value.split(':').map(Number); if (!Number.isNaN(h)) setEatenAt(h * 60 + (mm || 0)); }} /></label>
      </div>
      <div className="calmdots" role="group" aria-label="How your body is doing now: tap one to see why">
        {systems.map((s) => {
          const l = s.levels[m] as 0 | 1 | 2;
          return (
            <button key={s.key} className={`calmlight ${open === s.key ? 'on' : ''} ${!s.unknown && l > 0 ? 'warn' : ''}`} aria-expanded={open === s.key}
              onClick={() => setOpen(open === s.key ? null : s.key)} title={s.says(l, m)}>
              <i style={{ background: s.unknown ? '#8292a7' : DOT[l] }} />{SHORT[s.key]} <em>{s.unknown ? 'not measured' : WORD[l]}</em>
              <span className="why" aria-hidden="true">?</span>
            </button>
          );
        })}
        <button className="link fullview" onClick={onMore}>Full view →</button>
      </div>
      {sys && (
        <div className="calmexplain" role="region" aria-label={`${sys.label}: why`}>
          <b><i style={{ background: sys.unknown ? '#8292a7' : DOT[lvl] }} />{sys.label}: {sys.unknown ? 'not measured' : WORD[lvl]}</b>
          <p>{sys.says(lvl, m)}</p>
          {tipKey && lvl > 0 && <p className="calmtip"><span aria-hidden="true">→ </span>{TIPS[tipKey].text}</p>}
          <div className="calmexplainbtns">
            {onRules && <button className="link" onClick={onRules}>How the colours are decided</button>}
            <button className="link" onClick={() => setOpen(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
