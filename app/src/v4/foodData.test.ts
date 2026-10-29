// Food data audit 2026-10-17 (research/audit/FIXES.md): what people type must land on the right food and amount,
// every exact alias names ONE food, energy matches the macros, and every label override is exactly the label.
import { describe, expect, it } from 'vitest';
import { FOODS, FOOD_BY_ID, fold, parseMeal, suggest, type Food } from './food/parse';
import { ETHANOL_G, ITEM_FX } from './healthBars';
import { COLA } from '../science/colaSim';
import { FOOD_CLAIMS, foodSourceClaims } from '../content/food';
import { SOURCES } from '../content/sources';
import { makeFoodProduct } from './food/foodProduct';
import { DEFAULT_PROFILE } from '../science/profile';

// [typed text, [[food id, grams rounded]] ]; an empty list = must find nothing (no wrong food)
const GOLDEN: [string, [string, number][]][] = [
  ['sok', [['orange-juice', 263]]],
  ['čaša soka', [['orange-juice', 263]]],
  ['sok od naranče', [['orange-juice', 263]]],
  ['sok od jabuke', [['apple-juice', 262]]],
  ['1 can of cola', [['cola', 343]]],
  ['limenka cole', [['cola', 343]]],
  ['cola zero', [['diet-cola', 330]]],
  ['monster', [['energy-drink', 519]]],
  ['1 can of monster', [['energy-drink', 519]]],
  ['red bull', [['energy-drink', 260]]],
  ['2 limenke red bulla', [['energy-drink', 519]]],
  ['kava', [['espresso', 30]]],
  ['espresso', [['espresso', 30]]],
  ['filter kava', [['filter-coffee', 250]]],
  ['coffee', [['filter-coffee', 250]]],
  ['kava s mlijekom', [['coffee-with-milk', 200]]],
  ['cappuccino', [['cappuccino', 150]]],
  ['čaj', [['black-tea', 250]]],
  ['zeleni čaj', [['green-tea', 250]]],
  ['ledeni čaj', [['iced-tea', 259]]],
  ['bademovo mlijeko', [['almond-milk', 254]]],
  ['smoothie', [['smoothie', 262]]],
  ['protein shake', [['protein-shake', 280]]],
  ['mlijeko', [['milk-whole', 258]]],
  ['500 ml mlijeka', [['milk-whole', 516]]],
  ['pivo', [['beer', 502]]],
  ['limenka piva', [['beer', 502]]],
  ['2 piva', [['beer', 1004]]],
  ['čaša crnog vina', [['red-wine', 149]]],
  ['boca vina', [['red-wine', 746]]],
  ['bottle of white wine', [['white-wine', 746]]],
  ['rakija', [['rakija', 38]]],
  ['shot rakije', [['rakija', 38]]],
  ['glass of water', [['water', 250]]],
  ['gouda', [['cheese-gouda', 28]]],
  ['sir', [['cheese-gouda', 28]]],
  ['cheese', [['cheese-cheddar', 28]]],
  ['hrenovka', [['frankfurter', 50]]],
  ['kobasica', [['sausage', 85]]],
  ['5 ćevapa', [['cevapi', 80]]],
  ['10 komada ćevapa', [['cevapi', 160]]],
  ['ćevapi', [['cevapi', 80]]],
  ['2 porcije ćevapa', [['cevapi', 160]]],
  ['masline', [['olives', 22]]],
  ['10 maslina', [['olives', 44]]],
  ['1 avokado', [['avocado', 136]]],
  ['pola avokada', [['avocado', 68]]],
  ['lubenica', [['watermelon', 286]]],
  ['špinat', [['spinach', 180]]],
  ['nutella', [['nutella', 15]]],
  ['biftek', [['beef-steak', 135]]],
  ['maslac', [['butter', 14]]],
  ['tuna', [['tuna-canned', 80]]], // data round 2: Irish adults' median canned-tuna portion; EU 80 g cans (was US 165 g can)
  ['krafna', [['doughnut', 85]]],
  ['burek', [['burek', 150]]],
  ['pizza and a beer', [['pizza', 107], ['beer', 502]]],
  ['slice of pizza', [['pizza', 107]]],
  ['2 kriške kruha', [['bread-white', 58]]],
  ['polubijeli kruh', [['bread-white', 29]]],
  ['riža', [['rice-white', 158]]],
  ['200 g riže', [['rice-white', 200]]],
  ['jabuka', [['apple', 182]]],
  ['2 jabuke', [['apple', 364]]],
  ['banana', [['banana', 118]]],
  ['mrkva', [['carrot', 61]]],
  ['suhe marelice', [['dried-apricots', 40]]],
  ['suhe smokve', [['dried-figs', 40]]],
  ['grožđice', [['raisins', 43]]],
  ['juha od rajčice', [['tomato-soup', 248]]],
  ['grah', [['beans-kidney', 177]]],
  ['leća', [['lentils', 198]]],
  ['tjestenina', [['pasta', 124]]],
  ['3 jaja', [['egg-boiled', 150]]],
  ['kava i kroasan', [['espresso', 30], ['croissant', 57]]],
  ['burger and fries and cola', [['hamburger', 95], ['fries', 71], ['cola', 343]]],
  ['ćevapi s lukom', [['cevapi', 80], ['onion', 110]]],
  ['sendvič', [['sandwich-ham', 184]]],
  // must find NOTHING: these name foods we do not have (a wrong food would be worse)
  ['maline', []], ['cockta', []], ['zobene pahuljice', []], ['oats', []], ['bijeli luk', []], ['bundeva', []],
  ['blitva', []], ['višnje', []], ['njoki', []], // 'mljeveno meso': a food since 2026-10-29 round 2 (cooked ground beef, variants.test.ts)
  ['ovčji sir', []], ['marelice', []], ['smokve', []],
  ['leblebije', []], // 'pecivo' (owner 2026-10-29): now a roll that asks "Which roll or pastry?" (variants.test.ts)
  // 2026-10-18 (owner, VARIANTS-PLAN.md): these now have a food of their own (variant or builder), checked by kind
  // in variants.test.ts: pljeskavica (burger builder), kebab (builder), pureća šunka (turkey ham), goveđa juha (beef
  // noodle soup, closest record), macchiato (espresso + milk recipe). Data round 2 (2026-10-19): turska kava (filter
  // coffee variant "turkish", checked in variants.test.ts); kebab meat 150 g (weighed Italian döner), so 290 g.
  // Data round 3: kebab recalibrated to the same weighed study (vegetables 95 g, sauce 52 g), so 397 g
  ['pljeskavica', [['hamburger', 315]]], ['kebab', [['kebab', 397]]], ['pureća šunka', [['ham', 28]]],
  ['turska kava', [['filter-coffee', 70]]],
  ['goveđa juha', [['chicken-soup', 244]]], ['macchiato', [['coffee-with-milk', 61]]],
];

