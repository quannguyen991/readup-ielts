import fs from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
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

function makeBook({ slug, name, nameVi, language, sourceNote, sourceUrl, wordBandPrefix, levels }) {
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
  return { slug, name, nameVi, language, blurb: `${wordCount.toLocaleString('vi-VN')} từ · chủ đề tự phân nhóm · mỗi buổi tối đa 50 từ.`, sourceNote, sourceUrl, wordBandPrefix, wordCount, unitCount, topics };
}

function cedictPinyinToToneMarks(input) {
  const marks = {
    a: ['ā', 'á', 'ǎ', 'à'], e: ['ē', 'é', 'ě', 'è'], i: ['ī', 'í', 'ǐ', 'ì'],
    o: ['ō', 'ó', 'ǒ', 'ò'], u: ['ū', 'ú', 'ǔ', 'ù'], 'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
  };
  return input.replace(/([a-züv]+)([1-5])/gi, (_match, rawSyllable, rawTone) => {
    const tone = Number(rawTone);
    const syllable = String(rawSyllable).replace(/v/gi, (letter) => (letter === 'V' ? 'Ü' : 'ü'));
    if (tone === 5) return syllable;
    const lower = syllable.toLowerCase();
    const vowel = lower.includes('a') ? lower.indexOf('a')
      : lower.includes('e') ? lower.indexOf('e')
        : lower.includes('ou') ? lower.indexOf('o')
          : Math.max(...[...lower].map((letter, index) => 'aeiouü'.includes(letter) ? index : -1));
    if (vowel < 0) return syllable;
    const original = [...syllable][vowel];
    const marked = marks[original.toLowerCase()]?.[tone - 1];
    if (!marked) return syllable;
    const preserveUpper = original === original.toUpperCase();
    return `${[...syllable].slice(0, vowel).join('')}${preserveUpper ? marked.toUpperCase() : marked}${[...syllable].slice(vowel + 1).join('')}`;
  });
}

function readCedict() {
  const compressed = fs.readFileSync(path.join(sourceDir, 'frequency/cedict_1_0_ts_utf-8_mdbg.txt.gz'));
  const lines = gunzipSync(compressed).toString('utf8').split(/\r?\n/);
  const entries = new Map();
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^\S+\s+(\S+)\s+\[([^\]]+)\]\s+\/(.*)\/$/);
    if (!match) continue;
    const word = match[1];
    const entry = entries.get(word) ?? { readings: [], glosses: [] };
    const reading = cedictPinyinToToneMarks(match[2]);
    if (reading && !entry.readings.includes(reading)) entry.readings.push(reading);
    for (const gloss of match[3].split('/').filter(Boolean)) {
      if (!entry.glosses.includes(gloss)) entry.glosses.push(gloss);
    }
    entries.set(word, entry);
  }
  return new Map([...entries].map(([word, entry]) => [word, { p: entry.readings.join(' / '), g: entry.glosses.join('; ') }]));
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

const tocflSource = readJson('linzi/tocfl-words.json');
const tocflByBand = new Map();
const tocflMerged = new Map();
for (const entry of tocflSource.data) {
  const band = entry.tocfl_band;
  const current = tocflMerged.get(entry.simp);
  if (!current) {
    tocflMerged.set(entry.simp, { w: entry.simp, t: entry.trad, p: entry.pinyin, z: entry.zhuyin, g: entry.definitions, l: band, level: entry.tocfl_level });
    continue;
  }
  for (const key of ['p', 'z', 'g']) {
    const values = [...new Set([...(current[key] ? [current[key]] : []), entry[key === 'p' ? 'pinyin' : key === 'z' ? 'zhuyin' : 'definitions']].filter(Boolean))];
    current[key] = values.join(' / ');
  }
  if (Number(entry.tocfl_level) < Number(current.level)) {
    current.l = band;
    current.level = entry.tocfl_level;
  }
}
for (const row of tocflMerged.values()) {
  const rows = tocflByBand.get(row.l) ?? [];
  delete row.level;
  rows.push(row);
  tocflByBand.set(row.l, rows);
}
const tocflLevels = [...tocflByBand].map(([band, rows]) => ({ labelEn: `TOCFL ${band}`, labelVi: `TOCFL ${band}`, rows }));

const hsk30Source = readJson('linzi/hsk30-words.json');
const hsk30Merged = new Map();
const hskLevelNumber = (value) => (value === '7-9' ? 7 : Number(value));
for (const entry of hsk30Source.data) {
  const level = String(entry.hsk_level);
  const current = hsk30Merged.get(entry.simp);
  if (!current) {
    hsk30Merged.set(entry.simp, {
      w: entry.simp,
      traditions: new Set([entry.trad]),
      pinyins: new Set([entry.pinyin]),
      zhuyins: new Set([entry.zhuyin]),
      glosses: new Set([entry.definitions]),
      levels: new Set([level]),
      variants: new Map([[`${entry.pinyin}\u0000${entry.zhuyin}\u0000${entry.definitions}\u0000${entry.trad}`, { p: entry.pinyin, z: entry.zhuyin, g: entry.definitions, t: entry.trad }]]),
    });
    continue;
  }
  current.traditions.add(entry.trad);
  current.pinyins.add(entry.pinyin);
  current.zhuyins.add(entry.zhuyin);
  current.glosses.add(entry.definitions);
  current.levels.add(level);
  current.variants.set(`${entry.pinyin}\u0000${entry.zhuyin}\u0000${entry.definitions}\u0000${entry.trad}`, { p: entry.pinyin, z: entry.zhuyin, g: entry.definitions, t: entry.trad });
}
const hsk30ByLevel = new Map();
for (const entry of hsk30Merged.values()) {
  const levels = [...entry.levels].sort((a, b) => hskLevelNumber(a) - hskLevelNumber(b));
  const row = {
    w: entry.w,
    t: [...entry.traditions].join(' / '),
    p: [...entry.pinyins].join(' / '),
    z: [...entry.zhuyins].join(' / '),
    g: [...entry.glosses].join(' / '),
    l: levels[0],
    ls: levels,
    variants: [...entry.variants.values()],
  };
  const rows = hsk30ByLevel.get(row.l) ?? [];
  rows.push(row);
  hsk30ByLevel.set(row.l, rows);
}
const hsk30Levels = [...hsk30ByLevel].map(([level, rows]) => ({ labelEn: `HSK ${level}`, labelVi: `HSK ${level}`, rows }));

