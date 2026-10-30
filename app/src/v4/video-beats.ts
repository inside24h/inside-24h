// Video captions as BEATS (2026-10-24): every card on screen is one short, complete thought (≤ 8 words, starts with a
// capital, ends with a full stop), never a chunk of a longer sentence ("your stomach within about 40 minutes:").
//
// The words come from the chapter's own text (stories.ts, foodProduct.ts): a sentence that is already short is used
// as it is; a long one is cut at its own clause marks (":" ";") when each part is a whole sentence; the common long
// sentences have a short form below that says the same thing in fewer words. Nothing new is claimed.
//
// Numbers that change with the clock (blood alcohol ‰, blood sugar mmol/L, caffeine left in you) never appear on a
// card: they live on the gauge next to the body, so the gauge and the words can never disagree (the chapter's
// number is for its own minute; the gauge follows the clock).

import { BAC_SPREAD, BAC_SPREAD_UP } from '../science/ranges';
import { ELIM_RANGE } from '../science/alcoholClock';

/** Longest card, in words (numbers and "×" count as words). */
export const BEAT_WORDS = 8;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
/** Values that follow the clock: only on the gauges. */
export const DYNAMIC = /‰|mmol\/L|mg\/dL|\bmg of caffeine is (?:left|still)\b|\bg of fiber reach/;

