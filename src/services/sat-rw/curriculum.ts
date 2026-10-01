import { SAT_RW_QUESTIONS, SAT_RW_UNITS, questionsForUnit, rwDifficulty, type SatRwQuestion } from '@/data/sat-rw-repository';
import type { Difficulty } from '@/lib/difficulty';

/**
 * Lộ trình SAT Reading & Writing — năm chặng, mười sáu bài học.
 *
 * DỰNG THEO ĐÚNG KHUÔN CỦA `services/math/curriculum.ts`, và đó là yêu cầu chứ
 * không phải tiện tay: hai mảng nằm cạnh nhau trong cùng một app, người học đi
 * từ mảng này sang mảng kia. Math đã có chặng → bài học → bộ đề, và người dùng
 * đã quen ba tầng ấy. Verbal bày ra một cấu trúc khác là bắt họ học lại cách
 * đọc lộ trình.
 *
 * KHÁC MATH MỘT CHỖ CỐT TỬ, và chỗ ấy quyết định hình dạng của cả file: đề Math
 * SINH VÔ HẠN bằng code, nên mỗi bài học có sáu bộ 20–24 câu đều là câu mới.
 * Verbal thì mỗi unit chỉ có ĐÚNG 24 CÂU SOẠN TAY. Cắt chúng thành sáu bộ 20
 * câu là lặp lại gần như nguyên xi bốn lần, và người học sẽ nhớ đáp án chứ
 * không nhớ luật.
 *
 * Nên ba bộ mỗi bài, chia theo ĐIỀU KIỆN LÀM chứ không theo nội dung khác nhau:
 *
 *   Làm quen   — 12 câu đầu, giờ rộng, đọc lời giải ngay sau mỗi câu
 *   Luyện kỹ   — 12 câu sau, vẫn có lời giải ngay
 *   Chốt       — cả 24 câu, đúng nhịp đề thật, KHÔNG lời giải giữa chừng
 *
 * Ba bộ ấy thật sự khác nhau: hai bộ đầu là học, bộ thứ ba là đo. Gặp lại câu
 * cũ ở bộ chốt là CÓ CHỦ Ý — đó là lúc kiểm xem mình nhớ luật hay nhớ đáp án.
 *
 * DỄ → VỪA → KHÓ (01/10/2026). Câu của unit giờ xếp theo bậc
 * (`questionsForUnit`), và các lát cắt đi theo bậc: "Làm quen" là phần Dễ,
 * "Luyện kỹ" là phần Vừa, và thêm bộ "Thử thách khó" gồm các câu viết riêng
 * cho bậc khó. Bộ chốt vẫn là cả bài, đi dễ → khó.
 *
 * BA BÀI HỌC CÓ THÊM BỘ THỨ TƯ "sinh mới". Ba bộ sinh bằng luật
 * (`sat-rw/vocab`, `sat-rw/evidence`, `sat-rw/synthesis`) cho ra câu mới mỗi
 * lượt, nên đúng ba bài học mà chúng phục vụ thì không bị trần 24 câu. Chỉ ba
 * bài ấy có, và nói rõ trên thẻ — hứa "vô hạn" ở bài không có bộ sinh là nói
 * dối về thứ người học kiểm được trong ba phút.
 */

export type SatRwSetKind = 'learn' | 'drill' | 'checkpoint' | 'generated';

export type SatRwExerciseSet = {
  id: string;
  /** Tên nói MỤC TIÊU của bộ. Nhãn kiểu bài đã nằm cạnh trên thẻ rồi. */
  title: string;
  blurb: string;
  kind: SatRwSetKind;
  unitNumber: number;
  unitTitle: string;
  domain: string;
  count: number;
  minutes: number;
  /** Có hiện lời giải ngay sau mỗi câu không. Bộ chốt thì không. */
  instantSolution: boolean;
  /** Cắt lát nào của 24 câu. `null` = cả bài, hoặc bộ sinh mới. */
  slice: { from: number; to: number } | null;
  /** Vị trí trong toàn lộ trình — dùng để tìm "bài kế tiếp". */
  order: number;
  /** Bậc của cả bộ — nhãn "Dễ / Vừa / Khó"; `mixed` khi bộ trải cả ba bậc. */
  difficulty: Difficulty | 'mixed';
};

