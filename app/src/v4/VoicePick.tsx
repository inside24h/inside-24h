// 2026-11-05: "Voiceover: On / Off" in the video dialogs (single and comparison). On by default; the first time, a
// one-line note says the voice model is downloaded once (voice-tts.ts keeps 'i24-voice-ready' once it has loaded).
const voiceReady = () => { try { return localStorage.getItem('i24-voice-ready') === '1'; } catch { return false; } };

export function VoicePick({ on, set, noSound = false }: { on: boolean; set: (v: boolean) => void; noSound?: boolean }) {
  const active = on && !noSound;
  return (<>
    <div className="lenpick voicepick" role="group" aria-label="Voiceover">Voiceover:
      <button aria-pressed={active} disabled={noSound} onClick={() => set(true)}>On</button>
      <button aria-pressed={!active} onClick={() => set(false)}>Off</button>
    </div>
    {noSound ? <p className="note">The voiceover comes with our sound; pick “Our music” or “Sound effects only” to hear it.</p>
      : active && !voiceReady() && <p className="note">Downloads a voice model once (~90 MB, from Hugging Face). The voice is made on your device.</p>}
  </>);
}
