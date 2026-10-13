import type { Bi } from '@/i18n/useL';

export type DormSlot = 'bed' | 'desk' | 'wall' | 'corner' | 'shelf';

export type DormDecoration = {
  id: string;
  slot: DormSlot;
  glyph: string;
  name: Bi;
  description: Bi;
  unlockMission?: string;
  /** Giá bằng đồng du học. Có giá thì phải mua mới đặt được (xem services/study-abroad/economy.ts). */
  price?: number;
};

export const DORM_SLOTS: readonly { id: DormSlot; name: Bi }[] = [
  { id: 'bed', name: { vi: 'Giường', en: 'Bed' } },
  { id: 'desk', name: { vi: 'Bàn học', en: 'Study desk' } },
  { id: 'wall', name: { vi: 'Tường', en: 'Wall' } },
  { id: 'corner', name: { vi: 'Góc phòng', en: 'Room corner' } },
  { id: 'shelf', name: { vi: 'Kệ sách', en: 'Bookshelf' } },
];

/** Room items are small UI placeholders that can later be replaced by pixel sprites. */
export const STUDY_ABROAD_DECORATIONS: readonly DormDecoration[] = [
  { id: 'bed-starter', slot: 'bed', glyph: '🛏️', name: { vi: 'Giường ký túc', en: 'Dorm bed' }, description: { vi: 'Chỗ nghỉ sau một ngày khám phá.', en: 'A place to rest after a day of exploring.' } },
  { id: 'desk-starter', slot: 'desk', glyph: '🪑', name: { vi: 'Bàn học', en: 'Study desk' }, description: { vi: 'Góc học tập đầu tiên.', en: 'Your first study corner.' } },
  { id: 'wall-starter', slot: 'wall', glyph: '🗺️', name: { vi: 'Bản đồ thế giới', en: 'World map' }, description: { vi: 'Nhắc bạn về những chặng đường phía trước.', en: 'A reminder of the places still ahead.' } },
  { id: 'corner-starter', slot: 'corner', glyph: '🪴', name: { vi: 'Chậu cây nhỏ', en: 'Small plant' }, description: { vi: 'Một chút xanh trong phòng.', en: 'A little greenery for the room.' } },
  { id: 'shelf-starter', slot: 'shelf', glyph: '📚', name: { vi: 'Kệ sách cơ bản', en: 'Starter bookshelf' }, description: { vi: 'Sách cho học kỳ mới.', en: 'Books for a new semester.' } },

  { id: 'sg-campus-flag', slot: 'wall', glyph: '🏳️', name: { vi: 'Cờ campus Singapore', en: 'Singapore campus pennant' }, description: { vi: 'Mở sau nhiệm vụ nhập cảnh.', en: 'Unlocked after the arrival mission.' }, unlockMission: 'arrival' },
  { id: 'student-folder', slot: 'desk', glyph: '🗂️', name: { vi: 'Hồ sơ sinh viên', en: 'Student folder' }, description: { vi: 'Kỷ niệm ngày nhập học.', en: 'A keepsake from enrolment day.' }, unlockMission: 'campus-id' },
  { id: 'hawker-mug', slot: 'desk', glyph: '🥤', name: { vi: 'Ly nước hawker', en: 'Hawker drink cup' }, description: { vi: 'Quà từ khu ăn uống trong trường.', en: 'A treat from the campus food court.' }, unlockMission: 'food-order' },
  { id: 'group-photo', slot: 'wall', glyph: '🖼️', name: { vi: 'Ảnh nhóm dự án', en: 'Project group photo' }, description: { vi: 'Bức ảnh đầu tiên cùng bạn học.', en: 'Your first photo with classmates.' }, unlockMission: 'group-project' },
  { id: 'library-lamp', slot: 'corner', glyph: '💡', name: { vi: 'Đèn đọc sách', en: 'Reading lamp' }, description: { vi: 'Mở sau khi tìm được góc học yên tĩnh.', en: 'Unlocked after finding a quiet study spot.' }, unlockMission: 'library-help' },
  { id: 'seminar-books', slot: 'shelf', glyph: '📖', name: { vi: 'Sách seminar', en: 'Seminar books' }, description: { vi: 'Tài liệu cho những buổi thảo luận.', en: 'Reading for your seminar discussions.' }, unlockMission: 'seminar-clarify' },
  { id: 'residence-quilt', slot: 'bed', glyph: '🧵', name: { vi: 'Chăn ký túc xá', en: 'Dorm quilt' }, description: { vi: 'Món quà sau khi xử lý sự cố phòng.', en: 'A reward for sorting out your room.' }, unlockMission: 'housing-repair' },
  { id: 'market-basket', slot: 'corner', glyph: '🧺', name: { vi: 'Giỏ chợ Borough', en: 'Borough market basket' }, description: { vi: 'Quà từ quầy trái cây ở London.', en: 'A keepsake from the London fruit stall.' }, unlockMission: 'market-stall' },
  { id: 'metro-map', slot: 'wall', glyph: '🚇', name: { vi: 'Bản đồ Metro Paris', en: 'Paris Metro map' }, description: { vi: 'Mở sau khi mua được vé Metro.', en: 'Unlocked after buying your Metro ticket.' }, unlockMission: 'paris-metro' },
  { id: 'croissant-plate', slot: 'desk', glyph: '🥐', name: { vi: 'Đĩa bánh sừng bò', en: 'Croissant plate' }, description: { vi: 'Bữa sáng kiểu Paris.', en: 'A Parisian breakfast.' }, unlockMission: 'paris-cafe' },
  { id: 'louvre-print', slot: 'wall', glyph: '🖼️', name: { vi: 'Tranh kim tự tháp Louvre', en: 'Louvre pyramid print' }, description: { vi: 'Kỷ niệm lần đầu vào bảo tàng.', en: 'A memory of your first museum visit.' }, unlockMission: 'paris-louvre' },
  { id: 'eiffel-model', slot: 'shelf', glyph: '🗼', name: { vi: 'Mô hình tháp Eiffel', en: 'Eiffel Tower model' }, description: { vi: 'Phần thưởng sau khi hỏi đường thành công.', en: 'A reward for finding your way.' }, unlockMission: 'paris-directions' },
  { id: 'suica-card', slot: 'desk', glyph: '💳', name: { vi: 'Thẻ tàu Tokyo', en: 'Tokyo rail card' }, description: { vi: 'Thẻ đi tàu điện ở Tokyo.', en: 'Your Tokyo train card.' }, unlockMission: 'tokyo-ticket' },
  { id: 'takoyaki-box', slot: 'corner', glyph: '🍢', name: { vi: 'Hộp takoyaki', en: 'Takoyaki box' }, description: { vi: 'Món ăn vặt đường phố.', en: 'A street-food treat.' }, unlockMission: 'tokyo-stall' },
  { id: 'shrine-charm', slot: 'bed', glyph: '🎐', name: { vi: 'Bùa may mắn', en: 'Shrine charm' }, description: { vi: 'Mang về từ đền sau lời nguyện.', en: 'Brought home from the shrine.' }, unlockMission: 'tokyo-shrine' },
  { id: 'paper-lantern', slot: 'shelf', glyph: '🏮', name: { vi: 'Lồng đèn giấy', en: 'Paper lantern' }, description: { vi: 'Quà từ người hướng dẫn.', en: 'A gift from your guide.' }, unlockMission: 'tokyo-guide' },
  { id: 'subway-token', slot: 'desk', glyph: '🪙', name: { vi: 'Xu tàu điện ngầm', en: 'Subway token' }, description: { vi: 'Chuyến tàu đầu tiên ở New York.', en: 'Your first ride in New York.' }, unlockMission: 'nyc-subway' },
  { id: 'taxi-toy', slot: 'corner', glyph: '🚕', name: { vi: 'Xe taxi đồ chơi', en: 'Toy taxi' }, description: { vi: 'Kỷ niệm chuyến taxi vàng.', en: 'A memento of the yellow cab.' }, unlockMission: 'nyc-taxi' },
  { id: 'research-poster', slot: 'wall', glyph: '🔬', name: { vi: 'Poster nghiên cứu', en: 'Research poster' }, description: { vi: 'Ghi dấu lần đầu trình bày nghiên cứu.', en: 'A reminder of your first research presentation.' }, unlockMission: 'research-poster' },
  { id: 'scholarship-trophy', slot: 'shelf', glyph: '🏆', name: { vi: 'Cúp học bổng', en: 'Scholarship trophy' }, description: { vi: 'Phần thưởng hoàn thành buổi phỏng vấn.', en: 'Unlocked by completing the scholarship interview.' }, unlockMission: 'final-interview' },
  { id: 'sg-orchid', slot: 'corner', glyph: '🌺', name: { vi: 'Chậu lan Singapore', en: 'Singapore orchid' }, description: { vi: 'Loài lan là quốc hoa của Singapore.', en: 'The orchid is Singapore\'s national flower.' }, unlockMission: 'arrival', price: 40 },
  { id: 'sg-hawker-poster', slot: 'wall', glyph: '🍜', name: { vi: 'Tranh món hawker', en: 'Hawker food poster' }, description: { vi: 'Tranh vẽ các món ăn vặt Singapore.', en: 'A print of Singapore street-food dishes.' }, unlockMission: 'arrival', price: 20 },
];

export const DEFAULT_DORM_DECORATIONS: Record<DormSlot, string> = {
  bed: 'bed-starter',
  desk: 'desk-starter',
  wall: 'wall-starter',
  corner: 'corner-starter',
  shelf: 'shelf-starter',
};
