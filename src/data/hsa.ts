import type { Bi } from '@/i18n/useL';

export type HsaLevel = 'A2' | 'B1' | 'B2' | 'C1';
export type HsaQuestionKind =
  | 'sentence-completion'
  | 'synonym-antonym'
  | 'dialogue-completion'
  | 'dialogue-ordering'
  | 'sentence-rewriting'
  | 'sentence-combination'
  | 'cloze'
  | 'reading-comprehension'
  | 'reasoning'
  | 'vocabulary-in-context'
  | 'author-purpose'
  | 'evidence-evaluation'
  | 'data-interpretation'
  | 'sentence-insertion';

export type HsaQuestion = {
  id: string;
  kind: HsaQuestionKind;
  topic: string;
  level: HsaLevel;
  prompt: string;
  choices: readonly string[];
  answer: number;
  explanation: Bi;
  context?: string;
};

export type HsaVocab = { word: string; pos: string; vi: string; example: string; level: HsaLevel };
export type HsaTopic = {
  id: string;
  title: Bi;
  summary: Bi;
  focus: readonly Bi[];
  vocabulary: readonly HsaVocab[];
};

export const HSA_TOPICS: readonly HsaTopic[] = [
  {
    id: 'environment',
    title: { vi: 'Môi trường, khí hậu và năng lượng', en: 'Environment, climate and energy' },
    summary: { vi: 'Đọc về phát thải, bảo tồn, năng lượng sạch và giải pháp có đánh đổi.', en: 'Read about emissions, conservation, clean energy and trade-offs in environmental solutions.' },
    focus: [
      { vi: 'Từ vựng: carbon footprint, renewable, mitigate, biodiversity, conservation.', en: 'Vocabulary: carbon footprint, renewable, mitigate, biodiversity, conservation.' },
      { vi: 'Ngôn ngữ: nguyên nhân–kết quả, so sánh lợi ích và hệ quả ngoài dự kiến.', en: 'Language: cause and effect, comparing benefits and unintended consequences.' },
      { vi: 'Đọc: phân biệt mục tiêu của dự án với bằng chứng cho hiệu quả của nó.', en: 'Reading: distinguish a project’s aim from evidence that it works.' },
    ],
    vocabulary: [
      { word: 'carbon footprint', pos: 'noun phrase', vi: 'lượng phát thải carbon gắn với một hoạt động', example: 'The school measured its carbon footprint before changing its transport policy.', level: 'B1' },
      { word: 'renewable', pos: 'adjective', vi: 'có thể tái tạo', example: 'The island receives most of its electricity from renewable sources.', level: 'B1' },
      { word: 'mitigate', pos: 'verb', vi: 'giảm nhẹ tác động tiêu cực', example: 'Tree cover can mitigate the effects of extreme heat.', level: 'B2' },
      { word: 'biodiversity', pos: 'noun', vi: 'đa dạng sinh học', example: 'Wetlands support biodiversity by providing food and shelter.', level: 'B2' },
      { word: 'conservation', pos: 'noun', vi: 'sự bảo tồn', example: 'The conservation plan protects nesting areas during the breeding season.', level: 'B1' },
      { word: 'emission', pos: 'noun', vi: 'sự phát thải; khí thải', example: 'The policy aims to reduce emissions from private vehicles.', level: 'B2' },
      { word: 'ecosystem', pos: 'noun', vi: 'hệ sinh thái', example: 'Removing one species may affect the entire ecosystem.', level: 'B1' },
      { word: 'trade-off', pos: 'noun', vi: 'sự đánh đổi', example: 'The proposal involves a trade-off between lower costs and habitat protection.', level: 'B2' },
      { word: 'degradation', pos: 'noun', vi: 'sự suy thoái', example: 'Soil degradation makes farming less productive over time.', level: 'C1' },
      { word: 'offset', pos: 'verb', vi: 'bù đắp; cân bằng tác động', example: 'The company planted trees to offset some of its travel emissions.', level: 'B2' },
    ],
  },
  {
    id: 'technology',
    title: { vi: 'Công nghệ, AI và quyền riêng tư', en: 'Technology, AI and privacy' },
    summary: { vi: 'Đánh giá lợi ích công nghệ cùng giới hạn, rủi ro và tác động tới người dùng.', en: 'Evaluate technology’s benefits alongside its limits, risks and effects on users.' },
    focus: [
      { vi: 'Từ vựng: algorithm, automate, privacy, bias, reliable, disclose.', en: 'Vocabulary: algorithm, automate, privacy, bias, reliable, disclose.' },
      { vi: 'Ngôn ngữ: nhượng bộ, điều kiện, quan hệ nguyên nhân và mức độ chắc chắn.', en: 'Language: concession, conditions, causality and degrees of certainty.' },
      { vi: 'Đọc: tìm luận điểm, giới hạn của nghiên cứu và quan điểm thận trọng.', en: 'Reading: identify claims, study limitations and cautious author positions.' },
    ],
    vocabulary: [
      { word: 'algorithm', pos: 'noun', vi: 'thuật toán', example: 'The platform uses an algorithm to recommend videos.', level: 'B1' },
      { word: 'automate', pos: 'verb', vi: 'tự động hóa', example: 'The new system automates routine checks but still needs human review.', level: 'B2' },
      { word: 'privacy', pos: 'noun', vi: 'quyền riêng tư', example: 'Users should know how an app collects personal information.', level: 'B1' },
      { word: 'bias', pos: 'noun', vi: 'thiên lệch; thành kiến', example: 'A biased training dataset can produce unfair results.', level: 'B2' },
      { word: 'reliable', pos: 'adjective', vi: 'đáng tin cậy', example: 'The tool is useful only when its results are reliable.', level: 'B1' },
      { word: 'disclose', pos: 'verb', vi: 'tiết lộ; công khai', example: 'The company must disclose what data it stores.', level: 'B2' },
      { word: 'surveillance', pos: 'noun', vi: 'sự giám sát', example: 'Constant surveillance may discourage people from speaking freely.', level: 'C1' },
      { word: 'vulnerable', pos: 'adjective', vi: 'dễ bị tổn thương; dễ bị tấn công', example: 'Outdated software leaves devices vulnerable to attacks.', level: 'B2' },
      { word: 'consent', pos: 'noun', vi: 'sự đồng thuận', example: 'Users should give informed consent before sharing sensitive data.', level: 'B2' },
      { word: 'misinformation', pos: 'noun', vi: 'thông tin sai lệch', example: 'Misinformation can spread quickly through private group chats.', level: 'C1' },
    ],
  },
  {
    id: 'education',
    title: { vi: 'Giáo dục và cách học', en: 'Education and learning' },
    summary: { vi: 'Luyện các văn bản về học trực tuyến, lựa chọn trường, kỹ năng và đánh giá.', en: 'Practise texts about online learning, school choice, skills and assessment.' },
    focus: [
      { vi: 'Từ vựng: access, qualification, curriculum, feedback, acquire, retain.', en: 'Vocabulary: access, qualification, curriculum, feedback, acquire, retain.' },
      { vi: 'Ngôn ngữ: diễn đạt mục đích, điều kiện, kết quả và ý kiến có căn cứ.', en: 'Language: express purpose, conditions, outcomes and evidence-based opinions.' },
      { vi: 'Đọc: so sánh hai lựa chọn và suy ra tiêu chí người viết ưu tiên.', en: 'Reading: compare options and infer which criteria the writer prioritises.' },
    ],
    vocabulary: [
      { word: 'curriculum', pos: 'noun', vi: 'chương trình học', example: 'The curriculum includes practical projects as well as examinations.', level: 'B1' },
      { word: 'qualification', pos: 'noun', vi: 'bằng cấp; trình độ chuyên môn', example: 'The course provides a qualification recognised by local employers.', level: 'B1' },
      { word: 'feedback', pos: 'noun', vi: 'phản hồi', example: 'Specific feedback helps learners understand what to improve.', level: 'B1' },
      { word: 'retain', pos: 'verb', vi: 'ghi nhớ; giữ lại', example: 'Students retain more information when they revisit it over time.', level: 'B2' },
      { word: 'acquire', pos: 'verb', vi: 'tiếp thu; đạt được', example: 'Learners acquire vocabulary more effectively in meaningful contexts.', level: 'B2' },
      { word: 'accessible', pos: 'adjective', vi: 'dễ tiếp cận', example: 'Recorded lessons make the course more accessible to rural students.', level: 'B2' },
      { word: 'assessment', pos: 'noun', vi: 'sự đánh giá; bài đánh giá', example: 'The assessment measures reasoning as well as factual knowledge.', level: 'B2' },
      { word: 'compulsory', pos: 'adjective', vi: 'bắt buộc', example: 'Career guidance is compulsory for all final-year students.', level: 'B1' },
      { word: 'scholarship', pos: 'noun', vi: 'học bổng', example: 'The scholarship covers tuition but not accommodation.', level: 'B1' },
      { word: 'disparity', pos: 'noun', vi: 'sự chênh lệch', example: 'A digital disparity remains between urban and remote schools.', level: 'C1' },
    ],
  },
  {
    id: 'work-careers',
    title: { vi: 'Nghề nghiệp và tương lai việc làm', en: 'Careers and the future of work' },
    summary: { vi: 'Đọc về đào tạo nghề, kỹ năng chuyển đổi, tuyển dụng và tự động hóa.', en: 'Read about vocational training, transferable skills, recruitment and automation.' },
    focus: [
      { vi: 'Từ vựng: vocational, vacancy, retain, transferable, employment, recruit.', en: 'Vocabulary: vocational, vacancy, retain, transferable, employment, recruit.' },
      { vi: 'Ngôn ngữ: động từ theo sau bởi V-ing/to-infinitive; cụm động từ và kết hợp từ.', en: 'Language: verb patterns, phrasal verbs and collocations.' },
      { vi: 'Đọc: phân biệt dự báo với dữ kiện và nhận diện điều kiện tuyển dụng.', en: 'Reading: distinguish forecasts from facts and identify job requirements.' },
    ],
    vocabulary: [
      { word: 'vocational', pos: 'adjective', vi: 'thuộc đào tạo nghề', example: 'Vocational courses combine classroom study with workplace practice.', level: 'B1' },
      { word: 'vacancy', pos: 'noun', vi: 'vị trí tuyển dụng còn trống', example: 'The company advertised a vacancy for a laboratory assistant.', level: 'B1' },
      { word: 'transferable', pos: 'adjective', vi: 'có thể chuyển đổi/áp dụng ở nhiều nơi', example: 'Clear communication is a transferable skill.', level: 'B2' },
      { word: 'retain', pos: 'verb', vi: 'giữ chân', example: 'Flexible schedules help employers retain experienced staff.', level: 'B2' },
      { word: 'recruit', pos: 'verb', vi: 'tuyển dụng', example: 'The firm plans to recruit graduates with data skills.', level: 'B1' },
      { word: 'applicant', pos: 'noun', vi: 'người nộp đơn; ứng viên', example: 'Each applicant must provide two references.', level: 'B1' },
      { word: 'redundant', pos: 'adjective', vi: 'bị mất việc do vị trí bị cắt giảm', example: 'Some workers were made redundant after the factory closed.', level: 'B2' },
      { word: 'remuneration', pos: 'noun', vi: 'thù lao', example: 'The role offers competitive remuneration and training.', level: 'C1' },
      { word: 'internship', pos: 'noun', vi: 'kỳ thực tập', example: 'An internship can help students test a career choice.', level: 'B1' },
      { word: 'promotion', pos: 'noun', vi: 'sự thăng chức; quảng bá', example: 'She received a promotion after leading the project.', level: 'B1' },
    ],
  },
  {
    id: 'society-health',
    title: { vi: 'Xã hội, sức khỏe và đời sống', en: 'Society, health and daily life' },
    summary: { vi: 'Luyện văn bản về sức khỏe cộng đồng, thói quen, dân số và cơ hội bình đẳng.', en: 'Practise texts about public health, habits, population and equal opportunity.' },
    focus: [
      { vi: 'Từ vựng: well-being, access, prevent, disparity, participation, burden.', en: 'Vocabulary: well-being, access, prevent, disparity, participation, burden.' },
      { vi: 'Ngôn ngữ: lời khuyên, nghĩa vụ, giả định và cấu trúc nhấn mạnh.', en: 'Language: advice, obligation, hypotheses and emphasis.' },
      { vi: 'Đọc: tách tương quan khỏi quan hệ nhân quả và nhận diện giới hạn dữ liệu.', en: 'Reading: separate correlation from causation and identify data limitations.' },
    ],
    vocabulary: [
      { word: 'well-being', pos: 'noun', vi: 'sức khỏe và trạng thái an lạc', example: 'Regular exercise can improve both physical and mental well-being.', level: 'B2' },
      { word: 'access', pos: 'noun', vi: 'khả năng tiếp cận', example: 'Reliable public transport improves access to healthcare.', level: 'B1' },
      { word: 'prevent', pos: 'verb', vi: 'ngăn ngừa', example: 'Early screening can prevent some complications.', level: 'B1' },
      { word: 'disparity', pos: 'noun', vi: 'sự bất bình đẳng; chênh lệch', example: 'The report found a disparity in access to sports facilities.', level: 'C1' },
      { word: 'participation', pos: 'noun', vi: 'sự tham gia', example: 'Community participation improved the health campaign.', level: 'B2' },
      { word: 'burden', pos: 'noun', vi: 'gánh nặng', example: 'Long travel times place an extra burden on patients.', level: 'B2' },
      { word: 'sedentary', pos: 'adjective', vi: 'ít vận động', example: 'A sedentary routine may increase health risks.', level: 'C1' },
      { word: 'outbreak', pos: 'noun', vi: 'đợt bùng phát dịch/bệnh', example: 'The clinic responded quickly to the outbreak.', level: 'B2' },
      { word: 'nutrition', pos: 'noun', vi: 'dinh dưỡng', example: 'Good nutrition supports concentration at school.', level: 'B1' },
      { word: 'inclusive', pos: 'adjective', vi: 'bao trùm; hòa nhập', example: 'An inclusive programme welcomes participants with different abilities.', level: 'B2' },
    ],
  },
  {
    id: 'cities-transport',
    title: { vi: 'Đô thị, giao thông và du lịch', en: 'Cities, transport and travel' },
    summary: { vi: 'Luyện đọc về quy hoạch thành phố, giao thông, du lịch có trách nhiệm và lựa chọn điểm đến.', en: 'Read about city planning, transport, responsible tourism and destination choices.' },
    focus: [
      { vi: 'Từ vựng: congestion, commute, infrastructure, pedestrian, itinerary, sustainable.', en: 'Vocabulary: congestion, commute, infrastructure, pedestrian, itinerary, sustainable.' },
      { vi: 'Ngôn ngữ: so sánh phương án, đề xuất giải pháp và diễn đạt điều kiện.', en: 'Language: compare options, propose solutions and express conditions.' },
      { vi: 'Đọc: kết hợp thông tin từ mô tả, bảng hoặc biển báo.', en: 'Reading: combine information from descriptions, tables or notices.' },
    ],
    vocabulary: [
      { word: 'congestion', pos: 'noun', vi: 'tình trạng ùn tắc', example: 'A reliable bus network can ease traffic congestion.', level: 'B2' },
      { word: 'commute', pos: 'noun/verb', vi: 'việc đi lại hằng ngày giữa nhà và nơi làm/học', example: 'Her commute takes less time since the new rail line opened.', level: 'B1' },
      { word: 'infrastructure', pos: 'noun', vi: 'cơ sở hạ tầng', example: 'Tourism growth has placed pressure on local infrastructure.', level: 'B2' },
      { word: 'pedestrian', pos: 'noun', vi: 'người đi bộ', example: 'The street is closed to vehicles and reserved for pedestrians.', level: 'B1' },
      { word: 'itinerary', pos: 'noun', vi: 'lịch trình chuyến đi', example: 'The itinerary includes a visit to two heritage sites.', level: 'B2' },
      { word: 'sustainable', pos: 'adjective', vi: 'bền vững', example: 'The town is seeking a more sustainable model of tourism.', level: 'B2' },
      { word: 'destination', pos: 'noun', vi: 'điểm đến', example: 'The coastal destination attracts visitors outside the peak season.', level: 'B1' },
      { word: 'revenue', pos: 'noun', vi: 'doanh thu', example: 'Local businesses receive part of the tourism revenue.', level: 'B2' },
      { word: 'overcrowding', pos: 'noun', vi: 'tình trạng quá đông', example: 'Overcrowding can damage fragile historic streets.', level: 'C1' },
      { word: 'accessible', pos: 'adjective', vi: 'có thể tiếp cận; thuận tiện cho người khuyết tật', example: 'The new station is accessible to wheelchair users.', level: 'B2' },
    ],
  },
  {
    id: 'culture-asean',
    title: { vi: 'Văn hóa, di sản và ASEAN', en: 'Culture, heritage and ASEAN' },
    summary: { vi: 'Ôn văn bản về di sản, giao lưu, tình nguyện và hợp tác khu vực.', en: 'Study texts about heritage, exchange, volunteering and regional cooperation.' },
    focus: [
      { vi: 'Từ vựng: heritage, preserve, peer, volunteer, regional, participate.', en: 'Vocabulary: heritage, preserve, peer, volunteer, regional, participate.' },
      { vi: 'Ngôn ngữ: lịch sự trong hội thoại, nối lượt lời và cụm động từ.', en: 'Language: conversational politeness, turn-taking and phrasal verbs.' },
      { vi: 'Đọc: xác định mục đích chương trình và đối tượng được hưởng lợi.', en: 'Reading: identify a programme’s purpose and its beneficiaries.' },
    ],
    vocabulary: [
      { word: 'heritage', pos: 'noun', vi: 'di sản', example: 'The festival introduces young people to the region’s musical heritage.', level: 'B1' },
      { word: 'preserve', pos: 'verb', vi: 'bảo tồn; gìn giữ', example: 'Residents worked together to preserve the old market.', level: 'B1' },
      { word: 'volunteer', pos: 'noun/verb', vi: 'tình nguyện viên; tình nguyện', example: 'Volunteers helped visitors find the community centre.', level: 'B1' },
      { word: 'regional', pos: 'adjective', vi: 'thuộc khu vực', example: 'The programme promotes regional cooperation among schools.', level: 'B2' },
      { word: 'participate', pos: 'verb', vi: 'tham gia', example: 'Students can participate in a cultural exchange.', level: 'B1' },
      { word: 'peer', pos: 'noun', vi: 'người cùng lứa; bạn đồng trang lứa', example: 'Participants formed networks with peers from neighbouring countries.', level: 'B2' },
      { word: 'artefact', pos: 'noun', vi: 'hiện vật', example: 'The museum returned the artefact to its place of origin.', level: 'B2' },
      { word: 'custom', pos: 'noun', vi: 'phong tục', example: 'The guide explained the custom before the ceremony began.', level: 'B1' },
      { word: 'contribute', pos: 'verb', vi: 'đóng góp', example: 'Local residents contributed stories to the exhibition.', level: 'B1' },
      { word: 'cross-cultural', pos: 'adjective', vi: 'liên văn hóa', example: 'The project encourages cross-cultural understanding.', level: 'B2' },
    ],
  },
  {
    id: 'media-information',
    title: { vi: 'Truyền thông và thông tin', en: 'Media and information' },
    summary: { vi: 'Đọc về tin giả, lựa chọn nội dung, quyền riêng tư và độ tin cậy của nguồn.', en: 'Read about misinformation, content selection, privacy and source credibility.' },
    focus: [
      { vi: 'Từ vựng: credible, verify, source, claim, evidence, misleading.', en: 'Vocabulary: credible, verify, source, claim, evidence, misleading.' },
      { vi: 'Ngôn ngữ: phân biệt sự kiện/ý kiến; quy chiếu đại từ và paraphrase.', en: 'Language: distinguish fact from opinion; track reference and paraphrase.' },
      { vi: 'Đọc: nhận diện mục đích, thiên kiến và điều văn bản không khẳng định.', en: 'Reading: identify purpose, bias and what a text does not claim.' },
    ],
    vocabulary: [
      { word: 'credible', pos: 'adjective', vi: 'đáng tin', example: 'Readers should check whether a source is credible.', level: 'B2' },
      { word: 'verify', pos: 'verb', vi: 'xác minh', example: 'The journalist verified the figures with two independent sources.', level: 'B2' },
      { word: 'claim', pos: 'noun/verb', vi: 'tuyên bố; khẳng định', example: 'The report makes a claim but provides little supporting evidence.', level: 'B2' },
      { word: 'evidence', pos: 'noun', vi: 'bằng chứng', example: 'The evidence does not prove that the policy caused the change.', level: 'B1' },
      { word: 'misleading', pos: 'adjective', vi: 'gây hiểu lầm', example: 'The headline is misleading because it leaves out an important condition.', level: 'B2' },
      { word: 'source', pos: 'noun', vi: 'nguồn tin', example: 'The article identifies its source for every statistic.', level: 'B1' },
      { word: 'privacy policy', pos: 'noun phrase', vi: 'chính sách quyền riêng tư', example: 'The privacy policy explains how the app uses location data.', level: 'B2' },
      { word: 'exposure', pos: 'noun', vi: 'sự phơi bày; mức tiếp xúc', example: 'Repeated exposure to a claim can make it seem familiar.', level: 'C1' },
      { word: 'confirm', pos: 'verb', vi: 'xác nhận', example: 'A second source confirmed the date of the announcement.', level: 'B1' },
      { word: 'assumption', pos: 'noun', vi: 'giả định', example: 'The argument depends on an assumption that is never tested.', level: 'B2' },
    ],
  },
  {
    id: 'science-agriculture',
    title: { vi: 'Khoa học, nông nghiệp và đa dạng sinh học', en: 'Science, farming and biodiversity' },
    summary: { vi: 'Luyện đọc về nghiên cứu, sản xuất lương thực, đất, nước và bảo tồn.', en: 'Practise reading about research, food production, soil, water and conservation.' },
    focus: [
      { vi: 'Từ vựng: yield, crop, soil, drought, species, sustainable, evidence.', en: 'Vocabulary: yield, crop, soil, drought, species, sustainable, evidence.' },
      { vi: 'Ngôn ngữ: số liệu, xu hướng, điều kiện và mức độ chắc chắn.', en: 'Language: data, trends, conditions and degrees of certainty.' },
      { vi: 'Đọc: đọc bảng/đơn vị, phân biệt kết quả quan sát với kết luận rộng hơn.', en: 'Reading: interpret tables/units and distinguish observations from broad conclusions.' },
    ],
    vocabulary: [
      { word: 'yield', pos: 'noun/verb', vi: 'sản lượng; tạo ra sản lượng', example: 'The new method increased crop yields without expanding farmland.', level: 'B2' },
      { word: 'crop', pos: 'noun', vi: 'cây trồng; vụ mùa', example: 'Farmers rotate crops to maintain soil quality.', level: 'B1' },
      { word: 'soil', pos: 'noun', vi: 'đất trồng', example: 'Healthy soil stores water and supports plant growth.', level: 'B1' },
      { word: 'drought', pos: 'noun', vi: 'hạn hán', example: 'A prolonged drought reduced the harvest.', level: 'B2' },
      { word: 'species', pos: 'noun', vi: 'loài', example: 'Several species depend on the wetland for breeding.', level: 'B1' },
      { word: 'fertiliser', pos: 'noun', vi: 'phân bón', example: 'Excess fertiliser can enter rivers after heavy rain.', level: 'B2' },
      { word: 'pollinator', pos: 'noun', vi: 'loài thụ phấn', example: 'Wild pollinators contribute to the production of many crops.', level: 'C1' },
      { word: 'resilient', pos: 'adjective', vi: 'có khả năng chống chịu/phục hồi', example: 'Diversified farms are often more resilient to weather shocks.', level: 'C1' },
      { word: 'harvest', pos: 'noun/verb', vi: 'vụ thu hoạch; thu hoạch', example: 'The harvest was delayed by unusually wet weather.', level: 'B1' },
      { word: 'contamination', pos: 'noun', vi: 'sự nhiễm bẩn/ô nhiễm', example: 'Testing detected contamination in the irrigation water.', level: 'C1' },
    ],
  },
  {
    id: 'communication',
    title: { vi: 'Giao tiếp và xử lý tình huống', en: 'Communication and situational reasoning' },
    summary: { vi: 'Luyện chọn phản hồi lịch sự, nhận diện ý định và suy luận từ dữ kiện đời thường.', en: 'Practise polite responses, speaker intent and reasoning from everyday evidence.' },
    focus: [
      { vi: 'Từ vựng: acknowledge, clarify, apologise, compensate, imply, appropriate.', en: 'Vocabulary: acknowledge, clarify, apologise, compensate, imply, appropriate.' },
      { vi: 'Ngôn ngữ: lời đề nghị, từ chối lịch sự, cảm ơn, xin lỗi và nhượng bộ.', en: 'Language: offers, polite refusals, thanks, apologies and concessions.' },
      { vi: 'Suy luận: chọn phương án phù hợp nhất với mục tiêu và quan hệ giữa người nói.', en: 'Reasoning: choose the response that best fits the speakers’ goals and relationship.' },
    ],
    vocabulary: [
      { word: 'acknowledge', pos: 'verb', vi: 'thừa nhận; ghi nhận', example: 'She acknowledged the mistake and offered to correct it.', level: 'B2' },
      { word: 'clarify', pos: 'verb', vi: 'làm rõ', example: 'Could you clarify which document you need by Friday?', level: 'B1' },
      { word: 'apologise', pos: 'verb', vi: 'xin lỗi', example: 'He apologised for interrupting the meeting.', level: 'B1' },
      { word: 'compensate', pos: 'verb', vi: 'bồi thường; bù đắp', example: 'The shop compensated the customer for the damaged item.', level: 'B2' },
      { word: 'imply', pos: 'verb', vi: 'hàm ý', example: 'Her reply implies that she needs more time.', level: 'B2' },
      { word: 'appropriate', pos: 'adjective', vi: 'phù hợp', example: 'A brief apology is appropriate in this situation.', level: 'B1' },
      { word: 'reluctant', pos: 'adjective', vi: 'miễn cưỡng', example: 'He was reluctant to share details in front of the group.', level: 'B2' },
      { word: 'reassure', pos: 'verb', vi: 'trấn an', example: 'The manager reassured staff that no jobs would be cut.', level: 'B2' },
      { word: 'tactful', pos: 'adjective', vi: 'khéo léo, tế nhị', example: 'A tactful response can prevent the disagreement from escalating.', level: 'C1' },
      { word: 'consequence', pos: 'noun', vi: 'hệ quả', example: 'She explained the likely consequence of missing the deadline.', level: 'B1' },
    ],
  },
];

