// Phase 2A (2026-11-12): the 3-step video dialog (audit C6), the export ETA, and a regression test for "Compare on
// a phone": a headless check at 390 px could not reach the comparison video. Verdict: a test artifact (the header's
// "⇄ Compare" button is hidden on phones by design, and the menu's item starts with an aria-hidden "⇄ "), but the
// path a person takes is pinned here so it cannot break unnoticed: ⋯ menu → "Compare two foods" → pick the second →
// "Make this a Reel".
import APP_SRC from './AppV4.tsx?raw';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Compare } from './Compare';
import { parseMeal } from './food/parse';
import { DEFAULT_PROFILE } from '../science/profile';
import { afterText, PRESETS, presetOf, VideoSteps, type VideoPreview } from './VideoSteps';
import { etaSeconds, etaText } from './video-perf';

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

describe('Compare is reachable on a phone (390 / 360 px)', () => {
  it('the phone menu (⋯, shown at ≤ 720 px) has "Compare two foods"', () => {
    const app = APP_SRC;
    expect(app).toMatch(/<nav id="topmenu"[\s\S]*?setCompare\(\{\}\)[\s\S]*?Compare two foods[\s\S]*?<\/nav>/);
    // the ⋯ button that opens it (mobile.css shows it at ≤ 720 px; CSS is not loaded in unit tests, the headless check covers that)
    expect(app).toMatch(/className="menubtn" aria-label="Menu"[^>]*aria-controls="topmenu"/);
  });
  it('with two foods chosen, the comparison offers its video button', () => {
    const html = renderToStaticMarkup(<Compare current={parseMeal('1 can of cola')} initial={parseMeal('330 ml of water')} profile={DEFAULT_PROFILE}
      onClose={() => {}} onVideo={() => {}} voice={false} setVoice={() => {}} platform="shorts" setPlatform={() => {}} />);
    expect(text(html)).toContain('Make this a Reel (9:16)');
    expect(text(html)).toContain('YouTube Shorts');
  });
});

const PLATS = [{ id: 'tiktok', label: 'TikTok', length: '62–75 s' }, { id: 'reels', label: 'Instagram Reels', length: '45–55 s' },
  { id: 'shorts', label: 'YouTube Shorts', length: '23–30 s' }, { id: 'facebook', label: 'Facebook', length: '62–75 s' }];
const base = { setStep: () => {}, platforms: PLATS, platform: 'shorts', setPlatform: () => {}, voice: false, setVoice: () => {}, sound: 'music' as const, setSound: () => {},
  format: 'reel' as const, setFormat: () => {}, handle: '', setHandle: () => {}, hooks: ['How high does your sugar go?', 'One can: 9 teaspoons.'] as [string, string],
  hookVar: 'A' as const, setHookVar: () => {}, preview: null, onCover: () => {}, onMake: () => {}, onClose: () => {}, onCompare: () => {} };

describe('the 3-step video dialog', () => {
  it('step 1: where it goes (TikTok / Reels / Shorts), a style, the voiceover, more options folded, Next', () => {
    const t = text(renderToStaticMarkup(<VideoSteps {...base} step={1} />));
    for (const s of ['Step 1 of 3', 'TikTok', 'Instagram Reels', 'YouTube Shorts', 'Explained', 'Visual', 'Your sound', 'Compare', 'Voiceover', 'More options', 'Next: preview']) expect(t).toContain(s);
    // every earlier option is still there, inside "More options"
    for (const s of ['Name in the corner', 'Our music', 'Sound effects only', 'None (add your own)', '4:5 Feed post', 'Facebook', 'Save cover image (PNG)']) expect(t).toContain(s);
    expect(renderToStaticMarkup(<VideoSteps {...base} step={1} />)).toMatch(/<details class="vsmore">/); // folded by default
  });
  it('step 2: the outline (length, opening, key moments, end) and the opening frame, with "Try another opening"', () => {
    const pv: VideoPreview = { img: 'data:image/jpeg;base64,AAAA', seconds: 27.6, moments: [{ at: '0 min', title: 'First sip' }, { at: '20 min', title: 'Blood sugar peak' }] };
    const html = renderToStaticMarkup(<VideoSteps {...base} step={2} preview={pv} hookVar="B" />), t = text(html);
    for (const s of ['Step 2 of 3', 'About 28 s', 'YouTube Shorts', 'One can: 9 teaspoons.', '20 min', 'Blood sugar peak', 'Try another opening', 'Back', 'Make the video']) expect(t).toContain(s);
    expect(html).toContain('alt="The video&#x27;s opening frame"');
  });
  it('the presets are names for the existing options', () => {
    expect(PRESETS.map((p) => p.id)).toEqual(['explained', 'visual', 'yoursound']);
    expect(presetOf(true, 'music')).toBe('explained');
    expect(presetOf(false, 'music')).toBe('visual');
    expect(presetOf(false, 'sfx')).toBe('yoursound');
    expect(presetOf(true, 'sfx')).toBeNull(); // a custom mix from "More options"
  });
  it('times after the food read naturally', () => {
    expect([0, 20, 60, 75, 480].map(afterText)).toEqual(['0 min', '20 min', '1 h', '1 h 15 min', '8 h']);
  });
  it('the dialog is no longer one long page (audit C6: 1338 px at 390 px); the creator tip moved under More options', () => {
    const app = APP_SRC;
    expect(app).toContain('<VideoSteps');
    expect(app).not.toMatch(/<p className="note">Testing hooks:/);
  });
});

describe('render ETA', () => {
  it('waits for enough frames, then extrapolates', () => {
    expect(etaSeconds(5, 900, 1000)).toBeNull();
    expect(etaSeconds(300, 900, 10_000)).toBe(20);
    expect(etaSeconds(900, 900, 30_000)).toBeNull();
  });
  it('says it plainly', () => {
    expect(etaText(null)).toBe('');
    expect(etaText(3)).toBe('about 5 s left');
    expect(etaText(42)).toBe('about 40 s left');
    expect(etaText(200)).toBe('about 3 min left');
  });
});
