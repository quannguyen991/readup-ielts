/** Stable IDs for original, reproducible SAT-style practice forms. */
export type SatPracticeMode = 'math' | 'reading-writing' | 'full';

export const SAT_PRACTICE_FORM_COUNT = 50;

export const SAT_PRACTICE_FORMS = Array.from({ length: SAT_PRACTICE_FORM_COUNT }, (_, index) => {
  const number = index + 1;
  return {
    number,
    id: `form-${String(number).padStart(2, '0')}`,
    label: `Đề ${String(number).padStart(2, '0')}`,
  } as const;
});

/** Same form + section always produces the same locally-authored variant. */
export function satPracticeSeed(formId: string, mode: SatPracticeMode): string {
  return `band9:${formId}:${mode}:v1`;
}
