// Natural English for "this much of this food" (prelaunch QA 2026-10-23): the first caption of the story and the
// video, the video's hook ("A whole pizza Capricciosa (1104 g): what happens inside your body in 24 hours?") and the
// "Share this moment" text. Before, the amount label was glued in front of the lower-cased name, which gave
// "Whole · 1104 g pizza capricciosa.", "2 large egg", "1 cup, 70 ml turkish coffee" or "Kebab / doner (1 kebab)".
// The amount labels themselves (UI chips, search) are unchanged; this only words them.
import { baseOf, deriveFood, type Part } from './parse';

/** First words that are names and keep their capital in the middle of a sentence. */
const PROPER_FIRST = new Set(['French', 'Greek', 'Turkish', 'Medica']);
/** Named sizes ("How much?" chips): the words that go in front of the food. */
const SIZE_WORD: Record<string, (n: string) => string> = {
  single: (n) => `a single ${n}`, double: (n) => `a double ${n}`, slice: (n) => `1 slice of ${n}`,
  half: (n) => `half ${art(n)} ${n}`, whole: (n) => `a whole ${n}`, side: (n) => `a side portion of ${n}`, plate: (n) => `a plate of ${n}`,
  small: (n) => `a small portion of ${n}`, medium: (n) => `a medium portion of ${n}`, large: (n) => `a large portion of ${n}`,
};
/** Amount words that only describe the size of the thing itself ("1 large" egg, "1 medium" carrot). */
const ADJ = /^(small|medium|large|extra large|big|regular)( whole)?$/;
/** Amount words that ARE the thing ("1 sandwich" = 1 hamburger, "1 fruit" = 1 orange). */
const ITSELF = /^(sandwich|burger|kebab|sub|fruit|item)$/;

const art = (w: string) => (/^[aeiou]/i.test(w) ? 'an' : 'a');
const stem = (w: string) => w.toLowerCase().replace(/[^a-zćčđšž]/g, '').replace(/(s|x|z|ch|sh|o)es$/, '$1').replace(/s$/, ''); // olives → olive, potatoes → potato
/** "potato" → "potatoes", "sandwich" → "sandwiches", "bread roll" → "bread rolls" (last word only). */
export function pluralOf(phrase: string): string {
  return phrase.replace(/(\S+)$/, (w) => (/^(tsp|tbsp|g|ml|l|dl|cl|cm|oz)$/.test(w) ? w : /(s|x|z|ch|sh)$/.test(w) ? `${w}es` : /[^aeiou]y$/.test(w) ? `${w.slice(0, -1)}ies` : /(potato|tomato)$/.test(w) ? `${w}es` : /i$/.test(w) ? w : `${w}s`));
}
/** The name as it reads inside a sentence: no "(…)" detail, the first of "A / B", a lower-case first word. */
export function nameInSentence(name: string): string {
  const n = name.replace(/\s*\(.*\)$/, '').split(' / ')[0].trim();
  const [first, ...rest] = n.split(' ');
  const keep = (PROPER_FIRST.has(first) && !(first === 'French' && rest[0] === 'fries')) || /[A-Z].*[A-Z]/.test(first); // "french fries" (AP style)
  return [keep ? first : first.toLowerCase(), ...rest].join(' ');
}

const NUM = /^(\d+(?:\.\d+)?|½)$/;
const numOf = (s: string) => (s === '½' ? 0.5 : Number(s));
const FRAC: Record<string, string> = { '0.25': '¼', '0.75': '¾', '1.5': '1½', '2.5': '2½' };
const fmtCount = (v: number) => FRAC[String(Math.round(v * 100) / 100)] ?? fmt(v);
const fmt = (v: number) => (Math.abs(v - Math.round(v)) < 1e-6 ? String(Math.round(v)) : v < 10 ? String(Math.round(v * 10) / 10) : String(Math.round(v)));
/** "245 g" × 2 → "490 g"; counts of small pieces scale too ("14 halves" → "28 halves"); "15 cm", "1/12 of a cake" don't. */
const scaleDetail = (d: string, f: number) => d.replace(/(^|[^/\d.])(\d+(?:\.\d+)?)(?= ?(g|ml|halves|whole kernels|kernels)\b)/g, (_m, pre, x) => `${pre}${fmt(Number(x) * f)}`);
const countWord = (n: number, unit: string) => (n === 0.5 ? `half ${art(unit)} ${unit}` : `${fmtCount(n)} ${n > 1 ? pluralOf(unit) : unit}`);

