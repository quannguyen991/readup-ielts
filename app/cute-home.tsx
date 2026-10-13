import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';

import { Icon } from '@/components/ui/Icon';
import { CuteBook, CutePencil, CuteTrain } from '@/components/illust/Cute';
import { CuteCalculator, CuteChat, CuteNotebook, Motion, Sparkles } from '@/components/illust/CuteMore';
import { Sticker } from '@/components/illust/Sticker';
import { SparkleStar } from '@/components/cute-home/Mascots';
import { PhoneHome } from '@/components/home/PhoneHome';
import { CUTE, CUTE_FONT } from '@/components/cute-home/palette';
import { useRetroStyle } from '@/components/profile-retro/retro-scope';
import { RCREAM, RGOLD, RINK, RLAV, RLEAF, RPAPER, RPEACH, RPINK, RSKY, StarMascot } from '@/components/profile-retro/retro-art';
import { BookIcon, ChatIcon, CompassIcon, GaugeIcon, GridIcon, TargetIcon } from '@/components/profile-retro/retro-icons';
import { useL } from '@/i18n/useL';
import { ARTICLES, filterArticles } from '@/data/articles';
import { WRITING_PROMPTS } from '@/data/writing-repository';
import { DICTATION_SENTENCES, TRANSLATION_SENTENCES } from '@/data/sentence-drills';
import { CURRICULUM_TOTALS } from '@/services/math/curriculum';
import { satRwStats } from '@/data/sat-rw-repository';
import { scheduleSummary } from '@/services/vocab/review-schedule';
import { todayKey } from '@/store/persist';
import { useRecentDays, useStreak, useStudyStore } from '@/store/useStudyStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useVocabStore } from '@/store/useVocabStore';
import { useSearchStore } from '@/store/useSearchStore';
import { useAuthStore, useDisplayName } from '@/store/useAuthStore';
import { useRoadmapStore } from '@/store/useRoadmapStore';
import { PerchCat } from '@/components/mascot/PerchCat';

/** Tư thế mèo bám lên các ô khu vực trên máy tính, lần lượt theo ô. */
const AREA_PERCH = ['sit', 'curl', 'lie', 'stretch'] as const;

/*
  Trang chủ kiểu nhân vật — bản thử giao diện cho Band 9.

  Mọi con số ĐẾM TỪ DỮ LIỆU THẬT (cùng nguồn với trang giới thiệu), không gõ tay.
  Chuỗi ngày, phút học hôm nay, số từ đến hạn lấy từ kho dữ liệu của người dùng.
  Hình minh hoạ và nhân vật là hình tự vẽ (xem Mascots.tsx và illust/).
*/

const READABLE = ARTICLES.filter((a) => a.licenseType !== 'headline_only').length;
const SAT_QUESTIONS = CURRICULUM_TOTALS.questions + satRwStats().questions;
const SENTENCES = DICTATION_SENTENCES.length + TRANSLATION_SENTENCES.length;

/** Bảng màu của trang chủ: kiểu nhân vật (mặc định) hoặc retro (khi đang đeo chủ đề retro). */
const CUTE_LOOK = { ...CUTE, edge: '#FFFFFF', onAccent: '#FFFFFF', shadowAccent: '#D85C7F' } as const;
const RETRO_LOOK = {
  canvas: RCREAM,
  milk: RPAPER,
  ink: RINK,
  inkSoft: '#4A4145',
  line: RINK,
  outline: RINK,
  edge: RINK,
  onAccent: RINK,
  shadowAccent: RINK,
  strawberry: '#E0609A',
  blush: '#FBD9E3',
  pink: RPINK,
  sky: RSKY,
  mint: RLEAF,
  butter: RGOLD,
  lilac: RLAV,
  peach: RPEACH,
  leaf: RLEAF,
} as const;
const RETRO_FONT = { regular: 'Nunito_400Regular', semi: 'Nunito_600SemiBold', bold: 'Nunito_700Bold', heavy: 'Nunito_900Black', black: 'Nunito_900Black' } as const;