describe('golden queries: Croatian and English text → food and amount', () => {
  it(`has at least 60 queries (${GOLDEN.length})`, () => expect(GOLDEN.length).toBeGreaterThanOrEqual(60));
  for (const [q, want] of GOLDEN) {
    it(JSON.stringify(q), () => {
      expect(parseMeal(q).map((p) => [p.food.id, Math.round(p.grams)])).toEqual(want);
    });
  }
  it('nothing found degrades gracefully: no wrong suggestion either', () => {
    for (const q of ['maline', 'cockta', 'zobene pahuljice', 'bijeli luk', 'bundeva', 'xyzzy'])
      expect(suggest(q).map((s) => s.parts.map((p) => p.food.id).join('+')), q).toEqual([]);
  });
  it('a short prefix of an unrelated word only suggests, it never logs a food (QA 2026-10-19: "nar" was ham)', () => {
    for (const q of ['nar', 'kro', 'mar', 'sla', 'pi', 'ba', 'co', 'esp']) expect(parseMeal(q).map((p) => p.food.id), q).toEqual([]);
    expect(suggest('nar').map((s) => s.parts[0].food.id)).toEqual(expect.arrayContaining(['ham', 'orange'])); // still offered
    expect(suggest('esp')[0].parts[0].food.id).toBe('espresso'); // Enter still picks it
    for (const [q, id] of [['ban', 'banana'], ['piz', 'pizza'], ['piv', 'beer'], ['keb', 'kebab'], ['naran', 'orange'], ['krump', 'potato-boiled']])
      expect(parseMeal(q).map((p) => p.food.id), q).toEqual([id]);
  });
  it('labels read as English: "2 slices", "10 pieces", "1 can (500 ml)"', () => {
    expect(parseMeal('2 kriške kruha')[0].amountLabel).toBe('2 slices');
    expect(parseMeal('10 komada ćevapa')[0].amountLabel).toBe('10 pieces');
    expect(parseMeal('monster')[0].amountLabel).toBe('1 can (500 ml)');
  });
});

describe('aliases', () => {
  const keys = (f: Food) => new Set([fold(f.name), fold(f.id.replace(/-/g, ' ')), ...f.aliases.map(fold)]);
  it('no exact alias (or name) names two foods', () => {
    const owner = new Map<string, string>();
    for (const f of FOODS) for (const k of keys(f)) {
      expect(owner.get(k), `"${k}" is on ${owner.get(k)} and ${f.id}`).toBeUndefined();
      owner.set(k, f.id);
    }
  });
  it('aliases are Latin script only (the Cyrillic "lećа" is gone)', () => {
    for (const f of FOODS) for (const a of f.aliases) expect(/[Ѐ-ӿ]/.test(a), `${f.id}: ${a}`).toBe(false);
  });
});

