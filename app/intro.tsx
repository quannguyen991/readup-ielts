import React, { useEffect } from 'react';
import { usePixelTheme } from '@/components/pixel-theme/pixel-art';
import { GoldHighlight } from '@/components/layout/GoldHighlight';
import { PhoneIntro } from '@/components/home/PhoneIntro';
import { PerchCat } from '@/components/mascot/PerchCat';
import { Image, Platform, Pressable, Text, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Grid } from '@/components/layout/Grid';
import { GridBackdrop } from '@/components/layout/GridBackdrop';
import { BlueHero } from '@/components/home/BlueHero';
import { CUTE_PALETTES } from '@/components/layout/cute-palettes';
import { HERO_FRAME, LightSweep } from '@/components/layout/LightHero';
import { HistoryHomeCard } from '@/components/history/HistoryHomeCard';
import { Hero3D, useHeroLogo } from '@/components/three/Hero3D';
import { CHIIKAWA_IMG } from '@/components/chiikawa/chiikawa';
import { SakuraRain } from '@/components/chiikawa/SakuraRain';
import { Screen } from '@/components/layout/Screen';
import { Appear, PressScale } from '@/components/motion/Motion';
import { Badge, Button, Card, Icon, StickerCard, type IconName } from '@/components/ui';
import { GlossOrb } from '@/components/ui/GlossOrb';
import { INK, STICKER_TITLE_SHADOW } from '@/components/ui/StickerCard';
import { GlowStars } from '@/components/ui/GlowStars';
import { PLANS } from '@/lib/billing/plans';
import { ARTICLES } from '@/data/articles';
import { DICTATION_SENTENCES, TRANSLATION_SENTENCES } from '@/data/sentence-drills';
import { WRITING_PROMPTS } from '@/data/writing-repository';
import { CURRICULUM_TOTALS } from '@/services/math/curriculum';
import { satRwStats } from '@/data/sat-rw-repository';
import { rememberInviteCode } from '@/services/referral/pending';
import {
  MAX_REWARD_PLAN,
  MAX_TIER_REFERRALS,
  REFERRALS_PER_REWARD,
  REWARD_MONTHS,
  REWARD_PLAN,
} from '@/services/referral/rewards';
import { useMathStore } from '@/store/useMathStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useCuteAppearanceStore } from '@/store/useCuteAppearanceStore';
import { useRewardStore } from '@/store/useRewardStore';
import { ArcadeHome } from '@/components/arcade/ArcadeHome';
import { AreaArt } from '@/components/home/AreaArt';
import { WhatsNewModal } from '@/components/home/WhatsNewModal';
import { stickerGradient } from '@/theme/tokens';
import { bi, useL, type Bi } from '@/i18n/useL';
import { VOCAB_TOPICS } from '@/data/vocab-topics';

/**
 * Trang giới thiệu — thứ người mở app lần đầu nhìn thấy.
 *
 * MỌI CON SỐ TRÊN TRANG NÀY ĐƯỢC ĐẾM TỪ DỮ LIỆU THẬT lúc render, không gõ tay.
 * Trang giới thiệu là chỗ dễ nói quá nhất, và cũng là chỗ bị bắt quả tang nhanh
 * nhất: hứa "hơn 2000 câu" rồi người dùng đếm ra 800 thì mất niềm tin cho mọi
 * thứ còn lại. Đếm tại chỗ thì con số không bao giờ lệch khỏi thứ trong app.
 */

const readableCount = ARTICLES.filter((a) => a.licenseType !== 'headline_only').length;
const ieltsCount = ARTICLES.filter((a) => a.exam === 'ielts').length;
const satCount = ARTICLES.filter((a) => a.exam === 'sat').length;
const task1Count = WRITING_PROMPTS.filter((p) => p.task === 'ielts_task1').length;
const task2Count = WRITING_PROMPTS.filter((p) => p.task === 'ielts_task2').length;
const sentenceCount = DICTATION_SENTENCES.length + TRANSLATION_SENTENCES.length;

/** Tạm ẩn dải "Bạn đang học dở" trên trang chủ máy tính; đổi thành true để bật lại. */
const SHOW_RESUME_BANNER = false;

