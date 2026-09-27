import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { anim, ensureGameKeyframes, MOVE } from '@/components/game/game-anim';
import { PixelSprite } from '@/components/game/PixelSprite';
import { Icon } from '@/components/ui';
import { MASCOTS } from '@/services/game/mascots';
import { mascotOf, useRewardStore } from '@/store/useRewardStore';
import { color } from '@/theme/tokens';

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

type Msg = { role: 'user' | 'assistant'; content: string };

const GREETING =
  'Hỏi mình về ngữ pháp, từ vựng, cách làm từng dạng câu, hay cách dùng app. Mình không xem được tài khoản hay bài viết của bạn.';

const FIXED = (Platform.OS === 'web' ? 'fixed' : 'absolute') as 'absolute';

export function AskBubble() {
  const [open, setOpen] = useState(false);
  const petId = mascotOf(useRewardStore((s) => s.mascot));
  const pet = petId ? MASCOTS[petId] : null;
  React.useEffect(ensureGameKeyframes, []);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const scroller = useRef<ScrollView>(null);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || busy) return;

    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setDraft('');
    setBusy(true);

    /*
      Chỗ giữ câu trả lời đang chảy về được thêm NGAY, rồi ghi đè dần.

      Đợi xong mới thêm thì người hỏi nhìn vào một khoảng trống vài giây và không
      biết máy có nhận câu hỏi không — mà không biết thì họ bấm gửi lần nữa.
    */
    setMessages([...next, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => '');
        throw new Error(detail || `Máy chủ trả ${res.status}`);
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
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      // Nói ra lỗi thật thay vì nuốt: người hỏi cần biết nên thử lại hay nên thôi.
      setMessages([...next, { role: 'assistant', content: `Chưa trả lời được — ${message}` }]);
    } finally {
      setBusy(false);
    }
  }, [busy, draft, messages]);

  if (!open) {
    if (pet) {
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Hỏi ${pet.name}`}
          onPress={() => setOpen(true)}
          style={{ position: FIXED, right: 16, bottom: 14, zIndex: 60, alignItems: 'center' }}
        >
          {({ hovered }: { hovered?: boolean }) => (
            <>
              {hovered ? (
                <View className="mb-1 rounded-pill bg-white px-3 py-1" style={{ ...(Platform.OS === 'web' ? ({ boxShadow: '0 6px 18px rgba(15,23,42,0.12)' } as object) : null) }}>
                  <Text className="font-strong text-label text-ink">Hỏi {pet.name}</Text>
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
        accessibilityLabel="Mở hỏi nhanh"
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
        <Text className="font-strong text-body text-white">{pet ? `Hỏi ${pet.name}` : 'Hỏi nhanh'}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng hỏi nhanh"
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
          <Text className="font-sans text-label text-muted">{GREETING}</Text>
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
          placeholder="Hỏi một câu…"
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={() => void send()}
          className="flex-1 rounded-panel border border-border px-3 py-2 font-sans text-body text-ink"
          style={Platform.OS === 'web' ? ({ outlineStyle: 'none' } as never) : undefined}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Gửi câu hỏi"
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
