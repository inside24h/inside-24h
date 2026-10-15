// Mirrors research/water.md. Claim IDs prefixed "W" (W-A1 = water.md A1, etc.).
import type { Claim, Product } from './types';
import { ESPRESSO } from './espresso';

const c = (id: string, level: Claim['level'], text: string, sources: string[], extra: Partial<Claim> = {}): Claim =>
  ({ id, level, text, sources, verified: true, ...extra });

const claims: Claim[] = [
  c('WA1', 'A', 'Water leaves an empty stomach fast: half within about 13 minutes, all of it by about 45 minutes (MRI).', ['mudie2014']),
  c('WA3', 'A', 'In the small intestine water sits in small separate pockets of about 5 ml, not as one stream.', ['mudie2014']),
  c('WA5', 'A', 'Swallowed water shows up in the blood within 5 minutes, peaks at about 20, and is over 99% absorbed by 75–90 minutes.', ['peronnet2012']),
  c('WB1', 'A', 'The kidneys keep the blood’s salt balance within about ±2%, so one glass barely changes it.', ['liska2019']),
  c('WB6', 'A', 'After 1 litre of water, healthy people made about 1.3 kg of urine over 4 hours.', ['maughan2016']),
  c('WB8', 'C', 'Scaled to one 250 ml glass: in a well-hydrated person almost all of it leaves through the kidneys within about 4 hours, most between 30 minutes and 2 hours.', ['maughan2016', 'calvi2024'], { method: 'Maughan: 1 L → 1337 g urine in 4 h, which is more than the dose once normal background urine is added, so the whole extra litre left in 4 h. We scale linearly to 250 ml and model removal with a 60-minute half-time (94% out by 4 h). The 250 ml time course itself was never measured.' }),
  c('WV2', 'A', 'Drinking 350–500 ml quickly raised blood pressure slightly in healthy people: +2.3/+2.7 mmHg.', ['oyewunmi2023']),
  c('WV6', 'C', 'For one 250 ml glass we show about +1.5 mmHg at 30 minutes, gone within 2 hours.', [], { method: 'Smaller dose than WV2; young people in one study showed no rise at all. Range 0–2 mmHg.' }),
  c('WN1', 'A', 'EFSA: adults need about 2.0 L (women) to 2.5 L (men) of total water a day, including the water in food.', ['efsa2010']),
  c('WM1', 'B', '“Eight glasses a day” has no solid evidence behind it as a rule.', ['perrier2021']),
  c('WM3', 'A', 'Water does not meaningfully “boost metabolism”: a careful repeat study found under 3%, the same as a fake drink.', ['charriere2015']),
];

export const WATER_PRODUCT: Product = {
  id: 'water',
  name: 'Water',
  serving: '1 glass · 250 ml',
  claims: { ...ESPRESSO.claims, ...Object.fromEntries(claims.map((x) => [x.id, x])) },
  stages: [
    { min: 0, title: 'First sip', organs: ['tongue', 'esophagus'], claims: ['WN1', 'WM1'] },
    { min: 1, title: 'Stomach', organs: ['stomach'], claims: ['WA1'] },
    { min: 5, title: 'Into the blood', organs: ['duodenum', 'jejunum', 'portal_vein'], claims: ['WA3', 'WA5'] },
    { min: 20, title: 'Everywhere', organs: ['heart', 'aorta'], claims: ['WA5', 'WB1', 'WV2', 'WV6'] },
    { min: 60, title: 'Kidneys', organs: ['kidney_l', 'kidney_r'], claims: ['WB6', 'WB8'] },
    { min: 120, title: 'Bladder', organs: ['bladder'], claims: ['WB8'] },
    { min: 240, title: 'Balanced again', organs: ['bladder'], claims: ['WB8', 'WM3'] },
  ],
};

export const WATER_VITAL_CLAIMS = {
  caffeine: ['WN1'],
  hr: ['VH1', 'VH2', 'VH3'],
  bp: ['WV2', 'WV6', 'VB1'],
  glucose: ['VG1'],
  spo2: ['VO1'],
};
