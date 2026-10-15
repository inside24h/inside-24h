import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Build 0.4 as one self-contained HTML file: `npx vite build --config vite.v4.config.ts`
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  assetsInclude: ['**/*.glb'],
  build: { outDir: 'dist-v4', assetsInlineLimit: 5_000_000, rollupOptions: { input: 'index-v4.html' } },
});
