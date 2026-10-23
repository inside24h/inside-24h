// Claims behind the generic food model (any food from the database). IDs map to research/digestion-generic.md
// (GE/SI/CO/GL/TG/AA/TE/FC), research/alcohol.md (AL*) and research/fooddb-notes.md (DB*).
import type { Claim } from './types';
import { SOURCES } from './sources';
import foodDb from '../v4/food/fooddb.json';

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
  oshima2022: { id: 'oshima2022', cite: 'Oshima S et al. 2022, Nutrients (480 ml beer at three drinking speeds, 18 adults)', url: 'https://europepmc.org/article/PMC/PMC9653949' },
  jenkins1990: { id: 'jenkins1990', cite: 'Jenkins DJA et al. 1990, Diabetes (50 g glucose as a bolus vs sipped over 3.5 h)', url: pm('2191884') },
  maskell2020: { id: 'maskell2020', cite: 'Maskell PD, Cooper GAA 2020, J Forensic Sci', url: pm('32421216') },
  jongen2014: { id: 'jongen2014', cite: 'Jongen S et al. 2014, Psychopharmacology', url: pm('24408210') },
  tasnim2020: { id: 'tasnim2020', cite: 'Tasnim S et al. 2020, Cochrane Review', url: pm('32609894') },
  ebrahim2013: { id: 'ebrahim2013', cite: 'Ebrahim IO et al. 2013, Alcohol Clin Exp Res', url: pm('23347102') },
  pietila2018: { id: 'pietila2018', cite: 'Pietilä J et al. 2018, JMIR Ment Health (4,098 people, heart rate variability in sleep)', url: 'https://europepmc.org/article/PMC/PMC5878366' },
  maughan2016: { id: 'maughan2016', cite: 'Maughan RJ et al. 2016, Am J Clin Nutr', url: pm('26702122') },
  jonesHolmgren2003: { id: 'jonesHolmgren2003', cite: 'Jones AW, Holmgren P 2003, J Forensic Sci (693 deaths from alcohol poisoning)', url: pm('12877310') },
  niaaaOverdose: { id: 'niaaaOverdose', cite: 'NIAAA: Understanding the dangers of alcohol overdose', url: 'https://www.niaaa.nih.gov/publications/brochures-and-fact-sheets/understanding-dangers-of-alcohol-overdose' },
  siler1998: { id: 'siler1998', cite: 'Siler SQ et al. 1998, Am J Physiol (alcohol and gluconeogenesis)', url: pm('9815011') },
  looi2025: { id: 'looi2025', cite: 'Looi E, Lawler HM 2025, J Clin Med (review: hypoglycemia without diabetes)', url: 'https://europepmc.org/article/PMC/PMC12250112' },
  turner2001: { id: 'turner2001', cite: 'Turner BC et al. 2001, Diabetes Care (evening wine, next-morning glucose, type 1 diabetes)', url: pm('11679452') },
  holt2021: { id: 'holt2021', cite: 'Holt RIG et al. 2021, ADA/EASD consensus on type 1 diabetes', url: 'https://europepmc.org/article/PMC/PMC8481000' },
  alford2020: { id: 'alford2020', cite: 'Alford C et al. 2020, J Clin Med (hangover and simulated driving, 52 people)', url: 'https://europepmc.org/article/PMC/PMC7291334' },
  polhuis2017: { id: 'polhuis2017', cite: 'Polhuis KCMM et al. 2017, Nutrients (urine after beer, wine and spirits)', url: 'https://europepmc.org/article/PMC/PMC5537780' },
  usdaSpirits: { id: 'usdaSpirits', cite: 'USDA FoodData Central SR Legacy 174815 (distilled spirits, 80 proof: 0 g carbohydrate) and 175097 (coffee liqueur: 46.8 g per 100 g)', url: 'https://fdc.nal.usda.gov/food-details/174815/nutrients' },
  euCroatia: { id: 'euCroatia', cite: 'European Commission, Your Europe: Croatia road rules', url: 'https://europa.eu/youreurope/citizens/travel/driving-abroad/road-rules-and-safety/croatia/index_en.htm' },
  mudie2014: { id: 'mudie2014', cite: 'Mudie DM et al. 2014, Mol Pharm (MRI)', url: pm('25115349') },
  padberg2026: { id: 'padberg2026', cite: 'Padberg J et al. 2026, Sci Rep (MR lymphangiography after high-fat, fat-free and MCT meals, n=22)', url: pm('42481617') },
  wilson2025: { id: 'wilson2025', cite: 'Wilson ML et al. 2025, Nutr Rev (systematic review, 16 trials)', url: 'https://europepmc.org/article/PMC/PMC11819491' },
};

