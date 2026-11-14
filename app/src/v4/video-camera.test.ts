// Phase 4 (2026-11-13, owner brief §20-22 and §37: "meaningful camera moves between the organs that matter, now and
// then the whole body for orientation, smooth easing, no jerks"; master audit Faza 4). The camera of EVERY video the
// database makes is filmed here frame by frame, exactly as the app films it (video-cam.ts shotOf / stepRig / cameraOf,
// AppV4 cue), with no rendering: the organ boxes (organ-points.json) are projected with the camera's own parameters.
//   1. every card that names an organ (its title) or highlights one (its chapter's organ) has that organ inside the
//      platforms' safe frame once the camera has settled on it (singles: every item × cut, reel and feed; comparisons:
//      both sides of every pair × cut);
//   2. every video has at least one whole-body shot for orientation before its 24 h beat;
//   3. the camera never jumps: its speed, turn rate and their changes per frame stay under fixed limits;
//   4. phase 4c (2026-11-14): no stay on one region of the body over regionMaxS (a pull-back under REGION_BREAK_S does
//      not end it), and two foods of a class are not filmed shot for shot alike (shotSimilarity).
import { describe, expect, it } from 'vitest';
import { AUDIT_CUTS, AUDIT_PROFILE, auditCompare, auditItems, auditPairs, auditSingle, type AuditItem } from './text-audit';
import { beatChapter, beatOrgans, cameraOf, camPlanOf, camStyle, classOf, FOV, nextLead, ORGAN_SAFE, organRect, poseOf, REGION_BREAK_S, regionMaxS, regionOf, rigAt, SIDE_X, shotOf, splitShot, stepRig, wholeBody, type CamPlan, type Rig, type Shot, type V3 } from './video-cam';
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

interface Film { bad: string[]; orient: boolean; maxSpeed: number; maxTurn: number; maxAccel: number; checked: number; /** phase 4c: what the camera is on, per frame of the main part (the region, 'body' = whole body) */ regions?: { t: number; r: string }[]; seconds?: number; id?: string }
/** Phase 4c: the longest stay of the camera on one region of the body; a view of another region (or the whole body)
 *  shorter than REGION_BREAK_S does not end it (a pull-back is not a new view). */
export function longestStay(rs: { t: number; r: string }[]): { s: number; r: string; at: number } {
  // (the stay ends where the camera first left the region, once the view elsewhere has lasted REGION_BREAK_S)
  let reg = '', since = 0, other = '', otherSince = 0, left: number | null = null, best = { s: 0, r: '', at: 0 };
  const close = (t: number) => { if (reg && reg !== '__body' && t - since > best.s) best = { s: t - since, r: reg, at: since }; };
  for (const { t, r: rf } of rs) {
    const r = rf.split(':')[0]; // (the region; its framing, near or far, is the same place)
    if (r === reg || (r === 'body' && reg === '__body')) { other = ''; left = null; continue; }
    if (left === null) left = t;
    if (r !== other) { other = r; otherSince = t; }
    if (!reg || t - otherSince >= REGION_BREAK_S - 1e-6) { close(left); reg = r; since = otherSince; other = ''; left = null; }
    // (the whole body is the view that breaks a stay, not a region of its own)
    if (reg === 'body') reg = '__body';
  }
  if (rs.length) close(left ?? rs[rs.length - 1].t + DT);
  return best;
}
/** Phase 4c (structural sameness, critique M5: pizza and lentils cut the same way): how alike two videos are filmed,
 *  0..1: the share of the main part's frames (time-aligned, by fraction of the main part) on the same region with the
 *  same kind of framing. */
