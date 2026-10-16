// Mirrors research/cola.md. Claim IDs prefixed "K" for cola so they never collide with espresso IDs.
// Caffeine claims are shared from espresso.ts (same molecule, same body).
import type { Claim, Product } from './types';
import { ESPRESSO } from './espresso';

const c = (id: string, level: Claim['level'], text: string, sources: string[], extra: Partial<Claim> = {}): Claim =>
  ({ id, level, text, sources, verified: true, ...extra });

const claims: Claim[] = [
  c('KP1', 'A', 'A 330 ml can (EU recipe) has 35 g of sugar and 139 kcal. That is about 9 teaspoons.', ['cocaColaEU']),
  c('KP2', 'C', 'The sugar is sucrose: once split, 18.4 g glucose and 18.4 g fructose. The US recipe uses corn syrup with a little more fructose (≈ 20 g) and less glucose (≈ 16 g).', ['white2015'], { method: '35 g sucrose × 360/342 = 36.8 g hexose, half glucose, half fructose. US: 36.3 g × 55.6% fructose.' }),
  c('KP5', 'A', 'It also carries about 32 mg of caffeine, half an espresso.', ['chou2007']),
  c('KP7', 'B', 'Its pH is about 2.4, more acidic than orange juice (3.7).', ['alhelal2025']),
  c('KT3', 'B', 'In the mouth, saliva pH dipped to about 6.3 after a sip and recovered within 27 minutes.', ['polyakova2024']),
  c('KP9', 'C', 'One can is about 70% of the WHO daily limit for free sugars (10% of energy), and 140% of the stricter 5% target.', ['who2015'], { method: '35 g ÷ 50 g (10% of 2000 kcal ÷ 4 kcal/g) = 70%; 35 g ÷ 25 g = 140%.' }),
  c('KG1', 'A', 'Sugary drinks leave the stomach at a steady rate of calories, about 1–4 kcal per minute, much slower than water.', ['murthy2023']),
  c('KG4', 'A', 'MRI: a 100 kcal drink half-emptied in 26.5 minutes, a 500 kcal drink in 69.5.', ['camps2016']),
  c('KG7', 'C', 'So we estimate half the can leaves the stomach in about 32 minutes, 2–3 times slower than water.', [], { method: 'Interpolation of KG4 on calories: 26.5 + (139−100)/(500−100) × (69.5−26.5) ≈ 31 min.' }),
  c('KG5', 'B', 'The bubbles do not change how fast it empties or the sugar response.', ['lau2017']),
  c('KA1', 'A', 'An enzyme on the gut wall (sucrase) splits sucrose; glucose and fructose then cross on separate transporters.', ['tannous2023', 'lee2018']),
  c('KA5', 'B', 'Pre-split sugar gave the same blood response as sucrose, so the EU and US recipes behave almost alike.', ['torronen2017']),
  c('KL1', 'A', 'Fructose goes almost entirely to the liver; glucose mostly passes on to the rest of the body.', ['sun2012']),
  c('KL2', 'B', 'About 85% of fructose is captured on its first pass through gut and liver; 14.5% reaches the rest of the body.', ['francey2019']),
  c('KL3', 'A', 'Over 3–6 hours about 45% of the fructose is burned for energy and about 41% becomes glucose. Less than 1% turns directly into blood fat.', ['sun2012']),
  c('KB2', 'A', '35 g sucrose in water raised blood sugar by 2.3 mmol/L at the peak and insulin by about 33 mU/L.', ['torronen2012']),
  c('KB4', 'A', 'With a sensor, cola peaked at 20 minutes, was back to baseline at 60, and dropped below baseline after 75 minutes. Eating it with food removed the dip.', ['kim2025']),
  c('KB10', 'C', 'That dip is about −0.7 mmol/L at two hours for a fasting value of 5.0.', ['kim2025'], { method: '−13.7% at 120 min (KB4) × 5.0 mmol/L = −0.69 mmol/L.' }),
  c('KB9', 'A', 'Bigger dips 2–3 hours after eating predicted more hunger and eating more later (1,070 people).', ['wyatt2021']),
  c('KB7', 'A', 'Glycemic index of soft drinks: 59 (international tables); one UK cola tested at 77.', ['atkinson2008']),
  c('KM1', 'C', 'Our blood-sugar curve is fitted to those measurements: +2.2 mmol/L at 30 min, baseline at ~60 min, ≈ −0.7 at 2 h.', [], { method: 'Difference of two gamma-shaped curves fitted to KB2, KB4, KB10; tested in colaSim.test.ts. Real people vary by about ±1 mmol/L at the peak.' }),
  c('KK3', 'A', 'Caffeine raises the blood-sugar response dose by dose; at cola’s 0.45 mg/kg that is only about +7% (our scaling).', ['beaudoin2013']),
  c('KH1', 'B', 'In a cola-like drink, the sugar canceled the blood-pressure rise from the caffeine.', ['ravussin2022']),
  c('KH4', 'C', 'Sugar may raise pulse by 0–6 bpm for about 2 hours; we show +3.', ['eckstein2022'], { method: 'A double dose of sugar raised average pulse by 6 bpm over 2 h (65 vs 59); one can is about half that dose.' }),
  c('KW1', 'A', '1 liter of cola produced no more urine over 4 hours than 1 liter of water. One can does not dehydrate you.', ['maughan2016']),
  c('KT5', 'A', 'Phosphoric acid did not increase calcium loss in urine; only the caffeine did, slightly, and that was made up later.', ['heaney2001']),
];

