// "Better swap": for sugary food or drink, a slower everyday alternative — shown only if the model confirms
// it really lowers the sugar peak for this person.
import { useMemo } from 'react';
import type { Profile } from '../science/profile';
import { analyze, SWAPS } from './analyze';
import { parseMeal, type Part } from './food/parse';
import { glucoseRiseText } from '../science/ranges';

export function useSwap(current: Part[], profile: Profile, peakNow: number | null) {
  return useMemo(() => {
    if (current.length !== 1 || peakNow === null || peakNow < 0.6) return null;
    const ideas = SWAPS[current[0].food.id];
    if (!ideas) return null;
    let best: { parts: Part[]; name: string; peak: number } | null = null;
    for (const idea of ideas.slice(0, 3)) {
      const parts = parseMeal(idea);
      if (!parts.length) continue;
      const r = analyze(parts, profile);
      if (r.sugarPeak === null) continue;
      if (!best || r.sugarPeak < best.peak) best = { parts, name: r.name, peak: r.sugarPeak };
    }
    return best && best.peak < peakNow * 0.7 ? best : null;
  }, [current, profile, peakNow]);
}

export function SwapCard({ swap, peakNow, onCompare, unit = 'mmol/L' }: { swap: { name: string; peak: number }; peakNow: number; onCompare: () => void; unit?: 'mmol/L' | 'mg/dL' }) {
  return (
    <div className="swapcard">
      <span className="ai" aria-hidden="true">🔁</span>
      <span><b>Better swap</b><em>{swap.name}: blood sugar {swap.peak < 0.3 ? 'stays steady' : glucoseRiseText(swap.peak, unit)} instead of {glucoseRiseText(peakNow, unit)}.</em>
        <button className="link" onClick={onCompare}>Compare side by side<span aria-hidden="true"> →</span></button></span>
    </div>
  );
}
