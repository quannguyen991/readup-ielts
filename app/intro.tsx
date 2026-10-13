import React, { useEffect } from 'react';
import { GoldHighlight } from '@/components/layout/GoldHighlight';
import { PhoneIntro } from '@/components/home/PhoneIntro';
import { PerchCat } from '@/components/mascot/PerchCat';
import { Image, Platform, Text, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Grid } from '@/components/layout/Grid';
import { GridBackdrop } from '@/components/layout/GridBackdrop';
import { CUTE_PALETTES } from '@/components/layout/cute-palettes';
import { HERO_FRAME, LightSweep } from '@/components/layout/LightHero';
import { HistoryHomeCard } from '@/components/history/HistoryHomeCard';
import { Hero3D, useHeroLogo } from '@/components/three/Hero3D';
import { Screen } from '@/components/layout/Screen';
import { Appear, PressScale } from '@/components/motion/Motion';
import { Badge, Button, Card, Icon, StickerCard, type IconName } from '@/components/ui';
import { INK, STICKER_TEXT_SHADOW, STICKER_TITLE_SHADOW } from '@/components/ui/StickerCard';
import { GlowStars } from '@/components/ui/GlowStars';
import { PLANS } from '@/lib/billing/plans';
import { ARTICLES } from '@/data/articles';
import { DICTATION_SENTENCES, TRANSLATION_SENTENCES } from '@/data/sentence-drills';
import { WRITING_PROMPTS } from '@/data/writing-repository';
import { CURRICULUM_TOTALS } from '@/services/math/curriculum';
import { satRwStats } from '@/data/sat-rw-repository';
import { bilingualStats } from '@/data/bilingual-repository';
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
import { stickerGradient } from '@/theme/tokens';
import { bi, useL, type Bi } from '@/i18n/useL';

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
    icon: 'book',
    sticker: require('../assets/illustrations/cute-home/task-stickers/reading.png'),
    colors: stickerGradient.primary,
    title: { vi: 'Reading', en: 'Reading' },
    lines: [{ vi: `${ieltsCount} passage IELTS · ${satCount} passage SAT`, en: `${ieltsCount} IELTS passages · ${satCount} SAT passages` }],
    badge: { vi: `${readableCount.toLocaleString('vi-VN')} BÀI`, en: `${readableCount.toLocaleString('en-US')} PASSAGES` },
    href: '/practice',
  },
  {
    icon: 'pencil',
    sticker: require('../assets/illustrations/cute-home/task-stickers/writing.png'),
    colors: stickerGradient.danger,
    title: { vi: 'Writing', en: 'Writing' },
    lines: [{ vi: 'Nhắc lỗi cấu trúc ngay lúc gõ, không cần mạng', en: 'Flags structure mistakes as you type, even offline' }],
    badge: { vi: `${WRITING_PROMPTS.length} ĐỀ`, en: `${WRITING_PROMPTS.length} PROMPTS` },
    href: '/write',
  },
  {
    icon: 'grid',
    sticker: require('../assets/illustrations/cute-home/task-stickers/sat.png'),
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
    icon: 'volume',
    sticker: require('../assets/illustrations/cute-home/task-stickers/listening.png'),
    colors: stickerGradient.info,
    title: { vi: 'Luyện câu', en: 'Sentences' },
    lines: [{ vi: 'Chép chính tả và dịch câu, chấm từng từ', en: 'Dictation and translation, marked word by word' }],
    badge: { vi: `${sentenceCount} CÂU`, en: `${sentenceCount} SENTENCES` },
    href: '/sentence',
  },
  {
    icon: 'letters',
    sticker: require('../assets/illustrations/cute-home/task-stickers/vocabulary.png'),
    colors: stickerGradient.success,
    title: { vi: 'Sổ từ vựng', en: 'Word notebook' },
    lines: [{ vi: 'Mỗi từ lưu kèm nguyên câu gặp nó', en: 'Every word saved with the sentence you found it in' }],
    badge: { vi: 'FSRS', en: 'FSRS' },
    href: '/vocabulary',
  },
  {
    icon: 'trending',
    sticker: require('../assets/illustrations/cute-home/task-stickers/roadmap.png'),
    colors: stickerGradient.warning,
    title: { vi: 'Lộ trình', en: 'Roadmap' },
    lines: [{ vi: `${CURRICULUM_TOTALS.stages} chặng, ${CURRICULUM_TOTALS.units} bài học xếp sẵn`, en: `${CURRICULUM_TOTALS.stages} stages, ${CURRICULUM_TOTALS.units} lessons laid out for you` }],
    badge: { vi: 'MIỄN PHÍ', en: 'FREE' },
    href: '/math',
  },
];

