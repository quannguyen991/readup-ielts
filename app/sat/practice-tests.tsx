import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
  useWindowDimensions,
  type TextProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Icon } from '@/components/ui/Icon';
import {
  SAT_FORM_CATEGORIES,
  SAT_PRACTICE_FORMS,
  type SatFormCategory,
  type SatPracticeForm,
} from '@/services/sat-practice/forms';
import { useL } from '@/i18n/useL';
import { ExamResourceLinks } from '@/components/exam/ExamResourceLinks';

/** Phông Plus Jakarta Sans hiện đại, cao cấp và sắc nét cho toàn bộ màn luyện đề SAT. */
function fontFor(weight: unknown): string {
  switch (String(weight)) {
    case '900':
    case '800':
      return 'PlusJakartaSans_800ExtraBold';
    case '700':
    case 'bold':
      return 'PlusJakartaSans_700Bold';
    case '600':
      return 'PlusJakartaSans_600SemiBold';
    case '500':
      return 'PlusJakartaSans_500Medium';
    default:
      return 'PlusJakartaSans_400Regular';
  }
}

/** Mọi chữ trên trang bộ đề đi qua đây để dùng đúng phông Band 9. */
function Text(props: TextProps) {
  const flat = StyleSheet.flatten(props.style) as { fontWeight?: unknown } | undefined;
  return <RNText {...props} style={[{ fontFamily: fontFor(flat?.fontWeight) }, props.style]} />;
}

/* Bảng màu và chủ đề bìa sách cho từng danh mục SAT */
const COVER_THEMES: Record<
  SatFormCategory,
  { bg: [string, string, string]; header: string; badge: string; accent: string; sub: string; glow: string }
> = {
  official_bluebook: {
    bg: ['#1E3A8A', '#2563EB', '#1D4ED8'],
    header: 'BLUEBOOK MOCK',
    badge: 'OFFICIAL',
    accent: '#93C5FD',
    sub: 'COLLEGE BOARD',
    glow: 'rgba(37,99,235,0.35)',
  },
  real_test_2025: {
    bg: ['#047857', '#059669', '#0D9488'],
    header: 'REAL TEST 2025',
    badge: 'THI THẬT',
    accent: '#6EE7B7',
    sub: 'HARD MODULE',
    glow: 'rgba(5,150,105,0.35)',
  },
  real_test_2024: {
    bg: ['#5B21B6', '#7C3AED', '#6D28D9'],
    header: 'REAL TEST 2024',
    badge: 'THI THẬT',
    accent: '#C4B5FD',
    sub: 'FIRST DSAT',
    glow: 'rgba(124,58,237,0.35)',
  },
  reading_special: {
    bg: ['#0F766E', '#0D9488', '#14B8A6'],
    header: 'READING SPECIAL',
    badge: 'READING',
    accent: '#5EEAD4',
    sub: 'PASSAGE DRILL',
    glow: 'rgba(13,148,136,0.35)',
  },
  princeton_review: {
    bg: ['#9F1239', '#E11D48', '#BE123C'],
    header: 'PRINCETON PREP',
    badge: 'PREMIUM',
    accent: '#FDA4AF',
    sub: '6 PRACTICE TESTS',
    glow: 'rgba(225,29,72,0.35)',
  },
  panda_math: {
    bg: ['#6A4BD9', '#6A4BD9', '#6A4BD9'],
    header: 'COLLEGE PANDA',
    badge: '800 MATH',
    accent: '#FDE68A',
    sub: 'ADVANCED MATH',
    glow: 'rgba(217,119,6,0.35)',
  },
  mcgraw_barron: {
    bg: ['#1E293B', '#334155', '#475569'],
    header: 'MCGRAW & BARRON',
    badge: '600+ DSAT',
    accent: '#CBD5E1',
    sub: 'FULL STAMINA',
    glow: 'rgba(51,65,85,0.35)',
  },
};

