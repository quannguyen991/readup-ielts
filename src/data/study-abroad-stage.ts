import type { Bi } from '@/i18n/useL';
import type { TravelNpcPersona } from '@/services/travel/conversation';

/** Ngoại hình pixel của nhân vật (màu da, tóc, áo, điểm nhấn). */
export type NpcLook = { skin: string; hair: string; coat: string; accent: string };

/** Một lượt trong nhiệm vụ: NPC nói (`say`), bạn làm một HÀNH ĐỘNG, NPC đáp (`reaction`). Lượt đầu là câu trắc nghiệm gốc của nhiệm vụ. */
type BeatBase = {
  /** Địa điểm của lượt này; bỏ trống = ở nguyên chỗ. Khác chỗ thì nhân vật đi bộ tới (có thể sang phố khác). */
  spot?: string;
  /** Người khác đứng ở địa điểm mới. */
  who?: { name: string; persona: TravelNpcPersona };
  say: Bi;
  prompt: Bi;
  hint: Bi;
  reaction: Bi;
};

export type BeatKind = 'choice' | 'listen' | 'give' | 'arrange' | 'type' | 'speak';

export type Beat = BeatBase &
  (
    | { kind: 'choice' | 'listen'; options: readonly string[]; answer: number }
    | { kind: 'give'; items: readonly { icon: string; label: Bi }[]; answer: number | readonly number[] }
    | { kind: 'arrange'; target: string; extra?: readonly string[] }
    | { kind: 'type'; before: string; after: string; answers: readonly string[] }
    | { kind: 'speak'; target: string }
  );

export type StageSpec = {
  /** Nơi NPC chính đứng (mã trong SPOTS). */
  spot: string;
  persona: TravelNpcPersona;
  look: NpcLook;
  /** NPC nói sau khi bạn trả lời ĐÚNG câu mở đầu. */
  reaction: Bi;
  /** Hai câu gợi ý để hỏi thêm NPC. */
  starters: readonly [Bi, Bi];
  /** Các lượt tiếp theo (mỗi lượt một kiểu hành động). */
  beats: readonly Beat[];
};

/** Hình nhân vật trên bản đồ Du ngoạn theo vai (sprite có sẵn trong atlas). */
export const PERSONA_SPRITE: Record<TravelNpcPersona, string> = {
  staff: 'npc_staff',
  local: 'npc_local',
  traveller: 'npc_tourist',
  vendor: 'npc_vendor',
  student: 'npc_kid',
  elder: 'npc_elder',
  guide: 'npc_business',
};

/** Lời NPC khi bạn trả lời chưa phù hợp. */
export const STAGE_MISUNDERSTOOD: Bi = {
  en: "Hmm, I'm not sure I follow. Could you say it a different way?",
  vi: 'Hmm, mình chưa hiểu lắm. Bạn nói cách khác được không?',
};

const B = (en: string, vi: string): Bi => ({ en, vi });
/** Lời nhắc/gợi ý viết theo thứ tự (tiếng Việt, tiếng Anh). */
const P = (vi: string, en: string): Bi => ({ vi, en });
const look = (skin: string, hair: string, coat: string, accent = '#F3F0FB'): NpcLook => ({ skin, hair, coat, accent });

const RAVI = { name: 'Ravi', persona: 'guide' as TravelNpcPersona };
const WEI = { name: 'Wei', persona: 'student' as TravelNpcPersona };
const MARIE = { name: 'Marie', persona: 'staff' as TravelNpcPersona };
const EMMA = { name: 'Emma', persona: 'traveller' as TravelNpcPersona };
const DINA = { name: 'Dina', persona: 'vendor' as TravelNpcPersona };

const give = (icon: string, en: string, vi: string) => ({ icon, label: B(en, vi) });

