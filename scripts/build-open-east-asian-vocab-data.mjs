import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, '.local-private', 'open-vocab');
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(sourceDir, name), 'utf8'));
const japaneseExtras = JSON.parse(fs.readFileSync(path.join(root, 'src/data/east-asian-extra-ja.json'), 'utf8'));
const chineseExtras = JSON.parse(fs.readFileSync(path.join(root, 'src/data/east-asian-extra-zh.json'), 'utf8'));

const posToChinese = {
  n: '名', ns: '名', nr: '名', nt: '名', nz: '名', ng: '名', vn: '动', v: '动', vd: '动', vg: '动',
  a: '形', an: '形', ag: '形', b: '形', z: '形', d: '副', c: '连', p: '介', r: '代', m: '数', q: '量',
  u: '助', y: '助', e: '叹', t: '名', f: '名', s: '名', i: '名', l: '名', x: '名',
};

const themes = [
  {
    vi: 'Con người, gia đình và quan hệ',
    en: 'People, Family and Relationships',
    match: /\b(person|people|man|woman|child|boy|girl|family|father|mother|parent|brother|sister|friend|guest|customer|teacher|student|neighbor|husband|wife|marry|meet|introduce|name|age|born|human|relationship|together|someone|everyone|anyone|叫|人|男|女|家人|朋友|同学|老师|学生|父|母|哥哥|姐姐|弟弟|妹妹|孩子|大家|先生|小姐|认识|介绍)\b/i,
  },
  {
    vi: 'Thời gian, lịch và sinh hoạt',
    en: 'Time, Calendar and Daily Life',
    match: /\b(time|hour|minute|second|day|week|month|year|date|today|tomorrow|yesterday|morning|afternoon|evening|night|early|late|before|after|now|often|always|sometimes|usually|every|daily|wake|sleep|rest|life|start|finish|begin|first|last|已经|现在|今天|明天|昨天|早上|晚上|下午|上午|时候|星期|月|年|日|点|分钟|起床|睡觉)\b/i,
  },
  {
    vi: 'Đồ ăn, mua sắm và tiền bạc',
    en: 'Food, Shopping and Money',
    match: /\b(food|eat|drink|meal|rice|bread|fruit|vegetable|meat|fish|water|tea|coffee|restaurant|cook|hungry|thirsty|taste|buy|sell|shop|store|market|price|money|cheap|expensive|pay|cost|order|menu|apple|banana|milk|chicken|beef|饭|吃|喝|水|茶|菜|水果|米|钱|买|卖|商店|饭店|贵|便宜|价格|咖啡)\b/i,
  },
  {
    vi: 'Nhà cửa và đồ dùng',
    en: 'Home and Everyday Objects',
    match: /\b(home|house|room|bedroom|kitchen|bathroom|door|window|table|chair|bed|desk|wall|floor|building|apartment|rent|live|clothes|shirt|shoes|bag|phone|computer|watch|key|light|clean|wash|open|close|房子|房间|家|门|桌子|椅子|床|衣服|手机|电脑|房租|厨房|厕所)\b/i,
  },
  {
    vi: 'Địa điểm, đi lại và du lịch',
    en: 'Places, Transport and Travel',
    match: /\b(place|city|town|country|street|road|station|airport|school|hospital|bank|post office|hotel|park|shop|bus|train|car|taxi|plane|bicycle|subway|travel|trip|visit|arrive|leave|return|walk|drive|ride|map|direction|north|south|east|west|中国|北京|地方|学校|医院|机场|车站|公共汽车|火车|飞机|出租车|旅行|旅游|路|附近)\b/i,
  },
  {
    vi: 'Học tập, công việc và giao tiếp',
    en: 'Study, Work and Communication',
    match: /\b(study|learn|teach|school|class|lesson|book|word|language|Chinese|Japanese|English|write|read|speak|listen|say|tell|ask|answer|question|message|letter|email|work|job|company|office|business|meeting|teacher|student|exam|test|homework|computer|电话|说|话|读|写|看|学|学习|工作|公司|上班|考试|问题|答案|作业|邮件|电话)\b/i,
  },
  {
    vi: 'Sức khỏe, thời tiết và thiên nhiên',
    en: 'Health, Weather and Nature',
    match: /\b(health|healthy|sick|ill|illness|hospital|doctor|medicine|body|head|eye|ear|nose|mouth|hand|foot|leg|arm|heart|pain|hurt|fever|cold|weather|rain|snow|wind|sun|cloud|hot|cold|warm|cool|season|spring|summer|autumn|winter|tree|flower|grass|animal|bird|sea|river|mountain|forest|environment|自然|天气|雨|雪|风|太阳|身体|头|手|脚|病|药|医院|医生)\b/i,
  },
  {
    vi: 'Số lượng, vị trí và từ chức năng',
    en: 'Numbers, Position and Function Words',
    match: /\b(number|one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|many|much|few|little|some|all|each|every|more|less|how many|how much|first|second|left|right|front|back|inside|outside|above|below|between|near|far|here|there|where|which|what|who|when|why|how|个|一|二|三|四|五|六|七|八|九|十|多少|几|这|那|哪|谁|怎么|为什么|里面|外面|上面|下面|左边|右边|前面|后面)\b/i,
  },
  {
    vi: 'Hành động, miêu tả và ý niệm',
    en: 'Actions, Descriptions and Ideas',
    match: /.*/,
  },
];

