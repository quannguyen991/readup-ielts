/**
 * ĐỔI SAO — danh mục và luật mua, dạng hàm thuần.
 *
 * SAO ⭐ LÀ TIỀN DUY NHẤT CỦA APP, và chỉ kiếm được bằng việc học: thời gian học
 * và số câu làm (có trần mỗi ngày, `gamification/points.ts`), cộng sao thưởng từ
 * trận đấu khi học (hạ quái, boss, lên cấp, nhiệm vụ, huy hiệu). Không có nút
 * nạp sao bằng tiền — thứ gì đổi được bằng sao đều là phần thưởng cho công học.
 *
 * ĐỔI ĐƯỢC GÌ:
 *  - Vé gói Plus/Pro CÓ HẠN (7 ngày). Trước đây cửa hàng cấm hẳn mọi thứ dính tới
 *    nội dung học; người dùng chốt lại (24/09/2026) là cho đổi sao lấy gói — học
 *    đều thì được dùng bản đầy đủ. Trần điểm mỗi ngày vẫn là chốt chặn cày điểm:
 *    không ai "cày" nổi một vé Pro trong một buổi.
 *  - Linh vật đồng hành: giúp câu hỏi bằng mã (bỏ bớt phương án sai, đỡ một câu
 *    sai, hồi tim, chém mạnh hơn) — không bao giờ làm hộ.
 *  - Skin nhân vật, avatar động, bìa hồ sơ chuyển động, avatar emoji, nền đọc.
 *  - NỀN HỌC: nền phía sau mọi màn học (đọc, làm bài, tra từ) — thêm 30/09/2026.
 *  - Thẻ giữ chuỗi (có tác dụng THẬT với `currentStreak`) và đồ chiến đấu.
 *
 * KHÔNG BÁN: bài đọc, đề thi hay lời giải lẻ — nội dung chỉ mở theo gói.
 */

import type { ItemKind } from '@/services/game/rules';
import type { MascotId } from '@/services/game/mascots';
import type { SkinId } from '@/components/game/sprites';
import type { StudyBgLook } from '@/components/layout/study-backgrounds';
import { FURNITURE, furnitureShopId } from '@/data/city/furniture';

export type ShopItemKind = 'plan' | 'mascot' | 'skin' | 'avatarAnim' | 'cover' | 'effect' | 'powerup' | 'freeze' | 'avatar' | 'theme' | 'studyBg' | 'furniture';

/** Kiểu avatar động — `components/profile/AnimatedAvatar.tsx` vẽ theo mã này. */
export type AvatarLook = 'hero' | 'slime' | 'ghost' | 'owl' | 'dragon' | 'star';
/** Kiểu bìa hồ sơ chuyển động — `components/profile/ProfileCover.tsx`. */
export type CoverLook = 'stars' | 'aurora' | 'sunset' | 'ocean' | 'cyberpunk' | 'sakura' | 'mountain' | 'galaxy' | 'library' | 'bamboo' | 'autumn' | 'vaporwave';
/** Hiệu ứng hồ sơ & thanh bên — `components/profile/ProfileEffect.tsx`. */
export type EffectLook = 'sakura' | 'flame' | 'meteor' | 'snow' | 'bubbles' | 'sparkle' | 'autumn' | 'matrix' | 'fireflies' | 'butterflies' | 'lightning' | 'galaxy' | 'starlight' | 'neon_pulse' | 'rainbow';
/** Kiểu giao diện toàn diện — đổi màu thanh bên và màn hình. */
export type ThemeLook = 'sepia' | 'emerald' | 'midnight' | 'sakura' | 'cyberpunk' | 'ocean' | 'sunset' | 'lavender' | 'nord' | 'matcha';

export type ShopItem = {
  id: string;
  kind: ShopItemKind;
  name: string;
  detail: string;
  price: number;
  /** Emoji làm hình — tự vẽ, không mượn ảnh của ai. */
  glyph: string;
  /** Mua nhiều lần được (vé gói, thẻ giữ chuỗi, đồ chiến đấu) hay chỉ một lần. */
  repeatable: boolean;
  /** Số ngày chuỗi mà một thẻ giữ được. */
  freezeDays?: number;
  /** Đồ chiến đấu: mua xong vào thẳng túi đồ của nhân vật (`useGameStore`). */
  grants?: ItemKind;
  /** Vé gói: gói nào, bao nhiêu ngày. */
  plan?: { id: 'plus' | 'pro'; days: number };
  mascot?: MascotId;
  skin?: SkinId;
  avatarLook?: AvatarLook;
  cover?: CoverLook;
  effect?: EffectLook;
  themeLook?: ThemeLook;
  /** Nền học: mẫu nền sau mọi màn học (`components/layout/study-backgrounds.ts`). */
  studyBg?: StudyBgLook;
  /** Nội thất: bày trong nhà ở Thành phố Tri thức (`services/city/life.ts`). */
  furniture?: string;
};

