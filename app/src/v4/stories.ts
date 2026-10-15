// The guided story of one product: chapters (where the camera flies, what to say), the liquid in each organ
// minute by minute, and "what changes in you right now" in plain words. Numbers come from the product models;
// every chapter lists the claims behind it (shown on "Why?").
import { at, type Timeline } from '../science/espressoSim';
import type { ColaSim } from '../science/colaSim';
import type { WaterSim } from '../science/waterSim';
import type { Vitals } from '../science/daily';
import { formatGlucose, type Profile } from '../science/profile';
import { GLUCOSE_SPREAD } from '../science/ranges';
import volumesJson from '../assets/organ-volumes.json';

const VOL = volumesJson as Record<string, number>;
const STOMACH_ML = VOL.stomach * 1000; // ≈ 570 ml in the BodyParts3D model
const RESTING_ML = 35; // fasted stomach holds ~35 ml [water.md A1 / Mudie 2014]

export interface Chapter { min: number; title: string; focus: string | null; text: string; claims: string[] }
export type Dir = 'up' | 'down' | 'same';
export interface Change { label: string; dir: Dir; value: string; note: string }
export type LiquidMap = Record<string, { fill?: number; tint?: number }>;
export interface Story {
  color: string; // drink colour in the body
  chapters: Chapter[];
  liquid: (m: number) => LiquidMap;
  changes: (m: number, v: Vitals, p: Profile) => Change[];
  /** How strongly the drink is flowing along each path right now (0..1), for the streams between organs. */
  flows: (m: number) => { swallow: number; empty: number; absorb: number; blood: number; kidney: number; colon?: number };
  toKidneys: boolean;
}

