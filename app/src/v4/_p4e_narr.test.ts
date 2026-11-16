import { it } from 'vitest';
import { AUDIT_PROFILE, auditItems, auditSingle, singleNarrIn } from './text-audit';
import { narrationFor, placeClips } from './video-narration';
import { spoken } from './video-retention.test';
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process!.env;
it('narr', () => {
  const ids = (env.P4E ?? 'honey').split(',');
  for (const it of auditItems().filter((i) => ids.includes(i.id))) {
    const o = auditSingle(it.x, 'long', 'A', AUDIT_PROFILE, it.vname), nin = singleNarrIn(it.x, o, /bite/i.test(it.x.built.story.chapters[0]?.title ?? ''));
    const lines = narrationFor(nin), placed = placeClips(lines, lines.map((l) => spoken(l.say, l.slotS)), o.plan.seconds);
    console.log(`=== ${it.id}`); for (const c of placed) console.log(`  ${c.t.toFixed(1)}+${c.dur.toFixed(1)} [${c.line.id}] ${c.line.text}`);
    console.log('pages', o.plan.pages.map((p) => `${p.stop}:${p.text}`).join(' | '));
  }
}, 600_000);
