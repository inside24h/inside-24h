// The amount in words (prelaunch QA 2026-10-23): first caption, video hook and share text. Before:
// "Whole · 1104 g pizza capricciosa.", "Kebab / doner (1 kebab)", "2 large egg", "1 cup, 70 ml turkish coffee".
import { describe, expect, it } from 'vitest';
import { FOODS, FOOD_BY_ID, choiceRow, deriveFood, leftOutNote, parseMeal, readMeal, servingPart, sizesOf, variantRow, type Food, type Part } from './parse';
import { amountPhrase, capFirst, nameInSentence, partsPhrase, pluralOf } from './naming';
import { makeFoodProduct } from './foodProduct';
import { DEFAULT_PROFILE } from '../../science/profile';

// the same scaling as AppV4 scaleParts (named sizes read "Whole · 1104 g", other multiples "2 × 1 slice")
const scale = (p: Part, f: number): Part => {
  if (f === 1) return p;
  const z = sizesOf(p.food)?.find((x) => Math.abs(x.mult - f) < 1e-6);
  const label = z ? (/\b(ml|l|dl|cl)$/.test(z.label) ? z.label : `${z.label} · ${Math.round(p.grams * f)} g`) : `${f === 0.5 ? '½ ×' : `${f} ×`} ${p.amountLabel}`;
  return { ...p, grams: p.grams * f, amountLabel: label };
};
const one = (t: string) => { const ps = parseMeal(t); expect(ps.length, t).toBe(1); return ps[0]; };
const preset = (id: string, chip: RegExp) => choiceRow(FOOD_BY_ID[id])!.opts.find((o) => chip.test(o.chip))!.food;
const firstCaption = (parts: Part[]) => makeFoodProduct(parts, 'food').build(DEFAULT_PROFILE, 63).story.chapters[0].text.split(/(?<=\.) /)[0];

