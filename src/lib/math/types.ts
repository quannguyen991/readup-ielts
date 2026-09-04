/**
 * Kiểu dữ liệu dùng chung cho module SAT Math.
 *
 * Mọi union ở đây phải khớp enum tương ứng trong
 * `supabase/migrations/20260821000100_math.sql`. `enum-parity.test.ts` giữ hai
 * bên không trôi khỏi nhau — cùng lý do đã ghi ở module Writing: sửa một bên
 * quên bên kia thì lỗi chỉ lộ ra khi thật sự nối Supabase.
 *
 * Tên domain và kỹ năng giữ nguyên cách gọi của College Board, cùng lý do đã
 * ghi trong `QUESTION_TYPE_LABEL`: người luyện tra tài liệu theo đúng tên ấy.
 */

export type MathDomain = 'algebra' | 'advanced_math' | 'problem_solving_data' | 'geometry_trig';

export type MathSkill =
  // ---- Algebra (~35% số câu của đề thật)
  | 'linear_equations_one_var'
  | 'linear_equations_two_var'
  | 'linear_functions'
  | 'systems_linear_two_var'
  | 'linear_inequalities'
  // ---- Advanced Math (~35%)
  | 'equivalent_expressions'
  | 'nonlinear_equations'
  | 'nonlinear_functions'
  // ---- Problem-Solving and Data Analysis (~15%)
  | 'ratios_rates_units'
  | 'percentages'
  | 'one_var_data'
  | 'two_var_data'
  | 'probability'
  | 'sample_inference'
  | 'statistical_claims'
  // ---- Geometry and Trigonometry (~15%)
  | 'area_volume'
  | 'lines_angles_triangles'
  | 'right_triangles_trig'
  | 'circles';

/** `grid_in` là student-produced response — người học tự gõ đáp án, không có lựa chọn. */
export type MathFormat = 'mcq' | 'grid_in';

export type MathDifficulty = 'easy' | 'medium' | 'hard';

/**
 * `diagnostic` chỉ làm một lần để dựng bản đồ điểm yếu, `lesson` là một bộ đề
 * trong lộ trình, `drill` luyện nhanh một kỹ năng ngoài lộ trình, `mock` mô
 * phỏng hai module của đề thật. Tách bốn chế độ ngay từ lược đồ vì cách đọc kết
 * quả khác hẳn nhau: một câu sai trong bài chẩn đoán là tín hiệu cần kiểm lại,
 * còn một câu sai trong bài kiểm tra cuối một unit là bằng chứng chưa qua.
 */
export type MathSessionMode = 'diagnostic' | 'lesson' | 'drill' | 'mock';

/**
 * Tên của LỖI làm ra đáp án nhiễu.
 *
 * Đây là thứ phân biệt module này với một bank đề thường: mỗi lựa chọn sai được
 * dựng từ đúng một sai lầm có tên, nên chọn nhầm đáp án nào thì màn Review gọi
 * được tên sai lầm đó thay vì chỉ báo "sai".
 *
 * Nhiễu nào không quy được về một lỗi cụ thể thì để `errorTag: null` — thà
 * không nói gì còn hơn gán cho người học một sai lầm họ không hề mắc.
 *
 * ĐỘ MỊN CỦA DANH SÁCH NÀY LÀ CÓ CHỦ Ý. Nhãn phải đủ THÔ để gộp thống kê được
 * ("bạn sai dấu 9 lần tháng này" mới là thông tin dùng được), còn phần riêng
 * của từng câu thì viết vào `note` của lựa chọn. Đặt một nhãn cho mỗi template
 * thì bảng thống kê chỉ là bảng liệt kê template, không nói lên điều gì.
 */
export type MathErrorTag =
  | 'sign_flip'
  | 'solved_for_wrong_var'
  | 'forgot_distribute'
  | 'moved_term_wrong_side'
  | 'off_by_one'
  | 'used_diameter_not_radius'
  | 'percent_of_wrong_base'
  | 'percent_added_instead_of_multiplied'
  | 'swapped_rise_run'
  | 'confused_area_perimeter'
  | 'used_wrong_trig_ratio'
  | 'forgot_square_root'
  | 'inverted_fraction'
  | 'dropped_unit_conversion'
  | 'rounded_too_early'
  | 'stopped_too_early'
  | 'wrong_denominator'
  | 'confused_mean_median'
  | 'swapped_slope_intercept'
  | 'dropped_a_solution'
  | 'forgot_flip_inequality'
  | 'ignored_margin_of_error'
  | 'confused_correlation_causation'
  | 'expanded_without_middle_term'
  | 'confused_supplementary_complementary';

