// Variants, builders, add-ins, sizes and "Which …?" choosers (2026-10-18, research/audit/VARIANTS-DONE.md).
import { describe, expect, it } from 'vitest';
import {
  CARB_MIN, FOODS, FOOD_BY_ID, baseOf, choiceRow, defaultSel, deriveFood, foodFromKey, foodKey, isPlain, macros, mixParts, parseMeal, servingPart, sizesOf,
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
  ['burek sa sirom', [['burek', 150]]], // QA 2026-10-19: the cheese burek IS the default (the producer's label)
  ['burek s mesom', [['burek_meat', 150]]],
  ['burek sa sirom i jogurt', [['burek', 150], ['yogurt-plain', 245]]],
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
  ['kebab', [['kebab', 397]]], // QA 2026-10-19: pita 100 g; data round 3: 95 g vegetables, 52 g sauce (all Panozzo 2015)
  ['kebab s teletinom', [['kebab_pita_beef_tomato_onion_lettuce_yogurt_mayo', 397]]],
  // data round 2 (2026-10-19)
  ['turska kava', [['filter-coffee.turkish', 70]]],
  ['bosanska kava', [['filter-coffee.turkish', 70]]],
  ['medica', [['rakija.medica', 40]]],
  ['tuna u ulju', [['tuna-canned.oil', 80]]],
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
    ['kava', 'espresso', 'Which coffee?', ['Espresso', 'Filter', 'Turkish', 'With milk', 'Cappuccino', 'Latte']],
    ['coffee', 'filter-coffee', 'Which coffee?', ['Espresso', 'Filter', 'Turkish', 'With milk', 'Cappuccino', 'Latte']],
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
    expect(deriveFood(FOOD_BY_ID.kebab, { on: ['pita', 'chicken', 'tomato', 'lettuce', 'yogurt', 'mayo'] }).name).toBe('Chicken kebab in pita without onion');
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

// Data round 2 (2026-10-19, research/audit/VARIANTS-DONE.md "Data round 2"): each number below is from a source read
// that round; the test keeps the data equal to it.
describe('data round 2: sourced portions and new variants', () => {
  const per = (f: Food, k: keyof Food['p'], grams = f.serving.grams) => ((f.p[k] as number) * grams) / 100;
  const opt = (id: string, k: string) => FOOD_BY_ID[id].builder!.groups.flatMap((g) => g.opts).find((o) => o.k === k)!;
  it('Turkish coffee: a 70 ml cup at espresso strength (measured 2.0–2.8 mg/ml), range 112–196 mg', () => {
    const t = deriveFood(FOOD_BY_ID['filter-coffee'], { v: 'turkish' });
    expect(foodKey(t)).toBe('filter-coffee.turkish');
    expect(t.serving.grams).toBeCloseTo(70, 0);
    const mg = per(t, 'caffeineMg');
    expect(mg).toBeGreaterThan(140); expect(mg).toBeLessThan(156);
    const v = FOOD_BY_ID['filter-coffee'].variants!.find((x) => x.v === 'turkish')!;
    expect(v.range?.caffeineMg).toEqual([112, 196]);
    expect(v.src[0].text).toMatch(/Derossi/);
  });
  it('medica: 24% alcohol and the EU liqueur minimum of 100 g sugar per litre, in a 40 ml glass', () => {
    const m = deriveFood(FOOD_BY_ID.rakija, { v: 'medica' });
    expect(m.serving.label).toBe('40 ml');
    expect(per(m, 'alcoholG') / 0.789 / 40).toBeCloseTo(0.24, 2); // ethanol 0.789 g/ml
    expect(per(m, 'sugars')).toBeCloseTo(4.0, 1);
    expect(per(m, 'freeSugars')).toBeCloseTo(4.0, 1); // honey sugars are free sugars (WHO)
    expect(sizesOf(m)!.map((s) => s.mult)).toEqual([0.75, 1, 1.25]);
  });
  it('pasta and rice sizes: Side · Plate · Large from weighed adult portions (Irish national survey)', () => {
    const g = (id: string) => sizesOf(FOOD_BY_ID[id])!.map((s) => [s.label, Math.round(s.mult * FOOD_BY_ID[id].serving.grams)]);
    expect(g('pasta')).toEqual([['Side', 124], ['Plate', 199], ['Large', 250]]);
    expect(g('pasta-wholewheat')).toEqual([['Side', 117], ['Plate', 199], ['Large', 250]]);
    expect(g('rice-white')).toEqual([['Side', 120], ['Plate', 158], ['Large', 224]]);
  });
  it('canned tuna: an 80 g portion (EU can, Irish median), water by default, oil as a variant', () => {
    expect(FOOD_BY_ID['tuna-canned'].serving.grams).toBe(80);
    expect(deriveFood(FOOD_BY_ID['tuna-canned'], { v: 'oil' }).serving.grams).toBe(80);
  });
  it('pizza toppings: extra cheese from the USDA recipe, tuna from EU labels, one egg per pizza', () => {
    expect([opt('pizza', 'cheese').grams, opt('pizza', 'tuna').grams, opt('pizza', 'egg').grams]).toEqual([6.3, 11.9, 6.2]);
    expect(opt('pizza', 'cheese').rng).toEqual([5.2, 14.2]);
    expect(opt('pizza', 'tuna').rng).toEqual([10.8, 12.8]);
  });
  it('kebab meat: 150 g (weighed Italian döner), range 60–227 g', () => {
    for (const k of ['chicken', 'beef']) { expect(opt('kebab', k).grams).toBe(150); expect(opt('kebab', k).rng).toEqual([60, 227]); }
  });
  it('burek: the default is the cheese burek label read per 100 g, not our 289 kcal recipe (QA 2026-10-19); melon GI stays 65 (Atkinson A1 row 1021)', () => {
    const b = opt('burek', 'cheese');
    expect(b.on).toBe(true); expect(b.chip).toBe('Cheese');
    expect(b.src[0].text).toMatch(/label/); expect(b.src[0].text).toMatch(/per 100 g/); expect(b.src[0].text).toMatch(/289/);
    expect(FOOD_BY_ID.burek.builder!.groups[0].opts.map((o) => o.k)).toEqual(['cheese', 'meat', 'spinach', 'potato']);
    expect(Math.round(FOOD_BY_ID.burek.p.kcal)).toBe(297);
    expect(FOOD_BY_ID.melon.gi).toBe(65);
  });
});

// Data round 3 (2026-10-19, research/audit/VARIANTS-DONE.md "Data round 3"): GI coverage and the kebab calibration.
describe('data round 3: every carb food has a GI or a written reason; kebab matches the weighed study', () => {
  const avail = (f: Food) => (Math.max(0, (f.p.carbs ?? 0) - (f.p.fiber ?? 0)) * f.serving.grams) / 100;
  const opt = (id: string, k: string) => FOOD_BY_ID[id].builder!.groups.flatMap((g) => g.opts).find((o) => o.k === k)!;
  // Foods (or "<base>*" for every combination of a builder) with > 10 g available carbohydrate per serving and NO GI,
  // each with the reason. Atkinson 2008 Suppl. Tables A1/A2 and Atkinson 2021 Suppl. Tables 1/2 were searched for each.
  const NO_GI: Record<string, string> = {
    'hot-chocolate': 'no hot chocolate made with milk was tested in healthy people (only a mix made with water: the water variant has it)',
    buttermilk: 'buttermilk is not in the 2008 or 2021 tables',
    beer: 'Atkinson 2021 Suppl. Table 1 has two beers, 119 ± 10 and 89 ± 2 (mean 104): they disagree by 30 and a beer sugar curve would change the alcohol story; left for the owner',
    'beer.alcohol-free': 'no alcohol-free beer tested',
    'beer.radler': 'beer + lemonade: beer has no GI here (see beer)',
    'red-wine.dessert': 'no dessert wine tested',
    'protein-shake': 'the whey powder has no tested GI',
    'bread-french': 'baguette tests disagree (A1 57 vs healthy-subject rows 78–81), audit 2026-10-17; 2021 adds only a whole-grain baguette',
    'burek*': 'no burek or phyllo pie tested; the nearest tests disagree: filled fatayer pastry 78–80 (2021 Suppl. Table 2), puff pastry 47 and 56 (2021 Suppl. Table 1)',
    crackers: 'saltines not tested; other crackers 51–78',
    pancake: 'US-style pancakes tested 46–102 depending on the recipe (A1 rows 30–35)',
    'bean-soup': 'no bean soup tested', 'bean-soup.sausage': 'no bean soup tested',
    'ice-cream.chocolate': 'only one low-fat chocolate ice cream brand was tested (A1 row 770)',
    'cake-sponge.cheesecake': 'no cheesecake tested', 'cake-sponge.strudel': 'no strudel tested', 'cake-sponge.cream': 'no cream cake tested',
    // 'kebab*' was here until 2026-10-20: tomato and onion (1–2 g carbohydrate, no tested GI) voided its GI under
    // CARB_MIN = 1 g. With CARB_MIN = 3 g every kebab has a GI (see "CARB_MIN = 3 g" below).
    'sandwich-ham_baguette': 'the baguette has no GI (see bread-french)',
    'sandwich-ham_sub_ketchup': 'ketchup (4–5 g carbohydrate) has no tested GI and no whole sub was tested; on a burger it counts at the measured whole-burger GI, which included ketchup',
  };
  const reason = (key: string) => NO_GI[key] ?? NO_GI[`${key.split(/[._~]/)[0]}*`];
  const all: Food[] = [];
  for (const f of FOODS) {
    all.push(f);
    for (const v of f.variants ?? []) all.push(deriveFood(f, { v: v.v }));
    const b = f.builder;
    if (!b) continue;
    for (const pr of b.presets) all.push(deriveFood(f, { on: pr.on }));
    const def = defaultSel(b);
    for (const g of b.groups) for (const o of g.opts) {
      const sel = g.one ? [...def.filter((k) => !g.opts.some((x) => x.k === k)), o.k] : def.includes(o.k) ? def.filter((k) => k !== o.k) : [...def, o.k];
      all.push(deriveFood(f, { on: sel }));
    }
  }
  it('every food, variant, preset and one-tap builder change with > 10 g available carbohydrate has a GI or a reason', () => {
    const missing = all.filter((f) => avail(f) > 10 && f.gi === null && !reason(foodKey(f))).map((f) => `${foodKey(f)} (${avail(f).toFixed(1)} g)`);
    expect(missing).toEqual([]);
  });
  it('the allow-list is not stale: an exact entry still exists and still has no GI', () => {
    for (const key of Object.keys(NO_GI).filter((k) => !k.endsWith('*'))) {
      const f = foodFromKey(key);
      expect(f, key).toBeDefined();
      expect(f!.gi, key).toBeNull();
      expect(NO_GI[key].length, key).toBeGreaterThan(10);
    }
  });
  it('pizza: the measured whole-pizza GI (43, healthy people) for every preset and every topping', () => {
    const p = FOOD_BY_ID.pizza;
    expect(p.gi).toBe(43);
    for (const pr of p.builder!.presets) expect(deriveFood(p, { on: pr.on }).gi, pr.k).toBe(43);
    for (const o of p.builder!.groups[1].opts) expect(deriveFood(p, { on: ['base', o.k] }).gi, o.k).toBe(43);
    expect(deriveFood(p, { on: ['base', 'onion', 'corn', 'peppers'] }).gi).toBe(43);
  });
  it('burger: the measured whole-burger GI (66) for every burger type and extra', () => {
    const h = FOOD_BY_ID.hamburger;
    for (const o of h.builder!.groups.flatMap((g) => g.opts)) {
      const on = h.builder!.groups[0].opts.some((x) => x.k === o.k) ? [o.k] : ['hamburger', o.k];
      expect(deriveFood(h, { on }).gi, o.k).toBe(66);
    }
  });
  it('subs count at the white-bread GI (75); a kebab gets its computed GI (CARB_MIN = 3 g: only the bread counts)', () => {
    expect(FOOD_BY_ID['sandwich-ham'].gi).toBe(75);
    for (const k of ['coldcut', 'tuna', 'toast']) expect(deriveFood(FOOD_BY_ID['sandwich-ham'], { on: [k] }).gi, k).toBe(75);
    expect(opt('kebab', 'pita').gi).toBe(68);
    expect(opt('kebab', 'wrap').gi).toBe(30);
    // was 66 with CARB_MIN = 1 g (pita 68 + yogurt 17); the 38 g of yogurt has 1.8 g carbohydrate, now under the cut
    expect(deriveFood(FOOD_BY_ID.kebab, { on: ['pita', 'chicken', 'lettuce', 'yogurt', 'mayo'] }).gi).toBe(68);
  });
  // Polish 2026-10-20 (research/improvements/polish-2026-10-20.md): CARB_MIN 1 → 3 g in parse.ts and build_variants.py,
  // the same 3 g as macros() for a meal. Every one of the 11,494 combinations was compared before/after.
  it('CARB_MIN = 3 g: every kebab has a GI (pita 68, wrap 30), the database default included', () => {
    expect(CARB_MIN).toBe(3);
    expect(FOOD_BY_ID.kebab.gi).toBe(68);
    const k = FOOD_BY_ID.kebab, b = k.builder!;
    const one = b.groups.filter((g) => g.one), any = b.groups.filter((g) => !g.one).flatMap((g) => g.opts.map((o) => o.k));
    const bread = one.find((g) => g.opts.some((o) => o.k === 'pita'))!;
    for (const br of bread.opts) for (let m = 0; m < 1 << any.length; m++) {
      const on = [br.k, ...one.filter((g) => g !== bread).map((g) => g.opts.find((o) => o.on)!.k), ...any.filter((_, i) => m & (1 << i))];
      expect(deriveFood(k, { on }).gi, on.join('+')).toBe(br.k === 'wrap' ? 30 : 68);
    }
  });
  it('CARB_MIN = 3 g: a splash of milk (< 3 g carbohydrate) no longer sets a GI; sugar in coffee counts at its own 65', () => {
    // these had GI 39 (milk) on 1.5–3 g of carbohydrate; macros() already skipped them (< 3 g), so nothing visible changes
    for (const key of ['filter-coffee~milk1', 'coffee-with-milk.macchiato', 'coffee-with-milk.instant', 'black-tea~milk1']) {
      const f = foodFromKey(key)!;
      expect(f.gi, key).toBeNull();
      expect(avail(f), key).toBeLessThan(3);
      expect(macros([servingPart(f, 1)]).gi, key).toBeNull();
    }
    // coffee with milk + 1 tsp sugar: the milk's 2–3 g lactose no longer pulls the mix down (was 54–60, now the sugar's 65)
    expect(foodFromKey('coffee-with-milk~sugar1')!.gi).toBe(65);
    expect(foodFromKey('cappuccino.almond~sugar1')!.gi).toBe(65); // was null: almond milk has no tested GI
  });
  it('new GIs from the 2008/2021 tables are in (row in giSource of research/fooddb.json)', () => {
    const want: Record<string, number> = {
      kefir: 36, 'yogurt-plain': 17, 'yogurt-lowfat': 35, croissant: 56, 'potato-mashed': 79, 'chocolate-milk': 29, smoothie: 39,
      mandarin: 52, 'bread-rye': 60, 'iced-tea': 74, peach: 76, pear: 33, blueberries: 53, latte: 39, cappuccino: 39,
    };
    for (const [id, gi] of Object.entries(want)) expect(FOOD_BY_ID[id].gi, id).toBe(gi);
    expect(foodFromKey('chocolate-milk-bar.white')!.gi).toBe(41);
    expect(foodFromKey('cake-sponge.chocolate')!.gi).toBe(38);
    expect(foodFromKey('hot-chocolate.water')!.gi).toBe(51);
    expect(foodFromKey('bread-white.roll')!.gi).toBe(75);
  });
  it('the default kebab sits inside the weighed Italian study (Panozzo 2015, Ital J Food Saf 4:4535, 20 kebabs)', () => {
    const k = FOOD_BY_ID.kebab, g = k.serving.grams;
    expect(g).toBeGreaterThanOrEqual(274); expect(g).toBeLessThanOrEqual(618); // serving range
    // Table 2/4: fat 8.6 g/100 g (town SD 1.8), protein 12.95 ± 2.12 g/100 g
    expect(k.p.fat!).toBeGreaterThanOrEqual(8.6 - 1.8); expect(k.p.fat!).toBeLessThanOrEqual(8.6 + 1.8);
    expect(k.p.protein!).toBeGreaterThanOrEqual(12.95 - 2.12); expect(k.p.protein!).toBeLessThanOrEqual(12.95 + 2.12);
    // Energy: the study's 226.1 ± 25.7 kcal/100 g is GROSS energy (bomb calorimeter). Usable (Atwater) energy is lower:
    // the study's own protein, fat, starch and fibre give 170–187 kcal/100 g (town and meat-group means). Ours must lie
    // between that floor and the gross value.
    expect(k.p.kcal).toBeGreaterThanOrEqual(170); expect(k.p.kcal).toBeLessThanOrEqual(226.1);
    // Table 1 shares (% of the kebab, town means ± SD): meat 34.8 ± 10.2 / 39.5 ± 6.8, bread 26.9 ± 3.4 / 22.5 ± 6.1,
    // vegetables 24.7 ± 9.1 / 25.8 ± 7.4, sauces 13.6 ± 2.7 / 12.2 ± 4.5
    const share = (ks: string[]) => (100 * ks.reduce((s, x) => s + opt('kebab', x).grams, 0)) / g;
    const within = (v: number, lo: number, hi: number) => { expect(v).toBeGreaterThanOrEqual(lo); expect(v).toBeLessThanOrEqual(hi); };
    within(share(['chicken']), 34.8 - 10.2, 39.5 + 6.8);
    within(share(['pita']), 22.5 - 6.1, 26.9 + 3.4);
    within(share(['tomato', 'onion', 'lettuce']), 24.7 - 9.1, 25.8 + 7.4);
    within(share(['yogurt', 'mayo']), 12.2 - 4.5, 13.6 + 2.7);
  });
});
