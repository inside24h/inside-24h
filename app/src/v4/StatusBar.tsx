// Four traffic lights over the 3D body: how each part of you is doing right now, in colour and one sentence.
// Below the steps: the same colours across all 24 h, so you see at a glance when the stress comes and goes.
// Tapping a light jumps the body and the clock to that system's hardest moment of the day.
import { useMemo } from 'react';
import { uFromMinutes, minutesFromU } from '../time';
import type { Level, System } from './status';
import { worstMoment } from './status';

const ICON: Record<System['key'], string> = { energy: '⚡', heart: '❤', water: '💧', brain: '🧠' };
const WORD: Record<Level, string> = { 0: 'Good', 1: 'Mild stress', 2: 'Overload' };
const lvlAt = (s: System, m: number) => s.levels[Math.max(0, Math.min(1440, Math.round(m)))] as Level;

export interface WeatherChip { city: string; range: string; month: string; extra: number; onChange: () => void }

export function StatusLights({ systems, minute, onJump, onRules, weather }: {
  systems: System[]; minute: number; onJump: (minute: number, organ: string) => void; onRules: () => void; weather?: WeatherChip;
}) {
  return (
    <div className="lights" aria-label="How your body is doing now">
      {weather && (
        <button className="weather" onClick={weather.onChange} title="Change city">
          <span>📍 <b>{weather.city}</b> · typical {weather.month} day {weather.range}</span>
          <em>{weather.extra >= 100 ? `Heat today: drink about ${weather.extra} ml more than on a mild day` : 'No extra water needed for the weather'}</em>
        </button>
      )}
      {systems.map((s) => {
        const l = lvlAt(s, minute);
        const peak = worstMoment(s);
        const worstLvl = s.levels[peak] as Level;
        return (
          <button key={s.key} className={`light l${l} ${s.unknown ? 'unknown' : ''}`} onClick={() => onJump(peak, s.organ)}
            title={worstLvl > 0 ? 'Show the hardest moment for this part of you' : 'Show this part of your body'}>
            <span className="li" aria-hidden="true">{ICON[s.key]}</span>
            <span className="lt"><b>{s.label}</b><em>{s.unknown ? 'Not measured' : WORD[l]}</em></span>
            <span className="ls">{s.says(l, minute)}</span>
          </button>
        );
      })}
      <button className="link lrules" onClick={onRules}>How are the colours decided?</button>
    </div>
  );
}

const SEG = 240;
const TICKS = [0, 60, 180, 360, 720, 1440];
export function StatusStrips({ systems, minute, onSeek, clock }: { systems: System[]; minute: number; onSeek: (minute: number) => void; clock: (m: number) => string }) {
  // Compress each 24 h line to SEG cells on the same (log-ish) time axis as the steps, keeping the WORST level in each cell.
  const cells = useMemo(() => systems.map((s) => Array.from({ length: SEG }, (_, i) => {
    const a = Math.floor(minutesFromU(i / SEG)), b = Math.max(a, Math.ceil(minutesFromU((i + 1) / SEG)));
    let w = 0; for (let m = a; m <= Math.min(1440, b); m++) w = Math.max(w, s.levels[m]);
    return w as Level;
  })), [systems]);
  return (
    <div className="strips" onClick={(e) => {
      const r = e.currentTarget.getBoundingClientRect();
      onSeek(minutesFromU(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))));
    }}>
      {systems.map((s, k) => (
        <div key={s.key} className="strip" aria-label={`${s.label} over 24 hours`}>
          <span className="sl" aria-hidden="true">{ICON[s.key]}</span>
          <svg viewBox={`0 0 ${SEG} 1`} preserveAspectRatio="none">
            {cells[k].map((l, i) => <rect key={i} x={i} width={1.05} y={0} height={1} className={`c${l}`} />)}
          </svg>
        </div>
      ))}
      <div className="sticks" aria-hidden="true">{TICKS.map((m) => <span key={m} style={{ left: `${uFromMinutes(m) * 100}%` }}>{clock(m)}</span>)}</div>
      <i className="playhead" style={{ left: `calc(1.6rem + (100% - 1.6rem) * ${uFromMinutes(minute)})` }} />
    </div>
  );
}
