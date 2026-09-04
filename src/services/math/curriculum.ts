import { generateMathSet } from './generator';
import { MATH_SKILL_DOMAIN } from '@/lib/math/types';
import type { MathDomain, MathItem, MathSkill } from '@/lib/math/types';
import type { MathSetKind } from '@/lib/math/theme';

/**
 * LỘ TRÌNH SAT MATH — giáo trình, không phải một kho đề rời.
 *
 * Vì sao cần lớp này: bộ sinh đề tạo được vô hạn câu, nhưng "vô hạn câu" không
 * phải là một chương trình học. Người mở app lên cần biết HÔM NAY LÀM BÀI NÀO
 * và làm xong thì tới bài gì — chứ không phải đứng trước 19 nút "Drill" giống
 * hệt nhau rồi tự nghĩ ra thứ tự.
 *
 * Cấu trúc ba tầng, đọc từ trên xuống:
 *
 *   CHẶNG (stage)  — một domain của đề thi, hoặc phần tổng ôn cuối
 *     BÀI HỌC (unit) — một kỹ năng, có tên tiếng Việt và một câu nói rõ bẫy
 *       BỘ ĐỀ (set)  — năm bước, xem `SETS_PER_UNIT`
 *
 * Năm bộ đề của một bài học KHÔNG phải năm bản sao khác số câu. Chúng khác nhau
 * ở ÁP LỰC THỜI GIAN và ở chỗ người học nên kỳ vọng gì: làm quen là để sai,
 * hai bộ luyện là để hiểu, bộ tốc độ là để quen đồng hồ, kiểm tra là để chốt.
 *
 * Mỗi bộ đề sinh lại từ hạt `<set id>:r<lượt>`, nên làm lại lần hai là đề khác
 * hẳn nhưng vẫn đúng kỹ năng ấy — không có chuyện học thuộc đáp án.
 */

export type MathExerciseSet = {
  id: string;
  /**
   * Tên nói MỤC TIÊU của bộ, không nhắc lại kiểu bài.
   *
   * Nhãn kiểu bài ("Khởi động") đã nằm ngay cạnh trên thẻ, nên đặt tiêu đề
   * trùng luôn với nó thì thẻ in ra "Khởi động Khởi động" — tốn một dòng mà
   * không thêm thông tin nào.
   */
  title: string;
  blurb: string;
  kind: MathSetKind;
  skills: MathSkill[];
  count: number;
  minutes: number;
  /** Vị trí trong toàn lộ trình — dùng để tìm "bài kế tiếp". */
  order: number;
  /** Bài học chứa bộ này. Ở tab Thư viện không có ngữ cảnh nào khác. */
  unitTitle: string;
  /** null khi bộ trải cả bốn domain (đề tổng hợp). */
  domain: MathDomain | null;
};

export type MathUnit = {
  id: string;
  /** Tên tiếng Việt, để nhìn là hình dung ra nội dung. */
  title: string;
  /** Tên College Board, để tra tài liệu tiếng Anh. */
  englishName: string;
  domain: MathDomain;
  skills: MathSkill[];
  /** Cái bẫy trung tâm của kỹ năng này, viết thành một câu. */
  trap: string;
  sets: MathExerciseSet[];
};

export type MathStage = {
  id: string;
  title: string;
  blurb: string;
  /** null với chặng tổng ôn — nó trộn cả bốn domain. */
  domain: MathDomain | null;
  units: MathUnit[];
};

type UnitSeed = {
  skill: MathSkill;
  title: string;
  englishName: string;
  trap: string;
};

