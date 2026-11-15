/**
 * Mô hình chung cho các trang "chọn bài" có LỘ TRÌNH: Chép chính tả, Dịch câu, Đọc báo song ngữ…
 *
 * Mỗi trang đều trả lời cùng ba câu hỏi, theo cùng thứ tự: (1) mình nên bắt đầu từ mức nào?
 * (2) mức đó có những bài gì? (3) muốn luyện theo tình huống nào? — nên dùng chung một cách
 * phân nhóm và một lộ trình, thay vì mỗi trang tự vẽ bộ lọc riêng.
 *
 * Hàm thuần, không đụng React, để test được.
 */

export type StageKey = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type Stage = {
  key: StageKey;
  vi: { title: string; sub: string };
  en: { title: string; sub: string };
};

/** Lộ trình đề xuất, từ dễ đến khó. Trang nào không có bài ở mức nào thì mức đó tự ẩn. */
export const STAGES: Stage[] = [
  { key: 'A1', vi: { title: 'Khởi động', sub: 'Chào hỏi, giới thiệu bản thân' }, en: { title: 'Getting started', sub: 'Greetings and introductions' } },
  { key: 'A2', vi: { title: 'Nền tảng', sub: 'Mua sắm, hỏi đường, việc hằng ngày' }, en: { title: 'Foundations', sub: 'Shopping, directions, daily routines' } },
  { key: 'B1', vi: { title: 'Tự tin giao tiếp', sub: 'Kể chuyện, nêu kế hoạch' }, en: { title: 'Confident talk', sub: 'Telling stories, making plans' } },
  { key: 'B2', vi: { title: 'Lập luận', sub: 'Bảo vệ ý kiến, bàn công việc' }, en: { title: 'Arguing a point', sub: 'Defending opinions, discussing work' } },
  { key: 'C1', vi: { title: 'Tinh tế', sub: 'Văn phong học thuật, sắc thái' }, en: { title: 'Nuance', sub: 'Academic register and shades of meaning' } },
  { key: 'C2', vi: { title: 'Thành thạo', sub: 'Dùng ngôn ngữ như người bản xứ' }, en: { title: 'Mastery', sub: 'Near-native command' } },
];

export const STAGE_ORDER: StageKey[] = STAGES.map((s) => s.key);

/** Màu theo mức: dịu → đậm dần, mang thông tin (người học lướt là biết chỗ nào hợp sức mình). */
export const STAGE_TONE: Record<StageKey, { ink: string; soft: string; mid: string }> = {
  A1: { ink: '#15803D', soft: '#E4F6EA', mid: '#22C55E' },
  A2: { ink: '#0F766E', soft: '#E1F4F1', mid: '#14B8A6' },
  B1: { ink: '#1D4ED8', soft: '#E6EEFD', mid: '#3B82F6' },
  B2: { ink: '#6A4BD9', soft: '#EFEAFE', mid: '#8B6CF2' },
  C1: { ink: '#B45309', soft: '#FDF0DC', mid: '#F59E0B' },
  C2: { ink: '#BE123C', soft: '#FFE4E9', mid: '#F43F5E' },
};

export type GroupKey = 'life' | 'work' | 'academic' | 'ielts';

export const GROUPS: Record<GroupKey, { vi: string; en: string; subVi: string; subEn: string; icon: 'home' | 'briefcase' | 'book' | 'target'; tint: string }> = {
  life: { vi: 'Tình huống đời sống', en: 'Everyday life', subVi: 'Ăn uống, mua sắm, đi lại, nhà cửa', subEn: 'Food, shopping, travel, home', icon: 'home', tint: '#F59E0B' },
  work: { vi: 'Môi trường công việc', en: 'Workplace', subVi: 'Nghề nghiệp, họp hành, đàm phán', subEn: 'Careers, meetings, negotiation', icon: 'briefcase', tint: '#3B82F6' },
  academic: { vi: 'Học thuật', en: 'Academic', subVi: 'Khoa học, lịch sử, nghệ thuật, kỹ năng học', subEn: 'Science, history, arts, study skills', icon: 'book', tint: '#14B8A6' },
  ielts: { vi: 'Chủ đề IELTS', en: 'IELTS topics', subVi: 'Các chủ đề hay ra ở Writing và Speaking', subEn: 'Recurring Writing and Speaking themes', icon: 'target', tint: '#8B6CF2' },
};

