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
import { alcoholClock, clockLabel, GONE_GL, poisonRisk } from '../science/alcoholClock';
import { alcoholSleepSentence, alcoholSleepTier, caffeineAlsoSentence, minutesToBed, SLEEP_WINDOW_MIN, type SleepRisk } from '../science/daily';
import type { Profile } from '../science/profile';
import { toMeal } from './food/meal';
import { mealAnswerLines } from './food/mealWords';
import type { Part } from './food/parse';
import './personal.css';

export interface AnswerInput {
  systems: System[]; drinkAt: number; bedtimeMin: number; weightKg: number;
  kcal: number; glucoseDeltaMgDl?: Float64Array; extraSleepMin: number; caffeineAtBedMg: number;
  bac?: Float64Array; waterMl: number;
  /** grams of alcohol in the item (for the dose-aware sleep answer); without it the dose is estimated from peak blood alcohol */
  alcoholG?: number;
  /** the meal has food in it, so the alcohol was absorbed "fed" (QA 2026-10-19: the note said "on an empty stomach") */
  alcoholFed?: boolean;
  /** usual wake time; a drink between bedtime and waking means bed right after it (science/daily.ts minutesToBed) */
  wakeMin?: number;
  /** caffeine in the item (mg); without it, "has caffeine" is guessed from latestForSleep and the amount at bedtime,
   *  which is 0 for a drink right at bedtime (wave 7: cola at 23:00 in Compare said "no caffeine") */
  caffeineDoseMg?: number;
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
  /** PACING ("Over how long?", 2026-10-19): the rounds and, for alcohol, the same drinks all at once (for the comparison) */
  pace?: { doses: number; overMin: number; bacOnce?: Float64Array };
  /** "Over how long?" is offered for this item (two or more servings): the all-at-once answers point at it */
  canPace?: boolean;
}

