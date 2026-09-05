import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Badge, Button, Card } from '@/components/ui';
import { auditFeedback, gradeAudit, type AuditAnswer } from '@/services/ai-literacy/audit';
import { buildAuditItem, FLAW_KINDS, FLAW_LABEL, type AuditItem, type FlawKind } from '@/services/ai-literacy/flaws';
import type { ProbeDraft } from '@/services/proofloop/draft-schema';
import { observeSkill } from '@/store/useMasteryStore';

/**
 * Soi một bản do AI sinh ra, và tìm lỗi đã được cấy vào đó.
 *
 * HAI CÂU HỎI TÁCH BẠCH, và thứ tự không đảo được:
 *
 *   1. bản này có gì sai không
 *   2. sai cái gì
 *
 * Hỏi gộp một câu ("chọn lỗi trong bản này") thì mất hẳn trạng thái đáng giá
 * nhất: người thấy có gì đó không ổn nhưng chưa gọi được tên. Đó là bước giữa
 * của việc học đọc kết quả máy, và nó chỉ hiện ra khi hai câu được hỏi rời.
 *
 * BA ĐIỀU BẢNG NÀY KHÔNG ĐƯỢC LÀM:
 *
 *   · không nói trước bản này sạch hay bẩn — nói trước thì không còn gì để đo;
 *   · không hiện đáp án cho tới khi người học đã chọn xong cả hai vế;
 *   · không nói "bạn đoán bừa" hay bất kỳ chữ nào phán đoán thứ nằm trong đầu họ.
 */

