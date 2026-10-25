// The video's hook (2026-10-24 creative spec §6): two short lines on the first frame, the surprise first and the
// promise second ("9 teaspoons of sugar." / "Watch where it goes."). Computed for every export from the model's own
// chapter texts, never typed in by hand, so a hook can only say what the video then shows. Plain words for anyone
// scrolling past (owner, 2026-10-24). Alcohol is a warning, never a celebration: no "best", "wins", "cure".

export interface HookIn {
  /** the video's short name ("One can of cola", "3 × 500 ml of beer over 2 h", "A whole pizza") */ name: string;
  chapters: { min: number; title: string; text: string }[];
  /** the drink or meal has alcohol / caffeine / measured sugar, and its first numbers */
  alcohol?: boolean; caffeine?: boolean; solid?: boolean; kcal?: number;
  pace?: { doses: number; round: string };
  /** round 5: the portion's weight (g), so a big number comes with its size ("A whole pizza (1154 g): 2723 kcal.") */ grams?: number;
  /** round 5: the caffeine dose (mg): "still in you at bedtime" is said as a share of it */ caffeineMg?: number;
}
/** `payoff`: the title of the chapter that pays the hook off (round 5: it is in every cut, near the end of the short). */
export interface Hook { line1: string; line2: string; payoff?: string }
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const fit = (s: string, max = 8) => words(s) <= max;
/** A share in words, as the bedtime card says it (video-beats.ts fractionWord). */
const share = (r: number) => { if (!(r >= 0.07)) return null; const W: [number, string][] = [[0.1, 'a tenth'], [0.2, 'a fifth'], [0.25, 'a quarter'], [1 / 3, 'a third'], [0.5, 'half'], [2 / 3, 'two thirds'], [0.75, 'three quarters'], [0.9, 'almost all']]; return W.reduce((b, w) => (Math.abs(w[0] - r) < Math.abs(b[0] - r) ? w : b))[1]; };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The hook for a single video. */
export function hookFor(h: HookIn): Hook {
  const first = h.chapters[0]?.text ?? '';
  const name = h.name.replace(/\s*\([^)]*\)/g, '').trim();
  if (h.alcohol) {
    // the surprise: the alcohol is still there the next morning (the model's "Next morning" chapter says so)
    const morning = h.chapters.find((c) => c.title === 'Next morning');
    const wake = morning && /still has about/.test(morning.text) ? /^(\d\d:\d\d)/.exec(morning.text)?.[1] : undefined;
    const beers = h.pace && /beer/i.test(name) ? `${h.pace.doses} beers in one evening.` : `${cap(name.replace(/ over .+$/, ''))}.`;
    if (wake) return { line1: `Still in your blood at ${wake}.`, line2: fit(beers) ? beers : 'Watch what alcohol does.', payoff: 'Next morning' };
    return { line1: fit(beers) ? beers : 'One drink, 24 hours.', line2: 'Watch what alcohol does.' };
  }
  // food: its calories lead (a whole pizza is about its size, not its teaspoons)
  // round 5 (critic): a big number comes with the portion's size, and the promise is a question the 24 h moment answers
  const day = h.chapters.find((c) => /% has left your body so far/.test(c.text));
  const promise = day ? { line2: 'Where is it 24 hours later?', payoff: day.title } : { line2: 'Watch it for 24 hours.' };
  if (h.solid) {
    const k = /(\d+) kcal/.exec(first)?.[1];
    const sized = h.grams && !/\d+\s*g\b/.test(name) && !/^\d/.test(name) ? `${cap(name)} (${Math.round(h.grams)} g): ${k} kcal.` : `${cap(name)}: ${k} kcal.`;
    if (k && Number(k) >= 300) return { line1: fit(sized) ? sized : fit(`${cap(name)}: ${k} kcal.`) ? `${cap(name)}: ${k} kcal.` : `One meal: ${k} kcal.`, ...promise };
  }
  // the surprise names what it is in (critic: "9 teaspoons of sugar." did not say cola)
  const tsp = /(\d+) g (?:of )?sugar[^.]*?about (\d+) teaspoons?/.exec(first);
  // (round 6, critic: "Watch where it goes" was never paid off in the short): the moment that says where the sugar
  // ends up pays it off
  const where = h.chapters.find((c) => /burns about half of the fructose/.test(c.text) && c.min > 0);
  if (tsp && Number(tsp[2]) >= 3) return { line1: fit(`${cap(name)}: ${tsp[2]} teaspoons of sugar.`) ? `${cap(name)}: ${tsp[2]} teaspoons of sugar.` : `${tsp[2]} teaspoons of sugar.`, line2: 'Watch where it goes.', ...(where ? { payoff: where.title } : {}) };
  if (h.caffeine) {
    // "still in you at bedtime" as the share the model says (critic: it promised a problem the end card then denied)
    const bed = h.chapters.find((c) => /^(Going to bed|Bedtime)$/.test(c.title) && /mg of caffeine is (?:still|left) in you/.test(c.text));
    const mg = bed && /(\d+) mg of caffeine is/.exec(bed.text)?.[1], fw = mg && h.caffeineMg ? share(Number(mg) / h.caffeineMg) : null;
    const line1 = fit(`${cap(name)}.`) ? `${cap(name)}.` : 'One coffee, 24 hours.';
    // round 6 (critic P1: "a fifth at bedtime" is honest but an anticlimax): a small share at bedtime gives way to the
    // toilet fact (1 in 3 people, within minutes), when the model tells it
    const colon = h.chapters.find((c) => /1 in 3 people coffee makes the lower bowel start moving/.test(c.text));
    if (colon && (!fw || Number(mg) / (h.caffeineMg ?? 1) < 0.3)) return { line1, line2: 'It sends 1 in 3 to the toilet.', payoff: colon.title };
    if (bed && fw) return { line1, line2: `${cap(fw)} is still in you at bedtime.`, payoff: bed.title };
    return { line1, line2: 'Watch where the caffeine goes.' };
  }
  if (h.solid && h.kcal && h.kcal >= 300 && fit(`${cap(name)}: ${Math.round(h.kcal)} kcal.`)) {
    // the kcal as the first chapter says them
    const k = /(\d+) kcal/.exec(first)?.[1];
    if (k) return { line1: `${cap(name)}: ${k} kcal.`, ...promise };
  }
  return { line1: fit(`${cap(name)}.`) ? `${cap(name)}.` : 'One meal, 24 hours.', line2: 'Watch where it goes.' };
}

/** The comparison's hook: a guess the video answers (the race out of the stomach comes from the model). */
export function hookForCompare(a: string, b: string, race: boolean): Hook {
  if (race) return { line1: 'Guess: which leaves your stomach first?', line2: commentLine(a, b) };
  const vs = `${a} vs ${b}.`;
  return { line1: fit(vs) ? vs : 'Two drinks, one day.', line2: 'Watch both, then guess.' };
}

/** "Comment: cola or water?" (round 5, critic: "Comment A or B" while nothing on screen was called A or B). */
export const commentLine = (a: string, b: string) => `Comment: ${a.toLowerCase()} or ${b.toLowerCase()}?`;

/** Numbers in a hook (for the honesty test: each must appear in the video's own chapters or name). */
export const numbersIn = (s: string) => s.match(/\d+(?:[.,:]\d+)?/g) ?? [];
