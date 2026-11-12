// Test helper (not part of the app): the speech engine mocked for the narration / caption / retention sweeps.
// Each clip lasts its spoken word count at 2.4-3.0 words/s plus the engine's lead-in/out silence (0.12 s).
// The speed is a hash of the line's own text (audit C14, 2026-11-12), not a draw from one shared random stream: with
// the stream, a clip's length depended on how many clips came before it (test order, a filtered run, any new line in
// any other video), so a silence check sitting near its limit could pass or fail from run to run. Now the same line
// always gets the same length, whatever runs before or around it.
import { wordsOf } from './video-narration';

/** FNV-1a, 32 bit: a stable number in [0, 1) for a string. */
export function unitHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h / 4294967296;
}

/** Words per second for a line: 2.4-3.0, fixed per text. */
export const mockSpeed = (say: string) => 2.4 + 0.6 * unitHash(say);

/** How long the mocked engine takes to say a line, in seconds. */
export const mockDur = (say: string) => wordsOf(say) / mockSpeed(say) + 0.12;