const FURNITURE_ITEMS: ShopItem[] = FURNITURE.map((f) => ({
  id: furnitureShopId(f.id),
  kind: 'furniture' as const,
  name: f.vi,
  detail: f.kind === 'wall' ? 'Treo tường trong nhà của bạn ở Thành phố Tri thức.' : f.kind === 'rug' ? 'Trải sàn, đặt đồ khác lên trên được.' : 'Bày trong nhà của bạn ở Thành phố Tri thức.',
  price: f.price,
  glyph: f.glyph,
  repeatable: true,
  furniture: f.id,
}));

export const SHOP_ITEMS: ShopItem[] = [
  // ---------------------------------------------------------------- vé gói
  // Vé ghi ở máy như bản dùng thử: mở phần nội dung bị khoá. Lượt gọi AI do máy
  // chủ đếm theo gói ĐÃ TRẢ TIỀN — vé không cộng lượt AI, nên mô tả không hứa điều đó.
  { id: 'pass-plus-1', kind: 'plan', name: 'Vé Plus 1 ngày', detail: 'Trải nghiệm toàn bộ bài đọc, thi thử và sổ từ trong 24 giờ.', price: 120, glyph: '🎫', repeatable: true, plan: { id: 'plus', days: 1 } },
  { id: 'pass-pro-1', kind: 'plan', name: 'Vé Pro 1 ngày', detail: 'Trải nghiệm trợ giảng AI và bài mẫu thẩm định trong 24 giờ.', price: 250, glyph: '👑', repeatable: true, plan: { id: 'pro', days: 1 } },
  { id: 'pass-plus-7', kind: 'plan', name: 'Vé Plus 7 ngày', detail: 'Đọc, thi thử và sổ từ không giới hạn trong 7 ngày. Đang có vé Plus thì cộng dồn.', price: 700, glyph: '🎟️', repeatable: true, plan: { id: 'plus', days: 7 } },
  { id: 'pass-pro-7', kind: 'plan', name: 'Vé Pro 7 ngày', detail: 'Mọi thứ của Plus, thêm bài mẫu đã kiểm định và chatbox trợ giảng, trong 7 ngày.', price: 1400, glyph: '👑', repeatable: true, plan: { id: 'pro', days: 7 } },
  { id: 'pass-plus-14', kind: 'plan', name: 'Vé Plus 14 ngày', detail: 'Hai tuần luyện đọc và giải đề không giới hạn với giá tiết kiệm.', price: 1300, glyph: '🎟️', repeatable: true, plan: { id: 'plus', days: 14 } },
  { id: 'pass-pro-14', kind: 'plan', name: 'Vé Pro 14 ngày', detail: 'Hai tuần luyện thi trọn vẹn mọi tính năng cao cấp cho giai đoạn nước rút.', price: 2600, glyph: '💎', repeatable: true, plan: { id: 'pro', days: 14 } },

  // ---------------------------------------------------------------- linh vật
  { id: 'mascot-owl', kind: 'mascot', name: 'Cú Thông Thái', detail: '3 lượt Hỏi Cú miễn phí mỗi ngày.', price: 500, glyph: '🦉', repeatable: false, mascot: 'owl' },
  { id: 'mascot-fox', kind: 'mascot', name: 'Cáo Tinh Ranh', detail: 'Đỡ câu sai đầu tiên mỗi ngày.', price: 600, glyph: '🦊', repeatable: false, mascot: 'fox' },
  { id: 'mascot-cat', kind: 'mascot', name: 'Mèo Lười', detail: 'Cứ 10 câu đúng hồi 1 tim.', price: 450, glyph: '🐱', repeatable: false, mascot: 'cat' },
  { id: 'mascot-dragon', kind: 'mascot', name: 'Rồng Con', detail: 'Mỗi nhát chém mạnh thêm 20%.', price: 800, glyph: '🐲', repeatable: false, mascot: 'dragon' },

  // ---------------------------------------------------------------- skin nhân vật
  { id: 'skin-ninja', kind: 'skin', name: 'Ninja bóng đêm', detail: 'Áo đen, khăn đỏ.', price: 300, glyph: '🥷', repeatable: false, skin: 'ninja' },
  { id: 'skin-mage', kind: 'skin', name: 'Pháp sư tím', detail: 'Áo choàng vàng, gậy phép hồng.', price: 350, glyph: '🧙', repeatable: false, skin: 'mage' },
  { id: 'skin-samurai', kind: 'skin', name: 'Samurai đỏ', detail: 'Giáp đỏ, chuôi kiếm vàng.', price: 400, glyph: '⚔️', repeatable: false, skin: 'samurai' },
  { id: 'skin-astronaut', kind: 'skin', name: 'Phi hành gia', detail: 'Bộ đồ trắng, kiếm tia xanh.', price: 450, glyph: '🧑‍🚀', repeatable: false, skin: 'astronaut' },
  { id: 'skin-gold', kind: 'skin', name: 'Hiệp sĩ vàng', detail: 'Giáp vàng, áo choàng tím — bản hiếm.', price: 800, glyph: '🏆', repeatable: false, skin: 'gold' },

  // ---------------------------------------------------------------- avatar động
  { id: 'anim-hero', kind: 'avatarAnim', name: 'Hiệp sĩ nhún nhảy', detail: 'Mặc đúng skin bạn đang đeo.', price: 200, glyph: '🗡️', repeatable: false, avatarLook: 'hero' },
  { id: 'anim-slime', kind: 'avatarAnim', name: 'Nhớt nảy tưng', detail: 'Nảy liên tục, mắt chớp.', price: 150, glyph: '🫧', repeatable: false, avatarLook: 'slime' },
  { id: 'anim-ghost', kind: 'avatarAnim', name: 'Ma bay lượn', detail: 'Bay lên xuống, mờ tỏ.', price: 180, glyph: '👻', repeatable: false, avatarLook: 'ghost' },
  { id: 'anim-owl', kind: 'avatarAnim', name: 'Cú lắc đầu', detail: 'Nghiêng đầu nhìn bạn.', price: 220, glyph: '🦉', repeatable: false, avatarLook: 'owl' },
  { id: 'anim-star', kind: 'avatarAnim', name: 'Sao lấp lánh', detail: 'Chùm sao phát sáng xoay quanh.', price: 250, glyph: '✨', repeatable: false, avatarLook: 'star' },
  { id: 'anim-dragon', kind: 'avatarAnim', name: 'Rồng phun lửa', detail: 'Vỗ cánh, phì lửa — bản hiếm.', price: 400, glyph: '🔥', repeatable: false, avatarLook: 'dragon' },

  // ---------------------------------------------------------------- bìa hồ sơ
  { id: 'cover-stars', kind: 'cover', name: 'Bầu trời sao', detail: 'Sao nhấp nháy, thỉnh thoảng một vệt sao băng.', price: 250, glyph: '🌌', repeatable: false, cover: 'stars' },
  { id: 'cover-sunset', kind: 'cover', name: 'Hoàng hôn pixel', detail: 'Mặt trời lặn sau đồi, mây trôi.', price: 300, glyph: '🌅', repeatable: false, cover: 'sunset' },
  { id: 'cover-ocean', kind: 'cover', name: 'Sóng biển', detail: 'Sóng vỗ, mặt trời lấp lánh trên nước.', price: 300, glyph: '🌊', repeatable: false, cover: 'ocean' },
  { id: 'cover-aurora', kind: 'cover', name: 'Cực quang', detail: 'Dải sáng loang chậm trên nền đêm.', price: 350, glyph: '🌠', repeatable: false, cover: 'aurora' },
  { id: 'cover-cyberpunk', kind: 'cover', name: 'Đêm Neon tương lai', detail: 'Tòa nhà chọc trời ánh đèn neon và lưới laser Cyberpunk.', price: 380, glyph: '🏙️', repeatable: false, cover: 'cyberpunk' },
  { id: 'cover-sakura', kind: 'cover', name: 'Cổng Torii & Hoa anh đào', detail: 'Khung cảnh mùa xuân Nhật Bản ngập tràn cánh hoa rơi.', price: 360, glyph: '🌸', repeatable: false, cover: 'sakura' },
  { id: 'cover-mountain', kind: 'cover', name: 'Đỉnh núi mây sương', detail: 'Dãy núi hùng vĩ bồng bềnh trong ánh bình minh vàng.', price: 340, glyph: '⛰️', repeatable: false, cover: 'mountain' },
  { id: 'cover-galaxy', kind: 'cover', name: 'Trái tim Ngân Hà', detail: 'Hố đen vũ trụ với đĩa phát quang lung linh huyền bí.', price: 450, glyph: '🪐', repeatable: false, cover: 'galaxy' },
  { id: 'cover-library', kind: 'cover', name: 'Thư viện cổ tích', detail: 'Giá sách gỗ ấm áp với ánh nến vàng hoài niệm.', price: 320, glyph: '🕯️', repeatable: false, cover: 'library' },
  { id: 'cover-bamboo', kind: 'cover', name: 'Rừng trúc Thiền định', detail: 'Khóm trúc xanh mát thanh tịnh bên dòng suối nhỏ.', price: 300, glyph: '🎋', repeatable: false, cover: 'bamboo' },
  { id: 'cover-autumn', kind: 'cover', name: 'Rừng phong lá đỏ', detail: 'Thung lũng mùa thu rực rỡ sắc đỏ và vàng cam.', price: 350, glyph: '🍂', repeatable: false, cover: 'autumn' },
  { id: 'cover-vaporwave', kind: 'cover', name: 'Hoàng hôn Retrowave', detail: 'Mặt trời lưới laser phong cách Synthwave thập niên 80.', price: 400, glyph: '🌇', repeatable: false, cover: 'vaporwave' },

  // ---------------------------------------------------------------- hiệu ứng hồ sơ & thanh bên (kiểu Discord)
  { id: 'fx-sakura', kind: 'effect', name: 'Hoa anh đào', detail: 'Cánh hoa hồng rơi chậm phủ cả thẻ hồ sơ và thanh bên.', price: 400, glyph: '🌸', repeatable: false, effect: 'sakura' },
  { id: 'fx-snow', kind: 'effect', name: 'Tuyết đầu mùa', detail: 'Tuyết trắng rơi lất phất, quầng sáng lạnh dịu mát.', price: 400, glyph: '❄️', repeatable: false, effect: 'snow' },
  { id: 'fx-bubbles', kind: 'effect', name: 'Bong bóng đại dương', detail: 'Bong bóng trong suốt nổi lên từ đáy thẻ và thanh bên.', price: 450, glyph: '🫧', repeatable: false, effect: 'bubbles' },
  { id: 'fx-sparkle', kind: 'effect', name: 'Kim tuyến phép thuật', detail: 'Sao lấp lánh nhiều màu nhấp nháy lung linh.', price: 500, glyph: '✨', repeatable: false, effect: 'sparkle' },
  { id: 'fx-meteor', kind: 'effect', name: 'Mưa sao băng', detail: 'Vệt sao băng lao chéo qua thẻ hồ sơ và thanh bên.', price: 600, glyph: '🌠', repeatable: false, effect: 'meteor' },
  { id: 'fx-flame', kind: 'effect', name: 'Lửa tím huyền bí', detail: 'Tàn lửa cam tím bốc lên, rực cả đáy thẻ — bản hiếm.', price: 800, glyph: '🔥', repeatable: false, effect: 'flame' },
  { id: 'fx-autumn', kind: 'effect', name: 'Lá phong mùa thu', detail: 'Những chiếc lá phong vàng cam lượn bay nhẹ nhàng chao nghiêng.', price: 450, glyph: '🍁', repeatable: false, effect: 'autumn' },
  { id: 'fx-matrix', kind: 'effect', name: 'Ma trận số Cyberpunk', detail: 'Dòng mã số và chùm sáng xanh neon tuôn rơi liên tục.', price: 500, glyph: '⚡', repeatable: false, effect: 'matrix' },
  { id: 'fx-fireflies', kind: 'effect', name: 'Đom đóm đêm hè', detail: 'Đốm sáng đom đóm lơ lửng, chớp tắt êm đềm trong đêm.', price: 420, glyph: '✨', repeatable: false, effect: 'fireflies' },
  { id: 'fx-butterflies', kind: 'effect', name: 'Bướm ngọc ảo ảnh', detail: 'Đàn bướm phát sáng dập dờn huyền ảo.', price: 480, glyph: '🦋', repeatable: false, effect: 'butterflies' },
  { id: 'fx-lightning', kind: 'effect', name: 'Tia chớp sấm sét', detail: 'Những tia sấm sét điện tím chớp sáng rực rỡ.', price: 520, glyph: '🌩️', repeatable: false, effect: 'lightning' },
  { id: 'fx-galaxy', kind: 'effect', name: 'Vòng xoáy thiên hà', detail: 'Bụi tinh vân lấp lánh chuyển động nhẹ nhàng.', price: 650, glyph: '🌌', repeatable: false, effect: 'galaxy' },
  { id: 'fx-starlight', kind: 'effect', name: 'Bầu trời sao băng', detail: 'Ngàn vì sao lấp lánh điểm xuyết sao băng bay qua.', price: 550, glyph: '🌠', repeatable: false, effect: 'starlight' },
  { id: 'fx-neon-pulse', kind: 'effect', name: 'Nhịp đập Synthwave', detail: 'Dải sáng neon tím lam nhấp nháy theo nhịp điệu tương lai.', price: 580, glyph: '🌆', repeatable: false, effect: 'neon_pulse' },
  { id: 'fx-rainbow', kind: 'effect', name: 'Lăng kính cầu vồng', detail: 'Ánh sáng 7 sắc lăng kính dịu dàng phủ khắp khung hình.', price: 460, glyph: '🌈', repeatable: false, effect: 'rainbow' },

  // ---------------------------------------------------------------- đồ chiến đấu
  { id: 'power-potion', kind: 'powerup', name: 'Bình máu', detail: 'Hồi 2 tim giữa trận.', price: 30, glyph: '🧪', repeatable: true, grants: 'potion' },
  { id: 'power-shield', kind: 'powerup', name: 'Khiên', detail: 'Chặn một câu sai, giữ combo.', price: 40, glyph: '🛡️', repeatable: true, grants: 'shield' },
  { id: 'power-hint', kind: 'powerup', name: 'Gợi ý của Cú', detail: 'Bỏ bớt 2 phương án sai.', price: 25, glyph: '🦉', repeatable: true, grants: 'hint' },
  { id: 'power-double', kind: 'powerup', name: 'Nhân đôi XP', detail: '10 câu đúng tiếp theo gấp đôi XP.', price: 60, glyph: '⚡', repeatable: true, grants: 'double' },

  // ---------------------------------------------------------------- vật phẩm (thẻ giữ chuỗi)
  {
    id: 'freeze-1',
    kind: 'freeze',
    name: 'Thẻ giữ chuỗi',
    detail: 'Giữ chuỗi cho một ngày bạn không kịp học.',
    price: 50,
    glyph: '❄️',
    repeatable: true,
    freezeDays: 1,
  },
  {
    id: 'freeze-3',
    kind: 'freeze',
    name: 'Thẻ giữ chuỗi 3 ngày',
    detail: 'Cho những đợt thi cử hoặc đi xa.',
    price: 130,
    glyph: '🧊',
    repeatable: true,
    freezeDays: 3,
  },
  {
    id: 'freeze-7',
    kind: 'freeze',
    name: 'Thẻ kỳ nghỉ 7 ngày',
    detail: 'Bảo vệ chuỗi học tập trọn 1 tuần khi bạn đi du lịch hoặc bận thi cử.',
    price: 280,
    glyph: '🏔️',
    repeatable: true,
    freezeDays: 7,
  },
  {
    id: 'freeze-14',
    kind: 'freeze',
    name: 'Thẻ nghỉ dưỡng 14 ngày',
    detail: 'Bảo vệ chuỗi học tập trọn vẹn 2 tuần cho chuyến đi xa.',
    price: 480,
    glyph: '✈️',
    repeatable: true,
    freezeDays: 14,
  },
  {
    id: 'freeze-30',
    kind: 'freeze',
    name: 'Thẻ nghỉ hè 30 ngày',
    detail: 'Gói bảo vệ chuỗi tối thượng trọn một tháng.',
    price: 950,
    glyph: '🏖️',
    repeatable: true,
    freezeDays: 30,
  },

  // ---------------------------------------------------------------- avatar emoji & giao diện
  { id: 'avatar-owl', kind: 'avatar', name: 'Cú đêm', detail: 'Avatar', price: 100, glyph: '🦉', repeatable: false },
  { id: 'avatar-cat', kind: 'avatar', name: 'Mèo lười', detail: 'Avatar', price: 100, glyph: '🐱', repeatable: false },
  { id: 'avatar-fox', kind: 'avatar', name: 'Cáo tinh ranh', detail: 'Avatar', price: 180, glyph: '🦊', repeatable: false },
  { id: 'avatar-whale', kind: 'avatar', name: 'Cá voi', detail: 'Avatar', price: 180, glyph: '🐳', repeatable: false },
  { id: 'avatar-dragon', kind: 'avatar', name: 'Rồng', detail: 'Avatar', price: 400, glyph: '🐉', repeatable: false },
  { id: 'avatar-rocket', kind: 'avatar', name: 'Tên lửa', detail: 'Avatar', price: 400, glyph: '🚀', repeatable: false },
  { id: 'avatar-lion', kind: 'avatar', name: 'Sư tử', detail: 'Avatar dũng mãnh, kiên định vượt qua mọi đề thi.', price: 150, glyph: '🦁', repeatable: false },
  { id: 'avatar-panda', kind: 'avatar', name: 'Gấu trúc', detail: 'Avatar cần mẫn, từng bước tích lũy từng điểm số.', price: 150, glyph: '🐼', repeatable: false },
  { id: 'avatar-tiger', kind: 'avatar', name: 'Hổ chiến binh', detail: 'Avatar bùng nổ năng lượng trong mọi phiên làm bài.', price: 180, glyph: '🐯', repeatable: false },
  { id: 'avatar-eagle', kind: 'avatar', name: 'Đại bàng', detail: 'Avatar mắt biếc, nhìn thấu mọi bẫy của đề thi.', price: 200, glyph: '🦅', repeatable: false },
  { id: 'avatar-unicorn', kind: 'avatar', name: 'Kỳ lân', detail: 'Avatar phép thuật mang lại cảm hứng học tập diệu kỳ.', price: 350, glyph: '🦄', repeatable: false },
  { id: 'avatar-koala', kind: 'avatar', name: 'Gấu túi', detail: 'Avatar điềm tĩnh, học tập nhẹ nhàng không âu lo.', price: 120, glyph: '🐨', repeatable: false },
  { id: 'avatar-dino', kind: 'avatar', name: 'Khủng long', detail: 'Avatar kỷ Jura bền bỉ, không lùi bước trước câu khó.', price: 220, glyph: '🦖', repeatable: false },
  { id: 'avatar-crown', kind: 'avatar', name: 'Vương miện', detail: 'Avatar vinh quang dành cho học viên kiên trì nhất.', price: 500, glyph: '👑', repeatable: false },
  { id: 'avatar-lightning', kind: 'avatar', name: 'Tia chớp', detail: 'Avatar tốc độ phản xạ câu hỏi nhanh như chớp.', price: 220, glyph: '⚡', repeatable: false },
  { id: 'avatar-earth', kind: 'avatar', name: 'Địa cầu', detail: 'Avatar nhà thám hiểm, mở rộng vốn từ không biên giới.', price: 160, glyph: '🌍', repeatable: false },
  { id: 'avatar-trophy', kind: 'avatar', name: 'Cúp vàng', detail: 'Avatar danh dự ghi nhận chuỗi thành tích xuất sắc.', price: 380, glyph: '🏆', repeatable: false },
  { id: 'avatar-phoenix', kind: 'avatar', name: 'Phượng hoàng', detail: 'Avatar hồi sinh chuỗi ngày học tập và bứt phá band điểm.', price: 450, glyph: '🪶', repeatable: false },
  { id: 'avatar-books', kind: 'avatar', name: 'Sách tri thức', detail: 'Avatar mọt sách chân chính, đọc sâu nhớ lâu.', price: 160, glyph: '📚', repeatable: false },
  { id: 'avatar-graduate', kind: 'avatar', name: 'Mũ cử nhân', detail: 'Avatar biểu trưng cho ngày chạm tới mục tiêu du học.', price: 250, glyph: '🎓', repeatable: false },
  { id: 'avatar-fox-spirit', kind: 'avatar', name: 'Hồ ly chín đuôi', detail: 'Avatar linh thú huyền thoại phương Đông thông thái.', price: 420, glyph: '🦊', repeatable: false },
  { id: 'avatar-pegasus', kind: 'avatar', name: 'Ngựa thần Pegasus', detail: 'Avatar ngựa có cánh sải bước bay lượn.', price: 380, glyph: '🎠', repeatable: false },
  { id: 'avatar-ninja-cat', kind: 'avatar', name: 'Mèo Ninja', detail: 'Avatar mèo đen bí ẩn, thoắt ẩn thoắt hiện.', price: 260, glyph: '🐱‍👤', repeatable: false },
  { id: 'avatar-shiba', kind: 'avatar', name: 'Chó Shiba', detail: 'Avatar chú chó Shiba Nhật Bản đáng yêu và tràn đầy năng lượng.', price: 180, glyph: '🐕', repeatable: false },
  { id: 'avatar-black-cat', kind: 'avatar', name: 'Mèo đen mắt ngọc', detail: 'Avatar mèo đen huyền bí với đôi mắt sáng ngời.', price: 190, glyph: '🐈‍⬛', repeatable: false },
  { id: 'avatar-alien', kind: 'avatar', name: 'Người ngoài hành tinh', detail: 'Avatar người bạn từ vũ trụ tò mò học ngôn ngữ Trái Đất.', price: 240, glyph: '👽', repeatable: false },
  { id: 'avatar-ghost', kind: 'avatar', name: 'Hồn ma tinh nghịch', detail: 'Avatar ma nhỏ đáng yêu, không sợ đề thi nào.', price: 170, glyph: '👻', repeatable: false },
  { id: 'avatar-magic-hat', kind: 'avatar', name: 'Nón phù thủy', detail: 'Avatar biểu trưng cho phép thuật tri thức diệu kỳ.', price: 220, glyph: '🧙', repeatable: false },

  // Giao diện (Theme) toàn diện — áp dụng cho cả thanh bên và trải nghiệm đọc
  {
    id: 'theme-sepia',
    kind: 'theme',
    name: 'Nền giấy ngà',
    detail: 'Tông sách cổ điển ngả vàng, phong cách vintage êm dịu.',
    price: 220,
    glyph: '📜',
    repeatable: false,
    themeLook: 'sepia',
  },
  {
    id: 'theme-emerald',
    kind: 'theme',
    name: 'Nền ngọc bích',
    detail: 'Tông xanh ngọc bích thư thái, mát mẻ dịu mắt khi đọc lâu.',
    price: 250,
    glyph: '🍃',
    repeatable: false,
    themeLook: 'emerald',
  },
  {
    id: 'theme-midnight',
    kind: 'theme',
    name: 'Vũ trụ sao đêm',
    detail: 'Giao diện bầu trời đêm ngàn sao với mưa sao băng lướt nhẹ trên thanh bên.',
    price: 300,
    glyph: '🌌',
    repeatable: false,
    themeLook: 'midnight',
  },
  {
    id: 'theme-sakura',
    kind: 'theme',
    name: 'Vườn hoa anh đào',
    detail: 'Giao diện hồng phấn thanh lịch với những cánh hoa đào rơi êm đềm trên thanh bên.',
    price: 280,
    glyph: '🌸',
    repeatable: false,
    themeLook: 'sakura',
  },
  {
    id: 'theme-cyberpunk',
    kind: 'theme',
    name: 'Cyberpunk 2077',
    detail: 'Giao diện đen công nghệ với viền neon xanh lam và hồng tím huyền ảo.',
    price: 350,
    glyph: '🕶️',
    repeatable: false,
    themeLook: 'cyberpunk',
  },
  {
    id: 'theme-ocean',
    kind: 'theme',
    name: 'Đại dương sâu',
    detail: 'Giao diện xanh thẳm của đáy biển với bong bóng nước trôi nổi dịu êm.',
    price: 280,
    glyph: '🌊',
    repeatable: false,
    themeLook: 'ocean',
  },
  {
    id: 'theme-sunset',
    kind: 'theme',
    name: 'Hoàng hôn rực rỡ',
    detail: 'Giao diện cam tím pastel ấm áp như ráng chiều hoàng hôn buông xuống.',
    price: 260,
    glyph: '🌇',
    repeatable: false,
    themeLook: 'sunset',
  },
  {
    id: 'theme-lavender',
    kind: 'theme',
    name: 'Giấc mộng Lavender',
    detail: 'Giao diện tím oải hương mộng mơ, mang lại cảm giác thư giãn tuyệt đối.',
    price: 260,
    glyph: '🪻',
    repeatable: false,
    themeLook: 'lavender',
  },
  {
    id: 'theme-nord',
    kind: 'theme',
    name: 'Băng tuyết Bắc Âu',
    detail: 'Giao diện phong cách tối giản Scandinavia với tuyết rơi trắng muốt.',
    price: 270,
    glyph: '❄️',
    repeatable: false,
    themeLook: 'nord',
  },
  {
    id: 'theme-matcha',
    kind: 'theme',
    name: 'Trà đạo Matcha',
    detail: 'Giao diện xanh cốm dịu nhẹ đậm chất thiền định thanh bình.',
    price: 250,
    glyph: '🍵',
    repeatable: false,
    themeLook: 'matcha',
  },

  // ---------------------------------------------------------------- nền học (sau mọi màn học)
  { id: 'bg-mint', kind: 'studyBg', name: 'Giấy kẻ ô bạc hà', detail: 'Xanh bạc hà mát mắt, lưới ô mảnh như vở luyện chữ.', price: 180, glyph: '🌿', repeatable: false, studyBg: 'mint' },
  { id: 'bg-peach', kind: 'studyBg', name: 'Hồng đào buổi sớm', detail: 'Tông đào ấm pha hồng, kẻ ô nhạt — dịu cho buổi học dài.', price: 180, glyph: '🍑', repeatable: false, studyBg: 'peach' },
  { id: 'bg-lemon', kind: 'studyBg', name: 'Chanh vàng nắng nhẹ', detail: 'Vàng chanh rất nhạt, lưới chấm bi kiểu sổ bullet journal.', price: 200, glyph: '🍋', repeatable: false, studyBg: 'lemon' },
  { id: 'bg-lavender', kind: 'studyBg', name: 'Oải hương chấm bi', detail: 'Tím oải hương thư thái với lưới chấm tròn tinh tế.', price: 200, glyph: '🪻', repeatable: false, studyBg: 'lavender' },
  { id: 'bg-sky', kind: 'studyBg', name: 'Trời sớm kẻ dòng', detail: 'Xanh trời trong, kẻ dòng ngang như trang giấy viết.', price: 200, glyph: '☁️', repeatable: false, studyBg: 'sky' },
  { id: 'bg-kraft', kind: 'studyBg', name: 'Giấy kraft thủ công', detail: 'Nâu kraft mộc mạc, chấm nhỏ như sổ tay giấy tái chế.', price: 220, glyph: '📦', repeatable: false, studyBg: 'kraft' },
  { id: 'bg-notebook', kind: 'studyBg', name: 'Vở học trò', detail: 'Giấy trắng ngà kẻ dòng xanh, đường lề đỏ bên trái — đúng cuốn vở ngày đi học.', price: 250, glyph: '📓', repeatable: false, studyBg: 'notebook' },
  { id: 'bg-sage', kind: 'studyBg', name: 'Xô thơm kẻ chéo', detail: 'Xanh xô thơm nhã nhặn với đường chéo mảnh chạy đều.', price: 220, glyph: '🍃', repeatable: false, studyBg: 'sage' },
  { id: 'bg-sand', kind: 'studyBg', name: 'Cát biển trơn', detail: 'Màu cát ấm, không hoạ tiết — cho ai thích nền thật sạch.', price: 150, glyph: '🏖️', repeatable: false, studyBg: 'sand' },
  { id: 'bg-rose', kind: 'studyBg', name: 'Hoa hồng phấn', detail: 'Hồng phấn nhẹ nhàng, lưới ô mảnh cùng tông.', price: 180, glyph: '🌹', repeatable: false, studyBg: 'rose' },
  { id: 'bg-aqua', kind: 'studyBg', name: 'Hồ nước trong', detail: 'Xanh ngọc nước hồ, kẻ chéo như gợn sóng.', price: 220, glyph: '💧', repeatable: false, studyBg: 'aqua' },
  { id: 'bg-dusk', kind: 'studyBg', name: 'Chiều tím hoàng hôn', detail: 'Tím nhạt chuyển sang cam đào ở góc dưới — bản hiếm.', price: 300, glyph: '🌆', repeatable: false, studyBg: 'dusk' },
  ...FURNITURE_ITEMS,
];

