// One plain sentence per stage, so the screen says one thing at a time. Each sentence rests on the claims
// listed with it; numbers that depend on the person are computed from the simulation.
import { at, type Timeline } from '../science/espressoSim';
import type { Profile } from '../science/profile';

export interface Headline { label: string; text: string; claims: string[] }

const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(Math.floor(min) % 60).padStart(2, '0')}`;

export function headline(stageMin: number, sim: Timeline, p: Profile, extraLatencyMin = 0): Headline {
  const toBed = (p.bedtimeMin - p.drinkAtMin + 1440) % 1440;
  switch (stageMin) {
    case 0: return { label: 'First sip', text: `One shot carries about ${Math.round(sim.doseMg)} mg of caffeine in 30 ml.`, claims: ['P1', 'P2', 'P3'] };
    case 1: return { label: 'Stomach', text: 'Liquid doesn’t wait: half of it leaves the stomach within about 13 minutes.', claims: ['G1', 'G2', 'F4'] };
    case 4: return { label: 'Colon', text: 'In about 1 in 3 people, coffee makes the colon contract within minutes.', claims: ['F5', 'F6', 'F7'] };
    case 10: return { label: 'Into the blood', text: 'The small intestine passes the caffeine into your blood, almost all of it.', claims: ['D1', 'D2', 'G3', 'D3', 'D4'] };
    case 30: return { label: 'Brain', text: 'It reaches the brain and blocks adenosine, the signal that makes you feel tired.', claims: ['D7', 'F1', 'F2', 'F3'] };
    case 60: return { label: 'Peak', text: `Blood level peaks around ${Math.round(sim.tmaxMin)} min. Pressure rises slightly; your pulse stays the same.`, claims: ['G3', 'V1', 'V2', 'F9', 'F8'] };
    case 180: return { label: 'Liver', text: `Your liver takes it apart: half is gone every ${sim.halfLifeH.toFixed(1)} hours.`, claims: ['M1', 'M2', 'X1', 'M4', 'M6', 'M7', 'M8', 'M9'] };
    case 420: return { label: 'Bedtime',
      text: `At ${hhmm(p.bedtimeMin)}, about ${Math.round(at(sim.body, toBed))} mg is still in your body. ` +
        (extraLatencyMin < 1 ? 'Too little to delay your sleep.' : `You may need about ${Math.round(extraLatencyMin)} min longer to fall asleep.`),
      claims: ['VS1', 'VS2', 'VS3', 'S1', 'S2', 'S3'] };
    default: return { label: 'Kidneys', text: 'Your kidneys flush out the breakdown products.', claims: ['M3', 'X1'] };
  }
}
