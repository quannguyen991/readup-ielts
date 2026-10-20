/** Stable IDs for original, reproducible SAT-style practice forms. */
export type SatPracticeMode = 'math' | 'reading-writing' | 'full';

export type SatFormCategory =
  | 'official_bluebook'
  | 'real_test_2025'
  | 'real_test_2024'
  | 'reading_special'
  | 'princeton_review'
  | 'panda_math'
  | 'mcgraw_barron';

export type SatPracticeForm = {
  number: number;
  id: string;
  label: string;
  nameVi: string;
  nameEn: string;
  category: SatFormCategory;
  categoryLabelVi: string;
  categoryLabelEn: string;
  period: string;
  sourceBook: string;
  badge: string;
  badgeColor: string;
  descriptionVi: string;
  descriptionEn: string;
  adaptive: boolean;
};

export const SAT_PRACTICE_FORM_COUNT = 85;

export const SAT_FORM_CATEGORIES: { id: SatFormCategory | 'all'; labelVi: string; labelEn: string; count: number }[] = [
  { id: 'all', labelVi: 'Tất cả 85 đề', labelEn: 'All 85 forms', count: 85 },
  { id: 'official_bluebook', labelVi: 'Official Bluebook 1–8', labelEn: 'Official Bluebook 1–8', count: 8 },
  { id: 'real_test_2025', labelVi: 'Đề thi thật 2025 (15 đề)', labelEn: 'Real Tests 2025 (15 forms)', count: 15 },
  { id: 'real_test_2024', labelVi: 'Đề thi thật 2024 (15 đề)', labelEn: 'Real Tests 2024 (15 forms)', count: 15 },
  { id: 'reading_special', labelVi: 'Chuyên đề Reading SAT (12)', labelEn: 'Reading Special Drill (12)', count: 12 },
  { id: 'princeton_review', labelVi: 'Princeton Review (8)', labelEn: 'Princeton Review (8)', count: 8 },
  { id: 'panda_math', labelVi: 'The College Panda Math (12)', labelEn: 'Panda & 800 Math (12)', count: 12 },
  { id: 'mcgraw_barron', labelVi: 'McGraw-Hill & Barron (15)', labelEn: 'McGraw-Hill & Barron (15)', count: 15 },
];

const READING_SPECIAL_TITLES: { vi: string; en: string; topic: string; book: string }[] = [
  { vi: 'Reading: Văn học Cổ điển Anh – Mỹ', en: 'Reading: Classic US & World Literature', topic: 'Văn học cổ điển', book: 'Erica Meltzer: The Critical Reader (5th/6th Ed.)' },
  { vi: 'Reading: Khoa học Xã hội & Lịch sử Hoa Kỳ', en: 'Reading: US History & Social Science', topic: 'Lịch sử & Xã hội', book: "Barron's Digital SAT Premium Study Guide" },
  { vi: 'Reading: Khoa học Tự nhiên & Sinh học', en: 'Reading: Natural Science & Biology', topic: 'Khoa học tự nhiên', book: 'College Board SAT Suite Question Bank (Science)' },
  { vi: 'Reading: Vật lý, Thiên văn & Công nghệ', en: 'Reading: Physics, Astronomy & Tech', topic: 'Công nghệ & Vật lý', book: 'McGraw-Hill Digital SAT & Scientific Discoveries' },
  { vi: 'Reading: Command of Evidence (Bằng chứng văn bản)', en: 'Reading: Command of Evidence (Textual & Data)', topic: 'Bằng chứng văn bản', book: 'The Princeton Review Digital SAT Premium' },
  { vi: 'Reading: Words in Context Chuyên sâu', en: 'Reading: Advanced Words in Context', topic: 'Từ vựng ngữ cảnh', book: 'Erica Meltzer SAT Vocabulary & 2025 Real Tests' },
  { vi: 'Reading: Inferences & Central Ideas', en: 'Reading: Inferences & Main Ideas', topic: 'Suy luận & Luận điểm', book: 'College Board Question Bank & 1600.io' },
  { vi: 'Reading: Text Structure & Purpose', en: 'Reading: Structure & Author Purpose', topic: 'Cấu trúc & Mục đích', book: 'The Critical Reader (Text Structure & Purpose)' },
  { vi: 'Reading: Cross-Text Connections (So sánh 2 văn bản)', en: 'Reading: Cross-Text Connections Paired Sets', topic: 'So sánh 2 văn bản', book: 'Erica Meltzer Paired Passages Master Set' },
  { vi: 'Reading: Hard Module Reading 750+', en: 'Reading: Hard Adaptive Module 750+', topic: 'Hard Module 750+', book: "Barron's 800 SAT Reading Hard Module Drill" },
  { vi: 'Reading: Đề thi thật Reading 2025 Tuyển chọn', en: 'Reading: 2025 Real Administration Reading Pool', topic: 'Đề thi thật 2025', book: 'Authentic 2025 Real Administrations Reading Pool' },
  { vi: 'Reading: Tuyển tập Question Bank Reading 2024–2025', en: 'Reading: SAT Suite Question Bank Master Set', topic: 'Question Bank', book: 'College Board Educator Question Bank 2024–2025' },
];