export const STAGE_SPECS: Record<string, StageSpec> = {
  // ===================== Singapore =====================
  arrival: {
    spot: 'singapore-changi', persona: 'staff', look: look('#C98E64', '#2B2350', '#1F5F8B'),
    reaction: B('Wonderful — enjoy your semester! Please follow the signs to the taxi stand.', 'Tuyệt quá — chúc bạn một học kỳ vui! Hãy đi theo biển chỉ dẫn tới chỗ bắt taxi.'),
    starters: [B('Where can I get a taxi to the campus?', 'Tôi bắt taxi về trường ở đâu?'), B('Is it easy to buy a local SIM card here?', 'Mua SIM địa phương ở đây có dễ không?')],
    beats: [
      { kind: 'give', say: B('May I see your passport and your arrival card, please?', 'Cho tôi xem hộ chiếu và thẻ nhập cảnh nhé?'), prompt: P('Chọn đúng giấy tờ để đưa cho nhân viên.', 'Pick the right document to hand over.'), hint: P('Nhập cảnh cần giấy tờ tuỳ thân quốc tế.', 'Entering a country needs international ID.'), items: [give('🛂', 'Passport', 'Hộ chiếu'), give('🎟️', 'Cinema ticket', 'Vé xem phim'), give('🍜', 'Noodle voucher', 'Phiếu ăn mì'), give('🔑', 'Hotel key', 'Chìa khoá khách sạn')], answer: 0, reaction: B('Thank you. Everything is in order. Welcome to Singapore!', 'Cảm ơn bạn. Mọi thứ đều ổn. Chào mừng đến Singapore!') },
      { kind: 'arrange', spot: 'singapore-merlion', who: RAVI, say: B('Welcome to the Merlion! How long will you stay in Singapore?', 'Chào mừng tới tượng Merlion! Bạn sẽ ở Singapore bao lâu?'), prompt: P('Sắp xếp các từ: “Tôi sẽ ở lại một học kỳ.”', 'Put the words in order: “I will stay for one semester.”'), hint: P('Chủ ngữ + will + động từ…', 'Subject + will + verb…'), target: 'I will stay for one semester', extra: ['yesterday', 'fish'], reaction: B('Wonderful! One semester is a great time to explore the city.', 'Tuyệt! Một học kỳ là khoảng thời gian tuyệt vời để khám phá thành phố.') },
    ],
  },
  'campus-id': {
    spot: 'singapore-hotel', persona: 'staff', look: look('#E9B98A', '#2B2350', '#5B4B8A'),
    reaction: B('Thank you. Everything looks complete — your student card will be ready tomorrow.', 'Cảm ơn bạn. Mọi thứ đều đầy đủ — thẻ sinh viên sẽ sẵn sàng vào ngày mai.'),
    starters: [B('Where do I collect my student card?', 'Tôi nhận thẻ sinh viên ở đâu?'), B('Could you tell me where the library is?', 'Bạn chỉ giúp thư viện ở đâu được không?')],
    beats: [
      { kind: 'listen', say: B('Your student card will be ready on Friday. Please collect it at counter three.', 'Thẻ sinh viên sẽ sẵn sàng vào thứ Sáu. Hãy nhận ở quầy số ba.'), prompt: P('Nghe kỹ (lời thoại đang ẩn): bạn cần làm gì?', 'Listen carefully (the line is hidden): what must you do?'), hint: P('Chú ý ngày và số quầy.', 'Listen for the day and the counter number.'), options: ['Collect the card at counter three on Friday.', 'Collect the card at counter five today.', 'Wait for an email on Monday.', 'Send the card back on Friday.'], answer: 0, reaction: B('That is right. See you on Friday!', 'Đúng rồi. Hẹn gặp bạn vào thứ Sáu!') },
      { kind: 'type', spot: 'singapore-kopitiam', who: WEI, say: B('Hi, I am Wei. Do you know the library rules yet?', 'Chào, mình là Wei. Bạn biết quy định thư viện chưa?'), prompt: P('Điền từ còn thiếu để hỏi xin phép mượn sách.', 'Fill the gap to ask permission to borrow books.'), hint: P('Một động từ khiếm khuyết xin phép: can / could / may.', 'A modal verb for permission: can / could / may.'), before: '', after: ' I borrow books with this card?', answers: ['can', 'could', 'may'], reaction: B('Yes, you can borrow up to six books.', 'Được, bạn mượn tối đa sáu cuốn.') },
    ],
  },
  'food-order': {
    spot: 'singapore-hawker', persona: 'vendor', look: look('#D9A074', '#2B2350', '#6A4BD9', '#FFE8B0'),
    reaction: B('Coming right up — one lime juice, less sugar!', 'Có ngay — một nước chanh, ít đường!'),
    starters: [B('What do you recommend besides chicken rice?', 'Ngoài cơm gà bạn gợi ý món nào?'), B('Is the food here very spicy?', 'Đồ ăn ở đây có cay lắm không?')],
    beats: [
      { kind: 'give', say: B('Sorry, we only take cash or QR code. How would you like to pay?', 'Xin lỗi, bên mình chỉ nhận tiền mặt hoặc mã QR. Bạn trả thế nào?'), prompt: P('Chọn cách thanh toán phù hợp (có hai đáp án đúng).', 'Choose a payment that works (two are correct).'), hint: P('Quầy nhận tiền mặt hoặc QR.', 'The stall takes cash or QR.'), items: [give('💳', 'Credit card', 'Thẻ tín dụng'), give('💵', 'Cash', 'Tiền mặt'), give('📱', 'QR code', 'Mã QR'), give('🧾', 'Receipt', 'Hoá đơn')], answer: [1, 2], reaction: B('Perfect, thank you!', 'Tuyệt, cảm ơn bạn!') },
      { kind: 'speak', say: B('Here is your lime juice. Anything else?', 'Nước chanh của bạn đây. Còn gì nữa không?'), prompt: P('Nói to: “No, that is all. Thank you.”', 'Say aloud: “No, that is all. Thank you.”'), hint: P('Bấm micro rồi đọc câu trên (hoặc chọn gõ thay).', 'Tap the mic and read the sentence (or type instead).'), target: 'No, that is all. Thank you.', reaction: B('Enjoy your meal!', 'Chúc bạn ngon miệng!') },
    ],
  },
  'group-project': {
    spot: 'singapore-kopitiam', persona: 'student', look: look('#F0C9A0', '#6A4BD9', '#2F8F6B'),
    reaction: B("Good plan! I'll take the background research, and you take the data.", 'Kế hoạch hay! Mình lo phần nghiên cứu nền, bạn lo phần dữ liệu.'),
    starters: [B('When should we meet again?', 'Khi nào mình họp lại nhỉ?'), B('Which tool should we use for the slides?', 'Mình dùng công cụ nào làm slide?')],
    beats: [
      { kind: 'arrange', say: B('When should we meet again?', 'Khi nào chúng ta gặp lại nhỉ?'), prompt: P('Sắp xếp: “Chúng ta gặp lại vào thứ Năm nhé.”', 'Put in order: “Let us meet again on Thursday.”'), hint: P('Bắt đầu bằng “Let us…”.', 'Start with “Let us…”.'), target: 'Let us meet again on Thursday', extra: ['yesterday'], reaction: B('Thursday works for me. I will book a room.', 'Thứ Năm ổn với mình. Mình sẽ đặt phòng.') },
      { kind: 'listen', spot: 'singapore-merlion', say: B('I will do the introduction and Mei will do the conclusion, so the middle part is yours.', 'Mình làm phần mở đầu, Mei làm phần kết, nên phần giữa là của bạn.'), prompt: P('Nghe kỹ: bạn nhận phần nào?', 'Listen: which part is yours?'), hint: P('Phần không ai nhận.', 'The part nobody else has.'), options: ['The middle part.', 'The introduction.', 'The conclusion.', 'The title.'], answer: 0, reaction: B('Great. Send me your slides by Wednesday.', 'Tuyệt. Gửi slide cho mình trước thứ Tư nhé.') },
    ],
  },
  // ===================== London =====================
  'library-help': {
    spot: 'london-museum', persona: 'staff', look: look('#B9774F', '#201512', '#7A2E4A'),
    reaction: B('Of course — the fourth floor is the quietest. There are free desks by the window.', 'Tất nhiên rồi — tầng bốn yên tĩnh nhất. Có bàn trống cạnh cửa sổ.'),
    starters: [B('Can I borrow books with my student card?', 'Tôi mượn sách bằng thẻ sinh viên được không?'), B('How late can I stay here in the evening?', 'Buổi tối tôi ở lại tới mấy giờ được?')],
    beats: [
      { kind: 'give', say: B('May I see your student card to register you?', 'Cho mình xem thẻ sinh viên để đăng ký nhé?'), prompt: P('Chọn đúng thứ để đưa cho thủ thư.', 'Pick the right thing to hand over.'), hint: P('Đăng ký thư viện cần thẻ sinh viên.', 'Library registration needs a student card.'), items: [give('🪪', 'Student card', 'Thẻ sinh viên'), give('🎟️', 'Train ticket', 'Vé tàu'), give('📕', 'Notebook', 'Vở ghi'), give('🧾', 'Receipt', 'Hoá đơn')], answer: 0, reaction: B('Thank you. You are registered.', 'Cảm ơn bạn. Bạn đã được đăng ký.') },
      { kind: 'type', say: B('Books can be borrowed for two weeks.', 'Sách được mượn trong hai tuần.'), prompt: P('Điền từ để hỏi số sách được mượn một lần.', 'Fill the gap to ask how many books you can borrow.'), hint: P('can / may / could.', 'can / may / could.'), before: 'How many books ', after: ' I borrow at one time?', answers: ['can', 'may', 'could'], reaction: B('Up to six books at a time.', 'Tối đa sáu cuốn một lần.') },
    ],
  },
  'seminar-clarify': {
    spot: 'london-stpauls', persona: 'guide', look: look('#EBC19C', '#8A8A8A', '#3B4252', '#8B6CF0'),
    reaction: B('Good question. Yes, please judge how reliable each source is, as well as what it claims.', 'Câu hỏi hay. Đúng vậy, hãy đánh giá độ tin cậy của từng nguồn, không chỉ nội dung nó nêu.'),
    starters: [B('Could you give an example of reliable evidence?', 'Thầy cho ví dụ về bằng chứng đáng tin được không?'), B('How long should my answer be?', 'Bài trả lời nên dài bao nhiêu ạ?')],
    beats: [
      { kind: 'arrange', say: B('What is your view on the first study?', 'Em nghĩ gì về nghiên cứu đầu tiên?'), prompt: P('Sắp xếp: “Em nghĩ mẫu nghiên cứu quá nhỏ.”', 'Put in order: “I think the sample is too small.”'), hint: P('Nêu ý kiến bằng “I think…”.', 'Give an opinion with “I think…”.'), target: 'I think the sample is too small', extra: ['bigger', 'yesterday'], reaction: B('A fair point. Small samples limit what we can claim.', 'Ý hợp lý. Mẫu nhỏ làm hạn chế điều ta có thể kết luận.') },
      { kind: 'speak', spot: 'london-bigben', say: B('Could you summarise the second study for us?', 'Em tóm tắt nghiên cứu thứ hai giúp cả lớp được không?'), prompt: P('Nói to: “The second study found a clear link.”', 'Say aloud: “The second study found a clear link.”'), hint: P('Bấm micro rồi đọc, hoặc gõ thay.', 'Tap the mic and read it, or type instead.'), target: 'The second study found a clear link', reaction: B('Excellent summary.', 'Tóm tắt rất tốt.') },
    ],
  },
  'housing-repair': {
    spot: 'london-inn', persona: 'staff', look: look('#E2AE82', '#2B2350', '#4C6B3A'),
    reaction: B("Thanks for letting me know. I'll send someone this afternoon.", 'Cảm ơn bạn đã báo. Chiều nay mình sẽ cử người tới.'),
    starters: [B('Is it safe to use the bathroom until then?', 'Trong lúc chờ dùng phòng tắm có an toàn không?'), B('Who should I contact if it happens at night?', 'Nếu xảy ra ban đêm tôi liên hệ ai?')],
    beats: [
      { kind: 'listen', say: B('A plumber will come tomorrow at ten. Please be in your room.', 'Thợ sửa ống nước sẽ đến vào 10 giờ ngày mai. Bạn nhớ có mặt trong phòng.'), prompt: P('Nghe kỹ (lời thoại đang ẩn): bạn cần làm gì?', 'Listen (the line is hidden): what must you do?'), hint: P('Giờ nào, ở đâu?', 'What time, and where?'), options: ['Be in the room at ten tomorrow.', 'Meet the plumber at the library.', 'Call Sam at ten tonight.', 'Leave the key at the desk.'], answer: 0, reaction: B('Exactly. Thank you for your patience.', 'Chính xác. Cảm ơn bạn đã kiên nhẫn.') },
      { kind: 'give', spot: 'london-tearoom', say: B('Until then, what could you put under the tap?', 'Trong lúc chờ, bạn có thể đặt gì dưới vòi nước?'), prompt: P('Chọn vật hợp lý để hứng nước nhỏ giọt.', 'Choose something sensible to catch the drips.'), hint: P('Vật đựng được nước.', 'Something that holds water.'), items: [give('🪣', 'Bucket', 'Cái xô'), give('💻', 'Laptop', 'Máy tính xách tay'), give('🍕', 'Pizza', 'Bánh pizza'), give('👟', 'Shoes', 'Giày')], answer: 0, reaction: B('Good thinking. That will catch the drips.', 'Nghĩ hay đấy. Cái đó sẽ hứng được nước nhỏ giọt.') },
    ],
  },
  'market-stall': {
    spot: 'london-borough', persona: 'vendor', look: look('#E4B38A', '#2B2350', '#3E6E3A', '#F3F0FB'),
    reaction: B('Half a kilo of apples, coming up!', 'Nửa ký táo, có ngay!'),
    starters: [B('Which apples are the sweetest?', 'Loại táo nào ngọt nhất?'), B('Do you have any local honey?', 'Bạn có mật ong địa phương không?')],
    beats: [
      { kind: 'arrange', say: B('That is three pounds fifty a kilo.', 'Giá ba bảng rưỡi một ký.'), prompt: P('Sắp xếp: “Tổng cộng hết bao nhiêu ạ?”', 'Put in order: “How much is it altogether?”'), hint: P('Bắt đầu bằng “How much…”.', 'Start with “How much…”.'), target: 'How much is it altogether', extra: ['yesterday'], reaction: B('Half a kilo is one pound seventy-five.', 'Nửa ký là một bảng bảy mươi lăm.') },
      { kind: 'give', say: B('That is one pound seventy-five. What will you hand over?', 'Một bảng bảy mươi lăm. Bạn đưa gì cho mình?'), prompt: P('Chọn thứ để trả tiền.', 'Choose what to pay with.'), hint: P('Cần đủ tiền, không phải thứ khác.', 'It must cover the price.'), items: [give('🪙', 'A £1 coin', 'Một đồng xu £1'), give('💷', 'A £5 note', 'Tờ £5'), give('🍎', 'An apple', 'Một quả táo'), give('🎫', 'A bus ticket', 'Vé xe buýt')], answer: 1, reaction: B('Thank you! Here is your change.', 'Cảm ơn bạn! Tiền thừa của bạn đây.') },
    ],
  },
  // ===================== Paris =====================
  'paris-metro': {
    spot: 'paris-station', persona: 'staff', look: look('#E9B98A', '#2B2350', '#1F6B4F', '#F2C94C'),
    reaction: B('Of course. A single ticket to the Louvre — one moment, please.', 'Dĩ nhiên. Một vé lượt tới Louvre — xin chờ một chút.'),
    starters: [B('How often do the trains run?', 'Tàu chạy bao lâu một chuyến?'), B('Is there a day pass for tourists?', 'Có vé ngày cho khách du lịch không?')],
    beats: [
      { kind: 'listen', say: B('Take line one towards La Defense, and get off at Palais Royal.', 'Đi tuyến một hướng La Défense và xuống ở ga Palais Royal.'), prompt: P('Nghe kỹ: bạn xuống ở ga nào?', 'Listen: which station do you get off at?'), hint: P('Nghe tên ga cuối câu.', 'Listen for the station at the end.'), options: ['Palais Royal', 'La Defense', 'Chatelet', 'Eiffel Tower'], answer: 0, reaction: B('Perfect. Have a pleasant journey!', 'Chuẩn rồi. Chúc bạn đi vui vẻ!') },
      { kind: 'arrange', spot: 'paris-louvre', who: MARIE, say: B('Welcome to the Louvre. Can I help you?', 'Chào mừng đến Louvre. Tôi giúp gì được bạn?'), prompt: P('Sắp xếp: “Lối ra nào dẫn tới bảo tàng?”', 'Put in order: “Which exit leads to the museum?”'), hint: P('Bắt đầu bằng “Which…”.', 'Start with “Which…”.'), target: 'Which exit leads to the museum', extra: ['tomorrow'], reaction: B('Follow the signs for the pyramid.', 'Hãy đi theo biển chỉ tới kim tự tháp.') },
    ],
  },
  'paris-cafe': {
    spot: 'paris-cafe', persona: 'staff', look: look('#D9A074', '#2B2350', '#2F3A4F', '#FFFFFF'),
    reaction: B('Very good. One café au lait and one croissant.', 'Rất tốt. Một cà phê sữa và một bánh sừng bò.'),
    starters: [B('What do you recommend for breakfast?', 'Bạn gợi ý món nào cho bữa sáng?'), B('Is the terrace open all day?', 'Khu ngoài trời mở cả ngày không?')],
    beats: [
      { kind: 'type', say: B('Of course. Would you like anything else?', 'Dĩ nhiên rồi. Bạn cần gì nữa không?'), prompt: P('Điền từ để xin hoá đơn.', 'Fill the gap to ask for the bill.'), hint: P('Hoá đơn trong nhà hàng: bill / check.', 'The restaurant word: bill / check.'), before: 'Excuse me, could I have the ', after: ', please?', answers: ['bill', 'check', 'receipt'], reaction: B('Certainly, one moment.', 'Chắc chắn rồi, xin chờ một lát.') },
      { kind: 'speak', spot: 'paris-bouquiniste', who: EMMA, say: B('Excuse me, could you take a photo of us?', 'Xin lỗi, bạn chụp giúp chúng tôi một tấm ảnh được không?'), prompt: P('Nói to: “Of course. Smile, everyone!”', 'Say aloud: “Of course. Smile, everyone!”'), hint: P('Bấm micro rồi đọc, hoặc gõ thay.', 'Tap the mic and read it, or type instead.'), target: 'Of course. Smile, everyone!', reaction: B('Thank you so much! It is beautiful here.', 'Cảm ơn bạn nhiều! Ở đây đẹp quá.') },
    ],
  },
  'paris-louvre': {
    spot: 'paris-louvre', persona: 'staff', look: look('#F0C9A0', '#2B2350', '#7C1D3A'),
    reaction: B('A student? Wonderful. We do have a discount.', 'Sinh viên à? Tuyệt. Bên mình có giá ưu đãi.'),
    starters: [B('Where can I leave my bag?', 'Tôi gửi túi ở đâu?'), B('Which gallery should I see first?', 'Tôi nên xem phòng tranh nào trước?')],
    beats: [
      { kind: 'give', say: B('Please show your student ID for the discount.', 'Vui lòng xuất trình thẻ sinh viên để được giảm giá.'), prompt: P('Chọn thứ cần đưa cho nhân viên.', 'Pick what to show the officer.'), hint: P('Giảm giá sinh viên cần chứng minh bạn là sinh viên.', 'A student discount needs proof you are a student.'), items: [give('🪪', 'Student ID', 'Thẻ sinh viên'), give('🛂', 'Passport', 'Hộ chiếu'), give('📱', 'Phone', 'Điện thoại'), give('🍫', 'Chocolate', 'Sô cô la')], answer: 0, reaction: B('Thank you. The student price is ten euros.', 'Cảm ơn bạn. Giá sinh viên là mười euro.') },
      { kind: 'listen', say: B('The museum is open until six, and the audio guide is free for students.', 'Bảo tàng mở đến sáu giờ, và máy hướng dẫn âm thanh miễn phí cho sinh viên.'), prompt: P('Nghe kỹ: thông tin nào đúng?', 'Listen: which information is correct?'), hint: P('Giờ đóng cửa và giá máy hướng dẫn.', 'The closing time and the audio-guide price.'), options: ['Open until six; the audio guide is free for students.', 'Open until nine; the audio guide costs ten euros.', 'Closed today; the guide is free.', 'Open until noon; there is no audio guide.'], answer: 0, reaction: B('Enjoy the museum!', 'Chúc bạn tham quan vui vẻ!') },
    ],
  },
  'paris-directions': {
    spot: 'paris-carousel', persona: 'local', look: look('#E2AE82', '#2B2350', '#5B4B8A'),
    reaction: B('Of course! The tower is not far from here.', 'Dĩ nhiên rồi! Tháp không xa chỗ này đâu.'),
    starters: [B('Is it better to walk or take the metro?', 'Đi bộ hay đi metro thì tốt hơn?'), B('Where can I find a good bookshop?', 'Tôi tìm hiệu sách hay ở đâu?')],
    beats: [
      { kind: 'listen', say: B('Walk straight along the avenue, then turn left at the fountain.', 'Đi thẳng theo đại lộ, rồi rẽ trái ở đài phun nước.'), prompt: P('Nghe kỹ: đường đi thế nào?', 'Listen: how do you get there?'), hint: P('Nghe hướng đi và mốc.', 'Listen for the direction and the landmark.'), options: ['Straight, then left at the fountain.', 'Right at the bridge, then straight.', 'Left at the café, then right.', 'Take the metro to the tower.'], answer: 0, reaction: B('You have it. It takes about fifteen minutes.', 'Bạn nắm rồi đấy. Mất khoảng mười lăm phút.') },
      { kind: 'arrange', spot: 'paris-bouquiniste', say: B('Is there anything else I can help you with?', 'Bạn cần mình giúp gì nữa không?'), prompt: P('Sắp xếp: “Cảm ơn bạn rất nhiều, bạn đã giúp rất nhiều.”', 'Put in order: “Thank you so much, you have been very helpful.”'), hint: P('Lời cảm ơn kèm nhận xét.', 'A thanks plus a comment.'), target: 'Thank you so much, you have been very helpful', extra: ['tomorrow'], reaction: B('My pleasure! Enjoy Paris.', 'Rất vui được giúp! Chúc bạn vui ở Paris.') },
    ],
  },
  // ===================== Tokyo =====================
  'tokyo-ticket': {
    spot: 'tokyo-shinjuku', persona: 'staff', look: look('#F0C9A0', '#2B2350', '#1E4D8C'),
    reaction: B('No problem. Let me show you how to use the machine.', 'Không sao. Để mình chỉ bạn cách dùng máy.'),
    starters: [B('Which platform do I need?', 'Tôi cần ra sân ga nào?'), B('Can I use this card on the bus too?', 'Thẻ này đi xe buýt được không?')],
    beats: [
      { kind: 'give', say: B('Please insert your money into the machine.', 'Hãy bỏ tiền vào máy nhé.'), prompt: P('Chọn thứ để trả tiền vé.', 'Choose what to pay for the ticket with.'), hint: P('Máy nhận tiền giấy hoặc xu hợp lệ.', 'The machine takes real money.'), items: [give('💴', 'A 1,000 yen note', 'Tờ 1.000 yên'), give('🔘', 'A button', 'Một cái cúc áo'), give('🍙', 'A rice ball', 'Nắm cơm'), give('🔑', 'A key', 'Chìa khoá')], answer: 0, reaction: B('Good. The ticket is coming out.', 'Tốt. Vé đang ra.') },
      { kind: 'type', say: B('The train for Shibuya leaves from platform two.', 'Tàu đi Shibuya khởi hành từ sân ga số hai.'), prompt: P('Điền số sân ga mà nhân viên vừa nói.', 'Fill in the platform number she just said.'), hint: P('Một số từ một đến chín (chữ hoặc số).', 'A number from one to nine (word or digit).'), before: 'The train for Shibuya leaves from platform ', after: '.', answers: ['two', '2'], reaction: B('That is right. Have a safe trip!', 'Đúng rồi. Chúc bạn thượng lộ bình an!') },
    ],
  },
  'tokyo-stall': {
    spot: 'tokyo-tsukiji', persona: 'vendor', look: look('#E2AE82', '#2B2350', '#C8332E', '#FFE8B0'),
    reaction: B('No seaweed — got it! Six takoyaki coming up.', 'Không rong biển — hiểu rồi! Sáu viên takoyaki ra ngay.'),
    starters: [B('Which sauce do you recommend?', 'Bạn gợi ý loại sốt nào?'), B('How long have you run this stall?', 'Bạn bán quầy này lâu chưa?')],
    beats: [
      { kind: 'listen', say: B('That will be six hundred yen. We accept cash only.', 'Tất cả sáu trăm yên. Bên mình chỉ nhận tiền mặt.'), prompt: P('Nghe kỹ: bạn trả bao nhiêu và bằng gì?', 'Listen: how much do you pay, and how?'), hint: P('Nghe số tiền và cách trả.', 'Listen for the amount and the method.'), options: ['600 yen, cash only.', '800 yen, by card.', '600 yen, by card.', '1,000 yen, cash only.'], answer: 0, reaction: B('Thank you! Careful, it is hot.', 'Cảm ơn bạn! Cẩn thận nóng nhé.') },
      { kind: 'speak', say: B('Here you are. Be careful, it is very hot!', 'Của bạn đây. Cẩn thận, rất nóng đấy!'), prompt: P('Nói to: “It smells wonderful. Thank you.”', 'Say aloud: “It smells wonderful. Thank you.”'), hint: P('Bấm micro rồi đọc, hoặc gõ thay.', 'Tap the mic and read it, or type instead.'), target: 'It smells wonderful. Thank you.', reaction: B('Enjoy!', 'Chúc bạn ngon miệng!') },
    ],
  },
  'tokyo-shrine': {
    spot: 'tokyo-sensoji', persona: 'elder', look: look('#E9B98A', '#9A9A9A', '#3B4A3E', '#F2D9A6'),
    reaction: B('You are welcome. Now, let us continue.', 'Không có gì. Nào, chúng ta tiếp tục nhé.'),
    starters: [B('Is it fine to take photos here?', 'Chụp ảnh ở đây được không?'), B('How old is this shrine?', 'Ngôi đền này bao nhiêu tuổi?')],
    beats: [
      { kind: 'arrange', say: B('Wash your hands at the fountain first.', 'Hãy rửa tay ở bồn nước trước.'), prompt: P('Sắp xếp: “Tôi rửa tay ở đâu ạ?”', 'Put in order: “Where can I wash my hands?”'), hint: P('Bắt đầu bằng “Where…”.', 'Start with “Where…”.'), target: 'Where can I wash my hands', extra: ['tomorrow'], reaction: B('The water basin is on your left.', 'Bồn nước ở bên trái bạn.') },
      { kind: 'choice', say: B('Many people make a wish here. Would you like to try?', 'Nhiều người ước nguyện ở đây. Bạn muốn thử không?'), prompt: P('Chọn câu trả lời phù hợp.', 'Choose a fitting reply.'), hint: P('Nhận lời một cách lịch sự.', 'Accept politely.'), options: ['I wished the shrine yesterday.', 'Yes, I would love to make a wish.', 'Wash me a wish, please.', 'No, the wish is a train.'], answer: 1, reaction: B('Close your eyes and think of your wish.', 'Hãy nhắm mắt và nghĩ về điều ước của bạn.') },
    ],
  },
  'tokyo-guide': {
    spot: 'tokyo-shibuya', persona: 'guide', look: look('#F0C9A0', '#2B2350', '#2F8F6B', '#F2C94C'),
    reaction: B('The temple is a lovely choice. It is about fifteen minutes.', 'Ngôi đền là lựa chọn tuyệt. Khoảng mười lăm phút đi bộ.'),
    starters: [B('Is there a quiet café near the temple?', 'Gần ngôi đền có quán cà phê yên tĩnh không?'), B('When is the temple busiest?', 'Đền đông nhất vào lúc nào?')],
    beats: [
      { kind: 'give', say: B('The walk is long and sunny. What should you bring? (Pick one.)', 'Đường đi dài và nắng. Bạn nên mang gì? (Chọn một.)'), prompt: P('Chọn vật hợp lý (có hai đáp án đúng).', 'Choose something sensible (two are correct).'), hint: P('Nắng nóng, đi bộ dài.', 'Hot sun, long walk.'), items: [give('🧴', 'Sunscreen', 'Kem chống nắng'), give('💧', 'Water bottle', 'Chai nước'), give('🧣', 'Winter scarf', 'Khăn quàng mùa đông'), give('⛷️', 'Skis', 'Ván trượt tuyết')], answer: [0, 1], reaction: B('Smart choice. Stay cool and drink water.', 'Lựa chọn thông minh. Giữ mát và nhớ uống nước.') },
      { kind: 'speak', spot: 'tokyo-sensoji', say: B('Have a wonderful visit!', 'Chúc bạn tham quan thật vui!'), prompt: P('Nói to: “Thank you for your help. I really appreciate it.”', 'Say aloud: “Thank you for your help. I really appreciate it.”'), hint: P('Bấm micro rồi đọc, hoặc gõ thay.', 'Tap the mic and read it, or type instead.'), target: 'Thank you for your help. I really appreciate it.', reaction: B('You are very welcome!', 'Bạn đừng khách sáo!') },
    ],
  },
  // ===================== New York =====================
  'nyc-subway': {
    spot: 'newyork-subway', persona: 'staff', look: look('#9A6642', '#2B2350', '#1D4D3C', '#F3F0FB'),
    reaction: B('Good question. Let me check that for you.', 'Câu hỏi hay. Để mình kiểm tra giúp bạn.'),
    starters: [B('How much is a single ride?', 'Một lượt đi giá bao nhiêu?'), B('Is the subway safe at night?', 'Tàu điện ngầm ban đêm có an toàn không?')],
    beats: [
      { kind: 'give', say: B('Swipe your card at the turnstile.', 'Quẹt thẻ ở cổng xoay nhé.'), prompt: P('Chọn thứ để quẹt qua cổng.', 'Pick what to swipe at the gate.'), hint: P('Thẻ đi tàu của thành phố.', 'The city transit card.'), items: [give('💳', 'MetroCard', 'Thẻ MetroCard'), give('🎟️', 'Movie ticket', 'Vé xem phim'), give('🔑', 'Key', 'Chìa khoá'), give('🧾', 'Receipt', 'Hoá đơn')], answer: 0, reaction: B('Green light. You are good to go.', 'Đèn xanh. Bạn đi được rồi.') },
      { kind: 'listen', spot: 'newyork-brooklynpizza', who: DINA, say: B('Take the number four train, and change at Brooklyn Bridge.', 'Đi tàu số bốn và đổi tàu ở Brooklyn Bridge.'), prompt: P('Nghe kỹ: bạn đi thế nào?', 'Listen: how do you get there?'), hint: P('Số tàu và ga đổi.', 'The train number and the change station.'), options: ['Take train four, and change at Brooklyn Bridge.', 'Take train seven, and change at Times Square.', 'Walk to Brooklyn.', 'Take a taxi.'], answer: 0, reaction: B('Exactly. Enjoy Brooklyn!', 'Chính xác. Chúc bạn vui ở Brooklyn!') },
    ],
  },
  'nyc-taxi': {
    spot: 'newyork-timessquare', persona: 'staff', look: look('#D39A72', '#2B2350', '#7C1D3A', '#F2C21B'),
    reaction: B('Sure thing. Hop in!', 'Được thôi. Lên xe nào!'),
    starters: [B('Is there much traffic today?', 'Hôm nay có kẹt xe nhiều không?'), B('Can I pay by card?', 'Tôi trả bằng thẻ được không?')],
    beats: [
      { kind: 'arrange', say: B('Anything else I should know?', 'Còn gì tôi cần biết nữa không?'), prompt: P('Sắp xếp: “Bạn dừng ở cửa chính được không?”', 'Put in order: “Could you stop at the front entrance?”'), hint: P('Nhờ lịch sự bằng “Could you…”.', 'A polite request with “Could you…”.'), target: 'Could you stop at the front entrance', extra: ['sleep', 'tomorrow'], reaction: B('Sure thing. Front entrance.', 'Được thôi. Cửa chính.') },
      { kind: 'speak', say: B('Here we are. That is eleven dollars.', 'Tới nơi rồi. Mười một đô la.'), prompt: P('Nói to: “Keep the change. Thank you very much.”', 'Say aloud: “Keep the change. Thank you very much.”'), hint: P('Bấm micro rồi đọc, hoặc gõ thay.', 'Tap the mic and read it, or type instead.'), target: 'Keep the change. Thank you very much.', reaction: B('Thanks a lot! Have a great day.', 'Cảm ơn nhiều! Chúc bạn một ngày tốt lành.') },
    ],
  },
  'research-poster': {
    spot: 'newyork-metmuseum', persona: 'local', look: look('#9A6642', '#2B2350', '#6A4BD9'),
    reaction: B('Interesting! A small sample is worth mentioning — what would you do next?', 'Thú vị đấy! Mẫu nhỏ là điều đáng nêu — bạn sẽ làm gì tiếp theo?'),
    starters: [B('Would you like to see my data?', 'Bạn có muốn xem dữ liệu của mình không?'), B('How did you choose your topic?', 'Bạn chọn đề tài thế nào?')],
    beats: [
      { kind: 'type', say: B('What method did you use?', 'Bạn dùng phương pháp nào?'), prompt: P('Điền từ: bạn đã dùng cách gì để thu thập dữ liệu.', 'Fill the gap: how did you collect your data?'), hint: P('survey / questionnaire / interview.', 'survey / questionnaire / interview.'), before: 'We used a ', after: ' to collect our data.', answers: ['survey', 'questionnaire', 'interview'], reaction: B('Nice. A survey is a good way to reach many people.', 'Hay đấy. Khảo sát là cách tốt để tiếp cận nhiều người.') },
      { kind: 'speak', say: B('So what is your main finding?', 'Vậy phát hiện chính của bạn là gì?'), prompt: P('Nói to: “Our findings suggest that sleep supports memory.”', 'Say aloud: “Our findings suggest that sleep supports memory.”'), hint: P('Bấm micro rồi đọc, hoặc gõ thay.', 'Tap the mic and read it, or type instead.'), target: 'Our findings suggest that sleep supports memory.', reaction: B('Fascinating. Thank you for sharing.', 'Hấp dẫn thật. Cảm ơn bạn đã chia sẻ.') },
    ],
  },
  'final-interview': {
    spot: 'newyork-centralpark', persona: 'guide', look: look('#D39A72', '#2B2350', '#7C1D3A'),
    reaction: B('That sounds like exactly the spirit we are looking for. Thank you.', 'Nghe đúng tinh thần chúng tôi tìm kiếm. Cảm ơn bạn.'),
    starters: [B('What would you like to know about my plans?', 'Cô muốn biết gì về kế hoạch của em?'), B('How can I prepare for the first week?', 'Em nên chuẩn bị gì cho tuần đầu?')],
    beats: [
      { kind: 'arrange', say: B('Why do you deserve this scholarship?', 'Vì sao em xứng đáng nhận học bổng này?'), prompt: P('Sắp xếp: “Em có động lực học và giúp đỡ người khác.”', 'Put in order: “I am motivated to learn and to help others.”'), hint: P('Bắt đầu bằng “I am motivated…”.', 'Start with “I am motivated…”.'), target: 'I am motivated to learn and to help others', extra: ['tomorrow', 'yesterday'], reaction: B('That is a strong answer.', 'Đó là câu trả lời thuyết phục.') },
      { kind: 'speak', say: B('Thank you for coming today. Do you have any last words?', 'Cảm ơn em đã đến hôm nay. Em có lời cuối nào không?'), prompt: P('Nói to: “Thank you for this opportunity.”', 'Say aloud: “Thank you for this opportunity.”'), hint: P('Bấm micro rồi đọc, hoặc gõ thay.', 'Tap the mic and read it, or type instead.'), target: 'Thank you for this opportunity.', reaction: B('We will be in touch very soon.', 'Chúng tôi sẽ sớm liên lạc với em.') },
    ],
  },
};

