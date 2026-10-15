// "Share this moment": makes the 4:5 picture of the minute on screen, then offers the system share sheet
// (picture + link) where the browser supports it, otherwise saves the picture and copies the link.
// Two steps on purpose: phones only open the share sheet straight from a tap, so the picture is ready first.
import { useEffect, useState } from 'react';
import { saveFile } from './share';
import { linkLabel } from './shareCard';
import './moment.css';

export interface Moment { blob: Blob; link: string; title: string; text: string; fileName: string }

async function copy(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

export function MomentShare({ make, label }: { make: () => Promise<Moment | null>; label: string }) {
  const [m, setM] = useState<(Moment & { url: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => () => { if (m) URL.revokeObjectURL(m.url); }, [m]);

  const build = async () => {
    setBusy(true); setMsg(null);
    try {
      const r = await make();
      if (!r) { setMsg('Could not draw this moment. Try again in a second.'); return; }
      setM({ ...r, url: URL.createObjectURL(r.blob) });
    } catch { setMsg('Could not draw this moment.'); } finally { setBusy(false); }
  };

  const file = m ? new File([m.blob], m.fileName, { type: 'image/png' }) : null;
  const canShareFile = !!file && typeof navigator !== 'undefined' && !!navigator.canShare && (() => { try { return navigator.canShare({ files: [file] }); } catch { return false; } })();

  const share = async () => {
    if (!m || !file) return;
    try {
      if (canShareFile) { await navigator.share({ files: [file], title: m.title, text: m.text, url: m.link }); setMsg('Shared.'); return; }
      if (navigator.share) { await navigator.share({ title: m.title, text: m.text, url: m.link }); }
    } catch (e) { if ((e as Error).name === 'AbortError') return; }
    await saveAndCopy();
  };
  const saveAndCopy = async () => {
    if (!m) return;
    const r = await saveFile(m.fileName, m.blob);
    const ok = await copy(m.link);
    setMsg(`${r === 'saved' ? 'Picture saved.' : r === 'declined' ? 'Picture not saved.' : 'Press and hold the picture to save it.'} ${ok ? 'Link copied — paste it under your post.' : 'Copy the link below.'}`);
  };

  if (!m) return (
    <div className="moment">
      <button className="primary momentbtn" onClick={build} disabled={busy}>{busy ? 'Drawing…' : `📸 ${label}`}</button>
      <span className="momentsub">A picture of this minute + a link that opens exactly here.</span>
      {msg && <p className="note">{msg}</p>}
    </div>
  );
  return (
    <div className="moment ready">
      <img src={m.url} alt={m.title} className="momentimg" />
      <div className="nbtns">
        <button className="primary" onClick={share}>{canShareFile ? 'Share picture + link' : 'Save picture + copy link'}</button>
        {canShareFile && <button className="ghost" onClick={saveAndCopy}>Save + copy link</button>}
        <button className="ghost" onClick={() => { setM(null); setMsg(null); }}>Back</button>
      </div>
      <input className="momentlink" readOnly value={m.link} aria-label="Link to this moment" title={linkLabel(m.link)}
        onFocus={(e) => e.currentTarget.select()} onClick={async () => { if (await copy(m.link)) setMsg('Link copied.'); }} />
      {msg && <p className="note">{msg}</p>}
    </div>
  );
}
