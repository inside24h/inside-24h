// Round 9 (2026-10-29): what a video says, as pure functions (moved out of AppV4.tsx unchanged, so the app and the
// tests build the SAME plan for any food or drink in the database: video-story.test.ts runs every one of them).
import { minutesFromU, uFromMinutes } from '../time';
import type { Profile } from '../science/profile';
import { chapterText } from './stories';
import { beatLines, eventMin, isCard, MORNING_NO_FACT, tooEarly, type BeatCtx } from './video-beats';
import { chooseGuess, guessSideOf, type Guess } from './video-guess';
import { hookClassOf, macrosOf, seedOf, type Hook } from './video-hook';
import { DULL, FPS, PACE_FAST, PACE_MEAL, planCompare, planVideo, readSeconds, SAFETY, sentences, stopValue, SURGE_FROM, TEASE_HUMAN, withLullCards, type Cut, type Plan, type PlanFx, type StopIn, type SurgeKind, type VFrame } from './video-plan';
import { bacPlain, cardNamed, DEFAULT_BAC_BODY, dominantAt, placeOfCard, SEG_FOCUS_V, inText, mainGauge, presentAt, sugarPlain, TG_GAUGE, SUGAR_CLAIM, sugarClaimTrue, takenUpAt, urinePeak, whereCard, whereGauge, type BuiltLike } from './video-body';
import { perceivedRuns, quietFrame, REGION, regionMaxS, seenOf } from './video-cam';
import { perceivedOf, sceneOf } from './video-telemetry';
import { at as atMin } from '../science/espressoSim';
import { ANY_GL } from '../science/alcoholClock';
import { worstMoment } from './status';
import { analyze, verdictOf, type Analysis } from './analyze';
import { parseMeal, type Part } from './food/parse';
import { amountPhrase } from './food/naming';
import type { PinnedGauge } from './share';

export const CMP_STOPS = [0, 20, 45, 90, 180, 360, 720, 1440]; // (round 6: the first minutes in one moment, so each side's stomach fact is never dropped with a short early stop)
export const CMP_SHORT = [0, 20, 90, 240, 720, 1440]; // 2026-10-24: the planner keeps what fits in 30 s; long gaps glide slower (video-plan moveS)

/** The video's short name: no grams in brackets; a long name keeps its first part ("A whole pizza with extra
 *  cheese, ham and mushrooms" → "A whole pizza"); the end card has the full name. */
// round 18: the names live in video-names.ts (one source for the video, the comparison and its verdict)
import { cmpName, nearSame, plainLatin, sameWords, shortName } from './video-names';
export { cmpName, plainLatin, shortName };

/** What the caption cards need to know (video-beats.ts): the short name, and the pacing as the model doses it. */
/** Phase 4h (critique M1): an alcoholic drink or mix said as what was drunk: each part with its amount, a drink with
 *  alcohol with its strength (% ABV, from its own alcohol per 100 g: ethanol 0.789 g/ml), joined by "+"
 *  ("40 ml rakija (40% ABV), 250 ml lemonade."); undefined for a single part or without alcohol. */
export function servingCard(parts: readonly Pick<Part, 'food' | 'amountLabel' | 'grams'>[]): string | undefined {
  const alc = (p: (typeof parts)[number]) => ((p.food.p?.alcoholG ?? 0) * p.grams) / 100;
  // (a mix only: a single drink's name card and hook already say its amount)
  if (parts.length < 2 || !parts.some((p) => alc(p) > 0.5)) return undefined;
  const xs = parts.map((p) => {
    const ml = Number(/^(\d+(?:\.\d+)?)\s*ml\b/.exec(p.amountLabel.trim())?.[1] ?? 0) || p.grams, abv = (100 * alc(p)) / 0.789 / ml;
    const s = plainLatin(amountPhrase(p)).replace(/\s*\([^)]*\)/g, '').replace(/\s+\/\s+[^,+]*$/, ''), k = s.indexOf(' of ');
    return { s, amt: k > 0 ? s.slice(0, k) : '', noun: k > 0 ? s.slice(k + 4) : s, abv: alc(p) > 0.5 ? (abv >= 10 ? Math.round(abv) : Math.round(abv * 10) / 10) : null };
  });
  // (a card is at most 8 words, video-beats isCard: "40 ml of rakija (40 % ABV) + 250 ml of lemonade." is said shorter)
  const forms = [
    xs.map((x) => `${x.s}${x.abv !== null ? ` (${x.abv}% ABV)` : ''}`).join(' + '),
    xs.map((x) => `${x.amt ? `${x.amt} ` : ''}${x.noun}${x.abv !== null ? ` (${x.abv}% ABV)` : ''}`).join(', '),
    xs.map((x) => `${x.amt ? `${x.amt} ` : ''}${x.noun}${x.abv !== null ? ` (${x.abv}%)` : ''}`).join(', '),
  ].map((s) => `${s.charAt(0).toUpperCase()}${s.slice(1)}.`);
  return forms.find((s) => s.trim().split(/\s+/).length <= 8);
}
export function beatCtx(name: string, built: { pace?: { doses: number; overMin: number; everyMin: number }; story: { chapters: { title: string }[] }; caffeine?: { doseMg: number; body?: ArrayLike<number> }; bac?: ArrayLike<number>; alcoholG?: number }, drinkAtMin?: number, serving?: string): BeatCtx {
  const last = built.story.chapters.find((c) => /^Last (drink|serving|round)$/.test(c.title));
  // (round 6: the blood alcohol peak, so "gone" is said from the gauge's own range)
  let pk = 0, pm = 0; if (built.bac && (built.alcoholG ?? 0) > 1) for (let m = 0; m <= Math.min(1440, built.bac.length - 1); m++) if (built.bac[m] > pk) { pk = built.bac[m]; pm = m; }
  return { name, pace: built.pace ? { ...built.pace, round: last ? last.title.split(' ')[1] : 'round' } : undefined,
    caffeineMg: built.caffeine && built.caffeine.doseMg >= 10 ? built.caffeine.doseMg : undefined, drinkAtMin,
    ...(pk > 0.01 ? { bacPeak: { g: pk, min: pm }, alcoholG: built.alcoholG } : {}), ...(serving ? { serving } : {}),
    // (phase 4k, M3: alcohol with caffeine says what caffeine is left when the alcohol is gone, from the model)
    ...(pk > 0.01 && built.caffeine?.body && built.caffeine.doseMg >= CAF_WITH_ALCOHOL_MG ? { caffeineLeft: (m: number) => Number(built.caffeine!.body![Math.max(0, Math.min(built.caffeine!.body!.length - 1, Math.round(m)))] ?? 0) } : {}) };
}

/** The minute of the main gauge's peak (alcohol, else a clear blood sugar rise, else caffeine), as mainGauge chooses:
 *  the video's cold open and its impact (2026-10-24 creative spec §2.2, §2.5). */
export type PeakIn = { bac?: Float64Array; alcoholG?: number; effects: { glucoseMgDl?: Float64Array }; caffeine: { doseMg: number; body: Float64Array } };
export function peakOf(b: PeakIn, sugarKnown: boolean): number | undefined {
  const arg = (sr: Float64Array) => { let bi = 0; for (let i = 1; i <= Math.min(1440, sr.length - 1); i++) if (sr[i] > sr[bi]) bi = i; return bi; };
  if ((b.alcoholG ?? 0) > 1 && b.bac) return arg(b.bac);
  const g = sugarKnown ? b.effects.glucoseMgDl : undefined;
  if (g && arg(g) > 0 && g[arg(g)] / 18.016 >= 0.5) return arg(g);
  if (b.caffeine.doseMg >= 20) return arg(b.caffeine.body);
  return undefined;
}

/** Round 12 (critic P0-3: crepes had no climax at all): the video's climax. The model's peak (peakOf) when there is
 *  one; else the story's most telling later moment, so every video has its impact and a clock that goes somewhere:
 *  a peak, the blood fat high, a dip, the large intestine, bedtime, then the most telling moment left. */
export const CLIMAX_TITLES = /peak|highest|Fat in your blood|dip|large intestine|Alcohol gone|Bedtime|Going to bed/i;
export function climaxOf(b: PeakIn, sugarKnown: boolean, chapters: { min: number; title: string; text?: string }[]): number | undefined {
  const p = peakOf(b, sugarKnown);
  if (p !== undefined) return p;
  const later = chapters.filter((c) => c.min >= 5 && c.min < 1440 && !DULL.test(c.title.trim()));
  const named = later.find((c) => CLIMAX_TITLES.test(c.title));
  if (named) return named.min;
  let best: (typeof later)[number] | undefined;
  for (const c of later) if (!best || stopValue({ min: c.min, title: c.title, text: c.text ?? '' }) > stopValue({ min: best.min, title: best.title, text: best.text ?? '' })) best = c;
  return best?.min;
}

/** Round 13 (critic P1-5: oat milk had a generic hook, though its GI is 69 against cow's milk's ~30): surprising facts
 *  the model itself shows, a drink against the thing people think it is like. Said only when the model's blood sugar
 *  peak is clearly higher (≥ 0.5 mmol/L and ≥ 30 % more), for the same profile. */
export const SURPRISE: [RegExp, string, string][] = [
  [/\boat milk\b/i, 'glass of milk', 'cow’s milk'], [/\brice milk\b/i, 'glass of milk', 'cow’s milk'],
  [/\borange juice\b/i, '1 orange', 'a whole orange'], [/\bapple juice\b/i, '1 apple', 'a whole apple'],
];
export function surpriseOf(label: string, sugarPeak: number | null, profile: Profile): { than: string; ratio: number } | undefined {
  const hit = SURPRISE.find(([re]) => re.test(label));
  if (!hit || sugarPeak === null) return undefined;
  const parts = parseMeal(hit[1]); if (!parts.length) return undefined;
  const ref = analyze(parts, profile);
  if (ref.sugarPeak === null) return undefined;
  return sugarPeak - ref.sugarPeak >= 0.5 && sugarPeak >= 1.3 * Math.max(0.01, ref.sugarPeak) ? { than: hit[2], ratio: sugarPeak / Math.max(0.01, ref.sugarPeak) } : undefined;
}

