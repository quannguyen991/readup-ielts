import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { speak } from '@/components/vocab/study/StudyKit';
import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import { bi, useL } from '@/i18n/useL';
import { getPoiContent } from '@/data/travel/pois';
import { CITIES } from '@/services/travel/world';
import { startRecorder, transcriptOf, type Recorder, type RecorderSnapshot } from '@/services/speaking/recognizer';
import { playSfx } from '@/services/audio/sfx-ui';
import { useAuthStore } from '@/store/useAuthStore';
import type { TravelConversationContext, TravelConversationTurn } from '@/services/travel/conversation';

type Message =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; translation: string; correction?: string };

type Props = {
  context: TravelConversationContext;
  embedded?: boolean;
  onClose?: () => void;
};

type ChatReply = { replyEn?: unknown; replyVi?: unknown; correction?: unknown; error?: unknown };

export function TravelConversation({ context, embedded = false, onClose }: Props) {
  const { L, locale } = useL();
  const win = useWindowDimensions();
  const accessToken = useAuthStore((s) => s.session?.access_token ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [micError, setMicError] = useState('');
  const scroll = useRef<ScrollView>(null);
  const recorder = useRef<Recorder | null>(null);
  const alive = useRef(false);
  const city = CITIES[context.cityId];
  const close = useCallback(() => {
    playSfx('modalClose');
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    alive.current = true;
    if (!embedded) playSfx('modalOpen');
    return () => {
      alive.current = false;
      recorder.current?.stop();
      recorder.current = null;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timer);
  }, [messages, sending]);

  const send = useCallback(async (raw = draft) => {
    const text = raw.trim().slice(0, 1200);
    if (!text || sending) return;
    if (!accessToken) {
      setError(L('Hãy đăng nhập để bắt đầu hội thoại với AI.', 'Sign in to start an AI conversation.'));
      return;
    }
    const next: Message[] = [...messages, { role: 'user' as const, content: text }].slice(-12);
    const history: TravelConversationTurn[] = next.map((message) => ({
      role: message.role,
      content: message.content,
    }));
    setMessages(next);
    setDraft('');
    setSending(true);
    setError('');
    setMicError('');
    playSfx('npc');
    try {
      const response = await fetch('/api/travel/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          cityId: context.cityId,
          poiId: context.poiId,
          npcId: context.npcId,
          persona: context.persona,
          history,
        }),
      });
      const data = await response.json() as ChatReply;
      if (!response.ok || typeof data.replyEn !== 'string' || typeof data.replyVi !== 'string') {
        throw new Error(typeof data.error === 'string' ? data.error : L('AI chưa thể trả lời lúc này.', 'The AI is unable to reply right now.'));
      }
      if (!alive.current) return;
      const reply: Message = {
        role: 'assistant',
        content: data.replyEn,
        translation: data.replyVi,
        correction: typeof data.correction === 'string' ? data.correction : undefined,
      };
      setMessages((current) => [...current, reply].slice(-12));
      speak(data.replyEn, { rate: 0.92 });
      playSfx(messages.length === 0 ? 'greet' : 'next');
    } catch (cause) {
      if (!alive.current) return;
      setError(cause instanceof Error ? cause.message : L('Kết nối hội thoại bị gián đoạn. Hãy thử lại.', 'The conversation was interrupted. Please try again.'));
    } finally {
      if (alive.current) setSending(false);
    }
  }, [accessToken, context, draft, L, messages, sending]);

  const toggleMic = useCallback(() => {
    if (listening) {
      recorder.current?.stop();
      recorder.current = null;
      setListening(false);
      return;
    }
    setMicError('');
    const nextRecorder = startRecorder({
      onUpdate: (snapshot: RecorderSnapshot) => {
        if (alive.current) setDraft(transcriptOf(snapshot));
      },
      onEnd: (reason, snapshot) => {
        recorder.current = null;
        if (!alive.current) return;
        setListening(false);
        setDraft(transcriptOf(snapshot));
        if (reason === 'denied') setMicError(L('Bạn chưa cấp quyền dùng micro. Bạn vẫn có thể gõ câu hỏi.', 'Microphone access was denied. You can still type your message.'));
        else if (reason === 'error') setMicError(L('Không nhận được giọng nói. Bạn có thể gõ câu hỏi.', 'Speech recognition stopped. You can type your message instead.'));
      },
    });
    if (!nextRecorder) {
      setMicError(L('Trình duyệt này chưa hỗ trợ nhập bằng giọng nói. Hãy gõ câu của bạn.', 'Voice input is unavailable in this browser. Type your message instead.'));
      return;
    }
    recorder.current = nextRecorder;
    setListening(true);
  }, [L, listening]);

  const place = context.poiId ? getPoiContent(context.poiId) : undefined;
  const staffStarters = place ? {
    airport: [L('Tôi nên đến cổng bay trước giờ khởi hành bao lâu?', 'How early should I get to my gate?'), L('Tôi có thể tìm quầy làm thủ tục ở đâu?', 'Where can I find the check-in desks?')],
    station: [L('Lối cầu thang này có xuống sân ga không?', 'Do these stairs go down to the platform?'), L('Tôi cần chú ý điều gì khi lên tàu?', 'What should I know before boarding?')],
    hotel: [L('Tôi có thể gửi hành lý trước giờ nhận phòng không?', 'Can I leave my bags before check-in?'), L('Bạn gợi ý chỗ ăn tối gần đây không?', 'Could you recommend somewhere nearby for dinner?')],
    cafe: [L('Món nào được khách gọi nhiều nhất?', 'Which drink do people order most often?'), L('Bạn có lựa chọn nào ít ngọt không?', 'Do you have anything that is not too sweet?')],
    restaurant: [L('Món nào thể hiện rõ nhất ẩm thực địa phương?', 'Which dish best represents the local food?'), L('Món này thường ăn kèm với gì?', 'What is this dish usually served with?')],
    market: [L('Món này được làm ở địa phương phải không?', 'Is this made locally?'), L('Bạn chỉ tôi cách chọn loại này được không?', 'Could you show me how to choose a good one?')],
    museum: [L('Tôi nên bắt đầu xem từ khu nào?', 'Where would you suggest I start?'), L('Hiện vật này có câu chuyện gì?', 'What is the story behind this exhibit?')],
    garden: [L('Có lối đi nào yên tĩnh và nhiều bóng mát không?', 'Is there a quiet, shaded path here?'), L('Khu vườn này đẹp nhất vào thời điểm nào?', 'When does this garden look its best?')],
    landmark: [L('Công trình này được xây dựng để làm gì?', 'What was this landmark built for?'), L('Tôi có thể ngắm nơi này từ đâu?', 'Where is a good place to view it?')],
    secret: [L('Người địa phương thường thích điều gì ở chỗ này?', 'What do locals enjoy about this place?'), L('Có góc nào ít người biết mà tôi nên xem không?', 'Is there a quieter corner I should look for?')],
    counter: [L('Tôi cần chuẩn bị gì trước khi đến quầy?', 'What should I have ready before I reach the counter?'), L('Bạn có thể hướng dẫn tôi từng bước không?', 'Could you walk me through the steps?')],
  }[place.kind] : null;
  const suggestions = staffStarters ?? (context.persona === 'staff'
    ? [L('Bạn có thể giúp tôi tìm đường không?', 'Could you help me find my way?'), L('Bạn gợi ý điều gì ở đây?', 'What do you recommend here?')]
    : context.persona === 'traveller'
      ? [L('Bạn đã đi đâu trong chuyến này rồi?', 'Where have you travelled on this trip?'), L('Điều gì ở thành phố này làm bạn bất ngờ?', 'What has surprised you about this city?')]
      : context.cityId === 'singapore'
        ? [L('Bạn thường làm gì sau giờ làm?', 'What do you usually do after work?'), L('Bạn có quán ăn địa phương nào thích không?', 'Do you have a favourite local place to eat?')]
        : [L('Bạn sống ở đây lâu chưa?', 'Have you lived here long?'), L('Bạn thích điều gì nhất ở thành phố này?', 'What do you like most about this city?')]);

  const body = (
    <PixelPanel tone={embedded ? 'paper' : 'navy'} inner={{ padding: embedded ? 12 : 16, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 38, height: 38, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: embedded ? 'rgba(183,139,57,0.15)' : 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: T.gold }}>
          <Text style={{ fontSize: 18 }}>✦</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text className="font-heavy" numberOfLines={1} style={{ fontSize: 15, color: embedded ? T.goldDark : T.goldLight }}>{bi(context.displayName, locale)}</Text>
          <Text className="font-sans" numberOfLines={1} style={{ fontSize: 12, color: embedded ? T.muted : '#BBC3D1' }}>{bi(city.name, locale)} · {L('Trò chuyện tự do bằng tiếng Anh', 'Open English conversation')}</Text>
        </View>
        {!embedded && onClose ? <Pressable accessibilityRole="button" accessibilityLabel={L('Đóng hội thoại', 'Close conversation')} onPress={close} style={{ minWidth: 42, minHeight: 42, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 25, color: embedded ? T.ink : '#FFFFFF' }}>×</Text></Pressable> : null}
      </View>
      <Text className="font-sans" style={{ fontSize: 13, lineHeight: 18, color: embedded ? T.muted : '#D7DDE7' }}>
        {L('Bạn tự đặt câu hỏi hoặc kể điều mình muốn. Nhân vật sẽ trả lời theo cuộc trò chuyện, bằng tiếng Anh kèm nghĩa tiếng Việt.', 'Ask your own questions or share what you like. The character responds to the conversation in English with a Vietnamese translation.')}
      </Text>

      <ScrollView
        ref={scroll}
        style={{ maxHeight: embedded ? 265 : Math.min(390, Math.max(170, win.height * 0.42)), minHeight: 118, borderRadius: 8, backgroundColor: embedded ? '#F4F0E6' : 'rgba(7,11,24,0.34)' }}
        contentContainerStyle={{ padding: 10, gap: 9, flexGrow: 1, justifyContent: messages.length ? 'flex-start' : 'flex-end' }}
        keyboardShouldPersistTaps="handled"
      >
        {!messages.length ? (
          <View style={{ gap: 8, alignItems: 'flex-start' }}>
            <Text className="font-sans" style={{ color: embedded ? T.muted : '#D7DDE7', fontSize: 13, lineHeight: 18 }}>{L('Bắt đầu tự nhiên bằng một câu hỏi:', 'Start naturally with a question:')}</Text>
            {suggestions.map((suggestion) => (
              <Pressable key={suggestion} accessibilityRole="button" onPress={() => void send(suggestion)} disabled={sending} style={{ maxWidth: '94%', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: embedded ? T.line : 'rgba(255,255,255,0.25)', backgroundColor: embedded ? '#FFFFFF' : 'rgba(255,255,255,0.08)' }}>
                <Text className="font-sans" style={{ color: embedded ? T.ink : '#FFFFFF', fontSize: 13, lineHeight: 18 }}>{suggestion}</Text>
              </Pressable>
            ))}
          </View>
        ) : messages.map((message, index) => (
          <View key={`${message.role}-${index}`} style={{ alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '94%', padding: 10, borderRadius: 9, backgroundColor: message.role === 'user' ? T.navy : '#FFFFFF', borderWidth: 1, borderColor: message.role === 'user' ? T.navy : T.line, gap: 5 }}>
            <Text className="font-semi" style={{ fontSize: 14, lineHeight: 20, color: message.role === 'user' ? '#FFFFFF' : T.ink }}>{message.content}</Text>
            {message.role === 'assistant' ? <>
              {locale === 'vi' ? <Text className="font-sans" style={{ fontSize: 13, lineHeight: 18, color: T.muted }}>{message.translation}</Text> : null}
              {message.correction ? <Text className="font-sans" style={{ paddingTop: 4, borderTopWidth: 1, borderColor: T.line, fontSize: 12, lineHeight: 17, color: T.goldDark }}>{L('Gợi ý cách nói: ', 'A natural way to say it: ')}{message.correction}</Text> : null}
              <Pressable accessibilityRole="button" accessibilityLabel={L('Nghe câu trả lời', 'Hear the reply')} onPress={() => speak(message.content, { rate: 0.92 })} style={{ alignSelf: 'flex-start', minHeight: 30, justifyContent: 'center' }}>
                <Text className="font-strong" style={{ color: T.goldDark, fontSize: 12 }}>🔊 {L('Nghe lại', 'Listen')}</Text>
              </Pressable>
            </> : null}
          </View>
        ))}
        {sending ? <Text className="font-sans" style={{ color: embedded ? T.muted : '#D7DDE7', fontSize: 13 }}>{L('Đang lắng nghe và nghĩ câu trả lời…', 'Listening and thinking…')}</Text> : null}
      </ScrollView>

      {error ? <View style={{ gap: 6 }}>
        <Text accessibilityLiveRegion="polite" className="font-sans" style={{ color: embedded ? '#9E3932' : '#FFB7AA', fontSize: 13, lineHeight: 18 }}>{error}</Text>
        {!accessToken ? <GameButton tone="paper" label={L('Đăng nhập', 'Sign in')} onPress={() => router.push('/auth/sign-in' as never)} /> : null}
      </View> : null}
      {micError ? <Text accessibilityLiveRegion="polite" className="font-sans" style={{ color: embedded ? T.muted : '#D7DDE7', fontSize: 12, lineHeight: 17 }}>{micError}</Text> : null}
      <View style={{ gap: 8 }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          editable={!sending}
          multiline
          maxLength={1200}
          onSubmitEditing={() => void send()}
          placeholder={L('Gõ câu hỏi hoặc câu trả lời của bạn bằng tiếng Anh…', 'Type your question or reply in English…')}
          placeholderTextColor="#89867F"
          accessibilityLabel={L('Tin nhắn cho nhân vật AI', 'Message the AI character')}
          style={{ minHeight: 64, maxHeight: 115, borderWidth: 1.5, borderColor: T.line, borderRadius: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 11, paddingVertical: 9, fontSize: 14, lineHeight: 20, color: T.ink, textAlignVertical: 'top' }}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Platform.OS === 'web' ? <GameButton tone="paper" label={listening ? L('Dừng micro', 'Stop mic') : L('Nói câu của bạn', 'Speak your message')} onPress={toggleMic} disabled={sending} /> : null}
          <GameButton label={sending ? L('Đang trả lời…', 'Replying…') : L('Gửi và tiếp tục trò chuyện', 'Send and continue')} onPress={() => void send()} disabled={sending || listening || !draft.trim()} />
        </View>
      </View>
      <Text className="font-sans" style={{ color: embedded ? T.muted : '#BBC3D1', fontSize: 11, lineHeight: 16 }}>
        {L('Câu trả lời được tạo theo vai trò và địa điểm. AI không có thông tin trực tiếp về giờ mở cửa, giá hay tình trạng dịch vụ.', 'Replies follow the character and setting. The AI does not have live opening hours, prices, or service status.')}
      </Text>
    </PixelPanel>
  );

  if (embedded) return body;
  return (
    <View pointerEvents="auto" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: 'rgba(7,11,24,0.56)', justifyContent: 'center', alignItems: 'center', padding: 8 }}>
      {Platform.OS === 'web' ? <EscapeToClose onClose={close} /> : null}
      <View style={{ width: Math.min(680, Math.max(0, win.width - 16)), maxHeight: Math.min(win.height - 16, 760) }}>{body}</View>
    </View>
  );
}

function EscapeToClose({ onClose }: { onClose?: () => void }) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
  return null;
}