export const MATH_DOMAIN_LABEL: Record<MathDomain, string> = {
  algebra: 'Algebra',
  advanced_math: 'Advanced Math',
  problem_solving_data: 'Problem-Solving and Data Analysis',
  geometry_trig: 'Geometry and Trigonometry',
};

export const MATH_SKILL_LABEL: Record<MathSkill, string> = {
  linear_equations_one_var: 'Linear equations in one variable',
  linear_equations_two_var: 'Linear equations in two variables',
  linear_functions: 'Linear functions',
  systems_linear_two_var: 'Systems of two linear equations',
  linear_inequalities: 'Linear inequalities',
  equivalent_expressions: 'Equivalent expressions',
  nonlinear_equations: 'Nonlinear equations and systems',
  nonlinear_functions: 'Nonlinear functions',
  ratios_rates_units: 'Ratios, rates, proportions, and units',
  percentages: 'Percentages',
  one_var_data: 'One-variable data: distributions and measures',
  two_var_data: 'Two-variable data: models and scatterplots',
  probability: 'Probability and conditional probability',
  sample_inference: 'Inference from sample statistics',
  statistical_claims: 'Evaluating statistical claims',
  area_volume: 'Area and volume',
  lines_angles_triangles: 'Lines, angles, and triangles',
  right_triangles_trig: 'Right triangles and trigonometry',
  circles: 'Circles',
};

export const MATH_SKILL_DOMAIN: Record<MathSkill, MathDomain> = {
  linear_equations_one_var: 'algebra',
  linear_equations_two_var: 'algebra',
  linear_functions: 'algebra',
  systems_linear_two_var: 'algebra',
  linear_inequalities: 'algebra',
  equivalent_expressions: 'advanced_math',
  nonlinear_equations: 'advanced_math',
  nonlinear_functions: 'advanced_math',
  ratios_rates_units: 'problem_solving_data',
  percentages: 'problem_solving_data',
  one_var_data: 'problem_solving_data',
  two_var_data: 'problem_solving_data',
  probability: 'problem_solving_data',
  sample_inference: 'problem_solving_data',
  statistical_claims: 'problem_solving_data',
  area_volume: 'geometry_trig',
  lines_angles_triangles: 'geometry_trig',
  right_triangles_trig: 'geometry_trig',
  circles: 'geometry_trig',
};

/**
 * Lời nhắc hiện ở màn Review khi người học chọn đúng cái nhiễu mang lỗi này.
 * Viết ở ngôi "bạn đã…" vì nó nói về thao tác vừa xảy ra, không phải định nghĩa.
 */
