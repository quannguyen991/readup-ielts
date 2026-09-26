import { SAT_RW_BASE_QUESTIONS } from '@/data/sat-rw-repository';
import { hashString, mulberry32 } from '@/services/questions/rng';
import { buildEvidenceItem, EVIDENCE_SLUGS } from '@/services/sat-rw/evidence/generate';
import { allSynthesisItems } from '@/services/sat-rw/synthesis/generate';
import { buildVocabItem, scanCandidates } from '@/services/sat-rw/vocab/generate';

import { difficultyOf, type RwDifficulty } from './difficulty';
import {
  fromEvidence,
  fromRepository,
  fromSynthesis,
  fromVocab,
  type MockDomain,
  type MockItem,
} from './item';

/**
 * Lắp một module SAT Reading and Writing đúng khổ đề thật.
 *
 * ĐỀ SỐ HOÁ CÓ HAI MODULE, MỖI MODULE 27 CÂU / 32 PHÚT, và module 2 thích ứng
 * theo kết quả module 1. Bộ này dựng một module; `startMock`/`continueMock` nối
 * hai module lại, đúng khuôn `services/math/mock.ts` đã dùng — hai phần thi đối
 * xứng thì ghép bài thi đầy đủ mới gọn.
 *
 * TỈ LỆ MẢNG BÁM BLUEPRINT CỦA COLLEGE BOARD, không bám hình dạng kho câu. Kho
 * nghiêng hẳn về ngữ pháp (192/384), nên lấy theo kho sẽ ra một đề nửa ngữ pháp —
 * làm xong không nói lên được gì về sức thi thật.
 */

export const RW_MODULE_LENGTH = 27;
export const RW_MODULE_MINUTES = 32;
export const RW_TOTAL_QUESTIONS = RW_MODULE_LENGTH * 2;

/**
 * Số câu mỗi mảng trong một module.
 *
 * Cộng lại đúng 27. Tỉ lệ lấy từ đặc tả của College Board cho đề số hoá; con số
 * chính xác mỗi kỳ thi có xê dịch, nên đây là tỉ lệ trung tâm chứ không phải một
 * bảng cố định của một đề cụ thể.
 */
export const RW_BLUEPRINT: Record<MockDomain, number> = {
  'Information and Ideas': 7,
  'Craft and Structure': 8,
  'Expression of Ideas': 5,
  'Standard English Conventions': 7,
};

export type ModuleTier = 'easier' | 'harder';

/**
 * Trọng số chọn câu theo bậc khó.
 *
 * Module 1 lấy hỗn hợp; module 2 nghiêng về một phía. Không cấm tuyệt đối bậc
 * kia: một module toàn câu khó thì người vừa làm tốt module 1 vẫn có thể trắng
 * tay, và một module toàn câu dễ thì không đo được gì ở phía trên.
 */
const WEIGHT: Record<ModuleTier | 'mixed', Record<RwDifficulty, number>> = {
  mixed: { easy: 1, medium: 1.4, hard: 1 },
  easier: { easy: 2.4, medium: 1.2, hard: 0.3 },
  harder: { easy: 0.3, medium: 1.2, hard: 2.4 },
};

/**
 * Toàn bộ câu dùng được, từ cả bốn nguồn.
 *
 * Dựng một lần rồi dùng lại: quét kho bài đọc cho câu Từ trong ngữ cảnh là việc
 * nặng, và gọi lại nó cho mỗi module sẽ làm màn thi thử đứng hình.
 */
let cached: MockItem[] | null = null;

export function rwPool(): MockItem[] {
  if (cached) return cached;

  const items: MockItem[] = [
    // Chỉ kho gốc: đề đã gieo hạt phải giữ nguyên khi kho luyện tập lớn thêm.
    ...SAT_RW_BASE_QUESTIONS.map(fromRepository),
    ...scanCandidates().map(buildVocabItem).map(fromVocab),
    ...allSynthesisItems().map(fromSynthesis),
  ];

  /*
    Câu Command of Evidence sinh theo yêu cầu chứ không có sẵn trong kho — nó là
    nguồn DUY NHẤT không giới hạn, nên lấy đủ để mảng Information and Ideas không
    bao giờ là nút thắt. Hạt giống cố định để cùng một bộ đề ra cùng những câu ấy.
  */
  for (let i = 0; i < 90; i += 1) {
    const slug = EVIDENCE_SLUGS[i % EVIDENCE_SLUGS.length]!;
    const item = buildEvidenceItem(slug, `pool-${i}`);
    if (item) items.push(fromEvidence(item));
  }

  cached = items;
  return items;
}

