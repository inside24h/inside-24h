import { useEffect, useMemo, useRef, useState } from 'react';
import { FOODS, fold, servingText, type Food, type Part } from './food/parse';
import { PRESETS, presetParts } from './food/meal';
import './meals.css';
import { useModal } from './a11y';

// "See all": every food and drink in one scrollable list, grouped, with a filter. Picking works exactly like picking from search.
const GROUPS: { name: string; test: (f: Food) => boolean }[] = [
  { name: 'Water & soft drinks', test: (f) => /^(water|sparkling-water|cola|diet-cola|lemonade|energy-drink|coconut-water|iced-tea)$/.test(f.id) },
  { name: 'Coffee & tea', test: (f) => /coffee|espresso|cappuccino|latte|-tea$/.test(f.id) },
  { name: 'Juice & smoothies', test: (f) => /juice|smoothie/.test(f.id) },
  { name: 'Alcohol', test: (f) => /^(beer|red-wine|white-wine|rakija)$/.test(f.id) },
  { name: 'Milk & plant milks', test: (f) => /milk|buttermilk|kefir|hot-chocolate|protein-shake/.test(f.id) && f.kind !== 'solid' && !/bar/.test(f.id) },
  { name: 'Dairy & eggs', test: (f) => /yogurt|cheese|egg-|^butter$/.test(f.id) },
  { name: 'Fruit', test: (f) => /^(apple|banana|orange|mandarin|grapes|strawberries|watermelon|melon|pear|peach|cherries|plum|kiwi|pineapple|blueberries|avocado|raisins|dried-apricots|dried-figs|dates)$/.test(f.id) },
  { name: 'Vegetables & legumes', test: (f) => /^(beans-|lentils|chickpeas|peas|salad|cabbage|sauerkraut|tomato$|cucumber|carrot|broccoli|onion|pepper|spinach|zucchini|mushroom|sweet-corn|sweet-potato|olives|tofu|hummus)/.test(f.id) },
  { name: 'Meat & fish', test: (f) => /chicken-breast|beef|cevapi|pork|lamb|tuna|salmon|^cod$|sardines|^ham$|sausage|frankfurter|salami|bacon/.test(f.id) },
  { name: 'Bread, grains & meals', test: (f) => /bread|burek|pizza|pasta|rice-|potato-|fries|oatmeal|cornflakes|muesli|crackers|pancake|soup|hamburger|kebab|sandwich|croissant/.test(f.id) },
  { name: 'Sweets, nuts & snacks', test: (f) => /almonds|walnuts|hazelnuts|peanut|sunflower|nutella|chocolate|ice-cream|biscuit|cake|doughnut|honey|sugar|jam|chips|popcorn|rice-cakes|olive-oil/.test(f.id) },
];
const OTHER = 'More foods';
const groupOf = (f: Food) => GROUPS.find((g) => g.test(f))?.name ?? OTHER;

const one = (f: Food): Part[] => [{ food: f, grams: f.serving.grams, amountLabel: servingText(f), assumed: !!f.assumedServing }];

/** `onAdd`: a small "+" on each row adds that food to the current meal instead of replacing it. */
export function Browse({ onPick, onClose, onAdd }: { onPick: (parts: Part[], text: string) => void; onClose: () => void; onAdd?: (parts: Part[], text: string) => void }) {
  const [q, setQ] = useState('');
  const box = useRef<HTMLDivElement>(null);
  // focus into the list's filter, Tab stays inside, Esc closes, focus returns to the opener (a11y.ts)
  useModal(box, true, onClose);
  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const groups = useMemo(() => {
    const t = fold(q);
    const list = t ? FOODS.filter((f) => [f.name, ...f.aliases].some((w) => fold(w).includes(t))) : FOODS;
    const names = [...GROUPS.map((g) => g.name), OTHER];
    return names.map((name) => ({ name, items: list.filter((f) => groupOf(f) === name) })).filter((g) => g.items.length);
  }, [q]);
  const shown = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="browse" role="dialog" aria-modal="true" aria-label="All foods and drinks" ref={box} tabIndex={-1}>
      <header className="bhead">
        <div className="btitle"><b>All foods and drinks</b><span aria-live="polite">{q ? `${shown} of ${FOODS.length}` : `${FOODS.length} items`}</span></div>
        <button className="bclose" onClick={onClose} aria-label="Close">✕</button>
      </header>
      <label className="bfilter">
        <input type="search" data-autofocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter, e.g. coffee, bread or apple" aria-label="Filter the list" />
      </label>
      <div className="bscroll">
        {!q && (
          <section className="bmeals">
            <h3>Popular meals <small>{PRESETS.length}</small></h3>
            <div className="mealpresets inbrowse">
              {PRESETS.map((p) => <button key={p.id} type="button" onClick={() => onPick(presetParts(p), p.name)}><b>{p.name}</b><small>{p.sub}</small></button>)}
            </div>
          </section>
        )}
        {shown === 0 && <p className="bempty">Nothing matches “{q}”. Try a simpler word.</p>}
        {groups.map((g) => (
          <section key={g.name}>
            <h3>{g.name} <small>{g.items.length}</small></h3>
            <ul>
              {g.items.map((f) => (
                <li key={f.id} className={onAdd ? 'withadd' : ''}>
                  <button onClick={() => onPick(one(f), f.name)}>
                    <i style={{ background: f.color }} aria-hidden="true" />
                    <span className="bn">{f.name}<small>{servingText(f)}</small></span>                  </button>
                  {onAdd && <button className="badd" aria-label={`Add ${f.name} to the meal`} title="Add to the meal" onClick={() => onAdd(one(f), f.name)}>+</button>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
