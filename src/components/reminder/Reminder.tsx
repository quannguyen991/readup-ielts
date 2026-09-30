/**
 * NHẮC HỌC MỖI NGÀY: thẻ cài đặt + bộ canh giờ chạy nền (gắn một lần ở AppShell).
 * Luật ở `services/reminder/reminder.ts` — đọc phần đầu tệp đó để biết vì sao
 * có cả thông báo trình duyệt lẫn tệp lịch .ics.
 */
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';

import { Button, Card, SectionHeader } from '@/components/ui';
import { dateKey } from '@/services/gamification/points';
import { dueNow, parseTime, reminderIcs } from '@/services/reminder/reminder';
import { useReminderStore } from '@/store/useReminderStore';
import { useStudyStore } from '@/store/useStudyStore';
import { color } from '@/theme/tokens';

const PRESETS = ['06:30', '12:00', '17:45', '20:00', '21:30'];

const canNotify = () => Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window;

/** Canh giờ: mỗi phút xem đã tới giờ nhắc chưa; tới thì báo đúng một lần trong ngày. */
export function ReminderRunner() {
  const enabled = useReminderStore((s) => s.enabled);
  useEffect(() => {
    if (!enabled || !canNotify()) return;
    const check = () => {
      const now = new Date();
      const today = dateKey(now);
      const { time, lastFired, fired } = useReminderStore.getState();
      const studied = (useStudyStore.getState().daily[today]?.minutes ?? 0) > 0;
      if (!dueNow(now, time, lastFired, today, studied)) return;
      if (Notification.permission !== 'granted') return;
      fired(today);
      const n = new Notification('Đến giờ học ReadUp rồi', { body: 'Hôm nay bạn chưa học phút nào — 15 phút thôi là giữ được chuỗi ngày.', tag: 'readup-daily' });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [enabled]);
  return null;
}

export function ReminderCard() {
  const { enabled, time, set } = useReminderStore();
  const [draft, setDraft] = useState(time);
  const [perm, setPerm] = useState<string>(() => (canNotify() ? Notification.permission : 'unsupported'));
  const [msg, setMsg] = useState<string | null>(null);

  const turnOn = async () => {
    if (canNotify() && Notification.permission === 'default') {
      const p = await Notification.requestPermission();
      setPerm(p);
    }
    set({ enabled: true });
    setMsg(null);
  };

  const saveTime = (t: string) => {
    if (parseTime(t) === null) return setMsg('Giờ chưa đúng dạng HH:MM, ví dụ 20:30.');
    set({ time: t });
    setDraft(t);
    setMsg(`Sẽ nhắc lúc ${t}.`);
  };

  const downloadIcs = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const ics = reminderIcs(time, window.location.origin, new Date(), `daily-${time.replace(':', '')}`);
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `readup-nhac-hoc-${time.replace(':', 'h')}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setMsg('Đã tải tệp lịch. Mở tệp (hoặc nhập vào Google Calendar) để lịch nhắc mỗi ngày, kể cả khi không mở app.');
  };

  return (
    <Card className="mt-4">
      <SectionHeader title="Nhắc học mỗi ngày" subtitle="Một lời nhắc vào giờ bạn chọn, chỉ khi hôm đó chưa học" icon="bell" />
      <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
        {PRESETS.map((p) => {
          const on = time === p;
          return (
            <Pressable key={p} accessibilityRole="button" aria-selected={on} onPress={() => saveTime(p)} className="rounded-pill px-3.5 py-2" style={{ backgroundColor: on ? color.primary : '#FFFFFF', borderWidth: 1, borderColor: on ? color.primary : '#E2E8F0' }}>
              <Text className="font-semi text-label" style={{ color: on ? '#FFFFFF' : color.ink }}>
                {p}
              </Text>
            </Pressable>
          );
        })}
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => saveTime(draft)}
          onBlur={() => draft !== time && saveTime(draft)}
          accessibilityLabel="Giờ nhắc khác (HH:MM)"
          placeholder="HH:MM"
          className="rounded-pill border border-border px-3.5 py-2 font-sans text-label text-ink"
          style={{ width: 90 }}
        />
      </View>
      <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
        {enabled ? (
          <Button label="Tắt nhắc trên máy này" size="sm" variant="outline" onPress={() => set({ enabled: false })} />
        ) : (
          <Button label="Bật nhắc trên máy này" size="sm" iconLeft="bell" onPress={() => void turnOn()} />
        )}
        {Platform.OS === 'web' ? <Button label="Thêm vào lịch (.ics)" size="sm" variant="outline" iconLeft="calendar" onPress={downloadIcs} /> : null}
      </View>
      <Text className="mt-3 font-sans text-label text-muted">
        {enabled
          ? perm === 'granted'
            ? `Đang bật: trình duyệt sẽ nhắc lúc ${time} nếu có một tab ReadUp đang mở.`
            : perm === 'denied'
              ? 'Trình duyệt đang chặn thông báo của ReadUp — mở lại quyền trong cài đặt trang, hoặc dùng tệp lịch.'
              : perm === 'default'
                ? 'Chưa cho phép thông báo — tắt rồi bật lại để trình duyệt hỏi quyền, hoặc dùng tệp lịch.'
                : 'Trình duyệt này không hỗ trợ thông báo — dùng tệp lịch để được nhắc.'
          : 'ReadUp chưa có thông báo đẩy khi đóng app. Muốn được nhắc cả lúc không mở ReadUp (trên điện thoại), hãy thêm tệp lịch vào Google Calendar / lịch của máy.'}
      </Text>
      {msg ? <Text className="mt-2 font-sans text-label text-ink">{msg}</Text> : null}
    </Card>
  );
}
