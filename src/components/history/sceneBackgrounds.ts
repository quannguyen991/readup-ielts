/** The five short clips form one continuous illustrated chapter, beginning in scene 9. */
export type HistoryBackground = 'road' | 'battle' | 'flag' | 'night' | 'dawn';

const BACKGROUND_ROOT = '/history/backgrounds';
const CHAPTER_VIDEO_SCENE = 9;
const CHAPTER_VIDEO_ORDER: readonly HistoryBackground[] = ['road', 'dawn', 'night', 'battle', 'flag'];

/** Keep the clip pack together in one scene; do not assign its clips to separate timeline scenes. */
export function historyBackgroundSequence(sceneNumber: number): string[] | undefined {
  if (sceneNumber !== CHAPTER_VIDEO_SCENE) return undefined;
  return CHAPTER_VIDEO_ORDER.map((name) => `${BACKGROUND_ROOT}/${name}`);
}
