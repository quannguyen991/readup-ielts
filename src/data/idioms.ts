/**
 * Thành ngữ tiếng Anh thông dụng (15/11/2026): 100 thành ngữ, 10 chủ đề × 10.
 * Nghĩa tiếng Việt và câu ví dụ do Band 9 tự biên soạn; chọn những thành ngữ gặp nhiều trong
 * đời sống, phim, bài đọc và phần Speaking. Học từ khoảng trống khi đối chiếu với bộ từ vựng của AIO English.
 */

export type IdiomTheme = { id: string; title: string; titleEn: string };

export type Idiom = {
  phrase: string;
  /** Nghĩa tiếng Việt, ngắn. */
  vi: string;
  example: string;
  theme: string;
};

export const IDIOM_THEMES: readonly IdiomTheme[] = [
  { id: 'work', title: 'Công việc & học tập', titleEn: 'Work and study' },
  { id: 'money', title: 'Tiền bạc', titleEn: 'Money' },
  { id: 'feelings', title: 'Cảm xúc', titleEn: 'Feelings' },
  { id: 'time', title: 'Thời gian', titleEn: 'Time' },
  { id: 'success', title: 'Cố gắng & thành công', titleEn: 'Effort and success' },
  { id: 'people', title: 'Con người & quan hệ', titleEn: 'People and relationships' },
  { id: 'problems', title: 'Rắc rối & lời khuyên', titleEn: 'Problems and advice' },
  { id: 'speech', title: 'Nói năng & giao tiếp', titleEn: 'Speaking and communication' },
  { id: 'decisions', title: 'Quyết định & rủi ro', titleEn: 'Decisions and risk' },
  { id: 'daily', title: 'Đời sống hằng ngày', titleEn: 'Everyday life' },
];

