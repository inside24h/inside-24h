// Claims behind the generic food model (any food from the database). IDs map to research/digestion-generic.md
// (GE/SI/CO/GL/TG/AA/TE/FC), research/alcohol.md (AL*) and research/fooddb-notes.md (DB*).
import type { Claim } from './types';
import { SOURCES } from './sources';

const pm = (id: string) => `https://pubmed.ncbi.nlm.nih.gov/${id}/`;
export const FOOD_SOURCES = {
  usdaSR: { id: 'usdaSR', cite: 'USDA FoodData Central, SR Legacy (April 2018)', url: 'https://fdc.nal.usda.gov/' },
  atkinson2008: { id: 'atkinson2008', cite: 'Atkinson FS et al. 2008, Diabetes Care (GI tables)', url: 'https://europepmc.org/article/PMC/PMC2584181' },
  tougas2000: { id: 'tougas2000', cite: 'Tougas G et al. 2000, Am J Gastroenterol', url: pm('10894578') },
  parkman2025: { id: 'parkman2025', cite: 'Parkman HP et al. 2025, Dig Dis Sci', url: 'https://europepmc.org/article/PMC/PMC11972169' },
  camps2016: { id: 'camps2016', cite: 'Camps G et al. 2016, Am J Clin Nutr (MRI)', url: pm('27281305') },
  benini1995: { id: 'benini1995', cite: 'Benini L et al. 1995, Gut', url: pm('7615267') },
  cortot1982: { id: 'cortot1982', cite: 'Cortot A et al. 1982, Gastroenterology', url: pm('7060909') },
  englyst1986: { id: 'englyst1986', cite: 'Englyst HN, Cummings JH 1986', url: pm('3014853') },
  asnicar2021: { id: 'asnicar2021', cite: 'Asnicar F et al. 2021, Gut (863 adults)', url: 'https://europepmc.org/article/PMC/PMC8349893' },
  metcalf1987: { id: 'metcalf1987', cite: 'Metcalf AM et al. 1987, Gastroenterology', url: pm('3023168') },
  cummings1987: { id: 'cummings1987', cite: 'Cummings JH et al. 1987, Gut', url: pm('3678950') },
  brandmiller2009: { id: 'brandmiller2009', cite: 'Brand-Miller JC et al. 2009, Am J Clin Nutr', url: pm('19056599') },
  brandmiller2003: { id: 'brandmiller2003', cite: 'Brand-Miller JC et al. 2003, J Nutr', url: pm('12949357') },
  calvo2025: { id: 'calvo2025', cite: 'Calvo-Malvar M et al. 2025, JAMA Netw Open (CGM, 514 adults)', url: 'https://europepmc.org/article/PMC/PMC12457981' },
  berry2020: { id: 'berry2020', cite: 'Berry SE et al. 2020, Nat Med (PREDICT)', url: pm('32528151') },
  wyatt2021: { id: 'wyatt2021', cite: 'Wyatt P et al. 2021, Nat Metab', url: 'https://europepmc.org/article/PMC/PMC7610681' },
  wilson2021: { id: 'wilson2021', cite: 'Wilson SM et al. 2021, Lipids Health Dis', url: 'https://europepmc.org/article/PMC/PMC8451105' },
  pham2022: { id: 'pham2022', cite: 'Pham T et al. 2022, Curr Dev Nutr', url: 'https://europepmc.org/article/PMC/PMC9154224' },
  tappy1996: { id: 'tappy1996', cite: 'Tappy L 1996, Reprod Nutr Dev', url: pm('8878356') },
  wells1998: { id: 'wells1998', cite: 'Wells AS et al. 1998, J Appl Physiol', url: pm('9475860') },
  nandhra2023: { id: 'nandhra2023', cite: 'Nandhra GK et al. 2023, J Clin Med (capsule transit times in health, systematic review)', url: 'https://europepmc.org/article/PMC/PMC10455695' },
  mitchell2014: { id: 'mitchell2014', cite: 'Mitchell MC et al. 2014, Alcohol Clin Exp Res', url: 'https://europepmc.org/article/PMC/PMC4112772' },
  jones2010: { id: 'jones2010', cite: 'Jones AW 2010, Forensic Sci Int', url: pm('20304569') },
  searle2015: { id: 'searle2015', cite: 'Searle J 2015, Med Sci Law (Widmark)', url: 'https://europepmc.org/article/PMC/PMC4361698' },
  maskell2020: { id: 'maskell2020', cite: 'Maskell PD, Cooper GAA 2020, J Forensic Sci', url: pm('32421216') },
  jongen2014: { id: 'jongen2014', cite: 'Jongen S et al. 2014, Psychopharmacology', url: pm('24408210') },
  tasnim2020: { id: 'tasnim2020', cite: 'Tasnim S et al. 2020, Cochrane Review', url: pm('32609894') },
  ebrahim2013: { id: 'ebrahim2013', cite: 'Ebrahim IO et al. 2013, Alcohol Clin Exp Res', url: pm('23347102') },
  pietila2018: { id: 'pietila2018', cite: 'Pietilä J et al. 2018, JMIR Ment Health (4,098 people, heart rate variability in sleep)', url: 'https://europepmc.org/article/PMC/PMC5878366' },
  maughan2016: { id: 'maughan2016', cite: 'Maughan RJ et al. 2016, Am J Clin Nutr', url: pm('26702122') },
  euCroatia: { id: 'euCroatia', cite: 'European Commission, Your Europe: Croatia road rules', url: 'https://europa.eu/youreurope/citizens/travel/driving-abroad/road-rules-and-safety/croatia/index_en.htm' },
  mudie2014: { id: 'mudie2014', cite: 'Mudie DM et al. 2014, Mol Pharm (MRI)', url: pm('25115349') },
  wilson2025: { id: 'wilson2025', cite: 'Wilson ML et al. 2025, Nutr Rev (systematic review, 16 trials)', url: 'https://europepmc.org/article/PMC/PMC11819491' },
};

