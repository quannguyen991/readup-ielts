/**
 * REGISTRY các chủ đề lịch sử. Thêm chủ đề mới = thêm thư mục `src/data/history/<topicId>/` (7 tệp JSON,
 * xem `services/history/types.ts`) rồi thêm một dòng vào `BUNDLES`.
 *
 * Bản mẫu dựng giao diện (`__dev__/fixture.ts`) CHỈ nạp khi `__DEV__` và người dùng mở `?dev=1`;
 * lời gọi `require` nằm sau `__DEV__` nên bản production gập hằng số và không đóng gói tệp ấy.
 */
import {
  isScenePublishable,
  indexClaims,
  isTopicVisible,
  visibleScenes,
} from '@/services/history/gating';
import type { Claim, ImageMeta, AudioMeta, Scene, Source, Topic, TopicBundle } from '@/services/history/types';

import kcTopic from './vn-khang-chien-chong-phap/topic.json';
import kcScenes from './vn-khang-chien-chong-phap/scenes.json';
import kcSources from './vn-khang-chien-chong-phap/sources.json';
import kcClaims from './vn-khang-chien-chong-phap/claims.json';
import kcImages from './vn-khang-chien-chong-phap/images.json';
import kcAudio from './vn-khang-chien-chong-phap/audio.json';

/** Tạm ẩn mục học lịch sử khỏi các lối vào chính trong khi nội dung còn hoàn thiện. */
export const HISTORY_LEARNING_ENABLED = false;

export const KHANG_CHIEN_TOPIC_ID = 'vn-khang-chien-chong-phap';

const load = (topic: unknown, scenes: unknown, sources: unknown, claims: unknown, images: unknown, audio: unknown): TopicBundle => ({
  topic: topic as Topic,
  scenes: scenes as Scene[],
  sources: sources as Source[],
  claims: claims as Claim[],
  images: images as ImageMeta[],
  audio: audio as AudioMeta[],
});

/** Mọi chủ đề thật (kể cả `draft`). Người dùng chỉ thấy phần qua cổng xuất bản. */
export const BUNDLES: TopicBundle[] = [load(kcTopic, kcScenes, kcSources, kcClaims, kcImages, kcAudio)];

/** Bản phát triển (`__DEV__`)? An toàn khi chạy trong Node (test) nơi `__DEV__` không tồn tại. */
export function isDevBuild(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

/** `?dev=1` có hiệu lực không: chỉ khi là bản phát triển. */
export function devEnabled(param: string | string[] | undefined | null): boolean {
  const v = Array.isArray(param) ? param[0] : param;
  return isDevBuild() && v === '1';
}

export function devBundles(): TopicBundle[] {
  // Dạng KHẲNG ĐỊNH (không phải `if (!__DEV__) return`): Metro thay `__DEV__` bằng hằng số rồi gập cả khối,
  // nên `require` bên trong bị loại trước khi gom phụ thuộc — bản production không đóng gói tệp mẫu.
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return [(require('./__dev__/fixture') as typeof import('./__dev__/fixture')).DEV_FIXTURE];
  }
  return [];
}

export function getBundle(topicId: string, dev = false): TopicBundle | undefined {
  return (dev ? [...devBundles(), ...BUNDLES] : BUNDLES).find((b) => b.topic.id === topicId);
}

/** Chủ đề hiện cho người dùng (đã qua cổng). Với `dev`, thêm bản mẫu. */
export function listTopics(dev = false): TopicBundle[] {
  const real = BUNDLES.filter((b) => isTopicVisible(b));
  return dev ? [...devBundles(), ...real] : real;
}

/** Trang chủ chỉ hiện thẻ khi ít nhất một cảnh thật đã qua cổng. */
export function hasPublishedHistory(): boolean {
  return HISTORY_LEARNING_ENABLED && BUNDLES.some((b) => isTopicVisible(b));
}

/** Ảnh đại diện cho thẻ trang chủ: ảnh cảnh đầu tiên đã xuất bản. */
export function featuredImage(topicId = KHANG_CHIEN_TOPIC_ID): { file: string; altVi: string; altEn: string } | null {
  const b = getBundle(topicId);
  const s = b ? visibleScenes(b)[0] : undefined;
  return s?.image ? { file: s.image.file, altVi: s.image.altVi, altEn: s.image.altEn } : null;
}

/* ------------------------------------------------------------ liên kết bản đồ */

export type PoiHistoryGuide = {
  topicId: string;
  /** Chỉ các cảnh ĐÃ qua cổng. */
  sceneIds: string[];
  otherPlaces: boolean;
  label: { vi: string; en: string };
  guideLineEn: string;
  /** Liên kết của bản mẫu: mở kèm `?dev=1`. */
  dev: boolean;
};

const DEFAULT_GUIDE_LINE = 'Would you like to hear what happened here?';

/** Các điểm hướng dẫn lịch sử gắn với một địa điểm của Du ngoạn (mã `data/travel/pois.ts`). */
export function historyGuidesForPoi(poiId: string): PoiHistoryGuide[] {
  const out: PoiHistoryGuide[] = [];
  const sources: { bundle: TopicBundle; dev: boolean }[] = [...BUNDLES.map((bundle) => ({ bundle, dev: false })), ...devBundles().map((bundle) => ({ bundle, dev: true }))];
  for (const { bundle, dev } of sources) {
    const claims = indexClaims(bundle.claims);
    const sceneById = new Map(bundle.scenes.map((s) => [s.id, s]));
    for (const link of bundle.topic.mapLinks) {
      if (link.poiId !== poiId) continue;
      const ids = link.sceneIds.filter((id) => {
        const s = sceneById.get(id);
        return !!s && (dev || isScenePublishable(s, claims));
      });
      if (ids.length === 0) continue;
      out.push({
        topicId: bundle.topic.id,
        sceneIds: ids,
        otherPlaces: !!link.otherPlaces,
        label: link.label ?? { vi: bundle.topic.titleVi, en: bundle.topic.titleEn },
        guideLineEn: link.guideLineEn ?? DEFAULT_GUIDE_LINE,
        dev,
      });
    }
  }
  return out;
}

export function historyHref(topicId: string, sceneId?: string, dev = false): string {
  const q = [sceneId ? `scene=${sceneId}` : '', dev ? 'dev=1' : ''].filter(Boolean).join('&');
  return `/history/${topicId}${q ? `?${q}` : ''}`;
}

export function hasHistoryGuide(poiId: string): boolean {
  return historyGuidesForPoi(poiId).length > 0;
}
