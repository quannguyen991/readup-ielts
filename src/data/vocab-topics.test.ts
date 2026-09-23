import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BAND_ORDER, VOCAB_TOPICS, groupByBand, type VocabTopicWord } from './vocab-topics';

/**
 * Kho từ vựng do AI soạn, nên nó phải bị soi như mọi thứ AI soạn.
 *
 * Bộ sinh (`scripts/generate-vocab-topics.ts`) đã kiểm từng bộ ngay lúc sinh,
 * nhưng kiểm ở đó chỉ chặn được bộ MỚI. Test này chặn cả những thứ lọt vào từ
 * trước: một lần sửa tay, một lần gộp nhầm file, hay một chủ đề bị ghi đè.
 *
 * Dữ liệu này đi thẳng vào bundle rồi tới người học — sai một phiên âm thì họ
 * học sai cách đọc và không có gì báo cho họ biết.
 */

const EXPECTED_TOPICS = 50;
const WORDS_PER_TOPIC = 50;

test('đủ 50 chủ đề, mỗi chủ đề đúng 50 từ', () => {
  assert.equal(
    VOCAB_TOPICS.length,
    EXPECTED_TOPICS,
    `Có ${VOCAB_TOPICS.length} chủ đề. Chạy \`npm run vocab:topics\` để sinh nốt phần thiếu.`,
  );
  for (const topic of VOCAB_TOPICS) {
    assert.equal(topic.words.length, WORDS_PER_TOPIC, `Chủ đề "${topic.slug}" thiếu từ.`);
  }
});

test('mỗi chủ đề có đủ tên tiếng Anh, tiếng Việt và mô tả', () => {
  for (const topic of VOCAB_TOPICS) {
    assert.ok(topic.slug.trim(), 'thiếu slug');
    assert.ok(topic.name.trim(), `Chủ đề "${topic.slug}" thiếu tên tiếng Anh.`);
    assert.ok(topic.nameVi.trim(), `Chủ đề "${topic.slug}" thiếu tên tiếng Việt.`);
    assert.ok(topic.blurb.trim().length > 8, `Chủ đề "${topic.slug}" mô tả quá ngắn.`);
  }
});

test('slug không trùng nhau', () => {
  const slugs = new Set(VOCAB_TOPICS.map((t) => t.slug));
  assert.equal(slugs.size, VOCAB_TOPICS.length, 'có slug chủ đề trùng nhau');
});

test('không có từ nào lặp lại TRONG cùng một chủ đề', () => {
  for (const topic of VOCAB_TOPICS) {
    const seen = new Set<string>();
    for (const w of topic.words) {
      const key = w.word.trim().toLowerCase();
      assert.ok(!seen.has(key), `"${key}" xuất hiện hai lần trong chủ đề ${topic.slug}`);
      seen.add(key);
    }
  }
});

test('các chủ đề vẫn phân biệt được với nhau', () => {
  /*
    Trùng GIỮA các chủ đề là ĐÚNG, không phải lỗi.

    "sustainable" thật sự thuộc cả environment, transport, tourism, food,
    animals và energy; ép mỗi từ chỉ nằm một chỗ là làm nghèo năm bộ còn lại
    để giữ một quy tắc không phục vụ ai. Bộ từ theo chủ đề tồn tại để người học
    ôn TRỌN một chủ đề, chứ không phải để đếm tổng cho tròn.

    Nhưng nếu chồng lấn quá nhiều thì các chủ đề thôi phân biệt được — lúc đó
    mở bộ nào cũng gặp cùng một danh sách. Trần 25% bắt đúng chuyện đó.
  */
  const owner = new Map<string, number>();
  for (const topic of VOCAB_TOPICS) {
    for (const w of topic.words) {
      const key = w.word.trim().toLowerCase();
      owner.set(key, (owner.get(key) ?? 0) + 1);
    }
  }
  const total = VOCAB_TOPICS.reduce((sum, t) => sum + t.words.length, 0);
  const repeated = [...owner.values()].filter((n) => n > 1).length;
  const ratio = total ? repeated / total : 0;
  assert.ok(
    ratio < 0.25,
    `${(ratio * 100).toFixed(1)}% số từ nằm ở nhiều chủ đề — các bộ đang giống nhau quá.`,
  );
});

test('mọi từ đều đủ trường, không có trường rỗng', () => {
  const fields: Array<keyof VocabTopicWord> = [
    'word',
    'pos',
    'ipa',
    'meaningVi',
    'definitionEn',
    'example',
    'collocation',
    'band',
  ];
  for (const topic of VOCAB_TOPICS) {
    for (const w of topic.words) {
      for (const field of fields) {
        assert.ok(
          String(w[field] ?? '').trim() !== '',
          `"${w.word}" (${topic.slug}) thiếu ${String(field)}`,
        );
      }
    }
  }
});

test('CÂU VÍ DỤ PHẢI CHỨA CHÍNH TỪ ĐANG DẠY', () => {
  /*
    Đây là luật quan trọng nhất của cả bộ test, và là kiểu ẩu hay gặp nhất của
    model: nó viết một câu đúng chủ đề nhưng không có từ cần học trong đó, và
    người học đọc xong vẫn không biết dùng từ ấy thế nào.

    So bằng bốn ký tự đầu: "sustain" xuất hiện dưới dạng "sustainable" hay
    "sustainability" đều hợp lệ, mà so nguyên văn thì trượt hết.
  */
  const bad: string[] = [];
  for (const topic of VOCAB_TOPICS) {
    for (const w of topic.words) {
      const stem = w.word.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4);
      if (stem.length < 4) continue;
      const example = w.example.toLowerCase().replace(/[^a-z ]/g, '');
      if (!example.includes(stem)) bad.push(`${topic.slug}/${w.word}`);
    }
  }
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} ví dụ không chứa từ của nó`);
});

test('phiên âm nằm trong hai dấu gạch chéo', () => {
  const bad: string[] = [];
  for (const topic of VOCAB_TOPICS) {
    for (const w of topic.words) {
      if (!/^\/.+\/$/.test(w.ipa.trim())) bad.push(`${topic.slug}/${w.word}: ${w.ipa}`);
    }
  }
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} phiên âm sai khuôn`);
});

