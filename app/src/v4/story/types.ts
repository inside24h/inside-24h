// Phase P1 (roadmap 2026-11-24): the Food Story contract. One pure, deterministic, JSON-serializable story for any
// parts list, profile and cut; the site (Story card, Compare, later the per-food pages) and, from P2 on, the video read
// only this, never `built.story.chapters` directly.
import type { Level } from '../../content/types';
import type { ArcClass } from '../video-facts';

export type { Level };
/** The story's class (the same classes the video's arc uses, video-facts arcClass). */
export type StoryClass = ArcClass;

export interface StoryNumber {
  key: string; value: number; unit: string; /** as shown ("139 kcal") */ text: string;
  /** where people differ: the range shown instead of one number */ range?: [number, number];
  grade: Level; /** ids that resolve through content/tips tipSource */ sources: string[];
  /** 'db' = food database (USDA / label), 'model' = a model curve from analyze(), 'rule' = arithmetic on those (a share, an anchor) */
  origin: 'db' | 'model' | 'rule';
  /** an everyday comparison ("≈ 9 sugar cubes") */ anchor?: string;
  /** true when it is this food's own number (not a constant such as a body's half-life of a reference) */ itemSpecific: boolean;
}
export interface StoryEvent {
  min: number;
  key: 'peak' | 'backToUsual' | 'halfCaffeine' | 'caffeineAtBed' | 'alcoholZero' | 'stomachEmpty' | 'fiberColon' | 'bedtime' | 'fatPeak';
  numberKey?: string; organ?: string;
}
export interface Ladder { min: number; organ: string; cause: string; effectKey: string; soWhat: string; actionKey?: string }
export interface Surprise { numberKey: string; claim: string; anchor?: string; score: number; question: string; options: [string, string, string]; answer: 0 | 1 | 2 }
export interface StoryAction { kind: 'bestTime' | 'pairWith' | 'swapFor' | 'tip'; text: string; grade: Level; sources: string[]; deltaKey?: string }
export type AxisKey = 'energy' | 'sugar' | 'fullness' | 'sleep' | 'nutrients';
export const AXIS_KEYS: AxisKey[] = ['energy', 'sugar', 'fullness', 'sleep', 'nutrients'];
export interface Axis { key: AxisKey; tier: 0 | 1 | 2 | 3 | null; word: string; why: string; numberKeys: string[]; grade: Level; sources: string[] }
export type CurveKey = 'glucose' | 'insulin' | 'bac' | 'caffeine' | 'tg' | 'kcal' | 'stomach';
export interface StoryCurve { step: 5; unit: string; y: number[]; thresholds: { y: number; label: string; source: string }[] }

export interface FoodStory {
  v: 1; id: string; slug: string; name: string; cls: StoryClass;
  body: { weightKg: number; sex: string; label: string; isDefault: boolean };
  numbers: Record<string, StoryNumber>;
  curves: Partial<Record<CurveKey, StoryCurve>>;
  events: StoryEvent[]; ladders: Ladder[]; surprises: Surprise[]; actions: StoryAction[];
  /** five axes, each with its own word and why; deliberately NO overall score or total (owner decision) */
  axes: Record<AxisKey, Axis>;
  cheat: { bestTime: StoryAction | null; pairWith: StoryAction | null; swapFor: StoryAction | null };
  unknowns: { text: string; grade: Level; sources: string[] }[];
  safety: { alcohol: boolean; caffeineHigh: boolean };
}
