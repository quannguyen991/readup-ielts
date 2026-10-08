import type { Bi } from '@/i18n/useL';
import type { StudyAbroadMission } from './study-abroad-campaign';

export type CampusRoom = { door: '1' | '2' | '3' | '4'; name: Bi; subject: Bi; glyph: string; desc: Bi };

export type StudyCampus = {
  id: string;
  /** Chương có trường này làm nơi học; `null` là trường chưa gắn chương nào. */
  chapter: StudyAbroadMission['chapter'] | null;
  name: Bi;
  city: Bi;
  country: Bi;
  tagline: Bi;
  /** Lưới ký tự 20×9; số 1–4 là cửa phòng học, khớp với `rooms`. */
  map: readonly string[];
  rooms: readonly CampusRoom[];
};

/** Bản đồ chỉ để chơi: tên trường để nhận diện, không phải mặt bằng hay thông tin tuyển sinh thật. */
export const CAMPUS_LEGEND: Readonly<Record<string, Bi>> = {
  '.': { vi: 'Lối đi', en: 'Path' },
  _: { vi: 'Bãi cỏ', en: 'Lawn' },
  S: { vi: 'Sân thể thao', en: 'Sports field' },
  '~': { vi: 'Hồ', en: 'Lake' },
  T: { vi: 'Cây', en: 'Tree' },
  '#': { vi: 'Tường tòa nhà', en: 'Building wall' },
  G: { vi: 'Cổng trường', en: 'Gate' },
  L: { vi: 'Thư viện', en: 'Library' },
  C: { vi: 'Căng-tin', en: 'Canteen' },
};

type Front = readonly [string, string, string];

const ROOF = 'T_####__####__####_T';
const PATH = `T${'.'.repeat(18)}T`;
const GATE = `${'T'.repeat(9)}G${'T'.repeat(10)}`;
const front = ([a, b, c]: Front) => `T_#${a}##__#${b}##__#${c}##_T`;

/** Ba dãy tòa nhà có cửa phía trước, hai hàng lối đi và cổng ở mép dưới. */
const campusMap = (lawn: string, top: Front, bottom: Front): string[] => [
  'T'.repeat(20),
  `T${lawn}T`,
  ROOF,
  front(top),
  PATH,
  ROOF,
  front(bottom),
  PATH,
  GATE,
];

