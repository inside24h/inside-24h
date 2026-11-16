import { it } from 'vitest';
import { hookFor } from './video-hook';
import fixtures from './video-plan.fixtures.json';
import type { StopIn } from './video-plan';
const FIX = fixtures as Record<string, StopIn[]>;
it('hk', () => {
  for (const [n, h] of [['pizza', { name: 'A whole pizza', chapters: FIX['pizza-whole'], solid: true, kcal: 2572 }], ['meal', { name: 'Hamburger + French fries + Cola', chapters: FIX['meal-burger-fries-cola'], solid: true, kcal: 833, caffeine: true }], ['kebab', { name: '1 kebab', chapters: FIX.kebab, solid: true, kcal: 762 }]] as const) {
    const k = hookFor(h as never); console.log('HK', n, JSON.stringify(k), '|', (h.chapters[0] as { text: string }).text);
  }
});
