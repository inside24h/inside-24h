import { describe, expect, it } from 'vitest';
import { drawCmpFrame, drawFrame, isInAppBrowser, logText, SAFE, SIZE, videoSupport, type CmpOverlay, type Format, type Light, type Overlay, type TextBox } from './share';

const IG = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.0';
const TT = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36 musical_ly_2023 BytedanceWebview/d8a21c6';
const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';

describe('video export support', () => {
  it('spots Instagram and TikTok in-app browsers, not Chrome', () => {
    expect(isInAppBrowser(IG)).toBe(true);
    expect(isInAppBrowser(TT)).toBe(true);
    expect(isInAppBrowser(CHROME)).toBe(false);
  });
  it('WebCodecs → frame by frame; no WebCodecs in an in-app browser → none (show the fallback)', () => {
    expect(videoSupport({ encode: true, mime: true, ua: IG })).toBe('frames');
    expect(videoSupport({ encode: false, mime: true, ua: IG })).toBe('none');
    expect(videoSupport({ encode: false, mime: false, ua: CHROME })).toBe('none');
    expect(videoSupport({ encode: false, mime: true, ua: CHROME })).toBe('screen');
  });
});

// ---- safe zones: every word of every video frame stays clear of the platforms' buttons and captions ----
// A fake 2D context: text width = characters × font size × `w` (0.56 ≈ Geist bold, wide; 0.42 ≈ the serif, narrow),
// so the layout is checked for both wide and narrow real fonts.
function fakeCtx(w: number): CanvasRenderingContext2D {
  const st: Record<string, unknown> = { font: '10px sans-serif', textAlign: 'left', textBaseline: 'alphabetic', globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1, shadowColor: '', shadowBlur: 0, shadowOffsetY: 0, globalCompositeOperation: 'source-over' };
  const stack: Record<string, unknown>[] = [];
  const px = () => Number(/(\d+(?:\.\d+)?)px/.exec(String(st.font))?.[1] ?? 10);
  const fns: Record<string, unknown> = {
    measureText: (s: string) => ({ width: [...s].length * px() * w }),
    save: () => { stack.push({ ...st }); }, restore: () => { Object.assign(st, stack.pop()); },
    createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }),
  };
  return new Proxy(st, {
    get: (t, k: string) => (k in fns ? fns[k] : k in t ? t[k] : () => {}),
    set: (t, k: string, v) => { t[k] = v; return true; },
  }) as unknown as CanvasRenderingContext2D;
}
const SRC = { width: 2560, height: 1114 } as unknown as HTMLCanvasElement;
const lights = (lv: 0 | 1 | 2): Light[] => [{ icon: '⚡', label: 'Blood sugar', level: lv }, { icon: '❤', label: 'Heart', level: 0 }, { icon: '💧', label: 'Water', level: 1 }, { icon: '🧠', label: 'Brain', level: 2 }];
const OVERLAYS: Overlay[] = [
  { hook: 'One can of cola: what happens inside your body in 24 hours?', title: 'Cola', sub: 'Man, 35 · 175 cm · 70 kg · Zagreb', clock: '23:35', step: 'Blood sugar peak',
    caption: 'Your blood sugar climbs from 5.0 mmol/L to about 7.3 mmol/L (a typical response,', where: 'Stomach · 214 ml', color: '#3a1d0e', progress: 0.4, lights: lights(1),
    summary: lights(1).map((l) => ({ ...l, label: `${l.label} & energy`, note: 'Mild stress at 23:28' })), handle: '@inside24h', stamp: '20 MIN LATER',
    pop: { big: '+1.3–3.0', small: 'mmol/L blood sugar rise right now (typical)', level: 1 } },
  { hook: 'Pizza Capricciosa (whole · 1104 g) + Hamburger + French fries + Cola over 3 h: what happens inside your body in 24 hours?', title: 'Pizza Capricciosa + Hamburger + French fries + Cola',
    sub: 'Woman, 104 · 199 cm · 150 kg · San Francisco de Campeche', clock: '12:05', step: 'What you can’t digest reaches the start of your large intestine',
    caption: 'What you can’t digest, 22.7 g of fiber, reaches the start of your large intestine, and stays there a while longer.', where: 'Large intestine · 22.7 g fiber and some more words here', color: '#e8b04a', progress: 1,
    lights: lights(2), summary: lights(2).map((l) => ({ ...l, label: `${l.label} & everything else`, note: 'High stress at 12:05, then mild until the next morning' })), handle: '@a_really_long_handle_name_2026', stamp: '1½ HOURS LATER',
    pop: { big: '0.46–1.16', small: '‰ blood alcohol and some more words that go on and on', level: 2 } },
];
// realistic worst cases (a 3-item meal with pacing, the longest caption page the planner makes): nothing may be cut off
const REAL: Overlay[] = [OVERLAYS[0], { ...OVERLAYS[0], hook: 'Hamburger + French fries + Cola over 2 h: what happens inside your body in 24 hours?', title: 'Hamburger + French fries + Cola',
  step: 'Into the large intestine', where: 'Large intestine · 6.4 g fiber', stamp: '24 HOURS LATER',
  caption: 'About 32 mg of caffeine reaches your brain and blocks the tiredness signal a little, for hours.' }];
