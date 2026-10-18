/**
 * Danh sách 18 gia sư AI của tab Gia sư (16 gia sư ELSA + 2 gia sư độc quyền Band 9).
 * Chuẩn đặc tả Band 9 Master Product Specification.
 */

export type TutorTag = 'MỚI' | 'BETA' | 'PREMIUM' | 'BAND 9 EXCLUSIVE' | 'NEW';

export type Tutor = {
  id: string;
  name: string;
  desc: string;
  tag?: TutorTag;
  status: 'live' | 'soon';
  /** Vai hệ thống gửi cho model (tiếng Anh để model giữ đúng giọng). */
  persona?: string;
  /** Câu mở đầu khi bắt đầu phiên. */
  opening?: string;
  /** Bản dịch tiếng Việt của câu mở đầu. */
  openingVi?: string;
  /** Gia sư cần nạp slide trước khi bắt đầu. */
  needsSlides?: boolean;
  /** Gia sư cần nạp CV / Hồ sơ trước khi bắt đầu. */
  needsProfile?: boolean;
  /** Mức CEFR gợi ý cho người học, ví dụ 'B1–C1'. */
  level?: string;
  /** 2–3 kỹ năng/chủ đề chính (tiếng Việt). Bản Anh nằm ở tutors-en.ts. */
  focus?: string[];
  /** 2–3 bài tập mẫu, mỗi bài một câu (tiếng Việt). Bản Anh nằm ở tutors-en.ts. */
  tasks?: string[];
};

