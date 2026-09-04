import React, { useEffect, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { AuroraBackdrop } from '@/components/layout/AuroraBackdrop';
import { Screen } from '@/components/layout/Screen';
import { Appear, PressScale } from '@/components/motion/Motion';
import { AssetImage, Badge, Button, Card, Icon, StickerCard, type IconName } from '@/components/ui';
import { assetKeys } from '@/services/assets/useAssets';
import {
  PLANS,
  PLAN_ORDER,
  PLUS_TRIAL_DAYS,
  PLUS_TRIAL_PLAN,
  TRIAL_DAYS,
  TRIAL_PLAN,
  formatVnd,
  type PlanId,
} from '@/lib/billing/plans';
import { ARTICLES } from '@/data/articles';
import { DICTATION_SENTENCES, TRANSLATION_SENTENCES } from '@/data/sentence-drills';
import { WRITING_PROMPTS } from '@/data/writing-repository';
import { CURRICULUM_TOTALS } from '@/services/math/curriculum';
import { satRwStats } from '@/data/sat-rw-repository';
import { rememberInviteCode } from '@/services/referral/pending';
import { useMathStore } from '@/store/useMathStore';
import { useStudyStore } from '@/store/useStudyStore';
import { paper, stickerGradient } from '@/theme/tokens';

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
    lines: [
      `${readableCount.toLocaleString('vi-VN')} bài toàn văn từ nguồn công khai`,
      `${ieltsCount} passage IELTS · ${satCount} passage SAT`,
      'Xem lại từng câu kèm bằng chứng trong bài',
    ],
    badge: `${readableCount.toLocaleString('vi-VN')} BÀI`,
    href: '/practice',
  },
  {
    icon: 'pencil',
    colors: stickerGradient.danger,
    title: 'Writing',
    lines: [
      `${task1Count} đề Task 1 có biểu đồ vẽ sẵn`,
      `${task2Count} đề Task 2 theo 5 dạng luận`,
      'Nhắc lỗi cấu trúc ngay lúc gõ, không cần mạng',
    ],
    badge: `${WRITING_PROMPTS.length} ĐỀ`,
    href: '/write',
  },
  {
    icon: 'grid',
    colors: stickerGradient.accent,
    title: 'SAT',
    lines: [
      `Math: ${CURRICULUM_TOTALS.sets} bộ đề, đủ 19 kỹ năng Digital SAT`,
      `Verbal: ${satRwStats().questions} câu, đủ 4 mảng đề thật`,
      'Đáp án tính bằng code, không do AI đoán',
    ],
    badge: `${(CURRICULUM_TOTALS.questions + satRwStats().questions).toLocaleString('vi-VN')} CÂU`,
    href: '/sat',
  },
  {
    icon: 'volume',
    colors: stickerGradient.info,
    title: 'Luyện câu',
    lines: [
      `${DICTATION_SENTENCES.length} câu chép chính tả, chấm từng từ`,
      `${TRANSLATION_SENTENCES.length} câu dịch Việt – Anh có đáp án mẫu`,
      'Chắc cấu trúc câu trước khi viết cả bài',
    ],
    badge: `${sentenceCount} CÂU`,
    href: '/sentence',
  },
  {
    icon: 'letters',
    colors: stickerGradient.success,
    title: 'Sổ từ vựng',
    lines: [
      'Mỗi từ lưu kèm nguyên câu gặp nó',
      'Gặp lại đúng lúc sắp quên, không ôn tràn',
      'Bốn kiểu thẻ, tra nghĩa ngay trong lúc đọc',
    ],
    badge: 'FSRS',
    href: '/vocabulary',
  },
  {
    icon: 'trending',
    colors: stickerGradient.warning,
    title: 'Lộ trình',
    lines: [
      `${CURRICULUM_TOTALS.stages} chặng, ${CURRICULUM_TOTALS.units} bài học xếp sẵn`,
      'Mở đầu bằng bài chẩn đoán 19 câu',
      'Trọn chặng Đại số nằm trong bản Free',
    ],
    badge: 'MIỄN PHÍ',
    href: '/math',
  },
];

const DIFFERENCES: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: 'check',
    title: 'Đáp án toán tính bằng code, không do AI đoán',
    body:
      'Mỗi câu SAT Math dựng từ tham số rồi suy ra đáp án từ chính tham số đó, nên đề và đáp án không thể lệch nhau. Bộ kiểm chứng chạy 200 hạt cho mỗi dạng, đọc ngược từ đề bài in ra — thế nghiệm vào phương trình phải ra 0.',
  },
  {
    icon: 'info',
    title: 'Sai ở đâu được gọi đúng tên chỗ đó',
    body:
      'Mỗi đáp án nhiễu dựng từ một sai lầm có tên — sai dấu, quên nhân phân phối, lấy nhầm mẫu số. Chọn nhầm cái nào thì màn xem lại nói đúng cái đó, và thống kê gộp lại cho thấy bạn hay hỏng kiểu gì.',
  },
  {
    icon: 'flame',
    title: 'Học được ngay, không cần tài khoản',
    body:
      'Mở lên là học. Dữ liệu nằm trên máy bạn. Đăng nhập chỉ để mang tiến độ sang máy khác — không phải cửa vào, và không có bước bắt tạo tài khoản trước khi cho xem gì.',
  },
];