/** "this much of this": "330 ml of cola", "2 large eggs", "a whole pizza Capricciosa (1104 g)", "1 kebab". */
export function amountPhrase(p: Pick<Part, 'food' | 'amountLabel' | 'grams'>): string {
  const f = p.food;
  let label = p.amountLabel.trim();
  // add-ins ("30 ml with 1 tsp sugar"): the plain kind is the noun, the add-in stays a "with" tail
  let tail = '', name = f.name;
  const wi = label.indexOf(' with ');
  if (f.add && wi > 0) { tail = label.slice(wi); label = label.slice(0, wi); name = deriveFood(baseOf(f), { v: f.v, on: f.on }).name; }
  const n = nameInSentence(name);
  // "2 × 1 bowl, 245 g", "½ × 30 ml", "3 × 1 sandwich"
  let mult = 1;
  const mm = /^(\d+(?:\.\d+)?|½) × (.+)$/.exec(label);
  if (mm) { mult = numOf(mm[1]); label = /^(\d|½)/.test(mm[2]) ? mm[2] : `1 ${mm[2]}`; } // "2 × glass (≈ 250 ml)", "1 × tbsp"
  // half of a coffee with 1 tsp sugar is not a half coffee with 1 tsp: "half of 1 espresso with 1 tsp sugar (30 ml)"
  if (mult === 0.5 && tail) return `half of ${amountPhrase({ ...p, amountLabel: `${label}${tail}` })}`;
  if (tail && / with /.test(n)) tail = tail.replace(/^ with /, ' and '); // "coffee with milk and 1 tsp sugar"
  if (mult >= 2 && tail) tail = `, each${tail.replace(/^ and /, ' with ')}`;
  const done = (s: string, detail = '') => `${s}${tail}${detail ? ` (${detail})` : ''}`;

  // a named size: "Whole · 1104 g", "Double · 60 g", "5 pcs · 50 g", "2 scoops · 132 g"
  const sz = /^(.+?) · (\d+) g$/.exec(label);
  if (sz && mult === 1) {
    const w = sz[1].toLowerCase(), size = SIZE_WORD[w];
    if (size) return done(size(n), `${sz[2]} g`);
    const pc = /^(\d+) (pcs|scoops?)$/.exec(w);
    if (pc) return done(`${countWord(Number(pc[1]), pc[2] === 'pcs' ? 'piece' : 'scoop')} of ${n}`, `${sz[2]} g`);
    return `${n} (${label.replace(' · ', ', ')})${tail}`;
  }
  // a plain measure: "330 ml", "0.3 l", "28 g (14 halves)", "2 dl"
  const ms = /^(\d+(?:\.\d+)?) (ml|l|dl|cl|g)(?: \((.+)\))?$/.exec(label);
  if (ms) {
    const v = Number(ms[1]), u = ms[2], extra = ms[3] ?? '';
    // a shot of espresso is counted, not measured: "1 espresso (30 ml)", "3 espressos (3 × 30 ml)"
    if (/espresso$/.test(n) && u === 'ml' && !extra) return done(mult === 0.5 ? `half ${art(n)} ${n}` : `${fmt(mult)} ${mult > 1 ? pluralOf(n) : n}`, mult === 1 ? `${ms[1]} ml` : mult === 0.5 ? `${fmt(v / 2)} ml` : `${fmt(mult)} × ${ms[1]} ml`);
    if (mult === 1) return done(`${ms[1]} ${u} of ${n}`, extra);
    if (u !== 'g' && Number.isInteger(mult)) return done(`${fmt(mult)} × ${ms[1]} ${u} of ${n}`, extra); // "2 × 500 ml of beer" (2 drinks)
    return done(`${fmt(v * mult)} ${u} of ${n}`, scaleDetail(extra, mult));
  }
  // a count: "1 slice", "2 slices", "1 cup, 70 ml", "½ breast", "1 large", "1 kebab", "1 piece (1/12 of a cake)"
  const ct = /^(\d+(?:\.\d+)?|½) ([^,(]+?)(?:, (.+)| \((.+)\))?$/.exec(label);
  if (ct && NUM.test(ct[1])) {
    const count = numOf(ct[1]) * mult;
    let unit = ct[2].trim(), detail = (ct[3] ?? ct[4] ?? '').trim();
    // "1 slice cooked", "1 link cooked", "1 medium whole"
    const tw = /^(.+?) (cooked|raw|whole|pitted)$/.exec(unit);
    if (tw && !ADJ.test(unit)) { unit = tw[1]; detail = detail ? `${tw[2]}, ${detail}` : tw[2]; }
    // the detail is for ONE unit ("1 can (250 ml)", "1 bowl, 245 g"): give the total, or say "each"
    const n0 = numOf(ct[1]), measure = /\d/.test(detail) && /\b(g|ml|halves|kernels)\b/.test(detail);
    if (mult !== 1 && measure) detail = scaleDetail(detail, mult);
    else if (mult === 1 && ct[1] === '½' && measure) detail = scaleDetail(detail, 0.5); // "½ can (250 ml)" (a DB "0.5 cup (120 ml)" is already the total)
    else if (count >= 2 && /^[\d≈]/.test(detail) && !(mult !== 1 && measure)) detail = `${detail} each`;
    const one = n0 > 1 ? unit.replace(/(ches|shes|xes|ses)$/, (s) => s.slice(0, -2)).replace(/ies$/, 'y').replace(/oes$/, 'o').replace(/s$/, '') : unit;
    const nw = n.split(' ');
    // the amount word is the food's own noun: "1 roll" + bread roll, "5 olives" + black olives, "½ breast" + chicken breast
    const hit = nw.findIndex((w) => stem(w) === stem(one) || (stem(one).length >= 4 && stem(w).endsWith(stem(one))));
    if (hit >= 0 && !ADJ.test(one)) {
      const head = nw.slice(0, hit + 1).join(' '), after = nw.slice(hit + 1).join(' ');
      const headN = count === 0.5 ? `half ${art(head)} ${head.replace(/s$/, '')}` : count > 1 ? `${fmtCount(count)} ${pluralOf(head.replace(/s$/, ''))}` : `${fmtCount(count)} ${head.replace(/(?<!s)s$/, '')}`;
      return done(`${headN}${after ? ` ${after}` : ''}`, detail);
    }
    if (ADJ.test(one)) { // "1 large" egg → "1 large egg"; "1 medium whole" tomato → "1 medium tomato"
      const adj = one.replace(/ whole$/, '');
      return done(count === 0.5 ? `half ${art(adj)} ${adj} ${n}` : `${fmtCount(count)} ${adj} ${count > 1 ? pluralOf(n) : n}`, detail);
    }
    if (ITSELF.test(one)) return done(count === 0.5 ? `half ${art(n)} ${n}` : `${fmtCount(count)} ${count > 1 ? pluralOf(n) : n}`, detail);
    return done(`${countWord(count, one)} of ${n}`, detail);
  }
  return `${n} (${p.amountLabel})`;
}

/** Several items in one sentence: "1 hamburger, a small portion of french fries and 330 ml of cola". */
export function partsPhrase(parts: Pick<Part, 'food' | 'amountLabel' | 'grams'>[]): string {
  const xs = parts.map(amountPhrase);
  return xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
}
export const capFirst = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
