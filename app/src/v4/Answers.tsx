// Quick answers: the everyday questions people actually have, answered in a few words from the same model.
// Sugar · Sleep · Driving (alcohol only) · Hunger (after a dip) · Energy as walking minutes.
import type { System } from './status';
import { at } from '../science/espressoSim';

export interface AnswerInput {
  systems: System[]; drinkAt: number; bedtimeMin: number; weightKg: number;
  kcal: number; glucoseDeltaMgDl?: Float64Array; extraSleepMin: number; caffeineAtBedMg: number;
  bac?: Float64Array; waterMl: number;
  /** latest clock minute to have it without delaying sleep (caffeine), if any */
  latestForSleep?: number | null;
}
interface Answer { icon: string; q: string; a: string; tone: 0 | 1 | 2 }

const hh = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m) % 60).padStart(2, '0')}`;

export function quickAnswers(x: AnswerInput): Answer[] {
  const out: Answer[] = [];
  const at0 = (m: number) => hh(x.drinkAt + m);
  // Sugar
  const g = x.glucoseDeltaMgDl;
  if (g) {
    let peak = 0, peakAt = 0, low = 0, lowAt = 0, backAt = -1;
    for (let m = 0; m < Math.min(g.length, 600); m++) { if (g[m] > peak) { peak = g[m]; peakAt = m; } if (g[m] < low) { low = g[m]; lowAt = m; } }
    for (let m = peakAt; m < Math.min(g.length, 600); m++) if (g[m] < 0.15 * peak) { backAt = m; break; }
    const mmol = peak / 18.016;
    if (mmol < 0.3) out.push({ icon: '⚡', q: 'Will my blood sugar jump?', a: 'No, it stays steady.', tone: 0 });
    else out.push({ icon: '⚡', q: 'Will my blood sugar jump?', a: `${mmol >= 1.5 ? 'Yes' : 'A little'}: +${mmol.toFixed(1)} mmol/L at ${at0(peakAt)}${backAt > 0 ? `, normal again by ${at0(backAt)}` : ''}.`, tone: mmol >= 1.5 ? 1 : 0 });
    if (low / 18.016 <= -0.3) out.push({ icon: '🍽️', q: 'Will I get hungry again soon?', a: `Likely around ${at0(lowAt)}: sugar dips below where you started.`, tone: 1 });
  } else out.push({ icon: '⚡', q: 'Will my blood sugar jump?', a: x.bac
    ? 'Hard to say: alcohol changes how your liver handles sugar, so we don’t draw a curve.'
    : 'Not known: its glycaemic index has not been measured.', tone: 0 });
  // Sleep
  const bedRel = (x.bedtimeMin - x.drinkAt + 1440) % 1440;
  const bacBed = x.bac ? at(x.bac, bedRel) : 0;
  if (bacBed > 0.02) out.push({ icon: '🌙', q: 'Will I sleep well?', a: `Not as well: alcohol is still in your blood at ${hh(x.bedtimeMin)}, so the second half of the night is lighter.`, tone: 1 });
  else if (x.extraSleepMin >= 5) out.push({ icon: '🌙', q: 'Will I sleep well?', a: `About ${Math.round(x.extraSleepMin)} min longer to fall asleep (${Math.round(x.caffeineAtBedMg)} mg caffeine left at ${hh(x.bedtimeMin)}).`, tone: 1 });
  else out.push({ icon: '🌙', q: 'Will I sleep well?', a: x.caffeineAtBedMg >= 10 ? `Yes. ${Math.round(x.caffeineAtBedMg)} mg caffeine left at ${hh(x.bedtimeMin)} is too little to matter.` : 'Yes, no effect on your sleep.', tone: 0 });
  // Best time (caffeine): the latest time that leaves sleep untouched
  if (x.latestForSleep !== undefined && x.latestForSleep !== null) {
    const late = x.drinkAt > x.latestForSleep && x.drinkAt < x.bedtimeMin;
    if (x.bedtimeMin - x.latestForSleep <= 30) out.push({ icon: '⏰', q: 'When is the best time?', a: 'Any time today: this little caffeine won’t delay your sleep.', tone: 0 });
    else out.push({ icon: '⏰', q: 'When is the best time?', a: `Before ${hh(x.latestForSleep)}: then the caffeine won't delay your sleep at ${hh(x.bedtimeMin)}.${late ? ' You had it later than that.' : ''}`, tone: late ? 1 : 0 });
  }
  // Driving
  if (x.bac) {
    let peak = 0, zero = -1, under05 = -1;
    for (let m = 0; m < x.bac.length; m++) peak = Math.max(peak, x.bac[m]);
    for (let m = x.bac.indexOf(peak); m < x.bac.length; m++) { if (under05 < 0 && x.bac[m] < 0.5) under05 = m; if (x.bac[m] <= 0.005) { zero = m; break; } }
    out.push({ icon: '🚗', q: 'Can I drive?', a: peak >= 0.5
      ? `No. Over the 0.5 ‰ limit until about ${at0(under05)}; back to 0.0 at ${at0(zero)}. Estimate ±30%: don't rely on it.`
      : `Best not until ${at0(zero)} (back to 0.0 ‰). Young and professional drivers must have 0.0. Estimate ±30%.`, tone: peak >= 0.5 ? 2 : 1 });
  }
  // Energy as walking (Compendium of Physical Activities: walking ~5 km/h ≈ 3.5 MET; kcal/min = MET × 3.5 × kg / 200)
  if (x.kcal >= 5) {
    const perMin = (3.5 * 3.5 * x.weightKg) / 200;
    const min = Math.round(x.kcal / perMin);
    out.push({ icon: '🚶', q: 'How much energy is that?', a: `${Math.round(x.kcal)} kcal ≈ ${min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`} of brisk walking for you.`, tone: 0 });
  } else out.push({ icon: '🚶', q: 'How much energy is that?', a: 'Almost none.', tone: 0 });
  if (x.waterMl >= 100) out.push({ icon: '💧', q: 'Does it count as water?', a: `Yes: about ${Math.round(x.waterMl)} ml of water for your body.`, tone: 0 });
  return out;
}

const TONE = ['#3ddc84', '#ffc83d', '#ff5a5a'];
export function Answers({ list }: { list: Answer[] }) {
  return (
    <div className="answers" aria-label="Quick answers">
      <div className="ctl">Quick answers</div>
      {list.map((x) => (
        <div key={x.q} className="ans" style={{ ['--t' as string]: TONE[x.tone] }}>
          <span className="ai" aria-hidden="true">{x.icon}</span>
          <span><b>{x.q}</b><em>{x.a}</em></span>
        </div>
      ))}
    </div>
  );
}
