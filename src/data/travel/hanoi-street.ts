/**
 * Cửa hàng phụ của bản đồ Hà Nội rộng (60 lô trong `src/world/master-blueprint.ts` chưa có địa điểm lõi).
 * Mỗi dòng ứng một lô: mã lô = mã sau `hanoi-` của địa điểm. Không tính vào tiến độ thành phố
 * (`optional`), chỉ thêm lượt luyện và quà lưu niệm.
 */
import type { Bi } from '@/i18n/useL';
import type { PoiKind } from '@/services/travel/types';

export type StreetShop = {
  lot: string;
  kind: Extract<PoiKind, 'cafe' | 'restaurant' | 'market' | 'hotel' | 'garden' | 'landmark'>;
  name: Bi;
  gift: Bi;
  glyph: string;
};

const r = (lot: string, kind: StreetShop['kind'], vi: string, en: string, gvi: string, gen: string, glyph: string): StreetShop => ({
  lot,
  kind,
  name: { vi, en },
  gift: { vi: gvi, en: gen },
  glyph,
});

export const HANOI_STREET: StreetShop[] = [
  r('river-cafe', 'cafe', 'Cà phê bên sông', 'Riverside café', 'Cốc cà phê ven sông', 'Riverside coffee', '☕'),
  r('bun-thang', 'restaurant', 'Quán bún thang', 'Bún thang shop', 'Bát bún thang', 'Bowl of bún thang', '🍜'),
  r('hang-ma', 'market', 'Cửa hàng đồ chơi Hàng Mã', 'Hang Ma toy shop', 'Đèn ông sao', 'Star lantern', '🏮'),
  r('west-lane-cafe', 'cafe', 'Cà phê ngõ tây', 'West-lane café', 'Cốc cà phê nâu', 'Brown coffee', '☕'),
  r('hang-bac', 'market', 'Tiệm bạc Hàng Bạc', 'Hang Bac silver shop', 'Nhẫn bạc nhỏ', 'Little silver ring', '💍'),
  r('east-lane-tea', 'cafe', 'Quán trà ngõ đông', 'East-lane tea shop', 'Ấm trà sen', 'Lotus tea pot', '🍵'),
  r('one-pillar-cafe', 'cafe', 'Cà phê gần Chùa Một Cột', 'Café by the Pillar', 'Gói hạt cà phê', 'Bag of coffee beans', '🫘'),
  r('pho-cuon', 'restaurant', 'Quán phở cuốn', 'Phở cuốn shop', 'Cuốn phở', 'Phở roll', '🌯'),
  r('tea-house', 'cafe', 'Trà quán', 'Tea house', 'Gói trà sen', 'Lotus tea pack', '🍵'),
  r('heritage-coffee', 'cafe', 'Cà phê nhà cổ', 'Heritage coffee house', 'Phin cà phê', 'Coffee filter', '☕'),
  r('temple-tea', 'cafe', 'Trà bên đền', 'Temple tea corner', 'Chén trà nhỏ', 'Tiny tea cup', '🍵'),
  r('opera-cafe', 'cafe', 'Cà phê Nhà hát', 'Opera café', 'Ly cà phê muối', 'Salt coffee', '🥛'),
  r('east-lake-cafe', 'cafe', 'Cà phê ven hồ', 'Lakeside café', 'Cà phê cốt dừa', 'Coconut coffee', '🥥'),
  r('cafe-banh-mi', 'cafe', 'Cà phê và bánh mì', 'Coffee and bánh mì', 'Bữa sáng gọn', 'Quick breakfast', '🥐'),
  r('bun-cha-south', 'restaurant', 'Bún chả phố nam', 'Southside bún chả', 'Đôi đũa gỗ', 'Wooden chopsticks', '🥢'),
  r('night-cafe', 'cafe', 'Cà phê đêm', 'Night café', 'Đèn lồng nhỏ', 'Little lantern', '🏮'),
  r('banh-cuon', 'restaurant', 'Quán bánh cuốn nóng', 'Hot bánh cuốn shop', 'Đĩa bánh cuốn', 'Plate of bánh cuốn', '🥟'),
  r('airport-food', 'restaurant', 'Quán ăn sân bay', 'Airport eatery', 'Hộp cơm chuyến bay', 'Flight lunch box', '🍱'),
  r('south-rice-shop', 'restaurant', 'Quán cơm phố nam', 'Southside rice shop', 'Bát cơm trắng', 'Bowl of rice', '🍚'),
  r('south-tea-shop', 'cafe', 'Tiệm trà phố nam', 'Southside tea shop', 'Cốc trà đá', 'Glass of iced tea', '🧋'),
  r('south-noodle-shop', 'restaurant', 'Quán mì', 'Noodle shop', 'Bát mì nóng', 'Bowl of hot noodles', '🍜'),
  r('south-bakery', 'cafe', 'Tiệm bánh', 'Bakery', 'Bánh sừng bò', 'Croissant', '🥐'),
  r('south-cafe', 'cafe', 'Cà phê phố nam', 'Southside café', 'Cốc cà phê sữa', 'Milk coffee', '☕'),
  r('south-banh-cuon', 'restaurant', 'Bánh cuốn phố nam', 'Southside bánh cuốn', 'Lát chả quế', 'Slice of cinnamon sausage', '🥓'),
  r('south-pho', 'restaurant', 'Phở phố nam', 'Southside phở', 'Nắm hành phở', 'Bunch of phở herbs', '🌿'),
  r('south-bun-rieu', 'restaurant', 'Quán bún riêu', 'Bún riêu shop', 'Bát bún riêu', 'Bowl of bún riêu', '🍲'),
  r('south-coffee', 'cafe', 'Cà phê góc phố', 'Corner coffee', 'Cà phê đen đá', 'Iced black coffee', '🧊'),
  r('west-old-house', 'hotel', 'Nhà cổ phố tây', 'West old-house stay', 'Chìa khoá nhà cổ', 'Old-house key', '🔑'),
  r('west-pho-bowl', 'restaurant', 'Quán phở bát to', 'Big-bowl phở shop', 'Bát phở sứ', 'Porcelain phở bowl', '🍜'),
  r('west-egg-coffee', 'cafe', 'Cà phê trứng phố tây', 'West egg coffee', 'Thìa cà phê trứng', 'Egg coffee spoon', '🥄'),
  r('west-banh-mi', 'cafe', 'Bánh mì phố tây', 'West bánh mì', 'Túi giấy bánh mì', 'Paper bag of bánh mì', '🥖'),
  r('west-bia-hoi', 'restaurant', 'Bia hơi phố tây', 'West bia hơi', 'Chiếc ghế nhựa nhỏ', 'Little plastic stool', '🪑'),
  r('west-pho-cafe', 'cafe', 'Phở và cà phê', 'Phở and coffee', 'Phiếu ăn sáng', 'Breakfast voucher', '🎟️'),
  r('west-bun-cha', 'restaurant', 'Bún chả phố tây', 'West bún chả', 'Chiếc quạt nan', 'Bamboo fan', '🪭'),
  r('west-cafe-corner', 'cafe', 'Cà phê góc tây', 'West corner café', 'Sổ tay quán cà phê', 'Café notebook', '📓'),
  r('east-pho-house', 'restaurant', 'Nhà phở phố đông', 'East phở house', 'Chiếc muỗng phở', 'Phở spoon', '🥄'),
  r('east-egg-coffee', 'cafe', 'Cà phê trứng phố đông', 'East egg coffee', 'Ly kem trứng nhỏ', 'Little egg-cream cup', '🥚'),
  r('east-banh-mi-chao', 'cafe', 'Bánh mì chảo phố đông', 'East pan-fried bánh mì', 'Chảo gang mini', 'Mini cast-iron pan', '🍳'),
  r('east-hang-ma', 'market', 'Hàng Mã phố đông', 'East Hang Ma shop', 'Mặt nạ giấy', 'Paper mask', '🎭'),
  r('east-cafe', 'cafe', 'Cà phê phố đông', 'East café', 'Cốc cà phê mang đi', 'Takeaway cup', '🥤'),
  r('east-bia-hoi', 'restaurant', 'Bia hơi phố đông', 'East bia hơi', 'Gói lạc rang', 'Roasted peanuts', '🥜'),
  r('east-bun-cha', 'restaurant', 'Bún chả phố đông', 'East bún chả', 'Chiếc nem rán', 'Fried spring roll', '🍢'),
  r('east-banh-mi', 'cafe', 'Bánh mì phố đông', 'East bánh mì', 'Hũ pa-tê nhỏ', 'Little pâté jar', '🫙'),
  r('east-egg-tea', 'cafe', 'Trà chanh phố đông', 'East lemon tea', 'Ly trà chanh', 'Glass of lemon tea', '🍋'),
  r('east-bun-shop', 'restaurant', 'Quán bún', 'Bún shop', 'Con bún rối', 'Nest of vermicelli', '🍜'),
  r('east-cafe-lane', 'cafe', 'Cà phê ngõ đông', 'East lane café', 'Gói cà phê rang', 'Bag of roasted coffee', '☕'),
  r('south-go-dong-da', 'garden', 'Vườn Đống Đa phía nam', 'South Dong Da garden', 'Chiếc lá bàng', 'Almond leaf', '🍂'),
  r('south-kim-lien', 'landmark', 'Sân chùa Kim Liên phía nam', 'South Kim Lien courtyard', 'Nén hương nhỏ', 'Little incense stick', '🪔'),
  r('south-post-office', 'landmark', 'Bưu điện phía nam', 'South post office', 'Phong bì thư', 'Letter envelope', '📮'),
  r('north-garden-cafe-west', 'cafe', 'Cà phê vườn tây', 'West garden café', 'Cành hoa nhỏ', 'Garden flower', '🌼'),
  r('north-study-tea', 'cafe', 'Quán trà học bài', 'Study tea room', 'Chiếc bút chì', 'Pencil', '✏️'),
  r('north-lotus-pho', 'restaurant', 'Phở bên hồ sen', 'Lotus-pond phở', 'Bông sen giấy', 'Paper lotus', '🪷'),
  r('north-garden-bakery', 'cafe', 'Tiệm bánh trong vườn', 'Garden bakery', 'Bánh cốm', 'Cốm cake', '🍰'),
  r('north-hang-ma-alley', 'market', 'Ngõ Hàng Mã', 'Hang Ma alley', 'Bông hoa giấy', 'Paper flower', '🌺'),
  r('north-banh-mi-corner', 'cafe', 'Bánh mì góc bắc', 'North-corner bánh mì', 'Chai tương ớt', 'Chilli sauce', '🌶️'),
  r('north-cafe-atelier', 'cafe', 'Cà phê hoạ sĩ', 'Artist café', 'Bảng màu nhỏ', 'Little palette', '🎨'),
  r('north-tea-house', 'cafe', 'Trà quán phía bắc', 'North tea house', 'Trà ướp hoa', 'Flower-scented tea', '🌸'),
  r('north-pho-corner', 'restaurant', 'Phở góc bắc', 'North-corner phở', 'Gói gia vị phở', 'Phở spice pack', '🧂'),
  r('north-lotus-flowers', 'market', 'Quầy hoa sen', 'Lotus flower stall', 'Nắm hạt sen', 'Handful of lotus seeds', '🪷'),
  r('north-hang-bac', 'market', 'Hàng Bạc phía bắc', 'North Hang Bac shop', 'Chiếc vòng bạc', 'Silver bracelet', '📿'),
];
