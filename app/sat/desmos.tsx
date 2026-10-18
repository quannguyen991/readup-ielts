import React from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button, Card } from '@/components/ui';
import { DesmosEmbed } from '@/components/sat-exam/DesmosEmbed';
import { SAT_DESMOS_TECHNIQUES } from '@/data/sat-methods';
import { useL } from '@/i18n/useL';

export default function SatDesmosScreen() {
  const { L } = useL();
  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">Desmos · SAT Math</Text>
      <Text className="mt-1 font-sans text-body text-muted">{L('Vẽ đường thẳng, parabol và điểm để kiểm tra giao điểm, khoảng cách hoặc nghiệm.', 'Graph lines, parabolas, and points to check intersections, distances, and roots.')}</Text>
      <Card className="mt-4">
        <DesmosEmbed />
      </Card>
      {Platform.OS === 'web' ? (
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://www.desmos.com/calculator')} className="mt-3 self-end">
          <Text className="font-semi text-label text-primary-700">{L('Mở Desmos ngoài app ↗', 'Open Desmos separately ↗')}</Text>
        </Pressable>
      ) : null}

      {/* 4 Tuyệt chiêu Desmos cho SAT Math */}
      <View className="mt-6 gap-3">
        <Text className="font-heavy text-cardTitle text-ink">{L('4 Tuyệt chiêu Desmos cho SAT Math', '4 Desmos Power Shortcuts for SAT')}</Text>
        <Text className="font-sans text-caption text-muted">
          {L('Các mẹo bấm máy thực chiến trích từ giáo trình SAT Math 20 tuần giúp giải nhanh hơn 50% câu hỏi khó.', 'Practical techniques from the 20-week Math roadmap to solve over 50% of tough questions.')}
        </Text>
        <View className="mt-2 flex-row flex-wrap gap-3">
          {SAT_DESMOS_TECHNIQUES.map((tech, i) => (
            <View key={i} className="flex-1 min-w-[280px] rounded-2xl border border-border bg-white p-4 gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="font-heavy text-body text-ink">{tech.nameVi}</Text>
                <View className="rounded-md bg-blue-50 px-2 py-0.5">
                  <Text className="font-mono text-tiny text-blue-700 font-strong">Mẹo #{i + 1}</Text>
                </View>
              </View>
              <Text className="font-sans text-caption text-muted" style={{ lineHeight: 18 }}>{tech.useVi}</Text>
              <View className="rounded-lg bg-slate-900 p-2.5">
                <Text className="font-mono text-tiny text-sky-400">{tech.shortcut}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="mt-6 mb-8">
        <Button label={L('Về trung tâm SAT', 'Back to SAT Hub')} variant="outline" onPress={() => router.replace('/sat' as never)} />
      </View>
    </Screen>
  );
}
