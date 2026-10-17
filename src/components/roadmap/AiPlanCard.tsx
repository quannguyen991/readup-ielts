import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { SKILL_LABEL, type CustomPlan, type PlanInput, type Skill } from '@/services/plan/custom';
import { analyzePlan } from '@/services/roadmap/analyze-client';
import { checkBudget, scaleToBudget, weeklyBudget, type AiPlanAnalysis } from '@/services/roadmap/analysis';
import { planProfile } from '@/services/roadmap/map';
import { useAuthStore } from '@/store/useAuthStore';
import { todayKey } from '@/store/persist';
import { rmColors } from './theme';

/**
 * AI phân tích lịch học và đề xuất phân bổ thời gian theo kỹ năng. Trước khi hiện kết quả, phần
 * phân bổ được quy về đúng ngân sách tuần; phần AI đề xuất khác biệt lớn với ngân sách thì nói rõ.
 * Áp dụng chỉ đổi danh sách kỹ năng yếu (lộ trình tự dựng lại), không đổi số liệu nào khác.
 */
export function AiPlanCard({
  input,
  plan,
  onApply,
}: {
  input: PlanInput;
  plan: CustomPlan;
  onApply: (priority: Skill[]) => void;
}) {
  const c = rmColors();
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ analysis: AiPlanAnalysis; budget: number } | null>(null);

  const profile = useMemo(() => planProfile(plan, input, todayKey()), [plan, input]);
  const budget = weeklyBudget(input.minutesPerDay, input.studyDays.length);
  const currentTotal = Object.values(plan.minutesBySkill).reduce((a, b) => a + b, 0) || 1;

  const run = async () => {
    setBusy(true);
    setError(null);
    const out = await analyzePlan(profile, token);
    setBusy(false);
    if (!out.ok) return setError(out.message);
    setResult({ analysis: out.analysis, budget: out.budget });
  };

  const scaled = result ? scaleToBudget(result.analysis.allocation, result.budget) : [];
  const maxMinutes = Math.max(1, ...scaled.map((r) => r.minutesPerWeek));
  const check = result ? checkBudget(result.analysis, result.budget) : null;

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 24, padding: 18, gap: 14, boxShadow: '0 10px 24px rgba(120,80,20,0.12)' } as never}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.goldSoft }}>
          <Icon name="sparkle" size={20} color={c.goldDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.ink, fontSize: 18, fontWeight: '800' }}>AI phân tích lịch</Text>
          <Text style={{ color: c.muted, fontSize: 12 }}>Ngân sách {budget} phút mỗi tuần</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {profile.goals.map((g) => (
          <Chip key={g.goal} label={`${g.goal.toUpperCase()} → ${g.target}`} />
        ))}
        <Chip label={`${input.minutesPerDay} phút/ngày`} />
        <Chip label={`${input.studyDays.length} ngày/tuần`} />
        {input.weak.length > 0 ? <Chip label={`Yếu: ${input.weak.map((w) => SKILL_LABEL[w]).join(', ')}`} /> : null}
      </View>

      {!result ? (
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void run()}
          style={{ height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: c.gold, opacity: busy ? 0.6 : 1 }}
        >
          <Icon name="sparkle" size={18} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>{busy ? 'AI đang đọc lịch của bạn…' : 'Nhờ AI phân tích và phân bổ'}</Text>
        </Pressable>
      ) : null}
      {error ? <Text style={{ color: c.danger, fontSize: 13, lineHeight: 19 }}>{error}</Text> : null}

      {result ? (
        <View style={{ gap: 14 }}>
          <Text style={{ color: c.ink, fontSize: 14, lineHeight: 22 }}>{result.analysis.summary}</Text>

          {result.analysis.risks.length > 0 ? (
            <View style={{ gap: 6 }}>
              <Text style={{ color: c.body, fontSize: 13, fontWeight: '800' }}>Rủi ro</Text>
              {result.analysis.risks.map((r) => (
                <View key={r} style={{ flexDirection: 'row', gap: 8 }}>
                  <Icon name="info" size={14} color={c.warn} />
                  <Text style={{ color: c.ink, fontSize: 13, lineHeight: 19, flex: 1 }}>{r}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={{ gap: 10 }}>
            <Text style={{ color: c.body, fontSize: 13, fontWeight: '800' }}>Phân bổ đề xuất mỗi tuần</Text>
            {scaled.map((row) => {
              const reason = result.analysis.allocation.find((a) => a.skill === row.skill)?.reason ?? '';
              const nowShare = Math.round(((plan.minutesBySkill[row.skill] ?? 0) / currentTotal) * 100);
              const suggestShare = Math.round((row.minutesPerWeek / Math.max(1, budget)) * 100);
              return (
                <View key={row.skill} style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: c.ink, fontSize: 13, fontWeight: '800' }}>{SKILL_LABEL[row.skill]}</Text>
                    <Text style={{ color: c.body, fontSize: 12, fontWeight: '700' }}>
                      {row.minutesPerWeek} phút · {suggestShare}% (hiện {nowShare}%)
                    </Text>
                  </View>
                  <View style={{ height: 10, borderRadius: 5, backgroundColor: c.groundDeep, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.round((row.minutesPerWeek / maxMinutes) * 100)}%`, height: 10, borderRadius: 5, backgroundColor: c.gold }} />
                  </View>
                  {reason ? <Text style={{ color: c.muted, fontSize: 12, lineHeight: 17 }}>{reason}</Text> : null}
                </View>
              );
            })}
            {check && !check.ok ? (
              <Text style={{ color: c.warn, fontSize: 12, lineHeight: 18 }}>
                AI đề xuất tổng {check.total} phút, lệch ngân sách {budget} phút. Đã quy về đúng ngân sách theo tỉ lệ.
              </Text>
            ) : null}
          </View>

          {result.analysis.tips.length > 0 ? (
            <View style={{ gap: 6 }}>
              <Text style={{ color: c.body, fontSize: 13, fontWeight: '800' }}>Gợi ý</Text>
              {result.analysis.tips.map((t) => (
                <Text key={t} style={{ color: c.ink, fontSize: 13, lineHeight: 19 }}>
                  • {t}
                </Text>
              ))}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => onApply(result.analysis.priority)}
            style={{ height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: c.ink }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>
              Áp dụng: ưu tiên {result.analysis.priority.map((s) => SKILL_LABEL[s]).join(' và ')}
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setResult(null)} style={{ alignItems: 'center', paddingVertical: 4 }}>
            <Text style={{ color: c.muted, fontSize: 13, fontWeight: '700' }}>Phân tích lại</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function Chip({ label }: { label: string }) {
  const c = rmColors();
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: c.goldSoft }}>
      <Text style={{ color: c.goldDeep, fontSize: 12, fontWeight: '800' }}>{label}</Text>
    </View>
  );
}

