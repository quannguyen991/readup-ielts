import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui';
import { useL } from '@/i18n/useL';
import { parseIgLinks, type IgLink } from '@/services/ig/links';

/**
 * Trang /ig: danh sách link cho người xem từ Instagram. Đọc JSON công khai từ
 * EXPO_PUBLIC_IG_LINKS_URL (do hệ thống bên ngoài ghi), không đọc database.
 */
export default function IgLinksScreen() {
  const { L } = useL();
  const url = process.env.EXPO_PUBLIC_IG_LINKS_URL ?? '';
  const [links, setLinks] = useState<IgLink[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((raw) => alive && setLinks(parseIgLinks(raw)))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [url]);

  const open = (link: IgLink) => {
    if (link.url.startsWith('/')) router.push(link.url as never);
    else void Linking.openURL(link.url);
  };

  const message = !url
    ? L('Chưa cấu hình nguồn link.', 'Link source is not configured.')
    : failed
      ? L('Không tải được danh sách link. Thử lại sau.', 'Could not load the link list. Try again later.')
      : links === null
        ? L('Đang tải…', 'Loading…')
        : links.length === 0
          ? L('Chưa có link nào.', 'No links yet.')
          : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text className="font-heavy text-pageTitle text-ink">Band 9</Text>
        {message ? <Text className="font-sans text-body text-muted">{message}</Text> : null}
        {(links ?? []).map((link) => (
          <Pressable key={link.id} accessibilityRole="link" onPress={() => open(link)}>
            <Card>
              <View className="gap-1 p-4">
                {link.category ? <Text className="font-sans text-label text-muted">{link.category}</Text> : null}
                <Text className="font-strong text-body text-ink">{link.title}</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