function chooseTheme(text) {
  for (let i = 0; i < themes.length - 1; i += 1) {
    if (themes[i].match.test(text)) return i;
  }
  return 8;
}

function readingFromFurigana(text = '') {
  return text.replace(/\{[^|}]+\|([^}]+)\}/g, '$1').replace(/[{}]/g, '').trim();
}

function makeBook({ slug, name, nameVi, language, sourceNote, sourceUrl, levels }) {
  const topics = [];
  let wordCount = 0;
  let unitCount = 0;
  for (const level of levels) {
    const buckets = themes.map(() => []);
    for (const row of level.rows) {
      const extra = language === 'ja' ? japaneseExtras[row.w] : chineseExtras[row.w];
      const searchText = [row.g, extra?.vi, row.w].filter(Boolean).join(' ');
      const themeIndex = chooseTheme(searchText);
      buckets[themeIndex].push(row);
    }
    for (let themeIndex = 0; themeIndex < buckets.length; themeIndex += 1) {
      const rows = buckets[themeIndex];
      if (!rows.length) continue;
      const theme = themes[themeIndex];
      const displayEn = `${level.labelEn} · ${theme.en}`;
      const displayVi = `${level.labelVi} · ${theme.vi}`;
      const topicIndex = topics.length + 1;
      const topicSlug = `${slug}-topic-${String(topicIndex).padStart(2, '0')}`;
      const lessons = [];
      for (let start = 0; start < rows.length; start += 50) {
        const chunk = rows.slice(start, start + 50);
        const lessonIndex = lessons.length + 1;
        const unit = chunk;
        const labelVi = `${displayVi} · Buổi ${String(lessonIndex).padStart(2, '0')}`;
        const labelEn = `${displayEn} · Unit ${String(lessonIndex).padStart(2, '0')}`;
        lessons.push({
          slug: `${topicSlug}-unit-${String(lessonIndex).padStart(2, '0')}`,
          name: labelEn,
          nameVi: labelVi,
          lessonIndex,
          sourceLesson: null,
          sourceUnit: lessonIndex,
          lessonTitle: displayVi,
          sourcePages: [],
          blurb: `${chunk.length} từ · ${displayVi}`,
          rows: unit,
        });
      }
      const topicWordCount = rows.length;
      unitCount += lessons.length;
      wordCount += topicWordCount;
      topics.push({
        slug: topicSlug,
        name: displayEn,
        nameVi: displayVi,
        sourceTheme: displayVi,
        wordCount: topicWordCount,
        lessons,
      });
    }
  }
  return { slug, name, nameVi, language, blurb: `${wordCount.toLocaleString('vi-VN')} từ · chủ đề tự phân nhóm · mỗi buổi tối đa 50 từ.`, sourceNote, sourceUrl, wordCount, unitCount, topics };
}

