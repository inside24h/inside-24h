// The calm default view: under the body, one big sentence about what is happening now, the clock, play and a
// single slider, plus four coloured dots. Everything else lives behind "Full".
import { MAX_MIN, minutesFromU } from '../time';
import type { System } from './status';

const DOT = ['#3ddc84', '#ffc83d', '#ff5a5a'];
const SHORT: Record<System['key'], string> = { energy: 'Sugar', heart: 'Heart', water: 'Water', brain: 'Brain' };
const WORD = ['fine', 'mild stress', 'overload'];

export function CalmBar({ title, text, clock, since, playing, onPlay, u, setU, systems, minute, where, onMore, eatenAt, setEatenAt, noun, portion, onPortion }: {
  title: string; text: string; clock: string; since: string; playing: boolean; onPlay: () => void;
  u: number; setU: (v: number) => void; systems: System[]; minute: number; where?: string; onMore: () => void;
  eatenAt: number; setEatenAt: (min: number) => void; noun: string;
  portion: number; onPortion: (f: number) => void;
}) {
  const hhmm = `${String(Math.floor(eatenAt / 60)).padStart(2, '0')}:${String(eatenAt % 60).padStart(2, '0')}`;
  const m = Math.round(Math.min(MAX_MIN, minute));
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
        <input type="range" min={0} max={1000} value={Math.round(u * 1000)} aria-label="Time after eating"
          aria-valuetext={since} onChange={(e) => setU(+e.target.value / 1000)} />
        <span className="calmend">{Math.round(minutesFromU(1) / 60)} h</span>
        <label className="eatenat" title={`When you had the ${noun}`}>Had it at <input type="time" value={hhmm} onChange={(e) => { const [h, mm] = e.target.value.split(':').map(Number); if (!Number.isNaN(h)) setEatenAt(h * 60 + (mm || 0)); }} /></label>
      </div>
      <div className="calmdots">
        <span className="portion" role="group" aria-label="How much">How much?{[0.5, 1, 2, 3].map((f) => <button key={f} aria-pressed={portion === f} onClick={() => onPortion(f)}>{f === 0.5 ? '½' : f}×</button>)}</span>
        {systems.map((s) => {
          const l = s.levels[m] as 0 | 1 | 2;
          return <span key={s.key} title={s.says(l, m)}><i style={{ background: s.unknown ? '#8292a7' : DOT[l] }} />{SHORT[s.key]} <em>{s.unknown ? 'not measured' : WORD[l]}</em></span>;
        })}
        <button className="link" onClick={onMore}>Full view →</button>
      </div>
    </div>
  );
}
