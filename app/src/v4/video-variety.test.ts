// v21b (coordinator review 2026-11-06): the voice never sounds like a loop. No content word a third time within 15 s
// (the food's own name aside); every hook names the food first; a line said another way still reads its card.
import { describe, expect, it } from 'vitest';
import { AUDIT_CUTS, AUDIT_PROFILE, auditCompare, auditItems, auditPairs, auditSingle, compareNarrIn, singleNarrIn } from './text-audit';
import { BEAT, CMP_BEAT, bothNamesEarly, IMPACT_POST_S, IMPACT_PRE_S, shownText, speakS, namesFirst, narrationFor, overused, stemList, variants, type NarrIn } from './video-narration';
import { factTemplate } from './video-facts';
import { FAST_TIER, sweep } from './sweep.testutil';

/** v21c: the fillers said, by template, and the videos each one is on */
const fillers = new Map<string, Set<string>>(), silent: string[] = [], early: string[] = [], sides: string[] = [];
let videos = 0, compares = 0;

const check = (nin: NarrIn, where: string, bad: string[], hooks: string[]) => {
  const lines = narrationFor(nin), names = (nin.kind === 'compare' ? nin.names ?? [] : [nin.name ?? '']).filter(Boolean);
  videos++;
  for (const l of lines) if ((nin.facts ?? []).some((f) => [f, ...variants(f)].map(shownText).includes(l.text)) || (BEAT as readonly string[]).includes(l.text) || (CMP_BEAT as readonly string[]).includes(l.text)) {
    const k = factTemplate(l.text, names); if (!fillers.has(k)) fillers.set(k, new Set()); fillers.get(k)!.add(where.replace(/ (long|medium|short)$/, ''));
  }
  // v21c: a comparison is never silent over 3 s at the voice's planned pace (the hush before an impact aside)
  if (nin.kind === 'compare') {
    const imp = nin.plan.cues.filter((c) => c.kind === 'peak' || c.kind === 'verdict').map((c) => c.t), outro = nin.plan.cues.find((c) => c.kind === 'outro')?.t ?? nin.plan.seconds;
    for (let i = 0; i + 1 < lines.length; i++) {
      const e = lines[i].t + speakS(lines[i].text), nx = Math.min(lines[i + 1].t, outro);
      if (nx - e > 3 && !imp.some((p) => e < p + IMPACT_POST_S + 0.6 && nx > p - IMPACT_PRE_S)) { silent.push(`${(nx - e).toFixed(1)} ${where}: after "${lines[i].text}"`); break; }
    }
  }
  if (nin.kind === 'compare' && names.length === 2) {
    compares++;
    const hk = lines.find((l) => l.id === 'hook');
    if (!hk || !bothNamesEarly(hk, names)) early.push(`${where}: names not in the first 4 s: ${hk?.text}`);
    // (a data fact for each side: its own line, a "Left:"/"Right:" one, or a contrast naming both)
    const facts = [...(nin.facts ?? []), ...(nin.lateFacts ?? [])].flatMap((f) => [f, ...variants(f)]).map(shownText);
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    names.forEach((nm, k) => {
      const side = new RegExp(`(^${k ? 'Right' : 'Left'}:)|\\b${esc(nm)}\\b`, 'i');
      // (a fact line, or a card of that side with a number: "Cranberry juice drink, 32 g: about 8 teaspoons.")
      if (!lines.some((l) => l.id !== 'hook' && (facts.includes(l.text) || /\d/.test(l.text)) && side.test(l.text))) sides.push(`${where}: no fact for ${nm}: ${lines.map((l) => l.text).join(' / ')}`);
    });
  }
  // v21c: the hook card's question is always said
  const q = [nin.hook?.line1 ?? '', nin.hook?.line2 ?? ''].map((x) => x.replace(/^Guess:\s*/i, '').trim()).find((x) => /\?$/.test(x));
  const hq = lines.find((l) => l.id === 'hook');
  if (q && !(hq && hq.text.toLowerCase().includes(q.toLowerCase().replace(/\?$/, '')))) hooks.push(`${where}: question not said: ${q} | ${hq?.text}`);
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
    for (const it of sweep(auditItems())) for (const cut of AUDIT_CUTS) {
      const o = auditSingle(it.x, cut, 'A', AUDIT_PROFILE, it.vname);
      check(singleNarrIn(it.x, o, /bite/i.test(it.x.built.story.chapters[0]?.title ?? '')), `${it.id} ${cut}`, bad, hooks);
    }
    for (const pr of sweep(auditPairs(auditItems(), 120))) for (const cut of AUDIT_CUTS) check(compareNarrIn(pr.a, pr.b, auditCompare(pr.a, pr.b, cut).cp), `${pr.id} ${cut}`, bad, hooks);
    console.log(`[variety] ${bad.length} videos with a word said 3× in 15 s; ${hooks.length} hooks not naming the food first`);
    expect(bad.slice(0, 20)).toEqual([]);
    expect(hooks.slice(0, 20)).toEqual([]);
    // (v22: no comparison over 3 s at the planned pace, the hush before an impact aside)
    console.log(`[silence] comparisons over 3 s: ${silent.length}`, JSON.stringify(silent.slice(0, 5)));
    expect(silent).toEqual([]);
    // v22: a comparison names both foods within its first ~4 s, and has a fact (a number) for each side after the hook
    console.log(`[early] ${early.length} / [sides] ${sides.length} comparison videos`, JSON.stringify(sides.slice(0, 40).map((x) => x.slice(0, 260))));
    expect(early.slice(0, 20)).toEqual([]);
    // (v22: a fact for each side in at least 85 % of the comparison videos; the rest are mostly Shorts of a guess
    // game, where every fact of one side would give the answer away before the reveal and the close is too short)
    // (the two shares below are statistics of the whole database: the full tier only, a sample is too small for them)
    if (!FAST_TIER) expect(sides.length).toBeLessThanOrEqual(Math.ceil(0.15 * compares));
    // v21c: fillers are this food's facts; no filler wording on more than 10 % of the videos
    const nItems = new Set([...fillers.values()].flatMap((x) => [...x])).size;
    const top = [...fillers].map(([k, v]) => [k, v.size / Math.max(1, videos / 3)] as const).sort((a, b) => b[1] - a[1]);
    console.log(`[fillers] ${fillers.size} templates on ${nItems} videos; top`, JSON.stringify(top.slice(0, 5)));
    if (!FAST_TIER) expect(top.filter(([, f]) => f > 0.1).map(([k, f]) => `${k} ${(100 * f).toFixed(0)} %`)).toEqual([]);
  }, 600_000);
});