export type SatRwCurriculumUnit = {
  number: number;
  title: string;
  domain: string;
  /** Cái bẫy trung tâm của kỹ năng này, viết thành một câu. */
  trap: string;
  questionCount: number;
  sets: SatRwExerciseSet[];
};

export type SatRwStage = {
  id: string;
  title: string;
  blurb: string;
  domain: string;
  units: SatRwCurriculumUnit[];
};

/**
 * Bẫy trung tâm của từng bài, một câu mỗi bài.
 *
 * KHÔNG PHẢI TÓM TẮT NỘI DUNG — tiêu đề bài đã làm việc đó. Đây là chỗ người
 * học hay hỏng, viết ra để họ biết phải canh cái gì trước khi làm câu đầu tiên.
 * Rút từ hộp luật của từng unit trong kho (`ruleVi`), gói lại thành một câu.
 */
const TRAPS: Record<number, string> = {
  1: 'Dấu phẩy trần nối hai mệnh đề độc lập thì LUÔN sai, dù câu đọc lên vẫn xuôi.',
  2: 'Mệnh đề phụ đứng trước cần dấu phẩy, đứng sau thì thường không — vị trí quyết định, không phải độ dài.',
  3: 'Thành phần chêm phải đóng bằng ĐÚNG loại dấu đã mở. Mở bằng phẩy mà đóng bằng gạch ngang là sai.',
  4: 'Dấu hai chấm đòi một mệnh đề hoàn chỉnh đứng trước nó. Chấm phẩy trong danh sách chỉ dùng khi từng mục đã có phẩy.',
  5: 'Chủ ngữ thật nằm trước cụm giới từ chen vào. "The box of books" là số ít.',
  6: 'Đại từ phải chỉ được đúng MỘT đối tượng. Câu có hai danh từ số ít mà dùng "it" là mơ hồ, kể cả khi đoán ra được.',
  7: 'Thế song song bắt hai vế cùng dạng. Đổi thì giữa chừng mà không có mốc thời gian mới là sai.',
  8: 'Sở hữu cách và số nhiều nghe giống nhau, viết khác nhau: students · student’s · students’.',
  9: 'Từ nối phải khớp QUAN HỆ giữa hai câu, không khớp giọng điệu. Đọc thử bỏ hẳn từ nối xem quan hệ là gì.',
  10: 'Nhiều từ nối cùng nghĩa "thêm vào" nhưng khác sắc thái. Chọn theo việc câu sau LÀM GÌ với câu trước.',
  11: 'Chọn từ theo cả câu, không theo nghĩa từ điển. Ba phương án còn lại thường đúng nghĩa nhưng sai văn cảnh.',
  12: 'Câu hỏi về CHỨC NĂNG của câu trong đoạn, không hỏi câu ấy nói gì. Đọc câu trước và câu sau nó.',
  13: 'Văn bản 2 thường không bác dữ kiện của văn bản 1 mà bác phạm vi của kết luận. Tìm chỗ suy rộng.',
  14: 'Ý chính phải bao trọn đoạn. Phương án đúng chi tiết nhưng chỉ đúng một câu thì vẫn sai.',
  15: 'Bằng chứng phải phục vụ ĐÚNG luận điểm đang nói. Số liệu đúng mà chứng minh chuyện khác là nhiễu.',
  16: 'Suy luận chỉ được đi thêm MỘT bước từ đoạn văn. Đi hai bước là đã bịa.',
};

/** Năm chặng, theo thứ tự nên học. */
type StageSeed = { id: string; title: string; blurb: string; domain: string; units: number[] };

