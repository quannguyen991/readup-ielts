import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { MathQuestionView } from '@/components/math/MathQuestionView';
import { MathRunner } from '@/components/math/MathRunner';
import { ExamShell } from '@/components/layout/ExamShell';
import { RwReviewItem } from '@/components/sat-rw/RwReviewItem';
import { RwRunner } from '@/components/sat-rw/RwRunner';
import {
  Button,
  Icon,
  IconCircle,
  PaperCard,
  ProgressBar,
  type IconName,
  type IconTone,
} from '@/components/ui';
import { countCorrect, gradeMathSession, type MathResponse } from '@/services/math/grade';
import { LinearGradient } from 'expo-linear-gradient';
import type { MockItem } from '@/services/sat-rw/mock/item';
import {
  BREAK_MINUTES,
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
  type ModuleReview,
} from '@/services/sat-rw/mock/full-test';
import { color, spacing as space } from '@/theme/tokens';
import { PageTransition } from '@/components/motion/Motion';
import { useGameStore } from '@/store/useGameStore';
import { useCityStore } from '@/store/useCityStore';

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
  const [reviewing, setReviewing] = useState(false);

  const start = useCallback(() => {
    setReviewing(false);
    setState(startFullTest(`full-${Date.now()}`));
  }, []);

  // Xong cả bài thi thử đầy đủ → thép cho Thành Phố Tri Thức. Mã = hạt giống lượt thi,
  // nên mở lại màn kết quả hay tải lại trang không cộng lần hai.
  const finishedSeed = state?.stage.kind === 'result' ? state.seed : null;
  useEffect(() => {
    if (finishedSeed) useCityStore.getState().earn({ type: 'mock_test', id: `sat-full:${finishedSeed}` });
  }, [finishedSeed]);

  /*
    Mỗi chặng của bài thi — giới thiệu, hai module R&W, nghỉ, hai module Math,
    kết quả, xem lại — vào bằng đúng nhịp chuyển trang. Đây là màn dài nhất app,
    chuyển chặng mà cụt ngang thì người thi không nhận ra mình vừa sang phần mới.
  */
  if (!state) {
    return (
      <PageTransition routeKey="intro">
        <Intro onStart={start} />
      </PageTransition>
    );
  }

  const { stage } = state;

  if (stage.kind === 'rw') {
    return (
      <PageTransition routeKey={`rw-${stage.module}`}>
      <RwRunner
        key={`rw-${stage.module}`}
        title="Reading and Writing"
        phaseLabel={`Module ${stage.module} / 2 · ${stage.minutes} phút`}
        items={stage.items}
        minutes={stage.minutes}
        onFinish={(answers) => {
          const correct = countRwCorrect(stage.items, answers);
          useGameStore.getState().awardBatch(correct, stage.items.length, 'verbal', `${state.seed}:rw${stage.module}`);
          setState((s) =>
            s
              ? submitModule(s, { correct, total: stage.items.length }, { kind: 'rw', answers })
              : s,
          );
        }}
      />
      </PageTransition>
    );
  }

  if (stage.kind === 'math') {
    return (
      <PageTransition routeKey={`math-${stage.module}`}>
      <MathRunner
        key={`math-${stage.module}`}
        title="Math"
        phaseLabel={`Module ${stage.module} / 2 · ${stage.minutes} phút`}
        items={stage.items}
        minutes={stage.minutes}
        submitLabel="Nộp module"
        surface="paper"
        onFinish={(responses: MathResponse[]) => {
          const attempts = gradeMathSession(stage.items, responses);
          const correct = countCorrect(attempts);
          setState((s) =>
            s
              ? submitModule(s, { correct, total: stage.items.length }, { kind: 'math', attempts })
              : s,
          );
        }}
      />
      </PageTransition>
    );
  }

  if (stage.kind === 'break') {
    return (
      <PageTransition routeKey="break">
        <BreakScreen
          minutes={stage.minutes}
          onContinue={() => setState((s) => (s ? endBreak(s) : s))}
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition routeKey={reviewing ? 'review' : 'result'}>
      {reviewing ? (
        <ReviewScreen state={state} onBack={() => setReviewing(false)} />
      ) : (
        <ResultScreen state={state} onRestart={start} onReview={() => setReviewing(true)} />
      )}
    </PageTransition>
  );
}

