// "Share this moment": one 4:5 picture (1080×1350) of the minute on screen — the food, how long after eating,
// the number of this moment exactly as the app shows it (ranges stay ranges), a snapshot of the 3D body and the
// link that opens this very moment. Sent with the system share sheet where the browser can share files.
import { bg, fit, roundRect, wrap } from './share';

export interface MomentCard {
  name: string;          // "Cola"
  amount?: string;       // "2 × 1 can (330 ml)"
  stamp: string;         // "45 MIN LATER"
  clock: string;         // "13:45"
  step: string;          // chapter title
  caption: string;       // chapter in plain words
  pop?: { big: string; small: string; level: 0 | 1 | 2 }; // key number (same text as the video's)
  where?: string;        // "Stomach · 210 ml"
  color?: string;        // the food's colour
  link: string;          // full deep link
}

export const CARD_W = 1080, CARD_H = 1350;
const LIGHT = ['#3ddc84', '#ffc83d', '#ff5a5a'];
const SANS = 'system-ui, "Segoe UI", Roboto, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = 'ui-monospace, Consolas, monospace';

/** The link as people read it on a picture: no protocol, no "www.". */
export const linkLabel = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '');

export function drawMomentCard(src: HTMLCanvasElement | null, c: MomentCard): HTMLCanvasElement {
  const W = CARD_W, H = CARD_H;
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  const ctx = out.getContext('2d')!;
  bg(ctx, W, H);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';

  // header: brand, food, amount
  ctx.fillStyle = '#5cd3ff'; ctx.font = `700 30px ${SANS}`; ctx.fillText('INSIDE 24H', 60, 86);
  if (c.color) {
    ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(W - 84, 76, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.stroke();
  }
  ctx.fillStyle = '#ffffff'; ctx.font = `400 84px ${SERIF}`; ctx.fillText(fit(ctx, c.name, W - 120), 60, 186);
  if (c.amount) { ctx.fillStyle = '#8292a7'; ctx.font = `500 30px ${SANS}`; ctx.fillText(fit(ctx, c.amount, W - 120), 60, 236); }

  // "45 MIN LATER" + clock
  ctx.font = `800 52px ${SANS}`;
  const sw = ctx.measureText(c.stamp).width + 60;
  ctx.fillStyle = 'rgba(92,211,255,.95)'; roundRect(ctx, 60, 272, sw, 76, 22); ctx.fill();
  ctx.fillStyle = '#04070c'; ctx.fillText(c.stamp, 90, 329);
  ctx.fillStyle = '#b9c5d3'; ctx.font = `500 34px ${SANS}`; ctx.fillText(`at ${c.clock}`, 60 + sw + 24, 323);

  // the body, cover-cropped into a rounded panel on the right
  const bx = 580, by = 390, bw = 440, bh = 540;
  ctx.save(); roundRect(ctx, bx, by, bw, bh, 28); ctx.clip();
  ctx.fillStyle = '#060c14'; ctx.fillRect(bx, by, bw, bh);
  if (src && src.width && src.height) {
    const s = Math.max(bw / src.width, bh / src.height), cw = bw / s, ch = bh / s;
    try { ctx.drawImage(src, (src.width - cw) / 2, (src.height - ch) / 2, cw, ch, bx, by, bw, bh); } catch { /* unreadable canvas: keep the panel */ }
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(140,170,210,.3)'; ctx.lineWidth = 2; roundRect(ctx, bx, by, bw, bh, 28); ctx.stroke();

  // the number of this moment (text exactly as the app shows it)
  let y = 470;
  if (c.pop) {
    let fs = 120; ctx.font = `800 ${fs}px ${SANS}`;
    while (fs > 48 && ctx.measureText(c.pop.big).width > 480) { fs -= 4; ctx.font = `800 ${fs}px ${SANS}`; }
    ctx.fillStyle = LIGHT[c.pop.level]; ctx.fillText(c.pop.big, 60, y + 40);
    ctx.fillStyle = '#e6edf5'; ctx.font = `600 34px ${SANS}`;
    wrap(ctx, c.pop.small, 480, 2).forEach((ln, i) => ctx.fillText(ln, 60, y + 100 + i * 42));
    y += 200;
  }
  if (c.where) {
    ctx.fillStyle = '#8292a7'; ctx.font = `600 24px ${SANS}`; ctx.fillText('WHERE IT IS NOW', 60, y);
    ctx.font = `700 36px ${SANS}`;
    const lines = wrap(ctx, c.where, 440, 2);
    ctx.fillStyle = c.color ?? '#ffffff'; ctx.beginPath(); ctx.arc(76, y + 38, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffffff'; lines.forEach((ln, i) => ctx.fillText(ln, 104, y + 50 + i * 46));
  }

  // what is happening, in plain words
  ctx.fillStyle = '#5cd3ff'; ctx.font = `700 28px ${SANS}`; ctx.fillText(fit(ctx, c.step.toUpperCase(), W - 120), 60, 1000);
  ctx.fillStyle = '#ffffff'; ctx.font = `600 38px ${SANS}`;
  wrap(ctx, c.caption, W - 120, 3).forEach((ln, i) => ctx.fillText(ln, 60, 1054 + i * 50));

  // the link that opens this exact moment + honest small print
  ctx.fillStyle = 'rgba(140,170,210,.25)'; ctx.fillRect(60, 1212, W - 120, 2);
  ctx.fillStyle = '#5cd3ff'; ctx.font = `600 26px ${MONO}`; ctx.fillText(fit(ctx, `▶ ${linkLabel(c.link)}`, W - 300), 60, 1262);
  ctx.textAlign = 'right'; ctx.fillStyle = '#ffffff'; ctx.font = `700 30px ${SANS}`; ctx.fillText('inside24h', W - 60, 1262);
  ctx.textAlign = 'left'; ctx.fillStyle = '#56657a'; ctx.font = `20px ${SANS}`;
  ctx.fillText(fit(ctx, `Simulation for a typical body${c.pop && /–/.test(c.pop.big) ? ' · ranges show how much people differ' : ''} · not medical advice · anatomy BodyParts3D CC BY 4.0`, W - 120), 60, 1306);
  return out;
}
