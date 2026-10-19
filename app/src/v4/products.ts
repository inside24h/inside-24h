// Everything the screen needs from a product, in one place. Adding a product = one more entry here
// (plus its research file, claims and model with tests).
import { ESPRESSO, VITAL_CLAIMS } from '../content/espresso';
import { COLA_PRODUCT, COLA_VITAL_CLAIMS } from '../content/cola';
import { organInfo, type OrganInfo } from '../content/organs';
import type { Product } from '../content/types';
import { at, simulateEspresso, type Timeline } from '../science/espressoSim';
import { COLA, simulateCola, type ColaSim } from '../science/colaSim';
import { WATER, simulateWater, waterSbpDelta } from '../science/waterSim';
import { WATER_PRODUCT, WATER_VITAL_CLAIMS } from '../content/water';
import { sleepRiskAt, sleepSentence, type ProductEffects } from '../science/daily';
import { sleepAnchors } from '../science/anchors';
import { formatGlucose, formatGlucoseRise, type Profile } from '../science/profile';
import { BLOOD_SITES, BODY_WATER_SITES, GUT_SITES, ROUTE_GUT_TO_BODY, ROUTE_THROUGH_LIVER, type FlowLayer } from '../scene/flowSites';
import { headline as espressoHeadline, type Headline } from './headlines';
import { colaStory, espressoStory, waterStory, type Story } from './stories';
import { colaRoute, espressoRoute, waterRoute } from './routes';
import type { Route } from '../scene/LiquidRoute';

export interface WhereRow { label: string; value: (m: number) => number; unit: string; max: number; cls: string; organ: string }
export interface Built {
  caffeine: Timeline;
  layers: FlowLayer[];
  where: WhereRow[];
  effects: ProductEffects;
  legend: { color: string; label: string }[];
  dotNote: string;
  insulin?: Float64Array;
  /** Energy from the drink that has reached the blood so far (kcal), and the total it contains. */
  energy: { total: number; absorbed: (m: number) => number };
  /** How the drink travels, in plain words, for the journey strip. */
  journey: { label: string; organ: string; amount: (m: number) => number }[];
  journeyUnit: string;
  /** Guided story: chapters, liquid per organ, plain-language changes. */
  story: Story;
  /** Blood alcohol (g/L) per minute, for products with alcohol. */
  bac?: Float64Array;
  /** Grams of alcohol in the item (dose-aware sleep answer, science/daily.ts alcoholSleepTier). */
  alcoholG?: number;
  /** Water the product brings (ml). */
  waterMl?: number;
  /** PACING ("Over how long?", 2026-10-19): the rounds, one every `everyMin`; for alcohol also the same drinks all at once
   *  (to say what spreading changed). Absent = all at once. */
  pace?: { doses: number; overMin: number; everyMin: number; bacOnce?: Float64Array };
  /** Amounts along the visible liquid route (scene/LiquidRoute). */
  route?: Route;
  /** Half of it has left the stomach after this many minutes. */
  t50?: number;
  /** Plain facts that tune the 'what happens here' lines. */
  traits?: { drink: boolean; fat: boolean; sugar: boolean; alcohol: boolean; caffeine: boolean; fibre: boolean };
}
export interface ProductDef {
  id: string;
  content: Product;
  vitalClaims: Record<'caffeine' | 'hr' | 'bp' | 'glucose' | 'spo2', string[]>;
  hasDose: boolean;
  build: (p: Profile, dose: number) => Built;
  headline: (stageMin: number, b: Built, p: Profile, extraLatencyMin: number) => Headline;
  organ: (key: string, b: Built, m: number) => OrganInfo | null;
}

const CAF = '#ffc46b', MET = '#b48cff', GONE = '#8fa3b8', GLU = '#9fe7ff', FRU = '#ff8fc8';

function caffeineLayer(sim: Timeline, n: number): FlowLayer {
  return {
    id: 'caffeine', n, total: sim.doseMg, states: [
      { amount: sim.stomach, sites: [['stomach', 1]], color: CAF },
      { amount: sim.intestine, sites: GUT_SITES, via: ['duodenum'], color: CAF },
      { amount: sim.body, sites: BODY_WATER_SITES, via: ROUTE_GUT_TO_BODY, color: '#ffd98a' },
      { amount: sim.metabolites, sites: BODY_WATER_SITES, via: ROUTE_THROUGH_LIVER, color: MET },
      { amount: sim.cleared, sites: [['bladder', 1]], via: ['aorta', 'kidney_l'], color: GONE, dim: 0.4 },
    ],
  };
}

