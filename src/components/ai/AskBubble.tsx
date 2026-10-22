import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '@/components/ui';
import { useRewardStore } from '@/store/useRewardStore';
import { useAssistantDock } from '@/store/useAssistantDock';
import { currentLocale, pick, useL } from '@/i18n/useL';
import { formatWordAnswer, isSingleWordQuestion } from '@/services/dictionary/word-answer';
import { lookupOffline, resolveWord } from '@/services/dictionary/word-lookup';

/**
 * Trợ lý AI nổi ở góc màn.
 *
 * VÌ SAO NÓ NHỎ VÀ Ở GÓC. Đây không phải chỗ học, nó là chỗ gỡ một chỗ tắc rồi
 * quay lại việc đang làm. Mở thành một màn riêng là bắt người ta rời việc; để nó
 * chiếm nửa màn hình là biến một câu hỏi phụ thành trung tâm.
 *
 * QUẢ CẦU: người học nhận ra trợ lý qua quả cầu ánh cầu vồng đang chuyển động
 * (giống mẫu giao diện AI). Điện thoại: nút chỉ là quả cầu tròn; bấm là mở một tấm
 * trượt từ đáy (bottom sheet) nằm trên thanh tab, dễ với bằng ngón cái.
 *
 * GHIM CỐ ĐỊNH Ở MỌI MÀN, kể cả màn làm bài; chỉ ẩn lúc đang thi (`isExamRoute`).
 */

type Msg = { role: 'user' | 'assistant'; content: string; /** Lỗi AI: hiện nút "Thử lại". */ retry?: boolean };

/** Sau một lần AI hỏng, 15 giây tới không gọi lại — máy chủ có cầu dao riêng, đây là lớp ở máy người học. */
const COOLDOWN_MS = 15_000;
let aiBlockedUntil = 0;

const GREETING =
  'Chào bạn, mình là Leo. Hỏi mình bất kỳ điều gì: từ vựng, ngữ pháp, cách làm từng dạng câu, hay cách dùng app. Mình không xem được tài khoản hay bài viết của bạn.';
const GREETING_EN =
  "Hi, I'm Leo. Ask me anything: vocabulary, grammar, how to tackle each question type, or how to use the app. I can't see your account or your writing.";

const FIXED = (Platform.OS === 'web' ? 'fixed' : 'absolute') as 'absolute';
const PHONE_MAX = 640;

/** Mặt kính trắng, viền lilac nhạt. */
const GLASS = {
  backgroundColor: '#FFFFFF',
  borderColor: '#EEE9FF',
} as const;

/**
 * Quả cầu và hoạt họa (web). Quả cầu: conic cầu vồng xoay chậm, điểm sáng trắng cố định ở
 * trên trái, một vệt sáng quét vòng quanh; cả khối thở nhẹ. Tắt khi người dùng bật "giảm chuyển động".
 */
const CSS_ID = 'readup-askbubble';
const CSS = `
@keyframes ab-pop{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}
@keyframes ab-spin{to{transform:rotate(360deg)}}
@keyframes ab-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.ab-orb-wrap{border-radius:50%;animation:ab-breathe 3.6s ease-in-out infinite}
.ab-orb{position:relative;overflow:hidden;background:conic-gradient(from 0deg,#C4B5FD,#F9A8D4,#93C5FD,#FDE68A,#C4B5FD,#A5B4FC,#C4B5FD);animation:ab-spin 7s linear infinite;box-shadow:inset -3px -5px 9px rgba(76,55,170,.28),0 5px 14px rgba(139,108,240,.34)}
.ab-orb::before{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(circle at 34% 30%,rgba(255,255,255,.95),rgba(255,255,255,0) 36%),radial-gradient(circle at 68% 74%,rgba(255,255,255,.4),rgba(255,255,255,0) 42%)}
.ab-orb::after{content:"";position:absolute;inset:-35%;border-radius:50%;background:conic-gradient(from 200deg,rgba(255,255,255,0) 0deg,rgba(255,255,255,.7) 40deg,rgba(255,255,255,0) 90deg,rgba(255,255,255,0) 360deg);animation:ab-spin 3.2s linear infinite}
@media (prefers-reduced-motion:reduce){[data-ab],.ab-orb,.ab-orb-wrap,.ab-orb::after{animation:none!important}}
`;
function ensureCss() {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById(CSS_ID)) return;
  const el = document.createElement('style');
  el.id = CSS_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

/**
 * Cách đáy `px` pixel, CỘNG phần thanh tab dưới đang chiếm (biến `--bb-h` do
 * `BottomTabs` đặt; 0 ở desktop / màn không có thanh). Trượt mượt khi thanh ẩn/hiện.
 */
