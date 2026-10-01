import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, Icon } from '@/components/ui';
import {
  UNKNOWN_CAPABILITIES,
  fetchAuthCapabilities,
  type AuthCapabilities,
} from '@/services/auth/capabilities';
import { PHONE_ERROR_LABEL, parsePhone } from '@/services/auth/phone';
import { MIN_PASSWORD, validateSignUp } from '@/services/auth/password';
import {
  isAuthAvailable,
  sendEmailOtp,
  sendPhoneOtp,
  signInWithOAuth,
  signInWithPassword,
  signUpWithPassword,
} from '@/services/auth/session';
import { color } from '@/theme/tokens';
import { CrossFade } from '@/components/motion/Motion';

/**
 * Màn đăng nhập.
 *
 * ĐĂNG NHẬP LÀ TUỲ CHỌN, không phải cửa vào — và màn hình này nói thẳng điều đó
 * ngay dòng đầu. App học được ngay khi mở lên, dữ liệu nằm trên thiết bị; tài
 * khoản chỉ để mang dữ liệu ấy sang máy khác. Bắt đăng nhập trước khi cho dùng
 * là cách nhanh nhất khiến người ta đóng app.
 *
 * Bốn cách đăng nhập chung một tài khoản nếu trùng email. Số điện thoại để đầu
 * vì đó là cách người Việt quen nhất, còn Google/Facebook để trên cùng vì chúng
 * nhanh nhất.
 */
