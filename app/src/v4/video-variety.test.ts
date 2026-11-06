// v21b (coordinator review 2026-11-06): the voice never sounds like a loop. No content word a third time within 15 s
// (the food's own name aside); every hook names the food first; a line said another way still reads its card.
import { describe, expect, it } from 'vitest';
import { AUDIT_CUTS, AUDIT_PROFILE, auditCompare, auditItems, auditPairs, auditSingle, compareNarrIn, singleNarrIn } from './text-audit';
import { namesFirst, narrationFor, overused, stemList, variants, type NarrIn } from './video-narration';

const check = (nin: NarrIn, where: string, bad: string[], hooks: string[]) => {
  const lines = narrationFor(nin), names = (nin.kind === 'compare' ? nin.names ?? [] : [nin.name ?? '']).filter(Boolean);
  const nw = new Set(names.flatMap((x) => stemList(x)));
  for (let k = 0; k < lines.length; k++) { const o = overused(lines, k, nw); if (o.length) { bad.push(`${where} @${lines[k].t.toFixed(0)}: ${o.join(',')} | ${lines.filter((l) => l.t > lines[k].t - 15 && l.t <= lines[k].t).map((l) => l.text).join(' / ')}`); break; } }
  const h = lines.find((l) => l.id === 'hook');
  if (!h) hooks.push(`${where}: no hook line`); else if (names.length && !namesFirst(h.text, names)) hooks.push(`${where}: ${h.text} (${names.join(' / ')})`);
};

describe('v21b narration variety and hooks', () => {
  it('a line said another way keeps its numbers and its sense', () => {
    expect(variants('Insulin brings your blood sugar back down.')).toContain('Insulin brings it back down.');
    expect(variants('Almost all the caffeine is still in you.')).toContain('Almost all of it is still in you.');
    expect(variants('In your stomach: half has moved on after 106 minutes.')).toContain('Half has moved on after 106 minutes.');
    expect(variants('At 07:00, the alcohol should be gone.')).toContain('At 07:00, it should be cleared.');
    expect(variants('The slowest part? The fat.').some((v) => /\? It\.$/.test(v))).toBe(false);
    expect(namesFirst('Ham sub: what is left of it a day later?', ['Ham sub'])).toBe(true);
    expect(namesFirst('What is left of it a day later? 1 ham sub.', ['Ham sub'])).toBe(false);
  });
  it('every item, every cut, and the audit comparisons: no word a third time in 15 s, the food named first', () => {
    const bad: string[] = [], hooks: string[] = [];
    for (const it of auditItems()) for (const cut of AUDIT_CUTS) {
      const o = auditSingle(it.x, cut, 'A', AUDIT_PROFILE, it.vname);
      check(singleNarrIn(it.x, o, /bite/i.test(it.x.built.story.chapters[0]?.title ?? '')), `${it.id} ${cut}`, bad, hooks);
    }
    for (const pr of auditPairs(auditItems(), 120)) for (const cut of AUDIT_CUTS) check(compareNarrIn(pr.a, pr.b, auditCompare(pr.a, pr.b, cut).cp), `${pr.id} ${cut}`, bad, hooks);
    console.log(`[variety] ${bad.length} videos with a word said 3× in 15 s; ${hooks.length} hooks not naming the food first`);
    expect(bad.slice(0, 20)).toEqual([]);
    expect(hooks.slice(0, 20)).toEqual([]);
  }, 600_000);
});