const STAGE_SEEDS: StageSeed[] = [
  {
    id: 'conventions',
    title: 'Chặng 1 · Chuẩn mực tiếng Anh',
    blurb:
      'Tám bài luật: dấu câu, hợp số, đại từ, thì. Học trước vì đây là phần DUY NHẤT có luật đúng–sai rạch ròi — làm xong là chắc điểm, không phụ thuộc vốn từ.',
    domain: 'Standard English Conventions',
    units: [1, 2, 3, 4, 5, 6, 7, 8],
  },
  {
    id: 'expression',
    title: 'Chặng 2 · Diễn đạt ý',
    blurb:
      'Từ nối. Vẫn còn luật, nhưng luật nằm ở QUAN HỆ giữa hai câu chứ không ở hình thức — bước đệm giữa phần luật và phần đọc hiểu.',
    domain: 'Expression of Ideas',
    units: [9, 10],
  },
  {
    id: 'craft',
    title: 'Chặng 3 · Từ ngữ và cấu trúc',
    blurb:
      'Từ trong ngữ cảnh, chức năng của câu, nối hai văn bản. Từ đây không còn luật để tra — phải đọc và suy.',
    domain: 'Craft and Structure',
    units: [11, 12, 13],
  },
  {
    id: 'ideas',
    title: 'Chặng 4 · Nắm thông tin và ý',
    blurb:
      'Ý chính, bằng chứng, suy luận. Phần khó nhất và cũng chiếm nhiều câu nhất — để cuối vì nó cần cả ba chặng trước.',
    domain: 'Information and Ideas',
    units: [14, 15, 16],
  },
];

/** Ba bài học có bộ sinh bằng luật đứng sau, nên không bị trần 24 câu. */
const GENERATED_SETS: Record<number, { title: string; blurb: string; count: number; minutes: number }> = {
  11: {
    title: 'Sinh mới · từ trong ngữ cảnh',
    blurb:
      'Câu mới mỗi lượt, cắt từ 1.399 bài đọc thật trong kho. Không bao giờ hết câu, và không câu nào lặp đề.',
    count: 15,
    minutes: 20,
  },
  15: {
    title: 'Sinh mới · bằng chứng số liệu',
    blurb:
      'Bảng số sinh mới mỗi lượt, đáp án tính ra từ chính bảng ấy. Dạng này ở đề thật luôn có, và đây là chỗ luyện được vô hạn.',
    count: 12,
    minutes: 18,
  },
  16: {
    title: 'Sinh mới · chọn câu chốt đoạn',
    blurb:
      'Rhetorical Synthesis: cho sẵn ghi chú, chọn câu phục vụ đúng mục đích. 48 tổ hợp chủ đề × mục đích.',
    count: 12,
    minutes: 18,
  },
};

function questionsOfUnit(unit: number): SatRwQuestion[] {
  return SAT_RW_QUESTIONS.filter((q) => q.unit === unit);
}

