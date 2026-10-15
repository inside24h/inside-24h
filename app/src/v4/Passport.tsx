// "The whole trip": every place the food or drink passes, how long it stays there, what happens there, and
// where it is right now. Times come from the same model as the 3D liquid (routes.ts), so the list, the body
// and the timeline always agree. Tapping a row jumps the body and the clock to that place.
import { useMemo } from 'react';
import type { Route, SegId, SegState } from '../scene/LiquidRoute';
import { SEG_LABEL } from '../scene/LiquidRoute';
import { uFromMinutes } from '../time';

export interface Stay { id: SegId; from: number; to: number | null; peak: number; peakAmount: number; unit: string; halfGone?: number }

const ORDER: SegId[] = ['swallow', 'stomach', 'duodenum', 'small', 'portal', 'blood', 'kidney', 'bladder', 'colon'];
const FOCUS: Record<SegId, string> = { swallow: 'esophagus', stomach: 'stomach', duodenum: 'duodenum', small: 'jejunum', portal: 'liver', blood: 'heart', kidney: 'kidney_l', bladder: 'bladder', colon: 'colon_trans' };
const ICON: Record<SegId, string> = { swallow: '👄', stomach: '🫃', duodenum: '🧪', small: '〰️', portal: '🟤', blood: '🩸', kidney: '🫘', bladder: '💧', colon: '🌀' };

/** What happens in each place, in plain words; `kind` tunes a few lines. */
export function whatHappens(id: SegId, kind: { drink: boolean; fat: boolean; sugar: boolean; alcohol: boolean; caffeine: boolean; fibre: boolean }): string {
  switch (id) {
    case 'swallow': return 'You swallow and it slides down the food pipe into your stomach.';
    case 'stomach': return kind.drink
      ? `Stomach acid mixes with it and lets it out in small squirts.${kind.sugar ? ' Sugar makes it wait longer.' : ''}`
      : `Muscles churn it with acid into a paste and let it out bit by bit.${kind.fat ? ' Fat makes this slower.' : ''}`;
    case 'duodenum': return 'Bile and juices from the pancreas start breaking it apart.';
    case 'small': return `This is where almost everything is absorbed into your blood${kind.sugar ? ': sugars within minutes' : ''}${kind.fibre ? '. Fibre passes on untouched' : ''}.`;
    case 'portal': return kind.alcohol ? 'Blood from the gut goes to the liver first, which starts removing the alcohol.' : 'Blood from the gut goes straight to the liver, which stores sugar and sorts what you absorbed.';
    case 'blood': return kind.caffeine ? 'Your blood carries it to every organ, including your brain.' : 'Your blood carries the energy and water to every cell.';
    case 'kidney': return 'Your kidneys filter out the extra water and waste.';
    case 'bladder': return 'It collects as urine until you go to the toilet.';
    case 'colon': return 'Gut bacteria ferment the fibre and water is taken back. It slowly becomes stool and leaves in 1–2 days.';
  }
}

export function computeStays(route: Route, minutes = 1440): Stay[] {
  // 'here' = at least 8% of the most this place ever holds, so a small side-branch (duodenum) is timed fairly
  const maxFrac = new Map<SegId, number>();
  for (let m = 0; m <= minutes; m += 2) { const s = route.segs(m); for (const id of ORDER) { const v = s[id]; if (v) maxFrac.set(id, Math.max(maxFrac.get(id) ?? 0, v.frac)); } }
  const out = new Map<SegId, Stay>();
  for (let m = 0; m <= minutes; m++) {
    const s = route.segs(m);
    for (const id of ORDER) {
      const v: SegState | undefined = s[id];
      if (!v) continue;
      const here = (v.frac >= Math.max(0.004, 0.08 * (maxFrac.get(id) ?? 0)) && (maxFrac.get(id) ?? 0) >= 0.02) || (id === 'swallow' && m < 1);
      let st = out.get(id);
      if (here) {
        if (!st) { st = { id, from: m, to: null, peak: m, peakAmount: v.amount, unit: v.unit ?? route.unit }; out.set(id, st); }
        if (v.amount > st.peakAmount) { st.peakAmount = v.amount; st.peak = m; st.unit = v.unit ?? route.unit; }
        st.to = null; // still here
      } else if (st && st.to === null) st.to = m;
    }
  }
  // when half of the most it ever held has left again (easier to grasp than 'about 2 h')
  for (const st of out.values()) {
    for (let m = st.peak + 1; m <= minutes; m++) { const v = route.segs(m)[st.id]; if (v && v.amount <= st.peakAmount / 2) { st.halfGone = m; break; } }
  }
  const list = ORDER.map((id) => out.get(id)).filter(Boolean) as Stay[];
  // the swallow takes seconds, not a minute
  return list.map((s) => (s.id === 'swallow' ? { ...s, from: 0, to: 0.3 } : s));
}

