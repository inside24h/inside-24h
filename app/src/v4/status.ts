// Traffic-light status per body system, minute by minute, so nobody has to read numbers.
// green = fine, yellow = mild stress, red = high stress. The cut-offs are OUR simplified scale
// (level C), anchored on published categories where they exist (noted per system), and shown in "How is this decided?".
import { at, type Timeline } from '../science/espressoSim';
import { SLEEP_WINDOW_MIN, type Vitals } from '../science/daily';
import { bacRangeText } from '../science/ranges';
import { alcoholTier, GONE_GL, poisonRisk } from '../science/alcoholClock';
import type { TipKey } from '../content/tips';

export type Level = 0 | 1 | 2; // green, yellow, red
export interface System {
  key: 'energy' | 'heart' | 'water' | 'brain';
  label: string;
  organ: string; // where the camera goes when you tap it
  levels: Uint8Array; // one per minute, 0..1440
  says: (lvl: Level, m: number) => string; // plain sentence for that moment
  rule: string; // how the colour is decided
  unknown?: boolean; // no data to judge (e.g. a food without a measured glycemic index)
  /** next step for that moment (content/tips.ts), only when the light is yellow or red */
  tip?: (lvl: Level, m: number) => TipKey | null;
  /** gentler words for the day summary when a yellow span starting at minute m only means "maybe" (verdict) */
  soft?: (m: number) => { word: string; tail: string } | undefined;
  /** the day summary for a light that stays green but should not read "no real effect" (e.g. a little alcohol) */
  calmNote?: (clock: (m: number) => string) => string;
}

/** Short names for the small lights (Simple view, Compare, video). "Blood sugar", never "Sugar" alone: next to a
 *  sugar-free drink "Sugar fine" reads like a statement about sugar IN the drink (sense audit 2026-10-18). */
export const SHORT_LABEL: Record<System['key'], string> = { energy: 'Blood sugar', heart: 'Heart', water: 'Water', brain: 'Brain' };

const N = 1441;
const fill = (f: (m: number) => Level) => { const a = new Uint8Array(N); for (let m = 0; m < N; m++) a[m] = f(m); return a; };

export interface HydInfo { percent: Float64Array; temp: Float64Array; drinkMl: Float64Array; extraPerDayMl: number; city: string }

