import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Button, Card } from '@/components/ui';
import type { ProbeDraft } from '@/services/proofloop/draft-schema';
import { probeFor } from '@/services/proofloop/probe-table';
import type { EvidenceMark, ProbeKind, ProofState } from '@/services/proofloop/types';

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

const INTRO: Readonly<Record<ProbeKind, string>> = Object.freeze({
  transfer:
    'Đáp án đúng và bằng chứng khớp. Chưa xác nhận được là đã nắm — thử một câu ở chỗ khác xem sao.',
  'evidence-reselect':
    'Đáp án đúng, nhưng đoạn bạn khoanh chưa đỡ được đáp án đó. Chưa ghi nhận là đã hiểu. Làm một phép thử ngắn nhé.',
  entailment:
    'Bạn đã tìm ra đúng đoạn rồi — chỗ vướng nằm ở bước suy ra. Thử câu này.',
  locate:
    'Trước hết xem lại bước tìm chỗ đã, chưa bàn tới đáp án.',
});

const FAIL_TEXT: Record<string, string> = {
  'insufficient-evidence': 'Bài này không đủ căn cứ để ra một phép thử công bằng.',
  'not-json': 'Chưa dựng được phép thử cho lượt này.',
  unobserved: 'Lượt này chưa khoanh bằng chứng nên chưa có gì để làm rõ.',
  'no-transfer-source': 'Chưa tìm được bài đọc khác cùng khổ để thử. Phép thử chuyển giao bắt buộc phải ở bài khác.',
  'transfer-same-source': 'Câu dựng ra vẫn nằm trên chính bài cũ nên đã bị loại.',
  'answerable-without-passage': 'Câu dựng ra trả lời được mà không cần đọc bài, nên đã bị loại.',
  'stem-leaks-decisive-phrase': 'Câu dựng ra để lộ sẵn chữ quyết định trong đề nên đã bị loại.',
  'evidence-paragraph-mismatch': 'Câu dựng ra chỉ sai đoạn chứa bằng chứng nên đã bị loại.',
  'transfer-reuses-original-evidence': 'Câu dựng ra dùng lại đúng câu bằng chứng cũ nên đã bị loại.',
  'transfer-reuses-original-stem': 'Câu dựng ra chỉ chép lại câu hỏi cũ nên đã bị loại.',
  'duplicate-options': 'Câu dựng ra có hai phương án trùng nhau nên đã bị loại.',
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
const BLIND_TEXT: Record<string, string> = {
  'blind-model-could-not-answer': 'che bài đi thì một AI khác không trả lời được — đúng là câu phải đọc mới làm được',
  'blind-model-answered-wrong': 'một AI khác trả lời sai khi không được đọc bài',
  'blind-guess-hit': 'một AI khác đoán trúng dù không được đọc bài, nhưng tự nhận là đoán',
  unreadable: 'không đọc được câu trả lời của AI kiểm tra',
  'check-failed': 'chưa chạy được bước kiểm này',
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
        <Text className="font-sans text-body text-ink">{kind ? INTRO[kind] : ''}</Text>
        <Button className="mt-3" label="Làm phép thử" size="sm" onPress={start} />
      </Card>
    );
  }

  if (phase === 'loading') {
    return (
      <Card className="mt-3">
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" />
          <Text className="font-sans text-body text-muted">Đang dựng phép thử…</Text>
        </View>
      </Card>
    );
  }

  if (phase === 'failed' || !data || !('draft' in data) || !data.draft) {
    const reason = data && 'reason' in data ? data.reason : 'not-json';
    return (
      <Card className="mt-3">
        <Text className="font-semi text-body text-ink">Chưa đủ dữ liệu để kết luận</Text>
        <Text className="mt-1 font-sans text-label text-muted">
          {FAIL_TEXT[reason] ?? FAIL_TEXT['not-json']}
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
      {phase === 'answered' ? (
        <View className="mt-3 border-t border-border pt-3">
          <Text className="font-semi text-label text-ink">
            {correct ? 'Đúng rồi.' : 'Chưa đúng.'}
          </Text>

          <Text className="mt-2 font-mid text-label text-muted">Câu trong bài đỡ điều này</Text>
          <Text className="mt-1 font-sans text-body text-ink">“{draft.evidenceText}”</Text>

          <Text className="mt-2 font-mid text-label text-muted">Chữ quyết định</Text>
          <Text className="mt-1 font-semi text-body text-ink">{draft.decisivePhrase}</Text>

          {mark ? (
            <>
              <Text className="mt-2 font-mid text-label text-muted">Chỗ bạn đã khoanh</Text>
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
                ? 'Câu này ở một bài đọc khác, nên làm được ở đây là đã tách được "hiểu" khỏi "nhớ bài cũ".'
                : 'Đã làm rõ được chỗ này. Chưa xác nhận là đã nắm kỹ năng — muốn xác nhận thì cần một câu ở bài đọc khác.'
              : 'Chỗ vướng vẫn còn. Lần sau bám vào chữ quyết định ở trên trước khi chọn.'}
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
              <Text className="font-mid text-label text-muted">Câu này đã bị kiểm những gì</Text>

              <Text className="mt-1 font-sans text-label text-ink">
                · chữ trích dẫn được đối chiếu nguyên văn với bài đọc
              </Text>
              <Text className="mt-1 font-sans text-label text-ink">
                · chỉ số đoạn được đối chiếu với đoạn thật sự chứa câu đó
              </Text>
              {draft.kind === 'transfer' ? (
                <Text className="mt-1 font-sans text-label text-ink">
                  · bài dùng cho câu này khác bài bạn vừa làm
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
                  · {BLIND_TEXT[receipt.blind] ?? receipt.blind}
                </Text>
              ) : null}

              {receipt.rejections.length > 0 ? (
                <Text className="mt-2 font-sans text-label text-muted">
                  Trước câu này, {receipt.rejections.length} bản nháp của AI đã bị loại.
                </Text>
              ) : null}

              {/* Luôn hiện, và luôn khác màu. Xem chú thích ở trên. */}
              <Text className="mt-2 font-sans text-label text-danger-ink">
                · chưa kiểm được bằng máy: câu chữ có tự nhiên không, và câu hỏi này có đúng là
                đang đo kỹ năng bạn đang vướng không
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
