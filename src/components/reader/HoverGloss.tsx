import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';

import { lookupWord } from '@/services/dictionary/lookup';
import { paper } from '@/theme/tokens';

/**
 * Rê chuột vào một từ là hiện nghĩa ngay trên đầu từ đó.
 *
 * VÌ SAO RÊ CHỨ KHÔNG BẤM. Bấm là một quyết định: người đọc phải dừng lại, thấy
 * mình "không biết từ này", rồi mới bấm. Vì phải quyết định nên phần lớn người
 * đọc bỏ qua và đoán tiếp — đúng thói quen làm họ mãi không lên từ vựng. Rê
 * chuột thì không tốn quyết định nào, nên nghĩa tới đúng lúc mắt còn dừng ở từ.
 *
 * HAI NGUỒN NGHĨA, ƯU TIÊN NGUỒN CÓ SẴN. Bài song ngữ đã soạn sẵn nghĩa cho
 * những từ đáng chú ý; những từ ấy hiện TỨC THÌ và không tốn một lời gọi mạng
 * nào. Từ ngoài danh sách mới đi tra, và tra xong thì nhớ lại — rê qua lần hai
 * là hiện ngay.
 *
 * ĐỘ TRỄ 180ms TRƯỚC KHI TRA. Đọc một dòng là chuột quét qua mười mấy từ; tra
 * ngay lập tức nghĩa là mười mấy lời gọi cho một dòng, và cái hiện ra sẽ là
 * nghĩa của từ mà mắt đã rời khỏi. Chờ một nhịp ngắn thì chỉ từ nào người đọc
 * thật sự dừng lại mới được tra.
 *
 * TRÊN MÁY CẢM ỨNG KHÔNG CÓ CHUỘT. Ở đó `onPress` làm cùng việc — chạm vào từ
 * là hiện, chạm ra ngoài là tắt.
 */

export type InlineGloss = { word: string; meaningVi: string; pos?: string | null };

/** Nhớ nghĩa đã tra trong suốt phiên. Khoá là từ đã thường hoá. */
const CACHE = new Map<string, InlineGloss | null>();

const HOVER_DELAY_MS = 180;

function normalise(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9'-]/g, '');
}

/** Cắt câu thành từ + phần dấu câu bám theo, giữ nguyên khoảng trắng. */
export function tokenise(text: string): { text: string; word: string | null }[] {
  const parts = text.split(/(\s+)/);
  return parts.map((part) => {
    if (part.trim() === '') return { text: part, word: null };
    const core = normalise(part);
    return { text: part, word: core.length > 1 ? core : null };
  });
}

