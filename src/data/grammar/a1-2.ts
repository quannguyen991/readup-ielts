import type { GrammarLessonDetail } from './types';

/** Cấp A1 (phần bổ sung): từ để hỏi, số và thứ tự, giới từ chỉ vị trí. */
export const A1_GRAMMAR_EXTRA: GrammarLessonDetail[] = [
  {
    id: 'a1-question-words',
    level: 'A1',
    order: 9,
    title: 'Từ để hỏi: what, who, whose, which',
    titleEn: 'Question Words: What, Who, Whose, Which',
    summary: 'Đặt câu hỏi để hỏi về vật, người, sự sở hữu và sự lựa chọn.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Từ để hỏi là gì?',
        body: 'Từ để hỏi đứng đầu câu hỏi để hỏi thông tin: **what** (cái gì), **who** (ai), **whose** (của ai), **which** (cái nào trong một nhóm đã biết).',
        formula: 'Từ để hỏi + be / trợ động từ + chủ ngữ?',
        examples: [
          { en: 'What is this?', vi: 'Đây là cái gì?', mark: 'What is this' },
          { en: 'Who is your teacher?', vi: 'Giáo viên của bạn là ai?', mark: 'Who is your teacher' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Chọn từ để hỏi',
        body: 'Mỗi từ hỏi về một loại thông tin khác nhau.',
        bullets: [
          'What: hỏi về vật hoặc việc (What is your name?)',
          'Who: hỏi về người (Who is that man?)',
          'Whose: hỏi về người sở hữu (Whose bag is this?)',
          'Which: hỏi chọn trong một nhóm (Which bus goes to the station?)',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Whose đứng trước danh từ',
        body: 'Whose đứng trước danh từ để hỏi "của ai". Khi danh từ đã được nhắc đến, có thể dùng whose một mình.',
        examples: [
          { en: 'Whose pen is this?', vi: 'Đây là bút của ai?', mark: 'Whose pen' },
          { en: 'This book is mine. Whose is that one?', vi: 'Quyển này là của tôi. Cái kia là của ai?', mark: 'Whose is that one' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Which khi có một nhóm lựa chọn',
        body: 'Which dùng khi người nói đang chọn trong một nhóm giới hạn. What dùng khi không có nhóm lựa chọn cụ thể.',
        examples: [
          { en: 'Which colour do you like, red or blue?', vi: 'Bạn thích màu nào, đỏ hay xanh?', mark: 'Which colour' },
          { en: 'What colour is your car?', vi: 'Xe của bạn màu gì?', mark: 'What colour' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là đảo sai vị trí trợ động từ hoặc đặt whose sau danh từ.',
        mistakes: [
          { wrong: 'What you are doing?', right: 'What are you doing?', why: 'Trong câu hỏi, be hoặc trợ động từ đứng trước chủ ngữ.' },
          { wrong: 'Whose is this book?', right: 'Whose book is this?', why: 'Khi hỏi về một danh từ cụ thể, whose đứng ngay trước danh từ.' },
        ],
      },
    ],
    quiz: [
      { q: '___ is your favourite colour?', options: ['What', 'Who', 'Whose'], answer: 0, explain: 'Hỏi về màu sắc, một thông tin về vật, dùng what.' },
      { q: '___ laptop is on the desk? It belongs to Nam.', options: ['Who', 'Whose', 'Whom'], answer: 1, explain: 'Hỏi người sở hữu laptop, dùng whose đứng trước danh từ.' },
      { q: '___ of these two bags do you want?', options: ['What', 'Who', 'Which'], answer: 2, explain: 'Chọn một trong hai túi, dùng which.' },
      { q: '___ is calling me?', options: ['Whom', 'Who', 'Whose'], answer: 1, explain: 'Hỏi về người làm chủ ngữ, dùng who.' },
      { q: 'Choose the correct question.', options: ['Whose is this bag?', 'Who bag is this?', 'Whose bag is this?'], answer: 2, explain: 'Whose đứng trước danh từ bag.' },
    ],
  },
  {
    id: 'a1-numbers-ordinals',
    level: 'A1',
    order: 10,
    title: 'Số đếm và số thứ tự',
    titleEn: 'Cardinal and Ordinal Numbers',
    summary: 'Đọc số đếm, số thứ tự và dùng chúng để nói về ngày, tầng và lần thứ mấy.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Số đếm và số thứ tự là gì?',
        body: 'Số đếm dùng để đếm (one, two, three). Số thứ tự dùng để chỉ thứ tự hoặc vị trí (first, second, third).',
        examples: [
          { en: 'I have two sisters.', vi: 'Tôi có hai chị em gái.', mark: 'two' },
          { en: 'She lives on the third floor.', vi: 'Cô ấy sống ở tầng ba.', mark: 'third' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Số thứ tự dùng ở đâu?',
        body: 'Số thứ tự xuất hiện khi nói về ngày, tầng, thứ hạng hoặc lần thứ mấy.',
        bullets: [
          'Ngày trong tháng: the first of May, the tenth of October',
          'Tầng nhà: the second floor',
          'Thứ tự, lần: the first time, the last bus',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Cách tạo số thứ tự',
        body: 'Hầu hết số thứ tự là số đếm cộng -th. Một số dạng đặc biệt: first, second, third; five thành fifth; nine thành ninth; twelve thành twelfth; twenty thành twentieth.',
        formula: 'Số đếm + th (trừ first, second, third)',
        examples: [
          { en: 'The fifth lesson is about numbers.', vi: 'Bài thứ năm nói về số.', mark: 'fifth' },
          { en: 'It is the twentieth century.', vi: 'Đây là thế kỷ thứ hai mươi.', mark: 'twentieth' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'The đi với số thứ tự',
        body: 'Số thứ tự thường đi với the: the first, the last, the second.',
        examples: [
          { en: 'This is the first time I have visited Hue.', vi: 'Đây là lần đầu tiên tôi đến Huế.', mark: 'the first time' },
          { en: 'The last bus leaves at ten.', vi: 'Chuyến xe buýt cuối cùng khởi hành lúc mười giờ.', mark: 'The last bus' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng số đếm thay cho số thứ tự khi nói về tầng hoặc ngày.',
        mistakes: [
          { wrong: 'I live on the three floor.', right: 'I live on the third floor.', why: 'Tầng và thứ tự phải dùng số thứ tự.' },
          { wrong: 'Today is October two.', right: 'Today is October second.', why: 'Ngày trong tháng dùng số thứ tự.' },
        ],
      },
    ],
    quiz: [
      { q: 'She lives on the ___ floor.', options: ['three', 'third', 'threeth'], answer: 1, explain: 'Tầng dùng số thứ tự third.' },
      { q: 'This is the ___ time I have seen snow.', options: ['firstly', 'firsts', 'first'], answer: 2, explain: 'The first time là lần đầu tiên.' },
      { q: 'Today is the ___ of May.', options: ['fifth', 'five', 'fiveth'], answer: 0, explain: 'Ngày trong tháng dùng số thứ tự fifth.' },
      { q: 'Choose the correct sentence.', options: ['I live on the four floor.', 'I live on the fourth floor.', 'I live on the forth floor.'], answer: 1, explain: 'Thứ tự của four là fourth; forth là một từ khác nghĩa.' },
      { q: 'The ___ of the month is on Monday.', options: ['twenty', 'twentieth', 'twentyth'], answer: 1, explain: 'Số thứ tự của twenty là twentieth.' },
    ],
  },
  {
    id: 'a1-prepositions-place',
    level: 'A1',
    order: 11,
    title: 'Giới từ chỉ vị trí',
    titleEn: 'Prepositions of Place',
    summary: 'Mô tả vị trí của người và vật bằng in, on, at, under, between.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Giới từ chỉ vị trí là gì?',
        body: 'Giới từ chỉ vị trí cho biết một vật hoặc người nằm ở đâu so với vật khác. Các giới từ phổ biến là in, on, at, under, behind, between.',
        formula: 'Chủ ngữ + be + giới từ + nơi chốn',
        examples: [
          { en: 'The keys are on the table.', vi: 'Chìa khoá ở trên bàn.', mark: 'on the table' },
          { en: 'My bag is under the chair.', vi: 'Cặp của tôi ở dưới ghế.', mark: 'under the chair' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Ba giới từ cơ bản',
        body: 'In, on, at dùng cho nơi chốn khác nhau tùy theo kích thước và cách nhìn.',
        bullets: [
          'In: bên trong một không gian (in the box, in Hanoi)',
          'On: trên một bề mặt hoặc trên một con phố (on the wall, on Tran Hung Dao Street)',
          'At: một điểm cụ thể (at the bus stop, at home)',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Vị trí so với một vật mốc',
        body: 'Under, behind, in front of, next to, between mô tả vị trí so với một vật mốc.',
        examples: [
          { en: 'The cat is behind the sofa.', vi: 'Con mèo ở sau ghế sô pha.', mark: 'behind the sofa' },
          { en: 'I am sitting between my brother and my sister.', vi: 'Tôi đang ngồi giữa anh trai và chị gái.', mark: 'between my brother and my sister' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Between và among',
        body: 'Between dùng khi có hai đối tượng. Among dùng khi có ba đối tượng trở lên.',
        examples: [
          { en: 'The shop is between the bank and the school.', vi: 'Cửa hàng nằm giữa ngân hàng và trường học.', mark: 'between the bank and the school' },
          { en: 'She sat among the students.', vi: 'Cô ấy ngồi giữa đám học sinh.', mark: 'among the students' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng on cho vật nằm trong không gian hoặc dùng on với tên thành phố.',
        mistakes: [
          { wrong: 'I live on Hanoi.', right: 'I live in Hanoi.', why: 'Thành phố dùng in.' },
          { wrong: 'The book is in the table.', right: 'The book is on the table.', why: 'Vật nằm trên bề mặt bàn dùng on.' },
        ],
      },
    ],
    quiz: [
      { q: 'The glasses are ___ the table.', options: ['in', 'on', 'at'], answer: 1, explain: 'Cốc nằm trên bề mặt bàn, dùng on.' },
      { q: 'She is waiting ___ the bus stop.', options: ['in', 'on', 'at'], answer: 2, explain: 'Một điểm cụ thể như trạm xe buýt dùng at.' },
      { q: 'The dog is sleeping ___ the bed.', options: ['under', 'between', 'among'], answer: 0, explain: 'Con chó nằm dưới giường, dùng under.' },
      { q: 'The school is ___ the bank and the hospital.', options: ['among', 'between', 'behind'], answer: 1, explain: 'Hai đối tượng, dùng between.' },
      { q: 'Choose the correct sentence.', options: ['I live in Da Nang.', 'I live at Da Nang.', 'I live on Da Nang.'], answer: 0, explain: 'Thành phố dùng in.' },
    ],
  },
];
