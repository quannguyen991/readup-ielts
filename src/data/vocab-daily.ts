import type { VocabTopic, VocabTopicWord } from './vocab-topics';
import { DAILY_MORE_A } from './vocab-daily-more-a';
import { DAILY_MORE_B } from './vocab-daily-more-b';
import { DAILY_MORE_C } from './vocab-daily-more-c';

/**
 * Từ vựng giao tiếp hằng ngày: 20 chủ đề, mỗi chủ đề 8 cụm/từ hay dùng trong
 * đời sống. Mỗi mục có phiên âm, nghĩa tiếng Việt, một câu ví dụ, cụm đi kèm và
 * NGỮ CẢNH — nói câu này khi nào, ở đâu.
 *
 * Soạn tay, không lấy từ nguồn ngoài. Khác bộ IELTS ở chỗ ưu tiên lời nói thường
 * ngày (chào hỏi, gọi món, hỏi đường) hơn từ học thuật.
 */

export type DailyRow = [word: string, pos: string, ipa: string, vi: string, en: string, example: string, context: string, collocation: string];

function build(rows: DailyRow[]): VocabTopicWord[] {
  return rows.map(([word, pos, ipa, meaningVi, definitionEn, example, context, collocation]) => ({
    word,
    pos,
    ipa,
    meaningVi,
    definitionEn,
    example,
    context,
    collocation,
    band: '5-6' as const,
  }));
}

/** Bổ sung đủ 40 từ mỗi chủ đề: phần thêm nằm ở `vocab-daily-more-a.ts` và `vocab-daily-more-b.ts`. */
const EXTRA: Record<string, DailyRow[]> = {};
for (const part of [DAILY_MORE_A, DAILY_MORE_B, DAILY_MORE_C]) {
  for (const [slug, rows] of Object.entries(part)) EXTRA[slug] = [...(EXTRA[slug] ?? []), ...rows];
}

function topic(slug: string, name: string, nameVi: string, blurb: string, rows: DailyRow[]): VocabTopic {
  return { slug, name, nameVi, blurb, words: build([...rows, ...(EXTRA[slug] ?? [])]) };
}

