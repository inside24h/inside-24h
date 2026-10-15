import { describe, expect, it } from 'vitest';
import { parseMeal } from './food/parse';
import { makeFoodProduct } from './food/foodProduct';
import { DEFAULT_PROFILE } from '../science/profile';

// QA 2026-10-15 #10: during "Alcohol peak" the blood label said "4.1 g sugar". For drinks with alcohol the blood
// shows blood alcohol (as a range, never one number) while there is any.
describe('liquid route labels', () => {
  it('beer: blood shows alcohol as a range at the alcohol peak', () => {
    const built = makeFoodProduct(parseMeal('beer'), 'food').build(DEFAULT_PROFILE, 63);
    const peak = built.story.chapters.find((c) => c.title === 'Alcohol peak')!;
    const blood = built.route!.segs(peak.min).blood!;
    expect(blood.text).toMatch(/^alcohol \d\.\d\d–\d\.\d\d ‰$/);
  });
  it('banana: blood still shows sugar', () => {
    const built = makeFoodProduct(parseMeal('banana'), 'food').build(DEFAULT_PROFILE, 63);
    for (const m of [20, 45, 90]) expect(built.route!.segs(m).blood?.text).toBeUndefined();
  });
});
