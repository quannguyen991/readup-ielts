import {
  MOCK_MODULE_LENGTH,
  MOCK_MODULE_MINUTES,
  buildMockModule,
  type MockModuleResult,
} from '@/services/math/mock';
import { estimateMathScore, routeSecondModule, type ModuleTier } from '@/services/math/scoring';
import type { MathItem } from '@/lib/math/types';

import {
  RW_MODULE_LENGTH,
  RW_MODULE_MINUTES,
  buildRwModule,
  routeRwSecondModule,
  type RwModuleResult,
} from './build';
import type { MockItem } from './item';
import { estimateRwScore, totalSatScore } from './scoring';

/**
 * Điều phối một bài thi SAT đầy đủ: R&W → nghỉ → Math → điểm tổng.
 *
 * ĐÂY LÀ MÁY TRẠNG THÁI, KHÔNG PHẢI MÀN HÌNH. Mọi luật của phòng thi nằm ở đây và
 * kiểm được bằng test thuần: đi một chiều, không quay lại module đã nộp, không
 * xem được điểm trước khi xong. Màn hình chỉ vẽ ra trạng thái mà máy này trả về —
 * luật nằm trong màn hình thì mỗi lần đổi giao diện là một lần luật có thể trôi.
 *
 * KHỔ ĐỀ SỐ HOÁ, tổng 134 phút:
 *
 *   R&W module 1   27 câu   32 phút
 *   R&W module 2   27 câu   32 phút   ← thích ứng theo module 1
 *   nghỉ                    10 phút
 *   Math module 1  22 câu   35 phút
 *   Math module 2  22 câu   35 phút   ← thích ứng theo module 1
 *
 * ĐIỂM CHỈ CỘNG Ở CUỐI, và cộng từ ĐIỂM chứ không từ số câu đúng: mỗi phần có
 * trần riêng tuỳ module 2 đã đi hướng nào, nên gộp số câu rồi mới quy đổi sẽ ra
 * một con số không có thật.
 */

export const BREAK_MINUTES = 10;

/**
 * HAI CON SỐ THỜI GIAN, và lẫn chúng là nói sai về đề thi.
 *
 * College Board quảng cáo đề số hoá là "2 giờ 14 phút" — đó là 134 phút LÀM BÀI,
 * không tính giờ nghỉ. Ngồi trong phòng thì 144 phút. Một màn hình ghi "134 phút"
 * rồi đếm ngược cả giờ nghỉ sẽ hết giờ sớm mười phút; ghi "144 phút" thì lệch với
 * mọi tài liệu người học từng đọc.
 *
 * Nên khai cả hai, đặt tên rõ, và để chỗ dùng chọn đúng cái nó cần.
 */
export const FULL_TEST_TESTING_MINUTES = RW_MODULE_MINUTES * 2 + MOCK_MODULE_MINUTES * 2;

export const FULL_TEST_ELAPSED_MINUTES = FULL_TEST_TESTING_MINUTES + BREAK_MINUTES;

export const FULL_TEST_QUESTIONS = RW_MODULE_LENGTH * 2 + MOCK_MODULE_LENGTH * 2;

export type FullStage =
  | { kind: 'rw'; module: 1 | 2; items: MockItem[]; minutes: number }
  | { kind: 'break'; minutes: number }
  | { kind: 'math'; module: 1 | 2; items: MathItem[]; minutes: number }
  | { kind: 'result' };

export type SectionProgress = {
  module1: RwModuleResult | null;
  module2: RwModuleResult | null;
  tier: ModuleTier | null;
};

export type FullTestState = {
  seed: string;
  stage: FullStage;
  rw: SectionProgress;
  math: SectionProgress;
  /** Câu của module R&W 1, giữ lại để module 2 không lấy trùng. */
  rwModule1Ids: string[];
};

function emptySection(): SectionProgress {
  return { module1: null, module2: null, tier: null };
}

export function startFullTest(seed: string): FullTestState {
  const m = buildRwModule(seed, 1, 'mixed');
  return {
    seed,
    stage: { kind: 'rw', module: 1, items: m.items, minutes: m.minutes },
    rw: emptySection(),
    math: emptySection(),
    rwModule1Ids: m.items.map((i) => i.id),
  };
}

