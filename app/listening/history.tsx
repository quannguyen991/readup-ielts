import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, Icon } from '@/components/ui';
import { getListeningTest } from '@/data/listening-tests';
import { formatBand } from '@/lib/band';
import { playSfx } from '@/services/audio/sfx-ui';
import { useListeningStore } from '@/store/useListeningStore';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/** Lịch sử làm bài Listening: điểm, band, ngày; bấm vào để xem lại kết quả và bản chữ. */
export default function ListeningHistory() {
  const { L, locale } = useL();
  const attempts = useListeningStore((s) => s.attempts);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'en' ? 'en-GB' : 'vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <Screen>
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={L('Quay lại', 'Back')}
          onPress={() => router.replace('/listening' as never)}
          className="h-9 w-9 items-center justify-center rounded-pill border border-border bg-surface"
        >
          <Icon name="chevron-left" size={17} color={color.ink} />
        </Pressable>
        <Text className="min-w-0 flex-1 font-heavy text-ink" style={{ fontSize: 22 }} numberOfLines={2}>
          {L('Lịch sử làm bài Listening', 'Listening history')}
        </Text>
      </View>

      <View className="mt-4 gap-2.5">
        {attempts.length === 0 ? (
          <Card>
            <View className="items-center py-6">
              <Icon name="volume" size={22} color={color.subtle} />
              <Text className="mt-3 text-center font-sans text-body text-muted">
                {L('Bạn chưa làm bài Listening nào.', "You haven't taken a Listening test yet.")}
              </Text>
              <Button className="mt-3" label={L('Vào thư viện', 'Open library')} onPress={() => router.push('/listening' as never)} />
            </View>
          </Card>
        ) : (
          attempts.map((a) => {
            const exists = !!getListeningTest(a.testId);
            return (
              <Pressable
                key={a.id}
                accessibilityRole="link"
                disabled={!exists}
                onPress={() => {
                  playSfx('select');
                  router.push(`/listening/${a.testId}?${a.section ? `s=${a.section}&` : ''}attempt=${encodeURIComponent(a.id)}` as never);
                }}
                className="flex-row flex-wrap items-center gap-x-3 gap-y-2 rounded-card border border-border bg-surface p-3.5"
                style={{ opacity: exists ? 1 : 0.55 }}
              >
                <View className="h-12 w-12 items-center justify-center rounded-panel bg-primary-50">
                  <Text className="font-heavy text-primary-700" style={{ fontSize: 15 }}>
                    {a.score}/{a.total}
                  </Text>
                </View>
                <View className="min-w-0 flex-1" style={{ flexBasis: 160 }}>
                  <Text className="font-strong text-body text-ink" numberOfLines={1}>
                    {a.title}
                  </Text>
                  <Text className="mt-0.5 font-sans text-label text-muted" numberOfLines={1}>
                    {a.section ? `Section ${a.section}` : 'Full test'} · {fmt(a.finishedAt)} · {Math.max(1, Math.round(a.durationSec / 60))} {L('phút', 'min')}
                  </Text>
                </View>
                <View className="flex-row gap-1.5">
                  <Badge label={a.mode === 'real' ? L('Thi thật', 'Real test') : L('Luyện tập', 'Practice')} tone={a.mode === 'real' ? 'warning' : 'neutral'} />
                  <Badge label={`Band ~${formatBand(a.band)}`} tone="primary" />
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </Screen>
  );
}
