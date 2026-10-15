// Vital signs over 24 h: the person ("You") against a healthy person of the same body size.
import { useState } from 'react';
import { at, type Timeline } from '../science/espressoSim';
import { formatGlucose, type Profile } from '../science/profile';
import { minutesFromU, uFromMinutes } from '../time';
import { ESPRESSO, VITAL_CLAIMS } from '../content/espresso';
import { ClaimRow } from './ClaimRow';

interface Row {
  key: keyof typeof VITAL_CLAIMS;
  label: string;
  unit: string;
  you: (m: number) => number;
  twin: (m: number) => number;
  fmt: (v: number) => string;
  second?: { you: (m: number) => number; twin: (m: number) => number }; // diastolic
}

export function Vitals({ you, twin, profile, minute }: { you: Timeline; twin: Timeline; profile: Profile; minute: number }) {
  const [open, setOpen] = useState<string | null>(null);
  const g = (v: number) => formatGlucose(v, profile.glucoseUnit);
  const rows: Row[] = [
    { key: 'caffeine', label: 'Caffeine in blood', unit: 'mg/L', you: (m) => at(you.conc, m), twin: (m) => at(twin.conc, m), fmt: (v) => v.toFixed(2) },
    { key: 'hr', label: 'Heart rate', unit: 'bpm', you: (m) => at(you.hr, m), twin: (m) => at(twin.hr, m), fmt: (v) => v.toFixed(0) },
    { key: 'bp', label: 'Blood pressure', unit: 'mmHg', you: (m) => at(you.sbp, m), twin: (m) => at(twin.sbp, m), fmt: (v) => v.toFixed(0),
      second: { you: (m) => at(you.dbp, m), twin: (m) => at(twin.dbp, m) } },
    { key: 'glucose', label: 'Blood glucose', unit: profile.glucoseUnit, you: (m) => at(you.glucose, m), twin: (m) => at(twin.glucose, m), fmt: g },
    { key: 'spo2', label: 'Oxygen saturation', unit: '%', you: (m) => at(you.spo2, m), twin: (m) => at(twin.spo2, m), fmt: (v) => v.toFixed(0) },
  ];

  return (
    <section className="panel vitals">
      <div className="lbl">Body readings <span className="legend"><i className="you" />You <i className="twin" />Healthy, same height &amp; weight</span></div>
      {rows.map((r) => {
        const yv = r.you(minute), tv = r.twin(minute), y0 = r.you(0);
        const delta = yv - y0;
        const val = (f: (m: number) => number, s?: (m: number) => number) => (s ? `${r.fmt(f(minute))}/${r.fmt(s(minute))}` : r.fmt(f(minute)));
        return (
          <div key={r.key} className="vital">
            <button className="vhead" aria-expanded={open === r.key} onClick={() => setOpen(open === r.key ? null : r.key)}>
              <span className="vname">{r.label}</span>
              <span className="vval"><b>{val(r.you, r.second?.you)}</b> <small>{r.unit}</small></span>
              <span className={`vdelta ${Math.abs(delta) < 0.05 ? 'flat' : delta > 0 ? 'up' : 'down'}`}>
                {r.key === 'caffeine' ? '' : Math.abs(delta) < 0.05 ? 'no change' : `${delta > 0 ? '+' : ''}${r.key === 'glucose' ? r.fmt(Math.abs(delta)) : delta.toFixed(1)} from start`}
              </span>
              <span className="vtwin">healthy: {val(r.twin, r.second?.twin)}</span>
            </button>
            <Spark you={r.you} twin={r.twin} minute={minute} same={Math.abs(tv - yv) < 1e-9 && Math.abs(r.twin(600) - r.you(600)) < 1e-9} />
            {open === r.key && (
              <ul className="claims inline">{VITAL_CLAIMS[r.key].map((id) => <ClaimRow key={id} claim={ESPRESSO.claims[id]} />)}</ul>
            )}
          </div>
        );
      })}
      <p className="hint">Tap a reading to see where its numbers come from.</p>
    </section>
  );
}

const W = 300, H = 46;
function Spark({ you, twin, minute, same }: { you: (m: number) => number; twin: (m: number) => number; minute: number; same: boolean }) {
  const N = 120;
  const ys = Array.from({ length: N + 1 }, (_, i) => you(minutesFromU(i / N)));
  const ts = Array.from({ length: N + 1 }, (_, i) => twin(minutesFromU(i / N)));
  let lo = Math.min(...ys, ...ts), hi = Math.max(...ys, ...ts);
  if (hi - lo < 1e-6) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.15; lo -= pad; hi += pad;
  const x = (i: number) => (i / N) * W, y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  const d = (s: number[]) => s.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const nx = uFromMinutes(minute) * W;
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      {!same && <path d={d(ts)} className="twin" />}
      <path d={d(ys)} className="you" />
      <line x1={nx} x2={nx} y1={0} y2={H} className="now" />
    </svg>
  );
}