/** Outflow per minute from a compartment, scaled so the busiest minute = 1. */
function rate(a: Float64Array): (m: number) => number {
  let max = 1e-9;
  for (let i = 0; i + 1 < a.length; i++) max = Math.max(max, a[i] - a[i + 1]);
  return (m) => Math.max(0, at(a, m) - at(a, m + 1)) / max;
}
function inflow(a: Float64Array): (m: number) => number {
  let max = 1e-9;
  for (let i = 0; i + 1 < a.length; i++) max = Math.max(max, a[i + 1] - a[i]);
  return (m) => Math.max(0, at(a, m + 1) - at(a, m)) / max;
}
const swallowFlow = (m: number) => (m < 0.8 ? 1 : 0);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const peakOf = (a: Float64Array) => a.reduce((m, x) => Math.max(m, x), 1e-9);
const swallow = (m: number): LiquidMap => ({ tongue: { tint: m < 0.4 ? 1 : 0 }, esophagus: { tint: m < 0.8 ? 1 - m : 0 } });
const stomachFill = (ml: number) => clamp01((RESTING_ML + ml) / STOMACH_ML);
const gut = (frac: number): LiquidMap => ({ duodenum: { tint: 3 * frac }, jejunum: { tint: 2.4 * frac }, ileum: { tint: 0.9 * frac } });
const dirOf = (d: number, eps: number): Dir => (d > eps ? 'up' : d < -eps ? 'down' : 'same');
const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(Math.floor(min) % 60).padStart(2, '0')}`;

function vitalChanges(m: number, v: Vitals, p: Profile, sugarToo: boolean): Change[] {
  const out: Change[] = [];
  const dHr = at(v.effect.hr, m), dBp = at(v.effect.sbp, m);
  out.push({ label: 'Pulse', dir: dirOf(dHr, 0.5), value: `${Math.round(at(v.hr, m))} bpm`, note: Math.abs(dHr) >= 0.5 ? `${dHr > 0 ? '+' : ''}${dHr.toFixed(0)} from this drink` : 'not changed by this drink' });
  out.push({ label: 'Blood pressure', dir: dirOf(dBp, 0.5), value: `${Math.round(at(v.sbp, m))}/${Math.round(at(v.dbp, m))}`, note: Math.abs(dBp) >= 0.5 ? `+${dBp.toFixed(1)} mmHg, harmless` : 'not changed by this drink' });
  if (sugarToo) {
    const dG = at(v.effect.glucose, m) / 18.016;
    out.push({ label: 'Blood sugar', dir: dirOf(dG, 0.1), value: `${formatGlucose(at(v.glucose, m), p.glucoseUnit)} ${p.glucoseUnit}`, note: 'no sugar in this drink' });
  }
  return out;
}

// ---------------- cola ----------------
export function colaStory(s: ColaSim, p: Profile): Story {
  const toBed = (p.bedtimeMin - p.drinkAtMin + 1440) % 1440;
  const peakFruct = peakOf(s.liverFructose), peakBlood = peakOf(s.bloodGlucose), peakCaf = peakOf(s.caffeine.conc);
  const g0 = p.glucoseMgDl, gPeak = g0 + peakOf(s.glucoseDeltaMgDl);
  const g = (mgdl: number) => `${formatGlucose(mgdl, p.glucoseUnit)} ${p.glucoseUnit}`;
  const emptyR = rate(s.stomach), absorbR = rate(s.intestine);
  return {
    color: '#2b1208', // cola: very dark brown, almost black
    toKidneys: false,
    flows: (m) => ({ swallow: swallowFlow(m), empty: emptyR(m), absorb: absorbR(m), blood: 0.6 * at(s.bloodGlucose, m) / peakBlood, kidney: 0 }),
    chapters: [
      { min: 0, title: 'First sip', focus: 'tongue', claims: ['KP1', 'KP7', 'KT3'], text: 'One can: 35 g of sugar (about 9 teaspoons) and 32 mg of caffeine. Cola is acidic (pH 2.4); your saliva needs about half an hour to calm your teeth down again.' },
      { min: 0.3, title: 'Down the food pipe', focus: 'esophagus', claims: [], text: 'You swallow and it slides down your food pipe (oesophagus) into your stomach.' },
      { min: 1, title: 'In your stomach', focus: 'stomach', claims: ['KG4', 'KG7'], text: 'Your stomach fills up. Because of the sugar it lets the cola out slowly: half is still here after about 30 minutes. Water would be gone twice as fast.' },
      { min: 6, title: 'Into the small intestine', focus: 'jejunum', claims: ['KA1', 'KA5'], text: 'In the first part of your small intestine the sugar is split into glucose and fructose and pulled into your blood within minutes.' },
      { min: 12, title: 'Straight to the liver', focus: 'liver', claims: ['KL1', 'KL2'], text: 'Blood from your gut goes to the liver first. It grabs about 85% of the fructose. The glucose passes on to the rest of your body.' },
      { min: 20, title: 'Sugar rush', focus: 'pancreas', claims: ['KB2', 'KB4', 'KM1'], text: `Your blood sugar climbs from ${g(g0)} to about ${g(gPeak)} (typical response, not personalised: most people land between ${formatGlucose(g0 + (gPeak - g0) * (1 - GLUCOSE_SPREAD), p.glucoseUnit)} and ${g(g0 + (gPeak - g0) * (1 + GLUCOSE_SPREAD))}). Your pancreas releases insulin to bring it back down.` },
      { min: 45, title: 'A little caffeine', focus: 'brain', claims: ['KP5', 'F1', 'F3'], text: 'The caffeine (32 mg, half an espresso) reaches your brain and blocks the "I\'m tired" signal a little.' },
      { min: 75, title: 'The sugar dip', focus: 'brain', claims: ['KB4', 'KB10', 'KB9'], text: 'Insulin overshoots: your blood sugar drops a bit below where you started. This is when hunger and cravings tend to come back.' },
      { min: 180, title: 'The liver finishes', focus: 'liver', claims: ['KL3'], text: 'Over the next hours your liver burns about half of the fructose for energy and turns about 40% into glucose. Less than 1% becomes fat right away.' },
      { min: toBed, title: 'Bedtime', focus: 'brain', claims: ['VS2', 'VS3'], text: `About ${Math.round(at(s.caffeine.body, toBed))} mg of caffeine is left in you: too little to keep you awake.` },
      { min: 720, title: 'Kidneys', focus: 'kidney_l', claims: ['KW1'], text: 'No extra urine: a can of cola hydrates you about as well as the same amount of water.' },
    ].sort((a, b) => a.min - b.min),
    liquid: (m) => {
      const hex = s.sugarG, inGut = at(s.intestine, m) / hex, blood = at(s.bloodGlucose, m) / peakBlood;
      return {
        ...swallow(m),
        stomach: { fill: stomachFill(at(s.stomachMl, m)) },
        ...gut(inGut),
        portal_vein: { tint: 3 * inGut },
        liver: { tint: at(s.liverFructose, m) / peakFruct },
        heart: { tint: blood }, aorta: { tint: blood }, vena_cava: { tint: blood * 0.8 },
        pancreas: { tint: at(s.insulin, m) / 30 },
        brain: { tint: 0.6 * at(s.caffeine.conc, m) / peakCaf },
      };
    },
    changes: (m, v, p2) => {
      const dG = at(s.glucoseDeltaMgDl, m) / 18.016, ins = at(s.insulin, m);
      const out: Change[] = [
        { label: 'Blood sugar', dir: dirOf(dG, 0.1), value: g(at(v.glucose, m)), note: dG > 0.1 ? 'sugar rush' : dG < -0.1 ? 'dip: hunger may come back' : m < 20 ? 'not changed yet' : 'back to normal' },
        { label: 'Insulin', dir: ins > 2 ? 'up' : 'same', value: ins > 2 ? `+${Math.round(ins)} mU/L` : 'normal', note: ins > 2 ? 'pancreas clearing the sugar' : m < 20 ? 'not needed yet' : 'back to normal' },
        { label: 'Energy from the can', dir: 'up', value: `${Math.round(139 * (1 - (at(s.stomach, m) + at(s.intestine, m)) / s.sugarG))} / 139 kcal`, note: 'reached your blood so far' },
        { label: 'Caffeine', dir: at(s.caffeine.body, m) > 3 ? 'up' : 'same', value: `${Math.round(at(s.caffeine.body, m))} mg`, note: 'mild, half an espresso at most' },
      ];
      return [...out, ...vitalChanges(m, v, p2, false)];
    },
  };
}

// ---------------- espresso ----------------
export function espressoStory(sim: Timeline, p: Profile, dose: number): Story {
  const toBed = (p.bedtimeMin - p.drinkAtMin + 1440) % 1440;
  const peak = peakOf(sim.body), peakC = peakOf(sim.conc);
  const emptyR = rate(sim.stomach), absorbR = rate(sim.intestine), clearR = inflow(sim.cleared);
  return {
    color: '#3b1f0e', // espresso: dark coffee brown
    toKidneys: true,
    flows: (m) => ({ swallow: swallowFlow(m), empty: emptyR(m), absorb: absorbR(m), blood: 0.6 * at(sim.body, m) / peak, kidney: 0.8 * clearR(m) }),
    chapters: [
      { min: 0, title: 'First sip', focus: 'tongue', claims: ['P1', 'P3'], text: `One shot, about 30 ml with ${Math.round(dose)} mg of caffeine. Real espressos vary a lot: the strongest ever measured had 322 mg.` },
      { min: 0.3, title: 'Down the food pipe', focus: 'esophagus', claims: [], text: 'It slides down your food pipe into your stomach.' },
      { min: 1, title: 'In your stomach', focus: 'stomach', claims: ['G1', 'F4'], text: 'A small drink leaves fast: half of it moves on within about 13 minutes. Coffee also makes your stomach produce more acid.' },
      { min: 4, title: 'Your colon reacts', focus: 'colon_desc', claims: ['F5'], text: 'In about 1 in 3 people coffee makes the lower bowel start moving within minutes, even before any caffeine is absorbed.' },
      { min: 10, title: 'Into the blood', focus: 'jejunum', claims: ['D1', 'G3'], text: 'Your small intestine absorbs almost all of the caffeine and passes it into your blood.' },
      { min: 30, title: 'Reaching your brain', focus: 'brain', claims: ['D7', 'F1', 'F3'], text: 'Caffeine slips into your brain and blocks adenosine, the signal that builds up tiredness. You feel more alert.' },
      { min: Math.round(sim.tmaxMin), title: 'Peak', focus: 'heart', claims: ['G3', 'V1', 'F9'], text: `Caffeine in your blood is at its highest now. Your pulse doesn't change; blood pressure rises only a little.` },
      { min: 180, title: 'The liver breaks it down', focus: 'liver', claims: ['M1', 'M2', 'M4'], text: `Your liver takes the caffeine apart: half of it is gone every ${sim.halfLifeH.toFixed(1)} hours.` },
      { min: toBed, title: 'Bedtime', focus: 'brain', claims: ['VS1', 'VS2', 'VS3'], text: `About ${Math.round(at(sim.body, toBed))} mg of caffeine is still in you at ${hhmm(p.bedtimeMin)}.` },
      { min: 720, title: 'Out through the kidneys', focus: 'kidney_l', claims: ['M3', 'X1'], text: 'Your kidneys flush out the breakdown products.' },
    ].sort((a, b) => a.min - b.min),
    liquid: (m) => {
      const inGut = at(sim.intestine, m) / dose, blood = at(sim.body, m) / peak;
      return {
        ...swallow(m),
        stomach: { fill: stomachFill(30 * at(sim.stomach, m) / dose) },
        ...gut(inGut),
        portal_vein: { tint: 3 * inGut },
        heart: { tint: blood }, aorta: { tint: blood }, vena_cava: { tint: blood * 0.8 },
        brain: { tint: at(sim.conc, m) / peakC },
        liver: { tint: 0.8 * blood },
        kidney_l: { tint: 0.5 * at(sim.metabolites, m) / dose }, kidney_r: { tint: 0.5 * at(sim.metabolites, m) / dose },
        colon_desc: { tint: m > 3 && m < 35 ? 0.5 : 0 }, rectum: { tint: m > 3 && m < 35 ? 0.4 : 0 },
      };
    },
    changes: (m, v, p2) => {
      const mg = at(sim.body, m);
      return [
        { label: 'Caffeine in you', dir: mg > 3 ? 'up' : 'same', value: `${Math.round(mg)} mg`, note: mg >= 75 ? 'enough for a clear boost' : mg >= 10 ? 'a mild lift' : 'almost gone' },
        { label: 'Alertness', dir: mg >= 10 ? 'up' : 'same', value: mg >= 75 ? 'clearly up' : mg >= 10 ? 'slightly up' : 'normal', note: 'tiredness signal blocked' },
        ...vitalChanges(m, v, p2, true),
      ];
    },
  };
}

