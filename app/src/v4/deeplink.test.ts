import { describe, expect, it } from 'vitest';
import { formatTime, isCuratedServing, mealText, parsePortion, parseTime, readLink, writeLink } from './deeplink';
import { parseMeal } from './food/parse';

describe('deep link time', () => {
  it('reads minutes, hours and the old plain-number form', () => {
    expect(parseTime('45m')).toBe(45);
    expect(parseTime('2h')).toBe(120);
    expect(parseTime('1h30m')).toBe(90);
    expect(parseTime('1.5h')).toBe(90);
    expect(parseTime('90')).toBe(90); // old links: #t=90
    expect(parseTime('0.4m')).toBe(0.4);
    expect(parseTime('99h')).toBe(1440); // clamped to the day
    expect(parseTime('soon')).toBeNull();
    expect(parseTime('')).toBeNull();
    expect(parseTime(null)).toBeNull();
  });
  it('writes short, readable times that read back to the same minute', () => {
    expect(formatTime(45)).toBe('45m');
    expect(formatTime(120)).toBe('2h');
    expect(formatTime(90.4)).toBe('1h30m');
    expect(formatTime(0.43)).toBe('0.4m');
    for (const m of [0, 0.4, 3.2, 5, 45, 59, 60, 61, 125, 719, 1440]) expect(parseTime(formatTime(m))).toBeCloseTo(m, 5);
  });
  it('accepts only the app portions', () => {
    expect(parsePortion('0.5')).toBe(0.5);
    expect(parsePortion('½')).toBe(0.5);
    expect(parsePortion('3')).toBe(3);
    expect(parsePortion('7')).toBe(1);
    expect(parsePortion(null)).toBe(1);
  });
});

describe('deep link round trip', () => {
  it('encodes food, amount, minute, view and comparison partner', () => {
    const h = writeLink({ q: 'cola', n: 2, t: 45, view: 'full', vs: 'glass of water' });
    expect(h).toBe('#q=cola&n=2&t=45m&view=full&vs=glass+of+water');
    expect(readLink(h)).toEqual({ q: 'cola', p: undefined, n: 2, t: 45, view: 'full', vs: 'glass of water' });
  });
  it('round-trips meals with grams and a "+"', () => {
    const l = { q: '118 g Banana + 250 g Milk', n: 0.5, t: 90, view: 'detailed' as const, vs: '30 g Almonds' };
    expect(readLink(writeLink(l))).toEqual({ ...l, p: undefined });
  });
  it('leaves defaults out', () => {
    expect(writeLink({ q: 'banana', n: 1, t: null, view: 'simple' })).toBe('#q=banana');
    expect(writeLink({})).toBe('');
  });
  it('keeps unrelated keys, drops stale UI keys and old aliases', () => {
    const h = writeLink({ q: 'cola', t: 20 }, '#p=espresso&t=5&dose=120&city=Zagreb&organ=liver&panel=body&compare=water');
    const p = new URLSearchParams(h.slice(1));
    expect(p.get('q')).toBe('cola');
    expect(p.get('t')).toBe('20m');
    expect(p.get('dose')).toBe('120');
    expect(p.get('city')).toBe('Zagreb');
    expect(p.has('p') || p.has('organ') || p.has('panel') || p.has('compare')).toBe(false);
  });
});

describe('old links keep working', () => {
  it('#q=banana', () => {
    expect(readLink('#q=banana')).toEqual({ q: 'banana', p: undefined, n: 1, t: null, view: 'simple', vs: undefined });
  });
  it('#q=… encoded with encodeURIComponent', () => {
    expect(readLink(`#q=${encodeURIComponent('118 g Banana + 250 g Milk')}`).q).toBe('118 g Banana + 250 g Milk');
  });
  it('#p=cola&t=90&view=detailed', () => {
    expect(readLink('#p=cola&t=90&view=detailed')).toMatchObject({ p: 'cola', t: 90, view: 'detailed', n: 1 });
  });
  it('#compare=… is the comparison partner', () => {
    expect(readLink('#q=cola&compare=diet%20cola').vs).toBe('diet cola');
  });
  it('junk does not break anything', () => {
    expect(readLink('#t=abc&n=9&view=weird')).toEqual({ q: undefined, p: undefined, n: 1, t: null, view: 'simple', vs: undefined });
    expect(readLink('')).toMatchObject({ n: 1, t: null, view: 'simple' });
  });
});

describe('food text in links', () => {
  it('uses the shortest text that parses back to the same food and grams', () => {
    expect(mealText(parseMeal('1 can of cola'))).toBe('cola');
    expect(mealText(parseMeal('glass of water'))).toBe('glass of water');
    expect(mealText(parseMeal('1 banana'))).toBe('banana');
    expect(mealText(parseMeal('200 g banana'))).toBe('200 g Banana');
  });
  it('round-trips through the hash', () => {
    for (const q of ['1 banana', 'pizza', 'beer', '200 g banana', '1 banana + glass of milk']) {
      const parts = parseMeal(q);
      const back = parseMeal(readLink(writeLink({ q: mealText(parts) })).q!);
      expect(back.map((p) => [p.food.id, Math.round(p.grams)])).toEqual(parts.map((p) => [p.food.id, Math.round(p.grams)]));
    }
  });
  it('curated servings are recognised (they reopen in their detailed model)', () => {
    expect(isCuratedServing(parseMeal('cola'))).toBe(true);
    expect(isCuratedServing(parseMeal('2 cans of cola'))).toBe(false);
    expect(isCuratedServing(parseMeal('banana'))).toBe(false);
  });
});
