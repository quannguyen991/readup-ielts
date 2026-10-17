import type { SceneKey } from '@/data/hub/scenes';
import type { RoleplayDifficulty, ScenarioCategory } from '@/services/hub/roleplay';

/**
 * 30 bài hội thoại mẫu. Mỗi bài có 8 câu hai người nói qua lại (có bản dịch), các cụm từ then chốt,
 * và 3 câu điền từ để kiểm tra đã hiểu chưa. Người học nghe, đọc theo, rồi làm bài.
 */
export type DialogueLine = { speaker: string; en: string; vi: string };
export type DialogueQuiz = { q: string; options: string[]; answer: number; tip: string };
export type Dialogue = {
  id: string;
  title: string;
  setting: SceneKey;
  category: ScenarioCategory;
  difficulty: RoleplayDifficulty;
  minutes: number;
  keyPhrases: string[];
  lines: DialogueLine[];
  quiz: DialogueQuiz[];
};

const L = (speaker: string, en: string, vi: string): DialogueLine => ({ speaker, en, vi });
/**
 * Một câu điền từ. Các phương án được xoay vòng theo mã băm của câu hỏi (cố định, không ngẫu nhiên),
 * để đáp án đúng không luôn nằm ở vị trí đầu.
 */
const Q = (q: string, options: string[], answer: number, tip: string): DialogueQuiz => {
  const n = options.length;
  const shift = [...q].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % n;
  return { q, options: [...options.slice(shift), ...options.slice(0, shift)], answer: (answer - shift + n) % n, tip };
};