type Area = {
  icon: IconName;
  sticker: ImageSourcePropType;
  /** Cặp màu sáng → đậm của thẻ sticker; lấy từ bảng chung để sáu thẻ không lệch tông. */
  colors: readonly [string, string];
  title: Bi;
  lines: Bi[];
  /** Chữ trong viên thuốc ghim đáy thẻ — con số thật, hoặc điều kiện dùng. */
  badge: Bi;
  href: string;
};

const AREAS: Area[] = [
  {
    icon: 'letters',
    sticker: require('../assets/illustrations/cute-home/task-stickers/vocabulary.webp'),
    colors: stickerGradient.primary,
    title: { vi: 'Học từ vựng', en: 'Vocabulary' },
    lines: [{ vi: 'Học theo chủ đề, từ dễ đến khó, có phát âm', en: 'Topics from easy to hard, with pronunciation' }],
    badge: { vi: `${VOCAB_TOPICS.length} CHỦ ĐỀ`, en: `${VOCAB_TOPICS.length} TOPICS` },
    href: '/vocabulary/topics',
  },
  {
    icon: 'target',
    sticker: require('../assets/illustrations/cute-home/task-stickers/roadmap.webp'),
    colors: stickerGradient.info,
    title: { vi: 'IELTS', en: 'IELTS' },
    lines: [{ vi: 'Đề, lộ trình và điểm theo band', en: 'Tests, roadmap and scores by band' }],
    badge: { vi: 'LỘ TRÌNH', en: 'ROADMAP' },
    href: '/ielts',
  },
  {
    icon: 'pencil',
    sticker: require('../assets/illustrations/cute-home/task-stickers/writing.webp'),
    colors: stickerGradient.danger,
    title: { vi: 'Writing', en: 'Writing' },
    lines: [{ vi: 'Nhắc lỗi cấu trúc ngay lúc gõ', en: 'Flags structure mistakes as you type' }],
    badge: { vi: `${WRITING_PROMPTS.length} ĐỀ`, en: `${WRITING_PROMPTS.length} PROMPTS` },
    href: '/write',
  },
  {
    icon: 'volume',
    sticker: require('../assets/illustrations/cute-home/task-stickers/listening.webp'),
    colors: stickerGradient.success,
    title: { vi: 'Listening', en: 'Listening' },
    lines: [{ vi: 'Bài nghe có đáp án và giải thích', en: 'Listening sets with answers and explanations' }],
    badge: { vi: 'CÓ ĐÁP ÁN', en: 'WITH ANSWERS' },
    href: '/listening',
  },
  {
    icon: 'mic',
    sticker: require('../assets/illustrations/cute-home/task-stickers/writing.webp'),
    colors: stickerGradient.rose,
    title: { vi: 'Speaking', en: 'Speaking' },
    lines: [{ vi: 'Nói và được AI góp ý theo tiêu chí IELTS', en: 'Speak and get IELTS-criteria feedback' }],
    badge: { vi: 'AI HỖ TRỢ', en: 'AI COACH' },
    href: '/speaking',
  },
  {
    icon: 'clipboard',
    sticker: require('../assets/illustrations/cute-home/task-stickers/reading.webp'),
    colors: stickerGradient.warning,
    title: { vi: 'Reading', en: 'Reading' },
    lines: [{ vi: 'Đề thi thử đúng khổ, chấm điểm', en: 'Mock tests in the real format, scored' }],
    badge: { vi: 'THI THỬ', en: 'MOCK TEST' },
    href: '/mock-tests',
  },
  {
    icon: 'grid',
    sticker: require('../assets/illustrations/cute-home/task-stickers/sat.webp'),
    colors: stickerGradient.accent,
    title: { vi: 'SAT', en: 'SAT' },
    lines: [{ vi: 'Đáp án tính bằng code, không do AI đoán', en: 'Answers computed by code, not guessed by AI' }],
    badge: {
      vi: `${(CURRICULUM_TOTALS.questions + satRwStats().questions).toLocaleString('vi-VN')} CÂU`,
      en: `${(CURRICULUM_TOTALS.questions + satRwStats().questions).toLocaleString('en-US')} QUESTIONS`,
    },
    href: '/sat',
  },
  {
    icon: 'book',
    sticker: require('../assets/illustrations/cute-home/task-stickers/listening.webp'),
    colors: stickerGradient.primary,
    title: { vi: 'Luyện câu', en: 'Sentences' },
    lines: [{ vi: 'Chép chính tả và dịch câu, chấm từng từ', en: 'Dictation and translation, marked word by word' }],
    badge: { vi: `${sentenceCount} CÂU`, en: `${sentenceCount} SENTENCES` },
    href: '/sentence',
  },
];
/**
 * Ba bước, và ở đây đánh số là ĐÚNG chứ không phải trang trí: thứ tự mang thông
 * tin thật — không làm bài chẩn đoán trước thì lộ trình không biết xếp gì.
 *
 * Màu đi từ lam nhạt sang tím đậm theo đúng thứ tự ấy, nên trên máy nhỏ khi ba
 * thẻ xếp dọc thì vẫn đọc ra được đâu là đầu đường.
 */
