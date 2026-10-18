import type { GrammarLessonDetail } from './types';

/** Cấp C2: thức giả định, rút gọn mệnh đề, cấu trúc trang trọng. */
export const C2_GRAMMAR: GrammarLessonDetail[] = [
  {
    id: 'c2-subjunctive',
    level: 'C2',
    order: 1,
    title: 'Thức giả định',
    titleEn: 'The Subjunctive',
    summary: 'Diễn đạt đề nghị, yêu cầu và điều ước theo cách trang trọng.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Thức giả định là gì?',
        body: 'Thức giả định dùng **động từ nguyên mẫu không chia** sau các động từ như suggest, insist, demand, recommend, dù chủ ngữ là he, she hay it.',
        formula: 'suggest / insist / demand + that + S + V (nguyên mẫu)',
        examples: [
          { en: 'The doctor insisted that he rest for a week.', vi: 'Bác sĩ khăng khăng yêu cầu anh ấy nghỉ một tuần.', mark: 'he rest' },
          { en: 'I suggest that she call the office.', vi: 'Tôi đề nghị cô ấy gọi cho văn phòng.', mark: 'she call' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các động từ thường gặp',
        body: 'Thường đứng sau các động từ thể hiện đề nghị, yêu cầu, quyết định trang trọng.',
        bullets: ['suggest, recommend, propose', 'insist, demand, require', 'It is important / essential that…'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Nguyên mẫu không chia ở vế that',
        body: 'Ở mệnh đề sau that dùng nguyên mẫu, không thêm -s hay -ed, cả với ngôi thứ ba. Phủ định dùng not trước động từ.',
        examples: [
          { en: 'It is essential that every student attend.', vi: 'Điều thiết yếu là mọi học sinh đều phải có mặt.', mark: 'attend' },
          { en: 'They demanded that he not leave.', vi: 'Họ yêu cầu anh ấy không được rời đi.', mark: 'not leave' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Wish và if only với quá khứ hoàn thành',
        body: 'Điều ước về quá khứ dùng had + V3 sau wish hoặc if only. Điều ước về hiện tại dùng quá khứ đơn.',
        examples: [
          { en: 'I wish I had studied harder.', vi: 'Ước gì tôi đã học chăm hơn.', mark: 'had studied' },
          { en: 'If only she were here now.', vi: 'Ước gì bây giờ cô ấy ở đây.', mark: 'were' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là thêm -s vào động từ sau that trong thức giả định.',
        mistakes: [
          { wrong: 'I suggest that he goes there.', right: 'I suggest that he go there.', why: 'Thức giả định dùng nguyên mẫu, không chia.' },
          { wrong: 'I wish I have more time.', right: 'I wish I had more time.', why: 'Điều ước về hiện tại dùng quá khứ đơn.' },
        ],
      },
    ],
    quiz: [
      { q: "The committee recommended that he ___ the report.", options: ["revise", "revises", "revised"], answer: 0, explain: "Recommend that + nguyên mẫu." },
      { q: "It is vital that she ___ on time.", options: ["arrives", "arrive", "arrived"], answer: 1, explain: "Sau It is vital that dùng nguyên mẫu." },
      { q: "I wish I ___ the answer yesterday.", options: ["knew", "know", "had known"], answer: 2, explain: "Điều ước về quá khứ dùng had + V3." },
      { q: "If only I ___ taller.", options: ["were", "am", "be"], answer: 0, explain: "Điều ước hiện tại dùng were sau if only." },
      { q: "Choose the correct sentence.", options: ["She insisted that he leaves immediately.", "She insisted that he leave immediately.", "She insisted that he left immediately."], answer: 1, explain: "Insist that + nguyên mẫu." },
    ],
  },
  {
    id: 'c2-participle-clauses',
    level: 'C2',
    order: 2,
    title: 'Rút gọn mệnh đề và phân từ',
    titleEn: 'Participle Clauses',
    summary: 'Rút gọn mệnh đề để câu văn gọn và trang trọng hơn.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Rút gọn mệnh đề là gì?',
        body: 'Khi hai mệnh đề có **cùng chủ ngữ**, có thể rút gọn mệnh đề phụ thành cụm V-ing hoặc V3 để câu gọn hơn.',
        examples: [
          { en: 'Having finished the report, she went home.', vi: 'Sau khi viết xong báo cáo, cô ấy về nhà.', mark: 'Having finished' },
          { en: 'Written in 1990, the book is still popular.', vi: 'Được viết năm 1990, cuốn sách vẫn được ưa chuộng.', mark: 'Written in 1990' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'V-ing hay V3?',
        body: 'Dùng V-ing khi mệnh đề đầy đủ mang nghĩa chủ động. Dùng V3 khi nghĩa bị động.',
        bullets: ['V-ing: chủ động (Walking home, I saw…)', 'V3: bị động (Shocked by the news, she…)', 'Having + V3: hành động xảy ra trước'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Chủ ngữ phải trùng nhau',
        body: 'Chủ ngữ của mệnh đề chính phải là người thực hiện hành động của cụm rút gọn. Nếu không trùng, không được rút gọn.',
        examples: [
          { en: 'Walking to school, I met my friend.', vi: 'Đang đi bộ đến trường, tôi gặp bạn mình.', mark: 'Walking to school' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Hành động xảy ra trước với having + V3',
        body: 'Dùng Having + V3 để nhấn mạnh hành động đã xảy ra trước hành động ở mệnh đề chính.',
        examples: [
          { en: 'Having lost her passport, she called the embassy.', vi: 'Vì đã mất hộ chiếu, cô ấy gọi đến đại sứ quán.', mark: 'Having lost' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là chủ ngữ bị treo: cụm rút gọn không khớp với chủ ngữ chính.',
        mistakes: [
          { wrong: 'Walking home, the rain started.', right: 'Walking home, I got caught in the rain.', why: 'Chủ ngữ của cụm đầu (người đi bộ) phải là chủ ngữ của mệnh đề chính.' },
          { wrong: 'Written by a famous author, I enjoyed the book.', right: 'Written by a famous author, the book was popular.', why: 'Không được nói "tôi được viết bởi tác giả nổi tiếng".' },
        ],
      },
    ],
    quiz: [
      { q: "___ the door, she turned off the lights.", options: ["Locked", "Locking", "Having lock"], answer: 1, explain: "Chủ động, cùng chủ ngữ: V-ing." },
      { q: "___ by the noise, the children woke up.", options: ["Waking", "Wake", "Woken"], answer: 2, explain: "Bị động: Woken (V3)." },
      { q: "___ the exam, he went to the park.", options: ["Having passed", "Passing", "Passed"], answer: 0, explain: "Hành động đậu xảy ra trước: Having + V3." },
      { q: "___ in a small village, she knows everyone.", options: ["Living", "Having lived", "Lived"], answer: 1, explain: "Sống ở đó trước khi biết mọi người: Having lived." },
      { q: "Choose the correct sentence.", options: ["Reading the email, the room felt cold.", "Reading the email, worry came.", "Reading the email, I felt worried."], answer: 2, explain: "Chủ ngữ của cụm (I đọc email) trùng với I ở mệnh đề chính." },
    ],
  },
  {
    id: 'c2-formal-structures',
    level: 'C2',
    order: 3,
    title: 'Cấu trúc trang trọng và danh hoá',
    titleEn: 'Formal Structures and Nominalisation',
    summary: 'Viết và nói như người bản ngữ trong văn bản học thuật.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Danh hoá là gì?',
        body: 'Danh hoá biến động từ hoặc tính từ thành **danh từ** để câu gọn và trang trọng. Dùng nhiều trong báo cáo và văn bản học thuật.',
        examples: [
          { en: 'The government decided to reduce taxes.', vi: 'Chính phủ quyết định giảm thuế.', mark: 'decided to reduce' },
          { en: 'The government\'s decision to reduce taxes was welcomed.', vi: 'Quyết định giảm thuế của chính phủ được hoan nghênh.', mark: "decision to reduce" },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các cụm trang trọng thường gặp',
        body: 'Thay vì dùng mệnh đề dài, có thể dùng danh từ kèm giới từ.',
        bullets: ['In spite of / Despite + danh từ', 'Due to / Owing to + danh từ', 'With regard to / In terms of + danh từ'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Despite và in spite of',
        body: 'Sau despite và in spite of là danh từ hoặc V-ing, không đi với mệnh đề đầy đủ. Muốn dùng mệnh đề, thêm "the fact that".',
        examples: [
          { en: 'Despite the rain, the match went ahead.', vi: 'Mặc dù mưa, trận đấu vẫn diễn ra.', mark: 'Despite the rain' },
          { en: 'In spite of being tired, she kept working.', vi: 'Dù mệt, cô ấy vẫn tiếp tục làm việc.', mark: 'In spite of being tired' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Danh hoá từ động từ',
        body: 'Thêm -tion, -ment, -ance, -ence vào gốc động từ: develop → development, decide → decision.',
        examples: [
          { en: 'The development of the city took ten years.', vi: 'Việc phát triển thành phố mất mười năm.', mark: 'development' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng despite với mệnh đề đầy đủ.',
        mistakes: [
          { wrong: 'Despite it rained, we went out.', right: 'Despite the fact that it rained, we went out.', why: 'Despite không đi trực tiếp với mệnh đề; dùng the fact that.' },
          { wrong: 'In spite she was tired, she worked.', right: 'In spite of being tired, she worked.', why: 'Cần of sau in spite.' },
        ],
      },
    ],
    quiz: [
      { q: "___ the heavy traffic, we arrived on time.", options: ["Although", "However", "Despite"], answer: 2, explain: "Despite + danh từ." },
      { q: "The ___ of the new policy was announced yesterday.", options: ["implementation", "implement", "implemented"], answer: 0, explain: "Danh từ của implement là implementation." },
      { q: "In spite ___ the cold, they swam.", options: ["despite", "of", "that"], answer: 1, explain: "In spite of là cụm cố định." },
      { q: "Due ___ the storm, the flights were cancelled.", options: ["for", "of", "to"], answer: 2, explain: "Due to + danh từ." },
      { q: "Choose the correct sentence.", options: ["Despite the fact that he was ill, he attended.", "Despite he was ill, he attended.", "Despite of his illness, he attended."], answer: 0, explain: "Despite the fact that + mệnh đề." },
    ],
  },
  {
    id: 'c2-advanced-inversion',
    level: 'C2',
    order: 4,
    title: 'Đảo ngữ nâng cao',
    titleEn: 'Advanced Inversion',
    summary: 'Dùng đảo ngữ với hardly, little, no sooner, not until để nhấn mạnh thời điểm và mức độ.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Đảo ngữ là gì?',
        body: 'Một số trạng từ phủ định hoặc cụm chỉ thời gian đứng đầu câu sẽ kéo theo đảo trợ động từ lên trước chủ ngữ. Đây là cách viết rất trang trọng và có tác dụng nhấn mạnh.',
        formula: 'Hardly / Little / No sooner / Not until + trợ động từ + S + V',
        examples: [
          { en: 'Little did she know what awaited her.', vi: 'Cô ấy hoàn toàn không biết điều gì đang chờ mình.', mark: 'Little did she know' },
          { en: 'Not until the very end did he reveal the truth.', vi: 'Mãi đến cuối cùng anh ấy mới tiết lộ sự thật.', mark: 'Not until the very end did he reveal' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các cụm thường gặp',
        body: 'Các cụm này thường đi thành cặp với when hoặc than, để diễn tả hai việc xảy ra gần như cùng lúc.',
        bullets: [
          'Hardly / Scarcely … when: vừa mới … thì',
          'No sooner … than: vừa mới … thì ngay sau đó',
          'Little / Not until / Only then: nhấn mạnh mức độ hoặc thời điểm',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Hardly và scarcely … when',
        body: 'Cấu trúc: Hardly hoặc Scarcely, cộng had, cộng chủ ngữ, cộng V3, cộng when, cộng mệnh đề quá khứ đơn. Không dùng than với hardly.',
        formula: 'Hardly + had + S + V3 + when + S + V (quá khứ đơn)',
        examples: [
          { en: 'Hardly had we arrived when it started to rain.', vi: 'Chúng tôi vừa đến thì trời bắt đầu mưa.', mark: 'Hardly had we arrived when' },
          { en: 'Scarcely had the meeting begun when the power went out.', vi: 'Cuộc họp vừa bắt đầu thì mất điện.', mark: 'Scarcely had the meeting begun when' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'No sooner … than',
        body: 'Cấu trúc: No sooner, cộng had, cộng chủ ngữ, cộng V3, cộng than, cộng mệnh đề quá khứ đơn. Ở vế đầu luôn đảo had lên trước chủ ngữ.',
        formula: 'No sooner + had + S + V3 + than + S + V (quá khứ đơn)',
        examples: [
          { en: 'No sooner had she sat down than the phone rang.', vi: 'Cô ấy vừa ngồi xuống thì điện thoại reo.', mark: 'No sooner had she sat down than' },
          { en: 'No sooner had I left the house than I realized I had forgotten my keys.', vi: 'Tôi vừa ra khỏi nhà thì nhận ra mình quên chìa khoá.', mark: 'No sooner had I left' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là quên đảo trợ động từ sau trạng từ phủ định đứng đầu câu.',
        mistakes: [
          { wrong: 'Hardly she had arrived when it rained.', right: 'Hardly had she arrived when it rained.', why: 'Had phải đứng trước chủ ngữ.' },
          { wrong: 'Little she knew about the plan.', right: 'Little did she know about the plan.', why: 'Khi Little đứng đầu câu, cần đảo trợ động từ did.' },
        ],
      },
    ],
    quiz: [
      { q: "Hardly ___ we sat down when the bell rang.", options: ["had", "did", "have"], answer: 0, explain: "Hardly đứng đầu câu kéo theo had trước chủ ngữ." },
      { q: "No sooner ___ she left than it started raining.", options: ["has", "had", "did"], answer: 1, explain: "No sooner đi với had cộng V3 ở vế đầu." },
      { q: "Little ___ he realize how serious it was.", options: ["had", "does", "did"], answer: 2, explain: "Little đứng đầu câu quá khứ dùng did để đảo ngữ." },
      { q: "Not until the results came ___ we understand the problem.", options: ["did", "do", "were"], answer: 0, explain: "Quá khứ đơn nên đảo bằng did." },
      { q: "Choose the correct sentence.", options: ["Hardly I had arrived when the meeting ended.", "Hardly had I arrived when the meeting ended.", "Hardly had I arrived than the meeting ended."], answer: 1, explain: "Hardly đi với had đảo lên trước chủ ngữ và when." },
    ],
  },
  {
    id: 'c2-ellipsis-substitution',
    level: 'C2',
    order: 5,
    title: 'Lược bỏ và thay thế',
    titleEn: 'Ellipsis and Substitution',
    summary: 'Lược bỏ phần lặp lại và thay bằng so, do, not để văn viết gọn và tự nhiên.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Lược bỏ và thay thế là gì?',
        body: 'Lược bỏ (ellipsis) là bỏ những từ đã rõ trong ngữ cảnh. Thay thế (substitution) là dùng so, do, one hoặc not để tránh lặp lại.',
        examples: [
          { en: "Would you like to come? I'd love to.", vi: 'Bạn có muốn đi không? Tôi rất muốn.', mark: "I'd love to" },
          { en: 'Is it going to rain? I think so.', vi: 'Trời có mưa không? Tôi nghĩ vậy.', mark: 'I think so' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các từ thay thế thường gặp',
        body: 'Chọn từ thay thế theo loại từ hoặc mệnh đề đã được nhắc đến.',
        bullets: [
          'So: thay cho mệnh đề sau think, hope, believe, expect (I hope so.)',
          'Do, does, did: thay cho động từ chính (He said he would, and he did.)',
          'One, ones: thay cho danh từ đếm được (The red one is mine.)',
          'Not: thay cho mệnh đề phủ định (I hope not.)',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'So và not sau động từ',
        body: 'Sau hope, expect, believe, suppose có thể dùng so hoặc not. Với think ở dạng phủ định, nói I don\'t think so, không nói I think not.',
        examples: [
          { en: 'Will the train be late? I expect so.', vi: 'Tàu có bị trễ không? Tôi nghĩ là có.', mark: 'I expect so' },
          { en: 'Is the shop open today? I hope not.', vi: 'Hôm nay cửa hàng có mở không? Tôi hy vọng là không.', mark: 'I hope not' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'So và such trong cấu trúc kết quả',
        body: 'So đi với tính từ hoặc trạng từ. Such đi với cụm danh từ có mạo từ và tính từ. Cả hai thường đi với that để chỉ kết quả.',
        formula: 'so + adj / adv + that  ·  such (a/an) + adj + noun + that',
        examples: [
          { en: 'The food was so good that we ate everything.', vi: 'Món ăn ngon đến nỗi chúng tôi ăn sạch.', mark: 'so good that' },
          { en: 'It was such a long day that I fell asleep at once.', vi: 'Hôm đó dài đến mức tôi ngủ thiếp đi ngay.', mark: 'such a long day that' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là nói I think not thay cho I don\'t think so, và dùng so thay cho such trước cụm danh từ.',
        mistakes: [
          { wrong: 'I think not so.', right: "I don't think so.", why: 'Với think phủ định, dùng I don\'t think so.' },
          { wrong: 'It was so a long day.', right: 'It was such a long day.', why: 'Trước cụm danh từ dùng such, không dùng so.' },
        ],
      },
    ],
    quiz: [
      { q: "Are they coming tonight? I think ___.", options: ["it", "so", "that"], answer: 1, explain: "So thay cho mệnh đề đã nhắc đến sau think." },
      { q: "She said she would call, and she ___.", options: ["was", "does", "did"], answer: 2, explain: "Did thay cho động từ call." },
      { q: "I hope ___. The weather is terrible.", options: ["not", "no", "none"], answer: 0, explain: "Not thay cho mệnh đề phủ định sau hope." },
      { q: "The food was ___ good that we ate everything.", options: ["such", "so", "such a"], answer: 1, explain: "So đi với tính từ good." },
      { q: "Choose the correct sentence.", options: ["I think not so.", "I don't think not.", "I don't think so."], answer: 2, explain: "Với think phủ định dùng I don't think so." },
    ],
  },
  {
    id: 'c2-regret-should-have',
    level: 'C2',
    order: 6,
    title: 'Should have và needn\'t have: hối tiếc và đánh giá quá khứ',
    titleEn: "Should Have and Needn't Have",
    summary: 'Nói về việc đáng lẽ nên làm hoặc đã làm mà không cần thiết trong quá khứ.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Should have và needn\'t have',
        body: 'Should have cộng V3 diễn tả việc đáng lẽ nên làm nhưng đã không làm. Needn\'t have cộng V3 diễn tả việc đã làm nhưng thực ra không cần thiết.',
        formula: 'should have + V3 (đáng lẽ nên)  ·  needn\'t have + V3 (đã làm mà không cần)',
        examples: [
          { en: 'You should have told me earlier.', vi: 'Đáng lẽ bạn phải nói với tôi sớm hơn.', mark: 'should have told' },
          { en: "I needn't have hurried; the train was late.", vi: 'Tôi đâu cần vội; tàu đến muộn mà.', mark: "needn't have hurried" },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Bốn cấu trúc liên quan',
        body: 'Mỗi cấu trúc thể hiện một thái độ khác nhau đối với việc đã xảy ra.',
        bullets: [
          'Should have + V3: tiếc việc đáng lẽ đã làm (We should have booked earlier.)',
          "Shouldn't have + V3: tiếc việc đã làm (I shouldn't have eaten so much.)",
          "Needn't have + V3: đã làm nhưng không cần (She needn't have bought a ticket.)",
          "Didn't need to + V: không cần làm, không nói rõ có làm hay không (We didn't need to pay.)",
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Should have để phê bình hoặc tiếc',
        body: 'Should have dùng cho việc quá khứ, thể hiện sự phê bình hoặc tiếc nuối về việc đã không làm.',
        examples: [
          { en: 'He should have studied harder for the test.', vi: 'Lẽ ra anh ấy đã phải học chăm hơn cho bài kiểm tra.', mark: 'should have studied' },
          { en: 'We should have left earlier.', vi: 'Lẽ ra chúng tôi đã phải đi sớm hơn.', mark: 'should have left' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Needn\'t have và didn\'t need to',
        body: 'Needn\'t have cộng V3 cho thấy việc đã được làm nhưng hoá ra không cần thiết. Didn\'t need to cộng V nguyên mẫu chỉ nói việc không cần, không cho biết đã làm hay chưa.',
        examples: [
          { en: "You needn't have brought food; we have plenty.", vi: 'Bạn đâu cần mang đồ ăn; chúng tôi có đủ rồi.', mark: "needn't have brought" },
          { en: 'We didn\'t need to bring umbrellas, so we left them home.', vi: 'Chúng tôi không cần mang ô nên để ở nhà.', mark: "didn't need to bring" },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là thêm to vào giữa should và have, hoặc dùng should cộng V thay cho should have cộng V3.',
        mistakes: [
          { wrong: 'I should have to go yesterday.', right: 'I should have gone yesterday.', why: 'Should have cộng V3 (gone), không dùng to.' },
          { wrong: 'You should to have called me.', right: 'You should have called me.', why: 'Should have không đi với to.' },
        ],
      },
    ],
    quiz: [
      { q: "You ___ told me about the change earlier.", options: ["should to have", "should had", "should have"], answer: 2, explain: "Should have cộng V3 để nói tiếc việc đã không làm." },
      { q: "I ___ have brought an umbrella. It did not rain at all.", options: ["needn't", "mustn't", "can't"], answer: 0, explain: "Needn't have cộng V3: đã làm mà không cần thiết." },
      { q: "She ___ been so rude to her friend. Now she feels bad.", options: ["didn't should", "shouldn't have", "shouldn't to have"], answer: 1, explain: "Shouldn't have cộng V3 để nói tiếc việc đã làm." },
      { q: "We ___ taken a taxi; the bus arrived on time.", options: ["don't need", "needn't", "needn't have"], answer: 2, explain: "Taxi đã đi nên dùng needn't have cộng V3." },
      { q: "Choose the correct sentence.", options: ["He should have called the doctor last night.", "He should to have called the doctor last night.", "He should has called the doctor last night."], answer: 0, explain: "Should have cộng V3: called." },
    ],
  },
  {
    id: 'c2-linking-formal',
    level: 'C2',
    order: 7,
    title: 'Liên từ và trạng từ liên kết trang trọng',
    titleEn: 'Formal Linking Words',
    summary: 'Nối ý trong văn viết học thuật bằng nevertheless, whereas, albeit và các từ tương tự.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Từ liên kết là gì?',
        body: 'Liên từ và trạng từ liên kết giúp nối ý giữa các câu và đoạn văn. Các dạng trang trọng thường thấy trong báo cáo và bài luận: nevertheless, whereas, albeit, moreover, hence.',
        examples: [
          { en: 'The plan was expensive; nevertheless, it was approved.', vi: 'Kế hoạch tốn kém; tuy vậy, nó vẫn được phê duyệt.', mark: 'nevertheless' },
          { en: 'Coffee is popular, whereas tea is more common in the north.', vi: 'Cà phê phổ biến, trong khi trà phổ biến hơn ở miền Bắc.', mark: 'whereas' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Theo chức năng',
        body: 'Chọn từ liên kết theo quan hệ giữa hai ý: đối lập, bổ sung, kết quả hay nhượng bộ.',
        bullets: [
          'Đối lập: however, nevertheless, nonetheless, whereas, while',
          'Bổ sung: moreover, furthermore, in addition',
          'Kết quả: hence, therefore, consequently',
          'Nhượng bộ: albeit, although, even though',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'However và nevertheless',
        body: 'Các trạng từ như however, nevertheless, nonetheless thường đứng đầu câu hoặc sau dấu chấm phẩy, và có dấu phẩy ngay sau.',
        examples: [
          { en: 'The task was difficult. However, we finished it on time.', vi: 'Nhiệm vụ khó. Tuy vậy, chúng tôi đã hoàn thành đúng hạn.', mark: 'However' },
          { en: 'He was tired; nonetheless, he kept running.', vi: 'Anh ấy mệt; dù vậy, anh vẫn tiếp tục chạy.', mark: 'nonetheless' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Whereas và albeit',
        body: 'Whereas nối hai ý đối lập, không chỉ là thời gian. Albeit đứng trước một cụm tính từ hoặc danh từ, nghĩa là "dù là"; dạng này rất trang trọng.',
        examples: [
          { en: 'The first model is cheap, whereas the second is durable.', vi: 'Mẫu đầu rẻ, trong khi mẫu thứ hai bền.', mark: 'whereas the second' },
          { en: 'The proposal was accepted, albeit with minor changes.', vi: 'Đề xuất được chấp nhận, dù có một số thay đổi nhỏ.', mark: 'albeit with minor changes' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là nối hai mệnh đề chỉ bằng dấu phẩy với however, hoặc dùng albeit trước một mệnh đề đầy đủ.',
        mistakes: [
          { wrong: 'It was late, however we went home.', right: 'It was late; however, we went home.', why: 'However cần dấu chấm phẩy trước và dấu phẩy sau.' },
          { wrong: 'Albeit it was small, it was useful.', right: 'Although it was small, it was useful.', why: 'Albeit thường đi với một cụm ngắn; với mệnh đề đầy đủ nên dùng although.' },
        ],
      },
    ],
    quiz: [
      { q: "The plan was risky; ___, the team decided to go ahead.", options: ["nevertheless", "albeit", "whereas"], answer: 0, explain: "Nevertheless diễn tả sự đối lập, đứng trước dấu phẩy." },
      { q: "Some students prefer online classes, ___ others prefer face-to-face learning.", options: ["hence", "whereas", "moreover"], answer: 1, explain: "Whereas nối hai nhóm đối lập." },
      { q: "The results were positive, ___ small in scale.", options: ["hence", "whereas", "albeit"], answer: 2, explain: "Albeit đi với cụm tính từ small in scale." },
      { q: "Prices rose sharply; ___, demand fell.", options: ["consequently", "nevertheless", "moreover"], answer: 0, explain: "Consequently diễn tả kết quả." },
      { q: "Choose the correct sentence.", options: ["The offer was tempting however I declined.", "The offer was tempting; however, I declined.", "The offer was tempting; albeit I declined."], answer: 1, explain: "However đứng sau dấu chấm phẩy và có dấu phẩy sau nó." },
    ],
  },
];
