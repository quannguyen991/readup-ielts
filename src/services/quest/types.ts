import type { MathFigureSpec, MathItem } from '@/lib/math/types';
import type { MockItem } from '@/services/sat-rw/mock/item';

export type QuestMapId = 'iron-frontier' | 'fjord-runes' | 'infinite-dungeon';
export type QuestNodeKind = 'battle' | 'elite' | 'treasure' | 'boss';
export type QuestSubject = 'math' | 'verbal' | 'mixed';

export type QuestQuestion = {
  id: string;
  subject: Exclude<QuestSubject, 'mixed'>;
  prompt: string;
  context?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  skill: string;
  /** Tên dạng câu để HIỆN: tên domain của College Board, hoặc nhãn kỹ năng Math. */
  skillLabel?: string;
  /**
   * Câu Verbal gốc, nguyên vẹn. Đoạn văn một mình chưa đủ: câu Command of
   * Evidence cần bảng số, câu "the underlined portion" cần phần gạch chân.
   */
  rwItem?: MockItem;
  /** Hình của câu Math (đồ thị, bảng, tam giác). Thiếu nó thì câu hỏi "theo hình" không giải được. */
  figure?: MathFigureSpec | null;
};

export type QuestNode = {
  id: string;
  mapId: QuestMapId;
  index: number;
  kind: QuestNodeKind;
  title: string;
  subtitle: string;
  questions: number;
  difficulty: 'standard' | 'hard';
  prerequisite?: string;
};

export type QuestMap = {
  id: QuestMapId;
  title: string;
  eyebrow: string;
  description: string;
  accent: string;
  deep: string;
  player: string;
  boss: string;
  nodes: QuestNode[];
};

export type QuestBattle = {
  id: string;
  nodeId: string;
  mapId: QuestMapId;
  subject: QuestSubject;
  questions: QuestQuestion[];
  startedAt: string;
};

export type QuestBattleResult = {
  battleId: string;
  nodeId: string;
  mapId: QuestMapId;
  correct: number;
  total: number;
  /** 0 = chưa vượt node (đúng dưới `PASS_ACCURACY`). */
  stars: 0 | 1 | 2 | 3;
  xp: number;
  damage: number;
  wrongQuestionIds: string[];
  /**
   * Bản sao các câu sai của TRẬN NÀY, để màn kết quả cho xem lại ngay. Chỉ có
   * id thì không dựng lại được câu: đề sinh theo seed có cả thời điểm bắt đầu.
   */
  wrongQuestions?: QuestQuestion[];
  completedAt: string;
};

export type QuestProgress = {
  xp: number;
  level: number;
  stars: Record<string, number>;
  unlockedNodes: string[];
  completedBattles: QuestBattleResult[];
  wrongQuestionIds: string[];
  ownedCosmetics: string[];
  equippedCosmetic: string | null;
};

export type QuestSourceItem = MockItem | MathItem;
