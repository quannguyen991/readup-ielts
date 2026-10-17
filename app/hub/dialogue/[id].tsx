import React, { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { DIFF_COLOR, GLASS_CARD, HUB } from '@/components/hub/theme';
import { SCENE_IMAGE } from '@/data/hub/scenes';
import { CATEGORY_LABEL } from '@/services/hub/roleplay';
import { dialogueById, gradeDialogue } from '@/services/hub/dialogue';
import { speak, stopSpeaking } from '@/services/hub/speak';
import { useDialogueStore } from '@/store/useDialogueStore';

/** Hội thoại mẫu: nghe từng câu hoặc cả đoạn, đọc theo, rồi làm bài điền từ. */
export default function DialoguePage() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const dialogue = dialogueById(id);
  const record = useDialogueStore((s) => s.record);
  const [showVi, setShowVi] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const [picks, setPicks] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Đọc nối tiếp cả đoạn: câu sau chạy khi câu trước đọc xong.
  useEffect(() => {
    if (playing === null || !dialogue) return undefined;
    const line = dialogue.lines[playing];
    if (!line) {
      setPlaying(null);
      return undefined;
    }
    const stop = speak(line.en, {
      onDone: () => setPlaying((n) => (n === null ? null : n + 1 < dialogue.lines.length ? n + 1 : null)),
    });
    return () => stop();
  }, [playing, dialogue]);

  useEffect(() => () => stopSpeaking(), []);

  if (!dialogue) {
    return (
      <HubScreen title="Không tìm thấy bài hội thoại" back>
        <Text style={{ color: HUB.body }}>Bài này không còn trong danh sách.</Text>
      </HubScreen>
    );
  }

  const choose = (qi: number, opt: number) => {
    if (submitted) return;
    setPicks((prev) => {
      const next = prev.slice();
      next[qi] = opt;
      return next;
    });
  };

  const submit = () => {
    const grade = gradeDialogue(picks, dialogue.quiz);
    record(dialogue.id, grade.percent);
    setSubmitted(true);
  };

  const grade = submitted ? gradeDialogue(picks, dialogue.quiz) : null;
  const allAnswered = dialogue.quiz.every((_, i) => picks[i] !== undefined && picks[i] !== null);

  return (
    <HubScreen title={dialogue.title} subtitle={`${CATEGORY_LABEL[dialogue.category]} · ${dialogue.minutes} phút`} back>
      <Image source={{ uri: SCENE_IMAGE[dialogue.setting] }} accessibilityIgnoresInvertColors resizeMode="cover" style={{ width: '100%', height: 180, borderRadius: 16, backgroundColor: HUB.glassStrong }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Text style={{ color: DIFF_COLOR[dialogue.difficulty], fontSize: 11, fontWeight: '800', borderWidth: 1, borderColor: DIFF_COLOR[dialogue.difficulty], borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>{dialogue.difficulty}</Text>
        <Pressable accessibilityRole="button" onPress={() => setPlaying(playing === null ? 0 : null)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: HUB.blue }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{playing === null ? 'Nghe cả đoạn' : 'Dừng'}</Text>
        </Pressable>
        <Pressable accessibilityRole="switch" accessibilityState={{ checked: showVi }} onPress={() => setShowVi((v) => !v)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: HUB.line }}>
          <Text style={{ color: HUB.ink, fontSize: 12, fontWeight: '700' }}>{showVi ? 'Ẩn bản dịch' : 'Hiện bản dịch'}</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {dialogue.keyPhrases.map((p) => (
          <Pressable key={p} accessibilityRole="button" accessibilityLabel={`Nghe ${p}`} onPress={() => speak(p)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}>
            <Text style={{ color: HUB.ink, fontSize: 12 }}>{p}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[GLASS_CARD, { padding: 14, gap: 12 }]}>
        <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Đoạn hội thoại</Text>
        {dialogue.lines.map((line, i) => {
          const speaking = playing === i;
          return (
            <Pressable
              key={`${i}-${line.en}`}
              accessibilityRole="button"
              accessibilityLabel={`Nghe câu ${i + 1}`}
              onPress={() => speak(line.en)}
              style={{ gap: 4, padding: 10, borderRadius: 12, backgroundColor: speaking ? 'rgba(59,130,246,0.14)' : 'transparent' }}
            >
              <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '800' }}>{line.speaker.toUpperCase()}</Text>
              <Text style={{ color: HUB.ink, fontSize: 15, lineHeight: 22 }}>{line.en}</Text>
              {showVi ? <Text style={{ color: HUB.muted, fontSize: 13, lineHeight: 19 }}>{line.vi}</Text> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={[GLASS_CARD, { padding: 14, gap: 14 }]}>
        <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Điền từ còn thiếu</Text>
        {dialogue.quiz.map((item, qi) => (
          <View key={item.q} style={{ gap: 8 }}>
            <Text style={{ color: HUB.ink, fontSize: 14, lineHeight: 20 }}>{`${qi + 1}. ${item.q}`}</Text>
            {item.options.map((opt, k) => {
              const on = picks[qi] === k;
              const correct = submitted && k === item.answer;
              const wrong = submitted && on && k !== item.answer;
              const tone = correct ? HUB.green : wrong ? HUB.red : on ? HUB.blue : HUB.line;
              return (
                <Pressable key={opt} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => choose(qi, k)} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5, borderColor: tone, backgroundColor: on ? 'rgba(59,130,246,0.12)' : HUB.glassStrong }}>
                  <Text style={{ color: HUB.ink, fontSize: 14 }}>{opt}</Text>
                </Pressable>
              );
            })}
            {submitted ? <Text style={{ color: picks[qi] === item.answer ? HUB.green : HUB.amber, fontSize: 12, lineHeight: 18 }}>{item.tip}</Text> : null}
          </View>
        ))}

        {!submitted ? (
          <Pressable accessibilityRole="button" disabled={!allAnswered} onPress={submit} style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.violet, opacity: allAnswered ? 1 : 0.4 }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Nộp bài</Text>
          </Pressable>
        ) : (
          <View style={{ gap: 8 }}>
            <Text style={{ color: grade?.passed ? HUB.green : HUB.amber, fontSize: 15, fontWeight: '800' }}>
              {`Đúng ${grade?.correct}/${grade?.total} câu (${grade?.percent}%) · ${grade?.passed ? 'Đạt' : 'Chưa đạt'}`}
            </Text>
            <Text style={{ color: HUB.muted, fontSize: 12, lineHeight: 18 }}>Đạt khi đúng ít nhất 2 trên 3 câu. Điểm cao nhất của bài được lưu và đồng bộ.</Text>
          </View>
        )}
      </View>
    </HubScreen>
  );
}
