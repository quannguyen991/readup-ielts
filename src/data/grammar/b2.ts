import type { GrammarLessonDetail } from './types';

/** Cấp B2: quá khứ hoàn thành, câu gián tiếp, mệnh đề quan hệ. */
export const B2_GRAMMAR: GrammarLessonDetail[] = [
  {
    id: 'b2-past-perfect',
    level: 'B2',
    order: 1,
    title: 'Quá khứ hoàn thành',
    titleEn: 'Past Perfect',
    summary: 'Nói việc xảy ra trước một việc khác trong quá khứ.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Quá khứ hoàn thành dùng để làm gì?',
        body: 'Dùng cho hành động **xảy ra trước** một hành động khác đã xảy ra trong quá khứ. Hành động xảy ra sau dùng quá khứ đơn.',
        formula: 'had + V3',
        examples: [
          { en: 'When I arrived, the film had already started.', vi: 'Khi tôi đến, phim đã bắt đầu rồi.', mark: 'had already started' },
          { en: 'She had lost her keys before she called me.', vi: 'Cô ấy đã làm mất chìa khoá trước khi gọi cho tôi.', mark: 'had lost' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Từ nối và dấu hiệu',
        body: 'Thường có before, after, by the time, already, when trong câu.',
        bullets: ['By the time I got there, they had left.', 'After she had finished, she went home.'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Cấu trúc had + V3',
        body: 'Mọi ngôi đều dùng **had**. Sau had là dạng V3 của động từ chính.',
        formula: 'S + had + V3',
        examples: [
          { en: 'They had finished dinner.', vi: 'Họ đã ăn tối xong.', mark: 'had finished' },
          { en: 'He had never seen snow.', vi: 'Anh ấy chưa bao giờ thấy tuyết.', mark: 'had never seen' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Khi nào không cần quá khứ hoàn thành',
        body: 'Nếu thứ tự thời gian đã rõ qua before/after, có thể dùng quá khứ đơn cho cả hai hành động.',
        examples: [
          { en: 'After she left, I called him.', vi: 'Sau khi cô ấy đi, tôi gọi cho anh ấy.', mark: 'After she left' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến nhất là dùng quá khứ hoàn thành cho cả hai hành động.',
        mistakes: [
          { wrong: 'When I arrived, the train had left.', right: 'When I arrived, the train had left.', why: 'Đây là đúng: hành động tàu đi xảy ra trước khi tôi đến.' },
          { wrong: 'I had went there.', right: 'I had gone there.', why: 'Sau had phải là V3 (gone).' },
          { wrong: 'She had came before I had arrived.', right: 'She had come before I arrived.', why: 'Hành động sau dùng quá khứ đơn.' },
        ],
      },
    ],
    quiz: [
      { q: "By the time we arrived, the show ___.", options: ["had started", "started", "has started"], answer: 0, explain: "Hành động show bắt đầu xảy ra trước khi chúng tôi đến." },
      { q: "She ___ never ___ abroad before.", options: ["has / been", "had / been", "had / went"], answer: 1, explain: "Quá khứ hoàn thành: had + V3 (been)." },
      { q: "After he ___ dinner, he went out.", options: ["finished", "has finished", "had finished"], answer: 2, explain: "Hành động ăn xong xảy ra trước hành động đi ra ngoài." },
      { q: "I ___ the answer before the teacher asked.", options: ["had known", "knew", "have known"], answer: 0, explain: "Hành động biết đáp án xảy ra trước khi giáo viên hỏi." },
      { q: "Choose the correct sentence.", options: ["They had went when we got there.", "They had gone when we got there.", "They gone when we got there."], answer: 1, explain: "Sau had dùng V3 gone." },
    ],
  },
  {
    id: 'b2-reported-speech',
    level: 'B2',
    order: 2,
    title: 'Câu gián tiếp',
    titleEn: 'Reported Speech',
    summary: 'Thuật lại lời người khác, đổi thì và đại từ cho đúng.',
    minutes: 12,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Câu gián tiếp là gì?',
        body: 'Câu gián tiếp **thuật lại lời nói** của người khác, không trích nguyên văn. Thường lùi thì một bậc so với lời gốc.',
        examples: [
          { en: 'She said, "I am tired."', vi: 'Cô ấy nói: "Tôi mệt."', mark: 'I am tired' },
          { en: 'She said that she was tired.', vi: 'Cô ấy nói rằng cô ấy mệt.', mark: 'was tired' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các động từ tường thuật',
        body: 'Dùng said, told, asked, explained, promised… Khi dùng told cần có người nghe.',
        bullets: ['said (that) + mệnh đề', 'told him + that + mệnh đề', 'asked + if/whether + mệnh đề'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Lùi thì và đổi đại từ',
        body: 'Hiện tại đơn → quá khứ đơn; hiện tại tiếp diễn → quá khứ tiếp diễn; will → would; can → could. Đổi I thành she/he, my thành her/his, now thành then.',
        formula: 'present → past · will → would · can → could',
        examples: [
          { en: '"I will call you," he said.', vi: 'Anh ấy nói: "Tôi sẽ gọi bạn."', mark: 'will' },
          { en: 'He said he would call me.', vi: 'Anh ấy nói anh ấy sẽ gọi tôi.', mark: 'would call' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Câu hỏi gián tiếp',
        body: 'Câu hỏi Yes/No dùng **if** hoặc **whether**. Câu hỏi có từ để hỏi giữ từ đó, và đổi sang trật tự câu khẳng định (không đảo trợ động từ).',
        formula: 'asked + if/whether + S + V',
        examples: [
          { en: 'She asked if I was ready.', vi: 'Cô ấy hỏi tôi đã sẵn sàng chưa.', mark: 'asked if' },
          { en: 'He asked where I lived.', vi: 'Anh ấy hỏi tôi sống ở đâu.', mark: 'where I lived' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là giữ nguyên trật tự câu hỏi trong câu gián tiếp.',
        mistakes: [
          { wrong: 'He asked where did I live.', right: 'He asked where I lived.', why: 'Câu gián tiếp không đảo trợ động từ.' },
          { wrong: 'She said me that she was ill.', right: 'She told me that she was ill.', why: 'Say không đi với tân ngữ người; dùng tell.' },
          { wrong: 'He said he is busy.', right: 'He said he was busy.', why: 'Lùi thì: is → was.' },
        ],
      },
    ],
    quiz: [
      { q: "\"I am hungry,\" she said. → She said she ___ hungry.", options: ["is", "was", "be"], answer: 1, explain: "Hiện tại đơn lùi thành quá khứ đơn." },
      { q: "\"I will help you.\" → He told me he ___ help me.", options: ["will", "shall", "would"], answer: 2, explain: "Will lùi thành would." },
      { q: "She asked ___ I had finished.", options: ["if", "that", "what"], answer: 0, explain: "Câu hỏi Yes/No dùng if hoặc whether." },
      { q: "He asked me where ___.", options: ["did I live", "I lived", "do I live"], answer: 1, explain: "Trong câu gián tiếp không đảo trợ động từ." },
      { q: "Choose the correct sentence.", options: ["She said me she will come.", "She told me she come.", "She told me that she would come."], answer: 2, explain: "Tell + người + that; will lùi thành would." },
    ],
  },
  {
    id: 'b2-relative-clauses',
    level: 'B2',
    order: 3,
    title: 'Mệnh đề quan hệ',
    titleEn: 'Relative Clauses',
    summary: 'Nối hai câu bằng who, which, that, whose và biết khi nào dùng dấu phẩy.',
    minutes: 11,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Mệnh đề quan hệ là gì?',
        body: 'Mệnh đề quan hệ **bổ nghĩa cho danh từ đứng trước**, bắt đầu bằng who, which, that, whose, where.',
        examples: [
          { en: 'The woman who called you is my aunt.', vi: 'Người phụ nữ đã gọi bạn là dì tôi.', mark: 'who called you' },
          { en: 'This is the book which I bought yesterday.', vi: 'Đây là cuốn sách tôi mua hôm qua.', mark: 'which I bought' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Chọn từ quan hệ',
        body: 'Người: who / that. Vật: which / that. Sở hữu: whose. Nơi chốn: where.',
        bullets: ['who / that: người', 'which / that: vật', 'whose: của ai đó', 'where: nơi chốn'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Mệnh đề xác định và không xác định',
        body: 'Mệnh đề **xác định** không có dấu phẩy, cần thiết để hiểu danh từ. Mệnh đề **không xác định** có dấu phẩy, chỉ thêm thông tin; không dùng that.',
        formula: 'N + who/which/that + V  ·  N, which/who + V,',
        examples: [
          { en: 'My brother who lives in Hue is a doctor.', vi: 'Anh trai tôi, người sống ở Huế, là bác sĩ.', mark: 'who lives in Hue' },
          { en: 'My brother, who is a doctor, lives in Hue.', vi: 'Anh trai tôi, là bác sĩ, sống ở Huế.', mark: 'who is a doctor' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Whose và giới từ',
        body: 'Whose thay cho tính từ sở hữu (his, her). Khi có giới từ, có thể đặt giới từ trước đại từ quan hệ.',
        examples: [
          { en: 'She is the student whose essay won the prize.', vi: 'Cô ấy là học sinh có bài luận đoạt giải.', mark: 'whose essay' },
          { en: 'This is the house in which I grew up.', vi: 'Đây là ngôi nhà tôi lớn lên.', mark: 'in which I grew up' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi thường gặp: dùng that sau dấu phẩy hoặc giữ thừa tân ngữ.',
        mistakes: [
          { wrong: 'My sister, that lives in Da Nang, is a nurse.', right: 'My sister, who lives in Da Nang, is a nurse.', why: 'Không dùng that trong mệnh đề không xác định.' },
          { wrong: 'The book which I read it was good.', right: 'The book which I read was good.', why: 'Không lặp lại tân ngữ khi đã có đại từ quan hệ.' },
          { wrong: 'The man whose I met.', right: 'The man whom I met.', why: 'Tân ngữ người có thể dùng whom; whose chỉ sở hữu.' },
        ],
      },
    ],
    quiz: [
      { q: "The girl ___ won the race is my cousin.", options: ["which", "whose", "who"], answer: 2, explain: "Người đoạt giải là girl, dùng who." },
      { q: "This is the car ___ I bought last week.", options: ["which", "who", "where"], answer: 0, explain: "Car là vật, dùng which." },
      { q: "The man ___ dog barked all night is my neighbour.", options: ["which", "whose", "who"], answer: 1, explain: "Chỉ sở hữu (dog của man) dùng whose." },
      { q: "Paris, ___ I visited in 2019, is beautiful.", options: ["that", "who", "which"], answer: 2, explain: "Mệnh đề không xác định có dấu phẩy, không dùng that." },
      { q: "Choose the correct sentence.", options: ["The café where we met is closed now.", "The café which we met is closed now.", "The café whose we met is closed now."], answer: 0, explain: "Nơi chốn dùng where." },
    ],
  },
  {
    id: 'b2-third-conditional-mixed',
    level: 'B2',
    order: 4,
    title: 'Câu điều kiện loại 3 và hỗn hợp',
    titleEn: 'Third and Mixed Conditionals',
    summary: 'Nói về giả định trái với quá khứ và kết quả của nó ở hiện tại.',
    minutes: 11,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Câu điều kiện loại 3 là gì?',
        body: 'Loại 3 nói về một giả định trái với quá khứ, nên không thể thay đổi được. Cấu trúc: if cộng had cộng V3, và would have cộng V3.',
        formula: 'If + S + had + V3, S + would have + V3',
        examples: [
          { en: 'If I had known, I would have helped you.', vi: 'Nếu tôi biết, tôi đã giúp bạn rồi.', mark: 'had known' },
          { en: 'She would have passed if she had studied.', vi: 'Cô ấy đã đỗ nếu cô ấy học.', mark: 'would have passed' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Loại 3 và loại hỗn hợp',
        body: 'Khi điều kiện và kết quả cùng ở quá khứ, dùng loại 3. Khi điều kiện và kết quả ở hai thời khác nhau, dùng câu hỗn hợp.',
        bullets: [
          'Loại 3: If we had left earlier, we would have caught the train.',
          'Hỗn hợp, quá khứ đến hiện tại: If I had studied medicine, I would be a doctor now.',
          'Hỗn hợp, hiện tại đến quá khứ: If I were braver, I would have spoken up yesterday.',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Might have và could have trong kết quả',
        body: 'Ở mệnh đề kết quả, có thể dùng might have hoặc could have để nói về khả năng trong quá khứ, thay cho would have.',
        examples: [
          { en: 'If he had left earlier, he could have made it.', vi: 'Nếu anh ấy đi sớm hơn, có lẽ anh ấy đã kịp.', mark: 'could have made' },
          { en: 'If it had rained, we might have cancelled.', vi: 'Nếu trời mưa, có lẽ chúng tôi đã hủy.', mark: 'might have cancelled' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Câu hỗn hợp: quá khứ ở if, hiện tại ở kết quả',
        body: 'Khi điều kiện xảy ra ở quá khứ nhưng kết quả còn ảnh hưởng đến hiện tại, dùng if cộng had cộng V3, và would cộng V nguyên mẫu.',
        formula: 'If + S + had + V3, S + would + V',
        examples: [
          { en: 'If she had taken the job, she would be rich now.', vi: 'Nếu cô ấy đã nhận công việc đó, bây giờ cô ấy đã giàu rồi.', mark: 'would be rich now' },
          { en: 'If I had not missed the bus, I would not be late now.', vi: 'Nếu tôi không lỡ xe buýt, bây giờ tôi đã không bị muộn.', mark: 'would not be late now' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng would have trong mệnh đề if, hoặc dùng V2 thay cho V3 sau had.',
        mistakes: [
          { wrong: 'If I would have known, I would have come.', right: 'If I had known, I would have come.', why: 'Mệnh đề if không dùng would have; dùng had cộng V3.' },
          { wrong: 'If he had came, we would have been happy.', right: 'If he had come, we would have been happy.', why: 'Sau had phải là V3 (come).' },
        ],
      },
    ],
    quiz: [
      { q: "If we ___ earlier, we would have caught the train.", options: ["had left", "left", "would leave"], answer: 0, explain: "Điều kiện quá khứ dùng had cộng V3." },
      { q: "If she ___ the warning, she would not have fallen.", options: ["would heed", "had heeded", "heeds"], answer: 1, explain: "Mệnh đề if của loại 3 dùng had cộng V3." },
      { q: "If I had studied medicine, I ___ a doctor now.", options: ["would have been", "had been", "would be"], answer: 2, explain: "Kết quả ở hiện tại (now) dùng would cộng V nguyên mẫu." },
      { q: "If the weather ___ better, we could have watched the match.", options: ["had been", "have been", "would be"], answer: 0, explain: "Điều kiện ở quá khứ nên dùng had been." },
      { q: "Choose the correct sentence.", options: ["If you would have asked me, I would have helped.", "If you had asked me, I would have helped.", "If you had asked me, I would helped."], answer: 1, explain: "Loại 3: if + had V3, would have V3." },
    ],
  },
  {
    id: 'b2-passive-modals',
    level: 'B2',
    order: 5,
    title: 'Bị động với động từ khuyết thiếu',
    titleEn: 'Passive with Modal Verbs',
    summary: 'Viết câu bị động có can, must, should, will ở vị trí của động từ chính.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Cấu trúc bị động với modal',
        body: 'Khi có động từ khuyết thiếu, cấu trúc bị động là modal cộng be cộng V3. Be ở dạng nguyên mẫu sau modal.',
        formula: 'S + modal + be + V3',
        examples: [
          { en: 'The report must be finished by Friday.', vi: 'Báo cáo phải được hoàn thành trước thứ Sáu.', mark: 'must be finished' },
          { en: 'This problem can be solved easily.', vi: 'Vấn đề này có thể được giải quyết dễ dàng.', mark: 'can be solved' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Khi nào dùng bị động với modal?',
        body: 'Dùng khi muốn nhấn vào hành động hoặc đối tượng, hoặc khi không cần nói rõ ai làm.',
        bullets: [
          'Quy định: The door should be locked at night.',
          'Khả năng: The results may be published next week.',
          'Không nói rõ ai làm: The package must be delivered today.',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Modal giữ nguyên, be ở dạng nguyên mẫu',
        body: 'Modal không đổi. Sau modal dùng be ở dạng nguyên mẫu, rồi đến V3.',
        examples: [
          { en: 'The meeting will be held in Room 5.', vi: 'Cuộc họp sẽ được tổ chức ở phòng 5.', mark: 'will be held' },
          { en: 'Rules should be followed by everyone.', vi: 'Mọi người nên tuân thủ quy định.', mark: 'should be followed' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Phủ định và nghi vấn',
        body: 'Phủ định thêm not sau modal: must not be, cannot be. Nghi vấn đưa modal lên đầu câu.',
        examples: [
          { en: 'The data cannot be shared without permission.', vi: 'Dữ liệu không thể được chia sẻ nếu không có sự cho phép.', mark: 'cannot be shared' },
          { en: 'Should the form be signed today?', vi: 'Có nên ký biểu mẫu này hôm nay không?', mark: 'Should the form be signed' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là bỏ be sau modal, hoặc dùng động từ nguyên mẫu thay cho V3.',
        mistakes: [
          { wrong: 'The letter must sent today.', right: 'The letter must be sent today.', why: 'Thiếu be giữa modal và V3.' },
          { wrong: 'The task can be do by him.', right: 'The task can be done by him.', why: 'Sau be phải là V3 (done).' },
        ],
      },
    ],
    quiz: [
      { q: "The package ___ delivered tomorrow.", options: ["will", "will be", "be will"], answer: 1, explain: "Bị động với will: will be cộng V3." },
      { q: "Homework ___ be submitted online.", options: ["musts", "is must", "must"], answer: 2, explain: "Must giữ nguyên dạng, rồi đến be." },
      { q: "Medicine ___ kept out of reach of children.", options: ["should be", "should be being", "should being"], answer: 0, explain: "Modal cộng be cộng V3 (kept)." },
      { q: "The documents ___ shown to anyone.", options: ["must be not showing", "must not be shown", "must not show"], answer: 1, explain: "Phủ định đặt sau modal, rồi đến be và V3." },
      { q: "Choose the correct sentence.", options: ["The problem can be solve quickly.", "The problem can solved quickly.", "The problem can be solved quickly."], answer: 2, explain: "Sau can be phải là V3: solved." },
    ],
  },
  {
    id: 'b2-causative-have-get',
    level: 'B2',
    order: 6,
    title: 'Nhờ vả với have và get something done',
    titleEn: 'Causative: Have and Get Something Done',
    summary: 'Nói về việc nhờ người khác làm giúp một việc cho mình.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Have something done là gì?',
        body: 'Have something done hoặc get something done nghĩa là nhờ người khác làm việc gì cho mình, thường là dịch vụ có trả tiền hoặc việc mình không tự làm.',
        formula: 'S + have / get + tân ngữ + V3',
        examples: [
          { en: 'I had my hair cut yesterday.', vi: 'Hôm qua tôi đi cắt tóc.', mark: 'had my hair cut' },
          { en: 'We are going to get the car repaired.', vi: 'Chúng tôi sẽ mang xe đi sửa.', mark: 'get the car repaired' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Khi nào dùng cấu trúc này?',
        body: 'Dùng cho dịch vụ, và cho những việc xấu xảy ra ngoài ý muốn.',
        bullets: [
          'Dịch vụ: She has her nails done every month.',
          'Việc xấu ngoài ý muốn: He had his wallet stolen.',
          'Get thân mật hơn have: Let\'s get the room painted.',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Chia have hoặc get theo thì',
        body: 'Chỉ have hoặc get thay đổi theo thì và chủ ngữ. Tân ngữ và V3 giữ nguyên.',
        examples: [
          { en: 'The school will have the roof repaired next month.', vi: 'Trường sẽ sửa mái nhà vào tháng sau.', mark: 'will have the roof repaired' },
          { en: 'My father had the house painted last year.', vi: 'Năm ngoái bố tôi đã sơn lại nhà.', mark: 'had the house painted' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Have someone do something',
        body: 'Have someone cộng V nguyên mẫu nghĩa là nhờ hoặc bắt ai làm việc gì. Đây là cấu trúc khác với have something done.',
        examples: [
          { en: 'She had her son clean his room.', vi: 'Cô ấy bắt con trai dọn phòng.', mark: 'had her son clean' },
          { en: "I'll have my assistant send the file.", vi: 'Tôi sẽ nhờ trợ lý gửi tệp.', mark: 'have my assistant send' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là thêm to trước V3, hoặc dùng quá khứ đơn thay cho V3.',
        mistakes: [
          { wrong: 'I had my car to repair.', right: 'I had my car repaired.', why: 'Sau tân ngữ cần V3, không dùng to cộng V.' },
          { wrong: 'I had the photos took.', right: 'I had the photos taken.', why: 'Dùng V3 (taken), không dùng quá khứ đơn.' },
        ],
      },
    ],
    quiz: [
      { q: "I need to ___ my passport renewed.", options: ["make", "take", "get"], answer: 2, explain: "Get something done nghĩa là nhờ người làm việc gì." },
      { q: "She ___ her house cleaned every week.", options: ["has", "does", "makes"], answer: 0, explain: "Has her house cleaned: thuê người dọn nhà mỗi tuần." },
      { q: "He ___ his bike stolen last week.", options: ["has", "had", "is"], answer: 1, explain: "Last week là quá khứ nên dùng had." },
      { q: "We are going to ___ someone fix the roof.", options: ["to have", "having", "have"], answer: 2, explain: "Have someone cộng V nguyên mẫu, không có to." },
      { q: "Choose the correct sentence.", options: ["I had my hair cut yesterday.", "I had my hair cutting yesterday.", "I had my hair cut to yesterday."], answer: 0, explain: "Sau tân ngữ dùng V3: cut." },
    ],
  },
  {
    id: 'b2-gerund-infinitive',
    level: 'B2',
    order: 7,
    title: 'Động từ + V-ing hay to V',
    titleEn: 'Gerunds and Infinitives',
    summary: 'Chọn V-ing hoặc to V sau các động từ thường gặp, và nhận ra nghĩa đổi khi dùng khác nhau.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'V-ing hay to V?',
        body: 'Sau một số động từ, động từ tiếp theo phải là V-ing hoặc to cộng V nguyên mẫu. Không có quy tắc chung cho mọi động từ nên cần học theo nhóm.',
        examples: [
          { en: 'I enjoy reading novels.', vi: 'Tôi thích đọc tiểu thuyết.', mark: 'enjoy reading' },
          { en: 'We decided to move to Da Nang.', vi: 'Chúng tôi quyết định chuyển đến Đà Nẵng.', mark: 'decided to move' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Nhóm động từ thường gặp',
        body: 'Học theo nhóm sẽ dễ nhớ hơn là học từng từ một.',
        bullets: ['Đi với V-ing: enjoy, avoid, finish, suggest, mind, practise', 'Đi với to V: want, decide, plan, hope, agree, promise, need'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Sau giới từ luôn dùng V-ing',
        body: 'Sau giới từ như in, on, for, before, after, without, about luôn dùng V-ing, không dùng to V.',
        examples: [
          { en: 'She left without saying goodbye.', vi: 'Cô ấy đi mà không chào tạm biệt.', mark: 'without saying' },
          { en: 'Thanks for helping me.', vi: 'Cảm ơn bạn đã giúp tôi.', mark: 'for helping' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Động từ đổi nghĩa: stop và remember',
        body: 'Stop cộng V-ing là ngừng làm việc gì. Stop cộng to V là dừng lại để làm việc khác. Remember cộng V-ing là nhớ việc đã làm; remember cộng to V là nhớ để làm việc chưa làm.',
        examples: [
          { en: 'I stopped to buy some bread.', vi: 'Tôi dừng lại để mua ít bánh mì.', mark: 'stopped to buy' },
          { en: 'Remember to lock the door.', vi: 'Nhớ khoá cửa nhé.', mark: 'to lock' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng to V sau enjoy, hoặc V-ing sau decide.',
        mistakes: [
          { wrong: 'I enjoy to swim.', right: 'I enjoy swimming.', why: 'Enjoy đi với V-ing.' },
          { wrong: 'She decided going abroad.', right: 'She decided to go abroad.', why: 'Decide đi với to V.' },
        ],
      },
    ],
    quiz: [
      { q: "I always look forward to ___ from you.", options: ["hearing", "hear", "to hear"], answer: 0, explain: "To ở đây là giới từ, nên theo sau là V-ing." },
      { q: "She promised ___ late again.", options: ["not being", "not to be", "not be"], answer: 1, explain: "Promise đi với to V, phủ định đặt trước to." },
      { q: "We considered ___ the project next year.", options: ["to start", "start", "starting"], answer: 2, explain: "Consider đi với V-ing." },
      { q: "Please remember ___ the lights before you leave.", options: ["to turn off", "turning off", "turn off"], answer: 0, explain: "Remember to V là nhớ để làm việc chưa làm." },
      { q: "Choose the correct sentence.", options: ["He enjoys to win the prize.", "He hopes to win the prize.", "He avoids to win the prize."], answer: 1, explain: "Hope đi với to V." },
    ],
  },
  {
    id: 'b2-phrasal-verbs',
    level: 'B2',
    order: 8,
    title: 'Cụm động từ (phrasal verbs)',
    titleEn: 'Phrasal Verbs',
    summary: 'Hiểu và dùng đúng các cụm động từ thông dụng, phân biệt cụm tách được và không tách được.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Cụm động từ là gì?',
        body: 'Cụm động từ gồm một động từ và một tiểu từ như up, down, out, off, on. Nghĩa thường khác hẳn động từ gốc: give up nghĩa là từ bỏ.',
        examples: [
          { en: 'Please turn off the lights.', vi: 'Làm ơn tắt đèn.', mark: 'turn off' },
          { en: "I can't figure out this problem.", vi: 'Tôi không hiểu được bài toán này.', mark: 'figure out' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Một số cụm thông dụng',
        body: 'Nên học cụm cùng với nghĩa và ví dụ để nhớ lâu.',
        bullets: ['give up: từ bỏ', 'look for: tìm kiếm', 'run out of: hết', 'put off: trì hoãn', 'find out: phát hiện ra'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Cụm tách được và không tách được',
        body: 'Cụm tách được cho phép đặt tân ngữ ở giữa: turn the light off hoặc turn off the light. Với đại từ như it, them thì bắt buộc tách: turn it off. Cụm không tách như look after không được tách.',
        examples: [
          { en: 'Please turn it off before you leave.', vi: 'Làm ơn tắt nó trước khi đi.', mark: 'turn it off' },
          { en: 'She looks after her little brother.', vi: 'Cô ấy trông em trai nhỏ.', mark: 'looks after' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Nghĩa phụ thuộc vào ngữ cảnh',
        body: 'Nhiều cụm có nhiều nghĩa. Hãy đọc cả câu để chọn nghĩa đúng: break down có thể là hỏng máy hoặc suy sụp về tinh thần.',
        examples: [
          { en: 'Our car broke down on the highway.', vi: 'Xe chúng tôi bị hỏng trên đường cao tốc.', mark: 'broke down' },
          { en: 'She broke down in tears after the news.', vi: 'Nghe tin đó, cô ấy bật khóc nức nở.', mark: 'broke down' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là đặt đại từ sau cụm tách được, hoặc thêm giới từ thừa vào cụm không tách.',
        mistakes: [
          { wrong: 'I looked up it.', right: 'I looked it up.', why: 'Với đại từ, đại từ phải đứng giữa cụm.' },
          { wrong: 'She looks after of the dog.', right: 'She looks after the dog.', why: 'Look after là cụm không tách và không thêm giới từ.' },
        ],
      },
    ],
    quiz: [
      { q: "It's cold outside, so don't ___ your coat.", options: ["take on", "take off", "take in"], answer: 1, explain: "Take off nghĩa là cởi ra." },
      { q: "I need to ___ the meeting; I'm too busy today.", options: ["put on", "put up", "put off"], answer: 2, explain: "Put off nghĩa là trì hoãn." },
      { q: "We ran ___ of milk, so we bought more.", options: ["out", "off", "up"], answer: 0, explain: "Run out of nghĩa là hết thứ gì." },
      { q: "I ___ my glasses everywhere but I can't find them.", options: ["look at", "look for", "look into"], answer: 1, explain: "Look for nghĩa là tìm kiếm." },
      { q: "Choose the correct sentence.", options: ["She looks her grandmother after.", "She looks after of her grandmother.", "She looks after her grandmother."], answer: 2, explain: "Look after là cụm không tách và không thêm giới từ." },
    ],
  },
];