export function bodyStatus(caffeine: Timeline, v: Vitals, waterMl: number, bac?: Float64Array, hyd?: HydInfo, sugarUnknown = false): System[] {
  const asleep = (m: number) => at(v.asleep, m) > 0.5;

  // Energy: change in blood sugar against YOUR own starting level (mg/dL; 18 mg/dL = 1 mmol/L).
  const energy = fill((m) => {
    const d = at(v.effect.glucose, m), g = at(v.glucose, m);
    if (g >= 180 || d >= 54 || d <= -18) return 2;
    if (d >= 27 || d <= -9 || g >= 140) return 1;
    return 0;
  });
  // Heart: change from the drink, plus your own level (AHA: 130–139 = stage 1, ≥ 140 = stage 2).
  const heart = fill((m) => {
    const dS = at(v.effect.sbp, m), dH = at(v.effect.hr, m), s = at(v.sbp, m);
    if (s >= 140 || dS >= 10 || dH >= 10) return 2;
    if (s >= 130 || dS >= 5 || dH >= 5) return 1;
    return 0;
  });
  // Brain & sleep: caffeine by day (EFSA: up to 200 mg at once is fine), delayed sleep at night.
  // Alcohol (g/L = ‰): attention worse from 0.2, reaction time and balance from 0.5 (Jongen 2014; Croatian limit 0.5).
  const alc = (m: number) => (bac ? at(bac, m) : 0);
  let alcFrom = -1, alcTo = -1;
  if (bac) for (let m = 0; m < Math.min(N, bac.length); m++) if (bac[m] > 0.02) { if (alcFrom < 0) alcFrom = m; alcTo = m; }
  const hasAlc = alcFrom >= 0;
  // "night" = asleep, or in bed falling asleep (lights-out to 90 min after, the window the sleep answer looks at)
  const bedAt = v.toBedMin;
  const night = (m: number) => asleep(m) || (bedAt !== undefined && m >= bedAt && m <= bedAt + SLEEP_WINDOW_MIN);
  // cautious caffeine tier ('sensitive', or a delay under 5 min) and the level at minute m is still above that anchor
  const cautiousNow = (m: number) => v.sleepRisk !== 'none' && v.extraLatencyMin < 5 && caffeine.doseMg >= 1
    && (v.cautiousConc === undefined || at(caffeine.conc, m) > v.cautiousConc);
  const brain = fill((m) => {
    const a = alc(m);
    // (round 12, critic P0-1: any alcohol in the blood is at least yellow, one ladder for every drink: alcoholTier)
    const tier = alcoholTier(a), fromAlc: Level = tier === 'balance' || tier === 'danger' ? 2 : tier !== 'none' ? 1 : 0;
    // at night: yellow also for the cautious tier ('sensitive', or a delay under 5 min), so the light never says
    // "Fine" while the sleep answer says sensitive people may sleep less (wave 6; science/daily.ts sleepRiskOf)
    // The cautious tier is yellow only while the blood level is still above the cautious anchor (VS1), not until
    // morning: "sleep may be a little lighter" is about the hours caffeine is actually there (wave 7)
    if (night(m)) return Math.max(fromAlc, a > 0.02 ? 1 : 0, v.extraLatencyMin >= 20 ? 2 : v.extraLatencyMin >= 5 ? 1 : cautiousNow(m) ? 1 : 0) as Level;
    const mg = caffeine.doseMg >= 1 ? at(caffeine.body, m) : 0;
    return Math.max(fromAlc, mg >= 400 ? 2 : mg >= 200 ? 1 : 0) as Level;
  });
  // Water: compared with a normal mild day. 1% of body weight short = thirst zone (yellow), 2% = hypohydration (red)
  // (Liska 2019). Single drinks here never make you lose more than they contain (Maughan 2016).
  const water = fill((m) => {
    if (!hyd) return 0;
    const pc = at(hyd.percent, m);
    return pc <= 0.5 ? 2 : pc <= 50 ? 1 : 0;
  });

  return [
    {
      key: 'energy', label: 'Blood sugar & energy', organ: 'pancreas', levels: energy, unknown: sugarUnknown,
      rule: 'This light is about the sugar in your BLOOD, not the sugar in the food. Green: blood sugar within 1.5 mmol/L of where you started. Yellow: a jump of 1.5–3 mmol/L, a dip of 0.5–1 mmol/L, or above 7.8. Red: a jump over 3, a dip over 1, or above 10 mmol/L. Alcohol has no sugar curve of its own; it slows the liver’s sugar-making, which can lower blood sugar hours later after a long fast, heavy drinking or with diabetes medicines (not drawn).',
      says: (l, m) => {
        const d = at(v.effect.glucose, m) / 18;
        // alcohol: no curve of its own, but it slows the liver's sugar-making [AL10 B, AL11 B]
        const alcNote = hasAlc ? ' Alcohol slows your liver’s sugar-making for hours: after a long fast, heavy drinking or with insulin or diabetes tablets, blood sugar can dip later, even the next morning.' : '';
        if (sugarUnknown) return `Not measured for this food (no glycemic index yet), so we don’t rate it.${alcNote}`;
        if (l === 0) return hasAlc && Math.abs(d) < 0.3 ? `No rise in blood sugar from the alcohol itself.${alcNote}` : `Steady energy: your blood sugar is in its normal range.${alcNote}`;
        return d > 0 ? `Blood sugar peak: ${l === 2 ? 'a big rise' : 'a moderate rise'}. Insulin is bringing it back down.` : 'Energy dip: your blood sugar is below where you started. You may feel hungry or tired.';
      },
      tip: (l, m) => (l === 0 || sugarUnknown ? null : at(v.effect.glucose, m) >= 0 ? 'sugarSpike' : 'sugarDip'),
    },
    {
      key: 'heart', label: 'Heart & pressure', organ: 'heart', levels: heart,
      rule: 'Green: this adds less than 5 mmHg or 5 beats a minute, and your pressure is below 130. Yellow: +5–10, or 130–139 (AHA stage 1). Red: more than +10, or 140 and above (AHA stage 2).',
      says: (l) => (l === 0 ? 'Your heart is working normally.' : l === 1 ? 'Pulse or blood pressure slightly up: mild stress that your body handles easily.' : 'Pulse or blood pressure clearly up: your heart is working harder for now.'),
      // "have your resting pressure checked" only when YOUR own pressure is the reason, not a short rise from the drink
      // (sense audit: 10 beers or 3 colas showed a resting-pressure tip for a pulse rise caused by the drink)
      tip: (l, m) => (l === 0 || at(v.sbp, m) - at(v.effect.sbp, m) < 130 ? null : 'heart'),
    },
    {
      key: 'water', label: 'Hydration', organ: 'kidney_l', levels: water,
      rule: 'Compared with an ordinary mild (22 °C) day on which you drink as usual. Heat makes your skin and lungs lose more water (Meade 2024, measured at 22–36 °C). Yellow: about 1% of your body weight short (thirst zone). Red: 2% or more (dehydration; attention and coordination get worse — Liska 2019, Wittbrodt 2018). Water in this food or drink counts; coffee, cola and beer in normal amounts hydrate like water (Maughan 2016).',
      says: (l, m) => {
        const T = hyd ? Math.round(at(hyd.temp, m)) : null;
        const inYou = hyd ? at(hyd.drinkMl, m) : 0;
        const where = hyd && T !== null ? `${hyd.city.split(',')[0]} now ≈ ${T} °C. ` : '';
        if (l === 2) return `${where}You’re short of water: attention and coordination can start to suffer. Have some water now.`;
        if (l === 1) return `${where}The heat is costing you water, so you may feel thirsty. Have a glass of water.`;
        if (inYou >= 20) return `${where}+${Math.round(inYou)} ml of water from this is in you right now.`;
        return `${where}${waterMl >= 1 ? 'Water levels are normal.' : 'Almost no water in this; your levels are normal.'}`;
      },
      tip: (l) => (l === 0 ? null : 'water'),
    },
    {
      key: 'brain', label: 'Brain & sleep', organ: 'brain', levels: brain,
      rule: 'By day: green under 200 mg of caffeine in your body (EFSA: no safety concern as a single dose), yellow 200–400 mg, red over 400 mg. Alcohol: yellow while any alcohol is in your blood (not zero; from 0.2 ‰ attention is worse, and we say “may be” while our range only reaches it), red from 0.5 ‰ (reaction time and balance; the EU driving limit, 0.05 %; the US limit is 0.08 % = 0.8 ‰); when the top of our range reaches 2.2 ‰ we add a danger warning (the lowest levels seen in deaths from alcohol poisoning). At night: yellow if caffeine delays your sleep by up to 20 minutes, while enough is left that caffeine-sensitive people may sleep a little less, or if alcohol is still in your blood (even one drink makes the second half of the night lighter); red if caffeine delays sleep by more than 20 minutes or blood alcohol is 0.5 ‰ or more.',
      says: (l, m) => {
        const a = alc(m);
        // a range, never one number: Widmark estimates are off by 20–40% (alcohol.md W6)
        // the top of the range reaches the level seen in alcohol-poisoning deaths (≥ 2.2 ‰) [AL9]
        if (poisonRisk(a)) return `Blood alcohol about ${bacRangeText(a)}: dangerous. People have died of alcohol poisoning from about 2.2 ‰. If someone can’t be woken or breathes slowly, call the emergency number (112 in Europe).`;
        if (a >= 0.5) return `Blood alcohol about ${bacRangeText(a)}: reaction time and balance are worse. Don’t drive.`;
        if (alcoholTier(a) === 'worse') return `Blood alcohol about ${bacRangeText(a)}: your attention is already worse. Don’t drive.`;
        if (alcoholTier(a) === 'may') return `Blood alcohol about ${bacRangeText(a)}: your attention may already be worse. Don’t drive.`;
        if (night(m) && a > 0.02) return 'Alcohol is still in your blood: you may fall asleep faster, but the second half of the night is often lighter and more broken.';
        if (a > 0.02) return `A little alcohol (about ${bacRangeText(a)}). Not zero: don’t drive.`;
        if (night(m) && (l > 0 || asleep(m))) return l === 0 ? 'Sleeping normally.' : v.extraLatencyMin >= 1 ? `Caffeine is delaying your sleep by about ${Math.max(1, Math.round(v.extraLatencyMin))} minutes.`
          : 'Most people sleep normally with this much caffeine, but sensitive people may sleep a little less or more lightly.';
        return l === 0 ? (caffeine.doseMg >= 1 && at(caffeine.body, m) >= 10 ? (v.sleepRisk !== 'none' ? 'A little more alert. Fine for now, but some will still be in you at bedtime.' : 'A little more alert. Nothing to worry about.') : 'Your brain is working normally.') : l === 1 ? 'A lot of caffeine: you may feel jittery.' : 'A very high caffeine level: a racing heart and anxiety are likely.';
      },
      tip: (l, m) => (alc(m) > 0.02 ? 'alcohol' : l === 0 ? null : 'caffeine'),
      // the cautious caffeine tier at night is a "maybe" for sensitive people, not stress (wave 7)
      soft: (m) => (night(m) && alc(m) <= 0.02 && cautiousNow(m) ? { word: 'maybe lighter sleep', tail: ' if caffeine affects you easily' }
        // (round 12: a little alcohol is yellow now; its span says what it is, not "mild stress")
        : alcoholTier(alc(m)) === 'low' && !night(m) ? { word: 'a little alcohol in your blood', tail: ', not zero: don’t drive' } : undefined),
      // a little alcohol that never turns the light yellow is still not "no real effect": the driving answer says No
      calmNote: hasAlc ? (clock) => `a little alcohol in your blood ${clock(alcFrom)}–${alcTo >= N - 1 && bac && at(bac, N - 1) > GONE_GL ? 'past 24 h' : clock(alcTo + 1)}, not zero: don’t drive` : undefined,
    },
  ];
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** The day in one or two plain sentences: which parts of you are affected, when, and which are not. */
export function verdict(systems: System[], drinkAt: number): string {
  const hh = (m: number) => `${String(Math.floor((drinkAt + m) / 60) % 24).padStart(2, '0')}:${String(Math.floor(drinkAt + m) % 60).padStart(2, '0')}`;
  const NAME: Record<System['key'], string> = { energy: 'blood sugar', heart: 'heart', water: 'water', brain: 'brain' };
  const parts: string[] = [], calm: string[] = [];
  // a span that runs to the end of the 24 h is not "19:01–19:01" (that read as one minute): say it goes on
  const end = (b: number, l: number[] | Uint8Array) => (b >= l.length - 1 ? 'past 24 h' : hh(b + 1));
  for (const s of systems) {
    // "not measured" is not "no real effect" (the light is grey)
    if (s.unknown) { parts.push(`${s.label}: not measured`); continue; }
    const spans: [number, number, number][] = []; // from, to, worst level
    for (let m = 0; m < s.levels.length; m++) {
      const l = s.levels[m];
      if (l > 0) {
        const last = spans[spans.length - 1];
        if (last && m - last[1] <= 10) { last[1] = m; last[2] = Math.max(last[2], l); } else spans.push([m, m, l]);
      }
    }
    if (!spans.length) { const note = s.calmNote?.(hh); if (note) parts.push(`${s.label}: ${note}`); else calm.push(NAME[s.key]); continue; }
    // "mild stress 16:13–16:42 and again 17:15–18:17" (same level twice), "mild stress …, then high stress …" otherwise
    // a yellow span that only means "maybe, for sensitive people" gets its own gentle words (System.soft, wave 7)
    const softs = spans.slice(0, 2).map(([a, , l]) => (l === 1 ? s.soft?.(a) : undefined));
    const words = spans.slice(0, 2).map(([a, b, l], i) => {
      const soft = softs[i];
      if (soft) return `${soft.word} ${hh(a)}–${end(b, s.levels)}${soft.tail}`;
      return `${i === 1 && l === spans[0][2] && !softs[0] ? 'again' : l === 2 ? 'high stress' : 'mild stress'} ${hh(a)}–${end(b, s.levels)}`;
    });
    parts.push(`${s.label}: ${words.length === 2 && spans[1][2] === spans[0][2] ? words.join(' and ') : words.join(', then ')}`);
  }
  const calmTxt = calm.length ? `${calm.length === 4 ? 'Blood sugar, heart, water and brain' : calm.length > 2 ? `${cap(calm.slice(0, -1).join(', '))} and ${calm[calm.length - 1]}` : cap(calm.join(' and '))}: no real effect.` : '';
  return parts.length ? `${parts.join('. ')}. ${calmTxt}`.trim() : `Your body handles this easily. ${calmTxt}`;
}

export const worst =(systems: System[], m: number): Level => systems.reduce((w, s) => Math.max(w, s.levels[Math.round(Math.min(1440, m))]) as Level, 0 as Level);
/** First minute a system reaches its worst level of the day (where to jump when tapped). */
export function worstMoment(s: System): number {
  let best = 0, at0 = 0;
  for (let m = 0; m < s.levels.length; m++) if (s.levels[m] > best) { best = s.levels[m]; at0 = m; }
  return at0;
}