const STEPS: {
  n: string;
  colors: readonly [string, string];
  title: Bi;
  body: Bi;
}[] = [
  {
    n: '1',
    colors: stickerGradient.info,
    title: { vi: 'Làm bài chẩn đoán', en: 'Take the diagnostic' },
    body: { vi: '19 câu, mỗi kỹ năng một câu.', en: '19 questions, one per skill.' },
  },
  {
    n: '2',
    colors: stickerGradient.primary,
    title: { vi: 'Đi theo lộ trình', en: 'Follow the roadmap' },
    body: { vi: 'Mỗi bài học 5 bộ đề, siết dần thời gian.', en: 'Five sets per lesson, with the clock tightening as you go.' },
  },
  {
    n: '3',
    colors: stickerGradient.accent,
    title: { vi: 'Thi thử đúng khổ đề', en: 'Take a real-format mock' },
    body: { vi: 'Hai module × 22 câu × 35 phút, độ khó đổi theo kết quả.', en: 'Two modules × 22 questions × 35 minutes, adapting to how you do.' },
  },
];

/**
 * Vào app từ trang giới thiệu thì THAY THẾ trang này trong lịch sử, không chồng lên.
 *
 * Trang giới thiệu là cửa vào, không phải một trang trong app. Dùng `push` thì nó
 * nằm lại trong lịch sử, và nút back ngay cạnh logo sẽ đưa người đang học quay
 * ngược ra trang quảng cáo — đúng lỗi người dùng báo. `replace` khiến back từ
 * Tổng quan hành xử như mong đợi: hoặc không có gì để back, hoặc về đúng màn
 * trước đó BÊN TRONG app.
 *
 * Không áp cho mọi liên kết trên trang này: các lối rời app tạm thời (mời bạn,
 * nâng cấp) vẫn nên quay lại được chỗ cũ.
 */
function enterApp(href: string): void {
  router.replace(href as never);
}

