/**
 * NHẮC HỌC QUA THÔNG BÁO ĐẨY / EMAIL — thẻ trong Cài đặt.
 *
 * Khác thẻ "Nhắc học mỗi ngày" (`Reminder.tsx`, chỉ nhắc khi còn tab mở): máy
 * chủ gửi lúc 20:00 giờ Việt Nam kể cả khi Band 9 đang đóng, và chỉ khi có điều
 * đáng nói — còn từ đến hạn ôn, hoặc chuỗi ngày sắp đứt (`services/reminders/build.ts`).
 * Lời nhắc dựng từ dữ liệu ĐÃ ĐỒNG BỘ nên cần đăng nhập.
 *
 * Trạng thái phải nói thật: trình duyệt không hỗ trợ, iPhone phải "Thêm vào MH
 * chính" trước, đã chặn quyền thì chỉ đường mở lại, máy chủ chưa có khoá thì
 * thẻ khoá lại với dòng "Chưa bật trên máy chủ".
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button, Card, SectionHeader } from '@/components/ui';
import { useHydrated } from '@/components/layout/useHydrated';
import {
  VAPID_PUBLIC_KEY,
  currentSubscription,
  notificationPermission,
  pushSupport,
  subscribePush,
  unsubscribePush,
  type PushSupport,
} from '@/services/reminders/push-client';
import { useAuthStore } from '@/store/useAuthStore';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

type Prefs = {
  pushEnabled: boolean;
  emailEnabled: boolean;
  devices: number;
  email: string | null;
  server: { push: boolean; email: boolean };
};

type Note = { tone: 'ok' | 'warn'; text: string };

async function requestJson(path: string, method: string, token: string | null, body?: unknown): Promise<{ ok: boolean; json: Record<string, unknown> }> {
  const res = await fetch(path, {
    method,
    headers: { Authorization: `Bearer ${token ?? ''}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, json };
}

function ToggleRow({ label, hint, on, disabled, busy, onPress }: { label: string; hint?: string; on: boolean; disabled?: boolean; busy?: boolean; onPress: () => void }) {
  const inactive = disabled || busy;
  return (
    <Pressable
      accessibilityRole="switch"
      aria-checked={on}
      aria-disabled={inactive}
      aria-busy={busy}
      disabled={inactive}
      onPress={onPress}
      className="mt-3 flex-row items-center rounded-2xl border border-border px-4 py-3"
      style={{ gap: 12, opacity: disabled ? 0.55 : 1, backgroundColor: '#FFFFFF' }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text className="font-semi text-body text-ink">{label}</Text>
        {hint ? <Text className="mt-0.5 font-sans text-label text-muted">{hint}</Text> : null}
      </View>
      <View style={{ width: 46, height: 28, borderRadius: 999, padding: 3, backgroundColor: on ? '#0F1D33' : '#D9D2C3', justifyContent: 'center' }}>
        <View style={{ width: 22, height: 22, borderRadius: 999, backgroundColor: on ? '#B8955A' : '#FFFFFF', alignSelf: on ? 'flex-end' : 'flex-start' }} />
      </View>
    </Pressable>
  );
}

export function PushReminderCard() {
  const hydrated = useHydrated();
  const { L, locale } = useL();
  const status = useAuthStore((s) => s.status);
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const userEmail = useAuthStore((s) => s.user?.email ?? null);

  const configured = !!VAPID_PUBLIC_KEY;
  // Hỗ trợ / quyền chỉ đọc sau khi hydrate — máy chủ không biết trình duyệt nào.
  // Đọc lại mỗi lượt vẽ: quyền đổi sau hộp thoại xin quyền.
  const support: PushSupport = hydrated ? pushSupport() : 'unsupported';
  const perm = hydrated ? notificationPermission() : 'unsupported';
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [thisDevice, setThisDevice] = useState(false);
  const [busy, setBusy] = useState<null | 'push' | 'email' | 'test'>(null);
  const [note, setNote] = useState<Note | null>(null);

  const call = useCallback(
    async (path: string, method: string, body?: unknown) => {
      const out = await requestJson(path, method, token, body);
      if (out.json.setupNeeded) setSetupNeeded(true);
      return out;
    },
    [token],
  );

  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    currentSubscription()
      .then((s) => alive && setThisDevice(!!s))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || status !== 'signed_in' || !token || !configured) return;
    let alive = true;
    requestJson('/api/reminders/prefs', 'GET', token)
      .then(({ ok, json }) => {
        if (!alive) return;
        if (json.setupNeeded) setSetupNeeded(true);
        else if (ok) setPrefs(json as unknown as Prefs);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [hydrated, status, token, configured]);

  const signedIn = status === 'signed_in' && !!token;
  const serverOff = !configured || setupNeeded || (prefs ? !prefs.server.push : false);
  const pushOn = thisDevice && !!prefs?.pushEnabled;
  const email = prefs?.email ?? userEmail;

  const togglePush = async () => {
    setNote(null);
    setBusy('push');
    try {
      if (pushOn) {
        const endpoint = await unsubscribePush();
        if (endpoint) await call('/api/reminders/subscribe', 'DELETE', { endpoint });
        setThisDevice(false);
        setPrefs((p) => (p ? { ...p, devices: Math.max(0, p.devices - 1), pushEnabled: p.devices > 1 } : p));
        setNote({ tone: 'ok', text: L('Đã tắt thông báo trên máy này.', 'Notifications turned off on this device.') });
        return;
      }
      const out = await subscribePush();
      if (!out.ok) {
        setNote({
          tone: 'warn',
          text:
            out.reason === 'denied'
              ? L('Thông báo đang bị chặn. Cho phép ở biểu tượng ổ khoá rồi bật lại.', 'Notifications are blocked. Allow them via the lock icon, then retry.')
              : out.reason === 'dismissed'
                ? L('Bạn chưa cho phép thông báo. Bật lại và chọn "Cho phép" khi trình duyệt hỏi.', 'Notifications were not allowed. Turn this on again and choose "Allow" when asked.')
                : out.reason === 'unsupported'
                  ? L('Trình duyệt này không nhận được thông báo đẩy.', "This browser can't receive push notifications.")
                  : L(`Không bật được: ${out.message ?? 'lỗi không rõ'}`, `Could not turn on: ${out.message ?? 'unknown error'}`),
        });
        return;
      }
      const { ok, json } = await call('/api/reminders/subscribe', 'POST', { subscription: out.subscription, locale });
      if (!ok) {
        setNote({ tone: 'warn', text: String(json.error ?? L('Không lưu được trên máy chủ.', 'Could not save on the server.')) });
        return;
      }
      setThisDevice(true);
      setPrefs((p) => (p ? { ...p, pushEnabled: true, devices: p.devices + 1 } : p));
      setNote({ tone: 'ok', text: L('Đã bật. Band 9 sẽ nhắc lúc 20:00 những hôm có từ cần ôn hoặc chuỗi sắp đứt.', "On. Band 9 will remind you at 8 pm (Vietnam time) on days with words due or a streak at risk.") });
    } finally {
      setBusy(null);
    }
  };

  const toggleEmail = async () => {
    if (!prefs) return;
    setNote(null);
    setBusy('email');
    try {
      const next = !prefs.emailEnabled;
      const { ok, json } = await call('/api/reminders/prefs', 'POST', { emailEnabled: next, locale });
      if (!ok) {
        setNote({ tone: 'warn', text: String(json.error ?? L('Không lưu được.', 'Could not save.')) });
        return;
      }
      setPrefs({ ...prefs, emailEnabled: next });
    } finally {
      setBusy(null);
    }
  };

  const sendTest = async () => {
    setNote(null);
    setBusy('test');
    try {
      const { ok, json } = await call('/api/reminders/test', 'POST');
      if (!ok) {
        setNote({ tone: 'warn', text: String(json.error ?? L('Không gửi thử được.', 'Could not send the test.')) });
        return;
      }
      const push = json.push as { sent?: number } | null;
      const parts: string[] = [];
      if (push?.sent) parts.push(L(`${push.sent} máy`, `${push.sent} ${push.sent === 1 ? 'device' : 'devices'}`));
      if (json.email === 'sent') parts.push(L('email', 'email'));
      setNote({ tone: 'ok', text: L(`Đã gửi thử tới ${parts.join(' và ')}.`, `Test sent to ${parts.join(' and ')}.`) });
    } finally {
      setBusy(null);
    }
  };

  // Dòng trạng thái: ưu tiên điều chặn người dùng nhất.
  let statusText: string;
  if (serverOff) statusText = L('Chưa bật trên máy chủ.', 'Not enabled on the server yet.');
  else if (!hydrated || status === 'loading') statusText = '';
  else if (!signedIn) statusText = L('Cần đăng nhập: lời nhắc dựng từ tiến độ đã đồng bộ lên tài khoản của bạn.', 'Sign in first: reminders are built from the progress synced to your account.');
  else if (support === 'ios-install')
    statusText = L('iPhone/iPad: Chia sẻ → "Thêm vào MH chính", mở Band 9 từ đó rồi bật lại.', 'iPhone/iPad: Share → "Add to Home Screen", open Band 9 from there, then turn it on.');
  else if (support === 'unsupported') statusText = L('Trình duyệt này không hỗ trợ thông báo. Dùng email hoặc Chrome/Edge/Safari mới.', 'This browser can\'t do notifications. Use email or a recent Chrome/Edge/Safari.');
  else if (perm === 'denied' && !pushOn)
    statusText = L('Thông báo đang bị chặn. Cho phép ở biểu tượng ổ khoá cạnh thanh địa chỉ.', 'Notifications are blocked. Allow them via the lock icon by the address bar.');
  else if (pushOn) statusText = L(`Đang bật trên máy này${prefs && prefs.devices > 1 ? ` và ${prefs.devices - 1} máy khác` : ''}. Nhắc lúc 20:00, chỉ những hôm có điều cần nhắc.`, `On for this device${prefs && prefs.devices > 1 ? ` and ${prefs.devices - 1} other${prefs.devices > 2 ? 's' : ''}` : ''}. Reminders at 8 pm, only on days that need one.`);
  else statusText = L('Tắt trên máy này.', 'Off on this device.');

  const pushDisabled = serverOff || !signedIn || support !== 'ok' || !prefs || (perm === 'denied' && !pushOn);
  const emailAvailable = !!prefs?.server.email;
  const canTest = signedIn && !serverOff && !!prefs && (pushOn || (prefs.emailEnabled && emailAvailable));

  return (
    <Card className="mt-4">
      <View style={{ opacity: serverOff ? 0.6 : 1 }}>
        <SectionHeader
          title={L('Nhắc học', 'Study reminders')}
          subtitle={L('Thông báo lúc 20:00 khi còn từ cần ôn hoặc chuỗi ngày sắp đứt — kể cả khi đã đóng Band 9', 'A notification at 8 pm when words are due or your streak is at risk — even when Band 9 is closed')}
          icon="bell"
        />
        <ToggleRow
          label={L('Thông báo trên máy này', 'Notifications on this device')}
          on={pushOn}
          disabled={pushDisabled}
          busy={busy === 'push'}
          onPress={() => void togglePush()}
        />
        <ToggleRow
          label={L('Email nhắc học', 'Email reminders')}
          hint={
            !signedIn
              ? L('Cần đăng nhập', 'Sign in required')
              : !email
                ? L('Tài khoản này chưa có email', 'This account has no email')
                : !emailAvailable && prefs
                  ? L(`${email} · máy chủ chưa bật gửi email`, `${email} · email sending is not enabled on the server`)
                  : email
          }
          on={!!prefs?.emailEnabled}
          disabled={serverOff || !signedIn || !prefs || !email || (!emailAvailable && !prefs.emailEnabled)}
          busy={busy === 'email'}
          onPress={() => void toggleEmail()}
        />
        <View className="mt-3 flex-row flex-wrap items-center" style={{ gap: 8 }}>
          <Button label={L('Gửi thử', 'Send a test')} size="sm" variant="outline" iconLeft="bell" disabled={!canTest} loading={busy === 'test'} onPress={() => void sendTest()} />
          {hydrated && status === 'signed_out' && !serverOff ? (
            <Button label={L('Đăng nhập', 'Sign in')} size="sm" onPress={() => router.push('/auth/sign-in' as never)} />
          ) : null}
        </View>
        {statusText ? <Text className="mt-3 font-sans text-label text-muted">{statusText}</Text> : null}
        {note ? (
          <Text accessibilityLiveRegion="polite" className="mt-2 font-sans text-label" style={{ color: note.tone === 'ok' ? color.ink : '#B42318' }}>
            {note.text}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
