// Phase P2 (roadmap 2026-11-24, "Video spine v5 + live curve"): the video's spine, from the Food Story (story/types).
// A v4 video told the food's journey in cards any food could show ("Your stomach churns it into a paste."), asked a
// question at 2.4-3.1 s and never answered it as a game, and gave no tip in 10 of 12 videos (current-format audit
// 2026-11-22). The v5 spine turns "food passes through" into a contract:
//   question (on screen from frame 0) → a 3-option guess, held in a corner → mechanism beats, each the cause with the
//   item's own number (the voice adds the "so what" without new numbers) → the surprising number with an everyday
//   anchor → what it means for you, with the body's label → one action from the cheat sheet → the reveal of the guess,
//   in the last 3 s before the end frame → the end frame: the 5 axes, the 3-line cheat sheet and a sources line.
// Pure (no canvas, no DOM): the content and its budget. Each item-specific number is said in at most PER_NUMBER_MAX
// visuals (the headline, a card, the reveal, the end frame each count once), so "584 kcal" is never said five times.
// The card path of the planner is unchanged (video-plan.ts): the spine rewrites a moment's generic cards into numbered
// ones, adds its own moments (kind 'number', 'forYou', 'action') as stops, and the planner lays them out with every
// 4a-4l rule; the non-text visuals (question, guess, reveal, end frame) are timed by SEG_TIME.
import type { AxisKey, FoodStory, Level, StoryNumber, Surprise } from './story/types';
import { AXIS_KEYS } from './story/types';
import { RUBRIC } from './story/axes';
import { guessOptions } from './story/surprise';
import { complianceHits } from './story/compliance';
import { TIPS } from '../content/tips';
import { hookClassOf, seedOf, type Hook, type HookClass } from './video-hook';
import { genericCard, isCard } from './video-beats';
import { SAFETY, type Cut, type StopIn } from './video-plan';
import { hookNamesFood, numbersShown, SPINE, teleNumsOf, type TeleNum } from './video-telemetry';
import { inText, urinePeak, type BuiltLike } from './video-body';
import { nearSame } from './video-names';
import { minutesFromU, uFromMinutes } from '../time';

/** The kinds of segment (roadmap P2). Card-like kinds (ladder, number, forYou, action) are read: the planner times
 *  them by the reading rule; the others are visuals, timed by SEG_TIME. */
export type SegKind = 'question' | 'guess' | 'ladder' | 'number' | 'forYou' | 'action' | 'reveal' | 'score' | 'cheat' | 'sources';
/** Seconds each kind is on screen (minS..maxS). The question is on screen from frame 0 and fully by QUESTION_BY_S; the
 *  options come at GUESS_FROM_S and are held in a corner until the reveal; the reveal starts REVEAL_S before the end
 *  frame (so it lands inside its last SPINE.REVEAL_WINDOW_S); the end frame is the plan's outro (OUTRO_S >= 2.5 s). */
export const SEG_TIME: Record<SegKind, { minS: number; maxS: number }> = {
  question: { minS: 1.0, maxS: 3.0 }, guess: { minS: 1.6, maxS: 2.4 }, ladder: { minS: 2.4, maxS: 5 }, number: { minS: 2.6, maxS: 5 },
  forYou: { minS: 2.4, maxS: 5 }, action: { minS: 2.8, maxS: 5.5 }, reveal: { minS: 2.0, maxS: 2.8 }, score: { minS: 2.5, maxS: 4 }, cheat: { minS: 2.5, maxS: 4 }, sources: { minS: 2.5, maxS: 4 },
};
/** The guess options appear here (after the cold open and the rewind), as three chips; at GUESS_CORNER_S they move
 *  to the top corner, where they stay until the reveal. */
export const GUESS_FROM_S = 0.95, GUESS_CORNER_S = 3.0;
/** The reveal begins this long before the end frame (the 24 h beat and the last card's end). */
export const REVEAL_S = SEG_TIME.reveal.maxS;

/** A line the spine put on a card: its kind and the item-specific numbers it says (story keys, or 'act:…'/'live:…'). */
export interface SpineLine { kind: 'ladder' | 'number' | 'forYou' | 'action'; keys: string[]; grade?: Level; /** number: the big figure and its anchor */ big?: string; anchor?: string;
  /** what it means, said by the voice after the card (the story's ladder for that number: no number of its own) */ soWhat?: string;
  /** a card the spine wrote (a generic card numbered, the number, for you, the action), not one of the model's story */ own?: true }
export interface SpineGuess { key: string; question: string; options: [string, string, string]; answer: 0 | 1 | 2; letter: 'A' | 'B' | 'C'; claim: string; grade: Level }
export interface SpineEnd { axes: { key: AxisKey; label: string; word: string; tier: 0 | 1 | 2 | 3 | null }[]; cheat: { label: string; text: string; keys: string[] }[]; sources: string; body: string }
export interface Spine {
  v: 5; hook: Hook; guess: SpineGuess | null; lines: Record<string, SpineLine>; end: SpineEnd; nums: TeleNum[];
  /** the body the numbers are estimated for ("a 70 kg adult") */ body: string;
  /** the numbers already said in the headline and on the end frame (they count in the budget) */ fixed: Record<string, number>;
  /** facts for the wordless stretches (a lull): the item's numbers no card has said (spineStops) */ chips: { title: string; text: string; keys: string[] }[];
  /** the story's moments pinned on the live curve as the clock reaches them ("peak · 45 min"): which curve, where on the
   *  day axis (0..1), the words and their numbers (spineStops, within the budget) */
  pins: { curve: PinCurve; u: number; label: string; keys: string[] }[];
  /** what of it is still in the gut over the day (the route model, 64 samples on the day axis), for the panel when no
   *  blood curve is clear (water, a plain tea): its label and unit */
  gut?: { label: string; unit: string; curve: number[] };
}
/** The curves the panel draws (video-body mainGauge): blood alcohol, blood sugar, caffeine, blood fat, or the gut. */
export type PinCurve = 'bac' | 'glucose' | 'caffeine' | 'tg' | 'gut';