/** Round 14 (critic DC-1: decaf had no story, two 10 s stretches without a word): decaf's own caffeine, from the
 *  model, against the same serving of the regular drink, and the minute its (small) caffeine level peaks. */
export function decafOf(label: string, b: { caffeine: { doseMg: number; body: Float64Array } }, profile: Profile): { mg: number; regularMg: number; min: number } | undefined {
  if (!/\bdecaf/i.test(label) || !(b.caffeine.doseMg > 0)) return undefined;
  const parts = parseMeal(label.replace(/\bdecaf(?:feinated)?\s*/i, '')); if (!parts.length) return undefined;
  const reg = analyze(parts, profile).built.caffeine.doseMg;
  if (!(reg > 10 * b.caffeine.doseMg)) return undefined;
  let pk = 1; for (let m = 1; m <= Math.min(1440, b.caffeine.body.length - 1); m++) if (b.caffeine.body[m] > b.caffeine.body[pk]) pk = m;
  return { mg: b.caffeine.body[pk], regularMg: reg, min: Math.max(5, Math.min(240, pk)) }; // (round 15: the gauge's own number)
}

/** Phase 4k (critique 2026-11-21, M3): with alcohol, caffeine from this many mg is said with its dose (the model's
 *  story warns about it from here: food/foodProduct cafNote), and what is left when the alcohol is gone. */
export const CAF_WITH_ALCOHOL_MG = 10;
/** Phase 4k, M3: the card at the alcohol-gone moment ("Alcohol: gone. 37 mg caffeine: still in you."). */
export const ALC_GONE_CAF = 'Alcohol: gone.';
/** Phase 4k: the kidney card with the drink's own water (video-beats), and its form when that is the whole drink. */
export const KIDNEY_ML = /^Your kidneys filter its (\d+) ml of water\.$/, KIDNEY_ALL = 'Your kidneys filter all of it.';
/** A US standard drink: 14 g of alcohol (NIAAA). */
export const US_STD_DRINK_G = 14;
/** Phase 4k (M1): a where-card no place fits all the while it is on screen gives way to this (placesOnScreen). */
export const PLACE_NONE = 'It keeps moving through you.';
/** Phase 4k (critique 2026-11-21, M1): the clock's least pace (video-plan PACE_*) may show a moment's cards later than
 *  its minute; a card that says where most of it is ("The drink is mostly in your stomach.") must still be true at
 *  every frame it is on screen (video-4j M7, video-body dominantAt): else it says where it is then, true all the while
 *  (whereCard over those minutes), or PLACE_NONE. The plan's page keeps the same words. */
export function placesOnScreen(plan: Plan, b: BuiltLike): Plan {
  const fs = plan.frames, on = (f: VFrame) => f.phase === 'main' && (f.beat === 'hold' || (f.beat === 'glide' && (f.plateA ?? 1) >= 0.5));
  for (let i = 0; i < fs.length;) {
    const c = fs[i].cap, p = c && on(fs[i]) ? placeOfCard(c) : null;
    if (!c || !p) { i++; continue; }
    let j = i; while (j < fs.length && fs[j].cap === c && fs[j].phase === 'main' && (fs[j].beat === 'hold' || fs[j].beat === 'glide')) j++;
    const shown = fs.slice(i, j).filter(on);
    if (!shown.every((f) => dominantAt(b, Math.min(1440, f.m)) === p)) {
      const m0 = Math.floor(Math.min(1440, shown[0].m)), m1 = Math.ceil(Math.min(1440, shown[shown.length - 1].m));
      // (a card that takes its place is read in the time the card had: else PLACE_NONE, the shortest)
      const pg = plan.pages.find((x) => x.text === c && x.stop === fs[i].stop), fits = (s: string) => !pg || readSeconds(s) <= pg.s + 1 / FPS;
      const w = whereCard(b, m0, m1), alt = w && fits(w) && shown.every((f) => dominantAt(b, Math.min(1440, f.m)) === placeOfCard(w)) ? w : PLACE_NONE;
      for (let k = i; k < j; k++) fs[k].cap = alt;
      if (pg) pg.text = alt;
    }
    i = j;
  }
  return plan;
}
/** Phase 4k: a drink's alcohol in US standard drinks, as a card ("About 1.4 US standard drinks."). */
export const stdDrinksCard = (alcoholG: number) => { const n = Math.round((alcoholG / US_STD_DRINK_G) * 10) / 10; return n > 0.85 && n < 1.15 ? 'About 1 US standard drink.' : `About ${n} US standard drinks.`; };
/** Round 14 (critic: every hook question is answered on screen): the hook's own moment (decaf's caffeine) joins the
 *  story, and its answer card is said first at the payoff moment, which is then never left out. */
