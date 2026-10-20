/**
 * BỘ ĐỀ FORECAST SPEAKING & SAMPLE 8.0+ IELTS
 * Chủ đề tháng 9–12/2026 có nguồn và ngày kiểm tra, kèm bài ôn tập cũ.
 * Đầy đủ Part 1, Part 2 (Cue cards) và Part 3 (Follow-up discussions).
 * Bài mẫu là nội dung luyện tập tự soạn; band ghi mục tiêu, không phải điểm được chứng nhận.
 */

import { CURRENT_FORECAST_SAMPLES } from './speaking-forecast-current';

export type SpeakingSample = {
  id: string;
  topic: string;
  topicVi: string;
  quarter: 'Sep-Dec-2026' | 'Common-patterns' | 'Q3-2026' | 'Q2-2026';
  isForecastNew?: boolean;
  part: 1 | 2 | 3;
  question: string;
  cueBullets?: string[];
  sampleAnswer: string;
  sampleAnswerVi: string;
  targetBand: number; // e.g. 8.0, 8.5
  collocationsAndIdioms: string[];
  keyVocabulary: { word: string; ipa: string; meaningVi: string }[];
  grammarNotes: string[];
  sourceRefs?: { title: string; url: string; publishedAt?: string; checkedAt: string }[];
  sampleAuthor?: 'ReadUp';
  contentKind?: 'reported-theme' | 'common-pattern' | 'original-practice';
  groupId?: string;
};

