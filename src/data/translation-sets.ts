import SEED_SETS from './seed/translation-sets/index.json';
import {
  SENTENCE_TOPIC_LABEL,
  TRANSLATION_SENTENCES,
  type SentenceDifficulty,
  type SentenceTopic,
  type TranslationItem,
} from './sentence-drills';

/**
 * Bộ đề Dịch câu — gom 100 câu sẵn có thành các bài theo CHỦ ĐỀ.
 *
 * Vì sao gom lại chứ không viết mới: 100 câu này đã có đáp án mẫu, gợi ý cấu
 * trúc, và cả bảng `SENTENCE_ENRICHMENT` (cách diễn đạt khác + từ vựng) soạn
 * riêng cho từng câu. Viết 100 câu mới nghĩa là bỏ hết phần đó rồi soạn lại từ
 * đầu, đổi lấy đúng một thứ: cái nhãn "bài mới". Gom theo chủ đề cho ngay cái
 * người dùng thật sự cần — chọn được bài mình muốn thay vì bốc ngẫu nhiên.
 *
 * Trong mỗi bài, câu xếp DỄ TRƯỚC KHÓ SAU. Người học vào một chủ đề lạ cần vài
 * câu ngắn để quen từ vựng của chủ đề ấy trước khi gặp câu nhiều mệnh đề.
 */

export type TranslationSet = {
  id: string;
  order: number;
  /** Chủ đề, dùng luôn nhãn tiếng Việt sẵn có của kho câu. */
  title: string;
  topic: SentenceTopic;
  blurb: string;
  /** Độ khó trội nhất trong bài — dùng cho bộ lọc. */
  level: SentenceDifficulty;
  items: TranslationItem[];
};

const DIFFICULTY_RANK: Record<SentenceDifficulty, number> = { easy: 0, medium: 1, hard: 2 };

const BLURB: Record<SentenceTopic, string> = {
  education: 'Câu về học hành, thi cử và cách người ta nói về việc học.',
  environment: 'Câu về khí hậu, rác thải và những việc làm được ở quy mô nhỏ.',
  technology: 'Câu về thiết bị, mạng và cách công nghệ đổi thói quen thường ngày.',
  health: 'Câu về sức khoẻ, giấc ngủ và những lời khuyên hay gặp.',
  work: 'Câu về công việc, đồng nghiệp và cách sắp xếp thời gian.',
  society: 'Câu về đời sống chung, thói quen và những thay đổi trong xã hội.',
  travel: 'Câu về đi lại, chuyến đi và những gì gặp trên đường.',
  media: 'Câu về báo chí, mạng xã hội và cách tin tức lan đi.',
  family: 'Câu về gia đình, người thân và những việc trong nhà.',
  economy: 'Câu về giá cả, chi tiêu và cách người ta nói về tiền.',
};

/** Độ khó trội nhất; hoà thì lấy mức cao hơn để không hứa dễ hơn thực tế. */
function dominantLevel(items: TranslationItem[]): SentenceDifficulty {
  const count: Record<SentenceDifficulty, number> = { easy: 0, medium: 0, hard: 0 };
  for (const item of items) count[item.difficulty] += 1;
  return (['hard', 'medium', 'easy'] as SentenceDifficulty[]).reduce((best, level) =>
    count[level] > count[best] ? level : best,
  'easy');
}

function build(): TranslationSet[] {
  const byTopic = new Map<SentenceTopic, TranslationItem[]>();
  for (const item of TRANSLATION_SENTENCES) {
    const list = byTopic.get(item.topic) ?? [];
    list.push(item);
    byTopic.set(item.topic, list);
  }

  const sets: TranslationSet[] = [];
  for (const [topic, items] of byTopic) {
    const sorted = [...items].sort(
      (a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] || a.id.localeCompare(b.id),
    );
    sets.push({
      id: `tset-${topic}`,
      order: 0,
      title: SENTENCE_TOPIC_LABEL[topic],
      topic,
      blurb: BLURB[topic],
      level: dominantLevel(sorted),
      items: sorted,
    });
  }

  sets.push(...seeded());

  // Xếp bài dễ lên trước, rồi mới đánh số — cùng lý do như thứ tự câu trong bài.
  sets.sort(
    (a, b) => DIFFICULTY_RANK[a.level] - DIFFICULTY_RANK[b.level] || a.title.localeCompare(b.title, 'vi'),
  );
  return sets.map((set, i) => ({ ...set, order: i + 1 }));
}