function buildSets(unitNumber: number, unitTitle: string, domain: string, startOrder: number) {
  const ordered = questionsForUnit(unitNumber);
  const total = ordered.length;
  const easy = ordered.filter((q) => rwDifficulty(q) === 'easy').length;
  const medium = ordered.filter((q) => rwDifficulty(q) === 'medium').length;
  const hard = total - easy - medium;
  const base = `satrw-u${unitNumber}`;
  let order = startOrder;

  const sets: SatRwExerciseSet[] = [
    {
      id: `${base}-learn`,
      title: 'Làm quen dạng',
      blurb: `${easy} câu dễ, giờ rộng, lời giải hiện ngay sau mỗi câu.`,
      kind: 'learn',
      unitNumber,
      unitTitle,
      domain,
      count: easy,
      minutes: Math.max(10, Math.round(easy * 1.6)),
      instantSolution: true,
      slice: { from: 0, to: easy },
      order: order++,
      difficulty: 'easy',
    },
    {
      id: `${base}-drill`,
      title: 'Luyện kỹ',
      blurb: `${medium} câu mức vừa, vẫn có lời giải ngay. Gọi tên lỗi trước khi đọc giải.`,
      kind: 'drill',
      unitNumber,
      unitTitle,
      domain,
      count: medium,
      minutes: Math.max(10, Math.round(medium * 1.4)),
      instantSolution: true,
      slice: { from: easy, to: easy + medium },
      order: order++,
      difficulty: 'medium',
    },
  ];

  if (hard > 0) {
    sets.push({
      id: `${base}-hard`,
      title: 'Thử thách khó',
      blurb: `${hard} câu khó như module 2 đề thật: đoạn dày, nhiễu tinh.`,
      kind: 'drill',
      unitNumber,
      unitTitle,
      domain,
      count: hard,
      minutes: Math.max(10, Math.round(hard * 1.5)),
      instantSolution: true,
      slice: { from: easy + medium, to: total },
      order: order++,
      difficulty: 'hard',
    });
  }

  sets.push({
    id: `${base}-checkpoint`,
    title: 'Chốt kỹ năng',
    blurb: `Cả ${total} câu, dễ → khó, đúng nhịp đề thật, không lời giải giữa chừng.`,
    kind: 'checkpoint',
    unitNumber,
    unitTitle,
    domain,
    count: total,
    minutes: Math.max(12, Math.round(total * 1.1)),
    instantSolution: false,
    slice: null,
    order: order++,
    difficulty: 'mixed',
  });

  const extra = GENERATED_SETS[unitNumber];
  if (extra) {
    sets.push({
      id: `${base}-generated`,
      title: extra.title,
      blurb: extra.blurb,
      kind: 'generated',
      unitNumber,
      unitTitle,
      domain,
      count: extra.count,
      minutes: extra.minutes,
      instantSolution: true,
      slice: null,
      order: order++,
      difficulty: 'mixed',
    });
  }

  return sets;
}

function buildStages(): SatRwStage[] {
  let order = 0;

  return STAGE_SEEDS.map((seed) => ({
    id: seed.id,
    title: seed.title,
    blurb: seed.blurb,
    domain: seed.domain,
    units: seed.units.map((number) => {
      const meta = SAT_RW_UNITS.find((u) => u.unit === number);
      const title = meta?.title ?? `Unit ${number}`;
      const domain = meta?.domain ?? seed.domain;
      const sets = buildSets(number, title, domain, order);
      order += sets.length;
      return {
        number,
        title,
        domain,
        trap: TRAPS[number] ?? '',
        questionCount: questionsOfUnit(number).length,
        sets,
      };
    }),
  }));
}

export const SAT_RW_STAGES: SatRwStage[] = buildStages();

export const SAT_RW_ALL_SETS: SatRwExerciseSet[] = SAT_RW_STAGES.flatMap((s) =>
  s.units.flatMap((u) => u.sets),
);

export function getSatRwSet(id: string): SatRwExerciseSet | undefined {
  return SAT_RW_ALL_SETS.find((s) => s.id === id);
}

export function getSatRwUnitInCurriculum(number: number): SatRwCurriculumUnit | undefined {
  for (const stage of SAT_RW_STAGES) {
    const found = stage.units.find((u) => u.number === number);
    if (found) return found;
  }
  return undefined;
}

/**
 * Bộ nên làm tiếp, tính từ danh sách bộ ĐÃ XONG.
 *
 * Trả bộ chưa xong có `order` nhỏ nhất, chứ không trả "bộ ngay sau bộ vừa làm":
 * người học nhảy cóc xuống chặng 4 rồi quay lại thì vẫn phải được dẫn về chỗ
 * còn dở sớm nhất, không phải chỗ họ vừa rời.
 */
export function nextSatRwSet(doneIds: Iterable<string>): SatRwExerciseSet | null {
  const done = new Set(doneIds);
  const remaining = SAT_RW_ALL_SETS.filter((s) => !done.has(s.id)).sort((a, b) => a.order - b.order);
  return remaining[0] ?? null;
}

export const SAT_RW_CURRICULUM_TOTALS = {
  stages: SAT_RW_STAGES.length,
  units: SAT_RW_STAGES.reduce((n, s) => n + s.units.length, 0),
  sets: SAT_RW_ALL_SETS.length,
  questions: SAT_RW_QUESTIONS.length,
};
