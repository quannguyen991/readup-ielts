import { MATH_DOMAIN_STYLE, MATH_SET_KIND_STYLE, type MathSetKind } from '@/lib/math/theme';
import { MATH_ERROR_LABEL, type MathDomain, type MathErrorTag } from '@/lib/math/types';

/**
 * Nhãn SAT Math khi giao diện đang ở tiếng Anh.
 *
 * Bản tiếng Việt nằm ở `lib/math/theme.ts` và `lib/math/types.ts`; để nguyên ở
 * đó, dịch tại chỗ hiển thị. Tên kỹ năng / mảng (`MATH_SKILL_LABEL`,
 * `MATH_DOMAIN_LABEL`) vốn đã là tên College Board nên không cần bảng này.
 */
const DOMAIN_SHORT_EN: Record<MathDomain, string> = {
  algebra: 'Algebra',
  advanced_math: 'Advanced',
  problem_solving_data: 'Data',
  geometry_trig: 'Geometry',
};

const SET_KIND_EN: Record<MathSetKind, string> = {
  warmup: 'Warm-up',
  practice: 'Practice',
  speed: 'Speed',
  checkpoint: 'Checkpoint',
  mixed: 'Mixed review',
  exam: 'Full test',
};

const SET_KIND_PURPOSE_EN: Record<MathSetKind, string> = {
  warmup: 'A few short questions to get used to the format. Mistakes here are normal.',
  practice: 'The main set for this skill. Going slowly is fine, as long as you understand every step.',
  speed:
    'Same question types, with much less time than the real exam. Push past exam pace here so the clock feels roomy on test day.',
  checkpoint: 'Real exam pace. Pass this and you have this skill down.',
  mixed: 'Several skills mixed, with no warning of the type — just like the real exam.',
  exam: 'Exactly one real module: 22 questions, 35 minutes, all four domains mixed.',
};

const ERROR_LABEL_EN: Record<MathErrorTag, string> = {
  sign_flip: 'Sign error — moved a term across without flipping its sign, or multiplied by a negative and kept the sign.',
  solved_for_wrong_var: 'Solved for the other variable. The question asked for this one; you stopped at the other.',
  forgot_distribute: 'Forgot to distribute — the outside factor only multiplied one term inside the brackets.',
  moved_term_wrong_side: 'Moved a term to the wrong side, so the two sides were added instead of subtracted.',
  off_by_one: 'Off by one — usually from counting both ends or missing one end.',
  used_diameter_not_radius: 'Used the diameter where the radius belonged (or the other way round).',
  percent_of_wrong_base: 'Took the percent of the wrong base — the new number instead of the original.',
  percent_added_instead_of_multiplied:
    'Added percents directly instead of multiplying factors. Down 20% then up 20% does not get you back.',
  swapped_rise_run: 'Flipped the slope — used Δx/Δy instead of Δy/Δx.',
  confused_area_perimeter: 'Mixed up area and perimeter (or volume and surface area).',
  used_wrong_trig_ratio: 'Picked the wrong trig ratio — sin, cos and tan use different pairs of sides.',
  forgot_square_root: 'Stopped at the square and forgot the final square root.',
  inverted_fraction: 'Flipped the fraction — multiplied by the reciprocal when you should have multiplied directly.',
  dropped_unit_conversion: 'Forgot to convert units, so the number is right but the scale is wrong.',
  rounded_too_early: 'Rounded midway and kept going, so the error built up in the answer.',
  stopped_too_early: 'Solved correctly but stopped early — the question asks for one step further.',
  wrong_denominator:
    'Wrong denominator — divided by the wrong total, often the whole table when the question limits it to one group.',
  confused_mean_median: 'Mixed up mean, median and mode — three different numbers; use the one the question asks for.',
  swapped_slope_intercept: 'Swapped the slope and the y-intercept in y = mx + b.',
  dropped_a_solution: 'Missed a solution — a quadratic has two roots, and both need checking.',
  forgot_flip_inequality: 'Forgot to flip the inequality when multiplying or dividing both sides by a negative.',
  ignored_margin_of_error:
    'Treated a sample figure as the exact population value. Sample estimates always carry error — the conclusion must be a RANGE.',
  confused_correlation_causation:
    'Drew a causal conclusion from an observational study. Only experiments with RANDOM ASSIGNMENT support cause and effect.',
  expanded_without_middle_term: 'Expanded without the middle term — (x + a)² is not x² + a².',
  confused_supplementary_complementary: 'Mixed up supplementary (sum to 180°) and complementary (sum to 90°) angles.',
};

export function mathDomainShort(domain: MathDomain, en: boolean): string {
  return en ? DOMAIN_SHORT_EN[domain] : MATH_DOMAIN_STYLE[domain].short;
}

export function mathSetKindLabel(kind: MathSetKind, en: boolean): string {
  return en ? SET_KIND_EN[kind] : MATH_SET_KIND_STYLE[kind].label;
}

export function mathSetKindPurpose(kind: MathSetKind, en: boolean): string {
  return en ? SET_KIND_PURPOSE_EN[kind] : MATH_SET_KIND_STYLE[kind].purpose;
}

export function mathErrorLabel(tag: MathErrorTag, en: boolean): string {
  return en ? ERROR_LABEL_EN[tag] : MATH_ERROR_LABEL[tag];
}