export default function IntroScreen() {
  const { width } = useWindowDimensions();
  const { L, en } = useL();
  const chiikawaTheme = useRewardStore((state) => state.theme === 'theme-chiikawa');
  // Theme máy chơi điện tử (mua trong Đổi quà): vào máy từ màn chào thay cho trang giới thiệu.
  const arcadeOn = useRewardStore((state) => state.theme === 'theme-arcade');
  const selectedPalette = CUTE_PALETTES[useCuteAppearanceStore((state) => state.palette)];
  const px = usePixelTheme();
  const palette = chiikawaTheme ? CUTE_PALETTES.strawberry : px ? px.palette : selectedPalette;
  const num = (n: number) => n.toLocaleString(en ? 'en-US' : 'vi-VN');

  /*
    Nhớ mã mời ngay khi vào trang, TRƯỚC cả khi người dùng nghĩ tới việc tạo tài
    khoản. Đường từ đây tới lúc đăng nhập xong còn dài — nhập email, mở hộp thư,
    bấm liên kết — và mã phải sống sót qua cả chuỗi đó.
  */
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  useEffect(() => {
    void rememberInviteCode(typeof ref === 'string' ? ref : null);
  }, [ref]);
  const wide = width >= 768;
  // Logo Band 9 3D: máy tính và máy tính bảng; điện thoại bỏ hẳn cho gọn.
  const star = useHeroLogo();

  /*
    Người ĐÃ HỌC được mời quay lại chỗ đang dở, ngay dòng đầu tiên.

    Trang này giờ là cửa vào của tất cả mọi người, nên nó phải phục vụ được cả
    người mới lẫn người quay lại. Người quay lại không cần đọc lại phần giới
    thiệu — họ cần một cú bấm để về chỗ cũ, và cú bấm ấy phải nằm TRÊN phần giới
    thiệu chứ không phải cuối trang.
  */
  const studied = useStudyStore(
    (s) => s.sessions.length > 0 || Object.keys(s.progress).length > 0 || s.bookmarks.length > 0,
  );
  const didMath = useMathStore((s) => s.sessions.length > 0);
  const returning = studied || didMath;

  if (arcadeOn && width >= 640) return <ArcadeHome onEnter={enterApp} />;

  // Điện thoại: bản riêng theo ngôn ngữ của trang Hôm nay; máy tính giữ bản giới thiệu đầy đủ.
  if (width < 640) {
    return (
      <>
        <PhoneIntro
          returning={returning}
          readable={num(readableCount)}
          mathSets={String(CURRICULUM_TOTALS.sets)}
          mathQuestions={num(CURRICULUM_TOTALS.questions)}
          writing={String(WRITING_PROMPTS.length)}
          L={L}
          onContinue={() => enterApp('/dashboard')}
          onStart={() => enterApp('/dashboard')}
          onIelts={() => enterApp('/practice')}
          onSat={() => enterApp('/sat')}
          onMathRoadmap={() => enterApp('/math')}
        />
        <WhatsNewModal onOpen={enterApp} />
      </>
    );
  }

  return (
    <Screen>
      <SakuraRain />
      {SHOW_RESUME_BANNER && returning ? (
        <Appear>
          <Card className="mb-4">
            <View className="flex-row flex-wrap items-center justify-between gap-3">
              <View className="flex-1" style={{ minWidth: 200 }}>
                <Text className="font-strong text-cardTitle text-ink">{L('Bạn đang học dở', 'Pick up where you left off')}</Text>
                <Text className="mt-0.5 font-sans text-label text-muted">
                  {L('Tiến độ vẫn nguyên. Cuộn xuống nếu muốn xem app có thêm gì.', "Your progress is safe. Scroll down to see what's new.")}
                </Text>
              </View>
              <Button
                label={L('Tiếp tục học', 'Continue learning')}
                variant="brand"
                iconRight="arrow-right"
                onPress={() => enterApp('/dashboard')}
              />
            </View>
          </Card>
        </Appear>
      ) : null}

      {/* ------------------------------------------------------------- hero */}
      <Appear>
        <BlueHero
          wide={wide}
          eyebrow="IELTS · SAT · SPEAKING"
          chip={L('Luyện thi', 'Practise')}
          title={L('bằng đề thật.', 'with real tests.')}
          subtitle={L(
            'Đề như phòng thi, chấm ngay, và từng lỗi được chỉ rõ để bạn biết mình sai ở đâu.',
            'Exam-room tests, instant marking, and every mistake explained so you know exactly where you slipped.',
          )}
          primary={{ label: L('Bắt đầu học', 'Start learning'), onPress: () => enterApp('/dashboard') }}
          secondary={{ label: L('Xem lộ trình SAT Math', 'See the SAT Math roadmap'), onPress: () => enterApp('/math') }}
        />
      </Appear>

      {/* ------------------------------------- Khám phá lịch sử (ẩn tới khi có cảnh xuất bản) */}
      <Appear index={1}>
        <HistoryHomeCard marginTop={28} />
      </Appear>

      {/* ---------------------------------------------------------- sáu mảng */}
      <Appear index={1}>
        <Text className="mt-14 font-heavy text-sectionTitle text-ink">{L('App có gì', "What's inside")}</Text>
        <Text className="mt-1 font-sans text-body" style={{ color: '#1E293B' }}>
          {L('Tám mảng học chính, dùng chung một sổ từ và một bảng tiến độ.', 'Eight core study areas sharing one word notebook and one progress board.')}
        </Text>
      </Appear>

      <View className="mt-5">
        <Grid columns={4} tabletColumns={3} mobileColumns={2} gap={12}>
          {AREAS.map((area, index) => (
            <Appear key={area.href} index={index + 2} style={{ flex: 1 }}>
              <AreaCard area={area} chiikawaTheme={chiikawaTheme} colorIndex={index} />
            </Appear>
          ))}
        </Grid>
        <Appear index={AREAS.length + 2}>
          <Pressable accessibilityRole="link" onPress={() => enterApp('/more')} className="mt-5 self-start">
            <Text className="font-strong text-body" style={{ color: '#1E293B' }}>
              {L('Các mục khác: Sổ từ vựng, Đọc theo VOA, Clip, TOEIC · TOEFL, Đọc báo song ngữ →', 'More: word notebook, read along with VOA, clips, TOEIC · TOEFL, bilingual news →')}
            </Text>
          </Pressable>
        </Appear>
      </View>

      {/* -------------------------------------------------------- ba bước */}
      <Appear index={3}>
        <Text className="mt-14 font-heavy text-sectionTitle text-ink">{L('Bắt đầu thế nào', 'How to start')}</Text>
      </Appear>
      <View className="mt-5">
        <Grid columns={3} tabletColumns={3} mobileColumns={1}>
          {STEPS.map((step, index) => (
            <Appear key={step.n} index={index + 4} style={{ height: '100%' }}>
              <StepCard step={step} />
            </Appear>
          ))}
        </Grid>
      </View>

      {/* ------------------------------------------------------- mời bạn */}
      {/*
        Trang chủ KHÔNG bày bảng giá nữa. Người mới tới cần biết học được gì và
        học miễn phí bằng cách nào; bốn cột giá ngay trang đầu làm app trông như
        một trang bán hàng trước khi kịp là một chỗ học. Giá vẫn nằm nguyên ở
        trang Gói học (Cài đặt → Gói học) cho ai tự đi tìm.

        Thay vào đó là con đường KHÔNG MẤT TIỀN: mời bạn cùng học.
      */}
      <Appear index={7}>
        <View
          className="mt-14 overflow-hidden rounded-card border-2 border-primary-500 bg-surface p-7 lg:p-10"
        >
          <View className="flex-row flex-wrap items-center gap-8">
            <View className="flex-1" style={{ minWidth: 280 }}>
              <Text className="font-strong text-label uppercase tracking-[1.4px] text-primary-600">{L('Học miễn phí', 'Study for free')}</Text>
              <Text className="mt-2 font-heavy text-pageTitle text-ink">
                {L('Rủ bạn cùng học,', 'Invite friends to study,')}{'\n'}{L('mở khoá toàn bộ app.', 'unlock the whole app.')}
              </Text>
              <Text className="mt-3 max-w-[520px] font-sans text-bodyLg text-muted">
                {L('Mời một bạn học thật là được một mốc. Miễn phí.', 'Each friend who signs up and studies counts. Free.')}
              </Text>
              <View className="mt-6 flex-row flex-wrap gap-2">
                <Button
                  label={L('Lấy link mời', 'Get invite link')}
                  variant="brand"
                  size="lg"
                  iconRight="arrow-right"
                  onPress={() => router.push('/invite' as never)}
                />
              </View>
            </View>

            <View className="gap-3" style={{ flexShrink: 1, flexBasis: 360, flexGrow: 1 }}>
              <InviteMilestone n={1} title={L('Lấy link mời của bạn', 'Get your invite link')} note={L('Gửi qua Zalo, Messenger, nhóm lớp.', 'Share it on Zalo, Messenger or your class group.')} />
              <InviteMilestone
                n={REFERRALS_PER_REWARD}
                title={L(`${REFERRALS_PER_REWARD} bạn học thật`, `${REFERRALS_PER_REWARD} friends studying`)}
                note={L(`${REWARD_MONTHS} tháng gói ${PLANS[REWARD_PLAN].name}: trợ giảng AI, chấm Writing, mọi bộ đề.`, `${REWARD_MONTHS} months of ${PLANS[REWARD_PLAN].name}: AI tutor, Writing grading, every test set.`)}
              />
              <InviteMilestone
                n={MAX_TIER_REFERRALS}
                title={L(`${MAX_TIER_REFERRALS} bạn học thật`, `${MAX_TIER_REFERRALS} friends studying`)}
                note={L(`Lên gói ${PLANS[MAX_REWARD_PLAN].name} — gói cao nhất.`, `Upgrade to ${PLANS[MAX_REWARD_PLAN].name} — the top plan.`)}
                last
              />
            </View>
          </View>
        </View>
      </Appear>

      {/* ------------------------------------------------------- CTA cuối */}
      <Appear index={9}>
        <Card className="mt-8">
          <View className="items-center py-4">
            <Text className="text-center font-heavy text-sectionTitle text-ink">
              {L('Bắt đầu từ bài chẩn đoán', 'Start with the diagnostic')}
            </Text>
            <Text className="mt-2 max-w-[520px] text-center font-sans text-body text-muted">
              {L('19 câu, ~30 phút. Biết ngay nên luyện gì trước.', '19 questions, ~30 min. See what to practise first.')}
            </Text>
            <View className="mt-4 flex-row flex-wrap justify-center gap-2">
              <Button
                label={L('Làm bài chẩn đoán', 'Take the diagnostic')}
                variant="brand"
                iconRight="arrow-right"
                onPress={() => enterApp('/math/diagnostic')}
              />
              <Button
                label={L('Vào thẳng app', 'Go straight to the app')}
                variant="brandOutline"
                onPress={() => enterApp('/dashboard')}
              />
            </View>
          </View>
        </Card>
      </Appear>

      <View className="h-6" />
      <WhatsNewModal onOpen={enterApp} />
    </Screen>
  );
}

