import React, { useEffect, useMemo, useState } from 'react';
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
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { useL } from '@/i18n/useL';
import { ExamModeModal, type ExamMode } from '@/components/ielts/ExamModeModal';
import { SourceExamRoom } from '@/components/ielts/SourceExamRoom';
import { ExamResourceLinks } from '@/components/exam/ExamResourceLinks';
import { ExamVocabularyPanel, type ExamTextPage } from '@/components/exam/ExamVocabularyPanel';
import { compareSourceTests, SECTION_MINUTES, type ExamPart, type SourcePage } from '@/services/ielts/source-catalog';

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

/** Phông Be Vietnam Pro của Band 9, chọn theo độ đậm cũ của từng chữ. */
function fontFor(weight: unknown): string {
  switch (String(weight)) {
    case '900':
    case '800':
      return 'BeVietnamPro_800ExtraBold';
    case '700':
    case 'bold':
      return 'BeVietnamPro_700Bold';
    case '600':
      return 'BeVietnamPro_600SemiBold';
    case '500':
      return 'BeVietnamPro_500Medium';
    default:
      return 'BeVietnamPro_400Regular';
  }
}

/** Mọi chữ trên trang bộ đề đi qua đây để dùng đúng phông Band 9. */
function Text(props: TextProps) {
  const flat = StyleSheet.flatten(props.style) as { fontWeight?: unknown } | undefined;
  return <RNText {...props} style={[{ fontFamily: fontFor(flat?.fontWeight) }, props.style]} />;
}

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


/**
 * Bìa của một đề: ảnh 2D đã tạo sẵn trong public/books/covers-2d (cam-N.png, vol-N.png).
 */
function FlatCover({ kind, num, width, height, radius = 10 }: { kind: 'CAMBRIDGE' | 'ACTUAL VOL'; num: string; width: number; height: number; radius?: number }) {
  const n = parseInt(num, 10) || 0;
  if (n === 21 || n === 0 || (kind === 'ACTUAL VOL' && n > 10)) return <FlatCoverDrawn kind={kind} num={num || 'IELTS'} width={width} height={height} radius={radius} />;
  const src = `/books/covers-2d/${kind === 'CAMBRIDGE' ? 'cam' : 'vol'}-${n}.webp`;
  return <Image source={{ uri: src }} style={{ width, height, borderRadius: radius }} resizeMode="cover" />;
}

/** Màu nền bìa theo số đề: mỗi đề một màu cố định, để nhìn lướt là nhận ra. */
const COVER_PALETTE = ['#1F3A5F', '#0F766E', '#6B3FA0', '#9F1239', '#166534', '#334155', '#92400E', '#3730A3', '#0E7490', '#7C2D12'];

/** Số đề trong tên, ví dụ "Cambridge IELTS 19" -> "19", "VOL 10 KEY" -> "10". */
function numOf(s: string): string {
  const m = s.match(/(\d+)/);
  return m?.[1] ?? '';
}

/**
 * Bìa 2D vẽ bằng code: nền phẳng một màu, số đề lớn và một dải mờ ở đáy. Không dùng
 * ảnh bìa gốc của nhà xuất bản, nên không có bản quyền bìa nào được sao chép.
 */
function FlatCoverDrawn({
  kind,
  num,
  width,
  height,
  radius = 10,
}: {
  kind: 'CAMBRIDGE' | 'ACTUAL VOL';
  num: string;
  width: number;
  height: number;
  radius?: number;
}) {
  const n = parseInt(num, 10) || 0;
  const bg = COVER_PALETTE[n % COVER_PALETTE.length] ?? '#1F3A5F';
  const pad = Math.round(width * 0.09);
  const small = Math.max(8, Math.round(width * 0.085));
  return (
    <View style={{ width, height, borderRadius: radius, backgroundColor: bg, padding: pad, justifyContent: 'space-between', overflow: 'hidden' }}>
      <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: small, fontWeight: '800', letterSpacing: 1 }}>
        {kind === 'CAMBRIDGE' ? 'CAMBRIDGE' : 'ACTUAL TESTS'}
      </Text>
      <Text style={{ color: '#FFFFFF', fontSize: Math.round(width * 0.4), fontWeight: '900', lineHeight: Math.round(width * 0.44) }}>
        {num || '—'}
      </Text>
      <View style={{ marginHorizontal: -pad, marginBottom: -pad, paddingHorizontal: pad, paddingVertical: Math.round(pad * 0.7), backgroundColor: 'rgba(0,0,0,0.18)' }}>
        <Text style={{ color: '#FFFFFF', fontSize: small, fontWeight: '700' }}>IELTS</Text>
      </View>
    </View>
  );
}

