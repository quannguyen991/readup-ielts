/** Ten additional cities, assembled with the same four-panel 2D map engine as existing cities. */
import type { CityId, CityMap, MapObject, Npc, PoiKind, SceneSprite } from '@/services/travel/types';
import { CITIES } from '@/services/travel/world';
import { imageMap, imagePoi, type PxRect } from './imagemap';
import { amsterdam } from './amsterdam';
import { danang } from './danang';
import { hanoi } from './hanoi';
import { hochiminh } from './hochiminh';
import { london } from './london';
import { paris } from './paris';
import { rome } from './rome';
import { singapore } from './singapore';

type NewCityId = 'tokyo' | 'seoul' | 'newyork' | 'istanbul' | 'cairo' | 'sydney' | 'mexicocity' | 'rio' | 'capetown' | 'marrakech';
type Spot = { slug: string; kind: PoiKind };
type LocalizedLine = { en: string; vi: string };
type Scene = {
  spots: Spot[];
  opener: { local: LocalizedLine; traveller: LocalizedLine; vendor: LocalizedLine; staff: LocalizedLine };
};
type Persona = keyof Scene['opener'];
type XY = readonly [number, number];
type CityLayout = {
  spawn: XY;
  walkways: { points: XY[]; radius: number }[];
  places: Record<string, { hotspot: PxRect; door: XY }>;
  npcRoutes: Record<Persona, XY[]>;
};

