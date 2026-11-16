import { it } from 'vitest';
import { auditItems } from './text-audit';
import { filmSingle, shotSimilarity } from './video-camera.test';
it('sim', () => {
  const its = auditItems().filter((i) => ['ham', 'bacon'].includes(i.id));
  const fs = its.map((i) => filmSingle(i, 'long'));
  console.log('SIM', shotSimilarity(fs[0].regions!, fs[1].regions!), JSON.stringify(fs.map((f) => f.cam.style)));
  for (const f of fs) { let l = '', o: string[] = []; for (const r of f.regions!) { if (r.r !== l) { o.push(`${r.t.toFixed(0)}:${r.r}`); l = r.r; } } console.log('REG', f.id, o.join(' ')); }
}, 600_000);