describe('amountPhrase', () => {
  it('builder pizza: whole and half read as a person would say them', () => {
    const cap = servingPart(preset('pizza', /capricciosa/i), 1);
    expect(capFirst(amountPhrase(scale(cap, 8)))).toBe(`A whole 14-inch pizza Capricciosa (${Math.round(cap.grams * 8)} g)`); // (round 14b: the size is said)
    expect(amountPhrase(scale(cap, 4))).toBe(`half a 14-inch pizza Capricciosa (${Math.round(cap.grams * 4)} g)`);
    expect(amountPhrase(cap)).toBe('1 slice of pizza Capricciosa');
    expect(amountPhrase(scale(cap, 2))).toBe('2 slices of pizza Capricciosa');
    expect(firstCaption([scale(cap, 8)])).toMatch(/^A whole 14-inch pizza Capricciosa \(\d+ g\)\.$/);
  });

  it('sandwiches, burgers and kebabs are counted by their own name', () => {
    expect(amountPhrase(one('kebab'))).toBe('1 kebab');
    expect(amountPhrase(one('hamburger'))).toBe('1 hamburger');
    expect(amountPhrase(scale(one('hamburger'), 2))).toBe('2 hamburgers');
    expect(amountPhrase(one('cheeseburger'))).toBe('1 cheeseburger');
    expect(amountPhrase(one('tuna sub'))).toBe('1 tuna sub');
    expect(amountPhrase(one('chicken kebab wrap'))).toBe('1 chicken kebab wrap');
    expect(amountPhrase(scale(one('beef kebab in pita'), 2))).toBe('2 beef kebabs in pita');
  });

  it('coffee and tea: cups, shots, add-ins and proper names', () => {
    expect(amountPhrase(one('espresso'))).toBe('1 espresso (30 ml)');
    expect(amountPhrase(scale(one('espresso'), 3))).toBe('3 espressos (3 × 30 ml)');
    expect(amountPhrase(one('turska kava'))).toBe('1 cup of Turkish coffee (70 ml)');
    expect(amountPhrase(one('kava sa šećerom'))).toBe('1 espresso with 1 tsp sugar (30 ml)');
    expect(amountPhrase(one('kava s mlijekom sa šećerom'))).toBe('1 cup of coffee with milk and 1 tsp sugar (200 g)');
    expect(amountPhrase(scale(one('cappuccino'), 2))).toBe('2 cups of cappuccino (300 g)');
    expect(amountPhrase(one('čaj s medom'))).toBe('250 ml of black tea with 1 tsp honey');
    expect(amountPhrase(scale(one('latte'), 2))).toBe('2 glasses of latte (500 g)');
  });

  it('counts, sizes and measures', () => {
    expect(amountPhrase(scale(one('jaje'), 2))).toBe('2 large eggs');
    expect(amountPhrase(scale(one('kifla'), 2))).toBe('2 bread rolls');
    expect(amountPhrase(scale(one('krumpir'), 2))).toBe('2 potatoes');
    expect(amountPhrase(one('cola'))).toBe('330 ml of cola');
    expect(amountPhrase(scale(one('pivo'), 2))).toBe('2 × 500 ml of beer');
    expect(amountPhrase(one('rakija'))).toBe('40 ml of rakija');
    expect(amountPhrase(one('pomfrit'))).toBe('1 small portion of french fries');
    expect(amountPhrase(scale(one('pomfrit'), sizesOf(one('pomfrit').food)!.find((s) => s.k === 'large' || /large/i.test(s.label))!.mult))).toMatch(/^a large portion of french fries \(\d+ g\)$/);
    expect(amountPhrase(scale(servingPart(FOOD_BY_ID['energy-drink'], 1), 0.5))).toBe('half a can of energy drink (125 ml)');
    expect(amountPhrase(servingPart(FOOD_BY_ID['energy-drink'], 2))).toBe('2 cans of energy drink (250 ml each)');
    expect(partsPhrase(parseMeal('hamburger, fries and cola'))).toBe('1 hamburger, 1 small portion of french fries and 330 ml of cola');
  });

  it('helpers', () => {
    expect(pluralOf('sandwich')).toBe('sandwiches');
    expect(pluralOf('tbsp')).toBe('tbsp');
    expect(nameInSentence('Kebab / doner')).toBe('kebab');
    expect(nameInSentence('Greek yogurt (plain, low fat)')).toBe('Greek yogurt');
    expect(nameInSentence('French fries')).toBe('french fries');
  });

  it('every food, kind, add-in and size at ½ · 1 · 2 · 3: clean English, no label glue', () => {
    let n = 0;
    for (const base of FOODS) {
      const fam: Food[] = [base];
      for (const r of [choiceRow(base), variantRow(base)]) if (r) for (const o of r.opts) fam.push(o.food);
      for (const a of base.addins ?? []) fam.push(deriveFood(base, { add: { [a.k]: 1 } }));
      for (const f of fam) {
        const ps = [servingPart(f, 0.5), servingPart(f, 1), servingPart(f, 2), scale(servingPart(f, 1), 0.5), scale(servingPart(f, 1), 3), ...(sizesOf(f)?.map((z) => scale(servingPart(f, 1), z.mult)) ?? [])];
        for (const p of ps) {
          const s = amountPhrase(p); n++;
          expect(s, `${f.name} | ${p.amountLabel}`).not.toMatch(/·|undefined|NaN|\s{2}|\(\)|\bof of\b| × 1 |\b(\w+) \1\b|glases|\bturkish\b|\bgreek\b|with [^,]* with /);
          expect(s, `${f.name} | ${p.amountLabel}`).toMatch(/^(a|an|half|1|\d|¼|½|¾)/);
          expect(s.length, s).toBeLessThan(90);
        }
      }
    }
    expect(n).toBeGreaterThan(900);
  });
});

describe('search fixes found in the prelaunch QA', () => {
  const read = (t: string) => parseMeal(t).map((p) => `${p.food.name} [${p.amountLabel}]`).join(' + ');
  it('"coffee with milk" keeps its add-ins in any order, and a count', () => {
    expect(read('kava s mlijekom sa šećerom')).toBe('Coffee with milk and sugar [1 cup, 200 g with 1 tsp sugar]');
    expect(read('kava sa šećerom i mlijekom')).toBe('Coffee with milk and sugar [1 cup, 200 g with 1 tsp sugar]');
    expect(read('2 kave s mlijekom')).toBe('Coffee with milk [2 × 1 cup, 200 g]');
    // unchanged: a real second item after "and", toppings, tea add-ins
    expect(read('burek sa sirom i jogurt')).toMatch(/^Burek .* \+ Yogurt/);
    expect(read('čaj s mlijekom i šećerom')).toBe('Black tea with sugar and milk [250 ml with 1 tsp sugar and a splash of milk]');
    expect(read('pizza i pivo')).toBe('Pizza (cheese) [1 slice] + Beer (regular) [500 ml]');
  });
  it('the names on the chips can be typed', () => {
    expect(read('tuna sub')).toBe('Tuna sub [1 sandwich]');
    expect(read('cold-cut sub')).toBe('Cold-cut sub [1 sandwich]');
    expect(read('chicken')).toMatch(/^Chicken breast/); // one ingredient stays the plain food
    // ambiguous (roll or any pastry): not found in the 2026-10-17 audit; owner 2026-10-29: the roll, asking "Which roll or pastry?"
    expect(read('pecivo')).toMatch(/^Bread roll \[1 roll\]$/);
  });
});

