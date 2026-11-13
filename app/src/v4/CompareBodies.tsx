// Phase 3 (master audit C17): the comparison in the app shows the two bodies, not only text and a chart. The same
// split-screen scene as the comparison video (CompareVideo: two viewports of one renderer, both cameras making the
// same moves), so the same minute happens side by side and the difference is what you see. Each body shows its food
// only where the model has it now (scene/presence.ts). Phones: one body at a time over the whole canvas (Left / Right
// / Both), so each stays big enough to read; the time slider is shared.
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { CompareScene, SafeCanvas } from './lazy3d';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { minutesFromU, uFromMinutes } from '../time';
import { SEG_LABEL, type SegId } from '../scene/segments';
import { presenceAt } from '../scene/presence';
import type { Analysis } from './analyze';
import type { ShotCue } from './VideoCam';

/** The organ the camera frames for each part of the route (as the video, video-body SEG_FOCUS_V). */
const FOCUS: Record<SegId, string> = {
  swallow: 'esophagus', stomach: 'stomach', duodenum: 'duodenum', small: 'jejunum', portal: 'liver', blood: 'heart', kidney: 'kidney_l', bladder: 'bladder', colon: 'colon_trans',
};
const MARKS = [0, 30, 120, 360, 720, 1440];
const when = (m: number) => (m < 1 ? 'Start' : m < 60 ? `+${Math.round(m)} min` : `+${Math.floor(m / 60)} h${Math.round(m % 60) >= 5 ? ` ${Math.round(m % 60)} min` : ''}`);

/** Where most of it is now, in words, from the same route model the body is drawn with ("Stomach · 279 g"). */
export function whereNow(a: Analysis, m: number): string {
  const r = a.built.route;
  if (!r) return '';
  const segs = r.segs(m), p = presenceAt(r, m);
  const top = (Object.keys(p.seg) as SegId[]).filter((k) => k !== 'swallow' && (p.seg[k] ?? 0) > 0).sort((x, y) => (p.seg[y] ?? 0) - (p.seg[x] ?? 0))[0];
  if (!top) return 'Nothing left to see here';
  const v = segs[top]!, n = v.amount >= 10 ? Math.round(v.amount) : +v.amount.toFixed(1);
  return `${SEG_LABEL[top]} · ${v.text ?? `${n} ${v.unit ?? r.unit}`}`;
}
const leadOrgan = (a: Analysis, m: number) => {
  const p = presenceAt(a.built.route, m);
  const top = (Object.keys(p.seg) as SegId[]).sort((x, y) => (p.seg[y] ?? 0) - (p.seg[x] ?? 0))[0];
  return top && (p.seg[top] ?? 0) > 0 ? FOCUS[top] : null;
};

export function CompareBodies({ a, b }: { a: Analysis; b: Analysis }) {
  const [u, setU] = useState(uFromMinutes(30));
  const [playing, setPlaying] = useState(false);
  const narrow = typeof matchMedia !== 'undefined' && matchMedia('(max-width: 640px)').matches;
  const [side, setSide] = useState<0 | 1 | null>(narrow ? 0 : null);
  const minute = Math.min(1440, minutesFromU(u));
  // the camera frames where both foods are now (one shot for both sides: the same moves)
  const cue = useRef<ShotCue | null>(null);
  const focus = useMemo(() => [leadOrgan(a, minute), leadOrgan(b, minute)] as [string | null, string | null], [a, b, minute]);
  cue.current = { shot: { focus: [...new Set(focus.filter((x): x is string => !!x))], zoom: 'mid' } };
  useEffect(() => {
    if (!playing) return;
    let raf = 0, last = performance.now();
    const step = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000); last = t;
      setU((x) => { const n = x + dt / 24; if (n >= 1) { setPlaying(false); return 1; } return n; }); // the whole day in 24 s
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  const names = [a, b].map((x) => x.label);
  return (
    <section className="cmpbodies" aria-label={`The two bodies ${when(minute).toLowerCase()}: ${names[0]}: ${whereNow(a, minute)}. ${names[1]}: ${whereNow(b, minute)}.`}>
      {narrow && <div className="seg2 cmpside" role="group" aria-label="Which body">
        <button aria-pressed={side === 0} onClick={() => setSide(0)}>{names[0]}</button>
        <button aria-pressed={side === 1} onClick={() => setSide(1)}>{names[1]}</button>
        <button aria-pressed={side === null} onClick={() => setSide(null)}>Both</button>
      </div>}
      <div className="cmpcanvas" aria-hidden="true">
        <ErrorBoundary fallback={() => <p className="note">The 3D bodies can’t be shown on this device. Everything below still compares them.</p>}>
          <Suspense fallback={null}>
            <SafeCanvas camera={{ position: [0, 1.2, 2], fov: 33 }} frameloop="always" noGl={() => <p className="note">No 3D here: everything below still compares them.</p>}>
              <Suspense fallback={null}>
                <CompareScene a={a} b={b} minute={minute} cue={cue} focus={focus} only={side ?? undefined} />
              </Suspense>
            </SafeCanvas>
          </Suspense>
        </ErrorBoundary>
        <div className={`cmpwhere ${side === null ? 'two' : 'one'}`}>
          {[a, b].map((x, k) => (side === null || side === k) && <div key={k}><b>{names[k]}</b><span>{whereNow(x, minute)}</span></div>)}
        </div>
      </div>
      <div className="cmptime">
        <button className="cmpbtn" aria-label={playing ? 'Pause' : 'Play the day'} onClick={() => { if (!playing && u >= 1) setU(0); setPlaying(!playing); }}>{playing ? '❚❚' : '▶'}</button>
        <input type="range" min={0} max={1} step={0.001} value={u} aria-label="Time after eating" aria-valuetext={when(minute)} onChange={(e) => { setPlaying(false); setU(Number(e.target.value)); }} />
        <b className="cmpwhen">{when(minute)}</b>
      </div>
      <div className="cmpmarks">{MARKS.map((m) => <button key={m} className="cmpbtn" onClick={() => { setPlaying(false); setU(uFromMinutes(m)); }}>{m === 1440 ? '24 h' : when(m)}</button>)}</div>
    </section>
  );
}
