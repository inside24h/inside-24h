import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Body, type Glow } from './scene/Body';
import { Particles, PARTICLES } from './scene/Particles';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { ClaimRow } from './ui/ClaimRow';
import { Vitals } from './ui/Vitals';
import { ProfilePanel, hhmm } from './ui/ProfilePanel';
import { ESPRESSO } from './content/espresso';
import { organInfo } from './content/organs';
import { SOURCES } from './content/sources';
import { DEFAULT_PROFILE, healthyTwin, type Profile } from './science/profile';
import { at, simulateEspresso } from './science/espressoSim';
import { formatClock, formatShort, minutesFromU, uFromMinutes, MAX_MIN } from './time';

const PRODUCT = ESPRESSO;
const PLAY_SECONDS = 45; // real seconds for the full 24 h

// Deep link for screenshots and posts: #t=<minutes>&organ=<key>&dose=<mg>. A given t starts paused.
const HASH = new URLSearchParams(window.location.hash.slice(1));
const HASH_T = HASH.has('t') ? Math.max(0, Math.min(MAX_MIN, Number(HASH.get('t')) || 0)) : null;

export default function App() {
  const [u, setU] = useState(HASH_T === null ? 0 : uFromMinutes(HASH_T));
  const [playing, setPlaying] = useState(HASH_T === null);
  const [dose, setDose] = useState(Number(HASH.get('dose')) || 63);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [selected, setSelected] = useState<string | null>(HASH.get('organ'));
  const [sceneError, setSceneError] = useState<unknown>(null);

  // playback
  const last = useRef(0);
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last.current) / 1000); last.current = now;
      setU((v) => Math.min(1, v + dt / PLAY_SECONDS));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  useEffect(() => { if (u >= 1) setPlaying(false); }, [u]);

  const minute = minutesFromU(u);
  const you = useMemo(() => simulateEspresso(dose, profile), [dose, profile]);
  const twin = useMemo(() => simulateEspresso(dose, healthyTwin(profile)), [dose, profile]);

  const stageIndex = PRODUCT.stages.reduce((acc, s, i) => (minute >= s.min ? i : acc), 0);
  const stage = PRODUCT.stages[stageIndex];
  const glow: Glow = {};
  for (const o of stage.organs) glow[o] = 0.55;

  const info = selected ? organInfo(selected, you, minute) : null;
  const clock = (profile.drinkAtMin + minute) % 1440;
  const toBed = (profile.bedtimeMin - profile.drinkAtMin + 1440) % 1440;
  const jump = (min: number) => { setU(uFromMinutes(min + 0.01)); setPlaying(false); };

  return (
    <div className="wrap">
      <header>
        <div>
          <div className="kicker">What happens after you eat it · build 0.3</div>
          <h1>Inside <em>24h</em></h1>
        </div>
        <p className="lede">Real human anatomy and a model of your own body. Every number carries its evidence level and source; every estimate shows its math.</p>
      </header>

      <main className="main">
        <section className="stage" aria-label="3D body">
          <ErrorBoundary fallback={(e) => <StageError error={e} />}>
            {sceneError ? <StageError error={sceneError} /> : (
              <Canvas camera={{ position: [0.05, 1.24, 1.95], fov: 34 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}
                onPointerMissed={() => setSelected(null)}>
                <Suspense fallback={null}>
                  <Body glow={glow} selected={selected} onSelect={setSelected} onError={setSceneError} />
                  <Particles sim={you} minute={minute} />
                </Suspense>
                <OrbitControls target={[0, 1.2, 0]} enablePan={false} minDistance={0.45} maxDistance={3} />
              </Canvas>
            )}
          </ErrorBoundary>

          <div className="hud">
            <b>{PRODUCT.name}</b> · {dose} mg caffeine · drunk at {hhmm(profile.drinkAtMin)}<br />
            <span className="now">{hhmm(Math.floor(clock))}</span> · {formatClock(minute)}<br />
            Drag to rotate · scroll to zoom · click an organ
          </div>

          {info && (
            <div className="organcard" role="dialog" aria-label={info.name}>
              <div className="ochead"><b>{info.name}</b><button aria-label="Close" onClick={() => setSelected(null)}>×</button></div>
              {info.lines.map((l) => <div key={l.label} className="ocline"><span>{l.label}</span><b>{l.value}</b></div>)}
              <p>{info.text}</p>
              <ul className="claims inline">{info.claims.map((id) => PRODUCT.claims[id] && <ClaimRow key={id} claim={PRODUCT.claims[id]} />)}</ul>
            </div>
          )}

          <div className="legend3d">
            <span><i style={{ background: '#ffc46b' }} />caffeine</span>
            <span><i style={{ background: '#b48cff' }} />breakdown products</span>
            <span><i style={{ background: '#8fa3b8' }} />removed by kidneys</span>
            <span className="muted">1 dot = {(dose / PARTICLES).toFixed(3)} mg</span>
          </div>
          <div className="balance" aria-label="Where the caffeine is now">
            <Seg label="stomach" mg={at(you.stomach, minute)} dose={dose} cls="st" />
            <Seg label="intestine" mg={at(you.intestine, minute)} dose={dose} cls="gut" />
            <Seg label="blood & tissues" mg={at(you.body, minute)} dose={dose} cls="body" />
            <Seg label="broken down" mg={at(you.metabolites, minute)} dose={dose} cls="met" />
            <Seg label="removed" mg={at(you.cleared, minute)} dose={dose} cls="gone" />
          </div>
        </section>

        <aside className="side">
          <section className="readout" aria-live="polite">
            <div className="clockrow">
              <div className="clock">{formatClock(minute)}</div>
              <div className="stagechip">{stage.title}</div>
            </div>
            <ul className="claims">{stage.claims.map((id) => <ClaimRow key={id} claim={PRODUCT.claims[id]} />)}</ul>
          </section>

          <section className="timeline">
            <div className="tl">
              <button id="play" onClick={() => { if (u >= 1) setU(0); setPlaying((p) => !p); }}>{playing ? 'PAUSE' : 'PLAY'}</button>
              <input id="scrub" type="range" min={0} max={1000} value={Math.round(u * 1000)} aria-label="Time after drinking"
                onChange={(e) => { setU(+e.target.value / 1000); setPlaying(false); }} />
            </div>
            <div className="chips">
              {PRODUCT.stages.map((s, i) => (
                <button key={s.min} className="chip" aria-current={i === stageIndex} onClick={() => jump(s.min)}>{formatShort(s.min)} · {s.title}</button>
              ))}
              {toBed > 0 && toBed <= MAX_MIN && <button className="chip bed" onClick={() => jump(toBed)}>{hhmm(profile.bedtimeMin)} · Bedtime</button>}
            </div>
          </section>

          <Vitals you={you} twin={twin} profile={profile} minute={minute} />
        </aside>
      </main>

      <div className="lower">
        <ProfilePanel profile={profile} setProfile={setProfile} dose={dose} setDose={setDose} />
        <section className="panel summary">
          <div className="lbl">For you, in numbers</div>
          <Fact label={`Caffeine left at bedtime (${hhmm(profile.bedtimeMin)})`} you={`${at(you.body, toBed).toFixed(0)} mg`} twin={`${at(twin.body, toBed).toFixed(0)} mg`} />
          <Fact label="Half-life" you={`${you.halfLifeH.toFixed(1)} h`} twin={`${twin.halfLifeH.toFixed(1)} h`} />
          <Fact label="Peak blood level" you={`${you.peakConc.toFixed(2)} mg/L`} twin={`${twin.peakConc.toFixed(2)} mg/L`} />
          <Fact label="Peak reached after" you={formatShort(you.tmaxMin)} twin={formatShort(twin.tmaxMin)} />
          <Fact label="Caffeine spreads into" you={`${you.vdL.toFixed(1)} L`} twin={`${twin.vdL.toFixed(1)} L`} />
          <p className="hint">EFSA: 100 mg close to bedtime can disturb sleep in some adults. Where you live does not change these results yet; it will matter for foods whose recipe differs by country.</p>
        </section>
      </div>

      <footer className="note">
        <p><b>Evidence levels.</b> A established · B supported but variable · C our estimate, with the calculation shown · ? not yet studied. “Source pending” means we found it in a secondary summary and are checking the original.</p>
        <p>Educational visual for adults, not medical advice. Anatomy: <a href={SOURCES.bodyparts3d.url}>BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution 4.0 International</a>.</p>
      </footer>
    </div>
  );
}

function Fact({ label, you, twin }: { label: string; you: string; twin: string }) {
  return <div className="fact2"><span>{label}</span><b>{you}</b><small>healthy: {twin}</small></div>;
}

function StageError({ error }: { error: unknown }) {
  return (
    <div className="stage-error" role="alert">
      <b>The 3D body could not load.</b>
      <p>Everything else on the page still works. Technical detail: {error instanceof Error ? error.message : String(error)}</p>
    </div>
  );
}

function Seg({ label, mg, dose, cls }: { label: string; mg: number; dose: number; cls: string }) {
  return (
    <div className={`seg ${cls}`} style={{ flexGrow: Math.max(mg / dose, 0.02) }}>
      <span>{label}</span><b>{mg < 0.1 ? '0' : mg.toFixed(mg < 10 ? 1 : 0)} mg</b>
    </div>
  );
}
