import assert from 'node:assert/strict';
import { test } from 'node:test';

import index from './seed/index.json';

type Entry = { title: string; sourceName: string; licenseType: string; passageTier: string };
const ARTICLES = index as unknown as Entry[];

/**
 * Bất biến thư viện: KHÔNG có bài nào trông như đọc được mà thật ra chỉ là link.
 *
 * Từng có 41 bài kiểu đó — tiêu đề báo lấy qua RSS từ BBC, Guardian, Economist,
 * NPR, ScienceDaily, Phys.org, CDC. Trong lưới thư viện chúng nhìn y hệt bài
 * đọc được, bấm vào mới nhảy sang trang gốc kèm quảng cáo.
 *
 * Không chữa được bằng cách cào toàn văn về: đó là báo có bản quyền, ghi nguồn
 * không phải là giấy phép sao chép (`pipeline.ts` cũng chặn sẵn). Nên cách chữa
 * là không để bài không đọc được nằm trong thư viện.
 *
 * NGOẠI LỆ DUY NHẤT là `official_practice`: link tới đề thi chính thức của
 * Cambridge / College Board / Khan Academy. Nó gắn nhãn "Đề chính thức" nên
 * không ai mong bấm vào là đọc được bài trong app — nó không hứa điều gì sai.
 */
test('mọi bài trong thư viện đều đọc được trong app, trừ link đề chính thức', () => {
  const traps = ARTICLES.filter(
    (a) => a.licenseType === 'headline_only' && a.passageTier !== 'official_practice',
  );

  assert.deepEqual(
    traps.map((a) => `${a.sourceName} — ${a.title}`),
    [],
    'Bài chỉ có tiêu đề đã lọt vào thư viện. Chạy lại ingest KHÔNG kèm --only headlines.',
  );
});

test('link đề chính thức vẫn còn, không xoá nhầm', () => {
  const official = ARTICLES.filter((a) => a.passageTier === 'official_practice');
  assert.ok(official.length > 0, 'Mất hết link đề chính thức');
});

test('bài đọc được chiếm gần hết thư viện', () => {
  // Con số cụ thể sẽ đổi khi ingest thêm; điều cần giữ là tỷ lệ, không phải số.
  const readable = ARTICLES.filter((a) => a.licenseType !== 'headline_only').length;
  assert.ok(
    readable / ARTICLES.length > 0.95,
    `Chỉ ${readable}/${ARTICLES.length} bài đọc được trong app`,
  );
});
