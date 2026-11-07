import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';

import { BlueHero } from '@/components/home/BlueHero';
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
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F1EEFB',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        opacity: pressed ? 0.94 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
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
      line: L('Bài đọc IELTS và SAT, chấm ngay', 'IELTS and SAT passages, marked at once'),
      count: READABLE,
      unit: L('bài', 'passages'),
    },
    {
      key: 'writing',
      tone: ['#FFB8D6', '#D9568F'],
      icon: 'pencil',
      href: '/write',
      title: 'Writing',
      line: L('AI góp ý theo tiêu chí IELTS', 'AI feedback on IELTS criteria'),
      count: WRITING_PROMPTS.length,
      unit: L('đề', 'prompts'),
    },
    {
      key: 'sat',
      tone: ['#FFD892', '#E08A1E'],
      icon: 'grid',
      href: '/sat',
      title: 'SAT',
      line: L('Đáp án tính bằng code', 'Answers computed by code'),
      count: SAT_QUESTIONS,
      unit: L('câu', 'questions'),
    },
    {
      key: 'sentences',
      tone: ['#8FE0B0', '#23875E'],
      icon: 'volume',
      href: '/sentence',
      title: L('Luyện câu', 'Sentences'),
      line: L('Chép chính tả và dịch câu', 'Dictation and translation'),
      count: SENTENCES,
      unit: L('câu', 'sentences'),
    },
    {
      key: 'vocab',
      tone: ['#A7B4FF', '#3446C8'],
      icon: 'letters',
      href: '/vocabulary',
      title: L('Sổ từ vựng', 'Word notebook'),
      line: L('Mỗi từ lưu kèm câu gặp nó', 'Each word saved with its sentence'),
      count: vocabCount,
      unit: L('từ', 'words'),
    },
    {
      key: 'math',
      tone: ['#8EC5FF', '#2F6FD6'],
      icon: 'gauge',
      href: '/math',
      title: 'SAT Math',
      line: L('Luyện Toán SAT theo từng chặng', 'SAT Math practice, one stage at a time'),
      count: CURRICULUM_TOTALS.units,
      unit: L('bài', 'lessons'),
    },
    {
      key: 'hsa',
      tone: ['#9AE6E8', '#1F8A96'],
      icon: 'target',
      href: '/hsa',
      title: 'HSA · English',
      line: L('20 đề mô phỏng và luyện theo dạng', '20 mock papers and focused practice'),
      count: 20,
      unit: L('đề', 'papers'),
    },
    {
      key: 'international',
      tone: ['#FFB4A8', '#D9503E'],
      icon: 'compass',
      href: '/toeic',
      title: 'TOEIC · TOEFL',
      line: L('Đang cập nhật nội dung mới', 'Content updating'),
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
        <BlueHero
          wide={width >= 768}
          eyebrow={`${greeting}, ${displayName}`}
          chip={L('Mình học', 'Ready for')}
          title={L('tiếp nhé?', 'your next win?')}
          subtitle={
            recommended
              ? L(`Bài kế tiếp: ${recommended.title}`, `Next up: ${recommended.title}`)
              : L(`Mục tiêu hôm nay ${fmt(goal)} phút.`, `Today's goal: ${fmt(goal)} min.`)
          }
          primary={
            recommended
              ? { label: L('Học tiếp', 'Continue'), onPress: () => router.push(`/read/${recommended.id}` as never) }
              : { label: L('Mở luyện đọc', 'Open reading'), onPress: () => router.push('/luyen-doc' as never) }
          }
          secondary={{ label: L('Xem tiến độ', 'View progress'), onPress: () => router.push('/progress' as never) }}
          footer={[
            <HeroStat key="streak" value={fmt(streak)} label={L('ngày liên tiếp', 'day streak')} />,
            <HeroStat key="min" value={fmt(minutes)} label={L('phút hôm nay', 'min today')} />,
            <HeroStat key="due" value={fmt(due)} label={L('từ đến hạn', 'words due')} />,
          ]}
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
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#E5DDFF',
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 18,
            paddingVertical: 14,
            opacity: pressed ? 0.9 : 1,
          } as object)}
        >
          <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: '#F1EBFF', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="clock" size={20} color="#6A4BD9" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text className="font-heavy text-body text-ink">{L('Ôn lặp ngắt quãng', 'Spaced review')}</Text>
            <Text className="font-sans text-label text-muted" numberOfLines={1}>
              {due > 0
                ? L(`${fmt(due)} từ đến hạn hôm nay`, `${fmt(due)} words due today`)
                : L('Chưa có từ đến hạn. Xem lịch ôn.', 'Nothing due yet. See the schedule.')}
            </Text>
          </View>
          <Icon name="chevron-right" size={18} color="#6A4BD9" />
        </Pressable>

        <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 28 : 20, alignItems: 'flex-start' }}>
          <View style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%', minWidth: 0, gap: 14 }}>
            <Text className="font-heavy text-sectionTitle text-ink">{L('Khu học', 'Study areas')}</Text>
            <Grid columns={3} tabletColumns={2} mobileColumns={2} gap={14}>
              {areas.map((area) => (
                <AreaCard key={area.key} area={area} countText={`${fmt(area.count)} ${area.unit}`} />
              ))}
            </Grid>
          </View>

          <View style={{ width: wide ? 330 : '100%', backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#F1EEFB', padding: 20, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text className="font-heavy text-cardTitle text-ink">{L('Hôm nay', 'Today')}</Text>
              <Text className="font-sans text-label text-muted">{goalLine}</Text>
            </View>

            <View style={{ alignSelf: 'center', width: 150, height: 150, alignItems: 'center', justifyContent: 'center' }}>
              <Ring size={150} stroke={12} pct={pct} />
              <View style={{ position: 'absolute', alignItems: 'center' }}>
                <Text className="font-heavy text-ink" style={{ fontSize: 34, lineHeight: 40 }}>
                  {fmt(minutes)}
                </Text>
                <Text className="font-sans text-label text-muted">{L(`/ ${fmt(goal)} phút`, `/ ${fmt(goal)} min`)}</Text>
              </View>
            </View>

            <View style={{ borderTopWidth: 1, borderTopColor: '#F1EEFB', paddingTop: 14 }}>
              <Text className="font-strong text-label text-ink">{L('7 ngày vừa qua', 'Last 7 days')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 72, marginTop: 10, gap: 8 }}>
                {recentDays.map((day, index) => {
                  const barHeight = day.minutes > 0 ? Math.max(8, (day.minutes / maxDay) * 56) : 6;
                  const weekday = new Date(`${day.date}T12:00:00`).getDay();
                  const isToday = index === recentDays.length - 1;
                  return (
                    <View key={`${day.date}-${index}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      <View style={{ width: '100%', maxWidth: 24, height: barHeight, borderRadius: 999, backgroundColor: isToday ? '#E8708A' : '#B9A9FF' }} />
                      <Text className="font-sans text-muted" style={{ fontSize: 11 }}>
                        {labels[weekday]}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <Text className="font-sans text-label text-muted">{`${fmt(weeklyMinutes)} ${L('phút học', 'study minutes')}`}</Text>
                <Text className="font-sans text-label text-muted">{`${fmt(weeklyQuestions)} ${L('câu', 'questions')}`}</Text>
              </View>
            </View>

            <View style={{ borderRadius: 16, backgroundColor: '#F5F2FF', padding: 12 }}>
              <Text className="font-strong text-label text-ink">
                {latestSession
                  ? L(`Lượt gần nhất · ${latestSession.articleTitle}`, `Last session · ${latestSession.articleTitle}`)
                  : L('Bài luyện đầu tiên đang chờ bạn', 'Your first practice is waiting')}
              </Text>
              <Text className="font-sans text-label text-muted" style={{ marginTop: 2 }}>
                {latestSession
                  ? L(
                      `${latestSession.rawScore}/${latestSession.total} câu đúng · ${new Date(latestSession.finishedAt).toLocaleDateString('vi-VN')}`,
                      `${latestSession.rawScore}/${latestSession.total} correct · ${new Date(latestSession.finishedAt).toLocaleDateString('en-US')}`,
                    )
                  : L('Mỗi buổi học sẽ giúp trang này hiểu bạn hơn.', 'Your dashboard will get more personal as you practise.')}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/vocabulary/spaced-repetition' as never)}
              style={({ pressed }: { pressed: boolean }) => ({
                height: 48,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1B1140',
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <Text className="font-strong" style={{ fontSize: 15, color: '#FFFFFF' }}>
                {due > 0 ? L(`Ôn ${fmt(due)} từ`, `Review ${fmt(due)} words`) : L('Xem lịch ôn', 'See review schedule')}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <Text className="font-heavy text-cardTitle text-ink">{L('Góc học tập của bạn', 'Your study corner')}</Text>
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
                  borderWidth: 1,
                  borderColor: '#EAE4F8',
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 16,
                  opacity: pressed ? 0.92 : 1,
                })}
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
