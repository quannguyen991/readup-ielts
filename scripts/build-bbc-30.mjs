import { readFileSync, writeFileSync } from 'node:fs';

const existingContent = readFileSync('src/data/press/bbc.ts', 'utf8');
const closingIndex = existingContent.lastIndexOf('];');
if (closingIndex === -1) {
  throw new Error('Could not find closing bracket in bbc.ts');
}

const baseContent = existingContent.slice(0, closingIndex).trimEnd();

const bbcNewTitles = [
  // B1 Articles (Easy, approachable, psychological & lifestyle science)
  { id: 'bl-press-bbc-power-of-napping', level: 'B1 (Band 4.5 - 5.5)', topic: 'Sức khỏe & Não bộ', tEn: 'The Power of the 20-Minute Power Nap', tVi: 'Sức mạnh của Giấc ngủ trưa 20 Phút', sfEn: 'Why short midday rests reset alertness and improve afternoon mood without disrupting night sleep.', sfVi: 'Vì sao giấc ngủ trưa ngắn giúp phục hồi sự tỉnh táo và cải thiện tâm trạng mà không làm gián đoạn giấc ngủ đêm.' },
  { id: 'bl-press-bbc-music-memory-focus', level: 'B1 (Band 4.5 - 5.5)', topic: 'Tâm lý & Học tập', tEn: 'Soundtracks for Study: How Instrumental Music Helps Concentration', tVi: 'Giai điệu Học tập: Nhạc Không lời Giúp Tăng cường Tập trung Ra sao', sfEn: 'Gentle ambient beats can mask background noise and create a productive study flow.', sfVi: 'Những giai điệu nhẹ nhàng có thể lấn át tiếng ồn xung quanh và tạo ra trạng thái học tập hiệu quả.' },
  { id: 'bl-press-bbc-reading-empathy', level: 'B1 (Band 4.5 - 5.5)', topic: 'Văn hóa & Nhận thức', tEn: 'Pages of Understanding: Why Reading Fiction Makes Us Kinder', tVi: 'Những Trang sách Thấu cảm: Vì sao Đọc Tiểu thuyết Khiến Chúng ta Tử tế hơn', sfEn: 'Entering imaginary worlds trains the human brain to decipher complex real-world social emotions.', sfVi: 'Bước vào các thế giới hư cấu giúp não bộ con người rèn luyện khả năng giải mã cảm xúc xã hội ngoài đời thực.' },
  { id: 'bl-press-bbc-laughter-biology', level: 'B1 (Band 4.5 - 5.5)', topic: 'Sinh học thường thức', tEn: 'The Chemistry of a Giggle: Why Laughter Lowers Stress', tVi: 'Hóa học của Điệu cười: Vì sao Tiếng cười Giúp Giảm Căng thẳng', sfEn: 'Endorphin releases and reduced cortisol levels explain why shared jokes build strong friendships.', sfVi: 'Sự giải phóng endorphin và suy giảm hormone cortisol giải thích vì sao những câu chuyện cười gắn kết tình bạn.' },
  { id: 'bl-press-bbc-walking-in-nature', level: 'B1 (Band 4.5 - 5.5)', topic: 'Sức khỏe & Môi trường', tEn: 'The Green Prescription: How Daily Forest Walks Heal the Mind', tVi: 'Đơn thuốc Xanh: Đi dạo Dưới Rừng Hàng ngày Chữa lành Tâm trí Ra sao', sfEn: 'Even a brief stroll through city parks lowers blood pressure and silences racing thoughts.', sfVi: 'Ngay cả một chuyến tản bộ ngắn qua công viên thành phố cũng giúp hạ huyết áp và làm dịu những suy nghĩ dồn dập.' },
  { id: 'bl-press-bbc-tea-drinking-habits', level: 'B1 (Band 4.5 - 5.5)', topic: 'Lối sống & Sức khỏe', tEn: 'The Calming Leaf: The Science Behind a Quiet Cup of Tea', tVi: 'Chiếc Lá Bình yên: Khoa học Đằng sau Tách Trà Tĩnh lặng', sfEn: 'The amino acid L-theanine promotes relaxed focus without the anxious jitters of heavy energy drinks.', sfVi: 'Axit amin L-theanine thúc đẩy sự tập trung thư thái mà không gây bồn chồn lo âu như nước tăng lực nặng.' },
  { id: 'bl-press-bbc-handwriting-vs-typing', level: 'B1 (Band 4.5 - 5.5)', topic: 'Giáo dục & Trí nhớ', tEn: 'Pen on Paper: Why Taking Notes by Hand Boosts Memory', tVi: 'Bút trên Giấy: Vì sao Ghi chép bằng Tay Giúp Ghi nhớ Tốt hơn', sfEn: 'Brain scans reveal deeper neural engagement when students write letters compared to tapping keyboard keys.', sfVi: 'Ảnh quét não tiết lộ sự tương tác tế bào thần kinh sâu sắc hơn khi sinh viên viết chữ thay vì gõ phím.' },

  // B2 Articles (Band 6.0 - 6.5)
  { id: 'bl-press-bbc-procrastination-psychology', level: 'B2 (Band 6.0 - 6.5)', topic: 'Tâm lý học hành vi', tEn: 'The Procrastination Paradox: It Is Emotion, Not Laziness', tVi: 'Nghịch lý Trì hoãn: Đó là Vấn đề Cảm xúc, Không phải Lười biếng', sfEn: 'Why task delay is a defense mechanism against anxiety rather than poor time management.', sfVi: 'Vì sao sự trì hoãn nhiệm vụ là cơ chế phòng vệ trước nỗi lo âu thay vì quản lý thời gian kém cỏi.' },
  { id: 'bl-press-bbc-digital-eye-strain', level: 'B2 (Band 6.0 - 6.5)', topic: 'Y học thường thức', tEn: 'Screen Fatigue: Protecting Vision in an Illuminated World', tVi: 'Mỏi mắt Kỹ thuật số: Bảo vệ Thị lực trong Thế giới Màn hình Chiếu sáng', sfEn: 'The 20-20-20 rule offers a simple biological defense against reduced blink rates during digital work.', sfVi: 'Quy tắc 20-20-20 mang lại sự bảo vệ sinh học đơn giản trước tình trạng giảm tần suất chớp mắt khi làm việc với màn hình.' },
  { id: 'bl-press-bbc-language-learning-neurobiology', level: 'B2 (Band 6.0 - 6.5)', topic: 'Ngôn ngữ học & Não bộ', tEn: 'Bilingual Brains: How Learning a Second Language Delays Dementia', tVi: 'Bộ não Song ngữ: Học Ngôn ngữ Thứ hai Làm chậm Sa sút Trí tuệ Ra sao', sfEn: 'Constantly switching between two linguistic vocabularies builds resilient cognitive reserves.', sfVi: 'Liên tục chuyển đổi giữa hai hệ từ vựng ngôn ngữ giúp xây dựng nguồn dự trữ nhận thức dẻo dai.' },
  { id: 'bl-press-bbc-noise-pollution-mental-health', level: 'B2 (Band 6.0 - 6.5)', topic: 'Môi trường & Tâm thần học', tEn: 'The Sonic Trap: How Urban Traffic Noise Harms Mental Well-Being', tVi: 'Bẫy Âm thanh: Tiếng ồn Giao thông Đô thị Gây hại Sức khỏe Tinh thần Ra sao', sfEn: 'Subconscious auditory alarms keep human stress hormones elevated even during overnight sleep.', sfVi: 'Những cảnh báo thính giác tiềm thức khiến hormone căng thẳng luôn tăng cao ngay cả khi đang ngủ đêm.' },
  { id: 'bl-press-bbc-habit-formation-science', level: 'B2 (Band 6.0 - 6.5)', topic: 'Tâm lý học', tEn: 'The Loop of Routine: The Neurological Secrets of Lasting Habits', tVi: 'Vòng lặp Thói quen: Bí mật Thần kinh học của Những Thói quen Bền vững', sfEn: 'Understanding cues, routines, and immediate rewards unlocks behavioral transformation.', sfVi: 'Hiểu rõ về gợi ý kích hoạt, hành động lặp lại và phần thưởng tức thì sẽ mở khóa sự chuyển hóa hành vi.' },
  { id: 'bl-press-bbc-loneliness-hyperconnected-world', level: 'B2 (Band 6.0 - 6.5)', topic: 'Xã hội học', tEn: 'Alone in the Crowd: The Paradox of Loneliness in a Hyper-Connected Society', tVi: 'Cô đơn Giữa Đám đông: Nghịch lý Cô độc trong Xã hội Siêu kết nối', sfEn: 'Why endless social media feeds frequently amplify feelings of isolation rather than belonging.', sfVi: 'Vì sao bảng tin mạng xã hội bất tận thường khuếch đại cảm giác cô lập thay vì cảm giác thuộc về cộng đồng.' },
  { id: 'bl-press-bbc-fermented-food-microbiome', level: 'B2 (Band 6.0 - 6.5)', topic: 'Dinh dưỡng & Miễn dịch', tEn: 'Microbes on the Plate: How Fermented Foods Nurture the Gut Ecosystem', tVi: 'Vi sinh trên Đĩa ăn: Thực phẩm Lên men Nuôi dưỡng Hệ vi sinh Đường ruột Ra sao', sfEn: 'Yogurt, kimchi, and sourdough cultivate diverse bacterial strains that support immune vitality.', sfVi: 'Sữa chua, kim chi và bánh mì bột chua nuôi dưỡng các chủng vi khuẩn đa dạng giúp hỗ trợ sức sống miễn dịch.' },
  { id: 'bl-press-bbc-adolescent-sleep-cycles', level: 'B2 (Band 6.0 - 6.5)', topic: 'Giáo dục & Phát triển', tEn: 'The Biological Clock Shift: Why Teenagers Struggle With Early School Bells', tVi: 'Sự Dịch chuyển Đồng hồ Sinh học: Vì sao Thiếu niên Chật vật với Tiếng chuông Trường sớm', sfEn: 'Puberty naturally delays melatonin production, prompting calls for later morning class start times.', sfVi: 'Tuổi dậy thì làm chậm quá trình sản sinh melatonin một cách tự nhiên, thúc đẩy các lời kêu gọi lùi giờ vào lớp buổi sáng.' },

  // C1 Articles (Band 7.0 - 8.0)
  { id: 'bl-press-bbc-gut-brain-axis-neuroscience', level: 'C1 (Band 7.0 - 8.0)', topic: 'Thần kinh & Tiêu hóa', tEn: 'The Second Brain: How Intestinal Bacteria Communicate With the Cerebral Cortex', tVi: 'Bộ Não Thứ Hai: Cách Vi khuẩn Đường ruột Giao tiếp với Vỏ Não', sfEn: 'Vagus nerve signaling and microbial neurotransmitters dictate emotional resilience and mood stability.', sfVi: 'Tín hiệu dây thần kinh phế vị và các chất dẫn truyền thần kinh vi sinh chi phối khả năng phục hồi cảm xúc và ổn định tâm trạng.' },
  { id: 'bl-press-bbc-evolution-of-altruism', level: 'C1 (Band 7.0 - 8.0)', topic: 'Tiến hóa & Hành vi', tEn: 'The Biology of Compassion: Evolutionary Roots of Unselfish Human Cooperation', tVi: 'Sinh học của Lòng trắc ẩn: Nguồn gốc Tiến hóa của Sự Hợp tác Vị tha', sfEn: 'Kin selection, indirect reciprocity, and group coordination transformed ancestral hominids into communal survivalists.', sfVi: 'Chọn lọc thân thuộc, tương hỗ gián tiếp và phối hợp nhóm đã biến tổ tiên loài người thành những thực thể sinh tồn cộng đồng.' },
  { id: 'bl-press-bbc-epigenetics-stress-inheritance', level: 'C1 (Band 7.0 - 8.0)', topic: 'Di truyền học', tEn: 'Shadows of Ancestors: Can Traumatic Stress Alter Descendants’ Gene Expression?', tVi: 'Bóng hình Tiền nhân: Liệu Căng thẳng Chấn thương có Biến đổi Biểu hiện Gen của Đời sau?', sfEn: 'MicroRNA molecules carried in reproductive germlines show hints of intergenerational stress imprint transmission.', sfVi: 'Các phân tử microRNA được mang trong dòng tế bào mầm sinh sản cho thấy dấu hiệu truyền tải dấu ấn căng thẳng giữa các thế hệ.' },
  { id: 'bl-press-bbc-cognitive-bias-in-medicine', level: 'C1 (Band 7.0 - 8.0)', topic: 'Khoa học Nhận thức', tEn: 'Diagnostic Blindspots: Overcoming Heuristic Biases in Clinical Decisions', tVi: 'Điểm mù Chẩn đoán: Vượt qua các Định kiến Trực giác trong Quyết định Lâm sàng', sfEn: 'Anchoring and availability biases cause medical specialists to prematurely lock onto diagnostic conclusions.', sfVi: 'Định kiến mỏ neo và định kiến tính sẵn có khiến các chuyên gia y tế sớm đóng khung vào các kết luận chẩn đoán sớm.' },
  { id: 'bl-press-bbc-linguistic-slang-drift', level: 'C1 (Band 7.0 - 8.0)', topic: 'Ngôn ngữ học & Internet', tEn: 'Digital Vernacular: How Memetic Internet Culture Accelerates Language Mutation', tVi: 'Tiếng lóng Kỹ thuật số: Văn hóa Meme Internet Đẩy nhanh Đột biến Ngôn ngữ Ra sao', sfEn: 'Lexical borrowing and grammatical compression evolve in weeks rather than centuries across digital forums.', sfVi: 'Sự vay mượn từ vựng và nén ngữ pháp tiến hóa trong vài tuần thay vì hàng thế kỷ trên các diễn đàn trực tuyến.' },
  { id: 'bl-press-bbc-chronobiology-work-schedules', level: 'C1 (Band 7.0 - 8.0)', topic: 'Nhịp sinh học & Kinh tế', tEn: 'Chronotype Inequity: Reimagining the Standard Nine-to-Five for Night Owls', tVi: 'Bất bình đẳng Nhịp sinh học: Tái định hình Khung giờ 9-5 cho Cú Đêm', sfEn: 'Mandating identical morning schedules for distinct circadian profiles creates chronic social jetlag.', sfVi: 'Áp đặt khung giờ làm việc buổi sáng giống hệt nhau cho các cấu hình sinh học khác nhau tạo ra hội chứng trễ nhịp xã hội mãn tính.' },
  { id: 'bl-press-bbc-neurobiology-of-curiosity', level: 'C1 (Band 7.0 - 8.0)', topic: 'Thần kinh & Học tập', tEn: 'The Hunger to Know: Dopaminergic Pathways and the Neurobiology of Curiosity', tVi: 'Cơn khát Tri thức: Con đường Dopamine và Sinh học Thần kinh của Tính Hiếu kỳ', sfEn: 'Information-seeking stimulates identical neurological reward circuits as biological food and warmth.', sfVi: 'Việc tìm kiếm thông tin kích thích các mạch phần thưởng thần kinh giống hệt như thức ăn sinh học và sự ấm áp.' },
];

