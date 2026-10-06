import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { T } from '@/components/travel/ui/kit';
import type { Beat, BeatInput } from '@/data/study-abroad-stage';
import { startRecorder, transcriptOf, type Recorder } from '@/services/speaking/recognizer';
import { useL } from '@/i18n/useL';

/**
 * Bảng hành động ở đáy cảnh: mỗi kiểu lượt một cách tương tác khác nhau —
 * chọn câu (choice/listen), đưa đồ vật (give), xếp từ (arrange), điền từ (type), nói vào micro (speak).
 */
const CREAM = 'rgba(251,247,236,0.96)';

export function BeatPanel({ beat, disabled, onSubmit, onReplay }: { beat: Beat; disabled: boolean; onSubmit: (input: BeatInput) => void; onReplay: () => void }) {
  const { L, locale } = useL();
  const prompt = locale === 'en' ? beat.prompt.en : beat.prompt.vi;
  const hint = locale === 'en' ? beat.hint.en : beat.hint.vi;
  return (
    <View style={{ gap: 8 }}>
      <Text className="font-semi" style={{ color: '#EEF2FA', fontSize: 14, lineHeight: 20, textShadowColor: '#000', textShadowRadius: 3 } as object}>{prompt}</Text>
      {beat.kind === 'listen' ? (
        <Pressable accessibilityRole="button" onPress={onReplay} style={{ alignSelf: 'flex-start', minHeight: 40, paddingHorizontal: 12, borderRadius: 999, backgroundColor: CREAM, justifyContent: 'center', borderWidth: 2, borderColor: T.navy }}>
          <Text className="font-heavy" style={{ color: T.ink, fontSize: 13 }}>🎧 {L('Nghe lại', 'Play again')}</Text>
        </Pressable>
      ) : null}
      {beat.kind === 'choice' || beat.kind === 'listen' ? <ChoiceList options={beat.options} disabled={disabled} onPick={(i) => onSubmit(i)} /> : null}
      {beat.kind === 'give' ? <GiveGrid beat={beat} disabled={disabled} onPick={(i) => onSubmit(i)} /> : null}
      {beat.kind === 'arrange' ? <ArrangeBoard beat={beat} disabled={disabled} onSubmit={onSubmit} /> : null}
      {beat.kind === 'type' ? <TypeFill beat={beat} disabled={disabled} onSubmit={onSubmit} /> : null}
      {beat.kind === 'speak' ? <SpeakBox beat={beat} disabled={disabled} onSubmit={onSubmit} /> : null}
      <Text className="font-sans" style={{ color: '#C9D1E0', fontSize: 12 }}>{hint}</Text>
    </View>
  );
}

