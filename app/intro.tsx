import React, { useEffect } from 'react';
import { Platform, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Grid } from '@/components/layout/Grid';
import { GridBackdrop, LIGHT_LINE, LIGHT_STOPS } from '@/components/layout/GridBackdrop';
import { HERO_FRAME, LightSweep } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear, PressScale } from '@/components/motion/Motion';
import { Badge, Button, Card, Icon, type IconName } from '@/components/ui';
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
import { stickerGradient } from '@/theme/tokens';

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
  /** Cặp màu sáng → đậm của thẻ sticker; lấy từ bảng chung để sáu thẻ không lệch tông. */
  colors: readonly [string, string];
  title: string;
  lines: string[];
  /** Chữ trong viên thuốc ghim đáy thẻ — con số thật, hoặc điều kiện dùng. */
  badge: string;
  href: string;
};

const AREAS: Area[] = [
  {
    icon: 'book',
    colors: stickerGradient.primary,
    title: 'Reading',
    lines: [`${ieltsCount} passage IELTS · ${satCount} passage SAT`],
    badge: `${readableCount.toLocaleString('vi-VN')} BÀI`,
    href: '/practice',
  },
  {
    icon: 'pencil',
    colors: stickerGradient.danger,
    title: 'Writing',
    lines: ['Nhắc lỗi cấu trúc ngay lúc gõ, không cần mạng'],
    badge: `${WRITING_PROMPTS.length} ĐỀ`,
    href: '/write',
  },
  {
    icon: 'grid',
    colors: stickerGradient.accent,
    title: 'SAT',
    lines: ['Đáp án tính bằng code, không do AI đoán'],
    badge: `${(CURRICULUM_TOTALS.questions + satRwStats().questions).toLocaleString('vi-VN')} CÂU`,
    href: '/sat',
  },
  {
    icon: 'volume',
    colors: stickerGradient.info,
    title: 'Luyện câu',
    lines: ['Chép chính tả và dịch câu, chấm từng từ'],
    badge: `${sentenceCount} CÂU`,
    href: '/sentence',
  },
  {
    icon: 'letters',
    colors: stickerGradient.success,
    title: 'Sổ từ vựng',
    lines: ['Mỗi từ lưu kèm nguyên câu gặp nó'],
    badge: 'FSRS',
    href: '/vocabulary',
  },
  {
    icon: 'trending',
    colors: stickerGradient.warning,
    title: 'Lộ trình',
    lines: [`${CURRICULUM_TOTALS.stages} chặng, ${CURRICULUM_TOTALS.units} bài học xếp sẵn`],
    badge: 'MIỄN PHÍ',
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
  colors: stickerGradient.rose,
  title: 'Đọc báo song ngữ',
  lines: ['VOA, NASA, Global Voices và bài phân tích ReadUp · Anh–Việt · miễn phí cho mọi người'],
  badge: `${bilingualStats().articles} BÀI`,
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
  title: string;
  body: string;
}[] = [
  {
    n: '1',
    colors: stickerGradient.info,
    title: 'Làm bài chẩn đoán',
    body: '19 câu, mỗi kỹ năng một câu.',
  },
  {
    n: '2',
    colors: stickerGradient.primary,
    title: 'Đi theo lộ trình',
    body: 'Mỗi bài học 5 bộ đề, siết dần thời gian.',
  },
  {
    n: '3',
    colors: stickerGradient.accent,
    title: 'Thi thử đúng khổ đề',
    body: 'Hai module × 22 câu × 35 phút, độ khó đổi theo kết quả.',
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

  return (
    <Screen>
      {returning ? (
        <Appear>
          <Card className="mb-4">
            <View className="flex-row flex-wrap items-center justify-between gap-3">
              <View className="flex-1" style={{ minWidth: 200 }}>
                <Text className="font-strong text-cardTitle text-ink">Bạn đang học dở</Text>
                <Text className="mt-0.5 font-sans text-label text-muted">
                  Tiến độ vẫn nguyên. Cuộn xuống nếu muốn xem app có thêm gì.
                </Text>
              </View>
              <Button
                label="Tiếp tục học"
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
        <View style={HERO_FRAME}>
          <GridBackdrop colors={LIGHT_STOPS} line={LIGHT_LINE} showGrid={false}>
            <View
              style={{
                paddingHorizontal: wide ? 40 : 22,
                paddingVertical: wide ? 52 : 30,
              }}
            >
              <Badge label="IELTS · SAT" tone="neutral" shape="tag" />

              <Text
                className="mt-4 font-heavy text-paper-ink"
                style={{ fontSize: wide ? 44 : 28, lineHeight: wide ? 52 : 36 }}
              >
                Luyện thi bằng đề thật,
              </Text>
              {/* Dòng hai nằm trên một khối sáng hơn — mắt bắt được câu chốt trước
                  cả khi đọc hết dòng một. Lùi trái đúng bằng padding để hai dòng
                  vẫn thẳng mép chữ. */}
              {/*
                Khối nền của dòng hai lật từ `white/15` sang màu chàm đặc: trên nền
                sáng thì một lớp trắng mờ không tạo ra ranh giới nào. Chữ trong khối ấy
                thành trắng — đây là chỗ DUY NHẤT còn chữ trắng trong hero.
              */}
              <View
                className="mt-1.5 self-start rounded-md bg-brand-mid px-3 py-1"
                style={{ marginLeft: -10 }}
              >
                <Text
                  className="font-heavy text-white"
                  style={{ fontSize: wide ? 44 : 28, lineHeight: wide ? 52 : 36 }}
                >
                  sai chỗ nào biết chỗ đó
                </Text>
              </View>

              <Text className="mt-4 font-sans text-bodyLg text-paper-body" style={{ maxWidth: 620 }}>
                Đề dựng bằng code chứ không gọi AI, đáp án kiểm được từ chính bài đọc, và mỗi câu
                sai được gọi đúng tên lỗi.
              </Text>

              <View className="mt-6 flex-row flex-wrap gap-2">
                <Button
                  label="Bắt đầu học"
                  variant="brand"
                  size="lg"
                  iconRight="arrow-right"
                  onPress={() => enterApp('/dashboard')}
                />
                <Button
                  label="Xem lộ trình SAT Math"
                  variant="outline"
                  size="lg"
                  onPress={() => enterApp('/math')}
                />
              </View>

              <View className="mt-7 flex-row flex-wrap gap-2">
                <StatPill value={readableCount.toLocaleString('vi-VN')} label="bài đọc" />
                <StatPill value={String(CURRICULUM_TOTALS.sets)} label="bộ đề Math" />
                <StatPill
                  value={CURRICULUM_TOTALS.questions.toLocaleString('vi-VN')}
                  label="câu toán"
                />
                <StatPill value={String(WRITING_PROMPTS.length)} label="đề Writing" />
              </View>
            </View>
          </GridBackdrop>
          <LightSweep />
        </View>
      </Appear>

      {/* ---------------------------------------------------------- sáu mảng */}
      <Appear index={1}>
        <Text className="mt-14 font-heavy text-sectionTitle text-ink">App có gì</Text>
        <Text className="mt-1 font-sans text-body" style={{ color: '#1E293B' }}>
          Bảy mảng, dùng chung một sổ từ và một bảng tiến độ.
        </Text>
      </Appear>

      <View className="mt-5">
        <Grid columns={3} tabletColumns={2} mobileColumns={1}>
          {AREAS.map((area, index) => (
            <Appear key={area.title} index={index + 2} style={{ height: '100%' }}>
              <AreaCard area={area} />
            </Appear>
          ))}
        </Grid>
        <Appear index={AREAS.length + 2}>
          <View className="mt-4">
            <AreaCard area={BILINGUAL_AREA} />
          </View>
        </Appear>
      </View>

      {/* -------------------------------------------------------- ba bước */}
      <Appear index={3}>
        <Text className="mt-14 font-heavy text-sectionTitle text-ink">Bắt đầu thế nào</Text>
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
              <Text className="font-strong text-label uppercase tracking-[1.4px] text-primary-600">Học miễn phí</Text>
              <Text className="mt-2 font-heavy text-pageTitle text-ink">
                Rủ bạn cùng học,{'\n'}mở khoá toàn bộ app.
              </Text>
              <Text className="mt-3 max-w-[520px] font-sans text-bodyLg text-muted">
                Mỗi người bạn mời tạo tài khoản và học thật được tính một mốc. Không cần thẻ, không phải trả đồng nào.
              </Text>
              <View className="mt-6 flex-row flex-wrap gap-2">
                <Button
                  label="Lấy link mời"
                  variant="brand"
                  size="lg"
                  iconRight="arrow-right"
                  onPress={() => router.push('/invite' as never)}
                />
              </View>
            </View>

            <View className="gap-3" style={{ flexBasis: 360, flexGrow: 1 }}>
              <InviteMilestone n={1} title="Lấy link mời của bạn" note="Gửi qua Zalo, Messenger, nhóm lớp." />
              <InviteMilestone
                n={REFERRALS_PER_REWARD}
                title={`${REFERRALS_PER_REWARD} bạn học thật`}
                note={`${REWARD_MONTHS} tháng gói ${PLANS[REWARD_PLAN].name}: trợ giảng AI, chấm Writing, mọi bộ đề.`}
              />
              <InviteMilestone
                n={MAX_TIER_REFERRALS}
                title={`${MAX_TIER_REFERRALS} bạn học thật`}
                note={`Lên gói ${PLANS[MAX_REWARD_PLAN].name} — gói cao nhất.`}
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
              Bắt đầu từ bài chẩn đoán
            </Text>
            <Text className="mt-2 max-w-[520px] text-center font-sans text-body text-muted">
              19 câu, khoảng 30 phút. Xong là biết nên luyện gì trước, thay vì luyện ngẫu nhiên rồi
              hy vọng trúng chỗ yếu.
            </Text>
            <View className="mt-4 flex-row flex-wrap justify-center gap-2">
              <Button
                label="Làm bài chẩn đoán"
                variant="brand"
                iconRight="arrow-right"
                onPress={() => enterApp('/math/diagnostic')}
              />
              <Button
                label="Vào thẳng app"
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
      borderColor: '#E6EAF2',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 6px 20px rgba(15,23,42,0.05)',
    }
  : { borderWidth: 1, borderColor: '#E6EAF2', elevation: 2 }) as never;


/**
 * Một bước trong ba bước mở đầu.
 *
 * Số bước nằm trong huy hiệu gradient chứ không phải viên xám: nó là thứ dẫn
 * mắt, và ba màu đi theo thứ tự cũng là thứ duy nhất còn nói được "đây là một
 * đường đi" khi màn hẹp và ba thẻ xếp dọc.
 */
function StepCard({ step }: { step: (typeof STEPS)[number] }) {
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
          style={{ borderWidth: 2, borderColor: '#0F172A' }}
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
        <Text className="mt-3 font-strong text-cardTitle text-ink">{step.title}</Text>
        <Text className="mt-1 font-sans text-body text-muted">{step.body}</Text>
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

/** Một mảng học: thẻ sticker màu đặc, viên thuốc ghim đáy là con số thật của mảng đó. */
function AreaCard({ area }: { area: Area }) {
  const tone = area.colors[1];
  return (
    <PressScale onPress={() => enterApp(area.href)} style={{ height: '100%' }}>
      <View className="h-full rounded-[18px] bg-surface p-5" style={softCard}>
        <View className="flex-row items-center justify-between">
          <View className="h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${tone}1A` }}>
            <Icon name={area.icon} size={21} color={tone} strokeWidth={2} />
          </View>
          <Icon name="arrow-right" size={18} color="#94A3B8" />
        </View>

        <Text className="mt-4 font-strong text-[19px] leading-7 text-ink">{area.title}</Text>
        <View className="mt-1 gap-1">
          {area.lines.map((line) => (
            <Text key={line} className="font-sans text-[15px] leading-6 text-muted">
              {line}
            </Text>
          ))}
        </View>

        {/* Đẩy con số xuống đáy để các thẻ thẳng hàng dù chữ dài ngắn khác nhau. */}
        <View className="flex-1" />
        <Text className="mt-4 font-semi text-[14px]" style={{ color: tone }}>
          {area.badge}
        </Text>
      </View>
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
