import type { BilingualArticle } from './bilingual-repository';
import { ECONOMIST_ARTICLES } from './press/economist';
import { BBC_ARTICLES } from './press/bbc';
import { CNN_NYT_ARTICLES } from './press/cnn-nyt';
import { GUARDIAN_NATURE_ARTICLES } from './press/guardian-nature';

/**
 * 32 chuyên mục báo song ngữ chuẩn quốc tế (The Economist, BBC News & Future, CNN & The New York Times, The Guardian & Nature).
 * Mỗi bài viết đều có song ngữ đối chiếu đoạn - đoạn, bảng từ vựng chuyên sâu (IPA, collocation, example, derivative),
 * giải thích ngữ cảnh học thuật và câu hỏi đọc hiểu chuẩn IELTS Reading Academic.
 */
export const PRESS_ARTICLES: BilingualArticle[] = [
  ...ECONOMIST_ARTICLES,
  ...BBC_ARTICLES,
  ...CNN_NYT_ARTICLES,
  ...GUARDIAN_NATURE_ARTICLES,
];
