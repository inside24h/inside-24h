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

/** Longest card, in words (numbers and "×" count as words). */
export const BEAT_WORDS = 8;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
/** Values that follow the clock: only on the gauges. */
export const DYNAMIC = /‰|mmol\/L|mg\/dL|\bmg of caffeine is (?:left|still)\b/;

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
  [/^In about 1 in 3 people coffee makes the lower bowel start moving within minutes/, () => ['1 in 3 people: the bowel starts moving.', 'It happens before any caffeine is absorbed.']],
  [/^Your stomach wall and small intestine absorb the caffeine/, () => ['Your gut absorbs all of the caffeine.', 'It all passes into your blood.']],
  [/^In the first part of your small intestine the sugar is split into glucose and fructose/, () => ['The sugar splits into glucose and fructose.', 'Both reach your blood within minutes.']],
  [/^In the small intestine it is taken apart: (.+)$/, (m) => ['In the small intestine it is taken apart.',
    ...m[1].replace(/\.$/, '').split(/, /).map((x) => end(cap(x.replace(/ from your gallbladder$/, '')))).filter((x) => words(x) <= BEAT_WORDS)]],
  [/^Sugars and amino acids pass into your blood; the fat goes into the lymph first/, () => ['Sugars and amino acids pass into your blood.', 'The fat goes into the lymph first.']],
  [/^Some of the alcohol was already absorbed through your stomach wall/, () => ['Some alcohol was absorbed through your stomach wall.']],
  [/^Your small intestine absorbs the .+ into your blood within minutes/, () => ['Your small intestine absorbs it within minutes.']],
  [/^Blood from your gut goes to the liver first/, () => ['Blood from your gut reaches the liver first.']],
  [/^Your gut wall and liver together hold back about (\d+)% of the fructose/, (m) => [`Gut and liver hold back ${m[1]}% of fructose.`, 'Most of the glucose passes on.']],
  [/^Over the next hours your body burns about half of the fructose for energy and, mainly in the liver, turns about (\d+)% into glucose/, (m) => ['Your body burns about half the fructose.', `Your liver turns about ${m[1]}% into glucose.`]],
  [/^Your liver takes the caffeine apart: half of it is gone about every ([\d.]+) hours/, (m) => ['Your liver takes the caffeine apart.', `Half is gone every ${m[1]} hours.`]],
  // blood sugar
  [/^Your blood sugar (?:climbs|goes) from /, () => ['Your blood sugar climbs to its peak.']],
  [/^Your pancreas releases insulin to bring it back down/, () => ['Your pancreas releases insulin to lower it.']],
  [/^Your blood sugar drops (?:just|a little) below where you started/, () => ['Your blood sugar dips below where it started.']],
  // caffeine
  [/^(?:About )?(\d+) mg of caffeine reaches your brain and blocks the tiredness signal a little/, (m) => [`About ${m[1]} mg of caffeine reaches your brain.`, 'It blocks the tiredness signal a little.']],
  [/^The caffeine reaches your brain and blocks the “I’m tired” signal a little/, () => ['The caffeine reaches your brain.', 'It blocks the “I’m tired” signal a little.']],
  [/^(\d+) mg of caffeine in total, spread over (.+?): it builds up with each \w+ and is highest now/, (m) => [`${m[1]} mg of caffeine, spread over ${m[2]}.`, 'It builds up and is highest now.']],
  [/^It reaches your brain and blocks the tiredness signal a little/, () => ['It reaches your brain.', 'It blocks the tiredness signal a little.']],
  [/^Caffeine slips into your brain and blocks adenosine/, () => ['Caffeine slips into your brain.', 'It blocks adenosine, the tiredness signal.']],
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
  [/^You may fall asleep faster, but the second half of the night will be clearly broken/, () => ['You may fall asleep faster.', 'Later, your sleep is clearly broken.']],
  [/^You may fall asleep faster, but the second half of the night will be lighter and more broken/, () => ['You may fall asleep faster.', 'Later, your sleep is lighter and more broken.']],
  [/^You may fall asleep faster, but the second half of the night will be a little lighter/, () => ['You may fall asleep faster.', 'Later, your sleep is a little lighter.']],
  [/^In a typical body like yours the alcohol is gone by now, about ([\d.]+ h) after the first sip/, (m) => [`The alcohol is gone after about ${m[1]}.`]],
  [/^Livers differ/, () => ['Livers differ, so for some it takes longer.']],
  [/^Sleep, coffee, water or fresh air don’t speed it up/, () => ['Coffee or water don’t speed it up.']],
  [/^Spreading the drinks lowered the peak, not the end/, () => ['Spreading the drinks lowered the peak.', 'It is gone at about the same time.']],
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
  [/^No extra urine: a can of cola hydrates you about as well as the same amount of water/, () => ['No extra urine.', 'Cola hydrates about as well as water.']],
  // meals
  [/^A big meal: many people feel sleepy about ([\d.]+) hours later/, (m) => ['Many people feel sleepy after a big meal.', `It comes about ${m[1]} hours later.`]],
  [/^The (\d+) g of protein arrive in your blood as amino acids/, (m) => [`${m[1]} g of protein reach your blood.`, 'Amino acids peak about now.']],
  [/^Processing protein/, () => ['Processing it uses a quarter of its calories.']],
  [/^The fat travels through your lymph into the blood/, () => ['The fat travels through your lymph.', 'Then it joins your blood.']],
  [/^Blood fat \(triglycerides\) is highest around now|^Blood fat is highest around now/, () => ['Blood fat is highest around now.']],
  [/^What you can’t digest, ([\d.]+) g of fiber, reaches the start of your large intestine/, (m) => [`${m[1]} g of fiber reach your large intestine.`]],
  [/^The leftovers creep along your large intestine while water is taken back/, () => ['The leftovers creep along your large intestine.', 'Water is taken back on the way.']],
  [/^Food typically takes about (\d+) hours from mouth to toilet/, (m) => [`Food takes about ${m[1]} hours, mouth to toilet.`]],
  // first sip
  [/^Real espressos vary a lot: the strongest one measured had (\d+) mg/, (m) => ['Real espressos vary a lot.', `The strongest one measured had ${m[1]} mg.`]],
  [/^Cola is acidic \(pH ([\d.]+)\)/, (m) => [`Cola is acidic: pH ${m[1]}.`]],
];

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
}
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
  } else for (const s of sentencesOf(text)) push(rule(s));
  return out.length ? out : [title];
}
function rule(sentence: string): string[] {
  for (const [re, f] of RULES) { const m = re.exec(sentence); if (m) return f(m); }
  return generic(sentence);
}