const SCENES: Record<NewCityId, Scene> = {
  tokyo: {
    spots: [
      { slug: 'shibuya', kind: 'landmark' }, { slug: 'sensoji', kind: 'landmark' }, { slug: 'tsukiji', kind: 'market' },
      { slug: 'ramen', kind: 'restaurant' }, { slug: 'shinjuku', kind: 'station' },
    ],
    opener: {
      local: { en: 'The lane behind the lanterns is quieter. Are you heading to Senso-ji?', vi: 'Con ngõ sau dãy đèn lồng yên tĩnh hơn. Bạn đang định tới Senso-ji à?' },
      traveller: { en: 'I came out of the wrong Shinjuku exit. Does this path lead toward the east side?', vi: 'Mình ra nhầm cửa ga Shinjuku mất rồi. Đường này có dẫn về phía đông không?' },
      vendor: { en: 'The miso broth is ready. Would you like spring onions on your ramen?', vi: 'Nước dùng miso vừa xong. Bạn có muốn thêm hành lá vào ramen không?' },
      staff: { en: 'Welcome. Tell me where you want to go and I can help you find the right route.', vi: 'Chào bạn. Hãy nói nơi bạn muốn đến, tôi sẽ giúp tìm đường phù hợp.' },
    },
  },
  seoul: {
    spots: [
      { slug: 'gyeongbokgung', kind: 'landmark' }, { slug: 'bukchon', kind: 'landmark' }, { slug: 'gwangjang', kind: 'market' },
      { slug: 'hongdae', kind: 'cafe' }, { slug: 'station', kind: 'station' },
    ],
    opener: {
      local: { en: 'The palace grounds close earlier than the shops in Bukchon, so I would visit them first.', vi: 'Cung điện đóng cửa sớm hơn các cửa hàng ở Bukchon, nên bạn ghé cung điện trước nhé.' },
      traveller: { en: 'I am trying to find the market entrance. Is it the street with the food stalls?', vi: 'Mình đang tìm lối vào chợ. Có phải con phố có nhiều quầy đồ ăn không?' },
      vendor: { en: 'These pancakes are made to order. Do you prefer them crisp or soft?', vi: 'Bánh kếp này được làm khi khách gọi. Bạn thích giòn hay mềm?' },
      staff: { en: 'Hi there. I can help with directions, transit, or anything you are practising in English.', vi: 'Xin chào. Tôi có thể giúp bạn hỏi đường, tìm phương tiện hoặc luyện tiếng Anh.' },
    },
  },
  newyork: {
    spots: [
      { slug: 'timessquare', kind: 'landmark' }, { slug: 'centralpark', kind: 'garden' }, { slug: 'metmuseum', kind: 'museum' },
      { slug: 'brooklynpizza', kind: 'restaurant' }, { slug: 'subway', kind: 'station' },
    ],
    opener: {
      local: { en: 'The park is a good shortcut, but the paths near the lake are easier to follow.', vi: 'Công viên là lối tắt khá tốt, nhưng đường gần hồ dễ đi hơn.' },
      traveller: { en: 'My map says the subway entrance is on this block. Have you spotted the stairs?', vi: 'Bản đồ chỉ lối xuống tàu điện ở dãy phố này. Bạn có thấy cầu thang chưa?' },
      vendor: { en: 'We make the dough here every morning. Want a slice while it is still hot?', vi: 'Sáng nào chúng tôi cũng nhào bột ở đây. Bạn muốn ăn một miếng lúc còn nóng không?' },
      staff: { en: 'Hi. Ask me anything about the neighbourhood, and we can work through it together.', vi: 'Chào bạn. Cứ hỏi tôi bất cứ điều gì về khu này, mình cùng tìm hiểu nhé.' },
    },
  },
  istanbul: {
    spots: [
      { slug: 'hagia', kind: 'landmark' }, { slug: 'grandbazaar', kind: 'market' }, { slug: 'spicebazaar', kind: 'market' },
      { slug: 'ferry', kind: 'station' }, { slug: 'lokanta', kind: 'restaurant' },
    ],
    opener: {
      local: { en: 'The ferry across the Bosphorus is frequent. The quieter pier is just past the tea garden.', vi: 'Phà qua eo Bosphorus chạy khá thường xuyên. Bến vắng hơn nằm sau vườn trà.' },
      traveller: { en: 'I am looking for the spice market, but every street seems to turn into another bazaar.', vi: 'Mình đang tìm chợ gia vị, nhưng con phố nào cũng như dẫn vào một khu chợ khác.' },
      vendor: { en: 'That blend is mostly sumac and pepper. Would you like to smell it before you decide?', vi: 'Hỗn hợp này chủ yếu có thù du và tiêu. Bạn muốn ngửi thử trước khi chọn không?' },
      staff: { en: 'Merhaba. Tell me what you are trying to do and I will help you say it naturally.', vi: 'Merhaba. Hãy kể điều bạn muốn làm, tôi sẽ giúp bạn diễn đạt tự nhiên.' },
    },
  },
  cairo: {
    spots: [
      { slug: 'giza', kind: 'landmark' }, { slug: 'egyptianmuseum', kind: 'museum' }, { slug: 'khanelkhalili', kind: 'market' },
      { slug: 'nilepier', kind: 'station' }, { slug: 'koshary', kind: 'restaurant' },
    ],
    opener: {
      local: { en: 'If you are going to Giza, start early and carry water. The light is lovely before it gets hot.', vi: 'Nếu bạn tới Giza, hãy đi sớm và mang theo nước. Ánh sáng buổi sáng rất đẹp trước khi trời nóng.' },
      traveller: { en: 'I would love to see the Nile from a boat. Do you know which pier is easiest to reach?', vi: 'Mình muốn ngắm sông Nile từ thuyền. Bạn biết bến nào dễ tới nhất không?' },
      vendor: { en: 'Koshary is filling, but you can choose how much chilli to add. How spicy do you like it?', vi: 'Koshary khá no, nhưng bạn có thể chọn lượng ớt. Bạn ăn cay mức nào?' },
      staff: { en: 'Hello. I can help with directions or help you practise asking for what you need.', vi: 'Xin chào. Tôi có thể chỉ đường hoặc giúp bạn luyện cách hỏi điều mình cần.' },
    },
  },
  sydney: {
    spots: [
      { slug: 'operahouse', kind: 'landmark' }, { slug: 'harbourbridge', kind: 'landmark' }, { slug: 'bondi', kind: 'garden' },
      { slug: 'circularquay', kind: 'station' }, { slug: 'fishmarket', kind: 'market' },
    ],
    opener: {
      local: { en: 'The ferry is a lovely way to cross the harbour. Check the board for the next departure.', vi: 'Đi phà là cách ngắm cảng rất đẹp. Bạn xem bảng để biết chuyến kế tiếp nhé.' },
      traveller: { en: 'I am trying to get to the Opera House before sunset. Is the waterfront path open?', vi: 'Mình muốn tới Nhà hát Opera trước hoàng hôn. Lối đi ven cảng có mở không?' },
      vendor: { en: 'The fish is from this morning. Are you after something grilled or a quick snack?', vi: 'Cá được giao từ sáng nay. Bạn muốn món nướng hay đồ ăn nhẹ?' },
      staff: { en: 'G’day. Tell me where you are headed and I will help you plan the trip.', vi: 'Chào bạn. Hãy nói nơi bạn muốn đến, tôi sẽ giúp bạn lên lộ trình.' },
    },
  },
  mexicocity: {
    spots: [
      { slug: 'zocalo', kind: 'landmark' }, { slug: 'fridamuseum', kind: 'museum' }, { slug: 'coyoacan', kind: 'market' },
      { slug: 'taqueria', kind: 'restaurant' }, { slug: 'chapultepec', kind: 'garden' },
    ],
    opener: {
      local: { en: 'Chapultepec is much larger than it looks on the map. Which entrance are you trying to find?', vi: 'Chapultepec rộng hơn nhiều so với trên bản đồ. Bạn đang tìm cổng nào?' },
      traveller: { en: 'I am not used to the altitude yet, so I am taking this walk slowly.', vi: 'Mình vẫn chưa quen độ cao ở đây nên đang đi bộ thật chậm.' },
      vendor: { en: 'Would you like salsa verde or roja? I can keep either one mild.', vi: 'Bạn muốn sốt xanh hay sốt đỏ? Tôi có thể làm loại nào cũng ít cay.' },
      staff: { en: 'Hola. I can help you find a place or practise how to order there.', vi: 'Hola. Tôi có thể giúp bạn tìm địa điểm hoặc luyện cách gọi món.' },
    },
  },
  rio: {
    spots: [
      { slug: 'christ', kind: 'landmark' }, { slug: 'copacabana', kind: 'garden' }, { slug: 'selaron', kind: 'landmark' },
      { slug: 'feira', kind: 'market' }, { slug: 'botafogo', kind: 'cafe' },
    ],
    opener: {
      local: { en: 'The beach gets busy later in the afternoon. The path along the water is cooler right now.', vi: 'Bãi biển sẽ đông hơn vào cuối buổi chiều. Lối ven nước lúc này mát hơn.' },
      traveller: { en: 'I want to visit the steps and then find somewhere nearby for coffee. Any suggestions?', vi: 'Mình muốn thăm bậc thang rồi tìm quán cà phê gần đó. Bạn gợi ý chỗ nào không?' },
      vendor: { en: 'The coconuts are cold. Want one to take with you on the walk?', vi: 'Dừa đang được ướp lạnh. Bạn muốn mang theo một trái khi đi dạo không?' },
      staff: { en: 'Oi. Tell me what you would like to see and we can figure out the route together.', vi: 'Oi. Hãy nói nơi bạn muốn tham quan, mình cùng tìm đường nhé.' },
    },
  },
  capetown: {
    spots: [
      { slug: 'tablemountain', kind: 'landmark' }, { slug: 'bokaap', kind: 'landmark' }, { slug: 'waterfront', kind: 'market' },
      { slug: 'boulders', kind: 'garden' }, { slug: 'robben', kind: 'museum' },
    ],
    opener: {
      local: { en: 'The wind can change quickly on the mountain. It is worth checking before you head up.', vi: 'Gió trên núi có thể đổi nhanh. Bạn nên kiểm tra thời tiết trước khi lên.' },
      traveller: { en: 'I have a free afternoon. Would you choose the waterfront or the penguin boardwalk?', vi: 'Mình có một buổi chiều rảnh. Bạn sẽ chọn bến cảng hay lối đi ngắm chim cánh cụt?' },
      vendor: { en: 'The market has a few local crafts made nearby. Are you looking for a gift?', vi: 'Chợ có vài món thủ công địa phương. Bạn đang tìm quà tặng à?' },
      staff: { en: 'Howzit. Tell me what you need and I will help you find the right place.', vi: 'Chào bạn. Hãy nói điều bạn cần, tôi sẽ giúp tìm đúng địa điểm.' },
    },
  },
  marrakech: {
    spots: [
      { slug: 'jemaa', kind: 'market' }, { slug: 'bahia', kind: 'landmark' }, { slug: 'majorelle', kind: 'garden' },
      { slug: 'riad', kind: 'hotel' }, { slug: 'tagine', kind: 'restaurant' },
    ],
    opener: {
      local: { en: 'The medina lanes twist around, but the minaret is a useful landmark when you need to reorient yourself.', vi: 'Các ngõ trong khu phố cổ khá quanh co, nhưng ngọn tháp là mốc tốt để bạn định hướng lại.' },
      traveller: { en: 'I am looking for the garden, then I will head back to the main square before dark.', vi: 'Mình đang tìm khu vườn, rồi sẽ quay lại quảng trường trước khi trời tối.' },
      vendor: { en: 'This tagine needs another few minutes. Would you like to hear what goes into it?', vi: 'Món tagine này cần thêm vài phút. Bạn có muốn nghe món gồm những gì không?' },
      staff: { en: 'Salam. I can help you ask for directions, a room, or a table in English.', vi: 'Salam. Tôi có thể giúp bạn hỏi đường, hỏi phòng hoặc đặt bàn bằng tiếng Anh.' },
    },
  },
};

