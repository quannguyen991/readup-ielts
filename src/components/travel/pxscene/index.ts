import type { PxScene } from './scene';
import { makeHanoi } from './hanoi';
import { makeLondon } from './london';
import { makeParis } from './paris';
import { makeSingapore } from './singapore';
import { makeTokyo } from './tokyo';

export type PxSceneId = 'tokyo' | 'paris' | 'london' | 'singapore' | 'hanoi';
export const PX_SCENE_IDS: readonly PxSceneId[] = ['tokyo', 'paris', 'london', 'singapore', 'hanoi'];

const FACTORY: Record<PxSceneId, () => PxScene> = {
  tokyo: makeTokyo,
  paris: makeParis,
  london: makeLondon,
  singapore: makeSingapore,
  hanoi: makeHanoi,
};

/** Dựng một cảnh mới (mỗi lần mở là một thể hiện riêng, có trạng thái động riêng). */
export function createPxScene(id: PxSceneId): PxScene {
  return FACTORY[id]();
}

export function isPxSceneId(v: unknown): v is PxSceneId {
  return typeof v === 'string' && (PX_SCENE_IDS as readonly string[]).includes(v);
}
