import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildPhotoOwners,
  coverSource,
  generatedCover,
  hslToHex,
  photoKey,
  type GeneratedCover,
} from './cover';

type Row = { id: string; topic: string | null; thumbnailUrl: string | null };

/** Kho bài thật, đọc thẳng từ seed — test phải chạy trên đúng dữ liệu người học thấy. */
function seedArticles(): Row[] {
  const raw = readFileSync(new URL('../../data/seed/index.json', import.meta.url), 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  const list = Array.isArray(parsed)
    ? parsed
    : ((parsed as { articles?: unknown[] }).articles ?? []);
  return list as Row[];
}

/* ------------------------------------------------------------ luật chính */

test('KHÔNG TẤM ẢNH NÀO hiện ở hai bài khác nhau, trên cả kho thật', () => {
  /*
    Đây là lời phàn nàn gốc, kiểm trên đúng 1.408 bài. Trước khi sửa: 92 bài
    Wikipedia dùng chung 33 ảnh, và 1.055 bài không ảnh dùng chung 10 ảnh chủ
    đề — màn đầu thư viện có một tấm lặp năm lần.
  */
  const articles = seedArticles();
  assert.ok(articles.length > 1000, 'không đọc được kho bài');
  const owners = buildPhotoOwners(articles);

  const seen = new Map<string, string>();
  for (const a of articles) {
    const src = coverSource(a, owners);
    if (src.kind !== 'photo') continue;
    const key = photoKey(src.uri);
    assert.ok(!seen.has(key), `ảnh ${key} hiện ở cả ${seen.get(key)} lẫn ${a.id}`);
    seen.set(key, a.id);
  }
});

test('ảnh RIÊNG (không ai dùng chung) thì bài vẫn giữ ảnh thật', () => {
  // Cái cần bỏ là sự lặp lại, không phải ảnh thật — ảnh thật vẫn hơn bìa vẽ.
  const articles = seedArticles();
  const owners = buildPhotoOwners(articles);
  const count = new Map<string, number>();
  for (const a of articles) {
    if (a.thumbnailUrl) count.set(photoKey(a.thumbnailUrl), (count.get(photoKey(a.thumbnailUrl)) ?? 0) + 1);
  }
  const unique = articles.filter((a) => a.thumbnailUrl && count.get(photoKey(a.thumbnailUrl)) === 1);
  assert.ok(unique.length > 100, 'kho phải còn nhiều bài có ảnh riêng');
  for (const a of unique) {
    assert.equal(coverSource(a, owners).kind, 'photo', `${a.id} có ảnh riêng mà bị đổi sang bìa vẽ`);
  }
});

test('ảnh dùng chung: bài ĐẦU TIÊN giữ, các bài sau chuyển sang bìa vẽ', () => {
  const list: Row[] = [
    { id: 'a', topic: 'science', thumbnailUrl: 'https://x.org/img/cell.jpg' },
    { id: 'b', topic: 'science', thumbnailUrl: 'https://x.org/img/cell.jpg' },
    { id: 'c', topic: 'science', thumbnailUrl: 'https://x.org/img/cell.jpg?utm_source=api' },
  ];
  const owners = buildPhotoOwners(list);
  assert.equal(coverSource(list[0]!, owners).kind, 'photo');
  assert.equal(coverSource(list[1]!, owners).kind, 'generated');
  assert.equal(coverSource(list[2]!, owners).kind, 'generated', 'đuôi utm không được làm nó thành ảnh "khác"');
});

test('bài không có trong kho (người dùng tự thêm) vẫn giữ ảnh của nó', () => {
  const owners = buildPhotoOwners([]);
  const src = coverSource({ id: 'u1', topic: null, thumbnailUrl: 'https://y.org/p.png' }, owners);
  assert.equal(src.kind, 'photo');
});

/* ------------------------------------------------------- khoá so trùng */

test('bản gốc và bản thu nhỏ Wikimedia của CÙNG một tấm cho cùng một khoá', () => {
  const original =
    'https://upload.wikimedia.org/wikipedia/commons/9/9e/Greek_uc_psi_icon.svg?utm_source=en.wikipedia.org';
  const thumb =
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Greek_uc_psi_icon.svg/960px-Greek_uc_psi_icon.svg.png';
  assert.equal(photoKey(original), photoKey(thumb));
});

test('hai tấm khác tên thì khác khoá, dù cùng thư mục', () => {
  assert.notEqual(
    photoKey('https://upload.wikimedia.org/wikipedia/commons/1/15/PurkinjeCell.jpg'),
    photoKey('https://upload.wikimedia.org/wikipedia/commons/1/15/PurkinjeCell2.jpg'),
  );
});

test('địa chỉ mã hoá hỏng không làm nổ', () => {
  assert.doesNotThrow(() => photoKey('https://x.org/%E0%A4%A.jpg'));
});

/* ------------------------------------------------------------- bìa vẽ */

test('cùng một bài luôn ra cùng một bìa — mở lại không đổi', () => {
  const a = generatedCover({ id: 'art-42', topic: 'history' });
  const b = generatedCover({ id: 'art-42', topic: 'history' });
  assert.deepEqual(a, b);
});

test('bài cùng chủ đề ra bìa KHÁC NHAU — đây là chỗ lặp lớn nhất trước khi sửa', () => {
  /*
    Văn học có 315 bài không ảnh, trước đây tất cả hiện CÙNG MỘT ô. Kiểm trên
    đúng từng chủ đề của kho thật: gần như mọi bìa trong một chủ đề phải khác
    nhau về tổ hợp màu + hoạ tiết + hướng.
  */
  const byTopic = new Map<string, GeneratedCover[]>();
  for (const a of seedArticles()) {
    if (a.thumbnailUrl) continue;
    const c = generatedCover(a);
    const list = byTopic.get(c.topic) ?? [];
    list.push(c);
    byTopic.set(c.topic, list);
  }
  for (const [topic, covers] of byTopic) {
    const distinct = new Set(covers.map((c) => `${c.from}|${c.to}|${c.pattern}|${c.angle}`)).size;
    assert.ok(
      distinct / covers.length >= 0.97,
      `chủ đề ${topic}: ${distinct}/${covers.length} bìa khác nhau — còn lặp`,
    );
  }
});

test('bìa vẽ ở lại trong vùng màu của chủ đề — không để bài khoa học trông như bài môi trường', () => {
  const hueOf = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    if (d === 0) return 0;
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
    return (h + 360) % 360;
  };
  const dist = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
  for (let i = 0; i < 200; i += 1) {
    const c = generatedCover({ id: `x${i}`, topic: 'environment' });
    assert.ok(dist(hueOf(c.from), 145) <= 22, `đầu dải lệch khỏi vùng môi trường: ${c.from}`);
  }
});

test('mọi màu đều là #rrggbb hợp lệ', () => {
  for (let i = 0; i < 300; i += 1) {
    const c = generatedCover({ id: `id-${i}`, topic: i % 3 === 0 ? null : 'culture' });
    assert.match(c.from, /^#[0-9a-f]{6}$/);
    assert.match(c.to, /^#[0-9a-f]{6}$/);
  }
});

test('chủ đề lạ (không có trong bảng) vẫn ra bìa, không nổ', () => {
  const c = generatedCover({ id: 'q', topic: 'astrology' });
  assert.equal(c.kind, 'generated');
  assert.match(c.from, /^#[0-9a-f]{6}$/);
});

test('đổi HSL → hex đúng ở ba điểm neo', () => {
  assert.equal(hslToHex(0, 100, 50), '#ff0000');
  assert.equal(hslToHex(120, 100, 50), '#00ff00');
  assert.equal(hslToHex(240, 100, 50), '#0000ff');
});
