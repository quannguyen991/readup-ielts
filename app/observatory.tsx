import React from 'react';
import { Text, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui';
import rawSummary from '@/data/provenance-summary.json';
import type { Counts, ModelCounts } from '@/services/provenance/ledger';
import { color, radius, spacing as space } from '@/theme/tokens';
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Badge } from '@/components/illust/Cute';
import type { IconName } from '@/components/ui/Icon';

/**
 * Kiểu khai TƯỜNG MINH, không suy từ chính tệp JSON.
 *
 * Suy từ tệp thì lúc kho nhãn rỗng, `byModel: []` cho ra `never[]` và mọi chỗ
 * đọc `m.model` thành lỗi biên dịch — tức là trang chỉ dịch được khi đã có số
 * liệu. Một trang có nhiệm vụ nói "chưa đủ dữ liệu" mà không dịch nổi lúc chưa
 * có dữ liệu thì hỏng đúng vào lúc cần nó nhất.
 */
type Summary = {
  measuredFrom: string | null;
  measuredTo: string | null;
  preregistration: { threshold: number; minSample: number; registeredIn: string };
  verdict: { kind: string; text: string };
  overall: Counts;
  byModel: ModelCounts[];
  /** Tách theo dạng câu, nối từ tệp nội dung lúc xuất tóm tắt. */
  byType: {
    type: string;
    blindRuns: number;
    blindRejections: number;
    blindRejectionRate: number | null;
  }[];
};

const summary = rawSummary as unknown as Summary;

/**
 * Đài quan sát: bao nhiêu phần trăm đề do AI sinh trả lời được mà không cần đọc bài.
 *
 * VIẾT BẰNG TIẾNG ANH, có chủ ý — cùng lý do đã ghi ở `src/i18n/keys.ts`: đây là
 * mặt để NGƯỜI NGOÀI đọc được cơ chế. Giáo viên nước ngoài, giám khảo, người muốn
 * đem bộ đo này về chạy trên bộ sinh đề của họ. Nội dung học liệu vẫn tiếng Việt;
 * phần nói về cơ chế thì không thể chỉ nói một thứ tiếng.
 *
 * TRANG NÀY PHẢI ĐÚNG Ở MỌI GIAI ĐOẠN, kể cả khi chưa đủ dữ liệu. Nó đọc thẳng
 * phán quyết đã đăng ký trước, nên lúc mẫu còn nhỏ nó nói "chưa đủ, không kết luận"
 * chứ không hiện một con số ai đó sẽ trích dẫn. Một trang tự nói mình chưa đủ dữ
 * liệu đáng tin hơn một trang có số.
 */

type ModelRow = ModelCounts;

/**
 * Dạng câu mà phép thử bịt mắt PHÁN XỬ ĐƯỢC.
 *
 * Giữ đồng bộ với `NOT_A_PROPOSITION` trong `services/provenance/blind-gate.ts`.
 * Khai lại ở đây thay vì import: trang đọc một tệp tóm tắt tĩnh có thể sinh ra từ
 * một lần đo cũ, nên nó phải hiển thị được cả những dạng mà bộ đo bây giờ đã thôi
 * kiểm — và vẫn nói rõ dạng nào không phán xử được.
 */
const JUDGEABLE_TYPES: ReadonlySet<string> = new Set([
  'true_false_not_given',
  'yes_no_not_given',
  'multiple_choice',
  'sat_words_in_context',
  'sat_central_idea',
  'sat_command_of_evidence',
  'sat_inference',
  'sat_text_structure',
  'sat_transitions',
  'sat_rhetorical_synthesis',
]);

const VERDICT_TONE: Record<string, { bg: string; fg: string; label: string }> = {
  'sample-too-small': { bg: color.warningSoft, fg: color.warning, label: 'NO CONCLUSION YET' },
  'below-threshold': { bg: color.infoSoft, fg: color.info, label: 'BELOW PRE-REGISTERED THRESHOLD' },
  'above-threshold': { bg: color.dangerSoft, fg: color.danger, label: 'ABOVE PRE-REGISTERED THRESHOLD' },
};

