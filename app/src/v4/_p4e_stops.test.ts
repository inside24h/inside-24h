import { it } from 'vitest';
import { AUDIT_PROFILE, auditItems, auditSingle } from './text-audit';
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process!.env;
it('stops', () => {
  const ids = (env.P4E ?? 'chocolate-dark').split(',');
  for (const it of auditItems().filter((i) => ids.includes(i.id))) {
    const o = auditSingle(it.x, 'short', 'A', AUDIT_PROFILE, it.vname);
    console.log(`=== ${it.id} hook=${JSON.stringify(o.hook)} payoff=${o.payoff} hero=${JSON.stringify(o.hero)}`);
    for (const s of o.stops) console.log(`  stop ${s.min} ${s.title} keep=${!!s.keep} must=${s.must ?? 0}: ${JSON.stringify(s.lines)}`);
  }
}, 600_000);
