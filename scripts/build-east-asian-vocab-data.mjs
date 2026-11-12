import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, '.local-private', 'east-asian-vocab-ocr');
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(sourceDir, name), 'utf8'));
const units = readJson('east-asian-vocab-units.json');
const japaneseWords = readJson('irodori-vocabulary.json');
const chineseWords = readJson('hsk-3.0-vocabulary.json');

const bookMeta = {
  'Irodori starter': {
    slug: 'book-irodori-starter',
    name: 'Irodori · Japanese for Life in Japan · Starter',
    nameVi: 'Irodori · Tiếng Nhật giao tiếp · Sơ cấp',
    language: 'ja',
    order: 0,
  },
  'Irodori elementary-1': {
    slug: 'book-irodori-elementary-1',
    name: 'Irodori · Japanese for Life in Japan · Elementary 1',
    nameVi: 'Irodori · Tiếng Nhật giao tiếp · Sơ cấp 1',
    language: 'ja',
    order: 1,
  },
  'Irodori elementary-2': {
    slug: 'book-irodori-elementary-2',
    name: 'Irodori · Japanese for Life in Japan · Elementary 2',
    nameVi: 'Irodori · Tiếng Nhật giao tiếp · Sơ cấp 2',
    language: 'ja',
    order: 2,
  },
  'Irodori pre-intermediate': {
    slug: 'book-irodori-pre-intermediate',
    name: 'Irodori · Japanese for Life in Japan · Pre-intermediate',
    nameVi: 'Irodori · Tiếng Nhật giao tiếp · Tiền trung cấp',
    language: 'ja',
    order: 3,
  },
  'HSK 3.0 Examination Syllabus 2025-11': {
    slug: 'book-hsk-3-0',
    name: 'HSK 3.0 · Chinese Vocabulary Syllabus',
    nameVi: 'HSK 3.0 · Từ vựng tiếng Trung',
    language: 'zh',
    order: 4,
  },
};

const themeMeta = {
  'はじめての日本語': ['First Steps in Japanese', 'Tiếng Nhật đầu tiên'],
  '私のこと': ['About Me', 'Về bản thân'],
  '好きな食べ物': ['Food I Like', 'Món ăn yêu thích'],
  '家と職場': ['Home and Workplace', 'Nhà ở và nơi làm việc'],
  '毎日の生活': ['Everyday Life', 'Sinh hoạt hằng ngày'],
  '私の好きなこと': ['Things I Enjoy', 'Sở thích của tôi'],
  '街を歩く': ['Around Town', 'Đi quanh thành phố'],
  '店で': ['At the Shops', 'Ở cửa hàng'],
  '休みの日に': ['On Days Off', 'Ngày nghỉ'],
  '今の私': ['About Me Now', 'Tôi hiện tại'],
  '季節と天気': ['Seasons and Weather', 'Mùa và thời tiết'],
  '私の町': ['My Town', 'Thành phố của tôi'],
  'いっしょに出かける': ['Going Out Together', 'Cùng đi chơi'],
  '日本語学習': ['Learning Japanese', 'Học tiếng Nhật'],
  'おいしい料理': ['Delicious Food', 'Món ăn ngon'],
  '仕事の連絡': ['Work Communication', 'Giao tiếp công việc'],
  '健康な生活': ['Healthy Living', 'Sống khỏe'],
  '交際': ['Social Relationships', 'Quan hệ xã hội'],
  '私の周りの人たち': ['People Around Me', 'Những người quanh tôi'],
  'レストランで': ['At a Restaurant', 'Ở nhà hàng'],
  '旅行に行こう': ['Let’s Travel', 'Cùng đi du lịch'],
  '地域のイベント': ['Local Events', 'Sự kiện địa phương'],
  '年中行事とマナー': ['Annual Events and Manners', 'Lễ hội và phép tắc'],
  '上手な買い物': ['Smart Shopping', 'Mua sắm thông minh'],
  'さまざまなサービス': ['Everyday Services', 'Các dịch vụ thường ngày'],
  '自然と環境': ['Nature and the Environment', 'Thiên nhiên và môi trường'],
  '私の人生': ['My Life', 'Cuộc sống của tôi'],
  '好きなもの好きなこと': ['Things I Like', 'Những điều tôi yêu thích'],
  'どこに住む？': ['Where to Live?', 'Sống ở đâu?'],
  '毎日の食事': ['Everyday Meals', 'Bữa ăn hằng ngày'],
  '出会う': ['Meeting People', 'Gặp gỡ'],
  '私と日本語': ['Me and Japanese', 'Tôi và tiếng Nhật'],
  'こんなときどうする？': ['What to Do in This Situation', 'Xử lý tình huống'],
  '人とのつき合い': ['Getting Along with People', 'Quan hệ với mọi người'],
  '旅行の楽しみ': ['Enjoying Travel', 'Trải nghiệm du lịch'],
  '日本で働く': ['Working in Japan', 'Làm việc tại Nhật Bản'],
};

