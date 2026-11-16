import { it } from 'vitest';
import { auditCompare, auditItems } from './text-audit';
import { beatChapter, beatOrgans, splitPlanOf } from './video-cam';
it('probe', () => {
  const its = auditItems(), f = (id: string) => its.find((x) => x.id === id)!.x;
  const a = f('beer'), b = f('red-wine'), cp = auditCompare(a, b, 'medium').cp, plan = cp.plan;
  const sides = (fr: (typeof plan.frames)[number]) => ([[a, fr.title], [b, fr.titleB]] as const).map(([x, title]) => beatOrgans(title, beatChapter(x.built.story.chapters, { ...fr, title }).focus).organs) as [string[], string[]];
  const sp = splitPlanOf(plan.frames, sides);
  console.log('SECONDS', plan.seconds.toFixed(1), JSON.stringify(sp.close.map((c) => [c.t0.toFixed(1), c.t1.toFixed(1), c.region, c.organs.join('+'), c.pose.viewH])));
});
