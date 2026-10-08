import { STUDY_ABROAD_MISSIONS, type StudyAbroadMission } from './study-abroad-campaign';

export type StudyDay = { day: number; chapter: StudyAbroadMission['chapter']; missions: readonly StudyAbroadMission[] };

const PER_DAY = 2;

export function buildStudyDays(missions: readonly StudyAbroadMission[] = STUDY_ABROAD_MISSIONS): StudyDay[] {
  const days: StudyDay[] = [];
  for (const chapter of [1, 2, 3, 4, 5] as const) {
    const inChapter = missions.filter((m) => m.chapter === chapter);
    for (let i = 0; i < inChapter.length; i += PER_DAY) {
      days.push({ day: days.length + 1, chapter, missions: inChapter.slice(i, i + PER_DAY) });
    }
  }
  return days;
}

export const STUDY_DAYS: readonly StudyDay[] = buildStudyDays();
