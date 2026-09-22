import type { MathItem } from '@/lib/math/types';
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
  stars: 1 | 2 | 3;
  xp: number;
  damage: number;
  wrongQuestionIds: string[];
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
