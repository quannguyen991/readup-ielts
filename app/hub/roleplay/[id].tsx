import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, DIFF_COLOR, HUB } from '@/components/hub/theme';
import { markTaskDone } from '@/components/hub/hooks';
import { CATEGORY_LABEL, gradeRoleplay, roleplayById } from '@/services/hub/roleplay';
import { dayKeyOf } from '@/services/hub/daily';
import { useVoiceReply } from '@/components/hub/useVoiceReply';
import { speak } from '@/services/hub/speak';
import { SCENE_IMAGE } from '@/data/hub/scenes';
import { useHubStore } from '@/store/useHubStore';

/** Kịch bản nhập vai ba lượt: nghe lời đối phương, chọn cách đáp, xem vì sao. */
export default function RoleplayPage() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const play = roleplayById(id);
  const completeRoleplay = useHubStore((s) => s.completeRoleplay);
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const voice = useVoiceReply(play && play.mode === 'roleplay' ? (play.steps[step]?.options ?? null) : null, (k) => pick(k));

  if (!play) {
    return (
      <HubScreen title="Không tìm thấy kịch bản" back>
        <Text style={{ color: HUB.body }}>Kịch bản này không còn trong danh sách.</Text>
      </HubScreen>
    );
  }
  if (play.mode === 'call') return <Redirect href={`/hub/call/${play.id}` as never} />;

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
      <Image source={{ uri: SCENE_IMAGE[play.setting] }} accessibilityIgnoresInvertColors resizeMode="cover" style={{ width: '100%', height: 180, borderRadius: 16, backgroundColor: HUB.glassStrong }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Text style={{ color: DIFF_COLOR[play.difficulty], fontSize: 11, fontWeight: '800', borderWidth: 1, borderColor: DIFF_COLOR[play.difficulty], borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>{play.difficulty}</Text>
        <Text style={{ color: HUB.muted, fontSize: 12 }}>{CATEGORY_LABEL[play.category]} · Lượt {Math.min(step + 1, play.steps.length)}/{play.steps.length}</Text>
      </View>

      <View style={[GLASS_CARD, { padding: 14, gap: 8 }]}>
        <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '800' }}>Nhiệm vụ</Text>
        {play.tasks.map((task, i) => (
          <Text key={task} style={{ color: i < step || (finished && result?.passed) ? HUB.green : HUB.body, fontSize: 13, lineHeight: 19 }}>
            {`${i < step || (finished && result?.passed) ? '✓' : '○'}  ${task}`}
          </Text>
        ))}
      </View>

      <View style={[GLASS_CARD, { padding: 14, gap: 10 }]}>
        <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '800' }}>Từ mục tiêu</Text>
        {play.vocab.map((v) => (
          <Pressable key={v.word} accessibilityRole="button" accessibilityLabel={`Nghe ${v.word}`} onPress={() => speak(v.word)} style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
              <Text style={{ color: HUB.blue, fontSize: 14, fontWeight: '700' }}>{v.word}</Text>
              <Text style={{ color: HUB.muted, fontSize: 11 }}>{v.pos}</Text>
            </View>
            <Text style={{ color: HUB.body, fontSize: 13 }}>{v.meaning}</Text>
          </Pressable>
        ))}
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
          {chosen === null && voice.supported ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={voice.listening ? 'Dừng nghe' : 'Trả lời bằng giọng nói'}
              onPress={voice.listening ? voice.stop : voice.start}
              style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: voice.listening ? HUB.red : HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}
            >
              <Text style={{ color: voice.listening ? '#fff' : HUB.ink, fontWeight: '700' }}>
                {voice.listening ? (voice.live || 'Đang nghe… bấm để dừng') : 'Trả lời bằng giọng nói'}
              </Text>
            </Pressable>
          ) : null}
          {chosen === null && voice.note ? <Text style={{ color: HUB.amber, fontSize: 12, lineHeight: 18 }}>{voice.note}</Text> : null}
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