/**
 * Đếm câu đúng cho một module R&W.
 *
 * Con số này đi cùng bài làm vào `submitModule`, và máy trạng thái đếm LẠI từ
 * bài làm rồi so — lệch nhau là ném. Nên hàm ở đây không phải nguồn sự thật, nó
 * chỉ là thứ được đem đi đối chiếu.
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
    <ExamShell>
      <LightHero
        scene="math"
        badge="DIGITAL SAT · FULL TEST"
        line1="Thi thử SAT đầy đủ"
        line2="một mạch từ đầu tới cuối"
        subtitle="Đúng khổ đề Digital SAT của College Board: hai phần, mỗi phần hai module; module sau khó dễ tuỳ module trước."
        footer={
          <>
            <HeroStat value="98" label="câu hỏi" />
            <HeroStat value="134" label="phút làm bài" />
            <HeroStat value="144" label="phút tính cả nghỉ" />
          </>
        }
      >
        <Button
          label="Bắt đầu thi"
          variant="brand"
          size="lg"
          iconRight="chevron-right"
          onPress={onStart}
        />
        {/*
          Đi thẳng tới /sat chứ không `router.back()`: mở trực tiếp bằng đường
          dẫn vẫn phải có một nơi lùi rõ ràng, không phụ thuộc lịch sử trình duyệt.
        */}
        <Button label="Để sau" variant="outline" size="lg" onPress={() => router.replace('/sat')} />
      </LightHero>

      {/*
        Hai cột trên desktop. Một thẻ dòng thời gian trải hết bề ngang trang để
        chứa năm dòng ngắn thì hai phần ba thẻ là khoảng trắng, và hai thẻ lưu ý
        bị đẩy xuống dưới màn hình đầu — trong khi chúng chính là thứ người học
        cần đọc TRƯỚC khi bấm bắt đầu.
      */}
      <View className="mt-4" style={{ marginBottom: space['2xl'] }}>
        <Grid columns={2} tabletColumns={1} mobileColumns={1} gap={12}>
          <PaperCard>
            <View className="flex-row items-center gap-2.5">
              <IconCircle name="clock" tone="primary" size={34} />
              <Text className="font-strong text-cardTitle text-paper-ink">Bài thi đi thế nào</Text>
            </View>
            <View className="mt-3">
              {STAGES.map((s, i) => (
                <StageRow key={s.label} stage={s} last={i === STAGES.length - 1} />
              ))}
            </View>
          </PaperCard>

          <View style={{ gap: 12 }}>
            <Note
              icon="trending"
              tone="accent"
              title="Module 2 khó dễ tuỳ module 1"
              body="Làm tốt phần đầu thì phần sau khó hơn — và trần điểm cũng cao hơn. Đây là cách đề thật hoạt động, không phải hình phạt."
            />
            <Note
              icon="lock"
              tone="danger"
              title="Nộp module là không quay lại"
              body="Hết giờ thì tự nộp, kể cả khi còn câu chưa làm. Đề thật không cho cộng giờ."
            />
          </View>
        </Grid>
      </View>
    </ExamShell>
  );
}

/**
 * Một lưu ý trước khi thi.
 *
 * Icon có MÀU RIÊNG theo nội dung chứ không phải cùng một tông cho đều: một cái nói
 * về độ khó thay đổi, một cái nói về chuyện không quay lại được. Hai chuyện khác
 * nhau, và cái thứ hai là cái mà người học cần thấy trước khi bấm bắt đầu.
 */
