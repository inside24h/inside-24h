// Build 0.4 layout: one screen. Left: what is happening now. Centre: the body. Right: your readings.
// Bottom: the 24 h timeline. Evidence and the profile open in side panels on demand.
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { advance, useThree, type RootState } from '@react-three/fiber';
import { flushSync } from 'react-dom';
import { OrbitControls } from '@react-three/drei';
import { Body, type Glow } from '../scene/Body';
import { Flow } from '../scene/Flow';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { ClaimRow } from '../ui/ClaimRow';
import { SOURCES } from '../content/sources';
import { LEVEL_LABEL, type Claim, type Stage } from '../content/types';
import { DEFAULT_PROFILE, formatGlucose, healthyTwin, type Profile } from '../science/profile';
import { at, type Timeline } from '../science/espressoSim';
import { buildVitals, caffeineLatencyMin, type Vitals } from '../science/daily';
import { sleepAnchors } from '../science/anchors';
import { MAX_MIN, minutesFromU, uFromMinutes } from '../time';
import { Drawer } from './Drawer';
import { YourBody } from './YourBody';
import { CATALOG, type CatalogItem } from './catalog';
import { PRODUCTS, type WhereRow } from './products';
import { EveryDay } from './EveryDay';
import { BodyStart } from './BodyStart';
import { StoryPanel } from './StoryPanel';
import { CameraRig } from '../scene/CameraRig';
import { FlowPaths } from '../scene/FlowPaths';
import { LiquidRoute, SEG_LABEL, type SegId, type SegState } from '../scene/LiquidRoute';
import type { Bounds } from '../scene/Body';
import { RULES, type Habits } from './healthBars';
import { bodyStatus } from './status';
import { StatusLights, StatusStrips } from './StatusBar';
import { canEncode, captionOf, composeCmpFrame, composeFrame, recordCompare, stampFor, storyFrames, type CmpOverlay, type CmpSide, record, recordFrames, saveFile, type Format, type Overlay } from './share';
import { verdict, worstMoment } from './status';

const ICON_OF = { energy: '⚡', heart: '❤', water: '💧', brain: '🧠' } as const;
const SHORT_OF = { energy: 'Sugar', heart: 'Heart', water: 'Water', brain: 'Brain' } as const; // fits the video chips
import { cityLabel, climateNow, findCity } from './climate/cities';
import { simulateHydration } from '../science/hydration';
import { SUPPORT } from './support';
import { Passport } from './Passport';
import { Pro } from './Pro';
import { Tour } from './Tour';
import { CalmBar } from './CalmBar';
import { Answers, quickAnswers } from './Answers';
import { Disclaimer, HowWeKnow } from './HowWeKnow';
import { VideoFallback } from './VideoFallback';
import { videoSupportHere } from './share';
import { bacRangeText, glucoseRangeText } from '../science/ranges';
import { Compare } from './Compare';
import { CompareScene } from './CompareVideo';
import { SafeCanvas } from './perf/SafeCanvas';
import { isTouch } from './perf/device';
import { analyze, verdictOf, type Analysis } from './analyze';
import { SwapCard, useSwap } from './Swap';


import { SmartSearch } from './SmartSearch';
import { macros, parseMeal, type Part } from './food/parse';
import { makeFoodProduct } from './food/foodProduct';

// Water each drink brings (ml): espresso 30 ml shot, cola 330 ml can (≈ 89% water), water 250 ml glass.
const WATER_ML: Record<string, number> = { espresso: 29, cola: 295, water: 250 };
const PROFILE_KEY = 'i24-profile';
const CMP_STOPS = [0, 5, 20, 45, 90, 180, 360, 720, 1440];
const CMP_SHORT = [0, 20, 90, 1440];
const T50_OF: Record<string, number> = { espresso: 13, cola: 32, water: 13 }; // gastric half-times of the curated models
// Database foods that match a health-bar item (healthBars.ts ITEM_FX)
const HABIT_OF: Record<string, string> = { banana: 'banana', 'bread-white': 'bread', pizza: 'pizza', 'orange-juice': 'juice', 'green-tea': 'tea', beer: 'beer', 'red-wine': 'wine', 'white-wine': 'wine', 'chocolate-milk-bar': 'chocolate' };
// Default servings of these have their own, more detailed models (level A/B) instead of the generic one
const CURATED = new Set(['espresso', 'cola', 'water']);
const canonical = (parts: Part[]) => parts.map((p) => `${Math.round(p.grams)} g ${p.food.name.replace(/\s*\(.*\)$/, '')}`).join(' + ');

const PLAY_SECONDS = 45;
const REC_SECONDS = 15; // length of the shared video's 24 h run
// The log timeline returns values like 89.99999 for 90 min; nudge by 1e-6 so floors land on the right minute.
const whole = (min: number) => Math.floor(min + 1e-6);
const hhmm = (min: number) => `${String(Math.floor(whole(min) / 60) % 24).padStart(2, '0')}:${String(whole(min) % 60).padStart(2, '0')}`;
const sinceText = (m: number, name: string) => {
  const r = whole(m); // same rounding as the clock, so both always agree
  if (r < 1) return 'Just now';
  if (r < 60) return `${r} min after your ${name}`;
  const h = Math.floor(r / 60), mm = r % 60;
  return `${h} h${mm ? ` ${mm} min` : ''} after your ${name}`;
};

// Deep link for screenshots and posts: #p=<product>&t=<minutes>&organ=<key>&dose=<mg>. A given t starts paused.
const HASH = new URLSearchParams(window.location.hash.slice(1));
const HASH_T = HASH.has('t') ? Math.max(0, Math.min(MAX_MIN, Number(HASH.get('t')) || 0)) : null;
const HASH_DOSE = Math.max(20, Math.min(330, Number(HASH.get('dose')) || 63));
const HASH_Q = HASH.get('q') ? parseMeal(HASH.get('q')!) : [];
const HASH_P = HASH_Q.length ? 'food' : PRODUCTS[HASH.get('p') ?? ''] ? HASH.get('p')! : 'espresso';

interface Evidence { title: string; claims: string[] }

/** Latest clock time (5-min steps, from 06:00) to have this caffeine and still fall asleep on time; null if none needed. */
function latestForSleep(sim: Timeline, p: Profile): number | null {
  if (sim.doseMg < 10) return null;
  const anchors = sleepAnchors();
  let best: number | null = null;
  for (let t = 6 * 60; t < p.bedtimeMin; t += 5) {
    const toBed = p.bedtimeMin - t;
    if (caffeineLatencyMin(sim.conc[Math.min(sim.conc.length - 1, toBed)], anchors) < 5) best = t;
  }
  return best;
}

// Organs each part of the liquid route runs through (stay bright in focus mode), and where the camera looks.
const SEG_ORGANS: Record<SegId, string[]> = {
  swallow: ['tongue', 'esophagus'], stomach: ['stomach'], duodenum: ['duodenum', 'pancreas', 'gallbladder'], small: ['jejunum', 'ileum'],
  portal: ['portal_vein', 'liver'], blood: ['heart', 'aorta', 'vena_cava'], kidney: ['kidney_l', 'kidney_r'], bladder: ['bladder'],
  colon: ['cecum', 'colon_asc', 'colon_trans', 'colon_desc', 'rectum'],
};
const SEG_FOCUS: Record<SegId, string> = {
  swallow: 'esophagus', stomach: 'stomach', duodenum: 'duodenum', small: 'jejunum', portal: 'liver', blood: 'heart', kidney: 'kidney_l', bladder: 'bladder', colon: 'colon_trans',
};

// With the liquid route drawn, organs the route runs through get only a faint wash of the drink's colour,
// so the stream itself shows where the liquid is; containers (stomach, bladder) keep their fill level.
const TUBES = new Set(['tongue', 'esophagus', 'duodenum', 'jejunum', 'ileum', 'portal_vein', 'heart', 'aorta', 'vena_cava', 'cecum', 'colon_asc', 'colon_trans', 'colon_desc', 'rectum', 'kidney_l', 'kidney_r']);
function softenTubes(l: Record<string, { fill?: number; tint?: number }>, on: boolean) {
  if (!on) return l;
  const out: Record<string, { fill?: number; tint?: number }> = {};
  for (const [k, v] of Object.entries(l)) out[k] = TUBES.has(k) ? { ...v, tint: Math.min(0.18, (v.tint ?? 0) * 0.25) } : v;
  return out;
}

