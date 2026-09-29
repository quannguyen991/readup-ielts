/**
 * Trạng thái hiển thị của công trường (nối `construction.ts` với `procgen`) và
 * chuỗi khung hình tiến độ để phát lại phần việc vừa làm.
 */
import { catalogItem } from '@/data/city/catalog';
import { isDone, visualProgress, type Site } from '@/services/city/construction';
import { DONE, type Visual } from '@/services/city/procgen/parts';

export function toVisual(site: Site): Visual {
  const item = catalogItem(site.type);
  if (!item || isDone(site, item)) return DONE;
  const v = visualProgress(site);
  return { stage: v.stage, fraction: v.fraction, delivered: site.delivered, floorsDone: v.floorsDone, floorStep: v.floorStep, craneUp: v.craneUp };
}

export function sameVisual(a: Visual | undefined, b: Visual): boolean {
  return !!a && a.stage === b.stage && Math.abs(a.fraction - b.fraction) < 1e-6 && a.floorsDone === b.floorsDone && a.floorStep === b.floorStep && a.craneUp === b.craneUp && a.delivered === b.delivered;
}

/** Thứ tự tuyến tính của tiến độ để so / nội suy. */
function rank(v: Visual): number {
  return v.stage * 10000 + (v.stage === 4 ? v.floorsDone * 10 + v.floorStep : 0) + v.fraction;
}

/**
 * Các khung hình từ `from` tới `to` (tối đa `max`): cùng công đoạn thì chia
 * nhỏ phần trăm (tường lên từng hàng); cao ốc thì đi qua từng bước tầng; khác
 * công đoạn thì đi qua từng công đoạn ở giữa.
 */
export function replayFrames(from: Visual | undefined, to: Visual, stages: readonly number[], max = 10): Visual[] {
  if (!from || rank(from) >= rank(to)) return [to];
  const frames: Visual[] = [];
  if (from.stage === to.stage && to.stage !== 4) {
    const steps = Math.min(max, 6);
    for (let i = 1; i <= steps; i++) frames.push({ ...to, fraction: from.fraction + ((to.fraction - from.fraction) * i) / steps });
    return frames;
  }
  if (from.stage === 4 && to.stage === 4) {
    let f = from.floorsDone;
    let s = from.floorStep;
    while ((f < to.floorsDone || (f === to.floorsDone && s < to.floorStep)) && frames.length < 40) {
      s += 1;
      if (s >= 4) {
        s = 0;
        f += 1;
      }
      frames.push({ ...to, floorsDone: f, floorStep: s, fraction: 0 });
    }
    frames.push(to);
    return thin(frames, max);
  }
  for (const st of stages) {
    if (st < from.stage || st > to.stage) continue;
    if (st === from.stage) frames.push({ ...from, fraction: 1, delivered: true });
    else if (st < to.stage) frames.push({ ...to, stage: st, fraction: 1, delivered: true, floorsDone: st === 4 ? to.floorsDone : from.floorsDone });
  }
  frames.push(to);
  return thin(frames, max);
}

function thin(frames: Visual[], max: number): Visual[] {
  if (frames.length <= max) return frames;
  const out: Visual[] = [];
  for (let i = 1; i <= max; i++) out.push(frames[Math.round((i * frames.length) / max) - 1]!);
  return out;
}

const cache = new Map<string, Visual[]>();

/**
 * Như `replayFrames` nhưng trả về CÙNG một mảng cho cùng (công trường, từ, tới)
 * — để công trường này không bị phát lại từ đầu khi công trường khác xong.
 */
export function stableFrames(siteId: string, from: Visual, to: Visual, stages: readonly number[]): Visual[] {
  const k = `${siteId}|${JSON.stringify(from)}|${JSON.stringify(to)}`;
  let f = cache.get(k);
  if (!f) {
    if (cache.size > 200) cache.clear();
    f = replayFrames(from, to, stages);
    cache.set(k, f);
  }
  return f;
}
