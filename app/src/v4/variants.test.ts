// Variants, builders, add-ins, sizes and "Which …?" choosers (2026-10-18, research/audit/VARIANTS-DONE.md).
import { describe, expect, it } from 'vitest';
import {
  FOODS, FOOD_BY_ID, baseOf, choiceRow, defaultSel, deriveFood, foodFromKey, foodKey, isPlain, macros, mixParts, parseMeal, servingPart, sizesOf,
  suggest, variantRow, type Builder, type Food, type Part,
} from './food/parse';
import { addParts, isDrink, mealCode, mealFromCode, setFood } from './food/meal';
import { isCuratedServing, linkFor, linkParts, readLink, resolveLink, writeLink } from './deeplink';
import { analyze } from './analyze';
import { DEFAULT_PROFILE } from '../science/profile';
import { FOOD_CLAIMS } from '../content/food';

const key1 = (q: string) => parseMeal(q).map((p) => [foodKey(p.food), Math.round(p.grams)]);
const kcal = (f: Food, grams = f.serving.grams) => (f.p.kcal * grams) / 100;
const fat = (f: Food) => ((f.p.fat ?? 0) * f.serving.grams) / 100;

// [typed text, [[food key, grams]]]: one thing, of the right kind, never split into separate foods
const GOLDEN: [string, [string, number][]][] = [
  ['pizza sa šunkom i gljivama', [['pizza_base_ham_mushrooms', 138]]],
  ['pizza capricciosa', [['pizza_base_ham_mushrooms', 138]]],
  ['2 slices of pizza with ham', [['pizza_base_ham', 256]]],
  ['pizza i pivo', [['pizza', 107], ['beer', 502]]],
  ['burek sa sirom', [['burek_cheese', 150]]],
  ['burek s mesom', [['burek_meat', 150]]],
  ['burek sa sirom i jogurt', [['burek_cheese', 150], ['yogurt-plain', 245]]],
  ['zeljanica', [['burek_spinach', 150]]],
  ['kava sa šećerom', [['espresso~sugar1', 34]]],
  ['kava s mlijekom', [['coffee-with-milk', 200]]],
  ['espresso s mlijekom', [['coffee-with-milk.macchiato', 61]]],
  ['čaj s medom', [['black-tea~honey1', 257]]],
  ['gemišt', [['white-wine.spritzer', 200]]],
  ['bevanda', [['red-wine.bevanda', 200]]],
  ['radler', [['beer.radler', 512]]],
  ['bezalkoholno pivo', [['beer.alcohol-free', 500]]],
  ['pljeskavica', [['hamburger_pljeskavica', 315]]],
  ['cheeseburger', [['hamburger_cheeseburger', 119]]],
  ['kebab', [['kebab', 250]]],
  ['kebab s teletinom', [['kebab_pita_beef_tomato_onion_yogurt', 250]]],
  ['tost', [['sandwich-ham_toast', 109]]],
  ['domaća rakija', [['rakija.50', 38]]],
  ['decaf espresso', [['espresso.decaf', 30]]],
  ['grah s kobasicom', [['bean-soup.sausage', 250]]],
  ['pureća šunka', [['ham.turkey', 28]]],
];
describe('search: builders, variants and add-ins stay ONE thing', () => {
  for (const [q, want] of GOLDEN) it(JSON.stringify(q), () => expect(key1(q)).toEqual(want));
});

