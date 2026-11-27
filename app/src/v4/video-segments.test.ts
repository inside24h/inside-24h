// Phase P2 (roadmap 2026-11-24, "Video spine v5 + live curve"): the spine of every video, item × variant × cut (the
// fast tier sweeps every 24th item, the full tier all of them; video-telemetry.test.ts holds every filmed timeline to
// checkTimeline5's thresholds).
//   - every number a card of the spine says resolves to the item's story (or is a live model value, a rule on its own
//     numbers, or a moment of its model's story);
//   - the question: on every video, in its hook; the 3-option guess's answer is the truth, the options at least 15 %
//     apart (no near-tie), the reveal claims it;
//   - one action in every video, in every cut; the end frame has the 5 axes (a word each, no overall number), the cheat
//     sheet and a sources line that works without the site's address;
//   - every word the spine adds passes the compliance lexicon (no "burn it off", no minutes of walking for kcal, never
//     "safe to drive"); a video about alcohol keeps the never-drive line;
//   - two foods of a class do not share more than half of their segment texts (of all the texts either of them shows).
import { describe, expect, it } from 'vitest';
import { AUDIT_CUTS, AUDIT_PROFILE, auditItems, auditSingle } from './text-audit';
import { complianceHits } from './story/compliance';
import { storyOf } from './story/foodStory';
import { AXIS_KEYS } from './story/types';
import { classOf } from './video-cam';
import { guessOf, sourcesLine, SEG_TIME, type SpineIn } from './video-segments';
import { numbersShown } from './video-telemetry';
import { sweep } from './sweep.testutil';

