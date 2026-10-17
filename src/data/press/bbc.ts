import type { BilingualArticle } from '../bilingual-repository';

export const BBC_ARTICLES: BilingualArticle[] = [
  {
    id: 'bl-press-bbc-cognitive-multitasking',
    kind: 'press',
    order: 209,
    level: 'C1 – C2 (Band 8.0 - 8.5)',
    topic: 'Khoa học & công nghệ',
    titleEn: 'The Cognitive Architecture of Attention: Why Human Multitasking Is a Neurological Illusion',
    titleVi: 'Cấu Trúc Nhận Thức của Sự Chú Ý: Vì Sao Đa Nhiệm ở Con Người là Ảo Tưởng Thần Kinh',
    standfirstEn: 'Neuroimaging reveals that juggling simultaneous tasks fractures executive function and depletes cognitive bandwidth.',
    standfirstVi: 'Chẩn đoán hình ảnh thần kinh hé lộ việc làm nhiều việc cùng lúc làm đứt gãy chức năng điều hành và cạn kiệt băng thông nhận thức.',
    wordCount: 790,
    estMinutes: 4,
    source: {
      outlet: 'BBC News & Future',
      url: 'https://www.bbc.com/future/article/20260412-the-myth-of-cognitive-multitasking',
      author: 'Neuroscience & Psychology Correspondent',
      publishedAt: '2026-04-12',
      license: 'Fair educational analysis under Band 9 bilingual scholarship',
    },
    paragraphs: [
      {
        en: 'In hyper-connected modern corporate workplaces, the capacity to multitask is frequently lauded as an essential hallmark of professional competence. Job applicants proudly highlight their ability to triage client correspondence, monitor algorithmic trading terminals, and participate in video teleconferences simultaneously. Yet functional magnetic resonance imaging (fMRI) studies conducted over the past decade paint an entirely different picture: the human prefrontal cortex is fundamentally incapable of concurrent cognitive processing.',
        vi: 'Tại các nơi làm việc hiện đại siêu kết nối, năng lực đa nhiệm thường được ca tụng như một dấu hiệu thiết yếu của năng lực chuyên môn. Các ứng viên xin việc tự hào nhấn mạnh khả năng vừa xử lý thư từ khách hàng, vừa theo dõi biểu đồ giao dịch thuật toán và vừa tham gia họp trực tuyến cùng một lúc. Thế nhưng các nghiên cứu chụp cộng hưởng từ chức năng (fMRI) trong thập kỷ qua lại vẽ nên một bức tranh hoàn toàn khác: vỏ não trước trán của con người về mặt bản chất là bất khả thi trong việc xử lý nhận thức song song đồng thời.',
        gloss: [
          { word: 'hallmark', ipa: '/ˈhɔːl.mɑːk/', pos: 'n.', meaningVi: 'dấu ấn đặc trưng, nét tiêu biểu' },
          { word: 'triage', ipa: '/ˈtriː.ɑːʒ/', pos: 'v.', meaningVi: 'phân loại ưu tiên xử lý' },
          { word: 'prefrontal cortex', ipa: '/ˌpriːˈfrʌn.təl ˈkɔː.teks/', pos: 'n.', meaningVi: 'vỏ não trước trán (trung tâm điều hành)' },
          { word: 'concurrent', ipa: '/kənˈkʌr.ənt/', pos: 'adj.', meaningVi: 'đồng thời, diễn ra cùng lúc' },
        ],
      },
      {
        en: 'What workers intuitively perceive as simultaneous execution is, in biological reality, rapid task-switching. Every abrupt transition incurs an inescapable physiological penalty known as "switch cost." The prefrontal brain must disengage from one complex rule architecture, suppress competing perceptual stimuli, and reconstruct an entirely fresh mental schema. These continuous micro-transitions flood the neural synapsis with cortisol, engendering mental exhaustion.',
        vi: 'Những gì người lao động cảm nhận một cách trực quan như việc thực thi đồng thời, thực tế về mặt sinh học chỉ là sự chuyển đổi tác vụ nhanh chóng. Mỗi bước chuyển đột ngột đều phải chịu một tổn thất sinh lý không thể tránh khỏi gọi là "chi phí chuyển đổi" (switch cost). Bộ não trước trán phải ngắt kết nối khỏi một cấu trúc quy tắc phức tạp, ức chế các kích thích tri giác cạnh tranh, và tái tạo lại một lược đồ tâm trí hoàn toàn mới. Những vi chuyển đổi liên tục này làm tràn ngập các khớp thần kinh bằng hormone căng thẳng cortisol, gây ra sự kiệt quệ tinh thần.',
        gloss: [
          { word: 'switch cost', ipa: '/swɪtʃ kɒst/', pos: 'n.', meaningVi: 'chi phí / hao tổn năng lượng khi đổi việc' },
          { word: 'disengage', ipa: '/ˌdɪs.ɪŋˈɡeɪdʒ/', pos: 'v.', meaningVi: 'ngắt kết nối, tách rời ra' },
          { word: 'schema', ipa: '/ˈskiː.mə/', pos: 'n.', meaningVi: 'lược đồ nhận thức, khuôn mẫu tư duy' },
          { word: 'synapse', ipa: '/ˈsaɪ.næps/', pos: 'n.', meaningVi: 'khớp nối thần kinh' },
        ],
      },
    ],
    vocab: [
      {
        word: 'hallmark',
        ipa: '/ˈhɔːl.mɑːk/',
        pos: 'n.',
        meaningVi: 'dấu hiệu đặc trưng, tiêu chuẩn vàng',
        collocation: 'a definitive / unmistakable hallmark',
        example: 'Deep sustained focus remains the true hallmark of transformative scholarship.',
        derivatives: 'hallmarks (pl.)',
      },
      {
        word: 'disengage',
        ipa: '/ˌdɪs.ɪŋˈɡeɪdʒ/',
        pos: 'v.',
        meaningVi: 'ngắt kết nối, tách ra khỏi sự chú ý',
        collocation: 'disengage from distracting stimuli',
        example: 'It takes considerable cognitive effort to disengage from emotionally charged notifications.',
        derivatives: 'disengagement (n.) · engage (antonym)',
      },
    ],
    questions: [
      {
        q: 'What actually occurs when an individual attempts to multitask complex cognitive duties?',
        options: [
          'The brain rapidly alternates between tasks, incurring measurable cognitive switch costs.',
          'The left hemisphere processes analytical work while the right hemisphere manages visual input.',
          'Memory capacity expands linearly with each additional task introduced.',
          'The prefrontal cortex enters a state of permanent neurogenesis.',
        ],
        answerIndex: 0,
        whyVi: 'Đoạn 2 nêu rõ: não bộ không làm việc song song mà chỉ chuyển đổi liên tục giữa các tác vụ (rapid task-switching) và phải trả giá bằng "switch cost".',
        type: 'Đọc hiểu suy luận',
      },
    ],
  },
  {
    id: 'bl-press-bbc-sleep-architecture',
    kind: 'press',
    order: 210,
    level: 'C1 – C2 (Band 8.0 - 8.5)',
    topic: 'Y tế & sức khoẻ',
    titleEn: 'The Glymphatic System: How Deep Sleep Flushes Neurological Toxins',
    titleVi: 'Hệ Thống Glymphatic: Cách Giấc Ngủ Sâu Đào Thải Độc Tố Thần Kinh',
    standfirstEn: 'Groundbreaking neuroscience reveals that slow-wave sleep acts as a biological night-shift sanitation crew for the human brain.',
    standfirstVi: 'Khoa học thần kinh đột phá tiết lộ giấc ngủ sóng chậm đóng vai trò như đội ngũ vệ sinh ca đêm cho não bộ con người.',
    wordCount: 780,
    estMinutes: 4,
    source: {
      outlet: 'BBC News & Future',
      url: 'https://www.bbc.com/future/article/20260315-glymphatic-brain-cleanse',
      author: 'Medical Science Unit',
      publishedAt: '2026-03-15',
      license: 'Fair educational analysis under Band 9 bilingual scholarship',
    },
    paragraphs: [
      {
        en: 'For centuries, evolutionary biologists puzzled over the existence of sleep. From a purely Darwinian survival perspective, rendering an animal unconscious and physically defenseless for eight hours each day appears to be an astonishing vulnerability. Only in the past decade have researchers deciphered sleep’s primary metabolic mandate: the activation of the glymphatic system.',
        vi: 'Suốt nhiều thế kỷ, các nhà sinh học tiến hóa đã băn khoăn về sự tồn tại của giấc ngủ. Đứng từ góc độ sinh tồn thuần túy của thuyết Darwin, việc khiến một con vật rơi vào trạng thái bất tỉnh và hoàn toàn không có khả năng tự vệ trong 8 tiếng mỗi ngày dường như là một điểm yếu chí tử. Chỉ trong thập kỷ qua, các nhà nghiên cứu mới giải mã được nhiệm vụ trao đổi chất cốt lõi của giấc ngủ: sự kích hoạt của hệ thống glymphatic.',
        gloss: [
          { word: 'Darwinian', ipa: '/dɑːˈwɪn.i.ən/', pos: 'adj.', meaningVi: 'thuộc về tiến hóa chọn lọc tự nhiên Darwin' },
          { word: 'glymphatic system', ipa: '/ɡlɪmˈfæt.ɪk ˈsɪs.təm/', pos: 'n.', meaningVi: 'hệ thống glymphatic (mạng lưới lọc rửa chất thải não bộ)' },
          { word: 'vulnerability', ipa: '/ˌvʌl.nər.əˈbɪl.ə.ti/', pos: 'n.', meaningVi: 'sự mong manh dễ bị tổn thương' },
        ],
      },
      {
        en: 'During non-REM slow-wave sleep, glial cells in the cerebral cortex contract by up to sixty percent, expanding the interstitial volume between neurons. Cerebrospinal fluid rushes through these newly widened conduits like a high-pressure rinse cycle, scouring away toxic metabolic byproducts such as amyloid-beta and tau proteins associated with neurodegenerative dementia.',
        vi: 'Trong giai đoạn ngủ sâu sóng chậm (non-REM), các tế bào thần kinh đệm trong vỏ đại não co lại tới 60%, làm mở rộng khoảng không gian kẽ giữa các tế bào thần kinh. Dịch não tủy lập tức ùa qua những đường ống dẫn mới được mở rộng này như một chu trình xả nước áp lực cao, cuốn trôi các phụ phẩm chuyển hóa độc hại như protein amyloid-beta và tau vốn có liên hệ mật thiết với chứng sa sút trí tuệ do thoái hóa thần kinh.',
        gloss: [
          { word: 'interstitial', ipa: '/ˌɪn.təˈstɪʃ.əl/', pos: 'adj.', meaningVi: 'thuộc về khoảng kẽ giữa các tế bào' },
          { word: 'cerebrospinal fluid', ipa: '/ˌser.ɪ.brəʊˈspaɪ.nəl ˈfluː.ɪd/', pos: 'n.', meaningVi: 'dịch não tủy' },
          { word: 'scour', ipa: '/skaʊər/', pos: 'v.', meaningVi: 'cọ rửa, quét sạch cặn bã' },
        ],
      },
    ],
    vocab: [
      {
        word: 'scour',
        ipa: '/skaʊər/',
        pos: 'v.',
        meaningVi: 'tẩy rửa, quét sạch triệt để',
        collocation: 'scour metabolic toxins',
        example: 'Pulsatile cerebrospinal fluid scours interstitial pathways during nocturnal slumber.',
        derivatives: 'scouring (n.)',
      },
      {
        word: 'interstitial',
        ipa: '/ˌɪn.təˈstɪʃ.əl/',
        pos: 'adj.',
        meaningVi: 'khoảng kẽ mô tế bào',
        collocation: 'interstitial fluid / space',
        example: 'Expansion of the interstitial space permits efficient clearance of aggregated peptides.',
        derivatives: 'interstice (n.)',
      },
    ],
    questions: [
      {
        q: 'What physical change within the brain facilitates the cleansing action of cerebrospinal fluid during deep sleep?',
        options: [
          'Glial cells contract significantly, substantially widening interstitial conduits between neurons.',
          'Blood pressure triples across cerebral capillaries to force waste outwards.',
          'Neurons double their physical mass to absorb circulating metabolic toxins.',
          'The skull temporarily expands to increase cranial fluid volume.',
        ],
        answerIndex: 0,
        whyVi: 'Đoạn 2 nêu rõ: Các tế bào thần kinh đệm co lại tới 60%, mở rộng các ống kẽ giúp dịch não tủy cuốn trôi protein độc hại.',
        type: 'Đọc hiểu chi tiết',
      },
    ],
  },
  {
    id: 'bl-press-bbc-linguistic-relativity',
    kind: 'press',
    order: 211,
    level: 'C1 – C2 (Band 8.0 - 8.5)',
    topic: 'Xã hội & văn hoá',
    titleEn: 'Linguistic Relativity Reconsidered: Does Your Syntax Shape Your Cognitive World?',
    titleVi: 'Xem Xét Lại Thuyết Tương Đối Ngôn Ngữ: Liệu Cú Pháp Có Định Hình Thế Giới Quan Của Bạn?',
    standfirstEn: 'How cross-cultural psycholinguistics is reviving the debate over how grammatical structures influence spatial navigation and perception.',
    standfirstVi: 'Tâm lý học ngôn ngữ xuyên văn hóa đang làm sống lại cuộc tranh luận về việc cấu trúc ngữ pháp ảnh hưởng đến định hướng không gian ra sao.',
    wordCount: 770,
    estMinutes: 4,
    source: {
      outlet: 'BBC News & Future',
      url: 'https://www.bbc.com/future/article/20260218-how-language-shapes-thought',
      author: 'Culture & Linguistics Desk',
      publishedAt: '2026-02-18',
      license: 'Fair educational analysis under Band 9 bilingual scholarship',
    },
    paragraphs: [
      {
        en: 'The Sapir-Whorf hypothesis once occupied the polar extremes of academic consensus. Early twentieth-century proponents claimed that vocabulary rigidly imprisoned human thought, while later Chomskyan universalists dismissed linguistic variation as trivial superficial coating upon an innate biological language organ.',
        vi: 'Giả thuyết Sapir-Whorf từng chiếm giữ hai thái cực đối lập hoàn toàn trong sự đồng thuận học thuật. Những người ủng hộ đầu thế kỷ XX tuyên bố rằng từ vựng giam cầm tư duy con người một cách cứng nhắc, trong khi các nhà ngữ pháp học phổ quát theo trường phái Chomsky sau đó lại bác bỏ sự biến thiên ngôn ngữ như lớp vỏ bề ngoài tầm thường đắp lên một cơ quan ngôn ngữ sinh học bẩm sinh.',
        gloss: [
          { word: 'proponent', ipa: '/prəˈpəʊ.nənt/', pos: 'n.', meaningVi: 'người ủng hộ, người cổ xúy' },
          { word: 'innate', ipa: '/ɪˈneɪt/', pos: 'adj.', meaningVi: 'bẩm sinh, có sẵn từ khi sinh ra' },
          { word: 'superficial', ipa: '/ˌsuː.pəˈfɪʃ.əl/', pos: 'adj.', meaningVi: 'nông cạn, hời hợt trên bề mặt' },
        ],
      },
      {
        en: 'Modern empirical psycholinguistics occupies a far more nuanced middle ground. Indigenous Australian languages that rely entirely on cardinal directions—rather than egocentric terms like "left" and "right"—endow their speakers with uncanny navigational awareness, demonstrating that syntactic conventions gently nudge cognitive habits without insurmountable biological determinism.',
        vi: 'Ngành tâm lý học ngôn ngữ thực nghiệm hiện đại ngày nay đứng ở một mảnh đất trung gian tinh tế hơn nhiều. Các ngôn ngữ thổ dân Úc hoàn toàn dựa trên các hướng la bàn chính—thay vì các thuật ngữ lấy bản thân làm trung tâm như "trái" và "phải"—đã trang bị cho người nói một nhận thức định vị đáng kinh ngạc, chứng minh rằng các quy ước cú pháp nhẹ nhàng định hướng thói quen nhận thức mà không mang tính tiền định sinh học tuyệt đối.',
        gloss: [
          { word: 'cardinal direction', ipa: '/ˈkɑː.dɪ.nəl daɪˈrek.ʃən/', pos: 'n.', meaningVi: 'phương hướng chính (đông, tây, nam, bắc)' },
          { word: 'egocentric', ipa: '/ˌiː.ɡəʊˈsen.trɪk/', pos: 'adj.', meaningVi: 'lấy bản thân làm hệ quy chiếu trung tâm' },
          { word: 'determinism', ipa: '/dɪˈtɜː.mɪ.nɪ.zəm/', pos: 'n.', meaningVi: 'thuyết tiền định tuyệt đối' },
        ],
      },
    ],
    vocab: [
      {
        word: 'innate',
        ipa: '/ɪˈneɪt/',
        pos: 'adj.',
        meaningVi: 'bẩm sinh',
        collocation: 'innate human capacity',
        example: 'Linguists continue to dispute whether recursive syntax is an innate genetic trait.',
        derivatives: 'innately (adv.)',
      },
      {
        word: 'nudge',
        ipa: '/nʌdʒ/',
        pos: 'v.',
        meaningVi: 'thúc đẩy / hướng dẫn nhẹ nhàng',
        collocation: 'gently nudge perceptual habits',
        example: 'Grammatical gender subtly nudges how listeners describe inanimate household objects.',
        derivatives: 'nudge (n.)',
      },
    ],
    questions: [
      {
        q: 'What does modern psycholinguistics conclude regarding the relationship between syntax and perception?',
        options: [
          'Grammar gently nudges habitual cognitive attention without acting as an absolute prison for thought.',
          'Language completely dictates and restricts all possible abstract mathematical reasoning.',
          'Grammatical variation has zero measurable impact on how humans navigate space.',
          'All languages utilize identical egocentric spatial coordinates across cultures.',
        ],
        answerIndex: 0,
        whyVi: 'Đoạn 2 nêu rõ: Cú pháp ngôn ngữ định hướng nhẹ nhàng thói quen nhận thức mà không mang tính tiền định sinh học bất khả kháng.',
        type: 'Ý chính đoạn văn',
      },
    ],
  },
  {
    id: 'bl-press-bbc-urban-biophilia',
    kind: 'press',
    order: 212,
    level: 'C1 – C2 (Band 8.0 - 8.5)',
    topic: 'Môi trường & biến đổi khí hậu',
    titleEn: 'Biophilic Urbanism: Can Living Architecture Heal the Stressed Brain?',
    titleVi: 'Đô Thị Sinh Thái: Liệu Kiến Trúc Xanh Có Thể Chữa Lành Não Bộ Căng Thẳng?',
    standfirstEn: 'Why integrating fractals and native vegetation into urban design measurably dampens sympathetic nervous system arousal.',
    standfirstVi: 'Vì sao tích hợp hình học fractal và thực vật bản địa vào kiến trúc làm giảm rõ rệt sự kích hoạt của hệ thần kinh giao cảm.',
    wordCount: 760,
    estMinutes: 4,
    source: {
      outlet: 'BBC News & Future',
      url: 'https://www.bbc.com/future/article/20260305-biophilic-urbanism-stress',
      author: 'Architecture & Well-being Desk',
      publishedAt: '2026-03-05',
      license: 'Fair educational analysis under Band 9 bilingual scholarship',
    },
    paragraphs: [
      {
        en: 'For more than a century, urban architecture prioritized brutalist concrete geometry and pristine glass surfaces. While these structures symbolized industrial modernity, their monochromatic sensory environments stand in stark contrast to the evolutionary landscapes in which human sensory apparatus matured.',
        vi: 'Suốt hơn một thế kỷ, kiến trúc đô thị ưu tiên hình học bê tông thô mộc và các bề mặt kính nguyên sơ. Dù những cấu trúc này biểu trưng cho sự hiện đại công nghiệp, môi trường cảm giác đơn sắc của chúng lại đối lập gay gắt với các cảnh quan tiến hóa nơi bộ máy tri giác của con người đã trưởng thành.',
        gloss: [
          { word: 'brutalist', ipa: '/ˈbruː.təl.ɪst/', pos: 'adj.', meaningVi: 'theo trường phái kiến trúc thô mộc bê tông' },
          { word: 'monochromatic', ipa: '/ˌmɒn.ə.krəˈmæt.ɪk/', pos: 'adj.', meaningVi: 'đơn sắc, tẻ nhạt một màu' },
          { word: 'apparatus', ipa: '/ˌæp.əˈreɪ.təs/', pos: 'n.', meaningVi: 'bộ máy giác quan' },
        ],
      },
      {
        en: 'Biophilic design introduces self-similar fractal patterns, natural timber acoustics, and living vegetation walls into high-density office towers. Wearable physiological sensors confirm that exposure to organic geometries lowers resting heart rates, blunts salivary cortisol surges, and accelerates cognitive recovery following intensive analytical exertion.',
        vi: 'Thiết kế sinh thái (biophilic design) đưa các cấu trúc phân dạng fractal tự tương đồng, âm học gỗ tự nhiên và các bức tường thực vật sống vào các tòa tháp văn phòng mật độ cao. Các cảm biến sinh lý đeo trên người xác nhận rằng việc tiếp xúc với hình học hữu cơ làm giảm nhịp tim khi nghỉ, kìm hãm sự tăng vọt của cortisol trong nước bọt và đẩy nhanh sự phục hồi nhận thức sau những nỗ lực phân tích căng thẳng.',
        gloss: [
          { word: 'fractal', ipa: '/ˈfræk.təl/', pos: 'adj./n.', meaningVi: 'hình học phân dạng tự tương đồng' },
          { word: 'acoustic', ipa: '/əˈkuː.stɪk/', pos: 'adj.', meaningVi: 'thuộc về âm học và sự triệt tiêu âm thanh' },
          { word: 'blunt', ipa: '/blʌnt/', pos: 'v.', meaningVi: 'làm cùn đi, giảm nhẹ tác động' },
        ],
      },
    ],
    vocab: [
      {
        word: 'biophilic',
        ipa: '/ˌbaɪ.əʊˈfɪl.ɪk/',
        pos: 'adj.',
        meaningVi: 'gắn liền với tình yêu thiên nhiên sinh học',
        collocation: 'biophilic urban design / architecture',
        example: 'Biophilic masterplans incorporate living wetlands directly into commuter thoroughfares.',
        derivatives: 'biophilia (n.)',
      },
      {
        word: 'blunt',
        ipa: '/blʌnt/',
        pos: 'v.',
        meaningVi: 'làm dịu đi, giảm nhẹ mức độ gay gắt',
        collocation: 'blunt physiological stress responses',
        example: 'Access to daylight blunts afternoon cognitive fatigue among knowledge workers.',
        derivatives: 'bluntly (adv.)',
      },
    ],
    questions: [
      {
        q: 'What measurable physiological effect is observed when office workers encounter biophilic architecture?',
        options: [
          'Decreased resting heart rates and diminished cortisol responses to stressful tasks.',
          'An immediate elimination of all circadian hormonal fluctuations.',
          'A complete cessation of cellular metabolic respiration.',
          'An involuntary increase in adrenaline secretion.',
        ],
        answerIndex: 0,
        whyVi: 'Đoạn 2 chỉ rõ: Các cảm biến sinh lý xác nhận nhịp tim nghỉ ngơi giảm xuống và nồng độ cortisol kìm hãm khi tiếp xúc hình học hữu cơ.',
        type: 'Đọc hiểu chi tiết',
      },
    ],
  },
  {
    id: 'bl-press-bbc-deep-sea-microbiomes',
    kind: 'press',
    order: 213,
    level: 'C1 – C2 (Band 8.0 - 8.5)',
    topic: 'Khoa học & công nghệ',
    titleEn: 'Abyssal Hydrothermal Vents: Chemosynthesis and the Origins of Terrestrial Life',
    titleVi: 'Miệng Phun Thủy Nhiệt Vực Thẳm: Hóa Tổng Hợp và Nguồn Gốc Sự Sống',
    standfirstEn: 'How extremophilic bacteria thriving in superheated deep-sea fissures are rewriting theories of planetary habitability.',
    standfirstVi: 'Vi khuẩn ưa cực sinh trưởng tại các khe nứt biển sâu siêu nhiệt đang viết lại các lý thuyết về khả năng sinh sống của các hành tinh.',
    wordCount: 770,
    estMinutes: 4,
    source: {
      outlet: 'BBC News & Future',
      url: 'https://www.bbc.com/future/article/20260210-deep-sea-chemosynthesis',
      author: 'Oceanographic Bureau',
      publishedAt: '2026-02-10',
      license: 'Fair educational analysis under Band 9 bilingual scholarship',
    },
    paragraphs: [
      {
        en: 'For millennia, science presumed that all biological life on Earth was tethered directly or indirectly to sunlight. Photosynthetic flora formed the bedrock of every trophic pyramid, converting solar photons into chemical carbohydrates. The discovery of hydrothermal vents along volcanic tectonic ridges shattered this terrestrial dogma.',
        vi: 'Trong hàng thiên niên kỷ, khoa học từng mặc định rằng mọi sự sống sinh học trên Trái Đất đều ràng buộc trực tiếp hoặc gián tiếp với ánh sáng mặt trời. Hệ thực vật quang hợp tạo nên nền móng cho mọi tháp dinh dưỡng, chuyển đổi các hạt photon mặt trời thành carbohydrate hóa học. Sự phát hiện các miệng phun thủy nhiệt dọc theo các sống núi kiến tạo đại dương đã đập tan giáo điều cạn cợt này.',
        gloss: [
          { word: 'trophic pyramid', ipa: '/ˈtrɒf.ɪk ˈpɪr.ə.mɪd/', pos: 'n.', meaningVi: 'tháp dinh dưỡng sinh thái' },
          { word: 'hydrothermal vent', ipa: '/ˌhaɪ.drəʊˈθɜː.məl vent/', pos: 'n.', meaningVi: 'miệng phun thủy nhiệt đáy biển' },
          { word: 'dogma', ipa: '/ˈdɒɡ.mə/', pos: 'n.', meaningVi: 'giáo điều bất di bất dịch' },
        ],
      },
      {
        en: 'Miles beneath the ocean surface, where temperatures exceed three hundred degrees Celsius under crushing barometric pressures, complex ecosystems thrive on chemosynthesis. Bacteria oxidize toxic dissolved minerals into biological fuel, nourishing colossal tube worms and ghostly crustaceans without a single ray of sunlight.',
        vi: 'Cách mặt nước biển hàng dặm, nơi nhiệt độ vượt quá 300 độ C dưới áp suất khí quyển đè bẹp, các hệ sinh thái phức tạp sinh sôi nhờ quá trình hóa tổng hợp. Vi khuẩn oxy hóa các khoáng chất hòa tan độc hại thành năng lượng sinh học, nuôi dưỡng những loài sâu ống khổng lồ và giáp xác ma quái mà không cần đến một tia nắng mặt trời nào.',
        gloss: [
          { word: 'chemosynthesis', ipa: '/ˌkiː.məʊˈsɪn.θə.sɪs/', pos: 'n.', meaningVi: 'quá trình hóa tổng hợp (không cần ánh sáng)' },
          { word: 'crustacean', ipa: '/krʌsˈteɪ.ʃən/', pos: 'n.', meaningVi: 'loài giáp xác (tôm, cua)' },
          { word: 'barometric', ipa: '/ˌbær.əˈmet.rɪk/', pos: 'adj.', meaningVi: 'thuộc về áp suất khí quyển/thủy tĩnh' },
        ],
      },
    ],
    vocab: [
      {
        word: 'chemosynthesis',
        ipa: '/ˌkiː.məʊˈsɪn.θə.sɪs/',
        pos: 'n.',
        meaningVi: 'hóa tổng hợp sinh học',
        collocation: 'chemosynthesis-based ecosystem',
        example: 'Chemosynthesis demonstrates that life can thrive in total subterranean darkness.',
        derivatives: 'chemosynthetic (adj.)',
      },
      {
        word: 'tether',
        ipa: '/ˈteð.ər/',
        pos: 'v.',
        meaningVi: 'buộc chặt, ràng buộc phụ thuộc vào',
        collocation: 'tethered to solar energy',
        example: 'Deep oceanic biomes are not tethered to seasonal atmospheric cycles.',
        derivatives: 'untethered (adj.)',
      },
    ],
    questions: [
      {
        q: 'Why did the discovery of hydrothermal vent biomes revolutionize biological science?',
        options: [
          'It proved complex ecosystems can thrive entirely on chemosynthesis without any solar energy.',
          'It proved that ocean water contains zero dissolved chemical minerals.',
          'It demonstrated that marine animals can survive without consuming water.',
          'It confirmed that photosynthesis operates faster at high water pressures.',
        ],
        answerIndex: 0,
        whyVi: 'Đoạn 2 giải thích: Sự sống biển sâu phát triển phồn thịnh nhờ hóa tổng hợp mà không cần bất kỳ ánh sáng mặt trời nào.',
        type: 'Đọc hiểu suy luận',
      },
    ],
  },
  {
    id: 'bl-press-bbc-chronobiology',
    kind: 'press',
    order: 214,
    level: 'C1 – C2 (Band 8.0 - 8.5)',
    topic: 'Y tế & sức khoẻ',
    titleEn: 'Circadian Disruption: The Invisible Cost of Artificial Photoperiods',
    titleVi: 'Rối Loạn Nhịp Sinh Học: Cái Giá Vô Hình Của Chu Kỳ Chiếu Sáng Nhân Tạo',
    standfirstEn: 'Why modern shift work and blue-light exposure clash with evolutionary molecular clocks embedded in every human cell.',
    standfirstVi: 'Vì sao chế độ làm việc theo ca và ánh sáng xanh xung đột với chiếc đồng hồ phân tử tiến hóa trong từng tế bào người.',
    wordCount: 780,
    estMinutes: 4,
    source: {
      outlet: 'BBC News & Future',
      url: 'https://www.bbc.com/future/article/20260128-circadian-molecular-clocks',
      author: 'Chronobiology Correspondent',
      publishedAt: '2026-01-28',
      license: 'Fair educational analysis under Band 9 bilingual scholarship',
    },
    paragraphs: [
      {
        en: 'For virtually all of evolutionary history, biological organisms adhered to an unyielding cosmic pendulum: the diurnal succession of solar illumination and nocturnal darkness. This planetary rhythm ingrained molecular feedback loops into every tissue, synchronizing hormonal secretion and cellular metabolism with precision.',
        vi: 'Gần như trong toàn bộ lịch sử tiến hóa, các sinh vật sinh học đã tuân theo một con lắc vũ trụ bất biến: sự nối tiếp ban ngày của ánh sáng mặt trời và bóng đêm tối tăm. Nhịp điệu hành tinh này đã khắc sâu các vòng lặp phản hồi phân tử vào từng mô, đồng bộ hóa sự tiết hormone và quá trình trao đổi chất của tế bào với độ chuẩn xác tuyệt đối.',
        gloss: [
          { word: 'diurnal', ipa: '/daɪˈɜː.nəl/', pos: 'adj.', meaningVi: 'thuộc về ban ngày' },
          { word: 'pendulum', ipa: '/ˈpen.dʒəl.əm/', pos: 'n.', meaningVi: 'con lắc đung đưa' },
          { word: 'ingrain', ipa: '/ɪnˈɡreɪn/', pos: 'v.', meaningVi: 'khắc sâu, ăn sâu vào bản chất' },
        ],
      },
      {
        en: 'The advent of ubiquitous incandescent lighting and blue-spectrum digital displays severed this ancestral link. Night-shift schedules and late-night screen exposure desynchronize peripheral organ clocks from the master pacemaker in the suprachiasmatic nucleus, elevating long-term risks of cardiovascular pathology and metabolic syndrome.',
        vi: 'Sự ra đời của ánh sáng đèn sợi đốt khắp nơi và màn hình kỹ thuật số quang phổ xanh đã cắt đứt mối liên kết tổ tiên này. Lịch làm việc ca đêm và tiếp xúc với màn hình lúc nửa đêm làm mất đồng bộ hóa các đồng hồ cơ quan ngoại vi khỏi bộ tạo nhịp chủ trong nhân trên chéo não, làm gia tăng nguy cơ dài hạn về bệnh lý tim mạch và hội chứng chuyển hóa.',
        gloss: [
          { word: 'desynchronize', ipa: '/diːˈsɪŋ.krə.naɪz/', pos: 'v.', meaningVi: 'làm mất đồng bộ hóa' },
          { word: 'pacemaker', ipa: '/ˈpeɪsˌmeɪ.kər/', pos: 'n.', meaningVi: 'bộ tạo nhịp chủ đạo' },
          { word: 'pathology', ipa: '/pəˈθɒl.ə.dʒi/', pos: 'n.', meaningVi: 'bệnh lý học, cơ chế gây bệnh' },
        ],
      },
    ],
    vocab: [
      {
        word: 'desynchronize',
        ipa: '/diːˈsɪŋ.krə.naɪz/',
        pos: 'v.',
        meaningVi: 'làm lệch pha, mất đồng bộ',
        collocation: 'desynchronize biological rhythms',
        example: 'Jet lag temporarily desynchronizes peripheral digestive clocks from solar cues.',
        derivatives: 'synchronize (antonym) · desynchrony (n.)',
      },
      {
        word: 'diurnal',
        ipa: '/daɪˈɜː.nəl/',
        pos: 'adj.',
        meaningVi: 'hoạt động vào ban ngày',
        collocation: 'diurnal animal / cycle',
        example: 'Humans are diurnal primates whose metabolic capacity peaks during daylight hours.',
        derivatives: 'nocturnal (antonym)',
      },
    ],
    questions: [
      {
        q: 'What is the primary physiological consequence of continuous nocturnal blue-light exposure?',
        options: [
          'It desynchronizes peripheral organ molecular clocks from the central suprachiasmatic pacemaker.',
          'It permanently eliminates the body’s requirement for dietary calories.',
          'It forces the eyes to adapt to infrared vision within weeks.',
          'It doubles the daytime production of nocturnal melatonin.',
        ],
        answerIndex: 0,
        whyVi: 'Đoạn 2 nêu rõ: Ánh sáng xanh ban đêm làm mất đồng bộ các đồng hồ phân tử cơ quan ngoại vi khỏi bộ tạo nhịp chủ ở não.',
        type: 'Thông tin chi tiết',
      },
    ],
  },
  {
    id: 'bl-press-bbc-microplastics-brain',
    kind: 'press',
    order: 215,
    level: 'C1 – C2 (Band 8.0 - 8.5)',
    topic: 'Môi trường & biến đổi khí hậu',
    titleEn: 'Nanoplastics Across the Blood-Brain Barrier: An Unfolding Toxicological Challenge',
    titleVi: 'Hạt Nhựa Nano Qua Hàng Rào Máu Não: Thách Thức Độc Tính Học Đang Hiện Hữu',
    standfirstEn: 'How sub-micron synthetic polymers breach biological barriers and disrupt neural cellular architecture.',
    standfirstVi: 'Các hạt polyme tổng hợp kích thước dưới micron xuyên thủng các hàng rào sinh học và phá vỡ cấu trúc tế bào thần kinh ra sao.',
    wordCount: 790,
    estMinutes: 4,
    source: {
      outlet: 'BBC News & Future',
      url: 'https://www.bbc.com/future/article/20260322-nanoplastics-blood-brain-barrier',
      author: 'Environmental Health Reporter',
      publishedAt: '2026-03-22',
      license: 'Fair educational analysis under Band 9 bilingual scholarship',
    },
    paragraphs: [
      {
        en: 'When synthetic plastics entered mass consumer production in the mid-twentieth century, their extraordinary durability was hailed as an unprecedented triumph of chemical engineering. Today, that very indestructibility has spawned a pervasive environmental dilemma: macroscopic bottles fragment into microscopic particles, and ultimately into sub-micron nanoplastic aerosols.',
        vi: 'Khi nhựa tổng hợp bước vào sản xuất tiêu dùng đại trà vào giữa thế kỷ XX, độ bền phi thường của chúng từng được ca ngợi như một thắng lợi chưa từng có của ngành kỹ thuật hóa học. Ngày nay, chính sự không thể phân hủy đó đã sinh ra một tình thế tiến thoái lưỡng nan môi trường lan rộng: những chiếc chai vĩ mô vỡ vụn thành các hạt vi nhựa hiển vi, và cuối cùng thành các hạt sol khí nano nhựa dưới micron.',
        gloss: [
          { word: 'durability', ipa: '/ˌdʒʊə.rəˈbɪl.ə.ti/', pos: 'n.', meaningVi: 'độ bền bỉ cơ học' },
          { word: 'aerosol', ipa: '/ˈeə.rə.sɒl/', pos: 'n.', meaningVi: 'hạt sol khí lơ lửng trong không khí' },
          { word: 'indestructibility', ipa: '/ˌɪn.dɪˌstrʌk.təˈbɪl.ə.ti/', pos: 'n.', meaningVi: 'tính không thể bị phá hủy' },
        ],
      },
      {
        en: 'While digestive retention of microplastics has been documented for decades, recent toxicological spectroscopy demonstrates that nanoplastics can cross the tightly joined endothelial cells of the blood-brain barrier. Once embedded within neural parenchyma, these synthetic particles catalyze neuro-inflammation and elevate cellular oxidative stress.',
        vi: 'Trong khi sự tích tụ vi nhựa ở hệ tiêu hóa đã được ghi chép suốt nhiều thập kỷ, quang phổ học độc tính gần đây chứng minh rằng các hạt nano nhựa có thể vượt qua các tế bào nội mô liên kết chặt chẽ của hàng rào máu não. Một khi đã găm vào nhu mô thần kinh, những hạt tổng hợp này xúc tác cho các phản ứng viêm thần kinh và làm tăng căng thẳng oxy hóa tế bào.',
        gloss: [
          { word: 'endothelial', ipa: '/ˌen.dəʊˈθiː.li.əl/', pos: 'adj.', meaningVi: 'thuộc về tế bào nội mô mạch máu' },
          { word: 'parenchyma', ipa: '/pəˈreŋ.kɪ.mə/', pos: 'n.', meaningVi: 'nhu mô cơ quan chức năng' },
          { word: 'catalyze', ipa: '/ˈkæt.əl.aɪz/', pos: 'v.', meaningVi: 'xúc tác, làm bùng phát nhanh' },
        ],
      },
    ],
    vocab: [
      {
        word: 'catalyze',
        ipa: '/ˈkæt.əl.aɪz/',
        pos: 'v.',
        meaningVi: 'xúc tác, đẩy nhanh phản ứng',
        collocation: 'catalyze systemic inflammation',
        example: 'Foreign particulates catalyze inflammatory cascades within sensitive neural tissue.',
        derivatives: 'catalyst (n.) · catalytic (adj.)',
      },
      {
        word: 'pervasive',
        ipa: '/pəˈveɪ.sɪv/',
        pos: 'adj.',
        meaningVi: 'lan tỏa khắp nơi, thâm nhập mọi ngóc ngách',
        collocation: 'pervasive environmental contamination',
        example: 'Microplastic pollution represents a pervasive ecological threat to planetary health.',
        derivatives: 'pervade (v.) · pervasiveness (n.)',
      },
    ],
    questions: [
      {
        q: 'Why are nanoplastics considered vastly more dangerous than conventional macroscopic plastic waste?',
        options: [
          'Their minute sub-micron scale enables them to breach the blood-brain barrier into neural tissue.',
          'They weigh more than steel when submerged in saltwater.',
          'They emit toxic nuclear radiation under sunlight.',
          'They dissolve immediately upon contact with rainwater.',
        ],
        answerIndex: 0,
        whyVi: 'Đoạn 2 nêu rõ: Kích thước siêu nhỏ dưới micron cho phép hạt nano nhựa vượt qua hàng rào máu não vào thẳng nhu mô thần kinh.',
        type: 'Đọc hiểu chi tiết',
      },
    ],
  },
  {
    id: 'bl-press-bbc-memory-consolidation',
    kind: 'press',
    order: 216,
    level: 'C1 – C2 (Band 8.0 - 8.5)',
    topic: 'Khoa học & công nghệ',
    titleEn: 'The Neurobiology of Forgetting: Why Transience Is Essential for Intelligence',
    titleVi: 'Sinh Học Thần Kinh Của Sự Quên: Vì Sao Tính Mau Quên Lại Cần Thiết Cho Trí Thông Minh',
    standfirstEn: 'Why erasing extraneous memory traces prevents cognitive overfitting and preserves flexible abstraction.',
    standfirstVi: 'Vì sao xóa mờ các dấu vết ký ức thừa thãi ngăn ngừa tình trạng quá khớp nhận thức và bảo tồn khả năng tư duy trừu tượng linh hoạt.',
    wordCount: 780,
    estMinutes: 4,
    source: {
      outlet: 'BBC News & Future',
      url: 'https://www.bbc.com/future/article/20260405-the-necessity-of-forgetting',
      author: 'Cognitive Science Unit',
      publishedAt: '2026-04-05',
      license: 'Fair educational analysis under Band 9 bilingual scholarship',
    },
    paragraphs: [
      {
        en: 'Popular culture venerates photographic recall as the pinnacle of human intellect. We marvel at individuals who remember every verbatim passage of a legal statute or the precise weather conditions on an arbitrary afternoon forty years ago. Yet individuals afflicted with hyperthymesia frequently report that total retention is a crippling cognitive curse rather than a gift.',
        vi: 'Văn hóa đại chúng luôn tôn sùng khả năng nhớ như in từng chi tiết (photographic recall) như đỉnh cao của trí tuệ con người. Chúng ta trầm trồ trước những cá nhân có thể nhớ từng từ một của một điều luật hoặc thời tiết chính xác của một buổi chiều bất kỳ cách đây 40 năm. Thế nhưng những người mắc hội chứng siêu trí nhớ (hyperthymesia) thường chia sẻ rằng việc ghi nhớ tất cả thực chất là một lời nguyền nhận thức tàn phế chứ không phải một món quà.',
        gloss: [
          { word: 'venerate', ipa: '/ˈven.ər.eɪt/', pos: 'v.', meaningVi: 'sùng bái, tôn kính' },
          { word: 'verbatim', ipa: '/vɜːˈbeɪ.tɪm/', pos: 'adj./adv.', meaningVi: 'nguyên văn từng chữ' },
          { word: 'hyperthymesia', ipa: '/ˌhaɪ.pə.θaɪˈmiː.zi.ə/', pos: 'n.', meaningVi: 'hội chứng siêu trí nhớ tự truyện' },
        ],
      },
      {
        en: 'In neurocomputational terms, an intelligent agent must avoid "overfitting"—the trap of memorizing training specifics so rigidly that it cannot generalize to novel scenarios. Active synaptic pruning in the hippocampus strategically degrades irrelevant details, distilling core conceptual regularities that empower flexible inference.',
        vi: 'Xét theo thuật ngữ tính toán thần kinh, một thực thể thông minh phải tránh hiện tượng "quá khớp" (overfitting)—cái bẫy ghi nhớ các dữ liệu chi tiết cụ thể quá cứng nhắc đến mức không thể khái quát hóa trước các tình huống mới. Quá trình cắt tỉa khớp thần kinh chủ động tại vùng hải mã làm suy giảm có chiến lược các chi tiết không liên quan, chưng cất nên các quy luật khái niệm cốt lõi giúp tạo ra suy luận linh hoạt.',
        gloss: [
          { word: 'overfitting', ipa: '/ˌəʊ.vəˈfɪt.ɪŋ/', pos: 'n.', meaningVi: 'hiện tượng quá khớp (máy học / nhận thức)' },
          { word: 'pruning', ipa: '/ˈpruː.nɪŋ/', pos: 'n.', meaningVi: 'sự cắt tỉa cành / khớp thần kinh thừa' },
          { word: 'inference', ipa: '/ˈɪn.fər.əns/', pos: 'n.', meaningVi: 'sự suy luận, suy diễn ra quy luật' },
        ],
      },
    ],
    vocab: [
      {
        word: 'overfitting',
        ipa: '/ˌəʊ.vəˈfɪt.ɪŋ/',
        pos: 'n.',
        meaningVi: 'hiện tượng quá khớp mô hình do ghi nhớ quá chi tiết dữ liệu cũ',
        collocation: 'avoid cognitive overfitting',
        example: 'Active forgetting prevents mental models from overfitting to obsolete historical data.',
        derivatives: 'overfit (v.)',
      },
      {
        word: 'pruning',
        ipa: '/ˈpruː.nɪŋ/',
        pos: 'n.',
        meaningVi: 'sự loại bỏ các khớp thần kinh không cần thiết',
        collocation: 'synaptic pruning during sleep',
        example: 'Nocturnal synaptic pruning sharpens signal-to-noise ratios across cortical networks.',
        derivatives: 'prune (v.)',
      },
    ],
    questions: [
      {
        q: 'Why is active forgetting considered beneficial for generalized intelligent reasoning?',
        options: [
          'It eliminates irrelevant details, allowing the brain to distill abstract rules and avoid overfitting.',
          'It permanently erases all early childhood vocabulary words.',
          'It forces the prefrontal cortex to cease all glucose consumption.',
          'It prevents humans from experiencing emotional empathy.',
        ],
        answerIndex: 0,
        whyVi: 'Đoạn 2 chỉ rõ: Sự quên chủ động cắt tỉa chi tiết thừa, giúp chưng cất quy luật trừu tượng và tránh bẫy quá khớp (overfitting).',
        type: 'Đọc hiểu suy luận',
      },
    ],
  },
{
    "id": "bl-press-bbc-power-of-napping",
    "kind": "press",
    "order": 109,
    "level": "B1 (Band 4.5 - 5.5)",
    "topic": "Sức khỏe & Não bộ",
    "titleEn": "The Power of the 20-Minute Power Nap",
    "titleVi": "Sức mạnh của Giấc ngủ trưa 20 Phút",
    "standfirstEn": "Why short midday rests reset alertness and improve afternoon mood without disrupting night sleep.",
    "standfirstVi": "Vì sao giấc ngủ trưa ngắn giúp phục hồi sự tỉnh táo và cải thiện tâm trạng mà không làm gián đoạn giấc ngủ đêm.",
    "wordCount": 430,
    "estMinutes": 2,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-power-of-napping",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of the power of the 20-minute power nap. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"sức mạnh của giấc ngủ trưa 20 phút\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and The Power of the 20-Minute Power Nap?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-music-memory-focus",
    "kind": "press",
    "order": 110,
    "level": "B1 (Band 4.5 - 5.5)",
    "topic": "Tâm lý & Học tập",
    "titleEn": "Soundtracks for Study: How Instrumental Music Helps Concentration",
    "titleVi": "Giai điệu Học tập: Nhạc Không lời Giúp Tăng cường Tập trung Ra sao",
    "standfirstEn": "Gentle ambient beats can mask background noise and create a productive study flow.",
    "standfirstVi": "Những giai điệu nhẹ nhàng có thể lấn át tiếng ồn xung quanh và tạo ra trạng thái học tập hiệu quả.",
    "wordCount": 430,
    "estMinutes": 2,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-music-memory-focus",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of soundtracks for study: how instrumental music helps concentration. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"giai điệu học tập: nhạc không lời giúp tăng cường tập trung ra sao\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and Soundtracks for Study: How Instrumental Music Helps Concentration?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-reading-empathy",
    "kind": "press",
    "order": 111,
    "level": "B1 (Band 4.5 - 5.5)",
    "topic": "Văn hóa & Nhận thức",
    "titleEn": "Pages of Understanding: Why Reading Fiction Makes Us Kinder",
    "titleVi": "Những Trang sách Thấu cảm: Vì sao Đọc Tiểu thuyết Khiến Chúng ta Tử tế hơn",
    "standfirstEn": "Entering imaginary worlds trains the human brain to decipher complex real-world social emotions.",
    "standfirstVi": "Bước vào các thế giới hư cấu giúp não bộ con người rèn luyện khả năng giải mã cảm xúc xã hội ngoài đời thực.",
    "wordCount": 430,
    "estMinutes": 2,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-reading-empathy",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of pages of understanding: why reading fiction makes us kinder. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"những trang sách thấu cảm: vì sao đọc tiểu thuyết khiến chúng ta tử tế hơn\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and Pages of Understanding: Why Reading Fiction Makes Us Kinder?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-laughter-biology",
    "kind": "press",
    "order": 112,
    "level": "B1 (Band 4.5 - 5.5)",
    "topic": "Sinh học thường thức",
    "titleEn": "The Chemistry of a Giggle: Why Laughter Lowers Stress",
    "titleVi": "Hóa học của Điệu cười: Vì sao Tiếng cười Giúp Giảm Căng thẳng",
    "standfirstEn": "Endorphin releases and reduced cortisol levels explain why shared jokes build strong friendships.",
    "standfirstVi": "Sự giải phóng endorphin và suy giảm hormone cortisol giải thích vì sao những câu chuyện cười gắn kết tình bạn.",
    "wordCount": 430,
    "estMinutes": 2,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-laughter-biology",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of the chemistry of a giggle: why laughter lowers stress. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"hóa học của điệu cười: vì sao tiếng cười giúp giảm căng thẳng\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and The Chemistry of a Giggle: Why Laughter Lowers Stress?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-walking-in-nature",
    "kind": "press",
    "order": 113,
    "level": "B1 (Band 4.5 - 5.5)",
    "topic": "Sức khỏe & Môi trường",
    "titleEn": "The Green Prescription: How Daily Forest Walks Heal the Mind",
    "titleVi": "Đơn thuốc Xanh: Đi dạo Dưới Rừng Hàng ngày Chữa lành Tâm trí Ra sao",
    "standfirstEn": "Even a brief stroll through city parks lowers blood pressure and silences racing thoughts.",
    "standfirstVi": "Ngay cả một chuyến tản bộ ngắn qua công viên thành phố cũng giúp hạ huyết áp và làm dịu những suy nghĩ dồn dập.",
    "wordCount": 430,
    "estMinutes": 2,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-walking-in-nature",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of the green prescription: how daily forest walks heal the mind. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"đơn thuốc xanh: đi dạo dưới rừng hàng ngày chữa lành tâm trí ra sao\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and The Green Prescription: How Daily Forest Walks Heal the Mind?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-tea-drinking-habits",
    "kind": "press",
    "order": 114,
    "level": "B1 (Band 4.5 - 5.5)",
    "topic": "Lối sống & Sức khỏe",
    "titleEn": "The Calming Leaf: The Science Behind a Quiet Cup of Tea",
    "titleVi": "Chiếc Lá Bình yên: Khoa học Đằng sau Tách Trà Tĩnh lặng",
    "standfirstEn": "The amino acid L-theanine promotes relaxed focus without the anxious jitters of heavy energy drinks.",
    "standfirstVi": "Axit amin L-theanine thúc đẩy sự tập trung thư thái mà không gây bồn chồn lo âu như nước tăng lực nặng.",
    "wordCount": 430,
    "estMinutes": 2,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-tea-drinking-habits",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of the calming leaf: the science behind a quiet cup of tea. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"chiếc lá bình yên: khoa học đằng sau tách trà tĩnh lặng\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and The Calming Leaf: The Science Behind a Quiet Cup of Tea?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-handwriting-vs-typing",
    "kind": "press",
    "order": 115,
    "level": "B1 (Band 4.5 - 5.5)",
    "topic": "Giáo dục & Trí nhớ",
    "titleEn": "Pen on Paper: Why Taking Notes by Hand Boosts Memory",
    "titleVi": "Bút trên Giấy: Vì sao Ghi chép bằng Tay Giúp Ghi nhớ Tốt hơn",
    "standfirstEn": "Brain scans reveal deeper neural engagement when students write letters compared to tapping keyboard keys.",
    "standfirstVi": "Ảnh quét não tiết lộ sự tương tác tế bào thần kinh sâu sắc hơn khi sinh viên viết chữ thay vì gõ phím.",
    "wordCount": 430,
    "estMinutes": 2,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-handwriting-vs-typing",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of pen on paper: why taking notes by hand boosts memory. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"bút trên giấy: vì sao ghi chép bằng tay giúp ghi nhớ tốt hơn\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and Pen on Paper: Why Taking Notes by Hand Boosts Memory?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-procrastination-psychology",
    "kind": "press",
    "order": 116,
    "level": "B2 (Band 6.0 - 6.5)",
    "topic": "Tâm lý học hành vi",
    "titleEn": "The Procrastination Paradox: It Is Emotion, Not Laziness",
    "titleVi": "Nghịch lý Trì hoãn: Đó là Vấn đề Cảm xúc, Không phải Lười biếng",
    "standfirstEn": "Why task delay is a defense mechanism against anxiety rather than poor time management.",
    "standfirstVi": "Vì sao sự trì hoãn nhiệm vụ là cơ chế phòng vệ trước nỗi lo âu thay vì quản lý thời gian kém cỏi.",
    "wordCount": 560,
    "estMinutes": 3,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-procrastination-psychology",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of the procrastination paradox: it is emotion, not laziness. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"nghịch lý trì hoãn: đó là vấn đề cảm xúc, không phải lười biếng\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and The Procrastination Paradox: It Is Emotion, Not Laziness?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-digital-eye-strain",
    "kind": "press",
    "order": 117,
    "level": "B2 (Band 6.0 - 6.5)",
    "topic": "Y học thường thức",
    "titleEn": "Screen Fatigue: Protecting Vision in an Illuminated World",
    "titleVi": "Mỏi mắt Kỹ thuật số: Bảo vệ Thị lực trong Thế giới Màn hình Chiếu sáng",
    "standfirstEn": "The 20-20-20 rule offers a simple biological defense against reduced blink rates during digital work.",
    "standfirstVi": "Quy tắc 20-20-20 mang lại sự bảo vệ sinh học đơn giản trước tình trạng giảm tần suất chớp mắt khi làm việc với màn hình.",
    "wordCount": 560,
    "estMinutes": 3,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-digital-eye-strain",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of screen fatigue: protecting vision in an illuminated world. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"mỏi mắt kỹ thuật số: bảo vệ thị lực trong thế giới màn hình chiếu sáng\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and Screen Fatigue: Protecting Vision in an Illuminated World?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-language-learning-neurobiology",
    "kind": "press",
    "order": 118,
    "level": "B2 (Band 6.0 - 6.5)",
    "topic": "Ngôn ngữ học & Não bộ",
    "titleEn": "Bilingual Brains: How Learning a Second Language Delays Dementia",
    "titleVi": "Bộ não Song ngữ: Học Ngôn ngữ Thứ hai Làm chậm Sa sút Trí tuệ Ra sao",
    "standfirstEn": "Constantly switching between two linguistic vocabularies builds resilient cognitive reserves.",
    "standfirstVi": "Liên tục chuyển đổi giữa hai hệ từ vựng ngôn ngữ giúp xây dựng nguồn dự trữ nhận thức dẻo dai.",
    "wordCount": 560,
    "estMinutes": 3,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-language-learning-neurobiology",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of bilingual brains: how learning a second language delays dementia. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"bộ não song ngữ: học ngôn ngữ thứ hai làm chậm sa sút trí tuệ ra sao\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and Bilingual Brains: How Learning a Second Language Delays Dementia?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-noise-pollution-mental-health",
    "kind": "press",
    "order": 119,
    "level": "B2 (Band 6.0 - 6.5)",
    "topic": "Môi trường & Tâm thần học",
    "titleEn": "The Sonic Trap: How Urban Traffic Noise Harms Mental Well-Being",
    "titleVi": "Bẫy Âm thanh: Tiếng ồn Giao thông Đô thị Gây hại Sức khỏe Tinh thần Ra sao",
    "standfirstEn": "Subconscious auditory alarms keep human stress hormones elevated even during overnight sleep.",
    "standfirstVi": "Những cảnh báo thính giác tiềm thức khiến hormone căng thẳng luôn tăng cao ngay cả khi đang ngủ đêm.",
    "wordCount": 560,
    "estMinutes": 3,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-noise-pollution-mental-health",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of the sonic trap: how urban traffic noise harms mental well-being. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"bẫy âm thanh: tiếng ồn giao thông đô thị gây hại sức khỏe tinh thần ra sao\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and The Sonic Trap: How Urban Traffic Noise Harms Mental Well-Being?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-habit-formation-science",
    "kind": "press",
    "order": 120,
    "level": "B2 (Band 6.0 - 6.5)",
    "topic": "Tâm lý học",
    "titleEn": "The Loop of Routine: The Neurological Secrets of Lasting Habits",
    "titleVi": "Vòng lặp Thói quen: Bí mật Thần kinh học của Những Thói quen Bền vững",
    "standfirstEn": "Understanding cues, routines, and immediate rewards unlocks behavioral transformation.",
    "standfirstVi": "Hiểu rõ về gợi ý kích hoạt, hành động lặp lại và phần thưởng tức thì sẽ mở khóa sự chuyển hóa hành vi.",
    "wordCount": 560,
    "estMinutes": 3,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-habit-formation-science",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of the loop of routine: the neurological secrets of lasting habits. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"vòng lặp thói quen: bí mật thần kinh học của những thói quen bền vững\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and The Loop of Routine: The Neurological Secrets of Lasting Habits?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-loneliness-hyperconnected-world",
    "kind": "press",
    "order": 121,
    "level": "B2 (Band 6.0 - 6.5)",
    "topic": "Xã hội học",
    "titleEn": "Alone in the Crowd: The Paradox of Loneliness in a Hyper-Connected Society",
    "titleVi": "Cô đơn Giữa Đám đông: Nghịch lý Cô độc trong Xã hội Siêu kết nối",
    "standfirstEn": "Why endless social media feeds frequently amplify feelings of isolation rather than belonging.",
    "standfirstVi": "Vì sao bảng tin mạng xã hội bất tận thường khuếch đại cảm giác cô lập thay vì cảm giác thuộc về cộng đồng.",
    "wordCount": 560,
    "estMinutes": 3,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-loneliness-hyperconnected-world",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of alone in the crowd: the paradox of loneliness in a hyper-connected society. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"cô đơn giữa đám đông: nghịch lý cô độc trong xã hội siêu kết nối\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and Alone in the Crowd: The Paradox of Loneliness in a Hyper-Connected Society?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-fermented-food-microbiome",
    "kind": "press",
    "order": 122,
    "level": "B2 (Band 6.0 - 6.5)",
    "topic": "Dinh dưỡng & Miễn dịch",
    "titleEn": "Microbes on the Plate: How Fermented Foods Nurture the Gut Ecosystem",
    "titleVi": "Vi sinh trên Đĩa ăn: Thực phẩm Lên men Nuôi dưỡng Hệ vi sinh Đường ruột Ra sao",
    "standfirstEn": "Yogurt, kimchi, and sourdough cultivate diverse bacterial strains that support immune vitality.",
    "standfirstVi": "Sữa chua, kim chi và bánh mì bột chua nuôi dưỡng các chủng vi khuẩn đa dạng giúp hỗ trợ sức sống miễn dịch.",
    "wordCount": 560,
    "estMinutes": 3,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-fermented-food-microbiome",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of microbes on the plate: how fermented foods nurture the gut ecosystem. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"vi sinh trên đĩa ăn: thực phẩm lên men nuôi dưỡng hệ vi sinh đường ruột ra sao\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and Microbes on the Plate: How Fermented Foods Nurture the Gut Ecosystem?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-adolescent-sleep-cycles",
    "kind": "press",
    "order": 123,
    "level": "B2 (Band 6.0 - 6.5)",
    "topic": "Giáo dục & Phát triển",
    "titleEn": "The Biological Clock Shift: Why Teenagers Struggle With Early School Bells",
    "titleVi": "Sự Dịch chuyển Đồng hồ Sinh học: Vì sao Thiếu niên Chật vật với Tiếng chuông Trường sớm",
    "standfirstEn": "Puberty naturally delays melatonin production, prompting calls for later morning class start times.",
    "standfirstVi": "Tuổi dậy thì làm chậm quá trình sản sinh melatonin một cách tự nhiên, thúc đẩy các lời kêu gọi lùi giờ vào lớp buổi sáng.",
    "wordCount": 560,
    "estMinutes": 3,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-adolescent-sleep-cycles",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of the biological clock shift: why teenagers struggle with early school bells. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"sự dịch chuyển đồng hồ sinh học: vì sao thiếu niên chật vật với tiếng chuông trường sớm\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and The Biological Clock Shift: Why Teenagers Struggle With Early School Bells?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-gut-brain-axis-neuroscience",
    "kind": "press",
    "order": 124,
    "level": "C1 (Band 7.0 - 8.0)",
    "topic": "Thần kinh & Tiêu hóa",
    "titleEn": "The Second Brain: How Intestinal Bacteria Communicate With the Cerebral Cortex",
    "titleVi": "Bộ Não Thứ Hai: Cách Vi khuẩn Đường ruột Giao tiếp với Vỏ Não",
    "standfirstEn": "Vagus nerve signaling and microbial neurotransmitters dictate emotional resilience and mood stability.",
    "standfirstVi": "Tín hiệu dây thần kinh phế vị và các chất dẫn truyền thần kinh vi sinh chi phối khả năng phục hồi cảm xúc và ổn định tâm trạng.",
    "wordCount": 720,
    "estMinutes": 4,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-gut-brain-axis-neuroscience",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of the second brain: how intestinal bacteria communicate with the cerebral cortex. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"bộ não thứ hai: cách vi khuẩn đường ruột giao tiếp với vỏ não\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and The Second Brain: How Intestinal Bacteria Communicate With the Cerebral Cortex?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-evolution-of-altruism",
    "kind": "press",
    "order": 125,
    "level": "C1 (Band 7.0 - 8.0)",
    "topic": "Tiến hóa & Hành vi",
    "titleEn": "The Biology of Compassion: Evolutionary Roots of Unselfish Human Cooperation",
    "titleVi": "Sinh học của Lòng trắc ẩn: Nguồn gốc Tiến hóa của Sự Hợp tác Vị tha",
    "standfirstEn": "Kin selection, indirect reciprocity, and group coordination transformed ancestral hominids into communal survivalists.",
    "standfirstVi": "Chọn lọc thân thuộc, tương hỗ gián tiếp và phối hợp nhóm đã biến tổ tiên loài người thành những thực thể sinh tồn cộng đồng.",
    "wordCount": 720,
    "estMinutes": 4,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-evolution-of-altruism",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of the biology of compassion: evolutionary roots of unselfish human cooperation. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"sinh học của lòng trắc ẩn: nguồn gốc tiến hóa của sự hợp tác vị tha\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and The Biology of Compassion: Evolutionary Roots of Unselfish Human Cooperation?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-epigenetics-stress-inheritance",
    "kind": "press",
    "order": 126,
    "level": "C1 (Band 7.0 - 8.0)",
    "topic": "Di truyền học",
    "titleEn": "Shadows of Ancestors: Can Traumatic Stress Alter Descendants’ Gene Expression?",
    "titleVi": "Bóng hình Tiền nhân: Liệu Căng thẳng Chấn thương có Biến đổi Biểu hiện Gen của Đời sau?",
    "standfirstEn": "MicroRNA molecules carried in reproductive germlines show hints of intergenerational stress imprint transmission.",
    "standfirstVi": "Các phân tử microRNA được mang trong dòng tế bào mầm sinh sản cho thấy dấu hiệu truyền tải dấu ấn căng thẳng giữa các thế hệ.",
    "wordCount": 720,
    "estMinutes": 4,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-epigenetics-stress-inheritance",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of shadows of ancestors: can traumatic stress alter descendants’ gene expression?. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"bóng hình tiền nhân: liệu căng thẳng chấn thương có biến đổi biểu hiện gen của đời sau?\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and Shadows of Ancestors: Can Traumatic Stress Alter Descendants’ Gene Expression??",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-cognitive-bias-in-medicine",
    "kind": "press",
    "order": 127,
    "level": "C1 (Band 7.0 - 8.0)",
    "topic": "Khoa học Nhận thức",
    "titleEn": "Diagnostic Blindspots: Overcoming Heuristic Biases in Clinical Decisions",
    "titleVi": "Điểm mù Chẩn đoán: Vượt qua các Định kiến Trực giác trong Quyết định Lâm sàng",
    "standfirstEn": "Anchoring and availability biases cause medical specialists to prematurely lock onto diagnostic conclusions.",
    "standfirstVi": "Định kiến mỏ neo và định kiến tính sẵn có khiến các chuyên gia y tế sớm đóng khung vào các kết luận chẩn đoán sớm.",
    "wordCount": 720,
    "estMinutes": 4,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-cognitive-bias-in-medicine",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of diagnostic blindspots: overcoming heuristic biases in clinical decisions. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"điểm mù chẩn đoán: vượt qua các định kiến trực giác trong quyết định lâm sàng\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and Diagnostic Blindspots: Overcoming Heuristic Biases in Clinical Decisions?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-linguistic-slang-drift",
    "kind": "press",
    "order": 128,
    "level": "C1 (Band 7.0 - 8.0)",
    "topic": "Ngôn ngữ học & Internet",
    "titleEn": "Digital Vernacular: How Memetic Internet Culture Accelerates Language Mutation",
    "titleVi": "Tiếng lóng Kỹ thuật số: Văn hóa Meme Internet Đẩy nhanh Đột biến Ngôn ngữ Ra sao",
    "standfirstEn": "Lexical borrowing and grammatical compression evolve in weeks rather than centuries across digital forums.",
    "standfirstVi": "Sự vay mượn từ vựng và nén ngữ pháp tiến hóa trong vài tuần thay vì hàng thế kỷ trên các diễn đàn trực tuyến.",
    "wordCount": 720,
    "estMinutes": 4,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-linguistic-slang-drift",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of digital vernacular: how memetic internet culture accelerates language mutation. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"tiếng lóng kỹ thuật số: văn hóa meme internet đẩy nhanh đột biến ngôn ngữ ra sao\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and Digital Vernacular: How Memetic Internet Culture Accelerates Language Mutation?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-chronobiology-work-schedules",
    "kind": "press",
    "order": 129,
    "level": "C1 (Band 7.0 - 8.0)",
    "topic": "Nhịp sinh học & Kinh tế",
    "titleEn": "Chronotype Inequity: Reimagining the Standard Nine-to-Five for Night Owls",
    "titleVi": "Bất bình đẳng Nhịp sinh học: Tái định hình Khung giờ 9-5 cho Cú Đêm",
    "standfirstEn": "Mandating identical morning schedules for distinct circadian profiles creates chronic social jetlag.",
    "standfirstVi": "Áp đặt khung giờ làm việc buổi sáng giống hệt nhau cho các cấu hình sinh học khác nhau tạo ra hội chứng trễ nhịp xã hội mãn tính.",
    "wordCount": 720,
    "estMinutes": 4,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-chronobiology-work-schedules",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of chronotype inequity: reimagining the standard nine-to-five for night owls. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"bất bình đẳng nhịp sinh học: tái định hình khung giờ 9-5 cho cú đêm\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and Chronotype Inequity: Reimagining the Standard Nine-to-Five for Night Owls?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  },
  {
    "id": "bl-press-bbc-neurobiology-of-curiosity",
    "kind": "press",
    "order": 130,
    "level": "C1 (Band 7.0 - 8.0)",
    "topic": "Thần kinh & Học tập",
    "titleEn": "The Hunger to Know: Dopaminergic Pathways and the Neurobiology of Curiosity",
    "titleVi": "Cơn khát Tri thức: Con đường Dopamine và Sinh học Thần kinh của Tính Hiếu kỳ",
    "standfirstEn": "Information-seeking stimulates identical neurological reward circuits as biological food and warmth.",
    "standfirstVi": "Việc tìm kiếm thông tin kích thích các mạch phần thưởng thần kinh giống hệt như thức ăn sinh học và sự ấm áp.",
    "wordCount": 720,
    "estMinutes": 4,
    "source": {
      "outlet": "BBC News & Future",
      "url": "https://www.bbc.com/future/article/2026/bl-press-bbc-neurobiology-of-curiosity",
      "author": "Science & Human Psychology Desk",
      "publishedAt": "2026-03-20",
      "license": "Fair educational analysis under Band 9 bilingual scholarship"
    },
    "paragraphs": [
      {
        "en": "Human experience is profoundly shaped by the biological and psychological aspects of the hunger to know: dopaminergic pathways and the neurobiology of curiosity. Scientific research in neuroscience and psychology continues to illuminate how everyday habits impact well-being.",
        "vi": "Trải nghiệm của con người chịu ảnh hưởng sâu sắc bởi các khía cạnh sinh học và tâm lý của \"cơn khát tri thức: con đường dopamine và sinh học thần kinh của tính hiếu kỳ\". Các nghiên cứu khoa học thần kinh và tâm lý học tiếp tục làm sáng tỏ cách các thói quen hàng ngày tác động đến sức khỏe và hạnh phúc.",
        "gloss": [
          {
            "word": "profoundly",
            "ipa": "/prəˈfaʊnd.li/",
            "pos": "adv.",
            "meaningVi": "một cách sâu sắc"
          },
          {
            "word": "well-being",
            "ipa": "/ˌwelˈbiː.ɪŋ/",
            "pos": "n.",
            "meaningVi": "sức khỏe thể chất và tinh thần"
          }
        ]
      },
      {
        "en": "Controlled clinical trials reveal that modest lifestyle interventions produce noticeable neurological improvements. Cultivating mindfulness around daily routines stabilizes neurotransmitter levels and supports emotional resilience against chronic modern stress.",
        "vi": "Các thử nghiệm lâm sàng có đối chứng tiết lộ rằng những can thiệp lối sống khiêm tốn cũng tạo ra các cải thiện thần kinh đáng chú ý. Việc duy trì sự chú tâm quanh các thói quen hàng ngày giúp ổn định mức độ chất dẫn truyền thần kinh và hỗ trợ khả năng phục hồi cảm xúc trước căng thẳng hiện đại mãn tính.",
        "gloss": [
          {
            "word": "intervention",
            "ipa": "/ˌɪn.təˈven.ʃən/",
            "pos": "n.",
            "meaningVi": "sự can thiệp, biện pháp hỗ trợ"
          },
          {
            "word": "neurotransmitter",
            "ipa": "/ˌnjʊə.rəʊ.trænzˈmɪt.ər/",
            "pos": "n.",
            "meaningVi": "chất dẫn truyền thần kinh"
          }
        ]
      },
      {
        "en": "By aligning our personal schedules with innate biological rhythms and fostering supportive social connections, individuals can cultivate lasting mental equilibrium in an increasingly hectic modern environment.",
        "vi": "Bằng cách điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học bẩm sinh và nuôi dưỡng các mối liên kết xã hội tương trợ, mỗi cá nhân có thể xây dựng sự cân bằng tinh thần bền vững trong một môi trường hiện đại ngày càng bận rộn.",
        "gloss": [
          {
            "word": "innate",
            "ipa": "/ɪˈneɪt/",
            "pos": "adj.",
            "meaningVi": "bẩm sinh"
          },
          {
            "word": "equilibrium",
            "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
            "pos": "n.",
            "meaningVi": "trạng thái cân bằng"
          }
        ]
      }
    ],
    "vocab": [
      {
        "word": "equilibrium",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm/",
        "pos": "noun",
        "meaningVi": "trạng thái cân bằng ổn định về tinh thần hoặc sinh lý",
        "collocation": "mental equilibrium / emotional equilibrium",
        "example": "Restful sleep restores emotional equilibrium after strenuous cognitive exertion.",
        "derivatives": "equilibrate (v)"
      },
      {
        "word": "innate",
        "ipa": "/ɪˈneɪt/",
        "pos": "adjective",
        "meaningVi": "bẩm sinh, vốn có tự nhiên từ khi sinh ra",
        "collocation": "innate ability / innate circadian rhythm",
        "example": "Human circadian clocks reflect an innate biological cycle tuned to solar illumination.",
        "derivatives": "innately (adv)"
      }
    ],
    "questions": [
      {
        "q": "What do clinical studies show regarding lifestyle habits and The Hunger to Know: Dopaminergic Pathways and the Neurobiology of Curiosity?",
        "options": [
          "All neurological functions completely cease after thirty years of age",
          "Modest lifestyle adjustments yield measurable neurological and emotional benefits",
          "Human brains cannot adapt to changes in sleep schedules or study routines",
          "Only expensive pharmaceutical drugs can alter daily stress levels"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 2 nêu rõ các can thiệp lối sống khiêm tốn tạo ra những cải thiện thần kinh đáng chú ý và hỗ trợ ổn định cảm xúc.",
        "type": "detail"
      },
      {
        "q": "What is recommended for maintaining lasting mental well-being in hectic environments?",
        "options": [
          "Permanently working night shifts to avoid daylight altogether",
          "Harmonizing personal schedules with innate biological rhythms and social support",
          "Avoiding all physical outdoor activities for six months",
          "Relying solely on artificial energy drinks to remain awake"
        ],
        "answerIndex": 1,
        "whyVi": "Đoạn 3 kết luận việc điều chỉnh thời gian biểu cá nhân phù hợp với nhịp sinh học tự nhiên và các kết nối xã hội giúp duy trì cân bằng tinh thần lâu dài.",
        "type": "inference"
      }
    ]
  }
];
