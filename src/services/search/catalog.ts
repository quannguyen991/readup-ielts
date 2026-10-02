/**
 * CHỈ MỤC TÌM BÀI — mọi thứ người học mở được trong app, dựng từ chính các kho
 * dữ liệu thật (không chép tay danh sách bài).
 *
 * Dựng MỘT LẦN rồi giữ lại (`getCatalog`): vài nghìn mục, mất vài mili giây,
 * nhưng không có lý do gì làm lại ở mỗi phím gõ. Máy chủ (`/api/search/ai`) cũng
 * dựng lại đúng chỉ mục này để kiểm mã mục — không tin tiêu đề do client gửi.
 *
 * CỐ Ý KHÔNG import `@/data/articles`: tệp đó kéo theo cả kho thân bài (~7,7 MB
 * JSON) chỉ để có hàm đọc bài. Chỉ mục chỉ cần phần mục lục, nên đọc thẳng
 * `seed/index.json` — nhờ vậy hàm máy chủ không phải mang thân bài theo.
 */
import articleIndex from '@/data/seed/index.json';
import { BILINGUAL_ARTICLES } from '@/data/bilingual-repository';
import { LIBRARY_AUDIO } from '@/data/audio-library';
import { LIBRARY_VIDEOS } from '@/data/video-library';
import { DICTATION_SETS, dictationTopicLabel } from '@/data/dictation-sets';
import { TRANSLATION_SETS } from '@/data/translation-sets';
import { LISTENING_DECKS } from '@/data/vocab-listening';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { WRITING_PROMPTS } from '@/data/writing-repository';
import { SAT_RW_SKILL_LABEL, SAT_RW_UNITS } from '@/data/sat-rw-repository';
import { MATH_LESSONS } from '@/data/lessons/math-lessons';
import { VERBAL_LESSONS } from '@/data/lessons/verbal-lessons';
import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import type { TheoryLesson } from '@/data/lessons/types';
// Lộ trình học theo trình độ: import THẲNG hai tệp dữ liệu, không qua `index.ts`
// của nó (tệp đó kéo `@/data/articles` và cả kho thân bài theo).
import { IELTS_LEVELS } from '@/data/learning-path/ielts';
import { SAT_LEVELS } from '@/data/learning-path/sat';
import type { PathTarget } from '@/data/learning-path/types';
import { CHAPTERS_A } from '@/data/sat-roadmap/chapters-a';
import { CHAPTERS_B } from '@/data/sat-roadmap/chapters-b';
import { SAT_DOMAINS } from '@/data/sat-knowledge';
import { MATH_DOMAIN_LABEL, MATH_SKILL_DOMAIN, MATH_SKILL_LABEL, type MathSkill } from '@/lib/math/types';
import { NAV_GROUPS, NAV_LABEL_EN, type NavItem } from '@/navigation/nav-items';
import { CUE_CARDS, PART1_TOPICS } from '@/services/speaking/bank';
import { PATH_STEPS } from '@/services/writing/translation-path';
import { STEP_EN } from '@/components/writing/translation-step-en';
import { SAT_RW_SKILL_LABEL_EN } from '@/components/sat-rw/skill-label-en';
import type { Bi } from '@/i18n/useL';

import type { SearchEntry, SearchExam, SearchKind, SearchSkill } from './types';

// ---------------------------------------------------------------------------
// Nhãn dùng chung
// ---------------------------------------------------------------------------

/** Từ khoá tự gắn theo kỹ năng — để "nghe" hay "listening" đều ra cùng một nhóm. */
const SKILL_KEYWORDS: Record<SearchSkill, string[]> = {
  reading: ['reading', 'đọc', 'đọc hiểu'],
  listening: ['listening', 'nghe', 'dictation', 'chép chính tả'],
  writing: ['writing', 'viết'],
  speaking: ['speaking', 'nói'],
  vocab: ['vocabulary', 'vocab', 'từ vựng'],
  math: ['math', 'toán', 'sat math'],
  verbal: ['verbal', 'reading and writing', 'sat verbal'],
  general: [],
};

const EXAM_KEYWORDS: Record<SearchExam, string[]> = {
  ielts: ['ielts'],
  sat: ['sat'],
  both: [],
};

/** Chủ đề bài đọc (khớp `TOPICS` trong `data/articles.ts` — chép lại để khỏi kéo thân bài theo). */
const ARTICLE_TOPIC: Record<string, Bi> = {
  environment: { vi: 'Môi trường', en: 'Environment' },
  technology: { vi: 'Công nghệ', en: 'Technology' },
  education: { vi: 'Giáo dục', en: 'Education' },
  health: { vi: 'Sức khoẻ', en: 'Health' },
  science: { vi: 'Khoa học', en: 'Science' },
  business: { vi: 'Kinh doanh', en: 'Business' },
  society: { vi: 'Xã hội', en: 'Society' },
  culture: { vi: 'Văn hoá', en: 'Culture' },
  history: { vi: 'Lịch sử', en: 'History' },
  psychology: { vi: 'Tâm lý học', en: 'Psychology' },
  literature: { vi: 'Văn học', en: 'Literature' },
  work: { vi: 'Công việc', en: 'Work' },
  travel: { vi: 'Du lịch', en: 'Travel' },
  media: { vi: 'Truyền thông', en: 'Media' },
  family: { vi: 'Gia đình', en: 'Family' },
  economy: { vi: 'Kinh tế', en: 'Economy' },
};

const TIER: Record<string, Bi> = {
  p1: { vi: 'Passage 1', en: 'Passage 1' },
  p2: { vi: 'Passage 2', en: 'Passage 2' },
  p3: { vi: 'Passage 3', en: 'Passage 3' },
  short_academic: { vi: 'Bài học thuật ngắn', en: 'Short academic text' },
  sat_short: { vi: 'SAT đoạn ngắn', en: 'SAT short passage' },
  sat_long: { vi: 'SAT đoạn dài', en: 'SAT long passage' },
};