const WORLD_CITY_IDS = Object.keys(SCENES) as NewCityId[];

/**
 * Coordinates are in each 418×235 city illustration. Paths follow the visible plazas,
 * promenades, and streets; buildings stay baked into their own city artwork instead of
 * being copied from another city's scene and drawn on top of it.
 */
const LAYOUTS: Record<NewCityId, CityLayout> = {
  tokyo: {
    spawn: [208, 225],
    walkways: [
      { points: [[208, 232], [208, 212], [208, 192], [208, 171], [212, 150], [218, 132]], radius: 10 },
    ],
    places: {
      shibuya: { hotspot: { x: 2, y: 67, w: 92, h: 72 }, door: [208, 192] },
      sensoji: { hotspot: { x: 320, y: 38, w: 94, h: 99 }, door: [218, 132] },
      tsukiji: { hotspot: { x: 97, y: 172, w: 67, h: 58 }, door: [208, 220] },
      ramen: { hotspot: { x: 264, y: 164, w: 69, h: 64 }, door: [208, 204] },
      shinjuku: { hotspot: { x: 4, y: 28, w: 125, h: 42 }, door: [208, 171] },
    },
    npcRoutes: {
      local: [[208, 211], [208, 198], [208, 185]],
      traveller: [[208, 185], [208, 171], [212, 150]],
      vendor: [[208, 220], [208, 211], [208, 220]],
      staff: [[212, 150], [218, 132], [212, 150]],
    },
  },
  seoul: {
    spawn: [215, 226],
    walkways: [
      { points: [[215, 232], [215, 207], [238, 192], [270, 179], [310, 168], [355, 162], [390, 160]], radius: 11 },
      { points: [[215, 207], [195, 196], [180, 195], [175, 200]], radius: 7 },
      { points: [[215, 207], [252, 211], [294, 215], [342, 208]], radius: 9 },
    ],
    places: {
      gyeongbokgung: { hotspot: { x: 279, y: 31, w: 132, h: 94 }, door: [355, 162] },
      bukchon: { hotspot: { x: 0, y: 75, w: 101, h: 81 }, door: [180, 195] },
      gwangjang: { hotspot: { x: 105, y: 153, w: 72, h: 72 }, door: [175, 200] },
      hongdae: { hotspot: { x: 178, y: 155, w: 89, h: 69 }, door: [252, 211] },
      station: { hotspot: { x: 110, y: 28, w: 120, h: 42 }, door: [294, 215] },
    },
    npcRoutes: {
      local: [[195, 196], [180, 195], [175, 200]],
      traveller: [[215, 207], [238, 192], [270, 179]],
      vendor: [[252, 211], [294, 215], [342, 208]],
      staff: [[355, 162], [390, 160], [355, 162]],
    },
  },
  newyork: {
    spawn: [25, 216],
    walkways: [
      { points: [[20, 218], [70, 218], [130, 218], [195, 218], [260, 213], [320, 207], [380, 198], [410, 194]], radius: 10 },
      { points: [[130, 218], [139, 196], [160, 180]], radius: 9 },
      { points: [[320, 207], [329, 191], [330, 176]], radius: 9 },
    ],
    places: {
      timessquare: { hotspot: { x: 0, y: 43, w: 78, h: 97 }, door: [73, 214] },
      centralpark: { hotspot: { x: 81, y: 81, w: 81, h: 78 }, door: [160, 180] },
      metmuseum: { hotspot: { x: 285, y: 28, w: 130, h: 54 }, door: [380, 198] },
      brooklynpizza: { hotspot: { x: 169, y: 136, w: 82, h: 68 }, door: [195, 218] },
      subway: { hotspot: { x: 316, y: 153, w: 76, h: 58 }, door: [330, 176] },
    },
    npcRoutes: {
      local: [[70, 218], [130, 218], [195, 218]],
      traveller: [[139, 196], [160, 180], [139, 196]],
      vendor: [[230, 215], [275, 211], [320, 207]],
      staff: [[329, 191], [330, 176], [329, 191]],
    },
  },
  istanbul: {
    spawn: [236, 222],
    walkways: [
      { points: [[135, 230], [190, 228], [245, 224], [300, 220], [355, 216], [410, 212]], radius: 9 },
      { points: [[220, 225], [211, 212], [205, 199], [211, 188], [229, 179], [250, 170]], radius: 8 },
      { points: [[145, 229], [130, 220], [115, 210], [95, 205], [80, 195]], radius: 8 },
    ],
    places: {
      hagia: { hotspot: { x: 143, y: 28, w: 119, h: 77 }, door: [250, 170] },
      grandbazaar: { hotspot: { x: 0, y: 62, w: 105, h: 75 }, door: [80, 195] },
      spicebazaar: { hotspot: { x: 0, y: 143, w: 108, h: 82 }, door: [115, 210] },
      ferry: { hotspot: { x: 300, y: 62, w: 116, h: 119 }, door: [378, 214] },
      lokanta: { hotspot: { x: 111, y: 121, w: 91, h: 82 }, door: [236, 222] },
    },
    npcRoutes: {
      local: [[190, 228], [220, 226], [245, 224]],
      traveller: [[200, 211], [210, 198], [224, 184]],
      vendor: [[267, 222], [315, 220], [370, 215]],
      staff: [[345, 217], [378, 214], [345, 217]],
    },
  },
  cairo: {
    spawn: [185, 222],
    walkways: [
      { points: [[35, 222], [100, 221], [165, 221], [230, 221], [292, 219]], radius: 10 },
      { points: [[185, 222], [190, 199], [209, 179], [232, 160]], radius: 10 },
      { points: [[100, 221], [89, 204], [77, 190]], radius: 9 },
      { points: [[230, 221], [266, 205], [301, 185]], radius: 9 },
    ],
    places: {
      giza: { hotspot: { x: 270, y: 28, w: 147, h: 47 }, door: [301, 185] },
      egyptianmuseum: { hotspot: { x: 108, y: 27, w: 100, h: 94 }, door: [223, 169] },
      khanelkhalili: { hotspot: { x: 0, y: 107, w: 106, h: 91 }, door: [77, 190] },
      nilepier: { hotspot: { x: 302, y: 123, w: 114, h: 88 }, door: [292, 219] },
      koshary: { hotspot: { x: 108, y: 146, w: 94, h: 82 }, door: [165, 221] },
    },
    npcRoutes: {
      local: [[100, 221], [145, 221], [185, 222]],
      traveller: [[185, 222], [190, 199], [209, 179]],
      vendor: [[165, 221], [230, 221], [266, 205]],
      staff: [[266, 205], [301, 185], [266, 205]],
    },
  },
  sydney: {
    spawn: [175, 222],
    walkways: [
      { points: [[75, 180], [117, 185], [154, 197], [185, 211], [225, 222], [278, 225], [326, 217]], radius: 10 },
      { points: [[225, 222], [229, 200], [251, 183]], radius: 10 },
      { points: [[278, 225], [314, 216], [348, 205]], radius: 9 },
    ],
    places: {
      operahouse: { hotspot: { x: 269, y: 75, w: 140, h: 91 }, door: [251, 183] },
      harbourbridge: { hotspot: { x: 163, y: 28, w: 156, h: 55 }, door: [229, 200] },
      bondi: { hotspot: { x: 328, y: 137, w: 89, h: 92 }, door: [348, 205] },
      circularquay: { hotspot: { x: 190, y: 158, w: 73, h: 61 }, door: [225, 222] },
      fishmarket: { hotspot: { x: 0, y: 102, w: 97, h: 91 }, door: [117, 185] },
    },
    npcRoutes: {
      local: [[117, 185], [154, 197], [185, 211]],
      traveller: [[225, 222], [229, 200], [251, 183]],
      vendor: [[278, 225], [314, 216], [348, 205]],
      staff: [[185, 211], [154, 197], [117, 185]],
    },
  },
  mexicocity: {
    spawn: [207, 226],
    walkways: [
      { points: [[207, 232], [207, 215], [226, 204], [258, 201], [294, 203], [331, 213], [370, 222], [405, 222]], radius: 10 },
      { points: [[294, 203], [316, 188], [339, 171]], radius: 9 },
      { points: [[207, 215], [180, 216], [151, 216]], radius: 9 },
    ],
    places: {
      zocalo: { hotspot: { x: 145, y: 28, w: 136, h: 80 }, door: [339, 171] },
      fridamuseum: { hotspot: { x: 0, y: 72, w: 73, h: 89 }, door: [151, 216] },
      coyoacan: { hotspot: { x: 77, y: 139, w: 86, h: 82 }, door: [151, 216] },
      taqueria: { hotspot: { x: 283, y: 124, w: 127, h: 73 }, door: [331, 213] },
      chapultepec: { hotspot: { x: 282, y: 28, w: 135, h: 35 }, door: [316, 188] },
    },
    npcRoutes: {
      local: [[180, 216], [207, 215], [258, 201]],
      traveller: [[226, 204], [258, 201], [294, 203]],
      vendor: [[294, 203], [331, 213], [370, 222]],
      staff: [[316, 188], [339, 171], [316, 188]],
    },
  },
  rio: {
    spawn: [165, 226],
    walkways: [
      { points: [[170, 232], [165, 216], [159, 200], [155, 184], [151, 168], [146, 151], [140, 134], [135, 118]], radius: 8 },
    ],
    places: {
      christ: { hotspot: { x: 262, y: 28, w: 151, h: 65 }, door: [135, 126] },
      copacabana: { hotspot: { x: 302, y: 117, w: 114, h: 107 }, door: [170, 216] },
      selaron: { hotspot: { x: 0, y: 93, w: 114, h: 105 }, door: [151, 168] },
      feira: { hotspot: { x: 116, y: 126, w: 101, h: 88 }, door: [171, 226] },
      botafogo: { hotspot: { x: 218, y: 111, w: 78, h: 77 }, door: [159, 200] },
    },
    npcRoutes: {
      local: [[168, 226], [164, 216], [168, 226]],
      traveller: [[159, 200], [155, 184], [159, 200]],
      vendor: [[151, 168], [146, 151], [151, 168]],
      staff: [[140, 134], [135, 118], [140, 134]],
    },
  },
  capetown: {
    spawn: [160, 224],
    walkways: [
      { points: [[55, 225], [90, 225], [125, 225], [160, 224], [195, 223], [225, 214]], radius: 7 },
      { points: [[125, 225], [119, 213], [112, 201], [104, 188], [98, 175]], radius: 7 },
    ],
    places: {
      tablemountain: { hotspot: { x: 151, y: 28, w: 179, h: 46 }, door: [225, 214] },
      bokaap: { hotspot: { x: 0, y: 119, w: 94, h: 94 }, door: [98, 175] },
      waterfront: { hotspot: { x: 271, y: 126, w: 116, h: 91 }, door: [195, 223] },
      boulders: { hotspot: { x: 302, y: 37, w: 114, h: 83 }, door: [160, 224] },
      robben: { hotspot: { x: 100, y: 91, w: 106, h: 91 }, door: [125, 225] },
    },
    npcRoutes: {
      local: [[90, 225], [125, 225], [160, 224]],
      traveller: [[160, 224], [195, 223], [225, 214]],
      vendor: [[125, 225], [119, 213], [112, 201]],
      staff: [[112, 201], [104, 188], [98, 175]],
    },
  },
  marrakech: {
    spawn: [280, 218],
    walkways: [
      { points: [[195, 222], [235, 220], [275, 218], [315, 216], [355, 214], [400, 212]], radius: 9 },
      { points: [[275, 218], [260, 204], [245, 192]], radius: 8 },
    ],
    places: {
      jemaa: { hotspot: { x: 0, y: 78, w: 109, h: 97 }, door: [205, 221] },
      bahia: { hotspot: { x: 251, y: 40, w: 103, h: 83 }, door: [355, 214] },
      majorelle: { hotspot: { x: 152, y: 144, w: 67, h: 72 }, door: [245, 192] },
      riad: { hotspot: { x: 294, y: 123, w: 122, h: 90 }, door: [400, 212] },
      tagine: { hotspot: { x: 121, y: 28, w: 121, h: 62 }, door: [275, 218] },
    },
    npcRoutes: {
      local: [[235, 220], [275, 218], [315, 216]],
      traveller: [[260, 204], [245, 192], [260, 204]],
      vendor: [[315, 216], [355, 214], [400, 212]],
      staff: [[275, 218], [295, 210], [275, 218]],
    },
  },
};

