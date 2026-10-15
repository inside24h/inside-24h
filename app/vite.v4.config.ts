import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Moves the inlined bundle (CSS + JS, ~2-3 MB) from <head> to the end of <body>, so the browser paints the
// loading shell in index-v4.html as soon as the first few KB arrive instead of after the whole file.
// Safe for the JS: inline module scripts are deferred anyway. Must run after viteSingleFile has inlined.
function bundleLast(): Plugin {
  return {
    name: 'inside24h-bundle-last',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'asset' || !file.fileName.endsWith('.html')) continue;
        const styles: string[] = [], scripts: string[] = [];
        let html = String(file.source)
          .replace(/<style rel="stylesheet"[^>]*>[\s\S]*?<\/style>\s*/g, (m) => { styles.push(m.trim()); return ''; })
          .replace(/<script type="module"[^>]*>[\s\S]*?<\/script>\s*/g, (m) => { scripts.push(m.trim()); return ''; });
        // function replacement: the bundle contains `$&`-like sequences a string replacement would expand
        html = html.replace('</body>', () => `${[...styles, ...scripts].join('\n')}\n</body>`);
        file.source = html;
      }
    },
  };
}

// Build 0.4 as one self-contained HTML file: `npx vite build --config vite.v4.config.ts`
export default defineConfig({
  plugins: [react(), viteSingleFile(), bundleLast()],
  assetsInclude: ['**/*.glb'],
  build: { outDir: 'dist-v4', assetsInlineLimit: 5_000_000, rollupOptions: { input: 'index-v4.html' } },
});
