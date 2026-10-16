// Quick answers: the everyday questions people actually have, answered in a few words from the same model.
// Sugar · Sleep · Driving (alcohol only) · Hunger (after a dip) · Energy as walking minutes · one next step.
// Where people differ we show a range (science/ranges.ts); blood alcohol is never a single number or a "safe" time.
import type { System } from './status';
import { worstMoment } from './status';
import { at } from '../science/espressoSim';
import { bacRangeText, glucoseRangeTextIn } from '../science/ranges';
import { TIPS } from '../content/tips';
import { LEVEL_LABEL } from '../content/types';
import { Disclaimer } from './HowWeKnow';
import { FACTORS, FED_PEAK_RATIO, type PersonalNotes } from '../science/personal';
import { simulateFood } from '../science/foodSim';
import { walkingKm, walkingMinutes } from '../science/walking';
import type { SleepRisk } from '../science/daily';
import type { Profile } from '../science/profile';
import { toMeal } from './food/meal';
import { mealAnswerLines } from './food/mealWords';
import type { Part } from './food/parse';
import './personal.css';

export interface AnswerInput {
  systems: System[]; drinkAt: number; bedtimeMin: number; weightKg: number;
  kcal: number; glucoseDeltaMgDl?: Float64Array; extraSleepMin: number; caffeineAtBedMg: number;
  bac?: Float64Array; waterMl: number;
  /** latest clock minute to have it without delaying sleep (caffeine), if any */
  latestForSleep?: number | null;
  /** what the caffeine left at bedtime means for sleep (science/daily.ts sleepRiskOf); from the vitals */
  sleepRisk?: SleepRisk;
  /** what is known about this person (science/personal.ts); without it answers are labelled typical */
  personal?: PersonalNotes;
  /** meal wording (food/mealWords.ts) when the food is a meal of 2+ items; see mealLinesFor */
  mealLines?: string[];
  /** the blood sugar unit chosen in "Your body" (default mmol/L) */
  glucoseUnit?: 'mmol/L' | 'mg/dL';
}

/** Whole-meal sentences (which item drives sugar, speed, alcohol, caffeine) for 2+ items; [] for a single food. */
export function mealLinesFor(parts: Part[], profile: Profile): string[] {
  if (parts.length < 2) return [];
  return mealAnswerLines(simulateFood(toMeal(parts), profile), toMeal(parts), parts);
}
export interface Answer { icon: string; q: string; a: string; tone: 0 | 1 | 2; /** small line under the answer (evidence level) */ note?: string; title?: string;
  /** 'you' = computed for this person's body and settings; 'typical' = the same for everyone */
  tag?: 'you' | 'typical' }

