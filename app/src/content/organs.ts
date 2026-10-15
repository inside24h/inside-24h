// What the info card says when an organ is clicked. Amounts come from the simulation; prose cites claim IDs.
import volumesJson from '../assets/organ-volumes.json';
import { at, type Timeline } from '../science/espressoSim';

const VOL = volumesJson as Record<string, number>;
const WATER = 0.75; // share of an organ's volume that is water: rough estimate (level C)

export interface OrganInfo { name: string; lines: { label: string; value: string }[]; text: string; claims: string[] }

const mg = (v: number) => (v < 0.1 ? '< 0.1 mg' : `${v < 10 ? v.toFixed(1) : v.toFixed(0)} mg`);
const inTissue = (sim: Timeline, m: number, key: string) => at(sim.conc, m) * VOL[key] * WATER;

export function organInfo(key: string, sim: Timeline, m: number): OrganInfo | null {
  const gut = at(sim.intestine, m), body = at(sim.body, m);
  const gone = at(sim.metabolites, m) + at(sim.cleared, m);
  switch (key) {
    case 'tongue': case 'esophagus':
      return { name: key === 'tongue' ? 'Tongue' : 'Esophagus', lines: [], claims: ['P1'],
        text: 'The shot passes through in seconds on its way to the stomach.' };
    case 'stomach':
      return { name: 'Stomach', claims: ['G1', 'G2', 'F4'], text: 'Liquid leaves the stomach fast: half of it within about 13 minutes.',
        lines: [{ label: 'Espresso still here', value: `${at(sim.stomachMl, m).toFixed(1)} ml` }, { label: 'Caffeine here', value: mg(at(sim.stomach, m)) }] };
    case 'duodenum': case 'jejunum': case 'ileum':
      return { name: { duodenum: 'Duodenum', jejunum: 'Jejunum', ileum: 'Ileum' }[key]!, claims: ['D1', 'G3'],
        text: 'The small intestine absorbs the caffeine into the blood. It is gone from here within about an hour.',
        lines: [{ label: 'Caffeine in the whole small intestine', value: mg(gut) }] };
    case 'portal_vein':
      return { name: 'Hepatic portal vein', claims: ['D1'], text: 'Blood from the intestine passes through this vein to the liver before reaching the rest of the body. For caffeine the liver removes almost nothing on this first pass.',
        lines: [{ label: 'Caffeine still to absorb', value: mg(gut + at(sim.stomach, m)) }] };
    case 'liver': case 'gallbladder':
      return { name: 'Liver', claims: ['M1', 'M2', 'M4', 'X1'], text: 'The liver breaks caffeine down, mostly into paraxanthine. This is what sets how long the caffeine lasts.',
        lines: [{ label: 'Caffeine in liver tissue now', value: `≈ ${mg(inTissue(sim, m, 'liver'))}` }, { label: 'Broken down so far', value: mg(gone) }, { label: 'Half-life for this person', value: `${sim.halfLifeH.toFixed(1)} h` }] };
    case 'brain':
      return { name: 'Brain', claims: ['D7', 'F1', 'F2', 'F3', 'S1'], text: 'Caffeine blocks adenosine, the signal that builds up tiredness. Brain levels follow blood levels.',
        lines: [{ label: 'Caffeine in the brain now', value: `≈ ${mg(inTissue(sim, m, 'brain'))}` }, { label: 'Blood level', value: `${at(sim.conc, m).toFixed(2)} mg/L` }] };
    case 'heart': case 'aorta': case 'vena_cava':
      return { name: { heart: 'Heart', aorta: 'Aorta', vena_cava: 'Inferior vena cava' }[key]!, claims: ['V1', 'V2', 'F9'],
        text: 'Blood carries caffeine to every tissue. At this dose resting heart rate does not change; blood pressure rises a little.',
        lines: [{ label: 'Blood level', value: `${at(sim.conc, m).toFixed(2)} mg/L` }, { label: 'Systolic change', value: `+${(at(sim.sbp, m) - sim.sbp[0]).toFixed(1)} mmHg` }] };
    case 'kidney_l': case 'kidney_r': case 'bladder':
      return { name: key === 'bladder' ? 'Bladder' : 'Kidney', claims: ['M3', 'X1'], text: 'The kidneys remove the breakdown products. Only 3% or less of the caffeine leaves unchanged.',
        lines: [{ label: 'Removed from the blood so far', value: mg(at(sim.cleared, m)) }, { label: 'Breakdown products in blood', value: mg(at(sim.metabolites, m)) }] };
    case 'cecum': case 'colon_asc': case 'colon_trans': case 'colon_desc': case 'rectum':
      return { name: 'Large intestine', claims: ['F5', 'F6', 'F7'], text: 'No caffeine gets this far: it is absorbed earlier. But coffee can make the colon contract within minutes in about 1 in 3 people.', lines: [] };
    case 'pancreas':
      return { name: 'Pancreas', claims: ['V3', 'V4'], text: 'An espresso has almost no sugar, so insulin is not called for. Caffeine does make cells respond less to insulin for a while.',
        lines: [{ label: 'Caffeine in the body', value: mg(body) }] };
    default:
      return null;
  }
}
