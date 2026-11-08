// The video's hook (2026-10-24 creative spec §6): two short lines on the first frame, the surprise first and the
// promise second ("9 teaspoons of sugar." / "Watch where it goes."). Computed for every export from the model's own
// chapter texts, never typed in by hand, so a hook can only say what the video then shows. Plain words for anyone
// scrolling past (owner, 2026-10-24). Alcohol is a warning, never a celebration: no "best", "wins", "cure".

import { AMOUNT_PREFIX } from './video-names';
export interface HookIn {
  /** the video's short name ("One can of cola", "3 × 500 ml of beer over 2 h", "A whole pizza") */ name: string;
  chapters: { min: number; title: string; text: string }[];
  /** the drink or meal has alcohol / caffeine / measured sugar, and its first numbers */
  alcohol?: boolean; caffeine?: boolean; solid?: boolean; kcal?: number;
  pace?: { doses: number; round: string };
  /** round 5: the portion's weight (g), so a big number comes with its size ("A whole pizza (1154 g): 2723 kcal.") */ grams?: number;
  /** round 5: the caffeine dose (mg): "still in you at bedtime" is said as a share of it */ caffeineMg?: number;
  /** round 13: a surprising comparison the model shows (video-story surpriseOf): "More blood sugar than cow's milk." */ surprise?: { than: string; ratio?: number };
  /** round 14 (critic DC-1): decaf: its own caffeine (mg), a regular cup's, and the minute of its caffeine peak */ decaf?: { mg: number; regularMg: number; min: number };
}
/** `payoff`: the title of the chapter that pays the hook off (round 5: it is in every cut, near the end of the short).
 *  Round 14 (critic: "every question must be answered on screen"): `payoffMin` when the payoff is a moment of its own
 *  (`extra`, e.g. decaf's caffeine), and `answer`, the card that answers the hook, said first at the payoff moment. */
