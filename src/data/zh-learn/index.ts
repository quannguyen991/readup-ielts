import dialoguesJson from './dialogues.json';
import grammarJson from './grammar.json';
import { HSK_LEVELS, type HskLevel, type ZhDialogue, type ZhGrammarLesson } from './types';

export * from './types';
export * from './hanyu-course';

const byLevelOrder = <T extends { level: HskLevel; order: number }>(a: T, b: T) => a.level - b.level || a.order - b.order;

export const ZH_GRAMMAR: ZhGrammarLesson[] = [...(grammarJson as ZhGrammarLesson[])].sort(byLevelOrder);
export const ZH_DIALOGUES: ZhDialogue[] = [...(dialoguesJson as ZhDialogue[])].sort(byLevelOrder);

export const zhGrammarById = (id: string) => ZH_GRAMMAR.find((l) => l.id === id);
export const zhDialogueById = (id: string) => ZH_DIALOGUES.find((d) => d.id === id);
export const zhGrammarOfLevel = (level: HskLevel) => ZH_GRAMMAR.filter((l) => l.level === level);
export const zhDialoguesOfLevel = (level: HskLevel) => ZH_DIALOGUES.filter((d) => d.level === level);
/** Các cấp đã có nội dung, để màn danh sách chỉ hiện tab có bài. */
export const zhLevelsWith = (items: { level: HskLevel }[]): HskLevel[] => HSK_LEVELS.filter((lv) => items.some((i) => i.level === lv));