// one shared source list for the evidence drawer (existing entries win)
for (const [k, s] of Object.entries(FOOD_SOURCES)) if (!SOURCES[k]) SOURCES[k] = s;

const c = (id: string, level: Claim['level'], text: string, sources: string[], method?: string): Claim => ({ id, level, text, sources, method, verified: true });

// Values that are NOT from USDA (research/tools/fooddb_spec.py OVERRIDES): one claim per override, with its own source,
// generated from the database so the text, level and citation can never drift from the numbers.
type SrcRow = { fields: string[]; level: 'A' | 'B' | 'C'; text: string; cite: string; url: string };
const SOURCE_CLAIM_IDS: Record<string, string[]> = {};
const SOURCE_CLAIMS: Claim[] = (foodDb as { id: string; src?: SrcRow[] }[]).flatMap((f) => (f.src ?? []).map((s, i) => {
  const id = `DBO-${f.id}-${i}`, sid = `label-${f.id}-${i}`;
  if (!SOURCES[sid]) SOURCES[sid] = { id: sid, cite: s.cite, url: s.url };
  (SOURCE_CLAIM_IDS[f.id] ??= []).push(id);
  return c(id, s.level, s.text, [sid], s.level === 'C' ? 'Our calculation from the labels named in the source (research/tools/fooddb_spec.py OVERRIDES).' : undefined);
}));

// Variants, builder parts, add-ins and sizes (2026-10-18, research/tools/build_variants.py): each source row carries its
// own claim id (DBV-, DBB-, DBA-, DBS-); a variant's own label rows are DBO-<id>.<v>-<i>. Registered once here.
type RowC = SrcRow & { claim?: string };
type DbFood = { id: string; variants?: { src: RowC[] }[]; builder?: { src: RowC[]; groups: { opts: { src: RowC[] }[] }[] }; addins?: { src: RowC[] }[]; sizes?: { src: RowC[] } };
const CHOICE_CLAIMS: Claim[] = [];
const seenChoice = new Set<string>();
for (const f of foodDb as unknown as DbFood[]) {
  const rows: RowC[] = [...(f.variants ?? []).flatMap((v) => v.src), ...(f.builder?.src ?? []), ...(f.builder?.groups ?? []).flatMap((g) => g.opts.flatMap((o) => o.src)),
    ...(f.addins ?? []).flatMap((a) => a.src), ...(f.sizes?.src ?? [])];
  for (const s of rows) {
    if (!s.claim || seenChoice.has(s.claim) || /^DBO-[a-z0-9-]+-\d+$/.test(s.claim)) continue; // base label rows: SOURCE_CLAIMS
    seenChoice.add(s.claim);
    const sid = `src-${s.claim}`;
    if (!SOURCES[sid]) SOURCES[sid] = { id: sid, cite: s.cite, url: s.url };
    CHOICE_CLAIMS.push(c(s.claim, s.level, s.text, [sid], s.level === 'C' ? 'Our recipe or estimate from the sources named (research/tools/fooddb_spec.py, section VARIANTS).' : undefined));
  }
}

