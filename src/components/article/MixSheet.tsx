import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button, Icon, ProgressBar } from '@/components/ui';
import { getArticleWithBody, type ArticleMeta } from '@/data/articles';
import { useChunkVersion } from '@/data/use-chunk-version';
import {
  IELTS_TYPE_SPECS,
  buildMix,
  canGenerate,
  defaultMixFor,
  shortLabel,
  specOf,
  type MixBlock,
} from '@/services/questions/ielts-types';
import { MAX_MIX_BLOCKS, MAX_MIX_TOTAL } from '@/services/questions/mix';
import { useQuestionStore } from '@/store/useQuestionStore';
import { useUserArticleStore } from '@/store/useUserArticleStore';
import { color } from '@/theme/tokens';
import type { QuestionType } from '@/types/database';
import { useL } from '@/i18n/useL';

/**
 * Hộp "Tạo đề": chọn bộ trộn dạng bài cho một passage rồi tạo.
 *
 * Mặc định là một bố cục IELTS thật (3 dạng, 13 câu) hợp với khổ passage. Người học
 * đổi được dạng (tối đa 4) và số câu từng dạng; tạo song song từng khối nên thanh
 * tiến độ chạy theo khối thật. Đề tạo xong được giữ lại cho bài ấy.
 */

function positionOf(tier: string | null | undefined): 1 | 2 | 3 {
  return tier === 'p3' ? 3 : tier === 'p2' ? 2 : 1;
}

