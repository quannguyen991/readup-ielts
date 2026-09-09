import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { MathRunner } from '@/components/math/MathRunner';
import { RwRunner } from '@/components/sat-rw/RwRunner';
import {
  Button,
  Card,
  HeroBanner,
  IconCircle,
  type IconName,
  type IconTone,
} from '@/components/ui';
import { countCorrect, gradeMathSession, type MathResponse } from '@/services/math/grade';
import type { MockItem } from '@/services/sat-rw/mock/item';
import {
  BREAK_MINUTES,
  FULL_TEST_ELAPSED_MINUTES,
  FULL_TEST_QUESTIONS,
  FULL_TEST_TESTING_MINUTES,
  endBreak,
  fullTestScore,
  stageIndex,
  stageLabel,
  startFullTest,
  submitModule,
  TOTAL_STAGES,
  type FullTestState,
} from '@/services/sat-rw/mock/full-test';
import { spacing as space } from '@/theme/tokens';

/**
 * Bài thi SAT đầy đủ, đúng khổ đề số hoá.
 *
 * MÀN HÌNH KHÔNG GIỮ LUẬT NÀO. Toàn bộ thứ tự chặng, thích ứng và quy điểm nằm ở
 * `services/sat-rw/mock/full-test.ts` và có test thuần. Ở đây chỉ có: vẽ chặng
 * hiện tại, nhận kết quả, gọi `submitModule`. Luật nằm trong màn hình thì mỗi lần
 * đổi giao diện là một lần luật có thể trôi mà không ai thấy.
 *
 * HẠT GIỐNG CỐ ĐỊNH THEO LƯỢT THI. Sinh một lần lúc bắt đầu rồi giữ nguyên, nên
 * người học đóng app mở lại vẫn là đúng đề ấy — và hai người gửi nhau mã đề thì
 * làm chung một bài.
 */

export default function SatFullTestScreen() {
  const [state, setState] = useState<FullTestState | null>(null);

  const start = useCallback(() => {
    setState(startFullTest(`full-${Date.now()}`));
  }, []);

  if (!state) return <Intro onStart={start} />;

  const { stage } = state;

  if (stage.kind === 'rw') {
    return (
      <RwRunner
        key={`rw-${stage.module}`}
        title="Reading and Writing"
        phaseLabel={`Module ${stage.module} / 2 · ${stage.minutes} phút`}
        items={stage.items}
        minutes={stage.minutes}
        onFinish={(answers) => {
          const correct = countRwCorrect(stage.items, answers);
          setState((s) => (s ? submitModule(s, { correct, total: stage.items.length }) : s));
        }}
      />
    );
  }

  if (stage.kind === 'math') {
    return (
      <MathRunner
        key={`math-${stage.module}`}
        title="Math"
        phaseLabel={`Module ${stage.module} / 2 · ${stage.minutes} phút`}
        items={stage.items}
        minutes={stage.minutes}
        submitLabel="Nộp module"
        onFinish={(responses: MathResponse[]) => {
          const correct = countCorrect(gradeMathSession(stage.items, responses));
          setState((s) => (s ? submitModule(s, { correct, total: stage.items.length }) : s));
        }}
      />
    );
  }

  if (stage.kind === 'break') {
    return (
      <BreakScreen
        minutes={stage.minutes}
        onContinue={() => setState((s) => (s ? endBreak(s) : s))}
      />
    );
  }

  return <ResultScreen state={state} onRestart={start} />;
}

/**
 * Đếm câu đúng cho một module R&W.
 *
 * Không lưu đáp án người học vào state chung: màn này chỉ cần CON SỐ để chọn
 * module sau và để quy điểm. Giữ cả bài làm ở đây sẽ biến một màn hình thành nơi
 * chứa dữ liệu, mà nơi chứa dữ liệu thì phải có người dọn.
 */
function countRwCorrect(items: MockItem[], answers: (number | null)[]): number {
  return items.reduce((n, item, i) => (answers[i] === item.answerIndex ? n + 1 : n), 0);
}

/* ------------------------------------------------------------------ mở đầu */

type Stage = { label: string; detail: string; tone: 'work' | 'rest' };

