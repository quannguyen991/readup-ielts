import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Button, Card } from '@/components/ui';
import type { ProbeDraft } from '@/services/proofloop/draft-schema';
import { probeFor } from '@/services/proofloop/probe-table';
import type { EvidenceMark, ProbeKind, ProofState } from '@/services/proofloop/types';
import { Appear } from '@/components/motion/Motion';
import { bi, useL, type Bi } from '@/i18n/useL';

/**
 * Bảng chạy MỘT phép thử chẩn đoán.
 *
 * BA ĐIỀU BẢNG NÀY KHÔNG ĐƯỢC LÀM:
 *
 * 1. Không hiện lời giải thích trước khi người học trả lời. Với phép thử
 *    `evidence-reselect` thì giải thích trước là mớm đáp án, và phép thử mất
 *    sạch giá trị — cả điểm mạnh của nó nằm ở chỗ người học phải tự tìm lại.
 *
 * 2. Không nói "bạn đã hiểu rồi". Vượt một phép thử nghĩa là đã làm rõ được một
 *    điều chưa biết. Mastery chỉ đến từ phép thử chuyển giao trên bài khác, và
 *    phép thử đó chưa bật trong bản này.
 *
 * 3. Không giấu lúc hỏng. Bài không đủ căn cứ, hay model trượt luật kiểm hai
 *    lần, thì nói thẳng "chưa đủ dữ liệu" — không thay bằng một phép thử bịa
 *    cho có.
 */

const INTRO: Readonly<Record<ProbeKind, Bi>> = Object.freeze({
  transfer: {
    vi: 'Đáp án đúng và bằng chứng khớp. Chưa xác nhận được là đã nắm — thử một câu ở chỗ khác xem sao.',
    en: "Correct answer and matching evidence. Not confirmed as mastered yet — let's try a question somewhere else.",
  },
  'evidence-reselect': {
    vi: 'Đáp án đúng, nhưng đoạn bạn khoanh chưa đỡ được đáp án đó. Chưa ghi nhận là đã hiểu. Làm một phép thử ngắn nhé.',
    en: "Correct answer, but the part you marked doesn't support it. Not recorded as understood yet. Let's do a quick check.",
  },
  entailment: {
    vi: 'Bạn đã tìm ra đúng đoạn rồi — chỗ vướng nằm ở bước suy ra. Thử câu này.',
    en: 'You found the right part — the sticking point is the inference step. Try this one.',
  },
  locate: {
    vi: 'Trước hết xem lại bước tìm chỗ đã, chưa bàn tới đáp án.',
    en: "First, let's revisit finding the right place — the answer can wait.",
  },
});

const FAIL_TEXT: Record<string, Bi> = {
  'insufficient-evidence': {
    vi: 'Bài này không đủ căn cứ để ra một phép thử công bằng.',
    en: "This passage doesn't have enough grounds for a fair check.",
  },
  'not-json': { vi: 'Chưa dựng được phép thử cho lượt này.', en: "Couldn't build a check for this attempt." },
  unobserved: {
    vi: 'Lượt này chưa khoanh bằng chứng nên chưa có gì để làm rõ.',
    en: "No evidence was marked this time, so there's nothing to clarify yet.",
  },
  'no-transfer-source': {
    vi: 'Chưa tìm được bài đọc khác cùng khổ để thử. Phép thử chuyển giao bắt buộc phải ở bài khác.',
    en: "Couldn't find another passage of the same kind to test with. A transfer check must use a different passage.",
  },
  'transfer-same-source': {
    vi: 'Câu dựng ra vẫn nằm trên chính bài cũ nên đã bị loại.',
    en: 'The generated question was still on the same passage, so it was rejected.',
  },
  'answerable-without-passage': {
    vi: 'Câu dựng ra trả lời được mà không cần đọc bài, nên đã bị loại.',
    en: 'The generated question could be answered without reading the passage, so it was rejected.',
  },
  'stem-leaks-decisive-phrase': {
    vi: 'Câu dựng ra để lộ sẵn chữ quyết định trong đề nên đã bị loại.',
    en: 'The generated question gave away the decisive phrase, so it was rejected.',
  },
  'evidence-paragraph-mismatch': {
    vi: 'Câu dựng ra chỉ sai đoạn chứa bằng chứng nên đã bị loại.',
    en: 'The generated question pointed to the wrong paragraph for its evidence, so it was rejected.',
  },
  'transfer-reuses-original-evidence': {
    vi: 'Câu dựng ra dùng lại đúng câu bằng chứng cũ nên đã bị loại.',
    en: 'The generated question reused the original evidence sentence, so it was rejected.',
  },
  'transfer-reuses-original-stem': {
    vi: 'Câu dựng ra chỉ chép lại câu hỏi cũ nên đã bị loại.',
    en: 'The generated question just copied the original question, so it was rejected.',
  },
  'duplicate-options': {
    vi: 'Câu dựng ra có hai phương án trùng nhau nên đã bị loại.',
    en: 'The generated question had two identical options, so it was rejected.',
  },
};

