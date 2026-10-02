import type { Claim, ClaimStatus, Scene, TopicBundle } from './types';

/**
 * CỔNG XUẤT BẢN. Một cảnh chỉ tới tay người dùng khi:
 *   - `scene.status === 'published'`;
 *   - có ít nhất một khẳng định, và MỌI khẳng định của cảnh là `verified` hoặc `single-source`
 *     (`disputed` / `unverified` chặn);
 *   - không còn cờ `imagePending` / `audioPending`, và có ảnh + audio tiếng Anh.
 * Việc tệp có THẬT trong `public/` hay không do `validate.ts` + test canh (cổng này chạy cả trên
 * trình duyệt nên không kiểm đĩa).
 */

export const PUBLISHABLE_CLAIM: readonly ClaimStatus[] = ['verified', 'single-source'];

export type GateIssue = 'status' | 'no-claims' | 'claim-missing' | 'claim-blocked' | 'image' | 'audio';

export function indexClaims(claims: readonly Claim[]): Map<string, Claim> {
  return new Map(claims.map((c) => [c.id, c]));
}

/** Lý do cảnh CHƯA được hiện (mảng rỗng = được hiện). */
export function sceneBlockers(scene: Scene, claims: ReadonlyMap<string, Claim>): GateIssue[] {
  const out: GateIssue[] = [];
  if (scene.status !== 'published') out.push('status');
  if (scene.claimIds.length === 0) out.push('no-claims');
  for (const id of scene.claimIds) {
    const c = claims.get(id);
    if (!c) out.push('claim-missing');
    else if (!PUBLISHABLE_CLAIM.includes(c.status)) out.push('claim-blocked');
  }
  if (scene.imagePending || !scene.image?.file) out.push('image');
  if (scene.audioPending || !scene.audio?.en?.file) out.push('audio');
  return [...new Set(out)];
}

export function isScenePublishable(scene: Scene, claims: ReadonlyMap<string, Claim>): boolean {
  return sceneBlockers(scene, claims).length === 0;
}

/** Cảnh có khẳng định chỉ dựa một nguồn → panel nguồn hiện nhãn "Nguồn đơn". */
export function sceneHasSingleSource(scene: Scene, claims: ReadonlyMap<string, Claim>): boolean {
  return scene.claimIds.some((id) => claims.get(id)?.status === 'single-source');
}

/**
 * Các cảnh người dùng được thấy, theo thứ tự của chủ đề. `dev` (bản thử `?dev=1`) bỏ qua cổng
 * để xem được dữ liệu mẫu — chỉ gọi với `dev` khi chạy bản phát triển.
 */
export function visibleScenes(bundle: TopicBundle, opts: { dev?: boolean } = {}): Scene[] {
  const byId = new Map(bundle.scenes.map((s) => [s.id, s]));
  const claims = indexClaims(bundle.claims);
  const ordered = bundle.topic.sceneIds.map((id) => byId.get(id)).filter((s): s is Scene => !!s);
  return opts.dev ? ordered : ordered.filter((s) => isScenePublishable(s, claims));
}

/** Chủ đề đủ điều kiện hiện ra: được đánh dấu `published` và có ít nhất một cảnh qua cổng. */
export function isTopicVisible(bundle: TopicBundle, opts: { dev?: boolean } = {}): boolean {
  if (opts.dev) return true;
  return bundle.topic.status === 'published' && visibleScenes(bundle).length > 0;
}

export function claimsOfScene(bundle: TopicBundle, scene: Scene): Claim[] {
  const map = indexClaims(bundle.claims);
  return scene.claimIds.map((id) => map.get(id)).filter((c): c is Claim => !!c);
}

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, { vi: string; en: string }> = {
  verified: { vi: 'Đã đối chiếu', en: 'Cross-checked' },
  'single-source': { vi: 'Nguồn đơn', en: 'Single source' },
  disputed: { vi: 'Còn tranh luận', en: 'Disputed' },
  unverified: { vi: 'Chưa kiểm chứng', en: 'Unverified' },
};

export function claimStatusCounts(claims: readonly Claim[]): Record<ClaimStatus, number> {
  const out: Record<ClaimStatus, number> = { verified: 0, 'single-source': 0, disputed: 0, unverified: 0 };
  for (const c of claims) out[c.status] += 1;
  return out;
}
