/**
 * Canvas vẽ một cảnh thành phố (web): hai lớp tĩnh dựng sẵn một lần trên canvas ngoài màn hình, rồi mỗi khung
 * (30/giây) ghép nền → lớp động giữa → nhà phía trước → lớp động trên cùng. Dừng khi tab ẩn;
 * "giảm chuyển động" chỉ vẽ một khung.
 */
import React, { useEffect, useRef } from 'react';

import { Gfx } from './gfx';
import { createPxScene } from './index';
import { SCENE_H, SCENE_W } from './scene';
import type { PxSceneCanvasProps } from './PxSceneCanvas';

export type { PxSceneCanvasProps };

function layer(): { cv: HTMLCanvasElement; g: Gfx } {
  const cv = document.createElement('canvas');
  cv.width = SCENE_W;
  cv.height = SCENE_H;
  const ctx = cv.getContext('2d')!;
  return { cv, g: new Gfx(ctx, SCENE_W, SCENE_H) };
}

export function PxSceneCanvas({ scene, k, still = false }: PxSceneCanvasProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const sc = createPxScene(scene);
    const back = layer();
    const front = layer();
    sc.buildBack(back.g);
    sc.buildFront(front.g);
    const g = new Gfx(ctx, SCENE_W, SCENE_H);
    let t = 0;
    let raf = 0;
    let last = 0;
    let acc = 0;
    const draw = (dt: number) => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.drawImage(back.cv, 0, 0);
      sc.mid(g, t, dt);
      ctx.globalAlpha = 1;
      ctx.drawImage(front.cv, 0, 0);
      sc.top(g, t, dt);
      ctx.globalAlpha = 1;
    };
    if (__DEV__) (window as unknown as { __pxscene?: { step: (s: number) => void } }).__pxscene = { step: (s) => { t += s; draw(s); } };
    if (still) {
      t = 4;
      for (let i = 0; i < 12; i += 1) draw(0.05);
      return;
    }
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.visibilityState === 'hidden') {
        last = now;
        return;
      }
      const dt = Math.min(0.1, (now - (last || now)) / 1000);
      last = now;
      acc += dt;
      if (acc < 1 / 30) return;
      t += acc;
      draw(acc);
      acc = 0;
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [scene, still]);

  return React.createElement('canvas', {
    ref,
    width: SCENE_W,
    height: SCENE_H,
    'aria-hidden': true,
    style: { position: 'absolute', left: 0, top: 0, width: SCENE_W * k, height: SCENE_H * k, imageRendering: 'pixelated' },
  });
}