export function applyHook(stops: StopIn[], hook: { line1?: string; line2?: string; payoff?: string; payoffMin?: number; answer?: string; lead?: string; extra?: { min: number; title: string; lines: string[] } }, caffeineMg = 0,
  /** phase 4k: the drink's grams of alcohol (with caffeine: its dose is said from CAF_WITH_ALCOHOL_MG up) */ alcoholG = 0): StopIn[] {
  let out = stops.map((s) => ({ ...s, lines: s.lines ? [...s.lines] : undefined }));
  // the hook's number is said right after the name, on the first moment; round 16 (critic E-1: an energy drink never
  // said its 80 mg): 20 mg of caffeine or more is said there too, in the same card when it fits ("…, 80 mg of caffeine.")
  // (phase 4k, critique 2026-11-21, M3: vodka and an energy drink never said its caffeine: with alcohol, the dose is said
  // from CAF_WITH_ALCOHOL_MG up, the amount the model's story warns about)
  const s0 = out[0], alc = alcoholG > 1, cafMin = alc ? CAF_WITH_ALCOHOL_MG : 20;
  const had = caffeineMg >= cafMin && s0 ? (s0.lines ?? []).find((l) => /\d+ mg of caffeine/.test(l)) : undefined; // (said already: kept, and shown early)
  const caf = caffeineMg >= cafMin && s0 && !had ? `${Math.round(caffeineMg)} mg of caffeine` : null;
  let lead = hook.lead;
  if (caf && lead) { const j = `${lead.replace(/\.$/, '').replace(/^(\d+) g of sugar: about (\d+) teaspoons$/, '$2 teaspoons of sugar')}, ${caf}.`; if (j.split(/\s+/).length <= 8) lead = j; }
  if (s0) {
    const ls = (s0.lines ?? []).filter((l) => l !== hook.lead && l !== lead && l !== had);
    const add = [lead, had, caf && !(lead ?? '').includes(caf) ? `${caf.charAt(0).toUpperCase()}${caf.slice(1)}.` : null].filter((x): x is string => !!x);
    // (phase 4h, critique M7: the opening read two to four first-bite cards while the clock stood at +0:00: the hook's
    // number, already in the headline above, is the first moment's one card; its name follows only where there is room)
    // (phase 4h, critique M7: the opening read two to four first-bite cards while the clock stood at +0:00: the hook's
    // number comes first and only it must be said; the name card may give way where a stay on one region is too long)
    if (add.length) { s0.lines = [...add, ...ls]; s0.must = Math.min(s0.lines.length, add.length); }
    // (phase 4j, critique M5: "FIRST SIP / 250 ml of black tea." under the headline "250 ml of black tea.": a card that
    // says a line of the hook, on screen all along as the headline, is not said)
    // (phase 4k, critique 2026-11-21, M2: "FIRST SIP / 1 drink of aperol spritz." under "Aperol spritz: 14 g of
    // alcohol.", "16 g of fiber." under "1 portion of lentils: 16 g of fiber.": nor a card whose words are nearly all
    // the headline's, video-names nearSame, the same measure as the timeline check "card repeats title")
    const dup = (l: string) => [hook.line1, hook.line2].some((h) => !!h && nearSame(l, h));
    // (a name card the hook says without its amount is said with it, as the first sentence has it: "250 ml of sparkling
    // mineral water." under the headline "Sparkling mineral water.")
    const bareAmt = (l: string) => l.replace(/^\d+(?:[.,]\d+)?\s*(?:ml|g|l|cl)\s+of\s+/i, '');
    const first = sentences(s0.text)[0] ?? '', withAmt = /\d/.test(first) && first.length <= 46 && !dup(first) && !(s0.lines ?? []).includes(first) ? first : null;
    // (phase 4k, critique M2: "86 kcal in total." in a video about alcohol: kcal only when the hook asks about them)
    const kcalOff = alc && !/\bkcal\b/.test(`${hook.line1 ?? ''} ${hook.line2 ?? ''}`), filler = (l: string) => kcalOff && /\bkcal\b/.test(l);
    for (const s of out) if (s !== s0 && s.lines?.some(filler)) s.lines = s.lines.filter((l) => !filler(l));
    // (phase 4k: a kidney card whose water is the whole drink the hook names, "Your kidneys filter its 250 ml of water."
    // under "250 ml of sparkling mineral water.", says it is all of it: the voice never says a number twice)
    const hookMl = new Set([...`${hook.line1 ?? ''} ${hook.line2 ?? ''}`.matchAll(/(\d+) ml\b/g)].map((m) => m[1]));
    for (const s of out) if (s.lines?.some((l) => KIDNEY_ML.test(l))) s.lines = s.lines.map((l) => { const k = KIDNEY_ML.exec(l); return k && hookMl.has(k[1]) ? KIDNEY_ALL : l; });
    const kept0 = (s0.lines ?? []).filter((l) => !filler(l)).flatMap((l) => (!dup(l) ? [l] : withAmt && sameWords(bareAmt(l), bareAmt(first)) ? [withAmt] : []));
    // (when the hook's line was its only card, the first moment says its energy instead, from its own first sentence)
    const kc = /(\d+) kcal/.exec(s0.text)?.[1], energy = kc === undefined ? null : Number(kc) >= 1 ? `${kc} kcal in total.` : /\b0 g carbohydrate/.test(s0.text) ? 'No sugar, no calories.' : null;
    // (phase 4k: else what it is made of, from the same sentence: "61 g carbs, 26 g fat, 24 g protein."; a drink with
    // alcohol says its US standard drinks, 14 g of alcohol each (NIAAA), never a kcal card the hook did not ask for)
    const mac = /(\d+) g carbohydrate(?: \([^)]*\))?,\s*(\d+) g fat,\s*(\d+) g protein/.exec(s0.text);
    // (the two biggest, so the card stays short; none of the three: it says so)
    const macro = mac ? ([[Number(mac[1]), 'carbs'], [Number(mac[2]), 'fat'], [Number(mac[3]), 'protein']] as [number, string][]).filter(([g]) => g >= 1).sort((p, q) => q[0] - p[0]).slice(0, 2).map(([g, w]) => `${g} g ${w}`) : [];
    const macroCard = !mac ? null : macro.length === 2 ? `${macro.join(', ')}.` : macro.length === 1 ? `${macro[0]}, little else.` : 'No carbs, fat or protein.';
    const stdCard = alc ? stdDrinksCard(alcoholG) : null;
    const fresh = [alc ? stdCard : energy, macroCard].filter((x): x is string => !!x && isCard(x) && !dup(x) && !kept0.includes(x));
    // (the hook's number is still said on a card, round 14: a card that only repeated it says it with a fact of its own,
    // "26 g of fat, 584 kcal in total." under "Spaghetti carbonara: 26 g of fat.")
    // (an amount: a number with its unit, never the "2" of "2% milk")
    const amounts = (x: string) => [...x.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:g|mg|kcal|ml|teaspoons?)\b/g)].map((m) => m[1]);
    const hookNums = new Set(amounts(`${hook.line1 ?? ''} ${hook.line2 ?? ''}`));
    const lower1 = (g: string) => (/^[A-Z][a-z]/.test(g) && !/^[A-Z][a-z]*[A-Z]/.test(g) ? g.charAt(0).toLowerCase() + g.slice(1) : g);
    // (with the moment's own first fact, else a fresh one; the long and the short form: "150 kcal in total." → "150 kcal.")
    // (phase 4k: which fresh fact a food says with the hook's number, its kcal or its other big macro, by its own seed, so
    // two foods of a class with the same hook do not open alike: "21 g fat, 227 kcal." / "21 g fat, 9 g carbs.")
    const joinOrder = !alc && (seedOf(`${hook.line1 ?? ''} ${hook.line2 ?? ''}`) >>> 1) % 2 === 1 ? [...fresh].reverse() : fresh;
    const joinWith = (l: string) => {
      for (const f of [...kept0.filter((k) => /\d/.test(k)), ...joinOrder]) {
        const parts = f.replace(/[.!?]$/, '').split(', ').filter((p) => !(l.match(/\b(?:sugar|fat|protein|fiber|carbs?|kcal|alcohol|caffeine)\b/g) ?? []).some((w) => p.includes(w)));
        // (short, so the opening is no longer than its two cards were: "19 g natural sugar, 95 kcal.")
        const l0 = l.replace(/[.!?]$/, '').replace(/ in total$/, '').replace(/^(\d+(?:[.,]\d+)?) (g|mg|ml) of /, '$1 $2 ').replace(/natural (?:milk |fruit )sugar/, 'natural sugar');
        for (const g of [(parts[0] ?? '').replace(/ in total$/, ''), parts[0] ?? '', parts.join(', ')].filter(Boolean)) {
          const j = `${l0}, ${lower1(g)}.`;
          if (isCard(j) && !dup(j)) return { j, f };
        }
      }
      return null;
    };
    const numDup = (s0.lines ?? []).find((l) => !filler(l) && dup(l) && amounts(l).some((n) => hookNums.has(n)) && !kept0.some((k) => amounts(k).some((n) => hookNums.has(n))));
    const joined = numDup ? joinWith(numDup) : null;
    const kept1 = joined ? [joined.j, ...kept0.filter((k) => k !== joined.f)] : kept0.length ? kept0 : fresh.slice(0, 1);
    // (a first moment left with one card, where it had two, says a fresh fact second: never one card held 6-7 s)
    // (with alcohol, in the name card's place: its standard drinks, a card without an organ, so the opening's stay on the
    // stomach is not longer; "About 1.4 US standard drinks." or "1.4 US standard drinks." by the food's own seed, so two
    // alike cocktails do not run in step)
    // (its short form, never longer than the name card it takes the place of: "38 g carbs.")
    const short1 = (f: string) => (/^\d+ g \w+, /.test(f) ? `${f.split(', ')[0]}.` : f);
    const extra = fresh.filter((f) => !kept1.includes(f) && (!joined || f !== joined.f) && !kept1.some((k) => amounts(k).some((n) => amounts(f).includes(n)))).map(short1).sort((x, y) => (alc ? 0 : x.length - y.length))[0];
    const nameGone = !joined && !!s0.lines?.length && dup(s0.lines[0]);
    const lead1 = extra && extra === stdCard && seedOf(`${hook.line1 ?? ''} ${hook.line2 ?? ''}`) % 2 === 1 ? extra.replace(/^About /, '') : extra;
    // (the opening no longer than its first two cards were: a joined first card that is longer leaves no room for a second, so a
    // Short's stay on the stomach stays under its cap, e.g. "1 medium onion")
    const readAll = (ls: readonly string[]) => ls.reduce((a, l) => a + readSeconds(l), 0), roomFor = (f: string) => readAll([...kept1, f]) <= readAll((s0.lines ?? []).slice(0, 2)) + 0.1;
    const kept = kept1.length === 1 && (s0.lines ?? []).length >= 2 && extra && lead1 && (!joined || roomFor(extra)) ? (alc && nameGone ? [lead1, ...kept1] : [...kept1, extra]) : kept1;
    if (kept.length && kept.join('|') !== (s0.lines ?? []).join('|')) {
      const gone = (s0.lines ?? []).length - kept.length; s0.lines = kept;
      if (joined) s0.must = Math.max(1, Math.min(kept.length, s0.must ?? 1));
      else if (s0.must) s0.must = Math.max(0, Math.min(kept.length, s0.must - (add.some(dup) ? gone : 0))) || undefined;
    }
  }
  if (hook.extra) {
    const near = out.find((s) => Math.abs(s.min - hook.extra!.min) <= 5 && s.min > 0);
    if (near) near.lines = [...hook.extra.lines, ...(near.lines ?? []).filter((l) => !hook.extra!.lines.includes(l))];
    else out = [...out, { min: hook.extra.min, title: hook.extra.title, text: hook.extra.lines.join(' '), lines: [...hook.extra.lines], keep: true }].sort((x, y) => x.min - y.min);
  }
  const at = payoffMinOf(out, hook);
  const st = at === undefined ? undefined : out.find((s) => s.min === at) ?? out.find((s) => Math.abs(s.min - at) <= 5 && s.min > 0);
  if (st) { st.keep = true; if (hook.answer) st.lines = [hook.answer, ...(st.lines ?? []).filter((l) => l !== hook.answer)]; }
  return out;
}
/** The minute of the hook's payoff: its own moment, or the chapter it names. */
export function payoffMinOf(stops: { min: number; title: string }[], hook: { payoff?: string; payoffMin?: number }): number | undefined {
  if (hook.payoffMin !== undefined) return hook.payoffMin;
  return hook.payoff ? stops.find((s) => s.title === hook.payoff)?.min : undefined;
}

/** Round 13 (critic P0-2: salmon kept 3 cards for 40 s): a story-moment climax (no model peak) is not pulled to the
 *  first 15 s, which would leave out every moment before it; it lands by CLIMAX_BY_S. */
export const CLIMAX_BY_S = 40;
export const climaxFx = (b: PeakIn, sugarKnown: boolean, chapters: { min: number; title: string; text?: string }[], hook?: { extra?: { min: number } }) => {
  // (round 15, critic D-1: decaf's climax was the urine): the hook's own moment (decaf's caffeine) is the climax
  if (hook?.extra) return { peakMin: hook.extra.min, peakByS: CLIMAX_BY_S };
  // (round 15, critic N-1: cola's hero said 26 min, its lamp and its PEAK moment 20 min): a sugar climax is the
  // "Blood sugar peak" moment itself, the one minute the video, the gauge, the lamp and the hero all use
  const p = peakOf(b, sugarKnown), alc = (b.alcoholG ?? 0) > 1 && !!b.bac, sugarIsPeak = !alc && p !== undefined && p === peakOfSugar(b);
  const sugarMoment = sugarIsPeak ? chapters.find((c) => /^(Blood sugar peak|Sugar rises)$/.test(c.title))?.min : undefined;
  return { peakMin: sugarMoment ?? climaxOf(b, sugarKnown, chapters), ...(p === undefined ? { peakByS: CLIMAX_BY_S } : {}) };
};
/** Round 17: the end card's hero number (one source for the app and the text audit): the main gauge at the video's
 *  climax, with when ("+38 % · 45 min in"). */
