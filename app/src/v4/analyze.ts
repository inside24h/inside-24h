// One place that turns "this food + this person + this city" into everything the screen needs to judge it:
// the model run, vitals, traffic lights and quick answers. Used for the second item in Compare and for swaps.
import { cmpName, isPluralName, lowerName, plainLatin } from './video-names';
import { buildVitals } from '../science/daily';
import { sleepAnchors } from '../science/anchors';
import { simulateHydration } from '../science/hydration';
import { MG_DL_PER_MMOL_L, totalBodyWaterL, type Profile } from '../science/profile';
import { bodyStatus, type System } from './status';
import { quickAnswers } from './Answers';
import { climateNow, findCity, cityLabel } from './climate/cities';
import { isPlain, macros, type Part } from './food/parse';
import { makeFoodProduct } from './food/foodProduct';
import { amountPhrase, capFirst } from './food/naming';
import { canPace, cleanPace } from './food/meal';
import { PRODUCTS } from './products';

const WATER_ML: Record<string, number> = { espresso: 29, cola: 295, water: 250 };
const T50_OF: Record<string, number> = { espresso: 13, cola: 32, water: 13 };
const CURATED = new Set(['espresso', 'cola', 'water']);

/** `overMin` = "Over how long?" (PACING, 2026-10-19; 0 = all at once). One serving has nothing to spread. */
export function analyze(parts: Part[], p: Profile, overMin = 0) {
  const one = parts.length === 1 ? parts[0] : null;
  // the curated models only for the plain default (a decaf espresso or a 500 ml cola uses the generic model)
  const curated = one && isPlain(one.food) && CURATED.has(one.food.id) && Math.abs(one.grams - one.food.serving.grams) < 1 ? one.food.id : null;
  const def = curated ? PRODUCTS[curated] : makeFoodProduct(parts, 'food', cleanPace(overMin));
  const built = def.build(p, 63);
  const v = buildVitals(p, built.caffeine, sleepAnchors(), true, built.effects);
  const city = findCity(p.city);
  const waterMl = built.waterMl ?? (curated ? WATER_ML[curated] : 0);
  const hyd = city ? { ...simulateHydration(p, climateNow(city), waterMl, built.t50 ?? (curated ? T50_OF[curated] : 13), v.asleep, !!p.airCon), city: cityLabel(city) } : undefined;
  const m = macros(parts);
  const unknownSugar = !curated && m.gl === null && m.availCarbs >= 3;
  const systems = bodyStatus(built.caffeine, v, waterMl, built.bac, hyd, unknownSugar);
  const answers = quickAnswers({
    systems, drinkAt: p.drinkAtMin, bedtimeMin: p.bedtimeMin, weightKg: p.weightKg, kcal: built.energy.total,
    glucoseDeltaMgDl: unknownSugar ? undefined : built.effects.glucoseMgDl ?? new Float64Array(1441),
    extraSleepMin: v.extraLatencyMin, caffeineAtBedMg: v.mgAtBed, caffeineDoseMg: built.caffeine.doseMg, sleepRisk: v.sleepRisk, bac: built.bac, alcoholG: built.alcoholG, alcoholFed: built.alcoholFed, wakeMin: p.wakeMin, waterMl,
    glucoseUnit: p.glucoseUnit, // Compare shows the unit picked in "Your body"
    pace: built.pace, canPace: !curated && canPace(parts),
  });
  const g = built.effects.glucoseMgDl;
  const sugarPeak = unknownSugar ? null : g ? Math.max(0, ...Array.from(g.subarray(0, 600))) / 18.016 : 0;
  return { name: def.content.name, color: built.story.color, built, systems, answers, sugarPeak, glucose: unknownSugar ? undefined : g, kcal: built.energy.total, macros: m,
    sleepDelayMin: v.extraLatencyMin, // minutes caffeine adds to falling asleep (verdictOf)
    caffeineAtBedMg: v.mgAtBed, toBedMin: v.toBedMin, bodyWaterL: totalBodyWaterL(p), waterMl, weightKg: p.weightKg, // (v22: the video's spoken facts, video-facts.ts)
    // the name for Compare, its video and verdict: with the amount when it is not one usual serving ("2 espressos",
    // "3 × 500 ml of beer"), so "Beer vs Beer" or "Espresso … 127 mg" never hides how much (QA 2026-10-23)
    label: one && Math.abs(one.grams - one.food.serving.grams) > 1 ? capFirst(amountPhrase(one).replace(/ \([^)]*\)/g, '')) : def.content.name,
    // how much, in a few words, for the comparison video (round 5: "1 can · 330 ml" vs "330 ml")
    serving: one ? servingText(one.amountLabel) : `${Math.round(parts.reduce((a, x) => a + x.grams, 0))} g` };
}
export type Analysis = ReturnType<typeof analyze>;
/** "1 × can (≈ 330 ml)" → "1 can · 330 ml"; "330 ml" stays; "Whole · 1104 g" stays. */
export function servingText(label: string): string {
  const m = /^(\d+(?:\.\d+)?|½) × ([^(]+?) \(≈ ([^)]+)\)$/.exec(label.trim());
  if (m) return `${m[1]} ${m[2].trim()} · ${m[3]}`;
  return label.replace(/[()≈]/g, '').replace(/\s+/g, ' ').trim();
}