const UNIT_SEEDS: UnitSeed[] = [
  // ------------------------------------------------------------- Algebra
  {
    skill: 'linear_equations_one_var',
    title: 'Phương trình bậc nhất một ẩn',
    englishName: 'Linear equations in one variable',
    trap: 'Hệ số ngoài ngoặc phải nhân với CẢ HAI số hạng bên trong — quên vế thứ hai là hỏng cả bài.',
  },
  {
    skill: 'linear_equations_two_var',
    title: 'Phương trình bậc nhất hai ẩn',
    englishName: 'Linear equations in two variables',
    trap: 'Giao trục tung thì cho x = 0, giao trục hoành thì cho y = 0. Đọc nhầm là ra đúng số nhưng sai câu hỏi.',
  },
  {
    skill: 'linear_functions',
    title: 'Hàm số bậc nhất',
    englishName: 'Linear functions',
    trap: 'Hệ số góc là Δy/Δx. Lật ngược thành Δx/Δy vẫn ra một số đẹp, nên rất khó tự phát hiện.',
  },
  {
    skill: 'systems_linear_two_var',
    title: 'Hệ hai phương trình',
    englishName: 'Systems of two linear equations',
    trap: 'Đề thường hỏi x + y chứ không hỏi riêng x. Giải ra x rồi khoanh luôn là mất điểm oan.',
  },
  {
    skill: 'linear_inequalities',
    title: 'Bất phương trình bậc nhất',
    englishName: 'Linear inequalities',
    trap: 'Chia hai vế cho số ÂM thì phải đổi chiều bất phương trình. Quên là tập nghiệm lật ngược hoàn toàn.',
  },
  // ------------------------------------------------------- Advanced Math
  {
    skill: 'equivalent_expressions',
    title: 'Biến đổi biểu thức tương đương',
    englishName: 'Equivalent expressions',
    trap: '(a + b)² KHÔNG phải a² + b². Số hạng giữa là 2ab, và nó là chỗ mất điểm phổ biến nhất domain này.',
  },
  {
    skill: 'nonlinear_equations',
    title: 'Phương trình bậc hai',
    englishName: 'Nonlinear equations and systems',
    trap: 'Phương trình bậc hai có HAI nghiệm. Đề hỏi nghiệm nào thì phải đọc kỹ, đừng lấy cái tìm ra trước.',
  },
  {
    skill: 'nonlinear_functions',
    title: 'Hàm phi tuyến & parabol',
    englishName: 'Nonlinear functions',
    trap: 'Đỉnh parabol nằm ở TRUNG ĐIỂM hai nghiệm — tính tổng rồi phải chia đôi, và hệ số a không tham gia.',
  },
  // --------------------------------- Problem-Solving and Data Analysis
  {
    skill: 'ratios_rates_units',
    title: 'Tỉ lệ, tốc độ và đổi đơn vị',
    englishName: 'Ratios, rates, proportions, and units',
    trap: 'Bẫy nằm ở ĐƠN VỊ chứ không ở phép tính. Tốc độ theo phút mà thời gian theo giờ là lệch 60 lần.',
  },
  {
    skill: 'percentages',
    title: 'Phần trăm',
    englishName: 'Percentages',
    trap: 'Phần trăm giảm tính trên giá GỐC. Cộng ngược phần trăm ấy vào giá đã giảm không bao giờ quay về đúng.',
  },
  {
    skill: 'one_var_data',
    title: 'Số liệu một biến: trung bình, trung vị',
    englishName: 'One-variable data: distributions and measures',
    trap: 'Đọc từ bảng tần số thì phải đếm theo TẦN SỐ, không đếm theo số dòng của bảng.',
  },
  {
    skill: 'two_var_data',
    title: 'Số liệu hai biến & scatterplot',
    englishName: 'Two-variable data: models and scatterplots',
    trap: 'Giá trị DỰ ĐOÁN đọc trên đường phù hợp nhất, không đọc trên điểm dữ liệu gần nhất.',
  },
  {
    skill: 'probability',
    title: 'Xác suất & bảng hai chiều',
    englishName: 'Probability and conditional probability',
    trap: '"Chọn trong số những người thuộc nhóm X" thu hẹp mẫu số về đúng hàng đó, không phải cả bảng.',
  },
  {
    skill: 'sample_inference',
    title: 'Suy luận từ mẫu & sai số biên',
    englishName: 'Inference from sample statistics',
    trap: 'Ước lượng từ mẫu luôn là một KHOẢNG, và nó nói về trung bình của tổng thể chứ không về từng cá nhân.',
  },
  {
    skill: 'statistical_claims',
    title: 'Đánh giá kết luận thống kê',
    englishName: 'Evaluating statistical claims',
    trap: 'Chỉ thí nghiệm có PHÂN NHÓM NGẪU NHIÊN mới kết luận nhân quả. Khảo sát quan sát thì chỉ nói được "có liên hệ".',
  },
  // ------------------------------------------ Geometry and Trigonometry
  {
    skill: 'area_volume',
    title: 'Diện tích & thể tích',
    englishName: 'Area and volume',
    trap: 'Khối lập phương có SÁU mặt. Chia 6 rồi mới khai căn ra cạnh, đừng dừng ở diện tích một mặt.',
  },
  {
    skill: 'lines_angles_triangles',
    title: 'Đường thẳng, góc, tam giác',
    englishName: 'Lines, angles, and triangles',
    trap: 'Góc bù cộng lại 180°, góc phụ cộng lại 90°. Nhầm hai khái niệm này là sai đúng một phép trừ.',
  },
  {
    skill: 'right_triangles_trig',
    title: 'Tam giác vuông & lượng giác',
    englishName: 'Right triangles and trigonometry',
    trap: 'sin lấy cạnh ĐỐI, cos lấy cạnh KỀ, cả hai chia cạnh HUYỀN. Đọc xem đề hỏi góc nào trước đã.',
  },
  {
    skill: 'circles',
    title: 'Đường tròn',
    englishName: 'Circles',
    trap: 'Vuông hoá xong vế phải là r BÌNH PHƯƠNG. Còn một bước khai căn nữa mới ra bán kính.',
  },
];

