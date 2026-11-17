import type {
  WritingSample,
  WritingSampleEssayKind,
  WritingSampleParagraph,
  WritingSampleSection,
} from '@/data/writing-samples';

export type TidTask2SentencePair = {
  en: string;
  vi: string;
};

export type TidTask2Paragraph = {
  section: string;
  words: number;
  sentences: TidTask2SentencePair[];
};

/** Raw shape stored in `task2.json`; kept separate from the app's paragraph model. */
export type TidTask2Record = {
  source: string;
  sourceUrl: string;
  task: 2;
  topic: string;
  sampleId: number;
  type: string;
  prompt: string;
  words: number;
  sentences: number;
  paragraphs: TidTask2Paragraph[];
};

/** A WritingSample-compatible record that retains each licensed source sentence pair. */
export type TidTask2WritingSampleParagraph = WritingSampleParagraph & {
  sourceSection: string;
  sourceWords: number;
  sourceSentences: TidTask2SentencePair[];
};

export type TidTask2WritingSample = Omit<WritingSample, 'paragraphs'> & {
  paragraphs: TidTask2WritingSampleParagraph[];
  sourceName: string;
  sourceUrl: string;
  sourceTopic: string;
  sourceSampleId: number;
  sourceEssayType: string;
  bandLabel: 'Band 8.0';
  sourceWordCount: number;
  sourceSentenceCount: number;
};

const SECTION_MAP: Record<string, WritingSampleSection> = {
  'MỞ BÀI': 'introduction',
  'THÂN BÀI 1': 'body1',
  'THÂN BÀI 2': 'body2',
  'KẾT BÀI': 'conclusion',
};

const SECTION_FOCUS: Record<WritingSampleSection, string> = {
  introduction: 'Giới thiệu chủ đề và nêu lập trường của người viết.',
  overview: 'Tóm tắt các ý chính.',
  body1: 'Trình bày lập luận ở thân bài thứ nhất.',
  body2: 'Phát triển lập luận ở thân bài thứ hai.',
  conclusion: 'Tóm tắt lập trường và kết luận.',
};

const TOPIC_LABELS: Record<string, { en: string; vi: string }> = {
  education: { en: 'Education', vi: 'Giáo dục' },
  environment: { en: 'Environment', vi: 'Môi trường' },
  health: { en: 'Health', vi: 'Sức khỏe' },
  family: { en: 'Family', vi: 'Gia đình' },
  food: { en: 'Food', vi: 'Thực phẩm' },
  shopping: { en: 'Shopping', vi: 'Mua sắm' },
  'social-media': { en: 'Social media', vi: 'Truyền thông xã hội' },
  technology: { en: 'Technology', vi: 'Công nghệ' },
  travel: { en: 'Travel', vi: 'Du lịch' },
  work: { en: 'Work', vi: 'Công việc' },
  'urban-life': { en: 'Urban life', vi: 'Đời sống đô thị' },
  transport: { en: 'Transport', vi: 'Giao thông' },
  culture: { en: 'Culture', vi: 'Văn hóa' },
  crime: { en: 'Crime', vi: 'Tội phạm' },
  hobbies: { en: 'Hobbies', vi: 'Sở thích' },
};

export function adaptTidTask2Record(record: TidTask2Record): TidTask2WritingSample {
  const id = `tid-t2-${toSlug(record.topic)}-${record.sampleId}`;
  const topic = TOPIC_LABELS[record.topic.toLowerCase()] ?? {
    en: toTopicName(record.topic),
    vi: toTopicName(record.topic),
  };

  return {
    id,
    task: 'ielts_task2',
    topicSlug: toSlug(record.topic),
    topicEn: topic.en,
    topicVi: topic.vi,
    title: `${topic.en} · The IELTS Dictionary #${record.sampleId}`,
    promptText: record.prompt,
    promptId: `w-tid-${toSlug(record.topic)}-${record.sampleId}`,
    essayKind: toEssayKind(record.type, record.prompt),
    band: 8.0,
    bandLabel: 'Band 8.0',
    sourceName: record.source,
    sourceUrl: record.sourceUrl,
    sourceTopic: record.topic,
    sourceSampleId: record.sampleId,
    sourceEssayType: record.type,
    sourceWordCount: record.words,
    sourceSentenceCount: record.sentences,
    paragraphs: record.paragraphs.map((sourceParagraph, index) => {
      const section = sectionFromSource(sourceParagraph.section) ?? fallbackSection(index);
      const sourceSentences = sourceParagraph.sentences.map((sentence) => ({
        en: sentence.en,
        vi: sentence.vi,
      }));

      return {
        id: `${id}-p${index + 1}`,
        section,
        en: sourceSentences.map((sentence) => sentence.en).join(' '),
        vi: sourceSentences.map((sentence) => sentence.vi).join(' '),
        focusVi: SECTION_FOCUS[section],
        sourceSection: sourceParagraph.section,
        sourceWords: sourceParagraph.words,
        sourceSentences,
      };
    }),
    vocabulary: [],
  };
}

function sectionFromSource(sourceSection: string): WritingSampleSection | undefined {
  const normalized = sourceSection.trim().toLocaleUpperCase();
  const known = SECTION_MAP[normalized];
  if (known) return known;
  if (/THÂN BÀI\s*1(?:\D|$)/.test(normalized)) return 'body1';
  if (/THÂN BÀI\s*\d+/.test(normalized)) return 'body2';
  if (/INTRODUCTION|MỞ BÀI/.test(normalized)) return 'introduction';
  if (/CONCLUSION|KẾT BÀI/.test(normalized)) return 'conclusion';
  return undefined;
}

export function adaptTidTask2Records(records: TidTask2Record[]): TidTask2WritingSample[] {
  return records.map(adaptTidTask2Record);
}

function toEssayKind(type: string, prompt: string): WritingSampleEssayKind {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes('discuss')) return 'discussion';
  if (normalizedType.includes('advantage')) return 'advantage_disadvantage';
  if (normalizedType.includes('problem') || normalizedType.includes('solution')) return 'problem_solution';
  if (normalizedType.includes('two-part') || normalizedType.includes('two part')) return 'two_part';

  const normalized = prompt.toLowerCase();
  if (normalized.includes('discuss both')) return 'discussion';
  if (/advantages? outweigh|advantages and disadvantages/.test(normalized)) return 'advantage_disadvantage';
  if (/causes?|reasons?|solutions?|measures?/.test(normalized)) return 'problem_solution';
  if (/two-part|two part|\bwhat\b.*\band\b.*\bwhy\b/.test(normalized)) return 'two_part';
  return 'opinion';
}

function fallbackSection(index: number): WritingSampleSection {
  return (['introduction', 'body1', 'body2', 'conclusion'] as const)[index] ?? 'body2';
}

function toSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function toTopicName(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}
