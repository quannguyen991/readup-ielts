import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { IeltsFocusPicker } from '@/components/practice/IeltsFocusPicker';
import { Grid } from '@/components/layout/Grid';
import { NEON_PALETTES, NeonTile } from '@/components/neon/NeonTile';
import { ARTICLES, isReadable } from '@/data/articles';
import { WRITING_PROMPTS } from '@/data/writing-repository';
import { useL } from '@/i18n/useL';

/**
 * Trang chủ IELTS: chỉ là nơi tổng hợp các tính năng. Bài đọc và đề Writing mở ở tác vụ
 * riêng (`/reading-library`), không xếp lẫn trong trang chủ.
 */
export default function PracticeScreen() {
  const { L } = useL();
  const readable = ARTICLES.filter(isReadable).length;

  return (
    <Screen>
      <View className="mb-5">
        <IeltsFocusPicker />
      </View>

      <Grid columns={2} tabletColumns={2} mobileColumns={1} gap={14}>
        <Appear index={1}>
          <NeonTile
            title={L('Kiểm tra đầu vào', 'Placement test')}
            sub={L('Reading · 40 câu · 60 phút', 'Reading · 40 questions · 60 min')}
            chip="TEST"
            index="40"
            icon="gem"
            palette={NEON_PALETTES.berry!}
            minHeight={190}
            onPress={() => router.push('/ielts/placement' as never)}
          />
        </Appear>
        <Appear index={2}>
          <NeonTile
            title={L('Bài đọc & Writing', 'Reading & Writing')}
            sub={L(`${readable} bài đọc · ${WRITING_PROMPTS.length} đề viết`, `${readable} texts · ${WRITING_PROMPTS.length} prompts`)}
            chip="LIB"
            index={String(readable > 99 ? 99 : readable)}
            icon="book"
            palette={NEON_PALETTES.ocean!}
            minHeight={190}
            onPress={() => router.push('/reading-library' as never)}
          />
        </Appear>
      </Grid>
    </Screen>
  );
}
