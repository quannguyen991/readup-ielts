import test from 'node:test';
import assert from 'node:assert/strict';

import { PLANS, PLAN_ORDER, TRIAL_AI_PLAN, TRIAL_DAYS, formatVnd } from '@/lib/billing/plans';
import { buildContact } from '@/lib/contact';
import { BOOK_TOTALS } from '@/services/books/catalog';
import { ACTIVATION_SLA_HOURS, REFUND_WINDOW_DAYS } from '@/services/payment/refund';

import { buildLegalDoc, type LegalContext, type LegalDoc, type LegalDocId } from './index';

const IDS: LegalDocId[] = ['terms', 'privacy', 'refund'];
const BARE: LegalContext = { contact: buildContact({}), trackers: [] };
const FULL: LegalContext = {
  contact: buildContact({ supportEmail: 'hotro@readup.vn', supportZalo: '0912345678', sellerName: 'Nguyễn Văn A' }),
  trackers: ['Meta Pixel', 'Google Analytics'],
};

function allText(doc: LegalDoc): string {
  const parts = [doc.title, doc.lead];
  for (const s of doc.sections) {
    parts.push(s.heading);
    for (const b of s.blocks) parts.push(...(b.kind === 'list' ? b.items : [b.text]));
  }
  return parts.join('\n');
}

test('cả ba trang: có mục, mã mục không trùng, không chữ rỗng, không lọt "undefined"', () => {
  for (const ctx of [BARE, FULL]) {
    for (const id of IDS) {
      const doc = buildLegalDoc(id, ctx);
      assert.ok(doc.sections.length >= 3, id);
      assert.equal(new Set(doc.sections.map((s) => s.id)).size, doc.sections.length, id);
      assert.doesNotMatch(allText(doc), /undefined|null|NaN|\$\{/, id);
      for (const s of doc.sections) {
        for (const b of s.blocks) {
          const texts = b.kind === 'list' ? b.items : [b.text];
          assert.ok(texts.length > 0 && texts.every((t) => t.trim().length > 0), `${id}/${s.id}`);
        }
      }
    }
  }
});

test('Điều khoản in đúng giá của mọi gói trả phí, lấy từ bảng giá thật', () => {
  const text = allText(buildLegalDoc('terms', BARE));
  for (const id of PLAN_ORDER) {
    const plan = PLANS[id];
    if (plan.monthlyVnd === 0) continue;
    assert.ok(text.includes(formatVnd(plan.monthlyVnd)), `${id} tháng`);
    assert.ok(text.includes(formatVnd(plan.yearlyVnd)), `${id} năm`);
  }
  assert.ok(text.includes(`học thử ${TRIAL_DAYS} ngày`), 'số ngày học thử');
  assert.ok(text.includes('Plus hoặc Pro'), 'hai gói được thử');
  assert.ok(text.includes(`${PLANS[TRIAL_AI_PLAN].quotas.ai_calls_per_month} lượt`), 'lượt AI khi học thử');
  assert.ok(text.includes(`${BOOK_TOTALS.count} cuốn`), 'số sách');
});

test('Hoàn tiền nói đúng hạn đổi ý, hạn bật gói, và luật "đã tải sách thì không hoàn"', () => {
  const text = allText(buildLegalDoc('refund', BARE));
  assert.ok(text.includes(`${REFUND_WINDOW_DAYS} ngày`));
  assert.ok(text.includes(`${ACTIVATION_SLA_HOURS} giờ`));
  assert.match(text, /đã tải ít nhất một cuốn/);
});

test('chưa bật công cụ đo lường thì trang quyền riêng tư KHÔNG nhắc Meta hay Google Analytics', () => {
  const text = allText(buildLegalDoc('privacy', BARE));
  assert.doesNotMatch(text, /Meta|Google Analytics|Cài đặt cookie/);
  assert.match(text, /không dùng cookie quảng cáo/);
});

test('đã bật thì nêu tên từng công cụ, và nói rõ bấm Từ chối là không tải', () => {
  const text = allText(buildLegalDoc('privacy', FULL));
  assert.match(text, /Meta Pixel và Google Analytics/);
  assert.match(text, /Từ chối/);
});

test('kênh liên hệ đã khai thì hiện trong cả ba trang; chưa khai thì chỉ sang trang Liên hệ', () => {
  for (const id of IDS) {
    assert.match(allText(buildLegalDoc(id, FULL)), /Zalo 0912 345 678 hoặc email hotro@readup\.vn/, id);
    assert.match(allText(buildLegalDoc(id, BARE)), /trang Liên hệ/, id);
  }
});

test('tên bên vận hành chỉ xuất hiện khi đã khai — không bịa ra một pháp nhân', () => {
  assert.match(allText(buildLegalDoc('terms', FULL)), /do Nguyễn Văn A vận hành/);
  assert.doesNotMatch(allText(buildLegalDoc('terms', BARE)), /vận hành \(/);
});