type TerrainId = 'singapore' | 'hanoi' | 'london' | 'paris' | 'amsterdam' | 'rome' | 'danang' | 'hochiminh';

const TERRAIN_SOURCE: Record<NewCityId, TerrainId> = {
  tokyo: 'singapore', seoul: 'hanoi', newyork: 'london', istanbul: 'amsterdam', cairo: 'rome',
  sydney: 'danang', mexicocity: 'hochiminh', rio: 'singapore', capetown: 'london', marrakech: 'paris',
};

const TERRAIN_MAPS: Record<TerrainId, CityMap> = {
  singapore, hanoi, london, paris, amsterdam, rome, danang, hochiminh,
};

type BuildingStyle = { market: string; food: string; transit: string; culture: string; garden: string; decor: string };
const BUILDING_STYLES: Record<NewCityId, BuildingStyle> = {
  tokyo: { market: '/travel/sprites/singapore2/shophouse.png', food: '/travel/sprites/singapore/hawker.png', transit: '/travel/sprites/singapore/mrt.png', culture: '/travel/sprites/singapore2/temple.png', garden: '/travel/sprites/amsterdam/greenhouse.png', decor: '/travel/sprites/singapore2/mall.png' },
  seoul: { market: '/travel/sprites/hanoi/dongxuan.png', food: '/travel/sprites/hanoi/pho.png', transit: '/travel/sprites/paris/metro.png', culture: '/travel/sprites/hanoi/oldquarter.png', garden: '/travel/sprites/singapore2/temple.png', decor: '/travel/sprites/amsterdam/row.png' },
  newyork: { market: '/travel/sprites/london/pub.png', food: '/travel/sprites/london/cafe.png', transit: '/travel/sprites/london/tube.png', culture: '/travel/sprites/london/museum.png', garden: '/travel/sprites/amsterdam/greenhouse.png', decor: '/travel/sprites/london/bridge.png' },
  istanbul: { market: '/travel/sprites/amsterdam/row.png', food: '/travel/sprites/rome/trattoria.png', transit: '/travel/sprites/amsterdam/station.png', culture: '/travel/sprites/rome/basilica.png', garden: '/travel/sprites/singapore2/temple.png', decor: '/travel/sprites/hanoi/dongxuan.png' },
  cairo: { market: '/travel/sprites/hanoi/dongxuan.png', food: '/travel/sprites/rome/pizzeria.png', transit: '/travel/sprites/amsterdam/station.png', culture: '/travel/sprites/rome/ruins.png', garden: '/travel/sprites/rome/aqueduct.png', decor: '/travel/sprites/hanoi/oldquarter.png' },
  sydney: { market: '/travel/sprites/london/pub.png', food: '/travel/sprites/singapore2/beachbar.png', transit: '/travel/sprites/singapore/mrt.png', culture: '/travel/sprites/london/museum.png', garden: '/travel/sprites/danang/resort.png', decor: '/travel/sprites/singapore2/shophouse.png' },
  mexicocity: { market: '/travel/sprites/hanoi/oldquarter.png', food: '/travel/sprites/hochiminh/comtam.png', transit: '/travel/sprites/paris/metro.png', culture: '/travel/sprites/rome/basilica.png', garden: '/travel/sprites/danang/resort.png', decor: '/travel/sprites/singapore2/shophouse.png' },
  rio: { market: '/travel/sprites/singapore2/beachbar.png', food: '/travel/sprites/paris/cafe.png', transit: '/travel/sprites/danang/airport.png', culture: '/travel/sprites/rome/ruins.png', garden: '/travel/sprites/danang/resort.png', decor: '/travel/sprites/singapore2/shophouse.png' },
  capetown: { market: '/travel/sprites/london/pub.png', food: '/travel/sprites/singapore2/beachbar.png', transit: '/travel/sprites/london/bridge.png', culture: '/travel/sprites/london/museum.png', garden: '/travel/sprites/amsterdam/greenhouse.png', decor: '/travel/sprites/singapore2/shophouse.png' },
  marrakech: { market: '/travel/sprites/hanoi/dongxuan.png', food: '/travel/sprites/rome/trattoria.png', transit: '/travel/sprites/amsterdam/station.png', culture: '/travel/sprites/rome/basilica.png', garden: '/travel/sprites/amsterdam/greenhouse.png', decor: '/travel/sprites/hanoi/oldquarter.png' },
};

