import React, { useState, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import {
  analyzeSatRoadmap,
  type AiRoadmapProfile,
  type AiRoadmapAnalysis,
} from '@/data/sat-daily-plan';

export function AiRoadmapAdvisor({ onSelectDay }: { onSelectDay?: (day: number) => void }) {
  const { L } = useL();

  // Profile inputs
  const [currentScore, setCurrentScore] = useState<number>(1150);
  const [targetScore, setTargetScore] = useState<number>(1450);
  const [weeksUntilExam, setWeeksUntilExam] = useState<number>(8);
  const [hoursPerDay, setHoursPerDay] = useState<number>(1.5);
  const [weakestSection, setWeakestSection] = useState<AiRoadmapProfile['weakestSection']>('reading_inference');
  const [showForm, setShowForm] = useState<boolean>(false);

  // Analysis result
  const analysis: AiRoadmapAnalysis = useMemo(() => {
    return analyzeSatRoadmap({
      currentScore,
      targetScore,
      weeksUntilExam,
      hoursPerDay,
      weakestSection,
    });
  }, [currentScore, targetScore, weeksUntilExam, hoursPerDay, weakestSection]);

  return (
    <View
      style={{
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#F3F0FB',
        padding: 22,
        gap: 18,
        shadowColor: '#2B2350',
        shadowOpacity: 0.05,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      {/* Header with AI Badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: '#F3F0FB',
              borderWidth: 1,
              borderColor: '#FDE68A',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>🤖</Text>
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F1D33', letterSpacing: -0.3 }}>
                {L('Trợ lý AI Phân tích Lộ trình SAT', 'AI SAT Roadmap Advisor')}
              </Text>
              <View style={{ backgroundColor: '#10B981', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 5 }}>
                <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#FFFFFF' }}>AI PRO</Text>
              </View>
            </View>
            <Text style={{ fontSize: 12.5, color: '#64748B', fontWeight: '500' }}>
              {L('Tối ưu hóa thời gian & phân tầng mục tiêu theo năng lực cá nhân', 'Personalized gap analysis & time-optimized plan')}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => setShowForm(!showForm)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: '#F3F0FB',
            borderWidth: 1,
            borderColor: '#E6DACB',
          }}
        >
          <Icon name="settings" size={13} color="#B94A70" />
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#B94A70' }}>
            {showForm ? L('Ẩn bộ chỉnh', 'Hide inputs') : L('Tùy chỉnh mục tiêu', 'Edit profile')}
          </Text>
        </Pressable>
      </View>

      {/* Input Adjuster Form (Collapsible) */}
      {showForm && (
        <View
          style={{
            borderRadius: 16,
            backgroundColor: '#F3F0FB',
            borderWidth: 1,
            borderColor: '#F3F0FB',
            padding: 16,
            gap: 14,
          }}
        >
          {/* Row 1: Target & Current Scores */}
          <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
            <View style={{ flex: 1, minWidth: 160, gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#2B2350' }}>
                {L('Điểm hiện tại:', 'Current score:')} <Text style={{ color: '#0F1D33', fontWeight: '900' }}>{currentScore}</Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {[950, 1050, 1150, 1250, 1350].map((sc) => (
                  <Pressable
                    key={sc}
                    onPress={() => setCurrentScore(sc)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: currentScore === sc ? '#B94A70' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: currentScore === sc ? '#B94A70' : '#E6DACB',
                    }}
                  >
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: currentScore === sc ? '#FFFFFF' : '#475569' }}>
                      {sc}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ flex: 1, minWidth: 160, gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#2B2350' }}>
                {L('Mục tiêu điểm số:', 'Target score:')} <Text style={{ color: '#0F766E', fontWeight: '900' }}>{targetScore}+</Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {[1300, 1400, 1450, 1500, 1550].map((sc) => (
                  <Pressable
                    key={sc}
                    onPress={() => setTargetScore(sc)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: targetScore === sc ? '#0F766E' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: targetScore === sc ? '#0F766E' : '#E6DACB',
                    }}
                  >
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: targetScore === sc ? '#FFFFFF' : '#475569' }}>
                      {sc}+
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Row 2: Timeline & Daily Hours */}
          <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
            <View style={{ flex: 1, minWidth: 160, gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#2B2350' }}>
                {L('Thời gian tới kỳ thi:', 'Timeline:')} <Text style={{ color: '#6A4BD9', fontWeight: '900' }}>{weeksUntilExam} {L('tuần', 'weeks')}</Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[4, 8, 12, 16].map((w) => (
                  <Pressable
                    key={w}
                    onPress={() => setWeeksUntilExam(w)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: weeksUntilExam === w ? '#6A4BD9' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: weeksUntilExam === w ? '#6A4BD9' : '#E6DACB',
                    }}
                  >
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: weeksUntilExam === w ? '#FFFFFF' : '#475569' }}>
                      {w} {L('tuần', 'wks')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ flex: 1, minWidth: 160, gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#2B2350' }}>
                {L('Thời lượng học mỗi ngày:', 'Study time/day:')} <Text style={{ color: '#1E40AF', fontWeight: '900' }}>{hoursPerDay}h ({hoursPerDay * 60}p)</Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[1, 1.5, 2, 3].map((h) => (
                  <Pressable
                    key={h}
                    onPress={() => setHoursPerDay(h)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: hoursPerDay === h ? '#1E40AF' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: hoursPerDay === h ? '#1E40AF' : '#E6DACB',
                    }}
                  >
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: hoursPerDay === h ? '#FFFFFF' : '#475569' }}>
                      {h}h/ngày
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Analysis Metrics Grid */}
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        {/* Metric 1: Score Gap */}
        <View
          style={{
            flex: 1,
            minWidth: 130,
            borderRadius: 16,
            backgroundColor: '#F3F0FB',
            borderWidth: 1,
            borderColor: '#FDE68A',
            padding: 14,
            gap: 4,
          }}
        >
          <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#6A4BD9' }}>
            {L('KHOẢNG CÁCH ĐIỂM', 'SCORE GAP')}
          </Text>
          <Text style={{ fontSize: 26, fontWeight: '900', color: '#6A4BD9' }}>
            +{analysis.gapScore}
          </Text>
          <Text style={{ fontSize: 11, color: '#2B2350' }}>
            {currentScore} → {targetScore}
          </Text>
        </View>

        {/* Metric 2: Target Division */}
        <View
          style={{
            flex: 1.2,
            minWidth: 160,
            borderRadius: 16,
            backgroundColor: '#F0FDF4',
            borderWidth: 1,
            borderColor: '#BBF7D0',
            padding: 14,
            gap: 4,
          }}
        >
          <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#166534' }}>
            {L('PHÂN BỔ ĐIỂM MỤC TIÊU', 'TARGET DISTRIBUTION')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#15803D' }}>
              📐 Toán {analysis.mathTarget}
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F766E' }}>
              📖 Verbal {analysis.rwTarget}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: '#14532D' }}>
            {L('Tối ưu hóa điểm dễ lấy trước', 'Max ROI on high-yield sections')}
          </Text>
        </View>

        {/* Metric 3: Feasibility Index */}
        <View
          style={{
            flex: 1,
            minWidth: 130,
            borderRadius: 16,
            backgroundColor: '#F0FDFA',
            borderWidth: 1,
            borderColor: '#99F6E4',
            padding: 14,
            gap: 4,
          }}
        >
          <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#0F766E' }}>
            {L('TỈ LỆ KHẢ THI', 'FEASIBILITY')}
          </Text>
          <Text style={{ fontSize: 26, fontWeight: '900', color: '#0D9488' }}>
            {analysis.feasibilityPercent}%
          </Text>
          <Text style={{ fontSize: 11, color: '#115E59' }}>
            {analysis.suggestedDailyMinutes}p {L('học mỗi ngày', 'daily study')}
          </Text>
        </View>
      </View>

      {/* AI Strategy Milestones */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: '#2B2350', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {L('Lộ trình hành động đề xuất theo từng giai đoạn:', 'Action plan by milestones:')}
        </Text>
        <View style={{ gap: 8 }}>
          {analysis.focusMilestones.map((m, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                borderRadius: 12,
                backgroundColor: '#F3F0FB',
                borderWidth: 1,
                borderColor: '#F3F0FB',
                padding: 12,
              }}
            >
              <View
                style={{
                  backgroundColor: '#B94A70',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  alignSelf: 'flex-start',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>{m.week}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#0F1D33' }}>
                  {m.goalVi}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 18 }}>
                  {m.actionVi}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* AI Trap Alert Warning */}
      <View
        style={{
          borderRadius: 14,
          backgroundColor: '#F3F0FB',
          borderWidth: 1,
          borderColor: '#FED7AA',
          padding: 14,
          gap: 6,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14 }}>⚠️</Text>
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#6A4BD9', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {L('Cảnh báo bẫy điểm số từ AI:', 'AI Trap Warnings:')}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: '#6A4BD9', lineHeight: 19 }}>
          {analysis.trapAlertsVi[0]}
        </Text>
      </View>

      {/* Today's Action CTA */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingTop: 4 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#2B2350' }}>
          {L('Giai đoạn hiện tại:', 'Current phase:')} <Text style={{ color: '#0F766E', fontWeight: '900' }}>{analysis.recommendedPhase}</Text>
        </Text>
        <Pressable
          onPress={() => onSelectDay ? onSelectDay(1) : router.push('/sat-rw' as never)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 16,
            height: 38,
            borderRadius: 10,
            backgroundColor: '#0F1D33',
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>
            {L('Bắt đầu bài học hôm nay', 'Start today task')}
          </Text>
          <Icon name="arrow-right" size={14} color="#FBBF24" />
        </Pressable>
      </View>
    </View>
  );
}