/*
  Đọc song ngữ đứng RIÊNG một hàng rộng dưới sáu thẻ, không chen thành thẻ thứ
  bảy: lưới ba cột mà bảy thẻ thì thẻ cuối đứng trơ trọi một mình một hàng.
  Hàng rộng cũng hợp với nội dung — đây là mảng đọc bài dài, hai thứ tiếng.
*/
const BILINGUAL_AREA: Area = {
  icon: 'languages',
  sticker: require('../assets/illustrations/cute-home/task-stickers/reading.png'),
  colors: stickerGradient.rose,
  title: { vi: 'Đọc báo song ngữ', en: 'Bilingual news' },
  lines: [{ vi: 'VOA, NASA, Global Voices và bài phân tích Band 9 · Anh–Việt · miễn phí cho mọi người', en: 'VOA, NASA, Global Voices and Band 9 analysis · English–Vietnamese · free for everyone' }],
  badge: { vi: `${bilingualStats().articles} BÀI`, en: `${bilingualStats().articles} ARTICLES` },
  href: '/bilingual',
};
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
  const selectedPalette = CUTE_PALETTES[useCuteAppearanceStore((state) => state.palette)];
  const palette = chiikawaTheme ? CUTE_PALETTES.strawberry : selectedPalette;
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

  // Điện thoại: bản riêng theo ngôn ngữ của trang Hôm nay; máy tính giữ bản giới thiệu đầy đủ.
  if (width < 640) {
    return (
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
    );
  }

  return (
    <Screen>
      {returning ? (
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
        {/*
          Bọc thêm một lớp HÀNG NGANG quanh nền. Nền lấy cả khung
          bằng `flex-1`, mà `flex-1` trong một cột cao-theo-nội-dung thì co về 0
          (flex-basis 0, không có chiều cao cha để chia). Đặt vào hàng ngang thì
          flex-1 ăn theo BỀ NGANG, còn chiều cao vẫn do nội dung bên trong quyết.
        */}
        {/*
          NỀN GIỐNG MÀN ĐỌC BÀI, không phải tinh vân tím.

          Trước đây hero dùng `AuroraBackdrop` với ba màu rất tối (#080C2A → #161046
          → #2A1152) kèm khối loang trôi chậm. Nó là một thế giới thứ ba trong cùng một
          app: nền trang thì sáng, màn làm bài thì lưới nhạt, riêng ô này tối đen.

          Giờ dùng ĐÚNG bộ màu và đúng hoạ tiết lưới của màn đọc bài. Kéo theo:
          chữ phải lật từ trắng sang mực, và hai nút bỏ variant "trên nền tối".
          Đổi nền mà giữ chữ trắng thì câu tiêu đề biến mất — đổi thì phải đổi cả cặp.
        */}
        <View style={{ position: 'relative', width: '100%', paddingTop: wide ? 92 : 0 }}>
        <View style={HERO_FRAME}>
          <View style={{ flex: 1, position: 'relative' }}>
          <GridBackdrop colors={palette.study} line={palette.studyLine} blobs={[palette.study[0], palette.study[2]]} showGrid={false}>
            {/* Ngôi sao phát sáng bên phải — chỉ trên máy tính. */}
            {star ? (
              <Hero3D scene="home" style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '42%' }} />
            ) : null}
            <View
              style={{
                paddingHorizontal: wide ? 40 : 22,
                paddingVertical: wide ? 52 : 30,
                paddingRight: star ? '40%' : wide ? 40 : 22,
              }}
            >
              <Badge label="IELTS · SAT" tone="neutral" shape="tag" />

              <Text
                className="mt-4 font-heavy text-paper-ink"
                style={{ fontSize: wide ? 44 : 28, lineHeight: wide ? 52 : 36 }}
              >
                {L('Luyện thi bằng đề thật,', 'Practise with real tests,')}
              </Text>
              {/* Dòng hai nằm trên một khối sáng hơn — mắt bắt được câu chốt trước
                  cả khi đọc hết dòng một. Lùi trái đúng bằng padding để hai dòng
                  vẫn thẳng mép chữ. */}
              {/*
                Khối nền của dòng hai lật từ `white/15` sang màu chàm đặc: trên nền
                sáng thì một lớp trắng mờ không tạo ra ranh giới nào. Chữ trong khối ấy
                thành trắng — đây là chỗ DUY NHẤT còn chữ trắng trong hero.
              */}
              <GoldHighlight fontSize={wide ? 44 : 28} lineHeight={wide ? 52 : 36}>
                {L('sai chỗ nào biết chỗ đó', 'see exactly where you slip')}
              </GoldHighlight>

              <View className="mt-6 flex-row flex-wrap gap-2">
                <Button
                  label={L('Bắt đầu học', 'Start learning')}
                  variant="brand"
                  size="lg"
                  iconRight="arrow-right"
                  onPress={() => enterApp('/dashboard')}
                />
                <Button
                  label={L('Xem lộ trình SAT Math', 'See the SAT Math roadmap')}
                  variant="outline"
                  size="lg"
                  onPress={() => enterApp('/math')}
                />
              </View>

              <View className="mt-7 flex-row flex-wrap gap-2">
                <StatPill value={num(readableCount)} label={L('bài đọc', 'readings')} />
                <StatPill value={String(CURRICULUM_TOTALS.sets)} label={L('bộ đề Math', 'Math sets')} />
                <StatPill
                  value={num(CURRICULUM_TOTALS.questions)}
                  label={L('câu toán', 'math questions')}
                />
                <StatPill value={String(WRITING_PROMPTS.length)} label={L('đề Writing', 'Writing prompts')} />
              </View>
            </View>
          </GridBackdrop>
          {chiikawaTheme && wide ? (
            <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', inset: 0, zIndex: 4 }}>
              <Image
                source={require('../assets/illustrations/cute-home/task-stickers/chiikawa-climbers.png')}
                resizeMode="contain"
                style={{ position: 'absolute', top: 2, right: 8, width: 330, height: 110 }}
              />
            </View>
          ) : null}
          </View>
          <LightSweep />
        </View>
        {wide && !chiikawaTheme ? <PerchCat pose="sit" size={100} side="right" inset={120} offset={92} /> : null}
        {chiikawaTheme && wide ? (
          <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', inset: 0, zIndex: 6 }}>
            <Image
              source={require('../assets/illustrations/cute-home/task-stickers/chiikawa-border-climbers.png')}
              resizeMode="contain"
              style={{ position: 'absolute', right: 18, bottom: -24, width: 360, height: 120 }}
            />
          </View>
        ) : null}
        </View>
      </Appear>

      {/* ------------------------------------- Khám phá lịch sử (ẩn tới khi có cảnh xuất bản) */}
      <Appear index={1}>
        <HistoryHomeCard marginTop={28} />
      </Appear>

      {/* ---------------------------------------------------------- sáu mảng */}
      <Appear index={1}>
        <Text className="mt-14 font-heavy text-sectionTitle text-ink">{L('App có gì', "What's inside")}</Text>
        <Text className="mt-1 font-sans text-body" style={{ color: '#1E293B' }}>
          {L('Bảy mảng, dùng chung một sổ từ và một bảng tiến độ.', 'Seven areas sharing one word notebook and one progress board.')}
        </Text>
      </Appear>

      <View className="mt-5">
        <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={18}>
          {AREAS.map((area, index) => (
            <Appear key={area.href} index={index + 2} style={{ flex: 1 }}>
              <AreaCard area={area} chiikawaTheme={chiikawaTheme} colorIndex={index} />
            </Appear>
          ))}
        </Grid>
        <Appear index={AREAS.length + 2}>
          <View className="mt-5">
            <AreaCard area={BILINGUAL_AREA} chiikawaTheme={chiikawaTheme} colorIndex={0} />
          </View>
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
      borderColor: '#F2EEE6',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 6px 20px rgba(15,23,42,0.05)',
    }
  : { borderWidth: 1, borderColor: '#F2EEE6', elevation: 2 }) as never;


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
  return (
    <View className="flex-row items-baseline gap-1.5 rounded-pill border border-brand-soft bg-white px-3 py-1.5">
      <Text className="font-heavy text-body text-brand">{value}</Text>
      <Text className="font-sans text-label text-paper-muted">{label}</Text>
    </View>
  );
}

