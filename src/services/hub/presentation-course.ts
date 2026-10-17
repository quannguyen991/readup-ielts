/**
 * Khoá Presentation Coach: ba cấp (cấu trúc, thiết kế slide, trình bày). Mỗi cấp gồm:
 * - LEARN: bài đọc ngắn có ví dụ;
 * - WATCH: phân tích một tình huống (mô tả bằng chữ, chưa có video);
 * - MAKEOVER: sửa một slide từ "trước" sang "sau" bằng một lựa chọn;
 * - EYE: so hai phương án và chọn cái nhìn nhanh hơn;
 * - QUIZ: bài kiểm tra có điểm; đạt PASS_SCORE thì cấp sau mở;
 * - CAPSTONE: thử thách tự kiểm bằng danh sách, mở sau khi đạt bài kiểm tra cấp.
 *
 * Hàm thuần, không phụ thuộc giao diện, nên test được bằng node:test. Nội dung hai thứ
 * tiếng: câu tiếng Anh mẫu dùng chung cho cả hai (helper `same`), phần giảng giải theo cặp vi/en.
 */

export type Bi = { vi: string; en: string };

export type LessonKind = 'LEARN' | 'WATCH' | 'MAKEOVER' | 'EYE' | 'QUIZ' | 'CAPSTONE';

export type CourseLevel = 1 | 2 | 3;

export type Choice = { q: Bi; options: Bi[]; answer: number; why: Bi };

export type Slide = { headline: Bi; bullets: Bi[] };

type Base = { id: string; level: CourseLevel; title: Bi; desc: Bi };

export type LearnLesson = Base & { kind: 'LEARN'; points: Bi[]; example: Bi };
export type WatchLesson = Base & { kind: 'WATCH'; scene: Bi; choice: Choice };
export type MakeoverLesson = Base & { kind: 'MAKEOVER'; before: Slide; after: Slide; choice: Choice };
export type EyeLesson = Base & { kind: 'EYE'; a: Slide; b: Slide; choice: Choice };
export type QuizLesson = Base & { kind: 'QUIZ'; questions: Choice[] };
export type CapstoneLesson = Base & { kind: 'CAPSTONE'; tasks: Bi[] };

export type Lesson = LearnLesson | WatchLesson | MakeoverLesson | EyeLesson | QuizLesson | CapstoneLesson;

export type Course = {
  id: string;
  title: Bi;
  blurb: Bi;
  levels: Record<CourseLevel, { title: Bi; subtitle: Bi }>;
  lessons: Lesson[];
};

/** Điểm tối thiểu (phần trăm) để đạt bài kiểm tra cấp và mở cấp sau. */
export const PASS_SCORE = 80;

/** Bài đã xong theo id bài học. Với QUIZ, `score` là điểm cao nhất đã đạt. */
export type DoneMap = Record<string, { at: string; score?: number }>;

export type LessonState = 'done' | 'open' | 'locked';

const pair = (vi: string, en: string): Bi => ({ vi, en });
const same = (s: string): Bi => ({ vi: s, en: s });

const L1_QUIZ: Choice[] = [
  {
    q: same('Which opening holds the audience best?'),
    options: [same('Today I will talk about our new project.'), same('Last week a customer almost left us. Here is what I changed.'), same('Hello, my name is Minh.')],
    answer: 1,
    why: pair('Câu chuyện có điểm căng và hứa một kết quả, nên người nghe muốn nghe tiếp.', 'A story with tension and a promised result makes people keep listening.'),
  },
  {
    q: same('Which sentence states a clear message?'),
    options: [same('Here are some thoughts on the project.'), same('We should pilot the new menu in two stores before we roll it out.'), same('The project has many aspects to consider.')],
    answer: 1,
    why: pair('Thông điệp có động từ và một kết quả cụ thể.', 'A message has a verb and a specific outcome.'),
  },
  {
    q: same('Which signposting works best?'),
    options: [same('Um, so, cost, team, stuff, risk.'), same('First, cost is low. Second, the team is ready. Finally, the risk is low if we pilot.'), same('Cost. Team. Risk. Maybe.')],
    answer: 1,
    why: pair('Từ chỉ thứ tự cho người nghe biết bạn đang ở ý nào.', 'Order words tell the audience where they are in the talk.'),
  },
  {
    q: same('Which closing is strongest?'),
    options: [same('Any questions?'), same('That is all from me.'), same('So I am asking us to approve the two-week pilot this Friday. Thank you.')],
    answer: 2,
    why: pair('Lời kêu gọi cụ thể cho biết người nghe nên làm gì tiếp theo.', 'A specific ask tells the audience exactly what to do next.'),
  },
  {
    q: same('How many main points should a five-minute talk have?'),
    options: [same('Ten'), same('Three at most'), same('As many as possible')],
    answer: 1,
    why: pair('Người nghe nhớ được vài ý; ba ý là giới hạn thực tế.', 'Listeners remember a handful of points; three is a practical ceiling.'),
  },
];

