export type TestSection = 'Listening' | 'Reading' | 'Writing' | 'Speaking';
export type SourcePage = { page: number; text: string; reviewLines?: { confidence: number; original: string }[]; imageAsset?: string; imageWidth?: number; imageHeight?: number };
export type ExamPart = { id: number; label: string; questionStart: number; questionEnd: number; pages: SourcePage[]; recommendedMinutes?: number; minimumWords?: number };
export type SourceTest = {
  id: string; title: string; source: string; section?: TestSection;
  questionCount?: number; answerMode?: 'short' | 'long'; responseLabels?: string[];
  pages: SourcePage[]; supportPages: SourcePage[]; parts?: ExamPart[];
  answerKey?: Record<string, string | string[]>; answerKeyVerified?: boolean;
  pdfAsset?: string; sourceStartPage?: number; sourceUrl?: string;
  audioFiles?: string[]; audioCloudUrl?: string; externalOnly?: boolean;
  contentVerified?: boolean; missingComponents?: string[]; sourceCheckedAt?: string;
};

export const SECTION_ORDER: TestSection[] = ['Listening', 'Reading', 'Writing', 'Speaking'];
export const SECTION_MINUTES: Record<TestSection, number> = { Listening: 30, Reading: 60, Writing: 60, Speaking: 14 };
export const EXPECTED_PARTS: Record<TestSection, number> = { Listening: 4, Reading: 3, Writing: 2, Speaking: 3 };

export function canonicalSourceTestId(id: string): string {
  if (id.startsWith('iot-')) return id;
  return id.replace(/^cambridge-ielts-/, 'cambridge-').replace(/-academic-/, '-')
    .replace(/^(cambridge-\d+)-test-(\d+)$/, '$1-reading-$2')
    .replace(/-(reading|listening|writing|speaking)-test-/, '-$1-')
    .replace(/^vol-(\d+)-key-reading-/, 'vol-$1-reading-');
}

export function sourceVolume(source: string): number {
  return Number(source.match(/(?:cambridge\s*(?:ielts\s*)?|vol(?:ume)?\s*)(\d+)/i)?.[1] ?? 0);
}

export function compareSourceTests(a: { id: string; source: string; section?: string }, b: { id: string; source: string; section?: string }): number {
  const group = (s: string) => /cambridge/i.test(s) ? 0 : /vol/i.test(s) ? 1 : 2;
  return group(a.source) - group(b.source)
    || sourceVolume(b.source) - sourceVolume(a.source)
    || Number(a.id.match(/(?:test-)?(\d+)$/)?.[1] ?? 0) - Number(b.id.match(/(?:test-)?(\d+)$/)?.[1] ?? 0)
    || SECTION_ORDER.indexOf(a.section as TestSection) - SECTION_ORDER.indexOf(b.section as TestSection)
    || a.id.localeCompare(b.id);
}

