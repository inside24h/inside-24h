// Step 1: who you are, in a few taps. Templates fill height and weight; exact numbers are optional.
import { useState } from 'react';
import type { Profile } from '../science/profile';
import { NumberField } from './NumberField';
import { CityField } from './CityField';

// Heights are round example values per template (shown on the button, so nothing is hidden).
const HEIGHTS: Record<Profile['sex'], [string, number][]> = {
  female: [['Shorter', 158], ['Average', 166], ['Taller', 176]],
  male: [['Shorter', 170], ['Average', 179], ['Taller', 190]],
};
// Builds as BMI values inside each CDC category: slim/average = healthy range, heavier = overweight, heavy = obesity.
const BUILDS: [string, number][] = [['Slim', 20], ['Average', 23.5], ['Heavier', 27.5], ['Heavy', 32]];
const AGES: [string, number][] = [['18–29', 25], ['30–44', 37], ['45–59', 52], ['60+', 68]];

export function BodyStart({ profile, setProfile, onNext }: { profile: Profile; setProfile: (p: Profile) => void; onNext: () => void }) {
  const [build, setBuild] = useState<number | null>(null);
  const [exact, setExact] = useState(false);
  const weightFor = (h: number, bmi: number) => Math.round(bmi * (h / 100) ** 2);
  // show which template the current numbers fall into, so something is always selected
  const bandOf = (age: number) => (age < 30 ? 25 : age < 45 ? 37 : age < 60 ? 52 : 68);
  const nearestHeight = HEIGHTS[profile.sex].reduce((b, [, h]) => (Math.abs(h - profile.heightCm) < Math.abs(b - profile.heightCm) ? h : b), HEIGHTS[profile.sex][0][1]);
  const bmiNow = profile.weightKg / (profile.heightCm / 100) ** 2;
  const nearestBuild = bmiNow < 21.75 ? 20 : bmiNow < 25 ? 23.5 : bmiNow < 30 ? 27.5 : 32;
  const setHeight = (h: number) => setProfile({ ...profile, heightCm: h, weightKg: build ? weightFor(h, build) : profile.weightKg });
  const setBuildBmi = (bmi: number) => { setBuild(bmi); setProfile({ ...profile, weightKg: weightFor(profile.heightCm, bmi) }); };
  const setSex = (sex: Profile['sex']) => {
    const h = HEIGHTS[sex][1][1];
    setProfile({ ...profile, sex, heightCm: h, weightKg: weightFor(h, build ?? 23.5), ...(sex === 'male' ? { oralContraceptives: false, latePregnancy: false } : {}) });
  };
  return (
    <div className="startbox body">
      <div className="step">Step 1 of 2 · You</div>
      <h1>Tell us about you</h1>
      <p className="then">Tap what fits you best. It changes how strongly food and drink affect your body.</p>

      <div className="pick">
        <span>I am a</span>
        <div className="chips2" role="group" aria-label="I am a">{(['female', 'male'] as const).map((s) => <button key={s} aria-pressed={profile.sex === s} onClick={() => setSex(s)}>{s === 'female' ? 'Woman' : 'Man'}</button>)}</div>
      </div>
      <div className="pick">
        <span>Age</span>
        <div className="chips2" role="group" aria-label="Age">{AGES.map(([l, a]) => <button key={l} aria-pressed={bandOf(profile.ageY) === a} onClick={() => setProfile({ ...profile, ageY: a })}>{l}</button>)}</div>
      </div>
      <div className="pick">
        <span>Height</span>
        <div className="chips2" role="group" aria-label="Height">{HEIGHTS[profile.sex].map(([l, h]) => <button key={l} aria-pressed={nearestHeight === h} onClick={() => setHeight(h)}>{l}<small>{h} cm</small></button>)}</div>
      </div>
      <div className="pick">
        <span>Build</span>
        <div className="chips2" role="group" aria-label="Build">{BUILDS.map(([l, b]) => <button key={l} aria-pressed={(build ?? nearestBuild) === b} onClick={() => setBuildBmi(b)}>{l}<small>{weightFor(profile.heightCm, b)} kg</small></button>)}</div>
      </div>

      <div className="pick">
        <span>Where are you today?</span>
        <CityField value={profile.city} onPick={(city) => setProfile({ ...profile, city })} />
      </div>

      <button className="exactbtn" aria-expanded={exact} onClick={() => setExact(!exact)}>{exact ? 'Hide exact numbers' : 'I know my exact weight and height →'}</button>
      {exact && (
        <div className="quickbody">
          <label>Weight<span><NumberField id="sweight" value={profile.weightKg} min={35} max={200} onCommit={(v) => { setBuild(null); setProfile({ ...profile, weightKg: v }); }} /> kg</span></label>
          <label>Height<span><NumberField id="sheight" value={profile.heightCm} min={130} max={220} onCommit={(v) => setProfile({ ...profile, heightCm: v })} /> cm</span></label>
          <label>Age<span><NumberField id="sage" value={profile.ageY} min={18} max={100} onCommit={(v) => setProfile({ ...profile, ageY: Math.round(v) })} /> years</span></label>
        </div>
      )}
      <div className="summary">{profile.sex === 'female' ? 'Woman' : 'Man'} · {profile.ageY} years · {profile.heightCm} cm · {profile.weightKg} kg{profile.city ? ` · ${profile.city.split(',')[0]}` : ''}</div>
      <button className="primary big" onClick={onNext}>Next: what did you have?</button>
      <p className="fine">Free · An educational simulation, not medical advice · Nothing you enter leaves your device</p>
    </div>
  );
}
