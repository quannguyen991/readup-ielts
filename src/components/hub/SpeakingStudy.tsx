import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { HUB_UI, HubChips, HubPanel, HubTag } from '@/components/hub/HubUi';
import { Icon } from '@/components/ui/Icon';
import type { SpeakingExtra } from '@/data/hub/speaking-topics';
import { speak } from '@/services/hub/speak';

type Tab = 'vocab' | 'outline' | 'sample' | 'mistakes';
const TABS: { id: Tab; label: string }[] = [
  { id: 'vocab', label: 'Từ vựng' },
  { id: 'outline', label: 'Dàn ý' },
  { id: 'sample', label: 'Bài mẫu' },
  { id: 'mistakes', label: 'Lỗi hay gặp' },
];

/** "Học trước": từ vựng chủ điểm, dàn ý Part 2, bài mẫu Band 8 và lỗi thường gặp của chủ đề. Đóng sẵn, mở khi cần. */
export function StudyPanel({ extra }: { extra: SpeakingExtra }) {
  const [open, setOpen] = useState(false);
  const has: Record<Tab, boolean> = { vocab: extra.vocab.length > 0, outline: extra.outlineVi.length > 0, sample: Boolean(extra.sample), mistakes: extra.mistakesVi.length > 0 };
  const tabs = TABS.filter((t) => has[t.id]);
  const [tab, setTab] = useState<Tab>(tabs[0]?.id ?? 'vocab');
  if (tabs.length === 0) return null;
  return (
    <HubPanel title="Học trước" icon="book" badge={open ? undefined : extra.vocab.length ? `${extra.vocab.length} cụm` : undefined}>
      <Pressable accessibilityRole="button" onPress={() => setOpen((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: HUB_UI.muted, fontSize: 14, fontWeight: '600', flex: 1 }}>Từ vựng, dàn ý, bài mẫu và lỗi hay gặp</Text>
        <Text style={{ color: HUB_UI.purple, fontSize: 14, fontWeight: '900' }}>{open ? 'Thu gọn' : 'Mở ra'}</Text>
      </Pressable>
      {open ? (
        <>
          <HubChips options={tabs} value={tab} onChange={setTab} />
          {tab === 'vocab' ? (
            <View style={{ gap: 8 }}>
              {extra.vocab.map((v) => (
                <View key={v.en} style={{ gap: 2, padding: 12, borderRadius: 14, backgroundColor: HUB_UI.wash, borderWidth: 1, borderColor: HUB_UI.line }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: HUB_UI.navy, fontSize: 15.5, fontWeight: '900', flex: 1 }}>{v.en}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Nghe ${v.en}`} onPress={() => speak(v.en)}>
                      <Icon name="volume" size={16} color={HUB_UI.purple} />
                    </Pressable>
                  </View>
                  <Text style={{ color: HUB_UI.purple, fontSize: 13.5, fontWeight: '700' }}>{v.vi}</Text>
                  <Text style={{ color: HUB_UI.muted, fontSize: 13.5, lineHeight: 19, fontStyle: 'italic' }}>{v.ex}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {tab === 'outline' ? (
            <View style={{ gap: 8 }}>
              {extra.outlineVi.map((s, i) => (
                <View key={s} style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, backgroundColor: HUB_UI.wash }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: HUB_UI.purple, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>{i + 1}</Text>
                  </View>
                  <Text style={{ color: HUB_UI.navy, fontSize: 14.5, lineHeight: 21, flex: 1 }}>{s}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {tab === 'sample' ? <SampleBlock text={extra.sample} label="Bài mẫu Part 2 · Band 8" /> : null}
          {tab === 'mistakes' ? (
            <View style={{ gap: 8 }}>
              {extra.mistakesVi.map((s) => (
                <View key={s} style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, backgroundColor: '#FFF4EE' }}>
                  <Text style={{ fontSize: 18 }}>⚠️</Text>
                  <Text style={{ color: HUB_UI.navy, fontSize: 14.5, lineHeight: 21, flex: 1 }}>{s}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </HubPanel>
  );
}

function SampleBlock({ text, label }: { text: string; label: string }) {
  const n = text.trim().split(/\s+/).length;
  return (
    <View style={{ gap: 8, padding: 14, borderRadius: 16, backgroundColor: HUB_UI.wash, borderWidth: 1, borderColor: HUB_UI.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <HubTag label={label} />
        <HubTag label={`${n} từ`} color={HUB_UI.muted} bg="#FFFFFF" />
        <Pressable accessibilityRole="button" accessibilityLabel="Nghe bài mẫu" onPress={() => speak(text)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
          <Icon name="volume" size={16} color={HUB_UI.purple} />
          <Text style={{ color: HUB_UI.purple, fontWeight: '900', fontSize: 14 }}>Nghe</Text>
        </Pressable>
      </View>
      <Text style={{ color: HUB_UI.navy, fontSize: 15, lineHeight: 24 }}>{text}</Text>
    </View>
  );
}

/** Đáp án mẫu cho câu đang luyện; ẩn sẵn để người học tự nói trước rồi mới so. */
export function ModelAnswer({ text, label }: { text: string; label: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(false), [text]);
  return (
    <View style={{ gap: 8 }}>
      <Pressable accessibilityRole="button" onPress={() => setShow((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: HUB_UI.line, backgroundColor: '#FFFFFF' }}>
        <Text style={{ fontSize: 20 }}>💡</Text>
        <Text style={{ color: HUB_UI.navy, fontSize: 15, fontWeight: '900', flex: 1 }}>{show ? 'Ẩn đáp án mẫu' : 'Xem đáp án mẫu để so sánh'}</Text>
        <Icon name={show ? 'chevron-down' : 'chevron-right'} size={16} color={HUB_UI.muted} />
      </Pressable>
      {show ? <SampleBlock text={text} label={label} /> : null}
    </View>
  );
}

const PREP_SECONDS = 60;

/** Một phút chuẩn bị cho cue card Part 2: đếm ngược và ô ghi chú, như trong phòng thi thật. */
export function PrepTimer() {
  const [left, setLeft] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = setTimeout(() => setLeft((v) => (v === null ? v : v - 1)), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const running = left !== null && left > 0;
  return (
    <HubPanel title="Một phút chuẩn bị" icon="clock" badge={left === null ? '60s' : left > 0 ? `${left}s` : 'Hết giờ'}>
      <Text style={{ color: HUB_UI.muted, fontSize: 14, lineHeight: 20 }}>Ghi vài từ khoá cho từng gợi ý rồi mới nói. Đề thật cho đúng một phút và một tờ giấy nháp.</Text>
      <TextInput value={notes} onChangeText={setNotes} multiline placeholder="Ghi chú nhanh…" placeholderTextColor="#A59CC4" style={{ minHeight: 84, padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: HUB_UI.line, backgroundColor: HUB_UI.wash, color: HUB_UI.navy, fontSize: 15 }} />
      <Pressable
        accessibilityRole="button"
        onPress={() => setLeft(running ? null : PREP_SECONDS)}
        style={{ height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: running ? '#FFFFFF' : HUB_UI.purple, borderWidth: running ? 1.5 : 0, borderColor: HUB_UI.line }}
      >
        <Text style={{ color: running ? HUB_UI.navy : '#FFFFFF', fontWeight: '900', fontSize: 15 }}>{running ? 'Dừng đồng hồ' : left === 0 ? 'Chuẩn bị lại' : 'Bắt đầu 60 giây'}</Text>
      </Pressable>
    </HubPanel>
  );
}