/**
 * Thẻ trắng viền mảnh, bóng mềm — cùng vật liệu với thẻ kỹ năng ở trang SAT.
 *
 * Bản trước dùng viền đen dày + bóng lệch cứng kiểu sticker, cạnh các thẻ
 * gradient đặc có ngôi sao trang trí: nhiều giọng quá, trông thô. Giờ mọi thẻ
 * trên trang cùng một chất liệu; màu chỉ còn ở ô biểu tượng.
 */
const softCard = (Platform.OS === 'web'
  ? {
      borderWidth: 1,
      borderColor: '#F3F0FB',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 6px 20px rgba(15,23,42,0.05)',
    }
  : { borderWidth: 1, borderColor: '#F3F0FB', elevation: 2 }) as never;


/**
 * Một bước trong ba bước mở đầu.
 *
 * Số bước nằm trong huy hiệu gradient chứ không phải viên xám: nó là thứ dẫn
 * mắt, và ba màu đi theo thứ tự cũng là thứ duy nhất còn nói được "đây là một
 * đường đi" khi màn hẹp và ba thẻ xếp dọc.
 */
function StepCard({ step }: { step: (typeof STEPS)[number] }) {
  const { locale } = useL();
  return (
    <View className="h-full overflow-hidden rounded-card bg-white" style={softCard}>
      <LinearGradient
        colors={step.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 7 }}
      />
      <View className="p-4">
        <View
          className="h-11 w-11 items-center justify-center overflow-hidden rounded-pill"
          style={{ borderWidth: 2, borderColor: '#FFFFFF' }}
        >
          <LinearGradient
            colors={step.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', inset: 0 } as never}
          />
          <Text className="font-heavy text-cardTitle text-white" style={{ zIndex: 1 }}>
            {step.n}
          </Text>
        </View>
        <Text className="mt-3 font-strong text-cardTitle text-ink">{bi(step.title, locale)}</Text>
        <Text className="mt-1 font-sans text-body text-muted">{bi(step.body, locale)}</Text>
      </View>
    </View>
  );
}
function StatPill({ value, label }: { value: string; label: string }) {
  const chiikawaTheme = useRewardStore((state) => state.theme === 'theme-chiikawa');
  return (
    <View className="flex-row items-baseline gap-1.5 rounded-pill bg-white px-3 py-1.5" style={{ borderWidth: 1, borderColor: chiikawaTheme ? '#F0B6C9' : '#E9D8B5' }}>
      <Text className="font-heavy text-body" style={{ color: chiikawaTheme ? '#C64E79' : '#6A4BD9' }}>{value}</Text>
      <Text className="font-sans text-label text-paper-muted">{label}</Text>
    </View>
  );
}

