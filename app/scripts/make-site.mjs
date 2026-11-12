// dist-v4/index-v4.html → ../site/: a folder ready to upload to any static host (Netlify, Cloudflare Pages, Vercel).
// Run after `npx vite build --config vite.v4.config.ts`. og.png (link preview image) is made separately by
// scripts/make-og.ps1.
import fs from 'node:fs';
import { absolutize, siteUrl, writeHostFiles } from './site-meta.mjs';

fs.mkdirSync('../site', { recursive: true });
// audit C8(a)/C10 (site-meta.mjs): absolute preview tags with SITE_URL; _headers with a CSP that fits THIS file (its
// inline app script is allowed by hash), so switching between the two builds never leaves a CSP for the other one
const SITE = siteUrl();
const html = absolutize(fs.readFileSync('dist-v4/index-v4.html', 'utf8'), SITE);
fs.writeFileSync('../site/index.html', html);
writeHostFiles('../site', html, SITE);
// tell hosts to serve every path with the app (deep links like /#q=banana work anyway, this covers /anything)
fs.writeFileSync('../site/_redirects', '/*  /index.html  200\n');
console.log('site ready:', (fs.statSync('../site/index.html').size / 1e6).toFixed(2), 'MB');
