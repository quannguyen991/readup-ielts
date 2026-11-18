import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { useHydrated } from '@/components/layout/useHydrated';
import { CRITERION_COLOR, INK, MUTED, useWide } from '@/components/hsa/stage';
import { CatSticker } from '@/components/mascot/CatSticker';
import { Icon, type IconName } from '@/components/ui/Icon';
import { HSA_DISCLAIMER, HSA_EXTENDED_KIND_ORDER, HSA_KIND_LABEL, HSA_OFFICIAL_KIND_ORDER, HSA_TOPICS, type HsaQuestionKind } from '@/data/hsa';
import { HSA_QUESTION_BANK } from '@/data/hsa-bank';
import { bi, useL } from '@/i18n/useL';
import { CRITERIA, KIND_CRITERION } from '@/services/hsa/criteria';
import { currentStreak, monthPoints } from '@/services/gamification/points';
import { todayKey } from '@/store/persist';
import { placementAttempts, useHsaStore } from '@/store/useHsaStore';
import { isKnown, useIntlStore } from '@/store/useIntlStore';
import { useRewardStore } from '@/store/useRewardStore';
import { useStudyStore } from '@/store/useStudyStore';

const SPEC_URL = 'https://idt.vnu.edu.vn/api/media/file/%C4%90%E1%BB%81%20c%C6%B0%C6%A1ng%20d%E1%BA%A1ng%20th%E1%BB%A9c%20c%E1%BB%A7a%20b%C3%A0i%20thi%20HSA%202026.pdf';
const SAMPLE_URL = 'https://resource.hsa.edu.vn/files/upload/2024-08-09%20De%20thi%20tham%20khao%20HSA%20nam%202025.pdf';

const TINT = { sky: '#D5ECFF', pink: '#FFDCE6', butter: '#FFEFB5', mint: '#D9F3E3', lilac: '#E9DEFB', peach: '#FFE0CC' } as const;

/**
 * TỔNG QUAN HSA — cửa vào của luồng: Khảo sát (About you) → Bài test đầu vào → Lộ trình mỗi ngày, rồi
 * Đua Top, đề mô phỏng, luyện theo dạng câu. Nút chính ở đầu trang đổi theo việc bạn đang ở bước nào.
 */
