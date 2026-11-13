// The parts of the liquid route and their labels, without any three.js: the UI (Passport, share captions) needs
// the labels before the 3D chunk has loaded (the hosted build loads three.js lazily). LiquidRoute re-exports these.
export type SegId = 'swallow' | 'stomach' | 'duodenum' | 'small' | 'portal' | 'blood' | 'kidney' | 'bladder' | 'colon';
/** amount in `unit`; frac 0..1 of the serving; flow 0..1; front = how far along the segment it has reached (0..1),
 *  given by slow segments (colon) whose progress is known from the model. */
export interface SegState { amount: number; frac: number; flow: number; unit?: string; front?: number;
  /** shown instead of "amount unit" when the number that matters here is a different one (blood alcohol as a range) */ text?: string }
export interface Route { unit: string; segs: (m: number) => Partial<Record<SegId, SegState>>;
  /** Phase 3 (C5): what an organ HOLDS at minute m, 0..1 of what can be held there, from the same model (the liver
   *  clearing alcohol, fibre in each part of the colon, fat in the blood vessels, caffeine in the brain). Drawn in
   *  scene/presence.ts with the same scale as the route, so the organ shows how much is still there. */
  held?: (m: number) => Partial<Record<string, number>> }

export const SEG_LABEL: Record<SegId, string> = {
  swallow: 'Food pipe', stomach: 'Stomach', duodenum: 'Duodenum', small: 'Small intestine', portal: 'To the liver',
  blood: 'Blood', kidney: 'Kidneys', bladder: 'Bladder', colon: 'Large intestine',
};
