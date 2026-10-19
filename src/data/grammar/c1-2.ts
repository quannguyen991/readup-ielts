import type { GrammarLessonDetail } from './types';

/** Cấp C1 (phần bổ sung): mục đích, lỗi của người Việt, the more ... the more, tương lai trong quá khứ, giới từ đi với động từ, từ chỉ số lượng. */
export const C1_GRAMMAR_EXTRA: GrammarLessonDetail[] = [
  {
    id: 'c1-purpose-clauses',
    level: 'C1',
    order: 8,
    title: 'Mệnh đề chỉ mục đích',
    titleEn: 'Purpose Clauses',
    summary: 'Diễn đạt mục đích bằng to, in order to, so as to, so that và in case.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Mục đích là gì?',
        body: 'Mục đích trả lời câu hỏi "để làm gì?". Có thể dùng to + V, in order to + V, so as to + V (trang trọng hơn), hoặc so that + mệnh đề.',
        formula: 'to V / in order to V / so as to V  ·  so that + S + can / will / would',
        examples: [
          { en: 'She saved money in order to buy a house.', vi: 'Cô ấy tiết kiệm tiền để mua nhà.', mark: 'in order to buy a house' },
          { en: 'I wrote the time down so that I would not forget it.', vi: 'Tôi ghi giờ lại để không quên.', mark: 'so that I would not forget' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Chọn cấu trúc theo chủ ngữ',
        body: 'To V và in order to dùng khi hai mệnh đề có cùng chủ ngữ. So that dùng khi chủ ngữ khác nhau hoặc khi cần modal.',
        bullets: [
          'To V và in order to: cùng chủ ngữ (I went to the bank to withdraw money.)',
          'So that: khác chủ ngữ hoặc có modal (I spoke slowly so that everyone could understand.)',
          'In case: đề phòng điều gì có thể xảy ra (Take an umbrella in case it rains.)',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'So that đi với modal',
        body: 'Sau so that dùng can, could, will, would, may, might để diễn tả mục đích. To V và in order to không đi với modal.',
        examples: [
          { en: 'Please speak clearly so that the students can hear you.', vi: 'Làm ơn nói rõ để học sinh nghe được bạn.', mark: 'so that the students can hear' },
          { en: 'We left early so that we would avoid the traffic.', vi: 'Chúng tôi đi sớm để tránh kẹt xe.', mark: 'so that we would avoid' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'In case khác với if',
        body: 'In case chỉ sự đề phòng, không phải điều kiện. Sau in case dùng hiện tại đơn khi nói về tương lai.',
        examples: [
          { en: 'Take a coat in case it gets cold.', vi: 'Mang áo khoác phòng khi trời lạnh.', mark: 'in case it gets cold' },
          { en: 'I will keep a copy in case the file is lost.', vi: 'Tôi sẽ giữ một bản sao phòng khi tệp bị mất.', mark: 'in case the file is lost' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng for trước to V, hoặc dùng will sau in case.',
        mistakes: [
          { wrong: 'I went there for to buy a ticket.', right: 'I went there to buy a ticket.', why: 'Không dùng for trước to V để chỉ mục đích.' },
          { wrong: 'Take an umbrella in case it will rain.', right: 'Take an umbrella in case it rains.', why: 'Sau in case dùng hiện tại đơn, không dùng will.' },
        ],
      },
    ],
    quiz: [
      { q: 'He woke up early ___ catch the first train.', options: ['for', 'so', 'to'], answer: 2, explain: 'To V diễn tả mục đích khi cùng chủ ngữ.' },
      { q: 'She spoke slowly ___ everyone could follow.', options: ['in case', 'so that', 'for'], answer: 1, explain: 'So that đi với modal could để chỉ mục đích.' },
      { q: 'Bring some water ___ you get thirsty.', options: ['in case', 'so that', 'in order'], answer: 0, explain: 'In case chỉ sự đề phòng.' },
      { q: 'We installed a lock ___ our house would be safer.', options: ['in order', 'so that', 'in case'], answer: 1, explain: 'So that đi với would để chỉ mục đích.' },
      { q: 'Choose the correct sentence.', options: ['I went there so buy a ticket.', 'I went there for to buy a ticket.', 'I went there to buy a ticket.'], answer: 2, explain: 'To V chỉ mục đích, không dùng for to.' },
    ],
  },
  {
    id: 'c1-learner-errors-vi',
    level: 'C1',
    order: 9,
    title: 'Lỗi thường gặp của người Việt',
    titleEn: 'Common Errors for Vietnamese Learners',
    summary: 'Nhận ra và sửa các lỗi ngữ pháp người Việt hay mắc phải khi viết tiếng Anh.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Vì sao người Việt hay sai?',
        body: 'Tiếng Việt không chia động từ theo thì, không có mạo từ và không có số nhiều như tiếng Anh. Vì vậy người Việt dễ chuyển cấu trúc một cách máy móc, và các lỗi lặp lại theo mẫu.',
        examples: [
          { en: 'My friend is a doctor.', vi: 'Bạn tôi là bác sĩ.', mark: 'is a doctor' },
          { en: 'The meeting was cancelled because of the rain.', vi: 'Cuộc họp bị hủy vì trời mưa.', mark: 'because of the rain' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Bốn nhóm lỗi hay gặp',
        body: 'Bốn nhóm lỗi này xuất hiện nhiều nhất trong bài viết và bài nói của người học.',
        bullets: [
          'Thừa chủ ngữ: lặp lại chủ ngữ sau một danh từ đã làm chủ ngữ',
          'Thừa hoặc thiếu giới từ: discuss about, enjoy to',
          'Quên chia động từ ngôi thứ ba số ít',
          'Dùng sai mạo từ với danh từ đếm được và không đếm được',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Không lặp chủ ngữ',
        body: 'Mỗi mệnh đề chỉ có một chủ ngữ. Không đặt đại từ sau một danh từ đã làm chủ ngữ, kể cả khi tiếng Việt viết như vậy.',
        examples: [
          { en: 'The book that I bought yesterday is interesting.', vi: 'Cuốn sách tôi mua hôm qua rất thú vị.', mark: 'The book that I bought yesterday' },
          { en: 'My brother works in a bank.', vi: 'Anh trai tôi làm việc ở ngân hàng.', mark: 'works in a bank' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Động từ đi kèm giới từ hoặc không',
        body: 'Discuss, enjoy, marry là động từ nối trực tiếp với tân ngữ, không dùng giới từ. Depend, listen, look là động từ bắt buộc có giới từ đi kèm.',
        examples: [
          { en: 'We discussed the problem for an hour.', vi: 'Chúng tôi thảo luận vấn đề suốt một tiếng.', mark: 'discussed the problem' },
          { en: 'She depends on her parents for money.', vi: 'Cô ấy phụ thuộc vào bố mẹ về tiền bạc.', mark: 'depends on her parents' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là thêm giới từ sau discuss, và lặp chủ ngữ trong mệnh đề quan hệ.',
        mistakes: [
          { wrong: 'Discuss about the plan is necessary.', right: 'Discussing the plan is necessary.', why: 'Discuss là ngoại động từ, không đi với about.' },
          { wrong: 'The woman she lives next door is a nurse.', right: 'The woman who lives next door is a nurse.', why: 'Đại từ quan hệ who thay cho chủ ngữ; không lặp lại she.' },
        ],
      },
    ],
    quiz: [
      { q: 'We need to ___ the problem today.', options: ['discuss', 'discuss about', 'discuss of'], answer: 0, explain: 'Discuss là ngoại động từ, không cần giới từ.' },
      { q: 'She ___ her parents for advice.', options: ['depends', 'depends on', 'depend'], answer: 1, explain: 'Depend luôn đi với on.' },
      { q: 'The house ___ in a quiet street.', options: ['is situated', 'situated', 'situated is'], answer: 0, explain: 'Cần động từ chia be đứng trước situated.' },
      { q: 'Choose the correct sentence.', options: ['The woman she lives next door is a nurse.', 'The woman who lives next door is a nurse.', 'The woman lives next door she is a nurse.'], answer: 1, explain: 'Who thay cho chủ ngữ, không lặp she.' },
      { q: 'I look ___ hearing from you.', options: ['forward at', 'forward for', 'forward to'], answer: 2, explain: 'Look forward to nghĩa là mong đợi điều gì.' },
    ],
  },
  {
    id: 'c1-the-more-the-more',
    level: 'C1',
    order: 10,
    title: 'The more … the more',
    titleEn: 'Double Comparatives',
    summary: 'Diễn đạt mối quan hệ hai đại lượng cùng tăng hoặc cùng giảm bằng the more … the more.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Cấu trúc the more … the more là gì?',
        body: 'Cấu trúc the cộng so sánh hơn ở cả hai vế diễn tả hai đại lượng thay đổi cùng chiều: càng … càng ….',
        formula: 'The + so sánh hơn + S + V, the + so sánh hơn + S + V',
        examples: [
          { en: 'The more you practise, the better you become.', vi: 'Bạn luyện càng nhiều thì càng giỏi.', mark: 'The more you practise, the better you become' },
          { en: 'The sooner we leave, the less traffic we will meet.', vi: 'Chúng ta đi càng sớm thì càng gặp ít xe.', mark: 'The sooner we leave' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các biến thể thường gặp',
        body: 'Cấu trúc này có thể tăng, giảm hoặc kết hợp hai chiều.',
        bullets: [
          'The more … , the more …: cùng tăng',
          'The less … , the more …: một vế giảm, vế kia tăng',
          'The older, the wiser: có thể lược động từ khi đã rõ nghĩa',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Dạng so sánh hơn ở cả hai vế',
        body: 'Mỗi vế có một dạng so sánh hơn: tính từ ngắn thêm -er, tính từ dài đi với more. Vế nào cũng bắt đầu bằng the.',
        examples: [
          { en: 'The more expensive the hotel, the nicer the room.', vi: 'Khách sạn càng đắt thì phòng càng đẹp.', mark: 'The more expensive the hotel' },
          { en: 'The bigger the family, the busier the house.', vi: 'Gia đình càng đông thì nhà càng nhộn nhịp.', mark: 'The bigger the family' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Đặt danh từ sau more',
        body: 'Có thể đưa danh từ vào giữa, ngay sau more hoặc less, khi danh từ đó là đối tượng so sánh.',
        examples: [
          { en: 'The more money you earn, the more you spend.', vi: 'Bạn kiếm càng nhiều tiền thì tiêu càng nhiều.', mark: 'The more money you earn' },
          { en: 'The hotter it gets, the more tired I feel.', vi: 'Trời càng nóng, tôi càng thấy mệt.', mark: 'The hotter it gets' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là quên the ở vế thứ hai, hoặc dùng more với tính từ ngắn.',
        mistakes: [
          { wrong: 'The more you study, more you will know.', right: 'The more you study, the more you will know.', why: 'Vế thứ hai cần the.' },
          { wrong: 'The more fast you walk, the more quick you arrive.', right: 'The faster you walk, the sooner you arrive.', why: 'Tính từ ngắn dùng -er; sooner là dạng so sánh của soon.' },
        ],
      },
    ],
    quiz: [
      { q: '___ you read, ___ you learn.', options: ['More / more', 'The most / the most', 'The more / the more'], answer: 2, explain: 'Cả hai vế đều dùng the more.' },
      { q: 'The ___ the room is, the warmer it feels.', options: ['smaller', 'small', 'smallest'], answer: 0, explain: 'Tính từ ngắn ở dạng so sánh hơn là smaller.' },
      { q: 'The ___ you wait, the worse it gets.', options: ['longer', 'the longer', 'more long'], answer: 1, explain: 'Vế đầu cần the longer.' },
      { q: 'The more people join the club, ___ it becomes.', options: ['more active', 'the most active', 'the more active'], answer: 2, explain: 'Vế thứ hai dùng the more active.' },
      { q: 'Choose the correct sentence.', options: ['The more you practise, more you improve.', 'The more you practise, the more you improve.', 'The most you practise, the most you improve.'], answer: 1, explain: 'Cả hai vế đều có the.' },
    ],
  },
  {
    id: 'c1-future-in-the-past',
    level: 'C1',
    order: 11,
    title: 'Tương lai nhìn từ quá khứ',
    titleEn: 'Future in the Past',
    summary: 'Diễn tả điều định xảy ra hoặc sắp xảy ra, nhìn từ một thời điểm trong quá khứ.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Tương lai nhìn từ quá khứ là gì?',
        body: 'Khi kể chuyện trong quá khứ mà muốn nói điều sẽ xảy ra sau đó, dùng was/were going to, was/were about to hoặc would + V.',
        formula: 'was / were going to + V  ·  was / were about to + V  ·  would + V',
        examples: [
          { en: 'She was going to call me, but her phone died.', vi: 'Cô ấy định gọi cho tôi, nhưng điện thoại hết pin.', mark: 'was going to call me' },
          { en: 'We were about to leave when the phone rang.', vi: 'Chúng tôi sắp đi thì điện thoại reo.', mark: 'were about to leave' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Ba cấu trúc chính',
        body: 'Mỗi cấu trúc thể hiện một mức độ chắc chắn khác nhau về điều sẽ xảy ra.',
        bullets: [
          'Was / were going to: dự định, nhưng có thể chưa thực hiện',
          'Was / were about to: sắp xảy ra ngay lập tức',
          'Would + V: điều đã được hứa hoặc dự đoán trong quá khứ (He said he would help.)',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Would thay cho will khi lùi thì',
        body: 'Trong câu tường thuật, will trong lời nói gốc đổi thành would khi động từ tường thuật ở quá khứ.',
        examples: [
          { en: 'He promised that he would finish by Friday.', vi: 'Anh ấy hứa sẽ xong trước thứ Sáu.', mark: 'he would finish by Friday' },
          { en: 'I knew she would win the race.', vi: 'Tôi biết cô ấy sẽ thắng cuộc đua.', mark: 'she would win the race' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Dự định không thành',
        body: 'Was going to thường cho thấy dự định đã không được thực hiện, dùng để nói tiếc nuối hoặc giải thích.',
        examples: [
          { en: 'I was going to buy a new laptop, but I changed my mind.', vi: 'Tôi định mua laptop mới, nhưng đã đổi ý.', mark: 'was going to buy a new laptop' },
          { en: 'They were about to sign the contract when the lawyer called.', vi: 'Họ sắp ký hợp đồng thì luật sư gọi.', mark: 'were about to sign the contract' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là quên will đổi thành would trong câu tường thuật, hoặc quên to trong about to.',
        mistakes: [
          { wrong: 'He said he will come.', right: 'He said he would come.', why: 'Trong câu tường thuật quá khứ, will đổi thành would.' },
          { wrong: 'We were about leave when it started.', right: 'We were about to leave when it started.', why: 'Cụm about to phải có to trước động từ nguyên mẫu.' },
        ],
      },
    ],
    quiz: [
      { q: 'I ___ call you yesterday, but I forgot.', options: ['went to', 'was going to', 'am going to'], answer: 1, explain: 'Dự định trong quá khứ dùng was going to.' },
      { q: 'The train ___ leave when I reached the station.', options: ['was about to', 'about to', 'was about'], answer: 0, explain: 'Sắp xảy ra ngay lập tức dùng was about to.' },
      { q: 'She promised she ___ on time.', options: ['will be', 'be', 'would be'], answer: 2, explain: 'Lời hứa trong câu tường thuật dùng would be.' },
      { q: 'He said he ___ the report by noon.', options: ['will finish', 'would finish', 'finished'], answer: 1, explain: 'Will đổi thành would trong câu tường thuật.' },
      { q: 'Choose the correct sentence.', options: ['We were about leave when the call came.', 'We were going leave when the call came.', 'We were about to leave when the call came.'], answer: 2, explain: 'Cụm about to phải đi với động từ nguyên mẫu có to.' },
    ],
  },
  {
    id: 'c1-prepositional-verbs',
    level: 'C1',
    order: 12,
    title: 'Động từ và tính từ đi với giới từ',
    titleEn: 'Prepositional Verbs and Adjectives',
    summary: 'Ghi nhớ giới từ đi kèm động từ và tính từ để dùng tự nhiên.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Giới từ cố định là gì?',
        body: 'Nhiều động từ và tính từ đi với một giới từ cố định. Giới từ này không thay đổi theo ngữ cảnh, cần học như một cụm từ.',
        formula: 'verb / adjective + preposition + noun hoặc V-ing',
        examples: [
          { en: 'I apologise for being late.', vi: 'Tôi xin lỗi vì đến muộn.', mark: 'apologise for being late' },
          { en: 'She is interested in learning Japanese.', vi: 'Cô ấy quan tâm đến việc học tiếng Nhật.', mark: 'interested in learning' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Ba nhóm thường gặp',
        body: 'Giới từ cố định xuất hiện ở động từ, tính từ và danh từ.',
        bullets: [
          'Động từ + giới từ: rely on, insist on, agree with, object to',
          'Tính từ + giới từ: afraid of, responsible for, good at, familiar with',
          'Danh từ + giới từ: reason for, solution to, difference between',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Sau giới từ dùng V-ing',
        body: 'Khi động từ hoặc tính từ đứng trước giới từ, động từ đi sau giới từ luôn là V-ing, không dùng nguyên mẫu.',
        examples: [
          { en: 'He insisted on paying for dinner.', vi: 'Anh ấy khăng khăng trả tiền bữa tối.', mark: 'insisted on paying' },
          { en: 'They are good at solving problems.', vi: 'Họ giỏi giải quyết vấn đề.', mark: 'good at solving' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Đổi giới từ, đổi nghĩa',
        body: 'Agree with someone là đồng ý với ai. Agree on something là thống nhất về điều gì. Agree to do là đồng ý làm việc gì.',
        examples: [
          { en: 'We finally agreed on a date for the meeting.', vi: 'Cuối cùng chúng tôi thống nhất ngày họp.', mark: 'agreed on a date' },
          { en: 'I agree with you about the plan.', vi: 'Tôi đồng ý với bạn về kế hoạch.', mark: 'agree with you' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng sai giới từ với tính từ quen thuộc như good, afraid.',
        mistakes: [
          { wrong: 'She is good in English.', right: 'She is good at English.', why: 'Good đi với at khi nói về năng lực.' },
          { wrong: 'He is afraid to the dark.', right: 'He is afraid of the dark.', why: 'Afraid đi với of.' },
        ],
      },
    ],
    quiz: [
      { q: 'She is responsible ___ the budget.', options: ['for', 'of', 'at'], answer: 0, explain: 'Responsible đi với for.' },
      { q: 'He insists ___ paying the bill.', options: ['in', 'on', 'for'], answer: 1, explain: 'Insist on đi với V-ing.' },
      { q: 'We are looking forward ___ seeing you.', options: ['to', 'for', 'at'], answer: 0, explain: 'Look forward to đi với V-ing.' },
      { q: 'He is fond ___ classical music.', options: ['by', 'of', 'with'], answer: 1, explain: 'Fond đi với of.' },
      { q: 'Choose the correct sentence.', options: ['He is afraid to the dark.', 'He is afraid for the dark.', 'He is afraid of the dark.'], answer: 2, explain: 'Afraid đi với of.' },
    ],
  },
  {
    id: 'c1-quantifiers',
    level: 'C1',
    order: 13,
    title: 'Từ chỉ số lượng với of',
    titleEn: 'Quantifiers with Of',
    summary: 'Dùng each, both, neither, most và các từ chỉ số lượng đúng với động từ.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Từ chỉ số lượng với of là gì?',
        body: 'Nhiều từ chỉ số lượng đi với of và một danh từ hoặc đại từ: some of, most of, none of, each of, both of. Động từ chia theo phần được nhắc tới.',
        formula: 'Từ chỉ số lượng + of + the / my / us + danh từ hoặc đại từ',
        examples: [
          { en: 'Some of the students are absent today.', vi: 'Một số học sinh vắng hôm nay.', mark: 'Some of the students are' },
          { en: 'Each of us has a different opinion.', vi: 'Mỗi người trong chúng tôi có một ý kiến khác nhau.', mark: 'Each of us has' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các từ thường dùng',
        body: 'Mỗi từ diễn tả một mức độ hoặc một cách chia nhóm khác nhau.',
        bullets: [
          'Each of: từng người hoặc vật trong nhóm (each of the boys)',
          'Both of: cả hai (both of my parents)',
          'Neither of / either of: không cái nào / một trong hai (neither of them)',
          'Most of, some of, none of: số lượng không xác định',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Each, neither đi với động từ số ít',
        body: 'Each of, neither of, either of đi với động từ số ít. Both of đi với động từ số nhiều vì nói về hai đối tượng.',
        examples: [
          { en: 'Neither of the answers is correct.', vi: 'Không đáp án nào đúng.', mark: 'Neither of the answers is' },
          { en: 'Both of the cars were damaged in the storm.', vi: 'Cả hai chiếc xe đều bị hư hại trong bão.', mark: 'Both of the cars were' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Động từ theo danh từ sau of',
        body: 'Most of và some of chia động từ theo danh từ đứng sau of: most of the time (số ít vì time không đếm được), most of the people (số nhiều).',
        examples: [
          { en: 'Most of the time, we walk to school.', vi: 'Phần lớn thời gian, chúng tôi đi bộ đến trường.', mark: 'Most of the time, we walk' },
          { en: 'Most of the people here speak English.', vi: 'Phần lớn người ở đây nói tiếng Anh.', mark: 'Most of the people here speak' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là chia động từ số nhiều sau each of hoặc số ít sau both of.',
        mistakes: [
          { wrong: 'Each of the students have a book.', right: 'Each of the students has a book.', why: 'Each of đi với động từ số ít.' },
          { wrong: 'Both of them is tired.', right: 'Both of them are tired.', why: 'Both chỉ hai người nên động từ số nhiều.' },
        ],
      },
    ],
    quiz: [
      { q: 'Each of the rooms ___ a window.', options: ['has', 'have', 'having'], answer: 0, explain: 'Each of đi với động từ số ít.' },
      { q: 'Both of my brothers ___ engineers.', options: ['is', 'be', 'are'], answer: 2, explain: 'Both đi với động từ số nhiều.' },
      { q: '___ of the answers was right.', options: ['Both of', 'Neither of', 'Every of'], answer: 1, explain: 'Neither of đi với động từ số ít.' },
      { q: 'Most of the time, I ___ coffee in the morning.', options: ['drink', 'drinks', 'drinking'], answer: 0, explain: 'Chủ ngữ là I nên dùng động từ nguyên mẫu.' },
      { q: 'Choose the correct sentence.', options: ['Each of the boy has a bike.', 'Each of the boys has a bike.', 'Each of the boys have a bike.'], answer: 1, explain: 'Each of đi với danh từ số nhiều và động từ số ít.' },
    ],
  },
];