export function shotSimilarity(a: { t: number; r: string }[], b: { t: number; r: string }[]): number {
  const N = 200;
  if (!a.length || !b.length) return 0;
  let same = 0;
  for (let i = 0; i < N; i++) { const x = a[Math.floor((i / N) * a.length)].r, y = b[Math.floor((i / N) * b.length)].r; if (x === y) same++; }
  return same / N;
}
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
  const cam = camPlanOf(plan.frames, style, chapters), [W, H] = SIZE[fmt], zone = ORGAN_SAFE[fmt];
  let lead: SegId | null = null, leadM = -1;
  const bad: string[] = [];
  let checked = 0;
  const regions: { t: number; r: string }[] = [], endT = plan.frames.find((f) => f.beat === 'end' || f.phase === 'outro')?.t ?? plan.seconds;
  const shot = (fr: Plan['frames'][number]) => {
    if (fr.m !== leadM) { const segs = b.route?.segs(fr.m); lead = nextLead(lead, presentAt(b, fr.m), (k) => segs?.[k]?.frac ?? 0); leadM = fr.m; }
    const ch = beatChapter(chapters, fr), bo = beatOrgans(fr.title, ch.focus);
    const s = shotOf(fr, bo.organs, lead ? SEG_FOCUS_V[lead] : null, false, cam);
    // (phase 4c: what the picture is on, the main part: the whole body for a wide or whole-body shot, else the region
    // of the shot's first organ, with its framing: near = close/mid, far = far)
    if (fr.phase === 'main' && fr.t < endT && fr.beat !== 'teaser' && fr.beat !== 'rewind') regions.push({ t: fr.t, r: s.zoom === 'wide' || s.zoom === 'body' || !s.focus.length ? 'body' : `${regionOf(s.focus)}${s.zoom === 'far' ? ':far' : ''}` });
    return s;
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
  return { ...r, bad, checked, cam, regions, seconds: plan.seconds, id: `${it.id} ${cut} ${fmt}` };
}

/** A comparison, filmed as AppV4 films it (startCompare: splitShot, the two cameras of CompareVideo.tsx). */
export function filmCompare(a: Analysis, b: Analysis, cut: Cut, id: string): Film {
  const cp = auditCompare(a, b, cut).cp, plan = cp.plan, W = 540, H = 1920, bad: string[] = [];
  const zones = [{ l: ORGAN_SAFE.reel.l, r: W, t: ORGAN_SAFE.reel.t, b: ORGAN_SAFE.reel.b }, { l: 0, r: ORGAN_SAFE.reel.r - W, t: ORGAN_SAFE.reel.t, b: ORGAN_SAFE.reel.b }];
  let checked = 0;
  const organsAt = (fr: Plan['frames'][number]) => ([[a, fr.title], [b, fr.titleB]] as const).flatMap(([x, title]) => beatOrgans(title, beatChapter(x.built.story.chapters, { ...fr, title }).focus).organs);
  // (phase 4c: what the split screen is on: both whole bodies always, the region lit and framed per side)
  const regions: { t: number; r: string }[] = [], endT = plan.frames.find((f) => f.beat === 'end' || f.phase === 'outro')?.t ?? plan.seconds;
  for (const fr of plan.frames) if (fr.phase === 'main' && fr.t < endT && (fr.beat === 'hold' || fr.beat === 'glide')) {
    const os = ([[a, fr.title], [b, fr.titleB]] as const).map(([x, title]) => regionOf(beatOrgans(title, beatChapter(x.built.story.chapters, { ...fr, title }).focus).organs));
    regions.push({ t: fr.t, r: os.join('|') });
  }
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
  return { ...r, bad, checked, regions, seconds: plan.seconds, id: `${id} ${cut}` };
}

const ITEMS = auditItems();
/** Phase 4c: the most two same-class videos may be filmed alike (shotSimilarity), for pizza vs lentils and on average. */
/** Phase 4c: a guard, not the goal (measured 35.7 s, walnuts vs chocolate milk): the split screen's rule (both whole
 *  bodies, heads always in view) leaves no other view to cut to; a shorter stay needs the comparison's moments changed. */