export const DAILY_TALK_TOPICS: VocabTopic[] = [
  topic('daily-greetings', 'Greetings & introductions', 'Chào hỏi & làm quen', 'Những câu mở đầu khi gặp người mới hay bạn cũ.', [
    ['greet', 'v', '/ɡriːt/', 'chào, chào đón', 'to say hello to someone', 'She greeted us with a warm smile.', 'Khi bước vào phòng hoặc gặp ai đó ở nơi công cộng.', 'greet someone warmly'],
    ['introduce', 'v', '/ˌɪntrəˈdjuːs/', 'giới thiệu', 'to tell someone your name when you first meet', 'Let me introduce myself: I am Minh.', 'Khi làm quen với người lạ hoặc đồng nghiệp mới.', 'introduce yourself'],
    ['nice to meet you', 'phrase', '/naɪs tuː miːt juː/', 'rất vui được gặp bạn', 'a polite reply when you first meet someone', 'Nice to meet you, I have heard a lot about you.', 'Câu chào khi gặp lần đầu, nói ngay sau khi bắt tay.', 'nice to meet you'],
    ['acquaintance', 'n', '/əˈkweɪntəns/', 'người quen sơ', 'a person you know, but not well', 'He is just an acquaintance from my gym.', 'Khi nói về người chỉ biết mặt, chưa thân.', 'a casual acquaintance'],
    ['catch up', 'phr v', '/kætʃ ʌp/', 'trò chuyện cập nhật tin tức', 'to talk with someone to hear their latest news', "Let's catch up over coffee this weekend.", 'Hẹn gặp bạn cũ sau một thời gian dài không liên lạc.', 'catch up with an old friend'],
    ['how have you been', 'phrase', '/haʊ hæv juː biːn/', 'dạo này bạn thế nào', 'a friendly question asking about someone’s recent life', 'Hi Lan! How have you been since we last met?', 'Mở đầu cuộc gặp với bạn bè lâu ngày không gặp.', 'how have you been lately'],
    ['mutual', 'adj', '/ˈmjuːtʃuəl/', 'chung (của cả hai)', 'shared by two people', 'We have a mutual friend in Hanoi.', 'Khi phát hiện hai người cùng quen một người hoặc cùng sở thích.', 'mutual friend'],
    ['pleasure', 'n', '/ˈpleʒə(r)/', 'niềm vui, hân hạnh', 'a feeling of happiness or satisfaction', 'It was a pleasure to meet you.', 'Đáp lại lời cảm ơn hoặc lời chào trang trọng khi chia tay.', 'a pleasure to meet'],
  ]),
  topic('daily-ordering', 'Ordering food', 'Gọi món ở nhà hàng', 'Từ dùng khi ngồi ăn, gọi món và thanh toán.', [
    ['menu', 'n', '/ˈmenjuː/', 'thực đơn', 'a list of the food and drinks a restaurant serves', 'Could I see the menu, please?', 'Ngay khi ngồi xuống bàn, trước khi gọi món.', 'check the menu'],
    ['order', 'v', '/ˈɔːdə(r)/', 'gọi món', 'to ask for food or drink to be brought', "I'd like to order the chicken soup.", 'Khi đến lượt bạn gọi món với bồi bàn.', 'order a dish'],
    ['waiter', 'n', '/ˈweɪtə(r)/', 'bồi bàn (nam)', 'a person who serves food in a restaurant', 'Excuse me, waiter? We are ready to order.', 'Gọi bồi bàn khi cần chú ý (nữ là waitress).', 'call the waiter'],
    ['starter', 'n', '/ˈstɑːtə(r)/', 'món khai vị', 'a small dish eaten before the main course', 'We will have the salad as a starter.', 'Khi gọi món theo thứ tự, trước món chính.', 'order a starter'],
    ['recommend', 'v', '/ˌrekəˈmend/', 'gợi ý, đề nghị', 'to suggest something as good', 'What do you recommend for a first-time visitor?', 'Khi không biết chọn món nào và muốn hỏi ý nhân viên.', 'recommend a dish'],
    ['allergic', 'adj', '/əˈlɜːdʒɪk/', 'dị ứng', 'affected badly by a particular food or substance', "I'm allergic to peanuts, so please avoid them.", 'Báo cho bồi bàn về thức ăn bạn không được dùng, trước khi gọi.', 'allergic to something'],
    ['medium', 'adj', '/ˈmiːdiəm/', 'chín vừa', 'cooked to a level between rare and well-done', "I'd like my steak medium, please.", 'Khi gọi bít tết hoặc thịt, nói rõ mức chín.', 'medium rare'],
    ['bill', 'n', '/bɪl/', 'hoá đơn', 'a written list of what you must pay', 'Could we have the bill, please?', 'Khi muốn thanh toán và rời bàn.', 'split the bill'],
  ]),
  topic('daily-shopping', 'Shopping', 'Mua sắm', 'Hỏi giá, thử đồ, đổi trả và các câu hay gặp ở cửa hàng.', [
    ['afford', 'v', '/əˈfɔːd/', 'đủ tiền mua', 'to have enough money to pay for something', "I can't afford this jacket right now.", 'Khi thấy món đồ đắt và muốn từ chối một cách nhẹ nhàng.', 'can afford to buy'],
    ['discount', 'n', '/ˈdɪskaʊnt/', 'giảm giá', 'a reduction in the usual price', 'Is there a discount for students?', 'Khi muốn hỏi có ưu đãi nào không.', 'give a discount'],
    ['size', 'n', '/saɪz/', 'cỡ, kích cỡ', 'how big or small clothes or shoes are', 'Do you have this in a larger size?', 'Khi quần áo không vừa và muốn đổi cỡ khác.', 'try a size'],
    ['fitting room', 'n', '/ˈfɪtɪŋ ruːm/', 'phòng thử đồ', 'a small room in a shop for trying on clothes', 'Where is the fitting room?', 'Khi muốn thử đồ trước khi mua.', 'use the fitting room'],
    ['refund', 'n', '/ˈriːfʌnd/', 'tiền hoàn lại', 'money given back when you return something', "I'd like a refund, because it's broken.", 'Khi trả hàng lỗi và muốn lấy lại tiền.', 'get a refund'],
    ['receipt', 'n', '/rɪˈsiːt/', 'hoá đơn mua hàng', 'a paper that shows you have paid', 'Can I have a receipt, please?', 'Cần giữ bằng chứng khi mua hoặc đổi trả hàng.', 'keep the receipt'],
    ['bargain', 'n', '/ˈbɑːɡɪn/', 'món hời', 'something bought for less than it is worth', 'This jacket was a real bargain!', 'Khi khoe món đồ mua được với giá tốt.', 'a real bargain'],
    ['exchange', 'v', '/ɪksˈtʃeɪndʒ/', 'đổi (hàng)', 'to swap an item for a different one', 'Can I exchange this shirt for a smaller one?', 'Khi hàng không đúng ý nhưng chưa dùng.', 'exchange for a different size'],
  ]),
  topic('daily-directions', 'Getting around', 'Đi lại & hỏi đường', 'Hỏi đường, gọi xe, đi xe buýt và tàu điện.', [
    ['directions', 'n', '/daɪˈrekʃnz/', 'chỉ đường', 'instructions about how to go somewhere', 'Could you give me directions to the station?', 'Khi lạc đường và cần hỏi người qua đường.', 'ask for directions'],
    ['turn left', 'phrase', '/tɜːn left/', 'rẽ trái', 'to change direction to the left', 'Turn left at the second traffic light.', 'Khi chỉ đường bằng lời cho người khác.', 'turn left at the corner'],
    ['nearby', 'adj', '/ˌnɪəˈbaɪ/', 'gần đây', 'close to where you are', 'Is there a pharmacy nearby?', 'Khi tìm một nơi gần vị trí hiện tại.', 'a nearby café'],
    ['get off', 'phr v', '/ɡet ɒf/', 'xuống (xe)', 'to leave a bus, train or car', "I'll get off at the next stop.", 'Khi sắp đến nơi trên xe buýt hoặc tàu.', 'get off the bus'],
    ['bus stop', 'n', '/bʌs stɒp/', 'trạm xe buýt', 'a place where buses stop to let people on and off', 'The bus stop is across the road.', 'Khi hẹn gặp hoặc chỉ chỗ đợi xe.', 'wait at the bus stop'],
    ['traffic jam', 'n', '/ˈtræfɪk dʒæm/', 'kẹt xe', 'a long line of cars moving very slowly', 'Sorry I am late, there was a traffic jam.', 'Khi giải thích vì sao đến muộn.', 'stuck in a traffic jam'],
    ['lost', 'adj', '/lɒst/', 'bị lạc', 'not knowing where you are', "I'm a bit lost. Can you help me?", 'Khi không biết đang ở đâu và cần giúp đỡ.', 'get lost'],
    ['cross', 'v', '/krɒs/', 'băng qua', 'to go from one side of a road to the other', 'Please cross at the zebra crossing.', 'Khi nhắc ai đó qua đường an toàn.', 'cross the road'],
  ]),
  topic('daily-hotel', 'Hotel stay', 'Ở khách sạn', 'Nhận phòng, trả phòng và xử lý vấn đề trong khách sạn.', [
    ['reservation', 'n', '/ˌrezəˈveɪʃn/', 'đặt phòng, đặt chỗ', 'an arrangement to keep a room or table for you', 'I have a reservation under the name Nguyen.', 'Khi đến quầy lễ tân khách sạn hoặc nhà hàng đã đặt trước.', 'make a reservation'],
    ['check in', 'phr v', '/tʃek ɪn/', 'nhận phòng', 'to register and get your room at a hotel', 'What time can we check in?', 'Hỏi giờ nhận phòng khi đến khách sạn.', 'check in at the front desk'],
    ['check out', 'phr v', '/tʃek aʊt/', 'trả phòng', 'to leave a hotel and pay the bill', 'We need to check out by 11 a.m.', 'Khi sắp rời khách sạn và thanh toán.', 'check out of the hotel'],
    ['available', 'adj', '/əˈveɪləbl/', 'còn trống', 'free to use or book', 'Do you have a room available tonight?', 'Khi hỏi còn phòng trống không.', 'a room is available'],
    ['key card', 'n', '/kiː kɑːd/', 'thẻ phòng', 'a plastic card that opens your hotel room door', 'I think I lost my key card.', 'Khi thẻ phòng không mở được cửa hoặc bị mất.', 'replace a key card'],
    ['deposit', 'n', '/dɪˈpɒzɪt/', 'tiền cọc', 'money paid in advance to secure something', 'Is there a deposit for the room?', 'Khi thuê phòng và cần hỏi có phải đặt cọc không.', 'pay a deposit'],
    ['noisy', 'adj', '/ˈnɔɪzi/', 'ồn ào', 'making a lot of sound', 'The room next door is very noisy.', 'Khi phàn nàn với lễ tân về tiếng ồn.', 'a noisy room'],
    ['wake-up call', 'n', '/ˈweɪk ʌp kɔːl/', 'cuộc gọi đánh thức', 'a phone call from the hotel to wake a guest', 'Could I have a wake-up call at 6 a.m.?', 'Khi cần khách sạn gọi để dậy đúng giờ.', 'ask for a wake-up call'],
  ]),
  topic('daily-work', 'Work small talk', 'Công việc hằng ngày', 'Nói về công việc, lịch họp và đồng nghiệp một cách tự nhiên.', [
    ['deadline', 'n', '/ˈdedlaɪn/', 'hạn chót', 'the time by which something must be finished', 'The deadline for the report is Friday.', 'Khi nói về thời hạn hoàn thành việc.', 'meet a deadline'],
    ['colleague', 'n', '/ˈkɒliːɡ/', 'đồng nghiệp', 'a person you work with', 'My colleague helped me with the slides.', 'Khi nhắc tới người cùng làm việc.', 'a close colleague'],
    ['meeting', 'n', '/ˈmiːtɪŋ/', 'cuộc họp', 'an occasion when people come together to discuss something', 'We have a meeting at ten o’clock.', 'Khi thông báo hoặc xác nhận lịch họp.', 'hold a meeting'],
    ['report', 'n', '/rɪˈpɔːt/', 'báo cáo', 'a written or spoken account of work or results', 'I will send you the monthly report today.', 'Khi nhắc đến tài liệu công việc cần gửi.', 'write a report'],
    ['schedule', 'n', '/ˈʃedjuːl/', 'lịch trình', 'a plan of what will happen and when', 'My schedule is full this week.', 'Khi từ chối lời mời vì bận.', 'a busy schedule'],
    ['workload', 'n', '/ˈwɜːkləʊd/', 'khối lượng công việc', 'the amount of work you have to do', 'My workload has increased a lot this month.', 'Khi than về việc quá nhiều nhưng vẫn lịch sự.', 'heavy workload'],
    ['promotion', 'n', '/prəˈməʊʃn/', 'thăng chức', 'a move to a higher job position', 'She got a promotion last year.', 'Khi chúc mừng ai đó được lên chức.', 'get a promotion'],
    ['overtime', 'n', '/ˈəʊvətaɪm/', 'làm thêm giờ', 'extra time worked beyond normal hours', 'I had to work overtime to finish the project.', 'Khi nói về việc phải ở lại làm thêm.', 'work overtime'],
  ]),
  topic('daily-plans', 'Making plans', 'Hẹn gặp & lên kế hoạch', 'Hẹn bạn bè, nhận lời, từ chối hoặc dời lịch.', [
    ['free', 'adj', '/friː/', 'rảnh', 'not busy and available to do something', 'Are you free on Saturday afternoon?', 'Khi hỏi xem ai đó có rảnh để hẹn không.', 'be free tonight'],
    ['postpone', 'v', '/pəˈspəʊn/', 'hoãn lại', 'to delay something until a later time', 'Can we postpone the dinner until next week?', 'Khi cần dời buổi gặp sang thời gian khác.', 'postpone a meeting'],
    ['reschedule', 'v', '/riːˈʃedjuːl/', 'dời lịch', 'to change the time or date of something', 'I need to reschedule our call.', 'Khi thay đổi thời gian của cuộc hẹn đã định.', 'reschedule an appointment'],
    ['drop by', 'phr v', '/drɒp baɪ/', 'ghé qua', 'to visit someone for a short time without a long plan', 'Feel free to drop by my place anytime.', 'Mời bạn ghé nhà một cách thoải mái.', 'drop by for a coffee'],
    ['count me in', 'phrase', '/kaʊnt miː ɪn/', 'tính tôi vào', 'a way of saying you want to join', 'Going to the beach? Count me in!', 'Khi đồng ý tham gia một kế hoạch chung.', 'count someone in'],
    ['rain check', 'phrase', '/reɪn tʃek/', 'hẹn lần sau', 'a polite way to say no now and maybe later', "I can't come today, but can I take a rain check?", 'Từ chối lịch sự nhưng vẫn giữ ý định gặp sau.', 'take a rain check'],
    ['sounds good', 'phrase', '/saʊndz ɡʊd/', 'nghe được đấy', 'a casual way to agree to a plan', 'Seven o’clock at the café? Sounds good.', 'Đồng ý nhanh với một đề xuất.', 'sounds good to me'],
    ['meet up', 'phr v', '/miːt ʌp/', 'gặp nhau', 'to meet a person at a place you agreed on', "Let's meet up at the station at eight.", 'Khi chốt địa điểm và giờ gặp.', 'meet up with friends'],
  ]),
  topic('daily-phone', 'Phone & messages', 'Điện thoại & nhắn tin', 'Nghe và nói qua điện thoại, nhắn tin, nhờ gọi lại.', [
    ['call back', 'phr v', '/kɔːl bæk/', 'gọi lại', 'to return a phone call to someone', "I'm busy now, can I call you back?", 'Khi chưa tiện nghe máy nhưng muốn gọi lại sau.', 'call someone back'],
    ['hold on', 'phr v', '/həʊld ɒn/', 'chờ máy', 'to wait for a short time on the phone', 'Hold on, let me check the schedule.', 'Khi cần thời gian kiểm tra thông tin trong lúc gọi.', 'hold on a moment'],
    ['hang up', 'phr v', '/hæŋ ʌp/', 'cúp máy', 'to end a phone call', 'He hung up before I could answer.', 'Khi kết thúc cuộc gọi.', 'hang up the phone'],
    ['voicemail', 'n', '/ˈvɔɪsmeɪl/', 'hộp thư thoại', 'a recorded message left on a phone', 'Please leave a message on my voicemail.', 'Khi không ai nghe máy và muốn để lại lời nhắn.', 'leave a voicemail'],
    ['signal', 'n', '/ˈsɪɡnəl/', 'sóng điện thoại', 'the strength of the mobile connection', "I can't hear you, the signal is weak.", 'Khi cuộc gọi bị rớt hoặc tiếng bị ngắt.', 'poor signal'],
    ['battery', 'n', '/ˈbætri/', 'pin', 'the power source of a phone or device', 'My battery is almost dead.', 'Khi điện thoại sắp hết pin và cần báo trước.', 'low battery'],
    ['wrong number', 'n', '/rɒŋ ˈnʌmbə(r)/', 'gọi nhầm số', 'a call that reached the wrong person', "Sorry, I think you have the wrong number.", 'Khi nhận cuộc gọi nhầm và muốn nói lịch sự.', 'dial the wrong number'],
    ['speak up', 'phr v', '/spiːk ʌp/', 'nói to lên', 'to speak louder so others can hear', 'Could you speak up a little, please?', 'Khi người kia nói quá nhỏ trong cuộc gọi.', 'speak up clearly'],
  ]),
  topic('daily-health', 'Health & the doctor', 'Sức khoẻ & khám bệnh', 'Mô tả triệu chứng và hỏi thầy thuốc hoặc dược sĩ.', [
    ['headache', 'n', '/ˈhedeɪk/', 'đau đầu', 'a pain in the head', 'I have had a headache since this morning.', 'Khi mô tả triệu chứng với bác sĩ hoặc người thân.', 'have a headache'],
    ['fever', 'n', '/ˈfiːvə(r)/', 'sốt', 'a body temperature that is higher than normal', 'My son has a high fever.', 'Khi báo với bác sĩ về nhiệt độ cơ thể.', 'run a fever'],
    ['cough', 'v', '/kɒf/', 'ho', 'to push air out of your throat with a sudden sound', 'I have been coughing for three days.', 'Khi mô tả triệu chứng hô hấp.', 'a dry cough'],
    ['prescription', 'n', '/prɪˈskrɪpʃn/', 'đơn thuốc', 'a written instruction from a doctor for medicine', 'The doctor gave me a prescription.', 'Khi nhận thuốc có kê đơn ở hiệu thuốc.', 'fill a prescription'],
    ['pharmacy', 'n', '/ˈfɑːməsi/', 'hiệu thuốc', 'a shop where medicines are sold', 'The pharmacy is open until nine.', 'Khi hỏi chỗ mua thuốc.', 'go to the pharmacy'],
    ['appointment', 'n', '/əˈpɔɪntmənt/', 'lịch hẹn (khám)', 'a planned meeting, for example with a doctor', 'I have an appointment at ten o’clock.', 'Khi đặt lịch hoặc xác nhận giờ khám.', 'make an appointment'],
    ['feel better', 'phrase', '/fiːl ˈbetə(r)/', 'thấy đỡ hơn', 'to become healthier after being ill', 'I hope you feel better soon.', 'Lời chúc khi ai đó đang ốm.', 'hope you feel better'],
    ['rest', 'v', '/rest/', 'nghỉ ngơi', 'to stop doing activities to recover energy', 'The doctor said I should rest for a few days.', 'Khi bác sĩ dặn cần nghỉ.', 'get some rest'],
  ]),
  topic('daily-small-talk', 'Small talk & weather', 'Trò chuyện xã giao', 'Câu nói nhẹ nhàng về thời tiết và cuộc sống để mở đầu chuyện.', [
    ['weather', 'n', '/ˈweðə(r)/', 'thời tiết', 'the conditions outside, such as rain, sun or wind', 'The weather is lovely today.', 'Chủ đề mở đầu an toàn khi mới gặp.', 'nice weather'],
    ['humid', 'adj', '/ˈhjuːmɪd/', 'ẩm', 'containing a lot of water vapour in the air', "It's so humid, I can barely breathe.", 'Khi than về thời tiết nóng ẩm ở Hà Nội hay Sài Gòn.', 'hot and humid'],
    ['chilly', 'adj', '/ˈtʃɪli/', 'se lạnh', 'cold in an unpleasant way', 'It is a bit chilly this morning.', 'Khi nói về không khí buổi sáng hoặc buổi tối.', 'chilly weather'],
    ["how's it going", 'phrase', '/haʊz ɪt ˈɡəʊɪŋ/', 'dạo này sao rồi', 'a casual way to ask how someone is', "Hey! How's it going with the new job?", 'Chào bạn bè hoặc đồng nghiệp thân.', 'how is it going'],
    ['busy', 'adj', '/ˈbɪzi/', 'bận', 'having a lot to do', 'Things have been busy at work lately.', 'Khi nói về tình hình công việc dạo này.', 'be busy with work'],
    ['rush hour', 'n', '/ˈrʌʃ aʊə(r)/', 'giờ cao điểm', 'the time when many people travel to or from work', 'Avoid the roads during rush hour.', 'Khi giải thích vì sao đường đông hoặc đến muộn.', 'during rush hour'],
    ['anyway', 'adv', '/ˈeniweɪ/', 'dù sao', 'used to go back to the main point of a conversation', 'Anyway, what were we talking about?', 'Khi quay lại chủ đề chính sau một đoạn lạc đề.', 'anyway, as I was saying'],
    ['by the way', 'phrase', '/baɪ ðə weɪ/', 'nhân tiện', 'used to introduce a new, related point', 'By the way, did you watch the match?', 'Khi muốn nói thêm một điều liên quan.', 'by the way, I forgot to tell you'],
  ]),
  topic('daily-family', 'Family & friends', 'Gia đình & bạn bè', 'Nói về người thân, bạn bè và những mối quan hệ quanh mình.', [
    ['relative', 'n', '/ˈrelətɪv/', 'họ hàng', 'a person in your family who is not your parent or child', 'My relatives are coming to visit this weekend.', 'Khi nói về người thân trong dịp lễ hay gặp mặt.', 'a close relative'],
    ['grow up', 'phr v', '/ɡrəʊ ʌp/', 'lớn lên', 'to change from a child into an adult', 'I grew up in a small village near Hue.', 'Khi kể về quê hương hoặc tuổi thơ.', 'grow up in a city'],
    ['get along', 'phr v', '/ɡet əˈlɒŋ/', 'hợp nhau, hoà thuận', 'to have a friendly relationship with someone', 'My brother and I get along really well.', 'Khi nói về mối quan hệ với người khác.', 'get along with someone'],
    ['miss', 'v', '/mɪs/', 'nhớ', 'to feel sad because someone is not with you', 'I really miss my grandmother’s cooking.', 'Khi nhớ người thân ở xa.', 'miss someone a lot'],
    ['support', 'v', '/səˈpɔːt/', 'ủng hộ, hỗ trợ', 'to help someone emotionally or practically', 'My parents always support my decisions.', 'Khi nói về sự đồng hành của gia đình.', 'support each other'],
    ['close', 'adj', '/kləʊs/', 'thân thiết', 'having a strong emotional bond with someone', 'She is one of my closest friends.', 'Khi nói về mối quan hệ gần gũi.', 'a close friend'],
    ['celebrate', 'v', '/ˈselɪbreɪt/', 'ăn mừng', 'to do something enjoyable for a special occasion', "Let's celebrate your birthday with dinner.", 'Khi tổ chức sinh nhật hoặc dịp đặc biệt.', 'celebrate a birthday'],
    ['nag', 'v', '/næɡ/', 'cằn nhằn', 'to keep asking or complaining about something', 'My mum keeps nagging me to call home.', 'Khi nói đùa về việc bị nhắc đi nhắc lại.', 'nag someone to do something'],
  ]),
  topic('daily-hobbies', 'Hobbies & free time', 'Sở thích & giải trí', 'Kể về việc mình thích làm lúc rảnh rỗi.', [
    ['hobby', 'n', '/ˈhɒbi/', 'sở thích', 'an activity you enjoy doing in your free time', 'What is your favourite hobby?', 'Khi làm quen và hỏi về cách người kia giải trí.', 'a hobby of mine'],
    ['go for a run', 'phrase', '/ɡəʊ fɔː ə rʌn/', 'đi chạy bộ', 'to run for exercise or fun', 'I go for a run every morning.', 'Khi kể về thói quen tập luyện.', 'go for a run in the park'],
    ['be into', 'phrase', '/biː ˈɪntu/', 'thích, mê', 'to like something very much', "I'm really into photography these days.", 'Khi nói về sở thích đang mê.', 'be into music'],
    ['sketch', 'v', '/sketʃ/', 'phác hoạ', 'to draw something quickly with simple lines', 'I like to sketch people in cafés.', 'Khi kể về sở thích vẽ.', 'sketch a portrait'],
    ['playlist', 'n', '/ˈpleɪlɪst/', 'danh sách nhạc', 'a list of songs you have chosen to listen to', 'I made a new playlist for the trip.', 'Khi chia sẻ nhạc yêu thích.', 'create a playlist'],
    ['binge-watch', 'v', '/ˈbɪndʒ wɒtʃ/', 'xem liền một mạch', 'to watch many episodes of a show in a short time', 'We binge-watched the whole series last weekend.', 'Khi nói về việc xem phim bộ liên tục.', 'binge-watch a series'],
    ['hiking', 'n', '/ˈhaɪkɪŋ/', 'đi bộ đường dài', 'walking for a long distance, often in the countryside', 'Hiking in Sapa is my favourite trip.', 'Khi kể về chuyến đi leo núi hoặc đi bộ dã ngoại.', 'go hiking'],
    ['be good at', 'phrase', '/biː ɡʊd æt/', 'giỏi về', 'to have a talent or skill for something', "I'm not very good at drawing.", 'Khi nói khiêm tốn về khả năng của mình.', 'be good at languages'],
  ]),
  topic('daily-housing', 'Housing & renting', 'Nhà cửa & thuê nhà', 'Tìm nhà, hỏi về hợp đồng thuê và sinh hoạt trong nhà.', [
    ['rent', 'v', '/rent/', 'thuê', 'to pay money to use a place that belongs to someone else', 'We rent a small apartment near the river.', 'Khi nói về việc đang thuê chỗ ở.', 'rent a room'],
    ['landlord', 'n', '/ˈlændlɔːd/', 'chủ nhà (cho thuê)', 'a person who owns a property and rents it out', 'Our landlord fixed the air conditioner quickly.', 'Khi nói về người cho thuê nhà.', 'contact the landlord'],
    ['furnished', 'adj', '/ˈfɜːnɪʃt/', 'có sẵn nội thất', 'supplied with furniture', 'Is the flat furnished or unfurnished?', 'Khi hỏi thuê nhà có đồ đạc sẵn không.', 'fully furnished'],
    ['apartment', 'n', '/əˈpɑːtmənt/', 'căn hộ', 'a set of rooms for living in, usually on one floor of a building', 'The apartment has two bedrooms.', 'Khi mô tả nơi ở trong toà nhà chung cư.', 'a two-bedroom apartment'],
    ['utilities', 'n', '/juːˈtɪlətiz/', 'tiện ích (điện, nước)', 'services such as electricity, water and gas', 'Are the utilities included in the rent?', 'Khi hỏi tiền điện nước có tính trong tiền thuê không.', 'pay the utilities'],
    ['neighbourhood', 'n', '/ˈneɪbəhʊd/', 'khu phố, khu dân cư', 'the area where people live near one another', 'I love the quiet neighbourhood where I live.', 'Khi nói về khu vực đang sống.', 'a safe neighbourhood'],
    ['move in', 'phr v', '/muːv ɪn/', 'chuyển vào ở', 'to start living in a new home', 'We will move in next Monday.', 'Khi thông báo về ngày chuyển nhà.', 'move in with a friend'],
    ['lease', 'n', '/liːs/', 'hợp đồng thuê', 'a legal agreement to rent a property for a period', 'The lease lasts for one year.', 'Khi đọc và ký hợp đồng thuê nhà.', 'sign a lease'],
  ]),
  topic('daily-money', 'Money & banking', 'Tiền bạc & ngân hàng', 'Nói về lương, tiết kiệm, chuyển khoản và chi tiêu.', [
    ['salary', 'n', '/ˈsæləri/', 'lương', 'the money you receive for your work each month', 'My salary is paid on the last day of the month.', 'Khi nói về thu nhập từ công việc.', 'monthly salary'],
    ['save', 'v', '/seɪv/', 'tiết kiệm', 'to keep money for later instead of spending it', "I'm trying to save money for a holiday.", 'Khi kể về mục tiêu tài chính.', 'save money'],
    ['borrow', 'v', '/ˈbɒrəʊ/', 'mượn, vay', 'to take something from someone and return it later', 'Can I borrow ten dollars until Friday?', 'Khi nhờ ai đó cho mượn tiền tạm thời.', 'borrow money from a friend'],
    ['budget', 'n', '/ˈbʌdʒɪt/', 'ngân sách, dự trù chi tiêu', 'a plan of how much money you can spend', 'We need to stay within our budget.', 'Khi lập kế hoạch chi tiêu cho chuyến đi hoặc sinh hoạt.', 'tight budget'],
    ['cash', 'n', '/kæʃ/', 'tiền mặt', 'money in the form of notes and coins', 'Do you accept cash or only cards?', 'Khi hỏi cửa hàng có nhận tiền mặt không.', 'pay in cash'],
    ['transfer', 'v', '/trænsˈfɜː(r)/', 'chuyển khoản', 'to send money from one bank account to another', "I'll transfer the money tonight.", 'Khi trả tiền cho bạn hoặc thanh toán hoá đơn.', 'transfer money to someone'],
    ['debt', 'n', '/det/', 'khoản nợ', 'money that you owe to someone', 'He is trying to pay off his debt.', 'Khi nói về nợ nần một cách cẩn trọng.', 'pay off a debt'],
    ['expensive', 'adj', '/ɪkˈspensɪv/', 'đắt', 'costing a lot of money', 'Living in the city centre is expensive.', 'Khi nhận xét về giá cả.', 'an expensive restaurant'],
  ]),
  topic('daily-school', 'School & study', 'Trường học & học tập', 'Nói về lớp học, bài tập, bài kiểm tra và việc ôn luyện.', [
    ['assignment', 'n', '/əˈsaɪnmənt/', 'bài tập', 'a piece of work that a student is given to do', 'The English assignment is due on Monday.', 'Khi nhắc về bài được giao ở trường.', 'finish an assignment'],
    ['exam', 'n', '/ɪɡˈzæm/', 'bài kiểm tra, kỳ thi', 'a formal test of knowledge or skill', 'I have an exam tomorrow morning.', 'Khi nói về kỳ thi sắp tới.', 'pass an exam'],
    ['revise', 'v', '/rɪˈvaɪz/', 'ôn bài', 'to study again what you have learned, before a test', 'I need to revise for my test tonight.', 'Khi nói về việc ôn lại trước kỳ thi.', 'revise for an exam'],
    ['classmate', 'n', '/ˈklɑːsmeɪt/', 'bạn cùng lớp', 'a person in the same class as you', 'My classmate lent me her notes.', 'Khi nhắc tới bạn học.', 'a former classmate'],
    ['skip class', 'phrase', '/skɪp klɑːs/', 'trốn học, bỏ học', 'to not attend a class you should go to', 'I skipped class because I was sick.', 'Khi giải thích vì sao vắng mặt.', 'skip a lecture'],
    ['grade', 'n', '/ɡreɪd/', 'điểm, điểm số', 'a mark that shows how well you did', 'I got a good grade in maths.', 'Khi kể về kết quả học tập.', 'a good grade'],
    ['tutor', 'n', '/ˈtjuːtə(r)/', 'gia sư', 'a private teacher who helps one student', 'I hired a tutor for IELTS speaking.', 'Khi nói về việc học thêm riêng.', 'a private tutor'],
    ['semester', 'n', '/sɪˈmestə(r)/', 'học kỳ', 'a half of an academic year at a university', 'The new semester starts in September.', 'Khi nói về thời gian học ở đại học.', 'this semester'],
  ]),
  topic('daily-travel', 'Travel & the airport', 'Du lịch & sân bay', 'Làm thủ tục bay, hỏi cổng lên máy bay và xử lý hành lý.', [
    ['boarding pass', 'n', '/ˈbɔːdɪŋ pɑːs/', 'thẻ lên máy bay', 'a document that lets you get on a plane', 'Please show your boarding pass at the gate.', 'Khi làm thủ tục và đi qua cổng.', 'print a boarding pass'],
    ['gate', 'n', '/ɡeɪt/', 'cổng (lên máy bay)', 'the place in an airport where you board the plane', 'Which gate does the flight to Da Nang leave from?', 'Khi hỏi cổng đi của chuyến bay.', 'go to the gate'],
    ['delay', 'n', '/dɪˈleɪ/', 'chuyến bị trễ', 'a situation when something happens later than planned', 'There is a two-hour delay on the flight.', 'Khi thông báo hoặc hỏi về chuyến bay bị hoãn.', 'flight delay'],
    ['luggage', 'n', '/ˈlʌɡɪdʒ/', 'hành lý', 'bags and cases that you take on a journey', 'My luggage is missing.', 'Khi báo cho nhân viên về hành lý thất lạc.', 'check in luggage'],
    ['passport', 'n', '/ˈpɑːspɔːt/', 'hộ chiếu', 'an official document that proves who you are when travelling', 'Here is my passport.', 'Khi làm thủ tục xuất nhập cảnh.', 'show your passport'],
    ['customs', 'n', '/ˈkʌstəmz/', 'hải quan', 'the place where officials check goods and travellers at a border', 'Do I need to declare anything at customs?', 'Khi qua cửa khẩu quốc tế.', 'go through customs'],
    ['departure', 'n', '/dɪˈpɑːtʃə(r)/', 'giờ khởi hành', 'the act of leaving a place', 'The departure time is 9:30.', 'Khi xem bảng giờ bay.', 'departure gate'],
    ['layover', 'n', '/ˈleɪəʊvə(r)/', 'quá cảnh', 'a short stop between two parts of a journey', 'We have a three-hour layover in Bangkok.', 'Khi nói về chuyến bay có điểm dừng nối chuyến.', 'a short layover'],
  ]),
  topic('daily-cooking', 'Cooking at home', 'Nấu ăn ở nhà', 'Từ dùng khi nấu ăn, nêm nếm và chia sẻ công thức.', [
    ['ingredient', 'n', '/ɪnˈɡriːdiənt/', 'nguyên liệu', 'one of the foods used to make a dish', 'What ingredients do we need for pho?', 'Khi hỏi hoặc kiểm tra nguyên liệu nấu món.', 'main ingredient'],
    ['chop', 'v', '/tʃɒp/', 'băm, thái', 'to cut food into small pieces', 'Chop the onion finely.', 'Khi hướng dẫn cách sơ chế.', 'chop vegetables'],
    ['stir', 'v', '/stɜː(r)/', 'khuấy', 'to mix food by moving a spoon round and round', 'Stir the sauce every few minutes.', 'Khi nấu món xào hoặc nấu canh.', 'stir well'],
    ['boil', 'v', '/bɔɪl/', 'đun sôi', 'to heat liquid until it bubbles', 'Boil the water before adding the noodles.', 'Khi nấu mì, nấu canh.', 'bring to the boil'],
    ['season', 'v', '/ˈsiːzn/', 'nêm gia vị', 'to add salt, pepper or spices to food', 'Season the soup with a little fish sauce.', 'Khi nói về việc nêm nếm món ăn.', 'season to taste'],
    ['taste', 'v', '/teɪst/', 'nếm', 'to try a small amount of food to check its flavour', 'Taste it and tell me if it needs more salt.', 'Khi nhờ ai đó nếm thử món ăn.', 'taste good'],
    ['recipe', 'n', '/ˈresɪpi/', 'công thức nấu ăn', 'a set of instructions for making a dish', 'Can you send me the recipe for that cake?', 'Khi xin hoặc chia sẻ công thức.', 'follow a recipe'],
    ['leftovers', 'n', '/ˈleftəʊvəz/', 'đồ ăn thừa', 'food that is left after a meal', 'We can eat the leftovers for lunch tomorrow.', 'Khi bàn chuyện ăn lại đồ còn dư.', 'eat leftovers'],
  ]),
  topic('daily-feelings', 'Feelings & support', 'Cảm xúc & động viên', 'Diễn đạt cảm xúc và an ủi người khác một cách tự nhiên.', [
    ['nervous', 'adj', '/ˈnɜːvəs/', 'lo lắng, hồi hộp', 'worried or anxious about something that may happen', 'I feel nervous before every interview.', 'Khi nói về cảm giác trước một việc quan trọng.', 'feel nervous about'],
    ['relieved', 'adj', '/rɪˈliːvd/', 'nhẹ nhõm', 'happy because a worry has gone', 'I was relieved when the exam was over.', 'Khi kể về cảm giác sau khi lo lắng đã qua.', 'feel relieved'],
    ['disappointed', 'adj', '/ˌdɪsəˈpɔɪntɪd/', 'thất vọng', 'sad because something was not as good as you expected', 'I was disappointed with the result.', 'Khi bày tỏ sự thất vọng nhẹ nhàng.', 'disappointed in'],
    ['thrilled', 'adj', '/θrɪld/', 'rất phấn khích', 'very excited and happy', "I'm thrilled that you got the job!", 'Khi chúc mừng ai đó.', 'thrilled about'],
    ['upset', 'adj', '/ʌpˈset/', 'buồn bực, khó chịu', 'unhappy or worried because of something', 'She seemed upset after the call.', 'Khi nhận ra ai đó đang buồn.', 'feel upset'],
    ['calm down', 'phr v', '/kɑːm daʊn/', 'bình tĩnh lại', 'to become less angry or worried', 'Take a deep breath and calm down.', 'Khi khuyên ai đó bình tĩnh.', 'calm down a little'],
    ['cheer up', 'phr v', '/tʃɪə ʌp/', 'vui lên', 'to become happier, or to help someone feel happier', 'Cheer up! Things will get better.', 'Khi động viên bạn đang buồn.', 'cheer someone up'],
    ['overwhelmed', 'adj', '/ˌəʊvəˈwelmd/', 'quá tải', 'feeling that there is too much to deal with', 'I feel overwhelmed with work this week.', 'Khi than về áp lực công việc.', 'feel overwhelmed'],
  ]),
  topic('daily-polite', 'Polite phrases', 'Cách nói lịch sự', 'Xin lỗi, cảm ơn, nhờ vả và từ chối một cách khéo léo.', [
    ['apologize', 'v', '/əˈpɒlədʒaɪz/', 'xin lỗi', 'to say you are sorry for something you did', 'I want to apologize for being late.', 'Khi nhận lỗi một cách chân thành.', 'apologize for something'],
    ['appreciate', 'v', '/əˈpriːʃieɪt/', 'trân trọng, biết ơn', 'to be grateful for something', 'I really appreciate your help.', 'Khi cảm ơn một cách trang trọng.', 'appreciate your help'],
    ['excuse me', 'phrase', '/ɪkˈskjuːz miː/', 'xin lỗi, xin phép', 'a polite way to get attention or pass someone', 'Excuse me, is this seat free?', 'Khi cần chen qua hoặc gọi người lạ.', 'excuse me for a moment'],
    ["I'm afraid", 'phrase', '/aɪm əˈfreɪd/', 'tôi e rằng', 'a polite way to introduce bad news or a refusal', "I'm afraid we're fully booked tonight.", 'Khi từ chối hoặc báo tin không vui một cách nhẹ nhàng.', "I'm afraid that..."],
    ['no worries', 'phrase', '/nəʊ ˈwʌriz/', 'không sao đâu', 'a casual reply meaning it is not a problem', 'Sorry for the delay! No worries.', 'Đáp lại lời xin lỗi nhẹ nhàng.', 'no worries at all'],
    ['thanks a lot', 'phrase', '/θæŋks ə lɒt/', 'cảm ơn nhiều', 'a warm way to say thank you', 'Thanks a lot for picking me up.', 'Khi cảm ơn ai đó đã giúp mình.', 'thanks a lot'],
    ["that's kind of you", 'phrase', '/ðæts kaɪnd əv juː/', 'bạn thật tử tế', 'a polite way to thank someone for an offer', "That's kind of you, but I can manage.", 'Khi từ chối lời đề nghị giúp đỡ mà vẫn giữ lịch sự.', "that's kind of you to offer"],
    ['could you possibly', 'phrase', '/kʊd juː ˈpɒsəbli/', 'bạn có thể không ạ', 'a very polite way to make a request', 'Could you possibly show me the way?', 'Khi nhờ vả người lạ hoặc người trên.', 'could you possibly help'],
  ]),
  topic('daily-online', 'Online shopping & delivery', 'Mua hàng online & giao hàng', 'Đặt hàng, theo dõi đơn, hỏi về giao hàng và trả hàng.', [
    ['delivery', 'n', '/dɪˈlɪvəri/', 'giao hàng', 'the process of bringing goods to a customer', 'The delivery will arrive tomorrow afternoon.', 'Khi hỏi thời gian nhận hàng.', 'free delivery'],
    ['tracking number', 'n', '/ˈtrækɪŋ ˈnʌmbə(r)/', 'mã vận đơn', 'a code used to follow a parcel on its way', 'Can you send me the tracking number?', 'Khi muốn xem đơn hàng đang ở đâu.', 'check the tracking number'],
    ['out of stock', 'phrase', '/aʊt əv stɒk/', 'hết hàng', 'not available to buy at the moment', 'Sorry, this colour is out of stock.', 'Khi món hàng muốn mua đã hết.', 'be out of stock'],
    ['cash on delivery', 'phrase', '/kæʃ ɒn dɪˈlɪvəri/', 'thanh toán khi nhận hàng', 'a way to pay the courier when you receive the parcel', 'Can I pay cash on delivery?', 'Khi không muốn trả tiền trước.', 'pay cash on delivery'],
    ['return', 'v', '/rɪˈtɜːn/', 'trả lại (hàng)', 'to send an item back to the seller', 'I want to return this item within seven days.', 'Khi hàng không đúng mô tả và muốn trả.', 'return an item'],
    ['courier', 'n', '/ˈkʊriə(r)/', 'nhân viên giao hàng', 'a person or company that delivers parcels', 'The courier called to say he is nearby.', 'Khi nhân viên giao hàng gọi báo đến nơi.', 'a delivery courier'],
    ['be delayed', 'phrase', '/biː dɪˈleɪd/', 'bị chậm', 'to happen later than planned', 'My order has been delayed by two days.', 'Khi đơn hàng giao chậm hơn dự kiến.', 'be delayed by the weather'],
    ['order online', 'phrase', '/ˈɔːdə ˈɒnlaɪn/', 'đặt hàng online', 'to buy something through a website or app', 'I order online almost every week.', 'Khi nói về thói quen mua sắm.', 'order online from a shop'],
  ]),
];
