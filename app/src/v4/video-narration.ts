// 2026-11-05 (owner: "the videos feel sonically monotonous"): the voiceover script. A few short, plain spoken lines
// that COMPLEMENT the on-screen cards (they never read them out), placed on the video's own cue list (the same
// timeline as picture and sound, video-plan.ts): the hook, the mid-video tease, the climax, the 24 h beat, the end
// card's one number and a loop line that hands over to frame 0.
// Rules (tested in video-narration.test.ts over every database item and the audit comparisons; linted in text-audit):
// - nothing is said in the first HOOK_QUIET_S (the hook frame has enough going on);
// - a line fits its slot at WPS words per second, and never runs over the riser → impact (the hush and the drop);
// - every number said is a number on screen at that moment (the end card's hero, one source: video-story heroOf);
// - American English; alcohol is never framed as good, fun or a reward.
// Pure: no audio here (voice-tts.ts speaks it, video-audio.ts mixes it).
import type { Cue, Plan } from './video-plan';

/** Speaking rate the slots are planned with (words per second; Kokoro af_heart at speed 1 says ~2.6-2.9). */
export const WPS = 2.6;
/** No voice during the first half second (the cold open and the hook card land first). */
export const HOOK_QUIET_S = 0.5;
/** Silence kept before an impact (the riser falls away, the hush, the drop) and after it. */
export const IMPACT_PRE_S = 1.7, IMPACT_POST_S = 0.35;
/** The last bit of the video is the loop fade. */
export const TAIL_S = 0.3;
export const GAP_S = 0.25;

export type NarrId = 'hook' | 'tease' | 'climax' | 'day' | 'answer' | 'loop';
export interface NarrLine {
  id: NarrId;
  /** start (s) */ t: number;
  /** the most time it may take (s) */ slotS: number;
  /** the line as written (numbers as on screen) */ text: string;
  /** the same line for the speech engine (units in words, "30–50" as "30 to 50"); the same numbers */ say: string;
  /** the on-screen text this line's numbers come from (empty when it has none) */ source: string;
}
export interface NarrIn {
  plan: Pick<Plan, 'seconds' | 'cues' | 'introS' | 'outroS'>;
  kind: 'single' | 'compare';
  seed: number;
  alcohol?: boolean; caffeine?: boolean; solid?: boolean;
  /** single: the end card's hero number (video-story heroOf) */ hero?: { big: string; small: string };
  /** compare: the guess game is on (a question with an answer banner at the 'peak' cue) */ guess?: boolean;
}

/** Words as spoken: a number counts as the words it is said with ("22" two, "0.04" four), hyphens split words. */
const numWords = (n: number): number => (n <= 20 ? 1 : n < 100 ? (n % 10 ? 2 : 1) : n < 1000 ? 2 + (n % 100 ? numWords(n % 100) : 0) : numWords(Math.floor(n / 1000)) + 1 + (n % 1000 ? numWords(n % 1000) : 0));
export const wordsOf = (s: string) => s.replace(/(\d+)(?:\.(\d+))?/g, (_m, a: string, b?: string) => Array(numWords(Number(a)) + (b ? 1 + b.length : 0)).fill('w').join(' '))
  .trim().split(/[\s-]+/).filter((w) => /\w/.test(w)).length;
/** Seconds a line takes at WPS (counted on its spoken form: units in words). */
export const speakS = (s: string) => wordsOf(speakable(s)) / WPS;
/** Numbers in a text ("+30–50 %" → 30, 50; "0.04" stays "0.04"). */
export const numbersOf = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(',', '.'));

/** The words a speech engine needs: units spelled out, ranges with "to". Keeps every number as it is. */
export function speakable(s: string): string {
  return s
    .replace(/(\d)\s*[–-]\s*(\d)/g, '$1 to $2')
    .replace(/\+(?=\d)/g, '')
    .replace(/(\d)\s*%/g, '$1 percent')
    .replace(/(\d)\s*mg\b/g, '$1 milligrams')
    .replace(/(\d)\s*kcal\b/g, '$1 calories')
    .replace(/(\d)\s*ml\b/g, '$1 milliliters')
    .replace(/(\d)\s*g\b/g, '$1 grams')
    .replace(/(\d)\s*h\b/g, '$1 hours')
    .replace(/(\d)\s*min\b/g, '$1 minutes')
    .replace(/\s{2,}/g, ' ').trim();
}

