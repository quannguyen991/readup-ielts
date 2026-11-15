import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';

import { NEON_COLORS, NeonHeading, NeonIcon, PixelText } from '@/components/neon/Neon';
import { TodayPlanHero, TodayProgressCard } from '@/components/today/TodayPlan';
import { PhoneHome } from '@/components/home/PhoneHome';
import { Grid } from '@/components/layout/Grid';
import { HeroStat } from '@/components/layout/LightHero';
import { GlossOrb } from '@/components/ui/GlossOrb';
import { Icon, type IconName } from '@/components/ui/Icon';
import { TileArt } from '@/components/ui/TileArt';
import { useL } from '@/i18n/useL';
import { ARTICLES, filterArticles } from '@/data/articles';
import { WRITING_PROMPTS } from '@/data/writing-repository';
import { DICTATION_SENTENCES, TRANSLATION_SENTENCES } from '@/data/sentence-drills';
import { CURRICULUM_TOTALS } from '@/services/math/curriculum';
import { satRwStats } from '@/data/sat-rw-repository';
import { dueEntriesToday } from '@/services/vocab/topic-fsrs';
import { todayKey } from '@/store/persist';
import { useRecentDays, useStreak, useStudyStore } from '@/store/useStudyStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useVocabStore } from '@/store/useVocabStore';
import { useSearchStore } from '@/store/useSearchStore';
import { useAuthStore, useDisplayName } from '@/store/useAuthStore';
import { useRoadmapStore } from '@/store/useRoadmapStore';

/*
  Trang Hôm nay: lời chào và số liệu thật của người học (chuỗi ngày, phút học, từ đến hạn), các khu học dưới
  dạng thẻ có hoạ tiết, và cột tiến độ hôm nay. Cùng khuôn hero và thẻ với các trang luyện thi, không dùng
  nhân vật hay icon minh hoạ riêng. Điện thoại dùng bản kính mờ `PhoneHome`.
*/

const READABLE = ARTICLES.filter((a) => a.licenseType !== 'headline_only').length;
const SAT_QUESTIONS = CURRICULUM_TOTALS.questions + satRwStats().questions;
const SENTENCES = DICTATION_SENTENCES.length + TRANSLATION_SENTENCES.length;

type Area = {
  key: string;
  tone: readonly [string, string];
  icon: IconName;
  href: string;
  title: string;
  line: string;
  count: number;
  unit: string;
};

