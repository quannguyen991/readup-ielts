import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SHOP_ITEMS, balanceOf, buy, findItem, formatStars, mergeReward, spendIdeas, starBalance, type RewardPayload } from './shop';
import { ITEMS } from '@/services/game/rules';
import { MASCOTS } from '@/services/game/mascots';
import { HERO_SKINS } from '@/components/game/sprites';

const empty = { owned: {}, spent: 0 };

test('không đủ sao thì không đổi được, và không trừ gì', () => {
  const r = buy(empty, 'avatar-dragon', 10);
  assert.deepEqual(r, { ok: false, reason: 'không-đủ-sao' });
});

test('đổi avatar một lần, lần hai bị chặn', () => {
  const first = buy(empty, 'avatar-owl', 500);
  assert.ok(first.ok && first.spent === 100 && first.owned['avatar-owl'] === 1);
  const again = buy({ owned: first.ok ? first.owned : {}, spent: 100 }, 'avatar-owl', 500);
  assert.deepEqual(again, { ok: false, reason: 'đã-sở-hữu' });
});

test('thẻ giữ chuỗi và vé gói đổi được nhiều lần', () => {
  const one = buy(empty, 'freeze-1', 500);
  assert.ok(one.ok);
  const two = buy({ owned: one.ok ? one.owned : {}, spent: 50 }, 'freeze-1', 450);
  assert.ok(two.ok && two.owned['freeze-1'] === 2 && two.spent === 100);
  const pass = buy(empty, 'pass-pro-7', 5000);
  assert.ok(pass.ok);
  assert.ok(buy({ owned: pass.ok ? pass.owned : {}, spent: 1400 }, 'pass-pro-7', 3600).ok);
});

test('số sao: học + thưởng − đã đổi, không bao giờ âm', () => {
  assert.equal(balanceOf(120, 200), 0);
  assert.equal(balanceOf(300, 120), 180);
  assert.equal(starBalance(300, 40, 120), 220);
  assert.equal(starBalance(10, 0, 500), 0);
  assert.equal(formatStars(1234), (1234).toLocaleString('vi-VN'));
  assert.equal(formatStars(12345), '12,3k');
});

test('danh mục hợp lệ: mỗi loại mang đúng dữ liệu của nó', () => {
  const ids = new Set<string>();
  for (const item of SHOP_ITEMS) {
    assert.ok(!ids.has(item.id), `trùng mã ${item.id}`);
    ids.add(item.id);
    assert.ok(item.price > 0);
    if (item.kind === 'powerup') assert.ok(item.grants && item.grants in ITEMS, `${item.id} trao thứ lạ`);
    else assert.equal(item.grants, undefined, `${item.id} không phải đồ chiến đấu mà lại trao vật phẩm`);
    if (item.kind === 'plan') {
      assert.ok(item.plan && ['plus', 'pro'].includes(item.plan.id) && item.plan.days > 0 && item.plan.days <= 30, `${item.id}: vé phải có hạn`);
      assert.ok(item.repeatable);
    }
    if (item.kind === 'mascot') assert.ok(item.mascot && item.mascot in MASCOTS);
    if (item.kind === 'skin') assert.ok(item.skin && item.skin in HERO_SKINS && item.skin !== 'knight');
    if (item.kind === 'avatarAnim') assert.ok(item.avatarLook);
    if (item.kind === 'cover') assert.ok(item.cover);
  }
  // Vẫn không bán nội dung lẻ.
  assert.equal(findItem('bai-doc-vip'), undefined);
  assert.equal(findItem(null), undefined);
});

test('vé Pro đắt hơn vé Plus, và không ai đổi nổi vé Pro trong một ngày học tối đa', () => {
  const plus = findItem('pass-plus-7')!;
  const pro = findItem('pass-pro-7')!;
  assert.ok(pro.price > plus.price);
  assert.ok(pro.price > 60 * 3, 'trần 60 điểm/ngày: vé Pro phải cần nhiều ngày học');
});

test('gộp hai máy: không để số dư phình, đồ đeo theo máy đổi sau', () => {
  const a: RewardPayload = { owned: { 'skin-ninja': 1, 'freeze-1': 2 }, spent: 500, frozenDays: ['2026-09-01'], avatar: 'anim-star', cover: null, skin: 'skin-ninja', mascot: null, wornAt: '2026-09-20T10:00:00Z' };
  const b: RewardPayload = { owned: { 'freeze-1': 3, 'mascot-owl': 1 }, spent: 700, frozenDays: ['2026-09-05'], avatar: null, cover: 'cover-stars', skin: null, mascot: 'mascot-owl', wornAt: '2026-09-22T10:00:00Z' };
  const m = mergeReward(a, b)!;
  assert.deepEqual(m.owned, { 'freeze-1': 3, 'mascot-owl': 1, 'skin-ninja': 1 });
  assert.equal(m.spent, 700);
  assert.deepEqual(m.frozenDays, ['2026-09-01', '2026-09-05']);
  assert.equal(m.cover, 'cover-stars');
  assert.equal(m.mascot, 'mascot-owl');
  assert.equal(mergeReward(null, b), b);
});

