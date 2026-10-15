import { healthBars, HOW_LONG, ITEM_FX, OFTEN, sleepHours, type Counts, type Habits } from './healthBars';

const GROUPS: [string, string[]][] = [
  ['Drinks', ['espresso', 'cola', 'water', 'juice', 'tea']],
  ['Food', ['banana', 'bread', 'pizza', 'chocolate']],
  ['Other', ['beer', 'wine', 'cigarettes']],
];

const hm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const fromHm = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
import type { Profile } from '../science/profile';
import { NumberField } from './NumberField';

const STEPS: [Profile['steps'], string][] = [['low', '< 5k'], ['mid', '5–10k'], ['high', '10k +']];
const EXERCISE: [Profile['exercise'], string][] = [['none', 'None'], ['some', '1–2× / week'], ['regular', '3+× / week']];

function Choice<T extends string>({ label, value, options, set }: { label: string; value: T; options: [T, string][]; set: (v: T) => void }) {
  return (
    <div className="achoice">
      <span>{label}</span>
      <div className="seg2" role="group" aria-label={label}>
        {options.map(([v, l]) => <button key={v} aria-pressed={value === v} onClick={() => set(v)}>{l}</button>)}
      </div>
    </div>
  );
}


export function HealthPanel({ profile, setProfile, counts, setCounts, habits, setHabits, onHow }: {
  profile: Profile; setProfile: (p: Profile) => void; counts: Counts; setCounts: (c: Counts) => void;
  habits: Habits; setHabits: (h: Habits) => void; onHow: () => void;
}) {
  const bars = healthBars(profile, counts, habits);
  const habit = (id: string) => habits[id] ?? { often: 'once' as const, howLong: 'months' as const };
  const add = (id: string, d: number, max: number) => setCounts({ ...counts, [id]: Math.max(0, Math.min(max, (counts[id] ?? 0) + d)) });
  return (
    <div className="hp">
      <div className="hphead"><span>Your health bars</span><button className="link" onClick={onHow}>How is this calculated?</button></div>
      <div className="bars">
        {bars.map((b) => {
          const d = b.value - b.base;
          const tone = b.value >= 75 ? 'g' : b.value >= 45 ? 'y' : 'r';
          return (
            <div key={b.key} className={`hbar ${b.key === 'health' ? 'main' : ''}`} title={b.notes.join(' · ')}>
              <span className="hl">{b.label}</span>
              <span className="htrack"><i className={tone} style={{ width: `${b.value}%` }} />{d !== 0 && <em style={{ left: `${b.value}%`, width: `${Math.abs(d)}%`, marginLeft: d < 0 ? 0 : `-${d}%` }} className={d < 0 ? 'lost' : 'won'} />}</span>
              <span className="hv">{b.value}{d !== 0 && <small className={d < 0 ? 'neg' : 'pos'}>{d > 0 ? '+' : ''}{d}</small>}</span>
              {b.notes.length > 0 && <span className="hn">{b.notes[0]}</span>}
            </div>
          );
        })}
      </div>
      <div className="today">
        <span className="tl">Today I had</span>
        {GROUPS.map(([g, list]) => (
          <div key={g} className="tgroup">
            <span className="tg">{g}</span>
            {list.map((id) => {
              const fx = ITEM_FX[id], n = counts[id] ?? 0;
              return (
                <span key={id} className={`titem ${n ? 'on' : ''}`}>
                  <button aria-label={`One less ${fx.name}`} onClick={() => add(id, -1, fx.max)}>−</button>
                  <b>{n}</b> {fx.name}
                  <button aria-label={`One more ${fx.name}`} onClick={() => add(id, 1, fx.max)}>+</button>
                </span>
              );
            })}
          </div>
        ))}
        {Object.keys(ITEM_FX).filter((id) => (counts[id] ?? 0) > 0 && id !== 'water').map((id) => (
          <div key={id} className="trow">
            <span className="thname">{ITEM_FX[id].name}:</span>
            <span className="thabit">
              <select id={`often-${id}`} aria-label={`How often do you have ${ITEM_FX[id].name}?`} value={habit(id).often}
                onChange={(e) => setHabits({ ...habits, [id]: { ...habit(id), often: e.target.value as Habits[string]['often'] } })}>
                {OFTEN.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              {habit(id).often !== 'once' && (
                <select id={`long-${id}`} aria-label="For how long?" value={habit(id).howLong}
                  onChange={(e) => setHabits({ ...habits, [id]: { ...habit(id), howLong: e.target.value as Habits[string]['howLong'] } })}>
                  {HOW_LONG.map(([v, l]) => <option key={v} value={v}>for {l.toLowerCase()}</option>)}
                </select>
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="activity">
        <span className="tl">My activity</span>
        <Choice label="Steps a day" value={profile.steps} options={STEPS} set={(v) => setProfile({ ...profile, steps: v })} />
        <Choice label="Exercise" value={profile.exercise} options={EXERCISE} set={(v) => setProfile({ ...profile, exercise: v })} />
        <label className="akm">I sleep from
          <span>
            <input id="hp-bed" type="time" value={hm(profile.bedtimeMin)} onChange={(e) => e.target.value && setProfile({ ...profile, bedtimeMin: fromHm(e.target.value) })} />
            to
            <input id="hp-wake" type="time" value={hm(profile.wakeMin)} onChange={(e) => e.target.value && setProfile({ ...profile, wakeMin: fromHm(e.target.value) })} />
            <b>{+sleepHours(profile).toFixed(1)} h</b>
          </span>
        </label>
        <label className="akm">Walk or run per week
          <span><NumberField id="km" value={profile.kmPerWeek} min={0} max={300} onCommit={(v) => setProfile({ ...profile, kmPerWeek: v })} /> km</span>
        </label>
      </div>
      <p className="hpnote">A simplified score to compare choices, not a medical test.</p>
    </div>
  );
}