const pick = <T,>(xs: readonly T[], seed: number, salt: number) => xs[Math.abs((seed >>> 0) + salt * 7919) % xs.length];

/** The end card's number as one spoken line, longest first (the planner keeps the first that fits its slot); the
 *  numbers are exactly the hero's. Unknown shapes: none (the line falls back to a number-free one). */
export function heroLines(hero: { big: string; small: string } | undefined, alcohol = false): string[] {
  if (!hero) return [];
  const { big, small } = hero, all = `${big} ${small}`;
  let m: RegExpExecArray | null;
  if (/^Blood sugar up/.test(big) && (m = /\+?(\d+)–(\d+) %/.exec(small))) return [`At its peak, blood sugar was up ${m[1]}–${m[2]} %.`, `Blood sugar: up ${m[1]}–${m[2]} %.`, `Sugar: up ${m[1]}–${m[2]} %.`];
  if (/^Blood fat up · \d+ h/.test(big)) return [`The fat was the slowest part.`];
  if ((m = /^(\d+) mg caffeine/.exec(big)) && /still in your body/.test(small)) return [`${m[1]} mg of caffeine, still in your body.`, `${m[1]} mg, still in you.`];
  // alcohol: the BAC range is too long to say well ("zero point zero one one to …"): the safety line instead
  if (/BAC/.test(small) || alcohol) return ['Remember: never drink and drive.', 'Never drink and drive.'];
  if ((m = /^(\d+) kcal$/.exec(big))) return [`That's ${m[1]} kcal in total.`, `${m[1]} kcal in total.`];
  if ((m = /^(\d+) g$/.exec(big)) && /^(fat|protein|sugar)$/.test(small)) return [`That's ${m[1]} g of ${small} in total.`, `${m[1]} g of ${small}.`];
  void all; void alcohol;
  return [];
}

const HOOKS = {
  alcohol: ['Watch what this really does to your body.', "Here's what happens after you drink this."],
  caffeine: ['Watch where all that caffeine goes.', "Here's what this does to you all day."],
  solid: ['Watch what happens after the first bite.', "Here's where this food actually goes."],
  drink: ['Watch where this drink goes inside you.', "Here's what this does to your body."],
  compareGuess: ['Make your guess now.', 'Lock in your guess.'],
  compare: ['Same day. Two very different stories.', 'Two bodies. Watch them closely.'],
} as const;
const TEASE = ['Stay with this one.', 'Keep watching.', 'Wait for it.'] as const;
const CLIMAX = {
  sugar: ["And there's the sugar spike.", 'Here comes the sugar spike.'],
  caffeine: ["Here's the caffeine peak.", 'Caffeine peaks right here.'],
  alcohol: ['Blood alcohol peaks right here.', 'This is the alcohol peak.'],
  fat: ["Here's where blood fat peaks.", 'Blood fat peaks right here.'],
  other: ["Here's the big moment.", 'This is the big one.'],
  compareGuess: ['There it is. Did you guess right?', 'Did you get it right?'],
  compare: ["Here's the big difference.", "There's the difference."],
} as const;
const DAY = ['One full day later.', 'Twenty-four hours later.', 'A day later.'] as const;
const LOOP = { sip: ['From the first sip.', 'Back to the start.'], bite: ['From the first bite.', 'Back to the start.'] } as const;
const ANSWER_FALLBACK = { single: ["That's one full day inside you.", 'One day, inside you.'], compare: ['Now you know the difference.', 'Now you know.'] } as const;

/** What the climax is about, from the hero (the same climax moment, video-story heroOf / climaxFx). */
export function climaxKind(n: NarrIn): keyof typeof CLIMAX {
  if (n.kind === 'compare') return n.guess ? 'compareGuess' : 'compare';
  const h = n.hero ? `${n.hero.big} ${n.hero.small}` : '';
  if (/BAC|alcohol/i.test(h) || (n.alcohol && !h)) return 'alcohol';
  if (/Blood sugar/.test(h)) return 'sugar';
  if (/caffeine/.test(h)) return 'caffeine';
  if (/Blood fat/.test(h)) return 'fat';
  return 'other';
}