export default function HsaHomeScreen() {
  const { L, en, locale } = useL();
  const wide = useWide();
  const hydrated = useHydrated();
  const today = todayKey();

  const profile = useHsaStore((s) => s.profile);
  const attempts = useHsaStore((s) => s.attempts);
  // Điểm và chuỗi ngày là số CHUNG của cả app (cùng nguồn với trang Xếp hạng), không có điểm riêng của HSA.
  const daily = useStudyStore((s) => s.daily);
  const frozenDays = useRewardStore((s) => s.frozenDays);
  const plan = useHsaStore((s) => s.plans[today]);
  const done = useHsaStore((s) => s.done);
  const known = useIntlStore((s) => s.known);
  const sessions = useIntlStore((s) => s.sessions).filter((x) => x.exam === 'hsa');

  const placed = placementAttempts(attempts);
  const placedCount = CRITERIA.filter((c) => placed[c.id]).length;
  const knownCount = HSA_TOPICS.flatMap((t) => t.vocabulary).filter((v) => isKnown(known, 'hsa', v.word)).length;
  const vocabCount = HSA_TOPICS.reduce((n, t) => n + t.vocabulary.length, 0);
  const planDone = plan ? plan.tasks.filter((t) => done[`${today}|${t.id}`]).length : 0;

  // Nút chính: bước kế tiếp của luồng.
  const cta = !hydrated
    ? { label: L('Lập lộ trình của bạn', 'Build your plan'), line: '', href: '/hsa/setup' }
    : !profile
      ? { label: L('Lập lộ trình của bạn', 'Build your plan'), line: L('Sáu câu hỏi, rồi bài test đầu vào năm phần, rồi kế hoạch cho từng ngày.', 'Six questions, a five-part entry test, then a plan for every day.'), href: '/hsa/setup' }
      : placedCount < CRITERIA.length
        ? { label: L(`Tiếp tục bài test đầu vào (${placedCount}/5)`, `Continue the entry test (${placedCount}/5)`), line: L('Làm xong 5 phần để kế hoạch bám đúng điểm yếu của bạn.', 'Finish all 5 parts so the plan aims at your weak spots.'), href: '/hsa/placement' }
        : { label: L('Xem kế hoạch hôm nay', 'See today’s plan'), line: plan ? L(`Hôm nay ${planDone}/${plan.tasks.length} bài đã xong.`, `${planDone}/${plan.tasks.length} tasks done today.`) : L('AI lập kế hoạch mới cho mỗi ngày.', 'A new AI-built plan every day.'), href: '/hsa/plan' };

  const tiles: { icon: IconName; title: string; note: string; tint: string; href: string; hide?: boolean }[] = [
    { icon: 'calendar', title: L('Kế hoạch hôm nay', 'Today’s plan'), note: L('Bài theo điểm yếu của bạn', 'Tasks aimed at your weak spots'), tint: TINT.lilac, href: '/hsa/plan', hide: !profile },
    { icon: 'trophy', title: L('Xếp hạng', 'Leaderboard'), note: L('Điểm chung của cả app, theo tháng', 'App-wide points, by month'), tint: TINT.butter, href: '/leaderboard' },
    { icon: 'clipboard', title: L('20 đề mô phỏng', '20 practice papers'), note: L('50 câu · 60 phút', '50 questions · 60 minutes'), tint: TINT.sky, href: '/hsa/exams' },
    { icon: 'gauge', title: L('Chẩn đoán nhanh', 'Quick diagnostic'), note: L('20 câu · 24 phút', '20 questions · 24 minutes'), tint: TINT.mint, href: '/hsa/diagnostic' },
    { icon: 'sparkle', title: L('Thử thách suy luận', 'Reasoning challenge'), note: L('10 câu khó', '10 hard questions'), tint: TINT.pink, href: '/hsa/advanced' },
    { icon: 'book', title: L('10 chủ điểm ôn tập', '10 review topics'), note: L('Từ vựng · trọng tâm · câu hỏi', 'Vocabulary · focus · questions'), tint: TINT.peach, href: '/hsa/topics' },
    { icon: 'letters', title: L('Sổ từ vựng HSA', 'HSA vocabulary'), note: L(`${vocabCount} từ học thuật`, `${vocabCount} academic words`), tint: TINT.lilac, href: '/hsa/vocab' },
    { icon: 'refresh', title: L('Chữa câu đã sai', 'Fix missed questions'), note: L('Làm lại những câu đang sai', 'Redo what you currently miss'), tint: TINT.pink, href: '/hsa/review', hide: attempts.length === 0 },
  ];

  const stats = [
    { v: hydrated ? `${knownCount}/${vocabCount}` : '—', l: L('từ đã thuộc', 'words known') },
    { v: hydrated ? String(sessions.length) : '—', l: L('lượt luyện', 'practice runs') },
    { v: hydrated ? monthPoints(daily, new Date(), frozenDays).toLocaleString('vi-VN') : '—', l: L('điểm tháng này', 'points this month') },
    { v: hydrated ? String(currentStreak(daily, new Date(), frozenDays)) : '—', l: L('ngày liên tiếp', 'day streak') },
  ];

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 1080, gap: 18 }}>
        {/* ---------------------------------------------- khung đầu trang */}
        <View style={{ borderRadius: 28, backgroundColor: '#6A4BD9', overflow: 'hidden', padding: wide ? 32 : 18 }}>
          <View pointerEvents="none" style={{ position: 'absolute', right: -70, top: -90, width: 300, height: 300, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.13)' }} />
          <View pointerEvents="none" style={{ position: 'absolute', left: '40%', bottom: -120, width: 220, height: 220, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text className="font-nun-heavy" style={{ fontSize: 13, letterSpacing: 1.2, color: 'rgba(255,255,255,0.88)' }}>
                {L('HSA · ĐHQGHN 2026', 'HSA · VNU 2026')}
              </Text>
              <Text className="font-nun-heavy" style={{ fontSize: wide ? 48 : 32, lineHeight: wide ? 54 : 38, color: '#FFFFFF', marginTop: 4 }}>
                {L('HSA · Tiếng Anh', 'HSA · English')}
              </Text>
              <Text className="font-nun-strong" style={{ fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.92)', marginTop: 6, maxWidth: 560 }}>
                {L('50 câu, 60 phút: văn bản học thuật và suy luận. Học theo lộ trình riêng, chấm đủ 5 tiêu chí, có đáp án chi tiết.', '50 questions, 60 minutes: academic texts and reasoning. A personal plan, scored on 5 criteria, with detailed answers.')}
              </Text>
            </View>
            <CatSticker pose="read" size={wide ? 96 : 66} />
          </View>
          <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'flex-start', gap: 14, marginTop: 20 }}>
            <Pressable accessibilityRole="button" onPress={() => router.push(cta.href as never)} style={({ hovered }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingLeft: 22, paddingRight: 6, minHeight: 54, borderRadius: 27, alignSelf: wide ? 'flex-start' : 'stretch', backgroundColor: hovered ? '#F1EDFF' : '#FFFFFF' })}>
              <Text className="font-nun-heavy" style={{ flexShrink: 1, fontSize: 16, lineHeight: 21, color: INK, paddingVertical: 6 }}>
                {cta.label}
              </Text>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="arrow-right" size={18} color="#FFFFFF" strokeWidth={2.6} />
              </View>
            </Pressable>
            {cta.line ? (
              <Text className="font-nun-strong" style={{ flex: 1, fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.9)' }}>
                {cta.line}
              </Text>
            ) : null}
          </View>
          {hydrated && !profile ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              {[L('1 · About you', '1 · About you'), L('2 · Làm test', '2 · Entry test'), L('3 · Lộ trình mỗi ngày', '3 · Daily plan')].map((t) => (
                <View key={t} style={{ backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 }}>
                  <Text className="font-nun-heavy" style={{ fontSize: 13, color: '#FFFFFF' }}>
                    {t}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* ---------------------------------------------- số liệu */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {stats.map((s) => (
            <View key={s.l} style={{ flexGrow: 1, flexBasis: wide ? 0 : '45%', backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#EDE7FA' }}>
              <Text className="font-nun-heavy" style={{ fontSize: 24, lineHeight: 30, color: INK }}>
                {s.v}
              </Text>
              <Text className="font-nun-strong" style={{ fontSize: 13, color: MUTED }}>
                {s.l}
              </Text>
            </View>
          ))}
        </View>

        {/* ---------------------------------------------- lối vào nhanh */}
        <View>
          <Text className="font-nun-heavy" style={{ fontSize: 20, color: INK, marginBottom: 10 }}>
            {L('Chọn việc muốn làm', 'Pick what to do')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {tiles
              .filter((t) => !t.hide)
              .map((t) => (
                <Pressable
                  key={t.href}
                  accessibilityRole="button"
                  onPress={() => router.push(t.href as never)}
                  style={({ pressed }) => ({ flexGrow: 1, flexBasis: wide ? 240 : '100%', minHeight: wide ? 104 : 80, flexDirection: 'row', alignItems: 'center', gap: 14, padding: wide ? 16 : 12, borderRadius: 24, backgroundColor: t.tint, borderWidth: 1, borderColor: 'rgba(255,255,255,0.95)', transform: [{ scale: pressed ? 0.98 : 1 }], boxShadow: '0 8px 20px rgba(120,80,130,0.12)' } as never)}
                >
                  <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={t.icon} size={21} color="#4B3A4F" strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text className="font-nun-heavy" style={{ fontSize: 17, lineHeight: 22, color: '#4B3A4F' }}>
                      {t.title}
                    </Text>
                    <Text className="font-nun-strong" style={{ fontSize: 13, lineHeight: 18, color: '#7D6B80', marginTop: 2 }}>
                      {t.note}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#7D6B80" strokeWidth={2.2} />
                </Pressable>
              ))}
          </View>
        </View>

        {/* ---------------------------------------------- luyện theo dạng câu */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: wide ? 24 : 16, borderWidth: 1, borderColor: '#EDE7FA', gap: 14 }}>
          <View>
            <Text className="font-nun-heavy" style={{ fontSize: 20, color: INK }}>
              {L('Luyện theo dạng câu', 'Practise by question type')}
            </Text>
            <Text className="font-nun-strong" style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
              {L(`${HSA_QUESTION_BANK.length} câu trong ngân hàng. Màu chấm là tiêu chí chấm của dạng đó.`, `${HSA_QUESTION_BANK.length} questions in the bank. The dot colour is the criterion it counts toward.`)}
            </Text>
          </View>
          <KindGroup title={L('THEO ĐỀ CƯƠNG 50 CÂU', 'IN THE 50-QUESTION PAPER')} kinds={HSA_OFFICIAL_KIND_ORDER} locale={locale} L={L} />
          <KindGroup title={L('BÀI BỔ TRỢ NGOÀI ĐỀ CƯƠNG', 'EXTRA DRILLS')} kinds={HSA_EXTENDED_KIND_ORDER} locale={locale} L={L} />
        </View>

        {/* ---------------------------------------------- tài liệu chính thức */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: wide ? 24 : 16, borderWidth: 1, borderColor: '#EDE7FA', gap: 4 }}>
          <DocRow title={L('Đề cương HSA 2026 · ĐHQGHN', 'HSA 2026 test specification · VNU')} note={L('Mở tài liệu chính thức', 'Open the official specification')} onPress={() => Linking.openURL(SPEC_URL)} />
          <View style={{ height: 1, backgroundColor: '#EDE7FA' }} />
          <DocRow title={L('Đề tham khảo HSA 2025', 'HSA 2025 sample paper')} note={L('Mở đề tham khảo', 'Open the sample paper')} onPress={() => Linking.openURL(SAMPLE_URL)} />
          <Text className="font-nun-strong" style={{ fontSize: 12.5, lineHeight: 19, color: MUTED, marginTop: 10 }}>
            {en ? HSA_DISCLAIMER.en : HSA_DISCLAIMER.vi}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

function KindGroup({ title, kinds, locale, L }: { title: string; kinds: readonly HsaQuestionKind[]; locale: 'vi' | 'en'; L: (vi: string, en: string) => string }) {
  return (
    <View>
      <Text className="font-nun-heavy" style={{ fontSize: 12, letterSpacing: 1.4, color: MUTED, marginBottom: 8 }}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {kinds.map((kind) => {
          const count = HSA_QUESTION_BANK.filter((q) => q.kind === kind).length;
          return (
            <Pressable
              key={kind}
              accessibilityRole="button"
              onPress={() => router.push(`/hsa/practice/${kind}` as never)}
              style={({ hovered }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 2, borderBottomWidth: 4, borderColor: '#E6E1F5', backgroundColor: hovered ? '#F8F6FF' : '#FFFFFF' })}
            >
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: CRITERION_COLOR[KIND_CRITERION[kind]] }} />
              <Text className="font-nun-heavy" style={{ fontSize: 14, color: INK }}>
                {bi(HSA_KIND_LABEL[kind], locale)}
              </Text>
              <Text className="font-nun-heavy" style={{ fontSize: 12, color: MUTED }}>
                {count} {L('câu', 'q')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DocRow({ title, note, onPress }: { title: string; note: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ hovered }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, opacity: hovered ? 0.8 : 1 })}>
      <Icon name="external" size={18} color="#6A4BD9" strokeWidth={2.2} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text className="font-nun-heavy" style={{ fontSize: 15, lineHeight: 21, color: INK }}>
          {title}
        </Text>
        <Text className="font-nun-strong" style={{ fontSize: 13, lineHeight: 18, color: MUTED }}>
          {note}
        </Text>
      </View>
      <Icon name="arrow-right" size={16} color="#6A4BD9" strokeWidth={2.4} />
    </Pressable>
  );
}
