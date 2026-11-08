import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import Head from 'expo-router/head';
import { router } from 'expo-router';

import { CHIIKAWA_IMG, useChiikawaActive } from '@/components/chiikawa/chiikawa';
import { Screen } from '@/components/layout/Screen';
import { Button, Card } from '@/components/ui';
import { ANNOUNCEMENTS, formatPostedAt, type Announcement } from '@/data/announcements';

type Status = 'new' | 'reviewing' | 'planned' | 'doing' | 'done';
type FeatureUpdate = { id: string; requestId: string | null; title: string; status: Status; createdAt: string };

const STATUS_LABEL: Record<Status, string> = {
  new: 'Mới',
  reviewing: 'Đang xem xét',
  planned: 'Đã lên kế hoạch',
  doing: 'Đang làm',
  done: 'Đã xong',
};

/**
 * Bảng tin Thông báo: thông báo của Band 9 và các cập nhật tính năng (tự đăng khi một ý tưởng
 * đổi trạng thái). Danh sách chỉ hiện tiêu đề và tóm tắt; bấm "Chi tiết" mới mở nội dung đầy đủ.
 * Khi bật chủ đề Chiikawa, đầu trang có Chiikawa chào; tắt thì giao diện mặc định.
 */
export default function ThongBaoScreen() {
  const chiikawa = useChiikawaActive();
  const [updates, setUpdates] = useState<FeatureUpdate[]>([]);

  useEffect(() => {
    let alive = true;
    fetch('/api/feature-updates')
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: FeatureUpdate[] }) => {
        if (alive) setUpdates(data.items ?? []);
      })
      .catch(() => {
        if (alive) setUpdates([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Screen>
      <Head>
        <title>Thông báo · Band 9</title>
      </Head>
      <View className="mt-4 flex-row items-center gap-3">
        {chiikawa ? <Image source={CHIIKAWA_IMG.wave} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 64, height: 64 }} /> : null}
        <Text accessibilityRole="header" className="font-heavy text-pageTitle text-ink">
          Thông báo
        </Text>
      </View>
      <View className="mt-4 gap-3">
        {ANNOUNCEMENTS.map((item) => (
          <AnnouncementCard key={item.id} item={item} />
        ))}
      </View>

      {updates.length ? (
        <View className="mt-8">
          <Text accessibilityRole="header" className="font-heavy text-sectionTitle text-ink">
            Cập nhật tính năng
          </Text>
          <View className="mt-3 gap-3">
            {updates.map((item) => (
              <UpdateCard key={item.id} item={item} />
            ))}
          </View>
        </View>
      ) : null}
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

function UpdateCard({ item }: { item: FeatureUpdate }) {
  const date = new Date(item.createdAt).toLocaleDateString('vi-VN');
  return (
    <Card>
      <Text className="font-mid text-label text-muted">{date} · {STATUS_LABEL[item.status] ?? 'Cập nhật'}</Text>
      <Text className="mt-1 font-heavy text-bodyLg text-ink">{item.title}</Text>
      <View className="mt-4 self-start">
        <Button
          label="Xem ý tưởng"
          variant="outline"
          iconRight="chevron-right"
          onPress={() => router.push('/feature-requests' as never)}
        />
      </View>
    </Card>
  );
}
