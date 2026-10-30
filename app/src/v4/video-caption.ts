// Round 11 (2026-10-29, viral research R3, R6, R7): one video, four platforms. Which cut each platform gets, and the
// caption / title / description and hashtags for each, written from the video's own hook and name (never a new
// claim). Search first: the first line is the phrase people type. Instagram allows at most 5 hashtags. Only the TikTok
// text asks for a comment (Meta counts "comment X" as engagement bait); the video itself only says "Guess".
import type { Cut } from './video-plan';
import { commentLine } from './video-hook';

export type Platform = 'tiktok' | 'reels' | 'shorts' | 'facebook';
export const PLATFORMS: Platform[] = ['tiktok', 'reels', 'shorts', 'facebook'];
/** TikTok and Facebook reward 60 s+ (long, 62-75 s); Instagram Reels peak at 45-55 s (medium); Shorts viewers watch
 *  about a third as long (short, 23-30 s). */
export const PLATFORM_CUT: Record<Platform, Cut> = { tiktok: 'long', reels: 'medium', shorts: 'short', facebook: 'long' };
export const PLATFORM_LABEL: Record<Platform, string> = { tiktok: 'TikTok', reels: 'Instagram Reels', shorts: 'YouTube Shorts', facebook: 'Facebook Reels' };
export const PLATFORM_LENGTH: Record<Platform, string> = { tiktok: '62–75 s', reels: '45–55 s', shorts: '23–30 s', facebook: '62–75 s' };

export interface CaptionIn {
  /** the video's short name ("One can of cola") */ name: string;
  hook: { line1: string; line2: string };
  alcohol?: boolean; caffeine?: boolean; sugar?: boolean; solid?: boolean;
  /** a comparison: the two names ("Cola", "Water") */ compare?: { a: string; b: string };
}
export interface Captions { tiktok: string; reels: string; facebook: string; shorts: { title: string; description: string } }

export const DISCLAIMER = 'Simulation for a typical body · not medical advice.';
export const SOURCES_LINE = 'Sources: USDA FoodData Central and the published studies linked in the Inside 24h app (“How we know”).';
export const ALCOHOL_LINE = 'Educational simulation · 18+ · Don’t drink and drive.';
/** Words a health caption never uses (diet framing, cures, superlatives; research §5). */
export const BANNED = /\b(cure[sd]?|detox|burn (it|them) off|weight loss|fat[- ]burning|best|miracle|toxins?|heal(s|ing)?)\b/i;

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const STOP = new Set(['one', 'a', 'an', 'can', 'cup', 'glass', 'glasses', 'bottle', 'of', 'whole', 'small', 'large', 'big', 'portion', 'slice', 'slices', 'serving', 'ml', 'g', 'l', 'cl', 'with', 'and', 'the', 'shot', 'mug', 'pint']);
/** The food's own hashtag word ("One can of cola" → "cola", "3 × 500 ml of beer over 2 h" → "beer"). Round 12 (critic
 *  P1-4: #spread, #roll, #cola for a meal): the first item of a meal, before any "with …", and a generic last word
 *  keeps its kind ("Cinnamon roll" → "cinnamonroll", "Crepes with chocolate spread" → "crepes"). */
const GENERIC_LAST = new Set(['roll', 'rolls', 'cake', 'pie', 'bar', 'bread', 'juice', 'milk', 'tea', 'soup', 'salad', 'cream', 'water', 'wine', 'chips']);
export function foodTag(name: string): string {
  const first = name.replace(/\s+over\s+.*$/i, '').replace(/\([^)]*\)/g, '').split(/,|\band\b|\bwith\b/i)[0];
  const w = first.toLowerCase().split(/[^a-z]+/).filter((x) => x && !STOP.has(x));
  if (!w.length) return 'food';
  const last = w[w.length - 1];
  return (GENERIC_LAST.has(last) && w.length >= 2 && !/^(red|white|green|black|sparkling|still|whole|plain)$/.test(w[w.length - 2]) ? w[w.length - 2] + last : last).replace(/[^a-z]/g, '') || 'food';
}
/** Fast food gets the tag people search for it by. */
const extraTags = (name: string) => (/\b(burger|hamburger|cheeseburger|fries|pizza|kebab|hot dog|nuggets)\b/i.test(name) ? ['fastfood'] : []);
const topicTag = (c: CaptionIn) => (c.alcohol ? 'alcohol' : c.sugar ? 'bloodsugar' : c.caffeine ? 'caffeine' : 'digestion');
/** At most `max` hashtags, and #inside24h always among them (the series). */
const tags = (list: string[], max: number) => { const own = [...new Set(list.filter((t) => t !== 'inside24h'))].slice(0, max - 1); return [...own, 'inside24h'].map((t) => `#${t}`).join(' '); };
/** "What 2 crepes … do", "What a can of cola does" (round 12, critic P2-3). */
const plural = (name: string) => /^(?:[2-9]|\d{2,})\s|×/.test(name.trim());

export function captionsFor(c: CaptionIn): Captions {
  const cmp = c.compare;
  const subject = cmp ? `${cmp.a} vs ${cmp.b}` : c.name;
  const search = cmp ? `${subject}: what happens in your body in 24 hours` : `What happens in your body after ${lower(c.name)} (24 hours)`;
  const hook = `${c.hook.line1} ${c.hook.line2}`.replace(/\s+/g, ' ').trim();
  const food = cmp ? [foodTag(cmp.a), foodTag(cmp.b), ...extraTags(`${cmp.a} ${cmp.b}`)] : [foodTag(c.name), ...extraTags(c.name)];
  const safety = c.alcohol ? `\n${ALCOHOL_LINE}` : '';
  const foot = `${DISCLAIMER} ${SOURCES_LINE}${safety}`;
  // TikTok: the search phrase, the hook, ONE question for the comments, 5 specific hashtags
  const ask = cmp ? `${commentLine(cmp.a, cmp.b)} 👇` : 'What surprised you most? 👇';
  const tiktok = `${search} · ${hook}\n${ask}\n${foot}\n${tags([...food, topicTag(c), 'whathappensinyourbody', 'foodscience'], 5)}`;
  // Instagram / Facebook: no comment command, at most 5 hashtags (Instagram's limit)
  const reels = `${search}\n${hook}\n${foot}\n${tags([...food, topicTag(c), 'whathappensinyourbody'], 5)}`;
  const facebook = `${search}\n${hook}\n${foot}`;
  // YouTube Shorts: a title of at most 60 characters, a one-sentence description with the sources, 3 hashtags
  const titles = [cmp ? `${subject}: inside your body in 24 h` : `What ${lower(c.name)} ${plural(c.name) ? 'do' : 'does'} inside you in 24 h`, `${subject}: inside your body in 24 h`, `${subject} in 24 hours`];
  const title = titles.find((t) => t.length <= 60) ?? `${subject}`.slice(0, 60);
  const description = `${hook} Hour by hour, in a simulated typical body.\n${foot}\n${tags([...food, topicTag(c)], 3)}`;
  return { tiktok, reels, facebook, shorts: { title, description } };
}
