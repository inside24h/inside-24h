// Claims behind MEALS (several things eaten together). IDs map to research/meals.md (ML*).
import type { Claim } from './types';

const c = (id: string, level: Claim['level'], text: string, sources: string[], method?: string): Claim => ({ id, level, text, sources, method, verified: true });

export const MEAL_CLAIMS: Record<string, Claim> = Object.fromEntries([
  c('ML1', 'B', 'In a meal of food and drink, the drink leaves the stomach first and the food waits in the upper stomach. More food, or a sugary drink, slows the drink down and makes the food wait longer.', ['collins1983', 'collins1991', 'collins1996']),
  c('ML2', 'B', 'A drink taken with a meal: half of it has left the stomach after about 18 minutes (11–35 in healthy people), versus about 13 minutes for water on an empty stomach.', ['maddern1985']),
  c('ML3', 'C', 'Our meal rule: a drink with food leaves 1.5× slower with a small meal (≈ 250 kcal) and about 2× slower with 500 kcal or more, so its sugar peaks a bit lower and its caffeine later. Measured: caffeine peaked at 65–69 min after a 500 or 1000 kcal meal versus 29 min fasted, with the same total amount absorbed.', ['wildgrube2026', 'maddern1985'], 'Linear fit through the two measured points (×1.4 at a ≈ 250 kcal test meal, ×2.2 at 500–1000 kcal), capped at ×2.'),
  c('ML4', 'B', 'Plain water drunk after a meal still runs out of the stomach in about 20 minutes, along the stomach wall.', ['grossmann2025']),
  c('ML5', 'B', 'Protein and fat eaten with carbohydrate lower its blood-sugar response, step by step with the amount: adding protein to potato, pasta or rice cut the response by 0–29%; protein has 2–3 times the effect of fat per gram.', ['moghaddam2006', 'wolever2017', 'mishra2026']),
  c('ML6', 'B', 'Big real meals take longer: half of a 440 kcal high-carb meal had left the stomach after 132 min, a 730 kcal high-protein meal after 158 min and a ≈ 1300 kcal high-fat meal after 188 min (MRI, 15 healthy adults).', ['farivar2026']),
  c('ML7', 'C', 'Our meal sugar curve: each item that has sugar or starch gets its own curve, at the speed of its own phase, shrunk by the protein and fat of the other items; the curves are added. One food alone gives exactly the single-food curve.', ['moghaddam2006', 'wolever2017', 'brandmiller2003'], 'Per gram added to 50 g carbohydrate: protein −0.57%, fat −0.23%, at most −35%. Real people differ by ±50% or more.'),
].map((x) => [x.id, x]));