const STEPS: Array<{ n: string; title: string; body: string }> = [
  {
    n: '1',
    title: 'Làm bài chẩn đoán',
    body: '19 câu, mỗi kỹ năng một câu. Xong là có bản đồ mình thủng chỗ nào.',
  },
  {
    n: '2',
    title: 'Đi theo lộ trình',
    body: 'Mỗi bài học có 5 bộ đề siết dần thời gian, từ làm quen tới chốt kỹ năng.',
  },
  {
    n: '3',
    title: 'Thi thử đúng khổ đề',
    body: 'Hai module × 22 câu × 35 phút, module sau đổi độ khó theo kết quả module trước.',
  },
];

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
  const [yearly, setYearly] = useState(false);

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
                onPress={() => router.push('/dashboard' as never)}
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
        <View style={{ flexDirection: 'row', borderRadius: 24, overflow: 'hidden' }}>
          <AuroraBackdrop>
            <View
              style={{
                paddingHorizontal: wide ? 40 : 22,
                paddingVertical: wide ? 52 : 30,
              }}
            >
              <Badge label="IELTS · SAT" tone="neutral" shape="tag" />

              <Text
                className="mt-4 font-heavy text-white"
                style={{ fontSize: wide ? 44 : 28, lineHeight: wide ? 52 : 36 }}
              >
                Luyện thi bằng đề thật,
              </Text>
              {/* Dòng hai nằm trên một khối sáng hơn — mắt bắt được câu chốt trước
                  cả khi đọc hết dòng một. Lùi trái đúng bằng padding để hai dòng
                  vẫn thẳng mép chữ. */}
              <View
                className="mt-1.5 self-start rounded-md bg-white/15 px-2.5 py-1"
                style={{ marginLeft: -10 }}
              >
                <Text
                  className="font-heavy text-white"
                  style={{ fontSize: wide ? 44 : 28, lineHeight: wide ? 52 : 36 }}
                >
                  sai chỗ nào biết chỗ đó
                </Text>
              </View>

              <Text className="mt-4 font-sans text-bodyLg text-white/90" style={{ maxWidth: 620 }}>
                ReadUp gộp Reading, Writing, sổ từ và trọn lộ trình SAT Math vào một chỗ. Đề sinh mới
                mỗi lượt, đáp án tính bằng code, và mỗi câu sai được gọi đúng tên lỗi.
              </Text>

              <View className="mt-6 flex-row flex-wrap gap-2">
                <Button
                  label="Bắt đầu học"
                  variant="onDarkSolid"
                  size="lg"
                  iconRight="arrow-right"
                  onPress={() => router.push('/dashboard' as never)}
                />
                <Button
                  label="Xem lộ trình SAT Math"
                  variant="onDark"
                  size="lg"
                  onPress={() => router.push('/math' as never)}
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
          </AuroraBackdrop>
        </View>
      </Appear>

      {/* ---------------------------------------------------------- sáu mảng */}
      <Appear index={1}>
        <Text className="mt-8 font-heavy text-sectionTitle text-ink">App có gì</Text>
        <Text className="mt-1 font-sans text-body text-muted">
          Sáu mảng, dùng chung một sổ từ và một bảng tiến độ.
        </Text>
      </Appear>

      <View className="mt-4">
        <Grid columns={3} tabletColumns={2} mobileColumns={1}>
          {AREAS.map((area, index) => (
            <Appear key={area.title} index={index + 2} style={{ height: '100%' }}>
              <AreaCard area={area} />
            </Appear>
          ))}
        </Grid>
      </View>

      {/* -------------------------------------------------------- ba bước */}
      <Appear index={3}>
        <Text className="mt-8 font-heavy text-sectionTitle text-ink">Bắt đầu thế nào</Text>
      </Appear>
      <View className="mt-4">
        <Grid columns={3} tabletColumns={3} mobileColumns={1}>
          {STEPS.map((step, index) => (
            <Appear key={step.n} index={index + 4} style={{ height: '100%' }}>
              <Card className="h-full">
                <View className="h-9 w-9 items-center justify-center rounded-pill bg-brand-soft">
                  <Text className="font-heavy text-body text-paper-ink">{step.n}</Text>
                </View>
                <Text className="mt-3 font-strong text-cardTitle text-ink">{step.title}</Text>
                <Text className="mt-1 font-sans text-body text-muted">{step.body}</Text>
              </Card>
            </Appear>
          ))}
        </Grid>
      </View>

      {/* ------------------------------------------------------ khác biệt */}
      <Appear index={5}>
        <Text className="mt-8 font-heavy text-sectionTitle text-ink">Khác gì các app khác</Text>
      </Appear>
      <View className="mt-4 gap-3">
        {DIFFERENCES.map((item, index) => (
          <Appear key={item.title} index={index + 6}>
            <Card>
              <View className="flex-row items-start gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-panel bg-brand-soft">
                  <Icon name={item.icon} size={18} color={paper.brandMid} />
                </View>
                <View className="flex-1">
                  <Text className="font-strong text-cardTitle text-ink">{item.title}</Text>
                  <Text className="mt-1 font-sans text-body text-muted">{item.body}</Text>
                </View>
              </View>
            </Card>
          </Appear>
        ))}
      </View>

      {/* ------------------------------------------------------------ giá */}
      <Appear index={7}>
        <Text className="mt-8 font-heavy text-sectionTitle text-ink">Gói và giá</Text>
        <Text className="mt-1 font-sans text-body text-muted">
          Bản Free dùng học thật được — trọn bài chẩn đoán và trọn chặng Đại số, không phải bản xem
          thử. Nâng cấp khi cần phần còn lại, không phải để bắt đầu.
        </Text>

        {/*
          Chuyển tháng/năm ngay tại đây thay vì bắt sang trang Nâng cấp mới thấy
          giá năm. Giá năm rẻ hơn đáng kể, mà người đang cân nhắc thì cân nhắc
          NGAY LÚC NÀY — bắt họ bấm sang trang khác để biết con số thứ hai là
          đánh mất đúng lúc họ còn đang quan tâm.
        */}
        <View className="mt-4 flex-row items-center gap-2">
          <CycleTab label="Trả tháng" active={!yearly} onPress={() => setYearly(false)} />
          <CycleTab label="Trả năm" active={yearly} onPress={() => setYearly(true)} />
          {yearly ? <Badge label="Tiết kiệm tới 29%" tone="success" shape="tag" /> : null}
        </View>
      </Appear>

      <View className="mt-4">
        <Grid columns={4} tabletColumns={2} mobileColumns={1}>
          {PLAN_ORDER.map((id, index) => (
            <Appear key={id} index={index + 8} style={{ height: '100%' }}>
              <PlanCard plan={PLANS[id]} yearly={yearly} />
            </Appear>
          ))}
        </Grid>
      </View>

      {/* Mời bạn: cách duy nhất lên gói trả phí mà không mất tiền, nên nó xứng
          đáng một khối riêng chứ không phải một dòng chú thích. */}
      <Appear index={12}>
        <Card className="mt-4">
          <View className="flex-row flex-wrap items-center gap-4">
            <AssetImage assetKey={assetKeys.illustration('referral-hero')} preset="card" />
            <View className="flex-1" style={{ minWidth: 220 }}>
              <Text className="font-strong text-cardTitle text-ink">
                Mời 10 người, nhận gói Plus
              </Text>
              <Text className="mt-1 font-sans text-body text-muted">
                Mỗi người bạn mời vào học thật sẽ cộng cho bạn một mốc. Đủ 10 mốc là mở khoá toàn bộ
                tính năng gói Plus, không phải trả đồng nào.
              </Text>
            </View>
            <Button
              label="Lấy link mời"
              variant="brandOutline"
              iconRight="arrow-right"
              onPress={() => router.push('/invite' as never)}
            />
          </View>
        </Card>
      </Appear>

      <Appear index={13}>
        <Text className="mt-3 text-center font-sans text-label text-subtle">
          Thanh toán bằng chuyển khoản QR. Dùng thử {PLUS_TRIAL_DAYS} ngày gói{' '}
          {PLANS[PLUS_TRIAL_PLAN].name} hoặc {TRIAL_DAYS} ngày gói {PLANS[TRIAL_PLAN].name}, không
          cần thẻ. Rủ bạn mua chung Plus/Pro/Max gói năm để được giảm tới 30% —
          xem chi tiết ở trang Nâng cấp.
        </Text>
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
                onPress={() => router.push('/math/diagnostic' as never)}
              />
              <Button
                label="Vào thẳng app"
                variant="brandOutline"
                onPress={() => router.push('/dashboard' as never)}
              />
            </View>
          </View>
        </Card>
      </Appear>

      <View className="h-6" />
    </Screen>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-row items-baseline gap-1.5 rounded-pill border border-white/25 bg-white/15 px-3 py-1.5">
      <Text className="font-heavy text-body text-white">{value}</Text>
      <Text className="font-sans text-label text-white/85">{label}</Text>
    </View>
  );
}

