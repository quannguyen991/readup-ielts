/**
 * Public catalogue metadata for the third edition of Hanyu Jiaocheng.
 * Vocabulary, lesson titles, textbook text, and exercises are intentionally
 * absent until the licensed source files are available for transcription.
 */
export type HanyuVolume = {
  id: string;
  title: string;
  titleVi: string;
  isbn: string;
  lessonCount: number;
  focus: string;
  publisherUrl: string;
};

export const HANYU_SERIES_URL = 'https://www.blcup.com/SeriesBook/index/1631';
export const HANYU_LOGIN_URL = 'https://www.blcup.com/Account/Login';

export const HANYU_VOLUMES: readonly HanyuVolume[] = [
  {
    id: '1-shang',
    title: '汉语教程（第3版）1（上）',
    titleVi: 'Quyển 1 · Tập trên',
    isbn: '9787561945308',
    lessonCount: 15,
    focus: 'Bắt đầu từ số 0; 10 bài đầu tập trung phát âm, sau đó chuyển sang mẫu câu.',
    publisherUrl: 'https://www.blcup.com/PInfo/index/8648',
  },
  {
    id: '1-xia',
    title: '汉语教程（第3版）1（下）',
    titleVi: 'Quyển 1 · Tập dưới',
    isbn: '9787561945476',
    lessonCount: 10,
    focus: 'Giai đoạn mẫu câu và ngữ pháp; hội thoại thực dụng cùng từ vựng cơ bản.',
    publisherUrl: 'https://www.blcup.com/PInfo/index/8660',
  },
  {
    id: '2-shang',
    title: '汉语教程（第3版）2（上）',
    titleVi: 'Quyển 2 · Tập trên',
    isbn: '9787561946381',
    lessonCount: 12,
    focus: 'Tiếp nối phần mẫu câu và ngữ pháp qua hội thoại thực dụng.',
    publisherUrl: 'https://www.blcup.com/PInfo/index/8784',
  },
  {
    id: '2-xia',
    title: '汉语教程（第3版）2（下）',
    titleVi: 'Quyển 2 · Tập dưới',
    isbn: '9787561946398',
    lessonCount: 13,
    focus: 'Tiếp tục giai đoạn mẫu câu và ngữ pháp.',
    publisherUrl: 'https://www.blcup.com/PInfo/index/8883',
  },
  {
    id: '3-shang',
    title: '汉语教程（第3版）第三册 上',
    titleVi: 'Quyển 3 · Tập trên',
    isbn: '9787561947739',
    lessonCount: 13,
    focus: 'Chuyển sang từ vựng và bài đọc ngắn; có phần cách dùng từ và so sánh từ gần nghĩa.',
    publisherUrl: 'https://www.blcup.com/PInfo/index?doi=85dadcd3-699e-4140-99be-6d4f5f510ced',
  },
  {
    id: '3-xia',
    title: '汉语教程（第3版）第三册 下',
    titleVi: 'Quyển 3 · Tập dưới',
    isbn: '9787561947746',
    lessonCount: 13,
    focus: 'Tiếp tục từ vựng và bài đọc ngắn; chú trọng cách dùng từ và từ gần nghĩa.',
    publisherUrl: 'https://www.blcup.com/PInfo/index/9175',
  },
] as const;

export const HANYU_LESSON_TOTAL = HANYU_VOLUMES.reduce((total, volume) => total + volume.lessonCount, 0);

/** The catalogue pages expose structure and counts, not the complete lesson vocabulary. */
export const HANYU_CATALOG_NOTE =
  'Số tập, ISBN và số bài lấy từ danh mục chính thức BLCUP. Danh sách từ, tên bài và nội dung sách chưa được nhập.';
export const HANYU_LOGIN_NOTE =
  'Trang đăng nhập BLCUP hiện yêu cầu tên đăng nhập, mật khẩu và mã xác minh (hoặc đăng nhập tổ chức); không thấy lựa chọn Google.';

