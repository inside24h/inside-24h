import { it } from 'vitest';
import { AUDIT_PROFILE, auditItems, auditSingle } from './text-audit';
import type { Cut } from './video-plan';
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process!.env;
it('cards', () => {
  const want = (env.P4E ?? 'diet-cola:long,espresso.americano:long').split(',').map((x) => x.split(':'));
  const items = auditItems();
  for (const [id, cut] of want) { const it = items.find((i) => i.id === id)!; const o = auditSingle(it.x, cut as Cut, 'A', AUDIT_PROFILE, it.vname); console.log(`=== ${id} ${cut}: ${o.hook.line1} / ${o.hook.line2}\n  ` + o.plan.pages.map((p) => `${p.stop}:${p.text}`).join('\n  ')); }
}, 600_000);
