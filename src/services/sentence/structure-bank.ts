/**
 * KHO CẤU TRÚC CÂU — tên, công thức, cách dùng, câu mẫu cùng khuôn, lỗi hay gặp.
 *
 * Viết tay, một lần, dùng chung cho cả ba nơi: giải chi tiết sau khi chép chính
 * tả, chấm bài tự diễn đạt, và góp ý bài viết cả đoạn. Nhận diện cấu trúc trong
 * một câu bất kỳ nằm ở `structure-detect.ts` (luật, không AI).
 *
 * Mỗi cấu trúc có BA câu mẫu cùng khuôn kèm nghĩa tiếng Việt — đủ để người học
 * thấy "khuôn" chứ không chỉ một câu đơn lẻ. Câu mẫu tự viết, không trích nguồn.
 */

export type StructureGroup = 'tense' | 'modal' | 'voice' | 'clause' | 'pattern';

export type StructureExample = { en: string; vi: string };

export type StructureDef = {
  id: string;
  group: StructureGroup;
  vi: string;
  en: string;
  /** Khuôn câu, ngắn. */
  formula: string;
  /** Dùng khi nào — 1–2 câu tiếng Việt. */
  usage: string;
  examples: StructureExample[];
  /** Lỗi người Việt hay mắc với cấu trúc này, một câu. */
  pitfall: string;
  /** Mức: 1 = nền tảng, 2 = trung cấp, 3 = nâng cao (dùng để gợi ý "nâng cấp"). */
  level: 1 | 2 | 3;
};

const S = (def: StructureDef): StructureDef => def;