/** Separate supplemental sets already available in ReadUp; neither is Hanyu lesson order. */
export const CHINESE_SUPPLEMENTAL_SETS = [
  {
    slug: 'book-hsk-3-0',
    title: 'HSK 3.0 · Từ vựng theo đề cương',
    wordCount: 11_000,
    unitCount: 220,
    note: 'Theo đề cương HSK 3.0; tài liệu ôn thi riêng, không phải danh sách bài của Giáo trình Hán ngữ.',
    sourceLinks: [{ label: 'Đề cương chính thức HSK', url: 'https://www.chinesetest.cn/syllabus' }],
  },
  {
    slug: 'book-hsk-2-0-community',
    title: 'HSK 2.0 · Danh sách cộng đồng',
    wordCount: 4_991,
    unitCount: 133,
    note: 'Danh sách cộng đồng có nghĩa tiếng Anh dựa trên CC-CEDICT; dữ liệu phát hành theo CC BY-SA 4.0.',
    sourceLinks: [
      { label: 'complete-HSK Vocabulary', url: 'https://github.com/drkameleon/complete-hsk-vocabulary' },
      { label: 'CC-CEDICT', url: 'https://cc-cedict.org/wiki/' },
      { label: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
    ],
  },
  {
    slug: 'book-zh-tocfl-linzi',
    title: 'TOCFL 華語八千詞 · LinZi',
    wordCount: 7_162,
    unitCount: 176,
    note: 'Từ 7.187 dòng nguồn, gộp mục từ giản thể trùng thành 7.162 thẻ, giữ các cách đọc và nghĩa riêng; có phồn thể, pinyin, zhuyin và nghĩa tiếng Anh. CC BY-SA 4.0, độc lập với thứ tự Giáo trình Hán ngữ.',
    sourceLinks: [
      { label: 'LinZi · dữ liệu và ghi công', url: 'https://www.linzi.app/data/' },
      { label: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
      { label: 'CC-CEDICT', url: 'https://cc-cedict.org/wiki/' },
    ],
  },
  {
    slug: 'book-zh-frequency-doudou-10k',
    title: 'Tần suất tiếng Trung · Top 10.000',
    wordCount: 9_754,
    unitCount: 240,
    note: 'Các mục khớp từ điển giản thể trong 10.000 hạng đầu của wordfreq; cách nhóm chủ đề do ReadUp tự làm, không theo sách hay kỳ thi. CC BY-SA 4.0.',
    sourceLinks: [
      { label: 'DouDou · tệp và ghi công', url: 'https://doudou-chinese.com/downloads/README.txt' },
      { label: 'wordfreq', url: 'https://github.com/rspeer/wordfreq' },
      { label: 'CC-CEDICT', url: 'https://cc-cedict.org/wiki/' },
      { label: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
    ],
  },
] as const;

/** Link-only source: public OER with a noncommercial license; content is not bundled in the app. */
export const CHINESE_OPEN_COURSE = {
  title: 'Elementary Chinese I · Wenying Zhou',
  chapterCount: 8,
  license: 'CC BY-NC 4.0',
  url: 'https://human.libretexts.org/Bookshelves/Languages/Chinese/Elementary_Chinese_I_%28Zhou%29',
} as const;

/** Public courses linked as supplementary learning material; license restrictions stay visible. */
export const CHINESE_ADDITIONAL_COURSES = [
  {
    title: 'A Course in Mandarin Chinese · Wikibooks',
    detail: '17 chương; phát âm, hội thoại, từ vựng, ngữ pháp và bài tập.',
    license: 'CC BY-SA 4.0',
    url: 'https://open-book-project.github.io/textbooks/open-textbooks/wb-chinese-mandarin/index.html',
  },
  {
    title: 'Learning Chinese · MIT OpenCourseWare',
    detail: 'Giáo trình nhập môn đến trung cấp, gồm văn bản và audio; giữ ở dạng liên kết vì giấy phép phi thương mại.',
    license: 'CC BY-NC-SA 4.0',
    url: 'https://ocw.mit.edu/courses/res-21g-003-learning-chinese-a-foundation-course-in-mandarin-spring-2011/',
  },
] as const;