/**
 * Bìa sách 2D cao cấp của đề SAT phong cách Band 9:
 * - Dải phản quang gáy sách bên trái (3D spine)
 * - Gradient đa tầng mềm mại, màu sắc rực rỡ và hài hòa
 * - Thẻ dải tiêu đề kính mờ
 * - Số đề to nổi bật sắc nét
 * - Huy hiệu phân loại và linh vật chibi Band 9
 */
function FlatSatCover({
  number,
  category,
  width = 122,
  height = 136,
  radius = 14,
}: {
  number: number;
  category: SatFormCategory;
  width?: number;
  height?: number;
  radius?: number;
}) {
  const theme = COVER_THEMES[category] ?? COVER_THEMES.official_bluebook;
  const numStr = String(number);

  return (
    <LinearGradient
      colors={theme.bg}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width,
        height,
        borderRadius: radius,
        padding: 9,
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1.2,
        borderColor: 'rgba(255,255,255,0.28)',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      {/* Book Spine Highlight Overlay */}
      <LinearGradient
        colors={['rgba(255,255,255,0.38)', 'rgba(255,255,255,0.08)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 8, zIndex: 1 }}
      />

      {/* Top Header Banner: Glass Pill */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(0,0,0,0.18)',
          borderRadius: 6,
          paddingHorizontal: 6,
          paddingVertical: 3,
          zIndex: 2,
        }}
      >
        <Text style={{ fontSize: 8.5, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.6 }}>
          {theme.header}
        </Text>
        <View style={{ width: 4.5, height: 4.5, borderRadius: 2.5, backgroundColor: theme.accent }} />
      </View>

      {/* Center Huge Number */}
      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, zIndex: 2 }}>
        <Text
          style={{
            fontSize: width > 130 ? 46 : 38,
            fontWeight: '900',
            color: '#FFFFFF',
            lineHeight: width > 130 ? 50 : 42,
            letterSpacing: -1,
            textShadowColor: 'rgba(0,0,0,0.35)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 6,
          }}
        >
          {numStr}
        </Text>
        <Text style={{ fontSize: 8.5, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 1.1, marginTop: -2 }}>
          {theme.sub}
        </Text>
      </View>

      {/* Bottom Bar: Badge + Mascot peeking */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', zIndex: 2 }}>
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.22)',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 5,
            borderWidth: 0.8,
            borderColor: 'rgba(255,255,255,0.25)',
          }}
        >
          <Text style={{ fontSize: 8, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.4 }}>
            {theme.badge}
          </Text>
        </View>

        {/* Mascot sticker peeking at bottom-right */}
        <Image
          source={require('@/../assets/illustrations/cute-home/mascot-peace.png')}
          style={{ width: width > 130 ? 44 : 36, height: width > 130 ? 44 : 36, marginBottom: -5, marginRight: -5 }}
          resizeMode="contain"
        />
      </View>
    </LinearGradient>
  );
}

