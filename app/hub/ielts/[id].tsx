import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { SayItCard } from '@/components/hub/SayItCard';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { useListen } from '@/components/hub/useListen';
import { Icon } from '@/components/ui/Icon';
import { lessonById, type IeltsLesson } from '@/data/hub/ielts-speaking';
import { buildVoiceReport } from '@/services/hub/voice-report';
import { speak } from '@/services/hub/speak';
import { useHubStore } from '@/store/useHubStore';

type DrillResult = { wpm: number | null; fillerRate: number; ok: boolean; words: number };

/** Một bài trong lộ trình: giải thích, cụm từ, bài tập ghi âm, bài mẫu, lỗi và danh sách tự kiểm. */
export default function IeltsLessonPage() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const lesson = lessonById(id);
  if (!lesson) {
    return (
      <HubScreen title="Không tìm thấy bài" back>
        <Text style={{ color: HUB.body }}>Bài này không còn trong lộ trình.</Text>
      </HubScreen>
    );
  }
  return <Lesson lesson={lesson} />;
}

function Lesson({ lesson }: { lesson: IeltsLesson }) {
  const listen = useListen();
  const completeIelts = useHubStore((s) => s.completeIelts);
  const isDone = useHubStore((s) => Boolean(s.ieltsDone[lesson.id]));
  const [checked, setChecked] = useState<boolean[]>(() => lesson.checklist.map(() => false));
  const [results, setResults] = useState<Record<number, DrillResult>>({});
  const [activeDrill, setActiveDrill] = useState<number | null>(null);
  const pendingDrill = useRef<number | null>(null);
  const durationRef = useRef(0);

  // Khi micro vừa dừng hẳn, dựng kết quả cho bài tập đang ghi.
  useEffect(() => {
    if (listen.listening || pendingDrill.current === null) return;
    const idx = pendingDrill.current;
    pendingDrill.current = null;
    if (!listen.text.trim()) {
      setActiveDrill(null);
      return;
    }
    const report = buildVoiceReport({
      transcript: listen.text,
      segments: listen.segments,
      eventTimes: listen.times,
      durationMs: durationRef.current,
    });
    const rate = report.wordCount > 0 ? report.fillers.total / report.wordCount : 0;
    const wpmOk = report.wpm !== null && report.wpm >= lesson.target.wpmMin && report.wpm <= lesson.target.wpmMax;
    const fillerOk = rate <= lesson.target.fillerRateMax;
    setResults((r) => ({ ...r, [idx]: { wpm: report.wpm, fillerRate: rate, ok: wpmOk && fillerOk, words: report.wordCount } }));
    setActiveDrill(null);
    // listen.text và các mốc thay đổi cùng lúc với micro; chỉ cần chạy khi micro dừng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listen.listening, listen.text]);

  const toggleDrill = (i: number) => {
    if (listen.listening) {
      durationRef.current = listen.elapsed();
      pendingDrill.current = activeDrill;
      listen.stop();
      return;
    }
    setActiveDrill(i);
    listen.start();
  };

  const allChecked = checked.every(Boolean);
  const hasRecording = Object.keys(results).length > 0;
  const canFinish = allChecked && hasRecording && !isDone;

  return (
    <HubScreen title={lesson.title} subtitle={lesson.goal} back>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {lesson.criteria.map((c) => (
          <Text key={c} style={{ color: HUB.body, fontSize: 11, borderWidth: 1, borderColor: HUB.line, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
            {c === 'fluency' ? 'Lưu loát' : c === 'lexical' ? 'Vốn từ' : c === 'grammar' ? 'Ngữ pháp' : 'Phát âm'}
          </Text>
        ))}
      </View>

      <View style={[GLASS_CARD, { padding: 16, gap: 8 }]}>
        <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Hiểu trước khi nói</Text>
        {lesson.explanation.map((line, i) => (
          <Text key={i} style={{ color: HUB.body, fontSize: 14, lineHeight: 21 }}>{line}</Text>
        ))}
      </View>

      <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
        <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Cụm từ mẫu</Text>
        <Text style={{ color: HUB.muted, fontSize: 12 }}>Bấm để nghe.</Text>
        {lesson.phrases.map((p) => (
          <Pressable key={p.phrase} accessibilityRole="button" accessibilityLabel={`Nghe ${p.phrase}`} onPress={() => speak(p.phrase)} style={{ gap: 2, paddingVertical: 4 }}>
            <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>{p.phrase}</Text>
            <Text style={{ color: HUB.body, fontSize: 13 }}>{p.meaningVi} · {p.use}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>Nói theo cụm từ</Text>
      <Text style={{ color: HUB.muted, fontSize: 12, marginTop: -10 }}>
        Ghi âm từng cụm. Từ nào đúng, sai hiện ngay bên dưới.
      </Text>
      {lesson.phrases.map((p) => (
        <SayItCard key={p.phrase} id={`${lesson.id}:${p.phrase}`} phrase={p.phrase} meaningVi={p.meaningVi} />
      ))}

      <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '800' }}>Bài tập ghi âm</Text>
      <Text style={{ color: HUB.muted, fontSize: 12, marginTop: -10 }}>
        Mục tiêu: {lesson.target.wpmMin}–{lesson.target.wpmMax} từ/phút, từ đệm dưới {Math.round(lesson.target.fillerRateMax * 100)}%.
      </Text>
      {!listen.supported ? <Text style={{ color: HUB.amber, fontSize: 12 }}>Ghi âm cần Chrome trên máy tính hoặc Android.</Text> : null}
      {lesson.drills.map((d, i) => {
        const r = results[i];
        const recording = listen.listening && activeDrill === i;
        return (
          <View key={`${d.prompt}-${i}`} style={[GLASS_CARD, { padding: 14, gap: 8 }]}>
            <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>{d.part === 'all' ? 'TỔNG HỢP' : `PART ${d.part}`}</Text>
            <Text style={{ color: HUB.ink, fontSize: 15, lineHeight: 22 }}>{d.prompt}</Text>
            {d.hint ? <Text style={{ color: HUB.body, fontSize: 12 }}>Gợi ý: {d.hint}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable accessibilityRole="button" accessibilityLabel="Nghe câu hỏi" onPress={() => speak(d.prompt)} style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.glassStrong }}>
                <Icon name="volume" size={18} color={HUB.blue} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={recording ? 'Dừng ghi' : 'Ghi âm trả lời'}
                disabled={!listen.supported || (listen.listening && activeDrill !== i)}
                onPress={() => toggleDrill(i)}
                style={{ flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: recording ? HUB.red : HUB.blue, opacity: listen.supported ? 1 : 0.5 }}
              >
                <Icon name="mic" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800' }}>{recording ? 'Dừng' : r ? 'Ghi lại' : 'Ghi âm'}</Text>
              </Pressable>
            </View>
            {r ? (
              <Text style={{ color: r.ok ? '#2E7D4F' : '#A8741A', fontSize: 13, fontWeight: '700' }}>
                {r.ok ? 'Đạt mục tiêu' : 'Chưa đạt'}: {r.wpm ?? '—'} từ/phút · từ đệm {Math.round(r.fillerRate * 100)}% · {r.words} từ
              </Text>
            ) : null}
          </View>
        );
      })}

      <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
        <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Bài mẫu</Text>
        <Text style={{ color: HUB.muted, fontSize: 12 }}>Câu hỏi: {lesson.model.prompt}</Text>
        <Text style={{ color: HUB.ink, fontSize: 15, lineHeight: 23 }}>{lesson.model.answer}</Text>
        <Pressable accessibilityRole="button" onPress={() => speak(lesson.model.answer)} style={{ height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: HUB.glassStrong }}>
          <Icon name="play" size={16} color={HUB.blue} />
          <Text style={{ color: HUB.ink, fontWeight: '700' }}>Nghe bài mẫu</Text>
        </Pressable>
        <Text style={{ color: HUB.ink, fontSize: 13, fontWeight: '800', marginTop: 4 }}>Vì sao bài này tốt</Text>
        {lesson.model.whyGood.map((w) => (
          <Text key={w} style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>• {w}</Text>
        ))}
      </View>

      <View style={[GLASS_CARD, { padding: 16, gap: 8 }]}>
        <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Lỗi người học hay mắc</Text>
        {lesson.mistakes.map((m) => (
          <Text key={m} style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>• {m}</Text>
        ))}
      </View>

      <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
        <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Tự kiểm trước khi xong</Text>
        {lesson.checklist.map((item, i) => (
          <Pressable
            key={item}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: checked[i] }}
            onPress={() => setChecked((c) => c.map((v, k) => (k === i ? !v : v)))}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}
          >
            <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: HUB.blue, alignItems: 'center', justifyContent: 'center', backgroundColor: checked[i] ? HUB.blue : 'transparent' }}>
              {checked[i] ? <Icon name="check" size={14} color="#fff" strokeWidth={2.4} /> : null}
            </View>
            <Text style={{ color: HUB.ink, fontSize: 14, flex: 1 }}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!canFinish && !isDone}
        onPress={() => completeIelts(lesson.id)}
        style={{ height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: isDone ? '#2E7D4F' : canFinish ? HUB.blue : HUB.glassStrong, opacity: canFinish || isDone ? 1 : 0.6 }}
      >
        <Text style={{ color: isDone || canFinish ? '#fff' : HUB.muted, fontWeight: '800', fontSize: 15 }}>
          {isDone ? 'Đã hoàn thành bài này' : canFinish ? 'Đánh dấu hoàn thành' : 'Ghi âm ít nhất một bài tập và tích đủ danh sách'}
        </Text>
      </Pressable>
    </HubScreen>
  );
}