export const MATH_ERROR_LABEL: Record<MathErrorTag, string> = {
  sign_flip: 'Sai dấu — đổi vế mà quên đổi dấu, hoặc nhân số âm rồi giữ nguyên dấu.',
  solved_for_wrong_var: 'Giải ra ẩn kia. Đề hỏi ẩn này, bạn dừng lại ở ẩn còn lại.',
  forgot_distribute: 'Quên nhân phân phối — hệ số ngoài ngoặc mới nhân một số hạng trong ngoặc.',
  moved_term_wrong_side: 'Chuyển số hạng nhầm vế, nên hai vế cộng vào nhau thay vì trừ đi.',
  off_by_one: 'Lệch một đơn vị — thường do đếm cả hai đầu hoặc bỏ sót một đầu.',
  used_diameter_not_radius: 'Dùng đường kính vào chỗ đáng lẽ là bán kính (hoặc ngược lại).',
  percent_of_wrong_base: 'Lấy phần trăm trên sai gốc — phần trăm của số mới, không phải số ban đầu.',
  percent_added_instead_of_multiplied:
    'Cộng thẳng phần trăm thay vì nhân hệ số. Giảm 20% rồi tăng 20% không quay lại chỗ cũ.',
  swapped_rise_run: 'Đảo tử và mẫu của hệ số góc — lấy Δx/Δy thay vì Δy/Δx.',
  confused_area_perimeter: 'Nhầm diện tích với chu vi (hoặc thể tích với diện tích mặt).',
  used_wrong_trig_ratio: 'Chọn nhầm tỉ số lượng giác — sin, cos và tan lấy cặp cạnh khác nhau.',
  forgot_square_root: 'Dừng lại ở bình phương, quên bước khai căn cuối cùng.',
  inverted_fraction: 'Lật ngược phân số — nhân với nghịch đảo khi đáng lẽ nhân thẳng.',
  dropped_unit_conversion: 'Quên đổi đơn vị, nên số đúng nhưng thang đo sai.',
  rounded_too_early: 'Làm tròn giữa chừng rồi mới tính tiếp, nên sai số dồn vào đáp án.',
  stopped_too_early: 'Giải đúng nhưng dừng sớm — đề hỏi một bước xa hơn chỗ bạn dừng lại.',
  wrong_denominator: 'Sai mẫu số — chia cho tổng sai, thường là lấy tổng cả bảng khi đề chỉ giới hạn trong một nhóm.',
  confused_mean_median: 'Nhầm giữa trung bình, trung vị và mốt — ba số khác nhau, đề hỏi cái nào phải lấy đúng cái đó.',
  swapped_slope_intercept: 'Đảo hệ số góc với tung độ gốc trong y = mx + b.',
  dropped_a_solution: 'Bỏ sót nghiệm — phương trình bậc hai có hai nghiệm, và cả hai đều phải kiểm.',
  forgot_flip_inequality: 'Quên đổi chiều bất phương trình khi nhân hoặc chia hai vế cho số âm.',
  ignored_margin_of_error:
    'Coi số liệu mẫu là con số chính xác của cả tổng thể. Ước lượng từ mẫu luôn kèm sai số, kết luận phải là một KHOẢNG.',
  confused_correlation_causation:
    'Rút ra quan hệ nhân quả từ một nghiên cứu quan sát. Chỉ thí nghiệm có PHÂN NHÓM NGẪU NHIÊN mới kết luận nhân quả được.',
  expanded_without_middle_term: 'Khai triển thiếu số hạng giữa — (x + a)² không phải là x² + a².',
  confused_supplementary_complementary: 'Nhầm góc bù (cộng lại 180°) với góc phụ (cộng lại 90°).',
};

/**
 * Số hữu tỉ chính xác — TỬ và MẪU, không phải số thực.
 *
 * Đáp án SAT Math luôn hữu tỉ, mà `0.1 + 0.2 !== 0.3` trong dấu phẩy động thì
 * chấm bài sẽ oan. Giữ nguyên phân số tới lúc so sánh là hết chuyện.
 */
export type MathValue = { num: number; den: number };

export type MathChoice = {
  /** Markup toán inline — xem `src/lib/math/expr.ts`. */
  display: string;
  /** null với đáp án đúng, và với nhiễu không quy được về một lỗi có tên. */
  errorTag: MathErrorTag | null;
  /**
   * Giải thích riêng của lựa chọn này, khi cái sai quá đặc thù để đặt thành một
   * nhãn chung. Hiện kèm (hoặc thay) nhãn ở màn Review.
   *
   * Chia việc như vậy để hai thứ khác nhau không giẫm chân nhau: `errorTag` để
   * GỘP THỐNG KÊ qua nhiều câu, `note` để DẠY đúng câu này.
   */
  note?: string;
};

export type MathSolutionStep = {
  /** Lời giải thích bằng tiếng Việt — đây là phần dạy, không phải phần đề. */
  text: string;
  /** Dòng toán đi kèm, cũng là markup inline. Bỏ trống nếu bước này chỉ có lời. */
  expr?: string;
};

/**
 * Hình minh hoạ đi kèm đề.
 *
 * Bốn loại, đúng bằng số loại mà 19 template thật sự dùng tới. Nhiều kỹ năng
 * KHÔNG cần hình — phương trình đường tròn, thể tích, hệ phương trình đều là
 * câu chữ thuần — và đó là chuyện bình thường, đề thi thật cũng vậy. Thêm loại
 * hình nào thì thêm nhánh ở đây và một nhánh tương ứng trong `MathFigure.tsx`.
 */
export type RightTriangleFigure = {
  kind: 'right_triangle';
  /** Nhãn ba đỉnh. Đỉnh vuông luôn là phần tử giữa. */
  vertices: [string, string, string];
  /** Hai cạnh góc vuông: [kề đỉnh đầu, kề đỉnh cuối]. */
  legs: [number, number];
  hypotenuse: number;
  /** Cạnh đang hỏi — cạnh này để trống số trên hình, nếu không thì đề tự lộ đáp án. */
  unknown: 'leg0' | 'leg1' | 'hypotenuse';
  unit: string;
};

