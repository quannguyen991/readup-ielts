import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { HUB_UI, HubBar, HubHero, HubPanel, HubTag } from '@/components/hub/HubUi';
import { Icon } from '@/components/ui/Icon';
import { DESCRIPTORS, bandLabel, descriptorFor, nextDescriptor } from '@/data/hub/band-descriptors';
import { TARGET_WORDS } from '@/services/hub/answer-feedback';
import { modelAnswerFor } from '@/services/hub/hub-questions';
import { speak } from '@/services/hub/speak';
import { CRITERIA, type CriterionKey, type SpeakingGrade } from '@/services/speaking/grade';
import { markFillers } from '@/services/speaking/metrics';
import { useAuthStore } from '@/store/useAuthStore';
import { useSpeakingStore } from '@/store/useSpeakingStore';

const KEYS: CriterionKey[] = ['fc', 'lr', 'gr', 'pr'];
const SHORT: Record<CriterionKey, string> = { fc: 'Trôi chảy & mạch lạc', lr: 'Vốn từ', gr: 'Ngữ pháp', pr: 'Phát âm' };
const ICON: Record<CriterionKey, string> = { fc: '🌊', lr: '📚', gr: '✏️', pr: '🎙️' };
const PART_NAME = { 1: 'Part 1 · Hỏi đáp', 2: 'Part 2 · Cue card', 3: 'Part 3 · Bàn luận' } as const;

const bandColor = (b: number | null) => (b === null ? HUB_UI.muted : b >= 7 ? HUB_UI.green : b >= 5.5 ? HUB_UI.purple : '#D9503E');
const fmt = (b: number | null) => (b === null ? '—' : b.toFixed(1));

function friendly(message: string, code?: string): string {
  if (code === 'server_error' || code === 'timeout' || code === 'network' || code === 'rate_limited') return 'AI đang bận nên chưa chấm được. Lượt AI đã được hoàn lại, thử lại sau ít phút.';
  if (code === 'bad_response') return 'AI trả về phiếu chấm không hợp lệ. Lượt AI đã được hoàn lại, thử chấm lại nhé.';
  return message.split('\n')[0]!.slice(0, 300);
}

/**
 * PHIẾU CHẤM CHI TIẾT một lượt luyện nói: band tổng, điểm bốn tiêu chí đối chiếu với thang mô tả,
 * kết quả từng Part, đáp án mẫu và lỗi từng câu, rồi kế hoạch luyện tiếp.
 * Chấm bằng AI đúng MỘT lần khi mở lượt chưa chấm; chỉ số đo tại máy luôn hiện dù AI chưa có.
 */
