// The person the simulation is about. Only fields with a documented effect on a result are used in models;
// see research/espresso.md for each link.

export type Sex = 'female' | 'male';

export interface Profile {
  sex: Sex;
  ageY: number;
  heightCm: number;
  weightKg: number;
  smoker: boolean;
  oralContraceptives: boolean;
  latePregnancy: boolean;
  /** has caffeine most days: smaller blood-pressure bump (science/personal.ts, espresso.md Y2–Y4) */
  caffeineDaily?: boolean;
  /** has just eaten a meal (≈ last hour): alcohol absorbed "fed" (science/personal.ts, alcohol.md PF1) */
  withMeal?: boolean;
  // Starting values. If the person knows their own, they enter them; otherwise typical healthy values are used.
  restingHr: number; // beats/min
  sbp: number; // mmHg
  dbp: number; // mmHg
  glucoseMgDl: number; // fasting
  spo2: number; // %
  // Clock
  drinkAtMin: number; // minutes after midnight
  bedtimeMin: number;
  wakeMin: number;
  // Activity (used by the health bars; effects in research/activity.md)
  steps: 'low' | 'mid' | 'high'; // < 5,000 / 5,000–10,000 / > 10,000 a day
  exercise: 'none' | 'some' | 'regular'; // none / 1–2× a week / 3+× a week
  kmPerWeek: number; // walked or run
  glucoseUnit: 'mg/dL' | 'mmol/L';
  // Where you are today: sets the air temperature for the hydration model (src/v4/climate)
  city?: string;
  airCon?: boolean; // mostly indoors with air-conditioning
}

/** Typical healthy starting values, all inside the normal ranges (AHA: HR 60–100, BP < 120/80; ADA fasting glucose < 100 mg/dL; SpO2 95–100%). */
export const HEALTHY_VITALS = { restingHr: 70, sbp: 115, dbp: 75, glucoseMgDl: 90, spo2: 98 };

export const DEFAULT_PROFILE: Profile = {
  sex: 'male', ageY: 35, heightCm: 175, weightKg: 70,
  smoker: false, oralContraceptives: false, latePregnancy: false,
  ...HEALTHY_VITALS,
  drinkAtMin: 16 * 60, bedtimeMin: 23 * 60, wakeMin: 7 * 60,
  steps: 'mid', exercise: 'none', kmPerWeek: 0,
  glucoseUnit: 'mmol/L',
  city: 'Zagreb, Croatia',
};

/** Same body size, healthy defaults: the comparison person in the charts. */
export function healthyTwin(p: Profile): Profile {
  return { ...DEFAULT_PROFILE, sex: p.sex, ageY: p.ageY, heightCm: p.heightCm, weightKg: p.weightKg,
    drinkAtMin: p.drinkAtMin, bedtimeMin: p.bedtimeMin, wakeMin: p.wakeMin, glucoseUnit: p.glucoseUnit,
    steps: p.steps, exercise: p.exercise, kmPerWeek: p.kmPerWeek, withMeal: p.withMeal };
}

/** Watson PE et al. 1980, Am J Clin Nutr 33:27. Total body water in litres. */
export function totalBodyWaterL(p: Pick<Profile, 'sex' | 'ageY' | 'heightCm' | 'weightKg'>): number {
  return p.sex === 'male'
    ? 2.447 - 0.09516 * p.ageY + 0.1074 * p.heightCm + 0.3362 * p.weightKg
    : -2.097 + 0.1069 * p.heightCm + 0.2466 * p.weightKg;
}

export const MG_DL_PER_MMOL_L = 18.016; // glucose molar mass 180.16 g/mol
export const formatGlucose = (mgDl: number, unit: Profile['glucoseUnit']) =>
  unit === 'mg/dL' ? `${Math.round(mgDl)}` : (mgDl / MG_DL_PER_MMOL_L).toFixed(1);
