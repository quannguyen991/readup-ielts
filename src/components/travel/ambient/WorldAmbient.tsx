import React from 'react';

/** Bản gốc (điện thoại/native): chưa có lớp hoạt hình canvas — web mới có (xem WorldAmbient.web.tsx). */
export type WorldAmbientProps = {
  /** Tiến độ chuyến bay học tập, 0..1. */
  progress: number;
  /** Phóng nguyên bao nhiêu lần so với lưới 418×235 (cùng PixelStage). */
  k: number;
  /** Người dùng chọn giảm chuyển động. */
  still?: boolean;
  /** Ẩn máy bay (khi đang bay vé ở màn bản đồ, máy bay vé thay chỗ). */
  hidePlane?: boolean;
  /** Mức đông đúc 0.4..1 (máy yếu giảm xuống). */
  density?: number;
  /** Báo vị trí máy bay (px nguồn) khoảng 4 lần/giây — để nền cuộn theo máy bay. */
  onPlane?: (x: number, y: number) => void;
};

export function WorldAmbient(_props: WorldAmbientProps): React.ReactElement | null {
  return null;
}
