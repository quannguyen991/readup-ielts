import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui';
import { color } from '@/theme/tokens';
import { useRewardStore } from '@/store/useRewardStore';
import { CHIIKAWA_IMG } from '@/components/chiikawa/chiikawa';
import { LionMascot } from '@/components/mascot/LionMascot';
import { currentLocale, pick, useL } from '@/i18n/useL';
import { formatWordAnswer, isSingleWordQuestion } from '@/services/dictionary/word-answer';
import { lookupOffline, resolveWord } from '@/services/dictionary/word-lookup';

/**
 * Bong bóng hỏi nhanh, nổi ở góc màn.
 *
 * VÌ SAO NÓ NHỎ VÀ Ở GÓC. Đây không phải chỗ học, nó là chỗ gỡ một chỗ tắc rồi
 * quay lại việc đang làm. Mở thành một màn riêng là bắt người ta rời việc; để nó
 * chiếm nửa màn hình là biến một câu hỏi phụ thành trung tâm.
 *
 * GHIM CỐ ĐỊNH Ở MỌI MÀN, kể cả màn làm bài (người dùng yêu cầu 27/09/2026 —
 * màn chép chính tả trống trơn góc phải); chỉ ẩn lúc đang thi (`isExamRoute`).
 * `position: fixed` trên web để cuộn trang nó vẫn đứng yên ở góc.
 *
 * MASCOT CHIKAWA: mascot luôn nhận diện được ở góc màn hình; bong bóng vẫn giữ
 * hành vi hỏi nhanh để người học không phải rời trang đang làm.
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

/** Chuyển động của bong bóng: Chiikawa lơ lửng, khung chat trượt lên. Tắt khi người dùng bật "giảm chuyển động". */
const CSS_ID = 'readup-askbubble';
const CSS = `
@keyframes ab-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes ab-pop{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){[data-ab]{animation:none!important}}
`;
function ensureCss() {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById(CSS_ID)) return;
  const el = document.createElement('style');
  el.id = CSS_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}
/** Chiikawa vẫy tay — cùng ảnh với các chỗ Chiikawa khác trong app. */
const CHIIKAWA = CHIIKAWA_IMG.wave;

/**
 * Cách đáy `px` pixel, CỘNG phần thanh tab dưới đang chiếm (biến `--bb-h` do
 * `BottomTabs` đặt; 0 ở desktop / màn không có thanh). Trượt mượt khi thanh ẩn/hiện.
 */
function lift(px: number): { bottom: number; transition?: string } {
  if (Platform.OS !== 'web') return { bottom: px };
  return { bottom: `calc(${px}px + var(--bb-h, 0px))` as unknown as number, transition: 'bottom 200ms ease' } as never;
}