/** Một mảng học: thẻ sticker màu đặc, viên thuốc ghim đáy là con số thật của mảng đó. */
function AreaCard({ area }: { area: Area }) {
  return (
    <PressScale onPress={() => router.push(area.href as never)} style={{ height: '100%' }}>
      <StickerCard colors={area.colors} style={{ height: '100%' }}>
        {/* Hai ngôi sao chỉ để trang trí — chặn chạm để chúng không nuốt cú bấm
            vào thẻ ở góc trên phải. */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', right: 14, top: 12, opacity: 0.45 }}
        >
          <Icon name="sparkle" size={18} color="#fff" strokeWidth={1.6} />
        </View>
        <View
          pointerEvents="none"
          style={{ position: 'absolute', right: 38, top: 44, opacity: 0.28 }}
        >
          <Icon name="sparkle" size={12} color="#fff" strokeWidth={1.6} />
        </View>

        <View className="h-12 w-12 items-center justify-center rounded-panel bg-white/90">
          <Icon name={area.icon} size={22} color={area.colors[1]} strokeWidth={1.9} />
        </View>

        <Text className="mt-3.5 font-heavy text-sectionTitle text-white">{area.title}</Text>

        {/* Chữ trắng đặc, không giảm độ mờ: đầu sáng của gradient (thẻ cam, thẻ
            xanh lá) làm chữ mờ 90% tụt xuống dưới ngưỡng đọc được. */}
        <View className="mt-2 gap-1.5">
          {area.lines.map((line) => (
            <Text key={line} className="font-sans text-label text-white">
              {line}
            </Text>
          ))}
        </View>

        {/* Đẩy viên thuốc xuống đáy để sáu thẻ có badge thẳng hàng dù chữ dài ngắn khác nhau. */}
        <View className="flex-1" />

        <View className="mt-5 flex-row items-center justify-between gap-2">
          <View className="rounded-pill bg-white/25 px-3 py-1">
            <Text className="font-heavy text-label text-white" style={{ letterSpacing: 0.6 }}>
              {area.badge}
            </Text>
          </View>
          <Icon name="arrow-right" size={16} color="#fff" />
        </View>
      </StickerCard>
    </PressScale>
  );
}

/** Nút chọn chu kỳ thanh toán. */
function CycleTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PressScale onPress={onPress}>
      <View
        className={`rounded-pill border px-4 py-2 ${
          active ? 'border-brand bg-brand-tint' : 'border-border bg-surface'
        }`}
      >
        <Text className={`font-strong text-label ${active ? 'text-paper-ink' : 'text-muted'}`}>
          {label}
        </Text>
      </View>
    </PressScale>
  );
}

