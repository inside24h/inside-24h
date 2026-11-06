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
// v20 (owner: "not a boring reel"; retention review 2026-11-06: the voice covered only 8-16 % of a video, with 17-42 s
// of silence in the middle): the voice now TELLS THE STORY. It reads the hook card, then every card of the story as it
// comes up (the card itself steps aside while it is said: the word-by-word caption takes its place, share.ts), the
// climax with an exclamation, the tease, the 24 h beat, the end card's number and a loop line that ends on the last
// frame. Spoken = on screen, word for word, so every number said is a number shown (lintNarration). Target: 60-75 %
// of a video voiced, no silence over ~4 s except the hush before an impact (video-narration.test.ts sweeps).
import { FPS, type Cue, type Plan, type VFrame } from './video-plan';

/** Speaking rate the slots are planned with (words per second; Kokoro af_heart at speed 1 says ~2.6-2.9). */
export const WPS = 2.6;
/** No voice during the first half second (the cold open and the hook card land first). */
export const HOOK_QUIET_S = 0.5;
/** Silence kept before an impact (the riser falls away, the hush, the drop) and after it. */
export const IMPACT_PRE_S = 1.7, IMPACT_POST_S = 0.35;
/** The last bit of the video is the loop fade. */
export const TAIL_S = 0.3;
export const GAP_S = 0.25;

export type NarrId = 'hook' | 'card' | 'beat' | 'tease' | 'climax' | 'day' | 'answer' | 'loop';
export interface NarrLine {
  id: NarrId;
  /** start (s) */ t: number;
  /** the most time it may take (s) */ slotS: number;
  /** the line as written (numbers as on screen) */ text: string;
  /** the same line for the speech engine (units in words, "30–50" as "30 to 50"); the same numbers */ say: string;
  /** the on-screen text this line's numbers come from (empty when it has none) */ source: string;
  /** v20: the story card this line reads out (word for word): that card steps aside while it is said */ card?: string;
  /** v20, comparison: the side whose card it reads (0 left, 1 right, 2 both) */ side?: 0 | 1 | 2;
}
export interface NarrIn {
  plan: Pick<Plan, 'seconds' | 'cues' | 'introS' | 'outroS'> & { frames?: readonly Pick<VFrame, 'phase' | 't' | 'cap' | 'capB' | 'title' | 'titleB' | 'tease'>[] };
  kind: 'single' | 'compare';
  seed: number;
  alcohol?: boolean; caffeine?: boolean; solid?: boolean;
  /** single: the end card's hero number (video-story heroOf) */ hero?: { big: string; small: string };
  /** compare: the guess game is on (a question with an answer banner at the 'peak' cue) */ guess?: boolean;
  /** v20: the hook card on screen (single: two lines; comparison: line1 is the question or the hook) */ hook?: { line1: string; line2: string };
  /** v20, comparison: the two names (left, right) and the guess's answer banner (its first line) */ names?: [string, string]; answer?: string;
}

/** Words as spoken: a number counts as the words it is said with ("22" two, "0.04" four), hyphens split words. */
const numWords = (n: number): number => (n <= 20 ? 1 : n < 100 ? (n % 10 ? 2 : 1) : n < 1000 ? 2 + (n % 100 ? numWords(n % 100) : 0) : numWords(Math.floor(n / 1000)) + 1 + (n % 1000 ? numWords(n % 1000) : 0));
export const wordsOf = (s: string) => s.replace(/(\d+)(?:\.(\d+))?/g, (_m, a: string, b?: string) => Array(numWords(Number(a)) + (b ? 1 + b.length : 0)).fill('w').join(' '))
  .trim().split(/[\s-]+/).filter((w) => /\w/.test(w)).length;
/** Seconds a line takes at WPS (counted on its spoken form: units in words). */
export const speakS = (s: string) => wordsOf(speakable(s)) / WPS;
/** Numbers in a text ("+30–50 %" → 30, 50; "0.04" stays "0.04"). */
export const numbersOf = (s: string) => (clock12(s).match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(',', '.'));
/** v20: a clock time as Americans say it ("07:00" → "7 AM", "22:30" → "10:30 PM"); numbers compare in this form. */
export const clock12 = (s: string) => s.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, (_m, h: string, mm: string) => {
  const H = Number(h), h12 = H % 12 || 12;
  return `${h12}${mm === '00' ? '' : `:${mm}`} ${H < 12 ? 'AM' : 'PM'}`;
});