const L2_QUIZ: Choice[] = [
  {
    q: same('How many ideas should one slide carry?'),
    options: [same('One'), same('Three'), same('As many as fit')],
    answer: 0,
    why: pair('Một slide một ý: người nghe hiểu trong một cái nhìn.', 'One idea per slide: the audience gets it in one glance.'),
  },
  {
    q: same('Which headline is a claim?'),
    options: [same('Revenue'), same('Revenue rose in the South, led by retail'), same('Q3 slide')],
    answer: 1,
    why: pair('Câu đầy đủ có khẳng định là luận điểm; nhãn chỉ gọi tên chủ đề.', 'A full sentence that asserts something is a claim; a label only names a topic.'),
  },
  {
    q: same('How should a bullet list be used?'),
    options: [same('Read it aloud word for word'), same('Three short items you talk around'), same('Six long sentences')],
    answer: 1,
    why: pair('Slide chỉ gợi ý; bạn là người giải thích.', 'The slide hints; you do the explaining.'),
  },
  {
    q: same('What should a busy chart do?'),
    options: [same('Show every series with equal weight'), same('Highlight the one series that matters'), same('Hide the legend')],
    answer: 1,
    why: pair('Một biểu đồ chỉ nên trả lời một câu hỏi.', 'A chart should answer one question.'),
  },
  {
    q: same('Why does a text-heavy slide tire the audience?'),
    options: [same('They read instead of listening'), same('It uses too much color'), same('It loads slowly')],
    answer: 0,
    why: pair('Khi đọc, người nghe không còn nghe lời bạn.', 'While reading, people stop listening to you.'),
  },
];

const L3_QUIZ: Choice[] = [
  {
    q: same('What should a presenter do after the key number?'),
    options: [same('Move on at once'), same('Pause for about two seconds'), same('Read the next slide aloud')],
    answer: 1,
    why: pair('Khoảng lặng cho người nghe thời gian ghi nhận điều quan trọng.', 'A pause lets the audience take in the important point.'),
  },
  {
    q: same('Where should your eyes be most of the time?'),
    options: [same('On the screen'), same('On the audience'), same('On your notes')],
    answer: 1,
    why: pair('Ánh mắt giữ người nghe; màn hình chỉ để kiểm tra.', 'Your eyes keep the audience engaged; the screen is only for checking.'),
  },
  {
    q: same('What is a slide for?'),
    options: [same('A script for you'), same('A map for the audience: a headline and one visual'), same('A full transcript')],
    answer: 1,
    why: pair('Slide là bản đồ cho người nghe; phần chi tiết nằm trong lời nói.', 'A slide is a map for the audience; the detail lives in your speech.'),
  },
  {
    q: same('How should you handle a question you cannot answer yet?'),
    options: [same('Make up a number'), same('Say what you know and commit to a follow-up'), same('Skip the question')],
    answer: 1,
    why: pair('Trung thực về phần chưa biết và hẹn một việc cụ thể giữ được niềm tin.', 'Being honest about what you do not know and committing to a follow-up keeps trust.'),
  },
  {
    q: same('What makes a closing line strong?'),
    options: [same('A clear ask or a one-line summary'), same('"That is all."'), same('A long apology')],
    answer: 0,
    why: pair('Kết thúc bằng điều cụ thể để người nghe biết bước tiếp theo.', 'Ending on something concrete tells the audience the next step.'),
  },
];