export const STUDY_CAMPUSES: readonly StudyCampus[] = [
  {
    id: 'nus',
    chapter: 1,
    name: { vi: 'Đại học Quốc gia Singapore', en: 'National University of Singapore' },
    city: { vi: 'Singapore', en: 'Singapore' },
    country: { vi: 'Singapore', en: 'Singapore' },
    tagline: { vi: 'Trường đa ngành với nhiều khu học tập ngoài trời.', en: 'A multi-disciplinary campus with many outdoor study areas.' },
    map: campusMap('__SS____SS____SS__', ['1', '2', '3'], ['L', 'C', '4']),
    rooms: [
      { door: '1', name: { vi: 'Phòng tình huống kinh doanh', en: 'Business case room' }, subject: { vi: 'Kinh doanh', en: 'Business' }, glyph: '💼', desc: { vi: 'Bàn tròn để giải bài toán nhóm.', en: 'Round tables for group case work.' } },
      { door: '2', name: { vi: 'Xưởng kỹ thuật', en: 'Engineering workshop' }, subject: { vi: 'Kỹ thuật', en: 'Engineering' }, glyph: '🛠️', desc: { vi: 'Bàn gỗ và dụng cụ đo.', en: 'Workbenches and measuring tools.' } },
      { door: '3', name: { vi: 'Trung tâm ngoại ngữ', en: 'Language centre' }, subject: { vi: 'Ngoại ngữ', en: 'Languages' }, glyph: '🗣️', desc: { vi: 'Phòng nhỏ có tai nghe.', en: 'Small rooms with headsets.' } },
      { door: '4', name: { vi: 'Phòng y sinh', en: 'Biomedical lab' }, subject: { vi: 'Y sinh', en: 'Biomedical sciences' }, glyph: '🧬', desc: { vi: 'Tủ kính và kính hiển vi.', en: 'Glass cabinets and microscopes.' } },
    ],
  },
  {
    id: 'ucl',
    chapter: 2,
    name: { vi: 'Đại học College London', en: 'University College London' },
    city: { vi: 'London', en: 'London' },
    country: { vi: 'Vương quốc Anh', en: 'United Kingdom' },
    tagline: { vi: 'Trường đại học ở London với nhiều ngành xã hội và kiến trúc.', en: 'A London university with many social science and architecture programmes.' },
    map: campusMap('_TTTTT_____TTTTT__', ['1', '2', '3'], ['C', 'L', '4']),
    rooms: [
      { door: '1', name: { vi: 'Studio kiến trúc', en: 'Architecture studio' }, subject: { vi: 'Kiến trúc', en: 'Architecture' }, glyph: '🏛️', desc: { vi: 'Bàn mô hình và đèn bàn.', en: 'Model tables and desk lamps.' } },
      { door: '2', name: { vi: 'Phòng kinh tế', en: 'Economics seminar' }, subject: { vi: 'Kinh tế', en: 'Economics' }, glyph: '💷', desc: { vi: 'Bảng trắng và đồ thị in lớn.', en: 'Whiteboards and large printed graphs.' } },
      { door: '3', name: { vi: 'Phòng ngôn ngữ', en: 'Language lab' }, subject: { vi: 'Ngôn ngữ', en: 'Languages' }, glyph: '🎧', desc: { vi: 'Bàn có tai nghe luyện nghe–nói.', en: 'Desks with listening and speaking headsets.' } },
      { door: '4', name: { vi: 'Giảng đường luật', en: 'Law lecture hall' }, subject: { vi: 'Luật', en: 'Law' }, glyph: '⚖️', desc: { vi: 'Ghế bậc thang hướng về bục giảng.', en: 'Tiered seats facing the podium.' } },
    ],
  },
  {
    id: 'sorbonne',
    chapter: 3,
    name: { vi: 'Đại học Sorbonne', en: 'Sorbonne University' },
    city: { vi: 'Paris', en: 'Paris' },
    country: { vi: 'Pháp', en: 'France' },
    tagline: { vi: 'Trường nhân văn với nhiều buổi tranh luận trên lớp.', en: 'A humanities campus with many class debates.' },
    map: campusMap('____~~~~______~~~~', ['1', '2', '3'], ['4', 'C', 'L']),
    rooms: [
      { door: '1', name: { vi: 'Phòng triết học', en: 'Philosophy seminar' }, subject: { vi: 'Triết học', en: 'Philosophy' }, glyph: '🧠', desc: { vi: 'Bàn dài và bảng đầy câu hỏi.', en: 'Long tables and a board full of questions.' } },
      { door: '2', name: { vi: 'Kho lưu trữ lịch sử', en: 'History archive room' }, subject: { vi: 'Lịch sử', en: 'History' }, glyph: '🏺', desc: { vi: 'Giá sách cũ và tài liệu in.', en: 'Old bookshelves and printed documents.' } },
      { door: '3', name: { vi: 'Phòng tiếng Pháp', en: 'French language lab' }, subject: { vi: 'Tiếng Pháp', en: 'French' }, glyph: '🥖', desc: { vi: 'Thẻ hội thoại dán khắp tường.', en: 'Dialogue cards pinned all over the walls.' } },
      { door: '4', name: { vi: 'Phòng văn học', en: 'Literature hall' }, subject: { vi: 'Văn học', en: 'Literature' }, glyph: '📜', desc: { vi: 'Ghế đọc quanh bàn gỗ.', en: 'Reading chairs around a wooden table.' } },
    ],
  },
  {
    id: 'utokyo',
    chapter: 4,
    name: { vi: 'Đại học Tokyo', en: 'University of Tokyo' },
    city: { vi: 'Tokyo', en: 'Tokyo' },
    country: { vi: 'Nhật Bản', en: 'Japan' },
    tagline: { vi: 'Trường nghiên cứu với nhiều phòng thí nghiệm và thư viện yên tĩnh.', en: 'A research campus with many labs and quiet libraries.' },
    map: campusMap('_SS_TT_SS_TT_SS_TT', ['1', '2', '3'], ['L', '4', 'C']),
    rooms: [
      { door: '1', name: { vi: 'Phòng tiếng Nhật', en: 'Japanese language room' }, subject: { vi: 'Tiếng Nhật', en: 'Japanese' }, glyph: '📝', desc: { vi: 'Bảng chữ kana treo kín tường.', en: 'Kana charts covering the walls.' } },
      { door: '2', name: { vi: 'Phòng kỹ thuật', en: 'Engineering lab' }, subject: { vi: 'Kỹ thuật', en: 'Engineering' }, glyph: '⚙️', desc: { vi: 'Máy in 3D và kệ linh kiện.', en: '3D printers and parts shelves.' } },
      { door: '3', name: { vi: 'Phòng sinh học', en: 'Biology lab' }, subject: { vi: 'Sinh học', en: 'Biology' }, glyph: '🌱', desc: { vi: 'Chậu cây và kính hiển vi.', en: 'Potted plants and microscopes.' } },
      { door: '4', name: { vi: 'Giảng đường kinh tế', en: 'Economics hall' }, subject: { vi: 'Kinh tế', en: 'Economics' }, glyph: '📈', desc: { vi: 'Ghế bậc thang và bảng số liệu.', en: 'Tiered seats and data boards.' } },
    ],
  },
  {
    id: 'columbia',
    chapter: 5,
    name: { vi: 'Đại học Columbia', en: 'Columbia University' },
    city: { vi: 'New York', en: 'New York' },
    country: { vi: 'Hoa Kỳ', en: 'United States' },
    tagline: { vi: 'Trường đại học ở Manhattan với nhiều ngành báo chí và chính trị.', en: 'A Manhattan university with journalism and politics programmes.' },
    map: campusMap('__TT__SS__TT__SS__', ['1', '2', '3'], ['C', 'L', '4']),
    rooms: [
      { door: '1', name: { vi: 'Phòng báo chí', en: 'Newsroom' }, subject: { vi: 'Báo chí', en: 'Journalism' }, glyph: '📰', desc: { vi: 'Bàn sát nhau dưới đồng hồ thế giới.', en: 'Desks packed together under world clocks.' } },
      { door: '2', name: { vi: 'Phòng chính trị', en: 'Political science seminar' }, subject: { vi: 'Chính trị', en: 'Political science' }, glyph: '🗳️', desc: { vi: 'Bàn tròn có biển tên.', en: 'Round tables with name placards.' } },
      { door: '3', name: { vi: 'Phòng họp kinh doanh', en: 'Business school room' }, subject: { vi: 'Kinh doanh', en: 'Business' }, glyph: '🏦', desc: { vi: 'Phòng họp kính với màn hình lớn.', en: 'A glass meeting room with a large screen.' } },
      { door: '4', name: { vi: 'Phòng âm nhạc', en: 'Music studio' }, subject: { vi: 'Âm nhạc', en: 'Music' }, glyph: '🎹', desc: { vi: 'Đàn piano và buồng cách âm.', en: 'A piano and a soundproof booth.' } },
    ],
  },
  {
    id: 'rmit',
    chapter: null,
    name: { vi: 'Đại học RMIT', en: 'RMIT University' },
    city: { vi: 'Melbourne', en: 'Melbourne' },
    country: { vi: 'Úc', en: 'Australia' },
    tagline: { vi: 'Trường thiết kế và công nghệ với nhiều xưởng thực hành.', en: 'A design and technology campus with many hands-on studios.' },
    map: campusMap('SSSSSS_____SSSSSS_', ['1', '2', '3'], ['L', '4', 'C']),
    rooms: [
      { door: '1', name: { vi: 'Studio thiết kế', en: 'Design studio' }, subject: { vi: 'Thiết kế', en: 'Design' }, glyph: '🎨', desc: { vi: 'Bàn vẽ và giá mô hình.', en: 'Drawing tables and model racks.' } },
      { door: '2', name: { vi: 'Phòng máy tính', en: 'Computer lab' }, subject: { vi: 'Công nghệ', en: 'Technology' }, glyph: '💻', desc: { vi: 'Dãy máy làm đồ án nhóm.', en: 'Rows of machines for group projects.' } },
      { door: '3', name: { vi: 'Giảng đường kinh doanh', en: 'Business lecture hall' }, subject: { vi: 'Kinh doanh', en: 'Business' }, glyph: '📊', desc: { vi: 'Bục giảng và màn hình trình chiếu lớn.', en: 'A stage and a large projection screen.' } },
      { door: '4', name: { vi: 'Phòng truyền thông', en: 'Media room' }, subject: { vi: 'Truyền thông', en: 'Media' }, glyph: '🎬', desc: { vi: 'Phòng dựng video và thu âm.', en: 'A room for video editing and recording.' } },
    ],
  },
  {
    id: 'unimelb',
    chapter: null,
    name: { vi: 'Đại học Melbourne', en: 'University of Melbourne' },
    city: { vi: 'Melbourne', en: 'Melbourne' },
    country: { vi: 'Úc', en: 'Australia' },
    tagline: { vi: 'Trường nghiên cứu với nhiều ngành nhân văn và khoa học.', en: 'A research university with arts and science programmes.' },
    map: campusMap('_T__T__T__T__T__T_', ['1', '2', '3'], ['C', '4', 'L']),
    rooms: [
      { door: '1', name: { vi: 'Phòng tranh luận', en: 'Moot court' }, subject: { vi: 'Luật', en: 'Law' }, glyph: '⚖️', desc: { vi: 'Bàn gỗ dài cho buổi tập tranh tụng.', en: 'Long wooden benches for mock trials.' } },
      { door: '2', name: { vi: 'Phòng seminar', en: 'Seminar room' }, subject: { vi: 'Nhân văn', en: 'Arts' }, glyph: '📚', desc: { vi: 'Vòng ghế ngồi quanh bàn để thảo luận.', en: 'A circle of chairs for discussion.' } },
      { door: '3', name: { vi: 'Phòng thí nghiệm', en: 'Science lab' }, subject: { vi: 'Khoa học', en: 'Science' }, glyph: '🧪', desc: { vi: 'Bàn thí nghiệm và tủ hoá chất.', en: 'Lab benches and chemical cabinets.' } },
      { door: '4', name: { vi: 'Giảng đường kinh tế', en: 'Economics hall' }, subject: { vi: 'Kinh tế', en: 'Economics' }, glyph: '📈', desc: { vi: 'Tường kín biểu đồ.', en: 'Walls covered with charts.' } },
    ],
  },
  {
    id: 'mit',
    chapter: null,
    name: { vi: 'MIT', en: 'Massachusetts Institute of Technology' },
    city: { vi: 'Cambridge, Massachusetts', en: 'Cambridge, Massachusetts' },
    country: { vi: 'Hoa Kỳ', en: 'United States' },
    tagline: { vi: 'Trường kỹ thuật và khoa học với nhiều phòng thí nghiệm.', en: 'An engineering and science campus full of labs.' },
    map: campusMap('~~~~~~______~~~~~~', ['1', '2', '3'], ['4', 'L', 'C']),
    rooms: [
      { door: '1', name: { vi: 'Phòng robot', en: 'Robotics lab' }, subject: { vi: 'Kỹ thuật', en: 'Engineering' }, glyph: '🤖', desc: { vi: 'Cánh tay robot và bàn lắp ráp.', en: 'Robot arms and assembly benches.' } },
      { door: '2', name: { vi: 'Giảng đường vật lý', en: 'Physics lecture hall' }, subject: { vi: 'Vật lý', en: 'Physics' }, glyph: '🔭', desc: { vi: 'Công thức phủ kín hai bên tường.', en: 'Formulas covering both side walls.' } },
      { door: '3', name: { vi: 'Phòng toán', en: 'Maths seminar' }, subject: { vi: 'Toán', en: 'Mathematics' }, glyph: '📐', desc: { vi: 'Bàn tròn nhỏ cho nhóm bốn người.', en: 'Small round tables for groups of four.' } },
      { door: '4', name: { vi: 'Phòng máy tính', en: 'Computer lab' }, subject: { vi: 'Khoa học máy tính', en: 'Computer science' }, glyph: '💻', desc: { vi: 'Dãy màn hình lập trình dài.', en: 'A long row of coding screens.' } },
    ],
  },
];
