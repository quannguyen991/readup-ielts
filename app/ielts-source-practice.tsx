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
import Svg, { Circle, Defs, G, LinearGradient as SvgGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Icon } from '@/components/ui/Icon';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { useL } from '@/i18n/useL';
import { ExamModeModal, type ExamMode } from '@/components/ielts/ExamModeModal';
import { SourceExamRoom } from '@/components/ielts/SourceExamRoom';
import { PracticeTestDetail } from '@/components/ielts/PracticeTestDetail';
import { ExamResourceLinks } from '@/components/exam/ExamResourceLinks';
import { ExamVocabularyPanel, type ExamTextPage } from '@/components/exam/ExamVocabularyPanel';
import { compareSourceTests, SECTION_MINUTES, type ExamPart, type SourcePage } from '@/services/ielts/source-catalog';
import { color } from '@/theme/tokens';

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
 * Bìa đề IELTS 21 vẽ lại: nền navy có ánh vàng, quyển sách mở có vầng sáng, vài ngôi sao.
 * Hoàn toàn tự vẽ bằng SVG, không dùng ảnh bìa của nhà xuất bản.
 */
function Cover21({ width, height, radius = 10 }: { width: number; height: number; radius?: number }) {
  const pad = Math.round(width * 0.1);
  return (
    <View style={{ width, height, borderRadius: radius, overflow: 'hidden', backgroundColor: color.ink }}>
      <Svg width={width} height={height} viewBox="0 0 300 360" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', top: 0, left: 0 }}>
        <Defs>
          <SvgGradient id="c21bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1B2D4D" />
            <Stop offset="1" stopColor="#0A1424" />
          </SvgGradient>
          <SvgGradient id="c21gold" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F6E3A8" />
            <Stop offset="0.5" stopColor="#D9B46A" />
            <Stop offset="1" stopColor="#6A4BD9" />
          </SvgGradient>
          <RadialGradient id="c21glow" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#E9C978" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#E9C978" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="300" height="360" fill="url(#c21bg)" />
        <Circle cx="210" cy="150" r="150" fill="url(#c21glow)" />
        <G fill="none" stroke="#D9B46A" strokeOpacity="0.28" strokeWidth="1">
          <Circle cx="210" cy="150" r="72" />
          <Circle cx="210" cy="150" r="112" />
          <Circle cx="210" cy="150" r="152" />
        </G>
        {/* quyển sách mở */}
        <Path d="M46 222 Q98 200 150 232 L150 318 Q98 290 46 310 Z" fill="url(#c21gold)" />
        <Path d="M254 222 Q202 200 150 232 L150 318 Q202 290 254 310 Z" fill="#F3E2B6" />
        <Path d="M150 232 V318" stroke="#0F1D33" strokeOpacity="0.35" strokeWidth="2" />
        <Path d="M68 248 Q104 236 136 250 M68 266 Q104 254 136 268 M68 284 Q100 274 136 286" stroke="#0F1D33" strokeOpacity="0.25" strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d="M164 250 Q196 236 232 248 M164 268 Q196 254 232 266 M164 286 Q196 274 232 284" stroke="#0F1D33" strokeOpacity="0.25" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* sao lấp lánh */}
        <Path d="M236 58 L240 72 L254 76 L240 80 L236 94 L232 80 L218 76 L232 72 Z" fill="#F6E3A8" />
        <Path d="M64 78 L66.5 85 L74 87.5 L66.5 90 L64 97 L61.5 90 L54 87.5 L61.5 85 Z" fill="#D9B46A" />
        <Circle cx="268" cy="124" r="2.6" fill="#F6E3A8" />
        <Circle cx="40" cy="160" r="2" fill="#D9B46A" />
      </Svg>
      <View style={{ flex: 1, padding: pad, justifyContent: 'space-between' }}>
        <Text style={{ color: 'rgba(246,227,168,0.9)', fontSize: Math.max(8, Math.round(width * 0.075)), fontWeight: '700', letterSpacing: 2 }}>IELTS</Text>
        <View>
          <Text style={{ color: color.surface, fontSize: Math.round(width * 0.36), fontFamily: 'InterTight_600SemiBold', lineHeight: Math.round(width * 0.38), letterSpacing: -2 }}>21</Text>
          <Text style={{ color: '#F6E3A8', fontSize: Math.max(9, Math.round(width * 0.085)), fontWeight: '600', marginTop: 4 }}>Practice tests</Text>
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: Math.max(7, Math.round(width * 0.068)), letterSpacing: 0.4 }}>Reading · Listening · Writing</Text>
      </View>
    </View>
  );
}

