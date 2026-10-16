import { useState } from 'react';
import { KIND_LABEL, LONG_TERM } from '../content/longterm';
import { SOURCES } from '../content/sources';

// Bars show direction and rough size only: right/amber = worse for health, left/green = better. Scale ±50%.
export function EveryDay({ productId }: { productId: string }) {
  const data = LONG_TERM[productId];
  const [open, setOpen] = useState<string | null>(null);
  if (!data) return <p className="note">Our long-term research for this food or drink isn’t finished yet.</p>;
  return (
    <div className="ed">
      <p className="edintro">{data.intro}</p>
      <div className="edkey" aria-hidden="true"><span><i className="worse" />worse for health</span><span><i className="better" />better for health</span></div>
      {data.items.map((it) => {
        const isOpen = open === it.marker;
        const w = it.pct === null ? 0 : Math.min(50, Math.abs(it.pct)) * 2; // % of half-width
        return (
          <div key={it.marker} className="eitem">
            <button className="ehead" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : it.marker)}>
              <span className="emarker">{it.marker}</span>
              <span className={`eeffect ${it.better ? 'better' : it.pct ? 'worse' : ''}`}>{it.effect}</span>
              {it.share !== undefined ? (
                <span className="ebar share" aria-hidden="true"><i style={{ width: `${it.share * 100}%` }} /></span>
              ) : (
                <span className="ebar" aria-hidden="true">
                  <span className="mid" />
                  {it.pct !== null && it.pct !== 0 && <i className={it.better ? 'better' : 'worse'} style={it.better ? { right: '50%', width: `${w / 2}%` } : { left: '50%', width: `${Math.max(1, w / 2)}%` }} />}
                </span>
              )}
              <span className="etags"><i className={`lv lv-${it.level === '?' ? 'q' : it.level}`}>{it.level}</i><em className={`kind ${it.kind}`}>{KIND_LABEL[it.kind]}</em></span>
            </button>
            {isOpen && (
              <div className="ebody">
                <p>{it.detail}</p>
                {it.method && <p className="emethod">How we estimated this: {it.method}</p>}
                <div className="src">{it.sources.map((s) => <a key={s} href={SOURCES[s]?.url} target="_blank" rel="noreferrer">{SOURCES[s]?.cite ?? s}</a>)}</div>
              </div>
            )}
          </div>
        );
      })}
      <p className="note">These describe groups of people, not a prediction for you. “Link, not proof” means the people who have it also differ in other ways. The letter shows how solid the evidence is for what is written: A firm, B supported, C our own estimate. A link seen only by watching people is never above B, because watching cannot prove cause.</p>
    </div>
  );
}
