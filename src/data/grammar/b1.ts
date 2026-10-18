import type { GrammarLessonDetail } from './types';

/** Cấp B1: hiện tại hoàn thành, câu điều kiện loại 1–2, câu bị động. */
export const B1_GRAMMAR: GrammarLessonDetail[] = [
  {
    id: 'b1-present-perfect',
    level: 'B1',
    order: 1,
    title: 'Hiện tại hoàn thành',
    titleEn: 'Present Perfect',
    summary: 'Nói kinh nghiệm, việc vừa xong và việc bắt đầu trong quá khứ nhưng còn ảnh hưởng đến hiện tại.',
    minutes: 11,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Hiện tại hoàn thành là gì?',
        body: 'Thì này nối **quá khứ với hiện tại**. Không nêu thời điểm cụ thể đã xảy ra, mà nhấn vào kết quả hoặc trải nghiệm còn đến bây giờ.',
        formula: 'have / has + V3 (quá khứ phân từ)',
        examples: [
          { en: 'I have visited Japan twice.', vi: 'Tôi đã đến Nhật Bản hai lần.', mark: 'have visited' },
          { en: 'She has just finished her homework.', vi: 'Cô ấy vừa làm xong bài tập.', mark: 'has just finished' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Ba trường hợp chính',
        body: 'Dùng cho kinh nghiệm đến nay, việc vừa xảy ra, và việc bắt đầu trong quá khứ còn tiếp diễn.',
        bullets: [
          'Kinh nghiệm: ever, never, before, once, twice',
          'Vừa xong: just, yet, already',
          'Khoảng thời gian: for + khoảng (for two years), since + mốc (since 2020)',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Have hoặc has, và dạng V3',
        body: 'Với I, you, we, they dùng **have**; với he, she, it dùng **has**. Động từ theo dạng V3: có quy tắc thêm -ed, bất quy tắc theo bảng (eat → eaten).',
        examples: [
          { en: 'We have lived here since 2015.', vi: 'Chúng tôi sống ở đây từ năm 2015.', mark: 'have lived' },
          { en: 'He has eaten sushi before.', vi: 'Anh ấy từng ăn sushi rồi.', mark: 'has eaten' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'For và since',
        body: '**For** đi với một khoảng thời gian (for three days). **Since** đi với một mốc thời gian (since Monday). Không dùng cùng với quá khứ đơn khi nói về việc vẫn tiếp diễn.',
        examples: [
          { en: 'I have worked here for five years.', vi: 'Tôi làm việc ở đây được năm năm.', mark: 'for five years' },
          { en: 'She has known him since school.', vi: 'Cô ấy quen anh ấy từ thời đi học.', mark: 'since school' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng quá khứ đơn với mốc thời gian không xác định, hoặc thiếu have.',
        mistakes: [
          { wrong: 'I have went to London.', right: 'I have been to London.', why: 'Dùng V3 của go là gone/been; "been to" để nói đã từng đến.' },
          { wrong: 'I have seen him yesterday.', right: 'I saw him yesterday.', why: 'Có mốc thời gian cụ thể (yesterday) thì dùng quá khứ đơn.' },
          { wrong: 'She have lived here.', right: 'She has lived here.', why: 'Ngôi she đi với has.' },
        ],
      },
    ],
    quiz: [
      { q: "I ___ never ___ sushi.", options: ["have / eaten", "have / eat", "did / eat"], answer: 0, explain: "Hiện tại hoàn thành cần have + V3: eaten." },
      { q: "She has lived here ___ 2018.", options: ["for", "since", "during"], answer: 1, explain: "Since đi với mốc thời gian, 2018 là một mốc." },
      { q: "They ___ already ___ the report.", options: ["has / finished", "have / finish", "have / finished"], answer: 2, explain: "They là số nhiều nên dùng have, và finished là V3." },
      { q: "We have known each other ___ three years.", options: ["for", "since", "at"], answer: 0, explain: "Three years là một khoảng thời gian nên dùng for." },
      { q: "Choose the correct sentence.", options: ["I have seen that film last week.", "I saw that film last week.", "I have seen that film last week ago."], answer: 1, explain: "Last week là mốc cụ thể đã qua nên dùng quá khứ đơn." },
    ],
  },
  {
    id: 'b1-conditionals',
    level: 'B1',
    order: 2,
    title: 'Câu điều kiện loại 1 và 2',
    titleEn: 'First and Second Conditionals',
    summary: 'Nói điều có thể xảy ra trong tương lai và điều chỉ là giả định.',
    minutes: 11,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Câu điều kiện là gì?',
        body: 'Câu điều kiện gồm **mệnh đề if** (điều kiện) và **mệnh đề chính** (kết quả). Loại 1 nói điều có thật trong tương lai; loại 2 nói điều không có thật hoặc khó xảy ra.',
        examples: [
          { en: 'If it rains, we will stay home.', vi: 'Nếu trời mưa, chúng tôi sẽ ở nhà.', mark: 'If it rains' },
          { en: 'If I had more time, I would learn piano.', vi: 'Nếu tôi có nhiều thời gian hơn, tôi sẽ học piano.', mark: 'If I had' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Hai loại, hai mức độ',
        body: 'Loại 1: khả năng có thật ở tương lai. Loại 2: tình huống giả định hiện tại hoặc tương lai, khó xảy ra.',
        bullets: ['Loại 1: If + hiện tại đơn, will + V', 'Loại 2: If + quá khứ đơn, would + V'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Loại 1: khả năng có thật',
        body: 'Mệnh đề if dùng **hiện tại đơn** (không dùng will); mệnh đề chính dùng **will**.',
        formula: 'If + S + V (hiện tại), S + will + V',
        examples: [
          { en: 'If you study, you will pass the exam.', vi: 'Nếu bạn học, bạn sẽ đậu kỳ thi.', mark: 'you will pass' },
          { en: 'If she calls, I will answer.', vi: 'Nếu cô ấy gọi, tôi sẽ trả lời.', mark: 'I will answer' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Loại 2: giả định',
        body: 'Mệnh đề if dùng **quá khứ đơn** (với be thường dùng **were** cho mọi ngôi); mệnh đề chính dùng **would**.',
        formula: 'If + S + V2 / were, S + would + V',
        examples: [
          { en: 'If I were rich, I would travel the world.', vi: 'Nếu tôi giàu, tôi sẽ đi khắp thế giới.', mark: 'If I were' },
          { en: 'If he knew the answer, he would tell us.', vi: 'Nếu anh ấy biết đáp án, anh ấy đã nói với chúng tôi.', mark: 'would tell' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi thường gặp nhất là dùng will trong mệnh đề if.',
        mistakes: [
          { wrong: 'If it will rain, I will stay.', right: 'If it rains, I will stay.', why: 'Mệnh đề if dùng hiện tại đơn, không dùng will.' },
          { wrong: 'If I was you, I would go.', right: 'If I were you, I would go.', why: 'Loại 2 dùng were với I và các ngôi khác khi nói giả định.' },
          { wrong: 'If I would have time, I would call.', right: 'If I had time, I would call.', why: 'Mệnh đề if loại 2 dùng quá khứ đơn, không dùng would.' },
        ],
      },
    ],
    quiz: [
      { q: "If it ___ tomorrow, we will cancel the trip.", options: ["will rain", "rains", "rained"], answer: 1, explain: "Loại 1: mệnh đề if dùng hiện tại đơn." },
      { q: "If I ___ a bird, I would fly.", options: ["am", "will be", "were"], answer: 2, explain: "Loại 2 dùng were khi giả định với I." },
      { q: "If you heat ice, it ___.", options: ["melts", "will melt", "would melt"], answer: 0, explain: "Sự thật hiển nhiên dùng hiện tại đơn, không cần loại điều kiện." },
      { q: "If she ___ harder, she would pass.", options: ["studies", "studied", "will study"], answer: 1, explain: "Loại 2 dùng quá khứ đơn trong mệnh đề if." },
      { q: "Choose the correct sentence.", options: ["If you will call me, I will help you.", "If you would call me, I will help you.", "If you call me, I will help you."], answer: 2, explain: "Loại 1 đúng là if + hiện tại đơn, will + V." },
    ],
  },
  {
    id: 'b1-passive',
    level: 'B1',
    order: 3,
    title: 'Câu bị động (hiện tại và quá khứ)',
    titleEn: 'Passive Voice',
    summary: 'Nhấn vào việc được làm, khi người làm không quan trọng hoặc không rõ.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Câu bị động là gì?',
        body: 'Dùng khi **đối tượng bị tác động** là trọng tâm của câu. Người thực hiện có thể bỏ qua hoặc để sau by.',
        formula: 'S + be + V3 (+ by + người làm)',
        examples: [
          { en: 'This bridge was built in 1990.', vi: 'Cây cầu này được xây năm 1990.', mark: 'was built' },
          { en: 'English is spoken in many countries.', vi: 'Tiếng Anh được nói ở nhiều nước.', mark: 'is spoken' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Khi nào nên dùng bị động?',
        body: 'Khi không biết người làm là ai, khi không cần nhắc tới, hoặc khi muốn nhấn vào kết quả.',
        bullets: ['Không rõ người làm: My bike was stolen.', 'Ai đó biết rõ nhưng không quan trọng: The room is cleaned every day.'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Hiện tại: am / is / are + V3',
        body: 'Chia be theo thì của câu, rồi giữ nguyên V3. Hiện tại đơn: is/are + V3.',
        formula: 'is / are + V3 (hiện tại)',
        examples: [
          { en: 'Cars are made in factories.', vi: 'Ô tô được sản xuất trong nhà máy.', mark: 'are made' },
          { en: 'The letter is sent every week.', vi: 'Lá thư được gửi mỗi tuần.', mark: 'is sent' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Quá khứ: was / were + V3',
        body: 'Quá khứ đơn bị động: was hoặc were + V3. Số ít dùng was, số nhiều dùng were.',
        formula: 'was / were + V3 (quá khứ)',
        examples: [
          { en: 'The window was broken last night.', vi: 'Cửa sổ bị vỡ tối qua.', mark: 'was broken' },
          { en: 'The students were given new books.', vi: 'Các học sinh được phát sách mới.', mark: 'were given' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi thường gặp: dùng V2 thay cho V3, hoặc quên be.',
        mistakes: [
          { wrong: 'The car was steal.', right: 'The car was stolen.', why: 'Sau be phải dùng V3 (stolen), không dùng nguyên mẫu.' },
          { wrong: 'The book is write by him.', right: 'The book was written by him.', why: 'Quá khứ dùng was/were; V3 của write là written.' },
          { wrong: 'Dinner is cook.', right: 'Dinner is cooked.', why: 'Bị động cần V3 cooked.' },
        ],
      },
    ],
    quiz: [
      { q: "The house ___ built in 1920.", options: ["is", "were", "was"], answer: 2, explain: "Mốc 1920 là quá khứ và house số ít nên dùng was." },
      { q: "English ___ spoken here.", options: ["is", "are", "was being"], answer: 0, explain: "Hiện tại đơn bị động: is + V3, English là số ít." },
      { q: "My phone ___ yesterday.", options: ["stole", "was stolen", "stolen"], answer: 1, explain: "Bị động quá khứ: was + V3 (stolen)." },
      { q: "The students ___ given a test.", options: ["was", "is", "were"], answer: 2, explain: "Students số nhiều nên dùng were." },
      { q: "Choose the correct sentence.", options: ["The rules are explained every day.", "The rules explain every day.", "The rules are explain every day."], answer: 0, explain: "Bị động hiện tại: are + V3 (explained)." },
    ],
  },
  {
    id: 'b1-present-perfect-continuous',
    level: 'B1',
    order: 4,
    title: 'Hiện tại hoàn thành tiếp diễn',
    titleEn: 'Present Perfect Continuous',
    summary: 'Nói về một việc bắt đầu trong quá khứ và vẫn đang tiếp diễn hoặc vừa kết thúc.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Hiện tại hoàn thành tiếp diễn là gì?',
        body: 'Dùng have hoặc has been cộng V-ing để nhấn mạnh một quá trình kéo dài từ quá khứ đến hiện tại. Thường đi với for hoặc since.',
        formula: 'S + have / has been + V-ing',
        examples: [
          { en: 'I have been studying English for three years.', vi: 'Tôi đã học tiếng Anh được ba năm và vẫn đang học.', mark: 'have been studying' },
          { en: 'She has been waiting since 8 a.m.', vi: 'Cô ấy đã đợi từ 8 giờ sáng.', mark: 'has been waiting' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Ba trường hợp chính',
        body: 'Dùng khi hành động vẫn đang diễn ra, vừa kết thúc nhưng để lại dấu vết, hoặc muốn nhấn mạnh khoảng thời gian.',
        bullets: [
          'Đang diễn ra: It has been raining all day.',
          'Vừa kết thúc, còn dấu vết: You are sweaty. Have you been running?',
          'Nhấn mạnh thời gian: We have been living here since 2020.',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'For và since',
        body: 'For đi với khoảng thời gian (for two hours). Since đi với mốc thời gian (since Monday, since 2015).',
        examples: [
          { en: 'They have been talking for two hours.', vi: 'Họ đã nói chuyện hai tiếng rồi.', mark: 'for two hours' },
          { en: 'He has been working here since June.', vi: 'Anh ấy làm việc ở đây từ tháng Sáu.', mark: 'since June' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Chọn tiếp diễn hay hoàn thành',
        body: 'Khi nhấn mạnh số lần hoặc kết quả, dùng hiện tại hoàn thành đơn. Khi nhấn mạnh quá trình, dùng hiện tại hoàn thành tiếp diễn.',
        examples: [
          { en: 'I have written three letters today.', vi: 'Hôm nay tôi đã viết ba lá thư.', mark: 'have written three letters' },
          { en: 'I have been writing all morning.', vi: 'Tôi đã viết suốt buổi sáng.', mark: 'have been writing' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng hiện tại đơn với since hoặc for, và dùng tiếp diễn với động từ chỉ trạng thái.',
        mistakes: [
          { wrong: 'I am studying here since 2019.', right: 'I have been studying here since 2019.', why: 'Với since hoặc for dùng hiện tại hoàn thành, không dùng hiện tại đơn.' },
          { wrong: 'She has been knowing me for ten years.', right: 'She has known me for ten years.', why: 'Động từ chỉ trạng thái như know không dùng ở dạng tiếp diễn.' },
        ],
      },
    ],
    quiz: [
      { q: "It ___ raining since this morning.", options: ["has been", "is been", "have been"], answer: 0, explain: "It là số ít nên dùng has been." },
      { q: "We ___ waiting for the bus for twenty minutes.", options: ["are been", "have been", "have be"], answer: 1, explain: "We đi với have been, cộng V-ing." },
      { q: "He has lived here ___ 2015.", options: ["for", "during", "since"], answer: 2, explain: "Since đi với mốc thời gian như 2015." },
      { q: "Your hands are covered in paint. What ___?", options: ["have you been doing", "did you do", "do you do"], answer: 0, explain: "Kết quả còn thấy hiện tại, dùng have you been doing." },
      { q: "Choose the correct sentence.", options: ["I am been waiting for an hour.", "I have been waiting for an hour.", "I have been wait for an hour."], answer: 1, explain: "Have been đi với V-ing: waiting." },
    ],
  },
  {
    id: 'b1-past-continuous',
    level: 'B1',
    order: 5,
    title: 'Quá khứ tiếp diễn',
    titleEn: 'Past Continuous',
    summary: 'Mô tả hành động đang diễn ra tại một thời điểm trong quá khứ.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Quá khứ tiếp diễn là gì?',
        body: 'Dùng was hoặc were cộng V-ing để nói hành động đang diễn ra tại một thời điểm hoặc trong một khoảng thời gian ở quá khứ.',
        formula: 'S + was / were + V-ing',
        examples: [
          { en: 'At 9 p.m. last night, I was watching TV.', vi: 'Lúc 9 giờ tối qua, tôi đang xem TV.', mark: 'was watching' },
          { en: 'They were playing chess all afternoon.', vi: 'Họ chơi cờ cả buổi chiều.', mark: 'were playing' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Ba cách dùng chính',
        body: 'Dùng để tả bối cảnh, hai hành động song song, hoặc một hành động đang diễn ra thì bị cắt ngang.',
        bullets: [
          'Đang diễn ra tại một thời điểm: At noon, we were having lunch.',
          'Hai hành động song song: While I was cooking, my sister was studying.',
          'Bị cắt ngang bởi hành động khác (quá khứ đơn): It was raining when we left.',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Was hay were',
        body: 'Với I, he, she, it dùng was. Với you, we, they dùng were.',
        examples: [
          { en: 'She was sleeping when I called.', vi: 'Cô ấy đang ngủ khi tôi gọi.', mark: 'was sleeping' },
          { en: 'You were not listening to me.', vi: 'Bạn đã không nghe tôi nói.', mark: 'were not listening' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'While và when',
        body: 'While đi với hành động đang diễn ra kéo dài. When đi với hành động ngắn xảy ra cắt ngang. Cả hai có thể đứng đầu hoặc giữa câu.',
        examples: [
          { en: 'While we were walking, it started to rain.', vi: 'Khi chúng tôi đang đi bộ thì trời bắt đầu mưa.', mark: 'While we were walking' },
          { en: 'I was reading when the phone rang.', vi: 'Tôi đang đọc sách thì điện thoại reo.', mark: 'when the phone rang' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng tiếp diễn cho hành động đã hoàn tất, hoặc dùng tiếp diễn cho hành động ngắn bị cắt ngang.',
        mistakes: [
          { wrong: 'I was go to school yesterday.', right: 'I went to school yesterday.', why: 'Hành động đã hoàn tất trong quá khứ dùng quá khứ đơn.' },
          { wrong: 'When I was walking, the phone was ring.', right: 'When I was walking, the phone rang.', why: 'Hành động ngắn bị cắt ngang dùng quá khứ đơn.' },
        ],
      },
    ],
    quiz: [
      { q: "At 8 o'clock yesterday, they ___ football.", options: ["play", "were playing", "plays"], answer: 1, explain: "Thời điểm cụ thể trong quá khứ dùng quá khứ tiếp diễn." },
      { q: "While she ___ the piano, her brother was singing.", options: ["play", "plays", "was playing"], answer: 2, explain: "Sau while là hành động đang diễn ra ở quá khứ: was playing." },
      { q: "We ___ a film at 9 p.m. last night.", options: ["were watching", "was watch", "watching"], answer: 0, explain: "We đi với were, cộng V-ing." },
      { q: "The children ___ in the garden when it began to rain.", options: ["play", "were playing", "was play"], answer: 1, explain: "Children là số nhiều nên dùng were playing." },
      { q: "Choose the correct sentence.", options: ["They walking home when it was started raining.", "They were walk home when it started raining.", "They were walking home when it started raining."], answer: 2, explain: "Quá khứ tiếp diễn: were + V-ing." },
    ],
  },
  {
    id: 'b1-used-to-would',
    level: 'B1',
    order: 6,
    title: 'Used to và would: thói quen trong quá khứ',
    titleEn: 'Used To and Would',
    summary: 'Nói về thói quen hoặc trạng thái đã có trong quá khứ nhưng nay không còn.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Used to và would là gì?',
        body: 'Used to và would đều chỉ thói quen hoặc trạng thái trong quá khứ mà hiện nay không còn nữa.',
        formula: 'S + used to + V  ·  S + would + V (thói quen)',
        examples: [
          { en: 'I used to live in a small village.', vi: 'Trước đây tôi từng sống ở một ngôi làng nhỏ.', mark: 'used to live' },
          { en: 'When I was a child, we would play outside every evening.', vi: 'Hồi nhỏ, tối nào chúng tôi cũng chơi ngoài trời.', mark: 'would play' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Khi nào dùng cái nào?',
        body: 'Used to dùng được cho cả thói quen và trạng thái. Would chỉ dùng cho thói quen lặp lại.',
        bullets: ['Used to: thói quen hoặc trạng thái (be, have, like, live).', 'Would: chỉ thói quen lặp lại, không dùng cho trạng thái.', 'Cả hai chỉ dùng cho việc đã kết thúc.'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Used to cho trạng thái',
        body: 'Với trạng thái trong quá khứ như be, have, like, chỉ dùng được used to, không dùng would.',
        examples: [
          { en: 'She used to have long hair.', vi: 'Cô ấy từng có mái tóc dài.', mark: 'used to have' },
          { en: 'We used to be neighbours.', vi: 'Chúng tôi từng là hàng xóm.', mark: 'used to be' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Phủ định và nghi vấn',
        body: 'Phủ định: didn\'t use to, không dùng used not to. Nghi vấn: đưa did lên đầu câu, Did you use to…?',
        examples: [
          { en: "I didn't use to like coffee.", vi: 'Trước đây tôi không thích cà phê.', mark: "didn't use to" },
          { en: 'Did you use to play football?', vi: 'Hồi trước bạn có hay chơi bóng đá không?', mark: 'Did you use to' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là quên -d ở used, hoặc dùng would cho trạng thái.',
        mistakes: [
          { wrong: 'I use to play tennis.', right: 'I used to play tennis.', why: 'Used to luôn có -d ở used.' },
          { wrong: 'He would be very shy.', right: 'He used to be very shy.', why: 'Would không dùng cho trạng thái be; dùng used to.' },
        ],
      },
    ],
    quiz: [
      { q: "When I was young, I ___ to school by bus.", options: ["use to go", "would to go", "used to go"], answer: 2, explain: "Used to luôn có -d." },
      { q: "He ___ play chess with his grandfather every Sunday.", options: ["would", "would to", "is"], answer: 0, explain: "Would dùng cho thói quen lặp lại." },
      { q: "I ___ hate spiders when I was a kid.", options: ["would", "used to", "would to"], answer: 1, explain: "Hate là trạng thái, nên dùng used to, không dùng would." },
      { q: "___ you use to play football?", options: ["Is", "Used", "Did"], answer: 2, explain: "Câu hỏi với used to dùng did." },
      { q: "Choose the correct sentence.", options: ["She used to be a teacher.", "She use to be a teacher.", "She used be a teacher."], answer: 0, explain: "Used to đi với động từ nguyên mẫu: be." },
    ],
  },
  {
    id: 'b1-question-tags',
    level: 'B1',
    order: 7,
    title: 'Câu hỏi đuôi',
    titleEn: 'Question Tags',
    summary: 'Thêm câu hỏi đuôi để xác nhận thông tin hoặc hỏi ý kiến người khác.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Câu hỏi đuôi là gì?',
        body: 'Câu hỏi đuôi là phần ngắn thêm vào cuối câu để xác nhận điều người nói cho là đúng. Câu khẳng định thì đuôi phủ định, và ngược lại.',
        formula: 'Khẳng định, phủ định?  ·  Phủ định, khẳng định?',
        examples: [
          { en: "It's a nice day, isn't it?", vi: 'Hôm nay đẹp trời nhỉ?', mark: "isn't it" },
          { en: "You don't like coffee, do you?", vi: 'Bạn không thích cà phê đúng không?', mark: 'do you' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Mục đích của câu hỏi đuôi',
        body: 'Dùng để kiểm tra thông tin, mở đầu câu chuyện hoặc tìm sự đồng ý.',
        bullets: [
          'Xác nhận, mong đợi đồng ý: You are from Hanoi, aren\'t you?',
          'Hỏi thật sự, còn chưa chắc: She works here, doesn\'t she?',
          'Mở đầu trò chuyện thân mật: Nice weather, isn\'t it?',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Đảo trợ động từ',
        body: 'Dùng trợ động từ hoặc be của câu chính làm đuôi. Nếu câu chính không có trợ động từ, dùng do, does hoặc did.',
        examples: [
          { en: 'You can swim, can\'t you?', vi: 'Bạn biết bơi mà, đúng không?', mark: "can't you" },
          { en: 'He went home, didn\'t he?', vi: 'Anh ấy về nhà rồi, đúng không?', mark: "didn't he" },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Đuôi với I am và let\'s',
        body: 'Với I am, đuôi là aren\'t I? Với let\'s, đuôi là shall we? Câu mệnh lệnh thường dùng will you? hoặc won\'t you?',
        examples: [
          { en: "I'm late, aren't I?", vi: 'Tôi đến muộn rồi, phải không?', mark: "aren't I" },
          { en: "Let's go for a walk, shall we?", vi: 'Đi dạo nhé, được không?', mark: 'shall we' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là giữ nguyên chiều khẳng định hoặc phủ định của câu chính khi làm đuôi.',
        mistakes: [
          { wrong: 'She is your sister, is she?', right: "She is your sister, isn't she?", why: 'Câu chính khẳng định thì đuôi phủ định.' },
          { wrong: "You don't like tea, don't you?", right: "You don't like tea, do you?", why: 'Câu chính phủ định thì đuôi khẳng định, dùng do you.' },
        ],
      },
    ],
    quiz: [
      { q: "It's cold today, ___?", options: ["isn't it", "is it", "doesn't it"], answer: 0, explain: "Câu chính khẳng định, đuôi phủ định: isn't it." },
      { q: "You live near the station, ___?", options: ["are you", "don't you", "do you"], answer: 1, explain: "Câu chính khẳng định với live, đuôi là don't you." },
      { q: "Lan didn't come yesterday, ___?", options: ["didn't she", "was she", "did she"], answer: 2, explain: "Câu chính phủ định, đuôi khẳng định: did she." },
      { q: "I'm right, ___?", options: ["aren't I", "am I", "isn't I"], answer: 0, explain: "Với I am, đuôi chuẩn là aren't I." },
      { q: "Choose the correct sentence.", options: ["Let's start now, will we?", "Let's start now, shall we?", "Let's start now, let's?"], answer: 1, explain: "Đuôi của let's là shall we." },
    ],
  },
  {
    id: 'b1-modals-possibility',
    level: 'B1',
    order: 8,
    title: 'May, might và could: khả năng',
    titleEn: 'May, Might and Could for Possibility',
    summary: 'Nói về khả năng có thể xảy ra bằng may, might và could.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Khả năng là gì?',
        body: 'May, might và could diễn tả điều có thể xảy ra ở hiện tại hoặc tương lai, khi người nói chưa chắc chắn.',
        formula: 'S + may / might / could + V (nguyên mẫu)',
        examples: [
          { en: 'It may rain this afternoon.', vi: 'Chiều nay trời có thể mưa.', mark: 'may rain' },
          { en: 'She might be late.', vi: 'Cô ấy có thể sẽ đến muộn.', mark: 'might be' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Mức độ chắc chắn',
        body: 'Will và must cho thấy người nói khá chắc. May, might, could cho thấy khả năng trung bình hoặc thấp.',
        bullets: ['Chắc chắn cao: It will rain tomorrow.', 'Khả năng trung bình: It may / might / could rain.', 'Khả năng thấp: It might not rain.'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Phủ định với may not và might not',
        body: 'Thêm not sau may hoặc might: may not, might not. Không dùng dạng viết tắt mayn\'t hay mightn\'t.',
        examples: [
          { en: 'He may not come to the party.', vi: 'Anh ấy có thể sẽ không đến dự tiệc.', mark: 'may not come' },
          { en: "They might not know the answer.", vi: 'Họ có thể không biết đáp án.', mark: 'might not know' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Khả năng về hiện tại với be',
        body: 'Sau may, might, could dùng động từ nguyên mẫu, kể cả với be. Không thêm -s hay to.',
        examples: [
          { en: 'That might be my bag.', vi: 'Đó có thể là túi của tôi.', mark: 'might be' },
          { en: 'It could be a mistake.', vi: 'Có thể đó là một lỗi.', mark: 'could be' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là thêm to sau modal, hoặc dùng going to sau might.',
        mistakes: [
          { wrong: 'He might to come.', right: 'He might come.', why: 'Sau modal không dùng to.' },
          { wrong: 'She might going to be late.', right: 'She might be late.', why: 'Modal đi với động từ nguyên mẫu, không dùng going to.' },
        ],
      },
    ],
    quiz: [
      { q: "I'm not sure. It ___ be true.", options: ["mights", "might", "might to"], answer: 1, explain: "Might đi với động từ nguyên mẫu be." },
      { q: "She ___ not be at home now.", options: ["mays", "may to", "may"], answer: 2, explain: "May not diễn tả khả năng không xảy ra." },
      { q: "It ___ snow tomorrow, but I'm not certain.", options: ["could", "coulds", "could to"], answer: 0, explain: "Could diễn tả khả năng, không thêm -s hay to." },
      { q: "Take an umbrella. It ___ rain later.", options: ["must", "might", "mustn't"], answer: 1, explain: "Người nói chưa chắc, nên dùng might." },
      { q: "Choose the correct sentence.", options: ["You might to be right.", "You might are right.", "You might be right."], answer: 2, explain: "Might be là dạng đúng." },
    ],
  },
  {
    id: 'b1-future-forms',
    level: 'B1',
    order: 9,
    title: 'Các cách nói về tương lai',
    titleEn: 'Future Forms',
    summary: 'Chọn đúng giữa will, going to, hiện tại tiếp diễn và hiện tại đơn khi nói về tương lai.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Tiếng Anh có nhiều cách nói tương lai',
        body: 'Mỗi cách phù hợp với một loại dự định khác nhau: lịch trình cố định, kế hoạch đã sắp xếp với người khác, dự đoán có căn cứ, hoặc quyết định tức thời.',
        examples: [
          { en: 'The train leaves at 6 a.m. tomorrow.', vi: 'Ngày mai tàu khởi hành lúc 6 giờ sáng.', mark: 'leaves at 6 a.m.' },
          { en: 'We are meeting the manager at noon.', vi: 'Chúng tôi có cuộc hẹn với quản lý lúc 12 giờ trưa.', mark: 'are meeting' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Bốn cách chính',
        body: 'Chọn cách nói theo mức độ chắc chắn và cách người nói đã định trước hay không.',
        bullets: [
          'Hiện tại đơn: lịch cố định (The bus leaves at 7.)',
          'Hiện tại tiếp diễn: kế hoạch đã sắp xếp với người, nơi (I\'m flying to Paris on Friday.)',
          'Going to: dự định và dấu hiệu nhìn thấy (It\'s going to rain.)',
          'Will: quyết định tức thời, dự đoán, lời hứa (I\'ll help you.)',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Will và going to',
        body: 'Will thường dùng khi dự đoán dựa trên niềm tin hoặc khi quyết định ngay lúc nói. Going to thường dùng khi có dấu hiệu hoặc dự định trước.',
        examples: [
          { en: 'I think it will be sunny tomorrow.', vi: 'Tôi nghĩ ngày mai trời sẽ nắng.', mark: 'will be sunny' },
          { en: 'Look at those dark clouds. It is going to pour.', vi: 'Nhìn đám mây đen kia. Trời sắp đổ mưa to.', mark: 'is going to pour' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Lịch cố định dùng hiện tại đơn',
        body: 'Dùng hiện tại đơn cho lịch tàu xe, chương trình, thời khoá biểu, dù đang nói về tương lai.',
        examples: [
          { en: 'The class starts at nine tomorrow.', vi: 'Lớp học bắt đầu lúc 9 giờ ngày mai.', mark: 'starts at nine' },
          { en: 'The shop opens on Monday.', vi: 'Cửa hàng mở cửa vào thứ Hai.', mark: 'opens on Monday' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng will với V-ing, hoặc dùng going to với động từ có -s.',
        mistakes: [
          { wrong: 'I will meeting my friend tonight.', right: 'I am meeting my friend tonight.', why: 'Kế hoạch đã sắp xếp dùng hiện tại tiếp diễn; will đi với động từ nguyên mẫu.' },
          { wrong: 'It is going to rains tomorrow.', right: 'It is going to rain tomorrow.', why: 'Sau going to dùng động từ nguyên mẫu.' },
        ],
      },
    ],
    quiz: [
      { q: "The school ___ at 8 a.m. on Monday.", options: ["opened", "open", "opens"], answer: 2, explain: "Lịch cố định dùng hiện tại đơn, và school là số ít." },
      { q: "I ___ dinner with my parents on Friday.", options: ["am having", "will had", "had"], answer: 0, explain: "Kế hoạch đã sắp xếp với người khác dùng hiện tại tiếp diễn." },
      { q: "Look at those black clouds! It ___ rain.", options: ["going to", "is going to", "is going"], answer: 1, explain: "Dấu hiệu nhìn thấy được dùng is going to + V." },
      { q: "I think she ___ pass the exam.", options: ["passes", "to", "will"], answer: 2, explain: "Dự đoán dựa trên niềm tin dùng will." },
      { q: "Choose the correct sentence.", options: ["We are meeting the director tomorrow.", "We will meeting the director tomorrow.", "We are meet the director tomorrow."], answer: 0, explain: "Kế hoạch đã sắp xếp dùng are meeting." },
    ],
  },
];
