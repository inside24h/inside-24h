import { it } from 'vitest';
import { AUDIT_CUTS, AUDIT_PROFILE, auditCompare, auditItems, auditPairs, auditSingle, compareNarrIn, singleNarrIn } from './text-audit';
import { BEAT, CMP_BEAT, shownText, narrationFor, variants, type NarrIn } from './video-narration';
import { factTemplate } from './video-facts';
import { sweep } from './sweep.testutil';
it('probe', () => {
  const hits: string[] = []; const all = new Map<string, Set<string>>(); let videos = 0;
  const check = (nin: NarrIn, where: string) => {
    const lines = narrationFor(nin), names = (nin.kind === 'compare' ? nin.names ?? [] : [nin.name ?? '']).filter(Boolean); videos++;
    for (const l of lines) if ((nin.facts ?? []).some((f) => [f, ...variants(f)].map(shownText).includes(l.text)) || (BEAT as readonly string[]).includes(l.text) || (CMP_BEAT as readonly string[]).includes(l.text)) {
      const k = factTemplate(l.text, names); const w = where.replace(/ (long|medium|short)$/, '');
      if (!all.has(k)) all.set(k, new Set()); all.get(k)!.add(w);
      if (k === 'protein, # g.') hits.push(`${where} | ${l.text} | facts: ${(nin.facts ?? []).filter((f) => /protein/i.test(f)).join(' ~ ')}`);
    }
  };
  for (const it of sweep(auditItems())) for (const cut of AUDIT_CUTS) { const o = auditSingle(it.x, cut, 'A', AUDIT_PROFILE, it.vname); check(singleNarrIn(it.x, o, /bite/i.test(it.x.built.story.chapters[0]?.title ?? '')), `${it.id} ${cut}`); }
  for (const pr of sweep(auditPairs(auditItems(), 120))) for (const cut of AUDIT_CUTS) check(compareNarrIn(pr.a, pr.b, auditCompare(pr.a, pr.b, cut).cp), `${pr.id} ${cut}`);
  const prot = [...all].filter(([k]) => /protein/.test(k)).map(([k, v]) => `${k}=${v.size}`);
  console.log('VIDEOS', videos, 'PROT', JSON.stringify(prot));
  console.log('HITS', hits.length, '\n' + hits.join('\n'));
}, 600_000);
