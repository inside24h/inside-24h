import { it } from 'vitest';
import { AUDIT_PROFILE, auditCompare, auditItems, auditPairs, auditSingle, compareNarrIn, singleNarrIn } from './text-audit';
import { FACT_SHORT, factTemplate } from './video-facts';
import { sweep } from './sweep.testutil';
it('probe', () => {
  const tpl = FACT_SHORT.protein.map((w) => factTemplate(w.replace('{n}', '1')));
  const cnt = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
  const s = new Map<string, number>(), c = new Map<string, number>(), seeds: number[] = [];
  for (const it of sweep(auditItems()).slice(0, 60)) { const o = auditSingle(it.x, 'long', 'A', AUDIT_PROFILE, it.vname); const n = singleNarrIn(it.x, o, false); seeds.push(n.seed);
    for (const f of n.facts ?? []) { const k = factTemplate(f); if (tpl.includes(k)) cnt(s, k); } }
  for (const pr of sweep(auditPairs(auditItems(), 120)).slice(0, 80)) { const n = compareNarrIn(pr.a, pr.b, auditCompare(pr.a, pr.b, 'long').cp);
    for (const f of n.facts ?? []) { const k = factTemplate(f.replace(/^[^:]+:\s*/, '')); if (tpl.includes(k) || /^protein, /.test(k)) cnt(c, k); } }
  console.log('SINGLE', JSON.stringify([...s]), '\nCMP', JSON.stringify([...c]), '\nSEEDS', seeds.slice(0, 20).join(','));
}, 600_000);
