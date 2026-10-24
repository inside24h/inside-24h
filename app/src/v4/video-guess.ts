// The comparison video's guess and its answer (2026-10-24 round 4: "the guess was never answered"). The video asks
// one question the model can answer CLEARLY for this pair, shows the answer the moment it is decided ("Beer is out
// of the stomach first: after about 50 min"), and the end card asks "Did you guess right?" about that answer, with
// the overall verdict (analyze.ts verdictOf) as a separate line. A question whose answer is a tie or a near-tie is
// never asked: then the next question is tried, and if none is clear there is no guess at all.

export type GuessKind = 'stomach' | 'blood' | 'sugar';
export interface GuessSide {
  name: string;
  alcohol?: boolean;
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

/** The clearest question for this pair, or null when the model does not separate them clearly. */
export function chooseGuess(a: GuessSide, b: GuessSide): Guess | null {
  const sides = [a, b];
  // 1) out of the stomach first
  const so = sides.map((s) => outAt(s.stomach));
  if (so[0] !== undefined && so[1] !== undefined && clearlyApart(so[0], so[1])) {
    const w = (so[0] < so[1] ? 0 : 1) as 0 | 1;
    return { kind: 'stomach', question: 'Guess: which leaves your stomach first?', winner: w, decidedMin: so[w]!,
      answer1: `First out: ${the(sides[w].name)}.`, answer2: `Out of the stomach in ${aboutTime(so[w]!)}.`,
      recap: `Answer: ${sides[w].name} left the stomach first.`, progress: [race(a.stomach!), race(b.stomach!)] };
  }
  // 2) out of the blood first (alcohol under 0.005 g/L; caffeine under 10 mg); one still there at 24 h counts as later
  const blood = (s: GuessSide) => (s.bac && Math.max(...Array.from(s.bac)) > 0.05 ? { out: outAt(s.bac, 0.005), series: s.bac, floor: 0.005 }
    : s.caffeine && Math.max(...Array.from(s.caffeine)) >= 20 ? { out: outAt(s.caffeine, 10), series: s.caffeine, floor: 10 } : null);
  const bl = sides.map(blood);
  if (bl[0] && bl[1]) {
    const t = bl.map((x) => x!.out ?? 1e9);
    if (Math.min(t[0], t[1]) < 1e9 && clearlyApart(Math.min(t[0], 1440), Math.min(t[1], 1440))) {
      const w = (t[0] < t[1] ? 0 : 1) as 0 | 1;
      return { kind: 'blood', question: 'Guess: which is out of your blood first?', winner: w, decidedMin: t[w],
        answer1: `First out: ${the(sides[w].name)}.`, answer2: `Out of the blood in ${aboutTime(t[w])}.`,
        recap: `Answer: ${sides[w].name} left the blood first.`, progress: [race(bl[0].series, bl[0].floor), race(bl[1].series, bl[1].floor)] };
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
export function guessSideOf(x: { label: string; glucose?: ArrayLike<number> | null; built: { route?: { segs: (m: number) => Partial<Record<string, { amount: number }>> } | null; caffeine: { doseMg: number; body: ArrayLike<number> }; bac?: ArrayLike<number>; alcoholG?: number } }): GuessSide {
  const r = x.built.route;
  return {
    name: x.label, alcohol: (x.built.alcoholG ?? 0) > 1,
    stomach: r ? Float32Array.from({ length: N }, (_, m) => r.segs(m).stomach?.amount ?? 0) : null,
    caffeine: x.built.caffeine.doseMg >= 10 ? x.built.caffeine.body : null,
    bac: (x.built.alcoholG ?? 0) > 1 ? x.built.bac ?? null : null,
    sugar: x.glucose ? Float32Array.from({ length: N }, (_, m) => (x.glucose![m] ?? 0) / 18.016) : null,
  };
}