// USDA SR Legacy uses food-specific energy factors; for these two the general 4/4/9 sum differs by > 15%.
const ATWATER_EXCEPTIONS: Record<string, string> = {
  sauerkraut: 'USDA 19 kcal vs 16.2 by 4/9/4 (+17%): USDA specific factors for this vegetable',
  mushrooms: 'USDA 22 kcal vs 26.5 by 4/9/4 (−17%): USDA uses lower specific factors for mushrooms',
  'mixed-vegetables': 'USDA 65 kcal vs 56.4 by 4/9/4 (+15.4%): USDA specific factors for the corn, peas and lima beans in the mix (2026-10-29)',
};
describe('energy vs macros (Atwater: 4 kcal/g available carbs and protein, 2 fiber, 9 fat, 7 alcohol)', () => {
  it('every food is within ±15%, or a documented exception', () => {
    for (const f of FOODS) {
      const g = (v: number | null) => v ?? 0, p = f.p, fib = g(p.fiber);
      const sum = 4 * Math.max(0, g(p.carbs) - fib) + 2 * fib + 4 * g(p.protein) + 9 * g(p.fat) + 7 * g(p.alcoholG);
      if (p.kcal < 5 && sum < 5) continue; // water, tea, coffee
      const off = Math.abs(p.kcal - sum) / sum;
      if (ATWATER_EXCEPTIONS[f.id]) { expect(off, `${f.id} is no longer an exception`).toBeGreaterThan(0.15); continue; }
      expect(off, `${f.id}: ${p.kcal} kcal vs ${sum.toFixed(1)}`).toBeLessThanOrEqual(0.15);
    }
  });
});

const perServing = (id: string, k: keyof Food['p'], grams = FOOD_BY_ID[id].serving.grams) => ((FOOD_BY_ID[id].p[k] ?? 0) * grams) / 100;
describe('label overrides: exactly the label, and the source is shown', () => {
  it('cola = the EU can label the cola story uses (139 kcal, 35 g sugar, 0 fat, 32 mg caffeine per 330 ml)', () => {
    expect(perServing('cola', 'kcal')).toBeCloseTo(COLA.eu.kcal, 1);
    expect(perServing('cola', 'sugars')).toBeCloseTo(COLA.eu.sugarG, 1);
    expect(perServing('cola', 'freeSugars')).toBeCloseTo(COLA.eu.sugarG, 1);
    expect(perServing('cola', 'fat')).toBe(0);
    expect(perServing('cola', 'caffeineMg')).toBeCloseTo(COLA.caffeineMg, 1);
  });
  it('Red Bull: 80 mg caffeine and 27.5 g sugar per 250 ml can (32 mg, 11 g per 100 ml)', () => {
    expect(FOOD_BY_ID['energy-drink'].serving.label).toBe('1 can (250 ml)');
    expect(perServing('energy-drink', 'caffeineMg')).toBeCloseTo(80, 1);
    expect(perServing('energy-drink', 'sugars')).toBeCloseTo(27.5, 1);
    expect(perServing('energy-drink', 'kcal')).toBeCloseTo(115, 0);
  });
  it('Monster: one 500 ml can = 160 mg caffeine and 55 g sugar (label 32 mg and 11 g per 100 ml)', () => {
    const m = parseMeal('monster')[0];
    expect((m.food.p.caffeineMg! * m.grams) / 100).toBeCloseTo(160, 0);
    expect((m.food.p.sugars! * m.grams) / 100).toBeCloseTo(55, 0);
  });
  it('Nutella: Ferrero label per 100 g, 15 g portion', () => {
    const p = FOOD_BY_ID.nutella.p;
    expect([p.kcal, p.fat, p.satFat, p.carbs, p.sugars, p.protein]).toEqual([539, 30.9, 10.6, 57.5, 56.3, 6.3]);
    expect(p.sodiumMg).toBe(43);
    expect(p.fiber).toBeNull(); // not declared; never USDA fiber on top of an EU (fiber-free) carbohydrate
    expect(FOOD_BY_ID.nutella.serving.grams).toBe(15);
  });
  it('Parmesan sodium 650 mg (Consortium); olives 1000 mg (EU labels 800–1200); ćevapi ≈ 742 mg (labels, cooked)', () => {
    expect(FOOD_BY_ID['cheese-parmesan'].p.sodiumMg).toBe(650);
    expect(FOOD_BY_ID.olives.p.sodiumMg).toBe(1000);
    expect(FOOD_BY_ID.cevapi.p.sodiumMg).toBeCloseTo(742, 0);
  });
  it('burek: Čakovečki mlinovi label (297 kcal, 16 g fat, 3.3 g sugar per 100 g), flagged as a proxy', () => {
    const b = FOOD_BY_ID.burek;
    expect([b.p.kcal, b.p.fat, b.p.satFat, b.p.carbs, b.p.sugars, b.p.protein, b.p.sodiumMg]).toEqual([297, 16, 7.5, 29, 3.3, 9.7, 560]);
    expect(b.proxy).toBe(true);
  });
  it('every override has its own claim with a level, text and an existing source', () => {
    const withSrc = FOODS.filter((f) => f.src?.length);
    expect(withSrc.map((f) => f.id).sort()).toEqual(['burek', 'cevapi', 'cheese-parmesan', 'cola', 'energy-drink', 'nutella', 'olives']);
    for (const f of withSrc) {
      const ids = foodSourceClaims(f.id);
      expect(ids.length).toBe(f.src!.length);
      for (const id of ids) { const c = FOOD_CLAIMS[id]; expect(c, id).toBeDefined(); for (const s of c.sources) expect(SOURCES[s]?.url, id).toMatch(/^https:/); }
    }
  });
  it('the source shows where the food’s data is cited (first chapter, and caffeine where caffeine is replaced)', () => {
    const b = makeFoodProduct(parseMeal('red bull'), 'food').build(DEFAULT_PROFILE, 63);
    const first = b.story.chapters[0].claims;
    expect(first).toContain(foodSourceClaims('energy-drink')[0]);
    expect(b.story.chapters.find((c) => c.title === 'Caffeine peak')?.claims).toContain(foodSourceClaims('energy-drink')[0]);
    const plain = makeFoodProduct(parseMeal('banana'), 'food').build(DEFAULT_PROFILE, 63);
    expect(plain.story.chapters[0].claims.some((id) => id.startsWith('DBO-'))).toBe(false);
  });
});

