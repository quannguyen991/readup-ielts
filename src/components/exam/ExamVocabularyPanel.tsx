import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useL } from '@/i18n/useL';
import { useVocabStore } from '@/store/useVocabStore';

export type ExamTextPage = { page: number; text: string };
export type ExamVocabularyItem = {
  term: string;
  lemma: string;
  category: 'word' | 'collocation' | 'summary_phrase';
  partOfSpeech: string;
  meaningEn: string;
  meaningVi: string;
  synonyms: string[];
  sourceSentence: string;
  page: number;
};
type Analysis = { summaryVi: string; items: ExamVocabularyItem[] };

const CATEGORY_LABELS = {
  word: { vi: 'Từ vựng nội dung', en: 'Content vocabulary' },
  collocation: { vi: 'Collocation', en: 'Collocation' },
  summary_phrase: { vi: 'Cụm diễn đạt ý chính', en: 'Summary phrase' },
} as const;

export function ExamVocabularyPanel({
  exam,
  title,
  pages,
  ocrReviewCount = 0,
}: {
  exam: 'ielts' | 'sat';
  title: string;
  pages: ExamTextPage[];
  ocrReviewCount?: number;
}) {
  const { L } = useL();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const entries = useVocabStore((s) => s.entries);
  const saveWord = useVocabStore((s) => s.saveWord);
  const safePages = useMemo(() => pages.filter((p) => p.text.trim()).slice(0, 8), [pages]);
  const totalChars = safePages.reduce((sum, page) => sum + page.text.length, 0);

  const saveExtractedWords = (items: ExamVocabularyItem[]) => {
    const seenLemmas = new Set(Object.values(entries).map((entry) => entry.lemma.trim().toLowerCase()));
    let added = 0;
    for (const item of items) {
      const lemma = item.lemma.trim().toLowerCase();
      if (!lemma || seenLemmas.has(lemma)) continue;
      seenLemmas.add(lemma);
      const sourcePage = safePages.find((page) => page.page === item.page);
      saveWord({
        word: item.term,
        lemma,
        phonetic: null,
        partOfSpeech: item.partOfSpeech || (item.category === 'word' ? null : 'phrase'),
        definitionContext: item.meaningEn,
        definitionGeneral: item.meaningEn,
        definitionVi: item.meaningVi,
        exampleSentence: item.sourceSentence,
        sourceSentence: item.sourceSentence,
        articleId: null,
        articleTitle: `${title} · ${L(`trang ${sourcePage?.page ?? item.page}`, `page ${sourcePage?.page ?? item.page}`)}`,
        paragraphIndex: null,
        isCollocation: item.category !== 'word',
        synonyms: item.synonyms,
      });
      added += 1;
    }
    setSavedCount(added);
    setDuplicateCount(items.length - added);
  };

  const analyze = async () => {
    if (loading || !safePages.length) return;
    setLoading(true);
    setError('');
    setExpanded(true);
    try {
      const response = await fetch('/api/exam/vocabulary', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ exam, title, pages: safePages }),
      });
      const result = await response.json() as Analysis & { error?: string };
      if (!response.ok) throw new Error(result.error || L('Chưa phân tích được đoạn này.', 'Could not analyze this passage.'));
      saveExtractedWords(result.items);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : L('Có lỗi khi phân tích.', 'Analysis failed.'));
    } finally {
      setLoading(false);
    }
  };

  if (!safePages.length || totalChars < 70) return null;

  return (
    <View style={{ marginTop: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E6DACB', borderRadius: 13, backgroundColor: '#F3F0FB' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={{ paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#2B2350' }}>{L('Học từ ngay trong bài đọc', 'Learn vocabulary from this passage')}</Text>
          <Text style={{ fontSize: 11, color: '#766858' }}>{L('Trích cả từ dễ lẫn khó có nghĩa · collocations · cụm tóm tắt · synonyms', 'Extracts useful easy and difficult words · collocations · summary phrases · synonyms')}</Text>
        </View>
        <Text style={{ color: '#6A4BD9', fontSize: 16, fontWeight: '800' }}>{expanded ? '−' : '+'}</Text>
      </Pressable>

      {expanded ? (
        <View style={{ borderTopWidth: 1, borderTopColor: '#F3F0FB', padding: 13, gap: 10 }}>
          {ocrReviewCount > 0 ? (
            <Text style={{ fontSize: 11, lineHeight: 16, color: '#6A4BD9' }}>
              {L(`OCR có ${ocrReviewCount} dòng cần rà lại. Sau khi trích, hãy đối chiếu các câu đã lưu với trang gốc.`, `${ocrReviewCount} OCR lines need review. After extraction, check saved sentences against the source page.`)}
            </Text>
          ) : null}
          {!analysis ? (
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={() => void analyze()}
              style={{ alignSelf: 'flex-start', borderRadius: 9, backgroundColor: loading ? '#C8B78C' : '#6A4BD9', paddingHorizontal: 12, paddingVertical: 9, opacity: loading ? 0.75 : 1 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                {loading ? L('Đang trích từ và cụm từ…', 'Extracting words and phrases…') : L('Trích từ/cụm trong bài và thêm vào Sổ từ', 'Extract words and phrases into Word Book')}
              </Text>
            </Pressable>
          ) : (
            <>
              {analysis.summaryVi ? (
                <View style={{ borderLeftWidth: 3, borderLeftColor: '#D7B764', paddingLeft: 10, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#6A4BD9', marginBottom: 3 }}>{L('TÓM TẮT Ý CHÍNH', 'PASSAGE SUMMARY')}</Text>
                  <Text style={{ fontSize: 12, lineHeight: 18, color: '#3D352B' }}>{analysis.summaryVi}</Text>
                </View>
              ) : null}
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#267244' }}>
                {L(`Đã trích ${analysis.items.length} mục · thêm ${savedCount} mục mới vào Sổ từ${duplicateCount ? ` · ${duplicateCount} mục đã có` : ''}.`, `${analysis.items.length} items extracted · ${savedCount} new items added to Word Book${duplicateCount ? ` · ${duplicateCount} already existed` : ''}.`)}
              </Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/vocabulary')} style={{ alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, borderColor: '#6A4BD9', paddingHorizontal: 10, paddingVertical: 7 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#6A4BD9' }}>{L('Mở Sổ từ', 'Open Word Book')} →</Text>
              </Pressable>
              {analysis.items.length ? (
                <View style={{ gap: 8 }}>
                  {analysis.items.map((item, index) => (
                    <View key={`${item.lemma}-${index}`} style={{ borderWidth: 1, borderColor: '#F3F0FB', borderRadius: 10, backgroundColor: '#FFFFFF', padding: 10, gap: 5 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#29251F' }}>{item.term}</Text>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#6A4BD9' }}>{L(CATEGORY_LABELS[item.category].vi, CATEGORY_LABELS[item.category].en)} · {item.partOfSpeech}</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, lineHeight: 18, color: '#433B31' }}>{item.meaningVi}</Text>
                      <Text style={{ fontSize: 11, lineHeight: 16, color: '#766858' }}>{item.meaningEn}</Text>
                      {item.synonyms.length ? <Text style={{ fontSize: 11, lineHeight: 16, color: '#3E6F75' }}>{L('Synonyms:', 'Synonyms:')} {item.synonyms.join(' · ')}</Text> : null}
                      <Text style={{ fontSize: 11, lineHeight: 16, color: '#6C6257', fontStyle: 'italic' }}>“{item.sourceSentence}”</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ fontSize: 11, lineHeight: 16, color: '#766858' }}>
                  {L('Chưa tìm thấy cụm phù hợp; thử kiểm tra lại OCR của trang này.', 'No reliable phrases found; check the page OCR and try again.')}
                </Text>
              )}
              <Text style={{ fontSize: 10, lineHeight: 15, color: '#82796F' }}>
                {L('Các từ mới được thêm thẳng vào Sổ từ cùng nghĩa, synonyms, câu gốc và số trang. AI chỉ gửi đoạn bạn mở; câu trích được so với OCR. Nếu OCR có cảnh báo, hãy rà lại câu đã lưu với trang gốc.', 'New entries go straight into Word Book with meanings, synonyms, source sentence and page. Only the passage you open is sent; quotes are checked against OCR. If OCR is flagged, review saved sentences against the source page.')}
              </Text>
            </>
          )}
          {error ? (
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, color: '#AE3E32' }}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={() => void analyze()}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#6A4BD9' }}>{L('Thử lại', 'Try again')}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