/** A card is a complete thought: capital (or number / quote) first, sentence end last, short. */
export function isCard(s: string): boolean {
  const t = s.trim();
  return !!t && words(t) <= BEAT_WORDS && /^[A-Z0-9“"+]/.test(t) && /[.!?]$/.test(t) && !/[:;,–—]$/.test(t.slice(0, -1).trim()) && !DYNAMIC.test(t);
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const end = (s: string) => { const t = s.trim().replace(/[\s,:;–—]+$/, ''); return /[.!?]$/.test(t) ? t : `${t}.`; };

type Rule = [RegExp, (m: RegExpMatchArray) => string[]];
/** Short forms of the app's long sentences (same meaning, fewer words). Matched against one sentence at a time. */
const RULES: Rule[] = [
  // stomach
  [/^(?:Each (\w+): )?[Hh]alf of it leaves your stomach within about (\d+) minutes(.*)$/, (m) => [
    m[1] ? `Each ${m[1]}: half leaves within ${m[2]} minutes.` : `Half leaves your stomach within ${m[2]} minutes.`,
    ...(/alcohol and the rest of the drink slow/.test(m[3]) ? ['The drink slows your stomach down.'] : /alcohol slows the stomach a little/.test(m[3]) ? ['Alcohol slows your stomach a little.']
      : /calories slow/.test(m[3]) ? ['Its calories slow your stomach down.'] : /as fast as water/.test(m[3]) ? ['About as fast as water.'] : [])]],
  [/^(?:Each \w+: y|Y)our stomach churns it into a paste and lets it out slowly: half has moved on after about (\d+) minutes, almost all of it by (\d+) hours/, (m) => [
    'Your stomach churns it into a paste.', `Half has moved on after ${m[1]} minutes.`, `Almost all has moved on by ${m[2]} hours.`]],
  [/^(?:Each round has t|T)wo speeds: (.+?) runs ahead along the stomach wall, half gone in about (\d+) minutes/, (m) => [
    'Your stomach works at two speeds.', ...(words(`${m[1]} runs ahead along the stomach wall.`) <= BEAT_WORDS ? [cap(`${m[1]} runs ahead along the stomach wall.`)] : ['The drink runs ahead along the wall.']), `Half of it is gone in ${m[2]} minutes.`]],
  [/^.+ (?:are|is) churned into a paste and let out slowly: half after about (\d+) minutes/, (m) => ['The food is churned into a paste.', `Half of it moves on after ${m[1]} minutes.`]],
  [/^(?:Each round: e|E)verything is mixed into one paste: half of the meal has moved on after about (\d+) minutes/, (m) => ['Everything is mixed into one paste.', `Half has moved on after ${m[1]} minutes.`]],
  [/^Because of the sugar, it lets the (\w+) out slowly: half is still here after about (\d+) minutes/, (m) => [`The sugar makes the ${m[1]} leave slowly.`, `Half is still here after ${m[2]} minutes.`]],
  [/^Water barely stops here: half of it moves on within about (\d+) minutes/, (m) => ['Water barely stops here.', `Half moves on within ${m[1]} minutes.`]],
  [/^A small drink leaves fast: half of it moves on within about (\d+) minutes/, (m) => ['A small drink leaves fast.', `Half moves on within ${m[1]} minutes.`]],
  [/^Coffee also makes your stomach produce more acid/, () => ['Coffee also makes more stomach acid.']],
  // gut, blood, liver
  [/^In about 1 in 3 people coffee makes the lower bowel start moving within minutes/, () => ['Coffee sends 1 in 3 to the toilet.', 'Even before the caffeine kicks in.']],
  [/^Your stomach wall and small intestine absorb the caffeine/, () => ['Your gut absorbs all of the caffeine.', 'It all passes into your blood.']],
  [/^In the first part of your small intestine the sugar is split into glucose and fructose/, () => ['Your gut splits the sugar in two.', 'Both parts reach your blood in minutes.']],
  [/^In the small intestine it is taken apart: (.+)$/, (m) => ['In the small intestine it is taken apart.',
    ...m[1].replace(/\.$/, '').split(/, /).map((x) => end(cap(plain(x.replace(/ from your gallbladder$/, ''))))).filter((x) => words(x) <= BEAT_WORDS)]],
  [/^Sugars and amino acids pass into your blood; the fat goes into the lymph first/, () => ['Sugar and protein pieces enter your blood.', 'Fat takes a slower route, via the lymph.']],
  [/^Some of the alcohol was already absorbed through your stomach wall/, () => ['Some alcohol was absorbed through your stomach wall.']],
  [/^Your small intestine absorbs the .+ into your blood within minutes/, () => ['Your small intestine absorbs it within minutes.']],
  [/^Blood from your gut goes to the liver first/, () => ['Blood from your gut reaches the liver first.']],
  [/^Your gut wall and liver together hold back about (\d+)% of the fructose/, (m) => [`Gut and liver catch ${m[1]}% of fruit sugar.`, 'Most of the rest goes into your blood.']],
  [/^Over the next hours your body burns about half of the fructose for energy and, mainly in the liver, turns about (\d+)% into glucose/, (m) => ['Your body burns half the fruit sugar.', `Your liver turns ${m[1]}% into blood sugar.`]],
  [/^Your liver takes the caffeine apart: half of it is gone about every ([\d.]+) hours/, (m) => ['Your liver takes the caffeine apart.', `Half is gone every ${m[1]} hours.`]],
  // blood sugar
  [/^Your blood sugar (?:climbs|goes) from /, () => ['Your blood sugar climbs to its peak.']],
  [/^Your pancreas releases insulin to bring it back down/, () => ['Insulin brings your blood sugar back down.']],
  [/^Your blood sugar drops (?:just|a little) below where you started/, () => ['Your blood sugar dips below where it started.']],
  // caffeine
  [/^(?:About )?(\d+) mg of caffeine reaches your brain and blocks the tiredness signal a little/, () => ['The caffeine reaches your brain.', 'It blocks the tiredness signal a little.']], // (round 9: no mg on the card, the gauge counts it),
  [/^The caffeine reaches your brain and blocks the “I’m tired” signal a little/, () => ['The caffeine reaches your brain.', 'It blocks the “I’m tired” signal a little.']],
  [/^(\d+) mg of caffeine in total, spread over (.+?): it builds up with each \w+ and is highest now/, (m) => [`${m[1]} mg of caffeine, spread over ${m[2]}.`, 'It builds up and is highest now.']],
  [/^It reaches your brain and blocks the tiredness signal a little/, () => ['It reaches your brain.', 'It blocks the tiredness signal a little.']],
  [/^Caffeine slips into your brain and blocks adenosine/, () => ['Caffeine slips into your brain.', 'It blocks your “I’m tired” signal.']],
  [/^Caffeine in your blood is at its highest now/, () => ['Caffeine in your blood peaks now.']],
  [/^With food the caffeine arrives later/, () => ['With food the caffeine arrives later.']],
  [/^About \d+ mg of caffeine is (?:left|still) in you/, () => ['Some caffeine is still in you.']],
  // alcohol
  [/^Blood alcohol is at its highest now/, () => ['Blood alcohol is at its highest now.']],
  [/^Blood alcohol is now about .*coming down from its peak/, () => ['Blood alcohol is slowly coming down.']],
  [/^Blood alcohol keeps rising for a while after the last drink/, () => ['Blood alcohol keeps rising for a while.']],
  [/^Dangerous: people have died of alcohol poisoning/, () => ['Dangerous: alcohol poisoning level.']],
  [/^If someone can’t be woken or breathes slowly/, () => ['Can’t be woken? Call 112 (Europe).']],
  [/^There is still alcohol in your blood/, () => ['There is still alcohol in your blood.']],
  [/^You may fall asleep faster, but the second half of the night will be clearly broken/, () => ['You may fall asleep faster, but sleep worse.', 'Later, your sleep is clearly broken.']],
  [/^You may fall asleep faster, but the second half of the night will be lighter and more broken/, () => ['You may fall asleep faster, but sleep worse.', 'Later, your sleep is lighter and more broken.']],
  [/^You may fall asleep faster, but the second half of the night will be a little lighter/, () => ['You may fall asleep faster, but sleep lighter.', 'Later, your sleep is a little lighter.']],
  [/^In a typical body like yours the alcohol is gone by now, about ([\d.]+ h) after the first sip/, (m) => [`The alcohol is gone after about ${m[1]}.`]],
  [/^Livers differ/, () => ['Livers differ, so for some it takes longer.']],
  [/^Sleep, coffee, water or fresh air don’t speed it up/, () => ['Coffee or water don’t speed it up.']],
  [/^Spreading the drinks lowered the peak, not the end/, () => ['Spreading the drinks lowered the peak.', 'It is gone at about the same time.']],
  [/^In all, about (\d+) teaspoons of sugar reach your blood/, (m) => [`About ${m[1]} teaspoons of sugar, from starch.`]], // (round 12)
  [/^This app can’t tell you when you’re safe to drive/, () => ['We can’t tell when you’re safe to drive.']],
  [/^A day later there is still alcohol in your blood/, () => ['After 24 h, alcohol is still in you.']],
  [/^Your liver works at a fixed speed, asleep or awake/, () => ['Your liver works at a fixed speed.', 'Coffee or water don’t speed it up.']],
  [/^(\d\d:\d\d), waking up/, (m) => [`Waking up at ${m[1]}.`]],
  [/^A typical body like yours still has about .* of alcohol in the blood: a breath test can be positive/, () => ['Some alcohol is still in your blood.', 'A breath test can be positive.']],
  [/^In a typical body the alcohol is gone, but with a slow liver/, () => ['The alcohol is gone in a typical body.', 'A breath test can still be positive.']],
  [/^The alcohol should be gone, but a hangover can still make you drive worse/, () => ['The alcohol should be gone.', 'A hangover can still make you drive worse.']],
  [/^If you use insulin or diabetes tablets, watch for low blood sugar/, () => ['On diabetes medicine? Watch for low sugar.']],
  // water, kidneys
  [/^The first water reaches your blood within (\d+) minutes/, (m) => [`Water reaches your blood within ${m[1]} minutes.`]],
  [/^In the gut it travels in small pockets/, () => ['It travels in small, teaspoon-sized pockets.']],
  [/^It spreads through all the water in your body/, () => ['It spreads through all your body water.']],
  [/^Most of the glass is now collecting in your bladder/, () => ['Most of it collects in your bladder.']],
  [/^About (\d+) hours later the glass has passed through you/, () => ['The glass has passed through you.', 'Your body water is back in balance.']],
  [/^The extra water \(?.*\)? is filtered by your kidneys into your bladder/, () => ['Your kidneys filter the extra water.', 'It collects in your bladder for hours.']],
  [/^A beer does not make you lose more water than you drank/, () => ['You don’t lose more water than you drank.']],
  [/^No extra urine: a can of cola hydrates you about as well as the same amount of water/, () => ['It hydrates like the same amount of water.']],
  // meals
  [/^A big meal: many people feel sleepy about ([\d.]+) hours later/, (m) => ['Many people feel sleepy after a big meal.', `It comes about ${m[1]} hours later.`]],
  // the protein arrives over hours; this moment is its peak (model review 2026-10-24: not "139 g reach your blood")
  [/^The (\d+) g of protein arrive in your blood as amino acids/, () => ['Protein pieces in your blood peak now.', 'They keep arriving for hours.']],
  [/^Processing protein/, () => ['Processing it uses a quarter of its calories.']],
  [/^The fat travels through your lymph into the blood/, () => ['Fat takes a slower route, via the lymph.', 'Then it joins your blood.']],
  [/^Blood fat \(triglycerides\) is highest around now|^Blood fat is highest around now/, () => ['Blood fat is highest around now.']],
  // no amount: the gauge shows how much has arrived at this minute (the chapter's total would disagree with it)
  [/^What you can’t digest, ([\d.]+) g of fiber, reaches the start of your large intestine/, () => ['The fiber reaches your large intestine.']],
  [/^The leftovers creep along your large intestine while water is taken back/, () => ['The leftovers creep along your large intestine.', 'Water is taken back on the way.']],
  // round 6 (critic: "29 hours" without its range): the normal range, as the source gives it
  [/^Food typically takes about (\d+) hours from mouth to toilet.*?anywhere from (\d+) to (\d+) hours/, (m) => [`Mouth to toilet usually takes ${m[2]}–${m[3]} hours.`]],
  [/^Food typically takes about (\d+) hours from mouth to toilet/, (m) => [`Food takes about ${m[1]} hours, mouth to toilet.`]],
  // "2% has left your body so far": 2 % of what? Said plainly (owner review 2026-10-24). Round 5 (critic: "almost
  // all of it is still inside you" read as "the pizza sits there undigested", next to a 3 g gauge): the leftovers
  [/^(\d+)% has left your body so far/, (m) => [Number(m[1]) < 10 ? 'Most of the fiber is still in you.' : `${m[1]}% of the leftovers have left you.`]], // (round 6: plain words; the range follows)
  // (round 5, critic: the liver breaks caffeine down; the kidneys flush out the pieces, not "what is left")
  [/^Your kidneys flush out the breakdown products/, () => ['Your kidneys flush out its broken-down pieces.']],
  [/^Your gut bacteria start fermenting it/, () => ['Your gut bacteria start feeding on it.']],
  // first sip
  [/^Real espressos vary a lot: the strongest one measured had (\d+) mg/, (m) => ['Real espressos vary a lot.', `The strongest one measured had ${m[1]} mg.`]],
  [/^Cola is acidic \(pH ([\d.]+)\)/, () => ['Cola is very acidic.']],
];

/** Everyday words for the gut's chemistry (one idea per card). */
function plain(x: string): string {
  return x.replace(/^starch and sugar become glucose$/i, 'starch and sugar turn into blood sugar')
    .replace(/^protein becomes amino acids$/i, 'protein is broken into building blocks')
    .replace(/^fat is split with bile$/i, 'bile helps break down the fat');
}

/** Generic: whole short sentences, else the sentence's own clauses (":" ";") when each is a whole thought. */
function generic(sentence: string): string[] {
  const s = sentence.trim();
  if (isCard(s)) return [s];
  const parts = s.replace(/[.!?]$/, '').split(/:\s+|;\s+/).map((x) => end(cap(x.trim()))).filter((x) => x.length > 2);
  if (parts.length < 2) return [];
  return parts.filter((p) => isCard(p) && !/^(?:And|But|Or|So|Then|Which|That|While|Even|About|Almost|Mainly|Around)\b/.test(p) && words(p) >= 2);
}

/** Strips asides the video leaves out: long brackets (> 4 words) and any bracket with a value that follows the clock. */
export function beatText(text: string): string {
  return text.replace(/\s*\(([^()]*)\)/g, (all, inner: string) => (inner.trim().split(/\s+/).length > 4 || DYNAMIC.test(inner) ? '' : all))
    .replace(/\s+([,.;:!?])/g, '$1').replace(/\s+/g, ' ').trim();
}
const sentencesOf = (text: string) => text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+(?=["“(A-Z0-9])/).map((s) => s.trim()).filter(Boolean);

export interface BeatCtx {
  /** the video's short name for what was eaten ("One can of cola", "A whole pizza") */ name?: string;
  /** split screen: the start shows its numbers first (the name is already over the body) */ factsFirst?: boolean;
  /** pacing ("Over how long?"): rounds and the time between them, as the model doses them */
  pace?: { doses: number; overMin: number; everyMin: number; round: string };
  /** round 5: the caffeine dose (mg), so "still in you at bedtime" is said as a share of it ("about a fifth") */ caffeineMg?: number;
  /** round 5: clock time of the first sip (minutes after midnight), so "gone" is said as a range of hours */ drinkAtMin?: number;
  /** round 6: the blood alcohol peak (g/L, typical body) and its minute: "gone" is then said from the SAME range as the
   *  gauge (bodies −40 %/+50 %, BAC_SPREAD) and the livers' range (0.20 / 0.10 g/L an hour, ELIM_RANGE) */ bacPeak?: { g: number; min: number };
  /** round 6: grams of alcohol (the hangover warning is said from 40 g up) */ alcoholG?: number;
}
/** A share in words ("a fifth", "two thirds"), or null when it is too small to name. */
export function fractionWord(r: number): string | null {
  if (!(r >= 0.07)) return null;
  const W: [number, string][] = [[0.1, 'a tenth'], [0.2, 'a fifth'], [0.25, 'a quarter'], [1 / 3, 'a third'], [0.5, 'half'], [2 / 3, 'two thirds'], [0.75, 'three quarters'], [0.9, 'almost all']];
  return W.reduce((b, w) => (Math.abs(w[0] - r) < Math.abs(b[0] - r) ? w : b))[1];
}
/** Hours from the first sip until the alcohol is gone, as a range that covers the gauge: the lightest reading
 *  (−40 %) with the fastest liver, the heaviest (+50 %) with the slowest, counted from the peak. */
export function goneRange(peakG: number, peakMin: number): [number, number] {
  const lo = (peakMin / 60) + (peakG * (1 - BAC_SPREAD)) / ELIM_RANGE.fast, hi = (peakMin / 60) + (peakG * (1 + BAC_SPREAD_UP)) / ELIM_RANGE.slow;
  return [Math.max(1, Math.round(lo)), Math.ceil(hi)];
}
/** Safety cards that lead their moment (video-plan SAFETY: shown together in every cut). */
const SAFE_CARD = /breath test|\bdrive\b/i;
const elapsed = (m: number) => { const r = Math.round(m); return `+${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`; };
const hoursLabel = (min: number) => (min % 60 ? `${Math.round(min / 6) / 10} h` : `${min / 60} h`);

/** The cards of one chapter, in order (at least one: the chapter title when nothing else fits). */
export function beatLines(ch: { min: number; title: string; text: string }, ctx: BeatCtx = {}): string[] {
  const out: string[] = [];
  const push = (xs: string[]) => { for (const x of xs) if (isCard(x) && !out.includes(x)) out.push(x); };
  const text = beatText(ch.text);
  const title = ch.title.trim();
  if (/^First (?:sip|bite)/i.test(title)) {
    // what it is, then its numbers (all fixed for the whole day)
    const sugar = /(\d+) g (?:of )?sugar(?:[^.]*?about (\d+) teaspoons?)?/.exec(text), caf = /(\d+) mg of caffeine/.exec(text);
    const alc = /(\d+) g (?:of )?alcohol/.exec(text), kcal = /(\d+) kcal/.exec(text);
    const facts = [sugar && (sugar[2] ? `${sugar[1]} g of sugar: about ${sugar[2]} teaspoons.` : `${sugar[1]} g of sugar.`), caf && `${caf[1]} mg of caffeine.`,
      alc && `${alc[1]} g of alcohol.`, kcal && !sugar && `${kcal[1]} kcal in total.`].filter((x): x is string => !!x);
    // (with pacing the name loses its "over 2 h": the next card explains it)
    if (ctx.factsFirst && facts.length) push(facts);
    if (ctx.name && (facts.length || ctx.pace)) push([end(cap(ctx.pace ? ctx.name.replace(/ over .+$/, '') : ctx.name))]);
    else for (const s of sentencesOf(text).slice(0, 2)) push(rule(s)); // no numbers to add: its own short words
    if (ctx.pace) push([`Over ${hoursLabel(ctx.pace.overMin)}: one ${ctx.pace.round} every ${Math.round(ctx.pace.everyMin)} minutes.`]);
    // a number already said is not said again
    push(facts.filter((f) => !out.some((o) => o.includes(/^[\d.]+/.exec(f)?.[0] ?? '~'))));
  } else if (/^Last (?:drink|serving|round)$/i.test(title) && ctx.pace) {
    // the model doses each round at the start of its slot: rounds at 0, 40 and 80 minutes for 3 over 2 h
    const p = ctx.pace;
    push([`${cap(p.round)} ${p.doses} of ${p.doses}, at ${elapsed(ch.min)}.`, `One every ${Math.round(p.everyMin)} minutes, over ${hoursLabel(p.overMin)}.`]);
    if (/keeps rising/.test(text)) push(['Blood alcohol keeps rising for a while.']);
  } else {
    // round 5: "gone" as a range of hours (critic: "gone after 8.5 h" while the gauge allowed ~12 h), from the
    // chapter's own range of clock times ("for most people somewhere between 04:51 tomorrow and 09:18 tomorrow")
    const range = /between (\d\d):(\d\d)\b[^.]*? and (\d\d):(\d\d)\b/.exec(text);
    const goneSpan = /alcohol is gone by now/.test(text) && range && ctx.drinkAtMin !== undefined ? (() => {
      const h = (hh: string, mm: string) => ((((Number(hh) * 60 + Number(mm) - ctx.drinkAtMin!) % 1440) + 1440) % 1440) / 60;
      const lo = Math.round(h(range[1], range[2])), hi = Math.round(h(range[3], range[4]));
      return hi > lo ? `The alcohol is gone after about ${lo}–${hi} h.` : null;
    })() : null;
    // round 6: from the gauge's own range (critic: the top end needs ~13-14 h, the card said 10)
    const gone2 = /alcohol is gone by now/.test(text) && ctx.bacPeak ? goneRange(ctx.bacPeak.g, ctx.bacPeak.min) : null;
    const goneCard = gone2 ? `The alcohol is gone after about ${gone2[0]}–${gone2[1]} h.` : goneSpan;
    if (goneCard) push([goneCard]);
    for (const s of sentencesOf(text)) {
      if (goneCard && /^(?:In a typical body like yours the alcohol is gone by now|Livers differ)/.test(s)) continue;
      // bedtime caffeine as a share of the dose ("About a fifth of it is still in you."; the mg are on the gauge)
      const left = /^About (\d+) mg of caffeine is (?:left|still) in you/.exec(s), fw = left && ctx.caffeineMg ? fractionWord(Number(left[1]) / ctx.caffeineMg) : null;
      // (round 7, critic B2: "About a third is still in you." read as a third of the SUGAR: the card names it)
      if (fw) { push([fw === 'almost all' ? 'Almost all the caffeine is still in you.' : `About ${fw} of the caffeine remains.`]); continue; }
      push(rule(s));
    }
    // the next morning with alcohol: the safety cards lead, together, with the time ("At 07:00, a breath test can be
    // positive." / "Don't drive."); "Waking up at 07:00." is then said by them
    // round 6 (critic: a hangover after ONE beer is not typical): the hangover warning from 40 g of alcohol up;
    // below that the plain rule
    if (ctx.alcoholG !== undefined && ctx.alcoholG < 40) { const k = out.indexOf('A hangover can still make you drive worse.'); if (k >= 0) out[k] = 'Don’t drive after drinking.'; }
    const wake = out.map((c) => /^Waking up at (\d\d:\d\d)\.$/.exec(c)?.[1]).find(Boolean);
    if (out.some((c) => /breath test/i.test(c))) {
      const safe = out.filter((c) => SAFE_CARD.test(c)).map((c) => {
        const b = /^(A breath test can (?:still )?be positive\.)$/.exec(c);
        const at = b && wake ? `At ${wake}, ${b[1].charAt(0).toLowerCase()}${b[1].slice(1)}` : c;
        return isCard(at) ? at : c;
      });
      const keepWake = !safe.some((c) => /^At \d\d:\d\d,/.test(c));
      const rest = out.filter((c) => !SAFE_CARD.test(c) && !(wake && !keepWake && /^Waking up at /.test(c)));
      out.splice(0, out.length, ...safe, ...rest);
    } else if (/^Next morning$/i.test(title) && out.some((c) => SAFE_CARD.test(c))) {
      // (a first sip early in the evening: the model says the alcohol should be gone by morning; its safety words
      // lead the moment: "At 07:00, the alcohol should be gone." / "A hangover can still make you drive worse.")
      const i = out.findIndex((c) => SAFE_CARD.test(c)), lead = i > 0 && !/^Waking up/.test(out[i - 1]) ? out[i - 1] : null;
      const first = lead && wake ? `At ${wake}, ${lead.charAt(0).toLowerCase()}${lead.slice(1)}` : lead;
      const head = [...(first && isCard(first) ? [first] : lead ? [lead] : []), out[i]];
      const rest = out.filter((c, k) => k !== i && c !== lead && !(wake && first && /^Waking up at /.test(c)));
      out.splice(0, out.length, ...head, ...rest);
      // round 7 (critic B1: "gone after about 4–14 h", then "At 07:00, the alcohol should be gone."): when the range's
      // top end (the slowest liver, the heaviest reading) is after waking, the morning says so instead
      if (wake && ctx.bacPeak && ctx.drinkAtMin !== undefined) {
        const [hh, mm] = wake.split(':').map(Number), wakeH = ((((hh * 60 + mm - ctx.drinkAtMin) % 1440) + 1440) % 1440) / 60;
        if (goneRange(ctx.bacPeak.g, ctx.bacPeak.min)[1] > wakeH) {
          const keep = out.filter((c) => !/should be gone|hangover|^Don’t drive/.test(c));
          out.splice(0, out.length, `At ${wake}, a breath test may be positive.`, 'Don’t drive.', ...keep);
        }
      }
    }
  }
  // (round 6: water is not "about as fast as water")
  if (/\bwater\b/i.test(ctx.name ?? '')) { const k = out.indexOf('About as fast as water.'); if (k >= 0) out.splice(k, 1); }
  return out.length ? out : [title];
}
function rule(sentence: string): string[] {
  for (const [re, f] of RULES) {
    const m = re.exec(sentence);
    // round 5 (critic: "Even before the caffeine kicks in." stood alone, its first card too long and dropped): a
    // rule whose first card is not a valid card gives nothing, never an orphan (video-hook.test checks every rule)
    if (m) { const c = f(m); return isCard(c[0] ?? '') ? c : []; }
  }
  return generic(sentence);
}
/** The cards one sentence gives (tests: no rule ever loses a card). */
export const ruleCards = (sentence: string) => { for (const [re, f] of RULES) { const m = re.exec(sentence); if (m) return f(m); } return generic(sentence); };

/** Safety net (2026-10-24, owner review: "20 g fiber" on the gauge, "22.7 g of fiber" on the card): true when a card
 *  and a gauge on screen name the same thing (same unit and the same word after it) with different numbers. */
/** Round 12 (critic P0-3: "Half has moved on after 116 minutes." while the clock stood at +0:01): the minute a card
 *  says something happened ("after about 116 minutes", "by 4 hours"), or null. A forecast ("within 40 minutes") may be said early. Intervals ("one
 *  drink every 40 minutes") and clock times are not events. */
export function eventMin(card: string): number | null {
  const m = /\b(?:after|by)\s+(?:about\s+)?(\d+(?:\.\d+)?)\s*(minutes?|min|hours?|h)\b/i.exec(card);
  if (!m) return null;
  return Number(m[1]) * (/^h/i.test(m[2]) ? 60 : 1);
}
/** A card is early when the clock is clearly before the moment it speaks of. */
export const tooEarly = (card: string, clockMin: number) => { const t = eventMin(card); return t !== null && t > clockMin + Math.max(10, 0.15 * t); };

export function numberConflict(card: string, gauges: readonly string[]): boolean {
  const facts = (s: string) => [...s.matchAll(/(\d+(?:[.,]\d+)?)\s*(mg|ml|g|kcal|%|‰)\s+(?:of\s+)?([a-z]+)/gi)].map((m) => ({ n: m[1].replace(',', '.'), key: `${m[2].toLowerCase()} ${m[3].toLowerCase()}` }));
  const a = facts(card);
  return gauges.some((g) => facts(g).some((f) => a.some((x) => x.key === f.key && x.n !== f.n)));
}
