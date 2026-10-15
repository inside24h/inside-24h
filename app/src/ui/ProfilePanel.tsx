import { HEALTHY_VITALS, MG_DL_PER_MMOL_L, totalBodyWaterL, type Profile } from '../science/profile';

const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const fromHhmm = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

interface Props { profile: Profile; setProfile: (p: Profile) => void; dose: number; setDose: (d: number) => void }

export function ProfilePanel({ profile: p, setProfile, dose, setDose }: Props) {
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setProfile({ ...p, [k]: v });
  const num = (k: keyof Profile, min: number, max: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value); if (Number.isFinite(v)) set(k, Math.min(max, Math.max(min, v)) as never);
  };
  const glucoseShown = p.glucoseUnit === 'mg/dL' ? Math.round(p.glucoseMgDl) : +(p.glucoseMgDl / MG_DL_PER_MMOL_L).toFixed(1);

  return (
    <section className="panel profile">
      <div className="lbl">Your body <span className="refkey">body water ≈ {totalBodyWaterL(p).toFixed(1)} L</span></div>
      <div className="grid2">
        <label>Sex
          <select id="sex" value={p.sex} onChange={(e) => setProfile({ ...p, sex: e.target.value as Profile['sex'], ...(e.target.value === 'male' ? { oralContraceptives: false, latePregnancy: false } : {}) })}>
            <option value="female">Female</option><option value="male">Male</option>
          </select>
        </label>
        <label>Age <input id="age" type="number" min={18} max={100} value={p.ageY} onChange={num('ageY', 18, 100)} /></label>
        <label>Height (cm) <input id="height" type="number" min={130} max={220} value={p.heightCm} onChange={num('heightCm', 130, 220)} /></label>
        <label>Weight (kg) <input id="weight" type="number" min={35} max={200} value={p.weightKg} onChange={num('weightKg', 35, 200)} /></label>
      </div>
      <div className="toggles">
        <Toggle id="smoker" label="I smoke" on={p.smoker} set={(v) => set('smoker', v)} />
        {p.sex === 'female' && <Toggle id="pill" label="Contraceptive pill" on={p.oralContraceptives} set={(v) => set('oralContraceptives', v)} />}
        {p.sex === 'female' && <Toggle id="preg" label="Last weeks of pregnancy" on={p.latePregnancy} set={(v) => set('latePregnancy', v)} />}
      </div>

      <div className="sub">Your usual readings <span>leave the defaults if you don’t know them</span></div>
      <div className="grid2">
        <label>Resting pulse (bpm) <input id="hr" type="number" min={35} max={130} value={p.restingHr} onChange={num('restingHr', 35, 130)} /></label>
        <label>Blood pressure
          <span className="pair">
            <input id="sbp" type="number" min={80} max={220} value={p.sbp} onChange={num('sbp', 80, 220)} aria-label="Systolic" />/
            <input id="dbp" type="number" min={40} max={140} value={p.dbp} onChange={num('dbp', 40, 140)} aria-label="Diastolic" />
          </span>
        </label>
        <label>Fasting glucose
          <span className="pair">
            <input id="glu" type="number" step={p.glucoseUnit === 'mg/dL' ? 1 : 0.1} value={glucoseShown}
              onChange={(e) => { const v = Number(e.target.value); if (v > 0) set('glucoseMgDl', p.glucoseUnit === 'mg/dL' ? v : v * MG_DL_PER_MMOL_L); }} />
            <select id="gunit" value={p.glucoseUnit} onChange={(e) => set('glucoseUnit', e.target.value as Profile['glucoseUnit'])} aria-label="Glucose unit">
              <option value="mmol/L">mmol/L</option><option value="mg/dL">mg/dL</option>
            </select>
          </span>
        </label>
        <label>Oxygen saturation (%) <input id="spo2" type="number" min={80} max={100} value={p.spo2} onChange={num('spo2', 80, 100)} /></label>
      </div>
      <button className="chip" onClick={() => setProfile({ ...p, ...HEALTHY_VITALS })}>Reset to typical healthy readings</button>

      <div className="sub">Your espresso</div>
      <label className="row">Caffeine in this shot <b>{dose} mg</b>
        <input id="dose" type="range" min={20} max={330} value={dose} onChange={(e) => setDose(+e.target.value)} />
      </label>
      <div className="presets">
        <button className="chip" onClick={() => setDose(63)}>63 mg · USDA average</button>
        <button className="chip" onClick={() => setDose(322)}>322 mg · strongest measured</button>
      </div>
      <div className="grid2">
        <label>Drunk at <input id="drinkAt" type="time" value={hhmm(p.drinkAtMin)} onChange={(e) => e.target.value && set('drinkAtMin', fromHhmm(e.target.value))} /></label>
        <label>Bedtime <input id="bedtime" type="time" value={hhmm(p.bedtimeMin)} onChange={(e) => e.target.value && set('bedtimeMin', fromHhmm(e.target.value))} /></label>
      </div>
    </section>
  );
}

function Toggle({ id, label, on, set }: { id: string; label: string; on: boolean; set: (v: boolean) => void }) {
  return <button id={id} className="chip toggle" aria-pressed={on} onClick={() => set(!on)}>{label}</button>;
}

export { hhmm };
