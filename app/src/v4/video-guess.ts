// The comparison video's guess and its answer (2026-10-24 round 4: "the guess was never answered"). The video asks
// one question the model can answer CLEARLY for this pair, shows the answer the moment it is decided ("Beer is out
// of the stomach first: after about 50 min"), and the end card asks "Did you guess right?" about that answer, with
// the overall verdict (analyze.ts verdictOf) as a separate line. A question whose answer is a tie or a near-tie is
// never asked: then the next question is tried, and if none is clear there is no guess at all.

export type GuessKind = 'stomach' | 'blood' | 'sugar' | 'bedtime';
export interface GuessSide {
  name: string;
  alcohol?: boolean;
  /** round 5: how much went in (the most the stomach held, ml or g): the stomach race is only asked when both are
   *  within ±10 % (critic: 30 ml espresso vs 500 ml beer, 330 ml cola vs 250 ml water made it trivial) */ amount?: number;
  /** what is in the stomach per minute (0..1440), from the route model */ stomach?: ArrayLike<number> | null;
  /** caffeine (mg in the body) and blood alcohol (g/L) per minute */ caffeine?: ArrayLike<number> | null; bac?: ArrayLike<number> | null;
  /** blood sugar change per minute (mmol/L), when the food has a measured curve */ sugar?: ArrayLike<number> | null;
}
export interface Guess {
  kind: GuessKind; question: string;
  winner: 0 | 1;          // the side that is out first / rises more
  decidedMin: number;     // the minute the answer is decided (the winner is out; or the bigger peak)
  answer1: string; answer2: string; // the answer beat ("Beer is out first." / "Out of the stomach after about 50 min.")
  recap: string;          // end card: "Answer: beer left the stomach first."
  progress: [Float32Array, Float32Array]; // the race bars, 0..1 per minute (1 = out)
}
const N = 1441;
/** First minute after the most it held that it is under 3 % of that (out), or undefined. */
export function outAt(series: ArrayLike<number> | null | undefined, floor = 0): number | undefined {
  if (!series || series.length < N) return undefined;
  let mx = 0, full = 0;
  for (let m = 0; m < N; m++) if (series[m] > mx) { mx = series[m]; full = m; }
  if (mx <= floor) return undefined;
  for (let m = full + 1; m < N; m++) if (series[m] < Math.max(mx * 0.03, floor)) return m;
  return undefined;
}
function race(series: ArrayLike<number>, floor = 0): Float32Array {
  let mx = 0, full = 0; for (let m = 0; m < N; m++) if (series[m] > mx) { mx = series[m]; full = m; }
  const done = outAt(series, floor) ?? Infinity;
  return Float32Array.from({ length: N }, (_, m) => (m <= full ? 0 : m >= done ? 1 : Math.max(0, Math.min(0.99, 1 - series[m] / (mx || 1)))));
}
/** "about 50 min", "about 3 h", "about 1½ h" (plain words for the answer). */
export function aboutTime(min: number): string {
  if (min < 55) return `about ${Math.max(5, Math.round(min / 5) * 5)} min`;
  const h = Math.round(min / 30) / 2, whole = Math.floor(h);
  return `about ${whole}${h - whole >= 0.5 ? '½' : ''} h`;
}
/** Two times are clearly different: at least 15 minutes and 25 % apart. */
export const clearlyApart = (a: number, b: number) => Math.abs(a - b) >= Math.max(15, 0.25 * Math.max(a, b));
const the = (n: string) => n;
/** Both sides about the same amount (±10 %): a fair race out of the stomach. Unknown amounts are measured from the
 *  stomach curves. */
export function sameAmount(a: GuessSide, b: GuessSide): boolean {
  const amt = (s: GuessSide) => s.amount ?? (s.stomach ? Math.max(0, ...Array.from(s.stomach)) : NaN);
  const x = amt(a), y = amt(b);
  return x > 0 && y > 0 && Math.abs(x - y) <= 0.1 * Math.max(x, y);
}