/**
 * Nộp module đang làm và đi tiếp.
 *
 * KHÔNG CÓ ĐƯỜNG LÙI. Hàm chỉ nhận trạng thái hiện tại và kết quả, rồi trả về
 * trạng thái SAU — không có tham số nào cho phép quay lại. Đề số hoá cũng vậy:
 * nộp module 1 là không mở lại được, vì module 2 được chọn dựa trên kết quả ấy.
 *
 * Nộp khi đang ở màn nghỉ hoặc màn kết quả là lỗi gọi sai, và hàm trả về nguyên
 * trạng thái cũ thay vì ném — màn hình bấm nhầm hai lần không nên làm sập bài thi.
 */
export function submitModule(state: FullTestState, result: RwModuleResult): FullTestState {
  const { seed, stage } = state;

  if (stage.kind === 'rw' && stage.module === 1) {
    const tier = routeRwSecondModule(result.correct, result.total);
    const m = buildRwModule(seed, 2, tier, new Set(state.rwModule1Ids));
    return {
      ...state,
      stage: { kind: 'rw', module: 2, items: m.items, minutes: m.minutes },
      rw: { ...state.rw, module1: result, tier },
    };
  }

  if (stage.kind === 'rw' && stage.module === 2) {
    return {
      ...state,
      stage: { kind: 'break', minutes: BREAK_MINUTES },
      rw: { ...state.rw, module2: result },
    };
  }

  if (stage.kind === 'math' && stage.module === 1) {
    const tier = routeSecondModule(result.correct, result.total);
    return {
      ...state,
      stage: { kind: 'math', module: 2, items: buildMockModule(seed, 2, tier), minutes: MOCK_MODULE_MINUTES },
      math: { ...state.math, module1: result, tier },
    };
  }

  if (stage.kind === 'math' && stage.module === 2) {
    return { ...state, stage: { kind: 'result' }, math: { ...state.math, module2: result } };
  }

  return state;
}

/** Hết giờ nghỉ — hoặc người học bấm bỏ qua. */
export function endBreak(state: FullTestState): FullTestState {
  if (state.stage.kind !== 'break') return state;
  return {
    ...state,
    stage: { kind: 'math', module: 1, items: buildMockModule(state.seed, 1, 'mixed'), minutes: MOCK_MODULE_MINUTES },
  };
}

export type FullTestScore = {
  readingWriting: number;
  math: number;
  total: number;
};

/**
 * Điểm cuối. `null` khi bài chưa xong — KHÔNG trả điểm tạm.
 *
 * Trả một con số giữa chừng nghe có vẻ tử tế, nhưng nó sai: trần điểm của mỗi
 * phần phụ thuộc module 2 đã đi hướng nào, mà module 2 thì chưa làm. Một con số
 * sai đưa ra đúng lúc người học đang lo là thứ họ sẽ nhớ và tin.
 */
export function fullTestScore(state: FullTestState): FullTestScore | null {
  const { rw, math } = state;
  if (!rw.module2 || !math.module2 || !rw.tier || !math.tier) return null;

  /*
    Điểm tính trên TOÀN PHẦN (cả hai module cộng lại), với trần lấy theo module 2.
    Đề thật cũng chấm cả phần chứ không chấm từng module rời.
  */
  const rwCorrect = (rw.module1?.correct ?? 0) + rw.module2.correct;
  const rwTotal = (rw.module1?.total ?? 0) + rw.module2.total;
  const mathCorrect = (math.module1?.correct ?? 0) + math.module2.correct;
  const mathTotal = (math.module1?.total ?? 0) + math.module2.total;

  const readingWriting = estimateRwScore(rwCorrect, rwTotal, rw.tier);
  const mathScore = estimateMathScore(mathCorrect, mathTotal, math.tier);

  return {
    readingWriting,
    math: mathScore,
    total: totalSatScore(readingWriting, mathScore),
  };
}

/** Nhãn ngắn cho thanh tiến độ: "Reading and Writing · phần 2 trên 4". */
export function stageLabel(stage: FullStage): string {
  switch (stage.kind) {
    case 'rw':
      return `Reading and Writing — Module ${stage.module}`;
    case 'break':
      return 'Break';
    case 'math':
      return `Math — Module ${stage.module}`;
    case 'result':
      return 'Results';
  }
}

/** Thứ tự chặng, để vẽ thanh tiến độ. Màn nghỉ không tính là một chặng làm bài. */
export function stageIndex(stage: FullStage): number {
  switch (stage.kind) {
    case 'rw':
      return stage.module;
    case 'break':
      return 2;
    case 'math':
      return 2 + stage.module;
    case 'result':
      return 4;
  }
}

export const TOTAL_STAGES = 4;
