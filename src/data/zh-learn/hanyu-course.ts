/** Public catalogue metadata. The supplied revised-edition scans are listed separately below. */
export type HanyuVolume = {
  id: string;
  title: string;
  titleVi: string;
  isbn: string;
  lessonCount: number;
  focus: string;
  publisherUrl: string;
  /** Vocabulary topic slug in the bundled Hanyu revised-edition vocabulary book, when available. */
  vocabularyTopicSlug?: string;
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

/** The six files in the user's Drive folder are the 2006 revised edition. */
export const HANYU_REVISED_VOLUMES: readonly HanyuVolume[] = [
  {
    id: 'rev-1-shang',
    vocabularyTopicSlug: 'book-hanyu-revised-2006-vol-1-shang',
    title: '汉语教程（修订本）第一册 上',
    titleVi: 'Bản sửa đổi · Quyển 1 · Tập trên',
    isbn: '9787561915776',
    lessonCount: 15,
    focus: 'Quyển 1 có 30 bài, chia đều giữa tập trên và tập dưới.',
    publisherUrl: 'https://www.blcup.com/PInfo/index/3903',
  },
  {
    id: 'rev-1-xia',
    vocabularyTopicSlug: 'book-hanyu-revised-2006-vol-1-xia',
    title: '汉语教程（修订本）第一册 下',
    titleVi: 'Bản sửa đổi · Quyển 1 · Tập dưới',
    isbn: '9787561916353',
    lessonCount: 15,
    focus: 'Hoàn tất 30 bài của quyển 1.',
    publisherUrl: 'https://www.blcup.com/PInfo/index/3902',
  },
  {
    id: 'rev-2-shang',
    vocabularyTopicSlug: 'book-hanyu-revised-2006-vol-2-shang',
    title: '汉语教程（修订本）第二册 上',
    titleVi: 'Bản sửa đổi · Quyển 2 · Tập trên',
    isbn: '9787561916360',
    lessonCount: 10,
    focus: 'Quyển 2 có 20 bài, chia đều giữa tập trên và tập dưới.',
    publisherUrl: 'https://www.blcup.com/PInfo/index/3901',
  },
  {
    id: 'rev-2-xia',
    vocabularyTopicSlug: 'book-hanyu-revised-2006-vol-2-xia',
    title: '汉语教程（修订本）第二册 下',
    titleVi: 'Bản sửa đổi · Quyển 2 · Tập dưới',
    isbn: '9787561916377',
    lessonCount: 10,
    focus: 'Hoàn tất 20 bài của quyển 2.',
    publisherUrl: 'https://www.blcup.com/PInfo/index/3900',
  },
  {
    id: 'rev-3-shang',
    vocabularyTopicSlug: 'book-hanyu-revised-2006-vol-3-shang',
    title: '汉语教程（修订本）第三册 上',
    titleVi: 'Bản sửa đổi · Quyển 3 · Tập trên',
    isbn: '9787561916711',
    lessonCount: 13,
    focus: 'Quyển 3 có 26 bài, chia đều giữa tập trên và tập dưới.',
    publisherUrl: 'https://www.blcup.com/PInfo/index/3899',
  },
  {
    id: 'rev-3-xia',
    vocabularyTopicSlug: 'book-hanyu-revised-2006-vol-3-xia',
    title: '汉语教程（修订本）第三册 下',
    titleVi: 'Bản sửa đổi · Quyển 3 · Tập dưới',
    isbn: '9787561916728',
    lessonCount: 13,
    focus: 'Hoàn tất 26 bài của quyển 3.',
    publisherUrl: 'https://www.blcup.com/PInfo/index/3898',
  },
] as const;

export const HANYU_REVISED_VOCAB_BOOK_SLUG = 'book-hanyu-revised-2006';

export const HANYU_REVISED_SERIES_URL = 'https://www.blcup.com/SeriesBook/index/265';
export const HANYU_VI_GLOSS_SOURCE_URL = 'https://github.com/OpenCidian/opencidian-data';
export const HANYU_REVISED_LESSON_TOTAL = HANYU_REVISED_VOLUMES.reduce((total, volume) => total + volume.lessonCount, 0);

export const HANYU_LESSON_TOTAL = HANYU_VOLUMES.reduce((total, volume) => total + volume.lessonCount, 0);

/** The catalogue pages expose structure and counts, not the complete lesson vocabulary. */
export const HANYU_CATALOG_NOTE =
  'Danh mục này là bản 第3版. Bộ sáu PDF bạn gửi là bản 修订本 năm 2006; hai ấn bản có số bài tương tự nhưng khác ISBN và nội dung, nên được theo dõi riêng.';
export const HANYU_LOGIN_NOTE =
  'PDF trong Drive của bạn đủ để OCR, không cần đăng nhập BLCUP. Trang BLCUP công khai thông tin và mẫu thử; tài liệu số đầy đủ có thể cần tài khoản/đơn vị và quyền mua. Không thấy đăng nhập Google.';

/** Separate supplemental sets already available in ReadUp; neither is Hanyu lesson order. */
export const CHINESE_SUPPLEMENTAL_SETS = [
  {
    slug: 'book-hsk-3-0',
    title: 'HSK 3.0 · Từ vựng theo đề cương',
    wordCount: 11_000,
    topicCount: 7,
    unitCount: 220,
    note: 'Theo đề cương HSK công bố năm 2025; đây là bộ ôn thi riêng, không phải danh sách bài Giáo trình Hán ngữ. Trang HSK chính thức hiện công bố ngày áp dụng toàn cầu là 13/12/2026.',
    sourceLinks: [
      { label: 'Đề cương chính thức HSK', url: 'https://www.chinesetest.cn/HSK' },
      { label: 'Đối chiếu dữ liệu HSK · LinZi', url: 'https://www.linzi.app/data/' },
    ],
  },
  {
    slug: 'book-hsk-2021-linzi',
    title: 'Chuẩn HSK 3.0 · GF0025-2021 · LinZi',
    wordCount: 10_960,
    topicCount: 63,
    unitCount: 249,
    note: 'Theo chuẩn GF0025-2021, khác đề cương kỳ thi mới năm 2025. Từ 11.036 dòng nguồn gộp thành 10.960 mục giản thể; giữ các cấp, biến thể phồn thể, cách đọc và nghĩa theo từng mục nguồn. CC BY-SA 4.0, có nghĩa tiếng Anh dựa trên CC-CEDICT.',
    sourceLinks: [
      { label: 'LinZi · HSK 3.0 và ghi công', url: 'https://www.linzi.app/data/' },
      { label: 'Tệp HSK 3.0 JSON', url: 'https://www.linzi.app/data/files/hsk30-words.json' },
      { label: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
      { label: 'CC-CEDICT', url: 'https://cc-cedict.org/wiki/' },
    ],
  },
  {
    slug: 'book-hsk-2-0-community',
    title: 'HSK 2.0 · Danh sách cộng đồng',
    wordCount: 4_991,
    topicCount: 54,
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
    topicCount: 62,
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
    topicCount: 90,
    unitCount: 233,
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
    accessNote: 'Trang học công khai; không cần đăng nhập.',
    url: 'https://open-book-project.github.io/textbooks/open-textbooks/wb-chinese-mandarin/index.html',
  },
  {
    title: 'Learning Chinese · MIT OpenCourseWare',
    detail: 'Giáo trình nhập môn đến trung cấp, gồm văn bản và audio; giữ ở dạng liên kết vì giấy phép phi thương mại.',
    license: 'CC BY-NC-SA 4.0',
    accessNote: 'Trang khóa học công khai; không cần đăng nhập.',
    url: 'https://ocw.mit.edu/courses/res-21g-003-learning-chinese-a-foundation-course-in-mandarin-spring-2011/',
  },
  {
    title: 'Chinese Dialogues · UT Austin COERLL',
    detail: 'Bộ hội thoại sơ cấp có transcript chữ giản thể, phồn thể và bản dịch tiếng Anh dạng PDF.',
    license: 'CC BY',
    accessNote: 'Trang và transcript công khai; không cần đăng nhập. Audio nằm ở liên kết Drive của nguồn.',
    url: 'https://coerll.utexas.edu/coerll/oer/chinese-dialogues-podcast/',
  },
  {
    title: 'Du Chinese · các bài đọc OER được chọn',
    detail: '35 bài đọc tiếng Trung được cấp phép riêng; giấy phép không bao gồm audio, bản dịch hoặc tư liệu phụ.',
    license: 'CC BY-NC-SA 4.0 · chỉ văn bản tiếng Trung',
    accessNote: 'Tải văn bản mở không cần đăng nhập; nội dung chỉ liên kết, chưa sao chép vào ReadUp.',
    url: 'https://duchinese.net/l/oer',
  },
  {
    title: 'EverFlow Mandarin · trình độ trung/cao cấp',
    detail: '10 bài đọc OER cùng bảng từ vựng tổng hợp 550 mục; trang ghi giấy phép phi thương mại, chia sẻ tương tự.',
    license: 'CC BY-NC-SA 4.0',
    accessNote: 'Trang bài học và bảng từ mở công khai; tài liệu được giữ dưới dạng liên kết.',
    url: 'https://www.colorado.edu/project/everflowmandarin/',
  },
  {
    title: 'Elementary Chinese II · Michigan State University',
    detail: 'Sáu chương học kỳ hai, gồm hội thoại, từ vựng, ngữ pháp và ghi chú văn hóa.',
    license: 'CC BY-NC 4.0',
    accessNote: 'Sách mở, PDF/EPUB công khai; không cần đăng nhập.',
    url: 'https://openbooks.lib.msu.edu/chs102/',
  },
  {
    title: 'Mandarin The Wild · bài đọc và từ HSK 2025',
    detail: '446 bài đọc theo cấp HSK và bộ công cụ học từ; giấy phép CC BY-SA 4.0 được ghi rõ cho danh sách từ, không mặc định áp dụng cho bài đọc.',
    license: 'CC BY-SA 4.0 · chỉ danh sách từ',
    accessNote: 'Bài đọc và danh sách công khai; không cần tài khoản để xem hoặc tải danh sách.',
    url: 'https://mandarinthewild.com/teachers',
  },
  {
    title: 'Chinese Grammar Lesson Videos · UT Austin COERLL',
    detail: 'Playlist video các điểm ngữ pháp tiếng Quan thoại cho người mới bắt đầu.',
    license: 'CC BY-NC',
    accessNote: 'Playlist công khai; xem video không cần đăng nhập.',
    url: 'https://www.youtube.com/playlist?list=PLk-cJkZvP2ZiYx-8ONsn8qC27keh6WP7P',
  },
  {
    title: 'Chinese Take-In · bài nghe tương tác UT Austin',
    detail: 'Bài nghe tương tác cho người học năm đầu, có phản hồi tức thời.',
    license: 'CC BY-NC-SA',
    accessNote: 'Trang học công khai; không cần đăng nhập.',
    url: 'https://www.laits.utexas.edu/chinese_take_in/',
  },
] as const;
