// Phase P1: "How we know" → Body Score method. It renders the rubric the code uses (axes.ts RUBRIC and FULLNESS), so
// the method is public and can never drift from the app (the Yuka lesson, research R-B1). Lazy (lazyUi.tsx).
import { LEVEL_LABEL } from '../../content/types';
import { tipSource } from '../../content/tips';
import { FULLNESS, FULLNESS_MIN_KCAL, RUBRIC } from './axes';
import { AXIS_KEYS } from './types';
import './story.css';

export function BodyScoreMethod() {
  return (
    <div className="bsmethod">
      <p>Each food gets five separate measures. Each has a word and a one-line reason, and there is <b>no overall score</b>: a single number would hide what matters (a coffee can be light in kcal and still cost you sleep). Every measure is an estimate for a typical body of your size, with its evidence level and sources.</p>
      {AXIS_KEYS.map((k) => { const r = RUBRIC[k]; return (
        <div key={k}>
          <h4>{r.label} <i className={`lv lv-${r.grade === '?' ? 'q' : r.grade}`} title={LEVEL_LABEL[r.grade]}>{r.grade}</i></h4>
          <p>Measures {r.measures}. {r.note}</p>
          <table>
            <thead><tr><th>Word</th><th>When</th></tr></thead>
            <tbody>{r.tiers.map((t) => <tr key={t.tier}><td>{t.word}</td><td>{t.rule}</td></tr>)}<tr><td>{r.none.split(':')[0]}</td><td>{r.none.includes(':') ? r.none.split(':').slice(1).join(':').trim() : '—'}</td></tr></tbody>
          </table>
          {k === 'fullness' && (
            <table aria-label="Fullness points">
              <thead><tr><th>Food property</th><th>Points</th></tr></thead>
              <tbody>
                {FULLNESS.density.map((d) => <tr key={d.label}><td>Energy density {d.label}</td><td>{d.pts > 0 ? `+${d.pts}` : d.pts}</td></tr>)}
                {FULLNESS.protein.map((d) => <tr key={d.label}><td>Protein {d.label}</td><td>+{d.pts}</td></tr>)}
                {FULLNESS.fiber.map((d) => <tr key={d.label}><td>Fiber {d.label}</td><td>+{d.pts}</td></tr>)}
                <tr><td>It is {FULLNESS.liquid.label}</td><td>{FULLNESS.liquid.pts}</td></tr>
                <tr><td>Under {FULLNESS_MIN_KCAL} kcal</td><td>not rated</td></tr>
              </tbody>
            </table>
          )}
          <div className="src">{r.sources.map((id) => { const s = tipSource(id); return s ? <a key={id} href={s.url} target="_blank" rel="noreferrer">{s.cite}</a> : null; })}</div>
        </div>
      ); })}
    </div>
  );
}
