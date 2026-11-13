// Phase 4 (2026-11-13, owner brief §20-22 and §37: "meaningful camera moves between the organs that matter, now and
// then the whole body for orientation, smooth easing, no jerks"; master audit Faza 4). The camera of EVERY video the
// database makes is filmed here frame by frame, exactly as the app films it (video-cam.ts shotOf / stepRig / cameraOf,
// AppV4 cue), with no rendering: the organ boxes (organ-points.json) are projected with the camera's own parameters.
//   1. every card that names an organ (its title) or highlights one (its chapter's organ) has that organ inside the
//      platforms' safe frame once the camera has settled on it (singles: every item × cut, reel and feed; comparisons:
//      both sides of every pair × cut);
//   2. every video has at least one whole-body shot for orientation before its 24 h beat;
//   3. the camera never jumps: its speed, turn rate and their changes per frame stay under fixed limits.
import { describe, expect, it } from 'vitest';
import { AUDIT_CUTS, AUDIT_PROFILE, auditCompare, auditItems, auditPairs, auditSingle, type AuditItem } from './text-audit';
import { beatChapter, beatOrgans, cameraOf, camPlanOf, camStyle, classOf, FOV, nextLead, ORGAN_SAFE, organRect, poseOf, rigAt, SIDE_X, shotOf, splitShot, stepRig, wholeBody, type CamPlan, type Rig, type Shot, type V3 } from './video-cam';
import { presentAt, SEG_FOCUS_V } from './video-body';
import { seedOf } from './video-hook';
import { FPS, type Cut, type Plan } from './video-plan';
import { sweep } from './sweep.testutil';
import type { Analysis } from './analyze';
import type { SegId } from '../scene/segments';

/** Seconds the camera needs on a shot before the organ must be framed (the spring covers ~90 % of the way). */
const SETTLE_S = 1.2;
/** No jumps (owner brief §21: "smooth easing, no jerks"): limits per second of video, measured on the whole database
 *  and set with a margin; a cut or a teleport would be many times over them. */
export const CAM_LIMITS = { speed: 2.4 /* m/s, camera position (measured 1.6) */, turn: 0.6 /* rad/s, view direction (measured 0.23) */, accel: 14 /* m/s², camera position (a critically damped spring starts a move with its biggest pull: measured 11.7) */ };
const DT = 1 / FPS;
type Fmt = 'reel' | 'feed';
const SIZE: Record<Fmt, [number, number]> = { reel: [1080, 1920], feed: [1080, 1350] };

interface Film { bad: string[]; orient: boolean; maxSpeed: number; maxTurn: number; maxAccel: number; checked: number }
const ang = (a: V3, b: V3) => { const d = (x: V3) => { const l = Math.hypot(...x); return x.map((v) => v / l); }; const p = d(a), q = d(b); return Math.acos(Math.max(-1, Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]))); };
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/** Films a plan: `shot(fr)` per frame, the rig, the camera(s); `check(fr, cams)` per frame once the shot has settled. */
function film(plan: Plan, shot: (fr: Plan['frames'][number]) => Shot, half: number, keyOf: ((fr: Plan['frames'][number], s: Shot) => string) | null, camOf: (r: Rig) => { pos: V3; look: V3 }, check: (fr: Plan['frames'][number], cam: { pos: V3; look: V3 }, settled: boolean) => void, orientOf: (cam: { pos: V3; look: V3 }) => boolean): Omit<Film, 'bad' | 'checked'> {
  const fr0 = plan.frames[0];
  let rig = rigAt(poseOf(shot(fr0))), key = '', since = 0, run = 0, orient = false;
  let prev: { pos: V3; look: V3 } | null = null, prevV: V3 | null = null, maxSpeed = 0, maxTurn = 0, maxAccel = 0;
  const endT = plan.frames.find((f) => f.beat === 'end')?.t ?? plan.seconds;
  for (const fr of plan.frames) {
    const s = shot(fr), k = keyOf ? keyOf(fr, s) : JSON.stringify(poseOf({ ...s, tight: 0 }));
    if (k !== key) { key = k; since = fr.t; }
    rig = stepRig(rig, poseOf(s), DT, half);
    const cam = camOf(rig);
    if (prev) {
      const v = sub(cam.pos, prev.pos).map((x) => x / DT) as V3, sp = Math.hypot(...v);
      maxSpeed = Math.max(maxSpeed, sp);
      maxTurn = Math.max(maxTurn, ang(sub(cam.look, cam.pos), sub(prev.look, prev.pos)) / DT);
      if (prevV) maxAccel = Math.max(maxAccel, Math.hypot(...sub(v, prevV)) / DT);
      prevV = v;
    }
    prev = cam;
    check(fr, cam, fr.t - since >= SETTLE_S);
    if (fr.t < endT && orientOf(cam)) { run++; if (run >= Math.round(0.5 * FPS)) orient = true; } else run = 0;
  }
  return { orient, maxSpeed, maxTurn, maxAccel };
}