export default function AppV4() {
  const [u, setU] = useState(HASH_T === null ? 0 : uFromMinutes(HASH_T));
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(HASH_T !== null); // false = show the "what did you have?" start screen
  const [notice, setNotice] = useState<CatalogItem | null>(null);
  const [dose, setDose] = useState(HASH_DOSE);
  const [profile, setProfile] = useState<Profile>(() => {
    // daily use: your body and city are remembered in this browser; the meal time defaults to right now
    let base = DEFAULT_PROFILE;
    try { const raw = localStorage.getItem(PROFILE_KEY); if (raw) base = { ...DEFAULT_PROFILE, ...JSON.parse(raw) }; } catch { /* storage blocked */ }
    if (HASH_T === null) { const d = new Date(); base = { ...base, drinkAtMin: Math.floor((d.getHours() * 60 + d.getMinutes()) / 5) * 5 }; }
    const c = HASH.get('city') ? findCity(HASH.get('city')!) : undefined;
    return c ? { ...base, city: cityLabel(c) } : base;
  });
  useEffect(() => { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch { /* fine */ } }, [profile]);
  const [selected, setSelected] = useState<string | null>(HASH.get('organ'));
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [panel, setPanel] = useState<'body' | 'about' | 'every' | 'rules' | 'colours' | 'support' | 'pro' | 'method' | null>(
    (['body', 'about', 'every', 'rules', 'colours', 'support', 'pro'] as const).find((x) => x === HASH.get('panel')) ?? null);
  const [sceneError, setSceneError] = useState<unknown>(null);
  const [touched, setTouched] = useState(false);
  const [productId, setProductId] = useState(HASH_P);
  const [mode, setMode] = useState<'simple' | 'detailed'>(HASH.get('view') === 'detailed' ? 'detailed' : 'simple');
  const [bodyAsked, setBodyAsked] = useState(() => { if (HASH_T !== null) return true; try { return !!localStorage.getItem(PROFILE_KEY); } catch { return false; } });
  const [habits, setHabits] = useState<Habits>({});
  const [foodParts, setFoodParts] = useState<Part[]>(HASH_Q);
  const def = useMemo(() => (productId === 'food' && foodParts.length ? makeFoodProduct(foodParts, 'food') : PRODUCTS[productId] ?? PRODUCTS.espresso), [productId, foodParts]);
  const habitId = productId === 'food' ? (foodParts.length === 1 ? HABIT_OF[foodParts[0].food.id] ?? 'food' : 'food') : productId;
  const PRODUCT = def.content;
  const lower = PRODUCT.name.toLowerCase();

  const [wholeBody, setWholeBody] = useState(false);
  // Calm = the default for everyone: body, one sentence, play. 'Full' adds the lights, the trip and the steps.
  const [calm, setCalm] = useState(HASH.get('view') !== 'full');
  const calmNow = mode === 'simple' && calm;
  const [share, setShare] = useState<{ state: 'choose' | 'rec' | 'ready' | 'error' | 'nosupport'; format?: Format; url?: string; blob?: Blob; ext?: string; msg?: string; caption?: string } | null>(null);
  const [handle, setHandle] = useState(() => { try { return localStorage.getItem('i24-handle') || '@inside24h'; } catch { return '@inside24h'; } });
  const recRef = useRef(false);
  const r3f = useRef<RootState | null>(null);
  const [recPct, setRecPct] = useState(0);
  const uRef = useRef(u); uRef.current = u;

  // a pasted deep link (#q=…, #p=…) opens that scenario
  useEffect(() => {
    const onHash = () => window.location.reload();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // playback
  useEffect(() => {
    if (!playing) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      setU((v) => Math.min(1, v + dt / (recRef.current ? REC_SECONDS : PLAY_SECONDS)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  useEffect(() => { if (u >= 1) setPlaying(false); }, [u]);

  const minute = minutesFromU(u);
  const built = useMemo(() => def.build(profile, dose), [def, profile, dose]);
  const twinBuilt = useMemo(() => def.build(healthyTwin(profile), dose), [def, profile, dose]);
  const you = built.caffeine;
  const vYou = useMemo(() => buildVitals(profile, built.caffeine, sleepAnchors(), true, built.effects), [profile, built]);
  const vTwin = useMemo(() => buildVitals(healthyTwin(profile), twinBuilt.caffeine, sleepAnchors(), true, twinBuilt.effects), [profile, twinBuilt]);
  const city = useMemo(() => findCity(profile.city), [profile.city]);
  const weather = useMemo(() => (city ? climateNow(city) : null), [city]);
  const hyd = useMemo(() => {
    if (!city || !weather) return undefined;
    const ml = built.waterMl ?? WATER_ML[productId] ?? 0;
    const h = simulateHydration(profile, weather, ml, built.t50 ?? T50_OF[productId] ?? 13, vYou.asleep, !!profile.airCon);
    return { ...h, city: cityLabel(city) };
  }, [city, weather, built, productId, profile, vYou]);
  const systems = useMemo(() => bodyStatus(built.caffeine, vYou, built.waterMl ?? WATER_ML[productId] ?? 0, built.bac, hyd,
    productId === 'food' && (() => { const m = macros(foodParts); return m.gl === null && m.availCarbs >= 3; })()), [built, vYou, productId, hyd, foodParts]);
  const answers = useMemo(() => {
    const m = productId === 'food' ? macros(foodParts) : null;
    const unknownSugar = !!m && m.gl === null && m.availCarbs >= 3;
    const g = built.effects.glucoseMgDl ?? (unknownSugar ? undefined : new Float64Array(1441));
    return quickAnswers({ systems, drinkAt: profile.drinkAtMin, bedtimeMin: profile.bedtimeMin, weightKg: profile.weightKg, kcal: built.energy.total,
      glucoseDeltaMgDl: unknownSugar ? undefined : g, extraSleepMin: vYou.extraLatencyMin, caffeineAtBedMg: vYou.mgAtBed, bac: built.bac, waterMl: built.waterMl ?? WATER_ML[productId] ?? 0,
      latestForSleep: latestForSleep(built.caffeine, profile) });
  }, [systems, profile, built, vYou, productId, foodParts]);
  // the current item as database parts (curated products too), its sugar peak, and a checked better swap
  const currentParts = useMemo(() => (productId === 'food' ? foodParts : parseMeal(({ cola: 'cola', espresso: 'espresso', water: 'glass of water' } as Record<string, string>)[productId] ?? productId)), [productId, foodParts]);
  const peakNow = useMemo(() => {
    const m = productId === 'food' ? macros(foodParts) : null;
    if (m && m.gl === null && m.availCarbs >= 3) return null;
    const g = built.effects.glucoseMgDl;
    return g ? Math.max(0, ...Array.from(g.subarray(0, 600))) / 18.016 : 0;
  }, [built, productId, foodParts]);
  const swap = useSwap(currentParts, profile, peakNow);
  // portion: ½ · 1 · 2 · 3 of what was chosen (scales the parts; 1 returns to the original, incl. curated models)
  const [portion, setPortion] = useState(1);
  const [portionBase, setPortionBase] = useState<Part[] | null>(null);
  const applyPortion = (f: number) => {
    const base = portionBase ?? currentParts;
    setPortionBase(base); setPortion(f);
    const one = base.length === 1 ? base[0] : null;
    if (f === 1 && one && CURATED.has(one.food.id) && Math.abs(one.grams - one.food.serving.grams) < 1) { setProductId(one.food.id); return; }
    const tag = f === 0.5 ? '½ ×' : `${f} ×`;
    setFoodParts(f === 1 ? base : base.map((p) => ({ ...p, grams: p.grams * f, amountLabel: `${tag} ${p.amountLabel}` })));
    setProductId('food');
  };
  const [compare, setCompare] = useState<{ with?: Part[] } | null>(() => (HASH.get('compare') ? { with: parseMeal(HASH.get('compare')!) } : null));
  const answersBlock = (<>
    <Answers list={answers} onHow={() => setPanel('method')} />
    {swap && peakNow !== null && <SwapCard swap={swap} peakNow={peakNow} onCompare={() => setCompare({ with: swap.parts })} />}
  </>);
  const stageIndex = PRODUCT.stages.reduce((acc, s, i) => (minute >= s.min ? i : acc), 0);
  const stage = PRODUCT.stages[stageIndex];
  const head = def.headline(stage.min, built, profile, vYou.extraLatencyMin);
  // story view: the current chapter follows the clock; arrows and chapter buttons jump to a chapter
  const story = built.story;
  const chapterIdx = story.chapters.reduce((acc, c, i) => (minute + 1e-6 >= c.min ? i : acc), 0);
  const chapter = story.chapters[chapterIdx];
  const habit = habits[habitId] ?? { often: 'daily' as const, howLong: 'years' as const };
  const toBed = (profile.bedtimeMin - profile.drinkAtMin + 1440) % 1440;

  const [bounds, setBounds] = useState<Bounds>({});
  const [flightKey, setFlightKey] = useState(0);
  const goChapter = (i: number) => {
    const c = story.chapters[Math.max(0, Math.min(story.chapters.length - 1, i))];
    setSelected(null); setWholeBody(false); setU(uFromMinutes(c.min + 0.001)); setPlaying(false); setFlightKey((k) => k + 1);
  };
  const jump = useCallback((min: number) => { setU(uFromMinutes(Math.min(MAX_MIN, min + 0.01))); setPlaying(false); }, []);
  const togglePlay = useCallback(() => { setU((v) => (v >= 1 ? 0 : v)); setPlaying((p) => !p); }, []);

  // keyboard: space = play/pause, ←/→ = previous/next stage
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (!started || notice || panel || evidence || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(t.tagName)) return;
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowRight') jump(PRODUCT.stages[Math.min(PRODUCT.stages.length - 1, stageIndex + 1)].min);
      if (e.key === 'ArrowLeft') jump(PRODUCT.stages[Math.max(0, stageIndex - (minute - stage.min < 1 ? 1 : 0))].min);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, notice, panel, evidence, togglePlay, jump, stageIndex, minute, stage.min, PRODUCT.stages]);

  // Where the liquid is now: its organs stay lit, the rest of the body dims, and the camera follows the main place.
  const segNow = built.route && mode === 'simple' ? built.route.segs(minute) : null;
  const present = segNow ? (Object.entries(segNow) as [SegId, SegState][]).filter(([, v]) => v.frac >= 0.04).sort((a, b) => b[1].frac - a[1].frac) : [];
  const keepOrgans = present.flatMap(([id]) => SEG_ORGANS[id]);
  const leadRef = useRef<SegId | null>(null);
  if (present.length) {
    const cur = leadRef.current, best = present[0];
    const curFrac = cur ? segNow?.[cur]?.frac ?? 0 : 0;
    if (!cur || best[1].frac > 1.4 * curFrac || curFrac < 0.04) leadRef.current = best[0]; // hysteresis: no camera ping-pong
  }
  const liquidFocus = leadRef.current && present.length ? SEG_FOCUS[leadRef.current] : null;

  const glow: Glow = {};
  for (const o of stage.organs) glow[o] = 0.45;
  const info = selected ? def.organ(selected, built, minute) : null;

  const choose = (item: CatalogItem) => {
    if (item.status !== 'ready' || !PRODUCTS[item.id]) { setNotice(item); return; }
    setPortion(1); setPortionBase(null);
    setProductId(item.id);
    setNotice(null); setStarted(true); setSelected(null); setWholeBody(false); setU(0); setPlaying(true);
  };
  const chooseFood = (parts: Part[]) => {
    if (!parts.length) return;
    setPortion(1); setPortionBase(null);
    const one = parts.length === 1 ? parts[0] : null;
    if (one && CURATED.has(one.food.id) && Math.abs(one.grams - one.food.serving.grams) < 1) { choose(CATALOG.find((c) => c.id === one.food.id)!); return; }
    setFoodParts(parts); setProductId('food');
    setNotice(null); setStarted(true); setSelected(null); setWholeBody(false); setU(0); setPlaying(true);
    try { history.replaceState(null, '', `#q=${encodeURIComponent(canonical(parts))}`); } catch { /* sandboxed: fine */ }
  };

  // ---- Share: hook → the whole day following the liquid → summary card, recorded into a Reel or a feed video ----
  const HOOK_OF: Record<string, string> = { cola: 'one can of cola', espresso: 'one espresso', water: 'one glass of water' };
  const hookWhat = productId === 'food' ? foodParts.map((p) => `${p.amountLabel} ${p.food.name.replace(/\s*\(.*\)$/, '').toLowerCase()}`).join(' + ') : HOOK_OF[productId] ?? lower;
  const overlayRef = useRef<Overlay | null>(null);
  const reelStops = useRef<number[] | null>(null);
  const [shortVid, setShortVid] = useState(false); // ≈ 22 s cut for TikTok / Shorts
  // a still of this moment (fallback when the browser cannot make video)
  const stillImage = async () => {
    const canvas = document.querySelector<HTMLCanvasElement>('.stage canvas');
    if (!canvas || !overlayRef.current) return null;
    if (r3f.current) r3f.current.gl.render(r3f.current.scene, r3f.current.camera);
    const c = composeFrame(canvas, 'reel', overlayRef.current, 'main');
    return new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
  };
  const saveCover = async () => {
    const canvas = document.querySelector<HTMLCanvasElement>('.stage canvas');
    if (!canvas || !overlayRef.current) return;
    if (r3f.current) r3f.current.gl.render(r3f.current.scene, r3f.current.camera);
    const c = composeFrame(canvas, 'reel', overlayRef.current, 'intro');
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
    if (blob) await saveFile(`${fileName}-cover.png`, blob);
  };
  // while recording, text belongs to the moment the video is heading to (no flicker during the glide)
  const recStop = share?.state === 'rec' && reelStops.current ? reelStops.current.find((x) => x >= minute - 0.01) ?? 1440 : minute;
  const recChapter = story.chapters.reduce((acc, c) => (recStop + 1e-6 >= c.min ? c : acc), story.chapters[0]);
  overlayRef.current = {
    hook: `What does ${hookWhat} really do inside your body?`,
    title: PRODUCT.name,
    sub: `${profile.sex === 'female' ? 'Woman' : 'Man'}, ${profile.ageY} · ${profile.heightCm} cm · ${profile.weightKg} kg${city ? ` · ${city.name}` : ''}`,
    clock: hhmm(profile.drinkAtMin + recStop), step: recChapter.title, caption: captionOf(recChapter.text), color: story.color, progress: u, handle, stamp: stampFor(recStop),
    pop: (() => {
      const mi = Math.round(Math.min(1440, minute));
      const bac = built.bac ? built.bac[mi] : 0;
      // a range, never one number (Widmark ±20–40%, alcohol.md W6)
      if (bac >= 0.1) return { big: bacRangeText(bac).replace(' ‰', ''), small: '‰ blood alcohol', level: (bac >= 0.5 ? 2 : 1) as 0 | 1 | 2 };
      const g = built.effects.glucoseMgDl ? built.effects.glucoseMgDl[mi] / 18.016 : 0;
      if (Math.abs(g) >= 0.5 && peakNow !== null) return { big: g > 0 ? glucoseRangeText(g) : g.toFixed(1), small: g > 0 ? 'blood sugar, typical' : 'sugar dip', level: (g >= 3 || g <= -1 ? 2 : 1) as 0 | 1 | 2 };
      const caf = built.caffeine.doseMg >= 10 ? built.caffeine.body[mi] : 0;
      if (caf >= 20) return { big: `${Math.round(caf)} mg`, small: 'caffeine in you', level: (caf >= 200 ? 1 : 0) as 0 | 1 | 2 };
      return undefined;
    })(),
    where: (() => {
      const top = present[0];
      if (!top || !built.route) return undefined;
      const v = top[1].amount;
      return `${SEG_LABEL[top[0]]} · ${v >= 10 ? Math.round(v) : v.toFixed(1)} ${top[1].unit ?? built.route.unit}`;
    })(),
    lights: systems.map((s) => ({ icon: ICON_OF[s.key], label: SHORT_OF[s.key], level: s.levels[Math.round(Math.min(1440, minute))] as 0 | 1 | 2 })),
    summary: systems.map((s) => {
      const at0 = worstMoment(s), lvl = s.levels[at0] as 0 | 1 | 2;
      return { icon: ICON_OF[s.key], label: s.label, level: lvl, note: lvl === 0 ? 'Steady all day' : `${lvl === 1 ? 'Mild stress' : 'Overload'} at ${hhmm(profile.drinkAtMin + at0)}` };
    }),
  };
  const startShare = (format: Format) => {
    const canvas = document.querySelector<HTMLCanvasElement>('.stage canvas');
    if (!canvas || videoSupportHere() === 'none') { setShare({ state: 'nosupport' }); return; }
    if (share?.url) URL.revokeObjectURL(share.url);
    setMode('simple'); setSelected(null); setWholeBody(false); setFlightKey((k) => k + 1); setEvidence(null); setPanel(null);
    recRef.current = true; setU(0); setPlaying(false); setShare({ state: 'rec', format }); setRecPct(0);
    // frame-exact encoder where available (smooth on any computer), screen recording as a fallback
    const job = canEncode()
      ? recordFrames(canvas, format, () => overlayRef.current!, (m) => {
          // render one exact 1/30 s frame ourselves (works even when the browser throttles a background tab)
          flushSync(() => setU(uFromMinutes(m)));
          const st = r3f.current;
          if (st) advance(st.clock.elapsedTime + 1 / 30, true, st);
        }, reelFrames(), (f) => setRecPct(f))
      : record(canvas, format, () => overlayRef.current!, () => setPlaying(true), () => uRef.current >= 1);
    job
      .then(({ blob, ext }) => setShare({ state: 'ready', format, blob, ext, url: URL.createObjectURL(blob) }))
      .catch((e: Error) => setShare({ state: 'error', msg: e.message }))
      .finally(() => { recRef.current = false; reelStops.current = null; });
  };  // QA only: #frame=<reel|feed>-<intro|main|outro> paints one composed video frame over the page after 6 s
  useEffect(() => {
    const spec = HASH.get('frame');
    if (!spec) return;
    const [fmt, phase] = spec.split('-') as [Format, 'intro' | 'main' | 'outro'];
    const id = setTimeout(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('.stage canvas');
      if (!canvas || !overlayRef.current) return;
      const c = composeFrame(canvas, fmt, overlayRef.current, phase);
      c.style.cssText = 'position:fixed;inset:0;margin:auto;height:100vh;z-index:9999;background:#000';
      document.body.appendChild(c);
    }, 6000);
    return () => clearTimeout(id);
  }, []);
  // ---- comparison Reel: two bodies off-screen, stepped frame by frame ----
  const [cmpRec, setCmpRec] = useState<{ a: Analysis; b: Analysis; u: number } | null>(null);
  const [cmpNever, setCmpNever] = useState(false);
  const cmpOverlayRef = useRef<CmpOverlay | null>(null);
  if (cmpRec) {
    const m = minutesFromU(cmpRec.u), mi = Math.round(Math.min(1440, m));
    const mStop = (shortVid ? CMP_SHORT : CMP_STOPS).find((x) => x >= m - 0.01) ?? 1440; // text belongs to the moment we are heading to
    const side = (x: Analysis): CmpSide => {
      const segs = x.built.route?.segs(m);
      const top = segs ? (Object.entries(segs) as [SegId, SegState][]).filter(([, v]) => v.frac >= 0.04).sort((p, q) => q[1].frac - p[1].frac)[0] : undefined;
      const ch = x.built.story.chapters.reduce((acc, c) => (mStop + 1e-6 >= c.min ? c : acc), x.built.story.chapters[0]);
      const dg = x.glucose ? x.glucose[mi] / 18.016 : 0;
      const en = x.systems.find((s) => s.key === 'energy')!;
      return {
        name: x.name, color: x.color, step: ch.title, caption: captionOf(ch.text, 95),
        where: top ? `${SEG_LABEL[top[0]]} · ${top[1].amount >= 10 ? Math.round(top[1].amount) : top[1].amount.toFixed(1)} ${top[1].unit ?? x.built.route!.unit}` : undefined,
        sugar: x.sugarPeak === null ? 'Sugar ?' : Math.abs(dg) < 0.15 ? 'Sugar steady' : `Sugar ${dg > 0 ? '+' : ''}${dg.toFixed(1)}`, sugarLevel: en.levels[mi] as 0 | 1 | 2,
        lights: x.systems.map((s) => ({ icon: ICON_OF[s.key], label: SHORT_OF[s.key], level: s.levels[mi] as 0 | 1 | 2 })),
        summary: { kcal: x.kcal, sugarPeak: x.sugarPeak === null ? 'not measured' : x.sugarPeak < 0.3 ? 'steady' : `+${x.sugarPeak.toFixed(1)} mmol/L`,
          worst: x.systems.map((s) => { const w = worstMoment(s), l = s.levels[w] as 0 | 1 | 2; return { icon: ICON_OF[s.key], label: SHORT_OF[s.key], level: l, note: l === 0 ? 'fine all day' : `${l === 1 ? 'mild stress' : 'overload'} at ${hhmm(profile.drinkAtMin + w)}` }; }) },
      };
    };
    cmpOverlayRef.current = { hook: `${cmpRec.a.name} or ${cmpRec.b.name}: which is better for your body?`, clock: hhmm(profile.drinkAtMin + mStop), progress: cmpRec.u, handle, stamp: stampFor(mStop), verdict: verdictOf(cmpRec.a, cmpRec.b), a: side(cmpRec.a), b: side(cmpRec.b) };
  }
  const makeCompareVideo = (a: Analysis, b: Analysis) => {
    setCompare(null); setCmpRec({ a, b, u: 0 }); setShare({ state: 'rec', format: 'reel' }); setRecPct(0);
    setTimeout(async () => {
      const ca = document.querySelector<HTMLCanvasElement>('.stage canvas');
      if (!ca) { setShare({ state: 'error', msg: 'Could not prepare the two bodies.' }); setCmpRec(null); return; }
      try {
        flushSync(() => setCmpNever(true)); // bodies are loaded: from now on only the recorder draws frames
        const frames = shortVid ? storyFrames(CMP_SHORT, uFromMinutes, minutesFromU, 3.6, 1.0, 0) : storyFrames(CMP_STOPS, uFromMinutes, minutesFromU, 4.8, 1.2, 0); // ≈ 22 s or ≈ 58 s (Reels limit 61 s)
        const { blob, ext } = await recordCompare(ca, () => cmpOverlayRef.current!, (m) => { flushSync(() => setCmpRec((r) => (r ? { ...r, u: uFromMinutes(m) } : r))); const st = r3f.current; if (st) advance(st.clock.elapsedTime + 1 / 30, true, st); }, frames, (f) => setRecPct(f));
        setShare({ state: 'ready', format: 'reel', blob, ext, url: URL.createObjectURL(blob), caption: `${a.name} vs ${b.name}: what really happens inside you in 24 hours 👀 ${verdictOf(a, b)} Which one would you pick? 👇 #Inside24h #health #nutrition` });
      } catch (e) { setShare({ state: 'error', msg: (e as Error).message }); }
      setCmpRec(null); setCmpNever(false);
    }, 1500); // let both bodies load (runs once, before the tab can be left)
  };
  // QA only: #cmpframe=<food>&phase=… mounts the two bodies at minute t and paints one comparison frame
  useEffect(() => {
    const other = HASH.get('cmpframe');
    if (!other) return;
    const b = analyze(parseMeal(other), profile), a = analyze(currentParts, profile);
    setCmpRec({ a, b, u: uFromMinutes(HASH_T ?? 0) });
    const id = setTimeout(() => {
      const ca = document.querySelector<HTMLCanvasElement>('.stage canvas');
      if (!ca || !cmpOverlayRef.current) return;
      if (r3f.current) r3f.current.gl.render(r3f.current.scene, r3f.current.camera); // draw now, read in the same task
      const c = composeCmpFrame(ca, cmpOverlayRef.current, (HASH.get('phase') as 'intro' | 'main' | 'outro') ?? 'main');
      c.style.cssText = 'position:fixed;inset:0;margin:auto;height:100vh;z-index:9999;background:#000';
      document.body.appendChild(c);
    }, 5000);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // key moments for the single Reel: the story's chapters (the swallow is part of 'first sip'), at most 10 stops
  const reelFrames = () => {
    const mins = story.chapters.map((c) => c.min).filter((m) => m === 0 || m >= 1);
    let stops = mins.length > 9 ? [...mins.slice(0, 9), 1440] : [...mins, 1440];
    if (shortVid) { // ≈ 22 s: the start, the first big moment, one later moment, the end
      const a = mins.find((m) => m >= 15) ?? 20, b = mins.find((m) => m >= Math.max(60, a + 30)) ?? 180;
      stops = [0, a, b, 1440];
      reelStops.current = stops;
      return storyFrames(stops, uFromMinutes, minutesFromU, 3.6, 1.0, 0);
    }
    reelStops.current = stops;
    return storyFrames(stops, uFromMinutes, minutesFromU, 4.3, 1.1, 0); // ≤ 10 stops ≈ 58 s, under the 61 s limit
  };
  const fileName = `inside24h-${PRODUCT.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

  // A drag on the canvas must not count as "clicked empty space".
  const down = useRef<[number, number] | null>(null);

  return (
    <div className="v4">
      <header className="top">
        <button className="brand" title="Home" aria-label="Inside 24h, go to the start page" onClick={() => {
          // home = the "what did you have?" screen (your body stays remembered; "← Back to you" edits it)
          setStarted(false); setPlaying(false); setPanel(null); setEvidence(null); setCompare(null); setShare(null); setSelected(null);
          try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch { /* sandboxed */ }
        }}>Inside <em>24h</em></button>
        <div className="topsearch">{started && <SmartSearch onPick={chooseFood} current={PRODUCT.name} />}</div>
        <div className="topactions">
          <div className="seg2 mode" role="group" aria-label="View">
            <button aria-pressed={mode === 'simple' && calm} onClick={() => { setMode('simple'); setCalm(true); }}>Simple</button>
            <button aria-pressed={mode === 'simple' && !calm} onClick={() => { setMode('simple'); setCalm(false); }}>Full</button>
            <button aria-pressed={mode === 'detailed'} onClick={() => setMode('detailed')}>Detailed</button>
          </div>
          {started && <button className="ghost hdr" onClick={() => setCompare({})}>⇄ Compare</button>}
          {started && <button className="ghost sharebtn" onClick={() => setShare({ state: videoSupportHere() === 'none' ? 'nosupport' : 'choose' })} disabled={share?.state === 'rec'}>{share?.state === 'rec' ? '● Recording…' : 'Share video'}</button>}
          <button className="ghost hdr" onClick={() => setPanel('about')}>About</button>
          <button className="ghost hdr pro" onClick={() => setPanel('pro')}>Pro <small>soon</small></button>
          <button className="ghost hdr support" onClick={() => setPanel('support')}>♥ Support</button>
          <button className="primary" onClick={() => setPanel('body')}>Your body</button>
        </div>
      </header>

      <main className={`grid ${mode} ${calmNow ? 'calm' : ''}`}>
        {mode === 'simple' && !calmNow && (
          <StoryPanel story={story} chapterIdx={chapterIdx} minute={minute} vitals={vYou} profile={profile} name={PRODUCT.name}
            productId={habitId} habit={habit} setHabit={(h) => setHabits({ ...habits, [habitId]: h })}
            clock={hhmm(profile.drinkAtMin + minute)} since={sinceText(minute, lower)}
            onBody={() => setPanel('body')} onEvery={() => setPanel('every')}
            onWhy={(c) => setEvidence({ title: c.title, claims: c.claims })}
            onPrev={() => goChapter(chapterIdx - 1)} onNext={() => goChapter(chapterIdx + 1)}
            verdict={verdict(systems, profile.drinkAtMin)} passport={answersBlock} />
        )}
        {mode === 'detailed' && <section className="now" aria-label="What is happening now">
          <div className="clock">{hhmm(profile.drinkAtMin + minute)}</div>
          <div className="since">{sinceText(minute, lower)}</div>
          <div className="stagelabel" aria-live="polite">{head.label}</div>
          <p className="headline">{head.text}</p>
          <button className="evlink" onClick={() => setEvidence({ title: head.label, claims: head.claims })}>
            <Levels ids={head.claims} claims={PRODUCT.claims} /> Why we know this
          </button>
          <button className="everybtn" onClick={() => setPanel('every')}>
            <b>If you have this every day</b><span>cholesterol, diabetes, weight and more →</span>
          </button>
          <Where rows={built.where} title={({ cola: 'Where the sugar is', water: 'Where the water is', espresso: 'Where the caffeine is' } as Record<string, string>)[productId] ?? `Where the ${lower} is`} minute={minute} selected={selected} onPick={setSelected} />
          <Disclaimer onHow={() => setPanel('method')} />
        </section>}

        <section className="stage" aria-label="3D body"
          onPointerDown={(e) => { down.current = [e.clientX, e.clientY]; setTouched(true); }}>
          <ErrorBoundary fallback={(e) => <StageError error={e} />}>
            {sceneError ? <StageError error={sceneError} /> : (
              <SafeCanvas camera={{ position: [0.05, 1.22, 2.05], fov: 33 }} frameloop={share?.state === 'rec' && canEncode() && (!cmpRec || cmpNever) ? 'never' : 'always'}
                onPointerMissed={(e) => {
                  const d = down.current;
                  if (!d || Math.hypot(e.clientX - d[0], e.clientY - d[1]) < 5) setSelected(null);
                }}>
                <ExposeState into={r3f} />
                <Suspense fallback={null}>
                  {cmpRec ? <CompareScene a={cmpRec.a} b={cmpRec.b} minute={minutesFromU(cmpRec.u)} /> : <>
                  <Body glow={mode === 'simple' ? {} : glow} selected={selected} onSelect={setSelected} onError={setSceneError}
                    liquid={mode === 'simple' ? softenTubes(story.liquid(minute), !!built.route) : {}} liquidColor={story.color} onBounds={setBounds}
                    dim={keepOrgans.length ? 0.32 : 1} keep={keepOrgans} />
                  {mode === 'detailed' && <Flow layers={built.layers} minute={minute} />}
                  {mode === 'simple' && (built.route
                    ? <LiquidRoute route={built.route} color={story.color} minute={minute} labels={share?.state !== 'rec'} maxLabels={calmNow ? 1 : 3} />
                    : <FlowPaths bounds={bounds} color={story.color} flows={story.flows(minute)} toKidneys={story.toKidneys} />)}
                  </>}
                </Suspense>
                <OrbitControls makeDefault target={[0, 1.15, 0]} enablePan={false} minDistance={0.3} maxDistance={3.2} />
                {mode === 'simple' && !cmpRec && <CameraRig focus={share?.state === 'rec' ? liquidFocus ?? 'torso' : selected ?? (wholeBody ? null : liquidFocus ?? chapter.focus)} bounds={bounds} minDist={share?.state === 'rec' ? 1.05 : !selected && liquidFocus ? 0.95 : 0.5} flightKey={`${productId}-${chapterIdx}-${selected}-${flightKey}`} />}
              </SafeCanvas>
            )}
          </ErrorBoundary>
          {calmNow && <div className="stageanswers">{answersBlock}</div>}
          {mode === 'simple' && !calmNow && <StatusLights systems={systems} minute={minute} onRules={() => setPanel('colours')}
            weather={city && weather && hyd ? {
              city: city.name, range: `${Math.round(weather.tmin)}–${Math.round(weather.tmax)} °C`, month: weather.month,
              extra: profile.airCon ? 0 : Math.round(hyd.extraPerDayMl / 50) * 50, onChange: () => setPanel('body'),
            } : undefined}
            onJump={(m, organ) => { jump(m); setSelected(organ); setFlightKey((k) => k + 1); }} />}
          {mode === 'simple' && !calmNow && built.route && built.traits && (
            <div className="stagetrip">
              <Passport compact route={built.route} minute={minute} drinkAt={profile.drinkAtMin} kind={built.traits}
                onJump={(m, organ) => { jump(m); setSelected(organ); setWholeBody(false); setFlightKey((k) => k + 1); }} />
            </div>
          )}
          {(mode === 'detailed' || !built.route) && <Journey steps={built.journey} unit={built.journeyUnit} minute={minute} selected={selected} onPick={setSelected} />}
          {!touched && <div className="hint">{isTouch() ? 'Swipe to turn · pinch to zoom · tap an organ' : 'Drag to turn · scroll to zoom · tap an organ'}</div>}
          {mode === 'detailed' ? (
            <div className="legend">
              {built.legend.map((l) => <span key={l.label}><i style={{ background: l.color }} />{l.label}</span>)}
              <span className="dim">{built.dotNote}</span>
            </div>
          ) : (
            <div className="legend"><span><i style={{ background: story.color }} />{PRODUCT.name} in your body</span>
              {(selected || (chapter.focus && !wholeBody)) && <button className="wholebody" onClick={() => { setSelected(null); setWholeBody(true); setFlightKey((k) => k + 1); }}>Show whole body</button>}
            </div>
          )}
          <div className="credit">Anatomy: BodyParts3D © DBCLS · CC BY 4.0</div>
          {info && (
            <div className="organ" role="dialog" aria-label={info.name}>
              <div className="ohead"><b>{info.name}</b><button className="x" aria-label="Close" onClick={() => setSelected(null)}>×</button></div>
              {info.lines.map((l) => <div key={l.label} className="oline"><span>{l.label}</span><b>{l.value}</b></div>)}
              <p>{info.text}</p>
              <button className="evlink" onClick={() => setEvidence({ title: info.name, claims: info.claims })}><Levels ids={info.claims} claims={PRODUCT.claims} /> Evidence</button>
            </div>
          )}
        </section>

        {mode === 'detailed' && <Readings you={vYou} sim={you} twin={vTwin} profile={profile} minute={minute} vitalClaims={def.vitalClaims} name={lower}
          insulin={built.insulin} energy={built.energy} onOpen={(title, claims) => setEvidence({ title, claims })} />}
      </main>

      {calmNow && (
        <CalmBar title={chapter.title} text={captionOf(chapter.text, 170)} clock={hhmm(profile.drinkAtMin + minute)} since={sinceText(minute, lower)}
          playing={playing} onPlay={togglePlay} u={u} setU={(v) => { setU(v); setPlaying(false); }} systems={systems} minute={minute}
          where={overlayRef.current?.where} onMore={() => setCalm(false)}
          eatenAt={profile.drinkAtMin} setEatenAt={(m) => setProfile({ ...profile, drinkAtMin: m })} noun={lower}
          portion={portion} onPortion={applyPortion} />
      )}
      {mode === 'simple' && !calmNow && <StatusStrips systems={systems} minute={minute} onSeek={jump} clock={(m) => hhmm(profile.drinkAtMin + m)} />}
      {mode === 'simple' && !calmNow && (
        <nav className="moments" aria-label="Steps of the journey">
          <button className="play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
          {story.chapters.map((c, i) => (
            <button key={`${c.min}-${c.title}`} className={`moment ${i === chapterIdx ? 'on' : i < chapterIdx ? 'past' : ''}`} onClick={() => goChapter(i)}>
              {c.title}<small>{hhmm(profile.drinkAtMin + c.min)}</small>
            </button>
          ))}
        </nav>
      )}
      {!started && !bodyAsked && (
        <div className="start" role="dialog" aria-label="Tell us about you">
          <BodyStart profile={profile} setProfile={setProfile} onNext={() => setBodyAsked(true)} />
        </div>
      )}

      {mode === 'detailed' && <TimelineBar u={u} minute={minute} playing={playing} togglePlay={togglePlay} setU={(v) => { setU(v); setPlaying(false); }}
        stages={PRODUCT.stages} stageIndex={stageIndex} jump={jump} toBed={toBed} bedLabel={hhmm(profile.bedtimeMin)} drinkAt={profile.drinkAtMin} />}

      {!started && bodyAsked && (
        <div className="start" role="dialog" aria-label="Choose what you ate or drank">
          <div className="startbox">
            <div className="step">Step 2 of 2 · choose</div>
            <h1>What should we follow through your body?</h1>
            <SmartSearch onPick={chooseFood} big />
            <div className="orpick">or pick one</div>
            <div className="tiles">
              {[
                { q: 'cola', name: 'Cola', sub: '1 can · 330 ml', color: '#2a120a' },
                { q: 'espresso', name: 'Espresso', sub: '1 shot', color: '#2b1608' },
                { q: 'water', name: 'Water', sub: '1 glass · 250 ml', color: '#cfe8ff' },
                { q: '1 banana', name: 'Banana', sub: '1 medium', color: '#f1de8c' },
                { q: 'beer', name: 'Beer', sub: '0.5 l', color: '#e5a823' },
                { q: 'pizza', name: 'Pizza', sub: '1 slice', color: '#e8b04a' },
                { q: '1 apple', name: 'Apple', sub: '1 medium', color: '#c8e06a' },
                { q: 'glass of milk', name: 'Milk', sub: '1 glass · 250 ml', color: '#f4f1ea' },
              ].map((t) => (
                <button key={t.q} className={`tile ${['1 banana', 'pizza', '1 apple'].includes(t.q) ? 'solid' : ''}`} style={{ ['--tc' as string]: t.color }} onClick={() => chooseFood(parseMeal(t.q))}>
                  <i aria-hidden="true" /><b>{t.name}</b><span>{t.sub}</span>
                </button>
              ))}
            </div>
            <p className="then">Then watch it move through your body, minute by minute. <button className="link" onClick={() => setBodyAsked(false)}>← Back to you</button></p>
          </div>
        </div>
      )}
      {notice && (
        <div className="drawer-wrap center" onMouseDown={(e) => { if (e.target === e.currentTarget) setNotice(null); }}>
          <div className="noticebox" role="alertdialog" aria-label={`${notice.name} is not ready yet`}>
            <h2>{notice.name} is still in research</h2>
            <p>We only show numbers we can back with scientific studies, so {notice.name.toLowerCase()} isn’t ready yet. Espresso and cola are ready now.</p>
            <div className="nbtns">
              <button className="primary" autoFocus onClick={() => choose(CATALOG[0])}>Show espresso</button>
              <button className="ghost" onClick={() => choose(CATALOG.find((c) => c.id === 'cola')!)}>Show cola</button>
              <button className="ghost" onClick={() => setNotice(null)}>Back</button>
            </div>
          </div>
        </div>
      )}

      {compare && <Compare current={currentParts} profile={profile} initial={compare.with} onClose={() => setCompare(null)} onVideo={canEncode() ? makeCompareVideo : undefined} short={shortVid} setShort={setShortVid} />}
      <Tour active={started && mode === 'simple' && !calmNow && !panel && !share} />
      {share?.state === 'rec' && <div className="recbadge" role="status">● Making your video… {Math.round((canEncode() ? recPct : u) * 100)}% · keep this tab open</div>}
      {share && share.state !== 'rec' && (
        <div className="drawer-wrap center" onMouseDown={(e) => { if (e.target === e.currentTarget) setShare(null); }}>
          <div className="noticebox sharebox" role="dialog" aria-label="Share video">
            {share.state === 'choose' && (<>
              <h2>Make a video</h2>
              <p className="note">The whole 24 hours with a hook title, a pause at each key moment, captions for silent viewing, the liquid moving through the body, and a summary at the end.</p>
              <label className="handle">Your Instagram / X handle<input value={handle} onChange={(e) => { setHandle(e.target.value); try { localStorage.setItem('i24-handle', e.target.value); } catch { /* private mode */ } }} /></label>
              <div className="lenpick" role="group" aria-label="Length">Length:
                <button aria-pressed={!shortVid} onClick={() => setShortVid(false)}>Full · about 1 min</button>
                <button aria-pressed={shortVid} onClick={() => setShortVid(true)}>Short · about 20 s</button>
              </div>
              <div className="fmtpick">
                <button className="fmt" onClick={() => startShare('reel')}><i className="r916" /><b>Reel / Story / TikTok</b><span>9:16 · 1080×1920</span></button>
                <button className="fmt" onClick={() => startShare('feed')}><i className="r45" /><b>Feed post</b><span>4:5 · 1080×1350</span></button>
              </div>
            </>)}
            {share.state === 'error' && (<><h2>Could not make the video</h2><p>{share.msg}</p></>)}
            {share.state === 'nosupport' && <VideoFallback makeImage={stillImage}
              onSave={async (b) => { const r = await saveFile(`${fileName}-moment.png`, b); return r === 'saved' ? 'Saved. If nothing downloaded, press and hold the picture to save it.' : r === 'declined' ? 'Not saved.' : 'Press and hold the picture to save it.'; }} />}
            {share.state === 'ready' && (<>
              <h2>Your 24 h video</h2>
              <video src={share.url} autoPlay loop muted playsInline controls className={share.format === 'reel' ? 'v916' : 'v45'} />
              <p className="note">Suggested caption: “{share.caption ?? `What ${hookWhat} does inside your body in 24 hours 👀 Which food should we test tomorrow? 👇 #Inside24h #health #nutrition`}”</p>
              {share.msg && <p className="note">{share.msg}</p>}
            </>)}
            <div className="nbtns">
              {share.state === 'ready' && <button className="primary" onClick={async () => {
                const r = await saveFile(`${fileName}-${share.format === 'reel' ? 'reel' : 'feed'}.${share.ext}`, share.blob!);
                setShare({ ...share, msg: r === 'saved' ? 'Saved. Post it as a Reel, Story or TikTok.' : r === 'declined' ? 'Not saved.' : 'Saving files is not available here. Right-click the video and choose “Save video as…”.' });
              }}>Save video ({share.ext?.toUpperCase()}, {((share.blob?.size ?? 0) / 1e6).toFixed(1)} MB)</button>}
              {share.state === 'ready' && <button className="ghost" onClick={() => setShare({ state: 'choose' })}>Make another</button>}
              {share.state === 'choose' && <button className="ghost" onClick={saveCover}>Save cover image (PNG)</button>}
              <button className="ghost" onClick={() => setShare(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <Drawer open={!!evidence} title={evidence?.title ?? ''} onClose={() => setEvidence(null)}>
        <ul className="claims">{evidence?.claims.map((id) => PRODUCT.claims[id] && <ClaimRow key={id} claim={PRODUCT.claims[id]} />)}</ul>
        <LevelKey />
      </Drawer>
      <Drawer open={panel === 'body'} title="Your body" onClose={() => setPanel(null)}>
        <YourBody profile={profile} setProfile={setProfile} dose={dose} setDose={setDose} showDose={def.hasDose} />
      </Drawer>
      <Drawer open={panel === 'every'} title={`${PRODUCT.name} every day`} onClose={() => setPanel(null)}>
        <EveryDay productId={productId} />
      </Drawer>
      <Drawer open={panel === 'rules'} title="How the bars work" onClose={() => setPanel(null)}>
        <p className="note">The bars are our own simplified 0–100 scale, made so you can compare choices at a glance. Each rule below is tied to a study or official guideline.</p>
        <ul className="rules">{RULES.map((r) => <li key={r.rule}><b>{r.bar}</b><span>{r.rule}</span><small>{r.source}</small></li>)}</ul>
      </Drawer>
      <Drawer open={panel === 'colours'} title="How the colours work" onClose={() => setPanel(null)}>
        <p className="note"><b className="g">Green</b> your body is working normally. <b className="y">Yellow</b> mild stress it handles easily. <b className="r">Red</b> overload: a big swing your body has to fight. These cut-offs are our own simple scale (level C), built on the official categories named below.</p>
        <ul className="rules">{systems.map((s) => <li key={s.key}><b>{s.label}</b><span>{s.rule}</span></li>)}</ul>
      </Drawer>
      <Drawer open={panel === 'pro'} title="Inside 24h Pro" onClose={() => setPanel(null)}>
        <Pro />
      </Drawer>
      <Drawer open={panel === 'support'} title="Support Inside 24h" onClose={() => setPanel(null)}>
        <Support />
      </Drawer>
      <Drawer open={panel === 'about'} title="About Inside 24h" onClose={() => setPanel(null)}>
        <About onMethod={() => setPanel('method')} />
      </Drawer>
      <Drawer open={panel === 'method'} title="How we know" onClose={() => setPanel(null)}>
        <HowWeKnow />
      </Drawer>
    </div>
  );
}

/** Hands the R3F root state to the recorder, which renders frames itself while making a video. */
function ExposeState({ into }: { into: React.MutableRefObject<RootState | null> }) {
  into.current = useThree();
  return null;
}

function Levels({ ids, claims }: { ids: string[]; claims: Record<string, Claim> }) {
  const levels = [...new Set(ids.map((id) => claims[id]?.level).filter(Boolean))];
  return <span className="lvls">{levels.map((l) => <i key={l} className={`lv lv-${l === '?' ? 'q' : l}`}>{l}</i>)}</span>;
}

// Each row also selects the organ where that substance sits, so nobody has to aim at the 3D model.
function Where({ rows, title, minute, selected, onPick }: { rows: WhereRow[]; title: string; minute: number; selected: string | null; onPick: (organ: string | null) => void }) {
  return (
    <div className="where">
      <div className="wtitle">{title} <span>tap to show</span></div>
      {rows.map((w) => {
        const v = w.value(minute);
        const on = selected === w.organ;
        return (
          <button key={w.label} className={`wrow ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => onPick(on ? null : w.organ)}>
            <span className="wl">{w.label}</span>
            <span className="wv">{v < 0.05 ? '0' : v < 10 ? v.toFixed(1) : v.toFixed(0)} <small>{w.unit}</small></span>
            <span className="wbar"><i className={w.cls} style={{ width: `${Math.min(100, (100 * v) / w.max)}%` }} /></span>
          </button>
        );
      })}
    </div>
  );
}

// Healthy zones for the range bars [R1 AHA; R2 ADA; vitals-circadian O1]. Values outside the scale are clamped.
const ZONES = {
  hr: { lo: 40, hi: 120, okLo: 60, okHi: 100 },
  bp: { lo: 80, hi: 160, okLo: 90, okHi: 120 },
  glucose: { lo: 54, hi: 200, okLo: 70, okHi: 140 }, // mg/dL; 70–140 = healthy range over a day incl. after meals (Shah 2019, 96% of time)
  spo2: { lo: 88, hi: 100, okLo: 95, okHi: 100 },
};

function RangeBar({ zone, value }: { zone: { lo: number; hi: number; okLo: number; okHi: number }; value: number }) {
  const p = (v: number) => `${Math.max(0, Math.min(100, ((v - zone.lo) / (zone.hi - zone.lo)) * 100))}%`;
  return (
    <span className="range" aria-hidden="true">
      <i className="ok" style={{ left: p(zone.okLo), width: `calc(${p(zone.okHi)} - ${p(zone.okLo)})` }} />
      <b style={{ left: p(value) }} />
    </span>
  );
}

// Where the drink is right now, as a row of circles: bigger and brighter = more of it there.
function Journey({ steps, unit, minute, selected, onPick }: {
  steps: { label: string; organ: string; amount: (m: number) => number }[]; unit: string; minute: number;
  selected: string | null; onPick: (o: string | null) => void;
}) {
  const vals = steps.map((s) => s.amount(minute));
  const max = Math.max(1e-9, ...vals);
  const lead = vals.indexOf(Math.max(...vals));
  return (
    <div className="journey" aria-label={`Where it is now, in ${unit}`}>
      {steps.map((s, i) => {
        const f = vals[i] / max;
        return (
          <span key={s.label} className="jstep">
            {i > 0 && <i className="jarrow" aria-hidden="true">→</i>}
            <button className={`jdot ${i === lead && vals[i] > 0.001 ? 'lead' : ''} ${selected === s.organ ? 'on' : ''}`} onClick={() => onPick(selected === s.organ ? null : s.organ)}
              aria-label={`${s.label}: ${vals[i].toFixed(1)} ${unit}`}>
              <span className="jc" style={{ transform: `scale(${0.35 + 0.65 * Math.sqrt(f)})`, opacity: 0.25 + 0.75 * f }} />
              <span className="jl">{s.label}</span>
            </button>
          </span>
        );
      })}
    </div>
  );
}

function Readings({ you, sim, twin, profile, minute, onOpen, vitalClaims, name, insulin, energy }: {
  you: Vitals; sim: Timeline; twin: Vitals; profile: Profile; minute: number; onOpen: (t: string, c: string[]) => void;
  vitalClaims: Record<'caffeine' | 'hr' | 'bp' | 'glucose' | 'spo2', string[]>; name: string; insulin?: Float64Array;
  energy: { total: number; absorbed: (m: number) => number };
}) {
  const g = (v: number) => formatGlucose(v, profile.glucoseUnit);
  const whole = (v: number) => v.toFixed(0);
  const rows = [
    { key: 'hr', label: 'Pulse', unit: 'bpm', y: you.hr, t: twin.hr, eff: you.effect.hr, f: whole },
    { key: 'bp', label: 'Blood pressure', unit: 'mmHg', y: you.sbp, t: twin.sbp, y2: you.dbp, t2: twin.dbp, eff: you.effect.sbp, f: whole },
    { key: 'glucose', label: 'Blood sugar', unit: profile.glucoseUnit, y: you.glucose, t: twin.glucose, eff: you.effect.glucose, f: g },
    { key: 'spo2', label: 'Oxygen', unit: '%', y: you.spo2, t: twin.spo2, eff: you.effect.spo2, f: (v: number) => v.toFixed(1) },
  ] as const;
  const asleep = at(you.asleep, minute) > 0.5;
  const caf = at(sim.conc, minute);
  return (
    <section className="readings" aria-label="Your readings">
      <div className="rtitle">Your readings <span><i className="you" />you <i className="tw" />healthy, same size</span></div>
      <div className={`state ${asleep ? 'sleep' : ''}`}>{asleep ? 'Asleep · your body’s night rhythm' : 'Awake · resting'}</div>
      <div className="reading energy">
        <span className="rl">Energy from this {name}</span>
        <span className="rv">{Math.round(energy.absorbed(minute))}<small>/ {energy.total} kcal</small></span>
        <span className="rd">{energy.total === 0 ? 'no calories' : energy.total < 10 ? 'almost none' : 'reached your blood so far'}</span>
        <span className="rt" />
        <span className="ebar2"><i style={{ width: `${energy.total ? (100 * energy.absorbed(minute)) / energy.total : 0}%` }} /></span>
      </div>
      {sim.doseMg >= 1 && (
        <button className="reading caf" onClick={() => onOpen('Caffeine in blood', vitalClaims.caffeine)}>
          <span className="rl">Caffeine in blood</span>
          <span className="rv">{caf.toFixed(2)}<small>mg/L</small></span>
          <span className="rd">{Math.round(at(sim.body, minute))} mg in your body</span>
          <span className="rt" />
          <Spark y={sim.conc} minute={minute} asleep={you.asleep} />
        </button>
      )}
      {insulin && (
        <button className="reading" onClick={() => onOpen('Insulin', ['KB2', 'KK3'])}>
          <span className="rl">Insulin (above your baseline)</span>
          <span className="rv">+{at(insulin, minute).toFixed(0)}<small>mU/L</small></span>
          <span className={`rd ${at(insulin, minute) >= 1 ? 'up' : ''}`}>{at(insulin, minute) >= 1 ? 'pancreas responding to sugar' : 'back to normal'}</span>
          <span className="rt" />
          <Spark y={insulin} minute={minute} asleep={you.asleep} />
        </button>
      )}
      {rows.map((r) => {
        const now = at(r.y, minute);
        const v2 = 'y2' in r ? at(r.y2, minute) : null;
        const tw = at(r.t, minute), tw2 = 't2' in r ? at(r.t2, minute) : null;
        const raw = at(r.eff, minute);
        const e = r.key === 'glucose' && profile.glucoseUnit === 'mmol/L' ? raw / 18.016 : raw;
        const shown = Math.abs(e) < (r.key === 'glucose' ? 0.05 : 0.5) ? 'no effect' : `${e > 0 ? '+' : ''}${e.toFixed(1)} ${r.unit}`;
        return (
          <button key={r.key} className="reading" onClick={() => onOpen(r.label, vitalClaims[r.key])}>
            <span className="rl">{r.label}</span>
            <span className="rv">{r.f(now)}{v2 !== null && `/${r.f(v2)}`}<small>{r.unit}</small></span>
            <span className={`rd ${shown === 'no effect' ? '' : 'up'}`}>{name}: {shown}</span>
            <span className="rt">healthy {r.f(tw)}{tw2 !== null && `/${r.f(tw2)}`}</span>
            {/* vitals are stored in mg/dL whatever the display unit */}
            <RangeBar zone={ZONES[r.key]} value={now} />
            <Spark y={r.y} t={r.t} minute={minute} asleep={you.asleep} warnAbove={r.key === 'glucose' ? 140 : undefined} />
          </button>
        );
      })}
      <p className="rnote">Lines follow your body’s natural day and night. Blood sugar is a typical response, not personalised. Tap a reading to see why.</p>
    </section>
  );
}

const SW = 240, SH = 34, SN = 120;
const SPARK_XS = Array.from({ length: SN + 1 }, (_, i) => minutesFromU(i / SN));

// The curve only depends on the data, so it is computed once per data change; each frame moves just the dot.
let sparkId = 0;
function Spark({ y, t, minute, asleep, warnAbove }: { y: Float64Array; t?: Float64Array; minute: number; asleep: Float64Array; warnAbove?: number }) {
  const [clip] = useState(() => `spk${sparkId++}`);
  const g = useMemo(() => {
    const ys = SPARK_XS.map((m) => at(y, m));
    const ts = t ? SPARK_XS.map((m) => at(t, m)) : null;
    let lo = Math.min(...ys, ...(ts ?? [])), hi = Math.max(...ys, ...(ts ?? []));
    if (warnAbove !== undefined && hi < warnAbove * 1.02) hi = Math.max(hi, Math.min(warnAbove, hi + (hi - lo))); // keep scale honest near the line
    if (hi - lo < 1e-6) { lo -= 1; hi += 1; }
    const Y = (v: number) => SH - 3 - ((v - lo) / (hi - lo)) * (SH - 6);
    const p = (s: number[]) => s.map((v, i) => `${i ? 'L' : 'M'}${((i / SN) * SW).toFixed(1)},${Y(v).toFixed(1)}`).join('');
    const same = !ts || ys.every((v, i) => Math.abs(v - ts[i]) < 1e-9);
    const night: [number, number][] = []; // where the person is asleep
    let start = -1;
    SPARK_XS.forEach((m, i) => { const s = at(asleep, m) > 0.5; if (s && start < 0) start = i; if ((!s || i === SN) && start >= 0) { night.push([start, i]); start = -1; } });
    const warnY = warnAbove !== undefined && warnAbove < hi ? Y(warnAbove) : null;
    return { Y, you: p(ys), twin: !same && ts ? p(ts) : null, night, warnY };
  }, [y, t, asleep, warnAbove]);
  return (
    <svg className="spark" viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="none" aria-hidden="true">
      {g.night.map(([a, b]) => <rect key={a} x={(a / SN) * SW} width={((b - a) / SN) * SW} y={0} height={SH} className="night" />)}
      {g.twin && <path d={g.twin} className="tw" />}
      <path d={g.you} className="you ok" />
      {g.warnY !== null && <>
        <defs><clipPath id={clip}><rect x={0} y={0} width={SW} height={g.warnY} /></clipPath></defs>
        <line x1={0} x2={SW} y1={g.warnY} y2={g.warnY} className="warnline" />
        <path d={g.you} className="you warn" clipPath={`url(#${clip})`} />
      </>}
      <circle cx={uFromMinutes(minute) * SW} cy={g.Y(at(y, minute))} r="2.5" className="dot" />
    </svg>
  );
}

const TICKS: [number, string][] = [[0, '0'], [10, '10 min'], [60, '1 h'], [360, '6 h'], [1440, '24 h']];

function TimelineBar({ u, minute, playing, togglePlay, setU, stages, stageIndex, jump, toBed, bedLabel, drinkAt }: {
  stages: Stage[];
  u: number; minute: number; playing: boolean; togglePlay: () => void; setU: (v: number) => void;
  stageIndex: number; jump: (m: number) => void; toBed: number; bedLabel: string; drinkAt: number;
}) {
  return (
    <footer className="timeline">
      <button className="play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
      <div className="track">
        <div className="rail"><i style={{ width: `${u * 100}%` }} /></div>
        {stages.map((s, i) => (
          <button key={s.min} className={`mark ${i === stageIndex ? 'on' : ''} ${i < stageIndex ? 'past' : ''}`} style={{ left: `${uFromMinutes(s.min) * 100}%` }}
            onClick={() => jump(s.min)} aria-label={`${s.title} at ${hhmm(drinkAt + s.min)}`}>
            <span className="tip">{s.title}</span>
          </button>
        ))}
        {toBed > 0 && toBed <= MAX_MIN && (
          <button className="mark bed" style={{ left: `${uFromMinutes(toBed) * 100}%` }} onClick={() => jump(toBed)} aria-label={`Bedtime ${bedLabel}`}>
            <span className="tip">Bedtime {bedLabel}</span>
          </button>
        )}
        <input type="range" min={0} max={1000} value={Math.round(u * 1000)} aria-label="Time after drinking" aria-valuetext={sinceText(minute, 'drink')}
          onChange={(e) => setU(+e.target.value / 1000)} />
        <div className="ticks">{TICKS.map(([m, l]) => <span key={l} style={{ left: `${uFromMinutes(m) * 100}%` }}>{l}</span>)}</div>
      </div>
    </footer>
  );
}

function LevelKey() {
  return (
    <div className="levelkey">
      {(['A', 'B', 'C', '?'] as const).map((l) => <div key={l}><i className={`lv lv-${l === '?' ? 'q' : l}`}>{l}</i>{LEVEL_LABEL[l]}</div>)}
    </div>
  );
}

function About({ onMethod }: { onMethod: () => void }) {
  return (
    <div className="about">
      <p><button className="link" onClick={() => window.dispatchEvent(new Event('i24-tour'))}>Show the quick guide again</button> · <button className="link" onClick={onMethod}>How we know: models, evidence levels, sources →</button></p>
      <p><b>Inside 24h</b> shows what one food or drink does inside a body like yours, minute by minute for a whole day: where it goes, how much is where, and what it changes. It is free.</p>
      <h3>Not medical advice</h3>
      <p>This is an educational simulation of a typical healthy adult with your size, age and city. Real people differ a lot (the same meal can raise blood sugar twice as much in one person as in another). Do not use it to diagnose, treat, dose medicine, or decide whether you can drive. If you have diabetes, a heart, kidney or liver condition, are pregnant or take medication, ask your doctor.</p>
      <h3>Your privacy</h3>
      <p>Everything is calculated in your browser. What you type (your body, your city, your food) is not sent anywhere and is not stored by us.</p>
      <h3>How sure are we?</h3>
      <p>Every statement carries a level of evidence and its sources (tap “How do we know?”). Estimates show how we calculated them, and anything not yet studied says so.</p>
      <LevelKey />
      <p><b>A</b> rests on consistent human studies or official bodies such as EFSA. <b>B</b> rests on human studies that are small or vary a lot. <b>C</b> is our own calculation from published numbers. <b>?</b> means nobody has measured it yet.</p>
      <h3>Data</h3>
      <p>Food values: USDA FoodData Central (SR Legacy). Glycaemic index: international GI tables (Atkinson 2008). Weather: ERA5 reanalysis via Open-Meteo and NASA POWER (typical day for the month, not a live forecast).</p>
      <p>Anatomy: <a href={SOURCES.bodyparts3d.url} target="_blank" rel="noreferrer">BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution 4.0 International</a>.</p>
    </div>
  );
}

function Support() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); setCopied(text); } catch { setCopied(null); } };
  return (
    <div className="about support">
      <p>Inside 24h is free and has no ads. If it helped you, you can support new foods, better science and the daily videos.</p>
      <h3>PayPal</h3>
      {SUPPORT.paypalUrl
        ? <a className="primary supportbtn" href={SUPPORT.paypalUrl} target="_blank" rel="noreferrer">Donate with PayPal</a>
        : <p className="note">Coming soon.</p>}
      <h3>Crypto</h3>
      {SUPPORT.crypto.length ? SUPPORT.crypto.map((c) => (
        <div key={c.coin} className="wallet"><b>{c.coin}</b><code>{c.address}</code>
          <button className="ghost" onClick={() => copy(c.address)}>{copied === c.address ? 'Copied' : 'Copy'}</button></div>
      )) : <p className="note">Coming soon.</p>}
      <p className="note">Thank you. Every donation goes into research and the app.</p>
    </div>
  );
}

function StageError({ error }: { error: unknown }) {
  return (
    <div className="stage-error" role="alert">
      <b>The 3D body could not load.</b>
      <p>Everything else still works. Technical detail: {error instanceof Error ? error.message : String(error)}</p>
    </div>
  );
}
