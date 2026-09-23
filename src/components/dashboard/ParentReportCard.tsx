import React, { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { useAuthStore } from '@/store/useAuthStore';
import { useSyncStore } from '@/store/useSyncStore';

const CARD = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 10px 26px rgba(30,41,99,0.08)' } as object;

/**
 * Học sinh tạo đường dẫn "Báo cáo tuần cho phụ huynh" và gửi qua Zalo /
 * Messenger. Đồng bộ dữ liệu lên trước, để báo cáo có số của hôm nay.
 */
export function ParentReportCard() {
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const userId = useAuthStore((s) => s.session?.user.id ?? null);
  const syncNow = useSyncStore((s) => s.syncNow);
  const [url, setUrl] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!token || !userId) return;
    setBusy(true);
    setNote(null);
    try {
      await syncNow(userId, 'push');
      const res = await fetch('/api/report/link', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const body = (await res.json()) as { path?: string; error?: string };
      if (!res.ok || !body.path) throw new Error(body.error ?? `Lỗi ${res.status}`);
      setUrl(`${Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : 'https://readup-ielts.vercel.app'}${body.path}`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Không tạo được đường dẫn.');
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (!url || Platform.OS !== 'web') return;
    const text = 'Báo cáo học tập tuần này của con trên ReadUp:';
    try {
      if (navigator.share) await navigator.share({ text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setNote('Đã chép đường dẫn — dán vào Zalo gửi bố mẹ.');
      }
    } catch {
      /* người dùng đóng bảng chia sẻ */
    }
  };

  return (
    <View className="rounded-[22px] bg-white p-5" style={CARD}>
      <View className="flex-row items-center gap-2">
        <Icon name="mail" size={18} color="#4F46E5" />
        <Text className="font-heavy text-cardTitle text-ink">Báo cáo tuần cho phụ huynh</Text>
      </View>
      <Text className="mt-1 font-sans text-body text-muted">
        Một đường dẫn chỉ-đọc: thời gian học 7 ngày, độ chính xác, điểm dự đoán, lỗi đang sửa. Chỉ có số đếm, không có bài làm.
      </Text>
      {!token ? (
        <Button className="mt-3 self-start" variant="outline" label="Đăng nhập để tạo báo cáo" onPress={() => router.push('/auth/sign-in' as never)} />
      ) : url ? (
        <View className="mt-3">
          <Text className="rounded-xl px-3 py-2 font-sans text-label text-ink" style={{ backgroundColor: '#F1F5F9' }} selectable numberOfLines={1}>
            {url}
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            <Button size="sm" label="Gửi cho bố mẹ" iconLeft="external" onPress={() => void send()} />
            <Button size="sm" variant="outline" label="Xem trước" onPress={() => router.push(url.slice(url.indexOf('/report/')) as never)} />
          </View>
        </View>
      ) : (
        <Button className="mt-3 self-start" label={busy ? 'Đang tạo…' : 'Tạo đường dẫn'} disabled={busy} onPress={() => void create()} />
      )}
      {note ? <Text className="mt-2 font-sans text-label text-muted">{note}</Text> : null}
    </View>
  );
}
