import type { GrammarLessonDetail } from './types';

/** Cấp C2 (phần bổ sung): đảo ngữ với not only, mệnh đề quan hệ nâng cao, song song, hồi chỉ, be to trang trọng, tính từ ghép. */
export const C2_GRAMMAR_EXTRA: GrammarLessonDetail[] = [
  {
    id: 'c2-not-only-inversion',
    level: 'C2',
    order: 8,
    title: 'Not only … but also và đảo ngữ',
    titleEn: 'Not Only ... But Also with Inversion',
    summary: 'Nhấn mạnh hai ý bổ sung bằng not only … but also và đảo ngữ khi đứng đầu câu.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Not only … but also là gì?',
        body: 'Not only … but also nối hai ý cùng chiều, nghĩa là "không những … mà còn". Khi not only đứng đầu mệnh đề, phải đảo trợ động từ hoặc be lên trước chủ ngữ.',
        formula: 'Not only + trợ động từ + S + V, but (also) + S + V',
        examples: [
          { en: 'Not only did she finish the report, but she also presented it.', vi: 'Cô ấy không những hoàn thành báo cáo mà còn trình bày nó.', mark: 'Not only did she finish the report' },
          { en: 'The city is not only beautiful but also friendly.', vi: 'Thành phố này không những đẹp mà còn thân thiện.', mark: 'not only beautiful but also friendly' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Khi nào dùng cấu trúc này?',
        body: 'Cấu trúc này dùng để nhấn mạnh thông tin thứ hai, thường trong văn viết trang trọng và thuyết trình.',
        bullets: [
          'Nối hai tính từ, danh từ hoặc mệnh đề có cùng dạng ngữ pháp',
          'Đứng đầu câu để nhấn mạnh, kèm đảo ngữ',
          'Hai vế phải song song: not only + adj … but also + adj',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Đảo ngữ khi not only đứng đầu',
        body: 'Nếu not only đứng đầu mệnh đề, đưa trợ động từ hoặc be lên trước chủ ngữ. Vế sau dùng but also với chủ ngữ bình thường.',
        examples: [
          { en: 'Not only was the food delicious, but the service was also excellent.', vi: 'Không những món ăn ngon, dịch vụ cũng xuất sắc.', mark: 'Not only was the food delicious' },
          { en: 'Not only do they speak French, but they also speak German.', vi: 'Họ không những nói tiếng Pháp mà còn nói tiếng Đức.', mark: 'Not only do they speak French' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Đặt but also đúng vị trí',
        body: 'Also đứng sau trợ động từ hoặc trước động từ chính. Đặt but also ngay trước phần được nhấn mạnh.',
        examples: [
          { en: 'She not only sings well but also plays the piano.', vi: 'Cô ấy không những hát hay mà còn chơi piano.', mark: 'but also plays the piano' },
          { en: 'He is not only a doctor but also a researcher.', vi: 'Anh ấy không chỉ là bác sĩ mà còn là nhà nghiên cứu.', mark: 'but also a researcher' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là quên đảo trợ động từ khi not only đứng đầu, hoặc lặp lại chủ ngữ và động từ không cần thiết.',
        mistakes: [
          { wrong: 'Not only she finished the report.', right: 'Not only did she finish the report.', why: 'Đảo trợ động từ did khi not only đứng đầu câu.' },
          { wrong: 'It is not only cheap but also it is good.', right: 'It is not only cheap but also good.', why: 'Hai vế song song nên không cần lặp lại chủ ngữ và động từ.' },
        ],
      },
    ],
    quiz: [
      { q: 'Not only ___ she sing, but she also dances.', options: ['did', 'was', 'does'], answer: 2, explain: 'Câu hiện tại đảo ngữ dùng does.' },
      { q: 'Not only was the hotel cheap, ___ it was clean.', options: ['and also', 'but also', 'and'], answer: 1, explain: 'Cặp đúng là not only … but also.' },
      { q: 'Not only ___ the essay, but she also translated it.', options: ['she wrote', 'wrote she', 'did she write'], answer: 2, explain: 'Đảo ngữ với did ở vế đầu.' },
      { q: 'He is ___ intelligent but also very generous.', options: ['not only', 'only not', 'not'], answer: 0, explain: 'Cặp not only … but also nối hai tính từ.' },
      { q: 'Choose the correct sentence.', options: ['Not only she finished early, but she also helped others.', 'Not only did she finish early, but she also helped others.', 'Not did she only finish early, but she also helped others.'], answer: 1, explain: 'Not only đứng đầu thì đảo trợ động từ did.' },
    ],
  },
  {
    id: 'c2-whereby-of-which',
    level: 'C2',
    order: 9,
    title: 'Mệnh đề quan hệ không xác định nâng cao',
    titleEn: 'Advanced Non-defining Relative Clauses',
    summary: 'Dùng of which, whose và whereby để bổ sung thông tin chặt chẽ trong văn bản.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Mệnh đề không xác định là gì?',
        body: 'Mệnh đề quan hệ không xác định bổ sung thông tin thêm, đặt giữa hai dấu phẩy. Trong văn viết trang trọng có thể dùng of which, whose, whereby để nối thông tin chặt chẽ hơn.',
        formula: 'N, which / of which / whose + N, V …',
        examples: [
          { en: 'The committee approved the plan, the details of which were published last week.', vi: 'Ủy ban đã phê duyệt kế hoạch, chi tiết của kế hoạch này được công bố tuần trước.', mark: 'the details of which were published last week' },
          { en: 'The company, whose profits have doubled, is expanding abroad.', vi: 'Công ty có lợi nhuận tăng gấp đôi đang mở rộng ra nước ngoài.', mark: 'whose profits have doubled' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Ba công cụ chính',
        body: 'Mỗi từ có vai trò riêng trong mệnh đề không xác định.',
        bullets: [
          'Of which / of whom: thay cho some, most, none, one of which hoặc whom',
          'Whose: chỉ sở hữu của danh từ đứng trước',
          'Whereby: theo cách, theo đó, nói về một hệ thống hoặc quy trình',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Of which sau cụm chỉ phần',
        body: 'Dùng of which sau cụm chỉ số lượng hoặc phần: some of which, most of which, none of which, one of which. Không dùng which một mình sau cụm này.',
        examples: [
          { en: 'The school offers twelve courses, most of which are free.', vi: 'Trường có mười hai khoá học, hầu hết đều miễn phí.', mark: 'most of which are free' },
          { en: 'He has three cars, one of which he never drives.', vi: 'Anh ấy có ba chiếc xe, một trong số đó anh không bao giờ lái.', mark: 'one of which he never drives' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Whereby chỉ cách thức',
        body: 'Whereby nghĩa là "theo đó", thay cho by which hoặc through which. Dùng để nói về một hệ thống, quy trình hoặc thỏa thuận.',
        examples: [
          { en: 'The agreement sets out a process whereby disputes are settled.', vi: 'Thỏa thuận đưa ra một quy trình theo đó các tranh chấp được giải quyết.', mark: 'a process whereby disputes are settled' },
          { en: 'We introduced a scheme whereby students can borrow laptops.', vi: 'Chúng tôi triển khai một chương trình cho phép sinh viên mượn laptop.', mark: 'a scheme whereby students can borrow laptops' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng which kèm đại từ thừa, hoặc dùng that trong mệnh đề không xác định.',
        mistakes: [
          { wrong: 'The rules, which most of them are unclear, need revision.', right: 'The rules, most of which are unclear, need revision.', why: 'Dùng of which thay cho which khi cụm chỉ phần.' },
          { wrong: 'The company, that profits have doubled, is expanding.', right: 'The company, whose profits have doubled, is expanding.', why: 'Mệnh đề không xác định không dùng that; chỉ sở hữu dùng whose.' },
        ],
      },
    ],
    quiz: [
      { q: 'She has two sisters, ___ lives abroad.', options: ['whose', 'one of whom', 'of which'], answer: 1, explain: 'One of whom thay cho một người trong hai chị em.' },
      { q: 'The tower, ___ height is 300 metres, is famous.', options: ['whose', 'of which', 'which'], answer: 0, explain: 'Whose chỉ sở hữu của height.' },
      { q: 'The bank offers many services, ___ are free.', options: ['most which', 'whom', 'most of which'], answer: 2, explain: 'Most of which thay cho phần lớn các dịch vụ.' },
      { q: 'It is a process ___ applications are reviewed by experts.', options: ['whose', 'which of', 'whereby'], answer: 2, explain: 'Whereby chỉ quy trình, theo đó hồ sơ được xem xét.' },
      { q: 'Choose the correct sentence.', options: ['The rules, most of which are unclear, need revision.', 'The rules, that are unclear, need revision.', 'The rules, which most of them are unclear, need revision.'], answer: 0, explain: 'Mệnh đề không xác định dùng most of which.' },
    ],
  },
  {
    id: 'c2-parallelism',
    level: 'C2',
    order: 10,
    title: 'Cấu trúc song song',
    titleEn: 'Parallel Structure',
    summary: 'Giữ các ý liệt kê và cặp tương quan ở cùng một dạng ngữ pháp để câu cân đối.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Cấu trúc song song là gì?',
        body: 'Khi liệt kê hai hoặc nhiều ý nối bằng and, or, but, các thành phần phải cùng dạng: danh từ với danh từ, V-ing với V-ing, to V với to V.',
        formula: 'A + and + B (cùng dạng ngữ pháp)',
        examples: [
          { en: 'She enjoys reading, writing, and painting.', vi: 'Cô ấy thích đọc, viết và vẽ.', mark: 'reading, writing, and painting' },
          { en: 'He wants to travel, to learn, and to grow.', vi: 'Anh ấy muốn đi du lịch, học hỏi và trưởng thành.', mark: 'to travel, to learn, and to grow' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các trường hợp cần song song',
        body: 'Song song xuất hiện trong liệt kê, cặp tương quan và so sánh.',
        bullets: [
          'Liệt kê ba ý trở lên',
          'Cặp tương quan: both … and, either … or, neither … nor, not only … but also',
          'So sánh: hai vế đối xứng nhau',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Liệt kê cùng dạng',
        body: 'Mỗi phần trong danh sách phải có cùng loại từ hoặc cùng dạng động từ. Lệch dạng làm câu nghe không tự nhiên.',
        examples: [
          { en: 'The job requires patience, creativity, and good communication.', vi: 'Công việc đòi hỏi sự kiên nhẫn, sáng tạo và giao tiếp tốt.', mark: 'patience, creativity, and good communication' },
          { en: 'Our goals are to reduce costs, to improve quality, and to expand.', vi: 'Mục tiêu của chúng tôi là giảm chi phí, nâng cao chất lượng và mở rộng.', mark: 'to reduce costs, to improve quality, and to expand' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Cặp tương quan',
        body: 'Sau both … and, either … or, neither … nor, not only … but also, phần đứng sau mỗi từ phải cùng dạng.',
        examples: [
          { en: 'She is both talented and hardworking.', vi: 'Cô ấy vừa tài năng vừa chăm chỉ.', mark: 'both talented and hardworking' },
          { en: 'You can either stay here or leave now.', vi: 'Bạn có thể ở lại đây hoặc đi ngay.', mark: 'either stay here or leave now' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là trộn lẫn V-ing với to V, hoặc trộn tính từ với động từ sau cặp both … and.',
        mistakes: [
          { wrong: 'He likes swimming, to read, and cooking.', right: 'He likes swimming, reading, and cooking.', why: 'Các mục liệt kê phải cùng dạng V-ing.' },
          { wrong: 'She is both smart and works hard.', right: 'She is both smart and hardworking.', why: 'Sau both … and phải là cùng loại từ, ở đây là tính từ.' },
        ],
      },
    ],
    quiz: [
      { q: 'He enjoys ___, cycling, and swimming.', options: ['run', 'to run', 'running'], answer: 2, explain: 'Các mục liệt kê đều là V-ing.' },
      { q: 'The course is both challenging ___ rewarding.', options: ['or', 'and', 'but'], answer: 1, explain: 'Cặp both … and.' },
      { q: 'You can either call me ___ send an email.', options: ['nor', 'but', 'or'], answer: 2, explain: 'Cặp either … or.' },
      { q: 'We need to plan, ___, and evaluate the project.', options: ['organizing', 'to organise', 'organize'], answer: 1, explain: 'Các động từ cùng dạng to V: to plan, to organise, to evaluate.' },
      { q: 'Choose the correct sentence.', options: ['He likes swimming, reading, and cooking.', 'He likes swimming, to read, and cooking.', 'He likes to swim, reading, and cook.'], answer: 0, explain: 'Cả ba mục đều là V-ing.' },
    ],
  },
  {
    id: 'c2-former-latter',
    level: 'C2',
    order: 11,
    title: 'Hồi chỉ: the former, the latter, such',
    titleEn: 'Referring Back: The Former, The Latter',
    summary: 'Dùng the former, the latter, such và this để liên kết ý trong đoạn văn học thuật.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Hồi chỉ là gì?',
        body: 'Người viết tránh lặp danh từ bằng the former (cái được nhắc đến trước), the latter (cái được nhắc đến sau), hoặc such, this, that để chỉ lại ý đã nêu.',
        examples: [
          { en: 'Tea and coffee are both popular; the former is more common in the north.', vi: 'Trà và cà phê đều phổ biến; loại đầu tiên phổ biến hơn ở miền Bắc.', mark: 'the former' },
          { en: 'Tea and coffee are popular, but the latter is more expensive.', vi: 'Trà và cà phê đều phổ biến, nhưng cà phê đắt hơn.', mark: 'the latter' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các từ hồi chỉ thường gặp',
        body: 'Chọn từ hồi chỉ theo số lượng đối tượng đã nêu và loại thông tin cần nối.',
        bullets: [
          'The former / the latter: chỉ hai đối tượng đã nêu, lần lượt theo thứ tự',
          'Such: chỉ loại như vậy (such decisions, such a system)',
          'This / that: chỉ cả một ý hoặc một sự việc đã nêu (This led to a crisis.)',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Former và latter chỉ dùng cho hai đối tượng',
        body: 'The former và the latter chỉ dùng khi đã nêu đúng hai đối tượng. Với ba đối tượng trở lên, dùng the first, the second, the last hoặc gọi đích danh.',
        examples: [
          { en: 'Two options were discussed: the former was cheap, and the latter was fast.', vi: 'Hai phương án được bàn: phương án đầu rẻ, phương án sau nhanh.', mark: 'the former was cheap' },
          { en: 'Among the three proposals, the second was the most practical.', vi: 'Trong ba đề xuất, đề xuất thứ hai thực tế nhất.', mark: 'the second was the most practical' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'This và such để chỉ ý đã nêu',
        body: 'This có thể thay cho cả một mệnh đề hoặc một ý trước đó. Such thay cho một loại sự việc vừa nói đến, và đi với danh từ số nhiều hoặc số ít.',
        examples: [
          { en: 'Prices rose sharply. This caused a decline in sales.', vi: 'Giá tăng mạnh. Điều này gây ra sự sụt giảm doanh số.', mark: 'This caused a decline in sales' },
          { en: 'The company cut costs; such decisions are rarely popular.', vi: 'Công ty cắt giảm chi phí; những quyết định như vậy hiếm khi được ưa chuộng.', mark: 'such decisions are rarely popular' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng the former cho ba đối tượng, hoặc dùng the latter để nói về một ý.',
        mistakes: [
          { wrong: 'Of the three candidates, the former was the strongest.', right: 'Of the three candidates, the first was the strongest.', why: 'The former chỉ dùng cho hai đối tượng.' },
          { wrong: 'The results were unclear. The latter led to confusion.', right: 'The results were unclear. This led to confusion.', why: 'The latter cần hai đối tượng; ở đây dùng this để chỉ cả ý đã nêu.' },
        ],
      },
    ],
    quiz: [
      { q: 'There are two options: rail and air. ___ is faster, but it is more expensive.', options: ['The former', 'The latter', 'Such'], answer: 1, explain: 'Air là đối tượng thứ hai và nhanh hơn, nên dùng the latter.' },
      { q: 'The company launched a new app and a website. ___ led to a rise in sales.', options: ['Such', 'Former', 'This'], answer: 2, explain: 'This chỉ cả sự việc vừa nêu.' },
      { q: 'Among the three suppliers, the ___ offered the lowest price.', options: ['second', 'former', 'latter'], answer: 0, explain: 'Với ba đối tượng không dùng former hay latter.' },
      { q: 'The company cut costs. ___ decisions are rarely popular.', options: ['This', 'Such', 'Such a'], answer: 1, explain: 'Such decisions chỉ loại quyết định như vậy.' },
      { q: 'Choose the correct sentence.', options: ['Of the three candidates, the former was the strongest.', 'Of the three candidates, the latter was the strongest.', 'Of the three candidates, the second was the strongest.'], answer: 2, explain: 'Với ba đối tượng dùng second.' },
    ],
  },
  {
    id: 'c2-be-to-formal',
    level: 'C2',
    order: 12,
    title: 'Cấu trúc be to trang trọng',
    titleEn: 'Formal Be To',
    summary: 'Dùng be to để nói về kế hoạch chính thức, chỉ thị và quy định trong văn trang trọng.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Be to là gì?',
        body: 'Be to cộng động từ nguyên mẫu là cấu trúc trang trọng để nói về kế hoạch đã được sắp xếp chính thức, chỉ thị hoặc điều cần đạt. Thường gặp trong tin tức và văn bản hành chính.',
        formula: 'S + be (am / is / are / was / were) + to + V',
        examples: [
          { en: 'The results are to be announced on Friday.', vi: 'Kết quả sẽ được công bố vào thứ Sáu.', mark: 'are to be announced' },
          { en: 'The new law is to take effect next year.', vi: 'Luật mới sẽ có hiệu lực năm sau.', mark: 'is to take effect' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Ba cách dùng chính',
        body: 'Be to có ba nghĩa thường gặp trong văn trang trọng.',
        bullets: [
          'Kế hoạch chính thức: The summit is to be held in Hanoi.',
          'Chỉ thị, mệnh lệnh: You are to report to the office at once.',
          'Điều cấm hoặc không được phép: No one is to enter the lab without permission.',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Chia be theo thì và chủ ngữ',
        body: 'Be đổi theo chủ ngữ và thì, to V giữ nguyên. Với quá khứ, was / were to V chỉ việc đã được lên kế hoạch nhưng có thể đã không xảy ra.',
        examples: [
          { en: 'The meeting was to start at nine, but it was delayed.', vi: 'Cuộc họp lẽ ra bắt đầu lúc chín giờ, nhưng đã bị hoãn.', mark: 'was to start at nine' },
          { en: 'Who is to blame for the delay?', vi: 'Ai chịu trách nhiệm cho sự chậm trễ này?', mark: 'is to blame' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Be to trong câu điều kiện trang trọng',
        body: 'Trong văn trang trọng, if ... are to thay cho if ... want to, để nói về điều kiện cần có để đạt một mục tiêu.',
        examples: [
          { en: 'If you are to pass the exam, you must practise every day.', vi: 'Nếu bạn muốn đậu kỳ thi, bạn phải luyện tập mỗi ngày.', mark: 'If you are to pass the exam' },
          { en: 'Nothing is to be gained by waiting any longer.', vi: 'Chờ đợi thêm nữa chẳng được gì.', mark: 'is to be gained' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là chia động từ sau to, hoặc quên be khi nói về việc bị động.',
        mistakes: [
          { wrong: 'The meeting is to starts at nine.', right: 'The meeting is to start at nine.', why: 'Sau be to dùng động từ nguyên mẫu, không chia.' },
          { wrong: 'The results are to announce on Friday.', right: 'The results are to be announced on Friday.', why: 'Kết quả được công bố là bị động, nên cần to be + V3.' },
        ],
      },
    ],
    quiz: [
      { q: 'The new bridge ___ next month.', options: ['is to be', 'to be opened', 'is to be opened'], answer: 2, explain: 'Cấu trúc bị động với be to: is to be opened.' },
      { q: 'Passengers ___ board the plane now.', options: ['to', 'are to', 'have'], answer: 1, explain: 'Be to diễn tả chỉ thị hoặc sắp xếp chính thức.' },
      { q: 'No one ___ the room without permission.', options: ['is to leave', 'is to leaves', 'leave'], answer: 0, explain: 'Be to sau no one diễn tả điều không được phép.' },
      { q: 'The results ___ announced by the committee.', options: ['to be', 'are to', 'are to be'], answer: 2, explain: 'Are to be announced là dạng đầy đủ của be to bị động.' },
      { q: 'Choose the correct sentence.', options: ['The meeting is to starts at nine.', 'The meeting is to start at nine.', 'The meeting is to started at nine.'], answer: 1, explain: 'Sau be to dùng động từ nguyên mẫu.' },
    ],
  },
  {
    id: 'c2-compound-adjectives',
    level: 'C2',
    order: 13,
    title: 'Tính từ ghép',
    titleEn: 'Compound Adjectives',
    summary: 'Ghép hai hoặc nhiều từ thành một tính từ có dấu gạch nối để mô tả chính xác và súc tích.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Tính từ ghép là gì?',
        body: 'Tính từ ghép là hai hoặc nhiều từ kết hợp để bổ nghĩa cho danh từ, thường nối bằng dấu gạch ngang. Dạng này giúp câu gọn và chính xác, đặc biệt trong văn học thuật và báo chí.',
        examples: [
          { en: 'She works for a well-known company.', vi: 'Cô ấy làm việc cho một công ty nổi tiếng.', mark: 'well-known' },
          { en: 'We need a long-term solution to the problem.', vi: 'Chúng ta cần một giải pháp lâu dài cho vấn đề.', mark: 'long-term' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Các kiểu tính từ ghép thường gặp',
        body: 'Có ba kiểu tính từ ghép phổ biến.',
        bullets: [
          'Số + danh từ số ít: a five-minute walk, a ten-year plan',
          'Trạng từ + V3: a well-written report, a well-known author',
          'Danh từ + V-ing: a time-consuming task',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Danh từ số ít trong tính từ ghép',
        body: 'Khi số lượng đứng trước danh từ trong tính từ ghép, danh từ luôn ở số ít.',
        examples: [
          { en: 'It is a ten-minute walk to the station.', vi: 'Đi bộ đến ga mất mười phút.', mark: 'ten-minute walk' },
          { en: 'He signed a three-year contract.', vi: 'Anh ấy ký hợp đồng ba năm.', mark: 'three-year contract' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Trạng từ -ly không dùng dấu gạch',
        body: 'Trạng từ kết thúc bằng -ly không nối bằng dấu gạch với tính từ hoặc V3 theo sau: a beautifully designed room, a highly respected teacher.',
        examples: [
          { en: 'She is a highly respected teacher.', vi: 'Cô ấy là một giáo viên được kính trọng rất nhiều.', mark: 'highly respected teacher' },
          { en: 'The newly opened café is popular with students.', vi: 'Quán cà phê mới mở rất được sinh viên yêu thích.', mark: 'newly opened café' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là để danh từ số nhiều trong tính từ ghép, hoặc gạch nối trạng từ -ly.',
        mistakes: [
          { wrong: 'It is a ten-minutes walk.', right: 'It is a ten-minute walk.', why: 'Danh từ trong tính từ ghép luôn ở số ít.' },
          { wrong: 'She is a highly-respected teacher.', right: 'She is a highly respected teacher.', why: 'Trạng từ -ly không nối bằng dấu gạch ngang.' },
        ],
      },
    ],
    quiz: [
      { q: 'It is a ___ journey by train.', options: ['two-hours', 'two-hour', 'two hours'], answer: 1, explain: 'Số + danh từ số ít trong tính từ ghép: two-hour.' },
      { q: 'We need a ___ plan for growth.', options: ['five-year', 'five-years', 'five years'], answer: 0, explain: 'Five-year là tính từ ghép số ít.' },
      { q: 'The ___ room has a great view.', options: ['newly-renovated', 'newlyrenovated', 'newly renovated'], answer: 2, explain: 'Trạng từ -ly không nối bằng dấu gạch.' },
      { q: 'She runs a ___ marathon every year.', options: ['forty-two kilometres', 'forty two kilometre', 'forty-two-kilometre'], answer: 2, explain: 'Tính từ ghép đứng trước danh từ dùng số ít kilometre.' },
      { q: 'Choose the correct sentence.', options: ['The company made a ten-minute presentation.', 'The company made a ten-minutes presentation.', 'The company made a ten minute-presentation.'], answer: 0, explain: 'Ten-minute là tính từ ghép và giữ số ít.' },
    ],
  },
];