const STAGE_META: Array<{ id: string; domain: MathDomain; title: string; blurb: string }> = [
  {
    id: 'stage-algebra',
    domain: 'algebra',
    title: 'Chặng 1 · Đại số nền tảng',
    blurb:
      'Chiếm khoảng 35% số câu phần Math. Đây cũng là chặng phải chắc trước khi đi tiếp — mọi domain sau đều dùng lại kỹ thuật biến đổi ở đây.',
  },
  {
    id: 'stage-advanced',
    domain: 'advanced_math',
    title: 'Chặng 2 · Toán nâng cao',
    blurb:
      'Cũng khoảng 35% số câu, nhưng chỉ có ba kỹ năng — nên mỗi kỹ năng gặp lại nhiều lần trong một đề. Nắm chắc ba cái này là ăn được phần lớn nhóm câu khó.',
  },
  {
    id: 'stage-data',
    domain: 'problem_solving_data',
    title: 'Chặng 3 · Số liệu & tỉ lệ',
    blurb:
      'Bảy kỹ năng nhưng chỉ khoảng 15% số câu, nên mỗi kỹ năng thường chỉ gặp một câu. Bù lại phần lớn câu ở đây không khó tính toán — chúng khó ở chỗ đọc đúng đề.',
  },
  {
    id: 'stage-geometry',
    domain: 'geometry_trig',
    title: 'Chặng 4 · Hình học & lượng giác',
    blurb:
      'Khoảng 15% số câu. Nhiều câu không có hình vẽ, phải tự dựng ra trong đầu hoặc vẽ nháp — đó là kỹ năng riêng, luyện được.',
  },
];