const CMP: CmpOverlay = { hook: 'Pizza Capricciosa (whole) or Hamburger + French fries: which is better for your body?', clock: '01:05', progress: 0.6, handle: '@inside24h', stamp: '1½ HOURS LATER', verdict: '🏆 Water wins: no blood sugar peak, 139 fewer kcal and a much longer reason here.',
  a: { name: 'Pizza Capricciosa (whole)', color: '#e8b04a', step: 'The sugar dip', caption: 'Your blood sugar drops just below where you started. Many people feel hungry again around now, maybe.', sugar: 'Blood sugar −0.8 mmol/L', sugarLevel: 1, lights: lights(1),
    summary: { kcal: 2400, sugarPeak: '+2.3 mmol/L', worst: lights(1).map((l) => ({ ...l, note: 'mild stress at 23:48' })) } },
  b: { name: 'Hamburger + French fries', color: '#ffffff', step: 'Kidneys', caption: 'Your kidneys start filtering out the extra water.', sugar: 'Blood sugar steady', sugarLevel: 0, lights: lights(0),
    summary: { kcal: 0, sugarPeak: 'steady', worst: lights(0).map((l) => ({ ...l, note: 'fine all day' })) } } };

function checkBoxes(boxes: TextBox[], format: Format, label: string) {
  const S = SAFE[format], [W, H] = SIZE[format];
  expect(boxes.length).toBeGreaterThan(3);
  for (const b of boxes) {
    const where = `${label}: "${b.text}" [${Math.round(b.x0)},${Math.round(b.y0)}–${Math.round(b.x1)},${Math.round(b.y1)}]`;
    expect(b.x0, where).toBeGreaterThanOrEqual(0); expect(b.x1, where).toBeLessThanOrEqual(W); expect(b.y0, where).toBeGreaterThanOrEqual(0); expect(b.y1, where).toBeLessThanOrEqual(H);
    if (b.deco) continue; // small print and the day bar may sit under the platform UI
    expect(b.x0, where).toBeGreaterThanOrEqual(S.left - 0.5);
    expect(b.x1, where).toBeLessThanOrEqual(S.right + 0.5);
    expect(b.y0, where).toBeGreaterThanOrEqual(S.top - 0.5);
    expect(b.y1, where).toBeLessThanOrEqual(S.bottom + 0.5);
    if (b.y1 > S.lowFrom) expect(b.x1, `${where} (button column)`).toBeLessThanOrEqual(S.rightLow + 0.5);
  }
}

describe('video safe zones', () => {
  it('the safe zone matches the platforms (9:16): top bar, bottom caption area, right button column', () => {
    expect(SAFE.reel.top).toBeGreaterThanOrEqual(250);            // TikTok / Reels / Shorts top bar
    expect(1920 - SAFE.reel.bottom).toBeGreaterThanOrEqual(560);  // name, caption, sound, progress
    expect(1080 - SAFE.reel.rightLow).toBeGreaterThanOrEqual(180); // like / comment / share column
    expect(SAFE.reel.left).toBeGreaterThanOrEqual(60);
  });
  for (const w of [0.56, 0.42]) for (const format of ['reel', 'feed'] as Format[]) for (const [i, o] of OVERLAYS.entries()) {
    for (const phase of ['intro', 'main', 'outro'] as const) {
      it(`${format} · overlay ${i + 1} · ${phase} · font width ${w}: every word inside the safe zone`, () => {
        const [W, H] = SIZE[format];
        const fr = { phase, m: 0, t: 0, cap: o.caption, capA: 1, k: phase === 'outro' ? 0.5 : 0 };
        const boxes = logText(() => drawFrame(fakeCtx(w), W, H, SRC, o, format, fr, { stopsU: [0, 0.3, 0.6, 1], introS: 3, outroS: 6.5 }, null));
        checkBoxes(boxes, format, `${format}/${phase}/${i + 1}`);
      });
    }
  }
  for (const w of [0.56, 0.42]) for (const phase of ['intro', 'main', 'outro'] as const) {
    it(`comparison · ${phase} · font width ${w}: every word inside the safe zone`, () => {
      const fr = { phase, m: 0, t: 0, cap: CMP.a.caption, capB: CMP.b.caption, capA: 1, k: phase === 'outro' ? 0.5 : 0 };
      const boxes = logText(() => drawCmpFrame(fakeCtx(w), 1080, 1920, SRC, CMP, fr, { stopsU: [0, 0.5, 1], introS: 3, outroS: 6.5 }, null));
      checkBoxes(boxes, 'reel', `cmp/${phase}`);
    });
  }
  for (const w of [0.56, 0.42]) for (const format of ['reel', 'feed'] as Format[]) for (const [i, o] of REAL.entries()) for (const phase of ['intro', 'main', 'outro'] as const) {
    it(`${format} · real case ${i + 1} · ${phase} · font width ${w}: no word is cut off (no “…”)`, () => {
      const [W, H] = SIZE[format];
      const boxes = logText(() => drawFrame(fakeCtx(w), W, H, SRC, o, format, { phase, m: 0, t: 0, cap: o.caption, capA: 1, k: phase === 'outro' ? 0.5 : 0 }, null, null));
      checkBoxes(boxes, format, `real/${format}/${phase}`);
      for (const b of boxes) if (!b.deco) expect(b.text, `${format}/${phase}`).not.toMatch(/…$/);
    });
  }
  it('captions are big enough to read on a phone at arm’s length', () => {
    const boxes = logText(() => drawFrame(fakeCtx(0.5), 1080, 1920, SRC, OVERLAYS[0], 'reel', { phase: 'main', m: 20, t: 10, cap: OVERLAYS[0].caption, capA: 1, k: 0 }, null, null));
    const cap = boxes.filter((b) => !b.deco && b.text.length > 15 && OVERLAYS[0].caption.includes(b.text));
    expect(cap.length).toBeGreaterThan(0);
    for (const b of cap) expect(b.y1 - b.y0, b.text).toBeGreaterThanOrEqual(42); // ≥ 42 px text on a 1920 px tall frame
    const words = boxes.filter((b) => !b.deco);
    for (const b of words) expect(b.y1 - b.y0, b.text).toBeGreaterThanOrEqual(20); // nothing below 20 px except small print
  });
});
