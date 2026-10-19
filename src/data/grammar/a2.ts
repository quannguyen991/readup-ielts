import type { GrammarLessonDetail } from './types';
import { A2_GRAMMAR_EXTRA } from './a2-2';

/** Cấp A2: thì hiện tại đơn, quá khứ đơn, so sánh hơn. */
export const A2_GRAMMAR: GrammarLessonDetail[] = [
  {
    id: 'a2-present-simple',
    level: 'A2',
    order: 1,
    title: 'Thì hiện tại đơn',
    titleEn: 'Present Simple',
    summary: 'Nói thói quen, sự thật và lịch trình đều đặn.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Thì hiện tại đơn là gì?',
        body: 'Thì hiện tại đơn diễn tả **thói quen, sự thật hiển nhiên và lịch trình cố định**. Không dùng cho việc đang diễn ra ngay lúc nói.',
        examples: [
          { en: 'I drink coffee every morning.', vi: 'Tôi uống cà phê mỗi sáng.', mark: 'drink' },
          { en: 'Water boils at 100 degrees.', vi: 'Nước sôi ở 100 độ.', mark: 'boils' },
          { en: 'The bus leaves at 7 a.m.', vi: 'Xe buýt chạy lúc 7 giờ sáng.', mark: 'leaves' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Dấu hiệu nhận biết',
        body: 'Thường xuất hiện cùng các trạng từ tần suất và cụm thời gian lặp lại.',
        bullets: ['always, usually, often, sometimes, never', 'every day / week / year, on Mondays', 'once a week, twice a month'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Thêm -s/-es với he, she, it',
        body: 'Với he, she, it động từ thêm **-s** (works) hoặc **-es** (goes, watches, studies → studies đổi y thành i).',
        formula: 'I / You / We / They + V  ·  He / She / It + V-s/es',
        examples: [
          { en: 'She works in a bank.', vi: 'Cô ấy làm ở ngân hàng.', mark: 'works' },
          { en: 'He watches TV at night.', vi: 'Anh ấy xem tivi buổi tối.', mark: 'watches' },
          { en: 'My sister studies English.', vi: 'Chị tôi học tiếng Anh.', mark: 'studies' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Phủ định và câu hỏi dùng do/does',
        body: 'Phủ định: **do not / does not** (don\'t, doesn\'t) + V nguyên mẫu. Câu hỏi: **Do / Does** đứng đầu câu, động từ giữ dạng nguyên mẫu.',
        formula: 'Do/Does + S + V (nguyên mẫu)?',
        examples: [
          { en: "He doesn't like fish.", vi: 'Anh ấy không thích cá.', mark: "doesn't like" },
          { en: 'Do you play football?', vi: 'Bạn có chơi bóng đá không?', mark: 'Do you play' },
          { en: 'Does she live here?', vi: 'Cô ấy có sống ở đây không?', mark: 'Does she live' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi thường gặp nhất là quên -s ở ngôi thứ ba hoặc dùng sai trợ động từ.',
        mistakes: [
          { wrong: 'She like coffee.', right: 'She likes coffee.', why: 'Ngôi she cần -s ở động từ.' },
          { wrong: "He doesn't likes it.", right: "He doesn't like it.", why: 'Sau doesn\'t động từ về nguyên mẫu, không thêm -s.' },
          { wrong: 'Does she likes music?', right: 'Does she like music?', why: 'Trong câu hỏi trợ động từ đã mang -s, động từ chính giữ nguyên mẫu.' },
        ],
      },
    ],
    quiz: [
      { q: "She ___ to school by bus.", options: ["goes", "go", "going"], answer: 0, explain: "She là ngôi thứ ba số ít nên động từ thêm -es." },
      { q: "They ___ football on Sundays.", options: ["plays", "play", "playing"], answer: 1, explain: "They là số nhiều, động từ giữ nguyên." },
      { q: "He ___ like spicy food.", options: ["don't", "not", "doesn't"], answer: 2, explain: "He đi với doesn't khi phủ định." },
      { q: "___ you speak English?", options: ["Do", "Does", "Are"], answer: 0, explain: "You đi với Do trong câu hỏi." },
      { q: "My father ___ the newspaper every morning.", options: ["read", "reads", "reading"], answer: 1, explain: "My father là số ít nên dùng reads." },
    ],
  },
  {
    id: 'a2-past-simple',
    level: 'A2',
    order: 2,
    title: 'Quá khứ đơn',
    titleEn: 'Past Simple',
    summary: 'Kể lại việc đã xảy ra và đã kết thúc trong quá khứ.',
    minutes: 10,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Quá khứ đơn dùng cho việc gì?',
        body: 'Quá khứ đơn kể về **việc đã xảy ra và đã kết thúc** tại một thời điểm xác định trong quá khứ.',
        examples: [
          { en: 'I visited Hue last year.', vi: 'Năm ngoái tôi đã đến Huế.', mark: 'visited' },
          { en: 'She finished her homework yesterday.', vi: 'Hôm qua cô ấy làm xong bài tập.', mark: 'finished' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Dấu hiệu nhận biết',
        body: 'Có các cụm chỉ thời điểm đã qua.',
        bullets: ['yesterday, last week / month / year', 'two days ago, in 2010', 'when I was young'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Động từ có quy tắc thêm -ed',
        body: 'Phần lớn động từ thêm **-ed**: play → played. Động từ tận cùng bằng e chỉ thêm -d: live → lived. Tận cùng phụ âm + y đổi thành -ied: study → studied.',
        formula: 'V + -ed (có quy tắc)',
        examples: [
          { en: 'We played tennis yesterday.', vi: 'Hôm qua chúng tôi chơi tennis.', mark: 'played' },
          { en: 'He lived in Hanoi.', vi: 'Anh ấy từng sống ở Hà Nội.', mark: 'lived' },
          { en: 'They studied hard.', vi: 'Họ đã học chăm chỉ.', mark: 'studied' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Động từ bất quy tắc và phủ định',
        body: 'Một số động từ có dạng quá khứ riêng: go → went, eat → ate, see → saw. Phủ định dùng **didn\'t** + nguyên mẫu; câu hỏi dùng **Did** + nguyên mẫu.',
        formula: 'S + V2 · S + didn\'t + V · Did + S + V?',
        examples: [
          { en: 'I went to bed early.', vi: 'Tôi đi ngủ sớm.', mark: 'went' },
          { en: "She didn't come to the party.", vi: 'Cô ấy không đến bữa tiệc.', mark: "didn't come" },
          { en: 'Did you see the film?', vi: 'Bạn có xem phim không?', mark: 'Did you see' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi thường gặp: dùng cả did và động từ quá khứ.',
        mistakes: [
          { wrong: 'Did you went there?', right: 'Did you go there?', why: 'Sau Did động từ về nguyên mẫu.' },
          { wrong: 'I didn\'t saw him.', right: "I didn't see him.", why: 'Phủ định có didn\'t thì động từ về nguyên mẫu.' },
          { wrong: 'Yesterday I go to school.', right: 'Yesterday I went to school.', why: 'Có yesterday phải dùng thì quá khứ.' },
        ],
      },
    ],
    quiz: [
      { q: "I ___ a letter yesterday.", options: ["write", "wrote", "writed"], answer: 1, explain: "Write là động từ bất quy tắc, quá khứ là wrote." },
      { q: "They ___ to the cinema last night.", options: ["go", "goed", "went"], answer: 2, explain: "Go → went là dạng bất quy tắc." },
      { q: "She ___ the door.", options: ["didn't open", "didn't opened", "not opened"], answer: 0, explain: "Sau didn't là động từ nguyên mẫu." },
      { q: "___ you call me last week?", options: ["Do", "Did", "Were"], answer: 1, explain: "Câu hỏi quá khứ đơn dùng Did." },
      { q: "We ___ the museum in 2019.", options: ["visit", "visiting", "visited"], answer: 2, explain: "Visit có quy tắc, thêm -ed." },
    ],
  },
  {
    id: 'a2-comparatives',
    level: 'A2',
    order: 3,
    title: 'So sánh hơn',
    titleEn: 'Comparatives',
    summary: 'So sánh hai người hoặc hai vật bằng tính từ.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'So sánh hơn để làm gì?',
        body: 'Dùng để nói một người hoặc vật **có mức độ cao hơn** người hoặc vật khác về một đặc điểm.',
        examples: [
          { en: 'Hanoi is bigger than Hue.', vi: 'Hà Nội lớn hơn Huế.', mark: 'bigger than' },
          { en: 'This book is more interesting than that one.', vi: 'Cuốn này thú vị hơn cuốn kia.', mark: 'more interesting than' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Khi nào dùng than?',
        body: 'Luôn đi kèm **than** để đối chiếu hai đối tượng.',
        bullets: ['Hai người hoặc hai vật được so sánh', 'Có từ như bigger, more, better đứng trước than'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Tính từ ngắn thêm -er',
        body: 'Tính từ một âm tiết thêm **-er**: tall → taller, cheap → cheaper. Tận cùng là e chỉ thêm -r. Tận cùng phụ âm + y đổi thành -ier: easy → easier.',
        formula: 'Tính từ ngắn + -er + than',
        examples: [
          { en: 'My house is bigger than yours.', vi: 'Nhà tôi lớn hơn nhà bạn.', mark: 'bigger' },
          { en: 'The test was easier than I expected.', vi: 'Bài kiểm tra dễ hơn tôi nghĩ.', mark: 'easier' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Tính từ dài dùng more',
        body: 'Tính từ hai âm tiết trở lên (trừ các từ kết thúc -y) dùng **more** đứng trước. Một số từ bất quy tắc: good → better, bad → worse.',
        formula: 'more + tính từ dài + than',
        examples: [
          { en: 'This city is more beautiful than I thought.', vi: 'Thành phố này đẹp hơn tôi nghĩ.', mark: 'more beautiful' },
          { en: 'Your idea is better than mine.', vi: 'Ý của bạn hay hơn của tôi.', mark: 'better' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi thường gặp: dùng cả more và -er, hoặc quên than.',
        mistakes: [
          { wrong: 'She is more taller than me.', right: 'She is taller than me.', why: 'Tính từ ngắn không đi với more.' },
          { wrong: 'He is good than me.', right: 'He is better than me.', why: 'Good có dạng so sánh riêng là better.' },
          { wrong: 'It is cheap then that.', right: 'It is cheaper than that.', why: 'Than khác then; so sánh dùng than.' },
        ],
      },
    ],
    quiz: [
      { q: "This road is ___ than that one.", options: ["wide", "widest", "wider"], answer: 2, explain: "Wide là tính từ ngắn, so sánh hơn là wider." },
      { q: "Her English is ___ than mine.", options: ["better", "good", "more good"], answer: 0, explain: "Good có dạng so sánh hơn riêng là better." },
      { q: "The film is ___ than the book.", options: ["interestinger", "more interesting", "most interesting"], answer: 1, explain: "Interesting là tính từ dài, dùng more." },
      { q: "I am ___ than my brother.", options: ["more old", "oldest", "older"], answer: 2, explain: "Old là tính từ ngắn, so sánh hơn là older." },
      { q: "Choose the correct sentence.", options: ["It is cheaper than the other.", "It is more cheap than the other.", "It is cheap than the other."], answer: 0, explain: "Cheap là tính từ ngắn: cheaper + than." },
    ],
  },
  {
    id: 'a2-present-continuous',
    level: 'A2',
    order: 4,
    title: 'Thì hiện tại tiếp diễn',
    titleEn: 'Present Continuous',
    summary: 'Nói về việc đang diễn ra ngay lúc nói và kế hoạch đã sắp xếp.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Hiện tại tiếp diễn là gì?',
        body: 'Dùng để nói một hành động đang diễn ra ngay lúc nói hoặc quanh thời điểm nói. Cấu trúc gồm am, is hoặc are cộng với V-ing.',
        formula: 'S + am / is / are + V-ing',
        examples: [
          { en: 'I am reading a book now.', vi: 'Bây giờ tôi đang đọc sách.', mark: 'am reading' },
          { en: 'They are playing football outside.', vi: 'Họ đang đá bóng ngoài trời.', mark: 'are playing' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Dấu hiệu nhận biết',
        body: 'Thường đi kèm các từ chỉ thời điểm hiện tại như now, at the moment, right now, hoặc các câu cảm thán như Look! và Listen!',
        bullets: ['Now / right now: bây giờ', 'At the moment: lúc này', 'Look! / Listen!: nhìn kìa, nghe này!', 'Kế hoạch đã sắp xếp: We are meeting Tom tonight.'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Thêm -ing vào động từ',
        body: 'Đa số động từ chỉ cần thêm -ing. Động từ tận cùng bằng e câm thì bỏ e rồi thêm -ing. Động từ một âm tiết có dạng phụ âm + nguyên âm + phụ âm thì gấp đôi phụ âm cuối.',
        examples: [
          { en: 'She is writing a letter.', vi: 'Cô ấy đang viết một lá thư.', mark: 'is writing' },
          { en: 'He is running fast.', vi: 'Anh ấy đang chạy nhanh.', mark: 'is running' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Phủ định và câu hỏi',
        body: 'Phủ định thêm not sau am, is hoặc are. Câu hỏi đưa am, is hoặc are lên trước chủ ngữ.',
        formula: "S + am / is / are not + V-ing  ·  Am / Is / Are + S + V-ing?",
        examples: [
          { en: "We aren't watching TV.", vi: 'Chúng tôi không xem TV.', mark: "aren't watching" },
          { en: 'Is she sleeping now?', vi: 'Bây giờ cô ấy đang ngủ à?', mark: 'Is she sleeping' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi thường gặp là quên -ing sau be, hoặc dùng tiếp diễn với động từ chỉ trạng thái.',
        mistakes: [
          { wrong: 'I am go to school now.', right: 'I am going to school now.', why: 'Sau am, is, are phải dùng V-ing.' },
          { wrong: 'She is know the answer.', right: 'She knows the answer.', why: 'Động từ chỉ trạng thái như know, like, want thường không dùng ở tiếp diễn.' },
        ],
      },
    ],
    quiz: [
      { q: "Look! It ___ raining.", options: ["is", "does", "has"], answer: 0, explain: "It là số ít, dạng tiếp diễn dùng is." },
      { q: "They ___ dinner at the moment.", options: ["cook", "are cooking", "cooks"], answer: 1, explain: "At the moment là dấu hiệu của hiện tại tiếp diễn." },
      { q: "She ___ TV right now.", options: ["not watching", "doesn't watch", "isn't watching"], answer: 2, explain: "Right now cho biết hành động đang diễn ra, phủ định là isn't watching." },
      { q: "What ___ you doing?", options: ["are", "do", "is"], answer: 0, explain: "Với you, câu hỏi tiếp diễn dùng are." },
      { q: "Choose the correct sentence.", options: ["I am live in Hanoi now.", "I am living in Hanoi now.", "I living in Hanoi now."], answer: 1, explain: "Am đi với V-ing: living." },
    ],
  },
  {
    id: 'a2-future-going-to-will',
    level: 'A2',
    order: 5,
    title: 'Tương lai với going to và will',
    titleEn: 'Future: Going To and Will',
    summary: 'Nói về dự định và dự đoán tương lai bằng going to hoặc will.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Hai cách nói tương lai',
        body: 'Going to dùng cho dự định đã có sẵn hoặc dự đoán dựa trên dấu hiệu hiện tại. Will dùng cho quyết định ngay lúc nói, lời hứa và dự đoán chung.',
        formula: 'S + am / is / are going to + V  ·  S + will + V',
        examples: [
          { en: "I'm going to visit my grandma next week.", vi: 'Tuần sau tôi định đi thăm bà.', mark: 'going to visit' },
          { en: "I'll call you tomorrow.", vi: 'Ngày mai tôi sẽ gọi cho bạn.', mark: "I'll call" },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Khi nào dùng cái nào?',
        body: 'Chọn theo việc người nói đã định trước hay mới quyết định ngay lúc nói.',
        bullets: [
          'Going to, dự định có sẵn: We are going to paint the room.',
          'Going to, dấu hiệu hiện tại: Look at those clouds. It is going to rain.',
          'Will, quyết định ngay lúc nói: Oh, I will help you.',
          'Will, lời hứa hoặc đề nghị: I will never lie to you.',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Will và dạng viết tắt',
        body: "Will không đổi theo chủ ngữ. Viết tắt: I will là I'll, will not là won't.",
        formula: 'S + will + V (nguyên mẫu)',
        examples: [
          { en: "She won't be late.", vi: 'Cô ấy sẽ không đến muộn.', mark: "won't be" },
          { en: 'They will win the game.', vi: 'Họ sẽ thắng trận đấu.', mark: 'will win' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Going to đổi be theo chủ ngữ',
        body: 'Sau going to dùng be phù hợp với chủ ngữ, rồi đến động từ nguyên mẫu. Phủ định: thêm not sau be.',
        examples: [
          { en: "He isn't going to stay long.", vi: 'Anh ấy sẽ không ở lại lâu.', mark: "isn't going to stay" },
          { en: 'Are you going to buy a car?', vi: 'Bạn định mua ô tô à?', mark: 'Are you going to buy' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là chia động từ sau going to, và dùng will cho dấu hiệu nhìn thấy được.',
        mistakes: [
          { wrong: 'I am going to helps you.', right: 'I am going to help you.', why: 'Sau going to dùng động từ nguyên mẫu.' },
          { wrong: 'Look at the sky! It will rain.', right: 'Look at the sky! It is going to rain.', why: 'Dấu hiệu nhìn thấy ngay bây giờ thì dùng going to.' },
        ],
      },
    ],
    quiz: [
      { q: "Hold on, I ___ get the door.", options: ["am going to", "will", "am going"], answer: 1, explain: "Quyết định ngay lúc nói dùng will." },
      { q: "I ___ going to start a new job next month.", options: ["is", "are", "am"], answer: 2, explain: "I đi với am trong going to." },
      { q: "She won't ___ late for dinner.", options: ["be", "being", "is"], answer: 0, explain: "Sau will hoặc won't dùng động từ nguyên mẫu." },
      { q: "Lan is ___ to visit her uncle this weekend.", options: ["will", "going", "goes"], answer: 1, explain: "Dự định đã có: is going to visit." },
      { q: "Choose the correct sentence.", options: ["Look at the sky! It will to snow.", "Look at the sky! It going to snows.", "Look at the sky! It is going to snow."], answer: 2, explain: "Dấu hiệu nhìn thấy được dùng is going to + V." },
    ],
  },
  {
    id: 'a2-countable-uncountable',
    level: 'A2',
    order: 6,
    title: 'Danh từ đếm được và không đếm được',
    titleEn: 'Countable and Uncountable Nouns',
    summary: 'Chọn some, any, much, many đúng cho từng loại danh từ.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Hai loại danh từ',
        body: 'Danh từ đếm được có thể đếm từng cái (an apple, two apples). Danh từ không đếm được như water, rice, information không đếm từng đơn vị và không có dạng số nhiều.',
        examples: [
          { en: 'I bought three apples and some rice.', vi: 'Tôi mua ba quả táo và một ít gạo.', mark: 'some rice' },
          { en: 'There is a lot of water in the bottle.', vi: 'Trong chai có rất nhiều nước.', mark: 'a lot of water' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Some, any, many, much',
        body: 'Many đi với danh từ đếm được số nhiều, much đi với danh từ không đếm được. Some dùng trong câu khẳng định, any dùng trong câu phủ định và câu hỏi.',
        bullets: ['many + đếm được: many friends, many cars', 'much + không đếm được: much time, much money', 'some (khẳng định): There is some milk.', 'any (phủ định, hỏi): Is there any milk?'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Many và much trong câu hỏi và phủ định',
        body: 'Trong câu phủ định và câu hỏi thường dùng many và much. Trong câu khẳng định thường dùng a lot of hoặc lots of.',
        examples: [
          { en: 'Do you have many friends here?', vi: 'Bạn có nhiều bạn ở đây không?', mark: 'many friends' },
          { en: "We didn't spend much money.", vi: 'Chúng tôi không tiêu nhiều tiền.', mark: 'much money' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'A few và a little',
        body: 'A few đi với danh từ đếm được số nhiều, a little đi với danh từ không đếm được; cả hai nghĩa là "một ít" (sắc thái tích cực). Few và little không có a nghĩa là "rất ít" (sắc thái tiêu cực).',
        examples: [
          { en: 'She has a few good ideas.', vi: 'Cô ấy có vài ý tưởng hay.', mark: 'a few good ideas' },
          { en: 'There is a little sugar left.', vi: 'Còn một ít đường.', mark: 'a little sugar' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng many với danh từ không đếm được, hoặc thêm -s vào information.',
        mistakes: [
          { wrong: 'How many water do you drink?', right: 'How much water do you drink?', why: 'Water không đếm được nên dùng much.' },
          { wrong: 'I have many informations.', right: 'I have a lot of information.', why: 'Information không đếm được và không có dạng số nhiều.' },
        ],
      },
    ],
    quiz: [
      { q: "We don't have ___ time.", options: ["many", "a few", "much"], answer: 2, explain: "Time không đếm được nên dùng much trong câu phủ định." },
      { q: "There are ___ students in the classroom.", options: ["many", "much", "a little"], answer: 0, explain: "Students là danh từ đếm được số nhiều nên dùng many." },
      { q: "I don't have ___ money.", options: ["some", "any", "many"], answer: 1, explain: "Trong câu phủ định dùng any." },
      { q: "She has ___ good ideas for the project.", options: ["a little", "much", "a few"], answer: 2, explain: "Ideas là danh từ đếm được số nhiều nên dùng a few." },
      { q: "Choose the correct sentence.", options: ["How much coffee do you drink?", "How many coffee do you drink?", "How much coffees do you drink?"], answer: 0, explain: "Coffee không đếm được nên dùng how much." },
    ],
  },
  {
    id: 'a2-object-pronouns',
    level: 'A2',
    order: 7,
    title: 'Đại từ tân ngữ',
    titleEn: 'Object Pronouns',
    summary: 'Dùng me, you, him, her, it, us, them đúng vị trí sau động từ và giới từ.',
    minutes: 7,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Đại từ tân ngữ là gì?',
        body: 'Đại từ tân ngữ đứng sau động từ hoặc giới từ, chỉ người hoặc vật nhận hành động. Chúng không đứng đầu câu.',
        formula: 'I → me · you → you · he → him · she → her · it → it · we → us · they → them',
        examples: [
          { en: 'Can you help me?', vi: 'Bạn giúp tôi được không?', mark: 'me' },
          { en: 'I saw them at the station.', vi: 'Tôi đã thấy họ ở nhà ga.', mark: 'them' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Vị trí của tân ngữ',
        body: 'Đặt tân ngữ sau động từ hoặc sau giới từ như to, for, with, about.',
        bullets: ['Sau động từ: She loves him.', 'Sau giới từ: This gift is for you.', 'Sau động từ và giới từ: Look at it!'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Không dùng đại từ chủ ngữ làm tân ngữ',
        body: 'Sai lầm phổ biến là dùng đại từ chủ ngữ như I, he, we ở vị trí sau động từ. Phải đổi sang dạng tân ngữ.',
        examples: [
          { en: 'Tell him the news.', vi: 'Hãy kể tin này cho anh ấy.', mark: 'him' },
          { en: 'Please wait for us.', vi: 'Làm ơn đợi chúng tôi.', mark: 'us' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Hai tân ngữ trong một câu',
        body: 'Khi có hai tân ngữ, thường đặt tân ngữ chỉ người trước: Give me the book. Hoặc đặt tân ngữ chỉ người sau giới từ to hoặc for.',
        examples: [
          { en: 'Give me a pen, please.', vi: 'Làm ơn đưa tôi cây bút.', mark: 'me' },
          { en: 'She sent the letter to us.', vi: 'Cô ấy gửi lá thư cho chúng tôi.', mark: 'to us' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng chủ ngữ thay cho tân ngữ, hoặc ngược lại.',
        mistakes: [
          { wrong: 'Please help I.', right: 'Please help me.', why: 'Sau động từ dùng me, không dùng I.' },
          { wrong: 'Him is my brother.', right: 'He is my brother.', why: 'Làm chủ ngữ thì dùng he, không dùng him.' },
        ],
      },
    ],
    quiz: [
      { q: "I love ___ very much.", options: ["you", "your", "yours"], answer: 0, explain: "Sau động từ love dùng tân ngữ you." },
      { q: "Can you give ___ a hand?", options: ["we", "us", "our"], answer: 1, explain: "Sau động từ give dùng tân ngữ us." },
      { q: "The teacher is talking to ___.", options: ["they", "their", "them"], answer: 2, explain: "Sau giới từ to dùng them." },
      { q: "This book is for ___.", options: ["her", "hers", "she"], answer: 0, explain: "Sau giới từ for dùng tân ngữ her." },
      { q: "Choose the correct sentence.", options: ["Please call he after school.", "Please call him after school.", "Please call his after school."], answer: 1, explain: "Sau động từ call dùng him." },
    ],
  },
  {
    id: 'a2-modals-obligation',
    level: 'A2',
    order: 8,
    title: 'Should, must và have to',
    titleEn: 'Should, Must and Have To',
    summary: 'Nói lời khuyên, nghĩa vụ và quy định bằng should, must, have to.',
    minutes: 9,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Động từ khuyết thiếu chỉ nghĩa vụ',
        body: 'Should dùng để khuyên nên làm gì. Must và have to dùng để nói việc bắt buộc. Cả ba đều đứng trước động từ nguyên mẫu không có to và không đổi theo chủ ngữ.',
        formula: 'S + should / must + V  ·  S + have to + V',
        examples: [
          { en: 'You should drink more water.', vi: 'Bạn nên uống nhiều nước hơn.', mark: 'should drink' },
          { en: 'You must wear a seatbelt.', vi: 'Bạn phải thắt dây an toàn.', mark: 'must wear' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Mức độ bắt buộc',
        body: 'Should là nên, mang tính khuyên. Must là phải, thể hiện ý kiến của người nói. Have to là phải, thường theo quy định hoặc hoàn cảnh bên ngoài.',
        bullets: ['Should: You should see a doctor.', 'Must: I must finish this today.', 'Have to: We have to wear uniforms at school.'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Have to với he, she, it',
        body: 'Với he, she, it đổi have to thành has to. Quá khứ là had to, không đổi theo chủ ngữ.',
        examples: [
          { en: 'She has to work on Saturday.', vi: 'Cô ấy phải làm việc vào thứ Bảy.', mark: 'has to work' },
          { en: 'We had to wait an hour.', vi: 'Chúng tôi phải đợi một tiếng.', mark: 'had to wait' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Mustn\'t và don\'t have to',
        body: "Mustn't là cấm: không được làm. Don't have to là không cần thiết: không phải làm. Shouldn't là không nên.",
        examples: [
          { en: "You mustn't smoke here.", vi: 'Bạn không được hút thuốc ở đây.', mark: "mustn't smoke" },
          { en: "You don't have to pay now.", vi: 'Bạn không cần trả tiền ngay bây giờ.', mark: "don't have to" },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là thêm -s vào must, và nhầm mustn\'t với lời khuyên.',
        mistakes: [
          { wrong: 'He musts go now.', right: 'He must go now.', why: 'Must không thêm -s.' },
          { wrong: "You mustn't wear a coat, it's cold.", right: "You should wear a coat, it's cold.", why: 'Trời lạnh là lời khuyên, không phải cấm.' },
        ],
      },
    ],
    quiz: [
      { q: "You ___ see a doctor if you feel sick.", options: ["have", "should", "musts"], answer: 1, explain: "Should dùng để khuyên." },
      { q: "She ___ get up early for school every day.", options: ["must to", "has must", "has to"], answer: 2, explain: "Với she, have to đổi thành has to." },
      { q: "You ___ smoke in this building. It is forbidden.", options: ["mustn't", "don't have to", "should to"], answer: 0, explain: "Mustn't diễn tả điều bị cấm." },
      { q: "We ___ bring lunch. The school provides it.", options: ["mustn't", "don't have to", "shouldn't have"], answer: 1, explain: "Don't have to nghĩa là không cần thiết." },
      { q: "Choose the correct sentence.", options: ["I musted leave early yesterday.", "I have to left early yesterday.", "I had to leave early yesterday."], answer: 2, explain: "Quá khứ của have to là had to, đi với động từ nguyên mẫu." },
    ],
  },
  ...A2_GRAMMAR_EXTRA,
];