export const HSA_KIND_LABEL: Record<HsaQuestionKind, Bi> = {
  'sentence-completion': { vi: 'Hoàn thành câu', en: 'Sentence completion' },
  'synonym-antonym': { vi: 'Đồng nghĩa · trái nghĩa', en: 'Synonyms · antonyms' },
  'dialogue-completion': { vi: 'Hoàn thành hội thoại', en: 'Dialogue completion' },
  'dialogue-ordering': { vi: 'Sắp xếp hội thoại', en: 'Dialogue ordering' },
  'sentence-rewriting': { vi: 'Viết lại câu', en: 'Sentence rewriting' },
  'sentence-combination': { vi: 'Kết hợp câu', en: 'Sentence combination' },
  cloze: { vi: 'Điền khuyết theo ngữ cảnh', en: 'Contextual cloze' },
  'reading-comprehension': { vi: 'Đọc hiểu theo chùm', en: 'Passage-based reading' },
  reasoning: { vi: 'Suy luận tình huống', en: 'Situational reasoning' },
  'vocabulary-in-context': { vi: 'Từ vựng trong ngữ cảnh', en: 'Vocabulary in context' },
  'author-purpose': { vi: 'Mục đích và thái độ tác giả', en: 'Author purpose and stance' },
  'evidence-evaluation': { vi: 'Đánh giá bằng chứng', en: 'Evidence evaluation' },
  'data-interpretation': { vi: 'Đọc và diễn giải dữ liệu', en: 'Data interpretation' },
  'sentence-insertion': { vi: 'Chèn câu vào đoạn văn', en: 'Sentence insertion' },
};

