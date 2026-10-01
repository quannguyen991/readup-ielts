import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { TravelHud } from './Hud';
import { PAGE_MAX, T } from './kit';

/** Khung trang của game du ngoạn (không phải màn làm bài): tiêu đề, đường về, vé + xu. */
export function TravelPage({
  title,
  back,
  backLabel,
  children,
  hud = true,
}: {
  title: string;
  back?: string;
  backLabel?: string;
  children: React.ReactNode;
  hud?: boolean;
}) {
  const { L } = useL();
  return (
    <Screen>
      <View style={{ width: '100%', maxWidth: PAGE_MAX, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          {back ? (
            <Link href={back as never} asChild>
              <Pressable accessibilityRole="link" accessibilityLabel={backLabel ?? L('Quay lại', 'Back')} style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4, paddingHorizontal: 10, borderRadius: 6, backgroundColor: T.paper, borderWidth: 2, borderColor: T.navy }}>
                <View style={{ transform: [{ rotate: '180deg' }] }}>
                  <Icon name="arrow-right" size={18} color={T.navy} strokeWidth={2.2} />
                </View>
                <Text className="font-strong" style={{ fontSize: 14, color: T.navy }}>
                  {backLabel ?? L('Quay lại', 'Back')}
                </Text>
              </Pressable>
            </Link>
          ) : null}
          <View style={{ flex: 1, minWidth: 160, flexDirection: 'row' }}>
            <View style={{ backgroundColor: T.paper, borderWidth: 2, borderColor: T.navy, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 }}>
              <Text className="font-heavy" style={{ fontSize: 24, color: T.ink }} accessibilityRole="header">
                {title}
              </Text>
            </View>
          </View>
          {hud ? <TravelHud /> : null}
        </View>
        {children}
      </View>
    </Screen>
  );
}