const STAGES: readonly Stage[] = [
  { label: 'Reading and Writing — module 1', detail: '27 câu · 32 phút', tone: 'work' },
  { label: 'Reading and Writing — module 2', detail: '27 câu · 32 phút', tone: 'work' },
  { label: 'Nghỉ giữa giờ', detail: `${BREAK_MINUTES} phút`, tone: 'rest' },
  { label: 'Math — module 1', detail: '22 câu · 35 phút', tone: 'work' },
  { label: 'Math — module 2', detail: '22 câu · 35 phút', tone: 'work' },
];

/**
 * Màn mở đầu.
 *
 * Mở bằng `HeroBanner` như mọi trang khác trong app chứ không phải một dòng tiêu
 * đề trần: đây là cửa vào của một việc kéo dài hơn hai tiếng, mà bản cũ trông
 * nhẹ hơn cả trang Cài đặt.
 */
function Intro({ onStart }: { onStart: () => void }) {
  return (
    <Screen>
      <HeroBanner
        title="Thi thử SAT đầy đủ"
        subtitle="Đúng khổ đề Digital SAT của College Board: hai phần, mỗi phần hai module, module sau khó dễ tuỳ module trước. Làm một mạch từ đầu tới cuối."
        right={<TimeFigures />}
      >
        {/*
          `onDarkSolid` / `onDark` chứ không phải `primary` / `ghost`: hai variant
          kia được vẽ cho nền trắng, và trên gradient của banner thì nút "Để sau"
          biến mất hẳn — chữ mực trên nền tím. Đây là hai variant app đã có sẵn
          đúng cho chỗ này (Dashboard dùng `onDarkSolid` ở cùng vị trí).
        */}
        <View className="flex-row flex-wrap gap-2">
          <Button
            label="Bắt đầu thi"
            variant="onDarkSolid"
            iconRight="chevron-right"
            onPress={onStart}
          />
          {/*
            Đi thẳng tới /sat chứ không `router.back()`: route này ẩn hết thanh
            điều hướng (nó là phòng thi), nên nếu người học mở thẳng bằng đường
            dẫn thì `back()` không có chỗ để lùi và màn hình thành ngõ cụt.
          */}
          <Button label="Để sau" variant="onDark" onPress={() => router.replace('/sat')} />
        </View>
      </HeroBanner>

      {/*
        Hai cột trên desktop. Một thẻ dòng thời gian trải hết bề ngang trang để
        chứa năm dòng ngắn thì hai phần ba thẻ là khoảng trắng, và hai thẻ lưu ý
        bị đẩy xuống dưới màn hình đầu — trong khi chúng chính là thứ người học
        cần đọc TRƯỚC khi bấm bắt đầu.
      */}
      <View className="mt-4" style={{ marginBottom: space['2xl'] }}>
        <Grid columns={2} tabletColumns={1} mobileColumns={1} gap={12}>
          <Card>
            <Text className="font-strong text-cardTitle text-ink">Bài thi đi thế nào</Text>
            <View className="mt-3">
              {STAGES.map((s, i) => (
                <StageRow key={s.label} stage={s} last={i === STAGES.length - 1} />
              ))}
            </View>
          </Card>

          <View style={{ gap: 12 }}>
            <Card>
              <Text className="font-strong text-body text-ink">Module 2 khó dễ tuỳ module 1</Text>
              <Text className="mt-1.5 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
                Làm tốt phần đầu thì phần sau khó hơn — và trần điểm cũng cao hơn. Đây là
                cách đề thật hoạt động, không phải hình phạt.
              </Text>
            </Card>
            <Card>
              <Text className="font-strong text-body text-ink">Nộp module là không quay lại</Text>
              <Text className="mt-1.5 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
                Hết giờ thì tự nộp, kể cả khi còn câu chưa làm. Đề thật không cho cộng giờ.
              </Text>
            </Card>
          </View>
        </Grid>
      </View>
    </Screen>
  );
}