/** Icon viền mực thay cho nhân vật cute ở từng khu vực, khi bật giao diện retro. */
const AREA_GLYPH: Record<string, React.ComponentType<{ size?: number }>> = {
  reading: BookIcon,
  writing: ChatIcon,
  sat: GridIcon,
  sentences: ChatIcon,
  vocab: BookIcon,
  math: GaugeIcon,
  hsa: TargetIcon,
  international: CompassIcon,
};

type Obj = (p: { size?: number }) => React.JSX.Element;

/** Vòng tiến độ phút học trong ngày. */
function Ring({ size, stroke, pct }: { size: number; stroke: number; pct: number }) {
  const C = useRetroStyle() ? RETRO_LOOK : CUTE_LOOK;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, pct));
  const mid = size / 2;
  return (
    <Svg width={size} height={size}>
      <Circle cx={mid} cy={mid} r={r} stroke={C.pink} strokeWidth={stroke} fill="none" />
      {p > 0 && (
        <Circle
          cx={mid}
          cy={mid}
          r={r}
          stroke={C.strawberry}
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

/** Viên nhãn dán nhỏ: nền màu, viền trắng dày, chữ đậm. */
function Chip({ text, tone }: { text: string; tone: string }) {
  const retro = useRetroStyle();
  const C = retro ? RETRO_LOOK : CUTE_LOOK;
  const F = retro ? RETRO_FONT : CUTE_FONT;
  return (
    <View style={{ backgroundColor: tone, borderRadius: 14, borderWidth: 3, borderColor: C.edge, paddingHorizontal: 12, paddingVertical: 6, boxShadow: '0 4px 10px rgba(75,58,79,0.10)' } as object}>
      <Text style={{ fontFamily: F.bold, fontSize: 14, lineHeight: 20, color: C.ink }}>{text}</Text>
    </View>
  );
}

export default function CuteHomeScreen() {
  const { L, en } = useL();
  const retro = useRetroStyle();
  const C = retro ? RETRO_LOOK : CUTE_LOOK;
  const F = retro ? RETRO_FONT : CUTE_FONT;
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  // Giao diện retro chừa cột điều hướng bên trái nên ở màn dưới 1280px dùng 2 cột cho thẻ rộng hơn.
  const cols = wide ? (retro && width < 1280 ? 2 : 3) : 2;
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
  const reviews = useTopicStudyStore((s) => s.reviews);
  const due = useMemo(() => scheduleSummary(reviews, today).dueToday, [reviews, today]);
  const vocabCount = useVocabStore((s) => Object.keys(s.entries).length);
  const completedPassages = Object.values(readingProgress).filter((item) => item.percentCompleted >= 100).length;
  const weeklyMinutes = recentDays.reduce((sum, day) => sum + day.minutes, 0);
  const weeklyQuestions = recentDays.reduce((sum, day) => sum + day.questions, 0);
  const latestSession = sessions[0];
  const hour = new Date().getHours();
  const greeting = hour < 11 ? L('Chào buổi sáng', 'Good morning') : hour < 18 ? L('Chào buổi chiều', 'Good afternoon') : L('Chào buổi tối', 'Good evening');

  const areas: { key: string; tone: string; href: string; title: string; line: string; count: number; unit: string; Obj: Obj }[] = [
    {
      key: 'reading',
      tone: C.sky,
      href: '/practice',
      title: 'Reading',
      line: L('Bài đọc IELTS và SAT, chấm ngay', 'IELTS and SAT passages, marked at once'),
      count: READABLE,
      unit: L('bài', 'passages'),
      Obj: CuteBook,
    },
    {
      key: 'writing',
      tone: C.pink,
      href: '/write',
      title: 'Writing',
      line: L('AI góp ý theo tiêu chí IELTS', 'AI feedback on IELTS criteria'),
      count: WRITING_PROMPTS.length,
      unit: L('đề', 'prompts'),
      Obj: CutePencil,
    },
    {
      key: 'sat',
      tone: C.butter,
      href: '/sat',
      title: 'SAT',
      line: L('Đáp án tính bằng code', 'Answers computed by code'),
      count: SAT_QUESTIONS,
      unit: L('câu', 'questions'),
      Obj: CuteCalculator,
    },
    {
      key: 'sentences',
      tone: C.mint,
      href: '/sentence',
      title: L('Luyện câu', 'Sentences'),
      line: L('Chép chính tả và dịch câu', 'Dictation and translation'),
      count: SENTENCES,
      unit: L('câu', 'sentences'),
      Obj: CuteChat,
    },
    {
      key: 'vocab',
      tone: C.lilac,
      href: '/vocabulary',
      title: L('Sổ từ vựng', 'Word notebook'),
      line: L('Mỗi từ lưu kèm câu gặp nó', 'Each word saved with its sentence'),
      count: vocabCount,
      unit: L('từ', 'words'),
      Obj: CuteNotebook,
    },
    {
      key: 'math',
      tone: C.peach,
      href: '/math',
      title: 'SAT Math',
      line: L('Luyện Toán SAT theo từng chặng', 'SAT Math practice, one stage at a time'),
      count: CURRICULUM_TOTALS.units,
      unit: L('bài', 'lessons'),
      Obj: CuteTrain,
    },
    {
      key: 'hsa',
      tone: C.butter,
      href: '/hsa',
      title: 'HSA · English',
      line: L('20 đề mô phỏng và luyện theo dạng', '20 mock papers and focused practice'),
      count: 20,
      unit: L('đề', 'papers'),
      Obj: CuteBook,
    },
    {
      key: 'international',
      tone: C.sky,
      href: '/toeic',
      title: 'TOEIC · TOEFL',
      line: L('Luyện tiếng Anh học thuật và công việc', 'Academic and workplace English practice'),
      count: 2,
      unit: L('kỳ thi', 'exams'),
      Obj: CuteNotebook,
    },
  ];

  const pct = goal > 0 ? minutes / goal : 0;
  const goalLine =
    minutes >= goal
      ? L('Đủ mục tiêu hôm nay', 'Daily goal met')
      : L(`Còn ${fmt(goal - minutes)} phút nữa`, `${fmt(goal - minutes)} minutes to go`);

  // Điện thoại dùng bản kính mờ riêng; máy tính và máy tính bảng giữ bản lưới bên dưới.
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
      />
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.canvas }}
      contentContainerStyle={{ backgroundColor: C.canvas, minHeight: '100%', paddingBottom: 56 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: wide ? 32 : 16, paddingTop: wide ? 32 : 20 }}>
        {/* Điểm sáng rải nền, không nhận chạm */}
        <Sparkles color={C.blush} count={6} />

        {/* Lời chào cá nhân, nhân vật riêng của Band 9 và tìm kiếm */}
        <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'stretch', gap: 18, marginBottom: wide ? 44 : 24 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Motion kind="wobble">
              {retro ? (
                <StarMascot size={wide ? 92 : 68} />
              ) : (
                <Image
                  source={require('../assets/illustrations/cute-home/mascot-wave.png')}
                  resizeMode="contain"
                  accessibilityLabel={L('Linh vật Band 9 vẫy tay', 'Band 9 mascot waving hello')}
                  style={{ width: wide ? 92 : 68, height: wide ? 92 : 68 }}
                />
              )}
            </Motion>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: F.semi, fontSize: 16, lineHeight: 22, color: C.strawberry }}>
                {greeting}, {displayName} ✨
              </Text>
              <Text style={{ fontFamily: F.black, fontSize: wide ? 38 : 28, lineHeight: wide ? 46 : 34, color: C.ink }}>
                {L('Mình học tiếp nhé?', 'Ready for your next little win?')}
              </Text>
              <Text style={{ fontFamily: F.semi, fontSize: 16, lineHeight: 24, color: C.inkSoft, marginTop: 2 }}>
                {L(`${completedPassages} bài đọc đã hoàn thành · mục tiêu ${fmt(goal)} phút/ngày`, `${completedPassages} passages completed · ${fmt(goal)}-minute daily goal`)}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={L('Tìm bài, từ, đề', 'Search lessons, words, tests')}
            onPress={showSearch}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              minWidth: wide ? 300 : undefined,
              backgroundColor: C.milk,
              borderRadius: 999,
              borderWidth: 3,
              borderColor: C.edge,
              paddingHorizontal: 18,
              paddingVertical: 13,
              boxShadow: `0 5px 0 ${C.line}`,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            } as object)}
          >
            <Icon name="search" size={20} color={C.strawberry} strokeWidth={2.2} />
            <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.inkSoft }}>
              {L('Tìm bài, từ, đề…', 'Search lessons, words…')}
            </Text>
          </Pressable>
        </View>

        {/* Lối quay lại đúng bài đang học dở, lấy từ lịch sử thật của người học. */}
        {recommended ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={L(`Học tiếp: ${recommended.title}`, `Continue: ${recommended.title}`)}
            onPress={() => router.push(`/read/${recommended.id}` as never)}
            style={({ pressed }) => ({
              minHeight: wide ? 132 : 150,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              overflow: 'hidden',
              backgroundColor: C.milk,
              borderRadius: 28,
              borderWidth: 3,
              borderColor: C.edge,
              padding: wide ? 22 : 18,
              marginBottom: wide ? 28 : 20,
              boxShadow: `0 6px 0 ${C.line}`,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            } as object)}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Chip text={L('HỌC TIẾP', 'PICK UP WHERE YOU LEFT OFF')} tone={C.mint} />
              <Text numberOfLines={2} style={{ fontFamily: F.heavy, fontSize: wide ? 23 : 19, lineHeight: wide ? 30 : 25, color: C.ink, marginTop: 10 }}>{recommended.title}</Text>
              <Text numberOfLines={1} style={{ fontFamily: F.semi, fontSize: 14, lineHeight: 20, color: C.inkSoft, marginTop: 3 }}>{recommended.summary ?? L('Một bài đọc đang chờ bạn khám phá.', 'A passage is ready when you are.')}</Text>
              <Text style={{ fontFamily: F.bold, fontSize: 13, lineHeight: 19, color: C.strawberry, marginTop: 7 }}>{recommended.bandRange} · {recommended.estMinutes} {L('phút', 'min')} →</Text>
            </View>
            <View style={{ width: wide ? 108 : 76, height: wide ? 108 : 76, alignItems: 'center', justifyContent: 'center', backgroundColor: C.sky, borderRadius: 24 }}>
              {retro ? <BookIcon size={wide ? 84 : 60} /> : <CuteBook size={wide ? 78 : 58} />}
            </View>
          </Pressable>
        ) : null}

        {/* Thân trang: lưới khu vực + cột hôm nay */}
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 28 : 8, alignItems: 'flex-start' }}>
          <View style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%', minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
            {areas.map((a, i) => (
              <View key={a.key} style={{ width: `${100 / cols}%`, paddingHorizontal: 8, paddingBottom: 8, paddingTop: wide ? 46 : 40, position: 'relative' }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${a.title}. ${a.line}`}
                  onPress={() => router.push(a.href as never)}
                  style={({ pressed }) => ({
                    minHeight: wide ? 212 : 196,
                    borderRadius: 28,
                    backgroundColor: a.tone,
                    borderWidth: 3,
                    borderColor: C.edge,
                    padding: wide ? 20 : 16,
                    justifyContent: 'flex-end',
                    overflow: 'hidden',
                    boxShadow: `0 6px 0 ${C.line}`,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  } as object)}
                >
                  <Sparkles color="#FFFFFF" count={3} />
                  {/* Vật minh hoạ góc trên phải, xuất hiện lần lượt */}
                  <View style={{ position: 'absolute', right: wide ? 10 : 6, top: wide ? 8 : 6 }}>
                    <Motion kind="pop" delay={i * 0.08}>
                      <Sticker tilt={-4}>
                        {retro ? React.createElement(AREA_GLYPH[a.key] ?? BookIcon, { size: wide ? 48 : 40 }) : <a.Obj size={wide ? 96 : 66} />}
                      </Sticker>
                    </Motion>
                  </View>
                  <View style={{ position: 'absolute', left: wide ? 18 : 14, top: wide ? 18 : 14, backgroundColor: C.milk, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
                    <Text style={{ fontFamily: F.bold, fontSize: 13, lineHeight: 18, color: C.ink }}>{`${fmt(a.count)} ${a.unit}`}</Text>
                  </View>
                  <Text style={{ fontFamily: F.heavy, fontSize: 22, lineHeight: 28, color: C.ink }}>{a.title}</Text>
                  <Text style={{ fontFamily: F.semi, fontSize: 15, lineHeight: 22, color: C.inkSoft, marginTop: 2 }}>{a.line}</Text>
                </Pressable>
              <PerchCat pose={AREA_PERCH[i % AREA_PERCH.length] ?? 'sit'} size={wide ? 68 : 58} side={i % 2 ? 'left' : 'right'} inset={wide ? 30 : 20} offset={wide ? 46 : 40} />
              </View>
            ))}
          </View>

          {/* Cột hôm nay */}
          <View style={{ width: wide ? 320 : '100%', marginTop: wide ? 40 : 16 }}>
            <View style={{ position: 'absolute', top: -58, right: 18, zIndex: 2 }}>
              <Motion kind="wobble">
                {retro ? (
                  <StarMascot size={88} />
                ) : (
                  <Image
                    source={require('../assets/illustrations/cute-home/mascot-peace.png')}
                    resizeMode="contain"
                    accessibilityLabel={L('Linh vật Band 9 tạo dáng chữ V', 'Band 9 mascot making a peace sign')}
                    style={{ width: 88, height: 88 }}
                  />
                )}
              </Motion>
            </View>
            <View
              style={{
                backgroundColor: C.milk,
                borderRadius: 28,
                borderWidth: 3,
                borderColor: C.edge,
                padding: 22,
                paddingTop: 24,
                boxShadow: `0 6px 0 ${C.line}`,
              } as object}
            >
              <Text style={{ fontFamily: F.heavy, fontSize: 20, lineHeight: 26, color: C.ink }}>{L('Hôm nay', 'Today')}</Text>

              <View style={{ alignItems: 'center', marginTop: 14 }}>
                <View style={{ width: 156, height: 156, alignItems: 'center', justifyContent: 'center' }}>
                  <Ring size={156} stroke={14} pct={pct} />
                  <View style={{ position: 'absolute', alignItems: 'center' }}>
                    <Text style={{ fontFamily: F.black, fontSize: 36, lineHeight: 40, color: C.ink }}>{fmt(minutes)}</Text>
                    <Text style={{ fontFamily: F.semi, fontSize: 14, lineHeight: 20, color: C.inkSoft }}>{L(`/ ${fmt(goal)} phút`, `/ ${fmt(goal)} min`)}</Text>
                  </View>
                </View>
                <Text style={{ fontFamily: F.bold, fontSize: 15, lineHeight: 22, color: C.ink, marginTop: 10 }}>{goalLine}</Text>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                <Chip
                  tone={C.butter}
                  text={streak > 0 ? L(`Chuỗi ${fmt(streak)} ngày`, `${fmt(streak)}-day streak`) : L('Bắt đầu chuỗi hôm nay', 'Start a streak today')}
                />
                <Chip tone={C.mint} text={L(`${fmt(due)} từ đến hạn`, `${fmt(due)} words due`)} />
              </View>

              <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.line }}>
                <Text style={{ fontFamily: F.bold, fontSize: 14, lineHeight: 20, color: C.ink }}>{L('7 ngày vừa qua', 'Your last 7 days')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 64, marginTop: 10, gap: 6 }}>
                  {recentDays.map((day, index) => {
                    const max = Math.max(1, ...recentDays.map((item) => item.minutes));
                    const barHeight = day.minutes > 0 ? Math.max(8, (day.minutes / max) * 46) : 5;
                    const weekday = new Date(`${day.date}T12:00:00`).getDay();
                    const labels = en ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                    return <View key={`${day.date}-${index}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                      <View style={{ width: '100%', maxWidth: 24, height: barHeight, borderRadius: 999, backgroundColor: index === recentDays.length - 1 ? C.strawberry : C.sky }} />
                      <Text style={{ fontFamily: F.semi, fontSize: 10, color: C.inkSoft }}>{labels[weekday]}</Text>
                    </View>;
                  })}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                  <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.inkSoft }}>{fmt(weeklyMinutes)} {L('phút học', 'study minutes')}</Text>
                  <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.inkSoft }}>{fmt(weeklyQuestions)} {L('câu', 'questions')}</Text>
                </View>
              </View>

              <View style={{ marginTop: 12, padding: 12, borderRadius: 18, backgroundColor: C.peach }}>
                <Text style={{ fontFamily: F.bold, fontSize: 13, lineHeight: 19, color: C.ink }}>{latestSession
                  ? L(`Lượt gần nhất · ${latestSession.articleTitle}`, `Last session · ${latestSession.articleTitle}`)
                  : L('Bài luyện đầu tiên đang chờ bạn', 'Your first practice is waiting')}</Text>
                <Text style={{ fontFamily: F.semi, fontSize: 12, lineHeight: 18, color: C.inkSoft, marginTop: 3 }}>{latestSession
                  ? L(`${latestSession.rawScore}/${latestSession.total} câu đúng · ${new Date(latestSession.finishedAt).toLocaleDateString('vi-VN')}`, `${latestSession.rawScore}/${latestSession.total} correct · ${new Date(latestSession.finishedAt).toLocaleDateString('en-US')}`)
                  : L('Mỗi buổi học sẽ giúp trang này hiểu bạn hơn.', 'Your dashboard will get more personal as you practise.')}</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/vocabulary/spaced-repetition' as never)}
                style={({ pressed }) => ({
                  marginTop: 18,
                  alignSelf: 'stretch',
                  alignItems: 'center',
                  borderRadius: 999,
                  backgroundColor: C.strawberry,
                  paddingVertical: 14,
                  boxShadow: `0 5px 0 ${C.shadowAccent}`,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                } as object)}
              >
                <Text style={{ fontFamily: F.heavy, fontSize: 16, lineHeight: 22, color: C.onAccent }}>
                  {due > 0 ? L(`Ôn ${fmt(due)} từ`, `Review ${fmt(due)} words`) : L('Xem lịch ôn', 'See review schedule')}
                </Text>
              </Pressable>
            </View>

            {/* Lấp lánh cạnh cột hôm nay */}
            <View style={{ position: 'absolute', left: -14, bottom: 26 }} pointerEvents="none">
              <Motion kind="twinkle">
                <SparkleStar size={22} color="#FFFFFF" />
              </Motion>
            </View>
          </View>
        </View>

        {/* Lối tắt các tiện ích cá nhân thường dùng. */}
        <View style={{ marginTop: wide ? 12 : 22, marginBottom: 12 }}>
          <Text style={{ fontFamily: F.heavy, fontSize: 19, lineHeight: 26, color: C.ink, marginBottom: 10 }}>
            {L('Góc học tập của bạn', 'Your study corner')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[
              { label: L('Lộ trình cá nhân', 'My study plan'), icon: 'calendar' as const, href: '/plan', tone: C.peach },
              { label: L('Xem tiến độ', 'Progress'), icon: 'trending' as const, href: '/progress', tone: C.mint },
              { label: L('Lịch sử học', 'Study history'), icon: 'clock' as const, href: '/history', tone: C.sky },
            ].map((item) => (
              <Pressable
                key={item.href}
                accessibilityRole="button"
                onPress={() => router.push(item.href as never)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 9,
                  minHeight: 48,
                  borderRadius: 18,
                  borderWidth: 3,
                  borderColor: C.edge,
                  backgroundColor: item.tone,
                  paddingHorizontal: 14,
                  boxShadow: `0 4px 0 ${C.line}`,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                } as object)}
              >
                <Icon name={item.icon} size={17} color={C.ink} strokeWidth={2.2} />
                <Text style={{ fontFamily: F.bold, fontSize: 14, lineHeight: 20, color: C.ink }}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
