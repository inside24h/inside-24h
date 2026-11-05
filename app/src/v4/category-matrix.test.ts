// Round 18 (critique g, root cause of the generalization gap): the CATEGORY MATRIX. Every database item, variant,
// builder preset and sampled builder choice is classified by what it is (alcohol / alcohol-free, caffeine, sugar-led,
// starch-led, fat-led, protein-led, no measured GI, liquid or solid, builder with add-ons, plural name, recipe), and
// each class has story rules its video must keep: the right hero number, the cards that fit, no card / hook / hashtag
// that does not apply, and time math that adds up. A new food in the database lands in its classes automatically.
import { describe, expect, it } from 'vitest';
import { ALCOHOL_FREE_MAX_G100, hasStarch } from './food/foodProduct';
import { distinctName, sharedBaseName } from './food/naming';
import { analyze, isTreat, verdictOf } from './analyze';
import { parseMeal } from './food/parse';
import { AUDIT_PROFILE, auditItems, auditSingle, type AuditItem } from './text-audit';
import { isPluralName } from './video-names';

type Cls = 'alcohol' | 'alcohol-free' | 'caffeine' | 'little caffeine' | 'sugar-led' | 'starch-led' | 'fat-led' | 'protein-led' | 'no measured GI'
  | 'liquid' | 'solid' | 'builder' | 'plural name' | 'recipe';
function classes(it: AuditItem): Cls[] {
  const { x, parts } = it, m = x.macros, k = Math.max(1, x.kcal), f = parts[0]?.food;
  const alc100 = Math.max(0, ...parts.map((q) => q.food.p.alcoholG ?? 0)), alcoholic = (x.built.alcoholG ?? 0) > 1;
  const out: Cls[] = [];
  if (alcoholic) out.push('alcohol');
  if (!alcoholic && /alcohol-free|non-alcoholic/i.test(it.vname) && alc100 < ALCOHOL_FREE_MAX_G100) out.push('alcohol-free');
  if (x.built.caffeine.doseMg >= 20) out.push('caffeine'); else if (x.built.caffeine.doseMg > 0 && x.built.caffeine.doseMg < 10) out.push('little caffeine');
  if (!alcoholic && m.sugars >= 10 && m.sugars >= 0.5 * m.availCarbs) out.push('sugar-led');
  if (!alcoholic && m.availCarbs >= 20 && hasStarch(m)) out.push('starch-led');
  if (9 * m.fat >= 0.5 * k && m.fat >= 10) out.push('fat-led');
  if (4 * m.protein >= 0.3 * k && m.protein >= 15) out.push('protein-led');
  if (parts.some((q) => q.food.gi === null) && m.availCarbs >= 10 && !alcoholic) out.push('no measured GI');
  out.push(/bite/i.test(x.built.story.chapters[0]?.title ?? '') ? 'solid' : 'liquid');
  if (f?.base?.builder && f.on) out.push('builder');
  if (isPluralName(it.vname)) out.push('plural name');
  if (f?.recipe) out.push('recipe');
  return out;
}

