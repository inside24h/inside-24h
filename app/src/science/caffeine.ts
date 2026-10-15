// Caffeine parameters. Every number points to research/espresso.md (claim IDs in brackets).
import { kaFromTmax, keFromHalfLife, type PKParams } from './pk';

export interface Person {
  weightKg: number;
  smoker: boolean;
  oralContraceptives: boolean;
  latePregnancy: boolean;
}

export const DEFAULT_PERSON: Person = { weightKg: 70, smoker: false, oralContraceptives: false, latePregnancy: false };

export const CAFFEINE = {
  vdLPerKg: 0.65, // [D5] 0.61–0.72 L/kg
  halfLifeH: 6.0, // [M6, M7] non-smoking controls: 6.0 h and 6.2 h
  halfLifeRangeH: [2.5, 10] as const, // [M4]
  tmaxH: 0.75, // [D2] peak 30–120 min; 45 min chosen as typical (level C)
  bioavailability: 1.0, // [D1] complete absorption, negligible first pass
  modifiers: {
    smoker: 3.5 / 6.0, // [M6]
    oralContraceptives: 10.7 / 6.2, // [M7]
    latePregnancy: 1 / 0.39, // [M8, M9] clearance 39% of non-pregnant, Vd assumed unchanged
  },
};

/** Half-life for a given person. Modifiers multiply; combining them is our estimate (level C). */
export function caffeineHalfLife(person: Person): number {
  let h = CAFFEINE.halfLifeH;
  if (person.smoker) h *= CAFFEINE.modifiers.smoker;
  if (person.oralContraceptives) h *= CAFFEINE.modifiers.oralContraceptives;
  if (person.latePregnancy) h *= CAFFEINE.modifiers.latePregnancy;
  return h;
}

export function caffeineParams(doseMg: number, person: Person = DEFAULT_PERSON): PKParams {
  const ke = keFromHalfLife(caffeineHalfLife(person));
  return {
    doseMg,
    bioavailability: CAFFEINE.bioavailability,
    vdL: CAFFEINE.vdLPerKg * person.weightKg,
    ka: kaFromTmax(ke, CAFFEINE.tmaxH),
    ke,
  };
}
