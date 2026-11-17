import React from 'react';
import { Linking, Pressable, Text, View, type ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { Grid } from '@/components/layout/Grid';
import { HANZI_FAMILY, ZH } from '@/components/vocab/chinese/palette';
import { useChineseFonts } from '@/components/vocab/chinese/useChineseFonts';
import { HANYU_LESSON_TOTAL, HANYU_VOLUMES, type HanyuVolume } from '@/data/zh-learn/hanyu-course';

const COVER_ART: Record<string, ImageSourcePropType> = {
  '1-shang': require('../../../assets/chinese/hanyu-covers/hanyu-vol-1-shang.webp'),
  '1-xia': require('../../../assets/chinese/hanyu-covers/hanyu-vol-1-xia.webp'),
  '2-shang': require('../../../assets/chinese/hanyu-covers/hanyu-vol-2-shang.webp'),
  '2-xia': require('../../../assets/chinese/hanyu-covers/hanyu-vol-2-xia.webp'),
  '3-shang': require('../../../assets/chinese/hanyu-covers/hanyu-vol-3-shang.webp'),
  '3-xia': require('../../../assets/chinese/hanyu-covers/hanyu-vol-3-xia.webp'),
};

const CHINESE_ORDINALS = ['', '第一', '第二', '第三'];

function volumeNumber(volume: HanyuVolume) {
  return Number(volume.id.match(/^(\d)/)?.[1] ?? 1);
}

function volumePart(volume: HanyuVolume) {
  return volume.id.endsWith('shang') ? '上册' : '下册';
}

export function HanyuCurrentEditionGallery() {
  useChineseFonts();

  return (
    <View style={{ marginTop: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 12, letterSpacing: 1.2, fontWeight: '800', color: ZH.seal }}>BỘ SÁCH · 第3版</Text>
          <Text style={{ marginTop: 3, fontSize: 21, lineHeight: 27, fontWeight: '800', color: ZH.ink }}>Chọn tập để bắt đầu</Text>
        </View>
        <View style={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: ZH.line, backgroundColor: ZH.card }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: ZH.seal }}>6 tập · {HANYU_LESSON_TOTAL} bài</Text>
        </View>
      </View>

      <Grid columns={3} tabletColumns={2} mobileColumns={2} gap={14}>
        {HANYU_VOLUMES.map((volume) => {
          const number = volumeNumber(volume);
          const image = COVER_ART[volume.id];
          return (
            <View
              key={volume.id}
              style={{ overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: ZH.line, backgroundColor: ZH.card }}
            >
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Mở thông tin ${volume.titleVi} tại BLCUP`}
                onPress={() => void Linking.openURL(volume.publisherUrl)}
                style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
              >
                <View style={{ width: '100%', aspectRatio: 0.8, overflow: 'hidden', backgroundColor: ZH.cream2 }}>
                  {image ? <Image source={image} contentFit="cover" transition={180} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} /> : null}
                  <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(255,251,243,0.92)', 'rgba(255,251,243,0.42)', 'rgba(255,251,243,0)']}
                    locations={[0, 0.56, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%' }}
                  />
                  <View pointerEvents="none" style={{ position: 'absolute', top: 13, left: 13, right: 13 }}>
                    <Text numberOfLines={1} style={{ fontSize: 9, letterSpacing: 1.15, fontWeight: '800', color: ZH.seal }}>READUP · 中文课程</Text>
                    <Text style={{ marginTop: 3, fontFamily: HANZI_FAMILY, fontSize: 25, lineHeight: 31, fontWeight: '700', color: ZH.ink }}>
                      {CHINESE_ORDINALS[number]}册
                    </Text>
                    <Text style={{ marginTop: 1, fontSize: 10, letterSpacing: 0.8, fontWeight: '700', color: ZH.ink2 }}>汉语教程 · 第3版</Text>
                  </View>
                  <View pointerEvents="none" style={{ position: 'absolute', left: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: ZH.seal }}>
                      <Text style={{ fontFamily: HANZI_FAMILY, fontSize: 12, fontWeight: '700', color: '#FFFBF3' }}>{volumePart(volume)}</Text>
                    </View>
                    <View style={{ paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,251,243,0.9)' }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: ZH.ink }}>{volume.lessonCount} BÀI</Text>
                    </View>
                  </View>
                </View>
              </Pressable>

              <View style={{ paddingHorizontal: 13, paddingTop: 12, paddingBottom: 13, gap: 5 }}>
                <Text numberOfLines={1} style={{ fontSize: 14, lineHeight: 19, fontWeight: '800', color: ZH.ink }}>{volume.titleVi}</Text>
                <Text numberOfLines={2} style={{ minHeight: 34, fontSize: 11, lineHeight: 16, color: ZH.ink2 }}>{volume.focus}</Text>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => void Linking.openURL(volume.publisherUrl)}
                  style={({ pressed }) => ({ marginTop: 4, minHeight: 38, paddingHorizontal: 12, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? ZH.seal2 : ZH.seal })}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFBF3' }}>Mở tập tại BLCUP ↗</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </Grid>
    </View>
  );
}