describe('the parser never silently changes what was typed (prelaunch QA 2026-10-23)', () => {
  const read = (t: string) => parseMeal(t).map((p) => `${p.food.name} [${p.amountLabel}]`).join(' + ');
  it('lemon, ice, cinnamon: noted as not counted, never lemonade or ice cream', () => {
    expect(read('tea with honey and lemon')).toBe('Black tea with honey [250 ml with 1 tsp honey]');
    expect(leftOutNote('tea with honey and lemon')).toBe('Not counted: “lemon” (too little to matter).');
    expect(read('tea with lemon and honey')).toBe('Black tea with honey [250 ml with 1 tsp honey]');
    expect(read('water with a slice of lemon')).toBe('Water (tap) [250 ml]');
    expect(leftOutNote('water with a slice of lemon')).toBe('Not counted: “a slice of lemon” (too little to matter).');
    expect(read('beer with lemon')).toBe('Beer (regular) [500 ml]');
    expect(read('cola with ice')).toBe('Cola (regular) [330 ml]');
    expect(readMeal('voda s ledom i limunom').extras).toEqual(['ledom', 'limunom']);
    expect(read('kava s cimetom')).toBe('Espresso [30 ml]');
    expect(read('lemon')).toBe(''); // not lemonade: the list still offers it, the person picks
  });
  it('words we have no food for are shown, as typed', () => {
    // round 2 (2026-10-29): coffee with whipped cream is now a food of its own (espresso + USDA whipped cream)
    expect(read('kava sa šlagom')).toBe('Espresso with whipped cream [1 cup]');
    expect(leftOutNote('kava sa šlagom')).toBeNull();
    expect(leftOutNote('coffee with whipped cream')).toBeNull(); // round 2: an exact name of the new espresso variant
    expect(leftOutNote('pizza and something')).toBe('Not in our database yet: “something” — left out.');
    expect(leftOutNote('cola')).toBeNull();
    expect(leftOutNote('ćevapi s lukom')).toBeNull(); // onion is a food: it is counted
  });
  it('"without": taken out, the sugar-free kind, or said that it is counted', () => {
    expect(read('cola without sugar')).toBe('Diet cola [330 ml]');
    expect(read('kola bez šećera')).toBe('Diet cola [330 ml]');
    expect(read('energy drink bez šećera')).toBe('Sugar-free energy drink [1 can (250 ml)]');
    expect(read('kava bez šećera')).toBe('Espresso [30 ml]');
    expect(read('kava sa šećerom bez šećera')).toBe('Espresso [30 ml]');
    expect(read('kebab bez luka')).toMatch(/without onion/);
    expect(read('pizza without cheese')).toBe('Pizza (cheese) [1 slice]');
    expect(leftOutNote('pizza without cheese')).toBe('We can’t take out “cheese” yet, so it’s counted.');
    expect(read('čaj bez šećera i s limunom')).toBe('Black tea [250 ml]');
  });
  it('a near word is not a different topping: peppers are not pepperoni', () => {
    expect(read('pizza with peppers')).toBe('Pizza with peppers [1 slice]');
    expect(read('pizza with pepperoni')).toBe('Pepperoni pizza [1 slice]');
  });
  it('compound names stay themselves', () => {
    expect(read('milk chocolate')).toBe('Milk chocolate [1 bar (44 g)]');
    expect(read('chocolate milk')).toBe('Chocolate milk [250 ml]');
    expect(read('orange juice')).toBe('Orange juice [250 ml]');
    expect(read('orange')).toBe('Orange [1 fruit]');
    expect(read('iced tea')).toBe('Iced tea (sweetened) [250 ml]');
    expect(read('ice cream')).toMatch(/^Ice cream/);
  });
});
