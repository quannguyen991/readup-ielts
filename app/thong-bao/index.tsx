import React from 'react';
import { Text, View } from 'react-native';
import Head from 'expo-router/head';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button, Card } from '@/components/ui';
import { ANNOUNCEMENTS, formatPostedAt, type Announcement } from '@/data/announcements';

/** Danh sách thông báo: chỉ hiện tiêu đề và tóm tắt, bấm "Chi tiết" mới mở nội dung đầy đủ. */
export default function ThongBaoScreen() {
  return (
    <Screen>
      <Head>
        <title>Thông báo · Band 9</title>
      </Head>
      <View className="mt-4">
        <Text accessibilityRole="header" className="font-heavy text-pageTitle text-ink">
          Thông báo
        </Text>
      </View>
      <View className="mt-4 gap-3">
        {ANNOUNCEMENTS.map((item) => (
          <AnnouncementCard key={item.id} item={item} />
        ))}
      </View>
    </Screen>
  );
}

function AnnouncementCard({ item }: { item: Announcement }) {
  return (
    <Card>
      <Text className="font-mid text-label text-muted">{formatPostedAt(item.postedAt)}</Text>
      <Text className="mt-1 font-heavy text-bodyLg text-ink">{item.title}</Text>
      <Text className="mt-2 font-sans text-body text-muted">{item.summary}</Text>
      <View className="mt-4 self-start">
        <Button
          label="Chi tiết"
          variant="brand"
          iconRight="chevron-right"
          onPress={() => router.push(`/thong-bao/${item.id}` as never)}
        />
      </View>
    </Card>
  );
}