describe('"Which …?" choosers: a word that names several foods asks, and starts on the usual one', () => {
  const ASK: [string, string, string, string[]][] = [
    ['čaj', 'black-tea', 'Which tea?', ['Black', 'Green', 'Herbal', 'Iced']],
    ['tea', 'black-tea', 'Which tea?', ['Black', 'Green', 'Herbal', 'Iced']],
    ['kava', 'espresso', 'Which coffee?', ['Espresso', 'Filter', 'With milk', 'Cappuccino', 'Latte']],
    ['coffee', 'filter-coffee', 'Which coffee?', ['Espresso', 'Filter', 'With milk', 'Cappuccino', 'Latte']],
    ['sok', 'orange-juice', 'Which juice?', ['Orange', 'Apple', 'Tomato']],
    ['juice', 'orange-juice', 'Which juice?', ['Orange', 'Apple', 'Tomato']],
    ['mlijeko', 'milk-whole', 'Which milk?', ['Whole', '2%', 'Skim']],
    ['sir', 'cheese-gouda', 'Which cheese?', ['Gouda', 'Cheddar', 'Mozzarella', 'Feta', 'Cottage', 'Parmesan']],
    ['kruh', 'bread-white', 'Which bread?', ['White', 'Wholemeal', 'Rye', 'Baguette', 'Roll']],
    ['vino', 'red-wine', 'Which wine?', ['Red', 'White', 'Rosé', 'Spritzer', 'With water', 'Dessert']],
    ['kobasica', 'sausage', 'Which sausage?', ['Pork', 'Smoked', 'Bratwurst', 'Chicken', 'Hot dog']],
  ];
  for (const [q, id, ask, chips] of ASK) {
    it(q, () => {
      const [p] = parseMeal(q);
      expect(p.food.id).toBe(id);
      expect(p.ask).toBe(true);
      const row = choiceRow(p.food)!;
      expect(row.ask).toBe(ask);
      expect(row.opts.map((o) => o.chip)).toEqual(chips);
      expect(row.opts.filter((o) => o.on).length).toBe(1);
    });
  }
  it('a specific name does not ask ("zeleni čaj", "crno vino")', () => {
    expect(parseMeal('zeleni čaj')[0].ask).toBeUndefined();
    expect(parseMeal('crno vino')[0].ask).toBeUndefined();
  });
  it('every chooser option is a real food; chips are short and English', () => {
    for (const f of FOODS) for (const o of f.choose?.opts ?? []) {
      expect(foodFromKey(o.k), o.k).toBeDefined();
      expect(o.chip.length).toBeLessThanOrEqual(16);
      expect(/[čćšžđ]/i.test(o.chip)).toBe(false);
    }
  });
  it('a variant outside the chooser shows in the second row (espresso: Regular · Decaf)', () => {
    const decaf = deriveFood(FOOD_BY_ID.espresso, { v: 'decaf' });
    expect(choiceRow(decaf)!.opts.find((o) => o.on)!.chip).toBe('Espresso');
    expect(variantRow(decaf)!.opts.map((o) => `${o.chip}${o.on ? '*' : ''}`)).toEqual(['Regular', 'Decaf*']);
  });
  it('picking keeps add-ins the new food can have (coffee with sugar → filter coffee with sugar)', () => {
    const p = parseMeal('kava sa šećerom')[0];
    const filter = choiceRow(p.food)!.opts.find((o) => o.chip === 'Filter')!.food;
    expect(foodKey(deriveFood(filter, { add: p.food.add }))).toBe('filter-coffee~sugar1');
  });
});