// ---------------- water ----------------
export function waterStory(w: WaterSim, p: Profile): Story {
  const peakBody = peakOf(w.body);
  const emptyR = rate(w.stomach), absorbR = rate(w.intestine), kidneyR = inflow(w.bladder);
  void p;
  return {
    color: '#d6ecff', // water: clear with a faint blue
    toKidneys: true,
    flows: (m) => ({ swallow: swallowFlow(m), empty: emptyR(m), absorb: absorbR(m), blood: 0.6 * at(w.body, m) / peakBody, kidney: kidneyR(m) }),
    chapters: [
      { min: 0, title: 'First sip', focus: 'tongue', claims: ['WN1'], text: 'One glass: 250 ml of water. No sugar, no calories.' },
      { min: 0.3, title: 'Down the food pipe', focus: 'esophagus', claims: [], text: 'It runs down your food pipe into your stomach.' },
      { min: 1, title: 'In your stomach', focus: 'stomach', claims: ['WA1'], text: 'Water barely stops here: half of it moves on within about 13 minutes.' },
      { min: 5, title: 'Into your blood', focus: 'jejunum', claims: ['WA3', 'WA5'], text: 'The first water reaches your blood within 5 minutes. In the gut it travels in small pockets, about a teaspoon each.' },
      { min: 20, title: 'Everywhere in you', focus: 'heart', claims: ['WA5', 'WB1', 'WV2'], text: 'It spreads through all the water in your body. Your blood barely notices one glass; blood pressure goes up by a tiny amount.' },
      { min: 60, title: 'Kidneys', focus: 'kidney_l', claims: ['WB6', 'WB8'], text: 'Your kidneys start filtering out the extra water.' },
      { min: 120, title: 'Bladder', focus: 'bladder', claims: ['WB8'], text: 'Most of the glass is now collecting in your bladder.' },
      { min: 240, title: 'Balanced again', focus: null, claims: ['WB8', 'WM3'], text: 'About 4 hours later the glass has passed through you and your body water is back in balance.' },
    ],
    liquid: (m) => {
      const inGut = at(w.intestine, m) / 250, body = at(w.body, m) / peakBody;
      const outflow = Math.max(0, at(w.bladder, m) - at(w.bladder, Math.max(0, m - 20))) / 40;
      return {
        ...swallow(m),
        stomach: { fill: stomachFill(at(w.stomach, m)) },
        ...gut(inGut),
        portal_vein: { tint: 3 * inGut },
        heart: { tint: body }, aorta: { tint: body }, vena_cava: { tint: body },
        kidney_l: { tint: outflow }, kidney_r: { tint: outflow },
        bladder: { fill: clamp01((at(w.bladder, m) - at(w.bladder, Math.max(0, m - 180))) / 400) }, // emptied every few hours (C)
      };
    },
    changes: (m, v, p2) => [
      { label: 'Water in your body', dir: at(w.body, m) > 5 ? 'up' : 'same', value: `+${Math.round(at(w.body, m))} ml`, note: 'spread through all your tissues' },
      { label: 'Bladder', dir: at(w.bladder, m) > 5 ? 'up' : 'same', value: `${Math.round(at(w.bladder, m))} ml`, note: 'from this glass' },
      ...vitalChanges(m, v, p2, true),
    ],
  };
}
