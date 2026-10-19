import type { GrammarLessonDetail } from './types';

/** Cấp A2 (phần bổ sung): trạng từ cách thức, so sánh bằng, giới từ thời gian, lời đề nghị. */
export const A2_GRAMMAR_EXTRA: GrammarLessonDetail[] = [
  {
    id: 'a2-adverbs-manner',
    level: 'A2',
    order: 9,
    title: 'Trạng từ chỉ cách thức',
    titleEn: 'Adverbs of Manner',
    summary: 'Mô tả cách một hành động được làm bằng trạng từ đúng dạng.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Trạng từ chỉ cách thức là gì?',
        body: 'Trạng từ chỉ cách thức cho biết hành động được làm **như thế nào**. Phần lớn được tạo từ tính từ bằng cách thêm -ly.',
        formula: 'Tính từ + -ly = trạng từ (quick thành quickly)',
        examples: [
          { en: 'She speaks English fluently.', vi: 'Cô ấy nói tiếng Anh trôi chảy.', mark: 'fluently' },
          { en: 'He drove carefully in the rain.', vi: 'Anh ấy lái xe cẩn thận trong mưa.', mark: 'carefully' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Vị trí của trạng từ cách thức',
        body: 'Trạng từ cách thức thường đứng sau động từ chính hoặc sau tân ngữ.',
        bullets: [
          'Sau động từ: She sings beautifully.',
          'Sau tân ngữ: He opened the letter carefully.',
          'Good thành well: He plays the piano well. (không dùng goodly)',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Quy tắc thêm -ly',
        body: 'Thêm -ly vào tính từ. Nếu tính từ kết thúc bằng phụ âm và y, đổi y thành i rồi thêm -ly. Nếu kết thúc bằng -le, bỏ e rồi thêm -y.',
        examples: [
          { en: 'The children were happy, so they played happily.', vi: 'Bọn trẻ vui nên chơi đùa rất vui vẻ.', mark: 'happily' },
          { en: 'She answered the question easily.', vi: 'Cô ấy trả lời câu hỏi một cách dễ dàng.', mark: 'easily' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Trạng từ bất quy tắc',
        body: 'Một số tính từ có dạng trạng từ đặc biệt: good thành well. Hard và fast giữ nguyên dạng khi làm trạng từ.',
        examples: [
          { en: 'He works hard every day.', vi: 'Anh ấy làm việc chăm chỉ mỗi ngày.', mark: 'works hard' },
          { en: 'She speaks English well.', vi: 'Cô ấy nói tiếng Anh tốt.', mark: 'speaks English well' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng tính từ thay cho trạng từ sau động từ.',
        mistakes: [
          { wrong: 'She speaks English good.', right: 'She speaks English well.', why: 'Trạng từ bổ nghĩa cho động từ speaks dùng well.' },
          { wrong: 'He drove careful.', right: 'He drove carefully.', why: 'Bổ nghĩa cho động từ phải dùng trạng từ có -ly.' },
        ],
      },
    ],
    quiz: [
      { q: 'She sings ___.', options: ['beautiful', 'beautifully', 'beauty'], answer: 1, explain: 'Bổ nghĩa cho động từ sings dùng trạng từ beautifully.' },
      { q: 'He plays the guitar ___.', options: ['well', 'good', 'goodly'], answer: 0, explain: 'Good thành well khi làm trạng từ.' },
      { q: 'The baby slept ___ all night.', options: ['peace', 'peaceful', 'peacefully'], answer: 2, explain: 'Trạng từ cách thức là peacefully.' },
      { q: 'The students listened ___ to the teacher.', options: ['attentively', 'attentive', 'attention'], answer: 0, explain: 'Trạng từ của attentive là attentively.' },
      { q: 'Choose the correct sentence.', options: ['He quick ran to the station.', 'He ran quickly to the station.', 'He ran quick to the station.'], answer: 1, explain: 'Quickly bổ nghĩa cho động từ ran.' },
    ],
  },
  {
    id: 'a2-as-as-less-least',
    level: 'A2',
    order: 10,
    title: 'So sánh bằng và less, least',
    titleEn: 'As...As, Less and Least',
    summary: 'So sánh hai thứ ngang nhau hoặc so sánh mức độ thấp nhất trong một nhóm.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'So sánh bằng là gì?',
        body: 'Dùng as + tính từ hoặc trạng từ + as để nói hai thứ bằng nhau. Dùng not as + tính từ + as để nói thứ này kém hơn thứ kia.',
        formula: 'as + adj / adv + as  ·  not as + adj / adv + as',
        examples: [
          { en: 'Ha Long Bay is as beautiful as Ninh Binh.', vi: 'Vịnh Hạ Long đẹp như Ninh Bình.', mark: 'as beautiful as' },
          { en: 'This road is not as busy as the main street.', vi: 'Con đường này không đông bằng đường chính.', mark: 'not as busy as' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các cụm so sánh thường gặp',
        body: 'Các cụm này xuất hiện trong giao tiếp hằng ngày và khi viết.',
        bullets: [
          'as much as / as many as: với danh từ không đếm được / đếm được',
          'as soon as possible: càng sớm càng tốt',
          'the same as: giống như',
          'less … than / the least: ít hơn / ít nhất',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Less và least với tính từ dài',
        body: 'Less than nói về mức độ thấp hơn, đi với tính từ dài. The least nói về mức thấp nhất, đi với the.',
        formula: 'less + adj + than  ·  the least + adj',
        examples: [
          { en: 'This model is less expensive than the old one.', vi: 'Mẫu này ít đắt hơn mẫu cũ.', mark: 'less expensive than' },
          { en: 'She chose the least difficult option.', vi: 'Cô ấy chọn phương án ít khó nhất.', mark: 'the least difficult' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Less với không đếm được, fewer với đếm được',
        body: 'Less đi với danh từ không đếm được (less time). Fewer đi với danh từ đếm được (fewer people). Văn viết trang trọng nên phân biệt rõ hai từ này.',
        examples: [
          { en: 'We have less time than we expected.', vi: 'Chúng tôi có ít thời gian hơn dự kiến.', mark: 'less time' },
          { en: 'Fewer students came to class today.', vi: 'Hôm nay có ít học sinh đến lớp hơn.', mark: 'Fewer students' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng than trong so sánh bằng, hoặc dùng more cùng less.',
        mistakes: [
          { wrong: 'He is as tall than his father.', right: 'He is as tall as his father.', why: 'So sánh bằng dùng as … as, không dùng than.' },
          { wrong: 'It is more less expensive.', right: 'It is less expensive.', why: 'Less đã mang nghĩa so sánh nên không thêm more.' },
        ],
      },
    ],
    quiz: [
      { q: 'My sister is ___ tall as my mother.', options: ['as', 'so', 'than'], answer: 0, explain: 'So sánh bằng dùng as … as.' },
      { q: 'This exercise is ___ difficult than the last one.', options: ['least', 'less', 'fewer'], answer: 1, explain: 'Less đi với tính từ dài để nói thấp hơn.' },
      { q: 'She is the ___ experienced member of the team.', options: ['less', 'lesser', 'least'], answer: 2, explain: 'The least experienced là mức thấp nhất.' },
      { q: 'We need ___ water than before.', options: ['less', 'fewer', 'least'], answer: 0, explain: 'Water là danh từ không đếm được nên dùng less.' },
      { q: 'Choose the correct sentence.', options: ['The train is not as fast than the bus.', 'The train is not as fast as the bus.', 'The train is more less fast than the bus.'], answer: 1, explain: 'So sánh bằng phủ định dùng not as … as.' },
    ],
  },
  {
    id: 'a2-prepositions-time',
    level: 'A2',
    order: 11,
    title: 'Giới từ chỉ thời gian: in, on, at',
    titleEn: 'Prepositions of Time: In, On, At',
    summary: 'Chọn in, on, at cho giờ, ngày và khoảng thời gian.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Giới từ thời gian là gì?',
        body: 'Giới từ thời gian cho biết khi nào một việc xảy ra. Ba giới từ phổ biến nhất là at, on, in.',
        formula: 'at + giờ  ·  on + ngày  ·  in + tháng, mùa, năm',
        examples: [
          { en: 'The class starts at 7 a.m.', vi: 'Lớp học bắt đầu lúc 7 giờ sáng.', mark: 'at 7 a.m.' },
          { en: 'We are going on Sunday.', vi: 'Chúng tôi đi vào Chủ nhật.', mark: 'on Sunday' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Ba nhóm chính',
        body: 'Mỗi giới từ đi với một nhóm thời gian nhất định.',
        bullets: [
          'At: giờ (at noon), dịp lễ (at Christmas), buổi tối (at night)',
          'On: ngày trong tuần và ngày tháng (on Monday, on 2 September)',
          'In: tháng, mùa, năm, buổi (in June, in winter, in 2026, in the morning)',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Không dùng giới từ với next và last',
        body: 'Không dùng at, on, in trước this, next, last, every. Ví dụ: last week, next year, every day.',
        examples: [
          { en: 'I visited my grandmother last week.', vi: 'Tuần trước tôi đến thăm bà.', mark: 'last week' },
          { en: 'We will meet next Friday.', vi: 'Chúng tôi sẽ gặp nhau thứ Sáu tới.', mark: 'next Friday' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Các cụm thời gian cố định',
        body: 'Một số cụm có giới từ cố định, cần ghi nhớ như một cụm từ: on time, at night, at the moment, in the morning.',
        examples: [
          { en: 'She always arrives on time.', vi: 'Cô ấy luôn đến đúng giờ.', mark: 'on time' },
          { en: 'The shop is closed at night.', vi: 'Cửa hàng đóng cửa vào ban đêm.', mark: 'at night' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng giới từ trước next, hoặc dùng at với năm và mùa.',
        mistakes: [
          { wrong: 'I was born in 15 March.', right: 'I was born on 15 March.', why: 'Ngày cụ thể dùng on.' },
          { wrong: 'The party is at the summer.', right: 'The party is in the summer.', why: 'Mùa dùng in.' },
        ],
      },
    ],
    quiz: [
      { q: 'The meeting starts ___ 9 o\'clock.', options: ['in', 'at', 'on'], answer: 1, explain: 'Giờ cụ thể dùng at.' },
      { q: 'We went to the beach ___ Saturday.', options: ['at', 'in', 'on'], answer: 2, explain: 'Ngày trong tuần dùng on.' },
      { q: 'It often rains ___ the summer.', options: ['in', 'on', 'at'], answer: 0, explain: 'Mùa dùng in.' },
      { q: 'We will visit them ___ next summer.', options: ['in', 'at', 'no preposition'], answer: 2, explain: 'Không dùng giới từ trước next.' },
      { q: 'Choose the correct sentence.', options: ['She was born at 2010.', 'She was born in 2010.', 'She was born on in 2010.'], answer: 1, explain: 'Năm dùng in.' },
    ],
  },
  {
    id: 'a2-suggestions',
    level: 'A2',
    order: 12,
    title: 'Đề nghị với Let\'s, Shall we, How about',
    titleEn: 'Making Suggestions',
    summary: 'Đưa ra lời đề nghị lịch sự và đáp lại đề nghị của người khác.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Đề nghị là gì?',
        body: 'Khi muốn gợi ý làm việc gì cùng nhau, ta dùng let\'s, shall we, why don\'t we hoặc how about. Các cấu trúc này theo sau bởi động từ nguyên mẫu hoặc V-ing.',
        examples: [
          { en: "Let's go to the lake this weekend.", vi: 'Cuối tuần này mình đi hồ nhé.', mark: "Let's go" },
          { en: 'How about having dinner together?', vi: 'Hay mình cùng ăn tối nhé?', mark: 'How about having dinner' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các cấu trúc đề nghị',
        body: 'Mỗi cấu trúc có sắc thái lịch sự khác nhau.',
        bullets: [
          "Let's + V: đề nghị cả hai cùng làm",
          'Shall we + V: hỏi ý kiến một cách lịch sự',
          "Why don't we + V: đề nghị nhẹ nhàng",
          'How about / What about + V-ing hoặc danh từ: gợi ý',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: "Let's đi với động từ nguyên mẫu",
        body: "Let's luôn theo sau bởi động từ nguyên mẫu không có to. Dạng phủ định là Let's not.",
        examples: [
          { en: "Let's not wait for the bus; let's walk.", vi: 'Đừng chờ xe buýt, mình đi bộ đi.', mark: "Let's not wait" },
          { en: "Let's meet at the station at six.", vi: 'Mình gặp nhau ở ga lúc sáu giờ nhé.', mark: "Let's meet" },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Đáp lại đề nghị',
        body: 'Đồng ý bằng Yes, let\'s hoặc Good idea. Từ chối lịch sự bằng I\'d love to, but… hoặc Sorry, I\'m busy.',
        examples: [
          { en: 'Shall we go for a walk? Yes, good idea!', vi: 'Mình đi dạo nhé? Được, ý hay đấy!', mark: 'Yes, good idea' },
          { en: "I'd love to, but I have to work tonight.", vi: 'Mình rất muốn, nhưng tối nay mình phải làm việc.', mark: "I'd love to, but" },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là thêm to sau let\'s, hoặc dùng động từ nguyên mẫu sau how about.',
        mistakes: [
          { wrong: "Let's to go to the park.", right: "Let's go to the park.", why: "Sau let's dùng động từ nguyên mẫu không có to." },
          { wrong: 'How about go to the cinema?', right: 'How about going to the cinema?', why: 'Sau how about dùng V-ing.' },
        ],
      },
    ],
    quiz: [
      { q: '___ we watch a film tonight?', options: ['Do', 'Shall', 'Are'], answer: 1, explain: 'Shall we dùng để đề nghị lịch sự.' },
      { q: "Let's ___ to the museum on Sunday.", options: ['to go', 'go', 'going'], answer: 1, explain: "Sau let's dùng động từ nguyên mẫu không có to." },
      { q: 'How about ___ a picnic this weekend?', options: ['having', 'to have', 'have'], answer: 0, explain: 'Sau how about dùng V-ing.' },
      { q: "___ don't we invite Nam to dinner?", options: ['What', 'How', 'Why'], answer: 2, explain: "Why don't we là cách đề nghị nhẹ nhàng." },
      { q: 'Choose the correct sentence.', options: ["Let's take a break.", "Let's to take a break.", "Let's taking a break."], answer: 0, explain: "Let's đi với động từ nguyên mẫu không có to." },
    ],
  },
];