type Unit = Profile['glucoseUnit'];
/** "+2.3 mmol/L" or "+41 mg/dL": a sugar CHANGE (given in mmol/L) in the unit picked in "Your body". */
export function sugarDeltaText(mmol: number, unit: Unit = 'mmol/L', withUnit = true): string {
  const sign = mmol > 0 ? '+' : mmol < 0 ? '−' : '';
  const v = unit === 'mg/dL' ? `${Math.round(Math.abs(mmol) * MG_DL_PER_MMOL_L)}` : Math.abs(mmol).toFixed(1);
  return `${sign}${v}${withUnit ? ` ${unit}` : ''}`;
}
/** The peak for Compare and the comparison video: "not measured", "steady" or "+2.3 mmol/L" / "+41 mg/dL". */
export const sugarPeakText = (peakMmol: number | null, unit: Unit = 'mmol/L') =>
  peakMmol === null ? 'not measured' : peakMmol < 0.3 ? 'steady' : sugarDeltaText(peakMmol, unit);

/**
 * Which one is easier on the body over the day, in one plain sentence (Compare, the comparison video and its caption).
 * Score = minutes any system is under stress (yellow 1, red 3; systems without data are skipped) + energy (1 point per
 * 50 kcal). Close scores = a draw.
 *
 * Alcohol is a different kind of harm from a sugar peak or a late coffee (a toxin, WHO/IARC Group 1; impaired attention,
 * lighter sleep), and the minute score does not weigh that, so (prelaunch QA 2026-10-23):
 * - only one side has alcohol: the alcohol-free side wins ("no alcohol"), unless its own score is clearly worse (a big
 *   sugar peak, caffeine at bedtime) — then it is a trade-off that names both costs. Alcohol never "wins".
 * - both have alcohol: the one with less alcohol is "the lighter choice" (no trophy); same alcohol → a lower peak, else close.
 * - a winner is only named when we can say why in words; otherwise it is close.
 */
