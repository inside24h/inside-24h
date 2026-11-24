# Next-level roadmap: one Food Story system for site + video (2026-11-24)

Author: planning agent (Opus), read-only. Builds on `next-level-format-research-2026-11-22.md` (abbr. **R**, section numbers like R-A11#1) and `current-format-audit-2026-11-22.md` (abbr. **AU**, e.g. AU-A5.2). It starts once Phase 4l is committed and tagged. Right now `video-facts.ts`, `video-narration.ts` and `video-story.ts` have uncommitted 4l changes, so no phase touches them until 4l is in git.

## 0. Binding decisions and rules (apply to every phase)

**Owner decisions:**
- Body Score has **5 axes** (Energy, Sugar curve, Fullness, Sleep, Nutrients). Each axis shows a word tier and a "why", and there is **no overall number**.
- Kcal is shown only as a number (plus % of a 2,000 kcal reference). **No minutes of walking or any other exercise.**
- A user's auto-video is rendered **in the browser** (WebCodecs, the pipeline that already exists).
- There is no expert reviewer. Instead, every model number carries an "Estimate for …" label and an A/B/C/? grade. Sources appear on screen and on the page, plus a "What we don't know" block.
- Never "safe to drive" and never "burn it off". No diagnosis, treatment or prevention claims. No mass-generated pairwise pages: versus pages come from a curated list only.

**Standing rules:**
- Never delete files.
- Each phase starts with `git tag backup-pre-<phase>-<date>`.
- Keep CRLF line endings and American English UI.
- No science-model changes unless a phase explicitly adds a sourced, tested model piece. Only P1 (Fullness rubric), P7 (day composition) and P8 (walk and food order) do this.
- Never weaken a test. Thresholds may only tighten.
- Every feature works at class level and is swept over every item × variant × cut (`sweep.testutil.ts`). The fast tier checks every 24th item; the full tier runs in GitHub Actions (`test-full.yml`), not locally (the PC has little memory).
- Verification for each phase: `tsc`, `npm run test:fast`, `npm run check:mobile`, both vite builds (`vite.v4.config.ts` single file, `vite.site.config.ts` split, plus `vite.pages.config.ts` from P3), `make-site-split.mjs`, `check-site.mjs`. Video phases add real-GPU sample renders (`render-sample.mjs`, `qc-render.mjs`), with voice ON for at least 2 of the samples, and an independent critic.

**Compliance finding (fixed in P1, step 0):** the current code breaks the owner's kcal decision.
- `app/src/v4/video-facts.ts` lines ~79, 114 and 369 have the strings "Walking it off…", "Walk {n} minutes to burn it." and "Burning it off takes about…".
- `app/src/v4/Answers.tsx` lines ~208–213 have "How much energy is that? … min of brisk walking for you".
- `science/walking.ts` stays as it is (no deletion), but nothing visible or spoken may use it.

---

## Phase overview (ordered by impact/effort)

| # | Phase | Size | Depends on |
|---|---|---|---|
| P1 | Food Story data layer + Body Score + cheat-sheet + compliance lexicon | L | 4l tagged |
| P2 | Video spine v5 (question → guess → mechanism → number → for you → action → scorecard) + live curve | L | P1 |
| P3 | Per-food static pages, SEO, OG images, curated versus pages, first-load diet, font floor | L | P1 |
| P4 | Video twists: what-if ghost line, versus without ties, "3 bodies" | M | P2 |
| P5 | Site explorables: You Draw It, event pins, what-if sliders + ghost curve, best-time heatmap, depth layers | L | P1, P3 |
| P6 | Share cards (moment, guess, versus) + in-browser auto-video of your own simulation | M | P2, P5 |
| P7 | "Your day" multi-meal sim + favorites/history (localStorage) + "My week" cards | M | P1, P5 |
| P8 | New sourced levers (walk after eating, food order), myth bank, micronutrients from USDA FDC | M | P4, P5 |
| P9 | Performance and accessibility hardening pass + measurement | S/M | all |

P3 comes before P4 because the video CTA ("Run your body: inside24h/food/<slug>") needs real URLs, and SEO compounds over time.

---

## P1: Food Story data layer (one source for site + video), Size L

**Goal:** one pure, deterministic, serializable `FoodStory` for any parts list, profile and cut. Every later phase reads only this, never `built.story.chapters` directly. This ends the "card = chapter sentence" architecture that AU-A4 diagnoses.

**What the user sees:**
- The calm view (CalmBar), which today shows one sentence and 4 lights (AU-B2), gets a **Story card**:
  - the surprising number with an everyday anchor;
  - the 5-axis scorecard (word tier + one-line why; tapping opens grade + sources);
  - the cheat-sheet (Best time / Pair with / Swap for);
  - a "What we don't know" disclosure;
  - an "Estimate for a 70 kg adult · Personalize" label.
- Compare gets the 5 axes side by side, with the winner on each axis.
- "How much energy is that?" now answers "472 kcal · 24% of a 2,000 kcal day".

**Features (with evidence):**
- R-C "Food Story JSON".
- R-A6.4 Body Score and R-B9#8 "why" per axis: AU-B6 found no "why" in the calm view.
- R-A11#29 cheat-sheet: AU-A1.8 found 0 tips in 10 of 12 videos, even though `content/tips.ts`, `SWAPS` and `Answers` "best time" exist.
- R-B9#22 "What we don't know".
- R-A4 everyday anchors.
- Surprise candidates with a score (R-C), feeding hooks in P2.

**Modules (new: `app/src/v4/story/`):**
- `types.ts`, the load-bearing contract:
  ```ts
  export interface StoryNumber { key: string; value: number; unit: string; text: string; range?: [number, number];
    grade: Level; sources: string[]; origin: 'db' | 'model' | 'rule'; anchor?: string; itemSpecific: boolean }
  export interface StoryEvent { min: number; key: 'peak'|'backToUsual'|'halfCaffeine'|'caffeineAtBed'|'alcoholZero'|'stomachEmpty'|'fiberColon'|'bedtime'|'fatPeak'; numberKey?: string; organ?: string }
  export interface Ladder { min: number; organ: string; cause: string; effectKey: string; soWhat: string; actionKey?: string }
  export interface Surprise { numberKey: string; claim: string; anchor?: string; score: number; question: string; options: [string,string,string]; answer: 0|1|2 }
  export interface StoryAction { kind: 'bestTime'|'pairWith'|'swapFor'|'tip'; text: string; grade: Level; sources: string[]; deltaKey?: string }
  export type AxisKey = 'energy'|'sugar'|'fullness'|'sleep'|'nutrients';
  export interface Axis { key: AxisKey; tier: 0|1|2|3|null; word: string; why: string; numberKeys: string[]; grade: Level; sources: string[] }
  export interface FoodStory { v: 1; id: string; slug: string; name: string; cls: StoryClass; body: { weightKg: number; sex: string; label: string; isDefault: boolean };
    numbers: Record<string, StoryNumber>; curves: Partial<Record<'glucose'|'insulin'|'bac'|'caffeine'|'tg'|'kcal'|'stomach', { step: 5; unit: string; y: number[]; thresholds: {y:number; label:string; source:string}[] }>>;
    events: StoryEvent[]; ladders: Ladder[]; surprises: Surprise[]; actions: StoryAction[]; axes: Record<AxisKey, Axis>;
    cheat: { bestTime: StoryAction|null; pairWith: StoryAction|null; swapFor: StoryAction|null }; unknowns: { text: string; grade: Level; sources: string[] }[]; safety: { alcohol: boolean; caffeineHigh: boolean } }
  ```
- `foodStory.ts`: `storyOf(x: Analysis, parts, profile): FoodStory`. It calls nothing new in the science layer. It reads `analyze()` (the B8 extension point): `built.effects`, `meal.items` (`ItemGlucose`), `bac`/`alcoholClock`, the caffeine `Timeline`, `simulateHydration`, `sleepRiskAt`/`caffeineLatencyMin`/`alcoholSleepTier`, `quickAnswers`, `TIPS`, `SWAPS`, `healthBars`, `content/sources.ts`, and `video-facts.ts derivedFacts` (moved or re-exported, never duplicated).
- `everyday.ts`, the anchor table, each entry with a source:
  - sugar: 4 g cube/teaspoon;
  - caffeine: espresso ≈ 63 mg, EFSA 200 mg single dose / 400 mg a day;
  - alcohol: US standard drink 14 g, UK unit 8 g;
  - water: 250 ml glass;
  - % DV from the existing `DV`;
  - WHO free sugars 25/50 g, salt 5 g.
  - **No exercise anchors.**
- `axes.ts`, one function per axis, with the rubric written as data and published on the method page:
  - **Energy:** kcal and % of 2,000. The tiers are portion-size words ("Light / Moderate / Large / Very large"), never "bad".
  - **Sugar curve:** peak range (`ranges.ts`) and time back to usual. When GI is unknown, tier = null and the word is "Not estimated".
  - **Fullness:** a new rubric, not a dynamic model. It uses energy density (kcal/g; Rolls), protein g/100 kcal, fiber g/100 kcal, and liquid vs. solid (DiMeglio & Mattes 2000). Grade B, label "Estimate", sources added to `content/sources.ts`.
  - **Sleep:** caffeine mg at the user's bedtime and its latency (anchors from `science/anchors.ts`) plus the alcohol sleep tier. When neither applies: "No effect expected".
  - **Nutrients:** fiber, protein, sodium, sat fat and free sugars as % DV. P8 adds micronutrients.
- `surprise.ts`:
  - `score = |ln(value / classMedian)|`, plus a bonus for counter-intuitive classes (from the R-A5 myth directions), and later plus aggregated local guess error (P5; local only, so this comes from the owner's own testing).
  - Class medians come from a generated file `story/class-stats.json`, made by a vitest-run generator `story/class-stats.gen.test.ts` (the same pattern as `text-audit.ts`). A full-tier test fails if the file is stale.
  - The 3 guess options come from `video-guess.ts` logic (×0.33, ×1, ×3, ordered and shuffled by seed).
- `unknowns.ts` (content, per class, sourced):
  - glucose varies a lot between people (ZOE PREDICT, Nature Med 2024);
  - caffeine half-life 1.5–9.5 h (NBK223808);
  - diet soda and insulin: mixed evidence;
  - BAC elimination 0.10–0.25 g/L/h (Jones 2019);
  - the Fullness rubric is a population heuristic.
- `compliance.ts`: one lexicon (banned phrases and regexes) shared by the UI, video lint (`text-audit lintText`), captions (`video-caption.ts BANNED`, which moves here and is re-exported) and pages:
  - burn it off / walk it off / earn it / minutes of walking / to burn;
  - safe to drive / ok to drive / sober up;
  - cure / treat / prevent / reverse / detox / diagnose / prediabet / manage your diabetes;
  - bad food / guilt / cheat meal.

**Changes to existing code:**
- `Answers.tsx`: replace the walking answer with "kcal · % of a 2,000 kcal day".
- `video-facts.ts`: retire the `walk` wordings (keep the code path, add a guard so nothing emits it).
- `CalmBar.tsx`/`AppV4.tsx`: Story card (lazy chunk through `lazyUi.tsx`).
- `Compare.tsx`: axes row.
- `HowWeKnow.tsx`: a "Body Score method" section that renders the rubric data, so the method is public (Yuka lesson, R-B1).

**Tests and guards (every item × variant, a few profiles):**
- `story.test.ts`:
  - the story is JSON-serializable and deterministic;
  - every `numberKeys`/`effectKey`/`numberKey` resolves;
  - no NaN/Infinity;
  - every StoryNumber has a grade and ≥1 source id that resolves through `tipSource`;
  - every model number equals the value recomputed from `analyze()` (to its rounding);
  - all 5 axes are present with a non-empty why ≤ 140 chars and a non-empty word;
  - no axis has an aggregate or total field (structural check: no key named `score`/`total` on FoodStory).
- `compliance.test.ts`:
  - every visible string in the story, Answers and captions passes the lexicon;
  - a source scan proves `walkingMinutes`/`walkingKm` are not imported by any UI, video or page module;
  - alcohol items always carry `safety.alcohol` and never produce a `bestTime` that refers to driving.
- Coverage: ≥3 surprise candidates for ≥95% of items, and the rest have a documented fallback; cheat has ≥2 of 3 lines for ≥95%, and water/plain items are listed explicitly.
- Size: serialized story ≤ 14 kB per item (curves downsampled to 5 min).

**Risks and accuracy pitfalls:**
- The Fullness rubric can read as "science". Keep the tier words modest ("Light / Filling for its kcal"), grade it B, and show the inputs.
- Free vs. total sugar: use `freeSugars` against WHO.
- % DV wording must not imply a target or a limit for the person.
- Surprise options must not create absurd numbers. Clamp them and round to readable steps.
- The Phase 4l merge: rebase `video-facts.ts` changes onto 4l.

**Acceptance:**
- 100% of items × variants have a valid story (full tier in CI).
- 0 compliance hits.
- The calm view shows ≥4 item-specific numbers above the fold at 390 px (measured by `check-mobile-layout.mjs --food`).
- First-load gzip grows by ≤ 3 kB (the Story card is lazy).
- `tsc`, test:fast, builds and check-site are green.

---

## P2: Video spine v5 + live curve, Size L

**Goal:** turn "food passes through" into a contract: a question is answered with mechanism, number, meaning and action, and ends on a save-worthy frame (R §0, R-A2, R-A3, R-A6).

**What the user sees, every item × cut:**
1. **0–1.0 s question** on screen, chosen from `story.surprises[0]`: e.g. "Guess: how much caffeine is left at midnight?". Fold the teaser and rewind into this, so the question is not later than 1.0 s (it is 2.4–3.1 s today).
2. **Guess** (1–3 s): 3 options (A/B/C), held in a corner until the reveal.
3. **Mechanism beats** (3 in short, 4 in medium, 5–6 in long). Each beat is a ladder rung pair:
   - the screen shows cause + an item-specific number;
   - the voice adds the "so what" without new numbers (`lintNarration`: spoken numbers must be on screen). This answers AU-A5.6.
4. **Big live curve panel**: the main curve with a "you are here" dot, threshold lines (WHO, EFSA, US/EU BAC, "your usual") and labeled axes. It replaces the small gauge as the default visual (R-A7, the highest-ranked item; AU-A3 rates it "cheap" because `drawGauge` + `Gauge.curve` exist).
5. **The surprising number** with an anchor ("= 4 sugar cubes"), and a riser + hit cue.
6. **"What it means for you"** in one line, with the body label.
7. **One action** (`story.cheat`, grade badge).
8. **Reveal of the guess**, in the last 3 s before the end frame.
9. **End frame (≥2.5 s):** 5-axis scorecard + 3-line cheat-sheet + a "Sources: inside24h…/food/<slug>" line. The loop's last frame matches the first.

**Also in P2:**
- The alcohol legal block (6–7 lines on 30–38% of the duration, AU-A5.5) becomes a **one-line compact limits row**, shown whenever a BAC number is on screen: "BAC 0.01–0.03 % · US 0.08 · EU 0.05 · Never drive after drinking". The full block appears at the peak and on the end frame. The existing telemetry "BAC limits" invariant (limits present whenever BAC is shown) stays and is extended to the compact row, so it is not weakened.
- `withLullCards` "TAKEN UP SO FAR" fillers (AU-A5.4) are replaced by curve or number segments. The rule "cardless ≤ 2 s" stays.
- Grade badges (A/B/C) next to every number. An "Estimate for a 70 kg adult" corner label whenever a model number is shown.

**Modules (AU-A4 extension points 1–6):**
- `video-plan.ts`: `StopIn` gains `kind?: 'question'|'guess'|'ladder'|'number'|'forYou'|'action'|'reveal'|'score'|'cheat'|'sources'` and `data?: SegData`. The planner uses `minS/maxS` per kind (`SEG_TIME` table) instead of `readSeconds(text)` for non-text kinds. Old kinds keep their current paths, so the 4a–4l rules still apply to cards.
- New `video-segments.ts`: `segmentsFor(story: FoodStory, cut): StopIn[]`. It includes data-gated availability rules: curve only when the curve exists and the sugar claim is true; per-item bar only when `meal.items ≥ 2`. It is called from `singleStops` and `comparePlan`, so the app preview (`AppV4.tsx` ~936) and `text-audit.ts auditSingle` get it automatically.
- `share.ts`:
  - `Overlay.seg?: { kind, data, a }` and one `drawSegment(ctx, …)`, called from `drawBodyFrame`/`drawSplitFrame`;
  - `drawCurvePanel` (a generalization of `drawGauge`);
  - `drawScorecard`, `drawCheat`.
  - All text goes through `text()`, so telemetry, overlap checks and `numberConflict` cover it. Add a `numberKey` tag to `text()` so telemetry knows which drawn numbers are item-specific.
- `video-hook.ts`: the hook comes from `story.surprises` (existing `HOOK_POOL` formulas stay as fallback wordings).
- `video-narration.ts`: new `NarrId 'seg'` + `SLOT_WORDS`. The voice reads `ladder.soWhat`. Drop the "Boom."/"Wait for it." pool from seg slots.
- `video-audio.ts`: `CueKind 'graph' | 'reveal'` (riser 1 s before the reveal, 0.3 s silence after the big number).
- `video-telemetry.ts`: new `checkTimeline5` (density invariants below), run headless by `telemetry.testutil.ts` and on renders by `qc-render.mjs`.
- `video-caption.ts`: the post title is the question (TikTok/YouTube search; R-B6), plus the sources line with the food URL.

**Tests and guards (every item × variant × cut; compare: every curated pair + 300 audit pairs):**
- `video-segments.test.ts`:
  - every segment's numbers resolve to story numbers;
  - the question exists for 100% of items;
  - the guess answer index matches the truth;
  - an action exists for 100% of food items (water may show "—", explicitly listed);
  - the score frame has all 5 axes.
- `checkTimeline5`, the measured invariants (thresholds = the acceptance criteria below):
  - facts/10 s = (distinct item-specific numbers drawn + segment visuals carrying a number) / duration;
  - share of main-phase time with an item-specific number on screen;
  - generic text time;
  - question time;
  - reveal position;
  - end-frame duration;
  - each item-specific number appears in ≤ 2 segments (fixes the "584 kcal ×5" problem, AU-A5.3);
  - a visual event every ≤ 3 s.
- `video-sameness.test.ts`: extend to segment kinds and texts. Two same-class items must not share > 50% of segment texts.
- Compliance lexicon over all drawn and spoken text.
- Fixtures: refresh `video-plan.fixtures.json` only by adding new fixtures. Old fixtures keep passing for card kinds.

**Risks:**
- The planner is 1,247 lines of hard-won rules. Add the kinds as a separate path and do not refactor the card path.
- A guess with a tie or a near-tie: `chooseGuess` must reject options within 15% of each other (the AU-A1.7 bug).
- Curve honesty: always draw the range band (`ranges.ts`), never a single line alone.
- BAC: never show "zero → you can…". The end frame for alcohol always carries the never-drive line.
- Safe zones: the curve panel must stay inside the `share.ts` SAFE zones. `share.test.ts` covers this.

**Acceptance (all items × cuts, fast tier locally, full in CI):**
- Facts per 10 s: ≥ 3.0 for every video (median ≥ 3.5). Today: 0.6–2.4.
- Item-specific number on screen: ≥ 70% of main-phase time.
- Generic text time: ≤ 15%. Today: 54–93% for foods.
- Question fully on screen by 1.0 s. Reveal inside the last 3.0 s before the end frame.
- End frame ≥ 2.5 s, with 5 axes + 3 cheat lines (or the listed fallback).
- ≥1 action in 100% of food/drink videos (today: 2 of 12).
- Compact BAC row is ≤ 2 lines. The full legal block is on screen ≤ 12% of the duration, with limits present 100% of BAC time.
- Real-GPU samples for 6 items (caffeine, alcohol, alcohol + caffeine, sugary drink, mixed meal, compare), voice on for 2 of them, plus an independent critic pass with no P0/P1 left.

---

## P3: Per-food pages, SEO, OG images, curated versus, first-load diet, font floor, Size L

**Goal:** every food gets its own useful, indexable page that answers the query above the fold and then boots the app on that food. Today there is one URL, hash state, 1 URL in the sitemap, no JSON-LD and no per-food title (AU-B4).

**What the user sees:**
- `/food/<slug>/`:
  - H1 question + direct answer ("Caffeine from 1 espresso: ~63 mg; half gone by ~5 h (range 1.5–9.5 h)");
  - static SVG curve with range band and event markers;
  - the 5 axes with whys;
  - cheat-sheet;
  - quick answers;
  - "What we don't know";
  - sources + method link;
  - a "Run it in your body" button that hydrates the 3D app with the item.
- `/compare/<a>-vs-<b>/` for **curated pairs only**: `Compare.PAIRS` (12) plus a new `story/versus-curated.ts` list of ~40–80 pairs people actually search (coffee vs tea, beer vs wine…), which the owner can edit. Each pair page shows the winner per axis and both curves.
- `/method/`: the Body Score rubric, grades and sources.
- Per-URL OG image (curve + one number).

**Modules:**
- New `app/src/v4/pages/`:
  - `renderFoodPage.ts` and `renderComparePage.ts` produce pure HTML strings from `FoodStory`;
  - `svgCurve.ts` (also reused for the in-app accessible sparkline);
  - `jsonld.ts`: `WebPage` + `FAQPage` for the quick answers, and `NutritionInformation` inside a `Recipe`/`MenuItem`-free plain block (keep this conservative: FAQ + Breadcrumb).
- New `vite.pages.config.ts` (an SSR build of `src/v4/pages/entry.ts` into `dist-pages/prerender.mjs`), so node can run the TS model.
- `make-site-split.mjs`:
  - import `dist-pages/prerender.mjs` and write `site/food/<slug>/index.html` and `site/compare/<pair>/index.html`;
  - add `_redirects` exceptions before `/*`;
  - `site-meta.mjs writeHostFiles`: a full sitemap, CSP hashes for the new inline scripts, a robots Sitemap line.
- `check-site.mjs`: add the new HTML roots; fail on missing title/description/canonical/JSON-LD.
- `deeplink.ts` + `main.tsx`: read the item from `location.pathname` as well as the hash. Update the `vite.site.config.ts DEEP_LINK` preload rule to cover `/food/` paths.
- OG images: new `scripts/make-og-pages.mjs` uses headless Chromium (the `render-sample.mjs` launcher) on an OG template page that draws the `shareCard.ts` canvas. It writes `site/og/<slug>.png` sequentially, cached by story hash, and is skipped locally unless asked (runs in CI or on demand; the PC has little memory).
- First-load diet (AU-B3: 283 kB gz before 3D; UI 184 kB gz; fooddb 79 kB gz):
  - split `fooddb` into a search index chunk (id, names, aliases, kind, ~15–20 kB gz) and on-demand rows; per-food pages inline their own row;
  - make Answers, StoryPanel, Readings, Passport and HealthPanel lazy;
  - run `SITE_REPORT=1` before and after.
- Font floor: raise the 25 CSS rules at 10–11.5 px (AU-B5) to ≥ 12 px (≥ 13 px for body text on mobile). New `scripts/check-fonts.mjs`, called by `check:mobile`, fails on any font-size < 12 px in built CSS.
- SITE_URL must be set (the owner picks the domain). Without it, pages build but the sitemap/canonical are skipped, with a warning (current behavior).

**Tests and guards:**
- `pages.test.ts`, for every item and curated pair:
  - the page has ≥ 8 item-specific numbers in its text;
  - unique `<title>`/meta description;
  - valid JSON-LD (parse + required keys);
  - every number on the page equals the story value;
  - compliance lexicon;
  - **anti-scaled-content guard:** word-shingle Jaccard similarity between any two same-class pages ≤ 0.55, so pages are not templates with the name swapped (R-B6, Google 2024 spam policy).
- `versus-curated.test.ts`:
  - every pair resolves;
  - every pair has a non-tie on ≥1 axis or a declared "same X, different Y" framing;
  - the count of `/compare/` URLs equals the curated list length (no generated pairs).
- `deeplink.test.ts`: path routing.
- `check-site`: all references resolve.
- `check:mobile`: food page at 360/390/430.

**Risks:**
- YMYL without a reviewer: compensate with visible method, grades, ranges, sources, "What we don't know" and the last-updated date.
- SSR of a model written for the browser: no DOM in story/pages, enforced by a lint test that greps for `window`/`document` in `story/` and `pages/`.
- The CSP hash list grows. Generate it, never write it by hand.
- Variants: index only the base items plus popular variants (a curated flag), so the page count stays meaningful.

**Acceptance:**
- Sitemap URLs = number of indexable DB items (≈249, minus research-status items, which get noindex) + curated pairs (40–80) + method/home.
- 100% of the pages pass `pages.test.ts`.
- Food page first load before interaction ≤ 60 kB gz of HTML+CSS with no JS needed to read the answer. App first load (shell+UI+index) ≤ 200 kB gz, down from 283.
- LCP is text (no WebGL wait), measured in Lighthouse mobile ≤ 2.5 s on 3 sample pages.
- 0 CSS rules < 12 px.
- Every page has its own OG image (or the shared fallback if generation was skipped, flagged by check-site as a warning).

---

## P4: Video twists, comparisons without ties, several bodies, Size M

**Goal:** add stakes and a "plot twist" at about 70% of the duration (R-A6.3), using only levers the model already computes (AU-A3, AU-A5.9: `Meal.fed`, `Meal.pace`, `scaleMeal`, `Profile`).

**Features:**
- **What-if ghost line:** the old curve turns grey, the new one is drawn in color, and the difference is shaded and labeled with the model delta. Twists by class:
  - alcohol: with a meal vs. on an empty stomach (`fed`); 3 drinks over 1 h vs. 3 h (`pace`);
  - caffeine: the same coffee at 8 am vs. 4 pm against bedtime (`drinkAtMin`; `sleepRiskAt`);
  - sugary items and meals: half portion (`scaleMeal`); per-item "who raises the sugar" stacked bar (`ItemGlucose`).
  - Walk and food order are not used before P8.
- **"3 bodies" strip** (R-A4, R-A11#7): a 2D strip of three mini bodies with their own numbers. No three 3D viewports, because of render cost.
  - alcohol: 55 kg F / 75 kg M / 95 kg M (Widmark through `simulateFood(meal, p)`);
  - caffeine: fast / typical / slow half-life profiles (smoker, typical, oral contraceptive via `caffeineHalfLifeH`).
  - Comment prompt: "Which body are you?"
- **Versus v2:** both curves on one graph (as `Compare.tsx` already does). The scorecard shows the winner per axis.
  - Tie handling: if the headline axis is within 10%, the planner switches the question to the axis with the biggest relative difference, or uses the "same kcal / same 100 g" twist (pretzel vs. peanuts precedent).
  - The "Almost the same. 15 g vs 16 g" antiklimaks (AU-A1.7) becomes impossible.
- Composition line for mixtures (aperol + prosecco + soda; carbonara ingredients) from `parts`, so the meal is named (AU-A5 minor).

**Modules:**
- `story/twists.ts`: `twistsOf(parts, profile): Twist[]`. Each twist has its own `analyze()` runs, the delta as a StoryNumber, grade and sources.
- `video-segments.ts`: new kinds `'twist'|'bodies'|'versusScore'`.
- `share.ts`: `drawGhost`, `drawBodiesStrip`.
- `video-story.ts comparePlan` + `video-guess.ts chooseGuess` (tie rejection).
- `CompareVideo.tsx` (shared graph in the split frame).

**Tests (every item × cut; all curated + 300 audit pairs):**
- A twist exists for ≥ 90% of items (the rest are listed).
- The twist delta equals a fresh model run; no twist claims a lever the model does not have.
- The 3-bodies numbers are monotonic in weight for BAC and ordered for half-life.
- No compare video asks a question whose answer differs by < 10% on the asked axis.
- Every compare end frame shows ≥ 1 axis with a winner, or the declared "same" framing.
- Compliance: no body-shaming words; body labels are neutral (kg + sex only).

**Risks:**
- Pace and fed effects for BAC are well sourced (A), but the per-item glucose bar is a model estimate (B): show the badge.
- 3 bodies must never read as "this body can drink more". The strip always carries "Estimate · never drive after drinking".

**Acceptance:**
- ≥ 1 twist or bodies segment in 100% of medium/long single videos.
- 0 compare ties asked.
- Facts/10 s stays ≥ 3.0 with twists included.
- Critic on 6 GPU samples (including 2 compares and 1 bodies strip) with no P0/P1.

---

## P5: Site explorables, Size L

**Goal:** active learning instead of a sandbox (R-B1: You Draw It, explorable explanations, Ciechanowski-style small manipulable figures). Every feature reads `FoodStory` and is gated by class.

**Features:**
- **You Draw It (predict, then reveal)** (R-B9#1). On first open of a food, the user drags their guess of the main curve on an SVG (glucose, caffeine or BAC, picked by the story's main curve). Then the real curve with its range band is revealed, plus "You were 1 h 40 min off on when it's gone". The guess is stored locally. This replaces the Tour as onboarding (R-B2.8).
- **Event pins on the scrubber** (R-B2.1). The `story.events` become pins on the 24 h slider. Tapping a pin jumps the clock, zooms to the organ and opens that ladder rung. The same events feed the video footer ribbon (shared code).
- **What-if sliders with a ghost curve** (R-B2.2): 3 contextual sliders per class, from P4 twists:
  - caffeine: time of drink, bedtime, metabolism (fast/typical/slow);
  - alcohol: body weight, with food, number of drinks/pace;
  - sugar: portion, mixed meal items.
  - The previous value stays as a ghost line, and a "What changed because of you" diff is shown (R-B2.5). Recompute is debounced. If INP > 200 ms on the mid-range test device, move it into a Web Worker.
- **Best-time heatmap** (R-B9#5): 24 hourly cells.
  - Caffeine: mg left at your bedtime / added sleep latency (24 runs of the cheap caffeine model).
  - Alcohol: hours until about zero relative to your bedtime (sleep tier only). It never mentions driving times.
  - Sugar: **not shown**, because there is no circadian model, and the page says so.
- **Depth layers** (R-B3): a Story / Why / Science / Pro toggle on every number.
  - Why: 2–3 sentences from the ladder.
  - Science: formula, parameters, range, grade, citation (`HowWeKnow`).
  - Pro: a CSV/JSON export of the curves. This replaces "Pro · coming soon" (AU-B6).
- Fix the dead end "X is still in research" (AU-B6): offer the 3 closest DB items.

**Modules:**
- New `YouDrawIt.tsx`, `EventPins.tsx` (into `TimelineBar`/`CalmBar` slider), `WhatIf.tsx` + `ghost.ts`, `BestTime.tsx`, `DepthToggle.tsx`. All are lazy through `lazyUi.tsx`.
- `deeplink.ts`: new params `&g=` (guess shown), `&w=` (what-if state), with `deeplink.test.ts`.
- Spark/Compare graphs get an SVG `<title>`/`<desc>` and a data-table alternative (AU-B5).

**Tests:**
- For every item, the drawable curve exists or the feature is hidden by a rule.
- Pins equal `story.events` and stay inside [0, 1440].
- Heatmap cells come from fresh model runs, and no alcohol cell text has driving words.
- Sliders only use levers declared in `twists.ts`.
- Pro export round-trips (CSV header, units, 5-min step).
- a11y: every new control has a label/valuetext; keyboard draw fallback for You Draw It (arrow keys move points).
- `check:mobile` adds the explorable screens.

**Risks:**
- Drawing on touch conflicts with scrolling. Use a dedicated draw area with `touch-action: none` and a skip button.
- The heatmap can look like advice. Label it "Estimate for you · sleep only".

**Acceptance:**
- Every food page/app view has ≥ 3 interactive figures (draw, pins, what-if; heatmap where its class applies).
- INP ≤ 200 ms on the slider (Chrome trace, mid-range Android profile).
- First load unchanged (± 2 kB): everything lazy.
- The You Draw It reveal stays within 1 tap of opening a food.

---

## P6: Share cards + in-browser auto-video of your own simulation, Size M

**Goal:** turn the user's own simulation into DM-sendable assets. Sends per reach is Instagram's key signal (R-A1#3, R-B5).

**Features:**
- **Cards** (9:16 and 1:1), built on `shareCard.ts`/`MomentShare.tsx`:
  - moment card with the curve + "you are here" + 1 surprising number;
  - guess result card ("I guessed 2 h. Truth: 5 h 40 min");
  - versus card (winner per axis);
  - scorecard card.
- **My 20 s video:** one tap after any simulation. A new `'mini'` cut, 15–20 s:
  - question → curve with your body → number → action → scorecard;
  - "Estimate for you: 62 kg" label, watermark and the food URL;
  - rendered in the browser by the existing `VideoSteps`/`recordFrames`/`encodeMp4` path (WebCodecs) with the user's profile.
- In-app browsers without WebCodecs (`isInAppBrowser`, `VideoFallback.tsx`): offer the image cards plus "Open in your browser to make the video".

**Modules:**
- `video-plan.ts` cut `'mini'` (segment kinds only).
- `VideoSteps.tsx` one-tap entry.
- `shareCard.ts` card layouts.
- `MomentShare.tsx`.
- The URL carries the body only if the user opts in (`deeplink` `&p=` exists). Otherwise the default body is used.

**Tests:**
- The `'mini'` cut passes `checkTimeline5` with mini thresholds (question ≤ 1.0 s, facts/10 s ≥ 3.5, end frame ≥ 2.0 s) for every item.
- Personalized label present whenever profile ≠ default.
- Cards: safe zones, compliance, numbers = story.
- Privacy: no profile data in the URL unless opted in.

**Risks:**
- Low-end phones: cap the mini render at 720p when `perf/device.ts` reports low tier, and show the estimated time.
- Personalized alcohol numbers are sensitive: the never-drive line is always on.

**Acceptance:**
- Mini video renders in ≤ 60 s on a mid-range laptop and ≤ 3 min on a mid-range Android (measured).
- 100% of items can produce all 4 card types.
- GPU critic on 3 user-profile mini videos.

---

## P7: "Your day" multi-meal sim + favorites/history + "My week", Size M

**Goal:** a reason to come back daily without streak pressure (R-B4). Today nothing is remembered (AU-B7: `habits` is only state).

**Features:**
- **Your day:** place items on a 24 h line (breakfast, coffee, lunch, beer).
  - Caffeine stacks by linear superposition (first-order PK: valid, grade A) → "still 90 mg at midnight".
  - Alcohol doses go through the existing zero-order model as one multi-dose meal. Arbitrary start times generalize `paceStarts()`: this is a new model piece with tests against the single-dose model.
  - Glucose and fullness per meal are shown as separate bumps (superposition, grade C, "estimate"). There is **no** "good/bad day" rating; only "What moved the needle".
- **Favorites / "My usuals"** (one tap) and **history** (last 20 simulations). Local only: `i24-favs`, `i24-history`, `i24-day`, following the `PROFILE_KEY` pattern in `AppV4.tsx` ~282–314, with a visible "Clear my data".
- **"My week"**: 5 Wrapped-style cards from local history. **Passport** counts foods *explored*, never foods *eaten* (R-B4).
- **No daily streak.**

**Modules:**
- `story/day.ts` (`dayStoryOf(entries, profile)`).
- New `science/daySim.ts` (composition only; documented sources: linear PK superposition, Widmark zero-order).
- `YourDay.tsx` (built on `MealBar`/`EveryDay`).
- `storage.ts` (versioned schema, safe parse).
- `Passport.tsx`.

**Tests:**
- A day with one entry equals the single simulation exactly (every item, sampled in the fast tier).
- Caffeine superposition equals the sum of singles.
- Alcohol multi-dose with equal spacing equals the existing `pace` result.
- Monotonic: adding an item never lowers the caffeine/BAC total.
- Storage: corrupted JSON resets safely; size cap; no data leaves the device (a test asserts no fetch in storage paths).
- Compliance: no judgment words on the day summary.

**Risks:**
- Glucose superposition ignores the second-meal effect: grade C plus a "What we don't know" line.
- GDPR (R-B8): local only, no account, no sync.

**Acceptance:**
- A 4-item day computes in ≤ 150 ms on the mid-range device.
- Favorites and history survive a reload.
- "Clear my data" removes every `i24-` user key except voice/tour preferences (listed).
- 0 streak UI.

---

## P8: New sourced levers + myth bank + micronutrients, Size M

**Goal:** the actions the research ranks highest, added as explicit, sourced, tested model pieces, plus "I didn't know" content.

**Features:**
- **Walk after eating:** a glucose iAUC reduction factor for a 10-min light walk started within 30 min. Sources: Buffey 2022, the PMC10036272 timing meta. Grade B, range shown, applies only to meals with a sugar curve. It becomes a P4 twist and a P5 slider.
- **Food order** (vegetables/protein first): Shukla 2015 and PubMed 30101510 (iAUC ~−39% in prediabetes). Grade B/C. Shown as "in studies" with the population named, never as a promise.
- **Myth bank** `content/myths.ts`, using fact → myth (once) → why → fact (Debunking Handbook). Class-level myths:
  - coffee does not sober you up;
  - a nightcap and REM;
  - juice ≠ fruit;
  - brown ≠ whole grain;
  - "every spike is dangerous" (anti-hype).
  - Each myth carries a grade and sources. It feeds a video `'myth'` segment and a page block.
- **Micronutrients:** an offline pipeline `pipeline/fdc-micros.mjs` reads the USDA FDC entries by the existing `fdc` IDs into fooddb fields (vitamin C, iron, potassium, calcium, magnesium, folate, B12, vitamin D). It feeds the Nutrients axis and a "micronutrient hero" (R-A11#17). A CI test checks coverage and units.

**Tests:**
- Lever factors are applied only where the class rule allows and only within the sourced range.
- A model-review test pins the sourced numbers (as in `modelReview.test.ts`).
- `claimsIntegrity.test.ts` is extended to myths.
- Every myth is stated at most once per video/page.
- Micronutrient values are ≥ 0, in their units, and present for ≥ 90% of items with `fdc`.

**Risks:**
- Lab effects inflated into promises: the wording is "in studies, … was lower by about X%".
- Myth repetition can backfire: the linter enforces a single mention.

**Acceptance:**
- The walk lever is available for ≥ 80% of meals with a sugar curve.
- ≥ 1 myth for every class.
- Nutrients axis why cites ≥ 1 micronutrient for ≥ 70% of items.
- Critic on 3 myth/lever videos.

---

## P9: Performance and accessibility hardening, Size S/M

**Goal:** lock in the gains and close what the audit could not verify live (AU-B5).

**Work:**
- Measure contrast for `#7a899d`/`#8292a7` on `#04070c` and fix to ≥ 4.5:1 for text.
- Accessible names for 3D organs (list + live region).
- Text alternatives for every chart.
- `prefers-reduced-motion` gives the 2D mode by default.
- FPS auto-downgrade in the first 2 s.
- glb LOD for mobile if the 3D wait is > 3 s on Slow 4G.
- Video text ≥ 34 px on the 1080 frame (telemetry check).
- PWA manifest (no push).

**Acceptance:**
- Lighthouse mobile: Performance ≥ 85 and Accessibility ≥ 95 on home + 3 food pages.
- CLS ≤ 0.1.
- 0 contrast failures in the axe run.
- Budgets in CI (`SITE_REPORT` diff fails if the first-load gz grows > 5 kB without a note).

---

## Cross-phase measurement (added in P2, reported every phase)

- `scripts/density-report.mjs` (from the telemetry of the text audit; no renders) writes per item × cut:
  - facts/10 s;
  - item-specific share;
  - generic share;
  - question time;
  - action count.
  - It goes into `research/improvements/density-<date>.txt`, so the AU-A1.8 table can be regenerated automatically instead of with scratchpad scripts.
- Site: a `SITE_REPORT` first-load table and the sitemap URL count are printed by `make-site-split.mjs`.

## Open items for the owner

- The domain (SITE_URL) is needed before P3's sitemap and canonical tags go live.
- The curated versus list (P3): approve or extend the ~40–80 starter pairs.
- Whether research-status catalog items get pages (default: noindex until promoted).

### Critical files for implementation

- C:\claudework\inside-24h\app\src\v4\analyze.ts (single source the story reads)
- C:\claudework\inside-24h\app\src\v4\video-plan.ts (StopIn kinds, SEG_TIME, `'mini'` cut)
- C:\claudework\inside-24h\app\src\v4\share.ts (Overlay.seg, drawSegment, curve panel, scorecard, text() tagging)
- C:\claudework\inside-24h\app\src\v4\video-telemetry.ts (checkTimeline5 density invariants)
- C:\claudework\inside-24h\app\scripts\make-site-split.mjs + site-meta.mjs + check-site.mjs (per-food pages, sitemap, CSP)
- Also: C:\claudework\inside-24h\app\src\v4\video-facts.ts and Answers.tsx (walking-minutes removal), C:\claudework\inside-24h\app\vite.site.config.ts (chunks, DEEP_LINK), new C:\claudework\inside-24h\app\src\v4\story\