/**
 * Bốn mươi bộ soạn thêm, nạp từ seed.
 *
 * Vì sao KHÔNG nhét vào `TRANSLATION_SENTENCES` như 100 câu gốc: 100 câu gốc mang
 * theo cả `SENTENCE_ENRICHMENT` (cách diễn đạt khác + từ vựng) soạn tay cho từng
 * câu, và chúng bị ràng vào union `SentenceTopic` chỉ có 10 giá trị. Bốn mươi bộ
 * mới có chủ đề riêng, hẹp hơn hẳn ("Chỉ đường", "Thuê nhà"), nên bắt chúng đội
 * lốt một trong 10 chủ đề cũ chỉ để lọt qua kiểu dữ liệu là nói dối cho tiện.
 *
 * `topic` vẫn phải điền vì lịch sử luyện tập thống kê theo trục đó — nên mỗi bộ
 * mới được gán chủ đề GẦN NHẤT trong 10 chủ đề cũ. Đây là ánh xạ có mất mát, và
 * nó chỉ dùng cho thống kê, không dùng để hiển thị: người học luôn thấy tên thật
 * của bài.
 */
const SEED_TOPIC: Record<string, SentenceTopic> = {
  'daily-routine': 'society', 'home-chores': 'family', shopping: 'economy',
  'weather-talk': 'environment', directions: 'travel', 'food-cooking': 'health',
  'pets-animals': 'society', 'clothes-style': 'society', 'phone-messages': 'technology',
  neighbours: 'society', 'school-day': 'education', hobbies: 'society',
  'body-health': 'health', 'time-plans': 'society',
  'money-habits': 'economy', 'city-traffic': 'society', 'jobs-interview': 'work',
  'online-life': 'technology', 'sports-fitness': 'health', 'music-film': 'media',
  'travel-plans': 'travel', 'housing-rent': 'society', 'study-abroad': 'education',
  volunteering: 'society', 'food-culture': 'health', 'shopping-online': 'economy',
  friendship: 'family', 'city-vs-country': 'society', 'time-management': 'work',
  festivals: 'society',
  'ai-and-jobs': 'technology', 'climate-policy': 'environment', 'public-health': 'health',
  'urban-planning': 'society', 'education-reform': 'education', 'privacy-data': 'technology',
  'ageing-society': 'society', 'cultural-heritage': 'society', inequality: 'society',
  'science-funding': 'education',
};

type SeedSet = {
  slug: string;
  title: string;
  blurb: string;
  level: SentenceDifficulty;
  items: { id: string; difficulty: SentenceDifficulty; vi: string; en: string; hint: string }[];
};

function seeded(): TranslationSet[] {
  return (SEED_SETS as SeedSet[]).map((s) => {
    const topic = SEED_TOPIC[s.slug] ?? 'society';
    return {
      id: `tset-${s.slug}`,
      order: 0,
      title: s.title,
      topic,
      blurb: s.blurb,
      level: s.level,
      items: s.items.map((it) => ({ ...it, topic })),
    };
  });
}

export const TRANSLATION_SETS: TranslationSet[] = build();

export function getTranslationSet(id: string): TranslationSet | undefined {
  return TRANSLATION_SETS.find((s) => s.id === id);
}

export const TRANSLATION_SET_LEVELS: SentenceDifficulty[] = [
  ...new Set(TRANSLATION_SETS.map((s) => s.level)),
];

export function filterTranslationSets(filters: { level?: string } = {}): TranslationSet[] {
  const { level = 'all' } = filters;
  return TRANSLATION_SETS.filter((s) => level === 'all' || s.level === level);
}

export function translationSetStats() {
  return {
    sets: TRANSLATION_SETS.length,
    sentences: TRANSLATION_SETS.reduce((n, s) => n + s.items.length, 0),
  };
}
