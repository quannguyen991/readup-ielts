import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { HUB_UI, HubBar, HubChips, HubHero, HubPanel, HubTag, hubLift } from '@/components/hub/HubUi';
import { DIFF_COLOR } from '@/components/hub/theme';
import { DIALOGUES, type Dialogue } from '@/data/hub/dialogues';
import { SCENE_CREDITS, SCENE_THUMB } from '@/data/hub/scenes';
import { dayHash, dayKeyOf } from '@/services/hub/daily';
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

type Level = 'ALL' | 'EASY' | 'MEDIUM' | 'HARD';
const LEVELS: { id: Level; label: string }[] = [
  { id: 'ALL', label: 'Mọi mức' },
  { id: 'EASY', label: 'Dễ' },
  { id: 'MEDIUM', label: 'Vừa' },
  { id: 'HARD', label: 'Khó' },
];
const LEVEL_VI = { EASY: 'Dễ', MEDIUM: 'Vừa', HARD: 'Khó' } as const;

type Hover = { hovered?: boolean };

/** Màn tổng hợp tình huống nói: hero số liệu, gợi ý hôm nay, bộ lọc mức độ, mỗi chủ đề một khung. */
export default function ScenariosHub() {
  const [tab, setTab] = useState<Tab>('roleplay');
  const [level, setLevel] = useState<Level>('ALL');
  const roleplayDone = useHubStore((s) => s.roleplayDone);
  const bestByDialogue = useDialogueStore((s) => s.best);
  const active = TABS.find((t) => t.key === tab)!;

  const total = ROLEPLAYS.length + DIALOGUES.length;
  const doneRp = ROLEPLAYS.filter((r) => (roleplayDone[r.id] ?? 0) > 0).length;
  const doneDl = DIALOGUES.filter((d) => (bestByDialogue[d.id] ?? -1) >= DIALOGUE_PASS_RATIO * 100).length;
  const doneAll = doneRp + doneDl;

  const matches = (d: string) => level === 'ALL' || d === level;
  const pool: (Roleplay | Dialogue)[] = tab === 'dialogue' ? DIALOGUES.filter((d) => matches(d.difficulty)) : ROLEPLAYS.filter((r) => r.mode === tab && matches(r.difficulty));
  const isDone = (id: string) => (tab === 'dialogue' ? (bestByDialogue[id] ?? -1) >= DIALOGUE_PASS_RATIO * 100 : (roleplayDone[id] ?? 0) > 0);
  // Gợi ý hôm nay: một tình huống chưa làm, đổi theo ngày; làm hết rồi thì lấy theo ngày trong cả danh sách.
  const todo = pool.filter((x) => !isDone(x.id));
  const list = todo.length ? todo : pool;
  const pick = list.length ? list[dayHash(dayKeyOf(new Date())) % list.length] : undefined;

  return (
    <HubScreen title="Tình huống nói" subtitle="Nhập vai, gọi điện và hội thoại như ngoài đời" back padBottom={120}>
      <HubHero
        eyebrow="IELTS · SPEAKING"
        title="Nói như ngoài đời,"
        accent="từng tình huống một"
        stats={[
          { value: `${doneAll}/${total}`, label: 'Đã hoàn thành' },
          { value: `${doneRp}`, label: 'Nhập vai & gọi điện' },
          { value: `${doneDl}`, label: 'Hội thoại đạt' },
          { value: `${Math.round((doneAll / Math.max(1, total)) * 100)}%`, label: 'Tiến độ chung' },
        ]}
      />

      <HubPanel title="Chọn kiểu luyện" icon="gamepad">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {TABS.map((t) => {
            const on = t.key === tab;
            const n = t.key === 'dialogue' ? DIALOGUES.length : ROLEPLAYS.filter((r) => r.mode === t.key).length;
            return (
              <Pressable
                key={t.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setTab(t.key)}
                style={({ hovered }) => ({ flexGrow: 1, flexBasis: 180, gap: 3, padding: 14, borderRadius: 16, borderWidth: 2, backgroundColor: on ? HUB_UI.wash : '#FFFFFF', ...(on ? { borderColor: HUB_UI.purple } : hubLift(hovered)) }) as never}
              >
                <Text style={{ color: on ? HUB_UI.purple : HUB_UI.navy, fontSize: 16, fontWeight: '900' }}>{t.label} · {n}</Text>
                <Text style={{ color: HUB_UI.muted, fontSize: 13, fontWeight: '600', lineHeight: 18 }}>{t.hint}</Text>
              </Pressable>
            );
          })}
        </View>
        <HubChips options={LEVELS} value={level} onChange={setLevel} />
      </HubPanel>

      {pick ? (
        <HubPanel title="Gợi ý hôm nay" icon="sparkle" badge={active.label}>
          {tab === 'dialogue' ? (
            <View style={{ flexDirection: 'row' }}>
              <DialogueCard dialogue={pick as Dialogue} best={bestByDialogue[pick.id]} wide />
            </View>
          ) : (
            <View style={{ flexDirection: 'row' }}>
              <ScenarioCard play={pick as Roleplay} done={isDone(pick.id)} wide />
            </View>
          )}
        </HubPanel>
      ) : null}

      {CATEGORY_ORDER.map((cat) => {
        const items = pool.filter((x) => x.category === cat);
        if (items.length === 0) return null;
        const ok = items.filter((x) => isDone(x.id)).length;
        return (
          <HubPanel key={cat} title={CATEGORY_LABEL[cat]} icon="book" badge={`${ok}/${items.length}`}>
            <HubBar ratio={ok / Math.max(1, items.length)} color={HUB_UI.green} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {items.map((x) =>
                tab === 'dialogue' ? (
                  <DialogueCard key={x.id} dialogue={x as Dialogue} best={bestByDialogue[x.id]} />
                ) : (
                  <ScenarioCard key={x.id} play={x as Roleplay} done={isDone(x.id)} />
                ),
              )}
            </View>
          </HubPanel>
        );
      })}

      {pool.length === 0 ? (
        <HubPanel title="Không có tình huống nào" icon="cloud">
          <Text style={{ color: HUB_UI.muted, fontSize: 14, fontWeight: '600' }}>Mức độ này chưa có bài trong mục đang chọn. Thử mức khác.</Text>
        </HubPanel>
      ) : null}

      <View style={{ paddingHorizontal: 4, gap: 2 }}>
        <Text style={{ color: HUB_UI.muted, fontSize: 12.5, lineHeight: 18 }}>Ảnh minh hoạ tạo bằng ChatGPT (OpenAI).</Text>
        {SCENE_CREDITS.map((c) => (
          <Text key={c.key} style={{ color: HUB_UI.muted, fontSize: 12.5, lineHeight: 18 }}>{`${c.key}: ${c.author}`}</Text>
        ))}
      </View>
    </HubScreen>
  );
}