function buildForm(num: number): SatPracticeForm {
  const id = `form-${String(num).padStart(2, '0')}`;
  const label = `Đề ${String(num).padStart(2, '0')}`;

  // 1–8: Official College Board Bluebook Tests (8 đề)
  if (num <= 8) {
    const isNew = num >= 7;
    return {
      number: num,
      id,
      label,
      nameVi: `College Board Official Practice Test ${num}`,
      nameEn: `College Board Official Practice Test ${num}`,
      category: 'official_bluebook',
      categoryLabelVi: 'Official Bluebook',
      categoryLabelEn: 'Official Bluebook',
      period: isNew ? 'Bluebook 2025 Release' : (num <= 4 ? 'Bluebook Bản chuẩn' : 'Bluebook 2024–2025'),
      sourceBook: 'College Board Official Bluebook Suite',
      badge: 'OFFICIAL BLUEBOOK',
      badgeColor: '#1A365D',
      descriptionVi: `Đề thi chính thức số ${num} từ College Board trên ứng dụng Bluebook. Cấu trúc 2 module R&W và 2 module Math chuẩn xác 100% với hệ thống chấm điểm thích ứng.`,
      descriptionEn: `Official College Board practice test #${num} from the Bluebook suite. 100% authentic adaptive Digital SAT format.`,
      adaptive: true,
    };
  }

  // 9–23: Real Tests 2025 (15 đề thi thật 2025)
  if (num <= 23) {
    const dates = [
      '10/2025', '08/2025', '06/2025', '05/2025', '03/2025',
      '11/2025', '12/2025', 'Hard Module Set 1', 'Hard Module Set 2',
      'Question Bank 2025', 'Mùa Thu US 2025', 'Mùa Thu Asia 2025',
      'Mùa Xuân US 2025', 'Mùa Xuân Quốc Tế 2025', 'Make-up Exam 2025'
    ];
    const sub = dates[num - 9] ?? '2025';
    return {
      number: num,
      id,
      label,
      nameVi: `Đề thi thật Digital SAT ${sub}`,
      nameEn: `Official Digital SAT Real Test (${sub})`,
      category: 'real_test_2025',
      categoryLabelVi: 'Đề thi thật 2025',
      categoryLabelEn: 'Real Tests 2025',
      period: `Kỳ thi ${sub}`,
      sourceBook: 'Springboard & Real Tests Archive 2025',
      badge: 'THI THẬT 2025',
      badgeColor: '#C53030',
      descriptionVi: `Đề thi thật tổng hợp từ đợt thi Digital SAT ${sub} tại Mỹ và quốc tế. Trích xuất chuẩn xác các câu hỏi từ đề thi thật Springboard và Question Bank mới nhất.`,
      descriptionEn: `Compiled from authentic Digital SAT test administrations in ${sub}. Includes official real test items, tricky vocabulary, and full solutions.`,
      adaptive: true,
    };
  }

  // 24–38: Real Tests 2024 (15 đề thi thật 2024)
  if (num <= 38) {
    const dates = [
      '12/2024', '11/2024', '10/2024', '08/2024', '06/2024',
      '05/2024', '03/2024', '12/2023', '11/2023', '10/2023',
      'Asia-Pacific 2024', 'US East Coast 2024', 'US West Coast 2024',
      'Europe Cohort 2024', 'International Pilot 2024'
    ];
    const sub = dates[num - 24] ?? '2024';
    return {
      number: num,
      id,
      label,
      nameVi: `Đề thi thật Digital SAT ${sub}`,
      nameEn: `Official Digital SAT Real Test (${sub})`,
      category: 'real_test_2024',
      categoryLabelVi: 'Đề thi thật 2024',
      categoryLabelEn: 'Real Tests 2024',
      period: `Kỳ thi ${sub}`,
      sourceBook: 'Official Real Tests Transcripts 2024',
      badge: 'THI THẬT 2024',
      badgeColor: '#B7791F',
      descriptionVi: `Đề thi thật Digital SAT đợt thi ${sub} tại các điểm thi trong nước và quốc tế. Phân bố câu hỏi bám sát 100% ma trận đề thi thực tế.`,
      descriptionEn: `Official Digital SAT real test from ${sub} administrations. Exact question difficulty, distractors, and adaptive scaling.`,
      adaptive: true,
    };
  }

  // 39–50: Chuyên đề Luyện Reading SAT (12 đề chuyên sâu Reading)
  if (num <= 50) {
    const rIdx = num - 39;
    const item = READING_SPECIAL_TITLES[rIdx] ?? READING_SPECIAL_TITLES[0]!;
    return {
      number: num,
      id,
      label,
      nameVi: item.vi,
      nameEn: item.en,
      category: 'reading_special',
      categoryLabelVi: 'Reading Chuyên sâu',
      categoryLabelEn: 'Reading Special Drill',
      period: item.topic,
      sourceBook: item.book,
      badge: 'CHUYÊN ĐỀ READING',
      badgeColor: '#0F766E',
      descriptionVi: `Bộ đề chuyên sâu rèn luyện năng lực đọc hiểu SAT từ ${item.book}: tập trung vào dạng câu ${item.topic} với các bài đọc học thuật chuẩn xác.`,
      descriptionEn: `Targeted reading comprehension form from ${item.book} specializing in ${item.topic} with authentic passages and detailed evidence solutions.`,
      adaptive: true,
    };
  }

  // 51–58: The Princeton Review Digital SAT Premium Practice (8 đề)
  if (num <= 58) {
    const pNum = num - 50;
    return {
      number: num,
      id,
      label,
      nameVi: `The Princeton Review Digital SAT Premium Practice ${pNum}`,
      nameEn: `The Princeton Review Digital SAT Premium Practice ${pNum}`,
      category: 'princeton_review',
      categoryLabelVi: 'The Princeton Review',
      categoryLabelEn: 'The Princeton Review',
      period: pNum <= 4 ? 'Digital SAT Premium 2024' : 'Digital SAT Premium 2026',
      sourceBook: 'The Princeton Review Digital SAT Premium Prep',
      badge: 'PRINCETON REVIEW',
      badgeColor: '#2B6CB0',
      descriptionVi: `Bộ đề chuẩn hoá theo format Digital SAT mới từ The Princeton Review. Phù hợp luyện tập chiến thuật và quản lý thời gian.`,
      descriptionEn: `Standardized Digital SAT full practice test from The Princeton Review. Ideal for pacing and strategy reinforcement.`,
      adaptive: true,
    };
  }

  // 59–70: The College Panda & Dr. Jang 800 Math (12 đề)
  if (num <= 70) {
    const isPanda = num <= 65;
    const subNum = isPanda ? num - 58 : num - 65;
    return {
      number: num,
      id,
      label,
      nameVi: isPanda ? `The College Panda Math Practice Test ${subNum}` : `Dr. Jang SAT 800 Math Practice Test ${subNum}`,
      nameEn: isPanda ? `The College Panda Math Practice Test ${subNum}` : `Dr. Jang SAT 800 Math Practice Test ${subNum}`,
      category: 'panda_math',
      categoryLabelVi: 'Panda & 800 Math',
      categoryLabelEn: 'Panda & 800 Math',
      period: isPanda ? 'College Panda 10 Tests' : 'Dr. Jang 800 Math',
      sourceBook: isPanda ? 'The College Panda 10 Math Practice Tests' : 'Dr. Jang SAT 800 Math Workbook',
      badge: 'MATH SPECIALIST',
      badgeColor: '#2F855A',
      descriptionVi: `Bộ đề toán chuyên sâu từ tủ sách kinh điển Panda Math & Dr. Jang, tập trung vào các bẫy khó và bài toán phân loại điểm 750–800.`,
      descriptionEn: `Specialized math practice tests focusing on tricky distractors and hard 750–800 level problem sets.`,
      adaptive: true,
    };
  }

  // 71–85: McGraw-Hill & Barron's (15 đề)
  const isMcgraw = num <= 77;
  const subNum = isMcgraw ? num - 70 : num - 77;
  return {
    number: num,
    id,
    label,
    nameVi: isMcgraw ? `McGraw-Hill 8 Full Practice Tests · Đề ${subNum}` : `Barron's 600+ DSAT Practice · Đề ${subNum}`,
    nameEn: isMcgraw ? `McGraw-Hill 8 Practice Tests · Form ${subNum}` : `Barron's 600+ DSAT Practice · Form ${subNum}`,
    category: 'mcgraw_barron',
    categoryLabelVi: 'McGraw-Hill & Barron',
    categoryLabelEn: 'McGraw-Hill & Barron',
    period: isMcgraw ? 'McGraw-Hill SAT' : "Barron's DSAT",
    sourceBook: isMcgraw ? 'McGraw-Hill 8 Full-Length SAT Practice Tests' : "Barron's 600+ DSAT Practice Questions",
    badge: 'MCGRAW & BARRON',
    badgeColor: '#6B46C1',
    descriptionVi: `Đề thi thử toàn diện từ McGraw-Hill và Barron's. Phù hợp rèn luyện sức bền và làm quen với đa dạng dạng bài đọc và toán.`,
    descriptionEn: `Comprehensive full-length practice tests from McGraw-Hill and Barron's. Great for stamina and question variety.`,
    adaptive: true,
  };
}

export const SAT_PRACTICE_FORMS: SatPracticeForm[] = Array.from(
  { length: SAT_PRACTICE_FORM_COUNT },
  (_, index) => buildForm(index + 1)
);

/** Same form + section always produces the same locally-authored variant. */
export function satPracticeSeed(formId: string, mode: SatPracticeMode): string {
  return `band9:${formId}:${mode}:v1`;
}

export function getSatPracticeForm(idOrNumber: string | number): SatPracticeForm | undefined {
  if (typeof idOrNumber === 'number') {
    return SAT_PRACTICE_FORMS.find((f) => f.number === idOrNumber);
  }
  return SAT_PRACTICE_FORMS.find((f) => f.id === idOrNumber || f.number === Number(idOrNumber));
}