/** "Espresso wins", "3 espressos win" (round 12: the verb agrees with a counted plural). */
/** Round 17: a name inside a sentence ("orange juice"), unless an acronym or brand-like ("USDA", "McFlurry"). */
const lowerIn = (s: string) => (/^[A-Z][a-z]/.test(s) && !/^[A-Z][a-z]+[A-Z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const winsOf = (label: string) => `${label} ${isPluralName(label) ? 'win' : 'wins'}`; // (round 18, critic T-4: "Black olives win")
/** Round 18 (critic T-2): a treat never gets a trophy: mostly added sugar, mostly (saturated) fat, fried or processed. */
export function isTreat(x: Pick<Analysis, 'kcal' | 'macros' | 'label' | 'name'>): boolean {
  const k = Math.max(1, x.kcal), mm = x.macros;
  return 4 * mm.freeSugars >= 0.4 * k || (9 * mm.fat >= 0.7 * k && mm.satFat >= 0.3 * mm.fat) || mm.satFat >= 10
    || /\b(chips|fries|crisps|salami|bacon|sausages?|frankfurter|hot dog|pepperoni|nuggets|candy|chocolate|nutella|cake|cookies?|donuts?|doughnuts?|ice cream|(?<!peanut |nut )butter|lard|cream|sugar|honey|jam|syrup|energy drink|cola|lemonade|soda)\b/i.test(`${x.label} ${x.name}`);
}
/** `guess`: the comparison video's question, when there is one: one tie rule for all its text (round 17, critic G-1:
 *  "Banana raised blood sugar more." next to "It's close: … about the same."). */
export function verdictOf(a: Analysis, b: Analysis, unit: Unit = 'mmol/L', guess?: { tie: boolean } | null): string {
  const skip = a.sugarPeak === null || b.sugarPeak === null; // compare like with like
  const stressOf = (x: Analysis, key: System['key']) => {
    const s = x.systems.find((y) => y.key === key);
    if (!s || s.unknown || (skip && key === 'energy')) return 0;
    let t = 0; for (let m = 0; m < s.levels.length; m++) t += s.levels[m] === 2 ? 3 : s.levels[m];
    return t;
  };
  const score = (x: Analysis) => stressOf(x, 'energy') + stressOf(x, 'heart') + stressOf(x, 'water') + stressOf(x, 'brain') + x.kcal / 50;
  const near = (x: number, y: number) => Math.abs(x - y) < Math.max(3, 0.1 * Math.max(x, y));
  const alc = (x: Analysis) => ((x.built.alcoholG ?? 0) > 1 ? x.built.alcoholG! : 0);
  const bacPeak = (x: Analysis) => (x.built.bac ? Math.max(0, ...Array.from(x.built.bac)) : 0);
  const caf = (x: Analysis) => x.built.caffeine.doseMg;
  const cafStress = (x: Analysis) => stressOf(x, 'brain') + stressOf(x, 'heart'); // only used when the other side has no alcohol
  const sugarOk = (x: Analysis, y: Analysis) => !skip && x.sugarPeak !== null && y.sugarPeak !== null;
  // (round 16, critic V-1: the same amount of each reads as its own sentence; round 17, critic P0-1: "the same 250 ml
  // of 250 ml of cola": the bare names, never the amount twice; names in a sentence are lower case)
  const amt = (s: string) => /(\d+(?:[.,]\d+)?\s*(?:ml|g))/i.exec(s.split('·').pop() ?? s)?.[1];
  const sameAmt = !!amt(a.serving) && amt(a.serving) === amt(b.serving);
  const bare = (x: Analysis) => lowerName(cmpName(x.label)); // (round 18, critic V-5: "Cevapi" everywhere, lower case in a sentence)
  const pair = [bare(a), bare(b)].sort(); // (in either order the same sentence)
  // an answer that named a difference: the rest is about the same ("Apart from that, …")
  const lead = guess && !guess.tie ? 'Apart from that,' : 'It’s close:';
  const close = sameAmt ? `${lead} the same amount of ${pair[0]} and ${pair[1]} hits your body about the same way.` : `${lead} ${pair[0]} and ${pair[1]} affect your body about the same.`;

  /** why w is easier on the body than l, in words (alcohol aside) */
  const reasons = (w: Analysis, l: Analysis) => {
    const why: string[] = [];
    if (sugarOk(w, l) && l.sugarPeak! - w.sugarPeak! >= 0.4)
      why.push(w.sugarPeak! < 0.3 ? 'no blood sugar peak' : `a smaller blood sugar peak (${sugarDeltaText(w.sugarPeak!, unit, false)} vs ${sugarDeltaText(l.sugarPeak!, unit)})`);
    else if (sugarOk(w, l) && stressOf(l, 'energy') - stressOf(w, 'energy') >= 30 && stressOf(l, 'energy') >= 1.5 * stressOf(w, 'energy'))
      why.push('less time with raised blood sugar');
    if (!alc(w) && !alc(l) && caf(l) - caf(w) >= 20 && cafStress(l) - cafStress(w) >= 10) {
      if (l.sleepDelayMin >= 5 && w.sleepDelayMin <= l.sleepDelayMin - 3) why.push(caf(w) < 1 ? 'no caffeine to keep you awake' : 'less caffeine at bedtime');
      else why.push(caf(w) < 1 ? 'no caffeine' : `less caffeine (${Math.round(caf(w))} vs ${Math.round(caf(l))} mg)`);
    }
    if (l.kcal - w.kcal >= 30) why.push(`${Math.round(l.kcal - w.kcal)} fewer kcal`);
    return why;
  };
  /** Round 18: everything x does better than y (lower sugar peak, kcal, caffeine, saturated fat; more protein, fiber).
   *  Master audit 2026-11-12 (C1): each edge is tagged, so the trophy rule can tell health-relevant edges from the rest. */
  type Edge = { k: 'sugar' | 'kcal' | 'sleep' | 'caffeine' | 'satFat' | 'protein' | 'fiber'; t: string };
  const edgeList = (x: Analysis, y: Analysis): Edge[] => {
    const out: Edge[] = [];
    if (sugarOk(x, y) && y.sugarPeak! - x.sugarPeak! >= 0.4) out.push({ k: 'sugar', t: x.sugarPeak! < 0.3 ? 'no blood sugar peak' : `a smaller blood sugar peak (${sugarDeltaText(x.sugarPeak!, unit, false)} vs ${sugarDeltaText(y.sugarPeak!, unit)})` });
    if (y.kcal - x.kcal >= 30 && y.kcal - x.kcal >= 0.1 * y.kcal) out.push({ k: 'kcal', t: `${Math.round(y.kcal - x.kcal)} fewer kcal` });
    // caffeine counts when it weighs on the body (brain / heart lights), as before: a morning espresso is fine
    if (!alc(x) && !alc(y) && caf(y) - caf(x) >= 20 && cafStress(y) - cafStress(x) >= 10) {
      if (y.sleepDelayMin >= 5 && x.sleepDelayMin <= y.sleepDelayMin - 3) out.push({ k: 'sleep', t: caf(x) < 1 ? 'no caffeine to keep you awake' : 'less caffeine at bedtime' });
      else out.push({ k: 'caffeine', t: caf(x) < 1 ? 'no caffeine' : `less caffeine (${Math.round(caf(x))} vs ${Math.round(caf(y))} mg)` });
    }
    if (y.macros.satFat - x.macros.satFat >= 2 && y.macros.satFat >= 1.5 * x.macros.satFat) out.push({ k: 'satFat', t: 'less saturated fat' });
    if (x.macros.protein - y.macros.protein >= 5 && x.macros.protein >= 1.5 * y.macros.protein) out.push({ k: 'protein', t: 'more protein' });
    if (x.macros.fiber - y.macros.fiber >= 3 && x.macros.fiber >= 1.5 * y.macros.fiber) out.push({ k: 'fiber', t: 'more fiber' });
    return out;
  };
  const edges = (x: Analysis, y: Analysis) => edgeList(x, y).map((e) => e.t);
  /** Round 18: a treat never gets a trophy: mostly added sugar, mostly (saturated) fat, fried or processed meat. */
  const treat = isTreat;
  /** Master audit 2026-11-12 (C1, owner brief §16): a trophy only when one side is better on at least two independent,
   *  health-relevant measures (blood sugar, saturated fat, alcohol, caffeine that delays sleep, kcal, fiber; at least
   *  one of the first four), never on "no caffeine" or "more protein", and only when the result does not flip at the
   *  same amount: at portions more than 30 % apart every reason must still hold gram for gram, and the other side may
   *  not be clearly better gram for gram. Otherwise each side's facts, neutrally. `noAlcohol`: w is alcohol-free
   *  against an alcoholic l (a key reason of its own). Returns the trophy's reasons, or null. */
  const HEALTH: Edge['k'][] = ['sugar', 'satFat', 'sleep', 'kcal', 'fiber'], KEY: Edge['k'][] = ['sugar', 'satFat', 'sleep'];
  const perG = (x: Analysis, k: 'kcal' | 'satFat' | 'fiber' | 'availCarbs' | 'caffeine') => (k === 'kcal' ? x.kcal : k === 'caffeine' ? caf(x) : x.macros[k]) / Math.max(1, x.macros.grams);
  const holdsPerGram = (e: Edge, w: Analysis, l: Analysis) =>
    e.k === 'kcal' ? perG(w, 'kcal') < 0.9 * perG(l, 'kcal') : e.k === 'satFat' ? perG(w, 'satFat') < perG(l, 'satFat') : e.k === 'fiber' ? perG(w, 'fiber') > perG(l, 'fiber')
      : e.k === 'sugar' ? perG(w, 'availCarbs') <= perG(l, 'availCarbs') : e.k === 'sleep' ? perG(w, 'caffeine') < perG(l, 'caffeine') : true;
  const trophyReasons = (w: Analysis, l: Analysis, noAlcohol = false): string[] | null => {
    if (treat(w)) return null;
    let h = edgeList(w, l).filter((e) => HEALTH.includes(e.k)).sort((p, q) => Number(KEY.includes(q.k)) - Number(KEY.includes(p.k)));
    if (Math.max(w.macros.grams, l.macros.grams) > 1.3 * Math.max(1, Math.min(w.macros.grams, l.macros.grams))) {
      h = h.filter((e) => holdsPerGram(e, w, l)); // (portion-driven reasons do not count: "Dates win: 166 fewer kcal" against 28 g of walnuts)
      const flips = ((w.sugarPeak ?? 0) >= 0.3 && perG(l, 'availCarbs') < 0.75 * perG(w, 'availCarbs')) || (w.macros.satFat >= 1 && perG(l, 'satFat') < 0.75 * perG(w, 'satFat'))
        || perG(l, 'kcal') < 0.75 * perG(w, 'kcal');
      if (flips) return null;
    }
    if (h.length + (noAlcohol ? 1 : 0) < 2 || !(noAlcohol || h.some((e) => KEY.includes(e.k)))) return null;
    return [...(noAlcohol ? ['no alcohol'] : []), ...h.map((e) => e.t)].slice(0, 2);
  };

  /** what n costs the body that d does not (for a trade-off against an alcoholic d) */
  const costs = (n: Analysis, d: Analysis) => {
    const out: string[] = [];
    if (!skip && n.sugarPeak !== null && n.sugarPeak >= 0.3 && (d.sugarPeak === null || n.sugarPeak - d.sugarPeak >= 0.4) && stressOf(n, 'energy') > 0)
      out.push(d.sugarPeak !== null && d.sugarPeak >= 0.3 ? 'a bigger blood sugar peak' : 'a blood sugar peak');
    // a delay we can count; a lot by day (heart or ≥ 200 mg, EFSA); else the "maybe lighter sleep" tier at bedtime
    if (caf(n) >= 20 && cafStress(n) >= 10)
      out.push(n.sleepDelayMin >= 5 ? 'caffeine that delays your sleep' : stressOf(n, 'heart') >= 10 || caf(n) >= 200 ? 'a lot of caffeine' : 'caffeine at bedtime');
    if (n.kcal - d.kcal >= 100) out.push(`${Math.round(n.kcal - d.kcal)} more kcal`);
    return out;
  };

  // round 18 (critic V-5 / G-8: "Brie cheese", "Jam / preserves", "Ćevapi" in the verdict): the video's own names
  const nm = (x: Analysis) => (/^\d/.test(x.label) ? plainLatin(x.label) : cmpName(x.label));
  const alcA = alc(a), alcB = alc(b);
  if (!!alcA !== !!alcB) { // one side has alcohol
    const [n, d] = alcA ? [b, a] : [a, b];
    const sn = score(n), sd = score(d), cost = costs(n, d);
    // (round 12: any alcohol now weighs on the brain light, so the score alone would let a sugary or sleep-delaying
    // drink "win"; a real cost of its own always makes it a trade-off that names both)
    const ownCost = cost.some((c) => /blood sugar peak|delays your sleep/.test(c));
    if (cost.length && ((sn > sd && !near(sn, sd)) || ownCost)) return `No clear winner: ${nm(d)} brings alcohol; ${nm(n)} brings ${cost.slice(0, 2).join(' and ')}.`;
    // round 18 (critic T-2: "🏆 French fries wins: no alcohol"): a treat never gets a trophy, the facts side by side
    // (master audit 2026-11-12, C1: "Whole-wheat pasta wins: no alcohol" had one reason): a trophy needs a second
    // health reason that holds at the same amount; else the facts side by side (round 18's treat form)
    const tr = trophyReasons(n, d, true); void reasons; // (round 18's reasons(), kept for reference: trophyReasons replaced it here)
    if (!tr) return `${nm(n)}: no alcohol. ${nm(d)}: ${Math.round(alc(d))} g of alcohol.`;
    return `🏆 ${winsOf(nm(n))}: ${tr.join(', ')}.`;
  }
  if (alcA && alcB) { // both have alcohol: the amount of alcohol decides first, never a trophy
    const lo = Math.min(alcA, alcB), hi = Math.max(alcA, alcB);
    // (round 13, critic P1-3: "Red wine is the lighter choice" read as a recommendation): the fact, never a "choice"
    const lighter = (w: Analysis, _l: Analysis, first: string) => `${first.charAt(0).toUpperCase()}${first.slice(1).replace(/ \(/, `: ${nm(w)} (`)}${/\(/.test(first) ? '' : `: ${nm(w)}`}. Both: don’t drive.`; // (round 14, critic W-2: never a lone "less alcohol" that reads as a recommendation)
    if (hi - lo >= 3 && hi >= 1.2 * lo) {
      const [w, l] = alcA < alcB ? [a, b] : [b, a];
      const k = Math.round(hi / lo), hiG = Math.abs(hi / lo - k) < 0.03 ? k * Math.round(lo) : Math.round(hi); // 1 vs 2 beers: "20 g vs 40 g", not "vs 39 g"
      return lighter(w, l, `less alcohol (${Math.round(lo)} g vs ${hiG} g)`);
    }
    const pa = bacPeak(a), pb = bacPeak(b);
    if (Math.abs(pa - pb) >= 0.05) { const [w, l] = pa < pb ? [a, b] : [b, a]; return lighter(w, l, 'a lower blood alcohol peak'); }
    const two = bare(a) === bare(b) ? [lowerIn(a.label), lowerIn(b.label)].sort() : pair;
    return `${guess && !guess.tie ? 'Apart from that,' : 'It’s close:'} ${two[0]} and ${two[1]} bring about the same alcohol (about ${Math.round((alcA + alcB) / 2)} g). Both: don’t drive.`;
  }
  // round 18 (critic T-2: "🏆 Sugar wins", "🏆 Butter wins", "🏆 Potato chips wins"): a trophy only when one side is
  // better or equal on EVERY measure the video shows or the label knows (blood sugar, kcal, caffeine, saturated fat,
  // protein, fiber) and is not a treat (mostly added sugar, mostly saturated fat, fried or processed); otherwise each
  // side's own advantages, side by side (in name order, so the order of the pair never changes the sentence)
  const advA = edges(a, b), advB = edges(b, a);
  if (!advA.length && !advB.length) return close;
  // (master audit 2026-11-12, C1): and only with two health reasons that survive the same amount (trophyReasons);
  // a one-sided edge that does not earn a trophy is said as a plain fact ("Rocket salad: no caffeine.")
  for (const [w, l, adv, other] of [[a, b, advA, advB], [b, a, advB, advA]] as const) {
    if (!adv.length || other.length) continue;
    const tr = trophyReasons(w, l);
    return tr ? `🏆 ${winsOf(nm(w))}: ${tr.join(', ')}.` : `${nm(w)}: ${adv.slice(0, 2).join(', ')}.`;
  }
  const sides = ([[a, advA], [b, advB]] as [Analysis, string[]][]).sort((p, q) => nm(p[0]).localeCompare(nm(q[0])));
  const one = (x: Analysis, adv: string[]) => (adv.length ? `${nm(x)}: ${adv.slice(0, adv.length && sides.every(([, v]) => v.length) ? 1 : 2).join(', ')}.` : '');
  return sides.map(([x, adv]) => one(x, adv)).filter(Boolean).join(' ');
}

// Slower or lighter everyday swaps, by database id. Each is checked with the model before it is shown,
// so a swap only appears when it really lowers the sugar peak.
export const SWAPS: Record<string, string[]> = {
  cola: ['diet cola', 'glass of water', 'sparkling water'],
  'energy-drink': ['filter coffee', 'espresso'],
  'iced-tea': ['herbal tea', 'green tea'],
  lemonade: ['sparkling water'],
  'orange-juice': ['1 orange'],
  'apple-juice': ['1 apple'],
  smoothie: ['1 apple', '1 banana'],
  'chocolate-milk': ['glass of milk'],
  'hot-chocolate': ['glass of milk'],
  cornflakes: ['oatmeal', 'muesli'],
  'rice-cakes': ['almonds', 'peanuts'],
  'potato-boiled': ['pasta', 'lentils'],
  'potato-mashed': ['pasta', 'lentils'],
  'rice-white': ['pasta', 'lentils'],
  'bread-white': ['rye bread', 'chickpeas'],
  doughnut: ['1 apple', 'plain yogurt'],
  'cake-sponge': ['1 apple', 'strawberries'],
  'yogurt-fruit': ['greek yogurt'],
  honey: ['strawberries'],
  sugar: ['strawberries'],
  jam: ['peanut butter'],
  fries: ['pasta'],
  watermelon: ['strawberries', '1 apple'],
  raisins: ['grapes', '1 apple'],
  'dried-apricots': ['1 apple'],
  dates: ['1 apple'],
};