describe('round 18: the category matrix (every item, by what it is)', () => {
  const items = auditItems();
  const water = analyze(parseMeal('glass of water'), AUDIT_PROFILE);
  it('every class rule holds for every item in it', () => {
    const bad: string[] = [], seen = new Map<Cls, number>();
    for (const it of items) {
      const cl = classes(it), A = auditSingle(it.x, 'long', 'A', AUDIT_PROFILE, it.vname), B = auditSingle(it.x, 'short', 'B', AUDIT_PROFILE, it.vname);
      for (const c of cl) seen.set(c, (seen.get(c) ?? 0) + 1);
      const cards = A.plan.pages.map((p) => p.text).join(' | '), hooks = `${A.hook.line1} ${A.hook.line2} | ${B.hook.line1} ${B.hook.line2}`;
      const tags: string[] = A.caps.tiktok.match(/#\w+/g) ?? [], all = `${hooks} | ${cards}`;
      const say = (c: string, why: string) => bad.push(`${it.id} [${c}]: ${why}`);
      const { x } = it;
      if (cl.includes('alcohol')) {
        if (!tags.includes('#alcohol')) say('alcohol', `no #alcohol (${tags.join(' ')})`);
        if (!/Don’t drink and drive/.test(A.caps.tiktok)) say('alcohol', 'no safety line');
      } else {
        if (/\balcohol\b|hangover|\bdrive\b/i.test(all.replace(/alcohol-?free/gi, ''))) say(cl.includes('alcohol-free') ? 'alcohol-free' : 'no alcohol', `alcohol words: ${/[^|]*(?:alcohol|hangover|drive)[^|]*/i.exec(all.replace(/alcohol-?free/gi, ''))?.[0]}`);
        if (tags.includes('#alcohol')) say('no alcohol', '#alcohol');
      }
      if (cl.includes('caffeine') && !cl.includes('alcohol') && !/\d+ mg of caffeine/.test(`${cards} ${hooks}`)) say('caffeine', 'its mg never said');
      if (cl.includes('little caffeine')) {
        if (A.hero && /caffeine/.test(A.hero.big)) say('little caffeine', `hero ${A.hero.big}`);
        if (tags.includes('#caffeine') && !/decaf/i.test(it.vname)) say('little caffeine', '#caffeine');
      }
      if (cl.includes('sugar-led') || cl.includes('starch-led') || cl.includes('no measured GI')) {
        if (x.glucose === undefined) say('carbs', 'no blood sugar story');
        if (A.notes.some((n) => /Not tracked/.test(n))) say('carbs', 'sugar "Not tracked"');
      }
      if (cl.includes('sugar-led') && (x.sugarPeak ?? 0) >= 0.5 && x.built.caffeine.doseMg < 100 && A.hero && !/Blood sugar/.test(A.hero.big)) say('sugar-led', `hero ${A.hero.big}`);
      if (cl.includes('sugar-led') && !cl.includes('caffeine') && !tags.includes('#bloodsugar') && 4 * x.macros.availCarbs >= 0.35 * x.kcal) say('sugar-led', `tags ${tags.join(' ')}`);
      if (!hasStarch(x.macros) && /Starch/.test(cards)) say('no starch', 'a starch card');
      if (cl.includes('fat-led') && !cl.includes('sugar-led') && /teaspoons of sugar/.test(A.hook.line1) && !/starch/.test(A.hook.line2) && x.macros.sugars < 10) say('fat-led', `sugar hook ${A.hook.line1}`);
      if (cl.includes('protein-led') && 4 * x.macros.availCarbs < 0.35 * x.kcal && tags.includes('#bloodsugar')) say('protein-led', '#bloodsugar for a protein food');
      if (cl.includes('solid') && /water go|first sip/i.test(all)) say('solid', 'a drink line');
      if (cl.includes('liquid') && /first bite/i.test(all)) say('liquid', 'a food line');
      if (cl.includes('builder') && !/ with | without /.test(A.name) && A.name.replace(/^\S+\s+/, '').toLowerCase() === it.parts[0].food.base!.name.replace(/\s*\(.*\)$/, '').split(' / ')[0].toLowerCase()) say('builder', `bare name ${A.name}`);
      const sb = it.parts.length === 1 ? sharedBaseName(it.parts[0].food.name) : null;
      if (sb && !A.name.toLowerCase().includes(distinctName(it.parts[0].food.name).toLowerCase())) say('shared name', `${A.name} for ${it.parts[0].food.name}`);
      if (/\babout 0 h\b|by (?:9\d|\d{3,}) minutes|after about 0\b/.test(all)) say('time math', /[^|]*(?:0 h|minutes)[^|]*/.exec(all)?.[0] ?? '');
      if (!A.hero) say('end card', 'no number');
      // the verdict against water: a treat never gets the trophy; a plural name takes "win"
      const v = verdictOf(x, water);
      const champ = /^🏆 (.+?) (wins?):/.exec(v);
      if (champ && champ[1] === x.label && isTreat(x)) say('treat', v);
      if (champ && (champ[2] === 'wins') === isPluralName(champ[1])) say('grammar', v);
    }
    // every class is really exercised
    for (const c of ['alcohol', 'alcohol-free', 'caffeine', 'little caffeine', 'sugar-led', 'starch-led', 'fat-led', 'protein-led', 'no measured GI', 'liquid', 'solid', 'builder', 'plural name'] as Cls[])
      if (!(seen.get(c) ?? 0)) bad.push(`class ${c}: no item`);
    expect(bad.slice(0, 40)).toEqual([]);
  }, 600_000);
});