/** Tám bảng màu, mỗi mảng một cặp riêng để lưới không lặp: sáng → đậm. */
const AREA_TONES: readonly (readonly [string, string])[] = [
  ['#B9A9FF', '#6A4BD9'],
  ['#8EC5FF', '#2F6FD6'],
  ['#FFB4A8', '#D9503E'],
  ['#8FE0B0', '#23875E'],
  ['#FFB8D6', '#D9568F'],
  ['#FFD892', '#E08A1E'],
  ['#9AE6E8', '#1F8A96'],
  ['#A7B4FF', '#3446C8'],
];

/** Một mảng học: thẻ khối bóng lệch, chùm sao phát sáng ở góc, viên nhãn ghim đáy là con số thật của mảng đó. */
const CHIIKAWA_AREA_COLORS: readonly (readonly [string, string])[] = [
  ['#F7CBD8', '#C65A78'], ['#F5B8CC', '#B85273'], ['#FCE0E9', '#D97F9B'],
  ['#F8D4DE', '#C65A78'], ['#F5B8CC', '#A64462'], ['#F9C6D6', '#C65A78'],
];

function AreaCard({ area, chiikawaTheme, colorIndex }: { area: Area; chiikawaTheme: boolean; colorIndex: number }) {
  const { locale } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const colors = (chiikawaTheme ? CHIIKAWA_AREA_COLORS[colorIndex % CHIIKAWA_AREA_COLORS.length] : AREA_TONES[colorIndex % AREA_TONES.length]) ?? ['#4A7FE8', '#7FA3F6'];
  return (
    <PressScale fill onPress={() => enterApp(area.href)} style={{ flex: 1 }}>
      <StickerCard bold colors={colors} style={{ flex: 1 }} ornament={wide ? <GlowStars /> : undefined}>
        <View style={{ height: chiikawaTheme ? 112 : wide ? 150 : 92, position: 'relative' }}>
          {wide && !chiikawaTheme ? <AreaArt tone={colors} variant={colorIndex} /> : null}
          <GlossOrb icon={area.icon} tone={colors} size={52} />
          {chiikawaTheme ? (
            <Image
              source={area.sticker}
              resizeMode="contain"
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={{ position: 'absolute', top: -18, right: -12, width: 158, height: 132 }}
            />
          ) : null}
        </View>

        <Text className="font-heavy text-sectionTitle text-white" style={[STICKER_TITLE_SHADOW, { marginTop: chiikawaTheme ? 2 : 8 }]}>
          {bi(area.title, locale)}
        </Text>

        {/* Đẩy viên nhãn xuống đáy để các thẻ có nhãn thẳng hàng dù chữ dài ngắn khác nhau. */}
        <View className="flex-1" />

        <View className="mt-4 flex-row items-center justify-between gap-2">
          <View className="rounded-pill px-3 py-1" style={{ backgroundColor: 'rgba(27,24,64,0.62)' }}>
            <Text className="font-heavy text-label text-white" style={{ letterSpacing: 0.6 }}>
              {bi(area.badge, locale)}
            </Text>
          </View>
          <View className="h-8 w-8 items-center justify-center rounded-pill bg-white">
            <Icon name="arrow-right" size={15} color={INK} strokeWidth={2.4} />
          </View>
        </View>
      </StickerCard>
    </PressScale>
  );
}

/** Một mốc trên đường mời bạn: số người, phần thưởng. Đường nối dọc giữa các mốc. */
function InviteMilestone({ n, title, note, last = false }: { n: number; title: string; note: string; last?: boolean }) {
  return (
    <View className="flex-row gap-4">
      <View className="items-center">
        <View className="h-11 w-11 items-center justify-center rounded-pill bg-primary-600">
          <Text className="font-heavy text-body text-white">{n}</Text>
        </View>
        {last ? null : <View className="mt-1 w-0.5 flex-1 bg-primary-100" style={{ minHeight: 18 }} />}
      </View>
      <View className="flex-1 pb-3">
        <Text className="font-strong text-cardTitle text-ink">{title}</Text>
        <Text className="mt-0.5 font-sans text-body text-muted">{note}</Text>
      </View>
    </View>
  );
}
