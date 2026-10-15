import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `vite build --mode single` emits one self-contained HTML (anatomy inlined) for sharing previews.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  assetsInclude: ['**/*.glb'],
  build: mode === 'single' ? { assetsInlineLimit: 5_000_000, outDir: 'dist-single' } : {},
}));
