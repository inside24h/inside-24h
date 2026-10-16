import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { OutputBundle, OutputChunk } from 'rollup';

// HOSTED build for site/ (Netlify / Cloudflare Pages): `npx vite build --config vite.site.config.ts`, then
// `node scripts/make-site-split.mjs`. Unlike vite.v4.config.ts (one self-contained HTML for offline/artifact
// sharing, unchanged) this keeps files separate and hashed, so the first download is only the shell + the UI:
// - three.js / react-three-fiber / drei / the scene are one lazy chunk (src/v4/lazy3d.ts → scene3d.tsx), started
//   right after the first paint (src/v4/main.tsx), or at once for a deep link (#q=… / #m=…);
// - the anatomy model is a separate .glb fetched in parallel with that chunk (src/scene/anatomySource.ts);
// - mp4-muxer (video export) is its own chunk, loaded only when a video is made;
// - fonts are separate woff2 files (font-display: swap); preloading the main one (Geist latin) is opt-in, see below;
// - the stylesheet does not block the shell's first paint; on-demand UI (Compare, Browse...) is in small chunks.

const DEEP_LINK = String.raw`/(?:^#|&)(?:q|m|p|t|compare)=/`; // keep in sync with src/v4/main.tsx

function collectImports(bundle: OutputBundle, name: string, seen = new Set<string>()): Set<string> {
  const c = bundle[name] as OutputChunk | undefined;
  if (!c || c.type !== 'chunk' || seen.has(name)) return seen;
  seen.add(name);
  for (const dep of c.imports) collectImports(bundle, dep, seen);
  return seen;
}

function siteHints(): Plugin {
  let base = '/';
  return {
    name: 'inside24h-site-hints',
    enforce: 'post',
    configResolved(c) { base = c.base; },
    generateBundle(_o, bundle) {
      const files = Object.values(bundle);
      const entry = files.find((f): f is OutputChunk => f.type === 'chunk' && f.isEntry);
      const scene = files.find((f): f is OutputChunk => f.type === 'chunk' && !!f.facadeModuleId?.replace(/\\/g, '/').endsWith('/src/v4/scene3d.tsx'));
      const glb = files.find((f) => f.type === 'asset' && f.fileName.endsWith('.glb'));
      const font = files.find((f) => f.type === 'asset' && /\/geist-latin-wght-normal-[^/]*\.woff2$/.test('/' + f.fileName));
      if (!entry || !scene || !glb) this.error(`site hints: missing ${!entry ? 'entry' : !scene ? 'scene3d chunk' : '.glb asset'}`);
      // chunks the 3D part needs that the entry does not already load
      const have = collectImports(bundle, entry!.fileName);
      const sceneJs = [...collectImports(bundle, scene!.fileName)].filter((f) => !have.has(f)).map((f) => base + f);
      const deepLink = `<script>/* a link that opens a food needs the 3D at once: fetch it alongside the UI */(function(){try{if(!${DEEP_LINK}.test(location.hash))return;var h=document.head;${JSON.stringify(sceneJs)}.forEach(function(u){var l=document.createElement('link');l.rel='modulepreload';l.href=u;h.appendChild(l)});var g=document.createElement('link');g.rel='preload';g.as='fetch';g.crossOrigin='anonymous';g.href=${JSON.stringify(base + glb!.fileName)};h.appendChild(g)}catch(e){}})()</script>`;
      // Font preload is opt-in (SITE_FONT_PRELOAD=1): measured on Slow 4G it delayed the shell's first paint by ~180 ms
      // (Chrome briefly holds rendering for preloaded fonts) and the UI by ~180 ms (bandwidth taken from the main JS).
      // Fonts use font-display: swap, so without it the text simply appears in the fallback font first.
      const fontHint = font && process.env.SITE_FONT_PRELOAD ?`<link rel="preload" href="${base + font.fileName}" as="font" type="font/woff2" crossorigin>` : '';
      for (const file of files) {
        if (file.type !== 'asset' || !file.fileName.endsWith('.html')) continue;
        let html = String(file.source);
        // The shell paints from inline CSS; the app stylesheet loads without blocking that first paint (media=print,
        // switched on when loaded) and src/v4/main.tsx waits for it (data-i24-css) before the first render, so the UI
        // never shows unstyled. <noscript> keeps a plain link for completeness.
        const css: string[] = [];
        html = html.replace(/\s*<link rel="stylesheet"([^>]*)>/g, (_m, attrs: string) => {
          css.push(`<link rel="stylesheet"${attrs} media="print" data-i24-css onload="this.media='all'">`, `<noscript><link rel="stylesheet"${attrs}></noscript>`);
          return '';
        });
        // media=print alone would make it a lowest-priority download: preload keeps it at the front of the queue
        const cssPreload = css.filter((l) => l.includes('data-i24-css')).map((l) => `<link rel="preload" as="style" crossorigin href="${/href="([^"]+)"/.exec(l)![1]}">`).join('');
        html = html.replace('</head>', () => `    ${cssPreload}${fontHint}\n    ${deepLink}\n  </head>`);
        html = html.replace('</body>', () => `${css.join('\n')}\n</body>`);
        file.source = html;
      }
    },
  };
}

// `SITE_REPORT=1 npx vite build --config vite.site.config.ts`: the biggest modules in each chunk (minified bytes).
function sizeReport(): Plugin {
  return {
    name: 'inside24h-size-report',
    generateBundle(_o, bundle) {
      if (!process.env.SITE_REPORT) return;
      for (const c of Object.values(bundle)) {
        if (c.type !== 'chunk') continue;
        const mods = Object.entries(c.modules).map(([id, m]) => [id.replace(/\\/g, '/').replace(/^.*?(node_modules|src)\//, '$1/'), m.renderedLength] as const).sort((a, b) => b[1] - a[1]);
        console.log(`\n${c.fileName}`);
        for (const [id, n] of mods.slice(0, 25)) console.log(`  ${(n / 1024).toFixed(1).padStart(7)} kB  ${id}`);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), siteHints(), sizeReport()],
  assetsInclude: ['**/*.glb'],
  build: {
    outDir: 'dist-site',
    emptyOutDir: true,
    assetsInlineLimit: 4096, // the .glb and fonts stay separate files
    modulePreload: { polyfill: true },
    rollupOptions: { input: 'index-v4.html' },
  },
});
