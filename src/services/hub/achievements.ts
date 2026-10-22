/**
 * Điểm kinh nghiệm (XP), cấp và huy hiệu của khu Hub. Hàm thuần: nhận số liệu đã có sẵn trong
 * store (bài học đã xong, tình huống đã đạt, chuỗi ngày, điểm âm), trả về tiến độ từng huy hiệu.
 * Không có điểm bịa: mọi con số đều đếm từ việc người học đã làm.
 */

export type HubStats = {
  /** Số bài ngữ pháp đã đạt (lessonsDone). */
  lessonsDone: number;
  /** Tổng số bài ngữ pháp trong khoá (để biết khi nào học hết). */
  lessonsTotal: number;
  /** Số tình huống nhập vai, gọi điện, hội thoại đã đạt. */
  scenariosDone: number;
  /** Số nhiệm vụ đã làm từ trước đến nay (tổng các ngày). */
  tasksDone: number;
  /** Chuỗi ngày liên tiếp hiện tại. */
  streak: number;
  /** Điểm cao nhất của từng âm vị (0–100). */
  phonemeBest: Record<string, number>;
};

export const XP_PER_LESSON = 20;
export const XP_PER_SCENARIO = 15;
export const XP_PER_TASK = 10;
/** Mỗi cấp cần thêm một lượng XP cố định. */
export const XP_PER_LEVEL = 100;

export function xpOf(s: HubStats): number {
  return s.lessonsDone * XP_PER_LESSON + s.scenariosDone * XP_PER_SCENARIO + s.tasksDone * XP_PER_TASK;
}

/** Cấp bắt đầu từ 1. */
export function levelOf(xp: number): { level: number; into: number; need: number; ratio: number } {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const into = xp % XP_PER_LEVEL;
  return { level, into, need: XP_PER_LEVEL, ratio: into / XP_PER_LEVEL };
}

export type AchievementId =
  | 'first-lesson'
  | 'lessons-5'
  | 'grammar-master'
  | 'streak-7'
  | 'streak-14'
  | 'streak-30'
  | 'streak-100'
  | 'scenarios-3'
  | 'scenarios-10'
  | 'scenarios-25'
  | 'tasks-25'
  | 'tasks-100'
  | 'perfect-sound'
  | 'sounds-10'
  | 'level-5'
  | 'lessons-12'
  | 'sounds-30'
  | 'streak-60'
  | 'tasks-250'
  | 'scenarios-50'
  | 'level-10';

export type Achievement = {
  id: AchievementId;
  title: string;
  desc: string;
  /** Tên file ảnh trong public/badges/ (vẽ riêng). */
  art: string;
  /** Mốc cần đạt. */
  goal: number;
  /** Số hiện tại theo số liệu. */
  value: (s: HubStats) => number;
  /** XP thưởng khi mở khoá. */
  bonusXp: number;
};

