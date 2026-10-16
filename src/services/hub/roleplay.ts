/**
 * Kịch bản nhập vai ba lượt, chấm bằng lựa chọn (không cần AI). Mỗi lượt có ba
 * cách đáp: một cách tốt, hai cách còn lại kèm lời giải thích ngắn bằng tiếng Việt.
 */

export type RoleplayDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type RoleplayOption = { text: string; good: boolean; tip: string };
export type RoleplayStep = { ai: string; options: RoleplayOption[] };
export type Roleplay = {
  id: string;
  title: string;
  scene: string;
  difficulty: RoleplayDifficulty;
  minutes: number;
  steps: RoleplayStep[];
};

const o = (text: string, good: boolean, tip: string): RoleplayOption => ({ text, good, tip });

export const ROLEPLAYS: Roleplay[] = [
  {
    id: 'rp-teacher-career', title: 'Trò chuyện về nghề giáo', scene: 'Một người bạn hỏi bạn về công việc dạy học.', difficulty: 'EASY', minutes: 4,
    steps: [
      { ai: 'So, I heard you are thinking about becoming a teacher. What made you choose that?', options: [o('Because I like helping people learn, and I enjoy seeing them improve.', true, 'Trả lời có lý do và một ví dụ cụ thể.'), o('Because teacher is easy job.', false, 'Nói "easy job" nghe thiếu tôn trọng; dùng "an easy job" hoặc nêu lý do cụ thể.'), o('I don\'t know.', false, 'Quá ngắn; thêm một lý do dù nhỏ.')] },
      { ai: 'That sounds lovely. Do you think the job is very stressful?', options: [o('Sometimes it can be, but I think the rewards are worth it.', true, 'Thừa nhận mặt khó rồi nêu quan điểm.'), o('No stress at all.', false, 'Tuyệt đối hoá; nghe không thật.'), o('Yes, very bad.', false, 'Thiếu lý do và từ ngữ tiêu cực quá mạnh.')] },
      { ai: 'Good answer. Would you recommend it to a friend?', options: [o('Yes, if they enjoy working with people and are patient.', true, 'Đưa điều kiện rõ ràng, rất tự nhiên.'), o('Yes, because it is good.', false, 'Thiếu lý do cụ thể.'), o('Maybe.', false, 'Quá ngắn để tiếp tục hội thoại.')] },
    ],
  },
  {
    id: 'rp-teacher-gift', title: 'Chọn quà cảm ơn thầy cô', scene: 'Lớp bạn muốn tặng quà thầy cô cuối năm.', difficulty: 'EASY', minutes: 3,
    steps: [
      { ai: 'We want to get a small gift for our teacher. Any ideas?', options: [o('How about a nice book or a gift card? Teachers usually like both.', true, 'Gợi ý kèm lý do.'), o('Give money.', false, 'Đúng ý nhưng nghe thô; dùng "a gift card" hoặc "some money as a contribution".'), o('I don\'t care.', false, 'Không hợp tình huống nhóm.')] },
      { ai: 'A book sounds good. How much should each person pay?', options: [o('Maybe around fifty thousand dong each, if that works for everyone?', true, 'Đề nghị con số cụ thể và hỏi ý kiến nhóm.'), o('Whatever.', false, 'Mơ hồ, không giúp nhóm quyết định.'), o('Ten dollars.', false, 'Đúng về nghĩa nhưng nên quy đổi cho người Việt trong nhóm.')] },
      { ai: 'Great. Who will write the card?', options: [o('I can write it. Would you like to add a few words too?', true, 'Nhận việc và mời người khác góp ý.'), o('Not me.', false, 'Từ chối cụt lủn.'), o('Anyone.', false, 'Không rõ ràng.')] },
    ],
  },
  {
    id: 'rp-teacher-hard', title: 'Khi cả lớp im lặng', scene: 'Bạn là giáo viên, cả lớp không ai trả lời câu hỏi.', difficulty: 'HARD', minutes: 6,
    steps: [
      { ai: '(Silence in the class.) Teacher: Does anyone want to share an idea?', options: [o('That\'s okay. Take your time, I\'ll give you a minute to think.', true, 'Cho thời gian và giữ thái độ bình tĩnh.'), o('Why is nobody answering?!', false, 'Trách móc làm lớp càng im hơn.'), o('Fine, I will answer myself.', false, 'Bỏ cuộc sớm, mất cơ hội cho học sinh.')] },
      { ai: 'A student (quietly): I\'m not sure my answer is correct...', options: [o('Every answer is a good start. Can you tell me what you were thinking?', true, 'Khuyến khích và hỏi cụ thể.'), o('Then it is wrong.', false, 'Làm học sinh mất tự tin.'), o('Okay, next person.', false, 'Bỏ qua học sinh vừa lên tiếng.')] },
      { ai: 'Student: I think the answer is about the weather...', options: [o('Good thinking. Let\'s build on that idea together.', true, 'Ghi nhận và phát triển ý.'), o('That is not related.', false, 'Đóng cửa ý kiến, lớp sẽ ngại nói tiếp.'), o('Let\'s skip it.', false, 'Mất cơ hội luyện nói.')] },
    ],
  },
  {
    id: 'rp-sick-leave', title: 'Xin nghỉ ốm từ sếp khó tính', scene: 'Bạn bị sốt và cần xin nghỉ một ngày.', difficulty: 'MEDIUM', minutes: 4,
    steps: [
      { ai: 'Manager: Yes? What do you need?', options: [o('Good morning. I\'m afraid I\'m unwell and I won\'t be able to come in today.', true, 'Mở đầu lịch sự, nói rõ lý do.'), o('I am sick, bye.', false, 'Cụt lủn, thiếu lịch sự.'), o('Can I leave early?', false, 'Lệch yêu cầu: bạn cần nghỉ cả ngày.')] },
      { ai: 'Manager: Oh no. Is it serious? Can you finish the report first?', options: [o('It\'s just a fever. I\'ll send the report by email before noon.', true, 'Trấn an và đưa ra giải pháp cụ thể.'), o('No, I can\'t.', false, 'Từ chối không kèm phương án.'), o('Maybe.', false, 'Mơ hồ với việc quan trọng.')] },
      { ai: 'Manager: Alright. Please rest and get better soon.', options: [o('Thank you, I really appreciate your understanding.', true, 'Cảm ơn lịch sự, kết thúc đúng mực.'), o('OK.', false, 'Hơi cụt, nhưng vẫn hợp lệ.'), o('Bye.', false, 'Kết thúc thiếu lịch sự.')] },
    ],
  },
  {
    id: 'rp-family-news', title: 'Đại gia đình hỏi thăm', scene: 'Người thân hỏi dạo này bạn thế nào.', difficulty: 'EASY', minutes: 3,
    steps: [
      { ai: 'Aunt Lan: Hello dear! How have you been lately?', options: [o('I\'ve been pretty good, thanks! Busy with work, but happy.', true, 'Trả lời tự nhiên, có chi tiết.'), o('Good.', false, 'Quá ngắn để mở chuyện.'), o('Why do you ask?', false, 'Nghe nghi ngờ, không hợp đối thoại.')] },
      { ai: 'Aunt Lan: And how is your job? Do you like it?', options: [o('I do! The team is friendly, and I\'m learning a lot.', true, 'Trả lời kèm lý do.'), o('It is job.', false, 'Thiếu cấu trúc và ý nghĩa.'), o('Not really.', false, 'Đúng ý nhưng cần giải thích thêm.')] },
      { ai: 'Aunt Lan: Wonderful! Will you visit us during the holiday?', options: [o('I\'d love to. Could I come on the twentieth?', true, 'Đồng ý và đề xuất thời gian.'), o('Maybe later.', false, 'Mơ hồ.'), o('No.', false, 'Từ chối trực tiếp, cụt.')] },
    ],
  },
  {
    id: 'rp-directions', title: 'Chỉ đường cho bạn bè', scene: 'Bạn bè hỏi đường đến quán cà phê gần công viên.', difficulty: 'EASY', minutes: 3,
    steps: [
      { ai: 'Friend: Hey, how do I get to the café near the park?', options: [o('Go straight down this street, then turn left at the second traffic light.', true, 'Chỉ đường rõ, có mốc.'), o('Go there.', false, 'Không đủ thông tin.'), o('I don\'t know the way.', false, 'Không giúp được bạn.')] },
      { ai: 'Friend: Is it far from here?', options: [o('It\'s about a ten-minute walk, so it\'s not far.', true, 'Ước lượng thời gian thay vì khoảng cách.'), o('Yes far.', false, 'Thiếu mạo từ và cấu trúc.'), o('I don\'t remember.', false, 'Không hữu ích.')] },
      { ai: 'Friend: Thanks! Should I take a taxi?', options: [o('You can walk, or take a taxi if it\'s raining.', true, 'Đưa hai lựa chọn kèm điều kiện.'), o('Taxi is good.', false, 'Thiếu lý do.'), o('Whatever you like.', false, 'Không đưa được ý kiến.')] },
    ],
  },
  {
    id: 'rp-angry-customer', title: 'Khách hàng khó tính với mạng chập chờn', scene: 'Bạn là nhân viên hỗ trợ, khách phàn nàn mạng liên tục bị rớt.', difficulty: 'HARD', minutes: 6,
    steps: [
      { ai: 'Customer: This is ridiculous! My internet has dropped three times today!', options: [o('I\'m really sorry about that. Let me check your line right away.', true, 'Xin lỗi chân thành và hành động ngay.'), o('It\'s not my fault.', false, 'Đổ lỗi làm khách bực hơn.'), o('Please calm down.', false, 'Nghe như ra lệnh, dễ làm khách tức thêm.')] },
      { ai: 'Customer: Just fix it! I work from home and I need it now.', options: [o('I understand how important that is. I can run a quick test now, and it should take two minutes.', true, 'Ghi nhận nhu cầu và đưa thời gian cụ thể.'), o('We are busy.', false, 'Lý do không thuyết phục.'), o('Wait.', false, 'Cụt, không trấn an.')] },
      { ai: 'Customer: Okay, how long will it take?', options: [o('About two minutes. If it still drops, I can book a technician for tomorrow morning.', true, 'Trả lời rõ và đưa phương án dự phòng.'), o('I don\'t know.', false, 'Không chắc chắn làm khách mất niềm tin.'), o('Maybe a day.', false, 'Mơ hồ.')] },
    ],
  },
  {
    id: 'rp-deadline', title: 'Xin gia hạn deadline', scene: 'Bạn cần xin thêm hai ngày cho một báo cáo.', difficulty: 'MEDIUM', minutes: 4,
    steps: [
      { ai: 'Team lead: Hi, is the report ready? It was due yesterday.', options: [o('I apologize for the delay. I\'m almost finished, but I need two more days to check the data.', true, 'Nhận lỗi, nêu tiến độ và thời gian cụ thể.'), o('It is not ready.', false, 'Nói ngắn, thiếu lời xin lỗi.'), o('I forgot.', false, 'Thẳng thắn nhưng thiếu cách trình bày.')] },
      { ai: 'Team lead: Two days is a lot. What is the main problem?', options: [o('Two sources don\'t match, so I need to confirm the numbers with the finance team.', true, 'Giải thích nguyên nhân cụ thể.'), o('Many things.', false, 'Mơ hồ.'), o('No problem.', false, 'Không trả lời câu hỏi.')] },
      { ai: 'Team lead: Okay. Can you send me a short update tomorrow morning?', options: [o('Yes, I\'ll send you a quick update by nine, and the full report by Thursday.', true, 'Cam kết mốc thời gian rõ ràng.'), o('Maybe.', false, 'Không cam kết.'), o('I will try.', false, 'Chưa đủ chắc chắn.')] },
    ],
  },
];

export function roleplayById(id: string): Roleplay | undefined {
  return ROLEPLAYS.find((r) => r.id === id);
}

/** Điểm một lượt: số lựa chọn tốt. Đạt khi chọn tốt ở ít nhất 2 lượt trên 3. */
export function gradeRoleplay(picks: (number | null)[], steps: RoleplayStep[]): { good: number; total: number; passed: boolean } {
  const total = steps.length;
  const good = steps.reduce((n, step, i) => {
    const p = picks[i];
    return n + (p !== null && p !== undefined && step.options[p]?.good ? 1 : 0);
  }, 0);
  return { good, total, passed: good >= Math.ceil((total * 2) / 3) };
}