function Thumb({ setting, tall }: { setting: keyof typeof SCENE_THUMB; tall?: boolean }) {
  return <Image source={{ uri: SCENE_THUMB[setting] }} accessibilityIgnoresInvertColors style={{ width: '100%', height: tall ? 190 : 128, borderRadius: 14, backgroundColor: HUB_UI.wash }} resizeMode="cover" />;
}

function CardShell({ label, onPress, wide, children }: { label: string; onPress: () => void; wide?: boolean; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ hovered }) => ({ flexBasis: wide ? '100%' : 230, flexGrow: 1, flexShrink: 1, minWidth: 0, padding: 10, gap: 8, borderRadius: 18, borderWidth: 1.5, backgroundColor: '#FFFFFF', ...hubLift(hovered) }) as never}
    >
      {children}
    </Pressable>
  );
}

function ScenarioCard({ play, done, wide }: { play: Roleplay; done: boolean; wide?: boolean }) {
  const path = play.mode === 'call' ? `/hub/call/${play.id}` : `/hub/roleplay/${play.id}`;
  return (
    <CardShell label={play.title} onPress={() => router.push(path as never)} wide={wide}>
      <Thumb setting={play.setting} tall={wide} />
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, paddingHorizontal: 4 }}>
        <HubTag label={LEVEL_VI[play.difficulty]} color={DIFF_COLOR[play.difficulty]} />
        <HubTag label={`${play.minutes} phút`} color={HUB_UI.muted} />
        {done ? <HubTag label="Đã làm ✓" color={HUB_UI.green} bg="#DDF7E8" /> : null}
      </View>
      <Text style={{ color: HUB_UI.navy, fontSize: 16, fontWeight: '900', paddingHorizontal: 4 }}>{play.title}</Text>
    </CardShell>
  );
}

function DialogueCard({ dialogue, best, wide }: { dialogue: Dialogue; best: number | undefined; wide?: boolean }) {
  const passed = best !== undefined && best >= DIALOGUE_PASS_RATIO * 100;
  return (
    <CardShell label={dialogue.title} onPress={() => router.push(`/hub/dialogue/${dialogue.id}` as never)} wide={wide}>
      <Thumb setting={dialogue.setting} tall={wide} />
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, paddingHorizontal: 4 }}>
        <HubTag label={LEVEL_VI[dialogue.difficulty]} color={DIFF_COLOR[dialogue.difficulty]} />
        <HubTag label={`${dialogue.minutes} phút`} color={HUB_UI.muted} />
        {best !== undefined ? <HubTag label={`Cao nhất ${best}%`} color={passed ? HUB_UI.green : HUB_UI.muted} bg={passed ? '#DDF7E8' : HUB_UI.wash} /> : null}
      </View>
      <Text style={{ color: HUB_UI.navy, fontSize: 16, fontWeight: '900', paddingHorizontal: 4 }}>{dialogue.title}</Text>
    </CardShell>
  );
}