export function AskBubble({ forceChiikawa = false }: { /** Trang chủ chỉ có Chiikawa: dùng Chiikawa thay Leo mà không đổi theme. */ forceChiikawa?: boolean } = {}) {
  const { L, en } = useL();
  const storeChiikawa = useRewardStore((s) => s.theme === 'theme-chiikawa');
  const chiikawaTheme = forceChiikawa || storeChiikawa;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const scroller = useRef<ScrollView>(null);

  useEffect(ensureCss, []);

  const ask = useCallback(async (next: Msg[]) => {
    const last = next[next.length - 1]!.content;
    const word = isSingleWordQuestion(last);
    const en = currentLocale() === 'en';
    const busyMsg = pick(currentLocale(), 'AI đang bận, thử lại sau ít phút.', 'The AI is busy. Try again in a few minutes.');
    setBusy(true);

    // Từ đã có trong máy: trả lời ngay, khỏi tốn lượt AI.
    const local = word ? lookupOffline(word) : null;
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

  if (!open) {
    // Linh vật sư tử là nút hỏi: bấm vào là mở khung hỏi. Không còn nút tròn riêng.
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={chiikawaTheme ? L('Hỏi Chiikawa', 'Ask Chiikawa') : L('Hỏi Leo, trợ lý AI', 'Ask Leo, the AI helper')}
        onPress={() => setOpen(true)}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) =>
          ({
            position: FIXED,
            right: 6,
            ...lift(2),
            zIndex: 60,
            width: 100,
            height: 100,
            alignItems: 'center',
            justifyContent: 'center',
            // Rê vào nhô lên, bấm xuống: chuyển động nối tiếp, không giật.
            transform: [{ scale: pressed ? 0.94 : hovered ? 1.06 : 1 }],
            transition: 'transform 220ms cubic-bezier(.2,.8,.2,1), bottom 200ms ease',
          }) as never
        }
      >
        <View
          {...({ dataSet: { ab: '1' } } as object)}
          pointerEvents="none"
          style={Platform.OS === 'web' ? ({ animation: 'ab-float 3.2s ease-in-out infinite' } as object) : undefined}
        >
          {forceChiikawa ? <Image source={CHIIKAWA} resizeMode="contain" style={{ width: 92, height: 92 }} accessibilityIgnoresInvertColors /> : <LionMascot pose="wave" size={92} />}
        </View>
        {chiikawaTheme ? null : (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', top: 6, right: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: '#B94A70' }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.4 }}>AI</Text>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <View
      style={{
        position: FIXED,
        zIndex: 60,
        right: 14,
        ...lift(6),
        ...(Platform.OS === 'web' ? ({ animation: 'ab-pop 260ms cubic-bezier(.2,.8,.2,1)', transformOrigin: 'bottom right' } as object) : null),
        width: 340,
        maxWidth: '92%',
        maxHeight: Platform.OS === 'web' ? ('min(460px, calc(100dvh - 96px))' as unknown as number) : 460,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#fff',
        ...(Platform.OS === 'web'
          ? ({ boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 10px 28px rgba(15,23,42,0.10)' } as never)
          : {
              shadowColor: chiikawaTheme ? '#49364B' : '#0F172A',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
              elevation: 8,
            }),
      }}
    >
      <View
        className="flex-row items-center justify-between py-0.5 pl-3 pr-1"
        style={{ backgroundColor: chiikawaTheme ? '#C65A78' : color.primary }}
      >
        <View className="flex-row items-center gap-2">
          {chiikawaTheme ? <Image source={CHIIKAWA} resizeMode="contain" style={{ width: 40, height: 40 }} accessibilityIgnoresInvertColors /> : <LionMascot pose="wave" size={38} />}
          <Text className="font-strong text-body text-white">{chiikawaTheme ? L('Hỏi Chiikawa', 'Ask Chiikawa') : L('Leo · Trợ lý AI', 'Leo · AI helper')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={L('Đóng hỏi nhanh', 'Close quick ask')}
          onPress={() => setOpen(false)}
          className="h-11 w-11 items-center justify-center rounded-pill"
        >
          <Icon name="close" size={18} color="#fff" strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView
        ref={scroller}
        className="px-3 py-3"
        style={{ maxHeight: 300 }}
        onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <Text className="font-sans text-label text-muted">{L(GREETING, GREETING_EN)}</Text>
        ) : (
          messages.map((m, i) => (
            <View
              key={i}
              className={[
                'mb-2 rounded-panel px-3 py-2',
                m.role === 'user' ? 'self-end bg-primary-50' : 'bg-surface-muted',
              ].join(' ')}
              style={{ maxWidth: '92%' }}
            >
              <Text className="font-sans text-body text-ink">
                {m.content || (busy ? '…' : '')}
              </Text>
              {m.retry && i === messages.length - 1 ? (
                <Pressable accessibilityRole="button" disabled={busy} onPress={retry} className="mt-1.5 self-start rounded-pill bg-white px-3 py-1">
                  <Text className="font-strong text-label text-primary-700">{L('Thử lại', 'Try again')}</Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>

      <View className="flex-row items-end gap-2 border-t border-border px-3 py-2.5">
        {/*
          Ô MỘT DÒNG, KHÔNG PHẢI Ô NHIỀU DÒNG.

          Bản đầu để `multiline` rồi bắt Enter trong `onKeyPress`. Đo trên web thì
          nó không gửi: với ô nhiều dòng, react-native-web không bắn `onKeyPress`
          cho phím Enter — Enter là xuống dòng, và ô nuốt luôn.

          Ô một dòng thì `onSubmitEditing` chạy đúng trên cả web lẫn máy, và ở
          một bong bóng hỏi nhanh thì gõ nhiều dòng vốn không phải việc thường —
          đổi một tiện ích hiếm dùng lấy một phím Enter chạy thật là đáng.
        */}
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={L('Hỏi một câu…', 'Ask a question…')}
          returnKeyType="send"
          enterKeyHint="send"
          autoCapitalize="sentences"
          blurOnSubmit={false}
          onSubmitEditing={() => void send()}
          className="flex-1 rounded-panel border border-border px-3 py-2 font-sans text-body text-ink"
          style={Platform.OS === 'web' ? ({ outlineStyle: 'none' } as never) : undefined}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={L('Gửi câu hỏi', 'Send question')}
          disabled={busy || draft.trim() === ''}
          onPress={() => void send()}
          className="h-11 w-11 items-center justify-center rounded-panel"
          style={{ backgroundColor: busy || draft.trim() === '' ? color.border : color.primary }}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="chevron-right" size={18} color="#fff" strokeWidth={2.2} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
