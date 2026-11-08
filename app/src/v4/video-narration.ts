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
import { timeAt, type Arc } from './video-facts';

/** Speaking rate the slots are planned with (words per second; Kokoro af_heart at speed 1 says ~2.6-2.9). */
export const WPS = 2.6;
/** No voice during the first half second (the cold open and the hook card land first). */
export const HOOK_QUIET_S = 0.5;
/** Silence kept before an impact (the riser falls away, the hush, the drop) and after it. */
export const IMPACT_PRE_S = 1.7, IMPACT_POST_S = 0.35;
/** The last bit of the video is the loop fade. */
export const TAIL_S = 0.3;
export const GAP_S = 0.25;

export type NarrId = 'hook' | 'card' | 'beat' | 'setup' | 'tease' | 'climax' | 'twist' | 'payoff' | 'day' | 'answer' | 'loop';
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
  plan: Pick<Plan, 'seconds' | 'cues' | 'introS' | 'outroS'> & { frames?: readonly (Pick<VFrame, 'phase' | 't' | 'cap' | 'capB' | 'title' | 'titleB' | 'tease'> & { stop?: number })[] };
  kind: 'single' | 'compare';
  seed: number;
  alcohol?: boolean; caffeine?: boolean; solid?: boolean;
  /** single: the end card's hero number (video-story heroOf) */ hero?: { big: string; small: string };
  /** compare: the guess game is on (a question with an answer banner at the 'peak' cue) */ guess?: boolean;
  /** v20: the hook card on screen (single: two lines; comparison: line1 is the question or the hook); v23b: the title of
   *  the moment that answers its question (video-hook payoff, or its extra moment) */ hook?: { line1: string; line2: string; payoff?: string; extra?: { title: string } };
  /** v20, comparison: the two names (left, right) and the guess's answer banner (its first line) */ names?: [string, string]; answer?: string;
  /** v21b, single: the food's short name ("Ham sub"): the hook says it first */ name?: string;
  /** v21c: this food's facts as short spoken lines (video-facts.ts; a comparison's name their side): the only fillers */ facts?: string[];
  /** v21c, comparison: its differences as spoken lines, said only after the answer */ lateFacts?: string[];
  /** v23, single: the story arc of this food's class (video-facts arcFor): hook, setup, twist, close and loop lines */ arc?: Arc;
  /** v21c, comparison: the end card's verdict ("🏆 Cod wins: no blood sugar peak, 486 fewer kcal.") */ verdict?: string;
}

/** Words as spoken: a number counts as the words it is said with ("22" two, "0.04" four), hyphens split words. */
const numWords = (n: number): number => (n <= 20 ? 1 : n < 100 ? (n % 10 ? 2 : 1) : n < 1000 ? 2 + (n % 100 ? numWords(n % 100) : 0) : numWords(Math.floor(n / 1000)) + 1 + (n % 1000 ? numWords(n % 1000) : 0));
export const wordsOf = (s: string) => s.replace(/(\d+)(?:\.(\d+))?/g, (_m, a: string, b?: string) => Array(numWords(Number(a)) + (b ? 1 + b.length : 0)).fill('w').join(' '))
  .trim().split(/[\s-]+/).filter((w) => /\w/.test(w)).length;
/** Seconds a line takes at WPS (counted on its spoken form: units in words). */
export const speakS = (s: string) => wordsOf(ttsText(speakable(s))) / WPS;
/** Numbers in a text ("+30–50 %" → 30, 50; "0.04" stays "0.04"). */
export const numbersOf = (s: string) => (clock12(s).match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(',', '.').replace(/\.0+$/, ''));
/** v20: a clock time as Americans say it ("07:00" → "7 AM", "22:30" → "10:30 PM"); numbers compare in this form. */
export const clock12 = (s: string) => s.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, (_m, h: string, mm: string) => {
  const H = Number(h), h12 = H % 12 || 12;
  return `${h12}${mm === '00' ? '' : `:${mm}`} ${H < 12 ? 'AM' : 'PM'}`;
});

/** v22: the quantities in a text with their unit ("2 g", "2 hours", "26 kcal"): a filler's number is "new" unless the
 *  same quantity was shown or said (not just the same digits in another unit) */
export const qtyOf = (s: string) => (shownText(s).match(/\d+(?:[.,]\d+)?(?:\s*(?:%|kcal|calories|mg|ml|g|grams|hours?|minutes?|teaspoons?|liters?|standard)(?![a-z]))?/g) ?? []).map((q) => {
  const m = /^(\d+(?:[.,]\d+)?)\s*(.*)$/.exec(q)!, u = ({ grams: 'g', calories: 'kcal', hour: 'hours', minute: 'minutes', teaspoon: 'teaspoons', liter: 'liters' } as Record<string, string>)[m[2]] ?? m[2];
  return `${m[1].replace(',', '.').replace(/\.0+$/, '')}${u ? ` ${u}` : ''}`;
});
/** v21: a clock time said the way people say it ("7 AM" → "7 in the morning", "10:30 PM" → "10:30 at night"). */
const dayPart = (h12: number, pm: boolean) => (!pm ? (h12 === 12 || h12 < 5 ? 'at night' : 'in the morning') : h12 === 12 || h12 < 5 ? 'in the afternoon' : h12 < 9 ? 'in the evening' : 'at night');
/** v21: "1 hours" → "1 hour" (the unit after a lone 1 is singular). */
const singular = (s: string) => s.replace(/(^|[^\d.,])1 (hours|minutes|grams|milligrams|milliliters|calories|teaspoons)\b/g, (_m, a: string, u: string) => `${a}1 ${u.slice(0, -1)}`);
/** v21: the line as shown in the word-by-word captions: what the voice says, in a readable form (clock times in
 *  12 h, "h"/"min" as words, "&" as "and"); "g", "ml", "mg", "kcal" and "%" stay short on screen. Keeps every number. */
export function shownText(s: string): string {
  return singular(clock12(s.replace(/\+(\d{1,2}):(\d\d)\b/g, (_m, h: string, mm: string) => `${Number(h)} h${mm === '00' ? '' : ` ${Number(mm)} min`} later`))
    .replace(/(\d)\s*h\b/g, '$1 hours')
    .replace(/(\d)\s*min\b/g, '$1 minutes')
    .replace(/\s&\s/g, ' and ')
    .replace(/\b(\d+ (?:hours|minutes)) later later\b/g, '$1 later'));
}

/** The words a speech engine needs: units spelled out, ranges with "to", clock times in 12 h said with the part of the
 *  day, symbols as words. Keeps every number (the lint compares them with the screen). */
export function speakable(s: string): string {
  return singular(shownText(s)
    .replace(/(\d+)(?::(\d\d))? (AM|PM)\b/g, (_m, h: string, mm: string | undefined, ap: string) => `${h}${mm ? `:${mm}` : ''} ${dayPart(Number(h), ap === 'PM')}`)
    .replace(/(\d)\s*[–-]\s*(\d)/g, '$1 to $2')
    .replace(/\bvs\.?(?=\s)/g, 'versus')
    .replace(/\+(?=\d)/g, '')
    .replace(/(\d)\s*%/g, '$1 percent')
    .replace(/(\d)\s*×/g, '$1 times')
    .replace(/\s*&\s*/g, ' and ')
    .replace(/[~≈]\s*(?=\d)/g, 'about ')
    .replace(/(\d)\s*mg\b/g, '$1 milligrams')
    .replace(/(\d)\s*kcal\b/g, '$1 calories')
    .replace(/\bkcal\b/g, 'calories')
    .replace(/(\d)\s*ml\b/g, '$1 milliliters')
    .replace(/(\d)\s*g\b/g, '$1 grams')
    .replace(/\bBAC\b/g, 'blood alcohol')
    .replace(/\s{2,}/g, ' ').trim());
}

/** v21: the last step before the speech engine (not shown, not linted on numbers): durations as people say them
 *  ("1.5 hours" → "an hour and a half", "1 hour 30 minutes" → "an hour and a half", "6.0" → "6"). */
