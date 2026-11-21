// Coverage round 2026-11-17 (owner: "videos for ANY food"; search found no mojito, gin tonic, sushi, tacos, burrito,
// scrambled eggs). 183 of the most searched / eaten foods and drinks in the US and EU (breakfast, fast food, cocktails
// and spirits, coffee shop, Asian / Mexican / Italian dishes, snacks, desserts, sports and energy drinks): 69 resolved
// before this round, 169 after. Every query below must keep resolving, to the same food, with nothing left over.
// The foods are USDA SR Legacy or FNDDS 2021-2023 records (research/tools/fooddb_spec.py, "COVERAGE 2026-11-17").
// Not found on 2026-11-17: trail mix, cider, poke bowl, carbonara, pina colada, cosmopolitan, aperol spritz, negroni, cuba
// libre, long island iced tea, flat white, frappuccino, chai latte, matcha latte. All but long island iced tea are in
// since 2026-11-20 (the second block below): USDA FNDDS records, or standard recipes from USDA parts.
import { describe, expect, it } from 'vitest';
import { FOOD_BY_ID, baseOf, readMeal } from './parse';

/** [what people type, the food name(s) it must resolve to] */
const COVERAGE: [string, string][] = [
  ["scrambled eggs", "Scrambled eggs (or omelet)"],
  ["omelette", "Scrambled eggs (or omelet)"],
  ["bacon and eggs", "Bacon (cooked) + Egg (hard-boiled)"],
  ["pancakes", "Pancakes (US-style)"],
  ["waffles", "Waffle"],
  ["french toast", "French toast"],
  ["bagel", "Bagel"],
  ["bagel with cream cheese", "Bagel with cream cheese"],
  ["toast", "Ham and cheese toast"],
  ["cereal", "Cornflakes"],
  ["granola", "Granola"],
  ["oatmeal", "Oatmeal (cooked)"],
  ["greek yogurt", "Greek yogurt (plain, low fat)"],
  ["muffin", "Muffin"],
  ["croissant", "Croissant"],
  ["english muffin", "English muffin"],
  ["hash browns", "Hash browns"],
  ["sausage", "Sausage (pork, cooked)"],
  ["avocado toast", "Avocado toast"],
  ["peanut butter", "Peanut butter"],
  ["breakfast burrito", "Breakfast burrito"],
  ["smoothie", "Fruit smoothie (juice-based)"],
  ["orange juice", "Orange juice"],
  ["hamburger", "Hamburger (fast food)"],
  ["cheeseburger", "Cheeseburger"],
  ["big mac", "Double burger"],
  ["whopper", "Large cheeseburger"],
  ["french fries", "French fries"],
  ["chicken nuggets", "Chicken nuggets"],
  ["fried chicken", "Fried chicken"],
  ["hot dog", "Frankfurter / hot-dog sausage"],
  ["pizza", "Pizza (cheese)"],
  ["pepperoni pizza", "Pepperoni pizza"],
  ["chicken sandwich", "Chicken sandwich"],
  ["fish and chips", "Fish and chips"],
  ["onion rings", "Onion rings (breaded)"],
  ["milkshake", "Milk shake (vanilla)"],
  ["chicken wings", "Chicken wings"],
  ["kebab", "Kebab / doner"],
  ["gyros", "Kebab / doner"],
  ["sub", "Ham sandwich (sub)"],
  ["burrito", "Burrito"],
  ["tacos", "Taco"],
  ["taco", "Taco"],
  ["nachos", "Nachos (with cheese and meat)"],
  ["quesadilla", "Quesadilla"],
  ["chips and salsa", "Chips and salsa"],
  ["guacamole", "Guacamole"],
  ["enchilada", "Enchilada"],
  ["fajitas", "Fajita"],
  ["sushi", "Sushi"],
  ["california roll", "California roll"],
  ["ramen", "Ramen (noodle soup bowl)"],
  ["pad thai", "Pad Thai"],
  ["fried rice", "Fried rice"],
  ["chow mein", "Chicken chow mein"],
  ["spring roll", "Egg roll"],
  ["dumplings", "Dumplings (steamed)"],
  ["pho", "Pho (Vietnamese noodle soup)"],
  ["curry", "Chicken curry with rice"],
  ["chicken tikka masala", "Chicken tikka masala with rice"],
  ["butter chicken", "Chicken tikka masala with rice"],
  ["naan", "Naan bread"],
  ["teriyaki chicken", "Teriyaki chicken"],
  ["orange chicken", "Orange chicken"],
  ["miso soup", "Miso soup"],
  ["edamame", "Edamame"],
  ["tofu", "Tofu (firm)"],
  ["spaghetti bolognese", "Spaghetti bolognese"],
  ["lasagna", "Lasagna (with meat)"],
  ["risotto", "Risotto (creamy rice with cheese)"],
  ["gnocchi", "Gnocchi (potato)"],
  ["mac and cheese", "Macaroni and cheese"],
  ["garlic bread", "Garlic bread"],
  ["tiramisu", "Tiramisu (layer cake)"],
  ["caesar salad", "Caesar salad"],
  ["minestrone", "Minestrone soup"],
  ["ravioli", "Ravioli (with tomato sauce)"],
  ["mojito", "Mojito"],
  ["gin tonic", "Gin and tonic"],
  ["gin and tonic", "Gin and tonic"],
  ["margarita", "Margarita"],
  ["old fashioned", "Old fashioned"],
  ["martini", "Martini"],
  ["bloody mary", "Bloody Mary"],
  ["rum and coke", "Rum and cola"],
  ["whiskey", "Whiskey"],
  ["vodka", "Vodka (40%)"],
  ["gin", "Gin"],
  ["rum", "Rum"],
  ["tequila", "Tequila"],
  ["daiquiri", "Daiquiri"],
  ["moscow mule", "Moscow mule"],
  ["mimosa", "Mimosa"],
  ["sangria", "Sangria"],
  ["hard seltzer", "Hard seltzer"],
  ["champagne", "Sparkling wine"],
  ["prosecco", "Sparkling wine"],
  ["espresso", "Espresso"],
  ["latte", "Latte"],
  ["cappuccino", "Cappuccino"],
  ["americano", "Americano"],
  ["mocha", "Mocha"],
  ["caramel macchiato", "Flavored latte"],
  ["iced coffee", "Iced coffee"],
  ["cold brew", "Cold brew coffee"],
  ["hot chocolate", "Hot chocolate (homemade, with milk)"],
  ["iced latte", "Iced latte"],
  ["chips", "Potato chips"],
  ["popcorn", "Popcorn (air-popped)"],
  ["pretzels", "Soft pretzel"],
  ["nuts", "Almonds"],
  ["granola bar", "Granola bar"],
  ["protein bar", "Protein bar"],
  ["crackers", "Crackers (saltines)"],
  ["beef jerky", "Beef jerky"],
  ["hummus", "Hummus"],
  ["ice cream", "Ice cream (vanilla)"],
  ["chocolate cake", "Chocolate cake"],
  ["cheesecake", "Cheesecake"],
  ["brownie", "Brownie"],
  ["cookie", "Butter cookies"],
  ["donut", "Doughnut (jam-filled)"],
  ["apple pie", "Apple pie"],
  ["cupcake", "Cupcake"],
  ["chocolate bar", "Milk chocolate"],
  ["candy", "Gummy candy"],
  ["gelato", "Gelato"],
  ["pudding", "Pudding (chocolate)"],
  ["frozen yogurt", "Frozen yogurt"],
  ["snickers", "Candy bar (peanut and caramel)"],
  ["red bull", "Energy drink"],
  ["monster", "Energy drink"],
  ["gatorade", "Sports drink"],
  ["powerade", "Powerade"],
  ["energy drink", "Energy drink"],
  ["protein shake", "Protein shake (whey + milk)"],
  ["coconut water", "Coconut water"],
  ["sports drink", "Sports drink"],
  ["kombucha", "Kombucha"],
  ["water", "Water (tap)"],
  ["coke", "Cola (regular)"],
  ["diet coke", "Diet cola"],
  ["sprite", "Lemon-lime soda"],
  ["ginger ale", "Ginger ale"],
  ["lemonade", "Lemonade (ready to drink)"],
  ["iced tea", "Iced tea (sweetened)"],
  ["beer", "Beer (regular)"],
  ["wine", "Red wine"],
  ["sparkling water", "Sparkling mineral water"],
  ["tonic water", "Tonic water"],
  ["steak", "Beef steak (grilled)"],
  ["grilled chicken", "Grilled chicken breast"],
  ["salmon", "Salmon (cooked)"],
  ["meatballs", "Meatballs (in sauce)"],
  ["mashed potatoes", "Mashed potato (milk and butter)"],
  ["baked potato", "Baked potato"],
  ["salad", "Green salad (lettuce)"],
  ["chicken soup", "Chicken noodle soup"],
  ["chili", "Chili con carne"],
  ["grilled cheese", "Grilled cheese sandwich"],
  ["club sandwich", "Club sandwich"],
  ["tuna sandwich", "Tuna sub"],
  ["peanut butter and jelly sandwich", "Peanut butter and jelly sandwich"],
  ["quinoa", "Quinoa (cooked)"],
  ["rice", "White rice (cooked)"],
  ["pasta", "Pasta (cooked)"],
  ["falafel", "Falafel (chickpea patties)"],
  ["shawarma", "Kebab / doner"],
  ["hot dog in a bun", "Hot dog in a bun"],
];