describe('servings and health bars read the database (one number everywhere)', () => {
  it('health-bar alcohol and sugar equal the database servings', () => {
    expect(ETHANOL_G.beer).toBeCloseTo(perServing('beer', 'alcoholG'), 1);
    expect(ETHANOL_G.wine).toBeCloseTo((perServing('red-wine', 'alcoholG') + perServing('white-wine', 'alcoholG')) / 2, 1);
    expect(ITEM_FX.juice.freeSugarG).toBeCloseTo(perServing('orange-juice', 'freeSugars'), 1);
    expect(ITEM_FX.chocolate.freeSugarG).toBeCloseTo(perServing('chocolate-milk-bar', 'freeSugars', 40), 1);
    expect(ITEM_FX.tea.caffeineMg).toBeCloseTo(perServing('green-tea', 'caffeineMg'), 1);
    expect(ITEM_FX.cola.freeSugarG).toBe(COLA.eu.sugarG);
  });
  it('free-sugar rules: protein shake and crisps 0, milk chocolate / tomato soup / peanut butter upper bound', () => {
    expect(FOOD_BY_ID['protein-shake'].p.freeSugars).toBe(0);
    expect(FOOD_BY_ID['potato-chips'].p.freeSugars).toBe(0);
    for (const id of ['chocolate-milk-bar', 'tomato-soup', 'peanut-butter']) expect(FOOD_BY_ID[id].p.freeSugars, id).toBe(FOOD_BY_ID[id].p.sugars);
  });
  it('drink densities are physical (0.99–1.06 g/ml for sweet drinks and plant milks)', () => {
    for (const id of ['iced-tea', 'almond-milk', 'smoothie', 'energy-drink']) {
      const f = FOOD_BY_ID[id], ml = Number(/([\d.]+)\s*ml/.exec(f.serving.label)![1]);
      const d = f.serving.grams / ml;
      expect(d, id).toBeGreaterThan(0.99); expect(d, id).toBeLessThan(1.06);
    }
  });
  it('kebab is back as a builder of USDA parts (owner 2026-10-18); new GI values from Atkinson 2008 Suppl. A1 are in', () => {
    expect(FOOD_BY_ID.kebab.recipe).toBe(true);
    expect(Math.round((FOOD_BY_ID.kebab.p.kcal * FOOD_BY_ID.kebab.serving.grams) / 100)).toBe(762); // chicken in pita, the default (150 g meat, data round 2; 100 g pita, QA 2026-10-19; data round 3: thigh with skin, 95 g vegetables, 52 g sauce, Panozzo 2015)
    expect([FOOD_BY_ID.carrot.gi, FOOD_BY_ID['dried-apricots'].gi, FOOD_BY_ID['tomato-soup'].gi, FOOD_BY_ID['dried-figs'].gi, FOOD_BY_ID.raisins.gi]).toEqual([35, 31, 52, 61, 64]);
  });
});