/** Dữ liệu học của gia sư đang live: mức, kỹ năng chính và bài tập mẫu. */
const TUTOR_LEARNING: Record<string, { level: string; focus: string[]; tasks: string[] }> = {
  grammar: {
    level: 'B1–C1',
    focus: ['Thì và trợ động từ', 'Mệnh đề quan hệ', 'Câu điều kiện'],
    tasks: [
      'Nói một câu về khả năng hiện tại bằng can và can\'t.',
      'Viết lại một câu có mệnh đề quan hệ với who, which hoặc that.',
      'Hoàn thành một câu điều kiện loại 2 rồi nhận sửa lỗi.',
    ],
  },
  'speech-analysis': {
    level: 'B1–C1',
    focus: ['Phát âm từng âm', 'Ngữ điệu câu', 'Nhịp và độ rõ'],
    tasks: [
      'Ghi âm bài nói 1 phút về một ngày làm việc điển hình.',
      'Nghe lại và nhận xét phát âm, trọng âm của chính bạn.',
      'Đọc lại đoạn đã sửa để so sánh ngữ điệu và nhịp.',
    ],
  },
  vocab: {
    level: 'B2–C2',
    focus: ['Cụm từ học thuật', 'Từ đồng nghĩa mức C1', 'Giáo dục, công nghệ, môi trường'],
    tasks: [
      'Học một cụm từ C1 mới kèm một câu ví dụ.',
      'Thay một từ đơn giản trong câu của bạn bằng từ chính xác hơn.',
      'Trả lời một câu hỏi kiểm tra nhanh về cụm từ vừa học.',
    ],
  },
  pronounce: {
    level: 'A2–C1',
    focus: ['Âm cuối /p/ /t/ /k/', 'Trọng âm từ', 'Cặp từ tối thiểu'],
    tasks: [
      'Đọc một từ có âm cuối /t/ hoặc /k/ và nghe nhận xét.',
      'Phân biệt cặp từ ship và sheep bằng khẩu hình.',
      'Đọc một câu dài và nhấn đúng trọng âm của từ chính.',
    ],
  },
  meeting: {
    level: 'B2–C1',
    focus: ['Cập nhật tiến độ', 'Phản biện lịch trình', 'Đạt đồng thuận'],
    tasks: [
      'Báo cáo tiến độ một hạng mục trong khoảng 30 giây.',
      'Phản đối nhẹ nhàng một mốc thời gian và nêu lý do.',
      'Đề xuất hướng đi và chốt việc cần làm tiếp theo.',
    ],
  },
  interview: {
    level: 'B1–C1',
    focus: ['Giới thiệu bản thân', 'Câu hỏi hành vi theo năng lực', 'Thành tựu nổi bật'],
    tasks: [
      'Giới thiệu bản thân trong khoảng 1 phút.',
      'Kể một tình huống khó theo thứ tự: bối cảnh, việc cần làm, hành động, kết quả.',
      'Trả lời về thành tựu bạn tự hào nhất bằng số liệu cụ thể.',
    ],
  },
  'public-speaking': {
    level: 'B2–C2',
    focus: ['Mở đầu thu hút', 'Giọng và nhịp thuyết trình', 'Trả lời câu hỏi khán giả'],
    tasks: [
      'Mở bài thuyết trình trong 30 giây để thu hút khán giả.',
      'Trình bày một ý chính rồi dừng lại để tạo điểm nhấn.',
      'Trả lời một câu hỏi thử thách từ khán giả.',
    ],
  },
  presentation: {
    level: 'B2–C2',
    focus: ['Trình bày theo slide', 'Ngôn ngữ thuyết trình', 'Hỏi đáp sau bài'],
    tasks: [
      'Trình bày Slide 1 bằng lời của bạn.',
      'Chuyển sang slide tiếp theo bằng một câu dẫn ngắn.',
      'Trả lời một câu hỏi phản biện sau khi kết thúc bài.',
    ],
  },
  sales: {
    level: 'B2–C1',
    focus: ['Tìm nhu cầu của khách', 'Xử lý phản đối ngân sách', 'Chốt bước tiếp theo'],
    tasks: [
      'Đặt hai câu hỏi để tìm ra vấn đề thật sự của khách.',
      'Đáp lại khi khách nói ngân sách đang bị giới hạn.',
      'Chốt một bước tiếp theo rõ ràng trước khi kết thúc cuộc gọi.',
    ],
  },
  dating: {
    level: 'B1–B2',
    focus: ['Hội thoại thân mật', 'Hỏi tiếp để giữ câu chuyện', 'Chuyển chủ đề tự nhiên'],
    tasks: [
      'Đáp lại lời chào và kể một chi tiết về ngày của bạn.',
      'Hỏi lại một câu theo sở thích của đối phương.',
      'Chuyển từ chuyện quán cà phê sang sở thích của bạn.',
    ],
  },
  travel: {
    level: 'A2–B1',
    focus: ['Nhận phòng khách sạn', 'Hải quan và giấy tờ', 'Hỏi gợi ý địa phương'],
    tasks: [
      'Trả lời khi lễ tân xin hộ chiếu và mã đặt phòng.',
      'Khai báo hành lý khi làm thủ tục hải quan.',
      'Hỏi lễ tân gợi ý món ăn địa phương.',
    ],
  },
  negotiation: {
    level: 'B2–C1',
    focus: ['Đưa ra mức đề nghị', 'Lập luận bằng dữ kiện', 'Giữ thế chủ động'],
    tasks: [
      'Nêu mức lương mong muốn kèm lý do cụ thể.',
      'Đáp lại khi bên kia nói ngân sách đã chạm trần.',
      'Đề xuất một phương án thay thế thay vì nhượng bộ ngay.',
    ],
  },
  conflict: {
    level: 'B2–C1',
    focus: ['Diễn đạt cảm xúc', 'Nói về sự việc, không đổ lỗi', 'Thống nhất cách xử lý'],
    tasks: [
      'Nói về việc giao trễ mà không buộc tội ai.',
      'Thể hiện sự thấu hiểu trước khi đưa ra yêu cầu.',
      'Đề xuất cách cùng xử lý để kịp hạn chót mới.',
    ],
  },
  'leader-comms': {
    level: 'C1',
    focus: ['Thông điệp chiến lược', 'Truyền cảm hứng cho đội', 'Góp ý khó một cách tử tế'],
    tasks: [
      'Phát biểu một phút để trấn an đội ngũ quản lý.',
      'Nêu tầm nhìn ngắn gọn bằng hai ý chính.',
      'Đưa ra một góp ý khó với giọng điệu tôn trọng.',
    ],
  },
  storytelling: {
    level: 'B2–C1',
    focus: ['Cấu trúc SCQA', 'Biến số liệu thành câu chuyện', 'Mở đầu gây chú ý'],
    tasks: [
      'Kể bước ngoặt của sản phẩm theo khung bối cảnh, vấn đề, câu hỏi, trả lời.',
      'Thay một con số khô khan bằng một ví dụ cụ thể.',
      'Viết lại câu mở đầu để thu hút nhà đầu tư.',
    ],
  },
  leadership: {
    level: 'C1',
    focus: ['Tự nhận thức', 'Ra quyết định khi thiếu thông tin', 'Tầm ảnh hưởng trong tổ chức'],
    tasks: [
      'Kể một điểm mù cá nhân đã ảnh hưởng đến đội của bạn.',
      'Giải thích một quyết định bạn đưa ra khi chưa đủ thông tin.',
      'Nói cách bạn tạo ảnh hưởng ở vị trí không có quyền quyết định.',
    ],
  },
  'ielts-examiner': {
    level: 'B2–C1',
    focus: ['IELTS Speaking Part 1, 2, 3', 'Từ vựng và ngữ pháp mức cao', 'Giọng Anh, Úc, Mỹ'],
    tasks: [
      'Trả lời ba câu hỏi quen thuộc ở Part 1.',
      'Nói về một chủ đề trong 1–2 phút ở Part 2.',
      'Trả lời câu hỏi mở rộng ở Part 3 mà không đọc thuộc lòng.',
    ],
  },
  profile: {
    level: 'C1',
    focus: ['Phỏng vấn sâu về hồ sơ', 'Bảo vệ thành tích học thuật', 'Giải thích phương pháp nghiên cứu'],
    tasks: [
      'Tải lên CV hoặc bài luận để AI đặt câu hỏi về hồ sơ của bạn.',
      'Giải thích một thành tích trong hồ sơ bằng số liệu cụ thể.',
      'Trả lời về phương pháp bạn đã dùng trong một dự án.',
    ],
  },
  phone: {
    level: 'A2–B1',
    focus: ['Nghe và phản hồi nhanh', 'Xác nhận đặt bàn, lịch hẹn', 'Hỏi lại khi chưa rõ'],
    tasks: [
      'Trả lời cuộc gọi xác nhận đặt bàn nhà hàng.',
      'Hỏi lại một câu khi chưa nghe rõ.',
      'Đặt lịch hẹn qua điện thoại với phòng khám.',
    ],
  },
  diary: {
    level: 'A2–B1',
    focus: ['Viết câu hoàn chỉnh', 'Chọn từ chính xác', 'Mô tả một ngày của bạn'],
    tasks: [
      'Viết 3–5 câu về một điều khiến bạn mỉm cười hôm nay.',
      'Sửa một lỗi ngữ pháp hoặc chọn từ trong bài viết của bạn.',
      'Trả lời câu hỏi tiếp theo của gia sư để viết thêm.',
    ],
  },
};

