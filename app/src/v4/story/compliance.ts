// Phase P1 (roadmap 2026-11-24, §0): ONE compliance lexicon for every place that says something about a food: the app's
// visible text (the Food Story, quick answers), the video's cards and voice (text-audit lintText), the posted captions
// (video-caption BANNED, which now lives here) and, from P3 on, the static pages.
// Owner decisions it enforces: kcal only as a number (never minutes of walking or any exercise to "burn it off"), never
// "safe to drive" or "sober up", no diagnosis / treatment / prevention claims, no moral words about food.
// A myth-buster that DENIES a banned promise ("Coffee won't sober you up") is allowed: the negation is checked.

export interface LexEntry { id: string; re: RegExp; why: string }

/** Words before a phrase that turn it into a denial ("won't sober you up", "can't tell you you're safe to drive"). */
const NEG = String.raw`(?<!\b(?:not|never|no|nothing|won[’']t|don[’']t|doesn[’']t|can[’']t|cannot|isn[’']t|aren[’']t)\s(?:[a-z’']+\s){0,6})`;

export const LEXICON: LexEntry[] = [
  // kcal as exercise (owner: kcal only as a number + % of a 2,000 kcal day)
  { id: 'burn-off', re: /\b(?:burn|walk|work|sweat|run)(?:s|ing|ed)?\s+(?:it|them|this|that|those|these|it all)\s+off\b/i, why: 'kcal framed as exercise to undo' },
  { id: 'to-burn', re: /\bto burn\b/i, why: 'kcal framed as exercise to undo' },
  { id: 'earn-it', re: /\bearn(?:ed|s)?\s+(?:it|this|that|your (?:treat|food|meal|dessert))\b/i, why: 'food as something to earn' },
  { id: 'exercise-minutes', re: /\b(?:minutes?|min|hours?|h)\s+of\s+(?:brisk\s+|light\s+|easy\s+)?(?:walking|running|jogging|cycling|swimming|exercise|activity|stairs)\b/i, why: 'kcal as exercise minutes' },
  { id: 'walk-to-burn', re: /\b(?:walk|run|jog|cycle|exercise)(?:ing)?\s+(?:for\s+)?(?:about\s+)?\d+\s*(?:minutes?|min|km|kilometers?|miles?)\s+(?:to|would|will)\b/i, why: 'kcal as exercise minutes' },
  { id: 'burned-walk', re: /\bburn(?:ed|s)?\s+in\s+(?:a|an)\s+\d+[- ]minute\b/i, why: 'kcal as exercise minutes' },
  // driving
  { id: 'safe-to-drive', re: new RegExp(`${NEG}\\b(?:safe|ok|okay|fine|good|fit|clear)\\s+(?:to|for)\\s+driv(?:e|ing)\\b`, 'i'), why: 'never a "safe to drive" claim' },
  { id: 'sober-up', re: new RegExp(`${NEG}\\bsober(?:s|ing|ed)?\\s+(?:you\\s+|me\\s+|them\\s+|yourself\\s+)?up\\b`, 'i'), why: 'nothing sobers you up but time' },
  // diagnosis, treatment, prevention (medical claims)
  { id: 'cure', re: /\bcur(?:e|es|ed|ing)\b/i, why: 'medical claim' },
  { id: 'treat-medical', re: /\btreat(?:s|ed|ing|ment)?\s+(?:your\s+|the\s+|a\s+)?(?:diabetes|disease|illness|condition|symptoms?|pain|hangover|insomnia|blood pressure|cholesterol)\b/i, why: 'medical claim' },
  { id: 'prevent', re: new RegExp(`${NEG}\\bprevent(?:s|ed|ing|ion)?\\b`, 'i'), why: 'prevention claim' },
  { id: 'reverse', re: /\brevers(?:e|es|ed|ing)\s+(?:your\s+|the\s+)?(?:diabetes|disease|damage|aging|ageing|insulin resistance|fatty liver)\b/i, why: 'medical claim' },
  { id: 'detox', re: /\bdetox\w*/i, why: 'medical claim' },
  { id: 'diagnose', re: new RegExp(`${NEG}\\bdiagnos(?:e|es|ed|ing|is)\\b`, 'i'), why: 'diagnosis claim' },
  { id: 'prediabetes', re: /\bprediabet\w*/i, why: 'diagnosis claim' },
  { id: 'manage-diabetes', re: /\bmanag(?:e|es|ing)\s+your\s+diabetes\b/i, why: 'treatment claim' },
  // moral words about food
  { id: 'bad-food', re: /\bbad\s+(?:food|foods|meal|meals|snack|snacks|choice|choices)\b/i, why: 'moral framing of food' },
  { id: 'guilt', re: /\bguilt(?:y|-free|less)?\b/i, why: 'moral framing of food' },
  { id: 'cheat-meal', re: /\bcheat\s+(?:meal|meals|day|days)\b/i, why: 'moral framing of food' },
];

/** The lexicon entries a string breaks (empty = it passes). */
export function complianceHits(s: string): LexEntry[] {
  if (!s) return [];
  return LEXICON.filter((e) => e.re.test(s));
}
/** True when the string breaks no entry. */
export const passesCompliance = (s: string) => complianceHits(s).length === 0;

/** Words a health caption never uses (diet framing, cures, superlatives; research §5). Moved here from video-caption.ts
 *  (re-exported there): captions are stricter than the app (no "best", "miracle"), and every caption also passes LEXICON. */
export const BANNED = /\b(cure[sd]?|detox|burn (it|them) off|weight loss|fat[- ]burning|best|miracle|toxins?|heal(s|ing)?)\b/i;