export default function SatPracticeTestsScreen() {
  const { L, en } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 860;

  // Filter States
  const [collectionFilter, setCollectionFilter] = useState<SatFormCategory | 'all'>('all');
  const [sectionFilter, setSectionFilter] = useState<'all' | 'rw' | 'math' | 'full'>('all');
  const [quickPill, setQuickPill] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'newest' | 'bluebook'>('default');

  // Modal State for chosen test
  const [modalTest, setModalTest] = useState<SatPracticeForm | null>(null);

  // Filter & Search Logic
  const filteredTests = useMemo(() => {
    return SAT_PRACTICE_FORMS.filter((item) => {
      // 1. Collection Filter
      if (collectionFilter !== 'all' && item.category !== collectionFilter) {
        return false;
      }
      // 2. Section Filter
      if (sectionFilter === 'rw' && item.category === 'panda_math') {
        return false;
      }
      if (sectionFilter === 'math' && item.category === 'princeton_review' && item.number % 2 === 0) {
        // keep full math or generic
      }
      // 3. Quick Pills
      if (quickPill === 'bluebook' && item.category !== 'official_bluebook') {
        return false;
      }
      if (quickPill === 'real2025' && item.category !== 'real_test_2025') {
        return false;
      }
      if (quickPill === 'real2024' && item.category !== 'real_test_2024') {
        return false;
      }
      if (quickPill === 'reading' && item.category !== 'reading_special') {
        return false;
      }
      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          item.nameVi.toLowerCase().includes(q) ||
          item.nameEn.toLowerCase().includes(q) ||
          item.sourceBook.toLowerCase().includes(q) ||
          item.period.toLowerCase().includes(q) ||
          item.label.toLowerCase().includes(q) ||
          String(item.number).includes(q);
        if (!match) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return b.number - a.number;
      }
      if (sortBy === 'bluebook') {
        if (a.category === 'official_bluebook' && b.category !== 'official_bluebook') return -1;
        if (b.category === 'official_bluebook' && a.category !== 'official_bluebook') return 1;
      }
      return a.number - b.number;
    });
  }, [collectionFilter, sectionFilter, quickPill, searchQuery, sortBy]);

  const recommendedTest = SAT_PRACTICE_FORMS[0]!; // Official Bluebook Test 1

  const openTestMode = (form: SatPracticeForm, mode: 'full' | 'rw' | 'math') => {
    setModalTest(null);
    const path = mode === 'math' ? '/sat/math-real-tests' : mode === 'rw' ? '/sat/rw-test' : '/sat/full-test';
    router.push({ pathname: path, params: { form: form.id } } as never);
  };

  const getCollectionLabel = () => {
    const f = SAT_FORM_CATEGORIES.find((c) => c.id === collectionFilter);
    return f ? (en ? f.labelEn : f.labelVi) : 'Tất cả 85 đề';
  };

  return (
    <Screen>
      <View style={{ gap: 18, paddingBottom: 40 }}>
        {/* Breadcrumb Navigation */}
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/sat' as never)}
          style={{ alignSelf: 'flex-start' }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#B94A70' }}>
            {L('← Tổng quan Digital SAT', '← SAT Overview')}
          </Text>
        </Pressable>

        {/* Hero Rounded Header Card matching Image 2 */}
        <LightHero
          badge="DIGITAL SAT · KHO 85 BỘ ĐỀ"
          art="home"
          line1={L('Luyện bộ đề thi thử Digital SAT', 'Digital SAT Practice Tests')}
          line2={L('luyện Reading & Writing và Math theo mục tiêu', 'practice Reading & Writing and Math by goal')}
          footer={
            <>
              <HeroStat value="85" label={L('bộ luyện', 'practice sets')} />
              <HeroStat value="12" label={L('bộ Reading', 'Reading sets')} />
              <HeroStat value="8" label={L('đề Bluebook chính thức', 'official Bluebook tests')} />
              <HeroStat value="30" label={L('đề thi thật 2024–2025', '2024–2025 real tests')} />
            </>
          }
        />

        <ExamResourceLinks exam="sat" />

        {/* Quick Filters Row: Kỹ năng / Phần thi (matching IELTS design) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#2B2350', width: 68 }}>
            {L('Kỹ năng:', 'Skill:')}
          </Text>
          {[
            { id: 'all', label: L('Tất cả', 'All') },
            { id: 'reading', label: 'Chuyên đề Reading (12)' },
            { id: 'rw', label: 'Reading & Writing' },
            { id: 'math', label: 'Math (Toán)' },
            { id: 'full', label: 'Full Digital SAT' },
            { id: 'real2025', label: 'Thi Thật 2025 (15)' },
            { id: 'real2024', label: 'Thi Thật 2024 (15)' },
            { id: 'bluebook', label: 'Official Bluebook (8)' },
          ].map((sec) => {
            const on = quickPill === sec.id;
            return (
              <Pressable
                key={sec.id}
                onPress={() => {
                  setQuickPill(sec.id);
                  if (sec.id === 'all') {
                    setSectionFilter('all');
                    setCollectionFilter('all');
                  } else if (sec.id === 'reading') {
                    setCollectionFilter('reading_special');
                    setSectionFilter('all');
                  } else if (sec.id === 'rw') {
                    setSectionFilter('rw');
                  } else if (sec.id === 'math') {
                    setSectionFilter('math');
                  } else if (sec.id === 'full') {
                    setSectionFilter('full');
                  } else if (sec.id === 'real2025') {
                    setCollectionFilter('real_test_2025');
                  } else if (sec.id === 'real2024') {
                    setCollectionFilter('real_test_2024');
                  } else if (sec.id === 'bluebook') {
                    setCollectionFilter('official_bluebook');
                  }
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: on ? '#B94A70' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: on ? '#B94A70' : '#E6DACB',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: on ? '#FFFFFF' : '#2B2350' }}>
                  {sec.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Search Bar matching IELTS screen */}
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
              placeholder={L('Tìm đề SAT: Bluebook 1–6, Đề thi thật 2024–2025, Princeton, Panda Math...', 'Search SAT forms...')}
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
            onPress={() => setShowMobileFilter((v) => !v)}
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
            <Icon name="filter" size={16} color="#B94A70" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#B94A70' }}>
              {L('Bộ lọc', 'Filter')}
            </Text>
          </Pressable>
        </View>

        {/* Active Filter Chips Row */}
        {(collectionFilter !== 'all' || sectionFilter !== 'all' || searchQuery || quickPill !== 'all') ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {collectionFilter !== 'all' ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E6DACB',
                }}
              >
                <Text style={{ fontSize: 12, color: '#2B2350', fontWeight: '600' }}>
                  {getCollectionLabel()}
                </Text>
                <Pressable onPress={() => { setCollectionFilter('all'); setQuickPill('all'); }}>
                  <Icon name="close" size={12} color="#A38F7E" />
                </Pressable>
              </View>
            ) : null}

            {sectionFilter !== 'all' ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E6DACB',
                }}
              >
                <Text style={{ fontSize: 12, color: '#2B2350', fontWeight: '600' }}>
                  {sectionFilter === 'rw' ? 'Reading & Writing' : sectionFilter === 'math' ? 'Math' : 'Full SAT'}
                </Text>
                <Pressable onPress={() => { setSectionFilter('all'); setQuickPill('all'); }}>
                  <Icon name="close" size={12} color="#A38F7E" />
                </Pressable>
              </View>
            ) : null}

            {searchQuery ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E6DACB',
                }}
              >
                <Text style={{ fontSize: 12, color: '#2B2350', fontWeight: '600' }}>
                  {L('Từ khóa:', 'Keyword:')} {searchQuery}
                </Text>
                <Pressable onPress={() => setSearchQuery('')}>
                  <Icon name="close" size={12} color="#A38F7E" />
                </Pressable>
              </View>
            ) : null}

            <Pressable
              onPress={() => {
                setCollectionFilter('all');
                setSectionFilter('all');
                setQuickPill('all');
                setSearchQuery('');
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#B94A70', marginLeft: 4 }}>
                {L('Xóa tất cả', 'Clear all')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* 2-Column Layout matching IELTS source practice screen */}
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: 20, alignItems: 'flex-start' }}>
          {/* Left Sidebar Filter */}
          {(wide || showMobileFilter) && (
            <View
              style={{
                width: wide ? 240 : '100%',
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
                <Icon name="filter" size={18} color="#B94A70" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#2B2350' }}>
                  {L('Bộ lọc', 'Filters')}
                </Text>
              </View>

              {/* Filter Group: Bộ đề */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#2B2350' }}>
                  {L('Bộ đề', 'Collection')}
                </Text>
                {SAT_FORM_CATEGORIES.map((opt) => {
                  const on = collectionFilter === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => {
                        setCollectionFilter(opt.id);
                        setQuickPill('all');
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 }}
                    >
                      <View
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          borderWidth: on ? 5 : 1.5,
                          borderColor: on ? '#B94A70' : '#C7B7A6',
                          backgroundColor: '#FFFFFF',
                        }}
                      />
                      <Text style={{ fontSize: 13, color: on ? '#2B2350' : '#6A5645', fontWeight: on ? '700' : '500' }}>
                        {en ? opt.labelEn : opt.labelVi} ({opt.count})
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Filter Group: Kỹ năng / Phần thi */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#2B2350' }}>
                  {L('Phần thi', 'Section')}
                </Text>
                {[
                  { id: 'all', label: L('Tất cả phần thi', 'All Sections') },
                  { id: 'rw', label: 'Reading & Writing (54 câu)' },
                  { id: 'math', label: 'Math - Toán (44 câu)' },
                  { id: 'full', label: 'Full Digital SAT (98 câu)' },
                ].map((s) => {
                  const on = sectionFilter === s.id;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => {
                        setSectionFilter(s.id as never);
                        setQuickPill('all');
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 }}
                    >
                      <View
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          backgroundColor: on ? '#B94A70' : '#FFFFFF',
                          borderWidth: 1.5,
                          borderColor: on ? '#B94A70' : '#C7B7A6',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {on ? <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text> : null}
                      </View>
                      <Text style={{ fontSize: 13, color: on ? '#2B2350' : '#6A5645', fontWeight: on ? '700' : '500' }}>
                        {s.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Filter Slider: Số câu & Thời lượng */}
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#2B2350' }}>
                    {L('Số câu hỏi', 'Questions')}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#B94A70', fontWeight: '700' }}>0 – 98</Text>
                </View>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: '#F3F0FB' }}>
                  <View style={{ width: '100%', height: '100%', backgroundColor: '#B94A70', borderRadius: 2 }} />
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#2B2350' }}>
                    {L('Thời lượng', 'Duration')}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#B94A70', fontWeight: '700' }}>0 – 134p</Text>
                </View>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: '#F3F0FB' }}>
                  <View style={{ width: '100%', height: '100%', backgroundColor: '#B94A70', borderRadius: 2 }} />
                </View>
              </View>

              {/* Bluebook Feature Tags */}
              <View style={{ gap: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#F3F0FB' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#B94A70', textTransform: 'uppercase' }}>
                  CHẾ ĐỘ THI CHUẨN BLUEBOOK
                </Text>
                <Text style={{ fontSize: 11.5, color: '#7C6552', lineHeight: 16 }}>
                  ✓ 2 Module thích ứng{'\n'}
                  ✓ Đồng hồ đếm lùi có chuông{'\n'}
                  ✓ Gạch đáp án loại trừ ABC{'\n'}
                  ✓ Máy tính Desmos tích hợp
                </Text>
              </View>

              <Pressable
                onPress={() => setShowMobileFilter(false)}
                style={{
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: '#B94A70',
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
          )}

          {/* Right Main Content */}
          <View style={{ flex: 1, gap: 16, width: '100%' }}>
            {/* Highlight Recommendation Card matching Band 9 VIP styling */}
            <View
              style={{
                borderRadius: 20,
                backgroundColor: '#F3F0FB',
                borderWidth: 1.5,
                borderColor: '#F3F0FB',
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                shadowColor: '#B94A70',
                shadowOpacity: 0.08,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              <View style={{ flex: 1, minWidth: 260, gap: 6 }}>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#F3F0FB',
                    paddingHorizontal: 10,
                    paddingVertical: 3.5,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: '#FDE68A',
                  }}
                >
                  <Text style={{ fontSize: 13 }}>👑</Text>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#6A4BD9', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    {L('Luyện tập đề xuất hôm nay', 'Recommended practice today')}
                  </Text>
                </View>

                <Text style={{ fontSize: 21, fontWeight: '900', color: '#0F1D33', letterSpacing: -0.3, marginTop: 2 }}>
                  {recommendedTest.nameVi} · Full SAT
                </Text>

                {/* 3 micro feature tags */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 12, color: '#059669', fontWeight: '700' }}>✓</Text>
                    <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>{L('2 Module thích ứng', '2 Adaptive Modules')}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 12, color: '#059669', fontWeight: '700' }}>✓</Text>
                    <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>{L('Bấm giờ 134p Bluebook', '134 min Bluebook')}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 12, color: '#059669', fontWeight: '700' }}>✓</Text>
                    <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>{L('Lời giải chi tiết', 'Full Explanations')}</Text>
                  </View>
                </View>
              </View>

              {/* Cover Thumbnail for Recommendation */}
              <View style={{ width: 122, height: 136, alignItems: 'center', justifyContent: 'center' }}>
                <FlatSatCover
                  number={recommendedTest.number}
                  category={recommendedTest.category}
                  width={122}
                  height={136}
                  radius={14}
                />
              </View>

              <Pressable
                onPress={() => setModalTest(recommendedTest)}
                style={{
                  paddingHorizontal: 20,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#0F1D33',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                  shadowColor: '#0F1D33',
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                  {L('Làm đề ngay', 'Start test now')}
                </Text>
                <Icon name="arrow-right" size={15} color="#FBBF24" strokeWidth={2.4} />
              </Pressable>
            </View>

            {/* Results Count & Sort Dropdown */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#2B2350' }}>
                {L(`Hiển thị ${filteredTests.length} kết quả cho "${searchQuery || getCollectionLabel()}"`, `Showing ${filteredTests.length} results`)}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 12, color: '#7C6552' }}>
                  {L('Sắp xếp:', 'Sort:')}
                </Text>
                <Pressable
                  onPress={() => {
                    setSortBy((s) => (s === 'default' ? 'newest' : s === 'newest' ? 'bluebook' : 'default'));
                  }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E6DACB',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#2B2350' }}>
                    {sortBy === 'default' ? 'Mặc định' : sortBy === 'newest' ? 'Mới nhất' : 'Bluebook trước'}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#7C6552' }}>▼</Text>
                </Pressable>
              </View>
            </View>

            {/* Grid of SAT Test Cards (matching IELTS source practice screen layout) */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {filteredTests.map((item) => {
                const isBluebook = item.category === 'official_bluebook';
                const isReadingSpecial = item.category === 'reading_special';
                const isReal2025 = item.category === 'real_test_2025';
                const isReal2024 = item.category === 'real_test_2024';
                const isPrinceton = item.category === 'princeton_review';

                const badgeBg = isBluebook
                  ? '#E0F2FE'
                  : isReadingSpecial
                    ? '#CCFBF1'
                    : isReal2025
                      ? '#F3F0FB'
                      : isReal2024
                        ? '#EDE9FE'
                        : isPrinceton
                          ? '#FCE7F3'
                          : '#F3F0FB';

                const badgeFg = isBluebook
                  ? '#0369A1'
                  : isReadingSpecial
                    ? '#0F766E'
                    : isReal2025
                      ? '#6A4BD9'
                      : isReal2024
                        ? '#6D28D9'
                        : isPrinceton
                          ? '#9D174D'
                          : '#6A4BD9';

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setModalTest(item)}
                    style={({ hovered }: { hovered?: boolean }) => ({
                      flex: 1,
                      minWidth: wide ? 420 : '100%',
                      maxWidth: wide ? 560 : '100%',
                      borderRadius: 20,
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1.5,
                      borderColor: hovered ? '#D5BF9F' : '#F3F0FB',
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 16,
                      shadowColor: '#2B2350',
                      shadowOpacity: hovered ? 0.09 : 0.04,
                      shadowRadius: hovered ? 16 : 8,
                      shadowOffset: { width: 0, height: hovered ? 4 : 2 },
                      transform: [{ translateY: hovered ? -2 : 0 }],
                    })}
                  >
                    {/* Beautiful SAT Book Cover Thumbnail */}
                    <View
                      style={{
                        width: 122,
                        height: 136,
                        borderRadius: 14,
                        overflow: 'hidden',
                      }}
                    >
                      <FlatSatCover
                        number={item.number}
                        category={item.category}
                        width={122}
                        height={136}
                        radius={14}
                      />
                    </View>

                    {/* Card Content */}
                    <View style={{ flex: 1, gap: 7 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor: badgeBg,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '800', color: badgeFg, letterSpacing: 0.4 }}>
                            {item.categoryLabelVi.toUpperCase()}
                          </Text>
                        </View>

                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor: '#F3F0FB',
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#6A4BD9', letterSpacing: 0.3 }}>
                            {item.period}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '800',
                          color: '#0F1D33',
                          lineHeight: 22,
                          letterSpacing: -0.2,
                        }}
                        numberOfLines={2}
                      >
                        {en ? item.nameEn : item.nameVi}
                      </Text>

                      <Text style={{ fontSize: 12.5, color: '#64748B', fontWeight: '500', lineHeight: 18 }} numberOfLines={1}>
                        {isReadingSpecial
                          ? `27 câu · 32 phút · Nguồn: ${item.sourceBook}`
                          : `98 câu · 134 phút · ✓ 2 Module thích ứng${item.adaptive ? ' · ✓ Có đáp án' : ''}`}
                      </Text>
                    </View>

                    {/* Arrow right button */}
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: '#F3F0FB',
                        borderWidth: 1,
                        borderColor: '#F3F0FB',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="arrow-right" size={16} color="#B94A70" strokeWidth={2.4} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* SAT Exam Mode Modal: matching IELTS ExamModeModal */}
        {modalTest ? (
          <Modal visible transparent animationType="fade" onRequestClose={() => setModalTest(null)}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(20, 15, 10, 0.65)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20,
              }}
            >
              <View
                style={{
                  width: '100%',
                  maxWidth: 780,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 24,
                  padding: 26,
                  gap: 18,
                  shadowColor: '#000',
                  shadowOpacity: 0.25,
                  shadowRadius: 24,
                  shadowOffset: { width: 0, height: 10 },
                  borderWidth: 1,
                  borderColor: '#F3F0FB',
                }}
              >
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ backgroundColor: '#1E3A8A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                        <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>DIGITAL SAT</Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#6A4BD9', textTransform: 'uppercase', letterSpacing: 1 }}>
                        CHỌN PHƯƠNG THỨC LÀM BÀI
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: '900',
                        color: '#2B2350',
                        lineHeight: 28,
                      }}
                    >
                      {en ? modalTest.nameEn : modalTest.nameVi}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>
                      {modalTest.sourceBook} · {modalTest.period}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => setModalTest(null)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: '#F3F0FB',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="close" size={18} color="#7C6552" />
                  </Pressable>
                </View>

                {/* Choice Cards: clean, punchy, no long essays */}
                <View style={{ gap: 10 }}>
                  {/* Option 1: Full Digital SAT */}
                  <Pressable
                    onPress={() => openTestMode(modalTest, 'full')}
                    style={({ hovered }: { hovered?: boolean }) => ({
                      borderRadius: 16,
                      backgroundColor: '#F3F0FB',
                      borderWidth: 2,
                      borderColor: '#D4AF37',
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 14,
                      opacity: hovered ? 0.92 : 1,
                    })}
                  >
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ backgroundColor: '#B94A70', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>KHUYÊN DÙNG</Text>
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F1D33' }}>
                          🚀 Thi Full Digital SAT
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11.5, color: '#475569', fontWeight: '700' }}>98 câu</Text>
                        </View>
                        <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11.5, color: '#475569', fontWeight: '700' }}>134 phút</Text>
                        </View>
                        <View style={{ backgroundColor: '#F3F0FB', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11.5, color: '#6A4BD9', fontWeight: '700' }}>2 Module thích ứng</Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ paddingHorizontal: 16, height: 40, borderRadius: 10, backgroundColor: '#B94A70', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Bắt đầu ↗</Text>
                    </View>
                  </Pressable>

                  {/* Option 2: Luyện chuyên sâu Reading (Bài đọc SAT) */}
                  <Pressable
                    onPress={() => openTestMode(modalTest, 'rw')}
                    style={({ hovered }: { hovered?: boolean }) => ({
                      borderRadius: 16,
                      backgroundColor: '#F0FDFA',
                      borderWidth: 1.5,
                      borderColor: '#5EEAD4',
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 14,
                      opacity: hovered ? 0.92 : 1,
                    })}
                  >
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F766E' }}>
                        🎯 Luyện chuyên sâu Reading (Bài đọc SAT)
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <View style={{ backgroundColor: '#CCFBF1', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11.5, color: '#0F766E', fontWeight: '700' }}>27 câu đọc hiểu</Text>
                        </View>
                        <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11.5, color: '#475569', fontWeight: '700' }}>32 phút</Text>
                        </View>
                        <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11.5, color: '#0369A1', fontWeight: '700' }}>Văn học & Khoa học</Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ paddingHorizontal: 16, height: 40, borderRadius: 10, backgroundColor: '#0D9488', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Vào luyện ↗</Text>
                    </View>
                  </Pressable>

                  {/* Option 3: Reading & Writing */}
                  <Pressable
                    onPress={() => openTestMode(modalTest, 'rw')}
                    style={({ hovered }: { hovered?: boolean }) => ({
                      borderRadius: 16,
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1.5,
                      borderColor: '#E6DACB',
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 14,
                      opacity: hovered ? 0.92 : 1,
                    })}
                  >
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F1D33' }}>
                        📖 Thi Reading & Writing
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11.5, color: '#475569', fontWeight: '700' }}>54 câu</Text>
                        </View>
                        <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11.5, color: '#475569', fontWeight: '700' }}>64 phút</Text>
                        </View>
                        <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11.5, color: '#1D4ED8', fontWeight: '700' }}>Đọc hiểu & Ngữ pháp</Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ paddingHorizontal: 16, height: 40, borderRadius: 10, backgroundColor: '#F3F0FB', borderWidth: 1, borderColor: '#E6DACB', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#B94A70', fontSize: 13, fontWeight: '700' }}>Vào thi ↗</Text>
                    </View>
                  </Pressable>

                  {/* Option 4: SAT Math */}
                  <Pressable
                    onPress={() => openTestMode(modalTest, 'math')}
                    style={({ hovered }: { hovered?: boolean }) => ({
                      borderRadius: 16,
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1.5,
                      borderColor: '#E6DACB',
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 14,
                      opacity: hovered ? 0.92 : 1,
                    })}
                  >
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F1D33' }}>
                        📐 Thi SAT Math
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11.5, color: '#475569', fontWeight: '700' }}>44 câu</Text>
                        </View>
                        <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11.5, color: '#475569', fontWeight: '700' }}>70 phút</Text>
                        </View>
                        <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11.5, color: '#047857', fontWeight: '700' }}>Máy tính Desmos</Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ paddingHorizontal: 16, height: 40, borderRadius: 10, backgroundColor: '#F3F0FB', borderWidth: 1, borderColor: '#E6DACB', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#B94A70', fontSize: 13, fontWeight: '700' }}>Vào thi ↗</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        ) : null}
      </View>
    </Screen>
  );
}