const ANSWER_LETTERS = ['A', 'B', 'C'] as const;
const r1 = (x: number) => Math.round(x * 10) / 10;
const h12 = (min: number) => { const h = Math.round(min / 30) / 2; return `${h} h`; };
/** The site's address when it is set at build time (VITE_SITE_URL, as scripts/site-meta.mjs SITE_URL), else ''. */
const SITE_URL: string = (() => { try { return String((import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_SITE_URL ?? '').trim().replace(/\/+$/, ''); } catch { return ''; } })();
/** "Sources: Inside 24h · Cola" (+ " · inside24h.app/food/cola" once the site has its address). */
export function sourcesLine(name: string, slug: string, site = SITE_URL): string {
  const host = site.replace(/^https?:\/\//, '');
  return `Sources: Inside 24h · ${name}${host ? ` · ${host}/food/${slug}` : ''}`;
}

// ---- the guess ----
/** A hook class whose question one story number answers (that number is the guess). */
const CLASS_KEY: Partial<Record<HookClass, string>> = {
  stomach: 'stomachHalfMin', stomachN: 'stomachHalfMin', stomachFat: 'stomachHalfMin',
  alcoholGone: 'alcoholGoneMin', alcoholGoneN: 'alcoholGoneMin', alcoholGoneG: 'alcoholGoneMin',
  bedtimeQ: 'caffeineAtBedMg', sugarHit: 'sugarPct', sugarHigh: 'sugarPct', fatBlood: 'tgPeakH',
  day: 'leftPct', dayN: 'leftPct', fiberDay: 'leftPct', blood: 'bloodMin', bloodN: 'bloodMin',
};
/** How a guessed number is written, said and claimed. */
interface GForm { value: (n: StoryNumber) => number; fmt: (v: number) => string; decimals?: boolean; max?: number; claim: (n: StoryNumber, v: number, bed: string) => string }
const GFORM: Record<string, GForm> = {
  kcal: { value: (n) => n.value, fmt: (v) => `${v} kcal`, claim: (n) => `${n.text} in this serving.` },
  sugarG: { value: (n) => n.value, fmt: (v) => `${v} g`, claim: (n) => `${n.text} of sugar${n.anchor ? ` ${n.anchor}` : ''}.` },
  caffeineMg: { value: (n) => n.value, fmt: (v) => `${v} mg`, claim: (n) => `${n.text} of caffeine${n.anchor ? ` ${n.anchor}` : ''}.` },
  caffeineAtBedMg: { value: (n) => n.value, fmt: (v) => `${v} mg`, claim: (n, _v, bed) => `${n.text} of caffeine still in you at bedtime (${bed}).` },
  alcoholG: { value: (n) => n.value, fmt: (v) => `${v} g`, claim: (n) => `${n.text} of pure alcohol${n.anchor ? ` ${n.anchor}` : ''}.` },
  alcoholGoneMin: { value: (n) => Math.round(n.value / 30) / 2, fmt: (v) => `${v} h`, decimals: true, max: 48, claim: (_n, v) => `Gone after about ${v} h in a typical body. Never drive after drinking.` },
  proteinG: { value: (n) => n.value, fmt: (v) => `${v} g`, claim: (n) => `${n.text} of protein.` },
  fiberG: { value: (n) => n.value, fmt: (v) => `${v} g`, claim: (n) => `${n.text} of fiber.` },
  satFatG: { value: (n) => n.value, fmt: (v) => `${v} g`, claim: (n) => `${n.text} of saturated fat.` },
  sodiumMg: { value: (n) => n.value, fmt: (v) => `${v} mg`, claim: (n) => `${n.text} of sodium.` },
  energyDensity: { value: (n) => Math.round(n.value * 100), fmt: (v) => `${v} kcal`, max: 900, claim: (_n, v) => `${v} kcal in every 100 g.` },
  stomachHalfMin: { value: (n) => n.value, fmt: (v) => (v >= 120 ? h12(v) : `${v} min`), claim: (n) => `Half has left your stomach after about ${n.text}.` },
  waterMl: { value: (n) => n.value, fmt: (v) => `${v} ml`, claim: (n) => `${n.text} of water${n.anchor ? ` ${n.anchor}` : ''}.` },
  tgPeakH: { value: (n) => n.value, fmt: (v) => `${v} h`, decimals: true, max: 24, claim: (n) => `Blood fat peaks about ${n.text} after eating.` },
  // (the model's own numbers that answer a hook's question; never a mmol/L on screen: the rise against your usual level)
  sugarPct: { value: (n) => n.value, fmt: (v) => `+${v} %`, max: 400, claim: (_n, v) => `Blood sugar up about ${v} % over usual, in a typical body.` },
  leftPct: { value: (n) => n.value, fmt: (v) => `${v} %`, max: 100, claim: (_n, v) => `${v} % of it has left your body after 24 hours.` },
  bloodMin: { value: (n) => n.value, fmt: (v) => (v >= 120 ? h12(v) : `${v} min`), claim: (n) => `It is in your blood about ${n.text} after the first sip or bite.` },
};
/** Questions for a hook that asks none (its line was a promise: "Watch where those 9 teaspoons go."), by the number
 *  they ask about; the food's own seed picks the wording, so no question is on more than a few percent of videos. */
export const QUESTION_POOL: Record<string, readonly string[]> = {
  kcal: ['Guess: how many kcal?', 'Guess first: how many kcal is it?', 'How many kcal, do you think?', 'Can you guess its kcal?', 'Guess: how many kcal does it bring?', 'What would you guess: how many kcal?'],
  sugarG: ['Guess: how much sugar?', 'Guess first: how much sugar is in it?', 'How many grams of sugar, do you think?', 'Can you guess its sugar?', 'Guess: how much sugar does it hold?', 'What would you guess: how much sugar?'],
  caffeineMg: ['Guess: how much caffeine?', 'Guess first: how much caffeine is in it?', 'How much caffeine, do you think?', 'Can you guess its caffeine?', 'Guess: how many milligrams of caffeine?', 'What would you guess: how much caffeine?'],
  caffeineAtBedMg: ['Guess: how much caffeine is left at bedtime?', 'How much caffeine is left at bedtime?', 'Guess first: what is left at bedtime?', 'Can you guess what is left at bedtime?', 'What would you guess is left at bedtime?'],
  alcoholG: ['Guess: how much pure alcohol?', 'Guess first: how much alcohol is in it?', 'How much pure alcohol, do you think?', 'Can you guess its alcohol?', 'Guess: how many grams of alcohol?'],
  alcoholGoneMin: ['Guess: when is the alcohol gone?', 'Guess first: how long does the alcohol stay?', 'How long until it is gone, do you think?', 'Can you guess when it is gone?'],
  proteinG: ['Guess: how much protein?', 'Guess first: how much protein is in it?', 'How much protein, do you think?', 'Can you guess its protein?', 'Guess: how many grams of protein?', 'What would you guess: how much protein?'],
  fiberG: ['Guess: how much fiber?', 'Guess first: how much fiber is in it?', 'How much fiber, do you think?', 'Can you guess its fiber?', 'Guess: how many grams of fiber?', 'What would you guess: how much fiber?'],
  satFatG: ['Guess: how much saturated fat?', 'Guess first: how much saturated fat?', 'How much saturated fat, do you think?', 'Can you guess its saturated fat?', 'What would you guess: how much saturated fat?'],
  sodiumMg: ['Guess: how much sodium?', 'Guess first: how much sodium is in it?', 'How much sodium, do you think?', 'Can you guess its sodium?', 'Guess: how many milligrams of sodium?', 'What would you guess: how much sodium?'],
  energyDensity: ['Guess: how many kcal in 100 g?', 'Guess first: how many kcal per 100 g?', 'How many kcal in 100 g, do you think?', 'Can you guess its kcal per 100 g?', 'What would you guess: kcal in 100 g?'],
  stomachHalfMin: ['Guess: when has half left your stomach?', 'Guess first: when is your stomach half empty?', 'How soon is half out of your stomach?', 'Can you guess when half leaves your stomach?'],
  waterMl: ['Guess: how much water does it bring?', 'Guess first: how much water is in it?', 'How much water, do you think?', 'Can you guess its water?', 'What would you guess: how much water?'],
};

// ---- the budget: each item-specific number in at most PER_NUMBER_MAX visuals ----
class Budget {
  uses = new Map<string, number>();
  /** a line whose nutrient another card says with another number ("4.7 g of carbs" beside "5 g of carbs"): spineStops */
  clash: (line: string) => boolean = () => false;
  /** the number card's keys: the "for you" line says another number (never "41 kcal: 2% of a day" and "2% of a day" both) */
  numberKeys = new Set<string>();
  constructor(readonly nums: TeleNum[], readonly reserved: Set<string>) {
    // (a drink whose water is its serving, "250 ml of decaf filter coffee" with its 248 ml of water: the serving's own
    // name and first card already say that number twice)
    const g = nums.find((n) => n.key === 'grams'), w = nums.find((n) => n.key === 'waterMl');
    if (g && w && Math.abs(g.value - w.value) <= 0.06 * g.value) this.uses.set('waterMl', SPINE.PER_NUMBER_MAX);
  }
  keysOf(text: string, extra: readonly string[] = []) { return [...new Set([...numbersShown(text, this.nums), ...extra])]; }
  /** true when a visual saying these keys fits (and counts it) */
  take(keys: readonly string[]): boolean {
    if (keys.some((k) => this.left(k) < 1)) return false;
    for (const k of keys) this.uses.set(k, (this.uses.get(k) ?? 0) + 1);
    return true;
  }
  count(keys: readonly string[]) { for (const k of keys) this.uses.set(k, (this.uses.get(k) ?? 0) + 1); }
  // (the serving's own size, "115 g", is what the video is about, as its name: never short of room, video-telemetry SERVING)
  left(k: string) { return this.reserved.has(k) ? 0 : k === 'grams' ? SPINE.PER_NUMBER_MAX : SPINE.PER_NUMBER_MAX - (this.uses.get(k) ?? 0); }
}

/** What the spine needs besides the story. */
export interface SpineIn {
  story: FoodStory; hook: Hook; name: string; cut: Cut; seed?: number;
  /** the end card's lines (video-story endCardOf: the 24 h line, the peak): their numbers are said there once */ endLines: string[];
  /** the model run (live values: the urine, the energy taken up, the bedtime) */ built: BuiltLike & { energy?: { total: number; absorbed?: (m: number) => number } };
  /** the day's chapters with their words (the 24 h share that has left the body) */ chapters: { min: number; title: string; text?: string }[];
  alcohol: boolean; caffeineMg: number; bed: string;
  /** the body's water (L, the profile's: analyze bodyWaterL), for what a drink's water means for you */ bodyWaterL?: number;
}
const N_ = (s: FoodStory, k: string): StoryNumber | undefined => s.numbers[k];

/** The guess's number: a story number, or one the model gives for a hook's own question. */
function guessNumber(c: SpineIn, key: string): StoryNumber | undefined {
  const s = c.story;
  if (key === 'sugarPct') {
    const p = N_(s, 'sugarPeak');
    if (!p || p.value < 0.5) return undefined;
    const v = Math.round((100 * p.value) / 5.0); // (against a usual 5.0 mmol/L, video-body USUAL_MMOL: the gauge's own words)
    return { key, value: v, unit: '%', text: `+${v} %`, grade: p.grade, sources: p.sources, origin: 'model', itemSpecific: true };
  }
  if (key === 'bloodMin') {
    // (the hook's own answer moment: "Into your blood", when the model's story says it gets there)
    const ch = c.hook.payoffMin !== undefined ? c.chapters.find((x) => Math.abs(x.min - c.hook.payoffMin!) <= 1) : c.chapters.find((x) => x.title === c.hook.payoff);
    const v = ch ? Math.round(ch.min) : NaN;
    if (!(v >= 2 && v <= 600)) return undefined;
    return { key, value: v, unit: 'min', text: v < 120 ? `${v} min` : `${Math.round(v / 30) / 2} h`, grade: 'B', sources: ['mudie2014'], origin: 'model', itemSpecific: true };
  }
  if (key === 'leftPct') {
    const day = c.chapters.find((ch) => /% has left your body so far/.test(ch.text ?? '')), v = Number(/(\d+)% has left your body so far/.exec(day?.text ?? '')?.[1] ?? NaN);
    if (!(v >= 3 && v <= 100)) return undefined;
    return { key, value: v, unit: '%', text: `${v} %`, grade: 'C', sources: ['camps2016'], origin: 'model', itemSpecific: true };
  }
  return N_(s, key);
}
function guessFor(c: SpineIn, key: string, question: string, seed: number): SpineGuess | null {
  const n = guessNumber(c, key), f = GFORM[key];
  if (!n || !f) return null;
  const truth = f.decimals ? r1(f.value(n)) : Math.round(f.value(n));
  const g = guessOptions(truth, seed + key.length * 7, !!f.decimals, f.max);
  if (!g) return null;
  // (the three options in one unit: "1 h / 2 h / 3.5 h", never "60 min / 2 h")
  let opts = g.opts.map(f.fmt) as [string, string, string];
  if (opts.some((o) => / h$/.test(o)) && opts.some((o) => / min$/.test(o))) opts = g.opts.map((v) => `${r1(v / 60)} h`) as [string, string, string];
  if (new Set(opts).size < 3) return null;
  // (the reveal says the answer as the option does: "9 g of protein", never "8.7 g" next to a "9 g" option)
  const said = { ...n, text: opts[g.answer] };
  return { key, question, options: opts, answer: g.answer, letter: ANSWER_LETTERS[g.answer], claim: f.claim(said, truth, c.bed), grade: n.grade };
}

/** The hook (its question), the guess and the reveal. A hook that asks a question one number answers keeps it, and that
 *  number is the guess; a hook that only promises ("Watch where those 9 teaspoons go.") asks the story's most surprising
 *  number instead (story.surprises, never one the hook's other line already says). The hook's own answer card is not
 *  said in the story any more: the reveal answers it, in the last seconds. */
/** Which of the food's own numbers a question opens with, by the number it asks about ("40 mg of caffeine: what is left
 *  at bedtime?"): two foods of a class that ask the same never ask it alike (video-sameness.test, phase 4e M5). */
const Q_CONTEXT: Record<string, readonly string[]> = {
  caffeineAtBedMg: ['caffeineMg'], stomachHalfMin: ['kcal', 'sugarG', 'fatG', 'proteinG'], kcal: ['proteinG', 'fatG', 'carbsG', 'sugarG'],
  sugarG: ['kcal', 'carbsG', 'fiberG'], proteinG: ['kcal', 'fatG', 'carbsG'], fiberG: ['kcal', 'carbsG'], satFatG: ['fatG', 'kcal'], sodiumMg: ['kcal', 'fatG', 'proteinG'],
  caffeineMg: ['kcal', 'sugarG'], energyDensity: ['proteinG', 'fatG'], waterMl: ['kcal', 'sugarG'], leftPct: ['kcal', 'fatG'], bloodMin: ['kcal', 'sugarG'],
};
const Q_NOUN: Record<string, string> = { caffeineMg: 'of caffeine', alcoholG: 'of alcohol', kcal: '', sugarG: 'of sugar', fatG: 'of fat', carbsG: 'of carbs', proteinG: 'of protein', fiberG: 'of fiber' };
const words = (x: string) => x.replace(/\s*\([^)]*\)/g, '').split(/\s+/).filter(Boolean).length;
/** The question with one of the food's own numbers first, one the headline does not say and that does not give the answer away. */
function ownQuestion(c: SpineIn, key: string, q: string, stmt: string): string {
  if (/\d/.test(q.replace(/\b100 g\b/g, ''))) return q;
  const shown = new Set(numbersShown(stmt, teleNumsOf(c.story.numbers))), away = new Set([key, ...(GIVES_AWAY[key] ?? [])]);
  // (short enough for the voice to say with the food's name in the hook's slot: the question at most 48 characters)
  const body = q.replace(/^Guess(?: first)?:\s*/i, ''), say = (x: string) => `${N_(c.story, x)!.text}${Q_NOUN[x] && !(key === 'caffeineAtBedMg' && x === 'caffeineMg') ? ` ${Q_NOUN[x]}` : ''}: ${body.charAt(0).toLowerCase()}${body.slice(1)}`;
  // (which of them: the food's own seed, among those that fit, so two foods of a class open on different ones)
  const inStory = (x: string) => c.chapters.some((ch) => (ch.text ?? '').includes(N_(c.story, x)!.text));
  const ks = (Q_CONTEXT[key] ?? ['kcal', 'fatG']).filter((x) => !away.has(x) && !shown.has(x) && !!N_(c.story, x)?.text && !inStory(x) && !(c.alcohol && x === 'kcal') && (N_(c.story, x)?.value ?? 0) >= (x === 'kcal' ? 5 : 1) && !!N_(c.story, x)?.text && say(x).length <= 48 && say(x).split(/\s+/).length <= 10);
  // (never with alcohol: its hooks say their grams and its questions are the liver's, and the voice says the grams first)
  if (c.alcohol) return q;
  const k = ks.length ? ks[((c.seed ?? seedOf(c.name)) >>> 5) % ks.length] : undefined;
  return k ? say(k) : q;
}
export function guessOf(c: SpineIn): { hook: Hook; guess: SpineGuess | null } {
  const h = c.hook, seed = c.seed ?? seedOf(c.name), lines = [h.line1, h.line2];
  const qi = lines.findIndex((l) => /\?\s*$/.test(l.trim())), cls = hookClassOf(h);
  // (never a guess the headline already answers by a sum: "4 teaspoons of sugar" says its grams)
  const away = (key: string, stmt: string) => { const sh = numbersShown(stmt, teleNumsOf(c.story.numbers)); return sh.includes(key) || (GIVES_AWAY[key] ?? []).some((k) => sh.includes(k)) || (key === 'sugarG' && /teaspoon|sugar cube/i.test(stmt)); };
  if (qi >= 0 && !(cls && CLASS_KEY[cls] && away(CLASS_KEY[cls]!, lines[1 - qi] ?? ''))) {
    const key = cls ? CLASS_KEY[cls] : undefined, q1 = key ? ownQuestion(c, key, lines[qi].trim(), lines[1 - qi] ?? '') : '', q = q1 && words(c.name) + words(q1) <= 14 ? q1 : lines[qi].trim(), g = key ? guessFor(c, key, q, seed) : null;
    if (g) return { hook: { ...h, ...(qi === 0 ? { line1: q } : { line2: q }), answer: undefined }, guess: g };
  }
  // the line that names the food stays (the headline says what it is, video-telemetry hookNamesFood); the other one, a
  // promise or a claim ("At bedtime, almost all of its 63 mg remains."), becomes the question
  const names = (l: string) => hookNamesFood(l, c.name);
  // (a question of its own that names the food, "1 decaf espresso: is there still caffeine in it?", stays the one
  // question: the story answers it, and no second question joins it)
  if (qi >= 0 && !names(lines[1 - qi] ?? '')) return { hook: h, guess: null };
  const si = qi >= 0 ? 1 - qi : names(h.line1) || !h.line2 ? 0 : names(h.line2) ? 1 : /\d/.test(h.line1) ? 0 : 1;
  const shown = new Set(numbersShown(lines[si] ?? '', teleNumsOf(c.story.numbers)));
  const obvious = (k: string) => k === 'waterMl' && (N_(c.story, 'waterMl')?.value ?? 0) >= 0.9 * (N_(c.story, 'grams')?.value ?? Infinity); // (a glass of water's water: its name says it)
  // (a sugar-led drink's end card is its blood sugar: no bedtime caffeine question for it, round 18 category matrix)
  const sugarLed = (N_(c.story, 'sugarG')?.value ?? 0) >= 10 && (N_(c.story, 'sugarPeak')?.value ?? 0) >= 0.5 && c.caffeineMg < 100;
  const cands: Surprise[] = c.story.surprises.filter((s) => !shown.has(s.numberKey) && !away(s.numberKey, lines[si] ?? '') && !(sugarLed && s.numberKey === 'caffeineAtBedMg') && !(c.caffeineMg >= 20 && s.numberKey === 'caffeineMg') /* (a caffeine drink says its mg on a card, round 18: never kept back as a guess) */ && s.numberKey !== 'sugarPeak' && !obvious(s.numberKey) && GFORM[s.numberKey] && QUESTION_POOL[s.numberKey]);
  // (a fallback for a story with no surprise left: its kcal, else its water, as long as they exist)
  const keys = [...cands.map((s) => s.numberKey), ...['stomachHalfMin', 'kcal', 'waterMl', 'sugarG'].filter((k) => !shown.has(k) && !away(k, lines[si] ?? '') && !obvious(k) && (N_(c.story, k)?.value ?? 0) > 0), ...(obvious('waterMl') && !shown.has('waterMl') ? ['waterMl'] : [])];
  for (const key of keys) {
    // (short enough that the voice says the food's name and the whole question in the hook's slot, video-variety)
    const pool = QUESTION_POOL[key], k0 = (seed >>> 3) % pool.length, fits = (x: string) => words(c.name) + words(x) <= 14;
    const q0 = [...pool.slice(k0), ...pool.slice(0, k0)].map((x) => x.replace('{bed}', c.bed)).find(fits) ?? pool[k0].replace('{bed}', c.bed);
    const q1 = ownQuestion(c, key, q0, lines[si] ?? ''), q = fits(q1) ? q1 : q0;
    const g = guessFor(c, key, q, seed);
    if (!g) continue;
    const hook: Hook = si === 0 ? { ...h, line2: q } : { ...h, line1: q };
    // (the moment that answers the new question, as the hook pools name theirs: the end card answers it there too,
    // video-story endCardOf, video-endcard.test)
    const PAY: Record<string, RegExp> = { caffeineAtBedMg: /^Bedtime$/, bloodMin: /blood|^Everywhere in you$/i, alcoholGoneMin: /^Alcohol gone$/, tgPeakH: /blood fat/i, waterMl: /^Kidneys$/ };
    const payCh = PAY[key] ? c.chapters.find((ch) => PAY[key].test(ch.title) && ch.min > 0) : undefined;
    const payMin = key === 'stomachHalfMin' ? N_(c.story, 'stomachHalfMin')?.value : undefined;
    return { hook: { ...hook, answer: undefined, payoff: payCh?.title, payoffMin: payMin }, guess: g };
  }
  return { hook: h, guess: null };
}

// ---- numbered cards: a generic card says the cause with the item's own number ----
type Cand = [string, string[]];
interface RuleCtx { s: FoodStory; N: Record<string, StoryNumber>; c: SpineIn; min: number }
const t = (x: RuleCtx, k: string) => x.N[k]?.text;
/** The share of its energy a macronutrient gives (Atwater: 9 kcal per g of fat, 4 per g of carbs or protein): arithmetic
 *  on the food's own numbers, keyed 'rule:…'. */
const share = (x: RuleCtx, k: 'fatG' | 'carbsG' | 'proteinG') => { const kc = x.N.kcal?.value ?? 0, g = x.N[k]?.value ?? 0; return kc >= 30 && g > 0 ? Math.round((100 * g * (k === 'fatG' ? 9 : 4)) / kc) : 0; };
const shareCand = (x: RuleCtx, k: 'fatG' | 'carbsG' | 'proteinG', say: string): Cand | null => { const v = share(x, k); return v >= 5 && v <= 100 ? [`${say} ${/carbs$/.test(say) ? 'give' : 'gives'} ${v}% of its energy.`, [`rule:${k}Pct`]] : null; };
/** A blood sugar card only for a food whose model has a blood sugar rise (video-4j M3: carrots' 4 g of carbs do not). */
const sugarOk = (x: RuleCtx, line: string) => (x.N.sugarPeak?.value ?? 0) >= 0.5 || !/blood sugar|insulin|glucose/i.test(line);
const pos = (x: RuleCtx, k: string, min = 1) => (x.N[k]?.value ?? 0) >= min;
/** A card for each generic card the beats make (video-beats): the same moment, with a number of this food. */
const NUMBERED: [RegExp, (x: RuleCtx) => (Cand | null)[]][] = [
  // (phase P2, full tier: the last generic cards of the sweep, each with a number of this food)
  [/^Many people feel sleepy after a big meal\.$/, (x) => [!x.c.alcohol && pos(x, 'kcal', 100) && x.N.kcalPct ? [`${t(x, 'kcal')}: ${t(x, 'kcalPct')} of a 2,000 kcal day.`, ['kcal', 'kcalPct']] : null, !x.c.alcohol && pos(x, 'kcal', 300) ? [`${t(x, 'kcal')} in one meal.`, ['kcal']] : null, pos(x, 'fatG', 5) ? [`${t(x, 'fatG')} of fat, the slowest part.`, ['fatG']] : null]],
  [/^About (half|three quarters|a quarter|a third|two thirds) of the caffeine remains\.$/, (x) => [pos(x, 'caffeineAtBedMg', 1) ? [`${t(x, 'caffeineAtBedMg')} of caffeine still in you.`, ['caffeineAtBedMg']] : null]],
  [/^The urine collects in your bladder for hours\.$/, (x) => { const up = urinePeak(x.c.built); return [up && up.ml >= 20 ? [`Up to ${Math.round(up.ml)} ml of urine collects there.`, ['live:urinePeak']] : null, pos(x, 'waterMl', 50) ? [`Your kidneys filter its ${t(x, 'waterMl')} of water.`, ['waterMl']] : null]; }],
  [/^Most of the drink has been absorbed now\.$/, (x) => [pos(x, 'sodiumMg', 5) ? [`Its ${t(x, 'sodiumMg')} of sodium are in your blood.`, ['sodiumMg']] : null]],
  [/^Your stomach churns it into a paste\.$/, (x) => [pos(x, 'grams', 30) ? [`Your stomach churns ${t(x, 'grams')} into a paste.`, ['grams']] : null, pos(x, 'stomachHalfMin') ? [`Half of it leaves after about ${t(x, 'stomachHalfMin')}.`, ['stomachHalfMin']] : null, !x.c.alcohol && pos(x, 'kcal', 30) ? [`Its ${t(x, 'kcal')} slow your stomach down.`, ['kcal']] : null]],
  [/^The (?:food|drink) is mostly in your stomach\.$/, (x) => [pos(x, 'stomachHalfMin') ? [`Half of it leaves after about ${t(x, 'stomachHalfMin')}.`, ['stomachHalfMin']] : null, pos(x, 'fatG', 3) ? [`Its ${t(x, 'fatG')} of fat leave last.`, ['fatG']] : null, !x.c.alcohol && pos(x, 'kcal', 30) ? [`Its ${t(x, 'kcal')} slow your stomach down.`, ['kcal']] : null, pos(x, 'grams', 30) ? [`Your stomach holds ${t(x, 'grams')} of it now.`, ['grams']] : null]],
  [/^The fat leaves last\.$/, (x) => [pos(x, 'fatG', 1) ? [`Its ${t(x, 'fatG')} of fat leave last.`, ['fatG']] : null]],
  [/^The drink slows your stomach down\.$/, (x) => [!x.c.alcohol && pos(x, 'kcal', 20) ? [`Its ${t(x, 'kcal')} slow your stomach down.`, ['kcal']] : null, pos(x, 'sugarG', 2) ? [`Its ${t(x, 'sugarG')} of sugar slow your stomach.`, ['sugarG']] : null]],
  [/^Water barely stops here\.$|^About as fast as water\.$/, (x) => [pos(x, 'stomachHalfMin') ? [`Half moves on within ${t(x, 'stomachHalfMin')}.`, ['stomachHalfMin']] : null]],
  [/^In the small intestine it is taken apart\.$/, (x) => [pos(x, 'carbsG', 2) ? [`Its ${t(x, 'carbsG')} of carbs are taken apart.`, ['carbsG']] : null, pos(x, 'proteinG', 2) ? [`Its ${t(x, 'proteinG')} of protein is taken apart.`, ['proteinG']] : null, pos(x, 'fatG', 2) ? [`Its ${t(x, 'fatG')} of fat is taken apart.`, ['fatG']] : null, shareCand(x, 'carbsG', 'Its carbs')]],
  [/^Bile helps break down the fat\.$/, (x) => [pos(x, 'fatG', 1) ? [`Bile breaks down its ${t(x, 'fatG')} of fat.`, ['fatG']] : null, pos(x, 'satFatDv', 5) ? [`${t(x, 'satFatDv')} of a day's saturated fat is here.`, ['satFatDv']] : null]],
  [/^Sugar and protein pieces enter your blood\.$|^The pieces pass into your blood\.$/, (x) => [pos(x, 'sugarG', 2) ? [`Its ${t(x, 'sugarG')} of sugar pass into your blood.`, ['sugarG']] : null, pos(x, 'proteinG', 2) ? [`Its ${t(x, 'proteinG')} of protein pass into your blood.`, ['proteinG']] : null, pos(x, 'carbsG', 2) ? [`Its ${t(x, 'carbsG')} of carbs pass into your blood.`, ['carbsG']] : null, shareCand(x, 'proteinG', 'Its protein'), shareCand(x, 'carbsG', 'Its carbs')]],
  [/^The sugar passes into your blood\.$|^Your small intestine absorbs it within minutes\.$/, (x) => [pos(x, 'sugarG', 1) ? [`Its ${t(x, 'sugarG')} of sugar pass into your blood.`, ['sugarG']] : null, pos(x, 'carbsG', 2) ? [`Its ${t(x, 'carbsG')} of carbs pass into your blood.`, ['carbsG']] : null, shareCand(x, 'carbsG', 'Its carbs'), pos(x, 'waterMl', 50) ? [`Its ${t(x, 'waterMl')} of water pass into your blood.`, ['waterMl']] : null, pos(x, 'grams', 10) ? [`All ${t(x, 'grams')} of it are absorbed fast.`, ['grams']] : null]],
  [/^Fat takes a slower route, via the lymph\.$/, (x) => [pos(x, 'fatG', 1) ? [`Its ${t(x, 'fatG')} of fat take the lymph route.`, ['fatG']] : null, pos(x, 'tgPeakH') ? [`Blood fat peaks about ${t(x, 'tgPeakH')} in.`, ['tgPeakH']] : null, shareCand(x, 'fatG', 'Its fat')]],
  [/^Insulin brings your blood sugar back down\.$/, (x) => [pos(x, 'sugarBackMin') ? [`Back to your usual level after ${t(x, 'sugarBackMin')}.`, ['sugarBackMin']] : null, pos(x, 'carbsG', 2) ? [`Insulin handles its ${t(x, 'carbsG')} of carbs.`, ['carbsG']] : null]],
  [/^A gentle rise\.$|^Your blood sugar climbs to its peak\.$/, (x) => [pos(x, 'sugarPeakMin') ? [`Blood sugar peaks ${inText(x.N.sugarPeakMin.value)}.`, ['sugarPeakMin']] : null, pos(x, 'carbsG', 2) ? [`Its ${t(x, 'carbsG')} of carbs become blood sugar.`, ['carbsG']] : null]],
  [/^The fat joins your blood later\.$|^Blood fat is highest around now\.$/, (x) => [pos(x, 'tgPeakH') ? [`Blood fat peaks about ${t(x, 'tgPeakH')} in.`, ['tgPeakH']] : null, pos(x, 'fatG', 1) ? [`Its ${t(x, 'fatG')} of fat reach your blood.`, ['fatG']] : null, pos(x, 'satFatG', 1) ? [`Its ${t(x, 'satFatG')} of saturated fat arrive too.`, ['satFatG']] : null, shareCand(x, 'fatG', 'Its fat')]],
  [/^Protein keeps arriving for hours\.$/, (x) => [pos(x, 'proteinG', 2) ? [`Its ${t(x, 'proteinG')} of protein arrive for hours.`, ['proteinG']] : null, pos(x, 'proteinDv', 5) ? [`${t(x, 'proteinDv')} of a day's protein keeps arriving.`, ['proteinDv']] : null, shareCand(x, 'proteinG', 'Its protein')]],
  [/^Fiber goes on undigested\.$/, (x) => [pos(x, 'fiberG', 0.5) ? [`Its ${t(x, 'fiberG')} of fiber go on undigested.`, ['fiberG']] : null]],
  [/^The fiber reaches your large intestine\.$/, (x) => [pos(x, 'fiberDv', 2) ? [`${t(x, 'fiberDv')} of a day's fiber arrives here.`, ['fiberDv']] : null, pos(x, 'fiberG', 0.5) ? [`Its ${t(x, 'fiberG')} of fiber arrive here now.`, ['fiberG']] : null]],
  [/^Your gut bacteria start feeding on it\.$/, (x) => [pos(x, 'fiberG', 0.5) ? [`Gut bacteria feed on its ${t(x, 'fiberG')} of fiber.`, ['fiberG']] : null]],
  [/^Most of the fiber is still in you\.$/, (x) => [pos(x, 'fiberG', 0.5) ? [`Its ${t(x, 'fiberG')} of fiber: mostly still in you.`, ['fiberG']] : null, pos(x, 'fiberDv', 2) ? [`${t(x, 'fiberDv')} of a day's fiber: still in you.`, ['fiberDv']] : null]],
  [/^The leftovers creep along your large intestine\.$/, (x) => [pos(x, 'fiberDv', 2) ? [`${t(x, 'fiberDv')} of a day's fiber creeps along.`, ['fiberDv']] : null, pos(x, 'fiberG', 0.5) ? [`Its ${t(x, 'fiberG')} of fiber creep along.`, ['fiberG']] : null]],
  [/^Protein is broken into building blocks\.$/, (x) => [pos(x, 'proteinG', 2) ? [`Its ${t(x, 'proteinG')} of protein become building blocks.`, ['proteinG']] : null, shareCand(x, 'proteinG', 'Its protein')]],
  [/^Caffeine blocks the tiredness signal a little\.$/, (x) => [pos(x, 'caffeineMg', 10) ? [`Its ${t(x, 'caffeineMg')} block the tiredness signal.`, ['caffeineMg']] : null]],
  [/^.+ hydrates like the same amount of water\.$/, (x) => [pos(x, 'waterMl', 50) ? [`Its ${t(x, 'waterMl')} count like water.`, ['waterMl']] : null]],
  [/^Its calories slow your stomach down\.$/, (x) => [!x.c.alcohol && pos(x, 'kcal', 20) ? [`Its ${t(x, 'kcal')} slow your stomach down.`, ['kcal']] : null, pos(x, 'energyDensity', 0.2) ? [`Its ${Math.round(x.N.energyDensity.value * 100)} kcal per 100 g slow your stomach.`, ['energyDensity']] : null]],
  [/^The urine collects in your bladder for hours\.$|^Most of it collects in your bladder\.$/, (x) => { const up = urinePeak(x.c.built); return [up && up.ml >= 5 ? [`Up to ${Math.round(up.ml)} ml of urine collects there.`, ['live:urinePeak']] : null]; }],
  [/^Your kidneys start filtering out the extra water\.$/, (x) => { const up = urinePeak(x.c.built); return [pos(x, 'waterMl', 50) ? [`Your kidneys filter its ${t(x, 'waterMl')} of water.`, ['waterMl']] : null, up && up.ml >= 5 ? [`Up to ${Math.round(up.ml)} ml of urine collects there.`, ['live:urinePeak']] : null]; }],
  [/^The water spreads through your whole body\.$/, (x) => [pos(x, 'waterMl', 50) ? [`Its ${t(x, 'waterMl')} spread through your whole body.`, ['waterMl']] : null]],
  [/^Most of the (?:food|drink) has been absorbed now\.$/, (x) => { const en = x.c.built.energy, up = urinePeak(x.c.built); const p = en?.absorbed && en.total >= 20 ? Math.round((100 * Math.min(en.total, en.absorbed(Math.min(1440, x.min)))) / en.total) : NaN; return [!x.c.alcohol && p >= 50 && p <= 100 ? [`${p}% of its energy is taken up now.`, [`live:absorbed@${Math.round(x.min)}`]] : null, pos(x, 'waterMl', 50) ? [`Its ${t(x, 'waterMl')} of water are in your blood.`, ['waterMl']] : null, up && up.ml >= 5 ? [`Up to ${Math.round(up.ml)} ml of urine collects there.`, ['live:urinePeak']] : null]; }],
  [/^Your blood sugar dips below where it started\.$/, (x) => { const d = dipPct(x.c.built); return [d >= 3 ? [`Blood sugar dips about ${d}% below usual.`, ['live:dip']] : null]; }],
  [/^There is still alcohol in your blood\.$/, (x) => [pos(x, 'alcoholGoneMin') && x.N.alcoholGoneMin.value > minutesToBed(x) ? [`Not gone until about ${t(x, 'alcoholGoneMin')} in.`, ['alcoholGoneMin']] : null]],
  [/^Most of the drink has been absorbed now\.$/, (x) => [pos(x, 'waterMl', 50) ? [`Its ${t(x, 'waterMl')} of water are in your blood.`, ['waterMl']] : null]],
  [/^Blood alcohol is at its highest now\.$/, (x) => [pos(x, 'bacPeakMin') ? [`Blood alcohol peaks ${inText(x.N.bacPeakMin.value)}.`, ['bacPeakMin']] : null]],
  [/^Your gut absorbs all of the caffeine\.$/, (x) => [pos(x, 'caffeineMg', 10) ? [`Your gut absorbs all ${t(x, 'caffeineMg')} of it.`, ['caffeineMg']] : null]],
  [/^Caffeine slips into your brain\.$/, (x) => [pos(x, 'caffeineMg', 10) ? [`Its ${t(x, 'caffeineMg')} of caffeine reach your brain.`, ['caffeineMg']] : null, pos(x, 'caffeinePeakMin') ? [`In your brain, it peaks ${inText(x.N.caffeinePeakMin.value)}.`, ['caffeinePeakMin']] : null]],
  [/^The caffeine reaches your brain\.$/, (x) => [pos(x, 'caffeineMg', 10) ? [`Its ${t(x, 'caffeineMg')} of caffeine reach your brain.`, ['caffeineMg']] : null, pos(x, 'caffeinePeakMin') ? [`Caffeine peaks ${inText(x.N.caffeinePeakMin.value)}.`, ['caffeinePeakMin']] : null]],
  [/^Almost all the caffeine is still in you\.$/, (x) => [pos(x, 'caffeineAtBedMg', 1) ? [`${t(x, 'caffeineAtBedMg')} of caffeine still in you.`, ['caffeineAtBedMg']] : null]],
  [/^Many people feel sleepy after a big meal\.$/, (x) => [!x.c.alcohol && pos(x, 'kcal', 100) ? [`${t(x, 'kcal')}: ${t(x, 'kcalPct')} of a 2,000 kcal day.`, ['kcal', 'kcalPct']] : null]],
  [/^No sugar, no calories\.$/, (x) => [(x.N.kcal?.value ?? 1) < 1 ? ['0 kcal, 0 g sugar.', ['kcal']] : null]],
  [/^No carbs, fat or protein\.$/, (x) => [(x.N.kcal?.value ?? 1) < 1 ? ['0 g carbs, fat or protein.', ['kcal']] : null]],
];
/** The model's own story cards that say this food's number (its chapters: when half has moved on, when it peaks, when it
 *  is gone): item-specific, as a story number is. (Never a population figure: "14–58 hours", "1 in 3".) */
const MODEL_LINE = /^(?:Half (?:has )?moved on|Half moves on|Half leaves|Half of it moves on|Half is still here|Almost all has moved on|Water reaches your blood within|Blood sugar peaks|Caffeine peaks|Half is gone every|The alcohol is gone after about|Alcohol-free \d|Kidneys filter|Your kidneys filter|A regular cup has about)\b.*\d/;
/** The last resort for a generic card no rule could number (a comparison's side must say something at each moment): one
 *  of the food's own numbers that fits the moment's topic, "It has 9.6 g of fat.", within the budget. */
const FALLBACK: [RegExp, string[]][] = [
  [/fiber|large intestine|colon|leftover|toilet/i, ['fiberG', 'fiberDv']],
  [/kidney|urine|bladder|water/i, ['waterMl', 'sodiumMg']],
  [/stomach|paste|churn/i, ['fatG', 'proteinG', 'carbsG']],
  [/intestine|absorb|blood|sugar|insulin|pieces/i, ['carbsG', 'sugarG', 'proteinG', 'fatG']],
];
const NOUN: Record<string, string> = { fiberG: 'fiber', waterMl: 'water', sodiumMg: 'sodium', fatG: 'fat', proteinG: 'protein', carbsG: 'carbs', sugarG: 'sugar' };
/** A myth-buster about alcohol ("Coffee or water won't speed it up."): a safety card, never swapped for a number. */
export const ALCOHOL_MYTH = /won[’']t speed it up|\bsober/i;
function fallbackCard(x: RuleCtx, l: string, left: (k: string) => number, has: (line: string) => boolean = () => false): Cand | null {
  if (ALCOHOL_MYTH.test(l)) return null;
  for (const [re, keys] of FALLBACK) {
    if (!re.test(l)) continue;
    for (const k of keys) {
      const n = x.N[k];
      if (!n || !(n.value > 0) || left(k) < 1) continue;
      const line = k === 'fiberDv' ? `${n.text} of a day's fiber is in it.` : `${n.text} of ${NOUN[k]} per serving.`;
      if (okCard(line) && !has(line)) return [line, [k]]; // (never the same card twice in one video)
    }
  }
  return null;
}
/** Generic cards that tell nothing a number would: left out when the moment has another card. */
/** The blood sugar dip after the peak, as a share under the usual 5.0 mmol/L (the model's curve), or 0. */
function dipPct(b: SpineIn['built']): number {
  const g = b.effects.glucoseMgDl;
  if (!g) return 0;
  let pk = 0; for (let m = 1; m <= Math.min(240, g.length - 1); m++) if (g[m] > g[pk]) pk = m;
  let lo = 0; for (let m = pk; m <= Math.min(1440, g.length - 1); m++) lo = Math.min(lo, g[m]);
  return Math.round((100 * -lo) / 18.016 / 5.0);
}
const minutesToBed = (x: RuleCtx) => x.s.events.find((e) => e.key === 'bedtime')?.min ?? 1e9;
const QUIET = /^(?:The glass has passed through you|Your body water is back in balance|You may fall asleep faster, but sleep (?:worse|lighter)|Later, your sleep is (?:lighter and more broken|a little lighter)|With one drink the effect is small|More drinks make it bigger|Your kidneys flush out its broken-down pieces|Your liver takes the caffeine apart|Your pulse doesn’t change|Blood pressure rises only a little|Probably too little to affect most people’s sleep|Processing it uses a quarter of its calories|Water is taken back on the way|This is the slowest part of the journey|The leftovers creep along your large intestine|Your gut moves the water in small sips|Into the small intestine|Many people feel hungry again around now|Your blood sugar dips below where it started|Caffeine blocks the tiredness signal a little|Blood pressure goes up by a tiny amount|Your blood barely notices one glass)\.?$/;

/** Generic cards that give the guess's answer away in words ("Almost all the caffeine is still in you." before the
 *  reveal of how much is left at bedtime): never said before the reveal. */
const SPOILS: Record<string, RegExp> = {
  caffeineAtBedMg: /caffeine is still in you|still in you at bedtime|caffeine left|of the caffeine remains/i, alcoholGoneMin: /alcohol is gone|still alcohol in your blood/i,
  stomachHalfMin: /half (?:has )?(?:moved on|left|leaves)|mostly in your stomach/i, bloodMin: /reaches your blood within|in your blood within|absorbs it within minutes/i, leftPct: /still in you|has left your body/i, sugarPct: /blood sugar (?:climbs|peaks|is highest)/i,
};
/** Which numbered card a generic one becomes: one no longer than it first (a moment's reading time, and a stay on one
 *  region of the body, does not grow), and between the first two that fit, the food's own seed, so two foods of a class
 *  do not say the same cards (video-segments.test "segment texts"). */
function pickCand(cs: Cand[], l: string, c: SpineIn): Cand | undefined {
  const sorted = [...cs].sort((p, q) => Number(p[0].length > l.length + 6) - Number(q[0].length > l.length + 6));
  const short = sorted.filter((p) => p[0].length <= l.length + 6), pool = (short.length ? short : sorted).slice(0, 3);
  if (!pool.length) return undefined;
  let h = (c.seed ?? seedOf(c.name)) >>> 0; for (let i = 0; i < l.length; i++) h = Math.imul(h ^ l.charCodeAt(i), 16777619) >>> 0;
  return pool[h % pool.length];
}
/** The card a cut can read: a complete short thought that passes the compliance lexicon. */
const okCard = (l: string) => isCard(l) && complianceHits(l).length === 0;

// ---- the spine's own cards ----
/** "35 g of sugar ≈ 9 sugar cubes.": the surprising number with its everyday anchor (not the guess's number). */
function numberCard(c: SpineIn, b: Budget, guessKey?: string): Cand & { 2?: string } | null {
  // (with alcohol, never its kcal: a video about alcohol says no kcal it is not asked for, video-telemetry "filler card")
  const s = c.story, order = [...s.surprises.filter((x) => x.anchor), ...s.surprises.filter((x) => !x.anchor)].filter((x) => x.numberKey !== guessKey && x.numberKey !== 'sugarPeak' && !(c.alcohol && (x.numberKey === 'kcal' || x.numberKey === 'energyDensity')));
  // (a food with no surprise left, sparkling water: any of its numbers with an everyday anchor or a Daily Value)
  const seen = new Set(order.map((x) => x.numberKey));
  for (const k of ['waterMl', 'sodiumMg', 'proteinG', 'fiberG', 'satFatG', 'sugarG', 'caffeineMg']) if (!seen.has(k) && k !== guessKey && s.numbers[k] && s.numbers[k].value > 0) order.push({ numberKey: k } as typeof order[number]);
  for (const sp of order) {
    const n = s.numbers[sp.numberKey];
    if (!n) continue;
    const what: Record<string, string> = { sugarG: 'of sugar', caffeineMg: 'of caffeine', alcoholG: 'of alcohol', waterMl: 'of water', proteinG: 'of protein', fiberG: 'of fiber', satFatG: 'of saturated fat', sodiumMg: 'of sodium' };
    const tries: Cand[] = [];
    if (n.anchor && what[sp.numberKey]) tries.push([`${n.text} ${what[sp.numberKey]} ${n.anchor}.`, [sp.numberKey]]);
    const dv: Record<string, string> = { proteinG: 'proteinDv', fiberG: 'fiberDv', satFatG: 'satFatDv', sodiumMg: 'sodiumDv' };
    if (dv[sp.numberKey] && s.numbers[dv[sp.numberKey]] && s.numbers[dv[sp.numberKey]].value >= 1 && what[sp.numberKey]) tries.push([`${n.text} ${what[sp.numberKey].replace(/^of /, '')}: ${s.numbers[dv[sp.numberKey]].text} of the Daily Value.`, [sp.numberKey, dv[sp.numberKey]]]);
    if (sp.numberKey === 'kcal' && s.numbers.kcalPct) tries.push([`${n.text}: ${s.numbers.kcalPct.text} of a 2,000 kcal day.`, ['kcal', 'kcalPct']]);
    if (sp.numberKey === 'energyDensity') tries.push([`${Math.round(n.value * 100)} kcal in every 100 g.`, ['energyDensity']]);
    for (const [line, keys] of tries) if (okCard(line) && !b.clash(line) && b.left(keys[0]) >= 1 && keys.every((k) => b.left(k) >= 1)) return [line, keys];
  }
  return null;
}
/** One line with the body's label ("For a 70 kg adult"): what it means for you, with a number of its own. */
function forYouCard(c: SpineIn, b: Budget): Cand | null {
  const s = c.story, N = s.numbers, tries: Cand[] = [];
  if (c.alcohol && N.alcoholGoneMin && N.alcoholGoneMin.value <= 1440) tries.push([`Your liver needs about ${N.alcoholGoneMin.text} for it.`, ['alcoholGoneMin']]);
  if (N.sleepDelayMin && N.sleepDelayMin.value >= 1) tries.push([`Falling asleep may take ${N.sleepDelayMin.text} longer.`, ['sleepDelayMin']]);
  if (N.caffeineAtBedMg && N.caffeineAtBedMg.value >= 1) tries.push([`${N.caffeineAtBedMg.text} of caffeine left at bedtime.`, ['caffeineAtBedMg']]);
  if (N.sugarBackMin && (N.sugarPeak?.value ?? 0) >= 0.5) tries.push([`Your usual level is back after ${N.sugarBackMin.text}.`, ['sugarBackMin']]);
  if (!c.alcohol && N.kcal && N.kcal.value >= 20 && N.kcalPct) tries.push([`${N.kcalPct.text} of a 2,000 kcal day.`, ['kcalPct']]);
  if (N.proteinDv && N.proteinDv.value >= 5) tries.push([`${N.proteinDv.text} of a day's protein, by the label.`, ['proteinDv']]);
  if (N.waterMl && c.bodyWaterL && c.bodyWaterL > 5) { const p = Math.round((1000 * N.waterMl.value) / (c.bodyWaterL * 1000)) / 10; if (p >= 0.1) tries.push([`${N.waterMl.text}: ${p}% of your body's water.`, ['live:bodyWater', ...(Math.abs((N.grams?.value ?? 0) - N.waterMl.value) <= 0.06 * N.waterMl.value ? [] : ['waterMl'])]]); /* (a water that is its serving says the serving) */ }
  if (N.waterMl) tries.push([`Its ${N.waterMl.text} count toward your water.`, ['waterMl']]);
  // (a fact no card has said: never the same number twice in a row of cards)
  // (two foods of a class do not say the same "for you": the food's own seed picks among the ones that fit, the more
  // telling first: the alcohol's and the caffeine's before the day's share)
  // (a number said once may be said here a second time: each number in at most PER_NUMBER_MAX visuals)
  // (a number no card has said yet first: "Your usual level is back after 3.5 h." after "Back to your usual level after
  // 3.5 h." says nothing new)
  const fits = tries.filter(([line, keys]) => okCard(line) && !b.clash(line) && !keys.some((k) => b.numberKeys.has(k)) && keys.every((k) => b.left(k) >= 1)), fresh = fits.filter(([, keys]) => keys.every((k) => !b.uses.get(k)));
  const ok = fresh.length ? fresh : fits.filter(([, keys]) => !keys.includes('kcalPct')); // (never a second card of the day's share)
  const firstTwo = ok.slice(0, Math.min(4, ok.length));
  return firstTwo.length ? firstTwo[((c.seed ?? seedOf(c.name)) >>> 11) % firstTwo.length] : null;
}
/** Numbers that say the guess's answer by a sum ("6% of a 2,000 kcal day" is 120 kcal): kept back until the reveal too. */
const GIVES_AWAY: Record<string, readonly string[]> = { kcal: ['kcalPct', 'energyDensity'], kcalPct: ['kcal'], sugarG: ['sugarCubes'], sugarCubes: ['sugarG'] };
/** What a "for you" line means, said by the voice after its card: no number, nothing beyond the card's own fact. */
function forYouSoWhat(line: string): string | undefined {
  if (/^Your liver needs/.test(line)) return 'Coffee or a shower won’t speed it up.';
  if (/^Falling asleep may take/.test(line)) return 'Sleep may come later.';
  if (/of caffeine left at bedtime\.$/.test(line)) return 'Some of it stays the night.';
  if (/^Your usual level is back/.test(line)) return 'Back where it started.';
  if (/of a 2,000 kcal day\.$/.test(line)) return 'The rest comes from other food.';
  if (/of a day's protein/.test(line)) return 'The rest comes from other meals.';
  if (/of your body's water\.$/.test(line)) return 'Your kidneys keep the balance.';
  if (/count toward your water\.$/.test(line)) return 'It all adds up.';
  return undefined;
}
/** What an action means, said by the voice after its card: no number, no claim beyond the tip's own (owner 2026-11-27:
 *  the walk lowers the sugar rise, never calories or burning). */
function actionSoWhat(line: string): string | undefined {
  if (/^Try half/.test(line)) return 'A smaller portion, the same moment.';
  if (/^Swap for/.test(line)) return 'A smaller rise.';
  if (/before bed\.$/.test(line)) return 'Time for it to fade.';
  if (/^A 10-minute walk/.test(line)) return 'A smaller sugar rise.';
  if (/^Any time/.test(line)) return 'No timing needed.';
  if (/^Never drive/.test(line)) return 'Plan your ride home first.';
  if (/with a meal\.$/.test(line)) return 'Food slows the sugar down.';
  if (/vegetables or whole grains/.test(line)) return 'More fiber, a slower rise.';
  return undefined;
}
/** The same fact in other words, numbers and organs kept: one wording per food, by its seed (0: as written). */
const REPHRASE: [RegExp, string[]][] = [
  [/^Blood alcohol peaks (.+) in\.$/, ['Blood alcohol is highest about $1 in.', 'Its blood alcohol tops out $1 in.', 'Peak blood alcohol: $1 in.', 'Blood alcohol reaches its top $1 in.', 'Its alcohol peaks in your blood $1 in.', 'Blood alcohol hits its high $1 in.', 'The blood alcohol high: $1 in.', 'Highest blood alcohol: $1 in.', '$1 in, blood alcohol is at its highest.']],
  [/^Up to (\d+) ml of urine collects there\.$/, ['Your bladder fills with up to $1 ml.', 'Up to $1 ml of urine builds up there.', 'Up to $1 ml of urine wait there.', 'Your bladder holds up to $1 ml.', 'Up to $1 ml end up in your bladder.', 'Bladder: up to $1 ml.']],
  [/^Try half: (.+)\.$/, ['Half a serving: $1.', 'Have half: $1.', 'Halve it: $1.', 'Half the amount: $1.', 'A half serving means $1.', 'Go for half: $1.', 'Just half: $1.', 'Half as much: $1.', 'Try a smaller one: half is $1.']],
  [/^A 10-minute walk after eating lowers the rise\.$/, ['After eating, a 10-minute walk lowers the rise.', 'A 10-minute walk after it lowers the sugar rise.', 'Walk 10 minutes after eating: a lower rise.', 'A lower rise: walk 10 minutes after eating.', '10 minutes of walking after eating: a lower rise.', 'Tip: a 10-minute walk after eating lowers the rise.']],
  [/^Any time: (?:it has|only) (.+) of caffeine\.$/, ['Any time of day: $1 of caffeine.', 'No bad time for it: $1 of caffeine.', 'Fine at any hour: $1 of caffeine.', 'Any hour works: $1 of caffeine.', 'Morning or night: $1 of caffeine.', 'Day or night: $1 of caffeine.']],
  [/^(\d+)% of a day's (fiber|saturated fat|protein|sodium) (arrives here|is here|still in you|keeps arriving)\.$/, ["Of a day's $2: $1% $3.", "$1% of a day's $2 — $3.", "$3: $1% of a day's $2.", "Of a day's worth of $2, $1% $3."]],
  [/^Its (\d+(?:\.\d+)? g) of saturated fat arrive too\.$/, ['Its $1 of saturated fat come along.', '$1 of saturated fat arrive with it.', 'With it: $1 of saturated fat.', 'Along with it: $1 of saturated fat.', '$1 of saturated fat come too.', 'Also on the way: $1 of saturated fat.']],
  [/^(\d+(?:\.\d+)? mg) sodium: (\d+)% of the Daily Value\.$/, ['$1 of sodium: $2% of the Daily Value.', 'Sodium: $1, $2% of the Daily Value.', '$2% of the Daily Value: $1 of sodium.', '$1 sodium, $2% of a day by the label.', 'Sodium, $1: $2% of the Daily Value.', '$2% of a day of sodium: $1.', 'By the label, $1 of sodium is $2% of a day.', 'Its sodium: $1, $2% of a day.']],
  [/^(\d+(?:\.\d+)? g) protein: (\d+)% of the Daily Value\.$/, ['$1 of protein: $2% of the Daily Value.', 'Protein: $1, $2% of the Daily Value.', '$2% of the Daily Value: $1 of protein.', '$1 protein, $2% of a day by the label.', 'Protein, $1: $2% of the Daily Value.']],
  [/^Its (carbs|fat|protein) gives? (\d+)% of its energy\.$/, ['$2% of its energy comes from $1.', 'By energy, it is $2% $1.', 'Of its energy, $2% is $1.', '$2% of its kcal come from $1.', 'Its energy: $2% from $1.']],
  [/^Its (\d+) kcal slow your stomach down\.$/, ['Its $1 kcal keep your stomach busy.', '$1 kcal: your stomach slows down.', 'With $1 kcal, your stomach takes its time.', '$1 kcal make your stomach go slower.', 'Your stomach slows for its $1 kcal.']],
  [/^Half had left your stomach by (.+)\.$/, ['By $1, half had left your stomach.', 'Half was out of your stomach by $1.', 'Your stomach had passed on half by $1.']],
  [/^(\d+ ml) of water ≈ (.+)\.$/, ['Water: $1 ≈ $2.']],
  [/^Blood sugar dips about (\d+)% below usual\.$/, ['Blood sugar falls about $1% below usual.', 'A dip follows: about $1% below usual.']],
  [/^(\d+) kcal in every 100 g\.$/, ['Every 100 g: $1 kcal.', '$1 kcal per 100 g.', 'In 100 g of it: $1 kcal.']],
  [/^(.+) of sugar ≈ (.+) (sugar cubes?)\.$/, ['$1 of sugar, like $2 $3.', 'Sugar: $1 ≈ $2 $3.', '$1 of sugar: about $2 $3.']],
  [/^(\d+ ml): ([\d.]+)% of your body's water\.$/, ["$1 is $2% of the water in you.", "$1 adds $2% to your body's water."]],
  [/^All (\d+ g) of it are absorbed fast\.$/, ['All $1 are taken up fast.', 'Your gut takes up all $1 fast.', '$1, absorbed fast.', 'Fast: all $1 are taken up.', 'All $1 get absorbed fast.']],
  [/^Your stomach holds (\d+ g) of it now\.$/, ['Right now $1 sit in your stomach.', 'Your stomach has all $1 now.', '$1 in your stomach now.', 'Your stomach: $1 right now.']],
  [/^Your stomach churns (\d+ g) into a paste\.$/, ['$1 get churned into a paste.', 'Your stomach mashes $1 into a paste.', 'Your stomach grinds $1 into a paste.', '$1 turn into a paste in your stomach.', 'A paste: your stomach churns $1.', 'Your stomach makes a paste of $1.']],
  [/^Kidneys filter the (drink|food)’s (\d+ ml) of water\.$/, ['Your kidneys filter its $2 of water.', 'Its $2 of water pass your kidneys.']],
  [/^Its (\d+(?:\.\d+)? g) of (carbs|protein|fat) (?:are|is) taken apart\.$/, ['Its $1 of $2 get taken apart.', '$1 of $2 taken apart here.', 'Here its $1 of $2 are split up.', 'Your gut takes apart its $1 of $2.']],
  [/^(\d+) kcal in one meal\.$/, ['One meal: $1 kcal.', '$1 kcal at one sitting.', 'All at once: $1 kcal.', 'In one go: $1 kcal.']],
  [/^(.+) of (fat|carbs|protein|fiber|sugar) per serving\.$/, ['Each serving: $1 of $2.', '$1 of $2 in one serving.', 'Per serving: $1 of $2.', '$2 per serving: $1.']],
  [/^Half of it leaves after about (.+)\.$/, ['Half is on its way after about $1.', 'About $1 in, half has left.']],
  [/^Half moves on within (.+)\.$/, ['Half is gone on within $1.', 'Within $1, half moves on.', 'Half has left within $1.']],
  [/^Back to your usual level after (.+)\.$/, ['Your usual level again after $1.', 'After $1, back to your usual level.', 'Usual level again after $1.', '$1 later: back to your usual level.', 'Your usual level returns after $1.', 'Your usual level is back $1 in.']],
  [/^(\d+)% of a 2,000 kcal day\.$/, ['$1% of a 2,000 kcal day, in one serving.', 'One serving: $1% of a 2,000 kcal day.', '$1% of a day of 2,000 kcal.', 'Of a 2,000 kcal day: $1%.', 'A 2,000 kcal day: $1% of it here.', 'In a 2,000 kcal day, this is $1%.']],
  [/^Its (\d+(?:\.\d+)? g) of carbs become blood sugar\.$/, ['Its $1 of carbs turn into blood sugar.', '$1 of carbs end up as blood sugar.']],
  [/^It has (\d+ mg) of sodium\.$/, ['Sodium in it: $1.', '$1 of sodium in it.']],
  [/^(.+) of sodium per serving\.$/, ['Sodium per serving: $1.', '$1 of sodium in one serving.', 'Each serving: $1 of sodium.']],
];
function rephrase(l: string, seed: number, ok: (y: string) => boolean = () => true): string {
  for (const [re, alts] of REPHRASE) {
    if (!re.test(l)) continue;
    let h = seed >>> 0; for (let i = 0; i < re.source.length; i++) h = Math.imul(h ^ re.source.charCodeAt(i), 16777619) >>> 0;
    for (let i = 0; i < l.length; i++) h = Math.imul(h ^ l.charCodeAt(i), 16777619) >>> 0; // (and its own numbers)
    // (the food's own wording, else the next one that fits a card)
    const all = [l, ...alts.map((a) => l.replace(re, a)).map((y) => y.charAt(0).toUpperCase() + y.slice(1))], k = h % all.length;
    for (let i = 0; i < all.length; i++) { const y = all[(k + i) % all.length]; if (y === l || ok(y)) return y; }
    return l;
  }
  return l;
}
/** One action from the cheat sheet, as a card ("Try half: 32 mg of caffeine."), with its grade. */
function actionCard(c: SpineIn, b: Budget): { line: string; keys: string[]; grade: Level } | null {
  const ch = c.story.cheat, tries: { line: string; keys: string[]; grade: Level }[] = [];
  const sw = ch.swapFor;
  if (sw) {
    const half = /^Half (?:the amount|a serving): (\d+(?:\.\d+)?) (mg of caffeine|g of alcohol|kcal) instead of/.exec(sw.text);
    // (never half of the guess's number before its reveal: "Try half: 58 kcal." gives 116 kcal away)
    const halfOf = half ? ({ 'mg of caffeine': 'caffeineMg', 'g of alcohol': 'alcoholG', kcal: 'kcal' } as Record<string, string>)[half[2]] : '';
    if (half && !b.reserved.has(halfOf)) tries.push({ line: `Try half: ${half[1]} ${half[2]}.`, keys: ['act:swap'], grade: sw.grade });
    const food = /^([^:]+): blood sugar (?:up about ([\d.]+) instead of ([\d.]+)|barely rises)/.exec(sw.text);
    if (food) {
      const pct = food[2] ? Math.round(100 * (1 - Number(food[2]) / Number(food[3]))) : 90;
      if (pct >= 10) tries.push({ line: `Swap for ${food[1].toLowerCase()}: ${pct}% smaller sugar rise.`, keys: ['act:swap'], grade: sw.grade });
    }
  }
  const bt = ch.bestTime;
  // (never a clock time on a card, video-4b: the hours before bed it says instead)
  if (bt) { const m = /^Before (\d\d):(\d\d), so its caffeine is low by your (\d\d):(\d\d) bedtime/.exec(bt.text); if (m) { const d = ((Number(m[3]) * 60 + Number(m[4]) - Number(m[1]) * 60 - Number(m[2])) % 1440 + 1440) % 1440, h = Math.round(d / 30) / 2; if (h >= 1) tries.push({ line: `Have it at least ${h} h before bed.`, keys: ['act:time'], grade: bt.grade }); } }
  // (owner 2026-11-27: the sourced tip "a 10-minute walk after eating", grade B, as a blood sugar tip only: it lowers
  // the sugar rise; never calories, never burning, never minutes of exercise for kcal)
  if (!c.alcohol && (c.story.numbers.sugarPeak?.value ?? 0) >= 1 && TIPS.sugarSpike) tries.push({ line: 'A 10-minute walk after eating lowers the rise.', keys: [], grade: TIPS.sugarSpike.level });
  if (c.alcohol) tries.push({ line: 'Never drive after drinking.', keys: [], grade: 'A' });
  const pw = ch.pairWith;
  if (pw && /with a meal/i.test(pw.text) && !c.alcohol) tries.push({ line: 'Have sugary drinks with a meal.', keys: [], grade: pw.grade });
  if (pw && /vegetables or whole grains/.test(pw.text)) tries.push({ line: 'Add vegetables or whole grains to it.', keys: [], grade: pw.grade });
  // (any time of day: with its own caffeine, so the action still says a number of this food)
  const caf = Math.round(c.caffeineMg);
  // (the caffeine as its card says it: "about 1 mg" for a decaf, never "0 mg" beside it)
  const cafN = c.story.numbers.caffeineMg;
  if (bt && /^Any time/.test(bt.text)) tries.push({ line: cafN && cafN.value > 0 ? `Any time: only ${cafN.text} of caffeine.` : caf >= 1 ? `Any time: only ${caf} mg of caffeine.` : c.caffeineMg >= 0.3 ? 'Any time: only about 1 mg of caffeine.' : 'Any time: it has 0 mg of caffeine.', keys: [cafN && cafN.value > 0 || caf >= 1 ? 'caffeineMg' : 'act:time'], grade: bt.grade }, { line: 'Any time of day suits it.', keys: [], grade: bt.grade });
  // (one with a number of its own first; between two such, the food's own seed: same-class videos part)
  const ok = tries.filter((x) => okCard(x.line) && x.keys.every((k) => b.left(k) >= 1)), withNum = ok.filter((x) => /\d/.test(x.line));
  // (a longer cut may say an action without a number: its cards have numbers enough; a Short's must count every second)
  // (one with a number when there is one: a card without one is generic text, video-telemetry checkTimeline5)
  const pool = c.alcohol ? (withNum.length ? withNum : ok).slice(0, 1) : withNum.length >= 2 ? withNum.slice(0, 2) : (withNum.length ? withNum : ok).slice(0, 1);
  return pool.length ? pool[((c.seed ?? seedOf(c.name)) >>> 13) % pool.length] : null;
}
/** The end frame's three cheat lines, short ("Best time · Before 15:30, so its caffeine is low by your 23:00 bedtime."):
 *  never a mmol/L (the video says blood sugar against your usual level), never "instead of" a number said elsewhere. */
function cheatLines(c: SpineIn): SpineEnd['cheat'] {
  const ch = c.story.cheat, out: SpineEnd['cheat'] = [];
  const clean = (s: string) => s.replace(/\s*\((?:about [^)]*mmol\/L[^)]*|[^)]*mg\/dL[^)]*)\)/g, '').replace(/: blood sugar up about [\d.]+ instead of [\d.]+ (?:mmol\/L|mg\/dL)\./, ': a smaller blood sugar rise.').replace(/ instead of \d+(?:\.\d+)? ?(?:mg|g|kcal)?\.$/, '.');
  if (ch.bestTime) out.push({ label: 'Best time', text: clean(ch.bestTime.text), keys: [] });
  if (ch.pairWith) out.push({ label: 'Pair with', text: clean(ch.pairWith.text), keys: [] });
  if (ch.swapFor) out.push({ label: 'Swap for', text: clean(ch.swapFor.text), keys: [] });
  return out;
}

/** The spine of a single video: its hook and guess, the end frame, and the budget the cards are rewritten with. */
export function spineOf(c: SpineIn): Spine {
  const s = c.story, nums = teleNumsOf(s.numbers), seed = c.seed ?? seedOf(c.name);
  const { hook, guess } = guessOf({ ...c, seed });
  const fixed: Record<string, number> = {};
  const add = (keys: readonly string[]) => { for (const k of keys) fixed[k] = (fixed[k] ?? 0) + 1; };
  // the headline (one visual all through) and each end card line (one visual each)
  add(numbersShown([hook.line1, hook.line2].join(' '), nums)); // (the question's own number too: "40 mg of caffeine: what is left at bedtime?")
  for (const l of c.endLines) add(numbersShown(l, nums));
  const cheat = cheatLines(c);
  for (const ch of cheat) { ch.keys = numbersShown(ch.text, nums); add(ch.keys); }
  const axes = AXIS_KEYS.map((k) => ({ key: k, label: RUBRIC[k].label, word: s.axes[k].word.replace(/\bsat fat\b/g, 'saturated fat'), tier: s.axes[k].tier }));
  const end: SpineEnd = { axes, cheat, sources: sourcesLine(c.name, s.slug), body: s.body.label };
  return { v: 5, hook, guess, lines: {}, end, nums, body: s.body.label, fixed, chips: [], pins: [], gut: gutCurve(c.built) };
}
/** The gut's contents over the day (stomach, duodenum and small intestine, the route model), on the video's day axis. */
function gutCurve(b: SpineIn['built']): Spine['gut'] {
  const r = b.route;
  if (!r) return undefined;
  const at = (m: number) => { const sg = r.segs(Math.max(0, Math.min(1440, m))); return (['stomach', 'duodenum', 'small'] as const).reduce((a, k) => a + Math.max(0, sg[k]?.amount ?? 0), 0); };
  const curve = Array.from({ length: 64 }, (_, i) => at(minutesFromU(i / 63)));
  if (!(Math.max(...curve) >= 5)) return undefined;
  return { label: 'Still in your gut', unit: r.unit, curve };
}

/** The moments as the v5 video says them: a moment's generic cards become numbered ones (the same moment, the item's
 *  own number, within the budget), quiet ones are left out where the moment has another card, the guess's number is
 *  never said before its reveal, and the spine's own moments come in: the surprising number, what it means for you
 *  (not in a Short: its 30 s go to the story) and one action, each kept in every cut it is in. */
export function spineStops(stops: StopIn[], sp: Spine, c: SpineIn): StopIn[] {
  // (the guess's number, and the numbers that give it away by a sum: the day's share of its kcal, its sugar in cubes)
  const s = c.story, reserved = new Set<string>(sp.guess ? [sp.guess.key, ...(GIVES_AWAY[sp.guess.key] ?? [])] : []);
  const gn = sp.guess && !sp.nums.some((n) => n.key === sp.guess!.key) ? guessNumber(c, sp.guess.key) : undefined;
  const b = new Budget(gn ? [{ key: gn.key, value: gn.value, unit: gn.unit, ...(gn.range ? { range: gn.range } : {}) }, ...sp.nums] : sp.nums, reserved);
  for (const [k, n] of Object.entries(sp.fixed)) b.uses.set(k, Math.max(n, b.uses.get(k) ?? 0));
  const lines: Spine['lines'] = {};
  const safety = (l: string) => SAFETY.test(l);
  // 1) the stops' own cards, in time order: numbered where generic, within the budget
  const out = stops.map((st) => ({ ...st, lines: [...(st.lines ?? [])] }));
  // (the numbers the story's own cards say, wherever they are: a numbered card says another one first)
  const said = new Set(out.flatMap((o) => o.lines.filter((l) => !genericCard(l)).flatMap((l) => b.keysOf(l))));
  const heads = [sp.hook.line1, sp.hook.line2].filter(Boolean);
  // (a story whose own card says the range of bodies, "The alcohol is gone after about 1–4 hours.", hears no single
  // time of this body beside it: one time reference, video-narration lint "inconsistent time reference")
  // (one number per nutrient in one video: a card never says "4.7 g of carbs" where another says "5 g of carbs")
  const NUT = /(\d+(?:\.\d+)?) ?(g|mg) of (?:natural (?:fruit |milk )?)?(carbs|fat|protein|sugar|fiber|sodium|caffeine|saturated fat|alcohol)\b/g;
  const nutsOf = (l: string) => Array.from(l.matchAll(NUT)).map((m) => [m[3], m[1]] as const);
  const shownNuts = () => { const m = new Map<string, Set<string>>(); for (const l of [...heads, ...out.flatMap((o) => o.lines)]) for (const [k, v] of nutsOf(l)) { if (!m.has(k)) m.set(k, new Set()); m.get(k)!.add(v); } return m; };
  b.clash = (l: string) => { const m = shownNuts(); return nutsOf(l).some(([k, v]) => !!m.get(k) && !m.get(k)!.has(v)); };
  const rangeGone = out.some((o) => o.lines.some((l2) => /gone after about \d+(?:\.\d+)?[–-]/.test(l2)));
  for (const st of out) {
    const x: RuleCtx = { s, N: s.numbers, c, min: st.min };
    const must = st.must ?? 0, keep: string[] = [], gen: string[] = [];
    st.lines.forEach((l, i) => {
      const isMust = i < must || safety(l);
      if (genericCard(l) && !isMust) {
        const rule = NUMBERED.find(([re]) => re.test(l.trim()));
        // (a numbered card no longer than the card it replaces first, so a moment's reading time, and a stay on one region
        // of the body, does not grow: the planner's caps were met with the old cards)
        // (one "peaks" card per story: two read as the same card, "Blood fat peaks about 3.5 h in." and "Caffeine peaks 3 h in.")
        const peaks = (y: string) => /^Blood fat peaks/.test(y) && out.some((o) => o.lines.some((l2) => l2 !== l && /\bpeaks (?:about )?\d/i.test(l2)));
        const fits = rule ? rule[1](x).filter((y): y is Cand => !!y).filter(([line, keys]) => okCard(line) && !peaks(line) && sugarOk(x, line) && !b.clash(line) && !(keys.includes('alcoholGoneMin') && rangeGone) && !keep.includes(line) && !out.some((o) => o !== st && o.lines.includes(line)) && keys.every((k) => b.left(k) >= 1)) : [];
        // (a number no card has said yet first: "Half moves on within 15 min." right after "Half leaves your stomach
        // within 15 minutes." says nothing new)
        const fresh = fits.filter(([, keys]) => keys.every((k) => k === 'grams' || (!b.uses.get(k) && !said.has(k)))), cand = rule ? pickCand(fresh.length ? fresh : fits, l, c) : undefined;
        if (cand) { b.take(cand[1]); keep.push(cand[0]); lines[cand[0]] = { kind: 'ladder', keys: cand[1], grade: gradeOf(s, cand[1]), own: true }; return; }
        // (a generic card that found no number of its own is left out when the moment has another card; a moment with
        // nothing else keeps it: the planner then decides whether it is shown)
        gen.push(l); return;
      }
      // a card that says a number: within the budget, and never the guess's number before the reveal (a card that must
      // be said, a safety card aside, loses its part over the budget: "36 g protein, 211 kcal." → "211 kcal.")
      const keys = b.keysOf(l);
      // (no "fruit sugar" card for a food whose sugar is all added, a cola's: round 17 critic G-9)
      if (!isMust && /fruit sugar/i.test(l) && (s.numbers.sugarG?.value ?? 0) > 0 && (s.numbers.freeSugarG?.value ?? 0) >= 0.9 * s.numbers.sugarG.value) return;
      // (never a card that says the headline again, "14 g natural sugar." under "Melon: 14 g of natural fruit sugar.")
      if (!safety(l) && heads.some((h) => nearSame(l, h))) {
        if (!isMust) return;
        const fb = fallbackCard(x, `${st.title} ${l}`, (k) => b.left(k), (l2) => !!lines[l2] || b.clash(l2)) ?? fallbackCard(x, 'stomach intestine fiber kidney', (k) => b.left(k), (l2) => !!lines[l2] || b.clash(l2));
        if (fb) { b.take(fb[1]); keep.push(fb[0]); lines[fb[0]] = { kind: 'ladder', keys: fb[1], grade: gradeOf(s, fb[1]), own: true }; }
        return;
      }
      // (a card that must be said but says the guess's number: another of the food's numbers in its place, or none)
      if (isMust && !safety(l) && !l.includes(', ') && keys.some((k) => reserved.has(k))) {
        const fb = fallbackCard(x, `${st.title} ${l}`, (k) => b.left(k), (l2) => !!lines[l2] || b.clash(l2)) ?? fallbackCard(x, 'stomach intestine fiber kidney', (k) => b.left(k), (l2) => !!lines[l2] || b.clash(l2));
        if (fb) { b.take(fb[1]); keep.push(fb[0]); lines[fb[0]] = { kind: 'ladder', keys: fb[1], grade: gradeOf(s, fb[1]), own: true }; }
        return;
      }
      if (keys.some((k) => reserved.has(k) || b.left(k) < 1) && !safety(l) && (!isMust || l.includes(', '))) {
        // (a joined card keeps its other part: "584 kcal, 61 g carbs." → "61 g carbs.")
        const parts = l.replace(/[.!?]$/, '').split(', '), rest = parts.filter((p) => !b.keysOf(p).some((k) => reserved.has(k) || b.left(k) < 1));
        const alt = rest.length && rest.length < parts.length ? `${rest.join(', ').replace(/^\w/, (ch) => ch.toUpperCase())}.` : '';
        if (alt && okCard(alt) && /\d/.test(alt) && !heads.some((h) => nearSame(alt, h))) { b.take(b.keysOf(alt)); keep.push(alt); lines[alt] = { kind: 'ladder', keys: b.keysOf(alt), grade: gradeOf(s, b.keysOf(alt)) }; return; }
        if (!isMust) return;
        // (a card that must be said never keeps the guess's number either: another of the food's numbers, or none)
        if (keys.some((k) => reserved.has(k))) {
          const fb = fallbackCard(x, `${st.title} ${l}`, (k) => b.left(k), (l2) => !!lines[l2] || b.clash(l2)) ?? fallbackCard(x, 'stomach intestine fiber kidney', (k) => b.left(k), (l2) => !!lines[l2] || b.clash(l2));
          if (fb) { b.take(fb[1]); keep.push(fb[0]); lines[fb[0]] = { kind: 'ladder', keys: fb[1], grade: gradeOf(s, fb[1]), own: true }; }
          return;
        }
      }
      // (a card of the model's own story with its number, "Half moves on within 15 minutes.", is this food's too)
      const own = !keys.length && MODEL_LINE.test(l) ? [`ch:${l.replace(/[^\d.]+/g, '-')}`] : keys;
      b.count(own); keep.push(l);
      if (own.length) lines[l] = { kind: 'ladder', keys: own, grade: gradeOf(s, keys) ?? 'B' };
    });
    // (a moment left with no card keeps its first generic one, never a quiet one or one about the guess's number)
    const spoil = (l: string) => b.keysOf(l).some((k) => reserved.has(k)) || (!!sp.guess && SPOILS[sp.guess.key]?.test(l));
    const g0 = gen.filter((l) => !QUIET.test(l.trim()) && !spoil(l))[0], fb = !keep.length && g0 ? fallbackCard(x, g0, (k) => b.left(k), (l2) => !!lines[l2] || b.clash(l2)) : null;
    if (fb) { b.take(fb[1]); lines[fb[0]] = { kind: 'ladder', keys: fb[1], grade: gradeOf(s, fb[1]), own: true }; }
    st.lines = keep.length ? keep : fb ? [fb[0]] : g0 ? [g0] : [];
    // (the first moment never left with no card: the planner would read its text again, the very words just left out)
    if (!st.lines.length && st.min === 0) { const k0 = ['kcal', 'grams'].find((k) => (s.numbers[k]?.value ?? 0) > 0 && b.left(k) >= 1); if (k0) { const l0 = k0 === 'kcal' ? `${s.numbers.kcal.text} in total.` : `${s.numbers.grams.text} in one serving.`; b.take([k0]); st.lines = [l0]; lines[l0] = { kind: 'ladder', keys: [k0], grade: gradeOf(s, [k0]), own: true }; } }
    if (st.must) st.must = Math.min(st.must, st.lines.length) || undefined;
  }
  // (never two cards of one moment with the same numbers: "Each serving: 36 g of carbs." and "36 g carbs.")
  for (const st of out) { const ls = st.lines.filter((l, i) => { const a = b.keysOf(l).filter((k) => k !== 'grams'); return !(a.length && st.lines.slice(0, i).some((p) => { const q = b.keysOf(p); return a.every((k) => q.includes(k)); })); }); if (ls.length < st.lines.length) { st.lines = ls; if (st.must) st.must = Math.min(st.must, ls.length) || undefined; } }
  let res = out.filter((st) => st.lines.length || st.min === 0);
  // 2) the spine's own moments: the number (near the peak, else the middle of the day), for you, one action (late)
  const at = (m: number) => { const taken = new Set(res.map((x) => Math.round(x.min * 10))); let k = Math.round(m * 10); while (taken.has(k)) k++; return k / 10; };
  const mins = res.map((x) => x.min).filter((m) => m > 0 && m < 1440);
  const mid = mins.length ? mins[Math.floor(mins.length / 2)] : 60;
  // (the spine's moments sit in the second half of the day's moments, each after the moment at its share of them, so
  // the story's own first half, from the first bite to its peak, runs as the planner laid it out)
  // (where in that half: the food's own seed, so two foods of a class are not filmed alike, video-camera "sameness")
  const sd = ((c.seed ?? seedOf(c.name)) >>> 7) % 1000 / 1000, q1 = 0.4 + 0.25 * sd, q2 = Math.min(0.92, q1 + 0.2 + 0.1 * (1 - sd));
  const after = (q: number) => { const m = mins.length ? mins[Math.min(mins.length - 1, Math.floor(q * mins.length))] : 60; const nx = mins.find((x) => x > m) ?? Math.min(1439, m + 60); return Math.min(1439, m + Math.max(0.5, Math.min(20, (nx - m) / 3))); };
  const nc = numberCard(c, b, sp.guess?.key);
  if (nc) {
    b.take(nc[1]); for (const k of nc[1]) b.numberKeys.add(k); const n = s.numbers[nc[1][0]];
    lines[nc[0]] = { kind: 'number', keys: nc[1], grade: n?.grade, big: n?.text, anchor: n?.anchor, own: true };
    // (a Short keeps its 30 s for its story and the action: there the number is the first moment's last card, said
    // where the planner has room, never a moment of its own that would lengthen a stay on one region)
    if (c.cut === 'short' && res[0]) res[0] = { ...res[0], lines: [...(res[0].lines ?? []), nc[0]] };
    else res.push({ min: at(after(q1)), title: NUMBER_TITLE, text: nc[0], lines: [nc[0]], keep: true, must: 1, kind: 'number' });
  }
  if (c.cut !== 'short') {
    const fy = forYouCard(c, b);
    if (fy) { b.take(fy[1]); lines[fy[0]] = { kind: 'forYou', keys: fy[1], grade: gradeOf(s, fy[1]), own: true, ...(forYouSoWhat(fy[0]) ? { soWhat: forYouSoWhat(fy[0]) } : {}) }; res.push({ min: at(after(q2)), title: `For ${s.body.label}`, text: fy[0], lines: [fy[0]], keep: true, must: 1, kind: 'forYou' }); }
  }
  const ac = actionCard(c, b);
  if (ac) {
    b.take(ac.keys); lines[ac.line] = { kind: 'action', keys: ac.keys, grade: ac.grade, own: true, ...(actionSoWhat(ac.line) ? { soWhat: actionSoWhat(ac.line) } : {}) };
    const last = mins.filter((m) => m <= 1200), m = last.length ? last[last.length - 1] : mid;
    res.push({ min: at(Math.min(1390, m + Math.max(5, (1440 - m) * 0.25))), title: ACTION_TITLE, text: ac.line, lines: [ac.line], keep: true, must: 1, kind: 'action' });
  }
  res = res.sort((p, q) => p.min - q.min);
  // (the voice's "so what" for a card: the story's ladder rung whose number the card says)
  const RUNG: Record<string, string> = { sugarPeakMin: 'sugarPeak', sugarBackMin: 'sugarPeak', bacPeakMin: 'bacPeak', caffeinePeakMin: 'caffeineMg', kcalPct: 'kcal', proteinDv: 'proteinG', fiberDv: 'fiberG', sodiumDv: 'sodiumMg', satFatDv: 'satFatG', 'live:bodyWater': 'waterMl' };
  for (const li of Object.values(lines)) if (!li.soWhat) { const r = s.ladders.find((x) => li.keys.some((k) => x.effectKey === k || x.effectKey === RUNG[k])); if (r && !/\d/.test(r.soWhat)) li.soWhat = r.soWhat; }
  // (two foods of a class word their own cards differently: the food's own seed picks one of the same fact's wordings,
  // its numbers and organs kept; video-segments.test "segment texts")
  const seed0 = (c.seed ?? seedOf(c.name)) >>> 0;
  for (const st of res) st.lines = (st.lines ?? []).map((l) => {
    const li = lines[l];
    if (!li?.own) return l;
    const y = rephrase(l, seed0, (z) => okCard(z) && !lines[z] && z.length <= l.length + 2); // (its numbers are the card's own: no new clash; never longer to read, the planner's stays were met with it)
    if (y === l) return l;
    lines[y] = li; delete lines[l];
    if (st.text === l) st.text = y;
    return y;
  });
  sp.lines = lines;
  sp.pins = pinsOf(c, b);
  sp.chips = chipsOf(c, b);
  return res;
}
/** The story's moments as pins on the live curve (roadmap R: event pins): the sugar peak and its way back, the caffeine
 *  peak and its half, the blood fat peak, each with its own number, within the budget (never the guess's number). */
function pinsOf(c: SpineIn, b: Budget): Spine['pins'] {
  const N = c.story.numbers, out: Spine['pins'] = [];
  const add = (curve: PinCurve, min: number | undefined, label: string, keys: string[]) => {
    if (min === undefined || !(min > 0 && min < 1440) || !keys.every((k) => b.left(k) >= 1)) return;
    b.take(keys); out.push({ curve, u: uFromMinutes(min), label, keys });
  };
  if (N.sugarPeakMin && (N.sugarPeak?.value ?? 0) >= 0.5) add('glucose', N.sugarPeakMin.value, `peak · ${N.sugarPeakMin.text}`, ['sugarPeakMin']);
  if (N.sugarBackMin && (N.sugarPeak?.value ?? 0) >= 0.5) add('glucose', N.sugarBackMin.value, `usual · ${N.sugarBackMin.text}`, ['sugarBackMin']);
  if (N.caffeinePeakMin && (N.caffeineMg?.value ?? 0) >= 1) add('caffeine', N.caffeinePeakMin.value, `peak · ${N.caffeinePeakMin.text}`, ['caffeinePeakMin']);
  const half = c.story.events.find((e) => e.key === 'halfCaffeine');
  if (half && (N.caffeineMg?.value ?? 0) >= 1) add('caffeine', half.min, `half gone · ${half.min < 120 ? `${Math.round(half.min / 5) * 5} min` : `${Math.round(half.min / 30) / 2} h`}`, ['live:cafHalf']);
  if (N.bacPeakMin) add('bac', N.bacPeakMin.value, `peak · ${N.bacPeakMin.text}`, ['bacPeakMin']);
  if (N.tgPeakH) add('tg', N.tgPeakH.value * 60, `peak · ${N.tgPeakH.text}`, ['tgPeakH']);
  if (N.stomachHalfMin) add('gut', N.stomachHalfMin.value, `half out of your stomach · ${N.stomachHalfMin.text}`, ['stomachHalfMin']);
  // (the gut curve's own moments: half of it gone on, and nearly all, from the route model)
  const gut = gutCurve(c.built);
  if (gut) {
    const mx = Math.max(...gut.curve), at = (f: number) => { const k = gut.curve.findIndex((v, i) => i > gut.curve.indexOf(mx) && v <= f * mx); return k > 0 ? minutesFromU(k / 63) : undefined; };
    const say = (m: number) => (m < 120 ? `${Math.max(5, Math.round(m / 5) * 5)} min` : `${Math.round(m / 30) / 2} h`);
    const h = at(0.5), n = at(0.1);
    if (h !== undefined && !N.stomachHalfMin) add('gut', h, `half gone on · ${say(h)}`, ['live:gutHalf']);
    if (n !== undefined && (h === undefined || n - h > 30)) add('gut', n, `nearly all gone on · ${say(n)}`, ['live:gut90']);
  }
  return out;
}
/** Phase P2, the comparison: one side of it. Its generic cards become numbered ones within its own budget (each number
 *  in at most PER_NUMBER_MAX visuals: the servings and the answer are said once, the end card's lines once), the
 *  same way a single video's are; and its own numbers for the lulls. */
export class CmpSide {
  private b: Budget; private memo = new Map<string, string>(); readonly lines: Record<string, string[]> = {};
  constructor(readonly c: SpineIn, endLines: string[], reserved: string[] = []) {
    this.b = new Budget(teleNumsOf(c.story.numbers), new Set(reserved));
    for (const l of endLines) this.b.count(this.b.keysOf(l));
  }
  /** a side's card as the comparison says it (numbered where generic, within the budget) */
  card(l: string, min: number): string {
    const k = `${Math.round(min)}|${l}`, hit = this.memo.get(k);
    if (hit !== undefined) return hit;
    let out = l;
    // (a quiet card, one that tells nothing a number would, leaves the side quiet at that moment)
    if (QUIET.test(l.trim())) { this.memo.set(k, ''); return ''; }
    if (genericCard(l) && !SAFETY.test(l)) {
      const rule = NUMBERED.find(([re]) => re.test(l.trim())), x: RuleCtx = { s: this.c.story, N: this.c.story.numbers, c: this.c, min };
      // (never a number a gauge beside it shows otherwise: the caffeine left at bedtime, the urine's peak, video-beats numberConflict)
      const cand = rule ? pickCand(rule[1](x).filter((y): y is Cand => !!y).filter(([line, keys]) => okCard(line) && sugarOk(x, line) && !this.lines[line] && !keys.some((kk) => kk === 'caffeineAtBedMg' || kk === 'live:urinePeak' || kk === 'alcoholGoneMin') && keys.every((kk) => this.b.left(kk) >= 1)), l, this.c) : undefined;
      const fb = cand ? null : fallbackCard(x, l, (kk) => this.b.left(kk), (y) => !!this.lines[y]); // (never one this side said)
      const got = cand ?? fb;
      if (got) { this.b.take(got[1]); out = got[0]; this.lines[out] = got[1]; }
      // (a generic card no number of this side can replace leaves the side quiet: the other side's card, or the body,
      // says something; what the alcohol does to you is kept)
      else if (!/attention|reaction|impair|driv|sober|speed it up/i.test(l)) out = '';
    } else {
      const keys = this.b.keysOf(l);
      if (keys.length) { this.b.count(keys); this.lines[l] = keys; }
    }
    this.memo.set(k, out);
    return out;
  }
  chips(): Spine['chips'] { return chipsOf(this.c, this.b); }
  /** one action from this side's cheat sheet (as a single video's), within its budget */
  action(): { line: string; keys: string[]; grade: Level } | null { const a = actionCard(this.c, this.b); if (a) this.b.take(a.keys); return a; }
}
/** Facts for a lull (the wordless whole-body stretch that breaks a long stay on one region, video-plan withSpine): in
 *  place of the v4 "TAKEN UP SO FAR / 28 of 584 kcal" counter, one of the item's own numbers a card has not said,
 *  each on one lull only. */
function chipsOf(c: SpineIn, b: Budget): Spine['chips'] {
  const N = c.story.numbers, out: Spine['chips'] = [];
  // (never a chip whose number the headline says: "13 g" under "250 ml of skim milk: 13 g of natural milk sugar.")
  const head = `${c.hook.line1} ${c.hook.line2}`;
  const add = (title: string, text: string | undefined, keys: string[]) => { if (text && !b.clash(text) && keys.every((k) => N[k] && (N[k].value > 0 || k === 'kcal') && b.left(k) >= SPINE.PER_NUMBER_MAX) && !keys.some((k) => ` ${head.replace(/[:(]/g, ' ')} `.includes(` ${N[k].text} `))) { b.take(keys); out.push({ title, text, keys }); } };
  // (its noun said, and at least 2 % of a day: "0.1 g · 1% of the Daily Value" twice is two cards alike and says little)
  const dv = (k: string, d: string, label: string) => add(label, N[k] && N[d] && N[d].value >= 2 ? `${N[k].text} ${label.toLowerCase()} · ${N[d].text} of the Daily Value` : undefined, [k, d]);
  dv('sodiumMg', 'sodiumDv', 'Sodium'); dv('satFatG', 'satFatDv', 'Saturated fat'); dv('fiberG', 'fiberDv', 'Fiber'); dv('proteinG', 'proteinDv', 'Protein');
  if ((N.sugarG?.value ?? 0) >= 0.5) add('Sugar', N.sugarCubes ? `${N.sugarG.text} of sugar · ≈ ${N.sugarCubes.text}` : `${N.sugarG.text} of sugar`, N.sugarCubes ? ['sugarG', 'sugarCubes'] : ['sugarG']);
  if (!c.alcohol && (N.kcal?.value ?? 0) >= 1) add('Energy', N.kcalPct ? `${N.kcal.text} · ${N.kcalPct.text} of a 2,000 kcal day` : N.kcal.text, N.kcalPct ? ['kcal', 'kcalPct'] : ['kcal']);
  if ((N.carbsG?.value ?? 0) >= 0.5) add('Carbs', `${N.carbsG.text} of carbs`, ['carbsG']);
  if ((N.fatG?.value ?? 0) >= 0.5) add('Fat', `${N.fatG.text} of fat`, ['fatG']);
  if ((N.proteinG?.value ?? 0) >= 0.5 && !out.some((x) => x.keys.includes('proteinG'))) add('Protein', `${N.proteinG.text} of protein`, ['proteinG']);
  if ((N.sodiumMg?.value ?? 0) >= 1 && !out.some((x) => x.keys.includes('sodiumMg'))) add('Sodium', `${N.sodiumMg.text} of sodium`, ['sodiumMg']);
  if (N.energyDensity && !c.alcohol) add('Per 100 g', `${Math.round(N.energyDensity.value * 100)} kcal`, ['energyDensity']);
  if (N.waterMl) add('Water', `${N.waterMl.text} of water`, ['waterMl']);
  if (N.caffeineMg && N.caffeineMg.value >= 10) add('Caffeine', `${N.caffeineMg.text} of caffeine`, ['caffeineMg']);
  if (N.alcoholG) add('Alcohol', N.stdDrinks && N.stdDrinks.value >= 0.5 ? `${N.alcoholG.text} · ${N.stdDrinks.text}` : N.alcoholG.text, N.stdDrinks && N.stdDrinks.value >= 0.5 ? ['alcoholG', 'stdDrinks'] : ['alcoholG']);
  if (N.stomachHalfMin) add('Half out of your stomach', `after about ${N.stomachHalfMin.text}`, ['stomachHalfMin']);
  if (N.tgPeakH) add('Blood fat peak', `about ${N.tgPeakH.text} in`, ['tgPeakH']);
  return out.filter((x) => !complianceHits(`${x.title} ${x.text}`).length);
}
/** The kickers of the spine's own moments. */
export const NUMBER_TITLE = 'The number', ACTION_TITLE = 'Try this';
const gradeOf = (s: FoodStory, keys: readonly string[]): Level | undefined => {
  const gs = keys.map((k) => s.numbers[k]?.grade).filter((g): g is Level => !!g);
  return gs.length ? (gs.includes('C') ? 'C' : gs.includes('B') ? 'B' : gs[0]) : undefined;
};
