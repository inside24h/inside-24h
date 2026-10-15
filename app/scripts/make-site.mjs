// dist-v4/index-v4.html → ../site/: a folder ready to upload to any static host (Netlify, Cloudflare Pages, Vercel).
// Run after `npx vite build --config vite.v4.config.ts`. og.png (link preview image) is made separately by
// scripts/make-og.ps1.
import fs from 'node:fs';

fs.mkdirSync('../site', { recursive: true });
fs.copyFileSync('dist-v4/index-v4.html', '../site/index.html');
// tell hosts to serve every path with the app (deep links like /#q=banana work anyway, this covers /anything)
fs.writeFileSync('../site/_redirects', '/*  /index.html  200\n');
console.log('site ready:', (fs.statSync('../site/index.html').size / 1e6).toFixed(2), 'MB');