export interface Hook { line1: string; line2: string; payoff?: string; payoffMin?: number; answer?: string; extra?: { min: number; title: string; lines: string[] };
  /** round 14: the card that says the hook's number, right after the name on the first moment ("434 kcal in total.") */ lead?: string }
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const fit = (s: string, max = 8) => words(s) <= max;
/** A share in words, as the bedtime card says it (video-beats.ts fractionWord). */
const share = (r: number) => { if (!(r >= 0.07)) return null; const W: [number, string][] = [[0.1, 'a tenth'], [0.2, 'a fifth'], [0.25, 'a quarter'], [1 / 3, 'a third'], [0.5, 'half'], [2 / 3, 'two thirds'], [0.75, 'three quarters'], [0.9, 'almost all']]; return W.reduce((b, w) => (Math.abs(w[0] - r) < Math.abs(b[0] - r) ? w : b))[1]; };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Round 17: a name inside a sentence ("orange juice"), unless it is an acronym or a brand-like word ("USDA", "McFlurry"). */
export const lowerName = (s: string) => (/^[A-Z][a-z]/.test(s) && !/^[A-Z][a-z]+[A-Z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
/** "1.6×", "2×" (round 14: the oat milk answer). */
export const timesText = (r: number) => (r >= 1.95 ? `${Math.round(r)}×` : `${(Math.round(r * 10) / 10).toFixed(1)}×`);
/** Round 14: a hook must carry a number (or a number word) or a question. */
export const HOOK_NUMBER = /\d|\b(half|a third|a quarter|a fifth|a tenth|two thirds|three quarters|almost all)\b/i;

/** The hook for a single video. */
export function hookFor(h: HookIn): Hook {
  const first = h.chapters[0]?.text ?? '';
  const name = h.name.replace(/\s*\([^)]*\)/g, '').trim();
  // round 18 (critic T-7: "Watch where it goes." on 62 items, every alcohol hook the same): each formula has a few
  // phrasings, picked per food (seedOf), so the series never reads as one template
  const rot = <T,>(xs: T[]) => xs[seedOf(h.name) % xs.length];
  if (h.alcohol) {
    // the surprise: the alcohol is still there the next morning (the model's "Next morning" chapter says so)
    const morning = h.chapters.find((c) => c.title === 'Next morning');
    const wake = morning && /still has about/.test(morning.text) ? /^(\d\d:\d\d)/.exec(morning.text)?.[1] : undefined;
    // (round 18, critic: "Rakija 45%." was a fragment): the drink with its grams of alcohol
    const ag = /(\d+) g (?:of )?alcohol/.exec(first)?.[1], nm = cap(name.replace(/ over .+$/, ''));
    const beers = h.pace && /beer/i.test(name) ? `${h.pace.doses} beers in one evening.` : ag && fit(`${nm}: ${ag} g of alcohol.`) ? `${nm}: ${ag} g of alcohol.` : `${nm}.`;
    if (wake) return { line1: `Still in your blood at ${wake}.`, line2: fit(beers) ? beers : 'Watch what alcohol does.', payoff: 'Next morning' };
    if (h.pace) return { line1: fit(beers) ? beers : 'One drink, 24 hours.', line2: 'Watch what alcohol does.' };
    // round 14 (critic G-2: "500 ml of beer. Watch what alcohol does." had no question and no number): one drink asks
    // how long it stays, and its "gone" moment answers ("The alcohol is gone after about 1–4 h.")
    const gone = h.chapters.find((c) => c.title === 'Alcohol gone');
    if (gone) return { line1: rot(['How long does it stay in your blood?', 'How long until it is out of your blood?', 'When is the alcohol gone?']), line2: fit(beers) ? beers : 'One drink.', payoff: gone.title };
    return { line1: fit(beers) ? beers : 'One drink, 24 hours.', line2: 'Watch what alcohol does.' };
  }
  // round 14 (critic DC-1: decaf had no story): is there still caffeine in it? The model's mg answers, next to a regular cup
  if (h.decaf) {
    const l1 = `${cap(name)}: is there still caffeine in it?`, answer = `Yes, a little: about ${Math.max(1, Math.round(h.decaf.mg))} mg.`;
    return { line1: fit(l1, 9) ? l1 : 'Decaf: is there still caffeine in it?', line2: 'Watch your blood find out.', payoffMin: h.decaf.min, answer,
      extra: { min: h.decaf.min, title: 'A little caffeine', lines: [answer, `A regular cup has about ${Math.round(h.decaf.regularMg)} mg.`] } };
  }
  // round 13 (critic P1-5): a surprise the model shows leads (oat milk: more blood sugar than cow's milk); round 14
  // (critic O-1): and the video answers it at the peak, with the model's own ratio
  if (h.surprise) {
    const pk = h.chapters.find((c) => /^(Blood sugar peak|Sugar rises)$/.test(c.title));
    // (round 14: with its number on the first frame, the same the answer card says)
    const r = h.surprise.ratio ? timesText(h.surprise.ratio) : null;
    return { line1: `${cap(name)}.`, line2: r ? `${r} the blood sugar rise of ${h.surprise.than}.` : `More blood sugar than ${h.surprise.than}.`, ...(pk ? { payoff: pk.title } : {}),
      ...(pk && r ? { answer: `About ${r} the rise of ${h.surprise.than}.` } : {}) };
  }
  // food: its calories lead (a whole pizza is about its size, not its teaspoons)
  // round 5 (critic): a big number comes with the portion's size, and the promise is a question the 24 h moment answers
  const day = h.chapters.find((c) => /% has left your body so far/.test(c.text));
  // round 17 (critic G-3: "Brie: 95 kcal. Watch it for 24 hours." asked nothing): else a question its own moments answer
  const fq = fallbackQ(h);
  const promise = day ? { line2: rot(['Where is it 24 hours later?', 'What is left of it a day later?', 'Where has it gone after a day?']), payoff: day.title } : fq.payoff ? { line2: fq.line1, payoff: fq.payoff } : fq.payoffMin !== undefined ? { line2: fq.line1, payoffMin: fq.payoffMin } : { line2: 'Watch it for 24 hours.' };
  // (round 15, critic H-1: "4 teaspoons of sugar." did not say crepes): the name, short if need be ("2 crepes")
  const core = cap(name.replace(/ with .*$/i, ''));
  // (round 18, critic T-6: "1 portion of green salad: 14 g of fat" hid the olive oil): the name without its amount before the bare noun
  const bareN = cap(name.replace(AMOUNT_PREFIX, ''));
  // (round 18: and with its first add-on only, "Green salad with olive oil: 14 g of fat.", before the bare noun)
  const bareOne = bareN.replace(/( with [^,&]+?)(?:,.*| & .*)$/, '$1');
  const named = (rest: string, max = 9) => [`${cap(name)}: ${rest}`, `${bareN}: ${rest}`, `${bareOne}: ${rest}`, `${core}: ${rest}`].find((x) => fit(x, max)) ?? `${core}: ${rest}`;
  // round 13 (critic P0-2c: salmon opened with "Watch it for 24 hours."): protein-led food leads with its protein
  const prot = Number(/(\d+) g protein/.exec(first)?.[1] ?? 0), carbs = Number(/(\d+) g carbohydrate/.exec(first)?.[1] ?? 0);
  if (h.solid && prot >= 20 && carbs < 15) { const l1 = named(`${prot} g of protein.`); return { line1: fit(l1, 9) ? l1 : `${prot} g of protein.`, line2: rot(['Watch your body use it.', 'Watch where the protein goes.', 'Watch your body take it apart.']), lead: `${prot} g of protein.` }; }
  // round 17 (critic G-3: brie): a small, fatty food leads with its fat (the number it is about), and asks what its
  // own moments answer
  const fat = Number(/(\d+) g fat/.exec(first)?.[1] ?? 0), kc = Number(/(\d+) kcal/.exec(first)?.[1] ?? 0);
  if (h.solid && fat >= 5 && kc > 0 && kc < 300 && fat * 9 >= 0.5 * kc && !/teaspoons? of sugar/.test(first.replace(/about [01] teaspoons?/, ''))) {
    const l1 = named(`${fat} g of fat.`);
    if (fit(l1, 9)) return { line1: l1, ...promise, lead: `${fat} g of fat.` };
  }
  // the surprise names what it is in (critic: "9 teaspoons of sugar." did not say cola)
  const tsp = /(\d+) g (?:of )?sugar[^.]*?about (\d+) teaspoons?/.exec(first);
  // (round 6, critic: "Watch where it goes" was never paid off in the short): the moment that says where the sugar
  // ends up pays it off
  const where = h.chapters.find((c) => /burns about half of the fructose/.test(c.text) && c.min > 0);
  const tspHook = (): Hook => ({ line1: named(`${tsp![2]} teaspoons of sugar.`), line2: rot(['Watch where it goes.', 'Follow it through your body.', 'See where it all ends up.']), ...(where ? { payoff: where.title } : {}), lead: `${tsp![1]} g of sugar: about ${tsp![2]} teaspoons.` });
  if (h.solid) {
    const k = /(\d+) kcal/.exec(first)?.[1];
    // round 14 (critic G-2: crepes "434 kcal. Watch it for 24 hours."): a sweet dish under 500 kcal leads with its sugar
    if (tsp && Number(tsp[2]) >= 4 && k && Number(k) < 500) return tspHook();
    const sized = h.grams && !/\d+\s*g\b/.test(name) && !/^\d/.test(name) ? `${cap(name)} (${Math.round(h.grams)} g): ${k} kcal.` : `${cap(name)}: ${k} kcal.`;
    if (k && Number(k) >= 300) return { line1: fit(sized) ? sized : fit(named(`${k} kcal.`), 9) ? named(`${k} kcal.`) : `One meal: ${k} kcal.` /* (round 17: a builder name with its add-ons, 9 words) */, ...promise, lead: `${k} kcal in total.` };
  }
  if (tsp && Number(tsp[2]) >= 3) return tspHook();
  // round 12 (critic P1-1: "1 kaiser roll. Watch where it goes." had no number): a starchy food leads with what its
  // starch becomes, the teaspoons the small-intestine moment says (foodProduct: available carbohydrate / 4 g)
  const st = h.chapters.map((c) => ({ c, m: /In all, about (\d+) teaspoons of sugar reach your blood/.exec(c.text) })).find((x) => x.m);
  if (h.solid && st && !h.alcohol) {
    const n = st.m![1];
    return { line1: named(`about ${n} teaspoons of sugar.`), line2: 'Watch the starch become blood sugar.', payoff: st.c.title, answer: `About ${n} teaspoons of sugar, from starch.` };
  }
  if (h.caffeine) {
    // "still in you at bedtime" as the share the model says (critic: it promised a problem the end card then denied)
    const bed = h.chapters.find((c) => /^(Going to bed|Bedtime)$/.test(c.title) && /mg of caffeine is (?:still|left) in you/.test(c.text));
    const mg = bed && /(\d+) mg of caffeine is/.exec(bed.text)?.[1], fw = mg && h.caffeineMg ? share(Number(mg) / h.caffeineMg) : null;
    const line1 = fit(`${cap(name)}.`) ? `${cap(name)}.` : 'One coffee, 24 hours.';
    // round 6 (critic P1: "a fifth at bedtime" is honest but an anticlimax): a small share at bedtime gives way to the
    // toilet fact (1 in 3 people, within minutes), when the model tells it
    const colon = h.chapters.find((c) => /1 in 3 people coffee makes the lower bowel start moving/.test(c.text));
    if (colon && (!fw || Number(mg) / (h.caffeineMg ?? 1) < 0.3)) return { line1, line2: 'It sends 1 in 3 to the toilet.', payoff: colon.title };
    // (round 18, critic T-8: "Almost all is still in you": all of what?): its caffeine
    if (bed && fw) return { line1, line2: rot([`${cap(fw)} of its caffeine is left at bedtime.`, `At bedtime, ${fw} of its caffeine remains.`, `${cap(fw)} of its caffeine lasts until bedtime.`]), payoff: bed.title };
    const pk = h.chapters.find((c) => /caffeine/i.test(c.title) && c.min > 0);
    // (round 17, critic G-4: green tea): the caffeine's own number, and when it hits
    if (pk && h.caffeineMg && h.caffeineMg >= 20 && fit(`${cap(name)}: ${Math.round(h.caffeineMg)} mg of caffeine.`)) return { line1: `${cap(name)}: ${Math.round(h.caffeineMg)} mg of caffeine.`, line2: 'When does it hit?', payoff: pk.title };
    if (pk) return { line1: 'Where does the caffeine go?', line2: line1, payoff: pk.title };
  }
  if (h.solid && h.kcal && h.kcal >= 300 && fit(`${cap(name)}: ${Math.round(h.kcal)} kcal.`)) {
    // the kcal as the first chapter says them
    const k = /(\d+) kcal/.exec(first)?.[1];
    if (k) return { line1: `${cap(name)}: ${k} kcal.`, ...promise, lead: `${k} kcal in total.` };
  }
  // round 14 (critic: a hook carries a number or a question): its kcal, else a question its own moments answer
  const k = /(\d+) kcal/.exec(first)?.[1];
  if (k && Number(k) >= 1) return { line1: named(`${k} kcal.`), ...promise, lead: `${k} kcal in total.` };
  return { ...fallbackQ(h), line2: fit(`${cap(name)}.`) ? `${cap(name)}.` : 'One drink, 24 hours.' };
}
/** A question the video answers, from the moments it has (round 14); `not` = a question already asked (hook A). */
function fallbackQ(h: HookIn, not = ''): { line1: string; payoff?: string; payoffMin?: number } {
  const day = h.chapters.find((c) => /% has left your body so far/.test(c.text));
  const blood = h.chapters.find((c) => c.min > 0 && /blood/i.test(c.title));
  // (round 17, critic G-4: "Where does the water go?" for cod): the water question only for a drink
  const kid = !h.solid && h.chapters.find((c) => /Kidneys|Bladder/.test(c.title));
  // round 17: how long it stays in the stomach, answered by the stomach's own half time ("Half has moved on after 61 minutes.")
  const half = Number(/half has moved on after about (\d+) minutes/.exec(h.chapters.find((c) => c.title === 'In your stomach')?.text ?? '')?.[1] ?? 0);
  type Q = { line1: string; payoff?: string; payoffMin?: number };
  const rot = <T,>(xs: T[]) => xs[seedOf(h.name) % xs.length]; // (round 18, critic T-7)
  const all = ([day ? { line1: rot(['Where is it 24 hours later?', 'What is left of it a day later?', 'Where has it gone after a day?']), payoff: day.title } : null,
    blood ? { line1: rot(['How fast does it reach your blood?', 'When does it reach your blood?', 'How soon is it in your blood?']), payoff: blood.title } : null,
    kid ? { line1: rot(['Where does the water go?', 'Where does all that water go?', 'When does the water leave you?']), payoff: kid.title } : null,
    h.solid && half >= 20 ? { line1: rot(['How long does it stay in your stomach?', 'When does your stomach let it go?', 'How long does your stomach hold it?']), payoffMin: half } : null] as (Q | null)[]).filter((x): x is Q => !!x && x.line1 !== not);
  return all[0] ?? { line1: 'What does it do inside you?' };
}

/** The comparison's hook: a guess the video answers (the race out of the stomach comes from the model). */
export function hookForCompare(a: string, b: string, race: boolean): Hook {
  if (race) return { line1: 'Guess: which leaves your stomach first?', line2: GUESS_LINE }; // (round 11: no "Comment: …" in the video)
  const vs = `${a} vs ${b}.`;
  return { line1: fit(vs) ? vs : 'Two drinks, one day.', line2: 'Watch both, then guess.' };
}

/** Round 11 (research R7, Meta's comment-bait rule): the video asks for a guess, never for a comment. */
export const GUESS_LINE = 'Guess before the answer.';

/** Round 11 (research R2): the second hook, from another formula: the question first, the fact second (A leads
 *  with the number). It only reuses A's own words and numbers, so it is as honest as A. */
export function hookB(h: HookIn, a: Hook): Hook {
  const morning = h.chapters.find((c) => c.title === 'Next morning');
  const keep = { ...(a.payoff ? { payoff: a.payoff } : {}), ...(a.payoffMin !== undefined ? { payoffMin: a.payoffMin } : {}), ...(a.answer ? { answer: a.answer } : {}), ...(a.extra ? { extra: a.extra } : {}), ...(a.lead ? { lead: a.lead } : {}) };
  // (round 13: a surprise stays a surprise in B, as a question)
  if (/the blood sugar rise of |^More blood sugar than /.test(a.line2)) return { line1: `More blood sugar than ${h.surprise?.than ?? 'you think'}?`, line2: a.line1, ...keep };
  // round 14: decaf asks the other way round; alcohol that A already asks about leads with its grams
  if (h.decaf) return { line1: 'Is decaf really caffeine-free?', line2: a.line2, ...keep };
  const name = cap(h.name.replace(/\s*\([^)]*\)/g, '').trim());
  if (h.alcohol) {
    const g = /(\d+) g (?:of )?alcohol/.exec(h.chapters[0]?.text ?? '')?.[1];
    if (/\?$/.test(a.line1) || !morning) return g ? { line1: fit(`${name}: ${g} g of alcohol.`) ? `${name}: ${g} g of alcohol.` : `${g} g of alcohol.`, line2: 'Watch what alcohol does.', ...keep } : { line1: ['Where does the alcohol go?', 'What does your liver do with it?', 'How does your body clear it?'][seedOf(h.name) % 3], line2: a.line2, ...keep };
    return { line1: 'Is it gone by the next morning?', line2: a.line1, ...keep };
  }
  // (round 17: "Ice cream: 4 teaspoons of sugar." had no moment for "Where does it go?"): its blood sugar peak answers
  const sugarPk = h.chapters.find((c) => /^(Blood sugar peak|Sugar rises)$/.test(c.title));
  // (v23b, editor: "Where does that sugar end up?" was never answered out loud): the peak, which the model times, answers
  if (/teaspoons of sugar/.test(a.line1) && a.payoffMin === undefined && sugarPk) return { line1: ["How fast does it hit your blood sugar?", "How high does your blood sugar go?"][seedOf(h.name) % 2], line2: a.line1, ...keep, payoff: sugarPk.title };
  const q = /teaspoons of sugar/.test(a.line1) ? ['Where does all that sugar go?', 'Where does that sugar end up?'][seedOf(h.name) % 2]
    : /mg of caffeine\.$/.test(a.line1) && /\?$/.test(a.line2) ? `When does its caffeine hit?`
    : /toilet/.test(a.line2) ? 'Does coffee send you to the toilet?'
      : /bedtime/.test(a.line2) ? ['How much caffeine is left at bedtime?', 'Is it still in you at bedtime?'][seedOf(h.name) % 2]
        : /\?$/.test(a.line1) ? null
          : /\?$/.test(a.line2) ? a.line2 : null;
  if (q && (a.payoff || a.payoffMin !== undefined)) return { line1: q, line2: a.line1, ...keep };
  // otherwise a question with its own answer moment, the fact second
  const f = fallbackQ(h, a.line1);
  if (f.payoff || f.payoffMin !== undefined) return { line1: f.line1, line2: /\?$/.test(a.line1) ? a.line2 : a.line1, ...(f.payoff ? { payoff: f.payoff } : {}), ...(f.payoffMin !== undefined ? { payoffMin: f.payoffMin } : {}), ...(a.lead ? { lead: a.lead } : {}) };
  // (round 17, critic G-3: "…, in 24 hours. Watch it for 24 hours."): the question first, never the day twice
  const what = [lowerName(name), lowerName(cap(name.replace(AMOUNT_PREFIX, '')))].map((n) => `What does ${n} do inside you?`).find((x) => fit(x, 9)) ?? 'What does it do inside you?';
  return { line1: what, line2: /\?$/.test(a.line1) ? a.line2 : a.line1, ...keep };
}
/** Round 11: the comparison's second hook: both names first, then the same question (still a guess). */
export function compareHookB(question: string, a: string, b: string): string {
  const rest = question.replace(/^Guess:\s*/i, '').replace(/^\w/, (c) => c.toLowerCase());
  const tries = [`${a} or ${lowerName(b)}: ${rest}`, `${a} vs ${b}: guess first.`]; // (round 17: "Cola or orange juice", no capital mid-sentence)
  return tries.find((s) => words(s) <= 9) ?? tries[1];
}
/** Round 11 (research R5): a stable number per food (FNV-1a of its name), so its hook order, music motif and camera
 *  sway are its own, and the same on every export. */
export function seedOf(name: string): number {
  let h = 2166136261;
  for (const ch of name.toLowerCase()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}

/** "Comment: cola or water?" (round 5, critic: "Comment A or B" while nothing on screen was called A or B).
 *  Round 11: only for the TikTok description (video-caption.ts), never in the video. */
export const commentLine = (a: string, b: string) => `Comment: ${a.toLowerCase()} or ${b.toLowerCase()}?`;

/** Numbers in a hook (for the honesty test: each must appear in the video's own chapters or name). */
export const numbersIn = (s: string) => s.match(/\d+(?:[.,:]\d+)?/g) ?? [];