export const GROUP_ORDER: GroupKey[] = ['life', 'work', 'academic', 'ielts'];

const WORK = /công việc|nghề|đàm phán|khởi nghiệp|nói trước|tình nguyện|tiền bạc|work|career|business|negotiat|startup|finance|economy|kinh tế/i;
const IELTS = /môi trường|công nghệ|truyền thông|báo chí|giáo dục|khoa học|đô thị|di cư|khí hậu|năng lượng|environment|technology|media|education|science|urban|climate|health|sức khỏe|sức khoẻ|xã hội|society/i;
const ACADEMIC = /học|lịch sử|nghệ thuật|thư viện|bảo tàng|kiến trúc|khảo cổ|vũ trụ|đại dương|tâm lý|trí nhớ|y học|đạo đức|thiết kế|nhiếp ảnh|nhạc|history|art|museum|library|science|psycholog|memory/i;

/**
 * Chủ đề → nhóm tình huống. Mỗi bài thuộc ĐÚNG MỘT nhóm để không xuất hiện hai lần trên trang:
 * chủ đề hay gặp trong IELTS chỉ vào nhóm IELTS từ mức B1 trở lên (mức thấp hơn đọc như bài đời sống).
 */
export function groupOfTopic(topic: string, level?: string): GroupKey {
  const t = topic.trim();
  const high = level ? STAGE_ORDER.indexOf(normalizeLevel(level)) >= STAGE_ORDER.indexOf('B1') : false;
  if (WORK.test(t)) return 'work';
  if (high && IELTS.test(t)) return 'ielts';
  if (ACADEMIC.test(t)) return 'academic';
  return 'life';
}

/** "B1 – B2" → "B2"; "easy/medium/hard" → mức tương ứng; chuỗi lạ → B1. */
export function normalizeLevel(level: string): StageKey {
  const last = level.split(/\s*[–-]\s*/).pop()?.trim() ?? level;
  const up = last.toUpperCase();
  if ((STAGE_ORDER as string[]).includes(up)) return up as StageKey;
  const map: Record<string, StageKey> = { EASY: 'A2', MEDIUM: 'B1', HARD: 'B2', BEGINNER: 'A1', INTERMEDIATE: 'B1', ADVANCED: 'C1' };
  return map[up] ?? 'B1';
}

export type LevelProgress = { key: StageKey; total: number; done: number };

/** Mức nên bắt đầu: mức thấp nhất còn bài chưa làm; làm hết thì mức cao nhất. */
export function recommendedStage(progress: readonly LevelProgress[]): StageKey | null {
  const present = progress.filter((p) => p.total > 0);
  if (present.length === 0) return null;
  const open = present.find((p) => p.done < p.total);
  return (open ?? present[present.length - 1]!).key;
}

/** Gom thống kê tiến độ theo mức từ danh sách mục (`done` = đã làm ít nhất một lần). */
export function progressByLevel(items: readonly { level: StageKey; done: boolean }[]): LevelProgress[] {
  const out = new Map<StageKey, LevelProgress>();
  for (const k of STAGE_ORDER) out.set(k, { key: k, total: 0, done: 0 });
  for (const it of items) {
    const p = out.get(it.level)!;
    p.total += 1;
    if (it.done) p.done += 1;
  }
  return STAGE_ORDER.map((k) => out.get(k)!).filter((p) => p.total > 0);
}

/** Bỏ dấu + thường hoá để tìm "am thuc" ra "Ẩm thực". */
export function foldVi(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}