export const FOOD_CLAIMS: Record<string, Claim> = Object.fromEntries([
  c('DB1', 'A', 'Calories, carbohydrate, sugar, fiber, fat, protein, water, caffeine and alcohol per 100 g come from the USDA SR Legacy database, unless a statement here names a product label instead. Portion sizes like “1 medium apple” are USDA portion weights.', ['usdaSR']),
  c('DB2', 'C', 'Household amounts we had to assume: glass 250 ml, cup 200 ml, can 330 ml (beer 500 ml, the usual Croatian can), bottle 500 ml (wine 750 ml), tablespoon 15 ml, teaspoon 5 ml. Mixed drinks (coffee with milk, cappuccino, latte) are our own recipes from USDA ingredients.', ['usdaSR'], 'Typical European serving sizes; marked “assumed” on screen.'),
  c('DB3', 'A', 'Glycemic index values are from the international GI tables (Atkinson 2008: Table 1, and single tests in healthy people from Supplementary Tables A1 and A2). Foods without a measured GI show no sugar curve rather than a guess.', ['atkinson2008']),
  c('GE1', 'A', 'A normal solid meal: about 69% is still in the stomach after 1 hour, 24% after 2 hours and about 1% after 4 hours (123 healthy adults). More than 10% left at 4 hours counts as delayed.', ['tougas2000']),
  c('GE4', 'B', 'Half of a 255 kcal solid meal leaves the stomach in about 94 minutes; smaller meals in about 67 minutes, but never much faster than about an hour.', ['parkman2025']),
  c('GE5', 'C', 'Our solid-food curve: retention = exp(−(t/τ)^1.8), half-time 94 × √(kcal/255) min, at least 65 and at most 210 min (the slowest big meals measured by MRI). It reproduces the 69/24/1% data within a few points.', ['tougas2000', 'parkman2025', 'farivar2026'], 'Power-exponential fit to GE1 with GE4 scaling by meal energy.'),
  c('GE12', 'C', 'Drinks with calories leave more slowly than water. Our line: half-time ≈ 13 + 0.11 × kcal minutes. Measured by MRI: water 13 min, a 100 kcal shake 26.5 min, a 500 kcal shake 69.5 min.', ['mudie2014', 'camps2016'], 'Straight line through the MRI measurements.'),
  c('GE13', 'B', 'Fiber slows the stomach: 20 g instead of 4 g fiber per 1000 kcal made emptying about 25% longer.', ['benini1995']),
  c('GE15', 'B', 'Fat leaves the stomach last: the gut senses digested fat and slows the stomach down.', ['cortot1982']),
  c('GE19', 'B', 'Alcohol slows the stomach, even though its calories don’t count the way food calories do. On an empty stomach, half of 500 ml of water left in about 15 minutes, of plain alcohol solutions (4–40%) in 23–28 minutes, of beer in 39 and of red wine in 73 minutes; whisky behaved like plain alcohol (10 people). With a solid meal, alcohol, beer and red wine made the meal leave 20–40% later. One study found no effect of wine with a meal.', ['franke2004', 'franke2005', 'okabe2022', 'stevens2022'], 'Our model (C): drink half-time = (13 + 0.11 × non-alcohol kcal + 10 min) × 1.25 for beer-like and × 2.5 for wine-like drinks (measured for red wine only); food in the same meal × 1.2 (wine × 1.4). By a different method (scintigraphy, 600 ml) beer took 75–89 min. This changes how fast the drink’s water, sugar and caffeine arrive, not the blood alcohol, which is fitted directly to measured curves (AL1).'),
  c('SI11', 'B', 'Fat takes a different road from sugar: it travels in the lymph. After a high-fat meal the main lymph duct in the chest (thoracic duct) widened, most at about 5 hours, but not after a fat-free meal or one with medium-chain fat (22 adults, MRI). Sugars and amino acids go through the portal vein to the liver first.', ['padberg2026']),
  c('SI10', 'A', 'Fiber is not digested in the small intestine: all of it reaches the large intestine, where bacteria ferment part of it.', ['englyst1986', 'cummings1987']),
  c('SI7', 'C', 'Leftovers of a solid meal reach the start of the large intestine about 5–8 hours after eating. In healthy people a swallowed capsule takes about 3.3–7 hours through the small intestine (22 studies); we use about 4 hours.', ['tougas2000', 'nandhra2023', 'metcalf1987'], 'Gastric half-time plus about 4 hours of small-bowel transit (inside the 3.3–7 h capsule range).'),
  c('CO1', 'A', 'From eating to the toilet: median 28.7 hours (normal 14–58 h, 863 healthy adults). Only about 1 in 3 people pass the first part of a meal within 24 hours.', ['asnicar2021']),
  c('CO3', 'A', 'The large intestine takes about 35 hours in total: right side 11 h, left side 11 h, last part 12 h. Men are a little faster than women.', ['metcalf1987']),
  c('GL1', 'A', 'The glycemic index predicts how high blood sugar peaks (correlation 0.76 across 1,126 foods), and the glycemic load (GI × carbohydrate) predicts the size of the response in healthy people.', ['brandmiller2009', 'brandmiller2003']),
  c('GL4', 'C', 'Our sugar curve: peak = 3.14 × (1 − e^(−GL/16)) mmol/L, anchored on a can of cola (+2.3) and a 50 g glucose drink (≈ +3); solid food at 80%, semi-solid at 90%. Solid food peaks later (about 50–70 min). Real people differ a lot: the range we show (±40%) covers about two in three people.', ['brandmiller2003', 'calvo2025', 'berry2020'], 'Two-point saturating fit; peak timing from CGM in 514 adults.'),
  c('GL11', 'B', 'The same sugar spread out gives a flatter curve: 50 g of glucose sipped over 3.5 hours instead of drunk in 5–10 minutes gave a similar total glucose response but about half the insulin (9 healthy people).', ['jenkins1990'], 'Our model (C): each round is a smaller serving with its own curve, added up; never higher than having it all at once, because the stomach lets sugar out at its own pace.'),
  c('GL7', 'A', 'After a sugary drink on its own, blood sugar can dip a little below where it started 1–3 hours later. In 1,070 people wearing glucose sensors, bigger dips 2–3 hours after a meal went with more hunger and eating sooner.', ['kim2025', 'wyatt2021']),
  c('TG1', 'B', 'In 35 adults with overweight, a breakfast with 50 g of fat raised blood fat (triglycerides) by a median 0.8 mmol/L, with big differences between people. Across trials blood fat is clearly raised about 3 hours after a fatty meal and falls again after about 5 hours. We scale the rise with the fat in your food.', ['wilson2021', 'wilson2025'], 'Rise = 0.77 mmol/L × fat g / 50, capped at 1.2; peak at 3.5 h (our estimate, C).'),
  c('AA1', 'B', 'Protein from a real meal shows up in the blood as amino acids, peaking 2–3 hours after eating.', ['pham2022']),
  c('TE1', 'A', 'Processing food costs energy (absorbing it, then using or storing it): about 20–30% of protein calories, 5–10% of carbohydrate calories and 0–3% of fat calories.', ['tappy1996']),
  c('FC1', 'B', 'Feeling sleepy after a big meal is real: sleepiness rises about 1.5 hours after eating, whatever the meal is made of.', ['wells1998']),
  c('AL1', 'A', 'Same alcohol, different drink (15 fasted men, 0.5 g per kg): the peak was about 0.50 g/L at 1 hour after beer, 0.62 g/L at 54 min after wine and 0.77 g/L at 36 min after vodka-tonic; 7 of 15 men passed 0.8 g/L on vodka-tonic. Food lowers and delays the peak.', ['mitchell2014']),
  c('AL2', 'A', 'Your liver removes alcohol at a fixed speed: about 0.10–0.15 g/L per hour fasted, 0.15–0.20 after food. Coffee or water does not speed it up.', ['jones2010']),
  c('AL3', 'C', 'Blood alcohol = alcohol absorbed ÷ (Widmark factor × body weight); the factor comes from your BMI and sex. Real values differ by ±20–40% or more, so we show −40% to +50%: never use this to decide whether to drive.', ['searle2015', 'maskell2020', 'mitchell2014'], 'Widmark volume split in two (blood side fills first), first-order absorption by drink type and zero-order elimination, fitted to the beer, wine and vodka-tonic peaks of Mitchell 2014.'),
  c('AL4', 'A', 'Divided attention is already worse at 0.2 g/L; reaction time and balance at 0.5 g/L. In Croatia the limit is 0.5 g/L for most drivers and 0.0 for young and professional drivers.', ['jongen2014', 'euCroatia']),
  c('AL5', 'A', 'Within 6 hours after 14–28 g of alcohol, pulse rises by about 5 beats and systolic blood pressure drops by about 5–6 mmHg. After more than 30 g: pulse about +6, pressure about −3.5 (Cochrane review, 32 trials).', ['tasnim2020']),
  c('AL6', 'A', 'Alcohol before bed helps you fall asleep faster at every dose studied, but disturbs the second half of the night, and the first dream (REM) sleep comes later. At moderate and high doses it also cuts total dream sleep; at low doses that effect is unclear (review of sleep-lab studies in healthy people).', ['ebrahim2013']),
  c('AL8', 'B', 'The effect grows with the dose. In 4,098 Finnish employees wearing heart monitors, the heart’s “recovery” in the first 3 hours of sleep fell by about 9, 24 and 39 percentage points after low (up to 0.25 g per kg; mostly one drink), moderate (0.25–0.75 g/kg) and high (over 0.75 g/kg) alcohol, compared with the same people’s nights without alcohol. Observational, not a trial.', ['pietila2018'], 'We use these g/kg bands to pick the wording for one drink, a few drinks or many (our mapping, C).'),
  c('AL7', 'A', 'A beer does not dehydrate you: in 72 men, 1 liter of lager gave the same urine over 4 hours as 1 liter of water. Stronger drinks (wine, spirits) were not tested.', ['maughan2016']),
  c('AL9', 'A', 'Danger zone: in 693 people who died of acute alcohol poisoning, blood alcohol was 2.2–5.0 ‰ in 9 of 10 (median 3.6 ‰). Signs of an overdose: you can’t wake the person, slow or irregular breathing, vomiting, seizures, very cold, pale or bluish skin. Call the emergency number (112 in Europe). Blood alcohol can keep rising after drinking stops.', ['jonesHolmgren2003', 'niaaaOverdose']),
  c('AL10', 'B', 'Alcohol and blood sugar: alcohol has no sugar curve of its own, but it slows the liver’s production of new sugar (by 45% for 5 hours after 48 g in men who had fasted overnight). In healthy people who have eaten, blood sugar stays normal because the liver uses its sugar stores; low blood sugar from alcohol mostly happens after a long fast, heavy drinking, or with insulin or diabetes tablets.', ['siler1998', 'looi2025', 'holt2021'], 'Mechanism A (Siler 1998, tracer study); who is at risk from a review (Looi 2025) and the ADA/EASD consensus. Not drawn as a curve.'),
  c('AL11', 'B', 'With diabetes the dip can come the next morning: 6 men with type 1 diabetes drank dry white wine at 21:00 (0.75 g of alcohol per kg, about 4 glasses for 70 kg); the next morning 5 of 6 needed treatment for low blood sugar after breakfast. None did after water.', ['turner2001']),
  c('AL12', 'B', 'The morning after: in 52 social drinkers, half still had alcohol on a breath test in the morning, and in a driving simulator both groups, with or without alcohol left, drove worse than after a night without alcohol.', ['alford2020']),
  c('AL13', 'B', 'Water from alcoholic drinks: with 30 g of alcohol, beer gave no more urine than alcohol-free beer, while wine and spirits gave a little more for 4 hours and no difference over 24 hours (older men). Larger amounts were not tested.', ['polhuis2017', 'maughan2016']),
  c('AL14', 'C', 'Unless you pick “Over how long?”, we assume you drink everything at once (the highest peak). Spread over an evening, the peak is lower, but because the liver works at a fixed speed, the alcohol is gone at about the same time, counted from the first drink.', ['jones2010'], 'Follows from zero-order elimination (AL2) as long as some alcohol stays in the blood between drinks.'),
  c('AL15', 'A', 'Plain distilled spirits (rakija, vodka, whisky at 40%) have no carbohydrate or sugar; all their calories come from the alcohol. Sweet liqueurs and honey brandy (medica) are different: a coffee liqueur has about 47 g of carbohydrate per 100 g.', ['usdaSpirits']),
  c('AL16', 'B', 'Spread out, the peak is lower but the end barely moves. Drinking the same beer more slowly gave a lower blood alcohol rise, and by 150 min the levels were alike (Oshima 2022). The Widmark formula counts the liver at full speed from the start of drinking, so the time until it is gone depends on how much you drank, not how fast (unless the drinks are so far apart that the blood is clear in between).', ['oshima2022', 'searle2015', 'jones2010'], 'Our model: the drinks as equal rounds, one every (time ÷ number) minutes, each absorbed like one drink; one liver at a fixed speed for all of them. Check (70 kg man, 5 beers): all at once peak ≈ 1.6 ‰, over 3 h ≈ 1.35 ‰ (Widmark: 1.70 − 0.12 × 3.2 h), gone after ≈ 14.1 h either way (1.70 ÷ 0.12).'),
  c('AL17', 'B', 'Alcohol is absorbed through the stomach wall and, faster, in the small intestine; from there the blood goes to the liver first, which removes a little of it before it reaches the rest of the body.', ['mumenthaler1999']),
  c('WK2', 'B', 'Coffee and tea count as water: in 50 men who drink coffee daily, 4 cups a day gave the same body water and 24-hour urine as water. Only large doses of caffeine make you pee more for a few hours: 6 mg per kg (≈ 540 mg) did, 3 mg per kg did not, and effects fade in people who have caffeine every day.', ['killer2014', 'seal2017', 'maughanGriffin2003', 'maughan2016']),
  c('WK1', 'A', 'Extra water leaves through the kidneys within a few hours: after 1 liter of water, healthy men passed about 1.3 kg of urine over 4 hours.', ['maughan2016']),
  ...SOURCE_CLAIMS,
  ...CHOICE_CLAIMS,
].map((x) => [x.id, x]));

/** "How do we know?" for this food's non-USDA values (label overrides), e.g. ['DBO-cola-0']. */
export const foodSourceClaims = (foodId: string): string[] => SOURCE_CLAIM_IDS[foodId] ?? [];
