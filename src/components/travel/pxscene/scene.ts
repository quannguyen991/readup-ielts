import type { Gfx } from './gfx';

/** Kích thước chuẩn của mọi cảnh (16:9). */
export const SCENE_W = 320;
export const SCENE_H = 180;

/**
 * Một cảnh thành phố vẽ bằng mã, xếp bốn lớp từ xa đến gần (để xe/tàu chạy SAU nhà phía trước):
 *   buildBack (tĩnh: trời, nhà xa, tháp)  →  mid (động: sao, mây, tàu…)  →  buildFront (tĩnh: nhà gần, phố, trong suốt)  →  top (động: đèn, mưa, người, xe).
 * `t` là giây từ lúc mở cảnh, `dt` là giây từ khung trước.
 */
export type PxScene = {
  id: string;
  vi: string;
  en: string;
  buildBack(g: Gfx): void;
  buildFront(g: Gfx): void;
  mid(g: Gfx, t: number, dt: number): void;
  top(g: Gfx, t: number, dt: number): void;
};
