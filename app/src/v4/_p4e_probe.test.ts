import { it } from 'vitest';
import { AUDIT_CUTS, AUDIT_PROFILE, auditItems, auditSingle } from './text-audit';
import { filmSingle } from './video-camera.test';
import { perceivedStay, regionMaxS, topicRegion } from './video-cam';
import { sweep } from './sweep.testutil';

it('probe', () => {
  const items = sweep(auditItems(), 8);
  const rows: string[] = []; let n = 0, over = 0; const byReg = new Map<string, number>();
  for (const it of items) for (const cut of AUDIT_CUTS) {
    const o = auditSingle(it.x, cut, 'A', AUDIT_PROFILE, it.vname), plan = o.plan, ch = it.x.built.story.chapters;
    const f = filmSingle(it, cut), cam = new Map(f.regions!.map((r) => [r.t.toFixed(3), r.r]));
    const seq = plan.frames.filter((fr) => fr.phase === 'main').map((fr) => ({ t: fr.t, rs: [topicRegion(fr, ch), cam.get(fr.t.toFixed(3)) ?? ''] }));
    const st = perceivedStay(seq), cap = regionMaxS(plan.seconds); n++;
    if (st.s > cap + 0.05) { over++; byReg.set(`${cut}:${st.r}`, (byReg.get(`${cut}:${st.r}`) ?? 0) + 1); rows.push(`${it.id} ${cut} ${st.s.toFixed(1)}>${cap} ${st.r}@${st.at.toFixed(1)}`); }
  }
  console.log(`PROBE ${over}/${n} over`, JSON.stringify([...byReg]), '\n' + rows.slice(0, 60).join('\n'));
}, 900_000);
