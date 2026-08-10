import React from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { AssetImage, Card, Icon } from '@/components/ui';
import { MORE_ITEMS } from '@/navigation/nav-items';
import { assetKeys, useAssetUrl } from '@/services/assets/useAssets';
import { color } from '@/theme/tokens';
import type { IconName } from '@/components/ui/Icon';

/** Tab "More" trên mobile: chứa các mục sidebar không nằm trong 5 tab chính. */
export default function MoreScreen() {
  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">More</Text>

      <Card className="mt-4" padded={false}>
        {MORE_ITEMS.map((item, index) => (
          <Link key={item.key} href={item.href as never} asChild>
            <View
              accessibilityRole="link"
              className={[
                'flex-row items-center gap-3 px-4 py-4',
                index > 0 ? 'border-t border-border' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <NavIcon navKey={item.key} fallback={item.icon} />
              <Text className="flex-1 font-semi text-body text-ink">{item.label}</Text>
              <Icon name="chevron-right" size={16} color={color.subtle} />
            </View>
          </Link>
        ))}
      </Card>
    </Screen>
  );
}

/**
 * Icon điều hướng sinh bằng AI hiển thị ở cỡ 28px (đủ lớn để nét vẽ rõ).
 * Thanh sidebar và bottom tab vẫn dùng icon vector 20px cho sắc nét.
 */
function NavIcon({ navKey, fallback }: { navKey: string; fallback: IconName }) {
  const url = useAssetUrl(assetKeys.navIcon(navKey));

  if (!url) return <Icon name={fallback} size={20} color={color.muted} />;

  return (
    <AssetImage
      assetKey={assetKeys.navIcon(navKey)}
      width={28}
      height={28}
      contentFit="contain"
      radius={0}
    />
  );
}
