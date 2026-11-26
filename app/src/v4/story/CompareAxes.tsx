// Phase P1: Compare's Body Score row: the five axes side by side, the winner marked on each axis where the difference
// is clear (never an overall winner from these: that stays the verdict's job, analyze.ts verdictOf).
import type { Profile } from '../../science/profile';
import type { Analysis } from '../analyze';
import { RUBRIC } from './axes';
import { storyOf } from './foodStory';
import { AXIS_KEYS, type AxisKey, type FoodStory } from './types';
import './story.css';

/** Which side does better on one axis: 0, 1, or null (too close, or not comparable). */
export function axisWinner(k: AxisKey, a: FoodStory, b: FoodStory): 0 | 1 | null {
  const v = (s: FoodStory, key: string) => s.numbers[key]?.value;
  const lower = (x: number | undefined, y: number | undefined, minGap: number, rel = 0.1): 0 | 1 | null => {
    if (x === undefined || y === undefined) return null;
    if (Math.abs(x - y) < Math.max(minGap, rel * Math.max(x, y))) return null;
    return x < y ? 0 : 1;
  };
  const ta = a.axes[k].tier, tb = b.axes[k].tier;
  switch (k) {
    case 'energy': return lower(v(a, 'kcal'), v(b, 'kcal'), 20);
    case 'sugar': return ta === null || tb === null ? null : lower(v(a, 'sugarPeak'), v(b, 'sugarPeak'), 0.4, 0);
    case 'fullness': return ta === null || tb === null || ta === tb ? null : ta > tb ? 0 : 1;
    case 'sleep': return ta === null || tb === null || ta === tb ? null : ta < tb ? 0 : 1;
    case 'nutrients': {
      const net = (s: FoodStory) => ['proteinDv', 'fiberDv'].filter((q) => (v(s, q) ?? 0) >= 20).length - ['sodiumDv', 'satFatDv', 'freeSugarDv'].filter((q) => (v(s, q) ?? 0) >= 20).length;
      const x = net(a), y = net(b);
      return x === y ? null : x > y ? 0 : 1;
    }
  }
}

export function CompareAxes({ a, b, profile }: { a: Analysis; b: Analysis; profile: Profile }) {
  const sa = storyOf(a, a.parts, profile), sb = storyOf(b, b.parts, profile);
  return (
    <div className="cmpaxes" role="group" aria-label="Body Score, side by side">
      <div className="ctl">Body Score, side by side <span className="note">(✓ = clearly better on that measure; no overall score)</span></div>
      <table>
        <thead><tr><th scope="col">Measure</th><th scope="col">{a.label}</th><th scope="col">{b.label}</th></tr></thead>
        <tbody>
          {AXIS_KEYS.map((k) => { const w = axisWinner(k, sa, sb); return (
            <tr key={k}>
              <th scope="row">{RUBRIC[k].label}</th>
              {[sa, sb].map((s, i) => <td key={i} className={w === i ? 'win' : undefined}><b>{s.axes[k].word}</b><small>{s.axes[k].why}</small>{w === i && <span className="sr"> (clearly better)</span>}</td>)}
            </tr>
          ); })}
        </tbody>
      </table>
    </div>
  );
}
