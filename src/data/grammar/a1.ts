import type { GrammarLessonDetail } from './types';
import { A1_GRAMMAR_EXTRA } from './a1-2';

/** Cấp A1. Bài đầu tiên đặt khuôn trình bày cho các bài sau. */
export const A1_GRAMMAR: GrammarLessonDetail[] = [
  {
    id: 'a1-to-be',
    level: 'A1',
    order: 1,
    title: 'Động từ TO BE (am/is/are)',
    titleEn: 'Verb TO BE',
    summary: 'Nói được bạn là ai, ở đâu, thế nào bằng am/is/are.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Động từ TO BE là gì?',
        body: 'Muốn nói "tôi LÀ ai", "ai đó Ở đâu" hay "ai đó THẾ NÀO", tiếng Anh cần am, is hoặc are, ba dạng của cùng một động từ to be. Chủ ngữ quyết định dùng dạng nào.',
        examples: [
          { en: 'I am at home today.', vi: 'Hôm nay tôi ở nhà.', mark: 'am' },
          { en: 'My mum is a nurse.', vi: 'Mẹ tôi là y tá.', mark: 'is' },
          { en: "My friends aren't at school today.", vi: 'Hôm nay các bạn tôi không ở trường.', mark: "aren't" },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Dùng TO BE để làm gì?',
        body: 'Dùng TO BE khi giới thiệu, mô tả hoặc nói nơi chốn. Trong câu, be đứng ngay sau chủ ngữ.',
        bullets: [
          'Giới thiệu tên, nghề, quốc tịch: I am Lan. She is a teacher.',
          'Mô tả: The room is big. They are tired.',
          'Nói vị trí: He is in the kitchen.',
        ],
      },
      {
        label: 'Quy tắc 1',
        title: 'Chọn am, is hay are theo chủ ngữ',
        body: 'I đi với am. He, she, it và danh từ số ít đi với is. You, we, they và danh từ số nhiều đi với are.',
        formula: 'I + am  ·  He / She / It + is  ·  You / We / They + are',
        examples: [
          { en: 'I am ready.', vi: 'Tôi sẵn sàng rồi.', mark: 'am' },
          { en: 'It is cold.', vi: 'Trời lạnh.', mark: 'is' },
          { en: 'We are friends.', vi: 'Chúng tôi là bạn.', mark: 'are' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Sau TO BE là gì?',
        body: 'Sau TO BE có thể là danh từ (a doctor), tính từ (happy) hoặc cụm chỉ nơi chốn (at school). Không thêm động từ khác.',
        formula: 'S + am / is / are + danh từ / tính từ / nơi chốn',
        examples: [
          { en: 'She is a doctor.', vi: 'Cô ấy là bác sĩ.', mark: 'a doctor' },
          { en: 'They are happy.', vi: 'Họ vui.', mark: 'happy' },
          { en: 'The keys are on the table.', vi: 'Chìa khoá ở trên bàn.', mark: 'on the table' },
        ],
      },
      {
        label: 'Quy tắc 3',
        title: 'Viết tắt khi nói chuyện',
        body: "Khi nói hoặc viết thân mật, rút gọn chủ ngữ với be: I'm, you're, he's, she's, it's, we're, they're. Phủ định thêm not: isn't, aren't.",
        examples: [
          { en: "I'm from Vietnam.", vi: 'Tôi đến từ Việt Nam.', mark: "I'm" },
          { en: "He's my brother.", vi: 'Anh ấy là anh trai tôi.', mark: "He's" },
          { en: "We aren't late.", vi: 'Chúng tôi không đến muộn.', mark: "aren't" },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Ba lỗi phổ biến nhất',
        body: 'Người mới học thường quên động từ be trước tính từ, hoặc chọn sai dạng.',
        mistakes: [
          { wrong: 'She happy.', right: 'She is happy.', why: 'Tiếng Anh luôn cần be trước tính từ, khác với tiếng Việt.' },
          { wrong: 'I is a student.', right: 'I am a student.', why: 'I luôn đi với am.' },
          { wrong: 'They is at home.', right: 'They are at home.', why: 'Chủ ngữ số nhiều dùng are.' },
        ],
      },
    ],
    quiz: [
      { q: "I ___ at home.", options: ["am", "is", "are"], answer: 0, explain: "Chủ ngữ I đi với am." },
      { q: "She ___ a teacher.", options: ["am", "is", "are"], answer: 1, explain: "She là số ít nên dùng is." },
      { q: "We ___ friends.", options: ["is", "am", "are"], answer: 2, explain: "We là số nhiều nên dùng are." },
      { q: "Chọn câu đúng.", options: ["He is tired.", "He tired.", "He are tired."], answer: 0, explain: "Trước tính từ cần be, và he đi với is." },
      { q: "Dạng viết tắt của \"They are\" là:", options: ["Theyre", "They're", "They'is"], answer: 1, explain: "They are rút gọn thành They're." },
    ],
  },
  {
    id: 'a1-have-got',
    level: 'A1',
    order: 2,
    title: 'Động từ HAVE GOT (có)',
    titleEn: 'Have Got',
    summary: 'Nói về những thứ bạn có hoặc không có bằng have got.',
    minutes: 7,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Have got là gì?',
        body: 'Have got nghĩa là "có", dùng để nói về sở hữu, người thân hoặc đặc điểm. Nghĩa giống have nhưng thân mật hơn và rất phổ biến trong tiếng Anh Anh.',
        examples: [
          { en: 'I have got a new bike.', vi: 'Tôi có một chiếc xe đạp mới.', mark: 'have got' },
          { en: 'She has got two brothers.', vi: 'Cô ấy có hai anh trai.', mark: 'has got' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Khi nào dùng have got?',
        body: 'Dùng để nói về sở hữu, người thân, đồ vật hoặc triệu chứng bệnh.',
        bullets: ['Sở hữu: We have got a car.', 'Gia đình: He has got a sister.', 'Triệu chứng: I have got a headache.'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Chọn have hay has',
        body: 'I, you, we, they đi với have got. He, she, it đi với has got.',
        formula: 'I / You / We / They + have got  ·  He / She / It + has got',
        examples: [
          { en: 'You have got a nice smile.', vi: 'Bạn có nụ cười đẹp.', mark: 'have got' },
          { en: 'The house has got a big garden.', vi: 'Căn nhà đó có một khu vườn lớn.', mark: 'has got' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Phủ định và câu hỏi',
        body: "Phủ định: thêm not sau have hoặc has, viết tắt là haven't got, hasn't got. Câu hỏi: đưa have hoặc has lên đầu câu.",
        formula: "S + haven't / hasn't got…  ·  Have / Has + S + got…?",
        examples: [
          { en: "We haven't got any milk.", vi: 'Chúng tôi không có sữa.', mark: "haven't got" },
          { en: 'Has she got a pen?', vi: 'Cô ấy có bút không?', mark: 'Has she got' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Ba lỗi hay gặp',
        body: 'Lỗi thường gặp là dùng sai dạng have hoặc has, hoặc đặt not sai chỗ.',
        mistakes: [
          { wrong: 'He have got a car.', right: 'He has got a car.', why: 'He là ngôi số ít nên dùng has.' },
          { wrong: 'I not have got a dog.', right: "I haven't got a dog.", why: 'Not gắn vào have: haven\'t got.' },
          { wrong: 'Have she got a pen?', right: 'Has she got a pen?', why: 'Với she dùng has ở đầu câu hỏi.' },
        ],
      },
    ],
    quiz: [
      { q: "We ___ got two cats.", options: ["has", "have", "having"], answer: 1, explain: "We là số nhiều nên dùng have got." },
      { q: "My brother ___ got a new laptop.", options: ["have", "is", "has"], answer: 2, explain: "My brother là ngôi thứ ba số ít nên dùng has got." },
      { q: "She ___ got any money.", options: ["hasn't", "haven't", "isn't"], answer: 0, explain: "She là số ít nên phủ định là hasn't got." },
      { q: "Have you ___ a ticket?", options: ["get", "got", "getting"], answer: 1, explain: "Sau have là got trong cấu trúc have got." },
      { q: "Choose the correct sentence.", options: ["They has got a big house.", "They have got a big houses.", "They have got a big house."], answer: 2, explain: "They đi với have; house số ít sau a." },
    ],
  },
  {
    id: 'a1-possessives',
    level: 'A1',
    order: 3,
    title: 'Tính từ và đại từ sở hữu',
    titleEn: 'Possessive Adjectives and Pronouns',
    summary: 'Chỉ rõ đồ vật thuộc về ai bằng my, your, his, her…',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Tính từ sở hữu là gì?',
        body: 'Tính từ sở hữu đứng trước danh từ để chỉ đồ vật thuộc về ai. Dạng của chúng không đổi theo danh từ đi sau.',
        formula: 'my · your · his · her · its · our · their',
        examples: [
          { en: 'This is my book.', vi: 'Đây là quyển sách của tôi.', mark: 'my' },
          { en: 'Their house is near the park.', vi: 'Nhà của họ gần công viên.', mark: 'Their' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Ai thuộc về ai?',
        body: 'Dùng để nói về đồ vật, người thân hoặc bộ phận cơ thể của ai đó.',
        bullets: ['Đồ vật: your phone, our car', 'Người thân: his sister, her father', 'Cơ thể: My hands are cold.'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Chọn his hay her theo người sở hữu',
        body: 'Chọn his khi người sở hữu là nam, her khi người sở hữu là nữ. Không chọn theo đồ vật được nói đến.',
        examples: [
          { en: 'Anna lost her keys.', vi: 'Anna làm mất chìa khoá của cô ấy.', mark: 'her' },
          { en: 'Tom forgot his bag.', vi: 'Tom quên cặp của anh ấy.', mark: 'his' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Đại từ sở hữu đứng một mình',
        body: 'Đại từ sở hữu (mine, yours, his, hers, ours, theirs) đứng một mình, thay cho cả cụm tính từ sở hữu và danh từ, nên không đi kèm danh từ nữa.',
        formula: 'my book → mine  ·  your car → yours',
        examples: [
          { en: 'This pen is mine.', vi: 'Cây bút này là của tôi.', mark: 'mine' },
          { en: 'Is that bag yours?', vi: 'Cái túi kia là của bạn à?', mark: 'yours' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là nhầm its với it\'s, hoặc dùng mine trước danh từ.',
        mistakes: [
          { wrong: "The dog wagged it's tail.", right: 'The dog wagged its tail.', why: "its là sở hữu; it's là viết tắt của it is." },
          { wrong: 'This is mine book.', right: 'This is my book.', why: 'Khi đứng trước danh từ dùng my; mine đứng một mình.' },
        ],
      },
    ],
    quiz: [
      { q: "This is ___ bag.", options: ["mine", "me", "my"], answer: 2, explain: "Trước danh từ bag dùng tính từ sở hữu my." },
      { q: "Is this pen ___?", options: ["yours", "your", "you"], answer: 0, explain: "Đứng một mình ở cuối câu dùng đại từ sở hữu yours." },
      { q: "The cat is in ___ basket.", options: ["it", "its", "it's"], answer: 1, explain: "its là tính từ sở hữu của it; it's là it is." },
      { q: "Lan forgot ___ homework.", options: ["hers", "his", "her"], answer: 2, explain: "Lan là nữ, trước danh từ homework dùng her." },
      { q: "Choose the correct sentence.", options: ["They sold our car.", "They sold ours car.", "They sold mine car."], answer: 0, explain: "Ours là đại từ, không đứng trước danh từ car." },
    ],
  },
  {
    id: 'a1-articles',
    level: 'A1',
    order: 4,
    title: 'Mạo từ a, an, the',
    titleEn: 'Articles: A, An, The',
    summary: 'Biết khi nào dùng a, an, the hoặc không dùng mạo từ.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Mạo từ là gì?',
        body: 'Mạo từ là từ nhỏ đứng trước danh từ. A và an nghĩa là "một" và đi với danh từ đếm được số ít. The nghĩa là "cái, con, người đó" khi người nghe đã biết đang nói tới cái gì.',
        examples: [
          { en: 'I have a dog.', vi: 'Tôi có một con chó.', mark: 'a dog' },
          { en: 'The dog is black.', vi: 'Con chó đó màu đen.', mark: 'The dog' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'A hay an?',
        body: 'Dùng a trước âm phụ âm và an trước âm nguyên âm. Hãy nhìn âm đọc đầu tiên, không nhìn chữ cái.',
        bullets: ['a book, a university (đọc là /juː/)', 'an hour (h câm), an egg'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Dùng the khi đã xác định',
        body: 'Dùng the khi người nghe đã biết đối tượng đang nói tới, hoặc khi chỉ có một vật duy nhất.',
        examples: [
          { en: 'Please close the door.', vi: 'Làm ơn đóng cửa lại.', mark: 'the door' },
          { en: 'The sun rises in the east.', vi: 'Mặt trời mọc ở hướng đông.', mark: 'The sun' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Khi nào không dùng mạo từ?',
        body: 'Không dùng mạo từ khi nói chung về danh từ số nhiều hoặc không đếm được, và với tên riêng như tên người, tên nước, tên thành phố.',
        examples: [
          { en: 'Dogs are loyal animals.', vi: 'Chó là loài vật trung thành.', mark: 'Dogs' },
          { en: 'I like music.', vi: 'Tôi thích âm nhạc.', mark: 'music' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Ba lỗi hay gặp',
        body: 'Người học thường quên mạo từ trước danh từ số ít, hoặc thêm a vào danh từ số nhiều.',
        mistakes: [
          { wrong: 'She is teacher.', right: 'She is a teacher.', why: 'Danh từ đếm được số ít cần a hoặc an.' },
          { wrong: 'an university', right: 'a university', why: 'University bắt đầu bằng âm /juː/ nên dùng a.' },
          { wrong: 'I love a dogs.', right: 'I love dogs.', why: 'Danh từ số nhiều nói chung không cần a.' },
        ],
      },
    ],
    quiz: [
      { q: "She is ___ engineer.", options: ["an", "a", "the"], answer: 0, explain: "Engineer bắt đầu bằng nguyên âm nên dùng an." },
      { q: "Look at ___ moon tonight.", options: ["a", "the", "an"], answer: 1, explain: "Mặt trăng là duy nhất, đã xác định nên dùng the." },
      { q: "We need ___ umbrella.", options: ["a", "the", "an"], answer: 2, explain: "Umbrella bắt đầu bằng nguyên âm nên dùng an." },
      { q: "Lan lives in ___ Hanoi.", options: ["(không mạo từ)", "a", "the"], answer: 0, explain: "Tên thành phố không dùng mạo từ." },
      { q: "Choose the correct sentence.", options: ["She is a honest person.", "She is an honest person.", "She is honest an person."], answer: 1, explain: "Honest đọc với âm nguyên âm đầu nên dùng an." },
    ],
  },
  {
    id: 'a1-plural-nouns',
    level: 'A1',
    order: 5,
    title: 'Danh từ số nhiều',
    titleEn: 'Plural Nouns',
    summary: 'Chuyển danh từ số ít sang số nhiều đúng quy tắc, kể cả dạng bất quy tắc.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Số nhiều là gì?',
        body: 'Khi có hơn một người hoặc vật, danh từ đếm được phải ở dạng số nhiều, thường bằng cách thêm -s hoặc -es.',
        examples: [
          { en: 'I have two cats.', vi: 'Tôi có hai con mèo.', mark: 'cats' },
          { en: 'There are three buses.', vi: 'Có ba chiếc xe buýt.', mark: 'buses' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Dấu hiệu nhận biết',
        body: 'Dùng danh từ số nhiều sau số đếm lớn hơn một, và sau các từ như many, some, these, those.',
        bullets: ['two books, five students', 'many friends, some apples', 'these shoes, those cars'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Thêm -s hoặc -es',
        body: 'Đa số danh từ thêm -s. Danh từ tận cùng bằng s, ss, sh, ch, x hoặc z thêm -es. Danh từ tận cùng bằng phụ âm + y đổi y thành ies.',
        examples: [
          { en: 'The boxes are heavy.', vi: 'Những chiếc hộp này nặng.', mark: 'boxes' },
          { en: 'Her babies are asleep.', vi: 'Các em bé của cô ấy đang ngủ.', mark: 'babies' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Danh từ bất quy tắc',
        body: 'Một số danh từ đổi hẳn dạng số nhiều và cần học thuộc: man → men, woman → women, child → children, foot → feet, tooth → teeth, person → people.',
        examples: [
          { en: 'The children are playing outside.', vi: 'Bọn trẻ đang chơi ngoài trời.', mark: 'children' },
          { en: 'Three women came to the meeting.', vi: 'Ba người phụ nữ đến buổi họp.', mark: 'women' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là thêm -s vào danh từ bất quy tắc hoặc quên đổi f thành v.',
        mistakes: [
          { wrong: 'two childs', right: 'two children', why: 'Child là danh từ bất quy tắc.' },
          { wrong: 'five knifes', right: 'five knives', why: 'Knife đổi f thành v rồi thêm -es.' },
        ],
      },
    ],
    quiz: [
      { q: "There are two ___ on the table.", options: ["book", "books", "bookes"], answer: 1, explain: "Sau số hai dùng danh từ số nhiều: thêm -s." },
      { q: "Several ___ are waiting outside.", options: ["boxs", "boxies", "boxes"], answer: 2, explain: "Danh từ tận cùng bằng x thêm -es." },
      { q: "Five ___ visited the museum.", options: ["babies", "babys", "babyes"], answer: 0, explain: "Phụ âm + y đổi thành ies." },
      { q: "The ___ are very tall.", options: ["mans", "men", "mens"], answer: 1, explain: "Man là danh từ bất quy tắc, số nhiều là men." },
      { q: "Choose the correct sentence.", options: ["I have three sister.", "I have three sisteres.", "I have three sisters."], answer: 2, explain: "Sau số ba dùng sisters." },
    ],
  },
  {
    id: 'a1-there-is-are',
    level: 'A1',
    order: 6,
    title: 'There is và there are',
    titleEn: 'There Is and There Are',
    summary: 'Nói có cái gì ở đâu bằng there is hoặc there are.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'There is/are dùng để làm gì?',
        body: 'Dùng there is hoặc there are để nói có cái gì đó ở một nơi nào đó. Trong cấu trúc này không dùng he, she, it làm chủ ngữ.',
        formula: 'There is + danh từ số ít  ·  There are + danh từ số nhiều',
        examples: [
          { en: 'There is a bank near my house.', vi: 'Gần nhà tôi có một ngân hàng.', mark: 'There is' },
          { en: 'There are five chairs in the room.', vi: 'Trong phòng có năm cái ghế.', mark: 'There are' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Chọn is hay are',
        body: 'Chọn dạng động từ theo danh từ đứng sau there, không theo there. Danh từ đầu tiên sau there quyết định.',
        bullets: ['There is a pen on the desk.', 'There are two pens on the desk.', 'There is some milk in the fridge. (không đếm được: is)'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Phủ định và câu hỏi',
        body: 'Phủ định thêm not sau is hoặc are: there isn\'t, there aren\'t. Câu hỏi đưa is hoặc are lên trước there.',
        formula: 'Is there…?  ·  Are there…?',
        examples: [
          { en: "There isn't a problem.", vi: 'Không có vấn đề gì.', mark: "There isn't" },
          { en: 'Are there any questions?', vi: 'Có câu hỏi nào không?', mark: 'Are there' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Some và any',
        body: 'Dùng some trong câu khẳng định, any trong câu phủ định và câu hỏi, với danh từ số nhiều hoặc không đếm được.',
        examples: [
          { en: 'There are some apples in the bag.', vi: 'Trong túi có vài quả táo.', mark: 'some apples' },
          { en: 'Is there any water left?', vi: 'Còn nước không?', mark: 'any water' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là dùng have thay cho there is, hoặc chia sai is/are.',
        mistakes: [
          { wrong: 'There has a cat.', right: 'There is a cat.', why: 'Không dùng have; dùng there is hoặc there are.' },
          { wrong: 'There is two books.', right: 'There are two books.', why: 'Book số nhiều nên dùng are.' },
        ],
      },
    ],
    quiz: [
      { q: "There ___ a bus stop near here.", options: ["are", "am", "is"], answer: 2, explain: "Bus stop là danh từ số ít nên dùng is." },
      { q: "There ___ many people at the party.", options: ["are", "is", "be"], answer: 0, explain: "People là danh từ số nhiều nên dùng are." },
      { q: "___ there any eggs in the fridge?", options: ["Is", "Are", "Do"], answer: 1, explain: "Eggs số nhiều nên câu hỏi dùng Are." },
      { q: "There ___ some water on the table.", options: ["have", "are", "is"], answer: 2, explain: "Water không đếm được nên dùng is." },
      { q: "Choose the correct sentence.", options: ["There are two cups on the table.", "There has two cups on the table.", "There is two cups on the table."], answer: 0, explain: "Two cups là số nhiều nên dùng are." },
    ],
  },
  {
    id: 'a1-adverbs-frequency',
    level: 'A1',
    order: 7,
    title: 'Trạng từ chỉ tần suất',
    titleEn: 'Adverbs of Frequency',
    summary: 'Nói về thói quen hằng ngày bằng always, usually, sometimes, never.',
    minutes: 8,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Trạng từ tần suất là gì?',
        body: 'Trạng từ tần suất cho biết một việc xảy ra thường xuyên đến đâu: always, usually, often, sometimes, rarely, never.',
        examples: [
          { en: 'I always drink coffee in the morning.', vi: 'Buổi sáng tôi luôn uống cà phê.', mark: 'always' },
          { en: 'She sometimes walks to school.', vi: 'Thỉnh thoảng cô ấy đi bộ đến trường.', mark: 'sometimes' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Mức độ thường xuyên',
        body: 'Dùng để nói về thói quen. Từ mạnh nhất đến yếu nhất: always, usually, often, sometimes, rarely, never.',
        bullets: ['always: luôn luôn', 'usually: thường thường', 'often: thường', 'sometimes: thỉnh thoảng', 'rarely: hiếm khi', 'never: không bao giờ'],
      },
      {
        label: 'Quy tắc 1',
        title: 'Vị trí của trạng từ',
        body: 'Trạng từ tần suất đứng trước động từ thường, nhưng đứng sau động từ to be.',
        formula: 'S + trạng từ + V thường  ·  S + be + trạng từ',
        examples: [
          { en: 'We usually eat lunch at noon.', vi: 'Chúng tôi thường ăn trưa lúc 12 giờ.', mark: 'usually eat' },
          { en: 'He is always late.', vi: 'Anh ấy luôn đến muộn.', mark: 'always' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Never đã mang nghĩa phủ định',
        body: 'Never đã có nghĩa phủ định, nên không dùng thêm not trong cùng câu.',
        examples: [
          { en: 'My brother never cooks dinner.', vi: 'Anh trai tôi không bao giờ nấu bữa tối.', mark: 'never cooks' },
          { en: 'They never watch TV on weekdays.', vi: 'Các bạn ấy không bao giờ xem TV vào ngày thường.', mark: 'never watch' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là thêm be trước động từ thường, hoặc dùng not cùng never.',
        mistakes: [
          { wrong: 'I am usually go to school by bus.', right: 'I usually go to school by bus.', why: 'Với động từ thường không thêm be trước trạng từ.' },
          { wrong: "He doesn't never eat meat.", right: 'He never eats meat.', why: 'Never đã phủ định, không dùng thêm not.' },
        ],
      },
    ],
    quiz: [
      { q: "She ___ eats breakfast at 7 a.m.", options: ["always", "is always", "always is"], answer: 0, explain: "Trạng từ đứng trước động từ thường eats." },
      { q: "Tom ___ forgets his keys.", options: ["not never", "never", "doesn't never"], answer: 1, explain: "Never đã mang nghĩa phủ định." },
      { q: "My father is ___ at home on Sundays.", options: ["usuallys", "usual", "usually"], answer: 2, explain: "Trạng từ đứng sau be và trước giới từ at home." },
      { q: "We ___ watch movies on Friday night.", options: ["often", "are often", "often are"], answer: 0, explain: "Often đứng trước động từ thường watch." },
      { q: "Choose the correct sentence.", options: ["I am usually drink tea after dinner.", "I usually drink tea after dinner.", "I usually am drink tea after dinner."], answer: 1, explain: "Trạng từ đứng trước động từ thường, không thêm be." },
    ],
  },
  {
    id: 'a1-can-cant',
    level: 'A1',
    order: 8,
    title: 'Động từ khuyết thiếu CAN và CAN\'T',
    titleEn: "Can and Can't",
    summary: 'Nói về khả năng và việc không làm được bằng can và can\'t.',
    minutes: 7,
    steps: [
      {
        label: 'Định nghĩa',
        title: 'Can là gì?',
        body: 'Can nghĩa là "có thể" hoặc "biết cách làm". Can đứng trước động từ nguyên mẫu không có to, và không đổi theo chủ ngữ.',
        formula: 'S + can + V (nguyên mẫu)',
        examples: [
          { en: 'I can swim very well.', vi: 'Tôi bơi rất giỏi.', mark: 'can swim' },
          { en: 'She can speak three languages.', vi: 'Cô ấy nói được ba thứ tiếng.', mark: 'can speak' },
        ],
      },
      {
        label: 'Dùng khi nào',
        title: 'Khi nào dùng can?',
        body: 'Can dùng cho khả năng, xin phép và đề nghị giúp đỡ.',
        bullets: ['Khả năng: He can play the guitar.', 'Xin phép: Can I open the window?', 'Đề nghị: Can you help me?'],
      },
      {
        label: 'Quy tắc 1',
        title: "Can't là dạng phủ định",
        body: "Thêm not vào can để có can't (cannot). Can't đứng trước động từ nguyên mẫu.",
        examples: [
          { en: "I can't find my phone.", vi: 'Tôi không tìm thấy điện thoại.', mark: "can't find" },
          { en: 'They cannot come tonight.', vi: 'Tối nay họ không đến được.', mark: 'cannot come' },
        ],
      },
      {
        label: 'Quy tắc 2',
        title: 'Câu hỏi với can',
        body: 'Đưa can lên đầu câu để hỏi. Trả lời ngắn bằng Yes, I can hoặc No, I can\'t.',
        examples: [
          { en: 'Can you drive a car?', vi: 'Bạn có lái xe ô tô được không?', mark: 'Can you drive' },
          { en: 'Yes, I can.', vi: 'Vâng, tôi làm được.', mark: 'Yes, I can' },
        ],
      },
      {
        label: 'Lỗi hay mắc',
        title: 'Lỗi hay gặp',
        body: 'Lỗi phổ biến là thêm -s vào can, hoặc thêm to sau can.',
        mistakes: [
          { wrong: 'She cans swim.', right: 'She can swim.', why: 'Can không thêm -s với he, she, it.' },
          { wrong: 'I can to swim.', right: 'I can swim.', why: 'Sau can là động từ nguyên mẫu không có to.' },
        ],
      },
    ],
    quiz: [
      { q: "My brother ___ ride a bike.", options: ["cans", "can", "can to"], answer: 1, explain: "Can giữ nguyên dạng với ngôi thứ ba." },
      { q: "I ___ understand this question.", options: ["cannots", "don't can", "can't"], answer: 2, explain: "Phủ định của can là can't." },
      { q: "___ I open the window, please?", options: ["Can", "Am", "Do"], answer: 0, explain: "Câu hỏi với can đưa can lên đầu câu." },
      { q: "Q: Can you swim? A: Yes, I ___.", options: ["do", "can", "am"], answer: 1, explain: "Trả lời ngắn với can dùng Yes, I can." },
      { q: "Choose the correct sentence.", options: ["He cans speak Japanese.", "He can to speak Japanese.", "He can speak Japanese."], answer: 2, explain: "Can đi với động từ nguyên mẫu không có to." },
    ],
  },
  ...A1_GRAMMAR_EXTRA,
];
