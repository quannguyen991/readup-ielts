import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button, Card, Icon } from '@/components/ui';
import { publicEnv } from '@/lib/env';
import { isValidOtp, maskPhone } from '@/services/auth/phone';
import {
  sendEmailOtp,
  sendPhoneOtp,
  verifyEmailOtp,
  verifyPhoneOtp,
} from '@/services/auth/session';
import { useAuthStore } from '@/store/useAuthStore';
import { color } from '@/theme/tokens';

/** Chờ giữa hai lần gửi mã. Mỗi tin SMS tốn tiền thật, nên chặn bấm liên tục. */
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Nhập mã sáu số — dùng chung cho cả SMS lẫn email.
 *
 * Một màn cho hai kênh vì thao tác của người dùng giống hệt nhau: đọc mã, gõ
 * vào, chờ. Chỉ khác chỗ mã tới. Tách hai màn là chép cùng một đoạn logic đếm
 * ngược và tự động gửi đi hai chỗ.
 *
 * TỰ NỘP KHI ĐỦ SÁU SỐ. Đây là chỗ duy nhất trong app tự hành động thay người
 * dùng, và nó đáng: gõ xong còn phải tìm nút bấm là một bước thừa ở đúng lúc
 * người ta đang sốt ruột nhất.
 */
export default function OtpScreen() {
  const { channel, target } = useLocalSearchParams<{ channel?: string; target?: string }>();
  const isSms = channel === 'sms';
  const destination = typeof target === 'string' ? target : '';

  const applySession = useAuthStore((s) => s.applySession);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const submitted = useRef(false);

  const shown = useMemo(() => (isSms ? maskPhone(destination) : destination), [destination, isSms]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const verify = useCallback(
    async (value: string) => {
      if (busy) return;
      setBusy(true);
      setError(null);

      const result = isSms
        ? await verifyPhoneOtp(destination, value)
        : await verifyEmailOtp(destination, value);

      setBusy(false);
      if (!result.ok) {
        submitted.current = false;
        setError(result.error.message);
        setCode('');
        return;
      }

      applySession(result.data);
      void refreshProfile();
      router.replace('/dashboard' as never);
    },
    [applySession, busy, destination, isSms, refreshProfile],
  );

  const onChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6 && !submitted.current) {
      submitted.current = true;
      void verify(digits);
    }
  };

  const resend = async () => {
    setError(null);
    setBusy(true);
    const result = isSms ? await sendPhoneOtp(destination) : await sendEmailOtp(destination);
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      // Máy chủ bảo chờ bao lâu thì chờ đúng bấy lâu, đừng đoán.
      setCooldown(result.error.retryAfterSeconds ?? RESEND_COOLDOWN_SECONDS);
      return;
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  if (!destination) {
    return (
      <Screen>
        <Card>
          <Text className="font-strong text-cardTitle text-ink">Thiếu thông tin</Text>
          <Text className="mt-1 font-sans text-body text-muted">
            Không biết gửi mã tới đâu. Quay lại và nhập số điện thoại hoặc email.
          </Text>
          <Button
            className="mt-3 self-start"
            label="Quay lại đăng nhập"
            onPress={() => router.replace('/auth/sign-in' as never)}
          />
        </Card>
      </Screen>
    );
  }

  /*
    Email trên gói free của Supabase gửi LIÊN KẾT, không gửi mã — mẫu email chỉ
    sửa được khi đã nối SMTP riêng. Ở chế độ đó, bày ô nhập mã là hứa một thứ
    không bao giờ tới. Màn dưới đây nói đúng việc phải làm: mở email, bấm liên
    kết. Nút gửi lại và phần "không nhận được?" vẫn giữ nguyên vì vẫn cần.
  */
  if (!isSms && publicEnv.emailAuthMode === 'link') {
    return (
      <Screen>
        <View className="w-full self-center" style={{ maxWidth: 420 }}>
          <Text className="font-heavy text-pageTitle text-ink">Kiểm tra email</Text>
          <Text className="mt-1 font-sans text-body text-muted">
            Một liên kết đăng nhập vừa được gửi tới{' '}
            <Text className="font-strong text-ink">{shown}</Text>. Mở email và bấm vào liên kết đó —
            bạn sẽ quay lại đây và đăng nhập xong.
          </Text>

          <Card className="mt-4">
            <View className="items-center py-4">
              <View className="h-14 w-14 items-center justify-center rounded-pill bg-primary-50">
                <Icon name="info" size={24} color={color.primary} />
              </View>
              <Text className="mt-3 text-center font-sans text-body text-muted">
                Liên kết dùng được một lần và hết hạn sau ít phút.
              </Text>
              {/*
                Ràng buộc thật của PKCE, không phải lời khuyên chung chung: mã
                đổi lấy phiên nằm trong bộ nhớ của đúng trình duyệt đã bấm gửi.
                Mở email ở điện thoại trong khi bấm gửi ở máy tính là hỏng, và
                thông báo lỗi lúc đó rất khó hiểu — nói trước rẻ hơn nhiều.
              */}
              <Text className="mt-2 text-center font-sans text-label text-subtle">
                Mở liên kết trên chính trình duyệt này — mở ở máy khác sẽ không nhận.
              </Text>
            </View>

            {error ? (
              <View className="mt-1 flex-row items-start gap-2 rounded-card bg-danger-soft p-2.5">
                <Icon name="info" size={16} color={color.danger} />
                <Text className="flex-1 font-sans text-body text-danger-ink">{error}</Text>
              </View>
            ) : null}

            <View className="mt-2 items-center">
              {cooldown > 0 ? (
                <Text className="font-sans text-label text-muted">
                  Gửi lại email sau {cooldown}s
                </Text>
              ) : (
                <Button
                  label="Gửi lại email"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onPress={resend}
                />
              )}
            </View>
          </Card>

          <Card className="mt-4" variant="flat">
            <Text className="font-strong text-label text-ink">Không thấy email?</Text>
            <Text className="mt-1 font-sans text-label text-muted">
              Kiểm tra cả thư mục Spam và Quảng cáo. Email do Supabase gửi nên người gửi không phải
              tên Band 9.
            </Text>
            <Button
              className="mt-3 self-start"
              label="Đổi cách đăng nhập"
              variant="outline"
              size="sm"
              onPress={() => router.replace('/auth/sign-in' as never)}
            />
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 420 }}>
        <Text className="font-heavy text-pageTitle text-ink">Nhập mã xác nhận</Text>
        <Text className="mt-1 font-sans text-body text-muted">
          Mã gồm 6 chữ số vừa được gửi tới{' '}
          <Text className="font-strong text-ink">{shown}</Text>.
        </Text>

        <Card className="mt-4">
          <TextInput
            value={code}
            onChangeText={onChange}
            placeholder="000000"
            placeholderTextColor={color.subtle}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            editable={!busy}
            autoFocus
            className="rounded-card border border-borderStrong bg-surface px-4 py-4 text-center font-heavy text-ink"
            style={{ fontSize: 30, letterSpacing: 10 }}
          />

          {error ? (
            <View className="mt-3 flex-row items-start gap-2 rounded-card bg-danger-soft p-2.5">
              <Icon name="info" size={16} color={color.danger} />
              <Text className="flex-1 font-sans text-body text-danger-ink">{error}</Text>
            </View>
          ) : null}

          <Button
            className="mt-3"
            label="Xác nhận"
            fullWidth
            loading={busy}
            disabled={!isValidOtp(code) || busy}
            onPress={() => verify(code)}
          />

          <View className="mt-3 items-center">
            {cooldown > 0 ? (
              <Text className="font-sans text-label text-muted">
                Gửi lại mã sau {cooldown}s
              </Text>
            ) : (
              <Button label="Gửi lại mã" variant="ghost" size="sm" disabled={busy} onPress={resend} />
            )}
          </View>
        </Card>

        <Card className="mt-4" variant="flat">
          <Text className="font-strong text-label text-ink">Không nhận được mã?</Text>
          <Text className="mt-1 font-sans text-label text-muted">
            {isSms
              ? 'Kiểm tra sóng và hộp thư rác của tin nhắn. Số phải là số di động đang hoạt động — SMS không gửi tới số bàn được.'
              : 'Kiểm tra cả thư mục Spam và Quảng cáo. Mã có hiệu lực trong ít phút.'}
          </Text>
          <Button
            className="mt-3 self-start"
            label="Đổi cách đăng nhập"
            variant="outline"
            size="sm"
            onPress={() => router.replace('/auth/sign-in' as never)}
          />
        </Card>
      </View>
    </Screen>
  );
}
