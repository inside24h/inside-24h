// Audit C11 (2026-11-12): the body without WebGL. When the browser has no 3D (some in-app browsers, old or locked-down
// phones), the 3D chunk fails to load, or the GPU drops the WebGL context, the stage shows this flat body instead
// of an error: the same organs, filled with the same numbers (story.liquid = what the 3D body is tinted with, and
// the liquid route's segments = the 3D labels), so the answer is still there. No three.js: it is in the main chunk.
// Tapping an organ selects it exactly like tapping it in 3D (the organ card opens).
import type { ReactNode } from 'react';
import type { LiquidMap } from './stories';
import { SEG_LABEL, type SegId, type SegState } from '../scene/segments';
import './body2d.css';

export type NoGlReason = 'nogl' | 'lost' | 'error';

/** Organ outlines on a 240 × 440 front view (the person faces you: their left is on the right). Stroked paths are
 *  tubes; closed shapes can hold a level (`fill` in story.liquid: stomach, bladder). */
type Shape = { id: string; name: string; color: string; d: string; tube?: number };
const SHAPES: Shape[] = [
  { id: 'brain', name: 'Brain', color: '#b9cdfa', d: 'M120 20c-20 0-32 12-32 28 0 10 6 17 14 19h36c8-2 14-9 14-19 0-16-12-28-32-28z' },
  { id: 'lung_r', name: 'Lungs', color: '#7fb5d6', d: 'M100 132c-14 2-26 22-28 52-1 14 2 26 8 30 8 4 18-2 22-12 4-14 4-46 4-62 0-6-2-8-6-8z' },
  { id: 'lung_l', name: 'Lungs', color: '#7fb5d6', d: 'M140 132c14 2 26 22 28 52 1 14-2 26-8 30-8 4-18-2-22-12-4-14-4-46-4-62 0-6 2-8 6-8z' },
  { id: 'esophagus', name: 'Food pipe', color: '#ffb4a0', d: 'M120 96 C121 130 123 170 128 206', tube: 6 },
  { id: 'aorta', name: 'Aorta', color: '#ff4d5e', d: 'M128 172 C128 150 112 150 114 170 L116 330', tube: 4 },
  { id: 'vena_cava', name: 'Vena cava', color: '#5a78ff', d: 'M108 168 L106 330', tube: 4 },
  { id: 'heart', name: 'Heart', color: '#ff5a6a', d: 'M118 168c8-10 30-8 32 8 2 16-14 28-26 32-8-6-14-14-14-24 0-6 2-12 8-16z' },
  { id: 'liver', name: 'Liver', color: '#d05a74', d: 'M74 214c14-10 50-12 70-6 6 2 6 8 0 12-14 10-34 22-56 30-12 4-20-4-20-16 0-8 2-16 6-20z' },
  { id: 'gallbladder', name: 'Gallbladder', color: '#7fdc8f', d: 'M98 244a6 6 0 1 0 12 0a6 6 0 1 0-12 0z' },
  { id: 'stomach', name: 'Stomach', color: '#ff9e6b', d: 'M130 208c6-6 16-4 20 2 8 2 18 10 18 24 0 18-12 32-30 34-10 1-16-4-16-10 0-6 6-8 12-10 8-4 10-12 6-20-4-8-12-12-10-20z' },
  { id: 'pancreas', name: 'Pancreas', color: '#ffd27a', d: 'M110 262c14-4 34-6 52-10 4 0 6 4 2 6-16 8-36 12-52 12-6 0-8-6-2-8z' },
  { id: 'duodenum', name: 'Duodenum', color: '#f3a6c1', d: 'M130 262 C112 258 104 268 108 278 C112 288 126 288 136 282', tube: 6 },
  { id: 'portal_vein', name: 'Portal vein', color: '#7d95ff', d: 'M122 290 C118 272 110 256 104 238', tube: 3.5 },
  { id: 'kidney_r', name: 'Kidneys', color: '#ffb07a', d: 'M84 262c-8 0-12 10-12 18s4 18 12 18c6 0 8-6 6-12-2-4-2-8 0-12 2-6 0-12-6-12z' },
  { id: 'kidney_l', name: 'Kidneys', color: '#ffb07a', d: 'M156 258c8 0 12 10 12 18s-4 18-12 18c-6 0-8-6-6-12 2-4 2-8 0-12-2-6 0-12 6-12z' },
  { id: 'colon_asc', name: 'Large intestine', color: '#c79cff', d: 'M84 352 L82 300', tube: 9 },
  { id: 'colon_trans', name: 'Large intestine', color: '#c79cff', d: 'M82 300 C100 292 140 292 160 300', tube: 9 },
  { id: 'colon_desc', name: 'Large intestine', color: '#c79cff', d: 'M160 300 L160 356', tube: 9 },
  { id: 'cecum', name: 'Large intestine', color: '#c79cff', d: 'M84 352 C84 362 92 366 96 360', tube: 9 },
  { id: 'rectum', name: 'Large intestine', color: '#c79cff', d: 'M160 356 C158 372 140 372 128 380 L124 398', tube: 8 },
  { id: 'jejunum', name: 'Small intestine', color: '#f3a6c1', d: 'M136 286 C150 290 150 304 136 306 C118 308 104 304 104 316 C104 328 146 322 148 334', tube: 6 },
  { id: 'ileum', name: 'Small intestine', color: '#f3a6c1', d: 'M148 334 C150 346 110 340 106 350 C102 360 128 362 132 354 C134 346 112 346 100 356', tube: 6 },
  { id: 'bladder', name: 'Bladder', color: '#ffe08a', d: 'M104 392c0-8 8-12 16-12s16 4 16 12c0 10-8 18-16 18s-16-8-16-18z' },
];
const LEVEL = new Set(['stomach', 'bladder']);
/** Where each place of the liquid route is drawn (its label points there). */
const SEG_AT: Record<SegId, [number, number]> = {
  swallow: [122, 140], stomach: [150, 236], duodenum: [112, 276], small: [126, 330], portal: [112, 258],
  blood: [134, 186], kidney: [160, 276], bladder: [120, 396], colon: [160, 330],
};
const HEAD = 'M120 8c-20 0-34 16-34 38s14 38 34 38 34-16 34-38-14-38-34-38z';
const SILHOUETTE = 'M108 82v16c-16 4-36 6-46 16-8 8-10 22-12 46l-6 140c0 10 14 10 16 0l8-110c2 20 4 50 6 80-2 30-6 60-4 90l6 60h40l2-50h4l2 50h40l6-60c2-30-2-60-4-90 2-30 4-60 6-80l8 110c2 10 16 10 16 0l-6-140c-2-24-4-38-12-46-10-10-30-12-46-16V82z';

