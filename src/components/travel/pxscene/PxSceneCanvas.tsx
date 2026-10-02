import React from 'react';

import type { PxSceneId } from './index';

export type PxSceneCanvasProps = {
  scene: PxSceneId;
  /** Phóng nguyên bao nhiêu lần so với 320×180. */
  k: number;
  still?: boolean;
};

/** Bản gốc (native): chưa có canvas — chỉ web mới vẽ cảnh. */
export function PxSceneCanvas(_props: PxSceneCanvasProps): React.ReactElement | null {
  return null;
}