/** Gia sư hiện trên lưới chính của trang Luyện nói (theo thứ tự này). */
export const HOME_TUTOR_IDS = ['grammar', 'speech-analysis', 'pronounce', 'interview', 'meeting', 'ielts-examiner'];

/** Gia sư có màn riêng trong app: bấm vào mở đúng màn đó, không đi qua phòng hội thoại AI chung. */
const OWN_SCREEN: Record<string, string> = {
  grammar: '/hub/tutor/grammar',
  'speech-analysis': '/hub/analyze',
  pronounce: '/hub/learn',
  meeting: '/hub/meeting',
};

/**
 * Đích của một dòng: màn riêng nếu có; gia sư `soon` (chưa sẵn sàng) mở màn "đang chuẩn bị";
 * còn lại vào phòng hội thoại AI dùng vai của gia sư đó.
 */
export function tutorRoute(t: Tutor): string {
  if (OWN_SCREEN[t.id]) return OWN_SCREEN[t.id]!;
  if (t.status === 'soon') return `/hub/tutor/coming/${t.id}`;
  return `/hub/tutor/${t.id}`;
}

export const SHARED_RULE = 'Reply in short, natural English (1-3 sentences maximum). Always end with an open-ended question to maximize learner speaking time (70% learner, 30% AI). After the learner answers, give one concrete correction and explain briefly.';

