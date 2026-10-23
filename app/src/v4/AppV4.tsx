// Build 0.4 layout: one screen. Left: what is happening now. Centre: the body. Right: your readings.
// Bottom: the 24 h timeline. Evidence and the profile open in side panels on demand.
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RootState } from '@react-three/fiber';
import { flushSync } from 'react-dom';
// three.js / r3f / drei and the scene load lazily (hosted build: a separate chunk), see ./lazy3d
import { advance, Body, CameraRig, CompareScene, ExposeState, Flow, FlowPaths, LiquidRoute, OrbitControls, SafeCanvas } from './lazy3d';
import type { Glow } from '../scene/Body';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { ClaimRow } from '../ui/ClaimRow';
import { SOURCES } from '../content/sources';
import { LEVEL_LABEL, type Claim, type Stage } from '../content/types';
import { DEFAULT_PROFILE, formatGlucose, healthyTwin, type Profile } from '../science/profile';
import { at, type Timeline } from '../science/espressoSim';
import { buildVitals, caffeineLatencyMin, sleepConc, sleepRiskOf, type Vitals } from '../science/daily';
import { sleepAnchors } from '../science/anchors';
import { MAX_MIN, minutesFromU, uFromMinutes } from '../time';
import { Drawer } from './Drawer';
import { CATALOG, type CatalogItem } from './catalog';
import { PRODUCTS, type WhereRow } from './products';
import { BodyStart } from './BodyStart';
import { StoryPanel } from './StoryPanel';
import { chapterText } from './stories';
import { useModal, prefersReducedMotion } from './a11y';
import { SEG_LABEL, type SegId, type SegState } from '../scene/segments';
import type { Bounds } from '../scene/Body';
import { RULES, type Habits } from './healthBars';
import { bodyStatus } from './status';
import { StatusLights, StatusStrips } from './StatusBar';
import { canEncode, captionOf, composeCmpFrame, composeFrame, recordCompare, stampFor, type CmpOverlay, type CmpSide, record, recordFrames, saveFile, type Format, type Overlay } from './share';
import { planCompare, planVideo, type Plan } from './video-plan';
import { verdict, worstMoment } from './status';

const ICON_OF = { energy: '⚡', heart: '❤', water: '💧', brain: '🧠' } as const;
const SHORT_OF = { energy: 'Blood sugar', heart: 'Heart', water: 'Water', brain: 'Brain' } as const; // fits the video chips; never "Sugar" alone (status.ts SHORT_LABEL)
import { cityLabel, climateNow, findCity } from './climate/cities';
import { simulateHydration } from '../science/hydration';
import { SUPPORT } from './support';
import { Passport } from './Passport';
import { Tour } from './Tour';
import { CalmBar } from './CalmBar';
import { Answers, mealLinesFor, quickAnswers } from './Answers';
import { personalNotes } from '../science/personal';
import { Disclaimer, HowWeKnow } from './HowWeKnow';
import { videoSupportHere } from './share';
import { bacRangeText, glucoseRangeTextIn } from '../science/ranges';
import { Compare, EveryDay, Pro, VideoFallback, YourBody } from './lazyUi'; // loaded on first use
import { isTouch } from './perf/device';
import { analyze, sugarDeltaText, sugarPeakText, verdictOf, type Analysis } from './analyze';
import { SwapCard, useSwap } from './Swap';
import { formatTime, isCuratedServing, linkFor, mealText, own, PORTIONS, resolveLink, writeLink } from './deeplink';
import { MealBar } from './MealBar';
import { drawMomentCard } from './shareCard';
import { MomentShare, type Moment } from './MomentShare';


import { SmartSearch } from './SmartSearch';
import { isPlain, macros, parseMeal, readPace, servingPart, sizesOf, suggest, type Food, type Part } from './food/parse';
import { canPace, paceLabel, paceMatters, setFood } from './food/meal';
import { makeFoodProduct } from './food/foodProduct';

// Water each drink brings (ml): espresso 30 ml shot, cola 330 ml can (≈ 89% water), water 250 ml glass.
const WATER_ML: Record<string, number> = { espresso: 29, cola: 295, water: 250 };
const PROFILE_KEY = 'i24-profile';
// UX calm 2026-10-19: the first visit no longer starts with two full screens (about you, then choose). The body is
// visible at once with one question under it; "about you" became a small "Personalize" prompt a few seconds into the
// first simulation (and a link in the start sheet). Set to true to bring back the old two-step start screens.
const LEGACY_START = false;
const PERSONAL_KEY = 'i24-personalized'; // '1' once the person personalized or said "not now"
const FLOW_KEY = 'i24-start-v2'; // '1' once this browser ran the calm first screen (2026-10-19+): see `personalized`
const NUDGE_AFTER_MS = 9000;
const START_TILES = [
  { q: 'cola', name: 'Cola', sub: '330 ml can', color: '#2a120a' },
  { q: 'espresso', name: 'Espresso', sub: '1 shot', color: '#2b1608' },
  { q: 'beer', name: 'Beer', sub: '0.5 l', color: '#e5a823' },
  { q: 'pizza', name: 'Pizza', sub: '1 slice', color: '#e8b04a', solid: true },
  { q: '1 banana', name: 'Banana', sub: '1 medium', color: '#f1de8c', solid: true },
  { q: 'water', name: 'Water', sub: '250 ml glass', color: '#cfe8ff' },
  { q: '1 apple', name: 'Apple', sub: '1 medium', color: '#c8e06a', solid: true },
  { q: 'glass of milk', name: 'Milk', sub: '250 ml glass', color: '#f4f1ea' },
];
const CMP_STOPS = [0, 5, 20, 45, 90, 180, 360, 720, 1440];
const CMP_SHORT = [0, 20, 90, 1440];
const T50_OF: Record<string, number> = { espresso: 13, cola: 32, water: 13 }; // gastric half-times of the curated models
// Database foods that match a health-bar item (healthBars.ts ITEM_FX)
const HABIT_OF: Record<string, string> = { banana: 'banana', 'bread-white': 'bread', pizza: 'pizza', 'orange-juice': 'juice', 'green-tea': 'tea', beer: 'beer', 'red-wine': 'wine', 'white-wine': 'wine', 'chocolate-milk-bar': 'chocolate' };
// Default servings of these have their own, more detailed models (level A/B) instead of the generic one
const CURATED = new Set(['espresso', 'cola', 'water']);
// 2026-10-18: links are written by deeplink.linkFor (exact text, or v/add/on for another kind); the old text form was:
// const canonical = (parts: Part[]) => parts.map((p) => `${Math.round(p.grams)} g ${p.food.name.replace(/\s*\(.*\)$/, '')}`).join(' + ');

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

// Deep link for every moment (deeplink.ts): #q=<food>&n=<½·1·2·3>&t=<45m>&view=<full|detailed>&vs=<partner>,
// plus older keys (#p=<product>, #t=<minutes>, #compare=, organ, dose, city). A given t opens paused at that minute.
// Any link must open something sensible: unknown foods/partners are reported (LINK_MISS / VS_MISS), never a crash.
const HASH = (() => { try { return new URLSearchParams(window.location.hash.slice(1)); } catch { return new URLSearchParams(); } })();
const RESOLVED = resolveLink(window.location.hash, (id) => !!own(PRODUCTS, id));
const LINK = RESOLVED.link;
const HASH_T = LINK.t;
const HASH_DOSE = Math.max(20, Math.min(330, Number(HASH.get('dose')) || 63));
// a named size ("0.3 l", "Whole") reads as itself; other multiples as "2 × 1 slice"
const scaleParts = (base: Part[], f: number) => (f === 1 ? base : base.map((p) => {
  const z = base.length === 1 ? sizesOf(p.food)?.find((x) => Math.abs(x.mult - f) < 1e-6) : undefined;
  const label = z ? (/\b(ml|l|dl|cl)$/.test(z.label) ? z.label : `${z.label} · ${Math.round(p.grams * f)} g`) : `${f === 0.5 ? '½ ×' : `${f} ×`} ${p.amountLabel}`;
  return { ...p, grams: p.grams * f, amountLabel: label };
}));
const LINK_MULT = RESOLVED.mult; // n, or the named size (#s=whole)
// curated products (#q=cola) reopen in their own detailed model, like picking them in the app
const LINK_BASE: Part[] = RESOLVED.base;
const LINK_MISS = RESOLVED.miss; // "#q=zzzz": we say we don't have it and open the search, instead of showing espresso
const LINK_FOOD = LINK_BASE.length > 0 || !!(LINK.p && own(PRODUCTS, LINK.p)); // the link names a food: open it, skip the start screen
const HASH_Q = LINK_BASE.length && !(LINK_MULT === 1 && isCuratedServing(LINK_BASE)) ? scaleParts(LINK_BASE, LINK_MULT) : [];
// A link whose text carries its own amount ("#q=2 piva kroz 3 sata", "#q=3 beers"): "How much?" counts from ONE serving,
// as after a pick in the search (pickFood), so the sizes mean what they say and the amount shows (QA 2026-10-19).
const LINK_SOLO = LINK_BASE.length === 1 && LINK_MULT === 1 ? LINK_BASE[0] : null;
const LINK_TYPED = LINK_SOLO ? Math.round((LINK_SOLO.grams / LINK_SOLO.food.serving.grams) * 1e4) / 1e4 : 1;
const LINK_TYPED_ON = LINK_SOLO !== null && Number.isFinite(LINK_TYPED) && LINK_TYPED > 0 && Math.abs(LINK_TYPED - 1) > 1e-3;
const HASH_P = HASH_Q.length ? 'food' : LINK_BASE.length && isCuratedServing(LINK_BASE) ? LINK_BASE[0].food.id : own(PRODUCTS, LINK.p) ? LINK.p! : 'espresso';
const HASH_ORGAN = (() => { const o = HASH.get('organ'); return o && /^[a-z_]{2,24}$/.test(o) ? o : null; })();

