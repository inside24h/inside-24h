import { it } from 'vitest';
import { auditItems, auditSingle, AUDIT_PROFILE } from './text-audit';
import { chapterText } from './stories';
import { whereGauge, presentAt } from './video-body';
import { after24Of } from './video-story';
it('ans', () => {
  for (const it of auditItems().filter((i) => ['lentils', 'pizza', 'beer', 'espresso', 'water', 'salmon', 'cola'].includes(i.id))) {
    const b = it.x.built, o = auditSingle(it.x, 'long', 'A', AUDIT_PROFILE, it.vname);
    const day = b.story.chapters.find((c) => /% has left your body so far/.test(chapterText(c as never, c.min)));
    const tg = b.effects.tgMmol; let tm = 0; if (tg) for (let m = 0; m < 1440; m++) if (tg[m] > tg[tm]) tm = m;
    console.log(`ANS ${it.id}: hook=${o.hook.line1} / ${o.hook.line2} payoff=${o.hook.payoff ?? o.hook.payoffMin}\n  day=${day ? chapterText(day as never, day.min) : '-'}\n  where1440=${JSON.stringify(whereGauge(b, 1440))} present=${JSON.stringify(presentAt(b, 1440).map(([k, v]) => [k, v.frac.toFixed(2)]))}\n  tg peak ${tm} ${tg ? tg[tm].toFixed(2) : '-'} after24=${JSON.stringify(after24Of(b, it.x.glucose !== undefined))} hero=${JSON.stringify(o.hero)}`);
  }
}, 600_000);
