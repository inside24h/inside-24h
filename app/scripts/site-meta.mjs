// Shared by make-site.mjs (single file) and make-site-split.mjs (hosted, code-split): what the host serves besides the
// app itself. Audit 2026-11-12:
// - C8(a) link previews: og:image / og:url / twitter:image must be ABSOLUTE for Facebook, LinkedIn and X. The address
//   is only known once the site has one, so it comes from SITE_URL at build time (e.g. the Netlify address):
//     PowerShell:  $env:SITE_URL='https://inside24h.netlify.app'; node scripts/make-site-split.mjs
//   Without SITE_URL the tags stay relative (WhatsApp/iMessage still work) and a warning is printed.
// - C10 security headers in `_headers` (Netlify and Cloudflare Pages both read it; a <meta> CSP could not set
//   frame-ancestors, so real headers are used). The CSP allows only this site plus the two hosts the optional
//   voiceover needs (voice-tts.ts): cdn.jsdelivr.net (kokoro-js and the ONNX Runtime files it loads) and the Hugging
//   Face hub (the voice model). The page's own inline bits (the deep-link preloader, the stylesheet's onload) are
//   allowed by their exact sha256 hashes, computed here from the final index.html, so nothing else inline can run.
import crypto from 'node:crypto';
import fs from 'node:fs';

const sha = (s) => `'sha256-${crypto.createHash('sha256').update(s, 'utf8').digest('base64')}'`;
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** The site's address from SITE_URL or VITE_SITE_URL ("https://example.org", no trailing slash), or '' when not set. */
export function siteUrl() {
  // the one setting for the site's address (VITE_SITE_URL is accepted as another name for it); no domain is assumed
  const u = (process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? '').trim().replace(/\/+$/, '');
  if (u && !/^https:\/\/[a-z0-9.-]+(?::\d+)?(?:\/[^\s"'<>]*)?$/i.test(u)) { console.error(`SITE_URL must look like https://example.org (got "${u}")`); process.exit(1); }
  return u;
}

/** og:image, og:url and twitter:image made absolute, plus a canonical link (only when SITE_URL is set). */
export function absolutize(html, site) {
  if (!site) { console.warn('note: SITE_URL not set - og:image/og:url stay relative (set it to the site address for Facebook/LinkedIn/X previews)'); return html; }
  return html
    .replace(/(<meta property="og:(?:image|url)" content=")\/([^"]*)"/g, (_m, a, p) => `${a}${site}/${p}"`)
    .replace(/(<meta name="twitter:image" content=")\/([^"]*)"/g, (_m, a, p) => `${a}${site}/${p}"`)
    .replace(/(<meta property="og:url"[^>]*>)/, (m) => `${m}\n    <link rel="canonical" href="${site}/" />`);
}

/** The Content-Security-Policy for this exact index.html. */
export function cspFor(html) {
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter((s) => s.trim());
  const handlers = [...html.matchAll(/\son[a-z]+="([^"]*)"/g)].map((m) => decode(m[1]));
  const scriptSrc = ["'self'", ...new Set(scripts.map(sha)), ...(handlers.length ? ["'unsafe-hashes'", ...new Set(handlers.map(sha))] : []),
    "'wasm-unsafe-eval'", 'https://cdn.jsdelivr.net'];
  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    // inline <style> (the loading shell) and style attributes; inline CSS cannot run code
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "media-src 'self' blob: data:",
    "connect-src 'self' data: blob: https://cdn.jsdelivr.net https://huggingface.co https://*.huggingface.co https://*.hf.co",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

const SECURITY = (html) => [
  `  Content-Security-Policy: ${cspFor(html)}`,
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  X-Frame-Options: DENY',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  '  Cross-Origin-Opener-Policy: same-origin',
];

/** Writes _headers (cache rules + security headers), robots.txt and, with SITE_URL, sitemap.xml into `out`. */
export function writeHostFiles(out, html, site) {
  fs.writeFileSync(`${out}/_headers`, [
    '/*',
    ...SECURITY(html),
    '',
    // Netlify + Cloudflare Pages: hashed files never change → cache for a year; the page itself always revalidates,
    // so a new deploy is picked up at once.
    '/assets/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/',
    '  Cache-Control: no-cache',
    '',
    '/index.html',
    '  Cache-Control: no-cache',
    '',
    '/og.png',
    '  Cache-Control: public, max-age=86400',
    '',
  ].join('\n'));
  fs.writeFileSync(`${out}/robots.txt`, ['User-agent: *', 'Allow: /', ...(site ? [`Sitemap: ${site}/sitemap.xml`] : []), ''].join('\n'));
  if (site) fs.writeFileSync(`${out}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site}/</loc></url>\n</urlset>\n`);
}
