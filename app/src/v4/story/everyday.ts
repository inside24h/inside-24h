// Phase P1: everyday anchors ("≈ 9 sugar cubes", "≈ 2 espressos"), each with its source. No exercise anchors: kcal is
// shown only as a number and as a share of the 2,000 kcal reference day (owner decision 2026-11-24).
import type { Level } from '../../content/types';
import { DV } from '../video-facts';

export interface Anchor { key: string; per: number; unit: string; one: string; many: string; grade: Level; sources: string[]; note: string }

/** One table; `per` is how much of the thing one anchor unit holds. */
export const ANCHORS = {
  sugarCube: { key: 'sugarCube', per: 4, unit: 'g', one: 'sugar cube', many: 'sugar cubes', grade: 'A', sources: ['usdaSR'], note: 'A sugar cube or a level teaspoon of sugar holds about 4 g (USDA).' },
  espresso: { key: 'espresso', per: 63, unit: 'mg', one: 'espresso', many: 'espressos', grade: 'A', sources: ['usda171891'], note: 'One 30 ml espresso has about 63 mg of caffeine (USDA).' },
  stdDrink: { key: 'stdDrink', per: 14, unit: 'g', one: 'US standard drink', many: 'US standard drinks', grade: 'A', sources: ['niaaaStdDrink'], note: 'A US standard drink is 14 g of pure alcohol (NIAAA).' },
  glass: { key: 'glass', per: 250, unit: 'ml', one: 'glass', many: 'glasses', grade: 'C', sources: ['usdaSR'], note: 'A glass is 250 ml (our household assumption, as everywhere in the app).' },
} as const satisfies Record<string, Anchor>;

/** Reference amounts (labels and official bodies), never a target for the person. */
export const REFERENCE = {
  kcalDay: { value: DV.kcal, unit: 'kcal', grade: 'A' as Level, sources: ['fdaDV'], note: 'The 2,000 kcal day used on food labels.' },
  caffeineSingle: { value: 200, unit: 'mg', grade: 'A' as Level, sources: ['efsa2015'], note: 'EFSA: single doses up to 200 mg raise no safety concern for healthy adults.' },
  caffeineDay: { value: 400, unit: 'mg', grade: 'A' as Level, sources: ['efsa2015'], note: 'EFSA: up to 400 mg a day raises no safety concern for healthy adults.' },
  freeSugarsWho: { value: 50, unit: 'g', grade: 'A' as Level, sources: ['who2015'], note: 'WHO: free sugars under 10% of energy (about 50 g a day), ideally under 5% (about 25 g).' },
  freeSugarsWhoIdeal: { value: 25, unit: 'g', grade: 'A' as Level, sources: ['who2015'], note: 'WHO: ideally under 5% of energy, about 25 g a day.' },
  saltWho: { value: 5, unit: 'g', grade: 'A' as Level, sources: ['whoSalt'], note: 'WHO: under 5 g of salt (2,000 mg of sodium) a day for adults.' },
  dvSodiumMg: { value: DV.sodiumMg, unit: 'mg', grade: 'A' as Level, sources: ['fdaDV'], note: 'FDA Daily Value for sodium.' },
  dvFiber: { value: DV.fiber, unit: 'g', grade: 'A' as Level, sources: ['fdaDV'], note: 'FDA Daily Value for dietary fiber.' },
  dvProtein: { value: DV.protein, unit: 'g', grade: 'A' as Level, sources: ['fdaDV'], note: 'FDA Daily Value for protein.' },
  dvSatFat: { value: DV.satFat, unit: 'g', grade: 'A' as Level, sources: ['fdaDV'], note: 'FDA Daily Value for saturated fat.' },
  dvAddedSugars: { value: 50, unit: 'g', grade: 'A' as Level, sources: ['fdaDV'], note: 'FDA Daily Value for added sugars (we count the WHO free sugars against it).' },
} as const;

/** Readable count of anchor units: "about 9", "about 1½", "under 1". */
export function anchorCount(value: number, a: Anchor): number {
  const n = value / a.per;
  return n >= 3 ? Math.round(n) : Math.round(n * 2) / 2;
}
/** "≈ 9 sugar cubes", "≈ 1 espresso", or '' when under half a unit. */
export function anchorText(value: number, a: Anchor): string {
  const n = anchorCount(value, a);
  if (n < 0.5) return '';
  const s = Number.isInteger(n) ? String(n) : `${Math.floor(n) || ''}½`;
  return `≈ ${s} ${n <= 1 ? a.one : a.many}`;
}
