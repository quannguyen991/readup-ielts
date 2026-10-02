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
import { currentLocale, pick, useL } from '@/i18n/useL';

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
      const loc = currentLocale();
      const n = new Notification(pick(loc, 'Đến giờ học Band 9 rồi', 'Time to study on Band 9'), {
        body: pick(loc, 'Hôm nay bạn chưa học phút nào — 15 phút thôi là giữ được chuỗi ngày.', "You haven't studied today — just 15 minutes keeps your streak alive."),
        tag: 'readup-daily',
      });
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
  const { L } = useL();

  const turnOn = async () => {
    if (canNotify() && Notification.permission === 'default') {
      const p = await Notification.requestPermission();
      setPerm(p);
    }
    set({ enabled: true });
    setMsg(null);
  };

  const saveTime = (t: string) => {
    if (parseTime(t) === null) return setMsg(L('Giờ chưa đúng dạng HH:MM, ví dụ 20:30.', 'Use the HH:MM format, e.g. 20:30.'));
    set({ time: t });
    setDraft(t);
    setMsg(L(`Sẽ nhắc lúc ${t}.`, `You'll be reminded at ${t}.`));
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
    setMsg(L('Đã tải tệp lịch. Mở tệp để thêm nhắc vào lịch.', 'Calendar file downloaded. Open it to add the reminder.'));
  };

  return (
    <Card className="mt-4">
      <SectionHeader
        title={L('Nhắc học mỗi ngày', 'Daily study reminder')}
        subtitle={L('Một lời nhắc vào giờ bạn chọn, chỉ khi hôm đó chưa học', "One reminder at the time you choose, only on days you haven't studied")}
        icon="bell"
      />
      <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
        {PRESETS.map((p) => {
          const on = time === p;
          return (
            <Pressable key={p} accessibilityRole="button" aria-selected={on} onPress={() => saveTime(p)} className="items-center justify-center rounded-pill px-3.5 py-2" style={{ minHeight: 44, backgroundColor: on ? color.primary : '#FFFFFF', borderWidth: 1, borderColor: on ? color.primary : '#F0EBE2' }}>
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
          accessibilityLabel={L('Giờ nhắc khác (HH:MM)', 'Custom reminder time (HH:MM)')}
          placeholder="HH:MM"
          inputMode="numeric"
          enterKeyHint="done"
          className="rounded-pill border border-border px-3.5 py-2 font-sans text-label text-ink"
          style={{ width: 96, minHeight: 44 }}
        />
      </View>
      <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
        {enabled ? (
          <Button label={L('Tắt nhắc trên máy này', 'Turn off on this device')} size="sm" variant="outline" onPress={() => set({ enabled: false })} />
        ) : (
          <Button label={L('Bật nhắc trên máy này', 'Turn on for this device')} size="sm" iconLeft="bell" onPress={() => void turnOn()} />
        )}
        {Platform.OS === 'web' ? <Button label={L('Thêm vào lịch (.ics)', 'Add to calendar (.ics)')} size="sm" variant="outline" iconLeft="calendar" onPress={downloadIcs} /> : null}
      </View>
      <Text className="mt-3 font-sans text-label text-muted">
        {enabled
          ? perm === 'granted'
            ? L(`Đang bật: trình duyệt sẽ nhắc lúc ${time} nếu có một tab Band 9 đang mở.`, `On: your browser will remind you at ${time} if a Band 9 tab is open.`)
            : perm === 'denied'
              ? L('Thông báo đang bị chặn. Mở quyền trong cài đặt trang hoặc dùng tệp lịch.', 'Notifications are blocked. Allow them in site settings or use the calendar file.')
              : perm === 'default'
                ? L('Chưa cho phép thông báo — tắt rồi bật lại để trình duyệt hỏi quyền, hoặc dùng tệp lịch.', "Notifications aren't allowed yet — turn this off and on again so the browser asks, or use the calendar file.")
                : L('Trình duyệt này không hỗ trợ thông báo — dùng tệp lịch để được nhắc.', "This browser doesn't support notifications — use the calendar file instead.")
          : L('Chỉ nhắc khi tab còn mở. Muốn nhắc cả lúc đóng app, bật "Nhắc học" ở trên.', 'Only works while the tab is open. For reminders when closed, use "Study reminders" above.')}
      </Text>
      {msg ? <Text className="mt-2 font-sans text-label text-ink">{msg}</Text> : null}
    </Card>
  );
}
