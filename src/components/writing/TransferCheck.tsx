import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';

import { Button, Icon, PaperCard } from '@/components/ui';
import { gradeTransfer, type TransferProbe } from '@/services/writing/transfer-probe';
import { observeSkill, resolveProbe } from '@/store/useMasteryStore';
import type { WritingAnnotation } from '@/lib/writing/types';
import { color, paper } from '@/theme/tokens';

/**
 * "Sửa được lỗi này ở một câu khác chưa?"
 *
 * VÌ SAO CÓ BƯỚC NÀY. Bản chấm chỉ ra lỗi và giải thích rất rõ — nhưng đọc xong
 * gật đầu không phải là biết sửa. Người học đọc "chủ ngữ số ít nên động từ phải
 * chia số ít", thấy hợp lý, rồi bài sau vẫn viết y như cũ. Cái thiếu không phải
 * lời giải thích; cái thiếu là một lần tự làm ở chỗ khác.
 *
 * Đây là phép thử CHUYỂN GIAO của mảng Viết, và nó là phép thử duy nhất trong
 * app này có quyền tạo ra công nhận (xem `services/mastery/ledger.ts`). Câu kiểm
 * do AI soạn mới hoàn toàn, khác chủ đề, chỉ giữ lại đúng LOẠI lỗi.
 *
 * KHÔNG HIỆN BẢN SỬA MẪU TRƯỚC. Hiện trước thì không còn gì để đo — đó cũng là
 * lý do bước tự chẩn đoán ở Toán hỏi trước khi mở lời giải.
 */

type Phase = 'idle' | 'loading' | 'answering' | 'done' | 'error';

export function TransferCheck({
  annotation,
  submissionId,
}: {
  annotation: WritingAnnotation;
  /** Nguồn gốc — phép thử phải chạy trên nguồn KHÁC nguồn này mới tính chuyển giao. */
  submissionId: string;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [probe, setProbe] = useState<TransferProbe | null>(null);
  const [draft, setDraft] = useState('');
  const [passed, setPassed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const skill = { domain: 'writing' as const, key: annotation.category };

  const start = async () => {
    setPhase('loading');
    setError(null);
    try {
      const res = await fetch('/api/writing/transfer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          category: annotation.category,
          originalQuote: annotation.quote,
          whyVi: annotation.whyVi,
        }),
        signal: AbortSignal.timeout(60_000),
      });
      const data = (await res.json()) as Partial<TransferProbe> & { error?: string };
      if (!res.ok || !data.sentence || !data.fixed) {
        throw new Error(data.error ?? `Máy chủ trả về ${res.status}`);
      }
      setProbe({
        sentence: data.sentence,
        fixed: data.fixed,
        category: annotation.category,
        hintVi: data.hintVi ?? '',
      });
      setDraft(data.sentence);
      setPhase('answering');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi lạ');
      setPhase('error');
    }
  };

  const submit = () => {
    if (!probe) return;
    const result = gradeTransfer(draft, probe);
    setPassed(result.passed);
    setPhase('done');

    const at = new Date().toISOString();
    /*
      Ghi HAI bản ghi, và thứ tự có ý nghĩa.

      `observeSkill` ghi lần quan sát: họ đã sửa đúng hay chưa, và họ có nhận ra
      đúng loại lỗi hay không (con trỏ và sự thật đều là loại lỗi ấy, vì câu kiểm
      được soạn để chỉ mang đúng một loại).

      `resolveProbe` mới là chỗ quyết định công nhận — và nó chỉ công nhận khi
      `probeSourceId` khác `sourceId`, tức là câu kiểm không phải bài gốc. Ở đây
      điều đó luôn đúng vì câu do AI soạn mới, nhưng vẫn truyền cả hai để luật
      nằm nguyên một chỗ thay vì bị giả định ngầm tại đây.
    */
    observeSkill({
      skill,
      sourceId: submissionId,
      answerCorrect: result.passed,
      pointer: { kind: 'error-tag', tag: annotation.category },
      truth: { kind: 'error-tag', tag: annotation.category },
      at,
    });
    resolveProbe({
      skill,
      kind: 'transfer',
      passed: result.passed,
      sourceId: submissionId,
      probeSourceId: `transfer:${probe.sentence.slice(0, 40)}`,
      at,
    });
  };

  if (phase === 'idle') {
    return (
      <Button
        className="mt-3 self-start"
        variant="brandOutline"
        size="sm"
        label="Kiểm bằng một câu khác"
        iconRight="arrow-right"
        onPress={() => void start()}
      />
    );
  }

  if (phase === 'loading') {
    return (
      <View className="mt-3 flex-row items-center gap-2.5">
        <ActivityIndicator color={paper.brandMid} />
        <Text className="font-sans text-label text-paper-muted">Đang soạn một câu khác cùng lỗi…</Text>
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View className="mt-3">
        <Text className="font-sans text-label text-warning-ink">{error}</Text>
        <Button
          className="mt-2 self-start"
          variant="brandOutline"
          size="sm"
          label="Thử lại"
          iconLeft="refresh"
          onPress={() => void start()}
        />
      </View>
    );
  }

  if (!probe) return null;

  return (
    <PaperCard className="mt-3">
      <Text className="font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 9 }}>
        Phép thử chuyển giao
      </Text>
      <Text className="mt-1 font-strong text-body text-paper-ink">
        Câu dưới đây có cùng loại lỗi. Sửa lại cho đúng.
      </Text>

      <TextInput
        value={draft}
        onChangeText={setDraft}
        editable={phase === 'answering'}
        multiline
        className="mt-2.5 rounded-panel border px-3.5 py-2.5 font-sans text-body text-paper-ink"
        style={{
          borderColor:
            phase === 'done' ? (passed ? color.success : color.warning) : paper.brandSoft,
          backgroundColor: '#FFFFFF',
          minHeight: 72,
        }}
      />

      {phase === 'answering' ? (
        <Button className="mt-2.5 self-start" variant="brand" size="sm" label="Nộp bản sửa" onPress={submit} />
      ) : (
        <View className="mt-3">
          <View className="flex-row items-center gap-2">
            <Icon
              name={passed ? 'check' : 'info'}
              size={16}
              color={passed ? color.success : color.warning}
              strokeWidth={2.2}
            />
            <Text className="font-strong text-body text-paper-ink">
              {passed
                ? 'Sửa được ở một câu khác — kỹ năng này được ghi nhận.'
                : 'Chưa sửa đúng chỗ đó.'}
            </Text>
          </View>

          {probe.hintVi ? (
            <Text className="mt-1.5 font-sans text-label text-paper-body" style={{ lineHeight: 19 }}>
              {probe.hintVi}
            </Text>
          ) : null}

          <View className="mt-2.5 rounded-panel bg-paper-canvas p-3">
            <Text className="font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 9 }}>
              Bản sửa mẫu
            </Text>
            <Text className="mt-1 font-mid text-label text-paper-ink" style={{ lineHeight: 20 }}>
              {probe.fixed}
            </Text>
            <Text className="mt-1.5 font-sans text-label text-paper-muted" style={{ lineHeight: 18 }}>
              Bản của bạn không cần trùng từng chữ với bản này — chỉ cần sửa đúng chỗ lỗi.
            </Text>
          </View>
        </View>
      )}
    </PaperCard>
  );
}
