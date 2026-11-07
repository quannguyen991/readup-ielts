import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { DrillSetRunner } from '@/components/ielts/DrillSetRunner';
import { Icon } from '@/components/ui';
import { getDrillSets, hasDrillSets } from '@/data/drill-sets';
import { getWritingPromptById, WRITING_PROMPTS } from '@/data/writing-repository';
import { useL } from '@/i18n/useL';
import { CUE_CARDS, PART1_TOPICS } from '@/services/speaking/bank';
import { useDrillSetStore } from '@/store/useDrillSetStore';

/** Số đề mỗi dạng Writing / Speaking. */
export const WRITING_PER_TYPE = 10;
export const SPEAKING_PER_TYPE = 20;

function pickWriting(typeId: string) {
  const by = (pred: (p: (typeof WRITING_PROMPTS)[number]) => boolean) => WRITING_PROMPTS.filter(pred);
  if (typeId === 'writing-task-1-chart') {
    const kinds: Array<[string, number]> = [['line', 3], ['bar', 3], ['pie', 2], ['table', 2]];
    return kinds.flatMap(([k, n]) => by((p) => p.task === 'ielts_task1' && p.chartKind === k).slice(0, n));
  }
  if (typeId === 'writing-task-1-process-map') return by((p) => p.chartKind === 'process' || p.chartKind === 'map').slice(0, WRITING_PER_TYPE);
  if (typeId === 'writing-task-2-opinion') return by((p) => p.essayKind === 'opinion').slice(0, WRITING_PER_TYPE);
  return [];
}

export function isCustomPractice(typeId: string, skill: string): boolean {
  return hasDrillSets(typeId) || skill === 'writing' || skill === 'speaking';
}

export function practiceSummary(typeId: string, skill: string, L: (vi: string, en: string) => string): string {
  if (hasDrillSets(typeId)) return L('10 set × 20 câu', '10 sets × 20 questions');
  if (skill === 'writing') return L(`${WRITING_PER_TYPE} đề viết · AI chấm`, `${WRITING_PER_TYPE} prompts · AI marked`);
  return L(`${SPEAKING_PER_TYPE} đề nói`, `${SPEAKING_PER_TYPE} speaking prompts`);
}

const WRITING_HINT: Record<string, [string, string]> = {
  'writing-task-1-chart': ['Mở bài diễn đạt lại đề → Overview 2 ý lớn nhất → 2 đoạn thân bài nhóm số liệu.', 'Paraphrase → Overview → two data paragraphs.'],
  'writing-task-1-process-map': ['Process: dùng bị động + từ nối thứ tự. Map: so sánh trước/sau, dùng từ chỉ vị trí.', 'Process: passive + sequencers. Map: before/after + location language.'],
  'writing-task-2-opinion': ['Nêu rõ quan điểm ở mở bài, mỗi thân bài một lý lẽ + ví dụ, kết bài nhắc lại quan điểm.', 'State your view, one argument per body paragraph, restate in conclusion.'],
};

