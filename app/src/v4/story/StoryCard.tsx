// Phase P1: the Story card in the calm view (lazy: its own chunk through lazyUi.tsx, so the first load stays the same).
// `part="strip"`: one line of this food's own numbers above the fold ("139 kcal · 7% of day · 35 g sugar ≈ 9 cubes"),
// a button that opens the card. `part="card"`: the surprising number with its everyday anchor, the Body Score (5 axes,
// each a word and a why; tap one for its grade and sources; no overall number), the cheat sheet, "What we don't know"
// and "Estimate for a 70 kg adult · Personalize".
import { useEffect, useState } from 'react';
import type { Profile } from '../../science/profile';
import type { Level } from '../../content/types';
import { LEVEL_LABEL } from '../../content/types';
import { tipSource } from '../../content/tips';
import { analyze } from '../analyze';
import type { Part } from '../food/parse';
import { RUBRIC } from './axes';
import { storyOf, stripOf } from './foodStory';
import { AXIS_KEYS, type FoodStory } from './types';
import './story.css';

/** One story per (parts, profile, overMin): the strip and the card share it. */
let last: { parts: Part[]; profile: Profile; overMin: number; s: FoodStory } | null = null;
const cached = (parts: Part[], profile: Profile, overMin: number) => (last && last.parts === parts && last.profile === profile && last.overMin === overMin ? last.s : null);
export function storyFor(parts: Part[], profile: Profile, overMin = 0): FoodStory {
  if (last && last.parts === parts && last.profile === profile && last.overMin === overMin) return last.s;
  const s = storyOf(analyze(parts, profile, overMin), parts, profile);
  last = { parts, profile, overMin, s };
  return s;
}

const Grade = ({ g }: { g: Level }) => <i className={`lv lv-${g === '?' ? 'q' : g}`} title={LEVEL_LABEL[g]}>{g}</i>;
function Sources({ ids }: { ids: string[] }) {
  return <span className="src">{ids.map((id) => { const s = tipSource(id); return s ? <a key={id} href={s.url} target="_blank" rel="noreferrer">{s.cite}</a> : null; })}</span>;
}

export function StoryCard({ part, parts, profile, overMin = 0, open, onToggle, onPersonalize }: {
  part: 'strip' | 'card'; parts: Part[]; profile: Profile; overMin?: number; open: boolean; onToggle: () => void; onPersonalize?: () => void;
}) {
  // the story runs the model again (and checks a swap): when the page is idle, so it never delays the first frames of
  // the body (the row's height is reserved, nothing moves when it arrives)
  const [s, setS] = useState<FoodStory | null>(() => (parts.length ? cached(parts, profile, overMin) : null));
  useEffect(() => {
    if (!parts.length) return;
    const now = cached(parts, profile, overMin);
    if (now) { setS(now); return; }
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const run = () => setS(storyFor(parts, profile, overMin));
    if (w.requestIdleCallback) { const id = w.requestIdleCallback(run, { timeout: 800 }); return () => w.cancelIdleCallback?.(id); }
    const id = setTimeout(run, 50); return () => clearTimeout(id);
  }, [parts, profile, overMin]);
  if (!parts.length || !s) return null;
  if (part === 'strip') {
    const ps = stripOf(s);
    if (!ps.length) return null;
    return (
      <button className="storyline" aria-expanded={open} aria-controls="storycard" onClick={onToggle}
        aria-label={`${ps.map((q) => `${q.n} ${q.t}`).join(', ')}. ${open ? 'Hide' : 'Show'} the Body Score`}>
        {ps.map((q, i) => <span key={q.key} className="sp">{i ? <span className="sep" aria-hidden="true">{q.glue ? ' ' : ' · '}</span> : null}<b data-sn={q.key}>{q.n}</b> {q.t}</span>)}
        <span className="sgo" aria-hidden="true">{open ? '▾' : '›'}</span>
      </button>
    );
  }
  const top = s.surprises[0];
  const cheat = [['Best time', s.cheat.bestTime], ['Pair with', s.cheat.pairWith], ['Swap for', s.cheat.swapFor]] as const;
  return (
    <section id="storycard" className="storycard" aria-label={`${s.name}: Body Score`}>
      <p className="sbody">Estimate for {s.body.label}{onPersonalize && <> · <button className="link" onClick={onPersonalize}>Personalize</button></>}</p>
      {top && <p className="ssurprise"><b>{top.claim}</b></p>}
      <h3>Body Score <small>five measures, each on its own: no overall score</small></h3>
      <ul className="saxes">
        {AXIS_KEYS.map((k) => { const a = s.axes[k]; return (
          <li key={k} className={`saxis t${a.tier ?? 'n'}`}>
            <details>
              <summary><span className="sname">{RUBRIC[k].label}</span><b>{a.word}</b><span className="swhy">{a.why}</span></summary>
              <div className="sdeep"><Grade g={a.grade} /> {LEVEL_LABEL[a.grade]}. {RUBRIC[k].note} <Sources ids={a.sources} /></div>
            </details>
          </li>
        ); })}
      </ul>
      <h3>Cheat sheet</h3>
      <dl className="scheat">
        {cheat.map(([label, x]) => <div key={label}><dt>{label}</dt><dd>{x ? <>{x.text} <Grade g={x.grade} /></> : <span className="mute">Nothing to change here.</span>}</dd></div>)}
      </dl>
      <details className="sunknown">
        <summary>What we don’t know</summary>
        <ul>{s.unknowns.map((u) => <li key={u.text}><Grade g={u.grade} /> {u.text} <Sources ids={u.sources} /></li>)}</ul>
      </details>
    </section>
  );
}