const ESSAY_KIND: Record<string, Bi> = {
  opinion: { vi: 'Nêu quan điểm', en: 'Opinion' },
  discussion: { vi: 'Thảo luận hai mặt', en: 'Discussion' },
  advantage_disadvantage: { vi: 'Lợi và hại', en: 'Advantages & disadvantages' },
  problem_solution: { vi: 'Vấn đề và giải pháp', en: 'Problem & solution' },
  two_part: { vi: 'Câu hỏi hai phần', en: 'Two-part question' },
};

const CHART_KIND: Record<string, Bi> = {
  line: { vi: 'Biểu đồ đường', en: 'Line graph' },
  bar: { vi: 'Biểu đồ cột', en: 'Bar chart' },
  pie: { vi: 'Biểu đồ tròn', en: 'Pie chart' },
  table: { vi: 'Bảng số liệu', en: 'Table' },
  mixed: { vi: 'Biểu đồ kết hợp', en: 'Mixed charts' },
  process: { vi: 'Quy trình', en: 'Process diagram' },
  map: { vi: 'Bản đồ', en: 'Map' },
};

/** Nhãn trình độ có hai thứ tiếng (bài học lý thuyết, độ khó bộ dịch câu). */
const LEVEL_LABEL: Record<string, Bi> = {
  'Nền tảng': { vi: 'Nền tảng', en: 'Foundation' },
  'Trung bình': { vi: 'Trung bình', en: 'Intermediate' },
  'Nâng cao': { vi: 'Nâng cao', en: 'Advanced' },
  easy: { vi: 'Dễ', en: 'Easy' },
  medium: { vi: 'Vừa', en: 'Medium' },
  hard: { vi: 'Khó', en: 'Hard' },
};

/** Kỹ năng SAT Verbal thuộc mảng ngữ pháp (Standard English Conventions + từ nối). */
const GRAMMAR_SKILLS = new Set(['boundaries', 'form', 'pronoun', 'tense', 'possessive', 'transition']);

const GRAMMAR_KEYWORDS = ['grammar', 'ngữ pháp', 'conventions'];

const MATH_DOMAIN_VI: Record<string, string> = {
  algebra: 'Đại số',
  advanced_math: 'Toán nâng cao',
  problem_solving_data: 'Số liệu & tỉ lệ',
  geometry_trig: 'Hình học & lượng giác',
};

// ---------------------------------------------------------------------------
// Trang / mục trong app
// ---------------------------------------------------------------------------

/** Kỳ thi và kỹ năng của từng mục điều hướng, theo khoá. */
const PAGE_META: Record<string, { exam?: SearchExam; skill?: SearchSkill; keywords?: string[] }> = {
  home: { keywords: ['trang chủ', 'giới thiệu', 'home'] },
  dashboard: { keywords: ['hôm nay', 'today', 'bắt đầu'] },
  plan: { keywords: ['lộ trình', 'kế hoạch', 'plan', 'study plan'] },
  'learning-path': { keywords: ['lộ trình học', 'trình độ', 'learning path', 'level', 'part', 'theo chủ đề'] },
  progress: { keywords: ['tiến độ', 'thống kê', 'progress'] },
  errors: { keywords: ['lỗi sai', 'câu sai', 'mistakes'] },
  mastery: { keywords: ['bằng chứng', 'mastery'] },
  ielts: { exam: 'ielts', skill: 'reading', keywords: ['ielts', 'luyện tập', 'practice', 'reading'] },
  'mock-tests': { exam: 'ielts', skill: 'reading', keywords: ['thi thử', 'mock test', 'reading test', 'full test'] },
  library: { exam: 'both', skill: 'reading', keywords: ['kho bài đọc', 'library', 'passage'] },
  bilingual: { exam: 'ielts', skill: 'reading', keywords: ['song ngữ', 'bilingual', 'báo', 'news'] },
  writing: { exam: 'ielts', skill: 'writing', keywords: ['task 1', 'task 2', 'essay', 'bài luận', 'chấm bài'] },
  sentence: { exam: 'ielts', skill: 'listening', keywords: ['nghe chép', 'dictation', 'listening'] },
  'dictation-sets': { exam: 'ielts', skill: 'listening', keywords: ['bộ đề', 'chép chính tả', 'dictation sets'] },
  'dictation-youtube': { exam: 'ielts', skill: 'listening', keywords: ['youtube', 'video', 'chép theo video'] },
  shadow: { exam: 'ielts', skill: 'speaking', keywords: ['shadowing', 'voa', 'đọc theo', 'nhại giọng', 'phát âm'] },
  speaking: { exam: 'ielts', skill: 'speaking', keywords: ['part 1', 'part 2', 'part 3', 'giám khảo', 'luyện nói'] },
  sat: { exam: 'sat', keywords: ['sat'] },
  'sat-home': { exam: 'sat', keywords: ['tổng quan sat', 'hướng dẫn', 'bốn bước', 'sat overview', 'bắt đầu'] },
  math: { exam: 'sat', skill: 'math', keywords: ['sat math', 'toán', 'bộ đề toán'] },
  'sat-rw': { exam: 'sat', skill: 'verbal', keywords: ['sat verbal', 'reading and writing', 'rw', 'ngữ pháp', 'grammar'] },
  'sat-full-test': { exam: 'sat', keywords: ['thi thử', 'full test', 'mock', 'đề đầy đủ', '98 câu'] },
  vocabulary: { skill: 'vocab', keywords: ['từ vựng', 'quiz', 'flashcard'] },
  'vocab-book': { skill: 'vocab', keywords: ['sổ từ', 'word book', 'từ đã lưu'] },
  'vocab-topics': { exam: 'ielts', skill: 'vocab', keywords: ['chủ đề', 'topics', 'ielts vocabulary'] },
  'vocab-sat-quiz': { exam: 'sat', skill: 'vocab', keywords: ['sat vocabulary', 'từ vựng sat'] },
  'vocab-import': { skill: 'vocab', keywords: ['dán văn bản', 'import', 'học từ bài'] },
  'vocab-garden': { skill: 'vocab', keywords: ['vườn từ', 'garden'] },
  notes: { keywords: ['ghi chú', 'notes'] },
  bookmarks: { keywords: ['đã lưu', 'bookmark', 'saved'] },
  quest: { keywords: ['game', 'trò chơi', 'quest'] },
  'quest-city': { keywords: ['thành phố', 'city', '3d'] },
  'quest-rail': { skill: 'vocab', keywords: ['bay', 'máy bay', 'thành phố', 'flight', 'fly over cities', 'từ vựng'] },
  'quest-travel': { skill: 'vocab', keywords: ['du ngoạn', 'du lịch', 'thế giới', 'vé máy bay', 'travel', 'world', 'passport', 'hộ chiếu', 'singapore', 'london', 'paris', 'rome', 'amsterdam', 'hà nội', 'đà nẵng', 'hồ chí minh', 'sài gòn', 'vietnam'] },
  'quest-world': { keywords: ['bản đồ', 'map', 'đảo'] },
  'quest-hero': { keywords: ['nhân vật', 'nhiệm vụ', 'hero'] },
  leaderboard: { keywords: ['xếp hạng', 'bảng xếp hạng', 'leaderboard'] },
  weekly: { exam: 'sat', keywords: ['đề tuần', 'weekly challenge', 'thử thách'] },
  duel: { keywords: ['đấu', 'thách đấu', 'duel', 'pvp'] },
  shop: { keywords: ['đổi quà', 'sao', 'shop', 'stars'] },
  me: { keywords: ['hồ sơ', 'profile', 'cá nhân'] },
  invite: { keywords: ['mời bạn', 'giới thiệu', 'referral'] },
  upgrade: { keywords: ['nâng cấp', 'gói', 'premium', 'pro', 'giá'] },
  settings: { keywords: ['cài đặt', 'settings', 'ngôn ngữ'] },
  observatory: { keywords: ['chất lượng đề', 'ai'] },
  teacher: { keywords: ['giáo viên', 'lớp học', 'teacher', 'class'] },
  'join-class': { keywords: ['mã lớp', 'vào lớp', 'join'] },
};