const hh = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m) % 60).padStart(2, '0')}`;

export function quickAnswers(x: AnswerInput): Answer[] {
  const out: Answer[] = [];
  const at0 = (m: number) => hh(x.drinkAt + m);
  // Sugar
  const g = x.glucoseDeltaMgDl;
  if (g) {
    let peak = 0, peakAt = 0, low = 0, lowAt = 0, backAt = -1;
    for (let m = 0; m < Math.min(g.length, 600); m++) { if (g[m] > peak) { peak = g[m]; peakAt = m; } if (g[m] < low) { low = g[m]; lowAt = m; } }
    for (let m = peakAt; m < Math.min(g.length, 600); m++) if (g[m] < 0.15 * peak) { backAt = m; break; }
    const mmol = peak / 18.016;
    // sugar curves can't be personalised from body facts (Zeevi 2015, digestion-generic.md GL10): always typical
    const SUGAR_WHY = 'Body size, age and habits don’t predict your own curve well; only a glucose sensor can.';
    if (mmol < 0.3) out.push({ icon: '⚡', q: 'Will my blood sugar rise?', a: 'No, it stays steady.', tone: 0, tag: 'typical' });
    // a range: ±1 SD between people ≈ ±40% (cola.md B1, digestion-generic.md GL8)
    else out.push({ icon: '⚡', q: 'Will my blood sugar rise?', a: `${mmol >= 1.5 ? 'Yes' : 'A little'}: about ${glucoseRangeTextIn(mmol, x.glucoseUnit)} around ${at0(peakAt)}${backAt > 0 ? `, normal again by about ${at0(backAt)}` : ''}.`, tone: mmol >= 1.5 ? 1 : 0,
      note: 'Typical response, not personalized', title: SUGAR_WHY, tag: 'typical' });
    if (low / 18.016 <= -0.3) out.push({ icon: '🍽️', q: 'Will I get hungry again soon?', a: `Probably around ${at0(lowAt)}, when your blood sugar dips below where it started.`, tone: 1, tag: 'typical' });
  } else out.push({ icon: '⚡', q: 'Will my blood sugar rise?', a: x.bac
    ? 'Hard to say: alcohol changes how your liver handles sugar, so we don’t draw a curve.'
    : 'We can’t say: its glycemic index hasn’t been measured yet.', tone: 0 });
  // Meal as a whole: names the item behind each effect (food/mealWords.ts); the single-food answers stay as they are
  if (x.mealLines?.length) out.push({ icon: '🍱', q: 'How does this meal work?', a: x.mealLines.join(' '), tone: 0, note: 'The meal as a whole, estimated from its parts' });
  // Sleep
  const bedRel = (x.bedtimeMin - x.drinkAt + 1440) % 1440;
  const bacBed = x.bac ? at(x.bac, bedRel) : 0;
  const pn = x.personal;
  const hasCaffeine = x.latestForSleep !== undefined && x.latestForSleep !== null || x.caffeineAtBedMg >= 1;
  // caffeine: the clock is this person's half-life (smoking, pill, pregnancy) and body water (espresso.md M6–M9, D4)
  const sleepNote = pn && hasCaffeine ? (pn.halfLifeWhy
    ? `For you: caffeine half-life ≈ ${pn.halfLifeH.toFixed(1)} h (${pn.halfLifeWhy}); typical 6 h`
    : 'For your body. Typical half-life 6 h; people range from 2.5 to 10 h') : undefined;
  const sleepTag = pn && (hasCaffeine || x.bac) ? 'you' as const : undefined;
  if (bacBed > 0.02) out.push({ icon: '🌙', q: 'Will I sleep well?', a: `Not as well: alcohol is still in your blood at ${hh(x.bedtimeMin)}, so you’ll sleep more lightly in the second half of the night.`, tone: 1, tag: sleepTag });
  else if (x.extraSleepMin >= 5) out.push({ icon: '🌙', q: 'Will I sleep well?', a: `It may take you about ${Math.round(x.extraSleepMin)} min longer to fall asleep (${bedRel < 90 ? 'you had it shortly before bed, so it reaches your blood while you fall asleep' : `${Math.round(x.caffeineAtBedMg)} mg of caffeine is still in you at ${hh(x.bedtimeMin)}`}).`, tone: 1, note: sleepNote, tag: sleepTag });
  // below the 5-min delay: "too little" only when it is also under the meta-analysis level (VS1); otherwise be honest
  // that caffeine-sensitive people can still sleep less (VS4), e.g. an espresso at 20:45 leaves ≈ 51 mg at 23:00
  else if (x.sleepRisk === 'sensitive' || (x.sleepRisk === 'delay' && x.extraSleepMin < 5)) out.push({ icon: '🌙', q: 'Will I sleep well?', a: `Probably, unless caffeine affects you easily. ${bedRel < 90 ? 'You had it shortly before bed, so the caffeine reaches your blood while you fall asleep' : `About ${Math.round(x.caffeineAtBedMg)} mg is still in you at ${hh(x.bedtimeMin)}`}: most people sleep normally with that much, but sensitive people may sleep a little less or more lightly.`, tone: 1, note: sleepNote, tag: sleepTag });
  else out.push({ icon: '🌙', q: 'Will I sleep well?', a: x.caffeineAtBedMg >= 10 ? `Yes. The ${Math.round(x.caffeineAtBedMg)} mg of caffeine left at ${hh(x.bedtimeMin)} is too little to affect your sleep.` : 'Yes. It won’t affect your sleep.', tone: 0, note: sleepNote, tag: sleepTag });
  // Best time (caffeine): the latest time that leaves sleep untouched
  if (x.latestForSleep !== undefined && x.latestForSleep !== null) {
    const late = x.drinkAt > x.latestForSleep && x.drinkAt < x.bedtimeMin;
    const tag = pn ? 'you' as const : undefined;
    if (x.bedtimeMin - x.latestForSleep <= 30) out.push({ icon: '⏰', q: 'When is the best time?', a: 'Any time today: this much caffeine is too little to affect your sleep.', tone: 0, tag });
    else out.push({ icon: '⏰', q: 'When is the best time?', a: `Before ${hh(x.latestForSleep)}, so the caffeine is too low to cut into your sleep at ${hh(x.bedtimeMin)}.${late ? ' You had it after that.' : ''}`, tone: late ? 1 : 0, tag });
  }
  // Driving: never a "safe" time and never one exact number. Widmark estimates are off by 20–40% (alcohol.md W6),
  // and attention is already worse from 0.2 g/L (AL4), so the only honest answer is "don't".
  if (x.bac) {
    let peak = 0;
    for (let m = 0; m < x.bac.length; m++) peak = Math.max(peak, x.bac[m]);
    out.push({ icon: '🚗', q: 'Can I drive?', a: `No. Don’t drive after drinking: this app can’t tell you when you’re safe. Your peak is likely about ${bacRangeText(peak)}. The range runs from 40% below to 50% above our estimate, because bodies differ.`, tone: 2,
      tag: pn ? 'you' : undefined,
      note: pn ? (pn.withMeal
        ? `For you: after a meal the peak is about ${Math.round(FED_PEAK_RATIO[0] * 100)}–${Math.round(FED_PEAK_RATIO[1] * 100)}% of the peak on an empty stomach (evidence ${FACTORS.withMeal.level})`
        : 'For your sex, height and weight, on an empty stomach') : undefined });
    // pregnancy: WHO — alcohol in pregnancy raises the risk of FASD (alcohol.md L12)
    if (pn?.pregnant) out.push({ icon: '🤰', q: 'And in pregnancy?', a: 'Best to have none: alcohol reaches the baby and raises the risk of lasting harm (WHO).', tone: 2, tag: 'you' });
  }
  // Energy as walking: ACSM walking equation, net of rest, at 5 km/h (science/walking.ts; activity.md E1–E2).
  // One formula everywhere; it falls as body weight rises and ignores age and height (they are not in the equation).
  if (x.kcal >= 5) {
    const min = Math.round(walkingMinutes(x.kcal, x.weightKg));
    const km = walkingKm(x.kcal, x.weightKg);
    out.push({ icon: '🚶', q: 'How much energy is that?', a: `${Math.round(x.kcal)} kcal ≈ ${min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`} of brisk walking for you${km >= 1 ? ` (about ${km >= 10 ? Math.round(km) : km.toFixed(1).replace(/\.0$/, '')} km)` : ''}.`, tone: 0, tag: pn ? 'you' : undefined,
      note: pn ? 'Energy used on top of sitting still, at 5 km/h, for your weight' : undefined });
  } else out.push({ icon: '🚶', q: 'How much energy is that?', a: 'Almost none.', tone: 0 });
  if (x.waterMl >= 100) out.push({ icon: '💧', q: 'Does it count as water?', a: `Yes: it gives your body about ${Math.round(x.waterMl)} ml of water.`, tone: 0, tag: pn ? 'typical' : undefined });
  const tip = nextStep(x.systems, !!x.bac);
  if (tip) out.push({ icon: '👣', q: 'What can I do?', a: tip.text, tone: 0, note: `Evidence ${tip.level}: ${LEVEL_LABEL[tip.level].toLowerCase()}`, title: tip.why });
  return out;
}

