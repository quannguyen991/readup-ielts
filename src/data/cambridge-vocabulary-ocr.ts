import seed from './seed/vocab-cambridge/ocr-additions.json';

export type CambridgeOcrSection = 'Listening' | 'Reading' | 'Writing' | 'Speaking';
export type CambridgeOcrEvidenceRef = {
  book: number;
  test: number | null;
  section: CambridgeOcrSection | null;
  page: number | null;
  pageQuestionRangeContext?: string | null;
  source: string;
  evidence?: 'cached-source-page-text' | 'standalone-pdf-ocr-cache' | 'standalone-pdf-text-layer';
  matchedTerm?: string;
};

export type CambridgeOcrVocabularyTerm = {
  id: string;
  term: string;
  lemma: string | null;
  normalized: string;
  variants: string[];
  dictionary: {
    ipa: string | null;
    partOfSpeech: string | null;
    definitionEn: string | null;
    meaningVi: string | null;
    paraphrases: string[];
    collocation: string | null;
  } | null;
  tags: string[];
  priority: 'high' | 'useful' | 'extended';
  confidence: number | null;
  references: {
    readingPassages: Array<{ book: number; test: number; passage: number; source: string }>;
    curatedExamLists: Array<{ book: number; test: number; section: CambridgeOcrSection; page: number | null; source: string }>;
    curatedLexicons: Array<{ source: string; topic: string; topicName: string }>;
    cachedPageText: CambridgeOcrEvidenceRef[];
    standalonePdfOcr: CambridgeOcrEvidenceRef[];
    standalonePdfText: CambridgeOcrEvidenceRef[];
  };
};

type CambridgeOcrIndex = {
  schemaVersion: number;
  source: string;
  termCount: number;
  groups: Array<{ book: number; section: CambridgeOcrSection; termIds: string[] }>;
  terms: CambridgeOcrVocabularyTerm[];
};

const INDEX = seed as unknown as CambridgeOcrIndex;
const TERM_BY_ID = new Map(INDEX.terms.map((term) => [term.id, term]));
const GROUP_BY_KEY = new Map(INDEX.groups.map((group) => [`${group.book}:${group.section}`, group]));
const SECTION_ORDER: CambridgeOcrSection[] = ['Listening', 'Reading', 'Writing', 'Speaking'];

export const CAMBRIDGE_OCR_ADDITION_COUNT = INDEX.termCount;

export function getCambridgeOcrSections(book: number): CambridgeOcrSection[] {
  return SECTION_ORDER.filter((section) => GROUP_BY_KEY.has(`${book}:${section}`));
}

export function getCambridgeOcrVocabulary(book: number, section: CambridgeOcrSection): CambridgeOcrVocabularyTerm[] {
  const group = GROUP_BY_KEY.get(`${book}:${section}`);
  if (!group) return [];
  return group.termIds
    .map((id) => TERM_BY_ID.get(id))
    .filter((term): term is CambridgeOcrVocabularyTerm => !!term);
}

export function getCambridgeOcrVocabularyForBook(book: number): Array<{
  section: CambridgeOcrSection;
  terms: CambridgeOcrVocabularyTerm[];
}> {
  return getCambridgeOcrSections(book).map((section) => ({
    section,
    terms: getCambridgeOcrVocabulary(book, section),
  }));
}
