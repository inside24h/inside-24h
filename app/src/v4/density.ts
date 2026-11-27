// Phase P2 (roadmap 2026-11-24, "Cross-phase measurement"): the density report, so the audit's table (current-format
// audit 2026-11-22, A1.8) is made by code, not by scratchpad scripts. Every item × cut (or every k-th, as the fast test
// tier) and a seeded set of comparisons are filmed headless through the exporter's own drawing functions
// (telemetry.testutil.ts) and measured by video-telemetry density5 / checkTimeline5: facts per 10 s, the share of the
// story with an item-specific number on screen, the generic card time, when the question is fully on screen, the
// actions. No renders. scripts/density-report.mjs bundles this file and writes research/improvements/density-<date>.txt.
// Not part of the app bundle (nothing in the app imports it).
import { AUDIT_CUTS, AUDIT_PROFILE, auditItems, auditPairs } from './text-audit';
import { filmCompareTimeline, filmSingleTimeline } from './telemetry.testutil';
import { checkTimeline5, density5, SPINE, type Density5 } from './video-telemetry';

export interface DensityRow { id: string; kind: 'single' | 'compare'; cut: string; d: Density5; issues: string[] }

/** The rows: every `every`-th item × cut, and every `every`-th of `pairs` seeded comparisons × cut. */
export function densityRows(opts: { every?: number; pairs?: number; only?: string[]; cuts?: string[] } = {}): DensityRow[] {
  const every = Math.max(1, opts.every ?? 24), cuts = AUDIT_CUTS.filter((c) => !opts.cuts?.length || opts.cuts.includes(c));
  const rows: DensityRow[] = [];
  const items = auditItems(AUDIT_PROFILE);
  const pick = <T,>(xs: T[], id: (x: T) => string) => (opts.only?.length ? xs.filter((x) => opts.only!.some((o) => id(x) === o || id(x).startsWith(`${o}.`) || id(x).startsWith(`${o}+`))) : xs.filter((_x, i) => i % every === 0));
  for (const it of pick(items, (x) => x.id)) for (const cut of cuts) {
    const tl = filmSingleTimeline(it, cut);
    rows.push({ id: it.id, kind: 'single', cut, d: density5(tl), issues: checkTimeline5(tl).map((i) => i.check) });
  }
  if ((opts.pairs ?? 0) > 0) {
    const pairs = auditPairs(items, opts.pairs);
    for (const pr of pick(pairs, (x) => x.id)) for (const cut of cuts) {
      const tl = filmCompareTimeline(pr.a, pr.b, cut);
      rows.push({ id: pr.id, kind: 'compare', cut, d: density5(tl), issues: checkTimeline5(tl).map((i) => i.check) });
    }
  }
  return rows;
}

const med = (xs: number[]) => { const s = xs.filter(Number.isFinite).sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN; };
const f2 = (x: number) => (Number.isFinite(x) ? x.toFixed(2) : '—');
const pc = (x: number) => (Number.isFinite(x) ? `${Math.round(100 * x)}%` : '—');
const pad = (s: string, n: number) => (s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length));

/** The report as text: a summary per kind × cut, then one line per video. */
export function densityText(rows: DensityRow[], title: string): string {
  const out: string[] = [title, ''];
  out.push(`Thresholds (video-telemetry SPINE): facts/10 s >= ${SPINE.FACTS_PER_10S} (median >= ${SPINE.FACTS_MEDIAN}), item-specific number on screen >= ${pc(SPINE.ITEM_SHARE)} of the story, generic card time <= ${pc(SPINE.GENERIC_MAX)}, question by ${SPINE.QUESTION_BY_S} s, >= ${SPINE.ACTIONS_MIN} action, each number in <= ${SPINE.PER_NUMBER_MAX} visuals, something new every <= ${SPINE.EVENT_GAP_S} s.`);
  out.push('');
  out.push('SUMMARY  kind    cut     n    facts/10s med (min)   item-share med (min)   generic med (max)   question<=1s   action>=1   all v5 checks pass');
  for (const kind of ['single', 'compare'] as const) for (const cut of AUDIT_CUTS) {
    const rs = rows.filter((r) => r.kind === kind && r.cut === cut);
    if (!rs.length) continue;
    const fp = rs.map((r) => r.d.factsPer10), is = rs.map((r) => r.d.itemShare), gs = rs.map((r) => r.d.genericShare);
    const q = rs.filter((r) => r.d.questionT <= SPINE.QUESTION_BY_S + 1e-6).length, a = rs.filter((r) => r.d.actions >= SPINE.ACTIONS_MIN).length, ok = rs.filter((r) => !r.issues.length).length;
    out.push(`SUMMARY  ${pad(kind, 7)} ${pad(cut, 7)} ${pad(String(rs.length), 4)} ${pad(`${f2(med(fp))} (${f2(Math.min(...fp))})`, 21)} ${pad(`${pc(med(is))} (${pc(Math.min(...is))})`, 22)} ${pad(`${pc(med(gs))} (${pc(Math.max(...gs))})`, 19)} ${pad(`${q}/${rs.length}`, 14)} ${pad(`${a}/${rs.length}`, 11)} ${ok}/${rs.length}`);
  }
  const all = rows.map((r) => r.d.factsPer10);
  out.push('', `All videos: ${rows.length}; facts/10 s median ${f2(med(all))}, min ${f2(Math.min(...all))}; failing v5 checks (count): ${Object.entries(rows.flatMap((r) => r.issues).reduce<Record<string, number>>((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {})).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`);
  out.push('', 'VIDEO  kind    cut     s      facts/10s  numbers  visuals  item-share  generic  question-s  actions  reveal-s  end-s  failing checks  id');
  for (const r of rows) {
    const d = r.d;
    out.push(`VIDEO  ${pad(r.kind, 7)} ${pad(r.cut, 7)} ${pad(d.seconds.toFixed(1), 6)} ${pad(f2(d.factsPer10), 10)} ${pad(String(d.keys.length), 8)} ${pad(String(d.visuals), 8)} ${pad(pc(d.itemShare), 11)} ${pad(pc(d.genericShare), 8)} ${pad(Number.isFinite(d.questionT) ? d.questionT.toFixed(1) : '—', 11)} ${pad(String(d.actions), 8)} ${pad(Number.isFinite(d.revealT) ? d.revealT.toFixed(1) : '—', 9)} ${pad(d.endS.toFixed(1), 6)} ${pad(r.issues.length ? [...new Set(r.issues)].join(',') : '-', 15)} ${r.id}`);
  }
  return out.join('\n');
}
