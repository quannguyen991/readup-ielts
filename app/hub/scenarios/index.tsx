import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { DIFF_COLOR, GLASS_CARD, HUB } from '@/components/hub/theme';
import { Icon } from '@/components/ui/Icon';
import { DIALOGUES, type Dialogue } from '@/data/hub/dialogues';
import { SCENE_CREDITS, SCENE_IMAGE } from '@/data/hub/scenes';
import { DIALOGUE_PASS_RATIO } from '@/services/hub/dialogue';
import { CATEGORY_LABEL, ROLEPLAYS, type Roleplay, type ScenarioCategory, type RoleplayMode } from '@/services/hub/roleplay';
import { useDialogueStore } from '@/store/useDialogueStore';
import { useHubStore } from '@/store/useHubStore';

type Tab = RoleplayMode | 'dialogue';
const TABS: { key: Tab; label: string; hint: string }[] = [
  { key: 'roleplay', label: 'Nhập vai', hint: 'Đối phương nói, bạn chọn cách đáp' },
  { key: 'call', label: 'Gọi điện', hint: 'Cuộc gọi có nhiệm vụ và từ mục tiêu' },
  { key: 'dialogue', label: 'Hội thoại', hint: 'Nghe, đọc theo, rồi làm bài điền từ' },
];
const CATEGORY_ORDER = Object.keys(CATEGORY_LABEL) as ScenarioCategory[];

/** Màn tổng hợp tình huống nói: ba mục, mỗi mục nhóm theo chủ đề, có ảnh minh hoạ. */
export default function ScenariosHub() {
  const [tab, setTab] = useState<Tab>('roleplay');
  const roleplayDone = useHubStore((s) => s.roleplayDone);
  const bestByDialogue = useDialogueStore((s) => s.best);
  const active = TABS.find((t) => t.key === tab)!;

  return (
    <HubScreen title="Tình huống nói" subtitle="Nhập vai, gọi điện và hội thoại, mỗi mục 30 tình huống" back padBottom={120}>
      <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: HUB.glass, borderWidth: 1, borderColor: HUB.line }}>
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <Pressable key={t.key} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => setTab(t.key)} style={{ flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? HUB.glassStrong : 'transparent' }}>
              <Text style={{ color: on ? HUB.ink : HUB.muted, fontSize: 13, fontWeight: on ? '800' : '600' }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ color: HUB.muted, fontSize: 12 }}>{active.hint} · {tab === 'dialogue' ? DIALOGUES.length : ROLEPLAYS.filter((r) => r.mode === tab).length} bài</Text>

      {tab === 'dialogue' ? (
        CATEGORY_ORDER.map((cat) => {
          const items = DIALOGUES.filter((d) => d.category === cat);
          if (items.length === 0) return null;
          return (
            <Section key={cat} title={CATEGORY_LABEL[cat]} count={items.length}>
              {items.map((d) => (
                <DialogueCard key={d.id} dialogue={d} best={bestByDialogue[d.id]} />
              ))}
            </Section>
          );
        })
      ) : (
        CATEGORY_ORDER.map((cat) => {
          const items = ROLEPLAYS.filter((r) => r.mode === tab && r.category === cat);
          if (items.length === 0) return null;
          return (
            <Section key={cat} title={CATEGORY_LABEL[cat]} count={items.length}>
              {items.map((r) => (
                <ScenarioCard key={r.id} play={r} done={(roleplayDone[r.id] ?? 0) > 0} />
              ))}
            </Section>
          );
        })
      )}

      <View style={[GLASS_CARD, { padding: 14, gap: 6 }]}>
        <Text style={{ color: HUB.ink, fontSize: 13, fontWeight: '800' }}>Ghi chú ảnh</Text>
        <Text style={{ color: HUB.muted, fontSize: 11, lineHeight: 16 }}>
          Ảnh minh hoạ tạo bằng ChatGPT (OpenAI).
        </Text>
        {SCENE_CREDITS.map((c) => (
          <Text key={c.key} style={{ color: HUB.muted, fontSize: 10, lineHeight: 14 }}>
            {`${c.key}: ${c.author}`}
          </Text>
        ))}
      </View>
    </HubScreen>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: HUB.muted, fontSize: 12 }}>{count} bài</Text>
      </View>
      {children}
    </View>
  );
}

function Thumb({ setting }: { setting: keyof typeof SCENE_IMAGE }) {
  return <Image source={{ uri: SCENE_IMAGE[setting] }} accessibilityIgnoresInvertColors style={{ width: '100%', height: 120, borderRadius: 12, backgroundColor: HUB.glassStrong }} resizeMode="cover" />;
}

function ScenarioCard({ play, done }: { play: Roleplay; done: boolean }) {
  const path = play.mode === 'call' ? `/hub/call/${play.id}` : `/hub/roleplay/${play.id}`;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={play.title} onPress={() => router.push(path as never)} style={[GLASS_CARD, { padding: 10, gap: 8 }]}>
      <Thumb setting={play.setting} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
        <Text style={{ color: DIFF_COLOR[play.difficulty], fontSize: 10, fontWeight: '800', borderWidth: 1, borderColor: DIFF_COLOR[play.difficulty], borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}>{play.difficulty}</Text>
        <Text style={{ color: HUB.muted, fontSize: 11 }}>{play.minutes} phút</Text>
        {done ? <Icon name="check" size={14} color={HUB.green} /> : null}
      </View>
      <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700', paddingHorizontal: 4 }}>{play.title}</Text>
      <Text style={{ color: HUB.muted, fontSize: 12, paddingHorizontal: 4 }}>{play.scene}</Text>
    </Pressable>
  );
}

function DialogueCard({ dialogue, best }: { dialogue: Dialogue; best: number | undefined }) {
  const passed = best !== undefined && best >= DIALOGUE_PASS_RATIO * 100;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={dialogue.title} onPress={() => router.push(`/hub/dialogue/${dialogue.id}` as never)} style={[GLASS_CARD, { padding: 10, gap: 8 }]}>
      <Thumb setting={dialogue.setting} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
        <Text style={{ color: DIFF_COLOR[dialogue.difficulty], fontSize: 10, fontWeight: '800', borderWidth: 1, borderColor: DIFF_COLOR[dialogue.difficulty], borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}>{dialogue.difficulty}</Text>
        <Text style={{ color: HUB.muted, fontSize: 11 }}>{dialogue.minutes} phút</Text>
        {best !== undefined ? <Text style={{ color: passed ? HUB.green : HUB.muted, fontSize: 11, fontWeight: '700' }}>{`Cao nhất ${best}%`}</Text> : null}
      </View>
      <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700', paddingHorizontal: 4 }}>{dialogue.title}</Text>
      <Text style={{ color: HUB.muted, fontSize: 12, paddingHorizontal: 4 }}>{dialogue.keyPhrases.slice(0, 3).join(' · ')}</Text>
    </Pressable>
  );
}
