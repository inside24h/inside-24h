import { describe, expect, it } from 'vitest';
import { isInAppBrowser, videoSupport } from './share';

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
