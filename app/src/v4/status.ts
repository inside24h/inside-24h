// Traffic-light status per body system, minute by minute, so nobody has to read numbers.
// green = working optimally, yellow = mild stress, red = overload. The cut-offs are OUR simplified scale
// (level C), anchored on published categories where they exist (noted per system), and shown in "How is this decided?".
import { at, type Timeline } from '../science/espressoSim';
import type { Vitals } from '../science/daily';
import { bacRangeText } from '../science/ranges';
import type { TipKey } from '../content/tips';

export type Level = 0 | 1 | 2; // green, yellow, red
export interface System {
  key: 'energy' | 'heart' | 'water' | 'brain';
  label: string;
  organ: string; // where the camera goes when you tap it
  levels: Uint8Array; // one per minute, 0..1440
  says: (lvl: Level, m: number) => string; // plain sentence for that moment
  rule: string; // how the colour is decided
  unknown?: boolean; // no data to judge (e.g. a food without a measured glycaemic index)
  /** next step for that moment (content/tips.ts), only when the light is yellow or red */
  tip?: (lvl: Level, m: number) => TipKey | null;
}

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
  const brain = fill((m) => {
    const a = alc(m);
    const fromAlc: Level = a >= 0.5 ? 2 : a >= 0.2 ? 1 : 0;
    if (asleep(m)) return Math.max(fromAlc, a > 0.02 ? 1 : 0, v.extraLatencyMin >= 20 ? 2 : v.extraLatencyMin >= 5 ? 1 : 0) as Level;
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

  const word = ['working well', 'under mild stress', 'overloaded'];
  return [
    {
      key: 'energy', label: 'Energy & sugar', organ: 'pancreas', levels: energy, unknown: sugarUnknown,
      rule: 'Green: blood sugar within 1.5 mmol/L of where you started. Yellow: a jump of 1.5–3 mmol/L, a dip of 0.5–1 mmol/L, or above 7.8. Red: a jump over 3, a dip over 1, or above 10 mmol/L.',
      says: (l, m) => {
        const d = at(v.effect.glucose, m) / 18;
        if (sugarUnknown) return 'Not measured for this food (no glycaemic index yet), so we don’t judge it.';
        if (l === 0) return 'Steady energy: your blood sugar is where it should be.';
        return d > 0 ? `Sugar spike: your energy is ${word[l]}. Insulin is working to bring it down.` : `Energy dip: blood sugar below where you started. You may feel hungry or tired.`;
      },
      tip: (l, m) => (l === 0 || sugarUnknown ? null : at(v.effect.glucose, m) >= 0 ? 'sugarSpike' : 'sugarDip'),
    },
    {
      key: 'heart', label: 'Heart & pressure', organ: 'heart', levels: heart,
      rule: 'Green: the drink adds under 5 mmHg / 5 beats and your pressure is below 130. Yellow: +5–10 or 130–139 (AHA stage 1). Red: over +10 or 140 and above (AHA stage 2).',
      says: (l) => (l === 0 ? 'Your heart is working normally.' : l === 1 ? 'Slightly raised pressure or pulse: mild stress.' : 'High pressure or a fast pulse: your heart is overloaded right now.'),
      tip: (l) => (l === 0 ? null : 'heart'),
    },
    {
      key: 'water', label: 'Hydration', organ: 'kidney_l', levels: water,
      rule: 'Compared with an ordinary mild (22 °C) day on which you drink as usual. Heat makes your skin and lungs lose more water (Meade 2024, measured at 22–36 °C). Yellow: about 1% of your body weight short (thirst zone). Red: 2% or more (dehydration; attention and coordination get worse — Liska 2019, Wittbrodt 2018). Water in this food or drink counts; coffee, cola and beer in normal amounts hydrate like water (Maughan 2016).',
      says: (l, m) => {
        const T = hyd ? Math.round(at(hyd.temp, m)) : null;
        const inYou = hyd ? at(hyd.drinkMl, m) : 0;
        const where = hyd && T !== null ? `${hyd.city.split(',')[0]} now ≈ ${T} °C. ` : '';
        if (l === 2) return `${where}You’re short of water: your cells are drying out. Drink now.`;
        if (l === 1) return `${where}Heat is draining water: you may feel thirsty. Have a glass of water.`;
        if (inYou >= 20) return `${where}+${Math.round(inYou)} ml of water from this is in you right now.`;
        return `${where}${waterMl >= 1 ? 'Water levels normal.' : 'Almost no water in this; levels normal.'}`;
      },
      tip: (l) => (l === 0 ? null : 'water'),
    },
    {
      key: 'brain', label: 'Brain & sleep', organ: 'brain', levels: brain,
      rule: 'By day: green under 200 mg caffeine in your body (EFSA: safe single dose), yellow 200–400, red over 400. Alcohol: yellow from 0.2 ‰ (attention already worse), red from 0.5 ‰ (reaction time and balance; Croatian driving limit). At night: yellow if caffeine delays your sleep by 5–20 minutes or alcohol is still in your blood, red if more.',
      says: (l, m) => {
        const a = alc(m);
        // a range, never one number: Widmark estimates are off by 20–40% (alcohol.md W6)
        if (a >= 0.5) return `Blood alcohol about ${bacRangeText(a)}: reaction time and balance are worse. Don’t drive.`;
        if (a >= 0.2) return `Blood alcohol about ${bacRangeText(a)}: your attention is already worse. Don’t drive.`;
        if (asleep(m) && a > 0.02) return 'Alcohol is still in your blood: lighter, more broken sleep later in the night.';
        if (a > 0.02) return `A little alcohol (about ${bacRangeText(a)}). Not zero: don’t drive.`;
        if (asleep(m)) return l === 0 ? 'Sleeping normally.' : `Caffeine is delaying your sleep by about ${Math.round(v.extraLatencyMin)} minutes.`;
        return l === 0 ? (caffeine.doseMg >= 1 && at(caffeine.body, m) >= 10 ? 'A little more alert, nothing to worry about.' : 'Your brain is working normally.') : l === 1 ? 'A lot of caffeine: you may feel jittery.' : 'Too much caffeine: racing heart and anxiety are likely.';
      },
      tip: (l, m) => (alc(m) > 0.02 ? 'alcohol' : l === 0 ? null : 'caffeine'),
    },
  ];
}

/** The day in one or two plain sentences: which parts of you are affected, when, and which are not. */
export function verdict(systems: System[], drinkAt: number): string {
  const hh = (m: number) => `${String(Math.floor((drinkAt + m) / 60) % 24).padStart(2, '0')}:${String(Math.floor(drinkAt + m) % 60).padStart(2, '0')}`;
  const NAME: Record<System['key'], string> = { energy: 'sugar', heart: 'heart', water: 'water', brain: 'brain' };
  const parts: string[] = [], calm: string[] = [];
  for (const s of systems) {
    const spans: [number, number, number][] = []; // from, to, worst level
    for (let m = 0; m < s.levels.length; m++) {
      const l = s.levels[m];
      if (l > 0) {
        const last = spans[spans.length - 1];
        if (last && m - last[1] <= 10) { last[1] = m; last[2] = Math.max(last[2], l); } else spans.push([m, m, l]);
      }
    }
    if (!spans.length) { calm.push(NAME[s.key]); continue; }
    const words = spans.slice(0, 2).map(([a, b, l]) => `${l === 2 ? 'overload' : 'mild stress'} ${hh(a)}–${hh(b + 1)}`);
    parts.push(`${s.label}: ${words.join(', then ')}`);
  }
  const calmTxt = calm.length ? `${calm.length === 4 ? 'Sugar, heart, water and brain' : calm.map((c, i) => (i ? c : c[0].toUpperCase() + c.slice(1))).join(calm.length > 2 ? ', ' : ' and ')}: no real effect.` : '';
  return parts.length ? `${parts.join('. ')}. ${calmTxt}`.trim() : `Your body handles this easily. ${calmTxt}`;
}

export const worst =(systems: System[], m: number): Level => systems.reduce((w, s) => Math.max(w, s.levels[Math.round(Math.min(1440, m))]) as Level, 0 as Level);
/** First minute a system reaches its worst level of the day (where to jump when tapped). */
export function worstMoment(s: System): number {
  let best = 0, at0 = 0;
  for (let m = 0; m < s.levels.length; m++) if (s.levels[m] > best) { best = s.levels[m]; at0 = m; }
  return at0;
}
