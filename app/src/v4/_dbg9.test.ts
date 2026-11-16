import { it } from 'vitest';
import { parseMeal } from './food/parse';
import { analyze } from './analyze';
import { DEFAULT_PROFILE } from '../science/profile';
import { chapterText } from './stories';
import { hookFor } from './video-hook';
it.skip('dbg', () => {
  for (const q of ['espresso', 'diet cola', 'butter']) {
    const x = analyze(parseMeal(q), { ...DEFAULT_PROFILE, drinkAtMin: 1320 });
    const st = x.built.story;
    const h = hookFor({ name: x.label, chapters: st.chapters.map((c) => ({ min: c.min, title: c.title, text: chapterText(c, c.min) })), alcohol: false, caffeine: x.built.caffeine.doseMg >= 10, kcal: x.built.energy.total, caffeineMg: x.built.caffeine.doseMg });
    console.log(q, JSON.stringify(h), x.built.caffeine.doseMg);
    if (q === 'butter') console.log(st.chapters.map((c) => `${c.min} ${c.title}: ${chapterText(c, c.min)}`).join('\n'));
  }
});