export function ChoiceList({ options, disabled, onPick }: { options: readonly string[]; disabled: boolean; onPick: (i: number) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const { H } = useBox();
  return (
    <ScrollView style={{ maxHeight: Math.max(160, H * 0.4) }} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
      {options.map((option, index) => {
        const chosen = picked === index;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            disabled={disabled || picked !== null}
            onPress={() => {
              setPicked(index);
              onPick(index);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, borderWidth: 2, borderColor: chosen ? T.gold : T.navy, backgroundColor: chosen ? '#F7EDDA' : CREAM }}
          >
            <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: T.navy }}>
              <Text className="font-heavy" style={{ color: '#FFFFFF', fontSize: 12 }}>{String.fromCharCode(65 + index)}</Text>
            </View>
            <Text className="min-w-0 flex-1 font-semi" style={{ color: T.ink, fontSize: 15, lineHeight: 21 }}>{option}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function GiveGrid({ beat, disabled, onPick }: { beat: Extract<Beat, { kind: 'give' }>; disabled: boolean; onPick: (i: number) => void }) {
  const { locale } = useL();
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {beat.items.map((item, i) => (
        <Pressable
          key={item.label.en}
          accessibilityRole="button"
          accessibilityLabel={item.label.en}
          disabled={disabled || picked !== null}
          onPress={() => {
            setPicked(i);
            onPick(i);
          }}
          style={{ flexGrow: 1, flexBasis: '22%', minWidth: 120, minHeight: 84, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 10, borderWidth: 2, borderColor: picked === i ? T.gold : T.navy, backgroundColor: picked === i ? '#F7EDDA' : CREAM }}
        >
          <Text style={{ fontSize: 34 }}>{item.icon}</Text>
          <Text className="font-semi" style={{ color: T.ink, fontSize: 13, textAlign: 'center' }}>{locale === 'en' ? item.label.en : item.label.vi}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Xáo trộn có hạt giống (ổn định giữa các lần dựng lại). */
function shuffled<T2>(list: readonly T2[], seed: number): T2[] {
  const a = [...list];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i -= 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function ArrangeBoard({ beat, disabled, onSubmit }: { beat: Extract<Beat, { kind: 'arrange' }>; disabled: boolean; onSubmit: (input: BeatInput) => void }) {
  const { L } = useL();
  const words = useMemo(() => beat.target.split(' '), [beat.target]);
  const chips = useMemo(() => {
    const seed = beat.target.length * 31 + words.length;
    const list = [...words, ...(beat.extra ?? [])];
    const out = shuffled(list, seed);
    // Không để thứ tự xáo trùng đúng câu mẫu.
    return out.join(' ') === words.join(' ') ? out.reverse() : out;
  }, [beat.target, beat.extra, words]);
  const [used, setUsed] = useState<number[]>([]);
  const sentence = used.map((i) => chips[i]!);
  return (
    <View style={{ gap: 8 }}>
      <View style={{ minHeight: 52, flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 8, borderRadius: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: '#E6D9B5', backgroundColor: 'rgba(7,11,24,0.45)' }}>
        {used.length === 0 ? <Text className="font-sans" style={{ color: '#C9D1E0', fontSize: 13 }}>{L('Chạm các từ bên dưới để ghép câu…', 'Tap the words below to build the sentence…')}</Text> : null}
        {used.map((chipIndex, pos) => (
          <Pressable key={`${chipIndex}-${pos}`} accessibilityRole="button" disabled={disabled} onPress={() => setUsed((u) => u.filter((_, p) => p !== pos))} style={{ minHeight: 38, paddingHorizontal: 11, borderRadius: 8, backgroundColor: '#F7EDDA', borderWidth: 2, borderColor: T.gold, justifyContent: 'center' }}>
            <Text className="font-heavy" style={{ color: T.ink, fontSize: 15 }}>{chips[chipIndex]}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {chips.map((chip, i) => {
          const taken = used.includes(i);
          return (
            <Pressable key={`${chip}-${i}`} accessibilityRole="button" disabled={disabled || taken} onPress={() => setUsed((u) => [...u, i])} style={{ minHeight: 40, paddingHorizontal: 12, borderRadius: 8, backgroundColor: CREAM, borderWidth: 2, borderColor: T.navy, justifyContent: 'center', opacity: taken ? 0.3 : 1 }}>
              <Text className="font-semi" style={{ color: T.ink, fontSize: 15 }}>{chip}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <PanelButton label={L('Xoá hết', 'Clear')} onPress={() => setUsed([])} disabled={disabled || used.length === 0} />
        <PanelButton gold label={L('Kiểm tra', 'Check')} onPress={() => onSubmit(sentence)} disabled={disabled || used.length === 0} />
      </View>
    </View>
  );
}

function TypeFill({ beat, disabled, onSubmit }: { beat: Extract<Beat, { kind: 'type' }>; disabled: boolean; onSubmit: (input: BeatInput) => void }) {
  const { L } = useL();
  const [text, setText] = useState('');
  return (
    <View style={{ gap: 8 }}>
      <View style={{ padding: 11, borderRadius: 8, backgroundColor: 'rgba(7,11,24,0.55)' }}>
        <Text className="font-semi" style={{ color: '#FFFFFF', fontSize: 17, lineHeight: 26 }}>
          {beat.before}
          <Text style={{ color: '#FFD34D' }}>{text.trim() ? ` ${text.trim()} ` : ' ______ '}</Text>
          {beat.after}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={() => text.trim() && onSubmit(text)}
          placeholder={L('Gõ từ còn thiếu…', 'Type the missing word…')}
          placeholderTextColor="#89867F"
          accessibilityLabel={L('Từ còn thiếu', 'Missing word')}
          style={{ flex: 1, minHeight: 48, borderWidth: 2, borderColor: T.navy, borderRadius: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 12, fontSize: 16, color: T.ink }}
        />
        <PanelButton gold label={L('Kiểm tra', 'Check')} onPress={() => onSubmit(text)} disabled={disabled || !text.trim()} />
      </View>
    </View>
  );
}

function SpeakBox({ beat, disabled, onSubmit }: { beat: Extract<Beat, { kind: 'speak' }>; disabled: boolean; onSubmit: (input: BeatInput) => void }) {
  const { L } = useL();
  const [heard, setHeard] = useState('');
  const [listening, setListening] = useState(false);
  const [typing, setTyping] = useState(Platform.OS !== 'web');
  const [note, setNote] = useState('');
  const rec = useRef<Recorder | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      rec.current?.stop();
    };
  }, []);
  const toggle = () => {
    if (listening) {
      rec.current?.stop();
      rec.current = null;
      setListening(false);
      return;
    }
    setNote('');
    const r = startRecorder({
      onUpdate: (s) => alive.current && setHeard(transcriptOf(s)),
      onEnd: (reason, s) => {
        rec.current = null;
        if (!alive.current) return;
        setListening(false);
        const text = transcriptOf(s);
        setHeard(text);
        if (reason === 'denied') setNote(L('Bạn chưa cấp quyền micro — hãy gõ câu thay.', 'Microphone blocked — type the sentence instead.'));
        else if (text.trim() && reason === 'stopped') onSubmit(text);
      },
    });
    if (!r) {
      setTyping(true);
      setNote(L('Trình duyệt này chưa hỗ trợ nhận giọng nói — hãy gõ câu thay.', 'Voice input is unavailable — type the sentence instead.'));
      return;
    }
    rec.current = r;
    setListening(true);
  };
  return (
    <View style={{ gap: 8 }}>
      <View style={{ padding: 11, borderRadius: 8, backgroundColor: 'rgba(7,11,24,0.55)', gap: 4 }}>
        <Text className="font-sans" style={{ color: '#C9D1E0', fontSize: 12 }}>{L('Câu cần nói', 'Say this sentence')}</Text>
        <Text className="font-heavy" style={{ color: '#FFD34D', fontSize: 18, lineHeight: 25 }}>{beat.target}</Text>
        {heard ? <Text className="font-sans" style={{ color: '#E6EBF5', fontSize: 14 }}>{L('Máy nghe được: ', 'Heard: ')}“{heard}”</Text> : null}
      </View>
      {note ? <Text accessibilityLiveRegion="polite" className="font-sans" style={{ color: '#FFD0C7', fontSize: 13 }}>{note}</Text> : null}
      {typing ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput value={heard} onChangeText={setHeard} editable={!disabled} autoCapitalize="none" placeholder={L('Gõ câu…', 'Type the sentence…')} placeholderTextColor="#89867F" onSubmitEditing={() => heard.trim() && onSubmit(heard)} style={{ flex: 1, minHeight: 48, borderWidth: 2, borderColor: T.navy, borderRadius: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 12, fontSize: 16, color: T.ink }} />
          <PanelButton gold label={L('Gửi', 'Send')} onPress={() => onSubmit(heard)} disabled={disabled || !heard.trim()} />
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {Platform.OS === 'web' ? <PanelButton gold label={listening ? L('■ Dừng và gửi', '■ Stop and send') : L('🎤 Bấm để nói', '🎤 Tap to speak')} onPress={toggle} disabled={disabled} /> : null}
        {Platform.OS === 'web' ? <PanelButton label={typing ? L('Ẩn ô gõ', 'Hide typing') : L('Gõ thay vì nói', 'Type instead')} onPress={() => setTyping((v) => !v)} disabled={disabled || listening} /> : null}
      </View>
    </View>
  );
}

export function PanelButton({ label, onPress, gold = false, disabled = false }: { label: string; onPress: () => void; gold?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{ minHeight: 46, minWidth: 46, paddingHorizontal: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: gold ? '#7A5F28' : T.navy, backgroundColor: gold ? T.gold : CREAM, opacity: disabled ? 0.5 : 1 }}
    >
      <Text className="font-heavy" style={{ color: gold ? '#1C1405' : T.ink, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

function useBox() {
  const [H, setH] = useState(typeof window !== 'undefined' ? window.innerHeight : 720);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const on = () => setH(window.innerHeight);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return { H };
}