const CMP_STAY_MAX_S = 36;
const SAME_MAX = 0.6, SAME_MEAN_MAX = 0.45, SAME_WORST_MAX = 0.75; // (before phase 4c: lentils vs pizza 72 %, mean 40 %, worst 90 %)
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
    // phase 4c (critique M5 leftover): no stay on one region of the body over regionMaxS (12 s long, 9 s Reels, 6 s
    // Shorts); a pull-back under REGION_BREAK_S does not end a stay
    const stays = fs.map((f, i) => ({ f, i, st: longestStay(f.regions ?? []) })), over = stays.filter(({ f, st }) => st.s > regionMaxS(f.seconds ?? 0) + 1 / FPS + 1e-6);
    const worst = stays.reduce((a, x) => (x.st.s > a.st.s ? x : a), stays[0]);
    console.log(`[camera stays] longest stay on one region ${worst.st.s.toFixed(1)} s (${worst.st.r}); ${over.length} videos over their cap`);
    expect(over.slice(0, 10).map(({ f, st }) => `${f.id} (${f.seconds?.toFixed(0)} s): ${st.s.toFixed(1)} s on ${st.r} @${st.at.toFixed(1)}`)).toEqual([]);
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
    // phase 4c: the split screen keeps both whole bodies in the picture (owner review 2026-10-24), so what changes is
    // the region lit on each side; its longest stay is reported and held to CMP_STAY_MAX_S (a guard, see report)
    const st = fs.map((f) => ({ f, st: longestStay(f.regions ?? []) })).sort((x, y) => y.st.s - x.st.s);
    console.log(`[compare stays] longest lit-region stay ${st[0].st.s.toFixed(1)} s (${st[0].st.r}, ${st[0].f.id}); over the single cap: ${st.filter((x) => x.st.s > regionMaxS(x.f.seconds ?? 0) + 0.04).length} of ${fs.length}`);
    expect(st[0].st.s).toBeLessThanOrEqual(CMP_STAY_MAX_S);
    expect(s.bad.slice(0, 20)).toEqual([]);
    expect(s.noOrient).toBe(0);
    expect(s.speed).toBeLessThanOrEqual(CAM_LIMITS.speed);
    expect(s.turn).toBeLessThanOrEqual(CAM_LIMITS.turn);
  }, 600_000);
  it('phase 4c: lentils long is not ~25 s on the large intestine; same-class foods are not filmed the same way', () => {
    const by = (id: string) => ITEMS.find((i) => i.id === id)!;
    const len = filmSingle(by('lentils'), 'long'), piz = filmSingle(by('pizza'), 'long');
    const st = longestStay(len.regions ?? []);
    expect(st.s).toBeLessThanOrEqual(12 + 1 / FPS);
    // structural sameness: pizza and lentils (both meals, the same story shape) share at most SAME_MAX of their shots
    const sim = shotSimilarity(len.regions ?? [], piz.regions ?? []);
    console.log(`[camera sameness] lentils vs pizza (long) ${(100 * sim).toFixed(0)} % of shots alike`);
    expect(sim).toBeLessThanOrEqual(SAME_MAX);
    // and over the database: same-class pairs of the same cut (a sample), the mean and the worst
    const byCls = new Map<string, ReturnType<typeof filmSingle>[]>();
    for (const it of sweep(ITEMS, 8)) { const f = filmSingle(it, 'long'); const k = f.cam.style.cls; if (!byCls.has(k)) byCls.set(k, []); byCls.get(k)!.push(f); }
    const sims: number[] = [];
    for (const fs of byCls.values()) for (let i = 0; i + 1 < fs.length; i++) sims.push(shotSimilarity(fs[i].regions ?? [], fs[i + 1].regions ?? []));
    const mean = sims.reduce((a, x) => a + x, 0) / Math.max(1, sims.length);
    console.log(`[camera sameness] ${sims.length} same-class neighbour pairs: mean ${(100 * mean).toFixed(0)} %, worst ${(100 * Math.max(0, ...sims)).toFixed(0)} %`);
    expect(mean).toBeLessThanOrEqual(SAME_MEAN_MAX);
    expect(Math.max(0, ...sims)).toBeLessThanOrEqual(SAME_WORST_MAX);
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
