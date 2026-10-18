import type { GrammarLessonDetail } from './types';

/** Cấp C1: đảo ngữ, câu chẻ, động từ khuyết thiếu suy đoán. */
export const C1_GRAMMAR: GrammarLessonDetail[] = [
  {
    id: 'c1-inversion',
    level: 'C1',
    order: 1,
    title: 'Đảo ngữ',
    titleEn: 'Inversion',
    summary: 'Nhấn mạnh bằng cách đảo trợ động từ lên trước chủ ngữ sau các cụm phủ định.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Đảo ngữ để làm gì?',
        body: 'Đảo ngữ đưa **trợ động từ hoặc be lên trước chủ ngữ** để nhấn mạnh. Thường gặp trong văn viết trang trọng và phát biểu.',
        examples: [
          { en: 'Never have I seen such a beautiful view.', vi: 'Tôi chưa bao giờ thấy cảnh đẹp như vậy.', mark: 'Never have I seen' },
          { en: 'Not only did she win, but she also set a record.', vi: 'Cô ấy không những thắng mà còn lập kỷ lục.', mark: 'Not only did she win' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các cụm kích hoạt đảo ngữ',
        body: 'Thường mở đầu bằng một trạng từ phủ định hoặc hạn định.',
        bullets: ['Never, rarely, seldom, hardly ever', 'Not only… but also', 'No sooner… than, Hardly… when', 'Only after / Only when'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Đảo trợ động từ với hiện tại và quá khứ',
        body: 'Có trợ động từ thì đảo trợ động từ lên trước chủ ngữ. Không có thì dùng do/does/did.',
        formula: 'Trạng từ phủ định + trợ động từ + S + V',
        examples: [
          { en: 'Rarely do we eat out on weekdays.', vi: 'Hiếm khi chúng tôi ăn ngoài vào ngày thường.', mark: 'Rarely do we eat' },
          { en: 'Seldom had he been so happy.', vi: 'Hiếm khi anh ấy vui như vậy.', mark: 'Seldom had he been' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Đảo ngữ với only',
        body: 'Khi "only" đứng đầu cụm trạng ngữ, đảo ngữ xảy ra ở mệnh đề chính.',
        examples: [
          { en: 'Only after the rain stopped did we leave.', vi: 'Chỉ sau khi mưa tạnh chúng tôi mới rời đi.', mark: 'did we leave' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là quên đảo trợ động từ sau trạng từ phủ định.',
        mistakes: [
          { wrong: 'Never I have seen it.', right: 'Never have I seen it.', why: 'Sau Never phải đảo trợ động từ lên trước chủ ngữ.' },
          { wrong: 'Not only she won.', right: 'Not only did she win.', why: 'Cần trợ động từ did và động từ về nguyên mẫu.' },
        ],
      },
    ],
    quiz: [
      { q: "Never ___ such a mess.", options: ["have I seen", "I have seen", "I saw"], answer: 0, explain: "Sau Never đảo trợ động từ lên trước chủ ngữ." },
      { q: "Rarely ___ late to class.", options: ["she is", "is she", "she was"], answer: 1, explain: "Rarely đi với đảo ngữ, đảo be lên trước she." },
      { q: "Not only ___ the exam, but she also got the top score.", options: ["she passed", "she did pass", "did she pass"], answer: 2, explain: "Not only đi với đảo ngữ ở vế đầu." },
      { q: "Only when the lights went out ___.", options: ["did we notice", "we did notice", "we noticed"], answer: 0, explain: "Only when đứng đầu câu thì đảo ngữ ở mệnh đề chính." },
      { q: "Choose the correct sentence.", options: ["Hardly we had arrived when it started raining.", "Hardly had we arrived when it started raining.", "Hardly we arrived when it started raining."], answer: 1, explain: "Hardly… when đảo trợ động từ had lên trước chủ ngữ." },
    ],
  },
  {
    id: 'c1-cleft',
    level: 'C1',
    order: 2,
    title: 'Câu chẻ',
    titleEn: 'Cleft Sentences',
    summary: 'Tách một thông tin ra để làm nổi bật phần quan trọng.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Câu chẻ là gì?',
        body: 'Câu chẻ **tách câu thành hai phần** với it hoặc what để nhấn mạnh một thành phần cụ thể.',
        examples: [
          { en: 'It was Maria who solved the problem.', vi: 'Chính Maria là người giải quyết vấn đề.', mark: 'It was Maria who' },
          { en: 'What I need is a holiday.', vi: 'Điều tôi cần là một kỳ nghỉ.', mark: 'What I need is' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Nhấn người, vật, hoặc hành động',
        body: 'Dùng it + be + thành phần được nhấn + that/who. Dùng what để nhấn toàn bộ ý.',
        bullets: ['It is + người + who (nhấn người)', 'It is + vật + that (nhấn vật)', 'What + S + V + is + ý nhấn'],
      },
      {
        label: 'Quy tắc 1',
        title: 'It + be + thành phần + who/that',
        body: 'Thành phần được nhấn đứng sau be. Who cho người, that cho vật hoặc khi không cần phân biệt.',
        formula: 'It is / was + [thành phần] + who / that + mệnh đề',
        examples: [
          { en: 'It was yesterday that I lost my bag.', vi: 'Chính hôm qua tôi làm mất túi.', mark: 'It was yesterday that' },
          { en: 'It is the teacher who decides.', vi: 'Chính giáo viên là người quyết định.', mark: 'It is the teacher who' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'What-clause nhấn ý chính',
        body: 'What + mệnh đề + be + phần nhấn. Động từ be chia theo số của phần nhấn.',
        examples: [
          { en: 'What surprised me was the price.', vi: 'Điều làm tôi bất ngờ là giá cả.', mark: 'What surprised me was' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là chia be sai với phần nhấn.',
        mistakes: [
          { wrong: 'It is the students who is late.', right: 'It is the students who are late.', why: 'Động từ trong mệnh đề who phải hợp với danh từ đứng trước (students, số nhiều).' },
          { wrong: 'It was the book that I read it.', right: 'It was the book that I read.', why: 'Không lặp lại tân ngữ trong mệnh đề that.' },
        ],
      },
    ],
    quiz: [
      { q: "It was John ___ broke the window.", options: ["which", "who", "where"], answer: 1, explain: "John là người nên dùng who." },
      { q: "What I enjoy most ___ cooking.", options: ["are", "be", "is"], answer: 2, explain: "Phần nhấn cooking là một hoạt động, be chia số ít." },
      { q: "It is in Hanoi ___ the company was founded.", options: ["that", "who", "what"], answer: 0, explain: "Nơi chốn trong câu chẻ dùng that." },
      { q: "It ___ the rain that delayed the flight.", options: ["were", "was", "is being"], answer: 1, explain: "Quá khứ nên dùng was; the rain là số ít." },
      { q: "Choose the correct cleft sentence.", options: ["What she needs are more time.", "What she needs is more times.", "What she needs is more time."], answer: 2, explain: "Cấu trúc What + mệnh đề + is + phần nhấn." },
    ],
  },
  {
    id: 'c1-modal-deduction',
    level: 'C1',
    order: 3,
    title: 'Suy đoán trong quá khứ với must, might, can\'t',
    titleEn: 'Modal Deduction in the Past',
    summary: 'Đưa ra suy đoán có căn cứ về việc đã xảy ra.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Suy đoán quá khứ là gì?',
        body: 'Dùng modal + have + V3 để **đoán** điều đã xảy ra dựa trên bằng chứng. Mức độ chắc chắn khác nhau tùy động từ khuyết thiếu.',
        formula: 'must / might / could / can\'t + have + V3',
        examples: [
          { en: 'She must have left early; her desk is empty.', vi: 'Cô ấy chắc đã về sớm; bàn cô ấy trống.', mark: 'must have left' },
          { en: 'He might have forgotten the meeting.', vi: 'Anh ấy có thể đã quên cuộc họp.', mark: 'might have forgotten' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Mức độ chắc chắn',
        body: 'Must have: gần như chắc chắn. Might / could have: có thể. Can\'t have: gần như chắc chắn là không.',
        bullets: ['must have + V3: chắc chắn đã (bằng chứng mạnh)', 'might / could have + V3: có lẽ đã', "can't have + V3: không thể đã"],
      },
      {
        label: 'Quy tắc 1',
        title: 'Must have và can\'t have',
        body: 'Must have dùng khi bạn gần như chắc chắn điều đó đã xảy ra. Can\'t have là phủ định của suy đoán mạnh.',
        examples: [
          { en: "They can't have finished the project already.", vi: 'Họ không thể đã hoàn thành dự án rồi.', mark: "can't have finished" },
          { en: 'You must have seen him at the party.', vi: 'Chắc bạn đã thấy anh ấy ở bữa tiệc.', mark: 'must have seen' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Might và could khi chưa chắc',
        body: 'Might have và could have đều chỉ khả năng, nhưng might thường chắc hơn một chút trong ngữ cảnh suy đoán.',
        examples: [
          { en: 'The train might have been delayed.', vi: 'Tàu có thể đã bị trễ.', mark: 'might have been delayed' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi thường gặp là dùng nguyên mẫu thay cho have + V3.',
        mistakes: [
          { wrong: 'She must go home already.', right: 'She must have gone home already.', why: 'Suy đoán về quá khứ cần have + V3.' },
          { wrong: 'He can\'t have know the answer.', right: "He can't have known the answer.", why: 'Sau have phải là V3 (known).' },
        ],
      },
    ],
    quiz: [
      { q: "The lights are on. They ___ home.", options: ["must be", "must have be", "must have been"], answer: 2, explain: "Suy đoán một việc đã xảy ra: must have + V3 (been)." },
      { q: "She ___ the test; she studied all night.", options: ["can't have failed", "can't have fail", "can't failed"], answer: 0, explain: "Can't have + V3 (failed)." },
      { q: "He ___ the bus; he is still at home.", options: ["might missed", "might have missed", "might miss"], answer: 1, explain: "Might have + V3 (missed)." },
      { q: "It ___ a mistake; the numbers are wrong.", options: ["must be", "must been", "must have been"], answer: 2, explain: "Must have been là suy đoán về quá khứ." },
      { q: "Choose the correct sentence.", options: ["They could have called us earlier.", "They could called us earlier.", "They could have call us earlier."], answer: 0, explain: "Could have + V3 (called)." },
    ],
  },
  {
    id: 'c1-tense-mixing',
    level: 'C1',
    order: 4,
    title: 'Thì hoàn thành và quá khứ: giữ thì nhất quán',
    titleEn: 'Perfect Tenses and Time Consistency',
    summary: 'Dùng đúng thì hoàn thành và quá khứ để kể chuyện nhất quán về thời gian.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Thì nhất quán là gì?',
        body: 'Trong cùng một đoạn kể, các hành động phải đặt đúng thứ tự thời gian. Hiện tại hoàn thành nối quá khứ với hiện tại. Quá khứ hoàn thành lùi thêm một bước so với một mốc trong quá khứ.',
        examples: [
          { en: 'She has lived in London since 2015.', vi: 'Cô ấy sống ở Luân Đôn từ năm 2015 đến nay.', mark: 'has lived' },
          { en: 'By the time we arrived, the film had started.', vi: 'Khi chúng tôi đến, phim đã bắt đầu.', mark: 'had started' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các cặp thì dễ nhầm',
        body: 'Phân biệt theo việc bạn đang nhấn mạnh kết quả, thời điểm hay quá trình.',
        bullets: [
          'Hiện tại hoàn thành: kết quả còn ở hiện tại (I have finished.)',
          'Quá khứ đơn: thời điểm đã xác định trong quá khứ (I finished yesterday.)',
          'Quá khứ hoàn thành: hành động xảy ra trước một hành động khác trong quá khứ.',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Thời gian xác định dùng quá khứ đơn',
        body: 'Khi có mốc thời gian cụ thể đã qua như yesterday, in 2019, last week, dùng quá khứ đơn, không dùng hiện tại hoàn thành.',
        examples: [
          { en: 'I visited Hue in 2019.', vi: 'Tôi đã đến Huế năm 2019.', mark: 'visited Hue' },
          { en: 'Have you seen the film yet?', vi: 'Bạn xem phim đó chưa?', mark: 'Have you seen' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Hành động trước dùng quá khứ hoàn thành',
        body: 'Khi kể hai hành động trong quá khứ, hành động xảy ra trước dùng quá khứ hoàn thành, hành động sau dùng quá khứ đơn.',
        examples: [
          { en: 'After she had finished her shift, she went home.', vi: 'Sau khi tan ca, cô ấy về nhà.', mark: 'had finished' },
          { en: 'He realized that he had lost his keys.', vi: 'Anh ấy nhận ra mình đã làm mất chìa khoá.', mark: 'had lost' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng hiện tại hoàn thành với mốc thời gian đã qua, hoặc dùng hiện tại đơn cho hành động xảy ra trước.',
        mistakes: [
          { wrong: 'I have visited Hue last year.', right: 'I visited Hue last year.', why: 'Last year là mốc thời gian đã xác định, dùng quá khứ đơn.' },
          { wrong: 'When I arrived, she already leaves.', right: 'When I arrived, she had already left.', why: 'Hành động xảy ra trước hành động đến dùng quá khứ hoàn thành.' },
        ],
      },
    ],
    quiz: [
      { q: "I ___ finished my homework yet.", options: ["haven't", "didn't", "hadn't"], answer: 0, explain: "Yet đi với hiện tại hoàn thành phủ định: haven't finished." },
      { q: "We ___ to Paris in 2018.", options: ["have gone", "went", "had gone"], answer: 1, explain: "Mốc năm 2018 đã xác định nên dùng quá khứ đơn." },
      { q: "When we got to the station, the train ___.", options: ["has already left", "already left", "had already left"], answer: 2, explain: "Việc tàu rời đi xảy ra trước khi đến ga: quá khứ hoàn thành." },
      { q: "She ___ in Hanoi since 2010.", options: ["has lived", "lived", "had lived"], answer: 0, explain: "Since 2010 kéo dài đến hiện tại: hiện tại hoàn thành." },
      { q: "Choose the correct sentence.", options: ["I have seen that film last week.", "I have seen that film twice.", "I seen that film last week."], answer: 1, explain: "Hiện tại hoàn thành không đi với mốc thời gian đã xác định như last week." },
    ],
  },
  {
    id: 'c1-noun-clauses',
    level: 'C1',
    order: 5,
    title: 'Mệnh đề danh ngữ',
    titleEn: 'Noun Clauses',
    summary: 'Dùng mệnh đề làm chủ ngữ hoặc tân ngữ với that, whether, what và từ để hỏi.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Mệnh đề danh ngữ là gì?',
        body: 'Mệnh đề danh ngữ đóng vai trò như một danh từ: có thể làm chủ ngữ, tân ngữ hoặc bổ ngữ. Thường bắt đầu bằng that, what, whether, if hoặc từ để hỏi.',
        examples: [
          { en: "I don't know where she lives.", vi: 'Tôi không biết cô ấy sống ở đâu.', mark: 'where she lives' },
          { en: 'What he said surprised everyone.', vi: 'Điều anh ấy nói làm mọi người ngạc nhiên.', mark: 'What he said' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các từ mở đầu thường gặp',
        body: 'Chọn từ mở đầu theo loại thông tin bạn muốn truyền đạt.',
        bullets: [
          'That: một sự việc (I think that he is right.)',
          'Whether hoặc if: có hay không (I wonder whether it will rain.)',
          'What, who, where, how: thông tin hỏi (Tell me what you want.)',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Không đảo trợ động từ',
        body: 'Trong mệnh đề danh ngữ, chủ ngữ đứng trước động từ, không đảo như câu hỏi.',
        examples: [
          { en: 'Could you tell me where the station is?', vi: 'Bạn có thể cho tôi biết nhà ga ở đâu không?', mark: 'where the station is' },
          { en: 'I wonder how much it costs.', vi: 'Không biết nó giá bao nhiêu.', mark: 'how much it costs' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Mệnh đề danh ngữ làm chủ ngữ',
        body: 'Khi mệnh đề danh ngữ làm chủ ngữ, động từ chính chia theo mệnh đề đó, thường ở dạng số ít.',
        examples: [
          { en: 'What matters most is your health.', vi: 'Điều quan trọng nhất là sức khoẻ của bạn.', mark: 'What matters most' },
          { en: 'Whether we go depends on the weather.', vi: 'Việc chúng tôi có đi hay không tuỳ thuộc vào thời tiết.', mark: 'Whether we go' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là đảo trợ động từ trong mệnh đề danh ngữ như câu hỏi.',
        mistakes: [
          { wrong: "I don't know where does she live.", right: "I don't know where she lives.", why: 'Không đảo trợ động từ trong mệnh đề danh ngữ.' },
          { wrong: 'I wonder if is he coming.', right: 'I wonder if he is coming.', why: 'Chủ ngữ đứng trước động từ.' },
        ],
      },
    ],
    quiz: [
      { q: "Do you know ___?", options: ["where is the bank", "where the bank is", "where does the bank is"], answer: 1, explain: "Trong mệnh đề danh ngữ, chủ ngữ the bank đứng trước is." },
      { q: "I wonder ___ she will accept the offer.", options: ["what", "where", "whether"], answer: 2, explain: "Whether diễn tả việc có hay không." },
      { q: "Tell me ___ you bought this.", options: ["why", "why did", "why do"], answer: 0, explain: "Mệnh đề danh ngữ không đảo trợ động từ." },
      { q: "___ he said was not true.", options: ["Which", "What", "Where"], answer: 1, explain: "What đứng đầu mệnh đề danh ngữ làm chủ ngữ, nghĩa là điều mà." },
      { q: "Choose the correct sentence.", options: ["How does the machine works is a mystery.", "How the machine does works is a mystery.", "How the machine works is a mystery."], answer: 2, explain: "Chủ ngữ the machine đứng trước động từ works." },
    ],
  },
  {
    id: 'c1-hedging',
    level: 'C1',
    order: 6,
    title: 'Ngôn ngữ rào đón',
    titleEn: 'Hedging Language',
    summary: 'Diễn đạt ý kiến thận trọng, tránh khẳng định tuyệt đối trong văn học thuật.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Rào đón là gì?',
        body: 'Rào đón (hedging) là cách nói làm giảm mức độ chắc chắn của một nhận định, để người đọc hiểu đó là ý kiến hoặc khả năng. Đây là kỹ năng quan trọng trong văn học thuật.',
        examples: [
          { en: 'The results seem to suggest a link between sleep and memory.', vi: 'Kết quả dường như cho thấy có liên hệ giữa giấc ngủ và trí nhớ.', mark: 'seem to suggest' },
          { en: 'This may partly explain the decline.', vi: 'Điều này có thể giải thích phần nào sự suy giảm.', mark: 'may partly explain' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các công cụ rào đón',
        body: 'Có nhiều cách để làm mềm một nhận định, từ động từ, trạng từ đến cụm từ.',
        bullets: [
          'Động từ: seem, appear, tend to, suggest, indicate',
          'Trạng từ: possibly, probably, arguably, largely, partly',
          'Cụm từ: to some extent, it is likely that, there is some evidence that',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Dùng modal thận trọng',
        body: 'Dùng may, might, could để nêu khả năng, thay vì will hoặc must là những khẳng định mạnh.',
        examples: [
          { en: 'Stress could contribute to the problem.', vi: 'Căng thẳng có thể góp phần vào vấn đề.', mark: 'could contribute' },
          { en: 'This approach might be useful in some cases.', vi: 'Cách tiếp cận này có thể hữu ích trong một số trường hợp.', mark: 'might be useful' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'It is + tính từ + that',
        body: 'Cấu trúc It is likely, unlikely, possible that… đưa ra ý kiến mà không khẳng định trực tiếp.',
        examples: [
          { en: 'It is likely that prices will rise next year.', vi: 'Có khả năng giá sẽ tăng vào năm sau.', mark: 'It is likely that' },
          { en: 'It is unlikely that the trend will change soon.', vi: 'Khó có khả năng xu hướng này thay đổi sớm.', mark: 'It is unlikely that' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng từ khẳng định mạnh khi dữ liệu chưa đủ, hoặc dùng sai dạng động từ sau to.',
        mistakes: [
          { wrong: 'This proves that the drug definitely works.', right: 'This suggests that the drug may work.', why: 'Khi dữ liệu chưa đủ, không nên dùng khẳng định tuyệt đối như proves, definitely.' },
          { wrong: 'It seems to suggests a link.', right: 'It seems to suggest a link.', why: 'Sau to là động từ nguyên mẫu.' },
        ],
      },
    ],
    quiz: [
      { q: "The findings ___ to support the theory.", options: ["seeming", "seems", "seem"], answer: 2, explain: "Chủ ngữ findings số nhiều nên dùng seem." },
      { q: "This ___ partly explain the change.", options: ["may", "must", "mustn't"], answer: 0, explain: "May diễn tả khả năng, mang tính rào đón." },
      { q: "It is ___ that unemployment will fall.", options: ["likelihood", "likely", "likes"], answer: 1, explain: "Cấu trúc It is likely that… là rào đón." },
      { q: "The data ___ a possible link between diet and health.", options: ["guarantee", "prove", "suggest"], answer: 2, explain: "Suggest nêu khả năng mà không khẳng định chắc chắn." },
      { q: "Choose the correct sentence.", options: ["This could indicate a shift in behaviour.", "This could indicates a shift in behaviour.", "This could to indicate a shift in behaviour."], answer: 0, explain: "Sau could dùng động từ nguyên mẫu, không chia." },
    ],
  },
  {
    id: 'c1-do-emphasis',
    level: 'C1',
    order: 7,
    title: 'Do, does, did để nhấn mạnh',
    titleEn: 'Emphatic Do',
    summary: 'Dùng do, does, did để nhấn mạnh, phản bác hoặc khẳng định lại điều người khác nghi ngờ.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Do nhấn mạnh là gì?',
        body: 'Khi muốn nhấn mạnh một khẳng định, đặc biệt để phản bác ý kiến người khác, thêm do, does hoặc did trước động từ chính. Chỉ dùng trong câu khẳng định.',
        formula: 'S + do / does / did + V (nguyên mẫu)',
        examples: [
          { en: 'I do like your new haircut!', vi: 'Tôi thật sự thích kiểu tóc mới của bạn!', mark: 'do like' },
          { en: 'She did finish the report on time.', vi: 'Cô ấy thật sự đã hoàn thành báo cáo đúng hạn.', mark: 'did finish' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các tình huống thường gặp',
        body: 'Thường dùng khi có sự nghi ngờ hoặc khi cần khẳng định mạnh.',
        bullets: [
          'Phản bác: "You never listen!" - "I do listen!"',
          'Khẳng định sự thật: He does know the answer.',
          'Xin lỗi chân thành: I did apologize, I really did.',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Chia theo chủ ngữ và thì',
        body: 'Với he, she, it dùng does. Với I, you, we, they dùng do. Với thì quá khứ dùng did. Động từ sau đó vẫn ở dạng nguyên mẫu.',
        examples: [
          { en: 'He does work hard, even on weekends.', vi: 'Anh ấy thật sự làm việc chăm chỉ, kể cả cuối tuần.', mark: 'does work' },
          { en: 'We did enjoy the concert.', vi: 'Chúng tôi thật sự đã thích buổi hoà nhạc.', mark: 'did enjoy' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Với be và have',
        body: 'Với động từ be không dùng do để nhấn mạnh; dùng really hoặc certainly. Với have, có thể dùng do để nhấn mạnh khi nó mang nghĩa sở hữu.',
        examples: [
          { en: 'She really is kind.', vi: 'Cô ấy thật sự tốt bụng.', mark: 'really is' },
          { en: 'I do have a plan.', vi: 'Tôi thật sự có một kế hoạch.', mark: 'do have' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng do với be, hoặc dùng quá khứ sau do và did.',
        mistakes: [
          { wrong: 'She does is tired.', right: 'She is really tired.', why: 'Với be không dùng do để nhấn mạnh.' },
          { wrong: 'I do went there yesterday.', right: 'I did go there yesterday.', why: 'Sau did hoặc do dùng nguyên mẫu go, không dùng went.' },
        ],
      },
    ],
    quiz: [
      { q: "Your friend says: \"You never help.\" You reply: \"I ___ help! I did the dishes.\"", options: ["do helps", "do help", "helps"], answer: 0, explain: "Do là dạng nhấn mạnh; dùng do help." },
      { q: "He ___ know the answer, even though he did not say it.", options: ["do knows", "does know", "is know"], answer: 1, explain: "Với he, nhấn mạnh bằng does cộng động từ nguyên mẫu." },
      { q: "We ___ finish the project before the deadline.", options: ["did finished", "do finished", "did finish"], answer: 2, explain: "Did cộng động từ nguyên mẫu: did finish." },
      { q: "She ___ really tired after the trip.", options: ["is", "does is", "did is"], answer: 0, explain: "Với be, nhấn mạnh bằng really chứ không dùng do." },
      { q: "Choose the correct sentence.", options: ["I do loves this song!", "I do love this song!", "I does love this song!"], answer: 1, explain: "Với I dùng do cộng động từ nguyên mẫu." },
    ],
  },
];
