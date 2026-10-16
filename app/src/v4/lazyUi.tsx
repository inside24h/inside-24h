// Parts of the UI that only open on demand (Compare, Browse, the profile drawer, the video fallback...). Each is a
// drop-in replacement for the real component: loaded on first use (own small chunk in the hosted build, inlined in
// the single file) and wrapped in its own Suspense, so the caller needs no changes. prefetchUi() warms them up
// once the page is idle, so a tap rarely waits for the network.
import { lazy, Suspense, type ComponentType } from 'react';
import type { Compare as CompareT } from './Compare';
import type { YourBody as YourBodyT } from './YourBody';
import type { EveryDay as EveryDayT } from './EveryDay';
import type { Pro as ProT } from './Pro';
import type { VideoFallback as VideoFallbackT } from './VideoFallback';
import type { Browse as BrowseT } from './Browse';

const loaders = {
  Compare: () => import('./Compare').then((m) => ({ default: m.Compare })),
  YourBody: () => import('./YourBody').then((m) => ({ default: m.YourBody })),
  EveryDay: () => import('./EveryDay').then((m) => ({ default: m.EveryDay })),
  Pro: () => import('./Pro').then((m) => ({ default: m.Pro })),
  VideoFallback: () => import('./VideoFallback').then((m) => ({ default: m.VideoFallback })),
  Browse: () => import('./Browse').then((m) => ({ default: m.Browse })),
};

function onDemand<C extends (props: never) => unknown>(load: () => Promise<{ default: C }>) {
  type P = Parameters<C> extends [infer A, ...unknown[]] ? A : object; // no props (Pro) → {}
  const L = lazy(load as unknown as () => Promise<{ default: ComponentType<object> }>);
  return (props: P) => <Suspense fallback={null}><L {...(props as object)} /></Suspense>;
}

export const Compare = onDemand<typeof CompareT>(loaders.Compare);
export const YourBody = onDemand<typeof YourBodyT>(loaders.YourBody);
export const EveryDay = onDemand<typeof EveryDayT>(loaders.EveryDay);
export const Pro = onDemand<typeof ProT>(loaders.Pro);
export const VideoFallback = onDemand<typeof VideoFallbackT>(loaders.VideoFallback);
export const Browse = onDemand<typeof BrowseT>(loaders.Browse);

/** Fetch every on-demand part in the background (call when idle). */
export function prefetchUi() {
  for (const l of Object.values(loaders)) l().catch(() => { /* loaded again on first use */ });
}