export function heroOf(b: BuiltLike & PeakIn, sugarKnown: boolean, chapters: { min: number; title: string; text?: string }[], unit: Profile['glucoseUnit'], hook?: { extra?: { min: number }; lead?: string }): { big: string; small: string; /** phase 4j: the value is the series' own highest (the end card calls it "Peak") */ peak?: boolean } | undefined {
  const cm = climaxFx(b, sugarKnown, chapters, hook).peakMin;
  // (round 18, critic T-3: "2 mg caffeine · 8 h 33 min in" for hot chocolate): a few mg of caffeine is never the hero
  const g = cm === undefined ? undefined : gaugesAt(b, cm, unit, sugarKnown).find((x) => x.curve && !(/caffeine/.test(x.big) && b.caffeine.doseMg < 10));
  // (phase 4b: the climax is the PEAK, labelled so on the end card; a BAC keeps its body, "for a 70 kg man", B1)
  if (g && cm !== undefined) return { peak: true, big: `${g.big} · ${inText(cm)}`, small: g.small === 'still in your body' ? 'at its highest' : g.small }; // (phase 4h, critique B1: a BAC keeps both driving limits on the end card too)
  // round 17 (critic G-7: brie and cod ended without a number): the hook's own number ("41 g · protein")
  const m = /^(\d+(?:[.,]\d+)?)\s*(g|mg|kcal)\b(?:\s+of)?\s*([^.:,]*)/.exec(hook?.lead ?? '');
  if (m) return { big: `${m[1]} ${m[2]}`, small: m[3].trim() || 'in total' };
  const k = /(\d+) kcal/.exec(chapters[0]?.text ?? '')?.[1];
  if (k && Number(k) >= 5) return { big: `${k} kcal`, small: 'in total' };
  // a drink without calories: where it is at its kidney moment ("190 ml · Urine made in the last 3 h")
  const kid = chapters.find((c) => /Kidneys|Bladder/.test(c.title));
  // (phase 4j, critique M2: the end card calls it the peak: the urine's own highest value of the day, urinePeak)
  const up = urinePeak(b);
  if (up) return { peak: true, big: `${up.big} · ${inText(up.min)}`, small: up.small };
  const w = whereGauge(b, kid?.min ?? cm ?? 120);
  return w ? { big: `${w.big} · ${inText(kid?.min ?? cm ?? 120)}`, small: w.small } : undefined;
}
/** Phase 4e (critique M-A: a comparison with alcohol showed its BAC without the driving limits): a drink's blood alcohol
 *  peak as the gauge says it (bacPlain: the range, the body, the US 0.08 % and EU 0.05 % limits); undefined without alcohol. */
export function bacPeakText(b: BuiltLike & { alcoholG?: number }): string | undefined {
  if (!b.bac || (b.alcoholG ?? 0) <= 1) return undefined;
  let pk = 0; for (let m = 0; m <= Math.min(1440, b.bac.length - 1); m++) pk = Math.max(pk, b.bac[m]);
  return pk > ANY_GL ? bacPlain(pk, undefined, b.bacBody) : undefined;
}
/** Phase 4e (critique M-C: lentils and pizza asked "How much has left you a day later?" and the end card said "Blood
 *  sugar: back to usual"): the end card answers the hook's own question, from the model. A question about what is left
 *  a day later: what is still in you at 24 h (the route model) and the share that has left (the 24 h moment); when its
 *  fat reaches the blood: the blood fat peak, at its moment; how long in the stomach: its half time; when it reaches
 *  the blood: that moment; how long the alcohol stays: the gone range under "back to zero"; its protein: its grams. The
 *  hero and the 24 h line are otherwise heroOf and after24Of. */
export function endCardOf(b: BuiltLike & PeakIn, sugarKnown: boolean, chapters: { min: number; title: string; text?: string }[], unit: Profile['glucoseUnit'], hook: Hook): { hero?: { big: string; small: string; peak?: boolean }; after24: { big: string; small: string } } {
  let hero = heroOf(b, sugarKnown, chapters, unit, hook), after24 = after24Of(b, sugarKnown);
  const cls = hookClassOf(hook), atCh = (t: string | undefined) => (t ? chapters.find((c) => c.title === t && c.min > 0) : undefined);
  if (cls === 'day' || cls === 'dayN' || cls === 'fiberDay') {
    const day = chapters.find((c) => /% has left your body so far/.test(c.text ?? '')), pct = /(\d+)% has left your body so far/.exec(day?.text ?? '')?.[1];
    const w = presentAt(b, 1440).length ? whereGauge(b, 1440) : null;
    if (w) after24 = { big: `Still in you: ${w.big}`, small: pct ? `${w.small} · ${pct} % has left your body` : w.small };
    else if (pct) after24 = { big: `${pct} % has left your body`, small: 'The rest is still on its way' };
    // (phase 4h, critique M8: "How far have 378 kcal gotten by tomorrow?" was answered in grams of fiber): a question
    // about its kcal is answered in kcal, the model's own absorbed energy at 24 h
    const kq = cls === 'dayN' ? /(\d+) kcal/.exec(`${hook.line1} ${hook.line2}`)?.[1] : undefined, en = (b as { energy?: { total: number; absorbed?: (t: number) => number } }).energy;
    if (kq && en?.absorbed) { const ab = Math.round(Math.min(Number(kq), en.absorbed(1440))); after24 = { big: ab >= Number(kq) - 1 ? `All ${kq} kcal taken up by your body` : `${ab} of ${kq} kcal taken up by your body`, small: after24.big.startsWith('Still in you') ? `${after24.big} · ${after24.small}` : after24.small }; }
  } else if (cls === 'fatBlood') {
    const ch = atCh(hook.payoff), tg = b.effects.tgMmol;
    if (ch && tg) hero = { big: `Blood fat peak · ${inText(ch.min)}`, small: `+${atMin(tg, ch.min).toFixed(1)} mmol/L triglycerides` };
  } else if ((cls === 'stomach' || cls === 'stomachN' || cls === 'stomachFat') && hook.payoffMin !== undefined) {
    hero = { big: `Half out of your stomach · ${inText(hook.payoffMin)}`, small: 'The rest follows over the next hours' };
  } else if (cls === 'blood' || cls === 'bloodN') {
    const ch = atCh(hook.payoff);
    // (a blood gauge at its peak answers it already: the sugar, fat or alcohol in the blood, with when)
    if (ch && !(hero && /\bblood\b|\bBAC\b/i.test(`${hero.big} ${hero.small}`))) hero = { big: `In your blood · ${inText(ch.min)}`, small: hero?.big ? `Then: ${hero.big}` : 'Within minutes of reaching it' };
  } else if (cls === 'alcoholGone' || cls === 'alcoholGoneN' || cls === 'alcoholGoneG') {
    // (the model's typical body: "the alcohol is gone by now, about 3 h after the first sip")
    const gone = atCh(hook.payoff), r = /about (\d+(?:[.,]\d+)?) h after the first (?:sip|drink|bite)/.exec(gone?.text ?? '')?.[1];
    if (r) after24 = { ...after24, small: `Gone after about ${r} h (typical) · ${after24.small}` };
  } else if (cls === 'water') {
    // (where the water goes: the kidneys' moment, with the model's own first sentence there)
    // (phase 4j, critique M2: "Peak: 150 ml urine · 2 h in" was the chip at the kidney moment, while the chip went on
    // to 203 ml: the peak is the urine series' own highest value and its minute, urinePeak, the one source)
    const kid = atCh(hook.payoff), up = kid ? urinePeak(b) : null, first = (kid?.text ?? '').split(/(?<=\.)\s/)[0];
    if (kid) hero = up ? { peak: true, big: `${up.big} · ${inText(up.min)}`, small: up.small } : { big: `Your kidneys · ${inText(kid.min)}`, small: first.length <= 70 ? first : 'They filter the extra water' };
  } else if (cls === 'bedtimeQ') {
    const bed = atCh(hook.payoff), mg = /(\d+) mg of caffeine is (?:still|left) in you/.exec(bed?.text ?? '')?.[1];
    if (mg) hero = { big: `At bedtime: ${mg} mg of caffeine`, small: 'Still in you' };
  } else if (cls === 'protein' || cls === 'proteinN') {
    const g = /(\d+) g protein/.exec(chapters[0]?.text ?? '')?.[1];
    if (g && !/protein/i.test(`${hero?.big} ${hero?.small}`)) hero = { big: `${g} g of protein`, small: 'Taken apart into building blocks' };
  }
  // (phase 4k, critique 2026-11-21, M3: alcohol with caffeine ends on what the caffeine does when the alcohol is gone,
  // the model's mg at the alcohol-gone moment: "Gone after about 3 h (typical) · 37 mg caffeine: still in you")
  const goneCh = chapters.find((c) => c.title === 'Alcohol gone'), left = goneCh && (b.alcoholG ?? 0) > 1 && b.caffeine.doseMg >= CAF_WITH_ALCOHOL_MG ? Math.round(atMin(b.caffeine.body, goneCh.min)) : 0;
  if (left >= 1) after24 = { ...after24, small: /^Gone after/.test(after24.small) ? `${after24.small.split(' · ')[0]} · ${left} mg caffeine: still in you` : `${ALC_GONE_CAF} ${left} mg caffeine: still in you` };
  return { hero, after24 };
}
/** Phase 4b (critique M2: "AFTER 24 HOURS / 58 mg caffeine · 45 min in / still in your body" was the PEAK): what the
 *  model has at minute 1440, for the line under "AFTER 24 HOURS". The same order as the main gauge (alcohol, a clear
 *  blood sugar curve, caffeine, blood fat), else where the rest of it is, from the route model. */
export function after24Of(b: BuiltLike & PeakIn, sugarKnown: boolean): { big: string; small: string } {
  const M = 1440;
  if ((b.alcoholG ?? 0) > 1 && b.bac) {
    const v = atMin(b.bac, M);
    return v > ANY_GL ? { big: 'Alcohol is still in your blood', small: bacPlain(v, undefined, b.bacBody) } : { big: 'Blood alcohol: back to zero', small: `For a ${b.bacBody ?? DEFAULT_BAC_BODY}; livers differ` };
  }
  const gs = sugarKnown ? b.effects.glucoseMgDl : undefined;
  let gMax = 0; if (gs) for (let i = 0; i <= Math.min(M, gs.length - 1); i++) gMax = Math.max(gMax, Math.abs(gs[i]) / 18.016);
  if (gs && gMax >= 0.5) { const g = atMin(gs, M) / 18.016; return Math.abs(g) < 0.3 ? { big: 'Blood sugar: back to usual', small: 'Long after its peak' } : { big: `Blood sugar ${g > 0 ? 'still up' : 'still down'}`, small: sugarPlain(g) }; }
  if (b.caffeine.doseMg >= 10) { const c = atMin(b.caffeine.body, M); return { big: c >= 1 ? `${Math.round(c)} mg of caffeine left` : 'Under 1 mg of caffeine left', small: `Of the ${Math.round(b.caffeine.doseMg)} mg in it` }; }
  const tgs = b.effects.tgMmol;
  if (tgs && Math.max(...Array.from(tgs.subarray(0, M + 1))) >= TG_GAUGE) { const tg = atMin(tgs, M); return tg < TG_GAUGE ? { big: 'Blood fat: back to usual', small: 'Long after its peak' } : { big: 'Blood fat still up', small: `+${tg.toFixed(1)} mmol/L triglycerides` }; }
  const w = presentAt(b, M).length ? whereGauge(b, M) : null;
  return w ? { big: w.big, small: w.small } : { big: 'Nothing of it left to show', small: 'It has all passed through' };
}
/** The minute of the sugar curve's top (for climaxFx, which then prefers the story's own moment). */
const peakOfSugar = (b: PeakIn) => { const g = b.effects.glucoseMgDl; if (!g) return undefined; let k = 0; for (let i = 1; i <= Math.min(1440, g.length - 1); i++) if (g[i] > g[k]) k = i; return k; };