export const DIALOGUES: Dialogue[] = [
  {
    id: 'd-airport-checkin', title: 'Làm thủ tục bay', setting: 'airport', category: 'travel', difficulty: 'EASY', minutes: 4,
    keyPhrases: ['check in', 'boarding pass', 'window seat', 'hand luggage'],
    lines: [
      L('Agent', 'Good morning. May I see your passport and booking, please?', 'Chào buổi sáng. Cho tôi xem hộ chiếu và đặt chỗ của bạn nhé?'),
      L('Passenger', 'Good morning. Here you are.', 'Chào buổi sáng. Đây ạ.'),
      L('Agent', 'Thank you. Do you have any bags to check in?', 'Cảm ơn bạn. Bạn có hành lý ký gửi không?'),
      L('Passenger', 'Yes, one suitcase. Can I keep this backpack as hand luggage?', 'Có, một vali. Tôi có thể giữ chiếc ba lô này làm hành lý xách tay không?'),
      L('Agent', 'Yes, that\'s fine. Would you like a window seat or an aisle seat?', 'Được ạ. Bạn muốn ghế cạnh cửa sổ hay ghế lối đi?'),
      L('Passenger', 'A window seat, please, if it\'s available.', 'Cho tôi ghế cạnh cửa sổ, nếu còn.'),
      L('Agent', 'Here is your boarding pass. Your gate is B12, and boarding starts at nine thirty.', 'Đây là thẻ lên máy bay. Cổng của bạn là B12, lên máy bay lúc chín giờ ba mươi.'),
      L('Passenger', 'Thank you so much. Have a nice day!', 'Cảm ơn bạn rất nhiều. Chúc bạn một ngày tốt lành!'),
    ],
    quiz: [
      Q('Could I have a ____ seat, please?', ['window', 'windows', 'windowed', 'in window'], 0, '"window seat" là ghế cạnh cửa sổ.'),
      Q('Here is your ____ pass.', ['boarding', 'boarded', 'board', 'boards'], 0, '"boarding pass" là thẻ lên máy bay.'),
      Q('Can I keep this backpack as ____ luggage?', ['hand', 'hands', 'handed', 'handle'], 0, '"hand luggage" là hành lý xách tay.'),
    ],
  },
  {
    id: 'd-airport-gate', title: 'Tìm cổng lên máy bay', setting: 'airport', category: 'travel', difficulty: 'MEDIUM', minutes: 4,
    keyPhrases: ['gate', 'delayed', 'departure board', 'on time'],
    lines: [
      L('Passenger', 'Excuse me, do you know where gate C5 is?', 'Xin lỗi, bạn có biết cổng C5 ở đâu không?'),
      L('Staff', 'Sure. Go past the security checkpoint, then take the escalator up.', 'Được ạ. Đi qua khu kiểm tra an ninh, rồi đi thang cuốn lên tầng trên.'),
      L('Passenger', 'Is it far from here?', 'Có xa đây không?'),
      L('Staff', 'It\'s about a five-minute walk. Follow the signs for C gates.', 'Khoảng năm phút đi bộ. Bạn theo biển chỉ dẫn các cổng C.'),
      L('Passenger', 'Thanks. Is my flight still on time? I can\'t see it on the board.', 'Cảm ơn. Chuyến bay của tôi vẫn đúng giờ chứ? Tôi không thấy trên bảng.'),
      L('Staff', 'Let me check. Yes, it\'s on time, but the gate might change, so check the screen again.', 'Để tôi kiểm tra. Vâng, vẫn đúng giờ, nhưng cổng có thể đổi, bạn nhớ xem lại màn hình nhé.'),
      L('Passenger', 'Okay. I\'ll keep an eye on the screen. Thank you for your help.', 'Được. Tôi sẽ để ý màn hình. Cảm ơn bạn đã giúp.'),
      L('Staff', 'You\'re welcome. Have a safe flight!', 'Không có gì. Chúc bạn có chuyến bay an toàn!'),
    ],
    quiz: [
      Q('Excuse me, do you know where gate C5 ____?', ['is', 'are', 'be', 'being'], 0, 'Chủ ngữ "gate C5" là số ít nên dùng "is".'),
      Q('My flight is still on ____.', ['time', 'times', 'timing', 'timed'], 0, '"on time" là đúng giờ.'),
      Q('I\'ll keep an ____ on the screen.', ['eye', 'eyes', 'ear', 'look'], 0, '"keep an eye on" là để ý, theo dõi.'),
    ],
  },
  {
    id: 'd-airport-lost-bag', title: 'Nhận lại hành lý bị đến muộn', setting: 'airport', category: 'travel', difficulty: 'MEDIUM', minutes: 5,
    keyPhrases: ['baggage claim', 'carousel', 'tag', 'delivered to the hotel'],
    lines: [
      L('Passenger', 'Hi, my suitcase didn\'t come out on the carousel. Can you help me?', 'Chào bạn, vali của tôi không ra ở băng chuyền. Bạn giúp tôi được không?'),
      L('Staff', 'Of course. Do you have your baggage tag with you?', 'Được chứ. Bạn có thẻ hành lý không?'),
      L('Passenger', 'Yes, here it is. It has the number 4471 on it.', 'Có, đây ạ. Trên đó có số 4471.'),
      L('Staff', 'Thank you. Could you describe the suitcase, please?', 'Cảm ơn. Bạn mô tả giúp vali được không?'),
      L('Passenger', 'It\'s a large grey suitcase with a yellow ribbon on the handle.', 'Đó là vali lớn màu xám, có dải ruy băng vàng ở tay cầm.'),
      L('Staff', 'I\'ve found it. It will be delivered to your hotel this evening. Where are you staying?', 'Tôi đã tìm thấy rồi. Chiều nay hành lý sẽ được giao đến khách sạn của bạn. Bạn ở đâu?'),
      L('Passenger', 'At the Sunrise Hotel, on Main Street. Could you confirm the delivery time?', 'Ở khách sạn Sunrise, trên đường Main. Bạn xác nhận giúp giờ giao được không?'),
      L('Staff', 'Yes, between six and eight. Please keep this report number in case you need to call us.', 'Vâng, từ sáu đến tám giờ. Bạn giữ số báo cáo này để gọi lại nếu cần nhé.'),
    ],
    quiz: [
      Q('My suitcase didn\'t come out on the ____.', ['carousel', 'carrier', 'counter', 'cabin'], 0, '"carousel" là băng chuyền lấy hành lý.'),
      Q('It will be ____ to your hotel this evening.', ['delivered', 'deliver', 'delivering', 'delivery'], 0, 'Cấu trúc bị động: will be + V3.'),
      Q('Please keep this report ____ in case you need to call.', ['number', 'numbers', 'numerous', 'numb'], 0, '"report number" là số báo cáo.'),
    ],
  },
  {
    id: 'd-rest-reserve', title: 'Đặt bàn qua lời nói', setting: 'restaurant', category: 'dining', difficulty: 'EASY', minutes: 3,
    keyPhrases: ['reservation', 'table for four', 'by the window', 'under the name'],
    lines: [
      L('Guest', 'Hi, I\'d like to make a reservation for four people for tonight.', 'Chào bạn, tôi muốn đặt bàn cho bốn người tối nay.'),
      L('Host', 'Of course. What time would you like?', 'Được ạ. Anh chị muốn mấy giờ?'),
      L('Guest', 'Around seven thirty, if possible.', 'Khoảng bảy rưỡi, nếu được.'),
      L('Host', 'We have a table at seven thirty. Would you like a table inside or outside?', 'Chúng tôi còn bàn lúc bảy rưỡi. Anh chị muốn ngồi trong nhà hay ngoài trời?'),
      L('Guest', 'Inside, please. Could we have a table by the window?', 'Trong nhà ạ. Chúng tôi có thể ngồi cạnh cửa sổ được không?'),
      L('Host', 'Yes, we can do that. What name should I put the booking under?', 'Được ạ. Tôi nên ghi đặt chỗ dưới tên ai?'),
      L('Guest', 'Under the name Tran. Thank you very much.', 'Dưới tên Trần ạ. Cảm ơn bạn rất nhiều.'),
      L('Host', 'See you tonight, Mr. Tran!', 'Hẹn gặp anh Trần tối nay!'),
    ],
    quiz: [
      Q('I\'d like to make a ____ for four people.', ['reservation', 'reserve', 'reserved', 'reserving'], 0, '"make a reservation" là đặt chỗ.'),
      Q('Could we have a table by the ____?', ['window', 'windows', 'windowed', 'winner'], 0, '"by the window" là cạnh cửa sổ.'),
      Q('What name should I put the booking ____?', ['under', 'on', 'in', 'at'], 0, '"under the name" là dưới tên ai.'),
    ],
  },
  {
    id: 'd-rest-order', title: 'Gọi món theo thực đơn', setting: 'restaurant', category: 'dining', difficulty: 'EASY', minutes: 4,
    keyPhrases: ['would you like', 'medium rare', 'side dish', 'recommend'],
    lines: [
      L('Waiter', 'Hello! Are you ready to order?', 'Chào anh chị! Anh chị gọi món được chưa ạ?'),
      L('Guest', 'Not yet. What do you recommend?', 'Chưa ạ. Bạn gợi ý món nào?'),
      L('Waiter', 'Our grilled chicken is very popular. It comes with rice and a side salad.', 'Gà nướng của chúng tôi rất được ưa chuộng. Món đi kèm cơm và salad.'),
      L('Guest', 'That sounds good. I\'ll have the grilled chicken, please.', 'Nghe ngon đấy. Tôi lấy gà nướng nhé.'),
      L('Waiter', 'Great choice. How would you like your steak, if you order it?', 'Lựa chọn hay đấy. Nếu anh gọi bò bít tết, anh muốn chín mấy phần?'),
      L('Guest', 'I\'m not ordering steak, but my friend would like medium rare.', 'Tôi không gọi bò, nhưng bạn tôi muốn tái vừa.'),
      L('Waiter', 'Understood. Would you like anything to drink?', 'Được ạ. Anh chị có muốn uống gì không?'),
      L('Guest', 'Two glasses of iced tea, please. Thank you.', 'Hai ly trà đá ạ. Cảm ơn bạn.'),
    ],
    quiz: [
      Q('What do you ____?', ['recommend', 'recommendation', 'recommended', 'recommends'], 0, 'Sau "do you" dùng động từ nguyên mẫu.'),
      Q('I\'ll have the grilled chicken, ____.', ['please', 'pleased', 'pleasing', 'pleasure'], 0, '"please" đặt cuối câu để lịch sự khi gọi món.'),
      Q('My friend would like medium ____.', ['rare', 'rarely', 'rarity', 'raring'], 0, '"medium rare" là tái vừa.'),
    ],
  },
  {
    id: 'd-rest-allergy', title: 'Hỏi thành phần món ăn', setting: 'restaurant', category: 'dining', difficulty: 'MEDIUM', minutes: 5,
    keyPhrases: ['ingredients', 'contain', 'dairy-free', 'be careful'],
    lines: [
      L('Guest', 'Excuse me, could you tell me what\'s in the vegetable curry?', 'Xin lỗi, bạn cho tôi biết món cà ri rau có những gì được không?'),
      L('Waiter', 'Sure. It has coconut milk, potatoes, carrots, and some spices.', 'Được ạ. Có nước cốt dừa, khoai tây, cà rốt và một ít gia vị.'),
      L('Guest', 'Does it contain any dairy? I can\'t have milk products.', 'Có chứa sản phẩm từ sữa không? Tôi không ăn được các sản phẩm từ sữa.'),
      L('Waiter', 'Coconut milk is dairy-free, so the curry should be fine. Let me check with the kitchen.', 'Nước cốt dừa không chứa sữa, nên món cà ri này có lẽ ổn. Để tôi hỏi bếp.'),
      L('Guest', 'Thank you. Please be careful, because I get sick from even a small amount.', 'Cảm ơn. Làm ơn cẩn thận nhé, vì tôi bị ốm ngay cả khi ăn một chút.'),
      L('Waiter', 'Of course. The chef says they use butter in the sauce, so I\'d suggest the vegetable soup instead.', 'Dạ được. Đầu bếp nói họ dùng bơ trong nước sốt, nên tôi gợi ý anh chị dùng súp rau.'),
      L('Guest', 'Great, I\'ll have the soup, then. Thank you for checking so carefully.', 'Tuyệt, vậy tôi lấy súp. Cảm ơn bạn đã kiểm tra kỹ như vậy.'),
      L('Waiter', 'My pleasure. I\'ll bring it right away.', 'Hân hạnh ạ. Tôi sẽ mang ra ngay.'),
    ],
    quiz: [
      Q('Does it ____ any dairy?', ['contain', 'contains', 'containing', 'contained'], 0, 'Sau trợ động từ "does" dùng động từ nguyên mẫu.'),
      Q('Please be ____, because I get sick easily.', ['careful', 'care', 'carefully', 'careless'], 0, '"be careful" là cẩn thận; tính từ đứng sau "be".'),
      Q('The sauce contains ____, so I\'d suggest the soup.', ['butter', 'buttery', 'buttering', 'butters'], 0, '"butter" là bơ, danh từ không đếm được.'),
    ],
  },
  {
    id: 'd-rest-bill', title: 'Thanh toán và chia hoá đơn', setting: 'restaurant', category: 'dining', difficulty: 'MEDIUM', minutes: 4,
    keyPhrases: ['the bill', 'split', 'service charge', 'card machine'],
    lines: [
      L('Guest A', 'Could we have the bill, please?', 'Cho chúng tôi xin hoá đơn được không?'),
      L('Waiter', 'Of course. Would you like to pay together or separately?', 'Dạ được. Anh chị muốn thanh toán chung hay riêng ạ?'),
      L('Guest B', 'Let\'s split it. I had the pasta, and my friend had the salad and soup.', 'Chia đi. Tôi ăn mì ống, còn bạn tôi ăn salad và súp.'),
      L('Waiter', 'No problem. Your total is six hundred thousand dong, including a service charge.', 'Không vấn đề gì. Tổng cộng sáu trăm nghìn đồng, đã gồm phí phục vụ.'),
      L('Guest A', 'Is the service charge included in the menu price?', 'Phí phục vụ đã gồm trong giá thực đơn chưa?'),
      L('Waiter', 'No, it\'s added at the end, which is ten percent of the total.', 'Chưa ạ, phí được cộng vào cuối, bằng mười phần trăm tổng hoá đơn.'),
      L('Guest B', 'I see. We\'ll pay by card, please. Can you bring the card machine here?', 'Tôi hiểu rồi. Chúng tôi thanh toán bằng thẻ. Bạn mang máy quẹt thẻ đến đây được không?'),
      L('Waiter', 'Sure, I\'ll be right back with it.', 'Được ạ, tôi sẽ mang đến ngay.'),
    ],
    quiz: [
      Q('Would you like to pay together or ____?', ['separately', 'separate', 'separation', 'separates'], 0, '"separately" là riêng từng người (trạng từ).'),
      Q('Let\'s ____ the bill.', ['split', 'splits', 'splitting', 'split up'], 0, '"split the bill" là chia tiền hoá đơn.'),
      Q('The service charge is added at the ____.', ['end', 'ending', 'ended', 'endless'], 0, '"at the end" là ở cuối.'),
    ],
  },
  {
    id: 'd-rest-birthday', title: 'Chuẩn bị bánh sinh nhật', setting: 'restaurant', category: 'dining', difficulty: 'MEDIUM', minutes: 5,
    keyPhrases: ['celebrate', 'candle', 'surprise', 'write a message'],
    lines: [
      L('Guest', 'Hi, we\'re here to celebrate a birthday tonight. Could you help us?', 'Chào bạn, tối nay chúng tôi đến mừng sinh nhật. Bạn giúp chúng tôi được không?'),
      L('Waiter', 'Of course! Would you like us to bring out a cake?', 'Được chứ! Anh chị có muốn chúng tôi mang bánh ra không?'),
      L('Guest', 'Yes, please. Could you also bring a candle and sing a short song?', 'Có ạ. Bạn cũng có thể mang một cây nến và hát một bài ngắn được không?'),
      L('Waiter', 'We can do that. Would you like the song to be a surprise for the birthday person?', 'Chúng tôi làm được. Anh chị có muốn bài hát là bất ngờ cho người sinh nhật không?'),
      L('Guest', 'Definitely. Please don\'t tell her! She thinks we are just having dinner.', 'Chắc chắn rồi. Làm ơn đừng nói với cô ấy! Cô ấy nghĩ chúng tôi chỉ đi ăn tối thôi.'),
      L('Waiter', 'Don\'t worry, we\'ll keep the secret. Would you like a message written on the cake?', 'Yên tâm, chúng tôi giữ bí mật. Anh chị có muốn viết lời chúc lên bánh không?'),
      L('Guest', 'Yes, please write "Happy birthday, Linh!" in blue letters.', 'Có ạ, làm ơn viết "Chúc mừng sinh nhật, Linh!" bằng chữ màu xanh.'),
      L('Waiter', 'Perfect. We\'ll bring it out in about ten minutes.', 'Tuyệt. Chúng tôi sẽ mang ra trong khoảng mười phút nữa.'),
    ],
    quiz: [
      Q('Could you also bring a ____ and sing a short song?', ['candle', 'candy', 'candid', 'candies'], 0, '"candle" là nến.'),
      Q('Please don\'t ____ her!', ['tell', 'telling', 'told', 'tells'], 0, 'Câu mệnh lệnh phủ định: Don\'t + động từ nguyên mẫu.'),
      Q('We\'ll keep the ____.', ['secret', 'secrets', 'secretly', 'secretary'], 0, '"keep the secret" là giữ bí mật.'),
    ],
  },
  {
    id: 'd-cook-recipe', title: 'Hỏi công thức nấu canh', setting: 'kitchen', category: 'daily', difficulty: 'EASY', minutes: 3,
    keyPhrases: ['how do I', 'boil', 'add', 'taste'],
    lines: [
      L('Anna', 'Mom, how do I make the sour soup? I want to try it tonight.', 'Mẹ ơi, con nấu canh chua như thế nào? Tối nay con muốn thử.'),
      L('Mom', 'First, boil some water and add the fish.', 'Đầu tiên, đun sôi nước rồi cho cá vào.'),
      L('Anna', 'Okay. How long should the fish cook?', 'Được. Cá phải nấu bao lâu ạ?'),
      L('Mom', 'About five minutes, until it turns white. Then add the tomatoes and pineapple.', 'Khoảng năm phút, đến khi cá chuyển trắng. Sau đó thêm cà chua và dứa.'),
      L('Anna', 'Should I add the tamarind water now?', 'Con có nên cho nước me vào bây giờ không?'),
      L('Mom', 'Yes, add it slowly and taste the soup as you go.', 'Có, cho từ từ và nếm canh trong khi nấu.'),
      L('Anna', 'Got it. Is it too sour if I add a lot of tamarind?', 'Con hiểu rồi. Nếu cho nhiều me quá thì có chua quá không ạ?'),
      L('Mom', 'It can be. Start with a little. You can always add more later.', 'Có thể. Bắt đầu với một ít. Sau đó con luôn có thể thêm.'),
    ],
    quiz: [
      Q('First, ____ some water and add the fish.', ['boil', 'boils', 'boiled', 'boiling'], 0, 'Câu hướng dẫn dùng động từ nguyên mẫu.'),
      Q('Taste the soup as you ____.', ['go', 'goes', 'going', 'went'], 0, '"as you go" là trong khi làm.'),
      Q('Start with a ____. You can always add more later.', ['little', 'few', 'lot', 'much'], 0, '"a little" đi với danh từ không đếm được như "tamarind".'),
    ],
  },
  {
    id: 'd-cook-guests', title: 'Nấu cơm cho khách', setting: 'kitchen', category: 'home', difficulty: 'MEDIUM', minutes: 5,
    keyPhrases: ['be allergic to', 'prepare', 'ready in', 'help out'],
    lines: [
      L('Host', 'Thanks for coming! Dinner will be ready in about twenty minutes.', 'Cảm ơn đã đến! Bữa tối khoảng hai mươi phút nữa sẽ sẵn sàng.'),
      L('Guest', 'Can I help you in the kitchen?', 'Tôi giúp gì bạn trong bếp được không?'),
      L('Host', 'That would be great. Could you cut the cucumbers, please?', 'Tuyệt quá. Bạn cắt giúp dưa chuột được không?'),
      L('Guest', 'Sure. Do you want them thinly sliced or in big pieces?', 'Được. Bạn muốn thái mỏng hay thái miếng to?'),
      L('Host', 'Thin slices, please. My friend is allergic to peanuts, so be careful with the sauce.', 'Thái mỏng nhé. Bạn tôi bị dị ứng đậu phộng, nên cẩn thận với nước sốt.'),
      L('Guest', 'Oh, I didn\'t know. Did you make the sauce without peanuts?', 'Ồ, tôi không biết. Bạn làm nước sốt không có đậu phộng chưa?'),
      L('Host', 'Yes, I did. I used sesame instead. Everything is safe.', 'Rồi, tôi dùng mè thay thế. Mọi thứ đều an toàn.'),
      L('Guest', 'Great. Let me know if you need anything else.', 'Tốt quá. Có gì cần thêm cứ bảo tôi nhé.'),
    ],
    quiz: [
      Q('My friend is ____ to peanuts.', ['allergic', 'allergy', 'allergen', 'allergies'], 0, '"be allergic to" là bị dị ứng với.'),
      Q('Dinner will be ready ____ about twenty minutes.', ['in', 'on', 'at', 'for'], 0, '"in about twenty minutes" là trong khoảng hai mươi phút nữa.'),
      Q('Could you cut the cucumbers into thin ____?', ['slices', 'slice', 'sliced', 'slicing'], 0, '"slices" là các lát mỏng (danh từ số nhiều).'),
    ],
  },
  {
    id: 'd-cook-leftovers', title: 'Bảo quản thức ăn thừa', setting: 'kitchen', category: 'home', difficulty: 'EASY', minutes: 3,
    keyPhrases: ['leftovers', 'fridge', 'throw away', 'store'],
    lines: [
      L('Tom', 'Do we have any leftovers from last night?', 'Tối qua còn đồ ăn thừa nào không?'),
      L('Lily', 'Yes, there\'s some rice and chicken in the fridge.', 'Có, còn một ít cơm và gà trong tủ lạnh.'),
      L('Tom', 'How long have they been there?', 'Chúng để trong đó bao lâu rồi?'),
      L('Lily', 'Since yesterday evening. I think they\'re still good.', 'Từ tối hôm qua. Tôi nghĩ vẫn còn ăn được.'),
      L('Tom', 'Be careful. Food should be eaten within two days in the fridge.', 'Cẩn thận nhé. Đồ ăn trong tủ lạnh nên ăn trong vòng hai ngày.'),
      L('Lily', 'You\'re right. Shall we throw away the rice, then?', 'Bạn nói đúng. Vậy mình bỏ cơm đi nhé?'),
      L('Tom', 'No, let\'s heat the chicken and eat it now. The rice is fine.', 'Không, mình hâm nóng gà rồi ăn luôn đi. Cơm vẫn ổn.'),
      L('Lily', 'Okay. Next time I\'ll store leftovers in small containers.', 'Được. Lần sau tôi sẽ để đồ thừa trong hộp nhỏ.'),
    ],
    quiz: [
      Q('Do we have any ____ from last night?', ['leftovers', 'leftover', 'leftovered', 'leftwards'], 0, '"leftovers" là đồ ăn thừa.'),
      Q('Food should be eaten within two ____.', ['days', 'day', 'daily', 'dayly'], 0, '"two days" là hai ngày (số nhiều).'),
      Q('Shall we ____ the rice, then?', ['throw away', 'throw', 'threw', 'throwing'], 0, '"throw away" là vứt đi.'),
    ],
  },
  {
    id: 'd-cook-mess', title: 'Dọn bếp sau khi nấu', setting: 'kitchen', category: 'home', difficulty: 'EASY', minutes: 3,
    keyPhrases: ['clean up', 'do the dishes', 'wipe the table', 'take turns'],
    lines: [
      L('Mai', 'The kitchen is a mess after cooking. Shall we clean up?', 'Bếp bừa bộn sau khi nấu. Mình dọn nhé?'),
      L('Ben', 'Sure. I\'ll do the dishes if you wipe the table.', 'Được. Tôi rửa bát nếu bạn lau bàn.'),
      L('Mai', 'Deal. Did you put the leftover soup in the fridge?', 'Thoả thuận. Bạn đã cho canh thừa vào tủ lạnh chưa?'),
      L('Ben', 'Not yet. Let me do it now.', 'Chưa. Để tôi làm ngay.'),
      L('Mai', 'Also, can you take out the trash? It\'s really full.', 'À, bạn đổ rác giúp được không? Thùng rác đầy quá.'),
      L('Ben', 'Okay. Should we take turns cooking next week, too?', 'Được. Tuần sau mình cũng thay phiên nấu nhé?'),
      L('Mai', 'Good idea. You cook on Monday, and I\'ll cook on Wednesday.', 'Ý hay đấy. Thứ Hai bạn nấu, còn thứ Tư tôi nấu.'),
      L('Ben', 'Perfect. Thanks for helping me clean up.', 'Hoàn hảo. Cảm ơn bạn đã giúp tôi dọn dẹp.'),
    ],
    quiz: [
      Q('The kitchen is a ____ after cooking.', ['mess', 'messy', 'messing', 'messes'], 0, '"a mess" là bừa bộn (danh từ).'),
      Q('Should we ____ turns cooking next week?', ['take', 'make', 'do', 'have'], 0, '"take turns" là thay phiên nhau.'),
      Q('Can you ____ out the trash?', ['take', 'make', 'put', 'give'], 0, '"take out the trash" là đổ rác.'),
    ],
  },
  {
    id: 'd-groc-list', title: 'Lập danh sách mua sắm', setting: 'grocery', category: 'daily', difficulty: 'EASY', minutes: 3,
    keyPhrases: ['shopping list', 'we need', 'run out of', 'pick up'],
    lines: [
      L('Hung', 'We need to go shopping this weekend. Shall we make a list?', 'Cuối tuần mình phải đi mua sắm. Mình lập danh sách nhé?'),
      L('Linh', 'Good idea. We\'re running out of milk and eggs.', 'Ý hay. Chúng ta sắp hết sữa và trứng rồi.'),
      L('Hung', 'What else? Do we need vegetables?', 'Còn gì nữa? Có cần rau không?'),
      L('Linh', 'Yes, some carrots, onions, and spinach, please.', 'Có, làm ơn mua cà rốt, hành tây và rau bina.'),
      L('Hung', 'Okay. Do we need rice or bread?', 'Được. Mình cần gạo hay bánh mì?'),
      L('Linh', 'Rice is fine, but we need more bread for breakfast.', 'Gạo vẫn đủ, nhưng mình cần thêm bánh mì cho bữa sáng.'),
      L('Hung', 'Got it. I\'ll pick up the fruit on the way home, too.', 'Hiểu rồi. Trên đường về tôi cũng sẽ mua trái cây.'),
      L('Linh', 'Thanks! Let\'s go early, before the supermarket gets crowded.', 'Cảm ơn! Mình đi sớm nhé, trước khi siêu thị đông.'),
    ],
    quiz: [
      Q('We\'re ____ out of milk and eggs.', ['running', 'run', 'runs', 'ran'], 0, '"running out of" là sắp hết.'),
      Q('I\'ll ____ up the fruit on the way home.', ['pick', 'pack', 'peak', 'put'], 0, '"pick up" là mua, ghé lấy.'),
      Q('Let\'s go early, before the supermarket gets ____.', ['crowded', 'crowd', 'crowding', 'crowds'], 0, '"crowded" là đông người (tính từ).'),
    ],
  },
  {
    id: 'd-groc-checkout', title: 'Thanh toán ở quầy siêu thị', setting: 'grocery', category: 'shopping', difficulty: 'EASY', minutes: 3,
    keyPhrases: ['checkout', 'bag', 'receipt', 'do you need'],
    lines: [
      L('Cashier', 'Hello! Did you find everything you need?', 'Chào bạn! Bạn đã tìm được mọi thứ cần mua chưa?'),
      L('Customer', 'Yes, thank you. Here are my items.', 'Rồi, cảm ơn. Đây là đồ của tôi.'),
      L('Cashier', 'Do you need a bag?', 'Bạn có cần túi không?'),
      L('Customer', 'Yes, please. A paper bag, if you have one.', 'Có, làm ơn. Túi giấy nếu có.'),
      L('Cashier', 'That\'s thirty-two thousand dong. Would you like a receipt?', 'Tổng cộng ba mươi hai nghìn đồng. Bạn có cần hoá đơn không?'),
      L('Customer', 'Yes, please. Can I pay by card?', 'Có ạ. Tôi trả bằng thẻ được không?'),
      L('Cashier', 'Of course. Please insert your card and enter your PIN.', 'Được chứ. Bạn vui lòng cắm thẻ và nhập mã PIN.'),
      L('Customer', 'Done. Have a nice day!', 'Xong rồi. Chúc bạn một ngày tốt lành!'),
    ],
    quiz: [
      Q('Did you find everything you ____?', ['need', 'needs', 'needed', 'needing'], 0, 'Trong câu hỏi "everything you need" dùng động từ nguyên mẫu.'),
      Q('Would you like a ____?', ['receipt', 'receive', 'received', 'receipts'], 0, '"receipt" là hoá đơn, danh từ số ít.'),
      Q('Please insert your card and enter your ____.', ['PIN', 'pin', 'PINs', 'pinned'], 0, '"PIN" là mã số cá nhân của thẻ.'),
    ],
  },
  {
    id: 'd-groc-fresh', title: 'Chọn rau củ tươi', setting: 'grocery', category: 'shopping', difficulty: 'MEDIUM', minutes: 4,
    keyPhrases: ['fresh', 'organic', 'bunch', 'on sale'],
    lines: [
      L('Customer', 'Excuse me, are these tomatoes fresh?', 'Xin lỗi, cà chua này có tươi không?'),
      L('Staff', 'Yes, they were delivered this morning. Are you looking for anything else?', 'Có, hàng được giao sáng nay. Bạn còn tìm món gì khác không?'),
      L('Customer', 'Do you have organic spinach today?', 'Hôm nay có rau bina hữu cơ không?'),
      L('Staff', 'Yes, it\'s over there, next to the lettuce. It\'s a little more expensive, though.', 'Có, ở đằng kia, cạnh rau xà lách. Tuy nhiên hơi đắt hơn một chút.'),
      L('Customer', 'That\'s fine. Are the carrots on sale today?', 'Không sao. Cà rốt hôm nay có giảm giá không?'),
      L('Staff', 'Yes, they\'re twenty percent off. The bunch is two bags for the price of one.', 'Có, giảm hai mươi phần trăm. Một bó thì mua hai túi giá bằng một.'),
      L('Customer', 'Perfect. I\'ll take two bunches of carrots and one bag of spinach.', 'Tuyệt. Tôi lấy hai bó cà rốt và một túi rau bina.'),
      L('Staff', 'Great. Let me know if you need help with anything else.', 'Tuyệt. Bạn cần giúp gì thêm cứ gọi tôi nhé.'),
    ],
    quiz: [
      Q('Are these tomatoes ____?', ['fresh', 'freshly', 'freshen', 'freshness'], 0, '"fresh" là tươi (tính từ).'),
      Q('Are the carrots on ____ today?', ['sale', 'sell', 'sold', 'selling'], 0, '"on sale" là đang giảm giá.'),
      Q('I\'ll take two ____ of carrots.', ['bunches', 'bunch', 'bunched', 'bunching'], 0, '"two bunches" là hai bó, danh từ số nhiều.'),
    ],
  },
  {
    id: 'd-groc-discount', title: 'Hỏi khuyến mãi', setting: 'grocery', category: 'shopping', difficulty: 'MEDIUM', minutes: 4,
    keyPhrases: ['promotion', 'member card', 'buy one get one', 'expire'],
    lines: [
      L('Customer', 'Hi, are there any promotions on cooking oil today?', 'Chào bạn, hôm nay dầu ăn có khuyến mãi không?'),
      L('Staff', 'Yes, there\'s a buy one, get one free offer on the two-liter bottles.', 'Có, mua một tặng một cho chai hai lít.'),
      L('Customer', 'That\'s great. Do I need a member card to get the discount?', 'Tuyệt. Tôi có cần thẻ thành viên để được giảm giá không?'),
      L('Staff', 'Yes, you do. Do you have one with you?', 'Vâng, cần ạ. Bạn có thẻ không?'),
      L('Customer', 'Yes, here it is. Does it expire this year?', 'Có, đây ạ. Thẻ này có hết hạn trong năm nay không?'),
      L('Staff', 'It\'s valid until December. You can use it at any store in the chain.', 'Có hiệu lực đến tháng Mười Hai. Bạn có thể dùng ở bất kỳ cửa hàng nào trong chuỗi.'),
      L('Customer', 'Perfect. I\'ll take two bottles, then.', 'Tuyệt. Vậy tôi lấy hai chai.'),
      L('Staff', 'Okay, the total is one hundred eighty thousand dong.', 'Được, tổng cộng là một trăm tám mươi nghìn đồng.'),
    ],
    quiz: [
      Q('Do I need a member card to get the ____?', ['discount', 'discounted', 'discounting', 'discounts'], 0, '"discount" là giảm giá.'),
      Q('Does it ____ this year?', ['expire', 'expired', 'expiring', 'expiry'], 0, '"expire" là hết hạn (động từ).'),
      Q('It\'s valid ____ December.', ['until', 'by', 'in', 'at'], 0, '"until December" là đến tháng Mười Hai.'),
    ],
  },
  {
    id: 'd-clothing-try', title: 'Thử đồ ở cửa hàng', setting: 'clothing', category: 'shopping', difficulty: 'EASY', minutes: 3,
    keyPhrases: ['try on', 'fitting room', 'too big', 'a bit tight'],
    lines: [
      L('Customer', 'Can I try on this jacket, please?', 'Tôi thử chiếc áo khoác này được không?'),
      L('Staff', 'Of course. What size do you usually wear?', 'Được chứ. Bạn thường mặc cỡ nào?'),
      L('Customer', 'I\'m usually a medium. Where is the fitting room?', 'Tôi thường mặc cỡ M. Phòng thử đồ ở đâu?'),
      L('Staff', 'Right over there, on the left. I\'ll bring a large, just in case.', 'Ngay đằng kia, bên trái. Tôi sẽ mang thêm cỡ L, để chắc chắn.'),
      L('Customer', 'Thanks. Okay, the medium is a bit tight in the shoulders.', 'Cảm ơn. Được rồi, cỡ M hơi chật ở vai.'),
      L('Staff', 'How about the large? Does it fit better?', 'Còn cỡ L thì sao? Có vừa hơn không?'),
      L('Customer', 'It\'s too big in the sleeves, but the shoulders are perfect.', 'Tay áo thì quá rộng, nhưng vai thì vừa vặn.'),
      L('Staff', 'Then the medium might be the best choice. Would you like to try it in a different color?', 'Vậy có lẽ cỡ M là lựa chọn tốt nhất. Bạn có muốn thử màu khác không?'),
    ],
    quiz: [
      Q('Can I ____ on this jacket, please?', ['try', 'tray', 'trial', 'tried'], 0, '"try on" là thử (quần áo).'),
      Q('The medium is a bit ____ in the shoulders.', ['tight', 'tightly', 'tighten', 'tightness'], 0, '"tight" là chật (tính từ).'),
      Q('It\'s too ____ in the sleeves.', ['big', 'bigger', 'biggest', 'bigly'], 0, '"too big" là quá rộng.'),
    ],
  },
  {
    id: 'd-market-bargain', title: 'Mặc cả ở chợ', setting: 'market', category: 'shopping', difficulty: 'MEDIUM', minutes: 4,
    keyPhrases: ['how much', 'a bit cheaper', 'mix', 'deal'],
    lines: [
      L('Buyer', 'How much are these apples?', 'Táo này bao nhiêu tiền ạ?'),
      L('Vendor', 'Fifty thousand dong per kilo. They\'re very sweet.', 'Năm mươi nghìn đồng một ki-lô. Táo rất ngọt.'),
      L('Buyer', 'That\'s a bit expensive. Could you give me a better price for three kilos?', 'Hơi đắt. Bà có thể bớt giá nếu tôi mua ba ki-lô không?'),
      L('Vendor', 'Okay, forty-five thousand per kilo for three kilos.', 'Được, bốn mươi lăm nghìn một ki-lô nếu mua ba ki-lô.'),
      L('Buyer', 'Hmm. Can you do forty thousand? I\'ll buy a bit more.', 'Hừm. Bà bán bốn mươi nghìn được không? Tôi sẽ mua thêm một chút.'),
      L('Vendor', 'Let\'s meet in the middle. Forty-two thousand, and I\'ll add one more apple for free.', 'Mình gặp nhau ở giữa nhé. Bốn mươi hai nghìn, và tôi tặng thêm một quả.'),
      L('Buyer', 'Deal! Can you put them in a paper bag?', 'Chốt! Bà đóng vào túi giấy được không?'),
      L('Vendor', 'Of course. Here you go, thank you for coming!', 'Được chứ. Của bạn đây, cảm ơn đã ghé!'),
    ],
    quiz: [
      Q('Could you give me a better ____?', ['price', 'prices', 'priced', 'pricey'], 0, '"a better price" là giá tốt hơn.'),
      Q('Let\'s meet in the ____.', ['middle', 'center', 'mid', 'between'], 0, '"meet in the middle" là gặp nhau ở giữa (thoả hiệp).'),
      Q('I\'ll buy a bit ____.', ['more', 'most', 'much', 'many'], 0, '"a bit more" là thêm một chút.'),
    ],
  },
  {
    id: 'd-daily-neighbor', title: 'Chào hỏi hàng xóm', setting: 'home', category: 'daily', difficulty: 'EASY', minutes: 3,
    keyPhrases: ['just moved in', 'nice to meet you', 'let me know', 'drop by'],
    lines: [
      L('Neighbor', 'Hi! I just saw you moving in. Welcome to the building!', 'Chào bạn! Tôi vừa thấy bạn chuyển đến. Chào mừng đến toà nhà!'),
      L('Me', 'Thank you! I\'m Hoang, from apartment 402. Nice to meet you.', 'Cảm ơn bạn! Tôi là Hoàng, ở căn hộ 402. Rất vui được gặp bạn.'),
      L('Neighbor', 'I\'m Mai, I live right next door. Let me know if you need anything.', 'Tôi là Mai, ở ngay bên cạnh. Có gì cần thì bảo tôi nhé.'),
      L('Me', 'That\'s very kind. Where can I buy groceries around here?', 'Bạn thật tốt. Quanh đây tôi có thể mua đồ tạp hoá ở đâu?'),
      L('Neighbor', 'There\'s a small market at the end of the street. It opens early.', 'Có một chợ nhỏ ở cuối đường. Họ mở cửa sớm.'),
      L('Me', 'Great. Also, is there a good place to get coffee nearby?', 'Hay quá. Và gần đây có chỗ nào uống cà phê ngon không?'),
      L('Neighbor', 'Yes, the café on the corner is really nice. Why don\'t you drop by this weekend?', 'Có, quán cà phê ở góc đường rất dễ chịu. Cuối tuần này bạn ghé qua nhé?'),
      L('Me', 'I\'d love to. Thanks again!', 'Tôi rất muốn. Cảm ơn bạn lần nữa!'),
    ],
    quiz: [
      Q('I just ____ in.', ['moved', 'move', 'moving', 'moves'], 0, '"just moved in" là vừa chuyển đến (thì quá khứ).'),
      Q('Let me ____ if you need anything.', ['know', 'known', 'knowing', 'knows'], 0, '"let me know" là cho tôi biết.'),
      Q('Why don\'t you ____ by this weekend?', ['drop', 'drip', 'drop out', 'dropped'], 0, '"drop by" là ghé qua.'),
    ],
  },
  {
    id: 'd-daily-weekend', title: 'Kế hoạch cuối tuần', setting: 'street', category: 'daily', difficulty: 'EASY', minutes: 3,
    keyPhrases: ['any plans', 'go out', 'sounds fun', 'how about'],
    lines: [
      L('Tam', 'Hey! Do you have any plans for the weekend?', 'Này! Cuối tuần bạn có kế hoạch gì không?'),
      L('Nam', 'Not really. Maybe I\'ll stay home and rest.', 'Chưa có gì. Có lẽ tôi ở nhà nghỉ ngơi.'),
      L('Tam', 'You should go out! How about a picnic by the lake on Saturday?', 'Bạn nên ra ngoài đi! Thứ Bảy đi picnic bên hồ thì sao?'),
      L('Nam', 'That sounds fun. What time should we meet?', 'Nghe vui đấy. Mình nên gặp nhau lúc mấy giờ?'),
      L('Tam', 'Let\'s meet at nine in the morning. I\'ll bring the drinks.', 'Mình gặp nhau lúc chín giờ sáng nhé. Tôi sẽ mang đồ uống.'),
      L('Nam', 'Great. I\'ll bring some sandwiches and fruit.', 'Tuyệt. Tôi sẽ mang bánh mì kẹp và trái cây.'),
      L('Tam', 'Perfect. Can you invite Lan too?', 'Hoàn hảo. Bạn rủ Lan luôn được không?'),
      L('Nam', 'Sure, I\'ll text her now. See you on Saturday!', 'Được, tôi nhắn cho cô ấy ngay. Thứ Bảy gặp nhé!'),
    ],
    quiz: [
      Q('Do you have any ____ for the weekend?', ['plans', 'plan', 'planned', 'planning'], 0, '"any plans" là kế hoạch (số nhiều).'),
      Q('You should ____ out!', ['go', 'going', 'went', 'goes'], 0, '"should go out" là nên ra ngoài.'),
      Q('That ____ fun.', ['sounds', 'sound', 'sounded', 'sounding'], 0, 'Chủ ngữ "that" số ít nên dùng "sounds".'),
    ],
  },
  {
    id: 'd-daily-weather', title: 'Trò chuyện về thời tiết', setting: 'street', category: 'daily', difficulty: 'EASY', minutes: 3,
    keyPhrases: ['so humid', 'bring an umbrella', 'forecast', 'it looks like'],
    lines: [
      L('Anh', 'It\'s so hot today. I can barely breathe!', 'Hôm nay nóng quá. Tôi gần như không thở nổi!'),
      L('Ben', 'I know. It\'s very humid, too.', 'Đúng vậy. Trời cũng rất ẩm.'),
      L('Anh', 'Is it going to rain later? It looks like it might.', 'Chiều nay có mưa không? Trông có vẻ sẽ mưa.'),
      L('Ben', 'The forecast says there\'s a chance of storms this evening.', 'Dự báo nói tối nay có khả năng có dông.'),
      L('Anh', 'Then I should bring an umbrella. Do you want to get some ice cream?', 'Vậy tôi nên mang ô. Bạn có muốn đi ăn kem không?'),
      L('Ben', 'Yes, let\'s go before the rain starts!', 'Có, đi trước khi mưa nhé!'),
      L('Anh', 'Good idea. It\'s so nice to have a break from the heat.', 'Ý hay. Được nghỉ khỏi cái nóng thế này thật tuyệt.'),
      L('Ben', 'Absolutely. Let\'s go!', 'Đúng vậy. Đi thôi!'),
    ],
    quiz: [
      Q('It\'s so ____ today. I can barely breathe!', ['hot', 'heat', 'hotly', 'hotter'], 0, '"so hot" là nóng quá (tính từ sau "so").'),
      Q('It looks like it ____ rain.', ['might', 'mights', 'mighting', 'mighted'], 0, '"might" là có thể (động từ khuyết thiếu).'),
      Q('Let\'s go before the rain ____!', ['starts', 'start', 'started', 'starting'], 0, 'Mệnh đề thời gian hiện tại đơn dùng để chỉ tương lai.'),
    ],
  },
  {
    id: 'd-work-standup', title: 'Họp đứng đầu ngày', setting: 'office', category: 'work', difficulty: 'MEDIUM', minutes: 4,
    keyPhrases: ['update', 'blocked', 'on track', 'follow up'],
    lines: [
      L('Manager', 'Good morning, everyone. Let\'s start with updates. Minh, how is the report going?', 'Chào buổi sáng mọi người. Bắt đầu với phần cập nhật. Minh, báo cáo đang thế nào?'),
      L('Minh', 'It\'s on track. I\'ll finish the first draft by Wednesday.', 'Đang đúng tiến độ. Tôi sẽ xong bản nháp đầu tiên trước thứ Tư.'),
      L('Manager', 'Great. Anything blocking you?', 'Tốt. Có gì đang cản trở bạn không?'),
      L('Minh', 'Yes, I\'m waiting for the sales data from finance.', 'Có, tôi đang chờ dữ liệu bán hàng từ bộ phận tài chính.'),
      L('Manager', 'I\'ll follow up with them this afternoon. Lan, what about the design?', 'Chiều nay tôi sẽ theo dõi với họ. Lan, còn thiết kế thì sao?'),
      L('Lan', 'The mockups are ready for review. I\'d like feedback by Friday.', 'Bản mẫu đã sẵn sàng để xem xét. Tôi muốn nhận góp ý trước thứ Sáu.'),
      L('Manager', 'Noted. Let\'s meet again tomorrow at nine. Thanks, everyone.', 'Ghi nhận. Ngày mai mình họp lại lúc chín giờ. Cảm ơn mọi người.'),
      L('Lan', 'Sounds good. See you tomorrow.', 'Nghe ổn. Hẹn ngày mai.'),
    ],
    quiz: [
      Q('It\'s on ____. I\'ll finish by Wednesday.', ['track', 'trick', 'truck', 'tracks'], 0, '"on track" là đúng tiến độ.'),
      Q('I\'m waiting for the sales data from ____.', ['finance', 'financial', 'financing', 'finances'], 0, '"finance" là tài chính (danh từ, đi sau "from").'),
      Q('I\'ll ____ up with them this afternoon.', ['follow', 'following', 'followed', 'follows'], 0, '"follow up" là theo dõi, hỏi lại.'),
    ],
  },
  {
    id: 'd-work-deadline', title: 'Báo cáo tiến độ với sếp', setting: 'office', category: 'work', difficulty: 'MEDIUM', minutes: 4,
    keyPhrases: ['behind schedule', 'catch up', 'a few days', 'priority'],
    lines: [
      L('Boss', 'Hi, how is the client proposal coming along?', 'Chào bạn, bản đề xuất cho khách hàng tiến triển thế nào rồi?'),
      L('Staff', 'I\'m a bit behind schedule. The pricing numbers took longer than expected.', 'Tôi hơi chậm tiến độ. Phần số liệu giá mất nhiều thời gian hơn dự kiến.'),
      L('Boss', 'The client meeting is on Friday. Can you finish it by Thursday?', 'Cuộc họp với khách là thứ Sáu. Bạn có thể xong trước thứ Năm không?'),
      L('Staff', 'I think so, if I can get the final numbers from accounting tomorrow.', 'Tôi nghĩ là được, nếu ngày mai tôi lấy được số liệu cuối cùng từ kế toán.'),
      L('Boss', 'Okay. Make this your top priority today, then.', 'Được. Vậy hôm nay hãy đặt việc này làm ưu tiên số một.'),
      L('Staff', 'Understood. Should I send you a draft this afternoon?', 'Đã hiểu. Chiều nay tôi có nên gửi bản nháp cho anh không?'),
      L('Boss', 'Yes, please. I\'d like to review it before we share it with the client.', 'Có, làm ơn. Tôi muốn xem trước khi chia sẻ với khách hàng.'),
      L('Staff', 'Of course. I\'ll also let you know if I need a few extra days.', 'Dĩ nhiên. Tôi cũng sẽ báo anh nếu cần thêm vài ngày.'),
    ],
    quiz: [
      Q('I\'m a bit ____ schedule.', ['behind', 'after', 'beyond', 'before'], 0, '"behind schedule" là chậm tiến độ.'),
      Q('Make this your top ____ today.', ['priority', 'prior', 'priorities', 'prioritize'], 0, '"priority" là ưu tiên (danh từ số ít).'),
      Q('I\'d like to review it before we ____ it with the client.', ['share', 'shared', 'sharing', 'shares'], 0, 'Sau "before we" dùng động từ nguyên mẫu hiện tại.'),
    ],
  },
  {
    id: 'd-work-first-day', title: 'Ngày đầu đi làm', setting: 'office', category: 'work', difficulty: 'EASY', minutes: 3,
    keyPhrases: ['show you around', 'login', 'get started', 'nice to have you'],
    lines: [
      L('Manager', 'Welcome to the team! I\'m Chris, your manager. Nice to have you here.', 'Chào mừng bạn đến với nhóm! Tôi là Chris, quản lý của bạn. Rất vui khi có bạn ở đây.'),
      L('New staff', 'Thanks, Chris. I\'m excited to start working with everyone.', 'Cảm ơn Chris. Tôi rất háo hức được làm việc cùng mọi người.'),
      L('Manager', 'Let me show you around the office first. The kitchen is over there.', 'Để tôi dẫn bạn đi tham quan văn phòng trước. Bếp ở đằng kia.'),
      L('New staff', 'Great. Where should I sit?', 'Tốt quá. Tôi nên ngồi ở đâu?'),
      L('Manager', 'Next to Anna. She\'ll help you get started on the project.', 'Cạnh Anna. Cô ấy sẽ giúp bạn bắt đầu dự án.'),
      L('New staff', 'Perfect. I\'ll need a login for the system, too.', 'Hoàn hảo. Tôi cũng cần tài khoản đăng nhập vào hệ thống.'),
      L('Manager', 'IT will set that up this morning. I\'ll see you at lunch.', 'Bộ phận IT sẽ cấp sáng nay. Hẹn gặp bạn vào bữa trưa.'),
      L('New staff', 'Thanks, Chris. See you then!', 'Cảm ơn Chris. Hẹn gặp lại!'),
    ],
    quiz: [
      Q('Let me show you ____ the office first.', ['around', 'round', 'about', 'along'], 0, '"show you around" là dẫn đi tham quan.'),
      Q('She\'ll help you get ____ on the project.', ['started', 'start', 'starting', 'starts'], 0, '"get started" là bắt đầu.'),
      Q('I\'ll need a ____ for the system.', ['login', 'logging', 'logged', 'logs'], 0, '"login" là tài khoản đăng nhập (danh từ).'),
    ],
  },
  {
    id: 'd-work-request', title: 'Nhờ đồng nghiệp giúp đỡ', setting: 'office', category: 'work', difficulty: 'EASY', minutes: 3,
    keyPhrases: ['could you', 'would you mind', 'happy to help', 'swap'],
    lines: [
      L('Hoa', 'Hi Phuc, could you help me with the spreadsheet for a minute?', 'Chào Phúc, bạn giúp tôi xem bảng tính một chút được không?'),
      L('Phuc', 'Sure. What\'s the problem?', 'Được. Có vấn đề gì vậy?'),
      L('Hoa', 'The totals don\'t add up. Would you mind checking the formulas?', 'Tổng không khớp. Bạn xem giúp công thức được không?'),
      L('Phuc', 'Happy to help. Oh, you\'re using the wrong range in this cell.', 'Sẵn lòng. À, bạn đang dùng sai vùng dữ liệu ở ô này.'),
      L('Hoa', 'Really? Can you show me how to fix it?', 'Thật à? Bạn chỉ tôi cách sửa được không?'),
      L('Phuc', 'Sure. Just select the whole column, and the total will update.', 'Được. Chỉ cần chọn cả cột, tổng sẽ tự cập nhật.'),
      L('Hoa', 'Thank you so much. I owe you a coffee!', 'Cảm ơn bạn rất nhiều. Tôi nợ bạn một ly cà phê!'),
      L('Phuc', 'Deal! Let\'s grab one after the meeting.', 'Thoả thuận! Sau cuộc họp mình đi uống nhé.'),
    ],
    quiz: [
      Q('Could you ____ me with the spreadsheet?', ['help', 'helping', 'helped', 'helps'], 0, '"could you help me" là nhờ ai giúp.'),
      Q('Would you ____ checking the formulas?', ['mind', 'minded', 'minding', 'minds'], 0, '"Would you mind + V-ing" là nhờ lịch sự.'),
      Q('Happy to ____.', ['help', 'helps', 'helped', 'helping'], 0, '"Happy to help" là sẵn lòng giúp.'),
    ],
  },
  {
    id: 'd-travel-hotel', title: 'Nhận phòng khách sạn', setting: 'hotel', category: 'travel', difficulty: 'EASY', minutes: 3,
    keyPhrases: ['check in', 'key card', 'breakfast', 'the room number'],
    lines: [
      L('Receptionist', 'Good afternoon! Welcome to the Grand Hotel. Are you checking in?', 'Chiều tốt lành! Chào mừng đến khách sạn Grand. Bạn nhận phòng ạ?'),
      L('Guest', 'Yes, I have a reservation under Smith for two nights.', 'Vâng, tôi có đặt phòng dưới tên Smith, hai đêm.'),
      L('Receptionist', 'Let me find it. Yes, here you are. Your room is 605 on the sixth floor.', 'Để tôi tìm. Vâng, đây rồi. Phòng của bạn là 605, tầng sáu.'),
      L('Guest', 'Great. Is breakfast included in the price?', 'Tuyệt. Giá phòng đã gồm bữa sáng chưa?'),
      L('Receptionist', 'Yes, breakfast is served from seven to ten in the restaurant on the first floor.', 'Có ạ, bữa sáng phục vụ từ bảy đến mười giờ ở nhà hàng tầng một.'),
      L('Guest', 'Perfect. Could you give me the wifi password, too?', 'Hoàn hảo. Bạn cho tôi mật khẩu wifi luôn được không?'),
      L('Receptionist', 'Of course. It\'s written on the card in your key envelope.', 'Dĩ nhiên. Nó được ghi trên thẻ trong phong bì chìa khoá của bạn.'),
      L('Guest', 'Thank you. Have a lovely evening!', 'Cảm ơn. Chúc bạn một buổi tối vui vẻ!'),
    ],
    quiz: [
      Q('I have a ____ under Smith for two nights.', ['reservation', 'reserve', 'reserved', 'reserving'], 0, '"have a reservation" là có đặt phòng.'),
      Q('Your room is 605 on the sixth ____.', ['floor', 'flour', 'floors', 'flow'], 0, '"floor" là tầng.'),
      Q('Breakfast is ____ from seven to ten.', ['served', 'serve', 'serving', 'serves'], 0, 'Câu bị động: is served.'),
    ],
  },
  {
    id: 'd-travel-directions', title: 'Hỏi đường đến ga tàu', setting: 'station', category: 'travel', difficulty: 'EASY', minutes: 3,
    keyPhrases: ['excuse me', 'how do I get to', 'turn right', 'it\'s on your left'],
    lines: [
      L('Tourist', 'Excuse me, how do I get to the central station?', 'Xin lỗi, đi đến ga trung tâm thế nào ạ?'),
      L('Local', 'Go straight ahead for about two hundred meters.', 'Đi thẳng khoảng hai trăm mét.'),
      L('Tourist', 'Okay. Then what?', 'Được. Rồi sao nữa ạ?'),
      L('Local', 'Turn right at the bank. The station is on your left, next to the park.', 'Rẽ phải ở ngân hàng. Ga ở bên trái, cạnh công viên.'),
      L('Tourist', 'Is it far from here? I have a train to catch in twenty minutes.', 'Có xa không? Tôi phải bắt tàu sau hai mươi phút nữa.'),
      L('Local', 'It\'s about a five-minute walk. You\'ll make it if you hurry.', 'Đi bộ khoảng năm phút. Bạn kịp nếu đi nhanh.'),
      L('Tourist', 'Thank you so much. You\'ve been very helpful!', 'Cảm ơn bạn rất nhiều. Bạn giúp ích quá!'),
      L('Local', 'You\'re welcome. Have a safe trip!', 'Không có gì. Chúc bạn đi đường an toàn!'),
    ],
    quiz: [
      Q('Excuse me, how do I ____ to the central station?', ['get', 'go', 'getting', 'gets'], 0, '"how do I get to" là hỏi cách đi đến.'),
      Q('Turn ____ at the bank.', ['right', 'rights', 'righted', 'rightly'], 0, '"turn right" là rẽ phải.'),
      Q('You\'ll make it if you ____.', ['hurry', 'hurried', 'hurrying', 'hurries'], 0, '"make it" là kịp (trong câu điều kiện loại 1).'),
    ],
  },
  {
    id: 'd-health-pharmacy', title: 'Mua thuốc cảm', setting: 'clinic', category: 'health', difficulty: 'EASY', minutes: 3,
    keyPhrases: ['a cold', 'take', 'twice a day', 'side effects'],
    lines: [
      L('Customer', 'Hi, I have a cold and a bit of a fever. What do you recommend?', 'Chào, tôi bị cảm và hơi sốt. Bạn gợi ý thuốc nào?'),
      L('Pharmacist', 'I\'d suggest this cold medicine. Take one tablet twice a day, after meals.', 'Tôi gợi ý thuốc cảm này. Uống một viên hai lần một ngày, sau bữa ăn.'),
      L('Customer', 'Are there any side effects? I drive to work every day.', 'Có tác dụng phụ không? Ngày nào tôi cũng lái xe đi làm.'),
      L('Pharmacist', 'It can make you a little sleepy, so be careful when you drive.', 'Có thể khiến bạn hơi buồn ngủ, nên cẩn thận khi lái xe.'),
      L('Customer', 'I see. Can I take it with my other medicine for my headache?', 'Tôi hiểu rồi. Tôi uống cùng thuốc đau đầu đang dùng được không?'),
      L('Pharmacist', 'Please check with your doctor first, to be safe.', 'Bạn nên hỏi bác sĩ trước để chắc chắn.'),
      L('Customer', 'Okay, I\'ll take just this one for now. Thanks a lot!', 'Được, bây giờ tôi chỉ lấy thuốc này. Cảm ơn nhiều!'),
      L('Pharmacist', 'Get some rest and drink plenty of water. Feel better soon!', 'Nghỉ ngơi và uống nhiều nước nhé. Mau khoẻ lại!'),
    ],
    quiz: [
      Q('Take one tablet ____ a day, after meals.', ['twice', 'two', 'second', 'double'], 0, '"twice a day" là hai lần một ngày.'),
      Q('It can make you a little ____.', ['sleepy', 'sleep', 'sleeping', 'sleeps'], 0, '"sleepy" là buồn ngủ (tính từ).'),
      Q('Are there any ____ effects?', ['side', 'sides', 'sided', 'siding'], 0, '"side effects" là tác dụng phụ.'),
    ],
  },
  {
    id: 'd-health-doctor', title: 'Khám bệnh đau bụng', setting: 'clinic', category: 'health', difficulty: 'MEDIUM', minutes: 5,
    keyPhrases: ['stomach ache', 'since', 'nausea', 'follow up'],
    lines: [
      L('Doctor', 'Hello, what seems to be the problem today?', 'Chào bạn, hôm nay bạn gặp vấn đề gì?'),
      L('Patient', 'I have a stomach ache, and I\'ve been feeling sick since yesterday.', 'Tôi bị đau bụng, và từ hôm qua tôi cảm thấy khó chịu.'),
      L('Doctor', 'Have you had any nausea or vomiting? Any fever?', 'Bạn có buồn nôn hay nôn không? Có sốt không?'),
      L('Patient', 'A bit of nausea, but no vomiting. No fever, I think.', 'Hơi buồn nôn, nhưng không nôn. Tôi nghĩ là không sốt.'),
      L('Doctor', 'Did you eat anything unusual or spicy yesterday?', 'Hôm qua bạn có ăn gì lạ hay cay không?'),
      L('Patient', 'Yes, I ate some street food for dinner. It was very spicy.', 'Có, tối qua tôi ăn đồ ăn đường phố. Rất cay.'),
      L('Doctor', 'That may be the cause. I\'ll prescribe some medicine, and please drink plenty of water.', 'Có thể là nguyên nhân. Tôi sẽ kê thuốc, và bạn nhớ uống nhiều nước.'),
      L('Patient', 'Thank you, doctor. When should I come back if it doesn\'t get better?', 'Cảm ơn bác sĩ. Nếu không đỡ hơn thì khi nào tôi nên quay lại?'),
    ],
    quiz: [
      Q('I\'ve been feeling sick ____ yesterday.', ['since', 'for', 'during', 'from'], 0, '"since yesterday" là từ hôm qua (mốc thời gian).'),
      Q('Have you had any ____ or vomiting?', ['nausea', 'nauseous', 'nauseate', 'nausea\'s'], 0, '"nausea" là buồn nôn (danh từ).'),
      Q('I\'ll ____ some medicine.', ['prescribe', 'describe', 'subscribe', 'prescription'], 0, '"prescribe" là kê đơn (động từ).'),
    ],
  },
  {
    id: 'd-services-bank', title: 'Đổi tiền ở ngân hàng', setting: 'bank', category: 'services', difficulty: 'MEDIUM', minutes: 4,
    keyPhrases: ['exchange', 'exchange rate', 'ID', 'fee'],
    lines: [
      L('Customer', 'Hi, I\'d like to exchange some US dollars into dong, please.', 'Chào, tôi muốn đổi một ít đô la Mỹ sang tiền đồng.'),
      L('Teller', 'Sure. How much would you like to exchange?', 'Được ạ. Bạn muốn đổi bao nhiêu?'),
      L('Customer', 'Two hundred dollars. What is the exchange rate today?', 'Hai trăm đô la. Tỷ giá hôm nay là bao nhiêu?'),
      L('Teller', 'It\'s about twenty-five thousand dong per dollar. Do you have your ID?', 'Khoảng hai mươi lăm nghìn đồng một đô. Bạn có giấy tờ tuỳ thân không?'),
      L('Customer', 'Yes, here is my passport. Is there any fee?', 'Có, đây là hộ chiếu của tôi. Có phí không?'),
      L('Teller', 'No fee for this amount. Please sign here, and I\'ll count the money for you.', 'Số tiền này không mất phí. Bạn ký vào đây, và tôi sẽ đếm tiền cho bạn.'),
      L('Customer', 'Thank you. Can I have some small notes, please?', 'Cảm ơn. Cho tôi xin một ít tiền mệnh giá nhỏ được không?'),
      L('Teller', 'Of course. Here you go. Have a nice day!', 'Được chứ. Đây ạ. Chúc bạn một ngày tốt lành!'),
    ],
    quiz: [
      Q('I\'d like to ____ some dollars into dong.', ['exchange', 'change', 'exchanged', 'exchanges'], 0, '"exchange" là đổi (tiền, hàng).'),
      Q('What is the exchange ____ today?', ['rate', 'rates', 'rated', 'rating'], 0, '"exchange rate" là tỷ giá.'),
      Q('Is there any ____?', ['fee', 'feed', 'fees', 'free'], 0, '"fee" là phí (danh từ).'),
    ],
  },
];
