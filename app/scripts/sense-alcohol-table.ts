// Alcohol gone-times by number of drinks (sense audit 2026-10-18). Run from app/: npx vite-node scripts/sense-alcohol-table.ts
import { DEFAULT_PROFILE, type Profile } from '../src/science/profile';
import { FOOD_BY_ID, servingPart } from '../src/v4/food/parse';
import { toMeal } from '../src/v4/food/meal';
import { simulateFood } from '../src/science/foodSim';

const bodies: Record<string, Partial<Profile>> = { small: { sex: 'female', weightKg: 50, heightCm: 160 }, default: {}, big: { sex: 'male', weightKg: 100, heightCm: 185 } };
for (const id of ['beer', 'red-wine', 'rakija']) for (const b of Object.keys(bodies)) for (const fed of [false, true]) {
  const row: string[] = [];
  for (const n of [1, 3, 5, 10, 15]) {
    const p: Profile = { ...DEFAULT_PROFILE, ...bodies[b], withMeal: fed };
    const meal = toMeal([servingPart(FOOD_BY_ID[id], n)]);
    const s = simulateFood(meal, p, 1440);
    let pk = 0, pm = 0; for (let t = 0; t <= 1440; t++) if (s.bac[t] > pk) { pk = s.bac[t]; pm = t; }
    let z = pm; while (z < 1440 && s.bac[z] > 0.005) z++;
    row.push(`${n}×(${meal.alcoholG.toFixed(0)}g) pk ${pk.toFixed(2)} gone ${s.bac[1440] > 0.005 ? `>24h (${s.bac[1440].toFixed(2)} at 24h)` : `${(z / 60).toFixed(1)}h`}`);
  }
  console.log(`${id} ${b} ${fed ? 'fed' : 'fast'}: ${row.join(' | ')}`);
}