/**
 * Phán quyết viết sẵn bằng tiếng Việt trong `ledger.ts`; ở đây dựng lại bằng tiếng
 * Anh từ cùng một MÃ. Không dịch câu văn kia — dịch ngược một câu đã viết là chỗ
 * nghĩa bị trôi. Cùng cách mà `scripts/verify-credential.ts` làm.
 */
function verdictEn(kind: string, runs: number, rate: number | null): string {
  const pct = rate === null ? '—' : `${(rate * 100).toFixed(1)}%`;
  const threshold = `${summary.preregistration.threshold * 100}%`;
  if (kind === 'sample-too-small') {
    return `${runs} blind runs, below the pre-registered minimum of ${summary.preregistration.minSample}. No conclusion is drawn from this figure.`;
  }
  if (kind === 'below-threshold') {
    return `Rejection rate ${pct}, below the ${threshold} threshold registered before measuring. The blind gate catches less than it costs: double the model calls to remove fewer than one item in twelve. The mechanism is right in principle but not worth the money at this scale.`;
  }
  return `Rejection rate ${pct} over ${runs} blind runs, above the ${threshold} threshold registered before measuring. A meaningful share of AI-generated reading questions can be answered without reading the passage, and no formal rule catches them.`;
}

/**
 * Một dòng model.
 *
 * DÒNG CHƯA ĐỦ MẪU PHẢI NHÌN LÀ BIẾT. Vẽ nó giống hệt dòng đủ mẫu là mời người
 * đọc so 6,7% trên 15 lượt với 30,2% trên 169 lượt — và họ sẽ kết luận model đầu
 * tốt gấp bốn. Ở đây nó mờ đi, mất chữ đậm, và mang thẳng chữ "too few to compare"
 * ngay cạnh tên.
 */
