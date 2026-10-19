import type { GrammarLessonDetail } from './types';

/** Cấp B2 (phần bổ sung): nhượng bộ, đảo ngữ điều kiện, too và enough, mệnh đề thời gian, need + V-ing, make/let/help. */
export const B2_GRAMMAR_EXTRA: GrammarLessonDetail[] = [
  {
    id: 'b2-concessive-clauses',
    level: 'B2',
    order: 9,
    title: 'Mệnh đề nhượng bộ: although, even though',
    titleEn: 'Concessive Clauses',
    summary: 'Nối hai ý tương phản bằng although, even though, though và despite.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Mệnh đề nhượng bộ là gì?',
        body: 'Mệnh đề nhượng bộ diễn tả một điều gì đó không ngăn được kết quả, dù người nói có thể đã nghĩ là sẽ ngăn được. Dùng although, even though hoặc though, theo sau là một mệnh đề đầy đủ.',
        formula: 'Although + S + V, S + V',
        examples: [
          { en: 'Although it was raining, we went for a walk.', vi: 'Dù trời mưa, chúng tôi vẫn đi dạo.', mark: 'Although it was raining' },
          { en: 'Even though he was tired, he finished the report.', vi: 'Dù mệt, anh ấy vẫn hoàn thành báo cáo.', mark: 'Even though he was tired' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các từ nhượng bộ thường gặp',
        body: 'Mỗi từ có sắc thái khác nhau một chút, nhưng đều diễn tả sự tương phản.',
        bullets: [
          'Although / though: nhượng bộ thông thường, dùng được cả văn nói và văn viết',
          'Even though: nhấn mạnh hơn, nghĩa là "dù cho"',
          'Despite / in spite of: đi với danh từ hoặc V-ing, không đi với mệnh đề',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Không dùng but cùng although',
        body: 'Chỉ dùng một trong hai: although hoặc but. Không dùng cả hai trong cùng một câu.',
        examples: [
          { en: 'Although the film was long, it was enjoyable.', vi: 'Dù phim dài, nó vẫn thú vị.', mark: 'Although the film was long' },
          { en: 'The film was long, but it was enjoyable.', vi: 'Phim dài, nhưng nó vẫn thú vị.', mark: 'but it was enjoyable' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Vị trí của mệnh đề nhượng bộ',
        body: 'Mệnh đề nhượng bộ có thể đứng đầu hoặc cuối câu. Khi đứng đầu, cần dấu phẩy ngăn với mệnh đề chính.',
        examples: [
          { en: 'She passed the exam even though she had little time to study.', vi: 'Cô ấy đậu kỳ thi dù có ít thời gian ôn tập.', mark: 'even though she had little time to study' },
          { en: 'We stayed at home, although the weather was fine.', vi: 'Chúng tôi ở nhà, dù thời tiết đẹp.', mark: 'although the weather was fine' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng although và but cùng lúc, hoặc đặt mệnh đề sau despite.',
        mistakes: [
          { wrong: 'Although it was cold, but we went swimming.', right: 'Although it was cold, we went swimming.', why: 'Không dùng although và but cùng lúc.' },
          { wrong: 'Despite it was cold, we went swimming.', right: 'Despite the cold, we went swimming.', why: 'Despite không đi với mệnh đề; dùng danh từ hoặc the fact that.' },
        ],
      },
    ],
    quiz: [
      { q: '___ it was late, we kept talking.', options: ['Although', 'Despite', 'Because'], answer: 0, explain: 'Although đi với mệnh đề đầy đủ.' },
      { q: 'She went to work ___ she had a cold.', options: ['despite', 'however', 'although'], answer: 2, explain: 'Although nối hai mệnh đề tương phản.' },
      { q: '___ the rain, the match continued.', options: ['Although', 'Despite', 'Though'], answer: 1, explain: 'Despite đi với danh từ the rain.' },
      { q: "He didn't win, ___ he played very well.", options: ['despite', 'in spite', 'even though'], answer: 2, explain: 'Even though đi với mệnh đề đầy đủ.' },
      { q: 'Choose the correct sentence.', options: ['Although it was cold, but we went out.', 'Although it was cold, we went out.', 'Despite it was cold, we went out.'], answer: 1, explain: 'Chỉ dùng although, không dùng thêm but.' },
    ],
  },
  {
    id: 'b2-conditional-inversion',
    level: 'B2',
    order: 10,
    title: 'Đảo ngữ thay if trong câu điều kiện',
    titleEn: 'Conditional Inversion',
    summary: 'Lược bỏ if bằng cách đảo trợ động từ, dùng trong văn phong trang trọng.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Đảo ngữ thay if là gì?',
        body: 'Trong văn viết và phát biểu trang trọng, có thể bỏ if và đưa had, were hoặc should lên trước chủ ngữ. Nghĩa của câu không đổi.',
        formula: 'Had + S + V3, S + would have + V3  ·  Were + S + adj, S + would + V  ·  Should + S + V, S + V',
        examples: [
          { en: 'Had I known about the traffic, I would have left earlier.', vi: 'Nếu biết trước về kẹt xe, tôi đã đi sớm hơn.', mark: 'Had I known' },
          { en: 'Were I you, I would accept the offer.', vi: 'Nếu là bạn, tôi sẽ nhận lời đề nghị.', mark: 'Were I you' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Ba dạng đảo ngữ thường gặp',
        body: 'Mỗi dạng thay cho một loại câu điều kiện.',
        bullets: [
          'Had + S + V3: thay If + S + had + V3 (điều kiện loại 3)',
          'Were + S + to V hoặc Were + S + adj: thay If + S + were (điều kiện loại 2)',
          'Should + S + V: thay If + S + should + V (điều kiện có thể xảy ra, văn phong trang trọng)',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Had I known',
        body: 'Had đứng trước chủ ngữ ở điều kiện loại 3. Vế chính vẫn dùng would have + V3.',
        examples: [
          { en: 'Had she called, we would have helped her.', vi: 'Nếu cô ấy gọi, chúng tôi đã giúp rồi.', mark: 'Had she called' },
          { en: "Had they left on time, they wouldn't have missed the train.", vi: 'Nếu họ đi đúng giờ, họ đã không lỡ tàu.', mark: "wouldn't have missed" },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Should you need',
        body: 'Should đứng đầu câu để nói về việc có thể xảy ra, thường dùng trong thông báo lịch sự. Vế chính dùng hiện tại hoặc tương lai.',
        examples: [
          { en: 'Should you need any help, please contact the office.', vi: 'Nếu bạn cần trợ giúp, vui lòng liên hệ văn phòng.', mark: 'Should you need' },
          { en: 'Were the price lower, more people would buy it.', vi: 'Nếu giá thấp hơn, nhiều người sẽ mua hơn.', mark: 'Were the price lower' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng would have sau had đảo ngữ, hoặc dùng will sau should.',
        mistakes: [
          { wrong: 'Had I would have known, I would have come.', right: 'Had I known, I would have come.', why: 'Sau had đảo ngữ không dùng would have; động từ là V3.' },
          { wrong: 'Should you will need help, call me.', right: 'Should you need help, call me.', why: 'Sau should dùng động từ nguyên mẫu, không dùng will.' },
        ],
      },
    ],
    quiz: [
      { q: '___ you have any questions, please ask me.', options: ['Should', 'Were', 'Had'], answer: 0, explain: 'Should đảo lên đầu câu thay cho if you should have.' },
      { q: '___ I known about the delay, I would have taken a taxi.', options: ['Would', 'Had', 'Should'], answer: 1, explain: 'Had đảo ngữ thay cho if I had known.' },
      { q: '___ she not been ill, she would have come to the party.', options: ['Were', 'Has', 'Had'], answer: 2, explain: 'Điều kiện loại 3 dùng had đảo ngữ.' },
      { q: '___ the weather be bad, the event will move indoors.', options: ['Had', 'Should', 'Did'], answer: 1, explain: 'Should đảo ngữ cho điều kiện có thể xảy ra.' },
      { q: 'Choose the correct sentence.', options: ['Had I would have known, I would have come.', 'Had I known, I would come.', 'Had I known, I would have come.'], answer: 2, explain: 'Had đảo ngữ đi với would have + V3 ở vế chính.' },
    ],
  },
  {
    id: 'b2-too-enough',
    level: 'B2',
    order: 11,
    title: 'Too và enough',
    titleEn: 'Too and Enough',
    summary: 'Diễn tả mức độ quá mức hoặc đủ mức bằng too và enough.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Too và enough là gì?',
        body: 'Too nghĩa là quá mức, thường là không tốt. Enough nghĩa là đủ. Cả hai đi với tính từ, trạng từ hoặc danh từ.',
        formula: 'too + adj / adv + to V  ·  adj / adv + enough + to V',
        examples: [
          { en: 'The coffee is too hot to drink.', vi: 'Cà phê quá nóng nên không uống được.', mark: 'too hot to drink' },
          { en: 'He is old enough to vote.', vi: 'Anh ấy đủ tuổi đi bầu cử.', mark: 'old enough to vote' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các mẫu câu thường gặp',
        body: 'Chọn mẫu câu theo loại từ đi sau too hoặc enough.',
        bullets: [
          'too + adj + to V: không thể làm vì quá …',
          'adj + enough + to V: đủ để làm việc gì',
          'enough + danh từ: đủ số lượng (enough time, enough money)',
          'too much / too many + danh từ: quá nhiều',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Enough đứng sau tính từ',
        body: 'Enough đứng sau tính từ và trạng từ, nhưng đứng trước danh từ.',
        examples: [
          { en: 'The room is big enough for ten people.', vi: 'Căn phòng đủ rộng cho mười người.', mark: 'big enough for' },
          { en: 'We have enough chairs for everyone.', vi: 'Chúng tôi có đủ ghế cho mọi người.', mark: 'enough chairs' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Thêm người thực hiện với for',
        body: 'Khi cần nêu người thực hiện hành động, dùng too + adj + for + tân ngữ + to V.',
        examples: [
          { en: 'The box is too heavy for me to carry.', vi: 'Chiếc hộp quá nặng để tôi mang.', mark: 'too heavy for me to carry' },
          { en: 'This question is not easy enough for beginners to answer.', vi: 'Câu hỏi này chưa đủ dễ để người mới học trả lời.', mark: 'not easy enough for beginners to answer' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là đặt enough trước tính từ, hoặc dùng too many với danh từ không đếm được.',
        mistakes: [
          { wrong: 'It is enough cold to swim.', right: 'It is too cold to swim.', why: 'Enough đứng sau tính từ; nếu lạnh đến mức không bơi được thì dùng too.' },
          { wrong: 'I have too many money.', right: 'I have too much money.', why: 'Money không đếm được nên dùng too much.' },
        ],
      },
    ],
    quiz: [
      { q: 'She is ___ tired to continue the trip.', options: ['enough', 'too', 'very'], answer: 1, explain: 'Too tired to continue nghĩa là quá mệt để tiếp tục.' },
      { q: 'We have ___ time to finish the project.', options: ['too', 'many', 'enough'], answer: 2, explain: 'Enough time nghĩa là đủ thời gian.' },
      { q: 'The water is not hot ___ to make tea.', options: ['too', 'enough', 'much'], answer: 1, explain: 'Not hot enough to make tea nghĩa là chưa đủ nóng.' },
      { q: 'The bag is ___ heavy for a child to carry.', options: ['enough', 'so', 'too'], answer: 2, explain: 'Too heavy for a child to carry nghĩa là quá nặng.' },
      { q: 'Choose the correct sentence.', options: ['I have too much money for this trip.', 'I have money too enough for this trip.', 'I have too many money for this trip.'], answer: 0, explain: 'Money không đếm được nên đi với too much.' },
    ],
  },
  {
    id: 'b2-time-clauses',
    level: 'B2',
    order: 12,
    title: 'Mệnh đề thời gian không dùng will',
    titleEn: 'Time Clauses',
    summary: 'Dùng hiện tại đơn sau when, as soon as, until, before để nói về tương lai.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Quy tắc chung',
        body: 'Sau when, as soon as, until, before, after, once, mệnh đề thời gian nói về tương lai dùng hiện tại đơn, không dùng will. Mệnh đề chính mới dùng will.',
        formula: 'When / as soon as + S + V (hiện tại đơn), S + will + V',
        examples: [
          { en: 'I will call you when I arrive.', vi: 'Tôi sẽ gọi bạn khi tôi đến.', mark: 'when I arrive' },
          { en: 'As soon as the rain stops, we will leave.', vi: 'Ngay khi mưa tạnh, chúng tôi sẽ đi.', mark: 'As soon as the rain stops' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các từ thời gian thường gặp',
        body: 'Mỗi từ thể hiện một quan hệ thời gian khác nhau.',
        bullets: [
          'When: khi, vào lúc',
          'As soon as / once: ngay khi',
          'Until / till: cho đến khi',
          'Before / after: trước khi / sau khi; by the time: đến lúc',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Không dùng will trong mệnh đề thời gian',
        body: 'Sau các từ thời gian, không dùng will hoặc going to ở mệnh đề này, kể cả khi nói về tương lai.',
        examples: [
          { en: 'We will eat dinner after the guests leave.', vi: 'Chúng tôi sẽ ăn tối sau khi khách về.', mark: 'after the guests leave' },
          { en: 'Please wait until the teacher arrives.', vi: 'Làm ơn đợi cho đến khi giáo viên đến.', mark: 'until the teacher arrives' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Khi when mở đầu câu hỏi gián tiếp',
        body: 'Khi when hoặc if mở đầu một câu hỏi gián tiếp, không còn là mệnh đề thời gian, nên vẫn dùng will.',
        examples: [
          { en: "I don't know if she will come tomorrow.", vi: 'Tôi không biết ngày mai cô ấy có đến không.', mark: 'if she will come' },
          { en: 'Tell me when you will be free.', vi: 'Hãy cho tôi biết khi nào bạn rảnh.', mark: 'when you will be free' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng will trong mệnh đề thời gian.',
        mistakes: [
          { wrong: 'I will call you when I will arrive.', right: 'I will call you when I arrive.', why: 'Mệnh đề thời gian dùng hiện tại đơn dù nói về tương lai.' },
          { wrong: 'Let us go out as soon as it will stop raining.', right: 'Let us go out as soon as it stops raining.', why: 'Sau as soon as dùng hiện tại đơn.' },
        ],
      },
    ],
    quiz: [
      { q: "I'll text you as soon as I ___ home.", options: ['will get', 'got', 'get'], answer: 2, explain: 'Mệnh đề thời gian sau as soon as dùng hiện tại đơn.' },
      { q: 'We won\'t start the meeting until everyone ___.', options: ['will arrive', 'arrives', 'arrive'], answer: 1, explain: 'Everyone là chủ ngữ số ít nên dùng arrives.' },
      { q: 'Call me once you ___ at the airport.', options: ['are', 'will be', 'were'], answer: 0, explain: 'Mệnh đề thời gian dùng hiện tại đơn cho tương lai.' },
      { q: "I don't know whether she ___ the job.", options: ['gets', 'got', 'will get'], answer: 2, explain: 'Câu hỏi gián tiếp dùng will bình thường.' },
      { q: 'Choose the correct sentence.', options: ['When it will be ready, I will tell you.', 'When it is ready, I will tell you.', 'When it will ready, I will tell you.'], answer: 1, explain: 'Mệnh đề when dùng hiện tại đơn.' },
    ],
  },
  {
    id: 'b2-need-doing',
    level: 'B2',
    order: 13,
    title: 'Need + V-ing mang nghĩa bị động',
    titleEn: 'Need + V-ing with Passive Meaning',
    summary: 'Dùng need + V-ing để nói việc gì cần được làm.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Need + V-ing là gì?',
        body: 'Sau need, V-ing mang nghĩa bị động, nghĩa là "cần được làm". Ví dụ "The car needs washing" có nghĩa là chiếc xe cần được rửa.',
        formula: 'S + need(s) + V-ing = S + need(s) + to be + V3',
        examples: [
          { en: 'The car needs washing.', vi: 'Chiếc xe cần được rửa.', mark: 'needs washing' },
          { en: 'The garden needs watering every morning.', vi: 'Khu vườn cần được tưới mỗi sáng.', mark: 'needs watering' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Khi nào nên dùng?',
        body: 'Cấu trúc này gọn và tự nhiên hơn cách viết đầy đủ, thường gặp trong văn nói.',
        bullets: [
          'Chủ ngữ là vật hoặc việc chịu tác động: The roof needs fixing.',
          'Muốn câu ngắn gọn hơn so với need to be + V3',
          'Thường gặp với các động từ wash, repair, paint, clean, check',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Chủ ngữ thường là vật',
        body: 'Chủ ngữ thường là vật hoặc việc, vì động từ chính là hành động làm cho vật đó.',
        examples: [
          { en: 'My bike needs checking before the trip.', vi: 'Xe đạp của tôi cần được kiểm tra trước chuyến đi.', mark: 'needs checking' },
          { en: 'The walls need painting.', vi: 'Các bức tường cần được sơn.', mark: 'need painting' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Need to be + V3 là cách khác',
        body: 'Cách viết đầy đủ là need to be + V3. Cả hai cách đều đúng và có nghĩa tương đương.',
        examples: [
          { en: 'The report needs to be finished today.', vi: 'Báo cáo cần được hoàn thành hôm nay.', mark: 'needs to be finished' },
          { en: 'The report needs finishing today.', vi: 'Báo cáo cần được hoàn thành hôm nay.', mark: 'needs finishing' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng need + to V với nghĩa bị động, hoặc thêm tân ngữ sau need + V-ing.',
        mistakes: [
          { wrong: 'The car needs to wash.', right: 'The car needs washing.', why: 'Need to V mang nghĩa chủ động; với nghĩa bị động dùng need + V-ing.' },
          { wrong: 'The letter needs writing it.', right: 'The letter needs writing.', why: 'Không thêm tân ngữ sau need + V-ing.' },
        ],
      },
    ],
    quiz: [
      { q: 'The grass ___ this week.', options: ['needs to cut', 'needs cutting', 'needs cut'], answer: 1, explain: 'Cỏ cần được cắt dùng needs cutting.' },
      { q: 'The dishes ___ after dinner.', options: ['need washing', 'need to wash', 'need washed'], answer: 0, explain: 'Bát đĩa cần được rửa dùng need washing.' },
      { q: 'The windows ___ before the guests arrive.', options: ['need cleaned them', 'need cleaning them', 'need cleaning'], answer: 2, explain: 'Need cleaning đã đủ, không thêm tân ngữ.' },
      { q: 'Choose the correct sentence.', options: ['The engine needs to repair.', 'The engine needs repairing.', 'The engine needs repairs it.'], answer: 1, explain: 'Động cơ cần được sửa dùng needs repairing.' },
      { q: 'The report ___ today.', options: ['needs to be finished', 'needs finish', 'needs to finish it'], answer: 0, explain: 'Báo cáo cần được hoàn thành dùng needs to be finished.' },
    ],
  },
  {
    id: 'b2-make-let-help',
    level: 'B2',
    order: 14,
    title: 'Make, let, help + tân ngữ + động từ',
    titleEn: 'Make, Let and Help Patterns',
    summary: 'Dùng make, let và help để nói ai đó làm việc gì, và đổi sang bị động đúng cách.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Make và let đi với tân ngữ',
        body: 'Make và let đi với tân ngữ rồi đến động từ nguyên mẫu không có to. Make là bắt ai làm việc gì; let là cho phép ai làm việc gì.',
        formula: 'make / let + O + V (nguyên mẫu không to)',
        examples: [
          { en: 'My parents let me stay out until midnight.', vi: 'Bố mẹ cho tôi đi chơi đến nửa đêm.', mark: 'let me stay' },
          { en: 'The teacher made us repeat the sentence.', vi: 'Giáo viên bắt chúng tôi lặp lại câu.', mark: 'made us repeat' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Chọn cấu trúc theo ý nghĩa',
        body: 'Mỗi động từ có sắc thái khác nhau khi đi với tân ngữ.',
        bullets: [
          'Make + O + V: bắt buộc, ép buộc (make him apologise)',
          'Let + O + V: cho phép (let the kids play)',
          'Help + O + V hoặc to V: giúp đỡ (help me finish)',
          'Allow / permit + O + to V: cho phép, trang trọng hơn let',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Câu bị động với make và let',
        body: 'Ở câu bị động, make đổi thành be made to, còn let đổi thành be allowed to. Không dùng let ở dạng bị động.',
        examples: [
          { en: 'We were made to wait for an hour.', vi: 'Chúng tôi bị bắt phải đợi cả tiếng.', mark: 'were made to wait' },
          { en: 'Students are not allowed to use phones in class.', vi: 'Học sinh không được phép dùng điện thoại trong lớp.', mark: 'are not allowed to use' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Help có thể đi với to',
        body: 'Sau help, có thể dùng to V hoặc V nguyên mẫu, cả hai đều đúng. Trong văn nói thường bỏ to.',
        examples: [
          { en: 'She helped me (to) carry the boxes.', vi: 'Cô ấy giúp tôi mang các thùng hàng.', mark: 'helped me (to) carry' },
          { en: 'Can you help us clean the kitchen?', vi: 'Bạn giúp chúng tôi dọn bếp được không?', mark: 'help us clean' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là thêm to sau make hoặc let.',
        mistakes: [
          { wrong: 'The teacher made us to repeat.', right: 'The teacher made us repeat.', why: 'Sau make + tân ngữ dùng V nguyên mẫu không có to.' },
          { wrong: 'My mother let me to go out.', right: 'My mother let me go out.', why: 'Let không đi với to.' },
        ],
      },
    ],
    quiz: [
      { q: 'The noise ___ me lose my concentration.', options: ['let', 'made', 'allowed'], answer: 1, explain: 'Make + tân ngữ + V nguyên mẫu: made me lose.' },
      { q: 'My boss ___ us leave early on Friday.', options: ['made to', 'allowed', 'let'], answer: 2, explain: 'Let us leave nghĩa là cho chúng tôi về sớm.' },
      { q: 'Children are not ___ to enter the bar.', options: ['let', 'allowed', 'made'], answer: 1, explain: 'Dạng bị động của cho phép là allowed to.' },
      { q: 'Can you help me ___ the table?', options: ['move', 'moving', 'moved'], answer: 0, explain: 'Help + tân ngữ + V nguyên mẫu: help me move.' },
      { q: 'Choose the correct sentence.', options: ['The teacher made us to repeat the word.', 'The teacher let us to repeat the word.', 'The teacher made us repeat the word.'], answer: 2, explain: 'Make + tân ngữ + V nguyên mẫu không có to.' },
    ],
  },
];