/**
 * NĂM BƯỚC của một bài học. Mỗi bộ TỐI THIỂU 20 CÂU, và trục xuyên suốt chúng
 * là THỜI GIAN MỖI CÂU:
 *
 *   Làm quen      20 câu · 2,0 phút/câu   rộng rãi, để đọc kỹ và sai thoải mái
 *   Luyện cơ bản  20 câu · 1,7 phút/câu
 *   Luyện mở rộng 24 câu · 1,58 phút/câu  nhiều câu hơn, siết dần
 *   Luyện tốc độ  24 câu · 1,08 phút/câu  NHANH HƠN đề thật
 *   Chốt kỹ năng  20 câu · 1,5 phút/câu   đúng nhịp đề thật
 *
 * VÌ SAO TỐI THIỂU 20 CÂU: dưới ngưỡng đó thì kết quả không nói lên điều gì.
 * Làm 6 câu đúng 4 là 67%, nhưng sai thêm một câu đã tụt 17 điểm phần trăm — con
 * số nhảy quá mạnh để phân biệt "chưa nắm kỹ năng" với "hôm nay đọc hụt một
 * dòng". Hai mươi câu thì mỗi câu chỉ nặng 5 điểm phần trăm, và ngưỡng 70% mới
 * thành một cái mốc có nghĩa.
 *
 * Bước tốc độ cố ý gắt hơn cả bài kiểm tra đứng sau nó. Luyện quá tốc độ rồi
 * quay về nhịp thật là một nguyên tắc cũ của thể thao, và nó đúng ở đây vì phần
 * Math của SAT ép thời gian thật sự: 44 câu trong 70 phút. Người biết làm nhưng
 * chậm và người không biết làm cùng ra một kết quả trên bảng điểm — mà hai
 * chuyện ấy cần hai cách chữa khác hẳn nhau.
 *
 * `suffix` đi thẳng vào id bộ đề, nên ĐỔI TÊN LÀ MẤT TIẾN ĐỘ CŨ của người học.
 * Vì vậy `practice` giữ nguyên tên dù giờ nó là bước thứ hai trong năm.
 */
const SETS_PER_UNIT: Array<{
  suffix: string;
  kind: MathSetKind;
  title: string;
  blurb: string;
  count: number;
  minutes: number;
}> = [
  {
    suffix: 'warmup',
    kind: 'warmup',
    title: 'Làm quen dạng',
    blurb: '20 câu, thời gian rộng. Cứ sai — mục tiêu là nhận ra dạng bài và đọc kỹ từng đề.',
    count: 20,
    minutes: 40,
  },
  {
    suffix: 'practice',
    kind: 'practice',
    title: 'Luyện cơ bản',
    blurb: '20 câu, nhịp thong thả. Sai câu nào đọc lời giải câu đó ngay, đừng để dồn.',
    count: 20,
    minutes: 34,
  },
  {
    suffix: 'practice2',
    kind: 'practice',
    title: 'Luyện mở rộng',
    blurb: '24 câu, siết nhẹ thời gian. Bộ dài nhất của bài học — làm hết trong một hơi.',
    count: 24,
    minutes: 38,
  },
  {
    suffix: 'speed',
    kind: 'speed',
    title: 'Luyện tốc độ',
    blurb: '24 câu trong 26 phút — nhanh hơn đề thật. Chấp nhận sai vài câu, mục tiêu là quen áp lực.',
    count: 24,
    minutes: 26,
  },
  {
    suffix: 'checkpoint',
    kind: 'checkpoint',
    title: 'Chốt kỹ năng',
    blurb: '20 câu, đúng nhịp đề thật. Đúng từ 70% trở lên thì coi như xong kỹ năng này.',
    count: 20,
    minutes: 30,
  },
  {
    /*
      Bộ "thử thách" đi xa hơn nhịp đề thật một bậc: ít câu, rất ít thời gian.
      Mục tiêu không phải điểm cao mà là biết mình hỏng ở đâu khi bị dồn — có
      những lỗi chỉ xuất hiện lúc vội, và luyện ở nhịp thong thả không bao giờ
      lộ ra chúng.
    */
    suffix: 'challenge',
    kind: 'speed',
    title: 'Thử thách tốc độ',
    blurb:
      '20 câu trong 20 phút — đúng một phút một câu. Sai nhiều là bình thường; xem lại xem vội thì mình hỏng kiểu gì.',
    count: 20,
    minutes: 20,
  },
  {
    /*
      Hai bộ dưới đây KHÔNG phải bản sao thêm số câu.

      Bộ "ôn lại" tồn tại vì trí nhớ hoạt động theo kiểu quên rồi nhớ lại: làm
      đúng ngay sau khi vừa học xong chứng minh rất ít. Nó nằm SAU chốt kỹ năng
      và được viết để làm cách đó vài ngày — đúng lúc kiến thức đã mờ đi một
      nửa, tức là đúng lúc việc nhớ lại có giá trị.
    */
    suffix: 'retention',
    kind: 'practice',
    title: 'Ôn lại sau vài ngày',
    blurb:
      '20 câu, làm sau khi đã học sang bài khác vài hôm. Nhớ được lúc đã quên một nửa mới là nhớ thật.',
    count: 20,
    minutes: 30,
  },
];

