// "Your body": the few personal facts that really change the simulation, each with the source we read and its
// evidence level (upute.md §2). A factor is here only if a study we read shows the effect; where people differ
// the effect is a range. Claim IDs: research/espresso.md (M, Y), research/alcohol.md (A, H, PF).
//
// Checked and deliberately NOT added (no effect, or no usable number):
// - Age on caffeine: young (20 y) and elderly (71 y) men had essentially the same caffeine pharmacokinetics
//   (Blanchard & Sawers 1983, espresso.md A1, Y5). Age only enters through body water (Watson, men).
// - Body size / age / activity on the sugar curve: identical meals give very different responses and they are
//   predicted only with blood tests, gut microbes and a glucose sensor (Zeevi 2015, digestion-generic.md GL10).
// - Earlier pregnancy: caffeine clearance already falls before the last month (Knutti 1982, Yu 2016) but no
//   half-life number for early/mid pregnancy was read → only the last weeks are modelled.
// - Habitual caffeine use on the half-life: not correlated (Knutti 1982) → no change to the clock.
import type { Profile } from './profile';

export type Level = 'A' | 'B' | 'C';
export type FactorId = 'body' | 'smoker' | 'pill' | 'latePregnancy' | 'caffeineDaily' | 'withMeal';

export interface Factor {
  id: FactorId;
  /** what it does, in a few plain words (shown under the toggle and in answers) */
  effect: string;
  level: Level;
  claims: string; // dossier IDs
  sources: string[]; // keys in content/sources.ts
}

export const FACTORS: Record<FactorId, Factor> = {
  body: { id: 'body', effect: 'Sex, height and weight set how much water caffeine and alcohol spread into: smaller bodies get higher levels.',
    level: 'A', claims: 'espresso.md D4–D5; alcohol.md W3–W4', sources: ['watson1980', 'searle2015'] },
  // Parsons 1978: t½ 3.5 h smokers vs 6.0 h non-smokers (n = 13 + 13) → clears ≈ 1.7× faster
  smoker: { id: 'smoker', effect: 'Caffeine clears about 1.7× faster (half-life 3.5 h instead of 6 h).',
    level: 'A', claims: 'espresso.md M6', sources: ['parsons1978'] },
  // Patwardhan 1980: t½ 10.7 ± 3.0 h on the pill vs 6.2 ± 1.6 h
  pill: { id: 'pill', effect: 'Caffeine stays about 1.7× longer (half-life 10.7 h instead of 6.2 h).',
    level: 'A', claims: 'espresso.md M7', sources: ['patwardhan1980'] },
  // Parsons & Pelletier 1982: clearance 39% of non-pregnant (≈ 2.6×); Knutti 1982: t½ 3 h → 10.5 h (≈ 3.5×)
  latePregnancy: { id: 'latePregnancy', effect: 'Caffeine stays about 2.6–3.5× longer in the last month of pregnancy.',
    level: 'A', claims: 'espresso.md M8, M9, Y1', sources: ['parsons1982', 'knutti1982'] },
  // Robertson 1981: near-complete tolerance within 1–4 days. Lovallo 2004 (n = 97): after 5 days of 300–600 mg/day,
  // half lost the BP response completely, half not at all → on average about half (our reading, C on top of B).
  caffeineDaily: { id: 'caffeineDaily', effect: 'Caffeine’s blood-pressure bump is about half as big on average (for some none, for some unchanged).',
    level: 'B', claims: 'espresso.md Y2–Y4', sources: ['robertson1981', 'lovallo2004'] },
  // Jones 1997: 0.30 g/kg fasted peak 30.8 mg/dl vs 13.3–17.7 after a meal; gone 1–2 h sooner.
  // Kechagias 1999: 43.8 vs 17.5 mg/dl 1 h after breakfast. → fed peak ≈ 40–57% of fasted.
  withMeal: { id: 'withMeal', effect: 'Alcohol peaks at roughly half (40–57%) of the empty-stomach level and is gone 1–2 h sooner.',
    level: 'A', claims: 'alcohol.md A2, PF1; beer.md H1–H2', sources: ['jones1997', 'kechagias1999'] },
};

/** Lovallo 2004: half complete tolerance, half none → mean factor 0.5, person range 0–1 (B/C). */
export const CAFFEINE_DAILY_BP = { mean: 0.5, range: [0, 1] as const };

/** Measured fed/fasted peak ratios (Jones 1997: 13.3/30.8 … 17.7/30.8; Kechagias 1999: 17.5/43.8). */
export const FED_PEAK_RATIO = [17.5 / 43.8, 17.7 / 30.8] as const; // ≈ 0.40–0.57

/** Factor on caffeine's blood-pressure rise for this person. */
export const caffeineBpFactor = (p: Pick<Profile, 'caffeineDaily'>) => (p.caffeineDaily ? CAFFEINE_DAILY_BP.mean : 1);

/** Alcohol is absorbed "fed" if the meal itself has food in it or the person has just eaten. */
export const fedForAlcohol = (mealFed: boolean | undefined, p: Pick<Profile, 'withMeal'>) => !!mealFed || !!p.withMeal;

/** The person-specific factors switched on in this profile (body size always counts). */
export function activeFactors(p: Profile): FactorId[] {
  const out: FactorId[] = ['body'];
  if (p.smoker) out.push('smoker');
  if (p.sex === 'female' && p.oralContraceptives) out.push('pill');
  if (p.sex === 'female' && p.latePregnancy) out.push('latePregnancy');
  if (p.caffeineDaily) out.push('caffeineDaily');
  if (p.withMeal) out.push('withMeal');
  return out;
}

/** What the quick answers need to say "for you" honestly. */
export interface PersonalNotes {
  factors: FactorId[];
  halfLifeH: number; // this person's caffeine half-life
  /** short reason for a changed half-life, e.g. "you smoke" */
  halfLifeWhy: string | null;
  withMeal: boolean;
  pregnant: boolean;
}

export function personalNotes(p: Profile, halfLifeH: number): PersonalNotes {
  const f = activeFactors(p);
  const why = [f.includes('smoker') && 'you smoke', f.includes('pill') && 'the pill', f.includes('latePregnancy') && 'pregnancy']
    .filter(Boolean).join(' + ');
  return { factors: f, halfLifeH, halfLifeWhy: why || null, withMeal: f.includes('withMeal'), pregnant: f.includes('latePregnancy') };
}
