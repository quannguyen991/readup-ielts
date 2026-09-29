import React from 'react';

import { GridBackdrop, LIGHT_LINE, LIGHT_STOPS } from './GridBackdrop';
import { pageBackgroundFor } from './study-backgrounds';
import { useHydrated } from './useHydrated';
import { findItem } from '@/services/gamification/shop';
import { useRewardStore } from '@/store/useRewardStore';

/**
 * Nền lưới SÁNG, tràn viền — cho các màn tác vụ nhiều chữ.
 *
 * VÌ SAO KHÔNG DÙNG NỀN TỐI Ở ĐÂY. App đã tự chốt cách chia từ trước, ghi trong
 * `TaskShell`: nền tối là màn ĐỂ NHÌN (chọn bài, xem điểm), nền lưới sáng là màn
 * ĐANG LÀM VIỆC (đọc bài, gõ bài, tra từ). Màn đọc một bài 800 chữ là chỗ người
 * ta nhìn lâu nhất trong cả app; đặt một thẻ trắng lên nền chàm tối ở đó là bắt
 * mắt điều tiết giữa hai đầu độ sáng suốt mười lăm phút.
 *
 * VÀ VÌ SAO KHÔNG ĐỂ PHẲNG NHƯ CŨ. `bg-canvas` là một mảng xám phẳng: thẻ trắng
 * đặt trên nền gần trắng thì không còn ranh giới nào, cả trang trông như một tờ
 * giấy trống. Lưới nhạt vừa tách được thẻ ra khỏi nền, vừa giữ đúng MỘT hoạ tiết
 * với các màn nền tối — hai bên là hai độ sáng của cùng một thứ, không phải hai
 * thiết kế rời.
 *
 * KHÔNG kèm `Screen` hay `SafeAreaView`: mấy màn dùng nó tự quản vùng cuộn của
 * chúng (màn đọc chia hai cột cuộn riêng). Ai cần thì tự bọc.
 */
export function LightGrid({ children }: { children: React.ReactNode }) {
  return <StudyBackdrop>{children}</StudyBackdrop>;
}

/**
 * Nền sáng của MỌI màn học (LightGrid, TaskShell tông giấy). Có NỀN HỌC đổi
 * bằng sao thì vẽ mẫu đó; không có thì theo GIAO DIỆN đang dùng (bản nhạt);
 * không có gì thì lưới sáng mặc định.
 */
export function StudyBackdrop({ children, showGrid = true }: { children: React.ReactNode; showGrid?: boolean }) {
  const bg = usePageBackground('study');
  if (bg) {
    return (
      <GridBackdrop colors={bg.stops} line={bg.line} pattern={bg.pattern} blobs={bg.blobs} margin={bg.margin} cell={bg.cell ?? 34}>
        {children}
      </GridBackdrop>
    );
  }
  return (
    <GridBackdrop colors={LIGHT_STOPS} line={LIGHT_LINE} showGrid={showGrid}>
      {children}
    </GridBackdrop>
  );
}

/** Nền đang áp dụng cho một loại trang (null = nền mặc định). */
export function usePageBackground(kind: 'browse' | 'study') {
  const studyBgId = useRewardStore((s) => s.studyBg);
  const themeId = useRewardStore((s) => s.theme);
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return pageBackgroundFor(kind, findItem(studyBgId)?.studyBg, themeId);
}