function Note({
  icon,
  tone,
  title,
  body,
}: {
  icon: IconName;
  tone: IconTone;
  title: string;
  body: string;
}) {
  return (
    <PaperCard>
      <View className="flex-row gap-3">
        <IconCircle name={icon} tone={tone} size={38} />
        <View className="min-w-0 flex-1">
          <Text className="font-strong text-body text-paper-ink">{title}</Text>
          <Text className="mt-1.5 font-sans text-body text-paper-body" style={{ lineHeight: 22 }}>
            {body}
          </Text>
        </View>
      </View>
    </PaperCard>
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
          className={`h-2.5 w-2.5 rounded-pill ${rest ? 'bg-warning' : 'bg-brand-mid'}`}
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
          <View className="flex-1 bg-brand-soft" style={{ width: 2, marginVertical: 4 }} />
        )}
      </View>
      {/*
        Thời lượng nằm bên phải khi còn chỗ, tụt xuống dòng dưới khi hết. Ép nó
        đứng bên phải trên màn 375px thì cả nhãn lẫn thời lượng đều gãy hai dòng
        và bốn mẩu chữ đan vào nhau.
      */}
      <View className={last ? 'flex-1' : 'flex-1 pb-3.5'}>
        <View className={wide ? 'flex-row items-baseline justify-between gap-3' : ''}>
          <Text className={`font-sans text-body ${rest ? 'text-warning-ink' : 'text-paper-ink'}`}>
            {stage.label}
          </Text>
          <Text className="font-semi text-label text-paper-muted">{stage.detail}</Text>
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
  const startedAt = useRef(0);
  const done = useRef(false);

  const continueRef = useRef(onContinue);
  useEffect(() => {
    continueRef.current = onContinue;
  }, [onContinue]);

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
    <ExamShell>
      <View className="items-center" style={{ paddingTop: 40 }}>
        <PaperCard className="w-full items-center" style={{ maxWidth: 520, paddingVertical: 32 }}>
          <IconCircle name="clock" tone="warning" size={64} />
          <Text className="mt-4 font-strong text-label uppercase text-paper-muted">
            Nghỉ giữa giờ
          </Text>
          <Text
            className="font-heavy text-warning-ink"
            style={{ fontSize: 56, lineHeight: 64, fontVariant: ['tabular-nums'] }}
          >
            {formatClock(remainingMs)}
          </Text>
          <Text
            className="mt-1 max-w-[400px] text-center font-sans text-body text-paper-body"
            style={{ lineHeight: 23 }}
          >
            Xong phần Reading and Writing. Đứng dậy, uống nước, đừng xem lại câu vừa làm —
            phần sau là Math và nó không liên quan gì tới phần vừa rồi.
          </Text>
          <View className="mt-6">
            <Button label="Vào phần Math sớm" iconRight="chevron-right" onPress={onContinue} />
          </View>
          <Text className="mt-3 text-center font-sans text-label text-paper-muted">
            Hết {minutes} phút là tự vào phần Math.
          </Text>
        </PaperCard>
      </View>
    </ExamShell>
  );
}

/** mm:ss, không âm. Cùng khuôn với đồng hồ của hai phòng thi. */
function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ kết quả */

