import React, { useEffect } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Button, Icon } from '@/components/ui';
import type { IconName } from '@/components/ui/Icon';
import { FREE_SUMMARY, LOCKED_SUMMARY } from '@/lib/access/member-gate';
import { WELCOME_DAYS } from '@/lib/billing/welcome';
import { WELCOME_SEEN_KEY } from '@/lib/welcome-page';
import { useL } from '@/i18n/useL';


const GOLD = '#A8843F';
const INK = '#141A33';
const MUTED = '#5B6278';

type Feature = { icon: IconName; vi: [string, string]; en: [string, string] };
const FEATURES: Feature[] = [
  { icon: 'book', vi: ['Reading & Listening', 'Đề như thi thật, chấm ngay, chỉ rõ câu sai'], en: ['Reading & Listening', 'Exam-style tests, instant marking, every mistake explained'] },
  { icon: 'pencil', vi: ['Writing & Speaking', 'AI chấm theo tiêu chí IELTS, có bài mẫu'], en: ['Writing & Speaking', 'AI feedback on IELTS criteria, with model answers'] },
  { icon: 'grid', vi: ['SAT Math & Reading/Writing', 'Đáp án tính bằng code, không do AI đoán'], en: ['SAT Math & Reading/Writing', 'Answers computed by code, never guessed by AI'] },
  { icon: 'letters', vi: ['Từ vựng', 'Phát âm chuẩn, lịch ôn tự xếp theo trí nhớ'], en: ['Vocabulary', 'Clear pronunciation, reviews scheduled for you'] },
];

/**
 * TRANG GIỚI THIỆU NGẮN — cửa vào cho người lần đầu bấm link (không thanh bên, không băng khuyến mãi).
 * Ít chữ: một câu Band 9 là gì, bốn mảng mỗi mảng một dòng, phần nào mở/khoá, hai nút.
 */
export default function WelcomeScreen() {
  const { L, en } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 820;

  useEffect(() => {
    try {
      localStorage.setItem(WELCOME_SEEN_KEY, '1');
    } catch {
      /* không lưu được (chế độ riêng tư) — lần sau vẫn thấy trang này, không sao */
    }
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FBF6EE' }} contentContainerStyle={{ flexGrow: 1 }}>
      <View className="mx-auto w-full px-5" style={{ maxWidth: 1040, paddingTop: 22, paddingBottom: 40 }}>
        {/* Thanh trên: tên + đăng nhập */}
        <View className="flex-row items-center justify-between">
          <Text style={{ fontSize: 22, fontWeight: '800', color: INK, letterSpacing: -0.5 }}>
            Band <Text style={{ color: GOLD }}>9</Text>
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/auth/sign-in?mode=signin' as never)}
            className="rounded-pill px-4 py-2"
            style={{ borderWidth: 1, borderColor: '#E3D6BC' }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: INK }}>{L('Đăng nhập', 'Sign in')}</Text>
          </Pressable>
        </View>

        {/* Mở đầu */}
        <View style={{ marginTop: wide ? 72 : 44, alignItems: wide ? 'flex-start' : 'center' }}>
          <View className="rounded-pill px-3 py-1" style={{ backgroundColor: '#F1E6CC' }}>
            <Text style={{ fontSize: 12.5, fontWeight: '800', letterSpacing: 1.5, color: '#7A5E24' }}>IELTS · SAT</Text>
          </View>
          <Text
            style={{
              marginTop: 16,
              fontSize: wide ? 52 : 34,
              lineHeight: wide ? 60 : 41,
              fontWeight: '800',
              letterSpacing: -1.2,
              color: INK,
              textAlign: wide ? 'left' : 'center',
              maxWidth: 760,
            }}
          >
            {L('Luyện thi bằng đề thật,', 'Practise with real-style tests,')}
            {'\n'}
            <Text style={{ color: GOLD }}>{L('sai chỗ nào biết chỗ đó.', 'see exactly what went wrong.')}</Text>
          </Text>
          <Text style={{ marginTop: 14, fontSize: 17, lineHeight: 26, color: MUTED, textAlign: wide ? 'left' : 'center', maxWidth: 560 }}>
            {L(`Miễn phí để bắt đầu. Tài khoản mới được tặng ${WELCOME_DAYS} ngày gói Plus.`, `Free to start. New accounts get ${WELCOME_DAYS} days of Plus.`)}
          </Text>
          <View className={wide ? 'flex-row gap-3' : 'w-full gap-2.5'} style={{ marginTop: 24, maxWidth: wide ? undefined : 420 }}>
            <Button label={L('Học thử ngay', 'Try it now')} iconRight="arrow-right" onPress={() => router.replace('/intro' as never)} fullWidth={!wide} />
            <Button
              label={L('Tạo tài khoản miễn phí', 'Create a free account')}
              variant="secondary"
              onPress={() => router.push('/auth/sign-in?mode=signup&next=%2Fintro' as never)}
              fullWidth={!wide}
            />
          </View>
        </View>

        {/* Bốn mảng */}
        <View className="flex-row flex-wrap" style={{ marginTop: wide ? 64 : 40, gap: 14 }}>
          {FEATURES.map((f) => {
            const [title, line] = en ? f.en : f.vi;
            return (
              <View
                key={title}
                style={{
                  flexGrow: 1,
                  flexBasis: wide ? 220 : '100%',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 18,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: '#EFE5D2',
                }}
              >
                <View className="items-center justify-center rounded-full" style={{ width: 38, height: 38, backgroundColor: '#F6EEDC' }}>
                  <Icon name={f.icon} size={19} color={GOLD} />
                </View>
                <Text style={{ marginTop: 12, fontSize: 16.5, fontWeight: '800', color: INK }}>{title}</Text>
                <Text style={{ marginTop: 4, fontSize: 14.5, lineHeight: 21, color: MUTED }}>{line}</Text>
              </View>
            );
          })}
        </View>

        {/* Mở / khoá */}
        <View style={{ marginTop: 18, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#EFE5D2', gap: 12 }}>
          <AccessRow label={L('Dùng ngay, không cần tài khoản', 'Open to everyone')} items={en ? FREE_SUMMARY.en : FREE_SUMMARY.vi} free />
          <AccessRow label={L('Cần tài khoản (miễn phí)', 'Needs a free account')} items={en ? LOCKED_SUMMARY.en : LOCKED_SUMMARY.vi} />
        </View>

        <Text style={{ marginTop: 28, textAlign: 'center', fontSize: 13, color: '#9A9285' }}>band9-ielts.vercel.app</Text>
      </View>
    </ScrollView>
  );
}

function AccessRow({ label, items, free = false }: { label: string; items: string[]; free?: boolean }) {
  return (
    <View className="flex-row flex-wrap items-center" style={{ gap: 6 }}>
      <View className="flex-row items-center" style={{ gap: 6, marginRight: 4 }}>
        <Icon name={free ? 'check' : 'lock'} size={15} color={free ? '#17784F' : GOLD} />
        <Text style={{ fontSize: 14, fontWeight: '800', color: INK }}>{label}:</Text>
      </View>
      {items.map((x) => (
        <View key={x} className="rounded-pill px-3 py-1" style={{ backgroundColor: free ? 'rgba(34,160,107,0.10)' : '#F4EEE2' }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: free ? '#17784F' : '#6B5A3A' }}>{x}</Text>
        </View>
      ))}
    </View>
  );
}
