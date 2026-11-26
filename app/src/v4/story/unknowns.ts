// Phase P1: "What we don't know" (roadmap §0: no expert reviewer, so the limits are said on screen, each with its grade
// and sources). Picked by what the item has; at least one line for every item.
import type { Level } from '../../content/types';

export interface Unknown { key: string; text: string; grade: Level; sources: string[] }

export const UNKNOWNS: Record<string, Unknown> = {
  glucose: { key: 'glucose', grade: 'A', sources: ['berry2020', 'zeevi2015'],
    text: 'Blood sugar after the same food differs a lot between people (in large studies, about twice as high in some as in others). Our curve is a typical one; only a glucose sensor shows yours.' },
  noGi: { key: 'noGi', grade: '?', sources: ['atkinson2008', 'flint2004'],
    text: 'Nobody has measured the glycemic index of this food, so we don’t know how fast its carbs reach your blood. We leave the curve out rather than guess.' },
  caffeine: { key: 'caffeine', grade: 'A', sources: ['iom2001', 'grzegorzewski2021'],
    text: 'Caffeine’s half-life ranges from about 1.5 to 9.5 hours between people (smoking speeds it up; the pill and pregnancy slow it down). Yours can sit far from our typical clock.' },
  sweetener: { key: 'sweetener', grade: 'B', sources: ['tucker2017', 'pepino2015'],
    text: 'Whether low-calorie sweeteners change insulin is not settled: most short studies found no effect on blood sugar, a few found some. We draw no curve from the sweetener.' },
  alcohol: { key: 'alcohol', grade: 'A', sources: ['jones2016', 'jones2010'],
    text: 'Livers clear alcohol at about 0.10–0.25 g/L an hour, so the time until it is gone can differ by hours between people. No number here tells you when you can drive.' },
  fullness: { key: 'fullness', grade: 'B', sources: ['rolls2009', 'holt1995'],
    text: 'The Fullness rating is a population rule of thumb from energy density, protein, fiber and drink vs. food. How full you feel also depends on you, the rest of the meal and habit.' },
  body: { key: 'body', grade: 'C', sources: ['watson1980'],
    text: 'Every number is an estimate for one typical body of your size. Health conditions, medicines and genes can change it; this is not a measurement of you.' },
};

export interface UnknownIn { hasCurve: boolean; unknownSugar: boolean; carbsG: number; caffeineMg: number; alcoholG: number; kcal: number; sweetener: boolean }
/** The lines for one item, most specific first. */
export function unknownsOf(x: UnknownIn): Unknown[] {
  const out: Unknown[] = [];
  if (x.alcoholG > 1) out.push(UNKNOWNS.alcohol);
  if (x.caffeineMg >= 10) out.push(UNKNOWNS.caffeine);
  if (x.unknownSugar) out.push(UNKNOWNS.noGi);
  else if (x.hasCurve && x.carbsG >= 5) out.push(UNKNOWNS.glucose);
  if (x.sweetener) out.push(UNKNOWNS.sweetener);
  if (x.kcal >= 5) out.push(UNKNOWNS.fullness);
  out.push(UNKNOWNS.body);
  return out;
}
