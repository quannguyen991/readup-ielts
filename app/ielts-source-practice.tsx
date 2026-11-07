import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
  type TextProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { ExamModeModal, type ExamMode } from '@/components/ielts/ExamModeModal';
import { SourceExamRoom } from '@/components/ielts/SourceExamRoom';
import { PracticeTestDetail } from '@/components/ielts/PracticeTestDetail';
import { ExamResourceLinks } from '@/components/exam/ExamResourceLinks';
import { ExamVocabularyPanel, type ExamTextPage } from '@/components/exam/ExamVocabularyPanel';
import { compareSourceTests, SECTION_MINUTES, type ExamPart, type SourcePage } from '@/services/ielts/source-catalog';
import { color } from '@/theme/tokens';
import { FlatCover, numOf, Text } from '@/components/ielts/SourceCover';
import { SourceCatalog } from '@/components/ielts/SourceCatalog';

type Page = SourcePage;
type TestSection = 'Reading' | 'Listening' | 'Writing' | 'Speaking';
type TestMeta = {
  id: string;
  title: string;
  source: string;
  section?: TestSection;
  answerMode?: 'short' | 'long';
  responseLabels?: string[];
  pageCount: number;
  supportPageCount: number;
  questionCount: number;
  hasAnswerKey: boolean;
  answerKeyVerified: boolean;
  hasPdf: boolean;
  audioCount: number;
  audioCloudUrl?: string;
  externalOnly: boolean;
  partCount?: number;
  missingComponents?: string[];
};

type TestContent = {
  id: string;
  title: string;
  source: string;
  section?: TestSection;
  answerMode?: 'short' | 'long';
  responseLabels?: string[];
  questionCount: number;
  pages: Page[];
  pdfAsset?: string;
  sourceStartPage?: number;
  sourceUrl?: string;
  audioFiles: string[];
  audioCloudUrl?: string;
  externalOnly: boolean;
  parts?: ExamPart[];
  missingComponents?: string[];
};

type Grade = {
  score: number;
  total: number;
  verified: boolean;
  bandEstimate: number | null;
  results: Array<{
    number: number;
    answer: string;
    expected: string;
    correct: boolean;
    quote?: string;
    paraphrase?: string;
    explanation?: string;
  }>;
};

const localAssetUrl =(name: string) => `/api/ielts/local-ocr?asset=${encodeURIComponent(name)}`;

function getBookCover(title: string, source: string): string {
  const s = `${source} ${title}`.toLowerCase();
  
  // Match Cambridge volume (e.g. cambridge 19, cam 19, cambridge-19, cambridge ielts 8)
  const camMatch = s.match(/(?:cambridge|cam)[\s\-_]*(?:ielts)?[\s\-_]*(\d+)/i);
  if (camMatch && camMatch[1]) {
    const vol = parseInt(camMatch[1], 10);
    if (vol >= 7 && vol <= 20) {
      return `/books/covers/cam-${vol}.webp`;
    }
    if (vol >= 1 && vol < 7) {
      return `/books/covers/cam-7.webp`;
    }
  }

  // Match Actual Tests / Vol volume
  const volMatch = s.match(/(?:actual|vol|volume)[\s\-_]*(\d+)/i);
  if (volMatch && volMatch[1]) {
    const vol = parseInt(volMatch[1], 10);
    if (vol >= 1 && vol <= 10) {
      return `/books/covers/vol-${vol}.webp`;
    }
  }

  if (s.includes('vol 10') || s.includes('vol10') || s.includes('vol-10')) {
    return '/books/covers/vol-10.webp';
  }

  return '/books/covers/cam-19.webp';
}


/** Đầu trang gọn và tĩnh: không đồ họa động, không vẽ lại khi gõ tìm kiếm hay đổi bộ lọc. */
const CatalogHeader = React.memo(function CatalogHeader({ count, L }: { count: number; L: (vi: string, en: string) => string }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <View style={{ gap: 2 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: color.ink }}>{L('Bộ đề IELTS', 'IELTS Tests')}</Text>
        <Text style={{ fontSize: 14, color: color.muted, fontWeight: '500' }}>Cambridge & Actual Tests · {count}</Text>
      </View>
      <View style={{ flexGrow: 1, flexBasis: 360, maxWidth: 620 }}>
        <ExamResourceLinks exam="ielts" />
      </View>
    </View>
  );
});

