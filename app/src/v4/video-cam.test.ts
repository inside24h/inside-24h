// Body-first video (2026-10-23): the camera's shots, its spring (smooth, no overshoot, no jitter), the projection
// that pins gauges to organs, and the caption text rules (videoText, short pages).
import { describe, expect, it } from 'vitest';
import { cameraOf, damp, distFor, ORGAN_AT, poseOf, project, rigAt, stepRig, VIEW_H, WIDE_AT } from './video-cam';
import { CAP_PAGE, splitPages, videoText } from './video-plan';

describe('video camera', () => {
  it('frames the whole body for a wide shot and the organ for a close one', () => {
    expect(poseOf({ focus: [], zoom: 'wide' })).toEqual({ target: WIDE_AT, viewH: VIEW_H.wide });
    const st = poseOf({ focus: ['stomach'], zoom: 'close' });
    expect(st.viewH).toBeCloseTo(VIEW_H.close);
    expect(st.target[1]).toBeCloseTo(ORGAN_AT.stomach[1]);
    // long organs and the head are never shot closer than "mid"
    expect(poseOf({ focus: ['brain'], zoom: 'close' }).viewH).toBeCloseTo(VIEW_H.mid);
    expect(poseOf({ focus: ['jejunum'], zoom: 'close' }).viewH).toBeCloseTo(VIEW_H.mid);
    // two organs far apart: both in the picture, never wider than the whole body
    const both = poseOf({ focus: ['brain', 'stomach'], zoom: 'close' });
    expect(both.viewH).toBeGreaterThan(ORGAN_AT.brain[1] - ORGAN_AT.stomach[1]);
    expect(both.viewH).toBeLessThanOrEqual(VIEW_H.wide);
    // the slow push-in
    expect(poseOf({ focus: ['stomach'], zoom: 'close', tight: 1 }).viewH).toBeCloseTo(VIEW_H.close * 0.82);
  });
  it('glides with a critically damped spring: smooth start, no overshoot, settles', () => {
    let x = 0, v = 0;
    const xs: number[] = [];
    for (let i = 0; i < 90; i++) { [x, v] = damp(x, v, 1, 0.55, 1 / 30); xs.push(x); }
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThanOrEqual(xs[i - 1] - 1e-12); // never back
    expect(Math.max(...xs)).toBeLessThanOrEqual(1 + 1e-9); // never past the goal
    expect(xs[0]).toBeLessThan(0.05); // gentle start
    expect(xs[89]).toBeGreaterThan(0.97); // there after 3 s
    // no jitter: speed changes smoothly from frame to frame
    const sp = xs.map((p, i) => (i ? p - xs[i - 1] : p));
    for (let i = 2; i < sp.length; i++) expect(Math.abs(sp[i] - sp[i - 1])).toBeLessThan(0.02);
  });
  it('keeps the camera outside the body and in front of it', () => {
    let r = rigAt(poseOf({ focus: [], zoom: 'wide' }));
    for (const organ of Object.keys(ORGAN_AT)) {
      for (let i = 0; i < 120; i++) r = stepRig(r, poseOf({ focus: [organ], zoom: 'close', tight: 1 }), 1 / 30);
      const { pos } = cameraOf(r);
      expect(pos[2], organ).toBeGreaterThan(0.45); // skin at the front of the body is at z ≤ 0.22
    }
    expect(distFor(VIEW_H.close * 0.82)).toBeGreaterThan(0.6);
  });
  it('projects an organ to the pixel the camera sees it at', () => {
    // camera at z = 2 looking down -z, identity rotation; vertical FOV 90° on a square 1000 px viewport
    const view = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -2, 1];
    const f = 1 / Math.tan(Math.PI / 4), n = 0.1, fa = 100;
    const proj = [f, 0, 0, 0, 0, f, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, (2 * fa * n) / (n - fa), 0];
    expect(project([0, 0, 0], view, proj, 1000, 1000)).toEqual({ x: 500, y: 500 });
    const p = project([1, 1, 0], view, proj, 1000, 1000)!;
    expect(p.x).toBeCloseTo(750); expect(p.y).toBeCloseTo(250);
    expect(project([0, 0, 5], view, proj, 1000, 1000)).toBeNull(); // behind the camera
  });
});

describe('video captions', () => {
  it('leaves out long asides in brackets, keeps short ones, adds nothing', () => {
    expect(videoText('Your blood sugar climbs to about 7.3 mmol/L (a typical response, not personalized: most people land between 6.4 and 8.2 mmol/L). Insulin follows.'))
      .toBe('Your blood sugar climbs to about 7.3 mmol/L. Insulin follows.');
    expect(videoText('One can: 35 g of sugar (about 9 teaspoons) and 32 mg of caffeine.')).toBe('One can: 35 g of sugar (about 9 teaspoons) and 32 mg of caffeine.');
  });
  it('makes short pages (≈ 6-8 words) that keep numbers with their units and short asides whole', () => {
    const t = 'A big meal: many people feel sleepy about 1.5 hours later, whatever the meal was.';
    const pages = splitPages(t, CAP_PAGE);
    expect(pages.join(' ')).toBe(t);
    for (const p of pages) expect(p.length).toBeLessThanOrEqual(Math.round(CAP_PAGE * 1.12));
    expect(pages.some((p) => /1\.5$/.test(p))).toBe(false); // never "… about 1.5" / "hours later"
    const c = splitPages('Your blood sugar climbs from 5.0 mmol/L to about 7.3 mmol/L.', CAP_PAGE);
    expect(c.some((p) => /\d$/.test(p))).toBe(false);
    const a = splitPages('One can: 35 g of sugar (about 9 teaspoons) and 32 mg of caffeine.', CAP_PAGE);
    expect(a.some((p) => p.startsWith('('))).toBe(false);
  });
});