const jaQueues = new Map();
for (const entry of japaneseWords) {
  const key = `${entry.word}\u0000${entry.sourcePage}`;
  const queue = jaQueues.get(key) ?? [];
  queue.push(entry);
  jaQueues.set(key, queue);
}
const hskBySequence = new Map(chineseWords.map((entry) => [entry.sequence, entry]));
const hskLevelOrder = new Map(['1', '2', '3', '4', '5', '6', '7-9'].map((level, index) => [level, index]));

const sortedUnits = [...units].sort((a, b) => {
  const aMeta = bookMeta[a.book];
  const bMeta = bookMeta[b.book];
  const byBook = (aMeta?.order ?? 99) - (bMeta?.order ?? 99);
  if (byBook) return byBook;
  if (a.language === 'zh') {
    const byLevel = (hskLevelOrder.get(a.theme.replace('HSK ', '')) ?? 99) - (hskLevelOrder.get(b.theme.replace('HSK ', '')) ?? 99);
    return byLevel || a.unit - b.unit;
  }
  return (a.lesson ?? 0) - (b.lesson ?? 0) || a.unit - b.unit;
});

const groupedBooks = new Map();
let japaneseRefs = 0;
let chineseRefs = 0;
for (const sourceUnit of sortedUnits) {
  const meta = bookMeta[sourceUnit.book];
  if (!meta) throw new Error(`Unknown book: ${sourceUnit.book}`);
  let book = groupedBooks.get(sourceUnit.book);
  if (!book) {
    book = {
      ...meta,
      blurb: meta.language === 'ja'
        ? 'Từ vựng được chia theo chủ đề Irodori và bài học nguồn; mỗi unit tối đa 50 từ.'
        : 'Từ vựng được chia theo cấp HSK và buổi học tối đa 50 từ.',
      sourceNote: meta.language === 'ja'
        ? 'Bảng từ Irodori có cách đọc bằng kana, một số mục có romaji và nghĩa tiếng Anh; nguồn không kèm từ loại, ví dụ hoặc từ đồng nghĩa.'
        : 'Danh sách HSK 3.0 có chữ Hán, pinyin, từ loại ở một số mục và trang sách; nguồn không có nghĩa tiếng Việt, ví dụ hoặc từ đồng nghĩa.',
      topics: [],
    };
    groupedBooks.set(sourceUnit.book, book);
  }

  let topic = book.topics.find((item) => item.sourceTheme === sourceUnit.theme);
  if (!topic) {
    const [name, nameVi] = meta.language === 'zh'
      ? [`HSK ${sourceUnit.theme.replace('HSK ', '')}`, `HSK ${sourceUnit.theme.replace('HSK ', '')}`]
      : (themeMeta[sourceUnit.theme] ?? [sourceUnit.theme, sourceUnit.theme]);
    topic = {
      slug: `${meta.slug}-topic-${String(book.topics.length + 1).padStart(2, '0')}`,
      name,
      nameVi,
      sourceTheme: sourceUnit.theme,
      lessons: [],
    };
    book.topics.push(topic);
  }

  const rows = sourceUnit.entryRefs.map((ref) => {
    if (meta.language === 'zh') {
      chineseRefs += 1;
      const entry = hskBySequence.get(ref.sequence);
      if (!entry || entry.word !== ref.word || entry.sourcePage !== ref.sourcePage) {
        throw new Error(`HSK reference mismatch at sequence ${ref.sequence}`);
      }
      return { w: entry.word, p: entry.pinyin, o: entry.pos, s: entry.sourcePage, l: entry.level };
    }
    japaneseRefs += 1;
    const key = `${ref.word}\u0000${ref.sourcePage}`;
    const entry = jaQueues.get(key)?.shift();
    if (!entry) throw new Error(`Irodori reference not found: ${ref.word} (p. ${ref.sourcePage})`);
    return {
      w: entry.word,
      p: entry.readingOrAccent,
      r: entry.romaji,
      g: entry.meaningEn,
      s: entry.sourcePage,
      l: entry.level,
    };
  });
  if (rows.length !== sourceUnit.wordCount || rows.length > 50) {
    throw new Error(`Invalid unit size in ${sourceUnit.book} ${sourceUnit.theme} unit ${sourceUnit.unit}`);
  }

  const sourcePages = [...new Set(rows.map((row) => row.s).filter(Boolean))].sort((a, b) => a - b);
  const lessonIndex = topic.lessons.length + 1;
  const isChinese = meta.language === 'zh';
  const labelEn = isChinese
    ? `${topic.name} · Unit ${String(sourceUnit.unit).padStart(2, '0')}`
    : `Lesson ${sourceUnit.lesson}${sourceUnit.unit > 1 ? ` · Part ${sourceUnit.unit}` : ''} · ${sourceUnit.lessonTitle}`;
  const labelVi = isChinese
    ? `${topic.nameVi} · Buổi ${String(sourceUnit.unit).padStart(2, '0')}`
    : `Bài ${sourceUnit.lesson}${sourceUnit.unit > 1 ? ` · Phần ${sourceUnit.unit}` : ''} · ${sourceUnit.lessonTitle}`;
  topic.lessons.push({
    slug: `${topic.slug}-unit-${String(lessonIndex).padStart(2, '0')}`,
    name: labelEn,
    nameVi: labelVi,
    lessonIndex,
    sourceLesson: sourceUnit.lesson ?? null,
    sourceUnit: sourceUnit.unit,
    lessonTitle: sourceUnit.lessonTitle ?? null,
    sourcePages,
    blurb: `${rows.length} từ · ${sourcePages.length ? `trang ${sourcePages.join(', ')}` : ''}`.trim(),
    rows,
  });
}

if (japaneseRefs !== japaneseWords.length || [...jaQueues.values()].some((queue) => queue.length > 0)) {
  throw new Error(`Irodori count mismatch: referenced ${japaneseRefs} of ${japaneseWords.length}`);
}
if (chineseRefs !== chineseWords.length) throw new Error(`HSK count mismatch: referenced ${chineseRefs} of ${chineseWords.length}`);

const result = [...groupedBooks.values()];
for (const book of result) {
  book.wordCount = book.topics.reduce((sum, theme) => sum + theme.lessons.reduce((n, lesson) => n + lesson.rows.length, 0), 0);
  book.unitCount = book.topics.reduce((sum, theme) => sum + theme.lessons.length, 0);
  book.topics.forEach((theme) => {
    theme.wordCount = theme.lessons.reduce((sum, lesson) => sum + lesson.rows.length, 0);
  });
}

const output = path.join(root, 'src', 'data', 'east-asian-vocab.json');
fs.writeFileSync(output, `${JSON.stringify(result)}\n`, 'utf8');
console.log(`Wrote ${output}: ${result.map((book) => `${book.slug} ${book.wordCount} words/${book.unitCount} units`).join(', ')}`);
