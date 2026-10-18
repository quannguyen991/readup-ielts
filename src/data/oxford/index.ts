/**
 * Bộ từ Oxford của app. Đây là danh sách do app biên soạn theo tần suất và trình độ
 * thường gặp, KHÔNG phải bản chính thức của Oxford University Press. Nếu dùng cho thi
 * cử, cần đối chiếu lại với bản chính thức.
 */
import { OXFORD_3000_A1 } from './oxford-3000-a1';
import { OXFORD_3000_A1_2 } from './oxford-3000-a1-2';
import { OXFORD_3000_A1_3 } from './oxford-3000-a1-3';
import { OXFORD_3000_A2 } from './oxford-3000-a2';
import { OXFORD_3000_A2_2 } from './oxford-3000-a2-2';
import { OXFORD_3000_A2_3 } from './oxford-3000-a2-3';
import { OXFORD_3000_B1 } from './oxford-3000-b1';
import { OXFORD_3000_B1_2 } from './oxford-3000-b1-2';
import { OXFORD_3000_B1_3 } from './oxford-3000-b1-3';
import { OXFORD_3000_B1_4 } from './oxford-3000-b1-4';
import { OXFORD_3000_B1_5 } from './oxford-3000-b1-5';
import { OXFORD_3000_B1_6 } from './oxford-3000-b1-6';
import { OXFORD_3000_B2 } from './oxford-3000-b2';
import { OXFORD_3000_B2_2 } from './oxford-3000-b2-2';
import { OXFORD_3000_B2_3 } from './oxford-3000-b2-3';
import { OXFORD_ADV_B2_1 } from './oxford-adv-b2-1';
import { OXFORD_ADV_B2_2 } from './oxford-adv-b2-2';
import { OXFORD_ADV_B2_3 } from './oxford-adv-b2-3';
import { OXFORD_ADV_B2_4 } from './oxford-adv-b2-4';
import { OXFORD_ADV_C1_1 } from './oxford-adv-c1-1';
import { OXFORD_ADV_C1_2 } from './oxford-adv-c1-2';
import { OXFORD_ADV_C1_3 } from './oxford-adv-c1-3';
import { OXFORD_ADV_C1_4 } from './oxford-adv-c1-4';
import { OXFORD_ADV_C1_5 } from './oxford-adv-c1-5';
import { OXFORD_EXTRA_A1 } from './extra-a1';
import { OXFORD_EXTRA_A2 } from './extra-a2';
import { OXFORD_EXTRA_B1 } from './extra-b1';
import { OXFORD_EXTRA_B2 } from './extra-b2';
import { OXFORD_EXTRA_C1 } from './extra-c1';
import { OXFORD_EXTRA_FILL } from './extra-fill';
import type { OxfordEntry } from './types';

export { OXFORD_TOPICS } from './types';
export type { OxfordEntry, OxfordLevel } from './types';

/** Oxford 3000: từ cốt lõi, A1 → B2. */
export const OXFORD_3000: OxfordEntry[] = [
  ...OXFORD_3000_A1,
  ...OXFORD_3000_A1_2,
  ...OXFORD_3000_A1_3,
  ...OXFORD_3000_A2,
  ...OXFORD_3000_A2_2,
  ...OXFORD_3000_A2_3,
  ...OXFORD_3000_B1,
  ...OXFORD_3000_B1_2,
  ...OXFORD_3000_B1_3,
  ...OXFORD_3000_B1_4,
  ...OXFORD_3000_B1_5,
  ...OXFORD_3000_B1_6,
  ...OXFORD_3000_B2,
  ...OXFORD_3000_B2_2,
  ...OXFORD_3000_B2_3,
];

/** Oxford 5000 nâng cao: 2000 từ mở rộng ngoài Oxford 3000, B2 → C1. */
export const OXFORD_ADVANCED: OxfordEntry[] = [
  ...OXFORD_ADV_B2_1,
  ...OXFORD_ADV_B2_2,
  ...OXFORD_ADV_B2_3,
  ...OXFORD_ADV_B2_4,
  ...OXFORD_ADV_C1_1,
  ...OXFORD_ADV_C1_2,
  ...OXFORD_ADV_C1_3,
  ...OXFORD_ADV_C1_4,
  ...OXFORD_ADV_C1_5,
];

/** Từ bổ sung theo cấp × chủ đề (để mỗi bài học đủ số từ). Không nằm trong hai bộ trên. */
export const OXFORD_EXTRA: OxfordEntry[] = [
  ...OXFORD_EXTRA_A1,
  ...OXFORD_EXTRA_A2,
  ...OXFORD_EXTRA_B1,
  ...OXFORD_EXTRA_B2,
  ...OXFORD_EXTRA_C1,
  ...OXFORD_EXTRA_FILL,
];