const espresso: ProductDef = {
  id: 'espresso', content: ESPRESSO, vitalClaims: VITAL_CLAIMS, hasDose: true,
  build: (p, dose) => {
    const sim = simulateEspresso(dose, p);
    const row = (label: string, s: Float64Array, cls: string, organ: string): WhereRow => ({ label, value: (m) => at(s, m), unit: 'mg', max: dose, cls, organ });
    return {
      caffeine: sim, layers: [caffeineLayer(sim, 1500)], effects: {},
      where: [
        row('Stomach', sim.stomach, 'caf', 'stomach'),
        row('Small intestine', sim.intestine, 'caf', 'jejunum'),
        row('Blood & tissues', sim.body, 'caf', 'heart'),
        row('Broken down by the liver', sim.metabolites, 'met', 'liver'),
        row('Removed by the kidneys', sim.cleared, 'gone', 'kidney_l'),
      ],
      legend: [{ color: CAF, label: 'caffeine' }, { color: MET, label: 'broken down' }, { color: GONE, label: 'removed' }],
      dotNote: `1 dot = ${(dose / 1500).toFixed(3)} mg`,
      // [P2] ≈ 3 kcal per shot; absorbed in step with the drink leaving the gut
      energy: { total: 3, absorbed: (m) => 3 * (1 - (at(sim.stomach, m) + at(sim.intestine, m)) / dose) },
      journey: [
        { label: 'Stomach', organ: 'stomach', amount: (m) => at(sim.stomach, m) },
        { label: 'Intestine', organ: 'jejunum', amount: (m) => at(sim.intestine, m) },
        { label: 'Blood', organ: 'heart', amount: (m) => at(sim.body, m) },
        { label: 'Liver', organ: 'liver', amount: (m) => at(sim.metabolites, m) },
        { label: 'Kidneys', organ: 'kidney_l', amount: (m) => at(sim.cleared, m) },
      ],
      journeyUnit: 'mg caffeine',
      story: espressoStory(sim, p, dose),
      route: espressoRoute(sim, dose),
      traits: { drink: true, fat: false, sugar: false, alcohol: false, caffeine: true, fibre: false },
    };
  },
  headline: (stageMin, b, p, extra) => espressoHeadline(stageMin, b.caffeine, p, extra),
  organ: (key, b, m) => organInfo(key, b.caffeine, m),
};