/** Round 10: the bloodstream surge. The same substance as peakOf (alcohol, else a clear sugar rise, else caffeine),
 *  and the stretch of the day while its model level climbs from a quarter of its peak to the peak (the video picks
 *  the first free second in it). Picture and sound only
 *  (no words, no number), so it can never disagree with the gauge. */
export function surgeOf(b: PeakIn, sugarKnown: boolean): { min: number; max: number; kind: SurgeKind } | undefined {
  const g = sugarKnown ? b.effects.glucoseMgDl : undefined, gMax = g ? Math.max(...Array.from(g.subarray(0, 1441))) : 0;
  const pick: [Float64Array, SurgeKind] | undefined = (b.alcoholG ?? 0) > 1 && b.bac ? [b.bac, 'alcohol']
    : g && gMax / 18.016 >= 0.5 ? [g, 'sugar'] // (peakOf's "clear rise": at least 0.5 mmol/L)
      : b.caffeine.doseMg >= 20 ? [b.caffeine.body, 'caffeine'] : undefined;
  if (!pick) return undefined;
  const [sr, kind] = pick, end = Math.min(1440, sr.length - 1);
  let pm = 0; for (let i = 1; i <= end; i++) if (sr[i] > sr[pm]) pm = i;
  if (!(sr[pm] > 0) || pm < 2) return undefined;
  for (let m = 1; m <= pm; m++) if (sr[m] >= SURGE_FROM * sr[pm]) return { min: m, max: pm, kind };
  return undefined;
}

/** Where the drink is + the number that matters, at minute m (where is left out when it says the same). */
/** `cardOrgans` (phase 4c, critique minor: "0.6 g fiber" pinned next to "The fat joins your blood later.", "80 ml
 *  urine" next to "In your stomach …"): the organs of the card being read (video-cam beatOrgans); the where-gauge
 *  is then shown only when it is in the same region of the body as the card, so a callout never contradicts it. */
export function gaugesAt(b: BuiltLike, m: number, unit: Profile['glucoseUnit'], sugarKnown: boolean, caffeineMoment = false, cardOrgans?: readonly string[]): PinnedGauge[] {
  const main = mainGauge(b, m, uFromMinutes(Math.min(1440, m)), unit, sugarKnown);
  // (round 16, critic E-1): at a caffeine moment of a sugary caffeinated drink the caffeine shows next to the sugar
  if (caffeineMoment && main && !/caffeine/.test(main.big) && b.caffeine.doseMg >= 20) {
    const caf = mainGauge({ ...b, bac: undefined, effects: {} }, m, uFromMinutes(Math.min(1440, m)), unit, false);
    if (caf && /caffeine/.test(caf.big)) return [{ ...caf, curve: undefined }, main];
  }
  // phase 4h (critique M2: rakija + lemonade showed a "Blood sugar dip" and never the lemonade's rise before it: the
  // BAC gauge always won): a drink with alcohol whose blood sugar clearly moves shows that too, next to the BAC
  if (main?.organ === 'brain' && /\bBAC\b/.test(main.small) && sugarKnown && b.effects.glucoseMgDl) {
    const sg = mainGauge({ ...b, bac: undefined }, m, uFromMinutes(Math.min(1440, m)), unit, true);
    if (sg && sg.organ === 'pancreas') return [{ ...sg, curve: undefined }, main];
  }
  // one number per thing (round 5, critic: "4.8 g sugar · Blood" next to "Blood sugar up"): no sugar where-gauge
  // while the blood sugar gauge is up
  // (round 7: never a "g sugar" gauge in a video whose blood sugar curve is known, even in a dip or between peaks)
  const w1 = whereGauge(b, m), w0 = w1 && cardOrgans?.length && !cardOrgans.some((o) => REGION[o] && REGION[o] === REGION[w1.organ]) ? null : w1;
  const where = w0 && (main?.organ === 'pancreas' || (sugarKnown && !!b.effects.glucoseMgDl)) && /sugar/.test(w0.big) ? null : w0;
  // the same number twice (blood alcohol in "Blood", caffeine in "Blood"): only the main gauge
  const num = (s: string) => /[\d.,–]+/.exec(s)?.[0] ?? s;
  const same = !!main && !!where && ((/alcohol|BAC/.test(main.small) && /‰|BAC/.test(where.big)) || num(where.big) === num(main.big));
  return [where && !same ? where : null, main].filter((g): g is NonNullable<typeof g> => !!g);
}

type ChapterLike = { min: number; title: string; text: string; live?: (m: number) => string; focus?: string | null };
/** The single video's moments: every chapter's words at its own minute and its caption cards. */
/** Phase 4e (critique M5: pizza and lentils said the same cards in the same order): a moment's cards about a nutrient
 *  ("Bile helps break down the fat.", "Fiber goes on undigested.") come in the order of how much of it this food has
 *  (its share of a day's reference amount: fiber 28 g, fat 78 g, protein 50 g, carbohydrate 275 g); its first card and
 *  every other card keep their place. */
export const NUTRIENT_CARDS: [RegExp, (m: ReturnType<typeof macrosOf>) => number][] = [
  [/\bfib(?:er|re)\b/i, (m) => m.fiber / 28], [/\bfat\b|\bbile\b|\blymph\b/i, (m) => m.fat / 78], [/\bprotein\b|building blocks/i, (m) => m.protein / 50], [/\bstarch\b|\bsugar\b/i, (m) => m.carbs / 275],
];
export function byNutrient(lines: readonly string[], mac: ReturnType<typeof macrosOf>): string[] {
  const kind = (l: string) => { const k = NUTRIENT_CARDS.filter(([re]) => re.test(l)); return k.length === 1 ? k[0][1](mac) : null; };
  const slots = lines.map((l, i) => (i > 0 && kind(l) !== null ? i : -1)).filter((i) => i >= 0);
  const sorted = slots.map((i) => lines[i]).map((l, k) => ({ l, k, v: kind(l)! })).sort((a, b) => b.v - a.v || a.k - b.k).map((x) => x.l);
  const out = [...lines];
  slots.forEach((i, k) => { out[i] = sorted[k]; });
  return out;
}
export function singleStops(story: { chapters: ChapterLike[] }, ctx: BeatCtx, where?: (m: number, until?: number) => string | null): StopIn[] {
  // (round 9: a card is said once per video; "Fat takes a slower route, via the lymph." ended one moment and began
  // the next, 9 s in a row, for every fatty food)
  const seen = new Set<string>();
  // (round 14: the swallow, "Down the food pipe", adds its card to the first moment, used when there is room)
  const pipe = story.chapters.find((c) => c.min > 0 && c.min < 1);
  // (round 15, critic P2-K: never its bare title "Down the food pipe" as a card, only a sentence)
  const pipeLines = (pipe ? beatLines({ min: pipe.min, title: pipe.title, text: chapterText(pipe as never, pipe.min) }, ctx) : []).filter((l) => /[.!?]$/.test(l));
  const sparse = story.chapters.filter((c) => c.min >= 1).length < 8;
  const mac = macrosOf(story.chapters[0] ? chapterText(story.chapters[0] as never, 0) : '');
  const base: StopIn[] = story.chapters.filter((c) => c.min === 0 || c.min >= 1).map((c) => {
    const text = chapterText(c as never, c.min), all = beatLines({ min: c.min, title: c.title, text }, ctx);
    const fresh = all.filter((l) => !seen.has(l));
    for (const l of all) seen.add(l);
    const ls = fresh.length ? fresh : all;
    // (round 15: a sparse story also says where most of it is, after its own cards, used only when there is room)
    // (phase 4j: the place holds while the moment is on screen: up to the next chapter, at least minute 15)
    // (phase 4k: the clock's least pace may show it later still: singlePlan's placesOnScreen says the place then)
    const nx = story.chapters.find((y) => y.min > c.min)?.min ?? 1440;
    const w = sparse && c.min >= 1 && where ? where(c.min, Math.max(nx, 15)) : null;
    const ls2 = w && !ls.includes(w) && !seen.has(w) ? (seen.add(w), [...ls, w]) : ls;
    return { min: c.min, title: c.title, text, lines: c.min === 0 ? [...ls2, ...pipeLines.filter((l) => !ls2.includes(l))] : byNutrient(ls2, mac) };
  })
    // (phase 4k, critique 2026-11-21, M2: "NEXT MORNING / The alcohol should be gone. / Don't drive after drinking." stood
    // 4-7 s over a still body, after the video had said when the alcohol is gone, "should be gone" read as doubt): a
    // morning with no fact of its own is left out; the BAC chip says "Never safe to drive after drinking." with every
    // number, and the alcohol-gone moment "We can't tell when you're safe to drive."
    .filter((s) => !(/^Next morning$/i.test(s.title) && (s.lines ?? []).every((l) => MORNING_NO_FACT.test(l))))
    // (one with a fact says it first, with its driving card, so a cut that keeps only its first cards keeps the fact)
    .map((s) => {
      if (!/^Next morning$/i.test(s.title) || !s.lines) return s;
      const fact = s.lines.filter((l) => !MORNING_NO_FACT.test(l)), drive = s.lines.filter((l) => /^Don.t drive/.test(l)).slice(0, 1);
      if (!fact.length || fact.some((l) => SAFETY.test(l))) return s;
      return { ...s, lines: [fact[0], ...drive, ...s.lines.filter((l) => l !== fact[0] && !drive.includes(l))], must: 1 + drive.length };
    });
  // round 12 (critic P0-3): a card that speaks of a later minute ("Half has moved on after 116 minutes.") is said when
  // the clock gets there, as its own moment under the same title (never while the clock still stands at +0:01)
  const out: StopIn[] = [];
  for (const s of base) {
    const now = (s.lines ?? []).filter((l) => !tooEarly(l, s.min)), later = (s.lines ?? []).filter((l) => tooEarly(l, s.min));
    out.push({ ...s, lines: now.length ? now : (s.lines ?? []).slice(0, 1) });
    for (const l of now.length ? later : later.slice(1)) {
      const at = Math.min(1439, Math.round(eventMin(l)!));
      const near = out.find((x) => Math.abs(x.min - at) <= 5) ?? base.find((x) => Math.abs(x.min - at) <= 5 && x !== s);
      if (near && out.includes(near)) near.lines = [...(near.lines ?? []), l];
      else out.push({ min: at, title: s.title, text: l, lines: [l] });
    }
  }
  // (round 16, critic E-1: an energy drink's caffeine was never shown): the caffeine moment is never left out
  const cafStop = out.find((s) => s.min > 0 && /caffeine/i.test(s.title));
  // (2026-11-20, rum and cola / vodka and an energy drink: the Short lost its climax to the caffeine moment): with
  // alcohol, what the caffeine does is the alcohol peak's first card, under its title "Alcohol peak", so every cut says
  // it at the climax ("Caffeine masks drowsiness, not impairment.", CDC 2024 [AL18]; the gauge shows the blood alcohol
  // with both driving limits); the caffeine moment then comes where there is room
  const MASK = 'Caffeine masks drowsiness, not impairment.';
  const alcPeak = (ctx.alcoholG ?? 0) > 1 ? out.find((s) => s.title === 'Alcohol peak' && (s.lines ?? []).includes(MASK)) : undefined;
  if (alcPeak) {
    alcPeak.lines = [MASK, ...(alcPeak.lines ?? []).filter((l) => l !== MASK)];
    alcPeak.must = Math.max(alcPeak.must ?? 0, 1);
  } else if (cafStop) cafStop.keep = true;
  // (phase 4k, critique 2026-11-21, M3: vodka and an energy drink never said its best fact: at +3:11 the alcohol is gone,
  // 37 mg of caffeine is still in you): the alcohol-gone moment says it, from the model, and is in every cut
  const gone = (ctx.alcoholG ?? 0) > 1 && ctx.caffeineLeft ? out.find((s) => s.title === 'Alcohol gone') : undefined;
  const left = gone ? Math.round(ctx.caffeineLeft!(gone.min)) : 0;
  if (gone && left >= 1) {
    const c = `${ALC_GONE_CAF} ${left} mg caffeine: still in you.`, ls = (gone.lines ?? []).filter((l) => l !== c);
    // (its second card, where the cut has room; the end card says it in every cut: endCardOf)
    gone.lines = [...ls.slice(0, 1), c, ...ls.slice(1)]; gone.keep = true;
  }
  return out.sort((a, b) => a.min - b.min);
}

