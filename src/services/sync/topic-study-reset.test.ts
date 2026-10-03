import test from 'node:test';
import assert from 'node:assert/strict';

import { mergeTopicStudy, type TopicStudyPayload } from './store-merges';

const base = (over: Partial<TopicStudyPayload>): TopicStudyPayload => ({ stages: {}, scores: {}, starred: {}, lapses: {}, mistakeLog: [], learnSettings: {}, lastAt: {}, reviews: {}, ...over });

test('xoá tiến độ một bộ ở máy A: gộp với máy B (còn bản cũ) KHÔNG làm sống lại', () => {
  const old = base({
    stages: { env: { pollution: 2, climate: 1 }, tech: { robot: 2 } },
    lapses: { env: { pollution: 3 } },
    reviews: { env: { pollution: { box: 3, due: '2026-10-20', last: '2026-10-10' } } },
    lastAt: { env: '2026-10-10T08:00:00.000Z', tech: '2026-10-09T08:00:00.000Z' },
  });
  // máy A: bấm xoá bộ env lúc 10/10 09:00 (lastAt env bị xoá), tech không đổi
  const a = base({ stages: { tech: { robot: 2 } }, lastAt: { tech: '2026-10-09T08:00:00.000Z' }, resets: { env: '2026-10-10T09:00:00.000Z' } });
  const merged = mergeTopicStudy(a, old);
  assert.equal(merged.stages.env, undefined, 'env không sống lại');
  assert.equal(merged.lapses.env, undefined);
  assert.equal(merged.reviews?.env, undefined);
  assert.deepEqual(merged.stages.tech, { robot: 2 }, 'bộ khác không bị đụng');
  assert.equal(merged.resets?.env, '2026-10-10T09:00:00.000Z', 'dấu xoá được giữ để lan sang máy khác');
});

test('học lại sau khi xoá: tiến độ MỚI được giữ, tiến độ cũ vẫn bị bỏ', () => {
  const old = base({ stages: { env: { pollution: 2, climate: 2 } }, lastAt: { env: '2026-10-10T08:00:00.000Z' } });
  const a = base({ stages: { env: { waste: 1 } }, lastAt: { env: '2026-10-11T08:00:00.000Z' }, resets: { env: '2026-10-10T09:00:00.000Z' } });
  const merged = mergeTopicStudy(a, old);
  assert.deepEqual(merged.stages.env, { waste: 1 });
});

test('máy B học bộ đó SAU lúc xoá thì phần của B được giữ (không bị xoá nhầm)', () => {
  const b = base({ stages: { env: { waste: 2 } }, lastAt: { env: '2026-10-12T08:00:00.000Z' } });
  const a = base({ resets: { env: '2026-10-10T09:00:00.000Z' } });
  const merged = mergeTopicStudy(a, b);
  assert.deepEqual(merged.stages.env, { waste: 2 });
});

test('không có dấu xoá: gộp như cũ (hợp, lấy lớn nhất)', () => {
  const a = base({ stages: { env: { x: 1 } }, lastAt: { env: '2026-10-10T08:00:00.000Z' } });
  const b = base({ stages: { env: { x: 2, y: 1 } }, lastAt: { env: '2026-10-11T08:00:00.000Z' } });
  assert.deepEqual(mergeTopicStudy(a, b).stages.env, { x: 2, y: 1 });
});