/** Vòng tiến độ phút học trong ngày: nền xám nhạt, cung màu tím, đầu cung bo tròn. */
function Ring({ size, stroke, pct }: { size: number; stroke: number; pct: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, pct));
  const mid = size / 2;
  return (
    <Svg width={size} height={size}>
      <Circle cx={mid} cy={mid} r={r} stroke="#EFEAFB" strokeWidth={stroke} fill="none" />
      {p > 0 && (
        <Circle
          cx={mid}
          cy={mid}
          r={r}
          stroke="#8B6CF0"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * p} ${c}`}
          transform={`rotate(-90 ${mid} ${mid})`}
        />
      )}
    </Svg>
  );
}

/** Thẻ một khu học: hoạ tiết ở đầu thẻ, quả cầu icon, số lượng và tên. Cùng kiểu với thẻ luyện thi. */
function AreaCard({ area, countText }: { area: Area; countText: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${area.title}. ${area.line}`}
      onPress={() => router.push(area.href as never)}
      style={({ pressed }: { pressed: boolean }) => ({
        borderRadius: 22,
        borderWidth: 2,
        borderColor: NEON_COLORS.indigo,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        opacity: pressed ? 0.94 : 1,
        transform: [{ translateY: pressed ? 3 : 0 }],
        boxShadow: pressed ? '0 2px 0 rgba(42,34,181,0.38)' : '0 5px 0 rgba(42,34,181,0.38)',
      } as object)}
    >
      <View style={{ height: 112 }}>
        <TileArt seed={'home-' + area.key} tone={area.tone} height={112} style={{ borderRadius: 0 }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: 14, bottom: 12 }}>
          <GlossOrb icon={area.icon} tone={area.tone} size={44} />
        </View>
        {area.count > 0 ? (
          <View style={{ position: 'absolute', right: 12, top: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text numberOfLines={1} className="font-strong text-label text-ink">
              {countText}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={{ padding: 14, gap: 4 }}>
        <Text numberOfLines={1} className="font-heavy text-cardTitle text-ink">
          {area.title}
        </Text>
        <Text numberOfLines={2} className="font-sans text-label text-muted" style={{ lineHeight: 17 }}>
          {area.line}
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { L, en } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const fmt = (n: number) => n.toLocaleString(en ? 'en-US' : 'vi-VN');

  const showSearch = useSearchStore((s) => s.show);
  const displayName = useDisplayName();
  // Mục tiêu band: Lộ trình trước, rồi hồ sơ (cùng luật với màn Tiến độ).
  const profileTarget = useAuthStore((s) => s.profile?.targetBand ?? null);
  const roadmapTarget = useRoadmapStore((s) => s.input?.ielts?.target ?? null);
  const streak = useStreak().current;
  const today = todayKey();
  const minutes = useStudyStore((s) => s.daily[today]?.minutes ?? 0);
  const goal = useStudyStore((s) => s.dailyGoalMinutes);
  const readingProgress = useStudyStore((s) => s.progress);
  const sessions = useStudyStore((s) => s.sessions);
  const recentDays = useRecentDays(7);
  const recommended = useMemo(() => {
    const articles = filterArticles({ kind: 'readable', exam: 'ielts', sort: 'easiest' });
    return articles.find((article) => readingProgress[article.id] && (readingProgress[article.id]?.percentCompleted ?? 0) < 100)
      ?? articles.find((article) => !readingProgress[article.id])
      ?? articles[0];
  }, [readingProgress]);
  // Số từ đến hạn lấy từ lịch FSRS thật (cùng định nghĩa với trang Ôn lặp ngắt quãng).
  const vocabEntries = useVocabStore((s) => s.entries);
  const vocabCards = useVocabStore((s) => s.cards);
  const due = useMemo(() => dueEntriesToday({ entries: vocabEntries, cards: vocabCards }, new Date()).length, [vocabEntries, vocabCards, today]);
  const vocabCount = useVocabStore((s) => Object.keys(s.entries).length);
  const completedPassages = Object.values(readingProgress).filter((item) => item.percentCompleted >= 100).length;
  const weeklyMinutes = recentDays.reduce((sum, day) => sum + day.minutes, 0);
  const weeklyQuestions = recentDays.reduce((sum, day) => sum + day.questions, 0);
  const latestSession = sessions[0];
  const hour = new Date().getHours();
  const greeting = hour < 11 ? L('Chào buổi sáng', 'Good morning') : hour < 18 ? L('Chào buổi chiều', 'Good afternoon') : L('Chào buổi tối', 'Good evening');

  const areas: Area[] = [
    {
      key: 'reading',
      tone: ['#B9A9FF', '#6A4BD9'],
      icon: 'book',
      href: '/practice',
      title: 'Reading',
      line: L('IELTS · SAT', 'IELTS · SAT'),
      count: READABLE,
      unit: L('bài', 'passages'),
    },
    {
      key: 'writing',
      tone: ['#FFB8D6', '#D9568F'],
      icon: 'pencil',
      href: '/write',
      title: 'Writing',
      line: L('AI chấm bài', 'AI feedback'),
      count: WRITING_PROMPTS.length,
      unit: L('đề', 'prompts'),
    },
    {
      key: 'sat',
      tone: ['#FFD892', '#E08A1E'],
      icon: 'grid',
      href: '/sat',
      title: 'SAT',
      line: L('Câu hỏi SAT', 'SAT questions'),
      count: SAT_QUESTIONS,
      unit: L('câu', 'questions'),
    },
    {
      key: 'sentences',
      tone: ['#8FE0B0', '#23875E'],
      icon: 'volume',
      href: '/sentence',
      title: L('Luyện câu', 'Sentences'),
      line: L('Chép · dịch', 'Dictate · translate'),
      count: SENTENCES,
      unit: L('câu', 'sentences'),
    },
    {
      key: 'vocab',
      tone: ['#A7B4FF', '#3446C8'],
      icon: 'letters',
      href: '/vocabulary',
      title: L('Sổ từ vựng', 'Word notebook'),
      line: L('Từ kèm câu', 'Words with context'),
      count: vocabCount,
      unit: L('từ', 'words'),
    },
    {
      key: 'math',
      tone: ['#8EC5FF', '#2F6FD6'],
      icon: 'gauge',
      href: '/math',
      title: 'SAT Math',
      line: L('Toán SAT', 'SAT Math'),
      count: CURRICULUM_TOTALS.units,
      unit: L('bài', 'lessons'),
    },
    {
      key: 'hsa',
      tone: ['#9AE6E8', '#1F8A96'],
      icon: 'target',
      href: '/hsa',
      title: 'HSA · English',
      line: L('Đề mô phỏng', 'Mock papers'),
      count: 20,
      unit: L('đề', 'papers'),
    },
    {
      key: 'international',
      tone: ['#FFB4A8', '#D9503E'],
      icon: 'compass',
      href: '/toeic',
      title: 'TOEIC · TOEFL',
      line: L('Sắp có', 'Coming soon'),
      count: 0,
      unit: L('kỳ thi', 'exams'),
    },
  ];

  const pct = goal > 0 ? minutes / goal : 0;
  const goalLine =
    minutes >= goal
      ? L('Đủ mục tiêu hôm nay', 'Daily goal met')
      : L(`Còn ${fmt(goal - minutes)} phút nữa`, `${fmt(goal - minutes)} minutes to go`);

  const labels = en ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const maxDay = Math.max(1, ...recentDays.map((item) => item.minutes));

  // Điện thoại dùng bản kính mờ riêng; máy tính và máy tính bảng dùng bản dưới đây.
  if (!wide && width < 640) {
    return (
      <PhoneHome
        greeting={greeting}
        displayName={displayName}
        minutes={minutes}
        streak={streak}
        targetBand={roadmapTarget ?? profileTarget}
        recommended={recommended}
        planSlot={
          <TodayPlanHero
            wide={false}
            greeting={greeting}
            displayName={displayName}
            recommended={recommended ? { id: recommended.id, title: recommended.title } : null}
            due={due}
            minutes={minutes}
            goal={goal}
            streak={streak}
          />
        }
        en={en}
        L={L}
        onSearch={showSearch}
        due={due}
      />
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 56 }} showsVerticalScrollIndicator={false}>
      <View style={{ width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: wide ? 32 : 16, paddingTop: wide ? 28 : 16, gap: wide ? 28 : 20 }}>
        <TodayPlanHero
          wide={width >= 768}
          greeting={greeting}
          displayName={displayName}
          recommended={recommended ? { id: recommended.id, title: recommended.title } : null}
          due={due}
          minutes={minutes}
          goal={goal}
          streak={streak}
        />

        {/* Thanh ôn lặp ngắt quãng: luôn hiện trên trang Hôm nay, bấm là vào lịch ôn. */}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={L('Ôn lặp ngắt quãng', 'Spaced review')}
          onPress={() => router.push('/vocabulary/spaced-repetition' as never)}
          style={({ pressed }: { pressed: boolean }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderRadius: 22,
            borderWidth: 2,
            borderColor: NEON_COLORS.indigo,
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 16,
            paddingVertical: 12,
            opacity: pressed ? 0.92 : 1,
            boxShadow: '0 5px 0 rgba(42,34,181,0.38)',
          } as object)}
        >
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: NEON_COLORS.indigo, alignItems: 'center', justifyContent: 'center' }}>
            <NeonIcon name="clock" height={30} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <PixelText size={24} color={NEON_COLORS.indigo}>{L('Ôn từ', 'Review')}</PixelText>
            <Text className="font-sans text-label text-muted" numberOfLines={1}>
              {due > 0
                ? L(`${fmt(due)} từ đến hạn`, `${fmt(due)} words due`)
                : L('Chưa có từ đến hạn', 'Nothing due')}
            </Text>
          </View>
          <NeonIcon name="next" height={30} />
        </Pressable>

        <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 28 : 20, alignItems: 'flex-start' }}>
          <View style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%', minWidth: 0, gap: 14 }}>
            <NeonHeading title={L('Khu học', 'Study areas')} icon="book" />
            <Grid columns={3} tabletColumns={2} mobileColumns={2} gap={14}>
              {areas.map((area) => (
                <AreaCard key={area.key} area={area} countText={`${fmt(area.count)} ${area.unit}`} />
              ))}
            </Grid>
          </View>

          <TodayProgressCard
            wide={wide}
            minutes={minutes}
            goal={goal}
            recentDays={recentDays}
            latest={latestSession ? { title: latestSession.articleTitle, correct: latestSession.rawScore, total: latestSession.total, finishedAt: latestSession.finishedAt } : null}
            due={due}
          />
        </View>

        <View style={{ gap: 12 }}>
          <NeonHeading title={L('Góc học', 'Study corner')} icon="heart" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[
              { label: L('Lộ trình cá nhân', 'My study plan'), icon: 'calendar' as const, href: '/plan' },
              { label: L('Xem tiến độ', 'Progress'), icon: 'trending' as const, href: '/progress' },
              { label: L('Lịch sử học', 'Study history'), icon: 'clock' as const, href: '/history' },
            ].map((item) => (
              <Pressable
                key={item.href}
                accessibilityRole="button"
                onPress={() => router.push(item.href as never)}
                style={({ pressed }: { pressed: boolean }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 9,
                  minHeight: 46,
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: NEON_COLORS.indigo,
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 16,
                  opacity: pressed ? 0.92 : 1,
                  boxShadow: '0 4px 0 rgba(42,34,181,0.38)',
                } as object)}
              >
                <Icon name={item.icon} size={17} color="#6A4BD9" strokeWidth={2.2} />
                <Text className="font-strong text-label text-ink">{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
