import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { parseInline, stripInline } from '@/lib/inlineMarkup';
import { lookupWord } from '@/services/dictionary/lookup';
import { isGlossable, normaliseToken, offlineGloss, splitTokens } from '@/services/dictionary/offline-glossary';
import { paper } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Rê chuột vào một từ là hiện nghĩa ngay trên đầu từ đó; BẤM vào là mở thẻ chi tiết.
 *
 * VÌ SAO RÊ CHỨ KHÔNG BẤM. Bấm là một quyết định: người đọc phải dừng lại, thấy
 * mình "không biết từ này", rồi mới bấm. Vì phải quyết định nên phần lớn người
 * đọc bỏ qua và đoán tiếp. Rê chuột thì không tốn quyết định nào, nên nghĩa tới
 * đúng lúc mắt còn dừng ở từ. Bấm để dành cho lúc muốn học hẳn từ đó: phiên âm,
 * định nghĩa, ví dụ, từ đồng nghĩa, lưu vào sổ.
 *
 * BA NGUỒN NGHĨA, ƯU TIÊN NGUỒN CÓ SẴN. (1) Nghĩa soạn riêng cho đoạn này. (2)
 * Từ điển dựng sẵn của kho song ngữ (`offline-glossary.ts`), phủ mọi dạng từ có
 * trong bài. Cả hai hiện TỨC THÌ. (3) Chỉ từ nằm ngoài cả hai mới đi tra mạng.
 *
 * CHUYỂN ĐỘNG MỀM, KHÔNG NHẢY. Bong bóng mờ dần lên và nhích lên 4px trong
 * 160ms; từ đang trỏ đổi nền dần chứ không bật đèn. Người đọc lướt chuột qua
 * cả dòng — hiệu ứng giật cục ở từng từ là thứ làm mỏi mắt nhất.
 */

export type InlineGloss = { word: string; meaningVi: string; pos?: string | null };

/** Thông tin gửi ra khi người đọc BẤM vào một từ. */
export type WordPick = {
  /** Dạng đã thường hoá, dùng để tra. */
  word: string;
  /** Chữ đúng như trong bài, bỏ dấu câu hai đầu. */
  surface: string;
  /** Câu chứa từ — lưu vào sổ từ cùng từ. */
  sentence: string;
  /** Toạ độ của từ trên cửa sổ, để neo thẻ chi tiết. */
  anchor: { x: number; y: number; width: number; height: number };
};

/** Nhớ nghĩa đã tra mạng trong suốt phiên. Khoá là từ đã thường hoá. */
const CACHE = new Map<string, InlineGloss | null>();

const HOVER_DELAY_MS = 180;

type Token = { text: string; word: string | null; italic: boolean; bold: boolean };

/**
 * Cắt đoạn thành từng từ, mang theo cờ nghiêng/đậm của chỗ từ đó đứng.
 *
 * KHÔNG trả khoảng trắng thành phần tử riêng: dấu cách đứng một mình sẽ rơi vào
 * cuối dòng hoặc đầu dòng sau và đẻ ra khe hở lạ. Dấu cách vẽ bằng lề phải.
 */
export function tokenise(text: string): Token[] {
  const out: Token[] = [];
  for (const run of parseInline(text)) {
    for (const part of splitTokens(run.text)) {
      const core = normaliseToken(part);
      out.push({ text: part, word: isGlossable(core) ? core : null, italic: run.italic, bold: run.bold });
    }
  }
  return out;
}

