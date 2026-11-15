import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getStaticDeck } from './study-decks';
import { OXFORD_TOPIC_DECKS } from './oxford-topics-decks';
import { GLOBAL_SUCCESS_DECKS } from './vocab-topics';
import { DESTINATION_DECKS } from './destination-vocab';

/** Chế độ "Nghĩa hiển thị: Tiếng Anh" cần định nghĩa Anh cho mọi từ trong các bộ tiếng Anh. */
test('mọi từ trong bộ Oxford / Global Success / Du học có định nghĩa Anh, không lẫn tiếng Việt', () => {
  const slugs = [...OXFORD_TOPIC_DECKS, ...GLOBAL_SUCCESS_DECKS, ...(DESTINATION_DECKS as { slug: string }[])].map((d) => d.slug);
  let total = 0;
  const missing: string[] = [];
  for (const slug of slugs) {
    for (const w of getStaticDeck(slug)?.words ?? []) {
      if (!w.word?.trim()) continue;
      total += 1;
      const d = w.definitionEn?.trim() ?? '';
      if (!d) missing.push(`${slug}:${w.word}`);
      else assert.doesNotMatch(d, /[ăâđêôơưạảấầẩậắằặẹẻếềểệịọỏốồổộớờởợụủứừửựỳỵỷỹ]/i, `${slug}:${w.word}`);
    }
  }
  assert.ok(total > 7000, `chỉ có ${total} từ`);
  assert.deepEqual(missing.slice(0, 10), []);
});