// ------------------------------------------------------------------ chấm điểm (thuần, test được)
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const tokens = (s: string): string[] => norm(s).split(' ').filter(Boolean);

/** Câu nói: đúng khi có ≥ 75% từ của câu mẫu xuất hiện theo đúng thứ tự gần đúng. */
export function speakScore(target: string, spoken: string): number {
  const want = tokens(target);
  const got = tokens(spoken);
  if (!want.length) return 0;
  let i = 0;
  let hit = 0;
  for (const w of want) {
    const at = got.indexOf(w, i);
    if (at >= 0) {
      hit += 1;
      i = at + 1;
    }
  }
  return hit / want.length;
}

export type BeatInput = number | readonly number[] | string | readonly string[];

export function checkBeat(beat: Beat, input: BeatInput): boolean {
  switch (beat.kind) {
    case 'choice':
    case 'listen':
      return input === beat.answer;
    case 'give': {
      const ok = Array.isArray(beat.answer) ? (beat.answer as readonly number[]) : [beat.answer as number];
      return typeof input === 'number' && ok.includes(input);
    }
    case 'arrange':
      return Array.isArray(input) && norm((input as readonly string[]).join(' ')) === norm(beat.target);
    case 'type':
      return typeof input === 'string' && beat.answers.map(norm).includes(norm(input));
    case 'speak':
      return typeof input === 'string' && speakScore(beat.target, input) >= 0.75;
    default:
      return false;
  }
}

/** Mọi lượt của một nhiệm vụ (cả lượt mở đầu) — dùng cho test độ đầy đủ. */
export function spotsOf(spec: StageSpec): string[] {
  return [spec.spot, ...spec.beats.map((b) => b.spot).filter((s): s is string => !!s)];
}
