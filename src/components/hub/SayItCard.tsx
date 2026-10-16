import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useListen } from './useListen';
import { GLASS_CARD, HUB } from './theme';
import { Icon } from '@/components/ui/Icon';
import { speak } from '@/services/hub/speak';
import { percentOf, scoreSaying, type SayResult, SAY_PASS } from '@/services/hub/say-it';
import { useHubStore } from '@/store/useHubStore';
import type { DictationToken } from '@/services/sentence/dictation-grade';

const GREEN = '#2E7D4F';
const AMBER = '#A8741A';
const RED = '#B3261E';

function toneOf(pct: number): string {
  return pct >= SAY_PASS * 100 ? GREEN : pct >= 60 ? AMBER : RED;
}

/** Từng từ được tô theo kết quả: đúng xanh, thiếu gạch đỏ, nói thừa gạch vàng. */
function wordStyle(status: DictationToken['status']) {
  if (status === 'correct') return { color: GREEN, fontWeight: '700' as const };
  if (status === 'missing') return { color: RED, textDecorationLine: 'underline' as const };
  return { color: AMBER, textDecorationLine: 'line-through' as const };
}

/**
 * Một cụm từ để nói theo, kiểu luyện phát âm của các app nói tiếng Anh: nghe mẫu,
 * ghi âm, rồi thấy từng từ đúng hay sai ngay. Điểm cao nhất của mỗi cụm được lưu lại.
 *
 * Chấm theo chữ qua bộ nhận giọng của trình duyệt (xem `say-it.ts`). Đây không phải
 * chấm âm — không báo được một nguyên âm bị phát âm lệch.
 */
export function SayItCard({ id, phrase, meaningVi }: { id: string; phrase: string; meaningVi: string }) {
  const listen = useListen();
  const recordPhrase = useHubStore((s) => s.recordPhrase);
  const best = useHubStore((s) => s.phraseBest[id]);
  const [result, setResult] = useState<SayResult | null>(null);
  const [silent, setSilent] = useState(false);
  const armed = useRef(false);

  // Khi micro vừa dừng hẳn, chấm lượt vừa nói. Chỉ chấm một lần cho mỗi lần ghi.
  useEffect(() => {
    if (listen.listening || !armed.current) return;
    armed.current = false;
    if (!listen.text.trim()) {
      setResult(null);
      setSilent(true);
      return;
    }
    const r = scoreSaying(phrase, listen.text);
    setSilent(false);
    setResult(r);
    recordPhrase(id, percentOf(r));
    // `phrase` và `id` không đổi trong đời của một thẻ; chỉ cần chạy khi micro dừng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listen.listening, listen.text]);

  const start = () => {
    setResult(null);
    setSilent(false);
    armed.current = true;
    listen.start();
  };

  const pct = result ? percentOf(result) : null;
  const passed = result?.passed ?? false;

  return (
    <View style={[GLASS_CARD, { padding: 16, gap: 10 }]} accessibilityLabel={`Nói theo: ${phrase}`}>
      <View style={{ gap: 2 }}>
        <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>{phrase}</Text>
        <Text style={{ color: HUB.body, fontSize: 13 }}>{meaningVi}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nghe mẫu"
          onPress={() => speak(phrase)}
          style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.glassStrong }}
        >
          <Icon name="volume" size={18} color={HUB.blue} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={listen.listening ? 'Dừng ghi' : 'Ghi âm cụm này'}
          disabled={!listen.supported}
          onPress={() => (listen.listening ? listen.stop() : start())}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            backgroundColor: listen.listening ? HUB.red : HUB.blue,
            opacity: listen.supported ? 1 : 0.5,
          }}
        >
          <Icon name="mic" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800' }}>{listen.listening ? 'Dừng' : result ? 'Nói lại' : 'Ghi âm'}</Text>
        </Pressable>
      </View>

      {!listen.supported ? <Text style={{ color: HUB.amber, fontSize: 12 }}>Ghi âm cần Chrome trên máy tính hoặc Android.</Text> : null}
      {listen.listening ? <Text style={{ color: HUB.muted, fontSize: 12 }}>Đang nghe… nói cả cụm rồi bấm Dừng.</Text> : null}
      {silent ? <Text style={{ color: AMBER, fontSize: 13 }}>Chưa nghe rõ. Thử lại gần micro hơn, nói chậm và rõ.</Text> : null}

      {result && pct !== null ? (
        <View style={{ gap: 8, paddingTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text style={{ color: toneOf(pct), fontSize: 24, fontWeight: '800' }}>{pct}%</Text>
            <Text style={{ color: toneOf(pct), fontSize: 13, fontWeight: '700' }}>
              {passed ? 'Đạt' : pct >= 60 ? 'Gần đạt' : 'Thử lại'}
            </Text>
            <Text style={{ color: HUB.muted, fontSize: 12 }}>
              {result.correct}/{result.total} từ đúng
            </Text>
          </View>

          <Text style={{ fontSize: 16, lineHeight: 26 }}>
            {result.tokens.map((t, i) => (
              <Text key={i} style={[{ color: HUB.ink }, wordStyle(t.status)]}>
                {t.word}
                {i < result.tokens.length - 1 ? ' ' : ''}
              </Text>
            ))}
          </Text>

          <Text style={{ color: HUB.muted, fontSize: 11 }}>
            Xanh: đúng · Gạch đỏ: chưa nói · Gạch vàng: nói thừa
          </Text>
        </View>
      ) : null}

      {best !== undefined ? (
        <Text style={{ color: HUB.body, fontSize: 12, fontWeight: '700' }}>Điểm cao nhất: {best}%</Text>
      ) : null}
    </View>
  );
}