const hskPos = (pos) => [...new Set((pos ?? []).map((item) => posToChinese[item]).filter(Boolean))].join('、');
function japanesePos(pos) {
  const values = pos ?? [];
  if (values.some((item) => item.startsWith('v'))) return 'động từ';
  if (values.some((item) => item.startsWith('adj'))) return 'tính từ';
  if (values.some((item) => item === 'adv' || item.startsWith('adv-'))) return 'phó từ';
  if (values.some((item) => item === 'prt')) return 'trợ từ';
  if (values.some((item) => item.startsWith('conj'))) return 'liên từ';
  if (values.some((item) => item === 'int')) return 'thán từ';
  if (values.some((item) => item.startsWith('aux'))) return 'trợ động từ';
  if (values.some((item) => item.startsWith('num'))) return 'số từ';
  if (values.some((item) => item.startsWith('n') || item === 'pn')) return 'danh từ';
  return '';
}
const hskLevels = [];
for (let level = 1; level <= 6; level += 1) {
  const rows = readJson(`hsk20/${level}.json`).map((entry) => {
    const form = entry.forms?.[0] ?? {};
    return {
      w: entry.simplified,
      p: form.transcriptions?.pinyin ?? '',
      g: (form.meanings ?? []).join('; '),
      o: hskPos(entry.pos),
      l: String(level),
    };
  });
  hskLevels.push({ labelEn: `HSK ${level}`, labelVi: `HSK ${level}`, rows });
}

const jlptLevels = [];
for (let level = 5; level >= 1; level -= 1) {
  const labelEn = `JLPT N${level}`;
  const labelVi = `JLPT N${level}`;
  const rows = readJson(`jlpt/n${level}.json`).map((entry) => {
    const example = entry.examples?.[0];
    return {
      w: entry.word,
      p: entry.reading,
      r: entry.romaji,
      g: (entry.meanings ?? []).join('; '),
      o: japanesePos(entry.pos),
      l: `N${level}`,
      ex: example?.ja ?? '',
      exEn: example?.en ?? '',
      exReading: readingFromFurigana(example?.furigana ?? ''),
    };
  });
  jlptLevels.push({ labelEn, labelVi, rows });
}

const result = [
  makeBook({
    slug: 'book-hsk-2-0-community',
    name: 'HSK 2.0 Vocabulary Review · community list',
    nameVi: 'Ôn từ vựng HSK 2.0 · danh sách cộng đồng',
    language: 'zh',
    sourceNote: 'Danh sách HSK 2.0 cộng đồng từ complete-HSK Vocabulary, dùng ôn bổ trợ HSK Standard Course. Chủ đề và buổi học do Band 9 tự sắp xếp; không phải danh mục CTI 2015 nguyên bản hay thứ tự từng bài trong giáo trình. CC BY-SA 4.0.',
    sourceUrl: 'https://github.com/drkameleon/complete-hsk-vocabulary',
    levels: hskLevels,
  }),
  makeBook({
    slug: 'book-jlpt-open-vocabulary',
    name: 'Japanese JLPT Vocabulary Review · N5–N1',
    nameVi: 'Từ vựng ôn JLPT tiếng Nhật · N5–N1',
    language: 'ja',
    sourceNote: 'Nguồn OpenJLPT, dùng JMdict/KANJIDIC2 (EDRDG), danh sách Jonathan Waller và câu ví dụ Tatoeba; CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0/). Có cách đọc, romaji, nghĩa tiếng Anh và ví dụ. Cấp N5–N1 là xếp loại cộng đồng, không phải danh mục JLPT chính thức; danh sách không theo thứ tự bài của Minna no Nihongo, Genki hay Shin Kanzen Master.',
    sourceUrl: 'https://github.com/evanclan/OpenJLPT',
    levels: jlptLevels,
  }),
];

const output = path.join(root, 'src/data/east-asian-open-vocab.json');
fs.writeFileSync(output, `${JSON.stringify(result)}\n`, 'utf8');
console.log(`Wrote ${output}: ${result.map((book) => `${book.slug} ${book.wordCount} words/${book.topics.length} topics/${book.unitCount} units`).join(', ')}`);