/** Một mảng học: thẻ khối bóng lệch, chùm sao phát sáng ở góc, viên nhãn ghim đáy là con số thật của mảng đó. */
const CHIIKAWA_AREA_COLORS: readonly (readonly [string, string])[] = [
  ['#F7CBD8', '#C65A78'], ['#F5B8CC', '#B85273'], ['#FCE0E9', '#D97F9B'],
  ['#F8D4DE', '#C65A78'], ['#F5B8CC', '#A64462'], ['#F9C6D6', '#C65A78'],
];

/** Tư thế mèo bám lên mép trên của từng thẻ mảng (theo thứ tự thẻ). */
const AREA_CAT_POSE = ['sit', 'hangingPaws', 'curl', 'peeking', 'stretch', 'lie'] as const;

function AreaCard({ area, chiikawaTheme, colorIndex }: { area: Area; chiikawaTheme: boolean; colorIndex: number }) {
  const { locale } = useL();
  const colors = chiikawaTheme ? CHIIKAWA_AREA_COLORS[colorIndex % CHIIKAWA_AREA_COLORS.length] : area.colors;
  // Theme mặc định: mèo bám lên mép trên thẻ. Theme Chiikawa đã có nhân vật riêng trên thẻ.
  const perch = !chiikawaTheme;
  return (
    <View style={{ flex: 1, position: 'relative', paddingTop: perch ? 44 : 0 }}>
    <PressScale fill onPress={() => enterApp(area.href)} style={{ flex: 1 }}>
      <StickerCard bold colors={colors} style={{ flex: 1 }} ornament={<GlowStars />}>
        <View style={{ height: chiikawaTheme ? 112 : 48, position: 'relative' }}>
          <View
            className="h-12 w-12 items-center justify-center rounded-panel bg-white"
            style={Platform.OS === 'web' ? ({ boxShadow: '0 2px 6px rgba(15,23,42,0.18)' } as object) : undefined}
          >
            <Icon name={area.icon} size={22} color={colors[1]} strokeWidth={2} />
          </View>
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

        <Text className="font-heavy text-sectionTitle text-white" style={[STICKER_TITLE_SHADOW, { marginTop: chiikawaTheme ? 2 : 14 }]}>
          {bi(area.title, locale)}
        </Text>

        {/* Chữ trắng đặc có quầng mực mờ: đầu sáng của gradient (thẻ cam, thẻ
            xanh lá) không làm chữ chìm. */}
        <View className="mt-2 gap-1.5">
          {area.lines.map((line) => (
            <Text key={line.vi} className="font-semi text-label text-white" style={STICKER_TEXT_SHADOW}>
              {bi(line, locale)}
            </Text>
          ))}
        </View>

        {/* Đẩy viên nhãn xuống đáy để các thẻ có nhãn thẳng hàng dù chữ dài ngắn khác nhau. */}
        <View className="flex-1" />

        <View className="mt-5 flex-row items-center justify-between gap-2">
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
    {perch ? <PerchCat pose={AREA_CAT_POSE[colorIndex % AREA_CAT_POSE.length] ?? 'sit'} size={64} side={colorIndex % 2 ? 'left' : 'right'} inset={28} offset={44} /> : null}
    </View>
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