const mangrovePassage = `In several coastal communities, mangrove restoration is presented as a response to erosion and storm damage. The trees can reduce wave energy, provide nursery habitat for fish and store carbon. Yet planting seedlings is not enough. A project in the Mekong Delta found that young mangroves survived poorly where tidal channels had been blocked by earlier construction. Once water could move through the site again, survival improved. Researchers therefore argue that restoration should begin with the conditions that allow a forest to function, rather than with the number of seedlings planted. Local fishers also need to be involved: their knowledge can identify seasonal changes that short surveys miss. The project is promising, but its results cannot be transferred automatically to every coastline; soil, tides and land use differ from place to place.`;
const privacyPassage = `Recommendation systems help users find videos, news and products among millions of choices. They do so by predicting what a person may want to see, often from previous clicks and viewing time. This can make a service more convenient, but it may also narrow the range of material a user encounters. A research team compared two groups of volunteers: one used a standard recommendation feed, while the other could switch to a chronological feed. The second group viewed a wider range of sources, although the study lasted only three weeks and involved a small number of participants. The researchers caution that wider exposure does not automatically lead to better understanding. They recommend giving users clear controls and explaining why particular items appear. The study identifies a possible effect; it does not prove that recommendation systems alone determine people's opinions.`;
const clozePassage = `A school garden was created to help students understand how food reaches their tables. At first, the project focused on growing vegetables. Later, teachers added a simple record of rainfall and soil moisture. The records showed that plots receiving the same amount of rain did not always produce the same harvest. Students found that shade, soil condition and watering time also mattered. The garden therefore became a small outdoor laboratory. Its results should not be treated as a universal farming rule, because one school garden cannot represent every climate. However, the project gave students a practical way to test an idea, compare evidence and revise their assumptions.`;

