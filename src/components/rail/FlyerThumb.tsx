/**
 * Hình nhỏ của một nhân vật bay (ô chọn, huy hiệu nền ôn từ, thẻ Quest): vẽ
 * lại đúng sprite ban ngày của `services/rail/flyers`, cắt sát viền để các ô
 * đều nhau. Chỉ dùng ở bản web (canvas) — nơi gọi là các tệp `.web.tsx`.
 */
import React, { useEffect, useRef } from 'react';

import { DAY_OPTS, renderFlyer, SH, SW, type FlyerId } from '@/services/rail/flyers';

const cache = new Map<string, { c: HTMLCanvasElement; w: number; h: number }>();

function cropped(id: FlyerId, frame: number) {
  const key = `${id}:${frame}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const src = renderFlyer(id, frame, DAY_OPTS);
  const data = src.getContext('2d')!.getImageData(0, 0, SW, SH).data;
  let x0 = SW;
  let y0 = SH;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < SH; y++)
    for (let x = 0; x < SW; x++)
      if (data[(y * SW + x) * 4 + 3]! > 0) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  const w = Math.max(1, x1 - x0 + 1);
  const h = Math.max(1, y1 - y0 + 1);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d')!.drawImage(src, x0, y0, w, h, 0, 0, w, h);
  const out = { c, w, h };
  cache.set(key, out);
  return out;
}

/** `box` = cạnh ô vuông chứa hình (px màn hình); hình giữ nguyên tỉ lệ, nằm giữa ô. */
export function FlyerThumb({ id, box = 48, frame = 0 }: { id: FlyerId; box?: number; frame?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { c, w, h } = cropped(id, frame);
    const side = Math.max(w, h);
    el.width = side;
    el.height = side;
    const g = el.getContext('2d')!;
    g.clearRect(0, 0, side, side);
    g.drawImage(c, Math.floor((side - w) / 2), Math.floor((side - h) / 2));
  }, [id, frame]);
  return <canvas ref={ref} aria-hidden style={{ width: box, height: box, imageRendering: 'pixelated', display: 'block' }} />;
}