export const STRUCTURES: readonly StructureDef[] = [
  // ------------------------------------------------------------------ thì
  S({
    id: 'present-simple', group: 'tense', level: 1,
    vi: 'Hiện tại đơn', en: 'Present simple',
    formula: 'S + V(s/es) · S + do/does not + V',
    usage: 'Nói về thói quen, sự thật hiển nhiên và lịch trình cố định. Hay đi với always, usually, every day.',
    examples: [
      { en: 'My brother walks to school every morning.', vi: 'Em trai tôi đi bộ đến trường mỗi sáng.' },
      { en: 'Water boils at one hundred degrees.', vi: 'Nước sôi ở một trăm độ.' },
      { en: 'The shop opens at eight and closes at six.', vi: 'Cửa hàng mở lúc tám giờ và đóng lúc sáu giờ.' },
    ],
    pitfall: 'Chủ ngữ ngôi thứ ba số ít (he/she/it) phải thêm -s/-es: she studies, không phải she study.',
  }),
  S({
    id: 'past-simple', group: 'tense', level: 1,
    vi: 'Quá khứ đơn', en: 'Past simple',
    formula: 'S + V2/V-ed · S + did not + V',
    usage: 'Nói về việc đã xảy ra và đã kết thúc ở một thời điểm xác định trong quá khứ (yesterday, last year, in 2019).',
    examples: [
      { en: 'We visited my aunt last weekend.', vi: 'Cuối tuần trước chúng tôi đến thăm dì.' },
      { en: 'She did not answer the phone.', vi: 'Cô ấy đã không nghe điện thoại.' },
      { en: 'The train left ten minutes ago.', vi: 'Chuyến tàu đã rời đi mười phút trước.' },
    ],
    pitfall: 'Sau did/did not động từ về nguyên mẫu: did not go, không phải did not went.',
  }),
  S({
    id: 'present-continuous', group: 'tense', level: 1,
    vi: 'Hiện tại tiếp diễn', en: 'Present continuous',
    formula: 'S + am/is/are + V-ing',
    usage: 'Nói về việc đang diễn ra lúc nói, hoặc một kế hoạch gần đã sắp xếp. Hay đi với now, at the moment, this week.',
    examples: [
      { en: 'I am cooking dinner at the moment.', vi: 'Lúc này tôi đang nấu bữa tối.' },
      { en: 'More families are choosing smaller homes.', vi: 'Ngày càng nhiều gia đình chọn nhà nhỏ hơn.' },
      { en: 'They are flying to Seoul tomorrow.', vi: 'Ngày mai họ bay đi Seoul.' },
    ],
    pitfall: 'Không dùng với động từ trạng thái như know, like, want: nói I know, không nói I am knowing.',
  }),
  S({
    id: 'past-continuous', group: 'tense', level: 2,
    vi: 'Quá khứ tiếp diễn', en: 'Past continuous',
    formula: 'S + was/were + V-ing',
    usage: 'Nói về việc đang diễn ra tại một thời điểm trong quá khứ, hoặc đang diễn ra thì có việc khác xen vào.',
    examples: [
      { en: 'I was reading when the lights went out.', vi: 'Tôi đang đọc sách thì đèn tắt.' },
      { en: 'It was raining all afternoon.', vi: 'Trời mưa suốt buổi chiều.' },
      { en: 'They were discussing the plan at nine o’clock.', vi: 'Chín giờ họ đang bàn về kế hoạch.' },
    ],
    pitfall: 'Việc xen vào chia quá khứ đơn, việc đang diễn ra chia tiếp diễn: I was cooking when she called.',
  }),
  S({
    id: 'present-perfect', group: 'tense', level: 2,
    vi: 'Hiện tại hoàn thành', en: 'Present perfect',
    formula: 'S + have/has + V3/V-ed',
    usage: 'Nói về việc đã xảy ra mà kết quả còn liên quan đến hiện tại, hoặc kéo dài từ quá khứ đến nay (for, since, just, already, ever).',
    examples: [
      { en: 'I have lived here since 2018.', vi: 'Tôi sống ở đây từ năm 2018.' },
      { en: 'She has just finished her report.', vi: 'Cô ấy vừa hoàn thành báo cáo.' },
      { en: 'Prices have risen sharply this year.', vi: 'Năm nay giá cả đã tăng mạnh.' },
    ],
    pitfall: 'Không dùng cùng mốc thời gian đã qua: nói I saw him yesterday, không nói I have seen him yesterday.',
  }),
  S({
    id: 'past-perfect', group: 'tense', level: 3,
    vi: 'Quá khứ hoàn thành', en: 'Past perfect',
    formula: 'S + had + V3/V-ed',
    usage: 'Nói về việc đã xảy ra TRƯỚC một việc khác trong quá khứ; việc sau chia quá khứ đơn.',
    examples: [
      { en: 'When I arrived, the film had already started.', vi: 'Khi tôi đến thì phim đã bắt đầu rồi.' },
      { en: 'He had never seen snow before that trip.', vi: 'Trước chuyến đi ấy anh ấy chưa từng thấy tuyết.' },
      { en: 'She was tired because she had worked all night.', vi: 'Cô ấy mệt vì đã làm việc suốt đêm.' },
    ],
    pitfall: 'Chỉ cần quá khứ đơn nếu hai việc nối nhau rõ ràng và không cần nhấn mạnh thứ tự.',
  }),
  S({
    id: 'future-simple', group: 'tense', level: 1,
    vi: 'Tương lai đơn', en: 'Future simple',
    formula: 'S + will + V',
    usage: 'Nói về dự đoán, quyết định ngay lúc nói, lời hứa hoặc việc sẽ xảy ra.',
    examples: [
      { en: 'I will call you when I get home.', vi: 'Tôi sẽ gọi cho bạn khi về đến nhà.' },
      { en: 'It will probably rain tomorrow.', vi: 'Ngày mai trời có lẽ sẽ mưa.' },
      { en: 'We will help you move on Sunday.', vi: 'Chủ nhật chúng tôi sẽ giúp bạn chuyển nhà.' },
    ],
    pitfall: 'Sau when/if/before/after chỉ thời gian tương lai thì dùng hiện tại đơn: when I get home, không phải when I will get home.',
  }),
  S({
    id: 'be-going-to', group: 'tense', level: 1,
    vi: 'Tương lai gần (be going to)', en: 'Be going to',
    formula: 'S + am/is/are + going to + V',
    usage: 'Nói về dự định đã có từ trước hoặc dự đoán dựa trên dấu hiệu đang thấy.',
    examples: [
      { en: 'I am going to study abroad next year.', vi: 'Năm sau tôi định đi du học.' },
      { en: 'Look at those clouds. It is going to rain.', vi: 'Nhìn đám mây kia đi. Trời sắp mưa rồi.' },
      { en: 'They are going to open a new branch in May.', vi: 'Họ sắp mở thêm một chi nhánh vào tháng Năm.' },
    ],
    pitfall: 'Phải có to và động từ nguyên mẫu: going to buy, không phải going buy.',
  }),
  S({
    id: 'imperative', group: 'tense', level: 1,
    vi: 'Câu mệnh lệnh / chỉ dẫn', en: 'Imperative',
    formula: 'V + … · Don’t + V + …',
    usage: 'Dùng để chỉ đường, hướng dẫn, nhờ vả hoặc ra lệnh. Không có chủ ngữ; thêm please cho lịch sự.',
    examples: [
      { en: 'Turn left at the second traffic light.', vi: 'Rẽ trái ở đèn giao thông thứ hai.' },
      { en: 'Please keep your voice down in the library.', vi: 'Xin hãy nói nhỏ trong thư viện.' },
      { en: 'Don’t forget to lock the door.', vi: 'Đừng quên khóa cửa nhé.' },
    ],
    pitfall: 'Phủ định dùng Don’t + V, không dùng not đứng một mình: Don’t touch, không phải Not touch.',
  }),
  S({
    id: 'question', group: 'tense', level: 1,
    vi: 'Câu hỏi', en: 'Question',
    formula: 'Aux + S + V…? · Wh- + aux + S + V…?',
    usage: 'Câu hỏi đảo trợ động từ lên trước chủ ngữ; câu hỏi có từ để hỏi (what, where, how…) đặt từ hỏi ở đầu.',
    examples: [
      { en: 'Do you take the bus to work?', vi: 'Bạn đi làm bằng xe buýt à?' },
      { en: 'Where did you buy that jacket?', vi: 'Bạn mua chiếc áo khoác đó ở đâu?' },
      { en: 'Could you send me the details by email?', vi: 'Bạn gửi chi tiết cho tôi qua email được không?' },
    ],
    pitfall: 'Sau trợ động từ đảo lên đầu, động từ chính về nguyên mẫu: Did she go?, không phải Did she went?',
  }),

  // --------------------------------------------------------------- khuyết thiếu
  S({
    id: 'modal-ability', group: 'modal', level: 1,
    vi: 'Can / could: khả năng, xin phép', en: 'Can / could',
    formula: 'S + can/could + V',
    usage: 'Can nói khả năng hiện tại hoặc xin phép; could nói khả năng quá khứ hoặc lời đề nghị, nhờ vả lịch sự.',
    examples: [
      { en: 'She can speak three languages.', vi: 'Cô ấy nói được ba thứ tiếng.' },
      { en: 'Could you open the window, please?', vi: 'Bạn mở giúp tôi cửa sổ được không?' },
      { en: 'When I was ten, I could swim a long way.', vi: 'Lúc mười tuổi tôi đã bơi được rất xa.' },
    ],
    pitfall: 'Sau can/could là động từ nguyên mẫu không có to: can swim, không phải can to swim.',
  }),
  S({
    id: 'modal-advice', group: 'modal', level: 1,
    vi: 'Should: lời khuyên', en: 'Should / ought to',
    formula: 'S + should (not) + V',
    usage: 'Dùng để khuyên nhủ hoặc nêu điều nên làm. Mạnh hơn một chút là had better.',
    examples: [
      { en: 'You should drink more water.', vi: 'Bạn nên uống nhiều nước hơn.' },
      { en: 'Students should not stay up too late before exams.', vi: 'Học sinh không nên thức quá khuya trước kỳ thi.' },
      { en: 'Governments should invest more in public transport.', vi: 'Chính phủ nên đầu tư nhiều hơn vào giao thông công cộng.' },
    ],
    pitfall: 'Should không chia theo ngôi: she should go, không phải she shoulds go.',
  }),
  S({
    id: 'modal-obligation', group: 'modal', level: 2,
    vi: 'Must / have to: bắt buộc', en: 'Must / have to',
    formula: 'S + must + V · S + have/has to + V',
    usage: 'Must nói bắt buộc từ người nói; have to nói bắt buộc do quy định hay hoàn cảnh. Mustn’t là cấm, don’t have to là không cần.',
    examples: [
      { en: 'You must wear a helmet on this road.', vi: 'Bạn phải đội mũ bảo hiểm trên đoạn đường này.' },
      { en: 'I have to finish this report tonight.', vi: 'Tối nay tôi phải làm xong báo cáo này.' },
      { en: 'You don’t have to come if you are busy.', vi: 'Nếu bận thì bạn không cần phải đến.' },
    ],
    pitfall: 'Mustn’t (cấm) khác don’t have to (không cần): hai cụm này không thay được cho nhau.',
  }),
  S({
    id: 'modal-possibility', group: 'modal', level: 2,
    vi: 'May / might: có thể xảy ra', en: 'May / might',
    formula: 'S + may/might (not) + V',
    usage: 'Nói về khả năng không chắc chắn ở hiện tại hoặc tương lai; might thường chắc chắn thấp hơn may.',
    examples: [
      { en: 'It may rain later this afternoon.', vi: 'Chiều nay muộn có thể trời sẽ mưa.' },
      { en: 'He might be stuck in traffic.', vi: 'Có thể anh ấy đang kẹt xe.' },
      { en: 'Prices may fall if demand weakens.', vi: 'Giá có thể giảm nếu nhu cầu yếu đi.' },
    ],
    pitfall: 'May be (hai từ, động từ) khác maybe (một từ, trạng từ): It may be late. / Maybe it is late.',
  }),

  // --------------------------------------------------------------------- bị động
  S({
    id: 'passive', group: 'voice', level: 2,
    vi: 'Câu bị động', en: 'Passive voice',
    formula: 'S + be + V3/V-ed (+ by agent)',
    usage: 'Dùng khi người/vật chịu tác động quan trọng hơn người làm, hoặc không biết/không cần nói ai làm. Thì của câu nằm ở động từ be.',
    examples: [
      { en: 'The bridge was built in 1998.', vi: 'Cây cầu được xây vào năm 1998.' },
      { en: 'English is spoken in many countries.', vi: 'Tiếng Anh được nói ở nhiều quốc gia.' },
      { en: 'The report has been sent to all managers.', vi: 'Báo cáo đã được gửi cho mọi quản lý.' },
    ],
    pitfall: 'Phải là phân từ V3: was built, không phải was build; bỏ by + người làm nếu không cần nêu.',
  }),

  // ---------------------------------------------------------------------- mệnh đề
  S({
    id: 'relative-clause', group: 'clause', level: 2,
    vi: 'Mệnh đề quan hệ', en: 'Relative clause',
    formula: 'N + who/which/that/where/whose + V…',
    usage: 'Bổ sung thông tin cho danh từ đứng trước: who cho người, which cho vật, where cho nơi chốn, whose cho sở hữu. That thay who/which trong mệnh đề xác định.',
    examples: [
      { en: 'The man who lives next door is a doctor.', vi: 'Người đàn ông sống bên cạnh là bác sĩ.' },
      { en: 'This is the café where we first met.', vi: 'Đây là quán cà phê nơi chúng tôi gặp nhau lần đầu.' },
      { en: 'I bought a phone that lasts two days on one charge.', vi: 'Tôi mua một chiếc điện thoại dùng được hai ngày mới sạc một lần.' },
    ],
    pitfall: 'Không lặp đại từ: the book which I read it → the book which I read.',
  }),
  S({
    id: 'conditional-0', group: 'clause', level: 1,
    vi: 'Câu điều kiện loại 0', en: 'Zero conditional',
    formula: 'If + hiện tại đơn, hiện tại đơn',
    usage: 'Nói về sự thật hiển nhiên hoặc quy luật: hễ điều kiện xảy ra thì kết quả luôn xảy ra.',
    examples: [
      { en: 'If you heat ice, it melts.', vi: 'Nếu bạn đun nóng đá thì nó tan.' },
      { en: 'If I drink coffee late, I can’t sleep.', vi: 'Nếu uống cà phê muộn thì tôi không ngủ được.' },
      { en: 'Plants die if they get no water.', vi: 'Cây chết nếu không có nước.' },
    ],
    pitfall: 'Cả hai vế đều hiện tại đơn, không dùng will ở vế if.',
  }),
  S({
    id: 'conditional-1', group: 'clause', level: 1,
    vi: 'Câu điều kiện loại 1', en: 'First conditional',
    formula: 'If + hiện tại đơn, will + V',
    usage: 'Nói về điều kiện CÓ THỂ xảy ra ở tương lai và kết quả của nó.',
    examples: [
      { en: 'If it rains tomorrow, we will stay at home.', vi: 'Nếu ngày mai trời mưa, chúng tôi sẽ ở nhà.' },
      { en: 'If you study hard, you will pass the exam.', vi: 'Nếu học chăm chỉ thì bạn sẽ đỗ kỳ thi.' },
      { en: 'You will miss the bus unless you hurry.', vi: 'Bạn sẽ lỡ xe buýt nếu không nhanh lên.' },
    ],
    pitfall: 'Vế if dùng hiện tại đơn, không dùng will: If it rains, không phải If it will rain.',
  }),
  S({
    id: 'conditional-2', group: 'clause', level: 2,
    vi: 'Câu điều kiện loại 2', en: 'Second conditional',
    formula: 'If + quá khứ đơn, would + V',
    usage: 'Nói về điều không có thật hoặc khó xảy ra ở hiện tại/tương lai; dùng để tưởng tượng hoặc khuyên.',
    examples: [
      { en: 'If I had more time, I would learn the piano.', vi: 'Nếu có nhiều thời gian hơn, tôi sẽ học đàn piano.' },
      { en: 'If she lived closer, she would visit us more often.', vi: 'Nếu cô ấy sống gần hơn, cô ấy sẽ đến thăm chúng tôi thường xuyên hơn.' },
      { en: 'If I were you, I would accept the offer.', vi: 'Nếu tôi là bạn, tôi sẽ nhận lời đề nghị đó.' },
    ],
    pitfall: 'Với to be, dùng were cho mọi ngôi: If I were you, không phải If I was you (văn trang trọng).',
  }),
  S({
    id: 'conditional-3', group: 'clause', level: 3,
    vi: 'Câu điều kiện loại 3', en: 'Third conditional',
    formula: 'If + quá khứ hoàn thành, would have + V3',
    usage: 'Nói về điều ĐÃ không xảy ra trong quá khứ và kết quả tưởng tượng của nó; thường để tiếc nuối hoặc nhận xét.',
    examples: [
      { en: 'If I had left earlier, I would have caught the train.', vi: 'Nếu tôi đi sớm hơn thì đã kịp chuyến tàu.' },
      { en: 'She would have won if she had practised more.', vi: 'Cô ấy đã thắng nếu luyện tập nhiều hơn.' },
      { en: 'If they had known, they would have told us.', vi: 'Nếu họ biết thì họ đã nói với chúng tôi rồi.' },
    ],
    pitfall: 'Không dùng would ở vế if: If I had known, không phải If I would have known.',
  }),
  S({
    id: 'time-clause', group: 'clause', level: 1,
    vi: 'Mệnh đề chỉ thời gian', en: 'Time clause',
    formula: 'when/while/before/after/until/as soon as + S + V',
    usage: 'Nối hai việc theo thứ tự hoặc cùng lúc. Với tương lai, mệnh đề thời gian dùng hiện tại đơn.',
    examples: [
      { en: 'I always brush my teeth before I go to bed.', vi: 'Tôi luôn đánh răng trước khi đi ngủ.' },
      { en: 'Call me as soon as you arrive.', vi: 'Hãy gọi cho tôi ngay khi bạn đến.' },
      { en: 'While she was cooking, he set the table.', vi: 'Trong lúc cô ấy nấu ăn, anh ấy dọn bàn.' },
    ],
    pitfall: 'Tương lai: when I arrive, không phải when I will arrive.',
  }),
  S({
    id: 'reason-clause', group: 'clause', level: 1,
    vi: 'Mệnh đề chỉ lý do', en: 'Reason clause',
    formula: 'because/since/as + S + V · because of/due to + N',
    usage: 'Nêu nguyên nhân. Because + mệnh đề; because of / due to + danh từ hoặc V-ing.',
    examples: [
      { en: 'We stayed inside because it was raining.', vi: 'Chúng tôi ở trong nhà vì trời đang mưa.' },
      { en: 'The match was cancelled because of the storm.', vi: 'Trận đấu bị hủy vì cơn bão.' },
      { en: 'Since the road was closed, we took another route.', vi: 'Vì đường bị đóng nên chúng tôi đi lối khác.' },
    ],
    pitfall: 'Because of + cụm danh từ, không + mệnh đề: because of the rain, không phải because of it rained.',
  }),
  S({
    id: 'concession', group: 'clause', level: 2,
    vi: 'Nhượng bộ / tương phản', en: 'Concession',
    formula: 'Although/Though + S + V, S + V · Despite + N/V-ing, S + V',
    usage: 'Nêu điều trái với kỳ vọng. Although + mệnh đề; despite / in spite of + danh từ hoặc V-ing. Không dùng although và but trong cùng một câu.',
    examples: [
      { en: 'Although it was late, we kept working.', vi: 'Dù đã muộn, chúng tôi vẫn tiếp tục làm việc.' },
      { en: 'Despite the heavy traffic, she arrived on time.', vi: 'Mặc dù giao thông đông đúc, cô ấy vẫn đến đúng giờ.' },
      { en: 'He passed the exam, even though he had hardly studied.', vi: 'Anh ấy đỗ kỳ thi dù hầu như chưa học.' },
    ],
    pitfall: 'Although … but … là lỗi trùng nghĩa: chỉ dùng một trong hai.',
  }),
  S({
    id: 'result-clause', group: 'clause', level: 2,
    vi: 'Mệnh đề chỉ kết quả (so … that / such … that)', en: 'Result clause',
    formula: 'so + adj/adv + that + S + V · such + (a) + adj + N + that + S + V',
    usage: 'Nhấn mạnh mức độ rồi nêu kết quả. So đi với tính từ/trạng từ; such đi với danh từ.',
    examples: [
      { en: 'The coffee was so hot that I couldn’t drink it.', vi: 'Cà phê nóng đến mức tôi không uống nổi.' },
      { en: 'It was such a good film that we watched it twice.', vi: 'Bộ phim hay đến mức chúng tôi xem hai lần.' },
      { en: 'She spoke so quickly that nobody understood her.', vi: 'Cô ấy nói nhanh đến mức không ai hiểu.' },
    ],
    pitfall: 'So + tính từ, such + (a/an) + tính từ + danh từ: so good / such a good idea.',
  }),
  S({
    id: 'purpose-clause', group: 'clause', level: 2,
    vi: 'Mục đích (in order to / so that)', en: 'Purpose',
    formula: 'in order to / so as to + V · so that + S + can/will + V',
    usage: 'Nêu mục đích của hành động. In order to + V khi cùng chủ ngữ; so that + mệnh đề khi khác chủ ngữ.',
    examples: [
      { en: 'She saves money in order to buy a laptop.', vi: 'Cô ấy tiết kiệm tiền để mua một chiếc laptop.' },
      { en: 'I spoke slowly so that everyone could follow.', vi: 'Tôi nói chậm để mọi người đều theo kịp.' },
      { en: 'He left early so as not to miss the flight.', vi: 'Anh ấy đi sớm để không lỡ chuyến bay.' },
    ],
    pitfall: 'Dùng to V đơn giản cũng được ở văn nói; không dùng for + V để chỉ mục đích (for to eat → to eat).',
  }),
  S({
    id: 'that-clause', group: 'clause', level: 2,
    vi: 'Mệnh đề that (thuật lại, nêu quan điểm)', en: 'That-clause',
    formula: 'S + say/think/believe/argue/show + (that) + S + V',
    usage: 'Dùng sau động từ nêu ý kiến, bằng chứng hay lời nói. Trong văn viết học thuật rất hay gặp: research shows that…',
    examples: [
      { en: 'Many experts believe that sleep affects memory.', vi: 'Nhiều chuyên gia tin rằng giấc ngủ ảnh hưởng đến trí nhớ.' },
      { en: 'She said that she would be late.', vi: 'Cô ấy nói rằng cô ấy sẽ đến muộn.' },
      { en: 'The study shows that exercise improves mood.', vi: 'Nghiên cứu cho thấy tập thể dục cải thiện tâm trạng.' },
    ],
    pitfall: 'Thuật lại thì lùi một thì: She said that she was tired (không phải she is).',
  }),
  S({
    id: 'compound-sentence', group: 'clause', level: 1,
    vi: 'Câu ghép (and / but / so / or)', en: 'Compound sentence',
    formula: 'Mệnh đề 1, and/but/so/or + mệnh đề 2',
    usage: 'Nối hai mệnh đề ngang hàng: and thêm ý, but đối lập, so chỉ kết quả, or là lựa chọn. Có dấu phẩy trước từ nối.',
    examples: [
      { en: 'I wanted to go out, but it was raining.', vi: 'Tôi muốn ra ngoài nhưng trời đang mưa.' },
      { en: 'The room was small, so we moved the table.', vi: 'Căn phòng nhỏ nên chúng tôi dời cái bàn.' },
      { en: 'You can take the bus, or you can walk.', vi: 'Bạn có thể đi xe buýt hoặc đi bộ.' },
    ],
    pitfall: 'Hai mệnh đề đầy đủ không nối bằng dấu phẩy trơn (lỗi comma splice): thêm and/but/so hoặc đổi thành dấu chấm.',
  }),

  // ----------------------------------------------------------------------- mẫu câu
  S({
    id: 'it-extraposition', group: 'pattern', level: 2,
    vi: 'It is + tính từ + to V', en: 'It + be + adj + to-infinitive',
    formula: 'It is + adj (+ for sb) + to V · It takes sb + time + to V',
    usage: 'Dùng chủ ngữ giả it để đưa việc cần nói ra cuối câu. It takes + thời gian + to V nói việc làm mất bao lâu.',
    examples: [
      { en: 'It is important to sleep well before an exam.', vi: 'Ngủ đủ giấc trước kỳ thi là điều quan trọng.' },
      { en: 'It is difficult for beginners to learn this quickly.', vi: 'Người mới bắt đầu khó mà học việc này nhanh được.' },
      { en: 'It takes about an hour to get to the airport.', vi: 'Đến sân bay mất khoảng một tiếng.' },
    ],
    pitfall: 'Không bỏ it: It is easy to learn, không phải Is easy to learn.',
  }),
  S({
    id: 'gerund-subject', group: 'pattern', level: 2,
    vi: 'V-ing làm chủ ngữ', en: 'Gerund as subject',
    formula: 'V-ing + (object) + is/are/can… + adj/N',
    usage: 'Dùng danh động từ làm chủ ngữ để nói về một hoạt động nói chung. Động từ theo sau chia số ít.',
    examples: [
      { en: 'Walking after dinner helps digestion.', vi: 'Đi bộ sau bữa tối giúp tiêu hóa.' },
      { en: 'Learning a language takes patience.', vi: 'Học một ngôn ngữ cần sự kiên nhẫn.' },
      { en: 'Eating too much sugar is bad for your teeth.', vi: 'Ăn quá nhiều đường có hại cho răng.' },
    ],
    pitfall: 'Chủ ngữ V-ing là số ít: Walking is good, không phải Walking are good.',
  }),
  S({
    id: 'comparative', group: 'pattern', level: 1,
    vi: 'So sánh hơn', en: 'Comparative',
    formula: 'adj-er + than · more + adj + than · less + adj + than',
    usage: 'So sánh hai đối tượng. Tính từ ngắn thêm -er; tính từ dài dùng more. Nhấn mạnh bằng much/far/a lot.',
    examples: [
      { en: 'Trains are faster than buses on this route.', vi: 'Trên tuyến này tàu nhanh hơn xe buýt.' },
      { en: 'Living in the city is more expensive than living in the countryside.', vi: 'Sống ở thành phố đắt hơn sống ở nông thôn.' },
      { en: 'This exam was much easier than the last one.', vi: 'Kỳ thi này dễ hơn nhiều so với kỳ trước.' },
    ],
    pitfall: 'Không dùng cả -er lẫn more: more faster là sai, chỉ faster.',
  }),
  S({
    id: 'superlative', group: 'pattern', level: 1,
    vi: 'So sánh nhất', en: 'Superlative',
    formula: 'the + adj-est · the most + adj · one of the + superlative + N(số nhiều)',
    usage: 'Nói đối tượng ở mức cao nhất trong một nhóm. One of the + so sánh nhất + danh từ số nhiều là cách nói an toàn, tự nhiên.',
    examples: [
      { en: 'This is the tallest building in the city.', vi: 'Đây là tòa nhà cao nhất thành phố.' },
      { en: 'She is one of the most talented players on the team.', vi: 'Cô ấy là một trong những cầu thủ tài năng nhất đội.' },
      { en: 'That was the worst storm of the decade.', vi: 'Đó là cơn bão tệ nhất trong thập kỷ.' },
    ],
    pitfall: 'Luôn có the trước so sánh nhất: the best, không phải best.',
  }),
  S({
    id: 'equal-comparison', group: 'pattern', level: 1,
    vi: 'So sánh bằng (as … as)', en: 'Equal comparison',
    formula: 'as + adj/adv + as · not as/so + adj + as',
    usage: 'Nói hai đối tượng ngang nhau, hoặc không bằng nhau khi có not.',
    examples: [
      { en: 'My sister is as tall as I am.', vi: 'Em gái tôi cao bằng tôi.' },
      { en: 'The new phone is not as expensive as the old one.', vi: 'Điện thoại mới không đắt bằng chiếc cũ.' },
      { en: 'Come as soon as you can.', vi: 'Hãy đến sớm nhất có thể.' },
    ],
    pitfall: 'Giữa hai chữ as là tính từ gốc: as tall as, không phải as taller as.',
  }),
  S({
    id: 'double-comparative', group: 'pattern', level: 3,
    vi: 'The + so sánh hơn …, the + so sánh hơn …', en: 'The more … the more …',
    formula: 'The + comparative + S + V, the + comparative + S + V',
    usage: 'Nói hai điều thay đổi cùng nhau: cái này tăng thì cái kia cũng tăng (hoặc giảm).',
    examples: [
      { en: 'The more you practise, the better you become.', vi: 'Bạn càng luyện tập nhiều thì càng giỏi.' },
      { en: 'The earlier we leave, the less traffic we will meet.', vi: 'Chúng ta đi càng sớm thì càng gặp ít xe.' },
      { en: 'The older I get, the more I enjoy quiet evenings.', vi: 'Tôi càng lớn tuổi thì càng thích buổi tối yên tĩnh.' },
    ],
    pitfall: 'Hai vế đều bắt đầu bằng the + so sánh hơn, không bỏ the ở vế nào.',
  }),
  S({
    id: 'correlative', group: 'pattern', level: 3,
    vi: 'Cặp liên từ (not only … but also, both … and, either … or)', en: 'Correlative conjunctions',
    formula: 'not only A but also B · both A and B · either A or B · neither A nor B',
    usage: 'Nối hai thành phần cùng loại để nhấn mạnh sự bổ sung hoặc lựa chọn. Hai vế phải cùng dạng ngữ pháp.',
    examples: [
      { en: 'She is not only talented but also hard-working.', vi: 'Cô ấy không chỉ tài năng mà còn chăm chỉ.' },
      { en: 'Both the teachers and the students enjoyed the trip.', vi: 'Cả giáo viên lẫn học sinh đều thích chuyến đi.' },
      { en: 'You can either call me or send an email.', vi: 'Bạn có thể gọi cho tôi hoặc gửi email.' },
    ],
    pitfall: 'Giữ song song: not only quickly but also carefully (hai trạng từ), không trộn trạng từ với tính từ.',
  }),
  S({
    id: 'too-enough', group: 'pattern', level: 2,
    vi: 'Too … to / … enough to', en: 'Too … to / enough to',
    formula: 'too + adj + (for sb) + to V · adj + enough + (for sb) + to V',
    usage: 'Too nói quá mức nên không làm được; enough nói đủ mức để làm được.',
    examples: [
      { en: 'The box is too heavy for me to lift.', vi: 'Cái hộp nặng quá, tôi không nhấc nổi.' },
      { en: 'She is old enough to travel alone.', vi: 'Cô ấy đủ lớn để đi một mình.' },
      { en: 'It was too late to call anyone.', vi: 'Đã quá muộn để gọi cho ai.' },
    ],
    pitfall: 'Enough đứng SAU tính từ (old enough) nhưng đứng TRƯỚC danh từ (enough money).',
  }),
  S({
    id: 'there-be', group: 'pattern', level: 1,
    vi: 'There is / there are', en: 'There is / there are',
    formula: 'There is + N số ít/không đếm được · There are + N số nhiều',
    usage: 'Giới thiệu sự tồn tại của người, vật hoặc nơi chốn. Động từ be hòa theo danh từ đứng sau.',
    examples: [
      { en: 'There is a small park near my house.', vi: 'Có một công viên nhỏ gần nhà tôi.' },
      { en: 'There are several reasons for this change.', vi: 'Có nhiều lý do cho sự thay đổi này.' },
      { en: 'There was nobody in the office.', vi: 'Không có ai trong văn phòng.' },
    ],
    pitfall: 'Chia be theo danh từ sau: There are two cars, không phải There is two cars.',
  }),
  S({
    id: 'used-to', group: 'pattern', level: 2,
    vi: 'Used to / be used to', en: 'Used to',
    formula: 'S + used to + V · S + be used to + V-ing',
    usage: 'Used to + V nói thói quen/trạng thái trong quá khứ nay không còn. Be used to + V-ing là đã quen với việc gì.',
    examples: [
      { en: 'I used to walk to school when I was younger.', vi: 'Hồi nhỏ tôi từng đi bộ đến trường.' },
      { en: 'She is used to getting up early.', vi: 'Cô ấy đã quen dậy sớm.' },
      { en: 'There used to be a cinema here.', vi: 'Ngày xưa ở đây có một rạp chiếu phim.' },
    ],
    pitfall: 'Phủ định và nghi vấn là did not use to / Did you use to…? (không có d).',
  }),
  S({
    id: 'causative', group: 'pattern', level: 3,
    vi: 'Nhờ/khiến ai làm gì (make, let, have, get)', en: 'Causative',
    formula: 'make/let/have + sb + V · get + sb + to V · have/get + sth + V3',
    usage: 'Nói chuyện nhờ, bắt hoặc cho phép ai đó làm gì; have/get + vật + V3 là nhờ người khác làm cho mình.',
    examples: [
      { en: 'The teacher made us rewrite the essay.', vi: 'Giáo viên bắt chúng tôi viết lại bài luận.' },
      { en: 'My parents let me stay out until ten.', vi: 'Bố mẹ cho tôi ở ngoài đến mười giờ.' },
      { en: 'I had my laptop repaired last week.', vi: 'Tuần trước tôi mang laptop đi sửa.' },
    ],
    pitfall: 'Make/let/have + người + V không có to; chỉ get mới có to: get him to help.',
  }),
  S({
    id: 'verb-to-infinitive', group: 'pattern', level: 1,
    vi: 'Động từ + to V', en: 'Verb + to-infinitive',
    formula: 'want/decide/plan/hope/need/refuse/promise + to V',
    usage: 'Nhiều động từ chỉ ý định, mong muốn, quyết định đi với to-infinitive.',
    examples: [
      { en: 'We decided to take a different route.', vi: 'Chúng tôi quyết định đi lối khác.' },
      { en: 'He wants to become a pilot.', vi: 'Cậu ấy muốn trở thành phi công.' },
      { en: 'They plan to move to Da Nang next year.', vi: 'Họ dự định chuyển đến Đà Nẵng vào năm sau.' },
    ],
    pitfall: 'Phải học theo từng động từ: want to go, nhưng enjoy going.',
  }),
  S({
    id: 'verb-ing', group: 'pattern', level: 2,
    vi: 'Động từ + V-ing', en: 'Verb + gerund',
    formula: 'enjoy/avoid/consider/suggest/finish/keep + V-ing',
    usage: 'Một nhóm động từ phải đi với V-ing thay vì to V: enjoy, avoid, consider, suggest, finish, keep, mind.',
    examples: [
      { en: 'She enjoys cooking for her friends.', vi: 'Cô ấy thích nấu ăn cho bạn bè.' },
      { en: 'You should avoid eating late at night.', vi: 'Bạn nên tránh ăn khuya.' },
      { en: 'We are considering moving to a smaller flat.', vi: 'Chúng tôi đang cân nhắc chuyển sang căn hộ nhỏ hơn.' },
    ],
    pitfall: 'Sau giới từ cũng dùng V-ing: good at swimming, interested in learning.',
  }),
  S({
    id: 'object-to-infinitive', group: 'pattern', level: 2,
    vi: 'Động từ + người + to V', en: 'Verb + object + to-infinitive',
    formula: 'allow/ask/tell/encourage/require/want + sb + to V',
    usage: 'Nói việc muốn, yêu cầu, cho phép hoặc khuyến khích ai làm gì.',
    examples: [
      { en: 'The school encourages students to join clubs.', vi: 'Nhà trường khuyến khích học sinh tham gia câu lạc bộ.' },
      { en: 'She asked me to close the door.', vi: 'Cô ấy nhờ tôi đóng cửa.' },
      { en: 'The new law requires drivers to wear seat belts.', vi: 'Luật mới yêu cầu tài xế thắt dây an toàn.' },
    ],
    pitfall: 'Không nói allow to go mà không có người: allow people to go.',
  }),
  S({
    id: 'prevent-from', group: 'pattern', level: 3,
    vi: 'Ngăn ai làm gì (prevent … from V-ing)', en: 'Prevent … from',
    formula: 'prevent/stop/keep + sb/sth + from + V-ing',
    usage: 'Nói việc ngăn cản ai hoặc cái gì khỏi làm một việc; giới từ from đi với V-ing.',
    examples: [
      { en: 'The rain prevented us from going out.', vi: 'Cơn mưa ngăn chúng tôi ra ngoài.' },
      { en: 'Nothing can stop her from reaching her goal.', vi: 'Không gì có thể ngăn cô ấy đạt mục tiêu.' },
      { en: 'Good habits keep you from wasting time.', vi: 'Thói quen tốt giúp bạn khỏi lãng phí thời gian.' },
    ],
    pitfall: 'Phải có from: prevent us from going, không phải prevent us going.',
  }),
  S({
    id: 'find-it-adj', group: 'pattern', level: 3,
    vi: 'Find / make it + tính từ + to V', en: 'Find it + adj + to V',
    formula: 'find/think/make + it + adj + to V',
    usage: 'Tân ngữ giả it: nêu cảm nhận hay đánh giá về một việc làm (find it hard to…).',
    examples: [
      { en: 'Many people find it hard to wake up early.', vi: 'Nhiều người thấy khó dậy sớm.' },
      { en: 'The app makes it easy to track your spending.', vi: 'Ứng dụng giúp dễ theo dõi chi tiêu.' },
      { en: 'I think it is wrong to judge people by their looks.', vi: 'Tôi nghĩ đánh giá người khác qua vẻ ngoài là sai.' },
    ],
    pitfall: 'Phải có it: find it hard to study, không phải find hard to study.',
  }),
  S({
    id: 'participle-clause', group: 'pattern', level: 3,
    vi: 'Cụm phân từ', en: 'Participle phrase',
    formula: 'V-ing/V3 + …, S + V · Having + V3 + …, S + V',
    usage: 'Rút gọn một mệnh đề phụ thành cụm phân từ cùng chủ ngữ với mệnh đề chính, làm câu gọn và trang trọng hơn.',
    examples: [
      { en: 'Walking home, I met an old friend.', vi: 'Trên đường đi bộ về nhà, tôi gặp một người bạn cũ.' },
      { en: 'Having finished the report, she went home.', vi: 'Làm xong báo cáo, cô ấy về nhà.' },
      { en: 'Built in 1900, the station is still in use.', vi: 'Được xây năm 1900, nhà ga vẫn còn được dùng.' },
    ],
    pitfall: 'Chủ ngữ của cụm phân từ phải trùng chủ ngữ mệnh đề chính, nếu không câu bị “treo” nghĩa.',
  }),
  S({
    id: 'inversion', group: 'pattern', level: 3,
    vi: 'Đảo ngữ sau trạng từ phủ định', en: 'Negative inversion',
    formula: 'Never/Rarely/Hardly/Not only + aux + S + V',
    usage: 'Đưa trạng từ phủ định hoặc hạn chế lên đầu câu để nhấn mạnh; trợ động từ đảo lên trước chủ ngữ.',
    examples: [
      { en: 'Rarely do we see such honesty.', vi: 'Hiếm khi chúng ta thấy sự trung thực như vậy.' },
      { en: 'Not only did she win, but she also set a record.', vi: 'Cô ấy không chỉ thắng mà còn lập kỷ lục.' },
      { en: 'Never have I felt so relieved.', vi: 'Chưa bao giờ tôi thấy nhẹ nhõm đến vậy.' },
    ],
    pitfall: 'Sau từ phủ định đầu câu phải đảo trợ động từ: Never have I…, không phải Never I have…',
  }),
  S({
    id: 'cleft', group: 'pattern', level: 3,
    vi: 'Câu nhấn mạnh (It is … that …)', en: 'Cleft sentence',
    formula: 'It is/was + phần nhấn mạnh + that/who + S + V',
    usage: 'Tách một thành phần ra đứng sau It is/was để nhấn mạnh nó.',
    examples: [
      { en: 'It was my brother who broke the window.', vi: 'Chính anh trai tôi là người làm vỡ cửa sổ.' },
      { en: 'It is practice that makes you fluent.', vi: 'Chính việc luyện tập mới giúp bạn trôi chảy.' },
      { en: 'It was in Hue that we first met.', vi: 'Chính ở Huế chúng tôi đã gặp nhau lần đầu.' },
    ],
    pitfall: 'Phần còn lại sau that giữ đủ thành phần trừ cái đã được nhấn mạnh.',
  }),
  S({
    id: 'wish', group: 'pattern', level: 3,
    vi: 'Wish / if only', en: 'Wish',
    formula: 'wish + S + quá khứ đơn · wish + S + would + V · wish + S + had V3',
    usage: 'Diễn tả ước muốn trái với thực tế: hiện tại dùng quá khứ đơn, quá khứ dùng quá khứ hoàn thành.',
    examples: [
      { en: 'I wish I lived closer to the sea.', vi: 'Ước gì tôi sống gần biển hơn.' },
      { en: 'She wishes she had studied harder.', vi: 'Cô ấy ước gì mình đã học chăm hơn.' },
      { en: 'If only it would stop raining!', vi: 'Giá mà trời tạnh mưa!' },
    ],
    pitfall: 'Sau wish lùi một thì: I wish I were taller, không phải I wish I am taller.',
  }),
];

const BY_ID = new Map(STRUCTURES.map((s) => [s.id, s]));

export function getStructure(id: string): StructureDef | undefined {
  return BY_ID.get(id);
}

export const STRUCTURE_IDS: readonly string[] = STRUCTURES.map((s) => s.id);