/** Câu chứa token thứ `at` — cắt theo dấu chấm/hỏi/than gần nhất hai phía. */
function sentenceAround(tokens: Token[], at: number): string {
  const ends = (t: string) => /[.!?]["”’)]*$/.test(t);
  let start = at;
  while (start > 0 && !ends(tokens[start - 1]!.text)) start--;
  let end = at;
  while (end < tokens.length - 1 && !ends(tokens[end]!.text)) end++;
  return tokens
    .slice(start, end + 1)
    .map((t) => t.text)
    .join(' ');
}

export function HoverGlossText({
  text,
  bundled,
  fontFamily,
  fontSize,
  lineHeight,
  color,
  onWordPress,
}: {
  text: string;
  /** Nghĩa soạn sẵn của đoạn, tra theo từ đã thường hoá. */
  bundled?: Record<string, InlineGloss>;
  fontFamily?: string;
  fontSize: number;
  lineHeight: number;
  color: string;
  onWordPress?: (pick: WordPick) => void;
}) {
  // Khoá theo VỊ TRÍ token: một đoạn có ba chữ "city" thì chỉ chỗ đang trỏ sáng lên.
  const [active, setActive] = useState<number | null>(null);
  const [gloss, setGloss] = useState<InlineGloss | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refs = useRef<Record<number, View | null>>({});

  const tokens = useMemo(() => tokenise(text), [text]);
  const space = fontSize * 0.26;

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => clearTimer, []);

  const open = useCallback(
    (at: number, word: string) => {
      clearTimer();
      setActive(at);

      const ready = bundled?.[word] ?? offlineGloss(word) ?? CACHE.get(word);
      if (ready !== undefined) {
        setGloss(ready);
        setBusy(false);
        return;
      }

      setGloss(null);
      setBusy(true);
      timer.current = setTimeout(() => {
        void lookupWord(word, stripInline(text))
          .then((r) => {
            const found: InlineGloss | null = r.definitionVi
              ? { word, meaningVi: r.definitionVi, pos: r.partOfSpeech }
              : null;
            CACHE.set(word, found);
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

  const pick = (at: number, token: Token) => {
    if (!token.word) return;
    if (!onWordPress) {
      if (active === at) close();
      else open(at, token.word);
      return;
    }
    const word = token.word;
    const send = (x: number, y: number, width: number, height: number) =>
      onWordPress({
        word,
        surface: token.text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}'’-]+$/gu, ''),
        sentence: sentenceAround(tokens, at),
        anchor: { x, y, width, height },
      });
    close();
    const node = refs.current[at];
    if (node && typeof node.measureInWindow === 'function') node.measureInWindow(send);
    else send(0, 0, 0, 0);
  };

  return (
    <View className="flex-row flex-wrap" style={{ alignItems: 'flex-start' }}>
      {tokens.map((token, i) => {
        const base = {
          fontFamily,
          fontSize,
          lineHeight,
          fontStyle: token.italic ? ('italic' as const) : ('normal' as const),
          ...(token.bold ? { fontWeight: '700' as const } : null),
        };

        if (!token.word) {
          return (
            <Text key={i} style={{ ...base, color, marginRight: space }}>
              {token.text}
            </Text>
          );
        }

        const isActive = active === i;
        const known = bundled?.[token.word] !== undefined;

        return (
          <View
            key={i}
            ref={(node) => {
              refs.current[i] = node;
            }}
            style={{ position: 'relative', marginRight: space }}
          >
            {isActive ? <GlossBubble word={token.word} gloss={gloss} busy={busy} /> : null}
            <Pressable
              onHoverIn={Platform.OS === 'web' ? () => open(i, token.word as string) : undefined}
              onHoverOut={Platform.OS === 'web' ? close : undefined}
              onPress={() => pick(i, token)}
            >
              <Text
                style={{
                  ...base,
                  color: isActive ? paper.brandMid : color,
                  borderRadius: 4,
                  backgroundColor: isActive ? 'rgba(205, 164, 94,0.12)' : 'rgba(205, 164, 94,0)',
                  ...(Platform.OS === 'web' ? WEB_TRANSITION : null),
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

/*
  react-native-web chuyển thẳng các khoá này xuống CSS. Kiểu của RN không khai
  báo chúng nên phải ép kiểu — chỉ dùng trên web.
*/
const WEB_TRANSITION = {
  transitionProperty: 'background-color, color, text-decoration-color',
  transitionDuration: '180ms',
  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  cursor: 'pointer',
} as object;

/** Bong bóng nghĩa, neo phía trên từ đang trỏ — mờ dần lên và nhích nhẹ. */
function GlossBubble({
  word,
  gloss,
  busy,
}: {
  word: string;
  gloss: InlineGloss | null;
  busy: boolean;
}) {
  const { L } = useL();
  const reduced = useReducedMotion();
  const t = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    t.value = withTiming(1, { duration: 170, easing: Easing.out(Easing.cubic) });
    // Chạy một lần cho mỗi lần bong bóng xuất hiện.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animated = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * 5 }, { scale: 0.96 + t.value * 0.04 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          bottom: '100%',
          left: 0,
          marginBottom: 6,
          zIndex: 20,
          // Bề ngang đặt cứng: ô neo chỉ rộng bằng một từ, để tự co thì chữ vỡ dòng.
          width: 250,
          borderRadius: 10,
          paddingHorizontal: 11,
          paddingVertical: 7,
          backgroundColor: '#1E1B4B',
        },
        animated,
      ]}
    >
      {busy ? (
        <Text style={{ color: '#FFFFFF', fontSize: 12 }}>{L('đang tra…', 'looking up…')}</Text>
      ) : (
        <Text style={{ color: '#FFFFFF', fontSize: 12.5 }} numberOfLines={3}>
          <Text style={{ fontWeight: '700', fontStyle: 'italic' }}>{word}</Text>
          {gloss ? ` — ${gloss.meaningVi}` : L(' — chưa có nghĩa', ' — no meaning yet')}
          <Text style={{ color: '#FCD68A', fontSize: 12 }}>
            {gloss?.pos ? `   ${gloss.pos}` : ''}
            {L('   · bấm để xem thêm', '   · tap for more')}
          </Text>
        </Text>
      )}
    </Animated.View>
  );
}