export function findItem(id: string | null | undefined): ShopItem | undefined {
  return id ? SHOP_ITEMS.find((i) => i.id === id) : undefined;
}

export type PurchaseState = {
  /** Số lần đã mua từng món. */
  owned: Record<string, number>;
  spent: number;
};

export type BuyResult =
  | { ok: true; spent: number; owned: Record<string, number> }
  | { ok: false; reason: 'không-đủ-sao' | 'đã-sở-hữu' | 'không-có-món-này' };

export function buy(state: PurchaseState, itemId: string, balance: number): BuyResult {
  const item = findItem(itemId);
  if (!item) return { ok: false, reason: 'không-có-món-này' };
  if (!item.repeatable && (state.owned[itemId] ?? 0) > 0) return { ok: false, reason: 'đã-sở-hữu' };
  if (balance < item.price) return { ok: false, reason: 'không-đủ-sao' };

  return {
    ok: true,
    spent: state.spent + item.price,
    owned: { ...state.owned, [itemId]: (state.owned[itemId] ?? 0) + 1 },
  };
}

/** Số sao còn lại: sao từ việc học + sao thưởng trận đấu − đã đổi. Không bao giờ âm. */
export function starBalance(studyStars: number, bonusStars: number, spent: number): number {
  return Math.max(0, Math.round(studyStars) + Math.max(0, Math.round(bonusStars)) - spent);
}