export default function SignInScreen() {
  const available = isAuthAvailable();

  /*
    Cách đăng nhập nào đang bật là do console Supabase quyết định, không phải
    code. Hỏi máy chủ rồi mới vẽ nút, thay vì bày đủ bốn cái rồi để ba cái dẫn
    tới trang lỗi. Trong lúc chờ thì coi như chỉ có email — cái luôn chạy được.
  */
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [caps, setCaps] = useState<AuthCapabilities>(UNKNOWN_CAPABILITIES);

  useEffect(() => {
    let alive = true;
    void fetchAuthCapabilities().then((next) => {
      if (!alive) return;
      setCaps(next);
      // SMS chưa bật thì đừng để tab SMS đứng trước — người dùng gõ xong số mới
      // biết là không gửi được.
      if (!next.phone) setMode('email');
    });
    return () => {
      alive = false;
    };
  }, []);

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  /**
   * Email dùng MẬT KHẨU (26/09/2026, người dùng: "cho là phần tạo tài khoản
   * mk đi, không cần gửi link về gmail nữa"). Liên kết qua email chỉ còn là lối
   * phụ cho tài khoản cũ chưa có mật khẩu và người quên mật khẩu.
   */
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startOAuth = async (provider: 'google' | 'facebook') => {
    setError(null);
    setBusy(provider);
    const result = await signInWithOAuth(provider);
    setBusy(null);
    if (!result.ok) setError(result.error.message);
  };

  const startPhone = async () => {
    setError(null);
    const parsed = parsePhone(phone);
    if (!parsed.ok) {
      setError(PHONE_ERROR_LABEL[parsed.reason]);
      return;
    }

    setBusy('phone');
    const result = await sendPhoneOtp(parsed.e164);
    setBusy(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.push(`/auth/otp?channel=sms&target=${encodeURIComponent(parsed.e164)}` as never);
  };

  const submitPassword = async () => {
    setError(null);
    if (emailMode === 'signup') {
      const checked = validateSignUp(email, password, name);
      if (!checked.ok) {
        setError(checked.error);
        return;
      }
      setBusy('email');
      const result = await signUpWithPassword(checked.email, checked.password, checked.name ?? undefined);
      setBusy(null);
      if (!result.ok) {
        setError(result.error.message);
        if (result.taken) setEmailMode('signin');
        return;
      }
      router.replace('/dashboard' as never);
      return;
    }
    const value = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setError('Email chưa đúng định dạng.');
      return;
    }
    if (!password) {
      setError('Nhập mật khẩu.');
      return;
    }
    setBusy('email');
    const result = await signInWithPassword(value, password);
    setBusy(null);
    if (!result.ok) {
      setError(
        result.error.kind === 'invalid_credentials'
          ? 'Sai email hoặc mật khẩu. Tài khoản cũ tạo bằng liên kết chưa có mật khẩu — bấm "Nhận liên kết qua email" bên dưới.'
          : result.error.message,
      );
      return;
    }
    router.replace('/dashboard' as never);
  };

  const startEmail = async () => {
    setError(null);
    const value = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setError('Email chưa đúng định dạng.');
      return;
    }

    setBusy('email');
    const result = await sendEmailOtp(value);
    setBusy(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.push(`/auth/otp?channel=email&target=${encodeURIComponent(value)}` as never);
  };

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 460 }}>
        <Text className="font-heavy text-pageTitle text-ink">{mode === 'email' && emailMode === 'signup' ? 'Tạo tài khoản' : 'Đăng nhập'}</Text>
        <Text className="mt-1 font-sans text-body text-muted">
          Không đăng nhập vẫn học bình thường — dữ liệu lưu ngay trên thiết bị này. Tài khoản chỉ để
          mang tiến độ sang máy khác và giữ lại khi đổi máy.
        </Text>

        {!available ? (
          <Card className="mt-4" variant="flat">
            <View className="flex-row items-start gap-2">
              <Icon name="info" size={17} color={color.warning} />
              <Text className="flex-1 font-sans text-body text-ink">
                Ứng dụng chưa nối máy chủ tài khoản, nên các nút bên dưới chưa dùng được. Mọi thứ
                khác vẫn chạy đủ.
              </Text>
            </View>
          </Card>
        ) : null}

        <Card className="mt-4">
          {caps.google || caps.facebook ? (
            <>
              {caps.google ? (
                <ProviderButton
                  label="Tiếp tục với Google"
                  mark="G"
                  markColor="#EA4335"
                  markBg="#FFFFFF"
                  bordered
                  busy={busy === 'google'}
                  disabled={!available || busy !== null}
                  onPress={() => startOAuth('google')}
                />
              ) : null}
              {caps.google && caps.facebook ? <View className="h-2" /> : null}
              {caps.facebook ? (
                <ProviderButton
                  label="Tiếp tục với Facebook"
                  mark="f"
                  markColor="#FFFFFF"
                  markBg="#C59645"
                  busy={busy === 'facebook'}
                  disabled={!available || busy !== null}
                  onPress={() => startOAuth('facebook')}
                />
              ) : null}

              <View className="my-4 flex-row items-center gap-3">
                <View className="h-px flex-1 bg-border" />
                <Text className="font-mid text-label text-subtle">hoặc</Text>
                <View className="h-px flex-1 bg-border" />
              </View>
            </>
          ) : null}

          {caps.phone ? (
            <View className="flex-row gap-2">
              <TabPill
                label="Số điện thoại"
                active={mode === 'phone'}
                onPress={() => setMode('phone')}
              />
              <TabPill label="Email" active={mode === 'email'} onPress={() => setMode('email')} />
            </View>
          ) : null}

          <CrossFade swapKey={mode}>
          {caps.phone && mode === 'phone' ? (
            <View className="mt-3">
              <Text className="font-mid text-label text-muted">Số di động</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="09xx xxx xxx"
                placeholderTextColor={color.subtle}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={available && busy === null}
                className="mt-1.5 rounded-card border border-borderStrong bg-surface px-3 py-2.5 font-sans text-body text-ink"
              />
              <Button
                className="mt-3"
                label="Gửi mã qua SMS"
                iconRight="arrow-right"
                fullWidth
                loading={busy === 'phone'}
                disabled={!available || busy !== null}
                onPress={startPhone}
              />
              <Text className="mt-2 font-sans text-label text-muted">
                Mã gồm 6 chữ số, thường tới trong vòng một phút.
              </Text>
            </View>
          ) : (
            <View className="mt-3">
              <View className="flex-row gap-2">
                <TabPill label="Đăng nhập" active={emailMode === 'signin'} onPress={() => { setEmailMode('signin'); setError(null); }} />
                <TabPill label="Tạo tài khoản" active={emailMode === 'signup'} onPress={() => { setEmailMode('signup'); setError(null); }} />
              </View>

              {emailMode === 'signup' ? (
                <>
                  <Text className="mt-3 font-mid text-label text-muted">Tên hiển thị (không bắt buộc)</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Tên hiện trên bảng xếp hạng"
                    placeholderTextColor={color.subtle}
                    autoComplete="name"
                    editable={available && busy === null}
                    className="mt-1.5 rounded-card border border-borderStrong bg-surface px-3 py-2.5 font-sans text-body text-ink"
                  />
                </>
              ) : null}

              <Text className="mt-3 font-mid text-label text-muted">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="ban@example.com"
                placeholderTextColor={color.subtle}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={available && busy === null}
                className="mt-1.5 rounded-card border border-borderStrong bg-surface px-3 py-2.5 font-sans text-body text-ink"
              />

              <Text className="mt-3 font-mid text-label text-muted">Mật khẩu</Text>
              <View className="mt-1.5 flex-row items-center rounded-card border border-borderStrong bg-surface">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={emailMode === 'signup' ? `Ít nhất ${MIN_PASSWORD} ký tự` : 'Mật khẩu của bạn'}
                  placeholderTextColor={color.subtle}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={emailMode === 'signup' ? 'new-password' : 'current-password'}
                  editable={available && busy === null}
                  onSubmitEditing={() => void submitPassword()}
                  className="flex-1 px-3 py-2.5 font-sans text-body text-ink"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onPress={() => setShowPassword((v) => !v)}
                  className="px-3 py-2"
                >
                  <Text className="font-semi text-label" style={{ color: color.primary }}>
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </Text>
                </Pressable>
              </View>

              <Button
                className="mt-3"
                label={emailMode === 'signup' ? 'Tạo tài khoản' : 'Đăng nhập'}
                iconRight="arrow-right"
                fullWidth
                loading={busy === 'email'}
                disabled={!available || busy !== null}
                onPress={() => void submitPassword()}
              />
              <Text className="mt-2 font-sans text-label text-muted">
                {emailMode === 'signup'
                  ? 'Tạo xong là vào học ngay — không cần mở Gmail xác nhận.'
                  : 'Chưa có tài khoản? Chọn "Tạo tài khoản" ở trên.'}
              </Text>

              <Pressable accessibilityRole="button" onPress={() => void startEmail()} disabled={!available || busy !== null} className="mt-3 self-start">
                <Text className="font-semi text-label" style={{ color: color.primary }}>
                  Quên mật khẩu / tài khoản cũ chưa có mật khẩu? Nhận liên kết qua email
                </Text>
              </Pressable>
            </View>
          )}
          </CrossFade>

          {error ? (
            <View className="mt-3 flex-row items-start gap-2 rounded-card bg-danger-soft p-2.5">
              <Icon name="info" size={16} color={color.danger} />
              <Text className="flex-1 font-sans text-body text-danger-ink">{error}</Text>
            </View>
          ) : null}
        </Card>

        <Card className="mt-4" variant="flat">
          <View className="flex-row items-center gap-2">
            <Badge label="Riêng tư" tone="success" shape="tag" />
            <Text className="flex-1 font-sans text-label text-muted">
              Chúng tôi chỉ lưu tiến độ học của bạn. Không đọc danh bạ, không đăng gì lên Facebook,
              không bán dữ liệu cho ai.
            </Text>
          </View>
        </Card>

        <Button
          className="mt-4 self-center"
          label="Để sau, học trước đã"
          variant="ghost"
          onPress={() => router.replace('/dashboard' as never)}
        />
      </View>
    </Screen>
  );
}