/** Foods added in the coverage round: each of their search words must find them (a word is lost when the parser reads
 *  it as an amount: "a", "cup", "7" …). */
const NEW_FOODS = ['scrambled-eggs', 'waffles', 'french-toast', 'bagel', 'english-muffin', 'hash-browns', 'granola', 'avocado-toast',
  'chicken-nuggets', 'fried-chicken', 'onion-rings', 'milkshake', 'fried-fish', 'burrito', 'taco', 'nachos', 'quesadilla', 'enchilada',
  'fajita', 'guacamole', 'salsa', 'tortilla-chips', 'sushi', 'ramen', 'pad-thai', 'fried-rice', 'lo-mein', 'egg-roll', 'dumplings', 'pho',
  'curry', 'naan', 'teriyaki-chicken', 'orange-chicken', 'miso-soup', 'edamame', 'spaghetti-bolognese', 'lasagna', 'gnocchi',
  'mac-and-cheese', 'garlic-bread', 'tiramisu', 'minestrone', 'ravioli', 'vodka', 'mojito', 'hard-seltzer',
  'lemon-lime-soda', 'ginger-ale', 'tonic-water', 'root-beer', 'fruit-soda', 'sports-drink', 'kombucha', 'granola-bar',
  'protein-bar', 'beef-jerky', 'brownie', 'apple-pie', 'pudding', 'candy-bar', 'meatballs', 'potato-baked', 'chili', 'quinoa', 'falafel',
  'caesar-salad', 'risotto'];