function q(
  id: string, kind: HsaQuestionKind, topic: string, level: HsaLevel, prompt: string,
  choices: readonly string[], answer: number, vi: string, en: string, context?: string,
): HsaQuestion {
  return { id, kind, topic, level, prompt, choices, answer, explanation: { vi, en }, context };
}

export const HSA_FORM_1: readonly HsaQuestion[] = [
  q('hsa1-01','sentence-completion','environment','A2','The new bus route makes the town centre more ______ for students who live outside the city.', ['accessible','access','accessibly','accessibility'],0,'Sau “makes + object” cần tính từ bổ nghĩa cho “the town centre”.','The complement after “makes + object” is an adjective describing “the town centre”.'),
  q('hsa1-02','sentence-completion','work-careers','B1','Many graduates are interested ______ taking a short vocational course before applying for work.', ['on','in','at','for'],1,'Cấu trúc đúng là “be interested in + V-ing”.','The correct pattern is “be interested in + -ing”.'),
  q('hsa1-03','sentence-completion','technology','B2','The report recommends that personal data ______ only when users have given clear consent.', ['is collected','be collected','will collect','collecting'],1,'Sau “recommend that”, văn phong trang trọng dùng giả định thức: động từ nguyên mẫu bị động “be collected”.','After “recommend that”, formal English can use the subjunctive base form; the passive is “be collected”.'),
  q('hsa1-04','sentence-completion','education','B1','If the school ______ the online materials earlier, more students would have completed the preparation task.', ['shared','had shared','would share','has shared'],1,'Đây là câu điều kiện loại 3: “If + past perfect”, mệnh đề chính “would have + past participle”.','This is a third conditional: “if + past perfect” with “would have + past participle”.'),
  q('hsa1-05','sentence-completion','environment','B2','The project was praised for its ______ approach to protecting both the wetland and local livelihoods.', ['comprehend','comprehensive','comprehensively','comprehension'],1,'Vị trí trước danh từ “approach” cần tính từ “comprehensive”.','The position before the noun “approach” requires the adjective “comprehensive”.'),
  q('hsa1-06','sentence-completion','cities-transport','B2','The council will get contractors ______ the damaged footpath before the rainy season.', ['repair','to repair','repaired','repairing'],1,'Cấu trúc sai khiến chủ động là “get + object + to-infinitive”.','The active causative pattern is “get + object + to-infinitive”.'),
  q('hsa1-07','sentence-completion','society-health','A2','You ______ wear a helmet when riding a motorbike; it is required by law.', ['should have','must','might','would rather'],1,'“Must” diễn tả nghĩa vụ bắt buộc theo luật.','“Must” expresses a legal obligation.'),
  q('hsa1-08','sentence-completion','media-information','B2','The headline was deliberately ______, so readers assumed the trial had proved more than it actually had.', ['mislead','misleading','misled','misleadingly'],1,'Sau “was” cần tính từ mô tả headline; “misleading” nghĩa là gây hiểu lầm.','An adjective is needed after “was”; “misleading” means giving the wrong impression.'),
  q('hsa1-09','sentence-completion','culture-asean','B1','The guide explained the custom ______ the visitors entered the community hall.', ['before','unless','despite','whereas'],0,'“Before” diễn tả hướng dẫn được đưa ra trước khi khách bước vào.','“Before” shows that the explanation came prior to the visitors entering.'),
  q('hsa1-10','sentence-completion','science-agriculture','B2','The crop failed not because of a lack of rain, ______ because the drainage channels were blocked.', ['and','but','so','or'],1,'Cấu trúc tương phản song hành: “not because…, but because…”.','The paired contrast is “not because…, but because…”.'),
  q('hsa1-11','synonym-antonym','technology','B2','In the passage, “mitigate” is closest in meaning to:', ['make less severe','make more visible','measure precisely','remove completely'],0,'“Mitigate” là làm giảm mức độ nghiêm trọng, không nhất thiết loại bỏ hoàn toàn.','“Mitigate” means make something less severe, not necessarily eliminate it.'),
  q('hsa1-12','synonym-antonym','media-information','B2','Choose the closest meaning to “credible” in “a credible source”.', ['believable','popular','recent','complicated'],0,'Nguồn “credible” là nguồn đáng tin, có thể tin được.','A “credible” source is believable and trustworthy.'),
  q('hsa1-13','synonym-antonym','cities-transport','B1','Choose the opposite of “reluctant” in “She was reluctant to change her travel plans.”', ['eager','uncertain','unable','careful'],0,'“Reluctant” là miễn cưỡng; trái nghĩa gần nhất là “eager” (háo hức/sẵn lòng).','“Reluctant” means unwilling; its closest opposite here is “eager”.'),
  q('hsa1-14','synonym-antonym','science-agriculture','B2','Choose the opposite of “scarce” in “Fresh water is scarce during the dry season.”', ['abundant','polluted','distant','shallow'],0,'“Scarce” là khan hiếm; trái nghĩa là “abundant” (dồi dào).','“Scarce” means limited; its opposite is “abundant”.'),
  q('hsa1-15','dialogue-completion','communication','A2','A: Thank you for explaining the timetable.\nB: ______', ['Never mind; I forgot it.','You’re welcome.','I disagree with the timetable.','It was explained yesterday.'],1,'Đáp lại lời cảm ơn phù hợp là “You’re welcome.”','“You’re welcome” is the appropriate response to thanks.'),
  q('hsa1-16','dialogue-completion','communication','B1','A: Would you mind if I opened the window?\nB: ______', ['Not at all. Go ahead.','Yes, I would open it.','I don’t mind the weather yesterday.','You must have opened it.'],0,'“Not at all. Go ahead” chấp thuận lịch sự lời xin phép.','“Not at all. Go ahead” politely grants permission.'),
  q('hsa1-17','dialogue-completion','communication','B2','A: I’m sorry I missed the planning meeting.\nB: ______ We can send you the notes this afternoon.', ['That’s all right.','You should be sorry.','I hope you missed it.','It is not your planning.'],0,'“That’s all right” chấp nhận lời xin lỗi; câu sau đưa ra cách hỗ trợ.','“That’s all right” accepts the apology, and the next sentence offers help.'),
  q('hsa1-18','dialogue-completion','work-careers','B2','A: Could you submit the revised report by noon?\nB: ______ I need to check one figure first.', ['Certainly, I will send it by then.','No, the report submitted yesterday.','I would rather you submitted me.','That is why the figure is noon.'],0,'Câu trả lời xác nhận yêu cầu và nêu bước còn cần làm.','The reply acknowledges the request and states the remaining step.'),
  q('hsa1-19','dialogue-ordering','cities-transport','B1','Arrange the dialogue.\na. It leaves every ten minutes from the station.\nb. Excuse me, how often does the airport bus run?\nc. That’s convenient. Where can I buy a ticket?\nd. You can buy one from the machine beside the entrance.', ['b-a-c-d','a-b-d-c','c-d-b-a','b-c-a-d'],0,'Hỏi lịch xe → trả lời tần suất → hỏi mua vé → chỉ chỗ mua.','Ask about frequency → answer → ask where to buy a ticket → give directions.'),
  q('hsa1-20','dialogue-ordering','education','B2','Arrange the dialogue.\na. I compared the course content and the support available to students.\nb. What helped you choose between the two colleges?\nc. That makes sense; the lower fee was not your only concern.\nd. Exactly. I also wanted a course with a placement year.', ['b-a-d-c','a-b-c-d','b-c-a-d','d-a-b-c'],0,'Câu hỏi mở đầu; người trả lời nêu tiêu chí, bổ sung thêm, rồi người kia nhận xét.','The question comes first, followed by the criteria, an additional point and a response.'),
  q('hsa1-21','dialogue-ordering','environment','B1','Arrange the dialogue.\na. The council is testing them near the river.\nb. Have you seen the new flood sensors?\nc. Do they send an alert when water rises?\nd. Yes, they warn residents before the level becomes dangerous.', ['b-a-c-d','a-c-b-d','c-d-b-a','b-c-a-d'],0,'Giới thiệu cảm biến → vị trí lắp → hỏi chức năng → giải thích cảnh báo.','Introduce the sensors → say where they are → ask their function → explain the alert.'),
  q('hsa1-22','dialogue-ordering','culture-asean','B2','Arrange the dialogue.\na. Would you like me to show you how to register?\nb. I’m interested in joining the regional volunteer programme.\nc. Yes, please. I’m not sure which form to complete.\nd. Start with the online application; the host organisation will contact you later.', ['b-a-c-d','a-b-d-c','b-c-d-a','c-a-b-d'],0,'Nêu nguyện vọng → đề nghị hỗ trợ → đồng ý và hỏi → hướng dẫn đăng ký.','State the interest → offer help → accept and ask → explain registration.'),
  q('hsa1-23','sentence-rewriting','education','B2','The school started the mentoring programme in 2022. It still runs today.\nChoose the sentence with the same meaning.', ['The school has run the mentoring programme since 2022.','The school ran the mentoring programme before 2022.','The school will have started the programme by 2022.','The school has stopped running the programme in 2022.'],0,'Hành động bắt đầu trong quá khứ và còn tiếp diễn: hiện tại hoàn thành với “since”.','An action that began in the past and continues uses the present perfect with “since”.'),
  q('hsa1-24','sentence-rewriting','environment','B2','Although the restoration was expensive, the village decided to continue it.\nChoose the sentence with the same meaning.', ['Despite the high cost, the village decided to continue the restoration.','Because the restoration was expensive, the village stopped it.','The village continued only if the restoration became cheaper.','The restoration was expensive, so the village had already completed it.'],0,'“Although” có thể chuyển thành “despite + noun phrase” mà vẫn giữ quan hệ nhượng bộ.','“Although” can be paraphrased as “despite + noun phrase” while keeping the concession.'),
  q('hsa1-25','sentence-rewriting','work-careers','B2','People believe that the new training centre will improve local employment.\nChoose the closest meaning.', ['The new training centre is believed to improve local employment.','The new training centre believes people will find work.','Local employment has believed the training centre.','People are believed that training improves employment.'],0,'Cấu trúc bị động tường thuật: “It is believed that…” hoặc “subject + is believed to…”.','This is a reporting passive: “It is believed that…” or “subject + is believed to…”.'),
  q('hsa1-26','sentence-rewriting','technology','C1','The committee did not publish the results until it had checked the data.\nChoose the sentence with the same meaning.', ['Not until it had checked the data did the committee publish the results.','Not until the results were published the committee checked the data.','The committee published the results because it did not check the data.','Only after publishing the results had the committee checked the data.'],0,'Đảo ngữ với “Not until”: trợ động từ đứng trước chủ ngữ ở mệnh đề chính.','With fronted “Not until”, the auxiliary precedes the subject in the main clause.'),
  q('hsa1-27','sentence-combination','science-agriculture','B1','The soil was unusually dry. The farmers delayed planting the seeds.', ['The farmers delayed planting the seeds because the soil was unusually dry.','Although the soil was unusually dry, the farmers delayed planting the seeds because it was wet.','The soil was unusually dry, so the farmers had planted the seeds earlier.','The farmers delayed the soil, which was planting the seeds.'],0,'“Because” nối nguyên nhân (đất khô) với kết quả (trì hoãn gieo hạt).','“Because” links the cause (dry soil) to the result (delayed planting).'),
  q('hsa1-28','sentence-combination','media-information','B2','The survey included only 40 people. Its findings should be interpreted cautiously.', ['Because the survey included only 40 people, its findings should be interpreted cautiously.','The survey included only 40 people, so its findings are certainly universal.','Although the survey was small, its findings cannot be interpreted.','The findings interpreted the survey, which included people cautiously.'],0,'Mệnh đề nguyên nhân giải thích vì sao cần thận trọng với kết quả mẫu nhỏ.','The cause clause explains why a small-sample finding needs cautious interpretation.'),
  q('hsa1-29','sentence-combination','cities-transport','B2','The city expanded the cycle network. More commuters began travelling by bicycle.', ['After the city expanded the cycle network, more commuters began travelling by bicycle.','The city expanded the cycle network unless commuters travelled by bicycle.','More commuters expanded the city because the cycle network began.','The cycle network was travelling by bicycle after commuters expanded.'],0,'“After” diễn tả trình tự thời gian hợp lý giữa mở rộng mạng lưới và thay đổi hành vi.','“After” expresses the logical sequence between network expansion and behaviour change.'),
  q('hsa1-30','sentence-combination','culture-asean','C1','The artefact was returned to its community. It had been removed from that community decades earlier.', ['The artefact was returned to the community from which it had been removed decades earlier.','The community returned the artefact that removed it decades earlier.','The artefact had returned the community where it was removed earlier.','The artefact was removed decades earlier, which the community returned.'],0,'Mệnh đề quan hệ “from which” thay cho “from that community” và giữ đúng quan hệ nghĩa.','The relative phrase “from which” replaces “from that community” without changing the relationship.'),
  q('hsa1-31','reasoning','communication','A2','You arrive at a group activity and do not know the other students. You want to join politely. What is the best response?', ['Could I join you, if there is room?','You should all stop and watch me.','I joined yesterday, so move over.','Why are you doing this activity?'],0,'Phương án A nêu mong muốn và xin phép một cách lịch sự, phù hợp tình huống.','A politely expresses interest and asks permission, matching the situation.'),
  q('hsa1-32','reasoning','work-careers','B1','A colleague asks you to review a report by Friday, but you are unsure which version is final. What should you do first?', ['Ask which version should be reviewed.','Review every version and choose one at random.','Ignore the request until Friday.','Tell the colleague that reports are unnecessary.'],0,'Cần làm rõ thông tin còn thiếu trước khi thực hiện để tránh xem nhầm bản.','Clarify the missing information before acting so you do not review the wrong version.'),
  q('hsa1-33','reasoning','media-information','B2','Which statement is a verifiable fact rather than an opinion?', ['The article was published on 12 May.','The article is the most useful one this year.','The writer gives an excellent explanation.','The policy is obviously unfair.'],0,'Ngày xuất bản có thể kiểm chứng khách quan; các lựa chọn khác mang đánh giá chủ quan.','A publication date can be checked objectively; the other options are judgements.'),
  q('hsa1-34','reasoning','science-agriculture','B2','A farm’s output rose after a new irrigation system was installed. Which additional information would best test whether the system caused the increase?', ['Output data from comparable farms without the new system','The colour of the irrigation pipes','The names of workers on the farm','A forecast for next year’s rainfall only'],0,'Nhóm đối chứng tương đồng giúp so sánh và đánh giá liệu thay đổi có thể do hệ thống tưới hay không.','A comparable control group helps assess whether the increase may be due to the irrigation system.'),
  q('hsa1-35','reasoning','communication','C1','A visitor breaks a borrowed tablet. Which action best constitutes compensation?', ['Replace it with the same model or pay the agreed repair cost.','Apologise but return it without mentioning the damage.','Promise to be more careful with other people’s devices.','Ask the owner to lend a different tablet.'],0,'Bồi hoàn cần khắc phục tổn thất bằng sửa chữa hoặc thay thế, không chỉ xin lỗi.','Compensation addresses the loss through repair or replacement, rather than apology alone.'),
  q('hsa1-36','cloze','science-agriculture','B1','Choose the best option for blank 1.\nThe students used the garden as a small outdoor laboratory. They recorded rainfall and soil moisture so that they could compare the ______ from different plots.', ['evidence','permission','advice','appointment'],0,'Các em ghi dữ liệu để so sánh bằng chứng/kết quả giữa các luống.','They record data to compare evidence/results from different plots.',clozePassage),
  q('hsa1-37','cloze','science-agriculture','B2','Choose the best option for blank 2.\nThe plots receiving the same amount of rain did not always produce the same harvest. This suggests that rainfall alone cannot ______ the difference.', ['account for','look after','turn down','take over'],0,'“Account for” nghĩa là giải thích nguyên nhân của khác biệt.','“Account for” means explain the reason for a difference.',clozePassage),
  q('hsa1-38','cloze','science-agriculture','B1','Choose the best option for blank 3.\nShade and soil condition mattered as well. ______, the students began recording when each plot was watered.', ['As a result','In contrast','For instance','Nevertheless'],0,'Câu sau là hành động tiếp theo do nhận ra thêm yếu tố ảnh hưởng.','The next sentence describes a step taken as a result of noticing another factor.',clozePassage),
  q('hsa1-39','cloze','science-agriculture','B2','Choose the best option for blank 4.\nOne school garden cannot represent every climate; its findings should therefore be treated with ______.', ['caution','certainty','permission','enthusiasm'],0,'Mẫu quan sát nhỏ, địa phương không đại diện mọi khí hậu nên cần thận trọng.','A small local sample cannot represent every climate, so it should be treated cautiously.',clozePassage),
  q('hsa1-40','cloze','science-agriculture','B2','Choose the best option for blank 5.\nThe project helped students test an idea, compare evidence and ______ their assumptions.', ['revise','prevent','borrow','replace'],0,'“Revise an assumption” là điều chỉnh giả định sau khi xem xét bằng chứng.','To “revise an assumption” is to adjust it after considering evidence.',clozePassage),
  q('hsa1-41','reading-comprehension','environment','B2','What is the main point of the mangrove passage?', ['Restoration should address the conditions that support a functioning forest.','Planting the largest possible number of seedlings guarantees success.','Coastal communities should stop fishing near mangroves.','The same restoration method works on every coastline.'],0,'Đoạn văn nhấn mạnh điều kiện thủy triều, sinh cảnh và tri thức địa phương, không chỉ số cây trồng.','The passage stresses tidal conditions, habitat and local knowledge, not merely the number planted.',mangrovePassage),
  q('hsa1-42','reading-comprehension','environment','B2','Why did mangrove survival improve after tidal channels were reopened?', ['Water could move through the site again.','Fishers stopped visiting the coast.','The soil was replaced with a different type.','The project planted fewer seedlings.'],0,'Bài nêu trực tiếp việc nước lưu thông trở lại gắn với tỷ lệ sống tốt hơn.','The passage directly links restored water movement with improved survival.',mangrovePassage),
  q('hsa1-43','reading-comprehension','environment','B2','What role can local fishers play in restoration planning?', ['They can identify seasonal changes missed by short surveys.','They can guarantee that every seedling survives.','They can replace all ecological measurements.','They can determine the carbon content of every tree.'],0,'Người đánh cá có tri thức theo mùa mà khảo sát ngắn có thể bỏ sót.','Fishers can contribute seasonal knowledge that short surveys may miss.',mangrovePassage),
  q('hsa1-44','reading-comprehension','environment','C1','The phrase “transferred automatically” most nearly means:', ['applied unchanged to other places','measured with special equipment','funded by another organisation','removed from the original site'],0,'Ngữ cảnh nói kết quả không thể áp dụng y nguyên ở bờ biển khác vì điều kiện khác nhau.','The context says results cannot be applied unchanged because coastlines differ.',mangrovePassage),
  q('hsa1-45','reading-comprehension','environment','B2','Which limitation of the project is stated?', ['Its results may not apply to coastlines with different conditions.','It did not involve any local residents.','It measured only the number of fish caught.','It was conducted entirely in a laboratory.'],0,'Câu cuối nêu đất, thủy triều và sử dụng đất khác nhau giữa các nơi.','The final sentence notes that soil, tides and land use vary by place.',mangrovePassage),
  q('hsa1-46','reading-comprehension','technology','B2','According to the passage, how do recommendation systems often predict what a user wants?', ['By examining earlier clicks and viewing time','By asking every user to complete a survey','By selecting sources at random','By reading private messages directly'],0,'Đoạn đầu nêu lịch sử nhấp chuột và thời gian xem là tín hiệu dự đoán.','The opening paragraph names previous clicks and viewing time as signals.',privacyPassage),
  q('hsa1-47','reading-comprehension','technology','B2','What did the chronological-feed group do compared with the other group?', ['They viewed a wider range of sources.','They spent no time using the service.','They changed their opinions more often.','They received only recommendations from experts.'],0,'Kết quả so sánh được nêu rõ: nhóm dùng feed theo thời gian xem nhiều nguồn hơn.','The comparison states that the chronological-feed group saw a wider range of sources.',privacyPassage),
  q('hsa1-48','reading-comprehension','technology','C1','Why do the researchers caution readers about the study’s findings?', ['It was short and involved a small sample.','It examined no recommendation system.','The volunteers were not allowed to use a chronological feed.','The study measured only the number of videos available.'],0,'Nghiên cứu chỉ kéo dài ba tuần và có ít người tham gia.','The study lasted three weeks and included a small number of participants.',privacyPassage),
  q('hsa1-49','reading-comprehension','technology','B2','What can be inferred about the researchers’ view of recommendation systems?', ['They see possible risks but do not claim the systems alone determine opinions.','They believe all personalised feeds should be banned immediately.','They conclude that chronological feeds always improve understanding.','They think users should not be told how recommendations work.'],0,'Tác giả nói có nguy cơ thu hẹp nguồn tiếp xúc, nhưng không khẳng định hệ thống quyết định quan điểm; họ đề xuất minh bạch và quyền kiểm soát.','They describe a possible risk but reject the claim that systems alone determine opinions; they favour transparency and user controls.',privacyPassage),
  q('hsa1-50','reading-comprehension','technology','B2','Which title best summarises the passage?', ['Recommendation feeds: convenience, limits and user choice','Why online videos should be removed from the internet','A complete guide to conducting a three-week experiment','How viewing time proves a person’s political opinions'],0,'Tiêu đề bao quát cả sự tiện lợi, giới hạn và đề xuất trao quyền kiểm soát cho người dùng.','The title captures convenience, limitations and the recommendation to give users control.',privacyPassage),
];