// ---- cola ----
const colaCache = new WeakMap<Built, ColaSim>();
const unitOf = new WeakMap<Built, Profile['glucoseUnit']>(); // the blood sugar unit picked in "Your body", for organ panels
const cola: ProductDef = {
  id: 'cola', content: COLA_PRODUCT, vitalClaims: COLA_VITAL_CLAIMS, hasDose: false,
  build: (p) => {
    const s = simulateCola(p, 'eu');
    const r = COLA.eu, hex = r.glucoseG + r.fructoseG;
    const toLiver = r.fructoseG * COLA.fructoseFirstPass, toBlood = hex - toLiver;
    const shareB = toBlood / hex, shareL = toLiver / hex;
    const part = (a: Float64Array, k: number) => a.map((v) => v * k);
    const sugar: FlowLayer = {
      id: 'glucose', n: 700, total: toBlood, states: [
        { amount: part(s.stomach, shareB), sites: [['stomach', 1]], color: GLU },
        { amount: part(s.intestine, shareB), sites: GUT_SITES, via: ['duodenum'], color: GLU },
        { amount: s.bloodGlucose, sites: BLOOD_SITES, via: ROUTE_GUT_TO_BODY, color: GLU },
        { amount: s.usedGlucose, sites: [['skin', 0.7], ['brain', 0.15], ['liver', 0.15]], via: ['aorta'], color: GLU, dim: 0.35 },
      ],
    };
    const fructose: FlowLayer = {
      id: 'fructose', n: 500, total: toLiver, states: [
        { amount: part(s.stomach, shareL), sites: [['stomach', 1]], color: FRU },
        { amount: part(s.intestine, shareL), sites: GUT_SITES, via: ['duodenum'], color: FRU },
        { amount: s.liverFructose, sites: [['liver', 1]], via: ['portal_vein'], color: FRU },
        { amount: s.processedFructose, sites: [['liver', 1]], color: FRU, dim: 0.3 },
      ],
    };
    const g = (label: string, a: Float64Array, cls: string, organ: string): WhereRow => ({ label, value: (m) => at(a, m), unit: 'g', max: hex, cls, organ });
    const built: Built = {
      caffeine: s.caffeine,
      layers: [sugar, fructose, caffeineLayer(s.caffeine, 300)],
      effects: { hr: s.hr, glucoseMgDl: s.glucoseDeltaMgDl, bpScale: 0 }, // sugar cancels caffeine's BP rise [KH1]
      where: [
        g('Sugar in the stomach', s.stomach, 'glu', 'stomach'),
        g('Sugar in the small intestine', s.intestine, 'glu', 'jejunum'),
        g('Extra sugar in the blood', s.bloodGlucose, 'glu', 'heart'),
        g('Fructose held by the liver', s.liverFructose, 'fru', 'liver'),
        { label: 'Used or processed', value: (m) => at(s.usedGlucose, m) + at(s.processedFructose, m), unit: 'g', max: hex, cls: 'gone', organ: 'pancreas' },
      ],
      legend: [{ color: GLU, label: 'glucose' }, { color: FRU, label: 'fructose' }, { color: CAF, label: 'caffeine' }],
      dotNote: `1 dot ≈ ${(toBlood / 700).toFixed(3)} g sugar`,
      insulin: s.insulin,
      energy: { total: r.kcal, absorbed: (m) => r.kcal * (1 - (at(s.stomach, m) + at(s.intestine, m)) / hex) }, // [KP1]
      journey: [
        { label: 'Stomach', organ: 'stomach', amount: (m) => at(s.stomach, m) },
        { label: 'Intestine', organ: 'jejunum', amount: (m) => at(s.intestine, m) },
        { label: 'Blood', organ: 'heart', amount: (m) => at(s.bloodGlucose, m) },
        { label: 'Liver', organ: 'liver', amount: (m) => at(s.liverFructose, m) },
        { label: 'Used', organ: 'pancreas', amount: (m) => at(s.usedGlucose, m) + at(s.processedFructose, m) },
      ],
      journeyUnit: 'g sugar',
      story: colaStory(s, p),
      route: colaRoute(s),
      traits: { drink: true, fat: false, sugar: true, alcohol: false, caffeine: true, fibre: false },
    };
    colaCache.set(built, s); unitOf.set(built, p.glucoseUnit);
    return built;
  },
  headline: (stageMin, b, p, extra) => {
    const s = colaCache.get(b)!;
    const toBed = (p.bedtimeMin - p.drinkAtMin + 1440) % 1440;
    const peakDelta = Math.max(...s.glucoseDeltaMgDl.slice(0, 60));
    const sleep = sleepRiskAt(b.caffeine, toBed, sleepAnchors());
    switch (stageMin) {
      case 0: return { label: 'First sip', text: 'One can: 35 g of sugar, about 9 teaspoons, plus 32 mg of caffeine.', claims: ['KP1', 'KP2', 'KP5', 'KP7', 'KP9'] };
      case 1: return { label: 'Stomach', text: 'Sugar slows the stomach down: half the can is still here after about 30 minutes.', claims: ['KG1', 'KG4', 'KG7', 'KG5'] };
      case 6: return { label: 'Into the blood', text: 'The gut splits the sugar into glucose and fructose and absorbs both fast.', claims: ['KA1', 'KA5'] };
      case 12: return { label: 'Liver', text: 'Fructose goes straight to the liver, which captures about 85% of it.', claims: ['KL1', 'KL2'] };
      case 20: return { label: 'Blood sugar peak', text: `Blood sugar rises to about ${formatGlucoseRise(p.glucoseMgDl, peakDelta, p.glucoseUnit)} ${p.glucoseUnit}. Your pancreas releases insulin.`, claims: ['KB2', 'KB4', 'KM1', 'KB7', 'KK3'] };
      case 60: return { label: 'Baseline', text: 'Insulin has pulled your blood sugar back to where it started.', claims: ['KB4', 'KM1'] };
      case 75: return { label: 'The dip', text: 'It overshoots: blood sugar falls below your starting level. This is when hunger tends to come back.', claims: ['KB4', 'KB10', 'KB9'] };
      case 180: return { label: 'Liver', text: 'The liver has burned or turned most of the fructose into glucose. Very little became fat.', claims: ['KL3'] };
      case 420: return { label: 'Bedtime', text: `About ${Math.round(at(b.caffeine.body, toBed))} mg of caffeine is left at bedtime. ${sleepSentence(sleep.risk, Math.max(sleep.extra, extra))}`, claims: ['VS1', 'VS2', 'VS3', 'VS4'] };
      default: return { label: 'Kidneys', text: 'No extra urine: a can of cola hydrates about as well as water.', claims: ['KW1', 'KT5'] };
    }
  },
  organ: (key, b, m) => {
    const s = colaCache.get(b)!;
    const g1 = (v: number) => `${v.toFixed(1)} g`;
    switch (key) {
      case 'stomach': return { name: 'Stomach', claims: ['KG4', 'KG7'], text: 'Sugar keeps the drink here longer than water.', lines: [{ label: 'Cola still here', value: `${at(s.stomachMl, m).toFixed(0)} ml` }, { label: 'Sugar here', value: g1(at(s.stomach, m)) }] };
      case 'duodenum': case 'jejunum': case 'ileum': return { name: 'Small intestine', claims: ['KA1', 'KA5'], text: 'Sucrose is split on the gut wall and both sugars are absorbed within minutes.', lines: [{ label: 'Sugar here', value: g1(at(s.intestine, m)) }] };
      case 'liver': case 'portal_vein': return { name: 'Liver', claims: ['KL1', 'KL2', 'KL3'], text: 'Most of the fructose stops here; the liver burns it or turns it into glucose.', lines: [{ label: 'Fructose in the liver now', value: g1(at(s.liverFructose, m)) }, { label: 'Fructose processed so far', value: g1(at(s.processedFructose, m)) }] };
      case 'pancreas': return { name: 'Pancreas', claims: ['KB2', 'KK3'], text: 'It answers the sugar with insulin, which moves glucose into your cells.', lines: [{ label: 'Insulin above your baseline', value: `+${at(s.insulin, m).toFixed(0)} mU/L` }, { label: 'Blood sugar now', value: `${formatGlucose(at(s.glucoseMgDl, m), unitOf.get(b) ?? 'mmol/L')} ${unitOf.get(b) ?? 'mmol/L'}` }] };
      case 'heart': case 'aorta': case 'vena_cava': return { name: 'Heart and blood', claims: ['KH4', 'KH1'], text: 'Sugar can nudge your pulse up a little; it cancels the small blood-pressure rise from caffeine.', lines: [{ label: 'Extra sugar in the blood', value: g1(at(s.bloodGlucose, m)) }, { label: 'Pulse change (estimate)', value: `+${at(s.hr, m).toFixed(1)} bpm` }] };
      case 'tongue': case 'esophagus': return { name: 'Mouth and teeth', claims: ['KP7', 'KT3'], text: 'Cola is acidic (pH 2.4). Saliva brings the mouth back to normal within about half an hour.', lines: [] };
      case 'kidney_l': case 'kidney_r': case 'bladder': return { name: 'Kidneys', claims: ['KW1', 'KT5'], text: 'A can of cola makes no more urine than the same amount of water.', lines: [] };
      default: return organInfo(key, b.caffeine, m);
    }
  },
};