/** Whole-meal sentences (which item drives sugar, speed, alcohol, caffeine) for 2+ items; [] for a single food. */
export function mealLinesFor(parts: Part[], profile: Profile, overMin = 0): string[] {
  if (parts.length < 2) return [];
  const meal = toMeal(parts, undefined, overMin);
  return mealAnswerLines(simulateFood(meal, profile), meal, parts);
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
  // Alcohol has no sugar curve of its own but slows the liver's sugar-making [AL10 B]; with diabetes medicines the dip
  // can come the next morning [AL11 B, Turner 2001 at 0.75 g/kg]. Yellow edge from the high band (> 0.75 g/kg).
  const alcGPerKg = x.bac ? (x.alcoholG ?? 0) / Math.max(30, x.weightKg) : 0;
  const alcSugar = x.bac ? ` Alcohol can even lower blood sugar later: it slows your liver’s sugar-making for hours. In healthy people who have eaten this rarely matters; after a long fast, heavy drinking, or with insulin or diabetes tablets, blood sugar can drop hours later, even the next morning.` : '';
  const alcSugarNote = 'Evidence B: mechanism measured (Siler 1998); the morning dip measured with type 1 diabetes (Turner 2001, 6 men)';
  if (g && x.bac && Math.max(0, ...Array.from(g.subarray(0, 600))) / 18.016 < 0.3) {
    out.push({ icon: '⚡', q: 'Will my blood sugar rise?', a: `No: there is almost no sugar in it to raise it.${alcSugar}`, tone: alcGPerKg > 0.75 ? 1 : 0, tag: 'typical', note: alcSugarNote });
  } else if (g) {
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
    ? `We don’t draw a curve: its glycemic index hasn’t been measured.${alcSugar}`
    : 'We can’t say: its glycemic index hasn’t been measured yet.', tone: x.bac && alcGPerKg > 0.75 ? 1 : 0, ...(x.bac ? { note: alcSugarNote } : {}) });
  // a sugar curve drawn for a meal WITH alcohol (e.g. rakija + cola) still gets the later-dip sentence
  if (g && x.bac && out[0].q === 'Will my blood sugar rise?' && !out[0].a.includes('Alcohol can even')) out[0] = { ...out[0], a: `${out[0].a}${alcSugar}`, note: `${out[0].note ? `${out[0].note}. ` : ''}${alcSugarNote}` };
  // Meal as a whole: names the item behind each effect (food/mealWords.ts); the single-food answers stay as they are
  if (x.mealLines?.length) out.push({ icon: '🍱', q: 'How does this meal work?', a: x.mealLines.join(' '), tone: 0, note: 'The meal as a whole, estimated from its parts' });
  // Sleep
  const bedRel = minutesToBed({ drinkAtMin: x.drinkAt, bedtimeMin: x.bedtimeMin, wakeMin: x.wakeMin });
  const afterBed = bedRel === 0 && x.drinkAt !== x.bedtimeMin; // had it after the usual bedtime: bed right after
  const bedWord = afterBed ? 'when you go to bed' : `at ${hh(x.bedtimeMin)}`;
  // alcohol while you fall asleep: the highest level from lights-out to 90 min after (same window as caffeine)
  let bacBed = 0;
  if (x.bac) for (let m = bedRel; m <= Math.min(x.bac.length - 1, bedRel + SLEEP_WINDOW_MIN); m++) bacBed = Math.max(bacBed, at(x.bac, m));
  // the Brain & sleep light over the same window: the answer is never calmer than the light (wave 6)
  const brainSys = x.systems.find((s) => s.key === 'brain');
  let lightSleep = 0;
  if (brainSys) for (let m = bedRel; m <= Math.min(brainSys.levels.length - 1, bedRel + SLEEP_WINDOW_MIN); m++) lightSleep = Math.max(lightSleep, brainSys.levels[m]);
  const pn = x.personal;
  const hasCaffeine = x.latestForSleep !== undefined && x.latestForSleep !== null || x.caffeineAtBedMg >= 1 || (x.caffeineDoseMg ?? 0) >= 1;
  // caffeine: the clock is this person's half-life (smoking, pill, pregnancy) and body water (espresso.md M6–M9, D4)
  const sleepNote = pn && hasCaffeine ? (pn.halfLifeWhy
    ? `For you: caffeine half-life ≈ ${pn.halfLifeH.toFixed(1)} h (${pn.halfLifeWhy}); typical 6 h`
    : 'For your body. Typical half-life 6 h; people range from 2.5 to 10 h') : undefined;
  const sleepTag = pn && (hasCaffeine || x.bac) ? 'you' as const : undefined;
  if (x.bac && bacBed > 0.02) { // the same 0.02 ‰ as the night light (status.ts)
    // dose-aware (science/daily.ts alcoholSleepSentence): direction A (Ebrahim 2013), size B (Pietilä 2018)
    let peak = 0; for (let m = 0; m < x.bac.length; m++) peak = Math.max(peak, x.bac[m]);
    const gPerKg = x.alcoholG !== undefined ? x.alcoholG / Math.max(30, x.weightKg) : peak * 0.68; // fallback: Widmark r ≈ 0.68
    const tier = alcoholSleepTier(gPerKg);
    // caffeine in the same meal or drink (e.g. rakija with an espresso): one short extra sentence when it is above its
    // own threshold, with the caffeine answer's own tone (wave 7)
    const cafTone = x.extraSleepMin >= 20 ? 2 : x.extraSleepMin >= 1 || (x.sleepRisk !== undefined && x.sleepRisk !== 'none') ? 1 : 0;
    const tone = Math.max(tier === 'high' ? 2 : 1, cafTone, lightSleep) as 0 | 1 | 2;
    const cafAlso = caffeineAlsoSentence(x.sleepRisk ?? (x.extraSleepMin >= 1 ? 'delay' : 'none'), x.extraSleepMin);
    out.push({ icon: '🌙', q: 'Will I sleep well?', a: `${tier === 'low' ? 'Not quite' : 'Not as well'}: alcohol is still in your blood ${bedRel < 30 ? 'when you go to bed' : bedWord}. ${alcoholSleepSentence(tier)}${cafAlso}`, tone, tag: sleepTag,
      note: `Evidence A for the direction, B for the size. ${tier === 'low' ? 'Low' : tier === 'moderate' ? 'Moderate' : 'High'} dose for your weight (low ≤ 0.25 g/kg, high > 0.75 g/kg)`,
      title: 'Ebrahim 2013 (review of sleep-lab studies); Pietilä 2018 (4,098 people wearing heart monitors). How the dose bands map onto the lab studies is our estimate.' });
  // (also when a little caffeine is left that doesn't matter: rakija + cola at 21:00 used to get a flat "Yes")
  } else if (x.bac && (x.caffeineAtBedMg < 1 || (x.extraSleepMin < 5 && (x.sleepRisk ?? 'none') === 'none'))) out.push({ icon: '🌙', q: 'Will I sleep well?', a: `Probably: by ${hh(x.bedtimeMin)} almost no alcohol should be left in your blood. Sleep studies test alcohol taken shortly before bed, so for a drink this early we can’t promise zero effect.`, tone: lightSleep as 0 | 1 | 2, tag: sleepTag, note: 'Our estimate (C): no study read on alcohol that is already gone by bedtime' });
  else if (x.extraSleepMin >= 5) out.push({ icon: '🌙', q: 'Will I sleep well?', a: `It may take you about ${Math.round(x.extraSleepMin)} min longer to fall asleep (${bedRel < 90 ? 'you had it shortly before bed, so it reaches your blood while you fall asleep' : `${Math.round(x.caffeineAtBedMg)} mg of caffeine is still in you ${bedWord}`}).`, tone: Math.max(x.extraSleepMin >= 20 ? 2 : 1, lightSleep) as 0 | 1 | 2, note: sleepNote, tag: sleepTag });
  // below the 5-min delay: "too little" only when it is also under the meta-analysis level (VS1); otherwise be honest
  // that caffeine-sensitive people can still sleep less (VS4), e.g. an espresso at 20:45 leaves ≈ 51 mg at 23:00
  else if (x.sleepRisk === 'sensitive' || (x.sleepRisk === 'delay' && x.extraSleepMin < 5)) out.push({ icon: '🌙', q: 'Will I sleep well?', a: `Probably, unless caffeine affects you easily. ${bedRel < 90 ? 'You had it shortly before bed, so the caffeine reaches your blood while you fall asleep' : `About ${Math.round(x.caffeineAtBedMg)} mg is still in you ${bedWord}`}: most people sleep normally with that much, but sensitive people may sleep a little less or more lightly.`, tone: Math.max(1, lightSleep) as 0 | 1 | 2, note: sleepNote, tag: sleepTag });
  else out.push({ icon: '🌙', q: 'Will I sleep well?', a: x.caffeineAtBedMg >= 10 ? `Yes. The ${Math.round(x.caffeineAtBedMg)} mg of caffeine left ${bedWord} is too little to affect your sleep.` : hasCaffeine
      // had it right at (or after) bedtime: the caffeine is still on its way in, not "gone" (wave 7; cola at 23:00)
      ? (bedRel < 30 ? 'Yes. There is only a little caffeine in it: too little to affect your sleep, even this close to bed.' : 'Yes. Almost no caffeine is left by bedtime.')
      : 'Yes: it has no caffeine or alcohol.', tone: lightSleep as 0 | 1 | 2, note: sleepNote, tag: sleepTag });
  // Best time (caffeine): the latest time that leaves sleep untouched
  if (x.latestForSleep !== undefined && x.latestForSleep !== null) {
    const late = (x.drinkAt > x.latestForSleep && x.drinkAt < x.bedtimeMin) || afterBed;
    const tag = pn ? 'you' as const : undefined;
    if (x.bedtimeMin - x.latestForSleep <= 30) out.push({ icon: '⏰', q: 'When is the best time?', a: 'Any time today: this much caffeine is too little to affect your sleep.', tone: 0, tag });
    else out.push({ icon: '⏰', q: 'When is the best time?', a: `Before ${hh(x.latestForSleep)}, so the caffeine is too low to cut into your sleep at ${hh(x.bedtimeMin)}.${late ? ' You had it after that.' : ''}`, tone: late ? 1 : 0, tag });
  }
  // Driving: never a "safe" time and never one exact number. Widmark estimates are off by 20–40% (alcohol.md W6),
  // and attention is already worse from 0.2 g/L (AL4), so the only honest answer is "don't".
  if (x.bac) {
    let peak = 0, peakMin = 0;
    for (let m = 0; m < x.bac.length; m++) if (x.bac[m] > peak) { peak = x.bac[m]; peakMin = m; }
    // paced: the same drinks all at once, for "what did spreading change" (and where the other livers' slope starts)
    const once = x.pace?.bacOnce;
    let oncePeak = 0, oncePeakMin = 0;
    if (once) for (let m = 0; m < once.length; m++) if (once[m] > oncePeak) { oncePeak = once[m]; oncePeakMin = m; }
    const overH = x.pace ? `${x.pace.overMin / 60} h` : '';
    const paceTxt = x.pace && once ? ` (${x.pace.doses} drinks spread over ${overH}; all at once about ${bacRangeText(oncePeak)})` : '';
    out.push({ icon: '🚗', q: 'Can I drive?', a: `No. Don’t drive after drinking: this app can’t tell you when you’re safe. Your peak is likely about ${bacRangeText(peak)}${paceTxt}. The range runs from 40% below to 50% above our estimate, because bodies differ.`, tone: 2,
      tag: pn ? 'you' : undefined,
      note: pn ? (pn.withMeal
        ? `For you: after a meal the peak is about ${Math.round(FED_PEAK_RATIO[0] * 100)}–${Math.round(FED_PEAK_RATIO[1] * 100)}% of the peak on an empty stomach (evidence ${FACTORS.withMeal.level})`
        : x.alcoholFed ? 'For your sex, height and weight, with the food in this meal (lower than on an empty stomach)'
        : 'For your sex, height and weight, on an empty stomach') : undefined });
    // Danger: the top of the range reaches the levels seen in alcohol-poisoning deaths [AL9, Jones & Holmgren 2003]
    if (poisonRisk(peak)) out.push({ icon: '🚑', q: 'Is this much dangerous?', a: `Yes. The top of your range (${bacRangeText(peak)}) reaches levels at which people have died of alcohol poisoning (most such deaths: 2.2–5 ‰). If someone can’t be woken, breathes slowly or irregularly, vomits or has a seizure, call the emergency number (112 in Europe). Blood alcohol can keep rising after drinking stops.`, tone: 2,
      note: 'Evidence A: 693 deaths from alcohol poisoning (Jones & Holmgren 2003); warning signs from NIAAA', title: 'We show this when the top of our range (model + 50%) reaches 2.2 ‰, the 5th percentile of blood alcohol in deaths from acute alcohol poisoning.' });
    // When is it gone? The liver works at a fixed speed, 0.10–0.20 ‰ an hour for most people, asleep or awake [AL2, A].
    // The model's own day stops at 24 h: past that we say so and extrapolate at the same speed (never a silent cut).
    const clk = alcoholClock(x.bac, once ? oncePeakMin : undefined);
    const day = (m: number) => clockLabel(x.drinkAt, m);
    const hrs = (m: number) => { const h = m / 60; return h < 1.5 ? `${Math.max(1, Math.round(m / 10) * 10)} min` : `${h < 10 ? Math.round(h * 2) / 2 : Math.round(h)} h`; };
    // [AL14, AL16]: the liver clears a fixed amount an hour from the first sip, so spreading moves the peak, not the end
    const goneOnce = once ? alcoholClock(once).goneMin : null;
    const spread = x.pace && goneOnce !== null
      ? (clk.goneMin - goneOnce <= 30
        ? ` Spreading the drinks over ${overH} lowered the peak, not the end: it is gone at about the same time as all at once.`
        : ` Spread this thinly, one drink is almost gone before the next, so it ends about ${hrs(clk.goneMin - goneOnce)} later than all at once.`)
      : (x.alcoholG ?? 0) > 21 ? ` This assumes you drink it all at once${x.canPace ? ' (pick “Over how long?” to spread it)' : ''}; spread over an evening the peak is lower, but it is gone at about the same time.` : '';
    // paced: when the evening peaks (after the last drink), then when it is gone
    const peakLine = x.pace ? `Highest around ${at0(peakMin)}, after the last drink (about ${bacRangeText(peak)}). ` : '';
    out.push({ icon: '⏳', q: 'When is the alcohol gone?', a: peakLine + (clk.beyond24
      ? `Not within the 24 hours shown here. A typical body like yours needs about ${hrs(clk.goneMin)}, until around ${day(clk.goneMin)}; with a slow liver until about ${day(clk.latestMin)}, with a fast one about ${day(clk.earliestMin)}. Sleep, coffee, water or a shower don’t speed it up.${spread}`
      : `In a typical body like yours around ${day(clk.goneMin)}, about ${hrs(clk.goneMin)} after the first sip. Livers clear about 0.10–0.20 ‰ an hour, so for most people somewhere between ${day(clk.earliestMin)} and ${day(clk.latestMin)}. Sleep, coffee, water or a shower don’t speed it up.${spread}`),
      tone: clk.beyond24 ? 2 : 1, tag: pn ? 'you' : undefined,
      note: 'Evidence A for the liver speed (Jones 2010); the times are our estimate (C)', title: 'Typical time from our model; the earliest and latest times re-run the same downslope at 0.20 and 0.10 ‰ per hour. Your body water can shift them further (see the peak range).' });
    // The next morning (evening or night drinking): the honest answer, with the range across people. Never "safe".
    const wakeRel = (((x.wakeMin ?? 7 * 60) - x.drinkAt) % 1440 + 1440) % 1440;
    const evening = x.drinkAt >= 12 * 60 || x.drinkAt < (x.wakeMin ?? 7 * 60);
    if (evening && wakeRel >= 60) {
      const W = day(wakeRel).replace(' tomorrow', '');
      const typ = clk.typicalAt(wakeRel), slow = clk.slowAt(wakeRel);
      const limits = ' Limits differ by country. In Croatia: 0.5 ‰ for most drivers and 0 ‰ for novice and professional drivers.';
      const a = typ >= 0.2
        ? `No. At ${W} a typical body like yours would still have about ${bacRangeText(typ)} in the blood${typ >= 0.5 ? ', even above the general 0.5 ‰ limit' : ''}. Sleeping doesn’t make it go faster.`
        : typ > GONE_GL
          ? `No. At ${W} a typical body like yours would still have a little alcohol in the blood (about ${bacRangeText(typ)}): a breath test can be positive.`
          : slow > GONE_GL
            ? `Not for sure. A typical body like yours would be clear by ${day(clk.goneMin)}, but with a slow liver some alcohol could still be there at ${W} (up to about ${slow.toFixed(2)} ‰), and a breath test can be positive.`
            : `The alcohol itself should be gone by ${W}, even with a slow liver. But a hangover can still make you drive worse at 0 ‰, and this app can’t tell you you’re safe.`;
      out.push({ icon: '🌅', q: x.drinkAt >= 12 * 60 ? 'Can I drive tomorrow morning?' : 'Can I drive in the morning?', a: `${a}${limits}`, tone: typ > GONE_GL ? 2 : 1, tag: pn ? 'you' : undefined,
        note: 'Evidence A for the liver speed and the limits; B for hangover driving (Alford 2020)', title: `Your wake-up time (${W}) from “Your body”. A slow liver = 0.10 ‰ an hour. In 52 social drinkers half still blew positive the next morning, and both halves drove worse in a simulator.` });
    }
    // pregnancy: WHO — alcohol in pregnancy raises the risk of FASD (alcohol.md L12)
    if (pn?.pregnant) out.push({ icon: '🤰', q: 'And in pregnancy?', a: 'Best to have none: alcohol reaches the baby and raises the risk of lasting harm (WHO).', tone: 2, tag: 'you' });
  }
  // pregnancy and caffeine (model review 2026-10-22): the toggle already slows the clock (M8, M9); the safe amount is
  // also lower: EFSA 2015 finds no concern for the unborn child up to 200 mg a day from all sources
  else if (pn?.pregnant && (x.caffeineDoseMg ?? 0) >= 1) {
    const mg = Math.round(x.caffeineDoseMg ?? 0);
    out.push({ icon: '🤰', q: 'And in pregnancy?', a: `${mg > 200 ? `This is ${mg} mg, more than` : `This is ${mg} mg. Keep the whole day under`} the 200 mg of caffeine a day that EFSA considers safe in pregnancy${mg > 200 ? '.' : ' (all coffee, tea, cola and chocolate together).'} Late in pregnancy caffeine also stays in you about 2.6–3.5 times longer.`,
      tone: mg > 200 ? 2 : 1, tag: 'you', note: 'Evidence A: EFSA 2015 (safety of caffeine); Parsons 1982, Knutti 1982 (half-life)' });
  }
  // Energy as walking: ACSM walking equation, net of rest, at 5 km/h (science/walking.ts; activity.md E1–E2).
  // One formula everywhere; it falls as body weight rises and ignores age and height (they are not in the equation).
  if (x.kcal >= 5) {
    const min = Math.round(walkingMinutes(x.kcal, x.weightKg));
    const km = walkingKm(x.kcal, x.weightKg);
    out.push({ icon: '🚶', q: 'How much energy is that?', a: `${Math.round(x.kcal)} kcal ≈ ${min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`} of brisk walking for you${km >= 1 ? ` (about ${km >= 10 ? Math.round(km) : km.toFixed(1).replace(/\.0$/, '')} km)` : ''}.`, tone: 0, tag: pn ? 'you' : undefined,
      note: pn ? 'Energy used on top of sitting still, at 5 km/h, for your weight' : undefined });
  } else out.push({ icon: '🚶', q: 'How much energy is that?', a: 'Almost none.', tone: 0 });
  // alcohol: beer with ≤ ≈ 40 g of alcohol was tested (no extra urine); wine and spirits give a little more urine for
  // 4 h; more than that was never tested, so no plain "Yes" [AL7, AL13: Maughan 2016, Polhuis 2017]
  const aG = x.bac ? x.alcoholG ?? 0 : 0;
  const beerLike = aG > 0 && aG / Math.max(1, x.waterMl) < 0.06;
  // caffeine (model review 2026-10-20, claim WK2): normal coffee, tea and cola hydrate like water (Killer 2014, Maughan
  // 2016); only big doses make you pee more for a few hours: 6 mg/kg did, 3 mg/kg did not, even in daily drinkers (Seal
  // 2017); ≥ 250–300 mg in people off caffeine (Maughan & Griffin 2003)
  const cafMg = x.caffeineDoseMg ?? 0, daily = !!pn?.factors.includes('caffeineDaily');
  const bigCaf = cafMg >= 6 * Math.max(30, x.weightKg) || (!daily && cafMg >= 300);
  if (x.waterMl >= 100) out.push({ icon: '💧', q: 'Does it count as water?', tone: 0, tag: pn ? 'typical' : undefined,
    a: aG > 40 ? `Not reliably: it has about ${Math.round(x.waterMl)} ml of water, but studies only tested drinks with up to about 30–40 g of alcohol, so we don’t know how much of it you keep with this much.`
      : aG > 1 && !beerLike ? `Mostly: it gives about ${Math.round(x.waterMl)} ml of water, but wine and spirits make you pee a little more for a few hours (no difference after 24 hours).`
      : bigCaf ? `Mostly: it gives about ${Math.round(x.waterMl)} ml of water, but ${Math.round(cafMg)} mg of caffeine at once can make you pee a little more for a few hours${daily ? '' : ', especially if you rarely have caffeine'}. Normal amounts of coffee, tea or cola count like water.`
      : `Yes: it gives your body about ${Math.round(x.waterMl)} ml of water.${cafMg >= 10 ? ' The caffeine doesn’t change that at this amount.' : ''}`,
    ...(aG > 1 ? { note: 'Evidence B: urine after beer, wine and spirits with 30 g of alcohol (Polhuis 2017); 1 liter of lager (Maughan 2016)' }
      : cafMg >= 10 ? { note: 'Evidence B: coffee vs water in 50 daily coffee drinkers (Killer 2014); 3 vs 6 mg/kg caffeine (Seal 2017)' } : {}) });
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
