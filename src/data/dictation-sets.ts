import { DICTATION_SETS_A, type DictationSet, type DictationSetSentence } from './dictation-sets-a';
import { DICTATION_SETS_B } from './dictation-sets-b';
import { DICTATION_SETS_C } from './dictation-sets-c';

/**
 * Kho BỘ ĐỀ chép chính tả — gộp các nửa lại thành một danh sách.
 *
 * Khác `DICTATION_SENTENCES` ở `sentence-drills.ts` thế nào: kho cũ là 100 câu
 * RỜI, mỗi lượt luyện bốc ngẫu nhiên 10 câu không liên quan gì nhau. Kho này là
 * các BÀI có chủ đề, 12 câu trong một bài nối tiếp nhau như một đoạn nói ngắn.
 * Hai kho phục vụ hai kiểu luyện khác nhau nên giữ cả hai: bốc ngẫu nhiên hợp
 * với việc ôn rải, còn bài có chủ đề hợp với việc ngồi xuống luyện một buổi.
 *
 * Nội dung tiếng Anh do dự án tự viết, không lấy từ YouTube, báo hay sách nào —
 * vừa tránh bản quyền, vừa kiểm soát được độ khó và những âm cần luyện.
 */

export type { DictationSet, DictationSetSentence };

const LEVEL_RANK: Record<string, number> = { A2: 0, B1: 1, B2: 2, C1: 3 };

/**
 * Xếp theo ĐỘ KHÓ THẬT, không theo số thứ tự trong file nguồn.
 *
 * Hai nửa kho được viết độc lập, mỗi nửa tự tăng dần từ A2 lên C1. Nối đuôi
 * nhau thì bài 26 (A2) lại dễ hơn hẳn bài 25 (C1) — người học đi tuần tự sẽ
 * tụt độ khó giữa chừng mà không hiểu vì sao.
 *
 * `id` giữ nguyên vì tiến độ đã lưu trên máy người dùng khoá theo id; thứ đổi
 * chỉ là VỊ TRÍ hiển thị, và `position` bên dưới mới là số bài in trên thẻ.
 */
export const DICTATION_SETS: DictationSet[] = [...DICTATION_SETS_A, ...DICTATION_SETS_B, ...DICTATION_SETS_C].sort(
  (a, b) => (LEVEL_RANK[a.level] ?? 9) - (LEVEL_RANK[b.level] ?? 9) || a.order - b.order,
);

/** Số bài in trên thẻ: vị trí trong danh sách đã xếp theo độ khó, tính từ 1. */
export function positionOf(set: DictationSet): number {
  return DICTATION_SETS.findIndex((s) => s.id === set.id) + 1;
}

export const DICTATION_SET_LEVELS: string[] = [
  ...new Set(DICTATION_SETS.map((s) => s.level)),
].sort();

export const DICTATION_SET_TOPICS: string[] = [
  ...new Set(DICTATION_SETS.map((s) => s.topic)),
].sort((a, b) => a.localeCompare(b, 'vi'));

/** Tên chủ đề khi giao diện là tiếng Anh. Giá trị lọc vẫn là tên tiếng Việt. */
export const DICTATION_TOPIC_EN: Record<string, string> = {
  'Đời sống thường ngày': 'Daily life',
  'Ẩm thực': 'Food',
  'Thời tiết': 'Weather',
  'Mua sắm': 'Shopping',
  'Gia đình': 'Family',
  'Giao thông': 'Transport',
  'Du lịch': 'Travel',
  'Kỹ năng học tập': 'Study skills',
  'Sức khỏe': 'Health',
  'Nhà ở': 'Housing',
  'Thể thao': 'Sport',
  'Đời sống đô thị': 'City life',
  'Tiền bạc': 'Money',
  'Công việc': 'Work',
  'Công nghệ': 'Technology',
  'Môi trường': 'Environment',
  'Truyền thông': 'Media',
  'Học ngoại ngữ': 'Language learning',
  'Tình nguyện': 'Volunteering',
  'Lễ hội': 'Festivals',
  'Khoa học': 'Science',
  'Lịch sử': 'History',
  'Nghệ thuật': 'Art',
  'Thiên nhiên': 'Nature',
  'Nghề nghiệp': 'Careers',
  'Giấc ngủ': 'Sleep',
  'Thú cưng': 'Pets',
  'Làm vườn': 'Gardening',
  'Thư viện': 'Libraries',
  'Bảo tàng': 'Museums',
  'Nói trước công chúng': 'Public speaking',
  'Nhiếp ảnh': 'Photography',
  'Trí nhớ': 'Memory',
  'Nghề nông': 'Farming',
  'Học nhạc cụ': 'Learning an instrument',
  'Đại dương': 'Oceans',
  'Kiến trúc': 'Architecture',
  'Vũ trụ': 'Space',
  'Báo chí': 'Journalism',
  'Thiết kế': 'Design',
  'Khởi nghiệp': 'Startups',
  'Khảo cổ': 'Archaeology',
  'Năng lượng': 'Energy',
  'Tâm lý học': 'Psychology',
  'Quy hoạch đô thị': 'Urban planning',
  'Y học': 'Medicine',
  'Đàm phán': 'Negotiation',
  'Di cư': 'Migration',
  'Chính sách khí hậu': 'Climate policy',
  'Đạo đức nghiên cứu': 'Research ethics',
};

/** Nhãn chủ đề theo ngôn ngữ; chủ đề chưa có bản tiếng Anh thì giữ nguyên. */
export function dictationTopicLabel(topic: string, en: boolean): string {
  return en ? DICTATION_TOPIC_EN[topic] ?? topic : topic;
}

export function getDictationSet(id: string): DictationSet | undefined {
  return DICTATION_SETS.find((s) => s.id === id);
}

export function filterDictationSets(filters: { level?: string; topic?: string } = {}): DictationSet[] {
  const { level = 'all', topic = 'all' } = filters;
  return DICTATION_SETS.filter(
    (s) => (level === 'all' || s.level === level) && (topic === 'all' || s.topic === topic),
  );
}

export function dictationSetStats() {
  return {
    sets: DICTATION_SETS.length,
    sentences: DICTATION_SETS.reduce((n, s) => n + s.sentences.length, 0),
    levels: DICTATION_SET_LEVELS.length,
    topics: DICTATION_SET_TOPICS.length,
  };
}