/** The words a speech engine needs: units spelled out, ranges with "to", clock times in 12 h. Keeps every number. */
export function speakable(s: string): string {
  return clock12(s)
    .replace(/(\d)\s*[–-]\s*(\d)/g, '$1 to $2')
    .replace(/\bvs\.?(?=\s)/g, 'versus')
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

/** One option per slot, from the video's seed; v19: each slot hashed on its own (with one shared index the slots moved
 *  together and a pool of n lines made only n different scripts). */
const pick = <T,>(xs: readonly T[], seed: number, salt: number) => {
  let h = Math.imul((seed >>> 0) ^ Math.imul(salt + 1, 0x9e3779b1), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return xs[((h ^ (h >>> 16)) >>> 0) % xs.length];
};

/** The end card's number as one spoken line, longest first (the planner keeps the first that fits its slot); the
 *  numbers are exactly the hero's. Unknown shapes: none (the line falls back to a number-free one). */
export function heroLines(hero: { big: string; small: string } | undefined, alcohol = false): string[] {
  if (!hero) return [];
  const { big, small } = hero, all = `${big} ${small}`;
  let m: RegExpExecArray | null;
  if (/^Blood sugar up/.test(big) && (m = /\+?(\d+)–(\d+) %/.exec(small))) return [`The peak? Blood sugar up ${m[1]}–${m[2]} %.`, `Blood sugar: up ${m[1]}–${m[2]} %.`, `Sugar: up ${m[1]}–${m[2]} %.`];
  if (/^Blood fat up · \d+ h/.test(big)) return [`The slowest part? The fat.`, `The fat took longest.`];
  if ((m = /^(\d+) mg caffeine/.exec(big)) && /still in your body/.test(small)) return [`A day later? ${m[1]} mg of caffeine, still in you.`, `${m[1]} mg of caffeine, still in you.`, `${m[1]} mg, still in you.`];
  // alcohol: the BAC range is too long to say well ("zero point zero one one to …"): the safety line instead
  if (/BAC/.test(small) || alcohol) return ['Remember: never drink and drive.', 'Never drink and drive.'];
  if ((m = /^(\d+) kcal$/.exec(big))) return [`The total? ${m[1]} kcal.`, `${m[1]} kcal in total.`];
  if ((m = /^(\d+) g$/.exec(big)) && /^(fat|protein|sugar)$/.test(small)) return [`The total? ${m[1]} g of ${small}.`, `${m[1]} g of ${small}.`];
  void all; void alcohol;
  return [];
}

// v19 (owner: "even more viral"): punchier, curious lines: questions, "watch this", reveals. Bigger pools, so the
// scripts differ from video to video (text-audit: no script on more than 10 % of the videos).
const HOOKS = {
  alcohol: ['Watch what this really does to your body.', "Here's what happens after you drink this.", 'Where does the alcohol go? Watch.', 'Ever wonder where this goes? Watch.', 'Your body after this drink. Watch.', 'Follow every sip of this.', 'What does this do to you? Watch.', 'Watch your body handle this drink.'],
  caffeine: ['Watch where all that caffeine goes.', "Here's what this does to you all day.", 'Where does the caffeine go? Watch.', 'How long does this last? Watch.', 'Ever wonder where this goes? Watch.', 'Watch this hit your body.', 'Follow every sip of this.', 'What does this really do? Watch.'],
  solid: ['Watch what happens after the first bite.', "Here's where this food actually goes.", 'Where does this food go? Watch.', 'Ever wonder where this goes? Watch.', 'What does this do to you? Watch.', 'Follow this bite all the way.', 'Watch your body take this on.', 'One bite. Now watch closely.'],
  drink: ['Watch where this drink goes inside you.', "Here's what this does to your body.", 'Where does this drink go? Watch.', 'Ever wonder where this goes? Watch.', 'What does this do to you? Watch.', 'Follow every sip of this.', 'Watch your body take this in.', 'One sip. Now watch closely.'],
  compareGuess: ['Make your guess now.', 'Lock in your guess.', 'Which one? Guess now.', 'Pick one before the answer.', 'Guess now. No peeking.', 'Your guess? Lock it in.'],
  compare: ['Same day. Two very different stories.', 'Two bodies. Watch them closely.', 'Which body has the harder day?', 'Two choices. Watch both closely.', 'Side by side. Spot the difference?', 'Same body. Two very different days.'],
} as const;
const TEASE = ['Stay with this one.', 'Keep watching.', 'Wait for it.', "Don't scroll yet.", 'The big part is coming.', "It's not over yet.", 'Watch what comes next.', 'Now watch this part.'] as const;
const CLIMAX = {
  sugar: ["And there's the sugar spike.", 'Here comes the sugar spike.', 'See that? The sugar spike.', 'Boom. The sugar spike.', 'There it is: the sugar spike.'],
  caffeine: ["Here's the caffeine peak.", 'Caffeine peaks right here.', 'See that? The caffeine peak.', 'Boom. Peak caffeine.', 'There it is: peak caffeine.'],
  alcohol: ['Blood alcohol peaks right here.', 'This is the alcohol peak.', 'See that? Peak blood alcohol.', 'There it is: the alcohol peak.'],
  fat: ["Here's where blood fat peaks.", 'Blood fat peaks right here.', 'See that? The blood fat peak.', 'There it is: peak blood fat.'],
  other: ["Here's the big moment.", 'This is the big one.', 'See that? The big moment.', 'There it is: the big moment.'],
  compareGuess: ['There it is. Did you guess right?', 'Did you get it right?', 'So, were you right?', 'Called it? Here it is.'],
  compare: ["Here's the big difference.", "There's the difference.", 'See that? The big difference.', 'There it is: the difference.'],
} as const;
const DAY = ['One full day later.', 'Twenty-four hours later.', 'A day later.', 'Fast forward a full day.', 'And a whole day later?', 'Next day.'] as const;
const LOOP = { sip: ['From the first sip.', 'Back to the start.', 'Watch it again.', 'One more time?'], bite: ['From the first bite.', 'Back to the start.', 'Watch it again.', 'One more time?'] } as const;
const ANSWER_FALLBACK = { single: ["That's one full day inside you.", 'One day, inside you.'], compare: ['Now you know the difference.', 'Now you know.'] } as const;
/** v19: the most words a line may have in each slot (short and spoken: a viewer hears it once). */
export const SLOT_WORDS: Record<NarrId, number> = { hook: 18, card: 16, beat: 6, tease: 12, climax: 14, day: 6, answer: 10, loop: 5 };
/** v20: a card is read from this long after it comes up; a reading may start this much later (after the line before). */
export const CARD_LEAD_S = 0.15, CARD_DELAY_S = 2.5;
/** v20: exclamations in front of the climax card (calm ones for alcohol: never celebrated). */
const EXCL = { std: ['There it is.', 'Boom.', 'See that?', 'Right there.', 'Look at that.'], calm: ['There it is.', 'See that?', 'Right there.'] } as const;
const TEASE_LEAD = ['Stay with me.', 'Wait for it.', "Don't scroll yet.", 'Keep watching.', 'Hold on.'] as const;
const GUESS_TAIL = ['Guess now.', 'Lock it in.', 'Make your guess.', 'Pick one now.'] as const;
const REVEAL_LEAD = ['Called it?', 'Were you right?', 'Did you get it?'] as const;
/** v20: a short beat in a long moment (6.5 s or more), after its card: keeps the eyes on the body, says no number. */
const BEAT = ['Watch it happen.', 'Look closely.', 'Keep your eyes on it.', 'See it move?', 'Right inside you.', 'All of this, inside you.', 'Watch this part.', 'Look at it go.'] as const;
export const BEAT_MIN_SPAN_S = 6.5, BEAT_EVERY_S = 4;
const ORGANS = /\b(stomach|small intestine|large intestine|liver|kidneys|bladder|brain|heart|pancreas|gut)\b/i;
const ORGAN_BEAT = [(o: string) => `Your ${o}, hard at work.`, (o: string) => `Watch your ${o} work.`, (o: string) => `That's your ${o}, right now.`];
/** A card whose subject leans on its title ("Half has moved on…" under IN YOUR STOMACH) is said with the title first. */
const VAGUE = /^(Half|Most|Almost|Nearly|Some|All|Much|Little|None|Less|More)\b/;
const lc1 = (s: string) => (/^[A-Z][a-z’']*\b/.test(s) && !/^I\b|^I[’']/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const cap1 = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const words = (s: string) => s.toLowerCase().replace(/[’']/g, "'").split(/[^a-z0-9.']+/).map((w) => w.replace(/\.$/, '')).filter((w) => w.length > 2 || /\d/.test(w));
/** Every word (3+ letters) and number of `card` is in `said` (the card would only repeat what was just said). */
export const saidAlready = (card: string, said: string) => { const s = new Set(words(said)); const c = words(card); return c.length > 0 && c.every((w) => s.has(w)); };

/** v20: the story cards as they are on screen: one span per card (left and right for a comparison). */
export interface CardSpan { t0: number; t1: number; a: string; b: string; title: string; titleB: string; tease: boolean }
export function cardSpans(frames: NonNullable<NarrIn['plan']['frames']>): CardSpan[] {
  const out: CardSpan[] = [];
  for (const f of frames) {
    if (f.phase !== 'main') continue;
    const a = (f.cap ?? '').trim(), b = (f.capB ?? '').trim();
    if (!a && !b) continue;
    const l = out[out.length - 1];
    if (l && l.a === a && l.b === b && f.t - l.t1 < 0.1) { l.t1 = f.t + 1 / FPS; continue; }
    out.push({ t0: f.t, t1: f.t + 1 / FPS, a, b, title: (f.title ?? '').trim(), titleB: (f.titleB ?? '').trim(), tease: !!f.tease });
  }
  return out;
}
/** A card as it is said: the card word for word, its title first when the card leans on it. */
export function cardSaid(card: string, title: string): string[] {
  const c = card.trim();
  if (!/[.?!]$/.test(c)) return [];
  const t = title.replace(/[.:]+$/, '').trim();
  const key = /stomach|intestine/i.exec(t)?.[0]?.toLowerCase();
  return VAGUE.test(c) && key && !c.toLowerCase().includes(key) && t.toLowerCase() !== c.replace(/\.$/, '').toLowerCase() ? [`${cap1(t.toLowerCase())}: ${lc1(c)}`, c] : [c];
}

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
  // a window [t, t + slot) that keeps clear of the impacts and the tail, cut at `until`
  const clearSlot = (t: number, until: number) => {
    let e = Math.min(until, end - TAIL_S);
    for (const p of impacts) { if (t < p + IMPACT_POST_S && t >= p - IMPACT_PRE_S) return 0; if (p - IMPACT_PRE_S > t) e = Math.min(e, p - IMPACT_PRE_S); }
    return Math.max(0, e - t);
  };
  // candidates; placed in time order, each as soon after the one before as it may (`delay`), else left out
  type Cand = Omit<NarrLine, 'slotS' | 'say' | 'text'> & { until: number; delay: number; options: readonly string[] };
  const cands: Cand[] = [];
  const cmp = n.kind === 'compare', calm = !!n.alcohol;
  const peak = at('peak')[0];
  const ck = climaxKind(n);
  // 1. the hook: the hook card read out (its numbers are on it), else a line from the pool
  const hookT = Math.max(HOOK_QUIET_S + 0.1, 0.6);
  const hookSet = cmp ? (n.guess ? HOOKS.compareGuess : HOOKS.compare) : n.alcohol ? HOOKS.alcohol : n.caffeine ? HOOKS.caffeine : n.solid ? HOOKS.solid : HOOKS.drink;
  const h1 = (n.hook?.line1 ?? '').trim(), h2 = (n.hook?.line2 ?? '').trim(), ends = (x: string) => /[.?!]$/.test(x);
  const hookOpts: string[] = [];
  if (cmp && n.guess && h1) { const q = cap1(h1.replace(/^Guess:\s*/i, '')); if (ends(q)) hookOpts.push(`${q} ${pick(GUESS_TAIL, s, 6)}`, q); }
  else if (cmp && ends(h1)) hookOpts.push(h1);
  // (a question over a bare name, "How long does it stay in your blood? / Beer.", is said name first)
  else if (ends(h1) && ends(h2) && /\?$/.test(h1) && wordsOf(h2) <= 4 && !/\d/.test(h2)) hookOpts.push(`${h2} ${h1}`, h1);
  else if (ends(h1) && ends(h2)) hookOpts.push(`${h1} ${h2}`, /\?$/.test(h2) ? h2 : h1, /\?$/.test(h2) ? h1 : h2);
  else if (ends(h1)) hookOpts.push(h1);
  // (chosen here: the cards after it skip what it said; it is the first line, so its window is known)
  const hookAll = [...hookOpts, pick(hookSet, s, 1), ...hookSet];
  const hookText = hookAll.find((x) => speakS(x) <= clearSlot(hookT, hookT + 6.5) && wordsOf(x) <= SLOT_WORDS.hook) ?? '';
  cands.push({ id: 'hook', t: hookT, until: hookT + 6.5, delay: 0, options: hookText ? [hookText] : [], source: `${h1} ${h2}`.trim() });
  // 2. the story cards, read as they come up (the hook's own words are not read twice)
  const spans = n.plan.frames ? cardSpans(n.plan.frames) : [];
  const names = n.names ?? ['', ''];
  const spoken = hookOpts.includes(hookText) ? hookText : '';
  let prevA = '', prevB = '';
  // short beats, each video's own order, none twice in a row
  let nBeat = 0;
  const beats = (about = '') => {
    const k = BEAT.indexOf(pick(BEAT, s, 10)) + nBeat++, gen = [...BEAT.slice(k % BEAT.length), ...BEAT.slice(0, k % BEAT.length)];
    // (the organ of this moment first: "Your kidneys, hard at work.")
    const org = ORGANS.exec(about)?.[1]?.toLowerCase();
    return org ? [...ORGAN_BEAT.map((f) => f(org)).slice(nBeat % ORGAN_BEAT.length), ...ORGAN_BEAT.map((f) => f(org)), ...gen] : gen;
  };
  spans.forEach((sp, i) => {
    const nx = spans[i + 1], until = Math.min(sp.t1 + 0.3, nx ? nx.t0 - GAP_S : Infinity);
    // (a card that comes up in the hush before an impact, or on it, is read after the impact's own line)
    const hit = impacts.find((p) => sp.t0 + CARD_LEAD_S >= p - IMPACT_PRE_S && sp.t0 + CARD_LEAD_S < p + IMPACT_POST_S);
    const t = hit !== undefined ? hit + IMPACT_POST_S + 0.1 : sp.t0 + CARD_LEAD_S, late = hit !== undefined ? 99 : CARD_DELAY_S;
    // a long moment gets a short beat after its card
    if (sp.t1 - sp.t0 >= BEAT_MIN_SPAN_S) cands.push({ id: 'beat', t: Math.max(t, sp.t0 + 3.2), until: sp.t1 - 0.2, delay: 99, options: beats(`${sp.title} ${sp.a} ${sp.b}`), source: '' });
    const atPeak = !cmp && peak !== undefined && sp.t0 <= peak + 0.5 && sp.t1 > peak + 0.5;
    if (!cmp) {
      if (!sp.a || saidAlready(sp.a, spoken)) { if (sp.t1 - sp.t0 >= 2.5 && sp.t1 - sp.t0 < BEAT_MIN_SPAN_S) cands.push({ id: 'beat', t, until: sp.t1 - 0.2, delay: 99, options: beats(), source: '' }); return; }
      const said = cardSaid(sp.a, sp.title);
      if (!said.length) return;
      if (atPeak) {
        const tp = peak! + IMPACT_POST_S + 0.05, ex = EXCL[calm ? 'calm' : 'std'];
        cands.push({ id: 'climax', t: tp, until, delay: 0.3, options: [...said.map((x) => `${pick(ex, s, 2)} ${x}`), ...said, pick(CLIMAX[ck], s, 2), ...CLIMAX[ck]], source: `${sp.title} ${sp.a}`, card: sp.a, side: 0 });
        return;
      }
      if (sp.tease) { cands.push({ id: 'tease', t, until, delay: late, options: [`${pick(TEASE_LEAD, s, 3)} ${sp.a}`, sp.a, pick(TEASE, s, 3)], source: sp.a, card: sp.a, side: 0 }); return; }
      // (a card the headline already shows is read, but not captioned and not hidden: the screen already says it)
      const onTop = saidAlready(sp.a, `${h1} ${h2}`);
      cands.push({ id: 'card', t, until, delay: late, options: [...said, ...beats()], source: `${sp.title} ${sp.a}`, ...(onTop ? {} : { card: sp.a, side: 0 as const }) });
      return;
    }
    // comparison: a card both sides show is said once; the two names as "Left: … Right: …"; else each side whose card
    // changed, with its name first ("Cola: Your blood sugar climbs to its peak.")
    const a = sp.a, b = sp.b, newA = !!a && a !== prevA, newB = !!b && b !== prevB;
    prevA = a; prevB = b;
    if (a && a === b) {
      if (!saidAlready(a, spoken) && ends(a)) cands.push({ id: sp.tease ? 'tease' : 'card', t, until, delay: late, options: sp.tease ? [`${pick(TEASE_LEAD, s, 3)} ${a}`, a, pick(TEASE, s, 3)] : [a, ...beats()], source: a, card: a, side: 2 });
      return;
    }
    const isName = (x: string, nm: string) => !!nm && x.replace(/\.$/, '').toLowerCase() === nm.toLowerCase();
    if (newA && newB && isName(a, names[0]) && isName(b, names[1])) { cands.push({ id: 'card', t, until, delay: late, options: [`Left: ${a} Right: ${b}`], source: `${a} ${b}` }); return; } // (the names are on screen: no caption)
    const side = (x: string, nm: string, title: string, k: 0 | 1, tt: number, delay: number) => {
      if (!ends(x)) return;
      const said = cardSaid(x, title), who = x.toLowerCase().includes(nm.trim().toLowerCase()) ? '' : cap1(nm.trim());
      cands.push({ id: 'card', t: tt, until, delay, options: [...(who ? [`${who}: ${x}`] : []), ...said, ...beats()], source: `${title} ${x} ${who}`, ...(isName(x, nm) || saidAlready(x, spoken) ? {} : { card: x, side: k }) });
    };
    if (newA) side(a, names[0], sp.title, 0, t, late);
    if (newB) side(b, names[1], sp.titleB, 1, t + (newA ? 0.01 : 0), newA ? 99 : late);
  });
  // 3. the climax (comparison: the answer banner; a single without a card at its peak: the pool)
  if (peak !== undefined && !cands.some((c) => c.id === 'climax')) {
    const tp = peak + IMPACT_POST_S + 0.05, ans = (n.answer ?? '').trim();
    const opts = cmp && n.guess && ends(ans) ? [`${pick(REVEAL_LEAD, s, 2)} ${ans}`, ans, pick(CLIMAX[ck], s, 2), ...CLIMAX[ck]] : [pick(CLIMAX[ck], s, 2), ...CLIMAX[ck]];
    cands.push({ id: 'climax', t: tp, until: tp + 4, delay: 0.3, options: opts, source: ans });
  }
  // 4. the 24 h beat (the lights come on): single only (a comparison's verdict impact lands there)
  if (!cmp && lights !== undefined) { const t = lights - 0.25; cands.push({ id: 'day', t, until: Math.min(outro, (dayCue ?? outro) + 0.6) - GAP_S, delay: 0.3, options: [pick(DAY, s, 4), ...DAY], source: '' }); }
  // 5. the end card: its one number (single), else a number-free close; then the loop line, ending on the last frame
  const heroL = !cmp ? heroLines(n.hero, n.alcohol) : [];
  const ansT = outro + 0.25;
  cands.push({ id: 'answer', t: ansT, until: end, delay: 0.6, options: [...heroL, ...ANSWER_FALLBACK[n.kind]], source: heroL.length && n.hero ? `${n.hero.big} ${n.hero.small}` : '' });
  const lp = LOOP[n.solid ? 'bite' : 'sip'];
  cands.push({ id: 'loop', t: ansT + 0.01, until: end, delay: 99, options: [pick(lp, s, 5), ...lp], source: '' });
  // place them: time order, none over the next, each in its own window
  cands.sort((p, q) => p.t - q.t);
  const out: NarrLine[] = [];
  let free = 0, lastBeat = -Infinity;
  for (const c of cands) {
    const t = Math.max(c.t, free);
    if (t - c.t > c.delay + 1e-6) continue;
    if (c.id === 'beat' && t - lastBeat < BEAT_EVERY_S) continue;
    const slot = clearSlot(t, c.until);
    const text = c.options.find((x) => speakS(x) <= slot && wordsOf(x) <= SLOT_WORDS[c.id]);
    if (!text) continue;
    // (a line from a pool has no on-screen source: it says no number)
    const fromPool = (c.id === 'answer' && !heroL.includes(text)) || (c.id === 'hook' && !hookOpts.includes(text)) || (c.id === 'climax' && !c.card && cmp && !text.endsWith((n.answer ?? '').trim() || '\u0000'));
    const { until: _u, delay: _d, options: _o, card, side, ...rest } = c; void _u; void _d; void _o;
    // (a pool line instead of the card: the card stays on screen, and the line has no on-screen source)
    const reads = !!card && card.split('|').every((x) => text.toLowerCase().includes(x.slice(1).toLowerCase()));
    out.push({ ...rest, ...(reads ? { card, side } : {}), t, slotS: slot, text, say: speakable(text), source: fromPool || (card && !reads) ? '' : c.source });
    free = t + speakS(text) + GAP_S;
    if (c.id === 'beat') lastBeat = t;
  }
  // the loop line ends on the last frame (it hands over to frame 0)
  const loop = out[out.length - 1];
  if (loop?.id === 'loop') { const t = Math.max(loop.t, end - TAIL_S - speakS(loop.text) - 0.1); loop.slotS -= t - loop.t; loop.t = t; }
  for (let i = 0; i < out.length; i++) { const nx = out[i + 1]; if (nx) out[i].slotS = Math.min(out[i].slotS, nx.t - GAP_S - out[i].t); }
  return out;
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
    if (l.id === 'climax' && n.kind === 'single' && !l.card) {
      const k = climaxKind(n), want = { sugar: /sugar/i, caffeine: /caffeine/i, alcohol: /alcohol/i, fat: /fat/i, other: /moment|big/i }[k as 'sugar'] ?? /./;
      if (!want.test(l.text)) bad('narration contradicts the video', `${l.text} (climax: ${k})`);
    }
    if (/\b(sugar)\b/i.test(l.text) && n.hero && !/sugar/i.test(`${n.hero.big} ${n.hero.small}`) && l.id === 'climax' && !l.card) bad('narration contradicts the video', l.text);
    if (/undefined|NaN|\bnull\b|\$\{/.test(l.say)) bad('broken', l.say);
    // v19: length per slot, and the grammar of a spoken line (a capital, an end mark, a question that is one)
    if (wordsOf(l.text) > SLOT_WORDS[l.id]) bad('narration line too long for its kind', `${l.id}: ${l.text}`);
    if (!/^[A-Z0-9]/.test(l.text) || !/[.?!]$/.test(l.text)) bad('narration grammar', l.text);
    const q = l.text.split(/(?<=[.?!:])\s+/).find((x) => x.includes('?'));
    if (q && l.id !== 'hook' && !/^(Where|What|When|How|Which|Who|Why|Ever|Did|Does|Do|Is|Are|Can|Will|Were|Has|Have|On|So|Called|And|The|A|Your|Same|Side|Spot|One|Two|See)\b/i.test(q)) bad('narration grammar', `odd question: ${l.text}`);
    if (/\s{2,}|\s[,.?!:]|\.\.|\?\.|[,:]$/.test(l.text)) bad('narration grammar', l.text);
    if (/\b(\w+)\s+\1\b/i.test(l.text)) bad('narration grammar', `repeated word: ${l.text}`);
    // v20: a line that reads a card says that card word for word (its caption takes the card's place: one text)
    if (l.card && !l.card.split('|').every((c) => l.text.toLowerCase().includes(c.slice(1).toLowerCase()))) bad('narration differs from its card', `${l.text} | ${l.card}`);
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