// The new cities use the same walkable, top-down 2D layout as the established maps.
// Buildings sit on the planted pads; every NPC and door stays on the visible paving.
for (const id of WORLD_CITY_IDS) {
  LAYOUTS[id] = {
    spawn: [208, 218],
    walkways: [
      { points: [[208, 232], [208, 216], [208, 193], [208, 166], [208, 140], [208, 116], [208, 90], [208, 52], [208, 16]], radius: 7 },
      { points: [[24, 193], [80, 193], [136, 193], [208, 193], [274, 193], [335, 193], [394, 193]], radius: 7 },
      { points: [[80, 193], [80, 165], [80, 140], [80, 112], [80, 92], [80, 58], [80, 24]], radius: 7 },
      { points: [[335, 193], [335, 166], [335, 140], [335, 112], [335, 92], [335, 58], [335, 24]], radius: 7 },
      { points: [[80, 92], [142, 92], [208, 92], [271, 92], [335, 92]], radius: 7 },
      { points: [[80, 140], [142, 140], [208, 140], [271, 140], [335, 140]], radius: 7 },
    ],
    places: {},
    npcRoutes: {
      local: [[124, 193], [165, 193], [208, 193]],
      traveller: [[208, 177], [208, 150], [208, 120]],
      vendor: [[118, 140], [80, 140], [80, 112]],
      staff: [[274, 193], [335, 193], [335, 164]],
    },
  };
}

