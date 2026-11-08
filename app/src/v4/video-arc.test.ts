// v23: the story arc (video-facts arcFor) and its lints (video-narration lintNarration): no line that only restates the
// state, no clock times, the clearing time said one way only. The sweeps (video-narration, video-retention, text-audit)
// run the same lints over every item and cut.
import { describe, expect, it } from 'vitest';
import { arcClass, arcFor, type FactIn } from './video-facts';
import { lintNarration, restates, type NarrIn, type NarrLine } from './video-narration';
import { PRODUCTS } from './products';
import { partsOf } from './current-parts';
import { macros } from './food/parse';
import { auditItems } from './text-audit';

const nin: NarrIn = { plan: { seconds: 30, cues: [], introS: 0, outroS: 3 }, kind: 'single', seed: 1, alcohol: true };
const line = (t: number, text: string, id: NarrLine['id'] = 'card'): NarrLine => ({ id, t, slotS: 9, text, say: text, source: text });
const cls = (lint: ReturnType<typeof lintNarration>) => lint.map((i) => i.cls);

describe('v23 story arc', () => {
  it('flags a line that only restates the state', () => {
    for (const x of ['There is still alcohol in your blood.', 'A day later.', "That's one full day inside you.", 'Next day.']) expect(restates(x)).toBe(true);
    for (const x of ['Coffee won’t sober you up. Only time does.', 'Attention may already be worse.', 'And a day later?']) expect(restates(x)).toBe(false);
    expect(cls(lintNarration([line(5, 'There is still alcohol in your blood.')], nin))).toContain('restates without new info');
  });
  it('flags clock times and a clearing time said two ways', () => {
    expect(cls(lintNarration([line(5, 'At 7 AM, it should be cleared.')], nin))).toContain('clock time in narration');
    const two = lintNarration([line(5, 'The alcohol is gone after about 1–4 hours.'), line(12, 'Your liver needs about 3 hours to clear it.')], nin);
    expect(cls(two)).toContain('inconsistent time reference');
    expect(cls(lintNarration([line(5, 'From your first sip, the alcohol is gone after about 1–4 hours.')], nin))).not.toContain('inconsistent time reference');
  });
  it('classes and lines: numbers from the model, alcohol never positive, loop lines short', () => {
    const m = (x: Partial<NonNullable<FactIn['macros']>>) => ({ sugars: 0, availCarbs: 0, fat: 0, protein: 0, fiber: 0, satFat: 0, sodiumMg: 0, grams: 0, waterG: 0, gi: null, caffeineMg: 0, ...x }) as NonNullable<FactIn['macros']>;
    const wine: FactIn = { kcal: 127, alcoholG: 16, drink: true, macros: m({ sugars: 1, availCarbs: 4, grams: 150 }) };
    const cola: FactIn = { kcal: 139, caffeineMg: 32, drink: true, macros: m({ sugars: 35, availCarbs: 35, grams: 330 }), weightKg: 70 };
    const water: FactIn = { kcal: 0, drink: true, waterMl: 250, bodyWaterL: 42, macros: m({ grams: 250 }) };
    expect([arcClass(wine), arcClass(cola), arcClass(water)]).toEqual(['alcohol', 'sugar', 'water']);
    const a = arcFor(wine, 3);
    expect(a.hook.length).toBeGreaterThanOrEqual(2);
    expect(a.twist[0]).toMatch(/coffee/i);
    for (const x of [...a.hook, ...a.setup, ...a.twist, ...a.answer]) expect(x).not.toMatch(/\b(fun|enjoy|relax|cheers|reward|healthy|celebrate|buzz)\b/i);
    for (const x of [...a.hook, ...a.setup]) for (const n of x.match(/\d+/g) ?? []) expect(['16', '1', '127']).toContain(n);
    for (const f of [wine, cola, water]) for (const x of arcFor(f, 7).loop) expect(x.split(/\s+/).length).toBeLessThanOrEqual(5);
    expect(arcFor(cola, 1).setup[0]).toMatch(/^35 g of sugar, about 8 teaspoons\.$/);
  });
  it('every item carries its macros into the video path (curated products too: cola, espresso, water)', () => {
    const bad: string[] = [];
    for (const id of Object.keys(PRODUCTS)) { const ps = partsOf(id, []); if (!ps.length || !(macros(ps).grams > 0)) bad.push(`product ${id}`); }
    for (const it of auditItems()) if (!(it.x.macros.grams > 0)) bad.push(`item ${it.id}`);
    expect(bad).toEqual([]);
  });
});