export const PRESENTATION_COURSE: Course = {
  id: 'presentation',
  title: pair('Presentation Coach', 'Presentation Coach'),
  blurb: pair(
    'Thuyết trình rõ ý: cấu trúc bài nói, thiết kế slide và cách trình bày trước khán giả.',
    'Present with clear ideas: talk structure, slide design, and delivery in front of an audience.',
  ),
  levels: {
    1: { title: pair('Cấp 1 · Cấu trúc', 'Level 1 · Structure'), subtitle: pair('Mở đầu, nêu thông điệp, kết thúc', 'Open, state the message, close') },
    2: { title: pair('Cấp 2 · Thiết kế slide', 'Level 2 · Design your slides'), subtitle: pair('Slide hỗ trợ bạn, mỗi slide một ý', 'Slides that support you, one idea each') },
    3: { title: pair('Cấp 3 · Trình bày', 'Level 3 · Present with your slides'), subtitle: pair('Bạn mang thông điệp, slide chỉ đỡ phía sau', 'You carry the message; slides back you up') },
  },
  lessons: [
    // ---- Cấp 1: Cấu trúc
    {
      id: 'p1-hook', level: 1, kind: 'LEARN',
      title: pair('Mở đầu bằng một móc câu', 'Open with a hook'),
      desc: pair('Ba cách mở đầu giữ được người nghe trong mười giây đầu.', 'Three openings that hold attention in the first ten seconds.'),
      points: [
        pair('Mở bằng một câu hỏi, một con số hoặc một câu chuyện ngắn.', 'Start with a question, a number, or a short story.'),
        pair('Bỏ "Hôm nay tôi sẽ nói về..." vì người nghe đã biết điều đó.', 'Skip "Today I will talk about..." — the audience already knows that.'),
        pair('Móc câu phải dẫn thẳng tới thông điệp chính của bài.', 'The hook should lead straight to your main message.'),
      ],
      example: pair('Tuần trước, một khách hàng suýt bỏ chúng ta. Đây là điều tôi đã đổi.', 'Last week a customer almost left us. Here is what I changed.'),
    },
    {
      id: 'p1-one-point', level: 1, kind: 'LEARN',
      title: pair('Nêu thông điệp trước', 'State the one point first'),
      desc: pair('Cả bài xoay quanh một thông điệp, nói bằng một câu trước khi giải thích.', 'The talk revolves around one message, said in one sentence before you explain.'),
      points: [
        pair('Thông điệp tốt có động từ và kết quả: "Hãy chạy thử trước" thay vì "Đây là vài suy nghĩ".', 'A good message has a verb and an outcome: "Let us pilot first," not "Here are some thoughts."'),
        pair('Không tóm được trong một câu thì bài nói chưa có thông điệp.', 'If you cannot sum it up in one sentence, the talk has no message yet.'),
      ],
      example: pair('"Chúng ta nên chạy thử hai tuần ở một cửa hàng trước khi mở rộng."', 'We should run a two-week pilot in one store before we expand.'),
    },
    {
      id: 'p1-analyze', level: 1, kind: 'WATCH',
      title: pair('Phân tích: bài nói lan man', 'Analyze: the rambling talk'),
      desc: pair('Một bài nói ba phút và điều khiến nó khó theo dõi.', 'A three-minute talk, and why it is hard to follow.'),
      scene: pair(
        'Người nói kể lần lượt: doanh thu quý trước, một chuyến công tác, lịch họp mới, rồi quay lại doanh thu. Không câu nào nói họ muốn người nghe làm gì.',
        'The speaker covers last quarter’s revenue, a business trip, a new meeting schedule, then returns to revenue. No sentence says what they want the listener to do.',
      ),
      choice: {
        q: pair('Vấn đề chính của bài nói này là gì?', 'What is the main problem with this talk?'),
        options: [pair('Người nói nói quá nhanh.', 'The speaker talks too fast.'), pair('Không có thông điệp và lời kêu gọi rõ; các ý không dẫn tới một kết luận.', 'There is no clear message or ask; the points do not lead to one conclusion.'), pair('Thiếu số liệu cụ thể.', 'It lacks specific numbers.')],
        answer: 1,
        why: pair('Tốc độ và số liệu có thể cải thiện, nhưng gốc rễ là thiếu thông điệp để mọi ý cùng phục vụ.', 'Pace and numbers can improve, but the root issue is a missing message that every point should serve.'),
      },
    },
    {
      id: 'p1-makeover', level: 1, kind: 'MAKEOVER',
      title: pair('Mở đầu lan man thành một thông điệp', 'From a rambling intro to one message'),
      desc: pair('Sửa một slide mở đầu dài dòng thành một thông điệp.', 'Turn a padded intro slide into one message.'),
      before: { headline: pair('Giới thiệu', 'Introduction'), bullets: [same('About me'), same('Our background'), same("Today's agenda"), same('Some context'), same('Our history since 2009'), same('Why we are here'), same('Q&A at the end')] },
      after: { headline: pair('Chúng ta nên chạy thử hai tuần ở một cửa hàng', 'We should run a two-week pilot in one store'), bullets: [pair('Một ảnh chụp cửa hàng thử nghiệm', 'One photo of the test store')] },
      choice: {
        q: pair('Nếu chỉ giữ một điều, nên giữ gì?', 'If only one thing stays, what should it be?'),
        options: [same('Our history since 2009'), same('We should run a two-week pilot in one store'), same('The agenda has seven parts')],
        answer: 1,
        why: pair('Thông điệp là điều bạn muốn người nghe quyết định. Lịch sử và chương trình chỉ là bối cảnh.', 'The message is what you want the audience to decide. History and agenda are only context.'),
      },
    },
    {
      id: 'p1-eye', level: 1, kind: 'EYE',
      title: pair('Rèn mắt: nhãn hay luận điểm?', 'Train your eye: label or claim?'),
      desc: pair('Hai slide cùng chủ đề. Slide nào người nghe hiểu nhanh hơn?', 'Two slides on the same topic. Which one lands faster?'),
      a: { headline: pair('Chi phí, đội ngũ, rủi ro', 'Cost, team, risk'), bullets: [] },
      b: { headline: pair('Chạy thử giữ chi phí thấp và rủi ro nhỏ', 'A pilot keeps cost low and risk small'), bullets: [pair('Chi phí thấp', 'Low cost'), pair('Đội ngũ đã sẵn sàng', 'Team is ready')] },
      choice: {
        q: pair('Slide nào người nghe hiểu nhanh hơn?', 'Which slide lands faster?'),
        options: [pair('Slide A', 'Slide A'), pair('Slide B', 'Slide B')],
        answer: 1,
        why: pair('Slide B nêu luận điểm và lý do; slide A chỉ là nhãn, bắt người nghe tự đoán.', 'Slide B states the claim and its reasons; slide A is just a label that makes the audience guess.'),
      },
    },
    {
      id: 'p1-close', level: 1, kind: 'LEARN',
      title: pair('Kết thúc bằng lời kêu gọi', 'Land the close'),
      desc: pair('Kết bằng điều bạn muốn người nghe làm, hoặc bằng một câu tóm tắt.', 'End on what you want the listener to do, or on a one-line summary.'),
      points: [
        pair('Kết bằng điều cụ thể bạn muốn người nghe làm.', 'End with the specific thing you want the listener to do.'),
        pair('Tránh "Có câu hỏi gì không?": câu này trao cả phòng cho sự im lặng.', 'Avoid "Any questions?" — it hands the room a silence.'),
        pair('Cảm ơn đặt sau câu kết, không thay cho câu kết.', 'Say thank you after the close, not instead of it.'),
      ],
      example: pair('Tôi đề nghị chúng ta duyệt bản thử hai tuần vào thứ Sáu này. Cảm ơn mọi người.', 'I am asking us to approve the two-week pilot this Friday. Thank you.'),
    },
    {
      id: 'p1-check', level: 1, kind: 'QUIZ',
      title: pair('Kiểm tra cấp 1', 'Level 1 check'),
      desc: pair('Năm câu. Cần đạt 80% để mở cấp 2.', 'Five questions. Score 80% to unlock Level 2.'),
      questions: L1_QUIZ,
    },
    {
      id: 'p1-capstone', level: 1, kind: 'CAPSTONE',
      title: pair('Thử thách: bài nói ba slide', 'Capstone: pitch in three slides'),
      desc: pair('Viết cấu trúc ba slide cho một đề xuất thật của bạn.', 'Outline three slides for a real proposal of yours.'),
      tasks: [
        pair('Viết thông điệp chính trong một câu có động từ và kết quả.', 'Write your main message in one sentence with a verb and an outcome.'),
        pair('Làm ba slide: vấn đề, giải pháp, lời kêu gọi. Mỗi tiêu đề là một câu đầy đủ.', 'Make three slides: problem, solution, ask. Each headline is a full sentence.'),
        pair('Mở bằng móc câu và kết bằng lời kêu gọi.', 'Open with a hook and close with a clear ask.'),
        pair('Đọc to bài trong 90 giây và đối chiếu với danh sách này.', 'Read the talk aloud in 90 seconds and check it against this list.'),
      ],
    },

    // ---- Cấp 2: Thiết kế slide
    {
      id: 'p2-bullets', level: 2, kind: 'WATCH',
      title: pair('Phân tích: slide đầy chữ', 'Analyze: death by bullet points'),
      desc: pair('Một slide chín gạch đầu dòng và vì sao nó làm người nghe mệt.', 'A nine-bullet slide and why it exhausts the room.'),
      scene: pair(
        'Slide có tiêu đề "Kết quả quý 3" và chín gạch đầu dòng, mỗi dòng khoảng 15 chữ. Người thuyết trình đọc từng dòng, quay lưng về phía khán giả.',
        'The slide is titled "Q3 results" and has nine bullets of about 15 words each. The presenter reads every line with their back to the audience.',
      ),
      choice: {
        q: pair('Điều gì khiến slide này mệt?', 'What makes this slide exhausting?'),
        options: [pair('Màu nền quá tối.', 'The background is too dark.'), pair('Quá nhiều chữ: người nghe đọc thay vì nghe, và chữ tranh giành với lời nói.', 'Too much text: the audience reads instead of listening, and the words compete with your voice.'), pair('Thiếu logo công ty.', 'There is no company logo.')],
        answer: 1,
        why: pair('Khi slide đầy chữ, người nghe đọc trước và nghe sau. Slide chỉ nên gợi một ý; lời nói làm phần còn lại.', 'When a slide is full of text, the audience reads first and listens second. A slide should hint at one idea; your voice does the rest.'),
      },
    },
    {
      id: 'p2-one-idea', level: 2, kind: 'MAKEOVER',
      title: pair('Một ý mỗi slide', 'One idea per slide'),
      desc: pair('Cắt một slide sáu gạch đầu dòng xuống còn đúng một ý.', 'Cut a six-bullet slide down to its single point.'),
      before: { headline: pair('Chiến lược quý tới', 'Next quarter strategy'), bullets: [same('Raise marketing budget by 20%'), same('Hire two more engineers'), same('Launch the mobile app in February'), same('Cut operating costs'), same('Open an office in Da Nang'), same('Retrain the sales team')] },
      after: { headline: pair('Ra mắt bản di động vào tháng 2', 'Launch the mobile app in February'), bullets: [pair('Một ảnh chụp màn hình ứng dụng', 'One screenshot of the app')] },
      choice: {
        q: pair('Nếu chỉ giữ một ý, nên giữ ý nào?', 'If only one idea stays, which should it be?'),
        options: [same('Raise marketing budget by 20%'), same('Launch the mobile app in February'), same('Open an office in Da Nang')],
        answer: 1,
        why: pair('Ý này trả lời điều người nghe quan tâm nhất và gắn với quyết định cần đưa ra. Các ý còn lại đưa vào tài liệu phát hoặc bỏ.', 'It answers what the audience cares about most and ties to the decision on the table. The rest go to a handout or get cut.'),
      },
    },
    {
      id: 'p2-headline', level: 2, kind: 'LEARN',
      title: pair('Tiêu đề là luận điểm', 'Headline = the point'),
      desc: pair('Tiêu đề phải là một câu đầy đủ có khẳng định, không phải nhãn.', 'A headline should be a full claim, not a label.'),
      points: [
        pair('Nhãn như "Doanh thu" chỉ gọi tên chủ đề. Tiêu đề luận điểm nói điều bạn muốn người nghe tin.', 'A label like "Revenue" only names a topic. A claim headline says what you want the audience to believe.'),
        pair('Đọc riêng tiêu đề, người nghe vẫn phải hiểu slide muốn nói gì.', 'Read the headline alone, and the audience should still know the slide’s point.'),
        pair('Dùng tiêu đề thay cho chú thích; đừng thêm đoạn văn nhỏ bên dưới.', 'Use the headline instead of a caption; do not add a paragraph underneath.'),
      ],
      example: pair('Đổi "Doanh thu quý 3" thành "Doanh thu quý 3 tăng, nhờ kênh bán lẻ".', 'Change "Q3 revenue" to "Q3 revenue rose, driven by retail."'),
    },
    {
      id: 'p2-data', level: 2, kind: 'MAKEOVER',
      title: pair('Làm biểu đồ biết nói', 'Make the data speak'),
      desc: pair('Từ một biểu đồ rối đến một điều đáng nhớ.', 'From a busy chart to one thing worth remembering.'),
      before: { headline: pair('Doanh thu 12 tháng, 5 khu vực', 'Revenue for 12 months across 5 regions'), bullets: [pair('Biểu đồ đường có 5 màu, không có chú thích', 'A line chart with five colors and no labels')] },
      after: { headline: pair('Khu vực miền Nam tăng nhanh nhất trong ba tháng qua', 'The South grew fastest over the last three months'), bullets: [pair('Một đường tô đậm, bốn đường mờ', 'One bold line, four faded lines')] },
      choice: {
        q: pair('Nên làm nổi bật điều gì trên biểu đồ?', 'What should the chart highlight?'),
        options: [pair('Cả năm đường, mỗi đường một màu', 'All five lines, each in its own color'), pair('Một đường: khu vực đang thay đổi', 'One line: the region that changed'), pair('Chú thích dài ở chân trang', 'A long footnote')],
        answer: 1,
        why: pair('Biểu đồ phải trả lời một câu hỏi. Tô đậm đường cần chú ý, làm mờ phần còn lại.', 'A chart should answer one question. Bold the line that matters and fade the rest.'),
      },
    },
    {
      id: 'p2-eye', level: 2, kind: 'EYE',
      title: pair('Rèn mắt: slide sạch', 'Train your eye: clean slides'),
      desc: pair('Hai slide cùng nội dung. Slide nào người nghe nắm nhanh hơn?', 'Two slides with the same content. Which one is grasped faster?'),
      a: { headline: pair('Ba lý do chúng tôi chọn nhà cung cấp B', 'Three reasons we chose Supplier B'), bullets: [same('Lower price'), same('Faster delivery'), same('Better support team'), same('Strong references'), same('Flexible contract'), same('Local warehouse')] },
      b: { headline: pair('Nhà cung cấp B: giá thấp và giao nhanh', 'Supplier B: lower price, faster delivery'), bullets: [] },
      choice: {
        q: pair('Slide nào nắm nhanh hơn?', 'Which slide is grasped faster?'),
        options: [pair('Slide A', 'Slide A'), pair('Slide B', 'Slide B')],
        answer: 1,
        why: pair('Slide B chỉ giữ luận điểm; slide A buộc người nghe tự chọn điều quan trọng.', 'Slide B keeps only the claim; slide A makes the audience decide what matters.'),
      },
    },
    {
      id: 'p2-check', level: 2, kind: 'QUIZ',
      title: pair('Kiểm tra cấp 2', 'Level 2 check'),
      desc: pair('Năm câu. Cần đạt 80% để mở cấp 3.', 'Five questions. Score 80% to unlock Level 3.'),
      questions: L2_QUIZ,
    },
    {
      id: 'p2-capstone', level: 2, kind: 'CAPSTONE',
      title: pair('Thử thách: thiết kế lại một slide', 'Capstone: redesign a slide'),
      desc: pair('Lấy một slide cũ của bạn và cắt xuống còn một ý.', 'Take an old slide of yours and cut it to one point.'),
      tasks: [
        pair('Chọn một slide cũ có hơn năm gạch đầu dòng.', 'Pick an old slide with more than five bullets.'),
        pair('Viết lại tiêu đề thành một câu có khẳng định.', 'Rewrite the headline as a full claim.'),
        pair('Giữ một ý; chuyển phần còn lại sang ghi chú người nói hoặc bỏ.', 'Keep one idea; move the rest to speaker notes or cut it.'),
        pair('Nói luận điểm của slide trong mười giây mà không đọc slide.', 'Say the slide’s point out loud in ten seconds without reading it.'),
      ],
    },

    // ---- Cấp 3: Trình bày
    {
      id: 'p3-reader', level: 3, kind: 'WATCH',
      title: pair('Phân tích: người đọc slide', 'Analyze: the slide-reader'),
      desc: pair('Vì sao đọc từng chữ trên slide làm người nghe rời đi.', 'Why reading every word on the slide loses the room.'),
      scene: pair(
        'Người thuyết trình đọc to đúng từng chữ trên slide, và gần như suốt bài quay về phía màn hình. Sau hai phút, có người lấy điện thoại ra.',
        'The presenter reads every word on the slide aloud, facing the screen for most of the talk. After two minutes, someone takes out their phone.',
      ),
      choice: {
        q: pair('Chi tiết nào cho thấy người nghe đã mất tập trung?', 'Which detail shows the audience has lost focus?'),
        options: [pair('Slide có màu xanh.', 'The slide is blue.'), pair('Người nói quay về màn hình, và có người lấy điện thoại ra.', 'The speaker faces the screen, and someone takes out a phone.'), pair('Phần trình bày dài ba phút.', 'The talk runs three minutes.')],
        answer: 1,
        why: pair('Hai dấu hiệu đi cùng nhau: người nói đọc slide nên khán giả không còn lý do nhìn lên.', 'These go together: the speaker reads the slide, so the audience has no reason to look up.'),
      },
    },
    {
      id: 'p3-dont-read', level: 3, kind: 'MAKEOVER',
      title: pair('Đừng đọc slide', "Don't read your slides"),
      desc: pair('Biến slide đọc thành slide để nói.', 'Turn a slide to read into a slide to speak over.'),
      before: { headline: pair('Kết quả thử nghiệm', 'Pilot results'), bullets: [same('Our pilot reduced wait times across three stores.'), same('Customers said the new queue system was easier to use.'), same('Staff needed two weeks to learn the system.')] },
      after: { headline: pair('Thời gian chờ giảm ngay trong hai tuần đầu', 'Wait times fell within the first two weeks'), bullets: [pair('Một biểu đồ thời gian chờ trước và sau', 'One before-and-after wait-time chart')] },
      choice: {
        q: pair('Nên giữ gì trên slide?', 'What should stay on the slide?'),
        options: [pair('Mọi câu, để người nghe đọc sau', 'Every sentence, so people can read later'), pair('Tiêu đề và một hình; phần còn lại bạn nói', 'The headline and one visual; you say the rest'), pair('Ba câu, chữ nhỏ hơn', 'The three sentences, in a smaller font')],
        answer: 1,
        why: pair('Slide giữ điểm chính; chi tiết nằm trong lời nói.', 'The slide keeps the point; the detail lives in your speech.'),
      },
    },
    {
      id: 'p3-eye', level: 3, kind: 'LEARN',
      title: pair('Nhìn khán giả, không nhìn màn hình', 'Eye contact over the screen'),
      desc: pair('Giữ ánh mắt để bài nói như một cuộc trò chuyện.', 'Keep eye contact so the talk feels like a conversation.'),
      points: [
        pair('Nhìn một người trong hai đến ba giây, rồi chuyển sang người khác.', 'Hold one person for two or three seconds, then move to someone else.'),
        pair('Khi nói điểm quan trọng, đứng yên và nhìn thẳng vào phòng.', 'On a key point, stop moving and look straight at the room.'),
        pair('Để ghi chú ở chỗ liếc là thấy; đừng cúi xuống đọc.', 'Keep notes where you can glance at them; do not bend down to read.'),
      ],
      example: pair('Dừng một nhịp, nhìn một người ở hàng giữa, rồi nói: "Điều này thay đổi cách chúng ta làm việc."', 'Pause, look at someone in the middle row, then say: "This changes how we should work."'),
    },
    {
      id: 'p3-stage', level: 3, kind: 'EYE',
      title: pair('Rèn mắt: đứng ở đâu', 'Train your eye: where to stand'),
      desc: pair('Hai cách đứng trước khán giả. Cách nào giữ được ánh mắt người nghe?', 'Two ways to stand before an audience. Which keeps their eyes on you?'),
      a: { headline: pair('A. Đứng sau laptop', 'A. Standing behind the laptop'), bullets: [pair('Đọc theo màn hình', 'Reads from the screen'), pair('Quay lưng với khán giả phần lớn thời gian', 'Back turned for most of the talk')] },
      b: { headline: pair('B. Đứng cạnh màn hình', 'B. Standing beside the screen'), bullets: [pair('Nói với cả phòng', 'Speaks to the whole room'), pair('Liếc màn hình để kiểm tra', 'Glances at the screen to check')] },
      choice: {
        q: pair('Cách nào giữ được ánh mắt người nghe?', 'Which keeps the audience’s eyes?'),
        options: [pair('A', 'A'), pair('B', 'B')],
        answer: 1,
        why: pair('Người nói quay về khán giả; màn hình chỉ để kiểm tra.', 'The speaker faces the audience; the screen is only for checking.'),
      },
    },
    {
      id: 'p3-pause', level: 3, kind: 'WATCH',
      title: pair('Nhịp và khoảng lặng', 'Pacing and pauses'),
      desc: pair('Một khoảng lặng ngắn làm nổi bật ý quan trọng nhất.', 'A short pause makes your most important point land.'),
      scene: pair(
        'Người nói vừa đưa ra con số quan trọng nhất của cả bài, rồi chuyển ngay sang slide tiếp theo, không dừng lại.',
        'The presenter has just given the most important number of the talk, then moves straight to the next slide without a pause.',
      ),
      choice: {
        q: pair('Nên làm gì ngay sau con số quan trọng?', 'What should the presenter do right after the key number?'),
        options: [pair('Chuyển slide ngay để giữ nhịp', 'Move to the next slide at once to keep the pace'), pair('Dừng khoảng hai giây để người nghe kịp ghi nhận', 'Pause about two seconds so the audience can take it in'), pair('Hỏi ngay "Có ai có câu hỏi không?"', 'Ask at once, "Any questions?"')],
        answer: 1,
        why: pair('Khoảng lặng cho người nghe thời gian hiểu và ghi nhớ.', 'A pause gives the audience time to understand and remember.'),
      },
    },
    {
      id: 'p3-qa', level: 3, kind: 'LEARN',
      title: pair('Trả lời câu hỏi khó', 'Handle a hard question'),
      desc: pair('Ba bước trả lời mà không hoảng hay né tránh.', 'Three steps to answer without panicking or dodging.'),
      points: [
        pair('Nhắc lại câu hỏi bằng lời của bạn để cả phòng cùng nghe.', 'Restate the question in your own words so the whole room hears it.'),
        pair('Trả lời phần bạn biết; nói rõ phần bạn chưa biết.', 'Answer what you know; say clearly what you do not know yet.'),
        pair('Nếu cần, hẹn một việc cụ thể: "Tôi sẽ gửi số liệu sau buổi này."', 'If needed, commit to a specific follow-up: "I will send the figures after this session."'),
      ],
      example: pair('Bạn hỏi về rủi ro chi phí. Hiện tôi chưa có con số chính xác; tôi sẽ gửi sau buổi này.', 'You ask about cost risk. I do not have the exact figure yet; I will send it after this session.'),
    },
    {
      id: 'p3-check', level: 3, kind: 'QUIZ',
      title: pair('Kiểm tra cấp 3', 'Level 3 check'),
      desc: pair('Năm câu. Cần đạt 80% để hoàn thành khoá.', 'Five questions. Score 80% to finish the course.'),
      questions: L3_QUIZ,
    },
    {
      id: 'p3-capstone', level: 3, kind: 'CAPSTONE',
      title: pair('Thử thách: bài nói ba phút', 'Capstone: a three-minute talk'),
      desc: pair('Gom cả ba cấp vào một bài nói ngắn.', 'Bring all three levels into one short talk.'),
      tasks: [
        pair('Chuẩn bị ba slide; mỗi tiêu đề là một câu đầy đủ.', 'Prepare three slides; each headline is a full sentence.'),
        pair('Mở bằng móc câu, kết bằng lời kêu gọi.', 'Open with a hook, close with a clear ask.'),
        pair('Nói ba phút mà không đọc slide; nhìn khán giả khi nêu điểm chính.', 'Speak for three minutes without reading the slides; look at the audience on key points.'),
        pair('Dừng một nhịp sau con số hoặc ý quan trọng nhất.', 'Pause for a beat after your most important number or point.'),
        pair('Tự kiểm: ghi âm hoặc luyện trước gương, rồi đánh dấu từng mục.', 'Self-check: record yourself or rehearse in a mirror, then tick each item.'),
      ],
    },
  ],
};