interface Evidence { title: string; claims: string[] }

/** Latest clock time (5-min steps, from 06:00) to have this caffeine and still fall asleep on time; null if none needed. */
function latestForSleep(sim: Timeline, p: Profile): number | null {
  if (sim.doseMg < 10) return null;
  const anchors = sleepAnchors();
  let best: number | null = null;
  // "best" = below the cautious level of the meta-analysis (VS1), not merely below a 5-min delay: the same scale as
  // the sleep answer, so "Any time today" never sits next to "sensitive people may sleep less"
  for (let t = 6 * 60; t < p.bedtimeMin; t += 5) {
    const toBed = p.bedtimeMin - t;
    const c = sleepConc(sim.conc, toBed);
    if (sleepRiskOf(caffeineLatencyMin(c, anchors), c, anchors) !== 'none') break; // later is never better
    best = t;
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
  const [playing, setPlaying] = useState(HASH_T === null && LINK_FOOD && !prefersReducedMotion()); // a link with a minute opens paused there; reduced motion: no autoplay, Play starts it
  // false = show the "what did you have?" start screen (also when the link names a food we don't have)
  const [started, setStarted] = useState(!LINK_MISS && (HASH_T !== null || LINK_FOOD));
  const [missText, setMissText] = useState<string | null>(LINK_MISS ?? null);
  // a short note at the top when a link asked for something we could not open (e.g. an unknown comparison partner)
  const [linkNote, setLinkNote] = useState<string | null>(RESOLVED.vsMiss ? `We don’t have “${RESOLVED.vsMiss.slice(0, 40)}” yet, so there’s nothing to compare it with. Showing the first food on its own.` : null);
  useEffect(() => { if (!linkNote) return; const id = setTimeout(() => setLinkNote(null), 9000); return () => clearTimeout(id); }, [linkNote]);
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
  const [selected, setSelected] = useState<string | null>(HASH_ORGAN);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [panel, setPanel] = useState<'body' | 'you' | 'about' | 'every' | 'rules' | 'colours' | 'support' | 'pro' | 'method' | null>(
    (['body', 'about', 'every', 'rules', 'colours', 'support', 'pro'] as const).find((x) => x === HASH.get('panel')) ?? null);
  const [sceneError, setSceneError] = useState<unknown>(null);
  const [touched, setTouched] = useState(false);
  const [productId, setProductId] = useState(HASH_P);
  const [mode, setMode] = useState<'simple' | 'detailed'>(HASH.get('view') === 'detailed' ? 'detailed' : 'simple');
  const [bodyAsked, setBodyAsked] = useState(() => { if (!LEGACY_START || LINK_MISS || HASH_T !== null || LINK_FOOD) return true; try { return !!localStorage.getItem(PROFILE_KEY); } catch { return false; } });
  // "Personalize": offered once, unobtrusively, a few seconds into the first simulation (never a blocking screen)
  // Polish 2026-10-20: a returning visitor whose profile was saved before this prompt existed (the old step 1, "Tell
  // us about you") already answered it: no prompt. FLOW_KEY marks browsers that have run the new flow, so a profile
  // saved by the new flow itself (it saves the typical body on the first visit) does not count as an answer.
  const [personalized, setPersonalized] = useState(() => {
    try {
      if (localStorage.getItem(PERSONAL_KEY) === '1') return true;
      const legacy = !!localStorage.getItem(PROFILE_KEY) && !localStorage.getItem(FLOW_KEY);
      localStorage.setItem(FLOW_KEY, '1');
      if (legacy) localStorage.setItem(PERSONAL_KEY, '1');
      return legacy;
    } catch { return false; }
  });
  const markPersonal = useCallback(() => { setPersonalized(true); try { localStorage.setItem(PERSONAL_KEY, '1'); } catch { /* storage blocked */ } }, []);
  const [nudge, setNudge] = useState(false);
  const [habits, setHabits] = useState<Habits>({});
  const [foodParts, setFoodParts] = useState<Part[]>(HASH_Q);
  // "Over how long?" (PACING, 2026-10-19): minutes the servings are spread over; 0 = all at once (every older link).
  // Only for two or more servings (or a meal with two or more drinks); a new food starts at all at once again.
  const [over, setOver] = useState(LINK.over ?? 0);
  const [paceTouched, setPaceTouched] = useState(LINK.over !== undefined); // highlighted until picked (several drinks)
  const paceable = productId === 'food' && canPace(foodParts);
  const overEff = paceable ? over : 0;
  const def = useMemo(() => (productId === 'food' && foodParts.length ? makeFoodProduct(foodParts, 'food', overEff) : own(PRODUCTS, productId) ?? PRODUCTS.espresso), [productId, foodParts, overEff]);
  const habitId = productId === 'food' ? (foodParts.length === 1 ? HABIT_OF[foodParts[0].food.id] ?? 'food' : 'food') : productId;
  const PRODUCT = def.content;
  const lower = PRODUCT.name.toLowerCase();

  const [wholeBody, setWholeBody] = useState(false);
  const [ansOpen, setAnsOpen] = useState(false); // quick-answers bottom sheet (phones, tablets)
  const [menuOpen, setMenuOpen] = useState(false); // header "⋯" menu (phones)
  const [videoOpen, setVideoOpen] = useState(false); // "Make a video" part of the share dialog
  // The 3D body is the heaviest thing on the page (model decode, shaders). Behind the opaque start screen nobody
  // sees it, so it mounts once the browser is idle (or at once when a link opens a food) and does not animate
  // until something is chosen: the start screen stays smooth on slow phones.
  const [show3d, setShow3d] = useState(() => !LINK_MISS && (HASH_T !== null || LINK_FOOD));
  useEffect(() => {
    if (show3d) return;
    if (started) { setShow3d(true); return; }
    // step 1 (about you) takes a while to fill in: wait a little; step 2 (choose a food): as soon as the browser is idle
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    let idle = 0;
    const go = () => { if (w.requestIdleCallback) idle = w.requestIdleCallback(() => setShow3d(true), { timeout: 2000 }); else setShow3d(true); };
    const id = setTimeout(go, LEGACY_START && !bodyAsked ? 2500 : 0); // the body is visible on the first screen now
    return () => { clearTimeout(id); if (idle) w.cancelIdleCallback?.(idle); };
  }, [show3d, started, bodyAsked]);
  // Calm = the default for everyone: body, one sentence, play. 'Full' adds the lights, the trip and the steps.
  const [calm, setCalm] = useState(HASH.get('view') !== 'full');
  const calmNow = mode === 'simple' && calm;
  // the "Personalize" prompt: a few seconds after the first simulation starts; gone for good once used or dismissed
  useEffect(() => {
    if (!started || personalized || nudge) return;
    const id = setTimeout(() => setNudge(true), NUDGE_AFTER_MS);
    return () => clearTimeout(id);
  }, [started, personalized, nudge]);
  useEffect(() => { if (panel === 'body') markPersonal(); }, [panel, markPersonal]); // found "Your body" on their own
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
      glucoseDeltaMgDl: unknownSugar ? undefined : g, extraSleepMin: vYou.extraLatencyMin, caffeineAtBedMg: vYou.mgAtBed, caffeineDoseMg: built.caffeine.doseMg, sleepRisk: vYou.sleepRisk, bac: built.bac, alcoholG: built.alcoholG, alcoholFed: built.alcoholFed, wakeMin: profile.wakeMin, waterMl: built.waterMl ?? WATER_ML[productId] ?? 0,
      latestForSleep: latestForSleep(built.caffeine, profile), personal: personalNotes(profile, built.caffeine.halfLifeH),
      mealLines: productId === 'food' ? mealLinesFor(foodParts, profile, overEff) : undefined, glucoseUnit: profile.glucoseUnit,
      pace: built.pace, canPace: paceable });
  }, [systems, profile, built, vYou, productId, foodParts, overEff, paceable]);
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
  const [portion, setPortion] = useState(LINK_TYPED_ON ? LINK_TYPED : LINK_BASE.length ? LINK_MULT : 1);
  const [portionBase, setPortionBase] = useState<Part[] | null>(LINK_TYPED_ON && LINK_SOLO ? [servingPart(LINK_SOLO.food, 1)] : LINK_BASE.length && LINK_MULT !== 1 ? LINK_BASE : null);
  const applyPortion = (f: number) => {
    const base = portionBase ?? currentParts;
    setPortionBase(base); setPortion(f);
    const one = base.length === 1 ? base[0] : null;
    if (f === 1 && one && isPlain(one.food) && CURATED.has(one.food.id) && Math.abs(one.grams - one.food.serving.grams) < 1) { setProductId(one.food.id); return; }
    setFoodParts(scaleParts(base, f));
    setProductId('food');
  };
  // "Which tea?" stays highlighted until the person picks (the text named several foods)
  const [asking, setAsking] = useState(LINK_BASE.length === 1 && !!LINK_BASE[0].ask);
  const [linkChosen, setLinkChosen] = useState(!!(LINK.v || LINK.on || LINK.add)); // a link that names the kind opens with the pill
  // the 1-serving parts and the named sizes of a single food ("How much?" shows Slice · Half · Whole)
  const baseParts = portionBase ?? currentParts;
  const sizes = baseParts.length === 1 ? sizesOf(baseParts[0].food) : null;
  /** Another kind of item i (Which …? chips, toppings, add-ins): the minute, play state and size stay. */
  const switchFood = (i: number, food: Food) => {
    setAsking(false);
    const nb = setFood(baseParts, i, food);
    // A named size of the old kind ("Double" espresso) stays only if the new kind has that same size (beer 0.3 l →
    // light beer 0.3 l, whole pizza → whole pepperoni); else back to 1 (a double espresso is not 2 mugs of filter
    // coffee). A count ("3 beers" → Light) stays: 3 light beers, not 1 (QA 2026-10-19).
    const newSizes = nb.length === 1 ? sizesOf(nb[0].food) : null;
    const wasSize = sizes?.find((x) => Math.abs(x.mult - portion) < 1e-6 && x.mult !== 1);
    const f = !wasSize || newSizes?.some((x) => x.k === wasSize.k && Math.abs(x.mult - portion) < 1e-6) ? portion : 1;
    setPortion(f); setPortionBase(f === 1 ? null : nb);
    if (f === 1 && isCuratedServing(nb)) { setProductId(nb[0].food.id); return; }
    setFoodParts(scaleParts(nb, f)); setProductId('food');
  };
  const [compare, setCompare] = useState<{ with?: Part[] } | null>(() => (RESOLVED.vs ? { with: RESOLVED.vs } : null));
  const [vsParts, setVsParts] = useState<Part[] | null>(null); // the partner currently chosen inside Compare
  const answersBlock = (<>
    <Answers list={answers} onHow={() => setPanel('method')} onBody={() => setPanel('body')} />
    {swap && peakNow !== null && <SwapCard swap={swap} peakNow={peakNow} unit={profile.glucoseUnit} onCompare={() => setCompare({ with: swap.parts })} />}
  </>);
  const stageIndex = PRODUCT.stages.reduce((acc, s, i) => (minute >= s.min ? i : acc), 0);
  const stage = PRODUCT.stages[stageIndex];
  const head = def.headline(stage.min, built, profile, vYou.extraLatencyMin);
  // story view: the current chapter follows the clock; arrows and chapter buttons jump to a chapter
  const story = built.story;
  const chapterIdx = story.chapters.reduce((acc, c, i) => (minute + 1e-6 >= c.min ? i : acc), 0);
  const chapter = story.chapters[chapterIdx];
  // Full view: keep the current step visible in the scrolling row of steps at the bottom (phones show only 2–3)
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('nav.moments');
    const on = nav?.querySelector<HTMLElement>('.moment.on');
    if (!nav || !on || nav.scrollWidth <= nav.clientWidth) return;
    const left = on.offsetLeft - (nav.clientWidth - on.offsetWidth) / 2;
    try { nav.scrollTo({ left, behavior: prefersReducedMotion() ? 'auto' : 'smooth' }); } catch { nav.scrollLeft = left; }
  }, [chapterIdx, mode, calm, productId]);
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
    setPortion(1); setPortionBase(null); setOver(0);
    setProductId(item.id); setMissText(null);
    setNotice(null); setStarted(true); setSelected(null); setWholeBody(false); setU(0); setPlaying(!prefersReducedMotion());
  };
  /** `keepPace`: the meal itself changed (an amount, an item added or removed), so "Over how long?" stays */
  // typed "… kroz 2 sata" / "… over 2 hours" sets "Over how long?" too (QA 2026-10-19)
  const chooseFood = (parts: Part[], text?: string) => pickFood(parts, false, text ? readPace(text) : 0);
  const changeMeal = (parts: Part[]) => pickFood(parts, true);
  const pickFood = (parts: Part[], keepPace: boolean, said = 0) => {
    if (!parts.length) return;
    setLinkChosen(false);
    // One food at another amount ("3 piva", "2 slices of pizza", "200 g riže"): "How much?" counts from ONE serving,
    // as for a link (#q=beer&n=3). Before, the typed amount became the base, so "3 beers" showed "0.5 l" as pressed and
    // "0.3 l" gave 0.6 × 3 beers; "Whole" on 2 slices gave 16 slices (QA 2026-10-19).
    const solo = parts.length === 1 ? parts[0] : null;
    const mult = solo ? Math.round((solo.grams / solo.food.serving.grams) * 1e4) / 1e4 : 1;
    if (solo && Number.isFinite(mult) && mult > 0 && Math.abs(mult - 1) > 1e-3) { setPortion(mult); setPortionBase([servingPart(solo.food, 1)]); }
    else { setPortion(1); setPortionBase(null); }
    const saidPace = said && canPace(parts) ? said : 0;
    if (!keepPace) { setOver(saidPace); setPaceTouched(saidPace > 0); }
    const one = parts.length === 1 ? parts[0] : null;
    setAsking(parts.length === 1 && !!parts[0].ask);
    if (one && isPlain(one.food) && CURATED.has(one.food.id) && Math.abs(one.grams - one.food.serving.grams) < 1) { choose(CATALOG.find((c) => c.id === one.food.id)!); return; }
    setFoodParts(parts); setProductId('food'); setMissText(null);
    setNotice(null); setStarted(true); setSelected(null); setWholeBody(false); setU(0); setPlaying(!prefersReducedMotion());
    try { history.replaceState(null, '', writeLink({ ...linkFor(parts), over: keepPace && canPace(parts) ? over : saidPace })); } catch { /* sandboxed: fine */ }
  };

  // ---- Share: hook → the whole day following the liquid → summary card, recorded into a Reel or a feed video ----
  const HOOK_OF: Record<string, string> = { cola: 'one can of cola', espresso: 'one espresso', water: 'one glass of water' };
  const hookWhat = productId === 'food' ? `${foodParts.map((p) => `${p.amountLabel} ${p.food.name.replace(/\s*\(.*\)$/, '').toLowerCase()}`).join(' + ')}${overEff ? ` over ${paceLabel(overEff)}` : ''}` : HOOK_OF[productId] ?? lower;
  // the video's name for what was eaten: "One can of cola", "Kebab / doner (1 kebab)", "Beer (3 × 500 ml over 2 h)",
  // a meal by its title "Hamburger + French fries + Cola" (amount labels in a row read like a receipt)
  const videoName = (() => {
    const pace = overEff ? ` over ${paceLabel(overEff)}` : '';
    if (productId !== 'food') { const s = HOOK_OF[productId] ?? lower; return s.charAt(0).toUpperCase() + s.slice(1); }
    if (foodParts.length !== 1) return `${PRODUCT.name}${pace}`;
    const p = foodParts[0], amt = p.amountLabel.replace(/\s*\(≈[^)]*\)/, '');
    return `${p.food.name.replace(/\s*\(.*\)$/, '')} (${amt.charAt(0).toLowerCase()}${amt.slice(1)}${pace})`;
  })();
  const overlayRef = useRef<Overlay | null>(null);
  const reelStops = useRef<number[] | null>(null);
  const [shortVid, setShortVid] = useState(false); // ≤ 30 s cut for Shorts / Reels (the full cut is 62-75 s)
  const [vidSound, setVidSound] = useState(true); // our own soundtrack in the video (video-audio.ts)
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
    hook: `${videoName}: what happens inside your body in 24 hours?`,
    title: PRODUCT.name,
    sub: `${profile.sex === 'female' ? 'Woman' : 'Man'}, ${profile.ageY} · ${profile.heightCm} cm · ${profile.weightKg} kg${city ? ` · ${city.name}` : ''}`,
    clock: hhmm(profile.drinkAtMin + recStop), step: recChapter.title, caption: captionOf(chapterText(recChapter, recStop)), color: story.color, progress: u, handle, stamp: stampFor(recStop, /bite/i.test(story.chapters[0]?.title ?? '')),
    pop: (() => {
      const mi = Math.min(1440, minute);
      const bac = built.bac ? at(built.bac, mi) : 0; // same minute and formatter as the body label and the chapter
      // a range, never one number (Widmark ±20–40%, alcohol.md W6)
      if (bac >= 0.1) return { big: bacRangeText(bac).replace(' ‰', ''), small: '‰ blood alcohol', level: (bac >= 0.5 ? 2 : 1) as 0 | 1 | 2 };
      const g = built.effects.glucoseMgDl ? at(built.effects.glucoseMgDl, mi) / 18.016 : 0;
      if (Math.abs(g) >= 0.5 && peakNow !== null) return { big: g > 0 ? glucoseRangeTextIn(g, profile.glucoseUnit).replace(/ .*$/, '') : profile.glucoseUnit === 'mg/dL' ? `${Math.round(g * 18.016)}` : g.toFixed(1), small: `${profile.glucoseUnit} ${g > 0 ? 'blood sugar rise right now (typical)' : 'blood sugar dip right now'}`, level: (g >= 3 || g <= -1 ? 2 : 1) as 0 | 1 | 2 };
      const caf = built.caffeine.doseMg >= 10 ? at(built.caffeine.body, mi) : 0;
      if (caf >= 20) return { big: `${Math.round(caf)} mg`, small: 'caffeine in you', level: (caf >= 200 ? 1 : 0) as 0 | 1 | 2 };
      return undefined;
    })(),
    where: (() => {
      const top = present[0];
      if (!top || !built.route) return undefined;
      const v = top[1].amount;
      return `${SEG_LABEL[top[0]]} · ${top[1].text ?? `${v >= 10 ? Math.round(v) : v.toFixed(1)} ${top[1].unit ?? built.route.unit}`}`;
    })(),
    lights: systems.map((s) => ({ icon: ICON_OF[s.key], label: SHORT_OF[s.key], level: s.levels[Math.round(Math.min(1440, minute))] as 0 | 1 | 2 })),
    summary: systems.map((s) => {
      const at0 = worstMoment(s), lvl = s.levels[at0] as 0 | 1 | 2;
      return { icon: ICON_OF[s.key], label: s.label, level: lvl, note: lvl === 0 ? 'Fine all day' : `${lvl === 1 ? 'Mild stress' : 'High stress'} at ${hhmm(profile.drinkAtMin + at0)}` };
    }),
  };
  const startShare = (format: Format) => {
    const canvas = document.querySelector<HTMLCanvasElement>('.stage canvas');
    if (!canvas || videoSupportHere() === 'none') { setShare({ state: 'nosupport' }); return; }
    if (share?.url) URL.revokeObjectURL(share.url);
    setMode('simple'); setSelected(null); setWholeBody(false); setFlightKey((k) => k + 1); setEvidence(null); setPanel(null);
    recRef.current = true; setU(0); setPlaying(false); setShare({ state: 'rec', format }); setRecPct(0);
    // frame-exact encoder where available (smooth on any computer), screen recording as a fallback; both follow the
    // same plan (video-plan.ts: reading-speed captions, 62-75 s or ≤ 30 s)
    const plan = reelPlan(), opts = { sound: vidSound, onTick: (f: number) => setRecPct(f) };
    const job = canEncode()
      ? recordFrames(canvas, format, () => overlayRef.current!, (m) => {
          // render one exact 1/30 s frame ourselves (works even when the browser throttles a background tab)
          flushSync(() => setU(uFromMinutes(m)));
          const st = r3f.current;
          if (st) advance(st.clock.elapsedTime + 1 / 30, true, st);
        }, plan, opts)
      : record(canvas, format, () => overlayRef.current!, (m) => setU(uFromMinutes(m)), plan, opts);
    job
      .then(({ blob, ext, audio }) => setShare({ state: 'ready', format, blob, ext, url: URL.createObjectURL(blob),
        msg: vidSound && !audio ? 'This browser couldn’t add our soundtrack, so the video is silent. Add a sound when you post it.' : undefined }))
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
  const cmpStops = useRef<number[] | null>(null); // the moments the comparison video stops at (video-plan.ts planCompare)
  if (cmpRec) {
    const m = minutesFromU(cmpRec.u), mi = Math.round(Math.min(1440, m));
    const mStop = (cmpStops.current ?? (shortVid ? CMP_SHORT : CMP_STOPS)).find((x) => x >= m - 0.01) ?? 1440; // text belongs to the moment we are heading to
    const side = (x: Analysis): CmpSide => {
      const segs = x.built.route?.segs(m);
      const top = segs ? (Object.entries(segs) as [SegId, SegState][]).filter(([, v]) => v.frac >= 0.04).sort((p, q) => q[1].frac - p[1].frac)[0] : undefined;
      const ch = x.built.story.chapters.reduce((acc, c) => (mStop + 1e-6 >= c.min ? c : acc), x.built.story.chapters[0]);
      const dg = x.glucose ? x.glucose[mi] / 18.016 : 0;
      const en = x.systems.find((s) => s.key === 'energy')!;
      return {
        name: x.name, color: x.color, step: ch.title, caption: captionOf(chapterText(ch, mStop), 95),
        where: top ? `${SEG_LABEL[top[0]]} · ${top[1].text ?? `${top[1].amount >= 10 ? Math.round(top[1].amount) : top[1].amount.toFixed(1)} ${top[1].unit ?? x.built.route!.unit}`}` : undefined,
        sugar: x.sugarPeak === null ? 'Blood sugar ?' : Math.abs(dg) < 0.15 ? 'Blood sugar steady' : `Blood sugar ${sugarDeltaText(dg, profile.glucoseUnit)}`, sugarLevel: en.levels[mi] as 0 | 1 | 2,
        lights: x.systems.map((s) => ({ icon: ICON_OF[s.key], label: SHORT_OF[s.key], level: s.levels[mi] as 0 | 1 | 2 })),
        summary: { kcal: x.kcal, sugarPeak: sugarPeakText(x.sugarPeak, profile.glucoseUnit),
          worst: x.systems.map((s) => { const w = worstMoment(s), l = s.levels[w] as 0 | 1 | 2; return { icon: ICON_OF[s.key], label: SHORT_OF[s.key], level: l, note: l === 0 ? 'fine all day' : `${l === 1 ? 'mild stress' : 'high stress'} at ${hhmm(profile.drinkAtMin + w)}` }; }) },
      };
    };
    cmpOverlayRef.current = { hook: `${cmpRec.a.name} or ${cmpRec.b.name}: which is better for your body?`, clock: hhmm(profile.drinkAtMin + mStop), progress: cmpRec.u, handle, stamp: stampFor(mStop), verdict: verdictOf(cmpRec.a, cmpRec.b), a: side(cmpRec.a), b: side(cmpRec.b) };
  }
  const makeCompareVideo = (a: Analysis, b: Analysis) => {
    setCompare(null); setCmpRec({ a, b, u: 0 }); setShare({ state: 'rec', format: 'reel' }); setRecPct(0);
    setTimeout(async () => {
      const ca = document.querySelector<HTMLCanvasElement>('.stage canvas');
      if (!ca) { setShare({ state: 'error', msg: 'We couldn’t prepare the two bodies. Please try again.' }); setCmpRec(null); return; }
      try {
        flushSync(() => setCmpNever(true)); // bodies are loaded: from now on only the recorder draws frames
        // each side's words at each moment (as on screen); planCompare sets the reading times and the length
        const chap = (x: Analysis, at: number) => x.built.story.chapters.reduce((acc, c) => (at + 1e-6 >= c.min ? c : acc), x.built.story.chapters[0]);
        const plan = planCompare((shortVid ? CMP_SHORT : CMP_STOPS).map((at) => ({ min: at, a: chapterText(chap(a, at), at), b: chapterText(chap(b, at), at), titleA: chap(a, at).title, titleB: chap(b, at).title })),
          shortVid ? 'short' : 'long', uFromMinutes, minutesFromU);
        cmpStops.current = plan.stops;
        const { blob, ext, audio } = await recordCompare(ca, () => cmpOverlayRef.current!, (m) => { flushSync(() => setCmpRec((r) => (r ? { ...r, u: uFromMinutes(m) } : r))); const st = r3f.current; if (st) advance(st.clock.elapsedTime + 1 / 30, true, st); }, plan, { sound: vidSound, onTick: (f) => setRecPct(f) });
        setShare({ state: 'ready', format: 'reel', blob, ext, url: URL.createObjectURL(blob), caption: `${a.name} vs ${b.name}: what really happens inside you in 24 hours 👀 ${verdictOf(a, b)} Which one would you pick? 👇 #Inside24h #health #nutrition`,
          msg: vidSound && !audio ? 'This browser couldn’t add our soundtrack, so the video is silent. Add a sound when you post it.' : undefined });
      } catch (e) { setShare({ state: 'error', msg: (e as Error).message }); }
      cmpStops.current = null; setCmpRec(null); setCmpNever(false);
    }, 1500); // let both bodies load (runs once, before the tab can be left)
  };
  // QA only: #cmpframe=<food>&phase=… mounts the two bodies at minute t and paints one comparison frame
  useEffect(() => {
    const other = HASH.get('cmpframe');
    if (!other) return;
    const bp = parseMeal(other);
    if (!bp.length || !currentParts.length) return; // unknown food in a QA link: nothing to draw
    const b = analyze(bp, profile), a = analyze(currentParts, profile);
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
  // every chapter's words at its own minute (as on screen); video-plan.ts picks the moments and the caption times
  const reelPlan = (): Plan => {
    const stops = story.chapters.filter((c) => c.min === 0 || c.min >= 1).map((c) => ({ min: c.min, title: c.title, text: chapterText(c, c.min) }));
    const plan = planVideo(stops, shortVid ? 'short' : 'long', uFromMinutes, minutesFromU);
    reelStops.current = plan.stops;
    if (HASH.get('vqa')) console.log('[vqa] plan', JSON.stringify({ chapters: stops.map((s) => [s.min, s.title, s.text]), seconds: plan.seconds, stops: plan.stops, pages: plan.pages.map((p) => [p.stop, Math.round(p.s * 10) / 10, p.text]) }));
    return plan;
  };
  const fileName = `inside24h-${PRODUCT.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

  // ---- deep link: the address bar always describes what is on screen (replaceState, so no history spam).
  // The minute goes in only while paused / after scrubbing, never every frame.
  const sizeNow = productId === 'food' && currentParts.length === 1 ? sizes?.find((x) => Math.abs(x.mult - portion) < 1e-6 && x.mult !== 1) : undefined;
  // an amount a link can say (a size, or ½ · 1 · 2 · 3); anything else (5 beers, 200 g of rice) goes as the exact meal code
  const portionLinkable = !!sizeNow || (PORTIONS as readonly number[]).some((x) => Math.abs(x - portion) < 1e-6);
  const linkHash = (t: number | null) => writeLink({
    ...linkFor(portion !== 1 && portionBase && portionLinkable ? portionBase : currentParts), t, over: overEff,
    ...(sizeNow ? { s: sizeNow.k } : portionLinkable ? { n: portion } : {}),
    view: mode === 'detailed' ? 'detailed' : calm ? 'simple' : 'full',
    vs: compare && vsParts?.length ? mealText(vsParts) : undefined,
  }, window.location.hash);
  const hashNow = started && share?.state !== 'rec' && !cmpRec ? linkHash(playing ? null : minute) : null;
  useEffect(() => {
    if (hashNow === null || hashNow === window.location.hash) return;
    const id = setTimeout(() => { try { history.replaceState(null, '', hashNow || window.location.pathname + window.location.search); } catch { /* sandboxed */ } }, 700);
    return () => clearTimeout(id);
  }, [hashNow]);
  // ---- "Share this moment": a 4:5 picture of this minute + the link that reopens it ----
  const makeMoment = async (): Promise<Moment | null> => {
    const o = overlayRef.current;
    if (!o) return null;
    const canvas = document.querySelector<HTMLCanvasElement>('.stage canvas');
    if (canvas && r3f.current) r3f.current.gl.render(r3f.current.scene, r3f.current.camera); // draw now, read in the same task
    const h = linkHash(minute);
    try { history.replaceState(null, '', h); } catch { /* sandboxed */ }
    const link = `${window.location.origin}${window.location.pathname}${window.location.search}${h}`;
    const stamp = stampFor(minute);
    const card = drawMomentCard(canvas, {
      name: PRODUCT.name, amount: productId === 'food' && foodParts.length === 1 ? foodParts[0].amountLabel : hookWhat,
      stamp, clock: hhmm(profile.drinkAtMin + minute), step: chapter.title, caption: captionOf(chapterText(chapter, minute), 150),
      pop: o.pop, where: o.where, color: story.color, link,
      lights: systems.map((x) => ({ label: SHORT_OF[x.key], level: x.levels[Math.round(Math.min(1440, minute))] as 0 | 1 | 2, unknown: x.unknown })),
    });
    const blob = await new Promise<Blob | null>((r) => card.toBlob(r, 'image/png'));
    return blob && { blob, link, fileName: `${fileName}-${formatTime(minute)}.png`, title: `${PRODUCT.name} · ${stamp.toLowerCase()}`,
      text: `What ${hookWhat} is doing inside you, ${stamp.toLowerCase()} 👀 #Inside24h` };
  };

  // A drag on the canvas must not count as "clicked empty space".
  const down = useRef<[number, number] | null>(null);

  // ---- accessibility: dialogs, sheets and the menu trap focus, close on Esc and give focus back (a11y.ts) ----
  const shareBox = useRef<HTMLDivElement>(null), noticeBox = useRef<HTMLDivElement>(null);
  const menuBox = useRef<HTMLElement>(null), ansBox = useRef<HTMLDivElement>(null);
  // the two start screens are modal too: Tab stays inside them (not in the app behind); Esc does nothing (no way back yet)
  const startBox = useRef<HTMLDivElement>(null);
  useModal(startBox, LEGACY_START && !started, () => {}); // the new start sheet is part of the page, not a modal
  useModal(shareBox, !!share && share.state !== 'rec', () => setShare(null));
  useModal(noticeBox, !!notice, () => setNotice(null));
  useModal(menuBox, menuOpen, () => setMenuOpen(false));
  useModal(ansBox, ansOpen && calmNow, () => setAnsOpen(false));
  useEffect(() => { // the organ card closes on Esc too
    if (!info) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !panel && !evidence && !share && !compare) setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [info, panel, evidence, share, compare]);
  // A text version of the 3D body for screen readers ("20 min after your cola: Stomach 214 ml. Blood sugar peak."),
  // spoken when paused or scrubbed, not on every frame while playing.
  const stageWhere = overlayRef.current?.where;
  const stageText = `${sinceText(minute, lower)}${stageWhere ? `: ${stageWhere.replace(' · ', ' ')}` : ''}. ${chapter.title}.`;

  return (
    <div className={`v4 ${calmNow || !started ? 'calmlay' : ''} ${!started ? 'cold' : ''} ${ansOpen && calmNow ? 'ansopen' : ''}`}>
      <header className="top">
        {/* keyboard: the first Tab stop jumps straight to the one question (shown only while focused) */}
        {!started && <button className="skipq" onClick={() => document.querySelector<HTMLInputElement>('.startsheet input')?.focus()}>Skip to the search</button>}
        <button className="brand" title="Home" aria-label="Inside 24h, go to the start page" onClick={() => {
          // home = the "what did you have?" screen (your body stays remembered; "← Back to you" edits it)
          setStarted(false); setPlaying(false); setPanel(null); setEvidence(null); setCompare(null); setShare(null); setSelected(null);
          try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch { /* sandboxed */ }
        }}>Inside <em>24h</em></button>
        <div className="topsearch">{started && <MealBar parts={currentParts} current={PRODUCT.name} onPick={chooseFood} onChange={changeMeal} asking={asking} onSwitch={switchFood} chosen={linkChosen}
          pace={paceable ? { over: overEff, set: (v) => { setOver(v); setPaceTouched(true); }, hot: paceMatters(currentParts) && !overEff && !paceTouched } : undefined} />}</div>
        <div className="topactions">
          <div className="seg2 mode" role="group" aria-label="View">
            <button aria-pressed={mode === 'simple' && calm} onClick={() => { setMode('simple'); setCalm(true); }}>Simple</button>
            <button aria-pressed={mode === 'simple' && !calm} onClick={() => { setMode('simple'); setCalm(false); }}>Full</button>
            <button aria-pressed={mode === 'detailed'} onClick={() => setMode('detailed')}>Detailed</button>
          </div>
          {started && <button className="ghost hdr" onClick={() => setCompare({})}><span aria-hidden="true">⇄ </span>Compare</button>}
          {started && <button className="ghost sharebtn" onClick={() => { setPlaying(false); setVideoOpen(false); setShare({ state: videoSupportHere() === 'none' ? 'nosupport' : 'choose' }); }} disabled={share?.state === 'rec'}>{share?.state === 'rec' ? '● Recording…' : 'Share'}</button>}
          <button className="ghost hdr" onClick={() => setPanel('about')}>About</button>
          <button className="ghost hdr pro" onClick={() => setPanel('pro')}>Pro <small>coming soon</small></button>
          <button className="ghost hdr support" onClick={() => setPanel('support')}><span aria-hidden="true">♥ </span>Support</button>
          {/* first screen: one obvious action (the start sheet), so "Your body" steps back (phones: "Personalize" in the sheet) */}
          <button className={started ? 'primary' : 'ghost hdr yourbody'} onClick={() => setPanel('body')}>Your body</button>
          {/* phones: everything that doesn't fit the header, in one menu */}
          <button className="menubtn" aria-label="Menu" aria-expanded={menuOpen} aria-controls="topmenu" onClick={() => setMenuOpen(!menuOpen)}>⋯</button>
        </div>
        {menuOpen && <>
          <div className="sheetback menuback" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <nav id="topmenu" ref={menuBox} className="topmenu" aria-label="Menu" onClick={(e) => { if ((e.target as HTMLElement).closest('button')) setMenuOpen(false); }}>
            <div className="seg2 mode" role="group" aria-label="View">
              <button aria-pressed={mode === 'simple' && calm} onClick={() => { setMode('simple'); setCalm(true); }}>Simple</button>
              <button aria-pressed={mode === 'simple' && !calm} onClick={() => { setMode('simple'); setCalm(false); }}>Full</button>
              <button aria-pressed={mode === 'detailed'} onClick={() => setMode('detailed')}>Detailed</button>
            </div>
            {started && <button onClick={() => setCompare({})}><span aria-hidden="true">⇄ </span>Compare two foods</button>}
            <button onClick={() => setPanel('method')}>How we know</button>
            <button onClick={() => setPanel('about')}>About · not medical advice</button>
            <button onClick={() => setPanel('support')}><span aria-hidden="true">♥ </span>Support</button>
            <button onClick={() => setPanel('pro')}>Pro <small>coming soon</small></button>
          </nav>
        </>}
      </header>

      <main className={`grid ${started ? mode : 'simple'} ${calmNow || !started ? 'calm' : ''}`}>
        {started && mode === 'simple' && !calmNow && (
          <StoryPanel story={story} chapterIdx={chapterIdx} minute={minute} vitals={vYou} profile={profile} name={PRODUCT.name}
            productId={habitId} habit={habit} setHabit={(h) => setHabits({ ...habits, [habitId]: h })}
            clock={hhmm(profile.drinkAtMin + minute)} since={sinceText(minute, lower)}
            onBody={() => setPanel('body')} onEvery={() => setPanel('every')}
            onWhy={(c) => setEvidence({ title: c.title, claims: c.claims })}
            onPrev={() => goChapter(chapterIdx - 1)} onNext={() => goChapter(chapterIdx + 1)}
            verdict={verdict(systems, profile.drinkAtMin)} passport={answersBlock} />
        )}
        {started && mode === 'detailed' && <section className="now" aria-label="What is happening now">
          <div className="clock">{hhmm(profile.drinkAtMin + minute)}</div>
          <div className="since">{sinceText(minute, lower)}</div>
          <div className="stagelabel" aria-live="polite">{head.label}</div>
          <p className="headline">{head.text}</p>
          <button className="evlink" onClick={() => setEvidence({ title: head.label, claims: head.claims })}>
            <Levels ids={head.claims} claims={PRODUCT.claims} /> How do we know?
          </button>
          <button className="everybtn" onClick={() => setPanel('every')}>
            <b>If you have this every day</b><span>Cholesterol, diabetes, weight and more →</span>
          </button>
          <Where rows={built.where} title={({ cola: 'Where the sugar is', water: 'Where the water is', espresso: 'Where the caffeine is' } as Record<string, string>)[productId] ?? `Where the ${lower} is`} minute={minute} selected={selected} onPick={setSelected} />
          <Disclaimer onHow={() => setPanel('method')} />
        </section>}

        <section className="stage" aria-label="3D body" aria-describedby="stage-now"
          onPointerDown={(e) => { down.current = [e.clientX, e.clientY]; setTouched(true); }}>
          <ErrorBoundary fallback={(e) => <StageError error={e} />}>
            {sceneError ? <StageError error={sceneError} /> : !show3d ? null : (
              <Suspense fallback={null}><SafeCanvas camera={{ position: [0.05, 1.22, 2.05], fov: 33 }} frameloop={share?.state === 'rec' && canEncode() && (!cmpRec || cmpNever) ? 'never' : !started ? 'demand' : 'always'}
                onPointerMissed={(e) => {
                  const d = down.current;
                  if (!d || Math.hypot(e.clientX - d[0], e.clientY - d[1]) < 5) setSelected(null);
                }}>
                <ExposeState into={r3f} />
                <Suspense fallback={null}>
                  {cmpRec ? <CompareScene a={cmpRec.a} b={cmpRec.b} minute={minutesFromU(cmpRec.u)} /> : <>
                  <Body glow={mode === 'simple' || !started ? {} : glow} selected={selected} onSelect={setSelected} onError={setSceneError}
                    liquid={mode === 'simple' && started ? softenTubes(story.liquid(minute), !!built.route) : {}} liquidColor={story.color} onBounds={setBounds}
                    dim={keepOrgans.length && started ? 0.32 : 1} keep={keepOrgans} />
                  {/* first screen (nothing chosen yet): the body on its own, no liquid */}
                  {started && mode === 'detailed' && <Flow layers={built.layers} minute={minute} />}
                  {started && mode === 'simple' && (built.route
                    ? <LiquidRoute route={built.route} color={story.color} minute={minute} labels={share?.state !== 'rec'} maxLabels={calmNow ? 1 : 3} />
                    : <FlowPaths bounds={bounds} color={story.color} flows={story.flows(minute)} toKidneys={story.toKidneys} />)}
                  </>}
                </Suspense>
                <OrbitControls makeDefault target={[0, 1.15, 0]} enablePan={false} minDistance={0.3} maxDistance={3.2} />
                {mode === 'simple' && !cmpRec && <CameraRig focus={share?.state === 'rec' ? liquidFocus ?? 'torso' : selected ?? (wholeBody || !started ? null : liquidFocus ?? chapter.focus)} bounds={bounds} minDist={share?.state === 'rec' ? 1.05 : !selected && liquidFocus ? 0.95 : 0.5} flightKey={`${productId}-${chapterIdx}-${selected}-${flightKey}`} />}
              </SafeCanvas></Suspense>
            )}
          </ErrorBoundary>
          {/* after the canvas on purpose: CSS places the canvas wrapper as the stage's first child (.stage > div:first-child) */}
          <p id="stage-now" className="sr" aria-live={playing ? 'off' : 'polite'}>{started ? stageText : ''}</p>
          {started && nudge && !personalized && !share && !compare && (
            <div className="pnudge" aria-live="polite">
              <button className="pngo" onClick={() => { setNudge(false); setPanel('you'); }}>
                <span>For a typical {profile.sex === 'female' ? 'woman' : 'man'}, {profile.ageY}</span><b>Personalize<span aria-hidden="true"> →</span></b>
              </button>
              <button className="pnx" aria-label="Not now: keep the typical body" onClick={() => { setNudge(false); markPersonal(); }}>×</button>
            </div>
          )}
          {started && calmNow && <>
            {/* phones/tablets: the answers wait in a bottom sheet so the body stays visible; desktop: a column on the right */}
            <button className="anstoggle" aria-expanded={ansOpen} aria-controls="stageanswers" onClick={() => setAnsOpen(!ansOpen)}>
              <span aria-hidden="true">💬</span> Quick answers <b>{answers.length}</b><span className="chev" aria-hidden="true">▴</span>
            </button>
            {ansOpen && <div className="sheetback" onClick={() => setAnsOpen(false)} aria-hidden="true" />}
            <div id="stageanswers" ref={ansBox} className={`stageanswers ${ansOpen ? 'open' : ''}`} role="region" aria-label="Quick answers">
              <div className="sheethead"><b>Quick answers</b><button className="x" aria-label="Close quick answers" onClick={() => setAnsOpen(false)}>×</button></div>
              {answersBlock}
            </div>
          </>}
          {started && mode === 'simple' && !calmNow && <StatusLights systems={systems} minute={minute} onRules={() => setPanel('colours')}
            weather={city && weather && hyd ? {
              city: city.name, range: `${Math.round(weather.tmin)}–${Math.round(weather.tmax)} °C`, month: weather.month,
              extra: profile.airCon ? 0 : Math.round(hyd.extraPerDayMl / 50) * 50, onChange: () => setPanel('body'),
            } : undefined}
            onJump={(m, organ) => { jump(m); setSelected(organ); setFlightKey((k) => k + 1); }} />}
          {started && mode === 'simple' && !calmNow && built.route && built.traits && (
            <div className="stagetrip">
              <Passport compact route={built.route} minute={minute} drinkAt={profile.drinkAtMin} kind={built.traits}
                onJump={(m, organ) => { jump(m); setSelected(organ); setWholeBody(false); setFlightKey((k) => k + 1); }} />
            </div>
          )}
          {started && (mode === 'detailed' || !built.route) && <Journey steps={built.journey} unit={built.journeyUnit} minute={minute} selected={selected} onPick={setSelected} />}
          {!touched && <div className="hint">{isTouch() ? 'Swipe to turn · pinch to zoom · tap an organ' : 'Drag to turn · scroll to zoom · tap an organ'}</div>}
          {!started ? null : mode === 'detailed' ? (
            <div className="legend">
              {built.legend.map((l) => <span key={l.label}><i style={{ background: l.color }} />{l.label}</span>)}
              <span className="dim">{built.dotNote}</span>
            </div>
          ) : (
            <div className="legend"><span><i style={{ background: story.color }} />{PRODUCT.name} in your body</span>
              {(selected || (chapter.focus && !wholeBody)) && <button className="wholebody" onClick={() => { setSelected(null); setWholeBody(true); setFlightKey((k) => k + 1); }}>Show the whole body</button>}
            </div>
          )}
          <div className="credit">Anatomy: BodyParts3D © DBCLS · CC BY 4.0</div>
          {info && started && (
            <div className="organ" role="dialog" aria-label={info.name}>
              <div className="ohead"><b>{info.name}</b><button className="x" aria-label="Close" onClick={() => setSelected(null)}>×</button></div>
              {info.lines.map((l) => <div key={l.label} className="oline"><span>{l.label}</span><b>{l.value}</b></div>)}
              <p>{info.text}</p>
              <button className="evlink" onClick={() => setEvidence({ title: info.name, claims: info.claims })}><Levels ids={info.claims} claims={PRODUCT.claims} /> How do we know?</button>
            </div>
          )}
        </section>

        {started && mode === 'detailed' && <Readings you={vYou} sim={you} twin={vTwin} profile={profile} minute={minute} vitalClaims={def.vitalClaims} name={lower}
          insulin={built.insulin} energy={built.energy} onOpen={(title, claims) => setEvidence({ title, claims })} />}
      </main>

      {!started && !LEGACY_START && (
        // The first screen: the body above, ONE question here. One tap on a tile (or a search) starts the simulation.
        <section className="startsheet" aria-labelledby="start-h">
          {missText && <MissNote text={missText} onPick={chooseFood} />}
          <h1 id="start-h">What should we follow through your body?</h1>
          <SmartSearch onPick={chooseFood} big /* no autofocus: focusing opens the suggestion list over the tiles */ />
          <div className="tiles quick" role="group" aria-label="Or pick one">
            {START_TILES.map((t) => (
              <button key={t.q} className={`tile ${t.solid ? 'solid' : ''}`} style={{ ['--tc' as string]: t.color }} onClick={() => chooseFood(parseMeal(t.q))}
                aria-label={`${t.name}, ${t.sub}`}>
                <i aria-hidden="true" /><b>{t.name}</b><span>{t.sub}</span>
              </button>
            ))}
          </div>
          <p className="then">Simulated for: {profile.sex === 'female' ? 'woman' : 'man'}, {profile.ageY} ·{profile.heightCm} cm · {profile.weightKg} kg. <button className="link" onClick={() => setPanel('you')}>Personalize</button></p>
          <p className="fine">Free · Not medical advice · Nothing leaves your device</p>
        </section>
      )}
      {started && calmNow && (
        <CalmBar title={chapter.title} text={captionOf(chapterText(chapter, minute), 170)} clock={hhmm(profile.drinkAtMin + minute)} since={sinceText(minute, lower)}
          playing={playing} onPlay={togglePlay} u={u} setU={(v) => { setU(v); setPlaying(false); }} systems={systems} minute={minute}
          where={overlayRef.current?.where} onMore={() => setCalm(false)}
          eatenAt={profile.drinkAtMin} setEatenAt={(m) => setProfile({ ...profile, drinkAtMin: m })} noun={lower}
          portion={portion} onPortion={applyPortion} sizes={sizes} onRules={() => setPanel('colours')} />
      )}
      {started && mode === 'simple' && !calmNow && <StatusStrips systems={systems} minute={minute} onSeek={jump} clock={(m) => hhmm(profile.drinkAtMin + m)} />}
      {started && mode === 'simple' && !calmNow && (
        <nav className="moments" aria-label="Steps of the journey">
          <button className="play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
          {story.chapters.map((c, i) => (
            <button key={`${c.min}-${c.title}`} className={`moment ${i === chapterIdx ? 'on' : i < chapterIdx ? 'past' : ''}`} onClick={() => goChapter(i)}>
              {c.title}<small>{hhmm(profile.drinkAtMin + c.min)}</small>
            </button>
          ))}
        </nav>
      )}
      {LEGACY_START && !started && !bodyAsked && (
        <div className="start" role="dialog" aria-modal="true" aria-label="Tell us about you" ref={startBox} tabIndex={-1} data-autofocus>
          <BodyStart profile={profile} setProfile={setProfile} onNext={() => setBodyAsked(true)} />
        </div>
      )}

      {started && mode === 'detailed' && <TimelineBar u={u} minute={minute} playing={playing} togglePlay={togglePlay} setU={(v) => { setU(v); setPlaying(false); }}
        stages={PRODUCT.stages} stageIndex={stageIndex} jump={jump} toBed={toBed} bedLabel={hhmm(profile.bedtimeMin)} drinkAt={profile.drinkAtMin} />}

      {LEGACY_START && !started && bodyAsked && (
        <div className="start" role="dialog" aria-modal="true" aria-label="Choose what you ate or drank" ref={startBox} tabIndex={-1} data-autofocus>
          <div className="startbox">
            <div className="step">Step 2 of 2 · Choose</div>
            {missText && <MissNote text={missText} onPick={chooseFood} />}
            <h1>What should we follow through your body?</h1>
            <SmartSearch onPick={chooseFood} big />
            <div className="orpick">or pick one</div>
            <div className="tiles">
              {[
                { q: 'cola', name: 'Cola', sub: '1 can · 330 ml', color: '#2a120a' },
                { q: 'espresso', name: 'Espresso', sub: '1 shot', color: '#2b1608' },
                { q: 'water', name: 'Water', sub: '1 glass · 250 ml', color: '#cfe8ff' },
                { q: '1 banana', name: 'Banana', sub: '1 medium', color: '#f1de8c' },
                { q: 'beer', name: 'Beer', sub: '0.5 l', color: '#e5a823' },
                { q: 'pizza', name: 'Pizza', sub: '1 slice', color: '#e8b04a' },
                { q: '1 apple', name: 'Apple', sub: '1 medium', color: '#c8e06a' },
                { q: 'glass of milk', name: 'Milk', sub: '1 glass · 250 ml', color: '#f4f1ea' },
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
          <div ref={noticeBox} className="noticebox" role="alertdialog" aria-modal="true" aria-label={`${notice.name} is not ready yet`}>
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

      {linkNote && <div className="linknote" role="status">{linkNote}<button className="x" aria-label="Close" onClick={() => setLinkNote(null)}>×</button></div>}
      {compare && <Compare current={currentParts} overMin={overEff} profile={profile} initial={compare.with} onClose={() => setCompare(null)} onVideo={canEncode() ? makeCompareVideo : undefined} short={shortVid} setShort={setShortVid} onRight={setVsParts} />}
      <Tour active={started && mode === 'simple' && !calmNow && !panel && !share} />
      {share?.state === 'rec' && <div className="recbadge" role="status">● Making your video… {Math.round((canEncode() ? recPct : u) * 100)}% · keep this tab open</div>}
      {share && share.state !== 'rec' && (
        <div className="drawer-wrap center" onMouseDown={(e) => { if (e.target === e.currentTarget) setShare(null); }}>
          <div ref={shareBox} className="noticebox sharebox" role="dialog" aria-modal="true" aria-label="Share">
            {share.state === 'choose' && !videoOpen && <h2 className="sharetitle">Share</h2>}
            {share.state !== 'ready' && <MomentShare make={makeMoment} label="Share this moment" />}
            {share.state === 'choose' && !videoOpen && (
              <button className="ghost videoopen" aria-expanded={false} onClick={() => setVideoOpen(true)}><span aria-hidden="true">🎬 </span>Or make a 24-hour video (Reel / TikTok)<span aria-hidden="true"> ▾</span></button>
            )}
            {share.state === 'choose' && videoOpen && (<>
              <h2>Make a video</h2>
              <p className="note">The whole 24 hours: an opening question, a pause at each key moment, captions for silent viewing, the food or drink moving through the body, and a summary at the end.</p>
              <label className="handle">Name in the corner <small>(optional: @inside24h or your own handle)</small><input value={handle} placeholder="@yourname" onChange={(e) => { setHandle(e.target.value); try { localStorage.setItem('i24-handle', e.target.value); } catch { /* private mode */ } }} /></label>
              <div className="lenpick" role="group" aria-label="Length">Length:
                <button aria-pressed={!shortVid} onClick={() => setShortVid(false)}>Full · over 1 min</button>
                <button aria-pressed={shortVid} onClick={() => setShortVid(true)}>Short · under 30 s</button>
              </div>
              <div className="lenpick soundpick" role="group" aria-label="Sound">Sound:
                <button aria-pressed={vidSound} onClick={() => setVidSound(true)}>Our music</button>
                <button aria-pressed={!vidSound} onClick={() => setVidSound(false)}>None (add your own)</button>
              </div>
              <div className="fmtpick">
                <button className="fmt" onClick={() => startShare('reel')}><i className="r916" /><b>Reel / Story / TikTok</b><span>9:16 · 1080×1920</span></button>
                <button className="fmt" onClick={() => startShare('feed')}><i className="r45" /><b>Feed post</b><span>4:5 · 1080×1350</span></button>
              </div>
            </>)}
            {share.state === 'error' && (<><h2>We couldn’t make the video</h2><p>{share.msg}</p></>)}
            {share.state === 'nosupport' && <VideoFallback makeImage={stillImage}
              onSave={async (b) => { const r = await saveFile(`${fileName}-moment.png`, b); return r === 'saved' ? 'Saved. If nothing downloaded, press and hold the picture to save it.' : r === 'declined' ? 'Not saved.' : 'Press and hold the picture to save it.'; }} />}
            {share.state === 'ready' && (<>
              <h2>Your 24-hour video</h2>
              <video src={share.url} autoPlay loop muted playsInline controls className={share.format === 'reel' ? 'v916' : 'v45'} />
              <p className="note">Suggested caption: “{share.caption ?? `${videoName}: what happens inside your body in 24 hours 👀 Which food should we test next? 👇 #Inside24h #health #nutrition`}”</p>
              {share.msg && <p className="note">{share.msg}</p>}
            </>)}
            <div className="nbtns">
              {share.state === 'ready' && <button className="primary" onClick={async () => {
                const r = await saveFile(`${fileName}-${share.format === 'reel' ? 'reel' : 'feed'}.${share.ext}`, share.blob!);
                setShare({ ...share, msg: r === 'saved' ? 'Saved. Post it as a Reel, Story or TikTok.' : r === 'declined' ? 'Not saved.' : 'Saving files isn’t available here. Right-click the video and choose “Save video as…”.' });
              }}>Save video ({share.ext?.toUpperCase()}, {((share.blob?.size ?? 0) / 1e6).toFixed(1)} MB)</button>}
              {share.state === 'ready' && <button className="ghost" onClick={() => setShare({ state: 'choose' })}>Make another</button>}
              {share.state === 'choose' && videoOpen && <button className="ghost" onClick={saveCover}>Save cover image (PNG)</button>}
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
      <Drawer open={panel === 'you'} title="Make it you" onClose={() => { setPanel(null); markPersonal(); }}>
        <BodyStart inline profile={profile} setProfile={setProfile} onNext={() => { setPanel(null); markPersonal(); }} />
      </Drawer>
      <Drawer open={panel === 'every'} title={`${PRODUCT.name} every day`} onClose={() => setPanel(null)}>
        <EveryDay productId={productId} />
      </Drawer>
      <Drawer open={panel === 'rules'} title="How the bars work" onClose={() => setPanel(null)}>
        <p className="note">The bars are our own simplified 0–100 scale, made so you can compare choices at a glance. Each rule below is tied to a study or an official guideline.</p>
        <ul className="rules">{RULES.map((r) => <li key={r.rule}><b>{r.bar}</b><span>{r.rule}</span><small>{r.source}</small></li>)}</ul>
      </Drawer>
      <Drawer open={panel === 'colours'} title="How the colors work" onClose={() => setPanel(null)}>
        <p className="note"><b className="g">Green:</b> fine, your body is working normally. <b className="y">Yellow:</b> mild stress that your body handles easily. <b className="r">Red:</b> high stress, a bigger swing that your body works harder to even out. These cut-offs are our own simple scale (level C), built on the official categories named below.</p>
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
      <div className="rtitle">Your readings <span><i className="you" />you <i className="tw" />a healthy person your size</span></div>
      <div className={`state ${asleep ? 'sleep' : ''}`}>{asleep ? 'Asleep · your body’s night rhythm' : 'Awake · resting'}</div>
      <div className="reading energy">
        <span className="rl">Energy from this {name}</span>
        <span className="rv">{Math.round(energy.absorbed(minute))}<small>/ {energy.total} kcal</small></span>
        <span className="rd">{energy.total === 0 ? 'no calories' : energy.total < 10 ? 'almost none' : 'has reached your blood so far'}</span>
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
      <p className="rnote">Lines follow your body’s natural day and night. Blood sugar is a typical response, not personalized. Tap a reading to see why.</p>
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
        <input type="range" min={0} max={1000} value={Math.round(u * 1000)} aria-label="Time since you had it" aria-valuetext={sinceText(minute, 'drink')}
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
      <p>This is an educational simulation of a typical healthy adult of your sex, age, height and weight, in your city. Real people differ a lot (the same meal can raise blood sugar twice as much in one person as in another). Do not use it to diagnose, treat, dose medicine, or decide whether you can drive. If you have diabetes, a heart, kidney or liver condition, are pregnant or take medication, ask your doctor.</p>
      <h3>Your privacy</h3>
      <p>Everything is calculated in your browser. What you type (your body, your city, your food) is not sent anywhere and is not stored by us.</p>
      <h3>How sure are we?</h3>
      <p>Every statement carries a level of evidence and its sources (tap “How do we know?”). Our estimates show how we calculated them, and anything not yet studied says so.</p>
      <LevelKey />
      <p><b>A</b> rests on consistent human studies or official bodies such as EFSA. <b>B</b> rests on human studies that are small or vary a lot. <b>C</b> is our own calculation from published numbers. <b>?</b> means nobody has measured it yet.</p>
      <h3>Data</h3>
      <p>Food values: USDA FoodData Central (SR Legacy). Glycemic index: international GI tables (Atkinson 2008). Weather: ERA5 reanalysis via Open-Meteo and NASA POWER (typical day for the month, not a live forecast).</p>
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

/** A link asked for a food we don't have: say so plainly and offer the closest foods we do have. */
function MissNote({ text, onPick }: { text: string; onPick: (parts: Part[]) => void }) {
  const shown = text.length > 40 ? `${text.slice(0, 40)}…` : text;
  const closest = useMemo(() => { try { return suggest(text, 3).filter((x) => x.parts.length); } catch { return []; } }, [text]);
  return (
    <div className="missnote" role="status">
      <b>We don’t have “{shown}” yet.</b>
      {closest.length ? <span>Closest we have:</span> : <span>Search for something similar, or pick one below.</span>}
      {closest.length > 0 && <div className="misspicks">{closest.map((x) => <button key={x.text} onClick={() => onPick(x.parts)}>{x.text}</button>)}</div>}
    </div>
  );
}

function StageError({ error }: { error: unknown }) {
  return (
    <div className="stage-error" role="alert">
      <b>{/webgl/i.test(String(error instanceof Error ? error.message : error)) ? 'Your browser can’t show 3D. Try opening this page in Chrome or Safari.' : 'The 3D body couldn’t load.'}</b>
      <p>Everything else still works. Technical details: {error instanceof Error ? error.message : String(error)}</p>
    </div>
  );
}
