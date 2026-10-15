// "If you have this every day" — from research/long-term.md (IDs in brackets).
// pct = relative change used only to draw the bar (+ = worse for health, − = better); null = no bar.
import type { Level } from './types';

export type Kind = 'trial' | 'association' | 'estimate' | 'guideline';
export interface LongTermItem {
  marker: string; effect: string; detail: string; kind: Kind; level: Level;
  pct: number | null; better?: boolean; share?: number; sources: string[]; method?: string;
}

export const LONG_TERM: Record<string, { intro: string; items: LongTermItem[] }> = {
  espresso: {
    intro: 'One espresso a day, for months or years. Almost no long-term study used a single shot, so most numbers here are scaled down from bigger doses.',
    items: [
      { marker: 'Cholesterol (total and LDL)', effect: '≈ +0.8 mg/dL', detail: 'Espresso contains a little cafestol, which raises cholesterol. One shot is too little to show on a lab test. With 3 shots a day: about +2.5 mg/dL. Boiled or French-press coffee has about 20× more.', kind: 'estimate', level: 'C', pct: 0.4, sources: ['svatun2022', 'weusten1994'], method: '[E3–E5] 30 ml × 54 mg/L cafestol = 1.6 mg; trials show +0.13 mmol/L per 10 mg → +0.02 mmol/L ≈ +0.8 mg/dL. Assumes a straight-line dose response.' },
      { marker: 'Triglycerides', effect: '≈ no change', detail: 'Large amounts of unfiltered coffee raised them by 26% at first, then they went back to normal within 6 months.', kind: 'trial', level: 'B', pct: 0, sources: ['urgert1996'] },
      { marker: 'Type 2 diabetes', effect: 'lower risk', detail: 'Coffee drinkers get type 2 diabetes less often: about 8% less per daily cup. A shot is smaller than a cup, so we give no exact number. This is a link seen in 1.1 million people, not proof of cause.', kind: 'association', level: 'A', pct: -8, better: true, sources: ['ding2014'] },
      { marker: 'Blood pressure', effect: 'at most +0.6 mmHg', detail: 'Daily caffeine trials raised pressure slightly; half of people stop reacting after a few days. Large studies find no higher risk of high blood pressure in coffee drinkers.', kind: 'estimate', level: 'C', pct: 0.5, sources: ['noordzij2005', 'lovallo2004'], method: '[E19] 4.16 mmHg at 410 mg/day × 63/410 = +0.6 mmHg. Upper bound: assumes no tolerance.' },
      { marker: 'Risk of dying early', effect: '−17% at 3–4 cups', detail: 'People drinking 3–4 cups a day died less often over the years studied. It is a link, not proof; one shot is far less coffee.', kind: 'association', level: 'B', pct: -17, better: true, sources: ['poole2017'] },
      { marker: 'Pregnancy', effect: '32% of the daily limit', detail: 'EFSA’s limit in pregnancy is 200 mg caffeine a day. One shot uses 32% of it; three shots use 95%.', kind: 'guideline', level: 'A', pct: null, share: 0.32, sources: ['efsa2015'] },
    ],
  },
  cola: {
    intro: 'One can a day, for months or years. The trials mostly used bigger amounts (often 1 litre a day), so the one-can numbers are scaled down and marked as estimates.',
    items: [
      { marker: 'Fat in the liver', effect: 'up to ≈ +45%', detail: 'A litre of cola a day for 6 months more than doubled liver fat compared with milk, diet cola or water. Scaled to one can that is roughly +45%.', kind: 'estimate', level: 'C', pct: 45, sources: ['maersk2012'], method: '[C1, C2] +132–143% at 1 L/day × 0.33 (one can) ≈ +44–47%. Small-dose effect not measured directly.' },
      { marker: 'Type 2 diabetes', effect: '+13–18% risk', detail: 'Each daily sugary drink was linked to 13–18% more type 2 diabetes. That is about 1 extra case per 100 people over 10 years.', kind: 'association', level: 'A', pct: 18, sources: ['imamura2015'], method: '[C10] 10-year risk 5.8–11.0% × 0.13 = +0.75 to +1.4 percentage points.' },
      { marker: 'Triglycerides (blood fat)', effect: '≈ +10%', detail: 'Rose 32% with a litre a day for 6 months; higher-sugar diets raise them about 10 mg/dL on average.', kind: 'estimate', level: 'C', pct: 10, sources: ['maersk2012', 'temorenga2014'], method: '32% × 0.33 ≈ +10%.' },
      { marker: 'Cholesterol (total and LDL)', effect: '≈ +3.6%', detail: 'Total cholesterol rose 11% on a litre a day. High-sugar diets raised LDL by about 4.6 mg/dL. HDL barely changed.', kind: 'estimate', level: 'C', pct: 3.6, sources: ['maersk2012', 'temorenga2014'], method: '11% × 0.33 ≈ +3.6%.' },
      { marker: 'High blood pressure', effect: '+8% risk', detail: 'Each daily sugary drink was linked to 8% more high blood pressure.', kind: 'association', level: 'B', pct: 8, sources: ['xi2015'] },
      { marker: 'Body weight', effect: '+0.6–1.1 kg in 5 years', detail: 'Each daily serving was linked to 0.12–0.22 kg more per year. Calories from drinks are not fully made up for by eating less.', kind: 'estimate', level: 'C', pct: 1.4, sources: ['malik2013'], method: '0.12–0.22 kg/year × 5 years.' },
      { marker: 'Gout (men)', effect: '+45% risk', detail: 'Men drinking one sugary soft drink a day had 45% more gout over 12 years. Diet soft drinks showed no link.', kind: 'association', level: 'B', pct: 45, sources: ['choi2008'] },
      { marker: 'Bones (women)', effect: '−3.7% hip density', detail: 'Women drinking cola daily had lower hip bone density. Diet cola showed the same, so the sugar is not the cause; drinking less milk may be.', kind: 'association', level: 'B', pct: 3.7, sources: ['tucker2006'] },
      { marker: 'Risk of dying early', effect: '≈ +9%', detail: 'Each daily 250 ml of sugary drinks was linked to 7% higher risk; for a 330 ml can that is about 9%.', kind: 'estimate', level: 'C', pct: 9, sources: ['wang2022'], method: '1.07^(330/250) = 1.09.' },
    ],
  },
};

export const KIND_LABEL: Record<Kind, string> = { trial: 'Trial', association: 'Link, not proof', estimate: 'Our estimate', guideline: 'Official limit' };