export default function IeltsSourcePracticeScreen() {
  const { L } = useL();

  // Top level views: 'catalog' | 'collections' | 'detail'
  const [viewMode, setViewMode] = useState<'catalog' | 'collections' | 'detail'>('catalog');

  const [tests, setTests] = useState<TestMeta[]>([]);
  const [reviewPages, setReviewPages] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [test, setTest] = useState<TestContent | null>(null);
  const [support, setSupport] = useState<Page[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grade, setGrade] = useState<Grade | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const filteredTests = useMemo(() => {
    return tests.filter((item) => {
      if (collectionFilter === 'cambridge' && !item.source.toLowerCase().includes('cambridge')) {
        return false;
      }
      if (collectionFilter === 'vol' && !item.source.toLowerCase().includes('vol')) {
        return false;
      }
      if (sectionFilter !== 'all' && item.section !== sectionFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const normQ = q.replace(/\bcam\b/g, 'cambridge');
        const match =
          item.title.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(normQ) ||
          item.source.toLowerCase().includes(normQ) ||
          (item.section && item.section.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    }).sort(compareSourceTests);
  }, [collectionFilter, sectionFilter, searchQuery, tests]);

  // Each source keeps its skills together; newer Cambridge/Vol books come first.
  const sectionGroups = useMemo(() => {
    return [...new Set(filteredTests.map((item) => item.source))]
      .map((source) => ({ key: source, label: source, items: filteredTests.filter((t) => t.source === source) }));
  }, [filteredTests]);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 80 }}>
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
                  backgroundColor: viewMode === 'catalog' ? '#8F6E36' : 'transparent',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: viewMode === 'catalog' ? '#FFFFFF' : '#7C6552' }}>
                  {L(`Bộ đề IELTS (${tests.length})`, `IELTS sources (${tests.length})`)}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setViewMode('collections')}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: viewMode === 'collections' ? '#8F6E36' : 'transparent',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: viewMode === 'collections' ? '#FFFFFF' : '#7C6552' }}>
                  {L('Bộ sưu tập của bạn (24)', 'Your Collections (24)')}
                </Text>
              </Pressable>
            </View>

            {viewMode === 'detail' ? (
              <Pressable
                onPress={() => setViewMode('catalog')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#F0E6D8' }}
              >
                <Icon name="chevron-left" size={16} color="#8F6E36" />
                <Text style={{ color: '#8F6E36', fontSize: 13, fontWeight: '700' }}>
                  {L('Quay lại kho đề', 'Back to Catalog')}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* ========================================================= */}
          {/* VIEW 1: BỘ ĐỀ IELTS · CAMBRIDGE & ACTUAL VOLUMES (input_file_2) */}
          {/* ========================================================= */}
          {viewMode === 'catalog' ? (
            <View style={{ gap: 20 }}>
              {/* Khung đầu trang theo kiểu LightHero của Band 9 */}
              <LightHero
                badge="PRACTICE · PROGRESS · HIGHER BANDS"
                art="test"
                line1={L('Bộ đề IELTS', 'IELTS Tests')}
                line2="Cambridge & Actual Volumes"
                subtitle={L('Đề OCR có thể luyện trong app; mục chỉ có liên kết sẽ mở trang nguồn.', 'OCR sets can be practiced here; link-only entries open at their source page.')}
                footer={<HeroStat value={String(tests.length)} label={L('nguồn đề', 'test sources')} />}
              />

              <ExamResourceLinks exam="ielts" />

              {/* Quick Filters Row 1: Bộ đề */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#2A1808', width: 64 }}>
                  {L('Bộ đề:', 'Collection:')}
                </Text>
                <Pressable
                  onPress={() => setCollectionFilter('all')}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: collectionFilter === 'all' ? '#8F6E36' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: collectionFilter === 'all' ? '#8F6E36' : '#E6DACB',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: collectionFilter === 'all' ? '#FFFFFF' : '#573E29' }}>
                    {L(`Tất cả (${tests.length})`, `All (${tests.length})`)}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setCollectionFilter('cambridge')}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: collectionFilter === 'cambridge' ? '#8F6E36' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: collectionFilter === 'cambridge' ? '#8F6E36' : '#E6DACB',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: collectionFilter === 'cambridge' ? '#FFFFFF' : '#573E29' }}>
                    Cambridge IELTS (21 → 8)
                  </Text>
                  <Text style={{ fontSize: 10, color: collectionFilter === 'cambridge' ? '#FFFFFF' : '#573E29' }}>▼</Text>
                </Pressable>

                <Pressable
                  onPress={() => setCollectionFilter('vol')}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: collectionFilter === 'vol' ? '#8F6E36' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: collectionFilter === 'vol' ? '#8F6E36' : '#E6DACB',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: collectionFilter === 'vol' ? '#FFFFFF' : '#573E29' }}>
                    {L('Vol · Mới nhất trước', 'Volumes · Newest first')}
                  </Text>
                </Pressable>
              </View>

              {/* Quick Filters Row 2: Kỹ năng */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#2A1808', width: 64 }}>
                  {L('Kỹ năng:', 'Skill:')}
                </Text>
                {['all', 'Reading', 'Listening', 'Writing', 'Speaking'].map((sec) => {
                  const on = sectionFilter === sec;
                  return (
                    <Pressable
                      key={sec}
                      onPress={() => setSectionFilter(sec)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 7,
                        borderRadius: 20,
                        backgroundColor: on ? '#8F6E36' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: on ? '#8F6E36' : '#E6DACB',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: on ? '#FFFFFF' : '#573E29' }}>
                        {sec === 'all' ? L('Tất cả', 'All') : sec}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Search Bar matching input_file_2 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E6DACB',
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    height: 48,
                    shadowColor: '#784415',
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                  }}
                >
                  <Icon name="search" size={18} color="#945619" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Cam 19 Reading..."
                    placeholderTextColor="#A38F7E"
                    style={{ flex: 1, height: '100%', paddingHorizontal: 10, color: '#2A1808', fontSize: 14, fontWeight: '500' }}
                  />
                  {searchQuery ? (
                    <Pressable onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                      <Icon name="close" size={16} color="#A38F7E" />
                    </Pressable>
                  ) : null}
                </View>

                <Pressable
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    height: 48,
                    paddingHorizontal: 18,
                    borderRadius: 14,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E6DACB',
                  }}
                >
                  <Icon name="filter" size={16} color="#8F6E36" />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#8F6E36' }}>
                    {L('Bộ lọc', 'Filter')}
                  </Text>
                </Pressable>
              </View>

              {/* Active Filter Chips Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6DACB' }}>
                  <Text style={{ fontSize: 12, color: '#573E29', fontWeight: '600' }}>{collectionFilter === 'all' ? L('Mọi bộ đề', 'All collections') : collectionFilter === 'cambridge' ? 'Cambridge (21 → 8)' : 'Volumes'}</Text>
                  <Pressable onPress={() => setCollectionFilter('all')}>
                    <Icon name="close" size={12} color="#A38F7E" />
                  </Pressable>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6DACB' }}>
                  <Text style={{ fontSize: 12, color: '#573E29', fontWeight: '600' }}>{sectionFilter === 'all' ? L('Mọi kỹ năng', 'All skills') : sectionFilter}</Text>
                  <Pressable onPress={() => setSectionFilter('all')}>
                    <Icon name="close" size={12} color="#A38F7E" />
                  </Pressable>
                </View>

                {searchQuery ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6DACB' }}>
                    <Text style={{ fontSize: 12, color: '#573E29', fontWeight: '600' }}>Từ khóa: {searchQuery}</Text>
                    <Pressable onPress={() => setSearchQuery('')}>
                      <Icon name="close" size={12} color="#A38F7E" />
                    </Pressable>
                  </View>
                ) : null}

                <Pressable
                  onPress={() => {
                    setCollectionFilter('all');
                    setSectionFilter('all');
                    setSearchQuery('');
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#8F6E36', marginLeft: 4 }}>
                    {L('Xóa tất cả', 'Clear all')}
                  </Text>
                </Pressable>
              </View>

              {/* 2-Column Layout matching input_file_2 */}
              <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
                {/* Left Sidebar Filter */}
                <View
                  style={{
                    width: 240,
                    borderRadius: 16,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#EFE7DC',
                    padding: 16,
                    gap: 16,
                    shadowColor: '#784415',
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="filter" size={18} color="#8F6E36" />
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#2A1808' }}>
                      {L('Bộ lọc', 'Filters')}
                    </Text>
                  </View>

                  {/* Filter Group: Bộ đề */}
                  <View style={{ gap: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#2A1808' }}>
                      {L('Bộ đề', 'Collection')}
                    </Text>
                    {[
                      { id: 'all', label: `Tất cả (${tests.length})` },
                      { id: 'cambridge', label: 'Cambridge IELTS' },
                      { id: 'vol', label: 'Actual Tests' },
                    ].map((opt) => {
                      const on = collectionFilter === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          onPress={() => setCollectionFilter(opt.id as 'all' | 'cambridge' | 'vol')}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 }}
                        >
                          <View
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 8,
                              borderWidth: on ? 5 : 1.5,
                              borderColor: on ? '#8F6E36' : '#C7B7A6',
                              backgroundColor: '#FFFFFF',
                            }}
                          />
                          <Text style={{ fontSize: 13, color: on ? '#2A1808' : '#6A5645', fontWeight: on ? '700' : '500' }}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Filter Group: Kỹ năng */}
                  <View style={{ gap: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#2A1808' }}>
                      {L('Kỹ năng', 'Skill')}
                    </Text>
                    {['Reading', 'Listening', 'Writing', 'Speaking'].map((s) => {
                      const on = sectionFilter === s;
                      return (
                        <Pressable
                          key={s}
                          onPress={() => setSectionFilter(sectionFilter === s ? 'all' : s)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 }}
                        >
                          <View
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 4,
                              backgroundColor: on ? '#8F6E36' : '#FFFFFF',
                              borderWidth: 1.5,
                              borderColor: on ? '#8F6E36' : '#C7B7A6',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {on ? <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text> : null}
                          </View>
                          <Text style={{ fontSize: 13, color: on ? '#2A1808' : '#6A5645', fontWeight: on ? '700' : '500' }}>
                            {s}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Filter Slider: Số câu & Số trang */}
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#2A1808' }}>Số câu</Text>
                      <Text style={{ fontSize: 12, color: '#8F6E36', fontWeight: '700' }}>0 – 60</Text>
                    </View>
                    <View style={{ height: 4, borderRadius: 2, backgroundColor: '#EFE7DC' }}>
                      <View style={{ width: '100%', height: '100%', backgroundColor: '#8F6E36', borderRadius: 2 }} />
                    </View>
                  </View>

                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#2A1808' }}>Số trang</Text>
                      <Text style={{ fontSize: 12, color: '#8F6E36', fontWeight: '700' }}>0 – 40</Text>
                    </View>
                    <View style={{ height: 4, borderRadius: 2, backgroundColor: '#EFE7DC' }}>
                      <View style={{ width: '100%', height: '100%', backgroundColor: '#8F6E36', borderRadius: 2 }} />
                    </View>
                  </View>

                  <Pressable
                    style={{
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: '#8F6E36',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    <Icon name="filter" size={14} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                      {L('Áp dụng bộ lọc', 'Apply Filters')}
                    </Text>
                  </Pressable>
                </View>

                {/* Right Main Content */}
                <View style={{ flex: 1, gap: 16 }}>
                  {/* Highlight Recommendation Card matching input_file_2 */}
                  <View
                    style={{
                      borderRadius: 16,
                      backgroundColor: '#FFF8ED',
                      borderWidth: 1,
                      borderColor: '#F3E3CA',
                      padding: 18,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 220, gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 14 }}>👑</Text>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#B45309', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {L('Đề xuất cho bạn', 'Recommended for you')}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: '#2A1808', fontFamily: 'BeVietnamPro_800ExtraBold' }}>
                        Cambridge IELTS 21 · Reading Test 1
                      </Text>
                      <Text style={{ fontSize: 13, color: '#7C6552' }}>
                        {L('Đề thi bám sát đề thật, chất lượng cao.', 'Authentic test format with detailed analysis.')}
                      </Text>
                    </View>

                    {/* 3D Book Cover from generated asset - floating and enlarged */}
                    <View
                      style={{
                        width: 120,
                        height: 120,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FlatCover kind="CAMBRIDGE" num="21" width={120} height={120} radius={12} />
                    </View>

                    <Pressable
                      onPress={() => loadTest('cambridge-21-reading-1')}
                      style={{
                        paddingHorizontal: 16,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E6DACB',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 4,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#8F6E36' }}>
                        {L('Xem ngay', 'View now')}
                      </Text>
                      <Icon name="arrow-right" size={14} color="#8F6E36" />
                    </Pressable>
                  </View>

                  {/* Results Count & Sort Dropdown */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#2A1808' }}>
                      {L(`Hiển thị ${filteredTests.length} kết quả cho "${searchQuery || 'Tất cả'}"`, `Showing ${filteredTests.length} results`)}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 12, color: '#7C6552' }}>Sắp xếp:</Text>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6DACB', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#2A1808' }}>Mới nhất → cũ nhất</Text>
                        <Text style={{ fontSize: 10, color: '#7C6552' }}>▼</Text>
                      </View>
                    </View>
                  </View>

                  {/* Grid of Test Cards matching input_file_2 - Large, Balanced Covers */}
                  {sectionGroups.map((g) => (
                  <View key={g.key} style={{ gap: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 20, fontWeight: '900' as never, color: '#2A1808' }}>{g.label}</Text>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: '#F3E7D3' }}>
                      <Text style={{ fontSize: 12, fontWeight: '800' as never, color: '#B94A70' }}>{g.items.length}</Text>
                    </View>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#E6DACB' }} />
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                    {g.items.map((item) => {
                      const isCam = item.source.toLowerCase().includes('cambridge');

                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => loadTest(item.id)}
                          style={{
                            flex: 1,
                            minWidth: 420,
                            maxWidth: 540,
                            borderRadius: 16,
                            backgroundColor: '#FFFFFF',
                            borderWidth: 1,
                            borderColor: '#EFE5D8',
                            padding: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 16,
                            shadowColor: '#784415',
                            shadowOpacity: 0.05,
                            shadowRadius: 10,
                            shadowOffset: { width: 0, height: 3 },
                          }}

                        >
                          {/* Large, Beautiful Book Cover Thumbnail - Further Enlarged */}
                          <View
                            style={{
                              width: 122,
                              height: 136,
                              borderRadius: 12,
                              overflow: 'hidden',
                              backgroundColor: '#0A1E33',
                              shadowColor: '#000',
                              shadowOpacity: 0.26,
                              shadowRadius: 10,
                              shadowOffset: { width: 2, height: 5 },
                            }}
                          >
                            <FlatCover kind={isCam ? 'CAMBRIDGE' : 'ACTUAL VOL'} num={numOf(item.source)} width={122} height={136} radius={12} />
                          </View>

                          {/* Card Content */}
                          <View style={{ flex: 1, gap: 6 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View
                                style={{
                                  paddingHorizontal: 8,
                                  paddingVertical: 2.5,
                                  borderRadius: 5,
                                  backgroundColor: isCam ? '#E0F2FE' : '#FCE7F3',
                                }}
                              >
                                <Text style={{ fontSize: 10.5, fontWeight: '800', color: isCam ? '#0369A1' : '#9D174D' }}>
                                  {isCam ? 'CAMBRIDGE' : item.source.toLowerCase().includes('vol') ? 'VOLUME' : 'IELTS'}
                                </Text>
                              </View>

                              {item.section ? (
                                <View style={{ paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 5, backgroundColor: '#FEF3C7' }}>
                                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#B45309' }}>
                                    {item.section}
                                  </Text>
                                </View>
                              ) : null}
                            </View>

                            <Text style={{ fontSize: 15.5, fontWeight: '800', color: '#1E293B', lineHeight: 22 }} numberOfLines={2}>
                              {item.title}
                            </Text>

                            <Text style={{ fontSize: 12.5, color: '#64748B', fontWeight: '500' }}>
                              {`${item.questionCount} ${L('câu', 'questions')} · ${item.pageCount} ${L('trang đề', 'pages')}${item.hasAnswerKey ? ` · ${L('có đáp án', 'answer key')}` : ''}${item.answerKeyVerified ? ` · ${L('đã đối chiếu', 'verified')}` : ''}`}
                            </Text>
                            {!item.externalOnly && item.missingComponents?.includes('audio') ? <Text style={{ fontSize: 12, color: '#92400E' }}>{L('Còn thiếu audio nguồn', 'Source audio missing')}</Text> : null}
                            {!item.externalOnly && item.partCount ? <Text style={{ fontSize: 12, color: '#64748B' }}>{item.partCount} {L('phần học', 'parts')}</Text> : null}
                          </View>

                          {/* Arrow right button */}
                          <View
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              backgroundColor: '#FAF5EE',
                              borderWidth: 1,
                              borderColor: '#F0E5D8',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Icon name="arrow-right" size={15} color="#8F6E36" />
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                  </View>
                  ))}
                </View>
              </View>
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
                  <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 2, color: '#945619', textTransform: 'uppercase' }}>
                    PRACTICE · PROGRESS · HIGHER BANDS
                  </Text>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: '#2A1808', fontFamily: 'BeVietnamPro_800ExtraBold', letterSpacing: -0.5 }}>
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
                    shadowColor: '#945619',
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
                  shadowColor: '#784415',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                <Icon name="search" size={18} color="#945619" />
                <TextInput
                  value={collectionSearch}
                  onChangeText={setCollectionSearch}
                  placeholder={L('Tìm trong bộ sưu tập của bạn...', 'Search in your collections...')}
                  placeholderTextColor="#A38F7E"
                  style={{ flex: 1, height: '100%', paddingHorizontal: 10, color: '#2A1808', fontSize: 14 }}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#FAF5EE' }}>
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
                          backgroundColor: on ? '#8F6E36' : '#FFFFFF',
                          borderWidth: 1,
                          borderColor: on ? '#8F6E36' : '#E6DACB',
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: on ? '#FFFFFF' : '#573E29' }}>
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
                    backgroundColor: '#8F6E36',
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
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#2A1808' }}>
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
                        borderColor: '#EFE7DC',
                        overflow: 'hidden',
                        shadowColor: '#784415',
                        shadowOpacity: 0.04,
                        shadowRadius: 8,
                      }}

                    >
                      <Image source={{ uri: col.img }} style={{ width: '100%', height: 110 }} resizeMode="cover" />
                      <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FAF5EE', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="book" size={16} color="#8F6E36" />
                          </View>
                          <View>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: '#2A1808' }}>{col.title}</Text>
                            <Text style={{ fontSize: 11, color: '#7C6552' }}>{col.desc}</Text>
                          </View>
                        </View>
                        <Icon name="arrow-right" size={14} color="#8F6E36" />
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
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#2A1808' }}>
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
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#2A1808' }}>Mới lưu gần đây</Text>
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
                          borderColor: '#EFE7DC',
                          padding: 12,
                          flexDirection: 'row',
                          gap: 12,
                          alignItems: 'center',
                          shadowColor: '#784415',
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

                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#2A1808' }} numberOfLines={2}>
                            {card.title}
                          </Text>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#16A34A' }}>✓ Đã lưu</Text>
                            <Pressable onPress={() => loadTest(card.id, true)}>
                              <Text style={{ fontSize: 10, fontWeight: '800', color: '#8F6E36' }}>▶ Luyện tiếp</Text>
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
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#2A1808' }}>
                        {L('Gợi ý theo mục tiêu band', 'Suggestions by Band Target')}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, color: '#7C6552' }}>
                      {L('Chọn mục tiêu band để nhận đề phù hợp.', 'Select a target band to get tailored tests.')}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#8F6E36' }}>
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
                        borderColor: '#EFE7DC',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FAF5EE', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 18 }}>{b.icon}</Text>
                        </View>
                        <View>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#2A1808' }}>{b.band}</Text>
                          <Text style={{ fontSize: 12, color: '#7C6552' }}>{b.desc}</Text>
                        </View>
                      </View>
                      <Icon name="arrow-right" size={14} color="#8F6E36" />
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          {/* ========================================================= */}
          {/* VIEW 3: TEST DETAIL & PRACTICE VIEW (input_file_1) */}
          {/* ========================================================= */}
          {viewMode === 'detail' ? (
            <View style={{ gap: 24 }}>
              {/* Breadcrumb Navigation matching input_file_1 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Pressable onPress={() => setViewMode('catalog')}>
                  <Icon name="home" size={16} color="#8F6E36" />
                </Pressable>
                <Text style={{ color: '#A38F7E' }}>›</Text>
                <Pressable onPress={() => setViewMode('catalog')}>
                  <Text style={{ fontSize: 13, color: '#7C6552', fontWeight: '500' }}>Bộ đề IELTS</Text>
                </Pressable>
                <Text style={{ color: '#A38F7E' }}>›</Text>
                <Pressable onPress={() => setViewMode('catalog')}>
                  <Text style={{ fontSize: 13, color: '#7C6552', fontWeight: '500' }}>{test?.source ?? currentTestMeta?.source}</Text>
                </Pressable>
                <Text style={{ color: '#A38F7E' }}>›</Text>
                <Text style={{ fontSize: 13, color: '#2A1808', fontWeight: '700' }}>
                  {test?.title ?? currentTestMeta?.title ?? 'Cambridge IELTS 20 · Reading Test 1'}
                </Text>
              </View>

              {/* Hero Banner Card matching input_file_1 */}
              <View
                style={{
                  borderRadius: 20,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#EFE7DC',
                  padding: 24,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 28,
                  shadowColor: '#784415',
                  shadowOpacity: 0.06,
                  shadowRadius: 16,
                }}
              >
                {/* 3D Book on Golden Pedestal with Cute Mascot Reading beside it (100% matching input_file_1) - ENLARGED */}
                <View
                  style={{
                    width: 280,
                    height: 280,
                    borderRadius: 22,
                    overflow: 'hidden',
                    backgroundColor: '#F6F1EA',
                    shadowColor: '#784415',
                    shadowOpacity: 0.14,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 8 },
                  }}
                >
                  <Image
                    source={{ uri: `/books/covers-2d/${/cambridge/i.test(currentTestMeta?.source ?? '') ? 'cam' : 'vol'}-${numOf(currentTestMeta?.source ?? '') || '20'}.webp` }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                </View>

                {/* Center Info */}
                <View style={{ flex: 1, minWidth: 340, gap: 10 }}>
                  <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#E0F2FE' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#0369A1' }}>CAMBRIDGE</Text>
                  </View>

                  <Text style={{ fontSize: 26, fontWeight: '900', color: '#2A1808', fontFamily: 'BeVietnamPro_800ExtraBold' }}>
                    {test?.title ?? currentTestMeta?.title ?? 'Cambridge IELTS 20 · Reading Test 1'}
                  </Text>

                  {/* Metadata Pills */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 12, color: '#573E29', fontWeight: '600' }}>40 câu hỏi</Text>
                    <Text style={{ fontSize: 12, color: '#573E29', fontWeight: '600' }}>60 phút</Text>
                    <Text style={{ fontSize: 12, color: '#573E29', fontWeight: '600' }}>Độ khó: Trung bình - Khó</Text>
                    <Text style={{ fontSize: 12, color: '#573E29', fontWeight: '600' }}>15 trang</Text>
                  </View>

                  <Text style={{ fontSize: 13, color: '#7C6552', lineHeight: 20 }}>
                    {L(
                      'Đề thi Reading & Listening thực tế từ Cambridge IELTS, hỗ trợ nghe trực tuyến qua OneDrive / SharePoint không tốn dung lượng máy.',
                      'Authentic Cambridge IELTS test with high-speed online OneDrive streaming audio to save disk space.'
                    )}
                  </Text>

                  {/* Cloud Audio Direct Streaming Button */}
                  {(test?.audioCloudUrl || currentTestMeta?.audioCloudUrl) ? (
                    <Pressable
                      onPress={() => Linking.openURL(test?.audioCloudUrl || currentTestMeta?.audioCloudUrl || '')}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                        borderRadius: 10,
                        backgroundColor: '#EFF6FF',
                        borderWidth: 1.5,
                        borderColor: '#93C5FD',
                        alignSelf: 'flex-start',
                      }}
                    >
                      <Icon name="volume" size={16} color="#1D4ED8" />
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E40AF' }}>
                        🎵 Mở Thư Mục Audio Online (OneDrive / SharePoint)
                      </Text>
                      <Icon name="arrow-right" size={14} color="#1D4ED8" />
                    </Pressable>
                  ) : null}

                  {/* Action Buttons */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                    {/* Primary Button 1: Thi Thử Như Thi Thật (CD-IELTS) */}
                    <Pressable
                      onPress={() => {
                        const targetId = selectedId || test?.id || currentTestMeta?.id || 'cambridge-19-reading-1';
                        if (!test || test.id !== targetId) {
                          loadTest(targetId, true, 'simulation');
                        } else {
                          setExamMode('simulation');
                          setIsExamStarted(true);
                        }
                      }}
                      style={{
                        paddingHorizontal: 18,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: '#0F1D33',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 6,
                        shadowColor: '#0F1D33',
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                      }}
                    >
                      <Icon name="target" size={16} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>
                        {isExamStarted && examMode === 'simulation' ? L('Đang thi thật...', 'Exam in progress...') : L('Thi thử như thi thật', 'Real Exam Simulation')}
                      </Text>
                    </Pressable>

                    {/* Primary Button 2: Luyện Tập Tự Do */}
                    <Pressable
                      onPress={() => {
                        const targetId = selectedId || test?.id || currentTestMeta?.id || 'cambridge-19-reading-1';
                        if (!test || test.id !== targetId) {
                          loadTest(targetId, true, 'practice');
                        } else {
                          setExamMode('practice');
                          setIsExamStarted(true);
                        }
                      }}
                      style={{
                        paddingHorizontal: 18,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: '#8C531B',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 6,
                        shadowColor: '#8C531B',
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                      }}
                    >
                      <Icon name="book" size={16} color="#0F1D33" />
                      <Text style={{ color: '#0F1D33', fontSize: 13, fontWeight: '900' }}>
                        {isExamStarted && examMode === 'practice' ? L('Đang luyện tập...', 'Practicing...') : L('Luyện tập tự do', 'Practice Mode')}
                      </Text>
                    </Pressable>

                    {/* Options Modal Trigger Button */}
                    <Pressable
                      onPress={() => setShowModeModal(true)}
                      style={{
                        paddingHorizontal: 14,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: '#FAF5EE',
                        borderWidth: 1,
                        borderColor: '#E6DACB',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 4,
                      }}
                    >
                      <Text style={{ color: '#8F6E36', fontSize: 12, fontWeight: '800' }}>
                        {L('Tùy chọn khác ▾', 'Options ▾')}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setShowAnswerKey(!showAnswerKey)}
                      style={{
                        paddingHorizontal: 16,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E6DACB',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 6,
                      }}
                    >
                      <Icon name="book" size={16} color="#8F6E36" />
                      <Text style={{ color: '#8F6E36', fontSize: 13, fontWeight: '700' }}>
                        {L('Xem đáp án', 'Answer Key')}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => selectedId && toggleSave(selectedId)}
                      style={{
                        paddingHorizontal: 16,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E6DACB',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 6,
                      }}
                    >
                      <Icon name="bookmark" size={16} color={selectedId && savedIds.has(selectedId) ? '#16A34A' : '#7C6552'} />
                      <Text style={{ color: selectedId && savedIds.has(selectedId) ? '#16A34A' : '#7C6552', fontSize: 13, fontWeight: '700' }}>
                        {selectedId && savedIds.has(selectedId) ? L('Đã lưu', 'Saved') : L('Lưu lại', 'Save')}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Right Mini-Card: Tiến độ của bạn */}
                <View
                  style={{
                    width: 220,
                    borderRadius: 16,
                    backgroundColor: '#FAF7F2',
                    borderWidth: 1,
                    borderColor: '#EFE7DC',
                    padding: 16,
                    gap: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Icon name="trending" size={16} color="#8F6E36" />
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#2A1808' }}>
                      {L('Tiến độ của bạn', 'Your Progress')}
                    </Text>
                  </View>

                  {/* Circular progress visual */}
                  <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }}>
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        borderWidth: 6,
                        borderColor: submitted ? '#16A34A' : answeredCount > 0 ? '#8F6E36' : '#E6DACB',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#2A1808' }}>
                        {submitted && grade ? `${Math.round((grade.score / grade.total) * 100)}%` : `${Math.round((answeredCount / (test?.questionCount || 40)) * 100)}%`}
                      </Text>
                      <Text style={{ fontSize: 9.5, color: '#7C6552' }}>
                        {submitted ? 'Đã chấm' : answeredCount > 0 ? 'Đang làm' : 'Chưa làm'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: '#7C6552' }}>Số câu:</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#2A1808' }}>{answeredCount} / {test?.questionCount || 40} câu</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: '#7C6552' }}>Thời gian:</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#8F6E36' }}>{formatTimer(timeLeft)}</Text>
                    </View>
                    {submitted && grade ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: '#7C6552' }}>Điểm IELTS:</Text>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#16A34A' }}>Band {grade.bandEstimate ?? '7.5'}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* 2-Column: Cấu trúc bài thi & Tài liệu đi kèm */}
              <View style={{ flexDirection: 'row', gap: 20 }}>
                {/* Left: Cấu trúc bài thi */}
                <View style={{ flex: 1, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFE7DC', padding: 18, gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Icon name="list" size={16} color="#8F6E36" />
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#2A1808' }}>
                      {L('Cấu trúc bài thi', 'Test Structure')}
                    </Text>
                  </View>

                  {[
                    { num: 1, title: 'Passage 1', q: '13 câu', p: '4–5 trang' },
                    { num: 2, title: 'Passage 2', q: '13 câu', p: '4–5 trang' },
                    { num: 3, title: 'Passage 3', q: '14 câu', p: '5–6 trang' },
                  ].map((row) => (
                    <View
                      key={row.num}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 12,
                        borderRadius: 10,
                        backgroundColor: '#FAF7F2',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#EFE7DC', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#8F6E36' }}>{row.num}</Text>
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#2A1808' }}>{row.title}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Text style={{ fontSize: 12, color: '#7C6552' }}>{row.q}</Text>
                        <Text style={{ fontSize: 12, color: '#7C6552' }}>{row.p}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Right: Tài liệu đi kèm */}
                <View style={{ flex: 1, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFE7DC', padding: 18, gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Icon name="book" size={16} color="#8F6E36" />
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#2A1808' }}>
                      {L('Tài liệu đi kèm', 'Included Materials')}
                    </Text>
                  </View>

                  {[
                    { name: 'Đề thi chính thức (PDF)', ext: 'PDF • Đầy đủ đề', icon: '📄', color: '#EF4444', url: test?.sourceUrl || currentTestMeta?.hasPdf },
                    { name: 'Đáp án chuẩn (Answer Key)', ext: '40/40 câu đã đối chiếu', icon: '📄', color: '#16A34A' },
                    { name: 'Giải thích chi tiết & Trích dẫn', ext: 'Bằng chứng trích đoạn', icon: '📄', color: '#8F6E36' },
                    {
                      name: 'Audio đề thi (OneDrive Cloud)',
                      ext: (test?.audioCloudUrl || currentTestMeta?.audioCloudUrl) ? 'OneDrive Stream • Không tốn dung lượng' : 'MP3 cục bộ',
                      icon: '🎵',
                      color: '#2563EB',
                      url: test?.audioCloudUrl || currentTestMeta?.audioCloudUrl
                    },
                  ].map((doc) => (
                    <Pressable
                      key={doc.name}
                      onPress={() => {
                        if (doc.url) Linking.openURL(String(doc.url));
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 10,
                        borderRadius: 10,
                        backgroundColor: '#FAF7F2',
                        borderWidth: doc.url ? 1 : 0,
                        borderColor: doc.url ? '#BFDBFE' : 'transparent',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Icon name={doc.icon === '🎵' ? 'volume' : 'book'} size={18} color={doc.color} />
                        <View>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#2A1808' }}>{doc.name}</Text>
                          <Text style={{ fontSize: 11, color: '#7C6552' }}>{doc.ext}</Text>
                        </View>
                      </View>
                      <Icon name={doc.url ? "arrow-right" : "arrow-down"} size={14} color="#8F6E36" />
                    </Pressable>
                  ))}
                </View>
              </View>

              {test && !test.externalOnly ? (
                <View style={{ gap: 10 }}>
                  {test.parts?.length ? test.parts.map((part) => (
                    <ExamVocabularyPanel
                      key={`${test.id}-vocab-${part.id}`}
                      exam="ielts"
                      title={`${test.title} · ${part.label}`}
                      pages={part.pages.map((page) => ({ page: page.page, text: page.text })) as ExamTextPage[]}
                      ocrReviewCount={part.pages.reduce((sum, page) => sum + (page.reviewLines?.length ?? 0), 0)}
                    />
                  )) : (
                    <ExamVocabularyPanel
                      exam="ielts"
                      title={test.title}
                      pages={test.pages.map((page) => ({ page: page.page, text: page.text })) as ExamTextPage[]}
                      ocrReviewCount={test.pages.reduce((sum, page) => sum + (page.reviewLines?.length ?? 0), 0)}
                    />
                  )}
                </View>
              ) : null}

              {/* SECTION: Interactive Test Practice Area (When user clicked "Bắt đầu làm bài") */}
              {isExamStarted && test ? (
                <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={() => setIsExamStarted(false)}>
                <View style={{ flex: 1, backgroundColor: '#F5F5F7' }}>
                  <SourceExamRoom key={`${test.id}:${examMode}`} test={test} simulation={examMode === 'simulation'}
                    answers={answers} onAnswerChange={updateAnswer} onSubmit={submit} onExit={() => setIsExamStarted(false)}
                    grade={grade} submitted={submitted} loading={loading} supportPages={support} />
                </View>
                </Modal>
              ) : null}

              {/* SECTION: Đề thi liên quan (Related Tests matching input_file_1) */}
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Icon name="book" size={16} color="#8F6E36" />
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#2A1808' }}>
                      {L('Đề thi liên quan', 'Related Tests')}
                    </Text>
                  </View>

                  <Pressable onPress={() => setViewMode('catalog')}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#8F6E36' }}>
                      {L('Xem tất cả Cambridge 20 →', 'View all Cambridge 20 →')}
                    </Text>
                  </Pressable>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
                  {[
                    { title: 'Reading Test 1', q: '40 câu', t: '60 phút', id: 'cambridge-20-test-1' },
                    { title: 'Reading Test 2', q: '40 câu', t: '60 phút', id: 'cambridge-20-test-2' },
                    { title: 'Reading Test 3', q: '40 câu', t: '60 phút', id: 'cambridge-20-test-3' },
                    { title: 'Reading Test 4', q: '40 câu', t: '60 phút', id: 'cambridge-20-test-4' },
                  ].map((rel) => (
                    <Pressable
                      key={rel.id}
                      onPress={() => loadTest(rel.id)}
                      style={{
                        flex: 1,
                        minWidth: 240,
                        padding: 12,
                        borderRadius: 14,
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#EFE7DC',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        shadowColor: '#784415',
                        shadowOpacity: 0.04,
                        shadowRadius: 8,
                      }}
                    >
                      <FlatCover kind="CAMBRIDGE" num="20" width={70} height={78} radius={8} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ alignSelf: 'flex-start', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: '#E0F2FE' }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#0369A1' }}>CAMBRIDGE</Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#2A1808' }}>{rel.title}</Text>
                        <Text style={{ fontSize: 11, color: '#7C6552' }}>{rel.q} · {rel.t}</Text>
                      </View>
                      <Icon name="arrow-right" size={14} color="#8F6E36" />
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          ) : null}

        </View>
      </ScrollView>

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