const ITEMS = sweep(auditItems(AUDIT_PROFILE));
const OWN = /^(?:live|act|rule|ch):/;
/** A text as a template: lower case, numbers as #, the food's own words out (as video-sameness.test cardTpl). */
const cardTpl = (text: string, name: string) => { const own = new Set(name.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2)); return text.toLowerCase().replace(/\d+(?:[.,–-]\d+)*/g, '#').split(/[^a-z#%]+/).filter((w) => w && !own.has(w)).join(' '); };
const nums = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => x.replace(',', '.'));

describe('phase P2: the v5 spine of every video', () => {
  it('every item × cut: its numbers resolve, a question, a fair guess, one action, the end frame', () => {
    const bad: string[] = [];
    let n = 0, guesses = 0;
    for (const it of ITEMS) for (const cut of AUDIT_CUTS) {
      n++;
      const o = auditSingle(it.x, cut, 'A', AUDIT_PROFILE, it.vname), sp = o.plan.spine, id = `${it.id} ${cut}`;
      if (!sp) { bad.push(`${id}: no spine`); continue; }
      const story = storyOf(it.x, it.parts, AUDIT_PROFILE);
      // the numbers of every spine card
      for (const [line, li] of Object.entries(sp.lines)) for (const k of li.keys) if (!OWN.test(k) && !story.numbers[k] && k !== sp.guess?.key) bad.push(`${id}: "${line}" says ${k}, not a story number`);
      // the question, in the hook, on screen from the first frame (the headline)
      if (![o.hook.line1, o.hook.line2].some((l) => /\?\s*$/.test(l.trim()))) bad.push(`${id}: no question in the hook "${o.hook.line1} / ${o.hook.line2}"`);
      // the guess: its answer is the truth (the reveal's claim says the answer's number), never a near-tie
      const g = sp.guess;
      if (g) {
        guesses++;
        const v = g.options.map((x) => Number(nums(x)[0]));
        if (!(v[0] > 0 && v[1] >= 1.15 * v[0] && v[2] >= 1.15 * v[1])) bad.push(`${id}: options ${g.options.join(' / ')} are not 15 % apart`);
        if (!nums(g.claim).includes(nums(g.options[g.answer])[0])) bad.push(`${id}: the reveal "${g.claim}" does not say the answer ${g.options[g.answer]}`);
        if (!(sp.revealT >= sp.endT - SEG_TIME.reveal.maxS - 0.5 && sp.revealT < sp.endT)) bad.push(`${id}: reveal at ${sp.revealT.toFixed(1)} s, end frame at ${sp.endT.toFixed(1)} s`);
      }
      // one action, shown in this cut
      const actions = Object.entries(sp.lines).filter(([, li]) => li.kind === 'action').map(([l]) => l);
      if (!actions.length || !o.plan.pages.some((p) => actions.includes(p.text))) bad.push(`${id}: no action on screen (${actions.join(' / ') || 'none'})`);
      // the end frame: 5 axes with a word each, the cheat sheet, the sources line
      if (sp.end.axes.length !== AXIS_KEYS.length || sp.end.axes.some((a) => !a.word.trim() || !a.label)) bad.push(`${id}: axes ${JSON.stringify(sp.end.axes)}`);
      if (!sp.end.cheat.length) bad.push(`${id}: no cheat sheet`);
      if (!/^Sources: Inside 24h · ./.test(sp.end.sources)) bad.push(`${id}: sources "${sp.end.sources}"`);
      // the compliance lexicon over every word the spine adds
      for (const s of [o.hook.line1, o.hook.line2, ...Object.keys(sp.lines), ...(g ? [g.claim, ...g.options] : []), ...sp.end.cheat.map((c) => c.text), ...sp.chips.map((c) => `${c.title}: ${c.text}`), ...sp.pins.map((p) => p.label)]) {
        for (const h of complianceHits(s)) bad.push(`${id}: "${s}" breaks ${h.id}`);
        if (/\bwalk(?:ing)?\b.*\bkcal\b|\bkcal\b.*\bwalk/i.test(s)) bad.push(`${id}: "${s}" frames kcal as walking`);
      }
    }
    console.log(`[spine] ${n} videos, ${guesses} with a 3-option guess, ${bad.length} problems`, JSON.stringify(bad.slice(0, 6)));
    expect(guesses / n).toBeGreaterThanOrEqual(0.9);
    expect(bad.slice(0, 20)).toEqual([]);
  }, 900_000);

  it('the guess never asks what the headline says, and a hook that asks keeps one question', () => {
    const bad: string[] = [];
    for (const it of ITEMS) {
      const o = auditSingle(it.x, 'short', 'A', AUDIT_PROFILE, it.vname), sp = o.plan.spine!;
      if ([o.hook.line1, o.hook.line2].filter((l) => /\?\s*$/.test(l.trim())).length > 1) bad.push(`${it.id}: two questions "${o.hook.line1} / ${o.hook.line2}"`);
      const stmt = [o.hook.line1, o.hook.line2].find((l) => !/\?\s*$/.test(l.trim())) ?? '';
      if (sp.guess && numbersShown(stmt, sp.nums).includes(sp.guess.key)) bad.push(`${it.id}: the headline "${stmt}" says the guess's number`);
      // (and the guessed number is said by no card before the reveal)
      const before = o.plan.pages.filter((p) => { const f = o.plan.frames.find((x) => x.cap === p.text); return f && f.t < sp.revealT; });
      for (const p of before) if (sp.guess && sp.lines[p.text]?.keys.includes(sp.guess.key)) bad.push(`${it.id}: "${p.text}" says the answer before the reveal`);
    }
    expect(bad.slice(0, 20)).toEqual([]);
  }, 900_000);

  it('the sources line works without the site\'s address, and names the food page once it has one', () => {
    expect(sourcesLine('Cola', 'cola', '')).toBe('Sources: Inside 24h · Cola');
    expect(sourcesLine('Cola', 'cola', 'https://inside24h.example')).toBe('Sources: Inside 24h · Cola · inside24h.example/food/cola');
  });

  it('a hook whose question no number answers, and names the food, asks it alone (no second question)', () => {
    const it0 = auditItems(AUDIT_PROFILE).find((i) => i.id === 'espresso')!;
    const st = storyOf(it0.x, it0.parts, AUDIT_PROFILE);
    const base: SpineIn = { story: st, hook: { line1: 'One espresso: is it still in you?', line2: 'At bedtime, almost all of it.' }, name: 'One espresso', cut: 'short', endLines: [], built: it0.x.built as SpineIn['built'], chapters: it0.x.built.story.chapters, alcohol: false, caffeineMg: 63, bed: '23:00' };
    const g = guessOf(base);
    expect([g.hook.line1, g.hook.line2].filter((l) => /\?\s*$/.test(l)).length).toBe(1);
  });

  it('two foods of a class share at most half of their spine\'s own texts (question, number, for you, action)', () => {
    const vids = ITEMS.map((it) => {
      const o = auditSingle(it.x, 'long', 'A', AUDIT_PROFILE, it.vname), sp = o.plan.spine!;
      // (every segment text the spine writes and the video shows: its numbered cards, the number, for you, the action; and
      // its question. The model's own story cards are video-sameness.test's)
      const q = [o.hook.line1, o.hook.line2].filter((l) => /\?\s*$/.test(l.trim())).map((l) => cardTpl(l, o.name));
      return { id: it.id, cls: classOf(it.x.built), q, texts: [...new Set([...q, ...o.plan.pages.map((p) => p.text).filter((l) => !!sp.lines[l]?.own).map((l) => cardTpl(l, o.name))])] };
    });
    const bad: string[] = [];
    let pairs = 0;
    for (let i = 0; i < vids.length; i++) for (let j = i + 1; j < vids.length; j++) {
      const a = vids[i], b = vids[j];
      if (a.cls !== b.cls || a.id.split(/[.+]/)[0] === b.id.split(/[.+]/)[0] || a.texts.length < 2) continue;
      pairs++;
      // (shared over all the two show: the texts both say, of all the texts either says)
      // (as video-sameness.test: two videos are alike when they ask the same question and show the same: here, more than
      // half of all the segment texts either shows, the question among them)
      const both = a.texts.filter((x) => b.texts.includes(x)).length, shared = both / new Set([...a.texts, ...b.texts]).size;
      if (a.q.some((x) => b.q.includes(x)) && shared > 0.5) bad.push(`${a.id} ~ ${b.id}: ${Math.round(100 * shared)} % (${a.texts.filter((x) => b.texts.includes(x)).join(' / ')})`);
    }
    console.log(`[spine sameness] ${pairs} same-class pairs, ${bad.length} over half alike`, JSON.stringify(bad.slice(0, 8)));
    expect(bad.slice(0, 20)).toEqual([]);
  }, 900_000);
});
