import { it } from 'vitest';
import { AUDIT_PROFILE, auditItems, auditSingle } from './text-audit';
import { seenOf } from './video-cam';
import type { Cut } from './video-plan';
import { filmSingle } from './video-camera.test';
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process!.env;
it('detail', () => {
  const want = (env.P4E ?? 'pizza:long').split(',').map((x) => x.split(':'));
  const items = auditItems().filter((i) => want.some(([id]) => id === i.id));
  for (const [id, cut] of want) {
    const it = items.find((i) => i.id === id)!;
    const o = auditSingle(it.x, cut as Cut, 'A', AUDIT_PROFILE, it.vname), plan = o.plan, ch = it.x.built.story.chapters;
    console.log(`\n=== ${id} ${cut} ${plan.seconds.toFixed(1)} s`);
    const cm = new Map(filmSingle(it, cut as Cut).regions!.map((r) => [r.t.toFixed(3), r.r]));
    let last = '', t0 = 0;
    for (const fr of plan.frames) {
      const key = `${fr.phase}/${fr.beat} ${fr.stop} [${seenOf(fr, ch).join(',')}] cam=${cm.get(fr.t.toFixed(3)) ?? '-'} ${fr.title ?? ''} | ${fr.beat === 'glide' ? 'NEXT ' + (fr.next?.title ?? '') : fr.cap ?? ''}`;
      if (key !== last) { if (last) console.log(`${t0.toFixed(1)}-${fr.t.toFixed(1)} ${last}`); last = key; t0 = fr.t; }
    }
  }
}, 600_000);
