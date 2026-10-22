/**
 * LỘ TRÌNH TỪ VỰNG SAT TOÀN DIỆN (1.820 TỪ · 48 UNITS)
 *
 * Tổ chức theo 4 chặng từ vựng thực chiến:
 * - Chặng 1: 300 từ lõi & 144 động từ chức năng (14 units)
 * - Chặng 2: 225 từ đa nghĩa & Đề thi thật 2024–2025 (11 units)
 * - Chặng 3: 12 Chủ đề học thuật SAT (12 units)
 * - Chặng 4: Tủ sách kinh điển Erica Meltzer & Princeton Review (11 units)
 */

export type VocabRoadmapUnit = {
  n: number;
  slug: string;
  title: string;
  count: number;
  blurb: string;
  sourceBook: string;
};

export type VocabRoadmapPhase = {
  phase: number;
  titleVi: string;
  titleEn: string;
  blurbVi: string;
  blurbEn: string;
  color: string;
  units: VocabRoadmapUnit[];
};

export const VOCAB_ROADMAP_PHASES: VocabRoadmapPhase[] = [
  {
    phase: 1,
    titleVi: 'Chặng 1: Nền tảng học thuật cốt lõi',
    titleEn: 'Phase 1: Academic Foundations',
    blurbVi: '300 từ lõi xuất hiện ở mọi đề thi và 144 động từ miêu tả hành động tu từ của tác giả.',
    blurbEn: '300 universal core words appearing in all test passages and 144 function verbs.',
    color: '#6A4BD9',
    units: [
      { n: 1, slug: 'sat-tang-1-unit-01', title: 'Lập luận, bằng chứng, nghiên cứu', count: 30, blurb: 'assert, claim, hypothesis, evidence…', sourceBook: 'SAT R&W 16 tuần · Tầng 1' },
      { n: 2, slug: 'sat-tang-1-unit-02', title: 'Thay đổi, xu hướng, chuyển động', count: 30, blurb: 'fluctuate, accelerate, stagnate, evolve…', sourceBook: 'SAT R&W 16 tuần · Tầng 1' },
      { n: 3, slug: 'sat-tang-1-unit-03', title: 'Mức độ, phạm vi, tần suất', count: 30, blurb: 'substantial, pervasive, marginal, ubiquitous…', sourceBook: 'SAT R&W 16 tuần · Tầng 1' },
      { n: 4, slug: 'sat-tang-1-unit-04', title: 'Nguyên nhân, điều kiện, hệ quả', count: 30, blurb: 'catalyst, precipitate, induce, engender…', sourceBook: 'SAT R&W 16 tuần · Tầng 1' },
      { n: 5, slug: 'sat-tang-1-unit-05', title: 'Đánh giá tích cực', count: 30, blurb: 'commend, validate, elucidate, substantiate…', sourceBook: 'SAT R&W 16 tuần · Tầng 1' },
      { n: 6, slug: 'sat-tang-1-unit-06', title: 'Đánh giá tiêu cực', count: 30, blurb: 'undermine, refute, repudiate, debunk…', sourceBook: 'SAT R&W 16 tuần · Tầng 1' },
      { n: 7, slug: 'sat-tang-1-unit-07', title: 'Con người, tính cách, thái độ', count: 30, blurb: 'candid, reticent, ambivalent, indifferent…', sourceBook: 'SAT R&W 16 tuần · Tầng 1' },
      { n: 8, slug: 'sat-tang-1-unit-08', title: 'Thời gian, trình tự, lịch sử', count: 30, blurb: 'anachronism, precursor, transient, epoch…', sourceBook: 'SAT R&W 16 tuần · Tầng 1' },
      { n: 9, slug: 'sat-tang-1-unit-09', title: 'Cấu trúc, hệ thống, quá trình', count: 30, blurb: 'hierarchy, synthesize, delineate, amalgamate…', sourceBook: 'SAT R&W 16 tuần · Tầng 1' },
      { n: 10, slug: 'sat-tang-1-unit-10', title: 'Khái niệm trừu tượng', count: 30, blurb: 'paradox, paradigm, dichotomy, anomaly…', sourceBook: 'SAT R&W 16 tuần · Tầng 1' },
      { n: 11, slug: 'sat-tang-3-unit-01', title: 'Động từ chức năng tu từ (Phần 1)', count: 36, blurb: 'introduce, elaborate on, contextualize…', sourceBook: 'SAT R&W 16 tuần · Tầng 3' },
      { n: 12, slug: 'sat-tang-3-unit-02', title: 'Động từ chức năng tu từ (Phần 2)', count: 36, blurb: 'support, substantiate, corroborate…', sourceBook: 'SAT R&W 16 tuần · Tầng 3' },
      { n: 13, slug: 'sat-tang-3-unit-03', title: 'Động từ chức năng tu từ (Phần 3)', count: 36, blurb: 'qualify, question, challenge, concede…', sourceBook: 'SAT R&W 16 tuần · Tầng 3' },
      { n: 14, slug: 'sat-tang-3-unit-04', title: 'Động từ chức năng tu từ (Phần 4)', count: 36, blurb: 'rebut, summarize, advocate, propose…', sourceBook: 'SAT R&W 16 tuần · Tầng 3' },
    ]
  },
  {
    phase: 2,
    titleVi: 'Chặng 2: Bứt phá ngữ cảnh & Từ đa nghĩa',
    titleEn: 'Phase 2: Polysemy & Real Tests',
    blurbVi: 'Chữ quen nghĩa lạ (qualify, champion, compromise) và từ vựng trích thẳng từ đề thi thật 2024–2025.',
    blurbEn: 'Words with unusual SAT meanings and vocabulary directly extracted from 2024–2025 real tests.',
    color: '#22A06B',
    units: [
      { n: 15, slug: 'sat-tang-2-unit-01', title: 'Từ đa nghĩa SAT (Phần 1)', count: 37, blurb: 'qualify, table, champion, plastic…', sourceBook: 'SAT R&W 16 tuần · Tầng 2' },
      { n: 16, slug: 'sat-tang-2-unit-02', title: 'Từ đa nghĩa SAT (Phần 2)', count: 37, blurb: 'compromise, climate, check, harbor…', sourceBook: 'SAT R&W 16 tuần · Tầng 2' },
      { n: 17, slug: 'sat-tang-2-unit-03', title: 'Từ đa nghĩa SAT (Phần 3)', count: 37, blurb: 'currency, eclipse, register, gravity…', sourceBook: 'SAT R&W 16 tuần · Tầng 2' },
      { n: 18, slug: 'sat-tang-2-unit-04', title: 'Từ đa nghĩa SAT (Phần 4)', count: 37, blurb: 'temper, observe, flag, reservation…', sourceBook: 'SAT R&W 16 tuần · Tầng 2' },
      { n: 19, slug: 'sat-tang-2-unit-05', title: 'Từ đa nghĩa SAT (Phần 5)', count: 38, blurb: 'facility, uniform, arrest, discount…', sourceBook: 'SAT R&W 16 tuần · Tầng 2' },
      { n: 20, slug: 'sat-tang-2-unit-06', title: 'Từ đa nghĩa SAT (Phần 6)', count: 38, blurb: 'sound, pedestrian, weather, novel…', sourceBook: 'SAT R&W 16 tuần · Tầng 2' },
      { n: 21, slug: 'sat-real-tests-2025-p1', title: 'Đề thi thật SAT 2024–2025 (Phần 1)', count: 38, blurb: 'Từ vựng Words in Context trong đề thật 2024…', sourceBook: 'Springboard · Đề thi thật 2024–2025' },
      { n: 22, slug: 'sat-real-tests-2025-p2', title: 'Đề thi thật SAT 2024–2025 (Phần 2)', count: 38, blurb: 'Từ vựng Words in Context trong đề thật 2024–2025…', sourceBook: 'Springboard · Đề thi thật 2024–2025' },
      { n: 23, slug: 'sat-real-tests-2025-p3', title: 'Đề thi thật SAT 2024–2025 (Phần 3)', count: 39, blurb: 'Từ vựng Words in Context trong đề thật 2025…', sourceBook: 'Springboard · Đề thi thật 2024–2025' },
      { n: 24, slug: 'sat-550-digital-must-know', title: '550 Words to Know for Digital SAT', count: 32, blurb: 'anachronism, capitulate, deleterious…', sourceBook: 'The Princeton Review' },
      { n: 25, slug: 'sat-springboard-core', title: 'SAT 15.000 Database Springboard', count: 58, blurb: 'abate, belligerent, capricious, dichotomy…', sourceBook: 'SAT 15.000 Database' },
    ]
  },
  {
    phase: 3,
    titleVi: 'Chặng 3: 12 Chủ đề học thuật chuyên sâu',
    titleEn: 'Phase 3: 12 Academic Content Domains',
    blurbVi: 'Từ vựng học thuật bao trọn 12 mảng đọc hiểu: Khoa học, Sinh học, Lịch sử, Kinh tế, Tâm lý, Văn học…',
    blurbEn: 'Academic vocabulary covering all 12 SAT reading domains: Science, Biology, History, Economics…',
    color: '#6A4BD9',
    units: [
      { n: 26, slug: 'sat-chude-01', title: 'Khoa học & Phương pháp nghiên cứu', count: 44, blurb: 'hypothesis, empirical, replicate, variable…', sourceBook: 'SAT R&W 16 tuần · Science' },
      { n: 27, slug: 'sat-chude-02', title: 'Sinh học & Môi trường sinh thái', count: 44, blurb: 'symbiotic, biodiversity, adaptation, flora…', sourceBook: 'SAT R&W 16 tuần · Biology' },
      { n: 28, slug: 'sat-chude-03', title: 'Lịch sử & Chính trị lập quốc', count: 44, blurb: 'sovereignty, autonomy, disenfranchise, tyranny…', sourceBook: 'SAT R&W 16 tuần · History' },
      { n: 29, slug: 'sat-chude-04', title: 'Kinh tế & Thị trường lao động', count: 44, blurb: 'fiscal, deficit, capital, commodity, inflation…', sourceBook: 'SAT R&W 16 tuần · Economics' },
      { n: 30, slug: 'sat-chude-05', title: 'Tâm lý học & Hành vi nhận thức', count: 44, blurb: 'cognition, bias, stimuli, perception, innate…', sourceBook: 'SAT R&W 16 tuần · Psychology' },
      { n: 31, slug: 'sat-chude-06', title: 'Văn học & Nghệ thuật tự sự', count: 37, blurb: 'narrative, prose, poignant, monologue, motif…', sourceBook: 'SAT R&W 16 tuần · Literature' },
      { n: 32, slug: 'sat-chude-07', title: 'Nghệ thuật & Mỹ học', count: 44, blurb: 'aesthetics, avant-garde, juxtapose, baroque…', sourceBook: 'SAT R&W 16 tuần · Art' },
      { n: 33, slug: 'sat-chude-08', title: 'Công nghệ, Kỹ thuật & Không gian', count: 44, blurb: 'propulsion, orbital, celestial, automation…', sourceBook: 'SAT R&W 16 tuần · Tech & Space' },
      { n: 34, slug: 'sat-chude-09', title: 'Nhân chủng & Văn hoá cổ', count: 44, blurb: 'artifact, indigenous, lineage, folklore…', sourceBook: 'SAT R&W 16 tuần · Anthropology' },
      { n: 35, slug: 'sat-chude-10', title: 'Ngôn ngữ & Truyền thông', count: 44, blurb: 'discourse, vernacular, rhetoric, rhetoric…', sourceBook: 'SAT R&W 16 tuần · Language' },
      { n: 36, slug: 'sat-chude-11', title: 'Y học, Sức khoẻ & Cơ thể', count: 44, blurb: 'pathogen, therapeutic, immune, clinical…', sourceBook: 'SAT R&W 16 tuần · Medicine' },
      { n: 37, slug: 'sat-chude-12', title: 'Luật pháp, Đạo đức & Xã hội', count: 44, blurb: 'statute, precedent, jurisdiction, ethical…', sourceBook: 'SAT R&W 16 tuần · Law & Ethics' },
    ]
  },
  {
    phase: 4,
    titleVi: 'Chặng 4: Tủ sách kinh điển Erica Meltzer & Princeton Review',
    titleEn: 'Phase 4: Classic SAT Prep Books',
    blurbVi: 'Tổng hợp từ vựng chuyên sâu từ The Critical Reader và The Princeton Review Digital SAT Premium.',
    blurbEn: 'Specialized vocab from The Critical Reader and The Princeton Review Digital SAT Premium.',
    color: '#D65A8A',
    units: [
      { n: 38, slug: 'sat-critical-reader-passage', title: 'The Critical Reader · Từ vựng đoạn văn', count: 30, blurb: 'Từ vựng văn bản học thuật Erica Meltzer…', sourceBook: 'The Critical Reader' },
      { n: 39, slug: 'sat-critical-reader-context', title: 'The Critical Reader · Từ trong ngữ cảnh', count: 30, blurb: 'Từ vựng Words in Context Erica Meltzer…', sourceBook: 'The Critical Reader' },
      { n: 40, slug: 'sat-critical-reader-writing', title: 'The Critical Reader · Từ vựng Writing', count: 30, blurb: 'Từ nối và văn phong chuẩn mực…', sourceBook: 'The Ultimate Guide to SAT Grammar' },
      { n: 41, slug: 'sat-critical-reader-confused-1', title: 'Erica Meltzer · Từ dễ nhầm (Tập 1)', count: 30, blurb: 'Các cặp từ tương đồng dễ gây bẫy…', sourceBook: 'The Critical Reader' },
      { n: 42, slug: 'sat-critical-reader-confused-2', title: 'Erica Meltzer · Từ dễ nhầm (Tập 2)', count: 30, blurb: 'Các cặp từ tương đồng dễ gây bẫy…', sourceBook: 'The Critical Reader' },
      { n: 43, slug: 'sat-princeton-cram', title: 'The Princeton Review · Cram List', count: 30, blurb: 'Bộ từ cấp tốc cho kỳ thi Digital SAT…', sourceBook: 'The Princeton Review' },
      { n: 44, slug: 'sat-princeton-glossary-1', title: 'Princeton Review · Bảng thuật ngữ 1', count: 30, blurb: 'Glossary SAT Words (A – D)…', sourceBook: 'The Princeton Review' },
      { n: 45, slug: 'sat-princeton-glossary-2', title: 'Princeton Review · Bảng thuật ngữ 2', count: 30, blurb: 'Glossary SAT Words (E – H)…', sourceBook: 'The Princeton Review' },
      { n: 46, slug: 'sat-princeton-glossary-3', title: 'Princeton Review · Bảng thuật ngữ 3', count: 30, blurb: 'Glossary SAT Words (I – M)…', sourceBook: 'The Princeton Review' },
      { n: 47, slug: 'sat-princeton-glossary-4', title: 'Princeton Review · Bảng thuật ngữ 4', count: 30, blurb: 'Glossary SAT Words (N – R)…', sourceBook: 'The Princeton Review' },
      { n: 48, slug: 'sat-princeton-glossary-5', title: 'Princeton Review · Bảng thuật ngữ 5', count: 30, blurb: 'Glossary SAT Words (S – Z)…', sourceBook: 'The Princeton Review' },
    ]
  }
];

export const TOTAL_VOCAB_UNITS = VOCAB_ROADMAP_PHASES.reduce((acc, p) => acc + p.units.length, 0);
export const TOTAL_VOCAB_WORDS = VOCAB_ROADMAP_PHASES.reduce((acc, p) => acc + p.units.reduce((uAcc, u) => uAcc + u.count, 0), 0);