function lift(px: number): { bottom: number; transition?: string } {
  if (Platform.OS !== 'web') return { bottom: px };
  return { bottom: `calc(${px}px + var(--bb-h, 0px))` as unknown as number, transition: 'bottom 200ms ease' } as never;
}

/** Quả cầu trợ lý: trên web là CSS chuyển động; trên máy khác là gradient tĩnh có điểm sáng. */
function AiOrb({ size = 32 }: { size?: number }) {
  if (Platform.OS !== 'web') {
    return (
      <LinearGradient
        colors={['#F5F2FF', '#C4B5FD', '#F9A8D4', '#93C5FD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View className="ab-orb-wrap" style={{ width: size, height: size }}>
      <View className="ab-orb" style={{ width: size, height: size, borderRadius: size / 2 }} />
    </View>
  );
}

/** Ảnh đại diện: trợ lý là quả cầu, người học là chấm navy có chữ "Bạn". */
function Avatar({ who, size = 32 }: { who: 'ai' | 'me'; size?: number }) {
  if (who === 'ai') return <AiOrb size={size} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#2B2350', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: size * 0.36, fontWeight: '700' }}>Bạn</Text>
    </View>
  );
}

const SUGGESTIONS = [
  { vi: 'Mẹo làm bài Reading', en: 'Reading tips' },
  { vi: 'Từ vựng hôm nay', en: "Today's vocabulary" },
  { vi: 'Giải thích một điểm ngữ pháp', en: 'Explain a grammar point' },
];

function HeaderBtn({ icon, label, onPress }: { icon: Parameters<typeof Icon>[0]['name']; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ hovered }: { hovered?: boolean }) => ({ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? '#F5F2FF' : 'transparent' })}
    >
      <Icon name={icon} size={18} color="#7A72A0" strokeWidth={2} />
    </Pressable>
  );
}

