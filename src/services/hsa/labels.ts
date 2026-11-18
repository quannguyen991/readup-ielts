import { HSA_KIND_LABEL, HSA_TOPICS, type HsaQuestionKind } from '@/data/hsa';
import type { Bi } from '@/i18n/useL';
import { CRITERIA } from './criteria';

/** Tên hiển thị của một lượt làm bài, đọc từ mã hoạt động mà bộ chạy bài ghi lại. */
export function activityTitle(activity: string): Bi {
  const [head, rest = ''] = activity.split(':');
  switch (head) {
    case 'placement': {
      const c = CRITERIA.find((x) => x.id === rest);
      return c ? { vi: `Test đầu vào · ${c.title.vi}`, en: `Entry test · ${c.title.en}` } : { vi: 'Test đầu vào', en: 'Entry test' };
    }
    case 'mock': {
      const n = rest.replace('form-', '').padStart(2, '0');
      return { vi: `Đề mô phỏng ${n}`, en: `Practice paper ${n}` };
    }
    case 'practice': {
      const label = HSA_KIND_LABEL[rest as HsaQuestionKind];
      return label ?? { vi: 'Luyện theo dạng câu', en: 'Question-type practice' };
    }
    case 'topic': {
      const t = HSA_TOPICS.find((x) => x.id === rest);
      return t ? { vi: `Chủ điểm: ${t.title.vi}`, en: `Topic: ${t.title.en}` } : { vi: 'Ôn theo chủ điểm', en: 'Topic review' };
    }
    case 'diagnostic':
      return { vi: 'Chẩn đoán nhanh', en: 'Quick diagnostic' };
    case 'challenge':
      return { vi: 'Thử thách suy luận', en: 'Reasoning challenge' };
    case 'review':
      return { vi: 'Chữa lại câu đã sai', en: 'Fixing missed questions' };
    default:
      return { vi: 'Luyện tập HSA', en: 'HSA practice' };
  }
}

export function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