function ResultScreen({
  state,
  onRestart,
  onReview,
}: {
  state: FullTestState;
  onRestart: () => void;
  onReview: () => void;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const score = fullTestScore(state);
  if (!score) return null;

  const rwTier = state.rw.tier === 'harder' ? 'qua module 2 khó' : 'qua module 2 dễ';
  const mathTier = state.math.tier === 'harder' ? 'qua module 2 khó' : 'qua module 2 dễ';

  return (
    <ExamShell>
      <Text className="font-heavy text-pageTitle text-white">Kết quả</Text>
      <Text className="mt-1 font-sans text-body text-white/70">
        {FULL_TEST_QUESTIONS} câu · {FULL_TEST_TESTING_MINUTES} phút làm bài
      </Text>

      {/*
        MỘT PHIẾU ĐIỂM, không phải ba thẻ rời. Tổng nằm bên trái to hơn hẳn, hai
        phần cộng thành nó nằm ngay bên phải — nhìn một lần là thấy 200 + 200 =
        400. Bản trước xếp tổng thành một StatCard ngang hàng với hai phần, nên
        phải đọc nhãn mới biết cái nào cộng ra cái nào; mà tổng thì lại nằm trong
        một thẻ trắng rộng 1.250px với đúng ba dòng chữ dạt về mép trái.
      */}
      {/*
        Phiếu điểm giữ gradient, nhưng là gradient SÁNG hơn nền — không phải
        `gradient.hero` nữa. Nền trang đã là xanh→chàm→tím; đặt đúng bảng màu ấy
        lên trên nó thì tấm phiếu chìm hẳn vào nền, không còn là một tấm gì cả.
      */}
      <LinearGradient
        colors={SCORE_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 16, marginTop: 16, padding: 20 }}
      >
        <View className={wide ? 'flex-row items-center gap-8' : ''}>
          <View style={wide ? { width: 260 } : undefined}>
            <View className="flex-row items-center gap-2">
              <Icon name="trophy" size={18} color="#FFFFFF" strokeWidth={2} />
              <Text className="font-strong text-label uppercase text-white/80">Tổng điểm</Text>
            </View>
            <Text
              className="font-heavy text-white"
              style={{ fontSize: 64, lineHeight: 70, fontVariant: ['tabular-nums'] }}
            >
              {score.total}
            </Text>
            <Text className="font-sans text-body text-primary-100">thang 400–1600</Text>
          </View>

          {wide ? <View className="w-px self-stretch bg-white/25" /> : null}

          <View className={wide ? 'flex-1 gap-3' : 'mt-4 gap-3'}>
            <SectionScore
              icon="book"
              label="Reading and Writing"
              value={score.readingWriting}
              tier={rwTier}
            />
            <SectionScore icon="grid" label="Math" value={score.math} tier={mathTier} />
          </View>
        </View>
      </LinearGradient>

      <View className="mt-3">
        <Grid columns={2} tabletColumns={1} mobileColumns={1} gap={12}>
          <PaperCard>
            <View className="flex-row items-center gap-2.5">
              <IconCircle name="target" tone="primary" size={34} />
              <Text className="font-strong text-cardTitle text-paper-ink">
                Số câu đúng từng module
              </Text>
            </View>
            <View className="mt-2">
              <Line label="Reading and Writing — module 1" icon="book" r={state.rw.module1} />
              <Line label="Reading and Writing — module 2" icon="book" r={state.rw.module2} />
              <Line label="Math — module 1" icon="grid" r={state.math.module1} />
              <Line label="Math — module 2" icon="grid" r={state.math.module2} />
            </View>
          </PaperCard>

          <PaperCard className="bg-warning-soft">
            <View className="flex-row items-center gap-2.5">
              <IconCircle name="info" tone="warning" size={34} />
              <Text className="font-strong text-cardTitle text-warning-ink">
                Con số này là ước lượng
              </Text>
            </View>
            <Text className="mt-2.5 font-sans text-body text-body" style={{ lineHeight: 22 }}>
              College Board không công bố bảng quy đổi của đề số hoá, và bảng ấy còn đổi theo
              từng kỳ thi. Đây là phỏng theo — đủ để theo dõi tiến bộ giữa các lần làm, không
              đủ để dự đoán điểm thi thật.
            </Text>
            <Text className="mt-2 font-sans text-body text-body" style={{ lineHeight: 22 }}>
              Trần điểm phụ thuộc module 2 bạn được đưa vào: Reading and Writing {rwTier}, Math{' '}
              {mathTier}. Đúng như đề thật.
            </Text>
          </PaperCard>
        </Grid>
      </View>

      {/*
        "Xem lại" đứng TRƯỚC "thi lại", và là nút chính. Thi lại ngay là làm lại
        đúng những lỗi vừa mắc; chỗ điểm số lên được nằm ở bảng xem lại chứ không
        ở lượt thi kế tiếp.
      */}
      <View className="mt-5 flex-row flex-wrap gap-2" style={{ marginBottom: space['2xl'] }}>
        <Button label="Xem lại từng câu" iconRight="chevron-right" onPress={onReview} />
        <Button label="Thi lại đề khác" variant="onDark" iconLeft="refresh" onPress={onRestart} />
        <Button variant="onDark" label="Về trang SAT" onPress={() => router.replace('/sat')} />
      </View>
    </ExamShell>
  );
}

