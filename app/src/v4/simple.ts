// Plain-language status cards for the simple view. Every sentence is derived from the same models
// and claims as the detailed view; the claim IDs go with each card so "Why?" still shows the evidence.
import { at, type Timeline } from '../science/espressoSim';
import type { Vitals } from '../science/daily';
import { formatGlucose, type Profile } from '../science/profile';
import { LONG_TERM } from '../content/longterm';
import type { Built } from './products';

export type Tone = 'good' | 'up' | 'down' | 'calm';
export interface Card { key: string; title: string; big: string; text: string; tone: Tone; claims: string[] }

export function simpleCards(productId: string, b: Built, v: Vitals, twin: Vitals, p: Profile, m: number): Card[] {
  const sim: Timeline = b.caffeine;
  const asleep = at(v.asleep, m) > 0.5;
  const cafMg = sim.doseMg >= 1 ? at(sim.body, m) : 0;
  const gDelta = at(v.effect.glucose, m) / 18.016; // mmol/L
  const cards: Card[] = [];

  // ---- brain ----
  let brain: Card;
  if (asleep) {
    brain = v.extraLatencyMin >= 1
      ? { key: 'brain', title: 'Your brain', big: 'Sleep a bit delayed', text: `Caffeine left at bedtime may make you fall asleep about ${Math.round(v.extraLatencyMin)} minutes later.`, tone: 'up', claims: ['VS1', 'VS2', 'VS3'] }
      : { key: 'brain', title: 'Your brain', big: 'Sleeping normally', text: cafMg >= 1 ? `About ${Math.round(cafMg)} mg of caffeine is still in you, too little to disturb sleep.` : 'Nothing from this drink affects your sleep.', tone: 'calm', claims: ['VS2', 'VS3'] };
  } else if (productId === 'cola' && gDelta < -0.3 && m > 60 && m < 240) {
    brain = { key: 'brain', title: 'Your brain', big: 'May feel hungry', text: 'Your blood sugar has dropped a little below where it started. That dip is when hunger tends to come back.', tone: 'down', claims: ['KB4', 'KB9'] };
  } else if (cafMg >= 75) {
    brain = { key: 'brain', title: 'Your brain', big: 'More alert', text: `About ${Math.round(cafMg)} mg of caffeine is blocking the “I’m tired” signal. That’s enough for a noticeable boost.`, tone: 'up', claims: ['F1', 'F2'] };
  } else if (cafMg >= 10) {
    brain = { key: 'brain', title: 'Your brain', big: 'A little more alert', text: `About ${Math.round(cafMg)} mg of caffeine is reaching your brain. Even small amounts sharpen reaction time slightly.`, tone: 'up', claims: ['F1', 'F3'] };
  } else if (sim.doseMg >= 1 && m < sim.tmaxMin) {
    brain = { key: 'brain', title: 'Your brain', big: 'Not yet', text: 'The caffeine is still on its way from your stomach to your brain.', tone: 'calm', claims: ['D2', 'G3'] };
  } else {
    brain = { key: 'brain', title: 'Your brain', big: 'Normal', text: sim.doseMg >= 1 ? 'Almost all the caffeine has been broken down.' : 'This drink does not change how your brain feels.', tone: 'calm', claims: sim.doseMg >= 1 ? ['M4'] : ['WB1'] };
  }
  cards.push(brain);

  // ---- heart ----
  const dHr = at(v.effect.hr, m), dBp = at(v.effect.sbp, m);
  const hr = Math.round(at(v.hr, m)), sbp = Math.round(at(v.sbp, m)), dbp = Math.round(at(v.dbp, m));
  const heartAffected = Math.abs(dHr) >= 1 || Math.abs(dBp) >= 1;
  cards.push({
    key: 'heart', title: 'Your heart', big: heartAffected ? 'Slightly up, harmless' : 'Not affected',
    text: `Pulse ${hr}, blood pressure ${sbp}/${dbp}.` + (heartAffected
      ? ` The drink adds about ${Math.abs(dHr) >= 1 ? `${dHr.toFixed(0)} beats a minute` : `${dBp.toFixed(0)} mmHg`} for now.`
      : asleep ? ' Lower than by day because you are asleep — that is normal.' : ' These are your normal values for this time of day.'),
    tone: heartAffected ? 'up' : 'good', claims: heartAffected ? (productId === 'cola' ? ['KH4', 'KH1'] : productId === 'water' ? ['WV2', 'WV6'] : ['V2', 'F9']) : ['VC1', 'VH1'],
  });

  // ---- sugar & energy ----
  const glu = formatGlucose(at(v.glucose, m), p.glucoseUnit);
  const kcal = Math.round(b.energy.absorbed(m));
  let sugar: Card;
  if (productId === 'water') {
    const inBody = b.where.find((r) => r.organ === 'heart')?.value(m) ?? 0;
    sugar = { key: 'sugar', title: 'Water & energy', big: inBody > 5 ? `+${Math.round(inBody)} ml in your body` : 'Passed through', text: 'No sugar, no calories. Your blood sugar stays where it was.', tone: 'good', claims: ['WA5', 'WB8'] };
  } else if (gDelta > 0.5) {
    sugar = { key: 'sugar', title: 'Sugar & energy', big: 'Blood sugar peak', text: `Blood sugar is up to ${glu} ${p.glucoseUnit}. ${kcal} of ${b.energy.total} kcal have reached your blood; insulin is bringing it back down.`, tone: 'up', claims: ['KB2', 'KB4', 'KM1'] };
  } else if (gDelta < -0.3) {
    sugar = { key: 'sugar', title: 'Sugar & energy', big: 'Blood sugar dip', text: `Blood sugar is ${glu} ${p.glucoseUnit}, a little below where you started. It comes back on its own within a few hours.`, tone: 'down', claims: ['KB4', 'KB10'] };
  } else {
    sugar = { key: 'sugar', title: 'Sugar & energy', big: 'Steady', text: `Blood sugar is ${glu} ${p.glucoseUnit}.` + (b.energy.total >= 10 ? ` ${kcal} of ${b.energy.total} kcal from the drink have reached your blood.` : ' This drink has almost no calories.'), tone: 'good', claims: productId === 'cola' ? ['KB4', 'KM1'] : ['V3', 'VG1'] };
  }
  cards.push(sugar);

  // ---- daily health ----
  const lt = LONG_TERM[productId];
  const top = lt?.items.find((x) => x.pct !== null && !x.better && (x.pct ?? 0) > 1) ?? lt?.items.find((x) => x.better);
  cards.push({
    key: 'daily', title: 'If you have this every day', big: top ? `${top.marker}: ${top.effect}` : 'Fine for most people',
    text: top ? top.detail.split('. ')[0] + '.' : 'Plain water every day is what your body needs; there is no known downside at normal amounts.',
    tone: top ? (top.better ? 'good' : 'up') : 'good', claims: [],
  });
  void twin;
  return cards;
}

export const MOMENTS = (toBed: number, toWake: number): { label: string; min: number }[] => [
  { label: 'Just now', min: 0 },
  { label: '20 min', min: 20 },
  { label: '1 hour', min: 60 },
  { label: '2 hours', min: 120 },
  { label: '6 hours', min: 360 },
  { label: 'Bedtime', min: toBed },
  { label: 'Next morning', min: Math.min(1439, toWake + 30) },
].filter((x, i, a) => a.findIndex((y) => y.label === x.label) === i).sort((a, b) => a.min - b.min);