function point([x, y]: XY) {
  return { x, y };
}

function distanceToSegment(x: number, y: number, a: XY, b: XY): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length2 = dx * dx + dy * dy;
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / length2));
  return Math.hypot(x - (a[0] + dx * t), y - (a[1] + dy * t));
}

function walkMask(layout: CityLayout) {
  const cell = 4;
  const w = 418;
  const h = 235;
  const rows = Array.from({ length: Math.ceil(h / cell) }, (_, j) => {
    let row = '';
    for (let i = 0; i < Math.ceil(w / cell); i++) {
      const x = i * cell + cell / 2;
      const y = j * cell + cell / 2;
      const walkable = layout.walkways.some(({ points, radius }) =>
        points.slice(1).some((b, k) => distanceToSegment(x, y, points[k]!, b) <= radius),
      );
      row += walkable ? '#' : '.';
    }
    return row;
  });
  return { cell, rows };
}

function cityNpcs(id: NewCityId, scene: Scene, layout: CityLayout): Npc[] {
  const sprite: Record<Persona, string> = { local: 'npc_local', traveller: 'npc_tourist', vendor: 'npc_vendor', staff: 'npc_staff' };
  return (['local', 'traveller', 'vendor', 'staff'] as const).map((persona) => {
    const route = layout.npcRoutes[persona];
    return {
      id: `${id}-${persona}`,
      sprite: sprite[persona],
      chatPersona: persona,
      at: point(route[0]!),
      path: route.slice(1).map(point),
      lines: [scene.opener[persona]],
    };
  });
}

