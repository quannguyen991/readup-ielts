import React from 'react';

import { CatSticker } from '@/components/mascot/CatSticker';
import { useSidebarStore } from '@/store/useSidebarStore';

/**
 * MÈO NẰM TRÊN THANH TÁC VỤ — một con nằm trên mép trên ô tìm kiếm ở đầu thanh bên, một con nằm trên
 * nút "Thu gọn" ở đáy. Con ở đáy tính theo mép dưới nên vẫn khớp khi đổi chiều cao cửa sổ; con ở đầu tính
 * theo mép trên.
 *
 * Đặt làm con của lớp bọc ngoài thanh bên, không đặt trong thanh (thanh bên cắt tràn). zIndex cao hơn
 * thanh bên để mèo nằm đè lên các khối này. Thanh thu gọn thì ẩn, vì khi đó không đủ chỗ. Chỉ là trang trí:
 * không nhận chạm.
 */
export function SidebarCats() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  if (collapsed) return null;
  return (
    <>
      <CatSticker pose="curl" size={52} style={{ position: 'absolute', top: 19, left: 150, zIndex: 50 }} />
      <CatSticker pose="lie" size={58} style={{ position: 'absolute', bottom: 114, left: 150, zIndex: 50 }} />
    </>
  );
}