/** One next step for the hardest moment of the day (worst light first). The alcohol tip is skipped when the
 *  driving answer already says it. */
export function nextStep(systems: System[], hasAlcohol: boolean) {
  const ranked = systems.filter((s) => !s.unknown && s.tip).map((s) => ({ s, m: worstMoment(s) }))
    .map((r) => ({ ...r, l: r.s.levels[r.m] })).filter((r) => r.l > 0).sort((a, b) => b.l - a.l);
  for (const r of ranked) {
    const k = r.s.tip!(r.l as 0 | 1 | 2, r.m);
    if (k && !(k === 'alcohol' && hasAlcohol)) return TIPS[k];
  }
  return null;
}

const TONE = ['#3ddc84', '#ffc83d', '#ff5a5a'];
export function Answers({ list, onHow, onBody }: { list: Answer[]; onHow?: () => void; /** opens the "Your body" sheet */ onBody?: () => void }) {
  return (
    <div className="answers" role="group" aria-label="Quick answers">
      <div className="ctl">Quick answers{onBody && <button className="ans-body" onClick={onBody}>Your body<span aria-hidden="true"> ›</span></button>}</div>
      {list.map((x) => (
        <div key={x.q} className="ans" style={{ ['--t' as string]: TONE[x.tone] }} title={x.title}>
          <span className="ai" aria-hidden="true">{x.icon}</span>
          <span><b>{x.q}{x.tag && <i className={`ans-tag ${x.tag}`}>{x.tag === 'you' ? 'for you' : 'typical'}</i>}</b><em>{x.a}</em>{x.note && <small className="tipsrc">{x.note}</small>}</span>
        </div>
      ))}
      <Disclaimer onHow={onHow} />
    </div>
  );
}
