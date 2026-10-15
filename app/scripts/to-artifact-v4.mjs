// dist-v4/index-v4.html → dist-v4/artifact.html: a page fragment for a claude.ai Artifact
// (the host supplies doctype, html, head, body and the viewport meta).
import fs from 'node:fs';

const src = fs.readFileSync('dist-v4/index-v4.html', 'utf8');
const head = src.match(/<head>([\s\S]*?)<\/head>/)[1].replace(/<meta[^>]*>\s*/g, '');
const body = src.match(/<body>([\s\S]*?)<\/body>/)[1];
fs.writeFileSync('dist-v4/artifact.html', `${head.trim()}\n<style>html,body{background:#04070c}</style>\n${body.trim()}\n`);
console.log('wrote dist-v4/artifact.html', (fs.statSync('dist-v4/artifact.html').size / 1e6).toFixed(2), 'MB');
