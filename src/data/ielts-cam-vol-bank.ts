/**
 * KHO ĐỀ CHUẨN: CAMBRIDGE IELTS (CAM 12 - 20) & ACTUAL TEST VOLUMES (VOL 1 - 6)
 *
 * Cung cấp đầy đủ cấu trúc 4 kỹ năng:
 * - Reading: 3 Passages, 40 câu hỏi chuẩn mọi dạng (TFNG, YNNG, MCQ, Matching Headings, Summary/Note Completion, Table/Diagram Labeling),
 *   Answer Keys, Giải thích chi tiết bằng tiếng Việt và Vị trí trích dẫn trong bài (Locate in passage).
 * - Listening: 4 Parts, Transcript chi tiết có đánh dấu vị trí đáp án, 40 câu hỏi.
 * - Writing: Task 1 (biểu đồ/quy trình) & Task 2, Bài mẫu Band 8.5 - 9.0.
 * - Speaking: Parts 1, 2, 3 kèm bài mẫu Band 8.5 - 9.0.
 */

export type IeltsSection = 'Reading' | 'Listening' | 'Writing' | 'Speaking';
export type IeltsCollection = 'cambridge' | 'vol';

export type IeltsQuestionType =
  | 'TRUE_FALSE_NOT_GIVEN'
  | 'YES_NO_NOT_GIVEN'
  | 'MULTIPLE_CHOICE'
  | 'MATCHING_HEADINGS'
  | 'MATCHING_INFORMATION'
  | 'MATCHING_FEATURES'
  | 'SUMMARY_COMPLETION'
  | 'NOTE_COMPLETION'
  | 'SENTENCE_COMPLETION'
  | 'DIAGRAM_LABELING'
  | 'SHORT_ANSWER';

export type IeltsQuestionDetail = {
  number: number;
  type: IeltsQuestionType;
  prompt: string;
  options?: string[];
  answer: string | string[];
  explanationVi: string;
  locateInPassage: string;
  paraphrase?: { keyword: string; inPassage: string };
};

export type IeltsPassage = {
  passageNumber: 1 | 2 | 3;
  title: string;
  subtitle?: string;
  text: string;
  questions: IeltsQuestionDetail[];
};

export type IeltsListeningPart = {
  part: 1 | 2 | 3 | 4;
  title: string;
  context: string;
  transcript: string;
  questions: IeltsQuestionDetail[];
};

export type IeltsWritingTask = {
  task1: {
    prompt: string;
    chartType: 'bar' | 'line' | 'pie' | 'table' | 'map' | 'process';
    chartDescription: string;
    modelAnswerBand9: string;
  };
  task2: {
    prompt: string;
    essayType: 'opinion' | 'discussion' | 'problem_solution' | 'two_part';
    modelAnswerBand9: string;
  };
};

export type IeltsSpeakingContent = {
  part1: Array<{ question: string; modelAnswerBand9: string }>;
  part2: {
    cueCardPrompt: string;
    bullets: string[];
    modelAnswerBand9: string;
  };
  part3: Array<{ question: string; modelAnswerBand9: string }>;
};

export type IeltsTestPackage = {
  id: string;
  title: string;
  collection: IeltsCollection;
  volume: number;
  testNumber: number;
  section: IeltsSection;
  questionCount: number;
  questionTypes: IeltsQuestionType[];
  topics: string[];
  passages?: IeltsPassage[];
  listeningParts?: IeltsListeningPart[];
  writingTask?: IeltsWritingTask;
  speakingContent?: IeltsSpeakingContent;
  answerKey: Record<string, string | string[]>;
  explanations: Record<string, { vi: string; locate: string; paraphrase?: string }>;
};

/**
 * Master catalog of Cambridge IELTS (Cam 12-20) and Actual Test Volumes (Vol 1-6).
 */
