// Phase 2A (audit C6, owner brief §18/§19/§29): "Make a video" in three simple steps that fit one phone screen.
//   1. Choose: where it goes (TikTok / Reels / Shorts) and a style (presets over the existing options);
//   2. Preview: the story outline and the opening frame, made in milliseconds without rendering the video, with
//      "Try another opening"; the voiceover (if on) is made in the background meanwhile;
//   3. Render: progress, time left and Cancel (the badge in AppV4), then download (+ .srt).
// Every earlier option stays, under "More options" (name in the corner, sound, feed 4:5, Facebook, both openings,
// the cover image, the hook-testing tip).
import { VoicePick } from './VoicePick';
import type { Format } from './share';
import './videosteps.css';

export type VidSound = 'music' | 'sfx' | 'none';
export interface VideoPreview {
  /** the opening frame (hook card over the body), a small JPEG data URL; null when the 3D view is not there */
  img: string | null;
  /** the video's length in seconds */ seconds: number;
  /** the key moments, in order: time after eating/drinking and what happens */ moments: { at: string; title: string }[];
}
export interface PlatformChoice { id: string; label: string; length: string }

/** The style presets: names for combinations of the existing options (voiceover + our sound). */
export const PRESETS = [
  { id: 'explained', label: 'Explained', sub: 'Voiceover + music', voice: true, sound: 'music' as VidSound },
  { id: 'visual', label: 'Visual', sub: 'Captions + music, no voice', voice: false, sound: 'music' as VidSound },
  { id: 'yoursound', label: 'Your sound', sub: 'Effects only: add a trending song', voice: false, sound: 'sfx' as VidSound },
] as const;
/** Which preset the current options match (null: a custom mix from "More options"). */
export function presetOf(voice: boolean, sound: VidSound): (typeof PRESETS)[number]['id'] | null {
  return PRESETS.find((p) => p.voice === (voice && sound !== 'none') && p.sound === sound)?.id ?? null;
}
/** "20 min", "1 h 30 min", "8 h": time after the food or drink. */
export function afterText(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

export function VideoSteps(p: {
  step: 1 | 2; setStep: (s: 1 | 2) => void;
  platforms: PlatformChoice[]; platform: string; setPlatform: (id: string) => void;
  voice: boolean; setVoice: (v: boolean) => void; sound: VidSound; setSound: (s: VidSound) => void;
  format: Format; setFormat: (f: Format) => void;
  handle: string; setHandle: (h: string) => void;
  hooks: [string, string]; hookVar: 'A' | 'B'; setHookVar: (v: 'A' | 'B') => void;
  preview: VideoPreview | null; voiceNote?: string | null; msg?: string;
  onCompare?: () => void; onCover: () => void; onMake: () => void; onClose: () => void;
}) {
  const preset = presetOf(p.voice, p.sound);
  const main = p.platforms.filter((x) => x.id !== 'facebook'), more = p.platforms.filter((x) => x.id === 'facebook');
  const plat = p.platforms.find((x) => x.id === p.platform);
  if (p.step === 1) return (
    <div className="vsteps" data-step="1">
      <div className="vshead"><h2>Make a video</h2><span className="vsnum">Step 1 of 3</span><button className="x" aria-label="Close" onClick={p.onClose}>×</button></div>
      <div className="vsgroup" role="group" aria-label="Where you'll post it">
        <span className="vslbl">Where you'll post it</span>
        <div className="vsrow">{main.map((x) => <button key={x.id} aria-pressed={p.platform === x.id} onClick={() => p.setPlatform(x.id)}><b>{x.label}</b><small>{x.length}</small></button>)}</div>
      </div>
      <div className="vsgroup" role="group" aria-label="Style">
        <span className="vslbl">Style</span>
        <div className="vsgrid">
          {PRESETS.map((s) => <button key={s.id} aria-pressed={preset === s.id} onClick={() => { p.setSound(s.sound); p.setVoice(s.voice); }}><b>{s.label}</b><small>{s.sub}</small></button>)}
          {p.onCompare && <button className="vscmp" onClick={p.onCompare}><b>Compare <span aria-hidden="true">→</span></b><small>Two foods side by side</small></button>}
        </div>
      </div>
      <VoicePick on={p.voice} set={p.setVoice} noSound={p.sound === 'none'} />
      <details className="vsmore">
        <summary>More options</summary>
        <p className="note">The whole 24 hours: an opening question, a pause at each key moment, captions for silent viewing, the food or drink moving through the body, and a summary at the end.</p>
        <label className="handle">Name in the corner <small>(optional: @inside24h or your own handle)</small><input value={p.handle} placeholder="@yourname" onChange={(e) => p.setHandle(e.target.value)} /></label>
        <div className="lenpick soundpick" role="group" aria-label="Sound">Sound:
          <button aria-pressed={p.sound === 'music'} onClick={() => p.setSound('music')}>Our music</button>
          <button aria-pressed={p.sound === 'sfx'} onClick={() => p.setSound('sfx')}>Sound effects only</button>
          <button aria-pressed={p.sound === 'none'} onClick={() => p.setSound('none')}>None (add your own)</button>
        </div>
        <div className="lenpick" role="group" aria-label="Shape">Shape:
          <button aria-pressed={p.format === 'reel'} onClick={() => p.setFormat('reel')}>9:16 Reel / Story / TikTok</button>
          <button aria-pressed={p.format === 'feed'} onClick={() => p.setFormat('feed')}>4:5 Feed post</button>
        </div>
        {more.length > 0 && <div className="lenpick platpick" role="group" aria-label="Other platforms">Also:
          {more.map((x) => <button key={x.id} aria-pressed={p.platform === x.id} onClick={() => p.setPlatform(x.id)}>{x.label} · {x.length}</button>)}</div>}
        <div className="lenpick hookpick" role="group" aria-label="Opening line">Opening line:
          {(['A', 'B'] as const).map((v, i) => <button key={v} aria-pressed={p.hookVar === v} onClick={() => p.setHookVar(v)}>{v}: “{p.hooks[i]}”</button>)}
        </div>
        <p className="note">Testing openings: post A and B on different days (or as an Instagram Trial Reel), change one thing a week, and compare the first 3 seconds (“viewed vs. swiped away” on Shorts, 2–3 s hold on TikTok), average % watched, where the curve drops, and shares.</p>
        <button className="ghost" onClick={p.onCover}>Save cover image (PNG)</button>
      </details>
      {p.msg && <p className="note" role="status">{p.msg}</p>}
      <div className="vsgo"><button className="primary" onClick={() => p.setStep(2)}>Next: preview</button></div>
    </div>
  );
  const pv = p.preview;
  return (
    <div className="vsteps" data-step="2">
      <div className="vshead"><h2>Preview</h2><span className="vsnum">Step 2 of 3</span><button className="x" aria-label="Close" onClick={p.onClose}>×</button></div>
      <div className="vsprev">
        {pv?.img ? <img src={pv.img} alt="The video's opening frame" className={p.format === 'feed' ? 'r45' : 'r916'} /> : <div className={`vsnoimg ${p.format === 'feed' ? 'r45' : 'r916'}`} aria-hidden="true" />}
        <div className="vsout">
          <div className="vsmeta">{pv ? `About ${Math.round(pv.seconds)} s` : '…'} · {plat?.label ?? ''}{p.format === 'feed' ? ' · 4:5' : ''}</div>
          <div className="vshook"><span className="vslbl">Opening</span>“{p.hooks[p.hookVar === 'A' ? 0 : 1]}”</div>
          {pv && <ol className="vsmoments" aria-label="Key moments">
            {pv.moments.slice(0, 5).map((m, i) => <li key={i}><em>{m.at}</em> {m.title}</li>)}
            {pv.moments.length > 5 && <li className="vsmorem">+ {pv.moments.length - 5} more</li>}
            <li><em>End</em> the day's summary</li>
          </ol>}
        </div>
      </div>
      <button className="ghost vsanother" onClick={() => p.setHookVar(p.hookVar === 'A' ? 'B' : 'A')}><span aria-hidden="true">↻ </span>Try another opening</button>
      {p.voiceNote && <p className="note" role="status">{p.voiceNote}</p>}
      {p.msg && <p className="note" role="status">{p.msg}</p>}
      <div className="vsgo">
        <button className="ghost" onClick={() => p.setStep(1)}>Back</button>
        <button className="primary" onClick={p.onMake}><span aria-hidden="true">🎬 </span>Make the video</button>
      </div>
    </div>
  );
}
