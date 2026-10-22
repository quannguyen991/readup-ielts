import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '@/components/ui';
import type { IconName } from '@/components/ui/Icon';
import { SKILL_LABEL, type PlanBlock, type Skill } from '@/services/plan/custom';
import { useRoadmapStore } from '@/store/useRoadmapStore';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/** Màu và biểu tượng từng kỹ năng — dùng chung ở trang Lộ trình và Tổng quan. */
export const SKILL_TONE: Record<Skill | 'check', { tone: string; soft: string; icon: IconName }> = {
  vocab: { tone: '#10B981', soft: '#E7F8F1', icon: 'letters' },
  reading: { tone: '#6A4BD9', soft: '#F3F0FB', icon: 'book' },
  listening: { tone: '#0D9488', soft: '#E6F6F4', icon: 'volume' },
  writing: { tone: '#F0703F', soft: '#F3F0FB', icon: 'pencil' },
  math: { tone: '#24375A', soft: '#EEF1F6', icon: 'grid' },
  verbal: { tone: '#F43F5E', soft: '#FEECEF', icon: 'languages' },
  check: { tone: '#F59E0B', soft: '#F3F0FB', icon: 'target' },
};

/** Tên kỹ năng bằng tiếng Anh (bản tiếng Việt: `SKILL_LABEL` trong services/plan). */
const SKILL_LABEL_EN: Record<Skill, string> = {
  reading: 'IELTS Reading',
  listening: 'Listen & dictate',
  writing: 'IELTS Writing',
  vocab: 'Vocabulary',
  math: 'SAT Math',
  verbal: 'SAT Verbal',
};

/**
 * Một khối trong lộ trình: ô đánh dấu "đã làm" (người học tự bấm — app không
 * giả vờ biết), tên bài cụ thể, số phút, nút vào thẳng màn làm bài.
 */
export function PlanBlockRow({ block, compact = false }: { block: PlanBlock; compact?: boolean }) {
  const done = useRoadmapStore((s) => !!s.done[block.id]);
  const toggle = useRoadmapStore((s) => s.toggleDone);
  const t = SKILL_TONE[block.skill];
  const { L, en } = useL();

  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl bg-white px-3 py-2.5"
      style={{ borderWidth: 1, borderColor: done ? '#BBF7D0' : '#F3F0FB', opacity: done ? 0.75 : 1 }}
    >
      <Pressable
        accessibilityRole="checkbox"
        aria-checked={done}
        accessibilityLabel={done ? L('Bỏ đánh dấu đã làm', 'Mark as not done') : L('Đánh dấu đã làm', 'Mark as done')}
        onPress={() => toggle(block.id)}
        className="h-7 w-7 items-center justify-center rounded-lg"
        style={{
          borderWidth: done ? 0 : 1.5,
          borderColor: '#E0D7C7',
          backgroundColor: done ? '#22C55E' : '#FFFFFF',
          ...(Platform.OS === 'web' ? ({ transition: 'background-color 160ms ease' } as object) : null),
        }}
      >
        {done ? <Icon name="check" size={15} color="#FFFFFF" strokeWidth={2.8} /> : null}
      </Pressable>

      <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: t.soft }}>
        <Icon name={t.icon} size={17} color={t.tone} strokeWidth={2.1} />
      </View>

      <View className="min-w-0 flex-1">
        <Text className="font-semi text-label" style={{ color: t.tone }}>
          {block.skill === 'check' ? L('Cửa kiểm tra', 'Checkpoint') : en ? SKILL_LABEL_EN[block.skill] : SKILL_LABEL[block.skill]} ·{' '}
          {block.minutes} {L('phút', 'min')}
        </Text>
        <Text
          className="font-strong text-body text-ink"
          numberOfLines={compact ? 1 : 2}
          style={done ? { textDecorationLine: 'line-through' } : undefined}
        >
          {block.title.replace(/^[^·]+· /, '')}
        </Text>
        {!compact ? (
          <Text className="font-sans text-label text-muted" numberOfLines={1}>
            {block.detail}
          </Text>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="link"
        accessibilityLabel={L(`Vào học: ${block.title}`, `Start: ${block.title}`)}
        onPress={() => router.push(block.href as never)}
        className="flex-row items-center gap-1 rounded-pill px-3 py-1.5"
        style={{ backgroundColor: done ? '#F3F0FB' : color.primary }}
      >
        <Text className="font-strong text-label" style={{ color: done ? color.ink : '#FFFFFF' }}>
          {done ? L('Học lại', 'Redo') : L('Vào học', 'Start')}
        </Text>
        <Icon name="arrow-right" size={13} color={done ? color.ink : '#FFFFFF'} />
      </Pressable>
    </View>
  );
}