/**
 * Thẻ một gói.
 *
 * Hiện ĐỦ tính năng của gói chứ không chỉ tên và giá. Bản trước chỉ có ba dòng —
 * tên, giá, một câu mô tả — nên người đọc không có gì để so sánh giữa các gói và
 * phải bấm sang trang khác mới biết mình mua cái gì. Bảng giá mà không nói bán
 * gì thì không phải bảng giá.
 */
function PlanCard({ plan, yearly }: { plan: (typeof PLANS)[PlanId]; yearly: boolean }) {
  const price = yearly ? plan.yearlyVnd : plan.monthlyVnd;
  const free = plan.monthlyVnd === 0;

  return (
    <Card className={`h-full ${plan.recommended ? 'border-brand' : ''}`}>
      <View className="flex-row items-center justify-between gap-2">
        <Text className="font-strong text-cardTitle text-ink">{plan.name}</Text>
        {plan.recommended ? (
          <View className="self-start rounded-md bg-brand-mid px-2.5 py-1">
            <Text className="font-semi text-label text-white">Phổ biến</Text>
          </View>
        ) : null}
      </View>

      <Text className="mt-2 font-heavy text-stat text-ink">
        {free ? 'Miễn phí' : formatVnd(price)}
      </Text>
      {!free ? (
        <Text className="font-sans text-label text-muted">{yearly ? 'mỗi năm' : 'mỗi tháng'}</Text>
      ) : null}

      <Text className="mt-2 font-sans text-label text-muted">{plan.tagline}</Text>

      <View className="mt-3 gap-1.5">
        {plan.highlights.map((line) => (
          <View key={line} className="flex-row items-start gap-2">
            <Icon name="check" size={14} color={paper.brandMid} />
            <Text className="flex-1 font-sans text-label text-ink">{line}</Text>
          </View>
        ))}
      </View>

      <View className="flex-1" />

      <Button
        className="mt-4"
        label={free ? 'Bắt đầu miễn phí' : `Chọn ${plan.name}`}
        variant={plan.recommended ? 'brand' : 'brandOutline'}
        fullWidth
        onPress={() => router.push((free ? '/dashboard' : '/upgrade') as never)}
      />
    </Card>
  );
}
