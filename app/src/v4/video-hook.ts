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
}
export interface Hook { line1: string; line2: string }
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const fit = (s: string, max = 7) => words(s) <= max;
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
    if (wake) return { line1: `Still in your blood at ${wake}.`, line2: fit(beers) ? beers : 'Watch what alcohol does.' };
    return { line1: fit(beers) ? beers : 'One drink, 24 hours.', line2: 'Watch what alcohol does.' };
  }
  // food: its calories lead (a whole pizza is about its size, not its teaspoons)
  if (h.solid) {
    const k = /(\d+) kcal/.exec(first)?.[1];
    if (k && Number(k) >= 300) return { line1: fit(`${cap(name)}: ${k} kcal.`) ? `${cap(name)}: ${k} kcal.` : `One meal: ${k} kcal.`, line2: 'Watch it for 24 hours.' };
  }
  const tsp = /(\d+) g (?:of )?sugar[^.]*?about (\d+) teaspoons?/.exec(first);
  if (tsp && Number(tsp[2]) >= 3) return { line1: `${tsp[2]} teaspoons of sugar.`, line2: 'Watch where it goes.' };
  if (h.caffeine) {
    const bed = h.chapters.find((c) => /^(Going to bed|Bedtime)$/.test(c.title) && /mg of caffeine is (?:still|left) in you/.test(c.text));
    return { line1: fit(`${cap(name)}.`) ? `${cap(name)}.` : 'One coffee, 24 hours.', line2: bed ? 'Still in you at bedtime.' : 'Watch where the caffeine goes.' };
  }
  if (h.solid && h.kcal && h.kcal >= 300 && fit(`${cap(name)}: ${Math.round(h.kcal)} kcal.`)) {
    // the kcal as the first chapter says them
    const k = /(\d+) kcal/.exec(first)?.[1];
    if (k) return { line1: `${cap(name)}: ${k} kcal.`, line2: 'Watch it for 24 hours.' };
  }
  return { line1: fit(`${cap(name)}.`) ? `${cap(name)}.` : 'One meal, 24 hours.', line2: 'Watch where it goes.' };
}

/** The comparison's hook: a guess the video answers (the race out of the stomach comes from the model). */
export function hookForCompare(a: string, b: string, race: boolean): Hook {
  if (race) return { line1: 'Guess: which leaves your stomach first?', line2: 'Comment A or B before the end.' };
  const vs = `${a} vs ${b}.`;
  return { line1: fit(vs) ? vs : 'Two drinks, one day.', line2: 'Watch both, then guess.' };
}

/** Numbers in a hook (for the honesty test: each must appear in the video's own chapters or name). */
export const numbersIn = (s: string) => s.match(/\d+(?:[.,:]\d+)?/g) ?? [];