/**
 * Ba con số ở góc phải banner — chỗ `/math` để vòng tiến độ.
 *
 * HAI CON SỐ THỜI GIAN ĐỨNG RIÊNG, và đó là lý do khối này tồn tại chứ không
 * phải để lấp chỗ trống. `full-test.ts` cố ý tách `FULL_TEST_TESTING_MINUTES`
 * (134) khỏi `FULL_TEST_ELAPSED_MINUTES` (144) vì lẫn hai cái là nói sai về đề
 * thi: mọi tài liệu College Board ghi "2 giờ 14 phút" và đó là thời gian LÀM
 * BÀI. Người học cần biết trước là mình ngồi 144 phút, không phải 134.
 */
function TimeFigures() {
  return (
    <View className="rounded-panel bg-white/15 px-5 py-4" style={{ minWidth: 176 }}>
      <Figure value={String(FULL_TEST_QUESTIONS)} unit="câu" note="27+27 và 22+22" />
      <View className="my-3 h-px bg-white/25" />
      <Figure value={String(FULL_TEST_TESTING_MINUTES)} unit="phút" note="thời gian làm bài" />
      <View className="my-3 h-px bg-white/25" />
      <Figure
        value={String(FULL_TEST_ELAPSED_MINUTES)}
        unit="phút"
        note={`ngồi phòng thi, kể cả ${BREAK_MINUTES} phút nghỉ`}
      />
    </View>
  );
}

function Figure({ value, unit, note }: { value: string; unit: string; note: string }) {
  return (
    <View>
      <View className="flex-row items-baseline gap-1.5">
        <Text className="font-heavy text-white" style={{ fontSize: 26, lineHeight: 30 }}>
          {value}
        </Text>
        <Text className="font-strong text-body text-white/80">{unit}</Text>
      </View>
      <Text className="font-sans text-label text-white/70">{note}</Text>
    </View>
  );
}

/**
 * Một chặng trong dòng thời gian.
 *
 * Vẽ thành dòng thời gian có đường nối chứ không phải năm dòng gạch đầu dòng:
 * THỨ TỰ ở đây là thông tin — người học cần thấy Math nằm SAU giờ nghỉ, và giờ
 * nghỉ nằm giữa. Năm dấu chấm giống hệt nhau nói "năm thứ ngang hàng", đúng cái
 * ngược lại.
 */