const TUTOR_LIST: Tutor[] = [
  {
    id: 'grammar',
    name: 'Gia sư ngữ pháp',
    status: 'live',
    desc: 'Cải thiện kỹ năng ngữ pháp của bạn với các bài tập cá nhân hóa.',
    persona: `You are a patient grammar tutor for Vietnamese learners of English. ${SHARED_RULE} Focus on one grammar point at a time and give one short exercise.`,
    opening: "Hey! 👋 Today I'll teach you how to talk about what you can and can't do! 💪 Ready?",
    openingVi: 'Chào bạn! 👋 Hôm nay tôi sẽ hướng dẫn bạn cách diễn đạt những gì bạn có thể và không thể làm! 💪 Sẵn sàng chưa?',
  },
  {
    id: 'speech-analysis',
    name: 'Phân tích giọng nói',
    status: 'live',
    tag: 'MỚI',
    desc: 'Ghi âm và khám phá giọng nói của bạn nghe thế nào.',
    persona: `You are an elite speech analysis coach. ${SHARED_RULE} Guide the learner to record a 1-minute speech, then critique their pronunciation, pitch intonation, and rhythm.`,
    opening: "Welcome to Speech Analysis! 🎙️ Please tell me about your typical weekday or your career goals.",
    openingVi: 'Chào mừng bạn đến với Phân tích giọng nói! 🎙️ Hãy kể cho tôi nghe về một ngày điển hình hoặc mục tiêu sự nghiệp của bạn.',
  },
  {
    id: 'vocab',
    name: 'Gia sư từ vựng',
    status: 'live',
    desc: 'Mở rộng vốn từ vựng tiếng Anh của bạn với bài luyện tập cá nhân hóa.',
    persona: `You are a vocabulary coach for Vietnamese learners. ${SHARED_RULE} Teach one useful C1/C2 collocation at a time with an example, then quiz the learner.`,
    opening: "Let's expand your lexical range. Which topic do you want to elevate: Education, Technology, or the Environment?",
    openingVi: 'Hãy cùng nâng cấp vốn từ vựng của bạn. Bạn muốn cải thiện chủ đề nào: Giáo dục, Công nghệ, hay Môi trường?',
  },
  {
    id: 'pronounce',
    name: 'Gia sư phát âm',
    status: 'live',
    desc: 'Học cách phát âm tiếng Anh rõ ràng',
    persona: `You are an expert pronunciation coach. ${SHARED_RULE} Diagnose Vietnamese L1 phonetic interference: ending consonants (/p/, /t/, /k/, /s/), word stress, and minimal pairs.`,
    opening: "Hi there! Say any English word or sentence you find difficult, and I will check your mouth position and phonemes.",
    openingVi: 'Xin chào! Hãy đọc bất kỳ từ hoặc câu tiếng Anh nào bạn thấy khó phát âm, tôi sẽ hướng dẫn khẩu hình và âm vị cho bạn.',
  },
  {
    id: 'meeting',
    name: 'Gia sư họp',
    status: 'live',
    tag: 'MỚI',
    desc: 'Luyện tập họp công việc',
    persona: `You are a colleague in a cross-functional business meeting. ${SHARED_RULE} Ask for progress updates, respectfully disagree on one timeline, and practice consensus building.`,
    opening: "Morning team! Could you give us a quick status update on where things stand with your project milestone?",
    openingVi: 'Chào cả nhóm! Bạn có thể cập nhật nhanh tiến độ các hạng mục chính trong dự án của bạn được không?',
  },
  {
    id: 'interview',
    name: 'Gia sư phỏng vấn',
    status: 'live',
    desc: 'Luyện tập các cuộc trò chuyện phỏng vấn trực tiếp với người phỏng vấn AI',
    persona: `You are an executive interviewer conducting a professional English interview. ${SHARED_RULE} Ask competency-based behavioral questions and challenge vague responses.`,
    opening: "Good morning, thank you for joining us today. To start off, could you tell me about yourself and your proudest achievement?",
    openingVi: 'Chào buổi sáng, cảm ơn bạn đã tham gia buổi phỏng vấn hôm nay. Trước tiên, bạn có thể giới thiệu về bản thân và thành tựu đáng tự hào nhất của mình?',
  },
  {
    id: 'public-speaking',
    name: 'Gia sư nói trước đám đông',
    status: 'live',
    desc: 'Thuyết trình tự tin trước khán giả AI trực tiếp',
    persona: `You are an engaged audience member at an international conference. ${SHARED_RULE} Listen to the pitch, ask challenging questions, and critique delivery presence.`,
    opening: "The stage is yours! Whenever you are ready, deliver your introductory pitch and hook the audience.",
    openingVi: 'Sân khấu là của bạn! Bất cứ khi nào bạn sẵn sàng, hãy bắt đầu bài thuyết trình và thu hút khán giả.',
  },
  {
    id: 'presentation',
    name: 'Gia sư thuyết trình',
    status: 'live',
    tag: 'BETA',
    needsSlides: true,
    desc: 'Tải lên bộ slide của bạn và diễn tập từ đầu đến cuối',
    persona: `You are an audience member reviewing a slide presentation. ${SHARED_RULE} Follow the uploaded slide sequence and probe deeper during the Q&A segment.`,
    opening: "I have your slide outline loaded. Start with Slide 1 whenever you are set, and I will conduct Q&A afterwards.",
    openingVi: 'Tôi đã nạp dàn ý slide của bạn. Hãy bắt đầu với Slide 1 khi bạn sẵn sàng, tôi sẽ đặt câu hỏi phản biện sau đó.',
  },
  {
    id: 'sales',
    name: 'Gia sư bán hàng',
    status: 'live',
    tag: 'BETA',
    desc: 'Luyện tập cuộc gọi bán hàng trực tiếp và nhận huấn luyện tức thì',
    persona: `You are a prospective B2B client on a discovery sales call. ${SHARED_RULE} Raise budget and timeline objections, and test whether the seller discovers your underlying pain point.`,
    opening: "Hi, thanks for reaching out. We only have 10 minutes today, so what makes your solution superior to what we currently use?",
    openingVi: 'Chào bạn, cảm ơn đã liên hệ. Hôm nay tôi chỉ có 10 phút, điều gì khiến giải pháp của bạn vượt trội hơn công cụ chúng tôi đang dùng?',
  },
  {
    id: 'dating',
    name: 'Gia sư hẹn hò',
    status: 'live',
    desc: 'Luyện tập buổi hẹn hò trực tiếp để được huấn luyện',
    persona: `You are a warm, witty conversationalist on a casual first coffee date. ${SHARED_RULE} Keep banter lively, ask engaging follow-ups, and transition between hobbies and passions.`,
    opening: "Hi! Sorry, traffic was a bit crazy. It's so nice to finally meet you in person! Have you been here before?",
    openingVi: 'Chào bạn! Xin lỗi, đường hơi đông xe một chút. Rất vui vì cuối cùng đã được gặp bạn trực tiếp! Bạn đã từng đến quán này chưa?',
  },
  {
    id: 'travel',
    name: 'Gia sư du lịch',
    status: 'live',
    desc: 'Luyện tiếng Anh cho chuyến đi sắp tới của bạn',
    persona: `You are a hotel concierge and flight attendant. ${SHARED_RULE} Assist with hotel check-in, customs declarations, lost luggage, and local culinary recommendations.`,
    opening: "Welcome to the Grand Heritage Hotel! May I take your passport and reservation confirmation, please?",
    openingVi: 'Chào mừng quý khách đến với khách sạn Grand Heritage! Tôi có thể xin hộ chiếu và mã đặt phòng của quý khách được không?',
  },
  {
    id: 'negotiation',
    name: 'Huấn luyện viên Đàm phán',
    status: 'live',
    tag: 'MỚI',
    desc: 'Luyện tập những cuộc đàm phán thực tế nơi công sở — lời mời làm việc, tăng lương, khách hàng khó tính, hạn chót. AI đóng vai đối phương rồi huấn luyện bạn sau đó.',
    persona: `You are a strict VP of HR in a salary and deadline negotiation. ${SHARED_RULE} Anchor high, push back firmly on initial asks, and coach tactical phrasing after concluding the roleplay.`,
    opening: "We are thrilled to offer you the role. However, our budget is capped at the standard tier. What is your rationale for a higher compensation package?",
    openingVi: 'Chúng tôi rất vui được gửi đến bạn lời mời làm việc. Tuy nhiên, ngân sách của chúng tôi có hạn. Lý do gì để bạn đề xuất mức đãi ngộ cao hơn?',
  },
  {
    id: 'conflict',
    name: 'Huấn luyện viên Quản lý xung đột',
    status: 'live',
    tag: 'MỚI',
    desc: 'Xử lý bất đồng mà không làm tổn hại mối quan hệ',
    persona: `You are a frustrated project partner over a delayed sprint deliverable. ${SHARED_RULE} Reward non-violent communication, empathy statements, and constructive mutual alignment.`,
    opening: "Frankly, this last-minute delay puts our entire client relationship in jeopardy. Why wasn't this flagged two weeks ago?",
    openingVi: 'Thành thật mà nói, sự chậm trễ phút chót này đặt toàn bộ mối quan hệ với khách hàng vào tình thế rủi ro. Tại sao điều này không được cảnh báo từ 2 tuần trước?',
  },
  {
    id: 'leader-comms',
    name: 'Giao tiếp như một nhà lãnh đạo',
    status: 'live',
    tag: 'BETA',
    desc: 'Luyện giao tiếp lãnh đạo nơi công sở',
    persona: `You are a senior executive coaching managerial presence. ${SHARED_RULE} Push the learner to articulate clear strategic visions, inspire team morale, and deliver tough feedback with empathy.`,
    opening: "A crisis has emerged in the regional division. Address your management team in one concise minute and restore confidence.",
    openingVi: 'Một khủng hoảng vừa nảy sinh ở chi nhánh khu vực. Hãy phát biểu trước đội ngũ quản lý trong 1 phút ngắn gọn và củng cố lại niềm tin.',
  },
  {
    id: 'storytelling',
    name: 'Kể chuyện trong kinh doanh',
    status: 'live',
    tag: 'BETA',
    desc: 'Biến số liệu và sáng kiến thành những câu chuyện truyền cảm hứng.',
    persona: `You are a venture capital partner evaluating a startup pitch. ${SHARED_RULE} Demand the classic SCQA structure: Situation, Complication, Question, Answer.`,
    opening: "Raw numbers don't move investors—narratives do. Walk me through the defining turning point of your product last year.",
    openingVi: 'Những con số thô ráp không thuyết phục được nhà đầu tư—chỉ có câu chuyện mới làm được. Hãy kể cho tôi về bước ngoặt định hình sản phẩm của bạn năm qua.',
  },
  {
    id: 'leadership',
    name: 'Huấn luyện viên Lãnh đạo',
    status: 'live',
    tag: 'MỚI',
    desc: 'Xây dựng sự tự nhận thức, khả năng phán đoán và tầm ảnh hưởng để lãnh đạo ở mọi cấp độ.',
    persona: `You are a leadership master coach. ${SHARED_RULE} Ask thought-provoking introspective questions regarding decision-making under uncertainty and organizational influence.`,
    opening: "True leadership begins with radical self-awareness. What is one personal blind spot that challenged your team dynamics recently?",
    openingVi: 'Khả năng lãnh đạo thực thụ bắt nguồn từ sự tự nhận thức sâu sắc. Đâu là một điểm mù cá nhân từng thử thách sự gắn kết trong nhóm của bạn gần đây?',
  },
  {
    id: 'ielts-examiner',
    name: 'Giám khảo Phòng thi IELTS Áp lực cao',
    status: 'live',
    tag: 'BAND 9 EXCLUSIVE',
    desc: 'Mô phỏng phòng thi IELTS Speaking 3 Parts với chế độ giám khảo nghiêm khắc, tự động ngắt lời, đổi giọng Anh/Úc/Mỹ và phát hiện học vẹt.',
    persona: `You are an austere, certified IELTS Speaking Senior Examiner. Strictly simulate Parts 1, 2, and 3. Enforce strict pacing, politely interrupt verbose or memorized canned answers, switch accents dynamically (British/Australian/American), and test Lexical Resource and Grammatical Range with sharp follow-up questions. ${SHARED_RULE}`,
    opening: "Good afternoon. My name is Dr. Harrison. This is the speaking assessment for the International English Language Testing System. Can you show me your identification, please?",
    openingVi: 'Chào buổi chiều. Tôi là Tiến sĩ Harrison. Đây là phần thi Nói trong kỳ thi IELTS. Bạn có thể cho tôi xem giấy tờ tùy thân được không?',
  },
  {
    id: 'profile',
    name: 'Gia sư Hồ sơ Cá nhân & Học thuật',
    status: 'live',
    tag: 'BAND 9 EXCLUSIVE',
    needsProfile: true,
    desc: 'Tải lên CV, bài luận du học hoặc tài liệu PDF học thuật để AI phỏng vấn xoáy sâu vào hồ sơ của bạn.',
    persona: `You are an Admissions Committee Director at an Ivy League university and Senior HR Partner. ${SHARED_RULE} Scrutinize the learner's uploaded resume or academic essay, cross-examine specific claims, and challenge them to justify their scholarly contributions.`,
    opening: "Welcome. I have thoroughly reviewed your curriculum vitae and academic statement. Could you elaborate on the empirical methodology you utilized in your primary project?",
    openingVi: 'Chào mừng bạn. Tôi đã xem xét kỹ hồ sơ lý lịch và bài luận học thuật của bạn. Bạn có thể giải thích rõ hơn về phương pháp nghiên cứu thực nghiệm trong dự án trọng tâm của mình?',
  },
  {
    id: 'phone',
    name: 'Gọi điện thoại',
    status: 'live',
    tag: 'MỚI',
    desc: 'Gia sư gọi cho bạn như một cuộc gọi thật (nhà hàng, phòng khám, công ty): nói ngắn, đúng vai, từng câu một.',
    persona: `You are a caller on a real phone call in English: a restaurant, clinic, office or delivery company. Speak in short, natural sentences like on a phone, stay in character and ask one question at a time. ${SHARED_RULE}`,
    opening: "Hello, this is Linh from Sunrise Restaurant. I'm calling to confirm your table booking for two tonight. Is this a good time to talk?",
    openingVi: 'Xin chào, đây là Linh từ nhà hàng Sunrise. Tôi gọi để xác nhận đặt bàn cho hai người tối nay. Bạn có tiện nói chuyện không?',
  },
  {
    id: 'diary',
    name: 'Nhật ký tiếng Anh',
    status: 'live',
    tag: 'MỚI',
    desc: 'Viết vài câu về ngày của bạn bằng tiếng Anh. Gia sư sửa một lỗi, khen cụm hay và hỏi tiếp để nhật ký dài thêm.',
    persona: `You are a friendly English diary coach. The learner writes a short diary entry (3-5 sentences) about their day or the prompt you gave. Point out one grammar or word-choice fix, praise one specific good phrase, and ask one follow-up question so the learner keeps writing. ${SHARED_RULE}`,
    opening: `Today's prompt: Describe one small thing that made you smile today. Write 3 to 5 sentences in English, then send them to me.`,
    openingVi: 'Gợi ý hôm nay: Hãy miêu tả một điều nhỏ bé khiến bạn mỉm cười hôm nay. Viết 3 đến 5 câu tiếng Anh rồi gửi cho tôi nhé.',
  },
];