export const COLA_PRODUCT: Product = {
  id: 'cola',
  name: 'Cola',
  serving: '1 can · 330 ml · 35 g sugar · 32 mg caffeine',
  claims: { ...ESPRESSO.claims, ...Object.fromEntries(claims.map((x) => [x.id, x])) },
  stages: [
    { min: 0, title: 'First sip', organs: ['tongue', 'esophagus'], claims: ['KP1', 'KP2', 'KP5', 'KP7', 'KT3', 'KP9'] },
    { min: 1, title: 'Stomach', organs: ['stomach'], claims: ['KG1', 'KG4', 'KG7', 'KG5'] },
    { min: 6, title: 'Into the blood', organs: ['duodenum', 'jejunum', 'portal_vein'], claims: ['KA1', 'KA5'] },
    { min: 12, title: 'Fructose to the liver', organs: ['liver', 'portal_vein'], claims: ['KL1', 'KL2'] },
    { min: 20, title: 'Sugar peak', organs: ['pancreas'], claims: ['KB2', 'KB4', 'KM1', 'KB7', 'KK3', 'KH4', 'KH1'] },
    { min: 60, title: 'Back to baseline', organs: ['pancreas'], claims: ['KB4', 'KM1'] },
    { min: 75, title: 'The dip', organs: ['brain'], claims: ['KB4', 'KB10', 'KB9'] },
    { min: 180, title: 'Liver finishes', organs: ['liver'], claims: ['KL3', 'M1', 'M4'] },
    { min: 420, title: 'Bedtime', organs: ['brain'], claims: ['VS1', 'VS2', 'VS3', 'S1'] },
    { min: 720, title: 'Kidneys', organs: ['kidney_l', 'kidney_r', 'bladder'], claims: ['KW1', 'KT5', 'M3'] },
  ],
};

export const COLA_VITAL_CLAIMS = {
  caffeine: ['KP5', 'D5', 'W2'],
  hr: ['KH4', 'VH1', 'VH2', 'VH3'],
  bp: ['KH1', 'VB1', 'VB2'],
  glucose: ['KB2', 'KB4', 'KM1', 'KB10', 'KK3'],
  spo2: ['VO1', 'V5'],
};