const inside = (r: { l: number; r: number; t: number; b: number } | null, z: { l: number; r: number; t: number; b: number }) => !!r && r.l >= z.l - 0.5 && r.r <= z.r + 0.5 && r.t >= z.t - 0.5 && r.b <= z.b + 0.5;

/** The single video of an item, filmed as AppV4 films it (startShare → cue). */
export function filmSingle(it: AuditItem, cut: Cut, fmt: Fmt = 'reel', v: 'A' | 'B' = 'A'): Film & { cam: CamPlan } {
  const x = it.x, b = x.built, o = auditSingle(x, cut, v, AUDIT_PROFILE, it.vname), plan = o.plan, chapters = b.story.chapters;
  const seed = seedOf(o.name), style = camStyle(classOf(b), seed);
  const cam = camPlanOf(plan.frames, style), [W, H] = SIZE[fmt], zone = ORGAN_SAFE[fmt];
  let lead: SegId | null = null, leadM = -1;
  const bad: string[] = [];
  let checked = 0;
  const shot = (fr: Plan['frames'][number]) => {
    if (fr.m !== leadM) { const segs = b.route?.segs(fr.m); lead = nextLead(lead, presentAt(b, fr.m), (k) => segs?.[k]?.frac ?? 0); leadM = fr.m; }
    const ch = beatChapter(chapters, fr), bo = beatOrgans(fr.title, ch.focus);
    return shotOf(fr, bo.organs, lead ? SEG_FOCUS_V[lead] : null, false, cam);
  };
  const r = film(plan, shot, style.half, null, (rg) => cameraOf(rg, FOV, 0.07, seed, style), (fr, c, settled) => {
    if (!settled || (fr.beat !== 'hold' && fr.beat !== 'hook') || !fr.title) return;
    const ch = beatChapter(chapters, fr), bo = beatOrgans(fr.title, ch.focus);
    if ((fr.stop ?? 0) === 0 && !bo.named) return; // (the first sip follows the drink down: mouth → food pipe → stomach)
    for (const organ of bo.organs) {
      checked++;
      const rc = organRect(organ, c, FOV, W, H);
      if (!inside(rc, zone)) { bad.push(`${it.id} ${cut} ${fmt} @${fr.t.toFixed(1)}s "${fr.title}" ${organ}: ${rc ? `${rc.l.toFixed(0)}-${rc.r.toFixed(0)} × ${rc.t.toFixed(0)}-${rc.b.toFixed(0)}` : 'off'}`); return; }
    }
  }, (c) => wholeBody(c, FOV, W, H));
  return { ...r, bad, checked, cam };
}

/** A comparison, filmed as AppV4 films it (startCompare: splitShot, the two cameras of CompareVideo.tsx). */
export function filmCompare(a: Analysis, b: Analysis, cut: Cut, id: string): Film {
  const cp = auditCompare(a, b, cut).cp, plan = cp.plan, W = 540, H = 1920, bad: string[] = [];
  const zones = [{ l: ORGAN_SAFE.reel.l, r: W, t: ORGAN_SAFE.reel.t, b: ORGAN_SAFE.reel.b }, { l: 0, r: ORGAN_SAFE.reel.r - W, t: ORGAN_SAFE.reel.t, b: ORGAN_SAFE.reel.b }];
  let checked = 0;
  const organsAt = (fr: Plan['frames'][number]) => ([[a, fr.title], [b, fr.titleB]] as const).flatMap(([x, title]) => beatOrgans(title, beatChapter(x.built.story.chapters, { ...fr, title }).focus).organs);
  const r = film(plan, (fr) => splitShot(fr, fr.beat === 'hold' || fr.beat === 'hook' ? organsAt(fr) : []), 0.55, (fr) => `${fr.beat === 'hold' || fr.beat === 'hook'}${organsAt(fr).join()}` /* (the split pose breathes every frame: settled = the same organs for SETTLE_S) */, (rg) => cameraOf(rg, 33, 0), (fr, c, settled) => {
    if (!settled || (fr.beat !== 'hold' && fr.beat !== 'hook')) return;
    ([[a, fr.title], [b, fr.titleB]] as const).forEach(([x, title], k) => {
      const ch = beatChapter(x.built.story.chapters, { ...fr, title }), bo = beatOrgans(title, ch.focus);
      for (const organ of bo.organs) {
        checked++;
        const rc = organRect(organ, c, 33, W, H, SIDE_X[k]);
        const local = rc && { l: rc.l, r: rc.r, t: rc.t, b: rc.b };
        if (!inside(local, zones[k])) { bad.push(`${id} ${cut} side ${k ? 'B' : 'A'} @${fr.t.toFixed(1)}s "${title}" ${organ}`); return; }
      }
    });
  }, (c) => wholeBody(c, 33, W, H, SIDE_X[0]) && wholeBody(c, 33, W, H, SIDE_X[1]));
  return { ...r, bad, checked };
}

