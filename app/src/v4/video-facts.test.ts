// v22 (2026-11-06, owner: "rich, data-driven fact pools, never invented"): every number a filler fact says is the
// model's own number, recomputed here independently from the model runs (alcohol clock, blood sugar, blood fat,
// caffeine curves, the macros, the profile), or one of the few fixed references the line names (US 0.08 and
// Europe's 0.05 driving limits, per 100 g). Alcohol facts are never framed as good.
import { describe, expect, it } from 'vitest';
import { auditItems } from './text-audit';
import { compareContrasts, factInOf, factLines } from './video-facts';
import { numbersOf } from './video-narration';
import { alcoholClock } from '../science/alcoholClock';

const r = (x: number) => Math.round(x), half = (min: number) => Math.round(min / 30) / 2;
const at = (min: number) => (min < 120 ? Math.max(5, Math.round(min / 5) * 5) : half(min));
const top = (xs: ArrayLike<number>, n = xs.length) => { let k = 0; for (let i = 1; i < Math.min(n, xs.length); i++) if (xs[i] > xs[k]) k = i; return k; };

describe('v22 fact pools', () => {
  const items = auditItems();
  it('every number in every fact line is the model number (recomputed independently)', () => {
    const bad: string[] = [];
    let alcoholLines = 0;
    for (const it of items) {
      const x = it.x, f = factInOf(x), m = x.macros, kcal = x.kcal;
      const ok = new Set<string>(['100', '0.08', '0.05']);
      const add = (v: number | undefined) => { if (v !== undefined && Number.isFinite(v)) ok.add(String(Math.round(v * 10) / 10).replace(/\.0$/, '')); };
      [kcal, m.sugars, m.protein, m.fat, m.fiber, m.availCarbs, m.satFat, m.sodiumMg, m.grams, x.built.alcoholG, x.built.caffeine.doseMg, f.waterMl, f.t50].forEach((v) => add(v === undefined ? v : r(v)));
      add(Math.max(1, r(m.sugars / 4.2)));
      // derived, from the model curves
      const aG = x.built.alcoholG ?? 0;
      if (aG >= 1) {
        add(Math.round((aG / 14) * 2) / 2); add(r((700 * aG) / kcal));
        if (x.built.bac) { const c = alcoholClock(x.built.bac); add(at(c.peakMin)); add(half(c.goneMin)); add(r(aG / (c.goneMin / 60))); }
      }
      const cz = x.built.caffeine;
      add(at(cz.tmaxMin)); add(Math.round(cz.halfLifeH * 2) / 2); if (cz.doseMg > 0) add(Math.min(100, r((100 * x.caffeineAtBedMg) / cz.doseMg)));
      if (x.glucose) {
        const g = x.glucose, k = top(g, 600), end = Math.min(900, g.length); add(at(k));
        let lo = k; for (let i = k; i < end; i++) if (g[i] < g[lo]) lo = i; add(at(lo));
        for (let i = k; i < end; i++) if (g[i] <= 0.1 * g[k]) { add(at(i)); break; }
      }
      const tg = x.built.effects.tgMmol; if (tg) add(half(top(tg)));
      add(r((900 * m.fat) / kcal)); add(r((400 * m.protein) / kcal)); add(r((100 * kcal) / m.grams)); add(r((100 * m.waterG) / m.grams)); if (m.gi !== null) add(r(m.gi));
      add(r(x.bodyWaterL)); if (f.waterMl) add(Math.round((f.waterMl / (10 * x.bodyWaterL)) * 10) / 10);
      add(Math.max(1, r(kcal / ((3.5 * 3.5 * x.weightKg) / 200))));
      for (const [v, ref] of [[kcal, 2000], [m.sodiumMg, 2300], [m.fiber, 28], [m.protein, 50], [m.satFat, 20]] as const) add(r((100 * v) / ref));
      for (const line of factLines(f, 7)) {
        const extra = numbersOf(line).filter((n) => !ok.has(n));
        if (extra.length) bad.push(`${it.id}: ${line} (${extra.join(', ')})`);
        if (aG >= 1) { alcoholLines++; if (/\b(fun|enjoy|relax|cheers|treat|reward|good for you|healthy|celebrate|party|buzz|worth it)\b/i.test(line)) bad.push(`${it.id}: alcohol framed positively: ${line}`); }
      }
    }
    expect(bad.slice(0, 20)).toEqual([]);
    expect(alcoholLines).toBeGreaterThan(50);
  }, 600_000);

  it('alcohol has rich facts: standard drinks, the peak vs a limit, liver pace, time to clear, energy, sleep', () => {
    const wine = items.find((x) => x.id === 'white-wine')!;
    const lines = factLines(factInOf(wine.x), 3).join(' | ');
    for (const re of [/standard drink/, /0\.08|0\.05|reaction/, /g an hour/, /hours/, /% of its kcal|kcal are alcohol|alcohol alone/, /bed/]) expect(lines).toMatch(re);
    expect(lines).not.toMatch(/\bgone\b/);
  });

  it('sugar, caffeine and fat get their timing facts', () => {
    const by = (id: string) => factLines(factInOf(items.find((x) => x.id === id)!.x), 5).join(' | ');
    expect(by('cola')).toMatch(/minutes in/);
    expect(by('cola')).toMatch(/caffeine|half-life|half of it|half/i);
    expect(by('espresso')).toMatch(/half-life|half of it|to clear just half|hours for half/i);
    expect(by('muffin')).toMatch(/hours in/);
  });

  it('a comparison contrast names both sides, with each side’s own number', () => {
    const cod = items.find((x) => x.id === 'cod')!, muffin = items.find((x) => x.id === 'muffin')!;
    const c = compareContrasts(factInOf(cod.x), factInOf(muffin.x), ['Cod', 'Muffin'], 1);
    expect(c.length).toBeGreaterThan(1);
    for (const l of c) expect(l.toLowerCase()).toMatch(/cod.*muffin|muffin.*cod/);
    expect(c.join(' ')).toContain(String(Math.round(muffin.x.macros.sugars)));
  });
});
