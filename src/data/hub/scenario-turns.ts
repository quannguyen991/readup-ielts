import type { RoleplayOption, RoleplayStep } from '@/services/hub/roleplay';

/** Một cách đáp. Tách riêng để dữ liệu kịch bản ngắn và dễ đọc. */
export const o = (text: string, good: boolean, tip: string): RoleplayOption => ({ text, good, tip });

/**
 * Một lượt: câu của đối phương, cách đáp tốt và hai cách chưa tối ưu.
 * `at` là vị trí của cách tốt (0, 1 hoặc 2). Vị trí được xoay vòng giữa các lượt để người học
 * không đoán đáp án theo vị trí.
 */
export const turn = (ai: string, good: RoleplayOption, bad: [RoleplayOption, RoleplayOption], at: number): RoleplayStep => {
  const options = [...bad];
  options.splice(at, 0, good);
  return { ai, options };
};
