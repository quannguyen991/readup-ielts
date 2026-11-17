import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { HUB_UI, HubBar, HubPanel, HubTag } from '@/components/hub/HubUi';
import { Icon } from '@/components/ui/Icon';
import { localAnalysis, type AnswerFeedback, type CriterionKey, type FeedbackPart, type LocalPoint } from '@/services/hub/answer-feedback';
import { playSfx } from '@/services/hub/sfx';
import { speak } from '@/services/hub/speak';
import { useAuthStore } from '@/store/useAuthStore';

const CRITERION_VI: Record<CriterionKey, string> = { fluency: 'Trôi chảy', vocabulary: 'Từ vựng', grammar: 'Ngữ pháp', coherence: 'Mạch lạc' };
const TONE: Record<LocalPoint['tone'], { icon: string; color: string; bg: string }> = {
  good: { icon: '✅', color: '#166534', bg: '#EAF8EF' },
  warn: { icon: '⚠️', color: '#B45309', bg: '#FFF4E5' },
  tip: { icon: '💡', color: '#4C3A9E', bg: '#F3F0FB' },
};

type State = { status: 'idle' | 'loading' | 'done' | 'error'; data?: AnswerFeedback; error?: string; code?: string };
/** Nhớ kết quả theo (câu hỏi + bài nói) để quay lại câu cũ không tốn thêm lượt AI. */
const CACHE = new Map<string, AnswerFeedback>();

export type AnalysisInput = { part: FeedbackPart; question: string; transcript: string; wpm: number | null; fillers: number; ms: number };

function Dot({ delay, reduced }: { delay: number; reduced: boolean }) {
  const t = useSharedValue(0.3);
  useEffect(() => {
    if (!reduced) t.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 380 }), withTiming(0.3, { duration: 380 })), -1, false));
    return () => cancelAnimation(t);
  }, [delay, reduced, t]);
  const style = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: -4 * t.value }] }));
  return <Animated.View style={[{ width: 9, height: 9, borderRadius: 5, backgroundColor: HUB_UI.purple }, style]} />;
}

/** Thanh quét sáng chạy qua khối chờ, báo AI đang làm việc. */
function Shimmer({ reduced }: { reduced: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!reduced) t.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }), -1, false);
    return () => cancelAnimation(t);
  }, [reduced, t]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -120 + t.value * 560 }] }));
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: HUB_UI.wash, overflow: 'hidden' }}>
      <Animated.View style={[{ width: 120, height: 8, borderRadius: 4, backgroundColor: '#CDBFF5' }, style]} />
    </View>
  );
}

const STEPS = ['AI đang đọc bài nói của bạn…', 'Đang chấm bốn tiêu chí…', 'Đang tìm lỗi và từ có thể nâng cấp…', 'Đang viết bản gợi ý…'];

function Loading() {
  const reduced = !!useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => Math.min(STEPS.length - 1, v + 1)), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={{ gap: 12, paddingVertical: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'flex-end', height: 16 }}>
          <Dot delay={0} reduced={reduced} />
          <Dot delay={140} reduced={reduced} />
          <Dot delay={280} reduced={reduced} />
        </View>
        <Text style={{ color: HUB_UI.navy, fontSize: 15, fontWeight: '400' }}>{STEPS[i]}</Text>
      </View>
      <Shimmer reduced={reduced} />
      <Shimmer reduced={reduced} />
    </View>
  );
}

function LocalList({ points }: { points: LocalPoint[] }) {
  return (
    <View style={{ gap: 8 }}>
      {points.map((p, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, backgroundColor: TONE[p.tone].bg }}>
          <Text style={{ fontSize: 16 }}>{TONE[p.tone].icon}</Text>
          <Text style={{ color: HUB_UI.navy, fontSize: 14.5, lineHeight: 21, flex: 1 }}>{p.textVi}</Text>
        </View>
      ))}
    </View>
  );
}

function bandColor(b: number): string {
  return b >= 7 ? HUB_UI.green : b >= 5.5 ? HUB_UI.purple : '#D9503E';
}

