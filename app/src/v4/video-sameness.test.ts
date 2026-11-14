// Phase 4e (critique 2026-11-14, M5: pizza and lentils opened on the same hook, "How much has left you a day later?",
// and said the same cards in the same order). Every pair of items of the same story class (video-cam classOf), cut by
// cut: they may share the hook's question, or most of their cards, but never both (SAME_CARDS_MAX of the card
// sequence alike, numbers and the food's name taken out). The hook comes from each food's own most telling number
// (video-hook.ts), so two foods of a class part at the first frame.
import { describe, expect, it } from 'vitest';
import { AUDIT_CUTS, AUDIT_PROFILE, auditItems, auditSingle } from './text-audit';
import { classOf } from './video-cam';
import { chapterText } from './stories';
import { AMOUNT_PREFIX } from './video-names';
import { macrosOf } from './video-hook';
import { sweep } from './sweep.testutil';

/** The hook's question or promise: its lines that do not name the food, word for word (its own numbers kept: "Where
 *  are its 16 g of fiber tomorrow?" is lentils' own question). */
export const hookQuestion = (h: { line1: string; line2: string }, name: string) => {
  const nm = name.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase(), bare = nm.replace(AMOUNT_PREFIX, '');
  return [h.line1, h.line2].filter((l) => l && !l.toLowerCase().includes(nm) && !l.toLowerCase().includes(bare));
};
/** Two items whose first moments say the same kcal and macros, each within this share of the other's (red and white wine:
 *  150 ml, 125 and 122 kcal, 3 and 4 g carbohydrate; a gram apart counts as the same): the model makes the same food of them, so their videos may be alike. */
export const SAME_DATA = 0.1;
export const sameData = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) <= Math.max(1, SAME_DATA * Math.max(Math.abs(x), Math.abs(b[i]))));
/** The most two same-class videos may share of their card sequence when they also share the hook's question. */
export const SAME_CARDS_MAX = 0.8;
/** A card as a template: lower case, numbers as #, the food's own words out. */
export const cardTpl = (text: string, name: string) => {
  const own = new Set(name.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2));
  return text.toLowerCase().replace(/\d+(?:[.,–-]\d+)*/g, '#').split(/[^a-z#%]+/).filter((w) => w && !own.has(w)).join(' ');
};
/** How alike two card sequences are, 0..1: their longest common subsequence over the longer one. */
export function cardSimilarity(a: readonly string[], b: readonly string[]): number {
  if (!a.length || !b.length) return 0;
  const d: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = a[i - 1] === b[j - 1] ? d[i - 1][j - 1] + 1 : Math.max(d[i - 1][j], d[i][j - 1]);
  return d[a.length][b.length] / Math.max(a.length, b.length);
}

describe('phase 4e: no two foods of a class make the same video (hook and card order)', () => {
  it('every same-class pair × cut: never the same hook question with >= 80 % of the cards alike', () => {
    const items = sweep(auditItems());
    const bad: string[] = [];
    let pairs = 0, sameHook = 0;
    for (const cut of AUDIT_CUTS) {
      const vids = items.map((it) => {
        const o = auditSingle(it.x, cut, 'A', AUDIT_PROFILE, it.vname);
        return { id: it.id, nums: Object.values(macrosOf(it.x.built.story.chapters[0] ? chapterText(it.x.built.story.chapters[0] as never, 0) : '')), cls: classOf(it.x.built), q: hookQuestion(o.hook, o.name), cards: o.plan.pages.map((p) => cardTpl(p.text, o.name)).filter(Boolean) };
      });
      for (let i = 0; i < vids.length; i++) for (let j = i + 1; j < vids.length; j++) {
        const a = vids[i], b = vids[j];
        if (a.cls !== b.cls) continue;
        // (a builder's own variants, "pizza+…", are the same food with a topping more: not two foods; nor are two
        // items the model makes the same food of, every number of their first moment within SAME_DATA of the other's)
        if (a.id.split(/[.+]/)[0] === b.id.split(/[.+]/)[0] || sameData(a.nums, b.nums)) continue;
        pairs++;
        const q = a.q.find((x) => b.q.includes(x));
        if (!q) continue;
        sameHook++;
        const sim = cardSimilarity(a.cards, b.cards);
        if (sim >= SAME_CARDS_MAX) bad.push(`${a.id} ~ ${b.id} ${cut}: "${q}", ${(100 * sim).toFixed(0)} % of the cards alike`);
      }
    }
    console.log(`[sameness] ${pairs} same-class pairs × cut, ${sameHook} with the same hook question, ${bad.length} also with >= ${100 * SAME_CARDS_MAX} % of the cards alike`, JSON.stringify(bad.slice(0, 200)));
    expect(bad.slice(0, 15)).toEqual([]);
  }, 1_200_000);
  it('the critic case: pizza and lentils part at the hook or at the cards, in every cut', () => {
    const its = auditItems().filter((i) => i.id === 'pizza' || i.id === 'lentils');
    for (const cut of AUDIT_CUTS) {
      const [a, b] = its.map((it) => auditSingle(it.x, cut, 'A', AUDIT_PROFILE, it.vname));
      const shared = hookQuestion(a.hook, a.name).some((x) => hookQuestion(b.hook, b.name).includes(x));
      const sim = cardSimilarity(a.plan.pages.map((p) => cardTpl(p.text, a.name)), b.plan.pages.map((p) => cardTpl(p.text, b.name)));
      console.log(`[sameness] pizza vs lentils ${cut}: hooks "${a.hook.line1} / ${a.hook.line2}" vs "${b.hook.line1} / ${b.hook.line2}", ${(100 * sim).toFixed(0)} % of the cards alike`);
      expect(shared && sim >= SAME_CARDS_MAX, cut).toBe(false);
      expect(shared, `${cut}: the critic case shares no hook question`).toBe(false);
    }
  }, 600_000);
});