export interface ComparePlan { plan: Plan; guess: Guess | null; race: { a: Float32Array; b: Float32Array } | null; fx: PlanFx; verdict: string }
/** The comparison video's plan (2026-10-23 split screen; rounds 4-8): the guess, each side's cards per moment, the
 *  moments that say something new, and the plan for them. */
/** Round 14 (owner decision): a comparison says its amounts early: "A typical serving each: 150 ml vs 500 ml." (or
 *  "Same amount: 330 ml each."), from each side's serving text ("1 glass · 250 ml" → "250 ml"). */
/** Round 17 ("A typical serving each: 198 g vs 1 avocado without skin and seed."): the amount in ml or g, from the
 *  serving text, else its grams. */
export const servingAmount = (x: { serving: string; macros: { grams: number } }) => /(\d+(?:[.,]\d+)?\s*(?:ml|g|l|cl))\b/i.exec(x.serving.split('·').pop() ?? x.serving)?.[1] ?? `${Math.round(x.macros.grams)} g`;
export function servingsCard(sa: string, sb: string): string {
  const amt = (s: string) => /(\d+(?:[.,]\d+)?\s*(?:ml|g|l|cl))\b/i.exec(s.split('·').pop() ?? s)?.[1] ?? s.trim();
  const x = amt(sa), y = amt(sb);
  return x === y ? `Same amount: ${x} each.` : `A typical serving each: ${x} vs ${y}.`;
}
/** Round 15: a NEXT chip's words fit the chip ("NEXT · +0:20 · " + these, ≤ 900 px). */
export const CHIP_MAX = 34;
export const CHIP_SHORT: [RegExp, string][] = [[/sugar peak|blood sugar/i, 'sugar peak'], [/alcohol peak/i, 'alcohol peak'], [/peak/i, 'its peak'], [/dip|crash/i, 'sugar dip'],
  [/going to bed|bedtime/i, 'bedtime'], [/morning/i, 'next morning'], [/gone/i, 'all gone'], [/large intestine/i, 'large intestine'], [/24 hours/i, '24 hours later']];
