// Turns dist-single/index.html into a page fragment for a claude.ai Artifact
// (the Artifact host supplies doctype, html, head, body and the viewport meta).
import fs from 'node:fs';

const src = fs.readFileSync('dist-single/index.html', 'utf8');
const head = src.match(/<head>([\s\S]*?)<\/head>/)[1].replace(/<meta[^>]*>\s*/g, '');
const body = src.match(/<body>([\s\S]*?)<\/body>/)[1];
fs.writeFileSync('dist-single/artifact.html', `${head.trim()}\n<style>html,body{background:#04070c}</style>\n${body.trim()}\n`);
console.log('wrote dist-single/artifact.html', (fs.statSync('dist-single/artifact.html').size / 1e6).toFixed(2), 'MB');
