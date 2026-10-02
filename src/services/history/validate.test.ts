import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { BUNDLES } from '@/data/history';
import { DEV_FIXTURE } from '@/data/history/__dev__/fixture';

import { errorsOf, validateBundle, type Issue, type ValidateEnv } from './validate';
import { narrationText, type TopicBundle } from './types';

/**
 * (1) Chạy trên MỌI chủ đề thật trong `data/history/*` — đây là cổng chặn nội dung hỏng vào bản dựng.
 * (2) Thử chính bộ kiểm tra bằng dữ liệu mẫu cố ý làm hỏng từng chỗ. Dữ liệu mẫu (`__dev__`) KHÔNG
 *     bao giờ nằm trong phép (1).
 */

const sha256 = (t: string) => createHash('sha256').update(t).digest('hex');
const realEnv: ValidateEnv = { fileExists: (f) => existsSync(join(process.cwd(), 'public', f.replace(/^\//, ''))), sha256 };
const fmt = (xs: Issue[]) => xs.map((i) => `${i.where}: ${i.message}`).join('\n');

for (const bundle of BUNDLES) {
  test(`nội dung thật "${bundle.topic.id}": qua bộ kiểm tra toàn vẹn`, () => {
    const errors = errorsOf(validateBundle(bundle, realEnv));
    assert.equal(errors.length, 0, `\n${fmt(errors)}`);
  });
}

test('chủ đề thật: mã chủ đề / cảnh khớp khoá cố định của hợp đồng', () => {
  const kc = BUNDLES.find((b) => b.topic.id === 'vn-khang-chien-chong-phap');
  assert.ok(kc, 'thiếu chủ đề vn-khang-chien-chong-phap');
  assert.deepEqual(kc.topic.sceneIds, Array.from({ length: 12 }, (_, i) => `s${String(i + 1).padStart(2, '0')}`));
  for (const s of kc.scenes) assert.equal(s.id, kc.topic.sceneIds[s.n - 1], 'n phải khớp thứ tự');
});

const VI_DIACRITIC = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

test('chủ đề thật: liên kết bản đồ trỏ tới địa điểm Du ngoạn có thật, đúng thành phố, lời NPC chỉ tiếng Anh', async () => {
  const { getPoiContent } = await import('@/data/travel/pois');
  for (const b of BUNDLES) {
    for (const link of b.topic.mapLinks) {
      if (!link.poiId) continue;
      const poi = getPoiContent(link.poiId);
      assert.ok(poi, `${link.poiId}: không có trong data/travel/pois.ts`);
      assert.equal(poi.city, link.cityId, `${link.poiId}: thuộc ${poi.city}, không phải ${link.cityId}`);
      if (link.guideLineEn) assert.doesNotMatch(link.guideLineEn, VI_DIACRITIC);
    }
  }
});

/* ---------- thử chính bộ kiểm tra ---------- */

/** Bản sao của dữ liệu mẫu với đường dẫn ảnh/audio ĐÚNG QUY ƯỚC (/history/...) và coi như tệp tồn tại. */
function clean(): TopicBundle {
  const b: TopicBundle = structuredClone(DEV_FIXTURE);
  for (const s of b.scenes) {
    if (s.image) s.image.file = `/history/dev-fixture/images/${s.id}.png`;
    if (s.audio?.en) s.audio.en.file = `/history/dev-fixture/audio/en/${s.id}.mp3`;
    if (s.audio?.vi) s.audio.vi.file = `/history/dev-fixture/audio/vi/${s.id}.mp3`;
  }
  return b;
}
const env: ValidateEnv = { fileExists: () => true, sha256 };
const run = (b: TopicBundle) => errorsOf(validateBundle(b, env));
const has = (errs: Issue[], re: RegExp) => errs.some((e) => re.test(`${e.where} ${e.message}`));

test('bộ kiểm tra: dữ liệu mẫu đã làm sạch không có lỗi', () => {
  assert.equal(run(clean()).length, 0, fmt(run(clean())));
});

test('bộ kiểm tra: mã đoạn trùng bị bắt', () => {
  const b = clean();
  b.scenes[0]!.paragraphs[1]!.id = 's01-p1';
  assert.ok(has(run(b), /mã đoạn trùng/));
});

test('bộ kiểm tra: đoạn thiếu bản Việt hoặc Anh bị bắt', () => {
  const b = clean();
  b.scenes[0]!.paragraphs[0]!.vi = '  ';
  b.scenes[1]!.paragraphs[0]!.en = '';
  const e = run(b);
  assert.ok(has(e, /s01-p1.*tiếng Việt/));
  assert.ok(has(e, /s02-p1.*tiếng Anh/));
});

test('bộ kiểm tra: khẳng định không nguồn / nguồn không URL / claimId mồ côi bị bắt', () => {
  const b = clean();
  b.claims[0]!.sources = [];
  b.sources[1]!.url = '';
  b.scenes[0]!.claimIds.push('c01-99');
  const e = run(b);
  assert.ok(has(e, /c01-1.*không có nguồn/));
  assert.ok(has(e, /src-dev-b.*url/));
  assert.ok(has(e, /claimId không tồn tại: c01-99/));
});

test('bộ kiểm tra: verified cần ≥ 2 nguồn độc lập, single-source đúng 1', () => {
  const b = clean();
  b.claims[0]!.independentSources = 1;
  b.claims[1]!.independentSources = 2;
  const e = run(b);
  assert.ok(has(e, /c01-1.*verified/));
  assert.ok(has(e, /c02-1.*single-source/));
});

test('bộ kiểm tra: evidenceParagraphId phải thuộc chính cảnh', () => {
  const b = clean();
  b.scenes[0]!.questions[0]!.evidenceParagraphId = 's02-p1';
  assert.ok(has(run(b), /evidenceParagraphId/));
});

test('bộ kiểm tra: cảnh published còn imagePending / thiếu tệp thật bị bắt', () => {
  const b = clean();
  b.scenes[0]!.imagePending = true;
  assert.ok(has(run(b), /imagePending/));
  const c = clean();
  const missing: ValidateEnv = { fileExists: (f) => !f.includes('/s02.'), sha256 };
  const e = errorsOf(validateBundle(c, missing));
  assert.ok(has(e, /scene:s02.*không tồn tại/));
});

test('bộ kiểm tra: cảnh published mà có khẳng định disputed/unverified bị chặn', () => {
  const b = clean();
  b.scenes[3]!.status = 'published';
  b.scenes[3]!.imagePending = false;
  b.scenes[3]!.audioPending = false;
  assert.ok(has(run(b), /published nhưng claim c04-1 là disputed/));
});

test('bộ kiểm tra: audio dựng từ văn bản cũ bị phát hiện qua SHA-256', () => {
  const b = clean();
  const sc = b.scenes[0]!;
  b.audio = [{ sceneId: 's01', lang: 'en', file: sc.audio!.en!.file, textSha256: sha256(narrationText(sc, 'en')) }];
  assert.equal(run(b).length, 0);
  sc.paragraphs[0]!.en += ' Edited later.';
  assert.ok(has(run(b), /văn bản KHÁC/));
});

test('bộ kiểm tra: mốc câu phải tăng dần và nằm trong thời lượng', () => {
  const b = clean();
  b.scenes[0]!.audio!.en!.sentences = [
    { start: 0, end: 4, text: 'a', paragraphId: 's01-p1' },
    { start: 3, end: 5, text: 'b' },
  ];
  assert.ok(has(run(b), /không tăng dần/));
  const c = clean();
  c.scenes[0]!.audio!.en!.sentences![2]!.end = 99;
  assert.ok(has(run(c), /vượt durationSec/));
});

test('bộ kiểm tra: chữ ghi công ảnh cố định', () => {
  const b = clean();
  b.scenes[0]!.image!.credit = 'Ảnh tư liệu';
  assert.ok(has(run(b), /image\.credit/));
});

test('bộ kiểm tra: chủ đề draft chỉ cảnh báo về cảnh chưa soạn; published thì lỗi', () => {
  const b = clean();
  b.topic.sceneIds.push('s05');
  b.topic.status = 'draft';
  assert.equal(run(b).length, 0);
  assert.ok(validateBundle(b, env).some((i) => i.level === 'warning' && /s05/.test(i.message)));
  b.topic.status = 'published';
  assert.ok(has(run(b), /thiếu cảnh s05/));
});
