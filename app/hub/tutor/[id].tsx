import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { AiOrb, type OrbMood } from '@/components/hub/AiOrb';
import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { useListen } from '@/components/hub/useListen';
import { Icon } from '@/components/ui/Icon';
import { speak, stopSpeaking } from '@/services/hub/speak';
import { tutorById, type Tutor } from '@/services/hub/tutors';
import { useAuthStore } from '@/store/useAuthStore';
import { useHubStore } from '@/store/useHubStore';

type Msg = { role: 'user' | 'assistant'; content: string };

/**
 * Phòng trò chuyện với gia sư AI. Có ba kiểu: gia sư có sẵn (theo id), vai tự tạo
 * (id `custom`, nhận nhân vật/giọng/tình huống/mục tiêu từ màn tạo), và thuyết trình
 * (gia sư cần nội dung slide trước khi bắt đầu).
 */
export default function TutorChat() {
  const params = useLocalSearchParams<{ id: string; role?: string; tone?: string; situation?: string; goal?: string }>();
  const id = params.id ?? '';
  const isCustom = id === 'custom';
  const tutor: Tutor | undefined = isCustom
    ? {
        id: 'custom',
        name: params.role ? String(params.role).slice(0, 60) : 'Vai tự tạo',
        desc: params.situation ? String(params.situation).slice(0, 120) : 'Vai bạn tự đặt',
        status: 'live',
        opening: params.situation ? `Hello. ${String(params.situation).slice(0, 200)}` : 'Hello. Let\'s begin.',
      }
    : tutorById(id);
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const slides = useHubStore((s) => s.slides);
  const setSlides = useHubStore((s) => s.setSlides);
  const listen = useListen();
  const [messages, setMessages] = useState<Msg[]>(() => (tutor?.opening ? [{ role: 'assistant', content: tutor.opening }] : []));
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deckText, setDeckText] = useState(slides.join('\n---\n'));
  const scroller = useRef<ScrollView>(null);

  const last = messages[messages.length - 1];
  const mood: OrbMood = speaking ? 'speaking' : listen.listening ? 'listening' : typing ? 'thinking' : 'idle';

  // Đọc lời gia sư mới nhất bằng giọng trình duyệt.
  useEffect(() => {
    if (!last || last.role !== 'assistant' || !last.content) return;
    setSpeaking(true);
    const stop = speak(last.content, { onDone: () => setSpeaking(false) });
    return () => {
      stop();
      setSpeaking(false);
    };
  }, [last?.content, last?.role]);

  // Micro vừa dừng hẳn thì gửi câu vừa nói. Dùng ref để gọi phiên bản `send` mới nhất.
  const sendRef = useRef<(t: string) => void>(() => undefined);
  useEffect(() => {
    if (!listen.listening && listen.text.trim()) sendRef.current(listen.text);
  }, [listen.listening]);

  if (!tutor || tutor.status !== 'live') {
    return (
      <HubScreen title="Gia sư chưa sẵn sàng" back>
        <Text style={{ color: HUB.body }}>Gia sư này đang được soạn, sẽ có sớm.</Text>
      </HubScreen>
    );
  }

  const needsDeck = tutor.id === 'presentation' && slides.length === 0;

  const saveDeck = () => {
    const parts = deckText.split(/\n\s*---+\s*\n/).map((p) => p.trim()).filter(Boolean);
    setSlides(parts);
  };

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || typing) return;
    setError(null);
    stopSpeaking();
    const next: Msg[] = [...messages, { role: 'user', content: clean }];
    setMessages([...next, { role: 'assistant', content: '' }]);
    setDraft('');
    setTyping(true);
    try {
      const body: Record<string, unknown> = { messages: next };
      if (isCustom) body.custom = { role: params.role ?? '', tone: params.tone ?? '', situation: params.situation ?? '', goal: params.goal ?? '' };
      else {
        body.tutorId = tutor.id;
        if (tutor.needsSlides) body.slides = slides;
      }
      const r = await fetch('/api/hub/tutor', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token ?? ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok || !r.body) {
        const detail = (await r.json().catch(() => null)) as { error?: string } | null;
        throw new Error(detail?.error ?? 'AI đang bận, thử lại sau ít phút.');
      }
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...next, { role: 'assistant', content: acc }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không gửi được, thử lại sau.');
      setMessages(next);
    } finally {
      setTyping(false);
      setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  // Micro: bấm để ngắt lời gia sư và nói; bấm lần nữa để gửi.
  const toggleMic = () => {
    if (listen.listening) {
      listen.stop();
      return;
    }
    stopSpeaking();
    setSpeaking(false);
    listen.start();
  };

  sendRef.current = (t) => {
    void send(t);
  };

  if (needsDeck) {
    return (
      <HubScreen title={tutor.name} subtitle="Dán nội dung từng slide, cách nhau bằng một dòng ---" back>
        <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
          <TextInput
            value={deckText}
            onChangeText={setDeckText}
            multiline
            placeholder={'Slide 1: Mục tiêu quý này\n---\nSlide 2: Doanh thu tăng 12%'}
            placeholderTextColor={HUB.muted}
            style={{ minHeight: 220, borderRadius: 12, padding: 12, color: HUB.ink, backgroundColor: HUB.glassStrong, textAlignVertical: 'top' }}
          />
          <Pressable accessibilityRole="button" onPress={saveDeck} style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Lưu và bắt đầu diễn tập</Text>
          </Pressable>
        </View>
      </HubScreen>
    );
  }

  return (
    <HubScreen title={tutor.name} subtitle={tutor.desc} back scroll={false} padBottom={16}>
      {!token ? (
        <View style={[GLASS_CARD, { padding: 16, gap: 12 }]}>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>Đăng nhập để trò chuyện</Text>
          <Text style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>Gia sư dùng lượt AI của tài khoản, nên cần đăng nhập trước.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/auth' as never)} style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Đăng nhập</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <AiOrb mood={mood} size={150} />
          </View>

          <ScrollView ref={scroller} style={{ flex: 1 }} contentContainerStyle={{ gap: 10, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
            {messages.map((m, idx) => (
              <View key={`${m.role}-${idx}`} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', padding: 12, borderRadius: 14, backgroundColor: m.role === 'user' ? 'rgba(14,165,233,0.22)' : HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}>
                <Text style={{ color: HUB.ink, fontSize: 15, lineHeight: 22 }}>{m.content || (typing && idx === messages.length - 1 ? '…' : '')}</Text>
              </View>
            ))}
            {error ? <Text style={{ color: HUB.red, fontSize: 13 }}>{error}</Text> : null}
          </ScrollView>

          {keyboard ? (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingTop: 8 }}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Gõ câu trả lời của bạn…"
                placeholderTextColor={HUB.muted}
                onSubmitEditing={() => void send(draft)}
                returnKeyType="send"
                style={{ flex: 1, height: 46, borderRadius: 12, paddingHorizontal: 12, color: HUB.ink, backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}
              />
              <Pressable accessibilityRole="button" accessibilityLabel="Gửi" onPress={() => void send(draft)} style={{ width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue }}>
                <Icon name="arrow-right" size={18} color="#fff" />
              </Pressable>
            </View>
          ) : null}

          <View style={{ alignItems: 'center', gap: 8, paddingTop: 10 }}>
            <Text style={{ color: HUB.muted, fontSize: 12 }}>{listen.listening ? 'Đang nghe… bấm lần nữa để gửi' : speaking ? 'Gia sư đang nói' : 'Bấm micro để nói'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Pressable accessibilityRole="button" accessibilityLabel="Gõ bằng bàn phím" onPress={() => setKeyboard((k) => !k)} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.glassStrong }}>
                <Icon name="pencil" size={18} color={HUB.ink} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={listen.listening ? 'Dừng và gửi' : speaking ? 'Nhấn để ngắt' : 'Nói'}
                disabled={!listen.supported || typing}
                onPress={speaking && !listen.listening ? () => { stopSpeaking(); setSpeaking(false); } : toggleMic}
                style={{ width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: listen.listening ? HUB.red : HUB.blue, opacity: !listen.supported ? 0.5 : 1 }}
              >
                <Icon name={listen.listening ? 'close' : 'mic'} size={26} color="#fff" strokeWidth={2.2} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Nghe lại lời gia sư" onPress={() => last?.role === 'assistant' && speak(last.content)} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.glassStrong }}>
                <Icon name="volume" size={18} color={HUB.ink} />
              </Pressable>
            </View>
            {speaking && !listen.listening ? <Text style={{ color: HUB.body, fontSize: 12 }}>Nhấn micro để ngắt lời và nói</Text> : null}
            {!listen.supported ? <Text style={{ color: HUB.amber, fontSize: 12, textAlign: 'center' }}>Micro cần Chrome trên máy tính hoặc Android. Có thể gõ bằng bàn phím.</Text> : null}
          </View>
        </KeyboardAvoidingView>
      )}
    </HubScreen>
  );
}