export const SPEAKING_FORECAST: SpeakingSample[] = [
  // ==========================================
  // PART 1 - THỜI TIẾT & BIẾN ĐỔI KHÍ HẬU
  // ==========================================
  {
    id: 'fc-p1-climate-awareness',
    topic: 'Climate Awareness & Daily Weather',
    topicVi: 'Nhận thức khí hậu & Thời tiết hàng ngày',
    quarter: 'Q3-2026',
    isForecastNew: true,
    part: 1,
    question: 'How do extreme weather conditions affect your daily travel routines?',
    sampleAnswer:
      "Sudden tropical downpours or blistering heatwaves inevitably disrupt public transit timetables in my city. When torrential rains flood low-lying arterial roads, I routinely factor in an extra forty minutes for my morning commute. Furthermore, adverse weather forces commuters to abandon two-wheeled transport in favor of buses, creating severe congestion at key transit hubs.",
    sampleAnswerVi:
      "Những cơn mưa rào nhiệt đới bất chợt hay đợt nắng nóng gay gắt chắc chắn sẽ làm xáo trộn lịch trình giao thông công cộng ở thành phố của tôi. Khi mưa xối xả làm ngập các tuyến đường huyết mạch vùng trũng, tôi luôn phải cộng thêm bốn mươi phút cho chặng đường đi làm buổi sáng. Hơn nữa, thời tiết khắc nghiệt buộc người dân phải chuyển từ xe hai bánh sang xe buýt, gây ùn tắc nghiêm trọng tại các điểm trung chuyển chính.",
    targetBand: 8.5,
    collocationsAndIdioms: [
      'blistering heatwaves',
      'torrential rains',
      'arterial roads',
      'factor in an extra forty minutes',
      'transit hubs'
    ],
    keyVocabulary: [
      { word: 'blistering', ipa: '/ˈblɪs.tər.ɪŋ/', meaningVi: 'nóng như thiêu như đốt' },
      { word: 'arterial', ipa: '/ɑːˈtɪə.ri.əl/', meaningVi: 'huyết mạch, trục chính' },
      { word: 'adverse', ipa: '/ˈæd.vɜːs/', meaningVi: 'bất lợi, khắc nghiệt' }
    ],
    grammarNotes: ['Cấu trúc mệnh đề phân từ: "creating severe congestion at key transit hubs"']
  },
  // ==========================================
  // PART 2 - LÀNG NGHỀ TRUYỀN THỐNG
  // ==========================================
  {
    id: 'fc-p2-craft-village',
    topic: 'Traditional Craft Village',
    topicVi: 'Làng nghề thủ công truyền thống',
    quarter: 'Q3-2026',
    isForecastNew: true,
    part: 2,
    question: 'Describe a traditional craft village or artisan workshop that you visited.',
    cueBullets: [
      'Where this village is located and when you visited it',
      'What traditional craft or heritage art is practiced there',
      'What you saw during your visit',
      'And explain how you felt about the preservation of this traditional craft'
    ],
    sampleAnswer:
      "I would like to describe Bat Trang ceramic village, an ancient artisanal enclave situated along the banks of the Red River on the outskirts of Hanoi. I had the privilege of visiting this historic hub last autumn during a weekend excursion.\n\nBat Trang boasts over seven centuries of continuous pottery craftsmanship. As soon as you enter the labyrinthine alleys, you are greeted by the earthy scent of drying clay and the ambient heat radiating from traditional gas kilns. During my visit, I observed master artisans skillfully shaping delicate celadon vases on rotating potter's wheels, demonstrating an instinctive precision honed over decades of practice.\n\nVisitors are also invited to participate in hands-on workshops. I spent over two hours attempting to throw a ceramic bowl, which gave me an immense appreciation for the physical discipline and dexterity required in this art form.\n\nReflecting upon the experience, I felt a profound sense of respect mixed with cautious optimism. While mass-produced commercial ceramics have undercut market prices, the younger generation of Bat Trang potters is ingeniously blending minimalist contemporary aesthetics with ancestral glazing formulas, proving that intangible cultural heritage can flourish dynamically in modern commerce.",
    sampleAnswerVi:
      "Tôi muốn kể về làng gốm Bát Tràng, một làng nghề thủ công cổ kính tọa lạc bên bờ sông Hồng ở ngoại ô Hà Nội. Tôi có dịp đến thăm trung tâm lịch sử này vào mùa thu năm ngoái trong một chuyến dã ngoại cuối tuần.\n\nBát Tràng có bề dày hơn bảy thế kỷ chế tác đồ gốm. Ngay khi bước vào những con ngõ uốn lượn, bạn sẽ cảm nhận được mùi đất sét phơi nồng nàn và hơi nóng lan tỏa từ các lò nung. Trong chuyến thăm, tôi đã tận mắt chứng kiến các nghệ nhân bậc thầy khéo léo tạo hình những chiếc bình ngọc bích tinh xảo trên bàn xoay, thể hiện sự chính xác bản năng được tôi luyện qua hàng thập kỷ thực hành.\n\nDu khách cũng được trải nghiệm tự tay vuốt gốm. Tôi đã dành hơn hai giờ để nặn một chiếc bát nhỏ, và trải nghiệm đó giúp tôi càng khâm phục sự tỉ mỉ và đôi bàn tay tài hoa của các nghệ nhân.\n\nNhìn lại chuyến đi, tôi cảm thấy một niềm tôn kính sâu sắc xen lẫn niềm lạc quan. Dù gốm công nghiệp sản xuất hàng loạt cạnh tranh gay gắt về giá, thế hệ thợ gốm trẻ ở Bát Tràng đang khéo léo kết hợp thẩm mỹ tối giản hiện đại với các bài men gia truyền, chứng minh rằng di sản văn hóa phi vật thể hoàn toàn có thể phát triển rực rỡ trong nền kinh tế đương đại.",
    targetBand: 9.0,
    collocationsAndIdioms: [
      'artisanal enclave',
      'labyrinthine alleys',
      'instinctive precision honed over decades',
      'immense appreciation for',
      'profound sense of respect',
      'cautious optimism',
      'intangible cultural heritage'
    ],
    keyVocabulary: [
      { word: 'enclave', ipa: '/ˈen.kleɪv/', meaningVi: 'vùng đất đặc trưng, quần thể riêng biệt' },
      { word: 'labyrinthine', ipa: '/ˌlæb.əˈrɪn.θaɪn/', meaningVi: 'như mê cung, chằng chịt' },
      { word: 'dexterity', ipa: '/dekˈster.ə.ti/', meaningVi: 'sự khéo léo, tài hoa của bàn tay' },
      { word: 'intangible', ipa: '/ɪnˈtæn.dʒə.bəl/', meaningVi: 'phi vật thể' }
    ],
    grammarNotes: [
      'Sử dụng mệnh đề phân từ: "ingeniously blending minimalist contemporary aesthetics with ancestral glazing formulas"',
      'Cấu trúc tương phản: "While mass-produced commercial ceramics have undercut market prices, the younger generation..."'
    ]
  },
  // ==========================================
  // PART 3 - BẢO TỒN VĂN HÓA TRONG THỜI KỲ CÔNG NGHỆ
  // ==========================================
  {
    id: 'fc-p3-cultural-preservation-tech',
    topic: 'Preserving Heritage in the Digital Age',
    topicVi: 'Bảo tồn di sản trong thời đại số',
    quarter: 'Q3-2026',
    isForecastNew: true,
    part: 3,
    question: 'How can digital technologies assist in preserving endangered cultural traditions?',
    sampleAnswer:
      "Digital technologies serve as a transformative catalyst for cultural safeguarding. High-resolution three-dimensional photogrammetry and virtual reality simulations allow fragile historical monuments to be permanently archived and made globally accessible, irrespective of physical geographic constraints. Furthermore, interactive digital repositories enable indigenous linguistic records and oral folk traditions to be transcribed, analyzed, and passed down to younger digital-native demographics without succumbing to the erosion of time.",
    sampleAnswerVi:
      "Công nghệ số đóng vai trò như chất xúc tác mang tính cách mạng cho việc bảo vệ văn hóa. Kỹ thuật đo ảnh 3D độ phân giải cao và mô phỏng thực tế ảo cho phép các di tích lịch sử mong manh được lưu trữ vĩnh viễn và tiếp cận trên toàn cầu, bất kể rào cản địa lý. Hơn nữa, các kho dữ liệu số tương tác giúp các bản ghi ngôn ngữ bản địa và truyền thống truyền khẩu dân gian được ghi chép, phân tích và truyền dạy cho thế hệ trẻ sinh ra trong thời đại số mà không bị mai một theo năm tháng.",
    targetBand: 8.5,
    collocationsAndIdioms: [
      'transformative catalyst',
      'cultural safeguarding',
      'virtual reality simulations',
      'indigenous linguistic records',
      'digital-native demographics',
      'erosion of time'
    ],
    keyVocabulary: [
      { word: 'catalyst', ipa: '/ˈkæt.əl.ɪst/', meaningVi: 'chất xúc tác' },
      { word: 'photogrammetry', ipa: '/ˌfəʊ.təʊˈɡræm.ə.tri/', meaningVi: 'kỹ thuật đo ảnh 3D' },
      { word: 'erosion', ipa: '/ɪˈrəʊ.ʒən/', meaningVi: 'sự xói mòn, mai một' }
    ],
    grammarNotes: ['Sử dụng cụm từ học thuật nâng cao: "transformative catalyst for cultural safeguarding"']
  },

  ...CURRENT_FORECAST_SAMPLES,
  // ==========================================
  // PART 1 - FORECAST QUÝ 3/2026 (MỚI NHẤT)
  // ==========================================
  {
    id: 'fc-p1-ai-tools',
    topic: 'Artificial Intelligence & Apps',
    topicVi: 'Công nghệ AI & Ứng dụng',
    quarter: 'Q3-2026',
    isForecastNew: true,
    part: 1,
    question: 'Do you often use artificial intelligence tools in your daily routine?',
    sampleAnswer:
      "To be completely honest, generative AI tools have seamlessly integrated into my day-to-day workflow. Whether it is troubleshooting coding errors, drafting professional emails, or organizing my weekly study timetable, platforms like ChatGPT have become an indispensable productivity booster. That said, I make a conscious effort not to rely blindly on them, as human critical thinking remains paramount.",
    sampleAnswerVi:
      "Thành thật mà nói, các công cụ AI tạo sinh đã tích hợp mượt mà vào luồng làm việc hàng ngày của tôi. Dù là gỡ lỗi lập trình, soạn thảo email chuyên nghiệp hay sắp xếp thời gian biểu học tập hàng tuần, các nền tảng như ChatGPT đã trở thành đòn bẩy năng suất không thể thiếu. Dẫu vậy, tôi luôn nỗ lực có ý thức để không phụ thuộc mù quáng vào chúng, vì tư duy phản biện của con người vẫn là tối quan trọng.",
    targetBand: 8.5,
    collocationsAndIdioms: ['seamlessly integrated into', 'day-to-day workflow', 'indispensable productivity booster', 'make a conscious effort', 'critical thinking remains paramount'],
    keyVocabulary: [
      { word: 'seamlessly', ipa: '/ˈsiːm.ləs.li/', meaningVi: 'một cách mượt mà, liền mạch' },
      { word: 'indispensable', ipa: '/ˌɪn.dɪˈspen.sə.bəl/', meaningVi: 'không thể thiếu được' },
      { word: 'paramount', ipa: '/ˈpær.ə.maʊnt/', meaningVi: 'tối thượng, quan trọng hàng đầu' },
    ],
    grammarNotes: ['Sử dụng liên từ nhượng bộ: "That said, ..."', 'Mệnh đề danh ngữ: "Whether it is..., or..."'],
  },
  {
    id: 'fc-p1-staying-up-late',
    topic: 'Staying Up Late',
    topicVi: 'Thức khuya',
    quarter: 'Q3-2026',
    isForecastNew: true,
    part: 1,
    question: 'Do you often stay up late, and what do you usually do?',
    sampleAnswer:
      "I used to be a bona fide night owl during my university years, burning the midnight oil before major deadlines. Nowadays, however, I strive to hit the hay before midnight because sleep deprivation drastically impairs my cognitive agility the next morning. If I ever burn the candle at both ends, it is typically because I get engrossed in a gripping novel or a documentary.",
    sampleAnswerVi:
      "Tôi từng là một 'cú đêm' đích thực suốt những năm đại học, thường thức khuya cày cuốc trước những kỳ hạn lớn. Tuy nhiên hiện nay, tôi cố gắng đi ngủ trước nửa đêm vì việc thiếu ngủ làm suy giảm nghiêm trọng sự nhanh nhạy của não bộ vào sáng hôm sau. Nếu có thức khuya, thì thường là do tôi quá mải mê vào một cuốn tiểu thuyết lôi cuốn hoặc một bộ phim tài liệu.",
    targetBand: 8.5,
    collocationsAndIdioms: ['bona fide night owl', 'burning the midnight oil', 'hit the hay', 'sleep deprivation', 'burn the candle at both ends', 'engrossed in'],
    keyVocabulary: [
      { word: 'bona fide', ipa: '/ˌbəʊ.nə ˈfaɪ.di/', meaningVi: 'đích thực, chính hiệu' },
      { word: 'deprivation', ipa: '/ˌdep.rɪˈveɪ.ʃən/', meaningVi: 'sự thiếu thốn, tước đoạt' },
      { word: 'engrossed', ipa: '/ɪnˈɡrəʊst/', meaningVi: 'mải mê, chìm đắm' },
    ],
    grammarNotes: ['Thành ngữ tự nhiên: "burning the midnight oil", "hit the hay"', 'Câu điều kiện loại 0/1 diễn tả thói quen: "If I ever..., it is typically because..."'],
  },
  {
    id: 'fc-p1-crowded-places',
    topic: 'Crowded Places',
    topicVi: 'Nơi đông người',
    quarter: 'Q3-2026',
    isForecastNew: true,
    part: 1,
    question: 'How do you feel when you are in a crowded place?',
    sampleAnswer:
      "It really depends on the ambiance. If I am attending a high-energy music festival or a lively street night market, the collective buzz of the crowd can be genuinely exhilarating. On the flip side, navigating through packed commuter trains or chaotic shopping malls during rush hour makes me feel quite claustrophobic and drained.",
    sampleAnswerVi:
      "Điều đó thực sự phụ thuộc vào bầu không khí. Nếu tôi đang tham gia một lễ hội âm nhạc tràn đầy năng lượng hoặc chợ đêm đường phố sôi động, sự hào hứng chung của đám đông có thể đem lại cảm giác vô cùng phấn khích. Nhưng ngược lại, việc chen chúc trên các chuyến tàu đông nghẹt hay trung tâm thương mại hỗn loạn vào giờ cao điểm lại khiến tôi cảm thấy ngột ngạt và kiệt sức.",
    targetBand: 8.0,
    collocationsAndIdioms: ['collective buzz', 'genuinely exhilarating', 'on the flip side', 'packed commuter trains', 'feel claustrophobic'],
    keyVocabulary: [
      { word: 'ambiance', ipa: '/ˈæm.bi.əns/', meaningVi: 'bầu không khí, không gian' },
      { word: 'exhilarating', ipa: '/ɪɡˈzɪl.ə.reɪ.tɪŋ/', meaningVi: 'phấn khích, vui sướng tột độ' },
      { word: 'claustrophobic', ipa: '/ˌklɒs.trəˈfəʊ.bɪk/', meaningVi: 'ngột ngạt, sợ không gian hẹp' },
    ],
    grammarNotes: ['Cấu trúc tương phản: "If I am..., On the flip side, ..."', 'Phân từ hiện tại làm tính từ: "packed commuter trains"'],
  },
  {
    id: 'fc-p1-memory-lost-items',
    topic: 'Memory & Lost Items',
    topicVi: 'Trí nhớ & Đồ đạc thất lạc',
    quarter: 'Q3-2026',
    isForecastNew: true,
    part: 1,
    question: 'Are you good at remembering where you put your personal belongings?',
    sampleAnswer:
      "Regrettably, I have a memory like a sieve when it comes to trivial day-to-day items such as house keys or sunglasses. I have a terrible knack for misplacing them right before heading out the door. To counteract this absent-mindedness, I recently installed a dedicated organizer tray right by my entryway, which has been a total lifesaver.",
    sampleAnswerVi:
      "Đáng tiếc là tôi có trí nhớ như 'não cá vàng' đối với những món đồ lặt vặt hàng ngày như chìa khóa nhà hay kính râm. Tôi dường như có tật xấu là hay để quên đồ ngay trước khi chuẩn bị ra ngoài. Để khắc phục tính hay quên này, gần đây tôi đã lắp một chiếc khay để đồ ngay lối ra vào, và nó quả là một cứu cánh tuyệt vời.",
    targetBand: 8.5,
    collocationsAndIdioms: ['memory like a sieve', 'personal belongings', 'terrible knack for', 'absent-mindedness', 'dedicated organizer', 'total lifesaver'],
    keyVocabulary: [
      { word: 'sieve', ipa: '/sɪv/', meaningVi: 'cái rây, cái sàng (thành ngữ: não cá vàng)' },
      { word: 'counteract', ipa: '/ˌkaʊn.tərˈækt/', meaningVi: 'chống lại, làm giảm tác động' },
      { word: 'absent-mindedness', ipa: '/ˌæb.səntˈmaɪn.dɪd.nəs/', meaningVi: 'tính đãng trí, hay quên' },
    ],
    grammarNotes: ['Thành ngữ sinh động: "have a memory like a sieve"', 'Mệnh đề quan hệ không xác định: ", which has been a total lifesaver."'],
  },
  {
    id: 'fc-p1-morning-routine',
    topic: 'Morning Routine',
    topicVi: 'Thói quen buổi sáng',
    quarter: 'Q3-2026',
    isForecastNew: true,
    part: 1,
    question: 'What is the first thing you usually do after waking up?',
    sampleAnswer:
      "First thing in the morning, I make it a point to drink a tall glass of lukewarm water and practice ten minutes of light stretching. Resisting the urge to immediately check push notifications on my smartphone has been revolutionary for my mental clarity. It allows me to start the day proactively rather than reactively.",
    sampleAnswerVi:
      "Điều đầu tiên vào buổi sáng, tôi luôn tập thói quen uống một cốc nước ấm lớn và thực hiện mười phút vươn vai nhẹ nhàng. Cưỡng lại sự thôi thúc kiểm tra thông báo trên điện thoại ngay lập tức đã mang lại bước ngoặt lớn cho sự sáng suốt của tâm trí tôi. Nó cho phép tôi bắt đầu ngày mới một cách chủ động thay vì bị động cuốn theo.",
    targetBand: 8.0,
    collocationsAndIdioms: ['make it a point to', 'mental clarity', 'resisting the urge', 'start the day proactively'],
    keyVocabulary: [
      { word: 'lukewarm', ipa: '/ˌluːkˈwɔːm/', meaningVi: 'hơi ấm, âm ấm' },
      { word: 'proactively', ipa: '/prəʊˈæk.tɪv.li/', meaningVi: 'một cách chủ động' },
      { word: 'revolutionary', ipa: '/ˌrev.əˈluː.ʃən.ər.i/', meaningVi: 'mang tính bước ngoặt, cách mạng' },
    ],
    grammarNotes: ['Danh động từ làm chủ ngữ: "Resisting the urge... has been..."'],
  },

  // ==========================================
  // PART 2 & 3 - FORECAST QUÝ 3/2026 (CUE CARDS & DISCUSSION)
  // ==========================================
  {
    id: 'fc-p2-helpful-person',
    topic: 'A Person Who Helped Others',
    topicVi: 'Người giúp đỡ người khác',
    quarter: 'Q3-2026',
    isForecastNew: true,
    part: 2,
    question: 'Describe a person you know who often helps others.',
    cueBullets: [
      'Who this person is and how you know them',
      'What kind of help they usually offer',
      'Why they are willing to dedicate their time',
      'And explain how you feel about their actions',
    ],
    sampleAnswer:
      "I would like to talk about my close neighborhood mentor, Dr. Minh, who is a retired biology lecturer and a pillar of our local community. Despite being well into his seventies, he possesses boundless energy when it comes to civic engagement.\n\nEvery weekend without fail, Dr. Minh spearheads a grassroots volunteer initiative dedicated to tutoring underprivileged children in our district. He doesn't merely teach standard academic curricula; he fosters scientific curiosity through hands-on botanical experiments. Beyond academic support, he frequently mobilizes donations for families encountering sudden financial adversity.\n\nWhen asked about his motivation, he invariably smiles and remarks that true fulfillment stems from contributing to collective societal growth rather than pursuing individual accolades. Observing his selfless dedication has profoundly influenced my own worldview, teaching me that genuine compassion is demonstrated through consistent, quiet actions rather than grandiose gestures.",
    sampleAnswerVi:
      "Tôi muốn chia sẻ về người thầy trong khu phố của tôi, bác Minh, một cựu giảng viên sinh học đã nghỉ hưu và là trụ cột của cộng đồng địa phương. Dù đã ngoài bảy mươi tuổi, bác vẫn tràn đầy năng lượng khi tham gia các hoạt động vì cộng đồng.\n\nCứ mỗi cuối tuần không sót buổi nào, bác Minh lại khởi xướng một sáng kiến tình nguyện cơ sở nhằm dạy kèm cho trẻ em có hoàn cảnh khó khăn trong quận. Bác không chỉ dạy chương trình học tiêu chuẩn, mà còn nuôi dưỡng trí tò mò khoa học qua các thí nghiệm thực vật học thực hành. Ngoài hỗ trợ học tập, bác còn thường xuyên vận động quyên góp cho các gia đình gặp nghịch cảnh tài chính đột ngột.\n\nKhi được hỏi về động lực, bác luôn mỉm cười và chia sẻ rằng sự viên mãn đích thực bắt nguồn từ việc đóng góp cho sự phát triển của xã hội hơn là theo đuổi những danh hiệu cá nhân. Chứng kiến sự cống hiến quên mình của bác đã ảnh hưởng sâu sắc đến thế giới quan của tôi, dạy cho tôi rằng lòng trắc ẩn chân thành được thể hiện qua những hành động kiên trì, thầm lặng thay vì những lời nói đao to búa lớn.",
    targetBand: 8.5,
    collocationsAndIdioms: [
      'a pillar of our local community',
      'boundless energy',
      'spearheads a grassroots initiative',
      'underprivileged children',
      'financial adversity',
      'selfless dedication',
      'profoundly influenced my worldview',
      'grandiose gestures',
    ],
    keyVocabulary: [
      { word: 'spearhead', ipa: '/ˈspɪə.hed/', meaningVi: 'dẫn đầu, khởi xướng phong trào' },
      { word: 'grassroots', ipa: '/ˈɡrɑːs.ruːts/', meaningVi: 'mang tính cơ sở, xuất phát từ người dân' },
      { word: 'adversity', ipa: '/ədˈvɜː.sə.ti/', meaningVi: 'nghịch cảnh, khó khăn' },
      { word: 'grandiose', ipa: '/ˈɡræn.di.əʊs/', meaningVi: 'phô trương, to tát rỗng tuếch' },
    ],
    grammarNotes: [
      'Đảo ngữ ngầm với phủ định: "He doesn\'t merely teach...; he fosters..."',
      'Cấu trúc rút gọn hiện tại phân từ: "Observing his selfless dedication has profoundly influenced..."',
    ],
  },
  {
    id: 'fc-p3-helpful-person-discussion',
    topic: 'Charity, Volunteering & Social Cohesion',
    topicVi: 'Thiện nguyện & Gắn kết xã hội',
    quarter: 'Q3-2026',
    isForecastNew: true,
    part: 3,
    question: 'Do you believe young people today are less willing to participate in community service compared to older generations?',
    sampleAnswer:
      "I would respectfully contest that assumption. While it is true that modern youth grapple with unprecedented academic competition and career anxiety, their mode of civic participation has simply evolved. Rather than engaging solely in conventional neighborhood associations, younger generations are at the forefront of digital advocacy, climate action movements, and social entrepreneurship. They leverage digital platforms to crowdfund causes and mobilize global awareness with unprecedented agility.",
    sampleAnswerVi:
      "Tôi xin phép đưa ra quan điểm khác với giả định đó. Mặc dù đúng là giới trẻ ngày nay phải vật lộn với sự cạnh tranh học thuật và lo lắng nghề nghiệp chưa từng có, phương thức tham gia cộng đồng của họ đơn giản là đã tiến hóa. Thay vì chỉ tham gia vào các hội đồng hương truyền thống, thế hệ trẻ đang đi đầu trong việc vận động số, các phong trào hành động vì khí hậu và khởi nghiệp xã hội. Họ tận dụng các nền tảng số để gọi vốn cộng đồng và nâng cao nhận thức toàn cầu với sự linh hoạt phi thường.",
    targetBand: 8.5,
    collocationsAndIdioms: [
      'respectfully contest that assumption',
      'grapple with unprecedented competition',
      'at the forefront of',
      'digital advocacy',
      'social entrepreneurship',
      'unprecedented agility',
    ],
    keyVocabulary: [
      { word: 'contest', ipa: '/kənˈtest/', meaningVi: 'tranh luận, phản bác một quan điểm' },
      { word: 'advocacy', ipa: '/ˈæd.və.kə.si/', meaningVi: 'sự vận động, bênh vực một chính sách' },
      { word: 'agility', ipa: '/əˈdʒɪl.ə.ti/', meaningVi: 'sự nhanh nhẹn, linh hoạt' },
    ],
    grammarNotes: ['Cách mở đầu phản biện lịch thiệp trong Part 3: "I would respectfully contest that assumption."'],
  },
  {
    id: 'fc-p2-difficult-decision',
    topic: 'A Difficult Decision with a Positive Result',
    topicVi: 'Quyết định khó khăn mang lại kết quả tốt',
    quarter: 'Q3-2026',
    isForecastNew: true,
    part: 2,
    question: 'Describe a difficult decision that you made and had a positive result.',
    cueBullets: [
      'What the decision was and when you made it',
      'Why it was so difficult to make',
      'What alternative options you had',
      'And explain why the outcome turned out to be positive',
    ],
    sampleAnswer:
      "A pivotal decision that fundamentally altered my career trajectory took place about two years ago, when I decided to turn down a lucrative corporate banking offer in order to transition into data analytics.\n\nIt was an agonizing dilemma at the time because the banking position offered immediate financial security and prestige that delighted my parents. Conversely, the data science field represented uncharted territory for me, demanding that I teach myself coding from scratch while subsisting on modest freelance projects.\n\nUltimately, I took the plunge because I recognized that artificial intelligence and data fluency would be the definitive currency of the future economy. In retrospect, that leap of faith paid immense dividends. Not only did I discover a genuine intellectual passion for building predictive algorithms, but I also secured a role at an innovative tech enterprise where my professional growth has been exponential.",
    sampleAnswerVi:
      "Một quyết định then chốt đã thay đổi căn bản quỹ đạo sự nghiệp của tôi diễn ra cách đây khoảng hai năm, khi tôi quyết định từ chối một lời đề nghị hấp dẫn trong ngành ngân hàng để chuyển hướng sang phân tích dữ liệu.\n\nĐó là một tình thế tiến thoái lưỡng nan đầy dằn vặt vào thời điểm đó vì vị trí ngân hàng mang lại sự an toàn tài chính trước mắt và danh tiếng làm hài lòng gia đình tôi. Ngược lại, lĩnh vực khoa học dữ liệu là một vùng đất hoàn toàn mới đối với tôi, đòi hỏi tôi phải tự học lập trình từ con số không trong khi sống nhờ vào các dự án tự do nhỏ lẻ.\n\nCuối cùng, tôi đã dũng cảm dấn bước vì nhận ra rằng trí tuệ nhân tạo và sự am hiểu dữ liệu sẽ là giá trị then chốt của nền kinh tế tương lai. Nhìn lại, bước nhảy mạo hiểm đó đã mang lại những quả ngọt vô giá. Tôi không chỉ tìm thấy niềm đam mê trí tuệ thực sự trong việc xây dựng các thuật toán dự đoán, mà còn có được một vị trí tại một doanh nghiệp công nghệ đổi mới, nơi sự phát triển nghề nghiệp của tôi tăng theo cấp số nhân.",
    targetBand: 8.5,
    collocationsAndIdioms: [
      'pivotal decision',
      'altered my career trajectory',
      'agonizing dilemma',
      'uncharted territory',
      'took the plunge',
      'leap of faith',
      'paid immense dividends',
      'exponential growth',
    ],
    keyVocabulary: [
      { word: 'pivotal', ipa: '/ˈpɪv.ə.təl/', meaningVi: 'then chốt, có tính bước ngoặt' },
      { word: 'dilemma', ipa: '/daɪˈlem.ə/', meaningVi: 'tình thế tiến thoái lưỡng nan' },
      { word: 'exponential', ipa: '/ˌek.spəˈnen.ʃəl/', meaningVi: 'theo cấp số nhân, cực kỳ nhanh' },
    ],
    grammarNotes: ['Cấu trúc nhấn mạnh: "Not only did I discover..., but I also secured..."'],
  },
  {
    id: 'fc-p2-traditional-festival',
    topic: 'A Traditional Festival or Cultural Celebration',
    topicVi: 'Lễ hội truyền thống hoặc kỷ niệm văn hóa',
    quarter: 'Q2-2026',
    isForecastNew: false,
    part: 2,
    question: 'Describe an important traditional festival in your country.',
    cueBullets: [
      'What festival it is and when it takes place',
      'What activities people engage in',
      'What traditional food is prepared',
      'And explain why this festival holds special significance for you',
    ],
    sampleAnswer:
      "Without hesitation, the Lunar New Year, locally revered as Tet, is by far the most cherished and sacred celebration in Vietnamese culture. Occurring around late January or early February, it heralds the advent of spring and symbolizes a fresh spiritual start.\n\nIn the days leading up to Tet, households are swept up in a frenzy of spring cleaning to banish bad luck from the preceding year. Homes are embellished with radiant yellow apricot blossoms or pink peach flowers. The culinary centerpiece is Banh Chung, a square glutinous rice cake filled with mung bean and seasoned pork, wrapped in dong leaves and boiled over an open wood fire for over twelve hours.\n\nFor me, Tet transcends mere festivities; it is an emotional anchor. In an increasingly hectic world where family members are often dispersed by professional obligations, Tet serves as an inviolable sanctuary for intergenerational reunion and ancestral gratitude.",
    sampleAnswerVi:
      "Không chút do dự, Tết Nguyên đán là lễ hội thiêng liêng và được trân trọng nhất trong văn hóa Việt Nam. Diễn ra vào khoảng cuối tháng Giêng hoặc đầu tháng Hai, Tết báo hiệu sự khởi đầu của mùa xuân và tượng trưng cho sự khởi đầu mới mẻ về mặt tinh thần.\n\nNhững ngày giáp Tết, các gia đình đều bận rộn dọn dẹp nhà cửa để xua tan những điều xui xẻo của năm cũ. Nhà cửa được điểm tô rực rỡ bởi cành mai vàng hoặc hoa đào thắm. Tâm điểm của mâm cơm ngày Tết là Bánh Chưng, loại bánh nếp hình vuông nhân đậu xanh và thịt heo ướp gia vị, gói trong lá dong và luộc bằng củi lửa hơn mười hai tiếng đồng hồ.\n\nĐối với tôi, Tết vượt lên trên một ngày hội thông thường; nó là điểm tựa cảm xúc. Trong một thế giới ngày càng hối hả nơi các thành viên thường bị phân tán bởi trách nhiệm công việc, Tết là nơi chốn thiêng liêng bất khả xâm phạm để các thế hệ sum họp và bày tỏ lòng biết ơn tổ tiên.",
    targetBand: 8.5,
    collocationsAndIdioms: [
      'revered as',
      'heralds the advent of',
      'frenzy of spring cleaning',
      'culinary centerpiece',
      'transcends mere festivities',
      'emotional anchor',
      'inviolable sanctuary',
      'ancestral gratitude',
    ],
    keyVocabulary: [
      { word: 'herald', ipa: '/ˈher.əld/', meaningVi: 'báo hiệu, đón chào' },
      { word: 'inviolable', ipa: '/ɪnˈvaɪ.ə.lə.bəl/', meaningVi: 'bất khả xâm phạm, thiêng liêng' },
      { word: 'intergenerational', ipa: '/ˌɪn.təˌdʒen.əˈreɪ.ʃən.əl/', meaningVi: 'giữa các thế hệ' },
    ],
    grammarNotes: ['Phép ẩn dụ tinh tế: "emotional anchor", "inviolable sanctuary"'],
  },
];

export function getForecastByQuarter(quarter?: SpeakingSample['quarter']): SpeakingSample[] {
  if (!quarter) return SPEAKING_FORECAST;
  return SPEAKING_FORECAST.filter((s) => s.quarter === quarter);
}

export function getForecastByPart(part: 1 | 2 | 3): SpeakingSample[] {
  return SPEAKING_FORECAST.filter((s) => s.part === part);
}