/**
 * Bìa của một đề: ảnh 2D đã tạo sẵn trong public/books/covers-2d (cam-N.png, vol-N.png).
 */
function FlatCover({ kind, num, width, height, radius = 10 }: { kind: 'CAMBRIDGE' | 'ACTUAL VOL'; num: string; width: number; height: number; radius?: number }) {
  const n = parseInt(num, 10) || 0;
  if (n === 21) return <Cover21 width={width} height={height} radius={radius} />;
  if (n === 0 || (kind === 'ACTUAL VOL' && n > 10)) return <FlatCoverDrawn kind={kind} num={num || 'IELTS'} width={width} height={height} radius={radius} />;
  const src = `/books/covers-2d/${kind === 'CAMBRIDGE' ? 'cam' : 'vol'}-${n}.webp`;
  return <Image source={{ uri: src }} style={{ width, height, borderRadius: radius }} resizeMode="cover" />;
}

/** Màu nền bìa theo số đề: mỗi đề một màu cố định, để nhìn lướt là nhận ra. */
const COVER_PALETTE = [color.ink, '#0F766E', '#6B3FA0', '#9F1239', '#166534', '#334155', color.primaryDark, '#3730A3', '#0E7490', color.ink];

const SKILL_IN_ID = /-(reading|listening)(?=-|$)/;
/** Các bản Reading và Listening của cùng một đề (cùng id, khác kỹ năng). */
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
  const bg = COVER_PALETTE[n % COVER_PALETTE.length] ?? color.ink;
  const pad = Math.round(width * 0.09);
  const small = Math.max(8, Math.round(width * 0.085));
  return (
    <View style={{ width, height, borderRadius: radius, backgroundColor: bg, padding: pad, justifyContent: 'space-between', overflow: 'hidden' }}>
      <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: small, fontWeight: '800', letterSpacing: 1 }}>
        {kind === 'CAMBRIDGE' ? 'CAMBRIDGE' : 'ACTUAL TESTS'}
      </Text>
      <Text style={{ color: color.surface, fontSize: Math.round(width * 0.4), fontWeight: '900', lineHeight: Math.round(width * 0.44) }}>
        {num || '—'}
      </Text>
      <View style={{ marginHorizontal: -pad, marginBottom: -pad, paddingHorizontal: pad, paddingVertical: Math.round(pad * 0.7), backgroundColor: 'rgba(0,0,0,0.18)' }}>
        <Text style={{ color: color.surface, fontSize: small, fontWeight: '700' }}>IELTS</Text>
      </View>
    </View>
  );
}

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
  const openTest = (id: string) => {
    scrollToTop();
    void loadTest(id);
  };
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
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#2B2350', width: 64 }}>
                  {L('Bộ đề:', 'Collection:')}
                </Text>
                <Pressable
                  onPress={() => setCollectionFilter('all')}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: collectionFilter === 'all' ? '#6A4BD9' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: collectionFilter === 'all' ? '#6A4BD9' : '#E6DACB',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: collectionFilter === 'all' ? '#FFFFFF' : '#2B2350' }}>
                    {L(`Tất cả (${tests.length})`, `All (${tests.length})`)}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setCollectionFilter('cambridge')}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: collectionFilter === 'cambridge' ? '#6A4BD9' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: collectionFilter === 'cambridge' ? '#6A4BD9' : '#E6DACB',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: collectionFilter === 'cambridge' ? '#FFFFFF' : '#2B2350' }}>
                    Cambridge IELTS (21 → 8)
                  </Text>
                  <Text style={{ fontSize: 10, color: collectionFilter === 'cambridge' ? '#FFFFFF' : '#2B2350' }}>▼</Text>
                </Pressable>

                <Pressable
                  onPress={() => setCollectionFilter('vol')}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: collectionFilter === 'vol' ? '#6A4BD9' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: collectionFilter === 'vol' ? '#6A4BD9' : '#E6DACB',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: collectionFilter === 'vol' ? '#FFFFFF' : '#2B2350' }}>
                    {L('Vol · Mới nhất trước', 'Volumes · Newest first')}
                  </Text>
                </Pressable>
              </View>

              {/* Quick Filters Row 2: Kỹ năng */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#2B2350', width: 64 }}>
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
                        backgroundColor: on ? '#6A4BD9' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: on ? '#6A4BD9' : '#E6DACB',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: on ? '#FFFFFF' : '#2B2350' }}>
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
                    shadowColor: '#2B2350',
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                  }}
                >
                  <Icon name="search" size={18} color="#6A4BD9" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Cam 19 Reading..."
                    placeholderTextColor="#A38F7E"
                    style={{ flex: 1, height: '100%', paddingHorizontal: 10, color: '#2B2350', fontSize: 14, fontWeight: '500' }}
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
                  <Icon name="filter" size={16} color="#6A4BD9" />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#6A4BD9' }}>
                    {L('Bộ lọc', 'Filter')}
                  </Text>
                </Pressable>
              </View>

              {/* Active Filter Chips Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6DACB' }}>
                  <Text style={{ fontSize: 12, color: '#2B2350', fontWeight: '600' }}>{collectionFilter === 'all' ? L('Mọi bộ đề', 'All collections') : collectionFilter === 'cambridge' ? 'Cambridge (21 → 8)' : 'Volumes'}</Text>
                  <Pressable onPress={() => setCollectionFilter('all')}>
                    <Icon name="close" size={12} color="#A38F7E" />
                  </Pressable>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6DACB' }}>
                  <Text style={{ fontSize: 12, color: '#2B2350', fontWeight: '600' }}>{sectionFilter === 'all' ? L('Mọi kỹ năng', 'All skills') : sectionFilter}</Text>
                  <Pressable onPress={() => setSectionFilter('all')}>
                    <Icon name="close" size={12} color="#A38F7E" />
                  </Pressable>
                </View>

                {searchQuery ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6DACB' }}>
                    <Text style={{ fontSize: 12, color: '#2B2350', fontWeight: '600' }}>Từ khóa: {searchQuery}</Text>
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
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#6A4BD9', marginLeft: 4 }}>
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
                    borderColor: '#F3F0FB',
                    padding: 16,
                    gap: 16,
                    shadowColor: '#2B2350',
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="filter" size={18} color="#6A4BD9" />
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#2B2350' }}>
                      {L('Bộ lọc', 'Filters')}
                    </Text>
                  </View>

                  {/* Filter Group: Bộ đề */}
                  <View style={{ gap: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#2B2350' }}>
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
                              borderColor: on ? '#6A4BD9' : '#C7B7A6',
                              backgroundColor: '#FFFFFF',
                            }}
                          />
                          <Text style={{ fontSize: 13, color: on ? '#2B2350' : '#6A5645', fontWeight: on ? '700' : '500' }}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Filter Group: Kỹ năng */}
                  <View style={{ gap: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#2B2350' }}>
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
                              backgroundColor: on ? '#6A4BD9' : '#FFFFFF',
                              borderWidth: 1.5,
                              borderColor: on ? '#6A4BD9' : '#C7B7A6',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {on ? <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text> : null}
                          </View>
                          <Text style={{ fontSize: 13, color: on ? '#2B2350' : '#6A5645', fontWeight: on ? '700' : '500' }}>
                            {s}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Filter Slider: Số câu & Số trang */}
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#2B2350' }}>Số câu</Text>
                      <Text style={{ fontSize: 12, color: '#6A4BD9', fontWeight: '700' }}>0 – 60</Text>
                    </View>
                    <View style={{ height: 4, borderRadius: 2, backgroundColor: '#F3F0FB' }}>
                      <View style={{ width: '100%', height: '100%', backgroundColor: '#6A4BD9', borderRadius: 2 }} />
                    </View>
                  </View>

                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#2B2350' }}>Số trang</Text>
                      <Text style={{ fontSize: 12, color: '#6A4BD9', fontWeight: '700' }}>0 – 40</Text>
                    </View>
                    <View style={{ height: 4, borderRadius: 2, backgroundColor: '#F3F0FB' }}>
                      <View style={{ width: '100%', height: '100%', backgroundColor: '#6A4BD9', borderRadius: 2 }} />
                    </View>
                  </View>

                  <Pressable
                    style={{
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: '#6A4BD9',
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
                      backgroundColor: '#F3F0FB',
                      borderWidth: 1,
                      borderColor: '#F3F0FB',
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
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#6A4BD9', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {L('Đề xuất cho bạn', 'Recommended for you')}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: '#2B2350', fontFamily: 'BeVietnamPro_800ExtraBold' }}>
                        Cambridge IELTS 20 · Reading Test 1
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
                      <FlatCover kind="CAMBRIDGE" num="20" width={120} height={120} radius={12} />
                    </View>

                    <Pressable
                      onPress={() => loadTest('cambridge-20-reading-1')}
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
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#6A4BD9' }}>
                        {L('Xem ngay', 'View now')}
                      </Text>
                      <Icon name="arrow-right" size={14} color="#6A4BD9" />
                    </Pressable>
                  </View>

                  {/* Results Count & Sort Dropdown */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#2B2350' }}>
                      {L(`Hiển thị ${filteredTests.length} kết quả cho "${searchQuery || 'Tất cả'}"`, `Showing ${filteredTests.length} results`)}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 12, color: '#7C6552' }}>Sắp xếp:</Text>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6DACB', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#2B2350' }}>Mới nhất → cũ nhất</Text>
                        <Text style={{ fontSize: 10, color: '#7C6552' }}>▼</Text>
                      </View>
                    </View>
                  </View>

                  {/* Grid of Test Cards matching input_file_2 - Large, Balanced Covers */}

                  {sectionGroups.map((g) => (
                  <View key={g.key} style={{ gap: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 20, fontWeight: '900' as never, color: '#2B2350' }}>{g.label}</Text>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: '#F3F0FB' }}>
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
                          onPress={() => openTest(item.id)}
                          style={{
                            opacity: 1,
                            flex: 1,
                            minWidth: 420,
                            maxWidth: 540,
                            borderRadius: 16,
                            backgroundColor: '#FFFFFF',
                            borderWidth: 1,
                            borderColor: '#F3F0FB',
                            padding: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 16,
                            shadowColor: '#2B2350',
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
                                <View style={{ paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 5, backgroundColor: '#F3F0FB' }}>
                                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#6A4BD9' }}>
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
                            {!item.externalOnly && item.missingComponents?.includes('audio') ? <Text style={{ fontSize: 12, color: '#6A4BD9' }}>{L('Còn thiếu audio nguồn', 'Source audio missing')}</Text> : null}
                            {!item.externalOnly && item.partCount ? <Text style={{ fontSize: 12, color: '#64748B' }}>{item.partCount} {L('phần học', 'parts')}</Text> : null}
                          </View>

                          {/* Arrow right button */}
                          <View
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              backgroundColor: '#F3F0FB',
                              borderWidth: 1,
                              borderColor: '#F3F0FB',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Icon name="arrow-right" size={15} color="#6A4BD9" />
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