/** Cách cũ (chỉ có sao từ việc học) — giữ cho nơi gọi chưa có sao thưởng. */
export function balanceOf(lifetimeEarned: number, spent: number): number {
  return starBalance(lifetimeEarned, 0, spent);
}

/**
 * GỢI Ý ĐỔI SAO: tối đa 3 món đổi được NGAY (mỗi loại một món — món đắt nhất
 * trong tầm, vì người học tích sao là để đổi thứ ra hồn) và một món đích gần
 * nhất chưa đủ sao. Chỉ gợi ý đồ trang trí / nội thất chưa có: vé gói phụ thuộc
 * gói đang dùng, đồ chiến đấu và thẻ giữ chuỗi thì người học tự biết lúc cần.
 */
export function spendIdeas(balance: number, owned: Record<string, number>): { now: ShopItem[]; next: ShopItem | null } {
  const skip: ShopItemKind[] = ['plan', 'powerup', 'freeze'];
  const candidates = SHOP_ITEMS.filter((i) => !skip.includes(i.kind) && (owned[i.id] ?? 0) === 0);
  const bestByKind = new Map<ShopItemKind, ShopItem>();
  for (const i of candidates) {
    if (i.price > balance) continue;
    const cur = bestByKind.get(i.kind);
    if (!cur || i.price > cur.price) bestByKind.set(i.kind, i);
  }
  const now = [...bestByKind.values()].sort((a, b) => b.price - a.price).slice(0, 3);
  const next = candidates.filter((i) => i.price > balance).sort((a, b) => a.price - b.price)[0] ?? null;
  return { now, next };
}