export function TypePractice({ typeId, skill, listening }: { typeId: string; skill: string; listening: boolean }) {
  const { L } = useL();
  const results = useDrillSetStore((s) => s.results);
  const sets = useMemo(() => getDrillSets(typeId), [typeId]);
  const [openId, setOpenId] = useState<string | null>(null);

  if (sets.length > 0) {
    const open = sets.find((s) => s.id === openId);
    if (open) {
      const i = sets.indexOf(open);
      return <DrillSetRunner typeId={typeId} set={open} listening={listening} nextSetId={sets[i + 1]?.id} onExit={() => setOpenId(null)} onNext={setOpenId} />;
    }
    return (
      <View className="gap-3 pb-12">
        <Text className="font-sans text-label text-muted">
          {listening ? L('Mỗi set là một bài nghe với 20 câu. Nghe bằng giọng máy, có thể nghe lại.', 'Each set is one recording with 20 questions.') : L('Mỗi set là một bài đọc với 20 câu. Làm theo thứ tự, xem giải thích sau mỗi câu.', 'Each set has 20 questions.')}
        </Text>
        {sets.map((s, i) => {
          const r = results[s.id];
          return (
            <Pressable key={s.id} onPress={() => setOpenId(s.id)} className="flex-row items-center gap-3 rounded-2xl border border-border bg-surface p-4">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Text className="font-heavy text-body text-primary">{i + 1}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-strong text-body text-ink" numberOfLines={1}>{s.title}</Text>
                <Text className="font-sans text-label text-muted" numberOfLines={1}>{s.topic} · {s.questions.length} {L('câu', 'questions')}</Text>
              </View>
              {r ? <Text className="font-strong text-label" style={{ color: '#15803D' }}>{L('Tốt nhất', 'Best')} {r.best}/{r.total}</Text> : <Icon name="arrow-right" size={16} color="#6A4BD9" />}
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (skill === 'writing') {
    const prompts = pickWriting(typeId);
    const hint = WRITING_HINT[typeId];
    return (
      <View className="gap-3 pb-12">
        {hint ? (
          <View className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
            <Text className="font-strong text-label text-amber-900">{L('Gợi ý dạng này', 'Tip for this type')}</Text>
            <Text className="mt-1 font-sans text-body text-amber-900">{L(hint[0], hint[1])}</Text>
          </View>
        ) : null}
        <Text className="font-sans text-label text-muted">{L('Bạn tự viết bài hoàn chỉnh; trang viết có khung gợi ý theo từng đoạn, AI chấm 4 tiêu chí và chỉ lỗi.', 'You write a full response; AI marks four criteria.')}</Text>
        {prompts.map((p, i) => (
          <Pressable key={p.id} onPress={() => router.push(`/write/${p.id}` as never)} className="gap-1 rounded-2xl border border-border bg-surface p-4">
            <View className="flex-row items-center justify-between">
              <Text className="font-strong text-label text-primary">{L(`Đề ${i + 1}`, `Prompt ${i + 1}`)} · {p.chartKind ?? p.essayKind}</Text>
              <Text className="font-sans text-label text-muted">{p.minWords}+ {L('từ', 'words')} · {Math.round(p.timeLimitSeconds / 60)}′</Text>
            </View>
            <Text className="font-sans text-body text-ink" numberOfLines={3}>{p.promptText}</Text>
            <View className="mt-1 flex-row items-center gap-1">
              <Icon name="pencil" size={14} color="#6A4BD9" />
              <Text className="font-strong text-label" style={{ color: '#6A4BD9' }}>{L('Viết bài', 'Write')}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    );
  }

  // Speaking
  const part3 = typeId === 'speaking-part-3-discussion';
  const part2 = typeId === 'speaking-part-2-structuring';
  const items = part2 || part3
    ? CUE_CARDS.slice(0, SPEAKING_PER_TYPE).map((c) => ({ id: c.id, title: c.titleVi, text: part3 ? c.part3[0]?.text ?? c.card.text : c.card.text, href: `/speaking/room?mode=${part3 ? 'p3' : 'p2'}&cue=${encodeURIComponent(c.id)}` }))
    : PART1_TOPICS.slice(0, SPEAKING_PER_TYPE).map((t) => ({ id: t.id, title: t.titleVi, text: t.questions[0]?.text ?? '', href: `/speaking/room?mode=p1&p1=${encodeURIComponent(t.id)}&exam=1` }));
  return (
    <View className="gap-3 pb-12">
      <Text className="font-sans text-label text-muted">
        {L('Bạn nói thật vào micro (hoặc gõ nếu không có mic). Giám khảo đọc câu hỏi, phần Part 2 có 1 phút chuẩn bị, AI chấm 4 tiêu chí.', 'Speak into the mic; AI marks four criteria.')}
      </Text>
      {items.map((it, i) => (
        <Pressable key={it.id} onPress={() => router.push(it.href as never)} className="gap-1 rounded-2xl border border-border bg-surface p-4">
          <Text className="font-strong text-label text-primary">{L(`Đề ${i + 1}`, `Prompt ${i + 1}`)} · {it.title}</Text>
          <Text className="font-sans text-body text-ink" numberOfLines={2}>{it.text}</Text>
          <View className="mt-1 flex-row items-center gap-1">
            <Icon name="mic" size={14} color="#6A4BD9" />
            <Text className="font-strong text-label" style={{ color: '#6A4BD9' }}>{L('Bắt đầu nói', 'Start speaking')}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export { getWritingPromptById };
