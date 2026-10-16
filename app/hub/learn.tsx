import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { CoinIcon, type CoinName } from '@/components/ui/CoinIcon';
import { Icon } from '@/components/ui/Icon';
import { CHAPTERS, PHONEMES } from '@/services/hub/phonemes';
import { useHubStore } from '@/store/useHubStore';

export default function HubLearn() {
  const best = useHubStore((s) => s.phonemeBest);
  const mastered = PHONEMES.filter((p) => (best[p.symbol] ?? 0) >= 80).length;

  return (
    <HubScreen title="Học" subtitle={`Lộ trình 44 âm vị · đã thuộc ${mastered}/${PHONEMES.length}`}>
      {CHAPTERS.map((ch) => {
        const list = PHONEMES.filter((p) => p.chapter === ch.key);
        return (
          <View key={ch.key} style={[GLASS_CARD, { padding: 14, gap: 10 }]}>
            <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>{ch.vi}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {list.map((p) => {
                const score = best[p.symbol];
                const tone = score === undefined ? HUB.muted : score >= 80 ? HUB.green : score >= 50 ? HUB.amber : HUB.red;
                return (
                  <Pressable
                    key={p.symbol}
                    accessibilityRole="button"
                    accessibilityLabel={`Âm ${p.symbol}${score !== undefined ? `, điểm tốt nhất ${score}` : ''}`}
                    onPress={() => router.push(`/hub/phoneme/${encodeURIComponent(p.symbol)}` as never)}
                    style={{ width: 62, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.glassStrong, borderWidth: 1.5, borderColor: tone }}
                  >
                    <Text style={{ color: HUB.ink, fontSize: 18, fontWeight: '700' }}>/{p.symbol}/</Text>
                    <Text style={{ color: tone, fontSize: 10, fontWeight: '700' }}>{score === undefined ? 'chưa luyện' : `${score}`}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>Luyện nói IELTS</Text>
      <GameRow title="Lộ trình IELTS Speaking" desc="20 bài, 5 chặng từ band 5.0 đến 9.0, có ghi âm và bài mẫu." coin="path" route="/hub/ielts" />
      <GameRow title="Đề luyện nói theo chủ đề" desc="12 chủ đề đủ Part 1, cue card và Part 3, có số liệu sau mỗi câu." coin="speaking" route="/hub/topics" />
      <GameRow title="Nói cùng Leo (giám khảo AI)" desc="Leo hỏi bằng giọng nói, phản hồi từng câu và cuối buổi có phân tích chi tiết." coin="friends" route="/hub/live" />

      <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>Trò chơi luyện</Text>
      <GameRow title="Cặp âm tối thiểu" desc="Nghe và chọn từ đúng: sheep hay ship?" coin="listening" route="/hub/games/minimal-pairs" />
      <GameRow title="Trọng âm từ" desc="Chạm vào âm tiết được nhấn mạnh nhất." coin="missions" route="/hub/games/stress" />
      <GameRow title="Đường ngữ điệu" desc="Lên giọng hay xuống giọng ở cuối câu." coin="progress" route="/hub/pitch" />
      <GameRow title="Thử thách cuối chương" desc="Mười câu tổng hợp: cặp âm và ngữ pháp." coin="achievements" route="/hub/games/boss" />
    </HubScreen>
  );
}

function GameRow({ title, desc, coin, route }: { title: string; desc: string; coin: CoinName; route?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => route && router.push(route as never)}
      style={[GLASS_CARD, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, opacity: route ? 1 : 0.6 }]}
    >
      <CoinIcon name={coin} size={48} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: HUB.muted, fontSize: 12 }}>{desc}</Text>
      </View>
      {route ? <Icon name="chevron-right" size={18} color={HUB.muted} /> : <Text style={{ color: HUB.muted, fontSize: 10, fontWeight: '700' }}>SẮP CÓ</Text>}
    </Pressable>
  );
}
