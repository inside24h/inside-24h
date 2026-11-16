import { it } from 'vitest';
import { auditItems } from './text-audit';
it('peak', () => {
  for (const it of auditItems().filter((i) => ['pizza', 'lentils', 'bread-white', 'rice', 'pasta', 'potato'].includes(i.id))) {
    const g = it.x.built.effects.glucoseMgDl!; let am = 0; for (let m = 0; m < 1440; m++) if (g[m] > g[am]) am = m;
    const sugar = it.x.built.story.chapters.find((c) => /Sugar rises|Blood sugar peak/.test(c.title));
    console.log(`PEAK ${it.id}: glucose argmax ${am} min (+${(g[am] / 18.016).toFixed(2)} mmol/L), chapter ${sugar?.min}; first: ${it.x.built.story.chapters[0].text ?? ''}`);
  }
}, 600_000);
