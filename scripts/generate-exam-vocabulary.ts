// Đọc toàn văn từ đĩa đồng bộ (không qua HTTP) khi chạy script này.
process.env.BAND9_SYNC_READ = '1';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { SAT_RW_LEXICON } from '../src/data/sat-rw-lexicon';
import { buildRwModule } from '../src/services/sat-rw/mock/build';
import { SAT_PRACTICE_FORMS } from '../src/services/sat-practice/forms';

type SourcePage = { page: number; text: string };
type SourceTest = {
  id: string;
  title: string;
  source: string;
  sourceUrl?: string;
  sourceRefKind?: 'passage' | 'pdf-page';
  section?: string;
  pages?: SourcePage[];
  externalOnly?: boolean;
};
type SourceBlock = { ref: string; text: string; page?: number };
type DictionaryWord = {
  word: string;
  pos: string;
  meaningVi: string;
  definitionEn: string;
  synonyms: string[];
  example: string;
  collocation?: string;
  band?: string;
  score?: number;
  topicSlug?: string;
  topicName?: string;
  sourcePriority?: number;
};
type VocabularyItem = {
  term: string;
  lemma: string;
  category: 'word' | 'collocation' | 'summary_phrase';
  partOfSpeech: string;
  meaningEn: string;
  meaningVi: string;
  synonyms: string[];
  exampleSentence: string;
  sourcePage?: number;
  sourcePassage?: number;
  sourceRef?: string;
};
type VocabularySet = {
  id: string;
  exam: 'ielts' | 'sat';
  title: string;
  source: string;
  sourceUrl?: string;
  items: VocabularyItem[];
};
type Target = {
  id: string;
  exam: 'ielts' | 'sat';
  title: string;
  source: string;
  sourceUrl?: string;
  sourceRefKind?: 'passage' | 'pdf-page';
  blocks: SourceBlock[];
};

const SOURCE_FILE = path.resolve('.local-private/ielts-ocr/source-tests.json');
const WEB_SOURCE_FILE = path.resolve('.local-private/ielts-ocr/web-reading-text.json');
const SAT_SOURCE_FILE = path.resolve('.local-private/sat-ocr/official-reading-text.json');
const CURATED_VOCAB_FILE = path.resolve('scripts/ielts/cambridge-10-vocabulary.json');
const IELTS_LEXICON_FILE = path.resolve('src/data/seed/vocab-topics/index.json');
const SAT_BOOK_FILE = path.resolve('src/data/lessons/sat-book-vocab.json');
const OUTPUT_FILE = path.resolve('src/data/exam-vocabulary.json');
const TARGET_ITEMS = 25;
const ONLY = process.argv.slice(2).filter((arg) => arg.startsWith('--only=')).map((arg) => arg.slice(7));
type SourceIndex = {
  matches: Map<string, SourceBlock>;
  frequencies: Map<string, number>;
  normalizedBlocks: Map<SourceBlock, string>;
  documentTokens: Set<string>;
};

const SUMMARY_PHRASES: Array<DictionaryWord & { category: 'summary_phrase' }> = [
  { word: 'in contrast', pos: 'summary phrase', meaningVi: 'ngược lại; dùng để nêu điểm khác biệt', definitionEn: 'used to introduce a contrasting idea or result', synonyms: ['by contrast', 'conversely', 'on the other hand'], example: 'The first approach is inexpensive; in contrast, the second is more durable.', category: 'summary_phrase' },
  { word: 'by contrast', pos: 'summary phrase', meaningVi: 'trái lại; dùng để đối chiếu', definitionEn: 'used to show a clear difference between two ideas', synonyms: ['in contrast', 'conversely', 'on the other hand'], example: 'The northern region receives little rain; by contrast, the coast is wet year-round.', category: 'summary_phrase' },
  { word: 'as a result', pos: 'summary phrase', meaningVi: 'kết quả là; vì vậy', definitionEn: 'used to introduce the consequence of an earlier fact', synonyms: ['consequently', 'therefore', 'thus'], example: 'The sample was contaminated; as a result, the team repeated the experiment.', category: 'summary_phrase' },
  { word: 'the evidence suggests', pos: 'summary phrase', meaningVi: 'bằng chứng cho thấy', definitionEn: 'used to introduce a cautious conclusion based on evidence', synonyms: ['the evidence indicates', 'the findings suggest', 'the data imply'], example: 'The evidence suggests that the change began gradually.', category: 'summary_phrase' },
  { word: 'the results indicate', pos: 'summary phrase', meaningVi: 'kết quả chỉ ra rằng', definitionEn: 'used to state what findings appear to show', synonyms: ['the results suggest', 'the findings indicate', 'the data show'], example: 'The results indicate that the new method is more reliable.', category: 'summary_phrase' },
  { word: 'plays a role in', pos: 'summary phrase', meaningVi: 'đóng vai trò trong', definitionEn: 'used to describe how one factor contributes to an outcome', synonyms: ['contributes to', 'affects', 'influences'], example: 'Access to clean water plays a role in public health.', category: 'summary_phrase' },
  { word: 'is associated with', pos: 'summary phrase', meaningVi: 'có liên quan tới', definitionEn: 'used to describe a relationship between two factors', synonyms: ['is linked to', 'correlates with', 'is connected with'], example: 'Regular exercise is associated with better sleep.', category: 'summary_phrase' },
  { word: 'in other words', pos: 'summary phrase', meaningVi: 'nói cách khác', definitionEn: 'used to restate an idea more clearly', synonyms: ['that is', 'put differently', 'to put it another way'], example: 'The method is noninvasive; in other words, it does not require surgery.', category: 'summary_phrase' },
  { word: 'rather than', pos: 'summary phrase', meaningVi: 'thay vì; chứ không phải', definitionEn: 'used to indicate a preferred or contrasting alternative', synonyms: ['instead of', 'as opposed to', 'in place of'], example: 'The team studied long-term trends rather than isolated events.', category: 'summary_phrase' },
  { word: 'overall', pos: 'summary adverb', meaningVi: 'nhìn chung; xét tổng thể', definitionEn: 'used to give a general conclusion after considering details', synonyms: ['on the whole', 'in general', 'all things considered'], example: 'Overall, the newer design uses less energy.', category: 'summary_phrase' },
  { word: 'in addition', pos: 'summary phrase', meaningVi: 'ngoài ra; thêm vào đó', definitionEn: 'used to add another supporting point', synonyms: ['moreover', 'furthermore', 'also'], example: 'The park protects wildlife; in addition, it provides space for research.', category: 'summary_phrase' },
  { word: 'this suggests that', pos: 'summary phrase', meaningVi: 'điều này gợi ý rằng', definitionEn: 'used to draw a tentative conclusion from information', synonyms: ['this indicates that', 'this implies that', 'this points to'], example: 'The pattern is consistent across regions; this suggests that the cause is widespread.', category: 'summary_phrase' },
];