/** Round 17: chapters about the way in (bite, stomach, small intestine), true only for a few hours. */
export const TRANSIT_TITLE = /^(First (bite|sip)|First bite and sip|Down the food pipe|In your stomach|Into the small intestine|Building blocks|Your gut)/i;
/** Round 17: a chapter shown at minute `at` long after it happened (a +0:25 card at +24:00). */
export const staleAt = (c: { min: number; title: string }, at: number) => (at >= 1440 ? c.min < 720 : TRANSIT_TITLE.test(c.title) && at - c.min > 360);
/** Round 13: the comparison's answer is revealed no earlier than this share of the video. */
export const REVEAL_FROM = 0.55;
export function comparePlan(a: Analysis, b: Analysis, profile: Profile, cutIn: boolean | Cut): ComparePlan {
  // (round 11: a cut, or the old flag: true = short)
  const cut: Cut = typeof cutIn === 'boolean' ? (cutIn ? 'short' : 'long') : cutIn, shortVid = cut === 'short';
  // each side's words at each moment (as on screen); planCompare sets the reading times and the length
  const chap = (x: Analysis, at: number) => x.built.story.chapters.reduce((acc, c) => (at + 1e-6 >= c.min ? c : acc), x.built.story.chapters[0]);
  // (phase 4j, critique M3: a card about blood sugar only for a side whose model has a blood sugar rise, so "Both · …"
  // is never said for a food whose end card has no blood sugar curve; video-body SUGAR_CLAIM)
  // (phase 4j, critique M5: "FIRST BITE / Soft pretzel." repeated the name over its body: a card that only says the
  // side's name, its title on screen, is not said)
  const cards = (x: Analysis, at: number) => { const c = chap(x, at); return beatLines({ min: c.min, title: c.title, text: chapterText(c, c.min) }, { ...beatCtx(cmpName(x.label), x.built, profile.drinkAtMin), factsFirst: true } /* (round 17: "Orange juice.", its amount is on the servings card) */)
    .filter((l) => (!SUGAR_CLAIM.test(l) || sugarClaimTrue(x.sugarPeak)) && !sameWords(l, c.title)).map((l, _i, all) => (!sameWords(l, cmpName(x.label)) ? l : x.kcal >= 1 && !all.some((y) => /\d+ kcal/.test(y)) ? `${Math.round(x.kcal)} kcal in total.` : '')).filter(Boolean)
    // (phase 4k, critique M2: no kcal card for a drink with alcohol unless the question is about calories: its US standard drinks)
    .map((l) => ((x.built.alcoholG ?? 0) > 1 && gq?.kind !== 'kcal' && /\bkcal\b/.test(l) ? stdDrinksCard(x.built.alcoholG ?? 0) : l)).filter((l, i, all) => all.indexOf(l) === i); }; // (its name's place: its kcal, from the model)
  // (phase 4j: a chapter left with no card for a side, a blood sugar card for a food without a rise, says where the food
  // is or how much is taken up, from the model, never a bare title)
  const cardsOr = (x: Analysis, cm: number, shown: number) => { const ls = cards(x, cm); if (ls.length) return ls; const w = whereOrUp(x.built, shown); return w ? [w] : ls; };
  // the game's facts from the model (spec §3.3): the race out of the stomach, the peak, the lights, the verdict
  // round 4: the question this pair answers clearly (out of the stomach / out of the blood / bigger sugar rise),
  // or none; its race bars and its answer come from the same model
  const bedMin = ((((profile.bedtimeMin - profile.drinkAtMin) % 1440) + 1440) % 1440);
  const gq = chooseGuess(guessSideOf(a, cmpName(a.label)), guessSideOf(b, cmpName(b.label)), { bedMin, seed: seedOf(`${a.label} vs ${b.label}`) }); // (phase 4b, M5: the question in its own words)
  const race = gq && gq.kind !== 'bedtime' ? { a: gq.progress[0], b: gq.progress[1] } : null; // (no race for "still in you at bedtime")
  const worst = (x: Analysis) => x.systems.map((s) => s.levels[worstMoment(s)] as 0 | 1 | 2);
  const wa = worst(a), wb = worst(b), verdictNow = verdictOf(a, b, profile.glucoseUnit, gq && { tie: /^Almost the same/.test(gq.answer1) });
  const nonAlc = [a, b].filter((x) => (x.built.alcoholG ?? 0) <= 1), pk = [...nonAlc, a, b].map((x) => peakOf(x.built, x.glucose !== undefined)).find((x) => x !== undefined);
  // the impact lands on the answer when there is a guess (the moment the race is decided), else on the peak
  const hit = gq ? Math.round(gq.decidedMin) : pk;
  // round 10: the bloodstream surge on the first side that has one (the same order as the peak: no alcohol first)
  const sg = ([...nonAlc, a, b].map((x) => { const s = surgeOf(x.built, x.glucose !== undefined); return s && { ...s, side: (x === a ? 0 : 1) as 0 | 1 }; })).find((x) => !!x);
  const fx: PlanFx = { calmDay: [a, b].some((x) => (x.built.alcoholG ?? 0) > 1), paceMin: [a, b].some((x) => (x.built.alcoholG ?? 0) > 1 || x.built.caffeine.doseMg > 0) ? PACE_FAST : PACE_MEAL /* (phase 4k, M1) */, surge: sg, peakMin: hit, teaserMin: hit, drinkAtMin: profile.drinkAtMin, wakeMin: profile.wakeMin, verdict: true, verdictTrophy: /^🏆/.test(verdictNow),
    lights: wa.flatMap((l, i) => [l, wb[i] ?? 0]).slice(0, 8), race: gq && gq.kind !== 'sugar' && gq.kind !== 'bedtime' && gq.kind !== 'alcohol' && gq.kind !== 'sugarG' && gq.kind !== 'kcal' ? race ?? undefined : undefined,
    heart: (() => { const ha = a.systems.find((s) => s.key === 'heart')?.levels, hb = b.systems.find((s) => s.key === 'heart')?.levels; return ha && hb ? Uint8Array.from(ha, (v, i) => Math.max(v, hb[i] ?? 0)) : undefined; })() };
  // the peak gets a moment of its own (its impact lands when both bodies are there)
  // round 12 (critic P0-2: both sides said "peaks now" at +1:30, the singles peak at +0:43 / +0:48): each side's own
  // peak moment (its story's peak chapter, as in its single video) is a moment of the comparison, kept by the planner;
  // the regular moments within 8 minutes of a peak make room for it
  // (round 13, critic P1-3: wine vs beer skipped "Alcohol gone", the one moment that answers which clears first)
  const peaksOf = (x: Analysis) => x.built.story.chapters.filter((c) => c.min > 0 && /peak|Alcohol gone/i.test(c.title)).map((c) => c.min);
  const sidePeaks = [...new Set([...peaksOf(a), ...peaksOf(b)])].filter((m) => m < 1440);
  const base = (shortVid ? CMP_SHORT : CMP_STOPS).filter((m) => m === 0 || m >= 1440 || !sidePeaks.some((p) => Math.abs(p - m) <= 8));
  const cmpMins0 = [...new Set([...base, ...sidePeaks, ...(hit !== undefined && hit > 0 ? [hit] : [])])].sort((x, y) => x - y);
  // round 6 (critic: water showed one card for 28 s, and the same kidney cards ran 13 s at +24:00): each side says
  // what is NEW since the last moment (every chapter passed on the way, in order), else the next cards of the
  // chapter it is in; a moment with nothing new on either side is left out (the 24 h beat still ends the day)
  const perStop = shortVid ? 1 : 2;
  const sideCards = (x: Analysis, mins: number[]) => {
    let prev = -1, seen = 0, lastLines: string[] = [], lastCh: unknown = null;
    return mins.map((at) => {
      const fresh0 = x.built.story.chapters.filter((c) => c.min > prev && c.min <= at && (c.min === 0 || c.min >= 1));
      // the chapter of this moment first (what is true NOW), then the ones passed on the way; in a stomach race
      // the stomach chapter leads (it is the game's fact)
      const rank = (c: typeof fresh0[number]) => (gq?.kind === 'stomach' && /stomach/i.test(c.title) ? 0 : c === fresh0[fresh0.length - 1] ? 1 : 2);
      // round 7 (critic B2: a bedtime card showed at +24:00 under KIDNEYS): only the chapter of this moment (and,
      // in a stomach race, the stomach chapter), so a card is never shown under another moment's title or time
      // (round 17: and never a chapter long past, "Next morning" at +24:00 when the +12:00 moment was left out)
      const fresh = fresh0.map((c, i) => ({ c, i })).sort((p, q) => rank(p.c) - rank(q.c) || p.i - q.i).map((p) => p.c).filter((c) => rank(c) < 2 && !staleAt(c, at));
      prev = at;
      if (fresh.length) {
        // (round 12: a card that says "now" only under its own moment, never minutes later)
        // (phase 4h, critique M4: "IN YOUR STOMACH / Your small intestine absorbs it…": a card is said only under its own
        // chapter's title, the first one here)
        const lines = fresh.slice(0, 1).flatMap((c) => cardsOr(x, c.min, at).filter((l) => !(/\bnow\b/i.test(l) && Math.abs(at - c.min) > Math.max(10, 0.15 * c.min)) && !tooEarly(l, at)));
        lastLines = lines; seen = Math.min(lines.length, perStop); lastCh = fresh0[fresh0.length - 1];
        return { lines, title: fresh[0].title, text: chapterText(fresh[0], fresh[0].min), isNew: true };
      }
      const c = chap(x, at);
      // round 17 (critic G-2: "INTO THE SMALL INTESTINE · Protein is broken into building blocks." under +24:00): a
      // chapter long past is never shown as this moment's; the side says where it is now, under the moment's own time
      if (staleAt(c, at)) { const wl = whereCard(x.built, at); return { lines: [wl ?? ''], title: at >= 1440 ? '24 hours later' : `${Math.round(at / 60)} hours later`, text: wl ?? '', isNew: false }; }
      // (phase 4h, critique M3: lemonade's "Your blood sugar climbs to its peak." was said at +1:30, an hour after its
      // peak, merged with the pear's into "Both · Blood sugar peak": a card about a moment, its peak or "now", is said
      // only near its own minute)
      const timely = (l: string) => !(/\bnow\b|\bpeak\b|\bclimbs\b|\bhighest\b/i.test(l) && Math.abs(at - c.min) > Math.max(10, 0.15 * c.min));
      const rest = lastCh === c ? lastLines.slice(seen).filter(timely) : [];
      seen = Math.min(lastLines.length, seen + perStop);
      // (round 8: nothing new = this side is quiet, never the same card again under a later moment)
      const last1 = cardsOr(x, c.min, at).slice(-1).filter(timely);
      return { lines: rest.length ? rest : lastCh === c || !last1.length ? [''] : last1, title: c.title, text: chapterText(c, at), isNew: rest.length > 0 };
    });
  };
  // (the planner may leave moments out to fit: the words are then worked out again for the moments it kept, so
  // nothing a left-out moment would have said is lost; twice is enough)
  // (phase 4j: where most of it is, else how much the body has taken up so far: a moment of the day's middle always says
  // something from the model; full tier, four Shorts went from the first bite straight to +24:00)
  const whereOrUp = (b0: Analysis['built'], at: number) => { const w = whereCard(b0, at), u = takenUpAt(b0, at, true); return w ?? (u ? `Taken up so far: ${u}.` : null); };
  let midForce: number | null = null;
  const build = (mins0: number[]) => {
    const sa = sideCards(a, mins0), sb = sideCards(b, mins0);
    // (phase 4j, critique M6: a moment where neither side has anything new, the race's own minute, stood 3-5 s with no
    // card: each side then says where most of it is, from the model, video-body whereCard)
    const blank = (x: { lines: string[] }) => !x.lines.some((l) => l.trim());
    mins0.forEach((at, i) => { if (i > 0 && at < 1440 && blank(sa[i]) && blank(sb[i])) { const wa = whereOrUp(a.built, at), wb = whereOrUp(b.built, at); if (wa || wb) { sa[i].lines = [wa ?? '']; sb[i].lines = [wb ?? '']; } } });
    // round 14 (owner): the amounts, said once and early: a typical serving each (or the same amount)
    if (sa[0] && sb[0]) { const card = servingsCard(servingAmount(a), servingAmount(b)); sa[0].lines = [card, ...sa[0].lines]; sb[0].lines = [card, ...sb[0].lines]; }
    // round 17 (critic P2-OJ: "Cola." next to "29 g of sugar: about 7 teaspoons." before the answer): the guessed number
    // is said by neither side before the answer
    const hide = gq?.kind === 'sugarG' ? /\d+ g of sugar|teaspoons? of sugar/ : gq?.kind === 'kcal' ? /\d+ kcal/ : gq?.kind === 'alcohol' ? /\d+ g of alcohol/ : null;
    const revealMin = fx.peakMin ?? hit ?? 0;
    if (hide) for (const side of [sa, sb]) side.forEach((c, i) => { if (mins0[i] < revealMin) { const ls = c.lines.filter((l) => !hide.test(l)); c.lines = ls.length ? ls : ['']; } });
    let midKeep = -1;
    const keepAt = mins0.map((at, i) => i === 0 || at === hit || sa[i].isNew || sb[i].isNew);
    // round 18 (critic V-3: almonds vs chips jumped from +0:31 to +24:00): the day always has a middle; when no moment
    // between the first hour and +24:00 says something new, the first one after +1:30 says where each side is now
    if (midForce !== null || !mins0.some((at, i) => keepAt[i] && at >= 60 && at < 1440)) {
      const k = midForce !== null ? mins0.indexOf(midForce) : mins0.findIndex((at) => at >= 90 && at < 1440);
      if (k >= 0) {
        keepAt[k] = true; midKeep = mins0[k];
        ([[sa, a], [sb, b]] as const).forEach(([side, x]) => { if (!side[k].lines.some((l) => l.trim())) { const w = whereOrUp(x.built, mins0[k]); side[k].lines = [w ?? '']; if (w) side[k].title = `${Math.round(mins0[k] / 60)} hours later`; } });
      }
    }
    const mins = mins0.filter((_m, i) => keepAt[i]);
    const pick = <T,>(xs: T[]) => xs.filter((_x, i) => keepAt[i]);
    const SA = pick(sa), SB = pick(sb);
    // (round 14, critic C13-1: the chip named the other side's chapter): the side with the news, in plain words
    const human = (t: string) => TEASE_HUMAN.find(([re]) => re.test(t))?.[1] ?? t.charAt(0).toLowerCase() + t.slice(1);
    const chipOf = (i: number) => {
      const own = (x: Analysis) => peaksOf(x).includes(mins[i]);
      const k = own(b) && !own(a) ? 1 : own(a) ? 0 : SB[i].isNew && !SA[i].isNew ? 1 : 0;
      const x = k ? b : a, t = chap(x, mins[i]).title, long = `${cmpName(x.label)}: ${human(t)}`; // (the moment's own chapter, what that side is at)
      // (round 15, critic J-3: "Cola: when your blood sugar …" was cut off): the short plain words when the long ones do not fit
      return long.length <= CHIP_MAX ? long : `${cmpName(x.label)}: ${CHIP_SHORT.find(([re]) => re.test(t))?.[1] ?? t.toLowerCase()}`;
    };
    // (phase 4h, M6: the comparison's perceived stays, both sides' cards and the organs lit for them, video-telemetry)
    const seen = (fr: VFrame) => { const W = { focus: [], zoom: 'wide' as const }, sa = sceneOf(fr, a.built.story.chapters, W, null), sb = sceneOf({ ...fr, title: fr.titleB, cap: fr.capB }, b.built.story.chapters, W, null); return [...new Set([...perceivedOf(sa), ...perceivedOf(sb)])]; };
    return planCompare(mins.map((at, i) => ({ min: at, a: SA[i].text, b: SB[i].text, titleA: SA[i].title, titleB: SB[i].title, linesA: SA[i].lines, linesB: SB[i].lines, keep: sidePeaks.includes(at) || at === midKeep, mid: at === midKeep, chip: chipOf(i) })),
      cut, uFromMinutes, minutesFromU, { ...fx, perceive: { seen, runs: perceivedRuns, maxS: regionMaxS } });
  };
  let used = cmpMins0, plan = build(used);
  for (let k = 0; k < 3; k++) { const kept = cmpMins0.filter((m) => plan.stops.includes(m)); if (kept.length === used.length) break; used = kept; plan = build(used); }
  // (round 18: when the planner left out every middle moment to fit, one comes back, kept, saying where each side is)
  const middle = () => {
    if (plan.stops.some((m) => m >= 60 && m < 1440)) return;
    const m = [...base, ...cmpMins0].filter((x) => x >= 90 && x < 1440).sort((x, y) => x - y)[0];
    if (m !== undefined) { midForce = m; used = [...new Set([...used, m])].sort((x, y) => x - y); plan = build(used); }
  };
  middle();
  // round 13 (critic P1-1: hamburger vs cola answered its question at 25 of 68 s, then nothing was open): the answer
  // lands at REVEAL_FROM of the video or later, at the first moment after the race is decided (the bars show it on the way)
  const reveal = () => {
    if (gq && hit !== undefined) {
      const tOf = (m: number) => plan.frames.find((f) => f.stop === m && (f.beat === 'hold' || (f.beat === 'end' && f.phase === 'main')))?.t;
      const pkT = plan.cues.find((c) => c.kind === 'peak')?.t;
      // (round 16: also when the planner left the answer's own moment out: it then lands on a later one)
      if (pkT === undefined || pkT < REVEAL_FROM * plan.seconds) {
        // (the +24:00 moment counts too: the answer is then the day's payoff)
        // (round 18: on a moment that has words, else the answer has no frame to land on)
        const said = (m: number) => plan.pages.some((pg) => pg.stop === m && !!(pg.text || pg.textB));
        const cand = plan.stops.filter((m) => m >= hit && said(m));
        const later = cand.filter((m) => (tOf(m) ?? 0) >= REVEAL_FROM * plan.seconds).sort((x, y) => x - y)[0] ?? cand.sort((x, y) => y - x)[0]
          ?? plan.stops.filter((m) => m > 0 && said(m)).sort((x, y) => y - x)[0]; // (round 18b: the last moment with words, never no answer)
        if (later !== undefined) { fx.peakMin = later; plan = build(used); }
      }
    }
  };
  reveal();
  middle(); // (and after the answer moved: the day keeps its middle)
  reveal();
  middle(); // (phase 4j, full tier: the last move of the answer left four Shorts without a middle: it comes back, kept)
  // round 18b (the short comparisons answered at 51-54 %): when the answer's moment starts a little before REVEAL_FROM,
  // the answer waits on that moment until REVEAL_FROM (its words are still on screen); never earlier
  {
    const want = REVEAL_FROM * plan.seconds + 1 / 30;
    const pi = plan.cues.findIndex((c) => c.kind === 'peak');
    const pk = pi >= 0 ? plan.cues[pi] : undefined;
    if (pk && pk.t < want) {
      const f = plan.frames.find((x) => x.t >= want);
      if (f && f.phase === 'main' && (f.beat === 'hold' || f.beat === 'end') && f.stop === pk.data?.v) {
        const dt = want - pk.t;
        plan = { ...plan, cues: plan.cues.map((c) => (c === pk || (c.kind === 'riser' && Math.abs(c.t - (pk.t - 1.6)) < 1.7 && c.t <= pk.t) || (c.kind === 'surge' && (c.data?.v ?? 0) > 0 && Math.abs(c.t + (c.data?.v ?? 0) - pk.t) < 1e-6) ? { ...c, t: c.t + dt } : c) /* (phase 4b: a surge riding the riser moves with it) */).sort((x, y) => x.t - y.t), peakT: want };
      }
    }
  }
  // (phase 4j, critique M6: a lull says how much each body has taken up so far, as a share: a kcal guess keeps its number)
  plan = withLullCards(plan, (m) => takenUpAt(a.built, m, true), (m) => takenUpAt(b.built, m, true));
  return { plan, guess: gq, race, fx, verdict: verdictNow };
}

