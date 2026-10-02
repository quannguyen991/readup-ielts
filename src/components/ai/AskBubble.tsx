import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { anim, ensureGameKeyframes, MOVE } from '@/components/game/game-anim';
import { PixelSprite } from '@/components/game/PixelSprite';
import { Icon } from '@/components/ui';
import { MASCOTS } from '@/services/game/mascots';
import { mascotOf, useRewardStore } from '@/store/useRewardStore';
import { color } from '@/theme/tokens';
import { currentLocale, pick, useL } from '@/i18n/useL';
import { formatWordAnswer, isSingleWordQuestion } from '@/services/dictionary/word-answer';
import { lookupOffline, resolveWord } from '@/services/dictionary/word-lookup';
import type { MascotId } from '@/services/game/mascots';

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
 * LINH VẬT THAY BIỂU TƯỢNG: ai đã đổi và đang đeo linh vật (trang Đổi quà) thì
 * chính con linh vật đứng ở góc làm nút trợ lý, nhún nhảy, và khung chat mang
 * tên nó — phần thưởng đổi sao nhìn thấy được mỗi ngày chứ không nằm trong kho.
 */

type Msg = { role: 'user' | 'assistant'; content: string; /** Lỗi AI: hiện nút "Thử lại". */ retry?: boolean };

/** Sau một lần AI hỏng, 15 giây tới không gọi lại — máy chủ có cầu dao riêng, đây là lớp ở máy người học. */
const COOLDOWN_MS = 15_000;
let aiBlockedUntil = 0;

const GREETING =
  'Hỏi mình về ngữ pháp, từ vựng, cách làm từng dạng câu, hay cách dùng app. Mình không xem được tài khoản hay bài viết của bạn.';
const GREETING_EN =
  "Ask me about grammar, vocabulary, how to tackle each question type, or how to use the app. I can't see your account or your writing.";

/** Tên linh vật bản tiếng Anh (dữ liệu gốc ở services/game/mascots giữ tiếng Việt). */
const PET_NAME_EN: Record<MascotId, string> = { owl: 'Wise Owl', fox: 'Clever Fox', cat: 'Lazy Cat', dragon: 'Baby Dragon' };

const FIXED = (Platform.OS === 'web' ? 'fixed' : 'absolute') as 'absolute';

export function AskBubble() {
  const { L, en } = useL();
  const [open, setOpen] = useState(false);
  const petId = mascotOf(useRewardStore((s) => s.mascot));
  const pet = petId ? MASCOTS[petId] : null;
  const petName = pet ? (en ? PET_NAME_EN[pet.id] : pet.name) : '';
  React.useEffect(ensureGameKeyframes, []);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const scroller = useRef<ScrollView>(null);

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
    if (pet) {
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={L(`Hỏi ${petName}`, `Ask ${petName}`)}
          onPress={() => setOpen(true)}
          style={{ position: FIXED, right: 16, bottom: 14, zIndex: 60, alignItems: 'center' }}
        >
          {({ hovered }: { hovered?: boolean }) => (
            <>
              {hovered ? (
                <View className="mb-1 rounded-pill bg-white px-3 py-1" style={{ ...(Platform.OS === 'web' ? ({ boxShadow: '0 6px 18px rgba(15,23,42,0.12)' } as object) : null) }}>
                  <Text className="font-strong text-label text-ink">{L(`Hỏi ${petName}`, `Ask ${petName}`)}</Text>
                </View>
              ) : null}
              <View
                style={{
                  width: 66,
                  height: 66,
                  borderRadius: 33,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFFFFF',
                  borderWidth: 3,
                  borderColor: pet.color,
                  ...(Platform.OS === 'web' ? ({ boxShadow: `0 10px 26px ${pet.color}55` } as object) : null),
                }}
              >
                <View style={anim('rg-bob', 1300, { loop: true, timing: 'ease-in-out' })} {...MOVE}>
                  <PixelSprite name={pet.look} color={pet.color} size={46} />
                </View>
              </View>
            </>
          )}
        </Pressable>
      );
    }
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={L('Mở hỏi nhanh', 'Open quick ask')}
        onPress={() => setOpen(true)}
        style={{
          position: FIXED,
          right: 18,
          bottom: 18,
          zIndex: 60,
          height: 52,
          width: 52,
          borderRadius: 26,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: color.primary,
          ...(Platform.OS === 'web'
            ? ({ boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 10px 28px rgba(15,23,42,0.10)' } as never)
            : {
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.1,
                shadowRadius: 16,
                elevation: 6,
              }),
        }}
      >
        <Icon name="sparkle" size={22} color="#fff" strokeWidth={2} />
      </Pressable>
    );
  }

  return (
    <View
      style={{
        position: FIXED,
        zIndex: 60,
        right: 18,
        bottom: 18,
        width: 340,
        maxWidth: '92%',
        maxHeight: 460,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#fff',
        ...(Platform.OS === 'web'
          ? ({ boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 10px 28px rgba(15,23,42,0.10)' } as never)
          : {
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
              elevation: 8,
            }),
      }}
    >
      <View
        className="flex-row items-center justify-between px-3 py-2.5"
        style={{ backgroundColor: color.primary }}
      >
        <Text className="font-strong text-body text-white">{pet ? L(`Hỏi ${petName}`, `Ask ${petName}`) : L('Hỏi nhanh', 'Quick ask')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={L('Đóng hỏi nhanh', 'Close quick ask')}
          onPress={() => setOpen(false)}
          className="h-7 w-7 items-center justify-center rounded-pill"
        >
          <Icon name="close" size={16} color="#fff" strokeWidth={2.2} />
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
          className="h-10 w-10 items-center justify-center rounded-panel"
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