const ITEMS = auditItems();
const summary = (label: string, fs: Film[]) => {
  const n = fs.length, bad = fs.flatMap((f) => f.bad), noOrient = fs.filter((f) => !f.orient).length;
  const max = (k: 'maxSpeed' | 'maxTurn' | 'maxAccel') => Math.max(...fs.map((f) => f[k]));
  console.log(`[camera ${label}] ${n} videos, ${fs.reduce((a, f) => a + f.checked, 0)} framed-organ checks, ${bad.length} out of the safe frame, ${noOrient} without an orientation shot; max speed ${max('maxSpeed').toFixed(2)} m/s, turn ${max('maxTurn').toFixed(2)} rad/s, accel ${max('maxAccel').toFixed(1)} m/s²`, JSON.stringify(bad.slice(0, 8)));
  return { bad, noOrient, speed: max('maxSpeed'), turn: max('maxTurn'), accel: max('maxAccel') };
};

describe('phase 4: the camera frames what the card names, orients, never jumps', () => {
  it('beats name their organ: "Kidneys" frames the kidneys (beer), not the bladder', () => {
    expect(beatOrgans('Kidneys', 'bladder').organs).toEqual(['kidney_l', 'kidney_r']);
    expect(beatOrgans('Into the large intestine', 'cecum').organs).toEqual(['cecum']);
    expect(beatOrgans('Straight to the liver', 'liver').organs).toEqual(['liver']);
    expect(beatOrgans('Blood sugar peak', 'pancreas')).toEqual({ organs: ['pancreas'], named: false });
    const beer = ITEMS.find((i) => i.id === 'beer')!;
    let seen = 0;
    for (const cut of AUDIT_CUTS) {
      const o = auditSingle(beer.x, cut, 'A', AUDIT_PROFILE, beer.vname), f = filmSingle(beer, cut);
      if (o.plan.frames.some((fr) => fr.title === 'Kidneys' && fr.beat === 'hold')) { seen++; expect(f.bad, cut).toEqual([]); }
    }
    expect(seen).toBeGreaterThanOrEqual(1); // (the beer video has its "Kidneys" card)
  });
  it('singles, every item × cut (reel) and a sample in 4:5 (feed): organs in the safe frame, an orientation shot, no jumps', () => {
    const fs: Film[] = [];
    for (const it of sweep(ITEMS)) for (const cut of AUDIT_CUTS) fs.push(filmSingle(it, cut));
    for (const it of sweep(ITEMS, 12)) fs.push(filmSingle(it, 'long', 'feed'));
    const s = summary('singles', fs);
    expect(s.bad.slice(0, 20)).toEqual([]);
    expect(s.noOrient).toBe(0);
    expect(s.speed).toBeLessThanOrEqual(CAM_LIMITS.speed);
    expect(s.turn).toBeLessThanOrEqual(CAM_LIMITS.turn);
    expect(s.accel).toBeLessThanOrEqual(CAM_LIMITS.accel);
  }, 600_000);
  it('comparisons, both sides of every pair × cut: organs in each half\'s safe frame, both whole bodies, no jumps', () => {
    const fs: Film[] = [];
    for (const pr of sweep(auditPairs(ITEMS, 120))) for (const cut of AUDIT_CUTS) fs.push(filmCompare(pr.a, pr.b, cut, pr.id));
    const s = summary('compare', fs);
    expect(s.bad.slice(0, 20)).toEqual([]);
    expect(s.noOrient).toBe(0);
    expect(s.speed).toBeLessThanOrEqual(CAM_LIMITS.speed);
    expect(s.turn).toBeLessThanOrEqual(CAM_LIMITS.turn);
  }, 600_000);
  it('camera styles differ per story class and stay the same for the same food (deterministic)', () => {
    const cls = ['alcohol', 'caffeine', 'sugar', 'meal', 'plain'] as const;
    const sig = (c: (typeof cls)[number]) => { const s = camStyle(c, 7); return JSON.stringify({ ...s, cls: 0, arc: Math.abs(s.arc), half: Math.round(s.half * 100) }); };
    expect(new Set(cls.map(sig)).size).toBe(cls.length);
    expect(camStyle('meal', 12345)).toEqual(camStyle('meal', 12345));
    // the orientation shot does not fall at the same place in every video: early, middle and late all occur
    const at = new Set<string>();
    const classes = new Set<string>();
    for (const it of sweep(ITEMS, 6)) { const f = filmSingle(it, 'long'); at.add(f.cam.style.orient); classes.add(f.cam.style.cls); }
    expect(at.size).toBeGreaterThanOrEqual(2);
    expect(classes.size).toBeGreaterThanOrEqual(4);
  }, 600_000);
});