function buildUnits(domain: MathDomain, startOrder: number): { units: MathUnit[]; nextOrder: number } {
  const seeds = UNIT_SEEDS.filter((u) => MATH_SKILL_DOMAIN[u.skill] === domain);
  let order = startOrder;

  const units = seeds.map((seed) => {
    const sets = SETS_PER_UNIT.map((template) => {
      const set: MathExerciseSet = {
        id: `${seed.skill}-${template.suffix}`,
        title: template.title,
        blurb: template.blurb,
        kind: template.kind,
        skills: [seed.skill],
        count: template.count,
        minutes: template.minutes,
        order,
        unitTitle: seed.title,
        domain,
      };
      order += 1;
      return set;
    });

    return {
      id: `unit-${seed.skill}`,
      title: seed.title,
      englishName: seed.englishName,
      domain,
      skills: [seed.skill],
      trap: seed.trap,
      sets,
    } satisfies MathUnit;
  });

  return { units, nextOrder: order };
}

function skillsOf(domain: MathDomain): MathSkill[] {
  return UNIT_SEEDS.filter((u) => MATH_SKILL_DOMAIN[u.skill] === domain).map((u) => u.skill);
}

const ALL_SKILLS: MathSkill[] = UNIT_SEEDS.map((u) => u.skill);

/**
 * Chặng cuối: ôn trộn rồi tới đề khổ thật.
 *
 * Tách riêng vì nó luyện một thứ khác hẳn bốn chặng trên. Bốn chặng kia dạy
 * TỪNG kỹ năng, còn ở đây đề không báo trước dạng — mà nhận ra "câu này hỏi
 * gì" chính là nửa việc trong phòng thi.
 */
function buildReviewStage(startOrder: number): MathStage {
  let order = startOrder;

  // Hai bộ mỗi mảng: một bộ vừa để ôn nhanh, một bộ dài để luyện sức bền trong
  // cùng một mảng trước khi bước sang đề trộn cả bốn.
  const mixedSets: MathExerciseSet[] = STAGE_META.flatMap((stage) => {
    const name = stage.title.split('· ')[1] ?? stage.title;
    const variants = [
      {
        suffix: '',
        label: name,
        count: 20,
        minutes: 36,
        blurb: 'Trộn mọi kỹ năng trong một mảng, không báo trước dạng nào.',
      },
      {
        suffix: '-long',
        label: `${name} · bộ dài`,
        count: 30,
        minutes: 50,
        blurb: '30 câu liền mạch trong cùng một mảng — luyện giữ tập trung qua một chặng dài.',
      },
    ];

    return variants.map((variant) => ({
      id: `mixed-${stage.domain}${variant.suffix}`,
      title: variant.label,
      blurb: variant.blurb,
      kind: 'mixed' as const,
      skills: skillsOf(stage.domain),
      count: variant.count,
      minutes: variant.minutes,
      order: order++,
      unitTitle: 'Ôn trộn theo mảng',
      domain: stage.domain,
    }));
  });

  const examSets: MathExerciseSet[] = Array.from({ length: 10 }, (_, i) => i + 1).map((index) => ({
    id: `exam-module-${index}`,
    title: `Đề số ${index}`,
    blurb: '22 câu, 35 phút, trộn cả bốn mảng đúng tỉ trọng đề thật.',
    kind: 'exam' as const,
    skills: ALL_SKILLS,
    count: 22,
    minutes: 35,
    order: order++,
    unitTitle: 'Đề khổ thật',
    domain: null,
  }));

  return {
    id: 'stage-review',
    domain: null,
    title: 'Chặng 5 · Tổng ôn & đề thi',
    blurb:
      'Bốn chặng trên dạy từng kỹ năng một, và người học luôn biết trước câu tiếp theo hỏi gì. Chặng này bỏ cái biết trước ấy đi.',
    units: [
      {
        id: 'unit-mixed',
        title: 'Ôn trộn theo domain',
        englishName: 'Mixed review by domain',
        domain: 'algebra',
        skills: ALL_SKILLS,
        trap: 'Khó nhất không phải phép tính mà là nhận ra câu đang hỏi kỹ năng nào.',
        sets: mixedSets,
      },
      {
        id: 'unit-exam',
        title: 'Đề khổ thật',
        englishName: 'Full-length modules',
        domain: 'advanced_math',
        skills: ALL_SKILLS,
        trap: 'Ở khổ 22 câu, mệt và mất tập trung là biến số thật — luyện sức bền cũng là luyện.',
        sets: examSets,
      },
    ],
  };
}

