import { it } from 'vitest';
import { auditItems } from './text-audit';
import { chapterText } from './stories';
it('ch', () => { for (const it of auditItems().filter((i) => ['beer', 'latte'].includes(i.id))) for (const c of it.x.built.story.chapters) if (/gone|bed/i.test(c.title)) console.log('CH', it.id, c.title, chapterText(c as never, c.min)); }, 600_000);
