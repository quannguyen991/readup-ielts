import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, DIFF_COLOR, HUB } from '@/components/hub/theme';
import { Icon, type IconName } from '@/components/ui/Icon';
import { DAILY_TALK_TOPICS } from '@/data/vocab-daily';
import { ROLEPLAYS } from '@/services/hub/roleplay';
import { SEED_SETS, type StudySet } from '@/services/hub/content';
import { speak } from '@/services/hub/speak';
import { useHubStore } from '@/store/useHubStore';

type Tab = 'sets' | 'courses' | 'topics';
const TABS: { key: Tab; label: string }[] = [
  { key: 'sets', label: 'Bộ học tập' },
  { key: 'courses', label: 'Khóa học' },
  { key: 'topics', label: 'Chủ đề' },
];

export default function HubExplore() {
  const [tab, setTab] = useState<Tab>('sets');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  return (
    <HubScreen title="Khám phá" subtitle="Bộ học, khoá học, chủ đề và kịch bản nhập vai">
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Chủ đề bạn muốn luyện"
        placeholderTextColor={HUB.muted}
        accessibilityLabel="Tìm chủ đề"
        style={{ height: 44, borderRadius: 14, paddingHorizontal: 14, color: HUB.ink, backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}
      />

      {/* Thanh chọn ba mục */}
      <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: HUB.glass, borderWidth: 1, borderColor: HUB.line }}>
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <Pressable key={t.key} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => setTab(t.key)} style={{ flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? HUB.glassStrong : 'transparent' }}>
              <Text style={{ color: on ? HUB.ink : HUB.muted, fontSize: 13, fontWeight: on ? '800' : '600' }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'sets' ? <SetsSection q={q} /> : null}
      {tab === 'courses' ? <CoursesSection /> : null}
      {tab === 'topics' ? <TopicsSection q={q} /> : null}

      {/* Nhập vai: luôn hiện, bên dưới mục đang chọn */}
      <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Thử nghiệm nhập vai</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/hub/roleplay/${ROLEPLAYS[Math.floor(Math.random() * ROLEPLAYS.length)]!.id}` as never)}
          style={[GLASS_CARD, { flex: 1, padding: 14, gap: 8, minHeight: 110, justifyContent: 'space-between' }]}
        >
          <Icon name="gift" size={22} color={HUB.amber} />
          <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '800' }}>Làm tôi ngạc nhiên</Text>
          <Text style={{ color: HUB.muted, fontSize: 11 }}>Chọn ngẫu nhiên một kịch bản</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/hub/create' as never)}
          style={[GLASS_CARD, { flex: 1, padding: 14, gap: 8, minHeight: 110, justifyContent: 'space-between' }]}
        >
          <Icon name="sparkle" size={22} color={HUB.violet} />
          <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '800' }}>Tạo của riêng tôi</Text>
          <Text style={{ color: HUB.muted, fontSize: 11 }}>Tự đặt nhân vật, giọng và tình huống</Text>
        </Pressable>
      </View>

      <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Kịch bản</Text>
      <View style={{ gap: 10 }}>
        {ROLEPLAYS.filter((r) => !q || r.title.toLowerCase().includes(q)).map((r) => (
          <RoleplayCard key={r.id} id={r.id} title={r.title} scene={r.scene} difficulty={r.difficulty} minutes={r.minutes} />
        ))}
      </View>
    </HubScreen>
  );
}

function SetsSection({ q }: { q: string }) {
  const userSets = useHubStore((s) => s.userSets);
  const saved = useHubStore((s) => s.saved);
  const toggleSaved = useHubStore((s) => s.toggleSaved);
  const addUserSet = useHubStore((s) => s.addUserSet);
  const removeUserSet = useHubStore((s) => s.removeUserSet);
  const [open, setOpen] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [words, setWords] = useState('');
  const seed = SEED_SETS.filter((s) => !q || s.title.toLowerCase().includes(q));
  const mine = userSets.filter((s) => !q || s.title.toLowerCase().includes(q));

  const create = () => {
    const items = words.split(/[,\n]/).map((w) => w.trim()).filter(Boolean);
    if (!title.trim() || items.length === 0) return;
    addUserSet(title.trim(), items.slice(0, 40));
    setTitle('');
    setWords('');
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={[GLASS_CARD, { padding: 14, gap: 8 }]}>
        <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '800' }}>Tạo bộ học mới</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Tên bộ" placeholderTextColor={HUB.muted} style={{ height: 40, borderRadius: 10, paddingHorizontal: 10, color: HUB.ink, backgroundColor: HUB.glassStrong }} />
        <TextInput value={words} onChangeText={setWords} placeholder="Các từ, cách nhau bằng dấu phẩy" placeholderTextColor={HUB.muted} multiline style={{ minHeight: 54, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: HUB.ink, backgroundColor: HUB.glassStrong }} />
        <Pressable accessibilityRole="button" onPress={create} style={{ height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.violet }}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>Lưu bộ học</Text>
        </Pressable>
      </View>

      {mine.length > 0 ? <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Của bạn</Text> : null}
      {mine.map((s) => (
        <SetCard key={s.id} set={{ id: s.id, title: s.title, author: 'Bạn', likes: 0, items: s.items }} open={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} saved={saved.includes(s.id)} onSave={() => toggleSaved(s.id)} onDelete={() => removeUserSet(s.id)} />
      ))}

      <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Có sẵn</Text>
      {seed.map((s) => (
        <SetCard key={s.id} set={s} open={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} saved={saved.includes(s.id)} onSave={() => toggleSaved(s.id)} />
      ))}
    </View>
  );
}

function SetCard({ set, open, onToggle, saved, onSave, onDelete }: { set: StudySet; open: boolean; onToggle: () => void; saved: boolean; onSave: () => void; onDelete?: () => void }) {
  return (
    <View style={[GLASS_CARD, { padding: 14, gap: 10 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable accessibilityRole="button" onPress={onToggle} style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>{set.title}</Text>
          <Text style={{ color: HUB.muted, fontSize: 12 }}>{set.author} · {set.items.length} từ{set.likes ? ` · ${set.likes} lượt thích` : ''}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Bỏ lưu' : 'Lưu bộ'} onPress={onSave}>
          <Icon name="bookmark" size={20} color={saved ? HUB.amber : HUB.muted} />
        </Pressable>
        {onDelete ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Xoá bộ" onPress={onDelete}>
            <Icon name="close" size={18} color={HUB.muted} />
          </Pressable>
        ) : null}
      </View>
      {open ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {set.items.map((w) => (
            <Pressable key={w} accessibilityRole="button" accessibilityLabel={`Nghe ${w}`} onPress={() => speak(w)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}>
              <Text style={{ color: HUB.ink, fontSize: 13 }}>{w}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function CoursesSection() {
  const courses: { title: string; desc: string; icon: IconName; route: string; ready: boolean }[] = [
    { title: 'Luyện nói IELTS Speaking', desc: 'Phòng thi Part 1, 2, 3 có chấm AI.', icon: 'mic', route: '/speaking', ready: true },
    { title: 'Từ vựng IELTS theo unit', desc: '20 unit, mỗi unit một danh sách từ.', icon: 'book', route: '/vocabulary', ready: true },
    { title: 'Ngữ pháp A1 đến C', desc: '24 bài có quy tắc và bài kiểm tra, từ cơ bản tới câu điều kiện đảo và cụm phân từ.', icon: 'book', route: '/hub/tutor/grammar', ready: true },
  ];
  return (
    <View style={{ gap: 10 }}>
      {courses.map((c) => (
        <Pressable key={c.title} accessibilityRole="button" accessibilityLabel={c.title} onPress={() => router.push(c.route as never)} style={[GLASS_CARD, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, opacity: c.ready ? 1 : 0.7 }]}>
          <View style={{ width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.glassStrong }}>
            <Icon name={c.icon} size={20} color={HUB.blue} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>{c.title}</Text>
            <Text style={{ color: HUB.muted, fontSize: 12 }}>{c.desc}</Text>
          </View>
          <Icon name="chevron-right" size={18} color={HUB.muted} />
        </Pressable>
      ))}
    </View>
  );
}

function TopicsSection({ q }: { q: string }) {
  const topics = DAILY_TALK_TOPICS.filter((t) => !q || t.nameVi.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {topics.map((t) => (
        <Pressable key={t.slug} accessibilityRole="button" accessibilityLabel={t.nameVi} onPress={() => router.push(`/vocabulary/topic/${t.slug}` as never)} style={[GLASS_CARD, { width: '48%', minHeight: 96, padding: 12, gap: 6, justifyContent: 'space-between' }]}>
          <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '800' }}>{t.nameVi}</Text>
          <Text style={{ color: HUB.muted, fontSize: 11 }}>{t.words.length} từ · có ví dụ và ngữ cảnh</Text>
        </Pressable>
      ))}
    </View>
  );
}

function RoleplayCard({ id, title, scene, difficulty, minutes }: { id: string; title: string; scene: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD'; minutes: number }) {
  const done = useHubStore((s) => (s.roleplayDone[id] ?? 0) > 0);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => router.push(`/hub/roleplay/${id}` as never)} style={[GLASS_CARD, { padding: 14, gap: 6 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ color: DIFF_COLOR[difficulty], fontSize: 10, fontWeight: '800', borderWidth: 1, borderColor: DIFF_COLOR[difficulty], borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}>{difficulty}</Text>
        <Text style={{ color: HUB.muted, fontSize: 11 }}>{minutes} phút</Text>
        {done ? <Icon name="check" size={14} color={HUB.green} /> : null}
      </View>
      <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>{title}</Text>
      <Text style={{ color: HUB.muted, fontSize: 12 }}>{scene}</Text>
    </Pressable>
  );
}