/** Trang không có trong thanh bên nhưng người học vẫn hay tìm. */
const EXTRA_PAGES: {
  key: string;
  title: Bi;
  subtitle?: Bi;
  href: string;
  kind?: SearchKind;
  exam: SearchExam;
  skill: SearchSkill;
  keywords: string[];
}[] = [
  { key: 'practice-mixed', title: { vi: 'Luyện xen kẽ dạng bài Reading', en: 'Mixed Reading question types' }, href: '/practice-mixed', exam: 'ielts', skill: 'reading', keywords: ['true false not given', 'matching headings', 'điền từ', 'xen kẽ', 'question types'] },
  { key: 'travel-singapore', title: { vi: 'Du ngoạn: Singapore', en: 'Travel: Singapore' }, subtitle: { vi: 'Tiếng Anh du lịch theo địa điểm', en: 'Travel English, place by place' }, href: '/quest/du-ngoan/singapore', exam: 'both', skill: 'vocab', keywords: ['du ngoạn', 'du lịch', 'travel', 'changi', 'mrt', 'hawker', 'marina bay'] },
  { key: 'travel-london', title: { vi: 'Du ngoạn: London', en: 'Travel: London' }, subtitle: { vi: 'Tiếng Anh du lịch theo địa điểm', en: 'Travel English, place by place' }, href: '/quest/du-ngoan/london', exam: 'both', skill: 'vocab', keywords: ['du ngoạn', 'du lịch', 'travel', 'big ben', 'tube', 'heathrow'] },
  { key: 'travel-paris', title: { vi: 'Du ngoạn: Paris', en: 'Travel: Paris' }, subtitle: { vi: 'Tiếng Anh du lịch theo địa điểm', en: 'Travel English, place by place' }, href: '/quest/du-ngoan/paris', exam: 'both', skill: 'vocab', keywords: ['du ngoạn', 'du lịch', 'travel', 'eiffel', 'louvre'] },
  { key: 'travel-amsterdam', title: { vi: 'Du ngoạn: Amsterdam', en: 'Travel: Amsterdam' }, subtitle: { vi: 'Tiếng Anh du lịch theo địa điểm', en: 'Travel English, place by place' }, href: '/quest/du-ngoan/amsterdam', exam: 'both', skill: 'vocab', keywords: ['du ngoạn', 'du lịch', 'travel', 'canal', 'tulip'] },
  { key: 'travel-rome', title: { vi: 'Du ngoạn: Rome', en: 'Travel: Rome' }, subtitle: { vi: 'Tiếng Anh du lịch theo địa điểm', en: 'Travel English, place by place' }, href: '/quest/du-ngoan/rome', exam: 'both', skill: 'vocab', keywords: ['du ngoạn', 'du lịch', 'travel', 'colosseum', 'trevi', 'vatican'] },
  { key: 'travel-danang', title: { vi: 'Du ngoạn: Đà Nẵng', en: 'Travel: Da Nang' }, subtitle: { vi: 'Tiếng Anh du lịch theo địa điểm', en: 'Travel English, place by place' }, href: '/quest/du-ngoan/danang', exam: 'both', skill: 'vocab', keywords: ['du ngoạn', 'du lịch', 'travel', 'đà nẵng', 'da nang', 'cầu rồng', 'dragon bridge', 'hội an'] },
  { key: 'travel-hochiminh', title: { vi: 'Du ngoạn: TP. Hồ Chí Minh', en: 'Travel: Ho Chi Minh City' }, subtitle: { vi: 'Tiếng Anh du lịch theo địa điểm', en: 'Travel English, place by place' }, href: '/quest/du-ngoan/hochiminh', exam: 'both', skill: 'vocab', keywords: ['du ngoạn', 'du lịch', 'travel', 'sài gòn', 'saigon', 'hồ chí minh', 'bến thành', 'bánh mì'] },
  { key: 'travel-airport', title: { vi: 'Quầy đổi vé máy bay', en: 'Ticket counter' }, href: '/quest/du-ngoan/airport', exam: 'both', skill: 'vocab', keywords: ['vé', 'hải quan', 'customs', 'tickets', 'du ngoạn'] },
  { key: 'travel-passport', title: { vi: 'Hộ chiếu du ngoạn: tem, quà, xếp hạng', en: 'Travel passport: stamps, rewards, ranking' }, href: '/quest/du-ngoan/passport', exam: 'both', skill: 'general', keywords: ['hộ chiếu', 'con dấu', 'điểm hộ chiếu', 'passport', 'stamp', 'pro max', 'ai đi nhiều nhất', 'xếp hạng du ngoạn'] },
  { key: 'travel-suitcase', title: { vi: 'Vali quà lưu niệm', en: 'Souvenir suitcase' }, href: '/quest/du-ngoan/suitcase', exam: 'both', skill: 'general', keywords: ['vali', 'quà', 'suitcase', 'souvenir'] },
  { key: 'paste', title: { vi: 'Đọc văn bản tự dán', en: 'Read your own text' }, href: '/paste', exam: 'both', skill: 'reading', keywords: ['dán', 'paste', 'văn bản riêng'] },
  // Bốn trang dưới rời thanh bên ngày 01/10/2026 (nhóm SAT gọn còn 4 mục) — vẫn tìm được.
  { key: 'math-learn', title: { vi: 'Bài học SAT Math', en: 'SAT Math lessons' }, href: '/math/learn', exam: 'sat', skill: 'math', keywords: ['lý thuyết', 'bài học', 'lessons'] },
  { key: 'sat-roadmap', title: { vi: 'Lộ trình SAT Math 27 chương', en: 'SAT Math roadmap (27 chapters)' }, href: '/sat/lo-trinh', kind: 'path', exam: 'sat', skill: 'math', keywords: ['lộ trình', 'roadmap', 'college panda', 'chương'] },
  { key: 'sat-knowledge', title: { vi: 'Kiến thức SAT', en: 'SAT essentials' }, href: '/sat/kien-thuc', exam: 'sat', skill: 'general', keywords: ['kiến thức', 'cấu trúc đề', 'format', 'domain', 'chiến thuật'] },
  { key: 'sat-rw-learn', title: { vi: 'Bài học SAT Verbal', en: 'SAT Verbal lessons' }, href: '/sat-rw/learn', exam: 'sat', skill: 'verbal', keywords: ['lý thuyết', 'bài học', 'lessons'] },
  { key: 'math-diagnostic', title: { vi: 'Bài chẩn đoán SAT Math', en: 'SAT Math diagnostic' }, subtitle: { vi: '19 câu, mỗi kỹ năng một câu', en: '19 questions, one per skill' }, href: '/math/diagnostic', kind: 'test', exam: 'sat', skill: 'math', keywords: ['chẩn đoán', 'kiểm tra đầu vào', 'diagnostic', 'placement'] },
  { key: 'math-mock', title: { vi: 'Thi thử SAT Math (2 module)', en: 'SAT Math mock test (2 modules)' }, href: '/math/mock', kind: 'test', exam: 'sat', skill: 'math', keywords: ['thi thử', 'mock', 'module', 'adaptive'] },
  { key: 'math-vocab', title: { vi: 'Thuật ngữ SAT Math', en: 'SAT Math terminology' }, href: '/math/vocab', kind: 'vocab', exam: 'sat', skill: 'vocab', keywords: ['thuật ngữ', 'từ vựng toán', 'math vocabulary', 'terms'] },
  { key: 'math-learn-vocab', title: { vi: 'Bài từ vựng SAT Math', en: 'SAT Math vocabulary lessons' }, href: '/math/learn?tab=vocab', kind: 'vocab', exam: 'sat', skill: 'vocab', keywords: ['từ vựng toán', 'math vocabulary'] },
  { key: 'sat-rw-learn-vocab', title: { vi: 'Bài từ vựng SAT Verbal', en: 'SAT Verbal vocabulary lessons' }, href: '/sat-rw/learn?tab=vocab', kind: 'vocab', exam: 'sat', skill: 'vocab', keywords: ['từ vựng sat', 'words in context'] },
  { key: 'sat-rw-mix', title: { vi: 'Đề trộn SAT Verbal (12 câu)', en: 'Mixed SAT Verbal sets (12 questions)' }, href: '/sat-rw/mix/satrw-mix-01', kind: 'test', exam: 'sat', skill: 'verbal', keywords: ['đề trộn', 'mixed', 'tổng hợp', 'module'] },
  { key: 'dictation', title: { vi: 'Chép chính tả từng câu', en: 'Sentence dictation' }, href: '/sentence/dictation', exam: 'ielts', skill: 'listening', keywords: ['chép chính tả', 'dictation', 'nghe điền'] },
  { key: 'translate', title: { vi: 'Dịch câu Việt → Anh', en: 'Translate sentences (VI → EN)' }, href: '/sentence/translate', exam: 'ielts', skill: 'writing', keywords: ['dịch', 'translate', 'translation', 'viết câu'] },
  { key: 'audio-library', title: { vi: 'Thư viện nghe VOA', en: 'VOA listening library' }, subtitle: { vi: '251 bài nghe có lời', en: '251 listening pieces with transcripts' }, href: '/sentence/audio', exam: 'ielts', skill: 'listening', keywords: ['voa', 'podcast', 'audio', 'nghe hiểu'] },
  { key: 'video-library', title: { vi: 'Thư viện video', en: 'Video library' }, href: '/sentence/videos', exam: 'ielts', skill: 'listening', keywords: ['video', 'youtube', '6 minute english', 'bbc'] },
  { key: 'write-tests', title: { vi: 'Kho đề Writing', en: 'Writing prompt bank' }, href: '/write/tests', exam: 'ielts', skill: 'writing', keywords: ['đề writing', 'task 1', 'task 2', 'prompts'] },
  { key: 'write-sat', title: { vi: 'Viết câu SAT', en: 'SAT sentence writing' }, href: '/write/sat', exam: 'sat', skill: 'writing', keywords: ['sat writing', 'viết sat'] },
  { key: 'write-translation', title: { vi: 'Lộ trình luyện dịch', en: 'Translation path' }, subtitle: { vi: '5 bước từ câu đơn tới trọn đoạn', en: '5 steps from single sentences to full paragraphs' }, href: '/write/translation', kind: 'path', exam: 'ielts', skill: 'writing', keywords: ['luyện dịch', 'translation', 'dịch đoạn'] },
  { key: 'spaced-repetition', title: { vi: 'Ôn từ theo lịch (lặp lại ngắt quãng)', en: 'Spaced repetition review' }, href: '/vocabulary/spaced-repetition', exam: 'both', skill: 'vocab', keywords: ['ôn tập', 'flashcard', 'srs', 'review', 'lặp lại'] },
];