function buildCurriculum(): MathStage[] {
  const stages: MathStage[] = [];
  let order = 0;

  for (const meta of STAGE_META) {
    const { units, nextOrder } = buildUnits(meta.domain, order);
    order = nextOrder;
    stages.push({ id: meta.id, title: meta.title, blurb: meta.blurb, domain: meta.domain, units });
  }

  stages.push(buildReviewStage(order));
  return stages;
}

export const MATH_CURRICULUM: MathStage[] = buildCurriculum();

export const ALL_SETS: MathExerciseSet[] = MATH_CURRICULUM.flatMap((stage) =>
  stage.units.flatMap((unit) => unit.sets),
);

export const ALL_UNITS: MathUnit[] = MATH_CURRICULUM.flatMap((stage) => stage.units);

export function getSet(id: string): MathExerciseSet | undefined {
  return ALL_SETS.find((s) => s.id === id);
}

export function getUnitOfSet(setId: string): MathUnit | undefined {
  return ALL_UNITS.find((u) => u.sets.some((s) => s.id === setId));
}

/**
 * Chặng thứ mấy chứa bộ đề này (đếm từ 0), hoặc -1 nếu không tìm thấy.
 *
 * Dùng cho việc khoá theo gói: gói Free mở trọn chặng đầu, nên chỗ chặn chỉ cần
 * so chỉ số chặng chứ không cần biết gì về nội dung.
 */
export function stageIndexOfSet(setId: string): number {
  return MATH_CURRICULUM.findIndex((stage) =>
    stage.units.some((u) => u.sets.some((s) => s.id === setId)),
  );
}

export function getStageOfSet(setId: string): MathStage | undefined {
  return MATH_CURRICULUM.find((stage) =>
    stage.units.some((u) => u.sets.some((s) => s.id === setId)),
  );
}

/**
 * Sinh đề của một bộ.
 *
 * `round` là số lượt đã làm xong bộ này. Nhờ nó, làm lại lần hai ra đề khác hẳn
 * mà vẫn đúng kỹ năng — nếu hạt chỉ là id bộ thì người học làm lại sẽ gặp lại y
 * nguyên câu cũ và chỉ đang kiểm tra trí nhớ.
 */
export function buildSetItems(set: MathExerciseSet, round: number): MathItem[] {
  return generateMathSet({ skills: set.skills, count: set.count, seed: `${set.id}:r${round}` });
}

/** Bộ đề đầu tiên trong lộ trình chưa hoàn thành — chính là "học tiếp từ đây". */
export function findNextSet(doneSetIds: Set<string>): MathExerciseSet | null {
  return [...ALL_SETS].sort((a, b) => a.order - b.order).find((s) => !doneSetIds.has(s.id)) ?? null;
}

export const CURRICULUM_TOTALS = {
  stages: MATH_CURRICULUM.length,
  units: ALL_UNITS.length,
  sets: ALL_SETS.length,
  questions: ALL_SETS.reduce((sum, s) => sum + s.count, 0),
};