const fmt = (v: number) => (v >= 100 ? Math.round(v).toString() : v >= 10 ? v.toFixed(0) : v.toFixed(1));
const MSG: Record<NoGlReason, string> = {
  nogl: 'Your browser can’t show the 3D body, so here’s a simple 2D view. Everything else works the same.',
  lost: 'Your browser paused the 3D view, so here’s the 2D view for now.',
  error: 'The 3D body couldn’t load, so here’s a simple 2D view. Everything else works the same.',
};

export function Body2D({ reason, details, color, liquid, present, unit, selected, onSelect, action }: {
  reason: NoGlReason; /** technical detail, behind "Details" */ details?: string;
  /** the drink's color and what each organ holds now (story.liquid), empty before anything is chosen */ color: string; liquid: LiquidMap;
  /** places of the liquid route with a real share, most first (as the 3D labels) */ present: [SegId, SegState][]; unit?: string;
  selected: string | null; onSelect: (organ: string | null) => void; /** e.g. a Reload button */ action?: ReactNode;
}) {
  const labels = present.slice(0, 3);
  const ink = visible(color);
  return (
    <div className={`body2d ${present.length || Object.keys(liquid).length ? 'live' : ''}`}>
      <svg viewBox="40 0 160 420" preserveAspectRatio="xMidYMid meet" role="img" aria-label={labels.length ? `2D body. ${labels.map(([id, v]) => `${SEG_LABEL[id]}: ${v.text ?? `${fmt(v.amount)} ${v.unit ?? unit ?? ''}`}`).join('. ')}` : '2D body'}>
        <defs>
          {SHAPES.filter((s) => LEVEL.has(s.id)).map((s) => <clipPath key={s.id} id={`b2clip-${s.id}`}><path d={s.d} /></clipPath>)}
          <filter id="b2glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        <path className="b2skin" d={SILHOUETTE} /><path className="b2skin" d={HEAD} />
        {SHAPES.map((s) => {
          const v = liquid[s.id];
          const k = Math.max(0, Math.min(1, Math.max(v?.tint ?? 0, LEVEL.has(s.id) ? 0 : v?.fill ?? 0)));
          const level = LEVEL.has(s.id) ? Math.max(0, Math.min(1, v?.fill ?? 0)) : 0;
          const on = selected === s.id;
          const pick = () => onSelect(on ? null : s.id);
          return (
            <g key={s.id} className={`b2organ ${on ? 'on' : ''}`} onClick={pick}>
              <title>{s.name}</title>
              {s.tube ? <>
                <path d={s.d} fill="none" stroke={s.color} strokeOpacity={0.45} strokeWidth={s.tube} strokeLinecap="round" />
                {k > 0.02 && <path d={s.d} fill="none" stroke={ink} strokeOpacity={0.25 + 0.75 * k} strokeWidth={s.tube * 0.7} strokeLinecap="round" />}
                <path d={s.d} fill="none" stroke="transparent" strokeWidth={Math.max(14, s.tube + 8)} />
              </> : <>
                <path d={s.d} fill={s.color} fillOpacity={0.12} stroke={s.color} strokeOpacity={0.75} strokeWidth={1.2} />
                {k > 0.02 && <path d={s.d} fill={ink} fillOpacity={0.15 + 0.6 * k} />}
                {level > 0.01 && <rect clipPath={`url(#b2clip-${s.id})`} x={40} width={160} y={levelTop(s.id, level)} height={420} fill={ink} fillOpacity={0.85} />}
              </>}
            </g>
          );
        })}
        {labels.map(([id], i) => {
          const [x, y] = SEG_AT[id];
          return <circle key={id} className={`b2dot ${i === 0 ? 'main' : ''}`} cx={x} cy={y} r={i === 0 ? 5 : 3.5} fill={ink} />;
        })}
      </svg>
      {labels.length > 0 && (
        <ul className="b2labels" aria-hidden="true">
          {labels.map(([id, v], i) => (
            <li key={id} className={i === 0 ? 'main' : ''}><i style={{ background: ink }} />{SEG_LABEL[id]} <b>{v.text ?? `${fmt(v.amount)} ${v.unit ?? unit ?? ''}`}</b></li>
          ))}
        </ul>
      )}
      <div className="b2msg" role="status">
        <span>{MSG[reason]}</span>{action}
        {details && <details><summary>Details</summary><code>{details}</code></details>}
      </div>
    </div>
  );
}

/** The y offset that leaves `level` (0..1) of the organ's height filled from the bottom. */
function levelTop(id: string, level: number) {
  const [top, bottom] = id === 'stomach' ? [204, 268] : [380, 410];
  return bottom - level * (bottom - top);
}

/** A dark drink (cola, coffee) is lightened so its fill still shows on the dark stage; light drinks stay as they are. */
function visible(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16), rgb = [n >> 16, (n >> 8) & 255, n & 255];
  const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  if (lum >= 0.35) return hex;
  const k = 0.55 - lum; // how much white to mix in
  return `rgb(${rgb.map((c) => Math.round(c + (255 - c) * k)).join(', ')})`;
}
