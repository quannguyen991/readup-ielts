import React, { useEffect, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Button } from '@/components/ui';
import { CuteBook } from '@/components/illust/Cute';
import { Field, Note, P, PageHead, Section, Sheet, TextAction } from '@/components/classes/ClassKit';
import { classApi, clearPendingCode, savePendingCode, type JoinPreview } from '@/services/classes/client';
import { CLASS_CODE_LENGTH, isValidClassCode, normalizeClassCode } from '@/services/classes/code';
import { DISPLAY_NAME_MAX } from '@/services/classes/rules';
import { displayableName } from '@/services/gamification/display-name';
import { useAuthStore } from '@/store/useAuthStore';
import { useL } from '@/i18n/useL';

/**
 * VÀO LỚP BẰNG MÃ — `/join?ma=ABC234` (link giáo viên gửi) hoặc gõ tay.
 *
 * Gõ đủ 6 ký tự là tra ngay tên lớp, để học sinh thấy mình sắp vào lớp nào
 * trước khi bấm. Chưa đăng nhập thì giữ mã lại trên máy rồi đưa sang đăng nhập;
 * đăng nhập xong, thẻ "Lớp của tôi" ở trang Hôm nay mời vào tiếp.
 */
export default function JoinClassScreen() {
  const { L } = useL();
  const params = useLocalSearchParams<{ ma?: string; code?: string }>();
  const status = useAuthStore((s) => s.status);
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const profileName = useAuthStore((s) => displayableName(s.profile?.displayName ?? null));
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const initial = normalizeClassCode(String(params.ma ?? params.code ?? '')).slice(0, CLASS_CODE_LENGTH);
  const [code, setCode] = useState(initial);
  const [lookup, setLookup] = useState<{ code: string; preview?: JoinPreview; error?: string } | null>(null);
  // Tên điền sẵn từ hồ sơ cho tới khi người dùng tự sửa.
  const [nameEdit, setNameEdit] = useState<string | null>(null);
  const name = nameEdit ?? profileName ?? '';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clean = normalizeClassCode(code);
  const valid = isValidClassCode(clean);
  const preview = lookup?.code === clean ? (lookup.preview ?? null) : null;
  const lookupError = valid && lookup?.code === clean ? (lookup.error ?? null) : null;

  useEffect(() => {
    if (!valid || status === 'loading') return;
    let live = true;
    classApi<JoinPreview>(`/api/classes/join?code=${clean}`, { token })
      .then((p) => live && setLookup({ code: clean, preview: p }))
      .catch((e: unknown) => live && setLookup({ code: clean, error: e instanceof Error ? e.message : String(e) }));
    return () => {
      live = false;
    };
  }, [clean, valid, token, status]);

  const join = async () => {
    if (!valid) return;
    if (!token) {
      savePendingCode(clean);
      router.push('/auth/sign-in' as never);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await classApi<{ class: { id: string } }>('/api/classes/join', { token, method: 'POST', body: { code: clean, displayName: name.trim() || null } });
      clearPendingCode();
      router.replace(`/class/${res.class.id}` as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  const already = preview?.member;
  const own = preview?.isTeacher;

  return (
    <Screen>
      <Appear>
        <PageHead
          kicker={L('BAND 9 · VÀO LỚP', 'BAND 9 · JOIN A CLASS')}
          title={L('Vào lớp bằng mã', 'Join with a class code')}
          subtitle={L('Giáo viên đưa bạn mã 6 ký tự. Gõ thường hay hoa đều được.', 'Your teacher gives you a 6-character code. Upper or lower case both work.')}
          art={<CuteBook size={70} />}
        />
      </Appear>

      <View style={{ marginTop: 18, maxWidth: wide ? 620 : undefined }}>
        <Sheet>
          <Section first n="01" title={L('Mã lớp', 'Class code')}>
            <Field value={code} onChange={(v) => setCode(v.toUpperCase())} placeholder="ABC 234" label={L('Mã lớp', 'Class code')} maxLength={10} big />
            {valid && !preview && !lookupError ? <Note text={L('Đang tra mã…', 'Looking up…')} /> : null}
            {lookupError ? <Note text={lookupError} tone="error" /> : null}
            {preview ? (
              <View style={{ marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: P.navy }}>
                <Text className="font-strong" style={{ fontSize: 11, letterSpacing: 1.6, color: 'rgba(255,255,255,0.55)' }}>
                  {L('LỚP', 'CLASS')}
                </Text>
                <Text className="font-heavy" style={{ marginTop: 2, fontSize: 20, lineHeight: 26, color: '#FFFFFF' }}>
                  {preview.class.name}
                </Text>
                {preview.class.teacherName ? (
                  <Text className="font-sans" style={{ marginTop: 2, fontSize: 13, color: P.goldLight }}>
                    {L(`Giáo viên: ${preview.class.teacherName}`, `Teacher: ${preview.class.teacherName}`)}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </Section>

          {own ? (
            <Section n="02" title={L('Đây là lớp của bạn', 'This is your class')} hint={L('Giáo viên không cần vào lớp — mở sổ lớp để xem tiến độ.', "Teachers don't join their own class — open the register instead.")}>
              <Button label={L('Mở sổ lớp', 'Open class register')} variant="brand" iconRight="arrow-right" onPress={() => router.push(`/class/${preview!.class.id}` as never)} />
            </Section>
          ) : already ? (
            <Section n="02" title={L('Bạn đã ở trong lớp này', "You're already in this class")}>
              <Button
                label={L('Xem bài được giao', 'See assignments')}
                variant="brand"
                iconRight="arrow-right"
                onPress={() => {
                  clearPendingCode();
                  router.push(`/class/${preview!.class.id}` as never);
                }}
              />
            </Section>
          ) : (
            <Section
              n="02"
              title={L('Tên của bạn trong lớp', 'Your name in class')}
              hint={L('Giáo viên thấy tên này kèm thời gian học, chuỗi ngày, số từ và bài đã xong — không thấy email hay bài làm.', 'Your teacher sees this name plus study time, streak, word counts and finished assignments — never your email or answers.')}
            >
              {token ? (
                <Field value={name} onChange={setNameEdit} placeholder={L('vd. Nguyễn Minh Anh', 'e.g. Minh Anh Nguyen')} label={L('Tên trong lớp', 'Name in class')} maxLength={DISPLAY_NAME_MAX} />
              ) : (
                <Text className="font-sans" style={{ fontSize: 14, color: P.muted }}>
                  {L('Đăng nhập trước — tiến độ học gắn với tài khoản nên giáo viên mới thấy được.', 'Sign in first — progress is tied to your account, which is how your teacher can see it.')}
                </Text>
              )}
              <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                <Button
                  label={!token ? L('Đăng nhập để vào lớp', 'Sign in to join') : busy ? L('Đang vào…', 'Joining…') : L('Vào lớp', 'Join class')}
                  variant="brand"
                  iconRight="arrow-right"
                  disabled={!valid || busy || (!!token && !preview)}
                  onPress={() => void join()}
                />
                {!token ? (
                  <Text className="font-sans" style={{ flexShrink: 1, fontSize: 12, color: P.muted }}>
                    {L('Đăng nhập xong, mở trang Hôm nay để vào tiếp.', 'After signing in, open the Today page to finish joining.')}
                  </Text>
                ) : null}
              </View>
              {error ? <Note text={error} tone="error" /> : null}
            </Section>
          )}
        </Sheet>
        <View style={{ marginTop: 12 }}>
          <TextAction label={L('Bạn là giáo viên? Mở lớp ở đây', 'Are you a teacher? Open a class here')} icon="arrow-right" onPress={() => router.push('/teacher' as never)} />
        </View>
      </View>
    </Screen>
  );
}
