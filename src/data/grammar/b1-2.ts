import type { GrammarLessonDetail } from './types';

/** Cấp B1 (phần bổ sung): tương lai tiếp diễn, be used to, câu điều kiện loại 0, so sánh nhất, đại từ phản thân. */
export const B1_GRAMMAR_EXTRA: GrammarLessonDetail[] = [
  {
    id: 'b1-future-continuous',
    level: 'B1',
    order: 10,
    title: 'Tương lai tiếp diễn',
    titleEn: 'Future Continuous',
    summary: 'Diễn tả hành động sẽ đang diễn ra tại một thời điểm xác định trong tương lai.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Tương lai tiếp diễn là gì?',
        body: 'Tương lai tiếp diễn diễn tả một hành động sẽ **đang diễn ra** tại một thời điểm xác định trong tương lai. Cấu trúc gồm will be cộng V-ing.',
        formula: 'S + will be + V-ing',
        examples: [
          { en: 'This time tomorrow, I will be flying to Tokyo.', vi: 'Vào giờ này ngày mai, tôi sẽ đang bay đi Tokyo.', mark: 'will be flying' },
          { en: 'At 8 p.m., they will be watching the match.', vi: 'Lúc 8 giờ tối, họ sẽ đang xem trận đấu.', mark: 'will be watching' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Ba trường hợp thường gặp',
        body: 'Dùng khi muốn nói về một thời điểm trong tương lai mà hành động đang diễn ra.',
        bullets: [
          'Hành động đang diễn ra tại một mốc tương lai: At 9 a.m. tomorrow, I will be working.',
          'Hành động đã được lên lịch như một phần việc thường lệ: We will be meeting the client next week.',
          'Hỏi một cách lịch sự về kế hoạch: Will you be using the car tonight?',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Dấu hiệu thời điểm xác định',
        body: 'Thường có cụm chỉ thời điểm cụ thể như this time tomorrow, at 6 p.m. on Friday, this time next year.',
        examples: [
          { en: 'This time next week, we will be lying on the beach.', vi: 'Vào giờ này tuần sau, chúng tôi sẽ đang nằm trên bãi biển.', mark: 'This time next week' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Tương lai tiếp diễn và tương lai đơn',
        body: 'Tương lai đơn (will + V) nói về quyết định hoặc sự việc sẽ hoàn tất. Tương lai tiếp diễn nhấn vào quá trình đang diễn ra tại một thời điểm.',
        examples: [
          { en: 'I will call you tomorrow.', vi: 'Ngày mai tôi sẽ gọi cho bạn.', mark: 'will call' },
          { en: "Don't call at 8; I will be sleeping then.", vi: 'Đừng gọi lúc 8 giờ; lúc đó tôi sẽ đang ngủ.', mark: 'will be sleeping' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là quên V-ing sau will be, hoặc dùng tiếp diễn với động từ chỉ trạng thái.',
        mistakes: [
          { wrong: 'At this time tomorrow, I will be study.', right: 'At this time tomorrow, I will be studying.', why: 'Sau will be dùng V-ing.' },
          { wrong: 'I will be knowing the answer soon.', right: 'I will know the answer soon.', why: 'Know là động từ chỉ trạng thái, thường không dùng ở dạng tiếp diễn.' },
        ],
      },
    ],
    quiz: [
      { q: 'This time tomorrow, I ___ to Da Nang.', options: ['will be fly', 'fly', 'will be flying'], answer: 2, explain: 'Hành động đang diễn ra tại một thời điểm tương lai dùng will be V-ing.' },
      { q: "Don't call me at 9 a.m. tomorrow. I ___ a meeting.", options: ['will be attending', 'will be attend', 'attending'], answer: 0, explain: 'Will be cộng V-ing: will be attending.' },
      { q: 'Will you ___ the car tonight?', options: ['will use', 'be using', 'using'], answer: 1, explain: 'Hỏi về kế hoạch lịch sự dùng Will you be using.' },
      { q: 'I ___ the answer soon.', options: ['am knowing', 'will be knowing', 'will know'], answer: 2, explain: 'Know là động từ trạng thái nên dùng will know.' },
      { q: 'Choose the correct sentence.', options: ['At this time next year, I will living abroad.', 'At this time next year, I am live abroad.', 'At this time next year, I will be living abroad.'], answer: 2, explain: 'Cấu trúc đúng là will be cộng V-ing.' },
    ],
  },
  {
    id: 'b1-be-used-to',
    level: 'B1',
    order: 11,
    title: 'Be used to và get used to',
    titleEn: 'Be Used To and Get Used To',
    summary: 'Nói về việc đã quen hoặc đang làm quen với một điều gì đó.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Be used to là gì?',
        body: 'Be used to cộng V-ing hoặc danh từ nghĩa là đã quen với điều gì đó. Get used to nghĩa là đang dần quen với điều đó.',
        formula: 'be / get used to + V-ing hoặc danh từ',
        examples: [
          { en: 'I am used to waking up early.', vi: 'Tôi đã quen với việc dậy sớm.', mark: 'am used to waking up early' },
          { en: 'She is getting used to her new job.', vi: 'Cô ấy đang dần quen với công việc mới.', mark: 'getting used to' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Phân biệt với used to',
        body: 'Ba cấu trúc gần giống nhau về hình thức nhưng khác nghĩa hoàn toàn.',
        bullets: [
          'Used to + V: thói quen trong quá khứ (I used to play football.)',
          'Be used to + V-ing: đã quen với điều gì (I am used to driving.)',
          'Get used to + V-ing: đang làm quen (I am getting used to driving.)',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'To ở đây là giới từ',
        body: 'Trong be used to, to là giới từ nên theo sau là V-ing hoặc danh từ, không theo sau là động từ nguyên mẫu.',
        examples: [
          { en: 'He is used to the cold weather here.', vi: 'Anh ấy đã quen với thời tiết lạnh ở đây.', mark: 'used to the cold weather' },
          { en: 'We are used to eating late.', vi: 'Chúng tôi đã quen ăn muộn.', mark: 'used to eating late' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Thay đổi be hoặc get theo thì',
        body: 'Thay be hoặc get theo thì và chủ ngữ. Phủ định thêm not sau be hoặc didn\'t sau get.',
        examples: [
          { en: 'When I moved to Hanoi, I was not used to the traffic.', vi: 'Khi chuyển đến Hà Nội, tôi chưa quen với giao thông.', mark: 'was not used to the traffic' },
          { en: 'You will soon get used to the new schedule.', vi: 'Bạn sẽ sớm quen với lịch mới.', mark: 'will soon get used to' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng động từ nguyên mẫu sau be used to, hoặc dùng be used to để nói thói quen trong quá khứ.',
        mistakes: [
          { wrong: 'She is used to eat spicy food.', right: 'She is used to eating spicy food.', why: 'To là giới từ nên theo sau là V-ing.' },
          { wrong: 'I am used to play tennis when I was a child.', right: 'I used to play tennis when I was a child.', why: 'Thói quen trong quá khứ dùng used to cộng động từ nguyên mẫu.' },
        ],
      },
    ],
    quiz: [
      { q: 'I am ___ working late every night.', options: ['used to', 'use to', 'used'], answer: 0, explain: 'Be used to cộng V-ing: đã quen với việc làm muộn.' },
      { q: 'She ___ live in a small town, but now she lives in the city.', options: ['is used to', 'used to', 'gets used to'], answer: 1, explain: 'Used to cộng V nguyên mẫu nói về thói quen trong quá khứ.' },
      { q: 'It was hard at first, but I am ___ the noise now.', options: ['got used to', 'get used to', 'getting used to'], answer: 2, explain: 'Đang dần quen dùng getting used to.' },
      { q: 'After years in London, he ___ the cold.', options: ['used to', 'is used to', 'is use to'], answer: 1, explain: 'Đã quen với cái lạnh dùng is used to.' },
      { q: 'Choose the correct sentence.', options: ['I used to playing football every weekend.', 'I am used play football every weekend.', 'I used to play football every weekend.'], answer: 2, explain: 'Used to đi với động từ nguyên mẫu.' },
    ],
  },
  {
    id: 'b1-zero-conditional',
    level: 'B1',
    order: 12,
    title: 'Câu điều kiện loại 0',
    titleEn: 'Zero Conditional',
    summary: 'Diễn tả sự thật hiển nhiên, quy luật và thói quen luôn đúng khi điều kiện xảy ra.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Câu điều kiện loại 0 là gì?',
        body: 'Dùng để nói một sự thật hiển nhiên, quy luật tự nhiên hoặc thói quen luôn đúng. Cả hai vế đều dùng hiện tại đơn.',
        formula: 'If + S + V (hiện tại đơn), S + V (hiện tại đơn)',
        examples: [
          { en: 'If you heat ice, it melts.', vi: 'Nếu bạn đun nóng đá, nó sẽ tan.', mark: 'it melts' },
          { en: 'If I am tired, I go to bed early.', vi: 'Khi tôi mệt, tôi đi ngủ sớm.', mark: 'I go to bed early' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các trường hợp thường gặp',
        body: 'Loại câu này xuất hiện khi nói về khoa học, quy định và thói quen.',
        bullets: [
          'Sự thật khoa học: If water reaches 100 degrees, it boils.',
          'Quy định, hướng dẫn: If the light is red, you must stop.',
          'Thói quen: If it rains, we stay at home.',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Có thể thay if bằng when',
        body: 'Khi nói về quy luật lặp lại, có thể thay if bằng when mà nghĩa không đổi.',
        examples: [
          { en: 'When water freezes, it expands.', vi: 'Khi nước đóng băng, nó nở ra.', mark: 'When water freezes' },
          { en: 'When I feel stressed, I go for a walk.', vi: 'Mỗi khi căng thẳng, tôi đi dạo.', mark: 'When I feel stressed' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Unless và as soon as',
        body: 'Unless nghĩa là "trừ khi, nếu không", đi với mệnh đề khẳng định. As soon as nghĩa là "ngay khi", thường dùng hiện tại đơn ở cả hai vế.',
        examples: [
          { en: 'Plants die unless they get water.', vi: 'Cây sẽ chết nếu không được tưới nước.', mark: 'unless they get water' },
          { en: 'As soon as the bell rings, the students leave the room.', vi: 'Ngay khi chuông reo, học sinh rời khỏi lớp.', mark: 'As soon as the bell rings' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng will trong câu nói về quy luật, hoặc dùng not sau unless.',
        mistakes: [
          { wrong: 'If you will heat ice, it will melt.', right: 'If you heat ice, it melts.', why: 'Quy luật chung dùng hiện tại đơn ở cả hai vế.' },
          { wrong: 'Unless you do not water plants, they die.', right: 'Unless you water plants, they die.', why: 'Unless đã mang nghĩa phủ định nên không dùng not nữa.' },
        ],
      },
    ],
    quiz: [
      { q: 'If you ___ metal, it expands.', options: ['will heat', 'heat', 'heated'], answer: 1, explain: 'Quy luật chung dùng hiện tại đơn.' },
      { q: 'When water ___ 0 degrees, it turns into ice.', options: ['reaches', 'will reach', 'reached'], answer: 0, explain: 'Sự thật khoa học dùng hiện tại đơn ở vế có when.' },
      { q: 'Plants die ___ they receive water.', options: ['although', 'unless', 'because'], answer: 1, explain: 'Unless nghĩa là nếu không.' },
      { q: 'If I ___ coffee at night, I can\'t sleep.', options: ['will drink', 'drank', 'drink'], answer: 2, explain: 'Thói quen luôn đúng dùng hiện tại đơn.' },
      { q: 'Choose the correct sentence.', options: ['If you will press the button, the machine starts.', 'If you pressed the button, the machine starts.', 'If you press the button, the machine starts.'], answer: 2, explain: 'Câu điều kiện loại 0 dùng hiện tại đơn ở cả hai vế.' },
    ],
  },
  {
    id: 'b1-superlatives',
    level: 'B1',
    order: 13,
    title: 'So sánh nhất',
    titleEn: 'Superlative Adjectives',
    summary: 'Nói ai hoặc cái gì đứng đầu hoặc đứng cuối trong một nhóm.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'So sánh nhất là gì?',
        body: 'So sánh nhất dùng để nói một đối tượng vượt trội nhất hoặc kém nhất trong một nhóm. Luôn đi với the.',
        formula: 'the + tính từ-est  /  the most + tính từ dài',
        examples: [
          { en: 'Fansipan is the highest mountain in Vietnam.', vi: 'Fansipan là ngọn núi cao nhất Việt Nam.', mark: 'the highest mountain' },
          { en: 'This is the most interesting book I have read.', vi: 'Đây là cuốn sách thú vị nhất mà tôi từng đọc.', mark: 'the most interesting book' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Khi nào dùng so sánh nhất',
        body: 'So sánh nhất dùng khi so một đối tượng với cả nhóm.',
        bullets: [
          'Trong một nhóm: the tallest student in class',
          'Với in hoặc of: the best in the world, the oldest of the three',
          'Với ever: the best film I have ever seen',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Tính từ ngắn và tính từ dài',
        body: 'Tính từ một âm tiết thêm -est. Tính từ hai âm tiết trở lên dùng the most. Tính từ tận cùng bằng -y đổi thành -iest, ví dụ happy thành the happiest.',
        examples: [
          { en: 'She is the youngest in her family.', vi: 'Cô ấy là người nhỏ nhất trong nhà.', mark: 'the youngest' },
          { en: 'It was the most expensive hotel in the city.', vi: 'Đó là khách sạn đắt nhất thành phố.', mark: 'the most expensive' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Dạng bất quy tắc',
        body: 'Good thành the best, bad thành the worst, far thành the furthest hoặc the farthest.',
        examples: [
          { en: 'Hanoi has the best street food in my opinion.', vi: 'Theo tôi, Hà Nội có đồ ăn đường phố ngon nhất.', mark: 'the best street food' },
          { en: 'That was the worst day of my life.', vi: 'Đó là ngày tệ nhất đời tôi.', mark: 'the worst day' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng more cùng với -est, hoặc dùng most với good.',
        mistakes: [
          { wrong: 'She is more tallest in the class.', right: 'She is the tallest in the class.', why: 'Không dùng more và -est cùng lúc.' },
          { wrong: 'It is the most good book.', right: 'It is the best book.', why: 'Good có dạng so sánh nhất bất quy tắc là best.' },
        ],
      },
    ],
    quiz: [
      { q: 'He is ___ student in the class.', options: ['the tallest', 'tallest', 'the most tall'], answer: 0, explain: 'So sánh nhất của tall là the tallest.' },
      { q: 'This is ___ film I have ever seen.', options: ['the good', 'the best', 'best of'], answer: 1, explain: 'So sánh nhất bất quy tắc của good là the best.' },
      { q: 'Ha Long Bay is ___ place in the north.', options: ['the more beautiful', 'beautifullest', 'the most beautiful'], answer: 2, explain: 'Tính từ dài dùng the most.' },
      { q: 'She is ___ of the three sisters.', options: ['the younger', 'the youngest', 'the most young'], answer: 1, explain: 'So sánh nhất của young là the youngest.' },
      { q: 'Choose the correct sentence.', options: ['It is the best day ever.', 'It is the most good day ever.', 'It is more best day ever.'], answer: 0, explain: 'Good có dạng so sánh nhất là best.' },
    ],
  },
  {
    id: 'b1-reflexive-pronouns',
    level: 'B1',
    order: 14,
    title: 'Đại từ phản thân',
    titleEn: 'Reflexive Pronouns',
    summary: 'Dùng myself, yourself và các dạng khác để chỉ việc tự làm hoặc để nhấn mạnh.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Đại từ phản thân là gì?',
        body: 'Đại từ phản thân kết thúc bằng -self hoặc -selves: myself, yourself, himself, herself, itself, ourselves, yourselves, themselves. Chúng chỉ việc chủ ngữ tự làm với chính mình.',
        examples: [
          { en: 'She cut herself while cooking.', vi: 'Cô ấy bị đứt tay khi nấu ăn.', mark: 'herself' },
          { en: 'We taught ourselves to swim.', vi: 'Chúng tôi tự học bơi.', mark: 'ourselves' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Hai chức năng chính',
        body: 'Đại từ phản thân có hai vai trò: làm tân ngữ phản thân và nhấn mạnh.',
        bullets: [
          'Phản thân: chủ ngữ và tân ngữ là cùng một người (He hurt himself.)',
          'Nhấn mạnh: người đó tự làm, không nhờ ai (I cooked the dinner myself.)',
          'Cụm cố định: by myself (một mình), enjoy yourself (vui vẻ)',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Dạng số ít và số nhiều',
        body: 'Số ít: myself, yourself, himself, herself, itself. Số nhiều: ourselves, yourselves, themselves. Yourself dùng cho một người, yourselves cho nhiều người.',
        examples: [
          { en: 'Did you enjoy yourselves at the party?', vi: 'Các bạn có vui ở bữa tiệc không?', mark: 'yourselves' },
          { en: 'The children made the cake themselves.', vi: 'Bọn trẻ tự làm chiếc bánh.', mark: 'themselves' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Nhấn mạnh với đại từ phản thân',
        body: 'Đại từ phản thân nhấn mạnh có thể đứng ngay sau chủ ngữ hoặc cuối câu. Ý nghĩa là chính người đó, không ai khác.',
        examples: [
          { en: 'The manager himself approved the plan.', vi: 'Chính giám đốc đã phê duyệt kế hoạch.', mark: 'The manager himself' },
          { en: 'I will check the document myself.', vi: 'Chính tôi sẽ kiểm tra tài liệu.', mark: 'myself' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là viết sai dạng như hisself, hoặc đặt đại từ phản thân làm chủ ngữ.',
        mistakes: [
          { wrong: 'He hurt hisself.', right: 'He hurt himself.', why: 'Dạng đúng là himself.' },
          { wrong: 'Myself went to the market.', right: 'I went to the market myself.', why: 'Chủ ngữ phải là đại từ nhân xưng I, myself chỉ dùng để nhấn mạnh.' },
        ],
      },
    ],
    quiz: [
      { q: 'He taught ___ to play the guitar.', options: ['himself', 'hisself', 'him'], answer: 0, explain: 'Tự học nghĩa là dùng himself.' },
      { q: 'The students cleaned the classroom ___.', options: ['them', 'themselves', 'theirs'], answer: 1, explain: 'Themselves cho nghĩa họ tự dọn lớp.' },
      { q: 'I cut ___ while I was cooking.', options: ['myself', 'me', 'I'], answer: 0, explain: 'Chủ ngữ và tân ngữ là một người nên dùng myself.' },
      { q: 'We enjoyed ___ at the beach.', options: ['us', 'our', 'ourselves'], answer: 2, explain: 'Enjoy ourselves nghĩa là vui vẻ.' },
      { q: 'Choose the correct sentence.', options: ['Myself went to the bank.', 'I went to the bank myself.', 'Me went to the bank myself.'], answer: 1, explain: 'Myself dùng để nhấn mạnh sau chủ ngữ I.' },
    ],
  },
];