const POI_BUILDING_SLOTS = [
  { x: 208, y: 82, w: 98, h: 92 },
  { x: 80, y: 94, w: 78, h: 58 },
  { x: 335, y: 94, w: 78, h: 58 },
  { x: 80, y: 188, w: 84, h: 60 },
  { x: 335, y: 188, w: 84, h: 60 },
] as const;

function spriteForSpot(id: NewCityId, kind: PoiKind, index: number, dimensions?: Pick<SceneSprite, 'w' | 'h'>): SceneSprite {
  const style = BUILDING_STYLES[id];
  const src = index === 0
    ? `/travel/sprites/${id}/${id}-landmark.png`
    : kind === 'market'
      ? style.market
      : kind === 'station'
        ? style.transit
        : kind === 'restaurant' || kind === 'cafe'
          ? style.food
          : kind === 'garden'
            ? style.garden
            : style.culture;
  const size = index === 0
    ? { w: 98, h: 92 }
    : kind === 'market'
      ? { w: 80, h: 58 }
      : kind === 'station'
        ? { w: 82, h: 58 }
        : kind === 'restaurant' || kind === 'cafe'
          ? { w: 76, h: 54 }
          : kind === 'garden'
            ? { w: 80, h: 56 }
            : { w: 82, h: 60 };
  return { src, ...(dimensions ?? size) };
}

function sceneObject(id: string, sprite: string, at: { x: number; y: number }, size: SceneSprite, poiId?: string): MapObject {
  const foot = Math.round(size.h * 0.34);
  return {
    id,
    sprite,
    x: at.x,
    y: at.y,
    ...(poiId ? { poiId, door: { dx: 0, dy: 6 } } : {}),
    footprint: { x: -Math.round(size.w * 0.44), y: -foot, w: Math.round(size.w * 0.88), h: foot },
  };
}

function buildLegacyCity(id: NewCityId): CityMap {
  const meta = CITIES[id];
  const definition = SCENES[id];
  const layout = LAYOUTS[id];
  const sprites: Record<string, SceneSprite> = {};
  const objects: MapObject[] = [];
  const pois = definition.spots.map((spot, index) => {
    const slot = POI_BUILDING_SLOTS[index % POI_BUILDING_SLOTS.length]!;
    const spriteId = `${id}-${spot.slug}`;
    const sprite = spriteForSpot(id, spot.kind, index);
    sprites[spriteId] = sprite;
    const poiId = `${id}-${spot.slug}`;
    const object = sceneObject(spriteId, spriteId, { x: slot.x, y: slot.y }, sprite, poiId);
    objects.push(object);
    return imagePoi(poiId, {
      hotspot: { x: object.x - sprite.w / 2, y: object.y - sprite.h, w: sprite.w, h: sprite.h },
      door: { x: object.x + object.door!.dx, y: object.y + object.door!.dy },
    });
  });
  const style = BUILDING_STYLES[id];
  for (const [index, slot] of [
    { x: 108, y: 132, w: 80, h: 56 },
    { x: 308, y: 132, w: 82, h: 58 },
    { x: 208, y: 188, w: 74, h: 52 },
  ].entries()) {
    const spriteId = `${id}-district-${index}`;
    const sprite = { src: style.decor, ...slot };
    sprites[spriteId] = sprite;
    objects.push(sceneObject(spriteId, spriteId, { x: slot.x, y: slot.y }, sprite));
  }
  const map = imageMap({
    id: id as CityId,
    name: meta.name,
    utcOffsetHours: meta.utcOffsetHours,
    palette: id,
    size: { w: 418, h: 235 },
    scale: 4,
    spawn: point(layout.spawn),
    pois,
    npcs: cityNpcs(id, definition, layout),
    mask: walkMask(layout),
    weather: { kind: 'clear', intensity: 0 },
    sounds: ['city-day'],
  });

  const terrain = TERRAIN_SOURCE[id];
  map.image!.src = `/travel/terrain/${terrain}.png`;
  map.image!.smallSrc = `/travel/terrain/${terrain}.small.png`;
  map.scene = { sprites, objects, ambient: 3 };
  return map;
}