const COLLOCATION_GLOSSES: Record<string, { meaningEn: string; meaningVi: string; synonyms?: string[] }> = {
  'a living cell': { meaningEn: 'a single biological unit capable of carrying out the processes of life', meaningVi: 'một tế bào sống' },
  'academic performance': { meaningEn: 'how well a student achieves in their studies', meaningVi: 'thành tích học tập' },
  'account for': { meaningEn: 'to explain something or make up a stated part of a total', meaningVi: 'giải thích; chiếm (một phần)' },
  'air pollution': { meaningEn: 'harmful substances contaminating the air', meaningVi: 'ô nhiễm không khí' },
  'annual holiday': { meaningEn: 'a holiday or vacation taken once each year', meaningVi: 'kỳ nghỉ hằng năm' },
  'annual revenue': { meaningEn: 'the total income earned by an organization in one year', meaningVi: 'doanh thu hằng năm' },
  'apprentice program': { meaningEn: 'a structured course that combines practical work with training', meaningVi: 'chương trình đào tạo nghề' },
  'as a result of': { meaningEn: 'because of a particular event or condition', meaningVi: 'do; là kết quả của' },
  'avant-garde artists': { meaningEn: 'artists who use new, experimental ideas ahead of mainstream trends', meaningVi: 'các nghệ sĩ tiên phong, cách tân' },
  'bright sun': { meaningEn: 'strong, clear sunlight', meaningVi: 'ánh nắng rực rỡ' },
  'bus route': { meaningEn: 'the path and stops served by a bus service', meaningVi: 'tuyến xe buýt' },
  'carbon emissions': { meaningEn: 'carbon-containing gases released into the atmosphere', meaningVi: 'lượng phát thải carbon' },
  'cardiovascular disease': { meaningEn: 'a disease affecting the heart or blood vessels', meaningVi: 'bệnh tim mạch' },
  'city council': { meaningEn: 'the elected body that governs a city', meaningVi: 'hội đồng thành phố' },
  'clinical depression': { meaningEn: 'a serious depressive condition diagnosed as a mental health disorder', meaningVi: 'trầm cảm lâm sàng' },
  'compulsory education': { meaningEn: 'education that children are required by law to receive', meaningVi: 'giáo dục bắt buộc' },
  'corporal punishment': { meaningEn: 'punishment involving physical force against a person', meaningVi: 'hình phạt thân thể' },
  'cramped conditions': { meaningEn: 'living or working conditions with too little space', meaningVi: 'điều kiện chật chội' },
  'credit card': { meaningEn: 'a payment card that lets the holder borrow money to make purchases', meaningVi: 'thẻ tín dụng' },
  'critically endangered': { meaningEn: 'at an extremely high risk of becoming extinct in the wild', meaningVi: 'cực kỳ nguy cấp; có nguy cơ tuyệt chủng rất cao' },
  'cultural legacy': { meaningEn: 'traditions, ideas, or achievements passed down from earlier generations', meaningVi: 'di sản văn hóa' },
  'dependent on': { meaningEn: 'needing or being determined by something else', meaningVi: 'phụ thuộc vào' },
  'differ from': { meaningEn: 'to be unlike or distinct from something else', meaningVi: 'khác với' },
  'direct sunlight': { meaningEn: 'sunlight that reaches a place without being blocked or filtered', meaningVi: 'ánh nắng trực tiếp' },
  'disciplinary action': { meaningEn: 'a measure taken to correct or penalize a breach of rules', meaningVi: 'biện pháp kỷ luật' },
  'due to': { meaningEn: 'caused by or resulting from something', meaningVi: 'do; bởi vì' },
  'emerge from': { meaningEn: 'to come out of something or become visible from it', meaningVi: 'xuất hiện từ; thoát ra khỏi' },
  'empirical evidence': { meaningEn: 'evidence gathered through observation or experiment', meaningVi: 'bằng chứng thực nghiệm' },
  'endangered species': { meaningEn: 'a type of animal or plant at risk of extinction', meaningVi: 'loài có nguy cơ tuyệt chủng' , synonyms: ['threatened species', 'at-risk species'] },
  'full recovery': { meaningEn: 'a complete return to health or to a normal condition', meaningVi: 'sự hồi phục hoàn toàn' },
  'global supply chain': { meaningEn: 'the worldwide network involved in making and delivering a product', meaningVi: 'chuỗi cung ứng toàn cầu' },
  'good manners': { meaningEn: 'polite and considerate behavior toward other people', meaningVi: 'phép lịch sự; cách cư xử đúng mực', synonyms: ['etiquette', 'politeness'] },
  'greenhouse gas emissions': { meaningEn: 'gases released into the air that trap heat in the atmosphere', meaningVi: 'lượng khí thải gây hiệu ứng nhà kính' },
  'have a conversation': { meaningEn: 'to talk with another person or group', meaningVi: 'trò chuyện; có một cuộc trò chuyện' },
  'high yield': { meaningEn: 'a large amount produced, especially by a crop or investment', meaningVi: 'sản lượng hoặc năng suất cao' },
  'household income': { meaningEn: 'the combined income received by people living in one household', meaningVi: 'thu nhập của hộ gia đình' },
  'hypothesize that': { meaningEn: 'to suggest as a possible explanation that something is true', meaningVi: 'đưa ra giả thuyết rằng' },
  'identical to': { meaningEn: 'exactly the same as something else', meaningVi: 'giống hệt với' },
  'illegal poaching': { meaningEn: 'the unlawful hunting or capture of wild animals', meaningVi: 'việc săn bắt động vật trái phép' },
  'improve quality': { meaningEn: 'to make the standard or condition of something better', meaningVi: 'cải thiện chất lượng' },
  'in the classroom': { meaningEn: 'in a classroom or in a school teaching situation', meaningVi: 'trong lớp học; trong môi trường lớp học' },
  'in the past': { meaningEn: 'at an earlier time; formerly', meaningVi: 'trong quá khứ; trước đây' },
  'indifferent to': { meaningEn: 'not interested in or concerned about something', meaningVi: 'thờ ơ; không quan tâm đến' },
  'infant mortality': { meaningEn: 'the rate at which babies die before reaching one year of age', meaningVi: 'tỷ lệ tử vong ở trẻ sơ sinh' },
  'insectivorous bats': { meaningEn: 'bats that feed mainly on insects', meaningVi: 'loài dơi ăn côn trùng' },
  'intensive agriculture': { meaningEn: 'farming that uses large amounts of labor, land, or other inputs to increase output', meaningVi: 'nông nghiệp thâm canh' },
  'invent a device': { meaningEn: 'to design and create a new piece of equipment', meaningVi: 'phát minh ra một thiết bị' },
  'jet engine': { meaningEn: 'an engine that produces thrust by expelling a fast-moving stream of gas', meaningVi: 'động cơ phản lực' },
  'keep up with': { meaningEn: 'to stay at the same level or pace as someone or something', meaningVi: 'theo kịp; bắt kịp', synonyms: ['keep pace with', 'stay abreast of'] },
  'laboratory experiment': { meaningEn: 'a scientific test carried out under controlled laboratory conditions', meaningVi: 'thí nghiệm trong phòng thí nghiệm' },
  'lack of': { meaningEn: 'the absence or insufficient amount of something', meaningVi: 'sự thiếu; tình trạng thiếu' },
  'lantern festival': { meaningEn: 'a celebration in which illuminated lanterns are displayed', meaningVi: 'lễ hội đèn lồng' },
  'look like': { meaningEn: 'to have a similar appearance to someone or something', meaningVi: 'trông giống như' },
  'low self-esteem': { meaningEn: 'a poor or negative opinion of one’s own worth or abilities', meaningVi: 'lòng tự trọng thấp; thiếu tự tin' },
  'machine translation': { meaningEn: 'translation produced automatically by a computer system', meaningVi: 'bản dịch máy; dịch thuật tự động' },
  'marine life': { meaningEn: 'animals and plants that live in the sea', meaningVi: 'sinh vật biển', synonyms: ['sea life', 'marine organisms'] },
  'media coverage': { meaningEn: 'news reporting about an event or subject', meaningVi: 'sự đưa tin của truyền thông' },
  'minimum wage': { meaningEn: 'the lowest hourly or monthly pay permitted by law', meaningVi: 'mức lương tối thiểu' },
  'motor vehicle': { meaningEn: 'a road vehicle powered by an engine', meaningVi: 'xe cơ giới' },
  'natural habitat': { meaningEn: 'the place where a plant or animal normally lives in the wild', meaningVi: 'môi trường sống tự nhiên' },
  'northern hemisphere': { meaningEn: 'the half of Earth north of the equator', meaningVi: 'Bắc bán cầu' },
  'numeracy skills': { meaningEn: 'the ability to understand and work with numbers', meaningVi: 'kỹ năng tính toán; năng lực xử lý số liệu' },
  'on the basis of': { meaningEn: 'using something as a reason, foundation, or source for a decision', meaningVi: 'dựa trên cơ sở; căn cứ vào' },
  'organic produce': { meaningEn: 'food grown or made without most synthetic chemicals', meaningVi: 'nông sản hữu cơ; thực phẩm hữu cơ' },
  'original design': { meaningEn: 'a new design created independently rather than copied', meaningVi: 'thiết kế nguyên bản' },
  'passionate about': { meaningEn: 'having very strong enthusiasm or interest in something', meaningVi: 'đam mê; say mê' },
  'pay a fine': { meaningEn: 'to pay money imposed as a penalty for breaking a rule or law', meaningVi: 'nộp tiền phạt', synonyms: ['pay a penalty'] },
  'per hectare': { meaningEn: 'for each unit of land measuring 10,000 square metres', meaningVi: 'trên mỗi hecta' },
  'physical exercise': { meaningEn: 'bodily activity done to maintain or improve health and fitness', meaningVi: 'hoạt động thể chất; bài tập thể dục' },
  'physical fitness': { meaningEn: 'the condition of being physically healthy and able to do activity', meaningVi: 'thể lực; tình trạng sức khỏe thể chất' },
  'prehistoric era': { meaningEn: 'the period before written records began', meaningVi: 'thời tiền sử' },
  'pure serendipity': { meaningEn: 'the chance discovery of something valuable or pleasant', meaningVi: 'sự tình cờ may mắn' },
  'racial discrimination': { meaningEn: 'unfair treatment of people because of their race', meaningVi: 'sự phân biệt đối xử dựa trên chủng tộc', synonyms: ['racial bias', 'racism'] },
  'railway network': { meaningEn: 'a connected system of railway lines and stations', meaningVi: 'mạng lưới đường sắt', synonyms: ['rail network', 'rail system'] },
  'recover from': { meaningEn: 'to return to a normal state after illness, difficulty, or damage', meaningVi: 'hồi phục sau; khắc phục' },
  'refundable deposit': { meaningEn: 'money paid in advance that can be returned later', meaningVi: 'tiền đặt cọc có thể hoàn lại' },
  'residential area': { meaningEn: 'a part of a town or city where people mainly live', meaningVi: 'khu dân cư; khu nhà ở' },
  'resists corrosion in salt water': { meaningEn: 'does not rust or break down easily when exposed to salt water', meaningVi: 'chống ăn mòn trong nước mặn' },
  'rugged terrain': { meaningEn: 'land that is rough, uneven, and difficult to travel across', meaningVi: 'địa hình gồ ghề, hiểm trở' },
  'save the planet': { meaningEn: 'to protect Earth by reducing harm to its environment', meaningVi: 'bảo vệ hành tinh; cứu lấy Trái Đất' },
  'scientific theory': { meaningEn: 'a well-supported explanation of natural phenomena', meaningVi: 'lý thuyết khoa học' },
  'serious injury': { meaningEn: 'physical harm that is severe or potentially dangerous', meaningVi: 'chấn thương nghiêm trọng', synonyms: ['severe injury', 'major injury'] },
  'space telescope': { meaningEn: 'a telescope placed beyond Earth’s atmosphere to observe space', meaningVi: 'kính viễn vọng không gian' },
  'statistically significant': { meaningEn: 'unlikely to be explained by chance under a chosen statistical test', meaningVi: 'có ý nghĩa thống kê' },
  'theory of evolution': { meaningEn: 'the scientific explanation of how populations of living things change over generations', meaningVi: 'thuyết tiến hóa' },
  'transport infrastructure': { meaningEn: 'the roads, railways, bridges, and systems that support transportation', meaningVi: 'cơ sở hạ tầng giao thông' },
  'twentieth century': { meaningEn: 'the period from 1901 through 2000', meaningVi: 'thế kỷ XX' },
  'very different': { meaningEn: 'substantially unlike one another', meaningVi: 'rất khác nhau' },
  'very expensive': { meaningEn: 'costing a great deal of money', meaningVi: 'rất đắt; có giá rất cao' },
  'vulnerable to': { meaningEn: 'easily harmed, affected, or attacked by something', meaningVi: 'dễ bị tổn thương; dễ bị ảnh hưởng bởi' },
};