/** The voiceover script for one video plan. */
export function narrationFor(n: NarrIn): NarrLine[] {
  const { cues, seconds } = n.plan, s = n.seed;
  const at = (k: Cue['kind'], f?: (c: Cue) => boolean) => cues.filter((c) => c.kind === k && (!f || f(c))).map((c) => c.t);
  const impacts = [...at('peak'), ...at('verdict')].sort((a, b) => a - b);
  const outro = at('outro')[0] ?? seconds - n.plan.outroS, end = at('end')[0] ?? seconds;
  const lights = at('lights')[0], dayCue = at('day')[0];
  const out: NarrLine[] = [];
  // a window [t, t + slot) that keeps clear of the impacts and the tail, cut at `until`
  const clearSlot = (t: number, until: number) => {
    let e = Math.min(until, end - TAIL_S);
    for (const p of impacts) { if (t < p + IMPACT_POST_S && t >= p - IMPACT_PRE_S) return 0; if (p - IMPACT_PRE_S > t) e = Math.min(e, p - IMPACT_PRE_S); }
    return Math.max(0, e - t);
  };
  const add = (id: NarrId, t: number, until: number, options: readonly string[], source = '') => {
    const slot = clearSlot(t, until);
    const text = options.find((x) => speakS(x) <= slot);
    if (text) out.push({ id, t, slotS: slot, text, say: speakable(text), source });
  };
  // 1. the hook: after the hook frame's first half second, over the hook card and the first sip
  const hookT = Math.max(HOOK_QUIET_S + 0.1, 0.6);
  const hookSet = n.kind === 'compare' ? (n.guess ? HOOKS.compareGuess : HOOKS.compare) : n.alcohol ? HOOKS.alcohol : n.caffeine ? HOOKS.caffeine : n.solid ? HOOKS.solid : HOOKS.drink;
  add('hook', hookT, hookT + 3.4, [pick(hookSet, s, 1), ...hookSet]);
  // 2. the climax: right after the impact lands (the drop), over its words
  const peak = at('peak')[0];
  const ck = climaxKind(n);
  if (peak !== undefined) { const t = peak + IMPACT_POST_S + 0.05; add('climax', t, t + 3, [pick(CLIMAX[ck], s, 2), ...CLIMAX[ck]]); }
  // 3. the mid-video tease (a "Coming up" / "Answer at 24 h" card): one retention line, when it is clear of the rest
  const tease = at('next', (c) => c.data?.label === 'tease')[0];
  if (tease !== undefined) add('tease', tease + 0.1, tease + 2.2, [pick(TEASE, s, 3), ...TEASE]);
  // 4. the 24 h beat (the lights come on): single only (a comparison's verdict impact lands there)
  if (n.kind === 'single' && lights !== undefined) { const t = lights - 0.25; add('day', t, Math.min(outro, (dayCue ?? outro) + 0.6) - GAP_S, [pick(DAY, s, 4), ...DAY]); }
  // 5. the end card: its one number (single), else a number-free close; then the loop line if there is room
  const heroL = n.kind === 'single' ? heroLines(n.hero, n.alcohol) : [];
  const ansT = outro + 0.25;
  if (heroL.length) add('answer', ansT, end, heroL, n.hero ? `${n.hero.big} ${n.hero.small}` : '');
  if (!out.some((l) => l.id === 'answer')) add('answer', ansT, end, ANSWER_FALLBACK[n.kind]);
  const ans = out.find((l) => l.id === 'answer');
  if (ans) { const t = ans.t + speakS(ans.text) + 0.35, lp = LOOP[n.solid ? 'bite' : 'sip']; add('loop', t, end, [pick(lp, s, 5), ...lp]); }
  // keep the lines in time order, none over the next
  out.sort((a, b) => a.t - b.t);
  const kept: NarrLine[] = [];
  for (const l of out) {
    const prev = kept[kept.length - 1];
    if (prev && prev.t + speakS(prev.text) + GAP_S > l.t) continue;
    kept.push(l);
  }
  for (let i = 0; i < kept.length; i++) { const nx = kept[i + 1]; if (nx) kept[i].slotS = Math.min(kept[i].slotS, nx.t - GAP_S - kept[i].t); }
  return kept;
}

