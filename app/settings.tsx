import React from 'react';
import { Text, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Badge, Card, SectionHeader } from '@/components/ui';
import { hasSupabaseConfig, publicEnv } from '@/lib/env';

export default function SettingsScreen() {
  const configured = hasSupabaseConfig();

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">Settings</Text>

      <Card className="mt-4">
        <SectionHeader
          title="Kết nối Supabase"
          subtitle="Điền biến trong .env.local rồi khởi động lại dev server"
          icon="settings"
          right={
            <Badge
              label={configured ? 'Đã cấu hình' : 'Chưa cấu hình'}
              tone={configured ? 'success' : 'warning'}
            />
          }
        />

        <View className="mt-4 gap-2">
          <Row label="EXPO_PUBLIC_SUPABASE_URL" value={publicEnv.supabaseUrl || '—'} />
          <Row
            label="EXPO_PUBLIC_SUPABASE_ANON_KEY"
            value={publicEnv.supabaseAnonKey ? '••••••••' : '—'}
          />
        </View>

        <Text className="mt-4 font-sans text-label text-muted">
          Các key bí mật (SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY) không đọc ở
          client — chỉ dùng trong API route / Edge Function ở các bước sau.
        </Text>
      </Card>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between rounded-panel bg-surfaceAlt px-3 py-2.5">
      <Text className="font-mid text-label text-muted">{label}</Text>
      <Text className="font-semi text-label text-ink" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