const clockOnly = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(Math.floor(min % 60)).padStart(2, '0')}`;
/** clock time, marked when it falls on the next calendar day */
const clock = (min: number) => `${clockOnly(min)}${min >= 1440 ? ' tomorrow' : ''}`;
function duration(min: number): string {
  if (min < 1) return 'a few seconds';
  if (min < 60) return `about ${Math.round(min)} min`;
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  if (h >= 10) return `about ${Math.round(min / 60)} h`;
  return `about ${h} h${m >= 5 ? ` ${m} min` : ''}`;
}
// blood and liver hold the drink's *products* (sugar, caffeine), so they explain only when the gut is empty
const BODY_WIDE = new Set<SegId>(['blood', 'portal']);
const HALF_SHOWN =new Set<SegId>(['stomach', 'small', 'colon']);
const fmt = (v: number) => (v >= 100 ? Math.round(v).toString() : v >= 10 ? v.toFixed(0) : v.toFixed(1));

export function Passport({ route, minute, drinkAt, kind, onJump, compact = false }: {
  route: Route; minute: number; drinkAt: number; kind: Parameters<typeof whatHappens>[1];
  onJump: (minute: number, organ: string) => void;
  /** next to the body: one line per place, the explanation only where most of it is right now */
  compact?: boolean;
}) {
  const stays = useMemo(() => computeStays(route), [route]);
  const now = route.segs(minute);
  const lead = (Object.entries(now) as [SegId, SegState][]).filter(([id]) => stays.some((x) => x.id === id)).sort((p, q) => q[1].frac * (BODY_WIDE.has(q[0]) ? 0.3 : 1) - p[1].frac * (BODY_WIDE.has(p[0]) ? 0.3 : 1))[0]?.[0];
  return (
    <div className={`passport ${compact ? 'compact' : ''}`}>
      <div className="ctl">{compact ? 'Its trip through you' : 'The whole trip · tap a place'}</div>
      {stays.map((s) => {
        const v = now[s.id];
        const isNow = (minute >= s.from && minute < (s.to ?? 1441) && !!v && v.amount > 0) || (s.id === 'swallow' && minute < 0.8);
        const end = s.to ?? 1440;
        const a = uFromMinutes(s.from) * 100, b = Math.max(a + 1.2, uFromMinutes(Math.min(1440, end)) * 100);
        return (
          <button key={s.id} className={`pp ${isNow ? 'now' : minute > end ? 'past' : ''}`} onClick={() => onJump(s.id === 'swallow' ? 0.1 : s.peak, FOCUS[s.id])}>
            <span className="ppi" aria-hidden="true">{ICON[s.id]}</span>
            <span className="ppm">
              <span className="pph"><b>{SEG_LABEL[s.id]}</b>{isNow && <em>NOW · {fmt(v!.amount)} {v!.unit ?? route.unit}</em>}</span>
              <span className="ppt">{s.id === 'swallow' ? `${clock(drinkAt)} · a few seconds` : `${clock(drinkAt + s.from)} – ${s.to === null ? 'still there after 24 h' : clock(drinkAt + s.to)} · ${duration(end - s.from)}${s.halfGone !== undefined && HALF_SHOWN.has(s.id) && (!compact || isNow) ? ` · half gone by ${clock(drinkAt + s.halfGone)}` : ''}`}</span>
              {(!compact || (isNow && (s.id === lead || (s.id === 'swallow' && minute < 0.8)))) && <span className="ppw">{whatHappens(s.id, kind)}</span>}
              <span className="ppbar" aria-hidden="true"><i style={{ left: `${a}%`, width: `${b - a}%` }} /><s style={{ left: `${uFromMinutes(minute) * 100}%` }} /></span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