export function HoverGlossText({
  text,
  bundled,
  fontFamily,
  fontSize,
  lineHeight,
  color,
}: {
  text: string;
  /** Nghĩa soạn sẵn của bài, tra theo từ đã thường hoá. */
  bundled?: Record<string, InlineGloss>;
  fontFamily?: string;
  fontSize: number;
  lineHeight: number;
  color: string;
}) {
  /*
    Khoá theo VỊ TRÍ của token, không theo chính từ đó.

    Khoá theo từ thì một đoạn có ba chữ "city" sẽ sáng cả ba và mọc ra ba bong
    bóng cùng lúc — đo ra ngay lần chạy đầu. Người đọc chỉ trỏ vào một chỗ, nên
    chỉ một chỗ được phản hồi.
  */
  const [active, setActive] = useState<number | null>(null);
  const [gloss, setGloss] = useState<InlineGloss | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tokens = useMemo(() => tokenise(text), [text]);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const open = useCallback(
    (at: number, word: string) => {
      clearTimer();
      setActive(at);

      const ready = bundled?.[word] ?? CACHE.get(word);
      if (ready !== undefined) {
        setGloss(ready);
        setBusy(false);
        return;
      }

      setGloss(null);
      setBusy(true);
      timer.current = setTimeout(() => {
        void lookupWord(word, text)
          .then((r) => {
            const found: InlineGloss | null = r.definitionVi
              ? { word, meaningVi: r.definitionVi, pos: r.partOfSpeech }
              : null;
            CACHE.set(word, found);
            // Người đọc đã rê sang từ khác trong lúc chờ — đừng ghi đè lên từ mới.
            setActive((cur) => {
              if (cur === at) {
                setGloss(found);
                setBusy(false);
              }
              return cur;
            });
          })
          .catch(() => {
            CACHE.set(word, null);
            setActive((cur) => {
              if (cur === at) {
                setGloss(null);
                setBusy(false);
              }
              return cur;
            });
          });
      }, HOVER_DELAY_MS);
    },
    [bundled, text],
  );

  const close = useCallback(() => {
    clearTimer();
    setActive(null);
    setGloss(null);
    setBusy(false);
  }, []);

  return (
    /*
      Các từ xếp bằng flex-wrap chứ không lồng trong một <Text>.

      Lồng trong Text thì chữ chảy tự nhiên hơn, nhưng không đặt nổi thẻ nghĩa
      ngay trên đầu MỘT từ — phần tử con của Text không nhận được vị trí tuyệt
      đối. Đổi lấy khả năng đặt đúng chỗ là đáng, vì cả tính năng này nằm ở chỗ
      thẻ nghĩa hiện đúng trên từ đang đọc.
    */
    <View className="flex-row flex-wrap" style={{ alignItems: 'flex-start' }}>
      {tokens.map((token, i) => {
        if (!token.word) {
          return (
            <Text key={i} style={{ fontFamily, fontSize, lineHeight, color }}>
              {token.text}
            </Text>
          );
        }

        const isActive = active === i;
        const known = bundled?.[token.word] !== undefined;

        return (
          <View key={i} style={{ position: 'relative' }}>
            {isActive ? (
              <GlossBubble word={token.word} gloss={gloss} busy={busy} />
            ) : null}
            <Pressable
              onHoverIn={Platform.OS === 'web' ? () => open(i, token.word as string) : undefined}
              onHoverOut={Platform.OS === 'web' ? close : undefined}
              onPress={() => (isActive ? close() : open(i, token.word as string))}
            >
              <Text
                style={{
                  fontFamily,
                  fontSize,
                  lineHeight,
                  color: isActive ? paper.brandMid : color,
                  // Từ đã soạn sẵn nghĩa gạch chân mờ — đủ để mắt biết có gì ở
                  // đó, không đủ để cả đoạn trông như một bãi gạch chân.
                  ...(known || isActive
                    ? {
                        textDecorationLine: 'underline' as const,
                        textDecorationStyle: 'dotted' as const,
                        textDecorationColor: isActive ? paper.brandMid : paper.brandSoft,
                      }
                    : null),
                }}
              >
                {token.text}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

/** Bong bóng nghĩa, neo phía trên từ đang trỏ. */
function GlossBubble({
  word,
  gloss,
  busy,
}: {
  word: string;
  gloss: InlineGloss | null;
  busy: boolean;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        marginBottom: 4,
        zIndex: 20,
        /*
          Bề ngang đặt CỨNG, không để co theo nội dung.

          Thẻ này neo tuyệt đối trong một ô chỉ rộng bằng một từ, nên để nó tự
          co thì nó co về bề ngang của từ ấy và chữ vỡ thành từng dòng một chữ.
        */
        width: 240,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: paper.ink,
      }}
    >
      {busy ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 12 }}>đang tra…</Text>
        </View>
      ) : (
        <Text style={{ color: '#FFFFFF', fontSize: 12.5 }} numberOfLines={3}>
          <Text style={{ fontWeight: '700' }}>{word}</Text>
          {gloss ? ` — ${gloss.meaningVi}` : ' — chưa tra được nghĩa'}
        </Text>
      )}
    </View>
  );
}
