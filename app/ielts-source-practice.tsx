import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { useL } from '@/i18n/useL';
import { color } from '@/theme/tokens';

type Page = { page: number; text: string; reviewLines: Array<{ confidence: number; original: string }> };
type TestMeta = {
  id: string; title: string; source: string; section?: 'Reading' | 'Listening';
  pageCount: number; supportPageCount: number; questionCount: number;
  hasAnswerKey: boolean; answerKeyVerified: boolean; hasPdf: boolean; audioCount: number;
  externalOnly: boolean;
};
type TestContent = {
  id: string; title: string; source: string; section?: 'Reading' | 'Listening';
  questionCount: number; pages: Page[]; pdfAsset?: string; sourceStartPage?: number; sourceUrl?: string; audioFiles: string[];
  externalOnly: boolean;
};
type Grade = {
  score: number; total: number; verified: boolean; bandEstimate: number | null;
  results: Array<{ number: number; answer: string; expected: string; correct: boolean }>;
};

const localAssetUrl = (name: string) => `/api/ielts/local-ocr?asset=${encodeURIComponent(name)}`;

export default function IeltsSourcePracticeScreen() {
  const { L } = useL();
  const [tests, setTests] = useState<TestMeta[]>([]);
  const [reviewPages, setReviewPages] = useState<number[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [test, setTest] = useState<TestContent | null>(null);
  const [support, setSupport] = useState<Page[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showSource, setShowSource] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grade, setGrade] = useState<Grade | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/ielts/local-ocr')
      .then(async (response) => {
        if (!response.ok) throw new Error('not-imported');
        return response.json() as Promise<{ tests: TestMeta[]; reviewPages: number[] }>;
      })
      .then((data) => { setTests(data.tests); setReviewPages(data.reviewPages); })
      .catch(() => setError(L('Chưa có dữ liệu đề riêng trên máy này. Hãy chạy hướng dẫn nhập Cambridge trong tài liệu IELTS-OCR-LOCAL.', 'No private test data is imported on this machine. Follow the Cambridge import steps in IELTS-OCR-LOCAL.')));
  }, [L]);

  const loadTest = async (id: string) => {
    setSelected(id); setTest(null); setSupport([]); setSubmitted(false); setGrade(null); setLoading(true); setError('');
    try {
      const response = await fetch('/api/ielts/local-ocr', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) });
      const data = await response.json() as { test?: TestContent; error?: string };
      if (!response.ok || !data.test) throw new Error(data.error ?? 'Could not load test');
      setTest(data.test);
      const saved = typeof localStorage === 'undefined' ? null : localStorage.getItem(`ielts-source-draft:${id}`);
      try { setAnswers(saved ? JSON.parse(saved) as Record<string, string> : {}); } catch { setAnswers({}); }
    } catch { setError(L('Không tải được đề. Hãy kiểm tra kho đề riêng trên máy.', 'Could not load this test. Check the private source store.')); }
    finally { setLoading(false); }
  };

  const updateAnswer = (number: number, value: string) => {
    setAnswers((current) => {
      const next = { ...current, [String(number)]: value };
      if (selected && typeof localStorage !== 'undefined') localStorage.setItem(`ielts-source-draft:${selected}`, JSON.stringify(next));
      return next;
    });
    setSubmitted(false); setGrade(null); setSupport([]);
  };

  const submit = async () => {
    if (!selected) return;
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/ielts/local-ocr', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: selected, submitted: true, answers }),
      });
      const data = await response.json() as { supportPages?: Page[]; grade?: Grade | null };
      if (!response.ok) throw new Error('submit failed');
      setSupport(data.supportPages ?? []); setGrade(data.grade ?? null); setSubmitted(true);
    } catch { setError(L('Chưa nộp được bài. Hãy thử lại.', 'Could not submit this attempt. Please try again.')); }
    finally { setLoading(false); }
  };

  const openPdf = (asset?: string, sourceUrl?: string, page?: number) => {
    if (asset && Platform.OS === 'web' && typeof window !== 'undefined') {
      const pageSuffix = page && page > 1 ? `#page=${page}` : '';
      window.open(`${window.location.origin}${localAssetUrl(asset)}${pageSuffix}`, '_blank', 'noopener,noreferrer');
      return;
    }
    if (sourceUrl && Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(sourceUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (sourceUrl) {
      void Linking.openURL(sourceUrl);
    }
  };

  const reviewSet = useMemo(() => new Set(reviewPages), [reviewPages]);
  const sources = useMemo(() => [...new Set(tests.map((item) => item.source))], [tests]);
  const filteredTests = useMemo(() => sourceFilter === 'all' ? tests : tests.filter((item) => item.source === sourceFilter), [sourceFilter, tests]);
  const answeredCount = Object.values(answers).filter((answer) => answer.trim()).length;
  const wrongAnswers = grade?.results.filter((item) => item.answer && !item.correct) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 64 }}>
        <View style={{ width: '100%', maxWidth: 1120, alignSelf: 'center' }}>
          <Text className="font-heavy text-ink" style={{ fontSize: 30 }}>{L('Bộ đề IELTS · thư viện riêng', 'IELTS tests · private library')}</Text>
          <Text className="mt-2 font-sans text-body text-muted" style={{ lineHeight: 23 }}>
            {L('Đề và audio chỉ nằm trong kho riêng trên máy này. Chọn một đề, làm 40 câu rồi nộp để chấm theo đáp án nguồn.', 'Test pages and audio stay in this machine’s private store. Choose a test, answer its 40 questions, then submit for source-key scoring.')}
          </Text>
          {reviewPages.length ? <Text className="mt-2 font-mid text-label text-muted">{L('Trang OCR cần đối chiếu', 'OCR pages to review')}: {reviewPages.join(', ')}</Text> : null}

          {error ? <View className="mt-4 rounded-panel border border-border bg-surface p-4"><Text className="font-mid text-body text-ink">{error}</Text></View> : null}

          {tests.length ? (
            <>
              <View className="mt-5 flex-row flex-wrap gap-2">
                <FilterChip label={L('Tất cả', 'All')} selected={sourceFilter === 'all'} onPress={() => setSourceFilter('all')} />
                {sources.map((source) => <FilterChip key={source} label={source} selected={sourceFilter === source} onPress={() => setSourceFilter(source)} />)}
              </View>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {filteredTests.map((item) => (
                  <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.title} onPress={() => loadTest(item.id)} className="rounded-panel border bg-surface p-3" style={{ width: 260, borderColor: selected === item.id ? color.primary : color.borderStrong }}>
                    <Text className="font-strong text-ink">{item.title}</Text>
                    <Text className="mt-1 font-sans text-label text-muted">
                      {[item.section, `${item.questionCount} ${L('câu', 'questions')}`, `${item.pageCount} ${L('trang', 'pages')}`].filter(Boolean).join(' · ')}
                    </Text>
                    {item.externalOnly ? <Text className="mt-1 font-mid text-label" style={{ color: '#A16F22' }}>{L('Chỉ có liên kết nguồn · chưa nhập câu hỏi', 'External source link · questions not imported')}</Text> : null}
                    {item.hasAnswerKey ? <Text className="mt-1 font-mid text-label" style={{ color: item.answerKeyVerified ? '#287452' : '#A16F22' }}>{item.answerKeyVerified ? L('Có đáp án nguồn', 'Source answer key') : L('Đáp án cần đối chiếu', 'Answer key needs review')}</Text> : null}
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          {loading ? <ActivityIndicator color={color.primary} style={{ margin: 20 }} /> : null}
          {test ? (
            <View className="mt-6 rounded-panel border border-border bg-surface p-5">
              <View className="flex-row flex-wrap items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="font-heavy text-ink" style={{ fontSize: 24 }}>{test.title}</Text>
                  <Text className="mt-1 font-sans text-label text-muted">{test.source}{test.section ? ` · ${test.section}` : ''} · {test.questionCount} {L('câu', 'questions')}</Text>
                </View>
                {test.pdfAsset || test.sourceUrl ? (
                  <Pressable accessibilityRole="button" onPress={() => openPdf(test.pdfAsset, test.sourceUrl, test.sourceStartPage)} className="rounded-panel border border-borderStrong px-3 py-2">
                    <Text className="font-mid text-label text-ink">{test.externalOnly ? L('Mở bài luyện gốc ↗', 'Open original practice ↗') : L('Mở bản đề gốc ↗', 'Open source PDF ↗')}</Text>
                  </Pressable>
                ) : null}
              </View>

              {test.externalOnly ? <View className="mt-4 rounded-panel border border-border bg-canvas p-4">
                <Text className="font-strong text-ink">{L('Bộ này đang mở qua trang nguồn', 'This set opens on the source website')}</Text>
                <Text className="mt-1 font-sans text-label text-muted">{L('Bảng tính có liên kết tới trang luyện đề, nhưng chưa có PDF/audio và khóa đáp án trong kho riêng nên phần này chưa làm hoặc chấm trực tiếp trong app.', 'The spreadsheet links to an external practice page. Its PDF/audio and answer key are not in the private store, so this set cannot be answered or graded inside the app yet.')}</Text>
              </View> : null}

              {!test.externalOnly && test.audioFiles.length ? (
                <View className="mt-4 rounded-panel border border-border bg-canvas p-3">
                  <Text className="font-strong text-ink">{L('Audio đề thi', 'Test audio')}</Text>
                  <View className="mt-2 gap-3">
                    {test.audioFiles.map((file, index) => (
                      <View key={file}>
                        <Text className="mb-1 font-mid text-label text-muted">{test.audioFiles.length === 1 ? L('Bản nghe', 'Listening audio') : `${L('Phần', 'Part')} ${index + 1}`}</Text>
                        {Platform.OS === 'web' ? React.createElement('audio', { controls: true, preload: 'none', src: localAssetUrl(file), style: { width: '100%' } }) : (
                          <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(localAssetUrl(file))}>
                            <Text className="font-mid text-label text-primary-700">{L('Mở audio', 'Open audio')}</Text>
                          </Pressable>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ) : !test.externalOnly && test.section === 'Listening' ? (
                <Text className="mt-3 font-mid text-label text-muted">{L('Thư mục Drive chưa có audio cho lượt này.', 'The Drive folder has no audio for this test.')}</Text>
              ) : null}

              {!test.externalOnly ? <>
              <Pressable accessibilityRole="button" onPress={() => setShowSource((value) => !value)} className="mt-5 flex-row items-center justify-between border-b border-border pb-2">
                <View>
                  <Text className="font-heavy text-ink" style={{ fontSize: 19 }}>{L('Nội dung đề nguồn', 'Source test pages')}</Text>
                  <Text className="mt-1 font-sans text-label text-muted">{test.pages.length} {L('trang · bản nhập cục bộ', 'pages · imported locally')}</Text>
                </View>
                <Text className="font-strong text-primary-700">{showSource ? L('Thu gọn −', 'Collapse −') : L('Mở đề +', 'Open source +')}</Text>
              </Pressable>
              {showSource ? test.pages.map((page) => (
                <View key={`q-${page.page}`} className="mt-4 border-b border-border pb-4">
                  <Text className="font-strong text-primary-700">{L('Trang', 'Page')} {page.page}{test.source === 'Cambridge IELTS 8' && reviewSet.has(page.page) ? ` · ${L('Cần đối chiếu bản gốc', 'Check against original')}` : ''}</Text>
                  {page.reviewLines.map((line, i) => <Text key={i} className="mt-1 font-mid text-label" style={{ color: '#A75B00' }}>{line.original}</Text>)}
                  <Text selectable className="mt-2 font-sans text-body text-ink" style={{ lineHeight: 23 }}>{page.text || L('Trang này là ảnh; mở PDF gốc để xem rõ.', 'This page is image-only; open the source PDF to view it clearly.')}</Text>
                </View>
              )) : null}
              </> : null}

              {!test.externalOnly ? <View className="mt-5 rounded-panel border border-border bg-canvas p-4">
                <View className="flex-row flex-wrap items-center justify-between gap-2">
                  <View>
                    <Text className="font-heavy text-ink" style={{ fontSize: 19 }}>{L('Phiếu trả lời', 'Answer sheet')}</Text>
                    <Text className="mt-1 font-sans text-label text-muted">{answeredCount}/{test.questionCount} · {L('Nhập chữ cái hoặc từ/cụm từ', 'Enter a letter or a word/phrase')}</Text>
                  </View>
                  {submitted && grade ? <Text className="font-heavy" style={{ fontSize: 20, color: grade.verified ? '#287452' : '#A16F22' }}>{grade.score}/{grade.total}{grade.bandEstimate !== null ? ` · ${L('band', 'band')} ${grade.bandEstimate}` : ''}</Text> : null}
                </View>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {Array.from({ length: test.questionCount }, (_, index) => index + 1).map((number) => (
                    <View key={number} style={{ width: 68 }}>
                      <Text className="mb-1 font-mid text-label text-muted">{number}</Text>
                      <TextInput
                        accessibilityLabel={`${L('Câu', 'Question')} ${number}`}
                        autoCapitalize="characters" autoCorrect={false} maxLength={80}
                        value={answers[String(number)] ?? ''} onChangeText={(value) => updateAnswer(number, value)}
                        className="rounded-panel border border-border bg-surface px-2 py-2 text-center font-strong text-ink"
                        style={{ minHeight: 42, borderColor: grade?.results[number - 1] ? grade.results[number - 1].correct ? '#58A87A' : '#D68A70' : color.border }}
                      />
                    </View>
                  ))}
                </View>
                {!submitted ? <Button className="mt-4 self-start" label={L('Nộp bài · xem kết quả', 'Submit · see results')} onPress={submit} /> : null}
                {submitted && grade ? (
                  <View className="mt-4 rounded-panel border p-3" style={{ borderColor: grade.verified ? '#B8D9C5' : '#E4D0A4', backgroundColor: grade.verified ? '#F1FAF4' : '#FFF9EC' }}>
                    <Text className="font-strong text-ink">
                      {grade.verified ? L(`Bạn đúng ${grade.score}/${grade.total} câu.`, `You got ${grade.score}/${grade.total} correct.`) : L(`Kết quả tạm tính: ${grade.score}/${grade.total}. Đáp án OCR cần được kiểm tra lại.`, `Provisional score: ${grade.score}/${grade.total}. The OCR answer key needs review.`)}
                    </Text>
                    {grade.bandEstimate !== null ? <Text className="mt-1 font-mid text-label text-muted">{L(`Band ${grade.bandEstimate} ước tính · mốc quy đổi thay đổi theo phiên bản đề.`, `Estimated band ${grade.bandEstimate} · conversion thresholds vary by test version.`)}</Text> : null}
                    {wrongAnswers.length ? <Text className="mt-1 font-sans text-label text-muted">{wrongAnswers.slice(0, 12).map((item) => `${item.number}: ${item.answer || '—'} → ${item.expected || '—'}`).join('   ·   ')}</Text> : null}
                    {!grade.verified ? <Text className="mt-2 font-sans text-label text-muted">{L('Không dùng kết quả này làm band IELTS chính thức.', 'Do not treat this as an official IELTS band score.')}</Text> : null}
                  </View>
                ) : submitted ? <Text className="mt-3 font-mid text-label text-muted">{L('Chưa có đáp án cấu trúc để tự chấm. Hãy dùng đáp án nguồn sau khi nộp.', 'No structured answer key is available for auto-scoring. Review the source key after submitting.')}</Text> : null}
              </View> : null}

              {submitted && support.length ? (
                <View className="mt-6 border-t border-border pt-5">
                  <Text className="font-heavy text-ink" style={{ fontSize: 20 }}>{L('Đáp án và tài liệu hỗ trợ từ nguồn', 'Source answers and support')}</Text>
                  {support.map((page) => <View key={`s-${page.page}`} className="mt-4"><Text className="font-strong text-primary-700">{L('Trang', 'Page')} {page.page}</Text><Text selectable className="mt-1 font-sans text-body text-ink" style={{ lineHeight: 23 }}>{page.text}</Text></View>)}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} className="rounded-pill border px-3 py-2" style={{ borderColor: selected ? color.primary : color.borderStrong, backgroundColor: selected ? '#FBF7EE' : '#FFFFFF' }}>
      <Text className="font-mid text-label" style={{ color: selected ? color.primary : color.muted }}>{label}</Text>
    </Pressable>
  );
}