/**
 * Bảng số liệu — dùng cho cả bảng tần số một chiều lẫn bảng hai chiều.
 *
 * Một component cho hai việc vì chúng chỉ khác nhau ở số cột; tách ra thành hai
 * loại hình là chép cùng một đoạn vẽ bảng hai lần.
 */
export type DataTableFigure = {
  kind: 'data_table';
  caption: string;
  /** Tiêu đề các cột, kể cả cột nhãn đứng đầu. */
  columns: string[];
  rows: Array<{ label: string; cells: Array<string | number> }>;
  /** Hàng tổng, in đậm và kẻ vạch phía trên. */
  totalRow?: { label: string; cells: Array<string | number> };
};

export type ScatterplotFigure = {
  kind: 'scatterplot';
  caption: string;
  xLabel: string;
  yLabel: string;
  points: Array<{ x: number; y: number }>;
  /** Đường thẳng phù hợp nhất. Chỉ vẽ khi đề có nhắc tới nó. */
  line?: { slope: number; intercept: number };
  xRange: [number, number];
  yRange: [number, number];
};

/** Một trong bốn góc quanh một giao điểm. */
export type AngleCorner = 'upper_left' | 'upper_right' | 'lower_left' | 'lower_right';

export type ParallelLinesFigure = {
  kind: 'parallel_lines';
  /** Tên hai đường song song và tên cát tuyến. */
  lineLabels: [string, string];
  transversalLabel: string;
  /** Góc đã cho: nằm ở giao điểm nào, góc nào, và bằng bao nhiêu độ. */
  known: { line: 0 | 1; corner: AngleCorner; label: string; degrees: number };
  /** Góc đang hỏi — chỉ ghi tên, không ghi số. */
  asked: { line: 0 | 1; corner: AngleCorner; label: string };
};

export type MathFigureSpec =
  | RightTriangleFigure
  | DataTableFigure
  | ScatterplotFigure
  | ParallelLinesFigure;

type DraftBase = {
  /** Đề bài, tiếng Anh — đây là ngôn ngữ của kỳ thi. */
  stem: string;
  figure?: MathFigureSpec;
  steps: MathSolutionStep[];
};

export type McqDraft = DraftBase & {
  format: 'mcq';
  /**
   * Đúng bốn lựa chọn, ĐÃ trộn. Template tự dựng bằng `buildChoices()` chứ
   * không giao cho bộ sinh: chống trùng phải làm ở nơi biết GIÁ TRỊ, vì hai
   * cách viết khác nhau vẫn có thể là cùng một số.
   */
  choices: MathChoice[];
  correctIndex: number;
};

export type GridInDraft = DraftBase & {
  format: 'grid_in';
  answer: MathValue;
};

export type MathItemDraft = McqDraft | GridInDraft;

/**
 * Template sinh đề của một kỹ năng.
 *
 * `build` dựng THAM SỐ trước rồi tính đáp án từ chính tham số ấy, nên đề và đáp
 * án không thể lệch nhau — cùng nguyên tắc "ràng buộc bảo đảm bằng cấu trúc"
 * của bộ sinh biểu đồ Task 1.
 */
export type MathTemplate = {
  /** Định danh duy nhất, đi vào id câu nên đổi slug là mất khả năng tái lập câu cũ. */
  slug: string;
  skill: MathSkill;
  difficulty: MathDifficulty;
} & (
  | { format: 'mcq'; build: (rng: () => number) => McqDraft }
  | { format: 'grid_in'; build: (rng: () => number) => GridInDraft }
);

/** Một câu đã sinh xong, sẵn sàng hiển thị. */
export type MathItem = {
  /** `${templateSlug}:${seed}` — mở lại đúng id là ra đúng câu đó. */
  id: string;
  templateSlug: string;
  skill: MathSkill;
  domain: MathDomain;
  difficulty: MathDifficulty;
  format: MathFormat;
  stem: string;
  figure: MathFigureSpec | null;
  /** Bốn lựa chọn đã trộn. null với câu grid-in. */
  choices: MathChoice[] | null;
  /** Chỉ số đáp án đúng trong `choices`. null với câu grid-in. */
  correctIndex: number | null;
  /** Giá trị dùng để chấm câu grid-in. null với câu trắc nghiệm. */
  answerValue: MathValue | null;
  steps: MathSolutionStep[];
};