function StageRow({ stage, last }: { stage: Stage; last: boolean }) {
  const { width } = useWindowDimensions();
  const wide = width >= 640;
  const rest = stage.tone === 'rest';
  return (
    <View className="flex-row">
      <View className="items-center" style={{ width: 22 }}>
        <View
          className={`h-2.5 w-2.5 rounded-pill ${rest ? 'bg-warning' : 'bg-primary-600'}`}
          style={{ marginTop: 7 }}
        />
        {/*
          Ray nối 2px màu `primary-200`, không phải 1px màu `border`. Bản đầu
          dùng `border` (#E9EDF5) rộng 1px trên nền thẻ trắng: nó CÓ trong DOM,
          đo được 25px chiều cao, nhưng nhìn màn hình thì không thấy gì — năm cái
          chấm rời nhau, đúng cái ý "năm thứ ngang hàng" mà dòng thời gian sinh
          ra để phủ định.
        */}
        {last ? null : (
          <View className="flex-1 bg-primary-200" style={{ width: 2, marginVertical: 4 }} />
        )}
      </View>
      {/*
        Thời lượng nằm bên phải khi còn chỗ, tụt xuống dòng dưới khi hết. Ép nó
        đứng bên phải trên màn 375px thì cả nhãn lẫn thời lượng đều gãy hai dòng
        và bốn mẩu chữ đan vào nhau.
      */}
      <View className={last ? 'flex-1' : 'flex-1 pb-3.5'}>
        <View className={wide ? 'flex-row items-baseline justify-between gap-3' : ''}>
          <Text className={`font-sans text-body ${rest ? 'text-warning-ink' : 'text-ink'}`}>
            {stage.label}
          </Text>
          <Text className="font-semi text-label text-muted">{stage.detail}</Text>
        </View>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------- nghỉ */

/**
 * Màn nghỉ giữa giờ — CÓ ĐỒNG HỒ.
 *
 * Bản trước ghi "Nghỉ 10 phút" rồi để một cái nút, không đếm gì cả. Màn hình nói
 * ra một khoảng thời gian mà không đo nó thì con số ấy chỉ là trang trí: người
 * học ngồi ba phút rồi bấm tiếp, và cái mình vừa hứa — "144 phút ngồi phòng thi,
 * đúng như đề thật" — thành sai ngay trong lượt thi đầu tiên.
 *
 * Hết giờ là tự vào phần Math, giống lúc hết giờ module là tự nộp. Nút vẫn còn
 * để ai nghỉ đủ rồi thì đi sớm — `endBreak` vốn đã nhận cả hai đường ấy.
 */
function BreakScreen({ minutes, onContinue }: { minutes: number; onContinue: () => void }) {
  const [remainingMs, setRemainingMs] = useState(minutes * 60_000);
  const startedAt = useRef(Date.now());
  const done = useRef(false);

  const continueRef = useRef(onContinue);
  continueRef.current = onContinue;

  useEffect(() => {
    startedAt.current = Date.now();
    const timer = setInterval(() => {
      const left = minutes * 60_000 - (Date.now() - startedAt.current);
      setRemainingMs(left);
      if (left <= 0 && !done.current) {
        done.current = true;
        continueRef.current();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [minutes]);

  return (
    <Screen>
      <View className="items-center" style={{ paddingTop: 40 }}>
        <Card className="w-full items-center" style={{ maxWidth: 520, paddingVertical: 32 }}>
          <IconCircle name="clock" tone="warning" size={64} />
          <Text className="mt-4 font-strong text-label uppercase text-muted">Nghỉ giữa giờ</Text>
          <Text
            className="font-heavy text-warning-ink"
            style={{ fontSize: 56, lineHeight: 64, fontVariant: ['tabular-nums'] }}
          >
            {formatClock(remainingMs)}
          </Text>
          <Text
            className="mt-1 max-w-[400px] text-center font-sans text-body text-muted"
            style={{ lineHeight: 23 }}
          >
            Xong phần Reading and Writing. Đứng dậy, uống nước, đừng xem lại câu vừa làm —
            phần sau là Math và nó không liên quan gì tới phần vừa rồi.
          </Text>
          <View className="mt-6">
            <Button label="Vào phần Math sớm" iconRight="chevron-right" onPress={onContinue} />
          </View>
          <Text className="mt-3 text-center font-sans text-label text-subtle">
            Hết {minutes} phút là tự vào phần Math.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

/** mm:ss, không âm. Cùng khuôn với đồng hồ của hai phòng thi. */
function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ kết quả */

function ResultScreen({ state, onRestart }: { state: FullTestState; onRestart: () => void }) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const score = fullTestScore(state);
  if (!score) return null;

  const rwTier = state.rw.tier === 'harder' ? 'qua module 2 khó' : 'qua module 2 dễ';
  const mathTier = state.math.tier === 'harder' ? 'qua module 2 khó' : 'qua module 2 dễ';

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">Kết quả</Text>
      <Text className="mt-1 font-sans text-body text-muted">
        {FULL_TEST_QUESTIONS} câu · {FULL_TEST_TESTING_MINUTES} phút làm bài
      </Text>

      {/*
        MỘT PHIẾU ĐIỂM, không phải ba thẻ rời. Tổng nằm bên trái to hơn hẳn, hai
        phần cộng thành nó nằm ngay bên phải — nhìn một lần là thấy 200 + 200 =
        400. Bản trước xếp tổng thành một StatCard ngang hàng với hai phần, nên
        phải đọc nhãn mới biết cái nào cộng ra cái nào; mà tổng thì lại nằm trong
        một thẻ trắng rộng 1.250px với đúng ba dòng chữ dạt về mép trái.
      */}
      <Card className="mt-4">
        <View className={wide ? 'flex-row items-center gap-8' : ''}>
          <View style={wide ? { width: 260 } : undefined}>
            <Text className="font-strong text-label uppercase text-muted">Tổng điểm</Text>
            <Text
              className="font-heavy text-ink"
              style={{ fontSize: 64, lineHeight: 70, fontVariant: ['tabular-nums'] }}
            >
              {score.total}
            </Text>
            <Text className="font-sans text-body text-muted">thang 400–1600</Text>
          </View>

          {wide ? <View className="w-px self-stretch bg-borderStrong" /> : null}

          <View className={wide ? 'flex-1 gap-3' : 'mt-4 gap-3'}>
            <SectionScore
              icon="book"
              tone="primary"
              label="Reading and Writing"
              value={score.readingWriting}
              tier={rwTier}
            />
            <SectionScore
              icon="grid"
              tone="accent"
              label="Math"
              value={score.math}
              tier={mathTier}
            />
          </View>
        </View>
      </Card>

      <View className="mt-3">
        <Grid columns={2} tabletColumns={1} mobileColumns={1} gap={12}>
          <Card>
            <Text className="font-strong text-cardTitle text-ink">Số câu đúng từng module</Text>
            <View className="mt-3">
              <Line label="Reading and Writing — module 1" r={state.rw.module1} />
              <Line label="Reading and Writing — module 2" r={state.rw.module2} />
              <Line label="Math — module 1" r={state.math.module1} />
              <Line label="Math — module 2" r={state.math.module2} last />
            </View>
          </Card>

          <Card variant="flat">
            <Text className="font-strong text-cardTitle text-ink">Con số này là ước lượng</Text>
            <Text className="mt-2.5 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
              College Board không công bố bảng quy đổi của đề số hoá, và bảng ấy còn đổi theo
              từng kỳ thi. Đây là phỏng theo — đủ để theo dõi tiến bộ giữa các lần làm, không
              đủ để dự đoán điểm thi thật.
            </Text>
            <Text className="mt-2 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
              Trần điểm phụ thuộc module 2 bạn được đưa vào: Reading and Writing {rwTier}, Math{' '}
              {mathTier}. Đúng như đề thật.
            </Text>
          </Card>
        </Grid>
      </View>

      <View className="mt-5 flex-row flex-wrap gap-2" style={{ marginBottom: space['2xl'] }}>
        <Button label="Thi lại đề khác" iconRight="chevron-right" onPress={onRestart} />
        <Button variant="ghost" label="Về trang SAT" onPress={() => router.replace('/sat')} />
      </View>
    </Screen>
  );
}

/**
 * Điểm một phần, đặt cạnh tổng.
 *
 * Nhắc luôn phần ấy đi qua module 2 nào: cùng một số câu đúng mà hai nhánh khác
 * nhau thì ra hai điểm khác nhau, nên bỏ dòng đó đi là để người học tự đoán vì
 * sao lần này 600 mà lần trước 520.
 */
function SectionScore({
  icon,
  tone,
  label,
  value,
  tier,
}: {
  icon: IconName;
  tone: IconTone;
  label: string;
  value: number;
  tier: string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-panel bg-surfaceAlt px-4 py-3">
      <IconCircle name={icon} tone={tone} size={40} />
      <View className="min-w-0 flex-1">
        <Text className="font-strong text-body text-ink">{label}</Text>
        <Text className="font-sans text-label text-muted">{tier}</Text>
      </View>
      <Text
        className="font-heavy text-ink"
        style={{ fontSize: 28, lineHeight: 32, fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * Một dòng "module — số câu đúng".
 *
 * Số căn phải và dùng chữ số đều bề ngang: bốn dòng này để ĐỐI CHIẾU với nhau,
 * mà số căn trái thì hàng đơn vị không thẳng nên mắt phải đọc từng con một.
 */
function Line({
  label,
  r,
  last,
}: {
  label: string;
  r: { correct: number; total: number } | null;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-baseline justify-between py-2 ${
        last ? '' : 'border-b border-border'
      }`}
    >
      <Text className="font-sans text-body text-body">{label}</Text>
      <Text className="font-strong text-body text-ink" style={{ fontVariant: ['tabular-nums'] }}>
        {r ? `${r.correct}/${r.total}` : '—'}
      </Text>
    </View>
  );
}

/** Dùng ở thanh tiến độ nếu về sau muốn hiện; giữ export để không mất khi refactor. */
export const __stageHelpers = { stageLabel, stageIndex, TOTAL_STAGES };
