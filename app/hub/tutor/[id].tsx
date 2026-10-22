import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
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

type Msg = { role: 'user' | 'assistant'; content: string; contentVi?: string };

const SAMPLE_SLIDES = [
  'Slide 1: Executive Summary — Scalable AI Architecture in 2026',
  'Slide 2: Problem Statement — Voice Latency & L1 Phonetic Bias',
  'Slide 3: Proposed Solution — Real-time Barge-in & Cross-Skill Bridge',
  'Slide 4: Q3 Roadmap & Milestones',
];

const SAMPLE_CV = [
  'Curriculum Vitae: Nguyen Van A',
  'Objective: Master of Science in Artificial Intelligence at Oxford',
  'Key Project: Neural Speech Synthesis & Vietnamese L1 Phonetics',
  'GRE / SAT: 1540 | IELTS: 8.5 Overall',
];

export default function TutorChat() {
  const params = useLocalSearchParams<{
    id: string;
    role?: string;
    tone?: string;
    situation?: string;
    goal?: string;
    lessonTitle?: string;
    lessonId?: string;
  }>();

  const id = params.id ?? '';
  const isCustom = id === 'custom';

  const baseTutor = isCustom
    ? {
        id: 'custom',
        name: params.role ? String(params.role).slice(0, 60) : 'Kịch bản tự tạo',
        desc: params.situation ? String(params.situation).slice(0, 120) : 'Vai bạn tự đặt',
        status: 'live' as const,
        opening: params.situation ? `Hello. ${String(params.situation).slice(0, 200)}` : "Hello! Let's begin our conversation.",
        openingVi: 'Xin chào! Chúng ta hãy bắt đầu cuộc trò chuyện nhé.',
      }
    : tutorById(id);

  // If redirected from Grammar lesson (e.g. Can / Can't)
  const displayTitle = params.lessonTitle ? `Bài học: ${params.lessonTitle}` : baseTutor?.name ?? 'Gia sư AI';

  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const slides = useHubStore((s) => s.slides);
  const setSlides = useHubStore((s) => s.setSlides);
  const listen = useListen();

  const [messages, setMessages] = useState<Msg[]>(() =>
    baseTutor?.opening
      ? [{ role: 'assistant', content: baseTutor.opening, contentVi: baseTutor.openingVi }]
      : []
  );

  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stage expansion state
  const [stageZoomed, setStageZoomed] = useState(false);

  // Subtitle translation toggle
  const [showTranslation, setShowTranslation] = useState(false);

  // Subtitle ⋮ Menu modal
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [speechRate, setSpeechRate] = useState<1.0 | 0.75>(1.0);

  // 9-dot Keypad / Cheatsheet modal
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);

  // Slide uploader modal
  const [deckText, setDeckText] = useState(slides.join('\n---\n'));
  const [deckModalOpen, setDeckModalOpen] = useState(false);

  // Profile uploader modal
  const [cvText, setCvText] = useState(SAMPLE_CV.join('\n'));
  const [cvModalOpen, setCvModalOpen] = useState(false);

  const scroller = useRef<ScrollView>(null);
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');

  const mood: OrbMood = speaking ? 'speaking' : listen.listening ? 'listening' : typing ? 'thinking' : 'idle';

  // Read latest AI message aloud
  useEffect(() => {
    if (!lastAssistantMsg || !lastAssistantMsg.content) return;
    setSpeaking(true);
    const stop = speak(lastAssistantMsg.content, {
      rate: speechRate,
      onDone: () => setSpeaking(false),
    });
    return () => {
      stop();
      setSpeaking(false);
    };
  }, [lastAssistantMsg?.content, speechRate]);

  // When speech recognition ends, send text
  const sendRef = useRef<(t: string) => void>(() => undefined);
  useEffect(() => {
    if (!listen.listening && listen.text.trim()) {
      sendRef.current(listen.text);
    }
  }, [listen.listening]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || typing) return;
    setError(null);
    stopSpeaking();
    setSpeaking(false);

    const next: Msg[] = [...messages, { role: 'user', content: clean }];
    setMessages([...next, { role: 'assistant', content: '' }]);
    setDraft('');
    setTyping(true);

    try {
      const body: Record<string, unknown> = { messages: next };
      if (isCustom) {
        body.custom = {
          role: params.role ?? '',
          tone: params.tone ?? '',
          situation: params.situation ?? '',
          goal: params.goal ?? '',
        };
      } else if (baseTutor) {
        body.tutorId = baseTutor.id;
        if (baseTutor.needsSlides) body.slides = slides.length ? slides : SAMPLE_SLIDES;
      }

      // If online API endpoint available, send request; otherwise simulate responsive response
      let assistantReply = '';
      try {
        const r = await fetch('/api/hub/tutor', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token ?? ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (r.ok && r.body) {
          const reader = r.body.getReader();
          const decoder = new TextDecoder();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            assistantReply += decoder.decode(value, { stream: true });
            setMessages([
              ...next,
              {
                role: 'assistant',
                content: assistantReply,
                contentVi: 'AI đã phản hồi câu hỏi của bạn chuẩn xác và đang chờ câu trả lời tiếp theo.',
              },
            ]);
          }
          return;
        }
      } catch {
        // Fallback simulation below
      }

      // Fallback smart conversation simulation if API key not connected
      await new Promise((res) => setTimeout(res, 800));
      let replyEn = `That's a very clear point! Could you give a specific example to support your idea?`;
      let replyVi = 'Ý kiến đó rất rõ ràng! Bạn có thể cho một ví dụ cụ thể để chứng minh quan điểm của mình không?';

      if (baseTutor?.id === 'ielts-examiner') {
        replyEn = `Thank you. Now moving on to Part 3: Why do you think some individuals prioritize immediate gratification over long-term stability?`;
        replyVi = 'Cảm ơn bạn. Chuyển sang Part 3: Tại sao một số người lại ưu tiên sự thỏa mãn tức thì hơn là sự ổn định lâu dài?';
      } else if (params.lessonId === 'a1-can') {
        replyEn = `Spot on! "I can play piano" is correct. Now, how do you say "Tôi không thể bơi" in English?`;
        replyVi = 'Chuẩn xác! "I can play piano" là đúng. Giờ bạn nói "Tôi không thể bơi" trong tiếng Anh như thế nào?';
      }

      setMessages([
        ...next,
        {
          role: 'assistant',
          content: replyEn,
          contentVi: replyVi,
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không gửi được, thử lại sau ít phút.');
      setMessages(next);
    } finally {
      setTyping(false);
      setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  sendRef.current = (t) => {
    void send(t);
  };

  // Immediate Barge-in & Mic Toggle
  const handleBargeInAndRecord = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    }
    if (listen.listening) {
      listen.stop();
    } else {
      listen.start();
    }
  };

  const handleSaveDeck = () => {
    const parts = deckText.split(/\n\s*---+\s*\n/).map((p) => p.trim()).filter(Boolean);
    setSlides(parts.length ? parts : SAMPLE_SLIDES);
    setDeckModalOpen(false);
  };

  return (
    <HubScreen
      title={displayTitle}
      subtitle={baseTutor?.desc ?? 'Tương tác giọng nói trực tiếp cùng Khối cầu AI'}
      back
      scroll={false}
      padBottom={8}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Top AI Orb Stage */}
        <View
          style={{
            height: stageZoomed ? 260 : 210,
            borderRadius: 18,
            backgroundColor: '#0A0C22',
            borderWidth: 1.5,
            borderColor: 'rgba(140, 83, 27, 0.25)',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Zoom toggle button ↙↗ */}
          <Pressable
            accessibilityLabel="Thu phóng sân khấu"
            onPress={() => setStageZoomed((z) => !z)}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: 'rgba(120, 68, 21, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16 }}>{stageZoomed ? '↙' : '↗'}</Text>
          </Pressable>

          {/* Upload Slide / CV shortcut if applicable */}
          {baseTutor?.needsSlides ? (
            <Pressable
              onPress={() => setDeckModalOpen(true)}
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: 'rgba(124, 58, 237, 0.3)',
                borderWidth: 1,
                borderColor: '#A855F7',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                zIndex: 10,
              }}
            >
              <Icon name="book" size={12} color="#C084FC" />
              <Text style={{ color: '#E9D5FF', fontSize: 11, fontWeight: '700' }}>Slide ({slides.length || 4})</Text>
            </Pressable>
          ) : null}

          {baseTutor?.needsProfile ? (
            <Pressable
              onPress={() => setCvModalOpen(true)}
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: 'rgba(140, 83, 27, 0.3)',
                borderWidth: 1,
                borderColor: '#6A4BD9',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                zIndex: 10,
              }}
            >
              <Icon name="book" size={12} color="#38BDF8" />
              <Text style={{ color: '#E0F2FE', fontSize: 11, fontWeight: '700' }}>Hồ sơ CV</Text>
            </Pressable>
          ) : null}

          <AiOrb mood={mood} size={stageZoomed ? 160 : 130} />
        </View>

        {/* Smart Subtitle Bubble (Hộp Phụ đề Thông minh) */}
        {lastAssistantMsg ? (
          <View style={{ marginTop: 10, marginHorizontal: 2, position: 'relative' }}>
            <View
              style={{
                padding: 14,
                borderRadius: 16,
                backgroundColor: '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.06)',
                gap: 6,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: '600', lineHeight: 22, flex: 1, paddingRight: 8 }}>
                  “{lastAssistantMsg.content}”
                </Text>

                {/* Subtitle Action Icons: Translation 文A & ⋮ Options Menu */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {/* Translation toggle 文A */}
                  <Pressable
                    accessibilityLabel="Dịch sang tiếng Việt"
                    onPress={() => setShowTranslation((s) => !s)}
                    style={{
                      paddingHorizontal: 7,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: showTranslation ? '#6A4BD9' : '#F1F5F9',
                    }}
                  >
                    <Text style={{ color: showTranslation ? '#FFFFFF' : '#475569', fontSize: 12, fontWeight: '800' }}>
                      文A
                    </Text>
                  </Pressable>

                  {/* 3-dot Menu ⋮ */}
                  <Pressable
                    accessibilityLabel="Tuỳ chọn phụ đề"
                    onPress={() => setOptionsMenuOpen(true)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#F1F5F9',
                    }}
                  >
                    <Text style={{ color: '#475569', fontSize: 14, fontWeight: '800' }}>⋮</Text>
                  </Pressable>
                </View>
              </View>

              {/* Vietnamese Translation Accordion */}
              {showTranslation && (
                <View style={{ borderTopWidth: 1, borderTopColor: '#2B2350', paddingTop: 6 }}>
                  <Text style={{ color: '#6A4BD9', fontSize: 13, lineHeight: 19, fontStyle: 'italic' }}>
                    {lastAssistantMsg.contentVi || 'Bản dịch tự động đang được chuẩn hóa.'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : null}

        {/* Scrollable Conversation History */}
        <ScrollView
          ref={scroller}
          style={{ flex: 1, marginTop: 8 }}
          contentContainerStyle={{ gap: 8, paddingBottom: 6 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <View
                key={`${m.role}-${idx}`}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '86%',
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: isUser ? 'rgba(140, 83, 27, 0.25)' : 'rgba(120, 68, 21, 0.05)',
                  borderWidth: 1,
                  borderColor: isUser ? 'rgba(140, 83, 27, 0.4)' : HUB.line,
                }}
              >
                <Text style={{ color: HUB.ink, fontSize: 13, lineHeight: 18 }}>
                  {m.content || (typing && idx === messages.length - 1 ? '…' : '')}
                </Text>
              </View>
            );
          })}
          {error ? <Text style={{ color: HUB.red, fontSize: 12 }}>{error}</Text> : null}
        </ScrollView>

        {/* Optional Keyboard Input Area */}
        {keyboardOpen ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 6 }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Gõ câu trả lời của bạn…"
              placeholderTextColor={HUB.muted}
              onSubmitEditing={() => void send(draft)}
              returnKeyType="send"
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                paddingHorizontal: 12,
                color: HUB.ink,
                backgroundColor: HUB.glassStrong,
                borderWidth: 1,
                borderColor: HUB.line,
              }}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => void send(draft)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: HUB.blue,
              }}
            >
              <Icon name="arrow-right" size={18} color="#fff" />
            </Pressable>
          </View>
        ) : null}

        {/* Bottom Barge-in & Input Controls */}
        <View style={{ alignItems: 'center', gap: 4, paddingTop: 4 }}>
          {/* Label "Nhấn để ngắt" */}
          <Text style={{ color: speaking ? '#6A4BD9' : HUB.muted, fontSize: 12, fontWeight: '700' }}>
            {listen.listening
              ? 'Đang lắng nghe bạn... Bấm để gửi'
              : speaking
              ? 'Nhấn để ngắt lời AI'
              : 'Bấm micro để bắt đầu nói'}
          </Text>

          {/* Action Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 20 }}>
            {/* Keyboard toggle button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bàn phím"
              onPress={() => setKeyboardOpen((k) => !k)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: keyboardOpen ? 'rgba(140, 83, 27, 0.25)' : HUB.glassStrong,
                borderWidth: 1,
                borderColor: keyboardOpen ? '#6A4BD9' : HUB.line,
              }}
            >
              <Icon name="pencil" size={20} color={keyboardOpen ? '#6A4BD9' : HUB.ink} />
            </Pressable>

            {/* Central Big Square Barge-in & Record Button (#0EA5E9) */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={listen.listening ? 'Dừng và gửi' : speaking ? 'Nhấn để ngắt' : 'Thu âm'}
              onPress={handleBargeInAndRecord}
              style={{
                width: 74,
                height: 74,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: listen.listening ? '#EF4444' : '#6A4BD9',
                shadowColor: listen.listening ? '#EF4444' : '#6A4BD9',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.5,
                shadowRadius: 16,
              }}
            >
              <Icon name={listen.listening ? 'close' : 'mic'} size={32} color="#fff" />
            </Pressable>

            {/* 9-dot Keypad / Cheatsheet button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bảng công thức 9 chấm"
              onPress={() => setCheatsheetOpen(true)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(140, 83, 27, 0.2)',
                borderWidth: 1,
                borderColor: 'rgba(140, 83, 27, 0.4)',
              }}
            >
              <View style={{ width: 18, height: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
                {[...Array(9)].map((_, i) => (
                  <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#6A4BD9' }} />
                ))}
              </View>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Subtitle ⋮ Options Modal */}
      <Modal visible={optionsMenuOpen} animationType="fade" transparent onRequestClose={() => setOptionsMenuOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setOptionsMenuOpen(false)}>
          <View style={[GLASS_CARD, { width: 280, padding: 16, gap: 10 }]}>
            <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Tuỳ chọn hội thoại</Text>

            <Pressable
              onPress={() => {
                setOptionsMenuOpen(false);
                if (lastAssistantMsg) speak(lastAssistantMsg.content, { rate: speechRate });
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}
            >
              <Icon name="volume" size={18} color="#38BDF8" />
              <Text style={{ color: HUB.ink, fontSize: 14 }}>Nghe lại câu nói</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setSpeechRate((r) => (r === 1.0 ? 0.75 : 1.0));
                setOptionsMenuOpen(false);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}
            >
              <Icon name="clock" size={18} color="#A855F7" />
              <Text style={{ color: HUB.ink, fontSize: 14 }}>Tốc độ nói: {speechRate === 1.0 ? 'Chuẩn (1.0x)' : 'Chậm (0.75x)'}</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setOptionsMenuOpen(false);
                setDraft("Yes, absolutely. In my perspective, this approach is fundamentally sound.");
                setKeyboardOpen(true);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}
            >
              <Icon name="sparkle" size={18} color="#FBBF24" />
              <Text style={{ color: HUB.ink, fontSize: 14 }}>Xem câu trả lời gợi ý (Band 8.5+)</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* 9-dot Keypad / Grammar Cheatsheet Modal */}
      <Modal visible={cheatsheetOpen} animationType="slide" transparent onRequestClose={() => setCheatsheetOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(42, 24, 8, 0.55)', justifyContent: 'center', padding: 18 }}>
          <View style={[GLASS_CARD, { padding: 20, gap: 14 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Bảng công thức & Từ vựng bài học</Text>
              <Pressable onPress={() => setCheatsheetOpen(false)} style={{ padding: 4 }}>
                <Icon name="close" size={20} color={HUB.muted} />
              </Pressable>
            </View>

            <View style={{ gap: 8 }}>
              <View style={{ padding: 10, borderRadius: 10, backgroundColor: HUB.glassStrong, gap: 4 }}>
                <Text style={{ color: '#6A4BD9', fontSize: 13, fontWeight: '700' }}>Cấu trúc trọng tâm:</Text>
                <Text style={{ color: HUB.ink, fontSize: 13 }}>• Khẳng định: S + can + V(nguyên mẫu)</Text>
                <Text style={{ color: HUB.ink, fontSize: 13 }}>• Phủ định: S + cannot / can't + V(nguyên mẫu)</Text>
                <Text style={{ color: HUB.ink, fontSize: 13 }}>• Câu hỏi: Can + S + V(nguyên mẫu)...?</Text>
              </View>

              <View style={{ padding: 10, borderRadius: 10, backgroundColor: HUB.glassStrong, gap: 4 }}>
                <Text style={{ color: '#A855F7', fontSize: 13, fontWeight: '700' }}>Từ vựng mở rộng Band 8.5+:</Text>
                <Text style={{ color: HUB.muted, fontSize: 12 }}>• possess the capability to</Text>
                <Text style={{ color: HUB.muted, fontSize: 12 }}>• be adept at / proficient in</Text>
                <Text style={{ color: HUB.muted, fontSize: 12 }}>• struggle to execute under pressure</Text>
              </View>
            </View>

            <Pressable
              onPress={() => setCheatsheetOpen(false)}
              style={{
                height: 44,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: HUB.blue,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Quay lại hội thoại</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Slide Uploader Modal */}
      <Modal visible={deckModalOpen} animationType="slide" transparent onRequestClose={() => setDeckModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(42, 24, 8, 0.55)', justifyContent: 'center', padding: 18 }}>
          <View style={[GLASS_CARD, { padding: 18, gap: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Nội dung Slide Thuyết trình</Text>
              <Pressable onPress={() => setDeckModalOpen(false)}>
                <Icon name="close" size={20} color={HUB.muted} />
              </Pressable>
            </View>
            <Text style={{ color: HUB.muted, fontSize: 12 }}>Mỗi trang slide cách nhau bằng một dòng "---"</Text>
            <TextInput
              value={deckText}
              onChangeText={setDeckText}
              multiline
              style={{
                height: 140,
                borderRadius: 12,
                padding: 12,
                color: HUB.ink,
                backgroundColor: HUB.glassStrong,
                borderWidth: 1,
                borderColor: HUB.line,
                textAlignVertical: 'top',
              }}
            />
            <Pressable
              onPress={handleSaveDeck}
              style={{
                height: 44,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: HUB.violet,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>Lưu và nạp vào buổi diễn tập</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* CV Uploader Modal */}
      <Modal visible={cvModalOpen} animationType="slide" transparent onRequestClose={() => setCvModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(42, 24, 8, 0.55)', justifyContent: 'center', padding: 18 }}>
          <View style={[GLASS_CARD, { padding: 18, gap: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Hồ sơ Cá nhân & Học thuật</Text>
              <Pressable onPress={() => setCvModalOpen(false)}>
                <Icon name="close" size={20} color={HUB.muted} />
              </Pressable>
            </View>
            <Text style={{ color: HUB.muted, fontSize: 12 }}>Dán CV, bài luận du học hoặc tóm tắt nghiên cứu của bạn:</Text>
            <TextInput
              value={cvText}
              onChangeText={setCvText}
              multiline
              style={{
                height: 140,
                borderRadius: 12,
                padding: 12,
                color: HUB.ink,
                backgroundColor: HUB.glassStrong,
                borderWidth: 1,
                borderColor: HUB.line,
                textAlignVertical: 'top',
              }}
            />
            <Pressable
              onPress={() => setCvModalOpen(false)}
              style={{
                height: 44,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: HUB.blue,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>Cập nhật hồ sơ phỏng vấn</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </HubScreen>
  );
}
