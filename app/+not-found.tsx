import React from 'react';
import { Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { GlowStars } from '@/components/ui/GlowStars';
import { Button } from '@/components/ui';
import { Label, Sticker } from '@/components/illust/Sticker';
import { CuteGlobe } from '@/components/illust/Cute';
import { CuteMagnifier, Motion } from '@/components/illust/CuteMore';
import { useL } from '@/i18n/useL';

/**
 * TRANG KHÔNG TỒN TẠI. Trước đây gõ sai đường dẫn là rơi vào màn mặc định của
 * expo-router ("Unmatched Route", chữ tiếng Anh trên nền trắng) — trông như app
 * hỏng. Ở đây nói rõ bằng tiếng Việt, hiện lại đường dẫn vừa gõ, và đưa ba lối
 * về chỗ người học hay cần nhất.
 */
export default function NotFound() {
  const pathname = usePathname();
  const { L } = useL();
  return (
    <Screen>
      <Appear>
        <View className="items-center px-4 py-16">
          <View aria-hidden style={{ alignItems: 'center' }}>
            <View style={{ marginBottom: -4, zIndex: 2 }}>
              <Motion kind="pop">
                <Label text={L('Lạc đường rồi 🧭', 'Lost your way? 🧭')} color="#F2B632" ink="#2B2350" tilt={-5} size={14} />
              </Motion>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              <Motion kind="float" delay={0.4}>
                <Sticker tilt={-10}>
                  <CuteGlobe size={58} />
                </Sticker>
              </Motion>
              <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
                <GlowStars scale={1.6} />
              </View>
              <Motion kind="wobble" delay={0.2}>
                <Sticker tilt={10}>
                  <CuteMagnifier size={58} />
                </Sticker>
              </Motion>
            </View>
          </View>
          <Text className="mt-4 text-center font-heavy text-pageTitle text-ink">{L('Không tìm thấy trang này', "We can't find this page")}</Text>
          <Text className="mt-2 max-w-[520px] text-center font-sans text-bodyLg text-muted">
            {L('Đường dẫn ', 'The link ')}<Text className="font-strong text-ink">{pathname}</Text>{L(' không có trong Band 9 — có thể gõ nhầm, hoặc trang đã đổi chỗ.', " doesn't exist in Band 9 — it may be a typo, or the page has moved.")}
          </Text>
          <View className="mt-7 flex-row flex-wrap justify-center gap-2">
            <Button label={L('Về trang chủ', 'Go home')} iconRight="arrow-right" onPress={() => router.replace('/' as never)} />
            <Button label={L('Hôm nay học gì', "Today's study")} variant="outline" onPress={() => router.replace('/dashboard' as never)} />
            <Button label={L('Thư viện bài đọc', 'Reading library')} variant="outline" onPress={() => router.replace('/library' as never)} />
          </View>
        </View>
      </Appear>
    </Screen>
  );
}