const COLLOCATION_EXAMPLES: Record<string, string> = {
  'a living cell': 'A living cell can respond to changes in its environment.',
  'academic performance': 'Regular attendance can improve academic performance.',
  'account for': 'Researchers must account for differences in age and experience.',
  'air pollution': 'New public transport could reduce air pollution.',
  'annual holiday': 'The family planned its annual holiday for July.',
  'annual revenue': 'The report lists the company’s annual revenue.',
  'apprentice program': 'She learned the trade through an apprentice program.',
  'as a result of': 'As a result of heavy rain, the river rose quickly.',
  'avant-garde artists': 'Avant-garde artists often challenge familiar conventions.',
  'bright sun': 'The bright sun warmed the eastern side of the valley.',
  'bus route': 'The new bus route connects the village to the city center.',
  'carbon emissions': 'The factory reduced its carbon emissions over five years.',
  'cardiovascular disease': 'Regular exercise can lower the risk of cardiovascular disease.',
  'city council': 'The city council approved a plan to expand the park.',
  'clinical depression': 'The study examined how treatment supports people with clinical depression.',
  'compulsory education': 'Compulsory education gives every child access to basic schooling.',
  'corporal punishment': 'The policy prohibits corporal punishment in schools.',
  'cramped conditions': 'Workers faced cramped conditions in the old building.',
  'credit card': 'She paid for the train ticket with a credit card.',
  'critically endangered': 'The species is critically endangered because its population is so small.',
  'cultural legacy': 'The buildings remain an important part of the city’s cultural legacy.',
  'dependent on': 'The outcome is dependent on the amount of rainfall.',
  'differ from': 'The results may differ from those reported earlier.',
  'direct sunlight': 'The seedlings should be kept out of direct sunlight.',
  'disciplinary action': 'Repeated violations may lead to disciplinary action.',
  'due to': 'The delay was due to a mechanical problem.',
  'emerge from': 'New patterns emerge from the long-term data.',
  'empirical evidence': 'The researchers gathered empirical evidence from field observations.',
  'endangered species': 'The reserve provides a habitat for several endangered species.',
  'full recovery': 'Early treatment helped her make a full recovery.',
  'global supply chain': 'A disruption in one port can affect the global supply chain.',
  'good manners': 'Good manners help people cooperate in public spaces.',
  'greenhouse gas emissions': 'The city aims to reduce greenhouse gas emissions by 2030.',
  'have a conversation': 'The teacher encouraged students to have a conversation about the results.',
  'high yield': 'The new crop variety produces a high yield.',
  'household income': 'Housing costs take up a large share of household income.',
  'hypothesize that': 'Scientists hypothesize that the species migrated during colder periods.',
  'identical to': 'The two samples were nearly identical to each other.',
  'illegal poaching': 'Rangers patrol the reserve to prevent illegal poaching.',
  'improve quality': 'The new process could improve quality without increasing cost.',
  'in the classroom': 'Students tested the idea in the classroom before using it in the field.',
  'in the past': 'In the past, most residents traveled by train.',
  'indifferent to': 'The animals appeared indifferent to the noise nearby.',
  'infant mortality': 'Better access to health care can reduce infant mortality.',
  'insectivorous bats': 'Insectivorous bats feed on moths and other insects.',
  'intensive agriculture': 'Intensive agriculture can increase output but place pressure on soil.',
  'invent a device': 'The engineer hopes to invent a device that detects leaks.',
  'jet engine': 'A jet engine propels the aircraft forward.',
  'keep up with': 'Small libraries struggle to keep up with rapid technological change.',
  'laboratory experiment': 'The laboratory experiment was repeated under controlled conditions.',
  'lack of': 'A lack of reliable data made the conclusion uncertain.',
  'lantern festival': 'The town holds a lantern festival each autumn.',
  'look like': 'The marks look like evidence of repeated contact.',
  'low self-esteem': 'Supportive feedback can help students with low self-esteem.',
  'machine translation': 'Machine translation can help readers understand a basic message.',
  'marine life': 'Warmer water can disrupt marine life.',
  'media coverage': 'The discovery received extensive media coverage.',
  'minimum wage': 'The law raised the minimum wage for workers.',
  'motor vehicle': 'The rules apply to every motor vehicle on public roads.',
  'natural habitat': 'The reserve protects the natural habitat of the species.',
  'northern hemisphere': 'Many countries in the northern hemisphere experience winter in December.',
  'numeracy skills': 'The course develops numeracy skills through practical activities.',
  'on the basis of': 'The decision was made on the basis of the available evidence.',
  'organic produce': 'The market sells organic produce from nearby farms.',
  'original design': 'The museum displayed the original design alongside the finished building.',
  'passionate about': 'She is passionate about protecting local wildlife.',
  'pay a fine': 'Drivers who break the rule may have to pay a fine.',
  'per hectare': 'The farmer measured crop production per hectare.',
  'physical exercise': 'Daily physical exercise supports heart health.',
  'physical fitness': 'The program helps improve physical fitness.',
  'prehistoric era': 'The cave paintings date from the prehistoric era.',
  'pure serendipity': 'Finding the rare manuscript was pure serendipity.',
  'racial discrimination': 'The policy was introduced to prevent racial discrimination.',
  'railway network': 'The expanding railway network linked remote towns.',
  'recover from': 'It took several weeks to recover from the injury.',
  'refundable deposit': 'Customers must pay a refundable deposit for the equipment.',
  'residential area': 'The new road was rerouted away from the residential area.',
  'resists corrosion in salt water': 'This alloy resists corrosion in salt water.',
  'rugged terrain': 'The hikers moved slowly across the rugged terrain.',
  'save the planet': 'The campaign encourages households to use less energy to save the planet.',
  'scientific theory': 'A scientific theory explains evidence that has been tested repeatedly.',
  'serious injury': 'The cyclist was treated for a serious injury.',
  'space telescope': 'A space telescope can observe wavelengths blocked by Earth’s atmosphere.',
  'statistically significant': 'The difference was statistically significant in the larger sample.',
  'theory of evolution': 'The theory of evolution explains how populations change over generations.',
  'transport infrastructure': 'Investment in transport infrastructure shortened the journey.',
  'twentieth century': 'The twentieth century brought major changes in communication.',
  'very different': 'The two regions have very different climates.',
  'very expensive': 'Maintaining the old system proved very expensive.',
  'vulnerable to': 'Young seedlings are vulnerable to sudden drops in temperature.',
};