const soundCount = (s: HubStats) => Object.values(s.phonemeBest).filter((v) => v >= 80).length;
const isDone = (ok: boolean) => (ok ? 1 : 0);

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-lesson', title: 'Bài học đầu tiên', desc: 'Hoàn thành một bài ngữ pháp', art: 'badge-first-lesson', goal: 1, value: (s) => s.lessonsDone, bonusXp: 10 },
  { id: 'lessons-5', title: 'Năm bài học', desc: 'Hoàn thành 5 bài ngữ pháp', art: 'badge-lessons-5', goal: 5, value: (s) => s.lessonsDone, bonusXp: 25 },
  { id: 'grammar-master', title: 'Làm chủ ngữ pháp', desc: 'Hoàn thành toàn bộ bài ngữ pháp', art: 'badge-grammar', goal: 1, value: (s) => isDone(s.lessonsTotal > 0 && s.lessonsDone >= s.lessonsTotal), bonusXp: 100 },
  { id: 'streak-7', title: 'Bảy ngày liền', desc: 'Luyện tập 7 ngày liên tiếp', art: 'badge-streak-7', goal: 7, value: (s) => s.streak, bonusXp: 30 },
  { id: 'streak-14', title: 'Hai tuần bền bỉ', desc: 'Luyện tập 14 ngày liên tiếp', art: 'badge-streak-14', goal: 14, value: (s) => s.streak, bonusXp: 50 },
  { id: 'streak-30', title: 'Một tháng bền bỉ', desc: 'Luyện tập 30 ngày liên tiếp', art: 'badge-streak-30', goal: 30, value: (s) => s.streak, bonusXp: 80 },
  { id: 'streak-100', title: 'Trăm ngày', desc: 'Luyện tập 100 ngày liên tiếp', art: 'badge-streak-100', goal: 100, value: (s) => s.streak, bonusXp: 300 },
  { id: 'scenarios-3', title: 'Ba tình huống', desc: 'Đạt 3 tình huống nói', art: 'badge-scenarios-3', goal: 3, value: (s) => s.scenariosDone, bonusXp: 15 },
  { id: 'scenarios-10', title: 'Mười tình huống', desc: 'Đạt 10 tình huống nói', art: 'badge-speaking-10', goal: 10, value: (s) => s.scenariosDone, bonusXp: 40 },
  { id: 'scenarios-25', title: 'Diễn viên', desc: 'Đạt 25 tình huống nói', art: 'badge-scenarios-25', goal: 25, value: (s) => s.scenariosDone, bonusXp: 120 },
  { id: 'tasks-25', title: 'Chăm chỉ', desc: 'Làm 25 nhiệm vụ', art: 'badge-tasks-25', goal: 25, value: (s) => s.tasksDone, bonusXp: 30 },
  { id: 'tasks-100', title: 'Trăm nhiệm vụ', desc: 'Làm 100 nhiệm vụ', art: 'badge-tasks-100', goal: 100, value: (s) => s.tasksDone, bonusXp: 150 },
  { id: 'perfect-sound', title: 'Âm chuẩn', desc: 'Đạt 90 điểm trở lên ở một âm vị', art: 'badge-perfect', goal: 1, value: (s) => isDone(Object.values(s.phonemeBest).some((v) => v >= 90)), bonusXp: 20 },
  { id: 'sounds-10', title: 'Mười âm chuẩn', desc: 'Đạt 80 điểm trở lên ở 10 âm vị', art: 'badge-sounds-10', goal: 10, value: soundCount, bonusXp: 90 },
  { id: 'level-5', title: 'Cấp 5', desc: 'Đạt cấp 5', art: 'badge-level-5', goal: 5, value: (s) => levelOf(xpOf(s)).level, bonusXp: 60 },
  { id: 'lessons-12', title: 'Nửa chặng ngữ pháp', desc: 'Hoàn thành 12 bài ngữ pháp', art: 'badge-lessons-12', goal: 12, value: (s) => s.lessonsDone, bonusXp: 60 },
  { id: 'sounds-30', title: 'Ba mươi âm chuẩn', desc: 'Đạt 80 điểm trở lên ở 30 âm vị', art: 'badge-sounds-30', goal: 30, value: soundCount, bonusXp: 200 },
  { id: 'streak-60', title: 'Hai tháng bền bỉ', desc: 'Luyện tập 60 ngày liên tiếp', art: 'badge-streak-60', goal: 60, value: (s) => s.streak, bonusXp: 180 },
  { id: 'tasks-250', title: 'Bậc thầy nhiệm vụ', desc: 'Làm 250 nhiệm vụ', art: 'badge-tasks-250', goal: 250, value: (s) => s.tasksDone, bonusXp: 250 },
  { id: 'scenarios-50', title: 'Năm mươi tình huống', desc: 'Đạt 50 tình huống nói', art: 'badge-scenarios-50', goal: 50, value: (s) => s.scenariosDone, bonusXp: 250 },
  { id: 'level-10', title: 'Cấp 10', desc: 'Đạt cấp 10', art: 'badge-level-10', goal: 10, value: (s) => levelOf(xpOf(s)).level, bonusXp: 150 },
];

export type AchievementState = Achievement & { progress: number; unlocked: boolean };

export function evaluateAchievements(s: HubStats): AchievementState[] {
  return ACHIEVEMENTS.map((a) => {
    const progress = Math.min(a.goal, a.value(s));
    return { ...a, progress, unlocked: progress >= a.goal };
  });
}