/** Phase 4e: the region of the organs a card lights (namedOrgans): the one most of them are in ("small intestine" lights
 *  the duodenum, jejunum and ileum: the small intestine, not the stomach's region); '' = none. */
export function litRegion(organs: readonly string[]): string {
  const n = new Map<string, number>();
  for (const o of organs) if (REGION[o]) n.set(REGION[o], (n.get(REGION[o]) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
}
/** The single video's plan inputs (AppV4 reelPlan) from a model run. Phase 4e: with the story's chapters, every stay
 *  on one region of the body as the viewer perceives it (video-cam seenOf) is held to regionMaxS. */
export function singlePlan(stops: StopIn[], cut: Cut, fx: PlanFx, chapters?: { min: number; title: string; focus?: string | null }[], built?: BuiltLike): Plan {
  // (a card about no organ is filmed where the food or drink is: shotOf's `lead`, the part of the route with most of it)
  const lead = (m: number) => { const p = built ? presentAt(built, m)[0] : undefined; return p ? REGION[SEG_FOCUS_V[p[0]]] ?? '' : ''; };
  // (phase 4i: the region a card lights, once per card's words: the planner asks it for every frame it lays out)
  const litMemo = new Map<string, Map<string, string>>();
  const litOf = (fr: VFrame) => {
    if (fr.phase !== 'main' || (fr.beat !== 'hold' && fr.beat !== 'hook')) return '';
    let byCap = litMemo.get(fr.title ?? ''); if (!byCap) { byCap = new Map(); litMemo.set(fr.title ?? '', byCap); }
    let v = byCap.get(fr.cap ?? ''); if (v === undefined) { v = litRegion(cardNamed(fr)); byCap.set(fr.cap ?? '', v); }
    return v;
  };
  const seen = (fr: VFrame) => {
    const r = seenOf(fr, chapters!), lit = litOf(fr);
    const where = (fr.stop ?? 0) > 0 && fr.beat !== 'end' && !quietFrame(fr) && r.every((x) => !x || x === 'body') ? lead(fr.m) : '';
    // (phase 4h, critique M6: while the first bite goes down, the organ it is in glows with it: the stomach is seen from
    // the first second, as the rendered video's timeline counts it, video-telemetry sceneOf)
    const first = fr.phase === 'main' && (fr.stop ?? 0) === 0 && (fr.beat === 'hold' || fr.beat === 'hook') ? lead(fr.m) : '';
    return [...new Set([...r, lit, where, first])].filter(Boolean);
  };
  const perceive = chapters ? { seen, runs: perceivedRuns, maxS: regionMaxS } : undefined;
  // (phase 4k, critique 2026-11-21, M1: the clock's slowest pace by what the food does: alcohol or caffeine within minutes)
  const alc = ((built as { alcoholG?: number } | undefined)?.alcoholG ?? 0) > 1, fx1: PlanFx = { paceMin: built && (alc || built.caffeine.doseMg > 0) ? PACE_FAST : PACE_MEAL, ...fx };
  // (phase 4k, critique M3: vodka and an energy drink never told its caffeine story: with alcohol, the caffeine moment
  // "comes where there is room", and a long video has room: it is kept there; a Short or a Reel says the caffeine at
  // the alcohol peak and the alcohol-gone moment)
  const cafKeep = alc && cut === 'long' && (built?.caffeine.doseMg ?? 0) >= CAF_WITH_ALCOHOL_MG;
  const stops1 = cafKeep ? stops.map((s) => (s.min > 0 && /caffeine/i.test(s.title) ? { ...s, keep: true } : s)) : stops;
  const plan = planVideo(stops1, cut, uFromMinutes, minutesFromU, perceive ? { ...fx1, perceive } : fx1);
  // (phase 4j, critique M6: a lull says how much the body has taken up so far, never 3-4 s without a card)
  // (phase 4k, critique M2: "TAKEN UP SO FAR / 28 of 164 kcal" in a video about alcohol: with alcohol the lull counts the
  // drink taken up, in ml, from the route model; kcal only when the hook asks about them)
  return built ? withLullCards(placesOnScreen(plan, built), (m) => takenUpAt(alc && !fx.kcalHook ? { ...built, energy: undefined } as BuiltLike : built, m)) : plan;
}
