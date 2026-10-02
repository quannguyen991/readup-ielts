import test from 'node:test';
import assert from 'node:assert/strict';

import { DEV_FIXTURE } from './__dev__/fixture';
import { BUNDLES, hasHistoryGuide, historyGuidesForPoi, historyHref, listTopics } from './index';

test('đăng ký: chủ đề thật chưa có cảnh xuất bản thì không hiện ở danh sách người dùng', () => {
  for (const b of listTopics()) assert.ok(b.scenes.some((s) => s.status === 'published'));
});

test('liên kết bản đồ: địa điểm không có cảnh qua cổng thì không có điểm hướng dẫn', () => {
  for (const b of BUNDLES) {
    for (const link of b.topic.mapLinks) {
      if (!link.poiId) continue;
      const guides = historyGuidesForPoi(link.poiId).filter((g) => !g.dev);
      const published = link.sceneIds.some((id) => b.scenes.find((s) => s.id === id)?.status === 'published');
      if (!published) assert.equal(guides.length, 0, `${link.poiId} lộ điểm hướng dẫn khi chưa có cảnh xuất bản`);
    }
  }
  assert.equal(hasHistoryGuide('hanoi-pho'), false);
});

test('liên kết bản đồ: Hà Nội không ngụ ý Việt Bắc / Điện Biên Phủ nằm trong Hà Nội', () => {
  const kc = BUNDLES.find((b) => b.topic.id === 'vn-khang-chien-chong-phap')!;
  const local = new Set(['s02', 's04', 's05', 's12']);
  for (const link of kc.topic.mapLinks.filter((l) => l.cityId === 'hanoi')) {
    if (link.sceneIds.every((id) => local.has(id))) assert.ok(!link.otherPlaces, `${link.poiId}: cảnh ở Hà Nội không được gắn nhãn "nơi khác"`);
    else {
      assert.equal(link.otherPlaces, true, `${link.poiId}: có cảnh ngoài Hà Nội phải gắn otherPlaces`);
      assert.ok(link.sceneIds.every((id) => !local.has(id)), `${link.poiId}: không trộn cảnh Hà Nội với cảnh nơi khác`);
      assert.match(link.label?.vi ?? '', /Những địa điểm khác ở Việt Nam/);
    }
  }
  const byCity = (c: string) => kc.topic.mapLinks.filter((l) => l.cityId === c).flatMap((l) => l.sceneIds);
  assert.deepEqual(byCity('danang'), ['s01']);
  assert.deepEqual(byCity('hochiminh'), ['s03']);
  assert.deepEqual([...byCity('hanoi')].sort(), ['s02', 's04', 's05', 's06', 's07', 's08', 's09', 's10', 's11', 's12']);
});

test('href', () => {
  assert.equal(historyHref('t', 's03'), '/history/t?scene=s03');
  assert.equal(historyHref('t', 's03', true), '/history/t?scene=s03&dev=1');
  assert.equal(historyHref('t'), '/history/t');
});

test('điểm hướng dẫn: chỉ gồm cảnh qua cổng, mang cờ otherPlaces, bỏ cảnh bị chặn', () => {
  const tmp = structuredClone(DEV_FIXTURE);
  tmp.topic.id = 'tmp-guide-test';
  tmp.topic.mapLinks = [
    { cityId: 'hanoi', poiId: 'hanoi-vanmieu', sceneIds: ['s01', 's04'], guideLineEn: 'Hello.' },
    { cityId: 'hanoi', poiId: 'hanoi-motcot', sceneIds: ['s03'], otherPlaces: true },
  ];
  BUNDLES.push(tmp);
  try {
    const a = historyGuidesForPoi('hanoi-vanmieu').filter((g) => g.topicId === tmp.topic.id);
    assert.equal(a.length, 1);
    assert.deepEqual(a[0]!.sceneIds, ['s01'], 's04 bị cổng chặn nên không lộ ra bản đồ');
    assert.equal(a[0]!.otherPlaces, false);
    const b = historyGuidesForPoi('hanoi-motcot').filter((g) => g.topicId === tmp.topic.id);
    assert.equal(b[0]!.otherPlaces, true);
    assert.ok(hasHistoryGuide('hanoi-motcot'));
    tmp.scenes[0]!.status = 'draft';
    assert.equal(historyGuidesForPoi('hanoi-vanmieu').filter((g) => g.topicId === tmp.topic.id).length, 0, 'hết cảnh qua cổng thì không còn điểm hướng dẫn');
  } finally {
    BUNDLES.splice(BUNDLES.indexOf(tmp), 1);
  }
});