// ---- water ----
const WATER_C = '#6fb8ff';
const water: ProductDef = {
  id: 'water', content: WATER_PRODUCT, vitalClaims: WATER_VITAL_CLAIMS, hasDose: false,
  build: (p) => {
    const w = simulateWater(p);
    const ml = WATER.ml;
    const row = (label: string, a: Float64Array, cls: string, organ: string): WhereRow => ({ label, value: (m) => at(a, m), unit: 'ml', max: ml, cls, organ });
    const sbp = new Float64Array(w.minutes + 1).map((_, t) => waterSbpDelta(t));
    return {
      caffeine: w.caffeine,
      layers: [{
        id: 'water', n: 1000, total: ml, states: [
          { amount: w.stomach, sites: [['stomach', 1]], color: WATER_C },
          { amount: w.intestine, sites: GUT_SITES, via: ['duodenum'], color: WATER_C },
          { amount: w.body, sites: BODY_WATER_SITES, via: ROUTE_GUT_TO_BODY, color: WATER_C, dim: 0.8 },
          { amount: w.bladder, sites: [['bladder', 1]], via: ['aorta', 'kidney_l'], color: '#d9ecff', dim: 0.6 },
        ],
      }],
      effects: { bp: sbp },
      where: [
        row('In the stomach', w.stomach, 'wat', 'stomach'),
        row('In the small intestine', w.intestine, 'wat', 'jejunum'),
        row('Spread through your body', w.body, 'wat', 'heart'),
        row('Filtered into the bladder', w.bladder, 'gone', 'bladder'),
      ],
      legend: [{ color: WATER_C, label: 'water' }, { color: '#d9ecff', label: 'on its way out' }],
      dotNote: '1 dot = 0.25 ml',
      energy: { total: 0, absorbed: () => 0 },
      journey: [
        { label: 'Stomach', organ: 'stomach', amount: (m) => at(w.stomach, m) },
        { label: 'Intestine', organ: 'jejunum', amount: (m) => at(w.intestine, m) },
        { label: 'Blood', organ: 'heart', amount: (m) => at(w.body, m) },
        { label: 'Kidneys', organ: 'kidney_l', amount: (m) => Math.max(0, at(w.bladder, m) - at(w.bladder, Math.max(0, m - 30))) },
        { label: 'Bladder', organ: 'bladder', amount: (m) => at(w.bladder, m) },
      ],
      journeyUnit: 'ml water',
      story: waterStory(w, p),
      route: waterRoute(w, ml),
      traits: { drink: true, fat: false, sugar: false, alcohol: false, caffeine: false, fibre: false },
    };
  },
  headline: (stageMin) => {
    switch (stageMin) {
      case 0: return { label: 'First sip', text: 'One glass: 250 ml of water, no calories.', claims: ['WN1', 'WM1'] };
      case 1: return { label: 'Stomach', text: 'Water barely stops here: half moves on within about 13 minutes.', claims: ['WA1'] };
      case 5: return { label: 'Into the blood', text: 'The first water reaches your blood within 5 minutes.', claims: ['WA3', 'WA5'] };
      case 20: return { label: 'Everywhere', text: 'It spreads through all the water in your body. Your blood barely notices one glass.', claims: ['WA5', 'WB1', 'WV2', 'WV6'] };
      case 60: return { label: 'Kidneys', text: 'Your kidneys start filtering out the extra water.', claims: ['WB6', 'WB8'] };
      case 120: return { label: 'Bladder', text: 'Most of the glass is now collecting in your bladder.', claims: ['WB8'] };
      default: return { label: 'Balanced', text: 'About 4 hours later the glass has passed through you; your body water is back in balance.', claims: ['WB8', 'WM3'] };
    }
  },
  organ: (key, b, m) => {
    const rows = Object.fromEntries(b.where.map((r) => [r.organ, r]));
    const r = rows[key];
    if (r) return { name: r.label.replace(/^In the |^Spread through |^Filtered into the /, '').replace(/^./, (x) => x.toUpperCase()), claims: ['WA1', 'WA5', 'WB8'], text: 'Water from your glass that is here right now.', lines: [{ label: 'Water here', value: `${r.value(m).toFixed(0)} ml` }] };
    if (key === 'kidney_l' || key === 'kidney_r') return { name: 'Kidneys', claims: ['WB6', 'WB8'], text: 'They filter the extra water out of your blood into the bladder.', lines: [{ label: 'Filtered so far', value: `${rows.bladder.value(m).toFixed(0)} ml` }] };
    return null;
  },
};

export const PRODUCTS: Record<string, ProductDef> = { espresso, cola, water };