export function AuditPanel({
  paragraphs,
  seed,
  sourceId,
  fetchDraft,
}: {
  /** Bài đọc của bản đem soi, để cấy lỗi trích dẫn và kiểm chỉ số đoạn. */
  paragraphs: string[];
  /** Cùng seed thì luôn ra cùng một bản — xem `flaws.ts`. */
  seed: string;
  /** Định danh bản đem soi. Điều kiện chuyển giao so hai giá trị này. */
  sourceId: string;
  fetchDraft: () => Promise<ProbeDraft | null>;
}) {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'asking' | 'named' | 'done' | 'failed'>('idle');
  const [item, setItem] = useState<AuditItem | null>(null);
  const [answer, setAnswer] = useState<AuditAnswer | null>(null);

  const start = async () => {
    setPhase('loading');
    try {
      const draft = await fetchDraft();
      if (!draft) {
        setPhase('failed');
        return;
      }
      setItem(buildAuditItem(draft, paragraphs, seed));
      setPhase('asking');
    } catch {
      setPhase('failed');
    }
  };

  /** Ghi vào sổ đúng một lần, ngay khi người học chốt cả hai vế. */
  const settle = (final: AuditAnswer) => {
    if (!item) return;
    setAnswer(final);
    setPhase('done');
    observeSkill(gradeAudit(item, final, sourceId, new Date().toISOString()));
  };

  if (phase === 'idle') {
    return (
      <Card className="mt-4">
        <Badge label="ĐỌC KẾT QUẢ CỦA AI" tone="accent" />
        <Text className="mt-2 font-strong text-cardTitle text-ink">Soi một bản của AI</Text>
        <Text className="mt-1 font-sans text-body text-muted">
          App sẽ đưa bạn một bản do AI viết ra. Một nửa số bản bị cấy sẵn đúng một lỗi, một nửa thì
          không. Việc của bạn là nói bản này có lỗi hay không — và nếu có thì là lỗi gì.
        </Text>
        <Button className="mt-3" label="Lấy một bản" size="sm" onPress={start} />
      </Card>
    );
  }

  if (phase === 'loading') {
    return (
      <Card className="mt-4">
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" />
          <Text className="font-sans text-body text-muted">Đang lấy một bản của AI…</Text>
        </View>
      </Card>
    );
  }

  if (phase === 'failed' || !item) {
    return (
      <Card className="mt-4">
        <Text className="font-semi text-body text-ink">Chưa lấy được bản nào</Text>
        <Text className="mt-1 font-sans text-label text-muted">
          Cần một bản AI thật để soi. Thử lại sau khi làm xong một bài đọc có khoanh bằng chứng.
        </Text>
      </Card>
    );
  }

  const draft = item.shown;
  const revealed = phase === 'done';

  return (
    <Card className="mt-4">
      <Badge label="ĐỌC KẾT QUẢ CỦA AI" tone="accent" />
      <Text className="mt-2 font-strong text-cardTitle text-ink">Bản này có gì sai không?</Text>

      {/* Bản đem soi. Hiện đúng như AI đã viết, không tô đậm gợi ý chỗ nào cả. */}
      <View className="mt-3 rounded-panel border border-border bg-surface px-3 py-3">
        <Text className="font-semi text-body text-ink">{draft.stem}</Text>
        {draft.options.map((option, i) => (
          <Text
            key={option}
            className={[
              'mt-1 font-sans text-body',
              i === draft.correctOption ? 'text-success-ink' : 'text-body',
            ].join(' ')}
          >
            {i === draft.correctOption ? '✓ ' : '· '}
            {option}
          </Text>
        ))}

        <Text className="mt-3 font-mid text-label text-muted">AI trích câu này trong bài</Text>
        <Text className="mt-1 font-sans text-body text-ink">“{draft.evidenceText}”</Text>
        <Text className="mt-1 font-sans text-label text-muted">
          AI nói câu đó nằm ở đoạn {draft.evidenceParagraphIndex + 1}
        </Text>

        <Text className="mt-3 font-mid text-label text-muted">AI giải thích vì sao các phương án kia sai</Text>
        {draft.whyEachWrong.map((why) => (
          <Text key={why} className="mt-1 font-sans text-label text-body">
            · {why}
          </Text>
        ))}

        {item.extraNote ? (
          <Text className="mt-3 font-sans text-body text-ink">{item.extraNote}</Text>
        ) : null}
      </View>

      {/* Đoạn bài để đối chiếu — không có nó thì không kiểm được trích dẫn. */}
      <Text className="mt-3 font-mid text-label text-muted">Bài gốc</Text>
      {paragraphs.map((p, i) => (
        <Text key={i} className="mt-1 font-sans text-label text-body">
          <Text className="font-semi text-muted">Đoạn {i + 1}. </Text>
          {p}
        </Text>
      ))}

      {phase === 'asking' ? (
        <View className="mt-4 flex-row gap-2">
          <Button
            label="Bản này sạch"
            variant="outline"
            size="sm"
            onPress={() => settle({ flawed: false, kind: null })}
          />
          <Button label="Có lỗi" size="sm" onPress={() => setPhase('named')} />
        </View>
      ) : null}

      {phase === 'named' ? (
        <View className="mt-4">
          <Text className="font-mid text-label text-muted">Lỗi gì?</Text>
          <View className="mt-2 gap-2">
            {FLAW_KINDS.map((kind: FlawKind) => (
              <Pressable
                key={kind}
                onPress={() => settle({ flawed: true, kind })}
                className="rounded-panel border border-border bg-surface px-3 py-3"
              >
                <Text className="font-sans text-body text-ink">{FLAW_LABEL[kind]}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => settle({ flawed: true, kind: null })}
              className="rounded-panel border border-border px-3 py-3"
            >
              {/*
                Lối ra trung thực. Bỏ nó đi thì người chỉ ngờ ngợ buộc phải bốc
                một loại, và một lượt bốc trúng sẽ được ghi y như một lượt đọc ra.
              */}
              <Text className="font-sans text-body text-muted">Thấy sai nhưng chưa gọi được tên</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {revealed && answer ? (
        <View className="mt-4 border-t border-border pt-3">
          <Text className="font-semi text-body text-ink">
            {item.planted ? `Bản này bị cấy lỗi: ${FLAW_LABEL[item.planted]}` : 'Bản này sạch.'}
          </Text>
          <Text className="mt-2 font-sans text-body text-muted">{auditFeedback(item, answer)}</Text>
        </View>
      ) : null}
    </Card>
  );
}
