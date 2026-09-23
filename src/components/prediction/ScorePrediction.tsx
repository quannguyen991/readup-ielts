import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { SAT_RW_QUESTIONS } from '@/data/sat-rw-repository';
import { MATH_DOMAIN_LABEL, type MathDomain } from '@/lib/math/types';
import { combineTotal, MATH_WEIGHTS, predictSection, VERBAL_WEIGHTS, type Prediction, type Tally } from '@/services/prediction/score';
import { useMathStore } from '@/store/useMathStore';
import { useSatRwStore } from '@/store/useSatRwStore';
import { color } from '@/theme/tokens';

/** Chỉ lấy tối đa 150 câu GẦN NHẤT mỗi mảng — dự đoán phải theo trình độ hiện tại. */
const RECENT = 150;

export function useSatPredictions() {
  const sessions = useMathStore((s) => s.sessions);
  const rw = useSatRwStore((s) => s.attempts);
  return useMemo(() => {
    // `sessions` lưu mới trước; gom ngược từ mới về cũ, dừng mỗi mảng ở 150 câu.
    const math: Record<string, Tally> = {};
    for (const s of sessions) {
      for (const a of s.attempts) {
        const t = (math[a.domain] ??= { correct: 0, total: 0 });
        if (t.total >= RECENT) continue;
        t.total += 1;
        if (a.isCorrect) t.correct += 1;
      }
    }
    const domainOf = new Map(SAT_RW_QUESTIONS.map((q) => [q.id, q.domain]));
    const verbal: Record<string, Tally> = {};
    const recent = Object.entries(rw).sort(([, a], [, b]) => b.at.localeCompare(a.at));
    for (const [id, a] of recent) {
      const d = domainOf.get(id);
      if (!d) continue;
      const t = (verbal[d] ??= { correct: 0, total: 0 });
      if (t.total >= RECENT) continue;
      t.total += 1;
      if (a.correct) t.correct += 1;
    }
    const m = predictSection(math, MATH_WEIGHTS);
    const v = predictSection(verbal, VERBAL_WEIGHTS);
    return { math: m, verbal: v, total: m && v ? combineTotal(m, v) : null };
  }, [sessions, rw]);
}

const CARD = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 10px 26px rgba(30,41,99,0.08)' } as object;

function domainName(d: string | null): string {
  if (!d) return '';
  return (MATH_DOMAIN_LABEL as Record<string, string>)[d as MathDomain] ?? d;
}

/** Thanh 200–800 (hoặc 400–1600) với khoảng dự đoán được tô và vạch điểm giữa. */
function RangeBar({ low, mid, high, min, max, tone }: { low: number; mid: number; high: number; min: number; max: number; tone: string }) {
  const pct = (x: number) => `${((x - min) / (max - min)) * 100}%` as const;
  return (
    <View className="mt-3">
      <View className="h-3.5 overflow-hidden rounded-pill" style={{ backgroundColor: '#E8EEF8' }}>
        <View
          className="absolute h-3.5 rounded-pill"
          style={{ left: pct(low), width: `${((high - low) / (max - min)) * 100}%`, backgroundColor: tone, opacity: 0.85 }}
        />
      </View>
      <View className="absolute" style={{ left: pct(mid), top: -3, width: 3, height: 20, marginLeft: -1.5, borderRadius: 2, backgroundColor: color.ink }} />
      <View className="mt-1 flex-row justify-between">
        <Text className="font-sans text-label text-muted">{min}</Text>
        <Text className="font-sans text-label text-muted">{max}</Text>
      </View>
    </View>
  );
}

export function ScorePredictionCard({ section }: { section: 'math' | 'verbal' | 'total' }) {
  const all = useSatPredictions();
  const title = section === 'math' ? 'SAT Math' : section === 'verbal' ? 'SAT Verbal' : 'Tổng SAT';
  const tone = section === 'math' ? '#6366F1' : section === 'verbal' ? '#EC4899' : '#8B5CF6';

  if (section === 'total') {
    const t = all.total;
    return (
      <View className="rounded-[22px] bg-white p-5" style={CARD}>
        <Text className="font-strong text-label uppercase tracking-[1.2px] text-muted">Điểm dự đoán · {title}</Text>
        {t ? (
          <>
            <Text className="mt-1 font-heavy text-pageTitle text-ink">
              {t.low}–{t.high}
            </Text>
            <RangeBar low={t.low} mid={t.mid} high={t.high} min={400} max={1600} tone={tone} />
            <Text className="mt-2 font-sans text-label text-muted">
              Khoảng tin cậy 80%, cộng từ hai phần thi. Math {all.math!.low}–{all.math!.high} · Verbal {all.verbal!.low}–{all.verbal!.high}.
            </Text>
          </>
        ) : (
          <Text className="mt-2 font-sans text-body text-muted">
            Làm ít nhất 10 câu ở mỗi phần (SAT Math và SAT Verbal) để có dự đoán tổng điểm.
          </Text>
        )}
      </View>
    );
  }

  const p: Prediction | null = section === 'math' ? all.math : all.verbal;
  return (
    <View className="rounded-[22px] bg-white p-5" style={CARD}>
      <Text className="font-strong text-label uppercase tracking-[1.2px] text-muted">Điểm dự đoán · {title}</Text>
      {p ? (
        <>
          <View className="mt-1 flex-row flex-wrap items-baseline gap-2">
            <Text className="font-heavy text-pageTitle text-ink">
              {p.low}–{p.high}
            </Text>
            <Text className="font-sans text-body text-muted">giữa khoảng {p.mid}</Text>
          </View>
          <RangeBar low={p.low} mid={p.mid} high={p.high} min={200} max={800} tone={tone} />
          <Text className="mt-2 font-sans text-label text-muted">
            Khoảng tin cậy 80% · dựa trên {p.answered} câu gần nhất · quy thẳng tỉ lệ đúng ra thang 200–800 (College Board không công bố bảng quy đổi cho luyện tập).
          </Text>
          {p.needMore ? (
            <Text className="mt-2 font-semi text-body" style={{ color: '#B45309' }}>
              Làm thêm khoảng {p.needMore} câu{p.widestDomain ? ` — nhất là mảng ${domainName(p.widestDomain)}` : ''} để khoảng hẹp lại còn ±30 điểm.
            </Text>
          ) : (
            <Text className="mt-2 font-semi text-body" style={{ color: '#15803D' }}>
              Đủ dữ liệu: sai số chỉ còn khoảng ±{p.halfWidth} điểm.
            </Text>
          )}
        </>
      ) : (
        <Text className="mt-2 font-sans text-body text-muted">Làm ít nhất 10 câu để có dự đoán — một con số từ vài câu chỉ là đoán mò.</Text>
      )}
    </View>
  );
}