test('nghĩa tiếng Việt không phải là bản chép lại định nghĩa tiếng Anh', () => {
  // Model đôi khi lười, để nguyên tiếng Anh ở ô nghĩa tiếng Việt.
  const bad: string[] = [];
  for (const topic of VOCAB_TOPICS) {
    for (const w of topic.words) {
      if (w.meaningVi.trim().toLowerCase() === w.definitionEn.trim().toLowerCase()) {
        bad.push(`${topic.slug}/${w.word}`);
      }
    }
  }
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} mục để nguyên tiếng Anh ở ô nghĩa`);
});

test('collocation có chứa chính từ đó', () => {
  /*
    Chuẩn hoá HAI VẾ GIỐNG HỆT NHAU.

    Bản đầu của test này bỏ hẳn ký tự không phải chữ ở vế từ ("eco-friendly" →
    "ecofriendly") nhưng đổi chúng thành khoảng trắng ở vế collocation
    ("eco-friendly packaging" → "eco friendly packaging"), rồi báo lỗi cho chín
    mục hoàn toàn đúng. Lỗi nằm ở phép so, không nằm ở dữ liệu — và đó là kiểu
    test tệ nhất: nó khiến người ta đi sửa thứ vốn không hỏng.
  */
  const strip = (t: string) => t.toLowerCase().replace(/[^a-z]/g, '');
  const bad: string[] = [];
  for (const topic of VOCAB_TOPICS) {
    for (const w of topic.words) {
      const stem = strip(w.word).slice(0, 4);
      if (stem.length < 4) continue;
      if (!strip(w.collocation).includes(stem)) bad.push(`${topic.slug}/${w.word} → ${w.collocation}`);
    }
  }
  /*
    Cho phép một ít ngoại lệ có lý: collocation của "gross domestic product"
    thường viết là "GDP growth rate", và đó là cách người ta thật sự dùng. Trần
    1% chặn được chuyện model bỏ bê hàng loạt mà không bắt oan mấy cụm viết tắt.
  */
  const total = VOCAB_TOPICS.reduce((sum, t) => sum + t.words.length, 0);
  assert.ok(
    bad.length <= Math.ceil(total * 0.01),
    `${bad.length} collocation không chứa từ của nó: ${bad.slice(0, 6).join(' | ')}`,
  );
});

test('band hợp lệ, và mỗi chủ đề trải ít nhất ba mức', () => {
  for (const topic of VOCAB_TOPICS) {
    const bands = new Set<string>();
    for (const w of topic.words) {
      assert.ok(
        (BAND_ORDER as string[]).includes(w.band),
        `"${w.word}" (${topic.slug}) có band lạ: ${w.band}`,
      );
      bands.add(w.band);
    }
    // Cả 50 từ cùng một mức thì việc xếp theo band ở giao diện mất ý nghĩa,
    // và người học band 5 mở ra gặp ngay 50 từ band 8.
    assert.ok(bands.size >= 3, `Chủ đề "${topic.slug}" chỉ có ${bands.size} mức band.`);
  }
});

test('gộp theo band giữ đủ số từ và đúng thứ tự dễ → khó', () => {
  for (const topic of VOCAB_TOPICS.slice(0, 5)) {
    const groups = groupByBand(topic.words);
    const total = groups.reduce((sum, g) => sum + g.words.length, 0);
    assert.equal(total, topic.words.length, `Gộp band làm rơi mất từ ở "${topic.slug}".`);

    const order = groups.map((g) => BAND_ORDER.indexOf(g.band));
    for (let i = 1; i < order.length; i += 1) {
      assert.ok(order[i]! > order[i - 1]!, 'nhóm band không đi từ dễ tới khó');
    }
  }
});

test('đồng nghĩa/trái nghĩa: gọn, không lặp từ gốc, không trùng nhau, phủ phần lớn kho', () => {
  let withSyn = 0;
  let total = 0;
  for (const t of VOCAB_TOPICS) {
    for (const w of t.words) {
      total += 1;
      const syn = w.synonyms ?? [];
      const ant = w.antonyms ?? [];
      if (syn.length) withSyn += 1;
      assert.ok(syn.length <= 4 && ant.length <= 2, `${w.word}: quá nhiều mục`);
      for (const s of [...syn, ...ant]) {
        assert.notEqual(s.toLowerCase(), w.word.toLowerCase(), `${w.word}: lặp từ gốc`);
        assert.ok(s.trim().split(/\s+/).length <= 3, `${w.word}: "${s}" quá dài`);
      }
      assert.equal(new Set(syn.map((s) => s.toLowerCase())).size, syn.length, `${w.word}: đồng nghĩa lặp`);
      assert.ok(!ant.some((a) => syn.includes(a)), `${w.word}: vừa đồng vừa trái nghĩa`);
    }
  }
  assert.ok(withSyn / total > 0.8, `chỉ ${withSyn}/${total} từ có đồng nghĩa`);
});