export function AskBubble({ forceChiikawa = false, allowDock = false }: { /** Trang chủ chỉ có Chiikawa: đổi tên gọi mà không đổi theme. */ forceChiikawa?: boolean; /** Cho phép cột cố định bên phải ở màn rộng (không dùng ở màn thi, thành phố, hub). */ allowDock?: boolean } = {}) {
  const { L, en } = useL();
  const storeChiikawa = useRewardStore((s) => s.theme === 'theme-chiikawa');
  const chiikawaTheme = forceChiikawa || storeChiikawa;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const scroller = useRef<ScrollView>(null);
  const storedMode = useAssistantDock((st) => st.mode);
  const setMode = useAssistantDock((st) => st.setMode);
  const { width: winW } = useWindowDimensions();
  const phone = winW < PHONE_MAX;
  // Cột bên phải chỉ có khi được phép và màn đủ rộng; ngược lại `full` tự thu về viên thuốc.
  const fullDock = allowDock && winW >= 1280;
  const mode = storedMode === 'full' && !fullDock ? 'min' : storedMode;

  useEffect(ensureCss, []);

  const ask = useCallback(async (next: Msg[]) => {
    const last = next[next.length - 1]!.content;
    const word = isSingleWordQuestion(last);
    const en = currentLocale() === 'en';
    const busyMsg = pick(currentLocale(), 'AI đang bận, thử lại sau ít phút.', 'The AI is busy. Try again in a few minutes.');
    setBusy(true);

    // Từ đã có trong máy: trả lời ngay, khỏi tốn lượt AI.
    const local = word ? await lookupOffline(word) : null;
    if (local) {
      setMessages([...next, { role: 'assistant', content: formatWordAnswer(local, en) }]);
      setBusy(false);
      return;
    }

    /*
      Chỗ giữ câu trả lời đang chảy về được thêm NGAY, rồi ghi đè dần.

      Đợi xong mới thêm thì người hỏi nhìn vào một khoảng trống vài giây và không
      biết máy có nhận câu hỏi không — mà không biết thì họ bấm gửi lần nữa.
    */
    setMessages([...next, { role: 'assistant', content: '' }]);

    const fail = async () => {
      // AI hỏng: một từ lẻ vẫn tra được bằng từ điển; còn lại báo bận, chi tiết chỉ ở console.
      const r = word ? await resolveWord(word, '').catch(() => null) : null;
      setMessages([...next, r ? { role: 'assistant', content: formatWordAnswer(r, en) } : { role: 'assistant', content: busyMsg, retry: true }]);
    };

    try {
      if (Date.now() < aiBlockedUntil) throw new Error('cooldown');
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });

      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${detail.slice(0, 80)}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...next, { role: 'assistant', content: acc }]);
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      if (detail !== 'cooldown') {
        aiBlockedUntil = Date.now() + COOLDOWN_MS;
        console.warn('[ask] AI không trả lời được:', detail);
      }
      await fail();
    } finally {
      setBusy(false);
    }
  }, []);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setDraft('');
    await ask(next);
  }, [ask, busy, draft, messages]);

  const retry = useCallback(() => {
    if (busy) return;
    // Bỏ câu "đang bận" và hỏi lại đúng câu trước đó.
    const base = messages.filter((m) => !m.retry);
    setMessages(base);
    void ask(base);
  }, [ask, busy, messages]);

  const sendText = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busy) return;
      const next: Msg[] = [...messages, { role: 'user', content: text }];
      setMessages(next);
      setDraft('');
      await ask(next);
    },
    [ask, busy, messages],
  );

  const launchLabel = chiikawaTheme ? L('Hỏi Chiikawa', 'Ask Chiikawa') : L('Hỏi AI', 'Ask AI');

  if (mode === 'min') {
    // Điện thoại: chỉ quả cầu tròn ở góc, không chữ, để không che nội dung. Máy tính: viên thuốc có nhãn.
    if (phone) {
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={launchLabel}
          onPress={() => setMode('pop')}
          style={({ pressed }: { pressed: boolean }) =>
            ({
              position: FIXED,
              right: 16,
              ...lift(16),
              zIndex: 60,
              width: 60,
              height: 60,
              borderRadius: 30,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              ...GLASS,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.94 : 1 }],
              ...(Platform.OS === 'web' ? ({ boxShadow: '0 8px 22px rgba(106,75,217,0.22)', transition: 'transform 160ms ease, opacity 160ms ease' } as object) : { shadowColor: '#6A4BD9', shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 }),
            }) as never
          }
        >
          <AiOrb size={42} />
        </Pressable>
      );
    }
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={launchLabel}
        onPress={() => setMode('pop')}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) =>
          ({
            position: FIXED,
            right: 12,
            ...lift(12),
            zIndex: 60,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            height: 50,
            paddingLeft: 10,
            paddingRight: 20,
            borderRadius: 999,
            ...GLASS,
            borderWidth: 1,
            opacity: pressed ? 0.9 : 1,
            boxShadow: hovered ? '0 12px 28px rgba(106,75,217,0.22)' : '0 8px 22px rgba(106,75,217,0.16)',
            transition: 'box-shadow 200ms ease, bottom 200ms ease',
          }) as never
        }
      >
        <AiOrb size={32} />
        <Text style={{ color: '#2B2350', fontSize: 14, fontWeight: '700' }}>{launchLabel}</Text>
      </Pressable>
    );
  }

  // Khung chat: cột cố định (full), tấm trượt từ đáy (điện thoại) hoặc cửa sổ nổi (máy tính).
  const last = messages[messages.length - 1];
  const thinking = busy && (!last || last.role === 'user' || !last.content);
  const isFull = mode === 'full';
  const webAnim = Platform.OS === 'web' ? ({ animation: 'ab-pop 300ms cubic-bezier(.16,1,.3,1)' } as object) : {};
  const panelStyle = isFull
    ? { position: FIXED, right: 0, top: 0, bottom: 0, width: 340, zIndex: 40, ...GLASS, borderLeftWidth: 1, ...webAnim }
    : phone
      ? {
          position: FIXED,
          left: 10,
          right: 10,
          ...lift(12),
          zIndex: 60,
          height: Platform.OS === 'web' ? ('min(620px, calc(100dvh - 130px))' as unknown as number) : 560,
          borderRadius: 26,
          overflow: 'hidden',
          ...GLASS,
          borderWidth: 1,
          ...webAnim,
          ...(Platform.OS === 'web'
            ? ({ boxShadow: '0 -10px 40px rgba(43,35,80,0.14)' } as object)
            : { shadowColor: '#2B2350', shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: -8 }, elevation: 12 }),
        }
      : {
          position: FIXED,
          right: 12,
          ...lift(12),
          zIndex: 60,
          width: 380,
          maxWidth: '92%',
          height: Platform.OS === 'web' ? ('min(600px, calc(100dvh - 120px))' as unknown as number) : 600,
          borderRadius: 26,
          overflow: 'hidden',
          ...GLASS,
          borderWidth: 1,
          ...webAnim,
          ...(Platform.OS === 'web'
            ? ({ boxShadow: '0 18px 46px rgba(43,35,80,0.16)' } as object)
            : { shadowColor: '#2B2350', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 10 }),
        };
  const headerBtns = (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {!isFull && fullDock ? <HeaderBtn icon="chevron-left" label={L('Mở rộng', 'Expand')} onPress={() => setMode('full')} /> : null}
      {isFull ? <HeaderBtn icon="chevron-up" label={L('Cửa sổ nổi', 'Pop out')} onPress={() => setMode('pop')} /> : null}
      <HeaderBtn icon="close" label={L('Thu nhỏ', 'Minimize')} onPress={() => setMode('min')} />
    </View>
  );
  return (
    <View style={panelStyle as never} {...(Platform.OS === 'web' ? ({ dataSet: { ab: '1' } } as object) : {})}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 16, paddingRight: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1EEFB' }}>
        <Avatar who="ai" size={40} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#2B2350', letterSpacing: -0.2 }}>{L('Trợ lý AI', 'AI assistant')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#16A34A' }} />
            <Text style={{ fontSize: 12, color: '#7A72A0' }}>{L('Đang trực tuyến', 'Online')}</Text>
          </View>
        </View>
        {headerBtns}
      </View>

      <ScrollView
        ref={scroller}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 14 }}
        onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
              <Avatar who="ai" />
              <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEE9FF', borderRadius: 18, borderBottomLeftRadius: 6, paddingHorizontal: 14, paddingVertical: 12 }}>
                <Text style={{ fontSize: 14, lineHeight: 21, color: '#2B2350' }}>{L(GREETING, GREETING_EN)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 42 }}>
              {SUGGESTIONS.map((sg) => (
                <Pressable
                  key={sg.vi}
                  accessibilityRole="button"
                  onPress={() => void sendText(L(sg.vi, sg.en))}
                  style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => ({
                    paddingHorizontal: 13,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(106, 75, 217,0.28)',
                    backgroundColor: pressed || hovered ? '#F1ECFF' : '#FFFFFF',
                  })}
                >
                  <Text style={{ fontSize: 13, color: '#6A4BD9', fontWeight: '600' }}>{L(sg.vi, sg.en)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          messages.map((m, i) => {
            const mine = m.role === 'user';
            return (
              <View key={i} style={{ flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 10 }}>
                {mine ? null : <Avatar who="ai" />}
                <View style={{ maxWidth: '80%', gap: 6 }}>
                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 18,
                      borderBottomRightRadius: mine ? 6 : 18,
                      borderBottomLeftRadius: mine ? 18 : 6,
                      backgroundColor: mine ? '#6A4BD9' : '#FFFFFF',
                      borderWidth: mine ? 0 : 1,
                      borderColor: '#EEE9FF',
                    }}
                  >
                    <Text style={{ fontSize: 14, lineHeight: 21, color: mine ? '#FFFFFF' : '#2B2350' }}>{m.content || ''}</Text>
                  </View>
                  {m.retry && i === messages.length - 1 ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={busy}
                      onPress={retry}
                      style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(106, 75, 217,0.28)' }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#6A4BD9' }}>{L('Thử lại', 'Try again')}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })
        )}

        {thinking ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <Avatar who="ai" />
            <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 18, borderBottomLeftRadius: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEE9FF' }}>
              {[0.35, 0.6, 0.9].map((o, k) => (
                <View key={k} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#8B6CF0', opacity: o }} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 10, paddingBottom: phone ? 14 : 12, borderTopWidth: 1, borderTopColor: '#F1EEFB' }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={L('Nhập câu hỏi…', 'Type a question…')}
          placeholderTextColor="#A59CC4"
          returnKeyType="send"
          enterKeyHint="send"
          autoCapitalize="sentences"
          blurOnSubmit={false}
          onSubmitEditing={() => void send()}
          style={{
            flex: 1,
            height: 44,
            paddingHorizontal: 18,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: '#E6E1F3',
            backgroundColor: '#F5F2FF',
            fontSize: 15,
            color: '#2B2350',
            ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as Record<string, unknown>) : {}),
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={L('Gửi câu hỏi', 'Send question')}
          disabled={busy || draft.trim() === ''}
          onPress={() => void send()}
          style={({ pressed }: { pressed: boolean }) => ({ opacity: busy || draft.trim() === '' ? 0.45 : 1, transform: [{ scale: pressed ? 0.92 : 1 }] })}
        >
          <LinearGradient colors={['#8B6CF0', '#6A4BD9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
            {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Icon name="arrow-up" size={18} color="#FFFFFF" strokeWidth={2.4} />}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
