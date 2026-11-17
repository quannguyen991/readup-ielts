import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { HUB_UI, HubChips, HubHero, HubPanel, hubLift } from '@/components/hub/HubUi';
import { TalkRow as Row, allTalks } from '@/components/hub/TalkCards';
import { Icon } from '@/components/ui/Icon';
import { dayHash, dayKeyOf } from '@/services/hub/daily';
import { CATEGORY_LABEL, type ScenarioCategory } from '@/services/hub/roleplay';
import { useDialogueStore } from '@/store/useDialogueStore';
import { useHubStore } from '@/store/useHubStore';

type Level = 'ALL' | 'EASY' | 'MEDIUM' | 'HARD';
const LEVELS: { id: Level; label: string }[] = [
  { id: 'ALL', label: 'Tất cả cấp độ' },
  { id: 'EASY', label: 'Dễ' },
  { id: 'MEDIUM', label: 'Trung bình' },
  { id: 'HARD', label: 'Khó' },
];

type Hover = { hovered?: boolean };

/** Nói chuyện: chọn một cuộc trò chuyện đời thường, không bài học — kệ ngang theo chủ đề, có bảng xu hướng và lịch sử. */
export default function TalkHub() {
  const [level, setLevel] = useState<Level>('ALL');
  const roleplayDone = useHubStore((s) => s.roleplayDone);
  const bestByDialogue = useDialogueStore((s) => s.best);

  const talks = useMemo(allTalks, []);
  const isDone = (id: string) => (roleplayDone[id] ?? 0) > 0 || (bestByDialogue[id] ?? -1) >= 0;
  const filtered = useMemo(() => talks.filter((t) => level === 'ALL' || t.difficulty === level), [talks, level]);

  // Xu hướng: 8 cuộc trò chuyện xoay theo ngày, ưu tiên cái chưa nói.
  const trending = useMemo(() => {
    const seed = dayHash(dayKeyOf(new Date()));
    const fresh = filtered.filter((t) => !isDone(t.id));
    const base = fresh.length >= 8 ? fresh : filtered;
    const start = base.length ? seed % base.length : 0;
    const rotated = [...base.slice(start), ...base.slice(0, start)];
    // Mỗi bối cảnh một lần trước để kệ xu hướng không toàn một ảnh; thiếu thì lấp bằng phần còn lại.
    const seen = new Set<string>();
    const varied = rotated.filter((t) => (seen.has(t.setting) ? false : (seen.add(t.setting), true)));
    return [...varied, ...rotated.filter((t) => !varied.includes(t))].slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, roleplayDone, bestByDialogue]);

  const recent = filtered.filter((t) => isDone(t.id)).slice(0, 10);
  const spoken = talks.filter((t) => isDone(t.id)).length;
  const categories = (Object.keys(CATEGORY_LABEL) as ScenarioCategory[]).map((c) => ({ c, items: filtered.filter((t) => t.category === c) })).filter((g) => g.items.length > 0);

  return (
    <HubScreen title="Nói chuyện" subtitle="Trò chuyện thật. Không bài học, chỉ nói chuyện." back padBottom={140}>
      <HubHero
        eyebrow="IELTS · SPEAKING"
        title="Nói chuyện thật,"
        accent="không bài học, chỉ nói"
        stats={[
          { value: String(talks.length), label: 'Cuộc trò chuyện' },
          { value: String(spoken), label: 'Đã nói' },
          { value: String(categories.length), label: 'Chủ đề' },
          { value: '3–7′', label: 'Mỗi cuộc' },
        ]}
      />

      <HubPanel title="Chọn cấp độ" icon="gamepad">
        <HubChips options={LEVELS} value={level} onChange={setLevel} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/hub/live' as never)} style={({ hovered }: Hover) => ({ flexBasis: 240, flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, borderWidth: 1.5, backgroundColor: HUB_UI.wash, ...hubLift(hovered) }) as never}>
            <Text style={{ fontSize: 26 }}>🦁</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: HUB_UI.navy, fontSize: 15, fontWeight: '900' }}>Nói cùng Leo</Text>
              <Text style={{ color: HUB_UI.muted, fontSize: 13, fontWeight: '600' }}>Giám khảo AI hỏi sáu câu như bài thi</Text>
            </View>
            <Icon name="chevron-right" size={16} color={HUB_UI.muted} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/hub/explore' as never)} style={({ hovered }: Hover) => ({ flexBasis: 240, flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, borderWidth: 1.5, backgroundColor: HUB_UI.wash, ...hubLift(hovered) }) as never}>
            <Text style={{ fontSize: 26 }}>🎁</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: HUB_UI.navy, fontSize: 15, fontWeight: '900' }}>Tình huống tự tạo</Text>
              <Text style={{ color: HUB_UI.muted, fontSize: 13, fontWeight: '600' }}>Đặt nhân vật và bối cảnh riêng của bạn</Text>
            </View>
            <Icon name="chevron-right" size={16} color={HUB_UI.muted} />
          </Pressable>
        </View>
      </HubPanel>

      {trending.length ? (
        <HubPanel title="Cuộc trò chuyện xu hướng" icon="flame" badge="HÔM NAY">
          <Row talks={trending} done={isDone} ranked />
        </HubPanel>
      ) : null}

      {recent.length ? (
        <HubPanel title="Nói gần đây" icon="clock" badge={String(recent.length)}>
          <Row talks={recent} done={isDone} />
        </HubPanel>
      ) : null}

      {categories.map(({ c, items }) => (
        <HubPanel key={c} title={`Trò chuyện: ${CATEGORY_LABEL[c]}`} icon="book" badge={String(items.length)}>
          <Row talks={items} done={isDone} />
        </HubPanel>
      ))}

      {filtered.length === 0 ? (
        <HubPanel title="Chưa có cuộc trò chuyện nào" icon="cloud">
          <Text style={{ color: HUB_UI.muted, fontSize: 14 }}>Cấp độ này chưa có bài. Chọn “Tất cả cấp độ”.</Text>
        </HubPanel>
      ) : null}
    </HubScreen>
  );
}