export type NarrIssue = { cls: string; text: string };
const BRITISH = /\b(colour|favourite|flavour|litre|metre|centre|programme|whilst|mum|fibre|grey|analyse|realise|organise|optimise|behaviour|haemo)\b/i;
const POSITIVE_ALCOHOL = /\b(fun|enjoy|relax|cheers|treat yourself|reward|good for you|healthy|celebrate|party|buzz|worth it)\b/i;
/** Lints a script (pure; text-audit and the sweep test run it). `onScreen`: text visible at a time t (seconds). */
export function lintNarration(lines: NarrLine[], n: NarrIn): NarrIssue[] {
  const out: NarrIssue[] = [], bad = (cls: string, text: string) => out.push({ cls, text });
  const { cues, seconds } = n.plan;
  const impacts = cues.filter((c) => c.kind === 'peak' || c.kind === 'verdict').map((c) => c.t);
  const outro = cues.find((c) => c.kind === 'outro')?.t ?? seconds;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i], d = speakS(l.text), e = l.t + d;
    if (l.t < HOOK_QUIET_S) bad('voice during the hook frame', l.text);
    if (d > l.slotS + 1e-6) bad('narration too long for its slot', `${l.text} (${d.toFixed(2)} s > ${l.slotS.toFixed(2)} s)`);
    if (e > seconds - TAIL_S + 1e-6) bad('narration over the end', l.text);
    if (impacts.some((p) => l.t < p + IMPACT_POST_S - 1e-6 && e > p - IMPACT_PRE_S + 1e-6)) bad('narration over an impact', `${l.text} @${l.t.toFixed(2)}`);
    if (lines[i + 1] && e > lines[i + 1].t + 1e-6) bad('narration overlap', l.text);
    // numbers: each one said is on screen (the line's source) and the speech text keeps them all
    const said = numbersOf(l.text), src = new Set(numbersOf(l.source));
    if (said.some((x) => !src.has(x))) bad('spoken number not on screen', `${l.text} | ${l.source}`);
    if (numbersOf(l.say).join() !== said.join()) bad('speech text changed a number', `${l.text} → ${l.say}`);
    if (said.length && l.id === 'answer' && l.t < outro) bad('spoken number before its card', l.text);
    if (BRITISH.test(l.text)) bad('not American English', l.text);
    if (n.alcohol && POSITIVE_ALCOHOL.test(l.text)) bad('alcohol framed positively', l.text);
    if (/guess/i.test(l.text) && n.kind === 'compare' && !n.guess) bad('narration contradicts the video', `${l.text} (no guess game)`);
    if (l.id === 'climax' && n.kind === 'single') {
      const k = climaxKind(n), want = { sugar: /sugar/i, caffeine: /caffeine/i, alcohol: /alcohol/i, fat: /fat/i, other: /moment|big/i }[k as 'sugar'] ?? /./;
      if (!want.test(l.text)) bad('narration contradicts the video', `${l.text} (climax: ${k})`);
    }
    if (/\b(sugar)\b/i.test(l.text) && n.hero && !/sugar/i.test(`${n.hero.big} ${n.hero.small}`) && l.id === 'climax') bad('narration contradicts the video', l.text);
    if (/undefined|NaN|\bnull\b|\$\{/.test(l.say)) bad('broken', l.say);
  }
  return out;
}

/** How much a spoken clip may run over its planned slot (s); a longer clip is said a little faster, else left out. */
export const OVERRUN_S = 0.15;
export interface PlacedClip { line: NarrLine; t: number; dur: number }
/** Puts the spoken clips on the timeline (real durations from the speech engine, or mocked by word count in tests):
 *  a clip that does not fit its slot is left out; none runs into the next one or past the end. */
export function placeClips(lines: NarrLine[], durs: (number | null)[], seconds: number): PlacedClip[] {
  const out: PlacedClip[] = [];
  lines.forEach((line, i) => {
    const dur = durs[i];
    if (dur === null || dur === undefined || !(dur > 0) || dur > line.slotS + OVERRUN_S) return;
    if (line.t + dur > seconds - TAIL_S) return;
    const nx = lines[i + 1];
    if (nx && line.t + dur > nx.t - 0.1) return;
    out.push({ line, t: line.t, dur });
  });
  return out;
}
