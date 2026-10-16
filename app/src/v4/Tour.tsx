// First-visit guide: three bubbles that point at the main parts of the screen. Shown once (remembered in
// this browser), can be skipped, and reopened from About.
import { useEffect, useState } from 'react';

const STEPS = [
  { cls: 'tour-l', title: 'How you are doing', text: 'These lights show how each part of you is doing. Green: fine. Yellow: mild stress. Red: high stress. Tap one to see its hardest moment.' },
  { cls: 'tour-r', title: 'Where it goes', text: 'This is the trip through your body: which organ, when, for how long and how much. Tap a place to fly there.' },
  { cls: 'tour-b', title: 'Watch the whole day', text: 'Press ▶ to play the 24 hours, or tap a step. The colored strips show when something happens.' },
];
const KEY = 'i24-tour-done';

export function Tour({ active }: { active: boolean }) {
  const [i, setI] = useState<number | null>(null);
  useEffect(() => {
    if (!active) return;
    let done = false;
    try { done = localStorage.getItem(KEY) === '1'; } catch { /* storage blocked: show it */ }
    if (!done) { const id = setTimeout(() => setI(0), 1200); return () => clearTimeout(id); }
  }, [active]);
  useEffect(() => {
    const open = () => setI(0);
    window.addEventListener('i24-tour', open);
    return () => window.removeEventListener('i24-tour', open);
  }, []);
  if (i === null) return null;
  const end = () => { setI(null); try { localStorage.setItem(KEY, '1'); } catch { /* fine */ } };
  const s = STEPS[i];
  return (
    <div className={`tour ${s.cls}`} role="dialog" aria-label={s.title} onKeyDown={(e) => { if (e.key === 'Escape') end(); }}>
      <div className="tstep">{i + 1} / {STEPS.length}</div>
      <b>{s.title}</b>
      <p>{s.text}</p>
      <div className="tbtn">
        <button className="link" onClick={end}>Skip</button>
        <button className="primary" autoFocus onClick={() => (i + 1 < STEPS.length ? setI(i + 1) : end())}>{i + 1 < STEPS.length ? 'Next' : 'Got it'}</button>
      </div>
    </div>
  );
}
