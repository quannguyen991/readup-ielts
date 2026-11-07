import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import Head from 'expo-router/head';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button, Card, Icon } from '@/components/ui';
import { formatPostedAt, getAnnouncement } from '@/data/announcements';
import { CONTACT } from '@/lib/contact';
import { paper } from '@/theme/tokens';

/** Chi tiết một thông báo. Kênh nhận hồ sơ lấy từ CONTACT: chưa khai kênh thì nói rõ là đang cập nhật. */
export default function ThongBaoChiTietScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const item = getAnnouncement(typeof id === 'string' ? id : undefined);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/thong-bao' as never);
  };

  if (!item) {
    return (
      <Screen>
        <Text accessibilityRole="header" className="font-heavy text-pageTitle text-ink">
          Không tìm thấy thông báo
        </Text>
        <View className="mt-4 self-start">
          <Button label="Về danh sách thông báo" variant="brandOutline" onPress={() => router.replace('/thong-bao' as never)} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Head>
        <title>{`${item.title} · Band 9`}</title>
      </Head>

      <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={goBack} className="mt-2 flex-row items-center gap-1 self-start py-2">
        <Icon name="chevron-left" size={16} color={paper.body} />
        <Text className="font-semi text-body text-muted">Quay lại</Text>
      </Pressable>

      <View className="mt-2">
        <Text accessibilityRole="header" className="font-heavy text-pageTitle text-ink">
          {item.title}
        </Text>
        <Text className="mt-1 font-sans text-label text-muted">{formatPostedAt(item.postedAt)}</Text>
      </View>

      <Card className="mt-4 gap-5">
        {item.sections.map((section) => (
          <View key={section.heading} className="gap-2">
            <Text className="font-heavy text-body text-ink">{section.heading}</Text>
            {section.items.map((line) => (
              <Text key={line} className="font-sans text-body text-ink">
                {`•  ${line}`}
              </Text>
            ))}
          </View>
        ))}
      </Card>

      <Card className="mt-4 gap-3">
        <Text className="font-heavy text-body text-ink">Gửi hồ sơ</Text>
        {CONTACT.channels.length > 0 ? (
          <>
            <Text className="font-sans text-body text-muted">Nhắn cho chúng tôi qua một trong các kênh dưới đây, kèm CV ngắn và một đến hai video mẫu.</Text>
            {CONTACT.channels.map((c) => (
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
          </>
        ) : (
          <Text className="font-sans text-body text-muted">Kênh nhận hồ sơ đang được cập nhật. Bạn xem lại trang Liên hệ sau nhé.</Text>
        )}
      </Card>
    </Screen>
  );
}
