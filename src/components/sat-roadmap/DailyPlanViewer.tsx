import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { SAT_30_DAY_STUDY_PLAN, type DailySatTask } from '@/data/sat-daily-plan';
import { BilingualReadingCard, SAMPLE_BILINGUAL_PASSAGES } from './BilingualReadingCard';

export function DailyPlanViewer({ initialDay = 1 }: { initialDay?: number }) {
  const { L } = useL();
  const [selectedDayNum, setSelectedDayNum] = useState<number>(initialDay);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set([1]));

  const currentTask: DailySatTask =
    SAT_30_DAY_STUDY_PLAN.find((t) => t.day === selectedDayNum) ?? SAT_30_DAY_STUDY_PLAN[0]!;

  const toggleComplete = (d: number) => {
    setCompletedDays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  const isDone = completedDays.has(currentTask.day);

  return (
    <View style={{ gap: 18 }}>
      {/* Horizontal Day Selector Bar */}
      <View
        style={{
          borderRadius: 20,
          backgroundColor: '#FFFFFF',
          borderWidth: 1.5,
          borderColor: '#EFE7DC',
          padding: 14,
          gap: 10,
          shadowColor: '#784415',
          shadowOpacity: 0.04,
          shadowRadius: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14 }}>📅</Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F1D33' }}>
              {L('Lộ trình thực chiến 30 Ngày (Cấp tốc 1400–1550+)', '30-Day Intensive SAT Schedule')}
            </Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#B94A70' }}>
            {completedDays.size}/30 {L('ngày hoàn thành', 'days done')}
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {SAT_30_DAY_STUDY_PLAN.map((task) => {
            const isSelected = selectedDayNum === task.day;
            const isCompleted = completedDays.has(task.day);

            return (
              <Pressable
                key={task.day}
                onPress={() => setSelectedDayNum(task.day)}
                style={{
                  width: 72,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: isSelected ? '#2A241A' : isCompleted ? '#F0FDF4' : '#FAF5EE',
                  borderWidth: 1.5,
                  borderColor: isSelected ? '#2A241A' : isCompleted ? '#86EFAC' : '#E6DACB',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? '#FDE68A' : isCompleted ? '#166534' : '#B94A70' }}>
                  {task.phase.split(' ')[0]}
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '900', color: isSelected ? '#FFFFFF' : isCompleted ? '#15803D' : '#0F1D33' }}>
                  N.{task.day}
                </Text>
                {isCompleted ? (
                  <Text style={{ fontSize: 10, color: '#16A34A', fontWeight: '800' }}>✓ Xong</Text>
                ) : (
                  <Text style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.7)' : '#94A3B8' }}>{task.estimatedMinutes}p</Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Selected Day Task Card */}
      <View
        style={{
          borderRadius: 24,
          backgroundColor: '#FFFFFF',
          borderWidth: 1.5,
          borderColor: '#EFE7DC',
          padding: 22,
          gap: 18,
          shadowColor: '#784415',
          shadowOpacity: 0.05,
          shadowRadius: 14,
        }}
      >
        {/* Day Header with Mark as Done button */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ backgroundColor: '#B94A70', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
                  TUẦN {currentTask.week} · {currentTask.phase.toUpperCase()}
                </Text>
              </View>
              <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6 }}>
                <Text style={{ color: '#475569', fontSize: 11, fontWeight: '700' }}>
                  ⏱️ {currentTask.estimatedMinutes} phút
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F1D33', letterSpacing: -0.3 }}>
              {currentTask.titleVi}
            </Text>
            <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>
              🎯 <Text style={{ fontWeight: '700', color: '#2A1808' }}>Mục tiêu:</Text> {currentTask.focusVi}
            </Text>
          </View>

          <Pressable
            onPress={() => toggleComplete(currentTask.day)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              height: 38,
              borderRadius: 10,
              backgroundColor: isDone ? '#DCFCE7' : '#FAF5EE',
              borderWidth: 1.5,
              borderColor: isDone ? '#86EFAC' : '#E6DACB',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '800', color: isDone ? '#15803D' : '#B94A70' }}>
              {isDone ? '✓ Đã hoàn thành' : 'Đánh dấu hoàn thành'}
            </Text>
          </Pressable>
        </View>

        {/* 3 Core Daily Tasks Grid */}
        <View style={{ gap: 12 }}>
          {/* Task 1: Reading & Writing */}
          <View
            style={{
              borderRadius: 16,
              backgroundColor: '#F8FAFC',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              padding: 16,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14 }}>📖</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#4338CA' }}>
                  Nhiệm vụ Reading & Writing
                </Text>
              </View>
              <Pressable
                onPress={() => router.push(currentTask.rw.href as never)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: '#4338CA',
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#FFFFFF' }}>Làm bài ngay ↗</Text>
              </Pressable>
            </View>
            <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#0F1D33' }}>
              {currentTask.rw.topicVi}
            </Text>
            <Text style={{ fontSize: 12.5, color: '#475569', lineHeight: 18 }}>
              {currentTask.rw.actionVi}
            </Text>
          </View>

          {/* Task 2: Math & Desmos */}
          <View
            style={{
              borderRadius: 16,
              backgroundColor: '#F0FDF4',
              borderWidth: 1,
              borderColor: '#BBF7D0',
              padding: 16,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14 }}>📐</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#15803D' }}>
                  Nhiệm vụ Toán & Desmos ({currentTask.math.domain})
                </Text>
              </View>
              <Pressable
                onPress={() => router.push(currentTask.math.href as never)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: '#15803D',
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#FFFFFF' }}>Học toán ↗</Text>
              </Pressable>
            </View>
            <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#0F1D33' }}>
              {currentTask.math.topicVi}
            </Text>
            <View style={{ backgroundColor: '#FFFFFF', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#DCFCE7' }}>
              <Text style={{ fontSize: 12, color: '#166534', lineHeight: 18 }}>
                💡 <Text style={{ fontWeight: '800' }}>Kỹ thuật Desmos:</Text> {currentTask.math.desmosTipVi}
              </Text>
            </View>
          </View>

          {/* Task 3: Vocab Daily Quiz */}
          <View
            style={{
              borderRadius: 16,
              backgroundColor: '#FFFBEB',
              borderWidth: 1,
              borderColor: '#FDE68A',
              padding: 16,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14 }}>🔤</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#B45309' }}>
                  Từ vựng học thuật trong ngày
                </Text>
              </View>
              <Pressable
                onPress={() => router.push(currentTask.vocab.quizHref as never)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: '#B45309',
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#FFFFFF' }}>Ôn Quiz ↗</Text>
              </Pressable>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#78350F' }}>
              {currentTask.vocab.unitNameVi}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {currentTask.vocab.words.map((w, wIdx) => (
                <View key={wIdx} style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#FDE68A' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#92400E' }}>{w}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Pro Tip of the Day */}
        <View
          style={{
            borderRadius: 14,
            backgroundColor: '#FAF5EE',
            borderWidth: 1,
            borderColor: '#EFE7DC',
            padding: 14,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 18 }}>💡</Text>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#B94A70', textTransform: 'uppercase' }}>
              Mẹo thực chiến ngày {currentTask.day}:
            </Text>
            <Text style={{ fontSize: 12.5, color: '#573E29', lineHeight: 19 }}>
              {currentTask.proTipVi}
            </Text>
          </View>
        </View>
      </View>

      {/* Embedded Bilingual Reading Card for this Day */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F1D33', letterSpacing: -0.2 }}>
          🌐 {L('Luyện Đọc Song Ngữ Trích Đoạn Đề Thi Thật', 'Daily Bilingual Reading Drill')}
        </Text>
        <BilingualReadingCard passage={SAMPLE_BILINGUAL_PASSAGES[(currentTask.day - 1) % SAMPLE_BILINGUAL_PASSAGES.length]!} />
      </View>
    </View>
  );
}
