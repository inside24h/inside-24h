import { HEALTHY_VITALS, MG_DL_PER_MMOL_L, totalBodyWaterL, type Profile } from '../science/profile';
import { NumberField } from './NumberField';
import { CityField } from './CityField';

const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const fromHhmm = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

interface Props { profile: Profile; setProfile: (p: Profile) => void; dose: number; setDose: (d: number) => void; showDose?: boolean }

export function YourBody({ profile: p, setProfile, dose, setDose, showDose = true }: Props) {
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setProfile({ ...p, [k]: v });
  const mmol = p.glucoseUnit === 'mmol/L';
  return (
    <div className="yb">
      <fieldset>
        <legend>You</legend>
        <div className="seg2" role="group" aria-label="Sex">
          {(['female', 'male'] as const).map((s) => (
            <button key={s} id={`sex-${s}`} aria-pressed={p.sex === s}
              onClick={() => setProfile({ ...p, sex: s, ...(s === 'male' ? { oralContraceptives: false, latePregnancy: false } : {}) })}>
              {s === 'female' ? 'Female' : 'Male'}
            </button>
          ))}
        </div>
        <div className="fields">
          <label>Age<span><NumberField id="age" value={p.ageY} min={18} max={100} onCommit={(v) => set('ageY', Math.round(v))} /> years</span></label>
          <label>Height<span><NumberField id="height" value={p.heightCm} min={130} max={220} onCommit={(v) => set('heightCm', v)} /> cm</span></label>
          <label>Weight<span><NumberField id="weight" value={p.weightKg} min={35} max={200} onCommit={(v) => set('weightKg', v)} /> kg</span></label>
        </div>
        <div className="checks">
          <Check id="smoker" label="I smoke" on={p.smoker} set={(v) => set('smoker', v)} />
          {p.sex === 'female' && <Check id="pill" label="I take the contraceptive pill" on={p.oralContraceptives} set={(v) => set('oralContraceptives', v)} />}
          {p.sex === 'female' && <Check id="preg" label="I’m in the last weeks of pregnancy" on={p.latePregnancy} set={(v) => set('latePregnancy', v)} />}
        </div>
        <p className="note">Your body holds about <b>{totalBodyWaterL(p).toFixed(1)} L</b> of water (Watson equations). Caffeine spreads through it.</p>
      </fieldset>

      <fieldset>
        <legend>Where you are today</legend>
        <CityField value={p.city} onPick={(city) => set('city', city)} />
        <label className="check"><input type="checkbox" checked={!!p.airCon} onChange={(e) => set('airCon', e.target.checked)} /> Mostly indoors with air-conditioning</label>
        <p className="note">Temperature comes from real weather records for your city in this month (ERA5 reanalysis 2015–2024 via Open-Meteo, or NASA POWER for some cities). It is a typical day, not a live forecast.</p>
      </fieldset>

      <fieldset>
        <legend>Your usual readings</legend>
        <p className="note">Leave these as they are if you don’t know your own.</p>
        <div className="fields">
          <label>Resting pulse<span><NumberField id="hr" value={p.restingHr} min={35} max={130} onCommit={(v) => set('restingHr', Math.round(v))} /> bpm</span></label>
          <label>Blood pressure<span><NumberField id="sbp" label="Systolic" value={p.sbp} min={80} max={220} onCommit={(v) => set('sbp', Math.round(v))} /> / <NumberField id="dbp" label="Diastolic" value={p.dbp} min={40} max={140} onCommit={(v) => set('dbp', Math.round(v))} /> mmHg</span></label>
          <label>Fasting glucose<span>
            <NumberField id="glu" value={mmol ? +(p.glucoseMgDl / MG_DL_PER_MMOL_L).toFixed(1) : Math.round(p.glucoseMgDl)} min={mmol ? 2 : 36} max={mmol ? 25 : 450}
              onCommit={(v) => set('glucoseMgDl', mmol ? v * MG_DL_PER_MMOL_L : v)} />
            <select id="gunit" value={p.glucoseUnit} aria-label="Glucose unit" onChange={(e) => set('glucoseUnit', e.target.value as Profile['glucoseUnit'])}>
              <option value="mmol/L">mmol/L</option><option value="mg/dL">mg/dL</option>
            </select></span></label>
          <label>Oxygen saturation<span><NumberField id="spo2" value={p.spo2} min={80} max={100} onCommit={(v) => set('spo2', Math.round(v))} /> %</span></label>
        </div>
        <button className="link" onClick={() => setProfile({ ...p, ...HEALTHY_VITALS })}>Use typical healthy readings</button>
      </fieldset>

      <fieldset>
        <legend>{showDose ? 'Your espresso' : 'Your day'}</legend>
        {showDose && <>
          <label className="slider">Caffeine in this shot <b>{dose} mg</b>
            <input id="dose" type="range" min={20} max={330} value={dose} onChange={(e) => setDose(+e.target.value)} />
          </label>
          <div className="presets">
            <button className="pill" aria-pressed={dose === 63} onClick={() => setDose(63)}>63 mg · average</button>
            <button className="pill" aria-pressed={dose === 322} onClick={() => setDose(322)}>322 mg · strongest measured</button>
          </div>
        </>}
        <div className="fields">
          <label>Drunk at<span><input id="drinkAt" type="time" value={hhmm(p.drinkAtMin)} onChange={(e) => e.target.value && set('drinkAtMin', fromHhmm(e.target.value))} /></span></label>
          <label>Bedtime<span><input id="bedtime" type="time" value={hhmm(p.bedtimeMin)} onChange={(e) => e.target.value && set('bedtimeMin', fromHhmm(e.target.value))} /></span></label>
          <label>Wake up<span><input id="wake" type="time" value={hhmm(p.wakeMin)} onChange={(e) => e.target.value && set('wakeMin', fromHhmm(e.target.value))} /></span></label>
        </div>
      </fieldset>
    </div>
  );
}

function Check({ id, label, on, set }: { id: string; label: string; on: boolean; set: (v: boolean) => void }) {
  return <label className="check" htmlFor={id}><input id={id} type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} /><span>{label}</span></label>;
}
