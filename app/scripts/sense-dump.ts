// "Does this make sense to a normal person?" audit dump (research/improvements/sense-audit-2026-10-18.md).
// Prints every user-visible sentence (lights, answers, story chapters, day summary, organ cards) per scenario:
// every food at 1×, every drink at 1/3/5/10× (alcohol also 15×), morning / evening / 23:00, fasting vs with a meal,
// small and big bodies. Run from app/:  npx vite-node scripts/sense-dump.ts [outFile] [filter]
import { writeFileSync } from 'node:fs';
import { DEFAULT_PROFILE, type Profile } from '../src/science/profile';
import { FOODS, servingPart, type Food } from '../src/v4/food/parse';
import { analyze } from '../src/v4/analyze';
import { verdict } from '../src/v4/status';
import { chapterText } from '../src/v4/stories';
import { PRODUCTS } from '../src/v4/products';
import { makeFoodProduct } from '../src/v4/food/foodProduct';

const out: string[] = [];
const filter = process.argv[3] ? new RegExp(process.argv[3]) : null;
const hh = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m) % 60).padStart(2, '0')}`;

const BODIES: Record<string, Partial<Profile>> = {
  small: { sex: 'female', weightKg: 50, heightCm: 160, ageY: 25 },
  big: { sex: 'male', weightKg: 100, heightCm: 185, ageY: 45 },
};
const TIMES: Record<string, number> = { morning: 8 * 60, evening: 19 * 60, late: 23 * 60 };

function dump(food: Food, n: number, body: string, time: string, fed: boolean) {
  const p: Profile = { ...DEFAULT_PROFILE, ...BODIES[body], drinkAtMin: TIMES[time], withMeal: fed };
  const parts = [servingPart(food, n)];
  const key = `${food.id} ×${n} | ${body} | ${time} ${hh(p.drinkAtMin)} | ${fed ? 'fed' : 'fasting'}`;
  if (filter && !filter.test(key)) return;
  const a = analyze(parts, p);
  out.push(`\n=== ${key} — ${a.name} (${parts[0].amountLabel})`);
  // lights: label + the levels it reaches + the sentence at its worst moment
  for (const s of a.systems) {
    let worst = 0, wm = 0; for (let m = 0; m < s.levels.length; m++) if (s.levels[m] > worst) { worst = s.levels[m]; wm = m; }
    out.push(`  LIGHT ${s.label}${s.unknown ? ' [not measured]' : ''}: worst ${worst} @${hh(p.drinkAtMin + wm)} · "${s.says(worst as 0 | 1 | 2, wm)}" · at start "${s.says(s.levels[0] as 0 | 1 | 2, 0)}"`);
  }
  out.push(`  SUMMARY ${verdict(a.systems, p.drinkAtMin)}`);
  for (const x of a.answers) out.push(`  ANSWER [${x.tone}] ${x.q} → ${x.a}${x.note ? `  (${x.note})` : ''}`);
  for (const c of a.built.story.chapters) out.push(`  CH ${hh(p.drinkAtMin + c.min)} +${Math.round(c.min)}m ${c.title}: ${chapterText(c, c.min)}`);
  const one = parts[0];
  const curated = PRODUCTS[one.food.id] && Math.abs(one.grams - one.food.serving.grams) < 1 && ['cola', 'espresso', 'water'].includes(one.food.id);
  const def = curated ? PRODUCTS[one.food.id] : makeFoodProduct(parts, 'food');
  for (const k of ['liver', 'brain', 'pancreas'] as const) {
    const card = def.organ(k, a.built, 60);
    if (card) out.push(`  ORGAN ${card.name}@+60: ${card.text} ${card.lines.map((l) => `${l.label}=${l.value}`).join('; ')}`);
  }
}

const drinks = FOODS.filter((f) => f.kind === 'liquid');
const alcohol = FOODS.filter((f) => (f.p.alcoholG ?? 0) > 0);
// 1) every food at 1×, default-ish bodies, three times, fasting
for (const f of FOODS) for (const t of Object.keys(TIMES)) for (const b of Object.keys(BODIES)) dump(f, 1, b, t, false);
// 2) drinks at 3, 5, 10× (alcohol also 15×), fasting and fed
for (const f of drinks) for (const n of (alcohol.includes(f) ? [1, 3, 5, 10, 15] : [3, 5, 10])) for (const t of Object.keys(TIMES)) for (const b of Object.keys(BODIES)) for (const fed of [false, true]) {
  if (n === 1 && !fed) continue; // already in (1)
  dump(f, n, b, t, fed);
}
const file = process.argv[2] ?? 'sense-dump.txt';
writeFileSync(file, out.join('\n'));
console.log(`wrote ${out.length} lines to ${file}`);