function Detail({ f }: { f: AnswerFeedback }) {
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 5, borderColor: bandColor(f.band), alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: bandColor(f.band), fontSize: 28, fontWeight: '900' }}>{f.band.toFixed(1)}</Text>
          <Text style={{ color: HUB_UI.muted, fontSize: 11, fontWeight: '400', marginTop: -2 }}>BAND ƯỚC LƯỢNG</Text>
        </View>
        <Text style={{ color: HUB_UI.navy, fontSize: 15, lineHeight: 22, flex: 1, fontWeight: '600' }}>{f.summaryVi}</Text>
      </View>
      <Text style={{ color: HUB_UI.muted, fontSize: 12.5, fontWeight: '700' }}>Chấm theo nội dung chữ; không đánh giá phát âm. Chỉ để tham khảo, không phải điểm thi thật.</Text>

      <View style={{ gap: 10 }}>
        {f.criteria.map((c) => (
          <View key={c.key} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: HUB_UI.navy, fontSize: 14.5, fontWeight: '900' }}>{CRITERION_VI[c.key]}</Text>
              <Text style={{ color: bandColor(c.score), fontSize: 14.5, fontWeight: '900' }}>{c.score.toFixed(1)}</Text>
            </View>
            <HubBar ratio={c.score / 9} color={bandColor(c.score)} />
            <Text style={{ color: HUB_UI.muted, fontSize: 13.5, lineHeight: 19 }}>{c.noteVi}</Text>
          </View>
        ))}
      </View>

      {f.strengthsVi.length ? (
        <View style={{ gap: 6 }}>
          <Text style={{ color: HUB_UI.navy, fontSize: 15, fontWeight: '900' }}>Điểm làm tốt</Text>
          {f.strengthsVi.map((s) => (
            <View key={s} style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={{ color: HUB_UI.green, fontWeight: '900' }}>✓</Text>
              <Text style={{ color: HUB_UI.navy, fontSize: 14.5, lineHeight: 21, flex: 1 }}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {f.fixes.length ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: HUB_UI.navy, fontSize: 15, fontWeight: '900' }}>Sửa lỗi</Text>
          {f.fixes.map((x, i) => (
            <View key={i} style={{ gap: 4, padding: 12, borderRadius: 14, backgroundColor: '#FFF7F5', borderWidth: 1, borderColor: '#F6D5CF' }}>
              <Text style={{ color: '#B42318', fontSize: 14.5, textDecorationLine: 'line-through' }}>{x.said}</Text>
              <Text style={{ color: HUB_UI.green, fontSize: 14.5, fontWeight: '400' }}>{x.better}</Text>
              <Text style={{ color: HUB_UI.muted, fontSize: 13.5, lineHeight: 19 }}>{x.whyVi}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {f.upgrades.length ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: HUB_UI.navy, fontSize: 15, fontWeight: '900' }}>Nâng cấp từ vựng</Text>
          {f.upgrades.map((u, i) => (
            <View key={i} style={{ gap: 4, padding: 12, borderRadius: 14, backgroundColor: HUB_UI.wash }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <HubTag label={u.from} color={HUB_UI.muted} bg="#FFFFFF" />
                <Icon name="arrow-right" size={14} color={HUB_UI.purple} />
                <HubTag label={u.to} />
              </View>
              <Text style={{ color: HUB_UI.muted, fontSize: 13.5, lineHeight: 19 }}>{u.whyVi}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ gap: 8, padding: 14, borderRadius: 16, backgroundColor: '#F1FBF5', borderWidth: 1.5, borderColor: '#BFE7CD' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#166534', fontSize: 15, fontWeight: '900', flex: 1 }}>Bản gợi ý viết lại</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Nghe bản gợi ý" onPress={() => speak(f.improved)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon name="volume" size={16} color="#166534" />
            <Text style={{ color: '#166534', fontWeight: '900', fontSize: 14 }}>Nghe</Text>
          </Pressable>
        </View>
        <Text style={{ color: HUB_UI.navy, fontSize: 15, lineHeight: 24 }}>{f.improved}</Text>
      </View>

      {f.nextVi.length ? (
        <View style={{ gap: 6 }}>
          <Text style={{ color: HUB_UI.navy, fontSize: 15, fontWeight: '900' }}>Luyện tiếp</Text>
          {f.nextVi.map((s, i) => (
            <View key={s} style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: HUB_UI.purple, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>{i + 1}</Text>
              </View>
              <Text style={{ color: HUB_UI.navy, fontSize: 14.5, lineHeight: 21, flex: 1 }}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Phân tích sau khi trả lời xong. Phần "nhanh tại máy" hiện ngay; AI tự chạy nền (cần đăng nhập, trừ một lượt AI)
 * rồi hiện điểm theo tiêu chí, lỗi kèm bản sửa, từ nâng cấp, bản viết lại và gợi ý luyện tiếp.
 */
export function AnswerAnalysis({ input }: { input: AnalysisInput }) {
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const local = useMemo(() => localAnalysis(input), [input]);
  const key = `${input.question}\n${input.transcript}`;
  const [state, setState] = useState<State>(() => {
    const hit = CACHE.get(key);
    return hit ? { status: 'done', data: hit } : { status: 'idle' };
  });
  const runId = useRef(0);
  const enough = input.transcript.trim().split(/\s+/).length >= 6;

  const run = async () => {
    if (!token) {
      setState({ status: 'error', code: 'auth', error: 'Đăng nhập để AI phân tích chi tiết câu trả lời.' });
      return;
    }
    const id = ++runId.current;
    setState({ status: 'loading' });
    try {
      const r = await fetch('/api/hub/feedback', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ part: input.part, question: input.question, transcript: input.transcript, wpm: input.wpm, fillers: input.fillers, durationSec: input.ms / 1000 }),
      });
      const j = (await r.json().catch(() => ({}))) as { feedback?: AnswerFeedback; error?: string; code?: string };
      if (id !== runId.current) return;
      if (r.ok && j.feedback) {
        CACHE.set(key, j.feedback);
        setState({ status: 'done', data: j.feedback });
        playSfx('analyze');
      } else {
        setState({ status: 'error', error: j.error ?? 'AI chưa phân tích được.', code: j.code });
      }
    } catch {
      if (id === runId.current) setState({ status: 'error', error: 'Không kết nối được. Kiểm tra mạng rồi thử lại.' });
    }
  };

  // Tự phân tích khi có bài nói mới (một lần cho mỗi bài), trừ khi đã có kết quả nhớ sẵn.
  useEffect(() => {
    if (!enough || CACHE.has(key)) return;
    void run();
    return () => {
      runId.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enough, token]);

  return (
    <HubPanel title="AI phân tích câu trả lời" icon="sparkle" badge={state.status === 'done' ? 'XONG' : state.status === 'loading' ? 'ĐANG CHẠY' : undefined}>
      {state.status === 'loading' ? <Loading /> : null}
      {state.status === 'done' && state.data ? <Detail f={state.data} /> : null}
      {state.status === 'error' ? (
        <View style={{ gap: 8, padding: 12, borderRadius: 14, backgroundColor: '#FFF4E5' }}>
          <Text style={{ color: '#B45309', fontSize: 14, lineHeight: 20, fontWeight: '700' }}>{state.error}</Text>
          {state.code !== 'auth' ? (
            <Pressable accessibilityRole="button" onPress={() => void run()} style={{ alignSelf: 'flex-start', paddingHorizontal: 14, height: 38, borderRadius: 12, backgroundColor: HUB_UI.purple, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>Thử lại</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {!enough ? <Text style={{ color: HUB_UI.muted, fontSize: 14 }}>Nói thêm vài câu để AI có đủ nội dung phân tích.</Text> : null}

      <Text style={{ color: HUB_UI.navy, fontSize: 15, fontWeight: '900', marginTop: 4 }}>Phân tích nhanh</Text>
      <LocalList points={local.points} />
    </HubPanel>
  );
}