/** Chỉ để test dọn trạng thái giữa các lượt. */
export function __resetPool(): void {
  cached = null;
}

/**
 * Bốc `count` câu từ `pool` theo trọng số bậc khó, không lấy trùng.
 *
 * Bốc có trọng số bằng cách nhân bản thì tốn bộ nhớ và lệch khi trọng số lẻ. Ở
 * đây mỗi câu được gán một khoá ngẫu nhiên chia cho trọng số rồi sắp tăng dần —
 * câu trọng số cao có khoá nhỏ hơn nên lên trước, mà vẫn còn ngẫu nhiên.
 */
function pickWeighted(
  pool: MockItem[],
  count: number,
  tier: ModuleTier | 'mixed',
  rng: () => number,
): MockItem[] {
  const scored = pool.map((item) => {
    const w = WEIGHT[tier][difficultyOf(item)];
    return { item, key: -Math.log(Math.max(rng(), 1e-9)) / Math.max(w, 1e-9) };
  });
  scored.sort((a, b) => a.key - b.key);
  return scored.slice(0, count).map((s) => s.item);
}

export type RwModule = {
  index: 1 | 2;
  tier: ModuleTier | 'mixed';
  items: MockItem[];
  minutes: number;
};

export function buildRwModule(
  seed: string,
  index: 1 | 2,
  tier: ModuleTier | 'mixed',
  exclude: ReadonlySet<string> = new Set(),
): RwModule {
  const rng = mulberry32(hashString(`rw-mock:${seed}:m${index}:${tier}`));
  const pool = rwPool().filter((i) => !exclude.has(i.id));

  const items: MockItem[] = [];
  for (const [domain, want] of Object.entries(RW_BLUEPRINT) as [MockDomain, number][]) {
    const domainPool = pool.filter((i) => i.domain === domain);
    items.push(...pickWeighted(domainPool, want, tier, rng));
  }

  /*
    Trộn thứ tự SAU KHI đã bốc đủ mỗi mảng. Không trộn thì đề đi thành từng khối
    mảng — làm hết bảy câu ngữ pháp liên tiếp thì tới câu thứ ba đã biết đang bị
    hỏi gì, và đó không phải cách đề thật xếp câu.
  */
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }

  return { index, tier, items, minutes: RW_MODULE_MINUTES };
}

/* ------------------------------------------------------------- luồng làm bài */

export type RwModuleResult = { correct: number; total: number };

export type RwProgress =
  | { stage: 'module1'; module: RwModule }
  | { stage: 'module2'; module: RwModule; module1: RwModuleResult };

export function startRwMock(seed: string): RwProgress {
  return { stage: 'module1', module: buildRwModule(seed, 1, 'mixed') };
}

export function continueRwMock(seed: string, module1Items: MockItem[], result: RwModuleResult): RwProgress {
  const tier = routeRwSecondModule(result.correct, result.total);
  /*
    LOẠI HẲN CÂU CỦA MODULE 1 khỏi module 2. Gặp lại một câu vừa làm cách đó nửa
    tiếng thì câu ấy không còn đo gì — nó đo trí nhớ ngắn hạn.
  */
  const used = new Set(module1Items.map((i) => i.id));
  return { stage: 'module2', module: buildRwModule(seed, 2, tier, used), module1: result };
}

/**
 * Ngưỡng chuyển module.
 *
 * Dùng đúng con số của bên Math để hai phần thi cư xử như nhau. Đề thật không
 * công bố ngưỡng; 60% là con số được nhắc tới nhiều nhất trong tài liệu luyện
 * thi, và mọi chỗ hiển thị phải nói rõ đây là phỏng theo.
 */
export const RW_ROUTING_THRESHOLD = 0.6;

export function routeRwSecondModule(correct: number, total: number): ModuleTier {
  if (total <= 0) return 'easier';
  return correct / total >= RW_ROUTING_THRESHOLD ? 'harder' : 'easier';
}