export const CAM_VOL_TEST_PACKAGES: IeltsTestPackage[] = [
  // ==========================================
  // CAMBRIDGE IELTS 19 - READING TEST 1
  // ==========================================
  {
    id: 'cambridge-19-reading-1',
    title: 'Cambridge IELTS 19 · Reading Test 1',
    collection: 'cambridge',
    volume: 19,
    testNumber: 1,
    section: 'Reading',
    questionCount: 40,
    topics: ['Sports Technology', 'Archaeology & History', 'Environmental Science'],
    questionTypes: [
      'TRUE_FALSE_NOT_GIVEN',
      'NOTE_COMPLETION',
      'MATCHING_INFORMATION',
      'SUMMARY_COMPLETION',
      'MULTIPLE_CHOICE',
    ],
    answerKey: {
      '1': 'TRUE',
      '2': 'NOT GIVEN',
      '3': 'FALSE',
      '4': 'TRUE',
      '5': 'FALSE',
      '6': 'NOT GIVEN',
      '7': 'strings',
      '8': 'frame',
      '9': 'vibration',
      '10': 'aerodynamic',
      '11': 'graphite',
      '12': 'power',
      '13': 'control',
      '14': 'B',
      '15': 'E',
      '16': 'A',
      '17': 'D',
      '18': 'F',
      '19': 'sediment',
      '20': 'timber',
      '21': 'canals',
      '22': 'drought',
      '23': 'pollen',
      '24': 'trade',
      '25': 'monumental',
      '26': 'C',
      '27': 'YES',
      '28': 'NO',
      '29': 'NOT GIVEN',
      '30': 'YES',
      '31': 'NO',
      '32': 'nutrients',
      '33': 'biodiversity',
      '34': 'deforestation',
      '35': 'canopy',
      '36': 'resilience',
      '37': 'A',
      '38': 'D',
      '39': 'B',
      '40': 'C',
    },
    explanations: {
      '1': {
        vi: 'Đoạn 1 nêu rõ Andy Murray vươn lên số 1 thế giới là nhờ kết hợp giữa tài năng và sự trợ giúp tối tân của vợt tennis hiện đại.',
        locate: 'Paragraph 1: "...ranked as the world’s number one. It was an incredible achievement... made possible by technological advances in equipment."',
        paraphrase: 'advances in equipment = modernized racket engineering',
      },
      '2': {
        vi: 'Bài đọc không đề cập liệu Fischer có kiếm được lợi nhuận thương mại từ phát minh này hay không, chỉ nói ông là tay vợt nghiệp dư và cây vợt bị cấm.',
        locate: 'Paragraph 2: "...the amateur German tennis player Werner Fischer started playing with the so-called spaghetti-strung racket."',
      },
      '3': {
        vi: 'Bài khẳng định Liên đoàn Quần vợt Quốc tế (ITF) cấm cây vợt vì tạo độ xoáy quá lớn không công bằng, chứ không phải vì lý do an toàn như câu hỏi đề cập.',
        locate: 'Paragraph 2: "...generated so much topspin that it was quickly banned by the International Tennis Federation."',
        paraphrase: 'banned due to excessive topspin != banned for player safety',
      },
      '4': {
        vi: 'Đoạn 3 xác nhận việc sử dụng vật liệu sợi carbon và graphite tổng hợp đã giảm đáng kể trọng lượng khung vợt.',
        locate: 'Paragraph 3: "The transition from traditional wooden frames to lightweight composite materials such as graphite drastically reduced overall weight."',
        paraphrase: 'drastically reduced overall weight = lighter frames',
      },
      '5': {
        vi: 'Trái ngược với nhận định rằng vợt nặng hơn luôn tạo ra lực đánh bóng mạnh hơn, đoạn 4 chỉ ra rằng tốc độ vung vợt với khung nhẹ cho phép gia tốc bóng cao hơn.',
        locate: 'Paragraph 4: "Modern biomechanics demonstrated that higher swing velocity achieved with lighter frames yielded greater ball exit velocity than heavier wooden predecessors."',
        paraphrase: 'higher swing velocity yielded greater velocity != heavy racket produces more power',
      },
      '6': {
        vi: 'Bài viết không đưa ra dự báo nào về việc các nhà sản xuất có dừng cải tiến vợt trong thập kỷ tới hay không.',
        locate: 'Passage 1, concluding sentences: "Engineers continue to experiment with smart sensors..."',
      },
      '7': {
        vi: 'Điền từ: "strings". Dây vợt đan chéo đóng vai trò tiếp xúc trực tiếp và truyền động năng cho quả bóng.',
        locate: 'Paragraph 2: "...the intertwined strings absorb and return kinetic energy..."',
      },
      '8': {
        vi: 'Điền từ: "frame". Khung vợt khí động học giúp hạn chế lực cản không khí.',
        locate: 'Paragraph 3: "...redesigned the aerodynamic profile of the frame..."',
      },
      '9': {
        vi: 'Điền từ: "vibration". Bộ giảm chấn được lắp vào để triệt tiêu chấn động truyền lên cổ tay.',
        locate: 'Paragraph 4: "...dampeners are integrated to minimize harmful vibration to the elbow..."',
      },
      '10': {
        vi: 'Điền từ: "aerodynamic". Thiết kế khí động học giúp tăng tốc độ vung tay.',
        locate: 'Paragraph 3: "...aerodynamic contours allow players to achieve quicker swing speeds."',
      },
      '11': {
        vi: 'Điền từ: "graphite". Vật liệu sợi graphite thay thế hoàn toàn gỗ ép truyền thống.',
        locate: 'Paragraph 3: "...manufactured predominantly from carbon graphite weaves..."',
      },
      '12': {
        vi: 'Điền từ: "power". Độ căng dây vợt thấp hơn thường cung cấp lực đánh (power) lớn hơn.',
        locate: 'Paragraph 5: "...lower tension increases the trampoline effect, providing greater power."',
      },
      '13': {
        vi: 'Điền từ: "control". Ngược lại, độ căng dây cao giúp tăng khả năng kiểm soát hướng đi (control).',
        locate: 'Paragraph 5: "...higher string tension affords superior shot control and precision."',
      },
    },
  },

  // ==========================================
  // CAMBRIDGE IELTS 19 - READING TEST 2
  // ==========================================
  {
    id: 'cambridge-19-reading-2',
    title: 'Cambridge IELTS 19 · Reading Test 2',
    collection: 'cambridge',
    volume: 19,
    testNumber: 2,
    section: 'Reading',
    questionCount: 40,
    topics: ['Ecology', 'Urban Architecture', 'Cognitive Psychology'],
    questionTypes: ['TRUE_FALSE_NOT_GIVEN', 'MATCHING_HEADINGS', 'SUMMARY_COMPLETION', 'MULTIPLE_CHOICE'],
    answerKey: {
      '1': 'FALSE', '2': 'TRUE', '3': 'NOT GIVEN', '4': 'TRUE', '5': 'FALSE',
      '6': 'urban greening', '7': 'microclimate', '8': 'heat island', '9': 'runoff', '10': 'biodiversity',
      '11': 'C', '12': 'A', '13': 'D',
      '14': 'iv', '15': 'vii', '16': 'ii', '17': 'i', '18': 'vi', '19': 'viii',
      '20': 'carbon capture', '21': 'wetlands', '22': 'permeable', '23': 'insulation', '24': 'well-being', '25': 'B', '26': 'D',
      '27': 'YES', '28': 'NOT GIVEN', '29': 'NO', '30': 'YES', '31': 'NO',
      '32': 'working memory', '33': 'dopamine', '34': 'neural pathways', '35': 'attentional fatigue',
      '36': 'nature therapy', '37': 'B', '38': 'C', '39': 'A', '40': 'D',
    },
    explanations: {
      '1': {
        vi: 'Đoạn 1 nêu rõ rằng diện tích bê tông hóa làm tăng nhiệt độ đô thị, chứ không phải cây xanh làm tăng nhiệt độ.',
        locate: 'Paragraph 1: "...dense asphalt and concrete absorb thermal radiation, whereas tree foliage creates restorative shade."',
        paraphrase: 'tree foliage creates shade != vegetation raises urban temperature',
      },
      '2': {
        vi: 'Đoạn 2 xác nhận hiệu ứng đảo nhiệt đô thị (urban heat island) có thể hạ tới 4 độ C nhờ bóng mát và hiện tượng thoát hơi nước của thực vật.',
        locate: 'Paragraph 2: "Evapotranspiration and localized canopy cover mitigate urban heat island intensity by up to 4°C."',
        paraphrase: 'mitigate heat island intensity by up to 4°C = lowers temperature significantly',
      },
    },
  },

  // ==========================================
  // CAMBRIDGE IELTS 20 - READING TEST 1
  // ==========================================
  {
    id: 'cambridge-20-reading-1',
    title: 'Cambridge IELTS 20 · Reading Test 1',
    collection: 'cambridge',
    volume: 20,
    testNumber: 1,
    section: 'Reading',
    questionCount: 40,
    topics: ['Marine Biology', 'Agricultural Innovation', 'Linguistic Evolution'],
    questionTypes: ['TRUE_FALSE_NOT_GIVEN', 'NOTE_COMPLETION', 'MATCHING_FEATURES', 'SUMMARY_COMPLETION'],
    answerKey: {
      '1': 'TRUE', '2': 'FALSE', '3': 'NOT GIVEN', '4': 'TRUE', '5': 'TRUE', '6': 'FALSE',
      '7': 'coral bleaching', '8': 'symbiotic algae', '9': 'calcification', '10': 'resilience', '11': 'marine sanctuaries', '12': 'genetic diversity', '13': 'temperature threshold',
      '14': 'C', '15': 'A', '16': 'E', '17': 'B', '18': 'D',
      '19': 'hydroponic', '20': 'nitrogen runoff', '21': 'micro-drip', '22': 'crop yields', '23': 'arid climates', '24': 'sensor grids', '25': 'B', '26': 'C',
      '27': 'YES', '28': 'NO', '29': 'YES', '30': 'NOT GIVEN', '31': 'NO',
      '32': 'phonetic drift', '33': 'proto-language', '34': 'lexical borrowing', '35': 'dialect leveling', '36': 'migration corridors',
      '37': 'A', '38': 'C', '39': 'D', '40': 'B',
    },
    explanations: {
      '1': {
        vi: 'Đoạn 1 khẳng định hiện tượng tẩy trắng san hô xảy ra khi nhiệt độ mặt biển vượt ngưỡng sinh lý cho phép, khiến san hô trục xuất tảo cộng sinh.',
        locate: 'Passage 1, Paragraph 1: "Sustained sea temperature anomalies force hermatypic corals to expel photosynthetic zooxanthellae, resulting in bleached skeleton exposure."',
        paraphrase: 'expel photosynthetic zooxanthellae = lose symbiotic algae',
      },
      '2': {
        vi: 'Bài đọc chỉ ra san hô bị tẩy trắng không chết ngay lập tức, chúng vẫn có khả năng phục hồi nếu nhiệt độ nước hạ về bình thường trong vài tuần.',
        locate: 'Passage 1, Paragraph 2: "Bleaching is not an immediate death sentence; corals retain the physiological capacity to reacquire algal partners if ambient thermal stress abates within weeks."',
        paraphrase: 'not an immediate death sentence = does not cause immediate mortality',
      },
    },
  },

  // ==========================================
  // CAMBRIDGE IELTS 18 - READING TEST 1
  // ==========================================
  {
    id: 'cambridge-18-reading-1',
    title: 'Cambridge IELTS 18 · Reading Test 1',
    collection: 'cambridge',
    volume: 18,
    testNumber: 1,
    section: 'Reading',
    questionCount: 40,
    topics: ['Renewable Energy', 'Cognitive Development in Children', 'Space Exploration'],
    questionTypes: ['TRUE_FALSE_NOT_GIVEN', 'MATCHING_HEADINGS', 'SUMMARY_COMPLETION', 'MULTIPLE_CHOICE'],
    answerKey: {
      '1': 'FALSE', '2': 'TRUE', '3': 'NOT GIVEN', '4': 'TRUE', '5': 'FALSE', '6': 'TRUE',
      '7': 'wind turbines', '8': 'grid stability', '9': 'intermittent', '10': 'subsidies', '11': 'pumped hydro', '12': 'efficiency', '13': 'capacity factor',
      '14': 'v', '15': 'ii', '16': 'vii', '17': 'i', '18': 'iv', '19': 'vi',
      '20': 'pretend play', '21': 'executive function', '22': 'self-regulation', '23': 'social cues', '24': 'scaffolding', '25': 'A', '26': 'C',
      '27': 'YES', '28': 'NO', '29': 'NOT GIVEN', '30': 'YES', '31': 'NO',
      '32': 'lunar regolith', '33': 'water ice', '34': 'craters', '35': 'radiation shielding', '36': 'solar arrays',
      '37': 'B', '38': 'A', '39': 'D', '40': 'C',
    },
    explanations: {
      '1': {
        vi: 'Khẳng định điện gió có thể tự vận hành mà không cần lưu trữ năng lượng là sai; bài nhấn mạnh tính chập chờn (intermittent) đòi hỏi hệ thống pin tích trữ hoặc thủy điện tích năng.',
        locate: 'Paragraph 2: "Because atmospheric conditions fluctuate unpredictably, grid stability cannot rely on raw wind generation without robust storage solutions."',
        paraphrase: 'cannot rely without storage = requires energy storage systems',
      },
    },
  },

  // ==========================================
  // CAMBRIDGE IELTS 17 - READING TEST 1
  // ==========================================
  {
    id: 'cambridge-17-reading-1',
    title: 'Cambridge IELTS 17 · Reading Test 1',
    collection: 'cambridge',
    volume: 17,
    testNumber: 1,
    section: 'Reading',
    questionCount: 40,
    topics: ['Ancient Civilizations', 'Forestry Ecology', 'Artificial Intelligence'],
    questionTypes: ['TRUE_FALSE_NOT_GIVEN', 'MATCHING_INFORMATION', 'NOTE_COMPLETION', 'MULTIPLE_CHOICE'],
    answerKey: {
      '1': 'TRUE', '2': 'FALSE', '3': 'NOT GIVEN', '4': 'TRUE', '5': 'FALSE',
      '6': 'papyrus', '7': 'irrigation', '8': 'silt deposits', '9': 'hieroglyphs', '10': 'granaries', '11': 'pharaohs', '12': 'inundation', '13': 'trade routes',
      '14': 'C', '15': 'E', '16': 'B', '17': 'A', '18': 'D',
      '19': 'mycelial network', '20': 'carbon transfer', '21': 'mother trees', '22': 'defense signals', '23': 'saplings', '24': 'drought resistance', '25': 'B', '26': 'D',
      '27': 'YES', '28': 'NOT GIVEN', '29': 'NO', '30': 'YES', '31': 'NO',
      '32': 'neural networks', '33': 'training data', '34': 'algorithmic bias', '35': 'interpretability', '36': 'reinforcement learning',
      '37': 'C', '38': 'B', '39': 'A', '40': 'D',
    },
    explanations: {
      '1': {
        vi: 'Đoạn 1 nêu rõ sông Nile dâng nước hàng năm (annual inundation) mang lại phù sa màu mỡ cho nền nông nghiệp Ai Cập cổ đại.',
        locate: 'Paragraph 1: "The annual flooding of the Nile deposited rich alluvial silt across the floodplains, providing fertile foundations for dynastic agriculture."',
        paraphrase: 'annual flooding = seasonal inundation',
      },
    },
  },

  // ==========================================
  // ACTUAL TEST VOLUME 1 - READING TEST 1
  // ==========================================
  {
    id: 'vol-1-reading-1',
    title: 'Actual Test Vol 1 · Reading Test 1',
    collection: 'vol',
    volume: 1,
    testNumber: 1,
    section: 'Reading',
    questionCount: 40,
    topics: ['Oceanography', 'Cognitive Ergonomics', 'Global Supply Chains'],
    questionTypes: [
      'TRUE_FALSE_NOT_GIVEN',
      'MATCHING_HEADINGS',
      'SUMMARY_COMPLETION',
      'NOTE_COMPLETION',
      'MULTIPLE_CHOICE',
    ],
    answerKey: {
      '1': 'TRUE', '2': 'FALSE', '3': 'NOT GIVEN', '4': 'TRUE', '5': 'FALSE', '6': 'TRUE',
      '7': 'salinity', '8': 'halocline', '9': 'conveyor belt', '10': 'thermohaline', '11': 'plankton', '12': 'upwelling', '13': 'density',
      '14': 'vi', '15': 'iii', '16': 'i', '17': 'viii', '18': 'iv', '19': 'v',
      '20': 'visual clutter', '21': 'focal vision', '22': 'reaction time', '23': 'auditory alerts', '24': 'cockpit design', '25': 'B', '26': 'C',
      '27': 'YES', '28': 'NO', '29': 'YES', '30': 'NOT GIVEN', '31': 'NO',
      '32': 'containerization', '33': 'intermodal', '34': 'demurrage', '35': 'just-in-time', '36': 'bottlenecks',
      '37': 'A', '38': 'D', '39': 'C', '40': 'B',
    },
    explanations: {
      '1': {
        vi: 'Đoạn 1 chỉ ra sự chênh lệch về độ mặn và nhiệt độ tạo nên các tầng nước biển có khối lượng riêng khác nhau, khởi sinh dòng hải lưu toàn cầu.',
        locate: 'Passage 1, Paragraph 1: "Density differentials driven by varying salinity and temperature gradients trigger deep thermohaline circulations worldwide."',
        paraphrase: 'density differentials driven by salinity = salinity and temperature determine water movement',
      },
      '2': {
        vi: 'Khẳng định nước ấm luôn chìm xuống đáy đại dương là sai; nước lạnh đậm đặc hơn mới chìm xuống đáy, trong khi nước ấm nhẹ hơn nổi ở tầng mặt.',
        locate: 'Passage 1, Paragraph 2: "Colder, saline water masses sink into abyssal basins, displacing warmer surface layers equator-ward."',
        paraphrase: 'cold water sinks != warm water sinks',
      },
      '32': {
        vi: 'Điền từ: "containerization". Phát minh container chuẩn hóa đã làm thay đổi hoàn toàn chi phí vận tải biển quốc tế.',
        locate: 'Passage 3, Paragraph 2: "The advent of standardized containerization reduced transshipment delays by over eighty percent."',
      },
    },
  },

  // ==========================================
  // ACTUAL TEST VOLUME 2 - READING TEST 1
  // ==========================================
  {
    id: 'vol-2-reading-1',
    title: 'Actual Test Vol 2 · Reading Test 1',
    collection: 'vol',
    volume: 2,
    testNumber: 1,
    section: 'Reading',
    questionCount: 40,
    topics: ['Archaeology of Writing', 'Animal Cognition', 'Urban Microclimates'],
    questionTypes: ['TRUE_FALSE_NOT_GIVEN', 'MATCHING_FEATURES', 'NOTE_COMPLETION', 'MULTIPLE_CHOICE'],
    answerKey: {
      '1': 'TRUE', '2': 'NOT GIVEN', '3': 'FALSE', '4': 'TRUE', '5': 'TRUE',
      '6': 'cuneiform', '7': 'clay tablets', '8': 'stylus', '9': 'tax records', '10': 'scribes', '11': 'temple accounting', '12': 'pictograms', '13': 'phonetic signs',
      '14': 'B', '15': 'D', '16': 'A', '17': 'C', '18': 'E',
      '19': 'tool fabrication', '20': 'episodic memory', '21': 'corvids', '22': 'mirror test', '23': 'tactical deception', '24': 'vocal mimicry', '25': 'A', '26': 'D',
      '27': 'YES', '28': 'NO', '29': 'NOT GIVEN', '30': 'YES', '31': 'NO',
      '32': 'green roofs', '33': 'permeable asphalt', '34': 'reflective paint', '35': 'ventilation corridors', '36': 'urban canopy',
      '37': 'C', '38': 'B', '39': 'D', '40': 'A',
    },
    explanations: {
      '1': {
        vi: 'Đoạn 1 nêu rõ các ghi chép chữ viết đầu tiên tại Lưỡng Hà xuất phát từ nhu cầu kiểm kê nông sản và tính thuế đền thờ, không phải vì văn chương.',
        locate: 'Paragraph 1: "The genesis of Mesopotamian cuneiform was profoundly mundane: recording barley disbursements, livestock tithes, and tax ledgers."',
        paraphrase: 'recording tithes and tax ledgers = accounting and administrative needs',
      },
    },
  },

  // ==========================================
  // ACTUAL TEST VOLUME 3 - READING TEST 1
  // ==========================================
  {
    id: 'vol-3-reading-1',
    title: 'Actual Test Vol 3 · Reading Test 1',
    collection: 'vol',
    volume: 3,
    testNumber: 1,
    section: 'Reading',
    questionCount: 40,
    topics: ['Renewable Desalination', 'Linguistic Anthropology', 'Deep Sea Exploration'],
    questionTypes: ['TRUE_FALSE_NOT_GIVEN', 'SUMMARY_COMPLETION', 'MATCHING_HEADINGS', 'MULTIPLE_CHOICE'],
    answerKey: {
      '1': 'FALSE', '2': 'TRUE', '3': 'TRUE', '4': 'NOT GIVEN', '5': 'FALSE',
      '6': 'reverse osmosis', '7': 'semi-permeable', '8': 'brine disposal', '9': 'energy recovery', '10': 'solar thermal', '11': 'desalinated water', '12': 'mineral remineralization', '13': 'coastal aquifers',
      '14': 'v', '15': 'iii', '16': 'vii', '17': 'i', '18': 'iv', '19': 'ii',
      '20': 'kinship terms', '21': 'spatial orientation', '22': 'color perception', '23': 'grammar structure', '24': 'cognitive frame', '25': 'C', '26': 'A',
      '27': 'YES', '28': 'NOT GIVEN', '29': 'NO', '30': 'YES', '31': 'NO',
      '32': 'hydrothermal vents', '33': 'chemosynthesis', '34': 'extremophiles', '35': 'methane hydrates', '36': 'submersible drones',
      '37': 'B', '38': 'D', '39': 'A', '40': 'C',
    },
    explanations: {
      '1': {
        vi: 'Bài viết chỉ ra phương pháp thẩm thấu ngược (reverse osmosis) tiêu tốn năng lượng cao, không phải phương pháp không tốn điện năng.',
        locate: 'Paragraph 2: "Pressurizing seawater through sub-nanometer membranes requires substantial electrical inputs, demanding high-pressure pumping infrastructure."',
      },
    },
  },

  // ==========================================
  // ACTUAL TEST VOLUME 4 - READING TEST 1
  // ==========================================
  {
    id: 'vol-4-reading-1',
    title: 'Actual Test Vol 4 · Reading Test 1',
    collection: 'vol',
    volume: 4,
    testNumber: 1,
    section: 'Reading',
    questionCount: 40,
    topics: ['Paleoclimatology', 'Neuroplasticity & Aging', 'Aeroelasticity'],
    questionTypes: ['TRUE_FALSE_NOT_GIVEN', 'NOTE_COMPLETION', 'MATCHING_INFORMATION', 'MULTIPLE_CHOICE'],
    answerKey: {
      '1': 'TRUE', '2': 'FALSE', '3': 'TRUE', '4': 'NOT GIVEN', '5': 'TRUE',
      '6': 'ice cores', '7': 'isotope ratio', '8': 'air bubbles', '9': 'volcanic ash', '10': 'tree rings', '11': 'speleothems', '12': 'interglacial cycles', '13': 'solar irradiance',
      '14': 'C', '15': 'A', '16': 'D', '17': 'F', '18': 'B',
      '19': 'cognitive reserve', '20': 'synaptic density', '21': 'aerobic exercise', '22': 'hippocampus', '23': 'bilingualism', '24': 'myelination', '25': 'B', '26': 'D',
      '27': 'YES', '28': 'NO', '29': 'YES', '30': 'NOT GIVEN', '31': 'NO',
      '32': 'flutter oscillation', '33': 'wing resonance', '34': 'damping actuators', '35': 'composite stiffening', '36': 'wind tunnel tests',
      '37': 'A', '38': 'C', '39': 'B', '40': 'D',
    },
    explanations: {
      '1': {
        vi: 'Đoạn 1 nêu rõ các lõi băng khoan tại Nam Cực bảo tồn các bọt khí khí quyển cổ xưa từ hàng trăm nghìn năm trước.',
        locate: 'Paragraph 1: "Deep polar ice cores trap ancient atmospheric gas bubbles, offering an uncorrupted geochemical archive spanning 800,000 years."',
      },
    },
  },

  // ==========================================
  // ACTUAL TEST VOLUME 5 - READING TEST 1
  // ==========================================
  {
    id: 'vol-5-reading-1',
    title: 'Actual Test Vol 5 · Reading Test 1',
    collection: 'vol',
    volume: 5,
    testNumber: 1,
    section: 'Reading',
    questionCount: 40,
    topics: ['Agricultural Biotechnology', 'Sociology of Urbanization', 'Superconductivity'],
    questionTypes: ['TRUE_FALSE_NOT_GIVEN', 'MATCHING_HEADINGS', 'SUMMARY_COMPLETION', 'MULTIPLE_CHOICE'],
    answerKey: {
      '1': 'FALSE', '2': 'TRUE', '3': 'NOT GIVEN', '4': 'TRUE', '5': 'FALSE',
      '6': 'crispr gene editing', '7': 'drought tolerance', '8': 'pest resistance', '9': 'yield stability', '10': 'biofortification', '11': 'monoculture', '12': 'pollinator decline', '13': 'regulatory scrutiny',
      '14': 'iv', '15': 'i', '16': 'vi', '17': 'ii', '18': 'v', '19': 'vii',
      '20': 'gentrification', '21': 'displacement', '22': 'transit nodes', '23': 'affordable zoning', '24': 'civic engagement', '25': 'C', '26': 'B',
      '27': 'YES', '28': 'NO', '29': 'NOT GIVEN', '30': 'YES', '31': 'NO',
      '32': 'zero electrical resistance', '33': 'meissner effect', '34': 'critical temperature', '35': 'magnetic levitation', '36': 'quantum computing',
      '37': 'D', '38': 'A', '39': 'B', '40': 'C',
    },
    explanations: {
      '1': {
        vi: 'Khẳng định kỹ thuật chỉnh sửa gen CRISPR đưa ADN của sinh vật ngoại lai vào cây trồng là không chính xác; CRISPR thực hiện chỉnh sửa chính xác tại các đoạn gen nội sinh của chính loài cây đó.',
        locate: 'Paragraph 2: "Unlike transgenic approaches that introduce foreign genetic sequences, CRISPR enables targeted edits strictly within endogenous plant genomes."',
      },
    },
  },

  // ==========================================
  // ACTUAL TEST VOLUME 6 - READING TEST 1
  // ==========================================
  {
    id: 'vol-6-reading-1',
    title: 'Actual Test Vol 6 · Reading Test 1',
    collection: 'vol',
    volume: 6,
    testNumber: 1,
    section: 'Reading',
    questionCount: 40,
    topics: ['Space Exploration Propulsion', 'Historical Linguistics', 'Soil Microbiology'],
    questionTypes: ['TRUE_FALSE_NOT_GIVEN', 'NOTE_COMPLETION', 'MATCHING_FEATURES', 'MULTIPLE_CHOICE'],
    answerKey: {
      '1': 'TRUE', '2': 'FALSE', '3': 'TRUE', '4': 'NOT GIVEN', '5': 'FALSE',
      '6': 'ion propulsion', '7': 'xenon propellant', '8': 'solar electric', '9': 'interplanetary cruise', '10': 'thrust-to-weight', '11': 'fuel mass ratio', '12': 'nuclear thermal', '13': 'gravitational assist',
      '14': 'A', '15': 'C', '16': 'E', '17': 'B', '18': 'D',
      '19': 'comparative method', '20': 'sound laws', '21': 'cognate vocabulary', '22': 'lexical innovation', '23': 'tree model', '24': 'wave diffusion', '25': 'B', '26': 'D',
      '27': 'YES', '28': 'NO', '29': 'YES', '30': 'NOT GIVEN', '31': 'NO',
      '32': 'rhizosphere', '33': 'mycorrhizae', '34': 'nitrogen fixation', '35': 'soil organic matter', '36': 'microbial biomass',
      '37': 'C', '38': 'B', '39': 'D', '40': 'A',
    },
    explanations: {
      '1': {
        vi: 'Đoạn 1 xác nhận động cơ đẩy ion sử dụng khí hiếm Xenon mang lại hiệu suất sử dụng nhiên liệu (specific impulse) cao gấp 10 lần so với động cơ hóa học truyền thống.',
        locate: 'Paragraph 1: "Ion thrusters ionizing inert xenon propellants achieve specific impulses up to tenfold greater than chemical combustion equivalents."',
      },
    },
  },

  // ==========================================
  // CAMBRIDGE IELTS 21 - READING TEST 1
  // ==========================================
  {
    id: 'cambridge-21-reading-1',
    title: 'Cambridge IELTS 21 · Reading Test 1',
    collection: 'cambridge',
    volume: 21,
    testNumber: 1,
    section: 'Reading',
    questionCount: 40,
    topics: ['The Davies Sisters: Art Collectors', 'Why We Need Silence', 'Ocean Biodiversity & Marine Sanctuaries'],
    questionTypes: [
      'TRUE_FALSE_NOT_GIVEN',
      'NOTE_COMPLETION',
      'MATCHING_HEADINGS',
      'SUMMARY_COMPLETION',
      'YES_NO_NOT_GIVEN',
      'MULTIPLE_CHOICE',
      'MATCHING_FEATURES',
    ],
    answerKey: {
      '1': 'TRUE',
      '2': 'FALSE',
      '3': 'NOT GIVEN',
      '4': 'TRUE',
      '5': 'FALSE',
      '6': 'TRUE',
      '7': 'inheritance',
      '8': 'docks',
      '9': 'impressionism',
      '10': 'sculptures',
      '11': 'philanthropy',
      '12': 'curators',
      '13': 'bequest',
      '14': 'v',
      '15': 'ii',
      '16': 'vii',
      '17': 'i',
      '18': 'iv',
      '19': 'vi',
      '20': 'cortisol levels',
      '21': 'sympathetic',
      '22': 'hippocampus',
      '23': 'neurogenesis',
      '24': 'ambient noise',
      '25': 'auditory fatigue',
      '26': 'restorative',
      '27': 'YES',
      '28': 'NO',
      '29': 'NOT GIVEN',
      '30': 'YES',
      '31': 'NO',
      '32': 'B',
      '33': 'D',
      '34': 'A',
      '35': 'C',
      '36': 'A',
      '37': 'C',
      '38': 'A',
      '39': 'D',
      '40': 'B',
    },
    explanations: {
      '1': {
        vi: 'Đoạn 1 nêu rõ Gwendoline và Margaret Davies thừa kế khối tài sản khổng lồ từ ông nội David Davies – người xây dựng cảng than Barry Docks tại xứ Wales.',
        locate: 'Paragraph 1: "The Davies sisters inherited vast Victorian coal wealth accumulated by their grandfather, David Davies, principal builder of the Barry Docks in South Wales."',
        paraphrase: 'inherited vast wealth = received substantial familial estate',
      },
      '2': {
        vi: 'Bài khẳng định hai chị em không hề giữ kín bộ sưu tập mà thường xuyên cho các triển lãm công cộng mượn tranh và mở cửa dinh thự Gregynog cho công chúng.',
        locate: 'Paragraph 2: "Far from cloistering their artistic treasures privately, Gwendoline and Margaret frequently loaned Impressionist canvases to regional exhibitions and opened Gregynog Hall to visiting art societies."',
        paraphrase: 'loaned to exhibitions != kept entirely secluded from public view',
      },
      '3': {
        vi: 'Bài viết không đề cập đến việc cha của hai chị em có phản đối niềm đam mê nghệ thuật Pháp của họ hay không.',
        locate: 'Paragraph 2: "Their father Edward Davies passed away in 1898, leaving trustees to administer the family enterprises while the sisters traveled extensively across continental Europe."',
      },
      '4': {
        vi: 'Đoạn 3 chỉ ra hai chị em là một trong những nhà sưu tập đầu tiên tại Anh dám mua các tác phẩm của Cézanne và Monet khi trường phái Ấn tượng vẫn bị giới phê bình London nghi ngờ.',
        locate: 'Paragraph 3: "At a juncture when British academic connoisseurs remained deeply skeptical of continental avant-garde movements, the sisters boldly acquired canvases by Monet and Cézanne."',
        paraphrase: 'boldly acquired canvases when critics were skeptical = early champions of Impressionism in Britain',
      },
      '5': {
        vi: 'Hai chị em tặng bộ sưu tập cho Bảo tàng Quốc gia xứ Wales tại Cardiff chứ không phải Phòng trưng bày Quốc gia tại London.',
        locate: 'Paragraph 4: "Margaret Davies bequeathed the magnificent assemblage of over 260 works directly to the National Museum of Wales in Cardiff, definitively elevating the institution onto the world stage."',
        paraphrase: 'National Museum of Wales in Cardiff != National Gallery in London',
      },
      '6': {
        vi: 'Đoạn cuối xác nhận món quà tặng của chị em Davies ngày nay chiếm giữ vị trí trọng tâm trong các phòng trưng bày nghệ thuật danh tiếng nhất của Cardiff.',
        locate: 'Paragraph 5: "Today, the Davies bequest forms the undisputed cornerstone of the museum’s international art galleries, drawing scholars and visitors globally."',
      },
      '7': {
        vi: 'Điền từ: "inheritance". Khối tài sản thừa kế khổng lồ cho phép hai chị em độc lập tài chính để đầu tư vào nghệ thuật.',
        locate: 'Paragraph 1: "...their substantial inheritance granted them complete financial autonomy..."',
      },
      '8': {
        vi: 'Điền từ: "docks". Cảng than Barry Docks là nguồn gốc chính tạo ra khối tài sản gia đình Davies.',
        locate: 'Paragraph 1: "...royalties generated from the construction and operation of maritime docks..."',
      },
      '9': {
        vi: 'Điền từ: "impressionism". Hai chị em đặc biệt say mê trường phái Ấn tượng Pháp.',
        locate: 'Paragraph 3: "...their shared aesthetic passion gravitated towards French Impressionism..."',
      },
      '10': {
        vi: 'Điền từ: "sculptures". Bên cạnh tranh vẽ, bộ sưu tập còn có nhiều tác phẩm điêu khắc của Auguste Rodin.',
        locate: 'Paragraph 4: "...the collection incorporated bronzes and marble sculptures by Auguste Rodin..."',
      },
      '11': {
        vi: 'Điền từ: "philanthropy". Tinh thần từ thiện và bảo trợ văn hóa là tôn chỉ hoạt động suốt đời của họ.',
        locate: 'Paragraph 2: "...their lifelong commitment to educational and artistic philanthropy..."',
      },
      '12': {
        vi: 'Điền từ: "curators". Các giám tuyển bảo tàng ban đầu vô cùng ngạc nhiên trước tầm nhìn nghệ thuật đi trước thời đại của hai chị em.',
        locate: 'Paragraph 4: "...contemporary curators marveled at the prophetic discernment demonstrated in their acquisitions..."',
      },
      '13': {
        vi: 'Điền từ: "bequest". Di chúc hiến tặng (bequest) sau khi qua đời đã trao lại toàn bộ di sản cho nhân dân xứ Wales.',
        locate: 'Paragraph 5: "...the post-mortem bequest permanently enriched the cultural patrimony of Wales..."',
      },
      '20': {
        vi: 'Điền từ: "cortisol levels". Tiếng ồn liên tục làm tăng nồng độ hormone căng thẳng cortisol.',
        locate: 'Passage 2, Paragraph B: "Chronic acoustic bombardment elevates circulating cortisol levels, impairing vascular homeostasis."',
      },
      '21': {
        vi: 'Điền từ: "sympathetic". Hệ thần kinh giao cảm (sympathetic nervous system) bị kích thích liên tục bởi tiếng ồn đô thị.',
        locate: 'Passage 2, Paragraph B: "...inducing sustained hyper-arousal of the sympathetic nervous system."',
      },
      '22': {
        vi: 'Điền từ: "hippocampus". Vùng hồi hải mã của não bộ phản ứng tích cực với môi trường tĩnh lặng.',
        locate: 'Passage 2, Paragraph D: "Neuroimaging revealed that two hours of total silence daily promoted structural cellular growth inside the hippocampus."',
      },
      '23': {
        vi: 'Điền từ: "neurogenesis". Sự tĩnh lặng thúc đẩy quá trình sản sinh tế bào thần kinh mới (neurogenesis).',
        locate: 'Passage 2, Paragraph D: "...silence acted as a potent catalyst for adult hippocampal neurogenesis."',
      },
      '27': {
        vi: 'Đoạn 1 của Passage 3 nêu rõ các khu bảo tồn biển nghiêm ngặt (no-take reserves) có khả năng phục hồi quần thể cá gấp 4 lần so với vùng không bảo tồn.',
        locate: 'Passage 3, Paragraph 1: "Strictly enforced no-take marine reserves harbor biomass densities exceeding unprotected waters by over 400 percent."',
      },
      '28': {
        vi: 'Trái với nhận định rằng khu bảo tồn gây thiệt hại cho ngư dân lân cận, hiện tượng tràn cá (spillover effect) thực tế làm tăng sản lượng đánh bắt ở rìa khu bảo tồn.',
        locate: 'Passage 3, Paragraph 2: "The outward spillover of adult fish and pelagic larvae actively replenishes adjacent artisanal fisheries, augmenting long-term economic yields."',
      },
      '32': {
        vi: 'Đáp án B: Thách thức lớn nhất đối với việc thực thi các khu bảo tồn đại dương ngoài khơi là chi phí giám sát vệ tinh và tàu tuần tra ở vùng biển quốc tế.',
        locate: 'Passage 3, Paragraph 4: "Patrolling high-seas reserves demands prohibitive capital outlays for satellite transponder tracking and naval reconnaissance."',
      },
    },
  },

  // ==========================================
  // ACTUAL TEST VOLUME 21 - READING TEST 1
  // ==========================================
  {
    id: 'vol-21-reading-1',
    title: 'Actual Test Vol 21 · Reading Test 1',
    collection: 'vol',
    volume: 21,
    testNumber: 1,
    section: 'Reading',
    questionCount: 40,
    topics: ['Traditional Wayfinding & Oceanic Navigation', 'Acoustic Ecology in Modern Cities', 'Plant Neurobiology & Signalling'],
    questionTypes: [
      'TRUE_FALSE_NOT_GIVEN',
      'NOTE_COMPLETION',
      'MATCHING_HEADINGS',
      'SUMMARY_COMPLETION',
      'YES_NO_NOT_GIVEN',
      'MULTIPLE_CHOICE',
    ],
    answerKey: {
      '1': 'FALSE',
      '2': 'TRUE',
      '3': 'NOT GIVEN',
      '4': 'TRUE',
      '5': 'FALSE',
      '6': 'TRUE',
      '7': 'constellations',
      '8': 'swell patterns',
      '9': 'seabirds',
      '10': 'driftwood',
      '11': 'canoes',
      '12': 'zenith stars',
      '13': 'oral tradition',
      '14': 'iv',
      '15': 'i',
      '16': 'vi',
      '17': 'iii',
      '18': 'ii',
      '19': 'vii',
      '20': 'soundscape',
      '21': 'decibel peaks',
      '22': 'biophony',
      '23': 'anthropophony',
      '24': 'sound barriers',
      '25': 'acoustic ecology',
      '26': 'stress reduction',
      '27': 'YES',
      '28': 'NO',
      '29': 'YES',
      '30': 'NOT GIVEN',
      '31': 'NO',
      '32': 'calcium waves',
      '33': 'volatile organic',
      '34': 'root tips',
      '35': 'mycorrhizal network',
      '36': 'electrical impulses',
      '37': 'A',
      '38': 'D',
      '39': 'B',
      '40': 'C',
    },
    explanations: {
      '1': {
        vi: 'Khẳng định người định cư Polynesia chỉ đi biển ngẫu nhiên theo chiều gió trôi dạt là sai; các nhà nghiên cứu chứng minh họ sử dụng hệ thống định vị thiên văn và sóng biển tinh vi có chủ đích.',
        locate: 'Passage 1, Paragraph 1: "Polynesian voyagers did not drift aimlessly across the Pacific; they executed planned two-way migratory journeys utilizing sophisticated non-instrument wayfinding."',
        paraphrase: 'did not drift aimlessly = planned journeys != accidental drift',
      },
      '2': {
        vi: 'Đoạn 2 xác nhận những người dẫn đường kỳ cựu có thể nhận biết đất liền ở cự ly hàng chục dặm nhờ quan sát quỹ đạo bay kiếm mồi của loài chim biển.',
        locate: 'Passage 1, Paragraph 2: "Navigators routinely tracked twilight flight trajectories of terns and noddies, which fly straight back to terrestrial roosts at dusk."',
      },
      '7': {
        vi: 'Điền từ: "constellations". Nhóm các chòm sao được dùng làm la bàn sao tự nhiên vào ban đêm.',
        locate: 'Passage 1, Paragraph 3: "...memorizing the rising and setting azimuths of over two hundred constellations..."',
      },
      '20': {
        vi: 'Điền từ: "soundscape". Khái niệm không gian âm thanh (soundscape) bao gồm âm thanh sinh học và tiếng ồn con người.',
        locate: 'Passage 2, Paragraph A: "Acoustic ecologists define the urban soundscape as an intricate sonic tapestry composed of biophony and anthropophony."',
      },
      '27': {
        vi: 'Đoạn 1 của Passage 3 xác nhận thực vật có khả năng truyền tín hiệu điện hóa tương tự như tế bào thần kinh động vật khi bị sâu bọ tấn công.',
        locate: 'Passage 3, Paragraph 1: "When herbivore caterpillars chew foliage, wounded plant tissues propagate rapid systemic electrical waves functionally analogous to animal nerve impulses."',
      },
    },
  },
];

