import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import Head from 'expo-router/head';

import { LegalTabs } from '@/components/legal/LegalTabs';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui';
import { CONTACT } from '@/lib/contact';

/** Kênh liên hệ thật, đọc từ cấu hình; kênh nào chưa khai thì không hiện, không bịa. */
export default function ContactScreen() {
  const { channels, sellerName, address, taxId } = CONTACT;
  return (
    <Screen>
      <Head>
        <title>Liên hệ · Band 9</title>
      </Head>
      <LegalTabs active="contact" />
      <View className="mt-4">
        <Text accessibilityRole="header" className="font-heavy text-pageTitle text-ink">
          Liên hệ
        </Text>
        <Text className="mt-2 font-sans text-bodyLg text-muted">
          Cần hỗ trợ tài khoản, thanh toán, hoàn tiền hoặc muốn yêu cầu xoá dữ liệu: nhắn cho chúng tôi qua các kênh dưới đây.
        </Text>
      </View>
      <Card className="mt-4">
        {channels.length > 0 ? (
          <View className="gap-3">
            {channels.map((c) => (
              <Pressable
                key={c.kind}
                accessibilityRole="link"
                onPress={() => void Linking.openURL(c.href)}
                className="flex-row items-center justify-between rounded-panel border border-border px-4 py-3"
              >
                <Text className="font-mid text-body text-muted">{c.label}</Text>
                <Text className="font-heavy text-body text-ink">{c.display}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text className="font-sans text-body text-ink">Kênh hỗ trợ đang được cập nhật.</Text>
        )}
        {sellerName || address || taxId ? (
          <View className="mt-4 gap-1 border-t border-border pt-4">
            {sellerName ? <Text className="font-sans text-body text-ink">Đơn vị vận hành: {sellerName}</Text> : null}
            {address ? <Text className="font-sans text-body text-ink">Địa chỉ: {address}</Text> : null}
            {taxId ? <Text className="font-sans text-body text-ink">Mã số thuế: {taxId}</Text> : null}
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}
