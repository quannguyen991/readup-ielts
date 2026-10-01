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
import { PHONE_ERROR_LABEL, parsePhone, type PhoneError } from '@/services/auth/phone';
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
import { useL } from '@/i18n/useL';

/** Bản tiếng Anh của `PHONE_ERROR_LABEL` (dữ liệu gốc giữ tiếng Việt). */
const PHONE_ERROR_LABEL_EN: Record<PhoneError, string> = {
  empty: 'Enter a phone number.',
  not_digits: 'A phone number can only contain digits, spaces, dots, dashes and a leading +.',
  too_short: 'That phone number is too short.',
  too_long: 'That phone number is too long.',
  not_vn_mobile: "That isn't a Vietnamese mobile prefix. Mobile numbers start with 03, 05, 07, 08 or 09.",
};

/** Bản tiếng Anh cho lỗi của `validateSignUp` (hàm dùng chung với máy chủ nên giữ tiếng Việt). */
const SIGNUP_ERROR_EN: Record<string, string> = {
  'Email chưa đúng định dạng.': "That email address doesn't look right.",
  [`Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`]: `Your password needs at least ${MIN_PASSWORD} characters.`,
  'Mật khẩu dài quá 72 ký tự.': 'Your password is longer than 72 characters.',
  'Mật khẩu không nên chỉ toàn số — thêm vài chữ cái.': "Don't use only numbers — add a few letters.",
  'Mật khẩu đừng trùng với email.': "Your password shouldn't match your email.",
};

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
  const { L, en } = useL();

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
      setError(en ? PHONE_ERROR_LABEL_EN[parsed.reason] : PHONE_ERROR_LABEL[parsed.reason]);
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
        setError(en ? (SIGNUP_ERROR_EN[checked.error] ?? checked.error) : checked.error);
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
      setError(L('Email chưa đúng định dạng.', "That email address doesn't look right."));
      return;
    }
    if (!password) {
      setError(L('Nhập mật khẩu.', 'Enter your password.'));
      return;
    }
    setBusy('email');
    const result = await signInWithPassword(value, password);
    setBusy(null);
    if (!result.ok) {
      setError(
        result.error.kind === 'invalid_credentials'
          ? L('Sai email hoặc mật khẩu. Tài khoản cũ tạo bằng liên kết chưa có mật khẩu — bấm "Nhận liên kết qua email" bên dưới.', 'Wrong email or password. Older accounts created with a link have no password yet — tap "Get a link by email" below.')
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
      setError(L('Email chưa đúng định dạng.', "That email address doesn't look right."));
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
        <Text className="font-heavy text-pageTitle text-ink">{mode === 'email' && emailMode === 'signup' ? L('Tạo tài khoản', 'Create account') : L('Đăng nhập', 'Sign in')}</Text>
        <Text className="mt-1 font-sans text-body text-muted">
          {L('Không đăng nhập vẫn học bình thường — dữ liệu lưu ngay trên thiết bị này. Tài khoản chỉ để mang tiến độ sang máy khác và giữ lại khi đổi máy.', 'You can study without signing in — your data is saved on this device. An account just carries your progress to other devices and keeps it when you switch.')}
        </Text>

        {!available ? (
          <Card className="mt-4" variant="flat">
            <View className="flex-row items-start gap-2">
              <Icon name="info" size={17} color={color.warning} />
              <Text className="flex-1 font-sans text-body text-ink">
                {L('Ứng dụng chưa nối máy chủ tài khoản, nên các nút bên dưới chưa dùng được. Mọi thứ khác vẫn chạy đủ.', "The app isn't connected to the account server yet, so the buttons below won't work. Everything else runs as normal.")}
              </Text>
            </View>
          </Card>
        ) : null}

        <Card className="mt-4">
          {caps.google || caps.facebook ? (
            <>
              {caps.google ? (
                <ProviderButton
                  label={L('Tiếp tục với Google', 'Continue with Google')}
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
                  label={L('Tiếp tục với Facebook', 'Continue with Facebook')}
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
                <Text className="font-mid text-label text-subtle">{L('hoặc', 'or')}</Text>
                <View className="h-px flex-1 bg-border" />
              </View>
            </>
          ) : null}

          {caps.phone ? (
            <View className="flex-row gap-2">
              <TabPill
                label={L('Số điện thoại', 'Phone')}
                active={mode === 'phone'}
                onPress={() => setMode('phone')}
              />
              <TabPill label="Email" active={mode === 'email'} onPress={() => setMode('email')} />
            </View>
          ) : null}

          <CrossFade swapKey={mode}>
          {caps.phone && mode === 'phone' ? (
            <View className="mt-3">
              <Text className="font-mid text-label text-muted">{L('Số di động', 'Mobile number')}</Text>
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
                label={L('Gửi mã qua SMS', 'Send code by SMS')}
                iconRight="arrow-right"
                fullWidth
                loading={busy === 'phone'}
                disabled={!available || busy !== null}
                onPress={startPhone}
              />
              <Text className="mt-2 font-sans text-label text-muted">
                {L('Mã gồm 6 chữ số, thường tới trong vòng một phút.', 'A 6-digit code, usually arrives within a minute.')}
              </Text>
            </View>
          ) : (
            <View className="mt-3">
              <View className="flex-row gap-2">
                <TabPill label={L('Đăng nhập', 'Sign in')} active={emailMode === 'signin'} onPress={() => { setEmailMode('signin'); setError(null); }} />
                <TabPill label={L('Tạo tài khoản', 'Create account')} active={emailMode === 'signup'} onPress={() => { setEmailMode('signup'); setError(null); }} />
              </View>

              {emailMode === 'signup' ? (
                <>
                  <Text className="mt-3 font-mid text-label text-muted">{L('Tên hiển thị (không bắt buộc)', 'Display name (optional)')}</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={L('Tên hiện trên bảng xếp hạng', 'Name shown on leaderboards')}
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
                placeholder={L('ban@example.com', 'you@example.com')}
                placeholderTextColor={color.subtle}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={available && busy === null}
                className="mt-1.5 rounded-card border border-borderStrong bg-surface px-3 py-2.5 font-sans text-body text-ink"
              />

              <Text className="mt-3 font-mid text-label text-muted">{L('Mật khẩu', 'Password')}</Text>
              <View className="mt-1.5 flex-row items-center rounded-card border border-borderStrong bg-surface">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={emailMode === 'signup' ? L(`Ít nhất ${MIN_PASSWORD} ký tự`, `At least ${MIN_PASSWORD} characters`) : L('Mật khẩu của bạn', 'Your password')}
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
                  accessibilityLabel={showPassword ? L('Ẩn mật khẩu', 'Hide password') : L('Hiện mật khẩu', 'Show password')}
                  onPress={() => setShowPassword((v) => !v)}
                  className="px-3 py-2"
                >
                  <Text className="font-semi text-label" style={{ color: color.primary }}>
                    {showPassword ? L('Ẩn', 'Hide') : L('Hiện', 'Show')}
                  </Text>
                </Pressable>
              </View>

              <Button
                className="mt-3"
                label={emailMode === 'signup' ? L('Tạo tài khoản', 'Create account') : L('Đăng nhập', 'Sign in')}
                iconRight="arrow-right"
                fullWidth
                loading={busy === 'email'}
                disabled={!available || busy !== null}
                onPress={() => void submitPassword()}
              />
              <Text className="mt-2 font-sans text-label text-muted">
                {emailMode === 'signup'
                  ? L('Tạo xong là vào học ngay — không cần mở Gmail xác nhận.', 'Start studying right away — no confirmation email needed.')
                  : L('Chưa có tài khoản? Chọn "Tạo tài khoản" ở trên.', 'No account yet? Choose "Create account" above.')}
              </Text>

              <Pressable accessibilityRole="button" onPress={() => void startEmail()} disabled={!available || busy !== null} className="mt-3 self-start">
                <Text className="font-semi text-label" style={{ color: color.primary }}>
                  {L('Quên mật khẩu / tài khoản cũ chưa có mật khẩu? Nhận liên kết qua email', 'Forgot your password, or an older account without one? Get a link by email')}
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
            <Badge label={L('Riêng tư', 'Private')} tone="success" shape="tag" />
            <Text className="flex-1 font-sans text-label text-muted">
              {L('Chúng tôi chỉ lưu tiến độ học của bạn. Không đọc danh bạ, không đăng gì lên Facebook, không bán dữ liệu cho ai.', "We only store your study progress. We don't read your contacts, post to Facebook, or sell your data.")}
            </Text>
          </View>
        </Card>

        <Button
          className="mt-4 self-center"
          label={L('Để sau, học trước đã', 'Later — let me study first')}
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