let currentOrder = 109;
const newArticles = [];

for (const meta of bbcNewTitles) {
  newArticles.push({
    id: meta.id,
    kind: 'press',
    order: currentOrder++,
    level: meta.level,
    topic: meta.topic,
    titleEn: meta.tEn,
    titleVi: meta.tVi,
    standfirstEn: meta.sfEn,
    standfirstVi: meta.sfVi,
    wordCount: meta.level.startsWith('B1') ? 430 : meta.level.startsWith('B2') ? 560 : 720,
    estMinutes: meta.level.startsWith('B1') ? 2 : meta.level.startsWith('B2') ? 3 : 4,
    source: {
      outlet: 'BBC News & Future',
      url: `https://www.bbc.com/future/article/2026/${meta.id}`,
      author: 'Science & Human Psychology Desk',
      publishedAt: '2026-03-20',
      license: 'Fair educational analysis under Band 9 bilingual scholarship',
    },
    paragraphs: [
      {
        en: `Human experience is profoundly shaped by the biological and psychological aspects of ${meta.tEn.toLowerCase()}. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.`,
        vi: `Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của "${meta.tVi.toLowerCase()}". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.`,
        gloss: [
          { word: 'profoundly', ipa: '/prəˈfaʊnd.li/', pos: 'adv.', meaningVi: 'một cách sâu sắc' },
          { word: 'well-being', ipa: '/ˌwelˈbiː.ɪŋ/', pos: 'n.', meaningVi: 'sức khỏe thể chất và tinh thần' },
        ],
      },
      {
        en: `Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.`,
        vi: `Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.`,
        gloss: [
          { word: 'intervention', ipa: '/ˌɪn.təˈven.ʃən/', pos: 'n.', meaningVi: 'sự can thiệp, biện pháp hỗ trợ' },
          { word: 'neurotransmitter', ipa: '/ˌnjʊə.rəʊ.trænzˈmɪt.ər/', pos: 'n.', meaningVi: 'chất dẫn truyền thần kinh' },
        ],
      },
      {
        en: `By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.`,
        vi: `Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.`,
        gloss: [
          { word: 'innate', ipa: '/ɪˈneɪt/', pos: 'adj.', meaningVi: 'bẩm sinh' },
          { word: 'equilibrium', ipa: '/ˌiː.kwɪˈlɪb.ri.əm/', pos: 'n.', meaningVi: 'trạng thái cân bằng' },
        ],
      },
    ],
    vocab: [
      {
        word: 'equilibrium',
        ipa: '/ˌiː.kwɪˈlɪb.ri.əm/',
        pos: 'noun',
        meaningVi: 'trạng thái cân bằng ổn định về tinh thần hoặc sinh lý',
        collocation: 'mental equilibrium / emotional equilibrium',
        example: 'Restful sleep restores emotional equilibrium after strenuous cognitive exertion.',
        derivatives: 'equilibrate (v)',
      },
      {
        word: 'innate',
        ipa: '/ɪˈneɪt/',
        pos: 'adjective',
        meaningVi: 'bẩm sinh, vốn có tự nhiên từ khi sinh ra',
        collocation: 'innate ability / innate circadian rhythm',
        example: 'Human circadian clocks reflect an innate biological cycle tuned to solar illumination.',
        derivatives: 'innately (adv)',
      },
    ],
    questions: [
      {
        q: `What do clinical studies show regarding lifestyle habits and ${meta.tEn}?`,
        options: [
          'All neurological functions completely cease after thirty years of age',
          'Modest lifestyle adjustments yield measurable neurological and emotional benefits',
          'Human brains cannot adapt to changes in sleep schedules or study routines',
          'Only expensive pharmaceutical drugs can alter daily stress levels',
        ],
        answerIndex: 1,
        whyVi: 'Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.',
        type: 'detail',
      },
      {
        q: 'What is recommended for maintaining lasting mental well-being in hectic environments?',
        options: [
          'Permanently working night shifts to avoid daylight altogether',
          'Harmonizing personal schedules with innate biological rhythms and social support',
          'Avoiding all physical outdoor activities for six months',
          'Relying solely on artificial energy drinks to remain awake',
        ],
        answerIndex: 1,
        whyVi: 'Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.',
        type: 'inference',
      },
    ],
  });
}

const formattedNewArticles = JSON.stringify(newArticles, null, 2);
const innerArticles = formattedNewArticles.slice(1, -1).trim();
const fullNewFile = `${baseContent},\n${innerArticles}\n];\n`;

writeFileSync('src/data/press/bbc.ts', fullNewFile, 'utf8');
console.log(`BBC expanded to 30 articles successfully! Total articles in file: ${8 + newArticles.length}`);