export default function HubResult() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const attempt = useSpeakingStore((s) => s.attempts.find((a) => a.id === id));
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;
  const [loading, setLoading] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const requested = useRef(false);
  const [open, setOpen] = useState<CriterionKey | null>(null);

  const grade = () => {
    if (!attempt) return;
    if (!tokenRef.current) {
      setNeedLogin(true);
      return;
    }
    setNeedLogin(false);
    setLoading(true);
    useSpeakingStore.getState().setGradeError(attempt.id, null);
    fetch('/api/speaking/grade', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenRef.current}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ typed: false, answers: attempt.answers.map((x) => ({ questionId: x.questionId, question: x.question, transcript: x.transcript, segments: x.segments, metrics: x.metrics })) }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { grade?: SpeakingGrade; error?: string; code?: string };
        if (!res.ok || !data.grade) {
          if (res.status === 401) setNeedLogin(true);
          throw Object.assign(new Error(data.error ?? 'Chấm bài thất bại.'), { code: data.code });
        }
        return data.grade;
      })
      .then((g) => useSpeakingStore.getState().setGrade(attempt.id, g))
      .catch((e: Error & { code?: string }) => useSpeakingStore.getState().setGradeError(attempt.id, friendly(e.message, e.code)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!attempt || attempt.grade || attempt.gradeError || requested.current) return;
    requested.current = true;
    grade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt?.id]);

  const g = attempt?.grade ?? null;

  /** Kết quả kỹ thuật theo từng Part: bốn phép kiểm có mục tiêu rõ ràng. */
  const parts = useMemo(() => {
    if (!attempt) return [];
    return ([1, 2, 3] as const)
      .map((p) => {
        const list = attempt.answers.filter((a) => a.part === p);
        if (!list.length) return null;
        const avg = (f: (a: (typeof list)[number]) => number | null) => {
          const v = list.map(f).filter((x): x is number => x !== null);
          return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
        };
        const words = avg((a) => a.metrics.words) ?? 0;
        const wpm = avg((a) => a.metrics.wpm);
        const fillRate = list.reduce((n, a) => n + a.metrics.fillers, 0) / Math.max(1, list.reduce((n, a) => n + a.metrics.words, 0));
        const clarity = avg((a) => a.metrics.avgConfidence);
        const [lo, hi] = TARGET_WORDS[p];
        const checks = [
          { label: 'Độ dài', value: `${Math.round(words)} từ`, target: `${lo}–${hi}`, ok: words >= lo && words <= hi * 1.3 },
          { label: 'Tốc độ', value: wpm === null ? '—' : `${Math.round(wpm)} từ/phút`, target: '110–160', ok: wpm !== null && wpm >= 100 && wpm <= 175 },
          { label: 'Từ đệm', value: `${Math.round(fillRate * 100)}%`, target: '≤ 4%', ok: fillRate <= 0.04 },
          { label: 'Độ rõ', value: clarity === null ? '—' : `${Math.round(clarity * 100)}%`, target: '≥ 75%', ok: clarity !== null && clarity >= 0.75 },
        ];
        return { part: p, count: list.length, checks, score: checks.filter((c) => c.ok).length };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [attempt]);

  if (!attempt) {
    return (
      <HubScreen title="Phiếu chấm" back>
        <HubPanel title="Không tìm thấy lượt này" icon="cloud">
          <Text style={{ color: HUB_UI.muted, fontSize: 14.5 }}>Lượt luyện này không còn trong máy.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/hub/parts' as never)} style={{ alignSelf: 'flex-start', paddingHorizontal: 16, height: 42, borderRadius: 12, backgroundColor: HUB_UI.purple, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Về Luyện theo Part</Text>
          </Pressable>
        </HubPanel>
      </HubScreen>
    );
  }

  const overall = g?.overall ?? null;
  const m = attempt.metrics;
  const bands = g ? KEYS.map((k) => g.criteria[k].band) : [];
  const weakest = g ? KEYS.filter((k) => g.criteria[k].band !== null).sort((a, b) => (g.criteria[a].band as number) - (g.criteria[b].band as number))[0] ?? null : null;

  return (
    <HubScreen title="Phiếu chấm chi tiết" subtitle={attempt.titleVi} back padBottom={140}>
      <HubHero
        eyebrow={`KẾT QUẢ · ${attempt.answers.length} CÂU`}
        title={overall !== null ? `Band ${fmt(overall)}` : loading ? 'AI đang chấm bài…' : 'Chưa có band'}
        accent={overall !== null ? bandLabel(overall) + ' · theo 4 tiêu chí IELTS' : 'chỉ số đo tại máy bên dưới'}
        stats={[
          { value: String(m.words), label: 'Tổng số từ' },
          { value: m.wpm === null ? '—' : String(m.wpm), label: 'Từ/phút' },
          { value: String(m.fillers), label: 'Từ đệm' },
          { value: m.avgConfidence === null ? '—' : `${Math.round(m.avgConfidence * 100)}%`, label: 'Độ rõ giọng' },
        ]}
      />

      {!g ? (
        <HubPanel title={loading ? 'Đang chấm bằng AI' : 'Điểm AI'} icon="sparkle" badge={loading ? 'ĐANG CHẠY' : undefined}>
          {loading ? <Text style={{ color: HUB_UI.navy, fontSize: 15, fontWeight: '700' }}>AI đang đọc bài nói, đối chiếu với bốn tiêu chí chấm. Việc này mất khoảng nửa phút…</Text> : null}
          {needLogin ? <Text style={{ color: '#B45309', fontSize: 14.5, fontWeight: '700' }}>Đăng nhập để AI chấm band và viết phiếu chi tiết. Chỉ số đo tại máy vẫn xem được ở dưới.</Text> : null}
          {attempt.gradeError ? <Text style={{ color: '#B45309', fontSize: 14.5, fontWeight: '700' }}>{attempt.gradeError}</Text> : null}
          {!loading && !needLogin ? (
            <Pressable accessibilityRole="button" onPress={() => { requested.current = true; grade(); }} style={{ alignSelf: 'flex-start', paddingHorizontal: 16, height: 42, borderRadius: 12, backgroundColor: HUB_UI.purple, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Chấm lại bằng AI</Text>
            </Pressable>
          ) : null}
        </HubPanel>
      ) : (
        <>
          <HubPanel title="Nhận xét tổng" icon="trophy" badge={`Band ${fmt(overall)}`}>
            <Text style={{ color: HUB_UI.navy, fontSize: 15.5, lineHeight: 24, fontWeight: '600' }}>{g.summaryVi}</Text>
            {g.capsApplied.length ? (
              <View style={{ gap: 4, padding: 12, borderRadius: 14, backgroundColor: '#FFF4E5' }}>
                {g.capsApplied.map((c) => (
                  <Text key={c} style={{ color: '#B45309', fontSize: 13.5, lineHeight: 19, fontWeight: '700' }}>• {c}</Text>
                ))}
              </View>
            ) : null}
            {g.strengths.length ? (
              <View style={{ gap: 6 }}>
                <Text style={{ color: HUB_UI.navy, fontSize: 15, fontWeight: '900' }}>Điểm làm tốt</Text>
                {g.strengths.map((s) => (
                  <View key={s} style={{ flexDirection: 'row', gap: 8 }}>
                    <Text style={{ color: HUB_UI.green, fontWeight: '900' }}>✓</Text>
                    <Text style={{ color: HUB_UI.navy, fontSize: 14.5, lineHeight: 21, flex: 1 }}>{s}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </HubPanel>

          <HubPanel title="Điểm theo tiêu chí chấm" icon="medal" badge="4 TIÊU CHÍ">
            {KEYS.map((k) => {
              const c = g.criteria[k];
              const band = c.band;
              const cur = band === null ? null : descriptorFor(k, band);
              const nxt = band === null ? null : nextDescriptor(k, band);
              const isOpen = open === k;
              const meta = CRITERIA.find((x) => x.key === k)!;
              return (
                <View key={k} style={{ gap: 8, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: HUB_UI.line, backgroundColor: '#FFFFFF' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 26 }}>{ICON[k]}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: HUB_UI.navy, fontSize: 16, fontWeight: '900' }}>{SHORT[k]}</Text>
                      <Text style={{ color: HUB_UI.muted, fontSize: 12.5, fontWeight: '700' }}>{meta.en}</Text>
                    </View>
                    <Text style={{ color: bandColor(band), fontSize: 28, fontWeight: '900' }}>{fmt(band)}</Text>
                  </View>
                  <HubBar ratio={(band ?? 0) / 9} color={bandColor(band)} />
                  {k === 'pr' ? <Text style={{ color: HUB_UI.muted, fontSize: 12.5, lineHeight: 18 }}>Phát âm là ước lượng từ độ rõ của bộ nhận giọng, không thay được giám khảo thật.</Text> : null}
                  <Text style={{ color: HUB_UI.navy, fontSize: 14.5, lineHeight: 21 }}>{c.explanationVi}</Text>

                  {cur ? (
                    <View style={{ gap: 4, padding: 12, borderRadius: 14, backgroundColor: HUB_UI.wash }}>
                      <HubTag label={`Thang mô tả · Band ${cur.band} ${bandLabel(cur.band)}`} />
                      <Text style={{ color: HUB_UI.navy, fontSize: 14, lineHeight: 20 }}>{cur.text}</Text>
                    </View>
                  ) : null}
                  {nxt ? (
                    <View style={{ gap: 4, padding: 12, borderRadius: 14, backgroundColor: '#F1FBF5', borderWidth: 1, borderColor: '#BFE7CD' }}>
                      <Text style={{ color: '#166534', fontSize: 13, fontWeight: '900' }}>ĐỂ LÊN BAND {nxt.band}</Text>
                      <Text style={{ color: HUB_UI.navy, fontSize: 14, lineHeight: 20 }}>{nxt.text}</Text>
                    </View>
                  ) : null}
                  {c.fixes.length ? (
                    <View style={{ gap: 4 }}>
                      <Text style={{ color: HUB_UI.navy, fontSize: 14, fontWeight: '900' }}>Việc cần sửa</Text>
                      {c.fixes.map((f) => (
                        <View key={f} style={{ flexDirection: 'row', gap: 8 }}>
                          <Text style={{ color: HUB_UI.purple, fontWeight: '900' }}>→</Text>
                          <Text style={{ color: HUB_UI.navy, fontSize: 14, lineHeight: 20, flex: 1 }}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  <Pressable accessibilityRole="button" onPress={() => setOpen(isOpen ? null : k)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: HUB_UI.purple, fontWeight: '900', fontSize: 14 }}>{isOpen ? 'Ẩn thang Band 5–9' : 'Xem cả thang Band 5–9'}</Text>
                    <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={14} color={HUB_UI.purple} />
                  </Pressable>
                  {isOpen ? (
                    <View style={{ gap: 6 }}>
                      {[5, 6, 7, 8, 9].map((b) => {
                        const mine = band !== null && Math.floor(band) === b;
                        return (
                          <View key={b} style={{ flexDirection: 'row', gap: 10, padding: 10, borderRadius: 12, backgroundColor: mine ? '#EDE7FF' : '#FFFFFF', borderWidth: 1.5, borderColor: mine ? HUB_UI.purple : HUB_UI.line }}>
                            <Text style={{ color: mine ? HUB_UI.purple : HUB_UI.muted, fontWeight: '900', width: 56 }}>Band {b}</Text>
                            <Text style={{ color: HUB_UI.navy, fontSize: 13.5, lineHeight: 19, flex: 1 }}>{DESCRIPTORS[k][b]}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
            <Text style={{ color: HUB_UI.muted, fontSize: 12.5, lineHeight: 18 }}>Band tổng = trung bình bốn tiêu chí, làm tròn kiểu IELTS ({bands.map((b) => fmt(b)).join(' + ')}). Đây là điểm luyện tập, không phải điểm thi thật.</Text>
          </HubPanel>
        </>
      )}

      <HubPanel title="Kết quả từng Part" icon="planet" badge={`${parts.length} PART`}>
        {parts.map((p) => (
          <View key={p.part} style={{ gap: 8, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: HUB_UI.line, backgroundColor: '#FFFFFF' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ color: HUB_UI.navy, fontSize: 16, fontWeight: '900', flex: 1 }}>{PART_NAME[p.part]}</Text>
              <HubTag label={`${p.count} câu`} color={HUB_UI.muted} />
              <Text style={{ color: p.score >= 3 ? HUB_UI.green : p.score >= 2 ? HUB_UI.purple : '#D9503E', fontSize: 18, fontWeight: '900' }}>{p.score}/4 đạt</Text>
            </View>
            <HubBar ratio={p.score / 4} color={p.score >= 3 ? HUB_UI.green : HUB_UI.purple} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {p.checks.map((c) => (
                <View key={c.label} style={{ flexGrow: 1, flexBasis: 130, gap: 2, padding: 10, borderRadius: 12, backgroundColor: c.ok ? '#EAF8EF' : '#FFF4E5' }}>
                  <Text style={{ color: HUB_UI.muted, fontSize: 12, fontWeight: '400' }}>{c.label.toUpperCase()} · {c.ok ? '✓' : '!'}</Text>
                  <Text style={{ color: HUB_UI.navy, fontSize: 16, fontWeight: '900' }}>{c.value}</Text>
                  <Text style={{ color: HUB_UI.muted, fontSize: 12 }}>mục tiêu {c.target}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </HubPanel>

      <HubPanel title="Đáp án chi tiết từng câu" icon="note" badge={`${attempt.answers.length} CÂU`}>
        {attempt.answers.map((a, i) => {
          const model = modelAnswerFor(a.question);
          const fixes = g?.fixes.filter((f) => f.questionIndex === i) ?? [];
          const sample = g?.samples.find((x) => x.questionIndex === i);
          return (
            <View key={`${a.questionId}-${i}`} style={{ gap: 10, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: HUB_UI.line, backgroundColor: '#FFFFFF' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <HubTag label={`Câu ${i + 1} · Part ${a.part}`} />
                <HubTag label={`${a.metrics.words} từ`} color={HUB_UI.muted} />
                {a.metrics.wpm ? <HubTag label={`${a.metrics.wpm} từ/phút`} color={HUB_UI.muted} /> : null}
              </View>
              <Text style={{ color: HUB_UI.navy, fontSize: 16, fontWeight: '900', lineHeight: 23 }}>{a.question}</Text>

              <View style={{ gap: 4, padding: 12, borderRadius: 14, backgroundColor: HUB_UI.wash }}>
                <Text style={{ color: HUB_UI.muted, fontSize: 12.5, fontWeight: '400' }}>BÀI NÓI CỦA BẠN</Text>
                <Text style={{ color: HUB_UI.navy, fontSize: 14.5, lineHeight: 22 }}>
                  {markFillers(a.transcript).map((piece, j) => (
                    <Text key={j} style={piece.filler ? { backgroundColor: '#FFE1DC', color: '#B42318', fontWeight: '400' } : undefined}>{piece.text}</Text>
                  ))}
                </Text>
              </View>

              {fixes.length ? (
                <View style={{ gap: 6 }}>
                  <Text style={{ color: HUB_UI.navy, fontSize: 14, fontWeight: '900' }}>Chỗ cần sửa</Text>
                  {fixes.map((f, j) => (
                    <View key={j} style={{ gap: 3, padding: 10, borderRadius: 12, backgroundColor: '#FFF7F5', borderWidth: 1, borderColor: '#F6D5CF' }}>
                      <Text style={{ color: '#B42318', fontSize: 14, textDecorationLine: 'line-through' }}>{f.quote}</Text>
                      <Text style={{ color: HUB_UI.green, fontSize: 14, fontWeight: '400' }}>{f.better}</Text>
                      <Text style={{ color: HUB_UI.muted, fontSize: 13, lineHeight: 18 }}>{f.problemVi}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {sample ? (
                <View style={{ gap: 4, padding: 12, borderRadius: 14, backgroundColor: '#F1FBF5', borderWidth: 1.5, borderColor: '#BFE7CD' }}>
                  <Text style={{ color: '#166534', fontSize: 13, fontWeight: '900' }}>BẢN CỦA BẠN SAU KHI NÂNG CẤP</Text>
                  <Text style={{ color: HUB_UI.navy, fontSize: 14.5, lineHeight: 22 }}>{sample.improved}</Text>
                  <Text style={{ color: HUB_UI.muted, fontSize: 13, lineHeight: 18 }}>{sample.whyVi}</Text>
                </View>
              ) : null}

              {model ? (
                <View style={{ gap: 6, padding: 12, borderRadius: 14, backgroundColor: '#FFFBF0', borderWidth: 1.5, borderColor: '#F2DFA6' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: '#8A6100', fontSize: 13, fontWeight: '900', flex: 1 }}>ĐÁP ÁN MẪU · BAND 7–8</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel="Nghe đáp án mẫu" onPress={() => speak(model)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Icon name="volume" size={15} color="#8A6100" />
                      <Text style={{ color: '#8A6100', fontWeight: '900', fontSize: 13.5 }}>Nghe</Text>
                    </Pressable>
                  </View>
                  <Text style={{ color: HUB_UI.navy, fontSize: 14.5, lineHeight: 22 }}>{model}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </HubPanel>

      {g && weakest ? (
        <HubPanel title="Kế hoạch luyện tiếp" icon="rocket">
          <Text style={{ color: HUB_UI.navy, fontSize: 15, lineHeight: 22, fontWeight: '700' }}>Tiêu chí thấp nhất của bạn là {SHORT[weakest]} (Band {fmt(g.criteria[weakest].band)}). Tập trung vào đây trước:</Text>
          {PLAN[weakest].map((s) => (
            <Pressable key={s.route} accessibilityRole="button" onPress={() => router.push(s.route as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: HUB_UI.line, backgroundColor: '#FFFFFF' }}>
              <Text style={{ fontSize: 24 }}>{s.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: HUB_UI.navy, fontSize: 15, fontWeight: '900' }}>{s.title}</Text>
                <Text style={{ color: HUB_UI.muted, fontSize: 13.5 }}>{s.note}</Text>
              </View>
              <Icon name="chevron-right" size={16} color={HUB_UI.muted} />
            </Pressable>
          ))}
        </HubPanel>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ flexGrow: 1, flexBasis: 200, height: 50, borderRadius: 14, backgroundColor: HUB_UI.purple, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 15.5 }}>Luyện lại đề này</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/hub/parts' as never)} style={{ flexGrow: 1, flexBasis: 200, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: HUB_UI.line, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: HUB_UI.navy, fontWeight: '900', fontSize: 15.5 }}>Chọn đề khác</Text>
        </Pressable>
      </View>
    </HubScreen>
  );
}

const PLAN: Record<CriterionKey, { icon: string; title: string; note: string; route: string }[]> = {
  fc: [
    { icon: '⚡', title: 'Gia sư: Nói trôi chảy', note: 'Hỏi nhanh, bỏ “um, uh”, học cụm nối ý', route: '/hub/tutor/fluency' },
    { icon: '🗒️', title: 'Luyện Part 2', note: 'Nói liền 1–2 phút theo cue card', route: '/hub/parts/2' },
  ],
  lr: [
    { icon: '💬', title: 'Gia sư: Thành ngữ & Collocation', note: '3 cụm tự nhiên mỗi buổi', route: '/hub/tutor/idioms' },
    { icon: '📈', title: 'Nâng cấp câu trả lời lên Band 8', note: 'Viết lại câu của bạn cao hơn một band', route: '/hub/tutor/band-upgrade' },
  ],
  gr: [
    { icon: '📚', title: 'Gia sư ngữ pháp', note: 'Bài tập ngắn, sửa lỗi ngay', route: '/hub/tutor/grammar' },
    { icon: '1️⃣', title: 'Luyện IELTS Part 1', note: 'Mở rộng câu: ý chính, lý do, ví dụ', route: '/hub/tutor/ielts-part1' },
  ],
  pr: [
    { icon: '🔤', title: '44 âm IPA', note: 'Phát âm từng âm, chấm điểm', route: '/hub/learn' },
    { icon: '🔁', title: 'Nói đuổi', note: 'Nói theo giọng bản ngữ', route: '/hub/shadow' },
  ],
};