export function MixSheet({
  article,
  visible,
  onClose,
  preselect,
}: {
  article: ArticleMeta;
  visible: boolean;
  onClose: () => void;
  preselect?: QuestionType;
}) {
  const { L } = useL();
  const userArticle = useUserArticleStore((s) => s.articles[article.id]);
  const chunkVer = useChunkVersion();
  const full = useMemo(
    () => (visible ? (getArticleWithBody(article.id) ?? userArticle) : undefined),
    [visible, article.id, userArticle, chunkVer],
  );
  const shape = useMemo(
    () => ({ paragraphs: full?.paragraphs.length, words: article.wordCount }),
    [full, article.wordCount],
  );

  const generating = useQuestionStore((s) => s.generating[article.id]);
  const saved = useQuestionStore((s) => s.sets[article.id]);
  const generateSet = useQuestionStore((s) => s.generateSet);
  const clearSet = useQuestionStore((s) => s.clearSet);

  // Hộp chỉ được dựng khi mở (màn chứa gắn nó theo điều kiện), nên khởi tạo một lần là đủ.
  const [blocks, setBlocks] = useState<MixBlock[]>(() => {
    const base = defaultMixFor(positionOf(article.passageTier), article.id, { words: article.wordCount });
    if (!preselect) return base;
    const rest = base.map((b) => b.type).filter((t) => t !== preselect);
    return buildMix([preselect, ...rest.slice(0, 2)]);
  });
  const [result, setResult] = useState<{ made: number; failed: QuestionType[]; message?: string } | null>(null);

  const selected = blocks.map((b) => b.type);
  const total = blocks.reduce((a, b) => a + b.count, 0);

  const toggle = (t: QuestionType) => {
    if (selected.includes(t)) setBlocks(buildMix(selected.filter((x) => x !== t)));
    else if (selected.length < MAX_MIX_BLOCKS) setBlocks(buildMix([...selected, t]));
  };

  const step = (t: QuestionType, delta: number) => {
    const spec = specOf(t);
    if (!spec) return;
    setBlocks((cur) =>
      cur.map((b) =>
        b.type === t ? { ...b, count: Math.min(spec.maxCount, Math.max(spec.minCount, b.count + delta)) } : b,
      ),
    );
  };

  const run = async () => {
    if (!full || blocks.length === 0 || generating) return;
    const r = await generateSet(full, blocks);
    setResult({ made: r.set?.questions.length ?? 0, failed: r.failed, message: r.message });
  };

  const busy = Boolean(generating);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={busy ? undefined : onClose}>
      <View className="flex-1 items-center justify-center bg-black/40 p-4">
        <View className="max-h-[90%] w-full max-w-[560px] overflow-hidden rounded-card bg-surface">
          <View className="flex-row items-start gap-3 border-b border-border px-4 py-3.5">
            <View className="min-w-0 flex-1">
              <Text className="font-heavy text-cardTitle text-ink">{L('Tạo đề cho bài này', 'Create questions for this passage')}</Text>
              <Text className="mt-0.5 font-sans text-label text-muted" numberOfLines={1}>
                {article.title}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={L('Đóng', 'Close')}
              className="h-8 w-8 items-center justify-center"
            >
              <Icon name="close" size={18} color={color.subtle} />
            </Pressable>
          </View>

          <ScrollView className="px-4" contentContainerStyle={{ paddingVertical: 14, gap: 14 }}>
            <View>
              <Text className="mb-2 font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 12 }}>
                {L(`Chọn dạng bài (tối đa ${MAX_MIX_BLOCKS})`, `Pick question types (up to ${MAX_MIX_BLOCKS})`)}
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {IELTS_TYPE_SPECS.map((spec) => {
                  const on = selected.includes(spec.type);
                  const ok = canGenerate(spec.type, shape);
                  const full4 = !on && selected.length >= MAX_MIX_BLOCKS;
                  const disabled = busy || !ok || full4;
                  return (
                    <Pressable
                      key={spec.type}
                      onPress={() => toggle(spec.type)}
                      disabled={disabled}
                      accessibilityRole="button"
                      aria-pressed={on}
                      accessibilityLabel={spec.label}
                      className={['rounded-pill border px-3 py-1.5', on ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface'].join(' ')}
                      style={disabled && !on ? { opacity: 0.4 } : undefined}
                    >
                      <Text className={['font-semi text-label', on ? 'text-white' : 'text-muted'].join(' ')}>{spec.short}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {full && IELTS_TYPE_SPECS.some((s) => !canGenerate(s.type, shape)) ? (
                <Text className="mt-1.5 font-sans text-label text-subtle">
                  {L('Dạng mờ cần bài dài hơn hoặc nhiều đoạn hơn.', 'Dimmed types need a longer or multi-paragraph passage.')}
                </Text>
              ) : null}
            </View>

            <View className="gap-2">
              {blocks.map((b) => {
                const spec = specOf(b.type);
                return (
                  <View key={b.type} className="flex-row items-center gap-3 rounded-panel border border-border bg-surfaceAlt px-3 py-2.5">
                    <View className="min-w-0 flex-1">
                      <Text className="font-strong text-body text-ink" numberOfLines={1}>
                        {spec?.label}
                      </Text>
                      <Text className="font-sans text-label text-muted" numberOfLines={1}>
                        {L(spec?.hintVi ?? '', spec?.hintEn ?? '')}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Pressable
                        onPress={() => step(b.type, -1)}
                        disabled={busy}
                        accessibilityRole="button"
                        accessibilityLabel={L('Bớt một câu', 'One fewer')}
                        className="h-8 w-8 items-center justify-center rounded-pill border border-border bg-surface"
                      >
                        <Text className="font-heavy text-body text-ink">−</Text>
                      </Pressable>
                      <Text className="w-7 text-center font-heavy text-body text-ink">{b.count}</Text>
                      <Pressable
                        onPress={() => step(b.type, 1)}
                        disabled={busy}
                        accessibilityRole="button"
                        accessibilityLabel={L('Thêm một câu', 'One more')}
                        className="h-8 w-8 items-center justify-center rounded-pill border border-border bg-surface"
                      >
                        <Text className="font-heavy text-body text-ink">+</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
              <Text className="font-sans text-label text-muted">
                {L(
                  `Tổng ${total} câu${total > MAX_MIX_TOTAL ? ' (quá trần)' : ''} · đề thật 13–14 câu mỗi passage.`,
                  `${total} questions in total · a real passage has 13–14.`,
                )}
              </Text>
            </View>

            {busy ? (
              <View className="gap-1.5">
                <ProgressBar value={Math.round(((generating?.done ?? 0) / Math.max(1, generating?.total ?? 1)) * 100)} height={6} />
                <Text className="font-sans text-label text-muted">
                  {L(
                    `Đang tạo… ${generating?.done ?? 0}/${generating?.total ?? blocks.length} khối`,
                    `Creating… ${generating?.done ?? 0}/${generating?.total ?? blocks.length} blocks`,
                  )}
                </Text>
              </View>
            ) : null}

            {result ? (
              <View
                className={['rounded-panel border px-3 py-2.5', result.made > 0 ? 'border-success-soft bg-success-soft' : 'border-danger-soft bg-danger-soft'].join(' ')}
              >
                <Text className={['font-semi text-body', result.made > 0 ? 'text-success-ink' : 'text-danger-ink'].join(' ')}>
                  {result.made > 0
                    ? L(`Đã tạo ${result.made} câu.`, `Created ${result.made} questions.`)
                    : (result.message ?? L('Chưa tạo được đề. Thử lại sau ít phút.', "Couldn't create questions. Try again in a few minutes."))}
                </Text>
                {result.failed.length > 0 && result.made > 0 ? (
                  <Text className="mt-0.5 font-sans text-label text-success-ink">
                    {L(
                      `Chưa tạo được: ${result.failed.map(shortLabel).join(', ')}.`,
                      `Couldn't create: ${result.failed.map(shortLabel).join(', ')}.`,
                    )}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </ScrollView>

          <View className="flex-row flex-wrap items-center gap-2 border-t border-border px-4 py-3">
            {saved?.requestedTypes?.startsWith('mix:') && !busy ? (
              <Pressable onPress={() => clearSet(article.id)} accessibilityRole="button" className="py-1.5">
                <Text className="font-semi text-label text-subtle">{L('Về đề mặc định', 'Back to default')}</Text>
              </Pressable>
            ) : null}
            <View className="flex-1" />
            {result && result.made > 0 ? (
              <Button
                label={L('Làm bài', 'Start')}
                iconRight="arrow-right"
                onPress={() => {
                  onClose();
                  router.push(`/read/${article.id}` as never);
                }}
              />
            ) : (
              <Button
                label={busy ? L('Đang tạo…', 'Creating…') : L(`Tạo đề (${total} câu)`, `Create (${total})`)}
                iconLeft="sparkle"
                disabled={busy || blocks.length === 0 || total > MAX_MIX_TOTAL || !full}
                onPress={() => void run()}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
