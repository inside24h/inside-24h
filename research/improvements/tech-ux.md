# Inside 24h - tech/UX improvement research (2026-10-15)

Caveat: the web search tool returned mostly secondary sources (community skills, vendor comparisons). Items marked (verify) are standard practice from memory and should be checked against official docs before implementing.

## 1. Codebase findings (read-only)
- Build: app/vite.v4.config.ts uses viteSingleFile + assetsInlineLimit 5 MB -> app/dist-v4/index-v4.html = 3,352,992 B. site/index.html is a copy (app/scripts/make-site.mjs). site/_redirects = `/* /index.html 200`.
- Size drivers: app/src/assets/anatomy.glb 1.33 MB (imported with `?inline` => base64, +33% => ~1.77 MB inside the HTML), organ-points.json 147 KB, three.js + drei + r3f + react (remainder), mp4-muxer, science models. No code splitting at all (singlefile forces one chunk).
- 3D load: app/src/scene/Body.tsx - `anatomyData from '../assets/anatomy.glb?inline'`, decoded manually and `new GLTFLoader().parse(...)`. No Draco/meshopt/KTX2. The model can only be parsed after the whole HTML is downloaded.
- Canvas: app/src/v4/AppV4.tsx:499 `<Canvas dpr={[1,2]} gl={{antialias:true, alpha:true, preserveDrawingBuffer:true}} frameloop='always'>`. No PerformanceMonitor / AdaptiveDpr, no low-end tier, no webglcontextlost handling seen.
- Mobile: viewport meta incl. viewport-fit=cover OK; `.stage canvas {touch-action: pan-y}` (app/src/v4/v4.css:67) so vertical drag scrolls the page; hint text "Drag to turn - scroll to zoom - tap an organ" (AppV4.tsx:535) mentions scroll-zoom that does not exist on phones. prefers-reduced-motion handled only for .drawer/.wbar/.seg (v4.css:429), not for the 3D flow.
- SEO/meta (app/index-v4.html): title, description, og:title/description, twitter:card present. Missing: absolute og:image URL (it is `/og.png`), og:url, canonical, twitter:image, og:image size/alt, JSON-LD, robots.txt, sitemap. Root is an empty `<div id="root">`. Deep links are hash-only (`#q=...`, AppV4.tsx:295) so the fragment never reaches a server: every shared link gets the same generic preview and Google sees one page.
- Fonts: render-blocking Google Fonts stylesheet (index-v4.html:15-16), third party, fails offline/in blocked regions, GDPR-sensitive (verify).
- A11y: ~100 aria-* uses in src/v4, aria-labels on buttons, role=dialog on organ panel, keyboard in Search.tsx. Gaps: canvas has only aria-label "3D body" (no text alternative beyond the status panel), focus management for dialog/drawer unverified, reduced-motion gap, fixed lang="en".
- PWA/offline: none (no manifest, no service worker, only inline SVG favicon).
- Analytics: none (no gtag/plausible/umami). i18n: none; English strings hardcoded in .tsx and src/v4/food data. localStorage use is try/catch-guarded (good for webviews).
- Video export: WebCodecs VideoEncoder + mp4-muxer; app/src/v4/share.ts:72 canEncode() check exists. Unsupported in many webviews/older iOS, so the fallback UX matters.

## 2. Best-practice research and sources
- R3F adaptive perf: Canvas `performance` prop, drei PerformanceMonitor/AdaptiveDpr, cap DPR, disable antialias on low tier, mobile draw-call budget under ~100 (secondary sources).
  - https://tessl.io/registry/tessl/npm-react-three--drei/files/docs/performance.md
  - https://www.hontran.dev/blog/three-js-performance-optimization
  - https://playbooks.com/skills/bbeierle12/skill-mcp-claude/r3f-performance
  - Official (verify): https://r3f.docs.pmnd.rs/advanced/scaling-performance , https://drei.docs.pmnd.rs/performances/performance-monitor
- Meshopt/Draco/KTX2: glTF-Transform `optimize` with meshopt compression and texture compression commonly shrinks GLBs 60-90% (verify). https://gltf-transform.dev/
- In-app browsers: older/lagging WebView engines, loading slower on weak connections; reduce assets, load async/in parallel; offer open-in-browser.
  - https://frontendmasters.com/blog/wp-json/wp/v2/posts/3008
  - https://developer.amazon.com/docs/vega/0.23/webview-webgl-best-practices.html
  - https://link.boo/guides/tiktok-in-app-browser
  - https://u2l.ai/blog/instagram-in-app-browser.md
  - Webviews may drop storage and lack WebCodecs, keep fallbacks.
- Hosting split: drop viteSingleFile for the hosted build; HTML shell paints at once, hashed JS/GLB fetched in parallel with immutable caching and brotli on Cloudflare Pages/Netlify. https://developers.cloudflare.com/pages/ , https://docs.netlify.com/ (verify)
- SPA SEO: prerender each public route at build time (vite-react-ssg / vite-ssg / React Router pre-rendering with route list per food); path routes `/food/banana` with own title/description/og:image/JSON-LD + sitemap.xml.
  - https://reactrouter.com/7.9.6/how-to/pre-rendering.md
  - https://cdn.jsdelivr.net/npm/@softspark/ai-toolkit@4.20.0/app/skills/seo-validate/reference/spa-ssg-patterns.md
- Analytics: Cloudflare Web Analytics (free, cookieless, Web Vitals), Plausible (hosted ~9 USD/mo, cookieless), Umami (open source, self-host). Add custom events (food_selected, play, video_export, compare) and referrer/UTM per platform.
  - https://scripts.nuxt.com/learn/privacy-first-analytics-compared
  - https://ingest.plausible.io/vs-cloudflare-web-analytics
  - https://www.wmtips.com/technologies/compare/plausible-vs-umami/
- PWA: manifest + 192/512/maskable icons + small service worker via vite-plugin-pwa; apple-touch-icon for iOS. https://vite-pwa-org.netlify.app/ (verify). Low value for one-visit TikTok traffic, useful for caching/return visits.
- Canvas a11y: text equivalent/live region for current hour, keyboard-operable scrubber, reduced-motion, contrast, role=img + description. https://www.w3.org/WAI/WCAG22/Understanding/ (verify)
- i18n: lightweight dictionary, `lang` attr + hreflang on prerendered per-language pages; start with Croatian plus one large language (verify).

## 3. Bugs / risks
1. og:image relative -> X/Facebook/WhatsApp scrapers may fail; no og:url/canonical.
2. All shared links preview identically (hash state) - big loss for viral per-food sharing.
3. 3.35 MB HTML must fully download before anything paints; blank dark page on slow mobile = bounce. Needs a pre-JS loading shell.
4. preserveDrawingBuffer:true + DPR 2 + antialias + always-on frameloop -> heavy on low-end Android, heat/battery. Enable buffer preservation only during capture.
5. Render-blocking third-party Google Fonts; self-host woff2 subsets.
6. `/* -> /index.html 200` creates soft 404s; no robots.txt/sitemap.
7. No webglcontextlost handler seen (mobile tab backgrounding).
8. Hint copy mentions scroll-zoom on phones; pan-y means rotate gesture is less discoverable (pinch zoom?).
9. Health content: visible disclaimer and sources (claim IDs like 'SI10' exist in code) help trust and ad/store policy.
10. No telemetry -> blind to WebGL/WebCodecs failures.

## 4. Ranked improvements
See the summary returned to the caller (ranked list of 15).