/** The clearest question for this pair, or null when the model does not separate them clearly. */
export function chooseGuess(a: GuessSide, b: GuessSide, opts: { bedMin?: number } = {}): Guess | null {
  const sides = [a, b];
  const anyAlcohol = !!(a.alcohol || b.alcohol);
  // 1) out of the stomach first
  const so = sides.map((s) => outAt(s.stomach));
  if (so[0] !== undefined && so[1] !== undefined && sameAmount(a, b) && clearlyApart(so[0], so[1])) {
    const w = (so[0] < so[1] ? 0 : 1) as 0 | 1;
    return { kind: 'stomach', question: 'Guess: which leaves your stomach first?', winner: w, decidedMin: so[w]!,
      answer1: `First out: ${the(sides[w].name)}.`, answer2: `Out of the stomach in ${aboutTime(so[w]!)}.`,
      recap: `Answer: ${sides[w].name} left the stomach first.`, progress: [race(a.stomach!), race(b.stomach!)] };
  }
  // 2) out of the blood first (alcohol under 0.005 g/L; caffeine under 10 mg); one still there at 24 h counts as later
  const blood = (s: GuessSide) => (s.bac && Math.max(...Array.from(s.bac)) > 0.05 ? { out: outAt(s.bac, 0.005), series: s.bac, floor: 0.005 }
    : s.caffeine && Math.max(...Array.from(s.caffeine)) >= 20 ? { out: outAt(s.caffeine, 10), series: s.caffeine, floor: 10 } : null);
  const bl = sides.map(blood);
  // (round 6, critic P0: "which leaves your blood first?" was won by the beer, with an unstated "under 10 mg" for
  // caffeine. With alcohol on a side the blood question is never asked; "still in you at bedtime" is, below)
  if (!anyAlcohol && bl[0] && bl[1]) {
    const t = bl.map((x) => x!.out ?? 1e9);
    if (Math.min(t[0], t[1]) < 1e9 && clearlyApart(Math.min(t[0], 1440), Math.min(t[1], 1440))) {
      const w = (t[0] < t[1] ? 0 : 1) as 0 | 1;
      return { kind: 'blood', question: 'Guess: which leaves your blood first?', winner: w, decidedMin: t[w],
        answer1: `First out: ${the(sides[w].name)}.`, answer2: `Out of the blood in ${aboutTime(t[w])}.`,
        recap: `Answer: ${sides[w].name} left the blood first.`, progress: [race(bl[0].series, bl[0].floor), race(bl[1].series, bl[1].floor)] };
    }
  }
  // 2b) with alcohol on a side: which is still in you at bedtime (each side says how much; nobody "wins")
  const bed = opts.bedMin !== undefined ? Math.round(opts.bedMin) : -1;
  if (anyAlcohol && bed >= 60 && bed <= 1440) {
    const left = sides.map((s) => (s.bac ? { still: (s.bac[bed] ?? 0) >= 0.01, what: 'alcohol' as const, v: s.bac[bed] ?? 0 } : s.caffeine ? { still: (s.caffeine[bed] ?? 0) >= 5, what: 'caffeine' as const, v: s.caffeine[bed] ?? 0 } : null));
    if (left[0] && left[1] && left[0].still !== left[1].still) {
      const w = (left[0].still ? 0 : 1) as 0 | 1, x = left[w]!, other = sides[1 - w].name;
      const flat = Float32Array.from({ length: N }, () => 0);
      return { kind: 'bedtime', question: 'Guess: which is still in you at bedtime?', winner: w, decidedMin: bed,
        answer1: `Still in you at bedtime: ${the(sides[w].name)}.`,
        answer2: x.what === 'caffeine' ? `About ${Math.round(x.v)} mg of caffeine. The ${other.toLowerCase()} is out.` : `Some alcohol. The ${other.toLowerCase()} is out.`,
        recap: `Answer: ${sides[w].name} was still in you at bedtime.`, progress: [flat, flat] };
    }
  }
  // 3) the bigger blood sugar rise (only when both have a measured curve, and the peaks differ clearly)
  const pk = sides.map((s) => { if (!s.sugar) return null; let mx = 0, at = 0; for (let m = 0; m < Math.min(N, s.sugar.length); m++) if (s.sugar[m] > mx) { mx = s.sugar[m]; at = m; } return { mx, at }; });
  if (pk[0] && pk[1] && Math.abs(pk[0].mx - pk[1].mx) >= 0.5 && Math.abs(pk[0].mx - pk[1].mx) >= 0.3 * Math.max(pk[0].mx, pk[1].mx)) {
    const w = (pk[0].mx > pk[1].mx ? 0 : 1) as 0 | 1;
    const rel = (s: ArrayLike<number>, mx: number) => Float32Array.from({ length: N }, (_, m) => Math.max(0, Math.min(1, (s[m] ?? 0) / (mx || 1))));
    const top = Math.max(pk[0].mx, pk[1].mx);
    return { kind: 'sugar', question: 'Guess: which raises your blood sugar more?', winner: w, decidedMin: pk[w]!.at,
      answer1: `Bigger rise: ${the(sides[w].name)}.`, answer2: 'Its blood sugar goes up more.',
      recap: `Answer: ${sides[w].name} raised blood sugar more.`, progress: [rel(a.sugar!, top), rel(b.sugar!, top)] };
  }
  return null;
}

/** A side of the race from the app's analysis of one food or drink (Compare / analyze.ts). */
export function guessSideOf(x: { label: string; glucose?: ArrayLike<number> | null; built: { route?: { segs: (m: number) => Partial<Record<string, { amount: number }>> } | null; caffeine: { doseMg: number; body: ArrayLike<number> }; bac?: ArrayLike<number>; alcoholG?: number } }, name?: string): GuessSide {
  const r = x.built.route;
  const stomach = r ? Float32Array.from({ length: N }, (_, m) => r.segs(m).stomach?.amount ?? 0) : null;
  return {
    name: name ?? x.label, alcohol: (x.built.alcoholG ?? 0) > 1, amount: stomach ? Math.max(0, ...Array.from(stomach)) : undefined,
    stomach,
    caffeine: x.built.caffeine.doseMg >= 10 ? x.built.caffeine.body : null,
    bac: (x.built.alcoholG ?? 0) > 1 ? x.built.bac ?? null : null,
    sugar: x.glucose ? Float32Array.from({ length: N }, (_, m) => (x.glucose![m] ?? 0) / 18.016) : null,
  };
}