const cedict = readCedict();
const frequencyLevels = new Map();
const frequencyList = readJson('frequency/words.json').filter((entry) => entry.rank <= 10_000);
for (const entry of frequencyList) {
  const dictionaryEntry = cedict.get(entry.word);
  if (!dictionaryEntry) continue;
  const firstRank = Math.floor((entry.rank - 1) / 1_000) * 1_000 + 1;
  const lastRank = Math.min(firstRank + 999, 10_000);
  const label = `${firstRank.toLocaleString('en-US')}–${lastRank.toLocaleString('en-US')}`;
  const rows = frequencyLevels.get(label) ?? [];
  rows.push({ w: entry.word, p: dictionaryEntry.p, g: dictionaryEntry.g, l: label });
  frequencyLevels.set(label, rows);
}
const frequencyCount = [...frequencyLevels.values()].reduce((sum, rows) => sum + rows.length, 0);
const rankedFrequencyLevels = [...frequencyLevels].map(([band, rows]) => ({ labelEn: `Top ${band}`, labelVi: `Top ${band}`, rows }));

const result = [
  makeBook({
    slug: 'book-hsk-2021-linzi',
    name: 'International Chinese Proficiency Grading Standards · LinZi',
    nameVi: 'Từ vựng chuẩn trình độ tiếng Trung quốc tế · LinZi',
    language: 'zh',
    wordBandPrefix: 'HSK chuẩn 2021',
    sourceNote: `Danh sách theo chuẩn GF0025-2021: ${hsk30Source.data.length.toLocaleString('vi-VN')} dòng nguồn được gộp thành ${hsk30Merged.size.toLocaleString('vi-VN')} mục từ giản thể khác nhau. Giữ mọi cấp nguồn, dạng phồn thể, cách đọc và nghĩa riêng; cấp sớm nhất dùng để xếp thứ tự học. Đây là bộ HSK 3.0 theo chuẩn 2021, khác bộ đề cương kỳ thi mới công bố năm 2025. Dữ liệu LinZi phát hành theo CC BY-SA 4.0; phần nghĩa tiếng Anh dựa trên CC-CEDICT. Chủ đề và buổi học tối đa 50 từ do ReadUp tự sắp xếp.`,
    sourceUrl: 'https://www.linzi.app/data/',
    levels: hsk30Levels,
  }),
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
    slug: 'book-zh-tocfl-linzi',
    name: 'TOCFL 華語八千詞 · LinZi',
    nameVi: 'Từ vựng TOCFL · LinZi',
    language: 'zh',
    wordBandPrefix: 'TOCFL',
    sourceNote: `Dữ liệu TOCFL LinZi có ${tocflSource.data.length.toLocaleString('vi-VN')} dòng nguồn và ${tocflMerged.size.toLocaleString('vi-VN')} từ giản thể khác nhau; các dòng lặp được gộp, giữ các cách đọc và nghĩa riêng. Có phồn thể, giản thể, pinyin, zhuyin và nghĩa tiếng Anh. LinZi phát hành theo CC BY-SA 4.0; nghĩa tiếng Anh dựa trên CC-CEDICT. Band 9 sắp xếp lại theo chủ đề và buổi học tối đa 50 từ; đây là bộ TOCFL riêng, không phải thứ tự bài Giáo trình Hán ngữ.`,
    sourceUrl: 'https://www.linzi.app/data/',
    levels: tocflLevels,
  }),
  makeBook({
    slug: 'book-zh-frequency-doudou-10k',
    name: 'Mandarin Frequency · DouDou / wordfreq Top 10,000',
    nameVi: 'Từ vựng tiếng Trung theo tần suất · Top 10.000',
    language: 'zh',
    wordBandPrefix: 'Tần suất',
    sourceNote: `Từ trong 10.000 hạng đầu của wordfreq 3.1.1, lấy qua DouDou Chinese; ${frequencyCount.toLocaleString('vi-VN')} mục có khớp từ điển giản thể CC-CEDICT, nên danh sách được gắn nhãn theo dải hạng và không đại diện cho bài học sách giáo khoa. wordfreq và CC-CEDICT đều CC BY-SA 4.0; nhóm chủ đề và buổi học tối đa 50 từ do Band 9 sắp xếp.`,
    sourceUrl: 'https://doudou-chinese.com/',
    levels: rankedFrequencyLevels,
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