const STOP_WORDS = new Set(('a an the and or but if so because as of at by for from in into on onto to up with without about above across after against along among around before behind below beneath beside between beyond during except inside near off out over through throughout toward under until upon via within is am are was were be been being do does did have has had can could may might must shall should will would this that these those it they them their he she we you i who whom which what when where why how not no nor very more most less least such also than then there here each every all any both either neither same other another some many much few several first second third former latter next last new old good better best bad worse worst more own its as per etc while').split(' '));

function normalize(value: string): string {
  return value.replace(/([a-z])[-\u00ad]\r?\n([a-z])/gi, '$1$2').normalize('NFKC').toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

function forms(word: string): string[] {
  const base = word.trim().toLocaleLowerCase();
  if (!/^[a-z]+$/.test(base)) return [word];
  const out = new Set([base]);
  if (base.length < 3) return [...out];
  if (base.endsWith('y') && !/[aeiou]y$/.test(base)) {
    out.add(`${base.slice(0, -1)}ies`);
    out.add(`${base.slice(0, -1)}ied`);
  } else {
    out.add(`${base}s`);
    out.add(`${base}es`);
    out.add(`${base}ed`);
    out.add(`${base}ing`);
    if (base.endsWith('e')) {
      out.add(`${base.slice(0, -1)}d`);
      out.add(`${base.slice(0, -1)}ing`);
    }
    if (/[aeiou][bcdfghjklmnpqrstvwxyz]$/.test(base)) {
      const last = base.at(-1)!;
      out.add(`${base}${last}ed`);
      out.add(`${base}${last}ing`);
    }
  }
  return [...out];
}

function buildSourceIndex(blocks: SourceBlock[]): SourceIndex {
  const matches = new Map<string, SourceBlock>();
  const frequencies = new Map<string, number>();
  const normalizedBlocks = new Map<SourceBlock, string>();
  const documentTokens = new Set<string>();
  for (const block of blocks) {
    const normalized = normalize(block.text);
    normalizedBlocks.set(block, normalized);
    const tokens = normalized.split(' ').filter(Boolean);
    for (const token of tokens) documentTokens.add(token);
    for (let start = 0; start < tokens.length; start += 1) {
      for (let size = 1; size <= 6 && start + size <= tokens.length; size += 1) {
        const phrase = tokens.slice(start, start + size).join(' ');
        if (!matches.has(phrase)) matches.set(phrase, block);
        frequencies.set(phrase, (frequencies.get(phrase) ?? 0) + 1);
      }
    }
  }
  return { matches, frequencies, normalizedBlocks, documentTokens };
}

function findMatch(word: string, index: SourceIndex): { term: string; block: SourceBlock } | null {
  if (!/\p{L}/u.test(word) || normalize(word).length < 2) return null;
  const candidates = word.includes(' ') || word.includes('-') ? [word] : forms(word);
  for (const candidate of candidates) {
    const block = index.matches.get(normalize(candidate));
    if (block) return { term: candidate, block };
  }
  return null;
}

function sourceFrequency(term: string, index: SourceIndex): number {
  return index.frequencies.get(normalize(term)) ?? 0;
}

function topicRelevance(word: DictionaryWord, target: Target, index: SourceIndex, block: SourceBlock, term: string): number {
  if (target.exam !== 'ielts' || !word.topicSlug) return word.sourcePriority ?? 0;
  const text = index.normalizedBlocks.get(block) ?? normalize(block.text);
  const offset = text.indexOf(normalize(term));
  const tokenIndex = offset < 0 ? 0 : text.slice(0, offset).split(' ').length - 1;
  const tokens = text.split(' ');
  const local = new Set(tokens.slice(Math.max(0, tokenIndex - 9), tokenIndex + 12));
  const topicTokens = normalize(word.topicSlug).split(' ').filter((token) => token.length > 3 && !STOP_WORDS.has(token));
  const localHits = topicTokens.filter((token) => local.has(token)).length;
  const documentHits = topicTokens.filter((token) => index.documentTokens.has(token)).length;
  return localHits * 100 + documentHits * 10 + (word.sourcePriority ?? 0);
}

function contextualMeaning(word: DictionaryWord, term: string, block: SourceBlock): Pick<VocabularyItem, 'meaningEn' | 'meaningVi' | 'synonyms'> {
  const text = normalize(block.text);
  const normalizedTerm = normalize(term);
  const offset = text.indexOf(normalizedTerm);
  const nearby = offset < 0 ? text : text.slice(Math.max(0, offset - 90), offset + normalizedTerm.length + 90);
  const base = normalize(word.word);
  if (base === 'scale' && /production|industry|global|large|small|worldwide|collection|factory|economic/.test(nearby)) {
    return { meaningEn: 'the size, extent, or level of an activity or process', meaningVi: 'quy mô, phạm vi hoặc mức độ', synonyms: ['scope', 'extent', 'size', 'range'] };
  }
  if (base === 'float' && /water|liquid|air|balloon|sink|surface|boat|sea|river/.test(nearby)) {
    return { meaningEn: 'to stay on or move across a liquid or through the air without sinking', meaningVi: 'nổi; trôi lơ lửng', synonyms: ['drift', 'remain afloat', 'hover'] };
  }
  if (base === 'float' && /parade|procession|festival|decorated|vehicle/.test(nearby)) {
    return { meaningEn: 'a decorated vehicle or platform in a parade', meaningVi: 'xe hoặc sàn trang trí diễu hành', synonyms: ['parade vehicle', 'procession platform'] };
  }
  if (base === 'goal' && /aim|purpose|objective|achieve|intention|target/.test(nearby)) {
    return { meaningEn: 'an outcome or purpose that someone is trying to achieve', meaningVi: 'mục tiêu; mục đích cần đạt được', synonyms: ['aim', 'objective', 'purpose', 'target'] };
  }
  if (base === 'water' && /river|lake|ocean|sea|drinking|supply|flood|rain|freshwater/.test(nearby)) {
    return { meaningEn: 'the clear liquid essential for life', meaningVi: 'nước', synonyms: ['fresh water', 'drinking water'] };
  }
  if (base === 'yield' && /crop|harvest|farm|field|acre|hectare|agricultur/.test(nearby)) {
    return { meaningEn: 'the amount of a crop produced by an area of land', meaningVi: 'sản lượng; năng suất cây trồng', synonyms: ['output', 'harvest', 'production'] };
  }
  if (base === 'yield' && /result|benefit|produce|provide|generate/.test(nearby)) {
    return { meaningEn: 'to produce or provide a result', meaningVi: 'tạo ra; mang lại kết quả', synonyms: ['produce', 'generate', 'provide'] };
  }
  return { meaningEn: word.definitionEn, meaningVi: word.meaningVi, synonyms: word.synonyms.slice(0, 4) };
}

function makeTargets(sourceTests: SourceTest[]): Target[] {
  const ielts = sourceTests.filter((test) => test.section === 'Reading' && !test.externalOnly && (test.pages?.length ?? 0) > 0).map((test) => ({
    id: test.id,
    exam: 'ielts' as const,
    title: test.title,
    source: test.source,
    sourceUrl: test.sourceUrl,
    sourceRefKind: test.sourceRefKind ?? (test.sourceUrl ? 'passage' : undefined),
    blocks: (test.pages ?? []).filter((page) => page.text.trim()).map((page) => ({
      ref: `PDF page ${page.page}`,
      page: page.page,
      text: page.text
        .replace(/^\s*(?:Reading(?:\s+Passage\s+\d+)?|Test\s+\d+)\s*$/gim, '')
        .replace(/^\s*\d{1,3}\s*$/gm, ''),
    })),
  }));
  const officialSat = sourceTests.filter((test) => test.section === 'SAT R&W' && !test.externalOnly && (test.pages?.length ?? 0) > 0).map((test) => ({
    id: test.id,
    exam: 'sat' as const,
    title: test.title,
    source: test.source,
    sourceUrl: test.sourceUrl,
    sourceRefKind: 'pdf-page' as const,
    blocks: (test.pages ?? []).filter((page) => page.text.trim()).map((page) => ({
      ref: `PDF page ${page.page}`,
      page: page.page,
      text: page.text,
    })),
  }));
  const sat = SAT_PRACTICE_FORMS.map((form) => {
    const seed = `band9:${form.id}:reading-writing:v1`;
    const one = buildRwModule(seed, 1, 'mixed');
    const two = buildRwModule(seed, 2, 'harder', new Set(one.items.map((item) => item.id)));
    return {
      id: `sat-${form.id}`,
      exam: 'sat' as const,
      title: `SAT Reading & Writing · Practice Form ${String(form.number).padStart(2, '0')}`,
      source: 'SAT R&W practice question pool in the app',
      blocks: [...one.items, ...two.items].map((item, index) => ({
        ref: item.id || `SAT ${form.id} question ${index + 1}`,
        text: [item.passage, item.stem, ...(item.options ?? [])].filter(Boolean).join('\n'),
      })),
    };
  });
  return [...ielts, ...officialSat, ...sat].filter((target) => target.blocks.length > 0);
}

function addSourceReference(item: VocabularyItem, target: Target, block: SourceBlock): VocabularyItem {
  if (target.sourceRefKind === 'pdf-page') return { ...item, sourcePage: block.page };
  if (target.exam === 'sat') return { ...item, sourceRef: block.ref };
  if (target.sourceRefKind === 'passage') return { ...item, sourcePassage: block.page };
  return { ...item, sourcePage: block.page };
}

function scoreBand(value?: string): number {
  if (value?.includes('5-6')) return 0;
  if (value?.includes('6-7')) return 1;
  if (value?.includes('7-8')) return 2;
  if (value?.includes('8+')) return 3;
  return 1;
}

function itemFromWord(word: DictionaryWord, target: Target, index: SourceIndex): VocabularyItem | null {
  const term = findMatch(word.word, index);
  if (!term) return null;
  const meaning = contextualMeaning(word, term.term, term.block);
  const item: VocabularyItem = {
    term: term.term,
    lemma: word.word.toLocaleLowerCase(),
    category: word.pos === 'transition' || word.word.includes(' ') ? 'summary_phrase' : 'word',
    partOfSpeech: word.pos || 'word',
    ...meaning,
    exampleSentence: word.example || makeExample(word.word, word.pos),
  };
  return addSourceReference(item, target, term.block);
}

function itemFromCollocation(word: DictionaryWord, target: Target, index: SourceIndex): VocabularyItem | null {
  const phrase = word.collocation?.trim();
  if (!phrase || normalize(phrase) === normalize(word.word)) return null;
  const match = findMatch(phrase, index);
  if (!match) return null;
  const gloss = COLLOCATION_GLOSSES[normalize(phrase)];
  if (!gloss) return null;
  const item: VocabularyItem = {
    term: match.term,
    lemma: normalize(phrase),
    category: 'collocation',
    partOfSpeech: 'collocation',
    meaningEn: gloss.meaningEn,
    meaningVi: gloss.meaningVi,
    synonyms: gloss.synonyms ?? [],
    exampleSentence: COLLOCATION_EXAMPLES[normalize(phrase)] ?? `The source passage uses the phrase “${phrase}” in context.`,
  };
  return addSourceReference(item, target, match.block);
}

function itemFromPhrase(phrase: DictionaryWord & { category: 'summary_phrase' }, target: Target, index: SourceIndex): VocabularyItem | null {
  const match = findMatch(phrase.word, index);
  if (!match) return null;
  const item: VocabularyItem = {
    term: match.term,
    lemma: normalize(phrase.word),
    category: 'summary_phrase',
    partOfSpeech: phrase.pos,
    meaningEn: phrase.definitionEn,
    meaningVi: phrase.meaningVi,
    synonyms: phrase.synonyms,
    exampleSentence: phrase.example,
  };
  return addSourceReference(item, target, match.block);
}

function makeExample(word: string, pos: string): string {
  if (/verb/i.test(pos)) return `Researchers ${word} the evidence before drawing a conclusion.`;
  if (/adjective|adj/i.test(pos)) return `The team described the result as ${word}.`;
  if (/adverb|adv/i.test(pos)) return `The pattern changed ${word} over time.`;
  return `The report examined ${word} in a wider context.`;
}

function choose(items: VocabularyItem[], limit: number): VocabularyItem[] {
  const seen = new Set<string>();
  const selected: VocabularyItem[] = [];
  for (const item of items) {
    const key = normalize(item.lemma || item.term);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    selected.push(item);
    if (selected.length >= limit) break;
  }
  return selected;
}

function buildSet(target: Target, ieltsWords: DictionaryWord[], satWords: DictionaryWord[]): VocabularySet {
  const lexicon = target.exam === 'ielts' ? ieltsWords : satWords;
  const sourceIndex = buildSourceIndex(target.blocks);
  const wordCandidates: Array<{ item: VocabularyItem; band: number; rank: number }> = [];
  const phraseCandidates: VocabularyItem[] = [];
  const collocationCandidates: VocabularyItem[] = [];
  for (const word of lexicon) {
    if (!word.word || STOP_WORDS.has(normalize(word.word)) || !word.meaningVi || !word.definitionEn) continue;
    const item = itemFromWord(word, target, sourceIndex);
    if (item?.category === 'word') {
      const block = sourceIndex.matches.get(normalize(item.term))!;
      const relevance = topicRelevance(word, target, sourceIndex, block, item.term);
      const rank = target.exam === 'sat'
        ? relevance * 1_000 + (word.score ?? word.word.length) * 10 + sourceFrequency(item.term, sourceIndex) * 2
        : relevance * 100 + sourceFrequency(item.term, sourceIndex);
      wordCandidates.push({ item, band: scoreBand(word.band), rank });
    }
    else if (item) phraseCandidates.push(item);
    const collocation = itemFromCollocation(word, target, sourceIndex);
    if (collocation) collocationCandidates.push(collocation);
  }
  for (const phrase of SUMMARY_PHRASES) {
    const item = itemFromPhrase(phrase, target, sourceIndex);
    if (item) phraseCandidates.push(item);
  }

  // IELTS topic lists span everyday through advanced vocabulary; rotating the
  // band buckets avoids making every pack a list of rare academic terms.
  wordCandidates.sort((a, b) => b.rank - a.rank || a.item.term.length - b.item.term.length || a.item.term.localeCompare(b.item.term));
  const words: VocabularyItem[] = [];
  const quotas = target.exam === 'ielts' ? [4, 6, 6, 4] : [8, 8, 4, 0];
  for (let band = 0; band < quotas.length; band += 1) {
    const candidates = wordCandidates.filter((candidate) => candidate.band === band).map((candidate) => candidate.item);
    words.push(...choose(candidates, quotas[band] ?? 0));
  }
  const chosenWords = choose([...words, ...wordCandidates.map((candidate) => candidate.item)], 20);
  const used = new Set(chosenWords.map((item) => normalize(item.lemma)));
  const phrases = choose(phraseCandidates.filter((item) => !used.has(normalize(item.lemma))), 3);
  for (const item of phrases) used.add(normalize(item.lemma));
  const collocations = choose(collocationCandidates.filter((item) => !used.has(normalize(item.lemma))), TARGET_ITEMS - chosenWords.length - phrases.length);
  const items = [...chosenWords, ...phrases, ...collocations].slice(0, TARGET_ITEMS);
  return { id: target.id, exam: target.exam, title: target.title, source: target.source, sourceUrl: target.sourceUrl, items };
}

async function loadLexicons(): Promise<{ ielts: DictionaryWord[]; sat: DictionaryWord[] }> {
  const topicData = JSON.parse(await readFile(IELTS_LEXICON_FILE, 'utf8')) as Array<{ slug?: string; name?: string; words?: DictionaryWord[] }>;
  const satBookData = JSON.parse(await readFile(SAT_BOOK_FILE, 'utf8')) as Array<{ slug?: string; title?: string; words?: DictionaryWord[] }>;
  const ielts = topicData.flatMap((topic) => (topic.words ?? []).map((word) => ({
    ...word,
    topicSlug: topic.slug,
    topicName: topic.name,
  })));
  const satBook = satBookData.flatMap((deck) => (deck.words ?? []).map((word) => ({
    ...word,
    topicSlug: deck.slug,
    topicName: deck.title,
    score: word.score ?? word.word.length,
    sourcePriority: 3,
  })));
  const satLexicon = Object.entries(SAT_RW_LEXICON).map(([word, entry]) => ({
    word,
    pos: entry.pos,
    meaningVi: entry.meaningVi,
    definitionEn: entry.definitionEn,
    synonyms: entry.synonyms,
    example: entry.example,
    score: word.length,
    sourcePriority: 2,
  }));
  const sat = [...satLexicon, ...satBook, ...ielts];
  return { ielts, sat };
}

async function main() {
  const [raw, webRaw, satRaw, curatedRaw] = await Promise.all([
    readFile(SOURCE_FILE, 'utf8').then((content) => JSON.parse(content) as { tests?: SourceTest[] }),
    readFile(WEB_SOURCE_FILE, 'utf8').then((content) => JSON.parse(content) as { tests?: SourceTest[] }),
    readFile(SAT_SOURCE_FILE, 'utf8').then((content) => JSON.parse(content) as { tests?: SourceTest[] }),
    readFile(CURATED_VOCAB_FILE, 'utf8').then((content) => JSON.parse(content) as { sets?: VocabularySet[] }),
  ]);
  const targets = makeTargets([...(raw.tests ?? []), ...(webRaw.tests ?? []), ...(satRaw.tests ?? [])]);
  const selected = ONLY.length ? targets.filter((target) => ONLY.includes(target.id)) : targets;
  if (!selected.length) throw new Error('No test sets matched the requested IDs.');
  const { ielts, sat } = await loadLexicons();
  const generatedSets = selected.map((target) => buildSet(target, ielts, sat));
  const generatedIds = new Set(generatedSets.map((set) => set.id));
  const sets = [
    ...generatedSets,
    ...(ONLY.length ? [] : (curatedRaw.sets ?? []).filter((set) => !generatedIds.has(set.id))),
  ];
  const underfilled = sets.filter((set) => set.items.length < 20);
  for (const set of sets) console.log(`${set.id}: ${set.items.length} verified terms/phrases.`);
  if (underfilled.length) console.warn(`Needs more dictionary coverage: ${underfilled.map((set) => `${set.id} (${set.items.length})`).join(', ')}`);
  if (ONLY.length) {
    for (const set of sets) console.log(`  ${set.items.map((item) => `${item.term} [${item.category}]`).join(' · ')}`);
    console.log(`Preview only; the complete ${targets.length}-pack catalog is written only after the full run.`);
    return;
  }
  if (underfilled.length) throw new Error('Some sets have fewer than 20 items; expand the lexical sources before publishing.');
  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, `${JSON.stringify({
    version: 1,
    generatedAt: new Date().toISOString(),
    note: 'Contains vocabulary items verified against source test text; example sentences are original examples and source passages are excluded.',
    sets,
  }, null, 2)}\n`, 'utf8');
  console.log(`Saved ${sets.length} test vocabulary packs (${sets.reduce((sum, set) => sum + set.items.length, 0)} verified items).`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Vocabulary extraction failed.');
  process.exitCode = 1;
});
