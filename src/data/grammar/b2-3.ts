import type { GrammarLessonDetail } from './types';

/**
 * Cấp B2 (phần bổ sung 2, 15/11/2026): tương lai hoàn thành, bị động nâng cao, wish/as if, tương phản
 * (whereas, whatever, no matter), thì khi kể chuyện, suy đoán/needn't have, mạo từ + hoà hợp, cụm phân từ.
 * Học từ khoảng trống khi đối chiếu với lộ trình B2 của AIO English; lời giải thích và ví dụ do Band 9 tự viết.
 */
export const B2_GRAMMAR_EXTRA_2: GrammarLessonDetail[] = [
  {
    id: 'b2-future-perfect',
    level: 'B2',
    order: 15,
    title: 'Tương lai hoàn thành và tương lai hoàn thành tiếp diễn',
    titleEn: 'Future Perfect and Future Perfect Continuous',
    summary: 'Nói việc sẽ xong, hoặc sẽ kéo dài bao lâu, tính đến một mốc trong tương lai.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Tương lai hoàn thành: will have + V3',
        body: 'Dùng khi một việc sẽ đã xong trước một mốc thời gian ở tương lai. Người nói đứng ở mốc đó và nhìn ngược lại.',
        formula: 'S + will have + V3',
        examples: [
          { en: 'I will have finished the report by six.', vi: 'Đến sáu giờ tôi sẽ làm xong báo cáo.', mark: 'will have finished' },
          { en: 'By next June, she will have graduated.', vi: 'Đến tháng Sáu tới, cô ấy sẽ đã tốt nghiệp.', mark: 'will have graduated' },
        ],
      },
      {
        label: 'Dấu hiệu',
        title: 'Mốc thời gian đi kèm',
        body: 'Thì này hầu như luôn đi với một mốc: by, by the time, before, in two years\' time.',
        bullets: [
          'by + thời điểm: by Friday, by 2030, by the end of the year',
          'by the time + mệnh đề hiện tại đơn: by the time you arrive',
          'before + mốc: before the exam starts',
        ],
        examples: [
          { en: 'By the time we arrive, the film will have started.', vi: 'Lúc chúng ta tới, phim sẽ đã bắt đầu.', mark: 'will have started' },
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Tương lai hoàn thành tiếp diễn: will have been + V-ing',
        body: 'Nhấn mạnh việc kéo dài liên tục bao lâu tính đến mốc tương lai. Thường có for + khoảng thời gian.',
        formula: 'S + will have been + V-ing',
        examples: [
          { en: 'By July, I will have been working here for ten years.', vi: 'Đến tháng Bảy, tôi sẽ làm ở đây được mười năm.', mark: 'will have been working' },
          { en: 'She will have been driving for six hours when she arrives.', vi: 'Lúc đến nơi, cô ấy sẽ đã lái xe sáu tiếng.', mark: 'will have been driving' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Hoàn thành hay hoàn thành tiếp diễn?',
        body: 'Hoàn thành nhìn vào kết quả hay số lần ("xong rồi", "đã đọc 3 cuốn"). Tiếp diễn nhìn vào độ dài thời gian ("đã đọc suốt 3 tiếng").',
        examples: [
          { en: 'By evening, I will have read three chapters.', vi: 'Đến tối, tôi sẽ đọc xong ba chương.', mark: 'will have read' },
          { en: 'By evening, I will have been reading for five hours.', vi: 'Đến tối, tôi sẽ đã đọc suốt năm tiếng.', mark: 'will have been reading' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi hay gặp là dùng will trong mệnh đề thời gian, hoặc thiếu have.',
        mistakes: [
          { wrong: 'By the time you will arrive, I will have left.', right: 'By the time you arrive, I will have left.', why: 'Sau by the time dùng hiện tại đơn, không dùng will.' },
          { wrong: 'I will finished the work by noon.', right: 'I will have finished the work by noon.', why: 'Thiếu have: will have + V3.' },
          { wrong: 'He will have been finished by then.', right: 'He will have finished by then.', why: 'Không trộn been với V3 ở thì hoàn thành đơn.' },
        ],
      },
    ],
    quiz: [
      { q: 'By next month, we ___ the project.', options: ['will finish', 'will have finished', 'have finished'], answer: 1, explain: 'Việc xong trước mốc tương lai: will have + V3.' },
      { q: 'By the time the bus ___, we will have eaten.', options: ['will come', 'comes', 'will have come'], answer: 1, explain: 'Sau by the time dùng hiện tại đơn: comes.' },
      { q: 'In June, she ___ here for ten years.', options: ['will have been working', 'will have worked', 'is working'], answer: 0, explain: 'Nhấn mạnh khoảng thời gian kéo dài: will have been working.' },
      { q: 'Which sentence is correct?', options: ['I will have finish by six.', 'I will have finished by six.', 'I will has finished by six.'], answer: 1, explain: 'Cấu trúc đúng là will have + V3.' },
      { q: 'By 2030, he ___ three novels. (kết quả, đếm số lượng)', options: ['will have written', 'will have been writing', 'will write'], answer: 0, explain: 'Nói về kết quả đếm được nên dùng hoàn thành đơn.' },
    ],
  },
  {
    id: 'b2-passive-advanced',
    level: 'B2',
    order: 16,
    title: 'Bị động nâng cao: get, make/see/hear, tường thuật',
    titleEn: 'Advanced Passive',
    summary: 'Dùng get passive, bị động của make/see/hear và mẫu "He is said to be…".',
    minutes: 12,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Bị động với get',
        body: 'Get + V3 dùng trong văn nói, thường cho việc xảy ra bất ngờ, không mong muốn hoặc nằm ngoài ý muốn của chủ ngữ.',
        formula: 'S + get/got + V3',
        examples: [
          { en: 'He got paid on Friday.', vi: 'Anh ấy được trả lương vào thứ Sáu.', mark: 'got paid' },
          { en: 'The window got broken during the storm.', vi: 'Cửa sổ bị vỡ trong cơn bão.', mark: 'got broken' },
          { en: 'She got hurt while skiing.', vi: 'Cô ấy bị thương khi trượt tuyết.', mark: 'got hurt' },
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Bị động của make, see, hear',
        body: 'Ở câu chủ động, sau make/see/hear là động từ nguyên mẫu không to. Sang bị động, to xuất hiện lại. Với see/hear còn dùng được V-ing khi thấy hành động đang diễn ra.',
        formula: 'S + be made to + V | S + be seen/heard + to V / V-ing',
        examples: [
          { en: 'They made him wait. → He was made to wait.', vi: 'Họ bắt anh ta chờ. → Anh ta bị bắt chờ.', mark: 'was made to wait' },
          { en: 'People saw her leave. → She was seen to leave.', vi: 'Người ta thấy cô ấy rời đi.', mark: 'was seen to leave' },
          { en: 'He was heard singing in the shower.', vi: 'Người ta nghe thấy anh ấy hát trong phòng tắm.', mark: 'was heard singing' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Bị động tường thuật: is said to…',
        body: 'Với say, think, believe, report, know… có hai cách: It is said that… hoặc S + is said to V. Dùng to have + V3 khi việc xảy ra trước thời điểm nói.',
        formula: 'It is said that S + V | S + is said to V / to have V3',
        examples: [
          { en: 'It is said that he is rich. → He is said to be rich.', vi: 'Người ta nói anh ta giàu.', mark: 'is said to be' },
          { en: 'She is believed to have left the country.', vi: 'Người ta tin cô ấy đã rời khỏi đất nước.', mark: 'to have left' },
        ],
      },
      {
        label: 'Quy tắc 3',
        title: 'Bị động tiếp diễn và hoàn thành',
        body: 'Có thể đặt be being + V3 (đang bị làm) hoặc had been + V3 (đã bị làm trước đó) để kể chuyện mạch lạc.',
        examples: [
          { en: 'The road is being repaired this week.', vi: 'Con đường đang được sửa trong tuần này.', mark: 'is being repaired' },
          { en: 'By the time I called, the tickets had been sold.', vi: 'Lúc tôi gọi thì vé đã bán hết.', mark: 'had been sold' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Hay quên to ở bị động của make, hoặc nhầm dạng to have V3 trong bị động tường thuật.',
        mistakes: [
          { wrong: 'I was made wait for an hour.', right: 'I was made to wait for an hour.', why: 'Bị động của make cần to + V.' },
          { wrong: 'He is said that he is a spy.', right: 'He is said to be a spy.', why: 'Hoặc dùng It is said that…, hoặc S + is said to V; không trộn hai kiểu.' },
          { wrong: 'My car got repair yesterday.', right: 'My car got repaired yesterday.', why: 'Sau get dùng V3: repaired.' },
        ],
      },
    ],
    quiz: [
      { q: 'The children ___ to tidy their room.', options: ['were made', 'were make', 'made'], answer: 0, explain: 'Bị động của make: were made to tidy.' },
      { q: 'She ___ hurt when she fell off her bike.', options: ['got', 'was got', 'has'], answer: 0, explain: 'Get + V3 diễn tả việc bất ngờ: got hurt.' },
      { q: 'He ___ to be the best player in the club.', options: ['says', 'is said', 'is saying'], answer: 1, explain: 'Bị động tường thuật: is said to be.' },
      { q: 'The thief ___ to enter the building at night.', options: ['was seen', 'was see', 'saw'], answer: 0, explain: 'Bị động của see: was seen to enter.' },
      { q: 'By the time we arrived, all the cakes ___.', options: ['were being sold', 'had been sold', 'have sold'], answer: 1, explain: 'Việc xảy ra trước một mốc quá khứ: had been sold.' },
    ],
  },
  {
    id: 'b2-wish-as-if',
    level: 'B2',
    order: 17,
    title: 'Wish, if only, as if và it\'s time',
    titleEn: 'Wishes, As If and It\'s Time',
    summary: 'Diễn tả điều ước, tiếc nuối và những điều trái với thực tế.',
    minutes: 12,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Wish về hiện tại: lùi một thì',
        body: 'Muốn nói điều không có thật ở hiện tại, dùng wish + quá khứ đơn. Với to be, dùng were cho mọi ngôi trong văn viết.',
        formula: 'S + wish + S + V2 / were',
        examples: [
          { en: 'I wish I had more time.', vi: 'Giá mà tôi có nhiều thời gian hơn.', mark: 'had more time' },
          { en: 'I wish I were taller.', vi: 'Ước gì tôi cao hơn.', mark: 'were taller' },
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Wish và if only về quá khứ: had + V3',
        body: 'Muốn nói tiếc nuối chuyện đã qua, lùi hai thì: wish / if only + quá khứ hoàn thành. If only nhấn mạnh hơn wish.',
        formula: 'S + wish + S + had + V3',
        examples: [
          { en: 'I wish I had studied harder.', vi: 'Giá mà tôi đã học chăm hơn.', mark: 'had studied harder' },
          { en: 'If only I had known the truth.', vi: 'Giá mà tôi biết sự thật.', mark: 'had known' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Wish + would: than phiền về người khác',
        body: 'Dùng wish + would + V khi muốn người khác hay sự việc thay đổi. Không dùng cho chính mình, vì chủ ngữ của wish và would thường khác nhau.',
        examples: [
          { en: 'I wish it would stop raining.', vi: 'Ước gì trời tạnh mưa.', mark: 'would stop raining' },
          { en: 'I wish you would listen to me.', vi: 'Ước gì bạn chịu nghe tôi.', mark: 'would listen' },
        ],
      },
      {
        label: 'Quy tắc 3',
        title: 'As if / as though và it\'s time',
        body: 'As if + quá khứ đơn nói điều trái thực tế ở hiện tại; as if + had V3 nói điều trái thực tế ở quá khứ. Nếu điều đó có thể thật, dùng hiện tại bình thường. It\'s time + S + V2 nghĩa là "đã đến lúc".',
        examples: [
          { en: 'He talks as if he knew everything.', vi: 'Anh ta nói như thể biết hết mọi thứ.', mark: 'as if he knew' },
          { en: 'She looked as if she had seen a ghost.', vi: 'Cô ấy trông như vừa thấy ma.', mark: 'as if she had seen' },
          { en: 'It\'s time we left.', vi: 'Đã đến lúc chúng ta đi rồi.', mark: 'we left' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi hay gặp là không lùi thì sau wish, hoặc dùng would cho chủ ngữ giống nhau.',
        mistakes: [
          { wrong: 'I wish I have more time.', right: 'I wish I had more time.', why: 'Wish về hiện tại phải lùi một thì: had.' },
          { wrong: 'I wish I would be rich.', right: 'I wish I were rich.', why: 'Không dùng would khi chủ ngữ giống nhau; dùng were.' },
          { wrong: 'If only I knew it yesterday.', right: 'If only I had known it yesterday.', why: 'Tiếc nuối quá khứ cần had + V3.' },
        ],
      },
    ],
    quiz: [
      { q: 'I wish I ___ a car. (hiện tại, không có xe)', options: ['have', 'had', 'would have'], answer: 1, explain: 'Wish về hiện tại: quá khứ đơn.' },
      { q: 'If only we ___ the earlier train yesterday.', options: ['caught', 'had caught', 'would catch'], answer: 1, explain: 'Tiếc nuối quá khứ: had + V3.' },
      { q: 'I wish it ___ snowing. It is so cold.', options: ['stopped', 'would stop', 'stops'], answer: 1, explain: 'Muốn sự việc thay đổi: wish + would.' },
      { q: 'He acts as if he ___ the boss.', options: ['is', 'were', 'will be'], answer: 1, explain: 'Trái thực tế ở hiện tại: as if + were.' },
      { q: 'It\'s time you ___ to bed.', options: ['go', 'went', 'will go'], answer: 1, explain: 'It\'s time + S + quá khứ đơn: went.' },
    ],
  },
  {
    id: 'b2-contrast-whatever',
    level: 'B2',
    order: 18,
    title: 'Whereas, while, whatever và no matter',
    titleEn: 'Contrast: Whereas, While, Whatever, No Matter',
    summary: 'Nối hai ý đối lập và nói "dù thế nào cũng…".',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Whereas và while: đối lập hai vế',
        body: 'Whereas và while (nghĩa "trong khi") đặt hai ý đối lập cạnh nhau. Whereas trang trọng hơn và thường đứng giữa câu, có dấu phẩy phía trước.',
        formula: 'S + V, whereas / while + S + V',
        examples: [
          { en: 'I like tea, whereas he likes coffee.', vi: 'Tôi thích trà, còn anh ấy thích cà phê.', mark: 'whereas he likes coffee' },
          { en: 'While some people enjoy city life, others prefer the countryside.', vi: 'Trong khi một số người thích sống ở thành phố, người khác lại thích nông thôn.', mark: 'While some people enjoy city life' },
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Whatever, whoever, wherever, whenever',
        body: 'Các từ này mang nghĩa "bất kể … nào". Dùng như một mệnh đề danh từ hoặc trạng ngữ.',
        bullets: [
          'whatever = bất kể điều gì',
          'whoever = bất kể ai',
          'wherever = bất kể nơi nào',
          'whenever = bất cứ khi nào',
        ],
        examples: [
          { en: 'Whatever you do, stay calm.', vi: 'Dù bạn làm gì, hãy giữ bình tĩnh.', mark: 'Whatever you do' },
          { en: 'Whoever calls, tell them I am out.', vi: 'Ai gọi cũng nói là tôi đi vắng.', mark: 'Whoever calls' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'No matter + từ để hỏi',
        body: 'No matter what/who/where/when/how cùng nghĩa với các từ -ever ở trên, nhưng chỉ làm trạng ngữ nhượng bộ. Sau no matter là chủ ngữ rồi mới đến động từ, như câu thường.',
        formula: 'No matter + wh- + S + V, S + V',
        examples: [
          { en: 'No matter what happens, I will support you.', vi: 'Dù chuyện gì xảy ra, tôi vẫn ủng hộ bạn.', mark: 'No matter what happens' },
          { en: 'No matter how hard I try, I cannot open it.', vi: 'Dù tôi cố thế nào, tôi vẫn không mở được.', mark: 'No matter how hard I try' },
        ],
      },
      {
        label: 'Quy tắc 3',
        title: 'However + tính từ/trạng từ',
        body: 'However đi với tính từ hoặc trạng từ nghĩa là "dù … đến mấy". Thứ tự: however + adj/adv + S + V.',
        examples: [
          { en: 'However tired he was, he kept running.', vi: 'Dù mệt đến mấy, anh ấy vẫn chạy tiếp.', mark: 'However tired he was' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Hay đảo trật tự như câu hỏi, hoặc dùng thừa liên từ.',
        mistakes: [
          { wrong: 'No matter what do you say, I will go.', right: 'No matter what you say, I will go.', why: 'Sau no matter what là trật tự câu thường, không đảo.' },
          { wrong: 'However is hard the task, we must finish.', right: 'However hard the task is, we must finish.', why: 'Tính từ đứng ngay sau however, rồi mới đến chủ ngữ và động từ.' },
          { wrong: 'Whereas he is rich, but he is unhappy.', right: 'Whereas he is rich, he is unhappy.', why: 'Không dùng thêm but sau whereas.' },
        ],
      },
    ],
    quiz: [
      { q: 'My sister loves cooking, ___ I hate it.', options: ['whereas', 'because', 'so'], answer: 0, explain: 'Whereas nối hai ý đối lập.' },
      { q: '___ you decide, I will agree.', options: ['Whatever', 'However', 'Whichever of'], answer: 0, explain: 'Whatever you decide = bất kể bạn quyết định gì.' },
      { q: 'No matter ___ he says, I don\'t believe him.', options: ['what', 'that', 'does'], answer: 0, explain: 'No matter what + S + V.' },
      { q: '___ expensive it is, I will buy it.', options: ['However', 'Whatever', 'Wherever'], answer: 0, explain: 'However + tính từ: dù đắt đến mấy.' },
      { q: 'Choose the correct sentence.', options: ['No matter how is hard it, I will try.', 'No matter how hard it is, I will try.', 'No matter hard how it is, I will try.'], answer: 1, explain: 'How + adj + S + V, không đảo trật tự.' },
    ],
  },
  {
    id: 'b2-narrative-tenses',
    level: 'B2',
    order: 19,
    title: 'Chọn thì khi kể chuyện: used to, would, was going to',
    titleEn: 'Narrative Tenses and Past Habits',
    summary: 'Kết hợp quá khứ đơn, tiếp diễn, hoàn thành và thói quen quá khứ trong một câu chuyện.',
    minutes: 14,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Bốn thì cho một câu chuyện',
        body: 'Quá khứ đơn kể chuỗi sự kiện chính. Quá khứ tiếp diễn dựng bối cảnh. Quá khứ hoàn thành kể việc xảy ra trước đó. Quá khứ hoàn thành tiếp diễn nhấn mạnh việc đã kéo dài trước đó.',
        examples: [
          { en: 'It was raining when I left. I had already locked the door.', vi: 'Trời đang mưa khi tôi ra khỏi nhà. Tôi đã khoá cửa rồi.', mark: 'had already locked' },
          { en: 'She was tired because she had been working all night.', vi: 'Cô ấy mệt vì đã làm việc suốt đêm.', mark: 'had been working' },
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Chọn thì theo thứ tự thời gian',
        body: 'Hai việc nối tiếp nhau dùng hai thì quá khứ đơn. Việc dài làm nền, việc ngắn chen vào: tiếp diễn + đơn. Việc xong trước một việc quá khứ khác: hoàn thành.',
        bullets: [
          'When I arrived, they left. (tôi tới rồi họ mới đi)',
          'When I arrived, they had left. (họ đã đi trước khi tôi tới)',
          'While I was walking, I saw an accident. (việc dài + việc ngắn)',
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Thói quen quá khứ: used to và would',
        body: 'Used to dùng cho cả thói quen và trạng thái đã chấm dứt. Would chỉ dùng cho thói quen lặp lại, không dùng với động từ chỉ trạng thái như be, live, have, know.',
        examples: [
          { en: 'We would play outside every day after school.', vi: 'Hồi đó ngày nào tan học chúng tôi cũng chơi ngoài sân.', mark: 'would play' },
          { en: 'She used to live in Hue.', vi: 'Cô ấy từng sống ở Huế.', mark: 'used to live' },
        ],
      },
      {
        label: 'Quy tắc 3',
        title: 'Tương lai trong quá khứ: was going to, would',
        body: 'Muốn nói về điều đã dự định hoặc dự đoán ở thời điểm quá khứ, dùng was/were going to hoặc would. Was going to thường ngầm báo việc đó không xảy ra.',
        examples: [
          { en: 'I was going to call you, but I lost my phone.', vi: 'Tôi định gọi cho bạn, nhưng tôi mất điện thoại.', mark: 'was going to call' },
          { en: 'He said he would help us.', vi: 'Anh ấy nói anh ấy sẽ giúp chúng tôi.', mark: 'would help' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Hay dùng quá khứ đơn thay cho quá khứ hoàn thành, hoặc dùng would cho trạng thái.',
        mistakes: [
          { wrong: 'When I arrived, the film already started.', right: 'When I arrived, the film had already started.', why: 'Phim bắt đầu trước khi tôi tới: cần quá khứ hoàn thành.' },
          { wrong: 'I would be very shy as a child.', right: 'I used to be very shy as a child.', why: 'Be là trạng thái, không dùng would.' },
          { wrong: 'While I walked home, I met an old friend.', right: 'While I was walking home, I met an old friend.', why: 'Hành động dài làm nền dùng quá khứ tiếp diễn.' },
        ],
      },
    ],
    quiz: [
      { q: 'When we got to the station, the train ___.', options: ['left', 'had left', 'was leaving'], answer: 1, explain: 'Tàu đi trước khi chúng tôi tới: had left.' },
      { q: 'I ___ in a small village when I was a child.', options: ['would live', 'used to live', 'was used to live'], answer: 1, explain: 'Live là trạng thái, dùng used to.' },
      { q: 'While she ___ dinner, the phone rang.', options: ['cooked', 'was cooking', 'had cooked'], answer: 1, explain: 'Việc dài làm nền: was cooking.' },
      { q: 'I ___ to tell you, but I forgot.', options: ['was going', 'would going', 'go'], answer: 0, explain: 'Dự định không thành: was going to tell.' },
      { q: 'He was exhausted. He ___ all day.', options: ['had been working', 'worked', 'was work'], answer: 0, explain: 'Việc kéo dài trước đó, giải thích cho trạng thái: had been working.' },
    ],
  },
  {
    id: 'b2-modal-speculation',
    level: 'B2',
    order: 20,
    title: 'Suy đoán, needn\'t have, dare và might as well',
    titleEn: 'Speculation, Needn\'t Have, Dare and Might as Well',
    summary: 'Đoán việc đang xảy ra hoặc đã xảy ra, và nói việc làm thừa hay không cần thiết.',
    minutes: 12,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Suy đoán việc đang diễn ra',
        body: 'Dùng must, can\'t, may, might, could + be (+ V-ing) để đoán việc ở hiện tại. Must nghĩa là rất chắc chắn đúng, can\'t là rất chắc chắn sai.',
        formula: 'must / can\'t / may / might + be (+ V-ing)',
        examples: [
          { en: 'She must be sleeping. It is midnight.', vi: 'Chắc cô ấy đang ngủ. Đã nửa đêm rồi.', mark: 'must be sleeping' },
          { en: 'He can\'t be at home. The lights are off.', vi: 'Anh ấy không thể ở nhà. Đèn tắt hết.', mark: 'can\'t be at home' },
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Suy đoán việc đã xảy ra: modal + have V3',
        body: 'Đoán chuyện quá khứ dựa vào bằng chứng: must have + V3 (chắc chắn đã), can\'t have + V3 (chắc chắn không), might/may/could have + V3 (có thể đã).',
        formula: 'must / can\'t / might + have + V3',
        examples: [
          { en: 'The window is broken. Someone must have broken it.', vi: 'Cửa sổ vỡ rồi. Chắc có ai đó đã làm vỡ.', mark: 'must have broken' },
          { en: 'He can\'t have known about the meeting.', vi: 'Anh ấy không thể biết về cuộc họp.', mark: 'can\'t have known' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Needn\'t have và didn\'t need to',
        body: 'Needn\'t have + V3: bạn đã làm, nhưng hoá ra không cần thiết. Didn\'t need to + V: không cần làm, và có thể bạn cũng không làm.',
        examples: [
          { en: 'You needn\'t have waited. I was not coming today.', vi: 'Bạn không cần chờ đâu. Hôm nay tôi không đến mà.', mark: 'needn\'t have waited' },
          { en: 'I didn\'t need to wait, so I went home.', vi: 'Tôi không cần chờ, nên đã về nhà.', mark: 'didn\'t need to wait' },
        ],
      },
      {
        label: 'Quy tắc 3',
        title: 'Dare và might as well',
        body: 'Dare (dám) thường dùng phủ định ở dạng khuyết thiếu: daren\'t + V. Might as well + V nghĩa là "thôi thì cứ…", khi không có lựa chọn nào tốt hơn.',
        examples: [
          { en: 'I daren\'t tell him the truth.', vi: 'Tôi không dám nói thật với anh ấy.', mark: 'daren\'t tell' },
          { en: 'We missed the bus, so we might as well walk.', vi: 'Lỡ xe buýt rồi, thôi cứ đi bộ vậy.', mark: 'might as well walk' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Hay dùng sai dạng động từ sau modal hoặc thêm to thừa.',
        mistakes: [
          { wrong: 'She must sleeping now.', right: 'She must be sleeping now.', why: 'Thiếu be: must be + V-ing.' },
          { wrong: 'He must have go home.', right: 'He must have gone home.', why: 'Sau have dùng V3: gone.' },
          { wrong: 'You needn\'t to come early.', right: 'You needn\'t come early.', why: 'Needn\'t là modal, theo sau là động từ nguyên mẫu không to.' },
        ],
      },
    ],
    quiz: [
      { q: 'The lights are on. They ___ be at home.', options: ['must', 'can\'t have', 'needn\'t'], answer: 0, explain: 'Bằng chứng rõ: must be at home.' },
      { q: 'The road is wet. It ___ rained last night.', options: ['must have', 'must', 'can\'t'], answer: 0, explain: 'Suy đoán quá khứ chắc chắn: must have rained.' },
      { q: 'She ___ the answer. She was abroad then.', options: ['can\'t have known', 'must know', 'needn\'t know'], answer: 0, explain: 'Chắc chắn không thể biết: can\'t have known.' },
      { q: 'You ___ so much food. Only three people came.', options: ['needn\'t have cooked', 'needn\'t cook', 'don\'t need cooking'], answer: 0, explain: 'Đã nấu rồi mà hoá ra thừa: needn\'t have cooked.' },
      { q: 'Choose the correct sentence.', options: ['You needn\'t to hurry.', 'You needn\'t hurry.', 'You needn\'t hurrying.'], answer: 1, explain: 'Needn\'t + động từ nguyên mẫu không to.' },
    ],
  },
  {
    id: 'b2-articles-agreement',
    level: 'B2',
    order: 21,
    title: 'Mạo từ khi nói chung, lượng từ và hoà hợp chủ ngữ',
    titleEn: 'Generic Articles, Quantifiers and Subject-Verb Agreement',
    summary: 'Không dùng the khi nói chung, chọn đúng lượng từ và chia động từ theo chủ ngữ thật.',
    minutes: 12,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Mạo từ khi nói chung',
        body: 'Nói về một loài hay một nhóm nói chung, dùng danh từ số nhiều hoặc không đếm được không có the. Dùng the + danh từ số ít để nói cả loài, thường trong văn trang trọng hoặc khoa học.',
        examples: [
          { en: 'Dogs are loyal animals.', vi: 'Chó là loài vật trung thành.', mark: 'Dogs are' },
          { en: 'Water is essential for life.', vi: 'Nước cần thiết cho sự sống.', mark: 'Water is' },
          { en: 'The tiger is in danger of extinction.', vi: 'Loài hổ đang có nguy cơ tuyệt chủng.', mark: 'The tiger is' },
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Lượng từ trang trọng',
        body: 'Chọn lượng từ theo danh từ đếm được hay không đếm được.',
        bullets: [
          'a large number of / a great many + danh từ đếm được số nhiều',
          'a great deal of / a large amount of + danh từ không đếm được',
          'the majority of + danh từ số nhiều (động từ số nhiều)',
          'few, a few (đếm được); little, a little (không đếm được)',
        ],
        examples: [
          { en: 'A large number of people attended the concert.', vi: 'Rất nhiều người đã đến buổi hoà nhạc.', mark: 'A large number of people' },
          { en: 'He spent a great deal of money on books.', vi: 'Anh ấy tiêu rất nhiều tiền vào sách.', mark: 'a great deal of money' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Hoà hợp chủ ngữ và động từ',
        body: 'Động từ chia theo chủ ngữ thật, không theo danh từ đứng ngay trước nó.',
        bullets: [
          'One of + danh từ số nhiều + động từ số ít',
          'Neither / Each / Every + động từ số ít',
          'The number of + số nhiều + động từ số ít; A number of + số nhiều + động từ số nhiều',
        ],
        examples: [
          { en: 'One of my friends lives in Canada.', vi: 'Một người bạn của tôi sống ở Canada.', mark: 'One of my friends lives' },
          { en: 'The number of students is rising.', vi: 'Số học sinh đang tăng.', mark: 'The number of students is' },
        ],
      },
      {
        label: 'Quy tắc 3',
        title: 'Danh từ đặc biệt',
        body: 'Một số danh từ trông như số nhiều nhưng đi với động từ số ít: news, mathematics, economics. Khoảng thời gian, tiền, khoảng cách khi nói như một đơn vị cũng dùng động từ số ít. Police, people, cattle luôn đi với động từ số nhiều.',
        examples: [
          { en: 'The news is good.', vi: 'Tin này tốt.', mark: 'The news is' },
          { en: 'Ten years is a long time.', vi: 'Mười năm là khoảng thời gian dài.', mark: 'Ten years is' },
          { en: 'The police are looking for him.', vi: 'Cảnh sát đang tìm anh ta.', mark: 'The police are' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Hay thêm the khi nói chung và chia sai động từ sau a number of / the number of.',
        mistakes: [
          { wrong: 'The life is short.', right: 'Life is short.', why: 'Nói chung về cuộc sống thì không dùng the.' },
          { wrong: 'A number of students is absent.', right: 'A number of students are absent.', why: 'A number of = một số, đi với động từ số nhiều.' },
          { wrong: 'The news are bad.', right: 'The news is bad.', why: 'News là danh từ không đếm được, dùng is.' },
        ],
      },
    ],
    quiz: [
      { q: '___ are the most intelligent animals.', options: ['Dolphins', 'The dolphins', 'A dolphins'], answer: 0, explain: 'Nói chung về một loài: danh từ số nhiều không có the.' },
      { q: 'A large ___ of tourists visit Hoi An every year.', options: ['number', 'amount', 'deal'], answer: 0, explain: 'Tourists đếm được: a large number of.' },
      { q: 'The number of cars on the road ___ growing.', options: ['is', 'are', 'were'], answer: 0, explain: 'The number of + số nhiều + động từ số ít.' },
      { q: 'One of the keys ___ missing.', options: ['is', 'are', 'were'], answer: 0, explain: 'One of + số nhiều + động từ số ít.' },
      { q: 'Choose the correct sentence.', options: ['The news are surprising.', 'The news is surprising.', 'The newses is surprising.'], answer: 1, explain: 'News là danh từ không đếm được, đi với is.' },
    ],
  },
  {
    id: 'b2-participle-clauses',
    level: 'B2',
    order: 22,
    title: 'Mệnh đề quan hệ nâng cao và cụm phân từ',
    titleEn: 'Relative Clauses with Prepositions and Participle Clauses',
    summary: 'Dùng giới từ + which, which thay cả câu và rút gọn mệnh đề bằng V-ing / V3.',
    minutes: 12,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Giới từ trong mệnh đề quan hệ',
        body: 'Giới từ có thể đứng trước which/whom (văn trang trọng) hoặc ở cuối mệnh đề (văn nói). Trước whom/which mới dùng được giới từ, trước that thì không.',
        formula: 'the house in which I lived | the house (that) I lived in',
        examples: [
          { en: 'The house in which I lived was old.', vi: 'Ngôi nhà mà tôi từng sống đã cũ.', mark: 'in which I lived' },
          { en: 'The woman to whom I spoke was kind.', vi: 'Người phụ nữ mà tôi đã nói chuyện rất tốt bụng.', mark: 'to whom I spoke' },
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Which thay cho cả mệnh đề trước',
        body: 'Which (có dấu phẩy phía trước) có thể thay cả ý ở mệnh đề trước, để bình luận về nó.',
        examples: [
          { en: 'He was late again, which annoyed me.', vi: 'Anh ấy lại đến trễ, điều đó làm tôi bực.', mark: 'which annoyed me' },
          { en: 'She passed the exam, which surprised everyone.', vi: 'Cô ấy đậu kỳ thi, điều đó làm mọi người ngạc nhiên.', mark: 'which surprised everyone' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Rút gọn mệnh đề quan hệ',
        body: 'Mệnh đề quan hệ chủ động rút thành V-ing. Mệnh đề quan hệ bị động rút thành V3. Chỉ rút gọn khi đại từ quan hệ là chủ ngữ.',
        formula: 'N + V-ing (chủ động) | N + V3 (bị động)',
        examples: [
          { en: 'The man sitting there is my uncle.', vi: 'Người đàn ông đang ngồi đằng kia là chú tôi.', mark: 'sitting there' },
          { en: 'The book written by Orwell is famous.', vi: 'Cuốn sách do Orwell viết rất nổi tiếng.', mark: 'written by Orwell' },
        ],
      },
      {
        label: 'Quy tắc 3',
        title: 'Cụm phân từ chỉ thời gian và lí do',
        body: 'Cụm V-ing đầu câu cho biết hành động xảy ra cùng lúc hoặc lí do. Having + V3 cho việc xong trước. Chủ ngữ của cụm phải trùng chủ ngữ của mệnh đề chính.',
        examples: [
          { en: 'Walking home, I saw an old friend.', vi: 'Trên đường đi bộ về nhà, tôi gặp một người bạn cũ.', mark: 'Walking home' },
          { en: 'Having finished the exam, she left the room.', vi: 'Làm xong bài thi, cô ấy rời phòng.', mark: 'Having finished the exam' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi hay gặp nhất là cụm phân từ "treo": chủ ngữ của cụm không trùng với chủ ngữ mệnh đề chính.',
        mistakes: [
          { wrong: 'Walking home, the rain started.', right: 'Walking home, I got caught in the rain.', why: 'Người đi bộ phải là chủ ngữ của mệnh đề chính, không phải the rain.' },
          { wrong: 'The house in that I lived was old.', right: 'The house in which I lived was old.', why: 'Sau giới từ dùng which, không dùng that.' },
          { wrong: 'The letter writing yesterday arrived today.', right: 'The letter written yesterday arrived today.', why: 'Bị động rút gọn dùng V3: written.' },
        ],
      },
    ],
    quiz: [
      { q: 'The company ___ she works is very large.', options: ['for which', 'which for', 'that for'], answer: 0, explain: 'Giới từ đứng trước which: for which.' },
      { q: 'He passed the test, ___ made his parents proud.', options: ['that', 'which', 'what'], answer: 1, explain: 'Which thay cả mệnh đề trước và có dấu phẩy.' },
      { q: 'The students ___ in the library are preparing for exams.', options: ['studying', 'studied', 'to study'], answer: 0, explain: 'Rút gọn chủ động: studying.' },
      { q: 'The cake ___ by my mother was delicious.', options: ['baking', 'baked', 'bake'], answer: 1, explain: 'Rút gọn bị động: baked.' },
      { q: 'Which sentence is correct?', options: ['Opening the door, the cat ran out.', 'Opening the door, I saw the cat run out.', 'Opened the door, I saw the cat.'], answer: 1, explain: 'Chủ ngữ của cụm phân từ (I) phải trùng chủ ngữ mệnh đề chính.' },
    ],
  },
];
