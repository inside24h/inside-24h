import { useEffect, useState } from 'react';

// Number input that lets you type freely. It commits while the value is inside [min, max]
// and clamps only when you leave the field (fixes: typing "1" in height jumped to 130).
interface Props { id: string; value: number; min: number; max: number; step?: number; onCommit: (v: number) => void; label?: string }

export function NumberField({ id, value, min, max, step = 1, onCommit, label }: Props) {
  const [text, setText] = useState(String(value));
  useEffect(() => { setText((t) => (Number(t) === value ? t : String(value))); }, [value]);
  const commit = (t: string, clamp: boolean) => {
    const v = Number(t.replace(',', '.'));
    if (t.trim() === '' || !Number.isFinite(v)) { if (clamp) setText(String(value)); return; }
    if (v >= min && v <= max) onCommit(v);
    else if (clamp) { const c = Math.min(max, Math.max(min, v)); onCommit(c); setText(String(c)); }
  };
  return (
    <input id={id} aria-label={label} type="text" inputMode="decimal" value={text} data-step={step}
      onChange={(e) => { setText(e.target.value); commit(e.target.value, false); }}
      onBlur={(e) => commit(e.target.value, true)}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
  );
}