/** Gradient của phiếu điểm — sáng hơn nền trang một bậy để nổi lên. */
const SCORE_GRADIENT = ['#3B6DF6', '#4F46E5', '#8B5CF6'] as const;

/**
 * Điểm một phần, đặt cạnh tổng trên nền gradient.
 *
 * Nhắc luôn phần ấy đi qua module 2 nào: cùng một số câu đúng mà hai nhánh khác
 * nhau thì ra hai điểm khác nhau, nên bỏ dòng đó đi là để người học tự đoán vì
 * sao lần này 600 mà lần trước 520.
 *
 * Nền `white/15` chứ không phải một màu đặc: gradient phía sau đổi màu từ xanh
 * sang tím, mà một màu đặc đặt lên đó sẽ hợp ở đầu này và chỏi ở đầu kia.
 */
function SectionScore({
  icon,
  label,
  value,
  tier,
}: {
  icon: IconName;
  label: string;
  value: number;
  tier: string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-panel bg-white/15 px-4 py-3">
      <View className="h-10 w-10 items-center justify-center rounded-pill bg-white/25">
        <Icon name={icon} size={19} color="#FFFFFF" strokeWidth={2} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-strong text-body text-white">{label}</Text>
        <Text className="font-sans text-label text-primary-100">{tier}</Text>
      </View>
      <Text
        className="font-heavy text-white"
        style={{ fontSize: 28, lineHeight: 32, fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * Một dòng "module — số câu đúng", kèm thanh tỉ lệ.
 *
 * BỐN DÒNG NÀY ĐỂ ĐỐI CHIẾU VỚI NHAU, mà "18/27" và "14/22" thì phải chia nhẩm
 * mới biết cái nào hơn. Thanh tỉ lệ trả lời ngay bằng độ dài, còn con số vẫn ở đó
 * cho ai cần chính xác — số căn phải, chữ số đều bề ngang để hàng đơn vị thẳng nhau.
 *
 * Màu theo NGƯỠNG chứ không theo module: xanh lá từ 70% lên, xanh dương từ 45%,
 * dưới nữa là hồ phách. Bốn dòng bốn màu khác nhau chỉ vì chúng là bốn module thì
 * màu không nói gì cả, chỉ làm trang rực lên.
 */
function Line({
  label,
  icon,
  r,
}: {
  label: string;
  icon: IconName;
  r: { correct: number; total: number } | null;
}) {
  const ratio = r && r.total > 0 ? r.correct / r.total : 0;
  const pct = Math.round(ratio * 100);
  const tone = ratio >= 0.7 ? 'success' : ratio >= 0.45 ? 'primary' : 'warning';
  const dot = ratio >= 0.7 ? color.success : ratio >= 0.45 ? color.primary : color.warning;

  return (
    <View className="py-2">
      <View className="flex-row items-baseline justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <Icon name={icon} size={15} color={dot} strokeWidth={2} />
          <Text className="min-w-0 flex-1 font-sans text-body text-paper-body">{label}</Text>
        </View>
        <Text
          className="font-strong text-body text-paper-ink"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {r ? `${r.correct}/${r.total}` : '—'}
        </Text>
      </View>
      <View className="mt-1.5">
        <ProgressBar value={pct} tone={tone} height={7} />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ xem lại */

type ReviewFilter = 'wrong' | 'all';

/** Một câu đã tách ra khỏi module, kèm đủ thứ để lọc và để vẽ. */
type ReviewRow = {
  key: string;
  index: number;
  correct: boolean;
  blank: boolean;
  node: React.ReactNode;
};

function rowsOf(entry: ModuleReview): ReviewRow[] {
  if (entry.kind === 'rw') {
    return entry.items.map((item, i) => {
      const answer = entry.answers[i] ?? null;
      return {
        key: item.id,
        index: i,
        correct: answer === item.answerIndex,
        blank: answer === null,
        node: <RwReviewItem item={item} answer={answer} />,
      };
    });
  }

  return entry.items.map((item, i) => {
    const attempt = entry.attempts[i];
    return {
      key: item.id,
      index: i,
      correct: attempt?.isCorrect ?? false,
      blank: (attempt?.userAnswer ?? null) === null,
      node: (
        <MathQuestionView
          item={item}
          answer={attempt?.userAnswer ?? null}
          revealed
          showGrade={false}
        />
      ),
    };
  });
}

/**
 * Bảng màu ba trạng thái, khai MỘT CHỖ.
 *
 * Đứng chung một bảng thì ba trạng thái nói cùng một thứ tiếng ở mọi chỗ hiện ra
 * — dải đầu thẻ, nút chọn module, chú giải. Rải rác mỗi nơi một lần là sau vài
 * lần sửa thì "bỏ trống" ở chỗ này xám, chỗ kia hồ phách.
 *
 * Bỏ trống mang icon ĐỒNG HỒ chứ không phải dấu chấm hỏi: trong một bài thi có
 * đồng hồ, lý do thường gặp nhất của một ô trống là hết giờ, không phải không biết.
 */
type Status = 'correct' | 'wrong' | 'blank';

const STATUS: Record<
  Status,
  { label: string; icon: IconName; tone: IconTone; strip: string; text: string; ink: string }
> = {
  correct: {
    label: 'Đúng',
    icon: 'check',
    tone: 'success',
    strip: 'bg-success-soft',
    text: 'text-success-ink',
    ink: color.success,
  },
  wrong: {
    label: 'Sai',
    icon: 'close',
    tone: 'danger',
    strip: 'bg-danger-soft',
    text: 'text-danger-ink',
    ink: color.danger,
  },
  blank: {
    label: 'Bỏ trống',
    icon: 'clock',
    tone: 'warning',
    strip: 'bg-warning-soft',
    text: 'text-warning-ink',
    ink: color.warning,
  },
};

function statusOf(row: ReviewRow): Status {
  return row.correct ? 'correct' : row.blank ? 'blank' : 'wrong';
}

/**
 * Vỏ một câu ở màn xem lại: dải trạng thái tràn sát mép thẻ, rồi mới tới nội dung.
 *
 * DẢI TRÀN SÁT MÉP chứ không phải một cái chip nhỏ trong góc: cuộn qua hai chục
 * thẻ thì mắt bắt được mảng màu trước khi đọc được chữ, nên trạng thái phải là
 * mảng chứ không phải một điểm. Có đủ icon + chữ + màu — màu không đứng một mình.
 *
 * Vỏ này dùng cho CẢ R&W LẪN MATH, nên `MathQuestionView` được tắt nhãn đúng/sai
 * riêng của nó (`showGrade={false}`): hai nhãn "Sai" cách nhau hai centimet không
 * cho biết thêm gì.
 */
function ReviewCard({ row }: { row: ReviewRow }) {
  const st = STATUS[statusOf(row)];
  return (
    <PaperCard className="overflow-hidden" padded={false}>
      <View className={`flex-row items-center gap-2.5 px-5 py-3 ${st.strip}`}>
        <Icon name={st.icon} size={16} color={st.ink} strokeWidth={2.6} />
        <Text className={`font-strong text-cardTitle ${st.text}`}>Câu {row.index + 1}</Text>
        <Text className={`ml-auto font-strong text-label uppercase ${st.text}`}>{st.label}</Text>
      </View>
      <View className="p-5">{row.node}</View>
    </PaperCard>
  );
}

function moduleTitle(entry: ModuleReview): string {
  const section = entry.kind === 'rw' ? 'Reading and Writing' : 'Math';
  return `${section} — module ${entry.module}`;
}

/** Nhãn ngắn cho nút chọn module. */
function moduleChip(entry: ModuleReview): string {
  return `${entry.kind === 'rw' ? 'R&W' : 'Math'} ${entry.module}`;
}

/**
 * Bề ngang tối đa của một thẻ xem lại.
 *
 * `Screen` cho tới 1.440px, và một đoạn văn trải hết chừng ấy thì mỗi dòng dài
 * hơn 150 ký tự — đọc hết dòng là không tìm lại được đầu dòng sau. Phòng thi
 * chữa bằng cách chia đôi màn hình, nhưng ở đây không chia được: lời giải phải
 * nằm DƯỚI bốn phương án thì mới đọc theo đúng thứ tự. Nên hạ bề ngang.
 */
const REVIEW_COLUMN = 880;

/**
 * Xem lại cả bài thi, từng câu một.
 *
 * MỖI LẦN MỘT MODULE, và đây là chuyện hiệu năng chứ không phải sở thích: vẽ cả
 * 98 câu — mỗi câu một đoạn văn, bốn phương án, một lời giải — ra cùng một trang
 * cho hơn mười nghìn nút DOM, đủ để chính trình duyệt của tôi hết giờ khi chụp
 * màn hình. Một module là 27 câu, và đó cũng đúng cách người ta xem lại: hết
 * phần này rồi sang phần khác.
 *
 * MẶC ĐỌNH CHỈ HIỆN CÂU CHƯA ĐÚNG. Mở thẳng ra tất cả thì thứ người học cần —
 * mấy câu sai — nằm rải rác giữa những câu họ đã làm được, và cuộn hết chúng là
 * việc đủ chán để không ai làm lần thứ hai. "Tất cả" vẫn còn đó cho ai muốn soát
 * lại cả bài.
 *
 * BỎ TRỐNG ĐỨNG CHUNG VỚI SAI trong bộ lọc nhưng ĐƯỢC GẮN NHÃN RIÊNG trong từng
 * câu: cả hai đều là câu chưa lấy được điểm nên cùng cần xem lại, nhưng sai vì
 * hiểu nhầm và bỏ trống vì hết giờ là hai chứng bệnh khác nhau.
 */
function ReviewScreen({ state, onBack }: { state: FullTestState; onBack: () => void }) {
  const [filter, setFilter] = useState<ReviewFilter>('wrong');
  const [openModule, setOpenModule] = useState(0);

  const modules = state.review.map((entry) => ({ entry, rows: rowsOf(entry) }));
  const all = modules.flatMap((m) => m.rows);
  const wrongTotal = all.filter((r) => !r.correct).length;
  const blankTotal = all.filter((r) => r.blank).length;

  const current = modules[Math.min(openModule, modules.length - 1)];
  const rows = current?.rows ?? [];
  const shown = filter === 'all' ? rows : rows.filter((r) => !r.correct);
  const rightHere = rows.filter((r) => r.correct).length;

  return (
    <ExamShell>
      <View className="flex-row flex-wrap items-start justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3" style={{ minWidth: 260 }}>
          <View className="h-12 w-12 items-center justify-center rounded-panel bg-white/15">
            <Icon name="clipboard" size={22} color="#FFFFFF" strokeWidth={1.9} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-heavy text-pageTitle text-white">Xem lại bài thi</Text>
            <Text className="mt-1 font-sans text-body text-white/70">
              {all.length - wrongTotal}/{all.length} câu đúng
              {blankTotal > 0 ? ` · ${blankTotal} câu bỏ trống` : ''}
            </Text>
          </View>
        </View>
        <Button label="Về kết quả" variant="onDark" iconLeft="chevron-left" onPress={onBack} />
      </View>

      <PaperCard className="mt-4">
        <Text className="font-strong text-label uppercase text-paper-muted">Module</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {modules.map(({ entry, rows: r }, i) => {
            const wrong = r.filter((x) => !x.correct).length;
            return (
              <Button
                key={`${entry.kind}-${entry.module}`}
                label={`${moduleChip(entry)} · ${wrong} chưa đúng`}
                iconLeft={entry.kind === 'rw' ? 'book' : 'grid'}
                variant={i === openModule ? 'primary' : 'outline'}
                onPress={() => setOpenModule(i)}
              />
            );
          })}
        </View>

        <View className="mt-3 flex-row flex-wrap items-center gap-2 border-t border-brand-soft pt-3">
          <Button
            label="Câu chưa đúng"
            variant={filter === 'wrong' ? 'secondary' : 'ghost'}
            onPress={() => setFilter('wrong')}
          />
          <Button
            label="Tất cả"
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            onPress={() => setFilter('all')}
          />
          <View className="flex-row flex-wrap items-center gap-3 lg:ml-auto">
            {(['correct', 'wrong', 'blank'] as const).map((k) => (
              <View key={k} className="flex-row items-center gap-1.5">
                <Icon name={STATUS[k].icon} size={14} color={STATUS[k].ink} strokeWidth={2.6} />
                <Text className={`font-strong text-label ${STATUS[k].text}`}>
                  {STATUS[k].label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </PaperCard>

      {current ? (
        <View className="mt-6 flex-row items-center gap-2.5">
          <Icon
            name={current.entry.kind === 'rw' ? 'book' : 'grid'}
            size={18}
            color="#FFFFFF"
            strokeWidth={2}
          />
          <View className="min-w-0 flex-1">
            <Text className="font-strong text-cardTitle text-white">
              {moduleTitle(current.entry)}
            </Text>
            <Text className="font-sans text-label text-white/70">
              {rightHere}/{rows.length} câu đúng · đang hiện {shown.length} câu
            </Text>
          </View>
        </View>
      ) : null}

      {shown.length === 0 ? (
        <PaperCard className="mt-3 bg-success-soft" style={{ maxWidth: REVIEW_COLUMN }}>
          <View className="flex-row items-center gap-3">
            <IconCircle name="trophy" tone="success" size={44} />
            <View className="min-w-0 flex-1">
              <Text className="font-strong text-cardTitle text-success-ink">
                Module này không sai câu nào
              </Text>
              <Text className="mt-1 font-sans text-body text-paper-body" style={{ lineHeight: 22 }}>
                Bấm &quot;Tất cả&quot; nếu muốn soát lại lời giải của cả {rows.length} câu.
              </Text>
            </View>
          </View>
        </PaperCard>
      ) : (
        <View className="mt-3 gap-4" style={{ maxWidth: REVIEW_COLUMN }}>
          {shown.map((row) => (
            <ReviewCard key={row.key} row={row} />
          ))}
        </View>
      )}

      <View className="mt-6 flex-row flex-wrap gap-2" style={{ marginBottom: space['2xl'] }}>
        <Button label="Về kết quả" variant="onDark" iconLeft="chevron-left" onPress={onBack} />
        {openModule < modules.length - 1 ? (
          <Button
            label={`Sang ${moduleChip(modules[openModule + 1]!.entry)}`}
            variant="onDarkSolid"
            iconRight="chevron-right"
            onPress={() => setOpenModule(openModule + 1)}
          />
        ) : null}
      </View>
    </ExamShell>
  );
}

/** Dùng ở thanh tiến độ nếu về sau muốn hiện; giữ export để không mất khi refactor. */
export const __stageHelpers = { stageLabel, stageIndex, TOTAL_STAGES };
