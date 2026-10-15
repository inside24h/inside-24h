import { SOURCES } from '../content/sources';
import { LEVEL_LABEL, type Claim } from '../content/types';

export function ClaimRow({ claim }: { claim: Claim }) {
  return (
    <li className="claim">
      <span className={`lvl lvl-${claim.level === '?' ? 'q' : claim.level}`} title={LEVEL_LABEL[claim.level]}>{claim.level}</span>
      <div>
        <p>{claim.text}</p>
        {claim.method && <details><summary>How we estimated this</summary><p>{claim.method}</p></details>}
        <div className="src">
          {claim.sources.map((s) => <a key={s} href={SOURCES[s].url} target="_blank" rel="noreferrer">{SOURCES[s].cite}</a>)}
          {!claim.verified && <span className="pending">source pending</span>}
        </div>
      </div>
    </li>
  );
}