/** Số hiển thị gọn: 1.234 · 12,3k. */
export function formatStars(n: number): string {
  return n >= 10000 ? `${(n / 1000).toFixed(1).replace('.', ',')}k` : n.toLocaleString('vi-VN');
}

// ---------------------------------------------------------------- đồng bộ hai máy

export type RewardPayload = PurchaseState & {
  avatar: string | null;
  cover: string | null;
  /** Hiệu ứng hồ sơ đang đeo (thêm 27/09/2026 — bản cũ không có trường này). */
  effect?: string | null;
  /** Giao diện toàn diện đang áp dụng (thêm 29/09/2026). */
  theme?: string | null;
  /** Nền học đang dùng (thêm 30/09/2026). */
  studyBg?: string | null;
  skin: string | null;
  mascot: string | null;
  frozenDays: string[];
  /** Lúc đổi đồ đang đeo gần nhất — máy nào đổi sau thì máy đó thắng phần đang đeo. */
  wornAt: string;
  /** Thưởng hạng tháng đã nhận: mã tháng YYYY-MM → số sao. */
  prizes?: Record<string, number>;
};

/**
 * Gộp hai máy: món đã mua lấy số lớn hơn, sao đã tiêu lấy số lớn hơn (không bao
 * giờ để số dư phình ra vì gộp), ngày giữ chuỗi lấy hợp, đồ đang đeo theo máy đổi sau.
 */