test('gộp hai máy: thưởng hạng tháng chỉ tính một lần mỗi tháng', () => {
  const base = { owned: {}, spent: 0, frozenDays: [], avatar: null, cover: null, skin: null, mascot: null, wornAt: '' };
  const m = mergeReward({ ...base, prizes: { '2026-08': 300 } }, { ...base, prizes: { '2026-08': 300, '2026-07': 50 } })!;
  assert.deepEqual(m.prizes, { '2026-08': 300, '2026-07': 50 });
});

// ---------------------------------------------------------------- nền học + lưu đồ đang đeo (30/09/2026)

test('mỗi món Nền học có mẫu vẽ, giá dương, chỉ mua một lần', async () => {
  const { STUDY_BACKGROUNDS } = await import('@/components/layout/study-backgrounds');
  const bgs = SHOP_ITEMS.filter((i) => i.kind === 'studyBg');
  assert.ok(bgs.length >= 12);
  for (const i of bgs) {
    assert.ok(i.studyBg && STUDY_BACKGROUNDS[i.studyBg], `${i.id} thiếu mẫu vẽ`);
    assert.ok(i.price > 0 && !i.repeatable);
  }
});

test('gộp hai máy giữ nguyên giao diện và nền học đang dùng', () => {
  const base = { owned: {}, spent: 0, avatar: null, cover: null, skin: null, mascot: null, frozenDays: [] };
  const local = { ...base, theme: 'theme-ocean', studyBg: 'bg-mint', wornAt: '2026-09-30T10:00:00Z' };
  const remote = { ...base, theme: null, studyBg: null, wornAt: '2026-09-29T10:00:00Z' };
  const m = mergeReward(local, remote)!;
  assert.equal(m.theme, 'theme-ocean');
  assert.equal(m.studyBg, 'bg-mint');
});

test('dữ liệu đồng bộ phần thưởng mang ĐỦ mọi ô đang đeo (lỗi cũ: quên theme)', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const src = fs.readFileSync(path.join(__dirname, '../../store/useRewardStore.ts'), 'utf8');
  const slots = [...(src.match(/export type WearSlot = ([^;]+);/)?.[1] ?? '').matchAll(/'(\w+)'/g)].map((m) => m[1]!);
  assert.ok(slots.includes('theme') && slots.includes('studyBg'));
  const body = src.slice(src.indexOf('export function rewardPayload'));
  for (const slot of slots) assert.match(body, new RegExp(`\\b${slot}:`), `rewardPayload thiếu ${slot}`);
});

test('F5 khi đã đăng nhập: payload cũ trên máy chủ THIẾU trường theme không xoá giao diện đang dùng', () => {
  const base = { owned: { 'theme-sakura': 1 }, spent: 280, avatar: null, cover: null, skin: null, mascot: null, frozenDays: [] };
  // Máy này vừa áp dụng Vườn hoa anh đào; bản trên máy chủ do app cũ gửi, không có trường theme.
  const local: RewardPayload = { ...base, theme: 'theme-sakura', wornAt: '2026-09-30T10:00:00Z' };
  const oldRemote = { ...base, wornAt: '2026-09-30T10:00:00Z' } as RewardPayload;
  assert.equal(mergeReward(local, oldRemote)!.theme, 'theme-sakura');
  // Bản trên máy chủ MỚI HƠN nhưng vẫn thiếu trường (máy khác chạy app cũ): vẫn giữ.
  const newerOld = { ...base, wornAt: '2026-09-30T11:00:00Z' } as RewardPayload;
  assert.equal(mergeReward(local, newerOld)!.theme, 'theme-sakura');
  // Bỏ đeo thật (null) ở máy mới hơn thì phải bỏ.
  const removed: RewardPayload = { ...base, theme: null, wornAt: '2026-09-30T12:00:00Z' };
  assert.equal(mergeReward(local, removed)!.theme, null);
});

test('gợi ý đổi sao: chỉ món đổi được ngay, mỗi loại một món, kèm đích gần nhất', () => {
  const { now, next } = spendIdeas(200, {});
  assert.ok(now.length > 0 && now.length <= 3);
  assert.ok(now.every((i) => i.price <= 200 && !['plan', 'powerup', 'freeze'].includes(i.kind)));
  assert.equal(new Set(now.map((i) => i.kind)).size, now.length);
  assert.ok(next && next.price > 200);
  const none = spendIdeas(0, {});
  assert.equal(none.now.length, 0);
  // Món đã có thì không gợi ý lại.
  const owned = Object.fromEntries(now.map((i) => [i.id, 1]));
  assert.ok(spendIdeas(200, owned).now.every((i) => !owned[i.id]));
});