/** Danh sách gia sư đầy đủ, đã gắn dữ liệu học cho từng gia sư đang live. */
export const TUTORS: Tutor[] = TUTOR_LIST.map((t) => (TUTOR_LEARNING[t.id] ? { ...t, ...TUTOR_LEARNING[t.id] } : t));

/** Các gia sư hiện trên lưới chính Luyện nói: chỉ gia sư đang live, theo HOME_TUTOR_IDS. */
export function homeTutors(): Tutor[] {
  return HOME_TUTOR_IDS.map((id) => TUTORS.find((t) => t.id === id)).filter(
    (t): t is Tutor => !!t && t.status === 'live'
  );
}

/** Gia sư chưa sẵn sàng: hiện gọn ở cuối danh sách. */
export function soonTutors(): Tutor[] {
  return TUTORS.filter((t) => t.status === 'soon');
}

export const DIARY_PROMPTS: string[] = [
  'Describe one small thing that made you smile today.',
  'What did you eat today, and did you enjoy it?',
  'Tell me about a place you went to this week.',
  'What is one thing you learned recently, and why was it useful?',
  'Describe your plans for tomorrow.',
  'Write about someone who helped you this week.',
  'What was the hardest part of your day, and how did you handle it?',
  'Describe your favourite time of day and what you usually do then.',
];

export function tutorById(id: string): Tutor | undefined {
  return TUTORS.find((t) => t.id === id);
}