/** Variants added to foods that were already there */
const NEW_VARIANTS: [string, string[]][] = [['filter-coffee', ['iced', 'cold-brew']], ['latte', ['iced', 'flavored', 'mocha', 'iced-mocha']],
  ['red-wine', ['sangria']], ['chicken-breast', ['grilled']], ['ice-cream', ['gelato', 'froyo']], ['cake-sponge', ['cupcake']], ['frankfurter', ['bun']]];

describe('coverage of commonly searched foods (2026-11-17)', () => {
  it('lists at least 150 queries', () => expect(COVERAGE.length).toBeGreaterThanOrEqual(150));
  for (const [q, names] of COVERAGE) {
    it(`"${q}" → ${names}`, () => {
      const r = readMeal(q);
      expect(r.left).toEqual([]);
      expect(r.parts.map((p) => p.food.name).join(' + ')).toBe(names);
    });
  }
  it('every search word of a new food finds that food', () => {
    const bad: string[] = [];
    for (const id of NEW_FOODS) {
      const f = FOOD_BY_ID[id];
      expect(f, id).toBeDefined();
      for (const a of f.aliases) {
        const parts = readMeal(a).parts;
        if (parts.length !== 1 || baseOf(parts[0].food).id !== id) bad.push(`${a} → ${parts.map((p) => p.food.name).join(' + ') || 'nothing'}`);
      }
      for (const v of f.variants ?? []) {
        for (const a of v.aliases) {
          const parts = readMeal(a).parts;
          if (parts.length !== 1 || baseOf(parts[0].food).id !== id || parts[0].food.v !== v.v) bad.push(`${a} → ${parts.map((p) => p.food.name).join(' + ') || 'nothing'} (want ${v.name})`);
        }
      }
    }
    for (const [id, vs] of NEW_VARIANTS) {
      for (const v of FOOD_BY_ID[id].variants!.filter((x) => vs.includes(x.v))) {
        for (const a of v.aliases) {
          const parts = readMeal(a).parts;
          if (parts.length !== 1 || parts[0].food.v !== v.v) bad.push(`${a} → ${parts.map((p) => p.food.name).join(' + ') || 'nothing'} (want ${v.name})`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
  it('new foods are USDA records with a serving, English names and no parentheses in variant names', () => {
    for (const id of NEW_FOODS) {
      const f = FOOD_BY_ID[id];
      expect(f.serving.grams, id).toBeGreaterThan(0);
      expect(f.p.kcal, id).not.toBeNull();
      expect(/[čćšžđ]/i.test(f.name), id).toBe(false);
      for (const v of f.variants ?? []) {
        expect(/[čćšžđ()]/i.test(v.name), `${id}.${v.v}`).toBe(false);
        expect(v.serving.grams, `${id}.${v.v}`).toBeGreaterThan(0);
      }
    }
  });
});

// 2026-11-20: the foods left out on 2026-11-17 (fooddb_spec.py "COVERAGE 2026-11-20").
// (A) USDA FNDDS records: cola and energy-drink cocktails, pina colada, hard cider, trail mix; the video side now tells
//     their story (caffeine with alcohol: video-story singleStops, CDC 2024 [AL18]; trail mix: video-caption captionFlags).
// (B) standard recipes from USDA parts: IBA cocktails, cafe drinks, carbonara (Giallo Zafferano), poke (RecipeTin Eats).
const COVERAGE2: [string, string][] = [
  ["rum and coke", "Rum and cola"], ["cuba libre", "Rum and cola"], ["jack and coke", "Whiskey and cola"], ["whiskey and coke", "Whiskey and cola"],
  ["vodka and coke", "Vodka and cola"], ["vodka red bull", "Vodka and energy drink"], ["vodka redbull", "Vodka and energy drink"],
  ["pina colada", "Pina colada"], ["piña colada", "Pina colada"], ["cider", "Cider (hard, alcoholic)"], ["hard cider", "Cider (hard, alcoholic)"],
  ["trail mix", "Trail mix (nuts and dried fruit)"], ["studentska hrana", "Trail mix (nuts and dried fruit)"], ["chocolate trail mix", "Trail mix with chocolate"],
  ["cosmopolitan", "Cosmopolitan"], ["negroni", "Negroni"], ["aperol spritz", "Aperol spritz"], ["spritz", "Aperol spritz"],
  ["flat white", "Flat white"], ["frappuccino", "Mocha frappe"], ["frappe", "Mocha frappe"], ["chai latte", "Chai latte"], ["chai", "Chai latte"],
  ["matcha", "Matcha (whisked green tea)"], ["matcha latte", "Matcha latte"],
  ["carbonara", "Spaghetti carbonara"], ["spaghetti carbonara", "Spaghetti carbonara"], ["poke bowl", "Poke bowl"], ["poke", "Poke bowl"],
  // the words that already worked keep working
  ["rum", "Rum"], ["cola", "Cola (regular)"], ["red bull", "Energy drink"], ["vodka", "Vodka (40%)"], ["martini", "Martini"], ["latte", "Latte"],
  ["black tea", "Black tea"], ["green tea", "Green tea"], ["rum and cola", "Rum and cola"], ["prosecco", "Sparkling wine"],
];
const NEW_FOODS2 = ['hard-cider', 'trail-mix', 'matcha'];
const NEW_VARIANTS2: [string, string[]][] = [['mojito', ['rum-cola', 'whiskey-cola', 'vodka-cola', 'vodka-energy', 'pina-colada', 'cosmopolitan', 'negroni', 'aperol-spritz']],
  ['coffee-with-milk', ['flat-white', 'mocha-frappe']], ['black-tea', ['chai-latte']], ['spaghetti-bolognese', ['carbonara']], ['sushi', ['poke']]];

describe('coverage of the foods left out on 2026-11-17 (2026-11-20)', () => {
  for (const [q, names] of COVERAGE2) {
    it(`"${q}" → ${names}`, () => {
      const r = readMeal(q);
      expect(r.left).toEqual([]);
      expect(r.parts.map((p) => p.food.name).join(' + ')).toBe(names);
    });
  }
  it('every search word of a new food or variant finds it', () => {
    const bad: string[] = [];
    const say = (a: string, parts: ReturnType<typeof readMeal>['parts'], want = '') => bad.push(`${a} → ${parts.map((p) => p.food.name).join(' + ') || 'nothing'}${want ? ` (want ${want})` : ''}`);
    for (const id of NEW_FOODS2) {
      const f = FOOD_BY_ID[id];
      expect(f, id).toBeDefined();
      for (const a of f.aliases) { const parts = readMeal(a).parts; if (parts.length !== 1 || baseOf(parts[0].food).id !== id) say(a, parts); }
      for (const v of f.variants ?? []) for (const a of v.aliases) {
        const parts = readMeal(a).parts;
        if (parts.length !== 1 || baseOf(parts[0].food).id !== id || parts[0].food.v !== v.v) say(a, parts, v.name);
      }
    }
    for (const [id, vs] of NEW_VARIANTS2) {
      const have = (FOOD_BY_ID[id].variants ?? []).filter((x) => vs.includes(x.v));
      expect(have.map((x) => x.v).sort(), id).toEqual([...vs].sort());
      for (const v of have) for (const a of v.aliases) { const parts = readMeal(a).parts; if (parts.length !== 1 || parts[0].food.v !== v.v) say(a, parts, v.name); }
    }
    expect(bad).toEqual([]);
  });
  it('names are English, servings and calories are there, variant names have no parentheses', () => {
    for (const id of NEW_FOODS2) {
      const f = FOOD_BY_ID[id];
      expect(f.serving.grams, id).toBeGreaterThan(0);
      expect(f.p.kcal, id).not.toBeNull();
      expect(/[čćšžđ]/i.test(f.name), id).toBe(false);
    }
    for (const [id, vs] of NEW_VARIANTS2) for (const v of FOOD_BY_ID[id].variants!.filter((x) => vs.includes(x.v))) {
      expect(/[čćšžđ()]/i.test(v.name), `${id}.${v.v}`).toBe(false);
      expect(v.serving.grams, `${id}.${v.v}`).toBeGreaterThan(0);
    }
  });
  // what the records and recipes give (USDA FNDDS; IBA specs from USDA parts and producer labels): a change shows here
  const per = (q: string, k: 'alcoholG' | 'caffeineMg' | 'kcal') => { const p = readMeal(q).parts[0]; return ((p.food.p[k] ?? 0) * p.grams) / 100; };
  it('cola and energy-drink cocktails carry both the alcohol and the caffeine of their records', () => {
    expect(per('vodka red bull', 'alcoholG')).toBeCloseTo(18.7, 0);
    expect(per('vodka red bull', 'caffeineMg')).toBeCloseTo(49.5, 0);
    expect(per('rum and coke', 'caffeineMg')).toBeCloseTo(15.8, 0);
    expect(per('pina colada', 'caffeineMg')).toBe(0);
  });
  it('IBA cocktails: the alcohol of their parts (vodka 40 ml + Cointreau 15 ml; gin + Campari + vermouth; prosecco + Aperol; the aperitifs are recipe ingredients, fooddb_spec ingr)', () => {
    expect(per('cosmopolitan', 'alcoholG')).toBeCloseTo(17.4, 0);
    expect(per('negroni', 'alcoholG')).toBeCloseTo(18.9, 0);
    expect(per('aperol spritz', 'alcoholG')).toBeCloseTo(13.9, 0);
  });
  it('cafe drinks: espresso shots and matcha set the caffeine; carbonara and poke are full plates', () => {
    expect(Math.abs(per('flat white', 'caffeineMg') - 127)).toBeLessThan(2);
    expect(per('matcha latte', 'caffeineMg')).toBeCloseTo(45, 0);
    expect(per('carbonara', 'kcal')).toBeGreaterThan(500);
    expect(per('poke bowl', 'kcal')).toBeGreaterThan(500);
  });
});