// ---------------------------------------------------------------------------
// Dựng chỉ mục
// ---------------------------------------------------------------------------

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  topic: string;
  exam: 'ielts' | 'sat';
  passageTier: string | null;
  licenseType: string;
  cefrLevel: string | null;
  bandRange: string | null;
  satTextType: string | null;
  summary: string | null;
};

function same(text: string): Bi {
  return { vi: text, en: text };
}

function humanize(slug: string): string {
  const text = slug.replace(/[-_]+/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Câu đầu của đề Writing, cắt gọn làm tiêu đề. */
function promptTitle(text: string): string {
  const first = (text.split(/(?<=[.?!])\s/)[0] ?? text).trim();
  return first.length > 96 ? `${first.slice(0, 93).trimEnd()}…` : first;
}

function lessonEntries(
  lessons: readonly TheoryLesson[],
  prefix: 'math' | 'rw',
): SearchEntry[] {
  return lessons.map((lesson) => {
    const math = prefix === 'math';
    const grammar = !math && GRAMMAR_SKILLS.has(lesson.skill);
    return {
      id: `lesson-${prefix}:${lesson.skill}`,
      kind: 'lesson',
      title: { vi: lesson.title, en: lesson.englishName },
      subtitle: {
        vi: `${math ? 'Bài học SAT Math' : 'Bài học SAT Verbal'} · ${lesson.minutes} phút`,
        en: `${math ? 'SAT Math lesson' : 'SAT Verbal lesson'} · ${lesson.minutes} min`,
      },
      keywords: [
        lesson.englishName,
        lesson.goal,
        'lý thuyết',
        'theory',
        'bài học',
        ...(math ? [MATH_DOMAIN_LABEL[MATH_SKILL_DOMAIN[lesson.skill as MathSkill]] ?? ''] : []),
        ...(grammar ? GRAMMAR_KEYWORDS : []),
      ],
      exam: 'sat',
      skill: math ? 'math' : 'verbal',
      level: lesson.level,
      href: math ? `/math/learn/${lesson.skill}` : `/sat-rw/learn/${lesson.skill}`,
    };
  });
}

/** Loại mục + kỹ năng + đường dẫn cho đích của một bài trong Lộ trình học. */
function pathTarget(
  t: PathTarget,
  articleIdBySlug: Map<string, string>,
): { skill: SearchSkill; href: string } | null {
  const e = encodeURIComponent;
  switch (t.kind) {
    case 'vocab':
      return { skill: 'vocab', href: `/vocabulary/topic/${e(t.slug)}` };
    case 'sat-vocab':
      return { skill: 'vocab', href: `/vocabulary/sat-quiz/${e(t.slug)}` };
    case 'read': {
      const id = articleIdBySlug.get(t.slug);
      return id ? { skill: 'reading', href: `/read/${e(id)}` } : null;
    }
    case 'bilingual':
      return { skill: 'reading', href: `/bilingual/${e(t.id)}` };
    case 'dictation':
      return { skill: 'listening', href: `/sentence/dictation?set=${e(t.set)}` };
    case 'translate':
      return { skill: 'writing', href: `/sentence/translate?set=${e(t.set)}` };
    case 'write':
      return { skill: 'writing', href: `/write/${e(t.prompt)}` };
    case 'speak':
      return {
        skill: 'speaking',
        href: t.part === 'p1' ? `/speaking?mode=p1&p1=${e(t.topic)}` : `/speaking?mode=${t.part}&cue=${e(t.topic)}`,
      };
    case 'math-lesson':
      return { skill: 'math', href: `/math/learn/${e(t.skill)}` };
    case 'math-set':
      return { skill: 'math', href: `/math/set/${e(t.set)}` };
    case 'sat-chapter':
      return { skill: 'math', href: `/sat/lo-trinh/${e(t.id)}` };
    case 'rw-lesson':
      return { skill: 'verbal', href: `/sat-rw/learn/${e(t.skill)}` };
    case 'rw-set':
      return { skill: 'verbal', href: `/sat-rw/set/${e(t.set)}` };
    default:
      return null;
  }
}

function buildEntries(): SearchEntry[] {
  const out: SearchEntry[] = [];

  // ---- Mục trong thanh điều hướng
  const walk = (item: NavItem, parent: NavItem | null) => {
    const meta = PAGE_META[item.key] ?? PAGE_META[parent?.key ?? ''] ?? {};
    const parentLabel: Bi | undefined = parent
      ? { vi: parent.label, en: NAV_LABEL_EN[parent.key] ?? parent.label }
      : undefined;
    out.push({
      id: `page:${item.key}`,
      kind: 'page',
      title: { vi: item.label, en: NAV_LABEL_EN[item.key] ?? item.label },
      subtitle: parentLabel,
      keywords: [...(PAGE_META[item.key]?.keywords ?? [])],
      exam: meta.exam ?? (parent?.key === 'sat' ? 'sat' : parent?.key === 'ielts' ? 'ielts' : 'both'),
      skill: PAGE_META[item.key]?.skill ?? 'general',
      href: item.href,
    });
    for (const child of item.children ?? []) walk(child, item);
  };
  for (const group of NAV_GROUPS) for (const item of group.items) walk(item, null);

  for (const page of EXTRA_PAGES) {
    out.push({
      id: `page:${page.key}`,
      kind: page.kind ?? 'page',
      title: page.title,
      subtitle: page.subtitle,
      keywords: page.keywords,
      exam: page.exam,
      skill: page.skill,
      href: page.href,
    });
  }

  // ---- Kiến thức SAT: gắn tên mảng kiến thức làm từ khoá cho trang /sat/kien-thuc
  const knowledge = out.find((e) => e.id === 'page:sat-knowledge');
  if (knowledge) {
    knowledge.keywords.push(...SAT_DOMAINS.flatMap((d) => [d.vi, d.en]));
  }

  // ---- Lộ trình SAT Math theo chương
  for (const chapter of [...CHAPTERS_A, ...CHAPTERS_B]) {
    out.push({
      id: `roadmap:${chapter.id}`,
      kind: 'path',
      title: chapter.title,
      subtitle: {
        vi: `Lộ trình SAT Math · Chương ${chapter.n}`,
        en: `SAT Math roadmap · Chapter ${chapter.n}`,
      },
      keywords: chapter.subtopics.flatMap((s) => [s.vi, s.en]),
      exam: 'sat',
      skill: 'math',
      level: `Ch. ${chapter.n}`,
      href: `/sat/lo-trinh/${chapter.id}`,
    });
  }

  // ---- Lộ trình học theo trình độ (mỗi trình độ một mục + từng bài trong đó)
  const articleIdBySlug = new Map((articleIndex as unknown as ArticleRow[]).map((a) => [a.slug, a.id]));
  for (const level of [...IELTS_LEVELS, ...SAT_LEVELS]) {
    const examName = level.exam === 'ielts' ? 'IELTS' : 'SAT';
    out.push({
      id: `lp-level:${level.id}`,
      kind: 'path',
      title: { vi: `Lộ trình học ${examName} ${level.label}: ${level.title.vi}`, en: `${examName} ${level.label} path: ${level.title.en}` },
      subtitle: level.blurb,
      keywords: ['lộ trình học', 'learning path', 'trình độ', level.label, ...level.parts.flatMap((p) => [p.title.vi, p.title.en])],
      exam: level.exam,
      skill: 'general',
      level: level.label,
      href: '/lo-trinh-hoc',
    });
    for (const part of level.parts) {
      for (const node of part.nodes) {
        const target = pathTarget(node.target, articleIdBySlug);
        if (!target) continue;
        out.push({
          id: `lp:${node.id}`,
          kind: 'path',
          title: node.title,
          subtitle: {
            vi: `Lộ trình ${examName} ${level.label} · ${part.title.vi}`,
            en: `${examName} ${level.label} path · ${part.title.en}`,
          },
          keywords: [part.title.vi, part.title.en, 'lộ trình học', 'learning path'],
          exam: level.exam,
          skill: target.skill,
          level: level.label,
          href: target.href,
        });
      }
    }
  }

  // ---- Bài học lý thuyết SAT
  out.push(...lessonEntries(MATH_LESSONS, 'math'));
  out.push(...lessonEntries(VERBAL_LESSONS, 'rw'));

  // ---- Luyện theo kỹ năng SAT Math (ngân hàng câu theo kỹ năng)
  const mathTitleVi = new Map(MATH_LESSONS.map((l) => [l.skill, l.title]));
  for (const skill of Object.keys(MATH_SKILL_LABEL) as MathSkill[]) {
    const domain = MATH_SKILL_DOMAIN[skill];
    out.push({
      id: `math-drill:${skill}`,
      kind: 'practice',
      title: { vi: `Luyện: ${mathTitleVi.get(skill) ?? MATH_SKILL_LABEL[skill]}`, en: `Drill: ${MATH_SKILL_LABEL[skill]}` },
      subtitle: { vi: `SAT Math · ${MATH_DOMAIN_VI[domain] ?? domain}`, en: `SAT Math · ${MATH_DOMAIN_LABEL[domain]}` },
      keywords: [MATH_SKILL_LABEL[skill], mathTitleVi.get(skill) ?? '', 'bộ đề', 'luyện tập', 'drill'],
      exam: 'sat',
      skill: 'math',
      href: `/math/drill/${skill}`,
    });
  }

  // ---- SAT Verbal: kỹ năng + unit
  for (const [skill, vi] of Object.entries(SAT_RW_SKILL_LABEL)) {
    const grammar = GRAMMAR_SKILLS.has(skill);
    out.push({
      id: `rw-skill:${skill}`,
      kind: 'practice',
      title: { vi: `Luyện: ${vi}`, en: `Drill: ${SAT_RW_SKILL_LABEL_EN[skill] ?? vi}` },
      subtitle: { vi: 'SAT Verbal · luyện theo kỹ năng', en: 'SAT Verbal · skill practice' },
      keywords: [SAT_RW_SKILL_LABEL_EN[skill] ?? '', 'luyện tập', 'drill', ...(grammar ? GRAMMAR_KEYWORDS : [])],
      exam: 'sat',
      skill: 'verbal',
      href: `/sat-rw/skill/${skill}`,
    });
  }
  for (const unit of SAT_RW_UNITS) {
    const grammar = unit.domain === 'Standard English Conventions';
    out.push({
      id: `rw-unit:${unit.unit}`,
      kind: 'practice',
      title: { vi: `Unit ${unit.unit}: ${unit.title}`, en: `Unit ${unit.unit}: ${unit.domain}` },
      subtitle: { vi: `SAT Verbal · ${unit.count} câu`, en: `SAT Verbal · ${unit.count} questions` },
      keywords: [unit.domain, unit.title, 'unit', ...(grammar ? GRAMMAR_KEYWORDS : [])],
      exam: 'sat',
      skill: 'verbal',
      href: `/sat-rw/${unit.unit}`,
    });
  }

  // ---- Từ vựng
  for (const topic of VOCAB_TOPICS) {
    out.push({
      id: `vocab:${topic.slug}`,
      kind: 'vocab',
      title: { vi: topic.nameVi, en: topic.name },
      subtitle: {
        vi: `Từ vựng IELTS theo chủ đề · ${topic.words.length} từ`,
        en: `IELTS topic vocabulary · ${topic.words.length} words`,
      },
      keywords: [topic.name, topic.nameVi, 'chủ đề', 'topic'],
      exam: 'ielts',
      skill: 'vocab',
      href: `/vocabulary/topic/${topic.slug}`,
    });
  }
  for (const deck of LISTENING_DECKS) {
    out.push({
      id: `vocab:${deck.slug}`,
      kind: 'vocab',
      title: { vi: `Nghe IELTS · ${deck.nameVi}`, en: `IELTS listening · ${deck.name}` },
      subtitle: {
        vi: `Từ vựng nghe IELTS · ${deck.words.length} từ`,
        en: `IELTS listening vocabulary · ${deck.words.length} words`,
      },
      keywords: [deck.name, deck.nameVi, 'listening', 'nghe', 'từ vựng nghe', 'ielts listening'],
      exam: 'ielts',
      skill: 'vocab',
      href: `/vocabulary/topic/${deck.slug}`,
    });
  }
  for (const lesson of SAT_VOCAB_LESSONS) {
    const math = lesson.subject === 'math';
    out.push({
      id: `sat-vocab:${lesson.slug}`,
      kind: 'vocab',
      title: same(`${math ? 'SAT Math' : 'SAT Verbal'} · ${lesson.title}`),
      subtitle: {
        vi: `Từ vựng SAT · ${lesson.words.length} từ`,
        en: `SAT vocabulary · ${lesson.words.length} words`,
      },
      keywords: [lesson.title, math ? 'thuật ngữ toán' : 'words in context'],
      exam: 'sat',
      skill: 'vocab',
      href: `/vocabulary/topic/${lesson.slug}`,
    });
  }

  // ---- Bài đọc (bỏ các mục chỉ là link đề chính thức: không mở được trong app)
  for (const a of articleIndex as unknown as ArticleRow[]) {
    if (a.licenseType === 'headline_only' || !a.passageTier || !TIER[a.passageTier]) continue;
    const topic = ARTICLE_TOPIC[a.topic];
    const tier = TIER[a.passageTier]!;
    out.push({
      id: `read:${a.id}`,
      kind: 'reading',
      title: same(a.title),
      subtitle: {
        vi: [tier.vi, topic?.vi].filter(Boolean).join(' · '),
        en: [tier.en, topic?.en].filter(Boolean).join(' · '),
      },
      keywords: [a.topic, ...(topic ? [topic.vi] : []), tier.en, a.satTextType ?? ''],
      exam: a.exam,
      skill: 'reading',
      level: a.exam === 'ielts' ? (a.bandRange ?? a.cefrLevel ?? undefined) : (a.cefrLevel ?? undefined),
      href: `/read/${a.id}`,
    });
  }

  for (const b of BILINGUAL_ARTICLES) {
    out.push({
      id: `bilingual:${b.id}`,
      kind: 'reading',
      title: { vi: b.titleVi, en: b.titleEn },
      subtitle: { vi: `Đọc song ngữ · ${b.topic}`, en: `Bilingual reading · ${b.estMinutes} min` },
      keywords: [b.titleEn, b.titleVi, b.topic, 'song ngữ', 'bilingual'],
      exam: 'ielts',
      skill: 'reading',
      level: b.level,
      href: `/bilingual/${b.id}`,
    });
  }

  // ---- Nghe
  for (const set of DICTATION_SETS) {
    out.push({
      id: `dictation:${set.id}`,
      kind: 'listening',
      title: { vi: set.title, en: set.titleEn },
      subtitle: {
        vi: `Chép chính tả · ${set.topic}`,
        en: `Dictation · ${dictationTopicLabel(set.topic, true)}`,
      },
      keywords: [set.titleEn, set.topic, dictationTopicLabel(set.topic, true), set.blurb],
      exam: 'ielts',
      skill: 'listening',
      level: set.level,
      href: `/sentence/dictation?set=${encodeURIComponent(set.id)}`,
    });
  }
  for (const audio of LIBRARY_AUDIO) {
    out.push({
      id: `voa:${audio.id}`,
      kind: 'listening',
      title: same(audio.title),
      subtitle: { vi: `Nghe VOA · ${audio.program}`, en: `VOA listening · ${audio.program}` },
      keywords: [audio.program, audio.topic, 'voa'],
      exam: 'ielts',
      skill: 'listening',
      level: audio.level,
      href: `/sentence/listen?a=${encodeURIComponent(audio.id)}`,
    });
  }
  for (const video of LIBRARY_VIDEOS) {
    out.push({
      id: `video:${video.id}`,
      kind: 'listening',
      title: same(video.title),
      subtitle: { vi: `Chép theo video · ${video.channel}`, en: `Video dictation · ${video.channel}` },
      keywords: [video.channel, video.topic, 'video', 'youtube'],
      exam: 'ielts',
      skill: 'listening',
      level: video.level,
      href: `/sentence/youtube?v=${encodeURIComponent(video.id)}`,
    });
  }

  // ---- Writing + dịch
  for (const p of WRITING_PROMPTS) {
    const task1 = p.task === 'ielts_task1';
    const kind = task1 ? CHART_KIND[p.chartKind ?? ''] : ESSAY_KIND[p.essayKind ?? ''];
    const topic = ARTICLE_TOPIC[p.topicSlug];
    const taskLabel = task1 ? 'Task 1' : 'Task 2';
    out.push({
      id: `writing:${p.id}`,
      kind: 'writing',
      title: same(promptTitle(p.promptText)),
      subtitle: {
        vi: [`IELTS Writing ${taskLabel}`, kind?.vi, topic?.vi].filter(Boolean).join(' · '),
        en: [`IELTS Writing ${taskLabel}`, kind?.en, topic?.en].filter(Boolean).join(' · '),
      },
      keywords: [
        task1 ? 'task 1' : 'task 2',
        task1 ? 'academic task 1' : 'essay',
        ...(kind ? [kind.vi, kind.en] : []),
        ...(topic ? [topic.vi, topic.en] : [p.topicSlug]),
        p.chartKind ?? '',
      ],
      exam: 'ielts',
      skill: 'writing',
      level: `Band ${p.difficultyBand}`,
      href: `/write/${p.id}`,
    });
  }
  for (const step of PATH_STEPS) {
    const en = STEP_EN[step.id];
    out.push({
      id: `translation-step:${step.id}`,
      kind: 'path',
      title: { vi: `Luyện dịch bước ${step.order}: ${step.title}`, en: `Translation step ${step.order}: ${en?.title ?? step.title}` },
      subtitle: { vi: step.blurb, en: en?.blurb ?? step.blurb },
      keywords: ['dịch', 'translation', 'luyện dịch', ...(step.badge ? [step.badge] : [])],
      exam: 'ielts',
      skill: 'writing',
      level: step.badge ?? undefined,
      href: `/write/translation/${step.id}`,
    });
  }
  for (const set of TRANSLATION_SETS) {
    const topic = ARTICLE_TOPIC[set.topic];
    out.push({
      id: `translate-set:${set.id}`,
      kind: 'writing',
      title: { vi: `Dịch câu: ${set.title}`, en: `Translate: ${humanize(set.id.replace(/^tr-/, ''))}` },
      subtitle: { vi: set.blurb, en: `Vietnamese → English · ${topic?.en ?? humanize(set.topic)}` },
      keywords: ['dịch câu', 'translate', set.topic, ...(topic ? [topic.vi] : [])],
      exam: 'ielts',
      skill: 'writing',
      level: set.level,
      href: `/sentence/translate?set=${encodeURIComponent(set.id)}`,
    });
  }

  // ---- Speaking
  const modes: { key: string; title: Bi; keywords: string[] }[] = [
    { key: 'full', title: { vi: 'Speaking thi thử đủ 3 phần', en: 'Full Speaking test (Parts 1–3)' }, keywords: ['full test', 'thi thử'] },
    { key: 'p1', title: { vi: 'Speaking Part 1', en: 'Speaking Part 1' }, keywords: ['part 1', 'giới thiệu bản thân'] },
    { key: 'p2', title: { vi: 'Speaking Part 2 (cue card)', en: 'Speaking Part 2 (cue card)' }, keywords: ['part 2', 'cue card', 'nói 2 phút'] },
    { key: 'p3', title: { vi: 'Speaking Part 3', en: 'Speaking Part 3' }, keywords: ['part 3', 'thảo luận'] },
  ];
  for (const mode of modes) {
    out.push({
      id: `speaking-mode:${mode.key}`,
      kind: 'speaking',
      title: mode.title,
      subtitle: { vi: 'Phòng luyện nói với giám khảo AI', en: 'Speaking room with an AI examiner' },
      keywords: mode.keywords,
      exam: 'ielts',
      skill: 'speaking',
      href: `/speaking?mode=${mode.key}`,
    });
  }
  for (const topic of PART1_TOPICS) {
    out.push({
      id: `speaking-p1:${topic.id}`,
      kind: 'speaking',
      title: { vi: `Part 1: ${topic.titleVi}`, en: `Part 1: ${topic.titleEn}` },
      subtitle: { vi: `${topic.questions.length} câu hỏi Part 1`, en: `${topic.questions.length} Part 1 questions` },
      keywords: ['part 1', topic.titleVi, topic.titleEn],
      exam: 'ielts',
      skill: 'speaking',
      href: `/speaking/room?mode=p1&p1=${encodeURIComponent(topic.id)}&exam=1`,
    });
  }
  for (const card of CUE_CARDS) {
    out.push({
      id: `speaking-cue:${card.id}`,
      kind: 'speaking',
      title: { vi: `Part 2: ${card.titleVi}`, en: `Part 2: ${card.card.text}` },
      subtitle: { vi: 'Cue card · kèm Part 3', en: 'Cue card · with Part 3' },
      keywords: ['part 2', 'cue card', card.titleVi, card.card.text],
      exam: 'ielts',
      skill: 'speaking',
      href: `/speaking/room?mode=p2&cue=${encodeURIComponent(card.id)}&exam=1`,
    });
  }

  // ---- Gắn từ khoá kỹ năng / kỳ thi, bỏ từ khoá rỗng và trùng
  for (const entry of out) {
    const extra = [...SKILL_KEYWORDS[entry.skill], ...EXAM_KEYWORDS[entry.exam]];
    entry.keywords = [...new Set([...entry.keywords, ...extra].map((k) => k.trim()).filter(Boolean))];
  }

  return out;
}

let cache: { entries: SearchEntry[]; byId: Map<string, SearchEntry> } | null = null;

/** Toàn bộ chỉ mục — dựng ở lần gọi đầu, các lần sau trả bản đã dựng. */
export function getCatalog(): SearchEntry[] {
  if (!cache) {
    const entries = buildEntries();
    cache = { entries, byId: new Map(entries.map((e) => [e.id, e])) };
  }
  return cache.entries;
}

export function getEntry(id: string): SearchEntry | undefined {
  getCatalog();
  return cache!.byId.get(id);
}

/** Tiêu đề theo ngôn ngữ, thiếu bản tiếng Anh thì dùng bản tiếng Việt. */
export function entryTitle(entry: Pick<SearchEntry, 'title'>, locale: 'vi' | 'en'): string {
  return (locale === 'en' ? entry.title.en : entry.title.vi) || entry.title.vi;
}

/** Nhãn trình độ theo ngôn ngữ ("Nền tảng" → "Foundation", "easy" → "Dễ"; nhãn khác giữ nguyên). */
export function levelLabel(level: string, locale: 'vi' | 'en'): string {
  const known = LEVEL_LABEL[level];
  return known ? known[locale] : level;
}

export function entrySubtitle(entry: Pick<SearchEntry, 'subtitle'>, locale: 'vi' | 'en'): string {
  if (!entry.subtitle) return '';
  return (locale === 'en' ? entry.subtitle.en : entry.subtitle.vi) || entry.subtitle.vi;
}