/** Split at source headings, including headings that share a printed page. */
export function buildExamParts(pages: SourcePage[], section: TestSection): ExamPart[] {
  const pattern = section === 'Reading' ? /(?:READING\s*(?:READING\s*)?PASSAGE|(?:^|\n)\s*SECTION)\s*([123])/gi
    : section === 'Writing' ? /WRITING\s*(?:WRITING\s*)?TASK\s*([12])/gi
    : /\b(?:SECTION|PART)\s*([1-4])\b/gi;
  const markers: { part: number; pageIndex: number; offset: number }[] = [];
  for (const [pageIndex, page] of pages.entries()) {
    for (const match of page.text.matchAll(pattern)) {
      const part = Number(match[1]);
      if (part === markers.length + 1 && part <= EXPECTED_PARTS[section]) markers.push({ part, pageIndex, offset: match.index! });
    }
  }
  return markers.map((marker, index) => {
    const next = markers[index + 1];
    const selected = pages.slice(marker.pageIndex, (next?.pageIndex ?? pages.length - 1) + 1).map((page, i) => ({
      ...page,
      text: page.text.slice(i === 0 ? marker.offset : 0, next && marker.pageIndex + i === next.pageIndex ? next.offset : undefined).trim(),
    })).filter((page) => page.text.length > 0);
    const heading = selected.map((p) => p.text).join('\n').slice(0, 650);
    // Scanned books sometimes OCR “Questions 1–13” as “Questions113”.
    const range = heading.match(/Questions?\s*(?:(\d{1,2})\s*[-–—]+\s*(\d{1,2})|(\d{3,4}))/i);
    const compactRange = range?.[3];
    const readingStart = compactRange ? Number(compactRange.slice(0, compactRange.length - 2)) : Number(range?.[1] ?? 0);
    const start = section === 'Listening' ? (marker.part - 1) * 10 + 1 : section === 'Reading'
      ? marker.part === 1 ? 1 : readingStart : marker.part;
    return {
      id: marker.part, label: `${section === 'Reading' ? 'Reading Passage' : section === 'Writing' ? 'Task' : 'Part'} ${marker.part}`,
      questionStart: start, questionEnd: section === 'Listening' ? marker.part * 10 : section === 'Reading' ? 40 : marker.part,
      pages: selected, recommendedMinutes: section === 'Reading' ? 20 : section === 'Writing' ? marker.part === 1 ? 20 : 40 : undefined,
      minimumWords: section === 'Writing' ? marker.part === 1 ? 150 : 250 : undefined,
    };
  }).map((part, i, parts) => ({ ...part, questionEnd: section === 'Reading' && parts[i + 1] ? parts[i + 1]!.questionStart - 1 : part.questionEnd }));
}

export function hasCompleteKey(test: SourceTest): boolean {
  return Boolean(test.answerKeyVerified && (test.section === 'Reading' || test.section === 'Listening')
    && Array.from({ length: 40 }, (_, i) => test.answerKey?.[String(i + 1)]).every((answer) => Array.isArray(answer) ? answer.some((s) => s.trim()) : typeof answer === 'string' && answer.trim()));
}

/**
 * Bỏ các dòng "Vị trí trong bài: …" đã bị lẫn vào nội dung bài đọc khi nhập dữ liệu.
 * Đó là chú thích đáp án: để nguyên thì đề làm bài lộ luôn câu trả lời.
 */
export function stripEvidenceNotes(text: string): string {
  return text.replace(/(^|\n\n)Vị trí trong bài:[^\n]*(?=\n\n|$)/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

function cleanDeep<T>(value: T): T {
  if (typeof value === 'string') return stripEvidenceNotes(value) as T;
  if (Array.isArray(value)) return value.map((v) => cleanDeep(v)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, cleanDeep(v)])) as T;
  }
  return value;
}

/** Gom các chú thích "Vị trí trong bài: …" trước khi xoá khỏi bài: đây là bằng chứng để giải thích đáp án sau khi nộp. */
export function collectEvidenceNotes(value: unknown): string[] {
  const out: string[] = [];
  const walk = (v: unknown): void => {
    if (typeof v === 'string') {
      for (const m of v.matchAll(/Vị trí trong bài:[^\n]*/g)) out.push(m[0].trim());
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v as Record<string, unknown>).forEach(walk);
  };
  walk(value);
  return out;
}

export function prepareSourceTest(raw: SourceTest): SourceTest {
  const evidenceNotes = collectEvidenceNotes(raw.pages ?? []).concat(collectEvidenceNotes(raw.parts ?? []));
  const test = { ...cleanDeep(raw), evidenceNotes } as SourceTest & { evidenceNotes: string[] };
  const parts = test.parts ?? (test.section ? buildExamParts(test.pages, test.section) : []);
  const missing = [...(test.missingComponents ?? [])];
  if (test.section && parts.length !== EXPECTED_PARTS[test.section]) missing.push('parts');
  if (test.section === 'Listening' && !test.audioFiles?.length && !test.audioCloudUrl) missing.push('audio');
  return { ...test, parts, missingComponents: [...new Set(missing)], answerKeyVerified: hasCompleteKey(test) };
}
