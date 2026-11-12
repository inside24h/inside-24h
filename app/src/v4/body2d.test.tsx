// Audit C11 (2026-11-12): without WebGL the stage shows the 2D body with the same numbers, never a bare error.
import APP_SRC from './AppV4.tsx?raw';
import CANVAS_SRC from './perf/SafeCanvas.tsx?raw';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Body2D } from './Body2D';
import type { SegId, SegState } from '../scene/segments';

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const base = { color: '#2b1208', liquid: {}, present: [] as [SegId, SegState][], selected: null, onSelect: () => undefined };

describe('2D body (no WebGL)', () => {
  it('says what happened in friendly words; the technical detail only behind "Details"', () => {
    const html = renderToStaticMarkup(<Body2D {...base} reason="nogl" details="Error creating WebGL context." />);
    expect(text(html)).toContain('Your browser can’t show the 3D body, so here’s a simple 2D view. Everything else works the same.');
    expect(html).toMatch(/<details><summary>Details<\/summary><code>Error creating WebGL context\.<\/code><\/details>/);
    expect(text(renderToStaticMarkup(<Body2D {...base} reason="lost" action={<button>Reload</button>} />))).toMatch(/paused the 3D view.*Reload/);
    expect(text(renderToStaticMarkup(<Body2D {...base} reason="error" />))).toContain('The 3D body couldn’t load');
  });

  it('shows where the food is with the same labels and amounts as the 3D body, and fills the stomach', () => {
    const html = renderToStaticMarkup(<Body2D {...base} reason="nogl" unit="ml"
      liquid={{ stomach: { fill: 0.8 }, jejunum: { tint: 0.5 } }}
      present={[['stomach', { amount: 326.4, frac: 0.9, flow: 0.2 }], ['small', { amount: 4.25, frac: 0.1, flow: 0.5, unit: 'g' }]]} />);
    expect(text(html)).toContain('Stomach 326 ml');
    expect(text(html)).toContain('Small intestine 4.3 g');
    expect(html).toContain('clip-path="url(#b2clip-stomach)"'); // the level inside the stomach
    expect(html).toMatch(/aria-label="2D body\. Stomach: 326 ml\. Small intestine: 4\.3 g"/);
  });

  it('is what the stage shows on every no-3D path (no WebGL, lost context, a failed 3D part)', () => {
    expect(APP_SRC).toMatch(/<ErrorBoundary fallback=\{\(e\) => body2d\('error', e\)\}>/);
    expect(APP_SRC).toMatch(/sceneError \? body2d\('error', sceneError\)/);
    expect(APP_SRC).toMatch(/<SafeCanvas [^>]*noGl=\{\(r, action\) => body2d\(r, undefined, action\)\}/);
    expect(CANVAS_SRC).toMatch(/if \(!ok\) return noGl \?/);
    expect(CANVAS_SRC).toMatch(/\{lost && noGl && noGl\('lost'/);
  });
});