export function ttsText(say: string): string {
  const half = (h: number) => (h === 0 ? 'half an hour' : h === 1 ? 'an hour and a half' : `${h} and a half hours`);
  return say
    .replace(/\b(\d+)\.0+\b/g, '$1')
    .replace(/\b(\d+)\.5 hours\b/g, (_m, h: string) => half(Number(h)))
    .replace(/\b(\d+) hours? (?:and )?(\d+) minutes\b/g, (_m, h: string, mm: string) => (mm === '30' ? half(Number(h)) : `${h === '1' ? 'an hour' : `${h} hours`} and ${mm} minutes`))
    .replace(/(^|[^\d.,])1 hour\b/g, '$1an hour')
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
  if ((m = /^Blood fat up · (\d+) h/.exec(big))) return [`The slowest part? The fat.`, `The fat took longest.`, `The slowest part took ${m[1]} hours.`];
  if ((m = /^(\d+) mg caffeine/.exec(big)) && /still in your body/.test(small)) return [`A day later? ${m[1]} mg of caffeine, still in you.`, `A day later, ${m[1]} mg is still in you.`, `${m[1]} mg, still there a day later.`];
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
const ANSWER_FALLBACK = { single: ["That's one full day inside you.", 'Now you know where it goes.', 'One day, inside you.'], compare: ['Now you know the difference.', 'Now you know.'] } as const;
/** v19: the most words a line may have in each slot (short and spoken: a viewer hears it once). */
export const SLOT_WORDS: Record<NarrId, number> = { hook: 18, card: 16, beat: 12, setup: 14, tease: 12, climax: 14, twist: 15, payoff: 14, day: 6, answer: 14, loop: 5 };
/** v23 (editor: "filler lines add nothing"): lines that only restate the state the viewer already sees, with no new
 *  information (a card like this stays on screen but is not read; the lint flags any line like this). */
export const RESTATE: readonly RegExp[] = [
  /^There is still (?:some )?(?:alcohol|caffeine|sugar|fat|food) in (?:your blood|you)\.$/i, /^(?:Some of it|It) is still in (?:you|your blood)\.$/i,
  /^(?:A day later|Next day|One full day later|Twenty-four hours later|Fast forward a full day|And a whole day later\?|One day later)[.?]?$/i,
  /^(?:That's|That’s) one full day inside you\.$/i, /^Your stomach fills up\.$/i, /^One day, inside you\.$/i, /^Now you know where it goes\.$/i,
  /^(?:Look closely|Right inside you|All of this, inside you|Step by step|Here it goes|Watch it happen|Stay with it|Pretty wild|Look at it go|See it move\?)\.?$/i,
];
export const restates = (x: string) => RESTATE.some((re) => re.test(x.trim()));
/** v23: a clock time ("At 7 AM", "07:00"): the voice times everything from the first sip or bite instead */
export const CLOCK = /\b\d{1,2}(?::\d\d)?\s?(?:AM|PM)\b|\b\d\d:\d\d\b/;
/** v23: a line that says when the body has cleared it (the hook's answer for a drink: said one way only) */
export const CLEAR_TIME = /^(?!Half\b)(?:.*?)\b(?:gone|clear\w*|out of your blood|burns? it off|break it down)\b[^.]*\b\d+(?:[.,]\d+)?(?:–\d+)?\s*(?:hours?|minutes?|h)\b|\b\d+(?:–\d+)?\s*(?:hours?|h)\b[^.]*\b(?:to clear|cleared|gone|clear it|break it down|burns? it off|liver work)\b/i;
/** v23b (editor: "About three quarters of the caffeine remains." had no when): a line about what is still there says when */
export const STATE = /\b(?:remains?|still (?:in|there|working|here)|is left|left in you)\b/i;
export const ANCHOR = /\b(?:bedtime|morning|night|tonight|now|at \d|after|hours?|minutes?|later|by|until|day|in)\b/i;
export const unanchored = (x: string) => STATE.test(x) && !ANCHOR.test(x.replace(/\bstill in\b/gi, ''));
/** v23b: the time a moment is at, said from the first sip ("5 hours in, …"; bedtime and morning by name) */
export function whenLead(title: string, stop?: number): string {
  if (/bed/i.test(title)) return 'At bedtime, ';
  if (/morning/i.test(title)) return 'By morning, ';
  if (stop === undefined || stop < 5) return '';
  const [k, u] = timeAt(stop);
  return `${k} ${k === 1 ? u.replace(/s$/, '') : u} in, `;
}
/** v23b: the hook's question, when it asks how soon something happens (the model's peak time answers it) */
export const FAST_Q = /\b(?:how fast does it hit|when does (?:it|its caffeine) hit)\b/i;
/** v23: present-tense leads that tie a card to what is on screen right now (rising tension, before the peak) */
const RISE = ['Right now, ', 'Watch: ', 'Look, '] as const;
const PRESENT = /\b(?:is|are|leaves|reaches|climbs|passes|absorbs|starts|turns|filters|collects|burns|moves|enters|hits|takes)\b/;
/** v20: a card is read from this long after it comes up; a reading may start this much later (after the line before). */
export const CARD_LEAD_S = 0.15, CARD_DELAY_S = 2.5;
/** v20: exclamations in front of the climax card (calm ones for alcohol: never celebrated). */
const EXCL = { std: ['There it is.', 'Boom.', 'See that?', 'Right there.', 'Look at that.'], calm: ['There it is.', 'See that?', 'Right there.'] } as const;
const TEASE_LEAD = ['Stay with me.', 'Wait for it.', "Don't scroll yet.", 'Keep watching.', 'Hold on.'] as const;
const GUESS_TAIL = ['Guess now.', 'Lock it in.', 'Make your guess.', 'Pick one now.'] as const;
const REVEAL_LEAD = ['Called it?', 'Were you right?', 'Did you get it?'] as const;
/** v20: a short beat in a long moment (6.5 s or more), after its card: keeps the eyes on the body, says no number. */
export const BEAT = ['Watch it happen.', 'Look closely.', 'Keep your eyes on it.', 'See it move?', 'Right inside you.', 'All of this, inside you.', 'Watch this part.', 'Look at it go.',
  'Stay with it.', 'Step by step.', 'Here it goes.', 'Pretty wild.', 'Now notice this.'] as const;
const ORGAN_WORDS = ['hard at work', 'Watch your', 'right now'];
/** v21b: a comparison's own short beats (both bodies at once) */
export const CMP_BEAT = ['Keep an eye on both.', 'Two bodies, one clock.', 'Left and right, side by side.', 'Both at work.'] as const;
const isPoolBeat = (x: string) => (BEAT as readonly string[]).includes(x) || /^(Your [\w ]+, hard at work|Watch your [\w ]+ work|That's your [\w ]+, right now)\.$/.test(x); void ORGAN_WORDS;
export const BEAT_MIN_SPAN_S = 6.5, BEAT_EVERY_S = 4;
export const ORGANS = /\b(stomach|small intestine|large intestine|liver|kidneys|bladder|brain|heart|pancreas|gut)\b/i;
export const ORGAN_BEAT = [(o: string) => `Your ${o}, hard at work.`, (o: string) => `Watch your ${o} work.`, (o: string) => `That's your ${o}, right now.`];
/** A card whose subject leans on its title ("Half has moved on…" under IN YOUR STOMACH) is said with the title first. */
const VAGUE = /^(Half|Most|Almost|Nearly|Some|All|Much|Little|None|Less|More)\b/;
const lc1 = (s: string) => (/^[A-Z][a-z’']*\b/.test(s) && !/^I\b|^I[’']/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const cap1 = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** v21: "Cod: protein keeps arriving" (after a name and a colon, a sentence goes on in lower case; not "I" or a name). */
const lower1 = (s: string, names: readonly string[] = []) => (/^[A-Z][a-z’']*\b/.test(s) && !/^I\b|^I’|^I'/.test(s) && !names.some((nm) => nm && s.toLowerCase().startsWith(nm.toLowerCase())) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const words = (s: string) => s.toLowerCase().replace(/[’']/g, "'").split(/[^a-z0-9.']+/).map((w) => w.replace(/\.$/, '')).filter((w) => w.length > 2 || /\d/.test(w));
/** Every word (3+ letters) and number of `card` is in `said` (the card would only repeat what was just said). */
export const saidAlready = (card: string, said: string) => { const s = new Set(words(said)); const c = words(card); return c.length > 0 && c.every((w) => s.has(w)); };

/** v20: the story cards as they are on screen: one span per card (left and right for a comparison). */
export interface CardSpan { t0: number; t1: number; a: string; b: string; title: string; titleB: string; tease: boolean; /** the moment (min) */ stop?: number }
export function cardSpans(frames: NonNullable<NarrIn['plan']['frames']>): CardSpan[] {
  const out: CardSpan[] = [];
  for (const f of frames) {
    if (f.phase !== 'main') continue;
    const a = (f.cap ?? '').trim(), b = (f.capB ?? '').trim();
    if (!a && !b) continue;
    const l = out[out.length - 1];
    if (l && l.a === a && l.b === b && f.t - l.t1 < 0.1) { l.t1 = f.t + 1 / FPS; continue; }
    out.push({ t0: f.t, t1: f.t + 1 / FPS, a, b, title: (f.title ?? '').trim(), titleB: (f.titleB ?? '').trim(), tease: !!f.tease, stop: (f as { stop?: number }).stop });
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
/** v21: two lines say the same thing (3+ content words shared, most of them, on 4-letter stems; the hook's question is
 *  not repeated by its answer). */
const STOP = new Set("the and your you are was has have had its it’s it's this that these those there here now then than what with from into after about over still should will can one all see when does did just".split(' '));
const stems = (x: string) => new Set(x.toLowerCase().replace(/[^a-z'’ ]/g, ' ').split(/\s+/).filter((w) => w.length >= 3 && !STOP.has(w)).map((w) => w.slice(0, 4)));
export const repeats = (a: string, b: string) => {
  const A = stems(a), B = stems(b);
  if (!A.size || !B.size) return false;
  let n = 0; for (const w of A) if (B.has(w)) n++;
  return n >= 3 && n / (A.size + B.size - n) >= 0.5;
};
/** v21b: word variety. Within VARIETY_S no content word (4-letter stem; the food's own name aside) is said a third time. */
export const VARIETY_S = 15, VARIETY_MAX = 2;
/** v21b: the longest silence the planner leaves (the hush before an impact aside) */
export const GAP_FILL_S = 2.0;
/** v22: a number the hook card gave may be said again (as a fact) this long after it was last said */
export const RECALL_S = 20;
export const stemList = (x: string) => [...stems(x)];
/** The stems said too often in the window that ends at line `k` (of lines in time order). */
export function overused(lines: readonly { t: number; text: string }[], k: number, nameWords: Set<string> = new Set()): string[] {
  const c = new Map<string, number>();
  for (const l of lines) if (l.t <= lines[k].t + 1e-6 && l.t > lines[k].t - VARIETY_S) for (const w of stems(l.text)) if (!nameWords.has(w)) c.set(w, (c.get(w) ?? 0) + 1);
  return [...c].filter(([, v]) => v > VARIETY_MAX).map(([w]) => w);
}
const fresh = (out: readonly NarrLine[], x: string, t: number, nameWords: Set<string>) => {
  const win = out.filter((l) => l.t > t - VARIETY_S && l.t < t + VARIETY_S);
  return [...stems(x)].every((w) => nameWords.has(w) || win.filter((l) => stems(l.text).has(w)).length < VARIETY_MAX);
};
/** v21b: the same line said another way (numbers kept; a pronoun once the thing was just named). Each rule gives one
 *  variant; the original comes first. */
const VARY: [RegExp, string][] = [
  [/\byour blood sugar\b/gi, 'it'], [/\bblood sugar\b/gi, 'glucose'], [/\bIn your stomach: /g, ''], [/\byour stomach churns it\b/gi, 'it gets churned'],
  [/\bThe food is mostly in your stomach\b/g, 'Most of it sits in your stomach'], [/\bHalf leaves your stomach within\b/g, 'Half moves on within'],
  [/\balmost all has moved on by\b/gi, 'almost all is out by'], [/\bthe alcohol is gone\b/gi, 'it clears'], [/\bthe alcohol should be gone\b/gi, 'it should be cleared'],
  [/\bwhen it is finally gone\b/gi, 'when it finally clears'], [/\bThere is still alcohol in your blood\b/g, 'Some of it is still in you'],
  [/\bBlood alcohol is at its highest now\b/g, "It's at its highest now"], [/\bBlood fat is highest around now\b/g, 'Levels are highest around now'],
  [/\bThe fat joins your blood later\b/g, 'It joins your blood later'], [/\ball the fat\b/gi, 'all of it'], [/(?<!all )\bthe fat\b(?= [a-z])/gi, 'it'], [/\bfat takes\b/gi, 'it takes'],
  [/\bCaffeine in your blood peaks now\b/g, 'It peaks in your blood now'], [/\ball the caffeine\b/gi, 'all of it'], [/(?<!all )\bthe caffeine\b(?= [a-z])/gi, 'it'],
  [/\bteaspoons of sugar\b/gi, 'teaspoons'], [/\b(\d+) g of sugar: about\b/g, '$1 g: about'], [/\bStarch and sugar turn into blood sugar\b/g, 'Starch turns into glucose'],
  [/\bYour kidneys filter the extra water\b/g, 'The extra water gets filtered'], [/\bThe urine collects in your bladder\b/g, 'It collects in your bladder'],
  [/\bMost of the fiber is still in you\b/g, 'Most of it is still in you'], [/\bThe fiber reaches\b/g, 'It reaches'],
];
const capAfter = (x: string) => x.replace(/(^|[.?!]\s+)([a-z])/g, (_m, a: string, c: string) => a + c.toUpperCase());
export function variants(x: string): string[] {
  const out = [x];
  for (const [re, to] of VARY) {
    const y = x.replace(re, (m: string, ...g: unknown[]) => { const r = to.replace(/\$(\d)/g, (_q, d: string) => String(g[Number(d) - 1])); return /^[A-Z]/.test(m) ? cap1(r) : r; });
    if (y !== x) out.push(capAfter(y).replace(/\s{2,}/g, ' '));
  }
  return out;
}
/** The kinds of line that are fixed beats of the video (said as planned) */
const FIXED = new Set<NarrId>(['hook']);
/** v21b: a hook names the food before anything else (its first clause holds a word of the name). */
export function namesFirst(x: string, names: readonly string[]): boolean {
  const first = x.split(/[.?!:]/)[0] ?? '', w = stems(first);
  return names.some((nm) => stemList(nm).some((s) => w.has(s)));
}

/** v22: a fact that says how long the body needs to clear it (video-facts clearH, liverRate) */
const CLEARS = /\b(clear|burns? it off|break it down|liver work)\w*\b.*\bhours?\b|\bhours?\b.*\bclear/i;
/** The kinds of line that may not repeat an earlier one (the hook, the climax, the day and the loop lines are fixed beats). */
const DEDUP = new Set<NarrId>(['card', 'beat', 'tease']);

/** v23d: a line says a number an earlier line already said */
export const saysAgain = (x: string, said: readonly { text: string }[]) => qtyOf(x).some((v) => said.some((o) => qtyOf(o.text).includes(v)));
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
  type Cand = Omit<NarrLine, 'slotS' | 'say' | 'text'> & { until: number; delay: number; options: readonly string[]; /** v22: tried first */ pref?: readonly string[]; /** v23b: said even if a word repeats */ must?: boolean };
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
  // v21b (review: "What is left of it a day later?" before the food was named): every hook names the food first.
  // A question over the name is said name first; else "Ham sub: what is left of it a day later?"; a pool line too.
  // (the name without its amount: "1 slice of pizza with salami" → "Pizza with salami"; the amount is on the hook card)
  const bare = (x: string) => cap1(x.trim().replace(/^[\d½.,]+\s+(?:(?:ml|g|l|cl|oz|slices?|pieces?|cups?|glass(?:es)?|cans?|bottles?|bowls?|servings?|portions?|shots?|scoops?|handfuls?)\s+of\s+)?/i, '').replace(/\s+\d+(?:[.,]\d+)?\s*%\.?$/, ''));
  const named = (cmp ? (n.names ?? ['', '']) : [n.name ?? '']).map(bare).filter((x) => x && (cmp ? !/\d\s*(?:ml|g|l|oz|×|x)\b/i.test(x) : !/\d/.test(x))); // (v22: a comparison keeps "2% milk")
  // v22: a comparison's hook names BOTH foods first ("Cod or muffin: which leaves first?", "Cod versus muffin: …")
  const lead = cmp ? (named.length === 2 ? `${named[0]} ${n.guess ? 'or' : 'versus'} ${lower1(named[1])}` : '') : (named[0] ?? '').split(/ with | in /)[0];
  const nameFirst = (x: string) => !lead || (cmp ? named.every((nm) => namesFirst(x, [nm])) : namesFirst(x, named));
  const q = [h1, h2].find((x) => /\?$/.test(x)) ?? '';
  const st = [h1, h2].find((x) => ends(x) && !/\?$/.test(x)) ?? '';
  for (const x of [...hookOpts]) if (!nameFirst(x)) {
    const i = hookOpts.indexOf(x);
    if (st && q && x === `${q} ${st}` && nameFirst(st)) hookOpts.splice(i, 1, `${st} ${q}`);
    else hookOpts.splice(i, 1);
  }
  const qq = cmp && n.guess ? cap1(h1.replace(/^Guess:\s*/i, '')) : q;
  if (lead && qq && ends(qq)) hookOpts.push(`${lead}: ${lower1(qq, named)}`); // (the names make it long enough: the screen says "Guess")
  if (st && nameFirst(st) && !hookOpts.includes(st)) hookOpts.push(st);
  // v23: the arc's curiosity line between the food and the hook card's question ("150 ml of red wine. Your liver can't
  // rush it. When is the alcohol gone?"), else after the hook card's statement; tried first (the plain hook card after)
  // (before a question, the name without its amount, "Red wine.": the hook card shows the amount; a statement hook keeps its number)
  const arcHead = q && lead ? `${cap1(lead)}.` : st && nameFirst(st) ? st : lead ? `${cap1(lead)}.` : '';
  // (not one that repeats a phrase of the question: "Watch your blood sugar … How high does your blood sugar go?")
  const pairs = (x: string) => { const w = x.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean); return w.slice(1).map((y, i) => `${w[i]} ${y}`); };
  const arcHook = !cmp && n.arc && arcHead ? n.arc.hook.filter((x) => !(q && /\?$/.test(x)) && !pairs(x).some((p) => pairs(`${q} ${arcHead}`).includes(p))).map((x) => (q ? `${arcHead} ${x} ${q}` : `${arcHead} ${x}`)) : [];
  hookOpts.unshift(...arcHook);
  // (chosen here: the cards after it skip what it said; it is the first line, so its window is known)
  const hookPool = [pick(hookSet, s, 1), ...hookSet].map((x) => (lead ? `${lead}: ${lower1(x, named)}` : x));
  // v21c: the hook card's question is always said (options with it first)
  const hasQ = (x: string) => !!qq && x.toLowerCase().includes(qq.toLowerCase().replace(/^which|^how|^what|^when|^where|^does|^is/, '').slice(0, 20));
  hookOpts.sort((a, b) => Number(hasQ(b)) - Number(hasQ(a)));
  const hookAll = [...hookOpts, ...hookPool, ...(lead ? [`${cap1(lead)}.`] : [])];
  // (v23: an arc hook only when the first card can still be read after it, before the hush of the first impact)
  const sp0 = n.plan.frames ? cardSpans(n.plan.frames).find((x) => x.t0 > hookT && !saidAlready(x.a || x.b, `${h1} ${h2}`)) : undefined, imp0 = impacts[0] ?? Infinity;
  const roomy = (x: string) => !arcHook.includes(x) || !sp0 || (hookT + speakS(x) + GAP_S <= sp0.t0 + CARD_LEAD_S + CARD_DELAY_S && hookT + speakS(x) + GAP_S + speakS(sp0.a || sp0.b || 'x') <= imp0 - IMPACT_PRE_S);
  const hookText = hookAll.find((x) => speakS(x) <= clearSlot(hookT, hookT + 6.5) && wordsOf(x) <= SLOT_WORDS.hook && roomy(x)) ?? '';
  cands.push({ id: 'hook', t: hookT, until: hookT + 6.5, delay: 0, options: hookText ? [hookText] : [], source: `${h1} ${h2}${cmp ? ` ${named.join(' ')}` : ''}${arcHook.includes(hookText) ? ` ${n.arc!.hook.join(' ')}` : ''}`.trim() });
  // 2. the story cards, read as they come up (the hook's own words are not read twice)
  const spans = n.plan.frames ? cardSpans(n.plan.frames) : [];
  const names = n.names ?? ['', ''];
  const spoken = hookOpts.includes(hookText) ? hookText : '';
  let prevA = '', prevB = '';
  // short beats, each video's own order, none twice in a row
  let nBeat = 0;
  // v21c (review: "gap-filler lines must be data-specific, never generic"): the fillers are this food's facts (its
  // numbers, video-facts.ts), each said once, none whose numbers the screen already shows; no generic beat
  const screenNums = new Set([h1, h2, ...spans.flatMap((x) => [x.a, x.b]), n.hero ? `${n.hero.big} ${n.hero.small}` : ''].flatMap((x) => qtyOf(x)));
  // (v22: a fact without a number, "No sugar, no alcohol, no caffeine.", is always new)
  const facts = (n.facts ?? []).filter((f) => !qtyOf(f).length || qtyOf(f).some((x) => !screenNums.has(x)));
  // v22: the facts whose numbers the screen showed (a callback, much later: RECALL_S after the number was last shown or said)
  const recall = (n.facts ?? []).filter((f) => !facts.includes(f));
  // v23: time references said one way (a clear-time card on screen answers the hook: no other clearing time; no clock
  // times), no fact that the twist says, no line that only restates; the arc's setup (the striking number) leads
  const twistL = !cmp ? (n.arc?.twist ?? []).filter((x) => !spans.some((sp) => repeats(x, sp.a) || (/coffee/i.test(x) && /coffee/i.test(sp.a)) || (/speed/i.test(x) && /speed/i.test(sp.a)) || (/sleep/i.test(x) && /sleep/i.test(sp.a)))) : [];
  const clearCard = spans.some((x) => CLEAR_TIME.test(x.a) || CLEAR_TIME.test(x.b)), twistQ = new Set(twistL.flatMap((x) => qtyOf(x)));
  const dropF = (x: string) => (clearCard && CLEAR_TIME.test(x)) || CLOCK.test(x) || restates(x) || qtyOf(x).some((v) => twistQ.has(v));
  for (const xs of [facts, recall]) for (let i = xs.length - 1; i >= 0; i--) if (dropF(xs[i])) xs.splice(i, 1);
  const setupL = !cmp && n.arc ? n.arc.setup.filter((x) => !dropF(x)) : [];
  facts.unshift(...setupL);
  let nRise = 0;
  // v23b (editor: "the hook asks and it is never answered"): the moment that answers the hook's question is always said
  const qHook = !cmp && /\?/.test(`${h1} ${h2}`), payT = (n.hook?.payoff ?? n.hook?.extra?.title ?? '').toLowerCase();
  const paySpan = qHook && payT ? spans.find((x) => x.title.toLowerCase() === payT && !!x.a && /[.?!]$/.test(x.a) && !restates(x.a) && !CLOCK.test(x.a)) : undefined;
  // v23b: the setup is its own line, right after the hook, before the first card ("1 standard drink: 16 g, 127 kcal.")
  const hookNums = new Set(qtyOf(hookText)), hookEnd = hookT + speakS(hookText) + GAP_S;
  const setupNew = setupL.filter((x) => !qtyOf(x).some((v) => hookNums.has(v)));
  const nextSp = spans.find((x) => x.t0 + CARD_LEAD_S + CARD_DELAY_S > hookEnd && !!x.a && !saidAlready(x.a, `${h1} ${h2}`));
  // (a "127 kcal in total." card right after the hook is said inside the setup: "1 standard drink: 16 g, 127 kcal."; the
  // card stays on screen)
  const kcalLead = !!nextSp && /^\d+ kcal in total\.$/.test(nextSp.a) && setupNew.some((x) => qtyOf(x).some((v) => qtyOf(nextSp.a).includes(v)));
  const sp2 = kcalLead ? spans[spans.indexOf(nextSp!) + 1] : nextSp;
  if (setupNew.length && nextSp && sp2 && (peak === undefined || nextSp.t0 < peak)) cands.push({ id: 'setup', t: hookEnd, until: Math.min(sp2.t0 + CARD_LEAD_S + CARD_DELAY_S, (impacts.find((p) => p > sp2.t0) ?? Infinity) - IMPACT_PRE_S - speakS(sp2.a || 'x')) - GAP_S, delay: 0.6, options: kcalLead ? [...setupNew.filter((x) => qtyOf(x).some((v) => qtyOf(nextSp.a).includes(v))), ...setupNew] : setupNew, source: '' });
  let shortTwist = false, shortFast = false;
  // (v23c: "how high?" answered at the peak itself, "… climbs to its peak. Up 26–60 %.", so a Shorts cut keeps room for its twist)
  const hiAt = qHook && /how high/i.test(`${h1} ${h2}`) && n.hero && /^Blood sugar up/.test(n.hero.big) ? /\+?(\d+)–(\d+) %/.exec(n.hero.small) : null;
  // v23b: "how fast does it hit?" is answered at the peak itself, with the model's time ("There it is. Your blood sugar peaks about 25 minutes after the first sip.")
  const fastQ = qHook && FAST_Q.test(`${h1} ${h2}`) && n.arc?.fast ? n.arc.fast : '';
  // (said at the peak only when the peak is that one: blood sugar for a sugar peak, caffeine for a caffeine peak)
  const fastShort = fastQ ? n.arc?.fastShort ?? '' : '', peakShort = fastShort ? `Peak: ${lc1(fastShort).replace(/ after the first (?:sip|bite)\.$/, ' in.')}` : '';
  const fastAtPeak = (card: string) => !!fastShort && ((/sugar/i.test(card) && /sugar/i.test(fastQ)) || (/caffeine/i.test(card) && /caffeine/i.test(fastQ)));
  const shortCut = n.plan.seconds < 35;
  const late = (n.lateFacts ?? []).filter((f) => qtyOf(f).some((x) => !screenNums.has(x))), reveal0 = peak ?? Infinity;
  // (a difference that cannot give the guess away may come before the answer: "Butter has 12 g more fat" when the
  // question is which raises blood sugar more)
  const subject = `${h1} ${h2}`.toLowerCase();
  const spoils = (x: string) => !n.guess ? false : /stomach|first|leaves/.test(subject) ? /stomach|half (is )?(through|out|gone)|minutes/i.test(x) : /sugar|sweet|rise/.test(subject) ? /sugar|carb|teaspoon|glucose|glycemic/i.test(x)
    : /calorie|kcal|energy/.test(subject) ? /kcal/i.test(x) : /caffeine/.test(subject) ? /caffeine/i.test(x) : /alcohol/.test(subject) ? /alcohol/i.test(x)
    : /fat/.test(subject) ? /fat/i.test(x) : /protein/.test(subject) ? /protein/i.test(x) : late.includes(x);
  // (v21c: no fact that gives the guess away before the answer: "Blueberries: half is out in 87 minutes" before "which leaves first?")
  // v22: a single whose hook asks how long it stays does not hear the clearing time before the card that answers it
  const answerCard = !cmp && /how long|out of your blood|stay/.test(subject) ? spans.find((x) => /\d/.test(x.a) && /gone|clear|out of your blood/i.test(x.a))?.t0 ?? dayCue ?? outro : -Infinity;
  const revealOf = (x: string) => (spoils(x) ? reveal0 : CLEARS.test(x) ? answerCard : -Infinity);
  facts.push(...late);
  // v22: a comparison's contrasts (both names, one number each: "Sugar: cod none, muffin 57 g."); one is said instead of a
  // "Same amount" card (the screen shows it), so every cut has a fact for each side
  const contrasts = cmp ? facts.filter((f) => names.every((nm) => !!nm && f.toLowerCase().includes(nm.toLowerCase()))) : [];
  const beats = (_about = '') => { void _about; const k = facts.length ? nBeat++ % facts.length : 0; return [...facts.slice(k), ...facts.slice(0, k)]; };
  spans.forEach((sp, i) => {
    const nx = spans[i + 1], until = Math.min(sp.t1 + 0.3, nx ? nx.t0 - GAP_S : Infinity);
    // (a card that comes up in the hush before an impact, or on it, is read after the impact's own line)
    const hit = impacts.find((p) => sp.t0 + CARD_LEAD_S >= p - IMPACT_PRE_S && sp.t0 + CARD_LEAD_S < p + IMPACT_POST_S);
    const t = hit !== undefined ? hit + IMPACT_POST_S + 0.1 : sp.t0 + CARD_LEAD_S, late = hit !== undefined ? 99 : CARD_DELAY_S;
    // a long moment gets a short beat after its card
    if (sp.t1 - sp.t0 >= BEAT_MIN_SPAN_S) cands.push({ id: 'beat', t: Math.max(t, sp.t0 + 3.2), until: sp.t1 - 0.2, delay: 99, options: beats(`${sp.title} ${sp.a} ${sp.b}`), source: '' });
    // v21: a stretch with no card after this one (the bodies just move on) gets a short beat, not silence
    if (nx && nx.t0 - sp.t1 >= 3) cands.push({ id: 'beat', t: sp.t1 + 0.3, until: nx.t0 - GAP_S, delay: 99, options: beats(`${sp.title} ${sp.a} ${sp.b}`), source: '' });
    const atPeak = !cmp && peak !== undefined && sp.t0 <= peak + 0.5 && sp.t1 > peak + 0.5;
    if (!cmp) {
      // v23: a card that only restates the state, or tells the time by the clock, is not read (it stays on screen): the
      // arc's twist takes its place after the peak, else a fact
      if (sp.a && (restates(sp.a) || CLOCK.test(sp.a))) {
        const tw = peak !== undefined && (sp.t0 > peak || shortCut) && twistL.length > 0; // (v23c: a Shorts cut takes its twist where it can)
        cands.push({ id: tw ? 'twist' : 'beat', t, until: tw ? Math.max(sp.t1 - 0.2, nx ? nx.t0 - GAP_S : until) : sp.t1 - 0.2, delay: 1.5, options: tw ? [...twistL].sort((p, q) => speakS(p) - speakS(q)) : beats(), source: '' });
        return;
      }
      if (!sp.a || saidAlready(sp.a, spoken)) { if (sp.t1 - sp.t0 >= 2.5 && sp.t1 - sp.t0 < BEAT_MIN_SPAN_S) cands.push({ id: 'beat', t, until: sp.t1 - 0.2, delay: 99, options: beats(), source: '' }); return; }
      const said = cardSaid(sp.a, sp.title);
      if (!said.length) return;
      if (atPeak) {
        const tp = peak! + IMPACT_POST_S + 0.05, ex = EXCL[calm ? 'calm' : 'std'];
        cands.push({ id: 'climax', t: tp, until, delay: 0.3, options: [...(fastAtPeak(sp.a) ? said.map((x) => `${x} ${fastShort}`) : []), ...(hiAt && /sugar/i.test(sp.a) ? said.map((x) => `${x} Up ${hiAt[1]}–${hiAt[2]} %.`) : []), ...said.map((x) => `${pick(ex, s, 2)} ${x}`), ...said, pick(CLIMAX[ck], s, 2), ...CLIMAX[ck]], source: `${sp.title} ${sp.a} ${fastShort} ${hiAt ? `${n.hero!.big} ${n.hero!.small}` : ''}`, card: sp.a, side: 0 });
        return;
      }
      if (sp.tease) { cands.push({ id: 'tease', t, until, delay: late, options: [`${pick(TEASE_LEAD, s, 3)} ${sp.a}`, sp.a, pick(TEASE, s, 3)], source: sp.a, card: sp.a, side: 0 }); return; }
      const isPay = sp === paySpan;
      if (kcalLead && sp === nextSp) return;
      // v23b: a Shorts cut with "how fast?" answers before the peak, in place of a lower-value card (no room after it)
      if (shortCut && fastQ && !shortFast && i > 0 && !isPay && peak !== undefined && sp.t1 < peak) {
        shortFast = true;
        cands.push({ id: 'payoff', t, until, delay: late, options: [fastQ, peakShort], source: `${fastQ} ${peakShort}`, must: true });
        return;
      }
      // v23b: a Shorts cut trims a lower-value card after the peak to make room for the twist (the card stays on screen)
      if (shortCut && !isPay && !shortTwist && twistL.length && peak !== undefined && sp.t0 > peak + ((fastQ && !spans.some((x) => x.t0 <= peak + 0.5 && x.t1 > peak + 0.5 && fastAtPeak(x.a))) || (/how high/i.test(`${h1} ${h2}`) && !hiAt) ? 6 : 0)) {
        shortTwist = true;
        cands.push({ id: 'twist', t, until: nx ? nx.t0 - GAP_S : until + 3, delay: 1.5, options: twistL, source: '' });
        return;
      }
      // (a card the headline already shows is read, but not captioned and not hidden: the screen already says it)
      const onTop = saidAlready(sp.a, `${h1} ${h2}`);
      // v23: the payoff, timed from the first sip ("From your first sip, the alcohol is gone after about 1–4 hours."); a
      // card before the peak in the present tense, tied to the screen ("Watch: half leaves your stomach …"), twice at most
      const pay = CLEAR_TIME.test(sp.a) && !/first (?:sip|bite)/i.test(sp.a) ? said.map((x) => `${n.solid ? 'From your first bite' : 'From your first sip'}, ${lc1(x)}`) : [];
      const rise = !pay.length && i > 0 && nRise < 2 && peak !== undefined && sp.t0 < peak && PRESENT.test(sp.a) && !VAGUE.test(sp.a) && !/^(?:Right now|Watch|Look)\b/i.test(sp.a) ? said.map((x) => `${pick(RISE, s, 10 + nRise)}${lc1(x)}`) : [];
      if (rise.length) nRise++;
      // v23b: a state line says when ("5 hours in, about three quarters of the caffeine remains.")
      const wl = unanchored(sp.a) ? whenLead(sp.title, sp.stop) : '';
      const anch = wl ? said.map((x) => `${wl}${lc1(x)}`) : [];
      // v23d: a card whose numbers the hook said in part says only the rest ("Plus 32 mg of caffeine.")
      const parts = sp.a.replace(/\.$/, '').split(/,\s+/), fresh1 = parts.filter((x) => !qtyOf(x).some((v) => hookNums.has(v)));
      const plus = fresh1.length && fresh1.length < parts.length && fresh1.every((x) => qtyOf(x).length > 0) ? [`Plus ${lc1(fresh1.join(', '))}.`] : [];
      cands.push({ id: 'card', t, until: isPay ? Math.max(until, sp.t1 + 0.3) : until, delay: isPay ? 99 : late, options: [...pay, ...anch, ...rise, ...(wl ? [] : said), ...plus, ...beats(), ...(isPay && wl ? said : [])], source: `${sp.title} ${sp.a} ${wl}`, ...(onTop ? {} : { card: sp.a, side: 0 as const }), ...(isPay ? { must: true } : {}) });
      return;
    }
    // comparison: a card both sides show is said once; the two names as "Left: … Right: …"; else each side whose card
    // changed, with its name first ("Cola: Your blood sugar climbs to its peak.")
    const a = sp.a, b = sp.b, newA = !!a && a !== prevA, newB = !!b && b !== prevB;
    prevA = a; prevB = b;
    // (v23: a clock-time or restating card is not read in a comparison either)
    const quiet = (x: string) => CLOCK.test(x) || restates(x);
    if (a && a === b) {
      if (!saidAlready(a, spoken) && ends(a) && !quiet(a)) cands.push({ id: sp.tease ? 'tease' : 'card', t, until, delay: late, options: sp.tease ? [`${pick(TEASE_LEAD, s, 3)} ${a}`, a, pick(TEASE, s, 3)] : (() => { const wl = unanchored(a) ? whenLead(sp.title, sp.stop) : '', aa = wl ? `${wl}${lc1(a)}` : a; return [...(a.includes(':') ? [] : [`Both: ${lower1(aa)}`]), aa, ...beats()]; })(), source: `${a} ${unanchored(a) ? whenLead(sp.title, sp.stop) : ''}`, card: a, side: 2, ...(/^Same amount\b/i.test(a) ? { pref: contrasts.filter((x) => !spoils(x)) } : {}) });
      return;
    }
    const isName = (x: string, nm: string) => !!nm && x.replace(/\.$/, '').toLowerCase() === nm.toLowerCase();
    if (newA && newB && isName(a, names[0]) && isName(b, names[1])) { cands.push({ id: 'card', t, until, delay: late, options: [`Left: ${a} Right: ${b}`], source: `${a} ${b}` }); return; } // (the names are on screen: no caption)
    const side = (x: string, nm: string, title: string, k: 0 | 1, tt: number, delay: number) => {
      if (!ends(x) || quiet(x)) return;
      // (v23b: a state card says when, "Cola: at bedtime, almost all the caffeine is still in you.")
      const wl = unanchored(x) ? whenLead(title, sp.stop) : '', an = (y: string) => (wl ? `${wl}${lc1(y)}` : y);
      const said = cardSaid(x, title).map(an), who = x.toLowerCase().includes(nm.trim().toLowerCase()) ? '' : cap1(nm.trim());
      cands.push({ id: 'card', t: tt, until, delay, options: [...(who ? [`${who}${x.includes(':') ? ',' : ':'} ${lower1(an(x), names)}`, ...said.map((y) => `${who}${y.includes(':') ? ',' : ':'} ${lower1(y, names)}`)] : said), ...beats()], source: `${title} ${x} ${who} ${wl}`, ...(isName(x, nm) || saidAlready(x, spoken) ? {} : { card: x, side: k }) });
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
  // v23b: a hook that asks how soon gets the model's time, right after the peak ("It peaks about 25 minutes after the first sip.")
  // (and "how high?" the end card's rise, said at the peak: "At its peak, blood sugar is up 26–60 %.")
  const hi = qHook && /how high/i.test(`${h1} ${h2}`) && n.hero && /^Blood sugar up/.test(n.hero.big) ? /\+?(\d+)–(\d+) %/.exec(n.hero.small) : null;
  if (hi && peak !== undefined) cands.push({ id: 'payoff', t: peak + IMPACT_POST_S + 2.2, until: peak + 12, delay: 6, options: [`At its peak, blood sugar is up ${hi[1]}–${hi[2]} %.`, `Blood sugar: up ${hi[1]}–${hi[2]} %.`], source: `${n.hero!.big} ${n.hero!.small}`, must: true });
  if (fastQ && peak !== undefined) cands.push({ id: 'payoff', t: peak + IMPACT_POST_S + 2.2, until: peak + 12, delay: 6, options: [fastQ, peakShort], source: `${fastQ} ${peakShort}`, must: true });
  // 4. the 24 h beat (the lights come on): single only (a comparison's verdict impact lands there)
  // (v23: a single has no "A day later." line: it only restated the clock; its pause goes to a fact)
  if (!cmp && lights !== undefined && !n.arc) { const t = lights - 0.25; cands.push({ id: 'day', t, until: Math.min(outro, (dayCue ?? outro) + 0.6) - GAP_S, delay: 0.3, options: [pick(DAY, s, 4), ...DAY], source: '' }); }
  // 5. the end card: its one number (single), else a number-free close; then the loop line, ending on the last frame
  const heroL = !cmp ? heroLines(n.hero, n.alcohol) : [];
  // v23: a number-free close (no "A day later." before it any more) starts before the end card, so the loop line fits
  // (also when the end card's number cannot be said in the time the end card has: then the close says no number)
  const heroFits = heroL.some((x) => /\d/.test(x) && speakS(x) <= end - TAIL_S - outro - 0.3 && !(!cmp && qtyOf(x).some((v) => hookNums.has(v))));
  const early = !cmp && !!n.arc && !heroFits, ansT = early ? outro - 2.6 : outro + 0.25;
  // v23: when the close says the end card's number, the lights' moment sets it up (a question it answers, never "A day later.")
  if (!cmp && n.arc && !early && lights !== undefined) {
    const lead = /still in your body/.test(n.hero?.small ?? '') ? ['And a day later?', 'What is left now?'] : ['So, the big number?', 'The verdict?'];
    cands.push({ id: 'day', t: lights - 0.8, until: outro - GAP_S, delay: 0.8, options: lead, source: '' });
  }
  // v21c: a comparison closes on its verdict ("Cod wins: no blood sugar peak, 486 fewer kcal."), else its first clause
  const vd = (n.verdict ?? '').replace(/^[^A-Za-z0-9]+/, '').trim(), vd1 = /^([^:;]+?)[:;]/.exec(vd)?.[1];
  const verdictL = cmp && /[.!]$/.test(vd) ? [vd, ...(vd1 && /\bwins?\b/.test(vd1) ? [`${vd1}.`] : [])] : [];
  cands.push({ id: 'answer', t: ansT, until: early ? end - TAIL_S - 1.6 : end, delay: early ? 2.2 : 0.6, options: [...heroL.filter((x) => !early || !/\d/.test(x)), ...verdictL, ...(cmp ? ANSWER_FALLBACK.compare : [...(n.arc?.answer ?? []), n.solid ? 'Every bite, accounted for.' : 'Every sip, accounted for.'])], source: heroL.length && n.hero ? `${n.hero.big} ${n.hero.small}` : verdictL.length ? vd : '' });
  const lp = LOOP[n.solid ? 'bite' : 'sip'];
  cands.push({ id: 'loop', t: ansT + 0.01, until: end, delay: 99, options: !cmp && n.arc ? [...n.arc.loop, ...lp] : [pick(lp, s, 5), ...lp], source: '' });
  // place them: time order, none over the next, each in its own window
  cands.sort((p, q) => p.t - q.t);
  const out: NarrLine[] = [];
  const isFact = (x: string) => facts.some((f) => f === x || variants(f).includes(x));
  const filler = (x: string) => isPoolBeat(x) || isFact(x);
  const nameWords = new Set((cmp ? names : [n.name ?? '']).flatMap((x) => stemList(x)));
  let free = 0, lastBeat = -Infinity;
  for (const c of cands) {
    const t = Math.max(c.t, free);
    if (t - c.t > c.delay + 1e-6) continue;
    if (c.id === 'beat' && t - lastBeat < BEAT_EVERY_S) continue;
    const slot = clearSlot(t, c.until);
    // v21: no line that says again what an earlier one said ("Don't drive after drinking." … "Never drink and drive.")
    const ok = (x: string) => speakS(x) <= slot && wordsOf(x) <= SLOT_WORDS[c.id] && (cmp || !DEDUP.has(c.id) || !out.some((o) => o.id !== 'hook' && repeats(x, o.text)))
      && !(/\bdriv/i.test(x) && out.some((o) => /\bdriv/i.test(o.text))) // (the driving warning: said once)
      && !(c.id === 'answer' && out.length > 0 && [...stems(x)].filter((w) => stems(out[out.length - 1].text).has(w)).length >= 2) // (v21b: not "One full day later. That's one full day…")
      && !(isFact(x) && t < revealOf(x)) // (a fact that would give the answer away: after it)
      && !(!cmp && c.id !== 'hook' && saysAgain(x, out)) // (v23d: no number twice in one video)
      && !(c.id !== 'hook' && filler(x) && qtyOf(x).length > 0 && qtyOf(x).every((v) => out.some((o) => qtyOf(o.text).includes(v)))) // (no number twice)
      && !(c.id === 'payoff' && out.some((o) => /peak/i.test(o.text) && qtyOf(o.text).some((v) => qtyOf(x).includes(v)))) // (the peak already said it)
      && !(c.id === 'twist' && (out.some((o) => o.id === 'twist') || (qtyOf(x).length > 0 && qtyOf(x).every((v) => out.some((o) => qtyOf(o.text).includes(v))))))
      && !(filler(x) && (out.some((o) => o.text === x) || (out.length >= 2 && out.slice(-2).every((o) => filler(o.text))))); // (v21b: no filler twice, never 3 in a row)
    // v21b: word variety: no content word a third time within VARIETY_S (a line is said another way, else the next option)
    // (every option as written first; the other wordings after them, so a pronoun is used only when it must be)
    const own = c.options.filter((x) => !filler(x));
    // (v21c: the card said another way comes before any filler)
    // (v23: the setup, the striking number, before the first impact, once)
    const setupFirst = c.id === 'beat' && (peak === undefined || t < peak) && !out.some((o) => setupL.includes(o.text)) ? setupL : [];
    const opts = c.id === 'answer' ? [...c.options] : [...setupFirst, ...(c.pref ?? []), ...own, ...own.filter((x) => !fastQ || (!x.includes(fastQ.slice(0, -1)) && !(fastShort && x.includes(fastShort)))).flatMap((x) => variants(x).slice(1)), ...c.options.filter(filler)]; // (the closing line is said as written)
    const text = (FIXED.has(c.id) ? undefined : opts.find((x) => ok(x) && fresh(out, x, t, nameWords))) ?? (c.id === 'climax' || c.id === 'answer' || c.id === 'day' || c.id === 'loop' || c.must || FIXED.has(c.id) ? c.options.find(ok) : undefined);
    if (!text) continue;
    // (a line from a pool has no on-screen source: it says no number)
    const fromPool = (c.id === 'answer' && !heroL.some((h) => variants(h).includes(text)) && !verdictL.includes(text)) || (c.id === 'hook' && !hookOpts.includes(text)) || (c.id === 'climax' && !c.card && cmp && !text.endsWith((n.answer ?? '').trim() || '\u0000'));
    const { until: _u, delay: _d, options: _o, pref: _p, must: _m, card, side, ...rest } = c; void _u; void _d; void _o; void _p; void _m;
    // (a pool line instead of the card: the card stays on screen, and the line has no on-screen source)
    const reads = !!card && card.split('|').every((x) => variants(x).some((v) => text.toLowerCase().includes(v.slice(1).toLowerCase())));
    out.push({ ...rest, ...(reads ? { card, side } : {}), t, slotS: slot, text: shownText(text), say: speakable(text), source: isFact(text) || c.id === 'twist' || c.id === 'payoff' || c.id === 'setup' || (!!fastQ && text.includes(fastQ.slice(0, -1))) ? text : fromPool || (card && !reads && !/^Plus /.test(text)) ? '' : c.source });
    free = t + speakS(text) + GAP_S;
    if (c.id === 'beat') lastBeat = t;
  }
  // v21b: no silence over GAP_FILL_S (but the hush before an impact): a short beat in the middle of it
  const hushed = (a: number, b: number) => impacts.some((p) => a < p + IMPACT_POST_S + 0.6 && b > p - IMPACT_PRE_S);
  // (the end card's number is said at the end: no callback to it just before)
  let recalled = 0;
  const heroSaid = new Set(out.filter((o) => o.id === 'answer').flatMap((o) => qtyOf(o.text)));
  for (let i = 0, guard = 0; i < out.length && guard < 40; i++) {
    const e = out[i].t + speakS(out[i].text), nx = Math.min(out[i + 1]?.t ?? outro, outro);
    // (a single: only a longer silence; a third fact in a row only for a pause the voice could not bridge otherwise)
    // v22: the threshold leaves room for a voice a little faster than WPS (the sweeps: no silence over 3 s)
    const pool = (l?: NarrLine) => !!l && filler(l.text);
    if (e >= outro - 0.5 || nx - e <= GAP_FILL_S - (cmp ? 0.4 : 0) - 0.1 * speakS(out[i].text) || hushed(e, nx) || ((pool(out[i]) || pool(out[i + 1])) && (pool(out[i - 1]) || pool(out[i + 1]) && pool(out[i])) && nx - e <= 2.4)) continue;
    const t = e + Math.min(0.3, (nx - e) / 4), slot = Math.min(clearSlot(t, nx - GAP_S), nx - GAP_S - t);
    // v22: a fact a later pause got may move up to this one (that later pause is filled in its turn)
    const movable = (o: NarrLine, j: number) => j > i && o.id === 'beat' && o.t > t + 4;
    const prevBeat = out.filter((o, j) => !movable(o, j)).map((o) => o.text);
    // (the one that fills the pause best)
    const fitsAny = (x: string) => speakS(x) <= slot && !(!cmp && saysAgain(x, out)) && !(/\bdriv/i.test(x) && out.some((o) => /\bdriv/i.test(o.text))) && !prevBeat.includes(shownText(x)) && fresh(out, x, t, nameWords) && !(t < revealOf(x));
    const fits = (x: string) => fitsAny(x) && !(!cmp && saysAgain(x, out)) && !out.some((o) => o.id !== 'hook' && repeats(x, o.text)) && wordsOf(x) <= SLOT_WORDS.beat; // (v23: a filler's own length limit, too)
    // v23: after the peak, the arc's twist first (once); before it, the setup first
    const tw = twistL.length && !out.some((o) => o.id === 'twist') && peak !== undefined && (t > peak + IMPACT_POST_S || (n.plan.seconds < 35 && t > hookEnd)) && t < outro - 1
      ? twistL.find((x) => fitsAny(x) && wordsOf(x) <= SLOT_WORDS.twist && speakS(x) >= slot - (n.plan.seconds < 35 ? 2.6 : 2) && !(qtyOf(x).length > 0 && qtyOf(x).every((v) => out.some((o) => qtyOf(o.text).includes(v))))) : undefined;
    // (v23b: "how fast?" not answered yet: the model's peak time first, in any pause it fits)
    const pf = fastQ && !out.some((o) => /peak|after the first/i.test(o.text) && qtyOf(o.text).some((v) => qtyOf(fastQ).includes(v))) ? [fastQ, peakShort].find((x) => fitsAny(x)) : undefined;
    if (pf) { out.splice(i + 1, 0, { id: 'payoff', t, slotS: slot, text: shownText(pf), say: speakable(pf), source: pf }); guard++; continue; }
    if (tw) { out.splice(i + 1, 0, { id: 'twist', t, slotS: slot, text: shownText(tw), say: speakable(tw), source: tw }); guard++; continue; }
    const pre = peak === undefined || t < peak;
    const text = beats().sort((p, q) => (pre ? Number(setupL.includes(q)) - Number(setupL.includes(p)) : 0) || speakS(q) - speakS(p)).find((x) => fits(x)
      && !(qtyOf(x).length > 0 && qtyOf(x).every((v) => out.some((o, j) => !movable(o, j) && qtyOf(o.text).includes(v)))))
      // v22: else a callback to a number the hook card gave (its fact said in full: "Water in it: 250 ml."), when
      // nothing has said that number for RECALL_S and no other fact of this food is left
      ?? [...recall, ...facts].filter((x) => recalled < 2 && !out.some((o) => repeats(x, o.text) || (o.id === 'beat' && o.t > t - 2 * RECALL_S + 10 && qtyOf(o.text).some((v) => qtyOf(x).includes(v)))) && qtyOf(x).length > 0 && !qtyOf(x).some((v) => heroSaid.has(v)) && !out.some((o) => o.id === 'setup' && saidAlready(x, o.text)) && !out.some((o) => o.t > t - (t > outro - 10 ? RECALL_S / 2 : RECALL_S) && qtyOf(o.text).some((v) => qtyOf(x).includes(v)))).sort((p, q) => speakS(q) - speakS(p)).find(fits);
    // v23d: else a number-free line of how the body handles it (no number twice, no silence)
    const ex = !text && !cmp && n.arc?.extra ? n.arc.extra.find((x) => fits(x) && !out.some((o) => o.text === x || repeats(x, o.text))) : undefined;
    if (ex) { out.splice(i + 1, 0, { id: 'beat', t, slotS: slot, text: shownText(ex), say: speakable(ex), source: '' }); guard++; continue; }
    // v23: a late pause no fact can fill gets the arc's number-free closer ("Remember that at bedtime."), when the close
    // itself says the end card's number
    const close = !text && !cmp && n.arc && t > outro - 12 && t < outro ? n.arc.answer.find((x) => !/accounted for/.test(x) && fitsAny(x) && wordsOf(x) <= SLOT_WORDS.day && !out.some((o) => o.id === 'day' || o.text === x || repeats(x, o.text) || (Math.abs(o.t - t) < 12 && [...stems(x)].some((w) => stems(o.text).has(w))))) : undefined;
    if (close) { out.splice(i + 1, 0, { id: 'day', t, slotS: slot, text: shownText(close), say: speakable(close), source: '' }); guard++; continue; }
    if (!text) continue;
    if (!beats().includes(text) || out.some((o) => o.t < t && qtyOf(o.text).some((v) => qtyOf(text).includes(v)))) recalled++;
    const nums = qtyOf(text);
    for (let j = out.length - 1; j > i; j--) if (movable(out[j], j) && ((nums.length && qtyOf(out[j].text).some((v) => nums.includes(v))) || out[j].text === shownText(text))) out.splice(j, 1);
    out.splice(i + 1, 0, { id: 'beat', t, slotS: slot, text: shownText(text), say: speakable(text), source: text }); guard++;
  }
  // v22: a comparison says a data fact for EACH side (its own, a "Left:"/"Right:" one, or a contrast naming both): a
  // side without one gets it in a pause it fits, else in place of a fact of the other side (that side keeps one)
  if (cmp && names[0] && names[1]) {
    const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sideRe = (k: number) => new RegExp(`(^${k ? 'Right' : 'Left'}:)|\\b${esc(names[k])}\\b`, 'i');
    const factLine = (l: NarrLine) => l.id !== 'hook' && (isFact(l.text) || facts.some((f) => shownText(f) === l.text));
    const has = (k: number) => out.some((l) => factLine(l) && sideRe(k).test(l.text));
    for (const k of [0, 1]) {
      if (has(k)) continue;
      const pool = facts.filter((f) => sideRe(k).test(f) && !out.some((o) => o.text === shownText(f))).sort((p, q) => speakS(p) - speakS(q));
      let done = false;
      for (let i = 0; i < out.length && !done; i++) {
        const e = out[i].t + speakS(out[i].text), nx = Math.min(out[i + 1]?.t ?? outro, outro), t = e + GAP_S + 0.05;
        if (e >= outro - 0.5 || hushed(t, nx)) continue;
        const slot = Math.min(clearSlot(t, nx - GAP_S), nx - GAP_S - t);
        const x = pool.find((f) => speakS(f) <= slot && wordsOf(f) <= SLOT_WORDS.beat && !(t < revealOf(f)) && fresh(out, f, t, nameWords) && !(qtyOf(f).length > 0 && qtyOf(f).every((v) => out.some((o) => qtyOf(o.text).includes(v)))));
        if (x) { out.splice(i + 1, 0, { id: 'beat', t, slotS: slot, text: shownText(x), say: speakable(x), source: x }); done = true; }
      }
      // (else: in place of a number-free closing line, "Now you know.", after the answer: a contrast fits best)
      const fb = out.find((l) => l.id === 'answer' && (ANSWER_FALLBACK.compare as readonly string[]).includes(l.text));
      const fbNx = fb ? out[out.indexOf(fb) + 1] : undefined;
      const fbRoom = fb ? (fbNx ? (fbNx.id === 'loop' ? end - TAIL_S - speakS(fbNx.text) - 0.1 : fbNx.t) : end - TAIL_S) - GAP_S - fb.t : 0;
      if (!done && fb) { const x = [...pool].sort((p, q) => Number(names.every((nm) => q.includes(nm) || q.toLowerCase().includes(nm.toLowerCase()))) - Number(names.every((nm) => p.toLowerCase().includes(nm.toLowerCase())))).find((y) => speakS(y) <= fbRoom && fresh(out.filter((o) => o !== fb), y, fb.t, nameWords)); if (x) { Object.assign(fb, { text: shownText(x), say: speakable(x), source: x }); done = true; } }
      // (else: a beat of the other side, when that side has another fact line)
      const other = out.filter((l) => l.id === 'beat' && factLine(l) && sideRe(1 - k).test(l.text) && !sideRe(k).test(l.text));
      if (!done && other.length > 1) for (const l of other) {
        const x = pool.find((f) => speakS(f) <= l.slotS && wordsOf(f) <= SLOT_WORDS.beat && !(l.t < revealOf(f)) && fresh(out.filter((o) => o !== l), f, l.t, nameWords));
        if (x) { Object.assign(l, { text: shownText(x), say: speakable(x), source: x }); break; }
      }
    }
  }
  // v22: a silence no fact can fill is split: the line before it moves later (a card only while it is still on screen,
  // never into the hush before an impact), so two short pauses replace one long one
  for (let pass = 0; pass < 2; pass++) for (let i = 1; i < out.length; i++) {
    const l = out[i];
    if (l.id !== 'card' && l.id !== 'beat' && l.id !== 'tease') continue;
    const d = speakS(l.text), before = l.t - (out[i - 1].t + speakS(out[i - 1].text)), nxT = Math.min(out[i + 1]?.t ?? outro, outro), after = nxT - l.t - d;
    if (after <= 2.6 || after - before < 0.6 || before >= 2.3 || l.t + d > outro) continue;
    const sp = l.card ? spans.find((x) => (x.a === l.card || x.b === l.card || l.card!.split('|').every((c) => c === x.a || c === x.b)) && x.t0 <= l.t + 0.05 && x.t1 >= l.t) : undefined;
    if (l.card && !sp) continue;
    let shift = Math.min((after - before) / 2, 2.4 - before, sp ? sp.t1 - 0.1 - l.t : Infinity);
    while (shift > 0.05 && clearSlot(l.t + shift, nxT - GAP_S) < d) shift -= 0.1;
    if (shift <= 0.05) continue;
    l.t += shift; l.slotS = clearSlot(l.t, nxT - GAP_S);
  }
  // v22: the hook may start a little later (at most 0.8 s) when a long pause follows it, and the 24 h line a little
  // earlier (it leads into the lights coming on) when a long pause comes before it
  {
    const h = out[0], nx = out[1];
    if (h?.id === 'hook' && nx) {
      const d = speakS(h.text), after = Math.min(nx.t, outro) - h.t - d;
      let sh = Math.min(0.8, (after - h.t) / 2);
      while (sh > 0.05 && clearSlot(h.t + sh, nx.t - GAP_S) < d) sh -= 0.1;
      if (after > 2.2 && sh > 0.05) {
        const t0 = h.t, s0 = h.slotS; h.t += sh; h.slotS = clearSlot(h.t, nx.t - GAP_S);
        // (not when that brings a word said a third time into one 15 s window)
        if (out.some((o, j) => o.t < h.t + VARIETY_S && overused(out, j, nameWords).length)) { h.t = t0; h.slotS = s0; }
      }
    }
    const k = out.findIndex((o) => o.id === 'day');
    if (k > 0) {
      const l = out[k], pe = out[k - 1].t + speakS(out[k - 1].text), sh = Math.min(0.8, l.t - pe - 2.2);
      if (sh > 0.05 && !hushed(l.t - sh, l.t)) { l.t -= sh; l.slotS += sh; }
    }
  }
  // v22: a fact that the moves above brought into a window where a word is said a third time is said as another fact
  for (let j = 0; j < out.length; j++) {
    const l = out[j];
    if (l.id !== 'beat' || !overused(out, j, nameWords).length && !out.some((o, q) => q > j && o.t < l.t + VARIETY_S && overused(out, q, nameWords).length)) continue;
    // (first: a card line nearby said another way, "Insulin brings it back down.", the card still read)
    const over = new Set([...overused(out, j, nameWords), ...out.flatMap((o, q) => (q > j && o.t < l.t + VARIETY_S ? overused(out, q, nameWords) : []))]);
    for (const o of out) if (o !== l && o.id === 'card' && Math.abs(o.t - l.t) < VARIETY_S && [...stems(o.text)].some((w) => over.has(w))) {
      const v = variants(o.text).slice(1).find((y) => speakS(y) <= o.slotS && ![...stems(y)].some((w) => over.has(w)));
      if (v) { Object.assign(o, { text: shownText(v), say: speakable(v) }); break; }
    }
    if (!overused(out, j, nameWords).length && !out.some((o, q) => q > j && o.t < l.t + VARIETY_S && overused(out, q, nameWords).length)) continue;
    const rest = out.filter((o) => o !== l);
    const once = (y: string) => !(/driv/i.test(y) && rest.some((o) => /driv/i.test(o.text)));
    const x = beats().find((y) => once(y) && !(!cmp && saysAgain(y, rest)) && speakS(y) <= l.slotS && fresh(rest, y, l.t, nameWords) && !rest.some((o) => o.text === shownText(y)) && !(l.t < revealOf(y))
      && !(qtyOf(y).length > 0 && qtyOf(y).every((v) => rest.some((o) => qtyOf(o.text).includes(v)))))
      ?? [...recall, ...facts].find((y) => once(y) && !(!cmp && saysAgain(y, rest)) && qtyOf(y).length > 0 && speakS(y) <= l.slotS && fresh(rest, y, l.t, nameWords) && !rest.some((o) => o.text === shownText(y) || repeats(y, o.text)) && !(l.t < revealOf(y))
        && !rest.some((o) => Math.abs(o.t - l.t) < RECALL_S / 2 && qtyOf(o.text).some((v) => qtyOf(y).includes(v))));
    if (x) Object.assign(l, { text: shownText(x), say: speakable(x), source: x });
  }
  // (v23: no close placed: the loop's place goes to it, the shortest number-free close that fits)
  // (else the last line after the peak gives way to it: every video has an end line)
  const last = out[out.length - 1];
  if (!out.some((o) => o.id === 'answer') && last && last.id !== 'loop' && last.id !== 'hook' && last.id !== 'climax' && last.id !== 'payoff' && !(last.id === 'card' && last.card) && !cmp && n.arc && last.t > outro - 8) Object.assign(last, { id: 'loop' });
  if (!out.some((o) => o.id === 'answer') && out[out.length - 1]?.id === 'loop' && !cmp && n.arc) {
    const l = out[out.length - 1], room = end - TAIL_S - l.t;
    const x = [...n.arc.answer, n.solid ? 'Every bite, accounted for.' : 'Every sip, accounted for.'].filter((y) => !out.some((o) => o.text === y)).sort((p, q) => speakS(p) - speakS(q)).find((y) => speakS(y) <= room);
    if (x) Object.assign(l, { id: 'answer', text: shownText(x), say: speakable(x), source: '', slotS: room });
  }
  // the loop line ends on the last frame (it hands over to frame 0)
  const loop = out[out.length - 1];
  if (loop?.id === 'loop') { const t = Math.max(loop.t, end - TAIL_S - speakS(loop.text) - 0.1); loop.slotS -= t - loop.t; loop.t = t; }
  // (v23b: the close before it moves later when that leaves a long pause before the loop line: two short pauses instead)
  if (loop?.id === 'loop' && out.length >= 3) {
    const pv = out[out.length - 2], pp = out[out.length - 3];
    const after = loop.t - pv.t - speakS(pv.text), before = pv.t - pp.t - speakS(pp.text);
    const sh = Math.min((after - before) / 2, after - GAP_S - 0.05);
    if (after > 2.2 && sh > 0.05 && (pv.id === 'answer' || pv.id === 'day')) { pv.t += sh; pv.slotS = loop.t - GAP_S - pv.t; }
  }
  for (let i = 0; i < out.length; i++) { const nx = out[i + 1]; if (nx) out[i].slotS = Math.min(out[i].slotS, nx.t - GAP_S - out[i].t); }
  return out;
}

/** v22: both names of a comparison are said by EARLY_NAMES_S (the hook line: each name's words before then, at WPS). */
export const EARLY_NAMES_S = 4;
export function bothNamesEarly(l: Pick<NarrLine, 't' | 'text'>, names: readonly string[]): boolean {
  const k = Math.max(1, Math.floor((EARLY_NAMES_S - l.t) * WPS));
  const head = new Set(stemList(l.text.split(/\s+/).slice(0, k).join(' ')));
  return names.every((nm) => stemList(nm).some((s) => head.has(s)));
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
    // v23: every line earns its place (no line that only restates the state); time phrases from the first sip, not the clock
    if (restates(l.text)) bad('restates without new info', l.text);
    if (l.id !== 'hook' && CLOCK.test(l.text)) bad('clock time in narration', l.text);
    // (a card that answers the hook's own question, "Is it still in you at bedtime?", has its time in that question)
    const qAnch = ANCHOR.test(`${n.hook?.line1 ?? ''} ${n.hook?.line2 ?? ''}`.split(/(?<=[.?!])\s+/).filter((x) => x.includes('?')).join(' '));
    if (l.id !== 'hook' && unanchored(l.text) && !(qAnch && l.card)) bad('state without time anchor', l.text);
    // v23c: a crash or a dip is said only when the model's glucose curve dips below where it started
    if (n.kind === 'single' && n.arc && /\b(?:crash|dips?)\b/i.test(l.text) && !n.arc.dip) bad('crash not in the model', l.text);
    // v19: length per slot, and the grammar of a spoken line (a capital, an end mark, a question that is one)
    if (wordsOf(l.text) > SLOT_WORDS[l.id]) bad('narration line too long for its kind', `${l.id}: ${l.text}`);
    if (!/^[A-Z0-9]/.test(l.text) || !/[.?!]$/.test(l.text)) bad('narration grammar', l.text);
    const q = l.text.split(/(?<=[.?!:])\s+/).find((x) => x.includes('?'));
    if (q && l.id !== 'hook' && !/^(Where|What|When|How|Which|Who|Why|Ever|Did|Does|Do|Is|Are|Can|Will|Were|Has|Have|On|So|Called|And|The|A|Your|Same|Side|Spot|One|Two|See)\b/i.test(q)) bad('narration grammar', `odd question: ${l.text}`);
    if (/\s{2,}|\s[,.?!:]|\.\.|\?\.|[,:]$/.test(l.text)) bad('narration grammar', l.text);
    if (/\b(\w+)\s+\1\b/i.test(l.text)) bad('narration grammar', `repeated word: ${l.text}`);
    // v22: a filler is this food's own fact (video-facts), never a generic line
    if (l.id === 'beat' && ![...(n.facts ?? []), ...(n.lateFacts ?? []), ...(n.arc?.setup ?? []), ...(n.arc?.extra ?? [])].some((f) => [f, ...variants(f)].map(shownText).includes(l.text))) bad('generic filler', l.text);
    // v22: a comparison says both names within its first ~4 s (the hook: both in its first words)
    if (l.id === 'hook' && n.kind === 'compare' && n.names && n.names.every(Boolean) && !bothNamesEarly(l, n.names)) bad('comparison names not said early', `${l.text} (${n.names.join(' / ')})`);
    // v20: a line that reads a card says that card word for word (its caption takes the card's place: one text)
    if (l.card && !l.card.split('|').every((c) => variants(c).some((v) => l.text.toLowerCase().includes(shownText(v).slice(1).toLowerCase())))) bad('narration differs from its card', `${l.text} | ${l.card}`);
  }
  // v23d: no number is said twice in one video (a fact once; the hook's number is not read again from a card)
  if (n.kind === 'single') { const seen = new Map<string, string>();
    for (const l of lines) for (const q of new Set(qtyOf(l.text))) { if (seen.has(q)) bad('number said twice', `${q}: ${seen.get(q)} | ${l.text}`); else seen.set(q, l.text); } }
  // v23: the clearing time is said one way only (the hook's answer: "1–4 hours" twice, never "about 3 hours" as well)
  const clr = [...new Set(lines.filter((l) => l.id !== 'hook' && CLEAR_TIME.test(l.text)).map((l) => qtyOf(l.text).filter((x) => /\d$|hours|minutes/.test(x)).join(' ')))];
  if (clr.length > 1 && n.kind === 'single') bad('inconsistent time reference', clr.join(' | '));
  // v23b: a hook question is answered out loud: the moment that answers it is read (and, for "how fast", the model's time)
  if (n.kind === 'single' && /\?/.test(`${n.hook?.line1 ?? ''} ${n.hook?.line2 ?? ''}`)) {
    const pt = (n.hook?.payoff ?? n.hook?.extra?.title ?? '').toLowerCase(), sp = n.plan.frames ? cardSpans(n.plan.frames).filter((x) => x.title.toLowerCase() === pt && /[.?!]$/.test(x.a) && !restates(x.a) && !CLOCK.test(x.a)) : [];
    const said = (c: string) => lines.some((l) => l.id !== 'hook' && l.text.toLowerCase().includes(c.slice(1).replace(/\.$/, '').toLowerCase()));
    if (pt && sp.length && !sp.some((x) => said(x.a) || lines.some((l) => l.card === x.a)) && !lines.some((l) => l.id === 'payoff' || (!!n.arc?.fast && FAST_Q.test(`${n.hook?.line1} ${n.hook?.line2}`) && /peak|after the first/i.test(l.text) && qtyOf(l.text).some((v) => qtyOf(n.arc!.fast!).includes(v))))) bad('hook question never answered', `${n.hook?.line1} ${n.hook?.line2} | ${sp.map((x) => x.a).join(' / ')}`);
    // (the model's peak time said anywhere counts: "Peak sugar: about 60 minutes in.", "… About 25 minutes after the first sip.")
    const pkN = qtyOf(n.arc?.fast ?? '');
    const timed = (l: NarrLine) => l.id === 'payoff' || (/peak|after the first/i.test(l.text) && qtyOf(l.text).some((v) => pkN.includes(v)));
    if (FAST_Q.test(`${n.hook?.line1} ${n.hook?.line2}`) && n.arc?.fast && !lines.some(timed)) bad('hook question never answered', `${n.hook?.line1} ${n.hook?.line2} (no time said)`);
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