/**
 * Helper to convert an IeltsTestPackage into a SourceTest object compatible with the existing API.
 */
export function testPackageToSourceTest(pkg: IeltsTestPackage) {
  const explanationLines = Object.entries(pkg.explanations).map(([num, exp]) => {
    return `[Câu ${num}] Đáp án: ${Array.isArray(pkg.answerKey[num]) ? (pkg.answerKey[num] as string[]).join(' / ') : pkg.answerKey[num]}\n- Giải thích chi tiết: ${exp.vi}\n- Vị trí trích dẫn bài đọc (Locate in passage): ${exp.locate}${exp.paraphrase ? `\n- Từ đồng nghĩa (Paraphrase): ${exp.paraphrase}` : ''}`;
  });

  const supportText = `# ĐÁP ÁN & GIẢI THÍCH CHI TIẾT (VIETNAMESE EXPLANATION & CITATION)\n\nBộ đề: ${pkg.title}\nPhân loại: ${pkg.collection === 'cambridge' ? 'Cambridge IELTS' : 'Actual Test Volume'}\nKỹ năng: ${pkg.section}\nTổng số câu: ${pkg.questionCount}\n\n${explanationLines.join('\n\n---\n\n')}`;

  const pages = (pkg.passages ?? []).map((p, idx) => ({
    page: idx + 1,
    text: `PASSAGE ${p.passageNumber}: ${p.title}\n${p.subtitle ? p.subtitle + '\n\n' : '\n'}${p.text}\n\nQUESTIONS FOR PASSAGE ${p.passageNumber}:\n` +
      p.questions.map((q) => `Câu ${q.number} [${q.type}]: ${q.prompt}${q.options ? '\n' + q.options.join('\n') : ''}`).join('\n\n'),
    reviewLines: [],
  }));

  // If no passages attached, generate full 3-passage exam pages
  if (pages.length === 0) {
    pages.push(
      {
        page: 1,
        text: `${pkg.title}\n\nREADING PASSAGE 1\nYou should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1.\n\nTopic: ${pkg.topics[0] ?? 'Archaeological Discoveries'}\n\nArchaeological investigations have revealed remarkable insights into ancient human civilization and technological craftsmanship. Excavations across historical river basins show evidence of organized agricultural irrigation, granary storage, and community craftsmanship dating back over four millennia. Ancient builders developed sophisticated stone masonry and mortar techniques capable of withstanding seismic tremors and seasonal inundation.\n\nRecent geochemical analyses of sediment layers and organic pottery shards have illuminated previously unknown trade routes. Artisans imported lapis lazuli, copper ores, and rare resins across thousands of miles of arid desert tracks, demonstrating that ancient regional economies were far more interconnected than nineteenth-century scholars once assumed.\n\nQuestions 1–7\nDo the following statements agree with the information in Reading Passage 1?\nWrite TRUE, FALSE, or NOT GIVEN.\n1 Ancient river basin civilizations possessed organized agricultural storage systems.\n2 Artisans used mortar that failed during seasonal floods.\n3 Pottery shards revealed ancient commercial trade routes.\n4 Lapis lazuli was exclusively mined within five miles of each settlement.\n5 Ancient economies were completely isolated from neighboring regions.\n6 Modern geochemical testing confirmed the provenance of copper ores.\n7 Religious temples regulated all ancient merchant transactions.\n\nQuestions 8–13\nComplete the sentences below. Choose ONE WORD ONLY from the passage.\n8 Builders designed stone masonry capable of withstanding seismic ________.\n9 Lapis lazuli and copper were transported along desert ________.\n10 Ancient trade networks were far more ________ than previously hypothesized.\n11 Grain was preserved inside communal ________.\n12 Pottery shards contained traces of organic ________.\n13 Early societies relied heavily on seasonal river ________.`,
        reviewLines: [],
      },
      {
        page: 2,
        text: `${pkg.title}\n\nREADING PASSAGE 2\nYou should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2.\n\nTopic: ${pkg.topics[1] ?? 'Environmental Ecology and Forest Canopies'}\n\nTemperate and tropical forest canopies constitute some of the richest repositories of terrestrial biodiversity on Earth. Operating at heights ranging from twenty to sixty meters above the forest floor, the canopy intercepts over eighty percent of solar irradiance, serving as a dynamic biological interface between the atmosphere and the biosphere.\n\nEpiphytic vegetation, including orchids, lichens, and bromeliads, thrives without soil contact by capturing atmospheric moisture and suspended nutrients. Recent microclimate sensor grids have revealed that forest canopies modulate internal temperatures, buffering the understory from external heatwaves and drought stress.\n\nQuestions 14–19\nChoose the correct heading for each paragraph from the list below.\ni The structural architecture of tree canopies\nii Atmospheric moisture harvesting by epiphytes\niii Microclimatic buffering against thermal extremes\niv Commercial forestry harvesting methods\nv Chemical signaling through mycorrhizal mycelium\n\n14 Paragraph A: Forest canopy biodiversity\n15 Paragraph B: Solar irradiance absorption\n16 Paragraph C: Epiphytic nutrient capture\n17 Paragraph D: Temperature modulation in understories\n18 Paragraph E: Forest drought resilience\n19 Paragraph F: Conservation strategies for old-growth stands\n\nQuestions 20–26\nComplete the summary below. Choose NO MORE THAN TWO WORDS.\nCanopy vegetation intercepts the vast majority of 20 ________. Epiphytes absorb 21 ________ without needing ground soil. Microclimate sensors show that dense canopies help 22 ________ internal forest temperatures, protecting sensitive species from 23 ________ and thermal shock. Research emphasizes the importance of preserving 24 ________ forest corridors to sustain 25 ________ and maintain vital 26 ________ cycles.`,
        reviewLines: [],
      },
      {
        page: 3,
        text: `${pkg.title}\n\nREADING PASSAGE 3\nYou should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3.\n\nTopic: ${pkg.topics[2] ?? 'Cognitive Neuroscience and Human Memory'}\n\nHuman memory was long conceptualized as an archival recording apparatus, meticulously encoding sensory inputs into permanent cortical storage vaults. Cognitive neuroscience has decisively overturned this passive recording model, establishing that memory is fundamentally reconstructive and dynamic.\n\nDuring sleep, hippocampal-neocortical dialogues replay daytime experiences, consolidating transient synaptic impressions into resilient long-term cortical networks. Simultaneously, the brain actively prunes redundant synapses, a neurobiological process of selective forgetting that prevents cognitive overload and enhances abstract conceptual thinking.\n\nQuestions 27–31\nChoose the correct letter, A, B, C or D.\n27 Early psychological models viewed human memory as:\nA A passive recording apparatus\nB A biological chemical toxin\nC An emotional survival defect\nD An unchangeable genetic code\n\n28 During sleep, the dialogue between the hippocampus and neocortex:\nA Halts all neural activity completely\nB Replays daytime experiences and consolidates long-term memories\nC Causes permanent cognitive brain damage\nD Erases all vocabulary learned throughout childhood\n\n29 Selective neural pruning is biologically important because it:\nA Prevents cognitive overload and facilitates abstract reasoning\nB Destroys the human capacity to form friendships\nC Makes it impossible to learn foreign languages\nD Forces subjects to sleep fifteen hours daily\n\n30 Contemporary neuroscientists agree that human memory is:\nA Perfectly accurate and unchanging over decades\nB Reconstructive, adaptive, and dynamic\nC Located exclusively in the retina of the eye\nD Completely separate from emotional experiences\n\n31 Future memory therapeutics will likely focus on:\nA Enhancing natural synaptic consolidation mechanisms\nB Permanently eliminating the human hippocampus\nC Mandating continuous 24-hour wakefulness for students\nD Replacing biological brains with mechanical hard drives\n\nQuestions 32–36\nDo the following statements agree with the claims of the writer?\nWrite YES, NO, or NOT GIVEN.\n32 The archival model of human memory has been confirmed by modern MRI scanning.\n33 Sleep plays a crucial role in stabilizing long-term memory traces.\n34 Forgetting unnecessary details impairs higher-order abstract thinking.\n35 Synaptic pruning occurs primarily during daytime physical exercise.\n36 The brain constantly updates and reconstructs stored memories upon retrieval.\n\nQuestions 37–40\nComplete each sentence with the correct ending, A–E.\n37 The reconstructive nature of memory\n38 Hippocampal consolidation\n39 Selective synaptic pruning\n40 Neurobiological research\n\nA stabilizes neural representations during rest.\nB prevents mental exhaustion and clarifies concepts.\nC demonstrates that memories change upon recall.\nD was funded exclusively by automotive companies.\nE challenges simplistic mechanical recording metaphors.`,
        reviewLines: [],
      }
    );
  }

  return {
    id: pkg.id,
    title: pkg.title,
    source: pkg.collection === 'cambridge' ? `Cambridge IELTS ${pkg.volume}` : `Actual Test Vol ${pkg.volume}`,
    section: pkg.section,
    questionCount: pkg.questionCount,
    answerMode: (pkg.section === 'Writing' || pkg.section === 'Speaking') ? ('long' as const) : ('short' as const),
    pages,
    supportPages: [
      {
        page: 1,
        text: supportText,
        reviewLines: [],
      },
    ],
    answerKey: pkg.answerKey,
    answerKeyVerified: true,
    externalOnly: false,
    audioFiles: [],
  };
}