function cityNpcsOnTemplate(id: NewCityId, scene: Scene, template: CityMap): Npc[] {
  const personas = ['local', 'traveller', 'vendor', 'staff'] as const;
  const fallbacks: Record<(typeof personas)[number], string> = {
    local: 'npc_local',
    traveller: 'npc_tourist',
    vendor: 'npc_vendor',
    staff: 'npc_staff',
  };

  return personas.map((persona, index) => {
    const source = template.npcs[index];
    if (!source) {
      return {
        id: id + '-' + persona,
        sprite: fallbacks[persona],
        at: template.spawn,
        path: [],
        chatPersona: persona,
        lines: [scene.opener[persona]],
      };
    }
    return {
      ...source,
      id: id + '-' + persona,
      chatPersona: persona,
      lines: [scene.opener[persona]],
    };
  });
}

function buildCity(id: NewCityId): CityMap {
  const meta = CITIES[id];
  const definition = SCENES[id];
  const terrainId = TERRAIN_SOURCE[id];
  const template = TERRAIN_MAPS[terrainId];
  const templateImage = template.image;
  const templateScene = template.scene;
  if (!templateImage || !templateScene) throw new Error('Missing 2D template for ' + terrainId);

  // Reuse the established map's 2×2 terrain panels, walk mask, connectors and depth-sorted props.
  const sprites: Record<string, SceneSprite> = {};
  for (const [spriteId, sprite] of Object.entries(templateScene.sprites)) {
    sprites[spriteId] = {
      ...sprite,
      src: sprite.src ?? '/travel/sprites/' + terrainId + '/' + (sprite.file ?? spriteId + '.png'),
    };
  }

  const poiGeometry = new Map<string, { hotspot: PxRect; door: { x: number; y: number } }>();
  let spotIndex = 0;
  const objects = templateScene.objects.map((sourceObject, objectIndex): MapObject => {
    const sourceSprite = templateScene.sprites[sourceObject.sprite]!;
    const spot = sourceObject.poiId ? definition.spots[spotIndex] : undefined;
    if (!spot) {
      const { poiId: _poiId, door: _door, ...decoration } = sourceObject;
      return { ...decoration, id: id + '-district-' + objectIndex };
    }

    const index = spotIndex++;
    const poiId = id + '-' + spot.slug;
    const spriteId = poiId + '-building';
    const sprite = spriteForSpot(id, spot.kind, index, { w: sourceSprite.w, h: sourceSprite.h });
    sprites[spriteId] = sprite;
    const door = sourceObject.door ?? { dx: 0, dy: 6 };
    poiGeometry.set(poiId, {
      hotspot: {
        x: sourceObject.x - sprite.w / 2,
        y: sourceObject.y - sprite.h,
        w: sprite.w,
        h: sprite.h,
      },
      door: { x: sourceObject.x + door.dx, y: sourceObject.y + door.dy },
    });
    return { ...sourceObject, id: spriteId, sprite: spriteId, poiId, door };
  });

  const pois = definition.spots.map((spot) => {
    const poiId = id + '-' + spot.slug;
    const geometry = poiGeometry.get(poiId);
    if (!geometry) throw new Error('Missing 2D building slot for ' + poiId + ' on ' + terrainId);
    return imagePoi(poiId, geometry);
  });

  const map = imageMap({
    id: id as CityId,
    name: meta.name,
    utcOffsetHours: meta.utcOffsetHours,
    palette: id,
    size: template.size,
    scale: templateImage.scale,
    spawn: template.spawn,
    pois,
    npcs: cityNpcsOnTemplate(id, definition, template),
    mask: templateImage.mask,
    weather: template.ambience.weather,
    sounds: template.ambience.sounds,
  });
  map.image = { ...templateImage, size: { ...templateImage.size } };
  map.scene = { sprites, objects, ambient: templateScene.ambient };
  return map;
}

export const tokyo = buildCity('tokyo');
export const seoul = buildCity('seoul');
export const newyork = buildCity('newyork');
export const istanbul = buildCity('istanbul');
export const cairo = buildCity('cairo');
export const sydney = buildCity('sydney');
export const mexicocity = buildCity('mexicocity');
export const rio = buildCity('rio');
export const capetown = buildCity('capetown');
export const marrakech = buildCity('marrakech');

export function isAdditionalWorldCity(city: CityId): city is NewCityId {
  return (WORLD_CITY_IDS as CityId[]).includes(city);
}
