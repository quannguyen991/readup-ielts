import React, { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, DIFF_COLOR, HUB } from '@/components/hub/theme';
import { markTaskDone } from '@/components/hub/hooks';
import { SCENE_IMAGE } from '@/data/hub/scenes';
import { dayKeyOf } from '@/services/hub/daily';
import { gradeRoleplay, roleplayById } from '@/services/hub/roleplay';
import { speak, stopSpeaking } from '@/services/hub/speak';
import { useVoiceReply } from '@/components/hub/useVoiceReply';
import { useHubStore } from '@/store/useHubStore';

const RINGS = [0.9, 1.2, 1.5];

/** Cuộc gọi luyện nói: đầu dây bên kia nói, bạn chọn cách đáp. Mỗi lượt đúng tích một nhiệm vụ. */
export default function CallPage() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const play = roleplayById(id);
  const completeRoleplay = useHubStore((s) => s.completeRoleplay);
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [hinted, setHinted] = useState(false);
  const [hints, setHints] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [ended, setEnded] = useState(false);

  // Đồng hồ cuộc gọi chạy cho tới khi kết thúc.
  useEffect(() => {
    if (ended) return undefined;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [ended]);

  // Đầu dây bên kia nói mỗi khi sang lượt mới.
  const current = play?.steps[step];
  useEffect(() => {
    if (!current || ended) return undefined;
    const stop = speak(current.ai);
    return () => {
      stop();
    };
  }, [current, ended]);

  useEffect(() => () => stopSpeaking(), []);

  const voice = useVoiceReply(play && play.mode === 'call' ? (play.steps[step]?.options ?? null) : null, (k) => pick(k));

  if (!play || play.mode !== 'call') {
    return (
      <HubScreen title="Không tìm thấy cuộc gọi" back>
        <Text style={{ color: HUB.body }}>Cuộc gọi này không còn trong danh sách.</Text>
      </HubScreen>
    );
  }

  const answered = picks.length;
  const passedSoFar = picks.reduce<number>((n, p, i) => n + (play.steps[i]?.options[p ?? -1]?.good ? 1 : 0), 0);
  const result = ended ? gradeRoleplay(picks, play.steps) : null;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  const pick = (k: number) => {
    if (chosen !== null || !current) return;
    setChosen(k);
    setPicks((p) => [...p, k]);
    speak(current.options[k]!.text);
  };

  const next = () => {
    setChosen(null);
    setHinted(false);
    if (step + 1 >= play.steps.length) {
      endCall();
    } else {
      setStep((n) => n + 1);
    }
  };

  const endCall = () => {
    stopSpeaking();
    const r = gradeRoleplay(picks, play.steps);
    if (r.passed) {
      completeRoleplay(play.id);
      markTaskDone(dayKeyOf(new Date()), `roleplay:${play.id}`);
    }
    setEnded(true);
  };

  const restart = () => {
    setStep(0);
    setPicks([]);
    setChosen(null);
    setHinted(false);
    setHints(0);
    setSeconds(0);
    setEnded(false);
  };

  if (ended && result) {
    return (
      <HubScreen title={play.title} subtitle="Cuộc gọi đã kết thúc" back>
        <View style={[GLASS_CARD, { padding: 18, gap: 12 }]}>
          <Text style={{ color: HUB.ink, fontSize: 20, fontWeight: '800' }}>
            {result.passed ? 'Cuộc gọi tốt' : 'Cuộc gọi chưa đạt'}: {result.good}/{result.total} lượt đúng
          </Text>
          <Text style={{ color: HUB.body, fontSize: 14, lineHeight: 21 }}>
            {`Thời lượng ${mm}:${ss} · gợi ý đã dùng ${hints} lần. ${result.passed ? 'Kịch bản được ghi vào tiến độ và nhiệm vụ hôm nay.' : 'Cần ít nhất 2 lượt đúng để tính là đạt.'}`}
          </Text>
          <Pressable accessibilityRole="button" onPress={restart} style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Gọi lại</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.glassStrong }}>
            <Text style={{ color: HUB.ink, fontWeight: '700' }}>Về danh sách</Text>
          </Pressable>
        </View>
      </HubScreen>
    );
  }

  return (
    <HubScreen title={play.title} subtitle={play.scene} back>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <View style={{ width: 168, height: 168, alignItems: 'center', justifyContent: 'center' }}>
          {RINGS.map((scale, i) => (
            <View
              key={i}
              style={{ position: 'absolute', width: 120 * scale, height: 120 * scale, borderRadius: 999, borderWidth: 1.5, borderColor: `rgba(46,125,79,${0.5 - i * 0.14})` }}
            />
          ))}
          <Image source={{ uri: SCENE_IMAGE[play.setting] }} accessibilityIgnoresInvertColors resizeMode="cover" style={{ width: 110, height: 110, borderRadius: 999, backgroundColor: HUB.glassStrong }} />
        </View>
        <Text style={{ color: HUB.muted, fontSize: 13, fontVariant: ['tabular-nums'] }}>{`${mm}:${ss} · Lượt ${Math.min(step + 1, play.steps.length)}/${play.steps.length}`}</Text>
        <Text style={{ color: DIFF_COLOR[play.difficulty], fontSize: 11, fontWeight: '800' }}>{play.difficulty}</Text>
      </View>

      <View style={[GLASS_CARD, { padding: 14, gap: 8 }]}>
        <Text style={{ color: HUB.ink, fontSize: 14, fontWeight: '800' }}>Nhiệm vụ</Text>
        {play.tasks.map((task, i) => {
          const done = i < answered && Boolean(play.steps[i]?.options[picks[i] ?? -1]?.good);
          return (
            <Text key={task} style={{ color: done ? HUB.green : HUB.body, fontSize: 13, lineHeight: 19 }}>{`${done ? '✓' : '○'}  ${task}`}</Text>
          );
        })}
        <Text style={{ color: HUB.muted, fontSize: 11 }}>{`Đúng ${passedSoFar}/${answered} lượt đã trả lời`}</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {play.vocab.map((v) => (
          <Pressable key={v.word} accessibilityRole="button" accessibilityLabel={`Nghe ${v.word}`} onPress={() => speak(v.word)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}>
            <Text style={{ color: HUB.ink, fontSize: 12 }}>{v.word}</Text>
          </Pressable>
        ))}
      </View>

      {current ? (
        <View style={[GLASS_CARD, { padding: 16, gap: 12 }]}>
          <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>ĐẦU DÂY BÊN KIA</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Nghe lại" onPress={() => speak(current.ai)}>
            <Text style={{ color: HUB.ink, fontSize: 16, lineHeight: 23 }}>{current.ai}</Text>
          </Pressable>
          <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>BẠN ĐÁP</Text>
          {current.options.map((opt, k) => {
            const reveal = hinted && opt.good && chosen === null;
            const tone = chosen === null ? (reveal ? HUB.green : HUB.line) : opt.good ? HUB.green : chosen === k ? HUB.red : HUB.line;
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
          {chosen === null ? (
            <Pressable
              accessibilityRole="button"
              disabled={hinted}
              onPress={() => {
                setHinted(true);
                setHints((h) => h + 1);
              }}
              style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: HUB.line, opacity: hinted ? 0.5 : 1 }}
            >
              <Text style={{ color: HUB.amber, fontSize: 12, fontWeight: '700' }}>{hinted ? 'Đã hiện gợi ý' : 'Gợi ý'}</Text>
            </Pressable>
          ) : null}
          {chosen !== null ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: current.options[chosen]!.good ? HUB.green : HUB.amber, fontSize: 13, lineHeight: 19 }}>
                {current.options[chosen]!.good ? 'Tốt. ' : 'Chưa tối ưu. '}{current.options[chosen]!.tip}
              </Text>
              <Pressable accessibilityRole="button" onPress={next} style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.violet }}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>{step + 1 >= play.steps.length ? 'Kết thúc cuộc gọi' : 'Lượt tiếp'}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      {chosen === null ? (
        <Pressable accessibilityRole="button" onPress={endCall} style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: HUB.red }}>
          <Text style={{ color: HUB.red, fontWeight: '800' }}>Kết thúc cuộc gọi</Text>
        </Pressable>
      ) : null}
    </HubScreen>
  );
}
