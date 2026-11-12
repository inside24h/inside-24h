// The first whole sentences of a text that fit in `max` characters (the video's caption, the calm bar's line, the
// share card). Its own tiny module (audit C3, 2026-11-12) so the first screen can use it without the video engine;
// share.ts re-exports it, so every old import keeps working.
export function captionOf(text: string, max = 130): string {
  const parts = text.split(/(?<=[.!?])\s+/); // sentence ends need a space after them, so 2.4 stays one number
  let out = '';
  for (const p of parts) { if ((out + ' ' + p).length > max && out) break; out = out ? `${out} ${p}` : p; }
  return out.trim();
}
