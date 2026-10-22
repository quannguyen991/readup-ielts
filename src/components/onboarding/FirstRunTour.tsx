import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { Appear } from '@/components/motion/Motion';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';

/**
 * Hướng dẫn lần đầu: phủ lên màn hình, vài bước ngắn, có Bỏ qua. Chỉ hiện một lần
 * trên máy này — cờ lưu localStorage, đọc/ghi bọc try/catch. Nếu trình duyệt chặn
 * storage thì coi như đã xem, để không hiện lại mỗi lần mở trang.
 */

const TOUR_KEY = 'readup:tour-seen-v1';

function hasSeenTour(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(TOUR_KEY) === '1';
  } catch {
    return true;
  }
}

function markTourSeen(): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(TOUR_KEY, '1');
  } catch {
    // Storage bị chặn: bỏ qua, lần sau có thể hiện lại.
  }
}

type TourStep = { icon: IconName; title: string; line: string };

export function FirstRunTour() {
  const { L } = useL();
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);

  // Đọc cờ sau khi mount để bản render phía máy chủ không lệch với trình duyệt.
  useEffect(() => {
    if (!hasSeenTour()) setOpen(true);
  }, []);

  if (!open) return null;

  const steps: TourStep[] = [
    { icon: 'sparkle', title: L('Chào mừng đến Band 9', 'Welcome to Band 9'), line: L('Luyện IELTS, SAT và từ vựng ở một nơi.', 'IELTS, SAT and vocabulary in one place.') },
    { icon: 'home', title: L('Đi lại dễ dàng', 'Easy to move around'), line: L('Mọi mục học nằm ở thanh điều hướng. Bấm là tới.', 'Every study area sits in the navigation. One tap away.') },
    { icon: 'target', title: L('Học theo lộ trình', 'Learn along a path'), line: L('Lộ trình gợi ý bài kế tiếp theo tiến độ của bạn.', 'Your plan suggests the next lesson from your progress.') },
    { icon: 'trophy', title: L('Chơi để nhớ lâu', 'Play to remember'), line: L('Khu Quest có Tháp Band, Mưa Từ Vựng, Đua Xe Từ và nhiều trò khác.', 'Quest has Band Tower, Word Rain, Word Race and more.') },
    { icon: 'note', title: L('Học qua video', 'Learn from video'), line: L('Chép chính tả, nói nhại và trắc nghiệm trên video thật.', 'Dictation, shadowing and quizzes on real videos.') },
  ];

  const last = at === steps.length - 1;
  const step = steps[at]!;

  const close = () => {
    markTourSeen();
    setOpen(false);
  };
  const next = () => (last ? close() : setAt((v) => v + 1));

  return (
    <View
      accessibilityRole={Platform.OS === 'web' ? ('dialog' as never) : undefined}
      accessibilityLabel={L('Hướng dẫn sử dụng', 'How to use the app')}
      style={
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 200,
          backgroundColor: 'rgba(15,29,51,0.72)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        } as object
      }
    >
      <View
        style={
          {
            width: '100%',
            maxWidth: 440,
            backgroundColor: '#F3F0FB',
            borderRadius: 26,
            borderWidth: 2,
            borderColor: '#2B2350',
            padding: 26,
            gap: 16,
            boxShadow: '0 8px 0 #B94A70',
          } as object
        }
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text className="font-strong" style={{ color: '#B94A70', fontSize: 13, letterSpacing: 0.6 }}>
            {at + 1} / {steps.length}
          </Text>
          <Pressable accessibilityRole="button" onPress={close} hitSlop={8}>
            <Text className="font-strong" style={{ color: '#6B5E4E', fontSize: 14 }}>{L('Bỏ qua', 'Skip')}</Text>
          </Pressable>
        </View>

        <Appear key={at} index={0}>
          <View style={{ gap: 16, alignItems: 'center' }}>
            <Art icon={step.icon} />
            <Text className="font-heavy" style={{ fontSize: 24, lineHeight: 30, color: '#2B2350', textAlign: 'center' }}>{step.title}</Text>
            <Text className="font-sans" style={{ fontSize: 16, lineHeight: 24, color: '#4B4036', textAlign: 'center' }}>{step.line}</Text>
          </View>
        </Appear>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={{ width: i === at ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i === at ? '#B94A70' : '#D8C9B0' }}
            />
          ))}
        </View>

        <Button
          label={last ? L('Bắt đầu học', 'Start learning') : L('Tiếp', 'Next')}
          iconRight={last ? undefined : 'arrow-right'}
          onPress={next}
        />
      </View>
    </View>
  );
}

/** Icon minh hoạ nảy nhẹ — một vòng lặp, nhẹ để không tranh chú ý với chữ. */
function Art({ icon }: { icon: IconName }) {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [y]);

  const bob = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <View
      style={{
        width: 112,
        height: 112,
        borderRadius: 56,
        backgroundColor: '#F3F0FB',
        borderWidth: 2,
        borderColor: '#B94A70',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View style={bob}>
        <Icon name={icon} size={52} color="#B94A70" strokeWidth={1.8} />
      </Animated.View>
    </View>
  );
}