function ProviderButton({
  label,
  mark,
  markColor,
  markBg,
  bordered = false,
  busy,
  disabled,
  onPress,
}: {
  label: string;
  mark: string;
  markColor: string;
  markBg: string;
  bordered?: boolean;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={disabled ? undefined : onPress}
      className={`flex-row items-center justify-center gap-3 rounded-card border px-4 py-3 ${
        disabled ? 'border-border bg-surfaceAlt' : 'border-borderStrong bg-surface'
      }`}
    >
      <View
        className={`h-6 w-6 items-center justify-center rounded-pill ${bordered ? 'border border-border' : ''}`}
        style={{ backgroundColor: markBg }}
      >
        {busy ? (
          <ActivityIndicator size="small" color={markColor} />
        ) : (
          <Text className="font-heavy text-body" style={{ color: markColor }}>
            {mark}
          </Text>
        )}
      </View>
      <Text className={`font-semi text-body ${disabled ? 'text-subtle' : 'text-ink'}`}>{label}</Text>
    </Pressable>
  );
}

function TabPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={active}
      onPress={onPress}
      className={`flex-1 items-center rounded-pill border px-3 py-2 ${
        active ? 'border-primary-600 bg-primary-50' : 'border-border bg-surface'
      }`}
    >
      <Text className={active ? 'font-strong text-body text-primary-700' : 'font-mid text-body text-muted'}>
        {label}
      </Text>
    </Pressable>
  );
}
