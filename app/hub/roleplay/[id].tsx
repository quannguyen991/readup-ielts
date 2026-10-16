import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, DIFF_COLOR, HUB } from '@/components/hub/theme';
import { markTaskDone } from '@/components/hub/hooks';
import { dayKeyOf } from '@/services/hub/daily';
import { gradeRoleplay, roleplayById } from '@/services/hub/roleplay';
import { speak } from '@/services/hub/speak';
import { useHubStore } from '@/store/useHubStore';

/** Kịch bản ba lượt: nghe lời đối phương, chọn cách đáp, xem vì sao. */
export default function RoleplayPage() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const play = roleplayById(id);
  const completeRoleplay = useHubStore((s) => s.completeRoleplay);
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  if (!play) {
    return (
      <HubScreen title="Không tìm thấy kịch bản" back>
        <Text style={{ color: HUB.body }}>Kịch bản này không còn trong danh sách.</Text>
      </HubScreen>
    );
  }

  const current = play.steps[step];
  const result = finished ? gradeRoleplay(picks, play.steps) : null;

  const pick = (k: number) => {
    if (chosen !== null || !current) return;
    setChosen(k);
    setPicks((p) => [...p, k]);
    speak(current.options[k]!.text);
  };

  const next = () => {
    setChosen(null);
    if (step + 1 >= play.steps.length) {
      const r = gradeRoleplay(picks, play.steps);
      // Chỉ tính là hoàn thành khi đạt; làm chưa đạt thì không ghi tiến độ.
      if (r.passed) {
        completeRoleplay(play.id);
        markTaskDone(dayKeyOf(new Date()), `roleplay:${play.id}`);
      }
      setFinished(true);
    } else {
      setStep((n) => n + 1);
    }
  };

  const restart = () => {
    setStep(0);
    setPicks([]);
    setChosen(null);
    setFinished(false);
  };

  return (
    <HubScreen title={play.title} subtitle={play.scene} back>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ color: DIFF_COLOR[play.difficulty], fontSize: 11, fontWeight: '800', borderWidth: 1, borderColor: DIFF_COLOR[play.difficulty], borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>{play.difficulty}</Text>
        <Text style={{ color: HUB.muted, fontSize: 12 }}>Lượt {Math.min(step + 1, play.steps.length)}/{play.steps.length}</Text>
      </View>

      {!finished && current ? (
        <View style={[GLASS_CARD, { padding: 16, gap: 14 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Nghe lời đối phương" onPress={() => speak(current.ai)} style={{ gap: 6 }}>
            <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>ĐỐI PHƯƠNG</Text>
            <Text style={{ color: HUB.ink, fontSize: 16, lineHeight: 23 }}>{current.ai}</Text>
          </Pressable>
          <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>BẠN ĐÁP</Text>
          {current.options.map((opt, k) => {
            const tone = chosen === null ? HUB.line : opt.good ? HUB.green : chosen === k ? HUB.red : HUB.line;
            return (
              <Pressable key={opt.text} accessibilityRole="button" onPress={() => pick(k)} style={{ padding: 12, borderRadius: 12, borderWidth: 2, borderColor: tone, backgroundColor: HUB.glassStrong }}>
                <Text style={{ color: HUB.ink, fontSize: 14, lineHeight: 20 }}>{opt.text}</Text>
              </Pressable>
            );
          })}
          {chosen !== null ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: current.options[chosen]!.good ? HUB.green : HUB.amber, fontSize: 13, lineHeight: 19 }}>
                {current.options[chosen]!.good ? 'Tốt. ' : 'Chưa tối ưu. '}{current.options[chosen]!.tip}
              </Text>
              <Pressable accessibilityRole="button" onPress={next} style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.violet }}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>{step + 1 >= play.steps.length ? 'Xem kết quả' : 'Lượt tiếp'}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      {finished && result ? (
        <View style={[GLASS_CARD, { padding: 18, gap: 12 }]}>
          <Text style={{ color: HUB.ink, fontSize: 20, fontWeight: '800' }}>{result.passed ? 'Hoàn thành tốt' : 'Hoàn thành'}: {result.good}/{result.total} lượt tốt</Text>
          <Text style={{ color: HUB.body, fontSize: 14, lineHeight: 21 }}>
            {result.passed ? 'Kịch bản được ghi vào tiến độ và nhiệm vụ hôm nay.' : 'Cần ít nhất 2 lượt tốt để tính là đạt. Thử lại để chọn cách đáp khác.'}
          </Text>
          <Pressable accessibilityRole="button" onPress={restart} style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Chơi lại</Text>
          </Pressable>
        </View>
      ) : null}
    </HubScreen>
  );
}