// one shared source list for the evidence drawer (existing entries win)
for (const [k, s] of Object.entries(FOOD_SOURCES)) if (!SOURCES[k]) SOURCES[k] = s;

const c = (id: string, level: Claim['level'], text: string, sources: string[], method?: string): Claim => ({ id, level, text, sources, method, verified: true });

export const FOOD_CLAIMS: Record<string, Claim> = Object.fromEntries([
  c('DB1', 'A', 'Calories, carbohydrate, sugar, fiber, fat, protein, water, caffeine and alcohol per 100 g come from the USDA SR Legacy database. Portion sizes like “1 medium apple” are USDA portion weights.', ['usdaSR']),
  c('DB2', 'C', 'Household amounts we had to assume: glass 250 ml, cup 200 ml, can 330 ml, bottle 500 ml, tablespoon 15 ml, teaspoon 5 ml. Mixed drinks (coffee with milk, cappuccino, latte) are our own recipes from USDA ingredients.', ['usdaSR'], 'Typical European serving sizes; marked “assumed” on screen.'),
  c('DB3', 'A', 'Glycemic index values are from the international GI tables (Atkinson 2008, Table 1 and Supplementary Table A1, healthy subjects). Foods without a measured GI show no sugar curve rather than a guess.', ['atkinson2008']),
  c('GE1', 'A', 'A normal solid meal: about 69% is still in the stomach after 1 hour, 24% after 2 hours and about 1% after 4 hours (123 healthy adults). More than 10% left at 4 hours counts as delayed.', ['tougas2000']),
  c('GE4', 'B', 'Half of a 255 kcal solid meal leaves the stomach in about 94 minutes; smaller meals in about 67 minutes, but never much faster than about an hour.', ['parkman2025']),
  c('GE5', 'C', 'Our solid-food curve: retention = exp(−(t/τ)^1.8), half-time 94 × √(kcal/255) min, at least 65 and at most 210 min (the slowest big meals measured by MRI). It reproduces the 69/24/1% data within a few points.', ['tougas2000', 'parkman2025', 'farivar2026'], 'Power-exponential fit to GE1 with GE4 scaling by meal energy.'),
  c('GE12', 'C', 'Drinks with calories leave more slowly than water. Our line: half-time ≈ 13 + 0.11 × kcal minutes. Measured by MRI: water 13 min, a 100 kcal shake 26.5 min, a 500 kcal shake 69.5 min.', ['mudie2014', 'camps2016'], 'Straight line through the MRI measurements.'),
  c('GE13', 'B', 'Fiber slows the stomach: 20 g instead of 4 g fiber per 1000 kcal made emptying about 25% longer.', ['benini1995']),
  c('GE15', 'B', 'Fat leaves the stomach last: the gut senses digested fat and slows the stomach down.', ['cortot1982']),
  c('SI10', 'A', 'Fiber is not digested in the small intestine: all of it reaches the large intestine, where bacteria ferment part of it.', ['englyst1986', 'cummings1987']),
  c('SI7', 'C', 'Leftovers of a solid meal reach the start of the large intestine about 5–8 hours after eating. In healthy people a swallowed capsule takes about 3.3–7 hours through the small intestine (22 studies); we use about 4 hours.', ['tougas2000', 'nandhra2023', 'metcalf1987'], 'Gastric half-time plus about 4 hours of small-bowel transit (inside the 3.3–7 h capsule range).'),
  c('CO1', 'A', 'From eating to the toilet: median 28.7 hours (normal 14–58 h, 863 healthy adults). Only about 1 in 3 people pass the first part of a meal within 24 hours.', ['asnicar2021']),
  c('CO3', 'A', 'The large intestine takes about 35 hours in total: right side 11 h, left side 11 h, last part 12 h. Men are a little faster than women.', ['metcalf1987']),
  c('GL1', 'A', 'The glycemic index predicts how high blood sugar peaks (correlation 0.76 across 1,126 foods), and the glycemic load (GI × carbohydrate) predicts the size of the response in healthy people.', ['brandmiller2009', 'brandmiller2003']),
  c('GL4', 'C', 'Our sugar curve: peak = 3.14 × (1 − e^(−GL/16)) mmol/L, anchored on a can of cola (+2.3) and a 50 g glucose drink (≈ +3); solid food at 80%, semi-solid at 90%. Solid food peaks later (about 50–70 min). Real people differ a lot: the range we show (±40%) covers about two in three people.', ['brandmiller2003', 'calvo2025', 'berry2020'], 'Two-point saturating fit; peak timing from CGM in 514 adults.'),
  c('GL7', 'A', 'After a sugary drink on its own, blood sugar can dip a little below where it started 1–3 hours later. In 1,070 people wearing glucose sensors, bigger dips 2–3 hours after a meal went with more hunger and eating sooner.', ['kim2025', 'wyatt2021']),
  c('TG1', 'B', 'In 35 adults with overweight, a breakfast with 50 g of fat raised blood fat (triglycerides) by a median 0.8 mmol/L, with big differences between people. Across trials blood fat is clearly raised about 3 hours after a fatty meal and falls again after about 5 hours. We scale the rise with the fat in your food.', ['wilson2021', 'wilson2025'], 'Rise = 0.77 mmol/L × fat g / 50, capped at 1.2; peak at 3.5 h (our estimate, C).'),
  c('AA1', 'B', 'Protein from a real meal shows up in the blood as amino acids, peaking 2–3 hours after eating.', ['pham2022']),
  c('TE1', 'A', 'Digesting costs energy: about 20–30% of protein calories, 5–10% of carbohydrate calories and 0–3% of fat calories.', ['tappy1996']),
  c('FC1', 'B', 'Feeling sleepy after a big meal is real: sleepiness rises about 1.5 hours after eating, whatever the meal is made of.', ['wells1998']),
  c('AL1', 'A', 'Same alcohol, different drink (15 fasted men, 0.5 g per kg): the peak was about 0.50 g/L at 1 hour after beer, 0.62 g/L at 54 min after wine and 0.77 g/L at 36 min after vodka-tonic; 7 of 15 men passed 0.8 g/L on vodka-tonic. Food lowers and delays the peak.', ['mitchell2014']),
  c('AL2', 'A', 'Your liver removes alcohol at a fixed speed: about 0.10–0.15 g/L per hour fasted, 0.15–0.20 after food. Coffee or water does not speed it up.', ['jones2010']),
  c('AL3', 'C', 'Blood alcohol = alcohol absorbed ÷ (Widmark factor × body weight); the factor comes from your BMI and sex. Real values differ by ±20–40% or more, so we show −40% to +50%: never use this to decide whether to drive.', ['searle2015', 'maskell2020', 'mitchell2014'], 'Widmark volume split in two (blood side fills first), first-order absorption by drink type and zero-order elimination, fitted to the beer, wine and vodka-tonic peaks of Mitchell 2014.'),
  c('AL4', 'A', 'Divided attention is already worse at 0.2 g/L; reaction time and balance at 0.5 g/L. In Croatia the limit is 0.5 g/L for most drivers and 0.0 for young and professional drivers.', ['jongen2014', 'euCroatia']),
  c('AL5', 'A', 'Within 6 hours after 14–28 g of alcohol, pulse rises by about 5 beats and systolic blood pressure drops by about 5–6 mmHg. After more than 30 g: pulse about +6, pressure about −3.5 (Cochrane review, 32 trials).', ['tasnim2020']),
  c('AL6', 'A', 'Alcohol before bed helps you fall asleep faster at every dose studied, but disturbs the second half of the night, and the first dream (REM) sleep comes later. At moderate and high doses it also cuts total dream sleep; at low doses that effect is unclear (review of sleep-lab studies in healthy people).', ['ebrahim2013']),
  c('AL8', 'B', 'The effect grows with the dose. In 4,098 Finnish employees wearing heart monitors, the heart’s “recovery” in the first 3 hours of sleep fell by about 9, 24 and 39 percentage points after low (up to 0.25 g per kg; mostly one drink), moderate (0.25–0.75 g/kg) and high (over 0.75 g/kg) alcohol, compared with the same people’s nights without alcohol. Observational, not a trial.', ['pietila2018'], 'We use these g/kg bands to pick the wording for one drink, a few drinks or many (our mapping, C).'),
  c('AL7', 'A', 'A beer does not dehydrate you: in 72 men, 1 liter of lager gave the same urine over 4 hours as 1 liter of water. Stronger drinks (wine, spirits) were not tested.', ['maughan2016']),
  c('WK1', 'A', 'Extra water leaves through the kidneys within a few hours: after 1 liter of water, healthy men passed about 1.3 kg of urine over 4 hours.', ['maughan2016']),
].map((x) => [x.id, x]));