describe('variants: sourced, sane, and never the curated model', () => {
  const all = FOODS.flatMap((b) => (b.variants ?? []).map((v) => deriveFood(b, { v: v.v })));
  it(`${all.length} variants, each with a source claim, a short chip and energy that matches its macros`, () => {
    expect(all.length).toBeGreaterThanOrEqual(45);
    for (const f of all) {
      const v = baseOf(f).variants!.find((x) => x.v === f.v)!;
      expect(v.src.length, foodKey(f)).toBeGreaterThan(0);
      for (const s of f.src ?? []) expect(FOOD_CLAIMS[s.claim!], `${foodKey(f)} ${s.claim}`).toBeDefined();
      expect(v.chip.length).toBeLessThanOrEqual(16);
      expect(v.name).not.toMatch(/\(/);
      const p = f.p, g = (x: number | null) => x ?? 0;
      const sum = 4 * Math.max(0, g(p.carbs) - g(p.fiber)) + 2 * g(p.fiber) + 4 * g(p.protein) + 9 * g(p.fat) + 7 * g(p.alcoholG);
      if (p.kcal >= 5 || sum >= 5) expect(Math.abs(p.kcal - sum) / sum, foodKey(f)).toBeLessThanOrEqual(0.15);
    }
  });
  it('variant keys are unique and FOODS stays base-only', () => {
    expect(new Set(all.map(foodKey)).size).toBe(all.length);
    expect(FOODS.every(isPlain)).toBe(true);
  });
  it('decaf espresso and a 500 ml cola use the generic model, not the curated one', () => {
    const decaf = [servingPart(deriveFood(FOOD_BY_ID.espresso, { v: 'decaf' }), 1)];
    expect(isCuratedServing(decaf)).toBe(false);
    expect(analyze(decaf, DEFAULT_PROFILE).built.caffeine.doseMg).toBeLessThan(2);
    expect(isCuratedServing(parseMeal('espresso'))).toBe(true);
    expect(isCuratedServing(parseMeal('500 ml cole'))).toBe(false);
  });
  it('espresso + 1 sugar: +4.2 g sugar, about +16 kcal, all free sugar, still a drink', () => {
    const e = FOOD_BY_ID.espresso, s = deriveFood(e, { add: { sugar: 1 } });
    const m0 = macros([servingPart(e, 1)]), m1 = macros([servingPart(s, 1)]);
    expect(m1.sugars - m0.sugars).toBeCloseTo(4.19, 1);
    expect(m1.kcal - m0.kcal).toBeCloseTo(16.3, 0);
    expect(((s.p.freeSugars ?? 0) * s.serving.grams) / 100).toBeCloseTo(4.19, 1);
    expect(isDrink(s)).toBe(true);
    expect(s.kind).toBe('liquid');
  });
  it('honey replaces sugar; add-ins scale with servings', () => {
    const t = deriveFood(FOOD_BY_ID['black-tea'], { add: { sugar: 1, honey: 1 } });
    expect(t.add).toEqual({ honey: 1 });
    const two = servingPart(deriveFood(FOOD_BY_ID.espresso, { add: { sugar: 1 } }), 2);
    expect((two.food.p.sugars! * two.grams) / 100).toBeCloseTo(8.4, 1);
  });
  it('sizes: Slice · Half · Whole and 0.3 · 0.33 · 0.5 l', () => {
    expect(sizesOf(FOOD_BY_ID.pizza)!.map((s) => [s.label, s.mult])).toEqual([['Slice', 1], ['Half', 4], ['Whole', 8]]);
    expect(sizesOf(FOOD_BY_ID.beer)!.map((s) => s.mult)).toEqual([0.6, 0.66, 1]);
    expect(sizesOf(deriveFood(FOOD_BY_ID.beer, { v: 'radler' }))!.map((s) => s.mult)).toEqual([0.6, 0.66, 1]);
    expect(sizesOf(FOOD_BY_ID.cevapi)!.map((s) => s.mult)).toEqual([1, 2]);
  });
});

// every combination of every builder
function* combos(b: Builder): Generator<string[]> {
  const ones = b.groups.filter((g) => g.one), anys = b.groups.filter((g) => !g.one).flatMap((g) => g.opts.map((o) => o.k));
  const pick = (i: number, acc: string[]): string[][] => (i === ones.length ? [acc] : ones[i].opts.flatMap((o) => pick(i + 1, [...acc, o.k])));
  for (const base of pick(0, [])) for (let m = 0; m < 1 << anys.length; m++) yield [...base, ...anys.filter((_, j) => m & (1 << j))];
}
const EXEMPT = new Set([172237, 173468]); // vinegar (acetic acid energy), salt (no energy): single USDA records
describe('builders', () => {
  const builders = FOODS.filter((f) => f.builder);
  it('pizza, burger, sandwich, kebab, burek and both salads have a builder whose default is the database food', () => {
    expect(builders.map((f) => f.id).sort()).toEqual(['burek', 'cabbage', 'hamburger', 'kebab', 'pizza', 'salad-lettuce', 'sandwich-ham']);
    for (const f of builders) expect(deriveFood(f, { on: defaultSel(f.builder!) })).toBe(f);
  });
  it('every combination: energy matches the macros (Atwater ±15%)', () => {
    let n = 0;
    for (const f of builders) {
      const b = f.builder!;
      for (const sel of combos(b)) {
        const parts = b.groups.flatMap((g) => g.opts).filter((o) => sel.includes(o.k) && !EXEMPT.has(o.fdc ?? 0)).map((o) => ({ p: o.p, gi: o.gi, grams: o.grams }));
        n++;
        if (!parts.length) continue;
        const { p } = mixParts(parts), g = (x: number | null) => x ?? 0;
        const sum = 4 * Math.max(0, g(p.carbs) - g(p.fiber)) + 2 * g(p.fiber) + 4 * g(p.protein) + 9 * g(p.fat) + 7 * g(p.alcoholG);
        expect(Math.abs(p.kcal - sum) / sum, `${f.id} ${sel}`).toBeLessThanOrEqual(0.15);
      }
    }
    expect(n).toBeGreaterThan(10000);
  });
  it('pizza: one more topping never gives less energy or fat', () => {
    const pz = FOOD_BY_ID.pizza, tops = pz.builder!.groups.find((g) => !g.one)!.opts.map((o) => o.k);
    for (const sel of combos(pz.builder!)) {
      const a = deriveFood(pz, { on: sel });
      for (const t of tops.filter((x) => !sel.includes(x))) {
        const b = deriveFood(pz, { on: [...sel, t] });
        expect(kcal(b), `${sel} + ${t}`).toBeGreaterThanOrEqual(kcal(a) - 1e-9);
        expect(fat(b), `${sel} + ${t}`).toBeGreaterThanOrEqual(fat(a) - 1e-9);
      }
    }
  });
  it('the app mixes exactly like the build (each preset’s kcal, fat and GI)', () => {
    for (const f of builders) for (const p of f.builder!.presets) {
      const d = deriveFood(f, { on: p.on });
      // a preset that IS the default is the database food, whose per-100 g values are rounded like every food (kcal whole)
      expect(Math.abs(kcal(d) - p.check!.kcal) / p.check!.kcal, `${f.id} ${p.k}`).toBeLessThan(0.005);
      expect(Math.abs(fat(d) - p.check!.fat), `${f.id} ${p.k}`).toBeLessThan(0.06);
      expect(d.gi).toBe(p.check!.gi);
    }
  });
  it('checks against USDA: our pepperoni slice is within 3% of USDA’s own 14-inch pepperoni slice (111 g, 313 kcal)', () => {
    const d = deriveFood(FOOD_BY_ID.pizza, { on: ['base', 'pepperoni'] });
    expect(Math.abs(kcal(d) - 313) / 313).toBeLessThan(0.03);
    expect(Math.abs(d.serving.grams - 111) / 111).toBeLessThan(0.03);
  });
  it('every builder part has a source claim and its grams sit inside its range', () => {
    for (const f of builders) for (const o of f.builder!.groups.flatMap((g) => g.opts)) {
      for (const s of o.src) expect(FOOD_CLAIMS[s.claim!], `${f.id} ${o.k}`).toBeDefined();
      if (o.rng) { expect(o.grams).toBeGreaterThanOrEqual(o.rng[0]); expect(o.grams).toBeLessThanOrEqual(o.rng[1]); }
    }
  });
  it('names read well', () => {
    expect(deriveFood(FOOD_BY_ID.pizza, { on: ['base', 'ham'] }).name).toBe('Pizza with ham');
    expect(deriveFood(FOOD_BY_ID.kebab, { on: ['pita', 'chicken', 'tomato', 'yogurt'] }).name).toBe('Chicken kebab in pita without onion');
    expect(deriveFood(FOOD_BY_ID.hamburger, { on: ['cheeseburger', 'bacon'] }).name).toBe('Cheeseburger with bacon');
    expect(deriveFood(FOOD_BY_ID['salad-lettuce'], { on: ['base', 'olive-oil', 'vinegar'] }).name).toBe('Green salad with olive oil and vinegar');
  });
});

describe('deep links: v, s, add and builder parts round-trip; old links unchanged', () => {
  const samples: Food[] = [
    ...FOODS.flatMap((b) => (b.variants ?? []).map((v) => deriveFood(b, { v: v.v }))),
    ...FOODS.flatMap((b) => (b.builder?.presets ?? []).map((p) => deriveFood(b, { on: p.on }))),
    deriveFood(FOOD_BY_ID.espresso, { add: { sugar: 2 } }), deriveFood(FOOD_BY_ID['black-tea'], { add: { honey: 1, milk: 1 } }),
    deriveFood(FOOD_BY_ID.cappuccino, { v: 'soy', add: { sugar: 1, shot: 1 } }), deriveFood(FOOD_BY_ID.pizza, { on: ['base', 'egg', 'tuna'] }),
  ];
  it(`${samples.length} kinds: one serving → #q=…&v/add/on → the same food`, () => {
    for (const f of samples) {
      const parts = [servingPart(f, 1)];
      const h = writeLink(linkFor(parts));
      const back = linkParts(readLink(h));
      expect(back.map((p) => foodKey(p.food)), h).toEqual([foodKey(f)]);
      expect(back[0].grams).toBeCloseTo(parts[0].grams, 0);
    }
  });
  it('the short readable form', () => {
    expect(writeLink(linkFor([servingPart(deriveFood(FOOD_BY_ID.beer, { v: 'radler' }), 1)]))).toBe('#q=beer&v=radler');
    expect(writeLink(linkFor([servingPart(deriveFood(FOOD_BY_ID.espresso, { add: { sugar: 1 } }), 1)]))).toBe('#q=espresso&add=sugar1');
    expect(writeLink({ ...linkFor([servingPart(deriveFood(FOOD_BY_ID.pizza, { on: ['base', 'ham', 'mushrooms'] }), 1)]), s: 'whole' })).toBe('#q=pizza&on=base+ham+mushrooms&s=whole');
  });
  it('a named size: #q=pizza&s=whole is 8 slices; s wins over n; an unknown size falls back to n', () => {
    expect(resolveLink('#q=pizza&s=whole').mult).toBe(8);
    expect(resolveLink('#q=pizza&s=whole&n=2').mult).toBe(8);
    expect(resolveLink('#q=pizza&s=huge&n=2').mult).toBe(2);
    expect(resolveLink('#q=beer&v=radler&s=0.3l').mult).toBeCloseTo(0.6, 6);
  });
  it('unknown or hostile v / add / on fall back to the default without a miss', () => {
    for (const h of ['#q=beer&v=nope', '#q=beer&v=__proto__', '#q=espresso&add=constructor9', '#q=pizza&on=__proto__+toString', '#q=pizza&on=', '#q=banana&v=radler']) {
      const r = resolveLink(h);
      expect(r.miss, h).toBeUndefined();
      expect(r.base.length, h).toBe(1);
      expect(isPlain(r.base[0].food), h).toBe(true);
    }
  });
  it('meal codes carry kinds: "pizza_base_ham*2 beer.radler espresso~sugar1"', () => {
    const meal = mealFromCode('pizza_base_ham*2 beer.radler espresso~sugar1');
    expect(meal.map((p) => foodKey(p.food))).toEqual(['pizza_base_ham', 'beer.radler', 'espresso~sugar1']);
    expect(mealCode(meal)).toBe('pizza_base_ham*2 beer.radler espresso~sugar1');
    expect(mealFromCode('beer.nope cola~sugar1').map((p) => foodKey(p.food))).toEqual(['beer', 'cola']);
    const h = writeLink(linkFor(meal));
    expect(linkParts(readLink(h)).map((p) => foodKey(p.food))).toEqual(meal.map((p) => foodKey(p.food)));
  });
  it('old links open exactly as before', () => {
    expect(writeLink(linkFor(parseMeal('banana')))).toBe('#q=banana');
    expect(resolveLink('#q=cola').base[0].food).toBe(FOOD_BY_ID.cola);
    expect(resolveLink('#m=hamburger+fries*2+cola').base.map((p) => foodKey(p.food))).toEqual(['hamburger', 'fries', 'cola']);
    expect(resolveLink('#q=pizza&n=2').mult).toBe(2);
  });
});

describe('every kind runs the whole screen', () => {
  it('variants, presets, builder parts and add-ins: analyze() gives finite numbers and a name', () => {
    const kinds: Food[] = [];
    for (const b of FOODS) {
      for (const v of b.variants ?? []) kinds.push(deriveFood(b, { v: v.v }));
      for (const p of b.builder?.presets ?? []) kinds.push(deriveFood(b, { on: p.on }));
      for (const g of b.builder?.groups ?? []) for (const o of g.opts) kinds.push(deriveFood(b, { on: [...defaultSel(b.builder!), o.k] }));
      for (const a of b.addins ?? []) kinds.push(deriveFood(b, { add: { [a.k]: a.max } }));
    }
    for (const f of kinds) for (const n of [0.5, 1, 3]) {
      const r = analyze([servingPart(f, n)], DEFAULT_PROFILE);
      expect(Number.isFinite(r.kcal), foodKey(f)).toBe(true);
      expect(r.name.length).toBeGreaterThan(2);
      expect(r.name).not.toMatch(/undefined|NaN/);
    }
  });
});

describe('meals', () => {
  it('two kinds of the same food stay two items; changing the kind keeps the servings', () => {
    const a: Part[] = [servingPart(FOOD_BY_ID.beer, 1)];
    const m = addParts(a, [servingPart(deriveFood(FOOD_BY_ID.beer, { v: 'radler' }), 1)]);
    expect(m.map((p) => foodKey(p.food))).toEqual(['beer', 'beer.radler']);
    const m2 = setFood([servingPart(FOOD_BY_ID.pizza, 2)], 0, deriveFood(FOOD_BY_ID.pizza, { on: ['base', 'ham'] }));
    expect(m2[0].grams / m2[0].food.serving.grams).toBeCloseTo(2, 6);
  });
  it('suggestions show variants only when their word is typed', () => {
    expect(suggest('pivo').map((s) => foodKey(s.parts[0].food))).not.toContain('beer.radler');
    expect(suggest('bezalkoholno').map((s) => foodKey(s.parts[0].food))[0]).toBe('beer.alcohol-free');
  });
});