export default function IeltsSourcePracticeScreen() {
  const { L } = useL();
  const mainScrollRef = useRef<ScrollView>(null);

  const scrollToTop = useCallback(() => {
    mainScrollRef.current?.scrollTo({ y: 0, animated: false });
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  // Top level views: 'catalog' | 'collections' | 'detail'
  const [viewMode, setViewMode] = useState<'catalog' | 'collections' | 'detail'>('catalog');

  const [tests, setTests] = useState<TestMeta[]>([]);
  const openTest = useCallback((id: string) => {
    scrollToTop();
    void loadTestRef.current(id);
  }, [scrollToTop]);
  const loadTestRef = useRef<(id: string, startPractice?: boolean, mode?: ExamMode) => Promise<void>>(async () => {});
  const [reviewPages, setReviewPages] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [test, setTest] = useState<TestContent | null>(null);
  const [support, setSupport] = useState<Page[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grade, setGrade] = useState<Grade | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    scrollToTop();
  }, [viewMode, scrollToTop]);

  // Filters for Catalog
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'cambridge' | 'vol'>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(
    () => new Set(['cambridge-18-test-2', 'vol-10-reading-test-3', 'cambridge-20-listening-test-4', 'cambridge-19-writing-test-1', 'cambridge-17-reading-test-1', 'vol-10-reading-test-5', 'cambridge-16-listening-test-2', 'vol-10-reading-test-6'])
  );

  // Collections tab sub-filter
  const [collectionSubTab, setCollectionSubTab] = useState<'all' | 'saved' | 'collections' | 'continue' | 'recommend'>('all');
  const [collectionSearch, setCollectionSearch] = useState('');

  // Interactive exam taking mode inside detail
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const [examMode, setExamMode] = useState<ExamMode>('simulation');
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 60);

  useEffect(() => {
    fetch('/api/ielts/local-ocr')
      .then(async (response) => {
        if (!response.ok) throw new Error('not-imported');
        return response.json() as Promise<{ tests: TestMeta[]; reviewPages: number[] }>;
      })
      .then((data) => {
        setTests([...data.tests].sort(compareSourceTests));
        setReviewPages(data.reviewPages);
      })
      .catch(() => {
        setError(
          L(
            'Chưa có dữ liệu đề riêng trên máy này. Đang tải kho đề Cambridge & Actual Volumes...',
            'Loading Cambridge & Actual Volumes test bank...'
          )
        );
      });
  }, [L]);

  // Timer countdown
  useEffect(() => {
    if (!isExamStarted || timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [isExamStarted, timeLeft, submitted]);

  const loadTest = async (id: string, startPractice = false, mode: ExamMode = 'simulation') => {
    setSelectedId(id);
    setTest(null);
    setSupport([]);
    setSubmitted(false);
    setGrade(null);
    setLoading(true);
    setError('');
    setViewMode('detail');
    scrollToTop();
    setIsExamStarted(startPractice);
    setExamMode(mode);
    setShowAnswerKey(false);
    setTimeLeft(60 * 60);

    try {
      const response = await fetch('/api/ielts/local-ocr', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = (await response.json()) as { test?: TestContent; error?: string };
      if (!response.ok || !data.test) throw new Error(data.error ?? 'Could not load test');
      setTest(data.test);
      setTimeLeft(SECTION_MINUTES[data.test.section ?? 'Reading'] * 60);
      const saved = typeof localStorage === 'undefined' ? null : localStorage.getItem(`ielts-source-draft:${id}`);
      try {
        setAnswers(saved ? (JSON.parse(saved) as Record<string, string>) : {});
      } catch {
        setAnswers({});
      }
    } catch {
      setError(L('Không tải được đề. Hãy kiểm tra kho đề.', 'Could not load this test.'));
    } finally {
      setLoading(false);
    }
  };

  loadTestRef.current = loadTest;

  const updateAnswer = (number: number, value: string) => {
    setAnswers((current) => {
      const next = { ...current, [String(number)]: value };
      if (selectedId && typeof localStorage !== 'undefined') {
        localStorage.setItem(`ielts-source-draft:${selectedId}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const submit = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ielts/local-ocr', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: selectedId, submitted: true, answers }),
      });
      const data = (await response.json()) as { supportPages?: Page[]; grade?: Grade | null };
      if (!response.ok) throw new Error('submit failed');
      setSupport(data.supportPages ?? []);
      setGrade(data.grade ?? null);
      setSubmitted(true);
    } catch {
      setError(L('Chưa nộp được bài. Hãy thử lại.', 'Could not submit this attempt. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const currentTestMeta = useMemo(() => {
    if (!selectedId) return tests[0] ?? null;
    return tests.find((t) => t.id === selectedId) ?? null;
  }, [selectedId, tests]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const answeredCount = Object.values(answers).filter((a) => a && a.trim()).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.surfaceAlt }}>
      <ScrollView ref={mainScrollRef} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 80 }}>
        <View style={{ width: '100%', maxWidth: 1360, alignSelf: 'center', gap: 20 }}>

          
          {/* Top Switcher Navigation Bar: Catalog vs Collections */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(180, 140, 95, 0.15)', paddingBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                onPress={() => setViewMode('catalog')}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: viewMode === 'catalog' ? color.primaryDark : 'transparent',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: viewMode === 'catalog' ? color.surface : color.body }}>
                  {L(`Bộ đề IELTS (${tests.length})`, `IELTS sources (${tests.length})`)}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setViewMode('collections')}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: viewMode === 'collections' ? color.primaryDark : 'transparent',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: viewMode === 'collections' ? color.surface : color.body }}>
                  {L('Bộ sưu tập của bạn (24)', 'Your Collections (24)')}
                </Text>
              </Pressable>
            </View>

            {viewMode === 'detail' ? (
              <Pressable
                onPress={() => setViewMode('catalog')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#F3F0FB' }}
              >
                <Icon name="chevron-left" size={16} color="#6A4BD9" />
                <Text style={{ color: '#6A4BD9', fontSize: 13, fontWeight: '700' }}>
                  {L('Quay lại kho đề', 'Back to Catalog')}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* VIEW 1: danh mục bộ đề */}
          {viewMode === 'catalog' ? (
            <View style={{ gap: 20 }}>
              <CatalogHeader count={tests.length} L={L} />

              <SourceCatalog
                tests={tests}
                L={L}
                collection={collectionFilter}
                onCollection={setCollectionFilter}
                skill={sectionFilter}
                onSkill={setSectionFilter}
                query={searchQuery}
                onQuery={setSearchQuery}
                onOpen={openTest}
              />
            </View>
          ) : null}

          {/* ========================================================= */}
          {/* VIEW 2: BỘ SƯU TẬP CỦA BẠN (input_file_0) */}
          {/* ========================================================= */}
          {viewMode === 'collections' ? (
            <View style={{ gap: 24 }}>
              {/* Top Banner Header with Mascot */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20, paddingTop: 10 }}>
                <View style={{ flex: 1, minWidth: 260, gap: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 2, color: '#6A4BD9', textTransform: 'uppercase' }}>
                    PRACTICE · PROGRESS · HIGHER BANDS
                  </Text>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: '#2B2350', fontFamily: 'BeVietnamPro_800ExtraBold', letterSpacing: -0.5 }}>
                    {L('Bộ sưu tập của bạn', 'Your Collections')}
                  </Text>
                  <Text style={{ fontSize: 15, color: '#7C6552', lineHeight: 22 }}>
                    {L('Tạo và quản lý bộ sưu tập theo mục tiêu band.', 'Create and manage collections tailored to your target band.')}
                  </Text>
                </View>

                {/* Exact Mascot Illustration from input_file_0: Mascot on IELTS books with globe - ENLARGED */}
                <View
                  style={{
                    width: 320,
                    height: 200,
                    borderRadius: 22,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: 'rgba(180, 140, 95, 0.25)',
                    shadowColor: '#6A4BD9',
                    shadowOpacity: 0.18,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 6 },
                  }}
                >
                  <Image
                    source={{ uri: '/mascot/header_mascot_study.jpg' }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </View>
              </View>

              {/* Search Bar in Collections with ☀️ ⌘ K */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E6DACB',
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  height: 48,
                  shadowColor: '#2B2350',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                <Icon name="search" size={18} color="#6A4BD9" />
                <TextInput
                  value={collectionSearch}
                  onChangeText={setCollectionSearch}
                  placeholder={L('Tìm trong bộ sưu tập của bạn...', 'Search in your collections...')}
                  placeholderTextColor="#A38F7E"
                  style={{ flex: 1, height: '100%', paddingHorizontal: 10, color: '#2B2350', fontSize: 14 }}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#F3F0FB' }}>
                  <Text style={{ fontSize: 12 }}>☀️</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#7C6552' }}>⌘ K</Text>
                </View>
              </View>

              {/* Sub-tabs row with button "+ Tạo bộ sưu tập mới" */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'Tất cả (24)' },
                    { id: 'saved', label: '📄 Đã lưu (18)' },
                    { id: 'collections', label: '📁 Bộ sưu tập (6)' },
                    { id: 'continue', label: '▶ Luyện tiếp (5)' },
                    { id: 'recommend', label: '⭐ Gợi ý cho bạn' },
                  ].map((tab) => {
                    const on = collectionSubTab === tab.id;
                    return (
                      <Pressable
                        key={tab.id}
                        onPress={() => setCollectionSubTab(tab.id as 'all' | 'saved' | 'collections' | 'continue' | 'recommend')}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          borderRadius: 20,
                          backgroundColor: on ? '#6A4BD9' : '#FFFFFF',
                          borderWidth: 1,
                          borderColor: on ? '#6A4BD9' : '#E6DACB',
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: on ? '#FFFFFF' : '#2B2350' }}>
                          {tab.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: '#6A4BD9',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>+ Tạo bộ sưu tập mới</Text>
                </Pressable>
              </View>

              {/* SECTION 1: Bộ sưu tập của bạn (4 Cards with landscape photos) */}
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16 }}>👑</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#2B2350' }}>
                    {L('Bộ sưu tập của bạn', 'Your Collections')}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: '#7C6552', marginTop: -6 }}>
                  {L('Quản lý các bộ sưu tập theo mục tiêu band.', 'Manage study collections by band target.')}
                </Text>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
                  {[
                    { title: 'Mục tiêu Band 7.0', desc: 'Tài liệu trọng tâm', img: '/books/collections/band7.jpg' },
                    { title: 'Reading chuyên sâu', desc: 'Tài liệu Reading', img: '/books/collections/reading.jpg' },
                    { title: 'Luyện Writing Task 2', desc: 'Bài mẫu và đề luyện tập', img: '/books/collections/writing.jpg' },
                    { title: 'Đề khó Challenge', desc: 'Đề nâng cao', img: '/books/collections/challenge.jpg' },
                  ].map((col) => (
                    <Pressable
                      key={col.title}
                      style={{
                        flex: 1,
                        minWidth: 280,
                        maxWidth: 330,
                        borderRadius: 16,
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#F3F0FB',
                        overflow: 'hidden',
                        shadowColor: '#2B2350',
                        shadowOpacity: 0.04,
                        shadowRadius: 8,
                      }}

                    >
                      <Image source={{ uri: col.img }} style={{ width: '100%', height: 110 }} resizeMode="cover" />
                      <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F3F0FB', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="book" size={16} color="#6A4BD9" />
                          </View>
                          <View>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: '#2B2350' }}>{col.title}</Text>
                            <Text style={{ fontSize: 11, color: '#7C6552' }}>{col.desc}</Text>
                          </View>
                        </View>
                        <Icon name="arrow-right" size={14} color="#6A4BD9" />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* SECTION 2: Đề đã lưu (Grid of 8 saved cards matching input_file_0) */}
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 16 }}>🔖</Text>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#2B2350' }}>
                        {L('Đề đã lưu', 'Saved Tests')}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, color: '#7C6552' }}>
                      {L('Các đề thi bạn đã lưu từ thư viện.', 'Tests saved to your personal library.')}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 12, color: '#7C6552' }}>Sắp xếp:</Text>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6DACB', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#2B2350' }}>Mới lưu gần đây</Text>
                      <Text style={{ fontSize: 10, color: '#7C6552' }}>▼</Text>
                    </View>
                  </View>
                </View>

                {/* 8 Saved Cards Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
                  {[
                    { id: 'cambridge-18-test-2', title: 'Cambridge IELTS 18 Reading Test 2', source: 'Cambridge IELTS 18', type: 'CAMBRIDGE', cover: '/books/covers/cam-18.webp' },
                    { id: 'vol-10-reading-test-3', title: 'VOL 10 KEY Reading Test 3', source: 'VOL 10 KEY', type: 'ACTUAL VOL', cover: '/books/covers/vol-10.webp' },
                    { id: 'cambridge-20-listening-test-4', title: 'Cambridge IELTS 20 Listening Test 4', source: 'Cambridge IELTS 20', type: 'CAMBRIDGE', cover: '/books/covers/cam-20.webp' },
                    { id: 'cambridge-19-writing-test-1', title: 'Cambridge IELTS 19 Writing Test 1', source: 'Cambridge IELTS 19', type: 'CAMBRIDGE', cover: '/books/covers/cam-19.webp' },
                    { id: 'cambridge-17-reading-test-1', title: 'Cambridge IELTS 17 Reading Test 1', source: 'Cambridge IELTS 17', type: 'CAMBRIDGE', cover: '/books/covers/cam-17.webp' },
                    { id: 'vol-10-reading-test-5', title: 'VOL 10 KEY Reading Test 5', source: 'VOL 10 KEY', type: 'ACTUAL VOL', cover: '/books/covers/vol-10.webp' },
                    { id: 'cambridge-16-listening-test-2', title: 'Cambridge IELTS 16 Listening Test 2', source: 'Cambridge IELTS 16', type: 'CAMBRIDGE', cover: '/books/covers/cam-16.webp' },
                    { id: 'vol-10-reading-test-6', title: 'VOL 10 KEY Reading Test 6', source: 'VOL 10 KEY', type: 'ACTUAL VOL', cover: '/books/covers/vol-10.webp' },
                  ].map((card) => {
                    const isCam = card.type === 'CAMBRIDGE';
                    return (
                      <View
                        key={card.id}
                        style={{
                          flex: 1,
                          minWidth: 280,
                          maxWidth: 330,
                          borderRadius: 14,
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#F3F0FB',
                          padding: 12,
                          flexDirection: 'row',
                          gap: 12,
                          alignItems: 'center',
                          shadowColor: '#2B2350',
                          shadowOpacity: 0.04,
                          shadowRadius: 8,
                        }}
                      >

                        <FlatCover kind={isCam ? 'CAMBRIDGE' : 'ACTUAL VOL'} num={numOf(card.source)} width={88} height={98} radius={8} />
                        <View style={{ flex: 1, gap: 4 }}>
                          <View
                            style={{
                              alignSelf: 'flex-start',
                              paddingHorizontal: 6,
                              paddingVertical: 1.5,
                              borderRadius: 4,
                              backgroundColor: isCam ? '#E0F2FE' : '#FCE7F3',
                            }}
                          >
                            <Text style={{ fontSize: 9.5, fontWeight: '800', color: isCam ? '#0369A1' : '#9D174D' }}>
                              {card.type}
                            </Text>
                          </View>

                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#2B2350' }} numberOfLines={2}>
                            {card.title}
                          </Text>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#16A34A' }}>✓ Đã lưu</Text>
                            <Pressable onPress={() => loadTest(card.id, true)}>
                              <Text style={{ fontSize: 10, fontWeight: '800', color: '#6A4BD9' }}>▶ Luyện tiếp</Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* SECTION 3: Gợi ý theo mục tiêu band */}
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 16 }}>💡</Text>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#2B2350' }}>
                        {L('Gợi ý theo mục tiêu band', 'Suggestions by Band Target')}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, color: '#7C6552' }}>
                      {L('Chọn mục tiêu band để nhận đề phù hợp.', 'Select a target band to get tailored tests.')}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#6A4BD9' }}>
                    {L('Xem tất cả →', 'View all →')}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
                  {[
                    { icon: '🎯', band: 'Band 6.5', desc: 'Ôn nền tảng' },
                    { icon: '📊', band: 'Band 7.0', desc: 'Tăng kỹ năng' },
                    { icon: '📈', band: 'Band 7.5', desc: 'Thử thách nâng cao' },
                    { icon: '🏆', band: 'Band 8.0', desc: 'Hướng tới mục tiêu' },
                  ].map((b) => (
                    <Pressable
                      key={b.band}
                      onPress={() => {
                        setSearchQuery(b.band);
                        setViewMode('catalog');
                      }}
                      style={{
                        flex: 1,
                        minWidth: 240,
                        padding: 14,
                        borderRadius: 14,
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#F3F0FB',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F0FB', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 18 }}>{b.icon}</Text>
                        </View>
                        <View>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#2B2350' }}>{b.band}</Text>
                          <Text style={{ fontSize: 12, color: '#7C6552' }}>{b.desc}</Text>
                        </View>
                      </View>
                      <Icon name="arrow-right" size={14} color="#6A4BD9" />
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          {viewMode === 'detail' && error ? (
            <View style={{ padding: 14, borderRadius: 12, backgroundColor: color.dangerSoft, borderWidth: 1, borderColor: color.danger }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: color.danger }}>{error}</Text>
            </View>
          ) : null}

          {viewMode === 'detail' ? (
            <PracticeTestDetail
              test={test}
              meta={currentTestMeta}
              related={tests}
              L={L}
              isSaved={Boolean(selectedId && savedIds.has(selectedId))}
              answeredCount={answeredCount}
              timeLabel={formatTimer(timeLeft)}
              submitted={submitted}
              bandEstimate={submitted && grade ? (grade.bandEstimate ?? null) : null}
              score={submitted && grade ? grade.score : null}
              total={submitted && grade ? grade.total : null}
              activeMode={isExamStarted ? examMode : null}
              showAnswerKey={showAnswerKey}
              onBack={() => setViewMode('catalog')}
              onStart={(mode) => {
                const targetId = selectedId || test?.id || currentTestMeta?.id || 'cambridge-19-reading-1';
                if (!test || test.id !== targetId) {
                  loadTest(targetId, true, mode);
                } else {
                  setExamMode(mode);
                  setIsExamStarted(true);
                }
              }}
              onOpenModes={() => setShowModeModal(true)}
              onToggleAnswerKey={() => setShowAnswerKey(!showAnswerKey)}
              onToggleSave={() => selectedId && toggleSave(selectedId)}
              onOpenTest={(id) => loadTest(id)}
            />
          ) : null}

        </View>
      </ScrollView>

      {/* Phòng thi: mở khi bấm "Thi thử" hoặc "Luyện tập" ở trang chi tiết */}
      {isExamStarted && test ? (
        <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={() => setIsExamStarted(false)}>
          <View style={{ flex: 1, backgroundColor: color.canvas }}>
            <SourceExamRoom
              key={`${test.id}:${examMode}`}
              test={test}
              simulation={examMode === 'simulation'}
              answers={answers}
              onAnswerChange={updateAnswer}
              onSubmit={submit}
              onExit={() => setIsExamStarted(false)}
              grade={grade}
              submitted={submitted}
              loading={loading}
              supportPages={support}
            />
          </View>
        </Modal>
      ) : null}

      {/* Mode Selection Modal */}
      <ExamModeModal
        visible={showModeModal}
        onClose={() => setShowModeModal(false)}
        onSelectMode={(mode) => {
          setExamMode(mode);
          setIsExamStarted(true);
          setShowModeModal(false);
        }}
        testTitle={test?.title ?? currentTestMeta?.title ?? 'IELTS Reading Test'}
        questionCount={test?.questionCount || currentTestMeta?.questionCount || 40}
      />
    </SafeAreaView>
  );
}