// theme | thành ngữ | nghĩa | ví dụ
const RAW: ReadonlyArray<readonly [string, string, string, string]> = [
  // Công việc & học tập
  ['work', 'get the ball rolling', 'bắt đầu một việc', "Let's get the ball rolling with a quick team meeting."],
  ['work', 'on the same page', 'cùng hiểu và đồng thuận', "Before we start, let's make sure we're all on the same page."],
  ['work', 'call it a day', 'dừng làm việc cho hôm nay', "We've done enough, so let's call it a day."],
  ['work', 'back to square one', 'quay về điểm xuất phát', 'The test failed, so we are back to square one.'],
  ['work', 'hit the books', 'học bài chăm chỉ', 'I need to hit the books before my IELTS exam.'],
  ['work', 'learn the ropes', 'làm quen cách làm việc', 'It took her a month to learn the ropes in the new office.'],
  ['work', 'burn the midnight oil', 'thức khuya làm việc hoặc học bài', 'He burned the midnight oil to finish the report.'],
  ['work', 'cut corners', 'làm ẩu, bỏ bớt các bước', 'Never cut corners when you check your final answers.'],
  ['work', 'in the pipeline', 'đang được chuẩn bị', 'Two new courses are in the pipeline.'],
  ['work', 'think outside the box', 'nghĩ sáng tạo, ngoài lối mòn', 'This problem needs someone who can think outside the box.'],
  // Tiền bạc
  ['money', 'break the bank', 'tốn quá nhiều tiền', "A small gift won't break the bank."],
  ['money', 'cost an arm and a leg', 'đắt cắt cổ', 'That phone cost an arm and a leg.'],
  ['money', 'make ends meet', 'kiếm đủ sống', 'She works two jobs to make ends meet.'],
  ['money', 'save for a rainy day', 'để dành cho lúc khó khăn', 'Put some money aside for a rainy day.'],
  ['money', 'pay through the nose', 'trả giá quá đắt', 'We paid through the nose for a tiny hotel room.'],
  ['money', 'on the house', 'miễn phí, do quán mời', 'The dessert is on the house.'],
  ['money', 'a penny saved is a penny earned', 'tiết kiệm cũng như kiếm được tiền', 'Remember, a penny saved is a penny earned.'],
  ['money', 'live beyond your means', 'chi tiêu quá khả năng', 'Many young people live beyond their means.'],
  ['money', 'in the red', 'đang thua lỗ hoặc nợ', 'The company has been in the red for two years.'],
  ['money', 'bring home the bacon', 'kiếm tiền nuôi gia đình', 'He brings home the bacon for the whole family.'],
  // Cảm xúc
  ['feelings', 'over the moon', 'vui sướng tột độ', 'She was over the moon about her exam result.'],
  ['feelings', 'down in the dumps', 'buồn chán', "He's been down in the dumps since the match."],
  ['feelings', 'on cloud nine', 'cực kỳ hạnh phúc', 'They were on cloud nine after the wedding.'],
  ['feelings', 'butterflies in my stomach', 'bồn chồn, lo lắng', 'I always get butterflies in my stomach before speaking in public.'],
  ['feelings', 'get cold feet', 'chùn bước vì sợ', 'He got cold feet the night before the interview.'],
  ['feelings', 'blow off steam', 'xả stress', 'I go running to blow off steam after work.'],
  ['feelings', 'at the end of my rope', 'không chịu nổi nữa', "I'm at the end of my rope with this noise."],
  ['feelings', 'lose your temper', 'nổi nóng', "Try not to lose your temper when you're stuck in traffic."],
  ['feelings', 'keep your chin up', 'giữ vững tinh thần', 'Keep your chin up; things will get better.'],
  ['feelings', 'under the weather', 'không khoẻ, hơi mệt', "I'm feeling a bit under the weather today."],
  // Thời gian
  ['time', 'once in a blue moon', 'rất hiếm khi', 'We eat out once in a blue moon.'],
  ['time', 'in the nick of time', 'vừa kịp lúc', 'We got to the station in the nick of time.'],
  ['time', 'against the clock', 'chạy đua với thời gian', 'The team worked against the clock to finish the project.'],
  ['time', 'around the clock', 'suốt ngày đêm', 'The hospital operates around the clock.'],
  ['time', 'time flies', 'thời gian trôi nhanh', "Time flies when you're having fun."],
  ['time', 'better late than never', 'muộn còn hơn không', 'You finally called? Better late than never.'],
  ['time', 'at the eleventh hour', 'vào phút chót', 'They changed the plan at the eleventh hour.'],
  ['time', 'take your time', 'cứ từ từ, không vội', "Take your time; there's no rush."],
  ['time', 'beat the clock', 'kịp trước hạn', 'She beat the clock and handed in the essay on time.'],
  ['time', 'kill time', 'giết thời gian', 'I read a magazine to kill time at the airport.'],
  // Cố gắng & thành công
  ['success', 'go the extra mile', 'nỗ lực hơn mức được yêu cầu', 'He always goes the extra mile for his students.'],
  ['success', 'keep your eye on the ball', 'tập trung vào mục tiêu', 'Keep your eye on the ball and finish the course.'],
  ['success', 'rise to the occasion', 'vươn lên đáp ứng tình huống', 'She rose to the occasion and gave a brilliant speech.'],
  ['success', 'practice makes perfect', 'có công mài sắt có ngày nên kim', 'Practice makes perfect, so keep writing every day.'],
  ['success', 'hit the jackpot', 'gặp may lớn', 'We hit the jackpot with our new tutor.'],
  ['success', 'a piece of cake', 'dễ như ăn bánh', 'The listening test was a piece of cake.'],
  ['success', 'no pain, no gain', 'không vất vả thì không có kết quả', 'No pain, no gain, so do one more set.'],
  ['success', 'jump on the bandwagon', 'hùa theo xu hướng', 'Many brands jumped on the bandwagon.'],
  ['success', 'nail it', 'làm xuất sắc', 'You nailed the presentation!'],
  ['success', 'pass with flying colours', 'vượt qua một cách xuất sắc', 'She passed the test with flying colours.'],
  // Con người & quan hệ
  ['people', 'break the ice', 'phá vỡ sự ngượng ngùng ban đầu', 'A joke helped break the ice at the party.'],
  ['people', 'hit it off', 'hợp nhau ngay từ đầu', 'We hit it off at our first meeting.'],
  ['people', 'get along like a house on fire', 'rất hợp nhau', 'My sister and her friend get along like a house on fire.'],
  ['people', 'a shoulder to cry on', 'người để tâm sự, an ủi', 'Thanks for being a shoulder to cry on.'],
  ['people', 'the apple of someone\'s eye', 'cục cưng của ai đó', 'Their youngest son is the apple of their eye.'],
  ['people', 'black sheep', 'người khác biệt hoặc mang tiếng trong gia đình', 'He was the black sheep of the family.'],
  ['people', 'fair-weather friend', 'bạn chỉ có lúc sung sướng', 'Fair-weather friends disappear when you are in trouble.'],
  ['people', 'two peas in a pod', 'giống nhau như đúc', 'The twins are like two peas in a pod.'],
  ['people', 'see eye to eye', 'đồng quan điểm', "We don't always see eye to eye on money."],
  ['people', 'burn bridges', 'cắt đứt quan hệ không đường lui', "Don't burn bridges when you leave a job."],
  // Rắc rối & lời khuyên
  ['problems', 'in hot water', 'gặp rắc rối', "He's in hot water for missing the deadline."],
  ['problems', 'between a rock and a hard place', 'tiến thoái lưỡng nan', "I'm between a rock and a hard place: both choices are bad."],
  ['problems', 'the last straw', 'giọt nước tràn ly', 'Being late again was the last straw.'],
  ['problems', 'a blessing in disguise', 'trong cái rủi có cái may', 'Missing the bus was a blessing in disguise.'],
  ['problems', 'face the music', 'đối mặt và chịu hậu quả', 'He broke the window, so he had to face the music.'],
  ['problems', 'bite the bullet', 'cắn răng làm việc khó chịu', 'I decided to bite the bullet and see the dentist.'],
  ['problems', "it's not rocket science", 'không khó như bạn nghĩ', "Setting up the app isn't rocket science."],
  ['problems', 'add fuel to the fire', 'làm tình hình tệ hơn', 'Shouting at him will only add fuel to the fire.'],
  ['problems', 'sit tight', 'kiên nhẫn ngồi chờ', 'Sit tight; help is on the way.'],
  ['problems', 'get out of hand', 'vượt khỏi tầm kiểm soát', 'The party got out of hand after midnight.'],
  // Nói năng & giao tiếp
  ['speech', 'beat around the bush', 'nói vòng vo', 'Stop beating around the bush and tell me the truth.'],
  ['speech', 'spill the beans', 'tiết lộ bí mật', 'Who spilled the beans about the surprise party?'],
  ['speech', 'let the cat out of the bag', 'lỡ miệng tiết lộ bí mật', 'He let the cat out of the bag by accident.'],
  ['speech', 'speak your mind', 'nói thẳng suy nghĩ của mình', 'She is never afraid to speak her mind.'],
  ['speech', "pull someone's leg", 'trêu ai đó', "Relax, I'm only pulling your leg."],
  ['speech', 'hold your tongue', 'giữ im lặng', 'I wanted to argue, but I held my tongue.'],
  ['speech', 'cut a long story short', 'nói gọn lại', 'To cut a long story short, we missed the flight.'],
  ['speech', 'read between the lines', 'hiểu ý ngầm', 'You have to read between the lines in his emails.'],
  ['speech', 'hit the nail on the head', 'nói trúng phóc', 'You hit the nail on the head with that answer.'],
  ['speech', 'word of mouth', 'truyền miệng', 'The café grew entirely by word of mouth.'],
  // Quyết định & rủi ro
  ['decisions', 'sit on the fence', 'lưỡng lự, không chọn phe', "Don't sit on the fence; choose one option."],
  ['decisions', 'take it with a pinch of salt', 'nghe nhưng đừng tin hoàn toàn', 'Take his stories with a pinch of salt.'],
  ['decisions', 'play it by ear', 'tuỳ cơ ứng biến', "We have no plan, so let's play it by ear."],
  ['decisions', 'jump the gun', 'làm quá sớm', "Don't jump the gun; wait for the results."],
  ['decisions', 'put all your eggs in one basket', 'dồn hết vào một chỗ', "Don't put all your eggs in one basket."],
  ['decisions', 'a long shot', 'khả năng thấp', "It's a long shot, but I'll apply anyway."],
  ['decisions', 'weigh up the pros and cons', 'cân nhắc lợi và hại', 'Weigh up the pros and cons before you sign.'],
  ['decisions', 'take a leap of faith', 'liều tin vào điều chưa chắc chắn', 'Moving abroad was a leap of faith.'],
  ['decisions', 'cross that bridge when we come to it', 'đến lúc đó hẵng tính', "We'll cross that bridge when we come to it."],
  ['decisions', 'sleep on it', 'suy nghĩ qua đêm rồi quyết', 'Let me sleep on it before I decide.'],
  // Đời sống hằng ngày
  ['daily', "it's raining cats and dogs", 'mưa như trút', 'We stayed home because it was raining cats and dogs.'],
  ['daily', 'a storm in a teacup', 'chuyện bé xé ra to', 'The argument was just a storm in a teacup.'],
  ['daily', 'bite off more than you can chew', 'ôm đồm quá sức', 'He bit off more than he could chew with three jobs.'],
  ['daily', 'out of the blue', 'bất ngờ, không báo trước', 'She called me out of the blue.'],
  ['daily', 'the best of both worlds', 'được cả đôi đường', 'Working from home gives me the best of both worlds.'],
  ['daily', 'a walk in the park', 'việc rất dễ', "The exam wasn't a walk in the park."],
  ['daily', 'spice things up', 'làm cho thú vị hơn', "Let's spice things up with some music."],
  ['daily', 'not my cup of tea', 'không phải sở thích của tôi', "Horror films aren't my cup of tea."],
  ['daily', 'in the long run', 'về lâu dài', 'Saving early pays off in the long run.'],
  ['daily', 'at the drop of a hat', 'ngay lập tức, không do dự', "He'd travel anywhere at the drop of a hat."],
];

export const IDIOMS: readonly Idiom[] = RAW.map(([theme, phrase, vi, example]) => ({ theme, phrase, vi, example }));

export function idiomsOfTheme(theme: string): Idiom[] {
  return IDIOMS.filter((i) => i.theme === theme);
}

/** Bỏ dấu, hạ chữ thường để tìm không dấu. */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .trim();
}

/** Tìm theo thành ngữ, nghĩa tiếng Việt hoặc câu ví dụ. */
export function searchIdioms(query: string, list: readonly Idiom[] = IDIOMS): Idiom[] {
  const q = fold(query);
  if (!q) return [...list];
  return list.filter((i) => fold(i.phrase).includes(q) || fold(i.vi).includes(q) || fold(i.example).includes(q));
}