/**
 * Ô Nền học = DEFAULT_LOOK nghĩa là người dùng CHỦ ĐỘNG chọn nền kem vàng kim
 * mặc định của Band 9 — khác với null (chưa chọn gì, khi đó nền đi theo Giao
 * diện đang dùng). Không phải món trong cửa hàng, không cần sở hữu.
 */
export const DEFAULT_LOOK = 'band9-default';

export function mergeReward(local: RewardPayload | null, remote: RewardPayload | null): RewardPayload | null {
  if (!local) return remote;
  if (!remote) return local;
  const owned: Record<string, number> = { ...remote.owned };
  for (const [id, n] of Object.entries(local.owned ?? {})) owned[id] = Math.max(owned[id] ?? 0, n);
  const worn = (local.wornAt ?? '') >= (remote.wornAt ?? '') ? local : remote;
  const other = worn === local ? remote : local;
  /*
    Ô mới (effect, theme, studyBg) có thể THIẾU HẲN trong payload do bản app cũ
    gửi lên — bản cũ quên gửi `theme` nên mỗi lần F5 (đồng bộ) giao diện bị gộp
    thành null. Thiếu trường (undefined) nghĩa là "không ghi nhận", không phải
    "đã bỏ đeo": lấy giá trị của bên kia. Chỉ `null` mới là bỏ đeo thật.
  */
  const slot = (k: 'effect' | 'theme' | 'studyBg') => (worn[k] !== undefined ? worn[k] : other[k]) ?? null;
  // Thưởng tháng: mỗi tháng một lần — hai máy cùng nhận thì vẫn chỉ là một khoản.
  const prizes: Record<string, number> = { ...(remote.prizes ?? {}) };
  for (const [month, n] of Object.entries(local.prizes ?? {})) prizes[month] = Math.max(prizes[month] ?? 0, n);
  return {
    owned,
    spent: Math.max(local.spent ?? 0, remote.spent ?? 0),
    frozenDays: [...new Set([...(local.frozenDays ?? []), ...(remote.frozenDays ?? [])])].sort(),
    avatar: worn.avatar ?? null,
    cover: worn.cover ?? null,
    effect: slot('effect'),
    theme: slot('theme'),
    studyBg: slot('studyBg'),
    skin: worn.skin ?? null,
    mascot: worn.mascot ?? null,
    wornAt: worn.wornAt ?? '',
    prizes,
  };
}
