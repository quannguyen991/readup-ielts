import type { ListeningTest } from '@/services/listening/types';

import band9T1 from './band9-t1.json';
import sampleS1 from './sample-s1.json';
import studentLifeAndTravel from './student-life-and-travel.json';
import mockListening02 from './mock-listening-02.json';
import band9Listening11 from './band9-listening-11.json';
import band9Listening12 from './band9-listening-12.json';
import band9Listening13 from './band9-listening-13.json';
import band9Listening14 from './band9-listening-14.json';
import band9Listening15 from './band9-listening-15.json';
import band9Listening16 from './band9-listening-16.json';
import band9Listening17 from './band9-listening-17.json';
import band9Listening18 from './band9-listening-18.json';
import band9Listening19 from './band9-listening-19.json';
import band9Listening20 from './band9-listening-20.json';
import { ORIGINAL_TOPIC_TESTS } from './original-topics';

/**
 * Kho đề Listening. THÊM ĐỀ: bỏ `<id>.json` vào thư mục này, rồi import và đưa
 * vào mảng dưới đây (bundler chỉ gom những tệp được import). `npm test` kiểm
 * toàn bộ tệp trong thư mục — kể cả tệp quên khai báo ở đây.
 */
/**
 * 40 đề khuôn `band9-topic-NN` (original-topics.ts): mỗi phần chỉ ~200 từ và cùng một khuôn,
 * nên bị tắt để không lặp kịch bản. Đặt `true` để bật lại; tệp và bộ sinh vẫn giữ nguyên.
 */
const SHOW_TEMPLATE_TOPICS = false;

export const LISTENING_TESTS: ListeningTest[] = [
  sampleS1 as ListeningTest,
  band9T1 as ListeningTest,
  studentLifeAndTravel as ListeningTest,
  mockListening02 as ListeningTest,
  band9Listening11 as ListeningTest,
  band9Listening12 as ListeningTest,
  band9Listening13 as ListeningTest,
  band9Listening14 as ListeningTest,
  band9Listening15 as ListeningTest,
  band9Listening16 as ListeningTest,
  band9Listening17 as ListeningTest,
  band9Listening18 as ListeningTest,
  band9Listening19 as ListeningTest,
  band9Listening20 as ListeningTest,
  ...(SHOW_TEMPLATE_TOPICS ? ORIGINAL_TOPIC_TESTS : []),
];

export function getListeningTest(id: string): ListeningTest | undefined {
  return LISTENING_TESTS.find((t) => t.id === id);
}
