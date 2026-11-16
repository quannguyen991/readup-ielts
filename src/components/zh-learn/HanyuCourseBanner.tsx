import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HANYU_LESSON_TOTAL, HANYU_VOLUMES } from '@/data/zh-learn';
import { ZH } from '@/components/vocab/chinese/palette';

/** Shared entry into the publisher-sourced Hanyu Jiaocheng catalogue. */
export function HanyuCourseBanner() {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push('/hanyu-jiaocheng' as never)}
      style={{
        marginBottom: 14,
        padding: 16,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: ZH.gold,
        backgroundColor: ZH.card,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: ZH.seal }}>Giáo trình Hán ngữ · 第3版</Text>
          <Text style={{ marginTop: 4, fontSize: 13, color: ZH.ink2 }}>
            Danh mục NXB: {HANYU_VOLUMES.length} tập · {HANYU_LESSON_TOTAL} bài. Mục lục từ vựng gốc đang chờ tài liệu nguồn.
          </Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: ZH.seal }}>›</Text>
      </View>
    </Pressable>
  );
}