export const COURSES: Course[] = [PRESENTATION_COURSE];

export function courseById(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function findLesson(id: string): { course: Course; lesson: Lesson } | undefined {
  for (const course of COURSES) {
    const lesson = course.lessons.find((l) => l.id === id);
    if (lesson) return { course, lesson };
  }
  return undefined;
}

/** Bài đã xong: QUIZ chỉ tính khi điểm cao nhất đạt PASS_SCORE; các bài khác chỉ cần có mốc thời gian. */
export function isDone(lesson: Lesson, done: DoneMap): boolean {
  const rec = done[lesson.id];
  if (!rec) return false;
  if (lesson.kind === 'QUIZ') return (rec.score ?? 0) >= PASS_SCORE;
  return true;
}

export function lessonsOfLevel(course: Course, level: CourseLevel): Lesson[] {
  return course.lessons.filter((l) => l.level === level);
}

export function quizOfLevel(course: Course, level: CourseLevel): QuizLesson | undefined {
  return course.lessons.find((l): l is QuizLesson => l.kind === 'QUIZ' && l.level === level);
}

/** Cấp 1 luôn mở. Cấp n mở khi bài kiểm tra cấp n−1 đã đạt. */
export function levelUnlocked(course: Course, level: CourseLevel, done: DoneMap): boolean {
  if (level === 1) return true;
  const prev = quizOfLevel(course, (level - 1) as CourseLevel);
  return prev ? isDone(prev, done) : false;
}

/**
 * Trạng thái một bài:
 * - đã xong → done;
 * - cấp chưa mở → locked;
 * - QUIZ mở khi mọi bài LEARN/WATCH/MAKEOVER/EYE của cấp đã xong;
 * - CAPSTONE mở khi bài kiểm tra của cấp đã đạt;
 * - còn lại mở ngay trong cấp đã mở.
 */
export function lessonState(course: Course, lesson: Lesson, done: DoneMap): LessonState {
  if (isDone(lesson, done)) return 'done';
  if (!levelUnlocked(course, lesson.level, done)) return 'locked';
  if (lesson.kind === 'QUIZ') {
    const before = lessonsOfLevel(course, lesson.level).filter((l) => l.kind !== 'QUIZ' && l.kind !== 'CAPSTONE');
    return before.every((l) => isDone(l, done)) ? 'open' : 'locked';
  }
  if (lesson.kind === 'CAPSTONE') {
    const quiz = quizOfLevel(course, lesson.level);
    return quiz && isDone(quiz, done) ? 'open' : 'locked';
  }
  return 'open';
}

export function courseProgress(course: Course, done: DoneMap): { done: number; total: number } {
  return { done: course.lessons.filter((l) => isDone(l, done)).length, total: course.lessons.length };
}

export function levelProgress(course: Course, level: CourseLevel, done: DoneMap): { done: number; total: number } {
  const list = lessonsOfLevel(course, level);
  return { done: list.filter((l) => isDone(l, done)).length, total: list.length };
}

export function nextLesson(course: Course, lesson: Lesson): Lesson | undefined {
  const i = course.lessons.findIndex((l) => l.id === lesson.id);
  return i >= 0 ? course.lessons[i + 1] : undefined;
}

/** Chấm bài kiểm tra: câu bỏ trống (null) tính là sai. */
export function gradeQuiz(questions: Choice[], picks: (number | null)[]): { correct: number; total: number; score: number; passed: boolean } {
  const total = questions.length;
  const correct = questions.reduce((n, q, i) => n + (picks[i] === q.answer ? 1 : 0), 0);
  const score = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { correct, total, score, passed: score >= PASS_SCORE };
}

/**
 * Gộp tiến độ khoá giữa máy này và tài khoản: hợp các bài đã xong; bài có cả hai bên thì
 * lấy mốc sớm nhất và điểm cao nhất. Không bao giờ làm mất bài đã xong ở bên nào.
 */
export function mergeCourseDone(local: unknown, remote: unknown | null): { done: DoneMap } {
  const a = ((local as { done?: DoneMap } | null)?.done ?? {}) as DoneMap;
  const b = ((remote as { done?: DoneMap } | null)?.done ?? {}) as DoneMap;
  const out: DoneMap = { ...b };
  for (const [id, rec] of Object.entries(a)) {
    const other = out[id];
    if (!other) {
      out[id] = rec;
      continue;
    }
    const score = Math.max(rec.score ?? -1, other.score ?? -1);
    out[id] = { at: other.at < rec.at ? other.at : rec.at, ...(score >= 0 ? { score } : {}) };
  }
  return { done: out };
}
