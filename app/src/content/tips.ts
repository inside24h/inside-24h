// "What can I do?" — one short next step per traffic-light state. Only tips we can back with a source.
// Levels as everywhere (upute.md §2). Shown next to the lights and as a quick answer when a light turns yellow or red.
import type { Level } from './types';
import { SOURCES } from './sources';
import { FOOD_SOURCES } from './food';

export type TipKey = 'sugarSpike' | 'sugarDip' | 'heart' | 'water' | 'caffeine' | 'alcohol';
export interface Tip { key: TipKey; text: string; level: Level; sources: string[]; why: string }

export const TIPS: Record<TipKey, Tip> = {
  sugarSpike: {
    key: 'sugarSpike', level: 'B', sources: ['buffey2022', 'reynolds2016'],
    text: 'An easy 10-minute walk after eating makes the blood sugar peak smaller.',
    why: 'Light walking lowered the rise in blood sugar after meals compared with sitting (7 crossover trials, mostly adults with overweight). Walking 10 min after each meal beat one 30 min walk a day in people with type 2 diabetes.',
  },
  sugarDip: {
    key: 'sugarDip', level: 'B', sources: ['kim2025', 'wyatt2021'], // one 66-person study for the meal effect: B, not A
    text: 'Have sugary drinks with a meal rather than on their own: with food, the dip went away.',
    why: 'Cola drunk with a muffin did not cause the dip (66 adults on glucose sensors). Bigger dips come with more hunger and eating sooner (1,070 people).',
  },
  heart: {
    key: 'heart', level: 'A', sources: ['aha'],
    text: 'If your resting blood pressure is often 130 or higher, have it checked by a doctor.',
    why: '130–139 is stage 1 and 140 or more stage 2 high blood pressure in the American Heart Association categories.',
  },
  water: {
    key: 'water', level: 'B', sources: ['liska2019', 'meade2024'],
    text: 'Have a glass of water now. On hot days you need more than usual.',
    why: 'Being 2% of body weight short of water counts as dehydration (review). Heat makes your skin and lungs lose more water (measured at 22–36 °C).',
  },
  caffeine: {
    key: 'caffeine', level: 'B', sources: ['drake2013', 'efsa2015'],
    text: 'For good sleep, skip more caffeine today: even 6 hours before bed, a strong dose (400 mg) cut sleep.',
    why: '400 mg taken 0, 3 or 6 hours before bed all disturbed sleep (small trial, 12 adults). For healthy adults EFSA sees no safety concern up to 400 mg a day.',
  },
  alcohol: {
    key: 'alcohol', level: 'A', sources: ['jones2010', 'jongen2014'],
    text: 'Don’t drive. Only time clears alcohol: your liver removes it at a fixed speed.',
    why: 'The liver breaks down alcohol at about 0.10–0.20 ‰ (g/L) per hour, whatever you do. Attention is already worse from 0.2 ‰.',
  },
};

/** Source lookup across the shared list and the food model's list. */
export const tipSource = (id: string) => SOURCES[id] ?? (FOOD_SOURCES as Record<string, { cite: string; url: string }>)[id];