/** Biên nhận từ máy chủ: ba hàng rào đã làm gì với bản nháp của model. */
export type ProbeReceipt = {
  attempts: number;
  rejections: string[];
  warnings: string[];
  blind: string | null;
};

export type ProbeResponse =
  | {
      state: ProofState;
      kind: ProbeKind;
      draft: ProbeDraft;
      model?: string;
      receipt?: ProbeReceipt;
    }
  | {
      state: ProofState;
      kind: ProbeKind | null;
      draft?: null;
      reason: string;
      receipt?: ProbeReceipt;
    };

/** Lời kể của từng kết luận ở hàng rào bịt mắt. */
const BLIND_TEXT: Record<string, Bi> = {
  'blind-model-could-not-answer': {
    vi: 'che bài đi thì một AI khác không trả lời được — đúng là câu phải đọc mới làm được',
    en: "with the passage hidden, another AI couldn't answer it — so it really does need reading",
  },
  'blind-model-answered-wrong': {
    vi: 'một AI khác trả lời sai khi không được đọc bài',
    en: 'another AI answered wrong without reading the passage',
  },
  'blind-guess-hit': {
    vi: 'một AI khác đoán trúng dù không được đọc bài, nhưng tự nhận là đoán',
    en: 'another AI guessed right without reading the passage, but admitted it was guessing',
  },
  unreadable: { vi: 'không đọc được câu trả lời của AI kiểm tra', en: "couldn't read the checking AI's answer" },
  'check-failed': { vi: 'chưa chạy được bước kiểm này', en: "this check couldn't run" },
};