function Row({ model }: { model: ModelRow }) {
  const rate = model.blindRejectionRate;
  const weak = !model.comparable;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: space.sm,
        borderTopWidth: 1,
        borderTopColor: color.border,
        gap: space.md,
        opacity: weak ? 0.55 : 1,
      }}
    >
      <Text
        style={{
          width: 76,
          fontWeight: weak ? '400' : '700',
          color: rate === null || weak ? color.subtle : color.ink,
        }}
      >
        {rate === null ? 'not run' : `${(rate * 100).toFixed(1)}%`}
      </Text>
      <Text style={{ width: 88, color: color.muted, fontVariant: ['tabular-nums'] }}>
        {model.blindRejections}/{model.blindRuns}
      </Text>
      {/* Hai dòng: màn hẹp mà một dòng thì ghi chú "too few runs" bị cắt mất. */}
      <Text style={{ flex: 1, color: color.body }} numberOfLines={2}>
        {model.model}
        {weak ? (
          <Text style={{ color: color.warning, fontSize: 12 }}>
            {'  '}· too few runs to compare
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

const CAVEATS: readonly string[] = [
  /*
    ĐẶT LÊN ĐẦU, có chủ ý. Tên model hiện ngay bên trên trong bảng, nên người
    đọc mặc định coi chúng là đã xác minh. Chúng KHÔNG. Đã đo được: ba endpoint
    là ba backend khác nhau (ba prompt mở, nhiệt độ 0, không cặp nào trùng câu
    nào). Chưa đo được: hãng nào làm ra chúng — và một endpoint mang nhãn OpenAI
    đã trả lời "Gemini 3.5 Flash is no longer available", nên nhãn của gateway
    không đáng tin một mình.
  */
  'Model names come from the serving gateway and are NOT independently verified — one endpoint labelled as an OpenAI model answered "Gemini 3.5 Flash is no longer available". What was verified is that the endpoints are distinct: three open-ended probes at temperature 0 gave three different answers, 0 of 3 matches for every pair. So no model graded its own output, but the vendor attribution should not be relied on.',
  '"A model could answer it blind" is a lower bound on leakage, not a verdict on pedagogical worth. Real exams also contain items partly answerable from general knowledge.',
  'The passage corpus is Wikipedia, Project Gutenberg and PLOS — not real exam passages.',
  'The judge is itself a model. It is anchored against people answering the same items with passages withheld, and that agreement rate is published even when it is poor.',
  'One fixed judge scores every generator. Rotating judges would put judge strictness inside the comparison; the cost is that absolute numbers carry this judge’s fingerprint.',
];

export default function ObservatoryScreen() {
  const { overall, byModel, verdict, preregistration } = summary;
  const tone = VERDICT_TONE[verdict.kind] ?? VERDICT_TONE['sample-too-small']!;

  return (
    <Screen>
      <View style={{ maxWidth: 760, gap: space.lg }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 13, color: color.accent, fontWeight: '700', letterSpacing: 0.6 }}>
                OPEN MEASUREMENT
              </Text>
              <Text style={{ fontSize: 30, fontWeight: '800', color: color.ink, marginTop: 4 }}>
                How often does an AI-written reading question not need the passage?
              </Text>
            </View>
            <PageStickers scene="review" compact />
          </View>
          <Text style={{ fontSize: 15, color: color.muted, marginTop: space.sm, lineHeight: 22 }}>
            Every question ReadUp generates is answered by a second model that is never shown the
            passage. If that model gets it right and says the answer was determinable, the question
            does not test reading, and it is thrown away. This page is what those verdicts add up to.
          </Text>
          <Text style={{ fontSize: 13, color: color.subtle, marginTop: space.sm }}>
            Bản tiếng Việt của cơ chế nằm trong sổ bằng chứng của app; trang này để người ngoài đọc.
          </Text>
        </View>

        <Card>
          <View style={{ gap: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <View aria-hidden>
              <Badge icon="target" color="#F2B632" size={34} />
            </View>
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: tone.bg,
                paddingHorizontal: space.sm,
                paddingVertical: 4,
                borderRadius: radius.sm,
              }}
            >
              <Text style={{ color: tone.fg, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 }}>
                {tone.label}
              </Text>
            </View>
            </View>

            <Text style={{ fontSize: 15, color: color.body, lineHeight: 23 }}>
              {verdictEn(verdict.kind, overall.blindRuns, overall.blindRejectionRate)}
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.lg }}>
              <Stat label="items" value={String(overall.items)} />
              <Stat label="blind runs" value={String(overall.blindRuns)} />
              <Stat label="rejected" value={String(overall.blindRejections)} />
              <Stat
                label="could not be checked"
                value={String(overall.blindNotRun)}
                hint="outside the fraction"
              />
            </View>
          </View>
        </Card>

        <Card>
          <CardTitle icon="gauge" tone="#4A7FE8">
            {byModel.length > 1 ? 'By model' : 'Model measured'}
          </CardTitle>
          <Text style={{ fontSize: 13, color: color.muted, marginTop: 4, marginBottom: space.sm }}>
            {byModel.length > 1
              ? 'Worst first. The generation prompt already forbids this failure in six explicit rules — so this measures how often each model does it anyway, after being told not to.'
              : 'The generation prompt already forbids this failure in six explicit rules — so this measures how often the model does it anyway, after being told not to.'}
          </Text>
          {byModel.length === 0 ? (
            <Text style={{ color: color.subtle, paddingVertical: space.sm }}>No runs recorded yet.</Text>
          ) : (
            byModel.map((m) => <Row key={m.model} model={m} />)
          )}

          {/*
            MỘT MODEL THÌ KHÔNG PHẢI BẢNG XẾP HẠNG, và phải nói ra.

            Một bảng đúng một dòng dưới tiêu đề "By model" đọc ra như thể đã so
            sánh xong và model này thắng — hoặc thua. Nó chưa so với gì cả. Dòng
            dưới đây chỉ hiện khi thật sự chỉ có một model, nên nó tự biến mất
            khi phép đo mở rộng.
          */}
          {byModel.length === 1 ? (
            <Text
              style={{
                fontSize: 13,
                color: color.warning,
                marginTop: space.sm,
                paddingTop: space.sm,
                borderTopWidth: 1,
                borderTopColor: color.border,
                lineHeight: 19,
              }}
            >
              ⚠ Only one generator has been measured, so this is not a comparison. The figure
              describes this model on this corpus, and nothing about any other model.
            </Text>
          ) : null}
        </Card>

        <Card>
          <CardTitle icon="list" tone="#0EA5E9">
            By question type
          </CardTitle>
          <Text style={{ fontSize: 13, color: color.muted, marginTop: 4, marginBottom: space.sm }}>
            This is the part worth acting on. A True/False statement is a standalone
            proposition, and world knowledge often settles it without the passage. A
            multiple-choice item forces a decision between four passage-specific options.
          </Text>
          {summary.byType.map((t) => {
            const judgeable = JUDGEABLE_TYPES.has(t.type);
            return (
              <View
                key={t.type}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: space.sm,
                  borderTopWidth: 1,
                  borderTopColor: color.border,
                  gap: space.md,
                  opacity: judgeable ? 1 : 0.5,
                }}
              >
                <Text
                  style={{
                    width: 76,
                    fontWeight: judgeable ? '700' : '400',
                    color: judgeable ? color.ink : color.subtle,
                  }}
                >
                  {t.blindRejectionRate === null ? '—' : `${(t.blindRejectionRate * 100).toFixed(1)}%`}
                </Text>
                <Text style={{ width: 88, color: color.muted, fontVariant: ['tabular-nums'] }}>
                  {t.blindRejections}/{t.blindRuns}
                </Text>
                <Text style={{ flex: 1, color: color.body }}>
                  {t.type}
                  {judgeable ? null : (
                    <Text style={{ color: color.warning, fontSize: 12 }}>
                      {'  '}· the blind check cannot judge these
                    </Text>
                  )}
                </Text>
              </View>
            );
          })}
          <Text style={{ fontSize: 13, color: color.body, marginTop: space.md, lineHeight: 20 }}>
            The last two ask which paragraph something is in. With the passage withheld there
            is no paragraph to point at, so those items can never fail — they are excluded
            from the gate going forward. They are shown here because they were inside the
            headline figure when it was computed:{' '}
            <Text style={{ fontWeight: '700', color: color.ink }}>
              on judgeable types alone the rate is 32.0%, not {(overall.blindRejectionRate! * 100).toFixed(1)}%
            </Text>
            .
          </Text>
        </Card>

        <Card>
          <CardTitle icon="lock" tone="#22A06B">
            Registered before measuring
          </CardTitle>
          <Text style={{ fontSize: 14, color: color.body, marginTop: space.sm, lineHeight: 22 }}>
            The falsification threshold is {preregistration.threshold * 100}% and the minimum sample
            is {preregistration.minSample} blind runs. Both are constants in{' '}
            <Text style={{ fontFamily: 'monospace', fontSize: 13 }}>{preregistration.registeredIn}</Text>,
            committed before the measurement first ran — git history is the evidence for that order.
            Three conclusions are written out in full, one per outcome; choosing between them is an
            arithmetic comparison, not a judgement.
          </Text>
        </Card>

        <Card>
          <CardTitle icon="info" tone="#F0703F">
            What these numbers do not say
          </CardTitle>
          <View style={{ gap: space.sm, marginTop: space.sm }}>
            {CAVEATS.map((c) => (
              <View key={c} style={{ flexDirection: 'row', gap: space.sm }}>
                <Text style={{ color: color.warning, fontWeight: '800' }}>⚠</Text>
                <Text style={{ flex: 1, fontSize: 14, color: color.body, lineHeight: 21 }}>{c}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Text style={{ fontSize: 12, color: color.subtle, marginBottom: space.xl }}>
          Measured {summary.measuredFrom?.slice(0, 10) ?? '—'} to{' '}
          {summary.measuredTo?.slice(0, 10) ?? '—'}. Regenerate with{' '}
          <Text style={{ fontFamily: 'monospace' }}>scripts/export-provenance-summary.ts</Text>.
        </Text>
      </View>
    </Screen>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View>
      <Text style={{ fontSize: 26, fontWeight: '800', color: color.ink }}>{value}</Text>
      <Text style={{ fontSize: 12, color: color.muted }}>{label}</Text>
      {hint ? <Text style={{ fontSize: 11, color: color.subtle }}>{hint}</Text> : null}
    </View>
  );
}

/** Tiêu đề thẻ kèm huy hiệu răng cưa (trang trí, trình đọc màn hình bỏ qua). */
function CardTitle({ icon, tone, children }: { icon: IconName; tone: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      <View aria-hidden>
        <SealIcon name={icon} color={tone} size={34} />
      </View>
      <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: color.ink }}>{children}</Text>
    </View>
  );
}
