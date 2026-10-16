import { useState } from 'react';
// The right-hand panel of the story view: the current chapter in plain words, what is changing in you
// right now, and how this product moves your health bars at the frequency you have it.
import type { Vitals } from '../science/daily';
import type { Profile } from '../science/profile';
import { chapterText, type Chapter, type Story } from './stories';
import { healthBars, HOW_LONG, ITEM_FX, OFTEN, type Habit } from './healthBars';

// What everyone understands stays visible; lab values (insulin, blood fat…) sit behind 'More details'.
const PRIMARY = /^(Blood sugar|Energy|Caffeine|Blood alcohol|Pulse|Blood pressure|Water in your body|Alertness)/;
const ARROW = { up: '▲', down: '▼', same: '–' } as const;

export function StoryPanel({ story, chapterIdx, minute, vitals, profile, name, productId, habit, setHabit, clock, since,
  onBody, onWhy, onEvery, onPrev, onNext, passport, verdict }: {
  story: Story; chapterIdx: number; minute: number; vitals: Vitals; profile: Profile; name: string; productId: string;
  habit: Habit; setHabit: (h: Habit) => void; clock: string; since: string;
  onBody: () => void; onWhy: (c: Chapter) => void; onEvery: () => void; onPrev: () => void; onNext: () => void;
  passport?: React.ReactNode; verdict?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const ch = story.chapters[chapterIdx];
  const changes = story.changes(minute, vitals, profile);
  const bars = healthBars(profile, { [productId]: 1 }, { [productId]: habit }).filter((b) => b.key !== 'health');
  return (
    <section className="spanel story" aria-label="What is happening in your body">
      <div className="shead">
        <div><div className="sclock">{clock}</div><div className="since">{since}</div></div>
        <button className="youchip" onClick={onBody} aria-label={`${name}, ${profile.weightKg} kg, ${profile.heightCm} cm. Change your body`}>{name} · {profile.weightKg} kg · {profile.heightCm} cm<span>Change</span></button>
      </div>

      {verdict && <div className="verdict"><b>In 24 hours</b>{verdict}</div>}

      <article className="chapter" aria-live="polite">
        <div className="chnav">
          <button onClick={onPrev} aria-label="Previous step" disabled={chapterIdx === 0}>‹</button>
          <span aria-hidden="true">Step {chapterIdx + 1} of {story.chapters.length}</span>
          <button onClick={onNext} aria-label="Next step" disabled={chapterIdx === story.chapters.length - 1}>›</button>
        </div>
        <h2>{ch.title}</h2>
        <p>{chapterText(ch, minute)}</p>
        {ch.claims.length > 0 && <button className="why" onClick={() => onWhy(ch)}>How do we know?<span aria-hidden="true"> →</span></button>}
      </article>

      {passport}

      <div className="changes">
        <div className="ctl">What is changing in you now</div>
        {changes.filter((c) => showAll || PRIMARY.test(c.label)).map((c) => (
          <div key={c.label} className={`chg ${c.dir}`}>
            <span className="ca" aria-hidden="true">{ARROW[c.dir]}</span>
            <span className="cl">{c.label}<small>{c.note}</small></span>
            <span className="cv">{c.value}</span>
          </div>
        ))}
        {changes.some((c) => !PRIMARY.test(c.label)) && (
          <button className="link morebtn" onClick={() => setShowAll(!showAll)}>{showAll ? 'Fewer details' : `More details (${changes.filter((c) => !PRIMARY.test(c.label)).length})`}</button>
        )}
      </div>

      {productId !== 'water' && !ITEM_FX[productId] && (
        <div className="habitbox"><div className="ctl">If you have it every day…</div>
          <p className="note">The long-term effects of this food are still being researched. We’ll show them once every number has a source.</p></div>
      )}
      {productId !== 'water' && ITEM_FX[productId] && (
        <div className="habitbox">
          <div className="ctl">If you have it…</div>
          <div className="hsel">
            <select id="habit-often" aria-label="How often" value={habit.often} onChange={(e) => setHabit({ ...habit, often: e.target.value as Habit['often'] })}>
              {OFTEN.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {habit.often !== 'once' && (
              <select id="habit-long" aria-label="For how long" value={habit.howLong} onChange={(e) => setHabit({ ...habit, howLong: e.target.value as Habit['howLong'] })}>
                {HOW_LONG.map(([v, l]) => <option key={v} value={v}>for {l.toLowerCase()}</option>)}
              </select>
            )}
          </div>
          <div className="minibars">
            {bars.map((b) => {
              const d = b.value - b.base;
              return (
                <div key={b.key} className="mb">
                  <span>{b.label}</span>
                  <span className="mt"><i className={b.value >= 75 ? 'g' : b.value >= 45 ? 'y' : 'r'} style={{ width: `${b.value}%` }} /></span>
                  <b className={d < 0 ? 'neg' : d > 0 ? 'pos' : ''}>{d === 0 ? '±0' : `${d > 0 ? '+' : ''}${d}`}</b>
                </div>
              );
            })}
          </div>
          <p className="note mbnote">Each bar is a score out of 100 for a body like yours; the number shows how much this habit changes it.</p>
          <button className="everybtn" onClick={onEvery}><b>Every day for years?</b><span>Cholesterol, diabetes, weight, life expectancy →</span></button>
        </div>
      )}
    </section>
  );
}