export function ProbePanel({
  state,
  mark,
  fetchProbe,
  onResolved,
}: {
  state: ProofState;
  mark: EvidenceMark | null;
  fetchProbe: () => Promise<ProbeResponse>;
  /**
   * Người học vừa trả lời xong phép thử.
   *
   * Bảng này KHÔNG tự ghi vào sổ bằng chứng: nó không biết lượt này thuộc kỹ
   * năng nào, cũng không biết bài chuyển giao là bài nào. Cả hai thứ đó nằm ở
   * màn gọi nó, và luật công nhận thì nằm ở `mastery/ledger.ts`. Bảng này chỉ
   * báo lại đã xảy ra chuyện gì.
   */
  onResolved?: (result: { kind: ProbeKind; passed: boolean }) => void;
}) {
  const { L, locale } = useL();
  const [phase, setPhase] = useState<'idle' | 'loading' | 'probe' | 'answered' | 'failed'>('idle');
  const [data, setData] = useState<ProbeResponse | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);

  const start = async () => {
    setPhase('loading');
    try {
      const res = await fetchProbe();
      setData(res);
      setPhase('draft' in res && res.draft ? 'probe' : 'failed');
    } catch {
      setData(null);
      setPhase('failed');
    }
  };

  if (state === 'unobserved') return null;

  if (phase === 'idle') {
    const kind = probeFor(state);
    return (
      <Card className="mt-3">
        <Text className="font-sans text-body text-ink">{kind ? bi(INTRO[kind], locale) : ''}</Text>
        <Button className="mt-3" label={L('Làm phép thử', 'Take the check')} size="sm" onPress={start} />
      </Card>
    );
  }

  if (phase === 'loading') {
    return (
      <Card className="mt-3">
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" />
          <Text className="font-sans text-body text-muted">{L('Đang dựng phép thử…', 'Building the check…')}</Text>
        </View>
      </Card>
    );
  }

  if (phase === 'failed' || !data || !('draft' in data) || !data.draft) {
    const reason = data && 'reason' in data ? data.reason : 'not-json';
    return (
      <Card className="mt-3">
        <Text className="font-semi text-body text-ink">{L('Chưa đủ dữ liệu để kết luận', 'Not enough data to conclude')}</Text>
        <Text className="mt-1 font-sans text-label text-muted">
          {bi(FAIL_TEXT[reason] ?? FAIL_TEXT['not-json'] ?? { vi: '', en: '' }, locale)}
        </Text>
      </Card>
    );
  }

  const draft = data.draft;
  const receipt = data.receipt ?? null;
  const correct = chosen === draft.correctOption;

  return (
    <Card className="mt-3">
      <Text className="font-semi text-body text-ink">{draft.stem}</Text>

      <View className="mt-3 gap-2">
        {draft.options.map((option, index) => {
          const picked = chosen === index;
          const reveal = phase === 'answered';
          const isRight = index === draft.correctOption;
          return (
            <Pressable
              key={option}
              disabled={reveal}
              onPress={() => {
                setChosen(index);
                setPhase('answered');
                onResolved?.({ kind: draft.kind, passed: index === draft.correctOption });
              }}
              className={[
                'rounded-panel border px-3 py-3',
                reveal && isRight
                  ? 'border-success bg-success-soft'
                  : reveal && picked
                    ? 'border-danger bg-danger-soft'
                    : picked
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-border bg-surface',
              ].join(' ')}
            >
              <Text className="font-sans text-body text-ink">{option}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Lời giải thích chỉ hiện SAU khi người học đã chọn — xem ghi chú đầu tệp. */}
      <Appear>
      {phase === 'answered' ? (
        <View className="mt-3 border-t border-border pt-3">
          <Text className="font-semi text-label text-ink">
            {correct ? L('Đúng rồi.', 'Correct.') : L('Chưa đúng.', 'Not quite.')}
          </Text>

          <Text className="mt-2 font-mid text-label text-muted">{L('Câu trong bài đỡ điều này', 'The sentence in the passage that supports this')}</Text>
          <Text className="mt-1 font-sans text-body text-ink">“{draft.evidenceText}”</Text>

          <Text className="mt-2 font-mid text-label text-muted">{L('Chữ quyết định', 'Decisive phrase')}</Text>
          <Text className="mt-1 font-semi text-body text-ink">{draft.decisivePhrase}</Text>

          {mark ? (
            <>
              <Text className="mt-2 font-mid text-label text-muted">{L('Chỗ bạn đã khoanh', 'What you marked')}</Text>
              <Text className="mt-1 font-sans text-body text-body">“{mark.phrase}”</Text>
            </>
          ) : null}

          {/*
            Không viết "bạn đã hiểu rồi". Vượt phép thử này nghĩa là đã làm rõ
            được một điều chưa biết, không phải đã chuyển hoá thành kỹ năng.
          */}
          <Text className="mt-3 font-sans text-label text-muted">
            {correct
              ? draft.kind === 'transfer'
                ? L(
                    'Câu này ở một bài đọc khác, nên làm được ở đây là đã tách được "hiểu" khỏi "nhớ bài cũ".',
                    'This question is from a different passage, so getting it right separates "understanding" from "remembering the old passage".',
                  )
                : L(
                    'Đã làm rõ được chỗ này. Chưa xác nhận là đã nắm kỹ năng — muốn xác nhận thì cần một câu ở bài đọc khác.',
                    "This point is now clear. The skill isn't confirmed as mastered yet — that needs a question from a different passage.",
                  )
              : L(
                  'Chỗ vướng vẫn còn. Lần sau bám vào chữ quyết định ở trên trước khi chọn.',
                  'The sticking point is still there. Next time, anchor on the decisive phrase above before choosing.',
                )}
          </Text>

          {/*
            BIÊN NHẬN KIỂM CHỨNG.

            Câu hỏi này do một model viết ra, và người học có quyền biết nó đã bị
            đối chiếu ở đâu trước khi tới tay mình. Đây là chỗ dạy về AI hiệu quả
            hơn mọi bài giảng về AI: nó xảy ra trên chính bài của họ, ngay trước
            mắt họ.

            Dòng "chưa kiểm được" nếu có thì PHẢI hiện, và hiện khác màu. Bỏ nó
            đi thì biên nhận đọc thành giấy chứng nhận — đúng cái hiểu lầm mà nó
            sinh ra để ngăn.
          */}
          {receipt ? (
            <View className="mt-3 rounded-panel bg-surface-muted px-3 py-3">
              <Text className="font-mid text-label text-muted">{L('Câu này đã bị kiểm những gì', 'What this question was checked for')}</Text>

              <Text className="mt-1 font-sans text-label text-ink">
                {L('· chữ trích dẫn được đối chiếu nguyên văn với bài đọc', '· the quoted text was matched word for word against the passage')}
              </Text>
              <Text className="mt-1 font-sans text-label text-ink">
                {L('· chỉ số đoạn được đối chiếu với đoạn thật sự chứa câu đó', '· the paragraph number was checked against the paragraph that actually contains it')}
              </Text>
              {draft.kind === 'transfer' ? (
                <Text className="mt-1 font-sans text-label text-ink">
                  {L('· bài dùng cho câu này khác bài bạn vừa làm', '· this question uses a different passage from the one you just did')}
                </Text>
              ) : null}
              {receipt.blind ? (
                <Text
                  className={[
                    'mt-1 font-sans text-label',
                    receipt.blind === 'check-failed' || receipt.blind === 'unreadable'
                      ? 'text-danger-ink'
                      : 'text-ink',
                  ].join(' ')}
                >
                  · {bi(BLIND_TEXT[receipt.blind] ?? { vi: receipt.blind, en: receipt.blind }, locale)}
                </Text>
              ) : null}

              {receipt.rejections.length > 0 ? (
                <Text className="mt-2 font-sans text-label text-muted">
                  {L(
                    `Trước câu này, ${receipt.rejections.length} bản nháp của AI đã bị loại.`,
                    `Before this question, ${receipt.rejections.length} AI draft(s) were rejected.`,
                  )}
                </Text>
              ) : null}

              {/* Luôn hiện, và luôn khác màu. Xem chú thích ở trên. */}
              <Text className="mt-2 font-sans text-label text-danger-ink">
                {L(
                  '· chưa kiểm được bằng máy: câu chữ có tự nhiên không, và câu hỏi này có đúng là đang đo kỹ năng bạn đang vướng không',
                  "· not machine-checkable: whether the wording is natural, and whether this question really measures the skill you're stuck on",
                )}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
      </Appear>
    </Card>
  );
}
