// When this browser cannot make the video (no WebCodecs: Instagram, TikTok and other in-app browsers), say so in
// plain words, help people open the page in their real browser, and offer a still picture of this moment instead.
import { useEffect, useState } from 'react';
import './safety.css';

export function VideoFallback({ reason, makeImage, onSave }: {
  reason?: string; makeImage: () => Promise<Blob | null>; onSave: (blob: Blob) => Promise<string>;
}) {
  const link = typeof window === 'undefined' ? '' : window.location.href;
  const [copied, setCopied] = useState(false);
  const [img, setImg] = useState<{ url: string; blob: Blob } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => () => { if (img) URL.revokeObjectURL(img.url); }, [img]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); }
    catch { setCopied(false); setMsg('Copying is blocked here. Press and hold the link above to copy it.'); }
  };
  const still = async () => {
    const blob = await makeImage();
    if (!blob) { setMsg('We couldn’t draw the picture. Please try again once the body has loaded.'); return; }
    setImg({ url: URL.createObjectURL(blob), blob });
    setMsg(await onSave(blob));
  };
  return (
    <div className="fallback">
      <h2>Open this in your browser</h2>
      <p>Making a video needs Chrome or Safari. Please open this page in your browser.</p>
      {reason && <p className="note">{reason}</p>}
      <p className="note">In Instagram or TikTok: tap ⋯ (top right) and choose “Open in browser”, or copy the link.</p>
      <div className="linkrow">
        <input readOnly value={link} aria-label="Link to this page" onFocus={(e) => e.currentTarget.select()} />
        <button className="primary" onClick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
      </div>
      <button className="ghost" onClick={still}>Save a picture of this moment instead (PNG)</button>
      {img && <img src={img.url} alt="Picture of this moment" style={{ maxWidth: '100%', maxHeight: '50vh', borderRadius: 10, justifySelf: 'center' }} />}
      {msg && <p className="note" role="status">{msg}</p>}
    </div>
  );
}
