import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { HUB_UI, HubBar, HubChips, HubHero, HubPanel, HubTag, hubLift } from '@/components/hub/HubUi';
import { DIFF_COLOR } from '@/components/hub/theme';
import { GT_CATEGORIES } from '@/data/hub/speaking-more';
import { useHubStore } from '@/store/useHubStore';

type Level = 'ALL' | 'EASY' | 'MEDIUM' | 'HARD';
const LEVELS: { id: Level; label: string }[] = [
  { id: 'ALL', label: 'Mọi mức' },
  { id: 'EASY', label: 'Dễ' },
  { id: 'MEDIUM', label: 'Vừa' },
  { id: 'HARD', label: 'Khó' },
];
const LEVEL_VI = { EASY: 'Dễ', MEDIUM: 'Vừa', HARD: 'Khó' } as const;
type Hover = { hovered?: boolean };

/** Đề luyện nói giao tiếp: nói tự do theo tình huống đời sống và công việc, có ý bắt buộc, mẫu câu và bài mẫu. */
export default function GiaoTiepHub() {
  const [level, setLevel] = useState<Level>('ALL');
  const done = useHubStore((s) => s.topicsDone);
  const total = GT_CATEGORIES.reduce((n, c) => n + c.tasks.length, 0);
  const doneCount = GT_CATEGORIES.reduce((n, c) => n + c.tasks.filter((t) => done[t.id]).length, 0);
  const groups = useMemo(() => GT_CATEGORIES.map((c) => ({ ...c, tasks: c.tasks.filter((t) => level === 'ALL' || t.level === level) })).filter((c) => c.tasks.length > 0), [level]);

  return (
    <HubScreen title="Đề nói giao tiếp" subtitle={`${total} đề · ${GT_CATEGORIES.length} nhóm`} back padBottom={140}>
      <HubHero
        eyebrow="SPEAKING · GIAO TIẾP"
        title="Nói được việc thật,"
        accent="không chỉ trả lời đề"
        stats={[
          { value: String(total), label: 'Đề giao tiếp' },
          { value: String(GT_CATEGORIES.length), label: 'Nhóm tình huống' },
          { value: `${doneCount}/${total}`, label: 'Đã làm' },
          { value: '45–90s', label: 'Mỗi lần nói' },
        ]}
      />

      <HubPanel title="Chọn mức độ" icon="gamepad">
        <HubChips options={LEVELS} value={level} onChange={setLevel} />
      </HubPanel>

      {groups.map((c) => {
        const ok = c.tasks.filter((t) => done[t.id]).length;
        return (
          <HubPanel key={c.id} title={c.titleVi} icon="book" badge={`${ok}/${c.tasks.length}`}>
            <HubBar ratio={ok / Math.max(1, c.tasks.length)} color={HUB_UI.green} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {c.tasks.map((t) => (
                <Pressable key={t.id} accessibilityRole="button" accessibilityLabel={t.titleVi} onPress={() => router.push(`/hub/giao-tiep/${t.id}` as never)} style={({ hovered }: Hover) => ({ flexBasis: 250, flexGrow: 1, flexShrink: 1, minWidth: 0, gap: 8, padding: 14, borderRadius: 18, borderWidth: 1.5, backgroundColor: done[t.id] ? '#F1FBF5' : '#FFFFFF', ...hubLift(hovered) }) as never}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <HubTag label={LEVEL_VI[t.level]} color={DIFF_COLOR[t.level]} />
                    {done[t.id] ? <HubTag label="Đã làm ✓" color={HUB_UI.green} bg="#DDF7E8" /> : null}
                  </View>
                  <Text style={{ color: HUB_UI.navy, fontSize: 16.5, fontWeight: '900' }}>{t.titleVi}</Text>
                  <Text numberOfLines={2} style={{ color: HUB_UI.muted, fontSize: 13.5, lineHeight: 19 }}>{t.situationVi}</Text>
                </Pressable>
              ))}
            </View>
          </HubPanel>
        );
      })}
    </HubScreen>
  );
}