/** Chẩn đoán 20 câu, rút từ đề mô phỏng để phủ đủ các dạng chính. */
const HSA_DIAGNOSTIC_IDS = [
  'hsa1-01', 'hsa1-03', 'hsa1-11', 'hsa1-13', 'hsa1-15',
  'hsa1-19', 'hsa1-23', 'hsa1-27', 'hsa1-31', 'hsa1-35',
  'hsa1-36', 'hsa1-38', 'hsa1-40', 'hsa1-41', 'hsa1-43',
  'hsa1-45', 'hsa1-46', 'hsa1-47', 'hsa1-49', 'hsa1-50',
];
export const HSA_DIAGNOSTIC: readonly HsaQuestion[] = HSA_DIAGNOSTIC_IDS
  .map((id) => HSA_FORM_1.find((item) => item.id === id))
  .filter((item): item is HsaQuestion => Boolean(item));

export const HSA_OFFICIAL_KIND_ORDER: readonly HsaQuestionKind[] = [
  'sentence-completion','synonym-antonym','dialogue-completion','dialogue-ordering',
  'sentence-rewriting','sentence-combination','cloze','reading-comprehension','reasoning',
];
export const HSA_EXTENDED_KIND_ORDER: readonly HsaQuestionKind[] = [
  'vocabulary-in-context','author-purpose','evidence-evaluation','data-interpretation','sentence-insertion',
];
export const HSA_KIND_ORDER: readonly HsaQuestionKind[] = [...HSA_OFFICIAL_KIND_ORDER, ...HSA_EXTENDED_KIND_ORDER];

export const HSA_FORM_LABELS: readonly Bi[] = [
  { vi: 'Chẩn đoán nhanh · 20 câu', en: 'Quick diagnostic · 20 questions' },
  { vi: 'Đề mô phỏng · 50 câu', en: 'Full simulation · 50 questions' },
  { vi: 'Luyện theo dạng và chủ điểm', en: 'Practise by question type and topic' },
];

export const HSA_DISCLAIMER: Bi = {
  vi: 'Câu hỏi do Band 9 biên soạn để luyện theo đề cương HSA 2026; không phải câu hỏi chính thức hay đề thi thật. Điểm trong app là điểm luyện tập, không quy đổi thành điểm HSA.',
  en: 'Questions are original Band 9 practice items aligned with the 2026 HSA blueprint; they are not official questions or a real test. App scores are for practice and are not converted to official HSA scores.',
};

